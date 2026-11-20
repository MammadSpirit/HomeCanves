let currentCabinetForHood = null;
let currentHoodPart = null; // 'back', 'sides', 'ceiling'

// حروف اول کلمه را بزرگ می‌کند (برای ساختن کلیدهای آبجکت)
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ================= باز و بسته کردن پنل اصلی =================
function openHoodWrapEditorPanel() {
    if (typeof selectedId === 'undefined' || selectedId === -1) {
        alert("لطفاً ابتدا یک کابینت انتخاب کنید!");
        return;
    }
    
    currentCabinetForHood = cabinets.find((c) => c.id === selectedId);
    if (!currentCabinetForHood || !currentCabinetForHood.isHoodWrap) {
        alert("لطفاً یک کلاف هود انتخاب کنید.");
        return;
    }
    
    // ۱. لود تنظیمات پایه
    document.getElementById('hoodCeilingHeight').value = currentCabinetForHood.hoodCeilingHeight || 40;
    document.getElementById('showMetalHood').checked = currentCabinetForHood.showMetalHood !== false;

    // ۲. لود وضعیت سوییچ‌ها
    document.getElementById('enableHoodBack').checked = currentCabinetForHood.enableHoodBack !== false;
    document.getElementById('enableHoodSides').checked = currentCabinetForHood.enableHoodSides !== false;
    document.getElementById('enableHoodCeiling').checked = currentCabinetForHood.enableHoodCeiling !== false;

    // ۳. لود نوع متریال انتخاب شده
    document.getElementById('hood-back-material').value = currentCabinetForHood.hoodBackMaterialType || 'mdf';
    document.getElementById('hood-sides-material').value = currentCabinetForHood.hoodSidesMaterialType || 'mdf';
    document.getElementById('hood-ceiling-material').value = currentCabinetForHood.hoodCeilingMaterialType || 'mdf';

    // ۴. لود نام رنگ‌های انتخاب شده در اینپوت‌ها
    document.getElementById('hood-back-color').value = currentCabinetForHood.hoodBackMaterialName || '';
    document.getElementById('hood-sides-color').value = currentCabinetForHood.hoodSidesMaterialName || '';
    document.getElementById('hood-ceiling-color').value = currentCabinetForHood.hoodCeilingMaterialName || '';

    // ۵. پرداخت سطح (جدا از جنس ورق)
    const backFin = document.getElementById('hood-back-finish');
    const sidesFin = document.getElementById('hood-sides-finish');
    const ceilingFin = document.getElementById('hood-ceiling-finish');
    if (backFin) backFin.value = currentCabinetForHood.hoodBackFinish || 'matte';
    if (sidesFin) sidesFin.value = currentCabinetForHood.hoodSidesFinish || 'matte';
    if (ceilingFin) ceilingFin.value = currentCabinetForHood.hoodCeilingFinish || 'matte';

    // نمایش پنل
    const panel = document.getElementById('hoodWrapEditorPanel');
    if (panel) {
        panel.style.display = ''; 
        panel.classList.remove('hidden');
        panel.classList.add('active'); 
    }
}

function closeHoodWrapEditorPanel() {
    const panel = document.getElementById('hoodWrapEditorPanel');
    if (panel) {
        panel.classList.remove('active');
        panel.classList.add('hidden');
        setTimeout(() => { panel.style.display = 'none'; }, 300);
    }
}

// ================= ذخیره تنظیمات پایه و سوییچ‌ها =================
function updateHoodSettings() {
    if (!currentCabinetForHood && typeof selectedId !== 'undefined' && selectedId !== -1) {
        currentCabinetForHood = cabinets.find(c => c.id === selectedId);
    }
    if (!currentCabinetForHood) return;

    currentCabinetForHood.hoodCeilingHeight = parseFloat(document.getElementById('hoodCeilingHeight').value) || 40;
    currentCabinetForHood.showMetalHood = document.getElementById('showMetalHood').checked;

    currentCabinetForHood.enableHoodBack = document.getElementById('enableHoodBack').checked;
    currentCabinetForHood.enableHoodSides = document.getElementById('enableHoodSides').checked;
    currentCabinetForHood.enableHoodCeiling = document.getElementById('enableHoodCeiling').checked;

    // پرداخت سطح هر بخش
    const backFin = document.getElementById('hood-back-finish');
    const sidesFin = document.getElementById('hood-sides-finish');
    const ceilingFin = document.getElementById('hood-ceiling-finish');
    if (backFin) currentCabinetForHood.hoodBackFinish = backFin.value || 'matte';
    if (sidesFin) currentCabinetForHood.hoodSidesFinish = sidesFin.value || 'matte';
    if (ceilingFin) currentCabinetForHood.hoodCeilingFinish = ceilingFin.value || 'matte';

    if (typeof draw === 'function') draw(); 
    if (typeof init3D === 'function') init3D();
}

window.onHoodFinishChange = function(part, value) {
    if (!currentCabinetForHood) return;
    const Part = capitalize(part); // Back / Sides / Ceiling
    currentCabinetForHood[`hood${Part}Finish`] = value || 'matte';
    if (typeof draw === 'function') draw();
    if (typeof init3D === 'function') init3D();
    else if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets) {
        Kitchen3D.refreshCabinets();
    }
};

function updateHoodMaterialType(part, type) {
    if (!currentCabinetForHood) return;
    const Part = capitalize(part);
    currentCabinetForHood[`hood${Part}MaterialType`] = type;
}

// ================= مدیریت اتصال به مودال مرکزی و هوشمند پروژه =================

function openHoodColorPicker(part) {
    currentHoodPart = part;
    
    // پیدا کردن دسته‌بندی و نوع متریال انتخاب شده از روی سلکت‌باکس مربوطه (mdf، highGloss و...)
    const categorySelect = document.getElementById(`hood-${part}-material`);
    const category = categorySelect ? categorySelect.value : 'mdf';

    // تعیین عنوان فارسی و مناسب برای هدر مودال مرکزی
    let partTitle = "پشت کلاف هود";
    if (part === 'sides') partTitle = "دیواره‌های کلاف هود";
    if (part === 'ceiling') partTitle = "سقف کلاف هود";

    const title = `انتخاب رنگ و طرح برای ${partTitle}`;

    // 🟢 فراخوانی مودال یونیورسال مرکزی به همراه پاس دادن کال‌بک هوشمند
    if (typeof window.openUniversalModal === 'function') {
        window.openUniversalModal(title, category, function(selectedMaterial) {
            applySelectedHoodMaterial(selectedMaterial);
        });
    } else {
        console.error("تابع openUniversalModal در سیستم یافت نشد!");
    }
}

// تابع میانی برای ثبت متریال برگزیده روی آبجکت کابینت جاری
function applySelectedHoodMaterial(material) {
    if (!currentHoodPart || !currentCabinetForHood) return;

    const Part = capitalize(currentHoodPart); // 'Back', 'Sides' یا 'Ceiling'
    const colorValue = material.texture || material.code || "#ffffff";
    const colorName = material.name || "متریال انتخاب شده";

    // آپدیت اینپوت متناظر در پنل
    const colorInput = document.getElementById(`hood-${currentHoodPart}-color`);
    if (colorInput) {
        colorInput.value = colorName;
        colorInput.dataset.selectedValue = colorValue;
    }
    
    // ثبت مقادیر در داده‌های ساختاری کابینت کلاف هود
    currentCabinetForHood[`hood${Part}MaterialName`] = colorName;
    currentCabinetForHood[`hood${Part}MaterialValue`] = colorValue;

    // رفرش آنی نقشه‌ها و فضا
    if (typeof draw === 'function') draw();
    if (typeof init3D === 'function') init3D();
    
    currentHoodPart = null; // ریست وضعیت پارامتر جاری هود
}

// ================= اعمال تغییرات و بستن پنل =================
function applyHoodChanges() {
    if (typeof updateHoodSettings === 'function') {
        updateHoodSettings(); 
    }
    if (typeof draw === 'function') draw(); 
    if (typeof init3D === 'function') init3D();
    if (typeof closeHoodWrapEditorPanel === 'function') {
        closeHoodWrapEditorPanel();
    }
}

window.applyHoodChanges = applyHoodChanges;
window.openHoodWrapEditorPanel = openHoodWrapEditorPanel;
window.closeHoodWrapEditorPanel = closeHoodWrapEditorPanel;
window.updateHoodSettings = updateHoodSettings;
window.updateHoodMaterialType = updateHoodMaterialType;
window.openHoodColorPicker = openHoodColorPicker;
window.onHoodFinishChange = window.onHoodFinishChange;
