// links.js — renderiza os atalhos a partir de data/links.json

async function carregarLinks() {
  const container = document.getElementById("links-grid");
  if (!container) return;

  const categorias = await fetch("data/links.json").then(r => r.json());

  container.innerHTML = categorias.map(cat => `
    <section class="categoria">
      <h2 class="categoria-titulo">${cat.categoria}</h2>
      <div class="cards">
        ${cat.itens.map(item => `
          <a class="card" href="${item.url}" target="_blank" rel="noopener">
            <span class="card-icone">${item.icone}</span>
            <span class="card-nome">${item.nome}</span>
            ${item.descricao ? `<span class="card-desc">${item.descricao}</span>` : ""}
          </a>
        `).join("")}
      </div>
    </section>
  `).join("");
}

carregarLinks();
