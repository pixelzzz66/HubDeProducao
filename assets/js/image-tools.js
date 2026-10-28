// image-tools.js — recorte + redimensionamento + conversão + Base64

// ═══════════════════════════════════════════════════════════════
//  RECORTE (já existente)
// ═══════════════════════════════════════════════════════════════

let cropper = null;
let imagemUrl = null;
let nomeBase = "recorte";

const input       = document.getElementById("imagem-input");
const nomeArquivo = document.getElementById("arquivo-nome");
const area        = document.getElementById("cropper-area");
const preview     = document.getElementById("imagem-preview");
const resultado   = document.getElementById("resultado");
const canvas      = document.getElementById("canvas-resultado");

input.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (cropper)   { cropper.destroy(); cropper = null; }
  if (imagemUrl) { URL.revokeObjectURL(imagemUrl); }

  imagemUrl = URL.createObjectURL(file);
  nomeBase  = file.name.replace(/\.[^.]+$/, "");
  nomeArquivo.textContent = file.name;

  resultado.hidden = true;
  area.hidden = false;

  preview.onload = () => {
    cropper = new Cropper(preview, {
      viewMode: 1,
      background: false,
      autoCropArea: 0.8,
      aspectRatio: 1,
    });
    marcarAtivo("1");
  };
  preview.src = imagemUrl;
});

document.querySelectorAll(".btn-ratio").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!cropper) return;
    const valor = btn.dataset.ratio;
    cropper.setAspectRatio(valor === "NaN" ? NaN : parseFloat(valor));
    marcarAtivo(valor);
  });
});

function marcarAtivo(valor) {
  document.querySelectorAll(".btn-ratio").forEach((b) => {
    b.classList.toggle("ativo", b.dataset.ratio === valor);
  });
}

document.getElementById("btn-recortar").addEventListener("click", () => {
  if (!cropper) return;
  const c = cropper.getCroppedCanvas({ maxWidth: 4000, maxHeight: 4000 });
  canvas.width  = c.width;
  canvas.height = c.height;
  canvas.getContext("2d").drawImage(c, 0, 0);
  resultado.hidden = false;
  resultado.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("btn-baixar").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    baixarBlob(blob, `${nomeBase}-recortado.png`);
  }, "image/png");
});

document.getElementById("btn-resetar").addEventListener("click", () => {
  input.value = "";
  nomeArquivo.textContent = "";
  area.hidden = true;
  resultado.hidden = true;
  if (cropper)   { cropper.destroy(); cropper = null; }
  if (imagemUrl) { URL.revokeObjectURL(imagemUrl); imagemUrl = null; }
});

// ═══════════════════════════════════════════════════════════════
//  REDIMENSIONAR
// ═══════════════════════════════════════════════════════════════

const resizeInput    = document.getElementById("resize-input");
const resizeNome     = document.getElementById("resize-nome");
const resizeControles = document.getElementById("resize-controles");
const resizeLargura  = document.getElementById("resize-largura");
const resizeAltura   = document.getElementById("resize-altura");
const resizeProporcao = document.getElementById("resize-proporcao");
const resizeCanvas   = document.getElementById("resize-canvas");
const resizeResultado = document.getElementById("resize-resultado");

let resizeImgOriginal = null;
let resizeNomeBase = "imagem";

resizeInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  resizeNome.textContent = file.name;
  resizeNomeBase = file.name.replace(/\.[^.]+$/, "");

  const img = new Image();
  img.onload = () => {
    resizeImgOriginal = img;
    resizeLargura.value = img.naturalWidth;
    resizeAltura.value  = img.naturalHeight;
    resizeControles.hidden = false;
    resizeResultado.hidden = true;
  };
  img.src = URL.createObjectURL(file);
});

// Manter proporção ao digitar largura/altura
resizeLargura.addEventListener("input", () => {
  if (!resizeImgOriginal || !resizeProporcao.checked) return;
  const ratio = resizeImgOriginal.naturalHeight / resizeImgOriginal.naturalWidth;
  resizeAltura.value = Math.round(resizeLargura.value * ratio);
});

resizeAltura.addEventListener("input", () => {
  if (!resizeImgOriginal || !resizeProporcao.checked) return;
  const ratio = resizeImgOriginal.naturalWidth / resizeImgOriginal.naturalHeight;
  resizeLargura.value = Math.round(resizeAltura.value * ratio);
});

document.getElementById("resize-executar").addEventListener("click", () => {
  if (!resizeImgOriginal) return;
  const w = parseInt(resizeLargura.value, 10);
  const h = parseInt(resizeAltura.value, 10);
  if (!w || !h) return;

  resizeCanvas.width  = w;
  resizeCanvas.height = h;
  const ctx = resizeCanvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(resizeImgOriginal, 0, 0, w, h);

  resizeResultado.hidden = false;
  resizeResultado.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("resize-baixar").addEventListener("click", () => {
  resizeCanvas.toBlob((blob) => {
    baixarBlob(blob, `${resizeNomeBase}-redimensionada.png`);
  }, "image/png");
});

// ═══════════════════════════════════════════════════════════════
//  CONVERTER FORMATO / QUALIDADE
// ═══════════════════════════════════════════════════════════════

const convertInput    = document.getElementById("convert-input");
const convertNome     = document.getElementById("convert-nome");
const convertControles = document.getElementById("convert-controles");
const convertFormato  = document.getElementById("convert-formato");
const convertQualidade = document.getElementById("convert-qualidade");
const convertResultado = document.getElementById("convert-resultado");
const convertPreview  = document.getElementById("convert-preview");
const convertInfo     = document.getElementById("convert-info");

let convertImgOriginal = null;
let convertNomeBase = "imagem";
let convertBlobAtual = null;

convertInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  convertNome.textContent = file.name;
  convertNomeBase = file.name.replace(/\.[^.]+$/, "");

  const img = new Image();
  img.onload = () => {
    convertImgOriginal = img;
    convertControles.hidden = false;
    convertResultado.hidden = true;
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById("convert-executar").addEventListener("click", () => {
  if (!convertImgOriginal) return;

  const formato = convertFormato.value;
  const qualidade = parseFloat(convertQualidade.value) || 0.85;

  const c = document.createElement("canvas");
  c.width  = convertImgOriginal.naturalWidth;
  c.height = convertImgOriginal.naturalHeight;
  const ctx = c.getContext("2d");
  // JPEG não suporta transparência; fundo branco evita bordas pretas
  if (formato === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
  }
  ctx.drawImage(convertImgOriginal, 0, 0);

  c.toBlob((blob) => {
    convertBlobAtual = blob;
    const url = URL.createObjectURL(blob);
    convertPreview.src = url;
    convertInfo.textContent = `${formato.split("/")[1].toUpperCase()} · ${(blob.size / 1024).toFixed(1)} KB`;
    convertResultado.hidden = false;
    convertResultado.scrollIntoView({ behavior: "smooth", block: "start" });
  }, formato, formato === "image/png" ? undefined : qualidade);
});

document.getElementById("convert-baixar").addEventListener("click", () => {
  if (!convertBlobAtual) return;
  const ext = convertFormato.value === "image/jpeg" ? "jpg"
            : convertFormato.value === "image/webp" ? "webp"
            : "png";
  baixarBlob(convertBlobAtual, `${convertNomeBase}.${ext}`);
});

// ═══════════════════════════════════════════════════════════════
//  BASE64
// ═══════════════════════════════════════════════════════════════

const b64Input     = document.getElementById("b64-input");
const b64Nome      = document.getElementById("b64-nome");
const b64Controles = document.getElementById("b64-controles");
const b64Formato   = document.getElementById("b64-formato");
const b64Resultado = document.getElementById("b64-resultado");
const b64Texto     = document.getElementById("b64-texto");

let b64ImgOriginal = null;

b64Input.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  b64Nome.textContent = file.name;

  const img = new Image();
  img.onload = () => {
    b64ImgOriginal = img;
    b64Controles.hidden = false;
    b64Resultado.hidden = true;
  };
  img.src = URL.createObjectURL(file);
});

document.getElementById("b64-gerar").addEventListener("click", () => {
  if (!b64ImgOriginal) return;

  const c = document.createElement("canvas");
  c.width  = b64ImgOriginal.naturalWidth;
  c.height = b64ImgOriginal.naturalHeight;
  const ctx = c.getContext("2d");
  ctx.drawImage(b64ImgOriginal, 0, 0);

  const formato = b64Formato.value;
  const dataUrl = c.toDataURL(formato, 0.9);

  b64Texto.value = dataUrl;
  b64Resultado.hidden = false;
  b64Resultado.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("b64-copiar").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(b64Texto.value);
    const btn = document.getElementById("b64-copiar");
    const original = btn.textContent;
    btn.textContent = "Copiado!";
    setTimeout(() => { btn.textContent = original; }, 1500);
  } catch {
    b64Texto.select();
    document.execCommand("copy");
  }
});

// ═══════════════════════════════════════════════════════════════
//  UTILITÁRIO COMPARTILHADO
// ═══════════════════════════════════════════════════════════════

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
