const ZOOM_FACTOR = 1.2;

function zoomIn() {
  // 🟢 بررسی اینکه آیا در نمای روبرو (Elev) هستیم
  if (typeof currentActiveView !== 'undefined' && currentActiveView === 'elev') {
    // برای اطمینان، مقدار را از window می‌خوانیم و آپدیت می‌کنیم
    let currentScale = window.elevScale || 0.4;
    currentScale *= ZOOM_FACTOR;
    if (currentScale > 15) currentScale = 15;
    
    window.elevScale = currentScale; // ثبت مجدد در شیء سراسری
    
    // اجرای رسم مجدد نمای روبرو با مقیاس جدید
    if (typeof drawFrontElevation === 'function') {
        drawFrontElevation();
    }
    return; // خروج از تابع جهت اجرا نشدن منطق نمای پلان
  }

  // 🔵 منطق پیش‌فرض زوم برای نمای پلان دو بعدی
  // اطمینان از وجود متغیر scale سراسری روی window یا اسکوپ سراسری
  let currentPlanScale = typeof scale !== 'undefined' ? scale : (window.scale || 1.0);
  currentPlanScale *= ZOOM_FACTOR;
  if (currentPlanScale > 15) currentPlanScale = 15; 
  
  const maxSafeSize = 8000; 
  
  // بررسی وجود تابع ابعاد اتاق برای جلوگیری از خطا
  if (typeof getRoomBounds === 'function') {
      const bounds = getRoomBounds(); // گرفتن ابعاد واقعی اتاق
      const dimSpaceVal = typeof DIM_SPACE !== 'undefined' ? DIM_SPACE : 50;
      
      // بررسی محدودیت مرورگر با ابعاد واقعی
      const roomScaledW = bounds.w * currentPlanScale + (2 * dimSpaceVal);
      const roomScaledH = bounds.d * currentPlanScale + (2 * dimSpaceVal);
      
      if (roomScaledW > maxSafeSize || roomScaledH > maxSafeSize) {
          console.warn("حداکثر زوم مجاز مرورگر");
          return; 
      }
  }

  // اعمال مقدار نهایی مقیاس روی متغیرهای سراسری
  if (typeof scale !== 'undefined') {
      scale = currentPlanScale;
  }
  window.scale = currentPlanScale;

  // اجرای توابع رندر پلان
  if (typeof adjustCanvasSize === 'function') adjustCanvasSize();
  if (typeof draw === 'function') draw();
}

function zoomOut() {
  // 🟢 بررسی اینکه آیا در نمای روبرو (Elev) هستیم
  if (typeof currentActiveView !== 'undefined' && currentActiveView === 'elev') {
    let currentScale = window.elevScale || 0.4;
    currentScale /= ZOOM_FACTOR;
    if (currentScale < 0.05) currentScale = 0.05;
    
    window.elevScale = currentScale; // ثبت مجدد در شیء سراسری
    
    // اجرای رسم مجدد نمای روبرو با مقیاس جدید
    if (typeof drawFrontElevation === 'function') {
        drawFrontElevation();
    }
    return; // خروج از تابع
  }

  // 🔵 منطق پیش‌فرض زوم‌اوت برای نمای پلان دو بعدی
  let currentPlanScale = typeof scale !== 'undefined' ? scale : (window.scale || 1.0);
  currentPlanScale /= ZOOM_FACTOR;
  if (currentPlanScale < 0.05) currentPlanScale = 0.05; 
  
  if (typeof scale !== 'undefined') {
      scale = currentPlanScale;
  }
  window.scale = currentPlanScale;

  if (typeof adjustCanvasSize === 'function') adjustCanvasSize();
  if (typeof draw === 'function') draw();
}

// 🔄 اصلاح تابع ریست برای پشتیبانی از هر دو نمای پلان و نمای روبرو (Elevation)
function initRoomScale() {
  // 🟢 ۱. بررسی اینکه آیا در نمای روبرو (Elev) هستیم
  if (typeof currentActiveView !== 'undefined' && currentActiveView === 'elev') {
    // بازگرداندن مقیاس و آفست جابجایی نمای جدید به حالت پیش‌فرض اولیه
    window.elevScale = 0.4;
    window.elevPanOffset = { x: 0, y: 0 };
    
    // اجرای رسم مجدد نمای روبرو با مقادیر ریست شده
    if (typeof drawFrontElevation === 'function') {
        drawFrontElevation();
    }
    return; // خروج از تابع جهت اجرا نشدن منطق نمای پلان
  }

  // 🔵 ۲. منطق پیش‌فرض ریست برای نمای پلان دو بعدی
  if (typeof autoFitRoom === 'function') {
      autoFitRoom();
  }
}
