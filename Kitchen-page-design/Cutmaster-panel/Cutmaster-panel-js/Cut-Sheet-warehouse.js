// ==========================================
// cut-sheet-warehouse.js - مدیریت انبار ورق‌ها (اصلاح شده)
// ==========================================

// تابع افزودن ردیف ورق جدید به آکاردئون مربوطه
function addNewSheetRow(type) {
    const container = document.getElementById(`sheets-list-container-${type}`);
    if (!container) return;

    let defaultW = "244", defaultH = "122";
    let defaultMat = "mdf";
    let defaultMatName = "سفید یخچالی";
    let defaultColor = "#FFFFFF";
    let selectOptionsHtml = ""; // برای فیلتر کردن داینامیک جنس‌ها بر اساس نوع آکاردئون

    if (type === 'sheet') { 
        defaultW = "366"; defaultH = "183"; defaultMat = "mdf"; defaultMatName = "سفید یخچالی"; defaultColor = "#FFFFFF";
        selectOptionsHtml = `
            <option value="mdf" selected>ام‌دی‌اف (MDF)</option>
            <option value="leteron">لترون</option>
            <option value="highGloss">هایگلاس</option>
        `;
} else if (type === 'backsplash') { // 👈 تبدیل به بین کابینتی
        defaultW = "280"; defaultH = "122"; // ابعاد پیش‌فرض ماربل شیت
        defaultMat = "backsplash"; defaultMatName = "طرح سنگ مرمر"; defaultColor = "#f8fafc";
        selectOptionsHtml = `
            <option value="backsplash" selected>بین کابینتی (ماربل شیت)</option>
            <option value="highGloss">هایگلاس</option>
            <option value="mdf">ام‌دی‌اف (MDF)</option>
        `;
    } else if (type === 'countertop') { // 🌟 اضافه شدن منطق ردیف جدید صفحه کابینت
        defaultW = "410"; defaultH = "60"; defaultMat = "countertop"; defaultMatName = "سفید مات"; defaultColor = "#FFFFFF";
        selectOptionsHtml = `
            <option value="countertop" selected>صفحه کابینت (۳سم/۵سم)</option>
            <option value="mdf">ام‌دی‌اف (MDF)</option>
        `;
    } else if (type === 'fiber') { 
        defaultW = "244"; defaultH = "183"; 
        defaultMat = "Fibr"; 
        defaultMatName = "سفید پرینتی"; 
        defaultColor = "#FFFFFF";       
        selectOptionsHtml = `<option value="Fibr" selected>سه میل پرینتی</option>`;
    } else if (type === 'pvc') {
        defaultMat = "PVC"; 
        defaultMatName = "پی وی سی سفید"; defaultColor = "#e2e8f0";
        selectOptionsHtml = `<option value="PVC" selected>پی‌وی‌سی (PVC)</option>`;
    }

    const newRow = document.createElement('div');
    newRow.className = 'sheet-item-row';
    newRow.innerHTML = `
        <div class="input-field-group width-90">
            <label>طول (cm)</label>
            <input type="number" class="sheet-w" value="${defaultW}" min="1">
        </div>
        <div class="input-field-group width-90">
            <label>عرض (cm)</label>
            <input type="number" class="sheet-h" value="${defaultH}" min="1">
        </div>
        <div class="input-field-group width-70">
            <label>تعداد</label>
            <input type="number" class="sheet-qty" value="5" min="1">
        </div>
        
        <div class="input-field-group width-120">
            <label>جنس ورق</label>
            <select class="sheet-material-type" onchange="handleMaterialTypeChange(this)">
                ${selectOptionsHtml}
            </select>
        </div>

        <div class="input-field-group width-120">
            <label>طرح و رنگ</label>
            <div class="sheet-color-trigger" onclick="openSheetColorPicker(this)">
                <span class="sheet-color-preview" style="background-color: ${defaultColor};"></span>
                <span class="sheet-color-text">${defaultMatName}</span>
            </div>
        </div>

        <div class="input-field-group checkbox-field">
            <label class="unlimited-label">
                <input type="checkbox" class="sheet-unlimited" onchange="handleQtyDisable(this)">
                <span>♾️ نامحدود</span>
            </label>
        </div>
        <div class="row-delete-action">
            <button type="button" class="btn-delete-row" onclick="removeSheetRow(this)">🗑️</button>
        </div>
    `;

    container.appendChild(newRow);
}

/**
 * مدیریت کلیک روی دکمه طرح و رنگ هر ردیف و باز کردن مودال عمومی سیستم
 */
function openSheetColorPicker(triggerElement) {
    const row = triggerElement.closest('.sheet-item-row');
    if (!row) return;

    const matSelect = row.querySelector('.sheet-material-type');
    const currentCategory = matSelect ? matSelect.value : 'mdf';

    window.openUniversalModal("انتخاب متریال و رنگ ورق", currentCategory, function(selectedItem) {
        if (selectedItem) {
            const previewCircle = triggerElement.querySelector('.sheet-color-preview');
            const textLabel = triggerElement.querySelector('.sheet-color-text');

            if (textLabel) textLabel.innerText = selectedItem.name;
            if (previewCircle) {
                if (selectedItem.texture) {
                    previewCircle.style.backgroundImage = `url('${selectedItem.texture}')`;
                    previewCircle.style.backgroundSize = 'cover';
                    previewCircle.style.backgroundColor = 'transparent';
                } else {
                    previewCircle.style.backgroundImage = 'none';
                    previewCircle.style.backgroundColor = selectedItem.code || '#ffffff';
                }
            }
            
            row.dataset.selectedColorCode = selectedItem.code || '';
            row.dataset.selectedColorName = selectedItem.name || '';
            row.dataset.selectedTextureUrl = selectedItem.texture || '';
        }
    });
}

function handleMaterialTypeChange(selectElement) {
    const row = selectElement.closest('.sheet-item-row');
    if (!row) return;

    const trigger = row.querySelector('.sheet-color-trigger');
    if (trigger) {
        const previewCircle = trigger.querySelector('.sheet-color-preview');
        const textLabel = trigger.querySelector('.sheet-color-text');
        
        if (textLabel) textLabel.innerText = "انتخاب رنگ...";
        if (previewCircle) {
            previewCircle.style.backgroundImage = 'none';
            previewCircle.style.backgroundColor = '#AAAAAA';
        }
    }
}

function removeSheetRow(button) {
    const row = button.closest('.sheet-item-row');
    if (row) row.remove();
}

function handleQtyDisable(checkbox) {
    const row = checkbox.closest('.sheet-item-row');
    if (row) {
        const qtyInput = row.querySelector('.sheet-qty');
        if (qtyInput) {
            if (checkbox.checked) {
                qtyInput.disabled = true;
                qtyInput.style.opacity = "0.25";
            } else {
                qtyInput.disabled = false;
                qtyInput.style.opacity = "1";
            }
        }
    }
}

function toggleAccordion(headerElement) {
    const item = headerElement.closest('.accordion-item');
    if (item) item.classList.toggle('open');
}

function updateAccordionMetaBadges() {
    const types = ['sheet', 'backsplash', 'fiber', 'pvc', 'countertop']; // 🌟 اضافه شدن countertop به آرایه بروزرسانی بج‌ها
    types.forEach(type => {
        const container = document.getElementById(`sheets-list-container-${type}`);
        const metaEl = document.getElementById(`meta-${type}-info`);
        if (container && metaEl) {
            const firstRow = container.querySelector('.sheet-item-row');
            if (firstRow) {
                const w = firstRow.querySelector('.sheet-w')?.value || "0";
                const h = firstRow.querySelector('.sheet-h')?.value || "0";
                metaEl.innerText = `${w}×${h}`;
            }
        }
    });
}
