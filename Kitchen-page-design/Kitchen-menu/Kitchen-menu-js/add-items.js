
// تغییر توابع اضافه کردن کابینت (مهم!)
function addFloorCabinet() {
  let id = cabinets.length ? cabinets[cabinets.length - 1].id + 1 : 1;
  let newCab = {
    id: id,
    x: 50,
    y: 50,
    w: 90.0,
    d: 55.0,
    h: 73.6,
    rot: 0,
    type: "floor",
    elevation: 14,
  };
  cabinets.push(newCab);
  selectCabinet(id);
  setActiveView("floor");
}

function addWallCabinet() {
  let id = cabinets.length ? cabinets[cabinets.length - 1].id + 1 : 1;
  let newCab = {
    id: id,
    x: 50,
    y: 30,
    w: 90.0,
    d: 35.0,
    h: 70.0,
    rot: 0,
    type: "wall",
    elevation: 150,
    underCabinetLight: { enabled: false, intensity: 1.0, color: 0xfff2e0 },
  };
  cabinets.push(newCab);
  selectCabinet(id);
  setActiveView("wall");
}

function addUpperWallCabinet() {
  // پیدا کردن ID جدید
  let id = cabinets.length ? Math.max(...cabinets.map(c => c.id)) + 1 : 1;
  
  let newCab = {
    id: id,
    x: 60,         // موقعیت اولیه در پلان
    y: 40,
    w: 90.0,       // عرض پیش‌فرض
    d: 45.0,       // عمق پیش‌فرض
    h: 40.0,       // ارتفاع (معمولاً پله دوم کوتاه‌تر است، مثلاً ۴۰ سانت)
    rot: 0,
    type: "wall",
    elevation: 215, // ارتفاع از کف (۱۴۵ پله اول + ۷۰ ارتفاع = ۲۱۵)
    isUpperTier: true, // ⭐ این کلید طلایی ماست برای جداسازی
    label: "پله دوم",
    underCabinetLight: { enabled: false, intensity: 1.0, color: 0xfff2e0 }
  };

  cabinets.push(newCab);
  
  // انتخاب کابینت جدید
  if (typeof selectCabinet === "function") {
      selectCabinet(id);
  } else {
      selectedId = id;
  }

  // تغییر نمای نمایش به نمای "طبقه دوم" (که در مرحله بعد می‌سازیم)
  setActiveView("wall-top");
}

function addFridgeWrap() {
  let id = cabinets.length ? Math.max(...cabinets.map(c => c.id)) + 1 : 1;
  
  let newCab = {
    id: id,
    x: 100,         // موقعیت اولیه
    y: 50,
    w: 95.0,        // عرض استاندارد (یخچال ۹۰ + دو عدد ۱۶ میل)
    d: 60.0,        // عمق استاندارد کاور
    h: 240.0,       // ارتفاع تمام شده (تا بالای کمد)
    rot: 0,
    type: "floor",  // فعلاً در لایه زمینی باشد تا راحت جابه‌جا شود
    isFridgeWrap: true, 
    elevation: 0,
    label: "کلاف یخچال"
  };

  cabinets.push(newCab);
  selectCabinet(id);
  setActiveView("floor"); // رفتن به نمای زمینی برای دیدن آن
}

// ====== توابع مربوط به لوازم خانگی ======



function addWashingMachine() {
    let id = cabinets.length ? Math.max(...cabinets.map(c => c.id)) + 1 : 1;
    let newCab = {
        id: id,
        x: 150,
        y: 150,
        w: 60.0,   // عرض استاندارد لباسشویی
        d: 60.0,   // عمق
        h: 85.0,   // ارتفاع استاندارد
        rot: 0,
        type: "floor",
        elevation: 0,
        isAppliance: true,
        label: "لباسشویی"
    };
    cabinets.push(newCab);
    if (typeof selectCabinet === "function") selectCabinet(id);
    if (typeof setActiveView === "function") setActiveView("floor");
    renderList();
    draw();
}

function addDishwasher() {
    let id = cabinets.length ? Math.max(...cabinets.map(c => c.id)) + 1 : 1;
    let newCab = {
        id: id,
        x: 200,
        y: 200,
        w: 60.0,   // عرض استاندارد ظرفشویی
        d: 60.0,   // عمق
        h: 85.0,   // ارتفاع استاندارد
        rot: 0,
        type: "floor",
        elevation: 0,
        isAppliance: true,
        label: "ظرفشویی"
    };
    cabinets.push(newCab);
    if (typeof selectCabinet === "function") selectCabinet(id);
    if (typeof setActiveView === "function") setActiveView("floor");
    renderList();
    draw();
}

function addFacadeBox() {
    let id = cabinets.length ? Math.max(...cabinets.map(c => c.id)) + 1 : 1;
    
    let newCab = {
        id: id,
        x: 150,         // موقعیت اولیه
        y: 100,
        w: 55.0,        // عرض کل باکس
        d: 55.0,        // عمق
        h: 240.0,       // ارتفاع قدی
        rot: 0,
        type: "floor",  // روی زمین قرار می‌گیرد
        elevation: 0,
        isFacadeBox: true, 
        label: "باکس نما",
        color: "#FFFFFF",     // 🔄 اصلاح شد: رنگ پیش‌فرض اصلی باکس به سفید یخچالی
        colorName: "سفید یخچالی",
        
        // 🔄 اصلاح شد: ساختار پنل‌ها کاملاً بر پایه سفید یخچالی و ساختار استاندارد شما تنظیم شد
        panels: {
            left:  { active: true,  w: 55.0, h: 240.0, t: 1.6, color: '#FFFFFF', colorName: 'سفید یخچالی', materialType: 'mdf', posLeft: true, posRight: false, thermowall: { enabled: false, count: 5, w: 3, d: 2, color: '#FFFFFF', colorName: 'سفید یخچالی', materialType: 'mdf' }, shelves: { enabled: false, list: [], materialType: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی' } },
            right: { active: true,  w: 55.0, h: 240.0, t: 1.6, color: '#FFFFFF', colorName: 'سفید یخچالی', materialType: 'mdf', posLeft: false, posRight: true, thermowall: { enabled: false, count: 5, w: 3, d: 2, color: '#FFFFFF', colorName: 'سفید یخچالی', materialType: 'mdf' }, shelves: { enabled: false, list: [], materialType: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی' } },
            front: { active: true,  w: 55.0, h: 240.0, t: 1.6, color: '#FFFFFF', colorName: 'سفید یخچالی', materialType: 'mdf', posLeft: false, posRight: true, thermowall: { enabled: false, count: 5, w: 3, d: 2, color: '#FFFFFF', colorName: 'سفید یخچالی', materialType: 'mdf' }, shelves: { enabled: false, list: [], materialType: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی' } },
            back:  { active: true,  w: 55.0, h: 240.0, t: 1.6, color: '#FFFFFF', colorName: 'سفید یخچالی', materialType: 'mdf', posLeft: true, posRight: false, thermowall: { enabled: false, count: 5, w: 3, d: 2, color: '#FFFFFF', colorName: 'سفید یخچالی', materialType: 'mdf' }, shelves: { enabled: false, list: [], materialType: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی' } }
        }
    };

    cabinets.push(newCab);
    
    if (typeof selectCabinet === "function") selectCabinet(id);
    if (typeof setActiveView === "function") setActiveView("floor");
    if (typeof renderList === "function") renderList();
    if (typeof draw === "function") draw();
    
    if (typeof init3D === "function") init3D(); 
}


function addDrawerBody() {
    // ۱. پیدا کردن ID جدید (بزرگترین ID موجود + ۱)
    let id = cabinets.length ? Math.max(...cabinets.map(c => c.id)) + 1 : 1;

    // ۲. تعریف شیء جدید برای بدنه کشو
    let newCab = {
        id: id,
        x: 180,           // موقعیت اولیه در پلان
        y: 180,
        w: 60.0,          // عرض استاندارد یونیت کشو
        d: 55.0,          // عمق استاندارد
        h: 73.6,          // ارتفاع استاندارد زمینی
        rot: 0,
        type: "floor",    // نوع زمینی
        elevation: 14,    // ارتفاع از کف (پاخور)
        
        isDrawerBody: true, // ⭐ کلید طلایی برای شناسایی در رندر سه‌بعدی
        drawerCount: 3,     // تعداد کشوهای پیش‌فرض
        label: "بدنه کشو",
        
        // تنظیمات ظاهری (اختیاری برای مراحل بعد)
        gap: 0.3,           // فاصله بین درب‌های کشو (میلی‌متر)
        drawerHeights: []   // می‌تواند برای ذخیره ارتفاع تک‌تک کشوها استفاده شود
    };

    // ۳. افزودن به لیست کابینت‌ها
    cabinets.push(newCab);

    // ۴. به‌روزرسانی رابط کاربری و انتخاب آیتم جدید
    if (typeof selectCabinet === "function") selectCabinet(id);
    if (typeof setActiveView === "function") setActiveView("floor");
    
    // ۵. بازرسم پلان و لیست
    if (typeof renderList === "function") renderList();
    if (typeof draw === "function") draw();

    // ۶. اگر موتور سه‌بعدی فعال است، آن را بروز کن
    if (typeof init3D === "function") init3D();
    
}

function addWaterproofBody() {
  let id = cabinets.length ? cabinets[cabinets.length - 1].id + 1 : 1;
  let newCab = {
    id: id,
    x: 50,
    y: 50,
    w: 90.0, // عرض پیش‌فرض سینک معمولاً ۹۰ است
    d: 55.0,
    h: 73.6,
    rot: 0,
    type: "waterproof", // نوع متمایز برای بدنه ضد آب
    elevation: 14,
  };
  cabinets.push(newCab);
  selectCabinet(id);
  setActiveView("floor");
}

function addDishRackBody() {
  let id = cabinets.length ? cabinets[cabinets.length - 1].id + 1 : 1;
  let newCab = {
    id: id,
    x: 50,
    y: 30,
    w: 90.0,
    d: 35.0,
    h: 70.0,
    rot: 0,
    type: "wall",
    isDishRack: true, // 👈 این پرچم مشخص می‌کند که آب‌چکان است
    elevation: 150,
    // یک طبقه پیش‌فرض می‌دهیم تا فیبر پشت تا این ارتفاع پایین بیاید
    shelves: [{ height: 35.0 }] 
  };
  cabinets.push(newCab);
  selectCabinet(id);
  setActiveView("wall");
}

function addHoodWrap() {
  let id = cabinets.length ? cabinets[cabinets.length - 1].id + 1 : 1;
  let newCab = {
    id: id,
    x: 50,
    y: 30,
    w: 90.0,
    d: 35.0,
    h: 70.0,
    rot: 0,
    type: "wall",
    isHoodWrap: true, // 👈 پرچم مخصوص کلاف هود
    elevation: 150,
  };
  cabinets.push(newCab);
  selectCabinet(id);
  setActiveView("wall");
}

function addHiddenHoodBody() {
    let id = cabinets.length ? cabinets[cabinets.length - 1].id + 1 : 1;
    let newCab = {
        id: id,
        x: 50,
        y: 30,
        w: 90.0,
        d: 35.0,
        h: 70.0,
        rot: 0,
        type: "wall",
        elevation: 150,
        isHiddenHood: true  // این پرچم برای شناسایی در 3D است
    };
    cabinets.push(newCab);
    selectCabinet(id);
    setActiveView("wall");
    if (typeof draw === 'function') draw(); // رفرش بوم دوبعدی
}

function addCoffeeBar() {
  let id = cabinets.length ? cabinets[cabinets.length - 1].id + 1 : 1;
  let newCab = {
    id: id,
    x: 50,
    y: 50,
    w: 90.0,
    d: 55.0,
    h: 220.0, // معمولا کافه بارها ارتفاع بلندی دارند (کمدی) یا متناسب با زمینی تنظیم کنید
    rot: 0,
    type: "floor", // یا tall بسته به ساختار شما
    elevation: 14,
    isCoffeeBar: true, // 👈 این شناسه کافه بار است
    hasDoor: true,     // 👈 این باید true باشد تا منوی تنظیمات درب برای کافه بار در پنل ظاهر شود
    showDoors: false,  // 👈 اما به صورت پیش‌فرض خاموش است تا دربی رسم نشود
    doors: 0           // 👈 تعداد پیش‌فرض درب‌ها صفر
  };
  cabinets.push(newCab);
  selectCabinet(id);
  setActiveView("floor");
}

function addBaseCabinetWithDrawer() {
    // ۱. پیدا کردن ID جدید (دقیقاً مشابه روشی که در addFridgeWrap استفاده کردید)
    let id = cabinets.length ? Math.max(...cabinets.map(c => c.id)) + 1 : 1;

    // ۲. تعریف شیء جدید با پارامترهای استاندارد پروژه شما
    let newCab = {
        id: id,
        x: 100,           // موقعیت اولیه در پلان
        y: 100,
        w: 90.0,          // عرض استاندارد
        d: 55.0,          // عمق استاندارد
        h: 73.6,          // ارتفاع استاندارد شما (طبق addFloorCabinet)
        rot: 0,
        type: "floor",    // نوع زمینی
        elevation: 14,    // ارتفاع پاخور (طبق استاندارد شما)
        
        isBaseWithDrawer: true, // ⭐ کلید اصلی برای شناسایی در رندر سه‌بعدی
        label: "زمینی (در و کشو)",
        
        doors: 2,           // تعداد درهای پایین
        drawerFrontHeight: 18.0, // ارتفاع کشوی بالا
        showDoors: true     // نمایش درها در سه‌بعدی
    };

    // ۳. افزودن به لیست کابینت‌ها
    cabinets.push(newCab);

    // ۴. به‌روزرسانی رابط کاربری (توابعی که خودتان در بقیه کدها استفاده کردید)
    if (typeof selectCabinet === "function") selectCabinet(id);
    if (typeof setActiveView === "function") setActiveView("floor");
    
    // ۵. بازرسم پلان و لیست (رعایت ترتیب توابع پروژه شما)
    if (typeof renderList === "function") renderList();
    if (typeof draw === "function") draw();

    // ۶. بروزرسانی موتور سه‌بعدی (همان توابعی که در addFacadeBox استفاده کردید)
    if (typeof init3D === "function") init3D();
    

}

function addOvenCabinet() {
    let id = cabinets.length ? Math.max(...cabinets.map(c => c.id)) + 1 : 1;
    let newCab = {
        id: id,
        x: 120,
        y: 120,
        w: 60.0,   // عرض استاندارد یونیت فر کمدی یا زمینی
        d: 55.0,   // عمق استاندارد
        h: 220.0,  // اگر فر کمدی قدی است ۲۲۰، اگر زمینی زیر صفحه‌ای است روی ۷۳.۶ تنظیم کن
        rot: 0,
        type: "floor",
        elevation: 14, // ارتفاع پاخور
        isOvenCabinet: true, // کلید طلایی برای شناسایی در سه بعدی و منطق کد
        label: "یونیت فر"
    };
    cabinets.push(newCab);
    
    if (typeof selectCabinet === "function") selectCabinet(id);
    if (typeof setActiveView === "function") setActiveView("floor");
    if (typeof renderList === "function") renderList();
    if (typeof draw === "function") draw();
    if (typeof init3D === "function") init3D();
}

