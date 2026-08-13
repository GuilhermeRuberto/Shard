// js/app.js

import { carregarEstadoInicial } from './state.js';
import { initCatalogo } from './views/catalogo.view.js';
import { initDetalheProduto } from './views/detalhe-produto.view.js';
import { initCadastroProduto } from './views/cadastro-produto.view.js';
import { initInsumosCustos } from './views/insumos-custos.view.js';

// ⚠️ COLE AQUI A URL DO SEU GOOGLE APPS SCRIPT
const APPS_SCRIPT_URL = 'SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI';

/**
 * Remove a tela de carregamento (Splash Screen) e exibe a aplicação
 */
function hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    const appContainer = document.getElementById('app-container');

    if (splash) {
        splash.style.opacity = '0';
        splash.style.visibility = 'hidden';
        splash.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
        setTimeout(() => {
            splash.classList.add('hidden');
            splash.style.display = 'none';
        }, 300);
    }

    if (appContainer) {
        appContainer.classList.remove('hidden');
        appContainer.style.display = 'flex';
    }

    document.body.style.overflow = 'auto';
}

/**
 * Roteador principal de troca de views do ERP
 * @param {string} targetViewId - Identificador da view (ex: 'catalogo', 'detalhe-produto', 'cadastro-produto', 'insumos')
 * @param {Object|null} data - Dados opcionais para a view de destino
 */
export function switchView(targetViewId, data = null) {
    // 1. Oculta todas as views
    const allViews = document.querySelectorAll('.view-section');
    allViews.forEach(view => {
        view.classList.remove('active');
        view.classList.add('hidden');
    });

    // 2. Exibe o container da view solicitada
    const targetView = document.getElementById(`view-${targetViewId}`);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('active');
    } else {
        console.warn(`[Router] Container #view-${targetViewId} não encontrado no DOM.`);
    }

    // 3. Atualiza a seleção no menu lateral
    updateSidebarActive(targetViewId);

    // 4. Inicializa o módulo correspondente (que agora lerá do AppState instantaneamente)
    switch (targetViewId) {
        case 'catalogo':
            initCatalogo(switchView);
            break;

        case 'detalhe-produto':
            if (data) {
                initDetalheProduto(data, switchView);
            } else {
                console.warn('[Router] Dados ausentes. Redirecionando ao catálogo...');
                switchView('catalogo');
            }
            break;

        case 'cadastro-produto':
            initCadastroProduto(switchView);
            break;

        case 'insumos':
            initInsumosCustos(switchView);
            break;

        case 'frota-maquinas':
        case 'fila-producao':
        case 'financeiro':
        case 'configuracoes':
            renderPlaceholderView(targetViewId);
            break;

        default:
            console.error(`[Router] Rota "${targetViewId}" não mapeada.`);
            break;
    }

    // 5. Renderiza ícones do Lucide (se aplicável)
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 6. Rola para o topo da página
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Sincroniza a classe .active nos itens da barra lateral
 */
function updateSidebarActive(targetViewId) {
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    
    // Mapeamento de sub-rotas para manter o item pai ativo na sidebar
    const parentMap = {
        'cadastro-produto': 'catalogo',
        'detalhe-produto': 'catalogo'
    };

    const activeKey = parentMap[targetViewId] || targetViewId;

    navItems.forEach(item => {
        const viewAttr = item.getAttribute('data-view');
        if (viewAttr === activeKey) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Escutador de cliques na barra lateral
 */
function setupSidebarNavigation() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    sidebar.addEventListener('click', (event) => {
        const item = event.target.closest('.nav-item[data-view]');
        if (!item) return;
        event.preventDefault();
        const viewTarget = item.getAttribute('data-view');
        if (viewTarget) {
            switchView(viewTarget);
        }
    });
}

/**
 * Renderiza mensagem padrão para telas não finalizadas
 */
function renderPlaceholderView(viewId) {
    const container = document.querySelector(`#view-${viewId} .view-body`) || document.querySelector(`#view-${viewId}`);
    if (container) {
        const titles = {
            'frota-maquinas': 'Frota & Máquinas',
            'fila-producao': 'Fila de Produção',
            'financeiro': 'Financeiro',
            'configuracoes': 'Configurações'
        };
        container.innerHTML = `
            <div class="card">
                <h3>${titles[viewId] || viewId}</h3>
                <p style="color: #94a3b8; margin-top: 10px;">Módulo em desenvolvimento.</p>
            </div>
        `;
    }
}

/**
 * Fluxo Principal de Inicialização da Aplicação
 */
async function iniciarAplicacao() {
    setupSidebarNavigation();

    try {
        // 1. Busca todos os dados do Google Sheets durante a Splash Screen
        await carregarEstadoInicial(APPS_SCRIPT_URL);
    } catch (erro) {
        console.error('[Init] Erro ao conectar com o servidor:', erro);
        alert('Não foi possível carregar os dados atualizados. O sistema iniciará com dados locais/vazios.');
    } finally {
        // 2. Esconde a Splash Screen e carrega a tela inicial (Catálogo)
        hideSplashScreen();
        switchView('catalogo');
    }
}

// Inicializa a aplicação assim que o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarAplicacao);
} else {
    iniciarAplicacao();
}