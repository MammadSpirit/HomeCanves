// تعریف آرایه‌های گلوبال برای نگهداری پنجره‌ها و درب‌ها
window.roomWindows = window.roomWindows || [];
window.roomDoors = window.roomDoors || [];
window.customWalls = window.customWalls || [];

// پر کردن لیست دیوارها برای درب و پنجره (اصلی + کاستوم)
function refreshWallSelectOptions() {
    const selects = ["window-wall", "door-wall"];
    const mainOpts = [
        { value: "top", label: "دیوار بالا" },
        { value: "bottom", label: "دیوار پایین" },
        { value: "left", label: "دیوار چپ" },
        { value: "right", label: "دیوار راست" }
    ];
    selects.forEach(selId => {
        const sel = document.getElementById(selId);
        if (!sel) return;
        const prev = sel.value;
        sel.innerHTML = "";
        mainOpts.forEach(o => {
            const opt = document.createElement("option");
            opt.value = o.value;
            opt.textContent = o.label;
            sel.appendChild(opt);
        });
        if (window.customWalls && window.customWalls.length) {
            window.customWalls.forEach((w, i) => {
                const opt = document.createElement("option");
                opt.value = w.id;
                const targetName = ({ top: "بالا", bottom: "پایین", left: "چپ", right: "راست" })[w.targetWall] || w.targetWall || "";
                opt.textContent = `کاستوم ${i + 1}` + (targetName ? ` (متصل به ${targetName})` : "");
                sel.appendChild(opt);
            });
        }
        // حفظ انتخاب قبلی اگر هنوز معتبر است
        if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
    });
}
window.refreshWallSelectOptions = refreshWallSelectOptions;


const KitchenPanelManager = {
    
    // باز کردن پنل یکپارچه و مقداردهی اولیه فیلدها
    openMasterPanel: function() {
        
        // بررسی وجود متغیر room (برای جلوگیری از خطای لود نشدن فایل design)
        if (typeof room === 'undefined') {
            console.error("خطا: فایل design.js لود نشده یا متغیر room در دسترس نیست.");
            return; // خروج از تابع برای جلوگیری از کرش کردن
        }

        // 🌟 بررسی و ایجاد دیوارهای پیش‌فرض (حذف window. از پشت room)
        if (!room.walls) {
            room.walls = {
                top: { len: room.w || 400, angle: 0, wallSide: 'back' },
                bottom: { len: room.w || 400, angle: 180, wallSide: 'back' },
                left: { len: room.d || 300, angle: 90, wallSide: 'back' },
                right: { len: room.d || 300, angle: -90, wallSide: 'back' }
            };
        }

        document.getElementById("master-room-w").value = room.w.toFixed(1);
        document.getElementById("master-room-d").value = room.d.toFixed(1);
        document.getElementById("master-room-h").value = room.h || 280;

        // خواندن مقادیر طول و زاویه هر دیوار
        document.getElementById("wall-top-len").value = room.walls.top.len;
        document.getElementById("wall-top-angle").value = room.walls.top.angle;
        // 🟢 خواندن سمت دیوار بالا
        document.getElementById("wall-top-side").value = room.walls.top.wallSide || 'back';
        
        document.getElementById("wall-bottom-len").value = room.walls.bottom.len;
        document.getElementById("wall-bottom-angle").value = room.walls.bottom.angle;
        // 🟢 خواندن سمت دیوار پایین
        document.getElementById("wall-bottom-side").value = room.walls.bottom.wallSide || 'back';
        
        document.getElementById("wall-left-len").value = room.walls.left.len;
        document.getElementById("wall-left-angle").value = room.walls.left.angle;
        // 🟢 خواندن سمت دیوار چپ
        document.getElementById("wall-left-side").value = room.walls.left.wallSide || 'back';
        
        document.getElementById("wall-right-len").value = room.walls.right.len;
        document.getElementById("wall-right-angle").value = room.walls.right.angle;
        // 🟢 خواندن سمت دیوار راست
        document.getElementById("wall-right-side").value = room.walls.right.wallSide || 'back';
       // خواندن رنگ‌ها و استایل‌های فعلی از Kitchen3D
if (typeof Kitchen3D !== 'undefined' && Kitchen3D.config) {

    // پس‌زمینه و سقف (اگر هنوز در HTML هستن)
    const bgEl = document.getElementById("color-background");
    if (bgEl) bgEl.value = "#" + new THREE.Color(Kitchen3D.config.backgroundColor || 0xf5f5f7).getHexString();

    const ceilEl = document.getElementById("color-ceiling");
    if (ceilEl) ceilEl.value = "#" + new THREE.Color(Kitchen3D.config.ceilingColor || 0xffffff).getHexString();
    if (document.getElementById('ceiling-thickness')) {
        document.getElementById('ceiling-thickness').value = Kitchen3D.config.ceilingThickness != null ? Kitchen3D.config.ceilingThickness : 18;
    }
    if (document.getElementById('ceiling-roughness')) {
        const rv = String(Kitchen3D.config.ceilingRoughness != null ? Kitchen3D.config.ceilingRoughness : 0.82);
        const sel = document.getElementById('ceiling-roughness');
        let best = '0.82', bestDiff = 99;
        Array.from(sel.options).forEach(o => {
            const d = Math.abs(parseFloat(o.value) - parseFloat(rv));
            if (d < bestDiff) { bestDiff = d; best = o.value; }
        });
        sel.value = best;
    }
    if (document.getElementById('ceiling-cornice')) {
        document.getElementById('ceiling-cornice').value = (Kitchen3D.config.ceilingCornice === false) ? '0' : '1';
    }
    if (document.getElementById('ceiling-cornice-h')) {
        document.getElementById('ceiling-cornice-h').value = Kitchen3D.config.ceilingCorniceH != null ? Kitchen3D.config.ceilingCorniceH : 6;
    }

    // ---------- دیوار ----------
    const wallStyleEl = document.getElementById('wall-style');
    if (wallStyleEl) {
        wallStyleEl.value = Kitchen3D.config.wallStyle || 'ceramic';
        const ceramicColors = document.getElementById('wall-ceramic-colors');
        if (ceramicColors) {
            ceramicColors.style.display = (wallStyleEl.value === 'ceramic') ? 'block' : 'none';
        }
    }

    // رنگ‌های باند دیوار
    if (document.getElementById('wall-band-lower1')) document.getElementById('wall-band-lower1').value = Kitchen3D.config.wallBandLowerColor1 || '#fdfbf7';
    if (document.getElementById('wall-band-lower2')) document.getElementById('wall-band-lower2').value = Kitchen3D.config.wallBandLowerColor2 || '#f4f1ea';
    if (document.getElementById('wall-band-mid1'))   document.getElementById('wall-band-mid1').value   = Kitchen3D.config.wallBandMidColor1   || '#161616';
    if (document.getElementById('wall-band-mid2'))   document.getElementById('wall-band-mid2').value   = Kitchen3D.config.wallBandMidColor2   || '#1d1d1d';
    if (document.getElementById('wall-band-upper1')) document.getElementById('wall-band-upper1').value = Kitchen3D.config.wallBandUpperColor1 || '#fdfbf7';
    if (document.getElementById('wall-band-upper2')) document.getElementById('wall-band-upper2').value = Kitchen3D.config.wallBandUpperColor2 || '#f4f1ea';
    if (document.getElementById('wall-grout-color')) document.getElementById('wall-grout-color').value = Kitchen3D.config.wallGroutColor || '#c8c2b8';
    if (document.getElementById('wall-finish-roughness')) {
        const rv = String(Kitchen3D.config.wallRoughness != null ? Kitchen3D.config.wallRoughness : 0.42);
        const sel = document.getElementById('wall-finish-roughness');
        // نزدیک‌ترین گزینه
        let best = '0.42';
        let bestDiff = 99;
        Array.from(sel.options).forEach(o => {
            const d = Math.abs(parseFloat(o.value) - parseFloat(rv));
            if (d < bestDiff) { bestDiff = d; best = o.value; }
        });
        sel.value = best;
    }

    // ---------- کف ----------
    const floorStyleEl = document.getElementById('floor-style');
    if (floorStyleEl) {
        floorStyleEl.value = Kitchen3D.config.floorStyle || 'ceramic';
        const floorCeramic = document.getElementById('floor-ceramic-colors');
        if (floorCeramic) {
            floorCeramic.style.display = (floorStyleEl.value === 'ceramic') ? 'block' : 'none';
        }
    }

    // رنگ‌های سرامیک کف
    if (document.getElementById('floor-tile1')) document.getElementById('floor-tile1').value = Kitchen3D.config.floorTileColor1 || '#DCD3C6';
    if (document.getElementById('floor-tile2')) document.getElementById('floor-tile2').value = Kitchen3D.config.floorTileColor2 || '#CFC4B5';
    if (document.getElementById('floor-grout')) document.getElementById('floor-grout').value = Kitchen3D.config.floorGroutColor || '#9a8f82';
    if (document.getElementById('floor-tile-size')) {
        const ts = String(Kitchen3D.config.floorTileSizeCm != null ? Kitchen3D.config.floorTileSizeCm : 60);
        document.getElementById('floor-tile-size').value = ts;
    }
    if (document.getElementById('floor-finish-roughness')) {
        const rv = String(Kitchen3D.config.floorRoughness != null ? Kitchen3D.config.floorRoughness : 0.38);
        const sel = document.getElementById('floor-finish-roughness');
        let best = '0.38', bestDiff = 99;
        Array.from(sel.options).forEach(o => {
            const d = Math.abs(parseFloat(o.value) - parseFloat(rv));
            if (d < bestDiff) { bestDiff = d; best = o.value; }
        });
        sel.value = best;
    }
}

        // رندر کردن لیست‌ها
        this.renderWindowsList();
        this.renderDoorsList(); 

        // نمایش پنل
        if (typeof refreshWallSelectOptions === "function") refreshWallSelectOptions();
        document.getElementById("room-master-panel").classList.add("active");
    },

       // 🎨 مدیریت تغییر رنگ‌ها در زمان واقعی
    changeColor: function(type, hexValue) {
        // چک می‌کنیم تنظیمات در دسترس باشد
        if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
        
        const numericColor = parseInt(hexValue.replace('#', '0x'), 16);
        
        // ۱. همیشه رنگ را در تنظیمات اصلی ذخیره کن (چه سه‌بعدی باز باشد، چه بسته)
        if (type === 'background') Kitchen3D.config.backgroundColor = numericColor;
        if (type === 'floor') Kitchen3D.config.floorColor = numericColor;
        if (type === 'wall') Kitchen3D.config.wallColor = numericColor;
        if (type === 'ceiling') Kitchen3D.config.ceilingColor = numericColor;
        
        // ۲. اگر نمای سه‌بعدی در حال حاضر باز است، تغییرات را فوراً نمایش بده
        if (Kitchen3D.scene) {
            if (type === 'background') {
                Kitchen3D.scene.background.setHex(numericColor);
            } else {
                // بازسازی محیط برای اعمال رنگ‌های جدید به دیوار، کف و سقف
                if (typeof Kitchen3D.refreshRoom === 'function') {
                    Kitchen3D.refreshRoom(); 
                }
            }
        }
    },
// 🆕 تغییر استایل دیوار (سرامیک / سفید)
changeWallStyle: function(style) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    Kitchen3D.config.wallStyle = style;

    // نمایش/مخفی کردن رنگ‌های سرامیک
    const ceramicColors = document.getElementById('wall-ceramic-colors');
    if (ceramicColors) {
        ceramicColors.style.display = (style === 'ceramic') ? 'block' : 'none';
    }

    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') {
        Kitchen3D.refreshRoom();
    }
},

// 🆕 تغییر رنگ باندهای دیوار
changeWallBandColor: function(band, hexValue) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;

    if (band === 'lower1') Kitchen3D.config.wallBandLowerColor1 = hexValue;
    if (band === 'lower2') Kitchen3D.config.wallBandLowerColor2 = hexValue;
    if (band === 'mid1')   Kitchen3D.config.wallBandMidColor1   = hexValue;
    if (band === 'mid2')   Kitchen3D.config.wallBandMidColor2   = hexValue;
    if (band === 'upper1') Kitchen3D.config.wallBandUpperColor1 = hexValue;
    if (band === 'upper2') Kitchen3D.config.wallBandUpperColor2 = hexValue;

    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') {
        Kitchen3D.refreshRoom();
    }
},

// 🆕 رنگ بند سرامیک دیوار
changeCeilingThickness: function(value) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    Kitchen3D.config.ceilingThickness = parseFloat(value) || 18;
    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') Kitchen3D.refreshRoom();
},
changeCeilingRoughness: function(value) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    Kitchen3D.config.ceilingRoughness = parseFloat(value) || 0.82;
    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') Kitchen3D.refreshRoom();
},
changeCeilingCornice: function(value) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    Kitchen3D.config.ceilingCornice = (value === '1' || value === 1 || value === true);
    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') Kitchen3D.refreshRoom();
},
changeCeilingCorniceSize: function(which, value) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    if (which === 'h') Kitchen3D.config.ceilingCorniceH = parseFloat(value) || 6;
    if (which === 'd') Kitchen3D.config.ceilingCorniceD = parseFloat(value) || 5;
    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') Kitchen3D.refreshRoom();
},

changeWallGroutColor: function(hexValue) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    Kitchen3D.config.wallGroutColor = hexValue;
    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') {
        Kitchen3D.refreshRoom();
    }
},

// 🆕 زبری / پرداخت سطح دیوار
changeWallRoughness: function(value) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    Kitchen3D.config.wallRoughness = parseFloat(value) || 0.42;
    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') {
        Kitchen3D.refreshRoom();
    }
},

// 🆕 تغییر استایل کف (سرامیک / پارکت)
changeFloorStyle: function(style) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    Kitchen3D.config.floorStyle = style;

    const ceramicColors = document.getElementById('floor-ceramic-colors');
    if (ceramicColors) {
        ceramicColors.style.display = (style === 'ceramic') ? 'block' : 'none';
    }

    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') {
        Kitchen3D.refreshRoom();
    }
},

// 🆕 تغییر رنگ سرامیک کف
changeFloorTileColor: function(part, hexValue) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;

    if (part === 'tile1') Kitchen3D.config.floorTileColor1 = hexValue;
    if (part === 'tile2') Kitchen3D.config.floorTileColor2 = hexValue;
    if (part === 'grout') Kitchen3D.config.floorGroutColor = hexValue;

    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') {
        Kitchen3D.refreshRoom();
    }
},

changeFloorTileSize: function(value) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    Kitchen3D.config.floorTileSizeCm = parseFloat(value) || 60;
    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') {
        Kitchen3D.refreshRoom();
    }
},

changeFloorRoughness: function(value) {
    if (typeof Kitchen3D === 'undefined' || !Kitchen3D.config) return;
    Kitchen3D.config.floorRoughness = parseFloat(value) || 0.38;
    if (Kitchen3D.scene && typeof Kitchen3D.refreshRoom === 'function') {
        Kitchen3D.refreshRoom();
    }
},


    // بستن پنل
    closeMasterPanel: function() {
        document.getElementById("room-master-panel").classList.remove("active");
    },

    // ----------------------------------------------------------------
    // مدیریت پنجره‌ها
    // ----------------------------------------------------------------
    addWindow: function() {
        const wall = document.getElementById("window-wall").value;
        const w = parseFloat(document.getElementById("window-width").value);
        const h = parseFloat(document.getElementById("window-height").value);
        const offset = parseFloat(document.getElementById("window-offset").value);
        
        const elevationVal = document.getElementById("window-elevation").value;
        const elevation = elevationVal !== "" ? parseFloat(elevationVal) : 90;

        if (!w || !h || isNaN(offset) || isNaN(elevation) || w <= 0 || h <= 0 || offset < 0 || elevation < 0) {
            alert("لطفاً ابعاد و فواصل پنجره را به درستی وارد کنید.");
            return;
        }

        window.roomWindows.push({ type: 'window', wall: wall, w: w, h: h, offset: offset, elevation: elevation });
        
        document.getElementById("window-width").value = "";
        document.getElementById("window-height").value = "";
        document.getElementById("window-offset").value = "";
        document.getElementById("window-elevation").value = "";

        this.renderWindowsList();
        this._refreshSystem();
    },

    removeWindow: function(index) {
        window.roomWindows.splice(index, 1);
        this.renderWindowsList();
        this._refreshSystem();
    },

    editWindow: function(index) {
        const win = window.roomWindows[index];
        document.getElementById("window-wall").value = win.wall;
        document.getElementById("window-width").value = win.w;
        document.getElementById("window-height").value = win.h;
        document.getElementById("window-offset").value = win.offset;
        document.getElementById("window-elevation").value = win.elevation;
        this.removeWindow(index);
    },

    renderWindowsList: function() {
        const listDiv = document.getElementById("windows-list");
        if (!listDiv) return;
        listDiv.innerHTML = ""; 

        const wallNames = { top: "بالا", bottom: "پایین", left: "چپ", right: "راست" };
        const wallLabel = (id) => {
            if (wallNames[id]) return wallNames[id];
            const idx = (window.customWalls || []).findIndex(w => w.id === id);
            return idx >= 0 ? `کاستوم ${idx + 1}` : (id || "?");
        };

        window.roomWindows.forEach((win, index) => {
            const item = document.createElement("div");
            item.style.display = "flex";
            item.style.justifyContent = "space-between";
            item.style.alignItems = "center";
            item.style.background = "#1e293b"; 
            item.style.padding = "8px";
            item.style.borderRadius = "6px";
            item.style.fontSize = "11px";
            item.style.borderRight = "3px solid #0ea5e9"; 

            item.innerHTML = `
                <span style="color: #cbd5e1; line-height: 1.5;">
                    🪟 ${wallLabel(win.wall)} | ابعاد: ${win.w}×${win.h}<br>
                    ↔️ افقی: ${win.offset} | ↕️ از کف: ${win.elevation}
                </span>
                <div style="display: flex; gap: 5px;">
                    <button onclick="editWindowElement(${index})" style="background: #eab308; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">ویرایش</button>
                    <button onclick="removeWindowElement(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">حذف</button>
                </div>
            `;
            listDiv.appendChild(item);
        });
    },

    // ----------------------------------------------------------------
    // 🌟 مدیریت درب‌ها (بخش جدید)
    // ----------------------------------------------------------------
    addDoor: function() {
        const wall = document.getElementById("door-wall").value;
        const w = parseFloat(document.getElementById("door-width").value);
        const h = parseFloat(document.getElementById("door-height").value);
        const offset = parseFloat(document.getElementById("door-offset").value);
        
        if (!w || !h || isNaN(offset) || w <= 0 || h <= 0 || offset < 0) {
            alert("لطفاً ابعاد و فواصل درب را به درستی وارد کنید.");
            return;
        }

        // درب‌ها معمولاً روی کف قرار می‌گیرند، بنابراین elevation صفر است
        window.roomDoors.push({ type: 'door', wall: wall, w: w, h: h, offset: offset, elevation: 0 });
        
        // پاک کردن مقدار فاصله افقی (ابعاد معمولاً ثابت می‌مانند پس پاک نمی‌کنیم)
        document.getElementById("door-offset").value = "";

        this.renderDoorsList();
        this._refreshSystem();
    },

    removeDoor: function(index) {
        window.roomDoors.splice(index, 1);
        this.renderDoorsList();
        this._refreshSystem();
    },

    editDoor: function(index) {
        const door = window.roomDoors[index];
        document.getElementById("door-wall").value = door.wall;
        document.getElementById("door-width").value = door.w;
        document.getElementById("door-height").value = door.h;
        document.getElementById("door-offset").value = door.offset;
        this.removeDoor(index);
    },

    renderDoorsList: function() {
        const listDiv = document.getElementById("doors-list");
        if (!listDiv) return;
        listDiv.innerHTML = ""; 

        const wallNames = { top: "بالا", bottom: "پایین", left: "چپ", right: "راست" };
        const wallLabel = (id) => {
            if (wallNames[id]) return wallNames[id];
            const idx = (window.customWalls || []).findIndex(w => w.id === id);
            return idx >= 0 ? `کاستوم ${idx + 1}` : (id || "?");
        };

        window.roomDoors.forEach((door, index) => {
            const item = document.createElement("div");
            item.style.display = "flex";
            item.style.justifyContent = "space-between";
            item.style.alignItems = "center";
            item.style.background = "#1e293b"; 
            item.style.padding = "8px";
            item.style.borderRadius = "6px";
            item.style.fontSize = "11px";
            item.style.borderRight = "3px solid #d97706"; // رنگ نارنجی برای درب

            item.innerHTML = `
                <span style="color: #cbd5e1; line-height: 1.5;">
                    🚪 ${wallLabel(door.wall)} | ابعاد: ${door.w}×${door.h}<br>
                    ↔️ فاصله از ابتدا: ${door.offset}
                </span>
                <div style="display: flex; gap: 5px;">
                    <button onclick="editDoorElement(${index})" style="background: #eab308; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">ویرایش</button>
                    <button onclick="removeDoorElement(${index})" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">حذف</button>
                </div>
            `;
            listDiv.appendChild(item);
        });
    },

    // ----------------------------------------------------------------
    // منطق سیستم و بروزرسانی
    // ----------------------------------------------------------------
            applyAction: function(mode) {
        // خواندن ارتفاع
        const newH = parseFloat(document.getElementById("master-room-h").value) || 280;

        // 👇 ذخیره مقادیر دیوارهای اصلی به همراه "سمت دیوار"
        const newWalls = {
            top: {
                len: parseFloat(document.getElementById("wall-top-len").value) || 400,
                angle: parseFloat(document.getElementById("wall-top-angle").value) || 0,
                wallSide: document.getElementById("wall-top-side").value || 'back' // 🟢 اضافه شد
            },
            bottom: {
                len: parseFloat(document.getElementById("wall-bottom-len").value) || 400,
                angle: parseFloat(document.getElementById("wall-bottom-angle").value) || 180,
                wallSide: document.getElementById("wall-bottom-side").value || 'back' // 🟢 اضافه شد
            },
            left: {
                len: parseFloat(document.getElementById("wall-left-len").value) || 300,
                angle: parseFloat(document.getElementById("wall-left-angle").value) || 90,
                wallSide: document.getElementById("wall-left-side").value || 'back' // 🟢 اضافه شد
            },
            right: {
                len: parseFloat(document.getElementById("wall-right-len").value) || 300,
                angle: parseFloat(document.getElementById("wall-right-angle").value) || -90,
                wallSide: document.getElementById("wall-right-side").value || 'back' // 🟢 اضافه شد
            }
        };

        if (mode === 'UPDATE') {
            this._handleUpdate(newWalls, newH);
        } else if (mode === 'NEW') {
            this._handleNew(newWalls, newH);
        }
    },



        _handleUpdate: function(newWalls, h) {
        // ذخیره ابعاد جدید در آبجکت room
        room.walls = newWalls;
        room.h = h;
        
        // این دو خط فعلاً نگه داشته می‌شوند تا بخش‌های قدیمی سیستم ارور ندهند
        room.w = Math.max(newWalls.top.len, newWalls.bottom.len);
        room.d = Math.max(newWalls.left.len, newWalls.right.len);

        this._refreshSystem();
        this.closeMasterPanel();
    },

    _handleNew: function(newWalls, h) {
        if (!confirm("⚠️ تمام کابینت‌ها، ستون‌ها و پنجره‌های طراحی شده حذف خواهند شد. مطمئن هستید؟")) {
            return;
        }

        cabinets.length = 0; 
        pillars.length = 0;
        window.roomWindows.length = 0; 
        window.roomDoors.length = 0; 
        selectedId = -1;
        selectedPillarId = -1;

        room.walls = newWalls;
        room.h = h;
        
        // این دو خط فعلاً نگه داشته می‌شوند
        room.w = Math.max(newWalls.top.len, newWalls.bottom.len);
        room.d = Math.max(newWalls.left.len, newWalls.right.len);

        this._refreshSystem();
        this.closeMasterPanel();
    },
    // ----------------------------------------------------------------
    // 🧱 مدیریت دیوارهای پویا (بخش جدید)
    // ----------------------------------------------------------------
    addDynamicWall: function() {
        const attachmentEl = document.getElementById("new-wall-attachment-point");
        const attachment = attachmentEl ? attachmentEl.value : "start";
        
        // خواندن مقدار سمت دیوار (جلو یا عقب)
        const wallSideEl = document.getElementById("new-wall-target-wall");
        const wallSide = wallSideEl ? wallSideEl.value : "front";

        // ✅ خواندن جهت شیفت اتصال (راست یا چپ)
        const shiftEl = document.getElementById("new-wall-shift");
        const shift = shiftEl ? shiftEl.value : "right";
        
        const targetWall = window.selectedRoomWall;

        if (!targetWall) {
            alert("لطفاً ابتدا روی یک دیوار در محیط طراحی کلیک کنید تا انتخاب شود (آبی رنگ شود).");
            return;
        }

        const len = parseFloat(document.getElementById("new-wall-len").value);
        const angle = parseFloat(document.getElementById("new-wall-angle").value);

        if (!len || isNaN(angle) || len <= 0) {
            alert("لطفاً طول و زاویه دیوار را به درستی وارد کنید.");
            return;
        }

        const wallId = "custom_wall_" + Date.now();

        // ذخیره مشخصات دیوار جدید
        window.customWalls.push({
            id: wallId,
            attachment: attachment,
            targetWall: targetWall,
            wallSide: wallSide, 
            shift: shift, // ✅ اضافه شدن مقدار شیفت
            len: len,
            angle: angle
        });

        // خالی کردن فیلدها
        document.getElementById("new-wall-len").value = "";
        document.getElementById("new-wall-angle").value = "";

        this.renderCustomWallsList();
        this._refreshSystem();
    },

    removeDynamicWall: function(index) {
        window.customWalls.splice(index, 1);
        this.renderCustomWallsList();
        this._refreshSystem();
    },

  renderCustomWallsList: function() {
    const listDiv = document.getElementById("dynamic-walls-list");
    if (!listDiv) return;
    listDiv.innerHTML = ""; 

    const wallNames = { top: "بالا", bottom: "پایین", left: "چپ", right: "راست" };
    const attachNames = { start: "ابتدا", end: "انتها" };

    window.customWalls.forEach((wall, index) => {
        const targetName = wallNames[wall.targetWall] || wall.targetWall;
        
        const item = document.createElement("div");
        item.id = `wall-panel-${wall.id}`;
        // استفاده از کلاس پنل دیوارهای قبلی به جای استایل خطی
        item.className = "room-wall-panel";

        item.onclick = (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
                if (typeof selectWallPanel === "function") selectWallPanel(wall.id);
            }
        };

        item.innerHTML = `
            <div class="room-wall-header">
                <strong class="room-dynamic-title">دیوار جدید (متصل به ${attachNames[wall.attachment]}ِ ${targetName})</strong>
                <button onclick="removeDynamicWallElement(${index}); event.stopPropagation();" class="room-btn-delete-sm">حذف</button>
            </div>
            <!-- ردیف اول: طول و زاویه -->
            <div class="room-input-row room-items-end room-mb-xs">
                <div class="room-input-group room-flex-1">
                    <label class="room-label-sm room-text-dark">طول (cm)</label>
                    <input type="number" class="room-input room-input-sm" value="${wall.len}" 
                           onchange="window.customWalls[${index}].len = parseFloat(this.value) || 0; if(typeof draw === 'function') draw(); if(window.Kitchen3D&&Kitchen3D.refreshRoom)Kitchen3D.refreshRoom();">
                </div>
                <div class="room-input-group room-flex-1">
                    <label class="room-label-sm room-text-dark">زاویه (درجه)</label>
                    <input type="number" class="room-input room-input-sm" value="${wall.angle}" 
                           onchange="window.customWalls[${index}].angle = parseFloat(this.value) || 0; if(typeof draw === 'function') draw(); if(window.Kitchen3D&&Kitchen3D.refreshRoom)Kitchen3D.refreshRoom();">
                </div>
            </div>
            <!-- ردیف دوم: سمت و شیفت -->
            <div class="room-input-row room-items-end">
                <div class="room-input-group room-flex-1">
                    <label class="room-label-sm room-text-dark">سمت</label>
                    <select class="room-input room-input-sm" onchange="window.customWalls[${index}].wallSide = this.value; if(typeof draw === 'function') draw(); if(window.Kitchen3D&&Kitchen3D.refreshRoom)Kitchen3D.refreshRoom();">
                        <option value="front" ${wall.wallSide === 'front' ? 'selected' : ''}>جلو</option>
                        <option value="back" ${wall.wallSide === 'back' ? 'selected' : ''}>عقب</option>
                    </select>
                </div>
                <div class="room-input-group room-flex-1">
                    <label class="room-label-sm room-text-dark">شیفت اتصال</label>
                    <select class="room-input room-input-sm" onchange="window.customWalls[${index}].shift = this.value; if(typeof draw === 'function') draw(); if(window.Kitchen3D&&Kitchen3D.refreshRoom)Kitchen3D.refreshRoom();">
                        <option value="right" ${wall.shift === 'right' ? 'selected' : ''}>راست</option>
                        <option value="left" ${wall.shift === 'left' ? 'selected' : ''}>چپ</option>
                    </select>
                </div>
            </div>
        `;
        listDiv.appendChild(item);
    });
    if (typeof refreshWallSelectOptions === 'function') refreshWallSelectOptions();
}

,

     _refreshSystem: function() {
        // تابع قدیمی مقیاس‌دهی (اگر کار خاصی نمی‌کند می‌توانید کلا پاکش کنید، ولی بودنش هم فعلاً ضرری ندارد)
        if (typeof initRoomScale === 'function') initRoomScale();
        
        // ✅ اینجا به جای رسم مستقیم، ابتدا زوم را محاسبه می‌کنیم (که خودش در انتها draw را صدا می‌زند)
        if (typeof autoFitRoom === 'function') {
            autoFitRoom(); 
        } else if (typeof draw === 'function') {
            draw(); // برای حالت پشتیبان
        }

        if (typeof Kitchen3D !== 'undefined' && Kitchen3D.scene) {
            Kitchen3D.config.wallHeight = room.h; 
            
            Kitchen3D.config.hasTop = document.getElementById("wall-top").checked;
            Kitchen3D.config.hasLeft = document.getElementById("wall-left").checked;
            Kitchen3D.config.hasBottom = document.getElementById("wall-bottom").checked;
            Kitchen3D.config.hasRight = document.getElementById("wall-right").checked;

            Kitchen3D.refreshRoom();
        }

        if (typeof updateCountertopPreview === "function") updateCountertopPreview();
        if (typeof refreshWallSelectOptions === "function") refreshWallSelectOptions();
    }

};

// اتصالات HTML
window.openRoomMasterPanel = () => KitchenPanelManager.openMasterPanel();
window.closeRoomMasterPanel = () => KitchenPanelManager.closeMasterPanel();
window.applyRoomAction = (mode) => KitchenPanelManager.applyAction(mode);
window.addWindowElement = () => KitchenPanelManager.addWindow();
window.removeWindowElement = (index) => KitchenPanelManager.removeWindow(index);
window.editWindowElement = (index) => KitchenPanelManager.editWindow(index);

// 🌟 اتصالات مربوط به درب‌ها
window.addDoorElement = () => KitchenPanelManager.addDoor();
window.removeDoorElement = (index) => KitchenPanelManager.removeDoor(index);
window.editDoorElement = (index) => KitchenPanelManager.editDoor(index);
// متغیر سراسری وضعیت اتصال دیوارها
window.autoConnectWalls = false;

// تابع تغییر وضعیت دکمه و بوم
window.toggleAutoConnectWalls = function() {
    window.autoConnectWalls = !window.autoConnectWalls;
    const btn = document.getElementById('btn-connect-walls');
    
    if(window.autoConnectWalls) {
        btn.style.backgroundColor = "#16a34a"; // رنگ سبز در حالت فعال
        btn.innerHTML = "✅ اتصال فعال است (لغو)";
    } else {
        btn.style.backgroundColor = "#3b82f6"; // رنگ آبی در حالت غیرفعال
        btn.innerHTML = "🔗 بستن فضای باز (دیوار پایین به راست)";
    }
    
    // رسم مجدد برای نمایش تغییرات
    if (typeof draw === 'function') {
        draw();
    }
};

function selectWallPanel(wallId) {
    // 1. بررسی اینکه آیا دیوار از قبل انتخاب شده است یا خیر
    if (window.selectedRoomWall === wallId) {
        window.selectedRoomWall = null;
    } else {
        window.selectedRoomWall = wallId;
    }

    // 2. حذف کلاس انتخاب‌شده از تمامی پنل‌های دیوار
    document.querySelectorAll('.room-wall-panel').forEach(el => {
        el.classList.remove('active-wall');
    });

    // 3. اضافه کردن استایل (کلاس) فقط به دیوار انتخاب شده
    if (window.selectedRoomWall) {
        const selectedEl = document.getElementById('wall-panel-' + window.selectedRoomWall);
        if (selectedEl) {
            selectedEl.classList.add('active-wall');
        }
    }

    // 4. رسم مجدد Canvas
    if (typeof draw === 'function') {
        draw();
    }
}


window.addDynamicWallElement = () => KitchenPanelManager.addDynamicWall();
window.removeDynamicWallElement = (index) => KitchenPanelManager.removeDynamicWall(index);

