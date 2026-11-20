// متغیر سراسری برای تشخیص حالت فعلی برنامه ('kitchen' یا 'closet')
window.currentAppMode = 'kitchen';

function switchAppMode(mode) {
    window.currentAppMode = mode;

    const kitchenBtn = document.getElementById('mode-kitchen-btn');
    const closetBtn = document.getElementById('mode-closet-btn');
    const kitchenContainer = document.getElementById('kitchen-menu-container');
    const closetContainer = document.getElementById('closet-menu-container');

    if (mode === 'kitchen') {
        kitchenBtn.classList.add('active');
        closetBtn.classList.remove('active');
        kitchenContainer.style.display = 'block';
        closetContainer.style.display = 'none';
    } else if (mode === 'closet') {
        closetBtn.classList.add('active');
        kitchenBtn.classList.remove('active');
        kitchenContainer.style.display = 'none';
        closetContainer.style.display = 'block';
    }
}

// به‌روزرسانی تعاریف قبلی درون DOMContentLoaded
document.addEventListener("DOMContentLoaded", function() {
    
    const menuFab = document.getElementById('main-menu-toggle');
    const mainSidebar = document.getElementById('main-sidebar');
    
    // انتخاب تمام بخش‌ها در تمام منوها
    function refreshMenuSelectors() {
        return {
            menuSections: document.querySelectorAll('.menu-section'),
            subMenuButtons: document.querySelectorAll('.add-item-btn')
        };
    }

    function resetMenuStates() {
        const { menuSections, subMenuButtons } = refreshMenuSelectors();
        
        document.querySelectorAll('.sidebar-menu').forEach(sm => sm.classList.remove('compact-mode'));
        menuSections.forEach(s => s.classList.remove('active-category'));
        
        subMenuButtons.forEach(btn => {
            btn.classList.remove('panel-active');
            btn.classList.remove('selected');
        });
    }

    // باز و بسته کردن کل سایدبار
    if(menuFab && mainSidebar) {
        menuFab.addEventListener('click', function(e) {
            e.stopPropagation(); 
            const isOpen = mainSidebar.classList.contains('open');

            if(!isOpen) {
                resetMenuStates();
                mainSidebar.classList.add('open');
                menuFab.classList.add('open-mode'); 
            } else {
                mainSidebar.classList.remove('open');
                menuFab.classList.remove('open-mode'); 
                setTimeout(() => {
                    resetMenuStates();
                }, 900); 
            }
        });
    }

    // مدیریت کلیک روی هدرهای آکاردئون
    document.addEventListener('click', function(e) {
        const header = e.target.closest('.section-header');
        if (header) {
            e.stopPropagation();
            const section = header.closest('.menu-section');
            const sidebarMenu = header.closest('.sidebar-menu');
            if (!section || !sidebarMenu) return;

            const isAlreadyActive = section.classList.contains('active-category');
            const { menuSections, subMenuButtons } = refreshMenuSelectors();

            subMenuButtons.forEach(btn => {
                btn.classList.remove('panel-active');
                btn.classList.remove('selected');
            });

            menuSections.forEach(s => s.classList.remove('active-category'));

            if (!isAlreadyActive) {
                sidebarMenu.classList.add('compact-mode'); 
                section.classList.add('active-category'); 
            } else {
                sidebarMenu.classList.remove('compact-mode');
            }
        }
    });

    // مدیریت کلیک بیرون از منو
    document.addEventListener('click', function(e) {
        const isCloseBtn = e.target.closest('.close-btn, .close-button, [id*="close"], [class*="close"]');
        const isInsidePanel = e.target.closest('.panel, .modal, [id*="Panel"], [id*="panel"]:not(#main-sidebar)');

        if (isCloseBtn) {
            resetMenuStates(); 
            return; 
        }

        if (mainSidebar && mainSidebar.classList.contains('open')) {
            if (!mainSidebar.contains(e.target) && e.target !== menuFab && !isInsidePanel) {
                mainSidebar.classList.remove('open');
                menuFab.classList.remove('open-mode');
                setTimeout(() => {
                    resetMenuStates();
                }, 900);
            }
        }
    });

    // مدیریت کلیک روی دکمه‌های زیرمنو
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.add-item-btn');
        if (btn) {
            const { subMenuButtons } = refreshMenuSelectors();
            
            subMenuButtons.forEach(b => {
                b.classList.remove('selected');
                b.classList.remove('panel-active');
            });
            
            btn.classList.add('selected');

            if (btn.classList.contains('has-panel')) {
                const currentSection = btn.closest('.menu-section');
                if (currentSection) {
                    const allBtnsInSection = currentSection.querySelectorAll('.add-item-btn');
                    allBtnsInSection.forEach(b => b.classList.add('panel-active'));
                }
            }
        }
    });
});
