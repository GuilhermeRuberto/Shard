document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Controle de Navegação das Views (SPA Router)
    const navButtons = document.querySelectorAll('.sidebar-nav .nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetView = button.getAttribute('data-view');

            // Remove a classe active de todos os botões e seções
            navButtons.forEach(btn => btn.classList.remove('active'));
            viewSections.forEach(sec => sec.classList.remove('active'));

            // Adiciona a classe active no botão clicado e na seção correspondente
            button.classList.add('active');
            const targetSection = document.getElementById(`view-${targetView}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // 2. Comportamento do Botão de Recolher Sidebar
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // 3. Revelar o App Principal após o Splash (garantia via JS)
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const appContainer = document.getElementById('app-container');
        
        if (splash && appContainer) {
            splash.style.display = 'none';
            appContainer.classList.remove('hidden');
        }
    }, 1800); // 1.8 segundos sincronizado com a animação CSS
});