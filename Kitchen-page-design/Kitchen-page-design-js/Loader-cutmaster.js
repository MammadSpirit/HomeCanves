// تابع لود کردن سایدبار لیست برش (CutMaster)
async function loadCutListSidebar() {
    try {
        const response = await fetch('Cutmaster-panel/cut-list-sidebar.html'); // آدرس فایل را در صورت نیاز تنظیم کنید
        if (!response.ok) throw new Error('خطا در لود فایل cut-list-sidebar.html');
        const html = await response.text();
        document.getElementById('cut-list-sidebar-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading Cut List Sidebar:', error);
    }
}

loadCutListSidebar();