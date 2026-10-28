// app.js — monta o cabeçalho, rodapé e ícone da aba em TODAS as páginas.

const NAV = [
  { label: "Início",      href: "index.html" },
  { label: "Links",       href: "links.html" },
  { label: "Imagens",     href: "imagens.html" },
  { label: "PDF",         href: "pdf.html" },
  { label: "Textos",      href: "textos.html" },
  { label: "FCA",         href: "fca.html" },
  { label: "Repositório", href: "repositorio.html" },
  { label: "Sobre",       href: "sobre.html" }
];

async function iniciar() {
  const config = await fetch("data/config.json").then(r => r.json());
  document.title = config.nome;
  adicionarFavicon();
  montarHeader(config);
  montarFooter(config);
}

function adicionarFavicon() {
  // Evita duplicar se por acaso já existir no HTML
  if (document.querySelector("link[rel='icon']")) return;
  
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = "assets/img/favicon.svg";
  document.head.appendChild(link);
}

function montarHeader(config) {
  const header = document.getElementById("app-header");
  if (!header) return;
  const links = NAV.map(item => `<a href="${item.href}">${item.label}</a>`).join("");
  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html">${config.nome}</a>
      <nav class="menu">${links}</nav>
    </div>
  `;
}

function montarFooter(config) {
  const footer = document.getElementById("app-footer");
  if (!footer) return;
  footer.innerHTML = `
    <p>${config.autor} — ${config.ano}</p>
    <p class="muted">${config.subtitulo}</p>
  `;
}

iniciar();
