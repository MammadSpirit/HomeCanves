// داخل فایل جدید لودینگ
window.addEventListener('load', function() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        // یک تاخیر کوتاه برای اطمینان از اجرای کدهای design.js
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 300);
    }
});
