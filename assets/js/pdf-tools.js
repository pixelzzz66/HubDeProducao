// pdf-tools.js — juntar, extrair páginas, PDF→imagem, imagem→PDF

// Configurar worker do pdf.js (necessário para renderizar PDFs)
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
}

// ═══════════════════════════════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

function tamanhoLegivel(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1024 / 1024).toFixed(2) + " MB";
}

// Aceita "1-3, 5, 7-9" e devolve índices zero-based, em ordem
function parseRange(str, total) {
  const indices = new Set();
  str.split(",").forEach((parte) => {
    const p = parte.trim();
    if (!p) return;
    if (p.includes("-")) {
      const [a, b] = p.split("-").map((n) => parseInt(n.trim(), 10));
      if (isNaN(a) || isNaN(b)) return;
      for (let i = Math.max(a, 1); i <= Math.min(b, total); i++) {
        indices.add(i - 1);
      }
    } else {
      const n = parseInt(p, 10);
      if (!isNaN(n) && n >= 1 && n <= total) indices.add(n - 1);
    }
  });
  return Array.from(indices).sort((a, b) => a - b);
}

// Desabilita/restaura um botão durante operações assíncronas
async function comBotao(btn, texto, fn) {
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = texto;
  try {
    await fn();
  } catch (err) {
    alert("Erro: " + (err && err.message ? err.message : err));
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  JUNTAR PDFs
// ═══════════════════════════════════════════════════════════════

let mergeArquivos = [];

function renderMergeLista() {
  const lista = document.getElementById("merge-lista");
  const btn = document.getElementById("merge-executar");

  if (mergeArquivos.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhum PDF adicionado.</p>';
    btn.disabled = true;
    return;
  }

  lista.innerHTML = mergeArquivos
    .map(
      (f, i) => `
    <div class="arquivo-item">
      <span class="arquivo-indice">${i + 1}</span>
      <span class="arquivo-nome-item">${f.name}</span>
      <span class="arquivo-tamanho">${tamanhoLegivel(f.size)}</span>
      <div class="arquivo-acoes">
        <button type="button" class="btn-mini" data-action="subir"  data-idx="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="btn-mini" data-action="descer" data-idx="${i}" ${i === mergeArquivos.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="btn-mini btn-remover" data-action="remover" data-idx="${i}">✕</button>
      </div>
    </div>`
    )
    .join("");

  btn.disabled = mergeArquivos.length < 2;
}

document.getElementById("merge-lista").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx, 10);
  const action = btn.dataset.action;

  if (action === "subir" && idx > 0) {
    [mergeArquivos[idx - 1], mergeArquivos[idx]] = [mergeArquivos[idx], mergeArquivos[idx - 1]];
  } else if (action === "descer" && idx < mergeArquivos.length - 1) {
    [mergeArquivos[idx], mergeArquivos[idx + 1]] = [mergeArquivos[idx + 1], mergeArquivos[idx]];
  } else if (action === "remover") {
    mergeArquivos.splice(idx, 1);
  }
  renderMergeLista();
});

document.getElementById("merge-input").addEventListener("change", (e) => {
  for (const f of e.target.files) {
    if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
      mergeArquivos.push(f);
    }
  }
  e.target.value = "";
  renderMergeLista();
});

document.getElementById("merge-limpar").addEventListener("click", () => {
  mergeArquivos = [];
  renderMergeLista();
});

document.getElementById("merge-executar").addEventListener("click", async () => {
  const btn = document.getElementById("merge-executar");
  await comBotao(btn, "Processando...", async () => {
    const { PDFDocument } = PDFLib;
    const merged = await PDFDocument.create();
    for (const file of mergeArquivos) {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    const out = await merged.save();
    baixarBlob(new Blob([out], { type: "application/pdf" }), "juntado.pdf");
  });
});

renderMergeLista();

// ═══════════════════════════════════════════════════════════════
//  EXTRAIR PÁGINAS
// ═══════════════════════════════════════════════════════════════

let splitArquivo = null;

document.getElementById("split-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  splitArquivo = file;
  document.getElementById("split-nome").textContent = file.name;

  try {
    const bytes = await file.arrayBuffer();
    const doc = await PDFLib.PDFDocument.load(bytes);
    const total = doc.getPageCount();
    document.getElementById("split-total").textContent = `${total} página${total !== 1 ? "s" : ""}`;
    document.getElementById("split-paginas").placeholder = total > 1 ? `Ex: 1-${Math.min(3, total)}, ${total}` : "1";
    document.getElementById("split-controles").hidden = false;
  } catch (err) {
    alert("Não foi possível ler o PDF: " + err.message);
    splitArquivo = null;
  }
});

document.getElementById("split-executar").addEventListener("click", async () => {
  if (!splitArquivo) return;
  const rangeStr = document.getElementById("split-paginas").value.trim();
  if (!rangeStr) {
    alert("Digite as páginas no formato 1-3, 5, 7-9.");
    return;
  }

  const btn = document.getElementById("split-executar");
  await comBotao(btn, "Processando...", async () => {
    const bytes = await splitArquivo.arrayBuffer();
    const src = await PDFLib.PDFDocument.load(bytes);
    const total = src.getPageCount();
    const indices = parseRange(rangeStr, total);

    if (indices.length === 0) {
      alert("Nenhuma página válida na faixa digitada.");
      return;
    }

    const out = await PDFLib.PDFDocument.create();
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));
    const outBytes = await out.save();
    const nome = splitArquivo.name.replace(/\.pdf$/i, "") + "-extraido.pdf";
    baixarBlob(new Blob([outBytes], { type: "application/pdf" }), nome);
  });
});

// ═══════════════════════════════════════════════════════════════
//  PDF → IMAGENS
// ═══════════════════════════════════════════════════════════════

let pdf2imgArquivo = null;

document.getElementById("pdf2img-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  pdf2imgArquivo = file;
  document.getElementById("pdf2img-nome").textContent = file.name;
  document.getElementById("pdf2img-controles").hidden = false;
  document.getElementById("pdf2img-resultado").hidden = true;
  document.getElementById("pdf2img-resultado").innerHTML = "";
});

document.getElementById("pdf2img-executar").addEventListener("click", async () => {
  if (!pdf2imgArquivo) return;

  const btn = document.getElementById("pdf2img-executar");
  const grid = document.getElementById("pdf2img-resultado");
  const formato = document.getElementById("pdf2img-formato").value;
  const escala = parseFloat(document.getElementById("pdf2img-escala").value) || 2;
  const ext = formato === "image/jpeg" ? "jpg" : "png";

  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Convertendo...";
  grid.innerHTML = "";
  grid.hidden = false;

  try {
    const arrayBuffer = await pdf2imgArquivo.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: escala });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");

      if (formato === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise((r) => canvas.toBlob(r, formato, 0.92));
      const url = URL.createObjectURL(blob);

      const item = document.createElement("div");
      item.className = "pagina-item";
      item.innerHTML = `
        <img src="${url}" alt="Página ${i}" />
        <div class="pagina-rodape">
          <span>Página ${i}</span>
          <button type="button" class="btn-mini" data-download>Baixar</button>
        </div>
      `;
      item.querySelector("[data-download]").addEventListener("click", () => {
        baixarBlob(blob, `pagina-${i}.${ext}`);
      });
      grid.appendChild(item);
    }
  } catch (err) {
    alert("Erro ao converter: " + err.message);
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
});

// ═══════════════════════════════════════════════════════════════
//  IMAGENS → PDF
// ═══════════════════════════════════════════════════════════════

let imgArquivos = [];

function renderImgLista() {
  const lista = document.getElementById("img2pdf-lista");
  const btn = document.getElementById("img2pdf-executar");

  if (imgArquivos.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhuma imagem adicionada.</p>';
    btn.disabled = true;
    return;
  }

  lista.innerHTML = imgArquivos
    .map(
      (f, i) => `
    <div class="arquivo-item">
      <span class="arquivo-indice">${i + 1}</span>
      <span class="arquivo-nome-item">${f.name}</span>
      <span class="arquivo-tamanho">${tamanhoLegivel(f.size)}</span>
      <div class="arquivo-acoes">
        <button type="button" class="btn-mini" data-action="subir"  data-idx="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="btn-mini" data-action="descer" data-idx="${i}" ${i === imgArquivos.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="btn-mini btn-remover" data-action="remover" data-idx="${i}">✕</button>
      </div>
    </div>`
    )
    .join("");

  btn.disabled = imgArquivos.length < 1;
}

document.getElementById("img2pdf-lista").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const idx = parseInt(btn.dataset.idx, 10);
  const action = btn.dataset.action;

  if (action === "subir" && idx > 0) {
    [imgArquivos[idx - 1], imgArquivos[idx]] = [imgArquivos[idx], imgArquivos[idx - 1]];
  } else if (action === "descer" && idx < imgArquivos.length - 1) {
    [imgArquivos[idx], imgArquivos[idx + 1]] = [imgArquivos[idx + 1], imgArquivos[idx]];
  } else if (action === "remover") {
    imgArquivos.splice(idx, 1);
  }
  renderImgLista();
});

document.getElementById("img2pdf-input").addEventListener("change", (e) => {
  for (const f of e.target.files) {
    if (f.type.startsWith("image/")) imgArquivos.push(f);
  }
  e.target.value = "";
  renderImgLista();
});

document.getElementById("img2pdf-limpar").addEventListener("click", () => {
  imgArquivos = [];
  renderImgLista();
});

document.getElementById("img2pdf-executar").addEventListener("click", async () => {
  const btn = document.getElementById("img2pdf-executar");
  await comBotao(btn, "Processando...", async () => {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.create();

    for (const file of imgArquivos) {
      const bytes = await file.arrayBuffer();
      let img;

      if (file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name)) {
        img = await doc.embedJpg(bytes);
      } else if (file.type === "image/png" || /\.png$/i.test(file.name)) {
        img = await doc.embedPng(bytes);
      } else {
        // Outros formatos (webp, gif, bmp…) → canvas → PNG
        const blob = new Blob([bytes], { type: file.type || "image/png" });
        const url = URL.createObjectURL(blob);
        const im = new Image();
        await new Promise((res, rej) => {
          im.onload = res;
          im.onerror = () => rej(new Error("Não consegui carregar " + file.name));
          im.src = url;
        });
        const c = document.createElement("canvas");
        c.width = im.naturalWidth;
        c.height = im.naturalHeight;
        c.getContext("2d").drawImage(im, 0, 0);
        const pngBlob = await new Promise((r) => c.toBlob(r, "image/png"));
        img = await doc.embedPng(await pngBlob.arrayBuffer());
        URL.revokeObjectURL(url);
      }

      const page = doc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }

    const out = await doc.save();
    baixarBlob(new Blob([out], { type: "application/pdf" }), "imagens.pdf");
  });
});

renderImgLista();
