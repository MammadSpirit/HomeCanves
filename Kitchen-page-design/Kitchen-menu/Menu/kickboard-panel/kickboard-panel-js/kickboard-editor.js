// js/components/kickboard-editor.js

let currentCabinetForKickboard = null;
let recentKickboardColors = []; // برای ذخیره ۳ رنگ آخر پاخور
let currentKickboardMaterials = window.allMaterials?.mdf || []; // متریال‌های پیش‌فرض

function syncKickboardPreviewData() {
    if (!currentCabinetForKickboard) return;

    const recessRaw = parseFloat(document.getElementById("kickboard-recess").value);
    const finishEl = document.getElementById("kickboard-panel-finish");
    currentCabinetForKickboard.kickboard = {
        enabled: document.getElementById("kickboard-enabled").checked,
        height: parseFloat(document.getElementById("kickboard-height").value) || 14,
        // ۰ معتبر است — ||5 باعث می‌شد صفر ذخیره نشود
        recess: Number.isFinite(recessRaw) ? recessRaw : 0,
        sides: {
            front: document.getElementById("kb-front").checked,
            back: document.getElementById("kb-back").checked,
            left: document.getElementById("kb-left").checked,
            right: document.getElementById("kb-right").checked
        },
        color: document.getElementById("kickboard-color-search").dataset.selectedValue
            || (currentCabinetForKickboard.kickboard && currentCabinetForKickboard.kickboard.color),
        // پرداخت سطح (نور) — جدا از جنس ورق
        finish: finishEl ? finishEl.value : (currentCabinetForKickboard.kickboard && currentCabinetForKickboard.kickboard.finish) || 'matte',
        material: (document.getElementById("kickboard-panel-material") || {}).value
            || (currentCabinetForKickboard.kickboard && currentCabinetForKickboard.kickboard.material)
            || 'mdf'
    };
}

window.onKickboardFinishChange = function(value) {
    if (!currentCabinetForKickboard) return;
    if (!currentCabinetForKickboard.kickboard) currentCabinetForKickboard.kickboard = {};
    currentCabinetForKickboard.kickboard.finish = value || 'matte';
    if (typeof updateKickboardPreview === 'function') updateKickboardPreview();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets &&
        document.getElementById('modal-3d-container')?.style.display === 'flex') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForKickboard !== 'undefined' && currentCabinetForKickboard ? currentCabinetForKickboard.id : undefined);
    }
};

function openKickboardEditorPanel() {
    if (selectedId === -1) {
        alert("لطفاً ابتدا یک کابینت انتخاب کنید!");
        return;
    }

    currentCabinetForKickboard = cabinets.find(c => c.id === selectedId);
    if (!currentCabinetForKickboard) return;

    if (!currentCabinetForKickboard.kickboard) {
        currentCabinetForKickboard.kickboard = {
            enabled: true,
            height: 14,
            recess: 0,
            sides: { front: true, back: false, left: false, right: false },
            color: "#8B4513",
            finish: "matte",
            material: "mdf"
        };
    }
    if (!currentCabinetForKickboard.kickboard.finish) {
        currentCabinetForKickboard.kickboard.finish = "matte";
    }

    document.getElementById("kickboard-panel-cabinet-id").textContent = selectedId;
    document.getElementById("kickboard-enabled").checked = currentCabinetForKickboard.kickboard.enabled;
    document.getElementById("kickboard-height").value = currentCabinetForKickboard.kickboard.height || 14;
    const recessEl = document.getElementById("kickboard-recess");
    if (recessEl) recessEl.value = currentCabinetForKickboard.kickboard.recess !== undefined
        ? currentCabinetForKickboard.kickboard.recess
        : 0;
    
    // مقداردهی جهت‌ها
    const sides = currentCabinetForKickboard.kickboard.sides || { front: true, back: false, left: false, right: false };
    document.getElementById("kb-front").checked = !!sides.front;
    document.getElementById("kb-back").checked = !!sides.back;
    document.getElementById("kb-left").checked = !!sides.left;
    document.getElementById("kb-right").checked = !!sides.right;

    // بارگذاری رنگ و متریال
    const savedColor = currentCabinetForKickboard.kickboard.color || "#8B4513";
    
    // هماهنگی با دیتاست
    document.getElementById("kickboard-color-search").dataset.selectedValue = savedColor;
    document.getElementById("kickboard-color-search").value = getKickboardColorNameByValue(savedColor);

    // پرداخت سطح (HTML ثابت)
    const finishEl = document.getElementById("kickboard-panel-finish");
    if (finishEl) finishEl.value = currentCabinetForKickboard.kickboard.finish || "matte";
    const matEl = document.getElementById("kickboard-panel-material");
    if (matEl && currentCabinetForKickboard.kickboard.material) {
        matEl.value = currentCabinetForKickboard.kickboard.material;
    }

    // بارگذاری رنگ‌های اخیر از کابینت
    recentKickboardColors = currentCabinetForKickboard.recentKickboardColors || [];
    updateRecentKickboardColorsDisplay();

    updateKickboardPreview();
   
    document.getElementById("kickboard-editor-panel").classList.add("active");
    initKickboard3DPreview();
    buildKickboardPreviewCabinet();
}

/**
 * اتصال به مودال یونیورسال و سراسری پروژه
 */
window.openKickboardMaterialModal = function() {
    // 🟢 اصلاح شد: به‌جای مقدار ثابت mdf، نوع متریال فعلاً انتخاب‌شده در دراپ‌داون خوانده می‌شود
    const typeSelect = document.getElementById("kickboard-panel-material");
    const selectedType = typeSelect ? typeSelect.value : "mdf";

    if (typeof window.openUniversalModal === 'function') {
        window.openUniversalModal(
            "انتخاب طرح و رنگ پاخور", 
            selectedType, 
            function(material) {
                // کالبک بعد از انتخاب متریال از مودال
                selectKickboardMaterial(material);
            }
        );
    } else {
        // روش جایگزین محلی در صورت عدم وجود مودال سراسری
        const modal = document.getElementById("kickboard-material-modal");
        if (!modal) return;
        modal.style.display = "flex";
        modal.style.zIndex = "999999"; 
        modal.classList.add("active"); 
        renderKickboardMaterials();
        const searchInput = document.getElementById("modal-kickboard-search");
        if (searchInput) searchInput.focus();
    }
};

window.closeKickboardMaterialModal = function() {
    const modal = document.getElementById("kickboard-material-modal");
    if (modal) {
        modal.style.display = "none";
        modal.classList.remove("active");
    }
};

window.updateKickboardMaterials = function(selectedType) {
    const materials = window.allMaterials?.[selectedType];
    if (materials) {
        currentKickboardMaterials = materials;
        const modal = document.getElementById("kickboard-material-modal");
        if (modal && modal.style.display !== "none") {
            renderKickboardMaterials();
        }
    }
};

function renderKickboardMaterials(filter = "") {
    const grid = document.getElementById("modal-kickboard-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const filtered = currentKickboardMaterials.filter(item =>
        !filter ||
        item.name?.toLowerCase().includes(filter.toLowerCase()) ||
        item.code?.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(item => {
        const div = document.createElement("div");
        div.className = "color-item";
        const bg = item.texture ? `url(${item.texture}) center/cover` : (item.code || "#cccccc");
        div.innerHTML = `
            <div class="color-swatch" style="background: ${bg}; background-size: cover;"></div>
            <div class="color-name">${item.name || "بدون نام"}</div>
        `;
        div.onclick = () => selectKickboardMaterial(item);
        grid.appendChild(div);
    });
}

function selectKickboardMaterial(material) {
    const colorValue = material.texture || material.code || "#ffffff";
    const colorName = material.name || "متریال انتخاب شده";

    document.getElementById("kickboard-color-search").value = colorName;
    document.getElementById("kickboard-color-search").dataset.selectedValue = colorValue;

    // مدیریت لیست اخیر
    recentKickboardColors = recentKickboardColors.filter(c => {
        const val = (typeof c === 'object') ? (c.texture || c.code) : c;
        return val !== colorValue;
    });
    
    recentKickboardColors.unshift(material); 
    if (recentKickboardColors.length > 3) recentKickboardColors.pop();

    if (currentCabinetForKickboard) {
        currentCabinetForKickboard.recentKickboardColors = recentKickboardColors;
    }

    updateRecentKickboardColorsDisplay();
    closeKickboardMaterialModal();
    syncKickboardPreviewData();
    buildKickboardPreviewCabinet();
}

function updateRecentKickboardColorsDisplay() {
    const container = document.getElementById("kickboard-recent-colors");
    if (!container) return;

    const colorsToShow = [...recentKickboardColors];
    while (colorsToShow.length < 3) {
        colorsToShow.push("empty");
    }
    colorsToShow.length = 3;

    let html = "";
    colorsToShow.forEach(item => {
        if (item === "empty") {
            html += `
                <div class="color-dot" style="
                    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
                    border: 3px dashed #475569;
                    position: relative;
                    cursor: default;
                ">
                    <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; color: #64748b;">؟</span>
                </div>
            `;
        } else {
            const colorValue = (typeof item === 'object') ? (item.texture || item.code) : item;
            
            // جستجوی جامع در کل آبجکت متریال‌ها
            let foundMat = null;
            if (window.allMaterials) {
                for (let key in window.allMaterials) {
                    let m = window.allMaterials[key].find(i => i.code === colorValue || i.texture === colorValue);
                    if (m) { foundMat = m; break; }
                }
            }

            const bg = foundMat && foundMat.texture 
                ? `url(${foundMat.texture}) center/cover` 
                : (foundMat?.code || colorValue);

            const safeColorValue = String(colorValue).replace(/'/g, "\\'");

            html += `
                <div class="color-dot" style="background: ${bg}; background-size: cover; cursor: pointer;"
                     onclick="selectKickboardColorFromRecent('${safeColorValue}')"></div>
            `;
        }
    });

    container.innerHTML = html;
}

window.selectKickboardColorFromRecent = function(colorValue) {
    let item = null;
    if (window.allMaterials) {
        for (let key in window.allMaterials) {
            let m = window.allMaterials[key].find(i => i.code === colorValue || i.texture === colorValue);
            if (m) { item = m; break; }
        }
    }
    if (!item) item = { name: "رنگ اخیر", code: colorValue };

    const input = document.getElementById("kickboard-color-search");
    if (input) {
        input.value = item.name;
        input.dataset.selectedValue = colorValue;
    }

    recentKickboardColors = recentKickboardColors.filter(c => {
        const val = (typeof c === "object") ? (c.texture || c.code) : c;
        return val !== colorValue;
    });

    recentKickboardColors.unshift(item);
    updateRecentKickboardColorsDisplay();

    syncKickboardPreviewData();
    buildKickboardPreviewCabinet();
};

window.filterKickboardMaterials = function() {
    const query = document.getElementById("modal-kickboard-search")?.value || "";
    renderKickboardMaterials(query);
};

function closeKickboardEditorPanel() {
    const panel = document.getElementById("kickboard-editor-panel");
    if (panel) panel.classList.remove("active");
    currentCabinetForKickboard = null;
}

function updateKickboardPreview() {
    const canvas = document.getElementById("kickboard-preview-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const enabled = document.getElementById("kickboard-enabled").checked;
    if (!enabled) {
        ctx.fillStyle = "#64748b";
        ctx.font = "14px Tahoma";
        ctx.textAlign = "center";
        ctx.fillText("پاخور غیرفعال است", canvas.width / 2, canvas.height / 2);
        return;
    }

    const w = 120, d = 120;
    const x = (canvas.width - w) / 2, y = (canvas.height - d) / 2 + 10;

    ctx.strokeStyle = "#334155";
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, d);
    ctx.setLineDash([]);

    ctx.lineWidth = 5;
    if (document.getElementById("kb-front").checked) { ctx.strokeStyle = "#10b981"; ctx.beginPath(); ctx.moveTo(x, y + d); ctx.lineTo(x + w, y + d); ctx.stroke(); }
    if (document.getElementById("kb-back").checked) { ctx.strokeStyle = "#3b82f6"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke(); }
    if (document.getElementById("kb-left").checked) { ctx.strokeStyle = "#f59e0b"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + d); ctx.stroke(); }
    if (document.getElementById("kb-right").checked) { ctx.strokeStyle = "#ef4444"; ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + d); ctx.stroke(); }
}

function applyKickboardSettings() {
    if (!currentCabinetForKickboard) return;

    const enabled = document.getElementById("kickboard-enabled").checked;
    const colorSearchInput = document.getElementById("kickboard-color-search");
    
    let finalColorValue = colorSearchInput.dataset.selectedValue;

    if (!finalColorValue) {
        const colorName = colorSearchInput.value;
        if (typeof getColorValueByName === "function") {
            finalColorValue = getColorValueByName(colorName) || "#8B4513";
        } else {
            finalColorValue = "#8B4513";
        }
    }

    const finishEl = document.getElementById("kickboard-panel-finish");
    const matEl = document.getElementById("kickboard-panel-material");
    currentCabinetForKickboard.kickboard = {
        enabled: enabled,
        height: parseFloat(document.getElementById("kickboard-height").value) || 14,
        recess: (() => {
            const v = parseFloat(document.getElementById("kickboard-recess").value);
            return Number.isFinite(v) ? v : 0;
        })(),
        sides: {
            front: document.getElementById("kb-front").checked,
            back: document.getElementById("kb-back").checked,
            left: document.getElementById("kb-left").checked,
            right: document.getElementById("kb-right").checked
        },
        color: finalColorValue,
        finish: finishEl ? finishEl.value : (currentCabinetForKickboard.kickboard && currentCabinetForKickboard.kickboard.finish) || 'matte',
        material: matEl ? matEl.value : (currentCabinetForKickboard.kickboard && currentCabinetForKickboard.kickboard.material) || 'mdf'
    };
    
    currentCabinetForKickboard.recentKickboardColors = [...recentKickboardColors];

    if (typeof draw === "function") draw();
    
    // رندر مجدد سه بعدی صحنه اصلی با امنیت بالا
    if (window.Kitchen3D && typeof window.Kitchen3D.renderCabinets === "function") {
        if (window.Kitchen3D.scene) {
            window.Kitchen3D.renderCabinets();
        }
    }
    // رفرش نمای Babylon اگر باز است
    if (window.KitchenBabylon && window.KitchenBabylon.isReady) {
        try {
            if (typeof window.KitchenBabylon.refreshCabinets === "function") {
                window.KitchenBabylon.refreshCabinets();
            } else if (typeof window.KitchenBabylon.renderCabinets === "function") {
                window.KitchenBabylon.renderCabinets();
            }
        } catch (e) {}
    }

    closeKickboardEditorPanel();
}

// --- توابع کمکی تبدیل مقدار متریال به نام چشمی ---
function findKickboardMaterialByValue(val) {
    if (!window.allMaterials) return null;
    for (let type in window.allMaterials) {
        if (Array.isArray(window.allMaterials[type])) {
            const found = window.allMaterials[type].find(m => (m.code === val || m.texture === val));
            if (found) return found;
        }
    }
    return null;
}

function getKickboardColorNameByValue(val) {
    const m = findKickboardMaterialByValue(val);
    return m ? m.name : "قهوه‌ای بلوط";
}

// --- بخش رندر اختصاصی پیش‌نمایش کوچیک سه بعدی پاخور ---
let kbPreviewScene, kbPreviewCamera, kbPreviewRenderer;
let kbPreviewGroup;
let kbPreviewRotation = 0;
let kbIsDragging = false;
let kbLastX = 0;

function initKickboard3DPreview() {
    if (kbPreviewRenderer) return;
    const container = document.getElementById("kickboard-preview-3d");
    if (!container) return;

    kbPreviewScene = new THREE.Scene();
    kbPreviewScene.background = new THREE.Color(0x111827);

    kbPreviewCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000);
    kbPreviewCamera.position.set(0, 80, 200);

    kbPreviewRenderer = new THREE.WebGLRenderer({ antialias: true });
    kbPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;
    kbPreviewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    kbPreviewRenderer.toneMappingExposure = 1.0;
    kbPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    kbPreviewRenderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = "";
    container.appendChild(kbPreviewRenderer.domElement);

    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(100, 200, 100);
    kbPreviewScene.add(light1);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    kbPreviewScene.add(ambient);

    kbPreviewGroup = new THREE.Group();
    kbPreviewScene.add(kbPreviewGroup);

    setupKickboardPreviewControls(container);
    animateKickboardPreview();
}

function setupKickboardPreviewControls(container) {
    container.addEventListener("mousedown", e => { kbIsDragging = true; kbLastX = e.clientX; });
    window.addEventListener("mouseup", () => { kbIsDragging = false; });
    window.addEventListener("mousemove", e => {
        if (!kbIsDragging) return;
        const delta = e.clientX - kbLastX;
        kbLastX = e.clientX;
        kbPreviewRotation += delta * 0.01;
        kbPreviewGroup.rotation.y = kbPreviewRotation;
    });

    container.addEventListener("touchstart", e => { kbIsDragging = true; kbLastX = e.touches[0].clientX; });
    container.addEventListener("touchend", () => { kbIsDragging = false; });
    container.addEventListener("touchmove", e => {
        if (!kbIsDragging) return;
        const currentX = e.touches[0].clientX;
        const delta = currentX - kbLastX;
        kbLastX = currentX;
        kbPreviewRotation += delta * 0.01;
        kbPreviewGroup.rotation.y = kbPreviewRotation;
    });
}

function buildKickboardPreviewCabinet() {
    if (!currentCabinetForKickboard || !kbPreviewGroup) return;
    kbPreviewGroup.clear();

    const c = currentCabinetForKickboard;
    kbPreviewGroup.position.y = -c.h / 2 + 30;

    // بدنه اصلی کابینت در پیش‌نمایش
    const bodyGeo = new THREE.BoxGeometry(c.w, c.h, c.d);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = c.h / 2;
    kbPreviewGroup.add(body);

    if (!c.kickboard || !c.kickboard.enabled) return;

    const kbH = c.kickboard.height || 14;
    const thick = 1.6;

    let mat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.1 });
    const value = c.kickboard.color;

    if (value && value.startsWith("#")) {
        mat.color.set(value);
    } else if (value) {
        const loader = new THREE.TextureLoader();
        const tex = loader.load(value);
        if (THREE.SRGBColorSpace != null) tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
        mat.map = tex;
        mat.color.set(0xffffff);
    }

    const sides = c.kickboard.sides || {};

    if (sides.front) {
        const geo = new THREE.BoxGeometry(c.w, kbH, thick);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, kbH / 2, c.d / 2 - thick / 2);
        kbPreviewGroup.add(mesh);
    }
    if (sides.back) {
        const geo = new THREE.BoxGeometry(c.w, kbH, thick);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, kbH / 2, -c.d / 2 + thick / 2);
        kbPreviewGroup.add(mesh);
    }
    if (sides.left) {
        const geo = new THREE.BoxGeometry(thick, kbH, c.d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(-c.w / 2 + thick / 2, kbH / 2, 0);
        kbPreviewGroup.add(mesh);
    }
    if (sides.right) {
        const geo = new THREE.BoxGeometry(thick, kbH, c.d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(c.w / 2 - thick / 2, kbH / 2, 0);
        kbPreviewGroup.add(mesh);
    }
}

function animateKickboardPreview() {
    requestAnimationFrame(animateKickboardPreview);
    if (kbPreviewRenderer && kbPreviewScene && kbPreviewCamera) {
        kbPreviewRenderer.render(kbPreviewScene, kbPreviewCamera);
    }
}

// --- رویدادهای لایو آپدیت کامپوننت ---
document.addEventListener("DOMContentLoaded", () => {
    const fields = ["kickboard-height", "kickboard-recess", "kb-front", "kb-back", "kb-left", "kb-right", "kickboard-enabled"];
    fields.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            const eventType = elem.type === "checkbox" ? "change" : "input";
            elem.addEventListener(eventType, () => {
                syncKickboardPreviewData();
                updateKickboardPreview();
                buildKickboardPreviewCabinet();
            });
        }
    });
});

// مپ کردن توابع روی Window
window.openKickboardEditorPanel = openKickboardEditorPanel;
window.closeKickboardEditorPanel = closeKickboardEditorPanel;
window.applyKickboardSettings = applyKickboardSettings;
window.updateKickboardPreview = updateKickboardPreview;
