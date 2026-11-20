// متغیری برای ذخیره اینکه در حال حاضر کدام بخش کافه بار را می‌خواهیم رنگ کنیم
let currentActiveCbPart = null;

// =====================================
// تابع ساختار اولیه شیء کافه بار (با اضافه شدن ترمووال)
// =====================================
function ensureCoffeeBarStructure(cabinet) {
    if (!cabinet) return;
    
    // مقادیر پیش‌فرض ترمووال برای هر قطعه
    const defaultThermo = () => ({
        active: false,
        count: 3,
        depth: 2,
        width: 4,
        height: 80,
        color: '#FFFFFF',
        colorName: 'سفید یخچالی',
        finish: 'matte'
    });

    if (!cabinet.coffeeBarParts) {
        cabinet.coffeeBarParts = {
            right:  { active: true, mat: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte', thermo: defaultThermo() },
            left:   { active: true, mat: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte', thermo: defaultThermo() },
            top:    { active: true, mat: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte', thermo: defaultThermo() },
            bottom: { active: true, mat: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte', thermo: defaultThermo() },
            back:   { active: true, mat: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte', thermo: defaultThermo() },
            front:  { 
                active: false,
                isCurved: false,
                height: 80,
                mat: 'mdf',
                color: '#FFFFFF',
                colorName: 'سفید یخچالی',
                finish: 'matte'
            }
        };
    } else {
        // اگر ساختار قبلاً ساخته شده اما بخش ترمووال/پرداخت نداشت، به‌روزرسانی شود
        const mainParts = ['right', 'left', 'top', 'bottom', 'back'];
        mainParts.forEach(p => {
            if (cabinet.coffeeBarParts[p]) {
                if (!cabinet.coffeeBarParts[p].thermo) {
                    cabinet.coffeeBarParts[p].thermo = defaultThermo();
                } else if (!cabinet.coffeeBarParts[p].thermo.finish) {
                    cabinet.coffeeBarParts[p].thermo.finish = 'matte';
                }
                if (!cabinet.coffeeBarParts[p].finish) {
                    cabinet.coffeeBarParts[p].finish = 'matte';
                }
            }
        });
        if (cabinet.coffeeBarParts.front && !cabinet.coffeeBarParts.front.finish) {
            cabinet.coffeeBarParts.front.finish = 'matte';
        }
    }
}

// =====================================
// توابع باز و بسته کردن پنل کافه بار
// =====================================
function openCoffeeBarEditorPanel() {
    if (typeof selectedId !== 'undefined' && selectedId !== -1) {
        let selectedCabinet = cabinets.find(c => c.id === selectedId);
        if (selectedCabinet) {
            ensureCoffeeBarStructure(selectedCabinet);
            syncCoffeeBarUI(selectedCabinet);
        }
    }

    const panel = document.getElementById('coffeebar-editor-panel');
    if (panel) panel.classList.add('active');
}

function closeCoffeeBarEditorPanel() {
    const panel = document.getElementById('coffeebar-editor-panel');
    if (panel) panel.classList.remove('active');
}

// =====================================
// همگام‌سازی عناصر HTML با کابینت انتخاب‌شده
// =====================================
function syncCoffeeBarUI(cabinet) {
    if (!cabinet) return;

    // ۱. چک‌باکس اصلی و نمایش کانتینر
    const masterToggle = document.getElementById('cb-master-toggle');
    if (masterToggle) masterToggle.checked = Boolean(cabinet.isCoffeeBar);

    const container = document.getElementById('coffeebar-parts-container');
    if (container) container.style.display = cabinet.isCoffeeBar ? 'block' : 'none';

    if (!cabinet.coffeeBarParts) return;

    // ۲. به‌روزرسانی بخش‌های اصلی (شامل ترمووال)
    const mainParts = ['right', 'left', 'top', 'bottom', 'back'];
    mainParts.forEach(part => {
        const pData = cabinet.coffeeBarParts[part];
        if (!pData) return;

        // وضعیت فعال بودن قطعه
        const toggle = document.getElementById(`cb-${part}-toggle`);
        if (toggle) toggle.checked = Boolean(pData.active);

        // جنس متریال قطعه
        const matSelect = document.getElementById(`cb-${part}-mat`);
        if (matSelect) matSelect.value = pData.mat || 'mdf';

        // متن رنگ قطعه
        const colorInput = document.getElementById(`cb-${part}-color`);
        if (colorInput) colorInput.value = pData.colorName || pData.color || '';

        // پرداخت سطح قطعه
        const finishSelect = document.getElementById(`cb-${part}-finish`);
        if (finishSelect) finishSelect.value = pData.finish || 'matte';

        // تنظیمات ترمووال
        if (pData.thermo) {
            const thermoToggle = document.getElementById(`cb-${part}-thermo-toggle`);
            if (thermoToggle) thermoToggle.checked = Boolean(pData.thermo.active);

            const thermoDetails = document.getElementById(`cb-${part}-thermo-details`);
            if (thermoDetails) thermoDetails.style.display = pData.thermo.active ? 'block' : 'none';

            const countInput = document.getElementById(`cb-${part}-thermo-count`);
            if (countInput) countInput.value = pData.thermo.count || 3;

            const depthInput = document.getElementById(`cb-${part}-thermo-depth`);
            if (depthInput) depthInput.value = pData.thermo.depth || 2;

            const widthInput = document.getElementById(`cb-${part}-thermo-width`);
            if (widthInput) widthInput.value = pData.thermo.width || 4;

            const heightInput = document.getElementById(`cb-${part}-thermo-height`);
            if (heightInput) heightInput.value = pData.thermo.height || 80;

            const thermoColorInput = document.getElementById(`cb-${part}-thermo-color`);
            if (thermoColorInput) thermoColorInput.value = pData.thermo.colorName || pData.thermo.color || '';

            const thermoFinishSelect = document.getElementById(`cb-${part}-thermo-finish`);
            if (thermoFinishSelect) thermoFinishSelect.value = pData.thermo.finish || 'matte';
        }
    });

    // ۳. تنظیمات جزئیات پیشخوان
    const front = cabinet.coffeeBarParts.front;
    if (front) {
        const toggleFront = document.getElementById('cb-front-toggle');
        if (toggleFront) toggleFront.checked = Boolean(front.active);

        const frontMatSelect = document.getElementById('cb-front-mat');
        if (frontMatSelect) frontMatSelect.value = front.mat || 'mdf';

        const frontColorInput = document.getElementById('cb-front-color');
        if (frontColorInput) frontColorInput.value = front.colorName || front.color || '';

        const frontFinishSelect = document.getElementById('cb-front-finish');
        if (frontFinishSelect) frontFinishSelect.value = front.finish || 'matte';

        const detailsContainer = document.getElementById('cb-front-details');
        if (detailsContainer) detailsContainer.style.display = front.active ? 'block' : 'none';

        const curvedToggle = document.getElementById('cb-front-curved');
        if (curvedToggle) curvedToggle.checked = Boolean(front.isCurved);

        const heightGroup = document.getElementById('cb-front-height-group');
        if (heightGroup) heightGroup.style.display = front.isCurved ? 'block' : 'none';

        const heightInput = document.getElementById('cb-front-height');
        if (heightInput) heightInput.value = front.height || 80;
    }
}

window.onCoffeeBarFinishChange = function(partName, value) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    const selectedCabinet = cabinets.find(c => c.id === selectedId);
    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);
    if (!selectedCabinet.coffeeBarParts[partName]) return;
    selectedCabinet.coffeeBarParts[partName].finish = value || 'matte';
    if (typeof render3D === 'function') render3D();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets) Kitchen3D.refreshCabinets();
};

window.onCoffeeBarThermoFinishChange = function(partName, value) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    const selectedCabinet = cabinets.find(c => c.id === selectedId);
    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);
    if (!selectedCabinet.coffeeBarParts[partName] || !selectedCabinet.coffeeBarParts[partName].thermo) return;
    selectedCabinet.coffeeBarParts[partName].thermo.finish = value || 'matte';
    if (typeof render3D === 'function') render3D();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets) Kitchen3D.refreshCabinets();
};

// =====================================
// تغییر وضعیت اصلی کافه بار
// =====================================
function toggleMasterCoffeeBar(isActive) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);
    if (!selectedCabinet) return;

    selectedCabinet.isCoffeeBar = isActive;
    ensureCoffeeBarStructure(selectedCabinet);

    if (isActive) {
        selectedCabinet.showDoors = false;
        selectedCabinet.hasDoor = false;
        selectedCabinet.color = selectedCabinet.color || '#FFFFFF';
        selectedCabinet.doorColor = selectedCabinet.doorColor || '#FFFFFF';
    } else {
        selectedCabinet.showDoors = true; 
        selectedCabinet.hasDoor = true;
    }

    syncCoffeeBarUI(selectedCabinet);

    if (typeof draw === 'function') draw();
    if (typeof render3D === 'function') render3D();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets) Kitchen3D.refreshCabinets();
}

// فعال/غیرفعال کردن هر یک از اجزا
function toggleCbPart(partName, isActive) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);

    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);

    if (!selectedCabinet.coffeeBarParts[partName]) {
        selectedCabinet.coffeeBarParts[partName] = { active: isActive, mat: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی' };
    } else {
        selectedCabinet.coffeeBarParts[partName].active = isActive;
    }

    if (partName === 'front') {
        const detailsContainer = document.getElementById('cb-front-details');
        if (detailsContainer) {
            detailsContainer.style.display = isActive ? 'block' : 'none';
        }
    }
    
    if (typeof render3D === 'function') render3D();
}

// تغییر متریال
function updateCbMaterial(partName, materialVal) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);

    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);

    selectedCabinet.coffeeBarParts[partName].mat = materialVal;
    if (typeof render3D === 'function') render3D();
}

// =====================================
// توابع مخصوص مدیریت ترمووال قطعات
// =====================================
function toggleCbThermo(partName, isActive) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);

    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);

    if (selectedCabinet.coffeeBarParts[partName] && selectedCabinet.coffeeBarParts[partName].thermo) {
        selectedCabinet.coffeeBarParts[partName].thermo.active = isActive;
    }

    const thermoDetails = document.getElementById(`cb-${partName}-thermo-details`);
    if (thermoDetails) {
        thermoDetails.style.display = isActive ? 'block' : 'none';
    }

    if (typeof render3D === 'function') render3D();
}

function updateCbThermoProp(partName, propName, value) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);

    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);

    if (selectedCabinet.coffeeBarParts[partName] && selectedCabinet.coffeeBarParts[partName].thermo) {
        selectedCabinet.coffeeBarParts[partName].thermo[propName] = parseFloat(value) || value;
    }

    if (typeof render3D === 'function') render3D();
}

// مودال رنگ مخصوص ترمووال
function openCoffeeBarThermoMaterialModal(partName) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);
    
    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);

    const matCategory = selectedCabinet.coffeeBarParts[partName].mat || 'mdf';

    const titleMap = {
        'right': 'انتخاب طرح و رنگ ترمووال دیواره راست', 
        'left': 'انتخاب طرح و رنگ ترمووال دیواره چپ',
        'top': 'انتخاب طرح و رنگ ترمووال سقف', 
        'bottom': 'انتخاب طرح و رنگ ترمووال کف', 
        'back': 'انتخاب طرح و رنگ ترمووال پشت (فیبر)'
    };
    const modalTitle = titleMap[partName] || 'انتخاب طرح و رنگ ترمووال';

    if (typeof openUniversalModal === 'function') {
        openUniversalModal(modalTitle, matCategory, function(selectedItem) {
            applySelectedMaterialToThermo(partName, selectedItem);
        });
    }
}

function applySelectedMaterialToThermo(partName, item) {
    if (!item) return;
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);

    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);

    const applyValue = item.code ? item.code : item.texture;

    if (selectedCabinet.coffeeBarParts[partName] && selectedCabinet.coffeeBarParts[partName].thermo) {
        selectedCabinet.coffeeBarParts[partName].thermo.color = applyValue;
        selectedCabinet.coffeeBarParts[partName].thermo.colorName = item.name || 'انتخاب شده';
    }

    const inputId = `cb-${partName}-thermo-color`;
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        inputElement.value = item.name || applyValue;
    }

    if (typeof render3D === 'function') render3D();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets) Kitchen3D.refreshCabinets();
}

// =====================================
// اتصال به مودال انتخاب رنگ و متریال اصلی
// =====================================
function openCoffeeBarMaterialModal(partName) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);
    
    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);

    currentActiveCbPart = partName;
    const matCategory = selectedCabinet.coffeeBarParts[partName].mat || 'mdf';

    const titleMap = {
        'right': 'انتخاب طرح و رنگ دیواره راست کافه بار', 
        'left': 'انتخاب طرح و رنگ دیواره چپ کافه بار',
        'top': 'انتخاب طرح و رنگ سقف کافه بار', 
        'bottom': 'انتخاب طرح و رنگ کف کافه بار', 
        'back': 'انتخاب طرح و رنگ پشت کافه بار (فیبر)',
        'front': 'انتخاب طرح و رنگ پیشخوان جلویی کافه بار'
    };
    const modalTitle = titleMap[partName] || 'انتخاب طرح و رنگ کافه بار';

    if (typeof openUniversalModal === 'function') {
        openUniversalModal(modalTitle, matCategory, function(selectedItem) {
            applySelectedMaterialToCoffeeBar(partName, selectedItem);
        });
    }
}

function applySelectedMaterialToCoffeeBar(partName, item) {
    if (!item) return;
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);

    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);

    const applyValue = item.code ? item.code : item.texture;

    selectedCabinet.coffeeBarParts[partName].color = applyValue; 
    selectedCabinet.coffeeBarParts[partName].colorName = item.name || 'انتخاب شده'; 
    
    if (partName === 'right' || partName === 'left' || partName === 'top') {
        selectedCabinet.color = applyValue;
        selectedCabinet.doorColor = applyValue;
    }

    // به‌روزرسانی متن اینپوت در UI
    const inputId = `cb-${partName}-color`;
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        inputElement.value = item.name || applyValue;
    }

    // پاکسازی کش تکسچر برای کابینت انتخاب‌شده جهت بروزرسانی رندر ۳D
    if (window.isolatedDoorTextures) {
        const labels = ['دیواره راست', 'دیواره چپ', 'سقف', 'کف', 'ورق پشت ۱۶میل', 'پیشخوان جلوی'];
        labels.forEach(lbl => {
            delete window.isolatedDoorTextures[`${lbl} کافه بار U${selectedCabinet.id}`];
        });
    }
    
    if (typeof render3D === 'function') render3D();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets) Kitchen3D.refreshCabinets();
}

// تابع آپدیت خصوصیات پیشخوان
function updateCbFrontProperty(propName, value) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    let selectedCabinet = cabinets.find(c => c.id === selectedId);

    if (!selectedCabinet) return;
    ensureCoffeeBarStructure(selectedCabinet);

    if (propName === 'height') value = parseFloat(value) || 0; 
    
    if (propName === 'isCurved') {
        value = Boolean(value);
        const heightGroup = document.getElementById('cb-front-height-group');
        if (heightGroup) heightGroup.style.display = value ? 'block' : 'none';
    }

    selectedCabinet.coffeeBarParts.front[propName] = value;
    if (typeof render3D === 'function') render3D();
}

function applyCoffeeBarSettings() {
    if (typeof render3D === 'function') render3D();
    closeCoffeeBarEditorPanel();
}
