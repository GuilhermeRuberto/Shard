/**
 * js/state.js
 * Central de Gerenciamento de Estado Global e Cache de Dados.
 * Evita requisições repetidas ao Google Apps Script guardando tudo na memória RAM.
 */

// 1. Objeto de Estado Global
export const AppState = {
    produtos: [],
    insumos: [],
    custos: [],
    carregado: false
};

/**
 * Carrega todos os dados da API (Google Apps Script) de uma única vez.
 * É executada durante o carregamento inicial da Splash Screen.
 * 
 * @param {string} urlApi - A URL do seu Web App no Google Apps Script
 * @param {boolean} forcarRecarregamento - Se true, ignora o cache e busca do servidor novamente
 * @returns {Promise<Object>} Retorna o objeto AppState atualizado
 */
export async function carregarEstadoInicial(urlApi, forcarRecarregamento = false) {
    // Se os dados já foram carregados e não forçamos um reload, entrega da memória (0ms)
    if (AppState.carregado && !forcarRecarregamento) {
        return AppState;
    }

    try {
        const response = await fetch(urlApi);
        
        if (!response.ok) {
            throw new Error(`Falha na requisição HTTP: ${response.status}`);
        }

        const dados = await response.json();

        // Popula o estado global com os arrays vindos da planilha
        AppState.produtos = dados.produtos || [];
        AppState.insumos = dados.insumos || [];
        AppState.custos = dados.custos || [];
        AppState.carregado = true;

        return AppState;
    } catch (erro) {
        console.error("Erro crítico ao carregar o estado inicial:", erro);
        throw erro;
    }
}

/* ==========================================================================
   FUNÇÕES DE ATUALIZAÇÃO RÁPIDA (LOCAL / OTIMISTA)
   Essas funções atualizam a tela instantaneamente sem precisar recarregar o Sheets.
   ========================================================================== */

// --- PRODUTOS ---
export function adicionarProdutoEstado(novoProduto) {
    AppState.produtos.push(novoProduto);
}

export function atualizarProdutoEstado(idOuSku, produtoAtualizado) {
    const index = AppState.produtos.findIndex(p => p.id === idOuSku || p.sku === idOuSku);
    if (index !== -1) {
        AppState.produtos[index] = { ...AppState.produtos[index], ...produtoAtualizado };
    }
}

export function removerProdutoEstado(idOuSku) {
    AppState.produtos = AppState.produtos.filter(p => p.id !== idOuSku && p.sku !== idOuSku);
}

// --- INSUMOS ---
export function adicionarInsumoEstado(novoInsumo) {
    AppState.insumos.push(novoInsumo);
}

export function atualizarInsumoEstado(idOuNome, insumoAtualizado) {
    const index = AppState.insumos.findIndex(i => i.id === idOuNome || i.nome === idOuNome);
    if (index !== -1) {
        AppState.insumos[index] = { ...AppState.insumos[index], ...insumoAtualizado };
    }
}

export function removerInsumoEstado(idOuNome) {
    AppState.insumos = AppState.insumos.filter(i => i.id !== idOuNome && i.nome !== idOuNome);
}

// --- CUSTOS ---
export function adicionarCustoEstado(novoCusto) {
    AppState.custos.push(novoCusto);
}

export function atualizarCustoEstado(idOuNome, custoAtualizado) {
    const index = AppState.custos.findIndex(c => c.id === idOuNome || c.nome === idOuNome);
    if (index !== -1) {
        AppState.custos[index] = { ...AppState.custos[index], ...custoAtualizado };
    }
}

export function removerCustoEstado(idOuNome) {
    AppState.custos = AppState.custos.filter(c => c.id !== idOuNome && c.nome !== idOuNome);
}