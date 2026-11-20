
function refreshBabylonFacade(cabId) {
    try {
        if (window.KitchenBabylon && window.KitchenBabylon.isReady) {
            if (typeof window.KitchenBabylon.refreshCabinets === 'function') {
                window.KitchenBabylon.refreshCabinets(cabId);
            }
        }
    } catch (e) {}
}
// ==========================================
// متغیرهای سراسری برای پیش‌نمایش نمای کابینت
// ==========================================
let faScene, faCamera, faRenderer;
let faPreviewGroup; 
let faReqId; 
let currentCabinetForFacade = null;
// مشخص می‌کند کاربر در حال تغییر رنگ کدام بخش از نما است ('16mm' یا 'thermo')
let currentFacadeCategory = 'mdf';


// متغیرهای مش پیش‌نمایش نما (احتمالاً اینها را خودتان تعریف کرده‌اید)
let preview16mmMesh = null;
let previewThermoMesh = null;
let currentFacadeColorPart = null;


// ==========================================
// 1. توابع باز و بسته کردن پنل
// ==========================================
function openFacadeEditorPanel() {
    if (typeof selectedId === 'undefined' || selectedId === null) {
        alert("لطفاً ابتدا یک کابینت را انتخاب کنید.");
        return;
    }

    const cabinet = cabinets.find(c => c.id === selectedId);
    if (!cabinet) return;

    currentCabinetForFacade = { ...cabinet };

    const idDisplay = document.getElementById('facade-panel-cabinet-id');
    if (idDisplay) idDisplay.textContent = cabinet.id;

    loadExistingFacadeConfig(cabinet);

    const panel = document.getElementById('facade-editor-panel');
    if (panel) {
        // فقط کلاس اضافه شود، بقیه کارها را CSS با انیمیشن انجام میدهد
        panel.classList.add('active'); 
    }

    const c = cabinet;

    const input16 = document.getElementById("facade-16mm-color-search");
    if (input16) {
        input16.value = c.facade16mmColorName || '';
        delete input16.dataset.material;
        delete input16.dataset.texture;
        delete input16.dataset.code;
        
        let val16 = c.facade16mmMaterialValue || '';
        if (val16.includes('/') || val16.includes('.')) input16.dataset.texture = val16;
        else input16.dataset.code = val16;
    }

    const inputThermo = document.getElementById("facade-thermo-color-search");
    if (inputThermo) {
        inputThermo.value = c.facadeThermoColorName || '';
        delete inputThermo.dataset.material;
        delete inputThermo.dataset.texture;
        delete inputThermo.dataset.code;

        let valThermo = c.facadeThermoMaterialValue || '';
        if (valThermo.includes('/') || valThermo.includes('.')) inputThermo.dataset.texture = valThermo;
        else inputThermo.dataset.code = valThermo;
    }

    // اضافه شده برای نما صفحه
    const inputWorktop = document.getElementById("facade-worktop-color-search");
    if (inputWorktop) {
        inputWorktop.value = c.facadeWorktopColorName || '';
        delete inputWorktop.dataset.material;
        delete inputWorktop.dataset.texture;
        delete inputWorktop.dataset.code;

        let valWorktop = c.facadeWorktopMaterialValue || '';
        if (valWorktop.includes('/') || valWorktop.includes('.')) inputWorktop.dataset.texture = valWorktop;
        else inputWorktop.dataset.code = valWorktop;
    }

        // مقادیر پیش‌فرض انواع متریال‌ها در صورت نبود تنظیمات قبلی
    if (document.getElementById("facade-16mm-material-type"))
        document.getElementById("facade-16mm-material-type").value = c.facade16mmMaterialType || 'mdf';

    if (document.getElementById("facade-thermo-material-type"))
        document.getElementById("facade-thermo-material-type").value = c.facadeThermoMaterialType || 'mdf';

    // 🟢 اصلاح شد: مقدار پیش‌فرض به countertop تغییر یافت
    if (document.getElementById("facade-worktop-material-type"))
        document.getElementById("facade-worktop-material-type").value = c.facadeWorktopMaterialType || 'countertop';

    // پرداخت سطح (جدا از جنس ورق)
    if (document.getElementById("facade-16mm-finish"))
        document.getElementById("facade-16mm-finish").value = c.facade16mmFinish || 'matte';
    if (document.getElementById("facade-thermo-finish"))
        document.getElementById("facade-thermo-finish").value = c.facadeThermoFinish || 'matte';
    if (document.getElementById("facade-worktop-finish"))
        document.getElementById("facade-worktop-finish").value = c.facadeWorktopFinish || 'matte';

    initFacade3DPreview();
    updateFacadePreview();
}

window.onFacadeFinishChange = function(part, value) {
    if (typeof selectedId === 'undefined' || selectedId === null) return;
    const cabinet = cabinets.find(c => c.id === selectedId);
    if (!cabinet) return;
    const v = value || 'matte';
    if (part === '16mm') cabinet.facade16mmFinish = v;
    else if (part === 'thermo') cabinet.facadeThermoFinish = v;
    else if (part === 'worktop') cabinet.facadeWorktopFinish = v;
    if (typeof updateFacadePreview === 'function') updateFacadePreview();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets &&
        document.getElementById('modal-3d-container')?.style.display === 'flex') {
        Kitchen3D.refreshCabinets(typeof currentCabinetForFacade !== 'undefined' && currentCabinetForFacade ? currentCabinetForFacade.id : undefined);
    }
};


function closeFacadeEditorPanel() {
    const panel = document.getElementById('facade-editor-panel');
    if (panel) {
        // فقط کلاس حذف شود، CSS پنل را با انیمیشن خارج میکند
        panel.classList.remove('active');
    }

    // توقف انیمیشن برای جلوگیری از مصرف منابع سیستم
    if (typeof faReqId !== 'undefined' && faReqId) {
        cancelAnimationFrame(faReqId);
    }
}


// ==========================================
// 2. بارگذاری تنظیمات قبلی روی فرم
// ==========================================
function loadExistingFacadeConfig(cabinet) {
    const facadeLengthInput = document.getElementById('facade-length');
    const facadeWidthInput = document.getElementById('facade-width');

    if (facadeLengthInput) {
        facadeLengthInput.value = cabinet.h; 
        facadeLengthInput.readOnly = true;   
        facadeLengthInput.style.opacity = '0.6';
        facadeLengthInput.style.cursor = 'not-allowed';
    }

    if (facadeWidthInput) {
        facadeWidthInput.value = cabinet.d;  
        facadeWidthInput.readOnly = true;    
        facadeWidthInput.style.opacity = '0.6';
        facadeWidthInput.style.cursor = 'not-allowed';
    }

    // گرفتن امنِ تمام المان‌ها برای جلوگیری از ارورهای احتمالی
    const elEnabled = document.getElementById('facade-enabled');
    const elLeft = document.getElementById('facade-left');
    const elRight = document.getElementById('facade-right');
    const el16mmEnabled = document.getElementById('facade-16mm-enabled');
    const el16mmLength = document.getElementById('facade-custom-16mm-length');
    const el16mmWidth = document.getElementById('facade-custom-16mm-width');
    const elLengthPos = document.getElementById('facade-custom-16mm-length-pos');
    const elWidthPos = document.getElementById('facade-custom-16mm-width-pos');
    const elThermoEnabled = document.getElementById('facade-thermowall-enabled');
    const elThermoCount = document.getElementById('facade-thermowall-count');
        const elThermoCustomHeight = document.getElementById('facade-thermowall-custom-height');
    const elThermoHeightPos = document.getElementById('facade-thermowall-height-pos');

    const elWorktopEnabled = document.getElementById('facade-worktop-enabled');
    const elWorktopHeight = document.getElementById('facade-worktop-height');
    const elWorktopThick = document.getElementById('facade-worktop-thickness');

    if (cabinet.facadeConfig) {
        if (elEnabled) elEnabled.checked = cabinet.facadeConfig.enabled;
        if (elLeft) elLeft.checked = cabinet.facadeConfig.isLeft;
        if (elRight) elRight.checked = cabinet.facadeConfig.isRight;
        
        if (el16mmEnabled) el16mmEnabled.checked = cabinet.facadeConfig.is16mm;
        
        if (el16mmLength) el16mmLength.value = cabinet.facadeConfig.customLength || 0;
        if (el16mmWidth) el16mmWidth.value = cabinet.facadeConfig.customWidth || 0;
        
        if (elLengthPos) elLengthPos.value = cabinet.facadeConfig.customLengthPos || 'center';
        if (elWidthPos) elWidthPos.value = cabinet.facadeConfig.customWidthPos || 'center';

        if (elThermoEnabled) elThermoEnabled.checked = cabinet.facadeConfig.isThermo;
        if (elThermoCount) elThermoCount.value = cabinet.facadeConfig.thermoCount || 1;
        if (elThermoCustomHeight) elThermoCustomHeight.value = cabinet.facadeConfig.thermoCustomHeight || 0;
        if (elThermoHeightPos) elThermoHeightPos.value = cabinet.facadeConfig.thermoHeightPos || 'center';

        if (elWorktopEnabled) elWorktopEnabled.checked = cabinet.facadeConfig.isWorktop || false;
        if (elWorktopHeight) elWorktopHeight.value = cabinet.facadeConfig.worktopHeight || 5;
        if (elWorktopThick) elWorktopThick.value = cabinet.facadeConfig.worktopThickness || 3.2;
        const elWorktopCustomWidth = document.getElementById('facade-worktop-custom-width');
        const elWorktopWidthPos = document.getElementById('facade-worktop-width-pos');
        
        if (elWorktopCustomWidth) elWorktopCustomWidth.value = cabinet.facadeConfig.worktopCustomWidth || 0;
        if (elWorktopWidthPos) elWorktopWidthPos.value = cabinet.facadeConfig.worktopWidthPos || 'center';

    } else {
        if (elEnabled) elEnabled.checked = true;
        if (elLeft) elLeft.checked = false;
        if (elRight) elRight.checked = true;
        if (el16mmEnabled) el16mmEnabled.checked = false;
                if (elThermoEnabled) elThermoEnabled.checked = false;
        if (elThermoCustomHeight) elThermoCustomHeight.value = 0;
        if (elThermoHeightPos) elThermoHeightPos.value = 'center';

        
        if (el16mmLength) el16mmLength.value = 0;
        if (el16mmWidth) el16mmWidth.value = 0;

        if (elLengthPos) elLengthPos.value = 'center';
        if (elWidthPos) elWidthPos.value = 'center';

        if (elWorktopEnabled) elWorktopEnabled.checked = false;
        if (elWorktopHeight) elWorktopHeight.value = 5;
        if (elWorktopThick) elWorktopThick.value = 3.2;
                if (document.getElementById('facade-worktop-custom-width')) {
            document.getElementById('facade-worktop-custom-width').value = 0;
        }
        if (document.getElementById('facade-worktop-width-pos')) {
            document.getElementById('facade-worktop-width-pos').value = 'center';
        }

    }
}




function refreshFacadePanelIfOpen() {
    const panel = document.getElementById('facade-editor-panel');
    
    // بررسی می‌کنیم که آیا پنل نما در حال حاضر روی صفحه باز است یا نه
    if (panel && panel.classList.contains('active')) {
        
        // پیدا کردن یونیت جدید بر اساس selectedId (متغیر سراسری پروژه شما)
        const cabinet = cabinets.find(c => c.id === selectedId);
        
        if (cabinet) {
            // ۱. آپدیت کردن شماره کابینت در بالای پنل
            const idSpan = document.getElementById('facade-panel-cabinet-id');
            if (idSpan) idSpan.innerText = cabinet.id;
            
            // ۲. آپدیت کردن فیلدهای ابعاد و تنظیمات کاستوم بر اساس یونیت جدید
            loadExistingFacadeConfig(cabinet);
            
            // ۳. ری‌ست کردن زاویه چرخش مدل سه‌بعدی به حالت اولیه (اختیاری ولی برای تجربه کاربری بهتر است)
            if (typeof faPreviewGroup !== 'undefined' && faPreviewGroup) {
                faPreviewGroup.rotation.set(0, 0, 0);
            }
            
            // ۴. رندر مجدد پیش‌نمایش مینی سه‌بعدی برای یونیت جدید
            updateFacadePreview();
        } else {
            // اگر کاربر روی فضای خالی کلیک کرد و کابینتی انتخاب نشد، پنل را ببند
            closeFacadeEditorPanel();
        }
    }
}

// ==========================================
// 3. راه اندازی محیط سه‌بعدی پیش‌نمایش
// ==========================================
// ==========================================
// 3. راه اندازی محیط سه‌بعدی پیش‌نمایش (با کنترل لمسی و موس)
// ==========================================
function initFacade3DPreview() {
    const container = document.getElementById('facade-preview-3d');
    if (!container || typeof THREE === 'undefined') return;

    // اگر قبلا رندر ساخته شده، فقط اندازه آن را آپدیت کن و انیمیشن را دوباره استارت بزن
    if (faRenderer) {
        faRenderer.setSize(container.clientWidth, container.clientHeight);
        faCamera.aspect = container.clientWidth / container.clientHeight;
        faCamera.updateProjectionMatrix();
        
        // نکته کلیدی رفع باگ: استارت مجدد انیمیشن که موقع بستن پنل متوقف شده بود
        if (faReqId) cancelAnimationFrame(faReqId);
        animateFacadePreview();
        
        return;
    }

    faScene = new THREE.Scene();
    
    // تنظیم دوربین
    faCamera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
    faCamera.position.set(0, 100, 250);

    // رندر
    faRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    faRenderer.outputColorSpace = THREE.SRGBColorSpace;
    faRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    faRenderer.toneMappingExposure = 1.0;
    faRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    faRenderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = ''; 
    container.appendChild(faRenderer.domElement);

    // نورپردازی
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    faScene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(100, 200, 50);
    faScene.add(dirLight);

    faPreviewGroup = new THREE.Group();
    faScene.add(faPreviewGroup);

    // --------------------------------------------------------
    // منطق چرخش با موس و لمس
    // --------------------------------------------------------
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const startRotate = (clientX, clientY) => {
        isDragging = true;
        prevX = clientX;
        prevY = clientY;
    };

    const doRotate = (clientX, clientY) => {
        if (isDragging && faPreviewGroup) {
            const deltaX = clientX - prevX;
            const deltaY = clientY - prevY;
            
            // چرخش چپ و راست (بدون محدودیت)
            faPreviewGroup.rotation.y += deltaX * 0.01;
            
            // چرخش بالا و پایین
            faPreviewGroup.rotation.x += deltaY * 0.01;
            // محدود کردن چرخش بالا و پایین برای جلوگیری از برعکس شدن کابینت
            const maxRotX = Math.PI / 4; 
            faPreviewGroup.rotation.x = Math.max(-maxRotX, Math.min(maxRotX, faPreviewGroup.rotation.x));

            prevX = clientX;
            prevY = clientY;
        }
    };

    const stopRotate = () => {
        isDragging = false;
    };

    container.addEventListener('mousedown', (e) => startRotate(e.clientX, e.clientY));
    container.addEventListener('mousemove', (e) => {
        if(isDragging) e.preventDefault(); 
        doRotate(e.clientX, e.clientY);
    });
    container.addEventListener('mouseup', stopRotate);
    container.addEventListener('mouseleave', stopRotate);

    container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            startRotate(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            e.preventDefault(); 
            doRotate(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });

    container.addEventListener('touchend', stopRotate);

    // استارت اولیه انیمیشن
    animateFacadePreview();
}


function animateFacadePreview() {
    faReqId = requestAnimationFrame(animateFacadePreview);
    if(faRenderer && faScene && faCamera) {
        faRenderer.render(faScene, faCamera);
    }
}

// ==========================================
// 4. آپدیت لایو مدل بر اساس فرم (اصلی‌ترین بخش)
// ==========================================
function updateFacadePreview() {
    if (!currentCabinetForFacade || !faPreviewGroup) return;

    faPreviewGroup.rotation.set(0, 0, 0);

    while(faPreviewGroup.children.length > 0){
        const child = faPreviewGroup.children[0];
        faPreviewGroup.remove(child);
        if(child.geometry) child.geometry.dispose();
        if(child.material) child.material.dispose();
    }

    const c = currentCabinetForFacade;

    const bodyGeo = new THREE.BoxGeometry(c.w, c.h, c.d);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.6 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = c.h / 2;
    faPreviewGroup.add(bodyMesh);

    const maxDim = Math.max(c.w, c.h, c.d);
    faCamera.position.set(0, c.h / 2 + 50, maxDim * 2.2);
    faCamera.lookAt(0, c.h / 2, 0);
    faPreviewGroup.position.y = -c.h / 2;

    const isMainEnabled = document.getElementById('facade-enabled')?.checked;
    if (!isMainEnabled) return; 

    const isLeft = document.getElementById('facade-left')?.checked;
    const isRight = document.getElementById('facade-right')?.checked;
    
    const textureLoader = new THREE.TextureLoader();
    // --- رسم 16 میل ---
    const is16mmEnabled = document.getElementById('facade-16mm-enabled')?.checked;
    let customH = parseFloat(document.getElementById('facade-custom-16mm-length')?.value) || c.h; 
    let customW = parseFloat(document.getElementById('facade-custom-16mm-width')?.value) || c.d;  
    
    let offset16 = 0; 

    // 🟢 متغیرهای موقعیت را بیرون میاوریم تا ترمووال و نما صفحه هم به آنها دسترسی داشته باشند
    let yPos = customH / 2; 
    let zPos = 0;

    const lengthPos = document.getElementById('facade-custom-16mm-length-pos')?.value || 'center';
    if (lengthPos === 'start') {
        yPos = customH / 2; 
    } else if (lengthPos === 'end') {
        yPos = c.h - (customH / 2); 
    } else if (lengthPos === 'center') {
        yPos = c.h / 2; 
    }

    const widthPos = document.getElementById('facade-custom-16mm-width-pos')?.value || 'center';
    if (widthPos === 'start') {
        zPos = -c.d / 2 + customW / 2;
    } else if (widthPos === 'end') {
        zPos = c.d / 2 - customW / 2;
    } else if (widthPos === 'center') {
        zPos = 0;
    }

    if (is16mmEnabled) {
        const thick16 = 1.6;
        offset16 = thick16; 
        
        const input16 = document.getElementById('facade-16mm-color-search');
        let mat16;
        if (input16 && input16.dataset.texture) {
            mat16 = new THREE.MeshStandardMaterial({ map: (() => { const __t = textureLoader.load(input16.dataset.texture); if (THREE.SRGBColorSpace != null) __t.colorSpace = THREE.SRGBColorSpace; return __t; })() });
        } else if (input16 && input16.dataset.code) {
            mat16 = new THREE.MeshStandardMaterial({ color: new THREE.Color(input16.dataset.code) });
        } else {
            mat16 = new THREE.MeshStandardMaterial({ color: 0x8b5a2b }); 
        }
        
        const geo16 = new THREE.BoxGeometry(thick16, customH, customW);

        if (isLeft) {
            const meshL = new THREE.Mesh(geo16, mat16);
            meshL.position.set(-c.w/2 - thick16/2, yPos, zPos); 
            faPreviewGroup.add(meshL);
        }
        if (isRight) {
            const meshR = new THREE.Mesh(geo16, mat16);
            meshR.position.set(c.w/2 + thick16/2, yPos, zPos);
            faPreviewGroup.add(meshR);
        }
    }

    // --- رسم ترمووال ---
    const isThermoEnabled = document.getElementById('facade-thermowall-enabled')?.checked;
    if (isThermoEnabled) {
        const thermoCount = parseInt(document.getElementById('facade-thermowall-count')?.value) || 1;
        const twWidth = parseFloat(document.getElementById('facade-thermowall-width')?.value) || 4; 
        const twThick = parseFloat(document.getElementById('facade-thermowall-thickness')?.value) || 2; 
            // محاسبه ارتفاع اختصاصی ترمووال (اگر 0 باشد از ارتفاع کلی نما استفاده می‌شود)
        const customThermoInputVal = parseFloat(document.getElementById('facade-thermowall-custom-height')?.value) || 0;
        const thermoH = customThermoInputVal > 0 ? customThermoInputVal : customH;

        // محاسبه موقعیت Y ترمووال بر اساس ابتدا، وسط و انتها
        let thermoYPos = yPos; // پیش‌فرض منطبق بر موقعیت عمودی ورق 16 میل
        const thermoHeightPos = document.getElementById('facade-thermowall-height-pos')?.value || 'center';
        
        if (thermoHeightPos === 'start') {
            thermoYPos = (yPos - customH / 2) + (thermoH / 2); // شروع از پایین ورق
        } else if (thermoHeightPos === 'end') {
            thermoYPos = (yPos + customH / 2) - (thermoH / 2); // شروع از بالای ورق
        } else if (thermoHeightPos === 'center') {
            thermoYPos = yPos; // تراز در وسط عمودی ورق
        }

        const inputThermo = document.getElementById('facade-thermo-color-search');
        let twMat;
        if (inputThermo && inputThermo.dataset.texture) {
            twMat = new THREE.MeshStandardMaterial({ map: (() => { const __t = textureLoader.load(inputThermo.dataset.texture); if (THREE.SRGBColorSpace != null) __t.colorSpace = THREE.SRGBColorSpace; return __t; })() });
        } else if (inputThermo && inputThermo.dataset.code) {
            twMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(inputThermo.dataset.code) });
        } else {
            twMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 }); 
        }

        const facadeDepth = is16mmEnabled ? customW : c.d;
        // 🟢 اصلاح شد: مبدا شروع و پایان ترمووال‌ها دقیقاً بر اساس مرکز ورق (zPos) و عرض کاستوم تنظیم می‌شود
        const startZ = zPos - (facadeDepth / 2) + (twWidth / 2);
        const endZ = zPos + (facadeDepth / 2) - (twWidth / 2);

        for(let i = 0; i < thermoCount; i++) {
                        const twGeo = new THREE.BoxGeometry(twThick, thermoH, twWidth);

            
            let zThermoPos = 0;
            if (thermoCount === 1) {
                zThermoPos = zPos;
            } else {
                const step = (endZ - startZ) / (thermoCount - 1);
                zThermoPos = startZ + (i * step);
            }

            // 🟢 اصلاح شد: موقعیت Y ترمووال‌ها با ورق ۱۶ میل (yPos) یکی می‌شود
                        if (isLeft) {
                const twL = new THREE.Mesh(twGeo, twMat);
                twL.position.set(-c.w/2 - offset16 - twThick/2, thermoYPos, zThermoPos);
                faPreviewGroup.add(twL);
            }
            if (isRight) {
                const twR = new THREE.Mesh(twGeo, twMat);
                twR.position.set(c.w/2 + offset16 + twThick/2, thermoYPos, zThermoPos);
                faPreviewGroup.add(twR);
            }

        }
    }
    // --- ⭐ رسم نما صفحه (Worktop) ---
    const isWorktopEnabled = document.getElementById('facade-worktop-enabled')?.checked;
    if (isWorktopEnabled) {
        const wtHeight = parseFloat(document.getElementById('facade-worktop-height')?.value) || 5;
        const wtThickness = parseFloat(document.getElementById('facade-worktop-thickness')?.value) || 3.2;

        // محاسبه طول/عرض اختصاصی نما صفحه (اگر 0 باشد از کل عمق نما استفاده می‌کند)
        const customWtWidthInputVal = parseFloat(document.getElementById('facade-worktop-custom-width')?.value) || 0;
        const facadeDepth = is16mmEnabled ? customW : c.d;
        const wtDepth = customWtWidthInputVal > 0 ? customWtWidthInputVal : facadeDepth;

        const inputWt = document.getElementById('facade-worktop-color-search');
        let wtMat;
        if (inputWt && inputWt.dataset.texture) {
            wtMat = new THREE.MeshStandardMaterial({ map: (() => { const __t = textureLoader.load(inputWt.dataset.texture); if (THREE.SRGBColorSpace != null) __t.colorSpace = THREE.SRGBColorSpace; return __t; })() });
        } else if (inputWt && inputWt.dataset.code) {
            wtMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(inputWt.dataset.code) });
        } else {
            wtMat = new THREE.MeshStandardMaterial({ color: 0xdddddd }); 
        }

        const wtGeo = new THREE.BoxGeometry(wtThickness, wtHeight, wtDepth);
        
        // تراز عمودی Y نسبت به لبه بالایی ورق ۱۶ میل یا کابینت
        const wtYPos = (yPos + customH / 2) - (wtHeight / 2); 
        
        // محاسبه موقعیت Z بر اساس ابتدا، وسط و انتها نسبت به ورق بستر (zPos)
        let zWtPos = zPos;
        const wtWidthPos = document.getElementById('facade-worktop-width-pos')?.value || 'center';
        
        if (wtWidthPos === 'start') {
            zWtPos = (zPos - facadeDepth / 2) + (wtDepth / 2); // شروع از جلوی کار
        } else if (wtWidthPos === 'end') {
            zWtPos = (zPos + facadeDepth / 2) - (wtDepth / 2); // شروع از انتهای کار
        } else if (wtWidthPos === 'center') {
            zWtPos = zPos; // تراز در وسط
        }

        if (isLeft) {
            const wtL = new THREE.Mesh(wtGeo, wtMat);
            wtL.position.set(-c.w/2 - offset16 - wtThickness/2, wtYPos, zWtPos);
            faPreviewGroup.add(wtL);
        }
        if (isRight) {
            const wtR = new THREE.Mesh(wtGeo, wtMat);
            wtR.position.set(c.w/2 + offset16 + wtThickness/2, wtYPos, zWtPos);
            faPreviewGroup.add(wtR);
        }
    }

}





// ==========================================
// 5. اعمال تغییرات روی صحنه اصلی پروژه
// ==========================================
// ==========================================
// 5. اعمال تغییرات روی صحنه اصلی پروژه (اصلاح شده)
// ==========================================
function applyFacadeSettings() {
    if (typeof selectedId === 'undefined' || selectedId === null) return;
    
    const cabinet = cabinets.find(c => c.id === selectedId);
    if (!cabinet) return;

    cabinet.facadeConfig = {
        enabled: document.getElementById('facade-enabled')?.checked || false,
        isLeft: document.getElementById('facade-left')?.checked || false,
        isRight: document.getElementById('facade-right')?.checked || false,
        
        is16mm: document.getElementById('facade-16mm-enabled')?.checked || false,
        customLength: parseFloat(document.getElementById('facade-custom-16mm-length')?.value) || 0,
        customWidth: parseFloat(document.getElementById('facade-custom-16mm-width')?.value) || 0,
        customLengthPos: document.getElementById('facade-custom-16mm-length-pos')?.value || 'center',
        customWidthPos: document.getElementById('facade-custom-16mm-width-pos')?.value || 'center',
        isThermo: document.getElementById('facade-thermowall-enabled')?.checked || false,
        thermoCount: parseInt(document.getElementById('facade-thermowall-count')?.value) || 1,
        thermoWidth: parseFloat(document.getElementById('facade-thermowall-width')?.value) || 4,
        thermoThickness: parseFloat(document.getElementById('facade-thermowall-thickness')?.value) || 2,
        thermoCustomHeight: parseFloat(document.getElementById('facade-thermowall-custom-height')?.value) || 0,
        thermoHeightPos: document.getElementById('facade-thermowall-height-pos')?.value || 'center',

        // ⭐ اضافه شده برای ذخیره تنظیمات نما صفحه در آبجکت کابینت
        isWorktop: document.getElementById('facade-worktop-enabled')?.checked || false,
        worktopHeight: parseFloat(document.getElementById('facade-worktop-height')?.value) || 5,
        worktopThickness: parseFloat(document.getElementById('facade-worktop-thickness')?.value) || 3.2,
                // ⭐ اضافه شده برای ذخیره تنظیمات نما صفحه در آبجکت کابینت
        isWorktop: document.getElementById('facade-worktop-enabled')?.checked || false,
        worktopHeight: parseFloat(document.getElementById('facade-worktop-height')?.value) || 5,
        worktopThickness: parseFloat(document.getElementById('facade-worktop-thickness')?.value) || 3.2,
        // مقادیر جدید:
        worktopCustomWidth: parseFloat(document.getElementById('facade-worktop-custom-width')?.value) || 0,
        worktopWidthPos: document.getElementById('facade-worktop-width-pos')?.value || 'center'

    };

    const input16mm = document.getElementById('facade-16mm-color-search');
    if (input16mm) {
        cabinet.facade16mmColorName = input16mm.value;
        cabinet.facade16mmMaterialValue = input16mm.dataset.material || input16mm.dataset.texture || input16mm.dataset.code;
    }

    const inputThermo = document.getElementById('facade-thermo-color-search');
    if (inputThermo) {
        cabinet.facadeThermoColorName = inputThermo.value;
        cabinet.facadeThermoMaterialValue = inputThermo.dataset.material || inputThermo.dataset.texture || inputThermo.dataset.code;
    }

    // ⭐ اضافه شده برای ذخیره رنگ نما صفحه
    const inputWorktop = document.getElementById('facade-worktop-color-search');
    if (inputWorktop) {
        cabinet.facadeWorktopColorName = inputWorktop.value;
        cabinet.facadeWorktopMaterialValue = inputWorktop.dataset.material || inputWorktop.dataset.texture || inputWorktop.dataset.code;
    }

    const type16mm = document.getElementById("facade-16mm-material-type");
    if (type16mm) cabinet.facade16mmMaterialType = type16mm.value;

    const typeThermo = document.getElementById("facade-thermo-material-type");
    if (typeThermo) cabinet.facadeThermoMaterialType = typeThermo.value;

    // ⭐ اضافه شده برای ذخیره نوع متریال نما صفحه
    const typeWorktop = document.getElementById("facade-worktop-material-type");
    if (typeWorktop) cabinet.facadeWorktopMaterialType = typeWorktop.value;

    // پرداخت سطح (نور)
    const fin16 = document.getElementById("facade-16mm-finish");
    if (fin16) cabinet.facade16mmFinish = fin16.value || 'matte';
    const finThermo = document.getElementById("facade-thermo-finish");
    if (finThermo) cabinet.facadeThermoFinish = finThermo.value || 'matte';
    const finWorktop = document.getElementById("facade-worktop-finish");
    if (finWorktop) cabinet.facadeWorktopFinish = finWorktop.value || 'matte';

    closeFacadeEditorPanel();

    const _facadeCabId = (typeof currentCabinetForFacade !== 'undefined' && currentCabinetForFacade) ? currentCabinetForFacade.id : undefined;
    if (typeof refreshBabylonFacade === 'function') refreshBabylonFacade(_facadeCabId);
    if (typeof Kitchen3D !== 'undefined') {
        if (typeof Kitchen3D.refreshCabinets === 'function') {
            Kitchen3D.refreshCabinets(_facadeCabId); 
        } else if (typeof Kitchen3D.renderCabinets === 'function') {
            Kitchen3D.renderCabinets(); 
        }
    } else {
        console.warn("آبجکت Kitchen3D پیدا نشد! برای دیدن تغییرات صفحه را رفرش کنید.");
    }
}
// باز کردن مودال رنگ نما به صورت سراسری و هوشمند
function openFacadeMaterialModal(part) {
    currentFacadeColorPart = part; // ذخیره بخش فعلی (16mm, thermo, worktop)

    // پیدا کردن سلت‌باکس مناسب بر اساس بخش انتخاب شده
    let selectBoxId = 'facade-16mm-material-type';
    if (part === 'thermo') {
        selectBoxId = 'facade-thermo-material-type';
    } else if (part === 'worktop') {
        selectBoxId = 'facade-worktop-material-type';
    }
    
    const selectBox = document.getElementById(selectBoxId);
    
    // 🟢 اصلاح منطق کاتگوری: اگر بخش نما صفحه بود و سلباکس پیدا نشد، به صورت پیش‌فرض کاتگوری 'countertop' ارسال شود
    let category = 'mdf';
    if (selectBox) {
        category = selectBox.value;
    } else if (part === 'worktop') {
        category = 'countertop';
    }

    // تعیین عنوان مناسب برای هدر مودال
    let modalTitle = "انتخاب رنگ و طرح نما";
    if (part === '16mm') modalTitle = "انتخاب طرح و رنگ نمای ۱۶ میل";
    if (part === 'thermo') modalTitle = "انتخاب طرح و رنگ ترمووال";
    if (part === 'worktop') modalTitle = "انتخاب طرح و رنگ نما صفحه (Worktop)";

    // باز کردن مودال سراسری و دریافت متریال انتخاب شده در کالبک
    if (typeof window.openUniversalModal === 'function') {
        window.openUniversalModal(modalTitle, category, function(material) {
            // پس از انتخاب متریال در مودال، این تابع اجرا می‌شود:
            selectFacadeColor(material.name, material.code, material.texture);
        });
    } else {
        console.error("تابع سراسری openUniversalModal یافت نشد!");
    }
}

function selectFacadeColor(name, code, textureUrl) {
    let targetInputId = 'facade-16mm-color-search';
    if (currentFacadeColorPart === 'thermo') {
        targetInputId = 'facade-thermo-color-search';
    } else if (currentFacadeColorPart === 'worktop') {
        targetInputId = 'facade-worktop-color-search';
    }
    
    const colorInput = document.getElementById(targetInputId);

    if (colorInput) {
        colorInput.value = name;
        
        delete colorInput.dataset.material;
        delete colorInput.dataset.code;
        delete colorInput.dataset.texture;
        
        if (code) colorInput.dataset.code = code; 
        if (textureUrl) colorInput.dataset.texture = textureUrl;
        
    } else {
        console.error(`خطا: اینپوتی با آیدی ${targetInputId} در HTML پیدا نشد!`);
    }

    // 🔴 بستن ایمن مودال و جلوگیری از بروز ارور در countertop-editor.js
    if (typeof window.closeUniversalModal === 'function') {
        window.closeUniversalModal();
    } else if (typeof window.closeCountertopMaterialModal === 'function') {
        window.closeCountertopMaterialModal();
    }

    if (typeof updateFacadePreview === 'function') {
        updateFacadePreview();
    }
}







function applyFacadeColorsToPreview() {
    const input16mm = document.getElementById('facade-16mm-color-search');
    const inputThermo = document.getElementById('facade-thermo-color-search');

    // خواندن مقادیر یا دادن رنگ دیفالت
    const mat16mmValue = (input16mm && input16mm.dataset.material) ? input16mm.dataset.material : "#e2e8f0";
    const matThermoValue = (inputThermo && inputThermo.dataset.material) ? inputThermo.dataset.material : "#8b4513";

    // اعمال روی مش‌های نمای ۱۶ میل و ترمووال با استفاده از تابع مشترک شما
    // (توجه: تابع applyMaterialToMesh همان تابعی است که در کدهای کلاف یخچال فرستادید)
    if (preview16mmMesh) {
        applyMaterialToMesh(preview16mmMesh, mat16mmValue);
    }
    if (previewThermoMesh) {
        applyMaterialToMesh(previewThermoMesh, matThermoValue);
    }
}

function updateFacadeLive() {
    const cabinet = typeof getSelectedCabinet === 'function' ? getSelectedCabinet() : null;
    if (!cabinet) return;

    const type16mm = document.getElementById("facade-16mm-material-type");
    if (type16mm) cabinet.facade16mmMaterialType = type16mm.value;

    const typeThermo = document.getElementById("facade-thermo-material-type");
    if (typeThermo) cabinet.facadeThermoMaterialType = typeThermo.value;

    // ⭐ اضافه شده برای آپدیت لایو نوع متریال نما صفحه
    const typeWorktop = document.getElementById("facade-worktop-material-type");
    if (typeWorktop) cabinet.facadeWorktopMaterialType = typeWorktop.value;

    const input16mm = document.getElementById('facade-16mm-color-search');
    const inputThermo = document.getElementById('facade-thermo-color-search');
    
    // ⭐ اضافه شده برای آپدیت لایو رنگ نما صفحه
    const inputWorktop = document.getElementById('facade-worktop-color-search');

    if (input16mm) {
        cabinet.facade16mmMaterialValue = input16mm.dataset.texture || input16mm.dataset.code || cabinet.facade16mmMaterialValue;
    }
    if (inputThermo) {
        cabinet.facadeThermoMaterialValue = inputThermo.dataset.texture || inputThermo.dataset.code || cabinet.facadeThermoMaterialValue;
    }
    if (inputWorktop) {
        cabinet.facadeWorktopMaterialValue = inputWorktop.dataset.texture || inputWorktop.dataset.code || cabinet.facadeWorktopMaterialValue;
    }

    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshCabinets) {
        Kitchen3D.refreshCabinets(typeof currentCabinetForFacade !== 'undefined' && currentCabinetForFacade ? currentCabinetForFacade.id : undefined);
    }

    if (typeof buildFacade3DModel === 'function') {
        buildFacade3DModel();
    }
}
