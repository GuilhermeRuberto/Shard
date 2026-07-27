// =================================================================
// 📌 1. CONFIGURAÇÃO DA URL & VARIÁVEIS GLOBAIS
// =================================================================

// Cole sua Web App URL gerada no Google Apps Script aqui:
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzus-0gell47fkLEfgwHsLd8v1QoG6k_0Qi5fmUyhG_Q2NYjFwCYm5NNKXcQKRyFDA1Vw/exec";

let TAXAS_SISTEMA = {};
let PERFIS_ENERGIA = [];
let LISTA_INSUMOS = [];
let dadosCarregados = false;


// =================================================================
// 📌 2. BUSCA E INTEGRAÇÃO COM GOOGLE SHEETS
// =================================================================

async function carregarDadosDoSheets() {
  console.log("🔎 Testando URL configurada:", APPS_SCRIPT_URL);

  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_URL.trim().startsWith("https://script.google.com")) {
    console.error("❌ A variável APPS_SCRIPT_URL não contém um link válido do Google Apps Script.");
    exibirEstadoCarregando("Sem URL");
    return;
  }

  exibirEstadoCarregando("Carregando...");

  try {
    const response = await fetch(APPS_SCRIPT_URL);
    const result = await response.json();

    if (result.status === "success" && Array.isArray(result.data)) {
      TAXAS_SISTEMA = {};
      PERFIS_ENERGIA = [];
      LISTA_INSUMOS = [];

      result.data.forEach(item => {
        const id = String(item.idCus || "").toUpperCase().trim();

        // Leitura resiliente (aceita tanto colunaB/colunaC quanto nome/categoria)
        let valB = item.colunaB !== undefined ? item.colunaB : item.categoria;
        let valC = item.colunaC !== undefined ? item.colunaC : item.nome;

        let strB = String(valB || "").trim();
        let strC = String(valC || "").trim();

        // Expurga a palavra "undefined" ou "null" caso venha como texto puro
        if (strB.toLowerCase() === "undefined" || strB.toLowerCase() === "null") strB = "";
        if (strC.toLowerCase() === "undefined" || strC.toLowerCase() === "null") strC = "";

        // Mapeamento automático de Categoria vs Nome
        let tipoInsumo = strB;
        let nomeInsumo = strC;

        const tiposConhecidos = ["FILAMENTO", "EMBALAGEM", "COMPONENTE", "INSUMO", "GERAL", "SERVIÇO", "PEÇA", "OUTROS"];
        if (tiposConhecidos.includes(strC.toUpperCase()) || (!tiposConhecidos.includes(strB.toUpperCase()) && strC.toUpperCase().includes("FILAMENTO"))) {
          tipoInsumo = strC;
          nomeInsumo = strB;
        }

        // Se o nome ficou vazio, usa a outra coluna ou o próprio ID como fallback
        if (!nomeInsumo) nomeInsumo = tipoInsumo && !tiposConhecidos.includes(tipoInsumo.toUpperCase()) ? tipoInsumo : id;
        if (!tipoInsumo) tipoInsumo = "GERAL";

        // 1. Taxas Fixas Operacionais (CUS_01 a CUS_04)
        if (["CUS_01", "CUS_02", "CUS_03", "CUS_04"].includes(id)) {
          TAXAS_SISTEMA[id] = {
            nome: nomeInsumo !== id ? nomeInsumo : "Taxa " + id,
            valor: Number(item.precoUnit) || 0
          };
        } 
        // 2. Perfis Energéticos da Máquina (CUS_05 e CUS_06)
        else if (id === "CUS_05" || id === "CUS_06") {
          const val = Number(item.precoUnit) || 0;
          const wattsCalculado = val < 5 ? val * 1000 : val;
          
          PERFIS_ENERGIA.push({
            idCus: id,
            nome: nomeInsumo !== id ? nomeInsumo : "Impressora / Máquina",
            watts: wattsCalculado
          });
        } 
        // 3. Demais Insumos/Materiais (CUS_07 em diante)
        else if (id.startsWith("CUS_")) {
          LISTA_INSUMOS.push({
            idCus: id,
            tipo: tipoInsumo.toUpperCase(),
            nome: nomeInsumo,
            precoUnit: Number(item.precoUnit) || 0
          });
        }
      });

      dadosCarregados = true;

      atualizarSelectPerfilEnergia();
      atualizarBadgesTaxas();
      
      const tbody = document.getElementById("bomTbody");
      if (tbody) tbody.innerHTML = "";
      adicionarLinhaBOM();
      calcularTotais();

      console.log("✅ Dados da planilha carregados com sucesso!");
    } else {
      console.error("⚠️ Planilha retornou resposta diferente de sucesso:", result);
      exibirEstadoCarregando("Erro planilha");
    }
  } catch (error) {
    console.error("❌ Erro ao conectar com o Google Sheets:", error);
    exibirEstadoCarregando("Erro conexão");
  }
}

function exibirEstadoCarregando(texto) {
  const el01 = document.getElementById("display-cus01");
  const el02 = document.getElementById("display-cus02");
  const el03 = document.getElementById("display-cus03");
  const el04 = document.getElementById("display-cus04");

  if (el01) el01.textContent = texto;
  if (el02) el02.textContent = texto;
  if (el03) el03.textContent = texto;
  if (el04) el04.textContent = texto;
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
    select.innerHTML = '<option value="">Nenhum perfil cadastrado</option>';
    return;
  }

  PERFIS_ENERGIA.forEach(perfil => {
    const option = document.createElement("option");
    option.value = perfil.idCus;
    option.textContent = `${perfil.idCus} - ${perfil.nome} (~${perfil.watts}W)`;
    option.dataset.watts = perfil.watts;
    select.appendChild(option);
  });
}


// =================================================================
// 📌 3. TABELA DINÂMICA DE INSUMOS (BOM)
// =================================================================

function adicionarLinhaBOM() {
  const container = document.getElementById("bomTbody");
  if (!container) return;

  if (!dadosCarregados) {
    alert("Aguarde o carregamento dos dados da planilha antes de adicionar insumos.");
    return;
  }

  const tiposUnicos = [...new Set(LISTA_INSUMOS.map(item => item.tipo))];
  
  let optionsTipo = '<option value="">Selecione...</option>';
  tiposUnicos.forEach(tipo => {
    optionsTipo += `<option value="${tipo}">${tipo}</option>`;
  });

  const tr = document.createElement("tr");
  tr.className = "linha-bom";
  tr.innerHTML = `
    <td>
      <select class="bom-tipo" onchange="atualizarDropdownInsumos(this)">
        ${optionsTipo}
      </select>
    </td>
    <td>
      <select class="bom-insumo" disabled onchange="calcularTotais()">
        <option value="">Selecione o tipo primeiro...</option>
      </select>
    </td>
    <td>
      <input type="number" class="bom-qtd" step="any" placeholder="Ex: 150 (g) ou 1 (un)" required oninput="calcularTotais()" />
    </td>
    <td>
      <button type="button" class="btn-remover" onclick="removerLinhaBOM(this)">❌</button>
    </td>
  `;

  container.appendChild(tr);
  if (window.lucide) lucide.createIcons();
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

  if (tipoSelecionado.toLowerCase().includes("filamento")) {
    inputQtd.placeholder = "Ex: 150 (gramas)";
  } else {
    inputQtd.placeholder = "Ex: 1 ou 4 (unidades)";
  }

  const insumosFiltrados = LISTA_INSUMOS.filter(item => item.tipo === tipoSelecionado);

  insumosFiltrados.forEach(item => {
    const option = document.createElement("option");
    option.value = item.idCus;
    option.textContent = `${item.idCus} - ${item.nome}`;
    option.dataset.preco = item.precoUnit;
    selectInsumo.appendChild(option);
  });

  selectInsumo.disabled = false;
  calcularTotais();
}

function removerLinhaBOM(botao) {
  botao.closest("tr").remove();
  calcularTotais();
}

function toggleDetalhesCusto() {
  const painel = document.getElementById("detalhesCusto");
  const texto = document.getElementById("toggleText");
  const icone = document.getElementById("toggleIcon");

  if (!painel) return;

  if (painel.classList.contains("hidden")) {
    painel.classList.remove("hidden");
    if (texto) texto.textContent = "- Ocultar Detalhes";
    if (icone) icone.style.transform = "rotate(180deg)";
  } else {
    painel.classList.add("hidden");
    if (texto) texto.textContent = "+ Detalhes da Composição";
    if (icone) icone.style.transform = "rotate(0deg)";
  }
}


// =================================================================
// 📌 4. CONVERSÃO DE TEMPO E CÁLCULO DE CUSTOS
// =================================================================

function extrairHorasDecimais(inputTempo) {
  if (!inputTempo) return 0;
  let texto = String(inputTempo).trim().replace(',', '.');

  if (texto.includes(':')) {
    const partes = texto.split(':');
    const horas = parseFloat(partes[0]) || 0;
    const minutos = parseFloat(partes[1]) || 0;
    const segundos = parseFloat(partes[2]) || 0;
    return horas + (minutos / 60) + (segundos / 3600);
  }

  return parseFloat(texto) || 0;
}

function converterHorasParaHHMMSS(horasDecimais) {
  if (!horasDecimais || isNaN(horasDecimais) || horasDecimais <= 0) return "00:00:00";

  const totalSegundos = Math.round(horasDecimais * 3600);
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

function calcularTotais() {
  if (!dadosCarregados) return;

  const tempoInput = document.getElementById("tempo")?.value || "";
  const horasTotal = extrairHorasDecimais(tempoInput);

  const selectPerfil = document.getElementById("perfilEnergia");
  let watts = 0;
  if (selectPerfil && selectPerfil.selectedIndex >= 0) {
    watts = parseFloat(selectPerfil.options[selectPerfil.selectedIndex]?.dataset?.watts) || 0;
  }

  let pesoFilamentosKg = 0;
  let custoMateriais = 0;

  const linhasBOM = document.querySelectorAll(".linha-bom");
  linhasBOM.forEach(tr => {
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

  const tarifaKwh = TAXAS_SISTEMA["CUS_01"] ? TAXAS_SISTEMA["CUS_01"].valor : 0;
  const depHora   = TAXAS_SISTEMA["CUS_02"] ? TAXAS_SISTEMA["CUS_02"].valor : 0;
  const manHora   = TAXAS_SISTEMA["CUS_03"] ? TAXAS_SISTEMA["CUS_03"].valor : 0;
  const pctMargem = TAXAS_SISTEMA["CUS_04"] ? TAXAS_SISTEMA["CUS_04"].valor : 0;

  const kwhConsumido = (watts / 1000) * horasTotal;
  const custoEnergia = kwhConsumido * tarifaKwh;
  const custoDepreciacao = horasTotal * depHora;
  const custoManutencao = horasTotal * manHora;

  const subtotalDireto = custoMateriais + custoEnergia + custoDepreciacao + custoManutencao;
  const valorMargem = subtotalDireto * pctMargem;
  const custoTotalFinal = subtotalDireto + valorMargem;

  if (document.getElementById("pesoTotal")) {
    document.getElementById("pesoTotal").textContent = pesoFilamentosKg.toFixed(3) + " kg";
  }
  if (document.getElementById("custoTotal")) {
    document.getElementById("custoTotal").textContent = "R$ " + custoTotalFinal.toFixed(2).replace(".", ",");
  }

  if (document.getElementById("det-insumos")) document.getElementById("det-insumos").textContent = "R$ " + custoMateriais.toFixed(2).replace(".", ",");
  if (document.getElementById("det-kwh-val")) document.getElementById("det-kwh-val").textContent = kwhConsumido.toFixed(2);
  if (document.getElementById("det-energia")) document.getElementById("det-energia").textContent = "R$ " + custoEnergia.toFixed(2).replace(".", ",");
  if (document.getElementById("det-depreciacao")) document.getElementById("det-depreciacao").textContent = "R$ " + custoDepreciacao.toFixed(2).replace(".", ",");
  if (document.getElementById("det-manutencao")) document.getElementById("det-manutencao").textContent = "R$ " + custoManutencao.toFixed(2).replace(".", ",");
  if (document.getElementById("det-margem")) document.getElementById("det-margem").textContent = "R$ " + valorMargem.toFixed(2).replace(".", ",");
}


// =================================================================
// 📌 5. SALVAR NO GOOGLE SHEETS (POST)
// =================================================================

async function salvarProduto(event) {
  event.preventDefault();

  const btnSubmit = document.querySelector("#productForm button[type='submit']");
  if (!btnSubmit || btnSubmit.disabled) return;

  btnSubmit.disabled = true;
  const textoOriginal = btnSubmit.innerHTML;
  btnSubmit.innerHTML = `<span>Salvando no Sheets...</span>`;

  try {
    const tempoInput = document.getElementById("tempo")?.value || "";
    const horasTotal = extrairHorasDecimais(tempoInput);
    const tempoFormatado = converterHorasParaHHMMSS(horasTotal);

    const selectPerfil = document.getElementById("perfilEnergia");
    const watts = parseFloat(selectPerfil?.options[selectPerfil.selectedIndex]?.dataset?.watts) || 0;
    const kwhConsumido = (watts / 1000) * horasTotal;

    const inputFoto = document.getElementById("foto") || document.getElementById("fotoUrl");
    const inputArquivo = document.getElementById("arquivo") || document.getElementById("arquivoUrl");
    const inputNome = document.getElementById("nome") || document.getElementById("nomeProduto");
    const inputCategoria = document.getElementById("categoria") || document.getElementById("categoriaProduto");

    const produto = {
      nome: inputNome ? inputNome.value : "Sem Nome",
      categoria: inputCategoria ? inputCategoria.value : "Geral",
      fotoUrl: inputFoto ? inputFoto.value : "",
      arquivoUrl: inputArquivo ? inputArquivo.value : "",
      tempoEstimado: tempoFormatado,
      pesoTotal: parseFloat(document.getElementById("pesoTotal")?.textContent) || 0
    };

    const bom = [];

    const linhasBOM = document.querySelectorAll(".linha-bom");
    linhasBOM.forEach(tr => {
      const selectInsumo = tr.querySelector(".bom-insumo");
      const idCus = selectInsumo ? selectInsumo.value : "";
      const selectTipo = tr.querySelector(".bom-tipo");
      const tipo = selectTipo ? selectTipo.value : "";
      
      let nomeInsumoText = "";
      if (selectInsumo && selectInsumo.selectedIndex >= 0) {
        nomeInsumoText = selectInsumo.options[selectInsumo.selectedIndex].text || "";
      }
      
      const qtdInput = parseFloat(tr.querySelector(".bom-qtd")?.value) || 0;

      if (idCus && qtdInput > 0) {
        let quantidadeFinal = qtdInput;
        if (tipo.toLowerCase().includes("filamento")) {
          quantidadeFinal = qtdInput / 1000;
        }

        const nomeLimpo = nomeInsumoText.replace(/^CUS_\d+\s*-\s*/i, "").trim();

        bom.push({
          idCus: idCus,
          tipo: tipo || "GERAL",
          nome: nomeLimpo || idCus,
          quantidade: quantidadeFinal
        });
      }
    });

    if (kwhConsumido > 0) {
      bom.push({
        idCus: "CUS_01",
        tipo: "Energia",
        nome: TAXAS_SISTEMA["CUS_01"]?.nome || "ENERGIA Tarifa kWh",
        quantidade: kwhConsumido
      });
    }
    if (horasTotal > 0) {
      bom.push({
        idCus: "CUS_02",
        tipo: "Operação",
        nome: TAXAS_SISTEMA["CUS_02"]?.nome || "OPERAÇÃO MÉD DEPREC P/HORA",
        quantidade: horasTotal
      });
      bom.push({
        idCus: "CUS_03",
        tipo: "Operação",
        nome: TAXAS_SISTEMA["CUS_03"]?.nome || "OPERAÇÃO MÉD MANUT P/HORA",
        quantidade: horasTotal
      });
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
    if (window.lucide) lucide.createIcons();
  }
}


// =================================================================
// 📌 6. INICIALIZAÇÃO
// =================================================================

document.addEventListener("DOMContentLoaded", () => {
  carregarDadosDoSheets();

  const form = document.getElementById("productForm");
  if (form) form.addEventListener("submit", salvarProduto);
});