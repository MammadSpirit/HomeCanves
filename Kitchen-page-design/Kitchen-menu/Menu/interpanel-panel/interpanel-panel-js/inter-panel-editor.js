
function refreshBabylonInterPanels() {
    try {
        if (window.KitchenBabylon && window.KitchenBabylon.isReady) {
            if (typeof window.KitchenBabylon.refreshInterPanels === 'function') {
                window.KitchenBabylon.refreshInterPanels();
            } else if (typeof window.KitchenBabylon._renderInterPanels === 'function') {
                window.KitchenBabylon._renderInterPanels();
            }
        }
    } catch (e) {}
}
// js/components/inter-panel-editor.js

window.interPanels = window.interPanels || [];
let currentInterPanelIndex = 0;
let recentInterColors = []; // ذخیره ۳ متریال آخر انتخاب شده متریال‌های فعلی در مودال

// ۱. همگام‌سازی داده‌های UI با آبجکت
function syncInterPanelData() {
    if (window.interPanels.length === 0 || currentInterPanelIndex === -1) return;

    const p = window.interPanels[currentInterPanelIndex];
    
    // خواندن مقادیر از ورودی‌ها
    p.enabled = document.getElementById("interpanel-enabled").checked;
    p.length = parseFloat(document.getElementById("interpanel-length").value) || 0;
    p.width = parseFloat(document.getElementById("interpanel-width").value) || 0;
    p.x = parseFloat(document.getElementById("interpanel-x").value) || 0;
    p.y = parseFloat(document.getElementById("interpanel-y").value) || 0;
    
    // ذخیره نوع ورق انتخابی (mdf یا marbleSheet)
    const typeSelect = document.getElementById("interpanel-material-type");
    if (typeSelect) p.materialType = typeSelect.value;

    // پرداخت سطح (نور) — جدا از جنس ورق
    const finishSelect = document.getElementById("interpanel-finish");
    if (finishSelect) p.finish = finishSelect.value || 'matte';

    const wallOption = document.querySelector('input[name="inter-wall"]:checked');
    if (wallOption) p.wall = wallOption.value;

    const colorInput = document.getElementById("interpanel-color-search");
    p.color = colorInput.dataset.selectedValue || "#ffffff";
    p.colorName = colorInput.value || "سفید";

    updateInterPanelPreview(); // آپدیت مستطیل پیش‌نمایش ۲بعدی
    buildInterPreviewScene(); // آپدیت لحظه‌ای مدل ۳بعدی کوچک
}

window.onInterPanelFinishChange = function(value) {
    if (window.interPanels.length === 0 || currentInterPanelIndex === -1) return;
    const p = window.interPanels[currentInterPanelIndex];
    if (!p) return;
    p.finish = value || 'matte';
    if (typeof buildInterPreviewScene === 'function') buildInterPreviewScene();
    if (window.Kitchen3D?.refreshInterPanels) window.Kitchen3D.refreshInterPanels();
    if (typeof refreshBabylonInterPanels === "function") refreshBabylonInterPanels();
};


// ۲. مدیریت لیست ورق‌ها (سمت راست پنل)
function renderInterPanelList() {
    const container = document.getElementById("interpanel-list-container");
    if (!container) return;
    
    container.innerHTML = "";
    window.interPanels.forEach((p, index) => {
        const item = document.createElement("div");
        const isActive = index === currentInterPanelIndex;
        
        item.style = `padding:8px 12px; background:${isActive ? '#3b82f6' : '#334155'}; border-radius:8px; margin-bottom:5px; cursor:pointer; display:flex; justify-content:space-between; color:white; font-size:13px; transition:0.2s;`;
        
        const wallName = p.wall === 'back' ? 'روبرو' : p.wall === 'left' ? 'چپ' : p.wall === 'right' ? 'راست' : 'جلو';
        item.innerHTML = `<span>ورق ${index + 1} (${wallName})</span> <small>${p.length}cm</small>`;
        
        item.onclick = () => {
            currentInterPanelIndex = index;
            loadInterPanelData(index);
            renderInterPanelList();
            buildInterPreviewScene();
        };
        container.appendChild(item);
    });
}
// ۳. بارگذاری اطلاعات یک ورق در فیلدها
function loadInterPanelData(index) {
    const p = window.interPanels[index];
    if (!p) return;

    renderInterPanelWallOptions();

    document.getElementById("interpanel-enabled").checked = p.enabled;
    document.getElementById("interpanel-length").value = p.length;
    document.getElementById("interpanel-width").value = p.width;
    document.getElementById("interpanel-x").value = p.x;
    document.getElementById("interpanel-y").value = p.y;
    
    // اضافه شده: مقداردهی منوی نوع ورق بر اساس دیتای ذخیره شده (MDF یا ماربل شیت)
    const typeSelect = document.getElementById("interpanel-material-type");
    if (typeSelect) {
        typeSelect.value = p.materialType || "mdf"; // لود پیش‌فرض mdf در صورت نبود مقدار
    }

    // پرداخت سطح
    const finishSelect = document.getElementById("interpanel-finish");
    if (finishSelect) finishSelect.value = p.finish || 'matte';

    const colorInput = document.getElementById("interpanel-color-search");
    colorInput.value = p.colorName || "سفید";
    colorInput.dataset.selectedValue = p.color || "#ffffff";

    updateInterRecentDisplay(); 
    updateInterPanelPreview();
    if (window.Kitchen3D?.refreshInterPanels) {
        window.Kitchen3D.refreshInterPanels();
    }
    if (typeof refreshBabylonInterPanels === 'function') refreshBabylonInterPanels();
}




function selectInterMaterial(material) {
    if (!material) return;
    
    const colorValue = material.texture || material.code || "#ffffff";
    const colorName = material.name || "انتخاب شده";

    const input = document.getElementById("interpanel-color-search");
    if (input) {
        input.value = colorName;
        input.dataset.selectedValue = colorValue;
    }

    // مدیریت لیست رنگ‌های اخیر (Recent Colors)
    recentInterColors = recentInterColors.filter(c => (c.texture || c.code) !== colorValue);
    recentInterColors.unshift(material);
    if (recentInterColors.length > 3) recentInterColors.pop();

    // به‌روزرسانی نماها و همگام‌سازی اطلاعات
    updateInterRecentDisplay();
    syncInterPanelData();
}


// ۵. نمایش دایره‌های رنگی اخیر (استایل تاج)
function updateInterRecentDisplay() {
    const container = document.getElementById("interpanel-recent-colors");
    if (!container) return;

    const colorsToShow = [...recentInterColors];
    while (colorsToShow.length < 3) colorsToShow.push("empty");

    let html = "";
    colorsToShow.forEach(item => {
        if (item === "empty") {
            html += `<div class="color-dot" style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); border: 2px dashed #475569; position: relative;"><span style="font-size: 12px; color: #64748b; position: absolute; top:50%; left:50%; transform:translate(-50%,-50%);">؟</span></div>`;
        } else {
            const val = item.texture || item.code;
            const bg = item.texture ? `url(${item.texture}) center/cover` : (item.code || val);
            const safeVal = String(val).replace(/'/g, "\\'");
            html += `<div class="color-dot" style="background: ${bg}; background-size: cover; cursor: pointer;" onclick="applyRecentInterColor('${safeVal}', '${item.name}')"></div>`;
        }
    });
    container.innerHTML = html;
}

window.applyRecentInterColor = function(val, name) {
    const input = document.getElementById("interpanel-color-search");
    if (input) {
        input.value = name;
        input.dataset.selectedValue = val;
    }
    syncInterPanelData();
    updateInterPanelPreview(); // پیش‌نمایش مستطیل ۲بعدی لایو
    buildInterPreviewScene();  // پیش‌نمایش مینی ۳بعدی لایو
};


// ۶. پیش‌نمایش گرافیکی ورق (تصویری)
function updateInterPanelPreview() {
    if (currentInterPanelIndex === -1 || !window.interPanels[currentInterPanelIndex]) return;
    const p = window.interPanels[currentInterPanelIndex];
    const visualRect = document.getElementById("interpanel-visual-rect");
    
    if (visualRect) {
        // نسبت ابعاد واقعی را در باکس کوچک شبیه‌سازی می‌کنیم
        visualRect.style.width = Math.min(p.length, 100) + "%";
        visualRect.style.height = Math.min(p.width, 100) + "%";
        
        if (p.color && p.color.includes('http')) {
            visualRect.style.background = `url(${p.color}) center/cover`;
        } else {
            visualRect.style.background = p.color || 'white';
        }
    }
}

// ۷. توابع باز و بسته کردن و حذف
window.openInterPanelEdit = function() {
    // اضافه کردن ساخت لیست دیوارها قبل از هر کاری
    renderInterPanelWallOptions();

    // ۱. مدیریت دیتا
    if (window.interPanels.length === 0) {
        addNewInterPanelItem();
    } else {
        loadInterPanelData(currentInterPanelIndex);
    }
    renderInterPanelList();

    // ۲. نمایش پنل
    const panel = document.getElementById("interpanel-edit-panel");
    panel.classList.add("active");

    // ۳. استفاده از فریم بعدی برای اطمینان از لود شدن DOM بدون تایمر
    requestAnimationFrame(() => {
        initInter3DPreview();
        buildInterPreviewScene();
    });
};


window.closeInterPanelEdit = function() {
    document.getElementById("interpanel-edit-panel").classList.remove("active");
};

function addNewInterPanelItem() {
    const newPanel = {
        enabled: true,
        length: 100,
        width: 60,
        x: 0,
        y: 85,
        wall: 'back',
        materialType: "mdf", // نوع پیش‌فرض
        color: "#ffffff",
        colorName: "سفید",
        finish: "matte"
    };
    window.interPanels.push(newPanel);
    currentInterPanelIndex = window.interPanels.length - 1;
    loadInterPanelData(currentInterPanelIndex);
    renderInterPanelList();
}


function deleteCurrentInterPanel() {
    if (window.interPanels.length === 0) return;
    window.interPanels.splice(currentInterPanelIndex, 1);
    currentInterPanelIndex = Math.max(0, currentInterPanelIndex - 1);
    
    if (window.interPanels.length === 0) {
        closeInterPanelEdit();
    } else {
        renderInterPanelList();
        loadInterPanelData(currentInterPanelIndex);
    }
    // آپدیت آنی در صحنه ۳بعدی
    if (window.Kitchen3D?.refreshInterPanels) window.Kitchen3D.refreshInterPanels();
    if (typeof refreshBabylonInterPanels === "function") refreshBabylonInterPanels();
}

// ۸. اعمال نهایی (اتصال به View3D)
function applyInterPanelSettings() {
    syncInterPanelData();
    // فراخوانی مستقیم از شیء اصلی Kitchen3D
    if (window.Kitchen3D && typeof window.Kitchen3D.refreshInterPanels === "function") {
        window.Kitchen3D.refreshInterPanels();
        if (typeof refreshBabylonInterPanels === 'function') refreshBabylonInterPanels();
    }
    closeInterPanelEdit();
}


window.openInterPanelMaterialModal = function() {
    // ۱. گرفتن نوع متریال انتخاب شده در منوی کشویی پنل (mdf یا marbleSheet)
    const typeSelect = document.getElementById("interpanel-material-type");
    const selectedValue = typeSelect ? typeSelect.value : "mdf"; 

    // ۲. فیکس کردن نگاشت کلیدها: اگر آپشن marbleSheet انتخاب شده بود، باید دیتای کاتگوری backsplash را بخواند
    let targetCategory = selectedValue;
    if (selectedValue === "marbleSheet") {
        targetCategory = "backsplash"; // نگاشت به کلید اصلی در all-materials.js
    }

    // ۳. تعیین عنوان داینامیک هدر مودال
    const modalTitle = selectedValue === "marbleSheet" ? "انتخاب طرح ماربل شیت (بین‌کابینتی)" : "انتخاب طرح و رنگ ام‌دی‌اف";

    // ۴. باز کردن مودال سراسری با کاتگوری اصلاح شده
    if (typeof window.openUniversalModal === 'function') {
        window.openUniversalModal(
            modalTitle, 
            targetCategory, // پاس دادن کلید تصحیح شده برای خواندن از آرایه (mdf یا backsplash)
            function(material) {
                selectInterMaterial(material);
            }
        );
    } else {
        console.error("تابع openUniversalModal یافت نشد!");
    }
};




// ۱۰. Event Listeners برای لایو آپدیت
["interpanel-length", "interpanel-width", "interpanel-x", "interpanel-y", "interpanel-enabled"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", syncInterPanelData);
});
// اضافه شده: آپدیت لحظه‌ای پیش‌نمایش ۳بعدی وقتی تیک دیوارهای اصلی در آشپزخانه تغییر می‌کند
["wall-top", "wall-left", "wall-right", "wall-bottom"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener("change", () => {
            // چک می‌کنیم اگر پنل ویرایش باز است، صحنه ۳بعدی را بازسازی کن
            const panel = document.getElementById("interpanel-edit-panel");
            if (panel && panel.classList.contains("active")) {
                buildInterPreviewScene();
            }
        });
    }
});

document.querySelectorAll('input[name="inter-wall"]').forEach(radio => {
    radio.addEventListener("change", syncInterPanelData);
});
// --- بخش رندر ۳بعدی کوچک برای بین‌کابینتی ---

let interScene, interCamera, interRenderer, interGroup;
let interRotation = 0, interIsDragging = false, interLastX = 0;

function initInter3DPreview() {
    const container = document.getElementById("interpanel-3d-view");
    if (!container) return;

    // اگر رندرر قبلاً ساخته شده، فقط ابعاد را آپدیت کن و خارج شو
    if (interRenderer) {
        interRenderer.setSize(container.clientWidth, container.clientHeight);
        interCamera.aspect = container.clientWidth / container.clientHeight;
        interCamera.updateProjectionMatrix();
        return; 
    }

    // --- ساخت رندرر برای اولین بار ---
    interScene = new THREE.Scene();
    interScene.background = new THREE.Color(0x0f172a);

    // تنظیم دوربین بر اساس ابعاد فعلی کانتینر
    const aspect = container.clientWidth / container.clientHeight || 1.6; // مقدار پیش‌فرض اگر صفر بود
    interCamera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
    interCamera.position.set(150, 150, 250);
    interCamera.lookAt(0, 50, 0);

    interRenderer = new THREE.WebGLRenderer({ antialias: true });
    interRenderer.outputColorSpace = THREE.SRGBColorSpace;
    interRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    interRenderer.toneMappingExposure = 1.0;
    interRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // برای وضوح بیشتر در نمایشگرهای رتینا
    interRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(interRenderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    interScene.add(ambientLight);
    const sunLight = new THREE.PointLight(0xffffff, 0.5);
    sunLight.position.set(100, 200, 100);
    interScene.add(sunLight);

    interGroup = new THREE.Group();
    interScene.add(interGroup);

    setupInterControls(container);
    animateInterPreview();
}


function setupInterControls(container) {
    const startAction = (x) => { 
        interIsDragging = true; 
        interLastX = x; 
        container.style.cursor = 'grabbing'; 
    };

    const moveAction = (x) => {
        if (!interIsDragging) return;
        // مقدار ۰.۰۱ حساسیت چرخش است
        interRotation += (x - interLastX) * 0.01;
        interGroup.rotation.y = interRotation;
        interLastX = x;
    };

    const endAction = () => { 
        interIsDragging = false; 
        container.style.cursor = 'grab'; 
    };

    // --- رویدادهای موس (Desktop) ---
    container.addEventListener("mousedown", e => startAction(e.clientX));
    window.addEventListener("mousemove", e => moveAction(e.clientX));
    window.addEventListener("mouseup", endAction);

    // --- رویدادهای لمسی (Mobile) ---
    container.addEventListener("touchstart", e => {
        // جلوگیری از اسکرول خوردن صفحه وقتی کاربر باکس ۳بعدی را می‌چرخاند
        if (e.cancelable) e.preventDefault(); 
        startAction(e.touches[0].clientX);
    }, { passive: false });

    container.addEventListener("touchmove", e => {
        if (interIsDragging) {
            if (e.cancelable) e.preventDefault();
            moveAction(e.touches[0].clientX);
        }
    }, { passive: false });

    container.addEventListener("touchend", endAction);
}
function buildInterPreviewScene() {
    if (!interGroup) return;
    interGroup.clear();

    const p = window.interPanels[currentInterPanelIndex];
    if (!p) return;

    const roomSize = 180; 
    const wallHeight = 150;

    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });

    // ساخت کف
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomSize, roomSize), 
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    floor.rotation.x = -Math.PI / 2;
    interGroup.add(floor);

    // وضعیت دیوارها
    const hasTop = document.getElementById("wall-top")?.checked;
    const hasLeft = document.getElementById("wall-left")?.checked;
    const hasRight = document.getElementById("wall-right")?.checked;
    const hasBottom = document.getElementById("wall-bottom")?.checked;

    const createWall = (width, height, posX, posY, posZ, rotY, isActive, wallKey) => {
        if (!isActive) return null;
        const group = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMat.clone());
        const line = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat);
        group.add(mesh, line);
        group.position.set(posX, posY, posZ);
        group.rotation.y = rotY;
        if (p.wall === wallKey) mesh.material.opacity = 0.5;
        return group;
    };

    const walls = [
        { w: roomSize, h: wallHeight, x: 0, y: wallHeight/2, z: -roomSize/2, r: 0, active: hasTop, key: 'back' },
        { w: roomSize, h: wallHeight, x: -roomSize/2, y: wallHeight/2, z: 0, r: Math.PI/2, active: hasLeft, key: 'left' },
        { w: roomSize, h: wallHeight, x: roomSize/2, y: wallHeight/2, z: 0, r: -Math.PI/2, active: hasRight, key: 'right' },
        { w: roomSize, h: wallHeight, x: 0, y: wallHeight/2, z: roomSize/2, r: Math.PI, active: hasBottom, key: 'front' }
    ];

    walls.forEach(w => {
        const wallObj = createWall(w.w, w.h, w.x, w.y, w.z, w.r, w.active, w.key);
        if (wallObj) interGroup.add(wallObj);
    });

    const roomRealW = window.room?.w || 400;
    const roomRealD = window.room?.d || 400;
    const ratio = roomSize / roomRealW; 

    // ==========================================
    // 💡 ساخت دیوارهای کاستوم در مینی پیش‌نمایش
    // ==========================================
    let customWallGroups = {}; // برای نگهداری مرجع دیوارهای کاستوم جهت اتصال ورق
    
    if (window.customWalls && window.customWalls.length > 0) {
        // بازسازی نقاط پایه برای مینی پیش‌نمایش (با فرض اینکه مرکز صحنه اصلی 0,0 است یا مپینگ اختصاصی دارید)
        // در صورت نیاز به offset خاص، ptTL تا ptBR را با ضرب در ratio تنظیم کنید.
        const ptTL = { x: -roomSize/2, z: -roomSize/2 };
        const ptTR = { x: roomSize/2,  z: -roomSize/2 };
        const ptBL = { x: -roomSize/2, z: roomSize/2 };
        const ptBR = { x: roomSize/2,  z: roomSize/2 };

        const baseEndpointsMini = {
            top:    { start: ptTL, end: ptTR }, 
            bottom: { start: ptBL, end: ptBR },
            left:   { start: ptTL, end: ptBL },
            right:  { start: ptTR, end: ptBR } 
        };

        window.customWalls.forEach(cWall => {
            let p1;
            // اگر مختصات دستی دارد (تبدیل به مقیاس مینی)
            if (cWall.x !== undefined && cWall.y !== undefined) {
                // فرض بر این است که مرکز 0,0 است
                p1 = { x: cWall.x * ratio, z: cWall.y * ratio };
            } else {
                const target = baseEndpointsMini[cWall.targetWall];
                if (target) {
                    p1 = (cWall.attachment === 'end') ? { x: target.end.x, z: target.end.z } : { x: target.start.x, z: target.start.z };
                } else {
                    p1 = { x: 0, z: 0 }; // fallback
                }
            }

            const cAngRad = cWall.angle * (Math.PI / 180);
            const scaledLen = cWall.len * ratio;
            const scaledThick = (window.Kitchen3D?.config?.wallThickness || 20) * ratio;

            // محاسبه p2 برای زنجیره‌سازی دیوارهای کاستوم به هم
            const p2 = {
                x: p1.x + scaledLen * Math.cos(cAngRad),
                z: p1.z + scaledLen * Math.sin(cAngRad)
            };
            baseEndpointsMini[cWall.id] = { start: p1, end: p2 };

            // ساخت هندسه دیوار کاستوم مینی
            const cwGroup = new THREE.Group();
            cwGroup.position.set(p1.x, wallHeight / 2, p1.z);
            cwGroup.rotation.y = -cAngRad;

            const cMesh = new THREE.Mesh(new THREE.PlaneGeometry(scaledLen, wallHeight), wallMat.clone());
            const cLine = new THREE.LineSegments(new THREE.EdgesGeometry(cMesh.geometry), edgeMat);
            
            if (p.wall === cWall.id) cMesh.material.opacity = 0.5;

            // منطق لولا و شیفت مشابه تابع اصلی
            const pivotGroup = new THREE.Group();
            pivotGroup.position.x = scaledLen / 2; // انتقال پیوت به مرکز طول
            
            let zShift = 0;
            if (cWall.shift === 'right') zShift = scaledThick / 2;
            else if (cWall.shift === 'left') zShift = -scaledThick / 2;
            pivotGroup.position.z = zShift;

            pivotGroup.add(cMesh, cLine);
            cwGroup.add(pivotGroup);
            
            interGroup.add(cwGroup);
            customWallGroups[cWall.id] = { group: cwGroup, pivot: pivotGroup, len: scaledLen, shift: zShift };
        });
    }

    // ==========================================
    // 💡 ورق بین‌کابینتی — متریال با Reflection / Roughness
    // ==========================================
    const isMarble = (p.materialType === 'marbleSheet' || p.materialType === 'marble');
    // ضخامت پیش‌فرض ۲.۵ میل = ۰.۲۵ سانت
    const panelThick = ((p.thickness !== undefined && Number.isFinite(parseFloat(p.thickness)))
        ? parseFloat(p.thickness) : 0.25) * ratio;
    const panelGeo = new THREE.BoxGeometry(p.length * ratio, p.width * ratio, panelThick);

    let panelMap = null;
    if (p.color && (typeof p.color === 'string') &&
        (p.color.startsWith('http') || p.color.includes('assets') || p.color.includes('/') || p.color.includes('.'))) {
        panelMap = new THREE.TextureLoader().load(p.color, (tex) => {
            if (THREE.SRGBColorSpace != null) tex.colorSpace = THREE.SRGBColorSpace;
            // بدون تکرار — طرح روی کل سطح ورق
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.repeat.set(1, 1);
            tex.offset.set(0, 0);
            tex.needsUpdate = true;
        });
    }
    const finishKey = p.finish || (isMarble ? 'satin' : 'matte');
    const preset = (typeof window.getKitchenFinishPreset === 'function')
        ? window.getKitchenFinishPreset(finishKey)
        : { roughness: isMarble ? 0.18 : 0.42, metalness: isMarble ? 0.35 : 0.06, envMapIntensity: isMarble ? 1.2 : 0.55, bumpScale: isMarble ? 0.08 : 0.15, clearcoat: 0 };
    const interFrontParams = {
        color: panelMap ? 0xffffff : (p.color || 0xffffff),
        map: panelMap,
        bumpMap: panelMap || null,
        bumpScale: panelMap ? (preset.bumpScale || (isMarble ? 0.08 : 0.15)) : 0,
        metalness: preset.metalness,
        roughness: preset.roughness,
        envMapIntensity: preset.envMapIntensity != null ? preset.envMapIntensity : (isMarble ? 1.2 : 0.55)
    };
    let interFrontMat;
    if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
        interFrontParams.clearcoat = preset.clearcoat;
        interFrontParams.clearcoatRoughness = preset.clearcoatRoughness || 0.05;
        interFrontMat = new THREE.MeshPhysicalMaterial(interFrontParams);
    } else {
        interFrontMat = new THREE.MeshStandardMaterial(interFrontParams);
    }
    // نام جدا از edgeMat دیوار (LineBasicMaterial بالاتر در همین تابع)
    const interEdgeMat = new THREE.MeshStandardMaterial({
        color: isMarble ? 0xc8c4be : 0xd0cbc3,
        metalness: Math.min(0.25, (preset.metalness || 0.04) + 0.02),
        roughness: Math.min(0.85, (preset.roughness || 0.5) + 0.15)
    });
    const interBackMat = new THREE.MeshStandardMaterial({
        color: 0xe8e4de,
        metalness: 0.02,
        roughness: 0.7
    });
    // [+x,-x,+y,-y,+z front,-z back]
    const panelMat = [interEdgeMat, interEdgeMat, interEdgeMat, interEdgeMat, interFrontMat, interBackMat];

    const panelMesh = new THREE.Mesh(panelGeo, panelMat);
    panelMesh.castShadow = true;
    panelMesh.receiveShadow = true;
    
    const posY = (p.y + (p.width / 2)) * ratio;
    const wallHalfSize = roomSize / 2;
    const panelHalfWidth = (p.length * ratio) / 2;
    const offset = (roomSize / 2) - 1.2;
    
    let isValidPos = false;

    // بررسی آیا دیواری که انتخاب شده یک دیوار کاستوم است؟
    if (customWallGroups[p.wall]) {
        // قرار دادن ورق روی دیوار کاستوم با استفاده از فضای مختصات محلی (Local Space) دیوار
        const cwData = customWallGroups[p.wall];
        
        // محاسبه X محلی روی دیوار کاستوم (همگام با منطق p.x در پنل)
        // در دیوار کاستوم X صفر در سمت چپ (مبدا p1) است، اما pivot در وسط (len/2) قرار دارد
        const localX = (p.x * ratio) - (cwData.len / 2) + panelHalfWidth;
        
        // قرار دادن پنل به عنوان زیرمجموعه پیوت دیوار کاستوم
        panelMesh.position.set(localX, posY - (wallHeight / 2), 1.2); 
        cwData.pivot.add(panelMesh); 
        isValidPos = true;

    } else {
        // دیوارهای اصلی
        const posX = (p.x * ratio) - wallHalfSize + panelHalfWidth;

        if (p.wall === 'back' && hasTop) {
            panelMesh.position.set(posX, posY, -offset);
            isValidPos = true;
        } else if (p.wall === 'left' && hasLeft) {
            panelMesh.rotation.y = Math.PI / 2;
            panelMesh.position.set(-offset, posY, posX);
            isValidPos = true;
        } else if (p.wall === 'right' && hasRight) {
            panelMesh.rotation.y = -Math.PI / 2;
            panelMesh.position.set(offset, posY, posX);
            isValidPos = true;
        } else if (p.wall === 'front' && hasBottom) {
            panelMesh.rotation.y = Math.PI;
            panelMesh.position.set(-posX, posY, offset);
            isValidPos = true;
        }

        if (isValidPos) {
            interGroup.add(panelMesh);
        }
    }

    panelMesh.visible = isValidPos;
}

// ساخت پویای لیست دیوارهای اصلی و کاستوم
function renderInterPanelWallOptions() {
    const container = document.getElementById("interpanel-wall-options");
    if (!container) return;
    container.innerHTML = "";

    let wallsList = [];
    
    // دیوارهای اصلی (اگر تیک آن‌ها در تنظیمات خورده باشد یا به صورت پیش‌فرض)
    if (document.getElementById("wall-top")?.checked !== false) wallsList.push({ id: 'back', name: 'روبرو' });
    if (document.getElementById("wall-left")?.checked !== false) wallsList.push({ id: 'left', name: 'چپ' });
    if (document.getElementById("wall-right")?.checked !== false) wallsList.push({ id: 'right', name: 'راست' });
    if (document.getElementById("wall-bottom")?.checked !== false) wallsList.push({ id: 'front', name: 'جلو' });

    // اضافه کردن دیوارهای کاستوم (تغییر یافته به خواندن از window.customWalls)
    if (window.customWalls && window.customWalls.length > 0) {
        window.customWalls.forEach((cw, index) => {
            wallsList.push({ id: cw.id, name: `کاستوم ${index + 1}` });
        });
    }

    // گرفتن دیواری که در حال حاضر برای این ورق تنظیم شده
    const currentWallId = window.interPanels[currentInterPanelIndex]?.wall || 'back';

    wallsList.forEach(w => {
        const isChecked = currentWallId === w.id ? "checked" : "";
        container.innerHTML += `
            <label class="interpanel-radio-pill">
                <input type="radio" name="inter-wall" id="inter-wall-${w.id}" value="${w.id}" ${isChecked} onchange="syncInterPanelData()">
                <span>${w.name}</span>
            </label>
        `;
    });
}




function animateInterPreview() {
    requestAnimationFrame(animateInterPreview);
    if (interRenderer) interRenderer.render(interScene, interCamera);
}
// ۹. اعمال در نمای ۳بعدی اصلی — از منطق کامل view3d.js استفاده می‌شود
// (دیگر override نمی‌شود تا مختصات و متریال واقعی از بین نرود)
if (!window.Kitchen3D) window.Kitchen3D = {};

// اگر متد اصلی از view3d هنوز ست نشده، یک fallback سبک نگه می‌داریم
if (typeof window.Kitchen3D.refreshInterPanels !== 'function') {
    window.Kitchen3D.refreshInterPanels = function() {
        if (typeof this.addInterPanels === 'function') {
            // پاکسازی
            if (this.scene) {
                const toRemove = [];
                this.scene.traverse((obj) => {
                    if (obj.userData && obj.userData.isInterPanel) toRemove.push(obj);
                });
                toRemove.forEach(obj => {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose && m.dispose());
                        else if (obj.material.dispose) obj.material.dispose();
                    }
                    this.scene.remove(obj);
                });
            }
            this.addInterPanels();
        }
    };
}

