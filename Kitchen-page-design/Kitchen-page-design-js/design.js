// --- متغیرهای ثابت ---
const canvas = document.getElementById("kitchenCanvas");
const ctx = canvas.getContext("2d");
let DIM_SPACE = 50;
const EXT_LENGTH = 10;
const SNAP_DIST = 1.0;
const WALL_DIM_THRESHOLD = 5;
const FLOATING_DIM_THRESHOLD = 10.0;
const EPSILON = 0.01;


// --- متغیرهای طراحی و درگ بوم ---
let cabinets = [];
let pillars = [];
let room = { w: 0, d: 0, h: 280 };
let scale = 1;
let selectedId = -1;
if (typeof UnitMiniPreview !== "undefined") UnitMiniPreview.hide(); // این خط را اضافه کنید;
let selectedPillarId = -1;
let isClosetFrameSelected = false;

let isDragging = false;
let isDraggingPillar = false;
let isDraggingCountertop = false; // 🟢 اضافه شده برای صفحه رویه
let isDraggingClosetFrame = false;

let dragStart = { x: 0, y: 0 };
let objStart = { x: 0, y: 0 };

let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
const canvasWrapper = document.getElementById("canvas-wrapper");

// NEW: Active view state
let activeView = "floor"; // 'floor', 'wall', or 'merged'

// خواندن متغیرهای CSS
const rootStyles = getComputedStyle(document.documentElement);
const getVar = (name, fallback) => rootStyles.getPropertyValue(name).trim() || fallback;

// آبجکت مرکزی رنگ‌های پروژه
const COLORS = {
      // کابینت
    woodStart: getVar('--c-wood-start', '#ffffff'),
    woodMid: getVar('--c-wood-mid', '#fdfdfd'),
    woodEnd: getVar('--c-wood-end', '#f5f5f5'),
    woodBorder: getVar('--c-wood-border', '#cccccc'),
    
    // 🔴 مقدار پیش‌فرض متن کابینت در جاوااسکریپت 🔴
    cabinetText: getVar('--c-cabinet-text', 'red'), 

    // لوازم خانگی
    appStart: getVar('--c-app-start', '#f8f9fa'),
    appEnd: getVar('--c-app-end', '#ced4da'),
    appBorder: getVar('--c-app-border', '#6c757d'),
    appText: getVar('--c-app-text', '#495057'),
    
    // حالت انتخاب (اصلاح شده به سبز کم‌رنگ متناسب با CSS)
    selStart: getVar('--c-sel-start', '#e8f5e9'),
    selEnd: getVar('--c-sel-end', '#c8e6c9'),
    selBorder: getVar('--c-sel-border', '#4caf50'),

    // فواصل
    gapLine: getVar('--c-gap-line', '#1e7e34'),
    offsetLine: getVar('--c-offset-line', '#8a2be2'),

    // ستون‌ها
    pillarBg: getVar('--c-pillar-bg', '#495057'),
    pillarBorder: getVar('--c-pillar-border', '#343a40'),
    pillarText: getVar('--c-pillar-text', 'rgba(255, 255, 255, 0.7)'),
    pillarSelBg: getVar('--c-pillar-sel-bg', '#6c757d'),
    pillarSelBorder: getVar('--c-pillar-sel-border', '#ff9800'),
    
    // ابعاد دور دیوار
  dimWallText: getVar('--c-dim-wall-text', '#888'),
  dimWallLine: getVar('--c-dim-wall-line', '#bbb'),
  dimCabinetText: getVar('--c-dim-cabinet-text', '#5D4037'),
  dimCabinetLine: getVar('--c-dim-cabinet-line', '#A0846E'),
  dimPillarText: getVar('--c-dim-pillar-text', '#495057'),
  dimPillarLine: getVar('--c-dim-pillar-line', '#adb5bd'),
  
// فاصله‌ها و ناهم‌ترازی‌های بین کابینت‌ها
  gapLine: getVar('--c-gap-line', '#1e7e34'),
  offsetLine: getVar('--c-offset-line', '#8a2be2'),
  
  // جزئیات رسم
  shadow: getVar('--c-shadow', 'rgba(0, 0, 0, 0.3)'),
  facadeBg: getVar('--c-facade-bg', 'rgba(139, 69, 19, 0.1)'),
  cabInnerBorder: getVar('--c-cab-inner-border', 'rgba(0,0,0,0.05)'),
  appInnerBorder: getVar('--c-app-inner-border', 'rgba(255,255,255,0.6)'),
  fridgePanel: getVar('--c-fridge-panel', '#A0846E'),
  fridgeCross: getVar('--c-fridge-cross', '#D1D1D1'),
  doorLine: getVar('--c-door-line', '#5D4037'),
  doorHandle: getVar('--c-door-handle', '#333'),

gridLine: getVar('--c-grid-line', 'rgba(0, 0, 0, 0.05)'),
  pillarShadow: getVar('--c-pillar-shadow', 'rgba(0, 0, 0, 0.15)'),

// رنگ‌های مربوط به لیست برش
  cutListEmpty: getVar('--c-cut-list-empty', '#94a3b8'),
  cutTypeFloor: getVar('--c-cut-type-floor', '#007bff'),
  cutTypeWall: getVar('--c-cut-type-wall', '#d32f2f'),
  cutSelectedBg: getVar('--c-cut-selected-bg', 'linear-gradient(135deg, #e0f2fe 0%, #cffafe 100%)'),
  cutSelectedShadow: getVar('--c-cut-selected-shadow', 'rgba(0,123,255,0.3)'),
  cutDetailAppliance: getVar('--c-cut-detail-appliance', '#ea580c'),
  cutDetailWallSides: getVar('--c-cut-detail-wall-sides', '#2563eb'),
  cutDetailFloorTop: getVar('--c-cut-detail-floor-top', '#16a34a'),
  cutDetailBackPanel: getVar('--c-cut-detail-back-panel', '#dc2626'),
  cutDimText: getVar('--c-cut-dim-text', '#64748b'),
  cutDetailText: getVar('--c-cut-detail-text', '#555'),
};



// --- توابع مدیریت مقیاس و اتاق (بدون تغییر) ---

function setCanvasTransform() {
  canvas.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px)`;
  const mainArea = document.querySelector('.design-main-area');
  if (mainArea) {
      mainArea.style.backgroundPosition = `calc(50% + ${panOffset.x}px) calc(50% + ${panOffset.y}px)`;
  }

  if (typeof updateFloatingUnitControls === "function") updateFloatingUnitControls();
}


function adjustCanvasSize() {
  DIM_SPACE = Math.round(40 + (25 * scale));
  const bounds = getRoomBounds();

  const roomScaledW = bounds.w * scale;
  const roomScaledH = bounds.d * scale;

  // فضای اضافه برای اطراف اتاق (مثلاً ۳۰۰ واحد از هر طرف)
  const extraSpace = 200 * scale; 

  canvas.width = roomScaledW + 2 * DIM_SPACE + (extraSpace * 2);
  canvas.height = roomScaledH + 2 * DIM_SPACE + (extraSpace * 2);

  setCanvasTransform();
}




// تابع شروع پروژه بر اساس نوع انتخاب شده در صفحه لندینگ
// این کد در فایل design.js جایگزین بلوک فعلی window.addEventListener('load' شود
// استفاده از DOMContentLoaded به جای load برای سرعت بیشتر
document.addEventListener('DOMContentLoaded', function() {
    
    // نمایش دادن پنل طراحی با سرعت بالا
    const designPanel = document.getElementById("design-panel");
    if (designPanel) {
        designPanel.style.display = "flex"; 
    }

    // تنظیم ابعاد پیش‌فرض
    room.w = 400; // ۴ متر
    room.d = 300; // ۳ متر
    room.h = 280; // ۲.۸ متر ارتفاع

    // راه‌اندازی محیط و نمایش نمای زمینی (Floor)
    setTimeout(() => {
        initRoomScale();
        setActiveView("floor");
    }, 50);

    
});


// --- توابع کمکی ---

function getRotatedDims(c) {
  if (c.rot === 1 || c.rot === 3) {
    return { w: c.d, d: c.w };
  }
  return { w: c.w, d: c.d };
}

function fuzzyEquals(a, b) {
  return Math.abs(a - b) < EPSILON;
}

// --- تابع ابعادگذاری بین کابینت‌های شناور (جزیره) ---
// فقط کابینت‌های مرئی (visible) را دریافت می‌کند — کاملاً بدون باگ
function drawFloatingCabinetGaps(dimCabinets) {
  if (!dimCabinets || dimCabinets.length < 2) return;

  const THRESHOLD = FLOATING_DIM_THRESHOLD; // 10.0

  ctx.save();
  ctx.translate(DIM_SPACE, DIM_SPACE);
ctx.font = `bold ${Math.max(10, 14 * scale)}px Tahoma`;


  for (let i = 0; i < dimCabinets.length; i++) {
    for (let j = i + 1; j < dimCabinets.length; j++) {
      const c1 = dimCabinets[i];
      const c2 = dimCabinets[j];
      const d1 = getRotatedDims(c1);
      const d2 = getRotatedDims(c2);

      // ──────────────────────────────────────────────
      // 1. اختلاف عمق یونیت‌های کنار هم (Depth Difference)
      // ──────────────────────────────────────────────
      const gapRightToLeft = c2.x - (c1.x + d1.w);
      const gapLeftToRight = c1.x - (c2.x + d2.w);

      let isAdjacentX = false, boundaryXcm = 0;

      if (gapRightToLeft >= -0.5 && gapRightToLeft <= THRESHOLD) {
        isAdjacentX = true;
        boundaryXcm = c1.x + d1.w + Math.max(0, gapRightToLeft) / 2;
      } else if (gapLeftToRight >= -0.5 && gapLeftToRight <= THRESHOLD) {
        isAdjacentX = true;
        boundaryXcm = c2.x + d2.w + Math.max(0, gapLeftToRight) / 2;
      }

      if (isAdjacentX) {
        const back1 = c1.y + d1.d;
        const back2 = c2.y + d2.d;
        const depthDiff = Math.abs(back1 - back2);

        if (depthDiff > 0.3) {
          const shallowBackY = Math.min(back1, back2) * scale;
          const deepBackY = Math.max(back1, back2) * scale;
          const xPos = boundaryXcm * scale;
          const label = `${depthDiff.toFixed(1)} cm`;

          ctx.strokeStyle = COLORS.gapLine;
          ctx.setLineDash([]);

          // خط عمودی نشان‌دهنده اختلاف عمق
          ctx.beginPath();
          ctx.moveTo(xPos, shallowBackY);
          ctx.lineTo(xPos, deepBackY);
          ctx.stroke();

          // دو تیک کوچک در دو سر خط
          ctx.beginPath();
          ctx.moveTo(xPos - 4, shallowBackY);
          ctx.lineTo(xPos + 4, shallowBackY);
          ctx.moveTo(xPos - 4, deepBackY);
          ctx.lineTo(xPos + 4, deepBackY);
          ctx.stroke();

          const textY = (shallowBackY + deepBackY) / 2;

          ctx.font = `bold ${Math.max(10, 14 * scale)}px Tahoma`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const labelW = ctx.measureText(label).width;

          ctx.save();
          ctx.translate(xPos, textY);
          ctx.rotate(-Math.PI / 2);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillRect(-labelW / 2 - 3, -8, labelW + 6, 16);
          ctx.fillStyle = COLORS.gapLine;
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      }

      // ──────────────────────────────────────────────
      // 2. فاصله عمودی (Vertical Gap)
      // ──────────────────────────────────────────────
      let gapY = -1,
        lineY = 0;
      const gapBottomToTop = c2.y - (c1.y + d1.d);
      const gapTopToBottom = c1.y - (c2.y + d2.d);

      if (gapBottomToTop > 0 && gapBottomToTop <= THRESHOLD) {
        gapY = gapBottomToTop;
        lineY = (c1.y + d1.d) * scale;
      } else if (gapTopToBottom > 0 && gapTopToBottom <= THRESHOLD) {
        gapY = gapTopToBottom;
        lineY = (c2.y + d2.d) * scale;
      }

      if (gapY > 0) {
        const xStart1 = c1.x;
        const xEnd1 = c1.x + d1.w;
        const xStart2 = c2.x;
        const xEnd2 = c2.x + d2.w;
        const overlapXStart = Math.max(xStart1, xStart2);
        const overlapXEnd = Math.min(xEnd1, xEnd2);

        if (overlapXEnd > overlapXStart) {
          const gap_cm = gapY.toFixed(1);
          const gap_px = gapY * scale;
          const textX = ((overlapXStart + overlapXEnd) / 2) * scale;
          const textY = lineY + gap_px / 2;

          ctx.strokeStyle = COLORS.gapLine;

          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(textX, lineY);
          ctx.lineTo(textX, lineY + gap_px);
          ctx.stroke();

          ctx.font = `bold ${Math.max(10, 14 * scale)}px Tahoma`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const label = `${gap_cm} cm`;
          const labelW = ctx.measureText(label).width;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillRect(textX - labelW / 2 - 3, textY - 8, labelW + 6, 16);

          ctx.fillStyle = COLORS.gapLine;
          ctx.fillText(label, textX, textY);
        }
      }

      // ──────────────────────────────────────────────
      // 3. ناهم‌ترازی افقی (Offset X)
      // ──────────────────────────────────────────────
      const closeInY =
        Math.abs(c1.y + d1.d - c2.y) <= THRESHOLD ||
        Math.abs(c2.y + d2.d - c1.y) <= THRESHOLD;
      const xOverlap =
        Math.min(c1.x + d1.w, c2.x + d2.w) - Math.max(c1.x, c2.x);

      if (closeInY && xOverlap > 0.1) {
        const offsetX = Math.abs(c1.x - c2.x);
        if (offsetX > 0.1 && offsetX <= THRESHOLD) {
          const px = offsetX * scale;
          const baseY = Math.min(c1.y, c2.y) * scale - 20;
          const leftX = Math.min(c1.x, c2.x) * scale;
          const rightX = Math.max(c1.x, c2.x) * scale;

          ctx.strokeStyle = COLORS.offsetLine;
          ctx.fillStyle = COLORS.offsetLine;


          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(c1.x * scale, baseY);
          ctx.lineTo(c1.x * scale, baseY + 8);
          ctx.moveTo(c2.x * scale, baseY);
          ctx.lineTo(c2.x * scale, baseY + 8);
          ctx.stroke();

          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(leftX, baseY);
          ctx.lineTo(rightX, baseY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.textAlign = "center";
          ctx.fillText(
            `Offset X: ${offsetX.toFixed(1)} cm`,
            leftX + px / 2,
            baseY - 5
          );
        }
      }

      // ──────────────────────────────────────────────
      // 4. ناهم‌ترازی عمودی (Offset Y)
      // ──────────────────────────────────────────────
      const closeInX =
        Math.abs(c1.x + d1.w - c2.x) <= THRESHOLD ||
        Math.abs(c2.x + d2.w - c1.x) <= THRESHOLD;
      const yOverlap =
        Math.min(c1.y + d1.d, c2.y + d2.d) - Math.max(c1.y, c2.y);

      if (closeInX && yOverlap > 0.1) {
        const offsetY = Math.abs(c1.y - c2.y);
        if (offsetY > 0.1 && offsetY <= THRESHOLD) {
          const px = offsetY * scale;
          const baseX = Math.min(c1.x, c2.x) * scale - 25;
          const topY = Math.min(c1.y, c2.y) * scale;
          const bottomY = Math.max(c1.y, c2.y) * scale;

              ctx.strokeStyle = COLORS.offsetLine;
    ctx.fillStyle = COLORS.offsetLine;


          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(baseX, c1.y * scale);
          ctx.lineTo(baseX + 8, c1.y * scale);
          ctx.moveTo(baseX, c2.y * scale);
          ctx.lineTo(baseX + 8, c2.y * scale);
          ctx.stroke();

          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(baseX, topY);
          ctx.lineTo(baseX, bottomY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.save();
          ctx.translate(baseX + 15, topY + px / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = "center";
          ctx.fillText(`Offset Y: ${offsetY.toFixed(1)} cm`, 0, 0);
          ctx.restore();
        }
      }
    }
  }

  ctx.restore();
}
// --- پایان تابع ابعادگذاری بین کابینت‌ها ---

// NEW: Helper function to draw a list of cabinets

/** نقاط پلان ذوزنقه‌ای یونیت با زاویه دیوار چپ/راست
 * خروجی: [عقب‌چپ، عقب‌راست، جلو‌راست، جلو‌چپ] در مختصات صفحه (بعد از getRotatedDims)
 * rot: 0 جلو پایین، 2 جلو بالا، 1 جلو چپ، 3 جلو راست
 */
function normalizeSideAngleUI2D(v, cabinet) {
  if (v === undefined || v === null || v === '') return 90;
  let a = parseFloat(v);
  if (!Number.isFinite(a)) return 90;
  if (cabinet && cabinet.sideAngleUI !== true && a >= -45 && a <= 45) {
    a = 90 - a;
  }
  return Math.max(0, Math.min(180, a));
}
function getCabinetPlanPoints(c, x, y, w, h) {
  // UI: ۹۰=صاف | کمتر=چرخش چپ/بسته | بیشتر=چرخش راست/باز
  let aL = normalizeSideAngleUI2D(c.sideAngleLeft, c);
  let aR = normalizeSideAngleUI2D(c.sideAngleRight, c);
  // انحراف: کمتر از ۹۰ → منفی (چپ) | بیشتر → مثبت (راست)
  const devL = aL - 90;
  const devR = aR - 90;

  const rot = (c.rot === undefined || c.rot === null) ? 0 : c.rot;
  const depth = (rot === 1 || rot === 3) ? w : h;
  const shiftL = Math.tan(devL * Math.PI / 180) * depth;
  const shiftR = Math.tan(devR * Math.PI / 180) * depth;

  if (rot === 0) {
    // عقب بالا، جلو پایین — shift مثبت = حرکت لبه جلو به راست
    return [
      { x: x, y: y },
      { x: x + w, y: y },
      { x: x + w + shiftR, y: y + h },
      { x: x + shiftL, y: y + h }
    ];
  }
  if (rot === 2) {
    // عقب پایین، جلو بالا
    return [
      { x: x + w, y: y + h },
      { x: x, y: y + h },
      { x: x + shiftL, y: y },
      { x: x + w + shiftR, y: y }
    ];
  }
  if (rot === 1) {
    // عقب راست، جلو چپ — عرض روی y
    return [
      { x: x + w, y: y },
      { x: x + w, y: y + h },
      { x: x, y: y + h + shiftR },
      { x: x, y: y + shiftL }
    ];
  }
  if (rot === 3) {
    // عقب چپ، جلو راست
    return [
      { x: x, y: y + h },
      { x: x, y: y },
      { x: x + w, y: y + shiftL },
      { x: x + w, y: y + h + shiftR }
    ];
  }
  return [
    { x: x, y: y },
    { x: x + w, y: y },
    { x: x + w, y: y + h },
    { x: x, y: y + h }
  ];
}

function fillCabinetFootprint(ctx, c, x, y, w, h) {
  const aL = (typeof normalizeSideAngleUI2D === 'function') ? normalizeSideAngleUI2D(c.sideAngleLeft, c) : 90;
  const aR = (typeof normalizeSideAngleUI2D === 'function') ? normalizeSideAngleUI2D(c.sideAngleRight, c) : 90;
  if ((aL === 90 && aR === 90) || c.isFacadeBox || c.isAppliance) {
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    return false; // مستطیل
  }
  const pts = getCabinetPlanPoints(c, x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  return true; // ذوزنقه
}

function drawCabinets(cabs) {
  cabs.forEach((c) => {
    let dims = getRotatedDims(c);
    let x = c.x * scale;
    let y = c.y * scale;
    let w = dims.w * scale;
    let h = dims.d * scale;

    ctx.save();
// ⭐ کدهای جدید برای چرخش آزاد (این بخش اضافه شود) ⭐
    let cx = x + w / 2; // محاسبه مرکز X کابینت
    let cy = y + h / 2; // محاسبه مرکز Y کابینت
    
    let finalAngleDeg = c.angle !== undefined ? c.angle : (c.rot * 90);
    
    // اگر از angle استفاده می‌کنیم، باید اثر c.rot که در ابعاد اعمال شده را خنثی کنیم 
    // یا اینکه بر اساس زاویه جدید، بوم (Canvas) را بچرخانیم
    ctx.translate(cx, cy);
    
    // در صورتی که angle مقدار داشته باشد، کل کابینت می‌چرخد
    // چون c.rot قبلا در ظاهر کابینت (درهای بالا و پایین) تاثیر گذاشته، 
    // بهتر است زاویه نهایی منهای زاویه اولیه (c.rot * 90) شود تا چرخش دوبار اعمال نشود
    let rotationToApply = finalAngleDeg - (c.rot * 90); 
    ctx.rotate(rotationToApply * Math.PI / 180);
    
    ctx.translate(-cx, -cy);
    // ⭐ پایان کدهای اضافه شده ⭐
    // ۱. افکت سایه ملایم
    ctx.shadowColor = COLORS.shadow;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // ۲. تعیین رنگ و ظاهر
    if (c.id === selectedId) {
      let grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, COLORS.selStart);
      grad.addColorStop(1, COLORS.selEnd);
      ctx.fillStyle = grad;
      ctx.strokeStyle = COLORS.selBorder;
      ctx.lineWidth = 2;
} else if (c.isFridgeWrap) {
      let fridgeGrad = ctx.createLinearGradient(x, y, x, y + h);
      fridgeGrad.addColorStop(0, "#f5f5f7"); // رنگ متالیک نقره‌ای بسیار لایت
      fridgeGrad.addColorStop(1, "#e2e2e7"); 
      ctx.fillStyle = fridgeGrad; 
      ctx.strokeStyle = "#8e8e93"; // خط کادر دور طوسی متوسط شیک
      ctx.lineWidth = 1;
 } else if (c.isAppliance) {
      let appGrad = ctx.createLinearGradient(x, y, x, y + h);
      appGrad.addColorStop(0, "#eceff1"); // استیل/متالیک بسیار روشن دکوری
      appGrad.addColorStop(1, "#cfd8dc"); // هاله طوسی آبی متالیک ملایم
      ctx.fillStyle = appGrad;
      ctx.strokeStyle = "#b0bec5"; // کادر دور استیل مات
      ctx.lineWidth = 1.5;
    } else if (c.type === "waterproof") {
      // ⭐ رنگ متمایز برای بدنه ضد آب (سفید پی‌وی‌سی با هاله آبی روشن)
      let wpGrad = ctx.createLinearGradient(x, y, x, y + h);
      wpGrad.addColorStop(0, "#ffffff");
      wpGrad.addColorStop(1, "#e0f7fa");
      ctx.fillStyle = wpGrad;
      ctx.strokeStyle = "#00bcd4"; // حاشیه آبی رنگ ملایم
      ctx.lineWidth = 1;
    } else if (c.isDrawerBody) {
      let drawerGrad = ctx.createLinearGradient(x, y, x, y + h);
      drawerGrad.addColorStop(0, "#fcf8f2"); // رنگ کرم خیلی روشن شیک
      drawerGrad.addColorStop(1, "#f3e5d8"); // هاله چوبی ملایم
      ctx.fillStyle = drawerGrad;
      ctx.strokeStyle = "#bcaaa4"; // رنگ کادر دور خاکی/مات
      ctx.lineWidth = 1; 
    } else if (c.isBaseWithDrawer) {
      let bwdGrad = ctx.createLinearGradient(x, y, x, y + h);
      bwdGrad.addColorStop(0, "#f1f8e9"); // رنگ متمایز مغزپسته‌ای/زیتونی بسیار ملایم
      bwdGrad.addColorStop(1, "#dcedc8"); 
      ctx.fillStyle = bwdGrad;
      ctx.strokeStyle = "#9ccc65"; // رنگ کادر دور
      ctx.lineWidth = 1;
    } else if (c.isDishRack) {
      // 🔴 کد جدید: گرادینت چوبی-آبی شیک مخصوص بدنه آب‌چکان
      let rackGrad = ctx.createLinearGradient(x, y, x, y + h);
      rackGrad.addColorStop(0, "#b0bec5"); // هاله طوسی-آبی ملایم در بالا
      rackGrad.addColorStop(0.5, "#4f9a94"); // ترکیب آبی چوبی میانی
      rackGrad.addColorStop(1, "#264653"); // تنالیته چوب تیره متمایل به سورمه‌ای در پایین
      ctx.fillStyle = rackGrad;
      ctx.strokeStyle = "#1d3557"; // کادر دور سورمه‌ای تیره
      ctx.lineWidth = 1.5;
    } else if (c.isHiddenHood) {
      // 🔴 کد جدید: گرادینت چوبی-دودی مدرن مخصوص بدنه هود مخفی
      let hoodGrad = ctx.createLinearGradient(x, y, x, y + h);
      hoodGrad.addColorStop(0, "#37474f"); // دودی تیره متالیک در بالا
      hoodGrad.addColorStop(0.5, "#78909c"); // خاکستری چوبی میانی
      hoodGrad.addColorStop(1, "#455a64"); // بدنه زغالی شیک در پایین
      ctx.fillStyle = hoodGrad;
      ctx.strokeStyle = "#263238"; // کادر دور مشکی زغالی
      ctx.lineWidth = 1.5;
    } else if (c.isHoodWrap) {
      // 🔴 کد جدید: گرادینت نقره‌ای متالیک لایت مخصوص کلاف هود
      let wrapGrad = ctx.createLinearGradient(x, y, x, y + h);
      wrapGrad.addColorStop(0, "#f8f9fa"); // نقره‌ای درخشان در بالا
      wrapGrad.addColorStop(1, "#e9ecef"); // طوسی متالیک ملایم در پایین
      ctx.fillStyle = wrapGrad;
      ctx.strokeStyle = "#6c757d"; // کادر دور طوسی متوسط شیک
      ctx.lineWidth = 1.5;
    } else if (c.isCoffeeBar) {
      // 🔴 کد جدید: گرادینت لوکس نسکافه‌ای/کرم چوبی مخصوص کافه بار
      let coffeeGrad = ctx.createLinearGradient(x, y, x, y + h);
      coffeeGrad.addColorStop(0, "#f5ebe0"); // کرم خامه ای لایت در بالا
      coffeeGrad.addColorStop(0.5, "#e3d5ca"); // نسکافه‌ای چوبی میانی
      coffeeGrad.addColorStop(1, "#d5bdaf"); // تم قهوه‌ای ملایم دکوری در پایین
      ctx.fillStyle = coffeeGrad;
      ctx.strokeStyle = "#b79a8f"; // کادر دور برنزی/قهوه‌ای مات شیک
      ctx.lineWidth = 1.5;
    } else if (c.type === "wall") {
      // 🔴 کد جدید: گرادینت چوبی گرم مخصوص یونیت‌های دیواری و هوایی
      let wallWoodGrad = ctx.createLinearGradient(x, y, x, y + h);
      wallWoodGrad.addColorStop(0, "#e4a86a"); // رنگ چوب روشن طبیعی
      wallWoodGrad.addColorStop(0.5, "#c78644"); // رنگ بدنه چوب میانی
      wallWoodGrad.addColorStop(1, "#a8692a"); // رگه‌های تیره چوب
      ctx.fillStyle = wallWoodGrad;
      ctx.strokeStyle = "#7c4a16"; // کادر چوبی قهوه‌ای تیره
      ctx.lineWidth = 1.5; // کمی ضخیم‌تر برای متمایز شدن از زمینی
} else if (c.isOvenCabinet) {
      // ⭐ گرادینت شیک برای کلاف فر
      let ovenGrad = ctx.createLinearGradient(x, y, x, y + h);
      ovenGrad.addColorStop(0, "#fbfbfb");
      ovenGrad.addColorStop(1, "#e0e0e0");
      ctx.fillStyle = ovenGrad;
      ctx.strokeStyle = "#757575";
      ctx.lineWidth = 1.5;
    } else {
      let woodGrad = ctx.createLinearGradient(x, y, x, y + h);
      woodGrad.addColorStop(0, COLORS.woodStart);
      woodGrad.addColorStop(0.5, COLORS.woodMid);
      woodGrad.addColorStop(1, COLORS.woodEnd);
      ctx.fillStyle = woodGrad;
      ctx.strokeStyle = COLORS.woodBorder;
      ctx.lineWidth = 1;
    }

    if (c.isFacadeBox) {
      const p = c.panels || {};
      const sc = scale;

      // ضخامت‌ها همیشه محاسبه می‌شوند
      const tL = (p.left ? (p.left.t || 1.6) : 1.6) * sc;
      const tR = (p.right ? (p.right.t || 1.6) : 1.6) * sc;
      const tB = (p.back ? (p.back.t || 1.6) : 1.6) * sc;
      const tF = (p.front ? (p.front.t || 1.6) : 1.6) * sc;
      
      // تولید ابعاد drawW و drawH (حفظ ظاهر باکس)
      const pFrontW = p.front && p.front.w ? p.front.w : 0;
      const pBackW = p.back && p.back.w ? p.back.w : 0;
      const innerW = Math.max(pFrontW, pBackW);
      const drawW = innerW > 0 ? ((innerW * sc) + tL + tR) : (w > 0 ? w : 10 * sc); 

      const pLeftD = p.left && p.left.w ? p.left.w : 0;
      const pRightD = p.right && p.right.w ? p.right.w : 0;
      const maxD = Math.max(pLeftD, pRightD);
      const drawH = maxD > 0 ? (maxD * sc) : (h > 0 ? h : 10 * sc);
      // ⭐⭐⭐ راه‌حل مشکل کلیک و جابجایی ⭐⭐⭐
      c.w = drawW / sc;
      c.d = drawH / sc; 
      // ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐

      // 🔴 کد جدید: گرادینت چوبی فندقی/شکلاتی لوکس برای باکس نما
      let facadeGrad = ctx.createLinearGradient(x, y, x + drawW, y + drawH);
      facadeGrad.addColorStop(0, "#a0522d"); // قهوه‌ای چوبی روشن‌تر در نقطه نور
      facadeGrad.addColorStop(0.5, "#8b4513"); // رنگ پیش‌فرض چوب فندقی
      facadeGrad.addColorStop(1, "#5c2e0b"); // قهوه‌ای سوخته تیره در بخش سایه
      
      // رسم پس‌زمینه و کادر با ابعاد قفل شده جدید
      ctx.fillStyle = facadeGrad; 
      ctx.fillRect(x, y, drawW, drawH);
      
      ctx.strokeStyle = "#4a2306"; // کادر چوبی بسیار تیره و قوی
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, drawW, drawH);
      
      ctx.save();
      ctx.fillStyle = ctx.strokeStyle; // رنگ ضخامت پنل‌ها هماهنگ با کادر تیره

      // چرخش هوشمند
      let topEdge = 0, bottomEdge = 0, leftEdge = 0, rightEdge = 0;

      switch (c.rot) {
          case 0: topEdge = tB; bottomEdge = tF; leftEdge = tL; rightEdge = tR; break;
          case 1: topEdge = tR; bottomEdge = tL; leftEdge = tF; rightEdge = tB; break;
          case 2: topEdge = tF; bottomEdge = tB; leftEdge = tR; rightEdge = tL; break;
          case 3: topEdge = tL; bottomEdge = tR; leftEdge = tB; rightEdge = tF; break;
          default: topEdge = tB; bottomEdge = tF; leftEdge = tL; rightEdge = tR;
      }

      if (leftEdge > 0) ctx.fillRect(x, y, leftEdge, drawH);                    
      if (rightEdge > 0) ctx.fillRect(x + drawW - rightEdge, y, rightEdge, drawH);  
      if (topEdge > 0) ctx.fillRect(x, y, drawW, topEdge);                      
      if (bottomEdge > 0) ctx.fillRect(x, y + drawH - bottomEdge, drawW, bottomEdge); 
      
      ctx.restore();

    } else {
        // رسم بدنه — با زاویه کناری به شکل ذوزنقه از بالا
        const wasTrap = fillCabinetFootprint(ctx, c, x, y, w, h);
                // کادر داخلی ظریف (فقط برای مستطیل؛ ذوزنقه همان خط بیرونی کافی است)
        if (!wasTrap && !c.isFridgeWrap && !c.isAppliance) {
            if (c.isDrawerBody) {
                ctx.strokeStyle = "rgba(188, 170, 164, 0.3)";
            } else {
                ctx.strokeStyle = c.type === "waterproof" ? "#b2ebf2" : COLORS.cabInnerBorder;
            }
            ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

        } else if (!wasTrap && c.isAppliance) {
            ctx.strokeStyle = COLORS.appInnerBorder;
            ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
        }
    }
    
    
    // ۳. جزئیات اختصاصی کلاف یخچال (بدون تغییر و کاملا سالم)
    if (c.isFridgeWrap) {
        ctx.save();
        const pThick = 1.6 * scale; 
        
        // رسم ضخامت بدنه کاور (طوسی)
        ctx.fillStyle = "#8e8e93"; 
        ctx.fillRect(x, y, pThick, h);
        ctx.fillRect(x + w - pThick, y, pThick, h);
        
        // رسم خط قرمز ضخیم جهت نمای روبرو کلاف
        ctx.beginPath();
        ctx.strokeStyle = "red"; 
        ctx.lineWidth = 4; 
        
        if (c.rot === 0) { ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); }
        else if (c.rot === 2) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); }
        else if (c.rot === 1) { ctx.moveTo(x, y); ctx.lineTo(x, y + h); }
        else if (c.rot === 3) { ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); }
        ctx.stroke();
        ctx.restore();
    } 
    if (c.isHoodWrap) {
        ctx.save();
        const pThick = 1.6 * scale; 
        
        // رسم ضخامت ورق‌های چپ و راست
        ctx.fillStyle = "#6c757d"; 
        ctx.fillRect(x, y, pThick, h);
        ctx.fillRect(x + w - pThick, y, pThick, h);
        
        // 🟢 دایره وسط کلاف هود
        ctx.beginPath();
        let radius = Math.min(w, h) * 0.22; 
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(108, 117, 125, 0.15)"; // هاله ملایم داخل دایره
        ctx.fill();
        ctx.strokeStyle = "#6c757d"; 
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // رسم خط قرمز روبرو
        ctx.beginPath();
        ctx.strokeStyle = "red"; 
        ctx.lineWidth = 4; 
        if (c.rot === 0) { ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); }
        else if (c.rot === 2) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); }
        else if (c.rot === 1) { ctx.moveTo(x, y); ctx.lineTo(x, y + h); }
        else if (c.rot === 3) { ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); }
        ctx.stroke();
        ctx.restore();
    }

    // 🔴 بخش جدید و اصلاح شده: رسم خط راهنمای روبرو برای خود دستگاه یخچال (بدون شکستن کدها)
    if (c.isAppliance) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "red"; // رنگ تیره متضاد برای جلوی یخچال
        ctx.lineWidth = 4; // ضخامت خط جلو
        
        if (c.rot === 0) { ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); }
        else if (c.rot === 2) { ctx.moveTo(x, y); ctx.lineTo(x + w, y); }
        else if (c.rot === 1) { ctx.moveTo(x, y); ctx.lineTo(x, y + h); }
        else if (c.rot === 3) { ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); }
        ctx.stroke();
        ctx.restore();
    }

    // ۴. رسم درب و دستگیره (فقط برای کابینت‌های معمولی و ضد آب)
    // 🟢 توجه: این بخش را تبدیل به if خالی کردیم تا با بخش‌های بالا تداخل پیدا نکند و کلاف خراب نشود
if (!c.isFridgeWrap && !c.isHoodWrap && !c.isAppliance && !c.isFacadeBox && c.showDoors !== false) { 
        ctx.beginPath();
        ctx.strokeStyle = COLORS.doorLine;
        ctx.lineWidth = 3;
        // خط جلو — با در نظر گرفتن زاویه کناری (لبه جلوی ذوزنقه)
        const planPts = (typeof getCabinetPlanPoints === 'function')
            ? getCabinetPlanPoints(c, x, y, w, h)
            : null;
        if (planPts && (normalizeSideAngleUI2D(c.sideAngleLeft, c) !== 90 || normalizeSideAngleUI2D(c.sideAngleRight, c) !== 90)) {
            // planPts: [backL, backR, frontR, frontL] — خط درب = لبه جلو
            ctx.moveTo(planPts[3].x, planPts[3].y);
            ctx.lineTo(planPts[2].x, planPts[2].y);
        } else {
            switch (c.rot) {
                case 0: ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); break;
                case 1: ctx.moveTo(x, y); ctx.lineTo(x, y + h); break;
                case 2: ctx.moveTo(x, y); ctx.lineTo(x + w, y); break;
                case 3: ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); break;
            }
        }
        ctx.stroke();
        ctx.fillStyle = COLORS.doorHandle;
        if (c.rot === 0) ctx.fillRect(x + w/2 - 8, y + h - 5, 16, 2.5);
        else if (c.rot === 2) ctx.fillRect(x + w/2 - 8, y + 2.5, 16, 2.5);
        else if (c.rot === 1) ctx.fillRect(x + 2.5, y + h/2 - 8, 2.5, 16);
        else if (c.rot === 3) ctx.fillRect(x + w - 5, y + h/2 - 8, 2.5, 16);
    }

        // ۵. متن روی شکل (شماره یونیت، لیبل و ابعاد روی لبه‌های داخلی)
    ctx.fillStyle = c.isAppliance ? COLORS.appText : COLORS.cabinetText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; // تراز عمودی متن‌ها را روی مرکز خط می‌گذاریم
    ctx.font = `bold ${Math.max(8, 11 * scale)}px Tahoma`;
    
    if (c.isAppliance) {
        // فقط متن لیبل (مثل "یخچال" یا "یخچال ساید") بدون علامت هشتگ و شماره آی‌دی
        ctx.fillText(c.label, x + w / 2, y + h / 2);
    } else {
        // ابتدا مختصات را موقتاً به مرکز کابینت می‌بریم
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

        // تنظیم فونت برای ابعاد و نام
        ctx.font = `bold ${Math.max(7, 8 * scale)}px Tahoma`;
                // ۱. چاپ کلمه "زمینی" یا لیبل "ضد آب" در مرکز کابینت
        if (c.type === "waterproof") {
            ctx.fillStyle = "#00796b";
            ctx.fillText("ضد آب", 0, 0);
        } else if (c.isDrawerBody) {
            ctx.fillText("بدنه کشو", 0, 0);
} else if (c.isBaseWithDrawer) {
            ctx.fillText("درب و کشو", 0, 0);
} else if (c.isFridgeWrap) {
            ctx.fillText("کلاف یخچال", 0, 0);
} else if (c.isCoffeeBar) {
            // 🔴 کد جدید: چاپ متن کافه بار با رنگ قهوه‌ای تیره برای خوانایی روی تم نسکافه‌ای
            ctx.fillStyle = "#6c584c";
            ctx.fillText("کافه بار", 0, 0);
} else if (c.isFacadeBox) {
            // 🔴 کد جدید: تشخیص باکس نما و چاپ متن با رنگ سفید روی بدنه چوبی
            ctx.fillStyle = "#ffffff";
            ctx.fillText("باکس نما", 0, 0);
        } else if (c.isDishRack) {
            ctx.fillStyle = "#ffffff";
            ctx.fillText("آب‌چکان", 0, 0);
} else if (c.isHiddenHood) {
            ctx.fillStyle = "#ffffff";
            ctx.fillText("هود مخفی", 0, 0);
 } else if (c.isHoodWrap) {
            ctx.fillStyle = "#495057";
            // 🟢 جابجایی متن به پایین مرکز (تا روی دایره نیفتد)
            ctx.fillText("کلاف هود", 0, Math.max(12, 14 * scale));
} else if (c.type === "wall") {
            ctx.fillStyle = "#ffffff";
            ctx.fillText(c.label || "دیواری", 0, 0); 
        } else if (c.isOvenCabinet) {
            // ⭐ شرط جدید برای چاپ نام کلاف فر روی پلان
            ctx.fillText("کلاف فر", 0, 0);
        } else {
            ctx.fillText("زمینی", 0, 0);
        }

        // اندازه تقریبی ارتفاع فونت برای محاسبه دقیق فاصله از لبه بالا
        let fontSize = Math.max(7, 8 * scale);

        // ۲. چاپ طول (w) روی لبه‌ی بالایی - کاملاً هدایت شده به سمت داخل کابینت
        // به جای عدد ثابت، به اندازه نصف ارتفاع فونت + ۴ پیکسل متن را به پایین (داخل) هل می‌دهیم
        ctx.fillText(`${dims.w.toFixed(0)}`, 0, (h / -2) + (fontSize / 2) + 4);

        // ۳. چاپ عرض/عمق (d) روی لبه‌ی چپی - کاملاً هدایت شده به سمت داخل کابینت
        // برای اینکه متن از کادر چپ بیرون نزند، آن را به اندازه عرض تقریبی متن به سمت راست (داخل) می‌آوریم
        let textWidth = ctx.measureText(`${dims.d.toFixed(0)}`).width;
        ctx.fillText(`${dims.d.toFixed(0)}`, (w / -2) + (textWidth / 2) + 4, 0);

        ctx.restore();
    }
    ctx.restore();

  });
}



/**
 * رسم چهارچوب کمد دیواری در نمای پلان دو بعدی (مطابق با استایل استاندارد یونیت‌ها)
 */
function drawClosetFrames() {
    const units = window.closetFrameUnits || [];
    if (units.length === 0) return;

    const scaleVal = typeof scale !== 'undefined' ? scale : 1;

    units.forEach(unit => {
        const isSelected = window.selectedClosetFrameId === unit.id;

        const w = unit.w * scaleVal;
        const h = unit.d * scaleVal;
        const x = unit.x * scaleVal;
        const y = unit.y * scaleVal;

        ctx.save();
        const centerX = x + w / 2;
        const centerY = y + h / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(((unit.rot || 0) * 90) * (Math.PI / 180));

        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        if (isSelected) {
            let grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
            grad.addColorStop(0, COLORS.selStart);
            grad.addColorStop(1, COLORS.selEnd);
            ctx.fillStyle = grad;
            ctx.strokeStyle = COLORS.selBorder;
            ctx.lineWidth = 2;
        } else {
            let frameGrad = ctx.createLinearGradient(-w / 2, -h / 2, -w / 2, h / 2);
            frameGrad.addColorStop(0, "#0284c7");
            frameGrad.addColorStop(1, "#0369a1");
            ctx.fillStyle = frameGrad;
            ctx.strokeStyle = "#075985";
            ctx.lineWidth = 1.5;
        }

        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        ctx.strokeStyle = isSelected ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1;
        if (w > 8 && h > 8) ctx.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);

        let fontSize = Math.max(7, 8 * scaleVal);
        ctx.font = `bold ${fontSize}px Tahoma`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("چهارچوب کمد", 0, 0);
        ctx.fillText(`${unit.w.toFixed(0)}`, 0, (-h / 2) + (fontSize / 2) + 2);

        let textWidth = ctx.measureText(`${unit.d}`).width;
        ctx.fillText(`${unit.d}`, (-w / 2) + (textWidth / 2) + 3, 0);

        ctx.restore();
    });
}






function drawCountertops(countertops) {
  if (!countertops || countertops.length === 0) return;

  const currentView = typeof activeView !== 'undefined' ? activeView : "merged";
  if (currentView !== "merged" && currentView !== "worktop-merged") return;

  ctx.save();
  countertops.forEach((ct, index) => {
      if (ct.enabled === false) return;

      // ابعاد و موقعیت پایه
      const ctX = (ct.x || 0) * scale;
      const ctY = (ct.y || 0) * scale;
      const ctW = (ct.length || 0) * scale;
      const ctH = (ct.width || 0) * scale;

      ctx.save();

      // ⭐ ۱. منطق چرخش دقیقاً مشابه یونیت‌ها ⭐
      let cx = ctX + ctW / 2; // مرکز X صفحه
      let cy = ctY + ctH / 2; // مرکز Y صفحه
      
      // زاویه پیش‌فرض صفر (در صورت نبود مقدار)
      let rotationDeg = ct.rotation !== undefined ? ct.rotation : 0;

      // انتقال به مرکز، چرخش، و برگشت (دقیقاً مثل یونیت‌ها)
      ctx.translate(cx, cy);
      // استفاده از همان فرمول تبدیل درجه به رادیان (در جهت عقربه‌های ساعت)
      ctx.rotate(rotationDeg * Math.PI / 180);
      ctx.translate(-cx, -cy);

      // استایل پیش‌فرض کانترتاپ
      ctx.fillStyle = "rgba(148, 163, 184, 0.5)"; 
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;

      // بررسی وضعیت انتخاب
      let isSelected = false;
      if (typeof window.selectedCountertopIndex !== 'undefined' && window.selectedCountertopIndex === index) {
          isSelected = true;
      } else if (typeof window.selectedCountertopId !== 'undefined' && window.selectedCountertopId === ct.id) {
          isSelected = true; 
      }

      if (isSelected) {
          ctx.fillStyle = "rgba(59, 130, 246, 0.5)"; 
          ctx.strokeStyle = "#2563eb";
          ctx.lineWidth = 2;
      }

      // رسم بدنه اصلی صفحه
      ctx.fillRect(ctX, ctY, ctW, ctH);
      ctx.strokeRect(ctX, ctY, ctW, ctH);

      // ⭐ ۲. رسم خط راهنمای روبرو (Front) برای تطبیق با درِ کابینت ⭐
      // در کابینت زاویه 0 یعنی در رو به پایین است، پس لبه جلو را پایین می‌کشیم
      ctx.beginPath();
      ctx.strokeStyle = isSelected ? "#1e3a8a" : "#1e293b";
      ctx.lineWidth = 4;
      ctx.moveTo(ctX, ctY + ctH); 
      ctx.lineTo(ctX + ctW, ctY + ctH);
      ctx.stroke();

      // رسم متن نام صفحه
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold ${Math.max(10, 12 * scale)}px Tahoma`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`صفحه ${index + 1}`, cx, cy);

      // رسم گاز (در صورت وجود)
      if (ct.gas && ct.gas.enabled) {
          const gx = ctX + (ct.gas.x || 0) * scale;
          const gy = ctY + (ct.gas.y || 0) * scale;
          const gw = (ct.gas.width || 60) * scale;
          const gd = (ct.gas.depth || 50) * scale;
          ctx.fillStyle = "rgba(220, 38, 38, 0.6)"; 
          ctx.fillRect(gx, gy, gw, gd);
          ctx.strokeRect(gx, gy, gw, gd);
          ctx.fillStyle = "white";
          ctx.font = `${Math.max(9, 10 * scale)}px Tahoma`;
          ctx.fillText("گاز", gx + gw / 2, gy + gd / 2);
      }

      // رسم سینک (در صورت وجود)
      if (ct.sink && ct.sink.enabled) {
          const sx = ctX + (ct.sink.x || 0) * scale;
          const sy = ctY + (ct.sink.y || 0) * scale;
          const sw = (ct.sink.width || 80) * scale;
          const sd = (ct.sink.depth || 50) * scale;
          ctx.fillStyle = "rgba(14, 165, 233, 0.6)"; 
          ctx.fillRect(sx, sy, sw, sd);
          ctx.strokeRect(sx, sy, sw, sd);
          ctx.fillStyle = "white";
          ctx.font = `${Math.max(9, 10 * scale)}px Tahoma`;
          ctx.fillText("سینک", sx + sw / 2, sy + sd / 2);
      }

      ctx.restore(); 
  });
  ctx.restore();
}

// تابعی برای دریافت نقطه 0,0 (مرکز دقیق بوم)
function getZeroPoint() {
    return {
        x: canvas.width / 2,
        y: canvas.height / 2
    };
}



// متغیر سراسری برای نگهداری دیواری که الان انتخاب شده
window.selectedRoomWall = null;

// --- رندر ۲D محدود به یک‌بار در هر فریم (جلوگیری از هنگ هنگام درگ/اسکرول) ---
let _drawRafId = null;
function scheduleDraw() {
  if (_drawRafId != null) return;
  _drawRafId = requestAnimationFrame(function () {
    _drawRafId = null;
    draw();
    if (typeof updateFloatingUnitControls === 'function') updateFloatingUnitControls();
  });
}

// بهینه‌سازی برش با تأخیر — تا UI قفل نشود
let _optimizeTimer = null;
function scheduleOptimizeCuts(delay) {
  const ms = (delay != null) ? delay : 400;
  if (_optimizeTimer) clearTimeout(_optimizeTimer);
  _optimizeTimer = setTimeout(function () {
    _optimizeTimer = null;
    try {
      if (window.cutPanel && typeof window.cutPanel.optimizeAll === "function") {
        window.cutPanel.optimizeAll();
      } else if (typeof optimizeCuts === "function") {
        optimizeCuts();
      }
    } catch (e) {
      console.warn("optimizeCuts:", e);
    }
  }, ms);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (typeof room !== 'undefined' && !room.walls) {
      room.walls = {
          top: { len: room.w || 400, angle: 0, wallSide: 'back' },
          bottom: { len: room.w || 400, angle: 180, wallSide: 'back' },
          left: { len: room.d || 300, angle: 90, wallSide: 'back' },
          right: { len: room.d || 300, angle: -90, wallSide: 'back' }
      };
  }
  const hasWallsObj = typeof room !== 'undefined' && room.walls;

  let maxW = room.w;
  let maxD = room.d;
  if (hasWallsObj) {
      maxW = Math.max(room.walls.top.len, room.walls.bottom.len);
      maxD = Math.max(room.walls.left.len, room.walls.right.len);
  }
  
  const roomScaledW = maxW * scale;
  const roomScaledH = maxD * scale;

  let centerX = roomScaledW / 2;
  let centerY = roomScaledH / 2;

  if (hasWallsObj) {
      const tLen = room.walls.top.len * scale;
      const tAng = room.walls.top.angle * (Math.PI / 180);
      const lLen = room.walls.left.len * scale;
      const lAng = room.walls.left.angle * (Math.PI / 180);
      const bLen = room.walls.bottom.len * scale;
      const bAng = room.walls.bottom.angle * (Math.PI / 180);
      const rLen = room.walls.right.len * scale;
      const rAng = room.walls.right.angle * (Math.PI / 180);

      const pTL = { x: 0, y: 0 };
      const pTR = { x: tLen * Math.cos(tAng), y: tLen * Math.sin(tAng) };
      const pBL = { x: lLen * Math.cos(lAng), y: lLen * Math.sin(lAng) };
      const pBR_r = { x: pTR.x - rLen * Math.cos(rAng), y: pTR.y - rLen * Math.sin(rAng) };
      const pBR_b = { x: pBL.x - bLen * Math.cos(bAng), y: pBL.y - bLen * Math.sin(bAng) };

      const xs = [pTL.x, pTR.x, pBL.x, pBR_r.x, pBR_b.x];
      const ys = [pTL.y, pTR.y, pBL.y, pBR_r.y, pBR_b.y];
      
      const baseEndpointsScaled = {
          top: { start: pTL, end: pTR },
          left: { start: pTL, end: pBL },
          right: { start: pBR_r, end: pTR },
          bottom: { start: pBR_b, end: pBL },
          connect: { start: pBR_r, end: pBR_b }
      };

      if (window.customWalls && window.customWalls.length > 0) {
          window.customWalls.forEach((cWall) => {
              let p1;
              if (cWall.x !== undefined && cWall.y !== undefined) {
                  p1 = { x: cWall.x * scale, y: cWall.y * scale };
              } else { 
                  const target = baseEndpointsScaled[cWall.targetWall];
                  if (!target) return;
                  p1 = (cWall.attachment === 'end') ? target.end : target.start;
              }
              const cLenScaled = cWall.len * scale;
              const cAngRad = cWall.angle * (Math.PI / 180);
              const p2 = {
                  x: p1.x + cLenScaled * Math.cos(cAngRad),
                  y: p1.y + cLenScaled * Math.sin(cAngRad)
              };

              baseEndpointsScaled[cWall.id] = { start: p1, end: p2 };
              xs.push(p1.x, p2.x);
              ys.push(p1.y, p2.y);
          });
      }
      
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      centerX = minX + (maxX - minX) / 2;
      centerY = minY + (maxY - minY) / 2;
  }
  window.currentCenterX = centerX;
  window.currentCenterY = centerY;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.translate(-centerX, -centerY);

  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= maxW; i += 20) {
    ctx.moveTo(i * scale, 0);
    ctx.lineTo(i * scale, roomScaledH);
  }
  for (let j = 0; j <= maxD; j += 20) {
    ctx.moveTo(0, j * scale);
    ctx.lineTo(roomScaledW, j * scale);
  }
  ctx.stroke();

  const wallThick = 10 * scale; 
  ctx.lineCap = "round"; 

  const elTop = document.getElementById("wall-top");
  const hasTop = elTop ? elTop.checked : false;
  const elLeft = document.getElementById("wall-left");
  const hasLeft = elLeft ? elLeft.checked : false;
  const elBottom = document.getElementById("wall-bottom");
  const hasBottom = elBottom ? elBottom.checked : false;
  const elRight = document.getElementById("wall-right");
  const hasRight = elRight ? elRight.checked : false;

  if (hasWallsObj) {
      const tLen = room.walls.top.len * scale;
      const tAng = room.walls.top.angle * (Math.PI / 180);
      const lLen = room.walls.left.len * scale;
      const lAng = room.walls.left.angle * (Math.PI / 180);
      const bLen = room.walls.bottom.len * scale;
      const bAng = room.walls.bottom.angle * (Math.PI / 180);
      const rLen = room.walls.right.len * scale;
      const rAng = room.walls.right.angle * (Math.PI / 180);

      const ptTL = { x: 0, y: 0 };
      const ptTR = { x: ptTL.x + tLen * Math.cos(tAng), y: ptTL.y + tLen * Math.sin(tAng) };
      const ptBL = { x: ptTL.x + lLen * Math.cos(lAng), y: ptTL.y + lLen * Math.sin(lAng) };
      const ptBR_right = { x: ptTR.x - rLen * Math.cos(rAng), y: ptTR.y - rLen * Math.sin(rAng) };
      const ptBR_bottom = { x: ptBL.x - bLen * Math.cos(bAng), y: ptBL.y - bLen * Math.sin(bAng) };
      
      const getIsFront = (wallId) => {
          if (["top", "bottom", "left", "right"].includes(wallId) && typeof room !== 'undefined' && room.walls && room.walls[wallId]) {
              return room.walls[wallId].wallSide === 'front';
          }
          return false;
      };

      let visTop = hasTop ? window.draw2DBaseWallSegment(ctx, ptTL, ptTR, "top", wallThick, getIsFront("top"), window.selectedRoomWall === "top", COLORS) : {start: ptTL, end: ptTR};
      let visLeft = hasLeft ? window.draw2DBaseWallSegment(ctx, ptTL, ptBL, "left", wallThick, getIsFront("left"), window.selectedRoomWall === "left", COLORS) : {start: ptTL, end: ptBL};
      let visRight = hasRight ? window.draw2DBaseWallSegment(ctx, ptBR_right, ptTR, "right", wallThick, getIsFront("right"), window.selectedRoomWall === "right", COLORS) : {start: ptBR_right, end: ptTR};
      let visBottom = hasBottom ? window.draw2DBaseWallSegment(ctx, ptBR_bottom, ptBL, "bottom", wallThick, getIsFront("bottom"), window.selectedRoomWall === "bottom", COLORS) : {start: ptBR_bottom, end: ptBL};
      let visConnect = window.autoConnectWalls ? window.draw2DBaseWallSegment(ctx, ptBR_right, ptBR_bottom, "connect", wallThick, false, window.selectedRoomWall === "connect", COLORS) : {start: ptBR_right, end: ptBR_bottom};

      const baseEndpoints = {
          top: visTop,
          left: visLeft,
          right: visRight,
          bottom: visBottom,
          connect: visConnect
      };

      const skeletonEndpoints = {
          top: { start: ptTL, end: ptTR },
          left: { start: ptTL, end: ptBL },
          right: { start: ptBR_right, end: ptTR },
          bottom: { start: ptBR_bottom, end: ptBL },
          connect: { start: ptBR_right, end: ptBR_bottom }
      };

      if (window.customWalls && window.customWalls.length > 0) {
          window.customWalls.forEach((cWall) => {
              let p1;
              if (cWall.x !== undefined && cWall.y !== undefined) {
                  p1 = { x: cWall.x * scale, y: cWall.y * scale };
              } else { 
                  const target = skeletonEndpoints[cWall.targetWall];
                  if (!target) return;
                  p1 = (cWall.attachment === 'end') ? {x: target.end.x, y: target.end.y} : {x: target.start.x, y: target.start.y};
              }
              const cLenScaled = cWall.len * scale;
              const cAngRad = cWall.angle * (Math.PI / 180);
              const ux = Math.cos(cAngRad);
              const uy = Math.sin(cAngRad);
              
              const p2 = {
                  x: p1.x + cLenScaled * ux,
                  y: p1.y + cLenScaled * uy
              };

              skeletonEndpoints[cWall.id] = { start: p1, end: p2 };

              let nx = -uy;
              let ny = ux;
              
              // شیفت عرضی (چپ/راست) — بدون اکستند طولی تا تکهٔ اضافه از اتصال بیرون نزند
              if (cWall.shift === 'left') {
                  nx = -nx;
                  ny = -ny;
              } else if (!cWall.shift || cWall.shift === 'none') {
                  nx = 0;
                  ny = 0;
              }

              const shiftX = nx * (wallThick / 2);
              const shiftY = ny * (wallThick / 2);

              // فقط از p1 تا p2 (طول دقیق) + شیفت عرضی — بدون ±ext
              const startX = p1.x + shiftX;
              const startY = p1.y + shiftY;
              const endX = p2.x + shiftX;
              const endY = p2.y + shiftY;

              window._renderWallCanvas(ctx, startX, startY, endX, endY, wallThick, window.selectedRoomWall === cWall.id, COLORS);
              
              baseEndpoints[cWall.id] = { start: {x: startX, y: startY}, end: {x: endX, y: endY} };
          });
      }

  } else {
      ctx.fillStyle = COLORS.pillarBg;
      if (hasTop) ctx.fillRect(-wallThick, -wallThick, roomScaledW + wallThick*2, wallThick);
      if (hasBottom) ctx.fillRect(-wallThick, roomScaledH, roomScaledW + wallThick*2, wallThick);
      if (hasLeft) ctx.fillRect(-wallThick, 0, wallThick, roomScaledH);
      if (hasRight) ctx.fillRect(roomScaledW, 0, wallThick, roomScaledH);
  }

  pillars.forEach((p) => {
    let x = p.x * scale; let y = p.y * scale; let w = p.w * scale; let h = p.d * scale;
    ctx.save();
    ctx.shadowColor = COLORS.pillarShadow; ctx.shadowBlur = 5;
    if (p.id === selectedPillarId) {
      ctx.fillStyle = COLORS.pillarSelBg; ctx.strokeStyle = COLORS.pillarSelBorder; ctx.lineWidth = 2;
    } else {
      ctx.fillStyle = COLORS.pillarBg; ctx.strokeStyle = COLORS.pillarBorder; ctx.lineWidth = 1;
    }
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); ctx.restore();
    ctx.fillStyle = COLORS.pillarText; ctx.textAlign = "center"; ctx.font = `${Math.max(8, 11 * scale)}px Tahoma`;
    ctx.fillText(`P-${p.id}`, x + w / 2, y + h / 2 + 5);
  });

  const visibleCabinets = cabinets.filter((c) => {
    const currentView = activeView || "merged"; 
    
    if (currentView === "merged") return true;
    if (currentView === "floor" || currentView === "worktop-merged") {
        return c.type === "floor" || c.type === "waterproof";
    }
    if (currentView === "wall") return c.type === "wall" && !c.isUpperTier; 
    if (currentView === "wall-top") return c.isUpperTier === true; 
    return false;
  });

  const floorCabinets = visibleCabinets.filter((c) => c.type === "floor" || c.type === "waterproof");
  const wallCabinets = visibleCabinets.filter((c) => c.type === "wall");

  drawCabinets(floorCabinets);
  drawCabinets(wallCabinets); 

  if (hasWallsObj) {
      const tAng = room.walls.top.angle * (Math.PI / 180);
      const lAng = room.walls.left.angle * (Math.PI / 180);
      const bAng = room.walls.bottom.angle * (Math.PI / 180);
      const rAng = room.walls.right.angle * (Math.PI / 180);

      const ptTL_cm = { x: 0, y: 0 };
      const ptTR_cm = { x: room.walls.top.len * Math.cos(tAng), y: room.walls.top.len * Math.sin(tAng) };
      const ptBL_cm = { x: room.walls.left.len * Math.cos(lAng), y: room.walls.left.len * Math.sin(lAng) };
      const ptBR_right_cm = { x: ptTR_cm.x - room.walls.right.len * Math.cos(rAng), y: ptTR_cm.y - room.walls.right.len * Math.sin(rAng) };
      const ptBR_bottom_cm = { x: ptBL_cm.x - room.walls.bottom.len * Math.cos(bAng), y: ptBL_cm.y - room.walls.bottom.len * Math.sin(bAng) };

      if (hasTop) drawWallGaps("top", ptTL_cm, ptTR_cm, room.walls.top.len, visibleCabinets, maxW, maxD);
      if (hasLeft) drawWallGaps("left", ptTL_cm, ptBL_cm, room.walls.left.len, visibleCabinets, maxW, maxD);
      if (hasBottom) drawWallGaps("bottom", ptBR_bottom_cm, ptBL_cm, room.walls.bottom.len, visibleCabinets, maxW, maxD);
      if (hasRight) drawWallGaps("right", ptBR_right_cm, ptTR_cm, room.walls.right.len, visibleCabinets, maxW, maxD);
      
      if (window.autoConnectWalls) {
          const dx_cm = ptBR_bottom_cm.x - ptBR_right_cm.x;
          const dy_cm = ptBR_bottom_cm.y - ptBR_right_cm.y;
          const connectLenCm = Math.hypot(dx_cm, dy_cm);
          drawWallGaps("connect", ptBR_right_cm, ptBR_bottom_cm, connectLenCm, visibleCabinets, maxW, maxD);
      }

      const baseEndpointsCm = {
          top: { start: ptTL_cm, end: ptTR_cm, isActive: hasTop },
          left: { start: ptTL_cm, end: ptBL_cm, isActive: hasLeft },
          right: { start: ptBR_right_cm, end: ptTR_cm, isActive: hasRight },
          bottom: { start: ptBR_bottom_cm, end: ptBL_cm, isActive: hasBottom },
          connect: { start: ptBR_right_cm, end: ptBR_bottom_cm, isActive: window.autoConnectWalls }
      };

      if (window.customWalls && window.customWalls.length > 0) {
          window.customWalls.forEach((cWall) => {
              let p1_cm;
              if (cWall.x !== undefined && cWall.y !== undefined) {
                  p1_cm = { x: cWall.x, y: cWall.y };
              } else { 
                  const targetCm = baseEndpointsCm[cWall.targetWall];
                  if (!targetCm) return;
                  p1_cm = (cWall.attachment === 'end') ? targetCm.end : targetCm.start;
              }
              const cAngRad = cWall.angle * (Math.PI / 180);
              const p2_cm = {
                  x: p1_cm.x + cWall.len * Math.cos(cAngRad),
                  y: p1_cm.y + cWall.len * Math.sin(cAngRad)
              };

              baseEndpointsCm[cWall.id] = { start: p1_cm, end: p2_cm, isActive: true };
              cWall.start = p1_cm;
              cWall.end = p2_cm;
             
              if (cWall.wallSide === 'back') {
                  drawWallGaps(cWall.id, p2_cm, p1_cm, cWall.len, visibleCabinets, maxW, maxD);
              } else {
                  drawWallGaps(cWall.id, p1_cm, p2_cm, cWall.len, visibleCabinets, maxW, maxD);
              }
          });
      }

      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      for (const wallId in baseEndpointsCm) {
          const ep = baseEndpointsCm[wallId];
          if (ep && ep.start && ep.end && ep.isActive) {
              ctx.moveTo(ep.start.x * scale, ep.start.y * scale);
              ctx.lineTo(ep.end.x * scale, ep.end.y * scale);
          }
      }
      ctx.stroke();
      ctx.restore();

  } else {
      const ptTL_cm = { x: 0, y: 0 }; const ptTR_cm = { x: room.w, y: 0 };
      const ptBL_cm = { x: 0, y: room.d }; const ptBR_cm = { x: room.w, y: room.d };

      if (hasTop) drawWallGaps("top", ptTL_cm, ptTR_cm, room.w, visibleCabinets, room.w, room.d);
      if (hasLeft) drawWallGaps("left", ptTL_cm, ptBL_cm, room.d, visibleCabinets, room.w, room.d);
      if (hasBottom) drawWallGaps("bottom", ptBL_cm, ptBR_cm, room.w, visibleCabinets, room.w, room.d); 
      if (hasRight) drawWallGaps("right", ptTR_cm, ptBR_cm, room.d, visibleCabinets, room.w, room.d);  
  }

  let currentViewMode = typeof activeView !== "undefined" ? activeView : "merged";
  if ((currentViewMode === "merged" || currentViewMode === "worktop-merged") && typeof allCountertops !== 'undefined') {
      drawCountertops(allCountertops);
  }

  // رسم کمد دیواری
  drawClosetFrames();

  if (typeof drawFloatingCabinetGaps === "function") {
      drawFloatingCabinetGaps(visibleCabinets);
  }
    
  ctx.restore();

  if (typeof Kitchen3D !== 'undefined' && Kitchen3D.config) {
      if (Kitchen3D.config.hasTop !== hasTop || Kitchen3D.config.hasLeft !== hasLeft || 
          Kitchen3D.config.hasBottom !== hasBottom || Kitchen3D.config.hasRight !== hasRight) {
          Kitchen3D.config.hasTop = hasTop; Kitchen3D.config.hasLeft = hasLeft;
          Kitchen3D.config.hasBottom = hasBottom; Kitchen3D.config.hasRight = hasRight;
          if (Kitchen3D.scene) Kitchen3D.refreshRoom();
      }
  }
  // همگام‌سازی دیوارهای فعال با نمای Babylon
  if (typeof KitchenBabylon !== 'undefined' && KitchenBabylon.config) {
      if (KitchenBabylon.config.hasTop !== hasTop || KitchenBabylon.config.hasLeft !== hasLeft ||
          KitchenBabylon.config.hasBottom !== hasBottom || KitchenBabylon.config.hasRight !== hasRight) {
          KitchenBabylon.config.hasTop = hasTop;
          KitchenBabylon.config.hasLeft = hasLeft;
          KitchenBabylon.config.hasBottom = hasBottom;
          KitchenBabylon.config.hasRight = hasRight;
          if (KitchenBabylon.isReady && typeof KitchenBabylon.refreshRoom === 'function') {
              KitchenBabylon.refreshRoom();
          }
      }
  }

  if (typeof renderList === "function") renderList();
  if (typeof updateCountertopPreview === "function") updateCountertopPreview();

  if (typeof drawFrontElevation === 'function') {
      drawFrontElevation();
  }

  if (typeof updateFloatingUnitControls === 'function') updateFloatingUnitControls();
}


// جایگزین توابع drawHorizontalGaps و drawVerticalGaps
function drawWallGaps(wallId, ptStart, ptEnd, wallLenCm, dimCabinets, roomW, roomD) {
  if (["top", "bottom", "left", "right"].includes(wallId)) {
      const isEnabled = document.getElementById(`wall-${wallId}`)?.checked;
      if (isEnabled === false) return;
  }

  const dx = ptEnd.x - ptStart.x;
  const dy = ptEnd.y - ptStart.y;
  const angle = Math.atan2(dy, dx);
  
  const ux = dx / wallLenCm;
  const uy = dy / wallLenCm;

  let nx = -uy;
  let ny = ux;
  
  let expectedNx = 0;
  let expectedNy = 0;
  
  // 🟢 خواندن سمت دیوار (برای قرینه کردن خطوط اندازه)
  let isFront = false;
  if (["top", "bottom", "left", "right"].includes(wallId)) {
      if (typeof room !== 'undefined' && room.walls && room.walls[wallId]) {
          isFront = (room.walls[wallId].wallSide === 'front');
      }
  }

  // 🟢 تعیین جهت بردار بر اساس مقدار front یا back
  if (wallId === "top") expectedNy = isFront ? 1 : -1;       
  else if (wallId === "bottom") expectedNy = isFront ? -1 : 1; 
  else if (wallId === "left") expectedNx = isFront ? 1 : -1;  
  else if (wallId === "right") expectedNx = isFront ? -1 : 1;  
  else if (wallId === "connect") { expectedNx = 1; expectedNy = 1; }

  if ((expectedNx !== 0 || expectedNy !== 0) && (nx * expectedNx + ny * expectedNy < 0)) {
      nx = -nx;
      ny = -ny;
  }

  const projectPoint = (x, y) => {
    const vx = x - ptStart.x;
    const vy = y - ptStart.y;
    return { proj: vx * ux + vy * uy, dist: Math.abs(vx * nx + vy * ny) };
  };

  const localEpsilon = typeof EPSILON !== 'undefined' ? EPSILON : 0.5;
  const fuzzyEquals = (a, b) => Math.abs(a - b) < localEpsilon;

  let coords_cm = [0];
  let cabinetSegments = [];
  let pillarSegments = [];
  let countertopSegments = [];
  let closetFrameSegments = []; // 🟢 آرایه جدید برای مقاطع چهارچوب کمد

  dimCabinets.forEach((c) => {
    let dims = typeof getRotatedDims === "function" ? getRotatedDims(c) : { w: c.w, d: c.d };
    let pts = [{x: c.x, y: c.y}, {x: c.x + dims.w, y: c.y}, {x: c.x, y: c.y + dims.d}, {x: c.x + dims.w, y: c.y + dims.d}];
    
    let minP = Infinity, maxP = -Infinity, minDist = Infinity;
    pts.forEach(pt => {
        let p = projectPoint(pt.x, pt.y);
        minP = Math.min(minP, p.proj);
        maxP = Math.max(maxP, p.proj);
        minDist = Math.min(minDist, p.dist);
    });

    if (minDist < WALL_DIM_THRESHOLD) {
        let startCm = Math.max(0, minP);
        let endCm = Math.min(wallLenCm, maxP);
        if (endCm > startCm) {
            coords_cm.push(startCm); coords_cm.push(endCm);
            cabinetSegments.push({ start: startCm, end: endCm });
        }
    }
  });

  if (typeof pillars !== "undefined") {
      pillars.forEach((p) => {
        let pts = [{x: p.x, y: p.y}, {x: p.x + p.w, y: p.y}, {x: p.x, y: p.y + p.d}, {x: p.x + p.w, y: p.y + p.d}];
        let minP = Infinity, maxP = -Infinity, minDist = Infinity;
        pts.forEach(pt => {
            let p = projectPoint(pt.x, pt.y);
            minP = Math.min(minP, p.proj); maxP = Math.max(maxP, p.proj); minDist = Math.min(minDist, p.dist);
        });

        if (minDist < WALL_DIM_THRESHOLD) {
            let startCm = Math.max(0, minP); let endCm = Math.min(wallLenCm, maxP);
            if (endCm > startCm) { coords_cm.push(startCm); coords_cm.push(endCm); pillarSegments.push({ start: startCm, end: endCm }); }
        }
      });
  }

  // 🟢 محاسبه کانترتاپ‌ها
  let currentViewMode = typeof activeView !== "undefined" ? activeView : "merged";
  let showCountertops = (currentViewMode === "merged" || currentViewMode === "worktop-merged");

  if (showCountertops && typeof allCountertops !== "undefined") { 
      allCountertops.forEach((ct) => {
        let ctW = ct.w || ct.length || 0;
        let ctD = ct.d || ct.width || 0; 
        
        let tempObj = { w: ctW, d: ctD, rotation: ct.rotation || 0 };
        let dims = typeof getRotatedDims === "function" ? getRotatedDims(tempObj) : { w: ctW, d: ctD };
        
        let pts = [{x: ct.x, y: ct.y}, {x: ct.x + dims.w, y: ct.y}, {x: ct.x, y: ct.y + dims.d}, {x: ct.x + dims.w, y: ct.y + dims.d}];
        
        let minP = Infinity, maxP = -Infinity, minDist = Infinity;
        pts.forEach(pt => {
            let p = projectPoint(pt.x, pt.y);
            minP = Math.min(minP, p.proj); maxP = Math.max(maxP, p.proj); minDist = Math.min(minDist, p.dist);
        });

        if (minDist < WALL_DIM_THRESHOLD) {
            let startCm = Math.max(0, minP); let endCm = Math.min(wallLenCm, maxP);
            if (endCm > startCm) { coords_cm.push(startCm); coords_cm.push(endCm); countertopSegments.push({ start: startCm, end: endCm }); }
        }
      });
  }
  
  
    // 🟢 بخش اصلاح‌شده: محاسبه دقیق ۴ گوشه کمد دیواری طبق مرکز چرخش واقعی
  const frameParts = window.currentClosetFrameParts || [];
  let unit = window.closetFrameUnit;

  if (unit || frameParts.length > 0) {
      let fx = 0, fy = 0, fw = 0, fd = 0, rotDeg = 0;

      if (unit) {
          fx = unit.x;
          fy = unit.y;
          fw = unit.w;
          fd = unit.d;
          rotDeg = (unit.rot || 0) * 90; // تبدیل ضریب چرخش (0,1,2,3) به درجه
      } else {
          let maxH = 0;
          frameParts.forEach(p => {
              if (p.orientation === 'horizontal' && p.length > maxH) maxH = p.length;
          });
          if (maxH === 0) maxH = Math.max(...frameParts.map(p => p.length), 0);

          fx = frameParts[0].x || 0;
          fy = frameParts[0].y || 0;
          fw = maxH;
          fd = 5.5;
          rotDeg = (frameParts[0].rot || 0) * 90;
      }

      if (fw > 0 && fd > 0) {
          // ۱. محاسبه دقیق مرکز کمد (همگام با drawClosetFrames)
          const cx = fx + fw / 2;
          const cy = fy + fd / 2;

          // ۲. تبدیل زاویه چرخش به رادیان
          const rad = (rotDeg * Math.PI) / 180;
          const cosA = Math.cos(rad);
          const sinA = Math.sin(rad);

          // ۳. ۴ گوشه محلی حول مرکز
          const localCorners = [
              { x: -fw / 2, y: -fd / 2 },
              { x:  fw / 2, y: -fd / 2 },
              { x:  fw / 2, y:  fd / 2 },
              { x: -fw / 2, y:  fd / 2 }
          ];

          // ۴. انتقال به سیستم مختصات جهانی
          let pts = localCorners.map(pt => ({
              x: cx + (pt.x * cosA - pt.y * sinA),
              y: cy + (pt.x * sinA + pt.y * cosA)
          }));

          // ۵. پروژکشن روی دیوار
          let minP = Infinity, maxP = -Infinity, minDist = Infinity;
          pts.forEach(pt => {
              let p = projectPoint(pt.x, pt.y);
              minP = Math.min(minP, p.proj);
              maxP = Math.max(maxP, p.proj);
              minDist = Math.min(minDist, p.dist);
          });

          // ۶. ثبت مقطع در صورت قرارگیری در محدوده دیوار
          if (minDist < WALL_DIM_THRESHOLD) {
              let startCm = Math.max(0, minP);
              let endCm = Math.min(wallLenCm, maxP);
              if (endCm > startCm) { 
                  coords_cm.push(startCm); 
                  coords_cm.push(endCm); 
                  closetFrameSegments.push({ start: startCm, end: endCm }); 
              }
          }
      }
  }


  coords_cm.push(wallLenCm);
  
  let points = [];
  coords_cm.sort((a, b) => a - b).forEach(p => {
      if (points.length === 0 || Math.abs(points[points.length - 1] - p) > localEpsilon) points.push(p);
  });

  if (points.length <= 1) return;

  const rowGapSpacing = 16 + (8 * scale);
  const lineOffsetMain = 15 + (10 * scale);
  const lineOffsetGap = lineOffsetMain + rowGapSpacing;
  const extLength = lineOffsetGap + 10;
  
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.globalAlpha = 1;
  ctx.font = `${Math.max(8, 10 * scale)}px Tahoma`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < points.length - 1; i++) {
    const start_cm = points[i];
    const end_cm = points[i + 1];
    const gap_cm = (end_cm - start_cm).toFixed(1);

    if (parseFloat(gap_cm) < localEpsilon) continue;

    let isCabinetSegment = cabinetSegments.some(c => fuzzyEquals(c.start, start_cm) && fuzzyEquals(c.end, end_cm));
    let isPillarSegment = pillarSegments.some(p => fuzzyEquals(p.start, start_cm) && fuzzyEquals(p.end, end_cm));
    let isCountertopSegment = countertopSegments.some(ct => fuzzyEquals(ct.start, start_cm) && fuzzyEquals(ct.end, end_cm));
    let isClosetFrameSegment = closetFrameSegments.some(cf => fuzzyEquals(cf.start, start_cm) && fuzzyEquals(cf.end, end_cm)); // 🟢
let isMainSizeSegment = isCabinetSegment || isCountertopSegment || isClosetFrameSegment || isPillarSegment;
    let rowOffset = isMainSizeSegment ? lineOffsetMain : lineOffsetGap;

    // تنظیم رنگ برای چهارچوب یا کابینت یا صفحه
    if (isCabinetSegment || isCountertopSegment || isClosetFrameSegment) { // 🟢 شرط اضافه شد
      ctx.fillStyle = COLORS.cabinetText; 
      ctx.strokeStyle = COLORS.woodBorder; 
    } else if (isPillarSegment) {
      ctx.fillStyle = COLORS.pillarBg || "#666"; 
      ctx.strokeStyle = COLORS.dimPillarLine || "#444";
    } else {
      ctx.fillStyle = COLORS.dimWallText; 
      ctx.strokeStyle = COLORS.dimWallLine;
    }

    ctx.lineWidth = 0.5;

    const segStartX = (ptStart.x + ux * start_cm) * scale;
    const segStartY = (ptStart.y + uy * start_cm) * scale;
    const segEndX = (ptStart.x + ux * end_cm) * scale;
    const segEndY = (ptStart.y + uy * end_cm) * scale;

    const extStartX = segStartX + nx * rowOffset;
    const extStartY = segStartY + ny * rowOffset;
    const extEndX = segEndX + nx * rowOffset;
    const extEndY = segEndY + ny * rowOffset;

    ctx.beginPath();
    ctx.moveTo(segStartX, segStartY);
    ctx.lineTo(segStartX + nx * extLength, segStartY + ny * extLength); 
    ctx.moveTo(segEndX, segEndY);
    ctx.lineTo(segEndX + nx * extLength, segEndY + ny * extLength); 
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(extStartX, extStartY);
    ctx.lineTo(extEndX, extEndY);
    ctx.stroke();

    const textX = extStartX + (extEndX - extStartX) / 2;
    const textY = extStartY + (extEndY - extStartY) / 2;
    
    const textOffset = 8 + (4 * scale);
    const finalTextX = textX + nx * textOffset;
    const finalTextY = textY + ny * textOffset;

    ctx.save();
    ctx.translate(finalTextX, finalTextY);
    
    let textAngle = angle;
    if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) textAngle += Math.PI;
    ctx.rotate(textAngle);
    
    ctx.fillText(`${gap_cm} cm`, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}





function autoFitRoom() {
    const bounds = getRoomBounds();

    // 🔴 جلوگیری از باگ تقسیم بر صفر
    if (bounds.w === 0 || bounds.d === 0) return;

    DIM_SPACE = 50; 
    
    // باید از ابعاد کادر بیرونی (Wrapper) استفاده کنیم نه خود Canvas
    let availW = canvasWrapper.clientWidth * 0.95;
    let availH = canvasWrapper.clientHeight * 0.95;

    const scaleX = (availW - 2 * DIM_SPACE) / bounds.w;
    const scaleY = (availH - 2 * DIM_SPACE) / bounds.d;
    
    let newScale = Math.min(scaleX, scaleY);
    
    if (newScale < 0.05) newScale = 0.05;
    if (newScale > 10) newScale = 10;
    
    scale = newScale;
    panOffset = { x: 0, y: 0 }; // ریست کردن موقعیت جابجایی
    
    adjustCanvasSize();
    draw();
}

function getRoomBounds() {
    if (typeof room === 'undefined') return { w: 0, d: 0, centerX: 0, centerY: 0 };
    if (!room.walls) return { w: room.w, d: room.d, centerX: room.w/2, centerY: room.d/2 };

    const tAng = room.walls.top.angle * (Math.PI / 180);
    const lAng = room.walls.left.angle * (Math.PI / 180);
    const bAng = room.walls.bottom.angle * (Math.PI / 180);
    const rAng = room.walls.right.angle * (Math.PI / 180);

    const ptTL_cm = { x: 0, y: 0 };
    const ptTR_cm = { x: room.walls.top.len * Math.cos(tAng), y: room.walls.top.len * Math.sin(tAng) };
    const ptBL_cm = { x: room.walls.left.len * Math.cos(lAng), y: room.walls.left.len * Math.sin(lAng) };
    const ptBR_right_cm = { x: ptTR_cm.x - room.walls.right.len * Math.cos(rAng), y: ptTR_cm.y - room.walls.right.len * Math.sin(rAng) };
    const ptBR_bottom_cm = { x: ptBL_cm.x - room.walls.bottom.len * Math.cos(bAng), y: ptBL_cm.y - room.walls.bottom.len * Math.sin(bAng) };

    const xs_cm = [ptTL_cm.x, ptTR_cm.x, ptBL_cm.x, ptBR_right_cm.x, ptBR_bottom_cm.x];
    const ys_cm = [ptTL_cm.y, ptTR_cm.y, ptBL_cm.y, ptBR_right_cm.y, ptBR_bottom_cm.y];

    // >> شروع بخش اضافه شده برای دیوارهای کاستوم
    const baseEndpointsCm = {
        top: { start: ptTL_cm, end: ptTR_cm },
        left: { start: ptTL_cm, end: ptBL_cm },
        right: { start: ptBR_right_cm, end: ptTR_cm },
        bottom: { start: ptBR_bottom_cm, end: ptBL_cm },
        connect: { start: ptBR_right_cm, end: ptBR_bottom_cm }
    };

    if (window.customWalls && window.customWalls.length > 0) {
        window.customWalls.forEach((cWall) => {
            const targetCm = baseEndpointsCm[cWall.targetWall];
            if (!targetCm) return;
            
            const p1_cm = (cWall.attachment === 'end') ? targetCm.end : targetCm.start;
            const cAngRad = cWall.angle * (Math.PI / 180);
            const p2_cm = {
                x: p1_cm.x + cWall.len * Math.cos(cAngRad),
                y: p1_cm.y + cWall.len * Math.sin(cAngRad)
            };

            baseEndpointsCm[cWall.id] = { start: p1_cm, end: p2_cm }; // برای اتصال زنجیره‌ای دیوارها
            xs_cm.push(p1_cm.x, p2_cm.x);
            ys_cm.push(p1_cm.y, p2_cm.y);
        });
    }
    // << پایان بخش اضافه شده

    const minX = Math.min(...xs_cm);
    const maxX = Math.max(...xs_cm);
    const minY = Math.min(...ys_cm);
    const maxY = Math.max(...ys_cm);
    
    const w = maxX - minX || 1;
    const d = maxY - minY || 1;

    return { w: w, d: d };
}





function rotateCabinet() {
  if (selectedId === -1) return;
  
  let c = cabinets.find((x) => x.id === selectedId);
  if (!c) return;

  // بررسی قفل بودن کمد/کابینت
  if (c.isLocked) {
    alert("این آیتم قفل است و امکان چرخش آن وجود ندارد.");
    return;
  }

  // مقدار چرخش جدید (0, 1, 2, 3 -> معادل 0, 90, 180, 270 درجه)
  let newRot = (c.rot + 1) % 4;

  // محاسبه عرض و عمق ظاهری در صفحه دوبعدی بر اساس جهت چرخش
  // در زوایای فرد (90 و 270 درجه)، عرض و عمق روی نقشه جایشان عوض می‌شود
  let effectiveW = (newRot % 2 === 1) ? c.d : c.w;
  let effectiveD = (newRot % 2 === 1) ? c.w : c.d;

  // بررسی خروج از محدوده اتاق بدون تغییر دادن ابعاد اصلی
  if (c.x + effectiveW > room.w || c.y + effectiveD > room.d) {
    alert("چرخش باعث می‌شود چهارچوب کمد از محدوده اتاق خارج شود.");
    return;
  }

  // اعمال چرخش جدید به آیتم اصلی (ابعاد c.w و c.d کاملاً ثابت می‌مانند)
  c.rot = newRot;

  // 🟢 اگر کمد دارای قطعات زیرمجموعه (چهارچوب/پارت‌ها) است، چرخش آن‌ها را هم به‌روزرسانی کن
  if (c.parts && Array.isArray(c.parts)) {
    c.parts.forEach((part) => {
      part.rot = newRot;
    });
  }

  // به‌روزرسانی پارت‌های انتخاب‌شده در window (در صورت وجود)
  if (window.currentClosetFrameParts && window.currentClosetFrameParts.length > 0) {
    window.currentClosetFrameParts.forEach((part) => {
      part.rot = newRot;
    });
  }

  // بازرسم و به‌روزرسانی محاسبات برش
  draw();
  
  scheduleOptimizeCuts(300);
}


// 🟢 کپی کردن یونیت انتخاب‌شده به همراه تمام مشخصات آن (ابعاد، چرخش، پارت‌ها و ...)
function duplicateSelectedCabinet() {
  if (selectedId === -1) {
    alert("ابتدا یک یونیت را انتخاب کنید.");
    return;
  }

  let c = cabinets.find((x) => x.id === selectedId);
  if (!c) return;

  // کپی کامل و عمیق از یونیت، شامل تمام مشخصات: ابعاد (w, d, h)، چرخش، پارت‌ها، پنل‌ها و ...
  let newC = JSON.parse(JSON.stringify(c));

  // شناسه یکتای جدید برای کپی
  newC.id = Date.now() + Math.floor(Math.random() * 1000);

  // کپی جدید نباید قفل باشد تا کاربر بلافاصله بتواند جابجایش کند
  newC.isLocked = false;

  // جابجایی کمی نسبت به یونیت اصلی تا روی هم قرار نگیرند
  const OFFSET = 10; // سانتی‌متر
  newC.x = c.x + OFFSET;
  newC.y = c.y + OFFSET;

  // اطمینان از اینکه کپی داخل محدوده اتاق باقی می‌ماند
  let dims = getRotatedDims(newC);
  if (newC.x + dims.w > room.w) newC.x = Math.max(0, room.w - dims.w);
  if (newC.y + dims.d > room.d) newC.y = Math.max(0, room.d - dims.d);
  if (newC.x < 0) newC.x = 0;
  if (newC.y < 0) newC.y = 0;

  cabinets.push(newC);

  // انتخاب خودکار یونیت جدید کپی‌شده
  selectCabinet(newC.id);

  draw();

  // کپی یونیت نباید کات‌مستر را اجرا کند؛ فقط رندر به‌روز می‌شود
  if (window.Kitchen3D && typeof Kitchen3D.refreshCabinets === "function") {
    Kitchen3D.refreshCabinets(typeof selectedId !== 'undefined' && selectedId !== -1 ? selectedId : undefined);
  }
}


function deleteCabinet() {
  if (selectedId === -1) return;
  if (!confirm("حذف شود؟")) return;

  // حذف از داده‌ها
  cabinets = cabinets.filter((c) => c.id !== selectedId);

  // پاک کردن انتخاب و غیرفعال کردن دکمه‌ها
  selectedId = -1;
  if (typeof UnitMiniPreview !== "undefined") UnitMiniPreview.hide(); // این خط را اضافه کنید;
  const doorBtn = document.getElementById("door-editor-btn");
  if (doorBtn) doorBtn.disabled = true;
  const colorBtn = document.getElementById("color-editor-btn");
  if (colorBtn) colorBtn.disabled = true;

  // پاک کردن فیلدهای ورودی کابینت (اگر وجود دارند)
  const inputs = ["c_x", "c_y", "c_w", "c_d", "c_h", "c_elevation"];
  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  scheduleOptimizeCuts(300);
  // تضمین بازنقش‌دهی کامل
  refreshUI();

  // اطمینان: همواره activeView را هم در صورت نیاز sync کن
  setActiveView(activeView);
}

function updateCabinet() {
  if (selectedId === -1) return;
  let c = cabinets.find((x) => x.id === selectedId);
  
  c.x = parseFloat(document.getElementById("c_x").value);
  c.y = parseFloat(document.getElementById("c_y").value);
  c.w = parseFloat(document.getElementById("c_w").value);
  c.d = parseFloat(document.getElementById("c_d").value);
  c.h = parseFloat(document.getElementById("c_h").value);
  c.elevation = parseFloat(document.getElementById("c_elevation").value) || 0;

let angleInput = document.getElementById("size-angle");
  if (angleInput) c.angle = parseFloat(angleInput.value) || 0;


  let dims = getRotatedDims(c);
  if (c.x < 0 || c.y < 0 || c.x + dims.w > room.w || c.y + dims.d > room.d) {
   console.warn("موقعیت کابینت موقتاً خارج از اتاق است.");
  }

  draw();
  scheduleOptimizeCuts(300);

  // --- آپدیت همزمان 3D و مینی پریویو ---
  // اول: آپدیت مدل‌های 3D در صحنه اصلی
  if (window.Kitchen3D && typeof Kitchen3D.refreshCabinets === "function") {
      Kitchen3D.refreshCabinets(typeof selectedId !== 'undefined' && selectedId !== -1 ? selectedId : undefined);
  }

  // دوم: آپدیت مینی پریویو با دیتای همین کابینت (c)
  if (window.UnitMiniPreview && typeof window.UnitMiniPreview.updatePreview === "function") {
      window.UnitMiniPreview.updatePreview(c);
  }
}



// ==========================================
// دکمه‌های شناور کنار یونیت انتخاب‌شده (نمای ۲ بعدی)
// ==========================================
function getFloatingPlacementForCabinet(c) {
  // نزدیکی به دیوار (سانتی‌متر) — اگر نزدیک باشد، نوار شناور به سمت مخالف می‌رود
  const threshold = 22;
  const dims = typeof getRotatedDims === 'function' ? getRotatedDims(c) : { w: c.w || 0, d: c.d || 0 };
  const x = c.x || 0;
  const y = c.y || 0;
  const w = dims.w || 0;
  const d = dims.d || 0;
  const roomW = room.w || 0;
  const roomD = room.d || 0;

  const nearTop = y < threshold;
  const nearBottom = (y + d) > (roomD - threshold);
  const nearLeft = x < threshold;
  const nearRight = (x + w) > (roomW - threshold);

  // اولویت: دور از دیوارهایی که یونیت به آن‌ها چسبیده
  if (nearTop && nearBottom) {
    if (nearLeft && !nearRight) return 'right';
    if (nearRight && !nearLeft) return 'left';
    return 'right';
  }
  if (nearTop) return 'bottom';
  if (nearBottom) return 'top';
  if (nearLeft) return 'right';
  if (nearRight) return 'left';
  return 'top';
}

function getCabinetCanvasPoint(c) {
  if (!c || !canvas) return null;
  let maxW = room.w || 0;
  let maxD = room.d || 0;
  if (room.walls) {
    maxW = Math.max(room.walls.top?.len || 0, room.walls.bottom?.len || 0, maxW);
    maxD = Math.max(room.walls.left?.len || 0, room.walls.right?.len || 0, maxD);
  }
  const roomScaledW = maxW * scale;
  const roomScaledH = maxD * scale;
  const centerX = roomScaledW / 2;
  const centerY = roomScaledH / 2;
  const dims = typeof getRotatedDims === 'function' ? getRotatedDims(c) : { w: c.w || 0, d: c.d || 0 };
  const x = (c.x || 0) * scale;
  const y = (c.y || 0) * scale;
  const w = (dims.w || 0) * scale;
  const h = (dims.d || 0) * scale;

  const originX = canvas.width / 2 - centerX;
  const originY = canvas.height / 2 - centerY;

  const placement = getFloatingPlacementForCabinet(c);
  let canvasX, canvasY;
  if (placement === 'bottom') {
    canvasX = originX + x + w / 2;
    canvasY = originY + y + h;
  } else if (placement === 'left') {
    canvasX = originX + x;
    canvasY = originY + y + h / 2;
  } else if (placement === 'right') {
    canvasX = originX + x + w;
    canvasY = originY + y + h / 2;
  } else {
    // top (پیش‌فرض)
    canvasX = originX + x + w / 2;
    canvasY = originY + y;
  }
  return { canvasX, canvasY, w, h, placement };
}

function ensureFloatingUnitControlEvents() {
  const el = document.getElementById('floating-unit-controls');
  if (!el || el.dataset.eventsBound === '1') return;
  el.dataset.eventsBound = '1';

  // فقط در فاز bubble متوقف کن تا کلیک به خود دکمه برسد،
  // ولی به canvas-wrapper (درگ/انتخاب) نرسد
  ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend', 'pointerdown'].forEach((type) => {
    el.addEventListener(type, (e) => {
      e.stopPropagation();
    }, false);
  });

  const lockBtn = document.getElementById('float-lock-btn');
  const rotateBtn = document.getElementById('float-rotate-btn');
  const dupBtn = document.getElementById('float-duplicate-btn');

  if (lockBtn) {
    lockBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof toggleLock === 'function') toggleLock();
      updateFloatingUnitControls();
      if (typeof draw === 'function') draw();
    });
  }
  if (rotateBtn) {
    rotateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof rotateSelectedCabinetFromToolbar === 'function') {
        rotateSelectedCabinetFromToolbar();
      } else if (typeof rotateCabinet === 'function') {
        rotateCabinet();
      } else if (typeof rotateSelectedCabinet === 'function') {
        rotateSelectedCabinet();
      }
      updateFloatingUnitControls();
      if (typeof draw === 'function') draw();
    });
  }
  if (dupBtn) {
    dupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof duplicateSelectedCabinetFromToolbar === 'function') {
        duplicateSelectedCabinetFromToolbar();
      } else if (typeof duplicateSelectedCabinet === 'function') {
        duplicateSelectedCabinet();
      }
      updateFloatingUnitControls();
      if (typeof draw === 'function') draw();
    });
  }
}

function updateFloatingUnitControls() {
  const el = document.getElementById('floating-unit-controls');
  if (!el || !canvas || !canvasWrapper) return;
  ensureFloatingUnitControlEvents();

  // فقط در نمای ۲ بعدی پلان
  const is2DPlan = !activeView || activeView === 'floor' || activeView === 'wall' || activeView === 'wall-top' || activeView === 'merged';
  const elevContainer = document.getElementById('elev-view-container');
  const elevVisible = elevContainer && elevContainer.style.display !== 'none' && elevContainer.offsetParent !== null;

  if (!is2DPlan || elevVisible || selectedId === -1) {
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
    return;
  }

  const c = cabinets.find((x) => x.id === selectedId);
  if (!c) {
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
    return;
  }

  const pt = getCabinetCanvasPoint(c);
  if (!pt) {
    el.style.display = 'none';
    return;
  }

  const canvasRect = canvas.getBoundingClientRect();
  const wrapperRect = canvasWrapper.getBoundingClientRect();
  if (!canvasRect.width || !canvas.width) {
    el.style.display = 'none';
    return;
  }

  const scaleX = canvasRect.width / canvas.width;
  const scaleY = canvasRect.height / canvas.height;
  // موقعیت نسبت به canvas-wrapper
  const left = (canvasRect.left - wrapperRect.left) + pt.canvasX * scaleX;
  const top = (canvasRect.top - wrapperRect.top) + pt.canvasY * scaleY;

  el.style.display = 'flex';
  el.style.left = left + 'px';
  el.style.top = top + 'px';
  el.setAttribute('aria-hidden', 'false');

  // کلاس جهت قرارگیری (دور از دیوار)
  el.classList.remove('float-pos-top', 'float-pos-bottom', 'float-pos-left', 'float-pos-right');
  el.classList.add('float-pos-' + (pt.placement || 'top'));

  // وضعیت قفل روی دکمه شناور
  const lockBtn = document.getElementById('float-lock-btn');
  const rotateBtn = document.getElementById('float-rotate-btn');
  if (lockBtn) {
    lockBtn.textContent = c.isLocked ? '🔒' : '🔓';
  }
  if (rotateBtn) {
    rotateBtn.disabled = !!c.isLocked;
    rotateBtn.style.opacity = c.isLocked ? '0.4' : '1';
  }
}

function selectCabinet(id) {
    selectedId = id;
    selectedPillarId = -1;
    window.isClosetFrameSelected = false;

    // فعال کردن دکمه‌های ویرایش
    ["door-editor-btn", "color-editor-btn", "countertop-editor-btn"].forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) btn.disabled = false;
    });

    let c = cabinets.find((x) => x.id === id);
    if (c) {
        // ⭐ اضافه شدن پیش‌نمایش سه‌بعدی ⭐
        if (typeof UnitMiniPreview !== "undefined") {
            UnitMiniPreview.show();
            UnitMiniPreview.updatePreview(c);
        }

        // ⭐ اصلاح هوشمند برای تغییر نما ⭐
        if (activeView !== "merged") {
            if (c.isUpperTier && activeView !== "wall-top") {
                setActiveView("wall-top");
            } else if (!c.isUpperTier && c.type === "wall" && activeView !== "wall") {
                setActiveView("wall");
            } else if ((c.type === "floor" || c.type === "waterproof") && activeView !== "floor") {
                setActiveView("floor");
            }
        }
        
        // آپدیت زنده پنل ابعاد
        if (document.getElementById("size-panel") && 
            document.getElementById("size-panel").classList.contains("active")) {
            openEditSizePanel(); 
        }

        // ⭐ اضافه شدن آپدیت زنده پنل نما ⭐
        if (document.getElementById("facade-editor-panel") && 
            document.getElementById("facade-editor-panel").classList.contains("active")) {
            openFacadeEditorPanel();
        }
    }
    updateToolbarPositionInputs();
    draw();
    if (typeof updateFloatingUnitControls === 'function') updateFloatingUnitControls();
}






function getPos(e) {
  let rect = canvas.getBoundingClientRect();
  let clientX = e.touches ? e.touches[0].clientX : e.clientX;
  let clientY = e.touches ? e.touches[0].clientY : e.clientY;

  // استفاده از مرکزی که در تابع draw محاسبه شده است
  // اگر هنوز محاسبه نشده بود، مقادیر پیش‌فرض را می‌دهیم
  let cx = window.currentCenterX || ((room.w || 400) * scale) / 2;
  let cy = window.currentCenterY || ((room.d || 300) * scale) / 2;

  // محاسبه میزان دقیق شیفت بوم (دقیقاً بر اساس فرمول translate در تابع draw)
  let offsetX = (canvas.width / 2) - cx;
  let offsetY = (canvas.height / 2) - cy;

  // تبدیل مختصات کلیک موس با در نظر گرفتن آفست
  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
  };
}


function getClientPos(e) {
  return {
    x: e.touches ? e.touches[0].clientX : e.clientX,
    y: e.touches ? e.touches[0].clientY : e.clientY,
  };
}

/**
 * تابع دقیق تشخیص کلیک روی چهارچوب کمد دیواری در تمامی زوایا (0, 90, 180, 270)
 */
function checkClosetFrameClick(mouseX, mouseY) {
    const unit = window.closetFrameUnit;
    if (!unit) return false;

    // ۱. مرکز کمد دیواری (بر حسب سانتی‌متر)
    const centerX = unit.x + unit.w / 2;
    const centerY = unit.y + unit.d / 2;

    // ۲. فاصله نقطه کلیک کاربر تا مرکز کمد
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    // ۳. زاویه فعلی بر حسب رادیان
    const rotDeg = unit.rot || unit.angle || 0;
    const angleRad = (rotDeg * 90) * (Math.PI / 180);

    // ۴. چرخاندن معکوس نقطه کلیک حول مرکز کمد
    const localX = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
    const localY = dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad);

    // ۵. چک کردن مرزها بر اساس ابعاد اصلی ثابت (بدون دستکاری w و d)
    const halfW = unit.w / 2;
    const halfD = unit.d / 2;

    return (
        localX >= -halfW &&
        localX <= halfW &&
        localY >= -halfD &&
        localY <= halfD
    );
}


// --- مدیریت درگ کابینت/ستون و درگ
function startDragOrPan(e) {
  // کلیک روی دکمه‌های شناور یونیت را نادیده بگیر (جلوگیری از درگ/حذف انتخاب)
  const t = e.target;
  if (t && (t.closest && t.closest('#floating-unit-controls'))) {
    e.stopPropagation();
    return;
  }

  let pos = getPos(e);

  // ۱. فیلتر دقیق بر اساس نمای فعال
  const filteredCabs = cabinets.filter((c) => {
    if (activeView === "merged") return true;
    if (activeView === "floor") return c.type === "floor" || c.type === "waterproof";
    if (activeView === "wall") return (c.type === "wall" && !c.isUpperTier);
    if (activeView === "wall-top") return (c.isUpperTier === true);
    return false;
  });

  const draggableCabinets = [...filteredCabs].reverse();

  let clickedCabinet = draggableCabinets.find((c) => {
    let d = getRotatedDims(c);
    return (
      pos.x >= c.x && pos.x <= c.x + d.w && pos.y >= c.y && pos.y <= c.y + d.d
    );
  });

  let clickedPillar = pillars.find((p) => {
    return (
      pos.x >= p.x && pos.x <= p.x + p.w && pos.y >= p.y && pos.y <= p.y + p.d
    );
  });

  let clickedCountertop = null;
  if ((activeView === "merged" || activeView === "worktop-merged") && typeof allCountertops !== "undefined") {
    clickedCountertop = [...allCountertops].reverse().find((ct) => {
      if (!ct.enabled) return false;
      let w = (ct.rotation === 90 || ct.rotation === 270) ? ct.width : ct.length;
      let d = (ct.rotation === 90 || ct.rotation === 270) ? ct.length : ct.width;
      return pos.x >= ct.x && pos.x <= ct.x + w && pos.y >= ct.y && pos.y <= ct.y + d;
    });
  }
 // 🌟 تشخیص کلیک روی هر کدوم از چندین چهارچوب کمد دیواری
  let clickedClosetFrame = null;
  const allClosetFrames = window.closetFrameUnits || [];

  for (let i = allClosetFrames.length - 1; i >= 0; i--) {
      const u = allClosetFrames[i];
      const angleRad = ((u.rot || 0) * 90 * Math.PI) / 180;
      const cx = u.x + u.w / 2;
      const cy = u.y + u.d / 2;
      const dx = pos.x - cx;
      const dy = pos.y - cy;
      const localX = dx * Math.cos(-angleRad) - dy * Math.sin(-angleRad);
      const localY = dx * Math.sin(-angleRad) + dy * Math.cos(-angleRad);
      const clickPadding = 8;
      if (Math.abs(localX) <= (u.w / 2) + clickPadding && Math.abs(localY) <= (u.d / 2) + clickPadding) {
          clickedClosetFrame = u;
          break;
      }
  }

  if (clickedCabinet || clickedPillar || clickedCountertop || clickedClosetFrame) {
    e.preventDefault();
    
    // 🟢 بررسی قفل ستون
    if (clickedPillar && clickedPillar.isLocked) {
      selectPillar(clickedPillar.id);
      isDragging = false;
      isDraggingPillar = false;
      isDraggingClosetFrame = false;
      if (typeof updateToolbarPositionInputs === 'function') updateToolbarPositionInputs();
      return; 
    }

    // 🟢 بررسی قفل کابینت
    if (clickedCabinet && clickedCabinet.isLocked) {
      selectCabinet(clickedCabinet.id);
      isDragging = false;
      isDraggingPillar = false;
      isDraggingClosetFrame = false;
      if (typeof updateToolbarPositionInputs === 'function') updateToolbarPositionInputs();
      return; 
    }

    // 🟢 بررسی قفل چهارچوب کمد
    if (clickedClosetFrame && clickedClosetFrame.isLocked) {
      window.isClosetFrameSelected = true;
      window.selectedClosetFrameId = clickedClosetFrame.id;
      window.closetFrameUnit = clickedClosetFrame;
      isDragging = false;
      isDraggingPillar = false;
      isDraggingCountertop = false;
      isDraggingClosetFrame = false;
      selectedId = -1;
      selectedPillarId = -1;
      if (typeof selectCountertop === "function") selectCountertop(null);
      if (typeof updateToolbarPositionInputs === 'function') updateToolbarPositionInputs();
      draw();
      return;
    }

    if (clickedPillar) {
      selectPillar(clickedPillar.id);
      isDraggingPillar = true;
      window.isClosetFrameSelected = false;
      window.selectedClosetFrameId = null;
      isDraggingCountertop = false;
      isDraggingClosetFrame = false;
      window.isClosetFrameSelected = false;
      objStart = { x: clickedPillar.x, y: clickedPillar.y };
    } else if (clickedCountertop) {
      window.selectedCountertopIndex = allCountertops.findIndex(ct => ct === clickedCountertop);
      window.selectedCountertopId = clickedCountertop.id; 
      if (typeof selectCountertop === "function") selectCountertop(clickedCountertop.id);
      
      isDraggingPillar = false;
      isDraggingCountertop = true; 
      isDraggingClosetFrame = false;
      window.isClosetFrameSelected = false;
      window.selectedClosetFrameId = null;
      objStart = { x: clickedCountertop.x, y: clickedCountertop.y };
      
      selectedId = -1;
      selectedPillarId = -1;
} else if (clickedClosetFrame) {
      isDraggingPillar = false;
      isDraggingCountertop = false;
      isDraggingClosetFrame = true;
      window.isClosetFrameSelected = true;
      window.selectedClosetFrameId = clickedClosetFrame.id;
      window.closetFrameUnit = clickedClosetFrame;
      

      objStart = { x: clickedClosetFrame.x, y: clickedClosetFrame.y };

      selectedId = -1;
      selectedPillarId = -1;
      if (typeof selectCountertop === "function") selectCountertop(null);
      
      // غیرفعال‌سازی دکمه‌های ویرایش مخصوص کابینت
      ["door-editor-btn", "color-editor-btn", "countertop-editor-btn"].forEach(id => {
          const btn = document.getElementById(id);
          if (btn) btn.disabled = true;
      });

      if (typeof updateToolbarPositionInputs === 'function') updateToolbarPositionInputs();
      draw();
    } else {
      selectCabinet(clickedCabinet.id);
      isDraggingPillar = false;
      isDraggingCountertop = false;
      isDraggingClosetFrame = false;
      window.isClosetFrameSelected = false;
      window.selectedClosetFrameId = null;
      objStart = { x: clickedCabinet.x, y: clickedCabinet.y };
    }

    isDragging = true;
    dragStart = pos;
    isPanning = false;
  } else {
    // منطق Pan بوم
    if (e.button === 0 || e.touches) {
      isPanning = true;
      panStart = getClientPos(e);
      canvas.style.cursor = "grabbing";
      selectedId = -1;
      if (typeof UnitMiniPreview !== "undefined") UnitMiniPreview.hide();
      selectedPillarId = -1;
      window.selectedCountertopIndex = -1; 
      window.selectedCountertopId = null;  
      isDraggingClosetFrame = false;
      window.isClosetFrameSelected = false;
      window.selectedClosetFrameId = null;
      if (typeof selectCountertop === "function") selectCountertop(null);

      ["door-editor-btn", "color-editor-btn", "countertop-editor-btn"].forEach(id => {
          const btn = document.getElementById(id);
          if (btn) btn.disabled = true;
      });
      
      if (typeof updateToolbarPositionInputs === 'function') updateToolbarPositionInputs();
      draw();
    }
  }
}

// --- ⭐ چسبندگی بین یونیت‌ها (کابینت/چهارچوب کمد دیواری/ستون/میزکار) هنگام جابجایی در نمای دو‌بعدی ---

// جعبه محصورکننده (AABB) یک یونیت رو برمی‌گردونه: گوشه بالا-چپ (x,y) + عرض/عمق (w,d)
function getUnitAABB(u, kind) {
    if (kind === 'cabinet') {
        const dims = getRotatedDims(u);
        return { x: u.x, y: u.y, w: dims.w, d: dims.d };
    }
    if (kind === 'countertop') {
        const w = (u.rotation === 90 || u.rotation === 270) ? u.width : u.length;
        const d = (u.rotation === 90 || u.rotation === 270) ? u.length : u.width;
        return { x: u.x, y: u.y, w, d };
    }
    return { x: u.x, y: u.y, w: u.w, d: u.d };
}

// جمع‌آوری جعبه‌ی همه یونیت‌های دیگر (به‌جز خودِ یونیتی که در حال جابجایی‌ست)
function collectOtherUnitBoxes(excludeKind, excludeId) {
    const boxes = [];

    (cabinets || []).forEach(c => {
        if (excludeKind === 'cabinet' && c.id === excludeId) return;
        boxes.push(getUnitAABB(c, 'cabinet'));
    });

    (window.closetFrameUnits || []).forEach(u => {
        if (excludeKind === 'closetFrame' && u.id === excludeId) return;
        boxes.push(getUnitAABB(u, 'closetFrame'));
    });

    (pillars || []).forEach(p => {
        if (excludeKind === 'pillar' && p.id === excludeId) return;
        boxes.push(getUnitAABB(p, 'pillar'));
    });

    if (typeof allCountertops !== 'undefined') {
        (allCountertops || []).forEach(ct => {
            if (excludeKind === 'countertop' && ct.id === excludeId) return;
            boxes.push(getUnitAABB(ct, 'countertop'));
        });
    }

    return boxes;
}

// محاسبه‌ی موقعیت اسنپ‌شده (newX/newY) بر اساس نزدیک‌ترین لبه‌ی یونیت‌های مجاور
function snapToOtherUnits(newX, newY, w, d, boxes, threshold) {
    let bestDX = null, bestDXDist = Infinity;
    let bestDY = null, bestDYDist = Infinity;

    boxes.forEach(b => {
        // فقط وقتی روی محور مقابل هم‌پوشانی دارن (یعنی واقعاً کنار هم قرار می‌گیرن) اسنپ انجام بشه
        const overlapY = (newY < b.y + b.d) && (newY + d > b.y);
        const overlapX = (newX < b.x + b.w) && (newX + w > b.x);

        if (overlapY) {
            const gapRight = Math.abs((newX + w) - b.x);       // لبه راست به لبه چپ همسایه
            if (gapRight < threshold && gapRight < bestDXDist) { bestDXDist = gapRight; bestDX = b.x - w; }

            const gapLeft = Math.abs(newX - (b.x + b.w));       // لبه چپ به لبه راست همسایه
            if (gapLeft < threshold && gapLeft < bestDXDist) { bestDXDist = gapLeft; bestDX = b.x + b.w; }

            const alignLeft = Math.abs(newX - b.x);             // هم‌تراز شدن لبه‌های چپ
            if (alignLeft < threshold && alignLeft < bestDXDist) { bestDXDist = alignLeft; bestDX = b.x; }

            const alignRight = Math.abs((newX + w) - (b.x + b.w)); // هم‌تراز شدن لبه‌های راست
            if (alignRight < threshold && alignRight < bestDXDist) { bestDXDist = alignRight; bestDX = (b.x + b.w) - w; }
        }

        if (overlapX) {
            const gapBottom = Math.abs((newY + d) - b.y);       // لبه پایین به لبه بالای همسایه
            if (gapBottom < threshold && gapBottom < bestDYDist) { bestDYDist = gapBottom; bestDY = b.y - d; }

            const gapTop = Math.abs(newY - (b.y + b.d));        // لبه بالا به لبه پایین همسایه
            if (gapTop < threshold && gapTop < bestDYDist) { bestDYDist = gapTop; bestDY = b.y + b.d; }

            const alignTop = Math.abs(newY - b.y);              // هم‌تراز شدن لبه‌های بالا
            if (alignTop < threshold && alignTop < bestDYDist) { bestDYDist = alignTop; bestDY = b.y; }

            const alignBottom = Math.abs((newY + d) - (b.y + b.d)); // هم‌تراز شدن لبه‌های پایین
            if (alignBottom < threshold && alignBottom < bestDYDist) { bestDYDist = alignBottom; bestDY = (b.y + b.d) - d; }
        }
    });

    return {
        x: bestDX !== null ? bestDX : newX,
        y: bestDY !== null ? bestDY : newY
    };
}

function moveDragOrPan(e) {
    if (isDragging) {
        // 🟢 ۱. چک کردن قفل در ابتدای حرکت
        const c = cabinets.find(x => x.id === selectedId);
        const p = pillars.find(x => x.id === selectedPillarId);
        if ((c && c.isLocked) || (p && p.isLocked)) return;

        if (isDraggingClosetFrame && window.currentClosetFrameParts && window.currentClosetFrameParts[0]) {
            if (window.currentClosetFrameParts[0].isLocked) return;
        }

        e.preventDefault();
        
        let pos = getPos(e);
        let dx = pos.x - dragStart.x;
        let dy = pos.y - dragStart.y;
        
        let w, d;
        let isPillar = false;
        let unit = null;
        let dragKind = 'cabinet'; // 🌟 برای تشخیص نوع یونیتِ در حال جابجایی (جهت حذفش از لیست چسبندگی)

        if (isDraggingPillar) {
            unit = pillars.find((x) => x.id === selectedPillarId);
            if (!unit) return;
            w = unit.w;
            d = unit.d;
            isPillar = true;
            dragKind = 'pillar';
        } else if (isDraggingCountertop && typeof allCountertops !== "undefined") {
            unit = allCountertops.find((x) => x.id === window.selectedCountertopId);
            if (!unit) return;
            w = (unit.rotation === 90 || unit.rotation === 270) ? unit.width : unit.length;
            d = (unit.rotation === 90 || unit.rotation === 270) ? unit.length : unit.width;
            dragKind = 'countertop';
} else if (isDraggingClosetFrame) {
            unit = (window.closetFrameUnits || []).find(u => u.id === window.selectedClosetFrameId);
            if (!unit) return;
            w = unit.w;
            d = unit.d;
            dragKind = 'closetFrame';
        } else if (selectedId !== -1) {
            unit = cabinets.find((x) => x.id === selectedId);
            if (!unit) return;
            let dims = getRotatedDims(unit);
            w = dims.w;
            d = dims.d;
            dragKind = 'cabinet';
        }

        if (!unit) return;

        let newX = objStart.x + dx;
        let newY = objStart.y + dy;

        // اسنپینگ و محاسبات برخورد به دیوارهای اتاق
        const tAng = room.walls.top.angle * (Math.PI / 180);
        const lAng = room.walls.left.angle * (Math.PI / 180);
        const bAng = room.walls.bottom.angle * (Math.PI / 180);
        const rAng = room.walls.right.angle * (Math.PI / 180);

        const ptTL = { x: 0, y: 0 };
        const ptTR = { x: room.walls.top.len * Math.cos(tAng), y: room.walls.top.len * Math.sin(tAng) };
        const ptBL = { x: room.walls.left.len * Math.cos(lAng), y: room.walls.left.len * Math.sin(lAng) };
        const ptBR_right = { x: ptTR.x - room.walls.right.len * Math.cos(rAng), y: ptTR.y - room.walls.right.len * Math.sin(rAng) };
        const ptBR_bottom = { x: ptBL.x - room.walls.bottom.len * Math.cos(bAng), y: ptBL.y - room.walls.bottom.len * Math.sin(bAng) };

        const elTop = document.getElementById("wall-top");
        const hasTop = elTop ? elTop.checked : true;
        const elLeft = document.getElementById("wall-left");
        const hasLeft = elLeft ? elLeft.checked : true;
        const elBottom = document.getElementById("wall-bottom");
        const hasBottom = elBottom ? elBottom.checked : true;
        const elRight = document.getElementById("wall-right");
        const hasRight = elRight ? elRight.checked : true;

        let allWalls = [];
        
        if (hasTop) allWalls.push({ start: ptTL, end: ptTR, thick: 0 });
        if (hasLeft) allWalls.push({ start: ptTL, end: ptBL, thick: 0 });
        if (hasRight) allWalls.push({ start: ptBR_right, end: ptTR, thick: 0 });
        if (hasBottom) allWalls.push({ start: ptBR_bottom, end: ptBL, thick: 0 });

        if (window.customWalls && window.customWalls.length > 0) {
            window.customWalls.forEach(cw => {
                if (cw && cw.start && cw.end) allWalls.push(cw);
            });
        }

        const snapThresh = typeof SNAP_DIST !== 'undefined' ? SNAP_DIST : 15;
        const currentAngle = unit.angle !== undefined ? unit.angle : (unit.rotation !== undefined ? unit.rotation : ((unit.rot || 0) * 90));
        const rad = currentAngle * (Math.PI / 180);
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        const origW = unit.w !== undefined ? unit.w : (unit.length || 0);
        const origD = unit.d !== undefined ? unit.d : (unit.width || 0);

        allWalls.forEach(wall => {
            const wallThick = wall.thick ? (wall.thick / 2) : 0;
            const gap = wallThick; 
            
            const unitCenterX = newX + w / 2;
            const unitCenterY = newY + d / 2;
            
            const wallLen = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
            if (wallLen === 0) return;

            const nx = -(wall.end.y - wall.start.y) / wallLen;
            const ny = (wall.end.x - wall.start.x) / wallLen;

            const dotX = nx * cosA + ny * sinA;
            const dotY = -nx * sinA + ny * cosA;

            const R = (origW / 2) * Math.abs(dotX) + (origD / 2) * Math.abs(dotY);

            let closest;
            if (typeof CustomWallPhysics !== 'undefined') {
                 closest = CustomWallPhysics.closestPointOnSegment({ x: unitCenterX, y: unitCenterY }, wall.start, wall.end);
            } else {
                 closest = GEOMETRY.closestPointOnLine({x1: wall.start.x, y1: wall.start.y, x2: wall.end.x, y2: wall.end.y}, {x: unitCenterX, y: unitCenterY});
            }

            const distToCenter = Math.hypot(unitCenterX - closest.x, unitCenterY - closest.y);

            if (distToCenter < R + snapThresh + gap) {
                const dirX = unitCenterX - closest.x;
                const dirY = unitCenterY - closest.y;
                const dot = dirX * nx + dirY * ny;
                const sign = dot >= 0 ? 1 : -1;
                
                const targetDist = R + gap; 
                const targetCenterX = closest.x + (nx * sign * targetDist);
                const targetCenterY = closest.y + (ny * sign * targetDist);
                
                newX = targetCenterX - (w / 2);
                newY = targetCenterY - (d / 2);
            }
});

        // ⭐ چسبندگی بین یونیت‌ها: وقتی لبه‌ی یونیت در حال جابجایی به لبه‌ی یونیت دیگه‌ای نزدیک بشه، خودکار بهش می‌چسبه
        const otherUnitBoxes = collectOtherUnitBoxes(dragKind, unit.id);
        if (otherUnitBoxes.length > 0) {
            const unitSnap = snapToOtherUnits(newX, newY, w, d, otherUnitBoxes, snapThresh);
            newX = unitSnap.x;
            newY = unitSnap.y;
        }

        let canMove = true;
        if (typeof CustomWallPhysics !== 'undefined') {
            const unitCenterX = newX + w / 2; 
            const unitCenterY = newY + d / 2; 

            for (const wall of allWalls) {
                if (CustomWallPhysics.isColliding(unitCenterX, unitCenterY, origW, origD, wall, currentAngle)) {
                    canMove = false; 
                    break; 
                }
            }
        }

        // 🟢 ۲. اعمال موقعیت نهایی محاسبه‌شده
        if (canMove) {
            if (isDraggingClosetFrame && unit) {
                const actualDx = newX - unit.x;
                const actualDy = newY - unit.y;

                unit.x = newX;
                unit.y = newY;

                if (Array.isArray(unit.parts)) {
                    unit.parts.forEach(part => {
                    part.x += actualDx; // فقط X (طول/عرض چهارچوب) - Y ارتفاعه، دست‌نخورده می‌مونه
                });
                }

                // اگه همین یونیت الان تو پنل هم باز باشه، بافر پنل رو هم هماهنگ کن
                if (window.selectedClosetFrameId === unit.id && Array.isArray(window.currentClosetFrameParts)) {
                    window.currentClosetFrameParts.forEach(part => {
                        part.x += actualDx;
                    });
                }

                // فقط جابه‌جایی ترنسفورم — هرگز renderCabinets هنگام درگ (نشت/هنگ)
                if (window.Kitchen3D && typeof window.Kitchen3D.updateClosetFrameTransform === "function") {
                    window.Kitchen3D.updateClosetFrameTransform(unit);
                }
            } else {
                unit.x = newX;
                unit.y = newY;
            }
        }

        if (typeof updateToolbarPositionInputs === 'function') {
            updateToolbarPositionInputs();
        }

        scheduleDraw();

    } else if (isPanning) {
        e.preventDefault();
        let currentPos = getClientPos(e);
        panOffset.x += currentPos.x - panStart.x;
        panOffset.y += currentPos.y - panStart.y;
        panStart = currentPos;
        setCanvasTransform();
    }
}

function endDragOrPan() {
  // اگر در حال درگ چهارچوب کمد بودیم، یک رندر کامل ۳D انجام بده تا همه‌چیز همگام بمونه
  const wasDraggingCloset = isDraggingClosetFrame;
  isDragging = false;
  isDraggingPillar = false;
  isDraggingCountertop = false;
  isDraggingClosetFrame = false;
  isPanning = false;
  
  canvas.style.cursor = "grab";

  // یک‌بار در پایان درگ — با dispose (نه renderCabinets خام)
  if (wasDraggingCloset && window.Kitchen3D) {
      if (typeof window.Kitchen3D.refreshCabinets === "function") {
          window.Kitchen3D.refreshCabinets(typeof selectedId !== 'undefined' && selectedId !== -1 ? selectedId : undefined);
      } else if (typeof window.Kitchen3D.renderCabinets === "function") {
          window.Kitchen3D.renderCabinets();
      }
  }
}


// --- مدیریت رویدادها ---

const wrapper = document.getElementById("canvas-wrapper");

// شروع درگ/پن روی دایو نگه‌دارنده (کل فضای طراحی)
wrapper.addEventListener("mousedown", startDragOrPan);
wrapper.addEventListener("touchstart", startDragOrPan, { passive: false });

// ادامه درگ/پن روی کل صفحه (window) 
window.addEventListener("mousemove", moveDragOrPan);
window.addEventListener("mouseup", endDragOrPan);
window.addEventListener("touchmove", moveDragOrPan, { passive: false });
window.addEventListener("touchend", endDragOrPan);


// --- توابع لیست برش و اتاق (بدون تغییر) ---

function renderList() {
  const el = document.getElementById("cut-list");
  if (!el) return;

  let html = "";

  // فیلتر کردن آیتم‌های قابل مشاهده در نمای فعلی
  const visibleCabinets = cabinets.filter((c) => {
    if (activeView === "merged") return true;
    if (activeView === "floor")    return c.type === "floor" || c.type === "waterproof";
    if (activeView === "wall") return c.type === "wall" && !c.isUpperTier;
    if (activeView === "wall-top") return c.isUpperTier === true;
    return false;
  });

  // مرتب‌سازی بر اساس ID
  const sortedCabinets = [...visibleCabinets].sort((a, b) => a.id - b.id);

  if (sortedCabinets.length === 0) {
    html = `
      <p style="color: ${COLORS.cutListEmpty}; text-align: center; margin-top: 30px; font-size: 15px;">
        ${
          activeView === "merged"
            ? "هنوز آیتمی اضافه نشده است."
            : `در نمای «${
                activeView === "floor" ? "زمینی" : "دیواری"
              }» آیتمی وجود ندارد.`
        }
      </p>
    `;
  } else {
    sortedCabinets.forEach((c) => {
      const isSelected = c.id === selectedId;
      const cls = isSelected ? "cut-item selected" : "cut-item";

      const height = c.h.toFixed(1);
      const depth = c.d.toFixed(1);
      const width = c.w.toFixed(1);

      // استفاده از COLORS برای خط کناری
      const typeColor = (c.type === "floor" || c.type === "waterproof") ? COLORS.cutTypeFloor : COLORS.cutTypeWall;

      // استفاده از COLORS برای استایل انتخاب شدن
      const selectedStyle = isSelected
        ? `background: ${COLORS.cutSelectedBg}; box-shadow: 0 4px 12px ${COLORS.cutSelectedShadow}; transform: translateY(-2px);`
        : "";

      // --- تعیین نام و محتوای لیست بر اساس نوع آیتم ---
      let itemTitle = `یونیت #${c.id}`;
      let itemDetails = "";

      if (c.isAppliance) {
          // اگر وسیله خانگی بود (یخچال، لباسشویی، ظرفشویی)
          itemTitle = `${c.label} #${c.id}`;
          itemDetails = `<span style="color: ${COLORS.cutDetailAppliance}; font-weight: bold;">(لوازم خانگی - بدون نیاز به برش)</span>`;
      } else if (c.isFridgeWrap) {
          // اگر کلاف یخچال بود
          const topW = (c.w - 3.2).toFixed(1); // طاق بالا
          itemTitle = `کلاف یخچال #${c.id}`;
          itemDetails = `
            <span style="color: ${COLORS.cutDetailWallSides};">دیواره (۲):</span> ${height}×${depth}<br>
            <span style="color: ${COLORS.cutDetailFloorTop};">طاق اتصال (۱):</span> ${topW}×${depth}
          `;
      } else {
          // اگر کابینت معمولی بود
          const topW = (c.w - 3.2).toFixed(1); 
         const typeLabel = (c.type === "floor" || c.type === "waterproof") ? "زمینی" : "دیواری";
          itemTitle = `یونیت #${c.id} (${typeLabel})`;
          itemDetails = `
            <span style="color: ${COLORS.cutDetailWallSides};">دیواره (۲):</span> ${height}×${depth}<br>
            <span style="color: ${COLORS.cutDetailFloorTop};">کف/طاق (۲):</span> ${topW}×${depth}<br>
            <span style="color: ${COLORS.cutDetailBackPanel};">فیبر پشتی (۱):</span> ${(c.h - 0.5).toFixed(1)}×${(c.w - 0.5).toFixed(1)}
          `;
      }

      html += `
        <div class="${cls}" 
             onclick="selectCabinet(${c.id})" 
             style="border-right: 6px solid ${typeColor}; ${selectedStyle} transition: all 0.2s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <b style="font-size: 15px;">${itemTitle}</b>
            <small style="color: ${COLORS.cutDimText};">${width} × ${depth} × ${height} cm</small>
          </div>
          <div style="margin-top: 8px; color: ${COLORS.cutDetailText}; font-size: 13px; line-height: 1.6;">
            ${itemDetails}
          </div>
        </div>
      `;
    });
  }

  el.innerHTML = html;

  // محاسبه مجدد چیدمان ورق — با تأخیر تا UI قفل نشود
  scheduleOptimizeCuts(500);
}



function toggleCutList() {
  document.getElementById("cut-list-sidebar").classList.toggle("open");
}

function resetRoom() {
  if (
    confirm(
      "آیا مطمئنید؟ تمامی طراحی فعلی حذف خواهد شد و به صفحه ورود ابعاد باز می‌گردید."
    )
  ) {
    cabinets = [];
    pillars = [];
    selectedId = -1;
    if (typeof UnitMiniPreview !== "undefined") UnitMiniPreview.hide(); // این خط را اضافه کنید;
    selectedPillarId = -1;
    
    document.getElementById("design-panel").style.display = "none";
    document.getElementById("setup-panel").style.display = "flex";
  }
}

function resizeRoom() {
  let newW = prompt(
    "لطفاً طول جدید اتاق (سانتیمتر) را وارد کنید:",
    room.w.toFixed(1)
  );
  let newD = prompt(
    "لطفاً عرض جدید اتاق (سانتیمتر) را وارد کنید:",
    room.d.toFixed(1)
  );

  if (newW === null || newD === null) return;

  newW = parseFloat(newW);
  newD = parseFloat(newD);

  if (newW > 0 && newD > 0) {
    let isSafe = true;
    cabinets.forEach((c) => {
      let dims = getRotatedDims(c);
      if (c.x + dims.w > newW || c.y + dims.d > newD) {
        isSafe = false;
      }
    });
    pillars.forEach((p) => {
      if (p.x + p.w > newW || p.y + p.d > newD) {
        isSafe = false;
      }
    });

    if (
      isSafe ||
      confirm(
        "هشدار: برخی عناصر خارج از ابعاد جدید قرار می‌گیرند. آیا مطمئنید؟"
      )
    ) {
      room.w = newW;
      room.d = newD;
      initRoomScale();
    }
  } else {
    alert("ابعاد وارد شده نامعتبر است.");
  }
}

// --- اضافه کن در بالا (جایی که توابع دیگر هست) ---
function refreshUI() {
  // 1) بروزرسانی لیست (DOM) بلافاصله
  renderList();

  // 2) فقط یک نقاشی در فریم بعدی (قبلاً دو بار draw باعث سنگینی می‌شد)
  scheduleDraw();
}



function initMainSidebar() {
  const sections = document.querySelectorAll("#main-sidebar .menu-section");

  sections.forEach((section) => {
    const header = section.querySelector(".section-header");
    const toggleIcon = section.querySelector(".toggle-icon");
    const content = section.querySelector(".section-content");

    header.addEventListener("click", function (e) {
      e.stopPropagation();

      const isCurrentlyActive = section.classList.contains("active");

      // همه بخش‌ها رو ببند
      sections.forEach((s) => {
        s.classList.remove("active");
        const icon = s.querySelector(".toggle-icon");
        if (icon) icon.src = "Assets/Icons/chevron-down.png";
      });

      // اگر قبلاً باز بود، بسته بشه (هیچ کاری نکن)
      if (isCurrentlyActive) {
        return; // بسته شد، تموم
      }

      // اگر بسته بود، بازش کن
      section.classList.add("active");
      if (toggleIcon) toggleIcon.src = "Assets/Icons/chevron-up.png";
    });

    // جلوی بسته شدن وقتی روی دکمه‌های داخل کلیک می‌کنی
    if (content) {
      content.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
  });

  // فقط بخش "آشپزخانه" از اول باز باشه (با ID)
  const kitchenSection = document.getElementById("kitchen-section");
  if (kitchenSection && !kitchenSection.classList.contains("active")) {
    kitchenSection.classList.add("active");
    const icon = kitchenSection.querySelector(".toggle-icon");
    if (icon) icon.src = "Assets/Icons/chevron-up.png";
  }
}

function closeAllSectionsExcept(clickedBtn) {
  document
    .querySelectorAll("#main-sidebar .menu-section")
    .forEach((section) => {
      section.classList.remove("active");
      const icon = section.querySelector(".toggle-icon");
      if (icon) icon.src = "Assets/Icons/chevron-down.png";
    });

  // باز کردن دوباره بخش "اضافه کردن"
  const addSection = clickedBtn.closest(".menu-section");
  if (addSection) {
    addSection.classList.add("active");
    const icon = addSection.querySelector(".toggle-icon");
    if (icon) icon.src = "Assets/Icons/chevron-up.png";
  }
}



window.onload = () => {
  // This is mainly for debugging in development. In production flow, initRoom calls setActiveView.
};


