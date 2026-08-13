/**
 * js/state.js
 * Central de Gerenciamento de Estado Global e Cache de Dados.
 * Evita requisições repetidas ao Google Apps Script guardando tudo na memória RAM.
 */

// 1. Objeto de Estado Global (Fonte Única da Verdade)
export const AppState = {
    produtos: [],
    insumos: [],
    custos: [],
    carregado: false
};

/**
 * Carrega todos os dados da API (Google Apps Script) de uma única vez.
 * É executada durante o carregamento inicial da Splash Screen ou sob demanda.
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

        // Popula o estado global de forma defensiva garantindo arrays válidos
        AppState.produtos = Array.isArray(dados.produtos) ? dados.produtos : [];
        AppState.insumos = Array.isArray(dados.insumos) ? dados.insumos : [];
        AppState.custos = Array.isArray(dados.custos) ? dados.custos : [];
        AppState.carregado = true;

        return AppState;
    } catch (erro) {
        console.error("Erro crítico ao carregar o estado inicial:", erro);
        throw erro;
    }
}

/** 
 * Reseta o estado global (útil para logout ou forçar nova sincronização completa) 
 */
export function resetarEstado() {
    AppState.produtos = [];
    AppState.insumos = [];
    AppState.custos = [];
    AppState.carregado = false;
}

// ==========================================================================
// UTILITÁRIOS INTERNOS DE COMPARAÇÃO
// ==========================================================================

/**
 * Compara dois IDs ou valores de forma segura contra divergências de tipo ou caixa.
 */
function idsIguais(val1, val2) {
    if (val1 === undefined || val1 === null || val2 === undefined || val2 === null) return false;
    return String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase();
}

// ==========================================================================
// PRODUTOS
// ==========================================================================

export function obterProdutoPorId(idOuSku) {
    return AppState.produtos.find(p => idsIguais(p.id, idOuSku) || idsIguais(p.sku, idOuSku)) || null;
}

export function adicionarProdutoEstado(novoProduto) {
    if (!novoProduto) return;
    AppState.produtos.push(novoProduto);
}

export function atualizarProdutoEstado(idOuSku, produtoAtualizado) {
    const index = AppState.produtos.findIndex(p => idsIguais(p.id, idOuSku) || idsIguais(p.sku, idOuSku));
    if (index !== -1) {
        AppState.produtos[index] = { ...AppState.produtos[index], ...produtoAtualizado };
    }
}

/** Salva produto no estado: atualiza se já existir, insere se for novo */
export function salvarProdutoEstado(produto) {
    if (!produto) return;
    const index = AppState.produtos.findIndex(p => idsIguais(p.id, produto.id) || (produto.sku && idsIguais(p.sku, produto.sku)));
    if (index !== -1) {
        AppState.produtos[index] = { ...AppState.produtos[index], ...produto };
    } else {
        AppState.produtos.push(produto);
    }
}

export function removerProdutoEstado(idOuSku) {
    AppState.produtos = AppState.produtos.filter(p => !idsIguais(p.id, idOuSku) && !idsIguais(p.sku, idOuSku));
}

// ==========================================================================
// INSUMOS
// ==========================================================================

export function obterInsumoPorId(idOuNome) {
    return AppState.insumos.find(i => idsIguais(i.id, idOuNome) || idsIguais(i.nome, idOuNome)) || null;
}

export function adicionarInsumoEstado(novoInsumo) {
    if (!novoInsumo) return;
    AppState.insumos.push(novoInsumo);
}

export function atualizarInsumoEstado(idOuNome, insumoAtualizado) {
    const index = AppState.insumos.findIndex(i => idsIguais(i.id, idOuNome) || idsIguais(i.nome, idOuNome));
    if (index !== -1) {
        AppState.insumos[index] = { ...AppState.insumos[index], ...insumoAtualizado };
    }
}

/** Salva insumo no estado: atualiza se já existir, insere se for novo (Upsert) */
export function salvarInsumoEstado(insumo) {
    if (!insumo) return;
    const index = AppState.insumos.findIndex(i => idsIguais(i.id, insumo.id));
    if (index !== -1) {
        AppState.insumos[index] = { ...AppState.insumos[index], ...insumo };
    } else {
        AppState.insumos.push(insumo);
    }
}

export function removerInsumoEstado(idOuNome) {
    AppState.insumos = AppState.insumos.filter(i => !idsIguais(i.id, idOuNome) && !idsIguais(i.nome, idOuNome));
}

// ==========================================================================
// CUSTOS
// ==========================================================================

export function obterCustoPorId(idOuNome) {
    return AppState.custos.find(c => idsIguais(c.id, idOuNome) || idsIguais(c.nome, idOuNome)) || null;
}

export function adicionarCustoEstado(novoCusto) {
    if (!novoCusto) return;
    AppState.custos.push(novoCusto);
}

export function atualizarCustoEstado(idOuNome, custoAtualizado) {
    const index = AppState.custos.findIndex(c => idsIguais(c.id, idOuNome) || idsIguais(c.nome, idOuNome));
    if (index !== -1) {
        AppState.custos[index] = { ...AppState.custos[index], ...custoAtualizado };
    }
}

/** Salva custo no estado: atualiza se já existir, insere se for novo (Upsert) */
export function salvarCustoEstado(custo) {
    if (!custo) return;
    const index = AppState.custos.findIndex(c => idsIguais(c.id, custo.id));
    if (index !== -1) {
        AppState.custos[index] = { ...AppState.custos[index], ...custo };
    } else {
        AppState.custos.push(custo);
    }
}

export function removerCustoEstado(idOuNome) {
    AppState.custos = AppState.custos.filter(c => !idsIguais(c.id, idOuNome) && !idsIguais(c.nome, idOuNome));
}