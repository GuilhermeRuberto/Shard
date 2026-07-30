export function initCadastro(switchViewCallback) {
    const cadastroBody = document.querySelector('#view-cadastro .view-body');
    if (!cadastroBody) return;

    cadastroBody.innerHTML = `
        <div class="form-container-shard">
            <form id="form-novo-produto">
                <div class="form-row">
                    <div class="form-col" style="flex: 2;">
                        <label class="form-label">Nome do Produto Acabado</label>
                        <input type="text" class="form-input" placeholder="Ex: Suporte de Monitor Ergonômico" required>
                    </div>
                    <div class="form-col" style="flex: 1;">
                        <label class="form-label">SKU / Código Único</label>
                        <input type="text" class="form-input" placeholder="Ex: SHD-994" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-col">
                        <label class="form-label">Categoria</label>
                        <select class="form-select">
                            <option>Acessórios Gamer</option>
                            <option>Escritório & Corporativo</option>
                            <option>Decoração 3D</option>
                            <option>Tecnologia e Hardware</option>
                        </select>
                    </div>
                    <div class="form-col">
                        <label class="form-label">Tempo de Fabricação (h)</label>
                        <input type="number" step="0.1" value="2.5" class="form-input">
                    </div>
                    <div class="form-col">
                        <label class="form-label">Preço de Venda Sugerido</label>
                        <input type="text" class="form-input" placeholder="R$ 0,00">
                    </div>
                </div>

                <h4 class="form-section-title">Composição de Insumos (BOM)</h4>
                <div class="bom-item">
                    <span class="bom-item-name">Filamento PLA Premium Prata (180g)</span>
                    <span class="bom-item-cost">R$ 21,60</span>
                </div>
                <div class="bom-item">
                    <span class="bom-item-name">Parafusos M4 Inox (Kit com 4)</span>
                    <span class="bom-item-cost">R$ 3,20</span>
                </div>

                <div class="form-actions">
                    <button type="button" id="btn-cancelar-cadastro" class="btn-secondary-shard">Cancelar</button>
                    <button type="submit" class="btn-success-shard">Salvar e Cadastrar</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('btn-cancelar-cadastro').addEventListener('click', () => {
        if (typeof switchViewCallback === 'function') switchViewCallback('catalogo');
    });

    document.getElementById('form-novo-produto').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Produto cadastrado com sucesso no ERP!');
        if (typeof switchViewCallback === 'function') switchViewCallback('catalogo');
    });
}