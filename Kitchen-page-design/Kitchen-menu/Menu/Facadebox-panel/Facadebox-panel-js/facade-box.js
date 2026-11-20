// ==========================================
// توابع مدیریت پنل باکس نما (حالت ویرایشگر اختصاصی)
// ==========================================

// متغیری برای نگهداری دیواره‌ای که در حال حاضر مودال برای آن باز شده است

window.selectedFacadeShelfIndex = { left: -1, right: -1, front: -1, back: -1 };
let selectedFacadeNicheIndex = { left: -1, right: -1, front: -1, back: -1 };


window.selectedFacadeBox = null;
window.facadePreviewParams = {
    scene: null, camera: null, renderer: null, controls: null, boxGroup: null, animationFrameId: null
};
// ۱. باز کردن پنل (فقط برای ویرایش باکس انتخاب شده)
function openFacadeBoxPanel() {
    const panel = document.getElementById('facade-box-editor-panel');
    if (!panel) {
        console.error("خطا: پنل با آیدی 'facade-box-editor-panel' یافت نشد!");
        return;
    }

    // ⭐ پیدا کردن باکس انتخاب شده بر اساس کدهای اصلی شما ⭐
    let boxData = null;
    if (typeof selectedId !== 'undefined' && selectedId !== -1 && typeof cabinets !== 'undefined') {
        boxData = cabinets.find(c => c.id === selectedId);
    }

    // اگر هیچ باکسی انتخاب نشده بود یا آیتم انتخاب شده "باکس نما" نبود
    if (!boxData || !boxData.isFacadeBox) {
        alert("لطفاً ابتدا روی یک 'باکس نما' در صفحه کلیک کنید تا انتخاب شود، سپس این دکمه را بزنید.");
        return;
    }

    // ⭐ گرفتن یک کپی موقت (Deep Copy) از باکس انتخاب شده ⭐
    window.selectedFacadeBox = JSON.parse(JSON.stringify(boxData));

    // چون تابع addFacadeBox شما پراپرتی panels را ندارد، اینجا آن را اضافه می‌کنیم
    if (!window.selectedFacadeBox.panels) {
        window.selectedFacadeBox.panels = createDefaultPanels();
    }

    // لود کردن اطلاعات روی فرم
    loadBoxDataIntoForm(window.selectedFacadeBox);
    
    // نمایش پنل
    panel.classList.add('active'); 
    panel.style.display = 'block'; 
    
    // راه‌اندازی پیش‌نمایش 3D
    setTimeout(() => {
        initFacadeBoxPreview();
    }, 150);
}

// 1. تابع ساخت مقادیر پیش‌فرض
function createDefaultPanels() {
    // 🔄 اصلاح شد: رنگ پیش‌فرض ترمووال از قهوه‌ای به سفید یخچالی تغییر یافت
    const defaultThermo = { enabled: false, count: 5, w: 3, d: 2, color: '#FFFFFF', colorName: 'سفید یخچالی', materialType: 'mdf', finish: 'matte' };
    const defaultShelves = { enabled: false, list: [], materialType: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte' }; 

    return {
        left:  { active: true, posLeft: true, posRight: false, thermowall: {...defaultThermo}, shelves: JSON.parse(JSON.stringify(defaultShelves)), w: 55, h: 280, t: 1.6, color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte' },
        right: { active: true, posLeft: false, posRight: true, thermowall: {...defaultThermo}, shelves: JSON.parse(JSON.stringify(defaultShelves)), w: 55, h: 280, t: 1.6, color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte' },
        front: { active: true, posLeft: false, posRight: true, thermowall: {...defaultThermo}, shelves: JSON.parse(JSON.stringify(defaultShelves)), w: 55, h: 280, t: 1.6, color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte' },
        back:  { active: true, posLeft: true, posRight: false, thermowall: {...defaultThermo}, shelves: JSON.parse(JSON.stringify(defaultShelves)), w: 55, h: 280, t: 1.6, color: '#FFFFFF', colorName: 'سفید یخچالی', finish: 'matte' }
    };
}





// 2. تابع فرم (دقیقاً کد خودتان - تغییری نیاز نداشت چون حلقه داینامیک است)
function loadBoxDataIntoForm(boxData) {
    if(!boxData || !boxData.panels) return;

    const parts = ['left', 'right', 'front', 'back'];
    parts.forEach(part => {
        const panelData = boxData.panels[part];
        if (panelData) {
            // ... (کدهای قبلی لود دیواره اصلی ثابت می‌ماند) ...
            const elEnabled = document.getElementById(`facade-box-${part}-enabled`);
            if(elEnabled) elEnabled.checked = panelData.active !== false; 
            const elW = document.getElementById(`facade-box-${part}-w`);
            if(elW) elW.value = panelData.w;
            const elH = document.getElementById(`facade-box-${part}-h`);
            if(elH) elH.value = panelData.h;
            const elT = document.getElementById(`facade-box-${part}-t`);
            if(elT) elT.value = panelData.t;
            const elPosLeft = document.getElementById(`facade-box-${part}-pos-left`);
            if(elPosLeft) elPosLeft.checked = panelData.posLeft || false;
            const elPosRight = document.getElementById(`facade-box-${part}-pos-right`);
            if(elPosRight) elPosRight.checked = panelData.posRight || false;

            // جنس ورق + رنگ + پرداخت دیواره
            const elMaterial = document.getElementById(`facade-box-${part}-material`);
            if (elMaterial) elMaterial.value = panelData.materialType || 'mdf';
            const elFinish = document.getElementById(`facade-box-${part}-finish`);
            if (elFinish) elFinish.value = panelData.finish || 'matte';

            // 🔄 لود رنگ و تکسچر اصلی دیواره
            const elColorInput = document.getElementById(`facade-box-${part}-color`);
            if (elColorInput) {
                elColorInput.value = panelData.colorName || '';
                if (panelData.texture) {
                    elColorInput.setAttribute('data-texture', panelData.texture);
                    elColorInput.removeAttribute('data-color');
                } else {
                    elColorInput.setAttribute('data-color', panelData.color || '#FFFFFF');
                    elColorInput.removeAttribute('data-texture');
                }
            }

            // لود اطلاعات ترمووال
            if (panelData.thermowall) {
                const elThEn = document.getElementById(`facade-box-${part}-thermowall-enabled`);
                if(elThEn) elThEn.checked = panelData.thermowall.enabled || false;

                const elThCount = document.getElementById(`facade-box-${part}-thermowall-count`);
                if(elThCount) elThCount.value = panelData.thermowall.count || 0;

                const elThW = document.getElementById(`facade-box-${part}-thermowall-w`);
                if(elThW) elThW.value = panelData.thermowall.w || 0;

                const elThD = document.getElementById(`facade-box-${part}-thermowall-d`);
                if(elThD) elThD.value = panelData.thermowall.d || 0;

                // --- لود متریال و رنگ ترمووال ---
                const elThMat = document.getElementById(`facade-box-${part}-thermowall-material`);
                if(elThMat) elThMat.value = panelData.thermowall.materialType || 'mdf';

                const elThFinish = document.getElementById(`facade-box-${part}-thermowall-finish`);
                if (elThFinish) elThFinish.value = panelData.thermowall.finish || 'matte';

                const elThColor = document.getElementById(`facade-box-${part}-thermowall-color`);
                if(elThColor) {
                    elThColor.value = panelData.thermowall.colorName || '';
                    elThColor.setAttribute('data-color', panelData.thermowall.color || '#8b5a2b');
                    if (panelData.thermowall.texture) {
                        elThColor.setAttribute('data-texture', panelData.thermowall.texture);
                    }
                }
            }

            // لود پرداخت طبقات
            if (panelData.shelves) {
                const elShelfFinish = document.getElementById(`facade-box-${part}-shelf-finish`);
                if (elShelfFinish) elShelfFinish.value = panelData.shelves.finish || 'matte';
                const elShelfMat = document.getElementById(`facade-box-${part}-shelf-material`);
                if (elShelfMat) elShelfMat.value = panelData.shelves.materialType || 'mdf';
            }
        }
    });
}

// 3. تابع آپدیت لایو
function updateFacadeBoxLive() {
    if (!window.selectedFacadeBox) return;

    const parts = ['left', 'right', 'front', 'back'];
    
    parts.forEach(part => {
        if (!window.selectedFacadeBox.panels[part]) return;
        
        const elEnabled = document.getElementById(`facade-box-${part}-enabled`);
        const elW = document.getElementById(`facade-box-${part}-w`);
        const elH = document.getElementById(`facade-box-${part}-h`);
        const elT = document.getElementById(`facade-box-${part}-t`);
        const elMaterial = document.getElementById(`facade-box-${part}-material`);
        const elColorInput = document.getElementById(`facade-box-${part}-color`);
        const elPosLeft = document.getElementById(`facade-box-${part}-pos-left`);
        const elPosRight = document.getElementById(`facade-box-${part}-pos-right`);

        const elThEn = document.getElementById(`facade-box-${part}-thermowall-enabled`);
        const elThCount = document.getElementById(`facade-box-${part}-thermowall-count`);
        const elThW = document.getElementById(`facade-box-${part}-thermowall-w`);
        const elThD = document.getElementById(`facade-box-${part}-thermowall-d`);
        const elThMat = document.getElementById(`facade-box-${part}-thermowall-material`);
        const elThColor = document.getElementById(`facade-box-${part}-thermowall-color`);

        const elShelfEn = document.getElementById(`facade-box-${part}-shelf-enabled`);
        const elShelfMat = document.getElementById(`facade-box-${part}-shelf-material`);
        const elShelfColor = document.getElementById(`facade-box-${part}-shelf-color`);
        const sW = document.getElementById(`facade-box-${part}-shelf-w`);
        const sD = document.getElementById(`facade-box-${part}-shelf-d`);
        const sT = document.getElementById(`facade-box-${part}-shelf-t`);
        const sH = document.getElementById(`facade-box-${part}-shelf-h`);

        const elNicheEn = document.getElementById(`facade-box-${part}-niche-enabled`);
        const nW = document.getElementById(`facade-box-${part}-niche-w`);
        const nH = document.getElementById(`facade-box-${part}-niche-h`);
        const nD = document.getElementById(`facade-box-${part}-niche-d`);
        const nPosY = document.getElementById(`facade-box-${part}-niche-posy`);
        const nColor = document.getElementById(`facade-box-${part}-niche-color`);

        if(elW && elH && elT) {
            window.selectedFacadeBox.panels[part].active = elEnabled ? elEnabled.checked : true;
            window.selectedFacadeBox.panels[part].w = parseFloat(elW.value) || 0;
            window.selectedFacadeBox.panels[part].h = parseFloat(elH.value) || 0;
            window.selectedFacadeBox.panels[part].t = parseFloat(elT.value) || 1.6;

            if (elMaterial) window.selectedFacadeBox.panels[part].materialType = elMaterial.value;
            const elFinish = document.getElementById(`facade-box-${part}-finish`);
            if (elFinish) window.selectedFacadeBox.panels[part].finish = elFinish.value || 'matte';
            
            // 🔄 آپدیت زنده رنگ و تکسچر دیواره اصلی
            if (elColorInput) {
                const txtAttr = elColorInput.getAttribute('data-texture');
                const colAttr = elColorInput.getAttribute('data-color');
                window.selectedFacadeBox.panels[part].colorName = elColorInput.value || '';
                
                if (txtAttr && txtAttr !== "null" && txtAttr !== "") {
                    window.selectedFacadeBox.panels[part].texture = txtAttr;
                    window.selectedFacadeBox.panels[part].color = null;
                } else {
                    window.selectedFacadeBox.panels[part].color = colAttr || '#FFFFFF';
                    window.selectedFacadeBox.panels[part].texture = null;
                }
            }

            if (elPosLeft) window.selectedFacadeBox.panels[part].posLeft = elPosLeft.checked;
            if (elPosRight) window.selectedFacadeBox.panels[part].posRight = elPosRight.checked;

            // 🔄 آپدیت زنده ترمووال
            if (elThEn) {
                if (!window.selectedFacadeBox.panels[part].thermowall) window.selectedFacadeBox.panels[part].thermowall = {};
                window.selectedFacadeBox.panels[part].thermowall.enabled = elThEn.checked;
                window.selectedFacadeBox.panels[part].thermowall.count = parseInt(elThCount.value) || 0;
                window.selectedFacadeBox.panels[part].thermowall.w = parseFloat(elThW.value) || 0;
                window.selectedFacadeBox.panels[part].thermowall.d = parseFloat(elThD.value) || 0;

                if (elThMat) window.selectedFacadeBox.panels[part].thermowall.materialType = elThMat.value;
                const elThFinish = document.getElementById(`facade-box-${part}-thermowall-finish`);
                if (elThFinish) window.selectedFacadeBox.panels[part].thermowall.finish = elThFinish.value || 'matte';
                if (elThColor) {
                    const thTxtAttr = elThColor.getAttribute('data-texture');
                    const thColAttr = elThColor.getAttribute('data-color');
                    window.selectedFacadeBox.panels[part].thermowall.colorName = elThColor.value || '';
                    if (thTxtAttr && thTxtAttr !== "null" && thTxtAttr !== "") {
                        window.selectedFacadeBox.panels[part].thermowall.texture = thTxtAttr;
                        window.selectedFacadeBox.panels[part].thermowall.color = null;
                    } else {
                        window.selectedFacadeBox.panels[part].thermowall.color = thColAttr || '#8b5a2b';
                        window.selectedFacadeBox.panels[part].thermowall.texture = null;
                    }
                }
            }

            // 🔄 آپدیت زنده شلف‌ها با پشتیبانی کامل از تکسچر و رنگ
            if (elShelfEn) {
                if (!window.selectedFacadeBox.panels[part].shelves) {
                    window.selectedFacadeBox.panels[part].shelves = { enabled: false, list: [], materialType: 'mdf', color: '#cbd5e1', finish: 'matte' };
                }
                window.selectedFacadeBox.panels[part].shelves.enabled = elShelfEn.checked;
                if (elShelfMat) window.selectedFacadeBox.panels[part].shelves.materialType = elShelfMat.value;
                const elShelfFinish = document.getElementById(`facade-box-${part}-shelf-finish`);
                if (elShelfFinish) window.selectedFacadeBox.panels[part].shelves.finish = elShelfFinish.value || 'matte';
                
                if (elShelfColor) {
                    const shTxtAttr = elShelfColor.getAttribute('data-texture');
                    const shColAttr = elShelfColor.getAttribute('data-color');
                    
                    if (shTxtAttr && shTxtAttr !== "null" && shTxtAttr !== "") {
                        window.selectedFacadeBox.panels[part].shelves.texture = shTxtAttr;
                        window.selectedFacadeBox.panels[part].shelves.color = null;
                    } else {
                        window.selectedFacadeBox.panels[part].shelves.color = shColAttr || '#cbd5e1';
                        window.selectedFacadeBox.panels[part].shelves.texture = null;
                    }
                }

                const sIdx = window.selectedFacadeShelfIndex[part];
                if (sIdx > -1 && window.selectedFacadeBox.panels[part].shelves.list[sIdx]) {
                    const currentShelf = window.selectedFacadeBox.panels[part].shelves.list[sIdx];
                    currentShelf.w = parseFloat(sW?.value) || 0;
                    currentShelf.d = parseFloat(sD?.value) || 0;
                    currentShelf.t = parseFloat(sT?.value) || 1.6;
                    currentShelf.h = parseFloat(sH?.value) || 0;
                    
                    if (elShelfColor) {
                        const shTxtAttr = elShelfColor.getAttribute('data-texture');
                        const shColAttr = elShelfColor.getAttribute('data-color');
                        currentShelf.colorName = elShelfColor.value || '';
                        if (shTxtAttr && shTxtAttr !== "null" && shTxtAttr !== "") {
                            currentShelf.texture = shTxtAttr;
                            currentShelf.color = null;
                        } else {
                            currentShelf.color = shColAttr || '#cbd5e1';
                            currentShelf.texture = null;
                        }
                    }
                    renderShelvesList(part);
                }
            }
            
            // --- ⭐ بخش آپدیت باکس توکار (Niche) ⭐ ---
            if (elNicheEn) {
                if (!window.selectedFacadeBox.panels[part].niches) {
                    window.selectedFacadeBox.panels[part].niches = { enabled: false, list: [] };
                }
                window.selectedFacadeBox.panels[part].niches.enabled = elNicheEn.checked;

                const edgeSelector = document.querySelector(`input[name="facade-box-${part}-niche-edge"]:checked`);
                const openEdge = edgeSelector ? edgeSelector.value : 'none';
                
                const wallWidth = parseFloat(document.getElementById(`facade-box-${part}-w`).value) || 0;
                const nicheW = parseFloat(document.getElementById(`facade-box-${part}-niche-w`).value) || 0;
                const inputPosX = document.getElementById(`facade-box-${part}-niche-posx`);

                if (openEdge === 'left') {
                    inputPosX.value = 0;
                    inputPosX.disabled = true;
                    inputPosX.style.opacity = "0.5";
                } else if (openEdge === 'right') {
                    inputPosX.value = Math.max(0, wallWidth - nicheW);
                    inputPosX.disabled = true;
                    inputPosX.style.opacity = "0.5";
                } else {
                    inputPosX.disabled = false;
                    inputPosX.style.opacity = "1";
                }

                const nIdx = typeof selectedFacadeNicheIndex !== 'undefined' ? selectedFacadeNicheIndex[part] : -1;
                
                const elNicheFinish = document.getElementById(`facade-box-${part}-niche-finish`);
                const nicheFinishVal = elNicheFinish ? (elNicheFinish.value || 'matte') : 'matte';

                
                if (nIdx > -1 && window.selectedFacadeBox.panels[part].niches.list[nIdx]) {
                    window.selectedFacadeBox.panels[part].niches.list[nIdx].finish = (typeof nicheFinishVal !== 'undefined') ? nicheFinishVal : 'matte';
                    const currentNiche = window.selectedFacadeBox.panels[part].niches.list[nIdx];
                    
                    if (nW && nW.value !== '') currentNiche.w = parseFloat(nW.value);
                    if (nH && nH.value !== '') currentNiche.h = parseFloat(nH.value);
                    if (nD && nD.value !== '') currentNiche.d = parseFloat(nD.value);
                    if (nPosY && nPosY.value !== '') currentNiche.posY = parseFloat(nPosY.value);
                    
                    currentNiche.posX = parseFloat(inputPosX.value) || 0;
                    currentNiche.openEdge = openEdge;
                    
                    if (nColor) {
                        const niTxtAttr = nColor.getAttribute('data-texture');
                        const niColAttr = nColor.getAttribute('data-color');
                        currentNiche.colorName = nColor.value || '';
                        if (niTxtAttr && niTxtAttr !== "null" && niTxtAttr !== "") {
                            currentNiche.texture = niTxtAttr;
                            currentNiche.color = null;
                        } else {
                            currentNiche.color = niColAttr || '#ffffff';
                            currentNiche.texture = null;
                        }
                    }
                    
                    if (typeof renderFacadeNichesList === 'function') {
                        renderFacadeNichesList(part); 
                    }
                }
            }
        }
    });
    
    // محاسبات نهایی ابعاد باکس کلی
    const p = window.selectedFacadeBox.panels;
    const tL = p.left.active !== false ? (p.left.t || 0) : 0;
    const tR = p.right.active !== false ? (p.right.t || 0) : 0;
    window.selectedFacadeBox.w = Math.max(
        p.front.active !== false ? (p.front.w || 0) : 0, 
        p.back.active !== false ? (p.back.w || 0) : 0
    ) + tL + tR; 
    window.selectedFacadeBox.h = Math.max(
        p.left.active !== false ? (p.left.h || 0) : 0, 
        p.right.active !== false ? (p.right.h || 0) : 0, 
        p.front.active !== false ? (p.front.h || 0) : 0, 
        p.back.active !== false ? (p.back.h || 0) : 0
    ); 
    window.selectedFacadeBox.d = Math.max(
        p.left.active !== false ? (p.left.w || 0) : 0, 
        p.right.active !== false ? (p.right.w || 0) : 0
    );
    if (typeof renderFacadeBoxPreview === 'function') {
        renderFacadeBoxPreview();
    }
}







// ۵. راه‌اندازی مینی سه‌بعدی داخل پنل
function initFacadeBoxPreview() {
    const container = document.getElementById('facade-box-preview-3d');
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;

    const p = window.facadePreviewParams;
    
    if (p.renderer) {
        p.renderer.setSize(width, height);
        p.camera.aspect = width / height;
        p.camera.updateProjectionMatrix();
        renderFacadeBoxPreview();
        return;
    }

    if (typeof THREE === 'undefined') {
        console.warn("کتابخانه Three.js لود نشده است، پیش‌نمایش 3D اجرا نمی‌شود.");
        return;
    }

    p.scene = new THREE.Scene();
    p.scene.background = new THREE.Color(0x1e293b);

    p.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    p.camera.position.set(150, 200, 250);
    p.camera.lookAt(0, 50, 0);

    p.renderer = new THREE.WebGLRenderer({ antialias: true });
    p.renderer.outputColorSpace = THREE.SRGBColorSpace;
    p.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    p.renderer.toneMappingExposure = 1.0;
    p.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    p.renderer.setSize(width, height);
    container.innerHTML = ''; 
    container.appendChild(p.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    p.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 100);
    p.scene.add(dirLight);

    if (typeof THREE.OrbitControls !== 'undefined') {
        p.controls = new THREE.OrbitControls(p.camera, p.renderer.domElement);
        p.controls.enableDamping = true;
        p.controls.target.set(0, 50, 0);
    }

    p.boxGroup = new THREE.Group();
    p.scene.add(p.boxGroup);

    const gridHelper = new THREE.GridHelper(300, 30, 0x475569, 0x334155);
    p.scene.add(gridHelper);

    function animate() {
        p.animationFrameId = requestAnimationFrame(animate);
        if (p.controls) p.controls.update();
        p.renderer.render(p.scene, p.camera);
    }
    animate();

    renderFacadeBoxPreview();
}

// 4. تابع رندر سه‌بعدی 
function renderFacadeBoxPreview() {
    const p = window.facadePreviewParams;
    if (!p.boxGroup || !window.selectedFacadeBox) return;

    // پاکسازی گروه پیش‌نمایش
    while(p.boxGroup.children.length > 0){ 
        p.boxGroup.remove(p.boxGroup.children[0]); 
    }

    const data = window.selectedFacadeBox.panels;

    // 🔄 تابع هوشمند برای ساخت متریال با پشتیبانی همزمان تکسچر تصویری و رنگ ساده در پیش‌نمایش کامپوننت
    function getDynamicMaterial(panelOrItemData, defaultColor = '#FFFFFF') {
    if (panelOrItemData && panelOrItemData.texture) {
        const texture = new THREE.TextureLoader().load(panelOrItemData.texture);
        if (THREE.SRGBColorSpace != null) texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(0.02, 0.02); 
        return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6, metalness: 0.1 });
    }
    // 🔄 اطمینان از معتبر بودن کدهای رنگ دریافتی، در غیر این صورت اعمال سفید یخچالی
    let colorStr = panelOrItemData?.color || panelOrItemData?.code;
    if (!colorStr || colorStr === "null" || colorStr === "") {
        colorStr = defaultColor;
    }
    return new THREE.MeshStandardMaterial({ color: colorStr, roughness: 0.5 });
}


    const boxW = Math.max(data.front?.w || 40, data.back?.w || 40); 
    const boxD = Math.max(data.left?.w || 40, data.right?.w || 40);

    function createWallWithNiches(w, h, t, niches, isSideWall, wallMesh, sideId) {
        const shape = new THREE.Shape();
        const boxEps = 0.02; 
        const zEps = 0.05;   

        let wallNiches = [];
        if (niches && niches.enabled && niches.list) {
            wallNiches = niches.list;
        }

        const leftNiches = wallNiches.filter(n => n.openEdge === 'left');
        const rightNiches = wallNiches.filter(n => n.openEdge === 'right');
        const centerNiches = wallNiches.filter(n => !n.openEdge || n.openEdge === 'none' || n.openEdge === 'both');

        shape.moveTo(-w/2, -h/2);
        shape.lineTo(w/2, -h/2);

        if (rightNiches.length > 0) {
            [...rightNiches].sort((a, b) => a.posY - b.posY).forEach(n => {
                shape.lineTo(w/2, -h/2 + n.posY);
                shape.lineTo(w/2 - n.w, -h/2 + n.posY);
                shape.lineTo(w/2 - n.w, -h/2 + n.posY + n.h);
                shape.lineTo(w/2, -h/2 + n.posY + n.h);
            });
        }
        shape.lineTo(w/2, h/2);
        shape.lineTo(-w/2, h/2);

        if (leftNiches.length > 0) {
            [...leftNiches].sort((a, b) => (b.posY + b.h) - (a.posY + a.h)).forEach(n => {
                shape.lineTo(-w/2, -h/2 + n.posY + n.h);
                shape.lineTo(-w/2 + n.w, -h/2 + n.posY + n.h);
                shape.lineTo(-w/2 + n.w, -h/2 + n.posY);
                shape.lineTo(-w/2, -h/2 + n.posY);
            });
        }
        shape.lineTo(-w/2, -h/2);

        centerNiches.forEach(n => {
            const nx = -w/2 + n.posX;
            const ny = -h/2 + n.posY;
            const holePath = new THREE.Path();
            holePath.moveTo(nx, ny);
            holePath.lineTo(nx + n.w, ny);
            holePath.lineTo(nx + n.w, ny + n.h);
            holePath.lineTo(nx, ny + n.h);
            holePath.lineTo(nx, ny);
            shape.holes.push(holePath);
        });

        const extrudeSettings = { depth: t, bevelEnabled: false };
        // ExtrudeGeometry r186 — API پایدار
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.translate(0, 0, -t/2); 
        if (isSideWall) geo.rotateY(Math.PI / 2);

        wallNiches.forEach(niche => {
            const nw = niche.w || 40;
            const nh = niche.h || 40;
            const nd = niche.d || 15;
            const nx = -w/2 + (niche.posX || 0);
            const ny = -h/2 + (niche.posY || 0);
            const openEdge = niche.openEdge || 'none';

            let extraLeft = 0;
            let extraRight = 0;
            if (!isSideWall) { 
                if (openEdge === 'left' || openEdge === 'both') extraLeft = 1.6;
                if (openEdge === 'right' || openEdge === 'both') extraRight = 1.6;
            }

            const drawnW = nw + extraLeft + extraRight;
            const drawnX = nx - extraLeft;

            const insideGeo = new THREE.BoxGeometry(drawnW - (boxEps * 2), nh - (boxEps * 2), nd);
            
            // 🔄 اصلاح شد: متریال داینامیک باکس داخلی نیچ در پیش‌نمایش کامپوننت
            const nicheMat = getDynamicMaterial(niche, '#ffffff');
            nicheMat.side = THREE.BackSide;
            const invisibleMat = new THREE.MeshBasicMaterial({ visible: false });

            let nicheZPos, frameZPos, openFaceIndex;
            const frameThick = 1.6; 
            const frameWidth = 3.2; 

            if (sideId === 'right' || sideId === 'front') {
                nicheZPos = (t / 2) - (nd / 2);
                openFaceIndex = 4;
                frameZPos = (t / 2) + (frameThick / 2) + zEps; 
            } else {
                nicheZPos = (-t / 2) + (nd / 2);
                openFaceIndex = 5;
                frameZPos = (-t / 2) - (frameThick / 2) - zEps; 
            }

            const materials = Array(6).fill(nicheMat);
            materials[openFaceIndex] = invisibleMat;
            if (openEdge === 'right' || openEdge === 'both') materials[0] = invisibleMat;
            if (openEdge === 'left' || openEdge === 'both') materials[1] = invisibleMat;

            const insideBox = new THREE.Mesh(insideGeo, materials);
            insideBox.position.set(drawnX + drawnW/2, ny + nh/2, nicheZPos);

            const insideGroup = new THREE.Group();
            insideGroup.add(insideBox);

            let topBotWidth = drawnW + (frameWidth * 2);
            let topBotX = drawnX + drawnW / 2;

            if (openEdge === 'left') {
                topBotWidth = drawnW + frameWidth;
                topBotX = drawnX + drawnW / 2 + frameWidth / 2;
            } else if (openEdge === 'right') {
                topBotWidth = drawnW + frameWidth;
                topBotX = drawnX + drawnW / 2 - frameWidth / 2;
            } else if (openEdge === 'both') {
                topBotWidth = drawnW;
                topBotX = drawnX + drawnW / 2;
            }

            // 🔄 اصلاح شد: متریال داینامیک فریم نیچ در پیش‌نمایش کامپوننت
            const frameMat = getDynamicMaterial(niche, '#ffffff');
            
            [ny + nh + frameWidth/2, ny - frameWidth/2].forEach(yPos => {
                const fGeo = new THREE.BoxGeometry(topBotWidth, frameWidth, frameThick);
                const fMesh = new THREE.Mesh(fGeo, frameMat);
                fMesh.position.set(topBotX, yPos, frameZPos);
                insideGroup.add(fMesh);
            });

            if (openEdge !== 'left' && openEdge !== 'both') {
                const lGeo = new THREE.BoxGeometry(frameWidth, nh, frameThick);
                const lMesh = new THREE.Mesh(lGeo, frameMat);
                lMesh.position.set(drawnX - frameWidth/2, ny + nh/2, frameZPos);
                insideGroup.add(lMesh);
            }
            if (openEdge !== 'right' && openEdge !== 'both') {
                const rGeo = new THREE.BoxGeometry(frameWidth, nh, frameThick);
                const rMesh = new THREE.Mesh(rGeo, frameMat);
                rMesh.position.set(drawnX + drawnW + frameWidth/2, ny + nh/2, frameZPos);
                insideGroup.add(rMesh);
            }

            if (isSideWall) insideGroup.rotation.y = Math.PI / 2;
            wallMesh.add(insideGroup);
        });

        return geo;
    }

    const sides = [
        { name: 'left', isSide: true },
        { name: 'right', isSide: true },
        { name: 'back', isSide: false },
        { name: 'front', isSide: false }
    ];

    sides.forEach(s => {
        const sideData = data[s.name];
        if (sideData && sideData.active !== false && sideData.w > 0) {
            
            // 🔄 اصلاح شد: ساخت مِش با متریال هوشمند دیواره اصلی پیش‌نمایش
            const mainWallMat = getDynamicMaterial(sideData, '#FFFFFF');
            const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mainWallMat); 
            
            mesh.geometry = createWallWithNiches(sideData.w, sideData.h, sideData.t, sideData.niches, s.isSide, mesh, s.name);
            
            if (s.isSide) {
                const posX = s.name === 'left' ? (-boxW/2 + sideData.t/2) : (boxW/2 - sideData.t/2);
                mesh.position.set(posX, sideData.h/2, 0);
            } else {
                const posZ = s.name === 'back' ? (-boxD/2 + sideData.t/2) : (boxD/2 - sideData.t/2);
                mesh.position.set(0, sideData.h/2, posZ);
            }

            renderExtras(mesh, sideData, s.isSide ? 'side' : 'main');
            p.boxGroup.add(mesh);
        }
    });

    function renderExtras(mesh, d, type) {
        // ترمووال
        if (d.thermowall?.enabled) {
            const th = d.thermowall;
            
            // 🔄 اصلاح شد: دریافت متریال پویا برای ترمووال پیش‌نمایش کامپوننت
            const tMat = getDynamicMaterial(th, '#8b5a2b');
            
            for (let i = 0; i < th.count; i++) {
                const tGeo = type === 'side' ? new THREE.BoxGeometry(th.d, d.h, th.w) : new THREE.BoxGeometry(th.w, d.h, th.d);
                let off = th.count === 1 ? 0 : (-d.w/2 + th.w/2) + (i * ((d.w - th.w)/(th.count - 1)));
                if (d.posLeft) {
                    const m = new THREE.Mesh(tGeo, tMat);
                    type === 'side' ? m.position.set(-d.t/2 - th.d/2, 0, off) : m.position.set(off, 0, -d.t/2 - th.d/2);
                    mesh.add(m);
                }
                if (d.posRight) {
                    const m = new THREE.Mesh(tGeo, tMat);
                    type === 'side' ? m.position.set(d.t/2 + th.d/2, 0, off) : m.position.set(off, 0, d.t/2 + th.d/2);
                    mesh.add(m);
                }
            }
        }
        // شلف‌ها
        if (d.shelves?.enabled) {
            d.shelves.list.forEach(sh => {
                
                // 🔄 اصلاح شد: دریافت متریال هوشمند کاملاً منطبق بر ساختار شلف
                const sMat = getDynamicMaterial(sh, '#cbd5e1');
                
                const sGeo = type === 'side' ? new THREE.BoxGeometry(sh.w, sh.t, sh.d) : new THREE.BoxGeometry(sh.d, sh.t, sh.w);
                const py = -d.h/2 + sh.h + (sh.t/2);
                const sx = (-d.w/2) + (sh.d/2);
                if (d.posLeft) {
                    const m = new THREE.Mesh(sGeo, sMat);
                    type === 'side' ? m.position.set(-d.t/2 - sh.w/2, py, sx) : m.position.set(sx, py, -d.t/2 - sh.w/2);
                    mesh.add(m);
                }
                if (d.posRight) {
                    const m = new THREE.Mesh(sGeo, sMat);
                    type === 'side' ? m.position.set(d.t/2 + sh.w/2, py, sx) : m.position.set(sx, py, d.t/2 + sh.w/2);
                    mesh.add(m);
                }
            });
        }
    }
}



// =========================================================================
// 👇 کدهای اتصال هوشمند پنل باکس نما به مودال سراسری متریال‌ها 👇
// =========================================================================

/**
 * باز کردن مودال سراسری برای دیواره‌های اصلی باکس نما
 * @param {string} side - 'left', 'right', 'front', 'back'
 */
function openFacadeBoxMaterialModal(side) {
    try {
        // ۱. تعیین عنوان مناسب مودال بر اساس دیواره
        const titles = { 
            'left': 'دیواره چپ', 
            'right': 'دیواره راست', 
            'front': 'دیواره جلو (Front)', 
            'back': 'دیواره عقب (Back)' 
        };
        const modalTitle = `🎨 انتخاب طرح و رنگ ${titles[side]} باکس نما`;

        // ۲. خواندن نوع متریال انتخاب شده از سلکت باکس فرم (mdf, highGloss و...)
        const materialSelect = document.getElementById(`facade-box-${side}-material`);
        const category = materialSelect ? materialSelect.value : 'mdf';

        // ۳. باز کردن مودال سراسری و اعمال متریال در کالبک
        if (typeof window.openUniversalModal === 'function') {
            window.openUniversalModal(modalTitle, category, function(material) {
                
                // پیدا کردن اینپوت متنی مربوط به رنگ دیواره
                const inputField = document.getElementById(`facade-box-${side}-color`);
                if (inputField) {
                    inputField.value = material.name;

                    // ذخیره هوشمند (اولویت با تکسچر تصویری، در غیر این صورت کد رنگ ساده)
                    if (material.texture) {
                        inputField.setAttribute('data-texture', material.texture);
                        inputField.removeAttribute('data-color');
                    } else if (material.code) {
                        inputField.setAttribute('data-color', material.code);
                        inputField.removeAttribute('data-texture');
                    }
                }

                // بروزرسانی لایو مدل ۳ بعدی و آبجکت‌ها
                if (typeof updateFacadeBoxLive === 'function') {
                    updateFacadeBoxLive();
                }
            });
        } else {
            console.error("تابع سراسری openUniversalModal یافت نشد! از لود شدن درست materialModal.js مطمئن شوید.");
        }
    } catch (error) {
        console.error("خطا در باز کردن مودال متریال باکس نما:", error);
    }
}

/**
 * در صورت تغییر دسته‌بندی ورق (سلکت باکس)، انتخاب قبلی ریست می‌شود
 */
function updateFacadeBoxMaterials(side) {
    const inputField = document.getElementById(`facade-box-${side}-color`);
    if (inputField) {
        inputField.value = '';
        inputField.removeAttribute('data-color');
        inputField.removeAttribute('data-texture');
    }
    
    if (typeof updateFacadeBoxLive === 'function') {
        updateFacadeBoxLive();
    }
}







// ۷. تابع دکمه اعمال (فقط ویرایش و بروزرسانی شیء موجود در آرایه)
function applyFacadeBoxSettings() {
    const boxData = window.selectedFacadeBox;
    if (!boxData || !boxData.panels) {
        console.error("No valid facade box data found to apply.");
        return;
    }

    const p = boxData.panels;

    // ۱. استخراج ضخامت‌ها (اگر دیواره غیرفعال باشد، ضخامت آن ۰ است)
    const tLeft = p.left?.active !== false ? (p.left.t || 1.6) : 0;
    const tRight = p.right?.active !== false ? (p.right.t || 1.6) : 0;
    const tFront = p.front?.active !== false ? (p.front.t || 1.6) : 0;
    const tBack = p.back?.active !== false ? (p.back.t || 1.6) : 0;

    // ⭐⭐⭐ شروع بخش اصلاح شده اصلی ⭐⭐⭐

    // ۲. محاسبه عرض کل (Total Width)
    // عرض داخلی برابر است با بزرگترین عرض بین دیواره جلو و عقب
    const innerWidth = Math.max(
        p.front?.active !== false ? (p.front.w || 0) : 0,
        p.back?.active !== false ? (p.back.w || 0) : 0
    );
    // عرض کل = عرض داخلی + ضخامت دیواره‌های چپ و راست
    boxData.w = innerWidth + tLeft + tRight;

    // ۳. محاسبه عمق کل (Total Depth)
    // عمق داخلی برابر است با بزرگترین "عرض" بین دیواره‌های چپ و راست
    // (چون عرض این دیواره‌ها در راستای عمق باکس است)
    const innerDepth = Math.max(
        p.left?.active !== false ? (p.left.w || 0) : 0,
        p.right?.active !== false ? (p.right.w || 0) : 0
    );
    // عمق کل = عمق داخلی. ضخامت جلو و عقب جزئی از این عمق هستند و نباید اضافه شوند.
    // اما اگر دیواره کناری نداشتیم، عمق برابر با مجموع ضخامت جلو و عقب است.
    if (innerDepth > 0) {
        boxData.d = innerDepth;
    } else {
        boxData.d = tFront + tBack;
    }


    // ۴. محاسبه ارتفاع کل (بدون تغییر - منطق شما صحیح بود)
    let maxH = 0;
    Object.values(p).forEach(panel => {
        if (panel && panel.active !== false && (panel.h || 0) > maxH) {
            maxH = panel.h;
        }
    });
    boxData.h = maxH;
    
    // ⭐⭐⭐ پایان بخش اصلاح شده اصلی ⭐⭐⭐


    // مقادیر ایمن برای جلوگیری از ابعاد صفر و کرش کردن برنامه
    if (!boxData.w || boxData.w <= 0) boxData.w = 10;
    if (!boxData.d || boxData.d <= 0) boxData.d = 10;
    if (!boxData.h || boxData.h <= 0) boxData.h = 10;

    // پیدا کردن کابینت در آرایه اصلی و جایگزینی آن
    const targetArray = window.cabinets || cabinets;
    if (targetArray) {
        const cabinetIndex = targetArray.findIndex(c => c.id === boxData.id);
        if (cabinetIndex > -1) {
            // آپدیت کامل آبجکت در آرایه اصلی
            targetArray[cabinetIndex] = { ...targetArray[cabinetIndex], ...boxData };
        } else {
            console.error("Facade box ID not found in the main cabinets array!");
        }
    } else {
        console.error("Main cabinets array is not accessible.");
        return;
    }

    // بستن پنل
    const panel = document.getElementById('facade-box-editor-panel');
    if (panel) {
        panel.style.display = 'none';
        panel.classList.remove('active');
    }

    // رفرش کردن نماها
    if (typeof draw === 'function') {
        draw();
    } else if (typeof drawCabinets === 'function' && targetArray) {
        // فرض می‌کنیم drawCabinets به کل آرایه نیاز دارد
        const canvas = document.getElementById('floorplan');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawCabinets(targetArray);
    }

    if (window.refresh3D) {
        window.refresh3D(); // فراخوانی تابع سراسری برای رفرش سه بعدی
    }
}



// ۸. بستن پنل بدون ذخیره (Discard)
function closeFacadeBoxPanel() {
    const panel = document.getElementById('facade-box-editor-panel');
    if (panel) {
        panel.classList.remove('active');
        panel.style.display = 'none';
    }
    // پاک کردن متغیر موقت
    window.selectedFacadeBox = null;
}


// ==========================================
// توابع جدید مدیریت لیست طبقات
// ==========================================

function addFacadeShelfToList(side) {
    if (!window.selectedFacadeBox) return;
    
    const w = parseFloat(document.getElementById(`facade-box-${side}-shelf-w`).value) || 20; 
    const d = parseFloat(document.getElementById(`facade-box-${side}-shelf-d`).value) || 30; 
    const t = parseFloat(document.getElementById(`facade-box-${side}-shelf-t`).value) || 1.6; 
    const h = parseFloat(document.getElementById(`facade-box-${side}-shelf-h`).value) || 100; 
    
    const colorElement = document.getElementById(`facade-box-${side}-shelf-color`);
    
    // 🔄 اصلاح شد: استخراج دقیق و هوشمند ساختار تکسچر و رنگ برای آبجکت شلف جدید
    let shelfColor = '#cbd5e1';
    let shelfTexture = null;
    let shelfColorName = '';

    if (colorElement) {
        shelfColorName = colorElement.value || '';
        const shTxtAttr = colorElement.getAttribute('data-texture');
        const shColAttr = colorElement.getAttribute('data-color');

        if (shTxtAttr && shTxtAttr !== "null" && shTxtAttr !== "") {
            shelfTexture = shTxtAttr;
            shelfColor = null;
        } else {
            shelfColor = shColAttr || '#cbd5e1';
            shelfTexture = null;
        }
    }

    // اضافه کردن تمام خصیصه‌های متریال به آبجکت جدید شلف
    const newShelf = { 
        w, d, t, h, 
        color: shelfColor, 
        texture: shelfTexture, 
        colorName: shelfColorName 
    };
    
    if (!window.selectedFacadeBox.panels[side].shelves) {
        window.selectedFacadeBox.panels[side].shelves = { enabled: true, list: [], materialType: 'mdf', color: '#cbd5e1' };
    }
    
    window.selectedFacadeBox.panels[side].shelves.list.push(newShelf);
    window.selectedFacadeShelfIndex[side] = window.selectedFacadeBox.panels[side].shelves.list.length - 1; 
    
    renderShelvesList(side);
    updateFacadeBoxLive();
}



function renderShelvesList(side) {
    const listContainer = document.getElementById(`facade-box-${side}-shelves-list`);
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    const shelves = window.selectedFacadeBox?.panels[side]?.shelves?.list || [];
    
    shelves.forEach((shelf, index) => {
        const isSelected = window.selectedFacadeShelfIndex[side] === index;
        const bg = isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 41, 59, 0.6)';
        const border = isSelected ? '1px solid #3b82f6' : '1px solid #475569';
        
        const itemDiv = document.createElement('div');
        // کل ردیف قابل کلیک است و دکمه ضربدر حذف شده
        itemDiv.style.cssText = `display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:${bg}; border:${border}; border-radius:6px; cursor:pointer; margin-bottom:5px;`;
        
        itemDiv.innerHTML = `
            <div style="font-size:11px; color:#cbd5e1; flex:1;" onclick="selectFacadeShelf('${side}', ${index})">
                طبقه ${index + 1} - عرض: ${shelf.w} | طول: ${shelf.d} | ارتفاع: ${shelf.h}
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });
}


function selectFacadeShelf(side, index) {
    window.selectedFacadeShelfIndex[side] = index;
    renderShelvesList(side);
    
    const shelf = window.selectedFacadeBox.panels[side].shelves.list[index];
    if (shelf) {
        document.getElementById(`facade-box-${side}-shelf-w`).value = shelf.w;
        document.getElementById(`facade-box-${side}-shelf-d`).value = shelf.d;
        document.getElementById(`facade-box-${side}-shelf-t`).value = shelf.t;
        document.getElementById(`facade-box-${side}-shelf-h`).value = shelf.h;
    }
}

function deleteSelectedFacadeShelf(side) {
    const idx = window.selectedFacadeShelfIndex[side];
    if (idx > -1) {
        window.selectedFacadeBox.panels[side].shelves.list.splice(idx, 1);
        window.selectedFacadeShelfIndex[side] = -1; 
        document.getElementById(`facade-box-${side}-shelf-w`).value = '';
        document.getElementById(`facade-box-${side}-shelf-d`).value = '';
        document.getElementById(`facade-box-${side}-shelf-h`).value = '';
        renderShelvesList(side);
        updateFacadeBoxLive();
    }
}

function clearFacadeShelves(side) {
    if (confirm("آیا از حذف تمام طبقات این دیوار مطمئن هستید؟")) {
        window.selectedFacadeBox.panels[side].shelves.list = [];
        window.selectedFacadeShelfIndex[side] = -1;
        renderShelvesList(side);
        updateFacadeBoxLive();
    }
}

// متغیر برای نگهداری ایندکس باکس توکار انتخاب شده برای هر دیواره


// تابع افزودن باکس توکار به لیست
function addFacadeNicheToList(side) {
    if (!window.selectedFacadeBox) return;

    // خواندن مقادیر خام از فرم
    const w = parseFloat(document.getElementById(`facade-box-${side}-niche-w`).value) || 40;
    const h = parseFloat(document.getElementById(`facade-box-${side}-niche-h`).value) || 40;
    const d = parseFloat(document.getElementById(`facade-box-${side}-niche-d`).value) || 15;
    const posY = parseFloat(document.getElementById(`facade-box-${side}-niche-posy`).value) || 100;
    let posX = parseFloat(document.getElementById(`facade-box-${side}-niche-posx`).value) || 0;
    
    const wallWidth = parseFloat(document.getElementById(`facade-box-${side}-w`).value) || 0;
    const edgeSelector = document.querySelector(`input[name="facade-box-${side}-niche-edge"]:checked`);
    const openEdge = edgeSelector ? edgeSelector.value : 'none';

    // محاسبه posX بر اساس حالت چسبیده بودن
    if (openEdge === 'left') {
        posX = 0;
    } else if (openEdge === 'right') {
        posX = Math.max(0, wallWidth - w);
    }

    const colorInput = document.getElementById(`facade-box-${side}-niche-color`);
    const color = (colorInput && colorInput.getAttribute('data-color')) ? colorInput.getAttribute('data-color') : '#ffffff';

    const newNiche = {
        w, h, d, posY, posX, color,
        openEdge: openEdge // ذخیره وضعیت برای 3D
    };

    if (!window.selectedFacadeBox.panels[side].niches) {
        window.selectedFacadeBox.panels[side].niches = { enabled: true, list: [] };
    }
    
    window.selectedFacadeBox.panels[side].niches.list.push(newNiche);
    
    document.getElementById(`facade-box-${side}-niche-enabled`).checked = true;
    window.selectedFacadeBox.panels[side].niches.enabled = true;

    renderFacadeNichesList(side);
    updateFacadeBoxLive();
}


// تابع رندر کردن لیست باکس‌های توکار در HTML
function renderFacadeNichesList(side) {
    const listContainer = document.getElementById(`facade-box-${side}-niches-list`);
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const panel = window.selectedFacadeBox.panels[side];
    if (!panel.niches || !panel.niches.list) return;

    panel.niches.list.forEach((niche, index) => {
        const isSelected = index === selectedFacadeNicheIndex[side];
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
            background: ${isSelected ? 'rgba(139, 92, 246, 0.3)' : 'rgba(30, 41, 59, 0.6)'};
            border: 1px solid ${isSelected ? '#8b5cf6' : '#475569'};
            padding: 8px; border-radius: 6px; font-size: 11px; color: #cbd5e1;
            cursor: pointer; transition: all 0.2s;
            display: flex; justify-content: space-between; align-items: center;
        `;
        
        itemDiv.innerHTML = `
            <span>باکس ${index + 1}: ابعاد ${niche.w}x${niche.h} | موقعیت: ${niche.openEdge || 'none'}</span>
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${niche.color}; border: 1px solid #fff;"></div>
        `;

        itemDiv.onclick = () => {
            if (selectedFacadeNicheIndex[side] === index) {
                selectedFacadeNicheIndex[side] = -1;
                // clearFacadeNicheInputs(side); // اگر چنین تابعی دارید، آن را نگه دارید
                
                // ریست کردن رادیو باتن به حالت پیش‌فرض (آزاد)
                const defaultRadio = document.querySelector(`input[name="facade-box-${side}-niche-edge"][value="none"]`);
                if (defaultRadio) defaultRadio.checked = true;
                
            } else {
                selectedFacadeNicheIndex[side] = index;
                document.getElementById(`facade-box-${side}-niche-w`).value = niche.w;
                document.getElementById(`facade-box-${side}-niche-h`).value = niche.h;
                document.getElementById(`facade-box-${side}-niche-d`).value = niche.d;
                document.getElementById(`facade-box-${side}-niche-posy`).value = niche.posY;
                document.getElementById(`facade-box-${side}-niche-posx`).value = niche.posX;

                // ⭐ تنظیم کردن دکمه رادیویی بر اساس داده ذخیره شده ⭐
                const openEdgeValue = niche.openEdge || 'none';
                const radioToSelect = document.querySelector(`input[name="facade-box-${side}-niche-edge"][value="${openEdgeValue}"]`);
                if (radioToSelect) radioToSelect.checked = true;
            }
            renderFacadeNichesList(side);
            updateFacadeBoxLive(); // فراخوانی برای اعمال وضعیت disable/enable
        };

        listContainer.appendChild(itemDiv);
    });
}


// تابع پاک کردن اینپوت‌های باکس توکار
function clearFacadeNicheInputs(side) {
    document.getElementById(`facade-box-${side}-niche-w`).value = '';
    document.getElementById(`facade-box-${side}-niche-h`).value = '';
    document.getElementById(`facade-box-${side}-niche-d`).value = '';
    document.getElementById(`facade-box-${side}-niche-posy`).value = '';
    document.getElementById(`facade-box-${side}-niche-posx`).value = '';
}

// تابع حذف باکس انتخاب شده
function deleteSelectedFacadeNiche(side) {
    if (!window.selectedFacadeBox) return;
    const sIdx = selectedFacadeNicheIndex[side];
    if (sIdx > -1) {
        window.selectedFacadeBox.panels[side].niches.list.splice(sIdx, 1);
        selectedFacadeNicheIndex[side] = -1;
        clearFacadeNicheInputs(side);
        renderFacadeNichesList(side);
        updateFacadeBoxLive();
    } else {
        alert("لطفاً ابتدا یک باکس توکار را از لیست انتخاب کنید.");
    }
}

