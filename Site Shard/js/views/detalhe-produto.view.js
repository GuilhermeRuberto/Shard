// js/views/detalhe-produto.view.js

// Imagem padrão caso a URL da foto falhe ou venha vazia
const DEFAULT_IMAGE_PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';

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

/** Valida se uma string é uma URL HTTP/HTTPS válida */
function isValidUrl(string) {
    if (!string || typeof string !== 'string') return false;
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
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

// =================================================================
// 1. INICIALIZAÇÃO DA VIEW
// =================================================================

/**
 * Ponto de entrada para exibição dos detalhes de um produto.
 * @param {Object} produto - Objeto de dados do produto selecionado.
 * @param {Function} switchView - Função global de navegação entre views.
 */
export function initDetalheProduto(produto, switchView) {
    const container = document.querySelector('#view-detalhe-produto .view-body') || document.querySelector('.main-content');
    if (!container || !produto) return;

    // Normalização segura dos dados recebidos
    const data = {
        id: String(produto.id || produto.sku || 'N/A').trim(),
        sku: String(produto.sku || produto.id || 'N/A').trim(),
        nome: String(produto.nome || 'Produto sem Nome').trim(),
        categoria: String(produto.categoria || 'Geral').trim(),
        foto: String(produto.foto || '').trim(),
        arquivo: String(produto.arquivo || produto.linkArquivo || '').trim(),
        custoTotalProd: Number(produto.custoTotalProd || produto.custoProd || produto.custoTotal || 0),
        peso: Number(produto.pesoProd || produto.peso || 0),
        tempo: Number(produto.tempoImpressao || produto.tempo || 0),
        estoque: Number(produto.estoque || 0),
        insumos: Array.isArray(produto.insumos || produto.bom) ? (produto.insumos || produto.bom) : []
    };

    // Renderiza o HTML principal
    container.innerHTML = renderLayoutHTML(data);

    // Renderiza ícones Lucide
    refreshIcons();

    // Registra os eventos da página
    bindEvents(data, switchView, container);
}

// =================================================================
// 2. TEMPLATES HTML
// =================================================================

function renderLayoutHTML(produto) {
    const isUrl = isValidUrl(produto.arquivo);

    const nomeEscaped = escapeHtml(produto.nome);
    const skuEscaped = escapeHtml(produto.sku);
    const categoriaEscaped = escapeHtml(produto.categoria);
    const fotoEscaped = escapeHtml(produto.foto || DEFAULT_IMAGE_PLACEHOLDER);
    const arquivoEscaped = escapeHtml(produto.arquivo);

    return `
        <div class="detalhe-page-header">
            <button id="btn-voltar-catalogo" class="btn-secondary">
                <i data-lucide="arrow-left"></i> Voltar ao Catálogo
            </button>
            <div class="header-actions">
                <button class="btn-primary" id="btn-editar-produto">
                    <i data-lucide="pencil"></i> Editar Ficha Técnica
                </button>
            </div>
        </div>

        <div class="detalhe-page-grid">
            <!-- Coluna da Esquerda: Mídia e Arquivos -->
            <div class="detalhe-sidebar-card">
                <div class="detalhe-image-wrapper">
                    <img src="${fotoEscaped}" alt="${nomeEscaped}" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE_PLACEHOLDER}';">
                </div>

                <div class="specs-block">
                    <h3><i data-lucide="box"></i> Arquivos & Identificação</h3>
                    <ul class="specs-list">
                        <li><span>SKU:</span> <strong>${skuEscaped}</strong></li>
                        <li><span>Categoria:</span> <span class="badge-categoria">${categoriaEscaped}</span></li>
                        <li>
                            <span>Arquivo 3D:</span> 
                            ${produto.arquivo ? `
                                <a href="${isUrl ? arquivoEscaped : '#'}" 
                                   target="${isUrl ? '_blank' : '_self'}" 
                                   rel="${isUrl ? 'noopener noreferrer' : ''}"
                                   class="file-link" 
                                   id="btn-download-arquivo">
                                    <i data-lucide="download"></i> ${arquivoEscaped}
                                </a>
                            ` : '<span class="text-muted">Nenhum arquivo anexado</span>'}
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Coluna da Direita: Métricas Técnicas e Tabela BOM -->
            <div class="detalhe-main-content">
                <div class="detalhe-title-block">
                    <h1>${nomeEscaped}</h1>
                    <p class="subtitle">Engenharia do produto, tempo de fatiamento e custo direto de produção (BOM)</p>
                </div>

                <!-- Métricas Técnicas -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <span class="label">Custo Base de Insumos</span>
                        <span class="value text-accent">${formatCurrency(produto.custoTotalProd)}</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Tempo de Produção</span>
                        <span class="value">${formatarTempoExibicao(produto.tempo)}</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Peso Estimado</span>
                        <span class="value">${formatNumber(produto.peso, 3)} kg</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Estoque Físico</span>
                        <span class="value">${produto.estoque} un</span>
                    </div>
                </div>

                <!-- Tabela de Insumos (BOM) -->
                <div class="insumos-block">
                    <h2><i data-lucide="layers"></i> Estrutura de Insumos (BOM / Material Consumido)</h2>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Insumo / Material</th>
                                    <th>Categoria</th>
                                    <th>Quantidade Usada</th>
                                    <th>Custo Unitário</th>
                                    <th>Custo Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${renderInsumosTableRows(produto.insumos)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderInsumosTableRows(insumos) {
    if (!insumos || insumos.length === 0) {
        return `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted, #a1a1aa); padding: 1.5rem;">
                    Nenhum insumo ou custo direto vinculado a este produto.
                </td>
            </tr>
        `;
    }

    return insumos.map(i => {
        const nomeInsumo = escapeHtml(i.nome || i.nomeInsumo || 'Insumo sem nome');
        const categoriaInsumo = escapeHtml(i.categoria || 'Geral');
        const qtd = Number(i.quantidade || 0);
        const custoTotItem = Number(i.custoTotal || i.custoItem || 0);
        const custoUnit = qtd > 0 ? (custoTotItem / qtd) : 0;

        return `
            <tr>
                <td><strong>${nomeInsumo}</strong></td>
                <td><span class="badge-categoria">${categoriaInsumo}</span></td>
                <td>${formatNumber(qtd, 2)}</td>
                <td>${formatCurrency(custoUnit)}</td>
                <td><strong>${formatCurrency(custoTotItem)}</strong></td>
            </tr>
        `;
    }).join('');
}

// =================================================================
// 3. EVENTOS E NAVEGAÇÃO
// =================================================================

function bindEvents(produto, switchView, container) {
    // Voltar para a view do Catálogo
    const btnVoltar = container.querySelector('#btn-voltar-catalogo');
    btnVoltar?.addEventListener('click', () => {
        if (typeof switchView === 'function') switchView('catalogo');
    });

    // Abrir Form/View de Edição do Produto
    const btnEditar = container.querySelector('#btn-editar-produto');
    btnEditar?.addEventListener('click', () => {
        if (typeof switchView === 'function') switchView('cadastro-produto', produto);
    });

    // Manipulador do Link do Arquivo (Exibe alerta amigável se não for URL HTTP/HTTPS)
    const btnDownload = container.querySelector('#btn-download-arquivo');
    if (btnDownload && !isValidUrl(produto.arquivo)) {
        btnDownload.addEventListener('click', (e) => {
            e.preventDefault();
            alert(`Arquivo/Referência anexada: ${produto.arquivo}`);
        });
    }
}