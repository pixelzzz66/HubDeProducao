// fca.js — carrega disciplinas.json, filtra por curso e busca

let dados = null;
let cursoAtual = null;
let desbloqueiaMap = {};

const selectCurso = document.getElementById("fca-curso");
const inputBusca  = document.getElementById("fca-busca");
const lista       = document.getElementById("fca-lista");

async function iniciar() {
  const res = await fetch("data/disciplinas.json");
  dados = await res.json();

  // Popular seletor de cursos
  dados.cursos.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.codigo;
    opt.textContent = `${c.nome} (${c.codigo})`;
    selectCurso.appendChild(opt);
  });

  cursoAtual = dados.cursos[0];
  processarDadosCurso();
  renderizar();
}

selectCurso.addEventListener("change", () => {
  cursoAtual = dados.cursos.find((c) => c.codigo === selectCurso.value);
  processarDadosCurso();
  renderizar();
});

inputBusca.addEventListener("input", renderizar);

// Calcula o "Desbloqueia" (inverso do pré-requisito)
function processarDadosCurso() {
  desbloqueiaMap = {};
  
  cursoAtual.disciplinas.forEach((d) => {
    // Inicia o array se ainda não existir
    if (!desbloqueiaMap[d.codigo]) desbloqueiaMap[d.codigo] = [];

    // Para cada pré-requisito dessa disciplina, adiciona ela como "desbloqueada"
    d.pre_requisitos.forEach((pre) => {
      if (!desbloqueiaMap[pre]) desbloqueiaMap[pre] = [];
      desbloqueiaMap[pre].push(d.codigo);
    });
  });
}

function renderizar() {
  if (!cursoAtual) return;

  const termo = inputBusca.value.trim().toLowerCase();
  
  // Se houver busca, filtra. Se não, mostra todas.
  const disciplinas = cursoAtual.disciplinas.filter((d) => {
    if (!termo) return true;
    return (
      d.codigo.toLowerCase().includes(termo) ||
      d.nome.toLowerCase().includes(termo)
    );
  });

  if (disciplinas.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhuma disciplina encontrada.</p>';
    return;
  }

  // Agrupar por semestre
  const porSemestre = {};
  disciplinas.forEach((d) => {
    const sem = d.semestre || 0;
    if (!porSemestre[sem]) porSemestre[sem] = [];
    porSemestre[sem].push(d);
  });

  const semestres = Object.keys(porSemestre).map(Number).sort((a, b) => a - b);

  lista.innerHTML = semestres.map((sem) => {
    const itens = porSemestre[sem];
    return `
      <section class="fca-semestre">
        <h2 class="fca-semestre-titulo">${sem}º semestre</h2>
        <div class="fca-disciplinas">
          ${itens.map((d) => renderDisciplina(d)).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderDisciplina(d) {
  const pre = d.pre_requisitos && d.pre_requisitos.length
    ? d.pre_requisitos.join(", ")
    : "—";
    
  const desbloqueia = desbloqueiaMap[d.codigo] && desbloqueiaMap[d.codigo].length
    ? desbloqueiaMap[d.codigo].join(", ")
    : "—";

  return `
    <div class="fca-card">
      <div class="fca-card-header">
        <span class="fca-codigo">${d.codigo}</span>
        <span class="fca-creditos">${d.creditos} créditos</span>
      </div>
      <div class="fca-nome">${d.nome}</div>
      
      <div class="fca-pre">
        <span class="fca-pre-label">Pré-requisitos:</span>
        <span class="fca-pre-valor">${pre}</span>
      </div>
      
      <div class="fca-pre">
        <span class="fca-pre-label">Desbloqueia:</span>
        <span class="fca-pre-valor">${desbloqueia}</span>
      </div>
    </div>
  `;
}

iniciar();
