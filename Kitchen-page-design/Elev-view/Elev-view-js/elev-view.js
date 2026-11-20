// Elev-view/elev-renderer.js
window.elevScale = window.elevScale || 0.4;
window.elevPanOffset = window.elevPanOffset || { x: 0, y: 0 };

let isElevPanning = false;
let elevPanStart = { x: 0, y: 0 };

window.activeElevWall = window.activeElevWall || 'top'; 

let elevCanvas = null;
let elevCtx = null;
let elevContainer = null;

let isElevDraggingUnit = false; 
let selectedElevCabinet = null; 
let unitDragStartOffset = { x: 0, y: 0 }; 

let startX = 0;
let dynamicGroundLineY = 0;

function initElevCanvas() {
    elevCanvas = document.getElementById('kitchenElevCanvas');
    elevContainer = document.getElementById('elev-view-container');
    if (!elevCanvas) return;

    elevCtx = elevCanvas.getContext('2d');
    elevCanvas.style.cursor = "grab";
    elevCanvas.style.position = "absolute";

    const parent = elevCanvas.parentElement;
    if (parent) parent.style.overflow = "hidden";

    elevCanvas.width = (parent.clientWidth || 800) * 2;
    elevCanvas.height = (parent.clientHeight || 600) * 2;
    startX = (elevCanvas.width / 4); 
    dynamicGroundLineY = (elevCanvas.height / 2); 

    parent.removeEventListener("mousedown", handleElevMouseDown);
    parent.addEventListener("mousedown", handleElevMouseDown);
    parent.removeEventListener("touchstart", handleElevMouseDown);
    parent.addEventListener("touchstart", handleElevMouseDown, { passive: false });

    window.removeEventListener("mousemove", handleElevMouseMove);
    window.addEventListener("mousemove", handleElevMouseMove);
    window.removeEventListener("mouseup", handleElevMouseUp);
    window.addEventListener("mouseup", handleElevMouseUp);

    window.removeEventListener("touchmove", handleElevMouseMove);
    window.addEventListener("touchmove", handleElevMouseMove, { passive: false });
    window.removeEventListener("touchend", handleElevMouseUp);
    window.addEventListener("touchend", handleElevMouseUp);

    setElevCanvasTransform();
    drawFrontElevation();
}

function setElevCanvasTransform() {
    if (!elevCanvas) return;
    elevCanvas.style.transform = `translate(${window.elevPanOffset.x}px, ${window.elevPanOffset.y}px)`;
    if (elevContainer) {
        elevContainer.style.backgroundPosition = `calc(50% + ${window.elevPanOffset.x}px) calc(50% + ${window.elevPanOffset.y}px)`;
    }
}

function getElevClientPos(e) {
    return {
        x: e.touches ? e.touches[0].clientX : e.clientX,
        y: e.touches ? e.touches[0].clientY : e.clientY,
    };
}

function getCanvasLocalPos(clientX, clientY) {
    if (!elevCanvas) return { x: 0, y: 0 };
    const rect = elevCanvas.getBoundingClientRect();
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function getCabinetAtPosition(localX, localY) {
    if (typeof cabinets === 'undefined' || !Array.isArray(cabinets)) return null;
    const wallData = getActiveWallData();
    const wallLengthCm = wallData.len;

    // 🔴 محاسبه startX مرکزچین شده
    const wallPixelWidth = wallLengthCm * window.elevScale;
    const currentStartX = (elevCanvas.width - wallPixelWidth) / 2;

    for (let i = cabinets.length - 1; i >= 0; i--) {
        const cabinet = cabinets[i];
        if (cabinet.wall && cabinet.wall !== window.activeElevWall) continue;

        let cabinetPositionOnWall = 0;
        switch (window.activeElevWall) {
            case 'top': cabinetPositionOnWall = cabinet.x; break;
            case 'bottom': cabinetPositionOnWall = wallLengthCm - cabinet.x - cabinet.w; break;
            case 'left': cabinetPositionOnWall = cabinet.y; break;
            case 'right': cabinetPositionOnWall = wallLengthCm - cabinet.y - cabinet.w; break;
        }

        // 🔴 استفاده از currentStartX به جای startX ثابت
        const pixelX = currentStartX + (cabinetPositionOnWall * window.elevScale); 
        const pixelW = cabinet.w * window.elevScale;
        const pixelH = cabinet.h * window.elevScale;
        const cabElevation = typeof cabinet.elevation !== 'undefined' ? cabinet.elevation : (cabinet.elevationFromGround || 0);
        const pixelElevation = cabElevation * window.elevScale;
        const pixelY = dynamicGroundLineY - pixelElevation - pixelH;

        if (localX >= pixelX && localX <= pixelX + pixelW && localY >= pixelY && localY <= pixelY + pixelH) {
            return { cabinet: cabinet, localPixelX: pixelX, localPixelY: pixelY };
        }
    }
        // 🔴 تشخیص کلیک روی چهارچوب کمد دیواری
   const allFramesForHit = window.closetFrameUnits || [];
    for (let fi = allFramesForHit.length - 1; fi >= 0; fi--) {
        const frameUnit = allFramesForHit[fi];
        if (!frameUnit.parts || frameUnit.parts.length === 0) continue;

        const frameThick = 5.5;
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        frameUnit.parts.forEach(p => {
            let pW = p.orientation === 'horizontal' ? p.length : frameThick;
            let pH = p.orientation === 'vertical' ? p.length : frameThick;
            if (p.x < minX) minX = p.x;
            if (p.x + pW > maxX) maxX = p.x + pW;
            if (p.y < minY) minY = p.y;
            if (p.y + pH > maxY) maxY = p.y + pH;
        });

        const frameH = maxY - minY;

        let frameOnWall = 0;
        switch (window.activeElevWall) {
            case 'top': frameOnWall = frameUnit.x; break;
            case 'bottom': frameOnWall = wallLengthCm - frameUnit.x - frameUnit.w; break;
            case 'left': frameOnWall = frameUnit.y; break;
            case 'right': frameOnWall = wallLengthCm - frameUnit.y - frameUnit.w; break;
            default: frameOnWall = frameUnit.x;
        }

        const frameElevation = frameUnit.elevation || 0;
        const pixelX = currentStartX + (frameOnWall * window.elevScale);
        const pixelW = frameUnit.w * window.elevScale;
        const pixelH = frameH * window.elevScale;
        const pixelY = dynamicGroundLineY - ((minY + frameElevation) * window.elevScale) - pixelH;

        if (localX >= pixelX && localX <= pixelX + pixelW && localY >= pixelY && localY <= pixelY + pixelH) {
            return { cabinet: frameUnit, localPixelX: pixelX, localPixelY: pixelY };
        }
    }

    return null;
}


function handleElevMouseDown(e) {
    const clientPos = getElevClientPos(e);
    elevPanStart = clientPos;
    
    const localPos = getCanvasLocalPos(clientPos.x, clientPos.y);
    const hit = getCabinetAtPosition(localPos.x, localPos.y);

    if (hit) {
        isElevDraggingUnit = true;
        selectedElevCabinet = hit.cabinet;
        
        if (typeof selectedId !== 'undefined') {
            selectedId = hit.cabinet.id;
        }
        if (typeof selectCabinet === "function") selectCabinet(hit.cabinet.id);
if (hit.cabinet.parts) { // 🌟 یعنی چهارچوب کمد دیواریه، نه کابینت
            window.selectedClosetFrameId = hit.cabinet.id;
            window.closetFrameUnit = hit.cabinet;
            window.isClosetFrameSelected = true;
        }
        unitDragStartOffset.x = localPos.x - hit.localPixelX;
        unitDragStartOffset.y = localPos.y - hit.localPixelY;
        if (elevCanvas) elevCanvas.style.cursor = "move";
        drawFrontElevation();
    } else {
        isElevPanning = true;
        if (typeof selectedId !== 'undefined') selectedId = -1;
        window.isClosetFrameSelected = false;
        window.selectedClosetFrameId = null;
        if (elevCanvas) elevCanvas.style.cursor = "grabbing";
        drawFrontElevation();
    }
    
    if (typeof updateElevToolbarInputs === 'function') updateElevToolbarInputs();
}

function handleElevMouseMove(e) {
    const currentPos = getElevClientPos(e);
    
    if (isElevPanning) {
        window.elevPanOffset.x += currentPos.x - elevPanStart.x;
        window.elevPanOffset.y += currentPos.y - elevPanStart.y;
        elevPanStart = currentPos;
        setElevCanvasTransform();
    } 
    else if (isElevDraggingUnit && selectedElevCabinet) {
        const localPos = getCanvasLocalPos(currentPos.x, currentPos.y);
        const wallData = getActiveWallData();
        
        // 🔴 محاسبه startX مرکزچین شده در لحظه جابه‌جایی
        const wallPixelWidth = wallData.len * window.elevScale;
        const currentStartX = (elevCanvas.width - wallPixelWidth) / 2;

        // ۱. محاسبه موقعیت خام افقی (Cm)
        const newPixelX = localPos.x - unitDragStartOffset.x;
        let targetX = (newPixelX - currentStartX) / window.elevScale; // 🔴 اصلاح متغیر

        // ۲. محاسبه موقعیت خام عمودی (Cm)
        const newPixelY = localPos.y - unitDragStartOffset.y;
        const newPixelElevation = dynamicGroundLineY - newPixelY - (selectedElevCabinet.h * window.elevScale);
        let targetY = newPixelElevation / window.elevScale;

        // ۳. اعمال چسبندگی (اگر کلید Shift نگه داشته نشده باشد)
        if (!e.shiftKey) {
            const snapped = getSnappedElevPos(selectedElevCabinet, { x: targetX, y: targetY }, 3); // 3cm threshold
            targetX = snapped.x;
            targetY = snapped.y;
        }

        // ۴. اعمال موقعیت افقی نهایی با محدودیت دیوار
        if (!selectedElevCabinet.isLockedX) {
            let newPosOnWallCm = Math.max(0, Math.min(wallData.len - selectedElevCabinet.w, targetX));

            switch (window.activeElevWall) {
                case 'top': selectedElevCabinet.x = newPosOnWallCm; break;
                case 'bottom': selectedElevCabinet.x = wallData.len - newPosOnWallCm - selectedElevCabinet.w; break;
                case 'left': selectedElevCabinet.y = newPosOnWallCm; break;
                case 'right': selectedElevCabinet.y = wallData.len - newPosOnWallCm - selectedElevCabinet.w; break;
            }
        }

        // ۵. اعمال موقعیت عمودی نهایی با محدودیت ارتفاع سقف
        if (!selectedElevCabinet.isLockedH) {
            let newElevationCm = Math.max(0, Math.min(270 - selectedElevCabinet.h, targetY));
            
            selectedElevCabinet.elevation = newElevationCm;
            if (typeof selectedElevCabinet.elevationFromGround !== 'undefined') {
                selectedElevCabinet.elevationFromGround = newElevationCm;
            }
        }

        drawFrontElevation();
        
        if (typeof updateElevToolbarInputs === 'function') updateElevToolbarInputs();
        if (typeof renderList === 'function') renderList();
        if (typeof draw === 'function') draw(); 
    }
}


function handleElevMouseUp() {
    isElevPanning = false;
    isElevDraggingUnit = false;
    selectedElevCabinet = null;
    if (elevCanvas) elevCanvas.style.cursor = "grab";
    if (typeof init3D === "function") init3D();
}

function getActiveWallData() {
    if (typeof room === 'undefined' || !room.walls) {
        return { name: "بالا", len: 400 };
    }
    
    const wallKey = window.activeElevWall || 'top';
    const wall = room.walls[wallKey];
    
    const wallNames = {
        top: "دیوار بالا (پشتی)",
        bottom: "دیوار پایین (جلویی)",
        left: "دیوار چپ",
        right: "دیوار راست"
    };

    if (wall) {
        return {
            key: wallKey,
            name: wallNames[wallKey] || wallKey,
            len: parseFloat(wall.len) || 400
        };
    }
    return { name: "دیوار اصلی", len: room.w || 400 };
}

function getMaterialStyleForCanvas(ctx, materialValue, defaultColor) {
    if (!materialValue) return defaultColor;

    if (typeof materialValue === 'string' && (materialValue.startsWith('#') || materialValue.startsWith('rgb'))) {
        return materialValue;
    }

    if (materialValue.map && materialValue.map.image) {
        const img = materialValue.map.image;
        if (img.complete && img.width > 0) {
            try {
                const pattern = ctx.createPattern(img, 'repeat');
                if (pattern) {
                    if (pattern.setTransform && typeof DOMMatrix !== 'undefined') {
                        const matrix = new DOMMatrix().scale(window.elevScale * 0.5, window.elevScale * 0.5);
                        pattern.setTransform(matrix);
                    }
                    return pattern;
                }
            } catch (e) {
                console.warn("خطا در ساخت پترن نمای روبرو:", e);
            }
        }
    }

    if (materialValue.color && materialValue.color.isColor) {
        return `#${materialValue.color.getHexString()}`;
    }
    return defaultColor;
}

// 🟢 تابع جامع ترسیم یک لنگه درب/کشو در نمای روبرو
function drawSingleDoorDetailed(ctx, x, y, w, h, style, hingeSide, isGlass, cabinet) {
    if (w <= 0 || h <= 0) return;

    ctx.save();
    
    // ۱. اگر شیشه‌ای باشد، ابتدا قاب چوبی و سپس شیشه داخلی رسم شود
    if (isGlass) {
        const frameThick = Math.max(3, 6 * window.elevScale);
        ctx.fillStyle = style;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        const glassX = x + frameThick;
        const glassY = y + frameThick;
        const glassW = w - (2 * frameThick);
        const glassH = h - (2 * frameThick);

        if (glassW > 0 && glassH > 0) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.fillRect(glassX, glassY, glassW, glassH);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.strokeRect(glassX, glassY, glassW, glassH);

            // خط رفلکس روی شیشه
            ctx.beginPath();
            ctx.moveTo(glassX + 4, glassY + glassH - 4);
            ctx.lineTo(glassX + glassW - 4, glassY + 4);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    } else {
        ctx.fillStyle = style;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#38bdf8'; 
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(x, y + h - 3, w, 3);
    }

    // ۲. خطوط راهنمای جهت بازشو لولا
    if (hingeSide && hingeSide !== 'none') {
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        
        if (hingeSide === 'left') {
            ctx.moveTo(x, y);
            ctx.lineTo(x + w, y + (h / 2));
            ctx.lineTo(x, y + h);
        } else if (hingeSide === 'right') {
            ctx.moveTo(x + w, y);
            ctx.lineTo(x, y + (h / 2));
            ctx.lineTo(x + w, y + h);
        } else if (hingeSide === 'top') { // جکی
            ctx.moveTo(x, y);
            ctx.lineTo(x + (w / 2), y + h);
            ctx.lineTo(x + w, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    ctx.restore();
}

// 🟢 مدیریت هوشمند چیدمان تمام انواع درب‌ها بر اساس تنظیمات پنل
function drawCabinetDoorsInElev(ctx, cabinet, pixelX, pixelY, pixelW, pixelH) {
    if (cabinet.showDoors === false) return; // عدم نمایش درب

    let doorType = cabinet.doorType || "side";
    let doorsCount = cabinet.doors || 2;
    const isGlass = cabinet.isGlassDoor === true;
    const padding = 2;

    if (cabinet.isDrawerBody) {
        doorType = "drawer";
        doorsCount = cabinet.drawersCount || (cabinet.drawersData ? cabinet.drawersData.length : 3);
    } else if (cabinet.isBaseWithDrawer) {
        doorType = "drawer-ghadi";
    }

    const defaultDoorStyle = getMaterialStyleForCanvas(ctx, cabinet.doorMaterialValue || cabinet.doorColor, 'rgba(51, 65, 85, 0.9)');
    const doorDirections = cabinet.doorDirections || [];
    const customSizes = cabinet.doorSizes || [];

    // ۱. حالت لولایی افقی (side)
    if (doorType === "side") {
        const slotW = pixelW / doorsCount;
        for (let i = 0; i < doorsCount; i++) {
            if (customSizes[i]?.enabled === false) continue;
            const dX = pixelX + (i * slotW) + padding;
            const dY = pixelY + padding;
            const dW = slotW - (padding * 2);
            const dH = pixelH - (padding * 2);
            const hinge = doorDirections[i] || (i % 2 === 0 ? 'left' : 'right');
            drawSingleDoorDetailed(ctx, dX, dY, dW, dH, defaultDoorStyle, hinge, isGlass, cabinet);
        }
    }
    // ۲. حالت جکی (lift) یا قدی دو تکه (split)
    else if (doorType === "lift" || doorType === "split") {
        const count = doorType === "split" ? Math.min(Math.max(doorsCount, 2), 3) : doorsCount;
        const slotH = pixelH / count;
        for (let i = 0; i < count; i++) {
            if (customSizes[i]?.enabled === false) continue;
            const dX = pixelX + padding;
            const dY = pixelY + (i * slotH) + padding;
            const dW = pixelW - (padding * 2);
            const dH = slotH - (padding * 2);
            const hinge = doorType === "lift" ? 'top' : (doorDirections[i] || 'left');
            drawSingleDoorDetailed(ctx, dX, dY, dW, dH, defaultDoorStyle, hinge, isGlass, cabinet);
        }
    }
    // ۳. حالت جکی کنار هم (lift-side)
    else if (doorType === "lift-side") {
        const slotW = pixelW / 2;
        for (let i = 0; i < 2; i++) {
            if (customSizes[i]?.enabled === false) continue;
            const dX = pixelX + (i * slotW) + padding;
            const dY = pixelY + padding;
            const dW = slotW - (padding * 2);
            const dH = pixelH - (padding * 2);
            drawSingleDoorDetailed(ctx, dX, dY, dW, dH, defaultDoorStyle, 'top', isGlass, cabinet);
        }
    }
    // ۴. حالت ترکیبی (combo) 👈 [بخش اضافه شده برای حل مشکل]
    else if (doorType === "combo") {
        if (doorsCount === 3) {
            const layout = cabinet.comboLayout || 'left-big';
            const bigW = pixelW * 0.4;
            const smallW = pixelW * 0.6;
            const smallH = pixelH / 2;

            if (layout === 'left-big' || layout === 'left') {
                // درب بزرگ سمت چپ (ایندکس 0) + دو درب کوچک سمت راست (ایندکس 1 و 2)
                if (customSizes[0]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + padding, pixelY + padding, bigW - (padding * 2), pixelH - (padding * 2), defaultDoorStyle, doorDirections[0] || 'left', isGlass, cabinet);
                if (customSizes[1]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + bigW + padding, pixelY + padding, smallW - (padding * 2), smallH - (padding * 2), defaultDoorStyle, doorDirections[1] || 'right', isGlass, cabinet);
                if (customSizes[2]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + bigW + padding, pixelY + smallH + padding, smallW - (padding * 2), smallH - (padding * 2), defaultDoorStyle, doorDirections[2] || 'right', isGlass, cabinet);
            } else {
                // دو درب کوچک سمت چپ (ایندکس 1 و 2) + درب بزرگ سمت راست (ایندکس 0)
                if (customSizes[1]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + padding, pixelY + padding, smallW - (padding * 2), smallH - (padding * 2), defaultDoorStyle, doorDirections[1] || 'left', isGlass, cabinet);
                if (customSizes[2]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + padding, pixelY + smallH + padding, smallW - (padding * 2), smallH - (padding * 2), defaultDoorStyle, doorDirections[2] || 'left', isGlass, cabinet);
                if (customSizes[0]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + smallW + padding, pixelY + padding, bigW - (padding * 2), pixelH - (padding * 2), defaultDoorStyle, doorDirections[0] || 'right', isGlass, cabinet);
            }
        } else if (doorsCount === 4) {
            const halfW = pixelW / 2;
            const halfH = pixelH / 2;

            if (customSizes[0]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + padding, pixelY + padding, halfW - (padding * 2), halfH - (padding * 2), defaultDoorStyle, doorDirections[0] || 'left', isGlass, cabinet);
            if (customSizes[1]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + halfW + padding, pixelY + padding, halfW - (padding * 2), halfH - (padding * 2), defaultDoorStyle, doorDirections[1] || 'right', isGlass, cabinet);
            if (customSizes[2]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + padding, pixelY + halfH + padding, halfW - (padding * 2), halfH - (padding * 2), defaultDoorStyle, doorDirections[2] || 'left', isGlass, cabinet);
            if (customSizes[3]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + halfW + padding, pixelY + halfH + padding, halfW - (padding * 2), halfH - (padding * 2), defaultDoorStyle, doorDirections[3] || 'right', isGlass, cabinet);
        }
    }
    // ۵. حالت کشو (drawer)
    else if (doorType === "drawer") {
        const slotH = pixelH / doorsCount;
        for (let i = 0; i < doorsCount; i++) {
            if (customSizes[i]?.enabled === false) continue;
            const dX = pixelX + padding;
            const dY = pixelY + (i * slotH) + padding;
            const dW = pixelW - (padding * 2);
            const dH = slotH - (padding * 2);

            let drawerStyle = defaultDoorStyle;
            if (customSizes[i]?.doorColor) {
                drawerStyle = getMaterialStyleForCanvas(ctx, customSizes[i].doorColor, defaultDoorStyle);
            }

            drawSingleDoorDetailed(ctx, dX, dY, dW, dH, drawerStyle, 'none', false, cabinet);
        }
    }
    // ۶. حالت کشو و قدی (drawer-ghadi)
    else if (doorType === "drawer-ghadi") {
        const drawerH = pixelH * 0.25;
        const doorsH = pixelH - drawerH;
        const bottomDoorsCount = doorsCount > 1 ? doorsCount - 1 : 1;
        const bottomDoorW = pixelW / bottomDoorsCount;

        for (let i = 0; i < doorsCount; i++) {
            if (customSizes[i]?.enabled === false) continue;
            const isDrawer = (i === 0);

            if (isDrawer) {
                const dX = pixelX + padding;
                const dY = pixelY + padding;
                const dW = pixelW - (padding * 2);
                const dH = drawerH - (padding * 2);
                let drawerStyle = defaultDoorStyle;
                if (customSizes[0]?.doorColor) {
                    drawerStyle = getMaterialStyleForCanvas(ctx, customSizes[0].doorColor, defaultDoorStyle);
                }
                drawSingleDoorDetailed(ctx, dX, dY, dW, dH, drawerStyle, 'none', false, cabinet);
            } else {
                const bIdx = i - 1;
                const dX = pixelX + (bIdx * bottomDoorW) + padding;
                const dY = pixelY + drawerH + padding;
                const dW = bottomDoorW - (padding * 2);
                const dH = doorsH - (padding * 2);
                const hinge = doorDirections[i] || (bIdx % 2 === 0 ? 'left' : 'right');
                drawSingleDoorDetailed(ctx, dX, dY, dW, dH, defaultDoorStyle, hinge, isGlass, cabinet);
            }
        }
    }
    // ۷. حالت جکی و قدی (jaki-ghadi)
    else if (doorType === "jaki-ghadi") {
        const layout = cabinet.jakiGhadiLayout || 'top';
        const jakiH = pixelH * 0.4;
        const ghadiH = pixelH - jakiH;
        const ghadiW = pixelW / 2;

        if (layout === 'bottom') {
            if (customSizes[0]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + padding, pixelY + padding, ghadiW - (padding * 2), ghadiH - (padding * 2), defaultDoorStyle, doorDirections[0] || 'left', isGlass, cabinet);
            if (customSizes[1]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + ghadiW + padding, pixelY + padding, ghadiW - (padding * 2), ghadiH - (padding * 2), defaultDoorStyle, doorDirections[1] || 'right', isGlass, cabinet);
            if (customSizes[2]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + padding, pixelY + ghadiH + padding, pixelW - (padding * 2), jakiH - (padding * 2), defaultDoorStyle, 'top', isGlass, cabinet);
        } else {
            if (customSizes[2]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + padding, pixelY + padding, pixelW - (padding * 2), jakiH - (padding * 2), defaultDoorStyle, 'top', isGlass, cabinet);
            if (customSizes[0]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + padding, pixelY + jakiH + padding, ghadiW - (padding * 2), ghadiH - (padding * 2), defaultDoorStyle, doorDirections[0] || 'left', isGlass, cabinet);
            if (customSizes[1]?.enabled !== false) drawSingleDoorDetailed(ctx, pixelX + ghadiW + padding, pixelY + jakiH + padding, ghadiW - (padding * 2), ghadiH - (padding * 2), defaultDoorStyle, doorDirections[1] || 'right', isGlass, cabinet);
        }
    }
    // ۸. پیش‌فرض
    else {
        const dX = pixelX + padding;
        const dY = pixelY + padding;
        const dW = pixelW - (padding * 2);
        const dH = pixelH - (padding * 2);
        drawSingleDoorDetailed(ctx, dX, dY, dW, dH, defaultDoorStyle, 'left', isGlass, cabinet);
    }
}


function drawFrontElevation() {
    if (!elevCanvas || !elevCtx) {
        initElevCanvas();
    }
    if (!elevCtx) return;

    elevCtx.clearRect(0, 0, elevCanvas.width, elevCanvas.height);
    elevCtx.save();

    const wallData = getActiveWallData();
    const wallLengthCm = wallData.len;
    
    // ۱. محاسبه عرض دیوار و مرکزچین کردن دقیق نقطه شروع
    const wallPixelWidth = wallLengthCm * window.elevScale;
    const startX = (elevCanvas.width - wallPixelWidth) / 2; 
    
    // ۲. تنظیم نقطه پایانی و خط زمین در مرکز عمودی
    const endX = startX + wallPixelWidth; 
    const dynamicGroundLineY = (elevCanvas.height / 2); 
    
    const physicalOneCmInPixel = 1 * window.elevScale; 
    const adjustedGroundY = dynamicGroundLineY + physicalOneCmInPixel; 
    const floorThickness = 12; 

    // رسم کف
    elevCtx.fillStyle = 'rgba(56, 189, 248, 0.25)'; 
    elevCtx.fillRect(startX, adjustedGroundY, endX - startX, floorThickness);

    elevCtx.beginPath();
    elevCtx.rect(startX, adjustedGroundY, endX - startX, floorThickness);
    elevCtx.strokeStyle = '#38bdf8'; 
    elevCtx.lineWidth = 2; 
    elevCtx.stroke();

    elevCtx.beginPath();
    elevCtx.moveTo(startX, adjustedGroundY);
    elevCtx.lineTo(endX, adjustedGroundY);
    elevCtx.strokeStyle = '#38bdf8';
    elevCtx.lineWidth = 4; 
    elevCtx.stroke();

    // فلش اندازه‌گیری
    const tickHeight = 8;
    elevCtx.beginPath();
    elevCtx.moveTo(startX, dynamicGroundLineY - tickHeight);
    elevCtx.lineTo(startX, dynamicGroundLineY + tickHeight);
    elevCtx.moveTo(endX, dynamicGroundLineY - tickHeight);
    elevCtx.lineTo(endX, dynamicGroundLineY + tickHeight);
    elevCtx.strokeStyle = '#38bdf8';
    elevCtx.lineWidth = 2;
    elevCtx.stroke();

    elevCtx.fillStyle = '#38bdf8';
    elevCtx.font = 'bold 12px tahoma';
    elevCtx.textAlign = 'center';
    elevCtx.fillText(`↔️ ${wallData.name}: ${wallLengthCm} cm`, startX + ((endX - startX) / 2), dynamicGroundLineY + 25);

    

    const globalSelectedId = (typeof selectedId !== 'undefined') ? selectedId : null;

    // -------------------------------------------------------------
    // 🌟 رسم چهارچوب کمد دیواری (Closet Frame) در نمای روبرو
    // -------------------------------------------------------------
    const allClosetFrames = window.closetFrameUnits || [];
    allClosetFrames.forEach(frameUnit => {
        if (!frameUnit.parts || !Array.isArray(frameUnit.parts) || frameUnit.parts.length === 0) return;

        const frameThickCm = 5.5;

        // 🌟 نرمال‌سازی نسبت به کوچیک‌ترین x قطعات (دقیقاً هم‌راستا با نمای سه‌بعدی)
        let minPartX = Infinity;
        frameUnit.parts.forEach(p => { if (p.x < minPartX) minPartX = p.x; });
        if (minPartX === Infinity) minPartX = 0;

        // 🌟 موقعیت افقی چهارچوب روی دیوار فعال، دقیقاً مثل کابینت‌ها
        let frameOnWall = 0;
        switch (window.activeElevWall) {
            case 'top': frameOnWall = frameUnit.x; break;
            case 'bottom': frameOnWall = wallLengthCm - frameUnit.x - frameUnit.w; break;
            case 'left': frameOnWall = frameUnit.y; break;
            case 'right': frameOnWall = wallLengthCm - frameUnit.y - frameUnit.w; break;
            default: frameOnWall = frameUnit.x;
        }

        elevCtx.save();

        frameUnit.parts.forEach(part => {
            const pLength = part.length || 100;
            const pY = part.y || 0;

            let pW = part.orientation === 'horizontal' ? pLength : frameThickCm;
            let pH = part.orientation === 'vertical' ? pLength : frameThickCm;

            const frameElevation = frameUnit.elevation || 0; // 🌟 ارتفاع از کف اتاق
            const localPartX = (part.x - minPartX) + frameOnWall;
            const partPixelX = startX + (localPartX * window.elevScale);
            const partPixelW = pW * window.elevScale;
            const partPixelH = pH * window.elevScale;
            const partPixelY = dynamicGroundLineY - ((pY + frameElevation) * window.elevScale) - partPixelH;

            const isSelectedFrame = (globalSelectedId === frameUnit.id || window.selectedClosetFrameId === frameUnit.id);
            const frameStyle = getMaterialStyleForCanvas(elevCtx, frameUnit.materialValue || frameUnit.color, '#334155');

            elevCtx.fillStyle = frameStyle;
            elevCtx.fillRect(partPixelX, partPixelY, partPixelW, partPixelH);

            elevCtx.strokeStyle = isSelectedFrame ? '#38bdf8' : '#0284c7';
            elevCtx.lineWidth = isSelectedFrame ? 2.5 : 1.5;
            elevCtx.strokeRect(partPixelX, partPixelY, partPixelW, partPixelH);

            elevCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            elevCtx.fillRect(partPixelX, partPixelY + partPixelH - 2, partPixelW, 2);
        });

        elevCtx.restore();
    });
if (typeof cabinets === 'undefined' || !Array.isArray(cabinets) || cabinets.length === 0) {
        elevCtx.restore();
        return;
    }

    cabinets.forEach(cabinet => {
        if (cabinet.wall && cabinet.wall !== window.activeElevWall) return;

        let cabinetPositionOnWall = 0;
        switch (window.activeElevWall) {
            case 'top': cabinetPositionOnWall = cabinet.x; break;
            case 'bottom': cabinetPositionOnWall = wallLengthCm - cabinet.x - cabinet.w; break;
            case 'left': cabinetPositionOnWall = cabinet.y; break;
            case 'right': cabinetPositionOnWall = wallLengthCm - cabinet.y - cabinet.w; break;
            default: cabinetPositionOnWall = cabinet.x;
        }

        const pixelX = startX + (cabinetPositionOnWall * window.elevScale); 
        const pixelW = cabinet.w * window.elevScale;
        const pixelH = cabinet.h * window.elevScale;
        
        const cabElevation = typeof cabinet.elevation !== 'undefined' ? cabinet.elevation : (cabinet.elevationFromGround || 0);
        const pixelElevation = cabElevation * window.elevScale;
        const pixelY = dynamicGroundLineY - pixelElevation - pixelH;

        const isSelected = (globalSelectedId === cabinet.id);
        const strokeColor = isSelected ? '#4caf50' : '#475569';
        const strokeWidth = isSelected ? 3 : 1.5;
        // -------------------------------------------------------------
        // 🌟 ساختار اختصاصی: کلاف هود + هود فلزی (isHoodWrap)
        // -------------------------------------------------------------
        if (cabinet.isHoodWrap) {
            const thicknessCm = cabinet.thickness || 1.6;
            const thickPx = thicknessCm * window.elevScale;

            const sidesStyle = getMaterialStyleForCanvas(elevCtx, cabinet.hoodSidesMaterialValue || cabinet.color || cabinet.doorColor, 'rgba(30, 41, 59, 0.9)');
            const backStyle = getMaterialStyleForCanvas(elevCtx, cabinet.hoodBackMaterialValue || cabinet.color || cabinet.doorColor, 'rgba(15, 23, 42, 0.8)');
            const ceilingStyle = getMaterialStyleForCanvas(elevCtx, cabinet.hoodCeilingMaterialValue || cabinet.color || cabinet.doorColor, 'rgba(51, 65, 85, 0.9)');

            // ۱. رسم ورق پشت کلاف (در صورت فعال بودن enableHoodBack)
            if (cabinet.enableHoodBack !== false) {
                elevCtx.fillStyle = backStyle;
                elevCtx.fillRect(pixelX, pixelY, pixelW, pixelH);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(pixelX, pixelY, pixelW, pixelH);
            }

            // ۲. رسم دیواره‌های ۱۶ میل چپ و راست (در صورت فعال بودن enableHoodSides)
            if (cabinet.enableHoodSides !== false) {
                // دیواره چپ
                elevCtx.fillStyle = sidesStyle;
                elevCtx.fillRect(pixelX, pixelY, thickPx, pixelH);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(pixelX, pixelY, thickPx, pixelH);

                // دیواره راست
                elevCtx.fillRect(pixelX + pixelW - thickPx, pixelY, thickPx, pixelH);
                elevCtx.strokeRect(pixelX + pixelW - thickPx, pixelY, thickPx, pixelH);
            }

            // ۳. رسم سقف کلاف (در صورت فعال بودن enableHoodCeiling)
            if (cabinet.enableHoodCeiling !== false) {
                const topX = (cabinet.enableHoodSides !== false) ? pixelX + thickPx : pixelX;
                const topW = (cabinet.enableHoodSides !== false) ? pixelW - (2 * thickPx) : pixelW;

                elevCtx.fillStyle = ceilingStyle;
                elevCtx.fillRect(topX, pixelY, topW, thickPx);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(topX, pixelY, topW, thickPx);
            }

            // ۴. رسم هود فلزی شماتیک داخل کلاف (در صورت فعال بودن showMetalHood)
            if (cabinet.showMetalHood !== false) {
                const hasSides = cabinet.enableHoodSides !== false;
                const innerX = hasSides ? pixelX + thickPx : pixelX;
                const innerW = hasSides ? pixelW - (2 * thickPx) : pixelW;

                // الف) پایه هود / فیلتر (ارتفاع ۵ سانتی‌متر ثابت در پایین)
                const baseHCm = 5.0;
                const baseHPx = baseHCm * window.elevScale;
                const baseY = pixelY + pixelH - baseHPx;

                elevCtx.fillStyle = "#94a3b8"; // رنگ فلزی
                elevCtx.fillRect(innerX + 2, baseY, innerW - 4, baseHPx);
                elevCtx.strokeStyle = "#475569";
                elevCtx.lineWidth = 1.5;
                elevCtx.strokeRect(innerX + 2, baseY, innerW - 4, baseHPx);

                // شیارهای فیلتر مکش
                elevCtx.strokeStyle = "#334155";
                elevCtx.lineWidth = 1;
                const filterLines = 3;
                const lineSpacing = (innerW - 10) / (filterLines + 1);
                for (let i = 1; i <= filterLines; i++) {
                    elevCtx.beginPath();
                    elevCtx.moveTo(innerX + 5 + (i * lineSpacing), baseY + 2);
                    elevCtx.lineTo(innerX + 5 + (i * lineSpacing), baseY + baseHPx - 2);
                    elevCtx.stroke();
                }

                // ب) دودکش فلزی هود (داینامیک بر اساس hoodCeilingHeight)
                const totalHoodHCm = cabinet.hoodCeilingHeight !== undefined ? parseFloat(cabinet.hoodCeilingHeight) : 40;
                const chimneyHCm = Math.max(1.0, totalHoodHCm - baseHCm);
                const chimneyHPx = chimneyHCm * window.elevScale;

                const chimneyWPx = pixelW * 0.5; // عرض ۵۰ درصد کلاف
                const chimneyX = pixelX + (pixelW - chimneyWPx) / 2;
                const chimneyY = baseY - chimneyHPx;

                elevCtx.fillStyle = "#cbd5e1"; // رنگ فلز دودکش
                elevCtx.fillRect(chimneyX, chimneyY, chimneyWPx, chimneyHPx);
                elevCtx.strokeStyle = "#475569";
                elevCtx.lineWidth = 1.5;
                elevCtx.strokeRect(chimneyX, chimneyY, chimneyWPx, chimneyHPx);
            }

            // متن اندازه عرض کلاف
            elevCtx.fillStyle = '#38bdf8';
            elevCtx.font = 'bold 11px tahoma';
            elevCtx.textAlign = 'center';
            elevCtx.fillText(`${cabinet.w}cm`, pixelX + (pixelW / 2), pixelY - 10);

            return; // خروج برای عدم اجرای کد یونیت‌های معمولی
        }

        // -------------------------------------------------------------
        // 🌟 ساختار اختصاصی: کلاف/باکس یخچال (isFridgeWrap)
        // -------------------------------------------------------------
        if (cabinet.isFridgeWrap) {
            const thicknessCm = cabinet.thickness || 1.6;
            const thickPx = thicknessCm * window.elevScale;

            const leftHCm = cabinet.leftH || cabinet.h;
            const rightHCm = cabinet.rightH || cabinet.h;
            const leftHPx = leftHCm * window.elevScale;
            const rightHPx = rightHCm * window.elevScale;

            const bridgeHCm = cabinet.bridgeH || 40;
            const bridgeHPx = bridgeHCm * window.elevScale;

            const leftStyle = getMaterialStyleForCanvas(elevCtx, cabinet.leftMaterialValue || cabinet.bodyColor, 'rgba(30, 41, 59, 0.9)');
            const rightStyle = getMaterialStyleForCanvas(elevCtx, cabinet.rightMaterialValue || cabinet.bodyColor, 'rgba(30, 41, 59, 0.9)');
            const bodyStyle = getMaterialStyleForCanvas(elevCtx, cabinet.bodyMaterialValue || cabinet.bodyColor, 'rgba(30, 41, 59, 0.8)');

            // ۱. دیواره قدی چپ
            if (cabinet.hasLeft !== false) {
                const leftY = dynamicGroundLineY - (cabElevation * window.elevScale) - leftHPx;
                elevCtx.fillStyle = leftStyle;
                elevCtx.fillRect(pixelX, leftY, thickPx, leftHPx);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(pixelX, leftY, thickPx, leftHPx);
            }

            // ۲. دیواره قدی راست
            if (cabinet.hasRight !== false) {
                const rightX = pixelX + pixelW - thickPx;
                const rightY = dynamicGroundLineY - (cabElevation * window.elevScale) - rightHPx;
                elevCtx.fillStyle = rightStyle;
                elevCtx.fillRect(rightX, rightY, thickPx, rightHPx);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(rightX, rightY, thickPx, rightHPx);
            }

            // ۳. یونیت باکس هوایی
            if (cabinet.hasBridge !== false) {
                const hasLeftWall = cabinet.hasLeft !== false;
                const hasRightWall = cabinet.hasRight !== false;

                const topBoxX = pixelX + (hasLeftWall ? thickPx : 0);
                const topBoxW = pixelW - (hasLeftWall ? thickPx : 0) - (hasRightWall ? thickPx : 0);

                let bridgeYFromGroundCm = cabinet.bridgeY !== undefined ? parseFloat(cabinet.bridgeY) : (cabinet.h - bridgeHCm);
                const bridgePixelY = dynamicGroundLineY - ((cabElevation + bridgeYFromGroundCm + bridgeHCm) * window.elevScale);

                elevCtx.fillStyle = bodyStyle;
                elevCtx.fillRect(topBoxX, bridgePixelY, topBoxW, bridgeHPx);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(topBoxX, bridgePixelY, topBoxW, bridgeHPx);

                drawCabinetDoorsInElev(elevCtx, cabinet, topBoxX, bridgePixelY, topBoxW, bridgeHPx);
            }

            // متن اندازه عرض کلی
            elevCtx.fillStyle = '#38bdf8'; 
            elevCtx.font = 'bold 11px tahoma';
            elevCtx.textAlign = 'center';
            elevCtx.fillText(`${cabinet.w}cm`, pixelX + (pixelW / 2), pixelY - 10);

            return;
        }

        // -------------------------------------------------------------
        // 🌟 ساختار اختصاصی: وسایل برقی (یخچال، لباسشویی، ظرفشویی)
        // -------------------------------------------------------------
        if (cabinet.isAppliance) {
            const label = cabinet.label || '';
            const isFridge = cabinet.h > 150 || label.includes('یخچال');

            elevCtx.save();

            // الف) رسم یخچال
            if (isFridge) {
                const doorCount = cabinet.doors || 1;

                // بدنه اصلی یخچال
                elevCtx.fillStyle = "#cbd5e1"; // رنگ بدنه استیل/طوسی
                elevCtx.fillRect(pixelX, pixelY, pixelW, pixelH);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(pixelX, pixelY, pixelW, pixelH);

                elevCtx.fillStyle = "#f1f5f9"; // درب‌ها
                elevCtx.strokeStyle = "#475569";
                elevCtx.lineWidth = 1.5;

                if (doorCount === 1) {
                    // یخچال تک‌درب (دو فریزر بالا/درب پایین)
                    const topH = pixelH * 0.3;
                    const bottomH = pixelH * 0.7 - 6;

                    // درب بالا
                    elevCtx.fillRect(pixelX + 3, pixelY + 3, pixelW - 6, topH);
                    elevCtx.strokeRect(pixelX + 3, pixelY + 3, pixelW - 6, topH);

                    // درب پایین
                    elevCtx.fillRect(pixelX + 3, pixelY + topH + 6, pixelW - 6, bottomH);
                    elevCtx.strokeRect(pixelX + 3, pixelY + topH + 6, pixelW - 6, bottomH);

                    // دستگیره‌ها
                    elevCtx.fillStyle = "#334155";
                    const handleW = Math.max(3, 4 * window.elevScale);
                    elevCtx.fillRect(pixelX + pixelW - 12, pixelY + topH - 25, handleW, 20);
                    elevCtx.fillRect(pixelX + pixelW - 12, pixelY + topH + 15, handleW, 35);
                } else {
                    // یخچال ساید بای ساید (دو درب عمودی)
                    const halfW = (pixelW - 8) / 2;

                    // درب چپ
                    elevCtx.fillRect(pixelX + 3, pixelY + 3, halfW, pixelH - 6);
                    elevCtx.strokeRect(pixelX + 3, pixelY + 3, halfW, pixelH - 6);

                    // درب راست
                    elevCtx.fillRect(pixelX + 5 + halfW, pixelY + 3, halfW, pixelH - 6);
                    elevCtx.strokeRect(pixelX + 5 + halfW, pixelY + 3, halfW, pixelH - 6);

                    // دستگیره‌های مرکز
                    elevCtx.fillStyle = "#334155";
                    const handleW = Math.max(3, 4 * window.elevScale);
                    const handleH = Math.min(60, pixelH * 0.3);
                    elevCtx.fillRect(pixelX + 3 + halfW - 8, pixelY + (pixelH / 2) - (handleH / 2), handleW, handleH);
                    elevCtx.fillRect(pixelX + 5 + halfW + 4, pixelY + (pixelH / 2) - (handleH / 2), handleW, handleH);
                }
            } 
            // ب) رسم ماشین لباسشویی
            else if (label.includes('لباسشویی')) {
                // بدنه
                elevCtx.fillStyle = "#e2e8f0";
                elevCtx.fillRect(pixelX, pixelY, pixelW, pixelH);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(pixelX, pixelY, pixelW, pixelH);

                // پنل کلیدها و دیجیتال بالا
                const panelH = pixelH * 0.2;
                elevCtx.fillStyle = "#cbd5e1";
                elevCtx.fillRect(pixelX + 2, pixelY + 2, pixelW - 4, panelH);
                elevCtx.strokeRect(pixelX + 2, pixelY + 2, pixelW - 4, panelH);

                // جادکمه‌ای و ولوم گرد
                elevCtx.fillStyle = "#475569";
                elevCtx.beginPath();
                elevCtx.arc(pixelX + (pixelW * 0.75), pixelY + (panelH / 2) + 2, Math.min(8, panelH * 0.3), 0, Math.PI * 2);
                elevCtx.fill();

                // درب گرد شیشه‌ای لباسشویی
                const doorRadius = Math.min(pixelW, pixelH) * 0.3;
                const doorCenterX = pixelX + (pixelW / 2);
                const doorCenterY = pixelY + panelH + ((pixelH - panelH) / 2);

                elevCtx.beginPath();
                elevCtx.arc(doorCenterX, doorCenterY, doorRadius, 0, Math.PI * 2);
                elevCtx.fillStyle = "#94a3b8";
                elevCtx.fill();
                elevCtx.strokeStyle = "#334155";
                elevCtx.lineWidth = 2;
                elevCtx.stroke();

                // شیشه داخلی
                elevCtx.beginPath();
                elevCtx.arc(doorCenterX, doorCenterY, doorRadius * 0.7, 0, Math.PI * 2);
                elevCtx.fillStyle = "rgba(56, 189, 248, 0.4)";
                elevCtx.fill();
            } 
            // ج) رسم ماشین ظرفشویی
            else if (label.includes('ظرفشویی')) {
                // بدنه
                elevCtx.fillStyle = "#e2e8f0";
                elevCtx.fillRect(pixelX, pixelY, pixelW, pixelH);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(pixelX, pixelY, pixelW, pixelH);

                // پنل کنترل بالای ظرفشویی
                const panelH = pixelH * 0.15;
                elevCtx.fillStyle = "#334155";
                elevCtx.fillRect(pixelX + 3, pixelY + 3, pixelW - 6, panelH);

                // درب اصلی
                elevCtx.fillStyle = "#f1f5f9";
                elevCtx.fillRect(pixelX + 3, pixelY + panelH + 5, pixelW - 6, pixelH - panelH - 8);
                elevCtx.strokeStyle = "#94a3b8";
                elevCtx.lineWidth = 1.5;
                elevCtx.strokeRect(pixelX + 3, pixelY + panelH + 5, pixelW - 6, pixelH - panelH - 8);

                // دستگیره افقی بالایی
                elevCtx.fillStyle = "#64748b";
                elevCtx.fillRect(pixelX + (pixelW * 0.2), pixelY + panelH + 12, pixelW * 0.6, 4);
            } 
            // د) سایر وسایل برقی پیش‌فرض
            else {
                elevCtx.fillStyle = "#cbd5e1";
                elevCtx.fillRect(pixelX, pixelY, pixelW, pixelH);
                elevCtx.strokeStyle = strokeColor;
                elevCtx.lineWidth = strokeWidth;
                elevCtx.strokeRect(pixelX, pixelY, pixelW, pixelH);
            }

            elevCtx.restore();

            // متن اندازه عرض کلی
            elevCtx.fillStyle = '#38bdf8'; 
            elevCtx.font = 'bold 11px tahoma';
            elevCtx.textAlign = 'center';
            elevCtx.fillText(`${cabinet.w}cm`, pixelX + (pixelW / 2), pixelY - 10);

            return; // خروج برای وسایل برقی
        }

        // -------------------------------------------------------------
        // یونیت‌های معمولی (زمینی / دیواری / ایستاده)
        // -------------------------------------------------------------
        const bodyStyle = getMaterialStyleForCanvas(elevCtx, cabinet.bodyMaterialValue, 'rgba(30, 41, 59, 0.8)');

        // پایه کابینت زمینی
        if (cabinet.type === "floor") {
            const standardLegHeightCm = 14;
            const pixelLegHeight = standardLegHeightCm * window.elevScale;
            const legBottomY = dynamicGroundLineY - (pixelElevation - pixelLegHeight);
            const legTopY = legBottomY - pixelLegHeight;

            elevCtx.beginPath();
            elevCtx.strokeStyle = '#475569';
            elevCtx.lineWidth = 4.5; 
            elevCtx.lineCap = 'round'; 
            
            const legOffset = Math.min(5 * window.elevScale, pixelW * 0.1);
            elevCtx.moveTo(pixelX + legOffset, legBottomY);
            elevCtx.lineTo(pixelX + legOffset, legTopY);
            elevCtx.moveTo(pixelX + pixelW - legOffset, legBottomY);
            elevCtx.lineTo(pixelX + pixelW - legOffset, legTopY);
            elevCtx.stroke();
        }

        // بدنه یونیت
        elevCtx.beginPath();
        elevCtx.rect(pixelX, pixelY, pixelW, pixelH);

        elevCtx.strokeStyle = strokeColor;
        elevCtx.lineWidth = strokeWidth;

        elevCtx.fillStyle = bodyStyle; 
        elevCtx.fill();
        elevCtx.stroke();

        // رسم درب‌ها
        drawCabinetDoorsInElev(elevCtx, cabinet, pixelX, pixelY, pixelW, pixelH);

        // متن اندازه
        elevCtx.fillStyle = '#38bdf8'; 
        elevCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        elevCtx.shadowBlur = 2;
        elevCtx.font = 'bold 11px tahoma';
        elevCtx.textAlign = 'center';
        elevCtx.fillText(`${cabinet.w}cm`, pixelX + (pixelW / 2), pixelY - 10);
        elevCtx.shadowBlur = 0;
    });

    elevCtx.restore();
}



window.addEventListener('resize', () => {
    if (typeof currentActiveView !== 'undefined' && currentActiveView === 'elev' && elevCanvas) {
        initElevCanvas();
    }
});

function changeElevActiveWall(wallSide) {
    window.activeElevWall = wallSide;
    if (typeof updateElevWallButtons === 'function') updateElevWallButtons();

    window.elevPanOffset = { x: 0, y: 0 };
    setElevCanvasTransform();
    drawFrontElevation();
}
// 🧲 تابع محاسبه چسبندگی اختصاصی برای نمای ارتفاعی
function getSnappedElevPos(movingCabinet, newCmPos, thresholdCm = 3) {
    let snappedX = newCmPos.x;
    let snappedY = newCmPos.y;

    if (typeof cabinets === 'undefined' || !Array.isArray(cabinets)) {
        return { x: snappedX, y: snappedY };
    }

    cabinets.forEach(other => {
        // عدم مقایسه با خودش یا کابینت‌های دیوارهای دیگر
        if (other.id === movingCabinet.id || (other.wall && other.wall !== window.activeElevWall)) return;

        // محاسبه موقعیت افقی کابینت دیگر روی دیوار جاری (بر حسب سانتی‌متر)
        const wallData = getActiveWallData();
        let otherX = 0;
        switch (window.activeElevWall) {
            case 'top': otherX = other.x; break;
            case 'bottom': otherX = wallData.len - other.x - other.w; break;
            case 'left': otherX = other.y; break;
            case 'right': otherX = wallData.len - other.y - other.w; break;
            default: otherX = other.x;
        }

        const otherY = typeof other.elevation !== 'undefined' ? other.elevation : (other.elevationFromGround || 0);

        // 1️⃣ چسبندگی افقی (محور X - چپ/راست)
        if (Math.abs(newCmPos.x - (otherX + other.w)) < thresholdCm) {
            snappedX = otherX + other.w; // چسبیدن لبه چپ به راست دیگری
        } else if (Math.abs((newCmPos.x + movingCabinet.w) - otherX) < thresholdCm) {
            snappedX = otherX - movingCabinet.w; // چسبیدن لبه راست به چپ دیگری
        } else if (Math.abs(newCmPos.x - otherX) < thresholdCm) {
            snappedX = otherX; // تراز لبه چپ
        } else if (Math.abs((newCmPos.x + movingCabinet.w) - (otherX + other.w)) < thresholdCm) {
            snappedX = otherX + other.w - movingCabinet.w; // تراز لبه راست
        }

        // 2️⃣ چسبندگی عمودی (محور Y - بالا/پایین)
        if (Math.abs(newCmPos.y - (otherY + other.h)) < thresholdCm) {
            snappedY = otherY + other.h; // چسبیدن پایین کابینت به بالای دیگری
        } else if (Math.abs((newCmPos.y + movingCabinet.h) - otherY) < thresholdCm) {
            snappedY = otherY - movingCabinet.h; // چسبیدن بالای کابینت به پایین دیگری
        } else if (Math.abs(newCmPos.y - otherY) < thresholdCm) {
            snappedY = otherY; // هم‌ترازی ارتفاعی (کف به کف)
        } else if (Math.abs((newCmPos.y + movingCabinet.h) - (otherY + other.h)) < thresholdCm) {
            snappedY = otherY + other.h - movingCabinet.h; // هم‌ترازی سقف به سقف
        }
    });

    return { x: snappedX, y: snappedY };
}

function updateElevWallButtons() {
    const activeWall = window.activeElevWall || 'top';
    const buttons = {
        top: document.getElementById("btn-elev-top"),
        bottom: document.getElementById("btn-elev-bottom"),
        left: document.getElementById("btn-elev-left"),
        right: document.getElementById("btn-elev-right")
    };

    Object.values(buttons).forEach(btn => {
        if (btn) btn.classList.remove("active");
    });

    if (buttons[activeWall]) {
        buttons[activeWall].classList.add("active");
    }
}
window.drawFrontElevation = drawFrontElevation;
// 🟢 تابع اختصاصی برای رندر مجدد و آنی نمای روبرو از هر جای برنامه
window.refreshElevView = function() {
    if (typeof drawFrontElevation === 'function') {
        drawFrontElevation();
    }
};
