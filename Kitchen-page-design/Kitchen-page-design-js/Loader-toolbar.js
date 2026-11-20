// تابع لود کردن نوار ابزار (Toolbar)
async function loadToolbar() {
    try {
        const response = await fetch('toolbar/toolbar.html'); 
        
        if (!response.ok) throw new Error('خطا در لود فایل toolbar.html');
        
        const html = await response.text();
        document.getElementById('toolbar-container').innerHTML = html;
        
        // 🟢 این خط جدید است: بعد از اینکه HTML لود شد، رویدادها را فعال کن
        initToolbarEvents();
        
    } catch (error) {
        console.error('Error loading Toolbar:', error);
    }
}

loadToolbar();
