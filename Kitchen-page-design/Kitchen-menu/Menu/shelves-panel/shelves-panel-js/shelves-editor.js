// js/components/shelves-editor.js
// نسخه نهایی، ۱۰۰٪ کارکردی، بدون هیچ باگ سیاه!

let currentCabinetForShelves = null;
let currentShelvesMaterials = window.allMaterials?.mdf || [];// ۳ رنگ آخر انتخاب شده برای طبقه‌ها
// باز کردن پنل
window.activeShelfIndex = -1; // برای نگهداری ایندکس طبقه‌ای که در حال تنظیم رنگ آن هستیم

function openShelvesEditorPanel() {
    if (selectedId === -1) {
        alert("لطفاً ابتدا یک کابینت انتخاب کنید!");
        return;
    }

    currentCabinetForShelves = cabinets.find((c) => c.id === selectedId);
    if (!currentCabinetForShelves) return;

    window.activeShelfIndex = -1; // ریست کردن انتخاب

    document.getElementById("shelves-panel-cabinet-id").textContent = selectedId;

    const shelvesEnabled = currentCabinetForShelves.shelvesEnabled !== false;
    document.getElementById("shelves-enabled").checked = shelvesEnabled;

    let shelvesCount = currentCabinetForShelves.shelves?.length ?? 0;

        if (shelvesEnabled && shelvesCount === 0) {
        shelvesCount = 1;
        if (!Array.isArray(currentCabinetForShelves.shelves)) {
            currentCabinetForShelves.shelves = [];
        }
        // 🎯 اصلاح ابعاد اولیه برای کلاف یخچال
        let referenceHeight = currentCabinetForShelves.h || 72;
        if (currentCabinetForShelves.isFridgeWrap && currentCabinetForShelves.hasBridge !== false) {
            referenceHeight = currentCabinetForShelves.bridgeH || 40;
        }
        currentCabinetForShelves.shelves = [{ height: Math.round(referenceHeight / 2), rotation: 0 }];
    }


    document.getElementById("shelves-count").value = shelvesCount;

    document.getElementById("shelves-editor-panel").classList.add("active");

    if (typeof updateShelvesHeightList === "function") {
        updateShelvesHeightList();
    }

    if (typeof updateShelvesPreviewFromPanel === "function") {
        updateShelvesPreviewFromPanel();
    }
}

// ============ نسخه اختصاصی «طبقه» برای کمد دیواری ============
function openClosetShelvesEditorPanel() {
    const units = window.closetFrameUnits || [];
    const targetUnit = units.find(u => u.id === window.selectedClosetFrameId);

    if (!targetUnit) {
        alert("لطفاً ابتدا یک چهارچوب کمد دیواری را از روی صحنه انتخاب کنید.");
        return;
    }

    currentCabinetForShelves = targetUnit; // 🌟 دقیقاً همون یونیتی که رو صحنه انتخاب شده
    window.activeShelfIndex = -1;

    document.getElementById("shelves-panel-cabinet-id").textContent = "چهارچوب کمد دیواری";

    if (!Array.isArray(currentCabinetForShelves.shelves)) {
        currentCabinetForShelves.shelves = [];
    }

    const shelvesEnabled = currentCabinetForShelves.shelvesEnabled !== false;
    document.getElementById("shelves-enabled").checked = shelvesEnabled;

    let shelvesCount = currentCabinetForShelves.shelves.length;
    if (shelvesEnabled && shelvesCount === 0) {
        shelvesCount = 1;
        currentCabinetForShelves.shelves = [{ height: Math.round((currentCabinetForShelves.h || 280) / 2), rotation: 0 }];
    }

    document.getElementById("shelves-count").value = shelvesCount;
    document.getElementById("shelves-editor-panel").classList.add("active");

    if (typeof updateShelvesHeightList === "function") updateShelvesHeightList();
    if (typeof updateShelvesPreviewFromPanel === "function") updateShelvesPreviewFromPanel();
}

window.openClosetShelvesEditorPanel = openClosetShelvesEditorPanel;

// اعمال رنگ به کل سیستم طبقه‌های کابینت فعلی (پشتیبان/سراسری)
function applySelectedShelvesColor(colorObj) {
    const colorValue = colorObj.code || colorObj.texture || "#ffffff";
    const colorName = colorObj.name || "رنگ انتخاب شده";

    if (!currentCabinetForShelves) return;

    currentCabinetForShelves.shelvesColor = colorValue;
    
    const globalColorInput = document.getElementById("shelves-color-search");
    if (globalColorInput) globalColorInput.value = colorName;

    // آپدیت پیش‌نمایش و بوم
    updateShelvesPreview();
    if (typeof draw === 'function') draw();
    refreshBabylonShelves();
}


function refreshBabylonShelves() {
    try {
        if (window.KitchenBabylon && window.KitchenBabylon.isReady) {
            if (typeof window.KitchenBabylon.refreshCabinets === 'function') {
                window.KitchenBabylon.refreshCabinets();
            } else if (typeof window.KitchenBabylon.renderCabinets === 'function') {
                window.KitchenBabylon.renderCabinets();
            }
        }
    } catch (e) {}
}


function closeShelvesEditorPanel() {
    const panel = document.getElementById("shelves-editor-panel");
    if (panel) {
        panel.classList.remove("active");
        // اگر لازم است وضعیت انتخاب هم پاک شود، خط زیر را از کامنت در بیاور:
        // currentCabinetForShelves = null;
    }
}

// تغییر تعداد با دکمه +/-
function changeShelvesCount(delta) {
    const input = document.getElementById("shelves-count");
    const enabledCheckbox = document.getElementById("shelves-enabled");

    let currentCount = parseInt(input.value) || 0;
    let newCount = currentCount + delta;

    // اگر تیک فعال‌سازی زده شده → حداقل ۱ طبقه
    if (enabledCheckbox.checked) {
        newCount = Math.max(1, Math.min(8, newCount));
    } else {
        newCount = 0;
    }

    input.value = newCount;

    if (currentCabinetForShelves) {
        let shelves = currentCabinetForShelves.shelves || [];

        // اگر تعداد بیشتر شد → طبقه جدید اضافه کن
        while (shelves.length < newCount) {
            shelves.push({ height: 30 }); // یا هر ارتفاع پیش‌فرضی که دوست داری
        }

        // اگر تعداد کمتر شد → از آخر حذف کن
        while (shelves.length > newCount) {
            shelves.pop();
        }

        currentCabinetForShelves.shelves = shelves;

        updateShelvesHeightList();
        updateShelvesPreviewFromPanel();   // یا هر نامی که داری
        draw();   // اگر نیازه کل صفحه رفرش بشه
    }
}

// بروزرسانی لیست ارتفاع‌ها
function updateShelvesHeightList() {
    const countInput = document.getElementById("shelves-count");
    const list = document.getElementById("shelves-height-list");

    if (!countInput || !list) return;

    const count = parseInt(countInput.value, 10) || 0;

    if (!currentCabinetForShelves) {
        list.innerHTML = '<div class="shelf-empty-msg">کابینت انتخاب نشده است</div>';
        return;
    }

    if (!Array.isArray(currentCabinetForShelves.shelves)) {
        currentCabinetForShelves.shelves = [];
    }

    const shelves = currentCabinetForShelves.shelves;
    const isClosetFrame = Array.isArray(currentCabinetForShelves.parts); // 🌟 تشخیص چهارچوب کمد دیواری
    let cabinetH = currentCabinetForShelves.h ?? 72;
    let cabinetW = currentCabinetForShelves.w ?? 50;
    let cabinetD = currentCabinetForShelves.shelfBodyDepth ?? currentCabinetForShelves.d ?? 50;
    const thickness = 1.6;

    if (currentCabinetForShelves.isFridgeWrap && currentCabinetForShelves.hasBridge !== false) {
        cabinetH = currentCabinetForShelves.bridgeH || 40;
        cabinetW = currentCabinetForShelves.w - (2 * thickness);
        cabinetD = currentCabinetForShelves.bridgeD ? parseFloat(currentCabinetForShelves.bridgeD) : (currentCabinetForShelves.d - thickness);
    }

    while (shelves.length < count) {
        shelves.push({ height: Math.round(cabinetH / (count + 1)), rotation: 0 });
    }
    while (shelves.length > count) {
        shelves.pop();
    }

    list.innerHTML = "";

    if (count === 0) {
        list.innerHTML = '<div class="shelf-empty-msg">هیچ طبقه‌ای فعال نیست</div>';
        updateShelvesPreview();
        return;
    }

    const createStyledField = (labelText, inputElement, flexSize = "1") => {
        const wrap = document.createElement("div");
        wrap.className = "shelf-input-block"; // کلاس جدید برای کنترل دو ستونه
        
        const lbl = document.createElement("small");
        lbl.className = "shelf-field-label";
        lbl.textContent = labelText; 
        
        inputElement.className = "shelf-field-input";
        
        wrap.appendChild(lbl);
        wrap.appendChild(inputElement);
        return wrap;
    };

    for (let i = 0; i < count; i++) {
        const shelf = shelves[i];
        
        let valueVal = shelf.height ?? Math.round(cabinetH / (count + 1));
        const rotation = shelf.rotation ?? 0;
        const isVertical = rotation === 90;
        if (shelf.faceRotation == null) shelf.faceRotation = 0;
        const faceOut = Number(shelf.faceRotation) === 90;
        
        if (shelf.leftOffset === undefined) shelf.leftOffset = 0;
        if (shelf.width === undefined) shelf.width = cabinetW;
        if (shelf.bottomOffset === undefined) shelf.bottomOffset = 0;
        if (shelf.vertHeight === undefined) shelf.vertHeight = cabinetH;
        if (shelf.depth === undefined) shelf.depth = cabinetD;
        if (shelf.depthAlign === undefined) shelf.depthAlign = "back";
if (shelf.sideAnchor === undefined) shelf.sideAnchor = "left"; // 🌟 سمت مرجع فاصله
       if (shelf.closetBackOffset === undefined) shelf.closetBackOffset = 0; // 🌟 فاصله اضافه به عقب (فقط کمد دیواری)
       
       const labelText = isVertical
            ? (shelf.sideAnchor === "right" ? "فاصله از راست (اصلی)" : "فاصله از چپ (اصلی)")
            : "ارتفاع از کف";

        const item = document.createElement("div");
        item.className = "shelf-card";
        if (window.activeShelfIndex === i) {
            item.classList.add("active");
        }

        item.onclick = (e) => {
            if (e.target.tagName !== 'INPUT' && 
                e.target.tagName !== 'SELECT' && 
                e.target.tagName !== 'BUTTON' && 
                e.target.tagName !== 'LABEL' && 
                e.target.tagName !== 'SPAN') {
                
                window.activeShelfIndex = window.activeShelfIndex === i ? -1 : i;
                updateShelvesHeightList(); 
            }
        };

        // --- ROW 1: تایتل کارت ---
        const row1 = document.createElement("div");
        row1.className = "shelf-card-header";
        
        const title = document.createElement("strong");
        title.className = "shelf-card-title";
        title.textContent = `طبقه ${i + 1} (${isVertical ? 'عمودی' : 'افقی'}${faceOut ? ' · روبرو مثل پشت' : ''})`;
        
        row1.appendChild(title);
        item.appendChild(row1);

        // 📦 زون اول: مقادیر پایه ابعادی (دو ستونه)
        const valuesSection = document.createElement("div");
        valuesSection.className = "shelf-zone-section";
        valuesSection.innerHTML = `<div class="shelf-zone-title">📐 مقادیر ابعادی</div>`;

        const valuesGrid = document.createElement("div");
        valuesGrid.className = "shelf-card-grid-2col"; // گرید ۲ ستونه

        const heightInput = document.createElement("input");
        heightInput.type = "number"; 
        heightInput.step = "0.1";
        heightInput.value = valueVal;
        heightInput.oninput = function() { shelf.height = parseFloat(this.value) || 0; updateShelvesPreview(); };
        valuesGrid.appendChild(createStyledField(labelText, heightInput));

   if (!isVertical) {
            const leftInput = document.createElement("input");
            leftInput.type = "number"; 
            leftInput.step = "0.1";
            leftInput.value = shelf.leftOffset;
            leftInput.oninput = function() { shelf.leftOffset = parseFloat(this.value) || 0; updateShelvesPreview(); };
            const leftLabel = shelf.sideAnchor === "right" ? "فاصله از راست" : "فاصله از چپ";
            valuesGrid.appendChild(createStyledField(leftLabel, leftInput));

            // 🌟 دکمه انتخاب سمت مرجع (چپ/راست)
            const anchorWrapH = document.createElement("div");
            const anchorLblH = document.createElement("small");
            anchorLblH.className = "shelf-field-label";
            anchorLblH.textContent = "سمت مرجع";
            const anchorBtnH = document.createElement("button");
            anchorBtnH.className = "shelf-rot-btn";
            anchorBtnH.textContent = shelf.sideAnchor === "right" ? "راست" : "چپ";
            anchorBtnH.onclick = () => {
                shelf.sideAnchor = shelf.sideAnchor === "right" ? "left" : "right";
                updateShelvesHeightList();
                updateShelvesPreview();
            };
            anchorWrapH.appendChild(anchorLblH);
            anchorWrapH.appendChild(anchorBtnH);
            valuesGrid.appendChild(anchorWrapH);

            const wInput = document.createElement("input");
            wInput.type = "number"; 
            wInput.step = "0.1";
            wInput.value = shelf.width;
            wInput.oninput = function() { shelf.width = parseFloat(this.value) || 0; updateShelvesPreview(); };
            valuesGrid.appendChild(createStyledField("عرض طبقه", wInput));
} else {
            // 🌟 دکمه انتخاب سمت مرجع (چپ/راست) برای طبقه عمودی
            const anchorWrapV = document.createElement("div");
            const anchorLblV = document.createElement("small");
            anchorLblV.className = "shelf-field-label";
            anchorLblV.textContent = "سمت مرجع";
            const anchorBtnV = document.createElement("button");
            anchorBtnV.className = "shelf-rot-btn";
            anchorBtnV.textContent = shelf.sideAnchor === "right" ? "راست" : "چپ";
            anchorBtnV.onclick = () => {
                shelf.sideAnchor = shelf.sideAnchor === "right" ? "left" : "right";
                updateShelvesHeightList();
                updateShelvesPreview();
            };
            anchorWrapV.appendChild(anchorLblV);
            anchorWrapV.appendChild(anchorBtnV);
            valuesGrid.appendChild(anchorWrapV);

            const botInput = document.createElement("input");
            botInput.type = "number"; 
            botInput.step = "0.1";
            botInput.value = shelf.bottomOffset;
            botInput.oninput = function() { shelf.bottomOffset = parseFloat(this.value) || 0; updateShelvesPreview(); };
            valuesGrid.appendChild(createStyledField("فاصله از کف", botInput));

            const hInput = document.createElement("input");
            hInput.type = "number"; 
            hInput.step = "0.1";
            hInput.value = shelf.vertHeight;
            hInput.oninput = function() { shelf.vertHeight = parseFloat(this.value) || 0; updateShelvesPreview(); };
            valuesGrid.appendChild(createStyledField("ارتفاع طبقه", hInput));
        }

        const dInput = document.createElement("input");
        dInput.type = "number"; 
        dInput.step = "0.1";
        dInput.value = shelf.depth;
        dInput.oninput = function() { shelf.depth = parseFloat(this.value) || 0; updateShelvesPreview(); };
        // بعد از چرخش روبرو: این مقدار = طول طبقه (صورت ورق)
        valuesGrid.appendChild(createStyledField(faceOut ? "طول طبقه" : "عمق طبقه", dInput));

        valuesSection.appendChild(valuesGrid);
        item.appendChild(valuesSection);


        // ⚙️ زون دوم: عملیات کارگاهی
        const opsSection = document.createElement("div");
        opsSection.className = "shelf-zone-section ops-bg";
        opsSection.innerHTML = `<div class="shelf-zone-title">🛠️ عملیات کارگاهی</div>`;

        // ردیف اول عملیات کارگاهی: تراز عمق، چرخش و تیک فعال‌سازی جا لیوانی
        const opsRow1 = document.createElement("div");
        opsRow1.className = "shelf-card-grid-3col"; // سیستم ۳ ستونه برای این بخش

        if (isClosetFrame) {
            shelf.depthAlign = "back"; // 🌟 کمد دیواری همیشه از پشت چهارچوب

            const backOffsetInput = document.createElement("input");
            backOffsetInput.type = "number";
            backOffsetInput.step = "0.1";
            backOffsetInput.value = shelf.closetBackOffset;
            backOffsetInput.oninput = function() {
                shelf.closetBackOffset = parseFloat(this.value) || 0;
                if (typeof draw === 'function') draw();
                if (window.Kitchen3D?.scene && typeof window.Kitchen3D.renderCabinets === 'function') {
                    window.Kitchen3D.renderCabinets();
                }
            };
            opsRow1.appendChild(createStyledField("فاصله عقب‌تر از چهارچوب", backOffsetInput));
        } else {
            const alignSelect = document.createElement("select");
            alignSelect.innerHTML = `<option value="back">پشت</option><option value="front">جلو</option>`;
            alignSelect.value = shelf.depthAlign;
            alignSelect.onchange = function() { shelf.depthAlign = this.value; updateShelvesPreview(); };
            opsRow1.appendChild(createStyledField("تراز عمق", alignSelect));
        }

        // دکمه چرخش اصلاح شده
        const rotWrap = document.createElement("div");
        const rotLabel = document.createElement("small");
        rotLabel.className = "shelf-field-label";
        rotLabel.textContent = "جهت طبقه";
        const rotBtn = document.createElement("button");
        rotBtn.className = `shelf-rot-btn ${isVertical ? 'vertical' : 'horizontal'}`;
        rotBtn.textContent = isVertical ? "افقی" : "عمودی";
        rotBtn.onclick = () => { shelf.rotation = isVertical ? 0 : 90; updateShelvesHeightList(); updateShelvesPreview(); };
        rotWrap.appendChild(rotLabel);
        rotWrap.appendChild(rotBtn);
        opsRow1.appendChild(rotWrap);

        // چرخش محور Y: نمای لبه ↔ رو به بیرون (صورت طبقه)
        const faceWrap = document.createElement("div");
        const faceLabel = document.createElement("small");
        faceLabel.className = "shelf-field-label";
        faceLabel.textContent = "چرخش روبرو";
        const faceBtn = document.createElement("button");
        faceBtn.type = "button";
        faceBtn.className = "shelf-rot-btn " + (faceOut ? "vertical" : "horizontal");
        faceBtn.textContent = faceOut ? "روبرو (مثل پشت)" : "عادی";
        faceBtn.title = "صورت ورق موازی جلوی کابینت — مثل ورق پشت، از روبرو دیده می‌شود";
        faceBtn.onclick = function () {
            shelf.faceRotation = faceOut ? 0 : 90;
            updateShelvesHeightList();
            updateShelvesPreview();
            if (typeof draw === "function") draw();
            try {
                if (window.Kitchen3D && typeof window.Kitchen3D.refreshCabinets === "function") {
                    window.Kitchen3D.refreshCabinets(currentCabinetForShelves && currentCabinetForShelves.id);
                }
            } catch (e3) {}
            try {
                if (typeof refreshBabylonShelves === "function") refreshBabylonShelves();
            } catch (eB) {}
        };
        faceWrap.appendChild(faceLabel);
        faceWrap.appendChild(faceBtn);
        opsRow1.appendChild(faceWrap);

        // تیک جا لیوانی
        const gWrap = document.createElement("div");
        gWrap.className = "shelf-checkbox-container";
        if (!isVertical && !isClosetFrame) {
            const gLabel = document.createElement("label");
            gLabel.className = "shelf-checkbox-label inline-shelf-check";

            const gInput = document.createElement("input");
            gInput.type = "checkbox";
            gInput.checked = shelf.isGlassHolder || false;
            gInput.onchange = function() {
                shelf.isGlassHolder = this.checked;
                updateShelvesPreview();
                if (typeof draw === 'function') draw(); 
            };

            const gSpan = document.createElement("span");
            gSpan.className = "shelf-checkmark";

            gLabel.appendChild(gInput);
            gLabel.appendChild(gSpan);
            gLabel.appendChild(document.createTextNode("جا لیوانی"));
            gWrap.appendChild(gLabel);
        }
        opsRow1.appendChild(gWrap);
        opsSection.appendChild(opsRow1);

        // 🎨 زون سوم داخل عملیات: باکس رنگ و جنس (زیر بخش قبلی)
        const materialSection = document.createElement("div");
        materialSection.className = "shelf-material-subzone";
        materialSection.innerHTML = `<div class="shelf-subzone-title">رنگ و جنس</div>`;

        const materialGrid = document.createElement("div");
        materialGrid.className = "shelf-card-grid-2col";

        const matSelect = document.createElement("select");
        matSelect.innerHTML = `<option value="mdf">MDF</option><option value="highGloss">High-Gloss</option><option value="leteron">Leteron</option>`;
        matSelect.value = shelf.material || "mdf";
        matSelect.onchange = function() { shelf.material = this.value; };
        materialGrid.appendChild(createStyledField("جنس ورق", matSelect));

        const colorWrap = document.createElement("div");
        const colorLabel = document.createElement("small");
        colorLabel.className = "shelf-field-label";
        colorLabel.textContent = "رنگ طبقه"; 
        const colorBtn = document.createElement("button");
        colorBtn.className = "shelf-color-btn";
        const displayColorName = shelf.colorName || (shelf.color ? "تغییر رنگ" : "انتخاب رنگ");
        colorBtn.textContent = displayColorName;
        colorBtn.onclick = () => { 
            window.activeShelfIndex = i; 
            updateShelvesHeightList(); 
            const materialCategory = matSelect.value || "mdf";
            if (typeof window.openUniversalModal === 'function') {
                window.openUniversalModal(`انتخاب رنگ طبقه ${i + 1}`, materialCategory, function(selectedMaterial) {
                    if (!currentCabinetForShelves) return;
                    const colorValue = selectedMaterial.code || selectedMaterial.texture || "#ffffff";
                    const colorName = selectedMaterial.name || "متریال انتخاب شده";
                    if (currentCabinetForShelves.shelves[window.activeShelfIndex]) {
                        currentCabinetForShelves.shelves[window.activeShelfIndex].color = colorValue;
                        currentCabinetForShelves.shelves[window.activeShelfIndex].colorName = colorName;
                    }
                    updateShelvesHeightList();
                    updateShelvesPreview();
                    if (typeof draw === 'function') draw();
                    if (typeof refreshBabylonShelves === 'function') refreshBabylonShelves();
                });
            }
        };
        colorWrap.appendChild(colorLabel); 
        colorWrap.appendChild(colorBtn);
        materialGrid.appendChild(colorWrap);

        // پرداخت سطح (نور) — جدا از جنس ورق، برای هر طبقه
        if (shelf.finish === undefined) shelf.finish = "matte";
        const finishSelect = document.createElement("select");
        finishSelect.innerHTML = `
            <option value="matte">مات (Matte)</option>
            <option value="semiMatte">نیمه‌مات</option>
            <option value="satin">ساتین</option>
            <option value="highGloss">براق / های‌گلاس</option>`;
        finishSelect.value = shelf.finish || "matte";
        finishSelect.onchange = function() {
            shelf.finish = this.value;
            updateShelvesPreview();
            if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets &&
                document.getElementById('modal-3d-container')?.style.display === 'flex') {
                Kitchen3D.refreshCabinets(typeof currentCabinetForShelves !== 'undefined' && currentCabinetForShelves ? currentCabinetForShelves.id : undefined);
            }
            if (typeof refreshBabylonShelves === 'function') refreshBabylonShelves();
        };
        materialGrid.appendChild(createStyledField("پرداخت سطح (نور)", finishSelect));

        materialSection.appendChild(materialGrid);
        opsSection.appendChild(materialSection);

        item.appendChild(opsSection);
        list.appendChild(item);
    }
    updateShelvesPreview();
}







// نمایش موقعیت
function updatePositionInfo() {
    const info = document.getElementById("shelves-position-info");
    if (info && currentCabinetForShelves) {
        info.textContent = `ارتفاع کابینت: ${currentCabinetForShelves.h} cm`;
    }
}

function toggleShelfRotation(index) {
    if (!currentCabinetForShelves) {
        console.warn("کابینت انتخاب نشده برای چرخش طبقه");
        return;
    }

    // مطمئن شو آرایه shelves وجود داره
    if (!currentCabinetForShelves.shelves || !Array.isArray(currentCabinetForShelves.shelves)) {
        currentCabinetForShelves.shelves = [];
    }

    const shelves = currentCabinetForShelves.shelves;

    // تعداد طبقه فعلی از input
    const count = parseInt(document.getElementById("shelves-count").value) || 0;

    // اگر آرایه کوتاه‌تر از تعداد فعلی باشه، پرش کن با مقادیر پیش‌فرض
    while (shelves.length < count) {
        shelves.push({ height: 30, rotation: 0 });
    }

    // حالا ایندکس امن است
    const currentRot = shelves[index]?.rotation ?? 0;
shelves[index] = {
    ... (shelves[index] ?? { height: 30 }),   // اگر وجود نداشت، مقدار پیش‌فرض
    rotation: currentRot === 90 ? 0 : 90
};

    // بازسازی لیست → دکمه‌ها و برچسب‌ها آپدیت می‌شن
    updateShelvesHeightList();

    updateShelvesPreview();

    if (typeof draw === 'function') draw();

    console.log(`طبقه شماره ${index + 1} → چرخش: ${shelves[index].rotation} درجه`);
}

// حتما جهانی کن
window.toggleShelfRotation = toggleShelfRotation;

function toggleShelves() {
    const checkbox = document.getElementById("shelves-enabled");
    const isEnabled = checkbox.checked;
    const countInput = document.getElementById("shelves-count");

    logAction("info", `تیک فعال‌سازی طبقه‌ها: ${isEnabled ? "روشن" : "خاموش"}`);

    if (!currentCabinetForShelves) {
        console.warn("کابینت انتخاب شده پیدا نشد");
        return;
    }

    // ذخیره وضعیت فعال/غیرفعال
    currentCabinetForShelves.shelvesEnabled = isEnabled;

    let currentCount = parseInt(countInput.value) || 0;

    if (isEnabled) {
        // اگر فعال شد و تعداد صفر یا نامعتبر بود → حداقل ۱ طبقه
        if (currentCount < 1) {
            currentCount = 1;
            countInput.value = 1;
        }

        // مطمئن شویم آرایه وجود دارد
        if (!Array.isArray(currentCabinetForShelves.shelves)) {
            currentCabinetForShelves.shelves = [];
        }

        // اگر تعداد واقعی کمتر از مقدار input بود → طبقه اضافه کن
        while (currentCabinetForShelves.shelves.length < currentCount) {
            currentCabinetForShelves.shelves.push({
                height: 30   // ارتفاع پیش‌فرض - می‌تونی تغییر بدی
            });
        }
    } else {
        // غیرفعال شد → تعداد رو صفر کن
        currentCount = 0;
        countInput.value = 0;
        // می‌تونی آرایه رو خالی کنی یا نگه داری (بستگی به نیاز پروژه)
        currentCabinetForShelves.shelves = [];
        // یا اگر می‌خوای ارتفاع‌ها حفظ بشن: فقط تعداد رو صفر کن
    }

    // آپدیت UI و پیش‌نمایش
    if (typeof updateShelvesHeightList === 'function') {
        updateShelvesHeightList();
    }

    if (typeof updateShelvesPreview === 'function') {
        updateShelvesPreview();
    } else if (typeof updateShelvesPreviewFromPanel === 'function') {
        updateShelvesPreviewFromPanel();
    }

    // اگر تابع اصلی رندر کل صفحه رو داری
    if (typeof draw === 'function') {
        draw();
    }
}

// حتما این را به ویندوز بشناسان
window.toggleShelves = toggleShelves;

// پیش‌نمایش — ۱۰۰٪ کار می‌کنه!


function updateShelvesPreview() {
    const canvas = document.getElementById("shelves-preview-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (!currentCabinetForShelves && typeof selectedId !== 'undefined' && selectedId !== -1) {
        currentCabinetForShelves = cabinets.find(c => c.id === selectedId);
    }

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!currentCabinetForShelves) return;

    const enabledInput = document.getElementById("shelves-enabled");
    const countInput = document.getElementById("shelves-count");
    const enabled = enabledInput ? enabledInput.checked : false;
    const count = countInput ? parseInt(countInput.value) : 0;

    // ابعاد واقعی یونیت
    let cabinetHeightReal = currentCabinetForShelves.h || 72;
    let cabinetWidthReal = currentCabinetForShelves.w || 60;
    if (currentCabinetForShelves.isFridgeWrap && currentCabinetForShelves.hasBridge !== false) {
        cabinetHeightReal = currentCabinetForShelves.bridgeH || 40;
    }

    // 🌟 حفظ نسبت واقعی عرض/ارتفاع به‌جای باکس ثابت
    const maxBoxW = canvas.width - 60;
    const maxBoxH = canvas.height - 90;
    const scale = Math.min(maxBoxW / cabinetWidthReal, maxBoxH / cabinetHeightReal);
    const cabW = cabinetWidthReal * scale;
    const cabH = cabinetHeightReal * scale;
    const startX = (canvas.width - cabW) / 2;
    const startY = (canvas.height - cabH) / 2 - 10;

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, cabW, cabH);

    // برچسب ابعاد واقعی
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Tahoma";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(cabinetWidthReal)} cm`, startX + cabW / 2, startY - 8);
    ctx.save();
    ctx.translate(startX - 10, startY + cabH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${Math.round(cabinetHeightReal)} cm`, 0, 0);
    ctx.restore();

    // 🌟 اگر یونیت، چهارچوب کمد دیواری است، اجزای آن را به‌عنوان راهنما رسم کن
    if (Array.isArray(currentCabinetForShelves.parts)) {
        let minX = Infinity;
        currentCabinetForShelves.parts.forEach(p => { if (p.x < minX) minX = p.x; });
        if (minX === Infinity) minX = 0;

        ctx.strokeStyle = "rgba(169, 117, 79, 0.75)";
        ctx.lineWidth = 2;

        currentCabinetForShelves.parts.forEach(part => {
            const pW = part.orientation === 'horizontal' ? part.length : 5.5;
            const pH = part.orientation === 'vertical' ? part.length : 5.5;

            const px = startX + ((part.x - minX) / cabinetWidthReal) * cabW;
            const py = startY + cabH - (((part.y || 0) + pH) / cabinetHeightReal) * cabH;
            const pw = (pW / cabinetWidthReal) * cabW;
            const ph = (pH / cabinetHeightReal) * cabH;

            ctx.strokeRect(px, py, pw, ph);
        });
    }

    if (!enabled || count === 0) {
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 14px Tahoma";
        ctx.textAlign = "center";
        ctx.fillText("طبقه‌ها غیرفعال است", canvas.width / 2, canvas.height / 2);
        return;
    }

    const shelves = currentCabinetForShelves.shelves || [];

    for (let i = 0; i < count; i++) {
        const shelfData = shelves[i];
        if (!shelfData) continue;

        const rotation = shelfData.rotation ?? 0;
        const mainVal = shelfData.height ?? 0;

        let shelfColor = shelfData.color || currentCabinetForShelves.shelvesColor || (rotation === 90 ? "#ff9500" : "#06b6d4");
        if (shelfColor.includes('/') || shelfColor.includes('.')) {
            shelfColor = rotation === 90 ? "#ff9500" : "#06b6d4";
        }

        // 🌟 تشخیص خارج از محدوده به‌جای گم شدن بی‌صدا
        const limit = rotation === 90 ? cabinetWidthReal : cabinetHeightReal;
        const outOfRange = mainVal < 0 || mainVal > limit;

        if (window.activeShelfIndex === i) shelfColor = "#ef4444";
        else if (outOfRange) shelfColor = "#facc15";

        ctx.fillStyle = shelfColor;

        let label = Math.round(mainVal) + "cm" + (outOfRange ? " ⚠" : "");

        const faceOut = Number(shelfData.faceRotation) === 90;
        const anchor = shelfData.sideAnchor || "left";
        const lOffset = shelfData.leftOffset ?? 0;
        const sWidth = shelfData.width ?? cabinetWidthReal;
        const bOffset = shelfData.bottomOffset ?? 0;
        const vHeight = shelfData.vertHeight ?? (faceOut && rotation !== 90 ? Math.min(40, cabinetHeightReal) : cabinetHeightReal);

        if (faceOut) {
            // عرض ← width (محور افقی) | طول ← depth (ارتفاع صورت در پیش‌نمایش)
            const widthCm = (shelfData.width != null && shelfData.width !== "")
                ? Number(shelfData.width)
                : cabinetWidthReal;
            const lengthCm = (shelfData.depth != null && shelfData.depth !== "")
                ? Number(shelfData.depth)
                : Math.min(40, cabinetHeightReal);
            const drawW = Math.min((widthCm / cabinetWidthReal) * cabW, cabW);
            let startX_draw = anchor === "right"
                ? startX + cabW - (((lOffset + widthCm) / cabinetWidthReal) * cabW)
                : startX + (lOffset / cabinetWidthReal * cabW);
            if (rotation === 90) {
                const ratio = Math.min(Math.max(mainVal / cabinetWidthReal, 0), 1);
                startX_draw = anchor === "right"
                    ? startX + cabW - ratio * cabW - drawW
                    : startX + ratio * cabW;
            }
            startX_draw = Math.max(startX, Math.min(startX_draw, startX + cabW - 4));

            let drawH = Math.min(cabH, (lengthCm / cabinetHeightReal) * cabH);
            drawH = Math.max(8, drawH);
            const startY_draw = Math.max(startY, startY + cabH - ((bOffset + lengthCm) / cabinetHeightReal) * cabH);

            // پر کردن صورت ورق
            ctx.globalAlpha = 0.85;
            ctx.fillRect(startX_draw, startY_draw, Math.max(6, drawW), drawH);
            ctx.globalAlpha = 1;
            // حاشیه برای حس ورق روبرو
            ctx.strokeStyle = "rgba(255,255,255,0.45)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(startX_draw, startY_draw, Math.max(6, drawW), drawH);
            // خطوط راهنمای بافت ساده
            ctx.strokeStyle = "rgba(15,23,42,0.25)";
            ctx.lineWidth = 1;
            const step = 10;
            for (let gx = startX_draw + step; gx < startX_draw + drawW; gx += step) {
                ctx.beginPath();
                ctx.moveTo(gx, startY_draw);
                ctx.lineTo(gx, startY_draw + drawH);
                ctx.stroke();
            }

            label += " (روبرو)";
            ctx.textAlign = "center";
            ctx.fillStyle = "#fff";
            ctx.font = "10px Arial";
            ctx.fillText(label, startX_draw + Math.max(6, drawW) / 2, startY + cabH + 14 + (i % 2 === 0 ? 0 : 12));
        } else if (rotation === 90) {
            const ratio = Math.min(Math.max(mainVal / cabinetWidthReal, 0), 1);
            const posX = anchor === "right" ? (startX + cabW - ratio * cabW) : (startX + ratio * cabW);

            const rawY = startY + cabH - ((bOffset + vHeight) / cabinetHeightReal * cabH);
            const startY_draw = Math.max(startY, rawY);
            const drawH = Math.min(cabH, (vHeight / cabinetHeightReal) * cabH);

            ctx.fillRect(posX - 3, startY_draw, 6, drawH);

            label += anchor === "right" ? " (از راست)" : " (از چپ)";
            ctx.textAlign = "center";
            ctx.fillStyle = "#fff";
            ctx.font = "10px Arial";
            ctx.fillText(label, posX, startY + cabH + 14 + (i % 2 === 0 ? 0 : 12));
        } else {
            const ratio = Math.min(Math.max(mainVal / cabinetHeightReal, 0), 1);
            const posY = startY + cabH - (ratio * cabH);

            const drawW = Math.min((sWidth / cabinetWidthReal) * cabW, cabW);
            const startX_draw = anchor === "right"
                ? startX + cabW - (((lOffset + sWidth) / cabinetWidthReal) * cabW)
                : startX + (lOffset / cabinetWidthReal * cabW);
            ctx.fillRect(startX_draw, posY - 3, drawW, 6);

            label += " (از کف)";
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.font = "10px Arial";
            ctx.fillText(label, startX - 8, posY + 4);
        }
    }
}


function applyShelvesSettingsFromPanel() {
    if (!currentCabinetForShelves) return;

    const enabled = document.getElementById("shelves-enabled")?.checked ?? false;
    currentCabinetForShelves.shelvesEnabled = enabled;
    
    // چون ما ارتفاع، رنگ و چرخش را به صورت زنده (Live) روی currentCabinetForShelves.shelves ذخیره می‌کردیم، 
    // اینجا نیاز به بازنویسی مجدد آرایه نیست. فقط در صورت غیرفعال بودن آن را خالی می‌کنیم.
    if (!enabled) {
        currentCabinetForShelves.shelves = [];
    }

    // به‌روزرسانی آرایه اصلی cabinets
    const idx = cabinets.findIndex(c => c.id === currentCabinetForShelves.id);
    if (idx !== -1) cabinets[idx] = { ...currentCabinetForShelves };

    if (typeof draw === 'function') draw();
    
    // رفرش 3D
    if (window.Kitchen3D?.scene && typeof window.Kitchen3D.renderCabinets === 'function') {
        window.Kitchen3D.scene.traverse(obj => {
            if (obj.userData?.isCabinet) window.Kitchen3D.scene.remove(obj);
        });
        window.Kitchen3D.renderCabinets();
    }
    if (typeof refreshBabylonShelves === 'function') refreshBabylonShelves();

    closeShelvesEditorPanel();
}


function applyShelvesSettings() {
    applyShelvesSettingsFromPanel();
}
// توابع جهانی
window.openShelvesEditorPanel     = openShelvesEditorPanel;
window.closeShelvesEditorPanel    = closeShelvesEditorPanel;
window.changeShelvesCount         = changeShelvesCount;
window.applyShelvesSettingsFromPanel = applyShelvesSettingsFromPanel;

// اگر تابع applyShelvesSettingsFromPanel نداری و اسمش applyShelvesSettings هست:
window.applyShelvesSettings       = applyShelvesSettings;
