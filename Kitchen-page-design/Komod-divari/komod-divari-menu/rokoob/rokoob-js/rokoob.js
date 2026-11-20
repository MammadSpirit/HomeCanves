// js/components/rokoob.js

let currentRokoobParts = [];
let selectedRokoobPartId = null;
let selectedRokoobDirection = null; // internal: 'top' | 'bottom' | 'left' | 'right'

// selectedRokoobDirection همیشه کلید نماست: top / bottom / left / right
const ROKOOB_DIR_ORDER = ["top", "bottom", "left", "right"];
// برچسب پیش‌فرض (قطعه عمودی و بخش گروهی)
const ROKOOB_DIR_LABELS = {
    top: "جلو",
    bottom: "عقب",
    left: "چپ",
    right: "راست"
};

/**
 * برچسب جهات بر اساس نوع قطعه:
 * عمودی → جلو / عقب / چپ / راست
 * افقی  → جلو / عقب / بالا / پایین  (به‌جای چپ/راست)
 */
function getRokoobDirLabelsForPart(part) {
    if (part && part.orientation === "horizontal") {
        return {
            top: "جلو",
            bottom: "عقب",
            left: "بالا",
            right: "پایین"
        };
    }
    return {
        top: "جلو",
        bottom: "عقب",
        left: "چپ",
        right: "راست"
    };
}

/**
 * نگاشت جهت نمای روبه‌رو → وجه واقعی قطعه در داده/۳D
 * عمودی: top=جلو(+Z), bottom=عقب, left=چپ, right=راست
 * افقی:  left=جلو(+Z), right=عقب, top=بالای تیر, bottom=پایین تیر
 * تا «جلو» روی همه قطعات یکسان (رو به بیننده) باشد.
 */
function mapViewDirToPartFace(orientation, viewDir) {
    if (orientation === "horizontal") {
        const m = { top: "left", bottom: "right", left: "top", right: "bottom" };
        return m[viewDir] || viewDir;
    }
    return viewDir;
}

function getRokoobDirData(part, viewDir) {
    if (!part || !part.directions) return null;
    const face = mapViewDirToPartFace(part.orientation, viewDir);
    if (!part.directions[face]) {
        part.directions[face] = createDefaultDirectionData(part.length);
    }
    return part.directions[face];
}

/**
 * رنگ پیش‌فرض روکوب (اولین متریال MDF موجود)
 */
function getDefaultRokoobColor() {
    const mat = (window.allMaterials && window.allMaterials.mdf && window.allMaterials.mdf[0])
        || { name: "سفید یخچالی", code: "#FFFFFF" };
    return { name: mat.name, value: mat.texture || mat.code };
}

function createDefaultDirectionData(partLength) {
    return {
        enabled: false,
        align: "center",     // 'top' | 'center' | 'bottom' (قفل تراز عرض)
        color: getDefaultRokoobColor(),
        width: 4,            // عرض (پهنای روکوب)
        thickness: 1.6,      // ضخامت ثابت ورق MDF (1.6 cm)
        length: partLength
    };
}


function openRokoobPanel() {
    const panel = document.getElementById("rokoob-editor-panel");
    if (!panel) return;

    const units = window.closetFrameUnits || [];
    const targetUnit = units.find(u => u.id === window.selectedClosetFrameId);

    if (!targetUnit) {
        alert("لطفاً ابتدا یک چهارچوب کمد دیواری را از روی صحنه انتخاب کنید.");
        return;
    }

    if (targetUnit.parts && targetUnit.parts.length > 0) {
        currentRokoobParts = targetUnit.parts.map(framePart => {
            // 🌟 اگر قبلاً برای همین چهارچوب تنظیمات روکوب ذخیره شده بود، بازیابی‌اش کن
            const existing = (targetUnit.rokoobParts || []).find(p => p.partId === framePart.id);

            const directions = existing
                ? JSON.parse(JSON.stringify(existing.directions))
                : {
                    top: createDefaultDirectionData(framePart.length),
                    bottom: createDefaultDirectionData(framePart.length),
                    left: createDefaultDirectionData(framePart.length),
                    right: createDefaultDirectionData(framePart.length)
                };

            return {
                partId: framePart.id,
                name: framePart.name,
                length: framePart.length,
                orientation: framePart.orientation,
                directions
            };
        });
    } else {
        currentRokoobParts = [];
    }

    selectedRokoobPartId = currentRokoobParts.length > 0 ? currentRokoobParts[0].partId : null;
    selectedRokoobDirection = currentRokoobParts.length > 0 ? "top" : null;

    renderRokoobPartsList();
    renderRokoobBulkSection();
    renderRokoobDirectionsSection();
    renderRokoobSettingsSection();

    panel.classList.add("active");

    setTimeout(renderRokoobPreview, 50);
}

function closeRokoobPanel() {
    const panel = document.getElementById("rokoob-editor-panel");
    if (panel) panel.classList.remove("active");
}

/* ---------------------------------------------------
   ۱. لیست قطعات (قابل انتخاب - تکی)
--------------------------------------------------- */
function renderRokoobPartsList() {
    const container = document.getElementById("rokoob-parts-container");
    if (!container) return;

    container.innerHTML = "";

    if (currentRokoobParts.length === 0) {
        container.innerHTML = `<div style="color:#64748b; text-align:center; padding:16px 8px; font-size:12px;">
            هیچ قطعه‌ای یافت نشد. ابتدا از پنل «چهارچوب» قطعات چهارچوب را بسازید.
        </div>`;
        return;
    }

    currentRokoobParts.forEach(part => {
        const isSelected = part.partId === selectedRokoobPartId;

        const item = document.createElement("div");
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

        item.onclick = () => selectRokoobPart(part.partId);
        container.appendChild(item);
    });
}

function selectRokoobPart(partId) {
    selectedRokoobPartId = partId;
    // با انتخاب قطعه، جهت «جلو» به‌صورت پیش‌فرض انتخاب می‌شود
    selectedRokoobDirection = "top";

    renderRokoobPartsList();
    renderRokoobBulkSection();
    renderRokoobDirectionsSection();
    renderRokoobSettingsSection();
    renderRokoobPreview();
}

function getSelectedRokoobPart() {
    return currentRokoobParts.find(p => p.partId === selectedRokoobPartId) || null;
}

/* ---------------------------------------------------
   ۲. اعمال گروهی + جهت‌های روکوب (نمای روبه‌رو: جلو/عقب/چپ/راست)
--------------------------------------------------- */

/** آیا این جهت نما روی همه قطعات (با نگاشت orientation) فعال است؟ */
function isRokoobDirectionEnabledOnAll(viewDir) {
    if (!currentRokoobParts.length) return false;
    return currentRokoobParts.every(p => {
        const data = getRokoobDirData(p, viewDir);
        return data && data.enabled === true;
    });
}

/** رندر بخش تیک گروهی */
function renderRokoobBulkSection() {
    const container = document.getElementById("rokoob-bulk-directions");
    if (!container) return;
    container.innerHTML = "";

    ROKOOB_DIR_ORDER.forEach(viewDir => {
        const allOn = isRokoobDirectionEnabledOnAll(viewDir);
        const row = document.createElement("label");
        row.style.cssText = `
            display:flex; align-items:center; justify-content:space-between;
            padding:8px 12px; border-radius:8px; cursor:pointer;
            background: ${allOn ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.02)"};
            border: 1px solid ${allOn ? "#22c55e" : "rgba(255,255,255,0.06)"};
        `;
        row.innerHTML = `
            <span style="color:#f8fafc; font-size:12px; display:flex; align-items:center; gap:8px;">
                <input type="checkbox" ${allOn ? "checked" : ""} style="width:16px; height:16px; accent-color:#22c55e;"
                    onchange="toggleRokoobBulkDirection('${viewDir}', this.checked)">
                <strong>${ROKOOB_DIR_LABELS[viewDir]}</strong>
                <span style="color:#94a3b8; font-size:10px;">(همه قطعات)</span>
            </span>
            <span style="font-size:11px; color:${allOn ? "#22c55e" : "#94a3b8"};">${allOn ? "فعال روی همه" : "خاموش"}</span>
        `;
        container.appendChild(row);
    });
}

/** خواندن رنگ گروهی از فیلد UI */
function getRokoobBulkColor() {
    const el = document.getElementById("rokoob-bulk-color-search");
    if (!el) return null;
    const value = el.dataset.selectedValue;
    if (!value) return null;
    return { name: el.value || "انتخاب شده", value: value };
}

/**
 * تیک گروهی: فعال/غیرفعال کردن یک جهت نما روی همه قطعات
 * با نگاشت orientation تا «جلو» روی همه یکسان باشد
 * در صورت فعال شدن، عرض و رنگ گروهی هم اعمال می‌شود
 */
function toggleRokoobBulkDirection(viewDir, enabled) {
    const bulkWidthEl = document.getElementById("rokoob-bulk-width");
    const bulkWidth = bulkWidthEl ? parseFloat(bulkWidthEl.value) : 4;
    const bulkColor = getRokoobBulkColor();

    currentRokoobParts.forEach(part => {
        const data = getRokoobDirData(part, viewDir);
        if (!data) return;
        data.enabled = !!enabled;
        if (enabled && !isNaN(bulkWidth) && bulkWidth > 0) {
            data.width = bulkWidth;
        }
        if (enabled && bulkColor) {
            data.color = { name: bulkColor.name, value: bulkColor.value };
        }
        if (enabled) {
            data.length = part.length;
        }
    });

    if (enabled) selectedRokoobDirection = viewDir;

    renderRokoobBulkSection();
    renderRokoobDirectionsSection();
    renderRokoobSettingsSection();
    renderRokoobPreview();
}
window.toggleRokoobBulkDirection = toggleRokoobBulkDirection;

function updateRokoobBulkWidthFromInput() {
    // فقط مقدار را نگه می‌دارد؛ اعمال با دکمه
}
window.updateRokoobBulkWidthFromInput = updateRokoobBulkWidthFromInput;

/** اعمال عرض مشترک به همه جهت‌های فعال (با نگاشت نما) روی همه قطعات */
function applyRokoobBulkWidthToAll() {
    const bulkWidthEl = document.getElementById("rokoob-bulk-width");
    const bulkWidth = bulkWidthEl ? parseFloat(bulkWidthEl.value) : NaN;
    if (isNaN(bulkWidth) || bulkWidth <= 0) return;

    currentRokoobParts.forEach(part => {
        ROKOOB_DIR_ORDER.forEach(viewDir => {
            const data = getRokoobDirData(part, viewDir);
            if (data && data.enabled) {
                data.width = bulkWidth;
            }
        });
    });

    renderRokoobSettingsSection();
    renderRokoobPreview();
}
window.applyRokoobBulkWidthToAll = applyRokoobBulkWidthToAll;

/** باز کردن مودال رنگ برای اعمال گروهی */
function openRokoobBulkColorModal() {
    if (typeof window.openUniversalModal !== "function") return;

    window.openUniversalModal(
        "انتخاب رنگ گروهی روکوب",
        "mdf",
        function (material) {
            selectRokoobBulkColor(material);
        }
    );
}
window.openRokoobBulkColorModal = openRokoobBulkColorModal;

/** ذخیره رنگ گروهی در UI و اعمال فوری روی همه جهت‌های فعال */
function selectRokoobBulkColor(material) {
    const colorValue = material.texture || material.code || "#ffffff";
    const colorName = material.name || "انتخاب شده";

    const colorInput = document.getElementById("rokoob-bulk-color-search");
    if (colorInput) {
        colorInput.value = colorName;
        colorInput.dataset.selectedValue = colorValue;
    }

    // بلافاصله روی همه جهت‌های فعال اعمال شود
    applyRokoobBulkColorToAll();
}
window.selectRokoobBulkColor = selectRokoobBulkColor;

/** اعمال رنگ گروهی به همه جهت‌های فعال روی همه قطعات */
function applyRokoobBulkColorToAll() {
    const bulkColor = getRokoobBulkColor();
    if (!bulkColor) return;

    currentRokoobParts.forEach(part => {
        ROKOOB_DIR_ORDER.forEach(viewDir => {
            const data = getRokoobDirData(part, viewDir);
            if (data && data.enabled) {
                data.color = { name: bulkColor.name, value: bulkColor.value };
            }
        });
    });

    renderRokoobSettingsSection();
    renderRokoobPreview();
}
window.applyRokoobBulkColorToAll = applyRokoobBulkColorToAll;

function renderRokoobDirectionsSection() {
    const wrapper = document.getElementById("rokoob-directions-wrapper");
    const container = document.getElementById("rokoob-directions-container");
    if (!wrapper || !container) return;

    const part = getSelectedRokoobPart();

    wrapper.style.display = "block";
    container.innerHTML = "";

    if (!part) {
        container.innerHTML = `<div style="color:#64748b; text-align:center; padding:12px; font-size:12px;">
            ابتدا یک قطعه از لیست بالا انتخاب کنید.
        </div>`;
        return;
    }

    const labels = getRokoobDirLabelsForPart(part);

    ROKOOB_DIR_ORDER.forEach(viewDir => {
        const data = getRokoobDirData(part, viewDir);
        const isEnabled = !!(data && data.enabled);
        const isSelected = selectedRokoobDirection === viewDir;

        const row = document.createElement("div");
        row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: ${isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)'};
            border: 1px solid ${isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)'};
            border-radius: 8px;
            cursor: pointer;
        `;
        row.onclick = () => selectRokoobDirection(viewDir);

        row.innerHTML = `
            <span style="color:#f8fafc; font-size:12px; font-weight:${isSelected ? 'bold' : 'normal'};">${labels[viewDir]}</span>
            <button type="button"
                style="border:none; border-radius:999px; padding:4px 14px; font-size:10px; font-weight:bold; cursor:pointer; background:${isEnabled ? '#22c55e' : '#475569'}; color:#fff; min-width:64px;"
                onclick="event.stopPropagation(); toggleRokoobDirectionEnabled('${viewDir}')">
                ${isEnabled ? 'فعال' : 'غیرفعال'}
            </button>
        `;

        container.appendChild(row);
    });
}

/**
 * فقط انتخاب یک جهت نما برای دیدن/ویرایش تنظیمات
 */
function selectRokoobDirection(viewDir) {
    selectedRokoobDirection = viewDir;
    renderRokoobDirectionsSection();
    renderRokoobSettingsSection();
    renderRokoobPreview();
}

/**
 * فعال/غیرفعال کردن جهت نما روی قطعه انتخاب‌شده (با نگاشت orientation)
 */
function toggleRokoobDirectionEnabled(viewDir) {
    const part = getSelectedRokoobPart();
    if (!part) return;

    const data = getRokoobDirData(part, viewDir);
    if (!data) return;
    data.enabled = !data.enabled;
    selectedRokoobDirection = viewDir;

    renderRokoobBulkSection();
    renderRokoobDirectionsSection();
    renderRokoobSettingsSection();
    renderRokoobPreview();
}

/* ---------------------------------------------------
   ۳. تنظیمات جهت انتخاب‌شده (تراز / رنگ / طول‌وعرض) - همیشه دیده می‌شود
--------------------------------------------------- */
function renderRokoobSettingsSection() {
    const wrapper = document.getElementById("rokoob-settings-wrapper");
    if (!wrapper) return;

    const part = getSelectedRokoobPart();
    const data = (part && selectedRokoobDirection) ? getRokoobDirData(part, selectedRokoobDirection) : null;

    wrapper.style.display = "block";

    if (!part || !selectedRokoobDirection || !data) {
        document.getElementById("rokoob-settings-title").textContent = "-";
        return;
    }

    const labels = getRokoobDirLabelsForPart(part);
    document.getElementById("rokoob-settings-title").textContent =
        `${part.name} — ${labels[selectedRokoobDirection] || selectedRokoobDirection}`;

    document.getElementById("rokoob-width-input").value = data.width;
    document.getElementById("rokoob-length-input").value = data.length;

    const colorInput = document.getElementById("rokoob-color-search");
    if (colorInput) {
        colorInput.value = data.color.name;
        colorInput.dataset.selectedValue = data.color.value;
    }

    updateRokoobAlignButtonsUI(data.align);
}

function updateRokoobAlignButtonsUI(align) {
    const btnTop = document.getElementById("rokoob-align-top");
    const btnCenter = document.getElementById("rokoob-align-center");
    const btnBottom = document.getElementById("rokoob-align-bottom");
    if (!btnTop || !btnCenter || !btnBottom) return;

    btnTop.style.background = align === 'top' ? '#0284c7' : '#475569';
    btnCenter.style.background = align === 'center' ? '#0284c7' : '#475569';
    btnBottom.style.background = align === 'bottom' ? '#0284c7' : '#475569';
}

function setRokoobAlign(align) {
    const part = getSelectedRokoobPart();
    if (!part || !selectedRokoobDirection) return;

    const data = getRokoobDirData(part, selectedRokoobDirection);
    if (!data) return;
    data.align = align;
    updateRokoobAlignButtonsUI(align);
    renderRokoobPreview();
}

function updateRokoobDimensionsFromInputs() {
    const part = getSelectedRokoobPart();
    if (!part || !selectedRokoobDirection) return;

    const data = getRokoobDirData(part, selectedRokoobDirection);
    if (!data) return;
    const widthVal = parseFloat(document.getElementById("rokoob-width-input").value);
    const lengthVal = parseFloat(document.getElementById("rokoob-length-input").value);

    data.width = (isNaN(widthVal) || widthVal <= 0) ? data.width : widthVal;
    data.length = (isNaN(lengthVal) || lengthVal <= 0) ? data.length : lengthVal;

    renderRokoobPreview();
}

/* ---------------------------------------------------
   رنگ - اتصال به همون مودال یونیورسال پروژه (مثل پنل تاج)
--------------------------------------------------- */
function openRokoobColorModal() {
    if (typeof window.openUniversalModal !== 'function') return;

    window.openUniversalModal(
        "انتخاب رنگ و جنس روکوب",
        "mdf",
        function (material) {
            selectRokoobColor(material);
        }
    );
}

function selectRokoobColor(material) {
    const part = getSelectedRokoobPart();
    if (!part || !selectedRokoobDirection) return;

    const colorValue = material.texture || material.code || "#ffffff";
    const colorName = material.name || "انتخاب شده";

    const data = getRokoobDirData(part, selectedRokoobDirection);
    if (!data) return;
    data.color = { name: colorName, value: colorValue };

    const colorInput = document.getElementById("rokoob-color-search");
    if (colorInput) {
        colorInput.value = colorName;
        colorInput.dataset.selectedValue = colorValue;
    }

    renderRokoobPreview();
}

/* ---------------------------------------------------
   ۴. پیش‌نمایش سه‌بعدی زنده قطعه
   - قطعه افقی → افقی | قطعه عمودی → عمودی
   - بدون چرخش با موس | نمایش بزرگ‌تر
--------------------------------------------------- */
let rkPreviewScene, rkPreviewCamera, rkPreviewRenderer, rkPreviewGroup;

function initRokoobPreview() {
    if (rkPreviewRenderer) return;
    const container = document.getElementById("rokoob-preview-3d");
    if (!container || typeof THREE === "undefined") return;

    rkPreviewScene = new THREE.Scene();
    rkPreviewScene.background = new THREE.Color(0x090d16);

    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    rkPreviewCamera = new THREE.PerspectiveCamera(40, w / h, 1, 5000);
    // زاویه ثابت مایل روبرو — بدون چرخش کاربر
    rkPreviewCamera.position.set(120, 100, 220);
    rkPreviewCamera.lookAt(0, 0, 0);

    rkPreviewRenderer = new THREE.WebGLRenderer({ antialias: true });
    rkPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;
    rkPreviewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    rkPreviewRenderer.toneMappingExposure = 1.05;
    rkPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rkPreviewRenderer.setSize(w, h);
    container.innerHTML = "";
    container.appendChild(rkPreviewRenderer.domElement);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.1);
    light1.position.set(120, 200, 160);
    rkPreviewScene.add(light1);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.45);
    light2.position.set(-100, 80, -80);
    rkPreviewScene.add(light2);
    rkPreviewScene.add(new THREE.AmbientLight(0xffffff, 0.55));

    rkPreviewGroup = new THREE.Group();
    rkPreviewScene.add(rkPreviewGroup);

    // چرخش حذف شد — فقط رندر ثابت
    animateRokoobPreview();
}

function animateRokoobPreview() {
    requestAnimationFrame(animateRokoobPreview);
    if (rkPreviewRenderer && rkPreviewScene && rkPreviewCamera) {
        rkPreviewRenderer.render(rkPreviewScene, rkPreviewCamera);
    }
}

function makeRokoobMaterial(colorValue) {
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.02 });
    if (colorValue && colorValue.startsWith("#")) {
        mat.color.set(colorValue);
    } else if (colorValue) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        const tex = loader.load(colorValue);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        mat.map = tex;
        mat.color.set(0xffffff);
    } else {
        mat.color.set(0xaaaaaa);
    }
    return mat;
}

function buildRokoobPreviewMesh() {
    if (!rkPreviewGroup) return;
    rkPreviewGroup.clear();
    rkPreviewGroup.rotation.set(0, 0, 0);

    const part = getSelectedRokoobPart();
    if (!part) return;

    const FRAME_THICKNESS = 5.5;
    const beamLength = Math.max(part.length, 1);
    const isVertical = part.orientation === "vertical";

    // مقیاس بزرگ‌تر برای دیده شدن بهتر
    const targetSpan = 320;
    const scale = Math.min(1.35, targetSpan / beamLength);
    const L = beamLength * scale;
    const T = FRAME_THICKNESS * scale;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9c6b45, roughness: 0.75 });

    // افقی: طول روی X | عمودی: طول روی Y
    let body;
    if (isVertical) {
        body = new THREE.Mesh(new THREE.BoxGeometry(T, L, T), bodyMat);
    } else {
        body = new THREE.Mesh(new THREE.BoxGeometry(L, T, T), bodyMat);
    }
    rkPreviewGroup.add(body);

    const dirList = ["top", "bottom", "left", "right"];

    dirList.forEach(dir => {
        const data = part.directions[dir];
        if (!data || !data.enabled) return;

        const trimLen = Math.max(data.length, 0.1) * scale;
        const trimWidth = Math.max(data.width, 0.1) * scale;
        const trimThick = (data.thickness || 1.6) * scale;

        let offsetCross = 0;
        if (data.align === "top") {
            offsetCross = (T / 2) - (trimWidth / 2);
        } else if (data.align === "bottom") {
            offsetCross = -(T / 2) + (trimWidth / 2);
        }

        const mat = makeRokoobMaterial(data.color && data.color.value);
        let mesh;

        if (isVertical) {
            // تیر عمودی: طول روی Y — top=جلو(+Z), bottom=عقب, left=چپ, right=راست
            if (dir === "top") {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(trimWidth, trimLen, trimThick), mat);
                mesh.position.set(offsetCross, 0, T / 2 + trimThick / 2);
            } else if (dir === "bottom") {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(trimWidth, trimLen, trimThick), mat);
                mesh.position.set(offsetCross, 0, -T / 2 - trimThick / 2);
            } else if (dir === "left") {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(trimThick, trimLen, trimWidth), mat);
                mesh.position.set(-T / 2 - trimThick / 2, 0, offsetCross);
            } else if (dir === "right") {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(trimThick, trimLen, trimWidth), mat);
                mesh.position.set(T / 2 + trimThick / 2, 0, offsetCross);
            }
        } else {
            // تیر افقی: طول روی X — مطابق منطق ۳D اصلی
            if (dir === "top") {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(trimLen, trimThick, trimWidth), mat);
                mesh.position.set(0, T / 2 + trimThick / 2, offsetCross);
            } else if (dir === "bottom") {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(trimLen, trimThick, trimWidth), mat);
                mesh.position.set(0, -T / 2 - trimThick / 2, offsetCross);
            } else if (dir === "left") {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(trimLen, trimWidth, trimThick), mat);
                mesh.position.set(0, offsetCross, T / 2 + trimThick / 2);
            } else if (dir === "right") {
                mesh = new THREE.Mesh(new THREE.BoxGeometry(trimLen, trimWidth, trimThick), mat);
                mesh.position.set(0, offsetCross, -T / 2 - trimThick / 2);
            }
        }

        if (mesh) rkPreviewGroup.add(mesh);
    });

    // دوربین را با اندازه قطعه تنظیم کن تا پرتر دیده شود
    if (rkPreviewCamera) {
        const span = Math.max(L, T * 3, 80);
        const dist = span * 1.15;
        if (isVertical) {
            rkPreviewCamera.position.set(dist * 0.75, dist * 0.15, dist * 0.95);
        } else {
            rkPreviewCamera.position.set(dist * 0.35, dist * 0.55, dist * 1.05);
        }
        rkPreviewCamera.lookAt(0, 0, 0);
        rkPreviewCamera.updateProjectionMatrix();
    }
}


/* ---------------------------------------------------
   فراخوانی رندر زنده در صحنه اصلی ۳D
--------------------------------------------------- */
function notifyMainSceneToUpdateRokoob() {
    const units = window.closetFrameUnits || [];
    const targetUnit = units.find(u => u.id === window.selectedClosetFrameId);
    if (!targetUnit) return;

    // 🌟 ذخیره تنظیمات روکوب فقط روی همین چهارچوب، نه سراسری
    targetUnit.rokoobParts = JSON.parse(JSON.stringify(currentRokoobParts));

    if (window.Kitchen3D && typeof window.Kitchen3D.renderCabinets === 'function') {
        window.Kitchen3D.renderCabinets();
    } else if (typeof renderClosetFrameUnit === 'function') {
        renderClosetFrameUnit();
    }
}

/**
 * پیش‌نمایش کلی چهارچوب — موقعیت قطعه انتخاب‌شده را در کل نما نشان می‌دهد
 */
function renderRokoobOverviewPreview() {
    const svg = document.getElementById("rokoob-overview-svg");
    if (!svg) return;

    const units = window.closetFrameUnits || [];
    const targetUnit = units.find(u => u.id === window.selectedClosetFrameId);
    const parts = (targetUnit && targetUnit.parts) ? targetUnit.parts : [];
    if (!parts.length) {
        svg.innerHTML = "";
        return;
    }

    const FRAME_T = 5.5;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    parts.forEach(p => {
        const pW = p.orientation === "horizontal" ? p.length : FRAME_T;
        const pH = p.orientation === "vertical" ? p.length : FRAME_T;
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x + pW);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y + pH);
    });
    if (!isFinite(minX)) { svg.innerHTML = ""; return; }

    const pad = 12;
    const contentW = Math.max(maxX - minX, 1);
    const contentH = Math.max(maxY - minY, 1);
    const vbW = contentW + pad * 2;
    const vbH = contentH + pad * 2;
    // مختصات SVG: Y معکوس برای نمایش طبیعی
    svg.setAttribute("viewBox", `${minX - pad} ${-(maxY + pad)} ${vbW} ${vbH}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    let html = "";
    // شبکه کم‌رنگ
    html += `<rect x="${minX - pad}" y="${-(maxY + pad)}" width="${vbW}" height="${vbH}" fill="#090d16"/>`;

    parts.forEach(p => {
        const pW = p.orientation === "horizontal" ? p.length : FRAME_T;
        const pH = p.orientation === "vertical" ? p.length : FRAME_T;
        const isSel = p.id === selectedRokoobPartId;
        const rx = p.x;
        const ry = -(p.y + pH);
        const fill = isSel ? "#38bdf8" : "#a9754f";
        const stroke = isSel ? "#e0f2fe" : "#64748b";
        const sw = isSel ? 1.2 : 0.6;
        html += `<rect x="${rx}" y="${ry}" width="${pW}" height="${pH}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="0.8" opacity="${isSel ? 1 : 0.85}"/>`;
        if (isSel) {
            html += `<rect x="${rx - 1.5}" y="${ry - 1.5}" width="${pW + 3}" height="${pH + 3}" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.45" rx="1.5"/>`;
        }
        // نام قطعه اگر جا باشد
        if (Math.min(pW, pH) > 8) {
            html += `<text x="${rx + pW / 2}" y="${ry + pH / 2}" fill="${isSel ? "#0f172a" : "#f8fafc"}" font-size="4.5" font-family="Tahoma" text-anchor="middle" dominant-baseline="middle">${p.name || ""}</text>`;
        }
    });

    svg.innerHTML = html;
}

function renderRokoobPreview() {
    if (typeof THREE === "undefined") return;
    if (!rkPreviewRenderer) initRokoobPreview();
    // هم‌اندازه با کادر (مثلاً ارتفاع ۲۸۰)
    const container = document.getElementById("rokoob-preview-3d");
    if (container && rkPreviewRenderer && rkPreviewCamera) {
        const w = Math.max(container.clientWidth, 1);
        const h = Math.max(container.clientHeight, 1);
        rkPreviewRenderer.setSize(w, h);
        rkPreviewCamera.aspect = w / h;
        rkPreviewCamera.updateProjectionMatrix();
    }
    buildRokoobPreviewMesh();
    renderRokoobOverviewPreview();
    
    // ⭐ لایو بروزرسانی صحنه ۳D کمد دیواری
    notifyMainSceneToUpdateRokoob();
}

/* ---------------------------------------------------
   ثبت نهایی
--------------------------------------------------- */
function applyRokoobSettings() {
    if (!currentRokoobParts || currentRokoobParts.length === 0) return;

    notifyMainSceneToUpdateRokoob();
    closeRokoobPanel();
}


// مپ توابع روی Window
window.openRokoobPanel = openRokoobPanel;
window.closeRokoobPanel = closeRokoobPanel;
window.selectRokoobPart = selectRokoobPart;
window.selectRokoobDirection = selectRokoobDirection;
window.toggleRokoobDirectionEnabled = toggleRokoobDirectionEnabled;
window.setRokoobAlign = setRokoobAlign;
window.updateRokoobDimensionsFromInputs = updateRokoobDimensionsFromInputs;
window.openRokoobColorModal = openRokoobColorModal;
window.applyRokoobSettings = applyRokoobSettings;
