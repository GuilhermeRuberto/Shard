// js/views/cadastro-produto.view.js

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzus-0gell47fkLEfgwHsLd8v1QoG6k_0Qi5fmUyhG_Q2NYjFwCYm5NNKXcQKRyFDA1Vw/exec";

let TAXAS_SISTEMA = {};
let PERFIS_ENERGIA = [];
let LISTA_INSUMOS = [];
let LISTA_CUSTOS = [];
let dadosCarregados = false;
let carregandoDados = false;

export function initCadastroProduto(switchView) {
    const container = document.querySelector('#view-cadastro-produto .view-body') || document.querySelector('.main-content');
    if (!container) return;

    // 1. Renderização do HTML no Container da View
    container.innerHTML = `
        <div class="detalhe-page-header">
            <button id="btn-voltar-catalogo" class="btn-secondary">
                <i data-lucide="arrow-left"></i> Voltar ao Catálogo
            </button>
            <h2>Cadastro de Produto & Ficha Técnica</h2>
        </div>

        <form id="productForm">
            <!-- Card 1: Informações do Produto Pai -->
            <div class="card">
                <h3>Informações do Produto (Pai)</h3>
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
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="tempo">Tempo Estimado (Horas / HH:MM)</label>
                        <input type="text" id="tempo" placeholder="Ex: 2.5 ou 02:30" required>
                    </div>
                    <div class="form-group">
                        <label for="foto">URL da Foto</label>
                        <input type="url" id="foto" placeholder="https://link-da-imagem.com">
                    </div>
                    <div class="form-group full-width">
                        <label for="arquivo">Link do Arquivo 3D (3MF / G-Code / Drive)</label>
                        <input type="url" id="arquivo" placeholder="https://drive.google.com/...">
                    </div>
                </div>
            </div>

            <!-- Card 2: Composição Técnica & BOM -->
            <div class="card">
                <div class="card-header">
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
                                <th>Nome do Insumo</th>
                                <th>Quantidade (g/un)</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody id="bomTbody">
                            <!-- Linhas dinâmicas via JS -->
                        </tbody>
                    </table>
                </div>

                <!-- Configuração de Energia & Valores do Banco -->
                <div class="fixed-costs-card">
                    <div class="fixed-costs-header">
                        <i data-lucide="zap"></i> <span>Perfil Energético da Máquina</span>
                    </div>
                    <div class="fixed-costs-grid">
                        <div class="fixed-cost-item">
                            <label for="perfilEnergia">Perfil de Consumo</label>
                            <select id="perfilEnergia"></select>
                        </div>

                        <!-- Taxas Fixas Operacionais -->
                        <div class="rates-display-group">
                            <div class="rate-badge">
                                <span class="rate-title">Tarifa kWh (CUS_01)</span>
                                <strong id="display-cus01">Carregando...</strong>
                            </div>
                            <div class="rate-badge">
                                <span class="rate-title">Depreciação/h (CUS_02)</span>
                                <strong id="display-cus02">Carregando...</strong>
                            </div>
                            <div class="rate-badge">
                                <span class="rate-title">Manutenção/h (CUS_03)</span>
                                <strong id="display-cus03">Carregando...</strong>
                            </div>
                            <div class="rate-badge">
                                <span class="rate-title">Margem Erro (CUS_04)</span>
                                <strong id="display-cus04">Carregando...</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Resumo dos Totais -->
                <div class="totals-summary-card">
                    <div class="summary-compact">
                        <div class="compact-item">
                            <span class="label">Peso Total (Filamentos):</span>
                            <strong id="pesoTotal" class="value">0.000 kg</strong>
                        </div>
                        <div class="compact-item highlight">
                            <span class="label">Custo Total de Produção:</span>
                            <strong id="custoTotal" class="value-highlight">R$ 0,00</strong>
                        </div>
                        <button type="button" id="btnToggleDetalhes" class="btn-toggle-details">
                            <span id="toggleText">+ Detalhes da Composição</span>
                            <i data-lucide="chevron-down" id="toggleIcon"></i>
                        </button>
                    </div>

                    <!-- Detalhamento Completo Expansível -->
                    <div id="detalhesCusto" class="summary-details-panel hidden">
                        <div class="details-grid">
                            <div class="detail-row">
                                <span>Material / Insumos Diretos:</span>
                                <strong id="det-insumos">R$ 0,00</strong>
                            </div>
                            <div class="detail-row">
                                <span>Consumo de Energia (<span id="det-kwh-val">0.00</span> kWh):</span>
                                <strong id="det-energia">R$ 0,00</strong>
                            </div>
                            <div class="detail-row">
                                <span>Depreciação de Máquina:</span>
                                <strong id="det-depreciacao">R$ 0,00</strong>
                            </div>
                            <div class="detail-row">
                                <span>Manutenção Preventiva:</span>
                                <strong id="det-manutencao">R$ 0,00</strong>
                            </div>
                            <div class="detail-row error-margin">
                                <span>Margem de Seguridade/Erro:</span>
                                <strong id="det-margem">R$ 0,00</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions" style="margin-top: 20px;">
                    <button type="submit" class="btn-primary">
                        <i data-lucide="save"></i> Salvar e Enviar para o Google Sheets
                    </button>
                </div>
            </div>
        </form>
    `;

    if (window.lucide) window.lucide.createIcons();

    // 2. Registro de Eventos da View
    document.getElementById('btn-voltar-catalogo')?.addEventListener('click', () => switchView('catalogo'));
    document.getElementById('addInsumoBtn')?.addEventListener('click', adicionarLinhaBOM);
    document.getElementById('btnToggleDetalhes')?.addEventListener('click', toggleDetalhesCusto);
    document.getElementById('tempo')?.addEventListener('input', calcularTotais);
    document.getElementById('perfilEnergia')?.addEventListener('change', calcularTotais);
    document.getElementById('productForm')?.addEventListener('submit', salvarProduto);

    // Delegação de eventos para as linhas dinâmicas da tabela BOM
    const bomTbody = document.getElementById('bomTbody');
    bomTbody?.addEventListener('change', (e) => {
        if (e.target.classList.contains('bom-tipo')) {
            atualizarDropdownInsumos(e.target);
        } else if (e.target.classList.contains('bom-insumo')) {
            calcularTotais();
        }
    });

    bomTbody?.addEventListener('input', (e) => {
        if (e.target.classList.contains('bom-qtd')) {
            calcularTotais();
        }
    });

    bomTbody?.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remover')) {
            e.target.closest('tr').remove();
            calcularTotais();
        }
    });

    // 3. Carregar Insumos e Configurações do Sheets
    carregarDadosDoSheets();
}

// =================================================================
// LÓGICA DE NEGÓCIO E INTEGRAÇÃO GOOGLE SHEETS
// =================================================================

async function carregarDadosDoSheets() {
    if (carregandoDados) return;
    carregandoDados = true;

    if (!APPS_SCRIPT_URL || !APPS_SCRIPT_URL.trim().startsWith("https://script.google.com")) {
        exibirEstadoCarregando("Sem URL");
        dadosCarregados = true;
        carregandoDados = false;
        if (document.getElementById("bomTbody")?.children.length === 0) adicionarLinhaBOM();
        calcularTotais();
        return;
    }

    exibirEstadoCarregando("Carregando...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(APPS_SCRIPT_URL, { signal: controller.signal });
        const result = await response.json();

        if (result.status === "success") {
            TAXAS_SISTEMA = {};
            PERFIS_ENERGIA = [];
            LISTA_INSUMOS = [];
            LISTA_CUSTOS = [];

            const insumos = Array.isArray(result.insumos) ? result.insumos : [];
            const custos = Array.isArray(result.custos) ? result.custos : [];

            insumos.forEach(item => {
                const id = String(item.id || "").trim();
                if (!id) return;

                const nome = String(item.nome || "").trim();
                const categoria = String(item.categoria || "Insumos").trim() || "Insumos";
                const precoUnidade = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0) || 0;
                const estoqueQuantidade = Number(item.estoque ?? 0) || 0;

                LISTA_INSUMOS.push({
                    id,
                    nome,
                    categoria,
                    precoUnidade,
                    estoque: estoqueQuantidade
                });
            });

            custos.forEach(item => {
                const id = String(item.id || "").trim();
                if (!id) return;

                const nome = String(item.nome || "").trim();
                const categoria = String(item.categoria || "Custos").trim() || "Custos";
                const precoUnidade = Number(item.precoUnidade ?? item.precoUnit ?? item.preco ?? 0) || 0;

                LISTA_CUSTOS.push({
                    id,
                    nome,
                    categoria,
                    precoUnidade
                });

                if (["CUS_01", "CUS_02", "CUS_03", "CUS_04"].includes(id)) {
                    TAXAS_SISTEMA[id] = {
                        nome: nome || `Taxa ${id}`,
                        valor: precoUnidade
                    };
                }
            });

            dadosCarregados = true;
            atualizarBadgesTaxas();

            const tbody = document.getElementById("bomTbody");
            if (tbody) tbody.innerHTML = "";
            adicionarLinhaBOM();
            calcularTotais();
        } else {
            exibirEstadoCarregando("Erro planilha");
        }
    } catch (error) {
        exibirEstadoCarregando("Erro conexão");
        dadosCarregados = true;
        if (document.getElementById("bomTbody")?.children.length === 0) adicionarLinhaBOM();
        calcularTotais();
    } finally {
        clearTimeout(timeoutId);
        carregandoDados = false;
    }
}

function exibirEstadoCarregando(texto) {
    ["display-cus01", "display-cus02", "display-cus03", "display-cus04"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = texto;
    });
}

function atualizarBadgesTaxas() {
    const el01 = document.getElementById("display-cus01");
    const el02 = document.getElementById("display-cus02");
    const el03 = document.getElementById("display-cus03");
    const el04 = document.getElementById("display-cus04");

    if (el01) el01.textContent = TAXAS_SISTEMA["CUS_01"] ? "R$ " + TAXAS_SISTEMA["CUS_01"].valor.toFixed(2).replace(".", ",") : "R$ 0,00";
    if (el02) el02.textContent = TAXAS_SISTEMA["CUS_02"] ? "R$ " + TAXAS_SISTEMA["CUS_02"].valor.toFixed(2).replace(".", ",") : "R$ 0,00";
    if (el03) el03.textContent = TAXAS_SISTEMA["CUS_03"] ? "R$ " + TAXAS_SISTEMA["CUS_03"].valor.toFixed(2).replace(".", ",") : "R$ 0,00";
    if (el04) el04.textContent = TAXAS_SISTEMA["CUS_04"] ? (TAXAS_SISTEMA["CUS_04"].valor * 100).toFixed(2).replace(".", ",") + "%" : "0,00%";
}

function atualizarSelectPerfilEnergia() {
    const select = document.getElementById("perfilEnergia");
    if (!select) return;

    select.innerHTML = "";
    if (PERFIS_ENERGIA.length === 0) {
        select.innerHTML = '<option value="PERFIL_DEFAULT">Perfil Padrão (0W)</option>';
        return;
    }

    PERFIS_ENERGIA.forEach((perfil, index) => {
        const option = document.createElement("option");
        option.value = perfil.idCus || `PERFIL_${index}`;
        option.textContent = `${option.value} - ${perfil.nome} (~${perfil.watts}W)`;
        option.dataset.watts = perfil.watts;
        select.appendChild(option);
    });
}

function adicionarLinhaBOM() {
    const container = document.getElementById("bomTbody");
    if (!container) return;

    if (!dadosCarregados) {
        alert("Aguarde o carregamento dos dados da planilha antes de adicionar insumos.");
        return;
    }

    const itensDisponiveis = [...LISTA_INSUMOS, ...LISTA_CUSTOS];
    const tiposUnicos = [...new Set(itensDisponiveis.map(item => item.categoria || item.tipo))];
    let optionsTipo = '<option value="">Selecione...</option>';
    tiposUnicos.forEach(tipo => {
        optionsTipo += `<option value="${tipo}">${tipo}</option>`;
    });

    const tr = document.createElement("tr");
    tr.className = "linha-bom";
    tr.innerHTML = `
        <td>
            <select class="bom-tipo">${optionsTipo}</select>
        </td>
        <td>
            <select class="bom-insumo" disabled>
                <option value="">Selecione o tipo primeiro...</option>
            </select>
        </td>
        <td>
            <input type="number" class="bom-qtd" step="any" placeholder="Ex: 150 (g) ou 1 (un)" required />
        </td>
        <td>
            <button type="button" class="btn-danger btn-remover">❌</button>
        </td>
    `;
    container.appendChild(tr);
}

function atualizarDropdownInsumos(selectTipo) {
    const tr = selectTipo.closest("tr");
    const selectInsumo = tr.querySelector(".bom-insumo");
    const inputQtd = tr.querySelector(".bom-qtd");
    const tipoSelecionado = selectTipo.value;

    selectInsumo.innerHTML = '<option value="">Selecione o Insumo...</option>';

    if (!tipoSelecionado) {
        selectInsumo.disabled = true;
        calcularTotais();
        return;
    }

    inputQtd.placeholder = tipoSelecionado.toLowerCase().includes("filamento") ? "Ex: 150 (gramas)" : "Ex: 1 ou 4 (unidades)";

    const itensDisponiveis = [...LISTA_INSUMOS, ...LISTA_CUSTOS];
    const itensFiltrados = itensDisponiveis.filter(item => (item.categoria || item.tipo) === tipoSelecionado);
    itensFiltrados.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.id} - ${item.nome} (${item.categoria}) - R$ ${Number(item.precoUnidade || item.precoUnit || 0).toFixed(2)}`;
        option.dataset.preco = item.precoUnidade ?? item.precoUnit ?? 0;
        selectInsumo.appendChild(option);
    });

    selectInsumo.disabled = false;
    calcularTotais();
}

function toggleDetalhesCusto() {
    const painel = document.getElementById("detalhesCusto");
    const texto = document.getElementById("toggleText");
    const icone = document.getElementById("toggleIcon");

    if (!painel) return;

    const estaOculto = painel.classList.contains("hidden");
    if (estaOculto) {
        painel.classList.remove("hidden");
        if (texto) texto.textContent = "- Ocultar Detalhes";
        if (icone) icone.style.transform = "rotate(180deg)";
    } else {
        painel.classList.add("hidden");
        if (texto) texto.textContent = "+ Detalhes da Composição";
        if (icone) icone.style.transform = "rotate(0deg)";
    }
}

function extrairHorasDecimais(inputTempo) {
    if (!inputTempo) return 0;
    let texto = String(inputTempo).trim().replace(',', '.');

    if (texto.includes(':')) {
        const partes = texto.split(':');
        return (parseFloat(partes[0]) || 0) + ((parseFloat(partes[1]) || 0) / 60) + ((parseFloat(partes[2]) || 0) / 3600);
    }
    return parseFloat(texto) || 0;
}

function converterHorasParaHHMMSS(horasDecimais) {
    if (!horasDecimais || isNaN(horasDecimais) || horasDecimais <= 0) return "00:00:00";
    const totalSegundos = Math.round(horasDecimais * 3600);
    const h = String(Math.floor(totalSegundos / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSegundos % 3600) / 60)).padStart(2, '0');
    const s = String(totalSegundos % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function obterWattsPerfilSelecionado(selectPerfil) {
    if (!selectPerfil) return 0;
    const perfilId = String(selectPerfil.value || "").trim();
    const perfil = PERFIS_ENERGIA.find(item => String(item.idCus || "").toUpperCase() === perfilId.toUpperCase());
    if (perfil && perfil.watts) return Number(perfil.watts) || 0;
    return parseFloat(selectPerfil.options[selectPerfil.selectedIndex]?.dataset?.watts) || 0;
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
            let qtdParaCalculo = qtdInput;

            if (tipo.toLowerCase().includes("filamento")) {
                const pesoKg = qtdInput / 1000;
                pesoFilamentosKg += pesoKg;
                qtdParaCalculo = pesoKg;
            }
            custoMateriais += (qtdParaCalculo * precoUnit);
        }
    });

    const custoTotalFinal = custoMateriais;

    if (document.getElementById("pesoTotal")) document.getElementById("pesoTotal").textContent = pesoFilamentosKg.toFixed(3) + " kg";
    if (document.getElementById("custoTotal")) document.getElementById("custoTotal").textContent = "R$ " + custoTotalFinal.toFixed(2).replace(".", ",");
    if (document.getElementById("det-insumos")) document.getElementById("det-insumos").textContent = "R$ " + custoMateriais.toFixed(2).replace(".", ",");
    if (document.getElementById("det-kwh-val")) document.getElementById("det-kwh-val").textContent = kwhConsumido.toFixed(2);
    if (document.getElementById("det-energia")) document.getElementById("det-energia").textContent = "R$ " + custoEnergia.toFixed(2).replace(".", ",");
    if (document.getElementById("det-depreciacao")) document.getElementById("det-depreciacao").textContent = "R$ " + custoDepreciacao.toFixed(2).replace(".", ",");
    if (document.getElementById("det-manutencao")) document.getElementById("det-manutencao").textContent = "R$ " + custoManutencao.toFixed(2).replace(".", ",");
    if (document.getElementById("det-margem")) document.getElementById("det-margem").textContent = "R$ " + valorMargem.toFixed(2).replace(".", ",");
}

async function salvarProduto(event) {
    event.preventDefault();

    const btnSubmit = document.querySelector("#productForm button[type='submit']");
    if (!btnSubmit || btnSubmit.disabled) return;

    btnSubmit.disabled = true;
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<span>Salvando no Sheets...</span>`;

    try {
        const horasTotal = extrairHorasDecimais(document.getElementById("tempo")?.value || "");
        const selectPerfil = document.getElementById("perfilEnergia");
        const watts = obterWattsPerfilSelecionado(selectPerfil);

        const kwhConsumido = Number(((watts / 1000) * horasTotal).toFixed(4));
        const horasParaSalvar = Number(horasTotal.toFixed(4));

        const produto = {
            nome: document.getElementById("nome")?.value || "Sem Nome",
            categoria: document.getElementById("categoria")?.value || "Geral",
            foto: document.getElementById("foto")?.value || "",
            arquivo: document.getElementById("arquivo")?.value || "",
            tempoImpressao: Math.round(horasTotal * 60),
            pesoProd: parseFloat(document.getElementById("pesoTotal")?.textContent) || 0
        };

        const bom = [];
        let custoMateriais = 0;

        document.querySelectorAll(".linha-bom").forEach(tr => {
            const selectInsumo = tr.querySelector(".bom-insumo");
            const itemId = selectInsumo ? selectInsumo.value : "";
            const categoria = tr.querySelector(".bom-tipo")?.value || "";
            const qtdInput = parseFloat(tr.querySelector(".bom-qtd")?.value) || 0;

            if (itemId && qtdInput > 0) {
                let quantidadeFinal = qtdInput;
                if (categoria.toLowerCase().includes("filamento")) {
                    quantidadeFinal = Number((qtdInput / 1000).toFixed(4));
                }

                const item = [...LISTA_INSUMOS, ...LISTA_CUSTOS].find(i => i.id === itemId);
                const nomeItem = item ? item.nome : (selectInsumo.options[selectInsumo.selectedIndex]?.text || itemId);
                const categoriaItem = item ? item.categoria : categoria || "GERAL";

                bom.push({
                    id: itemId,
                    categoria: categoriaItem,
                    nome: nomeItem,
                    quantidade: quantidadeFinal
                });
            }
        });

        const tarifaKwh = TAXAS_SISTEMA["CUS_01"] ? TAXAS_SISTEMA["CUS_01"].valor : 0;
        const depHora   = TAXAS_SISTEMA["CUS_02"] ? TAXAS_SISTEMA["CUS_02"].valor : 0;
        const manHora   = TAXAS_SISTEMA["CUS_03"] ? TAXAS_SISTEMA["CUS_03"].valor : 0;

        const custoEnergia = kwhConsumido * tarifaKwh;
        const custoDepreciacao = horasParaSalvar * depHora;
        const custoManutencao = horasParaSalvar * manHora;

        if (kwhConsumido > 0) {
            bom.push({ idCus: "CUS_01", tipo: "Energia", nome: TAXAS_SISTEMA["CUS_01"]?.nome || "ENERGIA Tarifa kWh", quantidade: kwhConsumido });
        }
        if (horasParaSalvar > 0) {
            bom.push({ idCus: "CUS_02", tipo: "Operação", nome: TAXAS_SISTEMA["CUS_02"]?.nome || "OPERAÇÃO MÉD DEPREC P/HORA", quantidade: horasParaSalvar });
            bom.push({ idCus: "CUS_03", tipo: "Operação", nome: TAXAS_SISTEMA["CUS_03"]?.nome || "OPERAÇÃO MÉD MANUT P/HORA", quantidade: horasParaSalvar });
        }

        const subtotalDireto = Number((custoMateriais + custoEnergia + custoDepreciacao + custoManutencao).toFixed(2));
        if (TAXAS_SISTEMA["CUS_04"] && subtotalDireto > 0) {
            bom.push({ idCus: "CUS_04", tipo: "Margem", nome: TAXAS_SISTEMA["CUS_04"]?.nome || "Margem de Seguridade", quantidade: subtotalDireto });
        }

        const payload = { produto, bom };

        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.status === "success") {
            alert(`✅ ${result.message}\nSKU Gerado: ${result.sku}`);
            document.getElementById("productForm").reset();
            document.getElementById("bomTbody").innerHTML = "";
            adicionarLinhaBOM();
            calcularTotais();
        } else {
            alert(`❌ Erro ao salvar: ${result.message}`);
        }
    } catch (error) {
        alert("❌ Erro ao conectar com o Google Sheets: " + error.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
        if (window.lucide) window.lucide.createIcons();
    }
}