// آرایه سراسری ذخیره قطعات دستی
let globalManualPieces = [];
// 🟢 آبجکت برای ذخیره تغییرات داینامیک چرخش قطعات هوشمند ربات (براساس کلید برچسب منحصر بفرد)
let autoPiecesRotationOverrides = {};

function openManualListModal() {
    const modal = document.getElementById('manual-pieces-modal');
    if (modal) {
        modal.style.display = 'block';
        renderManualPiecesTable();
    } else {
        alert("خطا: ساختار گرافیکی مودال دستی در صفحه یافت نشد!");
    }
}

function closeManualListModal() {
    const modal = document.getElementById('manual-pieces-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openManualColorPicker() {
    const matSelect = document.getElementById('manual-material-type');
    if (!matSelect) return;
    
    const category = matSelect.value;
    const title = "انتخاب طرح و رنگ قطعه دستی (" + matSelect.options[matSelect.selectedIndex].text + ")";

    if (typeof window.openUniversalModal === "function") {
        window.openUniversalModal(title, category, function(selectedItem) {
            const colorPreview = document.getElementById('manual-color-preview');
            
            if (colorPreview) {
                colorPreview.title = selectedItem.name;
                
                if (selectedItem.texture) {
                    colorPreview.style.backgroundColor = 'transparent';
                    colorPreview.style.backgroundImage = `url('${selectedItem.texture}')`;
                } else if (selectedItem.code) {
                    colorPreview.style.backgroundImage = 'none';
                    colorPreview.style.backgroundColor = selectedItem.code;
                }
                
                colorPreview.dataset.hex = selectedItem.code || '#FFFFFF';
                colorPreview.dataset.texture = selectedItem.texture || '';
                colorPreview.dataset.name = selectedItem.name;
            }
        });
    } else {
        alert("خطا: سیستم مدیریت مودال رنگ پیدا نشد.");
    }
}

function handleManualTypeChange(selectElement) {
    const type = selectElement.value;
    const matSelect = document.getElementById('manual-material-type');
    const colorPreview = document.getElementById('manual-color-preview');

    if (!matSelect || !colorPreview) return;

    colorPreview.style.backgroundImage = 'none';
    if(colorPreview.dataset.texture) delete colorPreview.dataset.texture;

    if (type === 'sheet') { // 🟢 اصلاح شد
        matSelect.value = 'mdf';
        colorPreview.style.backgroundColor = '#FFFFFF';
        colorPreview.dataset.hex = '#FFFFFF';
        colorPreview.dataset.name = 'سفید یخچالی';
        colorPreview.title = 'سفید یخچالی';
} else if (type === 'backsplash') { // 👈 تبدیل به بین کابینتی
        matSelect.value = 'backsplash';
        colorPreview.style.backgroundColor = '#f8fafc';
        colorPreview.dataset.hex = '#f8fafc';
        colorPreview.dataset.name = 'طرح سنگ مرمر'; // 👈 تغییر طرح پیش‌فرض
        colorPreview.title = 'طرح سنگ مرمر';
    } else if (type === 'fiber') {
        matSelect.value = 'Fibr';
        colorPreview.style.backgroundColor = '#FFFFFF'; 
        colorPreview.dataset.hex = '#FFFFFF';
        colorPreview.dataset.name = 'سفید پرینتی'; 
        colorPreview.title = 'سفید پرینتی';
    } else if (type === 'pvc') {
        matSelect.value = 'PVC'; 
        colorPreview.style.backgroundColor = '#e2e8f0';
        colorPreview.dataset.hex = '#e2e8f0';
        colorPreview.dataset.name = 'پی وی سی سفید';
        colorPreview.title = 'پی وی سی سفید';
    } else if (type === 'countertop') { 
        matSelect.value = 'countertop'; 
        colorPreview.style.backgroundColor = '#FFFFFF';
        colorPreview.dataset.hex = '#FFFFFF';
        colorPreview.dataset.name = 'سفید مات';
        colorPreview.title = 'سفید مات';
    }
}


function addManualPieceRow() {
    const typeSelect = document.getElementById('manual-type');
    const type = typeSelect.value;
    const typeText = typeSelect.options[typeSelect.selectedIndex].text;

    const wInput = document.getElementById('manual-w');
    const hInput = document.getElementById('manual-h');
    const countInput = document.getElementById('manual-count');
    
    const matSelect = document.getElementById('manual-material-type');
    const colorPreview = document.getElementById('manual-color-preview');
    const rotationSelect = document.getElementById('manual-rotation'); 

    const w = parseFloat(wInput.value) || 0;
    const h = parseFloat(hInput.value) || 0;
    const count = parseInt(countInput.value) || 1;
    const material = matSelect.value;
    const materialText = matSelect.options[matSelect.selectedIndex].text;
    const rotation = rotationSelect ? rotationSelect.value : 'none'; 
    
    const colorName = colorPreview.dataset.name || colorPreview.title || 'سفید یخچالی';
    const colorHex = colorPreview.dataset.hex || '#FFFFFF';
    const colorTexture = colorPreview.dataset.texture || '';

    if (w <= 0 || h <= 0 || count <= 0) {
        alert("لطفاً ابعاد و تعداد معتبری وارد کنید.");
        return;
    }

    const serviceWInput = document.getElementById('manual-service-w');
    const serviceHInput = document.getElementById('manual-service-h');
    const serviceW = serviceWInput ? serviceWInput.value : '-';
    const serviceH = serviceHInput ? serviceHInput.value : '-';

    globalManualPieces.push({ 
        type, 
        w, 
        h, 
        count, 
        material, 
        materialText, 
        colorName, 
        colorHex, 
        colorTexture,
        serviceW, 
        serviceH,
        rotation, 
        label: typeText + " (سفارشی)",
        isAuto: false
    });
    
    wInput.value = '100';
    hInput.value = '60';
    countInput.value = '1';
    if(serviceWInput) serviceWInput.value = '-';
    if(serviceHInput) serviceHInput.value = '-';
    if(rotationSelect) rotationSelect.value = 'none'; 

    renderManualPiecesTable();
}

function changePieceRotationLive(isAuto, indexOrLabel, selectElement) {
    const val = selectElement.value;
    if (isAuto) {
        autoPiecesRotationOverrides[indexOrLabel] = val;
    } else {
        const idx = parseInt(indexOrLabel);
        if (globalManualPieces[idx]) {
            globalManualPieces[idx].rotation = val;
        }
    }
}

function renderManualPiecesTable() {
    const tbody = document.getElementById('manual-pieces-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    // 🟢 اصلاح شد
    const typeLabels = { sheet: 'ورقها', backsplash: 'بین کابینتی', fiber: 'سه میل', pvc: 'PVC ضد آب', countertop: 'صفحه کابینت' };

    let allPiecesToRender = [];

    if (typeof collectPieces === "function") {
        if (typeof cabinets !== 'undefined' && Array.isArray(cabinets)) {
            cabinets.forEach(c => {
                if (!c.isAppliance && !c.isFacadeBox) {
                    if (!c.doorMaterial) c.doorMaterial = c.isDrawerBody ? "highGloss" : "mdf";
                    if (!c.doorColor) c.doorColor = c.isDrawerBody ? "#f8fafc" : "#ffffff";
                }
            });
        }

        const fullAutoOutput = collectPieces(); 
        
        // 🟢 اصلاح شد
        ['sheet', 'backsplash', 'fiber', 'pvc', 'countertop'].forEach(type => { // 👈 تغییر door به backsplash در لوپ
        if(fullAutoOutput[type]) {
            fullAutoOutput[type].forEach(p => {
                if (p.isAuto === false) return; 

                let detectedMatText = p.materialText;
                if (!detectedMatText) {
                    if (type === 'sheet') detectedMatText = 'ام‌دی‌اف (MDF)';
                    else if (type === 'backsplash') detectedMatText = 'بین کابینتی (ماربل شیت)'; // 👈 تغییر متن متریال هوشمند
                    else if (type === 'fiber') detectedMatText = 'سه میل پرینتی';
                    else if (type === 'pvc') detectedMatText = 'پی‌وی‌سی (PVC)';
                    else if (type === 'countertop') detectedMatText = 'صفحه کابینت'; 
                    else detectedMatText = 'نامشخص';
                }

                const activeRotation = autoPiecesRotationOverrides[p.label] || p.rotation || 'none';

                allPiecesToRender.push({
                    type: type,
                    w: p.w,
                    h: p.h,
                    count: p.count,
                    label: p.label || typeLabels[type],
                    isAuto: true,
                    materialText: detectedMatText,
                    colorName: p.colorName || (type === 'backsplash' ? 'طرح سنگ مرمر' : (type === 'countertop' ? 'سفید مات' : 'سفید یخچالی')), // 👈 تغییر رنگ پیش‌فرض هوشمند
                    colorHex: p.colorHex || p.color || (type === 'pvc' ? '#e2e8f0' : '#FFFFFF'),
                        colorTexture: p.colorTexture || p.texture || '',
                        serviceW: p.serviceW || '-', 
                        serviceH: p.serviceH || '-',
                        rotation: activeRotation 
                    });
                });
            }
        });
    }

    globalManualPieces.forEach((mPiece, manualIdx) => {
        allPiecesToRender.push({
            ...mPiece,
            manualIndex: manualIdx,
            isAuto: false
        });
    });

    allPiecesToRender.forEach((item) => {
        const tr = document.createElement('tr');
        
        let swatchStyle = `width:12px; height:12px; border-radius:50%; border:1px solid rgba(255,255,255,0.25); display:inline-block; vertical-align:middle;`;
        if (item.colorTexture) {
            swatchStyle += `background-image: url('${item.colorTexture}'); background-size: cover; background-position: center;`;
        } else {
            swatchStyle += `background-color: ${item.colorHex || '#FFFFFF'};`;
        }

        let actionCell = '';
        if (item.isAuto === true) {
            actionCell = `<span style="font-size:11px; color:#10b981; background:rgba(16,185,129,0.1); padding:2px 6px; border-radius:4px;">🤖 هوشمند</span>`;
        } else {
            actionCell = `<button onclick="deleteManualPiece(${item.manualIndex})" class="btn-delete-row" style="color:#ef4444; font-size:14px; padding:2px 6px; background:none; border:none; cursor:pointer;" title="حذف قطعه سفارشی">🗑️</button>`;
        }

        const refKey = item.isAuto ? `'${item.label}'` : item.manualIndex;
        let rotationSelectHtml = `
            <select onchange="changePieceRotationLive(${item.isAuto}, ${refKey}, this)" style="background:#1e293b; color:#cbd5e1; border:1px solid #475569; border-radius:4px; font-size:11px; padding:2px;">
                <option value="none" ${item.rotation === 'none' ? 'selected' : ''}>غیر مهم</option>
                <option value="horizontal" ${item.rotation === 'horizontal' ? 'selected' : ''}>افقی</option>
                <option value="vertical" ${item.rotation === 'vertical' ? 'selected' : ''}>عمودی</option>
            </select>
        `;

        tr.innerHTML = `
            <td>
                <span class="status-dot ${item.type}-dot" style="width:8px; height:8px; margin-left:4px;"></span>
                <span style="font-size:12px; color:#e2e8f0;" title="${item.label}">${item.label}</span>
            </td>
            <td><strong>${item.w.toFixed(1)}</strong></td>
            <td><strong>${item.h.toFixed(1)}</strong></td>
            <td><mark style="background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 6px; border-radius:4px; font-weight:bold;">${item.count}</mark></td>
            <td style="color:#cbd5e1; font-size:12px; text-align:center;">${item.serviceW}</td>
            <td style="color:#cbd5e1; font-size:12px; text-align:center;">${item.serviceH}</td>
            <td>${rotationSelectHtml}</td>
            <td><span class="manual-badge-inline">${item.materialText}</span></td>
            <td>
                <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                    <span style="${swatchStyle}" title="${item.colorName}"></span>
                    <span style="font-size:11px; color:#cbd5e1;">${item.colorName}</span>
                </div>
            </td>
            <td style="text-align:center;">${actionCell}</td>
        `;
        tbody.appendChild(tr);
    });
}


function deleteManualPiece(index) {
    if (index > -1 && index < globalManualPieces.length) {
        globalManualPieces.splice(index, 1);
        renderManualPiecesTable();
    }
}

function clearAllManualPieces() {
    if(globalManualPieces.length > 0 && confirm("آیا از پاک کردن کل لیست دستی مطمئن هستید؟")) {
        globalManualPieces = [];
        autoPiecesRotationOverrides = {}; 
        renderManualPiecesTable();
    }
}

function applyManualPiecesAndRecompute() {
    closeManualListModal();
    if (window.cutPanel && typeof window.cutPanel.optimizeAll === "function") {
        window.cutPanel.optimizeAll();
    } else if (typeof optimizeCuts === "function") {
        optimizeCuts();
    }
}
