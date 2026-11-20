// materialModal.js

// تعریف یک وضعیت (State) برای ردیابی مودال فعلی
let currentModalContext = {
    targetId: null,      // شناسه بخش بازکننده (مثلاً 'door', 'shelf', 'countertop')
    category: null,      // دسته‌بندی متریال (مثلاً 'mdf', 'countertop', 'backsplash')
    onSelectCallback: null // تابعی که بعد از انتخاب رنگ باید اجرا شود
};

/**
 * تابع اصلی برای باز کردن مودال هوشمند
 */
function openUniversalModal(title, category, callback) {
    // 1. ذخیره وضعیت فعلی
    currentModalContext.category = category;
    currentModalContext.onSelectCallback = callback;

    // 2. به‌روزرسانی عنوان مودال
    const modalTitleEl = document.getElementById('universal-modal-title');
    if (modalTitleEl) modalTitleEl.innerText = title;

    // 3. خالی کردن فیلد سرچ قبلی
    const searchInput = document.getElementById('universal-search-input');
    if (searchInput) searchInput.value = '';

    // 4. رندر کردن آیتم‌ها (بدون فیلتر اولیه)
    renderUniversalGrid();
    
    // 5. نمایش مودال
    const modal = document.getElementById('universal-material-modal');
    if (modal) {
        modal.classList.add('uni-active');
    }
}

/**
 * تابع بستن مودال
 */
function closeUniversalModal() {
    const modal = document.getElementById('universal-material-modal');
    if (modal) {
        modal.classList.remove('uni-active');
    }
    
    // پاکسازی وضعیت را با کمی تاخیر انجام می‌دهیم تا کال‌بک‌های همزمان دچار اختلال نشوند
    setTimeout(() => {
        currentModalContext = { targetId: null, category: null, onSelectCallback: null };
    }, 100);
}

/**
 * تابع رندر کردن آیتم‌ها در گرید بر اساس دسته‌بندی و متن جستجو
 */
function renderUniversalGrid(searchTerm = '') {
    const grid = document.getElementById('universal-grid');
    if (!grid) return;

    grid.innerHTML = ''; // خالی کردن گرید

    const category = currentModalContext.category;
    const materials = window.allMaterials && window.allMaterials[category] ? window.allMaterials[category] : [];

    if (materials.length === 0) {
        grid.innerHTML = '<div class="no-data" style="color: #64748b; text-align: center; width: 100%; grid-column: 1/-1; padding: 20px;">موردی یافت نشد.</div>';
        return;
    }

    const filteredMaterials = materials.filter(item => {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    if (filteredMaterials.length === 0) {
        grid.innerHTML = '<div class="no-data" style="color: #64748b; text-align: center; width: 100%; grid-column: 1/-1; padding: 20px;">نتیجه‌ای برای جستجوی شما یافت نشد.</div>';
        return;
    }

    filteredMaterials.forEach(item => {
        const card = document.createElement('div');
        card.className = 'uni-color-item';
        
        let previewStyle = '';
        if (item.texture) {
            previewStyle = `background-image: url('${item.texture}');`;
        } else if (item.code) {
            previewStyle = `background-color: ${item.code};`;
        }

        card.innerHTML = `
            <div class="uni-color-swatch" style="${previewStyle}"></div>
            <div class="uni-color-name">${item.name}</div>
        `;

        card.onclick = function() {
            selectMaterial(item);
        };

        grid.appendChild(card);
    });
}

/**
 * تابع فیلتر/سرچ متریال‌ها
 */
function filterUniversalModal() {
    const searchInput = document.getElementById('universal-search-input');
    const value = searchInput ? searchInput.value : '';
    renderUniversalGrid(value);
}

/**
 * انیمیشن انتخاب نهایی متریال و فرستادن دیتا به پنل مربوطه
 */
function selectMaterial(item) {
    // ۱. ابتدا اجرای تابع کال‌بک متصل شده تا دیتا کاملاً منتقل شود
    if (currentModalContext && typeof currentModalContext.onSelectCallback === 'function') {
        currentModalContext.onSelectCallback(item);
    }
    
    // ۲. در نهایت بستن مودال و پاکسازی با کانتکست امن
    closeUniversalModal();
}

// دسترسی سراسری
window.openUniversalModal = openUniversalModal;
window.closeUniversalModal = closeUniversalModal;
window.filterUniversalModal = filterUniversalModal;
