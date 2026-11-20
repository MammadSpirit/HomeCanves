// تابع لود کردن دکمه‌های نمای سه‌بعدی و دوبعدی
async function loadDisplayControls() {
    try {
        // آدرس فایل را بر اساس پوشه‌بندی خودتان تنظیم کنید
        const response = await fetch('Merg-view/display-mode-controls.html');
        if (!response.ok) throw new Error('خطا در لود فایل display-controls.html');
        const html = await response.text();
        document.getElementById('display-controls-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Display Controls Panel:', error);
    }
}

loadDisplayControls();