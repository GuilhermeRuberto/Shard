// js/views/detalhe-produto.view.js

export function initDetalheProduto(produto, switchView) {
    const container = document.querySelector('#view-detalhe-produto .view-body') || document.querySelector('.main-content');
    if (!container || !produto) return;

    // Normalização segura de dados numéricos
    const custoTotalProd = Number(produto.custoProd || produto.custoTotal || 0);
    const peso = Number(produto.pesoProd || 0);
    const tempo = Number(produto.tempoImpressao || 0);
    const estoque = Number(produto.estoque || 0);
    const insumos = Array.isArray(produto.insumos) ? produto.insumos : [];

    container.innerHTML = `
        <div class="detalhe-page-header">
            <button id="btn-voltar-catalogo" class="btn-secondary">
                <i class="fa-solid fa-arrow-left"></i> Voltar ao Catálogo
            </button>
            <div class="header-actions">
                <button class="btn-primary" id="btn-editar-produto">
                    <i class="fa-solid fa-pen"></i> Editar Ficha Técnica
                </button>
            </div>
        </div>

        <div class="detalhe-page-grid">
            <!-- Coluna da Esquerda: Mídia e Arquivos -->
            <div class="detalhe-sidebar-card">
                <div class="detalhe-image-wrapper">
                    <img src="${produto.foto || ''}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/400/121214/fff?text=Sem+Imagem'">
                </div>

                <div class="specs-block">
                    <h3><i class="fa-solid fa-cube"></i> Arquivos & Identificação</h3>
                    <ul class="specs-list">
                        <li><span>SKU:</span> <strong>${produto.sku || produto.id || 'N/A'}</strong></li>
                        <li><span>Categoria:</span> <span class="badge-categoria">${produto.categoria || 'Geral'}</span></li>
                        <li>
                            <span>Arquivo 3D:</span> 
                            ${produto.arquivo ? `
                                <a href="${produto.arquivo.startsWith('http') ? produto.arquivo : '#'}" 
                                   target="${produto.arquivo.startsWith('http') ? '_blank' : '_self'}" 
                                   class="file-link" 
                                   id="btn-download-arquivo">
                                    <i class="fa-solid fa-download"></i> ${produto.arquivo}
                                </a>
                            ` : '<span class="text-muted">Nenhum arquivo anexado</span>'}
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Coluna da Direita: Métricas Técnicas e Tabela BOM -->
            <div class="detalhe-main-content">
                <div class="detalhe-title-block">
                    <h1>${produto.nome}</h1>
                    <p class="subtitle">Engenharia do produto, tempo de fatiamento e custo direto de produção (BOM)</p>
                </div>

                <!-- Métricas Técnicas -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <span class="label">Custo Base de Insumos</span>
                        <span class="value text-accent">R$ ${custoTotalProd.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Tempo de Produção</span>
                        <span class="value">${formatarTempoExibicao(tempo)}</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Peso Estimado</span>
                        <span class="value">${peso.toFixed(1).replace('.', ',')} g</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Estoque Físico</span>
                        <span class="value">${estoque} un</span>
                    </div>
                </div>

                <!-- Tabela de Insumos (BOM) -->
                <div class="insumos-block">
                    <h2><i class="fa-solid fa-layer-group"></i> Estrutura de Insumos (BOM / Material Consumido)</h2>
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
                            ${insumos.length > 0 ? insumos.map(i => {
                                const qtd = Number(i.quantidade || 0);
                                const custoTotItem = Number(i.custoTotal || i.custoItem || 0);
                                const custoUnit = qtd > 0 ? (custoTotItem / qtd) : 0;

                                return `
                                    <tr>
                                        <td><strong>${i.nome || i.nomeInsumo || 'Insumo sem nome'}</strong></td>
                                        <td><span class="badge-categoria">${i.categoria || 'Geral'}</span></td>
                                        <td>${qtd}</td>
                                        <td>R$ ${custoUnit.toFixed(2).replace('.', ',')}</td>
                                        <td><strong>R$ ${custoTotItem.toFixed(2).replace('.', ',')}</strong></td>
                                    </tr>
                                `;
                            }).join('') : `
                                <tr>
                                    <td colspan="5" style="text-align: center; color: var(--text-muted, #a1a1aa); padding: 1.5rem;">
                                        Nenhum insumo ou custo direto vinculado a este produto.
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Bind dos Eventos da Tela
    bindEvents(produto, switchView, container);
}

// =================================================================
// EVENTOS & NAVEGAÇÃO
// =================================================================

function bindEvents(produto, switchView, container) {
    // Voltar para o Catálogo
    const btnVoltar = container.querySelector('#btn-voltar-catalogo');
    btnVoltar?.addEventListener('click', () => {
        if (typeof switchView === 'function') switchView('catalogo');
    });

    // Abrir Edição
    const btnEditar = container.querySelector('#btn-editar-produto');
    btnEditar?.addEventListener('click', () => {
        if (typeof switchView === 'function') switchView('cadastro-produto', produto);
    });

    // Alerta caso o link do arquivo não seja uma URL válida
    const btnDownload = container.querySelector('#btn-download-arquivo');
    if (btnDownload && !produto.arquivo?.startsWith('http')) {
        btnDownload.addEventListener('click', (e) => {
            e.preventDefault();
            alert(`Arquivo anexado: ${produto.arquivo}`);
        });
    }
}

// Helper para formatar o tempo em Horas e Minutos
function formatarTempoExibicao(tempoHoras) {
    if (!tempoHoras || isNaN(tempoHoras)) return "0h";
    const num = Number(tempoHoras);
    const hrs = Math.floor(num);
    const mins = Math.round((num - hrs) * 60);

    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    if (mins > 0) return `${mins}m`;
    return `${num.toFixed(1)}h`;
}