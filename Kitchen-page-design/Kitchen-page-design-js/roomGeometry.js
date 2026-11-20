//دیوار های اصلی نمای سه بعدی 
window.buildWallSegment = function(p1, p2, wallThick, wallHeight, wallMat, scene) {
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.hypot(dx, dz);

    if (len === 0) return;

    // فقط ساخت بدنه دیوار (بدون استوانه)
    const boxGeo = new THREE.BoxGeometry(len, wallHeight, wallThick);
    const boxMesh = new THREE.Mesh(boxGeo, wallMat);
    
    // قرار دادن مرکز دیوار در وسط دو نقطه
    boxMesh.position.set((p1.x + p2.x) / 2, wallHeight / 2, (p1.z + p2.z) / 2);
    boxMesh.rotation.y = -Math.atan2(dz, dx);
    
    scene.add(boxMesh);
};
// دیوار های کاستوم نمای سه بعدی 
// پارامتر shift به انتهای ورودی‌ها اضافه شد
window.buildCustomWallSegment = function(p1, angleRad, len, wallThick, wallHeight, wallMat, scene, shift) {
    // len از بیرون ممکن است کوتاه‌شده باشد تا بیرون‌زدگی گوشه دیده نشود
    const safeLen = Math.max(1, len);
    const boxGeo = new THREE.BoxGeometry(safeLen, wallHeight + 40, wallThick);
    boxGeo.translate(0, wallHeight / 2, 0);

    const pos = boxGeo.attributes.position;
    const uv = boxGeo.attributes.uv;
    if (pos && uv) {
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            uv.setXY(i, (x / safeLen) + 0.5, y / wallHeight);
        }
        uv.needsUpdate = true;
    }
    boxGeo.computeVertexNormals();

    const mesh = new THREE.Mesh(boxGeo, wallMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const hinge = new THREE.Group();
    hinge.position.set(p1.x, 0, p1.z);
    hinge.rotation.y = -angleRad;
    
    // مرکز هندسه روی وسط دیوار
    hinge.translateX(safeLen / 2);
    
    // شیفت چپ/راست: نشستن روی یک وجه ضخامت (بدون اکستند اضافه)
    let zShift = 0;
    if (shift === 'right') zShift = wallThick / 2;
    else if (shift === 'left') zShift = -wallThick / 2;
    hinge.translateZ(zShift);

    hinge.add(mesh);
    scene.add(hinge);
    return hinge; 
};

// تابع رسم دیوارهای اصلی در نمای دو بعدی
window.draw2DBaseWallSegment = function(ctx, p1, p2, wallId, wallThick, isFront, isSelected, COLORS) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if(dx === 0 && dy === 0) return { start: p1, end: p2 };
    
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    
    let nx = -uy;
    let ny = ux;
    
    let expectedNx = 0;
    let expectedNy = 0;

    if (wallId === "top") expectedNy = isFront ? 1 : -1;
    else if (wallId === "bottom") expectedNy = isFront ? -1 : 1;
    else if (wallId === "left") expectedNx = isFront ? 1 : -1;
    else if (wallId === "right") expectedNx = isFront ? -1 : 1;
    else if (wallId === "connect") { expectedNx = 1; expectedNy = 1; }

    if ((expectedNx !== 0 || expectedNy !== 0) && (nx * expectedNx + ny * expectedNy < 0)) { 
        nx = -nx; 
        ny = -ny; 
    }
    
    const shiftX = nx * (wallThick / 2);
    const shiftY = ny * (wallThick / 2);
    
    const extX = ux * (wallThick / 2);
    const extY = uy * (wallThick / 2);

    const startX = p1.x + shiftX - extX;
    const startY = p1.y + shiftY - extY;
    const endX = p2.x + shiftX + extX;
    const endY = p2.y + shiftY + extY;

    window._renderWallCanvas(ctx, startX, startY, endX, endY, wallThick, isSelected, COLORS);
    
    return { start: {x: startX, y: startY}, end: {x: endX, y: endY} };
};

// تابع رسم دیوارهای کاستوم در نمای دو بعدی (با اصلاح طول)
window.draw2DCustomWallSegment = function(ctx, p1, p2, wallId, wallThick, isSelected, COLORS) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if(dx === 0 && dy === 0) return { start: p1, end: p2 };

    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;
    
    // برعکس کردن جهت بردارهای نرمال برای جلوگیری از افتادن دیوار به داخل
    let nx = uy;   // قبلا -uy بود
    let ny = -ux;  // قبلا ux بود
    
    // محاسبه شیفت عرضی
    const shiftX = nx * (wallThick / 2);
    const shiftY = ny * (wallThick / 2);
    
    // محاسبه اکستند طولی
    const extX = ux * (wallThick / 2);
    const extY = uy * (wallThick / 2);

    // اعمال روی نقاط
    const startX = p1.x + shiftX - extX;
    const startY = p1.y + shiftY - extY;
    
    const endX = p2.x + shiftX + extX;
    const endY = p2.y + shiftY + extY;

    window._renderWallCanvas(ctx, startX, startY, endX, endY, wallThick, isSelected, COLORS);
    
    return { start: {x: startX, y: startY}, end: {x: endX, y: endY} };
};

// تابع کمکی برای رندر خط و نقاط اول/آخر دیوار در بوم (برای جلوگیری از تکرار کد)
window._renderWallCanvas = function(ctx, startX, startY, endX, endY, wallThick, isSelected, COLORS) {
    if (isSelected) {
        ctx.strokeStyle = "#3b82f6";
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 10;
    } else {
        ctx.strokeStyle = COLORS.pillarBg; 
        ctx.shadowBlur = 0;
    }

    ctx.lineWidth = wallThick;
    ctx.lineCap = 'butt';   // بدون کلاهک گرد تا انتها بیرون نزند
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.shadowBlur = 0; 

    if (isSelected) {
        const radius = 14; 
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 10px Tahoma";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#10b981"; ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.fillText("اول", startX, startY);

        ctx.beginPath();
        ctx.arc(endX, endY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#ef4444"; ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.fillText("آخر", endX, endY);
        ctx.restore();
    }
};

// ==========================================
// FILE: roomGeometry.js
// ==========================================

const GEOMETRY = {

      /**
     * خطوط دیوارهای فعال اتاق را برمی‌گرداند با در نظر گرفتن زاویه‌ها
     */
    getAllCollisionLines: function() {
        if (!room.walls) {
            return [
                { x1: 0,      y1: 0,      x2: room.w, y2: 0      },
                { x1: room.w, y1: 0,      x2: room.w, y2: room.d },
                { x1: room.w, y1: room.d, x2: 0,      y2: room.d },
                { x1: 0,      y1: room.d, x2: 0,      y2: 0      }
            ];
        }

        const tAng = room.walls.top.angle * (Math.PI / 180);
        const lAng = room.walls.left.angle * (Math.PI / 180);
        const bAng = room.walls.bottom.angle * (Math.PI / 180);
        const rAng = room.walls.right.angle * (Math.PI / 180);

        const ptTL = { x: 0, y: 0 };
        const ptTR = { x: room.walls.top.len * Math.cos(tAng), y: room.walls.top.len * Math.sin(tAng) };
        const ptBL = { x: room.walls.left.len * Math.cos(lAng), y: room.walls.left.len * Math.sin(lAng) };
        const ptBR_right = { x: ptTR.x - room.walls.right.len * Math.cos(rAng), y: ptTR.y - room.walls.right.len * Math.sin(rAng) };
        const ptBR_bottom = { x: ptBL.x - room.walls.bottom.len * Math.cos(bAng), y: ptBL.y - room.walls.bottom.len * Math.sin(bAng) };

        // چک کردن وضعیت فعال بودن دیوارها
        const hasTop = document.getElementById("wall-top") ? document.getElementById("wall-top").checked : true;
        const hasLeft = document.getElementById("wall-left") ? document.getElementById("wall-left").checked : true;
        const hasBottom = document.getElementById("wall-bottom") ? document.getElementById("wall-bottom").checked : true;
        const hasRight = document.getElementById("wall-right") ? document.getElementById("wall-right").checked : true;

        let lines = [];
        if (hasTop) lines.push({ x1: ptTL.x, y1: ptTL.y, x2: ptTR.x, y2: ptTR.y }); // دیوار بالا
        if (hasLeft) lines.push({ x1: ptTL.x, y1: ptTL.y, x2: ptBL.x, y2: ptBL.y }); // دیوار چپ
        if (hasRight) lines.push({ x1: ptBR_right.x, y1: ptBR_right.y, x2: ptTR.x, y2: ptTR.y }); // دیوار راست
        if (hasBottom) lines.push({ x1: ptBR_bottom.x, y1: ptBR_bottom.y, x2: ptBL.x, y2: ptBL.y });  // دیوار پایین

        return lines;
    },


    /**
     * نزدیک‌ترین نقطه روی یک پاره‌خط به یک نقطه داده شده را پیدا می‌کند.
     */
    closestPointOnLine: function(line, point) {
        const { x1, y1, x2, y2 } = line;
        const { x, y } = point;
        
        const dx = x2 - x1;
        const dy = y2 - y1;

        if (dx === 0 && dy === 0) {
            return { x: x1, y: y1 };
        }

        const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);

        let closestX, closestY;
        if (t < 0) {
            closestX = x1;
            closestY = y1;
        } else if (t > 1) {
            closestX = x2;
            closestY = y2;
        } else {
            closestX = x1 + t * dx;
            closestY = y1 + t * dy;
        }
        return { x: closestX, y: closestY };
    },

    /**
     * تابع قدیمی handleWallCollisions (دیگر نیازی به clamp دستی نداریم چون ما 
     * برخورد فیزیکی را بالا به طور کامل بررسی می‌کنیم، اما برای جلوگیری از خطای 
     * بقیه فایل‌ها آن را بر اساس getRoomBounds کلی محدود می‌کنیم)
     */
    handleWallCollisions: function(unit, newX, newY) {
        // این تابع دیگر عملاً در درگ و اسنپ استفاده نمی‌شود، چون در تابع بالا 
        // به صورت فیزیکی چک کردیم، اما برای امنیت باقی می‌گذاریم.
        const dims = getRotatedDims(unit);
        const w = dims.w;
        const d = dims.d;
        
        let bounds = typeof getRoomBounds === 'function' ? getRoomBounds() : { w: room.w, d: room.d };

        let correctedX = newX;
        let correctedY = newY;

        if (correctedX < 0) correctedX = 0;
        if (correctedX + w > bounds.w) correctedX = bounds.w - w;
        if (correctedY < 0) correctedY = 0;
        if (correctedY + d > bounds.d) correctedY = bounds.d - d;

        return { x: correctedX, y: correctedY };
    }
};


// --- بخش جدید برای مدیریت برخورد با دیوارهای کاستوم ---
window.CustomWallPhysics = {
    closestPointOnSegment: function(p, v, w) {
        const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
        if (l2 == 0) return { ...v };
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
    },

    // تغییر مهم: دریافت مرکز مستقیماً و دریافت ابعاد واقعی یونیت
    isColliding: function(unitCenterX, unitCenterY, originalW, originalD, wall, unitAngle = 0) {
        if (!wall || !wall.start || !wall.end) return false;

        const unitCenter = { x: unitCenterX, y: unitCenterY };
        const closestPoint = this.closestPointOnSegment(unitCenter, wall.start, wall.end);

        const dx = closestPoint.x - unitCenter.x;
        const dy = closestPoint.y - unitCenter.y;

        const angleRad = (unitAngle * Math.PI) / 180;
        const cosA = Math.cos(-angleRad);
        const sinA = Math.sin(-angleRad);

        const localX = Math.abs(dx * cosA - dy * sinA);
        const localY = Math.abs(dx * sinA + dy * cosA);

        // استفاده از ابعاد اصلی یونیت برای چک کردن برخورد
        return localX < (originalW / 2 - 0.5) && localY < (originalD / 2 - 0.5);
    }
};




