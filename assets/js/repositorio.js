// repositorio.js — renderiza a galeria a partir de data/repositorio.json

async function carregarRepositorio() {
  const container = document.getElementById("repositorio-grid");
  if (!container) return;

  try {
    const categorias = await fetch("data/repositorio.json").then(r => r.json());

    container.innerHTML = categorias.map(cat => `
      <section class="repositorio-categoria">
        <h2 class="categoria-titulo">${cat.categoria}</h2>
        <div class="repositorio-cards">
          ${cat.itens.map(item => {
            const isImagem = item.tipo === "imagem";
            return `
              <a class="repo-card" href="${item.arquivo}" target="_blank" download>
                <div class="repo-preview ${isImagem ? "repo-preview-img" : "repo-preview-doc"}">
                  ${isImagem 
                    ? `<img src="${item.arquivo}" alt="${item.nome}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span>🖼️</span>'" />` 
                    : `<span>📄</span>`
                  }
                </div>
                <div class="repo-info">
                  <span class="repo-nome">${item.nome}</span>
                  <span class="repo-tipo">${item.tipo}</span>
                </div>
              </a>
            `;
          }).join("")}
        </div>
      </section>
    `).join("");
  } catch (err) {
    container.innerHTML = `<p class="vazio">Erro ao carregar o repositório: ${err.message}</p>`;
  }
}

carregarRepositorio();
