/**
 * cabinet-editor.js
 * مدیریت پنل ویرایش ابعاد، موقعیت، چرخش و حذف کابینت انتخاب شده
 */

// باز کردن پنل و مقداردهی اینپوت‌ها بر اساس کابینت انتخاب شده
function openEditSizePanel() {
    if (selectedId === -1) {
        alert("لطفاً ابتدا یک کابینت را در نقشه انتخاب کنید!");
        return;
    }

    const c = cabinets.find((x) => x.id === selectedId);
    if (!c) return;

    // پر کردن فیلدها با اطلاعات دقیق کابینت
    document.getElementById("size-x").value = c.x.toFixed(1);
    document.getElementById("size-y").value = c.y.toFixed(1);
    document.getElementById("size-width").value = c.w.toFixed(1);
    document.getElementById("size-height").value = c.h.toFixed(1);
    document.getElementById("size-depth").value = c.d.toFixed(1);
    
    // مقداردهی زاویه (اگر تعریف نشده بود، 0 قرار بده)
    document.getElementById("size-angle").value = (c.angle !== undefined) ? c.angle : 0;
    
    // تنظیم ارتفاع نصب (اگر تعریف نشده بود، پیش‌فرض بگذار)
    let defaultElev = c.type === "wall" ? 145 : 10;
    document.getElementById("size-elevation").value = (c.elevation !== undefined) ? c.elevation : defaultElev;

    // زاویه دیوار چپ / راست
    const sideL = document.getElementById("size-side-left");
    const sideR = document.getElementById("size-side-right");
    if (sideL) sideL.value = (c.sideAngleLeft !== undefined && c.sideAngleLeft !== null) ? normalizeSideAngleUI(c.sideAngleLeft, c) : 90;
    if (sideR) sideR.value = (c.sideAngleRight !== undefined && c.sideAngleRight !== null) ? normalizeSideAngleUI(c.sideAngleRight, c) : 90;
    if (typeof updateSideAnglePreview === "function") updateSideAnglePreview();

    // نور زیر کابینت: فقط دیواری و پله دوم
    const uclSection = document.getElementById("under-cabinet-light-section");
    const uclCheck = document.getElementById("under-cabinet-light-enabled");
    const isWallUnit = (c.type === "wall");
    if (uclSection) {
        uclSection.style.display = isWallUnit ? "block" : "none";
    }
    if (uclCheck && isWallUnit) {
        if (!c.underCabinetLight) {
            c.underCabinetLight = { enabled: false, intensity: 1.0, color: 0xfff2e0 };
        }
        uclCheck.checked = c.underCabinetLight.enabled === true;
    }

    // نور داخل کابینت: برای همه یونیت‌های غیر لوازم خانگی
    const iclSection = document.getElementById("interior-cabinet-light-section");
    const iclCheck = document.getElementById("interior-cabinet-light-enabled");
    const showInterior = !c.isAppliance;
    if (iclSection) {
        iclSection.style.display = showInterior ? "block" : "none";
    }
    if (iclCheck && showInterior) {
        if (!c.interiorLight) {
            c.interiorLight = { enabled: false, intensity: 1.0, color: 0xfff5e8 };
        }
        iclCheck.checked = c.interiorLight.enabled === true;
    }

    // باز کردن پنل با افزودن کلاس active
    document.getElementById("size-panel").classList.add("active");

    // تغییر متن دکمه اعمال برای تجربه کاربری بهتر
    const applyBtnText = document.querySelector("#size-panel .apply-btn span");
    if (applyBtnText) applyBtnText.textContent = "ذخیره تغییرات";
}

// بستن پنل ویرایش
function closeSizePanel() {
    const panel = document.getElementById("size-panel");
    if (panel) panel.classList.remove("active");
}

// اعمال تغییرات وارد شده در پنل روی آبجکت کابینت
function applySizeChanges() {
    if (selectedId === -1) return;

    const c = cabinets.find((x) => x.id === selectedId);
    if (!c) return;

    // خواندن مقادیر از اینپوت‌ها
    const newX = parseFloat(document.getElementById("size-x").value);
    const newY = parseFloat(document.getElementById("size-y").value);
    const newW = parseFloat(document.getElementById("size-width").value);
    const newH = parseFloat(document.getElementById("size-height").value);
    const newD = parseFloat(document.getElementById("size-depth").value);
    const newElev = parseFloat(document.getElementById("size-elevation").value);
    const newAngle = parseFloat(document.getElementById("size-angle").value); // خواندن زاویه

    // بررسی محدودیت‌های اتاق (اختیاری اما توصیه شده)
    // نکته: در حالت چرخش آزاد ممکن است محاسبه ابعاد برای برخورد با دیوار نیاز به فرمول‌های پیچیده‌تری داشته باشد
    let dims = typeof getRotatedDims === "function" ? getRotatedDims({ ...c, w: newW, d: newD }) : { w: newW, d: newD };
    if (newX < 0 || newY < 0 || newX + dims.w > room.w || newY + dims.d > room.d) {
        if (!confirm("برخی ابعاد خارج از محدوده اتاق است. ذخیره شود؟")) return;
    }

    // آپدیت آبجکت
    c.x = newX;
    c.y = newY;
    c.w = newW;
    c.h = newH;
    c.d = newD;
    c.elevation = newElev;
    c.angle = newAngle; // ذخیره زاویه سفارشی در آبجکت کابینت

    // زاویه دیواره‌های کناری
    const sideLEl = document.getElementById("size-side-left");
    const sideREl = document.getElementById("size-side-right");
    let sideL = sideLEl ? parseFloat(sideLEl.value) : 90;
    let sideR = sideREl ? parseFloat(sideREl.value) : 90;
    if (!Number.isFinite(sideL)) sideL = 90;
    if (!Number.isFinite(sideR)) sideR = 90;
    sideL = Math.max(0, Math.min(180, sideL));
    sideR = Math.max(0, Math.min(180, sideR));
    c.sideAngleLeft = sideL;
    c.sideAngleRight = sideR;
    c.sideAngleUI = true; // دیگر مهاجرت قدیمی اعمال نشود

    // سینک پنل کلاف یخچال
    if (c.isFridgeWrap && typeof syncFridgeWrapPanel === "function") {
        syncFridgeWrapPanel();
    }

    // بروزرسانی کل سیستم
    if (typeof draw === "function") draw();
    if (typeof refreshUI === "function") refreshUI();
    
    if (typeof Kitchen3D !== 'undefined') {
        if (typeof Kitchen3D.refreshCabinets === 'function') {
            Kitchen3D.refreshCabinets(c.id);
        } else if (Kitchen3D.refreshRoom) {
            Kitchen3D.refreshRoom();
        }
    }

if (typeof drawFrontElevation === 'function') drawFrontElevation();
}

// چرخش کابینت انتخاب شده
function rotateSelectedCabinet() {
    if (selectedId === -1) return;

    const c = cabinets.find((x) => x.id === selectedId);
    if (!c) return;

    // تغییر جهت (0 تا 3)
    c.rot = (c.rot || 0) + 1;
    if (c.rot >= 4) c.rot = 0;

    // ⭐ آپدیت کردن زاویه بر اساس چرخش 90 درجه‌ای
    c.angle = c.rot * 90;

    // آپدیت اینپوت‌ها برای نمایش صحیح
    document.getElementById("size-width").value = c.w;
    document.getElementById("size-depth").value = c.d;
    
    // ⭐ آپدیت کردن فیلد زاویه در پنل
    const angleField = document.getElementById("size-angle");
    if (angleField) {
        angleField.value = c.angle;
    }

    draw();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshRoom) Kitchen3D.refreshRoom();
}


// حذف کابینت انتخاب شده
function deleteSelectedCabinet() {
    if (selectedId === -1) return;
    if (!confirm("آیا از حذف این کابینت مطمئن هستید؟")) return;

    // حذف از آرایه اصلی
    cabinets = cabinets.filter((x) => x.id !== selectedId);
    
    // ریست کردن وضعیت انتخاب
    selectedId = -1;
    
    // غیرفعال کردن دکمه‌های وابسته در سایدبار
    const doorBtn = document.getElementById("door-editor-btn");
    if (doorBtn) doorBtn.disabled = true;
    
    const colorBtn = document.getElementById("color-editor-btn");
    if (colorBtn) colorBtn.disabled = true;

    // بستن پنل و آپدیت محیط
    closeSizePanel();
    draw();
    if (typeof refreshUI === "function") refreshUI();
    if (typeof Kitchen3D !== 'undefined' && Kitchen3D.refreshRoom) Kitchen3D.refreshRoom();
}


/**
 * خاموش/روشن کردن نور LED زیر کابینت دیواری / پله دوم
 */
function toggleUnderCabinetLight(isOn) {
    if (typeof selectedId === "undefined" || selectedId === -1) return;
    const c = cabinets.find((x) => x.id === selectedId);
    if (!c || c.type !== "wall") return;

    if (!c.underCabinetLight) {
        c.underCabinetLight = { enabled: false, intensity: 1.0, color: 0xfff2e0 };
    }
    c.underCabinetLight.enabled = !!isOn;

    if (typeof Kitchen3D !== "undefined" && Kitchen3D.refreshRoom) {
        Kitchen3D.refreshRoom();
    } else if (typeof Kitchen3D !== "undefined" && typeof Kitchen3D.updateUnderCabinetLights === "function") {
        Kitchen3D.updateUnderCabinetLights();
    }
}


/**
 * فعال/غیرفعال کردن نور داخل کابینت (شیشه / درب باز)
 */
function toggleInteriorCabinetLight(isOn) {
    if (typeof selectedId === "undefined" || selectedId === -1) return;
    const c = cabinets.find((x) => x.id === selectedId);
    if (!c || c.isAppliance) return;

    if (!c.interiorLight) {
        c.interiorLight = { enabled: false, intensity: 1.0, color: 0xfff5e8 };
    }
    c.interiorLight.enabled = !!isOn;

    if (typeof Kitchen3D !== "undefined" && Kitchen3D.refreshRoom) {
        Kitchen3D.refreshRoom();
    }
}


/**
 * پیش‌نمایش از بالای یونیت — اثر زاویه دیوار چپ/راست
 */
/** زاویه UI: ۹۰=صاف | کمتر=بسته | بیشتر=باز — مقادیر قدیمی ‎-۴۵..۴۵ هم پشتیبانی می‌شود */
/**
 * زاویه UI: ۹۰=صاف | کمتر=بسته/چپ | بیشتر=باز/راست
 * محدوده ۰..۱۸۰ — دیگر مقدار را با فرمول قدیمی خراب نمی‌کنیم.
 * فقط یک‌بار مهاجرت از سیستم قدیمی (-۴۵..۴۵) با پرچم sideAngleUI.
 */
function normalizeSideAngleUI(v, cabinet) {
    if (v === undefined || v === null || v === '') return 90;
    let a = parseFloat(v);
    if (!Number.isFinite(a)) return 90;
    // مهاجرت فقط وقتی هنوز به سیستم UI جدید نرفته
    if (cabinet && cabinet.sideAngleUI !== true && a >= -45 && a <= 45) {
        a = 90 - a; // قدیمی: ۰=صاف ، مثبت=بسته
    }
    return Math.max(0, Math.min(180, a));
}
function sideAngleDeviation(uiAngle, cabinet) {
    return 90 - normalizeSideAngleUI(uiAngle, cabinet);
}
function updateSideAnglePreview() {

    const canvas = document.getElementById("side-angle-preview");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const Wcss = canvas.clientWidth || 280;
    const Hcss = 160;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(Wcss * dpr);
    canvas.height = Math.round(Hcss * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const wInput = parseFloat(document.getElementById("size-width")?.value);
    const dInput = parseFloat(document.getElementById("size-depth")?.value);
    const unitW = Number.isFinite(wInput) && wInput > 0 ? wInput : 60;
    const unitD = Number.isFinite(dInput) && dInput > 0 ? dInput : 55;
    let aL = normalizeSideAngleUI(document.getElementById("size-side-left")?.value, { sideAngleUI: true });
    let aR = normalizeSideAngleUI(document.getElementById("size-side-right")?.value, { sideAngleUI: true });
    const devL = aL - 90; // منفی=چپ | مثبت=راست
    const devR = aR - 90;

    const shiftL = Math.tan(devL * Math.PI / 180) * unitD;
    const shiftR = Math.tan(devR * Math.PI / 180) * unitD;
    const insetL = shiftL;
    const insetR = shiftR;

    ctx.clearRect(0, 0, Wcss, Hcss);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, Wcss, Hcss);

    // مقیاس
    const pad = 28;
    const maxW = unitW + Math.abs(insetL) + Math.abs(insetR);
    const scale = Math.min((Wcss - pad * 2) / maxW, (Hcss - pad * 2) / unitD);
    const drawW = unitW * scale;
    const drawD = unitD * scale;
    const iL = insetL * scale;
    const iR = insetR * scale;

    // مرکز افقی بر اساس متوسط عرض جلو و عقب
    const frontW = drawW - iL - iR;
    const cx = Wcss / 2;
    const backLeftX = cx - drawW / 2;
    const backRightX = cx + drawW / 2;
    const frontLeftX = backLeftX + iL;
    const frontRightX = backRightX + iR;
    const backY = pad + 8;
    const frontY = backY + drawD;

    // شبکه خیلی کم‌رنگ
    ctx.strokeStyle = "rgba(148,163,184,0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = backY + (drawD * i) / 4;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(Wcss - pad, y);
        ctx.stroke();
    }

    // بدنه ذوزنقه‌ای
    ctx.beginPath();
    ctx.moveTo(backLeftX, backY);
    ctx.lineTo(backRightX, backY);
    ctx.lineTo(frontRightX, frontY);
    ctx.lineTo(frontLeftX, frontY);
    ctx.closePath();
    ctx.fillStyle = "rgba(56,189,248,0.18)";
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // دیوار چپ
    ctx.beginPath();
    ctx.moveTo(backLeftX, backY);
    ctx.lineTo(frontLeftX, frontY);
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 3;
    ctx.stroke();

    // دیوار راست
    ctx.beginPath();
    ctx.moveTo(backRightX, backY);
    ctx.lineTo(frontRightX, frontY);
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 3;
    ctx.stroke();

    // برچسب‌ها
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Tahoma, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("عقب", cx, backY - 6);
    ctx.fillText("جلو (درب)", cx, frontY + 14);
    ctx.fillStyle = "#f472b6";
    ctx.textAlign = "right";
    ctx.fillText("چپ " + aL + "°", Math.min(frontLeftX, backLeftX) - 6, (backY + frontY) / 2);
    ctx.fillStyle = "#a78bfa";
    ctx.textAlign = "left";
    ctx.fillText("راست " + aR + "°", Math.max(frontRightX, backRightX) + 6, (backY + frontY) / 2);
}
window.updateSideAnglePreview = updateSideAnglePreview;
