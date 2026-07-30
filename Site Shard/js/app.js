import { initCatalogo } from './views/catalogo.view.js';
import { initCadastro } from './views/cadastro.view.js';

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. SPLASH SCREEN (Fecha após 1.5s)
    // ==========================================
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const appContainer = document.getElementById('app-container');

        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => {
                splash.style.display = 'none';
                if (appContainer) appContainer.classList.remove('hidden');
            }, 600);
        }
    }, 1500);

    // ==========================================
    // 2. TOGGLE DA SIDEBAR
    // ==========================================
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // ==========================================
    // 3. ROTEADOR DE TELAS (SPA)
    // ==========================================
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    function switchView(targetViewId) {
        navItems.forEach(i => i.classList.remove('active'));
        viewSections.forEach(s => s.classList.remove('active'));

        const matchingBtn = document.querySelector(`.sidebar-nav .nav-item[data-view="${targetViewId}"]`);
        if (matchingBtn) matchingBtn.classList.add('active');

        const targetSection = document.getElementById(`view-${targetViewId}`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Inicializa a lógica da view correspondente
            if (targetViewId === 'catalogo') {
                initCatalogo(switchView);
            } else if (targetViewId === 'cadastro') {
                initCadastro(switchView);
            }
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-view');
            if (view) switchView(view);
        });
    });

    // Inicializa a primeira tela (Catálogo) ao carregar
    initCatalogo(switchView);
});