export function initDetalheProduto(produto, switchView) {
    const container = document.querySelector('#view-detalhe-produto .view-body');
    if (!container || !produto) return;

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
            <!-- Coluna da Esquerda: Mídia e Arquivos de Impressão -->
            <div class="detalhe-sidebar-card">
                <div class="detalhe-image-wrapper">
                    <img src="${produto.foto}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/400/121214/fff?text=Sem+Imagem'">
                </div>

                <div class="specs-block">
                    <h3><i class="fa-solid fa-cube"></i> Arquivos & Identificação</h3>
                    <ul class="specs-list">
                        <li><span>SKU:</span> <strong>${produto.sku}</strong></li>
                        <li><span>Categoria:</span> <span class="badge-categoria">${produto.categoria}</span></li>
                        <li>
                            <span>Arquivo 3D:</span> 
                            <a href="#" class="file-link" onclick="event.preventDefault(); alert('Iniciando download do arquivo ${produto.arquivo}');">
                                <i class="fa-solid fa-download"></i> ${produto.arquivo}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Coluna da Direita: Métricas Estritamente Técnicas e Tabela BOM -->
            <div class="detalhe-main-content">
                <div class="detalhe-title-block">
                    <h1>${produto.nome}</h1>
                    <p class="subtitle">Engenharia do produto, tempo de fatiamento e custo direto de produção (BOM)</p>
                </div>

                <!-- Métricas Técnicas sem Preço de Venda -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <span class="label">Custo Base de Insumos</span>
                        <span class="value text-accent">R$ ${produto.custoTotal.toFixed(2)}</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Tempo de Produção</span>
                        <span class="value">${String(produto.tempoImpressao || 0)} min</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Peso Estimado</span>
                        <span class="value">${String(produto.pesoProd || 0).replace('.', ',')} kg</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Estoque Físico</span>
                        <span class="value">${produto.estoque} un</span>
                    </div>
                </div>

                <div class="insumos-block">
                    <h2><i class="fa-solid fa-layer-group"></i> Estrutura de Insumos (BOM / Material Consumido)</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Insumo / Material</th>
                                <th>Quantidade Usada</th>
                                <th>Custo Unitário</th>
                                <th>Custo Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${produto.insumos.map(i => `
                                <tr>
                                    <td><strong>${i.nome}</strong></td>
                                    <td>${i.quantidade}</td>
                                    <td>${i.custoUnitario}</td>
                                    <td><strong>${i.custoTotal}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Retornar ao Catálogo
    const btnVoltar = container.querySelector('#btn-voltar-catalogo');
    btnVoltar?.addEventListener('click', () => {
        switchView('catalogo');
    });
}