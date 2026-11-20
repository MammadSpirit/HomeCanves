// ==========================================
// ۱. تابع جدید: قفل / باز کردن کابینت (نمای ۲ بعدی)
// ==========================================
function toggleLock() {
    let activeObj = null;

    if (typeof selectedId !== 'undefined' && selectedId !== -1) {
        activeObj = cabinets.find((x) => x.id === selectedId);
    } else if (typeof selectedPillarId !== 'undefined' && selectedPillarId !== -1) {
        activeObj = pillars.find((p) => p.id === selectedPillarId);
    } else if (window.isClosetFrameSelected && window.currentClosetFrameParts && window.currentClosetFrameParts.length > 0) {
        // 🟢 پشتیبانی از چهارچوب کمد
        activeObj = window.currentClosetFrameParts[0];
    }

    if (!activeObj) return;

    // اعمال قفل/باز روی شیء
    const newLockState = !activeObj.isLocked;
    
    if (window.isClosetFrameSelected && window.currentClosetFrameParts) {
        // اگر چهارچوب بود، وضعیت قفل روی تمام قطعات آن اعمال می‌شود
        window.currentClosetFrameParts.forEach(p => p.isLocked = newLockState);
    } else {
        activeObj.isLocked = newLockState;
    }

    // آپدیت کردن ظاهر دکمه‌ها و اینپوت‌ها
    updateToolbarPositionInputs();
    if (typeof updateFloatingUnitControls === 'function') updateFloatingUnitControls();
}


// ==========================================
// ۲. تابع خواندن موقعیت و بررسی وضعیت قفل (نمای ۲ بعدی)
// ==========================================
function updateToolbarPositionInputs() {
    const xInput = document.getElementById("toolbar-pos-x");
    const yInput = document.getElementById("toolbar-pos-y");
    const lockBtn = document.getElementById("toolbar-lock-btn");
    const rotateBtn = document.getElementById("toolbar-rotate-btn"); // 🟢 متغیر اضافه شد
    const duplicateBtn = document.getElementById("toolbar-duplicate-btn"); // 🟢 دکمه کپی یونیت

    if (!xInput || !yInput || !lockBtn) return;

    let activeObj = null;

    if (typeof selectedId !== 'undefined' && selectedId !== -1) {
        activeObj = cabinets.find((x) => x.id === selectedId);
    } else if (typeof selectedPillarId !== 'undefined' && selectedPillarId !== -1) {
        activeObj = pillars.find((p) => p.id === selectedPillarId);
    } else if (window.isClosetFrameSelected && window.currentClosetFrameParts && window.currentClosetFrameParts.length > 0) {
        // 🟢 دریافت موقعیت چهارچوب کمد
        activeObj = window.currentClosetFrameParts[0];
    }

    if (activeObj) {
        xInput.value = (activeObj.x || 0).toFixed(1);
        yInput.value = (activeObj.y || 0).toFixed(1);
        
        if (activeObj.isLocked) {
            xInput.disabled = true;
            yInput.disabled = true;
            xInput.style.opacity = "0.5";
            yInput.style.opacity = "0.5";
            lockBtn.innerHTML = "🔒";
        } else {
            xInput.disabled = false;
            yInput.disabled = false;
            xInput.style.opacity = "1";
            yInput.style.opacity = "1";
            lockBtn.innerHTML = "🔓";
        }
        lockBtn.style.opacity = "1";
        lockBtn.disabled = false;

        // تنظیم وضعیت دکمه چرخش
        if (rotateBtn) {
            rotateBtn.disabled = !!activeObj.isLocked;
            rotateBtn.style.opacity = activeObj.isLocked ? "0.5" : "1";
        }

        // تنظیم وضعیت دکمه کپی (حتی اگر قفل باشد، کپی جدید باز خواهد بود)
        if (duplicateBtn) {
            duplicateBtn.disabled = false;
            duplicateBtn.style.opacity = "1";
        }
    } else {
        xInput.value = "0";
        yInput.value = "0";
        xInput.disabled = true;
        yInput.disabled = true;
        xInput.style.opacity = "0.5";
        yInput.style.opacity = "0.5";
        lockBtn.innerHTML = "🔓";
        lockBtn.style.opacity = "0.3";
        lockBtn.disabled = true;

        // غیرفعال کردن دکمه چرخش وقتی چیزی انتخاب نشده
        if (rotateBtn) {
            rotateBtn.disabled = true;
            rotateBtn.style.opacity = "0.3";
        }

        // غیرفعال کردن دکمه کپی وقتی چیزی انتخاب نشده
        if (duplicateBtn) {
            duplicateBtn.disabled = true;
            duplicateBtn.style.opacity = "0.3";
        }
    }
}


// ==========================================
// ۳. اعمال تغییرات تایپ شده (نمای ۲ بعدی)
// ==========================================
function applyToolbarPositionChanges() {
    let activeObj = null;
    let isPillar = false;
    let isClosetFrame = false;

    if (typeof selectedId !== 'undefined' && selectedId !== -1) {
        activeObj = cabinets.find((x) => x.id === selectedId);
    } else if (typeof selectedPillarId !== 'undefined' && selectedPillarId !== -1) {
        activeObj = pillars.find((p) => p.id === selectedPillarId);
        isPillar = true;
    } else if (window.isClosetFrameSelected && window.closetFrameUnit) {
        activeObj = window.closetFrameUnit;
        isClosetFrame = true;
    }

    if (!activeObj || activeObj.isLocked) return;

    const newX = parseFloat(document.getElementById("toolbar-pos-x").value);
    const newY = parseFloat(document.getElementById("toolbar-pos-y").value);

    if (isClosetFrame) {
        if (!isNaN(newX) || !isNaN(newY)) {
            const deltaX = !isNaN(newX) ? (newX - activeObj.x) : 0;
            const deltaY = !isNaN(newY) ? (newY - activeObj.y) : 0;

            activeObj.x = !isNaN(newX) ? newX : activeObj.x;
            activeObj.y = !isNaN(newY) ? newY : activeObj.y;

            // جابجایی نسبی تمام قطعات درون مجموعه
            if (window.currentClosetFrameParts) {
                window.currentClosetFrameParts.forEach(part => {
                    part.x += deltaX;
                    part.y += deltaY;
                });
            }
        }
    } else {
        if (!isNaN(newX)) activeObj.x = newX;
        if (!isNaN(newY)) activeObj.y = newY;
    }

    if (typeof draw === "function") draw();
    if (typeof refreshUI === "function") refreshUI();
    if (window.cutPanel && typeof window.cutPanel.optimizeAll === 'function') window.cutPanel.optimizeAll();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshRoom) Kitchen3D.refreshRoom();
}


// ==========================================
// ۴. قفل مجزای محور افقی یا عمودی نمای روبرو (Elev)
// ==========================================
function toggleElevLock(axis) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    const cabinet = cabinets.find(c => c.id === selectedId);
    if (!cabinet) return;

    if (axis === 'x') {
        cabinet.isLockedX = !cabinet.isLockedX;
    } else if (axis === 'h') {
        cabinet.isLockedH = !cabinet.isLockedH;
    }

    updateElevToolbarInputs();
}


// ==========================================
// ۵. خواندن مقادیر و وضعیت قفل‌ها برای نمای روبرو (Elev)
// ==========================================
function updateElevToolbarInputs() {
    const inputX = document.getElementById("toolbar-elev-x");
    const inputH = document.getElementById("toolbar-elev-h");
    const btnLockX = document.getElementById("toolbar-elev-lock-x");
    const btnLockH = document.getElementById("toolbar-elev-lock-h");

    if (!inputX || !inputH) return;

    let activeCab = null;
    if (typeof selectedId !== 'undefined' && selectedId !== -1) {
        activeCab = cabinets.find(c => c.id === selectedId);
    }

    if (activeCab) {
        const wallData = (typeof getActiveWallData === 'function') ? getActiveWallData() : { len: 400 };
        let posOnWall = activeCab.x;
        if (window.activeElevWall === 'bottom' || window.activeElevWall === 'right') {
            posOnWall = wallData.len - activeCab.x - activeCab.w;
        } else if (window.activeElevWall === 'left') {
            posOnWall = activeCab.y;
        }
        
        const currentElev = typeof activeCab.elevation !== 'undefined' ? activeCab.elevation : (activeCab.elevationFromGround || 0);

        inputX.value = posOnWall.toFixed(1);
        inputH.value = currentElev.toFixed(1);

        // قفل افقی
        inputX.disabled = !!activeCab.isLockedX;
        inputX.style.opacity = activeCab.isLockedX ? "0.5" : "1";
        if (btnLockX) btnLockX.innerHTML = activeCab.isLockedX ? "🔒" : "🔓";

        // قفل عمودی
        inputH.disabled = !!activeCab.isLockedH;
        inputH.style.opacity = activeCab.isLockedH ? "0.5" : "1";
        if (btnLockH) btnLockH.innerHTML = activeCab.isLockedH ? "🔒" : "🔓";

    } else {
        inputX.value = "0";
        inputH.value = "0";
        inputX.disabled = true;
        inputH.disabled = true;
        inputX.style.opacity = "0.5";
        inputH.style.opacity = "0.5";
        if (btnLockX) btnLockX.innerHTML = "🔓";
        if (btnLockH) btnLockH.innerHTML = "🔓";
    }
}


// ==========================================
// ۶. اعمال دستی تغییرات از داخل اینپوت‌های Elev
// ==========================================
function applyElevToolbarChanges() {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    const cabinet = cabinets.find(c => c.id === selectedId);
    if (!cabinet) return;

    const inputX = document.getElementById("toolbar-elev-x");
    const inputH = document.getElementById("toolbar-elev-h");

    if (inputX && !cabinet.isLockedX) {
        const valX = parseFloat(inputX.value);
        if (!isNaN(valX)) {
            const wallData = getActiveWallData();
            let newPosOnWall = Math.max(0, Math.min(wallData.len - cabinet.w, valX));
            
            switch (window.activeElevWall) {
                case 'top': cabinet.x = newPosOnWall; break;
                case 'bottom': cabinet.x = wallData.len - newPosOnWall - cabinet.w; break;
                case 'left': cabinet.y = newPosOnWall; break;
                case 'right': cabinet.y = wallData.len - newPosOnWall - cabinet.w; break;
            }
        }
    }

    if (inputH && !cabinet.isLockedH) {
        const valH = parseFloat(inputH.value);
        if (!isNaN(valH)) {
            const newElev = Math.max(0, Math.min(270 - cabinet.h, valH));
            cabinet.elevation = newElev;
            if (typeof cabinet.elevationFromGround !== 'undefined') cabinet.elevationFromGround = newElev;
        }
    }

    if (typeof drawFrontElevation === 'function') drawFrontElevation();
    if (typeof draw === 'function') draw();
}


// ==========================================
// ۷. فعال‌سازی رویدادهای ۲D و Elev
// ==========================================
function initToolbarEvents() {
    // ۱. لیسنرهای ۲D
    const xInput = document.getElementById("toolbar-pos-x");
    const yInput = document.getElementById("toolbar-pos-y");
    if (xInput && yInput) {
        xInput.addEventListener("change", applyToolbarPositionChanges);
        yInput.addEventListener("change", applyToolbarPositionChanges);

        const handleEnter = (e) => {
            if (e.key === "Enter") {
                applyToolbarPositionChanges();
                e.target.blur(); 
            }
        };
        xInput.addEventListener("keydown", handleEnter);
        yInput.addEventListener("keydown", handleEnter);
    }

    // ۲. لیسنرهای Elev
    const elevX = document.getElementById("toolbar-elev-x");
    const elevH = document.getElementById("toolbar-elev-h");
    if (elevX && elevH) {
        elevX.addEventListener("change", applyElevToolbarChanges);
        elevH.addEventListener("change", applyElevToolbarChanges);
        
        const handleElevEnter = (e) => {
            if (e.key === "Enter") {
                applyElevToolbarChanges();
                e.target.blur();
            }
        };
        elevX.addEventListener("keydown", handleElevEnter);
        elevH.addEventListener("keydown", handleElevEnter);
    }
    
    // آپدیت مقادیر اولیه‌ها
    updateToolbarPositionInputs();
    updateElevToolbarInputs();
}

// 🟢 اجرای خودکار فعال‌سازی رویدادها هنگام لود کامل صفحه
document.addEventListener("DOMContentLoaded", () => {
    initToolbarEvents();
});

// ==========================================
// ۸. چرخش کابینت / چهارچوب کمد از طریق تولبار
// ==========================================
// اصلاح تابع چرخش کمد از تولبار
function rotateSelectedCabinetFromToolbar() {
    // ۱. اگر چهارچوب کمد انتخاب شده باشد
    if (window.isClosetFrameSelected && window.closetFrameUnit) {
        const unit = window.closetFrameUnit;
        
        // بررسی قفل بودن
        if (unit.isLocked) {
            alert("این آیتم قفل است و امکان چرخش آن وجود ندارد.");
            return;
        }

        // چرخش ۹۰ درجه واحد یکپارچه (0 -> 1 -> 2 -> 3)
        unit.rot = ((unit.rot || 0) + 1) % 4;

        // به‌روزرسانی چرخش قطعات داخلی جهت هماهنگی با ۳D و برش
        if (window.currentClosetFrameParts) {
            window.currentClosetFrameParts.forEach(part => {
                part.rot = unit.rot;
            });
        }

        if (typeof draw === "function") draw();
        if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshRoom) Kitchen3D.refreshRoom();
        return;
    }

    // ۲. اگر کابینت عادی انتخاب شده باشد
    if (typeof rotateSelectedCabinet === "function") {
        rotateSelectedCabinet();
    } else if (typeof rotateCabinet === "function") {
        rotateCabinet();
    }

    syncSizePanelOnRotate();
}

// اصلاح تابع چرخش کلی (rotateCabinet)
function rotateCabinet() {
    if (selectedId === -1 && !window.isClosetFrameSelected) return;

    if (window.isClosetFrameSelected) {
        rotateSelectedCabinetFromToolbar();
        return;
    }

    let c = cabinets.find((x) => x.id === selectedId);
    if (!c || c.isLocked) return;

    let newRot = (c.rot + 1) % 4;
    let effectiveW = (newRot % 2 === 1) ? c.d : c.w;
    let effectiveD = (newRot % 2 === 1) ? c.w : c.d;

    if (c.x + effectiveW > room.w || c.y + effectiveD > room.d) {
        alert("چرخش باعث می‌شود کابینت از محدوده اتاق خارج شود.");
        return;
    }

    c.rot = newRot;

    draw();
    
    if (window.cutPanel && typeof window.cutPanel.optimizeAll === "function") {
        window.cutPanel.optimizeAll();
    } else if (typeof optimizeCuts === "function") {
        optimizeCuts();
    }
}



// ==========================================
// ۹. کپی کردن یونیت انتخاب‌شده از طریق تولبار (نمای ۲ بعدی)
// ==========================================
function duplicateSelectedCabinetFromToolbar() {
    // ۱. چهارچوب کمد فعلاً پشتیبانی نمی‌شود (ساختار چندقطعه‌ای پیچیده‌تر است)
    if (window.isClosetFrameSelected) {
        alert("کپی کردن چهارچوب کمد در حال حاضر پشتیبانی نمی‌شود.");
        return;
    }

    // ۲. کابینت/یونیت عادی
    if (typeof duplicateSelectedCabinet === "function") {
        duplicateSelectedCabinet();
    }
}


// سینک کردن فیلدهای پنل اندازه با وضعیت جدید
function syncSizePanelOnRotate() {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    const c = cabinets.find((x) => x.id === selectedId);
    if (!c) return;

    const widthField = document.getElementById("size-width");
    const depthField = document.getElementById("size-depth");
    const angleField = document.getElementById("size-angle");

    if (widthField) widthField.value = c.w;
    if (depthField) depthField.value = c.d;
    if (angleField) angleField.value = c.angle !== undefined ? c.angle : 0;
}
