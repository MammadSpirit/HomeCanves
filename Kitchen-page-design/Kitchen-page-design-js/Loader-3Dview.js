// تابع لود کردن مودال نمای سه بعدی
async function loadModal3D() {
    try {
        // اگر فایل را در پوشه دیگری گذاشتید، آدرس اینجا را اصلاح کنید
        const response = await fetch('3D-view/modal-3d.html'); 
        if (!response.ok) throw new Error('خطا در لود فایل modal-3d.html');
        const html = await response.text();
        document.getElementById('modal-3d-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading 3D Modal:', error);
    }
}

loadModal3D();