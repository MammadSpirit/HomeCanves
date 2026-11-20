// متغیر سراسری برای نگه داشتن وضعیت نمای فعلی
let currentActiveView = '2d';

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('view-toggle-btn');

    // تابع اصلی برای مدیریت سوییچ بین ۴ حالت (2D / Elev / 3D / Babylon)
    function switchView(viewMode) {
        if (!toggleBtn) return;

        // قبل از عوض کردن وضعیت، ببین از Babylon خارج می‌شویم یا نه
        const prevView = currentActiveView;
        const leavingBabylon = (prevView === 'babylon') ||
            (typeof KitchenBabylon !== 'undefined' && KitchenBabylon.isReady);

        // ۱. تغییر اتریبیوت کپسول برای جابجا شدن اسلایدر متحرک در CSS
        toggleBtn.setAttribute('data-view', viewMode);
        currentActiveView = viewMode;

        // گرفتن دکمه‌های داخل کپسول
        const btn2D = document.getElementById('text-2d');
        const btnElev = document.getElementById('text-elev');
        const btn3D = document.getElementById('text-3d');
        const btnBabylon = document.getElementById('text-babylon');

        // ۲. مدیریت کلاس active روی متن دکمه‌ها
        [btn2D, btnElev, btn3D, btnBabylon].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        // برای babylon آیدی دکمه text-babylon است
        const activeId = viewMode === 'babylon' ? 'text-babylon' : `text-${viewMode}`;
        const activeText = document.getElementById(activeId);
        if (activeText) activeText.classList.add('active');

        // کانتینرهای اصلی نماها
        const container2D = document.getElementById('canvas-wrapper');
        const containerElev = document.getElementById('elev-view-container');
        const container3D = document.getElementById('modal-3d-container');
        const containerBabylon = document.getElementById('modal-babylon-container');

        // کنترل‌های تولبار
        const toolbar2DControls = document.getElementById('toolbar-2d-controls');
        const toolbar3DControls = document.getElementById('toolbar-3d-controls');
        const toolbarElevControls = document.getElementById('toolbar-elev-controls');

        // دکمه‌ها و کنترلهای بالای هدر
        const floorLayerControls = document.getElementById('floor-layer-controls');
        const elevWallControls = document.getElementById('elev-wall-controls');
        const mainLockBtn = document.getElementById('toolbar-lock-btn');

        // بستن موتورهای ۳بعدی — اول Babylon کامل آزاد شود تا WebGL برای Three خراب نشود
        if (viewMode !== '3d' && typeof Kitchen3D !== 'undefined' && Kitchen3D.close) {
            Kitchen3D.close();
        }
        if (viewMode !== 'babylon' && typeof KitchenBabylon !== 'undefined' && KitchenBabylon.close) {
            // فقط هنگام رفتن به Three، context را آزاد کن؛ بقیه فقط dispose معمولی
            KitchenBabylon.close({ loseContext: (viewMode === '3d') });
        }

        // تاخیر کوتاه بعد از بستن Babylon تا GPU برای Three آزاد شود
        const openDelay = leavingBabylon && viewMode === '3d' ? 180 : 0;

        // ۳. تغییر کانتینرها و کنترل‌های تولبار بر اساس نمای انتخاب شده
        if (viewMode === '2d') {
            if (floorLayerControls) floorLayerControls.style.display = 'flex';
            if (elevWallControls) elevWallControls.style.display = 'none';

            if (container3D) container3D.style.display = 'none';
            if (containerBabylon) containerBabylon.style.display = 'none';
            if (containerElev) containerElev.style.display = 'none';
            if (container2D) container2D.style.display = 'flex';

            if (mainLockBtn) mainLockBtn.style.display = 'block';
            if (toolbar3DControls) toolbar3DControls.style.display = 'none';
            if (toolbarElevControls) toolbarElevControls.style.display = 'none';
            if (toolbar2DControls) toolbar2DControls.style.display = 'flex';

            if (typeof updateToolbarPositionInputs === 'function') updateToolbarPositionInputs();
            if (typeof draw === 'function') draw();

        } else if (viewMode === 'elev') {
            if (floorLayerControls) floorLayerControls.style.display = 'none';
            if (elevWallControls) elevWallControls.style.display = 'flex';

            if (container2D) container2D.style.display = 'none';
            if (container3D) container3D.style.display = 'none';
            if (containerBabylon) containerBabylon.style.display = 'none';
            if (containerElev) containerElev.style.display = 'flex';

            if (mainLockBtn) mainLockBtn.style.display = 'none';
            if (toolbar3DControls) toolbar3DControls.style.display = 'none';
            if (toolbar2DControls) toolbar2DControls.style.display = 'none';
            
            if (toolbarElevControls) {
                toolbarElevControls.style.setProperty('display', 'flex', 'important');
            }

            if (typeof initElevCanvas === 'function') {
                initElevCanvas();
            } else if (typeof drawFrontElevation === 'function') {
                drawFrontElevation();
            }

            if (typeof updateElevToolbarInputs === 'function') updateElevToolbarInputs();

        } else if (viewMode === '3d') {
            if (floorLayerControls) floorLayerControls.style.display = 'none';
            if (elevWallControls) elevWallControls.style.display = 'none';

            if (container2D) container2D.style.display = 'none';
            if (containerElev) containerElev.style.display = 'none';
            if (containerBabylon) containerBabylon.style.display = 'none';
            if (container3D) container3D.style.display = 'flex';

            if (mainLockBtn) mainLockBtn.style.display = 'none';
            if (toolbar2DControls) toolbar2DControls.style.display = 'none';
            if (toolbarElevControls) toolbarElevControls.style.display = 'none';
            if (toolbar3DControls) toolbar3DControls.style.display = 'flex';

            // بعد از آزادسازی context بابیلون، با تاخیر کوتاه Three را باز کن
            setTimeout(function () {
                if (typeof Kitchen3D !== 'undefined' && Kitchen3D.open) {
                    Kitchen3D.open();
                } else if (typeof loadModal3D === 'function') {
                    loadModal3D();
                }
            }, openDelay);

        } else if (viewMode === 'babylon') {
            if (floorLayerControls) floorLayerControls.style.display = 'none';
            if (elevWallControls) elevWallControls.style.display = 'none';

            if (container2D) container2D.style.display = 'none';
            if (containerElev) containerElev.style.display = 'none';
            if (container3D) container3D.style.display = 'none';
            if (containerBabylon) {
                containerBabylon.style.display = 'flex';
                containerBabylon.style.visibility = 'visible';
                containerBabylon.style.opacity = '1';
            }

            if (mainLockBtn) mainLockBtn.style.display = 'none';
            if (toolbar2DControls) toolbar2DControls.style.display = 'none';
            if (toolbarElevControls) toolbarElevControls.style.display = 'none';
            if (toolbar3DControls) toolbar3DControls.style.display = 'flex';

            // فقط یک بار open — retry داخلی KitchenBabylon خودش مدیریت می‌شود
            setTimeout(function () {
                if (typeof KitchenBabylon !== 'undefined' && KitchenBabylon.open) {
                    KitchenBabylon.open();
                }
            }, 80);
        }
    }

    // اتصال رویدادهای کلیک به تک‌تک گزینه‌ها
    const btn2D = document.getElementById('text-2d');
    const btnElev = document.getElementById('text-elev');
    const btn3D = document.getElementById('text-3d');
    const btnBabylon = document.getElementById('text-babylon');

    if (btn2D) {
        btn2D.addEventListener('click', (e) => {
            e.stopPropagation();
            switchView('2d');
        });
    }

    if (btnElev) {
        btnElev.addEventListener('click', (e) => {
            e.stopPropagation();
            switchView('elev');
        });
    }

    if (btnBabylon) {
        btnBabylon.addEventListener('click', (e) => {
            e.stopPropagation();
            switchView('babylon');
        });
    }

    window.forceSwitchView = switchView;
});
