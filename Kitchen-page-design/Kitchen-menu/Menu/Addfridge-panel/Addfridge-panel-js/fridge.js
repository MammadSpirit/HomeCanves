// چاپ پیام برای اطمینان از لود شدن فایل در مرورگر

// باز کردن پنل تنظیمات یخچال (مقادیر پیش‌فرض)
// اضافه کردن کلمه event به عنوان ورودی تابع
window.openFridgePanel = function(event) {
    document.getElementById("fridge-input-width").value = 90;
    document.getElementById("fridge-input-height").value = 180;
    document.getElementById("fridge-door-count").value = 1;

    const panel = document.getElementById("add-fridge-panel");
    if (panel) {
        
        // 🌟 سیستم مکان‌یابی هوشمند پنل 🌟
        if (event) {
            // پیدا کردن دکمه‌ای که کلیک شده
            const clickedBtn = event.currentTarget || event.target;
            // گرفتن مختصات دکمه
            const rect = clickedBtn.getBoundingClientRect();
            
            // قرار دادن پنل هم‌تراز با بالای دکمه
            let panelTop = rect.top;
            
            // جلوگیری از بیرون زدن پنل از پایین مانیتور (ارتفاع حدودی پنل 450 در نظر گرفته شده)
            const windowHeight = window.innerHeight;
            const estimatedPanelHeight = 450; 
            
            if (panelTop + estimatedPanelHeight > windowHeight) {
                // اگر جا نمیشد، پنل را بالاتر ببر تا کامل دیده شود (20 پیکسل فاصله از پایین)
                panelTop = windowHeight - estimatedPanelHeight - 20; 
            }
            
            // جلوگیری از بیرون زدن از بالای صفحه
            if (panelTop < 20) panelTop = 20;
            
            // اعمال موقعیت نهایی
            panel.style.top = panelTop + "px";
        } else {
            // اگر به هر دلیلی event پاس داده نشد (موقعیت پیش‌فرض)
            panel.style.top = "100px";
        }

        panel.classList.add("active");
        window.updateFridgePreview();
    }
};

// باز کردن پنل تنظیمات (برای ویرایش یخچال موجود روی نقشه)
window.openEditFridgePanel = function(event) {
    if (typeof selectedId === 'undefined' || selectedId === -1) return;
    
    const c = cabinets.find(x => x.id === selectedId);
    if (!c) return;

    document.getElementById("fridge-input-width").value = c.w;
    document.getElementById("fridge-input-height").value = c.h;
    document.getElementById("fridge-door-count").value = c.doors || 1;

    const panel = document.getElementById("add-fridge-panel");
    if (panel) {
        // چون ویرایش معمولاً با کلیک روی خود یخچال در نقشه (Canvas) انجام می‌شود،
        // بهتر است پنل ویرایش در یک جای ثابت و مناسب (مثلاً وسط یا بالای صفحه) باز شود
        if (event) {
            const rect = (event.currentTarget || event.target).getBoundingClientRect();
            let panelTop = rect.top;
            
            // بررسی بیرون زدگی
            if (panelTop + 450 > window.innerHeight) {
                panelTop = window.innerHeight - 470;
            }
            if (panelTop < 20) panelTop = 20;
            
            panel.style.top = panelTop + "px";
        } else {
             // موقعیت ثابت برای زمان‌هایی که روی نقشه کلیک می‌شود
             panel.style.top = "15vh";
        }

        panel.classList.add("active");
        window.updateFridgePreview();
    }
};


// بستن پنل تنظیمات یخچال
window.closeFridgePanel = function() {
    const panel = document.getElementById("add-fridge-panel");
    if (panel) {
        panel.classList.remove("active");
    }
};

// بروزرسانی پیش‌نمایش در بوم
window.updateFridgePreview = function() {
    const canvas = document.getElementById("fridge-preview-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const doorCount = parseInt(document.getElementById("fridge-door-count").value);
    const w = parseFloat(document.getElementById("fridge-input-width").value) || 90;
    const h = parseFloat(document.getElementById("fridge-input-height").value) || 180;

    const scaleX = 200 / 150; 
    const scaleY = 240 / 250; 
    
    const drawWidth = w * scaleX;
    const drawHeight = h * scaleY;
    
    const startX = (canvas.width - drawWidth) / 2;
    const startY = (canvas.height - drawHeight) / 2 + 10;

    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.roundRect(startX, startY, drawWidth, drawHeight, 8);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#f1f5f9";
    if (doorCount === 1) {
        ctx.fillRect(startX + 5, startY + 5, drawWidth - 10, drawHeight * 0.3);
        ctx.strokeRect(startX + 5, startY + 5, drawWidth - 10, drawHeight * 0.3);
        
        ctx.fillRect(startX + 5, startY + 5 + (drawHeight * 0.3) + 5, drawWidth - 10, (drawHeight * 0.7) - 15);
        ctx.strokeRect(startX + 5, startY + 5 + (drawHeight * 0.3) + 5, drawWidth - 10, (drawHeight * 0.7) - 15);
        
        ctx.fillStyle = "#334155";
        ctx.fillRect(startX + drawWidth - 20, startY + (drawHeight * 0.3) - 30, 5, 40); 
        ctx.fillRect(startX + drawWidth - 20, startY + (drawHeight * 0.3) + 20, 5, 60); 
        
    } else {
        const halfWidth = (drawWidth - 15) / 2;
        
        ctx.fillRect(startX + 5, startY + 5, halfWidth, drawHeight - 10);
        ctx.strokeRect(startX + 5, startY + 5, halfWidth, drawHeight - 10);
        
        ctx.fillRect(startX + 10 + halfWidth, startY + 5, halfWidth, drawHeight - 10);
        ctx.strokeRect(startX + 10 + halfWidth, startY + 5, halfWidth, drawHeight - 10);

        ctx.fillStyle = "#334155";
        ctx.fillRect(startX + 5 + halfWidth - 12, startY + (drawHeight / 2) - 40, 6, 80); 
        ctx.fillRect(startX + 10 + halfWidth + 6, startY + (drawHeight / 2) - 40, 6, 80); 
    }
};

// تابع اصلی برای اضافه کردن یخچال جدید
window.applyAndAddFridge = function() {
    const w = parseFloat(document.getElementById("fridge-input-width").value) || 90.0;
    const h = parseFloat(document.getElementById("fridge-input-height").value) || 180.0;
    const doorCount = parseInt(document.getElementById("fridge-door-count").value);

    let id = cabinets.length ? Math.max(...cabinets.map(c => c.id)) + 1 : 1;
    
    let newCab = {
        id: id,
        x: 100,
        y: 100,
        w: w,             
        d: 70.0,          
        h: h,             
        doors: doorCount, 
        rot: 0,
        type: "floor",
        elevation: 0,
        isAppliance: true,
        label: doorCount === 2 ? "یخچال ساید" : "یخچال"
    };

    cabinets.push(newCab);
    
    if (typeof selectCabinet === "function") selectCabinet(id);
    if (typeof setActiveView === "function") setActiveView("floor");
    
    if (typeof renderList === "function") renderList();
    if (typeof draw === "function") draw();

    window.closeFridgePanel();
};

// تابع ویرایش یخچال موجود
window.saveFridgeEdit = function() {
    if (typeof selectedId === 'undefined' || selectedId === -1) {
        alert("لطفاً ابتدا یک یخچال را روی نقشه انتخاب کنید تا بتوانید آن را ویرایش کنید.");
        return;
    }
    
    const c = cabinets.find(x => x.id === selectedId);
    if (c) {
        c.w = parseFloat(document.getElementById("fridge-input-width").value) || 90.0;
        c.h = parseFloat(document.getElementById("fridge-input-height").value) || 180.0;
        c.doors = parseInt(document.getElementById("fridge-door-count").value);
        c.label = c.doors === 2 ? "یخچال ساید" : "یخچال";
        
        // رفرش کردن صفحه برای اعمال تغییرات
        if (typeof renderList === "function") renderList();
        if (typeof draw === "function") draw();
    }
    
    window.closeFridgePanel();
};

// تابع حذف یخچال انتخاب شده
window.deleteExistingFridge = function() {
    if (typeof selectedId === 'undefined' || selectedId === -1) {
        alert("لطفاً ابتدا یک یخچال را روی نقشه انتخاب کنید تا بتوانید آن را حذف کنید.");
        return;
    }
    
    if (confirm("آیا از حذف این یخچال اطمینان دارید؟")) {
        // حذف از آرایه
        cabinets = cabinets.filter(x => x.id !== selectedId);
        selectedId = -1; // خروج از حالت انتخاب
        
        // رفرش کردن صفحه
        if (typeof renderList === "function") renderList();
        if (typeof draw === "function") draw();
        
        window.closeFridgePanel();
    }
};
