// js/views/cadastro-produto.view.js

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzus-0gell47fkLEfgwHsLd8v1QoG6k_0Qi5fmUyhG_Q2NYjFwCYm5NNKXcQKRyFDA1Vw/exec";

let state = {
    taxasSistema: {},
    perfisEnergia: [],
    listaInsumos: [],
    listaCustos: [],
    dadosCarregados: false,
    carregandoDados: false
};

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
const formatNumber = (val, decimals = 2) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val || 0);

// =================================================================
// INICIALIZAÇÃO
// =================================================================

export function initCadastroProduto(switchView) {
    const container = document.querySelector('#view-cadastro-produto .view-body') || document.querySelector('.main-content');
    if (!container) return;

    resetState();
    container.innerHTML = renderHTML();

    if (window.lucide) window.lucide.createIcons();

    bindEvents(switchView);
    carregarDadosDoSheets();
}

function resetState() {
    state = {
        taxasSistema: {},
        perfisEnergia: [],
        listaInsumos: [],
        listaCustos: [],
        dadosCarregados: false,
        carregandoDados: false
    };
}

// =================================================================
// TEMPLATE HTML
// =================================================================

function renderHTML() {
    return `
        <div class="detalhe-page-header">
            <button id="btn-voltar-catalogo" class="btn-secondary">
                <i data-lucide="arrow-left"></i> Voltar ao Catálogo
            </button>
            <h2>Cadastro de Produto & Ficha Técnica (BOM)</h2>
        </div>

        <form id="productForm">
            <!-- Card 1: Informações do Produto -->
            <div class="card">
                <h3>Informações do Produto</h3>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="nome">Nome do Produto</label>
                        <input type="text" id="nome" placeholder="Ex: Suporte de Headset" required>
                    </div>
                    <div class="form-group">
                        <label for="categoria">Categoria</label>
                        <select id="categoria" required>
                            <option value="">Selecione...</option>
                            <option value="Decoração">Decoração</option>
                            <option value="Utilitários">Utilitários</option>
                            <option value="Prototipagem">Prototipagem</option>
                            <option value="Acessórios">Acessórios</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="tempo">Tempo Estimado (Horas ou HH:MM)</label>
                        <div class="tempo-input-wrapper" style="display: flex; align-items: center; gap: 4px;">
                            <input type="text" id="tempo" placeholder="Ex: 1.5 ou 01:30" required style="flex: 1;" autocomplete="off">
                            <div class="tempo-stepper-btn" style="display: flex; flex-direction: column; gap: 2px;">
                                <button type="button" id="btn-tempo-up" class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" title="Aumentar">▲</button>
                                <button type="button" id="btn-tempo-down" class="btn-secondary" style="padding: 2px 6px; font-size: 10px;" title="Diminuir">▼</button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="foto">URL da Foto</label>
                        <input type="url" id="foto" placeholder="https://link-da-imagem.com/foto.jpg">
                    </div>
                    <div class="form-group full-width">
                        <label for="arquivo">Link do Arquivo 3D (3MF / G-Code / Drive)</label>
                        <input type="url" id="arquivo" placeholder="https://drive.google.com/...">
                    </div>
                </div>
            </div>

            <!-- Card 2: Lista de Materiais (BOM) & Operacional -->
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
                    <h3>Composição Técnica & Insumos (BOM)</h3>
                    <button type="button" id="addInsumoBtn" class="btn-secondary">
                        <i data-lucide="plus"></i> Adicionar Insumo
                    </button>
                </div>

                <div class="table-container">
                    <table class="bom-table">
                        <thead>
                            <tr>
                                <th>Tipo de Insumo</th>
                                <th>Insumo / Material</th>
                                <th>Quantidade (g/un)</th>
                                <th style="width: 50px;">Ação</th>
                            </tr>
                        </thead>
                        <tbody id="bomTbody">
                            <!-- Linhas inseridas dinamicamente -->
                        </tbody>
                    </table>
                </div>

                <!-- Perfil de Energia & Taxas -->
                <div class="fixed-costs-card" style="margin-top: 20px;">
                    <div class="fixed-costs-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <i data-lucide="zap"></i> <span>Perfil Energético da Máquina</span>
                    </div>
                    <div class="fixed-costs-grid">
                        <div class="fixed-cost-item">
                            <label for="perfilEnergia">Perfil de Consumo</label>
                            <select id="perfilEnergia"></select>
                        </div>

                        <div class="rates-display-group" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 10px;">
                            <div class="rate-badge"><span class="rate-title">Tarifa kWh</span><strong id="display-cus01">--</strong></div>
                            <div class="rate-badge"><span class="rate-title">Depreciação/h</span><strong id="display-cus02">--</strong></div>
                            <div class="rate-badge"><span class="rate-title">Manutenção/h</span><strong id="display-cus03">--</strong></div>
                            <div class="rate-badge"><span class="rate-title">Margem Erro</span><strong id="display-cus04">--</strong></div>
                        </div>
                    </div>
                </div>

                <!-- Card de Resumo Financeiro -->
                <div class="totals-summary-card" style="margin-top: 20px; background: #f8fafc; padding: 16px; border-radius: 8px;">
                    <div class="summary-compact" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <span class="label">Peso Total Filamento:</span>
                            <strong id="pesoTotal">0,000 kg</strong>
                        </div>
                        <div>
                            <span class="label">Custo Estimado de Produção:</span>
                            <strong id="custoTotal" style="font-size: 1.25rem; color: #16a34a;">R$ 0,00</strong>
                        </div>
                        <button type="button" id="btnToggleDetalhes" class="btn-secondary" style="font-size: 12px;">
                            <span id="toggleText">+ Detalhes</span>
                        </button>
                    </div>

                    <div id="detalhesCusto" class="summary-details-panel hidden" style="margin-top: 12px; border-top: 1px solid #e2e8f0; pt-3;">
                        <div class="details-grid" style="display: grid; gap: 6px; font-size: 13px; margin-top: 8px;">
                            <div>Insumos Diretos: <strong id="det-insumos">R$ 0,00</strong></div>
                            <div>Energia (<span id="det-kwh-val">0,00</span> kWh): <strong id="det-energia">R$ 0,00</strong></div>
                            <div>Depreciação Máquina: <strong id="det-depreciacao">R$ 0,00</strong></div>
                            <div>Manutenção Preventiva: <strong id="det-manutencao">R$ 0,00</strong></div>
                            <div>Margem de Segurança: <strong id="det-margem">R$ 0,00</strong></div>
                        </div>
                    </div>
                </div>

                <div class="form-actions" style="margin-top: 24px;">
                    <button type="submit" class="btn-primary" style="width: 100%;">
                        <i data-lucide="save"></i> Salvar Produto no Google Sheets
                    </button>
                </div>
            </div>
        </form>
    `;
}

// =================================================================
// EVENTOS & CONTROLES
// =================================================================

function bindEvents(switchView) {
    document.getElementById('btn-voltar-catalogo')?.addEventListener('click', () => switchView('catalogo'));
    document.getElementById('addInsumoBtn')?.addEventListener('click', adicionarLinhaBOM);
    document.getElementById('btnToggleDetalhes')?.addEventListener('click', toggleDetalhesCusto);
    document.getElementById('tempo')?.addEventListener('input', calcularTotais);
    document.getElementById('perfilEnergia')?.addEventListener('change', calcularTotais);
    document.getElementById('productForm')?.addEventListener('submit', salvarProduto);

    configurarControlesTempo();

    const bomTbody = document.getElementById('bomTbody');
    if (bomTbody) {
        bomTbody.addEventListener('change', (e) => {
            if (e.target.classList.contains('bom-tipo')) atualizarDropdownInsumos(e.target);
            else if (e.target.classList.contains('bom-insumo')) calcularTotais();
        });
        bomTbody.addEventListener('input', (e) => {
            if (e.target.classList.contains('bom-qtd')) calcularTotais();
        });
        bomTbody.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remover') || e.target.closest('.btn-remover')) {
                e.target.closest('tr').remove();
                calcularTotais();
            }
        });
    }
}

function configurarControlesTempo() {
    const tempoInput = document.getElementById('tempo');
    if (!tempoInput) return;

    document.getElementById('btn-tempo-up')?.addEventListener('click', () => alterarValorTempo(tempoInput, 1));
    document.getElementById('btn-tempo-down')?.addEventListener('click', () => alterarValorTempo(tempoInput, -1));

    tempoInput.addEventListener('wheel', (e) => {
        e.preventDefault();
        alterarValorTempo(tempoInput, e.deltaY < 0 ? 1 : -1);
    });
}

function alterarValorTempo(input, direcao) {
    let val = input.value.trim() || "0.0";
    if (val.includes(':')) {
        let partes = val.split(':');
        let h = parseInt(partes[0], 10) || 0;
        let m = parseInt(partes[1], 10) || 0;
        m += direcao * 10;
        if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
        else if (m < 0) { h = Math.max(0, h - 1); m = 50; }
        input.value = `${h}:${String(m).padStart(2, '0')}`;
    } else {
        let num = parseFloat(val.replace(',', '.')) || 0;
        num = Math.max(0, num + (direcao * 0.1));
        input.value = num.toFixed(1);
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

// =================================================================
// INTEGRAÇÃO COM SHEETS (API)
// =================================================================

async function carregarDadosDoSheets() {
    if (state.carregandoDados) return;
    state.carregandoDados = true;

    exibirEstadoCarregando("Carregando...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(APPS_SCRIPT_URL, { signal: controller.signal });
        const result = await response.json();

        if (result.status === "success") {
            state.taxasSistema = {};
            state.perfisEnergia = [];
            state.listaInsumos = [];
            state.listaCustos = [];

            (result.insumos || []).forEach(item => {
                if (!item.id) return;
                state.listaInsumos.push({
                    id: String(item.id).trim(),
                    nome: String(item.nome || "").trim(),
                    categoria: String(item.categoria || "INSUMOS").trim().toUpperCase(),
                    precoUnidade: Number(item.precoUnidade ?? item.precoUnit ?? 0) || 0,
                    estoque: Number(item.estoque ?? 0) || 0
                });
            });

            (result.custos || []).forEach(item => {
                if (!item.id) return;
                const id = String(item.id).trim();
                const precoUnidade = Number(item.precoUnidade ?? item.precoUnit ?? 0) || 0;
                
                state.listaCustos.push({ id, nome: item.nome, precoUnidade });

                if (["CUS_01", "CUS_02", "CUS_03", "CUS_04"].includes(id)) {
                    state.taxasSistema[id] = { nome: item.nome, valor: precoUnidade };
                }

                if (id.toUpperCase().startsWith("CUS_05") || id.toUpperCase().startsWith("CUS_06") || (item.unidade || "").endsWith("W")) {
                    state.perfisEnergia.push({ idCus: id, nome: item.nome, watts: precoUnidade });
                }
            });

            state.dadosCarregados = true;
            atualizarBadgesTaxas();
            atualizarSelectPerfilEnergia();

            const tbody = document.getElementById("bomTbody");
            if (tbody) tbody.innerHTML = "";
            adicionarLinhaBOM();
            calcularTotais();
        }
    } catch (error) {
        exibirEstadoCarregando("Erro");
        state.dadosCarregados = true;
        garantirLinhaMinimaBOM();
    } finally {
        clearTimeout(timeoutId);
        state.carregandoDados = false;
    }
}

function garantirLinhaMinimaBOM() {
    if (document.getElementById("bomTbody")?.children.length === 0) adicionarLinhaBOM();
}

function exibirEstadoCarregando(texto) {
    ["display-cus01", "display-cus02", "display-cus03", "display-cus04"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = texto;
    });
}

function atualizarBadgesTaxas() {
    const t = state.taxasSistema;
    document.getElementById("display-cus01").textContent = formatCurrency(t["CUS_01"]?.valor);
    document.getElementById("display-cus02").textContent = formatCurrency(t["CUS_02"]?.valor);
    document.getElementById("display-cus03").textContent = formatCurrency(t["CUS_03"]?.valor);
    document.getElementById("display-cus04").textContent = `${formatNumber((t["CUS_04"]?.valor || 0) * 100)}%`;
}

function atualizarSelectPerfilEnergia() {
    const select = document.getElementById("perfilEnergia");
    if (!select) return;

    select.innerHTML = "";
    if (state.perfisEnergia.length === 0) {
        select.innerHTML = '<option value="PERFIL_DEFAULT" data-watts="0">Perfil Padrão (0W)</option>';
        return;
    }

    state.perfisEnergia.forEach((perfil, index) => {
        const option = document.createElement("option");
        option.value = perfil.idCus || `PERFIL_${index}`;
        option.textContent = `${option.value} - ${perfil.nome} (${perfil.watts}W)`;
        option.dataset.watts = perfil.watts;
        select.appendChild(option);
    });
}

// =================================================================
// CÁLCULOS & BOM
// =================================================================

function adicionarLinhaBOM() {
    const container = document.getElementById("bomTbody");
    if (!container) return;

    const tiposUnicos = [...new Set(state.listaInsumos.map(i => i.categoria))];
    let optionsTipo = '<option value="">Selecione...</option>';
    tiposUnicos.forEach(tipo => { if (tipo) optionsTipo += `<option value="${tipo}">${tipo}</option>`; });

    const tr = document.createElement("tr");
    tr.className = "linha-bom";
    tr.innerHTML = `
        <td><select class="bom-tipo">${optionsTipo}</select></td>
        <td><select class="bom-insumo" disabled><option value="">Selecione o tipo...</option></select></td>
        <td><input type="number" class="bom-qtd" step="any" placeholder="Qtd (g ou un)" required /></td>
        <td><button type="button" class="btn-danger btn-remover" style="padding:4px 8px;">✕</button></td>
    `;
    container.appendChild(tr);
}

function atualizarDropdownInsumos(selectTipo) {
    const tr = selectTipo.closest("tr");
    const selectInsumo = tr.querySelector(".bom-insumo");
    const tipoSelecionado = selectTipo.value;

    selectInsumo.innerHTML = '<option value="">Selecione o Insumo...</option>';

    if (!tipoSelecionado) {
        selectInsumo.disabled = true;
        calcularTotais();
        return;
    }

    const itensFiltrados = state.listaInsumos.filter(i => i.categoria === tipoSelecionado.toUpperCase());
    itensFiltrados.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.id} - ${item.nome} (${formatCurrency(item.precoUnidade)})`;
        option.dataset.preco = item.precoUnidade;
        selectInsumo.appendChild(option);
    });

    selectInsumo.disabled = false;
    calcularTotais();
}

function toggleDetalhesCusto() {
    const painel = document.getElementById("detalhesCusto");
    const texto = document.getElementById("toggleText");
    if (!painel) return;
    const oculto = painel.classList.toggle("hidden");
    if (texto) texto.textContent = oculto ? "+ Detalhes" : "- Ocultar";
}

function extrairHorasDecimais(inputTempo) {
    let texto = String(inputTempo || "").trim().replace(',', '.');
    if (texto.includes(':')) {
        const p = texto.split(':');
        return (parseFloat(p[0]) || 0) + ((parseFloat(p[1]) || 0) / 60);
    }
    return parseFloat(texto) || 0;
}

function calcularTotais() {
    let pesoFilamentosKg = 0;
    let custoMateriais = 0;

    document.querySelectorAll(".linha-bom").forEach(tr => {
        const tipo = tr.querySelector(".bom-tipo")?.value || "";
        const selectInsumo = tr.querySelector(".bom-insumo");
        const qtdInput = parseFloat(tr.querySelector(".bom-qtd")?.value) || 0;

        if (selectInsumo && selectInsumo.value && qtdInput > 0) {
            const precoUnit = parseFloat(selectInsumo.options[selectInsumo.selectedIndex]?.dataset?.preco) || 0;
            let qtdCalculo = qtdInput;

            if (tipo.toLowerCase().includes("filamento")) {
                const pesoKg = qtdInput / 1000;
                pesoFilamentosKg += pesoKg;
                qtdCalculo = pesoKg;
            }
            custoMateriais += (qtdCalculo * precoUnit);
        }
    });

    const horasTotal = extrairHorasDecimais(document.getElementById("tempo")?.value);
    const selectPerfil = document.getElementById("perfilEnergia");
    const watts = parseFloat(selectPerfil?.options[selectPerfil.selectedIndex]?.dataset?.watts) || 0;

    const kwh = (watts / 1000) * horasTotal;
    const t01 = state.taxasSistema["CUS_01"]?.valor || 0;
    const t02 = state.taxasSistema["CUS_02"]?.valor || 0;
    const t03 = state.taxasSistema["CUS_03"]?.valor || 0;
    const t04 = state.taxasSistema["CUS_04"]?.valor || 0;

    const cEnergia = kwh * t01;
    const cDeprec = horasTotal * t02;
    const cManut = horasTotal * t03;
    const subtotal = custoMateriais + cEnergia + cDeprec + cManut;
    const cMargem = subtotal * t04;
    const totalFinal = subtotal + cMargem;

    document.getElementById("pesoTotal").textContent = `${formatNumber(pesoFilamentosKg, 3)} kg`;
    document.getElementById("custoTotal").textContent = formatCurrency(totalFinal);
    document.getElementById("det-insumos").textContent = formatCurrency(custoMateriais);
    document.getElementById("det-kwh-val").textContent = formatNumber(kwh, 2);
    document.getElementById("det-energia").textContent = formatCurrency(cEnergia);
    document.getElementById("det-depreciacao").textContent = formatCurrency(cDeprec);
    document.getElementById("det-manutencao").textContent = formatCurrency(cManut);
    document.getElementById("det-margem").textContent = formatCurrency(cMargem);
}

// =================================================================
// SUBMISSÃO
// =================================================================

async function salvarProduto(event) {
    event.preventDefault();
    const btnSubmit = document.querySelector("#productForm button[type='submit']");
    if (!btnSubmit || btnSubmit.disabled) return;

    btnSubmit.disabled = true;
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<span>Enviando...</span>`;

    try {
        const horasTotal = extrairHorasDecimais(document.getElementById("tempo")?.value);
        const selectPerfil = document.getElementById("perfilEnergia");
        const watts = parseFloat(selectPerfil?.options[selectPerfil.selectedIndex]?.dataset?.watts) || 0;
        const kwhConsumido = Number(((watts / 1000) * horasTotal).toFixed(4));

        const bom = [];
        let pesoFilamentosKg = 0;

        document.querySelectorAll(".linha-bom").forEach(tr => {
            const selectInsumo = tr.querySelector(".bom-insumo");
            const itemId = selectInsumo?.value;
            const categoria = tr.querySelector(".bom-tipo")?.value || "";
            const qtdInput = parseFloat(tr.querySelector(".bom-qtd")?.value) || 0;

            if (itemId && qtdInput > 0) {
                let qtdFinal = qtdInput;
                if (categoria.toLowerCase().includes("filamento")) {
                    qtdFinal = Number((qtdInput / 1000).toFixed(4));
                    pesoFilamentosKg += qtdFinal;
                }
                bom.push({
                    id: itemId,
                    categoria: categoria.toUpperCase(),
                    quantidade: qtdFinal
                });
            }
        });

        if (kwhConsumido > 0) bom.push({ idCus: "CUS_01", quantidade: kwhConsumido });
        if (horasTotal > 0) {
            bom.push({ idCus: "CUS_02", quantidade: horasTotal });
            bom.push({ idCus: "CUS_03", quantidade: horasTotal });
        }

        const payload = {
            produto: {
                nome: document.getElementById("nome")?.value,
                categoria: document.getElementById("categoria")?.value,
                foto: document.getElementById("foto")?.value,
                arquivo: document.getElementById("arquivo")?.value,
                tempoImpressao: Number(horasTotal.toFixed(2)),
                pesoProd: Number(pesoFilamentosKg.toFixed(3))
            },
            bom
        };

        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.status === "success") {
            alert(`✅ Produto registrado com sucesso!\nSKU: ${result.sku || 'N/A'}`);
            document.getElementById("productForm").reset();
            document.getElementById("bomTbody").innerHTML = "";
            adicionarLinhaBOM();
            calcularTotais();
        } else {
            alert(`❌ Erro: ${result.message}`);
        }
    } catch (err) {
        alert("❌ Erro de conexão com o servidor: " + err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        if (window.lucide) window.lucide.createIcons();
    }
}