/**
 * view-manager.js
 * مدیریت حالت‌های نمایش (زمینی، دیواری، ادغام شده، ادغام صفحه) و آپدیت آیکون‌ها
 */

// تغییر نمای فعال
function setActiveView(view) {
    const mergeCheckbox = document.getElementById("merge-view");

    if (view === "merged") {
        activeView = "merged";
        if (mergeCheckbox) mergeCheckbox.checked = true;
    } else {
        activeView = view;
        if (mergeCheckbox) mergeCheckbox.checked = false;
    }

    // ⭐ اصلاح این بخش برای جلوگیری از پرش انتخاب ⭐
    if (selectedId !== -1 && activeView !== "merged") {
        const c = cabinets.find((x) => x.id === selectedId);
        if (c) {
            let isVisibleInCurrentView = false;
            if (activeView === "floor" && c.type === "floor") isVisibleInCurrentView = true;
            
            // اضافه شدن حالت جدید: در این حالت هم کابینت‌های زمینی قابل انتخاب هستند
            if (activeView === "worktop-merged" && c.type === "floor") isVisibleInCurrentView = true;

            if (activeView === "wall" && c.type === "wall" && !c.isUpperTier) isVisibleInCurrentView = true;
            if (activeView === "wall-top" && c.isUpperTier) isVisibleInCurrentView = true;

            if (!isVisibleInCurrentView) {
                selectedId = -1;
                const doorBtn = document.getElementById("door-editor-btn");
                if (doorBtn) doorBtn.disabled = true;
            }
        }
    }

    updateDisplayButtons();
    if (typeof draw === "function") draw();
}


// عملکرد دکمه "ادغام صفحه و زمینی" (Toggle)
function toggleWorktopMergedView() {
    if (activeView === "worktop-merged") {
        setActiveView("floor"); // بازگشت به نمای زمینی
    } else {
        setActiveView("worktop-merged"); // نمایش زمینی + صفحه روی هم
    }
}


// عملکرد دکمه "ادغام شده" کل آشپزخانه (Toggle)
function toggleMergedView() {
    if (activeView === "merged") {
        setActiveView("floor"); // بازگشت به نمای زمینی
    } else {
        setActiveView("merged"); // نمایش همه لایه‌ها روی هم
    }
}


// آپدیت کلاس Active روی دکمه‌های HTML برای تغییر استایل (CSS)
function updateDisplayButtons() {
    const floorBtn = document.getElementById("btn-floor");
    const wallBtn = document.getElementById("btn-wall");
    const wallTopBtn = document.getElementById("btn-wall-top");
    const worktopMergedBtn = document.getElementById("btn-worktop-merged"); // دکمه جدید
    const mergedBtn = document.getElementById("btn-merged");

    // چک کردن وجود دکمه‌ها برای جلوگیری از خطا
    if (!floorBtn || !wallBtn || !mergedBtn || !wallTopBtn || !worktopMergedBtn) return;

    // حذف کلاس active از همه دکمه‌ها
    floorBtn.classList.remove("active");
    wallBtn.classList.remove("active");
    wallTopBtn.classList.remove("active");
    worktopMergedBtn.classList.remove("active");
    mergedBtn.classList.remove("active");

    // افزودن کلاس active بر اساس نمای فعلی
    if (activeView === "floor") {
        floorBtn.classList.add("active");
    } else if (activeView === "worktop-merged") {
        // در حالت ادغام صفحه، هم دکمه خودش و هم دکمه زمینی روشن می‌شود
        worktopMergedBtn.classList.add("active");
        floorBtn.classList.add("active"); 
    } else if (activeView === "wall") {
        wallBtn.classList.add("active");
    } else if (activeView === "wall-top") {
        wallTopBtn.classList.add("active");
    } else if (activeView === "merged") {
        // در حالت ادغام کل، همه دکمه‌ها روشن می‌شوند
        mergedBtn.classList.add("active");
        worktopMergedBtn.classList.add("active");
        floorBtn.classList.add("active");
        wallBtn.classList.add("active");
        wallTopBtn.classList.add("active");
    }
}


// اجرای اولیه هنگام لود شدن صفحه
document.addEventListener("DOMContentLoaded", () => {
    updateDisplayButtons();
});
