// =================================================================
// 🔗 CONFIGURAÇÃO DA CONEXÃO COM O GOOGLE SHEETS
// Cole aqui a URL do seu Web App implantado no Google Apps Script
// =================================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzus-0gell47fkLEfgwHsLd8v1QoG6k_0Qi5fmUyhG_Q2NYjFwCYm5NNKXcQKRyFDA1Vw/exec';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os ícones do Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Elementos do DOM
    const addInsumoBtn = document.getElementById('addInsumoBtn');
    const bomTbody = document.getElementById('bomTbody');
    const productForm = document.getElementById('productForm');
    const submitBtn = productForm.querySelector('button[type="submit"]');

    // Totais na Tela
    const pesoTotalEl = document.getElementById('pesoTotal');
    const custoProdEl = document.getElementById('custoProd');
    const custoTotalEl = document.getElementById('custoTotal');

    // 1. Cálculo dos Totais
    function calcularTotais() {
        let pesoTotal = 0;
        let custoDireto = 0;

        const rows = bomTbody.querySelectorAll('tr');
        rows.forEach(row => {
            const tipo = row.querySelector('.insumo-tipo')?.value || '';
            const qtd = parseFloat(row.querySelector('.insumo-qtd')?.value) || 0;
            const custoUnitario = parseFloat(row.querySelector('.insumo-custo')?.value) || 0;

            if (tipo === 'Filamento') {
                pesoTotal += qtd;
            }

            custoDireto += qtd * custoUnitario;
        });

        if (pesoTotalEl) pesoTotalEl.textContent = `${pesoTotal.toFixed(3)} kg`;
        if (custoProdEl) custoProdEl.textContent = `R$ ${custoDireto.toFixed(2).replace('.', ',')}`;
        
        // Margem/Taxa estimada de exemplo
        const custoComMargem = custoDireto * 1.5; 
        if (custoTotalEl) custoTotalEl.textContent = `R$ ${custoComMargem.toFixed(2).replace('.', ',')}`;
    }

    // 2. Adicionar Linha na Tabela BOM
    function adicionarLinhaInsumo() {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>
                <select class="insumo-tipo" required>
                    <option value="Filamento">Filamento (kg)</option>
                    <option value="Horas Maquina">Horas Máquina (h)</option>
                    <option value="Componente">Componente / Insumo (un)</option>
                    <option value="Acabamento">Acabamento / Embalagem (un)</option>
                </select>
            </td>
            <td>
                <input type="text" class="insumo-nome" placeholder="Ex: PLA Preto" required>
            </td>
            <td>
                <input type="number" step="0.001" min="0" class="insumo-qtd" placeholder="0.000" required>
            </td>
            <td>
                <input type="number" step="0.01" min="0" class="insumo-custo" placeholder="0.00" required>
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn-danger remove-row-btn">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;

        // Evento de Remoção
        tr.querySelector('.remove-row-btn').addEventListener('click', () => {
            tr.remove();
            calcularTotais();
        });

        // Eventos para Recálculo Dinâmico
        tr.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', calcularTotais);
            input.addEventListener('change', calcularTotais);
        });

        bomTbody.appendChild(tr);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Event Listener: Botão Adicionar Insumo
    if (addInsumoBtn) {
        addInsumoBtn.addEventListener('click', adicionarLinhaInsumo);
    }

    // Cria a primeira linha vazia por padrão
    adicionarLinhaInsumo();

    // 3. Envio para o Google Sheets (Fetch API)
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (APPS_SCRIPT_URL === 'COLE_SUA_URL_DO_APPS_SCRIPT_AQUI') {
                alert('Cole a URL do seu Google Apps Script na variável APPS_SCRIPT_URL no início do script.js!');
                return;
            }

            // Coleta Dados do Produto Pai
            const produtoPai = {
                nome: document.getElementById('nome').value,
                categoria: document.getElementById('categoria').value,
                tempoEstimado: document.getElementById('tempo').value,
                fotoUrl: document.getElementById('foto').value,
                arquivoUrl: document.getElementById('arquivo').value,
                pesoTotal: pesoTotalEl ? pesoTotalEl.textContent : '0 kg',
                custoDireto: custoProdEl ? custoProdEl.textContent : 'R$ 0,00',
                custoFinal: custoTotalEl ? custoTotalEl.textContent : 'R$ 0,00'
            };

            // Coleta Insumos (BOM)
            const insumos = [];
            const rows = bomTbody.querySelectorAll('tr');
            rows.forEach(row => {
                insumos.push({
                    tipo: row.querySelector('.insumo-tipo').value,
                    nome: row.querySelector('.insumo-nome').value,
                    quantidade: parseFloat(row.querySelector('.insumo-qtd').value) || 0,
                    custoEstimado: parseFloat(row.querySelector('.insumo-custo').value) || 0
                });
            });

            // Monta o Pacote Completo
            const payload = {
                produto: produtoPai,
                bom: insumos
            };

            // Feedback visual no botão durante o envio
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Enviando para o Google Sheets...';
            if (typeof lucide !== 'undefined') lucide.createIcons();

            try {
                // Envia requisição POST
                const response = await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Evita problemas de preflight CORS no Apps Script
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (result.status === 'success' || result.result === 'success') {
                    alert('✅ Produto e composição salvos com sucesso no Google Sheets!');
                    productForm.reset();
                    bomTbody.innerHTML = '';
                    adicionarLinhaInsumo();
                    calcularTotais();
                } else {
                    alert('⚠️ Erro ao salvar: ' + (result.message || 'Verifique o script no Sheets.'));
                }

            } catch (error) {
                console.error('Erro ao conectar com Apps Script:', error);
                alert('❌ Erro de conexão com o Google Sheets. Verifique o console ou a URL configurada.');
            } finally {
                // Restaura o botão
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
    }
});