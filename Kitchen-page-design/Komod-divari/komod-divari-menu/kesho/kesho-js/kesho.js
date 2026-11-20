// js/components/kesho.js — پنل اضافه کردن کشو (کمد دیواری)
// پیش‌نمایش: کل چهارچوب + فقط جبهه کشو (مثل پنل درب)
// فعال/غیرفعال روی خود بخش — بدون دکمه حذف جدا

let currentKeshoUnit = null;
let selectedKeshoCellId = null;
let cachedKeshoCells = [];
let selectedKeshoDrawerType = "normal";
let selectedKeshoColumnCount = 1;

let keshoPreviewScene, keshoPreviewCamera, keshoPreviewRenderer, keshoPreviewGroup;

/** ساخت ستون پیش‌فرض با یک کشو ۱۷ سانتی */
function createDefaultKeshoColumn() {
    return {
        drawerCount: 1,
        drawerGap: 0.2,
        drawersData: [{
            height: 17,
            doorHeight: 17,
            depth: 45,
            material: "mdf",
            color: "",
            finish: "matte"
        }]
    };
}

/** نرمال‌سازی cfg: ستون‌ها ۱ تا ۳ فقط برای کشو معمولی */
function normalizeKeshoDrawerCfg(cfg) {
    if (!cfg) return cfg;
    const type = cfg.drawerType || "normal";
    let colCount = 1;
    // معمولی/مخفی تا ۳؛ ریلی تا ۲
    if (type === "normal" || type === "hidden") {
        colCount = Math.max(1, Math.min(3, parseInt(cfg.columnCount, 10) || 1));
    } else if (type === "sliding") {
        colCount = Math.max(1, Math.min(2, parseInt(cfg.columnCount, 10) || 1));
    }
    cfg.columnCount = colCount;
    if (!Array.isArray(cfg.columns) || !cfg.columns.length) {
        // سازگاری با داده قدیمی
        cfg.columns = [{
            drawerCount: Math.max(1, parseInt(cfg.drawerCount, 10) || 1),
            drawerGap: cfg.drawerGap !== undefined ? cfg.drawerGap : 0.2,
            drawersData: (cfg.drawersData && cfg.drawersData.length)
                ? JSON.parse(JSON.stringify(cfg.drawersData))
                : createDefaultKeshoColumn().drawersData
        }];
    }
    while (cfg.columns.length < colCount) {
        cfg.columns.push(createDefaultKeshoColumn());
    }
    if (cfg.columns.length > colCount) {
        cfg.columns = cfg.columns.slice(0, colCount);
    }
    // همگام‌سازی فیلدهای سطح بالا با ستون اول (سازگاری)
    const c0 = cfg.columns[0];
    cfg.drawerCount = c0.drawerCount;
    cfg.drawerGap = c0.drawerGap;
    cfg.drawersData = c0.drawersData;
    return cfg;
}
window.normalizeKeshoDrawerCfg = normalizeKeshoDrawerCfg;

function openClosetDrawerAddPanel() {
    const units = window.closetFrameUnits || [];
    const targetUnit = units.find(u => u.id === window.selectedClosetFrameId);

    if (!targetUnit) {
        alert("لطفاً ابتدا یک چهارچوب کمد دیواری را از روی صحنه انتخاب کنید.");
        return;
    }

    currentKeshoUnit = targetUnit;
    if (!currentKeshoUnit.frameCellDrawers) currentKeshoUnit.frameCellDrawers = {};

    selectedKeshoCellId = null;
    selectedKeshoDrawerType = "normal";
    selectedKeshoColumnCount = 1;
    const radio = document.querySelector('input[name="kesho-drawer-type"][value="normal"]');
    if (radio) radio.checked = true;
    const colSel = document.getElementById("kesho-column-count");
    if (colSel) colSel.value = "1";
    updateKeshoColumnGroupVisibility();

    if (typeof detectClosetFrameCells === "function") {
        cachedKeshoCells = detectClosetFrameCells(targetUnit) || [];
    } else {
        cachedKeshoCells = [];
    }

    const panel = document.getElementById("closet-drawer-add-panel");
    if (!panel) {
        console.warn("[Kesho] پنل کشو هنوز لود نشده است.");
        return;
    }
    panel.classList.add("active");

    renderKeshoCellsList();
    initKeshoPreview();
    renderKeshoPreview();
}
window.openClosetDrawerAddPanel = openClosetDrawerAddPanel;

function closeClosetDrawerAddPanel() {
    const panel = document.getElementById("closet-drawer-add-panel");
    if (panel) panel.classList.remove("active");
    selectedKeshoCellId = null;
}
window.closeClosetDrawerAddPanel = closeClosetDrawerAddPanel;

function updateKeshoColumnGroupVisibility() {
    const group = document.getElementById("kesho-column-group");
    if (!group) return;
    const showCols = (selectedKeshoDrawerType === "normal"
        || selectedKeshoDrawerType === "hidden"
        || selectedKeshoDrawerType === "sliding");
    group.style.display = showCols ? "" : "none";
    // ریلی حداکثر ۲ ردیف
    const colSel = document.getElementById("kesho-column-count");
    if (colSel) {
        const opt3 = colSel.querySelector('option[value="3"]');
        if (opt3) opt3.style.display = (selectedKeshoDrawerType === "sliding") ? "none" : "";
        if (selectedKeshoDrawerType === "sliding" && parseInt(colSel.value, 10) > 2) {
            colSel.value = "2";
            selectedKeshoColumnCount = 2;
        }
    }
}

function onKeshoDrawerTypeChange() {
    const checked = document.querySelector('input[name="kesho-drawer-type"]:checked');
    selectedKeshoDrawerType = checked ? checked.value : "normal";
    updateKeshoColumnGroupVisibility();

    if (selectedKeshoDrawerType === "sliding" && selectedKeshoColumnCount > 2) {
        selectedKeshoColumnCount = 2;
        const colSel = document.getElementById("kesho-column-count");
        if (colSel) colSel.value = "2";
    }

    if (currentKeshoUnit && selectedKeshoCellId) {
        const cfg = currentKeshoUnit.frameCellDrawers[selectedKeshoCellId];
        if (cfg && cfg.enabled) {
            cfg.drawerType = selectedKeshoDrawerType;
            if (selectedKeshoDrawerType === "sliding") {
                cfg.columnCount = Math.max(1, Math.min(2, selectedKeshoColumnCount || 1));
            } else {
                cfg.columnCount = selectedKeshoColumnCount;
            }
            normalizeKeshoDrawerCfg(cfg);
            syncKeshoUnitToGlobal();
            refreshKesho3D();
        }
    }
    renderKeshoPreview();
}
window.onKeshoDrawerTypeChange = onKeshoDrawerTypeChange;

function onKeshoColumnCountChange() {
    const sel = document.getElementById("kesho-column-count");
    selectedKeshoColumnCount = Math.max(1, Math.min(3, parseInt(sel && sel.value, 10) || 1));

    if (currentKeshoUnit && selectedKeshoCellId) {
        const cfg = currentKeshoUnit.frameCellDrawers[selectedKeshoCellId];
        if (cfg && cfg.enabled && ((cfg.drawerType || "normal") === "normal" || cfg.drawerType === "hidden" || cfg.drawerType === "sliding")) {
            cfg.columnCount = selectedKeshoColumnCount;
            normalizeKeshoDrawerCfg(cfg);
            syncKeshoUnitToGlobal();
            refreshKesho3D();
        }
    }
    renderKeshoPreview();
}
window.onKeshoColumnCountChange = onKeshoColumnCountChange;

function renderKeshoCellsList() {
    const list = document.getElementById("kesho-cells-list");
    if (!list) return;
    list.innerHTML = "";

    if (!cachedKeshoCells.length) {
        list.innerHTML = `<div style="color:#64748b; font-size:12px; padding:10px; text-align:center;">
            بخشی تشخیص داده نشد. حداقل دو قطعه عمودی و دو قطعه افقی لازم است.
        </div>`;
        return;
    }

    const drawersMap = (currentKeshoUnit && currentKeshoUnit.frameCellDrawers) || {};

    cachedKeshoCells.forEach((cell, idx) => {
        const isSelected = selectedKeshoCellId === cell.id;
        const cfg = drawersMap[cell.id];
        const isOn = !!(cfg && cfg.enabled === true);
        const sizeHint = `${Math.round(cell.w)}×${Math.round(cell.h)} cm`;
        const label = cell.label || (`بخش ${idx + 1}`);

        const item = document.createElement("div");
        item.style.cssText =
            "display:flex; justify-content:space-between; align-items:center; padding:8px 10px; margin-bottom:2px;" +
            "border-radius:999px; cursor:pointer; border:1px solid " +
            (isSelected ? "#0ea5e9" : "#334155") + "; background:" +
            (isSelected ? "rgba(14,165,233,0.15)" : "transparent") + ";";

        const left = document.createElement("span");
        left.innerHTML =
            `<strong style="color:#f1f5f9; font-size:13px;">${label}</strong>` +
            `<span style="font-size:11px; color:#64748b; margin-right:6px;">(${sizeHint})</span>`;
        item.appendChild(left);

        const right = document.createElement("div");
        right.style.cssText = "display:flex; align-items:center; gap:8px;";

        const status = document.createElement("span");
        status.style.cssText = `font-size:11px; color:${isOn ? "#22c55e" : "#94a3b8"};`;
        status.textContent = isOn ? "کشو فعال" : "بدون کشو";
        right.appendChild(status);

        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.textContent = isOn ? "غیرفعال" : "فعال";
        toggleBtn.style.cssText =
            "height:28px; padding:0 12px; border-radius:999px; border:1px solid " +
            (isOn ? "#22c55e" : "#334155") + "; background:" +
            (isOn ? "#22c55e" : "transparent") + "; color:" +
            (isOn ? "#fff" : "#94a3b8") + "; font-size:11px; cursor:pointer;";
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            toggleKeshoCellEnabled(cell.id);
        };
        right.appendChild(toggleBtn);

        item.appendChild(right);
        item.onclick = () => selectKeshoCell(cell.id);
        list.appendChild(item);
    });
}

function selectKeshoCell(cellId) {
    selectedKeshoCellId = cellId;
    const cfg = currentKeshoUnit && currentKeshoUnit.frameCellDrawers
        ? currentKeshoUnit.frameCellDrawers[cellId]
        : null;
    if (cfg && cfg.drawerType) {
        selectedKeshoDrawerType = cfg.drawerType;
        const radio = document.querySelector(`input[name="kesho-drawer-type"][value="${cfg.drawerType}"]`);
        if (radio) radio.checked = true;
    }
    if (cfg) {
        normalizeKeshoDrawerCfg(cfg);
        selectedKeshoColumnCount = cfg.columnCount || 1;
        const colSel = document.getElementById("kesho-column-count");
        if (colSel) colSel.value = String(selectedKeshoColumnCount);
    }
    updateKeshoColumnGroupVisibility();
    renderKeshoCellsList();
    renderKeshoPreview();
}
window.selectKeshoCell = selectKeshoCell;

function toggleKeshoCellEnabled(cellId) {
    if (!currentKeshoUnit) return;
    if (!currentKeshoUnit.frameCellDrawers) currentKeshoUnit.frameCellDrawers = {};

    selectedKeshoCellId = cellId;
    const existing = currentKeshoUnit.frameCellDrawers[cellId];
    const wasOn = !!(existing && existing.enabled);

    if (wasOn) {
        delete currentKeshoUnit.frameCellDrawers[cellId];
    } else {
        const type = selectedKeshoDrawerType || "normal";
        let colCount = 1;
        if (type === "normal" || type === "hidden") {
            colCount = Math.max(1, Math.min(3, selectedKeshoColumnCount || 1));
        } else if (type === "sliding") {
            colCount = Math.max(1, Math.min(2, selectedKeshoColumnCount || 1));
        }
        const columns = [];
        for (let i = 0; i < colCount; i++) {
            columns.push(createDefaultKeshoColumn());
        }
        currentKeshoUnit.frameCellDrawers[cellId] = normalizeKeshoDrawerCfg({
            enabled: true,
            drawerType: type,
            columnCount: colCount,
            columns: columns,
            drawerDepth: 50,
            drawerCount: 1,
            drawerGap: 0.2,
            drawersData: columns[0].drawersData
        });
    }

    syncKeshoUnitToGlobal();
    refreshKesho3D();
    renderKeshoCellsList();
    renderKeshoPreview();

    if (typeof logAction === "function") {
        logAction("success", wasOn ? "کشو غیرفعال شد" : "کشو فعال شد");
    }
}
window.toggleKeshoCellEnabled = toggleKeshoCellEnabled;

function syncKeshoUnitToGlobal() {
    const units = window.closetFrameUnits || [];
    const idx = units.findIndex(u => u.id === currentKeshoUnit.id);
    if (idx >= 0) {
        units[idx].frameCellDrawers = currentKeshoUnit.frameCellDrawers;
    }
}

function refreshKesho3D() {
    if (window.Kitchen3D && typeof window.Kitchen3D.renderClosetFrameUnit === "function") {
        window.Kitchen3D.renderClosetFrameUnit();
    } else if (window.Kitchen3D && typeof window.Kitchen3D.renderCabinets === "function") {
        window.Kitchen3D.renderCabinets();
    }
}

function initKeshoPreview() {
    const container = document.getElementById("kesho-preview-3d");
    if (!container || typeof THREE === "undefined") return;

    if (keshoPreviewRenderer) {
        const w = Math.max(container.clientWidth, 1);
        const h = Math.max(container.clientHeight, 1);
        keshoPreviewRenderer.setSize(w, h);
        if (keshoPreviewCamera) {
            keshoPreviewCamera.aspect = w / h;
            keshoPreviewCamera.updateProjectionMatrix();
        }
        return;
    }

    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);

    keshoPreviewScene = new THREE.Scene();
    keshoPreviewScene.background = new THREE.Color(0x0f172a);

    keshoPreviewCamera = new THREE.PerspectiveCamera(40, w / h, 1, 8000);
    keshoPreviewCamera.position.set(0, 40, 280);
    keshoPreviewCamera.lookAt(0, 40, 0);

    keshoPreviewRenderer = new THREE.WebGLRenderer({ antialias: true });
    keshoPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;
    keshoPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    keshoPreviewRenderer.setSize(w, h);
    container.innerHTML = "";
    container.appendChild(keshoPreviewRenderer.domElement);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.1);
    light1.position.set(80, 150, 120);
    keshoPreviewScene.add(light1);
    keshoPreviewScene.add(new THREE.AmbientLight(0xffffff, 0.55));

    keshoPreviewGroup = new THREE.Group();
    keshoPreviewScene.add(keshoPreviewGroup);

    (function animateKeshoPreview() {
        requestAnimationFrame(animateKeshoPreview);
        if (!document.getElementById("closet-drawer-add-panel")?.classList.contains("active")) return;
        if (keshoPreviewRenderer && keshoPreviewScene && keshoPreviewCamera) {
            keshoPreviewRenderer.render(keshoPreviewScene, keshoPreviewCamera);
        }
    })();
}

function renderKeshoPreview() {
    if (!keshoPreviewRenderer) initKeshoPreview();
    if (!keshoPreviewGroup || !currentKeshoUnit) return;
    keshoPreviewGroup.clear();

    const unit = currentKeshoUnit;
    const parts = unit.parts || [];
    if (!parts.length) return;

    const FRAME_THICKNESS = 5.5;
    let minX = Infinity;
    parts.forEach(p => { if (p.x < minX) minX = p.x; });
    if (minX === Infinity) minX = 0;

    const totalWidth = unit.w || 100;
    const totalHeight = unit.h || 100;
    const frameDepth = unit.d || FRAME_THICKNESS;

    const beamMat = new THREE.MeshStandardMaterial({ color: 0xa9754f, roughness: 0.6 });
    const frontMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.45,
        metalness: 0.04
    });

    // تیرهای چهارچوب
    parts.forEach(part => {
        const pW = part.orientation === "horizontal" ? part.length : FRAME_THICKNESS;
        const pH = part.orientation === "vertical" ? part.length : FRAME_THICKNESS;
        const localX = (part.x - minX) - (totalWidth / 2) + (pW / 2);
        const localY = part.y + (pH / 2);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(pW, pH, frameDepth), beamMat);
        mesh.position.set(localX, localY, 0);
        keshoPreviewGroup.add(mesh);
    });

    // هایلایت بخش انتخاب‌شده
    if (selectedKeshoCellId && cachedKeshoCells.length) {
        const sel = cachedKeshoCells.find(c => c.id === selectedKeshoCellId);
        if (sel) {
            const hx = (sel.x - minX) - (totalWidth / 2) + sel.w / 2;
            const hy = sel.y + sel.h / 2;
            // فقط حاشیه نازک انتخاب — نه پر کردن کل بخش
            const borderMat = new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.85,
                depthWrite: false
            });
            const bw = 0.45;
            const zB = frameDepth / 2 + 0.25;
            const borders = [
                { w: sel.w, h: bw, x: hx, y: sel.y + bw / 2 },
                { w: sel.w, h: bw, x: hx, y: sel.y + sel.h - bw / 2 },
                { w: bw, h: sel.h, x: (sel.x - minX) - (totalWidth / 2) + bw / 2, y: hy },
                { w: bw, h: sel.h, x: (sel.x - minX) - (totalWidth / 2) + sel.w - bw / 2, y: hy }
            ];
            borders.forEach(b => {
                const m = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, 0.3), borderMat);
                m.position.set(b.x, b.y, zB);
                keshoPreviewGroup.add(m);
            });
        }
    }

    // جبهه کشو + اسکلت سبک محل — اندازه واقعی‌تر
    const drawersMap = unit.frameCellDrawers || {};
    const cells = cachedKeshoCells.length
        ? cachedKeshoCells
        : (typeof detectClosetFrameCells === "function" ? detectClosetFrameCells(unit) : []);

    const carcassMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.75, metalness: 0.02 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.3 });
    const PANEL = 1.6;
    const DEFAULT_H = 17;
    const FRONT_GAP = 0.3;
    const SIDE_PER = 22.5;

    cells.forEach(cell => {
        let cfg = drawersMap[cell.id];
        if (!cfg || cfg.enabled !== true) return;
        if (typeof window.normalizeKeshoDrawerCfg === "function") {
            cfg = window.normalizeKeshoDrawerCfg(cfg);
        }

        let liveType = cfg.drawerType || "normal";
        let liveColCount = Math.max(1, parseInt(cfg.columnCount, 10) || 1);
        if (selectedKeshoCellId === cell.id) {
            liveType = selectedKeshoDrawerType || liveType;
            liveColCount = selectedKeshoColumnCount || liveColCount;
        }
        if (liveType === "sliding") liveColCount = Math.max(1, Math.min(2, liveColCount));
        else liveColCount = Math.max(1, Math.min(3, liveColCount));

        const columns = Array.isArray(cfg.columns) && cfg.columns.length
            ? cfg.columns
            : [{ drawerCount: cfg.drawerCount || 1, drawersData: cfg.drawersData || [] }];

        // حداکثر تعداد کشو در ستون‌ها برای ارتفاع محل
        let maxCount = 1;
        for (let ci = 0; ci < liveColCount; ci++) {
            const col = columns[ci] || columns[0] || { drawerCount: 1 };
            maxCount = Math.max(maxCount, Math.max(1, parseInt(col.drawerCount, 10) || 1));
        }

        // عرض محل
        let housingW = cell.w;
        let housingLeft = (cell.x - minX) - (totalWidth / 2);
        if (liveType === "hidden") {
            housingW = Math.max(housingW - 8, 6);
            housingLeft += 4;
        } else if (liveType === "sliding") {
            housingW = Math.max(housingW - 13, 6);
            housingLeft += 6.5;
        }
        const housingBottom = cell.y;
        // ارتفاع محل ≈ تعداد × SIDE_PER (نه کل ارتفاع بخش)
        let housingH = maxCount * SIDE_PER;
        if (housingH > cell.h - 2) housingH = Math.max(cell.h - 2, maxCount * 8);
        const housingTop = housingBottom + housingH;
        const housingCy = housingBottom + housingH / 2;
        const zC = frameDepth / 2 + 0.15;
        const zF = frameDepth / 2 + PANEL / 2 + (liveType === "sliding" ? -1.5 : 0);

        // دیواره چپ/راست — فقط ارتفاع محل کشو
        const leftSide = new THREE.Mesh(new THREE.BoxGeometry(PANEL, housingH, PANEL), carcassMat);
        leftSide.position.set(housingLeft + PANEL / 2, housingCy, zC);
        keshoPreviewGroup.add(leftSide);
        const rightSide = new THREE.Mesh(new THREE.BoxGeometry(PANEL, housingH, PANEL), carcassMat);
        rightSide.position.set(housingLeft + housingW - PANEL / 2, housingCy, zC);
        keshoPreviewGroup.add(rightSide);

        // کف و سقف باریک (۱۲ سانتی نمادین به‌صورت نوار نازک)
        const stripW = Math.max(housingW - PANEL * 2, 2);
        const stripH = 1.2;
        const floor = new THREE.Mesh(new THREE.BoxGeometry(stripW, stripH, PANEL), carcassMat);
        floor.position.set(housingLeft + housingW / 2, housingBottom + stripH / 2, zC);
        keshoPreviewGroup.add(floor);
        const ceil = new THREE.Mesh(new THREE.BoxGeometry(stripW, stripH, PANEL), carcassMat);
        ceil.position.set(housingLeft + housingW / 2, housingTop - stripH / 2, zC);
        keshoPreviewGroup.add(ceil);

        // تیغه وسط
        const midGapW = (liveType === "sliding" && liveColCount === 2) ? 10 : 0;
        const midBladesW = (liveType === "sliding" && liveColCount === 2)
            ? (PANEL * 2 + midGapW)
            : (PANEL * Math.max(liveColCount - 1, 0));
        const innerLeft = housingLeft + PANEL;
        const innerW = Math.max(housingW - PANEL * 2, 2);
        const usableW = Math.max(innerW - midBladesW, 2);
        const colInnerW = usableW / liveColCount;
        const bayStep = (liveType === "sliding" && liveColCount === 2)
            ? (colInnerW + midBladesW)
            : (colInnerW + PANEL);

        if (liveType === "sliding" && liveColCount === 2) {
            const leftBladeX = innerLeft + colInnerW + PANEL / 2;
            const rightBladeX = leftBladeX + PANEL + midGapW;
            [leftBladeX, rightBladeX].forEach(bx => {
                const blade = new THREE.Mesh(new THREE.BoxGeometry(PANEL, Math.max(housingH - 2, 4), PANEL), carcassMat);
                blade.position.set(bx, housingCy, zC);
                keshoPreviewGroup.add(blade);
            });
        } else if (liveColCount > 1) {
            for (let di = 0; di < liveColCount - 1; di++) {
                const divX = innerLeft + (di + 1) * colInnerW + di * PANEL + PANEL / 2;
                const blade = new THREE.Mesh(new THREE.BoxGeometry(PANEL, Math.max(housingH - 2, 4), PANEL), carcassMat);
                blade.position.set(divX, housingCy, zC);
                keshoPreviewGroup.add(blade);
            }
        }

        // جبهه‌ها
        for (let ci = 0; ci < liveColCount; ci++) {
            const col = columns[ci] || columns[0] || { drawerCount: 1, drawersData: [] };
            const count = Math.max(1, parseInt(col.drawerCount, 10) || 1);
            const drawersData = col.drawersData || [];
            const bayLeft = innerLeft + ci * bayStep;
            const bayCenterX = bayLeft + colInnerW / 2;

            let frontW;
            if (liveColCount === 1) {
                frontW = (liveType === "normal")
                    ? Math.max(housingW + 3.0, 4)
                    : Math.max(housingW - 0.2, 4);
            } else {
                frontW = Math.max(colInnerW - 0.4, 3);
            }

            // ارتفاع جبهه‌ها داخل محل
            const stackBottom = housingBottom + ((liveType === "sliding") ? 0.2 : -0.8);
            const stackTop = housingTop - 0.3;
            const avail = Math.max(stackTop - stackBottom - FRONT_GAP * (count - 1), 4);
            const frontH = Math.max(avail / count, 4);

            let yBottom = stackBottom;
            for (let i = 0; i < count; i++) {
                const d = drawersData[i] || {};
                let h = d.doorHeight != null ? parseFloat(d.doorHeight)
                    : (d.height != null ? parseFloat(d.height) : NaN);
                if (isNaN(h) || h <= 0) h = frontH;
                // محدود به فضای محل
                if (h > frontH * 1.2) h = frontH;

                const cy = yBottom + h / 2;
                yBottom += h + FRONT_GAP;

                const front = new THREE.Mesh(
                    new THREE.BoxGeometry(frontW, Math.max(h - 0.1, 2), PANEL),
                    frontMat
                );
                const fx = (liveColCount === 1) ? (housingLeft + housingW / 2) : bayCenterX;
                front.position.set(fx, cy, zF);
                keshoPreviewGroup.add(front);

                const hw = Math.min(frontW * 0.32, 9);
                const handle = new THREE.Mesh(new THREE.BoxGeometry(hw, 0.45, 0.65), handleMat);
                handle.position.set(0, 0, PANEL / 2 + 0.35);
                front.add(handle);
            }
        }
    });

    if (keshoPreviewCamera) {
        const span = Math.max(totalWidth, totalHeight) * 1.15;
        const dist = span * 1.35;
        keshoPreviewCamera.position.set(0, totalHeight / 2, dist);
        keshoPreviewCamera.lookAt(0, totalHeight / 2, 0);
        keshoPreviewCamera.updateProjectionMatrix();
    }
}
window.renderKeshoPreview = renderKeshoPreview;
