/**
 * مدیریت رنگ‌ها — اعمال گروهی رنگ/جنس/پرداخت
 * روی همه یونیت‌ها؛ هر یونیت بعداً از پنل خودش قابل تغییر است.
 */

window.colorManagerState = {
    door: { material: 'mdf', colorValue: '', colorName: '', finish: 'matte' },
    crown: { material: 'mdf', colorValue: '', colorName: '', finish: 'matte' },
    kickboard: { material: 'mdf', colorValue: '', colorName: '', finish: 'matte' },
    hiddenHandle: { material: 'mdf', colorValue: '', colorName: '', finish: 'matte' }
};

const CM_TITLES = {
    door: 'انتخاب رنگ درب',
    crown: 'انتخاب رنگ تاج',
    kickboard: 'انتخاب رنگ پاخور',
    hiddenHandle: 'انتخاب رنگ دستگیره مخفی'
};

function cmReadSection(section) {
    const matEl = document.getElementById('cm-' + section + '-material');
    const finishEl = document.getElementById('cm-' + section + '-finish');
    const colorEl = document.getElementById('cm-' + section + '-color');
    const st = window.colorManagerState[section] || {};
    return {
        material: matEl ? matEl.value : (st.material || 'mdf'),
        finish: finishEl ? finishEl.value : (st.finish || 'matte'),
        colorValue: (colorEl && colorEl.dataset.selectedValue) || st.colorValue || '',
        colorName: (colorEl && colorEl.value) || st.colorName || ''
    };
}

function cmWriteColorInput(section, colorName, colorValue) {
    const el = document.getElementById('cm-' + section + '-color');
    if (!el) return;
    el.value = colorName || '';
    el.dataset.selectedValue = colorValue || '';
    if (window.colorManagerState[section]) {
        window.colorManagerState[section].colorName = colorName || '';
        window.colorManagerState[section].colorValue = colorValue || '';
    }
}

window.cmOnMaterialChange = function(section, value) {
    if (window.colorManagerState[section]) {
        window.colorManagerState[section].material = value;
    }
    // با عوض شدن جنس، رنگ قبلی را خالی می‌کنیم تا اشتباه اعمال نشود
    cmWriteColorInput(section, '', '');
};

window.cmOpenColorPicker = function(section) {
    const matEl = document.getElementById('cm-' + section + '-material');
    const category = matEl ? matEl.value : 'mdf';
    if (typeof openUniversalModal !== 'function') {
        alert('سیستم انتخاب متریال در دسترس نیست.');
        return;
    }
    openUniversalModal(CM_TITLES[section] || 'انتخاب رنگ', category, function(item) {
        if (!item) return;
        const colorValue = item.texture || item.code || '#ffffff';
        const colorName = item.name || 'انتخاب شده';
        cmWriteColorInput(section, colorName, colorValue);
        if (window.colorManagerState[section]) {
            window.colorManagerState[section].material = category;
        }
    });
};

function cmIsTextureValue(val) {
    if (!val || typeof val !== 'string') return false;
    return val.indexOf('http') === 0 || val.indexOf('/') >= 0 || val.indexOf('data:') === 0 ||
        /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(val);
}

function cmApplyDoorColor(cfg) {
    if (typeof cabinets === 'undefined' || !Array.isArray(cabinets)) return 0;
    let n = 0;
    cabinets.forEach(c => {
        if (!c) return;
        // لوازم مستقل بدون درب کابینتی را رد می‌کنیم
        if (c.isFridge || c.isWashingMachine || c.isDishwasher || c.isHood) return;

        c.doorMaterial = cfg.material;
        c.doorFinish = cfg.finish;
        c.doorColorName = cfg.colorName;

        if (cmIsTextureValue(cfg.colorValue)) {
            c.doorTexture = cfg.colorValue;
            c.doorColor = null;
        } else {
            c.doorColor = cfg.colorValue || c.doorColor || '#FFFFFF';
            c.doorTexture = null;
        }

        if (Array.isArray(c.doorSizes)) {
            c.doorSizes.forEach(s => {
                if (!s) return;
                s.doorMaterial = cfg.material;
                s.doorColorName = cfg.colorName;
                if (cmIsTextureValue(cfg.colorValue)) {
                    s.doorTexture = cfg.colorValue;
                    s.doorColor = null;
                } else {
                    s.doorColor = cfg.colorValue || s.doorColor || '#FFFFFF';
                    s.doorTexture = null;
                }
            });
        }
        n++;
    });
    return n;
}

function cmApplyCrownColor(cfg) {
    if (typeof cabinets === 'undefined' || !Array.isArray(cabinets)) return 0;
    let n = 0;
    cabinets.forEach(c => {
        if (!c) return;
        if (!c.crown) c.crown = {};
        // فقط اگر تاج فعال است یا اصلاً وجود دارد — همیشه ست می‌کنیم تا بعد از فعال شدن رنگ درست باشد
        c.crown.material = cfg.material;
        c.crown.finish = cfg.finish;
        c.crown.color = cfg.colorValue || c.crown.color || '#FFFFFF';
        c.crown.colorName = cfg.colorName || c.crown.colorName || '';
        n++;
    });
    return n;
}

function cmApplyKickboardColor(cfg) {
    if (typeof cabinets === 'undefined' || !Array.isArray(cabinets)) return 0;
    let n = 0;
    cabinets.forEach(c => {
        if (!c) return;
        if (!c.kickboard) c.kickboard = {};
        c.kickboard.material = cfg.material;
        c.kickboard.finish = cfg.finish;
        c.kickboard.color = cfg.colorValue || c.kickboard.color || '#FFFFFF';
        c.kickboard.colorName = cfg.colorName || c.kickboard.colorName || '';
        n++;
    });
    return n;
}

function cmApplyHiddenHandleColor(cfg) {
    if (typeof cabinets === 'undefined' || !Array.isArray(cabinets)) return 0;
    let n = 0;
    cabinets.forEach(c => {
        if (!c) return;
        if (c.isFridge || c.isWashingMachine || c.isDishwasher || c.isHood) return;

        let touched = false;
        if (Array.isArray(c.doorSizes)) {
            c.doorSizes.forEach(s => {
                if (!s) return;
                // فقط روی درب‌هایی که دستگیره مخفی دارند اعمال می‌شود
                if (!s.hiddenHandlePos || s.hiddenHandlePos === 'none') return;
                s.hiddenHandleMaterial = cfg.material;
                s.hiddenHandleColor = cfg.colorValue || s.hiddenHandleColor || '#999999';
                s.hiddenHandleColorName = cfg.colorName || s.hiddenHandleColorName || '';
                s.hiddenHandleFinish = cfg.finish;
                touched = true;
            });
        }
        // سطح یونیت هم برای سازگاری
        c.hiddenHandleMaterial = cfg.material;
        c.hiddenHandleColor = cfg.colorValue || c.hiddenHandleColor || '#999999';
        c.hiddenHandleColorName = cfg.colorName || '';
        c.hiddenHandleFinish = cfg.finish;
        if (touched) n++;
        else n++; // حتی بدون دستگیره مخفی فعلی، برای یونیت‌های بعدی نگه داشته می‌شود
    });
    return n;
}

window.cmApplySection = function(section) {
    const cfg = cmReadSection(section);
    if (!cfg.colorValue && !cfg.colorName) {
        alert('لطفاً ابتدا رنگ / تکسچر را انتخاب کنید.');
        return;
    }

    let count = 0;
    if (section === 'door') count = cmApplyDoorColor(cfg);
    else if (section === 'crown') count = cmApplyCrownColor(cfg);
    else if (section === 'kickboard') count = cmApplyKickboardColor(cfg);
    else if (section === 'hiddenHandle') count = cmApplyHiddenHandleColor(cfg);

    if (typeof draw === 'function') draw();
    if (window.Kitchen3D) {
        if (typeof Kitchen3D.refreshCabinets === 'function') Kitchen3D.refreshCabinets();
        else if (typeof Kitchen3D.renderCabinets === 'function') Kitchen3D.renderCabinets();
    }

    alert('اعمال شد روی ' + count + ' یونیت.\nدر صورت نیاز هر یونیت را از پنل مربوطه می‌توانید جداگانه تغییر دهید.');
};

window.openColorManagerPanel = function(event) {
    const panel = document.getElementById('color-manager-panel');
    if (!panel) return;
    // مرکز صفحه مثل بقیه پنل‌ها
    panel.style.top = '';
    panel.style.left = '';
    panel.style.right = '';
    panel.style.bottom = '';
    panel.style.transform = '';
    panel.classList.add('active');

    // بعد از رندر: اگر بالای پنل از صفحه بیرون زد، کمی پایین‌تر بیاید
    requestAnimationFrame(function() {
        const rect = panel.getBoundingClientRect();
        const margin = 12;
        if (rect.top < margin) {
            const shift = margin - rect.top;
            panel.style.top = '50%';
            panel.style.left = '50%';
            panel.style.transform = 'translate(-50%, calc(-50% + ' + shift + 'px)) scale(1)';
        }
        // اگر پایین بیرون زد هم کمی بالا برود
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const rect2 = panel.getBoundingClientRect();
        if (rect2.bottom > vh - margin) {
            const shiftUp = rect2.bottom - (vh - margin);
            const currentShift = rect.top < margin ? (margin - rect.top) : 0;
            panel.style.top = '50%';
            panel.style.left = '50%';
            panel.style.transform = 'translate(-50%, calc(-50% + ' + (currentShift - shiftUp) + 'px)) scale(1)';
        }
    });
};

window.closeColorManagerPanel = function() {
    const panel = document.getElementById('color-manager-panel');
    if (panel) panel.classList.remove('active');
};
