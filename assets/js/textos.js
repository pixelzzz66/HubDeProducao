// textos.js — editor ABNT, exportação PDF/DOCX e referências

const editor = document.getElementById("editor");

// ═══════════════════════════════════════════════════════════════
//  UTILITÁRIO: encontrar o parágrafo (div direto) sob o cursor
// ═══════════════════════════════════════════════════════════════

function paragrafoDoCursor() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return null;
  let node = sel.anchorNode;
  if (!node || !editor.contains(node)) return null;
  while (node && node.parentNode !== editor) {
    node = node.parentNode;
  }
  return node === editor ? null : node;
}

// ═══════════════════════════════════════════════════════════════
//  FORMATAÇÃO INLINE (negrito, itálico, limpar)
// ═══════════════════════════════════════════════════════════════

document.querySelectorAll(".btn-inline").forEach((btn) => {
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", () => {
    document.execCommand(btn.dataset.comando, false, null);
    editor.focus();
  });
});

document.getElementById("btn-limpar").addEventListener("mousedown", (e) => e.preventDefault());
document.getElementById("btn-limpar").addEventListener("click", () => {
  document.execCommand("removeFormat");
  const p = paragrafoDoCursor();
  if (p) p.classList.remove("titulo-secao", "citacao-longa", "referencia");
  editor.focus();
});

// ═══════════════════════════════════════════════════════════════
//  ESTILOS DE BLOCO
// ═══════════════════════════════════════════════════════════════

document.querySelectorAll(".btn-estilo").forEach((btn) => {
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", () => {
    const p = paragrafoDoCursor();
    if (!p) return;
    p.classList.remove("titulo-secao", "citacao-longa", "referencia");
    if (btn.dataset.estilo !== "paragrafo") {
      p.classList.add(btn.dataset.estilo);
    }
    editor.focus();
  });
});

// ═══════════════════════════════════════════════════════════════
//  EXPORTAR PDF (via print)
// ═══════════════════════════════════════════════════════════════

document.getElementById("btn-pdf").addEventListener("click", () => {
  window.print();
});

// ═══════════════════════════════════════════════════════════════
//  EXPORTAR DOCX (via docx em CDN)
// ═══════════════════════════════════════════════════════════════

document.getElementById("btn-docx").addEventListener("click", async () => {
  if (!window.docx) {
    alert("Biblioteca DOCX ainda carregando. Tente novamente em alguns segundos.");
    return;
  }
  await exportarDOCX();
});

async function exportarDOCX() {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, convertMillimetersToTwip,
  } = window.docx;

  const paragrafos = [];

  for (const child of editor.children) {
    const texto = child.textContent || "";
    if (!texto.trim()) continue;

    let config = null;

    if (child.classList.contains("titulo-secao")) {
      config = {
        alignment: AlignmentType.LEFT,
        spacing: { line: 360 },
        size: 24,
        bold: true,
        transform: (t) => t.toUpperCase(),
        firstLine: null,
        leftIndent: 0,
      };
    } else if (child.classList.contains("citacao-longa")) {
      config = {
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 240 },
        size: 20,
        bold: false,
        transform: null,
        firstLine: null,
        leftIndent: 40,
      };
    } else if (child.classList.contains("referencia")) {
      config = {
        alignment: AlignmentType.LEFT,
        spacing: { line: 240 },
        size: 24,
        bold: false,
        transform: null,
        firstLine: null,
        leftIndent: 0,
      };
    } else {
      config = {
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360 },
        size: 24,
        bold: false,
        transform: null,
        firstLine: 12.5,
        leftIndent: 0,
      };
    }

    const children = extrairTextRuns(child, {
      size: config.size,
      font: "Times New Roman",
      transform: config.transform,
    });

    paragrafos.push(new Paragraph({
      alignment: config.alignment,
      spacing: config.spacing,
      indent: {
        firstLine: config.firstLine ? convertMillimetersToTwip(config.firstLine) : undefined,
        left: config.leftIndent ? convertMillimetersToTwip(config.leftIndent) : undefined,
      },
      children,
    }));
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            width:  convertMillimetersToTwip(210),
            height: convertMillimetersToTwip(297),
          },
          margin: {
            top:    convertMillimetersToTwip(30),
            right:  convertMillimetersToTwip(20),
            bottom: convertMillimetersToTwip(20),
            left:   convertMillimetersToTwip(30),
          },
        },
      },
      children: paragrafos,
    }],
  });

  const blob = await Packer.toBlob(doc);
  baixarBlob(blob, "documento.docx");
}

// Constrói TextRuns preservando negrito/itálico inline
function extrairTextRuns(element, baseOptions) {
  const { TextRun } = window.docx;
  const runs = [];

  function walk(node, bold = false, italic = false) {
    if (node.nodeType === 3) {
      let text = node.textContent;
      if (!text) return;
      if (baseOptions.transform) text = baseOptions.transform(text);
      runs.push(new TextRun({
        text,
        bold,
        italics: italic,
        size: baseOptions.size,
        font: baseOptions.font,
      }));
    } else if (node.nodeType === 1) {
      if (node.tagName === "BR") {
        runs.push(new TextRun({ break: 1 }));
        return;
      }
      const isBold = node.tagName === "B" || node.tagName === "STRONG";
      const isItalic = node.tagName === "I" || node.tagName === "EM";
      for (const child of node.childNodes) {
        walk(child, bold || isBold, italic || isItalic);
      }
    }
  }

  for (const child of element.childNodes) {
    walk(child);
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text: "", size: baseOptions.size, font: baseOptions.font }));
  }

  return runs;
}

// ═══════════════════════════════════════════════════════════════
//  REFERÊNCIAS
// ═══════════════════════════════════════════════════════════════

const modal        = document.getElementById("modal-referencia");
const tipoSelect   = document.getElementById("ref-tipo");
const refCampos    = document.getElementById("ref-campos");
const refPreview   = document.getElementById("ref-preview");

const CAMPOS = {
  livro: [
    { id: "autor_sobrenome", label: "Sobrenome do autor" },
    { id: "autor_nome",      label: "Nome do autor" },
    { id: "titulo",          label: "Título" },
    { id: "subtitulo",       label: "Subtítulo (opcional)" },
    { id: "edicao",          label: "Edição (ex: 2)" },
    { id: "local",           label: "Local (cidade)" },
    { id: "editora",         label: "Editora" },
    { id: "ano",             label: "Ano" },
  ],
  artigo: [
    { id: "autor_sobrenome", label: "Sobrenome do autor" },
    { id: "autor_nome",      label: "Nome do autor" },
    { id: "titulo",          label: "Título do artigo" },
    { id: "revista",         label: "Nome da revista/periódico" },
    { id: "volume",          label: "Volume (ex: 5)" },
    { id: "numero",          label: "Número (ex: 2)" },
    { id: "paginas",         label: "Páginas (ex: 10-25)" },
    { id: "ano",             label: "Ano" },
  ],
  site: [
    { id: "autor_sobrenome", label: "Sobrenome do autor (opcional)" },
    { id: "autor_nome",      label: "Nome do autor (opcional)" },
    { id: "titulo",          label: "Título da página" },
    { id: "ano_publicacao",  label: "Ano de publicação (opcional)" },
    { id: "url",             label: "URL" },
    { id: "data_acesso",     label: "Data de acesso (ex: 15 jan. 2025)" },
  ],
  tcc: [
    { id: "autor_sobrenome", label: "Sobrenome do autor" },
    { id: "autor_nome",      label: "Nome do autor" },
    { id: "titulo",          label: "Título" },
    { id: "tipo",            label: "Tipo", options: ["Trabalho de Conclusão de Curso", "Dissertação de Mestrado", "Tese de Doutorado"] },
    { id: "curso",           label: "Curso (ex: Graduação em Engenharia de Produção)" },
    { id: "instituicao",     label: "Instituição" },
    { id: "local",           label: "Local (cidade)" },
    { id: "ano",             label: "Ano" },
  ],
};

function renderizarCampos() {
  const tipo = tipoSelect.value;
  refCampos.innerHTML = CAMPOS[tipo].map((c) => {
    if (c.options) {
      return `<label class="campo">${c.label}
        <select id="ref-${c.id}">
          ${c.options.map(o => `<option value="${o}">${o}</option>`).join("")}
        </select>
      </label>`;
    }
    return `<label class="campo">${c.label}
      <input type="text" id="ref-${c.id}" autocomplete="off" />
    </label>`;
  }).join("");
  refCampos.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", atualizarPreview);
    el.addEventListener("change", atualizarPreview);
  });
  atualizarPreview();
}

function pegarValores() {
  const tipo = tipoSelect.value;
  const valores = {};
  CAMPOS[tipo].forEach((c) => {
    const el = document.getElementById(`ref-${c.id}`);
    valores[c.id] = el ? el.value.trim() : "";
  });
  return valores;
}

function esc(s) {
  return (s || "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function formatar(tipo, d) {
  const sob = (d.autor_sobrenome || "").toUpperCase();
  const autor = sob ? `${sob}, ${d.autor_nome}` : d.autor_nome || "";

  if (tipo === "livro") {
    const ed = d.edicao ? ` ${d.edicao}. ed.` : "";
    const sub = d.subtitulo ? `: ${esc(d.subtitulo)}` : "";
    return `${esc(autor)}. <strong>${esc(d.titulo)}${sub}</strong>.${ed} ${esc(d.local)}: ${esc(d.editora)}, ${esc(d.ano)}.`;
  }
  if (tipo === "artigo") {
    const vol = d.volume ? `, v. ${esc(d.volume)}` : "";
    const num = d.numero ? `, n. ${esc(d.numero)}` : "";
    const pag = d.paginas ? `, p. ${esc(d.paginas)}` : "";
    return `${esc(autor)}. ${esc(d.titulo)}. <strong>${esc(d.revista)}</strong>${vol}${num}${pag}, ${esc(d.ano)}.`;
  }
  if (tipo === "site") {
    const pref = autor ? `${esc(autor)}. ` : "";
    const ano = d.ano_publicacao ? ` ${esc(d.ano_publicacao)}.` : "";
    return `${pref}${esc(d.titulo)}.${ano} Disponível em: ${esc(d.url)}. Acesso em: ${esc(d.data_acesso)}.`;
  }
  if (tipo === "tcc") {
    return `${esc(autor)}. <strong>${esc(d.titulo)}</strong>. ${esc(d.ano)}. ${esc(d.tipo)} (${esc(d.curso)}) – ${esc(d.instituicao)}, ${esc(d.local)}, ${esc(d.ano)}.`;
  }
  return "";
}

function atualizarPreview() {
  refPreview.innerHTML = formatar(tipoSelect.value, pegarValores());
}

// Abertura e fechamento do modal
document.getElementById("btn-referencia").addEventListener("click", () => {
  tipoSelect.value = "livro";
  renderizarCampos();
  modal.classList.add("aberto");
});

document.getElementById("ref-cancelar").addEventListener("click", () => {
  modal.classList.remove("aberto");
});

tipoSelect.addEventListener("change", renderizarCampos);

// Inserir referência no editor
document.getElementById("ref-inserir").addEventListener("click", () => {
  const html = formatar(tipoSelect.value, pegarValores());
  const div = document.createElement("div");
  div.className = "referencia";
  div.innerHTML = html;
  editor.appendChild(div);
  modal.classList.remove("aberto");
  editor.focus();
});

// ═══════════════════════════════════════════════════════════════
//  UTILITÁRIO
// ═══════════════════════════════════════════════════════════════

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
