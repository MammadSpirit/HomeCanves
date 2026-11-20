// ۱. تابع لود کردن منوی اصلی (سایدبار)
async function loadMainMenu() {
    try {
        const response = await fetch('Kitchen-menu/Kitchen-menu-sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-container').innerHTML = html;

        if (typeof initMainSidebar === 'function') {
            initMainSidebar();
        }
    } catch (error) {
        console.error('خطا در بارگذاری منوی اصلی:', error);
    }
}

// ۲. تابع جدید برای لود کردن پنل تنظیمات ابعاد
async function loadSizePanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/Size-panel/Size-panel.html'); 
        const html = await response.text();
        
        document.getElementById('size-panel-container').innerHTML = html;
        
    } catch (error) {
        console.error('خطا در بارگذاری پنل ابعاد:', error);
    }
}

async function loadDoorPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/Door-panel/Door-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل door-panel.html');
        const html = await response.text();
        document.getElementById('door-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Door Panel:', error);
    }
}

async function loadShelvesPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/shelves-panel/shelves-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل shelves-panel.html');
        const html = await response.text();
        document.getElementById('shelves-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Shelves Panel:', error);
    }
}

async function loadCountertopPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/countertop-panel/countertop-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل countertop-panel.html');
        const html = await response.text();
        document.getElementById('countertop-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Countertop Panel:', error);
    }
}

async function loadKickboardPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/kickboard-panel/kickboard-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل kickboard-panel.html');
        const html = await response.text();
        document.getElementById('kickboard-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Kickboard Panel:', error);
    }
}
async function loadFridgeWrapPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/fridgewrap-panel/fridgewrap-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل fridgewrap-panel.html');
        const html = await response.text();
        document.getElementById('fridgewrap-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Fridge Wrap Panel:', error);
    }
}

async function loadFacadeboxPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/Facadebox-panel/Facadebox-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل Facadebox-panel.html');
        const html = await response.text();
        document.getElementById('facadebox-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Facadebox Panel:', error);
    }
}

async function loadCrownPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/crown-panel/Crown-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل crown-panel.html');
        const html = await response.text();
        document.getElementById('crown-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Crown Panel:', error);
    }
}

async function loadDrawerPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/drawer-panel/drawer-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل drawer-panel.html');
        const html = await response.text();
        document.getElementById('drawer-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Drawer Panel:', error);
    }
}

async function loadFacadePanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/facade-panel/facade-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل facade-panel.html');
        const html = await response.text();
        document.getElementById('facade-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Facade Panel:', error);
    }
}

async function loadInterPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/interpanel-panel/interpanel-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل interpanel-panel.html');
        const html = await response.text();
        document.getElementById('interpanel-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Interpanel Panel:', error);
    }
}

async function loadPillarPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/pillar-panel/pillar-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل pillar-panel.html');
        const html = await response.text();
        document.getElementById('pillar-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Pillar Panel:', error);
    }
}

async function loadRoomMasterPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/roommaster-panel/Roommaster-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل Roommaster-panel.html');
        const html = await response.text();
        document.getElementById('roommaster-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Room Master Panel:', error);
    }
}

async function loadAddFridgePanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/Addfridge-panel/Addfridge-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل Addfridge-panel.html');
        const html = await response.text();
        document.getElementById('add-fridge-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Add Fridge Panel:', error);
    }
}


async function loadColorManagerPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/color-manager-panel/color-manager-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل color-manager-panel.html');
        const html = await response.text();
        const container = document.getElementById('color-manager-panel-container');
        if (container) container.innerHTML = html;
    } catch (error) {
        console.error('Error loading Color Manager Panel:', error);
    }
}



async function loadHoodPanel() {
    try {
        // مسیر فایل را بر اساس ساختار پوشه‌های خودت تنظیم کن
        const response = await fetch('Kitchen-menu/Menu/hood-panel/hood-panel.html'); 
        const html = await response.text();
        
        document.getElementById('hood-panel-container').innerHTML = html;
        
    } catch (error) {
        console.error('خطا در بارگذاری پنل کلاف هود:', error);
    }
}

// تابع لود کردن پنل مدیریت کافه بار
async function loadCoffeeBarPanel() {
    try {
        // مسیر فایل پنل کافه بار بر اساس ساختار پوشه ها
        const response = await fetch('Kitchen-menu/Menu/coffeebar-panel/coffeebar-panel.html'); 
        const html = await response.text();
        
        // قرار دادن محتوا در یک کانتینر مخصوص در فایل اصلی (index.html)
        document.getElementById('coffeebar-panel-container').innerHTML = html;
        
    } catch (error) {
        console.error('خطا در بارگذاری پنل مدیریت کافه بار:', error);
    }
}


async function loadCharchobPanel() {
    try {
        const response = await fetch('Komod-divari/komod-divari-menu/charchob/charchob.html');
        if (!response.ok) throw new Error('خطا در لود فایل charchob.html');
        const html = await response.text();
        document.getElementById('charchob-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Charchob Panel:', error);
    }
}


async function loadRokoobPanel() {
    try {
        const response = await fetch('Komod-divari/komod-divari-menu/rokoob/rokoob.html');
        if (!response.ok) throw new Error('خطا در لود فایل rokoob.html');
        const html = await response.text();
        document.getElementById('rokoob-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Rokoob Panel:', error);
    }
}

async function loadKeshoPanel() {
    try {
        const response = await fetch('Komod-divari/komod-divari-menu/kesho/kesho.html');
        if (!response.ok) throw new Error('خطا در لود فایل kesho.html');
        const html = await response.text();
        document.getElementById('kesho-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Kesho Panel:', error);
    }
}

async function loadBaghelNamaPanel() {
    try {
        const container = document.getElementById('baghel-nama-panel-container');
        if (!container) return;
        const response = await fetch('Komod-divari/komod-divari-menu/baghel-nama/baghel-nama.html');
        if (!response.ok) throw new Error('خطا در لود فایل baghel-nama.html');
        const html = await response.text();
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading BaghelNama Panel:', error);
    }
}


async function loadBaghelNamaManagePanel() {
    try {
        const container = document.getElementById('baghel-nama-manage-panel-container');
        if (!container) return;
        const response = await fetch('Komod-divari/komod-divari-menu/baghel-nama-manage/baghel-nama-manage.html');
        if (!response.ok) throw new Error('خطا در لود فایل baghel-nama-manage.html');
        const html = await response.text();
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading BaghelNama Manage Panel:', error);
    }
}


async function loadAyenePanel() {
    try {
        const container = document.getElementById('ayene-panel-container');
        if (!container) return;
        const response = await fetch('Komod-divari/komod-divari-menu/ayene/ayene.html');
        if (!response.ok) throw new Error('خطا در لود فایل ayene.html');
        const html = await response.text();
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading Ayene Panel:', error);
    }
}


async function loadAyeneManagePanel() {
    try {
        const container = document.getElementById('ayene-manage-panel-container');
        if (!container) return;
        const response = await fetch('Komod-divari/komod-divari-menu/ayene-manage/ayene-manage.html');
        if (!response.ok) throw new Error('خطا در لود فایل ayene-manage.html');
        const html = await response.text();
        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading Ayene Manage Panel:', error);
    }
}

async function loadQuickLayoutPanel() {
    try {
        const response = await fetch('Kitchen-menu/Menu/quicklayout-panel/quicklayout-panel.html');
        if (!response.ok) throw new Error('خطا در لود فایل quicklayout-panel.html');
        const html = await response.text();
        document.getElementById('quicklayout-panel-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Quick Layout Panel:', error);
    }
}










// ۳. فراخوانی توابع
loadMainMenu();
loadSizePanel();
loadDoorPanel();
loadShelvesPanel();
loadCountertopPanel();
loadKickboardPanel();
loadFridgeWrapPanel();
loadFacadeboxPanel();
loadCrownPanel();
loadDrawerPanel();
loadFacadePanel();
loadInterPanel();
loadPillarPanel();
loadRoomMasterPanel();
loadAddFridgePanel();
loadColorManagerPanel();
loadHoodPanel();
loadCoffeeBarPanel();
loadCharchobPanel();
loadRokoobPanel();
loadKeshoPanel();
loadBaghelNamaPanel();
loadBaghelNamaManagePanel();
loadAyenePanel();
loadAyeneManagePanel();
loadQuickLayoutPanel();