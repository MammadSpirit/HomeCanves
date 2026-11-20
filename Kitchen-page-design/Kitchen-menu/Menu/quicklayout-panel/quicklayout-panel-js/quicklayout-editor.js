const QUICK_LAYOUT_ITEM_DEFS = [
    { key: "floor", label: "زمینی", addFn: "addFloorCabinet", w: 90, d: 55, h: 73.6, elevation: 14 },
    { key: "drawerBody", label: "بدنه کشو", addFn: "addDrawerBody", w: 60, d: 55, h: 73.6, elevation: 14 },
    { key: "baseWithDrawer", label: "زمینی (در و کشو)", addFn: "addBaseCabinetWithDrawer", w: 90, d: 55, h: 73.6, elevation: 14 },
    { key: "waterproof", label: "بدنه ضد آب", addFn: "addWaterproofBody", w: 90, d: 55, h: 73.6, elevation: 14 },
    { key: "oven", label: "یونیت فر", addFn: "addOvenCabinet", w: 60, d: 55, h: 220, elevation: 14 },
    { key: "fridgeWrap", label: "کلاف یخچال", addFn: "addFridgeWrap", w: 95, d: 60, h: 240, elevation: 0 },
    { key: "washingMachine", label: "ماشین لباسشویی", addFn: "addWashingMachine", w: 60, d: 60, h: 85, elevation: 0 },
    { key: "dishwasher", label: "ماشین ظرفشویی", addFn: "addDishwasher", w: 60, d: 60, h: 85, elevation: 0 },
    { key: "wall", label: "دیواری", addFn: "addWallCabinet", w: 90, d: 35, h: 70, elevation: 150 },
    { key: "upperWall", label: "دیواری (پله ۲)", addFn: "addUpperWallCabinet", w: 90, d: 45, h: 40, elevation: 215 },
    { key: "dishRack", label: "بدنه آب چکان", addFn: "addDishRackBody", w: 90, d: 35, h: 70, elevation: 150 },
    { key: "hiddenHood", label: "بدنه هود مخفی", addFn: "addHiddenHoodBody", w: 90, d: 35, h: 70, elevation: 150 },
    { key: "hoodWrap", label: "کلاف هود", addFn: "addHoodWrap", w: 90, d: 35, h: 70, elevation: 150 },
    { key: "facadeBox", label: "باکس نما", addFn: "addFacadeBox", w: 55, d: 55, h: 240, elevation: 0 },
    { key: "coffeeBar", label: "کافه بار", addFn: "addCoffeeBar", w: 90, d: 55, h: 220, elevation: 14 }
];

let quickLayoutStagedItems = [];
let selectedQuickLayoutWall = "top";
let selectedStagedItemIndex = -1;
// 🌟 فقط دقیقاً همون لحظه‌ای که آیتم لیست عوض می‌شه اجرا می‌شه (نه هر تغییر دیگه‌ای)
function onQuickLayoutUnitSelectChange() {
    const select = document.getElementById("quicklayout-unit-select");
    if (!select || !select.value) return;
    const def = QUICK_LAYOUT_ITEM_DEFS.find(d => d.key === select.value);
    if (!def) return;

    document.getElementById("quicklayout-item-w").value = def.w;
    document.getElementById("quicklayout-item-h").value = def.h;
    document.getElementById("quicklayout-item-d").value = def.d;
    document.getElementById("quicklayout-item-elevation").value = def.elevation;
    document.getElementById("quicklayout-item-doortype").value = "side";
    const defaultRange = getQuickLayoutDoorCountRange("side");
    const estimatedCount = Math.max(1, Math.round(def.w / 45));
    document.getElementById("quicklayout-item-doorcount").value = Math.max(defaultRange.min, Math.min(defaultRange.max, estimatedCount));
    
    if (selectedStagedItemIndex === -1) autoUpdateQuickLayoutPosition();
}
    
function openQuickLayoutPanel() {
    const panel = document.getElementById("quicklayout-panel-wrapper");
    if (!panel) return;
    panel.classList.add("active");

    quickLayoutStagedItems = [];
    selectedStagedItemIndex = -1;

    renderQuickLayoutWallSelect();
    renderQuickLayoutUnitSelect();
    onQuickLayoutUnitSelectChange(); // 🌟 اندازه‌ی پیش‌فرض همون اولین آیتم لیست لود بشه
    renderQuickLayoutPreview();
    renderQuickLayoutRoomPreview();
}

function closeQuickLayoutPanel() {
    const panel = document.getElementById("quicklayout-panel-wrapper");
    if (panel) panel.classList.remove("active");
}

function getActiveWalls() {
    const cfg = (typeof Kitchen3D !== "undefined" && Kitchen3D.config) ? Kitchen3D.config : {};
    return {
        top: cfg.hasTop !== false,
        bottom: cfg.hasBottom !== false,
        left: cfg.hasLeft !== false,
        right: cfg.hasRight !== false
    };
}

function renderQuickLayoutWallSelect() {
    const select = document.getElementById("quicklayout-wall-select");
    if (!select) return;
    select.innerHTML = "";

    const active = getActiveWalls();
    const labels = { top: "دیوار بالا", bottom: "دیوار پایین", left: "دیوار چپ", right: "دیوار راست" };

    Object.keys(labels).forEach(key => {
        if (!active[key]) return;
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = labels[key];
        select.appendChild(opt);
    });

    if (select.options.length > 0) {
        selectedQuickLayoutWall = select.options[0].value;
        select.value = selectedQuickLayoutWall;
    }
}
function onQuickLayoutXYManualChange() {
    const item = quickLayoutStagedItems[selectedStagedItemIndex];
    if (item) {
        item.x = parseFloat(document.getElementById("quicklayout-item-x").value) || 0;
        item.y = parseFloat(document.getElementById("quicklayout-item-y").value) || 0;
    }
    renderQuickLayoutPreview();
    renderQuickLayoutRoomPreview();
}

function onQuickLayoutWallChange() {
    const select = document.getElementById("quicklayout-wall-select");
    if (!select) return;
    selectedQuickLayoutWall = select.value;
    autoUpdateQuickLayoutPosition();
    renderQuickLayoutRoomPreview();
}

// 🌟 هر تغییر تو فیلدها: اگه آیتمی انتخاب شده باشه همون آپدیت می‌شه، وگرنه فقط مقدار به‌عنوان قالب پیش‌فرض برای افزودن بعدی می‌مونه
function onQuickLayoutFieldChange() {
    const item = quickLayoutStagedItems[selectedStagedItemIndex];
    if (item) {
        item.w = parseFloat(document.getElementById("quicklayout-item-w").value) || item.w;
        item.h = parseFloat(document.getElementById("quicklayout-item-h").value) || item.h;
        item.d = parseFloat(document.getElementById("quicklayout-item-d").value) || item.d;
        item.elevation = parseFloat(document.getElementById("quicklayout-item-elevation").value) || 0;
        item.angle = parseFloat(document.getElementById("quicklayout-item-angle").value) || 0;
        item.x = parseFloat(document.getElementById("quicklayout-item-x").value) || 0;
        item.y = parseFloat(document.getElementById("quicklayout-item-y").value) || 0;
        item.doorType = document.getElementById("quicklayout-item-doortype").value;

        // 🌟 اگه با تغییر نوع بازشو، تعداد فعلی خارج از محدوده مجاز شد، خودکار تنظیمش کن
        const range = getQuickLayoutDoorCountRange(item.doorType);
        let count = parseInt(document.getElementById("quicklayout-item-doorcount").value) || range.min;
        count = Math.max(range.min, Math.min(range.max, count));
        document.getElementById("quicklayout-item-doorcount").value = count;
        item.doorCount = count;
    } else {
        autoUpdateQuickLayoutPosition(); // 🌟 اگه چیزی انتخاب نشده، یعنی داریم عرض/عمق آیتم بعدی رو می‌سازیم؛ موقعیت خودکار به‌روز بشه
    }
    renderQuickLayoutPreview();
    renderQuickLayoutRoomPreview();
}

function rotateQuickLayoutSelectedField() {
    const angleInput = document.getElementById("quicklayout-item-angle");
    const current = parseFloat(angleInput.value) || 0;
    angleInput.value = (current + 90) % 360;
    onQuickLayoutFieldChange();
}

function deleteQuickLayoutSelectedItem() {
    if (selectedStagedItemIndex === -1) return;
    quickLayoutStagedItems.splice(selectedStagedItemIndex, 1);
    selectedStagedItemIndex = -1;
    renderQuickLayoutPreview();
    renderQuickLayoutRoomPreview();
}

function renderQuickLayoutRoomPreview() {
    const canvas = document.getElementById("quicklayout-room-canvas");
    if (!canvas || typeof room === "undefined") return;

    // 🌟 هماهنگ کردن سایز واقعی پیکسلی canvas با سایز نمایشی‌ش (رفع کشیدگی)
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (cssWidth > 0 && cssHeight > 0 && (canvas.width !== cssWidth || canvas.height !== cssHeight)) {
        canvas.width = cssWidth;
        canvas.height = cssHeight;
    }

    const ctx = canvas.getContext("2d");

    if (!room.walls) {
        room.walls = {
            top: { len: room.w || 400 },
            bottom: { len: room.w || 400 },
            left: { len: room.d || 300 },
            right: { len: room.d || 300 }
        };
    }

    const roomW = room.w || room.walls.top.len || 400;
    const roomD = room.d || room.walls.left.len || 300;
    const active = getActiveWalls();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = 40;
    const maxW = canvas.width - margin * 2;
    const maxH = canvas.height - margin * 2;
    const scale = Math.min(maxW / roomW, maxH / roomD);

    const rw = roomW * scale;
    const rh = roomD * scale;
    const rx = (canvas.width - rw) / 2;
    const ry = (canvas.height - rh) / 2;

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(rx, ry, rw, rh);

    const wallEdges = {
        top:    { x1: rx, y1: ry, x2: rx + rw, y2: ry },
        bottom: { x1: rx, y1: ry + rh, x2: rx + rw, y2: ry + rh },
        left:   { x1: rx, y1: ry, x2: rx, y2: ry + rh },
        right:  { x1: rx + rw, y1: ry, x2: rx + rw, y2: ry + rh }
    };

    Object.keys(wallEdges).forEach(key => {
        if (!active[key]) return;
        const e = wallEdges[key];
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.strokeStyle = (key === selectedQuickLayoutWall) ? "#38bdf8" : "#64748b";
        ctx.lineWidth = (key === selectedQuickLayoutWall) ? 6 : 4;
        ctx.stroke();
    });

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px Tahoma";
    ctx.textAlign = "center";
    if (active.top) ctx.fillText(`${Math.round(roomW)} cm`, rx + rw / 2, ry - 10);
    if (active.bottom) ctx.fillText(`${Math.round(roomW)} cm`, rx + rw / 2, ry + rh + 20);
    if (active.left) {
        ctx.save(); ctx.translate(rx - 14, ry + rh / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${Math.round(roomD)} cm`, 0, 0); ctx.restore();
    }
    if (active.right) {
        ctx.save(); ctx.translate(rx + rw + 14, ry + rh / 2); ctx.rotate(Math.PI / 2);
        ctx.fillText(`${Math.round(roomD)} cm`, 0, 0); ctx.restore();
    }

    // 🌟 رسم یونیت‌ها - مرکز چرخش بر اساس ابعاد واقعیِ چرخیده‌شده (هماهنگ با نمای دو بعدی اصلی)
    quickLayoutStagedItems.forEach((item, index) => {
        const eff = getEffectiveFootprint(item); // ابعاد جعبه‌ی واقعی بعد از چرخش
        const boxEffW = eff.w * scale;
        const boxEffD = eff.d * scale;

        const centerX = rx + (item.x * scale) + boxEffW / 2;
        const centerY = ry + (item.y * scale) + boxEffD / 2;

        const natW = item.w * scale; // ابعاد خام برای رسم مستطیل (قبل از چرخش بصری)
        const natD = item.d * scale;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(((item.angle || 0) * Math.PI) / 180);

        const isSelected = index === selectedStagedItemIndex;
        ctx.fillStyle = isSelected ? "rgba(239, 68, 68, 0.45)" : "rgba(56, 189, 248, 0.35)";
        ctx.fillRect(-natW / 2, -natD / 2, natW, natD);
        ctx.strokeStyle = isSelected ? "#ef4444" : "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-natW / 2, -natD / 2, natW, natD);

        ctx.fillStyle = "#f8fafc";
        ctx.font = "9px Tahoma";
        ctx.textAlign = "center";
        ctx.fillText(index + 1, 0, 3);

        ctx.restore();
    });
}

function renderQuickLayoutUnitSelect() {
    const select = document.getElementById("quicklayout-unit-select");
    if (!select) return;
    select.innerHTML = "";
    QUICK_LAYOUT_ITEM_DEFS.forEach(def => {
        const opt = document.createElement("option");
        opt.value = def.key;
        opt.textContent = def.label;
        select.appendChild(opt);
    });
}

// 🌟 یونیت جدید دقیقاً با مقادیر فعلیِ فیلدها ساخته می‌شه؛ فیلدها بعدش دست‌نخورده می‌مونن
function addItemToQuickLayoutPreview() {
    const select = document.getElementById("quicklayout-unit-select");
    if (!select || !select.value) return;
    const def = QUICK_LAYOUT_ITEM_DEFS.find(d => d.key === select.value);
    if (!def) return;

    const newItem = {
        key: def.key,
        label: def.label,
        addFn: def.addFn,
        w: parseFloat(document.getElementById("quicklayout-item-w").value) || def.w,
        h: parseFloat(document.getElementById("quicklayout-item-h").value) || 72,
        d: parseFloat(document.getElementById("quicklayout-item-d").value) || def.d,
        elevation: parseFloat(document.getElementById("quicklayout-item-elevation").value) || 0,
        angle: parseFloat(document.getElementById("quicklayout-item-angle").value) || 0,
        x: parseFloat(document.getElementById("quicklayout-item-x").value) || 0,
        y: parseFloat(document.getElementById("quicklayout-item-y").value) || 0,
        doorType: document.getElementById("quicklayout-item-doortype").value,
        doorCount: parseInt(document.getElementById("quicklayout-item-doorcount").value) || 1,
        wall: selectedQuickLayoutWall
    };

    quickLayoutStagedItems.push(newItem);
    selectedStagedItemIndex = -1; // 🌟 برمی‌گردیم به حالت «آماده افزودن بعدی» نه ویرایش همین یکی

    renderQuickLayoutPreview();
    renderQuickLayoutRoomPreview();
    autoUpdateQuickLayoutPosition();
}

function removeItemFromQuickLayoutPreview(index) {
    quickLayoutStagedItems.splice(index, 1);
    if (selectedStagedItemIndex === index) selectedStagedItemIndex = -1;
    else if (selectedStagedItemIndex > index) selectedStagedItemIndex--;
    renderQuickLayoutPreview();
    renderQuickLayoutRoomPreview();
}

function selectStagedItem(index) {
    selectedStagedItemIndex = index;
    const item = quickLayoutStagedItems[index];
    if (item) {
        document.getElementById("quicklayout-item-w").value = item.w;
        document.getElementById("quicklayout-item-h").value = item.h;
        document.getElementById("quicklayout-item-d").value = item.d;
        document.getElementById("quicklayout-item-elevation").value = item.elevation;
        document.getElementById("quicklayout-item-angle").value = item.angle;
        document.getElementById("quicklayout-item-x").value = item.x;
        document.getElementById("quicklayout-item-y").value = item.y;
        document.getElementById("quicklayout-item-doortype").value = item.doorType || "side";
        document.getElementById("quicklayout-item-doorcount").value = item.doorCount || 1;
    }
    renderQuickLayoutPreview();
    renderQuickLayoutRoomPreview();
}

function renderQuickLayoutPreview() {
    const container = document.getElementById("quicklayout-preview");
    if (!container) return;
    container.innerHTML = "";

    if (quickLayoutStagedItems.length === 0) {
        container.innerHTML = '<div style="color:#64748b;">هنوز چیزی اضافه نشده</div>';
        return;
    }

    quickLayoutStagedItems.forEach((item, index) => {
        const isSelected = index === selectedStagedItemIndex;
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 10px; border-radius:6px; cursor:pointer; background:" + (isSelected ? "rgba(56,189,248,0.15)" : "rgba(15,23,42,0.4)") + "; border:1px solid " + (isSelected ? "#38bdf8" : "transparent") + ";";
        row.innerHTML = `<span>${index + 1}. ${item.label}</span>`;
        row.onclick = () => selectStagedItem(index);

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "حذف";
        removeBtn.style.cssText = "background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:11px;";
        removeBtn.onclick = (e) => { e.stopPropagation(); removeItemFromQuickLayoutPreview(index); };
        row.appendChild(removeBtn);

        container.appendChild(row);
    });
}

// 🌟 دقیقاً مثل getRotatedDims تو design.js - وقتی چرخش ۹۰/۲۷۰ باشه، عرض و عمق جابه‌جا می‌شن
function getEffectiveFootprint(item) {
    const rot = Math.round(((item.angle || 0) % 360) / 90) % 4;
    if (rot === 1 || rot === 3) {
        return { w: item.d, d: item.w };
    }
    return { w: item.w, d: item.d };
}

function computeAutoPositionForWall(wallKey, itemW, itemD, itemAngle) {
    const roomW = (typeof room !== "undefined" && room.w) ? room.w : 400;
    const roomD = (typeof room !== "undefined" && room.d) ? room.d : 300;

    const rot = Math.round(((itemAngle || 0) % 360) / 90) % 4;
    const eff = (rot === 1 || rot === 3) ? { w: itemD, d: itemW } : { w: itemW, d: itemD };

    const itemsOnWall = quickLayoutStagedItems.filter(i => i.wall === wallKey);

    let x = 0, y = 0;

    if (wallKey === "top") {
        x = itemsOnWall.length > 0 ? Math.max(...itemsOnWall.map(i => i.x + getEffectiveFootprint(i).w)) : 0;
        y = 0;
    } else if (wallKey === "bottom") {
        x = itemsOnWall.length > 0 ? Math.max(...itemsOnWall.map(i => i.x + getEffectiveFootprint(i).w)) : 0;
        y = roomD - eff.d;
    } else if (wallKey === "left") {
        x = 0;
        // 🌟 اصلاح شد: باید eff.d (بازه‌ی محور Y) باشه، نه eff.w
        y = itemsOnWall.length > 0 ? Math.max(...itemsOnWall.map(i => i.y + getEffectiveFootprint(i).d)) : 0;
    } else if (wallKey === "right") {
        // 🌟 اصلاح شد: فاصله از دیوار راست باید بر اساس eff.w (بازه‌ی محور X) باشه
        x = roomW - eff.w;
        y = itemsOnWall.length > 0 ? Math.max(...itemsOnWall.map(i => i.y + getEffectiveFootprint(i).d)) : 0;
    }

    return { x, y };
}

// 🌟 فیلدهای X/Y رو با موقعیت خودکار پر می‌کنه (فقط وقتی داریم برای «افزودن بعدی» آماده می‌شیم، نه وقتی یه آیتم موجود رو دستی ویرایش می‌کنیم)
function autoUpdateQuickLayoutPosition() {
    if (selectedStagedItemIndex !== -1) return;

    const w = parseFloat(document.getElementById("quicklayout-item-w").value) || 90;
    const d = parseFloat(document.getElementById("quicklayout-item-d").value) || 55;
    const angle = parseFloat(document.getElementById("quicklayout-item-angle").value) || 0;
    const pos = computeAutoPositionForWall(selectedQuickLayoutWall, w, d, angle);

    document.getElementById("quicklayout-item-x").value = pos.x.toFixed(1);
    document.getElementById("quicklayout-item-y").value = pos.y.toFixed(1);
}

function applyQuickLayoutToScene() {
    quickLayoutStagedItems.forEach(item => {
        if (typeof window[item.addFn] !== "function") return;
        window[item.addFn]();

        const newCab = cabinets[cabinets.length - 1];
        if (!newCab) return;

        newCab.w = item.w;
        newCab.h = item.h;
        newCab.d = item.d;
        newCab.elevation = item.elevation;
        newCab.rot = Math.round(((item.angle || 0) % 360) / 90) % 4;
        newCab.angle = newCab.rot * 90;
        newCab.x = item.x;
        newCab.y = item.y;
        newCab.doorType = item.doorType || "side";
        newCab.doors = item.doorCount || 1;
        newCab.doorSizes = null; // 🌟 اجازه بده موتور درب دفعه‌ی بعد که پنل درب باز شد یا رندر سه‌بعدی اجرا شد، خودش سایزهای پیش‌فرض متناسب بسازه
    });

    quickLayoutStagedItems = [];
    selectedStagedItemIndex = -1;
    closeQuickLayoutPanel();
    if (typeof draw === "function") draw();
}
// 🌟 دقیقاً همون محدودیت‌های تعداد درب که تو پنل اصلی درب‌ها (door-editor.js) هست
function getQuickLayoutDoorCountRange(doorType) {
    if (doorType === "combo") return { min: 3, max: 4 };
    if (doorType === "jaki-ghadi") return { min: 3, max: 3 };
    if (doorType === "drawer-ghadi") return { min: 2, max: 3 };
    if (doorType === "lift") return { min: 1, max: 2 };
    if (doorType === "lift-side") return { min: 2, max: 2 };
    if (doorType === "split") return { min: 2, max: 3 };
    if (doorType === "drawer") return { min: 1, max: 1 }; // قفل، تغییر نمی‌کنه
    return { min: 1, max: 4 }; // side و پیش‌فرض‌ها
}

function changeQuickLayoutDoorCount(delta) {
    const input = document.getElementById("quicklayout-item-doorcount");
    const doorType = document.getElementById("quicklayout-item-doortype").value;

    if (doorType === "drawer") return; // مثل پنل اصلی، درب کشو قفله

    const range = getQuickLayoutDoorCountRange(doorType);
    let val = parseInt(input.value) || range.min;
    let newVal = Math.max(range.min, Math.min(range.max, val + delta));

    input.value = newVal;
    onQuickLayoutFieldChange();
}