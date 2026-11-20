// js/components/charchob.js

let currentClosetFrameParts = [];
let selectedPartId = null;
// موقعیت اتاقِ چهارچوب در حال ویرایش (تا مختصات پنل محلی بماند و با جابجایی ۲D قاطی نشود)
let editingFrameRoomX = 0;
let editingFrameRoomY = 0;

// ابعاد ثابت اتاق و چهارچوب (سانتی‌متر)
const ROOM_WIDTH = 400;  
const ROOM_HEIGHT = 280; 
const FRAME_THICKNESS = 5.5; 
const VERTICAL_HEIGHT = ROOM_HEIGHT - (FRAME_THICKNESS * 2); // ۲۶۹ سانتی‌متر

/**
 * نرمال‌سازی مختصات قطعات به سیستم محلی چهارچوب (مبدأ ۰,۰ گوشه پایین-چپ)
 * تا اعداد داخل پنل مستقل از موقعیت چهارچوب در اتاق باشند.
 */
function normalizePartsToLocalOrigin(parts) {
    if (!parts || parts.length === 0) return { originX: 0, originY: 0 };

    const mainNames = ["دیواره چپ", "دیواره راست", "کف چهارچوب", "سقف چهارچوب"];
    const mainParts = parts.filter(p => mainNames.includes(p.name));
    const partsForBounds = mainParts.length > 0 ? mainParts : parts;

    let minX = Infinity, minY = Infinity;
    partsForBounds.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
    });
    if (!isFinite(minX)) minX = 0;
    if (!isFinite(minY)) minY = 0;

    // همه قطعات را نسبت به گوشه پایین-چپ چهارچوب جابجا کن
    parts.forEach(p => {
        p.x = parseFloat((p.x - minX).toFixed(2));
        p.y = parseFloat((p.y - minY).toFixed(2));
    });

    return { originX: minX, originY: minY };
}

function openClosetFrameEditorPanel() {
    const units = window.closetFrameUnits || [];
    const targetUnit = units.find(u => u.id === window.selectedClosetFrameId);

    if (!targetUnit) {
        alert("لطفاً ابتدا یک چهارچوب کمد دیواری را از روی صحنه انتخاب کنید.");
        return;
    }

    const panel = document.getElementById("closet-frame-editor-panel");
    if (!panel) return;

    currentClosetFrameParts = JSON.parse(JSON.stringify(targetUnit.parts || []));

    // موقعیت اتاق را نگه دار؛ مختصات داخل پنل کاملاً محلی (۰,۰) می‌شود
    editingFrameRoomX = (typeof targetUnit.x === "number") ? targetUnit.x : 0;
    editingFrameRoomY = (typeof targetUnit.y === "number") ? targetUnit.y : 0;
    normalizePartsToLocalOrigin(currentClosetFrameParts);

    renderFramePartsList();
    panel.classList.add("active");

    setTimeout(renderSVGPreview, 50);
}

function closeClosetFrameEditorPanel() {
    const panel = document.getElementById("closet-frame-editor-panel");
    if (panel) panel.classList.remove("active");
}

function addFramePart() {
    const newId = Date.now();

    // 🌟 اصلاح: به‌جای مختصات ثابت (که ممکنه کاملاً بیرون از محدوده چهارچوب فعلی باشه)،
    // محدوده واقعی قطعات موجود رو حساب می‌کنیم و قطعه جدید رو وسط همون محدوده قرار می‌دیم
    let newX = 0;
    const newY = FRAME_THICKNESS;

    if (currentClosetFrameParts.length > 0) {
        let minX = Infinity, maxX = -Infinity;
        currentClosetFrameParts.forEach(p => {
            const pW = p.orientation === 'horizontal' ? p.length : FRAME_THICKNESS;
            if (p.x < minX) minX = p.x;
            if (p.x + pW > maxX) maxX = p.x + pW;
        });
        const frameWidth = Math.max(maxX - minX, FRAME_THICKNESS);
        newX = minX + (frameWidth / 2) - (FRAME_THICKNESS / 2); // درست وسط چهارچوب موجود
    }

    currentClosetFrameParts.push({
        id: newId,
        name: `قطعه ${currentClosetFrameParts.length + 1}`,
        length: 120,
        orientation: "vertical",
        x: newX,
        y: newY,
        origin: "bottom"
    });
    renderFramePartsList();
    selectFramePart(newId);
}

function renderFramePartsList() {
    const container = document.getElementById("frame-parts-container");
    if (!container) return;

    container.innerHTML = "";

    if (currentClosetFrameParts.length === 0) {
        container.innerHTML = `<div style="color: #64748b; text-align: center; padding: 10px;">قطعه‌ای تعریف نشده است</div>`;
        return;
    }

    currentClosetFrameParts.forEach(part => {
        const item = document.createElement("div");
        const isSelected = part.id === selectedPartId;
        
        item.style.cssText = `
            padding: 8px 12px;
            background: ${isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)'};
            border: 1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)'};
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #f8fafc;
            font-size: 12px;
            margin-bottom: 4px;
        `;

        item.innerHTML = `
            <span><strong>${part.name}</strong> (${part.orientation === 'vertical' ? 'عمودی' : 'افقی'})</span>
            <span style="color: #38bdf8; font-weight: bold;">${part.length} cm</span>
        `;

        item.onclick = () => selectFramePart(part.id);
        container.appendChild(item);
    });
}

function selectFramePart(id) {
    selectedPartId = id ? parseInt(id) : null;
    const settingsBox = document.getElementById("frame-part-settings");

    renderFramePartsList();

    if (!selectedPartId) {
        if (settingsBox) settingsBox.style.display = "none";
        renderSVGPreview();
        return;
    }

    const part = currentClosetFrameParts.find(p => p.id === selectedPartId);
    if (!part) return;

    if (settingsBox) settingsBox.style.display = "block";
    document.getElementById("selected-part-title").textContent = part.name;
    document.getElementById("frame-part-length").value = part.length;
    // مختصات محلی چهارچوب (مبدأ ۰,۰) — مستقل از موقعیت در اتاق
    document.getElementById("frame-part-x").value = Number(part.x.toFixed(2));
    document.getElementById("frame-part-y").value = Number(part.y.toFixed(2));

    // بروزرسانی UI دکمه‌های مبدأ بر اساس جهت قطعه
    updateOriginButtonsUI(part);

    renderSVGPreview();
}

/**
 * به‌روزرسانی متن و استایل دکمه‌های مبدأ بر اساس افقی/عمودی بودن قطعه
 */
function updateOriginButtonsUI(part) {
    const btn1 = document.getElementById("origin-btn-1");
    const btn2 = document.getElementById("origin-btn-2");
    const btn3 = document.getElementById("origin-btn-3");
    const label = document.getElementById("origin-label");

    if (!btn1 || !btn2 || !btn3) return;

    if (part.orientation === "horizontal") {
        label.textContent = "تراز و مبداء افقی (X)";
        btn1.textContent = "⬅️ از چپ";
        btn2.textContent = "↔️ مرکز";
        btn3.textContent = "➡️ از راست";

        btn1.style.background = part.origin === 'left' ? '#0284c7' : '#475569';
        btn2.style.background = part.origin === 'center' ? '#0284c7' : '#475569';
        btn3.style.background = part.origin === 'right' ? '#0284c7' : '#475569';
    } else {
        label.textContent = "تراز و مبداء عمودی (Y)";
        btn1.textContent = "⬇️ از پایین";
        btn2.textContent = "↕️ مرکز";
        btn3.textContent = "⬆️ از بالا";

        btn1.style.background = part.origin === 'bottom' ? '#0284c7' : '#475569';
        btn2.style.background = part.origin === 'center' ? '#0284c7' : '#475569';
        btn3.style.background = part.origin === 'top' ? '#0284c7' : '#475569';
    }
}

/**
 * محدوده واقعی چهارچوب اصلی (بر اساس ۴ قطعه اصلی: دیواره چپ/راست، کف/سقف چهارچوب)
 * قطعات اضافه‌شده توسط کاربر (تقسیم‌کننده‌های داخلی) در این محاسبه دخیل نیستن،
 * چون هدف اینه که تراز همیشه نسبت به چهارچوب اصلی باشه، نه یک سایز ثابت اتاق
 */
function getMainFrameBounds() {
    const mainNames = ["دیواره چپ", "دیواره راست", "کف چهارچوب", "سقف چهارچوب"];
    const mainParts = currentClosetFrameParts.filter(p => mainNames.includes(p.name));
    const partsForBounds = mainParts.length > 0 ? mainParts : currentClosetFrameParts;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    partsForBounds.forEach(p => {
        const pW = p.orientation === 'horizontal' ? p.length : FRAME_THICKNESS;
        const pH = p.orientation === 'vertical' ? p.length : FRAME_THICKNESS;
        if (p.x < minX) minX = p.x;
        if (p.x + pW > maxX) maxX = p.x + pW;
        if (p.y < minY) minY = p.y;
        if (p.y + pH > maxY) maxY = p.y + pH;
    });

    if (!isFinite(minX)) { minX = 0; maxX = 0; minY = 0; maxY = 0; }

    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * تنظیم مبدأ برای قطعه انتخابی
 */
function setPartOrigin(type) {
    if (!selectedPartId) return;
    const part = currentClosetFrameParts.find(p => p.id === selectedPartId);
    if (!part) return;

    // 🌟 تراز بر اساس محدوده واقعی چهارچوب (۴ قطعه اصلی)، نه یک سایز ثابت اتاق
    const bounds = getMainFrameBounds();

    if (part.orientation === "horizontal") {
        if (type === 'pos1') part.origin = 'left';
        else if (type === 'pos2') part.origin = 'center';
        else if (type === 'pos3') part.origin = 'right';

        // تراز کردن موقعیت X بر اساس مبدأ جدید
        if (part.origin === 'left') part.x = bounds.minX;
        else if (part.origin === 'right') part.x = bounds.maxX - part.length;
        else if (part.origin === 'center') part.x = bounds.minX + (bounds.width - part.length) / 2;

    } else {
        if (type === 'pos1') part.origin = 'bottom';
        else if (type === 'pos2') part.origin = 'center';
        else if (type === 'pos3') part.origin = 'top';

        // تراز کردن موقعیت Y بر اساس مبدأ جدید
        if (part.origin === 'bottom') part.y = bounds.minY + FRAME_THICKNESS;
        else if (part.origin === 'top') part.y = bounds.maxY - FRAME_THICKNESS - part.length;
        else if (part.origin === 'center') part.y = bounds.minY + (bounds.height - part.length) / 2;
    }

    document.getElementById("frame-part-x").value = Number(part.x.toFixed(2));
    document.getElementById("frame-part-y").value = Number(part.y.toFixed(2));

    updateOriginButtonsUI(part);
    renderSVGPreview();
}

function updateSelectedPartFromInputs() {
    if (!selectedPartId) return;

    const part = currentClosetFrameParts.find(p => p.id === selectedPartId);
    if (!part) return;

    // مقادیر ورودی = مختصات محلی نسبت به مبدأ (۰,۰) خودِ چهارچوب
    const newLength = Math.max(1, parseFloat(document.getElementById("frame-part-length").value) || 1);
    const newX = parseFloat(document.getElementById("frame-part-x").value);
    const newY = parseFloat(document.getElementById("frame-part-y").value);

    part.length = newLength;
    part.x = isNaN(newX) ? 0 : newX;
    part.y = isNaN(newY) ? 0 : newY;

    renderFramePartsList();
    renderSVGPreview();
}


function toggleFramePartOrientation() {
    if (!selectedPartId) return;
    const part = currentClosetFrameParts.find(p => p.id === selectedPartId);
    if (!part) return;

    // چرخاندن جهت و مقداردهی پیش‌فرض مبدأ
    if (part.orientation === "vertical") {
        part.orientation = "horizontal";
        part.origin = "left";
    } else {
        part.orientation = "vertical";
        part.origin = "bottom";
    }

    selectFramePart(selectedPartId);
}

function removeSelectedFramePart() {
    if (!selectedPartId) return;
    currentClosetFrameParts = currentClosetFrameParts.filter(p => p.id !== selectedPartId);
    selectFramePart(null);
}

function renderSVGPreview() {
    const svg = document.getElementById("frame-preview-svg");
    if (!svg) return;

    const margin = 30;

    // 🌟 اصلاح کلیدی: به‌جای اتکا به مختصات مطلق اتاق (که با جابجایی چهارچوب توی نمای ۲بعدی
    // تغییر می‌کنه)، کادر پیش‌نمایش رو هر بار بر اساس محدوده واقعی خودِ قطعات محاسبه می‌کنیم.
    // اینطوری فرقی نمی‌کنه چهارچوب کجای اتاق باشه، قطعات همیشه توی پیش‌نمایش دیده می‌شن.
    let minPX = Infinity, maxPX = -Infinity;
    let minPY = 0, maxPY = -Infinity; // خط کف (y=0) همیشه باید داخل کادر باشه

    if (currentClosetFrameParts.length > 0) {
        currentClosetFrameParts.forEach(part => {
            const pW = part.orientation === 'horizontal' ? part.length : FRAME_THICKNESS;
            const pH = part.orientation === 'vertical' ? part.length : FRAME_THICKNESS;
            if (part.x < minPX) minPX = part.x;
            if (part.x + pW > maxPX) maxPX = part.x + pW;
            if (part.y < minPY) minPY = part.y;
            if (part.y + pH > maxPY) maxPY = part.y + pH;
        });
    } else {
        minPX = 0; maxPX = ROOM_WIDTH;
        maxPY = ROOM_HEIGHT;
    }

    if (minPY > 0) minPY = 0; // اطمینان از دیده شدن خط کف حتی اگر همه قطعات بالاتر از صفر باشن

    const frameW = Math.max(maxPX - minPX, 1);
    const frameH = Math.max(maxPY - minPY, 1);

    const boundX = minPX - margin;
    const boundY = -(maxPY + margin);
    const boundWidth = frameW + (margin * 2);
    const boundHeight = frameH + (margin * 2);

    svg.setAttribute("viewBox", `${boundX} ${boundY} ${boundWidth} ${boundHeight}`);

    let html = `
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
            </pattern>
            <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#0284c7" stop-opacity="0.9" />
            </linearGradient>
            <linearGradient id="defaultWood" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#475569" />
                <stop offset="100%" stop-color="#1e293b" />
            </linearGradient>
        </defs>

        <rect x="${boundX}" y="${boundY}" width="${boundWidth}" height="${boundHeight}" fill="url(#grid)" />

        <!-- خط زمین -->
        <line x1="${boundX}" y1="0" x2="${boundX + boundWidth}" y2="0" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4" />
        <text x="${boundX + 10}" y="-6" fill="#22c55e" font-size="10" font-family="Tahoma">کف زمین (0cm)</text>
    `;

    // رسم قطعات
    currentClosetFrameParts.forEach(part => {
        let pW = part.orientation === 'horizontal' ? part.length : FRAME_THICKNESS;
        let pH = part.orientation === 'vertical' ? part.length : FRAME_THICKNESS;

        const rx = part.x;
        const ry = -(part.y + pH);
        const isSelected = part.id === selectedPartId;

        const fillStyle = isSelected ? "url(#woodGrad)" : "url(#defaultWood)";
        const strokeColor = isSelected ? "#38bdf8" : "#64748b";
        const strokeWidth = isSelected ? 3.5 : 1;
        // هاله روشن دور قطعه انتخاب‌شده تا در پیش‌نمایش کاملاً مشخص باشد
        const glow = isSelected
            ? `<rect x="${rx - 2}" y="${ry - 2}" width="${pW + 4}" height="${pH + 4}" fill="none" stroke="#38bdf8" stroke-width="5" opacity="0.45" rx="4" />`
            : "";

        html += `
            <g style="cursor: pointer;" onclick="selectFramePart(${part.id})">
                ${glow}
                <rect x="${rx}" y="${ry}" width="${pW}" height="${pH}" 
                      fill="${fillStyle}" stroke="${strokeColor}" stroke-width="${strokeWidth}" rx="2" />
                
                <text x="${rx + pW / 2}" y="${ry + pH / 2}" 
                      fill="${isSelected ? "#e0f2fe" : "#ffffff"}" font-size="${Math.min(pW, pH) > 4 ? 11 : 8}" font-weight="bold" font-family="Tahoma"
                      dominant-baseline="middle" text-anchor="middle">
                      ${part.name} (${part.length}cm)
                </text>
            </g>
        `;
    });

    svg.innerHTML = html;
}

function applyClosetFrameSettings() {
    if (!currentClosetFrameParts || currentClosetFrameParts.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    currentClosetFrameParts.forEach(part => {
        let pW = part.orientation === 'horizontal' ? part.length : FRAME_THICKNESS;
        let pH = part.orientation === 'vertical' ? part.length : FRAME_THICKNESS;
        let px1 = part.x, px2 = part.x + pW, py1 = part.y, py2 = part.y + pH;
        if (px1 < minX) minX = px1;
        if (px2 > maxX) maxX = px2;
        if (py1 < minY) minY = py1;
        if (py2 > maxY) maxY = py2;
    });

    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;
    const frameDepth = 5.5;
    const closetBodyDepth = 58;

    window.closetFrameUnits = window.closetFrameUnits || [];

    // 🌟 اگر یونیت انتخاب‌شده‌ای در حال ویرایشه، همونو آپدیت کن؛ وگرنه یکی جدید بساز
    let targetUnit = window.closetFrameUnits.find(u => u.id === window.selectedClosetFrameId);

    if (targetUnit) {
        // موقعیت اتاق از زمان باز شدن پنل حفظ می‌شود؛ مختصات پنل محلی است
        const roomX = (typeof editingFrameRoomX === "number") ? editingFrameRoomX : targetUnit.x;
        const shiftX = roomX - minX; // تبدیل مختصات محلی → مطلق اتاق

        targetUnit.x = roomX;
        targetUnit.w = totalWidth;
        targetUnit.h = totalHeight;
        targetUnit.d = frameDepth;
        targetUnit.shelfBodyDepth = closetBodyDepth;
        targetUnit.parts = JSON.parse(JSON.stringify(currentClosetFrameParts)).map(p => ({
            ...p,
            x: p.x + shiftX
            // y همان ارتفاع محلی است و نباید با موقعیت عمق اتاق قاطی شود
        }));
    } else {
        let startX = 0;
        if (window.closetFrameUnits.length > 0) {
            const maxRight = Math.max(...window.closetFrameUnits.map(u => u.x + u.w));
            startX = maxRight + 20; // 🌟 کنار آخرین چهارچوب چیده می‌شه، نه روش
        }
        const shiftX = startX - minX; // 🌟 هماهنگ کردن قطعات محلی با موقعیت اتاق

        targetUnit = {
            id: "closet_frame_" + Date.now(),
            name: "چهارچوب کمد دیواری",
            x: startX,
            y: 0,
            w: totalWidth,
            h: totalHeight,
            d: frameDepth,
            shelfBodyDepth: closetBodyDepth,
            rot: 0,
            isLocked: false,
            parts: JSON.parse(JSON.stringify(currentClosetFrameParts)).map(p => ({
                ...p,
                x: p.x + shiftX
            }))
        };

        window.closetFrameUnits.push(targetUnit);
        window.selectedClosetFrameId = targetUnit.id;
        window.isClosetFrameSelected = true;
    }

    // alias برای فایل‌هایی که هنوز به‌روزرسانی نشدن (view3d.js / shelves-editor.js / elev)
    window.closetFrameUnit = targetUnit;
    window.currentClosetFrameParts = targetUnit.parts;

    // آپدیت فوری ۲D و ۳D و نمای ارتفاعی
    if (typeof draw === "function") draw();

    if (window.Kitchen3D) {
        if (typeof window.Kitchen3D.renderClosetFrameUnit === "function") {
            window.Kitchen3D.renderClosetFrameUnit();
        } else if (typeof window.Kitchen3D.renderCabinets === "function") {
            window.Kitchen3D.renderCabinets();
        }
        // اطمینان از یک فریم رندر فوری در صورت وجود renderer
        if (window.Kitchen3D.renderer && window.Kitchen3D.scene && window.Kitchen3D.camera) {
            try { window.Kitchen3D.renderer.render(window.Kitchen3D.scene, window.Kitchen3D.camera); } catch (e) {}
        }
    }
    // نمای Babylon — چهارچوب + طبقات
    try {
        if (window.KitchenBabylon && window.KitchenBabylon.isReady) {
            if (typeof window.KitchenBabylon._renderClosetFrameUnits === 'function') {
                window.KitchenBabylon._renderClosetFrameUnits();
            } else if (typeof window.KitchenBabylon.refreshCabinets === 'function') {
                window.KitchenBabylon.refreshCabinets();
            }
        }
    } catch (e) {}

    if (typeof window.refreshElevView === "function") {
        window.refreshElevView();
    } else if (typeof drawFrontElevation === "function") {
        drawFrontElevation();
    }

    closeClosetFrameEditorPanel();
}



// مپ توابع روی Window
window.openClosetFrameEditorPanel = openClosetFrameEditorPanel;
window.closeClosetFrameEditorPanel = closeClosetFrameEditorPanel;
window.addClosetFrame = openClosetFrameEditorPanel;
window.addFramePart = addFramePart;
window.selectFramePart = selectFramePart;
window.setPartOrigin = setPartOrigin;
window.updateSelectedPartFromInputs = updateSelectedPartFromInputs;
window.toggleFramePartOrientation = toggleFramePartOrientation;
window.removeSelectedFramePart = removeSelectedFramePart;
window.applyClosetFrameSettings = applyClosetFrameSettings;
