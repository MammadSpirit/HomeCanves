// js/components/crown-editor.js

let currentCabinetForCrown = null;
let currentCrownMaterials = window.allMaterials?.mdf || []; // متریال‌های پیش‌فرض تاج

// 🌟 رفع باگ قدیمی: این تابع تو HTML صدا زده می‌شد ولی هیچ‌جا تعریف نشده بود
function updateCrownPreview() {
    syncCrownPreviewData();
    buildCrownPreviewCabinet();
}

function syncCrownPreviewData() {
    if (!currentCabinetForCrown) return;

    // 🟢 اصلاح شد: خواندن مقدار نام رنگ و دیتای هگز/تکسچر به صورت همزمان
    const colorInput = document.getElementById("crown-color-search");
    const savedColor = colorInput ? colorInput.dataset.selectedValue : "#ffffff";
    const savedName = colorInput ? colorInput.value : "سفید یخچالی";

    const finishEl = document.getElementById("crown-panel-finish");
    const matEl = document.getElementById("crown-panel-material");
    currentCabinetForCrown.crown = {
        enabled: document.getElementById("crown-enabled").checked,
        ledLight: document.getElementById("crown-led-light").checked,
        height: parseFloat(document.getElementById("crown-height").value) || 5,
        projection: parseFloat(document.getElementById("crown-projection").value) || 0, 
        sides: {
            front: document.getElementById("cr-front").checked,
            back: document.getElementById("cr-back").checked,
            left: document.getElementById("cr-left").checked,
            right: document.getElementById("cr-right").checked
        },
        color: savedColor || (currentCabinetForCrown.crown ? currentCabinetForCrown.crown.color : "#ffffff"),
        colorName: savedName, // 🟢 گام اول حل باگ: ذخیره دایمی نام رنگ در آبجکت کابینت
        finish: finishEl ? finishEl.value : (currentCabinetForCrown.crown && currentCabinetForCrown.crown.finish) || 'matte',
        material: matEl ? matEl.value : (currentCabinetForCrown.crown && currentCabinetForCrown.crown.material) || 'mdf'
    };
}

window.onCrownFinishChange = function(value) {
    if (!currentCabinetForCrown) return;
    if (!currentCabinetForCrown.crown) currentCabinetForCrown.crown = {};
    currentCabinetForCrown.crown.finish = value || 'matte';
    if (typeof updateCrownPreview === 'function') updateCrownPreview();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets &&
        document.getElementById('modal-3d-container')?.style.display === 'flex') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForCrown !== 'undefined' && currentCabinetForCrown ? currentCabinetForCrown.id : undefined);
    }
};


function openCrownEditorPanel() {
    if (selectedId === -1) {
        alert("لطفاً ابتدا یک کابینت انتخاب کنید!");
        return;
    }

    currentCabinetForCrown = cabinets.find(c => c.id === selectedId);
    if (!currentCabinetForCrown) return;

    // ایجاد تنظیمات پیش‌فرض تاج در صورت عدم وجود
    if (!currentCabinetForCrown.crown) {
        const defaultMat = currentCrownMaterials[0] || { name: "سفید", code: "#ffffff" };
        currentCabinetForCrown.crown = {
            enabled: true,
            ledLight: false,
            height: 5,
            projection: 2, 
            sides: { front: true, back: false, left: true, right: true },
            color: defaultMat.texture || defaultMat.code || "#ffffff",
            colorName: defaultMat.name || "سفید",
            finish: "matte",
            material: "mdf"
        };
    }
    if (!currentCabinetForCrown.crown.finish) {
        currentCabinetForCrown.crown.finish = "matte";
    }

    // مقداردهی به المان‌های فرم پنل
    document.getElementById("crown-panel-cabinet-id").textContent = selectedId;
    document.getElementById("crown-enabled").checked = currentCabinetForCrown.crown.enabled;
    document.getElementById("crown-led-light").checked = !!currentCabinetForCrown.crown.ledLight;
    document.getElementById("crown-height").value = currentCabinetForCrown.crown.height || 5;
    document.getElementById("crown-projection").value = currentCabinetForCrown.crown.projection || 0;
    
    const sides = currentCabinetForCrown.crown.sides || { front: true, back: false, left: true, right: true };
    document.getElementById("cr-front").checked = !!sides.front;
    document.getElementById("cr-back").checked = !!sides.back;
    document.getElementById("cr-left").checked = !!sides.left;
    document.getElementById("cr-right").checked = !!sides.right;

    // بارگذاری مشخصات رنگ و متریال
    const savedColor = currentCabinetForCrown.crown.color;
    const savedName = currentCabinetForCrown.crown.colorName || getCrownColorNameByValue(savedColor);

    const colorInput = document.getElementById("crown-color-search");
    if (colorInput) {
        colorInput.value = savedName;
        colorInput.dataset.selectedValue = savedColor;
    }

    // پرداخت سطح (HTML ثابت)
    const finishEl = document.getElementById("crown-panel-finish");
    if (finishEl) finishEl.value = currentCabinetForCrown.crown.finish || "matte";
    const matEl = document.getElementById("crown-panel-material");
    if (matEl && currentCabinetForCrown.crown.material) {
        matEl.value = currentCabinetForCrown.crown.material;
    }

    document.getElementById("crown-editor-panel").classList.add("active");
    
    initCrown3DPreview();
    buildCrownPreviewCabinet();
}

/**
 * اتصال به مودال یونیورسال و سراسری پروژه
 */
window.openCrownMaterialModal = function() {
    // 🟢 اصلاح شد: به‌جای مقدار ثابت mdf، نوع متریال فعلاً انتخاب‌شده در دراپ‌داون خوانده می‌شود
    const typeSelect = document.getElementById("crown-panel-material");
    const selectedType = typeSelect ? typeSelect.value : "mdf";

    if (typeof window.openUniversalModal === 'function') {
        window.openUniversalModal(
            "انتخاب طرح و رنگ تاج کابینت", 
            selectedType, 
            function(material) {
                selectCrownMaterial(material);
            }
        );
    } else {
        // ساختار بک‌آپ محلی
        const modal = document.getElementById("crown-material-modal");
        if (!modal) return;
        modal.classList.add("active");
        renderCrownMaterials();
        const searchInput = document.getElementById("modal-crown-search");
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    }
};

window.closeCrownMaterialModal = function() {
    const modal = document.getElementById("crown-material-modal");
    if (modal) modal.classList.remove("active");
};

window.updateCrownMaterials = function(selectedType) {
    const materials = window.allMaterials?.[selectedType];
    if (materials && materials.length > 0) {
        currentCrownMaterials = materials;
        
        const firstMat = materials[0];
        const colorInput = document.getElementById("crown-color-search");
        if (colorInput) {
            colorInput.value = firstMat.name;
            colorInput.dataset.selectedValue = firstMat.texture || firstMat.code;
        }
        
        syncCrownPreviewData();
        buildCrownPreviewCabinet();

        const modal = document.getElementById("crown-material-modal");
        if (modal && modal.classList.contains("active")) {
            renderCrownMaterials();
        }
    }
};

function renderCrownMaterials(filter = "") {
    const grid = document.getElementById("modal-crown-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const filtered = currentCrownMaterials.filter(item =>
        !filter || item.name?.toLowerCase().includes(filter.toLowerCase()) || item.code?.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(item => {
        const div = document.createElement("div");
        div.className = "color-item";
        const bg = item.texture ? `url(${item.texture}) center/cover` : (item.code || "#cccccc");
        div.innerHTML = `
            <div class="color-swatch" style="background: ${bg}; background-size: cover;"></div>
            <div class="color-name">${item.name || "بدون نام"}</div>
        `;
        div.onclick = () => selectCrownMaterial(item);
        grid.appendChild(div);
    });
}

function selectCrownMaterial(material) {
    const colorValue = material.texture || material.code || "#ffffff";
    const colorName = material.name || "انتخاب شده";

    const colorInput = document.getElementById("crown-color-search");
    if (colorInput) {
        colorInput.value = colorName;
        colorInput.dataset.selectedValue = colorValue;
    }

    if (currentCabinetForCrown && currentCabinetForCrown.crown) {
        currentCabinetForCrown.crown.colorName = colorName;
    }

    closeCrownMaterialModal();
    syncCrownPreviewData();
    buildCrownPreviewCabinet();
}

window.filterCrownMaterials = function() {
    const query = document.getElementById("modal-crown-search")?.value || "";
    renderCrownMaterials(query);
};

function closeCrownEditorPanel() {
    const panel = document.getElementById("crown-editor-panel");
    if (panel) panel.classList.remove("active");
    currentCabinetForCrown = null;
}

function applyCrownSettings() {
    if (!currentCabinetForCrown) return;
    syncCrownPreviewData();

    if (typeof draw === "function") draw();
    
    // لایو آپدیت و رندر مجدد صحنه ۳بعدی اصلی پروژه
    if (window.Kitchen3D && typeof window.Kitchen3D.renderCabinets === "function") {
        window.Kitchen3D.renderCabinets();
    }
    if (window.KitchenBabylon && window.KitchenBabylon.isReady) {
        try {
            if (typeof window.KitchenBabylon.refreshCabinets === "function") {
                window.KitchenBabylon.refreshCabinets();
            } else if (typeof window.KitchenBabylon.renderCabinets === "function") {
                window.KitchenBabylon.renderCabinets();
            }
        } catch (e) {}
    }
    closeCrownEditorPanel();
}

// --- توابع کمکی واکشی نام متریال ---
function getCrownColorNameByValue(val) {
    if (!window.allMaterials) return "سفید";
    for (let type in window.allMaterials) {
        const found = window.allMaterials[type].find(m => (m.code === val || m.texture === val));
        if (found) return found.name;
    }
    return "انتخاب شده";
}

// --- موتور پیش‌نمایش سه بعدی کوچک داخل پنل تاج ---
let crPreviewScene, crPreviewCamera, crPreviewRenderer, crPreviewGroup;
let crPreviewRotation = 0, crIsDragging = false, crLastX = 0;

function initCrown3DPreview() {
    if (crPreviewRenderer) return;
    const container = document.getElementById("crown-preview-3d");
    if (!container) return;

    crPreviewScene = new THREE.Scene();
    crPreviewScene.background = new THREE.Color(0x111827);
    crPreviewCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000);
    crPreviewCamera.position.set(0, 120, 250);

    crPreviewRenderer = new THREE.WebGLRenderer({ antialias: true });
    crPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;
    crPreviewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    crPreviewRenderer.toneMappingExposure = 1.0;
    crPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    crPreviewRenderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = "";
    container.appendChild(crPreviewRenderer.domElement);

    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(100, 200, 100);
    crPreviewScene.add(light1);
    crPreviewScene.add(new THREE.AmbientLight(0xffffff, 0.6));

    crPreviewGroup = new THREE.Group();
    crPreviewScene.add(crPreviewGroup);

    setupCrownPreviewControls(container);
    animateCrownPreview();
}

function setupCrownPreviewControls(container) {
    const startAction = (x) => { crIsDragging = true; crLastX = x; };
    const moveAction = (x) => {
        if (!crIsDragging) return;
        crPreviewRotation += (x - crLastX) * 0.01;
        crPreviewGroup.rotation.y = crPreviewRotation;
        crLastX = x;
    };
    container.addEventListener("mousedown", e => startAction(e.clientX));
    window.addEventListener("mousemove", e => moveAction(e.clientX));
    window.addEventListener("mouseup", () => crIsDragging = false);
    container.addEventListener("touchstart", e => startAction(e.touches[0].clientX));
    container.addEventListener("touchmove", e => moveAction(e.touches[0].clientX));
    container.addEventListener("touchend", () => crIsDragging = false);
}

function buildCrownPreviewCabinet() {
    if (!currentCabinetForCrown || !crPreviewGroup) return;
    crPreviewGroup.clear();
    const c = currentCabinetForCrown;

    crPreviewGroup.position.y = -c.h / 2 + 30; 

    // بدنه کابینت
    const bodyGeo = new THREE.BoxGeometry(c.w, c.h, c.d);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = c.h / 2; 
    crPreviewGroup.add(body);

    if (!c.crown || !c.crown.enabled) return;
    
    const crH = c.crown.height || 5;
    const proj = c.crown.projection || 0; 
    const thick = 1.6; // ضخامت استاندارد ورق ۱۶ میل
    
    const finishKey = c.crown.finish || 'matte';
    const preset = (typeof window.getKitchenFinishPreset === 'function')
        ? window.getKitchenFinishPreset(finishKey)
        : { roughness: 0.7, metalness: 0.02 };
    let mat;
    if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
        mat = new THREE.MeshPhysicalMaterial({
            roughness: preset.roughness,
            metalness: preset.metalness,
            clearcoat: preset.clearcoat,
            clearcoatRoughness: preset.clearcoatRoughness || 0.05
        });
    } else {
        mat = new THREE.MeshStandardMaterial({
            roughness: preset.roughness,
            metalness: preset.metalness
        });
    }
    const val = c.crown.color;

    if (val && val.startsWith("#")) {
        mat.color.set(val);
    } else if (val) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        const tex = loader.load(val);
        if (THREE.SRGBColorSpace != null) tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        mat.map = tex;
        mat.color.set(0xffffff);
    }

    const sides = c.crown.sides || {};
    const topY = c.h + (crH / 2);

    // ۱. تاج جلو
    if (sides.front) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(c.w + (sides.left ? thick : 0) + (sides.right ? thick : 0), crH, thick), mat);
        mesh.position.set(0, topY, (c.d / 2) + proj + (thick / 2));
        crPreviewGroup.add(mesh);
    }

    // ۲. تاج عقب
    if (sides.back) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(c.w, crH, thick), mat);
        mesh.position.set(0, topY, -c.d / 2 - thick / 2);
        crPreviewGroup.add(mesh);
    }

    // محاسبه دقیق عمق لبه‌های کناری بر اساس پیش‌آمدگی جلو و ضخامت ورق‌ها
    const extraFront = sides.front ? (thick + proj) : 0;
    const extraBack = sides.back ? thick : 0;
    const totalDepth = c.d + extraFront + extraBack;
    const zPos = (extraFront - extraBack) / 2;

    // ۳. تاج چپ
    if (sides.left) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(thick, crH, totalDepth), mat);
        mesh.position.set(-c.w / 2 - thick / 2, topY, zPos);
        crPreviewGroup.add(mesh);
    }

    // ۴. تاج راست
    if (sides.right) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(thick, crH, totalDepth), mat);
        mesh.position.set(c.w / 2 + thick / 2, topY, zPos);
        crPreviewGroup.add(mesh);
    }

// ۵. زیر تاج (کف کاذب پیش‌آمدگی جهت جلوگیری از خالی دیده شدن زیر تاج)
    if (proj > 0 && sides.front) {
        const bottomGeo = new THREE.BoxGeometry(c.w, thick, proj);
        const bottomMesh = new THREE.Mesh(bottomGeo, mat);
        bottomMesh.position.set(0, c.h + (thick / 2), (c.d / 2) + (proj / 2));
        crPreviewGroup.add(bottomMesh);
    }

// ⭐ ۶. لاین نور LED تاج (پیش‌نمایش — سفید گرم ظریف)
    if (c.crown.ledLight) {
        const ledColor = 0xfff2e0;
        const ledMat = new THREE.MeshStandardMaterial({
            color: ledColor,
            emissive: ledColor,
            emissiveIntensity: 2.0,
            roughness: 0.35,
            metalness: 0.05,
            toneMapped: false
        });
        const ledThick = 0.45;
        const bodyTopY = c.h;

        if (sides.front) {
            const frontZ = (c.d / 2) + proj - ledThick * 0.3;
            const frontW = Math.max(5, c.w - (sides.left ? thick : 0) - (sides.right ? thick : 0));
            const geo = new THREE.BoxGeometry(frontW, ledThick, ledThick);
            const led = new THREE.Mesh(geo, ledMat);
            led.position.set(0, bodyTopY + 0.15, frontZ);
            crPreviewGroup.add(led);

            // نور نرم در پیش‌نمایش برای حس گرادیان
            const previewLight = new THREE.PointLight(ledColor, 1.2, 80);
            previewLight.position.set(0, bodyTopY - 5, frontZ - 10);
            crPreviewGroup.add(previewLight);
        }
    }
}

function animateCrownPreview() {
    requestAnimationFrame(animateCrownPreview);
    if (crPreviewRenderer && crPreviewScene && crPreviewCamera) {
        crPreviewRenderer.render(crPreviewScene, crPreviewCamera);
    }
}

// رویدادهای لایو آپدیت امن المان‌ها بعد از لود کامل صفحه
document.addEventListener("DOMContentLoaded", () => {
    const elements = ["crown-height", "crown-projection", "cr-front", "cr-back", "cr-left", "cr-right", "crown-enabled"];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(el.type === "checkbox" ? "change" : "input", () => {
                syncCrownPreviewData();
                buildCrownPreviewCabinet();
            });
        }
    });
});

// مپ کردن روی آبجکت سراسری window
window.openCrownEditorPanel = openCrownEditorPanel;
window.closeCrownEditorPanel = closeCrownEditorPanel;
window.applyCrownSettings = applyCrownSettings;
