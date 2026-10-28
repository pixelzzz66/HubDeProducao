// image-tools.js — ferramenta de recorte com Cropper.js

let cropper = null;
let imagemUrl = null;
let nomeBase = "recorte";

const input       = document.getElementById("imagem-input");
const nomeArquivo = document.getElementById("arquivo-nome");
const area        = document.getElementById("cropper-area");
const preview     = document.getElementById("imagem-preview");
const resultado   = document.getElementById("resultado");
const canvas      = document.getElementById("canvas-resultado");

// ── 1. Usuário escolhe um arquivo ─────────────────────────────
input.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Limpa estado anterior
  if (cropper)   { cropper.destroy(); cropper = null; }
  if (imagemUrl) { URL.revokeObjectURL(imagemUrl); }

  imagemUrl = URL.createObjectURL(file);
  nomeBase  = file.name.replace(/\.[^.]+$/, ""); // remove a extensão
  nomeArquivo.textContent = file.name;

  resultado.hidden = true;
  area.hidden = false;

  // Criar o Cropper DEPOIS que a imagem carregou
  preview.onload = () => {
    cropper = new Cropper(preview, {
      viewMode: 1,        // não deixa a área de corte sair da imagem
      background: false,  // sem fundo xadrez atrás
      autoCropArea: 0.8,  // começa com 80% da imagem selecionada
      aspectRatio: 1,     // começa em 1:1
    });
    marcarAtivo("1");
  };
  preview.src = imagemUrl;
});

// ── 2. Botões de proporção ────────────────────────────────────
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

// ── 3. Recortar ───────────────────────────────────────────────
document.getElementById("btn-recortar").addEventListener("click", () => {
  if (!cropper) return;
  const c = cropper.getCroppedCanvas({ maxWidth: 4000, maxHeight: 4000 });
  canvas.width  = c.width;
  canvas.height = c.height;
  canvas.getContext("2d").drawImage(c, 0, 0);
  resultado.hidden = false;
  resultado.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ── 4. Baixar ─────────────────────────────────────────────────
document.getElementById("btn-baixar").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nomeBase}-recortado.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
});

// ── 5. Recomeçar ──────────────────────────────────────────────
document.getElementById("btn-resetar").addEventListener("click", () => {
  input.value = "";
  nomeArquivo.textContent = "";
  area.hidden = true;
  resultado.hidden = true;
  if (cropper)   { cropper.destroy(); cropper = null; }
  if (imagemUrl) { URL.revokeObjectURL(imagemUrl); imagemUrl = null; }
});
