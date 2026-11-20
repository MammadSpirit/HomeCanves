// Kitchen-page-design-js/loader-Elevview.js

// متغیر سراسری برای اطمینان از اینکه فایل فقط یکبار لود شود
let isElevViewLoaded = false;

async function loadElevView() {
    if (isElevViewLoaded) return; // اگر قبلاً لود شده، دوباره لود نکن

    try {
        const response = await fetch('Elev-view/Elev-view.html'); 
        if (!response.ok) throw new Error('خطا در لود فایل Elev-view.html');
        
        const html = await response.text();
        const container = document.getElementById('elev-view-container');
        if (container) {
            container.innerHTML = html;
            isElevViewLoaded = true;
            console.log("نمای دو بعدی روبرو (Elev-view) با موفقیت لود شد.");
            
            // 🟢 تغییر جدید اینجاست: مقداردهی اولیه بوم روبرو به محض لود شدن کامل HTML
            if (typeof initElevCanvas === 'function') {
                initElevCanvas();
            }
        }
    } catch (error) {
        console.error('Error loading Elev View:', error);
    }
}

// لود اولیه موقع اجرای صفحه
document.addEventListener('DOMContentLoaded', () => {
    loadElevView();
});
