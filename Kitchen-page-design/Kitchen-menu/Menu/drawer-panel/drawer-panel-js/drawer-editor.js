// متغیرهای مربوط به پیش‌نمایش سه‌بعدی و دیتای موقت
let drawerPreviewScene, drawerPreviewCamera, drawerPreviewRenderer, drawerPreviewGroup;
let currentDrawersData = []; // آرایه نگهداری تنظیمات اختصاصی هر کشو
// حالت کمد دیواری (وقتی چهارچوب انتخاب شده)
let drawerEditorClosetMode = false;
let drawerEditorClosetUnit = null;
let drawerEditorClosetCellId = null;
let drawerEditorClosetColumnIndex = 0;
let drawerEditorClosetColumns = []; // کپی موقت ستون‌ها

// تابع اصلی برای باز کردن پنل ویرایش کشو — فقط یونیت آشپزخانه
function openDrawerEditorPanel() {
    drawerEditorClosetMode = false;
    drawerEditorClosetUnit = null;
    drawerEditorClosetCellId = null;

    const colCountGroup = document.getElementById("closet-column-count-group");
    const colTabsGroup = document.getElementById("closet-column-tabs-group");
    const housingGroup = document.getElementById("closet-housing-settings-group");
    if (colCountGroup) colCountGroup.style.display = "none";
    if (colTabsGroup) colTabsGroup.style.display = "none";
    if (housingGroup) housingGroup.style.display = "none";
    drawerEditorClosetColumns = [];
    // نمایش مجدد گزینه‌های مخصوص یونیت (ممکن است در حالت کمد مخفی شده باشند)
    const legsElRestore = document.getElementById("drawer-legs-enabled");
    if (legsElRestore) {
        const g = legsElRestore.closest(".drawer-input-group");
        if (g) g.style.display = "";
    }

    if (typeof selectedId === 'undefined' || selectedId === -1) {
        alert("لطفاً ابتدا یک کابینت را انتخاب کنید!");
        return;
    }

    const currentCabinet = cabinets.find((c) => c.id === selectedId);
    if (!currentCabinet) return;

    document.getElementById("drawer-panel-cabinet-id").textContent = selectedId;

        const enableCheckbox = document.getElementById("drawer-enabled");
    const labelParent = enableCheckbox.parentElement;

    if (currentCabinet.isBaseWithDrawer) {
        // تغییر نام به "تک کشو" و قفل کردن دکمه
        labelParent.childNodes[labelParent.childNodes.length - 1].textContent = " حالت تک درب / تک کشو (مخصوص این یونیت)";
        enableCheckbox.checked = true;
        enableCheckbox.disabled = true;
    } else {
        // حالت عادی
        labelParent.childNodes[labelParent.childNodes.length - 1].textContent = " تبدیل کابینت به دراور (کشودار)";
        enableCheckbox.checked = currentCabinet.isDrawerBody === true;
        enableCheckbox.disabled = false;
    }

    
    // بارگذاری وضعیت سقف و پایه
    document.getElementById("drawer-top-panel").checked = currentCabinet.drawerTopPanel || false;
    document.getElementById("drawer-legs-enabled").checked = currentCabinet.drawerLegs !== false; 


    // =======================================================
    // تعداد و فاصله پایه
    let count = currentCabinet.drawerCount || 3;
    if (currentCabinet.isBaseWithDrawer) {
        count = 1; // اجبار به 1 کشو
        document.getElementById("drawer-count").value = 1;
        document.getElementById("drawer-count").disabled = true;
    } else {
        document.getElementById("drawer-count").value = count;
        document.getElementById("drawer-count").disabled = false;
    }

    document.getElementById("drawer-gap").value = currentCabinet.drawerGap !== undefined ? currentCabinet.drawerGap : 0.2;

    // بارگذاری دیتای کشوها
    currentDrawersData = currentCabinet.drawersData ? JSON.parse(JSON.stringify(currentCabinet.drawersData)) : [];
    // پرداخت سطح پیش‌فرض برای کشوهای قدیمی بدون finish
    currentDrawersData.forEach(d => {
        if (d && !d.finish) d.finish = 'matte';
    });
    adjustDrawersDataSize(count);

    renderDynamicDrawerFields();

    const panel = document.getElementById("drawer-editor-panel");
    if (panel) panel.classList.add("active");

    try {
        if (typeof initDrawerPreview === "function") initDrawerPreview();
        if (typeof updateDrawerPreview === "function") updateDrawerPreview();
    } catch (error) {
        console.error("خطا در پیش‌نمایش:", error);
    }
}


// تابع تنظیم اندازه آرایه داده‌های کشو هنگام تغییر تعداد کشوها
function adjustDrawersDataSize(count) {
    if (currentDrawersData.length < count) {
        // اضافه کردن کشوی جدید با مقادیر پیش‌فرض (هم درب و هم بدنه داخلی)
        for (let i = currentDrawersData.length; i < count; i++) {
            currentDrawersData.push({ 
                height: 17,       // ارتفاع بدنه داخلی پیش‌فرض
                doorHeight: 17,   // ارتفاع درب کشو پیش‌فرض
                depth: 45, 
                material: 'mdf', 
                color: '',
                finish: 'matte'
            });
        }
    } else if (currentDrawersData.length > count) {
        // حذف کشوهای اضافی
        currentDrawersData = currentDrawersData.slice(0, count);
    }
}


// این تابع با تغییر input تعداد کشو اجرا می‌شود
function handleDrawerCountChange() {
    const count = parseInt(document.getElementById('drawer-count').value) || 1;
    adjustDrawersDataSize(count);
    renderDynamicDrawerFields(); // بازسازی فیلدهای اختصاصی
    updateDrawerPreview();       // آپدیت پیش‌نمایش
}

// تولید HTML تنظیمات برای هر کشو به صورت داینامیک
// تولید HTML تنظیمات برای هر کشو به صورت داینامیک
function renderDynamicDrawerFields() {
    const container = document.getElementById("dynamic-drawers-container");
    container.innerHTML = ""; // پاک کردن قبلی‌ها

    currentDrawersData.forEach((drawer, index) => {
        const drawerNum = index + 1;

        const html = `
            <div class="drawer-item-box" style="background: #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #334155;">
                <h5 style="color: #cbd5e1; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 8px;">
                    تنظیمات بدنه داخلی کشوی ${drawerNum} (از بالا)
                </h5>

                <div class="size-input-group">
                    <label>ارتفاع بدنه داخلی (سانتی‌متر)</label>
                    <input type="number" value="${drawer.height || ''}" min="5" max="100" class="modern-input" oninput="updateSingleDrawerData(${index}, 'height', this.value)">
                </div>

                <div class="size-input-group">
                    <label>عمق داخلی کشو (سانتی‌متر)</label>
                    <input type="number" value="${drawer.depth || ''}" min="10" max="100" class="modern-input" oninput="updateSingleDrawerData(${index}, 'depth', this.value)">
                </div>

                <div class="size-input-group">
                    <label>جنس ورق بدنه</label>
                    <select class="modern-select" onchange="updateSingleDrawerData(${index}, 'material', this.value); renderDynamicDrawerFields();">
                        <option value="mdf" ${drawer.material === 'mdf' ? 'selected' : ''}>MDF (ام دی اف)</option>
                        <option value="highGloss" ${drawer.material === 'highGloss' ? 'selected' : ''}>High-Gloss (هایگلاس)</option>
                        <option value="leteron" ${drawer.material === 'leteron' ? 'selected' : ''}>Leteron (لترون)</option>
                    </select>
                </div>

               <div class="size-input-group">
                    <label>رنگ و طرح بدنه</label>
                    <div class="color-search-container">
                        <input type="text" 
                            value="${drawer.materialName || drawer.color || ''}" 
                            placeholder="برای انتخاب کلیک کنید" 
                            class="color-search-input modern-input" 
                            readonly 
                            onclick="openDrawerMaterialWithUniversalModal(${index})">
                    </div>
                </div>

                <div class="size-input-group" style="margin-bottom: 0;">
                    <label>پرداخت سطح (نور / براقیت)</label>
                    <select class="modern-select" onchange="updateSingleDrawerData(${index}, 'finish', this.value)">
                        <option value="matte" ${(drawer.finish || 'matte') === 'matte' ? 'selected' : ''}>مات (Matte)</option>
                        <option value="semiMatte" ${drawer.finish === 'semiMatte' ? 'selected' : ''}>نیمه‌مات</option>
                        <option value="satin" ${drawer.finish === 'satin' ? 'selected' : ''}>ساتین</option>
                        <option value="highGloss" ${drawer.finish === 'highGloss' ? 'selected' : ''}>براق / های‌گلاس</option>
                    </select>
                </div>

            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}




// آپدیت کردن دیتای یک کشوی خاص
function updateSingleDrawerData(index, key, value) {
    if (key === 'height' || key === 'depth') value = parseFloat(value) || 0;
    currentDrawersData[index][key] = value;
    updateDrawerPreview();
}

// تابع فرضی برای باز کردن مودال رنگ اختصاصی کشو (باید به سیستم رنگ‌های خودتان متصل شود)
function openDrawerColorModal(index) {
    // در اینجا باید مودال رنگ خود را باز کنید و رنگ انتخاب شده را 
    // درون currentDrawersData[index].color ذخیره کنید.
    console.log("باز کردن مودال رنگ برای کشوی شماره: ", index + 1);
    // برای تست فعلاً یک الرت ساده:
    // alert("مودال انتخاب رنگ برای کشوی " + (index + 1) + " باز می‌شود.");
}

function closeDrawerEditorPanel() {
    const panel = document.getElementById('drawer-editor-panel');
    if(panel) panel.classList.remove('active');
    drawerEditorClosetMode = false;
    drawerEditorClosetUnit = null;
    drawerEditorClosetCellId = null;
}

/**
 * ورودی از منوی مدیریت کمد — فقط با چهارچوب انتخاب‌شده
 */
function openClosetDrawerManagePanel() {
    const units = window.closetFrameUnits || [];
    const unit = units.find(u => u.id === window.selectedClosetFrameId);
    if (!unit) {
        alert("لطفاً ابتدا یک چهارچوب کمد دیواری را از روی صحنه انتخاب کنید.");
        return;
    }
    openDrawerEditorPanelForCloset(unit);
}
window.openClosetDrawerManagePanel = openClosetDrawerManagePanel;

/**
 * باز کردن پنل کشو برای چهارچوب کمد دیواری
 * (فعلاً همان UI یونیت — پیش‌نمایش ساختار کمد؛ تنظیمات بیشتر بعداً)
 */
function openDrawerEditorPanelForCloset(unit) {
    drawerEditorClosetMode = true;
    drawerEditorClosetUnit = unit;
    drawerEditorClosetColumnIndex = 0;
    if (!unit.frameCellDrawers) unit.frameCellDrawers = {};

    let cells = [];
    if (typeof detectClosetFrameCells === "function") {
        cells = detectClosetFrameCells(unit) || [];
    }
    const drawerKeys = Object.keys(unit.frameCellDrawers || {}).filter(
        k => unit.frameCellDrawers[k] && unit.frameCellDrawers[k].enabled
    );
    drawerEditorClosetCellId = drawerKeys[0] || (cells[0] && cells[0].id) || null;

    let cfg = drawerEditorClosetCellId
        ? (unit.frameCellDrawers[drawerEditorClosetCellId] || {})
        : {};
    if (typeof window.normalizeKeshoDrawerCfg === "function") {
        cfg = window.normalizeKeshoDrawerCfg(cfg);
    }
    drawerEditorClosetColumns = Array.isArray(cfg.columns)
        ? JSON.parse(JSON.stringify(cfg.columns))
        : [{ drawerCount: 1, drawerGap: 0.2, drawersData: [{ height: 17, doorHeight: 17, depth: 45, material: "mdf", color: "", finish: "matte" }] }];

    const idEl = document.getElementById("drawer-panel-cabinet-id");
    if (idEl) idEl.textContent = "کمد " + (unit.id || "-");

    const enableCheckbox = document.getElementById("drawer-enabled");
    if (enableCheckbox) {
        enableCheckbox.checked = !!(cfg.enabled);
        enableCheckbox.disabled = false;
        const labelParent = enableCheckbox.parentElement;
        if (labelParent && labelParent.childNodes.length) {
            labelParent.childNodes[labelParent.childNodes.length - 1].textContent =
                " فعال بودن کشو برای بخش انتخاب‌شده چهارچوب";
        }
    }

    // نمایش کنترل ستون‌ها فقط برای کشو معمولی
    // معمولی / مخفی / ریلی: ردیف و محل قرارگیری
    const isMultiOk = ((cfg.drawerType || "normal") === "normal"
        || cfg.drawerType === "hidden"
        || cfg.drawerType === "sliding");
    const colCountGroup = document.getElementById("closet-column-count-group");
    const colTabsGroup = document.getElementById("closet-column-tabs-group");
    const housingGroup = document.getElementById("closet-housing-settings-group");
    if (colCountGroup) colCountGroup.style.display = isMultiOk ? "" : "none";
    if (colTabsGroup) colTabsGroup.style.display = isMultiOk ? "" : "none";
    if (housingGroup) housingGroup.style.display = isMultiOk ? "" : "none";

    // بارگذاری تنظیمات محل قرارگیری
    const sidePerEl = document.getElementById("closet-housing-side-per");
    const stripEl = document.getElementById("closet-housing-strip-depth");
    const wallEl = document.getElementById("closet-housing-wall-thick");
    const depthEl = document.getElementById("closet-housing-depth");
    const housing = cfg.housing || {};
    if (sidePerEl) sidePerEl.value = (housing.sidePerDrawer !== undefined) ? housing.sidePerDrawer : 22.5;
    if (stripEl) stripEl.value = (housing.stripDepth !== undefined) ? housing.stripDepth : 12;
    if (wallEl) wallEl.value = (housing.wallThickness !== undefined) ? housing.wallThickness : 1.6;
    if (depthEl) depthEl.value = (housing.drawerDepth !== undefined) ? housing.drawerDepth
        : ((cfg.drawerDepth !== undefined) ? cfg.drawerDepth : 50);
    const widthEl = document.getElementById("closet-housing-width");
    if (widthEl) {
        widthEl.value = (housing.width !== undefined && housing.width !== null && housing.width !== "")
            ? housing.width
            : "";
    }
    const alignVal = housing.align || "center";
    const alignHidden = document.getElementById("closet-housing-align-value");
    if (alignHidden) alignHidden.value = alignVal;
    if (typeof updateClosetHousingAlignButtons === "function") {
        updateClosetHousingAlignButtons(alignVal);
    }

    const colCountEl = document.getElementById("closet-column-count");
    if (colCountEl) {
        colCountEl.value = Math.max(1, Math.min(3, cfg.columnCount || drawerEditorClosetColumns.length || 1));
    }

    const topEl = document.getElementById("drawer-top-panel");
    if (topEl) topEl.checked = !!cfg.drawerTopPanel;
    const legsEl = document.getElementById("drawer-legs-enabled");
    if (legsEl) {
        legsEl.checked = false;
        const g = legsEl.closest(".drawer-input-group");
        if (g) g.style.display = "none";
    }

    renderClosetColumnTabs();
    loadClosetColumnIntoForm(drawerEditorClosetColumnIndex);

    const panel = document.getElementById("drawer-editor-panel");
    if (panel) panel.classList.add("active");

    try {
        if (typeof initDrawerPreview === "function") initDrawerPreview();
        if (typeof updateDrawerPreview === "function") updateDrawerPreview();
    } catch (error) {
        console.error("خطا در پیش‌نمایش کشو کمد:", error);
    }
}

function renderClosetColumnTabs() {
    const wrap = document.getElementById("closet-column-tabs");
    if (!wrap) return;
    wrap.innerHTML = "";
    const n = drawerEditorClosetColumns.length || 1;
    for (let i = 0; i < n; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "ستون " + (i + 1);
        const active = i === drawerEditorClosetColumnIndex;
        btn.style.cssText = "padding:6px 12px; border-radius:8px; border:1px solid " +
            (active ? "#22c55e" : "#334155") + "; background:" +
            (active ? "#22c55e" : "transparent") + "; color:" +
            (active ? "#fff" : "#cbd5e1") + "; font-size:12px; cursor:pointer;";
        btn.onclick = () => selectClosetDrawerColumn(i);
        wrap.appendChild(btn);
    }
}

function saveCurrentClosetColumnFromForm() {
    if (!drawerEditorClosetMode) return;
    const idx = drawerEditorClosetColumnIndex;
    if (!drawerEditorClosetColumns[idx]) {
        drawerEditorClosetColumns[idx] = { drawerCount: 1, drawerGap: 0.2, drawersData: [] };
    }
    const count = parseInt(document.getElementById("drawer-count").value, 10) || 1;
    const gap = parseFloat(document.getElementById("drawer-gap").value);
    drawerEditorClosetColumns[idx].drawerCount = count;
    drawerEditorClosetColumns[idx].drawerGap = isNaN(gap) ? 0.2 : gap;
    drawerEditorClosetColumns[idx].drawersData = JSON.parse(JSON.stringify(currentDrawersData));
}

function loadClosetColumnIntoForm(idx) {
    drawerEditorClosetColumnIndex = idx;
    const col = drawerEditorClosetColumns[idx] || {
        drawerCount: 1,
        drawerGap: 0.2,
        drawersData: [{ height: 17, doorHeight: 17, depth: 45, material: "mdf", color: "", finish: "matte" }]
    };
    const count = Math.max(1, parseInt(col.drawerCount, 10) || 1);
    const countEl = document.getElementById("drawer-count");
    if (countEl) {
        countEl.value = count;
        countEl.disabled = false;
    }
    const gapEl = document.getElementById("drawer-gap");
    if (gapEl) gapEl.value = col.drawerGap !== undefined ? col.drawerGap : 0.2;

    currentDrawersData = col.drawersData
        ? JSON.parse(JSON.stringify(col.drawersData))
        : [];
    currentDrawersData.forEach(d => { if (d && !d.finish) d.finish = "matte"; });
    adjustDrawersDataSize(count);
    renderDynamicDrawerFields();
    renderClosetColumnTabs();
}

function selectClosetDrawerColumn(idx) {
    saveCurrentClosetColumnFromForm();
    loadClosetColumnIntoForm(idx);
    if (typeof updateDrawerPreview === "function") updateDrawerPreview();
}
window.selectClosetDrawerColumn = selectClosetDrawerColumn;

function applyClosetColumnCount(n) {
    if (!drawerEditorClosetMode) return;
    saveCurrentClosetColumnFromForm();
    const maxCols = (drawerEditorClosetUnit
        && drawerEditorClosetCellId
        && drawerEditorClosetUnit.frameCellDrawers
        && drawerEditorClosetUnit.frameCellDrawers[drawerEditorClosetCellId]
        && drawerEditorClosetUnit.frameCellDrawers[drawerEditorClosetCellId].drawerType === "sliding")
        ? 2 : 3;
    n = Math.max(1, Math.min(maxCols, parseInt(n, 10) || 1));
    const el = document.getElementById("closet-column-count");
    if (el) el.value = n;
    while (drawerEditorClosetColumns.length < n) {
        drawerEditorClosetColumns.push({
            drawerCount: 1,
            drawerGap: 0.2,
            drawersData: [{ height: 17, doorHeight: 17, depth: 45, material: "mdf", color: "", finish: "matte" }]
        });
    }
    drawerEditorClosetColumns = drawerEditorClosetColumns.slice(0, n);
    if (drawerEditorClosetColumnIndex >= n) drawerEditorClosetColumnIndex = n - 1;
    loadClosetColumnIntoForm(drawerEditorClosetColumnIndex);
    if (typeof updateDrawerPreview === "function") updateDrawerPreview();
}

function changeClosetColumnCount(delta) {
    if (!drawerEditorClosetMode) return;
    const el = document.getElementById("closet-column-count");
    let n = parseInt(el && el.value, 10) || 1;
    n = Math.max(1, Math.min(3, n + (parseInt(delta, 10) || 0)));
    applyClosetColumnCount(n);
}
window.changeClosetColumnCount = changeClosetColumnCount;

function handleClosetColumnCountChange() {
    const el = document.getElementById("closet-column-count");
    applyClosetColumnCount(el ? el.value : 1);
}

window.handleClosetColumnCountChange = handleClosetColumnCountChange;

function updateClosetHousingAlignButtons(align) {
    const wrap = document.getElementById("closet-housing-align");
    if (!wrap) return;
    wrap.querySelectorAll("button[data-align]").forEach(btn => {
        const active = btn.getAttribute("data-align") === align;
        btn.style.borderColor = active ? "#22c55e" : "#334155";
        btn.style.background = active ? "#22c55e" : "#1e293b";
        btn.style.color = active ? "#fff" : "#e2e8f0";
    });
}

function setClosetHousingAlign(align) {
    if (align !== "left" && align !== "right") align = "center";
    const el = document.getElementById("closet-housing-align-value");
    if (el) el.value = align;
    updateClosetHousingAlignButtons(align);
    if (typeof updateDrawerPreview === "function") updateDrawerPreview();
}
window.setClosetHousingAlign = setClosetHousingAlign;
window.updateClosetHousingAlignButtons = updateClosetHousingAlignButtons;


window.openDrawerEditorPanelForCloset = openDrawerEditorPanelForCloset;

function initDrawerPreview() {
    const container = document.getElementById('drawer-preview-3d');
    if (!container) return;
    
    if (drawerPreviewRenderer) {
        drawerPreviewRenderer.setSize(container.clientWidth, container.clientHeight);
        drawerPreviewCamera.aspect = container.clientWidth / container.clientHeight;
        drawerPreviewCamera.updateProjectionMatrix();
        return;
    }

    drawerPreviewScene = new THREE.Scene();

// اضافه کردن پس‌زمینه خاکستری (کد رنگ هماهنگ با تم تیره پنل شما)
drawerPreviewScene.background = new THREE.Color(0x334155);

    drawerPreviewCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    drawerPreviewCamera.position.set(100, 50, 150); // کمی زاویه دار برای دید بهتر

    drawerPreviewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    drawerPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;
    drawerPreviewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    drawerPreviewRenderer.toneMappingExposure = 1.0;
    drawerPreviewRenderer.setSize(container.clientWidth, container.clientHeight);
    drawerPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(drawerPreviewRenderer.domElement);

    // اضافه کردن کنترلر ماوس
    if (typeof THREE.OrbitControls !== 'undefined') {
        drawerPreviewControls = new THREE.OrbitControls(drawerPreviewCamera, drawerPreviewRenderer.domElement);
        drawerPreviewControls.enableDamping = true; // حرکت نرم‌تر
        drawerPreviewControls.dampingFactor = 0.05;
        drawerPreviewControls.rotateSpeed = 0.8;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    drawerPreviewScene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(60, 100, 70);
    drawerPreviewScene.add(dirLight);

    drawerPreviewGroup = new THREE.Group();
    drawerPreviewScene.add(drawerPreviewGroup);

    animateDrawerPreview();
}


function updateDrawerPreview() {
    if (!drawerPreviewGroup || !document.getElementById('drawer-preview-3d')) return;

    while(drawerPreviewGroup.children.length > 0){ 
        drawerPreviewGroup.remove(drawerPreviewGroup.children[0]); 
    }

    // پیش‌نمایش مخصوص چهارچوب کمد
    if (drawerEditorClosetMode) {
        updateClosetDrawerPreview();
        return;
    }

    const isEnabled = document.getElementById('drawer-enabled').checked;
    if (!isEnabled) return;

    const count = parseInt(document.getElementById('drawer-count').value) || 1;
    const gap = parseFloat(document.getElementById('drawer-gap').value) || 0;

    const cabW = 60; 
    const cabH = 70; 
    const cabD = 55; 
    const thick = 2; 

    const hasCustomDrawers = currentDrawersData && currentDrawersData.length === count;

    let totalInputHeight = 0;
    let requestedHeights = [];
    const hasTopPanel = document.getElementById('drawer-top-panel').checked;
    const hasLegs = document.getElementById('drawer-legs-enabled').checked;

    const baseOffset = 1.6;
    const topOffset = hasTopPanel ? 1.6 : 0;

    const availableHeight = cabH - baseOffset - topOffset - (gap * (count - 1));

    for (let i = 0; i < count; i++) {
        const dData = hasCustomDrawers ? currentDrawersData[i] : null;
        let reqH = availableHeight / count;
        if (dData) {
            let parsedH = dData.doorHeight ? parseFloat(dData.doorHeight) : reqH;
            if (!isNaN(parsedH) && parsedH > 0) {
                reqH = parsedH;
            }
        }
        requestedHeights.push(reqH);
        totalInputHeight += reqH;
    }
    
    if (hasTopPanel) {
        const topGeo = new THREE.BoxGeometry(cabW, 1.6, cabD);
        const topMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        const topMesh = new THREE.Mesh(topGeo, topMat);
        topMesh.position.set(0, cabH / 2 - 0.8, 0); 
        drawerPreviewGroup.add(topMesh);
    }
    
    if (hasLegs) {
        const legH = 14; 
        const legGeo = new THREE.CylinderGeometry(2, 2, legH, 16);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
        const positions = [
            [-cabW/2 + 5, -cabH/2 - legH/2, cabD/2 - 5],
            [cabW/2 - 5, -cabH/2 - legH/2, cabD/2 - 5],
            [-cabW/2 + 5, -cabH/2 - legH/2, -cabD/2 + 5],
            [cabW/2 - 5, -cabH/2 - legH/2, -cabD/2 + 5]
        ];
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(...pos);
            drawerPreviewGroup.add(leg);
        });
    }

    const currentCabinet = cabinets.find(c => c.id === selectedId);
    const isBaseCombo = currentCabinet && currentCabinet.isBaseWithDrawer;
    const scaleFactor = (totalInputHeight > 0 && !isNaN(totalInputHeight) && !isBaseCombo) ? (availableHeight / totalInputHeight) : 1;

    let currentY = (cabH / 2) - topOffset;

    for (let i = 0; i < count; i++) {
        const dData = hasCustomDrawers ? currentDrawersData[i] : null;

        let currentDrawerH = requestedHeights[i] * scaleFactor;
        if (isNaN(currentDrawerH) || currentDrawerH <= 0) currentDrawerH = 10; 

        const yPos = currentY - (currentDrawerH / 2);
        currentY -= (currentDrawerH + gap);

        const frontMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            roughness: 0.4,
            metalness: 0.05
        });

        const frontGeo = new THREE.BoxGeometry(cabW - gap, currentDrawerH, thick);
        const frontMesh = new THREE.Mesh(frontGeo, frontMaterial);
        
        let parsedInnerDepth = (dData && dData.depth) ? parseFloat(dData.depth) : cabD * 0.85;
        if (isNaN(parsedInnerDepth)) parsedInnerDepth = cabD * 0.85;

        let parsedInnerHeight = (dData && dData.height) ? parseFloat(dData.height) : (currentDrawerH * 0.7);
        if (isNaN(parsedInnerHeight)) parsedInnerHeight = currentDrawerH * 0.7;

        const innerDepth = parsedInnerDepth;
        const innerHeight = parsedInnerHeight;
        const innerWidth = (cabW - gap) * 0.9;
        const bThick = 1.5; 

        const drawerBody = new THREE.Group(); 
        
        // ۱. متریال دیواره‌های بدنه در پیش‌نمایش
        let bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
        
        // ۲. 🟢 متریال اختصاصی برای کف ۳ میل در پیش‌نمایش (همیشه سفید ثابت)
        const floorPreviewMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });

        if (dData) {
            const finishKey = dData.finish || 'matte';
            const preset = (typeof window.getKitchenFinishPreset === 'function')
                ? window.getKitchenFinishPreset(finishKey)
                : { roughness: 0.7, metalness: 0.02 };
            if (dData.texture) {
                const textureLoader = new THREE.TextureLoader();
                const loadedTexture = textureLoader.load(dData.texture);
                if (THREE.SRGBColorSpace != null) loadedTexture.colorSpace = THREE.SRGBColorSpace;
                loadedTexture.wrapS = THREE.RepeatWrapping;
                loadedTexture.wrapT = THREE.RepeatWrapping;
                loadedTexture.repeat.set(0.05, 0.05); 
                
                bodyMat = new THREE.MeshStandardMaterial({
                    map: loadedTexture,
                    roughness: preset.roughness,
                    metalness: preset.metalness || 0.0
                });
            } else if (dData.color) {
                bodyMat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(dData.color),
                    roughness: preset.roughness,
                    metalness: preset.metalness || 0.0
                });
            }
        }
        
        // 🟢 تخصیص متریال سفید اختصاصی به باکس کف کشو (bottom)
        const bottomGeo = new THREE.BoxGeometry(innerWidth, bThick, innerDepth);
        const bottom = new THREE.Mesh(bottomGeo, floorPreviewMat);
        bottom.position.set(0, -innerHeight/2 + bThick/2, 0);
        drawerBody.add(bottom);
        
        const sideGeo = new THREE.BoxGeometry(bThick, innerHeight, innerDepth);
        const leftSide = new THREE.Mesh(sideGeo, bodyMat);
        leftSide.position.set(-innerWidth/2 + bThick/2, 0, 0);
        drawerBody.add(leftSide);
        
        const rightSide = new THREE.Mesh(sideGeo, bodyMat);
        rightSide.position.set(innerWidth/2 - bThick/2, 0, 0);
        drawerBody.add(rightSide);
        
        const backGeo = new THREE.BoxGeometry(innerWidth - 2*bThick, innerHeight, bThick);
        const backSide = new THREE.Mesh(backGeo, bodyMat); 
        backSide.position.set(0, 0, -innerDepth/2 + bThick/2);
        drawerBody.add(backSide);

        drawerBody.position.set(0, - (currentDrawerH - innerHeight) / 2, - (innerDepth / 2 + thick / 2));
        frontMesh.add(drawerBody);

        const closedZ = cabD / 2 + thick / 2;
        frontMesh.position.set(0, yPos, closedZ);
        drawerPreviewGroup.add(frontMesh);
    }
}






/**
 * پیش‌نمایش ساختار کشو چهارچوب کمد:
 * دیواره چپ/راست (بدنه+۴)، کف/سقف دو تکه ۱۲ سانتی جلو/عقب، بدنه و جبهه کشو
 */
function updateClosetDrawerPreview() {
    if (!drawerPreviewGroup) return;

    const isEnabled = document.getElementById("drawer-enabled")
        ? document.getElementById("drawer-enabled").checked
        : true;
    if (!isEnabled) return;

    const count = parseInt(document.getElementById("drawer-count").value, 10) || 1;
    const gap = parseFloat(document.getElementById("drawer-gap").value) || 0.2;

    let cellW = 60;
    let cellH = 80;
    if (drawerEditorClosetUnit && drawerEditorClosetCellId && typeof detectClosetFrameCells === "function") {
        const cells = detectClosetFrameCells(drawerEditorClosetUnit) || [];
        const cell = cells.find(c => c.id === drawerEditorClosetCellId);
        if (cell) {
            cellW = cell.w;
            cellH = cell.h;
        }
    }

    const PANEL = 1.6;
    const SIDE_PER_DRAWER = 22.5; // به‌ازای هر کشو
    const STRIP_D = 12;
    const drawerDepth = 50;
    const BODY_CLEAR = 2.6;

    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
    const frontMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.75, roughness: 0.3 });

    const scale = Math.min(1.1, 90 / Math.max(cellW, cellH, 40));
    const sW = cellW * scale;
    const sD = drawerDepth * scale;
    const sPanel = PANEL * scale;
    const sStrip = STRIP_D * scale;
    const sSidePer = SIDE_PER_DRAWER * scale;
    const sGap = gap * scale;

    const floorCeilW = Math.max(sW - sPanel * 2, 2);
    const drawerBodyW = Math.max(floorCeilW - BODY_CLEAR * scale, 2);
    // جبهه: ۱۶ میل از هر طرف روی چهارچوب
    const frontW = Math.max(sW + sPanel * 2, 2);

    let bodyHeights = [];
    let sumBodies = 0;
    for (let i = 0; i < count; i++) {
        const d = currentDrawersData[i];
        let h = d && d.height ? parseFloat(d.height)
            : (d && d.doorHeight ? parseFloat(d.doorHeight) : NaN);
        if (isNaN(h) || h <= 0) h = 17;
        const sh = h * scale;
        bodyHeights.push(sh);
        sumBodies += sh;
    }

    // یک محل قرارگیری: دیواره‌ها یک تکه، کف/سقف یک‌بار
    // دیواره کناری: ۲۲.۵ به‌ازای هر کشو (یک تکه)
    const housingH = sSidePer * count;
    const housingBottom = -housingH / 2;
    const housingCenterY = 0;
    const bodyFrontZ = sD / 2;
    const frontStripZ = bodyFrontZ - sStrip / 2;
    const backStripZ = bodyFrontZ - sD + sStrip / 2;

    // دیواره چپ / راست — یک تکه
    const left = new THREE.Mesh(new THREE.BoxGeometry(sPanel, housingH, sD), white);
    left.position.set(-sW / 2 + sPanel / 2, housingCenterY, 0);
    drawerPreviewGroup.add(left);
    const right = new THREE.Mesh(new THREE.BoxGeometry(sPanel, housingH, sD), white);
    right.position.set(sW / 2 - sPanel / 2, housingCenterY, 0);
    drawerPreviewGroup.add(right);

    // کف دو تکه جلو/عقب — یک‌بار
    const floorY = housingBottom + sPanel / 2;
    const bf = new THREE.Mesh(new THREE.BoxGeometry(floorCeilW, sPanel, sStrip), white);
    bf.position.set(0, floorY, frontStripZ);
    drawerPreviewGroup.add(bf);
    const bb = new THREE.Mesh(new THREE.BoxGeometry(floorCeilW, sPanel, sStrip), white);
    bb.position.set(0, floorY, backStripZ);
    drawerPreviewGroup.add(bb);

    // سقف دو تکه جلو/عقب — یک‌بار
    const ceilY = housingBottom + housingH - sPanel / 2;
    const tf = new THREE.Mesh(new THREE.BoxGeometry(floorCeilW, sPanel, sStrip), white);
    tf.position.set(0, ceilY, frontStripZ);
    drawerPreviewGroup.add(tf);
    const tb = new THREE.Mesh(new THREE.BoxGeometry(floorCeilW, sPanel, sStrip), white);
    tb.position.set(0, ceilY, backStripZ);
    drawerPreviewGroup.add(tb);

    // جبهه‌ها: پایین ۱۶ میل زیر کف، بالا ۳ میل زیر سقف، بین آن‌ها ۳ میل
    const FRONT_BOTTOM_OVERLAP = 1.6 * scale;
    const FRONT_TOP_INSET = 0.3 * scale;
    const FRONT_GAP = 0.3 * scale;
    const stackBottom = housingBottom - FRONT_BOTTOM_OVERLAP;
    const stackTop = housingBottom + housingH - FRONT_TOP_INSET;
    const totalFrontSpan = Math.max(stackTop - stackBottom, 4 * scale);
    const availableFrontH = Math.max(totalFrontSpan - FRONT_GAP * Math.max(count - 1, 0), 4 * scale);

    // کشوها: هر کدام سهم ۲۲.۵ سانتی‌متری
    let frontYBottom = stackBottom;
    for (let i = 0; i < count; i++) {
        const bodyH = bodyHeights[i];
        const slotBottom = housingBottom + i * sSidePer;
        const boxCy = slotBottom + sSidePer / 2;

        const ratio = sumBodies > 0 ? (bodyH / sumBodies) : (1 / count);
        const frontH = Math.max(availableFrontH * ratio, 4 * scale);
        const frontCy = frontYBottom + frontH / 2;
        frontYBottom += frontH + FRONT_GAP;

        const boxD = sD * 0.85;
        const bT = sPanel;
        const sideL = new THREE.Mesh(new THREE.BoxGeometry(bT, bodyH, boxD), white);
        sideL.position.set(-drawerBodyW / 2 + bT / 2, boxCy, bodyFrontZ - boxD / 2 - 0.5 * scale);
        drawerPreviewGroup.add(sideL);
        const sideR = sideL.clone();
        sideR.position.x = drawerBodyW / 2 - bT / 2;
        drawerPreviewGroup.add(sideR);
        const back = new THREE.Mesh(new THREE.BoxGeometry(Math.max(drawerBodyW - 2 * bT, 1), bodyH, bT), white);
        back.position.set(0, boxCy, bodyFrontZ - boxD + bT / 2 - 0.5 * scale);
        drawerPreviewGroup.add(back);

        const frontT = sPanel;
        const front = new THREE.Mesh(new THREE.BoxGeometry(frontW, frontH, frontT), frontMat);
        front.position.set(0, frontCy, bodyFrontZ + frontT / 2);
        drawerPreviewGroup.add(front);

        const hw = Math.min(frontW * 0.35, 12 * scale);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(hw, 0.55 * scale, 0.75 * scale), metal);
        handle.position.set(0, 0, frontT / 2 + 0.4 * scale);
        front.add(handle);
    }

    if (drawerPreviewCamera) {
        const span = Math.max(sW, housingH, sD) * 1.4;
        drawerPreviewCamera.position.set(span * 0.75, span * 0.35, span * 1.15);
        drawerPreviewCamera.lookAt(0, 0, 0);
        drawerPreviewCamera.updateProjectionMatrix();
    }
}

function applyDrawerSettings() {
    // حالت چهارچوب کمد دیواری
    if (drawerEditorClosetMode && drawerEditorClosetUnit) {
        if (!drawerEditorClosetCellId) {
            alert("بخش معتبری برای اعمال کشو پیدا نشد. ابتدا از «اضافه کردن کشو» بخش را فعال کنید.");
            return;
        }
        if (!drawerEditorClosetUnit.frameCellDrawers) {
            drawerEditorClosetUnit.frameCellDrawers = {};
        }
        // ذخیره ستون فعلی از فرم
        if (typeof saveCurrentClosetColumnFromForm === "function") {
            saveCurrentClosetColumnFromForm();
        }
        const enabled = document.getElementById("drawer-enabled")
            ? document.getElementById("drawer-enabled").checked
            : true;
        const prev = drawerEditorClosetUnit.frameCellDrawers[drawerEditorClosetCellId] || {};
        const colCountEl = document.getElementById("closet-column-count");
        let colCount = colCountEl ? parseInt(colCountEl.value, 10) : (drawerEditorClosetColumns.length || 1);
        colCount = Math.max(1, Math.min(3, colCount || 1));
        if ((prev.drawerType || "normal") === "sliding") {
            colCount = Math.max(1, Math.min(2, colCount));
        }

        if (!enabled) {
            delete drawerEditorClosetUnit.frameCellDrawers[drawerEditorClosetCellId];
        } else {
            const columns = JSON.parse(JSON.stringify(drawerEditorClosetColumns.slice(0, colCount)));
            const c0 = columns[0] || { drawerCount: 1, drawerGap: 0.2, drawersData: [] };
            const sidePer = parseFloat(document.getElementById("closet-housing-side-per")?.value);
            const stripD = parseFloat(document.getElementById("closet-housing-strip-depth")?.value);
            const wallT = parseFloat(document.getElementById("closet-housing-wall-thick")?.value);
            const depthH = parseFloat(document.getElementById("closet-housing-depth")?.value);
            const widthRaw = parseFloat(document.getElementById("closet-housing-width")?.value);
            const alignRaw = (document.getElementById("closet-housing-align-value")?.value) || "center";
            const housing = {
                sidePerDrawer: (!isNaN(sidePer) && sidePer > 0) ? sidePer : 22.5,
                stripDepth: (!isNaN(stripD) && stripD > 0) ? stripD : 12,
                wallThickness: (!isNaN(wallT) && wallT > 0) ? wallT : 1.6,
                drawerDepth: (!isNaN(depthH) && depthH > 0) ? depthH : 50,
                width: (!isNaN(widthRaw) && widthRaw > 0) ? widthRaw : null,
                align: (alignRaw === "left" || alignRaw === "right") ? alignRaw : "center"
            };
            const entry = {
                enabled: true,
                drawerType: prev.drawerType || "normal",
                columnCount: colCount,
                columns: columns,
                drawerCount: c0.drawerCount,
                drawerGap: c0.drawerGap,
                drawerDepth: housing.drawerDepth,
                housing: housing,
                drawerTopPanel: document.getElementById("drawer-top-panel")
                    ? document.getElementById("drawer-top-panel").checked
                    : false,
                drawersData: c0.drawersData
            };
            if (typeof window.normalizeKeshoDrawerCfg === "function") {
                window.normalizeKeshoDrawerCfg(entry);
            }
            drawerEditorClosetUnit.frameCellDrawers[drawerEditorClosetCellId] = entry;
        }

        const units = window.closetFrameUnits || [];
        const idx = units.findIndex(u => u.id === drawerEditorClosetUnit.id);
        if (idx >= 0) {
            units[idx].frameCellDrawers = drawerEditorClosetUnit.frameCellDrawers;
        }

        if (window.Kitchen3D && typeof window.Kitchen3D.renderClosetFrameUnit === "function") {
            window.Kitchen3D.renderClosetFrameUnit();
        } else if (window.Kitchen3D && typeof window.Kitchen3D.renderCabinets === "function") {
            window.Kitchen3D.renderCabinets();
        }

        closeDrawerEditorPanel();
        return;
    }

    const selectedCabinet = cabinets.find(c => c.id === selectedId);

    if (!selectedCabinet) {
        alert("کابینت انتخاب شده معتبر نیست یا هیچ کابینتی انتخاب نشده است!");
        return;
    }

    if (selectedCabinet.isBaseWithDrawer) {
        selectedCabinet.drawerCount = 1; 
        
        if (currentDrawersData && currentDrawersData.length > 0) {
            const dData = currentDrawersData[0];
            let parsedFrontH = dData.doorHeight ? parseFloat(dData.doorHeight) : 18.0;

            // 🛑 اعتبارسنجی
            if (isNaN(parsedFrontH) || parsedFrontH <= 0) parsedFrontH = 18.0;
            selectedCabinet.drawerFrontHeight = parsedFrontH;
        }
    } else {
        selectedCabinet.isDrawerBody = document.getElementById('drawer-enabled').checked;
        selectedCabinet.drawerCount = parseInt(document.getElementById('drawer-count').value) || 1;
        selectedCabinet.drawerGap = parseFloat(document.getElementById('drawer-gap').value) || 0;
    }

    selectedCabinet.drawerTopPanel = document.getElementById("drawer-top-panel").checked;
    selectedCabinet.drawerLegs = document.getElementById("drawer-legs-enabled").checked;



    selectedCabinet.drawersData = JSON.parse(JSON.stringify(currentDrawersData));

    if (typeof rebuildScene === 'function') rebuildScene();
    if (typeof draw === 'function') draw();
    if (typeof renderList === 'function') renderList();

    closeDrawerEditorPanel();
}


function animateDrawerPreview() {
    // ۱. این دستور باید در ابتدای تابع باشد تا حلقه همیشه تکرار شود
    requestAnimationFrame(animateDrawerPreview);

    // ۲. اگر پنل بسته است، عملیات رندر متوقف می‌شود اما حلقه زنده می‌ماند
    if (!document.getElementById('drawer-editor-panel')?.classList.contains('active')) return;

    // ۳. آپدیت کنترلر برای حرکت نرم ماوس
    if (drawerPreviewControls) {
        drawerPreviewControls.update();
    }

    // ۴. رندر نهایی صحنه
    if (drawerPreviewRenderer && drawerPreviewScene && drawerPreviewCamera) {
        drawerPreviewRenderer.render(drawerPreviewScene, drawerPreviewCamera);
    }
}


let currentEditingDrawerIndex = null;

// =====================================
// اتصال به مودال یکپارچه (Universal Modal) برای بخش کشوها
// =====================================

/**
 * باز کردن مودال هوشمند یکپارچه برای یک کشوی خاص
 * @param {Number} drawerIndex - اندیس کشوی در حال ویرایش (شروع از 0)
 */
function openDrawerMaterialWithUniversalModal(drawerIndex) {
    if (!currentDrawersData || !currentDrawersData[drawerIndex]) return;

    // ۱. استخراج متریال انتخاب شده در منوی آبشاری همان کشو (mdf, highGloss, leteron)
    // این کار باعث می‌شود مودال دقیقاً کاتالوگ مربوط به همان متریال را لود کند
    const matCategory = currentDrawersData[drawerIndex].material || 'mdf';

    // ۲. تولید عنوان پویا برای هدر مودال
    const modalTitle = `انتخاب طرح و رنگ کشوی ${drawerIndex + 1}`;

    // ۳. فراخوانی مودال یکپارچه سیستم همراه با کالبک اختصاصی
    openUniversalModal(modalTitle, matCategory, function(selectedItem) {
        // این بخش پس از انتخاب آیتم در مودال اجرا می‌شود
        applySelectedMaterialToSingleDrawer(drawerIndex, selectedItem, matCategory);
    });
}

/**
 * تابع کمکی داخلی جهت ثبت متریال انتخاب شده در آرایه کشوها و به‌روزرسانی پروژه
 */
function applySelectedMaterialToSingleDrawer(drawerIndex, item, category) {
    if (currentDrawersData && currentDrawersData[drawerIndex]) {
        // ثبت داده‌های متریال انتخابی در دیتای موقت کشو
        currentDrawersData[drawerIndex].color = item.code || '#ffffff';
        currentDrawersData[drawerIndex].texture = item.texture || null;
        currentDrawersData[drawerIndex].material = category; // دسته متریال (مثلاً highGloss)
        currentDrawersData[drawerIndex].materialName = item.name; // نام متریال (مثلاً لاته براق)
        
        // ۱. بازسازی فیلدهای داینامیک برای نمایش نام رنگ جدید در اینپوت
        renderDynamicDrawerFields();
        
        // ۲. به‌روزرسانی پیش‌نمایش ۳بعدی کوچک داخل پنل کشو
        if (typeof updateDrawerPreview === 'function') {
            updateDrawerPreview();
        }
    }
}
