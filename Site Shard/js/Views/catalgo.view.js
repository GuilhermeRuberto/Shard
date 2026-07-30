export function initCatalogo(switchViewCallback) {
    const catalogoBody = document.querySelector('#view-catalogo .view-body');
    if (!catalogoBody) return;

    // Dados de exemplo do estoque
    const produtosEstoque = [
        { id: 1, nome: "Suporte Headset Penrose Edition", sku: "SHD-001", cat: "Acessórios Gamer", estoque: 42, min: 10, preco: "R$ 149,90" },
        { id: 2, nome: "Organizador de Mesa Modular Shard", sku: "SHD-002", cat: "Escritório", estoque: 8, min: 15, preco: "R$ 89,90" },
        { id: 3, nome: "Vaso Geométrico Poligonal V2", sku: "SHD-003", cat: "Decoração", estoque: 27, min: 5, preco: "R$ 64,50" },
        { id: 4, nome: "Case para SSD M.2 Anti-Estática", sku: "SHD-004", cat: "Tecnologia", estoque: 3, min: 10, preco: "R$ 110,00" }
    ];

    catalogoBody.innerHTML = `
        <div class="catalogo-toolbar">
            <div class="search-box">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="search-produto" placeholder="Buscar por nome ou SKU...">
            </div>
            <button id="btn-novo-produto-catalogo" class="btn-primary-shard">
                <i class="fa-solid fa-plus"></i> Novo Produto (BOM)
            </button>
        </div>

        <div class="cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
            ${produtosEstoque.map(prod => `
                <div class="product-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${prod.estoque <= prod.min ? 'var(--color-danger)' : 'var(--color-success)'};"></div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <span style="font-size: 11px; background: rgba(139,92,246,0.15); color: var(--color-primary); padding: 3px 8px; border-radius: 6px; font-weight: 600;">${prod.sku}</span>
                            <span style="font-size: 12px; color: var(--text-secondary);">${prod.cat}</span>
                        </div>
                        <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 12px; font-weight: 600;">${prod.nome}</h3>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 13px;">
                            <span style="color: var(--text-secondary);">Estoque: <strong style="color: ${prod.estoque <= prod.min ? 'var(--color-danger)' : '#fff'};">${prod.estoque} un</strong></span>
                            <span style="font-size: 15px; font-weight: 700; color: var(--color-secondary);">${prod.preco}</span>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-secondary-shard" style="flex: 1; padding: 8px; font-size: 12px;">Detalhes</button>
                            <button style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: var(--color-success); padding: 8px 12px; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-print"></i></button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Evento para o botão de novo produto que troca para a aba de cadastro
    const btnNovo = document.getElementById('btn-novo-produto-catalogo');
    if (btnNovo && typeof switchViewCallback === 'function') {
        btnNovo.addEventListener('click', () => {
            switchViewCallback('cadastro');
        });
    }
}