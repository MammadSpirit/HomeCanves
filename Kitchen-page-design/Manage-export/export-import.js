// --- تابع خروجی گرفتن از طراحی (Export) ---
function exportDesign() {
   const designData = {
    room: typeof room !== 'undefined' ? room : { w: 0, d: 0, h: 280 },
    cabinets: typeof cabinets !== 'undefined' ? cabinets : [],
    pillars: typeof pillars !== 'undefined' ? pillars : [],
    roomWindows: typeof roomWindows !== 'undefined' ? roomWindows : (window.roomWindows || []),
    roomDoors: typeof roomDoors !== 'undefined' ? roomDoors : (window.roomDoors || []),

    customWalls: window.customWalls || [],

    allCountertops: typeof allCountertops !== 'undefined' ? allCountertops : [],

    roomStyle: typeof Kitchen3D !== 'undefined' && Kitchen3D.config ? {
        wallColor: Kitchen3D.config.wallColor,
        floorColor: Kitchen3D.config.floorColor,
        ceilingColor: Kitchen3D.config.ceilingColor,
        hasTop: Kitchen3D.config.hasTop,
        hasLeft: Kitchen3D.config.hasLeft,
        hasRight: Kitchen3D.config.hasRight,
        hasBottom: Kitchen3D.config.hasBottom
    } : null
};


    const dataStr = JSON.stringify(designData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                    (date.getMonth() + 1).toString().padStart(2, '0') + 
                    date.getDate().toString().padStart(2, '0');
    a.download = `kitchen-design-${dateStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// --- تابع وارد کردن طراحی (Import) ---
function importDesign(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            if (importedData.room && typeof room !== 'undefined') {
                Object.assign(room, importedData.room); 
                if (document.getElementById("master-room-w")) document.getElementById("master-room-w").value = room.w;
                if (document.getElementById("master-room-d")) document.getElementById("master-room-d").value = room.d;
                if (document.getElementById("master-room-h")) document.getElementById("master-room-h").value = room.h;
            }

            if (importedData.cabinets && typeof cabinets !== 'undefined') {
                cabinets.length = 0; 
                cabinets.push(...importedData.cabinets); 
            }

            if (importedData.pillars && typeof pillars !== 'undefined') {
                pillars.length = 0;
                pillars.push(...importedData.pillars);
            }

            if (importedData.roomWindows) {
                if (typeof roomWindows !== 'undefined') {
                    roomWindows.length = 0;
                    roomWindows.push(...importedData.roomWindows);
                } else { window.roomWindows = importedData.roomWindows; }
            }
            if (importedData.roomDoors) {
                 if (typeof roomDoors !== 'undefined') {
                    roomDoors.length = 0;
                    roomDoors.push(...importedData.roomDoors);
                } else { window.roomDoors = importedData.roomDoors; }
            }
if (importedData.customWalls) {
    window.customWalls.length = 0;
    window.customWalls.push(...importedData.customWalls);

    if (
        typeof KitchenPanelManager !== 'undefined' &&
        typeof KitchenPanelManager.renderCustomWallsList === 'function'
    ) {
        KitchenPanelManager.renderCustomWallsList();
    }
}
            // لود کردن آرایه صحیح صفحات:
            if (importedData.allCountertops && typeof allCountertops !== 'undefined') {
                allCountertops.length = 0;
                allCountertops.push(...importedData.allCountertops);
            }
// 👈 لود کردن وضعیت رنگ‌ها و دیوارهای محیطی و همگام‌سازی چک‌باکس‌ها
if (importedData.roomStyle && typeof Kitchen3D !== 'undefined' && Kitchen3D.config) {
    if (importedData.roomStyle.wallColor !== undefined) Kitchen3D.config.wallColor = importedData.roomStyle.wallColor;
    if (importedData.roomStyle.floorColor !== undefined) Kitchen3D.config.floorColor = importedData.roomStyle.floorColor;
    if (importedData.roomStyle.ceilingColor !== undefined) Kitchen3D.config.ceilingColor = importedData.roomStyle.ceilingColor;
    
    if (importedData.roomStyle.hasTop !== undefined) {
        Kitchen3D.config.hasTop = importedData.roomStyle.hasTop;
        const cb = document.getElementById("wall-top");
        if (cb) cb.checked = importedData.roomStyle.hasTop;
    }
    if (importedData.roomStyle.hasLeft !== undefined) {
        Kitchen3D.config.hasLeft = importedData.roomStyle.hasLeft;
        const cb = document.getElementById("wall-left");
        if (cb) cb.checked = importedData.roomStyle.hasLeft;
    }
    if (importedData.roomStyle.hasRight !== undefined) {
        Kitchen3D.config.hasRight = importedData.roomStyle.hasRight;
        const cb = document.getElementById("wall-right");
        if (cb) cb.checked = importedData.roomStyle.hasRight;
    }
    if (importedData.roomStyle.hasBottom !== undefined) {
        Kitchen3D.config.hasBottom = importedData.roomStyle.hasBottom;
        const cb = document.getElementById("wall-bottom");
        if (cb) cb.checked = importedData.roomStyle.hasBottom;
    }
}


            if (typeof selectedId !== 'undefined') selectedId = -1;
            if (typeof selectedPillarId !== 'undefined') selectedPillarId = -1;

            if (typeof draw === 'function') draw();
            
            // یک تأخیر بسیار کوتاه (100 میلی‌ثانیه) اضافه شد تا متغیرها کاملاً جایگزین شوند و بعد رندر سه بعدی اجرا شود
            setTimeout(() => {

    if (typeof draw === 'function') {
        draw();
    }

    if (typeof Kitchen3D !== 'undefined' &&
        typeof Kitchen3D.refreshRoom === 'function') {
        Kitchen3D.refreshRoom();
    }

    if (typeof updateAllCountertopsIn3D === 'function')
        updateAllCountertopsIn3D();

    if (typeof updateAllCabinetCrownsIn3D === 'function')
        updateAllCabinetCrownsIn3D();

}, 100);

            alert("طراحی با موفقیت بارگذاری شد!");

        } catch (error) {
            console.error("خطا در خواندن فایل طراحی:", error);
            alert("فایل انتخاب شده نامعتبر است یا با ساختار طراحی همخوانی ندارد.");
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}


