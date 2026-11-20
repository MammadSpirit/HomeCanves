
function refreshBabylonCountertops() {
    try {
        if (window.KitchenBabylon && window.KitchenBabylon.isReady) {
            if (typeof window.KitchenBabylon._renderAllCountertops === 'function') {
                window.KitchenBabylon._renderAllCountertops();
            } else if (typeof window.KitchenBabylon.refreshCabinets === 'function') {
                window.KitchenBabylon.refreshCabinets();
            }
        }
    } catch (e) {}
}
// js/components/countertop-editor.js
// نسخه مستقل از انتخاب کابینت + ذخیره تنظیمات کلی

// در ابتدای فایل جایگزین خطوط ۵ تا ۱۷ کنید
let allCountertops = [
    { id: Date.now(), enabled: false, thickness: 3.2, length: 180, width: 60, height: 90, x: 0, y: 0, color: "#ffffff", gas: null, sink: null, rotation: 0, edgeBevel: true, edgeRadius: 0.38 }
];
let sinkRotation = 0; // 0, 90, 180, 270
let gasRotation = 0;
let selectedCountertopIndex = 0; 
let kitchenCountertopSettings = allCountertops[0]; // این خط را اضافه کنید تا خطا برطرف شود
let currentCabinetForCountertop = null;
let editingCountertop = { ...allCountertops[0] }; // آپدیت این خط

// باز کردن پنل
function openCountertopEditorPanel() {
    // ۱. پیدا کردن کابینت انتخاب‌شده (اختیاری)
    currentCabinetForCountertop = (selectedId !== -1) 
        ? cabinets.find(c => c.id === selectedId) 
        : null;

    // ۲. عنوان پنل
    const idDisplay = document.getElementById("countertop-panel-cabinet-id");
    if (idDisplay) {
        if (currentCabinetForCountertop) {
            idDisplay.textContent = selectedId;
            idDisplay.parentElement.style.display = "block";
        } else {
            idDisplay.textContent = "تنظیمات کلی صفحه";
        }
    }

    // ۳. بارگذاری تنظیمات (اولویت با کابینت، در غیر این صورت از لیست صفحات)
    // نکته: اینجا دیگر از kitchenCountertopSettings استفاده نمی‌کنیم
    let source = currentCabinetForCountertop?.countertop || allCountertops[selectedCountertopIndex];
    editingCountertop = { ...source };

    // ۴. فعال‌سازی
    document.getElementById("countertop-enabled").checked = editingCountertop.enabled !== false;

    // ۵. ضخامت
    const thickness = editingCountertop.thickness || 3.2;
    if ([1.6, 3.2, 4.8].includes(thickness)) {
        const radio = document.querySelector(`input[name="countertop-thickness"][value="${thickness}"]`);
        if(radio) radio.checked = true;
        document.getElementById("custom-thickness-wrapper").style.display = "none";
    } else {
        const customRadio = document.querySelector(`input[name="countertop-thickness"][value="custom"]`);
        if(customRadio) customRadio.checked = true;
        document.getElementById("custom-thickness-wrapper").style.display = "block";
        document.getElementById("custom-thickness").value = thickness;
    }

    // ۶. ابعاد و موقعیت (X و Y اضافه شدند)
    document.getElementById("countertop-length").value = editingCountertop.length || 180;
    document.getElementById("countertop-width").value  = editingCountertop.width  || 60;
    if(document.getElementById("countertop-pos-x")) document.getElementById("countertop-pos-x").value = editingCountertop.x || 0;
    if(document.getElementById("countertop-pos-y")) document.getElementById("countertop-pos-y").value = editingCountertop.y || 0;

    // ۷. رنگ
    const colorName = getColorNameByValue?.(editingCountertop.color) || "سفید";
    document.getElementById("countertop-color-search").value = colorName;

    // ۷ب. پرداخت سطح
    const finishEl = document.getElementById("countertop-panel-finish");
    if (finishEl) finishEl.value = editingCountertop.finish || 'matte';
    const matTypeEl = document.getElementById("countertop-panel-material-type");
    if (matTypeEl && editingCountertop.materialType) matTypeEl.value = editingCountertop.materialType;

    // ۸. ارتفاع
    document.getElementById("countertop-height").value = editingCountertop.height || 90;

    // ۹. گاز و سینک
    const gas = editingCountertop.gas || { enabled: false };
    const sink = editingCountertop.sink || { enabled: false };

    document.getElementById("gas-enabled").checked = gas.enabled;
    document.getElementById("sink-enabled").checked = sink.enabled;

    if (gas.enabled) {
        document.getElementById("gas-x").value     = gas.x     || 60;
        document.getElementById("gas-y").value     = gas.y     || 30;
        document.getElementById("gas-width").value = gas.width || 60;
        document.getElementById("gas-depth").value = gas.depth || 50;
                document.getElementById("gas-material-type").value = gas.materialType || "steel";
        document.getElementById("gas-burner-type").value = gas.burnerType || 5;

    }

    if (sink.enabled) {
        document.getElementById("sink-x").value     = sink.x     || 80;
        document.getElementById("sink-y").value     = sink.y     || 30;
        document.getElementById("sink-width").value = sink.width || 80;
        document.getElementById("sink-depth").value = sink.depth || 50;
                document.getElementById("sink-material-type").value = sink.materialType || "steel";
        document.getElementById("sink-model-type").value = sink.modelType || "double-tray";
        document.getElementById("sink-direction").value = sink.direction || "right";

    }

    // ۱۰. بروزرسانی رابط کاربری
    toggleGasSinkFields();
    updateCountertopPositionDisplay();
    
    // ۱۱. نمایش لیست و باز کردن پنل
    renderCountertopList();
    loadCountertopToEditor(); // این تابع فیلدها را با صفحه انتخاب شده همگام می‌کند

    document.getElementById("countertop-editor-panel").classList.add("active");
}


function closeCountertopEditorPanel() {
    document.getElementById("countertop-editor-panel").classList.remove("active");
    currentCabinetForCountertop = null;
}


// نمایش/مخفی گاز و سینک
function toggleGasSinkFields() {
    document.getElementById("gas-position-wrapper").style.display = 
        document.getElementById("gas-enabled").checked ? "block" : "none";
    document.getElementById("sink-position-wrapper").style.display = 
        document.getElementById("sink-enabled").checked ? "block" : "none";
}

// بروزرسانی موقعیت نمایش
function updateCountertopPositionDisplay() {
    const length = document.getElementById("countertop-length").value || 180;
    const width  = document.getElementById("countertop-width").value  || 60;
    const height = document.getElementById("countertop-height").value || 90;

    document.getElementById("countertop-pos-length").textContent = length;
    document.getElementById("countertop-pos-width").textContent  = width;
    document.getElementById("countertop-pos-height").textContent = height;
}

// پیش‌نمایش canvas
// پیش‌نمایش نقشه آشپزخانه (بدون کابینت) در پنل صفحه کابینت
function updateCountertopPreview() {
    const canvas = document.getElementById("countertop-preview-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (typeof room === 'undefined' || !room || !room.w) return;

    const padding = 40;
    const scale = Math.min((canvas.width - padding) / room.w, (canvas.height - padding) / room.d);
    const offsetX = (canvas.width - room.w * scale) / 2;
    const offsetY = (canvas.height - room.d * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // ۱. رسم کف اتاق
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, room.w, room.d);

    // --- بخش جدید: رسم دیوارها بر اساس تنظیمات پانل اصلی ---
    const wallThick = 15; 
    ctx.fillStyle = "#495057"; // رنگ دیوارها هماهنگ با طراحی اصلی

    const hasTop = document.getElementById("wall-top")?.checked;
    const hasLeft = document.getElementById("wall-left")?.checked;
    const hasBottom = document.getElementById("wall-bottom")?.checked;
    const hasRight = document.getElementById("wall-right")?.checked;

    if (hasTop) ctx.fillRect(-wallThick, -wallThick, room.w + wallThick * 2, wallThick);
    if (hasBottom) ctx.fillRect(-wallThick, room.d, room.w + wallThick * 2, wallThick);
    if (hasLeft) ctx.fillRect(-wallThick, 0, wallThick, room.d);
    if (hasRight) ctx.fillRect(room.w, 0, wallThick, room.d);
    // -------------------------------------------------------

    allCountertops.forEach((ct, index) => {
        let x, y, len, wid, isEnabled, hasGas, gasData, hasSink, sinkData;

        if (index === selectedCountertopIndex) {
            isEnabled = document.getElementById("countertop-enabled").checked;
            x = parseFloat(document.getElementById("countertop-pos-x").value) || 0;
            y = parseFloat(document.getElementById("countertop-pos-y").value) || 0;
            len = parseFloat(document.getElementById("countertop-length").value) || 0;
            wid = parseFloat(document.getElementById("countertop-width").value) || 0;
            
                        hasGas = document.getElementById("gas-enabled").checked;
            gasData = {
                x: parseFloat(document.getElementById("gas-x").value) || 0,
                y: parseFloat(document.getElementById("gas-y").value) || 0,
                w: parseFloat(document.getElementById("gas-width").value) || 60,
                d: parseFloat(document.getElementById("gas-depth").value) || 50,
                materialType: document.getElementById("gas-material-type")?.value || "steel",
                burnerType: parseInt(document.getElementById("gas-burner-type")?.value) || 5
            };


            hasSink = document.getElementById("sink-enabled").checked;
                        sinkData = {
                x: parseFloat(document.getElementById("sink-x").value) || 0,
                y: parseFloat(document.getElementById("sink-y").value) || 0,
                w: parseFloat(document.getElementById("sink-width").value) || 80,
                d: parseFloat(document.getElementById("sink-depth").value) || 50,
                materialType: document.getElementById("sink-material-type")?.value || "steel",
                modelType: document.getElementById("sink-model-type")?.value || "double-tray",
                direction: document.getElementById("sink-direction")?.value || "right"
            };


            ctx.fillStyle = "rgba(59, 130, 246, 0.7)"; 
            ctx.strokeStyle = "#2563eb";
        } else {
            if (!ct.enabled) return;
            isEnabled = true;
            x = ct.x || 0; y = ct.y || 0;
            len = ct.length || 0; wid = ct.width || 0;
            hasGas = ct.gas && ct.gas.enabled;
            gasData = ct.gas;
            hasSink = ct.sink && ct.sink.enabled;
            sinkData = ct.sink;

            ctx.fillStyle = "rgba(148, 163, 184, 0.4)"; 
            ctx.strokeStyle = "#475569";
        }

        if (isEnabled) {
            ctx.lineWidth = 2 / scale;
            
            // رسم خودِ صفحه
            ctx.fillRect(x, y, len, wid);
            ctx.strokeRect(x, y, len, wid);

            // ۳. رسم گاز در پیش‌نمایش
            // ۳. رسم گاز در پیش‌نمایش (با چرخش)
if (hasGas && gasData) {

    ctx.save();

    const centerX = x + gasData.x + gasData.w / 2;
    const centerY = y + gasData.y + gasData.d / 2;

    // انتقال به مرکز
    ctx.translate(centerX, centerY);

    // چرخش مثل 3D (معکوس)
    ctx.rotate((-gasRotation * Math.PI) / 180);

    // برگشت به گوشه
    ctx.translate(-gasData.w / 2, -gasData.d / 2);
    const bCount = gasData.burnerType || 5;
    const gMatType = gasData.materialType || "steel";

    // بدنه گاز (تیره برای شیشه، روشن برای استیل)
    ctx.fillStyle = gMatType === "glass" ? "#1a1a1a" : "#94a3b8"; 
    ctx.fillRect(0, 0, gasData.w, gasData.d);

    // شعله‌ها (اصلی)
    ctx.fillStyle = gMatType === "glass" ? "#f1f5f9" : "#111111"; // رنگ شعله‌ها متضاد بدنه

    let burnerPoints = [];
    if (bCount === 2) {
        burnerPoints = [{px: 0.3, py: 0.5}, {px: 0.7, py: 0.5}];
    } else if (bCount === 3) {
        burnerPoints = [{px: 0.2, py: 0.5}, {px: 0.5, py: 0.5}, {px: 0.8, py: 0.5}];
    } else if (bCount === 4) {
        burnerPoints = [{px: 0.25, py: 0.3}, {px: 0.75, py: 0.3}, {px: 0.25, py: 0.7}, {px: 0.75, py: 0.7}];
    } else { // 5 شعله
        burnerPoints = [
            {px: 0.25, py: 0.25}, {px: 0.75, py: 0.25},
            {px: 0.5, py: 0.5},
            {px: 0.25, py: 0.75}, {px: 0.75, py: 0.75}
        ];
    }

    burnerPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(
            p.px * gasData.w,
            p.py * gasData.d,
            4 / scale, // کمی بزرگتر برای وضوح بهتر
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // 🔥 نشانگر جلو بودن گاز (ولوم‌ها)
    ctx.fillStyle = "#ef4444"; // قرمز برای وضوح

    const knobCount = bCount; // تعداد ولوم برابر تعداد شعله
    const spacing = gasData.w / (knobCount + 1);

    for (let i = 1; i <= knobCount; i++) {
        ctx.beginPath();
        ctx.arc(
            spacing * i,
            gasData.d - 6,   // نزدیک لبه جلو
            3 / scale,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }


    ctx.restore();
}

            // ۴. رسم سینک در پیش‌نمایش
            if (hasSink && sinkData) {
    ctx.save();

    const centerX = x + sinkData.x + sinkData.w / 2;
    const centerY = y + sinkData.y + sinkData.d / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((sinkRotation * Math.PI) / 180);
    ctx.translate(-sinkData.w / 2, -sinkData.d / 2);
    // تعیین رنگ بر اساس جنس
    let bodyColor = "#cbd5e1", basinColor = "#ffffff";
    if (sinkData.materialType === "black") { bodyColor = "#334155"; basinColor = "#1e293b"; }
    else if (sinkData.materialType === "white") { bodyColor = "#f1f5f9"; basinColor = "#e2e8f0"; }
    
    // بدنه سینک
    ctx.fillStyle = bodyColor;
    ctx.fillRect(0, 0, sinkData.w, sinkData.d);

    // محاسبه ابعاد لگن‌ها و سینی در 2D
    ctx.fillStyle = basinColor;
    const isDouble = (sinkData.modelType || "double-tray").includes("double");
    const hasTray = (sinkData.modelType || "double-tray").includes("tray");
    
    let basinStartX = 5;
    let basinAreaW = sinkData.w - 10;
    
    if (hasTray) {
        basinAreaW = (sinkData.w / 2) - 10;
        basinStartX = (sinkData.direction || "right") === "right" ? (sinkData.w / 2) + 5 : 5;
    }

    // رسم لگن(ها)
    if (isDouble) {
        const singleBasinW = (basinAreaW - 5) / 2;
        ctx.fillRect(basinStartX, 5, singleBasinW, sinkData.d - 10);
        ctx.fillRect(basinStartX + singleBasinW + 5, 5, singleBasinW, sinkData.d - 10);
    } else {
        ctx.fillRect(basinStartX, 5, basinAreaW, sinkData.d - 10);
    }

    // شیر آب (همیشه روی ضلع بالا بعد از چرخش)
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(sinkData.w / 2, 4, 3 / scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
        }
    });

    ctx.restore();
}




function rotateCountertop() {
    const lenInput = document.getElementById("countertop-length");
    const widInput = document.getElementById("countertop-width");
    
    // جابجایی طول و عرض
    const temp = lenInput.value;
    lenInput.value = widInput.value;
    widInput.value = temp;

    // مهم: آپدیت کردن پیش‌نمایش و متن‌های زیرین
    updateCountertopPositionDisplay();
    updateCountertopPreview();

    // یک افکت کوچک برای دکمه (اختیاری)
    const btn = event?.currentTarget;
    if (btn) {
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);
    }
}

function rotateSinkOnly() {
    sinkRotation = (sinkRotation + 90) % 360;
    const currentCT = allCountertops[selectedCountertopIndex];
    if (currentCT && currentCT.sink) {
        currentCT.sink.rotation = sinkRotation; // 👈 اعمال آنی روی آبجکت
    }
    updateCountertopPreview();
    if (typeof updateAllCountertopsIn3D === 'function') updateAllCountertopsIn3D();
    if (typeof refreshBabylonCountertops === 'function') refreshBabylonCountertops();
}

function rotateGasOnly() {
    gasRotation = (gasRotation + 90) % 360;
    const currentCT = allCountertops[selectedCountertopIndex];
    if (currentCT && currentCT.gas) {
        currentCT.gas.rotation = gasRotation; // 👈 اعمال آنی روی آبجکت
    }
    updateCountertopPreview();
    if (typeof updateAllCountertopsIn3D === 'function') updateAllCountertopsIn3D();
    if (typeof refreshBabylonCountertops === 'function') refreshBabylonCountertops();
}

function applyCustomCountertopAngle(value) {
    const currentCT = allCountertops[selectedCountertopIndex];
    if (!currentCT) return;

    let angle = parseFloat(value);
    if (!isNaN(angle)) {
        currentCT.rotation = angle; // ذخیره زاویه در تنظیمات صفحه
        
        // آپدیت کردن پیش‌نمایش در پنل
        updateCountertopPreview();
        
        // آپدیت نمای ۲ بعدی اصلی
        if (typeof draw === 'function') draw();
        
        // آپدیت نمای ۳ بعدی
        if (typeof updateAllCountertopsIn3D === 'function') {
            updateAllCountertopsIn3D();
        }
        if (typeof refreshBabylonCountertops === 'function') refreshBabylonCountertops();
    }
}
// حتماً تابع را به Window بشناسان
window.rotateSinkOnly = rotateSinkOnly;

// اعمال تغییرات
function applyCountertopSettings() {
    // پیدا کردن صفحه در حال ویرایش از لیست
    const currentCT = allCountertops[selectedCountertopIndex];
    if (!currentCT) return;

    // ۱. دریافت ضخامت
    const thicknessRadio = document.querySelector('input[name="countertop-thickness"]:checked');
    const thickness = thicknessRadio.value === "custom" 
        ? parseFloat(document.getElementById("custom-thickness").value) || 3.2
        : parseFloat(thicknessRadio.value);

    // ۲. دریافت رنگ (🌟 اصلاح شد: استفاده از مقدار ذخیره شده قبلی بجای تبدیل مجدد نام فارسی)
    // اگر به هر دلیلی خالی بود، رنگ اینپوت یا پیش‌فرض را قرار می‌دهد
    const colorValue = currentCT.color || "#ffffff"; 

    // ۳. آپدیت کردن مقادیر در آرایه اصلی
    currentCT.enabled = document.getElementById("countertop-enabled").checked;
    currentCT.thickness = thickness;
    // گردی لبه جلو/عقب — همان فرمول Extrude bevel در پنل / Three
    currentCT.edgeBevel = true;
    currentCT.edgeRadius = Math.min(0.45, Math.max(0.28, thickness * 0.12));
    currentCT.edgeBevelThickness = Math.min(0.4, Math.max(0.25, thickness * 0.1));
    currentCT.length = parseFloat(document.getElementById("countertop-length").value) || 180;
    currentCT.width = parseFloat(document.getElementById("countertop-width").value) || 60;
    currentCT.height = parseFloat(document.getElementById("countertop-height").value) || 90;
    currentCT.x = parseFloat(document.getElementById("countertop-pos-x").value) || 0;
    currentCT.y = parseFloat(document.getElementById("countertop-pos-y").value) || 0;
    currentCT.color = colorValue; // اعمال کد رنگ یا تکسچر واقعی
    // پرداخت سطح (نور) — جدا از جنس ورق
    const finishEl = document.getElementById("countertop-panel-finish");
    if (finishEl) currentCT.finish = finishEl.value || 'matte';
    const matTypeEl = document.getElementById("countertop-panel-material-type");
    if (matTypeEl) currentCT.materialType = matTypeEl.value;

    // ۴. آپدیت گاز و سینک
    currentCT.gas = document.getElementById("gas-enabled").checked ? {
        enabled: true,
        x: parseFloat(document.getElementById("gas-x").value) || 0,
        y: parseFloat(document.getElementById("gas-y").value) || 0,
        width: parseFloat(document.getElementById("gas-width").value) || 60,
        depth: parseFloat(document.getElementById("gas-depth").value) || 50,
        materialType: document.getElementById("gas-material-type").value,
        burnerType: parseInt(document.getElementById("gas-burner-type").value) || 5,
        rotation: gasRotation
    } : null;

    currentCT.sink = document.getElementById("sink-enabled").checked ? {
        enabled: true,
        x: parseFloat(document.getElementById("sink-x").value) || 0,
        y: parseFloat(document.getElementById("sink-y").value) || 0,
        width: parseFloat(document.getElementById("sink-width").value) || 80,
        depth: parseFloat(document.getElementById("sink-depth").value) || 50,
        materialType: document.getElementById("sink-material-type").value,
        modelType: document.getElementById("sink-model-type").value,
        direction: document.getElementById("sink-direction").value,
        rotation: sinkRotation
    } : null;

    // ۵. ذخیره در تنظیمات کلی
    kitchenCountertopSettings = { ...currentCT };

    // ۶. آپدیت نمای ۲ بعدی
    if (typeof draw === 'function') draw();

    // آپدیت نمای ۳ بعدی
    if (typeof updateAllCountertopsIn3D === 'function') {
        updateAllCountertopsIn3D();
    }

    if (typeof refreshBabylonCountertops === 'function') refreshBabylonCountertops();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.renderCabinets) {
        if (Kitchen3D.scene) {
            Kitchen3D.renderCabinets(); 
        }
    }

    // ۷. بستن پنل و رندر مجدد لیست
    renderCountertopList();
    closeCountertopEditorPanel();
}



// ۱. تابع رندر کردن لیست در پنل
function renderCountertopList() {
    const container = document.getElementById("countertop-list-container");
    if (!container) return;
    
    container.innerHTML = "";
    allCountertops.forEach((ct, index) => {
        const item = document.createElement("div");
        item.className = `countertop-list-item ${index === selectedCountertopIndex ? 'active' : ''}`;
        item.style = `padding:8px 12px; background:${index === selectedCountertopIndex ? '#3b82f6' : '#334155'}; border-radius:8px; margin-bottom:5px; cursor:pointer; display:flex; justify-content:space-between;`;
        item.innerHTML = `<span>صفحه ${index + 1}</span> <small>${ct.length}cm</small>`;
        
        item.onclick = () => {
            selectedCountertopIndex = index;
            loadCountertopToEditor();
            renderCountertopList();
        };
        container.appendChild(item);
    });
}

// ۲. تابع اضافه کردن صفحه جدید (متصل به دکمه + اضافه کردن صفحه)
function addNewCountertop() {
    const newPage = {
        id: Date.now(),
        enabled: true,
        thickness: 3.2,
        length: 100,
        width: 60,
        height: 90,
        x: 10, // موقعیت پیش‌فرض برای اینکه روی هم نیفتند
        y: 10,
        color: "#ffffff",
        finish: "matte",
        materialType: "countertop",
        edgeBevel: true,
        edgeRadius: 0.38,
        edgeBevelThickness: 0.32,
        gas: null,
        sink: null
    };
    allCountertops.push(newPage);
    selectedCountertopIndex = allCountertops.length - 1;
    loadCountertopToEditor();
    renderCountertopList();
}

// ۳. تابع بارگذاری اطلاعات صفحه انتخاب شده در فیلدها
function loadCountertopToEditor() {
    const ct = allCountertops[selectedCountertopIndex];
    if (!ct) return;

    // ۱. فیلدهای پایه
    document.getElementById("countertop-enabled").checked = ct.enabled;
    document.getElementById("countertop-length").value = ct.length;
    document.getElementById("countertop-width").value = ct.width;
    document.getElementById("countertop-height").value = ct.height;
    document.getElementById("countertop-pos-x").value = ct.x || 0;
    document.getElementById("countertop-pos-y").value = ct.y || 0;
    if(document.getElementById("countertop-custom-angle")) {
        document.getElementById("countertop-custom-angle").value = ct.rotation || 0;
    }
    
    // ۲. بروزرسانی ضخامت (بخش جدید)
    const thickness = ct.thickness || 3.2;
    const standardThicknesses = [1.6, 3.2, 4.8];
    
    if (standardThicknesses.includes(thickness)) {
        // اگر ضخامت استاندارد بود، رادیوی مربوطه را تیک بزن
        const radio = document.querySelector(`input[name="countertop-thickness"][value="${thickness}"]`);
        if (radio) radio.checked = true;
        document.getElementById("custom-thickness-wrapper").style.display = "none";
    } else {
        // اگر سفارشی بود، رادیوی custom را انتخاب و مقدار را در اینپوت بگذار
        const customRadio = document.querySelector(`input[name="countertop-thickness"][value="custom"]`);
        if (customRadio) customRadio.checked = true;
        document.getElementById("custom-thickness-wrapper").style.display = "block";
        document.getElementById("custom-thickness").value = thickness;
    }

// ۳. رنگ (اصلاح شده)
    const colorValue = ct.color || "#ffffff";
    document.getElementById("countertop-color-search").value = getCountertopColorNameByValue(colorValue);

    // ۳ب. پرداخت سطح و نوع متریال
    const finishEl = document.getElementById("countertop-panel-finish");
    if (finishEl) finishEl.value = ct.finish || 'matte';
    const matTypeEl = document.getElementById("countertop-panel-material-type");
    if (matTypeEl && ct.materialType) matTypeEl.value = ct.materialType;

    // ۴. لود کردن وضعیت گاز و سینک
    document.getElementById("gas-enabled").checked = ct.gas ? ct.gas.enabled : false;
    document.getElementById("sink-enabled").checked = ct.sink ? ct.sink.enabled : false;
    gasRotation = ct.gas?.rotation || 0;
sinkRotation = ct.sink?.rotation || 0;

    if (ct.gas && ct.gas.enabled) {
        document.getElementById("gas-x").value = ct.gas.x;
        document.getElementById("gas-y").value = ct.gas.y;
        document.getElementById("gas-width").value = ct.gas.width;
        document.getElementById("gas-depth").value = ct.gas.depth;
                document.getElementById("gas-material-type").value = ct.gas.materialType || "steel";
        document.getElementById("gas-burner-type").value = ct.gas.burnerType || 5;

    }
    
    if (ct.sink && ct.sink.enabled) {
        document.getElementById("sink-x").value = ct.sink.x;
        document.getElementById("sink-y").value = ct.sink.y;
        document.getElementById("sink-width").value = ct.sink.width;
        document.getElementById("sink-depth").value = ct.sink.depth;
                document.getElementById("sink-material-type").value = ct.sink.materialType || "steel";
        document.getElementById("sink-model-type").value = ct.sink.modelType || "double-tray";
        document.getElementById("sink-direction").value = ct.sink.direction || "right";

    }
if(document.getElementById("countertop-rotation-type")) {
    document.getElementById("countertop-rotation-type").value = "horizontal";} // ریست کردن دراپ‌داون هنگام سوئیچ بین صفحات
    // ۵. بروزرسانی رابط کاربری و پیش‌نمایش
    toggleGasSinkFields();
    updateCountertopPreview();
    updateCountertopPositionDisplay();
}


// ۴. تابع حذف (متصل به دکمه قرمز حذف)
function deleteCountertop() {
    if (allCountertops.length <= 1) return; // همیشه یک صفحه بماند
    allCountertops.splice(selectedCountertopIndex, 1);
    selectedCountertopIndex = 0;
    loadCountertopToEditor();
    renderCountertopList();
}

function createSingleCountertopMesh(data, baseX, baseY) {
    if (typeof THREE === 'undefined') {
        console.warn('[countertop-editor] THREE not ready');
        return null;
    }
    const thickness = data.thickness || 3.2;
    const totalLength = data.length;
    const totalWidth = data.width;

    const finishKey = data.finish || 'matte';
    const preset = (typeof window.getKitchenFinishPreset === 'function')
        ? window.getKitchenFinishPreset(finishKey)
        : { roughness: 0.28, metalness: 0.04, envMapIntensity: 0.5, bumpScale: 0.12, clearcoat: 0 };
    let material;
    if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
        material = new THREE.MeshPhysicalMaterial({
            metalness: preset.metalness,
            roughness: preset.roughness,
            clearcoat: preset.clearcoat,
            clearcoatRoughness: preset.clearcoatRoughness || 0.05,
            envMapIntensity: preset.envMapIntensity || 0.5
        });
    } else {
        material = new THREE.MeshStandardMaterial({
            metalness: preset.metalness,
            roughness: preset.roughness,
            envMapIntensity: preset.envMapIntensity || 0.5
        });
    }
    
    let cleanLabel = "";
    if (typeof data.countertopIndex !== 'undefined') {
        cleanLabel = `صفحه کابینت ${data.countertopIndex + 1} (هوشمند)`;
    } else {
        cleanLabel = (data.label || data.name || "").replace('📌', '').trim();
    }

    // 🌟 تابع کمکی پنل برای رفع معکوس بودن بالا و پایین تکسچر (کاملاً دست‌نخورده)
    const configurePanelTexture = (tex, width, length, isIsolated = false) => {
        if (typeof THREE !== 'undefined' && THREE.SRGBColorSpace != null) {
            tex.colorSpace = THREE.SRGBColorSpace;
        }
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.center.set(0.5, 0.5);
        tex.offset.set(0, 0);
        // راه ورق موازی طول صفحه
        tex.rotation = Math.PI / 2;
        tex.repeat.set(1, 1);
        tex.needsUpdate = true;
    };


    if (cleanLabel && window.isolatedDoorTextures && window.isolatedDoorTextures[cleanLabel]) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        const hdTex = loader.load(window.isolatedDoorTextures[cleanLabel], (tex) => {
            configurePanelTexture(tex, totalWidth, totalLength, true); // فعال‌سازی فیکس تایلینگ قطعه کات‌مستر
        });
        
        material.map = hdTex;
        material.color.set(0xffffff);
    } else {
        const colorValue = data.color || "#ffffff";
        if (typeof colorValue === 'string' && (colorValue.startsWith("http") || colorValue.startsWith("assets/"))) {
            const loader = new THREE.TextureLoader();
            loader.setCrossOrigin('anonymous');
            const texture = loader.load(colorValue, (tex) => {
                configurePanelTexture(tex, totalWidth, totalLength, false);
            });
            material.map = texture;
            material.color.set(0xffffff);
        } else {
            material.map = null;
            material.color.set(colorValue);
            material.roughness = preset.roughness;
        }
    }

    const posX = baseX + (data.x || 0);
    const posZ = baseY + (data.y || 0);
    const posY = (data.height || 90);

    // ۱. ایجاد گروه اصلی برای چرخش یکپارچه (دقیقاً کد اصلی پنل شما)
    const mainGroup = new THREE.Group();
    mainGroup.position.set(posX, posY, posZ);
    
    const rotationDeg = data.rotation || 0;
    mainGroup.rotation.y = THREE.MathUtils.degToRad(-rotationDeg);
    
    mainGroup.userData.isCountertop = true;
    Kitchen3D.scene.add(mainGroup);

    // ساخت هندسه — Extrude + Bevel (گردی لبه جلو/عقب مثل view3d.js)
    let geometry;
    const hasSink = data.sink && data.sink.enabled;
    const bevelSize = Math.min(0.45, Math.max(0.28, thickness * 0.12));
    const bevelThickness = Math.min(0.4, Math.max(0.25, thickness * 0.1));

    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(totalLength, 0);
    shape.lineTo(totalLength, totalWidth);
    shape.lineTo(0, totalWidth);
    shape.closePath();

    if (hasSink) {
        const sWidth = data.sink.width || 80;
        const sDepth = data.sink.depth || 50;
        const holeX = data.sink.x || 0;
        const holeY = data.sink.y || 0;

        const holePath = new THREE.Path();
        holePath.moveTo(holeX, holeY);
        holePath.lineTo(holeX + sWidth, holeY);
        holePath.lineTo(holeX + sWidth, holeY + sDepth);
        holePath.lineTo(holeX, holeY + sDepth);
        holePath.closePath();
        shape.holes.push(holePath);
    }

    // ExtrudeGeometry r186: bevel/UV/normals — بدون تغییر API
    geometry = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelSegments: 4,
        curveSegments: 4
    });
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, thickness, 0);

    // فیکس UV روی ExtrudeGeometry (r186: attributes.uv)
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const sizeX = Math.max(0.001, bbox.max.x - bbox.min.x);
    const sizeZ = Math.max(0.001, bbox.max.z - bbox.min.z);
    const uvAttribute = geometry.attributes.uv;
    const posAttribute = geometry.attributes.position;
    if (uvAttribute && posAttribute) {
        for (let i = 0; i < posAttribute.count; i++) {
            const xPos = posAttribute.getX(i);
            const zPos = posAttribute.getZ(i);
            // U = طول ، V = عرض — راه ورق با rotation تکسچر
            const u = (xPos - bbox.min.x) / sizeX;
            const v = (zPos - bbox.min.z) / sizeZ;
            uvAttribute.setXY(i, u, v);
        }
        uvAttribute.needsUpdate = true;
    }
    // normals برای bevel لبه جلو/عقب
    if (typeof geometry.computeVertexNormals === 'function') {
        geometry.computeVertexNormals();
    }

    // roughness / metalness از preset (ظاهر قبلی حفظ می‌شود)
    material.roughness = material.roughness !== undefined ? material.roughness : 0.28;
    material.metalness = material.metalness !== undefined ? material.metalness : 0.04;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.isCountertop = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.renderOrder = 2;
    mesh.position.set(0, 0, 0);
    mainGroup.add(mesh);

    // --- بخش گاز در ۳بعدی ---
    if (data.gas && data.gas.enabled) {
        const gW = data.gas.width || 60; const gD = data.gas.depth || 50;
        const gTopHeight = 1.5; const gUnderDepth = 5;

        const gasGroup = new THREE.Group();
        const gMatType = data.gas.materialType || "steel";
        const bCount = data.gas.burnerType || 5;

        const gasMat = new THREE.MeshStandardMaterial({ 
            color: gMatType === "glass" ? 0x050505 : 0x999999,
            metalness: gMatType === "glass" ? 0.9 : 0.6, roughness: gMatType === "glass" ? 0.05 : 0.3
        });

        const topMesh = new THREE.Mesh(new THREE.BoxGeometry(gW, gTopHeight, gD), gasMat); topMesh.position.set(0, gTopHeight/2, 0); gasGroup.add(topMesh);
        const underMesh = new THREE.Mesh(new THREE.BoxGeometry(gW - 4, gUnderDepth, gD - 4), new THREE.MeshStandardMaterial({ color: 0x222222 })); underMesh.position.set(0, -gUnderDepth/2, 0); gasGroup.add(underMesh);

        const knobGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 16);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
        const knobSpacing = (gW * 0.6) / (bCount > 1 ? bCount - 1 : 1);
        const startKnobX = -(bCount - 1) * knobSpacing / 2;

        for (let i = 0; i < bCount; i++) {
            const knob = new THREE.Mesh(knobGeo, knobMat); knob.position.set(startKnobX + (i * knobSpacing), gTopHeight + 0.3, gD/2 - 4); gasGroup.add(knob);
        }

        let burnerPositions = [];
        if (bCount === 2) burnerPositions = [{x:-0.2, z:0}, {x:0.2, z:0}];
        else if (bCount === 3) burnerPositions = [{x:-0.25, z:0}, {x:0, z:0}, {x:0.25, z:0}];
        else if (bCount === 4) burnerPositions = [{x:-0.25, z:-0.2}, {x:0.25, z:-0.2}, {x:-0.25, z:0.2}, {x:0.25, z:0.2}];
        else burnerPositions = [{x:-0.25, z:-0.25}, {x:0.25, z:-0.25}, {x:0, z:0}, {x:-0.25, z:0.25}, {x:0.25, z:0.25}];

        burnerPositions.forEach(p => {
            const base = new THREE.Mesh(new THREE.CylinderGeometry(gW/12, gW/11, 1.5, 32), new THREE.MeshStandardMaterial({ color: 0x333333 })); base.position.set(p.x * gW, gTopHeight + 0.6, p.z * gD); gasGroup.add(base);
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(gW/14, gW/14, 0.5, 32), new THREE.MeshStandardMaterial({ color: 0x000000 })); cap.position.set(p.x * gW, gTopHeight + 1.4, p.z * gD); gasGroup.add(cap);
        });

        const savedGasRot = data.gas.rotation !== undefined ? data.gas.rotation : (typeof gasRotation !== 'undefined' ? gasRotation : 0);
        gasGroup.rotation.y = THREE.MathUtils.degToRad(savedGasRot);

        gasGroup.position.set((data.gas.x || 0) + gW/2, thickness, (data.gas.y || 0) + gD/2);
        gasGroup.traverse(obj => { if(obj.isMesh) obj.renderOrder = 3; obj.userData.isCountertop = true; });
        mainGroup.add(gasGroup);
    }

    // --- بخش سینک ---
    if (data.sink && data.sink.enabled) {
        const sWidth = data.sink.width || 80; const sDepth = data.sink.depth || 50; const sHeight = 15;
        const sinkGroup = new THREE.Group();
        const sMatType = data.sink.materialType || "steel";
        const sModel = data.sink.modelType || "double-tray";
        const sDir = data.sink.direction || "right";
        
        let sinkColor = 0xcccccc; let sinkMetal = 0.6; let sinkRough = 0.3; 
        if (sMatType === "black") { sinkColor = 0x222222; sinkMetal = 0.2; sinkRough = 0.7; } 
        else if (sMatType === "white") { sinkColor = 0xf8f9fa; sinkMetal = 0.1; sinkRough = 0.2; } 
        else { sinkColor = 0xbbbbbb; sinkMetal = 0.8; sinkRough = 0.2; }

        const sinkMat = new THREE.MeshStandardMaterial({ color: sinkColor, metalness: sinkMetal, roughness: sinkRough });
        const hasTray = sModel.includes("tray"); const isDouble = sModel.includes("double");

        const rimW = 1.5; const rimH = 0.3; 
        const backRim = new THREE.Mesh(new THREE.BoxGeometry(sWidth + (rimW*2), rimH, rimW), sinkMat); backRim.position.set(0, rimH / 2, -sDepth / 2 - rimW / 2); backRim.renderOrder = 3; sinkGroup.add(backRim);
        const frontRim = new THREE.Mesh(new THREE.BoxGeometry(sWidth + (rimW*2), rimH, rimW), sinkMat); frontRim.position.set(0, rimH / 2, sDepth / 2 + rimW / 2); frontRim.renderOrder = 3; sinkGroup.add(frontRim);
        const leftRim = new THREE.Mesh(new THREE.BoxGeometry(rimW, rimH, sDepth), sinkMat); leftRim.position.set(-sWidth / 2 - rimW / 2, rimH / 2, 0); leftRim.renderOrder = 3; sinkGroup.add(leftRim);
        const rightRim = new THREE.Mesh(new THREE.BoxGeometry(rimW, rimH, sDepth), sinkMat); rightRim.position.set(sWidth / 2 + rimW / 2, rimH / 2, 0); rightRim.renderOrder = 3; sinkGroup.add(rightRim);

        const deckDepth = 8; 
        const deck = new THREE.Mesh(new THREE.BoxGeometry(sWidth, 2, deckDepth), sinkMat); deck.position.set(0, -1, -sDepth/2 + deckDepth/2); sinkGroup.add(deck);

        const basinAreaDepth = sDepth - deckDepth; const basinAreaZ = -sDepth/2 + deckDepth + basinAreaDepth/2;
        let trayWidth = 0; let bowlAreaWidth = sWidth; let trayX = 0; let bowlCenterX = 0;

        if (hasTray) {
            trayWidth = sWidth * 0.4; bowlAreaWidth = sWidth * 0.6;
            if (sDir === "left") { trayX = (sWidth / 2) - (trayWidth / 2); bowlCenterX = -(sWidth / 2) + (bowlAreaWidth / 2); } 
            else { trayX = -(sWidth / 2) + (trayWidth / 2); bowlCenterX = (sWidth / 2) - (bowlAreaWidth / 2); }
            const tray = new THREE.Mesh(new THREE.BoxGeometry(trayWidth, 2, basinAreaDepth), sinkMat); tray.position.set(trayX, -1, basinAreaZ); sinkGroup.add(tray);
        }

        const bWallThick = 1;
        const bFloor = new THREE.Mesh(new THREE.BoxGeometry(bowlAreaWidth, bWallThick, basinAreaDepth), sinkMat); bFloor.position.set(bowlCenterX, -sHeight, basinAreaZ); sinkGroup.add(bFloor);
        const bLeft = new THREE.Mesh(new THREE.BoxGeometry(bWallThick, sHeight, basinAreaDepth), sinkMat); bLeft.position.set(bowlCenterX - bowlAreaWidth/2 + bWallThick/2, -sHeight/2, basinAreaZ); sinkGroup.add(bLeft);
        const bRight = new THREE.Mesh(new THREE.BoxGeometry(bWallThick, sHeight, basinAreaDepth), sinkMat); bRight.position.set(bowlCenterX + bowlAreaWidth/2 - bWallThick/2, -sHeight/2, basinAreaZ); sinkGroup.add(bRight);
        const bFront = new THREE.Mesh(new THREE.BoxGeometry(bowlAreaWidth, sHeight, bWallThick), sinkMat); bFront.position.set(bowlCenterX, -sHeight/2, basinAreaZ + basinAreaDepth/2 - bWallThick/2); sinkGroup.add(bFront);
        const bBack = new THREE.Mesh(new THREE.BoxGeometry(bowlAreaWidth, sHeight, bWallThick), sinkMat); bBack.position.set(bowlCenterX, -sHeight/2, basinAreaZ - basinAreaDepth/2 + bWallThick/2); sinkGroup.add(bBack);

        if (isDouble) {
            const dividerThick = 3.5; 
            const divider = new THREE.Mesh(new THREE.BoxGeometry(dividerThick, sHeight, basinAreaDepth), sinkMat); divider.position.set(bowlCenterX, -sHeight/2, basinAreaZ); sinkGroup.add(divider);
        }

        const faucetGroup = new THREE.Group();
        const faucetMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.1 }); 

        const fBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1, 32), faucetMat); fBase.position.y = 0.5; faucetGroup.add(fBase);
        const fBody = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 22, 32), faucetMat); fBody.position.y = 12; faucetGroup.add(fBody);
        const fTopJoint = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 16), faucetMat); fTopJoint.position.y = 23; faucetGroup.add(fTopJoint);
        const fArm = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 18, 32), faucetMat); fArm.rotation.x = Math.PI / 2; fArm.position.set(0, 23, 9); faucetGroup.add(fArm);
        const fFrontJoint = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 16), faucetMat); fFrontJoint.position.set(0, 23, 18); faucetGroup.add(fFrontJoint);
        const fNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 3, 32), faucetMat); fNozzle.position.set(0, 21.5, 18); faucetGroup.add(fNozzle);

        const handleGroup = new THREE.Group();
        const hBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2, 16), faucetMat); hBase.rotation.z = Math.PI / 2; hBase.position.set(1.5, 0, 0); handleGroup.add(hBase);
        const hLever = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 16), faucetMat); hLever.position.set(2.5, 2.5, 0); hLever.rotation.z = -Math.PI / 8; handleGroup.add(hLever);
        handleGroup.position.set(0, 6, 0); faucetGroup.add(handleGroup);
        faucetGroup.position.set(bowlCenterX, 0, -sDepth/2 + 4); sinkGroup.add(faucetGroup);

        const savedSinkRot = data.sink.rotation !== undefined ? data.sink.rotation : (typeof sinkRotation !== 'undefined' ? sinkRotation : 0);
        sinkGroup.rotation.y = THREE.MathUtils.degToRad(-savedSinkRot);

        sinkGroup.position.set((data.sink.x || 0) + sWidth/2, thickness, (data.sink.y || 0) + sDepth/2);
        sinkGroup.traverse(obj => { if(obj.isMesh && obj.parent === faucetGroup) obj.renderOrder = 3; obj.userData.isCountertop = true; });
        mainGroup.add(sinkGroup);
    }
}




/**
 * باز کردن مودال سراسری یونیورسال برای انتخاب رنگ صفحه کابینت
 */

window.onCountertopFinishChange = function(value) {
    const currentCT = (typeof allCountertops !== 'undefined' && allCountertops[selectedCountertopIndex])
        ? allCountertops[selectedCountertopIndex]
        : null;
    if (currentCT) currentCT.finish = value || 'matte';
    if (typeof updateCountertopPreview === 'function') updateCountertopPreview();
    if (typeof updateAllCountertopsIn3D === 'function') updateAllCountertopsIn3D();
    if (typeof refreshBabylonCountertops === 'function') refreshBabylonCountertops();
    else if (typeof Kitchen3D !== 'undefined' && Kitchen3D.renderCabinets && Kitchen3D.scene) {
        Kitchen3D.renderCabinets();
    }
};

function openCountertopMaterialModal() {
    // ۱. تشخیص نوع دسته‌بندی متریال انتخابی از دراپ‌داون پنل
    const selectElem = document.getElementById("countertop-panel-material-type");
    let selectedType = selectElem ? selectElem.value : "countertop";
    
    // حل مشکل تفاوت نام کلیدها
    if (selectedType === "mdf-countertop") {
        selectedType = "mdf"; // اگر ام دی اف انتخاب شد، آرایه mdf از فایل all-materials لود شود
    } else if (selectedType === "countertop") {
        selectedType = "countertop"; // 🌟 اگر صفحه کابینت انتخاب شد، مستقیما کلید countertop لود شود
    }

    // ۲. فراخوانی مودال هوشمند سراسری
    if (typeof window.openUniversalModal === 'function') {
        window.openUniversalModal(
            "انتخاب طرح و رنگ صفحه کابینت", 
            selectedType, 
            function(material) {
                // این تابع کالبک پس از کلیک کاربر روی کارت متریال در مودال اجرا می‌شود:
                const colorValue = material.code || material.texture || "#ffffff";
                const colorName = material.name || "نامشخص";

                // آپدیت اینپوت نمایش نام متریال در پنل صفحه
                const searchInput = document.getElementById("countertop-color-search");
                if (searchInput) searchInput.value = colorName;
                
                // ذخیره آنی در آبجکت صفحه کابینت فعلی
                if (allCountertops[selectedCountertopIndex]) {
                    allCountertops[selectedCountertopIndex].color = colorValue;
                }

                // آپدیت کردن پیش‌نمایش‌های ۲بعدی و بوم اصلی صفحه
                updateCountertopPreview(); 
                if (typeof draw === 'function') draw();
            }
        );
    } else {
        console.error("تابع openUniversalModal در دسترس نیست! مطمئن شوید کامپوننت مودال یونیورسال لود شده است.");
    }
}




// تابع کمکی برای پیدا کردن متریال از روی مقدار (اصلاح شده)
function findCountertopMaterialByValue(val) {
    const allMats = window.allMaterials || {};
    
    for (let type in allMats) {
        if (Array.isArray(allMats[type])) {
            const found = allMats[type].find(m => (m.code === val || m.texture === val));
            if (found) return found;
        }
    }
    return null;
}


// اضافه کردن تابع کمکی برای تبدیل مقدار به نام (برای بارگذاری اولیه)
function getCountertopColorNameByValue(val) {
    const m = findCountertopMaterialByValue(val);
    return m ? m.name : "سفید یخچالی";
}

// --- ۱. رویدادهای مربوط به تغییر وضعیت (change) مثل تیک زدن و رادیوباتن‌ها ---
document.addEventListener("change", function(e) {
    if (!e.target) return;

    // رادیوباتن ضخامت صفحه کابینت
    if (e.target.name === "countertop-thickness") {
        document.getElementById("custom-thickness-wrapper").style.display = 
            e.target.value === "custom" ? "block" : "none";
    }

    // آپدیت آنی پیش‌نمایش هنگام تغییر تیک صفحه روی کابینت
    if (e.target.id === "countertop-enabled") {
        updateCountertopPreview();
    }

    // آپدیت هنگام زدن تیک فعال‌سازی گاز
    if (e.target.id === "gas-enabled") {
        toggleGasSinkFields(); // از کد اولت
        updateCountertopPreview(); // از کد دومت
    }

    // آپدیت هنگام زدن تیک فعال‌سازی سینک
    if (e.target.id === "sink-enabled") {
        toggleGasSinkFields(); // برای باز و بسته شدن پنل تنظیمات
        updateCountertopPreview(); // برای نمایش در نقشه
    }
});


// --- ۲. رویدادهای مربوط به تایپ و تغییر اعداد (input) ---
document.addEventListener("input", function(e) {
    if (!e.target) return;
    const id = e.target.id;

    // --- آپدیت آنی پیش‌نمایش (updateCountertopPreview) ---
    // ابعاد اصلی
    if (id === "countertop-length") { updateCountertopPreview(); updateCountertopPositionDisplay(); }
    if (id === "countertop-width") { updateCountertopPreview(); updateCountertopPositionDisplay(); }
    
    // موقعیت X و Y
    if (id === "countertop-pos-x") { updateCountertopPreview(); }
    if (id === "countertop-pos-y") { updateCountertopPreview(); }

    // مختصات و ابعاد گاز
    if (id === "gas-x") { updateCountertopPreview(); }
    if (id === "gas-y") { updateCountertopPreview(); }
    if (id === "gas-width") { updateCountertopPreview(); }
    if (id === "gas-depth") { updateCountertopPreview(); }
        if (id === "gas-material-type") { updateCountertopPreview(); }
    if (id === "gas-burner-type") { updateCountertopPreview(); }


    // مختصات و ابعاد سینک
    if (id === "sink-x") { updateCountertopPreview(); }
    if (id === "sink-y") { updateCountertopPreview(); }
    if (id === "sink-width") { updateCountertopPreview(); }
    if (id === "sink-depth") { updateCountertopPreview(); }
        if (id === "sink-material-type") { updateCountertopPreview(); }
    if (id === "sink-model-type") { updateCountertopPreview(); }
    if (id === "sink-direction") { updateCountertopPreview(); }


    // --- آپدیت متن نمایش مختصات در پایین پنل (updateCountertopPositionDisplay) ---
    // (طول و عرض بالا هندل شد، فقط ارتفاع مونده)
    if (id === "countertop-height") { updateCountertopPositionDisplay(); }
});



// جهانی کردن توابع
window.openCountertopEditorPanel = openCountertopEditorPanel;
window.closeCountertopEditorPanel = closeCountertopEditorPanel;
window.applyCountertopSettings = applyCountertopSettings;
window.rotateCountertop = rotateCountertop;
window.toggleGasSinkFields = toggleGasSinkFields;
window.openCountertopMaterialModal = openCountertopMaterialModal;
window.applyCustomCountertopAngle = applyCustomCountertopAngle;


function onCountertopThicknessChange() {
    try {
        const thicknessRadio = document.querySelector('input[name="countertop-thickness"]:checked');
        if (!thicknessRadio) return;
        const thickness = thicknessRadio.value === 'custom'
            ? parseFloat(document.getElementById('custom-thickness').value) || 3.2
            : parseFloat(thicknessRadio.value);
        const currentCT = allCountertops[selectedCountertopIndex];
        if (currentCT) {
            currentCT.thickness = thickness;
            currentCT.edgeBevel = true;
            currentCT.edgeRadius = Math.min(0.45, Math.max(0.28, thickness * 0.12));
            currentCT.edgeBevelThickness = Math.min(0.4, Math.max(0.25, thickness * 0.1));
        }
        if (typeof refreshBabylonCountertops === 'function') refreshBabylonCountertops();
    } catch (e) {}
}
