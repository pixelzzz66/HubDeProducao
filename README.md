# ⚙️ Hub de Produção

Central pessoal do estudante de **Engenharia de Produção — FCA/UNICAMP**.
Reúne atalhos, ferramentas rápidas (imagem, PDF, formatação ABNT) e consulta à grade curricular em um só lugar.

> 🔒 **Privacidade em primeiro lugar:** Todas as ferramentas de processamento (imagens, PDFs, textos) rodam **100% no seu navegador**. Nenhum arquivo é enviado para servidores externos.

---

## ✨ Funcionalidades

- **Dashboard:** Página inicial com acesso rápido a todos os módulos.
- **Links Rápidos:** Atalhos organizados por categoria (Google Workspace, Faculdade, Design, GDE, Drive da Veterana).
- **Imagens:** 
  - Recorte com proporções predefinidas (Cropper.js).
  - Redimensionamento com trava de proporção.
  - Conversão de formato (JPEG, PNG, WebP) com ajuste de qualidade.
  - Geração de código Base64.
  - Remoção de fundo com IA (roda localmente no navegador).
- **PDF:**
  - Junção de múltiplos arquivos com reordenação.
  - Extração de páginas específicas (ex: `1-3, 5, 7-9`).
  - Conversão de PDF para Imagens (PNG/JPEG).
  - Conversão de Imagens para PDF.
- **Textos (ABNT):**
  - Editor com formatação automática (margens, fonte Times New Roman 12, espaçamento 1,5).
  - Botões para Título, Citação Longa e Referência.
  - Gerador automático de referências ABNT (Livro, Artigo, Site, TCC).
  - Exportação para **PDF** (via impressão) e **DOCX** (via biblioteca `docx`).
- **FCA:**
  - Árvore de disciplinas dos cursos de Engenharia de Produção e Manufatura (catálogo 2026).
  - Busca por código ou nome da matéria.
  - Visualização de Pré-requisitos e do que cada disciplina "Desbloqueia".
- **Repositório:**
  - Galeria de logos, capas de relatório e templates prontos para download.

---

## 🚀 Como rodar localmente

Como o site utiliza `fetch` para carregar arquivos JSON e ES Modules, ele **não funciona abrindo o `index.html` com duplo clique** (`file://`). É preciso usar um servidor local.

**Opção 1: VS Code (Live Server)**
1. Instale a extensão **Live Server** no VS Code.
2. Clique com o botão direito no `index.html` e escolha **"Open with Live Server"**.

**Opção 2: Python**
No terminal, dentro da pasta do projeto, execute:
```bash
python3 -m http.server 8000
