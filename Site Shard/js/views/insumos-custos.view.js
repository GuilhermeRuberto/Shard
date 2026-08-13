// js/views/insumos-custos.view.js

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzus-0gell47fkLEfgwHsLd8v1QoG6k_0Qi5fmUyhG_Q2NYjFwCYm5NNKXcQKRyFDA1Vw/exec";

let abaAtiva = 'insumos'; // 'insumos' | 'custos'
let listaInsumos = [];
let listaCustos = [];
let carregando = false;

// Guarda o ID do item em edição no momento (null se nenhum)
let itemEmEdicaoId = null;
let ehNovoItem = false;

export function initInsumosCustos(switchView) {
    const container = document.querySelector('#view-insumos .view-body') || document.querySelector('.main-content');
    if (!container) return;

    // Reset de estado
    itemEmEdicaoId = null;
    ehNovoItem = false;

    // 1. Renderização do HTML base
    container.innerHTML = `
        <div class="view-header-flex">
            <div>
                <h2>Gestão de Insumos & Taxas Operacionais</h2>
                <p class="subtitle">Dê dois cliques sobre uma linha para editar ou adicione novos itens abaixo</p>
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
            
            <!-- Botão de Adicionar Nova Linha no Rodapé -->
            <button id="btn-adicionar-registro" class="btn-add-row">
                <i data-lucide="plus-circle"></i> <span id="text-btn-add">Adicionar Insumo</span>
            </button>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // 2. Binding dos Eventos
    document.getElementById('btn-tab-insumos')?.addEventListener('click', () => alternarAba('insumos'));
    document.getElementById('btn-tab-custos')?.addEventListener('click', () => alternarAba('custos'));
    document.getElementById('input-busca')?.addEventListener('input', () => renderizarTabelaAtual());
    document.getElementById('btn-adicionar-registro')?.addEventListener('click', iniciarCriacaoNovoItem);

    // Evento de Duplo Clique para Editar a Linha
    const tbody = document.getElementById('tabela-body');
    tbody?.addEventListener('dblclick', (e) => {
        const tr = e.target.closest('tr[data-id]');
        if (tr && !itemEmEdicaoId) {
            iniciarEdicao(tr.dataset.id);
        }
    });

    // 3. Carregar Dados
    carregarDados();
}

// =================================================================
// ANIMAÇÃO E TROCA DE ABAS
// =================================================================

function alternarAba(novaAba) {
    if (abaAtiva === novaAba || carregando) return;

    abaAtiva = novaAba;
    itemEmEdicaoId = null;
    ehNovoItem = false;

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
// REQUISIÇÃO DE DADOS DO BACKEND
// =================================================================

async function carregarDados() {
    carregando = true;
    exibirLoader();

    try {
        const response = await fetch(APPS_SCRIPT_URL);
        const result = await response.json();

        if (result.status === "success") {
            listaInsumos = Array.isArray(result.insumos) ? result.insumos : [];
            listaCustos = Array.isArray(result.custos) ? result.custos : [];
        }
    } catch (error) {
        console.error("Erro ao conectar com o Google Sheets:", error);
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
        if (window.lucide) window.lucide.createIcons();
    }
}

// =================================================================
// RENDERIZAÇÃO E EDIÇÃO EM LINHA
// =================================================================

function renderizarTabelaAtual() {
    const thead = document.getElementById('tabela-head');
    const tbody = document.getElementById('tabela-body');
    const inputBusca = document.getElementById('input-busca');
    const badgeCounter = document.getElementById('counter-total');

    if (!thead || !tbody) return;

    const termoBusca = (inputBusca?.value || '').toLowerCase().trim();

    if (abaAtiva === 'insumos') {
        thead.innerHTML = `
            <tr>
                <th style="width: 50px; text-align: center;">Ação</th>
                <th>ID INS</th>
                <th>Categoria</th>
                <th>Nome do Insumo</th>
                <th>Custo Unitário / Preço (R$)</th>
                <th>Estoque Atual (kg / un)</th>
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
            if (itemEmEdicaoId === item.id) {
                return renderizarLinhaEdicaoInsumo(item);
            }
            return renderizarLinhaNormalInsumo(item);
        }).join('');

        // CORREÇÃO: Renderiza a nova linha com o ID numérico gerado
        if (ehNovoItem && itemEmEdicaoId && itemEmEdicaoId.startsWith('INS_')) {
            htmlRows += renderizarLinhaEdicaoInsumo({
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
                <th style="width: 50px; text-align: center;">Ação</th>
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
            if (itemEmEdicaoId === item.id) {
                return renderizarLinhaEdicaoCusto(item);
            }
            return renderizarLinhaNormalCusto(item);
        }).join('');

        // CORREÇÃO: Renderiza a nova linha com o ID numérico gerado
        if (ehNovoItem && itemEmEdicaoId && itemEmEdicaoId.startsWith('CUS_')) {
            htmlRows += renderizarLinhaEdicaoCusto({
                id: itemEmEdicaoId,
                categoria: 'CUSTOS OPERACIONAIS',
                nome: '',
                unidade: 'R$',
                precoUnidade: 0
            });
        }

        tbody.innerHTML = htmlRows;
    }

    vincularEventosBotoesSalvar();
    if (window.lucide) window.lucide.createIcons();
}

// --- LINHAS VISUAIS (NORMAL vs EDIÇÃO) ---

function renderizarLinhaNormalInsumo(item) {
    const preco = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0);
    const estoque = Number(item.estoque ?? 0);
    const cat = String(item.categoria || 'INSUMOS').toUpperCase();
    
    const unidadeTexto = cat.includes('FILAMENTO') ? `${estoque} kg` : `${estoque} un`;
    const badgeEstoqueClass = estoque <= 0 ? 'stock-badge empty' : estoque < 100 ? 'stock-badge low' : 'stock-badge ok';

    return `
        <tr data-id="${item.id}" class="row-editable" title="Dê duplo clique para editar">
            <td style="text-align: center;"><span class="action-placeholder"><i data-lucide="edit-2"></i></span></td>
            <td><code class="code-id">${item.id || 'N/A'}</code></td>
            <td><span class="badge-categoria">${cat}</span></td>
            <td><strong>${item.nome || 'Sem Nome'}</strong></td>
            <td>R$ ${preco.toFixed(2).replace('.', ',')}</td>
            <td><span class="${badgeEstoqueClass}">${unidadeTexto}</span></td>
        </tr>
    `;
}

function renderizarLinhaEdicaoInsumo(item) {
    const preco = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0);
    const estoque = Number(item.estoque ?? 0);

    return `
        <tr data-id="${item.id}" class="row-editing">
            <td style="text-align: center;">
                <button class="btn-save-row" data-action="salvar" title="Salvar Alterações">
                    <i data-lucide="check"></i>
                </button>
            </td>
            <td><code class="code-id">${item.id}</code></td>
            <td><input type="text" id="edit-cat-${item.id}" class="table-input" value="${item.categoria || ''}" placeholder="Ex: FILAMENTO"></td>
            <td><input type="text" id="edit-nome-${item.id}" class="table-input" value="${item.nome || ''}" placeholder="Nome do insumo"></td>
            <td><input type="number" step="0.01" id="edit-preco-${item.id}" class="table-input" value="${preco}" placeholder="0.00"></td>
            <td><input type="number" step="0.01" id="edit-estoque-${item.id}" class="table-input" value="${estoque}" placeholder="0"></td>
        </tr>
    `;
}

function renderizarLinhaNormalCusto(item) {
    const valor = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0);
    const unidade = String(item.unidade || '').trim();
    const cat = String(item.categoria || 'CUSTOS').toUpperCase();

    let valorFormatado = `R$ ${valor.toFixed(2).replace('.', ',')}`;
    if (unidade.includes('%') || item.id === 'CUS_04') {
        valorFormatado = `${(valor * 100).toFixed(2).replace('.', ',')}%`;
    }

    return `
        <tr data-id="${item.id}" class="row-editable" title="Dê duplo clique para editar">
            <td style="text-align: center;"><span class="action-placeholder"><i data-lucide="edit-2"></i></span></td>
            <td><code class="code-id highlight">${item.id || 'N/A'}</code></td>
            <td><span class="badge-categoria alt">${cat}</span></td>
            <td><strong>${item.nome || 'Sem Nome'}</strong></td>
            <td><span class="badge-unidade">${unidade || 'R$'}</span></td>
            <td><strong class="text-accent">${valorFormatado}</strong></td>
        </tr>
    `;
}

function renderizarLinhaEdicaoCusto(item) {
    const valor = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0);

    return `
        <tr data-id="${item.id}" class="row-editing">
            <td style="text-align: center;">
                <button class="btn-save-row" data-action="salvar" title="Salvar Alterações">
                    <i data-lucide="check"></i>
                </button>
            </td>
            <td><code class="code-id highlight">${item.id}</code></td>
            <td><input type="text" id="edit-cat-${item.id}" class="table-input" value="${item.categoria || ''}" placeholder="Ex: TAXAS"></td>
            <td><input type="text" id="edit-nome-${item.id}" class="table-input" value="${item.nome || ''}" placeholder="Descrição"></td>
            <td><input type="text" id="edit-unidade-${item.id}" class="table-input" value="${item.unidade || ''}" placeholder="Ex: R$/kWh ou %"></td>
            <td><input type="number" step="0.0001" id="edit-preco-${item.id}" class="table-input" value="${valor}" placeholder="0.00"></td>
        </tr>
    `;
}

// =================================================================
// AÇÕES DE EDIÇÃO, CRIAÇÃO E SALVAMENTO
// =================================================================

function iniciarEdicao(id) {
    itemEmEdicaoId = id;
    renderizarTabelaAtual();
}

function iniciarCriacaoNovoItem() {
    if (itemEmEdicaoId) return; // Evita abrir múltipla edição

    ehNovoItem = true;

    if (abaAtiva === 'insumos') {
        const proxNum = listaInsumos.length + 1;
        itemEmEdicaoId = `INS_${String(proxNum).padStart(2, '0')}`;
    } else {
        const proxNum = listaCustos.length + 1;
        itemEmEdicaoId = `CUS_${String(proxNum).padStart(2, '0')}`;
    }

    renderizarTabelaAtual();
}

function vincularEventosBotoesSalvar() {
    const btnSalvar = document.querySelector('.row-editing .btn-save-row');
    if (!btnSalvar) return;

    btnSalvar.addEventListener('click', async (e) => {
        e.preventDefault();
        await salvarRegistroAtual();
    });
}

async function salvarRegistroAtual() {
    const id = itemEmEdicaoId;
    if (!id) return;

    const btnSalvar = document.querySelector('.row-editing .btn-save-row');
    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = `<i data-lucide="loader-2" class="spin-icon"></i>`;
        if (window.lucide) window.lucide.createIcons();
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
        // Envio com 'text/plain' para o Google Apps Script aceitar sem pré-voo CORS
        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        // Atualização Local
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
        console.error("Erro ao salvar no servidor Google Sheets:", error);
    } finally {
        itemEmEdicaoId = null;
        ehNovoItem = false;
        renderizarTabelaAtual();
    }
}