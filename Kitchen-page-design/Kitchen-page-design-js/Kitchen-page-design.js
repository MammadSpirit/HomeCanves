// تابع باز و بسته کردن منوی اصلی (سایدبار)
function toggleMainSidebar() {
    const sidebar = document.getElementById('sidebar-container');
    const toggleText = document.querySelector('.menu-toggle-text');
    
    // اضافه یا حذف کلاس collapsed
    sidebar.classList.toggle('collapsed');
    
    // تغییر متن سربرگ
    if (sidebar.classList.contains('collapsed')) {
        toggleText.textContent = "باز کردن منو";
    } else {
        toggleText.textContent = "بستن منو";
    }
    
    // 🌟 مهم: آپدیت کردن سایز Canvas 🌟
    // وقتی منو باز و بسته می‌شود، باید به Three.js بگوییم سایز صفحه تغییر کرده است
    setTimeout(() => {
        if (typeof window.onWindowResize === 'function') {
            window.onWindowResize(); // تابع تغییر سایز (اگر در پروژه شما نام دیگری دارد آن را بنویسید)
        }
    }, 350); // کمی تاخیر تا انیمیشن CSS تمام شود
}
