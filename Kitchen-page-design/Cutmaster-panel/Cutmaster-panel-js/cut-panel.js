// js/cut-panel.js - نسخه نهایی و سبک‌سازی‌شده بدون متد محاسباتی حجیم
function toggleCutPanel() {
  const overlay = document.getElementById("cut-master-modal-overlay");
  if (overlay) {
    overlay.classList.toggle("open"); 
  }
}

function toggleCutList() {
  const panel = document.getElementById("cut-list-sidebar");
  if (panel) {
      panel.classList.remove("open"); 
  }
}

class CutPanel {
    constructor() {
    this.config = {
        kerf: 0.4, 
        orientation: 'free',
        colors: {
            piece: { fill: '#ffcc80', stroke: '#ef6c00', text: '#3e2723' },
            waste: { fill: '#e8f5e9', stroke: '#81c784', text: '#2e7d32' },
            sheet: { bg: '#ffffff', border: '#424242' }
        },
        font: '12px IRANSans, Tahoma, sans-serif'
    };

    this.sheets = {
        sheet: [
            { name: "366 × 183 (بزرگ)", w: 366, h: 183 },
            { name: "280 × 210 (متوسط)", w: 280, h: 210 }
        ],
        backsplash: [
            { name: "280 × 210 (هایگلاس)", w: 280, h: 210 },
            { name: "280 × 122 (فرامید)", w: 280, h: 122 },
            { name: "366 × 183 (مات)", w: 366, h: 183 }
        ],
        fiber: [
            { name: "244 × 183 (فیبر)", w: 244, h: 183 }
        ],
        pvc: [
            { name: "280 × 122 (استاندارد PVC)", w: 280, h: 122 },
            { name: "244 × 122 (کوچک PVC)", w: 244, h: 122 }
        ],
        countertop: [ // 🌟 اضافه شدن ابعاد پیش‌فرض ورق صفحه کابینت
            { name: "410 × 60 (استاندارد صفحه)", w: 410, h: 60 },
            { name: "366 × 60 (کوچک صفحه)", w: 366, h: 60 }
        ]
    };

    this.state = {
        activeTab: 'sheet',
        sheetSizes: {
            sheet: this.sheets.sheet[0],
            backsplash: this.sheets.backsplash[0],
            fiber: this.sheets.fiber[0],
            pvc: this.sheets.pvc[0],
            countertop: this.sheets.countertop[0] // 🌟 اضافه شد
        },
        results: { sheet: [], backsplash: [], fiber: [], pvc: [], countertop: [] } // 🌟 اضافه شد
    };

    this.init();
}


    init() {
        this.setupDOM();
        this.setupModal(); 
        this.setupManualPiecesModal(); 
        this.setupLoadingOverlay(); 
        this.attachEvents();
    }

    setupLoadingOverlay() {
        if (document.getElementById('cutmaster-loading-overlay')) return;
        
        const overlayHTML = `
            <div id="cutmaster-loading-overlay" style="
                display: none; position: fixed; z-index: 9999; left: 0; top: 0; 
                width: 100%; height: 100%; background-color: rgba(255,255,255,0.95);
                backdrop-filter: blur(5px); direction: rtl; font-family: Tahoma, sans-serif;
                align-items: center; justify-content: center; flex-direction: column;
            ">
                <div style="background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; width: 350px;">
                    <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 15px; font-size: 16px;">در حال بهینه‌سازی چیدمان کات مستر...</div>
                    <div style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">چیدمان گیلوتینی با رعایت خط برش دستگاه در حال بهینه‌سازی است...</div>
                    <div style="width: 100%; background-color: #e5e7eb; border-radius: 9999px; height: 12px; overflow: hidden; position: relative;">
                        <div id="cutmaster-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3b82f6, #1d4ed8); border-radius: 9999px; transition: width 0.1s ease-out;"></div>
                    </div>
                    <div id="cutmaster-progress-text" style="font-size: 12px; color: #3b82f6; font-weight: bold; margin-top: 8px;">۰%</div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }

        setupModal() {
        if (document.getElementById('cut-panel-modal')) return; // جلوگیری از دابل تزریق
        
        const modalHTML = `
            <div id="cut-panel-modal" style="
                display: none; position: fixed; z-index: 2600; left: 0; top: 0; 
                width: 100%; height: 100%; overflow: auto; background-color: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                padding-top: 60px; direction: rtl;
            ">
                <div id="modal-content-container" style="
                    margin: auto; background-color: #1e293b; padding: 25px; border-radius: 16px;
                    max-width: 90%; max-height: 90%; overflow: auto; text-align: center;
                    border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                    color: #f8fafc;
                ">
                    <span id="modal-close" style="
                        color: #94a3b8; float: left; font-size: 32px; font-weight: bold; cursor: pointer;
                        margin-left: 10px; line-height: 1; transition: color 0.2s;
                    ">&times;</span>
                    <h3 id="modal-title" style="margin-top: 0; color: #f1f5f9; font-family: Tahoma, sans-serif; font-size: 16px;"></h3>
                    <div id="modal-canvas-wrapper" style="width: 100%; height: auto; margin: 20px 0; display: flex; justify-content: center;"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('cut-panel-modal');
        const closeBtn = document.getElementById('modal-close');
        
        closeBtn.onmouseenter = () => { closeBtn.style.color = '#ef4444'; };
        closeBtn.onmouseleave = () => { closeBtn.style.color = '#94a3b8'; };
        
        closeBtn.onclick = () => { modal.style.display = "none"; };
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };
    } // 👈 پایان متد setupModal

    // 🟢 حالا تابع را به عنوان یک متد مستقل درون کلاس قرار می‌دهیم
    setupIsolatedPiecesModalDOM() {
        if (document.getElementById('isolated-pieces-modal')) return;
        
        const modalHTML = `
            <div id="isolated-pieces-modal" style="
                display: none; position: fixed; z-index: 2700; left: 0; top: 0; 
                width: 100%; height: 100%; overflow: auto; background-color: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(10px); padding-top: 50px; direction: rtl; font-family: Tahoma, sans-serif;
            ">
                <div style="
                    margin: auto; background-color: #0f172a; padding: 25px; border-radius: 20px;
                    max-width: 85%; max-height: 85%; overflow: auto;
                    border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
                    color: #f8fafc;
                ">
                    <span onclick="document.getElementById('isolated-pieces-modal').style.display='none'" style="
                        color: #94a3b8; float: left; font-size: 32px; font-weight: bold; cursor: pointer; line-height: 1;
                    " onmouseenter="this.style.color='#ef4444'" onmouseleave="this.style.color='#94a3b8'">&times;</span>
                    
                    <h3 style="margin-top: 0; color: #38bdf8; font-size: 18px; border-bottom: 1px solid #334155; padding-bottom: 12px;">✂️ کارگاه فتوشاپی تفکیک و برش قطعات کات‌مستر</h3>
                    <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px;">در این بخش، تکسچر هر قطعه دقیقاً بر اساس پازل ورق خام کات‌مستر برش خورده و به صورت تصاویر ایزوله (بدون کشیدگی) تولید شده است.</p>
                    
                    <div id="isolated-pieces-grid" style="
                        display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; padding: 10px;
                    "></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }



    setupManualPiecesModal(retries = 15) {
        const modal = document.getElementById('manual-pieces-modal');
        if (!modal) {
            if (retries > 0) {
                // سایدبار کات‌مستر به صورت async لود می‌شود؛ چند بار تلاش می‌کنیم
                setTimeout(() => this.setupManualPiecesModal(retries - 1), 200);
            } else {
                console.warn("مودال دستی در لایه HTML اولیه یافت نشد.");
            }
        } else {
            if (typeof renderManualPiecesTable === 'function') {
                renderManualPiecesTable();
            }
        }
    }

    showZoomModal(bin, index) {
        const modal = document.getElementById('cut-panel-modal');
        const title = document.getElementById('modal-title');
        const wrapper = document.getElementById('modal-canvas-wrapper');
        
        wrapper.innerHTML = '';
        const largeCanvas = this.createSheetCanvas(bin, index, 800);
        title.textContent = `نمای بزرگنمایی ورق شماره ${index}`;
        wrapper.appendChild(largeCanvas.canvas); 
        modal.style.display = "block";
    }
    
    setupDOM() {
        if (typeof updateAccordionMetaBadges === 'function') {
            updateAccordionMetaBadges();
        }
    }

    attachEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                if(tab) this.switchTab(tab);
            });
        });
    }

    switchTab(tabName) {
        this.state.activeTab = tabName;
        document.querySelectorAll('.sheet-tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

        const content = document.getElementById(`sheet-${tabName}`);
        const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);

        if (content) content.classList.add('active');
        if (btn) btn.classList.add('active');

        this.renderActiveTab();
    }

optimizeAll() {
    if (typeof collectPieces !== 'function') {
        console.warn("تابع مستقل محاسباتی قطعات هنوز کاملاً بارگذاری نشده است...");
        return;
    }

    const kerfInput = document.getElementById('cut-param-kerf');
    const orientationSelect = document.getElementById('cut-param-orientation');
    const grainSelect = document.getElementById('cut-param-grain');

    if (kerfInput) this.config.kerf = (parseFloat(kerfInput.value) || 3.5) / 10; 
    if (orientationSelect) this.config.orientation = orientationSelect.value;
    if (grainSelect) this.config.grain = grainSelect.value;

    const overlay = document.getElementById('cutmaster-loading-overlay');
    const progressBar = document.getElementById('cutmaster-progress-bar');
    const progressText = document.getElementById('cutmaster-progress-text');
    
    if (overlay) overlay.style.display = 'flex';
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += 10;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.innerText = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            
            setTimeout(async () => {
                const pieces = collectPieces();
                let allDetectedRotations = [];
                
                // 🌟 اضافه شدن countertop جهت شناسایی سیستم چرخش قطعات اختصاصی
                ['sheet', 'backsplash', 'fiber', 'pvc', 'countertop'].forEach(type => {
                    if (pieces[type]) {
                        pieces[type].forEach(p => {
                            let r = 'none';
                            if (p.isAuto === false) {
                                r = p.rotation || 'none';
                            } else if (typeof autoPiecesRotationOverrides !== 'undefined' && autoPiecesRotationOverrides[p.label]) {
                                r = autoPiecesRotationOverrides[p.label];
                            } else {
                                r = p.rotation || 'none';
                            }
                            allDetectedRotations.push(r);
                        });
                    }
                });

                let uniqueRotations = [...new Set(allDetectedRotations)];
                const orientationSelect = document.getElementById('cut-param-orientation');

                if (orientationSelect && uniqueRotations.length > 0) {
                    if (uniqueRotations.length === 1) {
                        let singleValue = uniqueRotations[0];
                        if (singleValue === 'none') singleValue = 'free'; 
                        orientationSelect.value = singleValue;
                    } else {
                        orientationSelect.value = 'custom';
                    }
                }

                // 🌟 حلقه اصلی پردازش انبار و چیدمان پازلی قطعات (اضافه شدن countertop)
                ['sheet', 'backsplash', 'fiber', 'pvc', 'countertop'].forEach(type => {
                    const container = document.getElementById(`sheets-list-container-${type}`);
                    let dynamicSheets = [];
                    
                    if (container) {
                        const rows = container.querySelectorAll('.sheet-item-row');
                        rows.forEach(row => {
                            const wInput = row.querySelector('.sheet-w');
                            const hInput = row.querySelector('.sheet-h');
                            const qtyInput = row.querySelector('.sheet-qty');
                            const unlimitedCheck = row.querySelector('.sheet-unlimited');
                            const matSelect = row.querySelector('.sheet-material-type');
                            let material = matSelect ? matSelect.value : type; 
                            
                            if (type === 'sheet' && material === 'sheet') material = 'mdf'; 
                            if (type === 'countertop' && material === 'countertop') material = 'countertop'; // 🌟 تایید متریال صفحه
                            
                            let defaultColorName = "سفید یخچالی";
                            let defaultColorHex = "#FFFFFF";
                            
                            if (type === 'fiber') {
                                defaultColorName = "سفید پرینتی";
                                defaultColorHex = "#FFFFFF";
                            } else if (type === 'pvc') {
                                defaultColorName = "پی‌وی‌سی سفید";
                                defaultColorHex = "#e2e8f0";
                            } else if (type === 'countertop') { // 🌟 رنگ پیش‌فرض صفحه کابینت
                                defaultColorName = "سفید مات";
                                defaultColorHex = "#FFFFFF";
                            }

                            let colorName = row.dataset.selectedColorName || defaultColorName;
                            let colorHex = row.dataset.selectedColorCode || defaultColorHex;
                            const colorTexture = row.dataset.selectedTextureUrl || "";

                            if (type === 'fiber') {
                                material = 'Fibr';
                                if (colorName === "سفید" || colorName === "لترون (در آینده)" || colorName === "پی‌وی‌سی سفید") {
                                    colorName = "سفید پرینتی";
                                    colorHex = "#FFFFFF";
                                }
                            }

                            if (type === 'pvc') {
                                material = 'PVC';
                                if (colorName === "پی وی سی سفید" || colorName === "پی‌وی‌سی سفید") {
                                    colorName = "پی‌وی‌سی سفید"; 
                                }
                            }

                            if (wInput && hInput) {
                                let w = parseFloat(wInput.value) || 0;
                                let h = parseFloat(hInput.value) || 0;
                                const isUnlimited = unlimitedCheck ? unlimitedCheck.checked : false;
                                const qty = isUnlimited ? Infinity : (parseInt(qtyInput.value) || 0);
                                
                                if (w > 0 && h > 0 && (isUnlimited || qty > 0)) {
                                    dynamicSheets.push({ w, h, qty, material, colorName, colorHex, colorTexture });
                                }
                            }
                        });
                    }
                    
                    // تخصیص خروجی پکینگ
                    if (dynamicSheets.length === 0) {
                        const currentPieces = pieces[type] || [];
                        this.state.results[type] = { bins: [], failedPieces: currentPieces.map(p => ({
                            label: p.label, w: p.w, h: p.h,
                            reason: "هیچ ورق معتبری برای این متریال در تنظیمات انبار کات‌مستر تعریف نشده است!"
                        }))};
                    } else {
                        this.state.results[type] = this.packItemsMultiSheets(pieces[type] || [], dynamicSheets, type);
                    }
                });

                if (this.state.results) {
                    window.lastCalculatedBacksplashBins = this.state.results.backsplash ? this.state.results.backsplash.bins : null;
                    window.lastCalculatedSheetBins = this.state.results.sheet ? this.state.results.sheet.bins : null;
                    window.lastCalculatedCountertopBins = this.state.results.countertop ? this.state.results.countertop.bins : null; // 🌟 اضافه شد
                }

                this.renderActiveTab();

                // اضافه شدن رندر اچ‌دی برای بافت‌های صفحه کابینت در صورت وجود عکس
                if (this.state.results && (this.state.results.backsplash || this.state.results.body || this.state.results.sheet || this.state.results.countertop)) {
                    if (progressText) progressText.innerText = `در حال رندر متریال HD قطعات...`;
                    await this.generateAllHighResTexturesAsync(this.state.results);
                }

                if (overlay) overlay.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';

                if (window.Kitchen3D && typeof window.Kitchen3D.refreshCabinets === 'function') {
                    window.Kitchen3D.refreshCabinets();
                } else if (typeof refreshCabinets === 'function') {
                    refreshCabinets();
                }
                // Babylon جدا — تا تکسچرهای isolatedDoorTexturesByCab روی درب‌ها بنشیند
                try {
                    if (window.KitchenBabylon && typeof window.KitchenBabylon.refreshCabinets === 'function') {
                        window.KitchenBabylon.refreshCabinets();
                    }
                } catch (e) {}
                this.renderIsolatedPieces();
            }, 50);
        }
    }, 35);
}


/**
   * ایندکس سریع تکسچر برش برای Babylon:
   * window.isolatedDoorTexturesByCab[cabId]["درب 1"] = dataUrl
   */
  _cmIndexIsolatedTexture(cleanLabel, dataUrl) {
    if (!cleanLabel || !dataUrl) return;
    window.isolatedDoorTextures = window.isolatedDoorTextures || {};
    window.isolatedDoorTextures[cleanLabel] = dataUrl;

    window.isolatedDoorTexturesByCab = window.isolatedDoorTexturesByCab || {};
    // استخراج U{id} و بخش بعد از آخرین " - "
    const um = String(cleanLabel).match(/U(\d+)/i);
    if (!um) return;
    const cabId = um[1];
    let part = '';
    const dash = String(cleanLabel).lastIndexOf(' - ');
    if (dash >= 0) part = String(cleanLabel).slice(dash + 3).trim();
    else part = String(cleanLabel).trim();
    if (!part) return;
    if (!window.isolatedDoorTexturesByCab[cabId]) {
      window.isolatedDoorTexturesByCab[cabId] = {};
    }
    window.isolatedDoorTexturesByCab[cabId][part] = dataUrl;
    // کلیدهای کمکی استاندارد
    const partNorm = part.replace(/\s+/g, ' ').trim();
    window.isolatedDoorTexturesByCab[cabId][partNorm] = dataUrl;
  }

  generateAllHighResTexturesAsync(results) {
    return new Promise((resolve) => {
        window.isolatedDoorTextures = window.isolatedDoorTextures || {};
        window.isolatedDoorTexturesByCab = {};
        let imagesToLoad = [];

        ['backsplash', 'sheet', 'countertop'].forEach(type => {
            if (results[type] && results[type].bins) {
                results[type].bins.forEach((bin) => {
                    if (bin.colorTexture) {
                        imagesToLoad.push(bin);
                    }
                });
            }
        });

        if (imagesToLoad.length === 0) {
            ['backsplash', 'body', 'countertop'].forEach(type => {
                if (results[type] && results[type].bins) {
                    results[type].bins.forEach((bin) => {
                        bin.usedRects.forEach((rect) => {
                            if (!rect.label) return;
                            const cleanLabel = rect.label.replace('📌', '').trim();
                            const colorCanvas = document.createElement('canvas');
                            colorCanvas.width = 64; colorCanvas.height = 64;
                            const ctx = colorCanvas.getContext('2d');
                            ctx.fillStyle = bin.colorHex || '#ffffff';
                            ctx.fillRect(0, 0, 64, 64);
                            this._cmIndexIsolatedTexture(cleanLabel, colorCanvas.toDataURL("image/jpeg"));
                        });
                    });
                }
            });
            return resolve();
        }

        let loadedCount = 0;
        imagesToLoad.forEach((bin) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = bin.colorTexture;
            
            const processImg = () => {
                try {
                    const scale = 5; 
                    const fullSheetCanvas = document.createElement('canvas');
                    fullSheetCanvas.width = bin.w * scale;
                    fullSheetCanvas.height = bin.h * scale;
                    const fCtx = fullSheetCanvas.getContext('2d');

                    const tCanvas = document.createElement('canvas');
                    const tCtx = tCanvas.getContext('2d');
                    
                    if (bin.material === 'countertop') {
                        tCanvas.width = img.width || 100;
                        tCanvas.height = img.height || 100;
                        const pattern = fCtx.createPattern(img, 'repeat');
                        if (pattern) {
                            const matrix = new DOMMatrix();
                            matrix.scaleSelf((bin.w * scale) / tCanvas.width, (bin.h * scale) / tCanvas.height);
                            pattern.setTransform(matrix);
                            fCtx.fillStyle = pattern;
                        } else {
                            fCtx.fillStyle = bin.colorHex || '#ffffff';
                        }
                    } else {
                        tCanvas.width = img.height || 100;
                        tCanvas.height = img.width || 100;
                        tCtx.translate(tCanvas.width / 2, tCanvas.height / 2);
                        tCtx.rotate(Math.PI / 2);
                        tCtx.drawImage(img, -img.width / 2, -img.height / 2);

                        const pattern = fCtx.createPattern(tCanvas, 'repeat');
                        if (pattern) {
                            const matrix = new DOMMatrix();
                            matrix.scaleSelf((bin.w * scale) / tCanvas.width, (bin.h * scale) / tCanvas.height);
                            pattern.setTransform(matrix);
                            fCtx.fillStyle = pattern;
                        } else {
                            fCtx.fillStyle = bin.colorHex || '#ffffff';
                        }
                    }
                    
                    fCtx.fillRect(0, 0, fullSheetCanvas.width, fullSheetCanvas.height);

                    bin.usedRects.forEach((rect) => {
                        if (!rect.label) return;
                        const cleanLabel = rect.label.replace('📌', '').trim();

                        const rw = rect.w * scale;
                        const rh = rect.h * scale;

                        const pieceCanvas = document.createElement('canvas');
                        pieceCanvas.width = rw; pieceCanvas.height = rh;
                        const pCtx = pieceCanvas.getContext('2d');
                        pCtx.drawImage(fullSheetCanvas, rect.x * scale, rect.y * scale, rw, rh, 0, 0, rw, rh);

                        if (bin.material === 'countertop') {
                            if (rect.rotated) {
                                const rotCanvas = document.createElement('canvas');
                                rotCanvas.width = rh; rotCanvas.height = rw;
                                const rotCtx = rotCanvas.getContext('2d');
                                rotCtx.translate(rh / 2, rw / 2);
                                rotCtx.rotate(Math.PI / 2);
                                rotCtx.drawImage(pieceCanvas, -rw / 2, -rh / 2);
                                this._cmIndexIsolatedTexture(cleanLabel, rotCanvas.toDataURL("image/jpeg", 0.95));
                            } else {
                                this._cmIndexIsolatedTexture(cleanLabel, pieceCanvas.toDataURL("image/jpeg", 0.95));
                            }
                        } else {
                            const rotCanvas = document.createElement('canvas');
                            rotCanvas.width = rh; rotCanvas.height = rw;
                            const rotCtx = rotCanvas.getContext('2d');
                            rotCtx.translate(rh / 2, rw / 2);
                            rotCtx.rotate(Math.PI / 2);
                            rotCtx.drawImage(pieceCanvas, -rw / 2, -rh / 2);
                            this._cmIndexIsolatedTexture(cleanLabel, rotCanvas.toDataURL("image/jpeg", 0.95));
                        }
                    });
                } catch (err) {
                    console.error("خطا در بازسازی کیفیت بافت قطعه:", err);
                }

                loadedCount++;
                if (loadedCount === imagesToLoad.length) resolve();
            };

            img.onload = processImg;
            if (img.complete) processImg();
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === imagesToLoad.length) resolve();
            };
        });
    });
}


  /**
   * ============================================================
   *  CutMaster Engine v2 — موتور بهینه‌سازی چنداستراتژی
   *  - چند الگوریتم چیدمان (MaxRects / Guillotine / Shelf)
   *  - چند ترتیب مرتب‌سازی قطعات
   *  - تست چرخش ورق و چرخش قطعه
   *  - انتخاب بهترین نتیجه بر اساس تعداد ورق و درصد پرتی
   * ============================================================
   */
  packItemsMultiSheets(items, availableSheets, type) {
    const outputResult = { bins: [], failedPieces: [] };
    if (!items || items.length === 0) return outputResult;

    const kerf = this.config.kerf || 0.4;
    const orientation = this.config.orientation || 'free';

    // ۱) گروه‌بندی بر اساس جنس + رنگ
    const groupedItems = {};
    items.forEach(p => {
      const count = p.count || 1;
      const currentMaterial = p.material || type;
      const key = `${currentMaterial}_${p.colorName || 'نامشخص'}`;
      if (!groupedItems[key]) {
        groupedItems[key] = {
          material: currentMaterial,
          colorName: p.colorName || 'نامشخص',
          colorHex: p.colorHex || '#FFFFFF',
          colorTexture: p.colorTexture || '',
          rects: []
        };
      }
      for (let i = 0; i < count; i++) {
        groupedItems[key].rects.push({
          w: Number(p.w),
          h: Number(p.h),
          label: p.label,
          area: Number(p.w) * Number(p.h),
          id: Math.random().toString(36).substr(2, 8),
          rotation: p.rotation || 'none'
        });
      }
    });

    for (const key in groupedItems) {
      const group = groupedItems[key];
      let remainingRects = group.rects.slice();

      let matchedSheets = availableSheets
        .filter(s => s.material === group.material && s.colorName === group.colorName)
        .map(s => ({
          w: Number(s.w),
          h: Number(s.h),
          qty: s.qty,
          originalRef: s
        }));

      if (matchedSheets.length === 0) {
        remainingRects.forEach(rect => {
          outputResult.failedPieces.push({
            label: rect.label, w: rect.w, h: rect.h,
            reason: `ورقی با جنس (${group.material}) و رنگ (${group.colorName}) در انبار کات‌مستر یافت نشد!`
          });
        });
        continue;
      }

      // حذف قطعاتی که روی هیچ ورقی جا نمی‌شوند
      for (let i = remainingRects.length - 1; i >= 0; i--) {
        const rect = remainingRects[i];
        const canFit = matchedSheets.some(sheet =>
          (rect.w <= sheet.w && rect.h <= sheet.h) ||
          (rect.h <= sheet.w && rect.w <= sheet.h)
        );
        if (!canFit) {
          outputResult.failedPieces.push({
            label: rect.label, w: rect.w, h: rect.h,
            reason: `ابعاد این قطعه از تک‌تک ورق‌های ${group.colorName} موجود در انبار بزرگتر است!`
          });
          remainingRects.splice(i, 1);
        }
      }

      if (remainingRects.length === 0) continue;

      // اجرای موتور چنداستراتژی برای این گروه
      const best = this._cmRunBestPacking(
        remainingRects,
        matchedSheets,
        kerf,
        orientation,
        type,
        {
          colorHex: group.colorHex,
          colorTexture: group.colorTexture,
          colorName: group.colorName,
          material: group.material
        }
      );

      // اعمال نتیجه روی موجودی ورق
      best.bins.forEach(bin => {
        // پیدا کردن ورق متناظر و کم کردن موجودی
        const matchIdx = matchedSheets.findIndex(s =>
          s.qty > 0 &&
          ((s.w === bin.w && s.h === bin.h) || (s.w === bin.h && s.h === bin.w))
        );
        if (matchIdx !== -1) {
          const active = matchedSheets[matchIdx];
          if (active.qty !== Infinity) {
            active.qty--;
            if (active.originalRef && active.originalRef.qty !== Infinity) {
              active.originalRef.qty--;
            }
          }
        }
        outputResult.bins.push(bin);
      });

      best.failed.forEach(f => outputResult.failedPieces.push(f));
    }

    return outputResult;
  }

  /**
   * اجرای چندین استراتژی و انتخاب بهترین
   */
  /**
   * موتور چیدمان گیلوتینی (مناسب اره پنل / CNC)
   * فقط برش‌های یکسره افقی و عمودی — بدون تداخل خط برش
   */
  _cmRunBestPacking(pieces, sheets, kerf, orientation, type, styleMeta) {
    const sheetTemplates = sheets.map(s => ({
      w: s.w, h: s.h, qty: s.qty === Infinity ? 9999 : s.qty
    }));

    // فقط استراتژی‌های گیلوتینی / نواری (قابل برش با دستگاه)
    const sortStrategies = [
      { name: 'height', fn: (a, b) => b.h - a.h || b.w - a.w },
      { name: 'width', fn: (a, b) => b.w - a.w || b.h - a.h },
      { name: 'maxside', fn: (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.area - a.area },
      { name: 'area', fn: (a, b) => b.area - a.area || Math.max(b.w, b.h) - Math.max(a.w, a.h) },
      { name: 'perimeter', fn: (a, b) => (b.w + b.h) - (a.w + a.h) || b.area - a.area }
    ];

    // strip-h: نوار افقی (برش طولی اول، بعد عرضی)
    // strip-v: نوار عمودی (برش عرضی اول، بعد طولی)
    // guillotine-rect: گیلوتین بازگشتی کلاسیک
    // shelf-ffdh: قفسه‌ای FFDH (گیلوتین سطح ۱)
    const packModes = ['strip-h', 'strip-v', 'guillotine-rect', 'shelf-ffdh'];

    let bestResult = null;
    let bestScore = Infinity;

    for (const sortS of sortStrategies) {
      for (const mode of packModes) {
        // ورق همیشه با همان ابعاد انبار می‌ماند — چرخش ورق نداریم
        // فقط جهت چیدمان قطعات و نوارهای داخل ورق تغییر می‌کند
        const sheetsCopy = sheetTemplates.map(s => ({
          w: s.w,
          h: s.h,
          qty: s.qty,
          baseW: s.w,
          baseH: s.h
        }));

        const piecesCopy = pieces.map(p => ({ ...p }));
        piecesCopy.sort(sortS.fn);

        const result = this._cmPackWithMode(piecesCopy, sheetsCopy, kerf, orientation, mode, styleMeta);

        // رد کردن نتیجه خراب (هم‌پوشانی / خارج از ورق / بدون شناسه)
        if (!this._cmValidateResult(result)) continue;

        const totalArea = result.bins.reduce((s, b) => s + b.w * b.h, 0);
        const usedArea = result.bins.reduce((s, b) =>
          s + b.usedRects.reduce((u, r) => u + r.w * r.h, 0), 0);
        const wasteRatio = totalArea > 0 ? (totalArea - usedArea) / totalArea : 1;
        const score =
          result.failed.length * 1e9 +
          result.bins.length * 1e6 +
          wasteRatio * 1e4;

        if (score < bestScore) {
          bestScore = score;
          bestResult = result;
        }
      }
    }

    if (!bestResult) {
      return {
        bins: [],
        failed: pieces.map(p => ({
          label: p.label, w: p.w, h: p.h,
          reason: 'چیدمان گیلوتینی ممکن نبود'
        }))
      };
    }

    // تولید خطوط برش و محاسبه کامل همه نواحی پرتی داخل ورق
    bestResult.bins.forEach(bin => {
      bin.cutLines = this._cmBuildCutLines(bin, kerf);
      bin.freeRects = this._cmComputeAllWaste(bin, kerf);
    });

    return bestResult;
  }

  /**
   * محاسبه فضاهای پرتی ورق:
   * - انتهای هر نوار / فضای بعد از آخرین نوار
   * - فضای خالی بالای قطعات کوتاه‌تر از ضخامت نوار
   * - شکاف اضافه بین قطعات (بیش از kerf)
   * فاصلهٔ تیغ (kerf) بین قطعات/نوارها پرتی نیست — خط برش است
   */
  /**
   * محاسبه پرتی فقط از روی قطعات واقعی (usedRects)
   * هیچ ناحیه‌ای که قطعه روی آن است پرتی حساب نمی‌شود
   * فاصله تیغ بین قطعات هم پرتی نیست
   */
  _cmComputeAllWaste(bin, kerf) {
    const W = bin.w;
    const H = bin.h;
    const wastes = [];
    const minSize = 0.8;
    const k = Math.max(0, kerf || 0);
    const rects = bin.usedRects || [];

    if (!rects.length) {
      return [{ x: 0, y: 0, w: W, h: H }];
    }

    // شبکه از لبه‌های قطعات + گوشه‌های ورق
    const xs = [0, W];
    const ys = [0, H];
    rects.forEach(r => {
      xs.push(r.x, r.x + r.w);
      ys.push(r.y, r.y + r.h);
    });
    const uniq = (arr) => [...new Set(arr.map(v => +v.toFixed(3)))].sort((a, b) => a - b);
    const xA = uniq(xs);
    const yA = uniq(ys);

    for (let i = 0; i < xA.length - 1; i++) {
      for (let j = 0; j < yA.length - 1; j++) {
        const x = xA[i];
        const y = yA[j];
        const w = xA[i + 1] - x;
        const h = yA[j + 1] - y;
        if (w < minSize || h < minSize) continue;

        const cx = x + w / 2;
        const cy = y + h / 2;
        const inside = rects.some(r =>
          cx >= r.x - 1e-6 && cx <= r.x + r.w + 1e-6 &&
          cy >= r.y - 1e-6 && cy <= r.y + r.h + 1e-6
        );
        if (inside) continue;

        // فاصله تیغ بین قطعات = خط برش، نه پرتی
        const isKerfGap =
          (w <= k + 0.55 && h > k) ||
          (h <= k + 0.55 && w > k) ||
          (w <= k + 0.55 && h <= k + 0.55);
        if (isKerfGap) continue;

        wastes.push({ x, y, w, h });
      }
    }

    // ادغام سلول‌های مجاور (با تحمل فاصله تیغ) → یک تکه پرتی
    return this._cmMergeWasteRects(
      wastes.filter(r => r.w >= minSize && r.h >= minSize),
      k
    );
  }

  /**
   * ادغام مستطیل‌های پرتی هم‌تراز
   * فاصله تا kerf+1 بین دو سلول مانع ادغام نمی‌شود (همان فاصله تیغ است)
   */
  _cmMergeWasteRects(rects, kerf = 0.4) {
    if (!rects || rects.length <= 1) return rects || [];
    const eps = 0.2;
    const gapTol = Math.max(kerf + 1.2, 1.5);
    let list = rects.map(r => ({ x: +r.x, y: +r.y, w: +r.w, h: +r.h }));
    let changed = true;
    let safety = 0;

    while (changed && safety++ < 300) {
      changed = false;
      list.sort((a, b) => a.y - b.y || a.x - b.x);
      const used = new Array(list.length).fill(false);
      const out = [];

      for (let i = 0; i < list.length; i++) {
        if (used[i]) continue;
        let a = { x: list[i].x, y: list[i].y, w: list[i].w, h: list[i].h };
        let merged = true;
        while (merged) {
          merged = false;
          for (let j = 0; j < list.length; j++) {
            if (used[j] || j === i) continue;
            const b = list[j];

            // --- افقی: هم‌ردیف تقریبی، چسبیده یا با فاصله تیغ ---
            const sameRow =
              Math.abs(a.y - b.y) < eps && Math.abs(a.h - b.h) < Math.max(eps, a.h * 0.05 + 0.3);
            if (sameRow) {
              const aRight = a.x + a.w;
              const bRight = b.x + b.w;
              // b سمت راست a
              if (b.x >= a.x - eps && b.x <= aRight + gapTol && bRight > aRight + eps) {
                a.w = bRight - a.x;
                used[j] = true;
                merged = true;
                changed = true;
                continue;
              }
              // b سمت چپ a
              if (a.x >= b.x - eps && a.x <= bRight + gapTol && aRight > bRight + eps) {
                a.w = aRight - b.x;
                a.x = b.x;
                used[j] = true;
                merged = true;
                changed = true;
                continue;
              }
            }

            // --- عمودی: هم‌ستون تقریبی، چسبیده یا با فاصله تیغ ---
            const sameCol =
              Math.abs(a.x - b.x) < eps && Math.abs(a.w - b.w) < Math.max(eps, a.w * 0.05 + 0.3);
            if (sameCol) {
              const aBottom = a.y + a.h;
              const bBottom = b.y + b.h;
              // b پایین a
              if (b.y >= a.y - eps && b.y <= aBottom + gapTol && bBottom > aBottom + eps) {
                a.h = bBottom - a.y;
                used[j] = true;
                merged = true;
                changed = true;
                continue;
              }
              // b بالای a
              if (a.y >= b.y - eps && a.y <= bBottom + gapTol && aBottom > bBottom + eps) {
                a.h = aBottom - b.y;
                a.y = b.y;
                used[j] = true;
                merged = true;
                changed = true;
                continue;
              }
            }
          }
        }
        used[i] = true;
        out.push(a);
      }
      list = out;
    }

    // فیلتر نهایی ابعاد خیلی کوچک
    return list.filter(r => r.w >= 0.8 && r.h >= 0.8);
  }

  /**
   * اعتبارسنجی نتیجه چیدمان — جلوگیری از روی‌هم‌افتادن و گم‌شدن هویت قطعه
   */
  _cmValidateResult(result) {
    if (!result || !result.bins) return false;
    const eps = 0.05;
    for (const bin of result.bins) {
      const rects = bin.usedRects || [];
      for (let i = 0; i < rects.length; i++) {
        const a = rects[i];
        if (!(a.w > 0) || !(a.h > 0)) return false;
        if (a.x < -eps || a.y < -eps) return false;
        if (a.x + a.w > bin.w + eps || a.y + a.h > bin.h + eps) return false;
        // label باید باشد تا هویت قطعه گم نشود
        if (a.label == null && a.id == null) return false;
        for (let j = i + 1; j < rects.length; j++) {
          const b = rects[j];
          const overlap =
            a.x < b.x + b.w - eps &&
            a.x + a.w > b.x + eps &&
            a.y < b.y + b.h - eps &&
            a.y + a.h > b.y + eps;
          if (overlap) return false;
        }
      }
    }
    return true;
  }

  _cmPackWithMode(pieces, sheets, kerf, orientation, mode, styleMeta) {
    const bins = [];
    const failed = [];
    let remaining = pieces.map(p => ({ ...p }));
    const stock = sheets.map(s => ({ ...s }));

    while (remaining.length > 0) {
      let sheetIdx = stock.findIndex(s => s.qty > 0);
      if (sheetIdx === -1) {
        remaining.forEach(r => failed.push({
          label: r.label, w: r.w, h: r.h,
          reason: `موجودی ورق ${styleMeta.colorName} در انبار به اتمام رسید.`
        }));
        break;
      }

      const sheet = stock[sheetIdx];
      const bin = {
        w: sheet.w,
        h: sheet.h,
        usedRects: [],
        freeRects: [{ x: 0, y: 0, w: sheet.w, h: sheet.h }],
        strips: [],
        cutLines: [],
        colorHex: styleMeta.colorHex,
        colorTexture: styleMeta.colorTexture,
        colorName: styleMeta.colorName,
        material: styleMeta.material,
        packMode: mode
      };

      let placedAny = false;
      if (mode === 'strip-h') {
        placedAny = this._cmFillStrip(bin, remaining, kerf, orientation, 'h');
      } else if (mode === 'strip-v') {
        placedAny = this._cmFillStrip(bin, remaining, kerf, orientation, 'v');
      } else if (mode === 'guillotine-rect') {
        placedAny = this._cmFillGuillotine(bin, remaining, kerf, orientation);
      } else if (mode === 'shelf-ffdh') {
        placedAny = this._cmFillShelf(bin, remaining, kerf, orientation);
      }

      if (placedAny && bin.usedRects.length > 0) {
        bin.freeRects = (bin.freeRects || []).filter(r => r.w > 0.5 && r.h > 0.5);
        bins.push(bin);
        if (sheet.qty < 9999) sheet.qty--;
      } else {
        sheet.qty = 0;
      }
    }

    return { bins, failed };
  }

  _cmAllowOrientations(piece, orientation) {
    let allowNormal = true;
    let allowRot = true;
    if (orientation === 'custom' && piece) {
      const pr = piece.rotation || 'none';
      if (pr === 'horizontal') allowNormal = false;
      else if (pr === 'vertical') allowRot = false;
    } else {
      if (orientation === 'horizontal') allowNormal = false;
      if (orientation === 'vertical') allowRot = false;
    }
    return { allowNormal, allowRot };
  }

  /**
   * چیدمان نواری گیلوتینی
   * dir='h': نوارهای افقی — اول برش‌های افقی سراسری، بعد برش‌های عمودی داخل هر نوار
   * dir='v': نوارهای عمودی — اول برش‌های عمودی سراسری، بعد برش‌های افقی داخل هر نوار
   */
  _cmFillStrip(bin, remaining, kerf, orientation, dir) {
    const sheetW = bin.w;
    const sheetH = bin.h;
    const isH = dir === 'h';
    let placedAny = false;
    const placedIdx = new Set();

    // لیست قطعات با جهت‌های مجاز
    const items = remaining.map((p, idx) => {
      const { allowNormal, allowRot } = this._cmAllowOrientations(p, orientation);
      const orients = [];
      if (allowNormal) orients.push({ w: p.w, h: p.h, rot: false });
      if (allowRot && Math.abs(p.w - p.h) > 1e-9) orients.push({ w: p.h, h: p.w, rot: true });
      return { p, idx, orients };
    });

    // مرتب‌سازی: برای نوار افقی بر اساس ارتفاع، برای عمودی بر اساس عرض
    items.sort((a, b) => {
      const da = isH
        ? Math.min(...a.orients.map(o => o.h))
        : Math.min(...a.orients.map(o => o.w));
      const db = isH
        ? Math.min(...b.orients.map(o => o.h))
        : Math.min(...b.orients.map(o => o.w));
      return db - da;
    });

    // نوارها: { pos, thickness, cursor, pieces[] }
    const strips = [];

    for (const item of items) {
      if (!item.orients.length) continue;
      let done = false;

      // ۱) جا شدن در نوار موجود (ضخامت نوار >= ارتفاع/عرض قطعه)
      for (const strip of strips) {
        for (const o of item.orients) {
          const pieceAlong = isH ? o.w : o.h;   // بعد در راستای نوار
          const pieceCross = isH ? o.h : o.w;   // ضخامت نوار مورد نیاز
          if (pieceCross > strip.thickness + 1e-9) continue;
          const need = pieceAlong + kerf;
          const limit = isH ? sheetW : sheetH;
          if (strip.cursor + need <= limit + 1e-9 ||
              (strip.cursor + pieceAlong <= limit + 1e-9)) {
            // اگر آخرین قطعه نوار است، kerf انتهایی لازم نیست
            const useKerf = (strip.cursor + pieceAlong + kerf <= limit + 1e-9);
            const step = useKerf ? pieceAlong + kerf : pieceAlong;
            if (strip.cursor + pieceAlong > limit + 1e-9) continue;

            const x = isH ? strip.cursor : strip.pos;
            const y = isH ? strip.pos : strip.cursor;
            bin.usedRects.push({
              x, y, w: o.w, h: o.h,
              label: item.p.label, rotated: o.rot, id: item.p.id,
              stripId: strip.id
            });
            strip.pieces.push({ x, y, w: o.w, h: o.h });
            strip.cursor += step;
            placedIdx.add(item.idx);
            placedAny = true;
            done = true;
            break;
          }
        }
        if (done) break;
      }
      if (done) continue;

      // ۲) نوار جدید
      for (const o of item.orients) {
        const pieceAlong = isH ? o.w : o.h;
        const pieceCross = isH ? o.h : o.w;
        const limitAlong = isH ? sheetW : sheetH;
        const limitCross = isH ? sheetH : sheetW;

        let nextPos = 0;
        if (strips.length > 0) {
          const last = strips[strips.length - 1];
          nextPos = last.pos + last.thickness + kerf;
        }
        if (nextPos + pieceCross > limitCross + 1e-9) continue;
        if (pieceAlong > limitAlong + 1e-9) continue;

        const strip = {
          id: strips.length,
          pos: nextPos,
          thickness: pieceCross,
          cursor: 0,
          pieces: []
        };
        const x = isH ? 0 : nextPos;
        const y = isH ? nextPos : 0;
        bin.usedRects.push({
          x, y, w: o.w, h: o.h,
          label: item.p.label, rotated: o.rot, id: item.p.id,
          stripId: strip.id
        });
        strip.pieces.push({ x, y, w: o.w, h: o.h });
        const useKerf = (pieceAlong + kerf <= limitAlong + 1e-9);
        strip.cursor = useKerf ? pieceAlong + kerf : pieceAlong;
        strips.push(strip);
        placedIdx.add(item.idx);
        placedAny = true;
        done = true;
        break;
      }
    }

    // --- پر کردن فضاهای پرتی داخل همین ورق (انتهای نوار + بالای قطعات کوتاه + پایین ورق)
    bin.strips = strips.map(s => ({
      dir: dir,
      pos: s.pos,
      thickness: s.thickness,
      pieces: s.pieces.slice()
    }));
    this._cmBuildStripFreeRects(bin, strips, isH, sheetW, sheetH, kerf);
    if (this._cmPackIntoFreeRects(bin, remaining, placedIdx, kerf, orientation)) {
      placedAny = true;
    }

    // حذف قطعات قرارگرفته
    const sortedIdx = [...placedIdx].sort((a, b) => b - a);
    for (const i of sortedIdx) remaining.splice(i, 1);

    // freeRects نهایی برای نمایش پرتی
    this._cmBuildStripFreeRects(bin, bin.strips, isH, sheetW, sheetH, kerf);

    return placedAny;
  }

  /**
   * ساخت مستطیل‌های آزاد قابل‌چیدن از روی نوارها
   * (انتهای نوار، بالای قطعه کوتاه‌تر، فضای بعد از آخرین نوار)
   */
  _cmBuildStripFreeRects(bin, strips, isH, sheetW, sheetH, kerf) {
    const free = [];
    const minS = 1.0;
    if (!strips || !strips.length) {
      bin.freeRects = [{ x: 0, y: 0, w: sheetW, h: sheetH }];
      return;
    }

    for (const strip of strips) {
      const pieces = (strip.pieces || []).slice().sort((a, b) =>
        isH ? a.x - b.x : a.y - b.y
      );

      // پرتی بالای هر قطعه کوتاه‌تر از ضخامت نوار
      for (const p of pieces) {
        if (isH) {
          const gap = strip.thickness - p.h;
          if (gap >= minS) {
            free.push({ x: p.x, y: p.y + p.h, w: p.w, h: gap });
          }
        } else {
          const gap = strip.thickness - p.w;
          if (gap >= minS) {
            free.push({ x: p.x + p.w, y: p.y, w: gap, h: p.h });
          }
        }
      }

      // انتهای نوار
      if (pieces.length) {
        const last = pieces[pieces.length - 1];
        if (isH) {
          const endX = last.x + last.w;
          const remain = sheetW - endX;
          if (remain >= minS) {
            free.push({ x: endX, y: strip.pos, w: remain, h: strip.thickness });
          }
        } else {
          const endY = last.y + last.h;
          const remain = sheetH - endY;
          if (remain >= minS) {
            free.push({ x: strip.pos, y: endY, w: strip.thickness, h: remain });
          }
        }
      }
    }

    // فضای بعد از آخرین نوار
    const last = strips[strips.length - 1];
    if (isH) {
      const bottom = last.pos + last.thickness;
      const remain = sheetH - bottom;
      if (remain >= minS) {
        free.push({ x: 0, y: bottom, w: sheetW, h: remain });
      }
    } else {
      const right = last.pos + last.thickness;
      const remain = sheetW - right;
      if (remain >= minS) {
        free.push({ x: right, y: 0, w: remain, h: sheetH });
      }
    }

    bin.freeRects = free.filter(r => r.w >= minS && r.h >= minS);
  }

  /**
   * چیدن قطعات باقی‌مانده داخل freeRects با چک هم‌پوشانی
   * placedIdx: Set از ایندکس‌های remaining که قبلاً چیده شده‌اند
   */
  _cmPackIntoFreeRects(bin, remaining, placedIdx, kerf, orientation) {
    let placedAny = false;
    const k = Math.max(0, kerf || 0);
    let guard = 0;

    const overlaps = (x, y, w, h) => {
      const eps = 0.05;
      for (const r of bin.usedRects) {
        if (
          x < r.x + r.w - eps &&
          x + w > r.x + eps &&
          y < r.y + r.h - eps &&
          y + h > r.y + eps
        ) return true;
      }
      return false;
    };

    while (guard++ < 400) {
      if (!bin.freeRects || !bin.freeRects.length) break;

      let best = null; // { ri, idx, o, x, y, score }

      for (let idx = 0; idx < remaining.length; idx++) {
        if (placedIdx.has(idx)) continue;
        const p = remaining[idx];
        const { allowNormal, allowRot } = this._cmAllowOrientations(p, orientation);
        const orients = [];
        if (allowNormal) orients.push({ w: p.w, h: p.h, rot: false });
        if (allowRot && Math.abs(p.w - p.h) > 1e-9) orients.push({ w: p.h, h: p.w, rot: true });
        if (!orients.length) orients.push({ w: p.w, h: p.h, rot: false });

        for (let ri = 0; ri < bin.freeRects.length; ri++) {
          const fr = bin.freeRects[ri];
          for (const o of orients) {
            if (o.w > fr.w + 1e-9 || o.h > fr.h + 1e-9) continue;
            const x = fr.x;
            const y = fr.y;
            if (x + o.w > bin.w + 1e-9 || y + o.h > bin.h + 1e-9) continue;
            if (overlaps(x, y, o.w, o.h)) continue;

            // اول سوراخ‌های وسط ورق را پر کن؛ پرتی لبه ورق دیرتر مصرف شود
            const shortSide = Math.min(fr.w - o.w, fr.h - o.h);
            const touchesRight = fr.x + fr.w >= bin.w - 1.0;
            const touchesBottom = fr.y + fr.h >= bin.h - 1.0;
            const edgePenalty =
              (touchesRight ? 8000 : 0) + (touchesBottom ? 4000 : 0);
            const score =
              edgePenalty +
              fr.x * 20 +
              fr.y * 20 +
              shortSide * 50 +
              (fr.w - o.w) +
              (fr.h - o.h);
            if (!best || score < best.score) {
              best = { ri, idx, o, x, y, score, p };
            }
          }
        }
      }

      if (!best) break;

      // قرار دادن
      bin.usedRects.push({
        x: best.x,
        y: best.y,
        w: best.o.w,
        h: best.o.h,
        label: best.p.label,
        rotated: best.o.rot,
        id: best.p.id
      });
      // اگر داخل یکی از نوارها بود، به pieces همان نوار هم اضافه شود (برای خط برش/پرتی)
      if (bin.strips && bin.strips.length) {
        const isH = (bin.strips[0].dir || 'h') === 'h';
        for (const s of bin.strips) {
          if (isH) {
            if (best.y >= s.pos - 0.2 &&
                best.y + best.o.h <= s.pos + s.thickness + 0.2) {
              s.pieces.push({ x: best.x, y: best.y, w: best.o.w, h: best.o.h });
              break;
            }
          } else {
            if (best.x >= s.pos - 0.2 &&
                best.x + best.o.w <= s.pos + s.thickness + 0.2) {
              s.pieces.push({ x: best.x, y: best.y, w: best.o.w, h: best.o.h });
              break;
            }
          }
        }
      }
      placedIdx.add(best.idx);
      placedAny = true;

      // تقسیم freeRect میزبان (گیلوتین ساده)
      const fr = bin.freeRects[best.ri];
      bin.freeRects.splice(best.ri, 1);
      const pw = best.o.w;
      const ph = best.o.h;
      const rightW = fr.w - pw - k;
      const topH = fr.h - ph - k;

      // انتخاب جهت برش بر اساس فضای باقی‌مانده بزرگ‌تر
      if (rightW * fr.h >= fr.w * topH) {
        if (rightW > 0.5) {
          bin.freeRects.push({ x: fr.x + pw + k, y: fr.y, w: rightW, h: fr.h });
        }
        if (topH > 0.5) {
          bin.freeRects.push({ x: fr.x, y: fr.y + ph + k, w: pw, h: topH });
        }
      } else {
        if (topH > 0.5) {
          bin.freeRects.push({ x: fr.x, y: fr.y + ph + k, w: fr.w, h: topH });
        }
        if (rightW > 0.5) {
          bin.freeRects.push({ x: fr.x + pw + k, y: fr.y, w: rightW, h: ph });
        }
      }

      // پاکسازی freeهای داخل‌هم
      bin.freeRects = bin.freeRects.filter(r => r.w > 0.5 && r.h > 0.5);
    }

    return placedAny;
  }

  /**
   * ساخت خطوط برش — فقط بر اساس لبه قطعات و جای تیغ (kerf)
   * ضخامت نوار در خط برش دخالت ندارد
   */
  _cmBuildCutLines(bin, kerf) {
    const lines = [];
    const eps = 0.15;
    const W = bin.w;
    const H = bin.h;
    const rects = bin.usedRects || [];
    if (!rects.length) return lines;

    // همه لبه‌های افقی و عمودی قطعات
    // خط برش = لبه قطعه (جای تیغ بین دو قطعه مجاور = وسط kerf)
    const hEdges = []; // { pos: y, x1, x2 }
    const vEdges = []; // { pos: x, y1, y2 }

    rects.forEach(r => {
      // لبه بالا و پایین قطعه
      hEdges.push({ pos: r.y, x1: r.x, x2: r.x + r.w });
      hEdges.push({ pos: r.y + r.h, x1: r.x, x2: r.x + r.w });
      // لبه چپ و راست قطعه
      vEdges.push({ pos: r.x, y1: r.y, y2: r.y + r.h });
      vEdges.push({ pos: r.x + r.w, y1: r.y, y2: r.y + r.h });
    });

    // بین دو قطعه مجاور افقی (کنار هم): خط عمودی وسط kerf
    const sortedByY = rects.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    for (let i = 0; i < sortedByY.length; i++) {
      for (let j = i + 1; j < sortedByY.length; j++) {
        const a = sortedByY[i];
        const b = sortedByY[j];
        // هم‌ردیف تقریبی (هم‌پوشانی عمودی)
        const yOverlap = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (yOverlap < eps) continue;
        // b سمت راست a
        const gap = b.x - (a.x + a.w);
        if (gap > -eps && gap < kerf + 1.5) {
          const cutX = a.x + a.w + gap / 2;
          const y1 = Math.max(a.y, b.y);
          const y2 = Math.min(a.y + a.h, b.y + b.h);
          if (y2 - y1 > eps) {
            vEdges.push({ pos: cutX, y1, y2, isKerf: true });
          }
        }
        // a سمت راست b
        const gap2 = a.x - (b.x + b.w);
        if (gap2 > -eps && gap2 < kerf + 1.5) {
          const cutX = b.x + b.w + gap2 / 2;
          const y1 = Math.max(a.y, b.y);
          const y2 = Math.min(a.y + a.h, b.y + b.h);
          if (y2 - y1 > eps) {
            vEdges.push({ pos: cutX, y1, y2, isKerf: true });
          }
        }
      }
    }

    // بین دو قطعه مجاور عمودی (روی هم): خط افقی وسط kerf
    for (let i = 0; i < sortedByY.length; i++) {
      for (let j = i + 1; j < sortedByY.length; j++) {
        const a = sortedByY[i];
        const b = sortedByY[j];
        const xOverlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        if (xOverlap < eps) continue;
        const gap = b.y - (a.y + a.h);
        if (gap > -eps && gap < kerf + 1.5) {
          const cutY = a.y + a.h + gap / 2;
          const x1 = Math.max(a.x, b.x);
          const x2 = Math.min(a.x + a.w, b.x + b.w);
          if (x2 - x1 > eps) {
            hEdges.push({ pos: cutY, x1, x2, isKerf: true });
          }
        }
        const gap2 = a.y - (b.y + b.h);
        if (gap2 > -eps && gap2 < kerf + 1.5) {
          const cutY = b.y + b.h + gap2 / 2;
          const x1 = Math.max(a.x, b.x);
          const x2 = Math.min(a.x + a.w, b.x + b.w);
          if (x2 - x1 > eps) {
            hEdges.push({ pos: cutY, x1, x2, isKerf: true });
          }
        }
      }
    }

    // فقط خطوط kerf بین قطعات را به‌عنوان خط برش ثبت کن
    // (لبه‌های خارجی قطعه همان مرز قطعه‌اند؛ خط تیغ بین دو قطعه مهم است)
    hEdges.filter(e => e.isKerf).forEach(e => {
      lines.push({ type: 'h', pos: e.pos, from: e.x1, to: e.x2, phase: 1 });
    });
    vEdges.filter(e => e.isKerf).forEach(e => {
      lines.push({ type: 'v', pos: e.pos, from: e.y1, to: e.y2, phase: 2 });
    });

    // اگر دو قطعه در یک راستا لبه هم‌تراز دارند و بینشان فاصله kerf است، خط را امتداد بده
    // ادغام خطوط هم‌موقعیت نزدیک
    const mergeColinear = (arr, type) => {
      const groups = {};
      arr.forEach(L => {
        const key = L.pos.toFixed(2);
        if (!groups[key]) groups[key] = [];
        groups[key].push(L);
      });
      const out = [];
      Object.values(groups).forEach(g => {
        g.sort((a, b) => a.from - b.from);
        let cur = { ...g[0] };
        for (let i = 1; i < g.length; i++) {
          const n = g[i];
          if (n.from <= cur.to + kerf + 0.5) {
            cur.to = Math.max(cur.to, n.to);
          } else {
            out.push(cur);
            cur = { ...n };
          }
        }
        out.push(cur);
      });
      return out;
    };

    const hLines = mergeColinear(lines.filter(L => L.type === 'h'), 'h');
    const vLines = mergeColinear(lines.filter(L => L.type === 'v'), 'v');
    const merged = [...hLines, ...vLines];

    // حذف تکراری
    const uniq = [];
    const seen = new Set();
    for (const L of merged) {
      const key = `${L.type}:${L.pos.toFixed(2)}:${L.from.toFixed(2)}:${L.to.toFixed(2)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(L);
    }
    return uniq;
  }

  // ---------- Guillotine بازگشتی (مستطیل آزاد) ----------
  /**
   * گیلوتین صنعتی با درخت برش
   * - قطعه داخل مستطیل آزاد بدون اجبار تیغ روی هر دو ضلع
   * - بعد از قرارگیری: یک برش سراسری → حداکثر دو مستطیل آزاد
   * - فضاهای آزاد دوباره با قطعات کوچک‌تر پر می‌شوند
   * - label و id همیشه روی usedRects حفظ می‌شود
   */
  _cmFillGuillotine(bin, remaining, kerf, orientation) {
    if (!bin.freeRects || bin.freeRects.length === 0) {
      bin.freeRects = [{ x: 0, y: 0, w: bin.w, h: bin.h }];
    }
    bin.cutTree = bin.cutTree || [];

    let placedAny = false;
    let safety = 0;

    while (remaining.length > 0 && safety < 800) {
      safety++;
      let bestIdx = -1;
      let bestNode = null;
      let bestScore = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const piece = remaining[i];
        const node = this._cmFindGuillotineNode(bin.freeRects, piece, kerf, orientation);
        if (!node) continue;
        if (node.score < bestScore) {
          bestScore = node.score;
          bestNode = node;
          bestIdx = i;
        }
      }
      if (bestIdx < 0 || !bestNode) break;

      const piece = remaining[bestIdx];

      // ثبت قطعه با هویت کامل
      bin.usedRects.push({
        x: bestNode.x,
        y: bestNode.y,
        w: bestNode.width,
        h: bestNode.height,
        label: piece.label,
        rotated: !!bestNode.rotated,
        id: piece.id
      });

      bin.cutTree.push({
        id: piece.id,
        label: piece.label,
        x: bestNode.x,
        y: bestNode.y,
        w: bestNode.width,
        h: bestNode.height,
        split: bestNode.splitDir
      });

      this._cmSplitGuillotine(bin.freeRects, bestNode, kerf);
      remaining.splice(bestIdx, 1);
      placedAny = true;
    }

    bin.freeRects = (bin.freeRects || []).filter(r => r.w > 0.5 && r.h > 0.5);
    return placedAny;
  }

  _cmFindGuillotineNode(freeRects, piece, kerf, orientation) {
    const { allowNormal, allowRot } = this._cmAllowOrientations(piece, orientation);
    const candidates = [];
    if (allowNormal) candidates.push({ w: piece.w, h: piece.h, rot: false });
    if (allowRot && Math.abs(piece.w - piece.h) > 1e-9) {
      candidates.push({ w: piece.h, h: piece.w, rot: true });
    }
    if (!candidates.length) {
      candidates.push({ w: piece.w, h: piece.h, rot: false });
    }

    let best = null;
    let bestScore = Infinity;
    const k = Math.max(0, kerf);

    for (let fi = 0; fi < freeRects.length; fi++) {
      const free = freeRects[fi];
      if (!(free.w > 0.5) || !(free.h > 0.5)) continue;

      for (const c of candidates) {
        // جا شدن قطعه — تیغ روی خود قطعه اجباری نیست
        if (c.w > free.w + 1e-9 || c.h > free.h + 1e-9) continue;

        // دو جهت برش گیلوتینی
        for (const splitDir of ['v', 'h']) {
          let remArea = 0;
          if (splitDir === 'v') {
            const rightW = free.w - c.w - k;
            const topH = free.h - c.h - k;
            if (rightW > 0.5) remArea += rightW * free.h;
            if (topH > 0.5) remArea += c.w * topH;
          } else {
            const topH = free.h - c.h - k;
            const rightW = free.w - c.w - k;
            if (topH > 0.5) remArea += free.w * topH;
            if (rightW > 0.5) remArea += rightW * c.h;
          }

          // مثل OptiCut: از گوشه بالا-چپ پر کن، پرتی یکجا سمت راست/پایین بماند
          const shortSide = Math.min(free.w - c.w, free.h - c.h);
          const longSide = Math.max(free.w - c.w, free.h - c.h);
          let rightRem = 0, bottomRem = 0;
          if (splitDir === 'v') {
            rightRem = Math.max(0, free.w - c.w - k);
            bottomRem = Math.max(0, free.h - c.h - k);
          } else {
            bottomRem = Math.max(0, free.h - c.h - k);
            rightRem = Math.max(0, free.w - c.w - k);
          }
          // پاداش برای باقی‌مانده بزرگ یکسره (ترجیحاً سمت راست)
          const edgeBonus = -(rightRem * free.h * 0.02 + bottomRem * free.w * 0.01);
          const score =
            free.x * 40 +
            free.y * 40 +
            shortSide * 80 +
            longSide * 0.5 +
            edgeBonus +
            fi * 0.0001;

          if (score < bestScore) {
            bestScore = score;
            best = {
              x: free.x,
              y: free.y,
              width: c.w,
              height: c.h,
              rotated: c.rot,
              score,
              splitDir,
              freeIndex: fi,
              freeRef: { x: free.x, y: free.y, w: free.w, h: free.h }
            };
          }
        }
      }
    }
    return best;
  }

  /**
   * تقسیم گیلوتینی واقعی: یک برش سراسری روی free → حداکثر دو مستطیل
   */
  _cmSplitGuillotine(freeRects, used, kerf) {
    const k = Math.max(0, kerf || 0);
    let idx = -1;

    if (typeof used.freeIndex === 'number' &&
        used.freeIndex >= 0 &&
        used.freeIndex < freeRects.length) {
      const f = freeRects[used.freeIndex];
      if (f &&
          Math.abs(f.x - used.freeRef.x) < 1e-6 &&
          Math.abs(f.y - used.freeRef.y) < 1e-6 &&
          Math.abs(f.w - used.freeRef.w) < 1e-6) {
        idx = used.freeIndex;
      }
    }

    if (idx < 0) {
      for (let i = 0; i < freeRects.length; i++) {
        const f = freeRects[i];
        if (
          used.x >= f.x - 1e-9 &&
          used.y >= f.y - 1e-9 &&
          used.x + used.width <= f.x + f.w + 1e-9 &&
          used.y + used.height <= f.y + f.h + 1e-9
        ) {
          idx = i;
          break;
        }
      }
    }
    if (idx < 0) return;

    const f = freeRects[idx];
    freeRects.splice(idx, 1);

    const pw = used.width;
    const ph = used.height;
    const sd = used.splitDir || 'v';

    if (sd === 'v') {
      // برش عمودی سراسری روی کل ارتفاع free
      const rightX = used.x + pw + k;
      const rightW = f.x + f.w - rightX;
      if (rightW > 0.5) {
        freeRects.push({ x: rightX, y: f.y, w: rightW, h: f.h });
      }
      // بالای قطعه در ستون چپ
      const topY = used.y + ph + k;
      const topH = f.y + f.h - topY;
      if (topH > 0.5) {
        freeRects.push({ x: used.x, y: topY, w: pw, h: topH });
      }
    } else {
      // برش افقی سراسری روی کل عرض free
      const topY = used.y + ph + k;
      const topH = f.y + f.h - topY;
      if (topH > 0.5) {
        freeRects.push({ x: f.x, y: topY, w: f.w, h: topH });
      }
      // راست قطعه در ردیف پایین
      const rightX = used.x + pw + k;
      const rightW = f.x + f.w - rightX;
      if (rightW > 0.5) {
        freeRects.push({ x: rightX, y: used.y, w: rightW, h: ph });
      }
    }

    // حذف مستطیل‌های داخل‌هم
    const cleaned = freeRects.filter(r => r.w > 0.5 && r.h > 0.5);
    freeRects.length = 0;
    for (let i = 0; i < cleaned.length; i++) {
      let contained = false;
      for (let j = 0; j < cleaned.length; j++) {
        if (i !== j && this._cmIsContained(cleaned[i], cleaned[j])) {
          contained = true;
          break;
        }
      }
      if (!contained) freeRects.push(cleaned[i]);
    }
  }

  _cmIsContained(inner, outer) {
    return inner.x >= outer.x - 1e-9 &&
           inner.y >= outer.y - 1e-9 &&
           inner.x + inner.w <= outer.x + outer.w + 1e-9 &&
           inner.y + inner.h <= outer.y + outer.h + 1e-9;
  }

  // ---------- Shelf FFDH (گیلوتین سطح ۱) ----------
  _cmFillShelf(bin, remaining, kerf, orientation) {
    // همان strip-h با مرتب‌سازی ارتفاع
    return this._cmFillStrip(bin, remaining, kerf, orientation, 'h');
  }

  // سازگاری با کدهای قدیمی
  findNode(freeRects, w, h, currentTabType, originalPieceData) {
    return this._cmFindGuillotineNode(
      freeRects,
      { w, h, rotation: originalPieceData ? originalPieceData.rotation : 'none' },
      this.config.kerf || 0.4,
      this.config.orientation || 'free'
    );
  }

  executeMaximalSplit(freeRects, usedNode) {
    this._cmSplitGuillotine(freeRects, usedNode);
  }

  calculatePlacementScore(free, placedW, placedH, isRotated, orientation) {
    const shortSide = Math.min(free.w - placedW, free.h - placedH);
    return { distance: free.x + free.y, shortSide, finalScore: shortSide };
  }

  isContained(inner, outer) {
    return this._cmIsContained(inner, outer);
  }

    renderActiveTab() {
        const type = this.state.activeTab;
        const container = document.getElementById(`${type}-cut-preview`);
        if (!container) return;

        const resultData = this.state.results[type] || { bins: [], failedPieces: [] };
        const bins = resultData.bins || [];
        const failedPieces = resultData.failedPieces || [];
        container.innerHTML = '';

        if (failedPieces.length > 0) {
            const errorWrapper = document.createElement('div');
            errorWrapper.style.cssText = "background-color: #fef2f2; border: 1px solid #fee2e2; border-right: 5px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: right;";
            
            let errorHTML = `<h4 style="color:#991b1b; margin-top:0; margin-bottom:10px; font-family:Tahoma;">⚠️ لیست قطعات چیده نشده (جا نشده در پروژه):</h4><ul style="margin:0; padding-right:20px; color:#b91c1c; font-size:13px; line-height:1.8;">`;
            failedPieces.forEach(item => {
                errorHTML += `<li><strong>${item.label}</strong> (${item.w.toFixed(1)} × ${item.h.toFixed(1)}): <span style="color:#451a03">${item.reason}</span></li>`;
            });
            errorHTML += `</ul>`;
            errorWrapper.innerHTML = errorHTML;
            container.appendChild(errorWrapper);
        }

        if (bins.length === 0 && failedPieces.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:40px; color:#aaa;">قطعه‌ای برای محاسبه وجود ندارد</div>`;
            return;
        }
        
        const totalSheets = bins.length;
        const firstRow = document.getElementById(`sheets-list-container-${type}`)?.querySelector('.sheet-item-row');
        const currentW = firstRow ? (firstRow.querySelector('.sheet-w')?.value || '0') : '0';
        const currentH = firstRow ? (firstRow.querySelector('.sheet-h')?.value || '0') : '0';

        const summary = document.createElement('div');
        summary.className = 'cut-summary';
        summary.innerHTML = `
            <div style="background: linear-gradient(45deg, #2196F3, #21CBF3); color:white; padding:15px; border-radius:12px; margin-bottom:20px; box-shadow:0 4px 15px rgba(33,150,243,0.3); display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="font-size:1.4em; font-weight:bold;">${totalSheets}</span> ورق
                    <span style="opacity:0.9; font-size:0.9em; margin-right:5px;">(${currentW}×${currentH})</span>
                </div>
                <div style="font-size:0.9em; opacity:0.9;">ضخامت تیغه: ${(this.config.kerf * 10).toFixed(1)} میل</div>
            </div>
        `;
        container.appendChild(summary);

        bins.forEach((bin, index) => {
            const smallView = this.createSheetCanvas(bin, index + 1, 420, true);
            container.appendChild(smallView.wrapper);
            smallView.canvas.addEventListener('click', () => {
                this.showZoomModal(bin, index + 1);
            });
        });
    }

      createSheetCanvas(bin, index, maxAllowedWidth = 420, isClickable = false) { 
    const wrapper = document.createElement('div');
    wrapper.style.cssText = "margin-bottom: 30px; text-align: center; max-width: 100%; overflow-x: hidden;";
    if (isClickable) wrapper.style.cursor = 'pointer'; 

    const canvas = document.createElement('canvas');
    const scaleFactor = 2;
    const availableWidth = window.innerWidth - 100; 
    const displayWidth = Math.min(availableWidth, maxAllowedWidth);
    const aspectRatio = bin.w / bin.h;
    const displayHeight = displayWidth / aspectRatio;

    canvas.width = displayWidth * scaleFactor;
    canvas.height = displayHeight * scaleFactor;
    canvas.style.cssText = `width: ${displayWidth}px; max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); margin: 0 auto;`;

    const ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);

    const drawScale = displayWidth / bin.w;
    const padding = 5; 
    const dimFontSize = 10; 

    // 🟢 تابع هوشمند و بازنویسی‌شده رندر متریال و قطعات روی بوم
    const drawEverything = () => {
        // ۱. ابتدا بوم را کاملاً پاک می‌کنیم تا در دابل رندر کثیف کاری نشود
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // ۲. رندر پس‌زمینه (رنگ ساده یا تکسچر پترن چوب)
        if (bin.colorTexture) {
            const img = new Image();
            img.src = bin.colorTexture;
            
            // قفل کردن منطق رندر به رویداد لود شدن کامل تصویر
            img.onload = () => {
                renderTextureAndComponents(img);
            };
            // اگر تصویر از قبل در مموری لود شده باشد (مخصوصاً در زوم مودال)
            if (img.complete) {
                renderTextureAndComponents(img);
            }
        } else {
            // اگر تکسچر نبود، رنگ ساده بک‌گراند رندر می‌شود
            ctx.fillStyle = bin.colorHex || '#ffffff';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            renderComponentsOnly();
        }
    };

    // 🔄 موتور فرعی رندر پترن + قطعات (پس از اطمینان از لود تصویر)
        // 🔄 موتور فرعی رندر پترن + قطعات (پس از اطمینان از لود تصویر)
    const renderTextureAndComponents = (img) => {
        try {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // تعیین ابعاد بر اساس نوع متریال برای حفظ جهت درست راه چوب
            if (bin.material === 'countertop') {
                tempCanvas.width = img.width || 100;
                tempCanvas.height = img.height || 100;
                // برای صفحه کابینت نیازی به چرخش نیست، مستقیم ترسیم می‌شود تا راه افقی حفظ شود
                tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            } else {
                tempCanvas.width = img.height || 100;
                tempCanvas.height = img.width || 100;
                tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                tempCtx.rotate(Math.PI / 2); // عمودی کردن راه چوب مخصوص درب و بدنه
                tempCtx.drawImage(img, -img.width / 2, -img.height / 2);
            }
            
            if (img.width && img.height) {
                const pattern = ctx.createPattern(tempCanvas, 'repeat');
                if (pattern) {
                    const matrix = new DOMMatrix();
                    const scaleX = (displayWidth * scaleFactor) / tempCanvas.width;
                    const scaleY = (displayHeight * scaleFactor) / tempCanvas.height;
                    
                    matrix.scaleSelf(scaleX, scaleY);
                    pattern.setTransform(matrix);
                    ctx.save();
                    ctx.setTransform(1, 0, 0, 1, 0, 0); 
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0, 0, displayWidth * scaleFactor, displayHeight * scaleFactor);
                    ctx.restore();
                }
            }
        } catch(e) { 
            console.log("خطا در اعمال تکسچر کانواس، استفاده از رنگ ساده...", e);
            ctx.fillStyle = bin.colorHex || '#ffffff';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
        }
        
        // حالا که تکسچر با موفقیت زیرسازی شد، قطعات را روی آن می‌چینیم
        renderComponentsOnly();
    };


    // 📐 موتور رندر خطوط، ابعاد قطعات و ضایعات
    const renderComponentsOnly = () => {
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, displayWidth, displayHeight);

        // رندر قطعات مصرفی پروژه
        bin.usedRects.forEach(rect => {
            const rx = rect.x * drawScale;
            const ry = rect.y * drawScale;
            const rw = rect.w * drawScale;
            const rh = rect.h * drawScale;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'; // کمی شفافیت بیشتر برای دید بهتر راه چوب زیر قطعه
            ctx.fillRect(rx, ry, rw, rh);
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(rx, ry, rw, rh);

            if (rect.rotated && rw > 40) {
                ctx.fillStyle = '#000000';
                ctx.font = `bold 10px Arial`;
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText("↻", rx + rw - 3, ry + 3);
            }

            // ابعاد روی ضلع‌ها: طول روی لبه بالا، عرض روی لبه چپ
            // حتی قطعات خیلی کوچک (۵–۷ سانتی) هم نمایش داده می‌شوند
            const dimW = rect.w.toFixed(1);
            const dimH = rect.h.toFixed(1);
            const edgeFont = Math.max(7, Math.min(dimFontSize, Math.min(rw, rh) * 0.35));

            ctx.fillStyle = '#0f172a';
            ctx.shadowColor = 'rgba(255,255,255,0.95)';
            ctx.shadowBlur = 3;
            ctx.font = `bold ${edgeFont}px Arial, Tahoma`;

            // عدد طول وسط لبه بالا (حتی قطعات باریک)
            if (rw > 10) {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(dimW, rx + rw / 2, ry + 1);
            }

            // عدد عرض وسط لبه چپ — عمودی (حتی ارتفاع ۵–۷ سانتی)
            if (rh > 10) {
                ctx.save();
                ctx.translate(rx + 1, ry + rh / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(dimH, 0, 0);
                ctx.restore();
            } else if (rh > 4 && rw > 18) {
                // قطعات خیلی کوتاه: عدد عرض را کنار عدد طول، داخل قطعه بنویس
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `bold ${Math.max(7, edgeFont - 1)}px Arial, Tahoma`;
                ctx.fillText(`${dimW}×${dimH}`, rx + rw / 2, ry + rh / 2);
            }

            ctx.shadowBlur = 0;
        });
        
        // رندر پرتی — یک تکه تمیز (بدون هاشور خط‌در‌خط)
        bin.freeRects.forEach(waste => {
            if (waste.w < 0.8 || waste.h < 0.8) return;
            const wx = waste.x * drawScale;
            const wy = waste.y * drawScale;
            const ww = waste.w * drawScale;
            const wh = waste.h * drawScale;

            ctx.fillStyle = 'rgba(251, 113, 133, 0.38)';
            ctx.fillRect(wx, wy, ww, wh);
            ctx.strokeStyle = 'rgba(190, 24, 93, 0.75)';
            ctx.lineWidth = 1.25;
            ctx.strokeRect(wx, wy, ww, wh);

            // فقط روی پرتی‌های بزرگ‌تر برچسب
            if (ww > 32 && wh > 18) {
                ctx.fillStyle = '#9f1239';
                ctx.font = 'bold 9px Tahoma';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('پرتی', wx + ww / 2, wy + wh / 2 - 6);
                ctx.fillText(
                    `${waste.w.toFixed(1)}×${waste.h.toFixed(1)}`,
                    wx + ww / 2,
                    wy + wh / 2 + 6
                );
            } else if (ww > 22 && wh > 12) {
                ctx.fillStyle = '#9f1239';
                ctx.font = 'bold 8px Tahoma';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    `${waste.w.toFixed(0)}×${waste.h.toFixed(0)}`,
                    wx + ww / 2,
                    wy + wh / 2
                );
            }
        });

        // ✂️ رندر خطوط برش گیلوتینی دستگاه (فاز ۱ سراسری / فاز ۲ داخلی نوار)
        if (bin.cutLines && bin.cutLines.length > 0) {
            const kerfPx = Math.max(1.5, (this.config.kerf || 0.4) * drawScale);
            bin.cutLines.forEach(line => {
                ctx.save();
                ctx.setLineDash([]);
                // نوار تیره = جای تیغ برش (نه پرتی)
                if (line.type === 'h') {
                    const y = line.pos * drawScale;
                    const x1 = line.from * drawScale;
                    const x2 = line.to * drawScale;
                    ctx.fillStyle = 'rgba(51, 65, 85, 0.85)';
                    ctx.fillRect(x1, y - kerfPx / 2, Math.max(0, x2 - x1), kerfPx);
                } else {
                    const x = line.pos * drawScale;
                    const y1 = line.from * drawScale;
                    const y2 = line.to * drawScale;
                    ctx.fillStyle = 'rgba(51, 65, 85, 0.85)';
                    ctx.fillRect(x - kerfPx / 2, y1, kerfPx, Math.max(0, y2 - y1));
                }
                ctx.restore();
            });
        }

        // رندر خط‌کش و ابعاد کلی ورق اصلی در حاشیه بوم
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#475569';
        ctx.fillStyle = '#1e293b';
        ctx.lineWidth = 1;

        if (displayWidth > 100) {
            const offset = 15; 
            ctx.font = `bold 11px Tahoma`;
            ctx.textAlign = 'center';
            ctx.fillText(bin.w.toFixed(1), displayWidth / 2, displayHeight + offset);
        }

        if (displayHeight > 100) {
             const offset = 15; 
             ctx.font = `bold 11px Tahoma`;
             ctx.textAlign = 'center';
             ctx.save();
             ctx.translate(-offset, displayHeight / 2);
             ctx.rotate(-Math.PI / 2); 
             ctx.fillText(bin.h.toFixed(1), 0, 0); 
             ctx.restore();
        }
    };

    // 🚀 شلیک به موتور رسم بوم
    drawEverything();

    // تنظیمات متنی زیر ورق
    const materialMap = {
        'mdf': 'ام‌دی‌اف (MDF)',
        'leteron': 'لترون',
        'highGloss': 'هایگلاس',
        'countertop': 'صفحه کابینت',
        'backsplash': 'ماربل شیت',
        'PVC': 'پی‌وی‌سی (PVC)'
    };
    const displayMatName = materialMap[bin.material] || bin.material || 'نامشخص';

    const label = document.createElement('div');
    const usedArea = bin.usedRects.reduce((acc, r) => acc + (r.w * r.h), 0);
    const totalArea = bin.w * bin.h;
    const efficiency = ((usedArea / totalArea) * 100).toFixed(1);

    label.innerHTML = `
        <div style="margin-top:8px; font-weight:bold; color:#cbd5e1; font-size: 0.9em; direction: rtl;">
            ورق شماره ${index}: <span style="color:#38bdf8;">[${displayMatName} - ${bin.colorName}]</span> 
            <span style="font-weight:normal; font-size:0.95em; color:${efficiency > 80 ? '#4ade80' : '#fb923c'}">
                (راندمان: ${efficiency}%)
            </span>
        </div>
    `;
    
    wrapper.appendChild(canvas);
    if (!maxAllowedWidth || maxAllowedWidth < 500) { 
         wrapper.appendChild(label);
    }
    return { wrapper, canvas };
}

    /**
     * رندر و استخراج قطعات تفکیک شده با پترن هماهنگ و چرخیده شده ورق مادر
     */
renderIsolatedPieces() {
    this.setupIsolatedPiecesModalDOM();
    const grid = document.getElementById('isolated-pieces-grid');
    if (!grid) return;
    
    const type = this.state.activeTab; 
    const resultData = this.state.results[type];
    
    if (!resultData || !resultData.bins || resultData.bins.length === 0) {
        grid.innerHTML = '<div style="color: #ef4444; text-align:center; grid-column: 1/-1; padding:20px;">ابتدا باید دکمه «محاسبه چی» را بزنید!</div>';
        return;
    }

    grid.innerHTML = ''; 

    resultData.bins.forEach((bin, binIdx) => {
        bin.usedRects.forEach((rect) => {
            if (!rect.label) return;
            const cleanLabel = rect.label.replace('📌', '').trim();

            const card = document.createElement('div');
            card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);";
            
            const info = document.createElement('div');
            info.style.cssText = "width: 100%; font-size: 12px; margin-bottom: 10px; direction: rtl; border-bottom: 1px solid #334155; padding-bottom: 5px;";
            info.innerHTML = `
                <div style="font-weight:bold; color:#f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">📌 ${cleanLabel}</div>
                <div style="color:#64748b; font-size:11px; margin-top:3px;">ورق ${binIdx + 1} | ابعاد: ${rect.w.toFixed(1)} × ${rect.h.toFixed(1)}</div>
            `;
            card.appendChild(info);

            const imgPreview = new Image();
            imgPreview.style.cssText = "max-width: 100%; max-height: 120px; background: #0f172a; border-radius: 6px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); object-fit: contain;";
            
            if (window.isolatedDoorTextures && window.isolatedDoorTextures[cleanLabel]) {
                imgPreview.src = window.isolatedDoorTextures[cleanLabel];
            } else {
                imgPreview.style.width = "60px"; imgPreview.style.height = "60px";
                imgPreview.style.backgroundColor = bin.colorHex || '#ffffff';
            }

            card.appendChild(imgPreview);
            grid.appendChild(card);
        });
    });
}





}

// راه‌اندازی اتوماتیک کلاس در سند
document.addEventListener('DOMContentLoaded', () => {
    window.cutPanel = new CutPanel();
});

// توابع راه‌اندازی دکمه‌ها و خروجی اکسل
function optimizeCuts() {
    if (window.cutPanel) {
        window.cutPanel.optimizeAll();
    } else if (typeof CutPanel !== 'undefined') {
        window.cutPanel = new CutPanel();
        window.cutPanel.optimizeAll();
    }
}

function exportCutMasterFile() {
    if (typeof collectPieces !== 'function') return;
    const pieces = collectPieces();
    let csvContent = "tool,arz,tedad,toole navar,arze navar\n";

    const addCsvRow = (length, width, count) => {
        let tool = Number(length).toFixed(1);
        let arz = Number(width).toFixed(1);
        return `${tool},${arz},${count},${tool},${arz}\n`;
    };

['sheet', 'door', 'fiber', 'pvc', 'countertop'].forEach(type => {
    if (pieces[type]) pieces[type].forEach(p => { csvContent += addCsvRow(p.w, p.h, p.count); });
});

    const BOM = "\uFEFF"; 
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.getElementById("hidden-excel-download-link") || document.createElement("a");
    const dateStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `OptiCut_Layout_${dateStr}.csv`);
    
    if (!document.getElementById("hidden-excel-download-link")) {
        link.id = "hidden-excel-download-link";
        document.body.appendChild(link);
    }
    link.click();
}

function switchMainMode(mode) {
    document.querySelectorAll('.mode-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.main-mode-content').forEach(content => content.classList.remove('active'));
    
    if (mode === 'layout') {
        document.querySelector(".mode-tab-btn[onclick*='layout']").classList.add('active');
        document.getElementById('main-mode-layout').classList.add('active');
    } else if (mode === 'settings') {
        document.querySelector(".mode-tab-btn[onclick*='settings']").classList.add('active');
        document.getElementById('main-mode-settings').classList.add('active');
    }
}

function switchSettingsSubTab(subTabId) {
    document.querySelectorAll('.settings-tab-content').forEach(el => el.classList.remove('active'));
    const activeContent = document.getElementById(`subtab-${subTabId}`);
    if (activeContent) activeContent.classList.add('active');
    
    document.querySelectorAll('.settings-subtabs .tab-btn').forEach(btn => {
        if(btn.getAttribute('onclick').includes(subTabId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function toggleUnlimitedSheet(type) {
    const checkbox = document.getElementById(`sheet-${type}-unlimited`);
    const countInput = document.getElementById(`sheet-${type}-count`);
    if (!checkbox || !countInput) return;
    
    const countBox = countInput.parentElement;
    if (checkbox.checked) {
        if(countBox) countBox.classList.add('disabled');
        countInput.disabled = true;
        countInput.setAttribute('data-old-val', countInput.value || '1');
        countInput.value = '∞';     
    } else {
        if(countBox) countBox.classList.remove('disabled');
        countInput.disabled = false;
        const oldVal = countInput.getAttribute('data-old-val');
        countInput.value = (oldVal && oldVal !== '∞') ? oldVal : '1';
    }
    if (window.cutPanel) window.cutPanel.optimizeAll();
}

document.addEventListener("DOMContentLoaded", () => {
    ['sheet', 'door', 'fiber', 'pvc', 'countertop'].forEach(type => { // 🌟 countertop اضافه شد
        const selectEl = document.getElementById(`sheet-${type}-size`);
        if (selectEl) selectEl.addEventListener('change', updateAccordionMetaBadges);
    });
});


// تابع کمکی جهانی برای باز کردن مودال کارگاه تیکه‌تیکه‌سازی قطعات
function openIsolatedPiecesModal() {
    if (window.cutPanel) {
        // ۱. اول اجرای موتور برش قطعات
        window.cutPanel.renderIsolatedPieces();
        // ۲. باز کردن و نمایش مودال روی صفحه
        const modal = document.getElementById('isolated-pieces-modal');
        if (modal) modal.style.display = 'block';
    } else {
        alert("سیستم کات‌مستر هنوز آمادگی کامل ندارد. لطفاً مجدداً تلاش کنید.");
    }
}
