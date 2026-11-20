/**
 * مدیریت پنل تنظیمات کلاف یخچال - نسخه مینی ۳بعدی
 */

let frPreviewScene, frPreviewCamera, frPreviewRenderer, frPreviewGroup;
let frPreviewRotation = 0, frIsDragging = false, frLastX = 0;

let fridgeSideSettings = {
    leftSide: true,
    rightSide: true
};
let currentFridgeColorSide = 'left';
// تعریف متغیرهای سراسری در بالای فایل
let previewLeftWallMesh = null;
let previewRightWallMesh = null;
let previewBridgeMesh = null;
// متغیرهای جدید برای نگهداری قطعات قاب
let previewLeftFrameMesh = null;
let previewRightFrameMesh = null;
let previewBridgeFrameMesh = null;



function findFridgeObject() {
    if (typeof cabinets !== 'undefined' && Array.isArray(cabinets)) {
        return cabinets.find(c => c.isFridgeWrap === true);
    }
    return null;
}

// ۱. اصلاح تابع باز کردن پنل
function openFridgeWrapEditorPanel() {
    const panel = document.getElementById("fridge-wrap-editor-panel");
    if (!panel) return;

    const fridge = findFridgeObject();
    const isExists = !!fridge;

    panel.classList.add("active");

    const enabledCheck = document.getElementById("fridge-wrap-enabled");
    if (enabledCheck) enabledCheck.checked = isExists;

    if (isExists) {
        // مقداردهی دیواره چپ
        if (document.getElementById("fridge-side-left-h"))
            document.getElementById("fridge-side-left-h").value = fridge.leftH || fridge.h;

        if (document.getElementById("fridge-side-left-d"))
            document.getElementById("fridge-side-left-d").value = fridge.leftD || fridge.d;

        // مقداردهی دیواره راست
        if (document.getElementById("fridge-side-right-h"))
            document.getElementById("fridge-side-right-h").value = fridge.rightH || fridge.h;
        if (document.getElementById("fridge-side-right-d"))
            document.getElementById("fridge-side-right-d").value = fridge.rightD || fridge.d;
            
                  // مقداردهی یونیت هوایی (اصلاح شد: کسر دو ضخامت دیواره برای نمایش دهانه واقعی)
        if (document.getElementById("fridge-bridge-w")) {
            // دهانه داخلی = عرض کل منهای ۳.۲ (دو تا دیواره ۱.۶)
            const innerBridgeW = fridge.w - 3.2; 
            fridge.bridgeW = innerBridgeW;
            document.getElementById("fridge-bridge-w").value = innerBridgeW;
        }


        if (document.getElementById("fridge-bridge-h")) document.getElementById("fridge-bridge-h").value = fridge.bridgeH || 40;
        if (document.getElementById("fridge-bridge-d")) document.getElementById("fridge-bridge-d").value = fridge.bridgeD || 60;

        if (document.getElementById("fridge-bridge-y")) {
            const bridgeY = fridge.bridgeY ?? (fridge.h - (fridge.bridgeH || 40));
            document.getElementById("fridge-bridge-y").value = bridgeY;
        }

        // 👇 کدهای جدید: لود کردن تنظیمات قاب هنگام باز شدن پنل 👇
        if(document.getElementById("fridge-frame-enabled")) {
            document.getElementById("fridge-frame-enabled").checked = fridge.frameEnabled ?? false;
        }
        if(document.getElementById("fridge-frame-protrusion")) {
            document.getElementById("fridge-frame-protrusion").value = fridge.frameProtrusion || 5;
        }
        if(document.getElementById("fridge-frame-depth")) {
            document.getElementById("fridge-frame-depth").value = fridge.frameDepth || 1.6;
        }
        // 👆 پایان کدهای جدید قاب 👆

        // کدهای مربوط به لود کردن رنگ‌ها هنگام باز شدن پنل
        if (document.getElementById("fridge-left-color-search")) {
            const leftInp = document.getElementById("fridge-left-color-search");
            leftInp.value = fridge.leftColorName || '';
            if (fridge.leftMaterialValue) leftInp.dataset.material = fridge.leftMaterialValue;
        }
        if (document.getElementById("fridge-right-color-search")) {
            const rightInp = document.getElementById("fridge-right-color-search");
            rightInp.value = fridge.rightColorName || '';
            if (fridge.rightMaterialValue) rightInp.dataset.material = fridge.rightMaterialValue;
        }
        if (document.getElementById("fridge-frame-color-search")) {
            const frameInp = document.getElementById("fridge-frame-color-search");
            frameInp.value = fridge.frameColorName || '';
            if (fridge.frameMaterialValue) frameInp.dataset.material = fridge.frameMaterialValue;
        }
        if (document.getElementById("fridge-left-material-type"))
            document.getElementById("fridge-left-material-type").value = fridge.leftMaterialType || 'mdf';
        if (document.getElementById("fridge-right-material-type"))
            document.getElementById("fridge-right-material-type").value = fridge.rightMaterialType || 'mdf';
        if (document.getElementById("fridge-frame-material-type"))
            document.getElementById("fridge-frame-material-type").value = fridge.frameMaterialType || 'mdf';

        // پرداخت سطح (نور) — جدا از جنس ورق
        if (document.getElementById("fridge-left-finish"))
            document.getElementById("fridge-left-finish").value = fridge.leftFinish || 'matte';
        if (document.getElementById("fridge-right-finish"))
            document.getElementById("fridge-right-finish").value = fridge.rightFinish || 'matte';
        if (document.getElementById("fridge-frame-finish"))
            document.getElementById("fridge-frame-finish").value = fridge.frameFinish || 'matte';
    }

    // تیک زدن چک‌باکس‌ها
    document.getElementById("fridge-side-left-enabled").checked = fridge?.hasLeft ?? fridgeSideSettings.leftSide;
    document.getElementById("fridge-side-right-enabled").checked = fridge?.hasRight ?? fridgeSideSettings.rightSide;

    initFridge3DPreview();
    buildFridge3DModel();
    attachLiveUpdateListeners();
}

// ۲. موتور ۳بعدی (مشابه کد تاج که فرستادید)
function initFridge3DPreview() {
    const container = document.getElementById("fridge-preview-3d");
    if (!container) return;

    // اگر قبلاً رندر ساخته شده، فقط سایزش رو آپدیت کن
    if (frPreviewRenderer) {
        frPreviewRenderer.setSize(container.clientWidth, container.clientHeight);
        return;
    }

    frPreviewScene = new THREE.Scene();
    frPreviewScene.background = new THREE.Color(0x111827);
    
    // دوربین رو یخورده عقب‌تر می‌بریم که کل کلاف جا بشه
    frPreviewCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 2000);
    frPreviewCamera.position.set(0, 120, 500); // عدد ۵۰۰ کمک می‌کنه کلاف کامل دیده بشه

    frPreviewRenderer = new THREE.WebGLRenderer({ antialias: true });
    frPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;
    frPreviewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    frPreviewRenderer.toneMappingExposure = 1.0;
    frPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    frPreviewRenderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(frPreviewRenderer.domElement);

    // اضافه کردن نور از چند جهت برای وضوح بیشتر
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    frPreviewScene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
    sunLight.position.set(100, 200, 100);
    frPreviewScene.add(sunLight);

    frPreviewGroup = new THREE.Group();
    frPreviewScene.add(frPreviewGroup);

    setupFridgePreviewControls(container);
    animateFridgePreview();
}


function setupFridgePreviewControls(container) {
    const startAction = (x) => { frIsDragging = true; frLastX = x; };
    const moveAction = (x) => {
        if (!frIsDragging) return;
        frPreviewRotation += (x - frLastX) * 0.01;
        frPreviewGroup.rotation.y = frPreviewRotation;
        frLastX = x;
    };
    container.addEventListener("mousedown", e => startAction(e.clientX));
    window.addEventListener("mousemove", e => moveAction(e.clientX));
    window.addEventListener("mouseup", () => frIsDragging = false);
    
    container.addEventListener("touchstart", e => startAction(e.touches[0].clientX));
    container.addEventListener("touchmove", e => moveAction(e.touches[0].clientX));
    container.addEventListener("touchend", () => frIsDragging = false);
}

// ۳. ساخت مدل کلاف (U-Shape)
function buildFridge3DModel() {
    if (!frPreviewGroup) return;
    frPreviewGroup.clear();

    const leftH = parseFloat(document.getElementById("fridge-side-left-h").value) || 240;
    const leftD = parseFloat(document.getElementById("fridge-side-left-d").value) || 60;
    const rightH = parseFloat(document.getElementById("fridge-side-right-h").value) || 240;
    const rightD = parseFloat(document.getElementById("fridge-side-right-d").value) || 60;

    const hasBridge = document.getElementById("fridge-bridge-enabled").checked;
    const hasLeft = document.getElementById("fridge-side-left-enabled").checked;
    const hasRight = document.getElementById("fridge-side-right-enabled").checked;

    const bridgeW = parseFloat(document.getElementById("fridge-bridge-w").value) || 95;
    const bridgeH = parseFloat(document.getElementById("fridge-bridge-h").value) || 40;
    const bridgeD = parseFloat(document.getElementById("fridge-bridge-d").value) || 60;
    const bridgeY = parseFloat(document.getElementById("fridge-bridge-y").value) || 200;

    const frameWallHeightLeft = hasBridge ? bridgeY : leftH;
    const frameWallHeightRight = hasBridge ? bridgeY : rightH;

    const wallThick = 3.2;

    const frameEnabled = document.getElementById("fridge-frame-enabled")?.checked ?? false;
    const frameProtrusion = parseFloat(document.getElementById("fridge-frame-protrusion")?.value) || 5;
    const frameDepth = parseFloat(document.getElementById("fridge-frame-depth")?.value) || 1.6;
    
    // 🌟 اعمال ۵ سانت هم‌پوشانی روی بدنه (که در کد شما جا افتاده بود)
    const frameOverlap = 5;
    const totalFrameZ = frameProtrusion + frameOverlap;

    // 🌟🌟🌟 تغییر جدید و اصلی: خواندن رنگ قاب به صورت داینامیک 🌟🌟🌟
    let finalFrameMaterial;
    const frameColorInput = document.getElementById('fridge-frame-color-search');
    const frameMatValue = frameColorInput ? frameColorInput.dataset.material : null;

    if (frameMatValue) {
        if (frameMatValue.includes('/') || frameMatValue.includes('.') || frameMatValue.includes('http')) {
            // اگر متریال عکس (تکسچر) بود
            const texLoader = new THREE.TextureLoader();
            const texture = texLoader.load(frameMatValue);
            if (THREE.SRGBColorSpace != null) texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            finalFrameMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
        } else {
            // اگر کد رنگ بود
            finalFrameMaterial = new THREE.MeshStandardMaterial({ color: frameMatValue, roughness: 0.8 });
        }
    } else {
        // رنگ پیش‌فرض در صورت انتخاب نشدن رنگ
        finalFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 }); 
    }
    // 🌟🌟🌟 پایان بخش ساخت متریال داینامیک 🌟🌟🌟

    previewLeftFrameMesh = null;
    previewRightFrameMesh = null;
    previewBridgeFrameMesh = null;

    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });

    // رسم دیواره چپ 
    if (hasLeft) {
        previewLeftWallMesh = new THREE.Mesh(new THREE.BoxGeometry(wallThick, leftH, leftD), baseMaterial);
        previewLeftWallMesh.position.set(-(bridgeW / 2) - (wallThick / 2), leftH / 2, 0); 
        frPreviewGroup.add(previewLeftWallMesh);

        // اضافه کردن قاب به دیواره چپ
        if (frameEnabled) {
            // استفاده از finalFrameMaterial و totalFrameZ
            previewLeftFrameMesh = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, frameWallHeightLeft, totalFrameZ), finalFrameMaterial);
            const frameYPosL = (-leftH / 2) + (frameWallHeightLeft / 2);
            // محاسبه z با احتساب هم‌پوشانی
            const frameZPosL = leftD / 2 + (frameProtrusion - frameOverlap) / 2;
            
            previewLeftFrameMesh.position.set(wallThick / 2 + frameDepth / 2, frameYPosL, frameZPosL);
            previewLeftWallMesh.add(previewLeftFrameMesh);
        }
    } else {
        previewLeftWallMesh = null;
    }

    // رسم دیواره راست
    if (hasRight) {
        previewRightWallMesh = new THREE.Mesh(new THREE.BoxGeometry(wallThick, rightH, rightD), baseMaterial);
        previewRightWallMesh.position.set((bridgeW / 2) + (wallThick / 2), rightH / 2, 0); 
        frPreviewGroup.add(previewRightWallMesh);

        // اضافه کردن قاب به دیواره راست
        if (frameEnabled) {
            // استفاده از finalFrameMaterial و totalFrameZ
            previewRightFrameMesh = new THREE.Mesh(new THREE.BoxGeometry(frameDepth, frameWallHeightRight, totalFrameZ), finalFrameMaterial);
            const frameYPosR = (-rightH / 2) + (frameWallHeightRight / 2);
            // محاسبه z با احتساب هم‌پوشانی
            const frameZPosR = rightD / 2 + (frameProtrusion - frameOverlap) / 2;

            previewRightFrameMesh.position.set(-wallThick / 2 - frameDepth / 2, frameYPosR, frameZPosR);
            previewRightWallMesh.add(previewRightFrameMesh);
        }
    } else {
        previewRightWallMesh = null;
    }

    // رسم یونیت هوایی
    // رسم یونیت هوایی
    if (hasBridge) {
        // دریافت عمق بدنه اصلی برای محاسبه اختلاف با عمق پل هوایی
        const fridgeD = parseFloat(document.getElementById("fridge-d").value) || 60;
        
        previewBridgeMesh = new THREE.Mesh(new THREE.BoxGeometry(bridgeW, bridgeH, bridgeD), baseMaterial);
        
        // شیفت Z به سمت جلو (مثبت) برای اینکه نمای جلو ثابت بماند
        const previewZShift = (fridgeD - bridgeD) / 2;
        previewBridgeMesh.position.set(0, bridgeY + (bridgeH / 2), previewZShift);
        
        frPreviewGroup.add(previewBridgeMesh);


        // اضافه کردن قاب به زیر یونیت هوایی
        if (frameEnabled) {
            // در قاب بالایی عرض آن برابر عرض پل است، ضخامت قاب Y و عمق آن Z است
            previewBridgeFrameMesh = new THREE.Mesh(new THREE.BoxGeometry(bridgeW, frameDepth, totalFrameZ), finalFrameMaterial);
            const frameZPosB = bridgeD / 2 + (frameProtrusion - frameOverlap) / 2;
            previewBridgeFrameMesh.position.set(0, -bridgeH / 2 - frameDepth / 2, frameZPosB);
            previewBridgeMesh.add(previewBridgeFrameMesh);
        }
    } else {
        previewBridgeMesh = null;
    }

    // مرکزیت بخشیدن 
    const bridgeTotalH = hasBridge ? (bridgeY + bridgeH) : 0;
    const maxHeight = Math.max(leftH, rightH, bridgeTotalH);
    frPreviewGroup.position.y = -(maxHeight / 2);
    
    // اعمال رنگ بقیه بخش‌ها
    if (typeof applyCurrentColorsToPreview === 'function') {
        applyCurrentColorsToPreview();
    }
}




function animateFridgePreview() {
    requestAnimationFrame(animateFridgePreview);
    if (frPreviewRenderer) frPreviewRenderer.render(frPreviewScene, frPreviewCamera);
}

// ==========================================
// 👇 کدهای مدیریت مودال رنگ کلاف یخچال 👇
// ==========================================


// بستن مودال در صورت کلیک روی فضای خالی بیرون آن
window.addEventListener('click', function(event) {
    const modal = document.getElementById('fridge-wrap-material-modal');
    if (event.target === modal) {
        closeFridgeWrapMaterialModal();
    }
});


// تعریف متغیر به صورت گلوبال (برای جلوگیری از ارور ReferenceError)

// تابع باز کردن مودال هوشمند سراسری برای یخچال
function openFridgeMaterialModal(side) {
    try {
        // مقدار side می‌تواند 'left', 'right' یا 'frame' باشد
        currentFridgeColorSide = side; 

        // ۱. تعیین عنوان مناسب برای هدر مودال
        let modalTitle = '🎨 انتخاب طرح و رنگ';
        if (side === 'left') modalTitle = '🎨 انتخاب طرح و رنگ دیواره سمت چپ یخچال';
        else if (side === 'right') modalTitle = '🎨 انتخاب طرح و رنگ دیواره سمت راست یخچال';
        else if (side === 'frame') modalTitle = '🎨 انتخاب طرح و رنگ قاب (پاسار) یخچال'; 

        // ۲. خواندن نوع ورق (دسته‌بندی) از سلکت‌باکسِ همان بخش در پنل
        let selectBoxId = '';
        if (side === 'left') selectBoxId = 'fridge-left-material-type';
        else if (side === 'right') selectBoxId = 'fridge-right-material-type';
        else if (side === 'frame') selectBoxId = 'fridge-frame-material-type';

        const selectBox = document.getElementById(selectBoxId);
        const category = selectBox ? selectBox.value : 'mdf';

        // ۳. باز کردن مودال سراسری و دریافت متریال انتخاب شده در کالبک (Callback)
        if (typeof window.openUniversalModal === 'function') {
            window.openUniversalModal(modalTitle, category, function(material) {
                // پس از انتخاب متریال در مودال، این تابع اجرا می‌شود:
                selectFridgeWrapColor(material.name, material.code, material.texture);
            });
        } else {
            console.error("تابع سراسری openUniversalModal یافت نشد! مطمئن شوید materialModal.js قبل از این فایل لود شده است.");
        }

    } catch (error) {
        console.error("خطا در باز کردن مودال یخچال:", error);
    }
}

// تابع انتخاب رنگ نهایی و اعمال به اینپوت‌های پنل

window.onFridgeWrapFinishChange = function(side, value) {
    const fridge = typeof findFridgeObject === 'function' ? findFridgeObject() : null;
    if (!fridge) return;
    const v = value || 'matte';
    if (side === 'left') fridge.leftFinish = v;
    else if (side === 'right') fridge.rightFinish = v;
    else if (side === 'frame') fridge.frameFinish = v;
    if (typeof updateFridgeWrapLive === 'function') updateFridgeWrapLive();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets &&
        document.getElementById('modal-3d-container')?.style.display === 'flex') {
        Kitchen3D.refreshCabinets();
    }
};

function selectFridgeWrapColor(colorName, colorCode, textureUrl) {
    const fridge = typeof findFridgeObject === 'function' ? findFridgeObject() : null;
    
    // متریال نهایی (اولویت با عکس تکسچر است، اگر نبود کد رنگ سالید)
    const finalMaterialValue = textureUrl ? textureUrl : colorCode;

    if (currentFridgeColorSide === 'left') {
        const leftSearchInput = document.getElementById('fridge-left-color-search');
        if (leftSearchInput) {
            leftSearchInput.value = colorName;
            leftSearchInput.dataset.material = finalMaterialValue; 
        }
        if (fridge) {
            fridge.leftColorName = colorName;
            fridge.leftColorTexture = finalMaterialValue;
        }
    } else if (currentFridgeColorSide === 'right') {
        const rightSearchInput = document.getElementById('fridge-right-color-search');
        if (rightSearchInput) {
            rightSearchInput.value = colorName;
            rightSearchInput.dataset.material = finalMaterialValue; 
        }
        if (fridge) {
            fridge.rightColorName = colorName;
            fridge.rightColorTexture = finalMaterialValue;
        }
    } else if (currentFridgeColorSide === 'frame') { 
        const frameSearchInput = document.getElementById('fridge-frame-color-search');
        if (frameSearchInput) {
            frameSearchInput.value = colorName;
            frameSearchInput.dataset.material = finalMaterialValue; 
        }
        if (fridge) {
            fridge.frameColorName = colorName;
            fridge.frameColorTexture = finalMaterialValue;
        }
    }
    
    // 🔴 اصلاح شد: بستن مودال سراسری هوشمند جدید
    if (typeof window.closeUniversalModal === 'function') {
        window.closeUniversalModal();
    }
    
    // فراخوانی آپدیت زنده پیش‌نمایش
    if (typeof updateFridgeWrapLive === 'function') {
        updateFridgeWrapLive(); 
    }
}



// تابع کمکی برای تبدیل لینک عکس/کد رنگ به متریالِ Three.js
function applyMaterialToMesh(mesh, materialValue) {
    if (!mesh) return;

    // اگر متریال یک آدرس عکس بود (تکسچر)
    if (materialValue && (materialValue.includes('.jpg') || materialValue.includes('.png') || materialValue.includes('/'))) {
        new THREE.TextureLoader().load(materialValue, (texture) => {
            if (THREE.SRGBColorSpace != null) texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            
            // ساخت متریال با عکس چوب/هایگلاس
            mesh.material = new THREE.MeshStandardMaterial({ 
                map: texture,
                roughness: 0.6, // میزان ماتی
                metalness: 0.1  // میزان بازتاب
            });
            mesh.material.needsUpdate = true;
        });
    } 
    // اگر متریال یک کد رنگ ساده بود (مثل #ffffff)
    else if (materialValue) {
        mesh.material = new THREE.MeshStandardMaterial({ 
            color: materialValue,
            roughness: 0.6,
            metalness: 0.1
        });
        mesh.material.needsUpdate = true;
    }
}


// تابع هندل کردن تغییرات سلکت باکس (مستقیماً در پنل)
function updateFridgeWrapMaterials(side) {
    // اگر خواستید وقتی کاربر نوع ورق را عوض کرد، همان لحظه رنگ پیش‌فرض هم عوض شود
    // می‌توانید منطق آن را اینجا اضافه کنید. فعلاً خالی می‌گذاریم چون با کلیک روی اینپوت، مودال درست باز می‌شود.
    console.log(`Material type changed for ${side} side`);
}


function updateFridgeWrapLive() {
    const fridge = typeof findFridgeObject === 'function' ? findFridgeObject() : null;
    if (!fridge) return;

    // یک تابع کمکی ایمن‌تر برای خواندن مقادیر
    const getVal = (id) => {
        const el = document.getElementById(id);
        return (el && el.value !== "") ? parseFloat(el.value) : null;
    };
    // 1️⃣ آپدیت ابعاد (اصلاح شد)
    const newTotalH = getVal("fridge-total-h");
    if (newTotalH !== null && newTotalH > 0) fridge.h = newTotalH;

    let panelLeftH = getVal("fridge-side-left-h");
    let panelRightH = getVal("fridge-side-right-h");

    fridge.leftH = panelLeftH !== null ? panelLeftH : fridge.h;
    fridge.rightH = panelRightH !== null ? panelRightH : fridge.h;

    fridge.leftD = getVal("fridge-side-left-d") || fridge.d;
    fridge.rightD = getVal("fridge-side-right-d") || fridge.d;

    // خواندن دهانه داخلی از پنل
    const innerW = getVal("fridge-bridge-w");
    if (innerW !== null && innerW > 0) {
        fridge.bridgeW = innerW;            // عرض خود باکس هوایی همان دهانه داخلی است
        fridge.w = innerW + 3.2;            // عرض کل کلاف کمد می‌شود: دهانه + دو تا دیواره ۱.۶
    }

    fridge.bridgeH = getVal("fridge-bridge-h") || 40;
    fridge.bridgeD = getVal("fridge-bridge-d") || fridge.d;

    const userBridgeY = getVal("fridge-bridge-y");
    if (userBridgeY !== null) {
        fridge.bridgeY = userBridgeY;
    } else {
        fridge.bridgeY = fridge.h - fridge.bridgeH;
    }


    // 2️⃣ تیک‌های فعال/غیرفعال
    fridge.hasLeft = document.getElementById("fridge-side-left-enabled")?.checked ?? true;
    fridge.hasRight = document.getElementById("fridge-side-right-enabled")?.checked ?? true;
    fridge.hasBridge = document.getElementById("fridge-bridge-enabled")?.checked ?? true;

    // ذخیره تنظیمات قاب 
    fridge.frameEnabled = document.getElementById("fridge-frame-enabled")?.checked ?? false;
    fridge.frameProtrusion = getVal("fridge-frame-protrusion") || 5;
    fridge.frameDepth = getVal("fridge-frame-depth") || 1.6;

    // 3️⃣ ذخیره نوع متریال (جنس ورق)
    const leftMatType = document.getElementById("fridge-left-material-type");
    if (leftMatType) fridge.leftMaterialType = leftMatType.value;

    const rightMatType = document.getElementById("fridge-right-material-type");
    if (rightMatType) fridge.rightMaterialType = rightMatType.value;

    const frameMatType = document.getElementById("fridge-frame-material-type");
    if (frameMatType) fridge.frameMaterialType = frameMatType.value;

    // 3️⃣ب پرداخت سطح (نور) — جدا از جنس ورق
    const leftFinishEl = document.getElementById("fridge-left-finish");
    if (leftFinishEl) fridge.leftFinish = leftFinishEl.value || 'matte';
    const rightFinishEl = document.getElementById("fridge-right-finish");
    if (rightFinishEl) fridge.rightFinish = rightFinishEl.value || 'matte';
    const frameFinishEl = document.getElementById("fridge-frame-finish");
    if (frameFinishEl) fridge.frameFinish = frameFinishEl.value || 'matte';

    // 🔴 4️⃣ ارسال مقدار رنگ/تکسچر به آبجکت اصلی آشپزخانه 🔴
    const leftInput = document.getElementById('fridge-left-color-search');
    const rightInput = document.getElementById('fridge-right-color-search');
    const bridgeInput = document.getElementById('fridge-bridge-color-search');
    const frameInput = document.getElementById('fridge-frame-color-search'); // 🌟 اضافه شدن اینپوت قاب

    if (leftInput && leftInput.dataset.material) {
        fridge.leftMaterialValue = leftInput.dataset.material;
    }
    if (rightInput && rightInput.dataset.material) {
        fridge.rightMaterialValue = rightInput.dataset.material;
    }
    if (bridgeInput && bridgeInput.dataset.material) {
        fridge.bridgeMaterialValue = bridgeInput.dataset.material;
    }
    // 🌟 ذخیره رنگ قاب در آبجکت
    if (frameInput && frameInput.dataset.material) {
        fridge.frameMaterialValue = frameInput.dataset.material;
    }

    // 5️⃣ آپدیت موتورهای ۳ بعدی بیرونی (آشپزخانه اصلی)
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets) {
        Kitchen3D.refreshCabinets();
    }

    // 6️⃣ آپدیت پیش‌نمایش داخل مودال
    // چون در این تابع از نو مدل رندر می‌شود، رنگ جدید در تابع بالا خوانده و اعمال می‌شود
    buildFridge3DModel();
}



// تابع جدید برای اعمال رنگ‌های فعلی روی پیش‌نمایش
function applyCurrentColorsToPreview() {
    // ۱. خواندن مقادیر از اینپوت‌ها
    const leftInput = document.getElementById('fridge-left-color-search');
    const rightInput = document.getElementById('fridge-right-color-search');
    // اگر برای پل (یونیت هوایی) اینپوت انتخاب رنگ جداگانه دارید، آیدی آن را اینجا بگذارید. 
    // در غیر این صورت روی یک رنگ دیفالت می‌ماند.
    const bridgeInput = document.getElementById('fridge-bridge-color-search'); 

    // ۲. استخراج مقادیر (اگر انتخاب نشده بودند، رنگ دیفالت بگیرند)
    const leftMaterialValue = (leftInput && leftInput.dataset.material) ? leftInput.dataset.material : "#334155";
    const rightMaterialValue = (rightInput && rightInput.dataset.material) ? rightInput.dataset.material : "#334155";
    
    // رنگ پل مستقلا خوانده می‌شود. اگر اینپوت ندارد، یک رنگ دیفالت (مثلا #475569) به آن می‌دهیم تا با دیواره چپ تغییر نکند
    const bridgeMaterialValue = (bridgeInput && bridgeInput.dataset.material) ? bridgeInput.dataset.material : "#475569";

    // ۳. اعمال روی مش‌های سراسری
    if (previewLeftWallMesh) {
        applyMaterialToMesh(previewLeftWallMesh, leftMaterialValue);
    }
    if (previewRightWallMesh) {
        applyMaterialToMesh(previewRightWallMesh, rightMaterialValue);
    }
    if (previewBridgeMesh) {
        applyMaterialToMesh(previewBridgeMesh, bridgeMaterialValue); 
    }
}

function syncFridgeWrapPanel() {
    const c = findFridgeObject(); 
    if (!c) return;

    // خواندن مقدار ارتفاع اصلی از کابینت که از طریق پنل اصلی تغییر کرده است
    const mainCabinetH = c.h; 
    
    const leftHInput = document.getElementById("fridge-side-left-h");
    const rightHInput = document.getElementById("fridge-side-right-h");
    const bridgeYInput = document.getElementById("fridge-bridge-y");

    // ۱. آپدیت مقادیر نمایشی (اینپوت‌های HTML)
    if (leftHInput) leftHInput.value = mainCabinetH; 
    if (rightHInput) rightHInput.value = mainCabinetH;
    
    const bridgeHValue = c.bridgeH || 40; 
    const bridgeHeightValue = mainCabinetH - bridgeHValue; 
    
    if (bridgeYInput) bridgeYInput.value = bridgeHeightValue;

    // ۲. ⭐ بخش بسیار مهم (حل مشکل سینک نشدن) ⭐
    // باید مقادیر سفارشی دیواره‌ها و پل را در خود آبجکت هم ریست کنیم 
    // تا موتور ۳ بعدی تغییر ارتفاع اصلی را تشخیص دهد
    c.leftH = mainCabinetH;
    c.rightH = mainCabinetH;
    c.bridgeY = bridgeHeightValue;
}



function attachLiveUpdateListeners() {
    const ids = [
        "fridge-side-left-h", "fridge-side-left-d",
        "fridge-side-right-h", "fridge-side-right-d",
        "fridge-bridge-w", "fridge-bridge-h", "fridge-bridge-d", "fridge-bridge-y",
        "fridge-side-left-enabled", "fridge-side-right-enabled",
        "fridge-bridge-enabled",
        // 👇 کدهای جدید: اضافه شدن شناسه‌های قاب به لیست آپدیت زنده 👇
        "fridge-frame-enabled", "fridge-frame-protrusion", "fridge-frame-depth"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.removeEventListener("input", updateFridgeWrapLive);
            el.addEventListener("input", updateFridgeWrapLive);
            el.removeEventListener("change", updateFridgeWrapLive);
            el.addEventListener("change", updateFridgeWrapLive);
        }
    });
}




function applyFridgeWrapSettings() {
    const fridge = typeof findFridgeObject === 'function' ? findFridgeObject() : null;

    if (fridge) {
        // ۱. خواندن و ذخیره وضعیت فعال بودن قاب
        const frameEnabledInput = document.getElementById('fridge-frame-enabled');
        if (frameEnabledInput) {
            fridge.frameEnabled = frameEnabledInput.checked;
        }

        // ۲. خواندن و ذخیره میزان جلوآمدگی قاب
        const frameProtrusionInput = document.getElementById('fridge-frame-protrusion');
        if (frameProtrusionInput) {
            fridge.frameProtrusion = parseFloat(frameProtrusionInput.value) || 0;
        }

        // ۳. خواندن و ذخیره ضخامت (عمق) قاب
        const frameDepthInput = document.getElementById('fridge-frame-depth');
        if (frameDepthInput) {
            fridge.frameDepth = parseFloat(frameDepthInput.value) || 1.6;
        }

        // نکته: رنگ‌ها (چپ، راست، قاب) قبلاً در زمان انتخاب از مُدال ذخیره شده‌اند.
        // پرداخت سطح را هم از سلکت‌ها بخوان
        const lf = document.getElementById('fridge-left-finish');
        const rf = document.getElementById('fridge-right-finish');
        const ff = document.getElementById('fridge-frame-finish');
        if (lf) fridge.leftFinish = lf.value || 'matte';
        if (rf) fridge.rightFinish = rf.value || 'matte';
        if (ff) fridge.frameFinish = ff.value || 'matte';
        const fmt = document.getElementById('fridge-frame-material-type');
        if (fmt) fridge.frameMaterialType = fmt.value;

        // 🌟 ۴. فراخوانی تابع رندر مجدد صحنه اصلی 
        // مهم: در اینجا باید تابعی که کابینت‌ها/یخچال را در موتور اصلی از نو می‌سازد صدا بزنید.
        // نام این تابع در پروژه شما ممکن است یکی از موارد زیر باشد، اگر نامش متفاوت است آن را اصلاح کنید:
        if (typeof rebuildScene === 'function') {
            rebuildScene();
        } else if (typeof updateCabinet3D === 'function') {
            updateCabinet3D(fridge);
        }
    }

    // ۵. در نهایت بستن پنل
    closeFridgeWrapEditorPanel();
}


function closeFridgeWrapEditorPanel() {
    const panel = document.getElementById("fridge-wrap-editor-panel");
    if (panel) panel.classList.remove("active");
}

