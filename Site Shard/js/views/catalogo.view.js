// js/views/catalogo.view.js

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzus-0gell47fkLEfgwHsLd8v1QoG6k_0Qi5fmUyhG_Q2NYjFwCYm5NNKXcQKRyFDA1Vw/exec";

// Imagem padrão caso a URL da foto falhe ou venha vazia
const DEFAULT_IMAGE_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';

// Estado da View (Módulo Scope)
const state = {
    modoExibicao: 'cards', // 'cards' ou 'lista'
    todosProdutos: [],
    produtosAtuais: [],
    carregando: false
};

// =================================================================
// UTILITÁRIOS E FORMATADORES
// =================================================================

/** Sanitiza strings para prevenção de XSS ao renderizar via innerHTML */
function escapeHtml(str) {
    if (typeof str !== 'string') return str ?? '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
const formatNumber = (val, decimals = 3) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(val) || 0);

/**
 * Converte valor decimal de horas (ex: 1.3) para string amigável (ex: "1h 18m")
 */
function formatarTempoExibicao(tempoHoras) {
    const num = Number(tempoHoras);
    if (!num || isNaN(num) || num <= 0) return "0h";

    const hrs = Math.floor(num);
    const mins = Math.round((num - hrs) * 60);

    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    if (mins > 0) return `${mins}m`;

    return `${num.toFixed(1)}h`;
}

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function resetStateData() {
    state.todosProdutos = [];
    state.produtosAtuais = [];
    state.carregando = false;
}

// =================================================================
// 1. INICIALIZAÇÃO DA VIEW
// =================================================================

/**
 * Ponto de entrada para inicialização da View do Catálogo.
 * @param {Function} switchView - Função global de navegação entre views.
 */
export function initCatalogo(switchView) {
    const container = document.querySelector('#view-catalogo .view-body') || document.querySelector('.main-content');
    if (!container) return;

    // Reset dos produtos mantendo a preferência de visualização ('cards' ou 'lista')
    resetStateData();

    // Renderiza a estrutura da Toolbar e Skeleton/Loading
    container.innerHTML = renderLayoutHTML();

    // Atualiza ícones Lucide
    refreshIcons();

    // Registra os eventos da interface
    bindEvents(switchView);

    // Carrega os dados atualizados da planilha
    carregarProdutosDoSheets(switchView);
}

// =================================================================
// 2. TEMPLATES HTML
// =================================================================

function renderLayoutHTML() {
    return `
        <div class="toolbar-catalogo">
            <div class="search-box">
                <i data-lucide="search"></i>
                <input type="text" id="catalogo-search" placeholder="Buscar por nome, SKU ou categoria..." autocomplete="off">
            </div>

            <div class="actions-box">
                <div class="view-toggle">
                    <button id="btn-view-cards" class="btn-icon ${state.modoExibicao === 'cards' ? 'active' : ''}" title="Visualização em Cards">
                        <i data-lucide="layout-grid"></i>
                    </button>
                    <button id="btn-view-lista" class="btn-icon ${state.modoExibicao === 'lista' ? 'active' : ''}" title="Visualização em Lista">
                        <i data-lucide="list"></i>
                    </button>
                </div>

                <button id="btn-novo-produto" class="btn-primary">
                    <i data-lucide="plus"></i>
                    <span>Novo Produto</span>
                </button>
            </div>
        </div>

        <div id="produtos-container">
            <div class="empty-state">
                <i data-lucide="loader-2" class="spin"></i>
                <p>Carregando produtos da planilha...</p>
            </div>
        </div>
    `;
}

function renderConteudoProdutos(produtos, modo) {
    if (!produtos || produtos.length === 0) {
        return `
            <div class="empty-state">
                <i data-lucide="package-open"></i>
                <p>Nenhum produto encontrado.</p>
            </div>
        `;
    }

    if (modo === 'cards') {
        return `
            <div class="cards-grid">
                ${produtos.map(p => {
                    const id = escapeHtml(p.id);
                    const sku = escapeHtml(p.sku);
                    const nome = escapeHtml(p.nome);
                    const categoria = escapeHtml(p.categoria);
                    const foto = escapeHtml(p.foto || DEFAULT_IMAGE_PLACEHOLDER);

                    return `
                        <div class="card-produto clickable-card" data-id="${id}">
                            <div class="card-thumb">
                                <img src="${foto}" alt="${nome}" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE_PLACEHOLDER}';">
                            </div>
                            <div class="card-info">
                                <span class="card-sku">${sku}</span>
                                <h3 class="card-title">${nome}</h3>
                                <div class="card-meta">
                                    <span class="badge-categoria">${categoria}</span>
                                    <span class="stock-count">Estoque: <strong>${p.estoque} un</strong></span>
                                </div>
                                <div class="card-footer">
                                    <span class="card-price">${formatCurrency(p.custoProd)}</span>
                                    <span class="link-detalhes">Ver detalhes <i data-lucide="chevron-right"></i></span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Modo Tabela / Lista
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
                    ${produtos.map(p => {
                        const id = escapeHtml(p.id);
                        const sku = escapeHtml(p.sku);
                        const nome = escapeHtml(p.nome);
                        const categoria = escapeHtml(p.categoria);
                        const foto = escapeHtml(p.foto || DEFAULT_IMAGE_PLACEHOLDER);

                        return `
                            <tr class="clickable-row" data-id="${id}">
                                <td><strong>${sku}</strong></td>
                                <td>
                                    <div class="table-product-cell">
                                        <img src="${foto}" class="table-thumb" alt="${nome}" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE_PLACEHOLDER}';">
                                        <span>${nome}</span>
                                    </div>
                                </td>
                                <td><span class="badge-categoria">${categoria}</span></td>
                                <td><small>${formatNumber(p.pesoProd, 3)} kg | ${formatarTempoExibicao(p.tempoImpressao)}</small></td>
                                <td>${p.estoque} un</td>
                                <td><strong>${formatCurrency(p.custoProd)}</strong></td>
                                <td>
                                    <button class="btn-icon-subtle" title="Ver Detalhes">
                                        <i data-lucide="chevron-right"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// =================================================================
// 3. VINCULAÇÃO DE EVENTOS
// =================================================================

function bindEvents(switchView) {
    const btnCards = document.getElementById('btn-view-cards');
    const btnLista = document.getElementById('btn-view-lista');
    const containerProdutos = document.getElementById('produtos-container');
    const btnNovo = document.getElementById('btn-novo-produto');
    const searchInput = document.getElementById('catalogo-search');

    // Alternar para Modo Cards
    btnCards?.addEventListener('click', () => {
        if (state.modoExibicao === 'cards') return;
        state.modoExibicao = 'cards';
        btnCards.classList.add('active');
        btnLista?.classList.remove('active');
        atualizarViewProdutos();
    });

    // Alternar para Modo Lista
    btnLista?.addEventListener('click', () => {
        if (state.modoExibicao === 'lista') return;
        state.modoExibicao = 'lista';
        btnLista.classList.add('active');
        btnCards?.classList.remove('active');
        atualizarViewProdutos();
    });

    // Navegar para Cadastro de Novo Produto
    btnNovo?.addEventListener('click', () => {
        if (typeof switchView === 'function') switchView('cadastro-produto');
    });

    // Campo de Busca em Tempo Real
    searchInput?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();

        if (!term) {
            state.produtosAtuais = [...state.todosProdutos];
        } else {
            state.produtosAtuais = state.todosProdutos.filter(p => 
                (p.nome && p.nome.toLowerCase().includes(term)) ||
                (p.sku && p.sku.toLowerCase().includes(term)) ||
                (p.categoria && p.categoria.toLowerCase().includes(term))
            );
        }

        atualizarViewProdutos();
    });

    // Delegação de Clique nos Cards ou Linhas da Tabela
    containerProdutos?.addEventListener('click', (e) => {
        const target = e.target.closest('.clickable-card, .clickable-row');
        if (target) {
            const prodId = target.getAttribute('data-id');
            const produto = state.todosProdutos.find(p => String(p.id) === String(prodId) || String(p.sku) === String(prodId));

            if (produto && typeof switchView === 'function') {
                switchView('detalhe-produto', produto);
            }
        }
    });
}

function atualizarViewProdutos() {
    const container = document.getElementById('produtos-container');
    if (!container) return;

    container.innerHTML = renderConteudoProdutos(state.produtosAtuais, state.modoExibicao);
    refreshIcons();
}

// =================================================================
// 4. INTEGRAÇÃO COM GOOGLE SHEETS (API)
// =================================================================

async function carregarProdutosDoSheets(switchView) {
    const containerProdutos = document.getElementById('produtos-container');
    if (!containerProdutos || state.carregando) return;

    state.carregando = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(APPS_SCRIPT_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const result = await response.json();

        // Normalização de retorno da API
        const listaBruta = result.produtos || result.products || (Array.isArray(result) ? result : []);

        state.todosProdutos = listaBruta.map((p, index) => {
            const tempoDec = Number(p.tempoImpressao || p.tempo || 0);
            return {
                id: String(p.id || p.sku || `PRD_${index + 1}`).trim(),
                sku: String(p.sku || p.id || `SKU_${index + 1}`).trim(),
                nome: String(p.nome || p.produto || "Produto Sem Nome").trim(),
                categoria: String(p.categoria || "Geral").trim(),
                foto: String(p.foto || p.imagem || "").trim(),
                arquivo: String(p.arquivo || p.linkArquivo || "").trim(),
                tempoImpressao: isNaN(tempoDec) ? 0 : tempoDec,
                pesoProd: Number(p.pesoProd || p.peso || 0),
                custoProd: Number(p.custoProd || p.preco || p.custoTotal || 0),
                estoque: Number(p.estoque || 0),
                insumos: Array.isArray(p.insumos || p.bom) ? (p.insumos || p.bom) : []
            };
        });

        state.produtosAtuais = [...state.todosProdutos];
        atualizarViewProdutos();

    } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
        
        containerProdutos.innerHTML = `
            <div class="empty-state">
                <i data-lucide="alert-triangle" style="color: #ef4444;"></i>
                <p>Erro ao carregar os produtos da planilha.</p>
                <button id="btn-retry-fetch" class="btn-secondary" style="margin-top: 10px;">
                    <i data-lucide="rotate-cw"></i> Tentar Novamente
                </button>
            </div>
        `;
        refreshIcons();

        document.getElementById('btn-retry-fetch')?.addEventListener('click', () => {
            containerProdutos.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="loader-2" class="spin"></i>
                    <p>Reconectando à planilha...</p>
                </div>
            `;
            refreshIcons();
            carregarProdutosDoSheets(switchView);
        });
    } finally {
        clearTimeout(timeoutId);
        state.carregando = false;
    }
}