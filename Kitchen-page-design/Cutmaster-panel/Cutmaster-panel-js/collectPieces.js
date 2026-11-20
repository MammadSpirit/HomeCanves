// js/collectPieces.js - ماژول محاسبه ابعاد قطعات با سیستم استخراج هوشمند و آپدیت لحظه‌ای
function collectPieces() {
    const cabinetsData = (typeof cabinets !== 'undefined') ? cabinets : [];
    const output = { sheet: [], backsplash: [], fiber: [], pvc: [] , countertop: []}; 
    const thick = 1.6; // ضخامت ام‌آندی‌اف ۱۶ میل
    const gap = 0.4;   // بادخور استاندارد پیش‌فرض برای سایر بخش‌ها

    // آبجکت مپ برای گرفتن نام فارسی جهت نمایش در جدول قطعات
    const materialTextMap = {
        'mdf': 'ام‌دی‌اف (MDF)',
        'leteron': 'لترون',
        'highGloss': 'هایگلاس',
        'countertop': 'صفحه کابینت',
        'backsplash': 'ماربل شیت',
        'PVC': 'پی‌وی‌سی (PVC)',
        'Fibr': 'سه میل پرینتی' 
    };

    // 🟢 تشخیص هوشمند متریال و رنگ پیش‌فرض سراسری اپلیکیشن
    const currentGlobalMat = typeof window.globalDoorMaterial !== 'undefined' ? window.globalDoorMaterial : 'highGloss';
    const currentGlobalColor = typeof window.globalDoorColor !== 'undefined' ? window.globalDoorColor : '#f8fafc';

    cabinetsData.forEach(c => {
        const w = parseFloat(c.w) || 0;  // طول کل یونیت
        const d = parseFloat(c.d) || 0;  // عمق کل یونیت
        const h = parseFloat(c.h) || 0;  // ارتفاع کل یونیت
        const uId = c.id; 

        if (w <= 0 || h <= 0) return;

        // 🎨 ۱. استخراج مشخصات عمومی درب کابینت
        let doorMatValue = c.doorMaterial || currentGlobalMat; 
        if (!c.doorMaterial) {
            if (c.doorType === 'mdf') doorMatValue = 'mdf';
            else if (c.doorType === 'postformed') doorMatValue = 'countertop';
        }

        let doorColorSource = c.doorColor || currentGlobalColor;
        let doorColorName = 'رنگ انتخاب شده';
        let doorColorHex = '#f8fafc';
        let doorColorTexture = '';

        if (doorColorSource) {
            if (typeof getColorNameByValue === 'function') {
                doorColorName = getColorNameByValue(doorColorSource) || 'رنگ سفارشی';
            } else {
                doorColorName = doorColorSource.startsWith('http') ? 'طرح چوب/سفارشی' : 'رنگ انتخاب شده';
            }

            if (doorColorSource.startsWith('http') || doorColorSource.includes('/') || doorColorSource.includes('.')) {
                doorColorTexture = doorColorSource;
                doorColorHex = 'transparent';
            } else {
                doorColorHex = doorColorSource;
                doorColorTexture = '';
            }
        }

        // پکیج اطلاعات متریال و رنگ عمومی بدنه و متعلقات
        const pieceSpecs = {
            sheet: { material: 'mdf', materialText: 'ام‌دی‌اف (MDF)', colorName: 'سفید یخچالی', colorHex: '#FFFFFF', colorTexture: '' },
            fiber: { material: 'Fibr', materialText: 'سه میل پرینتی', colorName: 'سفید پرینتی', colorHex: '#FFFFFF', colorTexture: '' }, 
            pvc: { material: 'PVC', materialText: 'پی‌وی‌سی (PVC)', colorName: 'پی‌وی‌سی سفید', colorHex: '#e2e8f0', colorTexture: '' },
            backsplash: { 
    material: doorMatValue, 
    materialText: materialTextMap[doorMatValue] || 'بین کابینتی (ماربل شیت)', 
    colorName: doorColorName, 
    colorHex: doorColorHex, 
    colorTexture: doorColorTexture 
},

            kickboard: {
                material: 'mdf', // یا هر متریالی که در اپلیکیشن برای پاخور در نظر دارید
                materialText: 'ام‌دی‌اف (MDF)',
                colorName: c.kickboard?.color ? (typeof getKickboardColorNameByValue === 'function' ? getKickboardColorNameByValue(c.kickboard.color) : 'رنگ پاخور') : 'قهوه‌ای بلوط',
                colorHex: c.kickboard?.color?.startsWith('#') ? c.kickboard.color : '#8B4513',
                colorTexture: c.kickboard?.color?.startsWith('#') ? '' : (c.kickboard?.color || '')
            },
            crown: {
    material: 'mdf',
    materialText: 'ام‌دی‌اف (MDF)',
    colorName: c.crown?.colorName || 'رنگ انتخاب شده تاج',
    colorHex: c.crown?.color?.startsWith('#') ? c.crown.color : '#FFFFFF',
    colorTexture: c.crown?.color?.startsWith('#') ? '' : (c.crown?.color || '')
}

        };
        
                // 🟢 ابتدا رنگ پیش‌فرض یونیت را تعریف کن تا خطای کرش جاوااسکریپت (ReferenceError) کاملاً رفع شود:
        const defaultMatValue = c.doorColor || currentGlobalColor || "#ffffff";

               const hoodBackMatType = c.hoodBackMaterialType || 'mdf';
        const hoodSidesMatType = c.hoodSidesMaterialType || 'mdf';
        const hoodCeilingMatType = c.hoodCeilingMaterialType || 'mdf';

        const hoodSpecs = {
            back: {
                material: hoodBackMatType,
                materialText: materialTextMap[hoodBackMatType] || 'ام‌دی‌اف (MDF)',
                colorName: c.hoodBackMaterialName || 'سفید یخچالی', // 🟢 تراز با بدنه اصلی
                colorHex: c.hoodBackMaterialValue?.startsWith('#') ? c.hoodBackMaterialValue : '#FFFFFF',
                colorTexture: c.hoodBackMaterialValue?.startsWith('#') ? '' : (c.hoodBackMaterialValue || ''),
                isAuto: true 
            },
            sides: {
                material: hoodSidesMatType,
                materialText: materialTextMap[hoodSidesMatType] || 'ام‌دی‌اف (MDF)',
                colorName: c.hoodSidesMaterialName || 'سفید یخچالی', // 🟢 تراز با بدنه اصلی
                colorHex: c.hoodSidesMaterialValue?.startsWith('#') ? c.hoodSidesMaterialValue : '#FFFFFF',
                colorTexture: c.hoodSidesMaterialValue?.startsWith('#') ? '' : (c.hoodSidesMaterialValue || ''),
                isAuto: true 
            },
            ceiling: {
                material: hoodCeilingMatType,
                materialText: materialTextMap[hoodCeilingMatType] || 'ام‌دی‌اف (MDF)',
                colorName: c.hoodCeilingMaterialName || 'سفید یخچالی', // 🟢 تراز با بدنه اصلی
                colorHex: c.hoodCeilingMaterialValue?.startsWith('#') ? c.hoodCeilingMaterialValue : '#FFFFFF',
                colorTexture: c.hoodCeilingMaterialValue?.startsWith('#') ? '' : (c.hoodCeilingMaterialValue || ''),
                isAuto: true 
            }
        };



        function getComponentSpecs(index, defaultRotation = 'vertical') {
            const sizeObj = (c.doorSizes && c.doorSizes[index]) ? c.doorSizes[index] : {};
            const mat = sizeObj.doorMaterial || c.doorMaterial || doorMatValue;
            
            let cName = sizeObj.doorColorName || (c.doorColor ? doorColorName : '');
            let cHex = '#f8fafc';
            let cTex = '';

            const activeColorSource = sizeObj.doorTexture || sizeObj.doorColor || doorColorSource;
            
            if (activeColorSource) {
                if (typeof getColorNameByValue === 'function' && !sizeObj.doorColorName) {
                    cName = getColorNameByValue(activeColorSource) || 'رنگ سفارشی';
                } else if (!cName) {
                    cName = 'رنگ پیش‌فرض درب';
                }

                if (activeColorSource.startsWith('http') || activeColorSource.includes('/') || activeColorSource.includes('.')) {
                    cTex = activeColorSource;
                    cHex = 'transparent';
                } else {
                    cHex = activeColorSource;
                    cTex = '';
                }
            }

            return {
                material: mat,
                materialText: materialTextMap[mat] || 'هایگلاس',
                colorName: cName,
                colorHex: cHex,
                colorTexture: cTex,
                rotation: defaultRotation
            };
        }

// =========================================================================
// 🛠️ تابع جامع و نهایی پردازش و تزریق انواع درب‌ها به آرایه body (انتقال موقت از door به body)
// =========================================================================
function processAllCabinetDoors(numSlots, labelPrefix, defaultRotation = 'vertical', customAutoWidths = [], customAutoHeights = []) {
    for (let i = 0; i < numSlots; i++) {
        const sizeObj = (c.doorSizes && c.doorSizes[i]) ? c.doorSizes[i] : {};
        if (sizeObj.enabled === false) continue;

        // ۱. دریافت ابعاد پایه (اول اولویت با باکس دیتابیس، بعد مقادیر محاسباتی خودکار، در نهایت ابعاد کل یونیت)
        let baseW = (sizeObj.w !== undefined && sizeObj.w !== "") ? parseFloat(sizeObj.w) : (customAutoWidths[i] !== undefined ? customAutoWidths[i] : w);
        let baseH = (sizeObj.h !== undefined && sizeObj.h !== "") ? parseFloat(sizeObj.h) : (customAutoHeights[i] !== undefined ? customAutoHeights[i] : h);

        // ۲. رند کردن امن و تراز نهایی اعشار ابعاد پایه
        baseW = Math.floor((baseW + 0.0001) * 10) / 10;
        baseH = Math.floor((baseH + 0.0001) * 10) / 10;

        // متغیرهای نهایی طول و عرض قطعه در کات‌مستر
        let finalLengthW;
        let finalWidthH;

        // 🔍 بررسی وضعیت درب شیشه‌خور (اگر شیشه‌خور بود، بادخور کسر نمی‌شود)
        if (c.isGlassDoor) {
            // بدون کسر بادخور ۰.۴ سانت - دقیقاً ابعاد اصلی درب
            finalLengthW = baseH; 
            finalWidthH = baseW;  
        } else {
            // ۳. اعمال فرمول کسر بادخور نهایی ۰.۴ سانت (۴ میلیمتر) برای نوار PVC (فقط درب‌های معمولی/سالم)
            finalLengthW = baseH - 0.4; 
            finalWidthH = baseW - 0.4;  
        }

        // ۴. فیکس کردن نهایی عدد خروجی لیست با رند کردن اعشار
        finalLengthW = parseFloat((Math.floor((finalLengthW + 0.0001) * 10) / 10).toFixed(1));
        finalWidthH = parseFloat((Math.floor((finalWidthH + 0.0001) * 10) / 10).toFixed(1));

        // مشخص کردن پارت فرعی برچسب قطعه
        let doorPartLabel = `درب ${i + 1}`;
        if (c.isDrawerBody || c.doorType === "drawer") {
            doorPartLabel = `کشو ${i + 1}`;
        } else if (c.isBaseWithDrawer) {
            doorPartLabel = (i === 0) ? `کشو بالا` : `درب پایین ${i}`;
        } else if (c.doorType === "jaki-ghadi") {
            if (numSlots === 2) {
                doorPartLabel = (i === 0) ? `درب قدی` : `درب جکی`;
            } else {
                doorPartLabel = (i === 0) ? `درب قدی چپ` : (i === 1 ? `درب قدی راست` : `درب جکی`);
            }
        }

        const specs = getComponentSpecs(i, defaultRotation);

        // 🌟 موقتاً خروجی‌ها به جای output.door به آرایه output.body منتقل می‌شوند
        if (c.isGlassDoor) {
            const frameSize = 6.0; // پهنای فریم ۶ سانتی‌متر

            // الف) قیدهای افقی (پاسار)
            output.sheet.push({
                w: finalWidthH,       
                h: frameSize,        
                count: 2,
                label: `${labelPrefix} - قید افقی (پاسار) درب شیشه‌ای ${i + 1}`,
                serviceW: "2",       
                serviceH: "-", 
                ...specs
            });

            // ب) قیدهای عمودی (بائو)
            output.sheet.push({
                w: finalLengthW,      
                h: frameSize,        
                count: 2,
                label: `${labelPrefix} - قید عمودی (بائو) درب شیشه‌ای ${i + 1}`,
                serviceW: "2",       
                serviceH: "-", 
                ...specs
            });
        } else {
            // روند معمولی برای درب‌های چوبی یکپارچه و سالم
            output.sheet.push({
                w: finalLengthW,
                h: finalWidthH,
                count: 1,
                label: `${labelPrefix} - ${doorPartLabel}`,
                serviceW: "2", 
                serviceH: "2", 
                ...specs
            });
        }
    }
}


        // فرمول فیبر پشت
        let bodyH = h - thick; 
        let fiberW = w - thick - 0.1;       
        let fiberH = bodyH + 0.8 - 0.3;     

        const currentDoorType = c.doorType || "side";

        // محاسبه دقیق تعداد اسلات‌ها همگام با پنل کاربری ابعاد درب‌ها
        let doorsCount = parseInt(c.doors) || 2;
        let slotCount = doorsCount;
        if (c.isDrawerBody) {
            slotCount = c.drawerCount || 3;
        } else if (currentDoorType === "lift-side") {
            slotCount = 2;
        } else if (currentDoorType === "combo") {
            slotCount = (doorsCount === 3 || doorsCount === 4) ? doorsCount : 3;
        } else if (currentDoorType === "jaki-ghadi" || currentDoorType === "split") {
            slotCount = Math.min(Math.max(doorsCount, 2), 3);
        }

// ==========================================
// 🛑 بخش اختصاصی تفکیک و آنالیز باکس نما (Facade Box) - بدون طاق و کف اضافی
// ==========================================
if (c.isFacadeBox && c.panels) {
    const p = c.panels;
    const parts = ['left', 'right', 'front', 'back'];

    parts.forEach(part => {
        const panelData = p[part];
        if (!panelData || panelData.active === false || !panelData.w || !panelData.h) return;

        const wallLabel = part === 'left' ? 'چپ' : part === 'right' ? 'راست' : part === 'front' ? 'جلو' : 'عقب';

        // ۱. دیواره اصلی بیرونی باکس نما
        const mainColor = panelData.color || '#FFFFFF';
        const mainTex = panelData.texture || '';
        const isMainTex = mainTex.startsWith("http") || mainTex.includes("/") || mainTex.includes(".") || mainColor.startsWith("http");
        const currentMat = panelData.materialType || 'mdf';

        output.sheet.push({
            w: panelData.h,
            h: panelData.w,
            count: 1,
            label: `دیواره ${wallLabel} باکس نما U${c.id}`,
            serviceW: "1S",
            serviceH: "1S",
            material: currentMat,
            materialText: materialTextMap[currentMat] || 'ام‌دی‌اف (MDF)',
            colorName: panelData.colorName || 'سفید یخچالی',
            colorHex: isMainTex ? '#FFFFFF' : mainColor,
            colorTexture: isMainTex ? (mainTex || mainColor) : '',
            rotation: 'vertical'
        });

        // ۲. شیت‌های ترمووال متصل به دیواره (اصلاح شده 🔄 جلوگیری از لوپ بی‌نهایت با کنترل موقعیت)
        if (panelData.thermowall && panelData.thermowall.enabled && panelData.thermowall.count > 0) {
            const th = panelData.thermowall;
            const thColor = th.color || '#8b5a2b';
            const thTex = th.texture || '';
            const isThTex = thTex.startsWith("http") || thTex.includes("/") || thTex.includes(".") || thColor.startsWith("http");
            const thMat = th.materialType || 'mdf';

            const hasLeft = !!panelData.posLeft;
            const hasRight = !!panelData.posRight;

            // فقط در صورتی وارد حلقه شویم که حداقل یک سمت فعال باشد
            if (hasLeft || hasRight) {
                for (let i = 0; i < th.count; i++) {
                    const thermowallPayload = {
                        w: panelData.h,
                        h: th.w,
                        count: 1, 
                        serviceW: "1S",
                        serviceH: "-",
                        material: thMat,
                        materialText: materialTextMap[thMat] || 'ام‌دی‌اف (MDF)',
                        colorName: th.colorName || 'چوب ترمو',
                        colorHex: isThTex ? '#FFFFFF' : thColor,
                        colorTexture: isThTex ? (thTex || thColor) : '',
                        rotation: 'vertical'
                    };

                    if (hasLeft) {
                        output.sheet.push({ 
                            ...thermowallPayload, 
                            label: `ترمووال سمت چپ شاخه ${i + 1} - دیواره ${wallLabel} U${c.id}` 
                        });
                    }
                    if (hasRight) {
                        output.sheet.push({ 
                            ...thermowallPayload, 
                            label: `ترمووال سمت راست شاخه ${i + 1} - دیواره ${wallLabel} U${c.id}` 
                        });
                    }
                }
            }
        }

        // ۳. شلف‌های متصل به بدنه دیواره
        if (panelData.shelves && panelData.shelves.enabled && panelData.shelves.list && panelData.shelves.list.length > 0) {
            const shMat = panelData.shelves.materialType || 'mdf';
            panelData.shelves.list.forEach((shelf, shIdx) => {
                if (!shelf.w || !shelf.d) return;

                const shColor = shelf.color || '#cbd5e1';
                const shTex = shelf.texture || '';
                const isShTex = shTex.startsWith("http") || shTex.includes("/") || shTex.includes(".") || shColor.startsWith("http");

                const shelfPayload = {
                    w: shelf.d,
                    h: shelf.w,
                    count: 1,
                    serviceW: "1S",
                    serviceH: "2",
                    material: shMat,
                    materialText: materialTextMap[shMat] || 'ام‌دی‌اف (MDF)',
                    colorName: shelf.colorName || 'رنگ شلف',
                    colorHex: isShTex ? '#FFFFFF' : shColor,
                    colorTexture: isShTex ? (shTex || shColor) : '',
                    rotation: 'horizontal'
                };

                if (panelData.posLeft) {
                    output.sheet.push({ ...shelfPayload, label: `شلف ${shIdx + 1} سمت چپ - دیواره ${wallLabel} U${c.id}` });
                }
                if (panelData.posRight) {
                    output.sheet.push({ ...shelfPayload, label: `شلف ${shIdx + 1} سمت راست - دیواره ${wallLabel} U${c.id}` });
                }
            });
        }

        // ۴. باکس‌های توکار (Niche) روی دیواره
        if (panelData.niches && panelData.niches.enabled && panelData.niches.list && panelData.niches.list.length > 0) {
            panelData.niches.list.forEach((niche, nIdx) => {
                if (!niche.w || !niche.h || !niche.d) return;

                const niColor = niche.color || '#FFFFFF';
                const niTex = niche.texture || '';
                const isNiTex = niTex.startsWith("http") || niTex.includes("/") || niTex.includes(".") || niColor.startsWith("http");
                const niMat = currentMat;
                
                let openEdge = niche.openEdge || 'none';
                let extraLeft = 0; let extraRight = 0;
                
                if (part === 'front' || part === 'back') {
                    if (openEdge === 'left' || openEdge === 'both') extraLeft = 1.6;
                    if (openEdge === 'right' || openEdge === 'both') extraRight = 1.6;
                }
                const baseNicheW = niche.w + extraLeft + extraRight;

                let topBotWidth = baseNicheW + 6.4; 
                if (openEdge === 'left' || openEdge === 'right') topBotWidth = baseNicheW + 3.2;
                else if (openEdge === 'both') topBotWidth = baseNicheW;

                const baseNichePayload = {
                    material: niMat,
                    materialText: materialTextMap[niMat] || 'ام‌دی‌اف (MDF)',
                    colorName: niche.colorName || 'سفید یخچالی',
                    colorHex: isNiTex ? '#FFFFFF' : niColor,
                    colorTexture: isNiTex ? (niTex || niColor) : '',
                };

                output.sheet.push({
                    ...baseNichePayload,
                    w: parseFloat(topBotWidth.toFixed(1)), h: 3.2, count: 2,
                    label: `فریم افقی نما نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`,
                    serviceW: "1S", serviceH: "-", rotation: 'horizontal'
                });

                if (openEdge !== 'left' && openEdge !== 'both') {
                    output.sheet.push({ ...baseNichePayload, w: niche.h, h: 3.2, count: 1, label: `فریم عمودی چپ نما نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`, serviceW: "1S", serviceH: "-", rotation: 'vertical' });
                }
                if (openEdge !== 'right' && openEdge !== 'both') {
                    output.sheet.push({ ...baseNichePayload, w: niche.h, h: 3.2, count: 1, label: `فریم عمودی راست نما نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`, serviceW: "1S", serviceH: "-", rotation: 'vertical' });
                }

                output.sheet.push({
                    ...baseNichePayload,
                    w: baseNicheW, h: niche.d, count: 2,
                    label: `سقف و کف بدنه داخلی نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`,
                    serviceW: "1S", serviceH: "-", rotation: 'horizontal'
                });

                output.sheet.push({
                    ...baseNichePayload,
                    w: niche.h + 3.2, h: niche.d, count: 2,
                    label: `دیواره بغل داخلی نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`,
                    serviceW: "1S", serviceH: "-", rotation: 'vertical'
                });

                output.sheet.push({
                    ...baseNichePayload,
                    w: niche.h + 3.2, h: baseNicheW + 3.2, count: 1,
                    label: `فیبر پشت نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`,
                    serviceW: "-", serviceH: "-", material: 'fiber', materialText: 'فیبر ۳ میل', rotation: 'vertical'
                });
            });
        }
    });
}






// ==========================================
// 🛑 ۱. محاسبه کابینت زمینی معمولی
// ==========================================
if (c.type === "floor" && !c.isFridgeWrap && !c.isCoffeeBar && !c.isAppliance && !c.isDrawerBody && !c.isBaseWithDrawer && !c.isFacadeBox) {
    output.sheet.push({ w: w, h: d, count: 1, label: `کف زمینی U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });
    output.sheet.push({ w: bodyH, h: d, count: 2, label: `بدنه زمینی U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });

    let qeidW = w - (2 * thick);
    output.sheet.push({ w: qeidW, h: 6, count: 2, label: `قید بالا U${uId}`, serviceW: "1", serviceH: "-", ...pieceSpecs.sheet });
    output.fiber.push({ w: fiberH, h: fiberW, count: 1, label: `فیبر ۳میل پشت U${uId}`, serviceW: "-", serviceH: "-", ...pieceSpecs.fiber });

    let autoWidths = [];
    let totalGap = 0;
    if (slotCount === 2) totalGap = 0.1;
    else if (slotCount === 3) totalGap = 0.5;
    else if (slotCount === 4) totalGap = 0.7;
    else if (slotCount > 4) totalGap = 0.7 + (slotCount - 4) * 0.2;
    let stdW = slotCount > 0 ? (w - totalGap) / slotCount : w;
    for(let i=0; i<slotCount; i++) autoWidths.push(stdW);

    processAllCabinetDoors(slotCount, `درب زمینی U${uId}`, 'vertical', autoWidths);
}

        
// ==========================================
// 🛑 ۲. کابینت زمینی دروکشو (کشو بالا + درب پایین)
// ==========================================
else if (c.type === "floor" && c.isBaseWithDrawer) {
    output.sheet.push({ w: w, h: d, count: 1, label: `کف یونیت دروکشو U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });
    output.sheet.push({ w: bodyH, h: d, count: 2, label: `بدنه یونیت دروکشو U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });

    let qeidW = w - (2 * thick);
    output.sheet.push({ w: qeidW, h: 6, count: 2, label: `قید بالا دروکشو U${uId}`, serviceW: "1", serviceH: "-", ...pieceSpecs.sheet });
    output.fiber.push({ w: fiberH, h: fiberW, count: 1, label: `فیبر پشت دروکشو U${uId}`, serviceW: "-", serviceH: "-", ...pieceSpecs.fiber });

    // همگام‌سازی داینامیک محاسبه بدنه داخلی کشو با تغییرات پنل درب‌ها
    let baseDrawerH = c.drawerFrontHeight ? parseFloat(c.drawerFrontHeight) : 18.0; 
    let drawerGap = c.drawerGap !== undefined ? c.drawerGap : 0.5;
    let physicalSlotH = baseDrawerH + 0.8;
    
    const dData0 = (c.drawersData && c.drawersData.length > 0) ? c.drawersData[0] : null;
    const sData0 = c.doorSizes && c.doorSizes[0] ? c.doorSizes[0] : null;
    const defaultInnerHeight = (baseDrawerH * 0.7) - 2;
    
    let customBodyH = null;
    if (dData0 && dData0.height && !isNaN(parseFloat(dData0.height))) customBodyH = parseFloat(dData0.height);
    else if (sData0 && sData0.bodyH && !isNaN(parseFloat(sData0.bodyH))) customBodyH = parseFloat(sData0.bodyH);
    
    const innerHeight = customBodyH !== null ? customBodyH : defaultInnerHeight;
    const heightGrowth = innerHeight - defaultInnerHeight;
    let drawerActualSlotH = physicalSlotH + heightGrowth;

    // باکس کشوی بالا (بدون تغییر خدمات طول و عرض)
    let drD = (dData0 && parseFloat(dData0.depth)) || 45;  
    let drawerFrontBackW = w - (2 * thick) - 5.8; 

    output.sheet.push({ w: drawerFrontBackW, h: innerHeight, count: 2, label: `جلو/عقب کشو بالا U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });
output.sheet.push({ w: drD, h: innerHeight, count: 2, label: `بغل کشو بالا U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });

    let drawerFiberW = drawerFrontBackW + 1.6 - 0.1; 
    let drawerFiberH = drD - (2 * thick) + 1.6 - 0.1; 
    output.fiber.push({ w: drawerFiberH, h: drawerFiberW, count: 1, label: `کف ۳میل کشو بالا U${uId}`, serviceW: "-", serviceH: "-", ...pieceSpecs.fiber });

    // آرایه محاسبات خودکار ابعاد دقیق نماها
    let autoWidths = [], autoHeights = [];
    for(let i = 0; i < slotCount; i++) {
        if(i === 0) {
            autoWidths.push(w - 0.1);
            autoHeights.push(drawerActualSlotH - drawerGap);
        } else {
            const bottomDoorsCount = slotCount > 1 ? slotCount - 1 : 1;
            let bottomDoorsStartY = h - drawerActualSlotH;
            autoWidths.push((w - 0.1) / bottomDoorsCount);
            autoHeights.push(bottomDoorsStartY - drawerGap);
        }
    }

    processAllCabinetDoors(slotCount, `یونیت دروکشو U${uId}`, 'vertical', autoWidths, autoHeights);
}

// ==========================================
// 🛑 ۳. محاسبه کابینت زمینی کشودار (دراور كامل)
// ==========================================
else if (c.type === "floor" && c.isDrawerBody) {
    output.sheet.push({ w: w, h: d, count: 1, label: `کف یونیت کشو U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });
    output.sheet.push({ w: bodyH, h: d, count: 2, label: `بدنه یونیت کشو U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });

    let qeidW = w - (2 * thick);
    output.sheet.push({ w: qeidW, h: 6, count: 2, label: `قید بالا کشو U${uId}`, serviceW: "1", serviceH: "-", ...pieceSpecs.sheet });
    output.fiber.push({ w: fiberH, h: fiberW, count: 1, label: `فیبر پشت یونیت کشو U${uId}`, serviceW: "-", serviceH: "-", ...pieceSpecs.fiber });

    // بازنویسی دقیق سیستم محاسبه بدنه داخلی کشوها بر اساس توزیع سهمی از کل ارتفاع
    const drawerGap = c.drawerGap !== undefined ? c.drawerGap : 0.5;
    const availableHeight = h - (drawerGap * (slotCount - 1));
    let requestedSlotHeights = [];
    let totalInputHeight = 0;

    // فاز اول: استخراج دقیق سهم‌های ارتفاعی هر اسلات
    for (let i = 0; i < slotCount; i++) {
        const dData = (c.drawersData && c.drawersData[i]) ? c.drawersData[i] : null;
        const sData = (c.doorSizes && c.doorSizes[i]) ? c.doorSizes[i] : null;
        
        let slotH = availableHeight / slotCount;
        let customBodyH = null;
        if (dData && dData.height && !isNaN(parseFloat(dData.height))) {
            customBodyH = parseFloat(dData.height);
        } else if (sData && sData.bodyH && !isNaN(parseFloat(sData.bodyH))) {
            customBodyH = parseFloat(sData.bodyH);
        }

        if (customBodyH !== null) {
            let defaultBodyH = (availableHeight / slotCount) * 0.7 - 2;
            let growth = customBodyH - defaultBodyH;
            slotH += growth;
        }
        requestedSlotHeights.push(slotH);
        totalInputHeight += slotH;
    }
    
    let scaleFactor = totalInputHeight > 0 ? (availableHeight / totalInputHeight) : 1;
    let autoWidths = [], autoHeights = [];

    // فاز دوم: ایجاد دقیق بدنه داخلی جعبه و فیکس کردن آرایه‌های اتوماتیک نما
    for(let i = 0; i < slotCount; i++) {
        const dData = (c.drawersData && c.drawersData[i]) ? c.drawersData[i] : null;
        const sData = (c.doorSizes && c.doorSizes[i]) ? c.doorSizes[i] : null;
        
        let calculatedSlotH = requestedSlotHeights[i] * scaleFactor;
        
        // محاسبه ارتفاع دیواره باکس کشو متناسب با اسلات واقعی
        let defaultBoxH = calculatedSlotH * 0.7 - 2;
        if (defaultBoxH < 6) defaultBoxH = 10; // کف فرضی امنیت
        
        let finalBoxH = defaultBoxH;
        if (dData && dData.height && !isNaN(parseFloat(dData.height))) finalBoxH = parseFloat(dData.height);
        else if (sData && sData.bodyH && !isNaN(parseFloat(sData.bodyH))) finalBoxH = parseFloat(sData.bodyH);

        let drD = (dData && parseFloat(dData.depth)) || 45;
        let drawerFrontBackW = w - (2 * thick) - 5.8;

        // تزریق بدنه ام‌دی‌اف کشو (بدون تغییر خدمات طول و عرض)
        // تزریق بدنه ام‌دی‌اف کشو
// 🟢 اعمال خدمات 1S برای طول تمام کشوهای دراور
output.sheet.push({ w: drawerFrontBackW, h: parseFloat(finalBoxH.toFixed(1)), count: 2, label: `جلو/عقب کشو ${i + 1} U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });
output.sheet.push({ w: drD, h: parseFloat(finalBoxH.toFixed(1)), count: 2, label: `بغل کشو ${i + 1} U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });


        // تزریق کف ۳میل کشو
        let drawerFiberW = drawerFrontBackW + 1.6 - 0.1;
        let drawerFiberH = drD - (2 * thick) + 1.6 - 0.1;
        output.fiber.push({ w: drawerFiberH, h: drawerFiberW, count: 1, label: `کف ۳میل کشو ${i + 1} U${uId}`, serviceW: "-", serviceH: "-", ...pieceSpecs.fiber });

        // ذخیره جهت پردازش نهایی در بخش نماها
        autoWidths.push(w - 0.1);
        autoHeights.push(calculatedSlotH);
    }

    processAllCabinetDoors(slotCount, `یونیت کشو U${uId}`, 'vertical', autoWidths, autoHeights);
}


// ==========================================
// 🛑 ۴. محاسبه کابینت بدنه ضد آب (سینک PVC)
// ==========================================
else if (c.type === "waterproof") {
    output.pvc.push({ w: w, h: d, count: 1, label: `کف ضدآب U${uId}`, serviceW: "1", serviceH: "-", ...pieceSpecs.pvc });
    output.pvc.push({ w: bodyH, h: d, count: 2, label: `بدنه ضدآب U${uId}`, serviceW: "1", serviceH: "-", ...pieceSpecs.pvc });

    let qeidW = w - (2 * thick);
    output.pvc.push({ w: qeidW, h: 6, count: 2, label: `قید بالا ضدآب U${uId}`, serviceW: "1", serviceH: "-", ...pieceSpecs.pvc });

    let autoWidths = [];
    let totalGap = slotCount === 2 ? 0.1 : (slotCount === 3 ? 0.5 : 0.1);
    let stdW = (w - totalGap) / slotCount;
    for(let i=0; i<slotCount; i++) autoWidths.push(stdW);

    processAllCabinetDoors(slotCount, `درب سینک ضدآب U${uId}`, 'vertical', autoWidths);
}


        // ==========================================
        // 🛑 ۵. محاسبه کلاف و یونیت هوایی یخچال (Fridge Wrap)
        // ==========================================
                 else if (c.isFridgeWrap) {
            const hasLeftWall = (c.hasLeft !== false);
            const hasRightWall = (c.hasRight !== false);
            const hasBridgeUnit = (c.hasBridge !== false);
            
            const backThick = 0.3; // ضخامت ۳ میل پشت
            
            // 🌟 اصلاح رنگ و نام پیش‌فرض به سفید یخچالی
            const defaultMatValue = c.doorColor || "#FFFFFF"; 
            const defaultMatName = "سفید یخچالی";

            // ۱. خروجی دیواره‌های قدی
            if (hasLeftWall) {
                let leftH = parseFloat(c.leftH) || h;
                let leftD = parseFloat(c.leftD) || d;
                
                let leftColor = c.leftMaterialValue || defaultMatValue;
                let isTexture = leftColor.includes('/') || leftColor.includes('.') || leftColor.includes('http');

                output.sheet.push({ 
                    ...pieceSpecs.sheet, // 🌟 اول مشخصات عمومی بدنه پهن می‌شود
                    w: leftH, 
                    h: leftD, 
                    count: 1, 
                    label: `دیواره قدی چپ یخچال U${uId}`, 
                    serviceW: "1", 
                    serviceH: "1", 
                    colorHex: isTexture ? '#FFFFFF' : leftColor,
                    colorTexture: isTexture ? leftColor : '',
                    colorName: c.leftColorName || defaultMatName
                });
            }
            if (hasRightWall) {
                let rightH = parseFloat(c.rightH) || h;
                let rightD = parseFloat(c.rightD) || d;
                
                let rightColor = c.rightMaterialValue || defaultMatValue;
                let isTexture = rightColor.includes('/') || rightColor.includes('.') || rightColor.includes('http');

                output.sheet.push({ 
                    ...pieceSpecs.sheet, // 🌟 اول مشخصات عمومی بدنه پهن می‌شود
                    w: rightH, 
                    h: rightD, 
                    count: 1, 
                    label: `دیواره قدی راست یخچال U${uId}`, 
                    serviceW: "1", 
                    serviceH: "1", 
                    colorHex: isTexture ? '#FFFFFF' : rightColor,
                    colorTexture: isTexture ? rightColor : '',
                    colorName: c.rightColorName || defaultMatName
                });
            }

            // ۲. خروجی باکس هوایی بالای یخچال
            if (hasBridgeUnit) {
                let bW = parseFloat(c.bridgeW) || w;
                if (hasLeftWall)  bW -= thick;
                if (hasRightWall) bW -= thick;

                let bD = parseFloat(c.bridgeD) || d;
                let actualBodyDepth = bD - thick - backThick; 

                let bH = parseFloat(c.bridgeH) || 40; 
                let bridgeBodyH = bH - (2 * thick); 

                output.sheet.push({ 
                    ...pieceSpecs.sheet,
                    w: bW, 
                    h: actualBodyDepth, 
                    count: 2, 
                    label: `کف/سقف هوایی یخچال U${uId}`, 
                    serviceW: "1", 
                    serviceH: "-"
                });

                output.sheet.push({ 
                    ...pieceSpecs.sheet,
                    w: bridgeBodyH, 
                    h: actualBodyDepth, 
                    count: 2, 
                    label: `دیواره جانبی هوایی یخچال U${uId}`, 
                    serviceW: "1", 
                    serviceH: "-"
                });

                let bridgeFiberW = bW - 0.2;
                let bridgeFiberH = bH - 0.2;
                output.fiber.push({ 
                    ...pieceSpecs.fiber,
                    w: bridgeFiberH, 
                    h: bridgeFiberW, 
                    count: 1, 
                    label: `فیبر پشت هوایی یخچال U${uId}`
                });

                let autoWidths = [];
                let totalGap = slotCount === 2 ? 0.1 : 0.5;
                let stdW = (bW - totalGap) / slotCount;
                for(let i=0; i<slotCount; i++) autoWidths.push(stdW);
                let autoHeights = Array(slotCount).fill(bH);

                processAllCabinetDoors(slotCount, `درب بالای یخچال U${uId}`, 'vertical', autoWidths, autoHeights);
            }
        }




        
        // ==========================================
        // 🛑 ۶. محاسبه کابینت دیواری / هوایی (Wall Cabinet)
        // ==========================================
        else if (c.type === "wall") {
            let autoWidths = [], autoHeights = [];
            
            if (currentDoorType === "side") {
                let totalGap = slotCount === 2 ? 0.1 : (slotCount === 3 ? 0.5 : 0.7);
                let stdW = (w - totalGap) / slotCount;
                autoWidths = Array(slotCount).fill(stdW);
                autoHeights = Array(slotCount).fill(h);
            } 
            else if (currentDoorType === "lift") {
                autoWidths = Array(slotCount).fill(w - 0.1);
                let stdH = slotCount === 1 ? (h - 0.2) : ((h - 0.4) / slotCount);
                autoHeights = Array(slotCount).fill(stdH);
            } 
            else if (currentDoorType === "lift-side") {
                autoWidths = Array(2).fill((w - 0.1) / 2);
                autoHeights = Array(2).fill(h - 0.2);
            } 
            else if (currentDoorType === "split") {
                autoWidths = Array(slotCount).fill(w - 0.1);
                let totalHeightGap = slotCount === 3 ? 0.6 : 0.3;
                autoHeights = Array(slotCount).fill((h - totalHeightGap) / slotCount);
            } 
            else if (currentDoorType === "combo") {
                autoWidths = Array(slotCount).fill((w - 0.1) / 2);
                if (slotCount === 3) {
                    autoHeights = [h, (h - 0.3) / 2, (h - 0.3) / 2];
                } else {
                    autoHeights  = Array(4).fill((h - 0.3) / 2);
                }
            } 
            else if (currentDoorType === "jaki-ghadi") {
                let stdH = (h - 0.4) / 2;
                autoHeights = Array(slotCount).fill(stdH);
                if (slotCount === 2) {
                    autoWidths = Array(2).fill(w - 0.1);
                } else {
                    autoWidths = [(w - 0.1) / 2, (w - 0.1) / 2, w - 0.1];
                }
            }

            let rotationStrategy = (currentDoorType === "lift" || currentDoorType === "split" || currentDoorType === "jaki-ghadi") ? "horizontal" : "vertical";

                       if (c.isHoodWrap) {
                // ۱. ورق پشت کلاف هود (در صورت فعال بودن)
                if (c.enableHoodBack !== false) {
                    output.sheet.push({ 
                        w: parseFloat(h.toFixed(1)), 
                        h: parseFloat(w.toFixed(1)), 
                        count: 1, 
                        label: `ورق پشت کلاف هود U${uId}`, 
                        serviceW: "1", // 🟢 خدمات طول ۱ شد
                        serviceH: "-", 
                        ...hoodSpecs.back 
                    });
                }

                // عمق دیواره‌های کناری با کسر ضخامت ۱۶ میل پشت
                let hoodSideD = d - thick; 

                // ۲. دو عدد دیواره کناری قدی چپ و راست (در صورت فعال بودن)
                if (c.enableHoodSides !== false) {
                    output.sheet.push({ 
                        w: parseFloat(h.toFixed(1)), 
                        h: parseFloat(hoodSideD.toFixed(1)), 
                        count: 2, 
                        label: `بدنه کناری کلاف هود U${uId}`, 
                        serviceW: "1", // 🟢 خدمات طول ۱ شد
                        serviceH: "1", // 🟢 خدمات عرض ۱ شد
                        ...hoodSpecs.sides 
                    });
                }

                // عرض مفید سقف کلاف بین دو دیواره
                let innerW = w - (2 * thick); 

                // ۳. طاق / سقف کلاف هود (در صورت فعال بودن)
                if (c.enableHoodCeiling !== false) {
                    output.sheet.push({ 
                        w: parseFloat(innerW.toFixed(1)), 
                        h: parseFloat(hoodSideD.toFixed(1)), 
                        count: 1, 
                        label: `سقف کلاف هود U${uId}`, 
                        serviceW: "1", // نوار لبه جلو
                        serviceH: "-", 
                        ...hoodSpecs.ceiling 
                    });
                }
            }



                       else if (c.isUpperTier) {
                // 🟢 بدنه پله دوم: خدمات طول 1S و خدمات عرض -
                output.sheet.push({ w: h, h: d, count: 2, label: `بدنه پله دوم U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });
                
                let innerW = w - (2 * thick);
                let innerD = d - 2.0;
                
                // 🟢 کف/سقف پله دوم: خدمات طول 1 و خدمات عرض -
                output.sheet.push({ w: innerW, h: innerD, count: 2, label: `کف/سقف پله دوم U${uId}`, serviceW: "1", serviceH: "-", ...pieceSpecs.sheet });

                let upperFiberW = w - thick - 0.1; 
                let upperFiberH = h - 0.1;         
                output.fiber.push({ w: upperFiberH, h: upperFiberW, count: 1, label: `فیبر پشت پله دوم U${uId}`, serviceW: "-", serviceH: "-", ...pieceSpecs.fiber });

                processAllCabinetDoors(slotCount, `پله دوم U${uId}`, rotationStrategy, autoWidths, autoHeights);
            }

                       else {
                // 🟢 بدنه دیواری / آبچکان: خدمات طول 1S و خدمات عرض 1
                output.sheet.push({ w: h, h: d, count: 2, label: c.isDishRack ? `بدنه آب‌چکان U${uId}` : `بدنه دیواری U${uId}`, serviceW: "1S", serviceH: "1", ...pieceSpecs.sheet });
                let innerW = w - (2 * thick); 

                 if (c.isDishRack) {
                    let dishRackRoofD = d - 2.0; 
                    // 🟢 تنظیم خدمات طول سقف آب‌چکان روی "1"
                    output.sheet.push({ w: innerW, h: dishRackRoofD, count: 1, label: `سقف آب‌چکان U${uId}`, serviceW: "1", serviceH: "-", ...pieceSpecs.sheet });
                    let dishRackFiberW = w - thick - 0.1;
                    let shelfHeight = h / 2;
                    if (shelfHeight > 40.0) shelfHeight = 40.0;
                    let dishRackFiberH = h - shelfHeight - 0.1;
                    output.fiber.push({ w: dishRackFiberH, h: dishRackFiberW, count: 1, label: `فیبر پشت آب‌چکان U${uId}`, serviceW: "-", serviceH: "-", ...pieceSpecs.fiber });
                } else
 {
                    // 🟢 کف دیواری: خدمات طول 1S و خدمات عرض -
                    output.sheet.push({ w: innerW, h: d, count: 1, label: `کف دیواری U${uId}`, serviceW: "1S", serviceH: "-", ...pieceSpecs.sheet });
                    
                    // 🟢 سقف دیواری: خدمات طول 1 و خدمات عرض -
                    let roofD = d - 2.0; 
                    output.sheet.push({ w: innerW, h: roofD, count: 1, label: `سقف دیواری U${uId}`, serviceW: "1", serviceH: "-", ...pieceSpecs.sheet });
                    
                    let wallFiberW = w - thick - 0.1; 
                    let wallFiberH = h - 0.7;         
                    output.fiber.push({ w: wallFiberH, h: wallFiberW, count: 1, label: `فیبر ۳میل پشت دیواری U${uId}`, serviceW: "-", serviceH: "-", ...pieceSpecs.fiber });
                }

                let cabinetLabel = c.isDishRack ? `کابینت آب‌چکان U${uId}` : `کابینت دیواری U${uId}`;
                processAllCabinetDoors(slotCount, cabinetLabel, rotationStrategy, autoWidths, autoHeights);
            }

        }
      
              // ==========================================
        // 🪵 🟢 محاسبه و تزریق قطعات پاخور (Kickboard) با کسر بادخور و خدمات طول 2
        // ==========================================
        if (c.kickboard && c.kickboard.enabled) {
            const baseKbH = parseFloat(c.kickboard.height) || 14;
            const sides = c.kickboard.sides || {};

            // ⚠️ کسر ۴ میلی‌متر بادخور از ارتفاع پاخور برای نوار PVC
            let finalKbH = baseKbH - 0.4;
            finalKbH = parseFloat((Math.floor((finalKbH + 0.0001) * 10) / 10).toFixed(1));

            // الف) پاخور جلو (طول = عرض کل کابینت | عرض = ارتفاع اصلاح شده)
            if (sides.front) {
                output.sheet.push({
                    w: w,
                    h: finalKbH,
                    count: 1,
                    label: `پاخور جلو U${uId}`,
                    serviceW: "2", // 🟢 خدمات طول روی 2 تنظیم شد
                    serviceH: "-",
                    ...pieceSpecs.kickboard
                });
            }

            // ب) پاخور عقب
            if (sides.back) {
                output.sheet.push({
                    w: w,
                    h: finalKbH,
                    count: 1,
                    label: `پاخور عقب U${uId}`,
                    serviceW: "2", // 🟢 خدمات طول روی 2 تنظیم شد
                    serviceH: "-",
                    ...pieceSpecs.kickboard
                });
            }

            // ج) پاخور چپ (طول = عمق کل کابینت منهای ضخامت‌های پاخور جلو/عقب در صورت وجود)
            if (sides.left) {
                let kbLeftD = d;
                if (sides.front) kbLeftD -= thick;
                if (sides.back) kbLeftD -= thick;

                output.sheet.push({
                    w: parseFloat(kbLeftD.toFixed(1)),
                    h: finalKbH,
                    count: 1,
                    label: `پاخور چپ U${uId}`,
                    serviceW: "2", // 🟢 خدمات طول روی 2 تنظیم شد
                    serviceH: "-",
                    ...pieceSpecs.kickboard
                });
            }

            // د) پاخور راست
            if (sides.right) {
                let kbRightD = d;
                if (sides.front) kbRightD -= thick;
                if (sides.back) kbRightD -= thick;

                output.sheet.push({
                    w: parseFloat(kbRightD.toFixed(1)),
                    h: finalKbH,
                    count: 1,
                    label: `پاخور راست U${uId}`,
                    serviceW: "2", // 🟢 خدمات طول روی 2 تنظیم شد
                    serviceH: "-",
                    ...pieceSpecs.kickboard
                });
            }
        }

// =========================================================================
// 🌟 🛑 ۸. جدید: محاسبه و تزریق هوشمند ابعاد قطعات تاج (Crown) به کات‌مستر
// =========================================================================
if (c.crown && c.crown.enabled) {
    const baseCrH = parseFloat(c.crown.height) || 5;
    const proj = parseFloat(c.crown.projection) || 0;
    const sides = c.crown.sides || {};

    const finalCrH = baseCrH; 

    // 🟢 استخراج دقیق نام، هگز و تکسچر بر اساس ساختار مرکزی پروژه
    const currentColorVal = c.crown.color || "#FFFFFF";
    const isTexture = currentColorVal.startsWith("http://") || currentColorVal.startsWith("https://") || currentColorVal.includes("/");
    
    const crownSpecs = {
        material: 'mdf',
        materialText: 'ام‌دی‌اف (MDF)',
        colorName: c.crown.colorName || 'سفید یخچالی', // اسم دقیق رنگ انتخاب شده
        colorHex: isTexture ? '#FFFFFF' : currentColorVal,
        colorTexture: isTexture ? currentColorVal : '',
        ...pieceSpecs.crown
    };

    // الف) تاج جلو
    let crFrontW = w;
    if (sides.front) {
        crFrontW = w + (sides.left ? thick : 0) + (sides.right ? thick : 0);
        output.sheet.push({
            w: parseFloat(crFrontW.toFixed(1)),
            h: finalCrH,
            count: 1,
            label: `تاج جلو U${uId}`,
            serviceW: "1F", 
            serviceH: "-",
            ...crownSpecs 
        });
    }

    // ب) تاج عقب
    if (sides.back) {
        output.sheet.push({
            w: w,
            h: finalCrH, 
            count: 1,
            label: `تاج عقب U${uId}`,
            serviceW: "2",
            serviceH: "-",
            ...crownSpecs
        });
    }

    // ج) تاج‌های کناری (چپ و راست)
    const extraFront = sides.front ? (thick + proj) : 0;
    const extraBack = sides.back ? thick : 0;
    const totalCrownDepth = d + extraFront + extraBack;
    const finalCrDepth = parseFloat(totalCrownDepth.toFixed(1));

    // ج) تاج چپ
    if (sides.left) {
        output.sheet.push({
            w: finalCrDepth,
            h: finalCrH,
            count: 1,
            label: `تاج چپ U${uId}`,
            serviceW: "1F", 
            serviceH: "-",
            ...crownSpecs
        });
    }

    // د) تاج راست
    if (sides.right) {
        output.sheet.push({
            w: finalCrDepth,
            h: finalCrH,
            count: 1,
            label: `تاج راست U${uId}`,
            serviceW: "1F", 
            serviceH: "-",
            ...crownSpecs
        });
    }

    // هـ) قید اتصال تاج جلو (هم‌اندازه با طول تاج جلو)
    if (sides.front) {
        const finalSubDepth = proj + 5.0; 
        output.sheet.push({
            w: parseFloat(crFrontW.toFixed(1)), 
            h: parseFloat(finalSubDepth.toFixed(1)),
            count: 1,
            label: `قید اتصال تاج جلو U${uId}`, 
            serviceW: "F", 
            serviceH: "-",
            ...crownSpecs
        });
    }

    // و) قیدهای اتصال داخلی ۵ سانتی‌متری کناره چپ و راست
    const supW = 5.0; 

    // قید اتصال چپ
    if (sides.left) {
        output.sheet.push({
            w: finalCrDepth, 
            h: supW,
            count: 1,
            label: `قید اتصال تاج چپ U${uId}`,
            serviceW: "F", 
            serviceH: "-",
            ...crownSpecs
        });
    }

    // قید اتصال راست
    if (sides.right) {
        output.sheet.push({
            w: finalCrDepth, 
            h: supW,
            count: 1,
            label: `قید اتصال تاج راست U${uId}`,
            serviceW: "F", 
            serviceH: "-",
            ...crownSpecs
        });
    }
}




    // =========================================================================
    // 🌟 🛑 ۹. جدید: محاسبه و تزریق هوشمند ابعاد و متریال طبقه‌ها (Shelves) به کات‌مستر
    // =========================================================================
      if (c.shelvesEnabled !== false && c.shelves && Array.isArray(c.shelves) && c.shelves.length > 0) {
        
        c.shelves.forEach((shelf, idx) => {
            const rotation = shelf.rotation ?? 0;
            const isVertical = rotation === 90;

            // ۱. تعیین دقیق ابعاد قطعه (طول و عرض) بر اساس جهت طبقه
            let shelfLengthW = 0;
            let shelfWidthH = 0;

            if (!isVertical) {
                // 🟢 حالت افقی: طول قطعه همان عرض طبقه (width) و عرض قطعه همان عمق طبقه (depth) است
                shelfLengthW = shelf.width !== undefined ? parseFloat(shelf.width) : w;
                shelfWidthH = shelf.depth !== undefined ? parseFloat(shelf.depth) : d;
            } else {
                // 🟠 حالت عمودی: طول قطعه همان ارتفاع طبقه (vertHeight) و عرض قطعه همان عمق طبقه (depth) است
                shelfLengthW = shelf.vertHeight !== undefined ? parseFloat(shelf.vertHeight) : h;
                shelfWidthH = shelf.depth !== undefined ? parseFloat(shelf.depth) : d;
            }

            // تراز و رند کردن اعشار ابعاد جهت تمیزی در نقشه برش
            shelfLengthW = parseFloat((Math.floor((shelfLengthW + 0.0001) * 10) / 10).toFixed(1));
            shelfWidthH = parseFloat((Math.floor((shelfWidthH + 0.0001) * 10) / 10).toFixed(1));

            if (shelfLengthW <= 0 || shelfWidthH <= 0) return;

            // ۲. تشخیص هوشمند متریال، هگز و بافت (تکسچر) اختصاصی این طبقه با پیش‌فرض سفید یخچالی
            const shelfMatType = shelf.material || 'mdf'; // متریال انتخاب شده از سلکتور (mdf, highGloss, leteron)
            
            // 🛠️ اصلاح کلیدی: جایگزینی رنگ فیروزه‌ای/نارنجی با سفید یخچالی پیش‌فرض
            const defaultShelfColor = c.shelvesColor || "#FFFFFF";
            const currentShelfColorVal = shelf.color || defaultShelfColor;

            const isShelfTexture = currentShelfColorVal.startsWith("http://") || currentShelfColorVal.startsWith("https://") || currentShelfColorVal.includes("/");
            
            const shelfSpecs = {
                material: shelfMatType,
                materialText: materialTextMap[shelfMatType] || 'ام‌دی‌اف (MDF)',
                // اصلاح نام رنگ پیش‌فرض در صورت نبودن دیتای انتخابی مستقیم
                colorName: shelf.colorName || (isShelfTexture ? 'تکسچر اختصاصی' : 'سفید یخچالی'),
                colorHex: isShelfTexture ? '#FFFFFF' : currentShelfColorVal,
                colorTexture: isShelfTexture ? currentShelfColorVal : '',
                rotation: isVertical ? 'vertical' : 'horizontal'
            };

            // ۳. تعیین دقیق خدمات نوار لبه (خدمات طول و عرض)
            let sW = "1"; 
            let sH = "-";
            let labelSuffix = isVertical ? `طبقه عمودی ${idx + 1}` : `طبقه افقی ${idx + 1}`;
            
            if (!isVertical && shelf.isGlassHolder) {
                labelSuffix += " (جای لیوانی - برش لبه)";
                sW = "1S"; 
            }

            // ۴. تفکیک و تزریق قطعه به آرایه هدف بر اساس جنس (MDF/High-Gloss/Leteron به آرایه body می‌روند)
            output.sheet.push({
                w: shelfLengthW,
                h: shelfWidthH,
                count: 1,
                label: `${labelSuffix} U${uId}`,
                serviceW: sW,
                serviceH: sH,
                ...shelfSpecs
            });
        });
    }

// =========================================================================
// 🌟 🛑 جدید: محاسبه و استخراج هوشمند ابعاد پنل‌های نما (Facade Panels) به کات‌مستر
// =========================================================================
if (c.facadeConfig && c.facadeConfig.enabled) {
    const fc = c.facadeConfig;
    
    const activeSides = [];
    if (fc.isLeft) activeSides.push({ key: 'Left', text: 'چپ' });
    if (fc.isRight) activeSides.push({ key: 'Right', text: 'راست' });

    if (activeSides.length > 0) {
        let facH = (fc.customLength && parseFloat(fc.customLength) > 0) ? parseFloat(fc.customLength) : h;
        let facW = (fc.customWidth && parseFloat(fc.customWidth) > 0) ? parseFloat(fc.customWidth) : d;

        facH = parseFloat((Math.floor((facH + 0.0001) * 10) / 10).toFixed(1));
        facW = parseFloat((Math.floor((facW + 0.0001) * 10) / 10).toFixed(1));

        activeSides.forEach(side => {
            
            // -------------------------------------------------
            // الف) استخراج بخش نمای ۱۶ میل
            // -------------------------------------------------
            if (fc.is16mm) {
                const f16MatType = c.facade16mmMaterialType || 'mdf';
                const f16ColorVal = c.facade16mmMaterialValue || '#FFFFFF'; 
                const isF16Texture = f16ColorVal.startsWith("http") || f16ColorVal.includes("/") || f16ColorVal.includes(".");

                const facade16mmSpecs = {
                    material: f16MatType,
                    materialText: materialTextMap[f16MatType] || 'ام‌دی‌اف (MDF)',
                    colorName: c.facade16mmColorName || 'سفید یخچالی', 
                    colorHex: isF16Texture ? '#FFFFFF' : f16ColorVal,
                    colorTexture: isF16Texture ? f16ColorVal : '',
                    rotation: 'vertical'
                };

                output.sheet.push({
                    w: facH, 
                    h: facW, 
                    count: 1, 
                    label: `پنل نمای ۱۶میل جانبی ${side.text} U${uId}`,
                    serviceW: "1", 
                    serviceH: "2",  
                    isAuto: true,
                    ...facade16mmSpecs
                });
            }

            // -------------------------------------------------
            // 🌟 ب) استخراج بخش ترمووال (تفکیک تک‌تک شاخه‌ها برای کات‌مستر)
            // -------------------------------------------------
            if (fc.isThermo) {
                const tCount = parseInt(fc.thermoCount) || 1;
                const tWidth = parseFloat(fc.thermoWidth) || 4;

                const thermoMatType = c.facadeThermoMaterialType || 'mdf';
                const thermoColorVal = c.facadeThermoMaterialValue || '#FFFFFF'; 
                const isThermoTexture = thermoColorVal.startsWith("http") || thermoColorVal.includes("/") || thermoColorVal.includes(".");

                const thermoSpecs = {
                    material: thermoMatType,
                    materialText: materialTextMap[thermoMatType] || 'ام‌دی‌اف (MDF)',
                    colorName: c.facadeThermoColorName || 'سفید یخچالی', 
                    colorHex: isThermoTexture ? '#FFFFFF' : thermoColorVal,
                    colorTexture: isThermoTexture ? thermoColorVal : '',
                    rotation: 'vertical'
                };

                // تولید قطعات مجزا به تعداد کل شاخه‌های این سمت جهت جلوگیری از اوررایت بافت‌ها
                for (let i = 0; i < tCount; i++) {
                    output.sheet.push({
                        w: facH,     
                        h: tWidth,   
                        count: 1, // هر شاخه یک قطعه منحصر‌به‌فرد با موقعیت برش اختصاصی است
                        label: `شاخه ترمووال ${i + 1} نمای جانبی ${side.text} U${uId}`,
                        serviceW: "2", 
                        serviceH: "-", 
                        isAuto: true,
                        ...thermoSpecs
                    });
                }
            }

            // -------------------------------------------------
            // ج) استخراج بخش نما صفحه (Worktop)
            // -------------------------------------------------
            if (fc.isWorktop) {
                const wtHeight = parseFloat(fc.worktopHeight) || 5;
                const wtMatType = c.facadeWorktopMaterialType || 'countertop';
                const wtColorVal = c.facadeWorktopMaterialValue || '#FFFFFF'; 
                const isWtTexture = wtColorVal.startsWith("http") || wtColorVal.includes("/") || wtColorVal.includes(".");

                const worktopSpecs = {
                    material: wtMatType,
                    materialText: materialTextMap[wtMatType] || 'صفحه کابینت',
                    colorName: c.facadeWorktopColorName || 'سفید یخچالی', 
                    colorHex: isWtTexture ? '#FFFFFF' : wtColorVal,
                    colorTexture: isWtTexture ? wtColorVal : '',
                    rotation: 'none'
                };

                const targetArray = (wtMatType === 'countertop') ? output.countertop : output.sheet;

                targetArray.push({
                    w: wtHeight,  
                    h: facW,      
                    count: 1,
                    label: `پیشانی نما صفحه جانبی (Worktop) ${side.text} U${uId}`,
                    serviceW: "-",  
                    serviceH: "1F", 
                    isAuto: true,
                    ...worktopSpecs
                });
            }
        });
    }
}

// ==========================================
// 🛑 ۹.۵. محاسبه هوشمند و تزریق ابعاد قطعات کافه بار (Coffee Bar)
// ==========================================
else if (c.isCoffeeBar) {
    const pThickness = thick; // ضخامت استاندارد ۱۶ میل
    const cbParts = c.coffeeBarParts || {};

    const getPartSpecs = (partName) => {
        const partConf = cbParts[partName] || { mat: 'mdf', color: '#FFFFFF', colorName: 'سفید یخچالی' };
        const pMat = partConf.mat || 'mdf';
        const pColor = partConf.color || '#FFFFFF';
        const isTex = pColor.startsWith("http") || pColor.includes("/") || pColor.includes(".");

        return {
            material: pMat,
            materialText: materialTextMap[pMat] || 'ام‌دی‌اف (MDF)',
            colorName: partConf.colorName || 'سفید یخچالی',
            colorHex: isTex ? '#FFFFFF' : pColor,
            colorTexture: isTex ? pColor : '',
            rotation: 'vertical'
        };
    };

    // ۱. ورق پشت
    if (!cbParts.back || cbParts.back.active !== false) {
        output.sheet.push({
            w: h,
            h: w,
            count: 1,
            label: `ورق پشت ۱۶میل کافه بار U${uId}`,
            serviceW: "1",
            serviceH: "-",
            ...getPartSpecs('back')
        });
    }

    const sideDepth = d - pThickness;

    // ۲. دیواره‌های چپ و راست
    if (!cbParts.left || cbParts.left.active !== false) {
        output.sheet.push({
            w: h,
            h: parseFloat(sideDepth.toFixed(1)),
            count: 1,
            label: `دیواره چپ کافه بار U${uId}`,
            serviceW: "1S",
            serviceH: "-",
            ...getPartSpecs('left')
        });
    }

    if (!cbParts.right || cbParts.right.active !== false) {
        output.sheet.push({
            w: h,
            h: parseFloat(sideDepth.toFixed(1)),
            count: 1,
            label: `دیواره راست کافه بار U${uId}`,
            serviceW: "1S",
            serviceH: "-",
            ...getPartSpecs('right')
        });
    }

    const topBottomW = w - (2 * pThickness);

    // ۳. ورق سقف
    if (!cbParts.top || cbParts.top.active !== false) {
        output.sheet.push({
            w: parseFloat(topBottomW.toFixed(1)),
            h: parseFloat(sideDepth.toFixed(1)),
            count: 1,
            label: `سقف کافه بار U${uId}`,
            serviceW: "1",
            serviceH: "-",
            ...getPartSpecs('top')
        });
    }

    // ۴. ورق کف
    if (!cbParts.bottom || cbParts.bottom.active !== false) {
        output.sheet.push({
            w: parseFloat(topBottomW.toFixed(1)),
            h: parseFloat(sideDepth.toFixed(1)),
            count: 1,
            label: `کف کافه بار U${uId}`,
            serviceW: "1S",
            serviceH: "-",
            ...getPartSpecs('bottom')
        });
    }

    // ۵. پیشخوان جلویی کافه بار (تک لیبل همسان برای اتصال صحیح تکسچر)
    if (cbParts.front && cbParts.front.active) {
        const frontConf = cbParts.front;
        const innerHalfW = (w / 2) - pThickness;
        const innerW = innerHalfW * 2;

        if (frontConf.isCurved) {
            const panelHeight = parseFloat(frontConf.height) || 80;
            output.sheet.push({
                w: parseFloat(panelHeight.toFixed(1)),
                h: parseFloat(innerW.toFixed(1)),
                count: 1,
                label: `پیشخوان جلوی کافه بار U${uId}`,
                serviceW: "1",
                serviceH: "1",
                ...getPartSpecs('front')
            });
        } else {
            const innerH = h - (2 * pThickness);
            output.sheet.push({
                w: parseFloat(innerH.toFixed(1)),
                h: parseFloat(innerW.toFixed(1)),
                count: 1,
                label: `پیشخوان جلوی کافه بار U${uId}`,
                serviceW: "1S",
                serviceH: "1S",
                ...getPartSpecs('front')
            });
        }
    }

    // ۶. پردازش درب‌ها
    if (c.showDoors && slotCount > 0) {
        let autoWidths = [];
        let totalGap = slotCount === 2 ? 0.1 : 0.5;
        let stdW = (w - totalGap) / slotCount;
        for (let i = 0; i < slotCount; i++) autoWidths.push(stdW);
        
        processAllCabinetDoors(slotCount, `درب کافه بار U${uId}`, 'vertical', autoWidths);
    }
}






    });
       // =========================================================================
    // 🌟 🛑 جدید: جمع‌آوری اطلاعات ورق‌های بین کابینتی طراحی شده (Backsplash Panels)
    // =========================================================================
    if (typeof window.interPanels !== 'undefined' && Array.isArray(window.interPanels) && window.interPanels.length > 0) {
        window.interPanels.forEach((p, idx) => {
            if (p.enabled === false) return;

            let pLength = parseFloat(p.length) || 0;
            let pWidth = parseFloat(p.width) || 0;

            // رند کردن اعشار ابعاد جهت هماهنگی با کات‌مستر
            pLength = parseFloat((Math.floor((pLength + 0.0001) * 10) / 10).toFixed(1));
            pWidth = parseFloat((Math.floor((pWidth + 0.0001) * 10) / 10).toFixed(1));

            if (pLength <= 0 || pWidth <= 0) return;

            const pColorVal = p.color || "#FFFFFF";
            const isTex = pColorVal.startsWith("http") || pColorVal.includes("/") || pColorVal.includes(".");
            
            // اگر متریال ماربل شیت بود کلید نهایی را backsplash می‌گذاریم
            const matType = p.materialType === 'marbleSheet' ? 'backsplash' : (p.materialType || 'mdf');

            const wallNameMap = { 'back': 'روبرو', 'left': 'چپ', 'right': 'راست', 'front': 'جلو' };
            const wallLabel = wallNameMap[p.wall] || 'نامشخص';

            output.backsplash.push({
                w: pLength, // طول ورق بین کابینتی
                h: pWidth,  // عرض (ارتفاع) ورق بین کابینتی
                count: 1,
                label: `ورق بین کابینتی ${idx + 1} (دیوار ${wallLabel})`,
                serviceW: "-", 
                serviceH: "-",
                material: matType,
                materialText: materialTextMap[matType] || (p.materialType === 'marbleSheet' ? 'ماربل شیت' : 'ام‌دی‌اف (MDF)'),
                colorName: p.colorName || 'سفید',
                colorHex: isTex ? '#FFFFFF' : pColorVal,
                colorTexture: isTex ? pColorVal : '',
                rotation: 'none',
                isAuto: true
            });
        });
    }
 
// =========================================================================
// 🌟 🛑 ۱۰. اصلاح شده: جمع‌آوری اطلاعات صفحات کابینت و ارسال به تب اختصاصی
// =========================================================================
if (typeof allCountertops !== 'undefined' && Array.isArray(allCountertops) && allCountertops.length > 0) {
    
    allCountertops.forEach((ct, idx) => {
        if (ct.enabled === false) return;

        let ctLengthW = parseFloat(ct.length) || 0;
        let ctWidthH = parseFloat(ct.width) || 0;

        ctLengthW = parseFloat((Math.floor((ctLengthW + 0.0001) * 10) / 10).toFixed(1));
        ctWidthH = parseFloat((Math.floor((ctWidthH + 0.0001) * 10) / 10).toFixed(1));

        if (ctLengthW <= 0 || ctWidthH <= 0) return;

        const currentColorVal = ct.color || "#FFFFFF";
        const isTexture = currentColorVal.startsWith("http://") || currentColorVal.startsWith("https://") || currentColorVal.includes("/");
        
        let colorName = "سفید مات";
        let detectedMaterial = "countertop"; 
        let detectedMaterialText = "صفحه کابینت"; 

        if (typeof findCountertopMaterialByValue === 'function') {
            const matObj = findCountertopMaterialByValue(currentColorVal);
            if (matObj) {
                colorName = matObj.name || colorName;
                
                if (typeof allMaterials !== 'undefined') {
                    if (allMaterials.mdf && allMaterials.mdf.some(m => m.code === currentColorVal || m.texture === currentColorVal)) {
                        detectedMaterial = "mdf";
                        detectedMaterialText = "ام‌دی‌اف (MDF)";
                    }
                }
            }
        } else if (typeof getCountertopColorNameByValue === 'function') {
            colorName = getCountertopColorNameByValue(currentColorVal);
        }

        const countertopSpecs = {
            material: detectedMaterial,          
            materialText: detectedMaterialText,  
            colorName: colorName,
            colorHex: isTexture ? '#FFFFFF' : currentColorVal,
            colorTexture: isTexture ? currentColorVal : '',
            rotation: 'none'
        };

        let sW = "1"; 
        let sH = "-";
        
        // 🌟 ساخت نام کلید استاندارد و بدون کاراکترهای مزاحم
        const standardLabel = `صفحه کابینت ${idx + 1} (هوشمند)`;

        // ذخیره اندیس روی خود شیء اصلی برای دسترسی راحت‌تر در لوپ‌های بعدی
        ct.countertopIndex = idx; 

        output.countertop.push({
            w: ctLengthW,
            h: ctWidthH,
            count: 1,
            label: standardLabel, 
            serviceW: sW,
            serviceH: sH,
            isAuto: true, 
            ...countertopSpecs
        });
    });
}





    
    if (typeof globalManualPieces !== 'undefined' && globalManualPieces.length > 0) {
        globalManualPieces.forEach((p, idx) => {
            if (output[p.type]) {
                output[p.type].push({
                    w: p.w,
                    h: p.h,
                    count: p.count,
                    label: p.label || `قطعه دستی شماره ${idx + 1}`,
                    material: p.material, 
                    materialText: p.materialText,
                    colorName: p.colorName,
                    colorHex: p.colorHex,
                    colorTexture: p.colorTexture,
                    serviceW: p.serviceW || '-', 
                    serviceH: p.serviceH || '-',
                    rotation: p.rotation || 'none',
                    isAuto: false 
                });
            }
        });
    }

        // اعمال اورراید چرخش برای صفحات کابینت در صورت وجود
    if (typeof autoPiecesRotationOverrides !== 'undefined') {
    ['sheet', 'backsplash', 'fiber', 'pvc', 'countertop'].forEach(type => {
        if (output[type]) {
            output[type].forEach(p => {
                if (p.isAuto !== false && autoPiecesRotationOverrides[p.label]) {
                    p.rotation = autoPiecesRotationOverrides[p.label];
                }
            });
        }
    });
}


    // فیلتر کردن قطعات با ابعاد صفر یا نامعتبر
['sheet', 'backsplash', 'fiber', 'pvc', 'countertop'].forEach(type => {
    if (output[type]) {
        output[type] = output[type].filter(p => p.w > 0.1 && p.h > 0.1);
    }
});

    return output;
}
window.collectPieces = collectPieces;
