// js/views/catalogo.view.js

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzus-0gell47fkLEfgwHsLd8v1QoG6k_0Qi5fmUyhG_Q2NYjFwCYm5NNKXcQKRyFDA1Vw/exec";

let modoExibicao = 'cards';
let todosProdutos = [];
let produtosAtuais = [];
let carregando = false;

export function initCatalogo(switchView) {
    const container = document.querySelector('#view-catalogo .view-body') || document.querySelector('.main-content');
    if (!container) return;

    // 1. Renderiza a estrutura da toolbar e o container dos produtos
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
            <div class="empty-state">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Carregando produtos da planilha...</p>
            </div>
        </div>
    `;

    // 2. Registra os eventos de busca e botões
    bindEvents(switchView);

    // 3. Busca os dados reais da planilha
    carregarProdutosDoSheets(switchView);
}

// =================================================================
// REQUISIÇÃO API GOOGLE SHEETS
// =================================================================

async function carregarProdutosDoSheets(switchView) {
    const containerProdutos = document.getElementById('produtos-container');
    if (!containerProdutos || carregando) return;

    carregando = true;

    try {
        const response = await fetch(APPS_SCRIPT_URL);
        const result = await response.json();

        // Aceita a lista vinda de 'result.produtos' ou 'result.products'
        const listaBruta = result.produtos || result.products || (Array.isArray(result) ? result : []);

        // Mapeia e normaliza os dados vindos do Sheets
        todosProdutos = listaBruta.map((p, index) => {
            const tempoDec = Number(p.tempoImpressao || p.tempo || 0);
            return {
                id: p.id || p.sku || `PRD_${index + 1}`,
                sku: p.sku || p.id || `SKU_${index + 1}`,
                nome: p.nome || p.produto || "Produto Sem Nome",
                categoria: p.categoria || "Geral",
                foto: p.foto || p.imagem || "",
                arquivo: p.arquivo || p.linkArquivo || "",
                tempoImpressao: tempoDec, // Valor em base 10 (ex: 1.3)
                pesoProd: Number(p.pesoProd || p.peso || 0),
                custoProd: Number(p.custoProd || p.preco || p.custoTotal || 0),
                estoque: Number(p.estoque || 0),
                insumos: Array.isArray(p.insumos || p.bom) ? (p.insumos || p.bom) : []
            };
        });

        produtosAtuais = [...todosProdutos];
        containerProdutos.innerHTML = renderConteudoProdutos(produtosAtuais, modoExibicao);

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        containerProdutos.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444;"></i>
                <p>Erro ao carregar os produtos da planilha.</p>
                <button id="btn-reprovar-fetch" class="btn-secondary" style="margin-top: 10px;">
                    <i class="fa-solid fa-rotate-right"></i> Tentar Novamente
                </button>
            </div>
        `;
        document.getElementById('btn-reprovar-fetch')?.addEventListener('click', () => {
            containerProdutos.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>Reconectando à planilha...</p>
                </div>
            `;
            carregarProdutosDoSheets(switchView);
        });
    } finally {
        carregando = false;
    }
}

// =================================================================
// RENDERIZAÇÃO DOS COMPONENTES (CARDS E LISTA)
// =================================================================

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
                            <img src="${p.foto}" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/300/121214/ffffff?text=Sem+Imagem'">
                        </div>
                        <div class="card-info">
                            <span class="card-sku">${p.sku}</span>
                            <h3 class="card-title">${p.nome}</h3>
                            <div class="card-meta">
                                <span class="badge-categoria">${p.categoria}</span>
                                <span class="stock-count">Estoque: <strong>${p.estoque} un</strong></span>
                            </div>
                            <div class="card-footer">
                                <span class="card-price">R$ ${p.custoProd.toFixed(2).replace('.', ',')}</span>
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
                        <th>Peso / Tempo</th>
                        <th>Estoque</th>
                        <th>Preço/Custo</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${produtos.map(p => `
                        <tr class="clickable-row" data-id="${p.id}">
                            <td><strong>${p.sku}</strong></td>
                            <td>
                                <div class="table-product-cell">
                                    <img src="${p.foto}" class="table-thumb" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/50/121214/ffffff?text=3D'">
                                    <span>${p.nome}</span>
                                </div>
                            </td>
                            <td><span class="badge-categoria">${p.categoria}</span></td>
                            <td><small>${p.pesoProd.toFixed(3).replace('.', ',')} kg | ${formatarTempoExibicao(p.tempoImpressao)}</small></td>
                            <td>${p.estoque} un</td>
                            <td><strong>R$ ${p.custoProd.toFixed(2).replace('.', ',')}</strong></td>
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

// =================================================================
// EVENTOS E INTERAÇÕES
// =================================================================

function bindEvents(switchView) {
    const btnCards = document.getElementById('btn-view-cards');
    const btnLista = document.getElementById('btn-view-lista');
    const containerProdutos = document.getElementById('produtos-container');
    const btnNovo = document.getElementById('btn-novo-produto');
    const searchInput = document.getElementById('catalogo-search');

    // Alternar para Visualização em Cards
    btnCards?.addEventListener('click', () => {
        modoExibicao = 'cards';
        btnCards.classList.add('active');
        btnLista?.classList.remove('active');
        if (containerProdutos) containerProdutos.innerHTML = renderConteudoProdutos(produtosAtuais, 'cards');
    });

    // Alternar para Visualização em Lista
    btnLista?.addEventListener('click', () => {
        modoExibicao = 'lista';
        btnLista.classList.add('active');
        btnCards?.classList.remove('active');
        if (containerProdutos) containerProdutos.innerHTML = renderConteudoProdutos(produtosAtuais, 'lista');
    });

    // Clique em qualquer Card ou Linha da Tabela abre o detalhe do produto carregado
    containerProdutos?.addEventListener('click', (e) => {
        const target = e.target.closest('.clickable-card, .clickable-row');
        if (target) {
            const prodId = target.getAttribute('data-id');
            const produto = todosProdutos.find(p => p.id === prodId || p.sku === prodId);
            if (produto && typeof switchView === 'function') {
                switchView('detalhe-produto', produto);
            }
        }
    });

    // Botão para navegar para a tela de Cadastro de Novo Produto
    btnNovo?.addEventListener('click', () => {
        if (typeof switchView === 'function') switchView('cadastro-produto');
    });

    // Campo de Busca em Tempo Real
    searchInput?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        produtosAtuais = todosProdutos.filter(p => 
            p.nome.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.categoria.toLowerCase().includes(term)
        );
        if (containerProdutos) containerProdutos.innerHTML = renderConteudoProdutos(produtosAtuais, modoExibicao);
    });
}

// =================================================================
// HELPERS FORMATADORES
// =================================================================

/**
 * Converte valor decimal de horas (ex: 1.3 ou 1.5) para string formatada de fácil leitura (ex: "1h 18m" ou "1.3h")
 */
function formatarTempoExibicao(tempoHoras) {
    if (!tempoHoras || isNaN(tempoHoras)) return "0h";

    const num = Number(tempoHoras);
    const hrs = Math.floor(num);
    const mins = Math.round((num - hrs) * 60);

    if (hrs > 0 && mins > 0) {
        return `${hrs}h ${mins}m`;
    } else if (hrs > 0) {
        return `${hrs}h`;
    } else if (mins > 0) {
        return `${mins}m`;
    }

    return `${num.toFixed(1)}h`;
}