// js/components/door-editor.js - نسخه نهایی با جستجوی رنگ، +−، چک‌باکس و نوع درب
// کش مخصوص پیش‌نمایش Canvas (Image)


window.previewTextureCache = {};
let isPreviewRedrawing = false;
let currentCabinetForDoor = null;
// 💡 حتماً این خط را اضافه کنید:
let currentDoorMaterials = window.allMaterials?.mdf || [];

// --- گزینه‌های نوع بازشو: حالت عادی vs چهارچوب کمد دیواری ---
const NORMAL_DOOR_TYPE_OPTIONS = [
    { value: "side", text: "افقی (لولایی)" },
    { value: "lift", text: "جکی (بالا بازشو)" },
    { value: "lift-side", text: "جکی کنار هم" },
    { value: "split", text: "قدی دو تکه" },
    { value: "combo", text: "ترکیبی" },
    { value: "jaki-ghadi", text: "جکی و قدی" },
    { value: "drawer", text: "درب کشو" },
    { value: "drawer-ghadi", text: "کشو و قدی" }
];
// برای چهارچوب کمد: همه انواع عادی + ریلی
const CLOSET_DOOR_TYPE_OPTIONS = [
    { value: "side", text: "افقی (لولایی)" },
    { value: "lift", text: "جکی (بالا بازشو)" },
    { value: "lift-side", text: "جکی کنار هم" },
    { value: "split", text: "قدی دو تکه" },
    { value: "combo", text: "ترکیبی" },
    { value: "jaki-ghadi", text: "جکی و قدی" },
    { value: "drawer", text: "درب کشو" },
    { value: "drawer-ghadi", text: "کشو و قدی" },
    { value: "sliding", text: "ریلی" }
];

function isClosetDoorMode() {
    return !!(currentCabinetForDoor && Array.isArray(currentCabinetForDoor.parts) && currentCabinetForDoor.parts.length > 0);
}

function populateDoorTypeOptions(mode) {
    const typeSelect = document.getElementById("door-panel-type");
    if (!typeSelect) return;
    const prev = typeSelect.value;
    const options = mode === "closet" ? CLOSET_DOOR_TYPE_OPTIONS : NORMAL_DOOR_TYPE_OPTIONS;
    typeSelect.innerHTML = "";
    options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.text;
        typeSelect.appendChild(o);
    });
    if (options.some((o) => o.value === prev)) {
        typeSelect.value = prev;
    } else {
        typeSelect.value = options[0].value;
    }
}

function getDoorCountLimitsForType(doorType) {
    if (isClosetDoorMode()) {
        if (doorType === "lift-side") return { min: 1, max: 2 };
        if (doorType === "split") return { min: 1, max: 3 };
        if (doorType === "sliding") return { min: 1, max: 3 };
        // drawer و بقیه فعلاً محدود نشوند
        return { min: 1, max: 4 };
    }
    // محدودیت‌های قبلی برای یونیت معمولی
    if (doorType === "combo") return { min: 3, max: 4 };
    if (doorType === "jaki-ghadi") return { min: 3, max: 3 };
    if (doorType === "lift") return { min: 1, max: 2 };
    if (doorType === "lift-side") return { min: 2, max: 2 };
    if (doorType === "split") return { min: 2, max: 3 };
    return { min: 1, max: 4 };
}

function clampDoorCountValue(doorType, val) {
    const limits = getDoorCountLimitsForType(doorType);
    let n = parseInt(val, 10);
    if (isNaN(n)) n = limits.min;
    return Math.max(limits.min, Math.min(limits.max, n));
}

// ==========================================
// ۱. تابع جهت بازشو درب‌ها
// ==========================================
function renderDoorDirectionSelectors() {
    const wrapper = document.getElementById("door-directions-wrapper");
    const container = document.getElementById("door-directions-container");
    
    const comboLayoutWrapper = document.getElementById("combo-layout-wrapper");
    const jakiGhadiLayoutWrapper = document.getElementById("jaki-ghadi-layout-wrapper");
    
    if (!currentCabinetForDoor) return;

    // برای چهارچوب کمد دیواری بخش جهت باز شدن درب فعال است (دیگر مخفی نمی‌شود)
    // فقط layoutهای combo/jaki در صورت نیاز مخفی می‌مانند
    if (currentCabinetForDoor.parts && currentCabinetForDoor.parts.length > 0) {
        if (comboLayoutWrapper) {
            comboLayoutWrapper.classList.remove("layout-visible");
            comboLayoutWrapper.style.display = "none";
        }
        if (jakiGhadiLayoutWrapper) {
            jakiGhadiLayoutWrapper.classList.remove("layout-visible");
            jakiGhadiLayoutWrapper.style.display = "none";
        }
        // ادامه بده تا جهت‌ها مثل یونیت معمولی رندر شوند
    }

    // اطمینان از نمایش دوباره در حالت یونیت معمولی
    if (wrapper) wrapper.style.display = "";

    const doorType = currentCabinetForDoor.doorType || "side";
    const doorsCount = currentCabinetForDoor.doors || 2;

    if (comboLayoutWrapper) {
        if (doorType === "combo" && doorsCount === 3) {
            comboLayoutWrapper.classList.add("layout-visible");
            const comboSelect = document.getElementById("combo-door-layout");
            if (comboSelect) comboSelect.value = currentCabinetForDoor.comboLayout || 'left-big';
        } else {
            comboLayoutWrapper.classList.remove("layout-visible");
        }
    }

    if (jakiGhadiLayoutWrapper) {
        if (doorType === "jaki-ghadi") {
            jakiGhadiLayoutWrapper.classList.add("layout-visible");
            const jakiSelect = document.getElementById("jaki-ghadi-layout");
            if (jakiSelect) jakiSelect.value = currentCabinetForDoor.jakiGhadiLayout || 'top';
        } else {
            jakiGhadiLayoutWrapper.classList.remove("layout-visible");
        }
    }

    // تغییر ۱: اضافه کردن drawer-ghadi به لیست مجاز
    if (doorType !== "side" && doorType !== "split" && doorType !== "combo" && doorType !== "jaki-ghadi" && doorType !== "drawer-ghadi") {
        if(wrapper) wrapper.classList.remove("layout-visible");
        return;
    }

    if(wrapper) wrapper.classList.add("layout-visible");

    if (!currentCabinetForDoor.doorDirections || currentCabinetForDoor.doorDirections.length !== doorsCount) {
        let oldDirs = currentCabinetForDoor.doorDirections || [];
        currentCabinetForDoor.doorDirections = Array.from({length: doorsCount}, (_, i) => {
            return oldDirs[i] || (i % 2 === 0 ? 'left' : 'right'); 
        });
    }

    let html = ""; 
    for (let i = 0; i < doorsCount; i++) {
        let currentDir = currentCabinetForDoor.doorDirections[i];
        
        // تغییر ۲: استفاده از کلاس‌های CSS به جای استایل خطی برای کشو
        if (doorType === "drawer-ghadi" && i === 0) {
            html += `
                <div class="door-direction-item door-drawer-disabled">
                    <span>بخش ${i + 1} (کشو):</span>
                    <span class="door-drawer-badge">بدون جهت (کشو)</span>
                </div>
            `;
            continue; 
        }

        // رندر عادی برای سایر درب‌ها
        html += `
            <div class="door-direction-item">
                <span>درب ${i + 1}:</span>
                <select class="modern-select door-direction-select" onchange="updateSingleDoorDirection(${i}, this.value)">
                    <option value="left" ${currentDir === 'left' ? 'selected' : ''}>لولا چپ (دستگیره راست)</option>
                    <option value="right" ${currentDir === 'right' ? 'selected' : ''}>لولا راست (دستگیره چپ)</option>
                </select>
            </div>
        `;
    }
    if(container) container.innerHTML = html;
}



// ==========================================
// ۲. تابع دستگیره‌های مخفی
// ==========================================
function renderDoorHiddenHandleInputs() {
    const container = document.getElementById("door-hidden-handle-container");
    const wrapper = document.getElementById("door-hidden-handle-wrapper");
    
    if (!currentCabinetForDoor || !container) return;

    let doorsCount = currentCabinetForDoor.doors || 2;

    // --- این بخش اضافه می‌شود ---
    if (currentCabinetForDoor.isDrawerBody) {
        doorsCount = currentCabinetForDoor.drawersCount || (currentCabinetForDoor.drawersData ? currentCabinetForDoor.drawersData.length : 3);
    }
    // برای یونیت‌های isBaseWithDrawer (کشو و قدی) همان doorsCount درست است
    // ----------------------------

    if (!currentCabinetForDoor.doorSizes || currentCabinetForDoor.doorSizes.length !== doorsCount) {
        let oldSizes = currentCabinetForDoor.doorSizes || [];
        currentCabinetForDoor.doorSizes = Array.from({ length: doorsCount }, (_, i) => {
            return oldSizes[i] || { w: "", h: "", lockX: "center", lockY: "center", enabled: true };
        });
    }

    let html = "";
    for (let i = 0; i < doorsCount; i++) {
        let size = currentCabinetForDoor.doorSizes[i];
        let hhPos = size.hiddenHandlePos || "none";
        let hhMaterial = size.hiddenHandleMaterial || "mdf";
        let hhColorName = size.hiddenHandleColorName || ""; 
        let isEnabled = size.enabled !== false; 
        
        // دریافت مقادیر کاستوم
        let cWidth    = size.customHandleWidth    !== undefined ? size.customHandleWidth    : "";
        let cHeight   = size.customHandleHeight   !== undefined ? size.customHandleHeight   : "";
        let cPosY     = size.customHandlePosY     !== undefined ? size.customHandlePosY     : "";
        let cPosDir   = size.customHandleYDir     !== undefined ? size.customHandleYDir     : "up"; // جهت Y (بالا یا پایین)
        let cForward  = size.customHandleForward  !== undefined ? size.customHandleForward  : "";
        let cBackward = size.customHandleBackward !== undefined ? size.customHandleBackward : "";
        let cType     = size.customHandleType     !== undefined ? size.customHandleType     : "l-bottom";
        
        let disabledClass = isEnabled ? "" : "door-disabled-state";

        html += `
            <div class="door-dynamic-box ${disabledClass}">
                <div class="door-dynamic-header">تنظیمات دستگیره مخفی - درب ${i + 1}</div>
                
                <div class="door-input-group no-margin door-input-gap-bottom">
                    <label>نوع دستگیره</label>
                    <select class="modern-select" onchange="updateSingleDoorProperty(${i}, 'hiddenHandlePos', this.value); renderDoorHiddenHandleInputs(); if(typeof Kitchen3D !== 'undefined') Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);">
                        <option value="none" ${hhPos === 'none' ? 'selected' : ''}>دستگیره معمولی (پیش‌فرض)</option>
                        <option value="normal-top" ${hhPos === 'normal-top' ? 'selected' : ''}>دستگیره روکار - بالا (۴ سانت فاصله)</option>
                        <option value="normal-middle" ${hhPos === 'normal-middle' ? 'selected' : ''}>دستگیره روکار - وسط</option>
                        <option value="normal-bottom" ${hhPos === 'normal-bottom' ? 'selected' : ''}>دستگیره روکار - پایین (۴ سانت فاصله)</option>
                        <option value="no-handle" ${hhPos === 'no-handle' ? 'selected' : ''}>بدون هیچ دستگیره‌ای (ساده)</option>
                        <option value="top" ${hhPos === 'top' ? 'selected' : ''}>مخفی - بالای درب</option>
                        <option value="bottom" ${hhPos === 'bottom' ? 'selected' : ''}>مخفی - پایین درب</option>
                        <option value="custom" ${hhPos === 'custom' ? 'selected' : ''}>مخفی - کاستوم (سفارشی)</option>
                    </select>
                </div>
        `;

        // پنل اختصاصی کاستوم
        if (hhPos === 'custom') {
            html += `
                <div class="door-custom-handle-settings">
                    <h5 class="door-custom-settings-title">تنظیمات ابعاد کاستوم دستگیره</h5>
                    
                    <div class="door-custom-grid">
                        
                        <div class="door-input-group no-margin door-input-span-full">
                            <label class="door-micro-label-text">شکل پروفیل (نوع برش)</label>
                            <select class="modern-select" onchange="updateSingleDoorProperty(${i}, 'customHandleType', this.value); if(typeof Kitchen3D !== 'undefined') Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);">
                                <option value="l-bottom" ${cType === 'l-bottom' ? 'selected' : ''}>فرم L پایین (لبه ۱۶ میل زیر قرار می‌گیرد)</option>
                                <option value="l-top" ${cType === 'l-top' ? 'selected' : ''}>فرم L بالا (لبه ۱۶ میل بالا قرار می‌گیرد)</option>
                            </select>
                        </div>

                        <div class="door-input-group no-margin">
                            <label class="door-micro-label-text">طول/عرض (cm)</label>
                            <input type="number" class="modern-input" placeholder="مثلا 20" value="${cWidth}" 
                                   onchange="updateSingleDoorProperty(${i}, 'customHandleWidth', this.value ? parseFloat(this.value) : ''); if(typeof Kitchen3D !== 'undefined') Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);">
                        </div>
                        <div class="door-input-group no-margin">
                            <label class="door-micro-label-text">ارتفاع دستگیره (cm)</label>
                            <input type="number" class="modern-input" placeholder="مثلا 5" value="${cHeight}" 
                                   onchange="updateSingleDoorProperty(${i}, 'customHandleHeight', this.value ? parseFloat(this.value) : ''); if(typeof Kitchen3D !== 'undefined') Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);">
                        </div>
                        
                        <!-- فیلد ترکیب جهت حرکت و مقدار عددی -->
                        <div class="door-input-group no-margin door-input-span-full">
                            <label class="door-micro-label-text">ارتفاع نصب روی درب (cm)</label>
                            <div class="door-flex-row-gap">
                                <select class="modern-select door-select-flex-1" onchange="updateSingleDoorProperty(${i}, 'customHandleYDir', this.value); if(typeof Kitchen3D !== 'undefined') Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);">
                                    <option value="up" ${cPosDir === 'up' ? 'selected' : ''}>به بالا</option>
                                    <option value="down" ${cPosDir === 'down' ? 'selected' : ''}>به پایین</option>
                                </select>
                                <input type="number" class="modern-input door-input-flex-2" placeholder="مقدار جابجایی..." value="${cPosY}" 
                                       onchange="updateSingleDoorProperty(${i}, 'customHandlePosY', this.value ? parseFloat(this.value) : ''); if(typeof Kitchen3D !== 'undefined') Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);">
                            </div>
                        </div>

                        <div class="door-input-group no-margin">
                            <label class="door-micro-label-text">حرکت به جلو (cm)</label>
                            <input type="number" step="0.1" class="modern-input" placeholder="مثلا 2" value="${cForward}" 
                                   onchange="updateSingleDoorProperty(${i}, 'customHandleForward', this.value ? parseFloat(this.value) : ''); if(typeof Kitchen3D !== 'undefined') Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);">
                        </div>
                        <div class="door-input-group no-margin">
                            <label class="door-micro-label-text">حرکت به عقب (cm)</label>
                            <input type="number" step="0.1" class="modern-input" placeholder="مثلا 1.5" value="${cBackward}" 
                                   onchange="updateSingleDoorProperty(${i}, 'customHandleBackward', this.value ? parseFloat(this.value) : ''); if(typeof Kitchen3D !== 'undefined') Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);">
                        </div>
                    </div>
                </div>
            `;
        }

        html += `
                <div class="door-input-group no-margin door-input-gap-bottom">
                    <label>نوع متریال</label>
                    <select class="modern-select" onchange="updateSingleDoorProperty(${i}, 'hiddenHandleMaterial', this.value); if(typeof Kitchen3D !== 'undefined') Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);">
                        <option value="mdf" ${hhMaterial === 'mdf' ? 'selected' : ''}>MDF (ام دی اف)</option>
                        <option value="highGloss" ${hhMaterial === 'highGloss' ? 'selected' : ''}>High-Gloss (هایگلاس)</option>
                        <option value="leteron" ${hhMaterial === 'leteron' ? 'selected' : ''}>Leteron (لترون)</option>
                    </select>
                </div>

                <div class="door-input-group no-margin">
                    <label>رنگ و جنس دستگیره</label>
                    <div class="door-color-search-container">
                        <input type="text" id="hidden-handle-color-search-${i}" 
                               onclick="openColorPickerForHiddenHandle(${i})" 
                               placeholder="جستجوی رنگ... (کلیک کنید)" 
                               class="modern-input door-readonly-color-input" 
                               autocomplete="off"
                               value="${hhColorName}" readonly>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (typeof appendClosetDrawerFrontHiddenHandles === "function") {
        html += appendClosetDrawerFrontHiddenHandles();
    }
    container.innerHTML = html;
}
window.renderDoorHiddenHandleInputs = renderDoorHiddenHandleInputs;







// ==========================================
// ۳. تابع ابعاد درب‌ها
// ==========================================

/**
 * عرض دهانه جلوی یونیت برای درب‌ها
 * اگر زاویه کناری داشته باشد، عرض ذوزنقه جلو برمی‌گردد نه عرض پشت/کلی.
 */
function getDoorOpeningWidth(c) {
    if (!c) return 60;
    const W = parseFloat(c.w) || 60;
    // ترجیح: متریک سه‌بعدی مشترک
    if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.getSideAngleMetrics === 'function') {
        try {
            const m = Kitchen3D.getSideAngleMetrics(c);
            if (m && Number.isFinite(m.frontW) && m.frontW > 0) return m.frontW;
        } catch (e) {}
    }
    // فالبک همان فرمول UI زاویه
    const norm = (v) => {
        if (v === undefined || v === null || v === '') return 90;
        let a = parseFloat(v);
        if (!Number.isFinite(a)) return 90;
        if (c.sideAngleUI !== true && a >= -45 && a <= 45) a = 90 - a;
        return Math.max(0, Math.min(180, a));
    };
    const D = parseFloat(c.d) || 55;
    const devL = norm(c.sideAngleLeft) - 90;
    const devR = norm(c.sideAngleRight) - 90;
    const shiftL = Math.tan(devL * Math.PI / 180) * D;
    const shiftR = Math.tan(devR * Math.PI / 180) * D;
    const frontLeft = -W / 2 + shiftL;
    const frontRight = W / 2 + shiftR;
    return Math.max(1, frontRight - frontLeft);
}
function getDoorOpeningCenterOffset(c) {
    if (!c) return 0;
    if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.getSideAngleMetrics === 'function') {
        try {
            const m = Kitchen3D.getSideAngleMetrics(c);
            if (m && Number.isFinite(m.frontCenterX)) return m.frontCenterX;
        } catch (e) {}
    }
    const W = parseFloat(c.w) || 60;
    const frontW = getDoorOpeningWidth(c);
    // تقریب: مرکز دهانه نسبت به مرکز یونیت
    const norm = (v) => {
        if (v === undefined || v === null || v === '') return 90;
        let a = parseFloat(v);
        if (!Number.isFinite(a)) return 90;
        if (c.sideAngleUI !== true && a >= -45 && a <= 45) a = 90 - a;
        return Math.max(0, Math.min(180, a));
    };
    const D = parseFloat(c.d) || 55;
    const devL = norm(c.sideAngleLeft) - 90;
    const devR = norm(c.sideAngleRight) - 90;
    const shiftL = Math.tan(devL * Math.PI / 180) * D;
    const shiftR = Math.tan(devR * Math.PI / 180) * D;
    const frontLeft = -W / 2 + shiftL;
    const frontRight = W / 2 + shiftR;
    return (frontLeft + frontRight) / 2;
}
window.getDoorOpeningWidth = getDoorOpeningWidth;
window.getDoorOpeningCenterOffset = getDoorOpeningCenterOffset;

function renderDoorDimensionsInputs() {
    const wrapper = document.getElementById("door-dimensions-wrapper");
    const container = document.getElementById("door-dimensions-container");
    
    if (!currentCabinetForDoor || !wrapper || !container) return;

    // ۱. دریافت مشخصات یونیت فعلی
    const doorType = currentCabinetForDoor.doorType || "side";
    let doorsCount = currentCabinetForDoor.doors || 2;
    
    // دریافت ارتفاع و عرض واقعی محل قرارگیری درب
    // برای یونیت زاویه‌دار: عرض دهانه جلو (نه عرض پشت/کلی)
    let cabinetW = (typeof getDoorOpeningWidth === 'function')
        ? getDoorOpeningWidth(currentCabinetForDoor)
        : (parseFloat(currentCabinetForDoor.w) || 0);
    let cabinetH = parseFloat(currentCabinetForDoor.h) || 0;

    // 🌟 اصلاحیه کلاف یخچال: اعمال اختلاف ۳.۲ میلی‌متری برای دهانه‌ی داخلی یونیت هوایی
    if (currentCabinetForDoor.isFridgeWrap) {
        // ۱. ارتفاع ملاک، فقط ارتفاع یونیت هوایی است (مثلاً ۴۰ سانتی‌متر)
        cabinetH = currentCabinetForDoor.bridgeH || 40; 
        
        // ۲. 🌟🌟🌟 اصلاح کلیدی عرض: دهانه‌ی داخلی = عرض کل کلاف منهای ۳.۲ سانتی‌متر (ضخامت دو دیواره)
        // کلاف معمولاً زاویه ندارد؛ از عرض کلی استفاده می‌کنیم
        cabinetW = (parseFloat(currentCabinetForDoor.w) || 0) - 3.2; 
    }

    // ۲. محاسبه تعداد اسلات‌ها
    let slotCount = doorsCount;
    
    if (currentCabinetForDoor.isDrawerBody) {
        slotCount = currentCabinetForDoor.drawerCount || 3;
    } else if (currentCabinetForDoor.isBaseWithDrawer) {
        slotCount = doorsCount; 
    } else if (doorType === "lift" || doorType === "split") {
        slotCount = doorType === "split" ? Math.min(Math.max(doorsCount, 2), 3) : doorsCount;
    } else if (doorType === "lift-side") {
        slotCount = 2;
    } else if (doorType === "combo" || doorType === "jaki-ghadi") {
        if (doorType === "combo") {
            slotCount = (doorsCount === 3 || doorsCount === 4) ? doorsCount : 3;
        } else {
            slotCount = Math.min(Math.max(doorsCount, 2), 3); 
        }
    }

    // بازسازی آرایه ابعاد در صورت تغییر تعداد اسلات‌ها
    if (!currentCabinetForDoor.doorSizes || currentCabinetForDoor.doorSizes.length !== slotCount) {
        currentCabinetForDoor.doorSizes = Array.from({ length: slotCount }, () => {
            return { w: "", h: "", lockX: "center", lockY: "center", enabled: true };
        });
    }

    // یونیت زاویه‌دار: عرض ذخیره‌شدهٔ برابر عرض کلی را پاک کن تا auto روی دهانه جلو بنشیند
    {
        const fullW = parseFloat(currentCabinetForDoor.w) || 0;
        const openingW = cabinetW;
        if (Math.abs(openingW - fullW) > 0.15 && Array.isArray(currentCabinetForDoor.doorSizes)) {
            currentCabinetForDoor.doorSizes.forEach((sz) => {
                if (!sz) return;
                const sw = parseFloat(sz.w);
                if (!Number.isFinite(sw) || sz.w === '' || sz.w === null || sz.w === undefined) return;
                // اگر تقریباً همان عرض یونیت یا نصف آن (درب دوتایی قدیمی) بود → ریست
                if (Math.abs(sw - fullW) < 0.2 || Math.abs(sw - fullW / 2) < 0.2 || Math.abs(sw - (fullW - 0.1)) < 0.2 || Math.abs(sw - (fullW - 0.1) / 2) < 0.2) {
                    sz.w = '';
                }
            });
        }
    }

    // آماده‌سازی آرایه محاسبات پیش‌فرض ارتفاع برای ساختار کشوهای متوالی
    let requestedSlotHeights = [];
    let scaleFactor = 1;
    const gap = currentCabinetForDoor.drawerGap !== undefined ? currentCabinetForDoor.drawerGap : 0.5;

    if (currentCabinetForDoor.isDrawerBody) {
        const availableHeight = cabinetH - (gap * (slotCount - 1));
        let totalInputHeight = 0;

        for (let i = 0; i < slotCount; i++) {
            const dData = (currentCabinetForDoor.drawersData && currentCabinetForDoor.drawersData[i]) ? currentCabinetForDoor.drawersData[i] : null;
            const sData = currentCabinetForDoor.doorSizes[i] || null;
            
            let slotH = availableHeight / slotCount;
            let customBodyH = null;
            if (dData && dData.height && !isNaN(parseFloat(dData.height))) {
                customBodyH = parseFloat(dData.height);
            } else if (sData && sData.bodyH && !isNaN(parseFloat(sData.bodyH))) {
                customBodyH = parseFloat(sData.bodyH); 
            }

            if (customBodyH !== null) {
                let defaultBodyH = (availableHeight / slotCount) * 0.7 - 2;
                let growth = customBodyH - defaultBodyH;
                slotH += growth;
            }
            requestedSlotHeights.push(slotH);
            totalInputHeight += slotH;
        }
        scaleFactor = totalInputHeight > 0 ? (availableHeight / totalInputHeight) : 1;
    }

    let html = "";
    
    // ۴. بررسی و گردش تک‌تک ابعاد درب‌ها و کشوها
     // ۴. بررسی و گردش تک‌تک ابعاد درب‌ها و کشوها (نسخه اصلاح شده فشرده و سه‌ردیفه)
    for (let i = 0; i < slotCount; i++) {
        let size = currentCabinetForDoor.doorSizes[i];
        let lockX = size.lockX || "center";
        let lockY = size.lockY || "center";
        let shiftDirX = size.shiftDirX || "none";
        let isEnabled = size.enabled !== false; 
        
        let isAuto = size.isAutoAlign === true; 
        let contentDisabledClass = isEnabled ? "" : "door-disabled-state";

        let itemName = `درب ${i + 1}`;
        if (currentCabinetForDoor.isDrawerBody || doorType === "drawer") {
            itemName = `کشو ${i + 1}`;
        } else if (currentCabinetForDoor.isBaseWithDrawer) {
            itemName = (i === 0) ? `کشو بالا (بخش ۱)` : `درب پایین ${i}`;
        } else if (doorType === "drawer-ghadi") {
            itemName = (i === 0) ? `بخش ۱ (کشو)` : `درب ${i + 1}`;
        } else if (doorType === "jaki-ghadi") {
            if (slotCount === 2) {
                itemName = (i === 0) ? `درب قدی` : `درب جکی`;
            } else {
                itemName = (i === 0) ? `درب قدی چپ` : (i === 1 ? `درب قدی راست` : `درب جکی`);
            }
        }

        let autoW = cabinetW;
        let autoH = cabinetH;

        if (currentCabinetForDoor.isDrawerBody) {
            autoW = cabinetW - 0.1;
            autoH = requestedSlotHeights[i] * scaleFactor;
        } 
        else if (currentCabinetForDoor.isBaseWithDrawer) {
            let baseDrawerH = currentCabinetForDoor.drawerFrontHeight ? parseFloat(currentCabinetForDoor.drawerFrontHeight) : 18.0; 
            let physicalSlotH = baseDrawerH + 0.8;
            const dData0 = (currentCabinetForDoor.drawersData && currentCabinetForDoor.drawersData.length > 0) ? currentCabinetForDoor.drawersData[0] : null;
            const sData0 = currentCabinetForDoor.doorSizes[0] || null;
            const defaultInnerHeight = (baseDrawerH * 0.7) - 2;
            let customBodyH = null;
            if (dData0 && dData0.height && !isNaN(parseFloat(dData0.height))) customBodyH = parseFloat(dData0.height);
            else if (sData0 && sData0.bodyH && !isNaN(parseFloat(sData0.bodyH))) customBodyH = parseFloat(sData0.bodyH);
            const innerHeight = customBodyH !== null ? customBodyH : defaultInnerHeight;
            const heightGrowth = innerHeight - defaultInnerHeight;
            let drawerActualSlotH = physicalSlotH + heightGrowth;

            if (i === 0) { 
                autoW = cabinetW - 0.1;
                autoH = drawerActualSlotH - gap;
            } else { 
                const bottomDoorsCount = slotCount > 1 ? slotCount - 1 : 1;
                let bottomDoorsStartY = cabinetH - drawerActualSlotH;
                autoW = (cabinetW - 0.1) / bottomDoorsCount;
                autoH = bottomDoorsStartY - gap;
            }
        }
        else if (doorType === "side") {
            let totalGap = 0;
            if (slotCount === 1) totalGap = 0.1; 
            else if (slotCount === 2) totalGap = 0.1;
            else if (slotCount === 3) totalGap = 0.5;
            else if (slotCount === 4) totalGap = 0.7;
            else if (slotCount > 4) totalGap = 0.7 + (slotCount - 4) * 0.2;
            autoW = slotCount > 0 ? (cabinetW - totalGap) / slotCount : cabinetW;
            autoH = cabinetH;
        } 
        else if (doorType === "lift") {
            autoW = cabinetW - 0.1; 
            autoH = (cabinetH - (0.3 * (slotCount - 1))) / slotCount;
        } 
        else if (doorType === "lift-side") {
            autoW = (cabinetW - 0.1) / 2; 
            autoH = cabinetH - 0.2;       
        } 
        else if (doorType === "split") {
            autoW = cabinetW - 0.1; 
            let totalHeightGap = 0.3; 
            if (slotCount === 3) totalHeightGap = 0.6; 
            autoH = (cabinetH - totalHeightGap) / slotCount;
        } 
        else if (doorType === "combo") {
            if (slotCount === 3) {
                autoW = (cabinetW - 0.1) / 2; 
                if (i === 0) autoH = cabinetH;
                else autoH = (cabinetH - 0.3) / 2;
            } else if (slotCount === 4) {
                autoW = (cabinetW - 0.1) / 2; 
                autoH = (cabinetH - 0.3) / 2; 
            }
        } 
        else if (doorType === "jaki-ghadi") {
            const geomJakiH = cabinetH * 0.4;
            const geomGhadiH = cabinetH - geomJakiH;
            if (i === 2) {
                autoH = geomJakiH - 0.4;
                autoW = cabinetW - 0.1;
            } else {
                autoH = geomGhadiH - 0.4;
                if (slotCount === 2) autoW = cabinetW - 0.1;
                else autoW = (cabinetW - 0.1) / 2;
            }
        }
        else {
            autoW = cabinetW / slotCount; autoH = cabinetH;
        }

        let safeW = parseFloat((Math.floor((autoW + 0.0001) * 10) / 10).toFixed(1));
        let safeH = parseFloat((Math.floor((autoH + 0.0001) * 10) / 10).toFixed(1));

        if (size.w === undefined || size.w === "") size.w = safeW;
        if (size.h === undefined || size.h === "") size.h = safeH;
        // ردیف اول: ورودی‌های مقادیر کنار هم (نسخه تمام افقی ردیف به ردیف)
html += `
    <div class="door-dimension-item compact-dim-item">
             <div class="door-dim-header-flex">
            <div class="door-dim-title">${itemName}</div>
            
            <!-- سوئیچ کپسولی جدید -->
            <label class="door-capsule-switch">
                <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="updateSingleDoorState(${i}, this.checked)">
                <span class="capsule-slider"></span>
                <span class="capsule-text">${isEnabled ? 'فعال' : 'غیرفعال'}</span>
            </label>
        </div>

        
        <div class="${contentDisabledClass} door-dim-compact-body">
            <div class="door-horizontal-rows-container">
                
                <!-- ۱. ردیف افقی مستقل عرض -->
                <div class="door-horizontal-spec-row width-row-bg">
                    <div class="spec-field-value">
                        <span class="micro-row-tag font-w">عرض</span>
                        <input type="number" step="0.1" class="modern-input door-row-input" value="${size.w}" onchange="updateSingleDoorSize(${i}, 'w', this.value)">
                    </div>
                    <div class="spec-field-lock">
                        <span class="micro-row-lock-label">قفل:</span>
                        <select class="modern-input door-row-select" onchange="updateSingleDoorLock(${i}, 'lockX', this.value)">
                            <option value="left" ${lockX === 'left' ? 'selected' : ''}>چپ</option>
                            <option value="center" ${lockX === 'center' ? 'selected' : ''}>وسط</option>
                            <option value="right" ${lockX === 'right' ? 'selected' : ''}>راست</option>
                        </select>
                    </div>
                </div>

                <!-- ۲. ردیف افقی مستقل ارتفاع -->
                <div class="door-horizontal-spec-row height-row-bg">
                    <div class="spec-field-value">
                        <span class="micro-row-tag font-h">ارتفاع</span>
                        <input type="number" step="0.1" class="modern-input door-row-input" value="${size.h}" onchange="updateSingleDoorSize(${i}, 'h', this.value)">
                    </div>
                    <div class="spec-field-lock">
                        <span class="micro-row-lock-label">قفل:</span>
                        <select class="modern-input door-row-select" onchange="updateSingleDoorLock(${i}, 'lockY', this.value)">
                            <option value="top" ${lockY === 'top' ? 'selected' : ''}>بالا</option>
                            <option value="center" ${lockY === 'center' ? 'selected' : ''}>وسط</option>
                            <option value="bottom" ${lockY === 'bottom' ? 'selected' : ''}>پایین</option>
                        </select>
                    </div>
                </div>

                <!-- ۳. ردیف افقی مستقل جابجایی -->
                <div class="door-horizontal-spec-row shift-row-bg">
                    <div class="spec-field-value">
                        <span class="micro-row-tag font-s">جابجایی</span>
                        <input type="number" placeholder="0" class="modern-input door-row-input" value="${size.shiftValueX || ''}" onchange="updateSingleDoorSize(${i}, 'shiftValueX', this.value)">
                    </div>
                    <div class="spec-field-lock fill-remaining-width">
                        <span class="micro-row-lock-label">تراز:</span>
                        <select class="modern-input door-row-select-wide" onchange="updateSingleDoorProperty(${i}, 'shiftDirX', this.value)">
                            <option value="none" ${!isAuto && shiftDirX === 'none' ? 'selected' : ''}>بدون حرکت</option>
                            <option value="left" ${!isAuto && shiftDirX === 'left' ? 'selected' : ''}>به چپ</option>
                            <option value="right" ${!isAuto && shiftDirX === 'right' ? 'selected' : ''}>به راست</option>
                            <option value="auto" ${isAuto ? 'selected' : ''}>تراز خودکار</option>
                        </select>
                    </div>
                </div>

            </div>
        </div>
    </div>
`;


    }

    // جبهه کشوهای کمد — اضافه به انتهای لیست (بدون تغییر ابعاد درب بخش)
    if (typeof appendClosetDrawerFrontDimensions === "function") {
        html += appendClosetDrawerFrontDimensions();
    }
    container.innerHTML = html;
}

window.renderDoorDimensionsInputs = renderDoorDimensionsInputs;




function toggleGlassDoorOption(checked) {
    if (currentCabinetForDoor) currentCabinetForDoor.isGlassDoor = checked;

    const frostedWrapper = document.getElementById("frosted-glass-wrapper");
    if (frostedWrapper) frostedWrapper.style.display = checked ? "block" : "none";

    if (!checked) {
        currentCabinetForDoor.isFrostedGlass = false;
        const frostedCheck = document.getElementById("door-panel-is-frosted");
        if (frostedCheck) frostedCheck.checked = false;
        // اگر تیک شیشه برداشته شد و مدل هنوز glass است → برگرد به flat
        if (currentCabinetForDoor.doorStyle === "glass") {
            currentCabinetForDoor.doorStyle = "flat";
            const styleSel = document.getElementById("door-panel-style");
            if (styleSel) styleSel.value = "flat";
        }
    } else {
        // تیک شیشه → مدل glass
        currentCabinetForDoor.doorStyle = "glass";
        const styleSel = document.getElementById("door-panel-style");
        if (styleSel) styleSel.value = "glass";
    }

    updateDoorPreviewFromPanel();
    if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.refreshCabinets === "function") {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
    }
}

/**
 * انتخاب مدل ظاهری درب از پنل
 * مقادیر: flat | beveled | shaker | frame | glass | fluted
 */
function updateDoorStyleFromPanel(styleValue) {
    if (!currentCabinetForDoor) return;

    const style = (styleValue || "flat").toString().toLowerCase().trim();
    currentCabinetForDoor.doorStyle = style;

    // همگام‌سازی با تیک شیشه
    const isGlass = style === "glass";
    currentCabinetForDoor.isGlassDoor = isGlass;

    const isGlassCheck = document.getElementById("door-panel-is-glass");
    if (isGlassCheck) isGlassCheck.checked = isGlass;

    const frostedWrapper = document.getElementById("frosted-glass-wrapper");
    if (frostedWrapper) frostedWrapper.style.display = isGlass ? "block" : "none";

    if (!isGlass) {
        currentCabinetForDoor.isFrostedGlass = false;
        const frostedCheck = document.getElementById("door-panel-is-frosted");
        if (frostedCheck) frostedCheck.checked = false;
    }

    // اگر doorSizes وجود دارد، استایل را روی همه اسلات‌ها هم بنویس (قابل override بعدی)
    if (Array.isArray(currentCabinetForDoor.doorSizes)) {
        currentCabinetForDoor.doorSizes.forEach((sz) => {
            if (sz) sz.doorStyle = style;
        });
    }

    if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
    if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.refreshCabinets === "function") {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
    }
    try {
        if (window.KitchenBabylon && window.KitchenBabylon.isReady) {
            if (typeof window.KitchenBabylon.refreshCabinets === "function")
                window.KitchenBabylon.refreshCabinets();
            else if (typeof window.KitchenBabylon.renderCabinets === "function")
                window.KitchenBabylon.renderCabinets();
        }
    } catch (e) {}
}
window.updateDoorStyleFromPanel = updateDoorStyleFromPanel;



// ==========================================
// تابع رندر داینامیک متریال و رنگ برای تک تک درب‌ها/کشوها
// ==========================================

/** گزینه‌های پرداخت نور (جدا از جنس ورق / کاتالوگ رنگ) */
function getDoorFinishOptionsHtml(selected) {
  const opts = [
    { v: 'matte', t: 'مات (Matte)' },
    { v: 'semiMatte', t: 'نیمه‌مات' },
    { v: 'satin', t: 'ساتین' },
    { v: 'highGloss', t: 'براق / های‌گلاس' }
  ];
  const sel = selected || 'matte';
  return opts.map(o =>
    `<option value="${o.v}" ${sel === o.v ? 'selected' : ''}>${o.t}</option>`
  ).join('');
}
window.getDoorFinishOptionsHtml = getDoorFinishOptionsHtml;

function onDoorFinishChange(value) {
  if (!currentCabinetForDoor) return;
  currentCabinetForDoor.doorFinish = value;
  if (typeof updateDoorPreviewFromPanel === 'function') updateDoorPreviewFromPanel();
  if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets &&
      document.getElementById('modal-3d-container')?.style.display === 'flex') {
    Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
  }
}
window.onDoorFinishChange = onDoorFinishChange;

function syncDoorFinishSelect() {
  const el = document.getElementById('door-panel-finish');
  if (!el || !currentCabinetForDoor) return;
  const v = currentCabinetForDoor.doorFinish || 'matte';
  el.value = v;
}
window.syncDoorFinishSelect = syncDoorFinishSelect;


function renderDoorMaterialAndColorInputs() {
    const container = document.getElementById("door-materials-colors-container");
    if (!container || !currentCabinetForDoor) return;

    const doorType = currentCabinetForDoor.doorType || "side";
    let doorsCount = currentCabinetForDoor.doors || 2;

    if (currentCabinetForDoor.isDrawerBody) {
        doorsCount = currentCabinetForDoor.drawersCount || (currentCabinetForDoor.drawersData ? currentCabinetForDoor.drawersData.length : 3);
    }

    // مطمئن می‌شویم آرایه مشخصات ابعاد و متریال به تعداد درب‌ها وجود دارد
    if (!currentCabinetForDoor.doorSizes || currentCabinetForDoor.doorSizes.length !== doorsCount) {
        let oldSizes = currentCabinetForDoor.doorSizes || [];
        currentCabinetForDoor.doorSizes = Array.from({ length: doorsCount }, (_, i) => {
            return oldSizes[i] || { w: "", h: "", lockX: "center", lockY: "center", enabled: true };
        });
    }

    // حالت الف: اگر نوع بازشو کشو (drawer) باشد، برای هر کشو فیلد اختصاصی می‌سازیم
    if (doorType === "drawer") {
        let html = "";
        for (let i = 0; i < doorsCount; i++) {
            let size = currentCabinetForDoor.doorSizes[i];
            let mat = size.doorMaterial || currentCabinetForDoor.doorMaterial || "mdf";
            let colorName = size.doorColorName || getColorNameByValue(size.doorTexture || size.doorColor || currentCabinetForDoor.doorColor) || "";

            html += `
                <div class="door-dynamic-box door-drawer-item-box">
                    <div class="door-dynamic-header door-micro-header">تنظیمات متریال و رنگ - کشو ${i + 1}</div>
                    <div class="door-grid-2">
                        <div class="door-input-group no-margin">
                            <label class="door-small-label">متریال کشو ${i + 1}</label>
                            <select class="modern-select" onchange="updateSingleDrawerMaterial(${i}, this.value)"> 
                                <option value="mdf" ${mat === 'mdf' ? 'selected' : ''}>MDF (ام دی اف)</option>
                                <option value="highGloss" ${mat === 'highGloss' ? 'selected' : ''}>High-Gloss (هایگلاس)</option>
                                <option value="leteron" ${mat === 'leteron' ? 'selected' : ''}>Leteron (لترون)</option>
                            </select>
                        </div>
                        <div class="door-input-group no-margin">
                            <label class="door-small-label">رنگ کشو ${i + 1}</label>
                            <div class="door-color-search-container">
                                <input type="text" 
                                       id="drawer-color-search-${i}" 
                                       onclick="openColorPickerForSingleDrawer(${i})" 
                                       placeholder="انتخاب رنگ کشو..." 
                                       class="modern-input door-readonly-color-input" 
                                       value="${colorName}"
                                       autocomplete="off" readonly>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
        syncDoorFinishSelect();
    } 
    // حالت جدید ب: یونیت ترکیبی کشو و قدی (drawer-ghadi) - اصلاح شده برای تم تیره
    else if (doorType === "drawer-ghadi") {
        // ۱. دریافت اطلاعات بخش کشو (ایندکس 0)
        let drawerSize = currentCabinetForDoor.doorSizes[0];
        let drawerMat = drawerSize.doorMaterial || currentCabinetForDoor.doorMaterial || "mdf";
        let drawerColorName = drawerSize.doorColorName || getColorNameByValue(drawerSize.doorTexture || drawerSize.doorColor || currentCabinetForDoor.doorColor) || "";

        // ۲. دریافت اطلاعات درب‌های قدی (مبنا را تنظیمات عمومی کابینت می‌گذاریم)
        const mainMat = currentCabinetForDoor.doorMaterial || "mdf";
        const mainColorName = getColorNameByValue(currentCabinetForDoor.doorColor) || "";

        container.innerHTML = `
            <div class="door-dynamic-box door-ghadi-section-box door-mb-16">
                <div class="door-dynamic-header door-ghadi-header">تنظیمات متریال و رنگ - کشوی بالا</div>
                <div class="door-grid-2">
                    <div class="door-input-group no-margin">
                        <label class="door-small-label">متریال کشو</label>
                        <select class="modern-select" onchange="updateSingleDrawerMaterial(0, this.value)"> 
                            <option value="mdf" ${drawerMat === 'mdf' ? 'selected' : ''}>MDF (ام دی اف)</option>
                            <option value="highGloss" ${drawerMat === 'highGloss' ? 'selected' : ''}>High-Gloss (هایگلاس)</option>
                            <option value="leteron" ${drawerMat === 'leteron' ? 'selected' : ''}>Leteron (لترون)</option>
                        </select>
                    </div>
                    <div class="door-input-group no-margin">
                        <label class="door-small-label">رنگ کشو</label>
                        <div class="door-color-search-container">
                            <input type="text" 
                                   id="drawer-color-search-0" 
                                   onclick="openColorPickerForSingleDrawer(0)" 
                                   placeholder="انتخاب رنگ کشو..." 
                                   class="modern-input door-readonly-color-input" 
                                   value="${drawerColorName}"
                                   autocomplete="off" readonly>
                        </div>
                    </div>
                </div>
            </div>

            <div class="door-dynamic-box door-ghadi-section-box">
                <div class="door-dynamic-header door-ghadi-header">تنظیمات متریال و رنگ - درب‌های قدی پایین</div>
                <div class="door-grid-2">
                    <div class="door-input-group no-margin">
                        <label class="door-small-label">جنس ورق درب‌ها</label>
                        <select id="door-panel-material" class="modern-select" onchange="updateDoorMaterials(this.value); currentCabinetForDoor.doorMaterial = this.value; syncBottomDoorsMaterial(this.value);"> 
                            <option value="mdf" ${mainMat === 'mdf' ? 'selected' : ''}>MDF (ام دی اف)</option>
                            <option value="highGloss" ${mainMat === 'highGloss' ? 'selected' : ''}>High-Gloss (هایگلاس)</option>
                            <option value="leteron" ${mainMat === 'leteron' ? 'selected' : ''}>Leteron (لترون)</option>
                        </select>
                    </div>
                    <div class="door-input-group no-margin">
                        <label class="door-small-label">رنگ درب‌های قدی</label>
                        <div class="door-color-search-container">
                            <input type="text" 
                                   id="door-color-search" 
                                   onclick="openMainDoorColorPicker()" 
                                   placeholder="جستجوی رنگ..." 
                                   class="modern-input door-readonly-color-input" 
                                   value="${mainColorName}"
                                   autocomplete="off" 
                                   readonly>
                        </div>
                    </div>
                </div>
            </div>
        `;
        syncDoorFinishSelect();
    } 
    // حالت ج: سایر حالت‌ها (یک دست چوب یا شیشه سرتاسری)
    else {
        const mainMat = currentCabinetForDoor.doorMaterial || "mdf";
        const mainColorName = getColorNameByValue(currentCabinetForDoor.doorColor) || "";
        
        container.innerHTML = `
            <div class="door-grid-2">
                <div class="door-input-group no-margin">
                    <label>جنس ورق</label>
                    <select id="door-panel-material" class="modern-select" onchange="updateDoorMaterials(this.value); currentCabinetForDoor.doorMaterial = this.value;"> 
                        <option value="mdf" ${mainMat === 'mdf' ? 'selected' : ''}>MDF (ام دی اف)</option>
                        <option value="highGloss" ${mainMat === 'highGloss' ? 'selected' : ''}>High-Gloss (هایگلاس)</option>
                        <option value="leteron" ${mainMat === 'leteron' ? 'selected' : ''}>Leteron (لترون)</option>
                    </select>
                </div>
                <div class="door-input-group no-margin">
                    <label>رنگ درب</label>
                    <div class="door-color-search-container">
                        <input type="text" 
                               id="door-color-search" 
                               onclick="openMainDoorColorPicker()" 
                               placeholder="جستجوی رنگ..." 
                               class="modern-input door-readonly-color-input" 
                               value="${mainColorName}"
                               autocomplete="off" 
                               readonly>
                    </div>
                </div>
            </div>
        `;
        // همگام‌سازی سلکت پرداخت سطح (ثابت در HTML)
        syncDoorFinishSelect();
    }
}



window.renderDoorMaterialAndColorInputs = renderDoorMaterialAndColorInputs;

// تابع کمکی برای آپدیت متریال یک کشوی خاص
window.updateSingleDrawerMaterial = function(index, materialValue) {
    if (!currentCabinetForDoor || !currentCabinetForDoor.doorSizes) return;
    currentCabinetForDoor.doorSizes[index].doorMaterial = materialValue;
    updateDoorMaterials(materialValue);
};

// تابع باز کردن مودال رنگ اختصاصی برای یک کشو
window.openColorPickerForSingleDrawer = function(drawerIndex) {
    currentColorModalTarget = { type: 'single-drawer', index: drawerIndex };
    
    let sizeObj = currentCabinetForDoor.doorSizes[drawerIndex];
    let currentMat = sizeObj?.doorMaterial || currentCabinetForDoor.doorMaterial || "mdf";
    
    openUniversalModal(`انتخاب رنگ کشو ${drawerIndex + 1}`, currentMat, function(selectedColor) {
        
        // 🟢 اصلاح شد: تفکیک دقیق کد رنگ و آدرس تکسچر روی شیء کشو برای Three.js
        if (selectedColor.texture) {
            currentCabinetForDoor.doorSizes[drawerIndex].doorTexture = selectedColor.texture;
            currentCabinetForDoor.doorSizes[drawerIndex].doorColor = null; // پاک کردن رنگ قبلی
        } else {
            currentCabinetForDoor.doorSizes[drawerIndex].doorColor = selectedColor.code;
            currentCabinetForDoor.doorSizes[drawerIndex].doorTexture = null; // پاک کردن تکسچر قبلی
        }
        
        currentCabinetForDoor.doorSizes[drawerIndex].doorColorName = selectedColor.name;
        
        // آپدیت سریع فیلد متنی در پنل
        const inputField = document.getElementById(`drawer-color-search-${drawerIndex}`);
        if (inputField) inputField.value = selectedColor.name;
        
        // به‌روزرسانی نماها
        if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
        if (typeof draw === 'function') draw();
        
        // اجرای رندر مجدد سه‌بعدی
        if (typeof Kitchen3D !== "undefined" && Kitchen3D.refreshCabinets) {
            Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
            if (typeof drawFrontElevation === 'function') drawFrontElevation();

        }
    });
};

window.syncBottomDoorsMaterial = function(materialValue) {
    if (!currentCabinetForDoor || !currentCabinetForDoor.doorSizes) return;
    // از ایندکس 1 به بعد (درب‌های قدی زیرِ کشو) متریال را بروزرسانی کن
    for (let i = 1; i < currentCabinetForDoor.doorSizes.length; i++) {
        currentCabinetForDoor.doorSizes[i].doorMaterial = materialValue;
    }
    if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
    if (typeof Kitchen3D !== "undefined" && Kitchen3D.refreshCabinets) Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
};



function updateSingleDoorSize(index, dimension, value) {
    if (!currentCabinetForDoor || !currentCabinetForDoor.doorSizes) return;
    
    currentCabinetForDoor.doorSizes[index][dimension] = value === "" ? "" : parseFloat(value);
    // علامت بزن که کاربر دستی عوض کرده تا با انتخاب مجدد بخش ریست نشود
    currentCabinetForDoor.doorSizes[index].isAutoSize = false;
    
    // --- این دو خط برای تراز خودکار اضافه شد ---
    if (typeof applyAutoAlignLogic === 'function') applyAutoAlignLogic();
    if (typeof renderDoorDimensionsInputs === "function") renderDoorDimensionsInputs();

    // در حالت چهارچوب کمد، تنظیمات زنده را فوری روی cfg قطعه هم بنویس
    // تا پیش‌نمایش و رندر ۳D از داده‌ی به‌روز استفاده کنند
    if (currentCabinetForDoor.parts && (selectedClosetFrameCellId || selectedClosetFramePartId) && typeof saveCurrentPartDoorConfig === "function") {
        saveCurrentPartDoorConfig();
    }
    
    if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
    if (typeof draw === "function") draw();
    if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.refreshCabinets === 'function') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
        if (typeof drawFrontElevation === 'function') drawFrontElevation();

    }
}
window.updateSingleDoorSize = updateSingleDoorSize;


function updateSingleDoorProperty(index, property, value) {
    if (!currentCabinetForDoor || !currentCabinetForDoor.doorSizes) return;

// --- اضافه شدن منطق تراز خودکار ---
    if (property === 'shiftDirX') {
        if (value === 'auto') {
            currentCabinetForDoor.doorSizes[index].isAutoAlign = true;
            currentCabinetForDoor.doorSizes[index].shiftDirX = 'none';
            currentCabinetForDoor.doorSizes[index].shiftValueX = 0;
        } else {
            currentCabinetForDoor.doorSizes[index].isAutoAlign = false;

            // 🌟 رفع باگ: «چپ»/«راست» باید درب رو دقیقاً بچسبونه به لبه‌ی همون طرفِ کل یونیت،
            // نه فقط یه عدد ثابت — مهم نیست درب چقدر کوچیک/بزرگ شده باشه.
            if (value === 'left' || value === 'right') {
                const shift = computeFlushShiftToUnitEdge(index, value);
                currentCabinetForDoor.doorSizes[index].shiftDirX = shift.dir;
                currentCabinetForDoor.doorSizes[index].shiftValueX = shift.value;
            } else {
                // "بدون حرکت"
                currentCabinetForDoor.doorSizes[index].shiftDirX = 'none';
                currentCabinetForDoor.doorSizes[index].shiftValueX = 0;
            }
        }
    } else {
        currentCabinetForDoor.doorSizes[index][property] = value;
    }

    // اعمال محاسبات اگر تراز خودکار روشن بود و رفرش UI
    if (typeof applyAutoAlignLogic === 'function') applyAutoAlignLogic();
    if (typeof renderDoorDimensionsInputs === "function") renderDoorDimensionsInputs();

    // همگام‌سازی زنده با cfg قطعه در حالت چهارچوب کمد
    if (currentCabinetForDoor.parts && (selectedClosetFrameCellId || selectedClosetFramePartId) && typeof saveCurrentPartDoorConfig === "function") {
        saveCurrentPartDoorConfig();
    }

    if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
    if (typeof draw === "function") draw();
    if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.refreshCabinets === 'function') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
        if (typeof drawFrontElevation === 'function') drawFrontElevation();

    }
}
window.updateSingleDoorProperty = updateSingleDoorProperty;

// 💡 تابع جدید برای ذخیره وضعیت قفل‌ها
function updateSingleDoorLock(index, axis, value) {
    if (!currentCabinetForDoor || !currentCabinetForDoor.doorSizes) return;
    
    // ذخیره مقدار قفل (lockX یا lockY) در آبجکت درب مربوطه
    currentCabinetForDoor.doorSizes[index][axis] = value;
    
    // --- این دو خط برای تراز خودکار اضافه شد ---
    if (typeof applyAutoAlignLogic === 'function') applyAutoAlignLogic();
    if (typeof renderDoorDimensionsInputs === "function") renderDoorDimensionsInputs();

    // همگام‌سازی زنده با cfg قطعه در حالت چهارچوب کمد
    if (currentCabinetForDoor.parts && (selectedClosetFrameCellId || selectedClosetFramePartId) && typeof saveCurrentPartDoorConfig === "function") {
        saveCurrentPartDoorConfig();
    }
    
    // آپدیت کردن پیش‌نمایش و نقشه
    if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
    if (typeof draw === "function") draw();
    if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.refreshCabinets === 'function') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
    }
}
window.updateSingleDoorLock = updateSingleDoorLock;


// ذخیره موقعیت درب قدی (راست یا چپ) و آپدیت پیش‌نمایش
window.updateComboLayout = function(layout) {
    if (!currentCabinetForDoor) return;
    
    // ذخیره در تنظیمات کابینت فعلی
    currentCabinetForDoor.comboLayout = layout;
    
    // آپدیت کردن پیش‌نمایش ۲ بعدی در پنل
    updateDoorPreviewFromPanel();
    
    // در صورت نیاز آپدیت فوری نمای ۳ بعدی
    if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.refreshCabinets === 'function') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
    }
};

// تابع آپدیت چیدمان درب جکی-قدی
window.updateJakiGhadiLayout = function(value) {
    if (!currentCabinetForDoor) return;
    
    // ذخیره حالت در تنظیمات کابینت فعلی
    currentCabinetForDoor.jakiGhadiLayout = value;
    updateDoorPreviewFromPanel();
    // بروزرسانی پیش‌نمایش و صحنه
    if (typeof updateDoorPreview === "function") updateDoorPreview();
    if (typeof renderScene === "function") renderScene();
    if (typeof saveDesignToHistory === "function") saveDesignToHistory();
};


window.updateSingleDoorDirection = function(index, value) {
    if (currentCabinetForDoor && currentCabinetForDoor.doorDirections) {
        currentCabinetForDoor.doorDirections[index] = value;

        // برای چهارچوب کمد: ذخیره و همگام‌سازی sides
        if (currentCabinetForDoor.parts && selectedClosetFrameCellId && typeof saveCurrentPartDoorConfig === "function") {
            saveCurrentPartDoorConfig();
        }
        
        // --- این دو خط برای تراز خودکار اضافه شد ---
        if (typeof applyAutoAlignLogic === 'function') applyAutoAlignLogic();
        if (typeof renderDoorDimensionsInputs === "function") renderDoorDimensionsInputs();
        
        // این خط اضافه شد تا پیش‌نمایش داخل خود پنل در لحظه آپدیت شود
        if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
        
        if (typeof draw === 'function') draw(); // آپدیت 2D نقشه اصلی
        if (typeof Kitchen3D !== "undefined" && Kitchen3D.scene && document.getElementById("modal-3d-container")?.style.display === "flex"
) {
            Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined); // آپدیت 3D
        }
    }
}


// ==========================================

function updateSingleDoorState(index, isEnabled) {
    if (!currentCabinetForDoor || !currentCabinetForDoor.doorSizes) return;
    
    // ذخیره وضعیت فعال/غیرفعال بودن درب
    currentCabinetForDoor.doorSizes[index].enabled = isEnabled;
    
    if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
    if (typeof draw === "function") draw();
    if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.refreshCabinets === 'function') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
        if (typeof drawFrontElevation === 'function') drawFrontElevation();

    }
}
window.updateSingleDoorState = updateSingleDoorState;

// ==========================================
// 🟢 قطعه ثابت (بدون بازشو) - کنار بقیه درب‌ها قرار می‌گیرد ولی انیمیشن باز/بسته شدن ندارد
// ==========================================

// همگام‌سازی مقادیر فیلدهای پنل با دیتای ذخیره‌شده قطعه ثابت
function renderFixedPanelSettings() {
    if (!currentCabinetForDoor) return;
    const fp = currentCabinetForDoor.fixedPanel;
    if (!fp) return;

    const checkbox = document.getElementById("door-panel-fixed-enabled");
    const settingsWrap = document.getElementById("fixed-panel-settings");
    if (checkbox) checkbox.checked = fp.enabled === true;
    if (settingsWrap) settingsWrap.style.display = fp.enabled ? "block" : "none";

    const sideSel = document.getElementById("fixed-panel-side");
    if (sideSel) sideSel.value = fp.side || "left";

    const wInput = document.getElementById("fixed-panel-width");
    if (wInput) wInput.value = (fp.w !== undefined && fp.w !== null) ? fp.w : "";

    const hInput = document.getElementById("fixed-panel-height");
    if (hInput) hInput.value = (fp.h !== undefined && fp.h !== null) ? fp.h : "";

    const lockSel = document.getElementById("fixed-panel-locky");
    if (lockSel) lockSel.value = fp.lockY || "center";

    const colorSearch = document.getElementById("fixed-panel-color-search");
    if (colorSearch) colorSearch.value = fp.colorName || "";
}
window.renderFixedPanelSettings = renderFixedPanelSettings;

// فعال/غیرفعال کردن قطعه ثابت
function toggleFixedPanel(isEnabled) {
    if (!currentCabinetForDoor) return;

    if (!currentCabinetForDoor.fixedPanel) {
        currentCabinetForDoor.fixedPanel = {
            enabled: false,
            side: "left",
            w: 10,
            h: currentCabinetForDoor.h || 70,
            lockY: "center",
            color: "#ffffff",
            colorName: "",
            material: "mdf"
        };
    }

    currentCabinetForDoor.fixedPanel.enabled = isEnabled;
    renderFixedPanelSettings();

    if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
    if (typeof draw === "function") draw();
    if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.refreshCabinets === 'function') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
        if (typeof drawFrontElevation === 'function') drawFrontElevation();
    }
}
window.toggleFixedPanel = toggleFixedPanel;

// ذخیره تغییرات یکی از فیلدهای قطعه ثابت (تراز، عرض، طول، قفل)
function updateFixedPanelProperty(property, value) {
    if (!currentCabinetForDoor || !currentCabinetForDoor.fixedPanel) return;

    if (property === "w" || property === "h") {
        currentCabinetForDoor.fixedPanel[property] = (value === "" || value === null) ? "" : (parseFloat(value) || 0);
    } else {
        currentCabinetForDoor.fixedPanel[property] = value;
    }

    if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
    if (typeof draw === "function") draw();
    if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.refreshCabinets === 'function') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
        if (typeof drawFrontElevation === 'function') drawFrontElevation();
    }
}
window.updateFixedPanelProperty = updateFixedPanelProperty;

// باز کردن مودال انتخاب رنگ مخصوص قطعه ثابت
function openFixedPanelColorPicker() {
    if (!currentCabinetForDoor || !currentCabinetForDoor.fixedPanel) return;

    const category = currentCabinetForDoor.fixedPanel.material || "mdf";

    openUniversalModal("انتخاب رنگ قطعه ثابت", category, function(selectedColor) {
        const colorValue = selectedColor.code || selectedColor.texture;
        currentCabinetForDoor.fixedPanel.color = colorValue;
        currentCabinetForDoor.fixedPanel.colorName = selectedColor.name;

        const searchInput = document.getElementById("fixed-panel-color-search");
        if (searchInput) searchInput.value = selectedColor.name;

        if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
        if (typeof draw === "function") draw();
        if (typeof Kitchen3D !== "undefined" && Kitchen3D.refreshCabinets) Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
        if (typeof drawFrontElevation === 'function') drawFrontElevation();
    });
}
window.openFixedPanelColorPicker = openFixedPanelColorPicker;


// متغیر برای تشخیص اینکه مودال برای درب اصلی باز شده یا دستگیره مخفی
// ۱. متغیر سراسری برای تشخیص هدف مودال
let currentColorModalTarget = { type: 'main-door', index: null };

// ۲. تابع باز کردن مودال برای درب اصلی
function openMainDoorColorPicker() {
    currentColorModalTarget = { type: 'main-door', index: null };
    
    const mainMaterialSelect = document.getElementById("door-panel-material");
    const category = mainMaterialSelect ? mainMaterialSelect.value : "mdf";
    
    openUniversalModal("انتخاب رنگ درب", category, function(selectedColor) {
        const colorValue = selectedColor.code || selectedColor.texture;
        currentCabinetForDoor.doorColor = colorValue;
        
        const searchInput = document.getElementById("door-color-search");
        if (searchInput) searchInput.value = selectedColor.name;
        
        // به‌روزرسانی پیش‌نمایش ها
        if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
        if (typeof draw === 'function') draw();
        if (typeof Kitchen3D !== "undefined" && Kitchen3D.refreshCabinets) Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
        if (typeof drawFrontElevation === 'function') drawFrontElevation();

    });
}

// ۳. تابع باز کردن مودال برای دستگیره مخفی مشخص
function openColorPickerForHiddenHandle(doorIndex) {
    currentColorModalTarget = { type: 'hidden-handle', index: doorIndex };
    
    let hhMaterial = "mdf";
    if (currentCabinetForDoor && currentCabinetForDoor.doorSizes && currentCabinetForDoor.doorSizes[doorIndex]) {
        hhMaterial = currentCabinetForDoor.doorSizes[doorIndex].hiddenHandleMaterial || "mdf";
    }
    
    openUniversalModal(`انتخاب رنگ دستگیره درب ${doorIndex + 1}`, hhMaterial, function(selectedColor) {
        const colorValue = selectedColor.code || selectedColor.texture;
        
        // ذخیره دقیق روی ایندکس مشخص درب جاری
        updateSingleDoorProperty(doorIndex, 'hiddenHandleColor', colorValue);
        updateSingleDoorProperty(doorIndex, 'hiddenHandleColorName', selectedColor.name);
        
        // آپدیت سریع فیلد متنی همان دستگیره
        const searchInputHH = document.getElementById(`hidden-handle-color-search-${doorIndex}`);
        if (searchInputHH) searchInputHH.value = selectedColor.name;
        
        // به‌روزرسانی نهایی و اجباری کل سیستم
        if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
        if (typeof draw === 'function') draw();
        if (typeof Kitchen3D !== "undefined" && Kitchen3D.refreshCabinets) Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
        if (typeof drawFrontElevation === 'function') drawFrontElevation();

    });
}




// باز کردن پنل
function openDoorEditorPanel() {
  if (selectedId === -1) {
    alert("لطفاً ابتدا یک کابینت انتخاب کنید!");
    return;
  }

  currentCabinetForDoor = cabinets.find((c) => c.id === selectedId);
  if (!currentCabinetForDoor) return;

  // 🟢 [اصلاحیه طلایی ۱] - مقداردهی اولیه به جنس و رنگ کابینت در صورت خالی بودن
  if (!currentCabinetForDoor.doorMaterial) {
      // اگر یونیت از نوع کشو بود، هایگلاس وگرنه ام‌دی‌اف (یا هر چیزی که مدنظرت هست)
      currentCabinetForDoor.doorMaterial = currentCabinetForDoor.isDrawerBody ? "highGloss" : "mdf";
  }
  // پرداخت سطح (نور) — جدا از جنس ورق
  if (!currentCabinetForDoor.doorFinish) {
      currentCabinetForDoor.doorFinish = "matte";
  }
  // مقدار سلکت HTML ثابت
  setTimeout(function() {
    if (typeof syncDoorFinishSelect === 'function') syncDoorFinishSelect();
  }, 0);
  if (!currentCabinetForDoor.doorColor) {
      // اختصاص یک رنگ پیش‌فرض معتبر به دیتای کابینت تا لیست قطعات درجا بشناسد
      currentCabinetForDoor.doorColor = currentCabinetForDoor.isDrawerBody ? "#f8fafc" : "#ffffff"; 
  }

  // شماره کابینت
  const idDisplay = document.getElementById("door-panel-cabinet-id");
  if (idDisplay) idDisplay.textContent = selectedId;

  // نوع بازشو — ابتدا لیست کامل یونیت معمولی را برگردان
  const typeSelect = document.getElementById("door-panel-type");
  if (!typeSelect) {
      console.error("المان door-panel-type در صفحه یافت نشد!");
      return;
  }
  populateDoorTypeOptions("normal");

  let drawerOption = Array.from(typeSelect.options).find(opt => opt.value === 'drawer');
  let drawerGhadiOption = Array.from(typeSelect.options).find(opt => opt.value === 'drawer-ghadi');

  // منطق نمایش منوی بازشوها
  if (currentCabinetForDoor.isDrawerBody) {
      if (drawerOption) drawerOption.style.display = "block";
      if (drawerGhadiOption) drawerGhadiOption.style.display = "none";
      typeSelect.value = currentCabinetForDoor.doorType || "drawer";
  } else if (currentCabinetForDoor.isBaseWithDrawer) {
      if (drawerOption) drawerOption.style.display = "none";
      if (drawerGhadiOption) drawerGhadiOption.style.display = "block";
      typeSelect.value = currentCabinetForDoor.doorType || "drawer-ghadi";
  } else {
      if (drawerOption) drawerOption.style.display = "none";
      if (drawerGhadiOption) drawerGhadiOption.style.display = "none";
      const currentVal = currentCabinetForDoor.doorType || "side";
      typeSelect.value = (currentVal === "drawer" || currentVal === "drawer-ghadi" || currentVal === "sliding") ? "side" : currentVal;
  }
  typeSelect.disabled = (currentCabinetForDoor.isDrawerBody || currentCabinetForDoor.isBaseWithDrawer);

  // سینک کردن نوع درب در شیء کابینت جاری
  currentCabinetForDoor.doorType = typeSelect.value;

  // نوع درب
  const materialSelect = document.getElementById("door-panel-material");
  if (materialSelect) {
      materialSelect.value = currentCabinetForDoor.doorMaterial;
      updateDoorMaterials(materialSelect.value);
  }

  // مقداردهی تعداد درب / کشو
  const countInput = document.getElementById("door-panel-count");
  let doorsCount;
  const isDrawerUnit = currentCabinetForDoor && (currentCabinetForDoor.isDrawerBody || currentCabinetForDoor.isBaseWithDrawer);

  if (countInput) {
      if (isDrawerUnit) {
          if (currentCabinetForDoor.isBaseWithDrawer) {
              doorsCount = (currentCabinetForDoor.doors === 2 || currentCabinetForDoor.doors === 3) 
                            ? currentCabinetForDoor.doors 
                            : 3; 
              currentCabinetForDoor.doors = doorsCount; 
              countInput.value = doorsCount;
              countInput.disabled = false; 
              countInput.setAttribute("min", "2");
              countInput.setAttribute("max", "3");
              countInput.style.backgroundColor = ""; 
          } else {
              doorsCount = currentCabinetForDoor.drawerCount || 1;
              currentCabinetForDoor.doors = doorsCount; 
              countInput.value = doorsCount;
              countInput.disabled = true; 
              countInput.style.backgroundColor = ""; 
          }
      } else {
          doorsCount = currentCabinetForDoor.doors || 2;
          currentCabinetForDoor.doors = doorsCount; 
          countInput.value = doorsCount;
          countInput.disabled = false; 
          countInput.removeAttribute("min");
          countInput.removeAttribute("max");
          countInput.style.backgroundColor = ""; 
      }
  }

  // نمایش درب‌ها (چک‌باکس)
  const showDoorsCheck = document.getElementById("door-panel-show-doors");
  if (showDoorsCheck) {
      showDoorsCheck.checked = currentCabinetForDoor.showDoors !== false;
  }
  
  // ------------ خواندن وضعیت درب شیشه ای ------------
  const isGlassCheck = document.getElementById("door-panel-is-glass");
  if (isGlassCheck) {
      isGlassCheck.checked = currentCabinetForDoor.isGlassDoor === true;
  }

  // ------------ مدل ظاهری درب (doorStyle) ------------
  // اگر isGlassDoor باشد و doorStyle خالی باشد → glass
  if (!currentCabinetForDoor.doorStyle) {
      currentCabinetForDoor.doorStyle = currentCabinetForDoor.isGlassDoor ? "glass" : "flat";
  }
  if (currentCabinetForDoor.isGlassDoor && currentCabinetForDoor.doorStyle === "flat") {
      currentCabinetForDoor.doorStyle = "glass";
  }
  const styleSelect = document.getElementById("door-panel-style");
  if (styleSelect) {
      const allowed = ["flat", "beveled", "shaker", "frame", "glass", "fluted"];
      const cur = (currentCabinetForDoor.doorStyle || "flat").toLowerCase();
      styleSelect.value = allowed.includes(cur) ? cur : "flat";
  }
  const frostedWrapperInit = document.getElementById("frosted-glass-wrapper");
  if (frostedWrapperInit) {
      frostedWrapperInit.style.display = (currentCabinetForDoor.isGlassDoor || currentCabinetForDoor.doorStyle === "glass") ? "block" : "none";
  }
  const frostedCheckInit = document.getElementById("door-panel-is-frosted");
  if (frostedCheckInit) {
      frostedCheckInit.checked = currentCabinetForDoor.isFrostedGlass === true;
  }

  // اصلاح بازخوانی رنگ دستگیره های مخفی برای تک تک درب ها
  if (currentCabinetForDoor && currentCabinetForDoor.doorSizes) {
      currentCabinetForDoor.doorSizes.forEach((size, idx) => {
          if (size.hiddenHandleColor) {
              const foundName = getColorNameByValue(size.hiddenHandleColor);
              if (foundName) {
                  size.hiddenHandleColorName = foundName;
              }
          }
      });
  }

  // باز کردن پنل ظاهر فیزیکی
  const editorPanel = document.getElementById("door-editor-panel");
  if (editorPanel) {
      editorPanel.classList.add("active");
  }
  
  // اجرای توابع رندر فرم داخلی
  renderDoorDirectionSelectors();
  renderDoorDimensionsInputs();
  renderDoorHiddenHandleInputs();
  renderDoorMaterialAndColorInputs(); 

  // 🟢 مقداردهی اولیه و رندر «قطعه ثابت» (بدون بازشو)
  if (!currentCabinetForDoor.fixedPanel) {
      currentCabinetForDoor.fixedPanel = {
          enabled: false,
          side: "left",
          w: 10,
          h: currentCabinetForDoor.h || 70,
          lockY: "center",
          color: "#ffffff",
          colorName: "",
          material: "mdf"
      };
  }
  renderFixedPanelSettings();

  // مقداردهی فیلد سرچ رنگ
  const colorSearchInput = document.getElementById("door-color-search");
  if (colorSearchInput) {
      const currentColorValue = currentCabinetForDoor.doorColor;
      colorSearchInput.value = getColorNameByValue(currentColorValue) || "";
  }

  // بروزرسانی پیش‌نمایش نهایی در پنل
  updateDoorPreviewFromPanel();
}


let selectedClosetFramePartId = null; // سازگاری عقب‌رو
let selectedClosetFrameCellId = null;
let selectedClosetFrameCellSide = null; // left | right | top | bottom
let cachedClosetFrameCells = [];

const CLOSET_CELL_SIDE_ORDER = ["top", "bottom", "left", "right"];
const CLOSET_CELL_SIDE_LABELS = { top: "بالا", bottom: "پایین", left: "چپ", right: "راست" };

function createEmptyClosetSideConfig() {
    return {
        enabled: false,
        doorType: "side",
        doors: 1,
        doorSizes: null,
        doorDirections: null,
        comboLayout: "left-big",
        jakiGhadiLayout: "top",
        doorMaterial: "mdf",
        doorColor: "#ffffff",
        showDoors: true,
        isGlassDoor: false,
        isFrostedGlass: false
    };
}

/**
 * اندازه پیش‌فرض درب چهارچوب کمد
 * لولایی چپ/راست (افقی):
 *   - فقط یک سمت: عرض = خانه + ۳.۲ | ارتفاع = خانه + ۳
 *   - هر دو سمت چپ و راست با هم (افقی): عرض هر درب = (خانه + ۲) / ۲ | ارتفاع = خانه + ۳
 */
function isHorizontalClosetDoorType(type) {
    return type === "side" || type === "lift-side" || !type;
}

function cellHasBothLeftRightHorizontal(cellId) {
    if (!currentCabinetForDoor || !currentCabinetForDoor.frameCellDoors) return false;
    const cfg = normalizeClosetCellConfig(currentCabinetForDoor.frameCellDoors[cellId]);
    currentCabinetForDoor.frameCellDoors[cellId] = cfg;
    const L = cfg.sides.left;
    const R = cfg.sides.right;
    if (!L || !R || L.enabled !== true || R.enabled !== true) return false;
    return isHorizontalClosetDoorType(L.doorType) && isHorizontalClosetDoorType(R.doorType);
}

function getClosetSideDefaultDoorSizes(cell, side, doorType, doorCount, bothLeftRight) {
    if (!cell) return null;
    const OVERLAP = 1.6; // ۱۶ میل
    const type = doorType || "side";
    const count = Math.max(1, doorCount || 1);

    // هر دو جهت چپ و راست فعال + درب افقی → (عرض داخلی + ۲) / ۲ منهای ۰.۱ بادخور بین درب‌ها
    if ((side === "left" || side === "right") && bothLeftRight && isHorizontalClosetDoorType(type)) {
        const eachW = (cell.w + 2) / 2 - 0.1; // یک میل بادخور از هر درب
        return Array.from({ length: count }, () => ({
            w: +eachW.toFixed(1),
            h: +(cell.h + 3).toFixed(1),
            isAutoSize: true
        }));
    }

    // فقط یک سمت چپ/راست — درب افقی یک‌تایی
    if ((side === "left" || side === "right") && isHorizontalClosetDoorType(type) && count === 1) {
        return [{
            w: +(cell.w + OVERLAP * 2).toFixed(1), // +۳.۲
            h: +(cell.h + 3).toFixed(1),
            isAutoSize: true
        }];
    }
    // بالا/پایین
    if ((side === "top" || side === "bottom") && count === 1) {
        return [{
            w: +(cell.w + 3).toFixed(1),
            h: +(cell.h + OVERLAP * 2).toFixed(1),
            isAutoSize: true
        }];
    }
    // چند درب روی یک سمت
    if (side === "left" || side === "right") {
        const totalW = cell.w + OVERLAP * 2;
        const eachW = totalW / count;
        return Array.from({ length: count }, () => ({
            w: +eachW.toFixed(1),
            h: +(cell.h + 3).toFixed(1),
            isAutoSize: true
        }));
    }
    const totalH = cell.h + OVERLAP * 2;
    const eachH = totalH / count;
    return Array.from({ length: count }, () => ({
        w: +(cell.w + 3).toFixed(1),
        h: +eachH.toFixed(1),
        isAutoSize: true
    }));
}

function applyClosetSideDefaultSizesIfNeeded(sideCfg, side, force) {
    if (!sideCfg || !selectedClosetFrameCellId) return;
    const cells = (cachedClosetFrameCells && cachedClosetFrameCells.length)
        ? cachedClosetFrameCells
        : detectClosetFrameCells(currentCabinetForDoor);
    const cell = cells.find(c => c.id === selectedClosetFrameCellId);
    if (!cell) return;

    const bothLR = cellHasBothLeftRightHorizontal(selectedClosetFrameCellId);

    // اگر کاربر دستی اندازه عوض کرده (isAutoSize === false) هرگز overwrite نکن
    const hasManual = sideCfg.doorSizes && sideCfg.doorSizes.length &&
        sideCfg.doorSizes.some(s => s && s.isAutoSize === false);
    if (hasManual) return;

    const needsInit = !sideCfg.doorSizes ||
        !sideCfg.doorSizes.length ||
        sideCfg.doorSizes.every(s => s && s.isAutoSize !== false) ||
        force === true;

    // force فقط وقتی مجاز است که هنوز manual نباشد (بالا چک شد)
    if (!needsInit && force !== true) return;
    if (!sideCfg.doorSizes || !sideCfg.doorSizes.length || force === true) {
        sideCfg.doorSizes = getClosetSideDefaultDoorSizes(
            cell,
            side,
            sideCfg.doorType || "side",
            sideCfg.doors || 1,
            bothLR
        );
    } else if (sideCfg.doorSizes.every(s => s && s.isAutoSize !== false)) {
        sideCfg.doorSizes = getClosetSideDefaultDoorSizes(
            cell,
            side,
            sideCfg.doorType || "side",
            sideCfg.doors || 1,
            bothLR
        );
    }

    // اگر جفت چپ/راست است، سمت دیگر هم با همان فرمول به‌روز شود (فقط auto)
    if (bothLR && (side === "left" || side === "right")) {
        const otherSide = side === "left" ? "right" : "left";
        const otherCfg = getClosetCellSideConfig(selectedClosetFrameCellId, otherSide);
        if (otherCfg && otherCfg.enabled) {
            const otherManual = otherCfg.doorSizes && otherCfg.doorSizes.length &&
                otherCfg.doorSizes.some(s => s && s.isAutoSize === false);
            if (!otherManual) {
                otherCfg.doorSizes = getClosetSideDefaultDoorSizes(
                    cell,
                    otherSide,
                    otherCfg.doorType || "side",
                    otherCfg.doors || 1,
                    true
                );
            }
        }
    }
}

/** config سطح بخش (نه جهت) */
function createEmptyClosetCellConfig() {
    return {
        enabled: false,
        doorType: "side",
        doors: 1,
        doorSizes: null,
        doorDirections: null,
        comboLayout: "left-big",
        jakiGhadiLayout: "top",
        doorMaterial: "mdf",
        doorColor: "#ffffff",
        showDoors: true,
        isGlassDoor: false,
        isFrostedGlass: false,
        sides: {
            left: createEmptyClosetSideConfig(),
            right: createEmptyClosetSideConfig(),
            top: createEmptyClosetSideConfig(),
            bottom: createEmptyClosetSideConfig()
        }
    };
}

/**
 * نرمال‌سازی config خانه — سطح بخش + سازگاری با sides قدیمی
 * فعال‌سازی حالا روی خود بخش است نه روی ۴ جهت
 */
function normalizeClosetCellConfig(cfg) {
    if (!cfg) return createEmptyClosetCellConfig();

    // اگر از قبل سطح بخش دارد
    if (typeof cfg.enabled === "boolean" && cfg.doorType !== undefined) {
        if (!cfg.sides) {
            cfg.sides = {
                left: createEmptyClosetSideConfig(),
                right: createEmptyClosetSideConfig(),
                top: createEmptyClosetSideConfig(),
                bottom: createEmptyClosetSideConfig()
            };
        }
        CLOSET_CELL_SIDE_ORDER.forEach(s => {
            if (!cfg.sides[s]) cfg.sides[s] = createEmptyClosetSideConfig();
        });
        return cfg;
    }

    // مهاجرت از ساختار sides (نسخه قبلی UI چهارجهتی)
    if (cfg.sides && typeof cfg.sides === "object") {
        const out = createEmptyClosetCellConfig();
        out.sides = cfg.sides;
        CLOSET_CELL_SIDE_ORDER.forEach(s => {
            if (!out.sides[s]) out.sides[s] = createEmptyClosetSideConfig();
        });
        const active = CLOSET_CELL_SIDE_ORDER.find(s => out.sides[s] && out.sides[s].enabled === true);
        if (active) {
            const src = out.sides[active];
            out.enabled = true;
            out.doorType = src.doorType || "side";
            out.doors = src.doors || 1;
            out.doorSizes = src.doorSizes ? JSON.parse(JSON.stringify(src.doorSizes)) : null;
            out.doorDirections = src.doorDirections ? [...src.doorDirections] : null;
            out.doorMaterial = src.doorMaterial || "mdf";
            out.doorColor = src.doorColor || "#ffffff";
            out.showDoors = src.showDoors !== false;
            out.isGlassDoor = !!src.isGlassDoor;
            out.isFrostedGlass = !!src.isFrostedGlass;
            // اگر چپ و راست هر دو فعال بودند → دو درب افقی
            if (out.sides.left && out.sides.left.enabled && out.sides.right && out.sides.right.enabled) {
                out.doors = 2;
                out.doorDirections = ["left", "right"];
            }
        }
        return out;
    }

    // مهاجرت از فرمت خیلی قدیمی
    const out = createEmptyClosetCellConfig();
    if (cfg.enabled === true) {
        out.enabled = true;
        out.doorType = cfg.doorType || "side";
        out.doors = cfg.doors || 1;
        out.doorSizes = cfg.doorSizes ? JSON.parse(JSON.stringify(cfg.doorSizes)) : null;
        out.doorDirections = cfg.doorDirections ? [...cfg.doorDirections] : null;
        out.doorMaterial = cfg.doorMaterial || "mdf";
        out.doorColor = cfg.doorColor || "#ffffff";
        out.showDoors = cfg.showDoors !== false;
        out.isGlassDoor = !!cfg.isGlassDoor;
        out.isFrostedGlass = !!cfg.isFrostedGlass;
    }
    return out;
}

/** از config سطح بخش، sides را برای رندر ۳D همگام کن */
function syncClosetCellSidesFromCell(cfg) {
    if (!cfg) return;
    if (!cfg.sides) {
        cfg.sides = {
            left: createEmptyClosetSideConfig(),
            right: createEmptyClosetSideConfig(),
            top: createEmptyClosetSideConfig(),
            bottom: createEmptyClosetSideConfig()
        };
    }
    CLOSET_CELL_SIDE_ORDER.forEach(s => {
        if (!cfg.sides[s]) cfg.sides[s] = createEmptyClosetSideConfig();
        cfg.sides[s].enabled = false;
        cfg.sides[s].showDoors = false;
    });
    if (!cfg.enabled) return;

    const type = cfg.doorType || "side";
    const count = Math.max(1, cfg.doors || 1);
    const dirs = (cfg.doorDirections && cfg.doorDirections.length)
        ? cfg.doorDirections
        : null;

    // ریلی روی سطح بخش رندر می‌شود — sides لازم نیست
    if (type === "sliding") return;

    const applySide = (side, doorIndex) => {
        const sc = cfg.sides[side];
        if (!sc) return;
        sc.enabled = true;
        sc.showDoors = cfg.showDoors !== false;
        sc.doorType = type;
        sc.doors = 1;
        sc.doorMaterial = cfg.doorMaterial;
        sc.doorColor = cfg.doorColor;
        sc.isGlassDoor = cfg.isGlassDoor;
        sc.isFrostedGlass = cfg.isFrostedGlass;
        // برای جفت، هر سمت یک درب با اندازه همان ایندکس
        if (cfg.doorSizes && cfg.doorSizes[doorIndex]) {
            sc.doorSizes = [JSON.parse(JSON.stringify(cfg.doorSizes[doorIndex]))];
        } else if (cfg.doorSizes && cfg.doorSizes.length === 1) {
            sc.doorSizes = [JSON.parse(JSON.stringify(cfg.doorSizes[0]))];
        } else {
            sc.doorSizes = cfg.doorSizes ? JSON.parse(JSON.stringify(cfg.doorSizes)) : null;
        }
        sc.doorDirections = [side];
    };

    // دو درب افقی → چپ و راست
    if (isHorizontalClosetDoorType(type) && count >= 2) {
        applySide("left", 0);
        applySide("right", 1);
        return;
    }

    // یک درب: بر اساس جهت باز شدن
    let hinge = "left";
    if (dirs && dirs[0]) {
        const d = dirs[0];
        if (d === "left" || d === "right" || d === "top" || d === "bottom") hinge = d;
        else if (d === "rtl" || d === "right-to-left") hinge = "right";
        else if (d === "ltr" || d === "left-to-right") hinge = "left";
        else if (d === "up" || d === "top") hinge = "top";
        else if (d === "down" || d === "bottom") hinge = "bottom";
    }
    applySide(hinge, 0);
}

function getClosetCellConfig(cellId) {
    if (!currentCabinetForDoor || !currentCabinetForDoor.frameCellDoors) return null;
    let cfg = normalizeClosetCellConfig(currentCabinetForDoor.frameCellDoors[cellId]);
    currentCabinetForDoor.frameCellDoors[cellId] = cfg;
    return cfg;
}

function getClosetCellSideConfig(cellId, side) {
    const cfg = getClosetCellConfig(cellId);
    if (!cfg) return null;
    if (!side) return cfg;
    return cfg.sides[side] || null;
}

/** آیا روکوب فعال روی چهارچوب فعلی هست؟ */
function closetUnitHasActiveRokoob(unit) {
    const u = unit || currentCabinetForDoor;
    if (!u || !u.rokoobParts) return false;
    return u.rokoobParts.some(rp => {
        if (!rp || !rp.directions) return false;
        return Object.keys(rp.directions).some(d => rp.directions[d] && rp.directions[d].enabled === true);
    });
}

/**
 * ضخامت روکوب در جهات نما (هم‌تراز با view3d.getClosetRokoobInsets)
 */
function getClosetRokoobInsets(unit) {
    if (window.Kitchen3D && typeof window.Kitchen3D.getClosetRokoobInsets === "function") {
        return window.Kitchen3D.getClosetRokoobInsets(unit || currentCabinetForDoor);
    }
    const out = { left: 0, right: 0, top: 0, bottom: 0, front: 0 };
    const u = unit || currentCabinetForDoor;
    if (!u || !u.rokoobParts) return out;
    const parts = u.parts || [];
    const thick = (d) => {
        if (!d || d.enabled !== true) return 0;
        const t = parseFloat(d.thickness);
        return isNaN(t) ? 1.6 : t;
    };
    u.rokoobParts.forEach(rp => {
        if (!rp || !rp.directions) return;
        const fp = parts.find(p => p.id === rp.partId);
        const orient = fp ? fp.orientation : "vertical";
        const d = rp.directions;
        if (orient === "horizontal") {
            out.front = Math.max(out.front, thick(d.left));
            out.top = Math.max(out.top, thick(d.top));
            out.bottom = Math.max(out.bottom, thick(d.bottom));
        } else {
            out.front = Math.max(out.front, thick(d.top));
            out.left = Math.max(out.left, thick(d.left));
            out.right = Math.max(out.right, thick(d.right));
        }
    });
    if (out.front > 0 && out.left === 0 && out.right === 0) {
        out.left = out.front;
        out.right = out.front;
    }
    return out;
}

/**
 * اندازه پیش‌فرض سطح بخش
 * ریلی:
 *   عرض = (خانه − روکوب‌چپ − روکوب‌راست) / تعداد
 *   ارتفاع = خانه − ۲.۵ − روکوب‌بالا − روکوب‌پایین
 */
function getClosetCellDefaultDoorSizes(cell, doorType, doorCount) {
    if (!cell) return null;
    const OVERLAP = 1.6;
    const type = doorType || "side";
    const count = Math.max(1, doorCount || 1);

    // درب ریلی
    if (type === "sliding") {
        const rollerClear = 2.5; // غلطک بالا و پایین
        const rok = getClosetRokoobInsets();
        const usableW = Math.max(cell.w - (rok.left || 0) - (rok.right || 0), 1);
        const usableH = Math.max(cell.h - rollerClear - (rok.top || 0) - (rok.bottom || 0), 1);
        const eachW = Math.max(usableW / count, 1);
        return Array.from({ length: count }, () => ({
            w: +eachW.toFixed(1),
            h: +usableH.toFixed(1),
            isAutoSize: true
        }));
    }

    // دو (یا بیشتر) درب افقی روی بخش: (عرض+۲)/۲ − ۰.۱
    if (isHorizontalClosetDoorType(type) && count >= 2) {
        const eachW = (cell.w + 2) / 2 - 0.1;
        return Array.from({ length: count }, () => ({
            w: +eachW.toFixed(1),
            h: +(cell.h + 3).toFixed(1),
            isAutoSize: true
        }));
    }
    // یک درب افقی
    if (isHorizontalClosetDoorType(type)) {
        return [{
            w: +(cell.w + OVERLAP * 2).toFixed(1),
            h: +(cell.h + 3).toFixed(1),
            isAutoSize: true
        }];
    }
    // سایر انواع
    return Array.from({ length: count }, () => ({
        w: +(cell.w + OVERLAP * 2).toFixed(1),
        h: +(cell.h + 3).toFixed(1),
        isAutoSize: true
    }));
}

function applyClosetCellDefaultSizesIfNeeded(cfg, force) {
    if (!cfg || !selectedClosetFrameCellId) return;
    const cells = (cachedClosetFrameCells && cachedClosetFrameCells.length)
        ? cachedClosetFrameCells
        : detectClosetFrameCells(currentCabinetForDoor);
    const cell = cells.find(c => c.id === selectedClosetFrameCellId);
    if (!cell) return;

    const hasManual = cfg.doorSizes && cfg.doorSizes.length &&
        cfg.doorSizes.some(s => s && s.isAutoSize === false);
    if (hasManual) return;

    if (force || !cfg.doorSizes || !cfg.doorSizes.length ||
        cfg.doorSizes.every(s => s && s.isAutoSize !== false)) {
        cfg.doorSizes = getClosetCellDefaultDoorSizes(cell, cfg.doorType || "side", cfg.doors || 1);
    }
}

function cellHasAnyDoor(cfg) {
    const n = normalizeClosetCellConfig(cfg);
    return CLOSET_CELL_SIDE_ORDER.some(s => n.sides[s] && n.sides[s].enabled === true);
}

/**
 * تشخیص خودکار خانه‌های باز چهارچوب
 * تقسیم‌کننده ناقص فقط همان ناحیه را جدا می‌کند؛ سمتی که تیر کامل ندارد نصف نمی‌شود.
 */
function detectClosetFrameCells(unit) {
    const FRAME_T = 5.5;
    const parts = (unit && unit.parts) ? unit.parts : [];
    if (parts.length === 0) return [];

    const verts = parts
        .filter(p => p.orientation === "vertical")
        .map(p => ({
            id: p.id,
            x1: p.x,
            x2: p.x + FRAME_T,
            y1: p.y,
            y2: p.y + p.length
        }));

    const hors = parts
        .filter(p => p.orientation === "horizontal")
        .map(p => ({
            id: p.id,
            y1: p.y,
            y2: p.y + FRAME_T,
            x1: p.x,
            x2: p.x + p.length
        }));

    if (verts.length < 2 || hors.length < 2) return [];

    const overlapLen = (a1, a2, b1, b2) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
    const coversRange = (a1, a2, b1, b2, ratio) => {
        const need = (b2 - b1) * (ratio || 0.7);
        return overlapLen(a1, a2, b1, b2) >= need - 0.05;
    };

    const cells = [];

    // هر جفت تیر عمودی (چپ/راست) × هر جفت تیر افقی (پایین/بالا)
    for (let li = 0; li < verts.length; li++) {
        for (let ri = 0; ri < verts.length; ri++) {
            if (li === ri) continue;
            const L = verts[li];
            const R = verts[ri];
            if (R.x1 <= L.x2 + 0.5) continue; // راست باید واقعاً سمت راست باشد

            for (let bi = 0; bi < hors.length; bi++) {
                for (let ti = 0; ti < hors.length; ti++) {
                    if (bi === ti) continue;
                    const B = hors[bi];
                    const T = hors[ti];
                    if (T.y1 <= B.y2 + 0.5) continue;

                    const x1 = L.x2;
                    const x2 = R.x1;
                    const y1 = B.y2;
                    const y2 = T.y1;
                    const w = x2 - x1;
                    const h = y2 - y1;
                    if (w < 2 || h < 2) continue;

                    // ضلع‌ها باید بازه خانه را بپوشانند
                    if (!coversRange(L.y1, L.y2, y1, y2, 0.7)) continue;
                    if (!coversRange(R.y1, R.y2, y1, y2, 0.7)) continue;
                    if (!coversRange(B.x1, B.x2, x1, x2, 0.7)) continue;
                    if (!coversRange(T.x1, T.x2, x1, x2, 0.7)) continue;

                    // داخل خانه نباید تیر دیگری از وسط رد شده باشد
                    const vertBlocking = verts.some(v => {
                        if (v.id === L.id || v.id === R.id) return false;
                        // تیر عمودی داخل عرض خانه
                        const midX = (v.x1 + v.x2) / 2;
                        if (midX <= x1 + 0.5 || midX >= x2 - 0.5) return false;
                        // و ارتفاع خانه را قطع کند
                        return overlapLen(v.y1, v.y2, y1, y2) > h * 0.4;
                    });
                    if (vertBlocking) continue;

                    const horBlocking = hors.some(hSeg => {
                        if (hSeg.id === B.id || hSeg.id === T.id) return false;
                        const midY = (hSeg.y1 + hSeg.y2) / 2;
                        if (midY <= y1 + 0.5 || midY >= y2 - 0.5) return false;
                        return overlapLen(hSeg.x1, hSeg.x2, x1, x2) > w * 0.4;
                    });
                    if (horBlocking) continue;

                    cells.push({
                        id: `cell_${Math.round(x1)}_${Math.round(y1)}`,
                        x: x1,
                        y: y1,
                        w,
                        h,
                        label: "",
                        leftBeamId: L.id,
                        rightBeamId: R.id,
                        bottomBeamId: B.id,
                        topBeamId: T.id
                    });
                }
            }
        }
    }

    // حذف خانه‌های تکراری / تو در تو (بزرگ‌ترهایی که خانه کوچک‌تر داخلشان است نگه داشته نمی‌شوند اگر هم‌مرز باشند)
    // اول یکتا بر اساس id
    const unique = [];
    const seen = new Set();
    cells.forEach(c => {
        if (seen.has(c.id)) return;
        seen.add(c.id);
        unique.push(c);
    });

    // حذف خانه‌ای که کاملاً خانه دیگری را با همان مرز در بر می‌گیرد و بزرگ‌تر است — فقط کوچک‌ترین‌ها
    // (اگر خانه‌ای داخل دیگری است و مساحتش کمتر است، بزرگ را حذف کن)
    const filtered = unique.filter((c, idx) => {
        const containsSmaller = unique.some((o, j) => {
            if (idx === j) return false;
            const inside =
                o.x >= c.x - 0.5 && o.y >= c.y - 0.5 &&
                o.x + o.w <= c.x + c.w + 0.5 &&
                o.y + o.h <= c.y + c.h + 0.5 &&
                (o.w * o.h) < (c.w * c.h) - 1;
            return inside;
        });
        return !containsSmaller;
    });

    if (filtered.length === 0) return [];

    // برچسب موقعیت
    const minCellX = Math.min(...filtered.map(c => c.x));
    const maxCellX = Math.max(...filtered.map(c => c.x + c.w));
    const minCellY = Math.min(...filtered.map(c => c.y));
    const maxCellY = Math.max(...filtered.map(c => c.y + c.h));
    const midX = (minCellX + maxCellX) / 2;
    const midY = (minCellY + maxCellY) / 2;

    filtered.forEach(c => {
        const cx = c.x + c.w / 2;
        const cy = c.y + c.h / 2;
        const colLabel = filtered.length === 1 ? "" :
            (cx < midX - 1 ? "چپ" : (cx > midX + 1 ? "راست" : "وسط"));
        const rowLabel = filtered.length === 1 ? "" :
            (cy < midY - 1 ? "پایین" : (cy > midY + 1 ? "بالا" : "وسط"));
        if (colLabel && rowLabel) c.label = `${rowLabel} ${colLabel}`;
        else if (colLabel) c.label = colLabel;
        else if (rowLabel) c.label = rowLabel;
        else c.label = "بخش";
    });

    filtered.sort((a, b) => {
        const ay = a.y + a.h / 2;
        const by = b.y + b.h / 2;
        if (Math.abs(by - ay) > 2) return by - ay;
        return a.x - b.x;
    });

    const labelCount = {};
    filtered.forEach(c => { labelCount[c.label] = (labelCount[c.label] || 0) + 1; });
    const labelIndex = {};
    filtered.forEach(c => {
        if (labelCount[c.label] > 1) {
            labelIndex[c.label] = (labelIndex[c.label] || 0) + 1;
            c.label = `${c.label} (${labelIndex[c.label]})`;
        }
    });

    return filtered;
}

function openClosetDoorEditorPanel() {
  const units = window.closetFrameUnits || [];
  const targetUnit = units.find((u) => u.id === window.selectedClosetFrameId);

  if (!targetUnit) {
    alert("لطفاً ابتدا یک چهارچوب کمد دیواری را از روی صحنه انتخاب کنید.");
    return;
  }

  currentCabinetForDoor = targetUnit;
  currentCabinetForDoor.width = currentCabinetForDoor.w;
  currentCabinetForDoor.height = currentCabinetForDoor.h;
  if (!currentCabinetForDoor.framePartDoors) currentCabinetForDoor.framePartDoors = {};
  if (!currentCabinetForDoor.frameCellDoors) currentCabinetForDoor.frameCellDoors = {};

  selectedClosetFramePartId = null;
  selectedClosetFrameCellId = null;
  selectedClosetFrameCellSide = null;
  cachedClosetFrameCells = detectClosetFrameCells(targetUnit);

  const editorPanel = document.getElementById("door-editor-panel");
  if (editorPanel) editorPanel.classList.add("active");

  const typeCountCard = document.getElementById("door-panel-type")?.closest(".door-panel-card");
  if (typeCountCard) typeCountCard.style.display = "none";
  const comboWrapper = document.getElementById("combo-layout-wrapper");
  if (comboWrapper) comboWrapper.style.display = "none";
  const jakiWrapper = document.getElementById("jaki-ghadi-layout-wrapper");
  if (jakiWrapper) jakiWrapper.style.display = "none";
  const fixedPanelWrapper = document.getElementById("fixed-panel-wrapper");
  if (fixedPanelWrapper) fixedPanelWrapper.style.display = "none";
  // جهت باز شدن برای چهارچوب کمد فعال است
  const directionsWrapper = document.getElementById("door-directions-wrapper");
  if (directionsWrapper) {
    directionsWrapper.style.display = "";
  }

  populateDoorTypeOptions("closet");
  const typeSelect = document.getElementById("door-panel-type");
  if (typeSelect) typeSelect.disabled = false;

  // مخفی کردن لیست ۴ جهت قدیمی
  const sidesWrapper = document.getElementById("closet-frame-cell-sides-wrapper");
  if (sidesWrapper) sidesWrapper.style.display = "none";

  renderClosetFramePartsList();
  if (typeof renderClosetDrawerFrontsMaterialSection === "function") {
    renderClosetDrawerFrontsMaterialSection();
  }
  updateDoorPreviewFromPanel();
}

function renderClosetFramePartsList() {
    const wrapper = document.getElementById("closet-frame-parts-wrapper");
    const listContainer = document.getElementById("closet-frame-parts-list");
    if (!wrapper || !listContainer || !currentCabinetForDoor || !currentCabinetForDoor.parts) return;

    wrapper.style.display = "block";
    listContainer.innerHTML = "";

    // لیست ۴ جهت دیگر استفاده نمی‌شود
    const sidesWrapper = document.getElementById("closet-frame-cell-sides-wrapper");
    if (sidesWrapper) sidesWrapper.style.display = "none";

    if (!cachedClosetFrameCells || cachedClosetFrameCells.length === 0) {
        cachedClosetFrameCells = detectClosetFrameCells(currentCabinetForDoor);
    }

    if (cachedClosetFrameCells.length === 0) {
        listContainer.innerHTML = `<div style="color:#64748b; font-size:12px; padding:8px;">خانه‌ای تشخیص داده نشد. حداقل دو قطعه عمودی و دو قطعه افقی لازم است.</div>`;
        return;
    }

    if (!currentCabinetForDoor.frameCellDoors) currentCabinetForDoor.frameCellDoors = {};

    cachedClosetFrameCells.forEach(cell => {
        const isSelected = selectedClosetFrameCellId === cell.id;
        const cfg = getClosetCellConfig(cell.id);
        const isOn = !!(cfg && cfg.enabled === true);
        const sizeHint = `${Math.round(cell.w)}×${Math.round(cell.h)} cm`;

        const item = document.createElement("div");
        item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; margin-bottom:4px; border-radius:999px; cursor:pointer; border:1px solid " + (isSelected ? "#0ea5e9" : "#334155") + "; background:" + (isSelected ? "rgba(14,165,233,0.15)" : "transparent") + ";";

        const left = document.createElement("span");
        left.innerHTML = `<strong>${cell.label}</strong><span style="font-size:11px; color:#64748b; margin-right:6px;">(${sizeHint})</span>`;
        item.appendChild(left);

        const right = document.createElement("div");
        right.style.cssText = "display:flex; align-items:center; gap:8px;";

        const drawersMap = currentCabinetForDoor.frameCellDrawers || {};
        let dCfgBadge = drawersMap[cell.id];
        if (dCfgBadge && typeof window.normalizeKeshoDrawerCfg === "function") {
            dCfgBadge = window.normalizeKeshoDrawerCfg(dCfgBadge);
        }
        const hasDrawerBadge = !!(dCfgBadge && dCfgBadge.enabled === true);
        const status = document.createElement("span");
        status.style.cssText = "font-size:11px; display:flex; gap:6px; flex-wrap:wrap;";
        const doorBadge = document.createElement("span");
        doorBadge.style.color = isOn ? "#22c55e" : "#94a3b8";
        doorBadge.textContent = isOn ? "درب" : "بدون درب";
        status.appendChild(doorBadge);
        if (hasDrawerBadge) {
            const db = document.createElement("span");
            db.style.color = "#38bdf8";
            db.textContent = "کشو";
            status.appendChild(db);
        }
        right.appendChild(status);

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.textContent = isOn ? "غیرفعال" : "فعال";
        toggleBtn.style.cssText = "height:28px; padding:0 12px; border-radius:999px; border:1px solid " +
            (isOn ? "#22c55e" : "#334155") + "; background:" +
            (isOn ? "#22c55e" : "transparent") + "; color:" +
            (isOn ? "#fff" : "#94a3b8") + "; font-size:11px; cursor:pointer;";
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            toggleClosetCellEnabled(cell.id);
        };
        right.appendChild(toggleBtn);

        item.appendChild(right);
        item.onclick = () => selectClosetFrameCell(cell.id);
        listContainer.appendChild(item);
    });
}

function renderClosetFrameCellSidesList() {
    // دیگر استفاده نمی‌شود — جهت‌ها حذف شدند
    const sidesWrapper = document.getElementById("closet-frame-cell-sides-wrapper");
    if (sidesWrapper) sidesWrapper.style.display = "none";
}


/** لیست جبهه‌های کشوی بخش انتخاب‌شده کمد */
function getClosetSelectedDrawerFronts() {
    if (!currentCabinetForDoor || !selectedClosetFrameCellId) return [];
    let dCfg = (currentCabinetForDoor.frameCellDrawers || {})[selectedClosetFrameCellId];
    if (!dCfg || dCfg.enabled !== true) return [];
    if (typeof window.normalizeKeshoDrawerCfg === "function") {
        dCfg = window.normalizeKeshoDrawerCfg(dCfg);
    }
    const columns = Array.isArray(dCfg.columns) && dCfg.columns.length
        ? dCfg.columns
        : [{ drawerCount: dCfg.drawerCount || 1, drawersData: dCfg.drawersData || [] }];
    const colCount = Math.max(1, parseInt(dCfg.columnCount, 10) || columns.length || 1);
    const list = [];
    for (let ci = 0; ci < colCount; ci++) {
        const col = columns[ci] || { drawerCount: 1, drawersData: [] };
        const count = Math.max(1, parseInt(col.drawerCount, 10) || 1);
        if (!Array.isArray(col.drawersData)) col.drawersData = [];
        for (let di = 0; di < count; di++) {
            if (!col.drawersData[di]) {
                col.drawersData[di] = { height: 17, doorHeight: 17, depth: 45, material: "mdf", finish: "matte" };
            }
            const d = col.drawersData[di];
            const label = colCount > 1
                ? ("جبهه کشو ردیف " + (ci + 1) + " - " + (di + 1))
                : ("جبهه کشو " + (di + 1));
            list.push({ ci: ci, di: di, label: label, data: d, colCount: colCount });
        }
        columns[ci] = col;
    }
    dCfg.columns = columns;
    dCfg.drawersData = (columns[0] && columns[0].drawersData) || dCfg.drawersData;
    currentCabinetForDoor.frameCellDrawers[selectedClosetFrameCellId] = dCfg;
    return list;
}

function persistClosetDrawerFrontsToUnit() {
    if (!currentCabinetForDoor || !selectedClosetFrameCellId) return;
    const units = window.closetFrameUnits || [];
    const idx = units.findIndex(u => u.id === currentCabinetForDoor.id);
    if (idx >= 0) {
        units[idx].frameCellDrawers = currentCabinetForDoor.frameCellDrawers;
    }
    if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.refreshCabinets === "function") {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
    }
    if (typeof updateDoorPreviewFromPanel === "function") updateDoorPreviewFromPanel();
}

/** بخش جدید زیر پرداخت سطح — فقط جبهه کشوها */
function renderClosetDrawerFrontsMaterialSection() {
    const card = document.getElementById("closet-drawer-fronts-card");
    const container = document.getElementById("closet-drawer-fronts-container");
    if (!card || !container) return;

    if (!isClosetDoorMode() || !selectedClosetFrameCellId) {
        card.style.display = "none";
        container.innerHTML = "";
        return;
    }

    const fronts = getClosetSelectedDrawerFronts();
    if (!fronts.length) {
        card.style.display = "none";
        container.innerHTML = "";
        return;
    }

    card.style.display = "block";
    let html = "";
    fronts.forEach((f) => {
        const d = f.data || {};
        const mat = d.material || "mdf";
        const colorName = d.colorName || "";
        const finish = d.finish || "matte";
        const colorVal = d.color || "";
        html += `
            <div class="door-dynamic-box door-drawer-item-box" style="margin-bottom:12px;">
                <div class="door-dynamic-header door-micro-header">${f.label}</div>
                <div class="door-grid-2">
                    <div class="door-input-group no-margin">
                        <label class="door-small-label">جنس ورق</label>
                        <select class="modern-select" onchange="updateClosetDrawerFrontField(${f.ci}, ${f.di}, 'material', this.value)">
                            <option value="mdf" ${mat === 'mdf' ? 'selected' : ''}>MDF (ام دی اف)</option>
                            <option value="highGloss" ${mat === 'highGloss' ? 'selected' : ''}>High-Gloss (هایگلاس)</option>
                            <option value="leteron" ${mat === 'leteron' ? 'selected' : ''}>Leteron (لترون)</option>
                        </select>
                    </div>
                    <div class="door-input-group no-margin">
                        <label class="door-small-label">رنگ</label>
                        <div class="door-color-search-container">
                            <input type="text" id="closet-drawer-color-${f.ci}-${f.di}"
                                   onclick="openClosetDrawerFrontColorPicker(${f.ci}, ${f.di})"
                                   placeholder="انتخاب رنگ..."
                                   class="modern-input door-readonly-color-input"
                                   value="${colorName}" autocomplete="off" readonly>
                        </div>
                    </div>
                </div>
                <div class="door-input-group no-margin" style="margin-top:8px;">
                    <label class="door-small-label">پرداخت سطح</label>
                    <select class="modern-select" onchange="updateClosetDrawerFrontField(${f.ci}, ${f.di}, 'finish', this.value)">
                        <option value="matte" ${finish === 'matte' ? 'selected' : ''}>مات (Matte)</option>
                        <option value="semiMatte" ${finish === 'semiMatte' ? 'selected' : ''}>نیمه‌مات</option>
                        <option value="satin" ${finish === 'satin' ? 'selected' : ''}>ساتین</option>
                        <option value="highGloss" ${finish === 'highGloss' ? 'selected' : ''}>براق / های‌گلاس</option>
                    </select>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

function updateClosetDrawerFrontField(ci, di, field, value) {
    if (!currentCabinetForDoor || !selectedClosetFrameCellId) return;
    let dCfg = (currentCabinetForDoor.frameCellDrawers || {})[selectedClosetFrameCellId];
    if (!dCfg || !dCfg.enabled) return;
    if (typeof window.normalizeKeshoDrawerCfg === "function") dCfg = window.normalizeKeshoDrawerCfg(dCfg);
    if (!Array.isArray(dCfg.columns)) dCfg.columns = [{ drawerCount: 1, drawersData: [] }];
    if (!dCfg.columns[ci]) dCfg.columns[ci] = { drawerCount: 1, drawersData: [] };
    if (!Array.isArray(dCfg.columns[ci].drawersData)) dCfg.columns[ci].drawersData = [];
    if (!dCfg.columns[ci].drawersData[di]) dCfg.columns[ci].drawersData[di] = { height: 17, doorHeight: 17, depth: 45 };
    dCfg.columns[ci].drawersData[di][field] = value;
    dCfg.drawersData = (dCfg.columns[0] && dCfg.columns[0].drawersData) || dCfg.drawersData;
    currentCabinetForDoor.frameCellDrawers[selectedClosetFrameCellId] = dCfg;
    persistClosetDrawerFrontsToUnit();
}

function openClosetDrawerFrontColorPicker(ci, di) {
    if (!currentCabinetForDoor || !selectedClosetFrameCellId) return;
    let dCfg = (currentCabinetForDoor.frameCellDrawers || {})[selectedClosetFrameCellId];
    if (!dCfg) return;
    if (typeof window.normalizeKeshoDrawerCfg === "function") dCfg = window.normalizeKeshoDrawerCfg(dCfg);
    const col = (dCfg.columns && dCfg.columns[ci]) || { drawersData: [] };
    const d = (col.drawersData && col.drawersData[di]) || {};
    const currentMat = d.material || "mdf";
    currentColorModalTarget = { type: "closet-drawer-front", ci: ci, di: di };
    if (typeof openUniversalModal !== "function") {
        alert("انتخابگر رنگ در دسترس نیست.");
        return;
    }
    openUniversalModal("انتخاب رنگ جبهه کشو", currentMat, function(selectedColor) {
        if (!selectedColor) return;
        if (selectedColor.texture) {
            updateClosetDrawerFrontField(ci, di, "color", selectedColor.texture);
        } else {
            updateClosetDrawerFrontField(ci, di, "color", selectedColor.code || "");
        }
        updateClosetDrawerFrontField(ci, di, "colorName", selectedColor.name || "");
        const inputField = document.getElementById("closet-drawer-color-" + ci + "-" + di);
        if (inputField) inputField.value = selectedColor.name || "";
        if (typeof renderClosetDrawerFrontsMaterialSection === "function") {
            renderClosetDrawerFrontsMaterialSection();
        }
    });
}

/** افزودن بلوک ابعاد جبهه کشو به انتهای لیست ابعاد */
function appendClosetDrawerFrontDimensions() {
    if (!isClosetDoorMode() || !selectedClosetFrameCellId) return "";
    const fronts = getClosetSelectedDrawerFronts();
    if (!fronts.length) return "";
    let html = `<div style="font-size:12px;color:#38bdf8;margin:12px 0 8px;padding-top:8px;border-top:1px solid #334155;">ابعاد جبهه کشوها</div>`;
    fronts.forEach((f) => {
        const d = f.data || {};
        const w = d.w !== undefined && d.w !== null ? d.w : "";
        const h = d.doorHeight !== undefined && d.doorHeight !== null ? d.doorHeight : (d.height || "");
        html += `
        <div class="door-dynamic-box" style="margin-bottom:10px;">
            <div class="door-dynamic-header">${f.label}</div>
            <div class="door-grid-2">
                <div class="door-input-group no-margin">
                    <label class="door-small-label">عرض</label>
                    <input type="number" class="modern-input" value="${w}"
                           onchange="updateClosetDrawerFrontField(${f.ci}, ${f.di}, 'w', this.value === '' ? '' : parseFloat(this.value))">
                </div>
                <div class="door-input-group no-margin">
                    <label class="door-small-label">ارتفاع جبهه</label>
                    <input type="number" class="modern-input" value="${h}"
                           onchange="updateClosetDrawerFrontField(${f.ci}, ${f.di}, 'doorHeight', this.value === '' ? '' : parseFloat(this.value))">
                </div>
            </div>
        </div>`;
    });
    return html;
}

/** افزودن دستگیره مخفی جبهه کشو */
function appendClosetDrawerFrontHiddenHandles() {
    if (!isClosetDoorMode() || !selectedClosetFrameCellId) return "";
    const fronts = getClosetSelectedDrawerFronts();
    if (!fronts.length) return "";
    let html = `<div style="font-size:12px;color:#38bdf8;margin:12px 0 8px;padding-top:8px;border-top:1px solid #334155;">دستگیره مخفی جبهه کشوها</div>`;
    fronts.forEach((f) => {
        const d = f.data || {};
        const hhPos = d.hiddenHandlePos || "none";
        const hhMaterial = d.hiddenHandleMaterial || "mdf";
        const hhColorName = d.hiddenHandleColorName || "";
        html += `
        <div class="door-dynamic-box" style="margin-bottom:10px;">
            <div class="door-dynamic-header">دستگیره مخفی - ${f.label}</div>
            <div class="door-input-group no-margin door-input-gap-bottom">
                <label>نوع دستگیره</label>
                <select class="modern-select" onchange="updateClosetDrawerFrontField(${f.ci}, ${f.di}, 'hiddenHandlePos', this.value)">
                    <option value="none" ${hhPos === 'none' ? 'selected' : ''}>دستگیره معمولی (پیش‌فرض)</option>
                    <option value="normal-top" ${hhPos === 'normal-top' ? 'selected' : ''}>دستگیره روکار - بالا</option>
                    <option value="normal-middle" ${hhPos === 'normal-middle' ? 'selected' : ''}>دستگیره روکار - وسط</option>
                    <option value="normal-bottom" ${hhPos === 'normal-bottom' ? 'selected' : ''}>دستگیره روکار - پایین</option>
                    <option value="no-handle" ${hhPos === 'no-handle' ? 'selected' : ''}>بدون دستگیره</option>
                    <option value="top" ${hhPos === 'top' ? 'selected' : ''}>مخفی - بالا</option>
                    <option value="bottom" ${hhPos === 'bottom' ? 'selected' : ''}>مخفی - پایین</option>
                </select>
            </div>
            <div class="door-input-group no-margin">
                <label>متریال دستگیره</label>
                <select class="modern-select" onchange="updateClosetDrawerFrontField(${f.ci}, ${f.di}, 'hiddenHandleMaterial', this.value)">
                    <option value="mdf" ${hhMaterial === 'mdf' ? 'selected' : ''}>MDF</option>
                    <option value="highGloss" ${hhMaterial === 'highGloss' ? 'selected' : ''}>High-Gloss</option>
                    <option value="leteron" ${hhMaterial === 'leteron' ? 'selected' : ''}>Leteron</option>
                </select>
            </div>
        </div>`;
    });
    return html;
}

window.renderClosetDrawerFrontsMaterialSection = renderClosetDrawerFrontsMaterialSection;
window.updateClosetDrawerFrontField = updateClosetDrawerFrontField;
window.openClosetDrawerFrontColorPicker = openClosetDrawerFrontColorPicker;
window.getClosetSelectedDrawerFronts = getClosetSelectedDrawerFronts;

function selectClosetFrameCell(cellId) {
    saveCurrentPartDoorConfig();

    selectedClosetFrameCellId = cellId;
    selectedClosetFramePartId = null;
    selectedClosetFrameCellSide = null;

    if (!currentCabinetForDoor.frameCellDoors) currentCabinetForDoor.frameCellDoors = {};
    const cfg = getClosetCellConfig(cellId);

    const typeCountCard = document.getElementById("door-panel-type")?.closest(".door-panel-card");
    if (typeCountCard) typeCountCard.style.display = (cfg && cfg.enabled) ? "" : "none";

    if (cfg && cfg.enabled) {
        applyClosetCellDefaultSizesIfNeeded(cfg, false);
        syncClosetCellSidesFromCell(cfg);
        loadPartDoorConfigIntoActiveFields(cfg);
        renderDoorMaterialAndColorInputs();
        renderDoorDimensionsInputs();
        renderDoorHiddenHandleInputs();
        renderDoorDirectionSelectors();
    } else {
        // فقط کشو بدون درب بخش: ابعاد و دستگیره برای جبهه کشو
        if (typeof renderDoorDimensionsInputs === "function") renderDoorDimensionsInputs();
        if (typeof renderDoorHiddenHandleInputs === "function") renderDoorHiddenHandleInputs();
    }

    // بخش جدید جبهه کشوها — زیر پرداخت سطح؛ به کارت‌های قبلی دست نمی‌زند
    if (typeof renderClosetDrawerFrontsMaterialSection === "function") {
        renderClosetDrawerFrontsMaterialSection();
    }

    renderClosetFramePartsList();
    updateDoorPreviewFromPanel();
}

function selectClosetFrameCellSide(side) {
    // سازگاری — دیگر جهت جداگانه نداریم
    if (selectedClosetFrameCellId) selectClosetFrameCell(selectedClosetFrameCellId);
}

function toggleClosetCellEnabled(cellId) {
    if (!currentCabinetForDoor) return;
    if (selectedClosetFrameCellId && selectedClosetFrameCellId !== cellId) {
        saveCurrentPartDoorConfig();
    }
    selectedClosetFrameCellId = cellId;
    selectedClosetFrameCellSide = null;

    const cfg = getClosetCellConfig(cellId);
    if (!cfg) return;

    cfg.enabled = !cfg.enabled;
    cfg.showDoors = cfg.enabled;

    if (cfg.enabled) {
        cfg.doorType = cfg.doorType || "side";
        if (cfg.doorType === "sliding") {
            cfg.doors = Math.max(cfg.doors || 2, 2);
        } else {
            cfg.doors = cfg.doors || 1;
        }
        if (!cfg.doorDirections || !cfg.doorDirections.length) {
            cfg.doorDirections = cfg.doors >= 2 ? ["left", "right"] : ["left"];
        }
        applyClosetCellDefaultSizesIfNeeded(cfg, true);
        syncClosetCellSidesFromCell(cfg);
        loadPartDoorConfigIntoActiveFields(cfg);
    } else {
        syncClosetCellSidesFromCell(cfg);
    }

    const typeCountCard = document.getElementById("door-panel-type")?.closest(".door-panel-card");
    if (typeCountCard) typeCountCard.style.display = cfg.enabled ? "" : "none";

    renderClosetFramePartsList();
    if (cfg.enabled) {
        renderDoorMaterialAndColorInputs();
        renderDoorDimensionsInputs();
        renderDoorHiddenHandleInputs();
        renderDoorDirectionSelectors();
    } else {
        if (typeof renderDoorDimensionsInputs === "function") renderDoorDimensionsInputs();
        if (typeof renderDoorHiddenHandleInputs === "function") renderDoorHiddenHandleInputs();
    }
    if (typeof renderClosetDrawerFrontsMaterialSection === "function") {
        renderClosetDrawerFrontsMaterialSection();
    }
    updateDoorPreviewFromPanel();
    if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.refreshCabinets === "function") {
        Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
    }
}

function toggleClosetCellSideEnabled(side) {
    // سازگاری با کد قدیمی — فعال‌سازی روی بخش فعلی
    if (selectedClosetFrameCellId) toggleClosetCellEnabled(selectedClosetFrameCellId);
}
window.toggleClosetCellEnabled = toggleClosetCellEnabled;
window.toggleClosetCellSideEnabled = toggleClosetCellSideEnabled;
window.selectClosetFrameCellSide = selectClosetFrameCellSide;

// سازگاری با کدهای قبلی که selectClosetFramePart را صدا می‌زنند
function selectClosetFramePart(partId) {
    // دیگر بر اساس تیر کار نمی‌کنیم؛ نزدیک‌ترین خانه را انتخاب کن
    if (!cachedClosetFrameCells || cachedClosetFrameCells.length === 0) {
        cachedClosetFrameCells = detectClosetFrameCells(currentCabinetForDoor);
    }
    if (cachedClosetFrameCells.length > 0) {
        selectClosetFrameCell(cachedClosetFrameCells[0].id);
    }
}

function loadPartDoorConfigIntoActiveFields(cfg) {
    currentCabinetForDoor.doorType = cfg.doorType;
    currentCabinetForDoor.doors = cfg.doors;
    currentCabinetForDoor.doorSizes = cfg.doorSizes ? JSON.parse(JSON.stringify(cfg.doorSizes)) : null;
    currentCabinetForDoor.doorDirections = cfg.doorDirections ? [...cfg.doorDirections] : null;
    currentCabinetForDoor.comboLayout = cfg.comboLayout;
    currentCabinetForDoor.jakiGhadiLayout = cfg.jakiGhadiLayout;
    currentCabinetForDoor.doorMaterial = cfg.doorMaterial;
    currentCabinetForDoor.doorColor = cfg.doorColor;
    currentCabinetForDoor.showDoors = cfg.showDoors;
    currentCabinetForDoor.isGlassDoor = cfg.isGlassDoor;

    const typeSelect = document.getElementById("door-panel-type");
    if (typeSelect) {
        // اگر نوع ذخیره‌شده در لیست فعلی (مثلاً حالت کمد) نیست، اولین گزینه مجاز را بگذار
        const allowed = Array.from(typeSelect.options).map(o => o.value);
        if (allowed.includes(currentCabinetForDoor.doorType)) {
            typeSelect.value = currentCabinetForDoor.doorType;
        } else {
            typeSelect.value = allowed[0] || "lift-side";
            currentCabinetForDoor.doorType = typeSelect.value;
        }
    }
    const countInput = document.getElementById("door-panel-count");
    if (countInput) {
        const doorType = (typeSelect && typeSelect.value) || currentCabinetForDoor.doorType || "lift-side";
        const clamped = clampDoorCountValue(doorType, currentCabinetForDoor.doors || 1);
        currentCabinetForDoor.doors = clamped;
        countInput.value = clamped;
    }
    const showDoorsCheck = document.getElementById("door-panel-show-doors");
    if (showDoorsCheck) showDoorsCheck.checked = currentCabinetForDoor.showDoors !== false;
    const isGlassCheck = document.getElementById("door-panel-is-glass");
    if (isGlassCheck) isGlassCheck.checked = currentCabinetForDoor.isGlassDoor === true;
    const frostedWrapper = document.getElementById("frosted-glass-wrapper");
    if (frostedWrapper) frostedWrapper.style.display = currentCabinetForDoor.isGlassDoor ? "block" : "none";
    const isFrostedCheck = document.getElementById("door-panel-is-frosted");
    if (isFrostedCheck) isFrostedCheck.checked = currentCabinetForDoor.isFrostedGlass === true;
}

function saveCurrentPartDoorConfig() {
    // ذخیره روی بخش انتخاب‌شده (سطح cell)
    if (currentCabinetForDoor && selectedClosetFrameCellId && currentCabinetForDoor.frameCellDoors) {
        const cfg = getClosetCellConfig(selectedClosetFrameCellId);
        if (cfg) {
            cfg.doorType = currentCabinetForDoor.doorType;
            cfg.doors = currentCabinetForDoor.doors;
            cfg.doorSizes = currentCabinetForDoor.doorSizes ? JSON.parse(JSON.stringify(currentCabinetForDoor.doorSizes)) : null;
            cfg.doorDirections = currentCabinetForDoor.doorDirections ? [...currentCabinetForDoor.doorDirections] : null;
            cfg.comboLayout = currentCabinetForDoor.comboLayout;
            cfg.jakiGhadiLayout = currentCabinetForDoor.jakiGhadiLayout;
            cfg.doorMaterial = currentCabinetForDoor.doorMaterial;
            cfg.doorColor = currentCabinetForDoor.doorColor;
            cfg.showDoors = currentCabinetForDoor.showDoors;
            cfg.isGlassDoor = currentCabinetForDoor.isGlassDoor;
            cfg.isFrostedGlass = currentCabinetForDoor.isFrostedGlass;
            // همگام‌سازی sides برای رندر ۳D
            syncClosetCellSidesFromCell(cfg);
        }
    }
    // سازگاری عقب‌رو با سیستم تیر
    if (currentCabinetForDoor && selectedClosetFramePartId && currentCabinetForDoor.framePartDoors) {
        const cfg = currentCabinetForDoor.framePartDoors[selectedClosetFramePartId];
        if (cfg) {
            cfg.doorType = currentCabinetForDoor.doorType;
            cfg.doors = currentCabinetForDoor.doors;
            cfg.doorSizes = currentCabinetForDoor.doorSizes ? JSON.parse(JSON.stringify(currentCabinetForDoor.doorSizes)) : null;
            cfg.doorDirections = currentCabinetForDoor.doorDirections ? [...currentCabinetForDoor.doorDirections] : null;
            cfg.comboLayout = currentCabinetForDoor.comboLayout;
            cfg.jakiGhadiLayout = currentCabinetForDoor.jakiGhadiLayout;
            cfg.doorMaterial = currentCabinetForDoor.doorMaterial;
            cfg.doorColor = currentCabinetForDoor.doorColor;
            cfg.showDoors = currentCabinetForDoor.showDoors;
            cfg.isGlassDoor = currentCabinetForDoor.isGlassDoor;
        }
    }
}

// سازگاری با HTML/کد قدیمی
function toggleClosetPartDoorSide(side) {
    if (side === "left" || side === "right" || side === "top" || side === "bottom") {
        toggleClosetCellSideEnabled(side);
    }
}
window.toggleClosetPartDoorSide = toggleClosetPartDoorSide;

function highlightActiveSideButtons(cfg) {
    // دیگر استفاده نمی‌شود
}
// بستن پنل (ایمن‌سازی شده)
function closeDoorEditorPanel() {
  if (currentCabinetForDoor && currentCabinetForDoor.parts) saveCurrentPartDoorConfig(); // 🌟 این خط جا افتاده بود
disposeDoorPreview3D();
  const typeCountCard = document.getElementById("door-panel-type")?.closest(".door-panel-card");
  if (typeCountCard) typeCountCard.style.display = "";
  const closetWrapper = document.getElementById("closet-frame-parts-wrapper");
  if (closetWrapper) closetWrapper.style.display = "none";
  const cdfCard = document.getElementById("closet-drawer-fronts-card");
  if (cdfCard) cdfCard.style.display = "none";
  const fixedPanelWrapper = document.getElementById("fixed-panel-wrapper");
  if (fixedPanelWrapper) fixedPanelWrapper.style.display = "";
  const sideWrapper = document.getElementById("closet-frame-part-side-wrapper");
  if (sideWrapper) sideWrapper.style.display = "none";
  // بازگرداندن بخش جهت باز شدن درب برای استفاده در یونیت‌های معمولی
  const directionsWrapper = document.getElementById("door-directions-wrapper");
  if (directionsWrapper) directionsWrapper.style.display = "";
  // بازگرداندن لیست کامل نوع بازشو برای یونیت معمولی
  populateDoorTypeOptions("normal");
  selectedClosetFramePartId = null;
  selectedClosetFrameCellId = null;
  selectedClosetFrameCellSide = null;
  cachedClosetFrameCells = [];
  const panel = document.getElementById("door-editor-panel");
  if (panel) {
    panel.classList.remove("active");
  }

  const dropdown = document.getElementById("color-results-dropdown");
  if (dropdown) {
    dropdown.classList.remove("show");
  
    if (typeof closeUniversalModal === "function") {
    closeUniversalModal();
}

  }

  currentCabinetForDoor = null;
}


// تابع کمکی: پیدا کردن نام رنگ بر اساس کد یا تکسچر

function getColorNameByValue(value) {
  // تغییر وابستگی از doorColors به currentDoorMaterials
  const found = currentDoorMaterials.find(
    (item) => item.code === value || item.texture === value
  );
  return found ? found.name : "";
}
// تابع کمکی: پیدا کردن مقدار رنگ بر اساس نام

function getColorValueByName(name) {
  // تغییر وابستگی از doorColors به currentDoorMaterials
  const found = currentDoorMaterials.find((item) => item.name === name);
  return found ? found.code || found.texture : null;
}


// انتخاب رنگ (از نتایج یا جستجو)
function selectDoorColor(value, name = "") {
  if (!currentCabinetForDoor) return;

  currentCabinetForDoor.doorColor = value;
  const displayName = name || getColorNameByValue(value) || "رنگ انتخاب شده";
  document.getElementById("door-color-search").value = displayName;


  document.getElementById("color-results-dropdown").classList.remove("show");
  updateDoorPreviewFromPanel();
  draw();
}


// دکمه + و − تعداد درب
function changeDoorCount(delta) {
  const input = document.getElementById("door-panel-count");
  const doorType = document.getElementById("door-panel-type").value;
  
  const isDrawerUnit = currentCabinetForDoor && (currentCabinetForDoor.isDrawerBody || currentCabinetForDoor.isBaseWithDrawer);

  // درب کشو از پنل کشو مدیریت می‌شود — فعلاً دست نزن
  if (doorType === "drawer" || (isDrawerUnit && !currentCabinetForDoor.isBaseWithDrawer)) {
      return; 
  }

  let val = parseInt(input.value) || 1;
  let newVal = val + delta;

  if (isClosetDoorMode()) {
    newVal = clampDoorCountValue(doorType, newVal);
  } else if (doorType === "combo") {
    newVal = Math.max(3, Math.min(4, newVal)); 
  } else if (doorType === "jaki-ghadi") {
    newVal = 3; 
  } else if (doorType === "drawer-ghadi" || (isDrawerUnit && currentCabinetForDoor.isBaseWithDrawer)) {
    newVal = Math.max(2, Math.min(3, newVal)); 
  } else if (doorType === "lift") {
    newVal = Math.max(1, Math.min(2, newVal)); 
  } else if (doorType === "lift-side") {
    newVal = 2; 
  } else if (doorType === "split"){
    newVal = Math.max(2, Math.min(3, newVal));
  } else {
    newVal = Math.max(1, Math.min(4, newVal)); 
  }

  input.value = newVal;
  if (currentCabinetForDoor) {
    // 🌟 [اصلاحیه کلیدی ۴] - ریست کردن آرایه ابعاد به محض کلیک روی دکمه‌های + یا - تعداد درب‌ها
    currentCabinetForDoor.doorSizes = null;
    currentCabinetForDoor.doors = newVal;

    if (isClosetDoorMode() && selectedClosetFrameCellId) {
      const cfg = getClosetCellConfig(selectedClosetFrameCellId);
      if (cfg) {
        cfg.doors = newVal;
        cfg.doorType = doorType;
        cfg.doorSizes = null; // ریست برای محاسبه مجدد auto
        if (newVal >= 2 && isHorizontalClosetDoorType(doorType)) {
          cfg.doorDirections = ["left", "right"];
        }
        applyClosetCellDefaultSizesIfNeeded(cfg, true);
        syncClosetCellSidesFromCell(cfg);
        currentCabinetForDoor.doorSizes = cfg.doorSizes
          ? JSON.parse(JSON.stringify(cfg.doorSizes))
          : null;
      }
    }

    renderDoorDirectionSelectors();
    renderDoorDimensionsInputs();
    renderDoorHiddenHandleInputs();
    updateDoorPreviewFromPanel();
    draw();
    if (typeof drawFrontElevation === 'function') drawFrontElevation();
  }
}







// اعمال نهایی
function applyDoorSettingsFromPanel() {
  if (!currentCabinetForDoor) return;

  // استفاده از سوییچ‌های امن برای جلوگیری از ارور null در زمان خواندن مقادیر فیلدها
  const typeEl = document.getElementById("door-panel-type");
  const materialEl = document.getElementById("door-panel-material");
  const countEl = document.getElementById("door-panel-count");
  const showDoorsEl = document.getElementById("door-panel-show-doors");
  const isGlassEl = document.getElementById("door-panel-is-glass");

  // ذخیره تنظیمات با بررسی وجود المان (اگر المان لود نشده باشد، مقدار قبلی حفظ می‌شود)
  if (typeEl) currentCabinetForDoor.doorType = typeEl.value;
  if (materialEl) currentCabinetForDoor.doorMaterial = materialEl.value;
  const finishEl = document.getElementById("door-panel-finish");
  if (finishEl) currentCabinetForDoor.doorFinish = finishEl.value;
  if (countEl) currentCabinetForDoor.doors = parseInt(countEl.value) || 2;
  if (showDoorsEl) currentCabinetForDoor.showDoors = showDoorsEl.checked;
  
// ------------ وضعیت درب شیشه ای ------------
  if (isGlassEl) currentCabinetForDoor.isGlassDoor = isGlassEl.checked;
  // -------------------------------------------

 if (currentCabinetForDoor.parts) saveCurrentPartDoorConfig(); // 🌟 فقط برای حالت کمد دیواری

  draw();
if (typeof drawFrontElevation === 'function') drawFrontElevation();
  // بروزرسانی 3D اگر باز باشه
  if (
    typeof Kitchen3D !== "undefined" &&
    Kitchen3D.scene &&
    document.getElementById("modal-3d-container")?.style.display === "flex"
  ) {
    if (currentCabinetForDoor.parts && typeof Kitchen3D.renderClosetFrameUnit === "function") {
      // 🌟 حالت چهارچوب کمد دیواری: کل چهارچوب رو بازسازی کن تا درب جدید روش دیده بشه
      Kitchen3D.renderClosetFrameUnit();
    } else {
      Kitchen3D.refreshCabinets(typeof currentCabinetForDoor !== 'undefined' && currentCabinetForDoor ? currentCabinetForDoor.id : undefined);
    }
  }

  closeDoorEditorPanel();
}

// ============================================================
// 🌟 پیش‌نمایش زنده سه‌بعدی (با فراخوانی مستقیم موتور رندر واقعی)
// ============================================================
let doorPreview3D = { scene: null, camera: null, renderer: null, group: null, animId: null };

function initDoorPreview3D() {
    const canvas = document.getElementById("door-panel-3d-canvas");
    if (!canvas) return;

    // r186: THREE از three-bridge می‌آید
    if (typeof THREE === "undefined") {
        if (typeof window.whenThreeReady === "function") {
            window.whenThreeReady(function () { initDoorPreview3D(); });
        } else {
            window.addEventListener("three-ready", function onThreeReady() {
                window.removeEventListener("three-ready", onThreeReady);
                initDoorPreview3D();
            });
        }
        return;
    }
    if (doorPreview3D.renderer) return; // جلوگیری از ساخت دوباره

    doorPreview3D.scene = new THREE.Scene();
    doorPreview3D.scene.background = new THREE.Color(0x0f172a);

    doorPreview3D.camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 2000);
    doorPreview3D.camera.position.set(0, 0, 300);
    doorPreview3D.camera.lookAt(0, 0, 0);

    // Renderer r186 — ظاهر preview بدون تغییر (همان نور/اکسپوژر قبلی)
    doorPreview3D.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    doorPreview3D.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    doorPreview3D.renderer.outputColorSpace = THREE.SRGBColorSpace; // encoding → colorSpace
    doorPreview3D.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    doorPreview3D.renderer.toneMappingExposure = 1.0;

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    doorPreview3D.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(50, 100, 200);
    doorPreview3D.scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-50, -30, 150);
    doorPreview3D.scene.add(fillLight);

    doorPreview3D.group = new THREE.Group();
    doorPreview3D.scene.add(doorPreview3D.group);

    animateDoorPreview3D();
}

function animateDoorPreview3D() {
    if (!doorPreview3D.renderer) return;
    doorPreview3D.animId = requestAnimationFrame(animateDoorPreview3D);
    doorPreview3D.renderer.render(doorPreview3D.scene, doorPreview3D.camera);
}

function disposeGroupChildren(group) {
    while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
        }
        if (child.children && child.children.length > 0) disposeGroupChildren(child);
    }
}

function updateDoorPreview3D() {
    if (!currentCabinetForDoor) return;
    if (!doorPreview3D.renderer) initDoorPreview3D();
    if (!doorPreview3D.renderer || typeof THREE === "undefined") return;

    disposeGroupChildren(doorPreview3D.group);

    const c = currentCabinetForDoor;

// 🌟 حالت اختصاصی چهارچوب کمد دیواری: نمایش کل چهارچوب (همه قطعات) + درب‌ها، با هایلایت قطعه انتخابی
    if (c.parts && c.parts.length > 0) {
        renderClosetPartDoorPreview3D(c);
    } else {
        renderStandardDoorPreview3D(c);
    }
}

function buildDoorMaterial(c) {
    // پرداخت نور جدا از جنس ورق
    const finishKey = c.doorFinish || 'matte';
    const preset = (typeof window.getKitchenFinishPreset === 'function')
        ? window.getKitchenFinishPreset(finishKey)
        : { roughness: 0.55, metalness: 0.03, envMapIntensity: 0.5, bumpScale: 0.06, clearcoat: 0 };

    const initialColor = c.doorTexture || c.doorColor || "#8B4513";
    const isTexture = typeof initialColor === 'string' && (
        initialColor.includes("http") || initialColor.includes("assets/") ||
        initialColor.includes("/") || initialColor.includes("data:image")
    );

    const params = {
        roughness: preset.roughness,
        metalness: preset.metalness,
        envMapIntensity: preset.envMapIntensity || 0.5
    };
    if (isTexture) {
        params.color = 0xffffff;
    } else if (typeof initialColor === 'string' && initialColor.startsWith('#')) {
        params.color = initialColor;
    } else {
        params.color = 0x8B4513;
    }

    let doorMat;
    if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
        params.clearcoat = preset.clearcoat;
        params.clearcoatRoughness = preset.clearcoatRoughness || 0.05;
        doorMat = new THREE.MeshPhysicalMaterial(params);
    } else {
        doorMat = new THREE.MeshStandardMaterial(params);
    }

    if (isTexture) {
        const loader = new THREE.TextureLoader();
        if (typeof loader.setCrossOrigin === 'function') loader.setCrossOrigin('anonymous');
        loader.load(initialColor, (tex) => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            // encoding → colorSpace (r186) — فقط برای map رنگی
            tex.colorSpace = THREE.SRGBColorSpace;
            doorMat.map = tex;
            if (preset.bumpScale > 0) {
                // bump = data map (بدون sRGB)
                doorMat.bumpMap = (typeof window.asDataMapTexture === 'function') ? window.asDataMapTexture(tex) : tex;
                doorMat.bumpScale = preset.bumpScale;
            }
            doorMat.color.set(0xffffff);
            doorMat.needsUpdate = true;
        });
    }
    return doorMat;
}

function renderStandardDoorPreview3D(c) {
    const w = c.width || c.w || 60;
    const h = c.height || c.h || 72;
    const doorMat = buildDoorMaterial(c);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1), bodyMat);
    bodyMesh.position.z = -1;
    doorPreview3D.group.add(bodyMesh);

    Kitchen3D.createDoorSystem(doorPreview3D.group, c, doorMat);

    fitPreviewCamera(w, h);
}

function renderClosetPartDoorPreview3D(c) {
    if (!c.parts || c.parts.length === 0) return;

    const FRAME_THICKNESS = 5.5;
    let minX = Infinity;
    c.parts.forEach(p => { if (p.x < minX) minX = p.x; });
    if (minX === Infinity) minX = 0;

    const totalWidth = c.w || c.width || 1;
    const totalHeight = c.h || c.height || 1;
    const frameDepth = c.d || FRAME_THICKNESS;

    const defaultBeamMat = new THREE.MeshStandardMaterial({ color: 0xa9754f, roughness: 0.6 });
    const selectedSegmentMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        roughness: 0.4,
        emissive: 0x166534,
        emissiveIntensity: 0.65
    });

    // درب‌های مبتنی بر خانه
    const cells = (cachedClosetFrameCells && cachedClosetFrameCells.length)
        ? cachedClosetFrameCells
        : detectClosetFrameCells(c);
    const cellDoors = c.frameCellDoors || {};

    // تیرهای چهارچوب (همه با رنگ عادی — هایلایت فقط روی تکهٔ محدود به بخش)
    c.parts.forEach(part => {
        const pW = part.orientation === 'horizontal' ? part.length : FRAME_THICKNESS;
        const pH = part.orientation === 'vertical' ? part.length : FRAME_THICKNESS;
        const localX = (part.x - minX) - (totalWidth / 2) + (pW / 2);
        const localY = part.y + (pH / 2);
        const beamMesh = new THREE.Mesh(new THREE.BoxGeometry(pW, pH, frameDepth), defaultBeamMat);
        beamMesh.position.set(localX, localY, 0);
        doorPreview3D.group.add(beamMesh);
    });

    // فقط همان تکه از ضلع که داخل محدودهٔ بخش انتخاب‌شده است سبز شود
    if (selectedClosetFrameCellId && selectedClosetFrameCellSide) {
        const selCell = cells.find(cl => cl.id === selectedClosetFrameCellId);
        if (selCell) {
            const cellLocalLeft = (selCell.x - minX) - (totalWidth / 2);
            const cellLocalBottom = selCell.y;
            const cellLocalCenterX = cellLocalLeft + selCell.w / 2;
            const cellLocalCenterY = cellLocalBottom + selCell.h / 2;
            const segT = FRAME_THICKNESS; // ضخامت تیر
            let segW = segT, segH = segT, segX = 0, segY = 0;

            if (selectedClosetFrameCellSide === "bottom") {
                // فقط به اندازه عرض همین بخش، روی ضلع پایین
                segW = selCell.w;
                segH = segT;
                segX = cellLocalCenterX;
                segY = cellLocalBottom - segT / 2;
            } else if (selectedClosetFrameCellSide === "top") {
                segW = selCell.w;
                segH = segT;
                segX = cellLocalCenterX;
                segY = cellLocalBottom + selCell.h + segT / 2;
            } else if (selectedClosetFrameCellSide === "left") {
                segW = segT;
                segH = selCell.h;
                segX = cellLocalLeft - segT / 2;
                segY = cellLocalCenterY;
            } else if (selectedClosetFrameCellSide === "right") {
                segW = segT;
                segH = selCell.h;
                segX = cellLocalLeft + selCell.w + segT / 2;
                segY = cellLocalCenterY;
            }

            const segMesh = new THREE.Mesh(
                new THREE.BoxGeometry(Math.max(segW, 0.5), Math.max(segH, 0.5), frameDepth + 0.4),
                selectedSegmentMat
            );
            segMesh.position.set(segX, segY, 0.15);
            doorPreview3D.group.add(segMesh);
        }
    }

    cells.forEach(cell => {
        let cellCfg = normalizeClosetCellConfig(cellDoors[cell.id] || {});
        // برای بخش انتخاب‌شده، داده زنده پنل را اعمال کن
        if (cell.id === selectedClosetFrameCellId && currentCabinetForDoor) {
            cellCfg.enabled = cellCfg.enabled === true;
            cellCfg.doorSizes = currentCabinetForDoor.doorSizes;
            cellCfg.doorDirections = currentCabinetForDoor.doorDirections;
            cellCfg.doorMaterial = currentCabinetForDoor.doorMaterial;
            cellCfg.doorColor = currentCabinetForDoor.doorColor;
            cellCfg.doorTexture = currentCabinetForDoor.doorTexture;
            cellCfg.doorFinish = currentCabinetForDoor.doorFinish;
            cellCfg.showDoors = currentCabinetForDoor.showDoors;
            cellCfg.isGlassDoor = currentCabinetForDoor.isGlassDoor;
            cellCfg.doors = currentCabinetForDoor.doors;
            cellCfg.doorType = currentCabinetForDoor.doorType;
            syncClosetCellSidesFromCell(cellCfg);
        }
        let sidesMap = cellCfg.sides || {};

        // هایلایت واضح خانه انتخاب‌شده + ضلع انتخاب‌شده
        if (cell.id === selectedClosetFrameCellId) {
            const hx = (cell.x - minX) - (totalWidth / 2) + cell.w / 2;
            const hy = cell.y + cell.h / 2;
            const zFront = frameDepth / 2 + 0.5;

            // سطح نیمه‌شفاف آبی روی کل خانه
            const highlight = new THREE.Mesh(
                new THREE.BoxGeometry(Math.max(cell.w - 0.4, 1), Math.max(cell.h - 0.4, 1), 0.35),
                new THREE.MeshStandardMaterial({
                    color: 0x38bdf8,
                    transparent: true,
                    opacity: 0.35,
                    emissive: 0x0284c7,
                    emissiveIntensity: 0.55,
                    depthWrite: false
                })
            );
            highlight.position.set(hx, hy, zFront);
            doorPreview3D.group.add(highlight);

            // قاب روشن دور خانه
            const edgeMat = new THREE.MeshStandardMaterial({
                color: 0x7dd3fc,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.9,
                transparent: true,
                opacity: 0.95
            });
            const t = 1.2; // ضخامت خط قاب
            const edges = [
                // بالا
                { w: cell.w, h: t, x: hx, y: hy + cell.h / 2 - t / 2 },
                // پایین
                { w: cell.w, h: t, x: hx, y: hy - cell.h / 2 + t / 2 },
                // چپ
                { w: t, h: cell.h, x: hx - cell.w / 2 + t / 2, y: hy },
                // راست
                { w: t, h: cell.h, x: hx + cell.w / 2 - t / 2, y: hy }
            ];
            edges.forEach(e => {
                const m = new THREE.Mesh(new THREE.BoxGeometry(e.w, e.h, 0.5), edgeMat);
                m.position.set(e.x, e.y, zFront + 0.15);
                doorPreview3D.group.add(m);
            });
            // تیر ضلع انتخاب‌شده جداگانه با رنگ سبز روی خودِ قطعه رندر شده (بالا)
        }

        // درب ریلی در پیش‌نمایش — با کسر روکوب چپ/راست/بالا/پایین
        if (cellCfg.enabled && cellCfg.doorType === "sliding" && cellCfg.showDoors !== false) {
            const doorCount = Math.max(1, cellCfg.doors || 2);
            const doorThick = 1.8;
            const rollerClear = 2.5;
            const EDGE_INSET = 2;
            const rok = getClosetRokoobInsets(c);
            const usableW = Math.max(cell.w - (rok.left || 0) - (rok.right || 0), 1);
            const usableH = Math.max(cell.h - rollerClear - (rok.top || 0) - (rok.bottom || 0), 1);
            const cellCenterX = (cell.x - minX) - (totalWidth / 2) + cell.w / 2;
            const openBottomY = cell.y + (rok.bottom || 0);
            const openTopY = cell.y + cell.h - (rok.top || 0);
            const openMidY = (openBottomY + openTopY) / 2;
            const cellLeft = cellCenterX - cell.w / 2;
            const cellRight = cellCenterX + cell.w / 2;
            const innerLeft = cellLeft + EDGE_INSET + (rok.left || 0);
            const innerRight = cellRight - EDGE_INSET - (rok.right || 0);
            const spanW = Math.max(innerRight - innerLeft, 1);
            const frontFaceZ = (frameDepth / 2) + (rok.front || 0);
            const doorMat = buildDoorMaterial(cellCfg);
            for (let i = 0; i < doorCount; i++) {
                let doorW = usableW / doorCount;
                let doorH = usableH;
                const sizes = (cellCfg.doorSizes && cellCfg.doorSizes[i]) ? cellCfg.doorSizes[i] : null;
                if (sizes) {
                    if (sizes.w && !isNaN(parseFloat(sizes.w))) doorW = parseFloat(sizes.w);
                    if (sizes.h && !isNaN(parseFloat(sizes.h))) doorH = parseFloat(sizes.h);
                }
                const cx = innerLeft + doorW / 2 + i * (spanW / doorCount);
                const insetDepth = 2 + i * 2;
                const cz = frontFaceZ - insetDepth - doorThick / 2;
                const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorThick), doorMat);
                doorMesh.position.set(cx, openMidY, cz);
                doorPreview3D.group.add(doorMesh);
            }
            return;
        }

        // پیش‌فرض لولایی: تک‌سمت خانه+۳.۲ | جفت چپ+راست: (خانه+۲)/۲
        const OVERLAP = 1.6;
        const doorThick = 1.8;
        const FORWARD_OFFSET = 1.6;
        const leftOn = sidesMap.left && sidesMap.left.enabled === true && sidesMap.left.showDoors !== false;
        const rightOn = sidesMap.right && sidesMap.right.enabled === true && sidesMap.right.showDoors !== false;
        const isHorizType = (t) => !t || t === "side" || t === "lift-side";
        const bothLeftRightHoriz = leftOn && rightOn &&
            isHorizType(sidesMap.left && sidesMap.left.doorType) &&
            isHorizType(sidesMap.right && sidesMap.right.doorType);

        CLOSET_CELL_SIDE_ORDER.forEach(hingeSide => {
            const cfg = sidesMap[hingeSide];
            if (!cfg || cfg.enabled !== true || cfg.showDoors === false) return;

            const doorCount = Math.max(1, cfg.doors || 1);
            const doorMat = buildDoorMaterial(cfg);
            let pairW = cell.w + OVERLAP * 2;
            if (bothLeftRightHoriz && (hingeSide === "left" || hingeSide === "right")) {
                pairW = (cell.w + 2) / 2 - 0.1; // بادخور یک میل بین درب‌ها
            }
            const defaultH = cell.h + 3;

            for (let i = 0; i < doorCount; i++) {
                let doorW = pairW / doorCount;
                let doorH = defaultH;
                if (hingeSide === "top" || hingeSide === "bottom") {
                    doorW = cell.w + 3;
                    doorH = (cell.h + OVERLAP * 2) / doorCount;
                }
                const sizes = (cfg.doorSizes && cfg.doorSizes[i]) ? cfg.doorSizes[i] : null;
                if (sizes) {
                    if (sizes.w && !isNaN(parseFloat(sizes.w))) doorW = parseFloat(sizes.w);
                    if (sizes.h && !isNaN(parseFloat(sizes.h))) doorH = parseFloat(sizes.h);
                }
                const cellCenterX = (cell.x - minX) - (totalWidth / 2) + cell.w / 2;
                const cellCenterY = cell.y + cell.h / 2;
                let doorCenterX = cellCenterX;
                if (bothLeftRightHoriz && hingeSide === "left") {
                    doorCenterX = cellCenterX - cell.w / 2 - 1 + doorW / 2;
                } else if (bothLeftRightHoriz && hingeSide === "right") {
                    doorCenterX = cellCenterX + cell.w / 2 + 1 - doorW / 2;
                } else if (hingeSide === "left" || hingeSide === "right") {
                    const spanW = pairW;
                    doorCenterX = cellCenterX + (i - (doorCount - 1) / 2) * (spanW / doorCount);
                }
                const offsetY = (hingeSide === "top" || hingeSide === "bottom")
                    ? (i - (doorCount - 1) / 2) * ((cell.h + OVERLAP * 2) / doorCount) : 0;
                const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorThick), doorMat);
                doorMesh.position.set(
                    doorCenterX,
                    cellCenterY + offsetY,
                    (frameDepth / 2) - (doorThick / 2) + FORWARD_OFFSET
                );
                doorPreview3D.group.add(doorMesh);

                const isVert = hingeSide === "left" || hingeSide === "right";
                const handleLen = isVert
                    ? Math.min(14, Math.max(8, doorH * 0.2))
                    : Math.min(14, Math.max(8, doorW * 0.2));
                let handleGroup;
                if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.createBarHandle === "function") {
                    handleGroup = Kitchen3D.createBarHandle({
                        orientation: isVert ? "vertical" : "horizontal",
                        length: handleLen,
                        standoff: 1.2,
                        metalness: 0.96,
                        roughness: 0.14,
                        color: 0xc8c8c8
                    });
                } else {
                    handleGroup = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.4, 0.4, handleLen, 12),
                        new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.9, roughness: 0.2 })
                    );
                }
                if (hingeSide === "left") handleGroup.position.set(doorW / 2 - 3, 0, doorThick / 2);
                else if (hingeSide === "right") handleGroup.position.set(-(doorW / 2 - 3), 0, doorThick / 2);
                else if (hingeSide === "bottom") handleGroup.position.set(0, doorH / 2 - 3, doorThick / 2);
                else handleGroup.position.set(0, -(doorH / 2 - 3), doorThick / 2);
                doorMesh.add(handleGroup);
            }
        });
    });

    const previewW = totalWidth + 60;
    const previewH = totalHeight + 40;
    fitPreviewCamera(previewW, previewH);
}

function addClosetPreviewPartDoor(cfg, beamCenterX, beamCenterY, beamW, beamH, beamD, side) {
    const REVEAL = 1.6; // 🌟 فاصله‌ی لبه تا شروع درب (سانتی‌متر)
    const sizes = (cfg.doorSizes && cfg.doorSizes[0]) ? cfg.doorSizes[0] : {};

    const doorThick = 1.8;
    const doorH = (sizes.h && !isNaN(parseFloat(sizes.h))) ? parseFloat(sizes.h) : beamH;
    const doorW = (sizes.w && !isNaN(parseFloat(sizes.w))) ? parseFloat(sizes.w) : 35;

    const doorMat = buildDoorMaterial(cfg);
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorThick), doorMat);

    const edgeX = side === "left" ? -(beamW / 2) : (beamW / 2);
    const dir = side === "left" ? -1 : 1;
    const FORWARD_OFFSET = 1.6; // 🌟 ۱۶ میل جلوتر از روی چهارچوب، هماهنگ با نمای سه‌بعدی اصلی
    doorMesh.position.set(
        beamCenterX + edgeX + dir * (doorW / 2 - REVEAL), // 🌟 همپوشانی ۱.۶ سانتی روی چهارچوب، هماهنگ با نمای اصلی
        beamCenterY,
        (beamD / 2) - (doorThick / 2) + FORWARD_OFFSET
    );
    doorPreview3D.group.add(doorMesh);

    // 🌟 دستگیره میله‌ای استاندارد (عمودی) مثل درب‌های کابینت و نمای ۳D اصلی
    const handleLen = Math.min(16, Math.max(10, doorH * 0.22));
    let handleGroup;
    if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.createBarHandle === "function") {
        handleGroup = Kitchen3D.createBarHandle({
            orientation: "vertical",
            length: handleLen,
            standoff: 1.35,
            metalness: 0.96,
            roughness: 0.14,
            color: 0xc8c8c8
        });
    } else {
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.9, roughness: 0.2 });
        handleGroup = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, handleLen, 16), handleMat);
    }
    // نزدیک لبه‌ی آزاد درب (مقابل لولا)
    const handleX = side === "left"
        ? doorMesh.position.x - (doorW / 2) + 3
        : doorMesh.position.x + (doorW / 2) - 3;
    handleGroup.position.set(handleX, doorMesh.position.y, (beamD / 2) + 1.6);
    doorPreview3D.group.add(handleGroup);
}

function addSideDoorToBeam(c, beamW, beamH, beamD, side) {
    const REVEAL = 1.6; // 🌟 فاصله‌ی لبه تا شروع درب (سانتی‌متر)
    const sizes = (c.doorSizes && c.doorSizes[0]) ? c.doorSizes[0] : {};

    const doorThick = 1.8;
    const doorH = (sizes.h && !isNaN(parseFloat(sizes.h))) ? parseFloat(sizes.h) : beamH;
    const doorW = (sizes.w && !isNaN(parseFloat(sizes.w))) ? parseFloat(sizes.w) : 35;

    const doorMat = buildDoorMaterial(c);
    // 🌟 ضخامت روی محور Z (رو به دوربین) - دقیقاً مثل درب‌های کابینت آشپزخانه
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorThick), doorMat);

    const edgeX = side === "left" ? -(beamW / 2) : (beamW / 2);
    const dir = side === "left" ? -1 : 1;
    doorMesh.position.x = edgeX + dir * (REVEAL + doorW / 2);
    doorMesh.position.z = (beamD / 2) - (doorThick / 2); // هم‌تراز با جلوی قطعه

    doorPreview3D.group.add(doorMesh);

    // 🌟 دستگیره میله‌ای استاندارد (عمودی)
    const handleLen = Math.min(16, Math.max(10, doorH * 0.22));
    let handleGroup;
    if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.createBarHandle === "function") {
        handleGroup = Kitchen3D.createBarHandle({
            orientation: "vertical",
            length: handleLen,
            standoff: 1.35,
            metalness: 0.96,
            roughness: 0.14,
            color: 0xc8c8c8
        });
    } else {
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.9, roughness: 0.2 });
        handleGroup = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, handleLen, 16), handleMat);
    }
    const handleX = side === "left"
        ? doorMesh.position.x - (doorW / 2) + 3
        : doorMesh.position.x + (doorW / 2) - 3;
    handleGroup.position.set(handleX, doorMesh.position.y, (beamD / 2) + 1.6);
    doorPreview3D.group.add(handleGroup);
}

function fitPreviewCamera(w, h) {
    const canvas = document.getElementById("door-panel-3d-canvas");
    const cw = canvas.clientWidth || 300;
    const ch = canvas.clientHeight || 220;
    const aspect = cw / ch;
    const margin = 1.3;

    let viewW = w * margin;
    let viewH = h * margin;
    if (viewW / viewH < aspect) viewW = viewH * aspect;
    else viewH = viewW / aspect;

    doorPreview3D.camera.left = -viewW / 2;
    doorPreview3D.camera.right = viewW / 2;
    doorPreview3D.camera.top = viewH / 2;
    doorPreview3D.camera.bottom = -viewH / 2;
    doorPreview3D.camera.updateProjectionMatrix();
    doorPreview3D.renderer.setSize(cw, ch, false);
}

function disposeDoorPreview3D() {
    if (doorPreview3D.animId) cancelAnimationFrame(doorPreview3D.animId);
    if (doorPreview3D.renderer) doorPreview3D.renderer.dispose();
    doorPreview3D = { scene: null, camera: null, renderer: null, group: null, animId: null };
}

// 🌟 نام قبلی حفظ شد تا همه‌ی جاهایی که قبلاً صداش می‌زدن بدون تغییر کار کنن
function updateDoorPreviewFromPanel() {
    updateDoorPreview3D();
}




 
function updateDoorMaterials(selectedType) {
  const materials = window.allMaterials?.[selectedType];

  if (!materials) {
    console.error(
      `ERROR: مواد برای نوع '${selectedType}' در allMaterials یافت نشد.`
    );
    return;
  }

  currentDoorMaterials = materials;
}


function loadPreviewTexture(url, callback) {
  if (window.previewTextureCache[url]) {
    callback(window.previewTextureCache[url]);
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous"; // مهم برای Cloudinary

  img.onload = () => {
    window.previewTextureCache[url] = img;

    // 🔥 رندر مجدد فوری پیش‌نمایش
    updateDoorPreviewFromPanel();

    callback(img);
  };

  img.onerror = () => {
    console.warn("❌ خطا در لود تکستچر پیش‌نمایش:", url);
    callback(null);
  };

  img.src = url;
}
function forcePreviewSync() {
  if (!currentCabinetForDoor) return;
  updateDoorPreviewFromPanel();
}

function toggleShowDoors() {
  const checkbox = document.getElementById("door-panel-show-doors");
  if (currentCabinetForDoor) {
    // ۱. ذخیره وضعیت جدید (true یا false)
    currentCabinetForDoor.showDoors = checkbox.checked;

    // ۲. آپدیت پیش‌نمایش کوچک پنل (Canvas سمت راست)
    updateDoorPreviewFromPanel();

    // ۳. آپدیت نمای دو بعدی (نقشه اصلی)
    if (typeof draw === 'function') {
        draw(); 
    }
if (typeof drawFrontElevation === 'function') drawFrontElevation();
    // ۴. آپدیت نمای سه بعدی
    if (typeof updateCabinetIn3D === 'function') {
        updateCabinetIn3D(currentCabinetForDoor);
    }
  }
}
// --- ۱. هندل کردن رویدادهای کلیک (برای جستجوی رنگ) ---
document.addEventListener("click", function(event) {
    if (event.target && event.target.closest("#door-color-search")) {
        openMainDoorColorPicker(); //  اصلاح شد به تابع جدید
    }
});




// --- ۲. هندل کردن رویدادهای تغییر (change) برای ۴ المان دیگر ---
document.addEventListener("change", function(event) {
    
    // الف) نوع بازشو
    if (event.target && event.target.id === "door-panel-type") {
        if (currentCabinetForDoor) {
            const selectedType = event.target.value;
            currentCabinetForDoor.doorType = selectedType;
            
            // 🌟 [اصلاحیه کلیدی ۲] - پاک کردن ابعاد قبلی جهت محاسبه مجدد بر اساس نوع درب جدید
            currentCabinetForDoor.doorSizes = null;

            const countInput = document.getElementById("door-panel-count");
            let currentVal = parseInt(countInput.value) || 1;

            if (isClosetDoorMode()) {
                currentVal = clampDoorCountValue(selectedType, currentVal);
            } else if (selectedType === "combo") {
                if (currentVal < 3) currentVal = 3;
                if (currentVal > 4) currentVal = 4;
            } 
            else if (selectedType === "lift") {
                if (currentVal > 2) currentVal = 2;
            } 
            else if (selectedType === "lift-side") {
                currentVal = 2;
            }
            else {
                if (currentVal > 4) currentVal = 4;
            }

            countInput.value = currentVal;
            currentCabinetForDoor.doors = currentVal;

            if (isClosetDoorMode() && selectedClosetFrameCellId) {
                const cfg = getClosetCellConfig(selectedClosetFrameCellId);
                if (cfg) {
                    cfg.doorType = selectedType;
                    // ریلی: پیش‌فرض ۲ درب
                    if (selectedType === "sliding" && currentVal < 2) {
                        currentVal = 2;
                        countInput.value = 2;
                    }
                    cfg.doors = currentVal;
                    currentCabinetForDoor.doors = currentVal;
                    cfg.doorSizes = null;
                    if (selectedType === "sliding") {
                        cfg.doorDirections = Array.from({ length: currentVal }, (_, i) =>
                            i % 2 === 0 ? "left" : "right"
                        );
                    } else if (currentVal >= 2 && isHorizontalClosetDoorType(selectedType)) {
                        cfg.doorDirections = ["left", "right"];
                    }
                    applyClosetCellDefaultSizesIfNeeded(cfg, true);
                    syncClosetCellSidesFromCell(cfg);
                    currentCabinetForDoor.doorSizes = cfg.doorSizes
                        ? JSON.parse(JSON.stringify(cfg.doorSizes))
                        : null;
                }
            }
            
            renderDoorDirectionSelectors();
            renderDoorDimensionsInputs();
            renderDoorHiddenHandleInputs();
            renderDoorMaterialAndColorInputs();
            
            updateDoorPreviewFromPanel();
            draw();
        }
    }

    // ه) تغییر چیدمان درب قدی (چپ یا راست)
    if (event.target && event.target.id === "combo-door-layout") {
        if (currentCabinetForDoor) {
            window.updateComboLayout(event.target.value);
            if (typeof draw === 'function') draw();
        }
    }

    // ب) جنس ورق — فقط کاتالوگ رنگ (پرداخت نور جداست)
    if (event.target && event.target.id === "door-panel-material") {
        if (currentCabinetForDoor) {
            currentCabinetForDoor.doorMaterial = event.target.value;
            if (typeof updateDoorMaterials === "function") updateDoorMaterials(event.target.value);
            if (typeof renderManualPiecesTable === "function") {
                renderManualPiecesTable();
            }
        }
    }

    // ج) چک‌باکس نمایش/مخفی کردن درب‌ها
    if (event.target && event.target.id === "door-panel-show-doors") {
        if (currentCabinetForDoor) {
            currentCabinetForDoor.showDoors = event.target.checked;
            updateDoorPreviewFromPanel();
            draw();
        }
    }

    // د) تایپ دستی تعداد درب
    if (event.target && event.target.id === "door-panel-count") {
        const doorType = document.getElementById("door-panel-type").value;
        const isDrawerUnit = currentCabinetForDoor && (currentCabinetForDoor.isDrawerBody || currentCabinetForDoor.isBaseWithDrawer);

        if (doorType === "drawer" || isDrawerUnit) {
            event.target.value = currentCabinetForDoor.drawerCount || 1;
            event.target.disabled = true;
            return; 
        }

        let val = parseInt(event.target.value) || 1;

        if (isClosetDoorMode()) {
            val = clampDoorCountValue(doorType, val);
        } else if (doorType === "combo") {
            val = Math.max(3, Math.min(4, val));
        } else if (doorType === "lift") {
            val = Math.max(1, Math.min(2, val));
        } else if (doorType === "lift-side") {
            val = 2; 
        } else {
            val = Math.max(1, Math.min(4, val));
        }

        event.target.value = val;
        if (currentCabinetForDoor) {
            // 🌟 [اصلاحیه کلیدی ۳] - پاک کردن ابعاد قبلی به دلیل تغییر دستی تعداد درب‌ها
            currentCabinetForDoor.doorSizes = null;
            
            currentCabinetForDoor.doors = val;
            renderDoorDirectionSelectors();
            renderDoorDimensionsInputs();
            renderDoorHiddenHandleInputs();
            renderDoorMaterialAndColorInputs();
            updateDoorPreviewFromPanel();
            draw();
        }
    }
});


// ==========================================
// 🌟 محاسبه‌ی جابجایی لازم تا درب دقیقاً به لبه‌ی چپ/راستِ کل یونیت بچسبد
// (برخلاف قفل معمولی که فقط داخل اسلاتِ خودش تراز می‌کند، این تابع کل عرض یونیت را در نظر می‌گیرد)
// ==========================================
function computeFlushShiftToUnitEdge(index, direction) {
    const sizes = currentCabinetForDoor.doorSizes;
    const size = sizes[index] || {};
    const doorsCount = currentCabinetForDoor.doors || 2;
    const cabW = (typeof getDoorOpeningWidth === 'function') ? getDoorOpeningWidth(currentCabinetForDoor) : (parseFloat(currentCabinetForDoor.w) || 100);
    const gap = 0.2;
    const doorSlotW = (cabW - (doorsCount - 1) * gap) / doorsCount;
    const w = parseFloat(size.w) || doorSlotW;

    // موقعیت پایه‌ی درب داخل اسلاتِ خودش (طبق قفلِ فعلی‌اش)
    const lock = size.lockX || 'center';
    const slotStartX = index * (doorSlotW + gap);
    let baseX;
    if (lock === 'left') baseX = slotStartX;
    else if (lock === 'right') baseX = slotStartX + doorSlotW - w;
    else baseX = slotStartX + (doorSlotW - w) / 2;

    // موقعیت هدف: کاملاً چسبیده به لبه‌ی چپ (x=0) یا لبه‌ی راست (x = عرض کل یونیت منهای عرض درب) کل یونیت
    const desiredX = (direction === 'left') ? 0 : (cabW - w);
    const shiftNeeded = desiredX - baseX;

    if (shiftNeeded >= 0) {
        return { dir: 'right', value: Math.round(shiftNeeded * 100) / 100 };
    } else {
        return { dir: 'left', value: Math.round(Math.abs(shiftNeeded) * 100) / 100 };
    }
}
window.computeFlushShiftToUnitEdge = computeFlushShiftToUnitEdge;

// منطق اصلی و هوشمند تراز خودکار درب‌ها
// ==========================================
function applyAutoAlignLogic() {
    if (!currentCabinetForDoor || !currentCabinetForDoor.doorSizes) return;
    
    const doorsCount = currentCabinetForDoor.doors || 2;
    const sizes = currentCabinetForDoor.doorSizes;
    const dirs = currentCabinetForDoor.doorDirections || [];
    
    // عرض دهانه جلو (زاویه‌دار در صورت وجود)
    const cabW = (typeof getDoorOpeningWidth === 'function')
        ? getDoorOpeningWidth(currentCabinetForDoor)
        : (parseFloat(currentCabinetForDoor.w) || 100);
    const gap = 0.2; // فاصله ۲ میلی‌متری بین درب‌ها (استاندارد شما)
    const doorSlotW = (cabW - (doorsCount - 1) * gap) / doorsCount;

    // پیدا کردن موقعیت پایه یک درب داخل بخش (اسلات) خودش به سانتی‌متر
    const getBaseX_cm = (size, idx) => {
        let w = parseFloat(size.w) || doorSlotW;
        let lock = size.lockX || 'center';
        let sX = idx * (doorSlotW + gap);
        
        if (lock === 'left') return sX;
        if (lock === 'right') return sX + doorSlotW - w;
        return sX + (doorSlotW - w) / 2;
    };

    // محاسبه مکان واقعی یک درب (حتی اگر دربِ هدف هم روی تراز خودکار باشد)
    const getActualX_cm = (idx, visited = new Set()) => {
        if (visited.has(idx)) return getBaseX_cm(sizes[idx], idx); 
        visited.add(idx);
        
        let size = sizes[idx] || {};
        let w = parseFloat(size.w) || doorSlotW;
        
        // اگر این درب روی تراز خودکار تنظیم شده است
        if (size.isAutoAlign) {
            let dir = dirs[idx] || 'left';
            // لولا چپ = دستگیره سمت راست است -> پس به درب سمت راستی متصل می‌شود
            // لولا راست = دستگیره سمت چپ است -> پس به درب سمت چپی متصل می‌شود
            let targetIdx = dir === 'left' ? idx + 1 : idx - 1;
            
            if (targetIdx >= 0 && targetIdx < doorsCount) {
                let targetX = getActualX_cm(targetIdx, visited); // مختصات درب هدف
                let targetSize = sizes[targetIdx] || {};
                let targetW = parseFloat(targetSize.w) || doorSlotW;
                
                if (dir === 'left') {
                    // می‌چسبد به سمت چپِ دربِ هدف
                    return targetX - gap - w;
                } else {
                    // می‌چسبد به سمت راستِ دربِ هدف
                    return targetX + targetW + gap;
                }
            }
        }
        
        // اگر تراز خودکار نیست، موقعیت بر اساس قفل و آفست دستی حساب می‌شود
        let x = getBaseX_cm(size, idx);
        if (size.shiftDirX === 'right') x += parseFloat(size.shiftValueX) || 0;
        else if (size.shiftDirX === 'left') x -= parseFloat(size.shiftValueX) || 0;
        return x;
    };

    // حالا مقدار آفست لازم برای تمام درب‌های تراز خودکار را محاسبه و به سیستم تزریق می‌کنیم
    for (let i = 0; i < doorsCount; i++) {
        let size = sizes[i];
        if (!size || !size.isAutoAlign) continue;

        let desiredX = getActualX_cm(i);
        let myBaseX = getBaseX_cm(size, i);
        let shiftNeeded = desiredX - myBaseX;

        // تبدیل اختلاف موقعیت به پارامترهای استاندارد برای رندر 3D و 2D
        if (Math.abs(shiftNeeded) < 0.01) {
            size.shiftDirX = 'none';
            size.shiftValueX = 0;
        } else if (shiftNeeded > 0) {
            size.shiftDirX = 'right';
            size.shiftValueX = Math.round(shiftNeeded * 100) / 100; // گرد کردن به ۲ رقم اعشار
        } else {
            size.shiftDirX = 'left';
            size.shiftValueX = Math.round(Math.abs(shiftNeeded) * 100) / 100;
        }
    }
}
window.applyAutoAlignLogic = applyAutoAlignLogic;


// خارج کردن توابع برای دسترسی جهانی
window.openDoorEditorPanel = openDoorEditorPanel;
window.openClosetDoorEditorPanel = openClosetDoorEditorPanel;
window.selectClosetFrameCell = selectClosetFrameCell;
window.detectClosetFrameCells = detectClosetFrameCells;
window.renderClosetFramePartsList = renderClosetFramePartsList;

window.closeDoorEditorPanel = closeDoorEditorPanel;
window.applyDoorSettingsFromPanel = applyDoorSettingsFromPanel;
window.changeDoorCount = changeDoorCount;
window.selectDoorColor = selectDoorColor;
window.renderDoorDirectionSelectors = renderDoorDirectionSelectors;





