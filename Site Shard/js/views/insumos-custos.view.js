// js/views/insumos-custos.view.js

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzus-0gell47fkLEfgwHsLd8v1QoG6k_0Qi5fmUyhG_Q2NYjFwCYm5NNKXcQKRyFDA1Vw/exec";

// =================================================================
// UTILITÁRIOS, SANITIZAÇÃO E FORMATADORES
// =================================================================

/** Sanitiza strings para prevenção de vulnerabilidades XSS */
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
const formatPercent = (val) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val) || 0);
const formatNumber = (val, decimals = 2) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(val) || 0);

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

// Estado global mantido no escopo do módulo
let abaAtiva = 'insumos'; // 'insumos' | 'custos'
let listaInsumos = [];
let listaCustos = [];
let carregando = false;
let itemEmEdicaoId = null;
let ehNovoItem = false;

// =================================================================
// 1. INICIALIZAÇÃO DA VIEW
// =================================================================

/**
 * Ponto de entrada da view de Insumos e Taxas Operacionais.
 * @param {Function} switchView - Função global de navegação de views.
 */
export function initInsumosCustos(switchView) {
    const container = document.querySelector('#view-insumos .view-body') || document.querySelector('.main-content');
    if (!container) return;

    // Reset de estado
    itemEmEdicaoId = null;
    ehNovoItem = false;

    // Renderização do HTML base
    container.innerHTML = renderLayoutBaseHTML();
    refreshIcons();

    // Registra os ouvintes globais de eventos
    bindGlobalEvents(container);

    // Carrega dados da planilha via API
    carregarDados();
}

// =================================================================
// 2. TEMPLATES BASE DE LAYOUT
// =================================================================

function renderLayoutBaseHTML() {
    return `
        <div class="view-header-flex">
            <div>
                <h2>Gestão de Insumos & Taxas Operacionais</h2>
                <p class="subtitle">Dê duplo clique sobre uma linha para editar ou adicione novos itens abaixo</p>
            </div>
            
            <div class="tabs-toggle-container">
                <button id="btn-tab-insumos" class="tab-toggle-btn active">
                    <i data-lucide="boxes"></i> Estoque de Insumos
                </button>
                <button id="btn-tab-custos" class="tab-toggle-btn">
                    <i data-lucide="receipt"></i> Tabela de Custos
                </button>
            </div>
        </div>

        <div class="filter-bar">
            <div class="search-box">
                <i data-lucide="search"></i>
                <input type="text" id="input-busca" placeholder="Buscar por código, nome ou categoria...">
            </div>
            <div class="counter-badge" id="counter-total">0 registros</div>
        </div>

        <div id="tab-content-container" class="tab-content-wrapper">
            <div class="table-responsive">
                <table class="data-table" id="tabela-dados">
                    <thead id="tabela-head"></thead>
                    <tbody id="tabela-body"></tbody>
                </table>
            </div>
            
            <button id="btn-adicionar-registro" class="btn-add-row">
                <i data-lucide="plus-circle"></i> <span id="text-btn-add">Adicionar Insumo</span>
            </button>
        </div>
    `;
}

function bindGlobalEvents(container) {
    container.querySelector('#btn-tab-insumos')?.addEventListener('click', () => alternarAba('insumos'));
    container.querySelector('#btn-tab-custos')?.addEventListener('click', () => alternarAba('custos'));
    container.querySelector('#input-busca')?.addEventListener('input', () => renderizarTabelaAtual());
    container.querySelector('#btn-adicionar-registro')?.addEventListener('click', iniciarCriacaoNovoItem);

    // Duplo clique na linha para iniciar edição
    const tbody = container.querySelector('#tabela-body');
    tbody?.addEventListener('dblclick', (e) => {
        const tr = e.target.closest('tr[data-id]');
        if (tr && !itemEmEdicaoId && !carregando) {
            iniciarEdicao(tr.dataset.id);
        }
    });
}

// =================================================================
// 3. NAVEGAÇÃO ENTRE ABAS
// =================================================================

function alternarAba(novaAba) {
    if (abaAtiva === novaAba || carregando) return;

    abaAtiva = novaAba;
    cancelarEdicao();

    const btnInsumos = document.getElementById('btn-tab-insumos');
    const btnCustos = document.getElementById('btn-tab-custos');
    const btnAddText = document.getElementById('text-btn-add');

    if (abaAtiva === 'insumos') {
        btnInsumos?.classList.add('active');
        btnCustos?.classList.remove('active');
        if (btnAddText) btnAddText.textContent = "Adicionar Insumo";
    } else {
        btnCustos?.classList.add('active');
        btnInsumos?.classList.remove('active');
        if (btnAddText) btnAddText.textContent = "Adicionar Custo";
    }

    const contentWrapper = document.getElementById('tab-content-container');
    if (!contentWrapper) return;

    contentWrapper.classList.add('fade-out');

    setTimeout(() => {
        renderizarTabelaAtual();
        contentWrapper.classList.remove('fade-out');
        contentWrapper.classList.add('fade-in');

        setTimeout(() => contentWrapper.classList.remove('fade-in'), 200);
    }, 200);
}

// =================================================================
// 4. INTEGRAÇÃO E CARREGAMENTO DE DADOS (API)
// =================================================================

async function carregarDados() {
    carregando = true;
    exibirLoader();

    try {
        const response = await fetch(APPS_SCRIPT_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();

        if (result && result.status === "success") {
            listaInsumos = Array.isArray(result.insumos) ? result.insumos : [];
            listaCustos = Array.isArray(result.custos) ? result.custos : [];
        } else {
            throw new Error("Resposta inválida da API do Apps Script");
        }
    } catch (error) {
        console.error("Erro ao conectar com a planilha:", error);
        exibirMensagemErro("Não foi possível carregar os dados. Verifique a conexão.");
    } finally {
        carregando = false;
        renderizarTabelaAtual();
    }
}

function exibirLoader() {
    const tbody = document.getElementById('tabela-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="table-state-message">
                    <i data-lucide="loader-2" class="spin-icon"></i> Carregando dados da planilha...
                </td>
            </tr>
        `;
        refreshIcons();
    }
}

function exibirMensagemErro(mensagem) {
    const tbody = document.getElementById('tabela-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="table-state-message text-danger" style="color: var(--danger-color, #ef4444);">
                    <i data-lucide="alert-circle"></i> ${escapeHtml(mensagem)}
                </td>
            </tr>
        `;
        refreshIcons();
    }
}

// =================================================================
// 5. RENDERIZAÇÃO DE TABELAS E LINHAS
// =================================================================

function renderizarTabelaAtual() {
    const thead = document.getElementById('tabela-head');
    const tbody = document.getElementById('tabela-body');
    const inputBusca = document.getElementById('input-busca');
    const badgeCounter = document.getElementById('counter-total');

    if (!thead || !tbody || carregando) return;

    const termoBusca = (inputBusca?.value || '').toLowerCase().trim();

    if (abaAtiva === 'insumos') {
        thead.innerHTML = `
            <tr>
                <th style="width: 80px; text-align: center;">Ação</th>
                <th>ID INS</th>
                <th>Categoria</th>
                <th>Nome do Insumo</th>
                <th>Custo Unitário (R$)</th>
                <th>Estoque Atual</th>
            </tr>
        `;

        const dadosFiltrados = listaInsumos.filter(item => {
            const id = String(item.id || '').toLowerCase();
            const cat = String(item.categoria || '').toLowerCase();
            const nome = String(item.nome || '').toLowerCase();
            return id.includes(termoBusca) || cat.includes(termoBusca) || nome.includes(termoBusca);
        });

        if (badgeCounter) badgeCounter.textContent = `${dadosFiltrados.length} insumos cadastrados`;

        if (dadosFiltrados.length === 0 && !ehNovoItem) {
            tbody.innerHTML = `<tr><td colspan="6" class="table-state-message">Nenhum insumo encontrado.</td></tr>`;
            return;
        }

        let htmlRows = dadosFiltrados.map(item => {
            return itemEmEdicaoId === item.id ? renderLinhaEdicaoInsumo(item) : renderLinhaNormalInsumo(item);
        }).join('');

        if (ehNovoItem && itemEmEdicaoId && itemEmEdicaoId.startsWith('INS_')) {
            htmlRows += renderLinhaEdicaoInsumo({
                id: itemEmEdicaoId,
                categoria: 'FILAMENTO',
                nome: '',
                precoUnidade: 0,
                estoque: 0
            });
        }

        tbody.innerHTML = htmlRows;

    } else {
        thead.innerHTML = `
            <tr>
                <th style="width: 80px; text-align: center;">Ação</th>
                <th>ID CUS</th>
                <th>Categoria</th>
                <th>Nome / Descrição</th>
                <th>Unidade</th>
                <th>Valor / Taxa Unitária</th>
            </tr>
        `;

        const dadosFiltrados = listaCustos.filter(item => {
            const id = String(item.id || '').toLowerCase();
            const cat = String(item.categoria || '').toLowerCase();
            const nome = String(item.nome || '').toLowerCase();
            return id.includes(termoBusca) || cat.includes(termoBusca) || nome.includes(termoBusca);
        });

        if (badgeCounter) badgeCounter.textContent = `${dadosFiltrados.length} taxas/custos cadastrados`;

        if (dadosFiltrados.length === 0 && !ehNovoItem) {
            tbody.innerHTML = `<tr><td colspan="6" class="table-state-message">Nenhuma taxa de custo encontrada.</td></tr>`;
            return;
        }

        let htmlRows = dadosFiltrados.map(item => {
            return itemEmEdicaoId === item.id ? renderLinhaEdicaoCusto(item) : renderLinhaNormalCusto(item);
        }).join('');

        if (ehNovoItem && itemEmEdicaoId && itemEmEdicaoId.startsWith('CUS_')) {
            htmlRows += renderLinhaEdicaoCusto({
                id: itemEmEdicaoId,
                categoria: 'CUSTOS OPERACIONAIS',
                nome: '',
                unidade: 'R$',
                precoUnidade: 0
            });
        }

        tbody.innerHTML = htmlRows;
    }

    vincularEventosLinhaEdicao();
    refreshIcons();
}

// --- LINHAS DA TABELA DE INSUMOS ---

function renderLinhaNormalInsumo(item) {
    const preco = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0);
    const estoque = Number(item.estoque ?? 0);
    const cat = String(item.categoria || 'INSUMOS').toUpperCase();

    const unidadeTexto = cat.includes('FILAMENTO') ? `${formatNumber(estoque, 2)} kg` : `${formatNumber(estoque, 0)} un`;
    const badgeEstoqueClass = estoque <= 0 ? 'stock-badge empty' : estoque < 100 ? 'stock-badge low' : 'stock-badge ok';

    return `
        <tr data-id="${escapeHtml(item.id)}" class="row-editable" title="Dê duplo clique para editar">
            <td style="text-align: center;"><span class="action-placeholder"><i data-lucide="edit-2"></i></span></td>
            <td><code class="code-id">${escapeHtml(item.id || 'N/A')}</code></td>
            <td><span class="badge-categoria">${escapeHtml(cat)}</span></td>
            <td><strong>${escapeHtml(item.nome || 'Sem Nome')}</strong></td>
            <td>${formatCurrency(preco)}</td>
            <td><span class="${badgeEstoqueClass}">${unidadeTexto}</span></td>
        </tr>
    `;
}

function renderLinhaEdicaoInsumo(item) {
    const preco = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0);
    const estoque = Number(item.estoque ?? 0);
    const itemIdEscaped = escapeHtml(item.id);

    return `
        <tr data-id="${itemIdEscaped}" class="row-editing">
            <td style="text-align: center;">
                <div class="row-actions-group">
                    <button class="btn-save-row" data-action="salvar" title="Salvar (Enter)">
                        <i data-lucide="check"></i>
                    </button>
                    <button class="btn-cancel-row" data-action="cancelar" title="Cancelar (Esc)">
                        <i data-lucide="x"></i>
                    </button>
                </div>
            </td>
            <td><code class="code-id">${itemIdEscaped}</code></td>
            <td><input type="text" id="edit-cat-${itemIdEscaped}" class="table-input" value="${escapeHtml(item.categoria || '')}" placeholder="Ex: FILAMENTO"></td>
            <td><input type="text" id="edit-nome-${itemIdEscaped}" class="table-input" value="${escapeHtml(item.nome || '')}" placeholder="Nome do insumo"></td>
            <td><input type="number" step="0.01" id="edit-preco-${itemIdEscaped}" class="table-input" value="${preco}" placeholder="0.00"></td>
            <td><input type="number" step="0.01" id="edit-estoque-${itemIdEscaped}" class="table-input" value="${estoque}" placeholder="0"></td>
        </tr>
    `;
}

// --- LINHAS DA TABELA DE CUSTOS ---

function renderLinhaNormalCusto(item) {
    const valor = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0);
    const unidade = String(item.unidade || '').trim();
    const cat = String(item.categoria || 'CUSTOS').toUpperCase();

    let valorFormatado = formatCurrency(valor);
    if (unidade.includes('%') || item.id === 'CUS_04') {
        valorFormatado = formatPercent(valor);
    }

    return `
        <tr data-id="${escapeHtml(item.id)}" class="row-editable" title="Dê duplo clique para editar">
            <td style="text-align: center;"><span class="action-placeholder"><i data-lucide="edit-2"></i></span></td>
            <td><code class="code-id highlight">${escapeHtml(item.id || 'N/A')}</code></td>
            <td><span class="badge-categoria alt">${escapeHtml(cat)}</span></td>
            <td><strong>${escapeHtml(item.nome || 'Sem Nome')}</strong></td>
            <td><span class="badge-unidade">${escapeHtml(unidade || 'R$')}</span></td>
            <td><strong class="text-accent">${valorFormatado}</strong></td>
        </tr>
    `;
}

function renderLinhaEdicaoCusto(item) {
    const valor = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0);
    const itemIdEscaped = escapeHtml(item.id);

    return `
        <tr data-id="${itemIdEscaped}" class="row-editing">
            <td style="text-align: center;">
                <div class="row-actions-group">
                    <button class="btn-save-row" data-action="salvar" title="Salvar (Enter)">
                        <i data-lucide="check"></i>
                    </button>
                    <button class="btn-cancel-row" data-action="cancelar" title="Cancelar (Esc)">
                        <i data-lucide="x"></i>
                    </button>
                </div>
            </td>
            <td><code class="code-id highlight">${itemIdEscaped}</code></td>
            <td><input type="text" id="edit-cat-${itemIdEscaped}" class="table-input" value="${escapeHtml(item.categoria || '')}" placeholder="Ex: TAXAS"></td>
            <td><input type="text" id="edit-nome-${itemIdEscaped}" class="table-input" value="${escapeHtml(item.nome || '')}" placeholder="Descrição"></td>
            <td><input type="text" id="edit-unidade-${itemIdEscaped}" class="table-input" value="${escapeHtml(item.unidade || '')}" placeholder="Ex: R$/kWh ou %"></td>
            <td><input type="number" step="0.0001" id="edit-preco-${itemIdEscaped}" class="table-input" value="${valor}" placeholder="0.00"></td>
        </tr>
    `;
}

// =================================================================
// 6. EDIÇÃO E SALVAMENTO (WORKFLOWS)
// =================================================================

function iniciarEdicao(id) {
    itemEmEdicaoId = id;
    renderizarTabelaAtual();
}

/**
 * Gera um ID sequencial seguro baseado nos itens existentes na lista ativa.
 */
function gerarNovoIdSequencial(prefixo, lista) {
    const numeros = lista
        .map(i => parseInt(String(i.id || '').replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));
    
    const maiorNum = numeros.length > 0 ? Math.max(...numeros) : 0;
    return `${prefixo}_${String(maiorNum + 1).padStart(2, '0')}`;
}

function iniciarCriacaoNovoItem() {
    if (itemEmEdicaoId) return;

    ehNovoItem = true;

    if (abaAtiva === 'insumos') {
        itemEmEdicaoId = gerarNovoIdSequencial('INS', listaInsumos);
    } else {
        itemEmEdicaoId = gerarNovoIdSequencial('CUS', listaCustos);
    }

    renderizarTabelaAtual();
}

function cancelarEdicao() {
    itemEmEdicaoId = null;
    ehNovoItem = false;
    renderizarTabelaAtual();
}

function vincularEventosLinhaEdicao() {
    const rowEditing = document.querySelector('.row-editing');
    if (!rowEditing) return;

    // Botão Salvar
    const btnSalvar = rowEditing.querySelector('.btn-save-row');
    btnSalvar?.addEventListener('click', async (e) => {
        e.preventDefault();
        await salvarRegistroAtual();
    });

    // Botão Cancelar
    const btnCancelar = rowEditing.querySelector('.btn-cancel-row');
    btnCancelar?.addEventListener('click', (e) => {
        e.preventDefault();
        cancelarEdicao();
    });

    // Atalhos de Teclado (Enter = Salvar, Escape = Cancelar)
    rowEditing.querySelectorAll('input').forEach(input => {
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await salvarRegistroAtual();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelarEdicao();
            }
        });
    });
}

async function salvarRegistroAtual() {
    const id = itemEmEdicaoId;
    if (!id) return;

    const rowEditing = document.querySelector('.row-editing');
    const btnSalvar = rowEditing?.querySelector('.btn-save-row');
    const btnCancelar = rowEditing?.querySelector('.btn-cancel-row');

    if (btnSalvar) {
        btnSalvar.disabled = true;
        if (btnCancelar) btnCancelar.disabled = true;
        btnSalvar.innerHTML = `<i data-lucide="loader-2" class="spin-icon"></i>`;
        refreshIcons();
    }

    let payload = {};

    if (abaAtiva === 'insumos') {
        const cat = document.getElementById(`edit-cat-${id}`)?.value.trim().toUpperCase() || 'INSUMOS';
        payload = {
            tabela: 'insumos',
            id: id,
            categoria: cat,
            nome: document.getElementById(`edit-nome-${id}`)?.value.trim() || 'Sem Nome',
            unidade: cat.includes('FILAMENTO') ? 'kg' : 'un',
            precoUnidade: parseFloat(document.getElementById(`edit-preco-${id}`)?.value) || 0,
            estoque: parseFloat(document.getElementById(`edit-estoque-${id}`)?.value) || 0
        };
    } else {
        payload = {
            tabela: 'custos',
            id: id,
            categoria: document.getElementById(`edit-cat-${id}`)?.value.trim().toUpperCase() || 'CUSTOS',
            nome: document.getElementById(`edit-nome-${id}`)?.value.trim() || 'Sem Nome',
            unidade: document.getElementById(`edit-unidade-${id}`)?.value.trim() || 'R$',
            precoUnidade: parseFloat(document.getElementById(`edit-preco-${id}`)?.value) || 0
        };
    }

    try {
        // Envio POST formatado como text/plain para evitar requisição CORS Preflight no Google Apps Script
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        // Atualização reativa do estado local
        if (abaAtiva === 'insumos') {
            const idx = listaInsumos.findIndex(item => item.id === id);
            if (idx >= 0) {
                listaInsumos[idx] = payload;
            } else {
                listaInsumos.push(payload);
            }
        } else {
            const idx = listaCustos.findIndex(item => item.id === id);
            if (idx >= 0) {
                listaCustos[idx] = payload;
            } else {
                listaCustos.push(payload);
            }
        }

    } catch (error) {
        console.error("Erro ao salvar dados no Google Sheets:", error);
        alert("Não foi possível salvar as alterações na planilha. Tente novamente.");
    } finally {
        itemEmEdicaoId = null;
        ehNovoItem = false;
        renderizarTabelaAtual();
    }
}