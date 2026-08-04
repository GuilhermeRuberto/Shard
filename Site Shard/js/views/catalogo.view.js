export const produtosExemplo = [
    {
        id: "PRD_001",
        sku: "PROD_001",
        nome: "Suporte Headset Premium",
        categoria: "Acessórios",
        foto: "https://via.placeholder.com/300/1e1e24/ffffff?text=Suporte+Headset",
        arquivo: "https://drive.google.com/file/d/1suporte_headset",
        tempoImpressao: 252,
        pesoProd: 0.185,
        custoProd: 15.60,
        estoque: 14,
        insumos: [
            { nome: "Filamento PLA Preto", quantidade: "0.170 kg", custoUnitario: "R$ 0,08/g", custoTotal: "R$ 13,60" },
            { nome: "Parafuso M3 x 12mm", quantidade: "4 un", custoUnitario: "R$ 0,20/un", custoTotal: "R$ 0,80" },
            { nome: "Pés Anti-derrapantes", quantidade: "4 un", custoUnitario: "R$ 0,30/un", custoTotal: "R$ 1,20" }
        ]
    },
    {
        id: "PRD_002",
        sku: "PROD_002",
        nome: "Organizador de Cabos Desk",
        categoria: "Utilitários",
        foto: "https://via.placeholder.com/300/1e1e24/ffffff?text=Organizador+Cabos",
        arquivo: "https://drive.google.com/file/d/2organizador_cabos",
        tempoImpressao: 75,
        pesoProd: 0.045,
        custoProd: 4.20,
        estoque: 32,
        insumos: [
            { nome: "Filamento PETG Cinza", quantidade: "0.045 kg", custoUnitario: "R$ 0,09/g", custoTotal: "R$ 4,05" },
            { nome: "Fita Dupla Face 3M", quantidade: "10 cm", custoUnitario: "R$ 0,015/cm", custoTotal: "R$ 0,15" }
        ]
    }
];

let modoExibicao = 'cards';
let produtosAtuais = [...produtosExemplo];

export function initCatalogo(switchView) {
    const container = document.querySelector('#view-catalogo .view-body');
    if (!container) return;

    container.innerHTML = `
        <div class="toolbar-catalogo">
            <div class="search-box">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="catalogo-search" placeholder="Buscar por nome, SKU ou categoria...">
            </div>

            <div class="actions-box">
                <div class="view-toggle">
                    <button id="btn-view-cards" class="btn-icon ${modoExibicao === 'cards' ? 'active' : ''}" title="Visualização em Cards">
                        <i class="fa-solid fa-border-all"></i>
                    </button>
                    <button id="btn-view-lista" class="btn-icon ${modoExibicao === 'lista' ? 'active' : ''}" title="Visualização em Lista">
                        <i class="fa-solid fa-list"></i>
                    </button>
                </div>

                <button id="btn-novo-produto" class="btn-primary">
                    <i class="fa-solid fa-plus"></i>
                    <span>Novo Produto</span>
                </button>
            </div>
        </div>

        <div id="produtos-container">
            ${renderConteudoProdutos(produtosAtuais, modoExibicao)}
        </div>
    `;

    bindEvents(switchView);
}

function renderConteudoProdutos(produtos, modo) {
    if (produtos.length === 0) {
        return `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>Nenhum produto encontrado.</p>
            </div>
        `;
    }

    if (modo === 'cards') {
        return `
            <div class="cards-grid">
                ${produtos.map(p => `
                    <div class="card-produto clickable-card" data-id="${p.id}">
                        <div class="card-thumb">
                            <img src="${p.foto}" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/300/121214/fff?text=Sem+Imagem'">
                        </div>
                        <div class="card-info">
                            <span class="card-sku">${p.sku}</span>
                            <h3 class="card-title">${p.nome}</h3>
                            <div class="card-meta">
                                <span class="badge-categoria">${p.categoria}</span>
                                <span class="stock-count">Estoque: <strong>${p.estoque} un</strong></span>
                            </div>
                            <div class="card-footer">
                                <span class="card-price">R$ ${Number(p.custoProd || 0).toFixed(2)}</span>
                                <span class="link-detalhes">Ver detalhes <i class="fa-solid fa-chevron-right"></i></span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    return `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Produto</th>
                        <th>Categoria</th>
                        <th>Peso / Temp.</th>
                        <th>Estoque</th>
                        <th>Preço</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${produtos.map(p => `
                        <tr class="clickable-row" data-id="${p.id}">
                            <td><strong>${p.sku}</strong></td>
                            <td>
                                <div class="table-product-cell">
                                    <img src="${p.foto}" class="table-thumb" alt="${p.nome}">
                                    <span>${p.nome}</span>
                                </div>
                            </td>
                            <td><span class="badge-categoria">${p.categoria}</span></td>
                            <td><small>${String(p.pesoProd || 0).replace('.', ',')} kg | ${String(p.tempoImpressao || 0)} min</small></td>
                            <td>${p.estoque || 0} un</td>
                            <td><strong>R$ ${Number(p.custoProd || 0).toFixed(2)}</strong></td>
                            <td>
                                <button class="btn-icon-subtle" title="Ver Detalhes"><i class="fa-solid fa-chevron-right"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function bindEvents(switchView) {
    const btnCards = document.getElementById('btn-view-cards');
    const btnLista = document.getElementById('btn-view-lista');
    const containerProdutos = document.getElementById('produtos-container');
    const btnNovo = document.getElementById('btn-novo-produto');
    const searchInput = document.getElementById('catalogo-search');

    btnCards?.addEventListener('click', () => {
        modoExibicao = 'cards';
        btnCards.classList.add('active');
        btnLista?.classList.remove('active');
        if (containerProdutos) containerProdutos.innerHTML = renderConteudoProdutos(produtosAtuais, 'cards');
    });

    btnLista?.addEventListener('click', () => {
        modoExibicao = 'lista';
        btnLista.classList.add('active');
        btnCards?.classList.remove('active');
        if (containerProdutos) containerProdutos.innerHTML = renderConteudoProdutos(produtosAtuais, 'lista');
    });

    // Clique em qualquer Card ou Linha da Tabela troca para a view do produto
    containerProdutos?.addEventListener('click', (e) => {
        const target = e.target.closest('.clickable-card, .clickable-row');
        if (target) {
            const prodId = target.getAttribute('data-id');
            const produto = produtosExemplo.find(p => p.id === prodId);
            if (produto && typeof switchView === 'function') {
                switchView('detalhe-produto', produto);
            }
        }
    });

    btnNovo?.addEventListener('click', () => {
        if (typeof switchView === 'function') switchView('cadastro-produto');
    });

    searchInput?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        produtosAtuais = produtosExemplo.filter(p => 
            p.nome.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.categoria.toLowerCase().includes(term)
        );
        if (containerProdutos) containerProdutos.innerHTML = renderConteudoProdutos(produtosAtuais, modoExibicao);
    });
}