/**
 * view3d-babylon.js
 * هم‌تراز با Kitchen3D / createEnvironment
 * دیوار سه‌باندی · کف سرامیک · پارکت بیرون · دیوار بیرون آجری · ۵ هالوژن
 */

const KitchenBabylon = {
    engine: null,
    scene: null,
    camera: null,
    canvas: null,
    isReady: false,
    _resizeHandler: null,
    resizeObserver: null,
    _isMobile: false,
    _opening: false,

    config: {
        // —— مطابق مشخصات view3d.js / Kitchen3D ——
        wallHeight: 280,
        wallThickness: 20,
        hasTop: true,
        hasLeft: true,
        hasRight: true,
        hasBottom: false,
        ceilingThickness: 18,
        ceilingCornice: true,
        ceilingCorniceH: 6,
        ceilingCorniceD: 5,
        ceilingColor: 0xffffff,
        backgroundColor: 0xf5f5f7,
        ceilingLightOn: true,
        ceilingLightIntensity: 2600,
        ceilingLightColor: 0xfff2e6,
        ambientLightIntensity: 0.48,
        hemiLightIntensity: 0.38,
        dirLightIntensity: 0.1,
        wallStyle: 'ceramic',
        wallBandLowerColor1: '#fdfbf7',
        wallBandLowerColor2: '#f4f1ea',
        wallBandMidColor1: '#161616',
        wallBandMidColor2: '#1d1d1d',
        wallBandUpperColor1: '#fdfbf7',
        wallBandUpperColor2: '#f4f1ea',
        wallGroutColor: '#c8c2b8',
        wallRoughness: 0.42,
        floorStyle: 'ceramic',
        floorTileColor1: '#DCD3C6',
        floorTileColor2: '#CFC4B5',
        floorGroutColor: '#9a8f82',
        floorTileSizeCm: 60,
        floorRoughness: 0.38
    },

    open: function () {
        if (typeof BABYLON === 'undefined') {
            alert('خطا: Babylon.js لود نشده است.');
            return;
        }
        if (typeof room === 'undefined' || !room || room.w <= 0) {
            alert('لطفاً ابتدا ابعاد اتاق را تایید کنید.');
            return;
        }

        // اگر همین الان در حال باز شدن است، درخواست تکراری را نادیده بگیر
        if (this._opening) {
            return;
        }

        // اگر قبلاً آماده است و موتور زنده است، فقط نمایش بده و resize کن
        if (this.isReady && this.engine && this.scene && this.canvas) {
            const cont = document.getElementById('modal-babylon-container');
            if (cont) {
                cont.style.display = 'flex';
                cont.style.visibility = 'visible';
                cont.style.opacity = '1';
            }
            try { this.onContainerResize(); } catch (e) {}
            try { this.refreshCabinets(); } catch (e) {}
            return;
        }

        if (typeof Kitchen3D !== 'undefined' && Kitchen3D.config) {
            try { Object.assign(this.config, Kitchen3D.config); } catch (e) {}
        }

        this._opening = true;
        this._openingSince = Date.now();
        this._openGen = (this._openGen || 0) + 1;
        const gen = this._openGen;

        // نمایش مودال
        const container = document.getElementById('modal-babylon-container');
        if (container) {
            container.style.display = 'flex';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
        }
        const c2d = document.getElementById('canvas-wrapper');
        const c3d = document.getElementById('modal-3d-container');
        const cElev = document.getElementById('elev-view-container');
        if (c2d) c2d.style.display = 'none';
        if (c3d) c3d.style.display = 'none';
        if (cElev) cElev.style.display = 'none';

        // آزادسازی موتور قبلی بدون loseContext
        this._disposeEngine(false);

        // canvas را همگام بساز (بدون fetch تا race نداشته باشیم)
        this._injectCanvasSync();

        const self = this;
        var tries = 0;
        function tryInit() {
            if (gen !== self._openGen) {
                return;
            }
            tries++;
            const cont = document.getElementById('modal-babylon-container');
            if (cont) {
                cont.style.display = 'flex';
                cont.style.visibility = 'visible';
            }
            if (!document.getElementById('babylon-canvas')) {
                self._injectCanvasSync();
            }
            const canvas = document.getElementById('babylon-canvas');
            if (!canvas) {
                if (tries < 15) {
                    setTimeout(tryInit, 40);
                    return;
                }
                self._opening = false;
                self._updateStatus('خطا: canvas ساخته نشد');
                return;
            }
            const cw = (cont && cont.clientWidth) || canvas.clientWidth || 0;
            const ch = (cont && cont.clientHeight) || canvas.clientHeight || 0;
            // حداکثر ~800ms برای layout
            if ((cw < 4 || ch < 4) && tries < 16) {
                setTimeout(tryInit, 50);
                return;
            }
            try {
                self.init();
                self._opening = false;
                setTimeout(function () { if (gen === self._openGen) self.onContainerResize(); }, 40);
                setTimeout(function () { if (gen === self._openGen) self.onContainerResize(); }, 150);
            } catch (err) {
                try { console.error('[KitchenBabylon] init failed:', err); } catch (e2) {}
                // پاک‌سازی نیمه‌کاره
                try { self._disposeEngine(false); } catch (e3) {}
                self._injectCanvasSync();
                if (tries < 8) {
                    setTimeout(tryInit, 120);
                    return;
                }
                self._opening = false;
                self._updateStatus('خطا در راه‌اندازی Babylon');
                try {
                    alert('خطا در باز کردن نمای Babylon:\n' + (err && err.message ? err.message : String(err)));
                } catch (e4) {}
            }
        }
        // یک فریم بعد از display:flex تا اندازه بگیرد
        setTimeout(tryInit, 50);

        // ایمنی: بعد از ۳ ثانیه قفل را باز کن
        setTimeout(function () {
            if (gen === self._openGen && self._opening) {
                self._opening = false;
            }
        }, 3000);
    },

    /**
     * @param {boolean} [loseContext] فقط هنگام تعویض به Three در صورت نیاز
     */
    _disposeEngine: function (loseContext) {
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
        if (this.resizeObserver) {
            try { this.resizeObserver.disconnect(); } catch (e) {}
            this.resizeObserver = null;
        }
        try {
            if (this._camBoundObs && this.scene) {
                this.scene.onBeforeRenderObservable.remove(this._camBoundObs);
            }
        } catch (e) {}
        this._camBoundObs = null;

        try {
            if (this._pointerObs && this.scene) {
                this.scene.onPointerObservable.remove(this._pointerObs);
            }
        } catch (e) {}
        this._pointerObs = null;
        this._animating = [];
        this._appMatCache = null;

        try { if (this.engine) this.engine.stopRenderLoop(); } catch (e) {}
        try {
            if (this.scene) {
                this.scene.dispose();
            }
        } catch (e) {}
        try {
            if (this.engine) {
                // loseContext فقط وقتی صریحاً خواسته شود (مثلاً قبل از باز کردن Three)
                if (loseContext) {
                    try {
                        const gl = this.engine._gl || (this.engine.getRenderingCanvas && this.engine.getRenderingCanvas().getContext('webgl2')) || null;
                        if (gl && gl.getExtension) {
                            const ext = gl.getExtension('WEBGL_lose_context');
                            if (ext) ext.loseContext();
                        }
                    } catch (e3) {}
                }
                this.engine.dispose();
            }
        } catch (e) {}
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.isReady = false;
        this.canvas = null;
    },

    close: function (options) {
        this._opening = false;
        this._openingSince = 0;
        this._openGen = (this._openGen || 0) + 1;
        const lose = options && options.loseContext === true;
        this._disposeEngine(lose);
        // canvas را نگه می‌داریم تا بار بعد سریع‌تر باشد؛ فقط اگر loseContext خواسته شد پاک کن
        if (lose) {
            try {
                const c = document.getElementById('modal-babylon-container');
                if (c) c.innerHTML = '';
            } catch (e) {}
        }
    },

    /** ساخت همگام canvas — بدون fetch تا race نشود */
    _injectCanvasSync: function () {
        const container = document.getElementById('modal-babylon-container');
        if (!container) return false;
        var canvas = container.querySelector('#babylon-canvas');
        if (canvas && canvas.parentNode) {
            // اگر موتور قبلی dispose شده، canvas را تازه کن تا context مرده نماند
            if (!this.engine) {
                try {
                    const parent = canvas.parentNode;
                    const fresh = document.createElement('canvas');
                    fresh.id = 'babylon-canvas';
                    fresh.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;';
                    parent.replaceChild(fresh, canvas);
                } catch (e) {}
            }
            return true;
        }
        container.innerHTML =
            '<div style="width:100%;height:100%;position:relative;background:#e0e4ea;">' +
            '<canvas id="babylon-canvas" style="width:100%;height:100%;display:block;touch-action:none;"></canvas>' +
            '<div id="babylon-status" style="position:absolute;bottom:12px;left:12px;background:rgba(249,115,22,.85);color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:bold;">Babylon</div></div>';
        return !!container.querySelector('#babylon-canvas');
    },

    _ensureCanvas: function () {
        this._injectCanvasSync();
        return Promise.resolve();
    },

    _loadModalHTML: function () {
        // دیگر از شبکه نمی‌خوانیم — همیشه inject همگام
        this._injectCanvasSync();
        return Promise.resolve();
    },

    init: function () {
        const container = document.getElementById('modal-babylon-container');
        if (!container) return;
        if (!container.querySelector('#babylon-canvas')) {
            container.innerHTML =
                '<div style="width:100%;height:100%;position:relative;background:#e0e4ea;">' +
                '<canvas id="babylon-canvas" style="width:100%;height:100%;display:block;touch-action:none;"></canvas>' +
                '<div id="babylon-status" style="position:absolute;bottom:12px;left:12px;background:rgba(249,115,22,.85);color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:bold;">Babylon</div></div>';
        }
        this.canvas = document.getElementById('babylon-canvas');
        if (!this.canvas) return;

        // اگر موتور قبلی باقی مانده باشد آزاد کن (بدون loseContext)
        if (this.engine || this.scene) {
            try { this._disposeEngine(false); } catch (e) {}
            this._injectCanvasSync();
            this.canvas = document.getElementById('babylon-canvas');
            if (!this.canvas) return;
        }

        const w = this.canvas.clientWidth || 800;
        this._isMobile = w < 768 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || '');

        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: false,
            stencil: false,
            antialias: true,
            adaptToDeviceRatio: false
        });
        const dpr = Math.min(window.devicePixelRatio || 1, this._isMobile ? 1 : 1.25);
        this.engine.setHardwareScalingLevel(1 / dpr);

        this.scene = new BABYLON.Scene(this.engine);
        // Three.js راست‌دست است — Babylon پیش‌فرض چپ‌دست → چپ/راست برعکس می‌شود
        this.scene.useRightHandedSystem = true;
        this.scene.blockMaterialDirtyMechanism = true;
        const bg = this.config.backgroundColor || 0xf5f5f7;
        this.scene.clearColor = new BABYLON.Color4(
            ((bg >> 16) & 255) / 255,
            ((bg >> 8) & 255) / 255,
            (bg & 255) / 255, 1
        );

        const roomW = room.w || 400;
        const roomD = room.d || 300;
        const roomH = room.h || this.config.wallHeight || 280;
        const cx = roomW / 2;
        const cz = roomD / 2;

        // ذخیره ابعاد برای محدودیت دوربین
        this._roomW = roomW;
        this._roomD = roomD;
        this._roomH = roomH;

        // دوربین مثل Kitchen3D: از سمت دیوار پایین (z بزرگ) به مرکز نگاه می‌کند
        // تا چپ/راست با نمای ۲بعدی و Three یکی باشد
        this.camera = new BABYLON.ArcRotateCamera(
            'cam',
            Math.PI / 2,
            Math.PI / 3,
            Math.max(roomW, roomD) * 1.15,
            new BABYLON.Vector3(cx, roomH * 0.35, cz),
            this.scene
        );
        this.camera.setTarget(new BABYLON.Vector3(cx, roomH * 0.35, cz));
        this.camera.setPosition(new BABYLON.Vector3(cx, roomH * 0.55, roomD - 40));
        if (typeof this.camera.rebuildAnglesAndRadius === 'function') {
            this.camera.rebuildAnglesAndRadius();
        }
        // تضمین: دوربین سمت +Z (پایین اتاق) باشد نه -Z
        if (this.camera.position.z < cz) {
            this.camera.setPosition(new BABYLON.Vector3(cx, roomH * 0.55, roomD - 40));
            if (typeof this.camera.rebuildAnglesAndRadius === 'function') {
                this.camera.rebuildAnglesAndRadius();
            }
        }
        this.camera.lowerRadiusLimit = 40;
        this.camera.upperRadiusLimit = 2500;
        this.camera.lowerBetaLimit = 0.05;
        this.camera.upperBetaLimit = Math.PI / 1.8;
        this.camera.wheelPrecision = 0.6;
        this.camera.panningSensibility = 50;
        this.camera.inertia = 0.8;
        this.camera.attachControl(this.canvas, true);

        // مرز نامرئی محیط — عین Three.js (E=820, margin=20)
        // ArcRotateCamera موقعیت را از alpha/beta/radius می‌سازد؛
        // پس حتماً setPosition/setTarget باید صدا زده شود وگرنه clamp بی‌اثر است.
        const self = this;
        if (this._camBoundObs) {
            try { this.scene.onBeforeRenderObservable.remove(this._camBoundObs); } catch (e) {}
            this._camBoundObs = null;
        }
        this._camBoundObs = this.scene.onBeforeRenderObservable.add(function () {
            if (!self.camera) return;
            const margin = 20;
            const E = 820; // فضای بیرون خانه — مثل Kitchen3D
            const rw = self._roomW || 400;
            const rd = self._roomD || 300;
            const rh = self._roomH || 280;

            const minX = -E + margin;
            const maxX = rw + E - margin;
            const minZ = -E + margin;
            const maxZ = rd + E - margin;
            const minY = margin;
            const maxY = Math.max(minY + 10, rh - margin);

            // ۱) محدود کردن target
            const tgt = self.camera.getTarget().clone();
            const tx = Math.max(minX, Math.min(maxX, tgt.x));
            const ty = Math.max(minY, Math.min(maxY, tgt.y));
            const tz = Math.max(minZ, Math.min(maxZ, tgt.z));
            if (tx !== tgt.x || ty !== tgt.y || tz !== tgt.z) {
                self.camera.setTarget(new BABYLON.Vector3(tx, ty, tz));
            }

            // ۲) محدود کردن position و بازسازی زاویه‌ها
            const pos = self.camera.position;
            const px = Math.max(minX, Math.min(maxX, pos.x));
            const py = Math.max(minY, Math.min(maxY, pos.y));
            const pz = Math.max(minZ, Math.min(maxZ, pos.z));
            if (px !== pos.x || py !== pos.y || pz !== pos.z) {
                self.camera.setPosition(new BABYLON.Vector3(px, py, pz));
                // setPosition زاویه/شعاع را از موقعیت جدید می‌سازد
                if (typeof self.camera.rebuildAnglesAndRadius === 'function') {
                    self.camera.rebuildAnglesAndRadius();
                }
            }
        });

        // وضعیت دیوارها از پنل (چک‌باکس‌ها) قبل از ساخت محیط
        this._syncWallsFromPanel();

        this._setupLights(roomW, roomD, roomH);
        this._createEnvironment(roomW, roomD, roomH);
        this._createCeilingLamps(roomW, roomD, roomH);

        this._animating = [];
        this.engine.runRenderLoop(function () {
            if (!self.scene || !self.isReady) return;
            self._tickDoorAnim();
            self.scene.render();
        });

        // مثل Three.js: با باز/بسته شدن منوی کناری کانتینر عوض می‌شود
        // window.resize کافی نیست → ResizeObserver روی کانتینر
        this._resizeHandler = function () { self.onContainerResize(); };
        window.addEventListener('resize', this._resizeHandler);

        if (this.resizeObserver) {
            try { this.resizeObserver.disconnect(); } catch (e) {}
            this.resizeObserver = null;
        }
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(function () {
                self.onContainerResize();
            });
            const observeEl = document.getElementById('modal-babylon-container') ||
                (self.canvas && self.canvas.parentElement) || self.canvas;
            if (observeEl) this.resizeObserver.observe(observeEl);
        }

        // isReady باید قبل از renderCabinets true باشد وگرنه یونیت‌ها ساخته نمی‌شوند
        this.isReady = true;
        this._setupDoorInteraction();
        this.renderCabinets();
        // یکبار بعد از layout اولیه
        setTimeout(function () { self.onContainerResize(); }, 50);
        setTimeout(function () { self.onContainerResize(); }, 200);
        this._updateStatus('Babylon — ' + roomW + '×' + roomD + '×' + roomH);
    },

    /**
     * ریسایز باکس بافر canvas وقتی عرض/ارتفاع کانتینر عوض می‌شود
     * (باز/بسته شدن منوی کناری) — معادل onWindowResize در Kitchen3D
     */
    onContainerResize: function () {
        if (!this.engine || !this.canvas) return;

        const container = document.getElementById('modal-babylon-container') ||
            this.canvas.parentElement;
        if (!container) {
            try { this.engine.resize(); } catch (e) {}
            return;
        }

        const w = container.clientWidth || this.canvas.clientWidth || 0;
        const h = container.clientHeight || this.canvas.clientHeight || 0;
        if (w < 2 || h < 2) return;

        // تنظیم اندازه CSS canvas تا با کانتینر یکی باشد
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        // بافر WebGL را با اندازه واقعی کانتینر هماهنگ کن
        try {
            this.engine.resize(true);
        } catch (e) {
            try { this.engine.resize(); } catch (e2) {}
        }

        // دوربین ArcRotate نسبت تصویر را از canvas می‌گیرد؛
        // بعد از resize یک فریم رندر برای جلوگیری از کش‌آمدن
        if (this.scene && this.isReady) {
            try { this.scene.render(); } catch (e) {}
        }
    },

    _setupLights: function (rw, rd, rh) {
        const cfg = this.config;
        // مطابق Three: ambient 0.48 + hemi 0.38 + dir 0.1
        const ambient = cfg.ambientLightIntensity != null ? +cfg.ambientLightIntensity : 0.48;
        const hemiI = cfg.hemiLightIntensity != null ? +cfg.hemiLightIntensity : 0.38;

        const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), this.scene);
        hemi.intensity = hemiI + ambient * 0.55;
        hemi.diffuse = new BABYLON.Color3(0.95, 0.95, 0.97);
        hemi.groundColor = new BABYLON.Color3(0.55, 0.50, 0.45);
        hemi.specular = BABYLON.Color3.Black();

        const dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-0.25, -1, -0.15), this.scene);
        dir.position = new BABYLON.Vector3(rw * 0.4 + 80, rh + 200, rd * 0.3 + 80);
        dir.intensity = cfg.dirLightIntensity != null ? +cfg.dirLightIntensity : 0.1;
        dir.diffuse = new BABYLON.Color3(1.0, 0.97, 0.93);
        dir.shadowEnabled = false;
    },

    /**
     * محیط کامل — منطق createEnvironment در view3d.js
     */
    /**
     * مرز کف/سقف بر اساس دیوارهای اصلی + کاستوم — عین view3d.js
     * baseEndpoints از گوشه‌های اتاق + نقاط شروع/پایان هر دیوار کاستوم
     */
    _computeKitchenBounds: function (roomW, roomD) {
        let minX = 0, maxX = roomW, minZ = 0, maxZ = roomD;

        const baseEndpoints = {
            top:    { start: { x: 0, z: 0 }, end: { x: roomW, z: 0 } },
            bottom: { start: { x: 0, z: roomD }, end: { x: roomW, z: roomD } },
            left:   { start: { x: 0, z: 0 }, end: { x: 0, z: roomD } },
            right:  { start: { x: roomW, z: 0 }, end: { x: roomW, z: roomD } }
        };

        if (window.customWalls && window.customWalls.length > 0) {
            minX = Infinity; maxX = -Infinity;
            minZ = Infinity; maxZ = -Infinity;
            let hasAny = false;

            // ابتدا گوشه‌های اتاق
            for (const key of Object.keys(baseEndpoints)) {
                const p = baseEndpoints[key];
                minX = Math.min(minX, p.start.x, p.end.x);
                maxX = Math.max(maxX, p.start.x, p.end.x);
                minZ = Math.min(minZ, p.start.z, p.end.z);
                maxZ = Math.max(maxZ, p.start.z, p.end.z);
                hasAny = true;
            }

            for (let i = 0; i < window.customWalls.length; i++) {
                const cWall = window.customWalls[i];
                if (!cWall) continue;

                let p1;
                if (cWall.x !== undefined && cWall.y !== undefined &&
                    Number.isFinite(parseFloat(cWall.x)) && Number.isFinite(parseFloat(cWall.y))) {
                    p1 = { x: parseFloat(cWall.x), z: parseFloat(cWall.y) };
                } else {
                    const target = baseEndpoints[cWall.targetWall];
                    if (!target) continue;
                    p1 = (cWall.attachment === 'end')
                        ? { x: target.end.x, z: target.end.z }
                        : { x: target.start.x, z: target.start.z };
                }
                if (!Number.isFinite(p1.x) || !Number.isFinite(p1.z)) continue;

                const angleDeg = Number.isFinite(parseFloat(cWall.angle)) ? parseFloat(cWall.angle) : 0;
                const angleRad = angleDeg * (Math.PI / 180);
                const len = Math.max(1, parseFloat(cWall.len) || 100);
                const p2 = {
                    x: p1.x + len * Math.cos(angleRad),
                    z: p1.z + len * Math.sin(angleRad)
                };

                minX = Math.min(minX, p1.x, p2.x);
                maxX = Math.max(maxX, p1.x, p2.x);
                minZ = Math.min(minZ, p1.z, p2.z);
                maxZ = Math.max(maxZ, p1.z, p2.z);
                hasAny = true;

                if (cWall.id != null) {
                    baseEndpoints[cWall.id] = { start: p1, end: p2 };
                }
            }

            if (!hasAny || !Number.isFinite(minX)) {
                minX = 0; maxX = roomW;
                minZ = 0; maxZ = roomD;
            }
        }

        const innerW = Math.max(1, maxX - minX);
        const innerD = Math.max(1, maxZ - minZ);
        return {
            minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ,
            innerW: innerW, innerD: innerD,
            innerCX: minX + innerW / 2,
            innerCZ: minZ + innerD / 2,
            baseEndpoints: baseEndpoints
        };
    },

    _createEnvironment: function (roomW, roomD, roomH) {
        const cfg = this.config;
        const t = cfg.wallThickness || 20;
        const h = roomH;
        const floorThickness = 20;
        const ceilT = cfg.ceilingThickness != null ? +cfg.ceilingThickness : 18;
        const E = 800;

        // مرز داینامیک کف/سقف (اتاق + دیوارهای کاستوم) — عین Three
        const bounds = this._computeKitchenBounds(roomW, roomD);
        this._kitchenBounds = bounds;
        this._customWallEndpoints = bounds.baseEndpoints;
        const innerW = bounds.innerW;
        const innerD = bounds.innerD;
        const innerCX = bounds.innerCX;
        const innerCZ = bounds.innerCZ;
        const minX = bounds.minX, maxX = bounds.maxX;
        const minZ = bounds.minZ, maxZ = bounds.maxZ;

        // ---- متریال‌ها ----
        const floorMat = this._makeFloorCeramic(innerW, innerD);
        const outerMinX = minX - E, outerMaxX = maxX + E;
        const outerMinZ = minZ - E, outerMaxZ = maxZ + E;
        const outerW0 = outerMaxX - outerMinX;
        const outerD0 = outerMaxZ - outerMinZ;
        const parquetMat = this._makeParquet(outerW0, outerD0);
        const ceilMat = new BABYLON.StandardMaterial('ceilMat', this.scene);
        const ceilCol = (cfg.ceilingColor != null) ? cfg.ceilingColor : 0xffffff;
        ceilMat.diffuseColor = this._hexToColor3(ceilCol);
        if (ceilMat.diffuseColor.r < 0.85 || ceilMat.diffuseColor.g < 0.85 || ceilMat.diffuseColor.b < 0.85) {
            ceilMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        }
        ceilMat.specularColor = BABYLON.Color3.Black();

        // ---- کف آشپزخانه داینامیک (شامل فضای دیوار کاستوم) ----
        const floor = BABYLON.MeshBuilder.CreateBox('floor', {
            width: innerW, height: floorThickness, depth: innerD
        }, this.scene);
        floor.position.set(innerCX, -floorThickness / 2, innerCZ);
        floor.material = floorMat;
        floor.isPickable = false;
        floor.renderingGroupId = 0;
        floor.metadata = { isKitchenInterior: true, isFloor: true };

        // ---- سقف داینامیک ----
        const ceiling = BABYLON.MeshBuilder.CreateBox('ceiling', {
            width: innerW, height: ceilT, depth: innerD
        }, this.scene);
        ceiling.position.set(innerCX, h + ceilT / 2, innerCZ);
        ceiling.material = ceilMat;
        ceiling.isPickable = false;
        ceiling.renderingGroupId = 0;
        ceiling.metadata = { isKitchenInterior: true, isCeiling: true };

        // ---- قرنیز روی محیط داینامیک ----
        if (cfg.ceilingCornice !== false) {
            const cH = Math.max(3, +cfg.ceilingCorniceH || 6);
            const cD = Math.max(2, +cfg.ceilingCorniceD || 5);
            const strips = [
                [innerW, cD, innerCX, minZ + cD / 2],
                [innerW, cD, innerCX, maxZ - cD / 2],
                [cD, innerD, minX + cD / 2, innerCZ],
                [cD, innerD, maxX - cD / 2, innerCZ]
            ];
            for (let i = 0; i < strips.length; i++) {
                const s = strips[i];
                const m = BABYLON.MeshBuilder.CreateBox('cornice' + i, {
                    width: s[0], height: cH * 0.35, depth: s[1]
                }, this.scene);
                m.position.set(s[2], h - cH * 0.15, s[3]);
                m.material = ceilMat;
                m.isPickable = false;
            }
        }

        // ---- دیوارهای داخلی — اندازه دقیق اتاق (بدون اضافه)
        // ارتفاع: از y=-20 تا h+20  →  wallH = h+40 ، مرکز wallY = h/2
        const wallH = h + 40;
        const wallY = h / 2;
        // دیوارهای اصلی — پیش‌فرض سه دیوار فعال (مثل Three)
        const showTop = (cfg.hasTop !== false);
        const showBottom = (cfg.hasBottom === true);
        const showLeft = (cfg.hasLeft !== false);
        const showRight = (cfg.hasRight !== false);
        if (showTop) {
            this._addSolidWall('wallTop', roomW, wallH, t, roomW / 2, wallY, -t / 2, roomW);
        }
        if (showBottom) {
            this._addSolidWall('wallBottom', roomW, wallH, t, roomW / 2, wallY, roomD + t / 2, roomW);
        }
        if (showLeft) {
            this._addSolidWall('wallLeft', t, wallH, roomD, -t / 2, wallY, roomD / 2, roomD);
        }
        if (showRight) {
            this._addSolidWall('wallRight', t, wallH, roomD, roomW + t / 2, wallY, roomD / 2, roomD);
        }

        // ---- محیط بیرونی (بر اساس مرز داینامیک) ----
        const outerW = outerMaxX - outerMinX;
        const outerD = outerMaxZ - outerMinZ;
        const outerCX = (outerMinX + outerMaxX) / 2;
        const outerCZ = (outerMinZ + outerMaxZ) / 2;
        const outerFloorY = -floorThickness;
        const outerCeilY = h + ceilT + 1;
        const outerHouseH = outerCeilY - outerFloorY;

        // کف پارکت بیرون
        const outerFloor = BABYLON.MeshBuilder.CreateBox('outerFloor', {
            width: outerW, height: floorThickness, depth: outerD
        }, this.scene);
        // کمی پایین‌تر از کف آشپزخانه تا z-fighting نشود
        outerFloor.position.set(outerCX, outerFloorY - floorThickness / 2 - 0.5, outerCZ);
        outerFloor.material = parquetMat;
        outerFloor.isPickable = false;
        outerFloor.metadata = { excludeFromExport: true, isOuterEnv: true };

        // سقف بیرون (خاکستری روشن — نه سفید مطلق)
        const outerCeilMat = new BABYLON.StandardMaterial('outerCeilMat', this.scene);
        outerCeilMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        outerCeilMat.specularColor = BABYLON.Color3.Black();
        const outerCeilThick = Math.max(12, ceilT * 0.85);
        const outerCeil = BABYLON.MeshBuilder.CreateBox('outerCeil', {
            width: outerW, height: outerCeilThick, depth: outerD
        }, this.scene);
        outerCeil.position.set(outerCX, outerCeilY + outerCeilThick / 2, outerCZ);
        outerCeil.material = outerCeilMat;
        outerCeil.isPickable = false;
        outerCeil.metadata = { excludeFromExport: true, isOuterEnv: true };

        // دیوارهای بیرون — Plane مثل Three (نه Box ضخیم)
        this._addOuterPlane(outerMinX, outerMinZ, outerMaxX, outerMinZ, outerFloorY, outerHouseH);
        this._addOuterPlane(outerMinX, outerMaxZ, outerMaxX, outerMaxZ, outerFloorY, outerHouseH);
        this._addOuterPlane(outerMinX, outerMinZ, outerMinX, outerMaxZ, outerFloorY, outerHouseH);
        this._addOuterPlane(outerMaxX, outerMinZ, outerMaxX, outerMaxZ, outerFloorY, outerHouseH);

        // دیوارهای کاستوم (window.customWalls)
        try { this._renderCustomWalls(roomW, roomD, h, t); } catch (e) {}
    },

    /**
     * دیوار داخلی به‌صورت Plane دوطرفه
     * U همیشه در امتداد طول دیوار، V همیشه از کف به سقف
     * → کاشی و باند مشکی روی هر چهار دیوار یک‌دست و افقی
     */
    /**
     * دیوار یکپارچه با بافت سرامیک
     * faceUV: فقط وجه‌های اصلی طول×ارتفاع بافت می‌گیرند
     */
    _addSolidWall: function (name, width, height, depth, x, y, z, faceLength) {
        // height = ارتفاع کامل مش (h+40) تا باندها با جبران ۲۰cm پایین درست باشند
        const mat = this._makeInnerWallMaterial(height, faceLength || Math.max(width, depth));

        // faceUV برای ۶ وجه باکس: 0 front, 1 back, 2 right, 3 left, 4 top, 5 bottom
        // وجه‌های بزرگ (طول×ارتفاع) بافت کامل؛ لبه‌ها تقریباً یک کاشی
        const faceUV = [];
        for (let i = 0; i < 6; i++) {
            faceUV.push(new BABYLON.Vector4(0, 0, 1, 1));
        }
        // لبه‌های بالا/پایین کمتر تکرار شوند
        faceUV[4] = new BABYLON.Vector4(0, 0, 0.15, 0.15);
        faceUV[5] = new BABYLON.Vector4(0, 0, 0.15, 0.15);

        const box = BABYLON.MeshBuilder.CreateBox(name, {
            width: width,
            height: height,
            depth: depth,
            faceUV: faceUV,
            wrap: true
        }, this.scene);
        box.position.set(x, y, z);
        box.material = mat;
        box.isPickable = false;
        box.isVisible = true;
        box.setEnabled(true);
        box.metadata = { isKitchenInterior: true, isWall: true };
        return box;
    },

    _addOuterPlane: function (x1, z1, x2, z2, floorY, houseH) {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length < 0.1) return;

        const mat = this._makeOuterWallMaterial(houseH, length);
        const plane = BABYLON.MeshBuilder.CreatePlane('outerWall', {
            width: length,
            height: houseH,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, this.scene);
        plane.position.set(x1 + dx / 2, floorY + houseH / 2, z1 + dz / 2);
        // چرخش مثل Three: rotation.y = -atan2(dz, dx)
        // در Babylon Plane پیش‌فرض رو به +Z است
        plane.rotation.y = -Math.atan2(dz, dx);
        plane.material = mat;
        plane.isPickable = false;
        plane.metadata = { excludeFromExport: true, isOuterEnv: true };
    },

    /**
     * دیوار داخل — باند ۰–۹۰ سفید | ۹۰–۱۵۰ مشکی مرمر | ۱۵۰–سقف سفید
     * بافت روی ارتفاع دیوار از کف (y=0) نگاشت می‌شود
     */
    /**
     * دیوارهای کاستوم — معادل buildCustomWallSegment + حلقه customWalls در view3d.js
     * cWall: { id, targetWall, attachment, angle, len, shift, x?, y? }
     */
    _renderCustomWalls: function (roomW, roomD, wallH, wallThick) {
        if (!this.scene) return;
        if (!window.customWalls || !window.customWalls.length) return;

        const t = wallThick || (this.config && this.config.wallThickness) || 20;
        const h = wallH || (this.config && this.config.wallHeight) || 280;
        if (!(h > 0) || !(t > 0)) return;

        const baseEndpoints = {
            top:    { start: { x: 0, z: 0 }, end: { x: roomW, z: 0 } },
            bottom: { start: { x: 0, z: roomD }, end: { x: roomW, z: roomD } },
            left:   { start: { x: 0, z: 0 }, end: { x: 0, z: roomD } },
            right:  { start: { x: roomW, z: 0 }, end: { x: roomW, z: roomD } }
        };

        for (let i = 0; i < window.customWalls.length; i++) {
            try {
                const cWall = window.customWalls[i];
                if (!cWall) continue;

                let p1;
                if (cWall.x !== undefined && cWall.y !== undefined &&
                    Number.isFinite(parseFloat(cWall.x)) && Number.isFinite(parseFloat(cWall.y))) {
                    p1 = { x: parseFloat(cWall.x), z: parseFloat(cWall.y) };
                } else {
                    const target = baseEndpoints[cWall.targetWall];
                    if (!target) continue;
                    p1 = (cWall.attachment === 'end')
                        ? { x: target.end.x, z: target.end.z }
                        : { x: target.start.x, z: target.start.z };
                }
                if (!Number.isFinite(p1.x) || !Number.isFinite(p1.z)) continue;

                const angleDeg = Number.isFinite(parseFloat(cWall.angle)) ? parseFloat(cWall.angle) : 0;
                const angleRad = angleDeg * (Math.PI / 180);
                const dirX = Math.cos(angleRad);
                const dirZ = Math.sin(angleRad);
                const len = Math.max(1, parseFloat(cWall.len) || 100);

                // فقط طول اصلی دیوار — بدون اضافهٔ overlap روی دیوار والد
                this._buildCustomWallSegment(
                    p1,
                    angleRad,
                    len,
                    t,
                    h,
                    cWall.shift,
                    cWall.id != null ? String(cWall.id) : ('cw' + i)
                );

                if (cWall.id != null) {
                    baseEndpoints[cWall.id] = {
                        start: p1,
                        end: { x: p1.x + len * dirX, z: p1.z + len * dirZ }
                    };
                }
            } catch (err) {
                // یک دیوار خراب کل محیط را خراب نکند
            }
        }

        this._customWallEndpoints = baseEndpoints;
    },

    /**
     * یک قطعه دیوار کاستوم — معادل window.buildCustomWallSegment
     * hinge در p1، چرخش -angleRad، شیفت چپ/راست روی ضخامت
     */
    _buildCustomWallSegment: function (p1, angleRad, len, wallThick, wallHeight, shift, wallId) {
        const safeLen = Math.max(1, len);
        const meshH = wallHeight + 40; // مثل Three: ارتفاع مش h+40
        // همان متریال دیوارهای اصلی (کش‌شده بر اساس طول)
        const mat = this._makeInnerWallMaterial(meshH, safeLen);

        const hinge = new BABYLON.TransformNode('customWall_' + wallId, this.scene);
        hinge.position.set(p1.x, 0, p1.z);
        hinge.rotation.y = -angleRad;
        hinge.metadata = { isCustomWall: true, wallId: wallId };

        let zShift = 0;
        if (shift === 'right') zShift = wallThick / 2;
        else if (shift === 'left') zShift = -wallThick / 2;

        // faceUV عین _addSolidWall تا دو وجه طولی یکسان و باندها از کف درست باشند
        // 0 front(+z), 1 back(-z), 2 right(+x), 3 left(-x), 4 top, 5 bottom
        const faceUV = [];
        for (let i = 0; i < 6; i++) {
            faceUV.push(new BABYLON.Vector4(0, 0, 1, 1));
        }
        // پشت: U برعکس تا دو طرف دیوار الگوی یکسان دیده شود
        faceUV[1] = new BABYLON.Vector4(1, 0, 0, 1);
        // لبه‌های کوتاه و بالا/پایین: تکرار کم
        faceUV[2] = new BABYLON.Vector4(0, 0, 0.12, 1);
        faceUV[3] = new BABYLON.Vector4(0, 0, 0.12, 1);
        faceUV[4] = new BABYLON.Vector4(0, 0, 0.15, 0.15);
        faceUV[5] = new BABYLON.Vector4(0, 0, 0.15, 0.15);

        const box = BABYLON.MeshBuilder.CreateBox('customWallMesh_' + wallId, {
            width: safeLen,
            height: meshH,
            depth: wallThick,
            faceUV: faceUV,
            wrap: true
        }, this.scene);

        box.position.set(safeLen / 2, wallHeight / 2, zShift);
        box.material = mat;
        box.parent = hinge;
        box.isPickable = false;
        box.isVisible = true;
        box.setEnabled(true);
        box.metadata = { isCustomWall: true, isWall: true, wallType: 'custom', wallId: wallId };
        hinge.setEnabled(true);

        return hinge;
    },

    _makeInnerWallMaterial: function (wallH, wallW) {
        // هر دیوار متریال مستقل (بدون کش/clone) — پایدار و عین منطق Three
        const cfg = this.config || {};
        const uid = 'iw_' + Math.floor(wallW || 0) + '_' + Math.floor(wallH || 0) + '_' + Math.floor(Math.random() * 1e9);
        const mat = new BABYLON.StandardMaterial(uid, this.scene);
        mat.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
        mat.backFaceCulling = false;
        mat.diffuseColor = new BABYLON.Color3(0.95, 0.94, 0.92);
        // کمی emissive تا در نور ضعیف هم دیوار دیده شود
        mat.emissiveColor = new BABYLON.Color3(0.08, 0.08, 0.08);

        try {
            const texHCm = Math.max(200, wallH || 280);
            const texWCm = 240;
            const size = 1024;
            const dyn = new BABYLON.DynamicTexture(uid + 'Tex', { width: size, height: size }, this.scene, false);
            dyn.hasAlpha = false;
            const ctx = dyn.getContext();
            const pxY = size / texHCm;
            const pxX = size / texWCm;

            const grout = cfg.wallGroutColor || '#c8c2b8';
            const L1 = cfg.wallBandLowerColor1 || '#fdfbf7';
            const L2 = cfg.wallBandLowerColor2 || '#f4f1ea';
            const M1 = cfg.wallBandMidColor1 || '#161616';
            const M2 = cfg.wallBandMidColor2 || '#1d1d1d';
            const U1 = cfg.wallBandUpperColor1 || '#fdfbf7';
            const U2 = cfg.wallBandUpperColor2 || '#f4f1ea';

            ctx.fillStyle = grout;
            ctx.fillRect(0, 0, size, size);

            const drawBand = function (y0, y1, tw, th, c1, c2, gapCm, veins) {
                const gapPx = Math.max(1, gapCm * pxX * 0.35);
                const gapPy = Math.max(1, gapCm * pxY * 0.35);
                for (let y = y0; y < y1 - 0.01; y += th) {
                    const curH = Math.min(th, y1 - y);
                    for (let x = 0; x < texWCm; x += tw) {
                        const col = Math.floor(x / tw);
                        const row = Math.floor(y / th);
                        ctx.fillStyle = ((col + row) % 2 === 0) ? c1 : c2;
                        const dx = x * pxX;
                        const dy = size - (y + curH) * pxY;
                        const dw = tw * pxX;
                        const dh = curH * pxY;
                        ctx.fillRect(dx + gapPx, dy + gapPy, dw - gapPx * 2, dh - gapPy * 2);
                        if (veins) {
                            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
                            ctx.lineWidth = 1.6;
                            const seed = (col * 17 + row * 31) % 97;
                            for (let v = 0; v < 5; v++) {
                                const s2 = (seed + v * 13) % 97;
                                const n1 = ((s2 * 7) % 100) / 100;
                                const n2 = ((s2 * 11) % 100) / 100;
                                const n3 = ((s2 * 13) % 100) / 100;
                                const n4 = ((s2 * 17) % 100) / 100;
                                const n5 = ((s2 * 19) % 100) / 100;
                                const n6 = ((s2 * 23) % 100) / 100;
                                ctx.beginPath();
                                ctx.moveTo(dx + gapPx + n1 * (dw - gapPx * 2), dy + gapPy + n2 * (dh - gapPy * 2));
                                ctx.bezierCurveTo(
                                    dx + n3 * dw, dy + n4 * dh,
                                    dx + n5 * dw, dy + n6 * dh,
                                    dx + ((n1 + n3) % 1) * dw, dy + ((n2 + n4) % 1) * dh
                                );
                                ctx.stroke();
                            }
                        }
                    }
                }
            };

            // باندها با جبران ۲۰cm (مش از y=-20)
            const floorOff = 20;
            drawBand(0, floorOff, 60, 30, L1, L2, 2.2, false);
            drawBand(floorOff, floorOff + 90, 60, 30, L1, L2, 2.2, false);
            drawBand(floorOff + 90, floorOff + 150, 80, 60, M1, M2, 3.0, true);
            drawBand(floorOff + 150, texHCm, 60, 30, U1, U2, 2.2, false);

            dyn.update(true);
            dyn.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            dyn.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            dyn.uScale = Math.max(0.25, (wallW || 300) / texWCm);
            dyn.vScale = 1;
            dyn.vOffset = 0;

            mat.diffuseTexture = dyn;
            mat.diffuseColor = BABYLON.Color3.White();
        } catch (e) {
            mat.diffuseColor = new BABYLON.Color3(0.95, 0.94, 0.92);
        }
        return mat;
    },


    _makeFloorCeramic: function (roomW, roomD) {
        const cfg = this.config || {};
        const mat = new BABYLON.StandardMaterial('floorCer', this.scene);
        mat.specularColor = new BABYLON.Color3(0.12, 0.12, 0.12);
        try {
            // کاشی 60×60 — واحد بافت = 2×2 کاشی = 120cm (مثل Three)
            const tileSize = Math.max(30, +(cfg.floorTileSizeCm) || 60);
            const tilesPerSide = 2;
            const texSizeCm = tileSize * tilesPerSide;
            const size = 1024;
            const dyn = new BABYLON.DynamicTexture('floorCerTex', size, this.scene, false);
            const ctx = dyn.getContext();
            const cell = size / tilesPerSide;
            // بندکشی نازک مثل Three: gapCm ≈ 0.28 نسبت به واحد بافت
            const gapCm = 0.28;
            const gap = Math.max(2, (gapCm / (tileSize * tilesPerSide)) * size);
            const c1 = cfg.floorTileColor1 || '#DCD3C6';
            const c2 = cfg.floorTileColor2 || '#CFC4B5';
            const grout = cfg.floorGroutColor || '#9a8f82';

            ctx.fillStyle = grout;
            ctx.fillRect(0, 0, size, size);
            for (let row = 0; row < tilesPerSide; row++) {
                for (let col = 0; col < tilesPerSide; col++) {
                    ctx.fillStyle = ((col + row) % 2) ? c2 : c1;
                    const ix = col * cell + gap;
                    const iy = row * cell + gap;
                    const iw = cell - gap * 2;
                    const ih = cell - gap * 2;
                    ctx.fillRect(ix, iy, iw, ih);
                    // لبه خیلی ظریف (نه شیار پهن)
                    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
                }
            }
            dyn.update(true);
            dyn.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            dyn.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            dyn.uScale = Math.max(0.2, roomW / texSizeCm);
            dyn.vScale = Math.max(0.2, roomD / texSizeCm);
            mat.diffuseTexture = dyn;
            mat.diffuseColor = BABYLON.Color3.White();
        } catch (e) {
            mat.diffuseColor = this._hexStrToColor3('#DCD3C6');
        }
        return mat;
    },

    _makeParquet: function (floorWCm, floorDCm) {
        const mat = new BABYLON.StandardMaterial('parquet', this.scene);
        mat.specularColor = new BABYLON.Color3(0.06, 0.05, 0.04);
        try {
            const size = 512;
            const texWCm = 200; // ۲ × ۱۰۰cm
            const texHCm = 200; // ۱۰ × ۲۰cm
            const plankL = 100;
            const plankW = 20;
            const dyn = new BABYLON.DynamicTexture('parquetTex', size, this.scene, false);
            const ctx = dyn.getContext();
            const pxX = size / texWCm;
            const pxY = size / texHCm;
            const colors = ['#5c3a1e', '#6b4423', '#7a4e2d', '#4a2f18', '#8b5a2b', '#634020', '#734a2a', '#5a381c'];

            ctx.fillStyle = '#3a2414';
            ctx.fillRect(0, 0, size, size);

            for (let yCm = 0; yCm < texHCm; yCm += plankW) {
                for (let xCm = 0; xCm < texWCm; xCm += plankL) {
                    const col = Math.floor(xCm / plankL);
                    const row = Math.floor(yCm / plankW);
                    ctx.fillStyle = colors[(col + row * 3) % colors.length];
                    const dx = xCm * pxX;
                    const dy = yCm * pxY;
                    const dw = plankL * pxX;
                    const dh = plankW * pxY;
                    const gap = 1.2;
                    ctx.fillRect(dx + gap, dy + gap, dw - gap * 2, dh - gap * 2);
                    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                    ctx.lineWidth = 0.8;
                    for (let i = 0; i < 3; i++) {
                        const ly = dy + gap + 3 + Math.random() * (dh - gap * 2 - 6);
                        ctx.beginPath();
                        ctx.moveTo(dx + gap + 2, ly);
                        ctx.lineTo(dx + dw - gap - 2, ly + (Math.random() - 0.5) * 2);
                        ctx.stroke();
                    }
                }
            }
            dyn.update();
            dyn.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            dyn.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            // اسکیل واقعی: هر ۲۰۰cm یک تکرار → تخته‌ها دقیقاً ۲۰×۱۰۰ دیده می‌شوند
            const fw = floorWCm || 2000;
            const fd = floorDCm || 2000;
            dyn.uScale = fw / texWCm;
            dyn.vScale = fd / texHCm;
            mat.diffuseTexture = dyn;
            mat.diffuseColor = BABYLON.Color3.White();
        } catch (e) {
            mat.diffuseColor = new BABYLON.Color3(0.4, 0.26, 0.14);
        }
        return mat;
    },

    /**
     * دیوار بیرون — بالا کرم #f5f2eb · پایین آجر تا ۱۱۲cm · خط جداکننده
     */
    _makeOuterWallMaterial: function (houseH, wallLen) {
        const mat = new BABYLON.StandardMaterial('outerWall_' + Math.floor(Math.random() * 1e5), this.scene);
        mat.specularColor = BABYLON.Color3.Black();
        mat.backFaceCulling = false;
        try {
            const size = 1024;
            const dyn = new BABYLON.DynamicTexture('outerWallTex_' + Math.floor(Math.random() * 1e5), size, this.scene, false);
            const ctx = dyn.getContext();
            const texWCm = 120;
            const texHCm = Math.max(200, houseH);
            const pxX = size / texWCm;
            const pxY = size / texHCm;
            const brickH = 112;

            // زمینه کرم #f5f2eb
            ctx.fillStyle = '#f5f2eb';
            ctx.fillRect(0, 0, size, size);

            // کاشی 60×30 تا ارتفاع 112cm
            const tileW = 60, tileH = 30, gap = 2;
            for (let y = 0; y < brickH; y += tileH) {
                const curH = Math.min(tileH, brickH - y);
                for (let x = 0; x < texWCm; x += tileW) {
                    const even = (Math.floor(x / tileW) + Math.floor(y / tileH)) % 2 === 0;
                    ctx.fillStyle = even ? '#dcb68a' : '#c89d6b';
                    const dx = x * pxX;
                    const dy = size - (y + curH) * pxY;
                    const dw = tileW * pxX;
                    const dh = curH * pxY;
                    ctx.fillRect(dx + gap, dy + gap, dw - gap * 2, dh - gap * 2);
                }
            }
            // خط جداکننده تیره در y=112
            const sepY = size - brickH * pxY;
            ctx.fillStyle = '#6b4527';
            ctx.fillRect(0, sepY - 3, size, 6);

            dyn.update(true);
            dyn.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            dyn.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            dyn.uScale = Math.max(0.5, wallLen / texWCm);
            dyn.vScale = 1;
            mat.diffuseTexture = dyn;
            mat.diffuseColor = BABYLON.Color3.White();
        } catch (e) {
            mat.diffuseColor = new BABYLON.Color3(0.96, 0.95, 0.92);
        }
        return mat;
    },

    _createCeilingLamps: function (rw, rd, rh) {
        if (this.config.ceilingLightOn === false) return;

        // چیدمان ۵ نقطه‌ای مثل Three.js
        const positions = [
            { x: rw * 0.25, z: rd * 0.25 },
            { x: rw * 0.75, z: rd * 0.25 },
            { x: rw * 0.50, z: rd * 0.50 },
            { x: rw * 0.25, z: rd * 0.75 },
            { x: rw * 0.75, z: rd * 0.75 }
        ];

        const frameMat = new BABYLON.StandardMaterial('lampFrame', this.scene);
        frameMat.diffuseColor = new BABYLON.Color3(0.78, 0.78, 0.78);
        frameMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

        const bulbMat = new BABYLON.StandardMaterial('lampBulb', this.scene);
        // رنگ نور #fff2e6
        bulbMat.diffuseColor = new BABYLON.Color3(1, 0.95, 0.90);
        bulbMat.emissiveColor = new BABYLON.Color3(1, 0.95, 0.90);
        bulbMat.specularColor = BABYLON.Color3.Black();

        // شدت Three=2600 → در Babylon PointLight حدود 0.4–0.6 متعادل است
        const ptIntensity = 0.45;

        for (let i = 0; i < positions.length; i++) {
            const p = positions[i];
            const frame = BABYLON.MeshBuilder.CreateCylinder('lf' + i, {
                diameterTop: 12.4, diameterBottom: 14.4, height: 1.2, tessellation: 16
            }, this.scene);
            frame.position.set(p.x, rh - 1.5, p.z);
            frame.material = frameMat;
            frame.isPickable = false;

            const bulb = BABYLON.MeshBuilder.CreateCylinder('lb' + i, {
                diameter: 10, height: 0.4, tessellation: 16
            }, this.scene);
            bulb.position.set(p.x, rh - 2.2, p.z);
            bulb.material = bulbMat;
            bulb.isPickable = false;

            if (i === 0 || i === 2 || i === 4) {
                const pt = new BABYLON.PointLight('cp' + i, new BABYLON.Vector3(p.x, rh - 4, p.z), this.scene);
                pt.intensity = ptIntensity;
                pt.diffuse = new BABYLON.Color3(1.0, 0.95, 0.90);
                pt.range = Math.max(rw, rd) * 1.1;
            }
        }
    },

    _hexToColor3: function (hex) {
        if (hex == null) return new BABYLON.Color3(1, 1, 1);
        if (typeof hex === 'string') return this._hexStrToColor3(hex);
        if (typeof hex === 'number') {
            return new BABYLON.Color3(
                ((hex >> 16) & 255) / 255,
                ((hex >> 8) & 255) / 255,
                (hex & 255) / 255
            );
        }
        return new BABYLON.Color3(1, 1, 1);
    },
    _hexStrToColor3: function (str) {
        let s = (str || '#fff').replace('#', '');
        if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
        return new BABYLON.Color3(
            parseInt(s.substring(0, 2), 16) / 255 || 0,
            parseInt(s.substring(2, 4), 16) / 255 || 0,
            parseInt(s.substring(4, 6), 16) / 255 || 0
        );
    },
    _updateStatus: function (t) {
        const el = document.getElementById('babylon-status');
        if (el) el.textContent = t;
    },

    /**
     * خواندن وضعیت دیوارها از چک‌باکس‌های پنل اتاق
     */
    _syncWallsFromPanel: function () {
        const top = document.getElementById('wall-top');
        const left = document.getElementById('wall-left');
        const right = document.getElementById('wall-right');
        const bottom = document.getElementById('wall-bottom');

        if (typeof Kitchen3D !== 'undefined' && Kitchen3D.config) {
            try { Object.assign(this.config, Kitchen3D.config); } catch (e) {}
        }

        if (top) this.config.hasTop = !!top.checked;
        if (left) this.config.hasLeft = !!left.checked;
        if (right) this.config.hasRight = !!right.checked;
        if (bottom) this.config.hasBottom = !!bottom.checked;
    },

    /**
     * بازسازی محیط بعد از تغییر دیوار / رنگ / پنل
     * معادل Kitchen3D.refreshRoom
     */
    refreshRoom: function () {
        if (!this.scene || !this.isReady) return;

        this._syncWallsFromPanel();

        const toDispose = [];
        this.scene.meshes.forEach(function (m) {
            if (!m || !m.name) return;
            const n = m.name;
            if (n.indexOf('floor') === 0 || n.indexOf('ceiling') === 0 ||
                n.indexOf('wall') === 0 || n.indexOf('cornice') === 0 ||
                n.indexOf('outer') === 0 || n.indexOf('lamp') === 0 ||
                n.indexOf('lf') === 0 || n.indexOf('lb') === 0 ||
                n.indexOf('customWall') === 0) {
                toDispose.push(m);
            }
        });
        toDispose.forEach(function (m) {
            // ماده را dispose نکن — ممکن است در کش/clone مشترک باشد
            try {
                if (m.material) m.material = null;
                m.dispose(false, false);
            } catch (e) {
                try { m.dispose(false, false); } catch (e2) {}
            }
        });
        // پاک‌سازی TransformNodeهای دیوار کاستوم
        if (this.scene.transformNodes) {
            const nodesToRem = [];
            this.scene.transformNodes.forEach(function (n) {
                if (n && n.name && n.name.indexOf('customWall_') === 0) nodesToRem.push(n);
            });
            nodesToRem.forEach(function (n) {
                try { n.dispose(); } catch (e) {}
            });
        }

        const lightsToRemove = [];
        this.scene.lights.forEach(function (l) {
            if (l && l.name && l.name.indexOf('cp') === 0) lightsToRemove.push(l);
        });
        lightsToRemove.forEach(function (l) {
            try { l.dispose(); } catch (e) {}
        });

        const roomW = (typeof room !== 'undefined' && room.w) ? room.w : (this._roomW || 400);
        const roomD = (typeof room !== 'undefined' && room.d) ? room.d : (this._roomD || 300);
        const roomH = (typeof room !== 'undefined' && room.h) ? room.h : (this._roomH || 280);
        this._roomW = roomW;
        this._roomD = roomD;
        this._roomH = roomH;

        this._createEnvironment(roomW, roomD, roomH);
        this._createCeilingLamps(roomW, roomD, roomH);
        this.renderCabinets();
        this._updateStatus('Babylon — walls updated');
    },

    /**
     * ساخت همه یونیت‌ها از آرایه سراسری cabinets
     * شکل ساده‌شده اما هم‌موقعیت با Three.js
     */
    renderCabinets: function (onlyId) {
        if (!this.scene || !this.isReady) return;

        const prefix = (onlyId != null) ? ('cab_' + onlyId) : 'cab_';
        const groupPrefix = (onlyId != null) ? ('cabGroup_' + onlyId) : 'cabGroup_';
        const toRemove = [];
        this.scene.meshes.forEach(function (m) {
            if (!m || !m.name) return;
            if (onlyId != null) {
                if (m.name === prefix || m.name.indexOf(prefix + '_') === 0) toRemove.push(m);
            } else if (m.name.indexOf('cab_') === 0) {
                toRemove.push(m);
            }
        });
        if (this.scene.transformNodes) {
            this.scene.transformNodes.forEach(function (n) {
                if (!n || !n.name) return;
                if (onlyId != null) {
                    if (n.name === groupPrefix) toRemove.push(n);
                } else if (n.name.indexOf('cabGroup_') === 0) {
                    toRemove.push(n);
                }
            });
        }
        toRemove.forEach(function (m) {
            try { m.dispose(false, true); } catch (e) {}
        });

        if (typeof cabinets !== 'undefined' && cabinets && cabinets.length) {
            const list = (onlyId != null)
                ? cabinets.filter(function (c) { return c && String(c.id) === String(onlyId); })
                : cabinets.slice();
            for (let i = 0; i < list.length; i++) {
                try { this._buildCabinet(list[i]); } catch (e) {}
            }
        }
        // صفحات و بین‌کابینتی و چهارچوب کمد
        if (onlyId == null) {
            try { this._renderAllCountertops(); } catch (e) {}
            try { this._renderInterPanels(); } catch (e) {}
            try { this._renderPillars(); } catch (e) {}
            try { this._renderClosetFrameUnits(); } catch (e) {}
        } else {
            // اگر id مربوط به چهارچوب کمد باشد، فقط همان را بازسازی کن
            try {
                const units = window.closetFrameUnits || [];
                const isCloset = units.some(function (u) {
                    return u && String(u.id) === String(onlyId);
                });
                if (isCloset) this._renderClosetFrameUnits();
            } catch (e) {}
        }
    },

    refreshCabinets: function (cabinetId) {
        if (!this.scene || !this.isReady) return;
        const only = (cabinetId != null && cabinetId !== -1 && cabinetId !== '') ? cabinetId : undefined;
        this.renderCabinets(only);
    },

    _mat: function (name, color3, spec) {
        const m = new BABYLON.StandardMaterial(name, this.scene);
        m.diffuseColor = color3;
        m.specularColor = spec || new BABYLON.Color3(0.05, 0.05, 0.05);
        return m;
    },

    /**
     * رنگ درب — مثل Three/door-editor:
     * پیش‌فرض #ffffff | اگر کد متریال بود از allMaterials | اگر hex بود همان
     */
    _parseDoorColor: function (dc) {
        // پیش‌فرض سفید (door-editor.js خط 1395 / 1579)
        const WHITE = new BABYLON.Color3(1, 1, 1);
        if (!dc || typeof dc !== 'string') return WHITE;

        // تکسچر URL
        if (dc.indexOf('http') >= 0 || dc.indexOf('assets/') >= 0 || dc.indexOf('/') >= 0) {
            return WHITE;
        }

        // hex مستقیم
        if (dc.charAt(0) === '#') {
            return this._hexStrToColor3(dc);
        }

        // کد متریال از کاتالوگ allMaterials
        try {
            if (window.allMaterials) {
                const types = Object.keys(window.allMaterials);
                for (let t = 0; t < types.length; t++) {
                    const list = window.allMaterials[types[t]] || [];
                    for (let i = 0; i < list.length; i++) {
                        const item = list[i];
                        if (item && (item.code === dc || item.texture === dc)) {
                            if (item.code && String(item.code).charAt(0) === '#') {
                                return this._hexStrToColor3(item.code);
                            }
                            if (item.edgeColor && String(item.edgeColor).charAt(0) === '#') {
                                return this._hexStrToColor3(item.edgeColor);
                            }
                            return WHITE; // تکسچر دارد → رنگ پایه سفید
                        }
                    }
                }
            }
        } catch (e) {}

        // عدد hex بدون #
        if (/^[0-9a-fA-F]{6}$/.test(dc)) {
            return this._hexStrToColor3('#' + dc);
        }

        return WHITE;
    },

    /** متریال درب کامل با تکسچر در صورت وجود — مثل createMesh در Three */
    _makeDoorMaterial: function (c, id, W, H) {
        const mat = new BABYLON.StandardMaterial('cabDoor_' + id, this.scene);
        mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);

        const size0 = (c.doorSizes && c.doorSizes[0]) ? c.doorSizes[0] : null;
        const colorKey = (size0 && (size0.doorTexture || size0.doorColor)) || c.doorColor || '#ffffff';
        const matType = (size0 && size0.doorMaterial) || c.doorMaterial || 'mdf';

        // جست‌وجو در allMaterials
        let textureUrl = null;
        let solidHex = null;
        try {
            if (typeof colorKey === 'string' && (colorKey.indexOf('http') >= 0 || colorKey.indexOf('assets/') >= 0)) {
                textureUrl = colorKey;
            } else if (window.allMaterials) {
                const list = window.allMaterials[matType] || window.allMaterials.mdf || [];
                const found = list.find(function (item) {
                    return item && (item.code === colorKey || item.texture === colorKey);
                }) || list[0];
                if (found) {
                    if (found.texture) textureUrl = found.texture;
                    else if (found.code && String(found.code).charAt(0) === '#') solidHex = found.code;
                }
            }
            if (!textureUrl && typeof colorKey === 'string' && colorKey.charAt(0) === '#') {
                solidHex = colorKey;
            }
        } catch (e) {}

        // fallback عمومی — تکسچر اختصاصی هر درب در _makeDoorMaterialForSlot ست می‌شود
        if (textureUrl) {
            try {
                const tex = new BABYLON.Texture(textureUrl, this.scene, false, true);
                tex.uScale = Math.max(0.3, (W || 60) / 100);
                tex.vScale = Math.max(0.3, (H || 72) / 100);
                mat.diffuseTexture = tex;
                mat.diffuseColor = BABYLON.Color3.White();
            } catch (e) {
                mat.diffuseColor = this._parseDoorColor(solidHex || colorKey);
            }
        } else {
            mat.diffuseColor = this._parseDoorColor(solidHex || colorKey || '#ffffff');
        }
        return mat;
    },

    /**
     * متریال اختصاصی هر درب/کشو بر اساس slotIndex
     * عین createMesh در view3d.js: U{id} - درب {n} از isolatedDoorTextures
     */
    _makeDoorMaterialForSlot: function (c, id, w, h, slotIndex) {
        const mat = new BABYLON.StandardMaterial(
            'cabDoor_' + id + '_s' + slotIndex,
            this.scene
        );
        mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);

        const size0 = (c.doorSizes && c.doorSizes[slotIndex])
            ? c.doorSizes[slotIndex]
            : ((c.doorSizes && c.doorSizes[0]) ? c.doorSizes[0] : null);
        const colorKey = (size0 && (size0.doorTexture || size0.doorColor)) || c.doorColor || '#ffffff';
        const matType = (size0 && size0.doorMaterial) || c.doorMaterial || 'mdf';

        let textureUrl = null;
        let solidHex = null;
        let isIsolated = false;

        // ۱) اولویت: تکسچر برش‌خورده — همان نام قطعه کات‌مستر
        // collectPieces: «درب زمینی U1 - درب قدی چپ/راست/جکی» و «… - درب 1»
        try {
            const cabId = String(c.id != null ? c.id : id);
            const si = slotIndex || 0;
            const partCandidates = [];

            if (c.isDrawerBody || c.doorType === 'drawer') {
                partCandidates.push('کشو ' + (si + 1));
            } else if (c.isBaseWithDrawer) {
                if (si === 0) partCandidates.push('کشو بالا');
                else partCandidates.push('درب پایین ' + si);
            } else if (c.doorType === 'jaki-ghadi') {
                // عین processAllCabinetDoors: اسلات ۰/۱/۲
                const doorsN = parseInt(c.doors, 10) || 2;
                if (doorsN <= 2) {
                    if (si === 0) partCandidates.push('درب قدی');
                    else partCandidates.push('درب جکی');
                } else {
                    if (si === 0) partCandidates.push('درب قدی چپ');
                    else if (si === 1) partCandidates.push('درب قدی راست');
                    else partCandidates.push('درب جکی');
                }
            } else {
                partCandidates.push('درب ' + (si + 1));
            }

            // الف) ایندکس دقیق cabId → نام قطعه
            if (window.isolatedDoorTexturesByCab && window.isolatedDoorTexturesByCab[cabId]) {
                const map = window.isolatedDoorTexturesByCab[cabId];
                for (let p = 0; p < partCandidates.length && !textureUrl; p++) {
                    if (map[partCandidates[p]]) {
                        textureUrl = map[partCandidates[p]];
                        isIsolated = true;
                    }
                }
            }

            // ب) تطبیق روی کلید کامل isolatedDoorTextures
            // مثال: «درب زمینی U1 - درب قدی راست»
            if (!textureUrl && window.isolatedDoorTextures) {
                const keys = Object.keys(window.isolatedDoorTextures);
                for (let p = 0; p < partCandidates.length && !textureUrl; p++) {
                    const part = partCandidates[p];
                    // فقط کلیدی که U{cabId} دارد و به همین نام قطعه ختم می‌شود
                    const re = new RegExp(
                        'U' + cabId + '(?!\\d)[\\s\\S]*-\\s*' +
                        part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
                        '\\s*$'
                    );
                    for (let i = 0; i < keys.length; i++) {
                        if (re.test(keys[i]) || keys[i] === part ||
                            (keys[i].indexOf('U' + cabId) >= 0 && keys[i].endsWith(part))) {
                            textureUrl = window.isolatedDoorTextures[keys[i]];
                            isIsolated = true;
                            break;
                        }
                    }
                }
            }
        } catch (e) {}

        // ۲) کاتالوگ / URL / hex
        if (!textureUrl) {
            try {
                if (typeof colorKey === 'string' &&
                    (colorKey.indexOf('http') >= 0 || colorKey.indexOf('assets/') >= 0 || colorKey.indexOf('data:image') === 0)) {
                    textureUrl = colorKey;
                } else if (window.allMaterials) {
                    const list = window.allMaterials[matType] || window.allMaterials.mdf || [];
                    const found = list.find(function (item) {
                        return item && (item.code === colorKey || item.texture === colorKey);
                    }) || list[0];
                    if (found) {
                        if (found.texture) textureUrl = found.texture;
                        else if (found.code && String(found.code).charAt(0) === '#') solidHex = found.code;
                    }
                }
                if (!textureUrl && typeof colorKey === 'string' && colorKey.charAt(0) === '#') {
                    solidHex = colorKey;
                }
            } catch (e) {}
        }

        if (textureUrl) {
            try {
                // invertY=false تا همان جهت کارگاه قطعات حفظ شود (نه وارونه)
                const tex = new BABYLON.Texture(
                    textureUrl,
                    this.scene,
                    false,
                    false,
                    BABYLON.Texture.TRILINEAR_SAMPLINGMODE
                );
                tex.anisotropicFilteringLevel = 8;
                if (isIsolated) {
                    // تکسچر برش‌خورده: یک‌به‌یک روی درب
                    tex.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                    tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                    tex.uScale = 1;
                    tex.vScale = 1;
                    tex.uOffset = 0;
                    tex.vOffset = 0;
                } else {
                    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                    tex.uScale = Math.max(0.05, (w || 60) / 100);
                    tex.vScale = Math.max(0.05, (h || 72) / 100);
                }
                mat.diffuseTexture = tex;
                mat.diffuseColor = BABYLON.Color3.White();
            } catch (e) {
                mat.diffuseColor = this._parseDoorColor(solidHex || colorKey);
            }
        } else {
            mat.diffuseColor = this._parseDoorColor(solidHex || colorKey || '#ffffff');
        }
        return mat;
    },

    /**
     * ساخت یونیت مطابق شاخه‌های view3d.js
     * floor → قید ۶cm + پایه ۱۴cm
     * wall  → سقف کامل ۱۶ میل
     * oven  → سقف یکپارچه
     * drawer / baseWithDrawer / appliance
     */
    _buildCabinet: function (c) {
        if (!c || !this.scene) return;

        const W = parseFloat(c.w) || 60;
        const H = parseFloat(c.h) || 72;
        const D = parseFloat(c.d) || 55;

        const thick = 1.6;
        const backThick = 0.3;
        const grooveDepth = 0.7;
        const backInset = 1.7;
        const shortTopDepth = 2.0;
        const topStripH = 6.0;   // قید بالایی ۶ سانت
        const legH = 14.0;       // پایه ۱۴ سانت
        const legR = 1.5;

        const id = c.id != null ? c.id : Math.floor(Math.random() * 1e6);
        const group = new BABYLON.TransformNode('cabGroup_' + id, this.scene);

        const bodyCol = new BABYLON.Color3(0.91, 0.90, 0.89); // #e8e6e3
        const backCol = new BABYLON.Color3(0.83, 0.82, 0.81); // #d4d2cf
        const legCol  = new BABYLON.Color3(0.20, 0.20, 0.20); // #333
        const bodyMat = this._mat('cabBody_' + id, bodyCol);
        const backMat = this._mat('cabBack_' + id, backCol, BABYLON.Color3.Black());
        const legMat  = this._mat('cabLeg_' + id, legCol, BABYLON.Color3.Black());

        // متریال درب — پیش‌فرض سفید مثل Three/door-editor
        const doorMat = this._makeDoorMaterial(c, id, W, H);

        // —— لوازم خانگی / یخچال ساده ——
        if (c.isAppliance || c.isFridge) {
            this._buildAppliance(group, c, W, H, D, id, doorMat);
            this._placeCabinetInRoom(group, c, W, H, D);
            return;
        }

        // —— کاور یخچال ——
        if (c.isFridgeWrap) {
            this._buildFridgeWrap(group, c, W, H, D, thick, id, doorMat, bodyMat);
            this._placeCabinetInRoom(group, c, W, H, D);
            return;
        }

        // —— کلاف هود ——
        if (c.isHoodWrap) {
            this._buildHoodWrap(group, c, W, H, D, thick, id, doorMat, bodyMat);
            this._placeCabinetInRoom(group, c, W, H, D);
            return;
        }

        // —— آب‌چکان ——
        if (c.isDishRack) {
            this._buildDishRack(group, c, W, H, D, thick, id, doorMat, bodyMat);
            this._placeCabinetInRoom(group, c, W, H, D);
            return;
        }

        // —— باکس نما ——
        if (c.isFacadeBox) {
            this._buildFacadeBox(group, c, W, H, D, thick, id, doorMat, bodyMat);
            this._placeCabinetInRoom(group, c, W, H, D);
            return;
        }

        // —— کافه بار ——
        if (c.isCoffeeBar) {
            this._buildCoffeeBar(group, c, W, H, D, thick, id, doorMat, bodyMat);
            this._placeCabinetInRoom(group, c, W, H, D);
            return;
        }

        // تشخیص نوع بدنه
        const isFloor = (c.type === 'floor' || c.type === 'waterproof' ||
            (!c.type && !c.isWall && (c.elevation || 0) < 50 && (c.y || 0) < 60));
        const isWall = (c.type === 'wall' || c.isUpperTier);
        const isOven = !!c.isOvenCabinet;
        const isWaterproof = (c.type === 'waterproof');

        // ========== بدنه مشترک: بغل چپ/راست + کف ==========
        // تشخیص دستگیره مخفی بالا → برش L روی لبه جلوی بغل‌ها (عین Three)
        let hasTopHidden = false;
        if (c.hiddenHandle === 'top' || c.drawerHiddenHandle === 'top') hasTopHidden = true;
        if (c.doorSizes && c.doorSizes.some(function (s) { return s && s.hiddenHandlePos === 'top'; })) hasTopHidden = true;

        const sideNotchD = 3.2; // عمق برش L
        const sideNotchH = 6.6; // ارتفاع برش L

        if (hasTopHidden) {
            // بغل چپ: قسمت عقب کامل + قسمت جلو کوتاه‌تر از بالا
            const backDepth = D - sideNotchD;
            const leftBack = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_LB', {
                width: thick, height: H, depth: backDepth
            }, this.scene);
            leftBack.position.set(-W / 2 + thick / 2, 0, -D / 2 + backDepth / 2);
            leftBack.material = bodyMat; leftBack.parent = group; leftBack.isPickable = false;

            const leftFront = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_LF', {
                width: thick, height: H - sideNotchH, depth: sideNotchD
            }, this.scene);
            leftFront.position.set(
                -W / 2 + thick / 2,
                -sideNotchH / 2,
                D / 2 - sideNotchD / 2
            );
            leftFront.material = bodyMat; leftFront.parent = group; leftFront.isPickable = false;

            // بغل راست
            const rightBack = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_RB', {
                width: thick, height: H, depth: backDepth
            }, this.scene);
            rightBack.position.set(W / 2 - thick / 2, 0, -D / 2 + backDepth / 2);
            rightBack.material = bodyMat; rightBack.parent = group; rightBack.isPickable = false;

            const rightFront = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_RF', {
                width: thick, height: H - sideNotchH, depth: sideNotchD
            }, this.scene);
            rightFront.position.set(
                W / 2 - thick / 2,
                -sideNotchH / 2,
                D / 2 - sideNotchD / 2
            );
            rightFront.material = bodyMat; rightFront.parent = group; rightFront.isPickable = false;
        } else {
            // بغل چپ کامل
            const left = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_L', {
                width: thick, height: H, depth: D
            }, this.scene);
            left.position.set(-W / 2 + thick / 2, 0, 0);
            left.material = bodyMat; left.parent = group; left.isPickable = false;

            // بغل راست کامل
            const right = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_R', {
                width: thick, height: H, depth: D
            }, this.scene);
            right.position.set(W / 2 - thick / 2, 0, 0);
            right.material = bodyMat; right.parent = group; right.isPickable = false;
        }

        // کف — پله دوم: ۲ سانت کوتاه از عقب (مثل سقف)، مماس با جلو z=1
        if (c.isUpperTier) {
            const shortDepth = D - 2.0;
            const bottom = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_B', {
                width: W - 2 * thick, height: thick, depth: shortDepth
            }, this.scene);
            bottom.position.set(0, -H / 2 + thick / 2, 1.0);
            bottom.material = bodyMat; bottom.parent = group; bottom.isPickable = false;
        } else {
            const bottom = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_B', {
                width: W - 2 * thick, height: thick, depth: D
            }, this.scene);
            bottom.position.set(0, -H / 2 + thick / 2, 0);
            bottom.material = bodyMat; bottom.parent = group; bottom.isPickable = false;
        }

        // فیبر پشت (ضدآب ندارد)
        if (!isWaterproof) {
            const backWidth = (W - 2 * thick) + (2 * grooveDepth);
            let backHeight, backY;
            if (c.isUpperTier) {
                // عین Three: H - 0.4، وسط
                backHeight = H - 0.4;
                backY = 0;
            } else if (isFloor) {
                backHeight = H - thick;
                backY = (-H / 2 + thick - grooveDepth) + backHeight / 2;
            } else {
                backHeight = Math.max(1, (H / 2 - 0.2) - (-H / 2 + thick - grooveDepth));
                backY = (-H / 2 + thick - grooveDepth) + backHeight / 2;
            }
            const back = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_Bk', {
                width: backWidth, height: backHeight, depth: backThick
            }, this.scene);
            back.position.set(0, backY, -D / 2 + backInset + backThick / 2);
            back.material = backMat; back.parent = group; back.isPickable = false;
        }

        // ========== سقف / قید ==========
        if (c.isUpperTier) {
            // پله دوم: سقف ۲ سانت کوتاه از عقب، مماس جلو z=1.0
            const shortDepth = D - 2.0;
            const top = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_T', {
                width: W - 2 * thick, height: thick, depth: shortDepth
            }, this.scene);
            top.position.set(0, H / 2 - thick / 2, 1.0);
            top.material = bodyMat; top.parent = group; top.isPickable = false;
        } else if (isOven || isWall || (!isFloor && !isOven)) {
            // سقف یکپارچه ۱۶ میل (دیواری عادی / فر)
            const topDepth = D - shortTopDepth;
            const top = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_T', {
                width: W - 2 * thick, height: thick, depth: topDepth
            }, this.scene);
            top.position.set(0, H / 2 - thick / 2, shortTopDepth / 2);
            top.material = bodyMat; top.parent = group; top.isPickable = false;
        } else {
            // یونیت زمینی عادی: دو قید ۶ سانتی (جلو + عقب)
            // قید پشت
            const topBack = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_railB', {
                width: W - 2 * thick, height: topStripH, depth: thick
            }, this.scene);
            topBack.position.set(0, H / 2 - topStripH / 2, -D / 2 + thick / 2);
            topBack.material = bodyMat; topBack.parent = group; topBack.isPickable = false;

            // قید جلو (دستگیره مخفی → ۳.۲ عقب) — hasTopHidden از بالا
            const topFront = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_railF', {
                width: W - 2 * thick, height: topStripH, depth: thick
            }, this.scene);
            const frontZ = hasTopHidden
                ? ((D / 2) - 3.2 - thick / 2)
                : (D / 2 - thick / 2);
            topFront.position.set(0, H / 2 - topStripH / 2, frontZ);
            topFront.material = bodyMat; topFront.parent = group; topFront.isPickable = false;
        }

        // ========== پایه‌های ۱۴ سانتی (یونیت زمینی) ==========
        if (isFloor && c.drawerLegs !== false && !c.isAppliance) {
            // اگر پاخور فعال باشد معمولاً پایه جدا دیده نمی‌شود؛ ولی در Three با drawerLegs ساخته می‌شود
            const useLegs = !(c.kickboard && c.kickboard.enabled);
            if (useLegs || c.drawerLegs === true) {
                const legY = -H / 2 - legH / 2;
                const sideInset = 4.0;
                const backInsetLeg = 4.0;
                const frontInsetLeg = 6.0;
                const zB = -D / 2 + backInsetLeg;
                const zF = D / 2 - frontInsetLeg;
                const legPositions = [
                    [-W / 2 + sideInset, zB],
                    [ W / 2 - sideInset, zB],
                    [-W / 2 + sideInset, zF],
                    [ W / 2 - sideInset, zF]
                ];
                for (let i = 0; i < 4; i++) {
                    const leg = BABYLON.MeshBuilder.CreateCylinder('cab_' + id + '_leg' + i, {
                        diameter: legR * 2, height: legH, tessellation: 12
                    }, this.scene);
                    leg.position.set(legPositions[i][0], legY, legPositions[i][1]);
                    leg.material = legMat; leg.parent = group; leg.isPickable = false;
                }
            }
        }

        // قفسه‌ها
        this._createShelves(group, c, W, H, D, thick, bodyMat, id);

        // درب / کشو
        if (c.showDoors !== false) {
            this._createDoorSystem(group, c, W, H, D, thick, doorMat, id);
        }

        // پاخور — فقط زمینی
        if (!c.isUpperTier && isFloor) {
            this._createKickboard(group, c, W, H, D, thick, id);
        }

        // تاج کابینت
        this._createCrown(group, c, W, H, D, thick, id);

        // نور زیر کابینت دیواری / پله دوم
        if (c.type === 'wall' || c.isUpperTier) {
            this._createUnderCabinetLight(group, c, W, H, D, id);
        }

        // نمای کابینت (جانبی ۱۶میل / ترمووال / پیشانی صفحه)
        this._createFacadeSystem(group, c, W, H, D, id);

        this._placeCabinetInRoom(group, c, W, H, D);
    },

    /**
     * نمای کابینت — معادل facadeConfig در view3d.js (خطوط ۶۲۸۰+)
     * پنل ۱۶میل جانبی + ترمووال + پیشانی صفحه (Worktop)
     */
    _createFacadeSystem: function (group, c, W, H, D, id) {
        if (!c || !c.facadeConfig || !c.facadeConfig.enabled) return;

        const fConf = c.facadeConfig;
        const uId = c.id != null ? c.id : id;
        const scene = this.scene;
        const self = this;

        const customH = (fConf.customLength > 0) ? fConf.customLength : H;
        const customW = (fConf.customWidth > 0) ? fConf.customWidth : D;
        const thick16 = 1.6;
        const offset16 = fConf.is16mm ? thick16 : 0;
        const thermoCount = fConf.thermoCount || 1;
        const twWidth = fConf.thermoWidth || 4;
        const twThick = fConf.thermoThickness || 2;
        const thermoCustomHeightVal = fConf.thermoCustomHeight || 0;
        const thermoH = thermoCustomHeightVal > 0 ? thermoCustomHeightVal : customH;
        const thermoHeightPos = fConf.thermoHeightPos || 'center';
        const facadeDepth = fConf.is16mm ? customW : D;
        const worktopCustomWidthVal = fConf.worktopCustomWidth || 0;
        const wtDepth = worktopCustomWidthVal > 0 ? worktopCustomWidthVal : facadeDepth;
        const wtWidthPos = fConf.worktopWidthPos || 'center';

        // موقعیت Y طول کاستوم
        const lengthPos = fConf.customLengthPos || 'center';
        let yPos = 0;
        if (lengthPos === 'start') yPos = -H / 2 + customH / 2;
        else if (lengthPos === 'end') yPos = H / 2 - customH / 2;

        // موقعیت Z عرض کاستوم
        const widthPos = fConf.customWidthPos || 'center';
        let zPos = 0;
        if (widthPos === 'start') zPos = -D / 2 + customW / 2;
        else if (widthPos === 'end') zPos = D / 2 - customW / 2;

        function getFacadeMat(labelKey, fallbackValue, defaultColor, finishKey) {
            const isThermo = labelKey && String(labelKey).indexOf('ترمووال') >= 0;
            const fk = (finishKey || (isThermo ? 'satin' : 'matte')).toString().toLowerCase();
            let specPower = isThermo ? 28 : 20;
            let specCol = new BABYLON.Color3(0.1, 0.1, 0.1);
            try {
                if (typeof window.getKitchenFinishPreset === 'function') {
                    const preset = window.getKitchenFinishPreset(fk) || {};
                    if (preset.roughness != null) {
                        specPower = Math.max(4, (1 - preset.roughness) * 72);
                    }
                }
                if (fk.indexOf('gloss') >= 0) {
                    specPower = 80;
                    specCol = new BABYLON.Color3(0.4, 0.4, 0.42);
                }
            } catch (e) {}

            const mat = new BABYLON.StandardMaterial(
                'facade_' + uId + '_' + String(labelKey || 'x').replace(/\s+/g, '_').slice(0, 40),
                scene
            );
            mat.specularColor = specCol;
            mat.specularPower = specPower;

            let textureUrl = null;
            let solidHex = defaultColor || '#FFFFFF';
            try {
                if (labelKey && window.isolatedDoorTextures && window.isolatedDoorTextures[labelKey]) {
                    textureUrl = window.isolatedDoorTextures[labelKey];
                }
            } catch (e) {}

            if (!textureUrl && fallbackValue && typeof fallbackValue === 'string') {
                if (fallbackValue.charAt(0) === '#') {
                    solidHex = fallbackValue;
                } else if (
                    fallbackValue.indexOf('http') === 0 ||
                    fallbackValue.indexOf('data:image') === 0 ||
                    fallbackValue.indexOf('assets/') >= 0 ||
                    fallbackValue.indexOf('/') >= 0 ||
                    fallbackValue.indexOf('.') >= 0
                ) {
                    textureUrl = fallbackValue;
                } else {
                    solidHex = fallbackValue;
                }
            }

            if (textureUrl) {
                try {
                    const tex = new BABYLON.Texture(textureUrl, scene, false, true);
                    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                    mat.diffuseTexture = tex;
                    mat.diffuseColor = BABYLON.Color3.White();
                } catch (e) {
                    mat.diffuseColor = self._hexToColor3(solidHex);
                }
            } else {
                mat.diffuseColor = self._hexToColor3(solidHex);
            }
            return mat;
        }

        function buildSide(isLeft) {
            const sideText = isLeft ? 'چپ' : 'راست';
            const sideRoot = new BABYLON.TransformNode('facadeSide_' + uId + '_' + sideText, scene);
            sideRoot.parent = group;

            // ۱) پنل ۱۶ میل
            if (fConf.is16mm) {
                const label16 = 'پنل نمای ۱۶میل جانبی ' + sideText + ' U' + uId;
                const mat16 = getFacadeMat(label16, c.facade16mmMaterialValue, '#FFFFFF', c.facade16mmFinish || 'matte');
                const mesh16 = BABYLON.MeshBuilder.CreateBox('fac16_' + uId + '_' + sideText, {
                    width: thick16, height: customH, depth: customW
                }, scene);
                const xPos = isLeft ? (-W / 2 - thick16 / 2) : (W / 2 + thick16 / 2);
                mesh16.position.set(xPos, yPos, zPos);
                mesh16.material = mat16;
                mesh16.parent = sideRoot;
                mesh16.isPickable = false;
                mesh16.metadata = { isFacade: true };
            }

            // ۲) ترمووال‌ها
            if (fConf.isThermo) {
                const startZ = zPos - facadeDepth / 2 + twWidth / 2;
                const endZ = zPos + facadeDepth / 2 - twWidth / 2;
                let thermoYPos = yPos;
                if (thermoHeightPos === 'start') {
                    thermoYPos = (yPos - customH / 2) + thermoH / 2;
                } else if (thermoHeightPos === 'end') {
                    thermoYPos = (yPos + customH / 2) - thermoH / 2;
                }

                for (let ti = 0; ti < thermoCount; ti++) {
                    const labelT = 'شاخه ترمووال ' + (ti + 1) + ' نمای جانبی ' + sideText + ' U' + uId;
                    const matT = getFacadeMat(labelT, c.facadeThermoMaterialValue, '#FFFFFF', c.facadeThermoFinish || 'matte');
                    const meshT = BABYLON.MeshBuilder.CreateBox('facTw_' + uId + '_' + sideText + '_' + ti, {
                        width: twThick, height: thermoH, depth: twWidth
                    }, scene);
                    const xPos = isLeft
                        ? (-W / 2 - offset16 - twThick / 2)
                        : (W / 2 + offset16 + twThick / 2);
                    let zThermoPos = zPos;
                    if (thermoCount > 1) {
                        const step = (endZ - startZ) / (thermoCount - 1);
                        zThermoPos = startZ + ti * step;
                    }
                    meshT.position.set(xPos, thermoYPos, zThermoPos);
                    meshT.material = matT;
                    meshT.parent = sideRoot;
                    meshT.isPickable = false;
                    meshT.metadata = { isFacade: true };
                }
            }

            // ۳) پیشانی نما صفحه (Worktop)
            if (fConf.isWorktop) {
                const labelW = 'پیشانی نما صفحه جانبی (Worktop) ' + sideText + ' U' + uId;
                const matW = getFacadeMat(labelW, c.facadeWorktopMaterialValue, '#FFFFFF', c.facadeWorktopFinish || 'matte');
                const wtHeight = fConf.worktopHeight || 5;
                const wtThickness = fConf.worktopThickness || 3.2;
                const wtMesh = BABYLON.MeshBuilder.CreateBox('facWt_' + uId + '_' + sideText, {
                    width: wtThickness, height: wtHeight, depth: wtDepth
                }, scene);
                const wtYPos = (yPos + customH / 2) - wtHeight / 2;
                let zWtPos = zPos;
                if (wtWidthPos === 'start') {
                    zWtPos = (zPos - facadeDepth / 2) + wtDepth / 2;
                } else if (wtWidthPos === 'end') {
                    zWtPos = (zPos + facadeDepth / 2) - wtDepth / 2;
                }
                const xPos = isLeft
                    ? (-W / 2 - offset16 - wtThickness / 2)
                    : (W / 2 + offset16 + wtThickness / 2);
                wtMesh.position.set(xPos, wtYPos, zWtPos);
                wtMesh.material = matW;
                wtMesh.parent = sideRoot;
                wtMesh.isPickable = false;
                wtMesh.metadata = { isFacade: true };
            }
        }

        if (fConf.isLeft) buildSide(true);
        if (fConf.isRight) buildSide(false);
    },

    /**
     * نور LED زیر کابینت دیواری / پله دوم — معادل createUnderCabinetLight
     */
    _createUnderCabinetLight: function (group, c, W, H, D, id) {
        if (!c.underCabinetLight) return;
        if (c.underCabinetLight.enabled === false) return;

        const intensityScale = (c.underCabinetLight.intensity != null)
            ? parseFloat(c.underCabinetLight.intensity) : 1.0;
        let ledCol = new BABYLON.Color3(1.0, 0.95, 0.88);
        try {
            const raw = c.underCabinetLight.color;
            if (typeof raw === 'number') {
                ledCol = new BABYLON.Color3(
                    ((raw >> 16) & 255) / 255,
                    ((raw >> 8) & 255) / 255,
                    (raw & 255) / 255
                );
            } else if (typeof raw === 'string' && raw.charAt(0) === '#') {
                ledCol = this._hexToColor3(raw);
            }
        } catch (e) {}

        const stripW = Math.max(5, W - 3.2);
        const stripY = -H / 2 - 0.3;
        const stripZ = D / 2 - 2.5;

        const mat = new BABYLON.StandardMaterial('uclMat_' + id, this.scene);
        mat.diffuseColor = ledCol;
        mat.emissiveColor = ledCol.scale(0.9);
        mat.specularColor = BABYLON.Color3.Black();
        mat.disableLighting = true;

        const strip = BABYLON.MeshBuilder.CreateBox('ucl_' + id, {
            width: stripW, height: 0.35, depth: 1.2
        }, this.scene);
        strip.position.set(0, stripY, stripZ);
        strip.material = mat;
        strip.parent = group;
        strip.isPickable = false;
        strip.metadata = { isUnderCabinetLight: true };

        const fill = new BABYLON.PointLight(
            'uclFill_' + id,
            new BABYLON.Vector3(0, stripY - 2, stripZ),
            this.scene
        );
        fill.diffuse = ledCol;
        fill.intensity = Math.max(0.3, intensityScale * 0.8);
        fill.range = 40;
        fill.parent = group;
        fill.metadata = { isUnderCabinetLight: true };
    },

    /** متریال‌های مشترک لوازم — معادل _applianceMats در view3d.js */
    _applianceMats: function (id) {
        id = id || 'app';
        if (this._appMatCache && this._appMatCache._uid === id) return this._appMatCache;
        const steel = this._mat('appSteel_' + id, new BABYLON.Color3(0.82, 0.83, 0.85), new BABYLON.Color3(0.55, 0.55, 0.55));
        const steelDark = this._mat('appSteelD_' + id, new BABYLON.Color3(0.42, 0.43, 0.45), new BABYLON.Color3(0.5, 0.5, 0.5));
        const black = this._mat('appBlk_' + id, new BABYLON.Color3(0.1, 0.1, 0.1), new BABYLON.Color3(0.25, 0.25, 0.25));
        const blackSteel = this._mat('appBlkS_' + id, new BABYLON.Color3(0.16, 0.16, 0.18), new BABYLON.Color3(0.55, 0.55, 0.55));
        const chrome = this._mat('appChr_' + id, new BABYLON.Color3(0.91, 0.91, 0.93), new BABYLON.Color3(0.85, 0.85, 0.85));
        const white = this._mat('appWht_' + id, new BABYLON.Color3(0.96, 0.96, 0.96), new BABYLON.Color3(0.12, 0.12, 0.12));
        const rubber = this._mat('appRub_' + id, new BABYLON.Color3(0.07, 0.07, 0.07), new BABYLON.Color3(0.02, 0.02, 0.02));
        const glass = this._mat('appGls_' + id, new BABYLON.Color3(0.04, 0.04, 0.07), new BABYLON.Color3(0.6, 0.6, 0.6));
        if (glass) {
            glass.alpha = 0.88;
            try { glass.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND; } catch (e) {}
        }
        const cache = { steel: steel, steelDark: steelDark, black: black, blackSteel: blackSteel, chrome: chrome, white: white, rubber: rubber, glass: glass, _uid: id };
        this._appMatCache = cache;
        return cache;
    },

    _box: function (name, w, h, d, x, y, z, mat, parent) {
        const m = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene);
        m.position.set(x, y, z);
        m.material = mat;
        m.parent = parent;
        m.isPickable = false;
        return m;
    },

    _cyl: function (name, diam, height, x, y, z, mat, parent, tess) {
        const m = BABYLON.MeshBuilder.CreateCylinder(name, {
            diameter: diam, height: height, tessellation: tess || 16
        }, this.scene);
        m.position.set(x, y, z);
        m.material = mat;
        m.parent = parent;
        m.isPickable = false;
        return m;
    },

    /**
     * سیستم لوازم — معادل createApplianceSystem
     */
    _buildAppliance: function (group, c, W, H, D, id, doorMat) {
        const label = (c.label || c.name || '').toString();
        const lower = label.toLowerCase();
        const isFridge = c.h > 150 || label.indexOf('یخچال') >= 0 || lower.indexOf('fridge') >= 0;
        const isWash = label.indexOf('لباسشویی') >= 0 || lower.indexOf('wash') >= 0;
        const isDish = label.indexOf('ظرفشویی') >= 0 || lower.indexOf('dish') >= 0;
        const isOven = label.indexOf('فر') >= 0 || c.isOven || lower.indexOf('oven') >= 0;
        const isHood = label.indexOf('هود') >= 0 || c.isHood || lower.indexOf('hood') >= 0;
        const isStove = label.indexOf('اجاق') >= 0 || label.indexOf('گاز') >= 0 ||
            lower.indexOf('stove') >= 0 || lower.indexOf('cooktop') >= 0;

        if (isFridge) this._buildFridge(group, c, W, H, D, id);
        else if (isWash) this._buildWashingMachine(group, c, W, H, D, id);
        else if (isDish) this._buildDishwasher(group, c, W, H, D, id);
        else if (isOven) this._buildOven(group, c, W, H, D, id);
        else if (isHood) this._buildHood(group, c, W, H, D, id);
        else if (isStove) this._buildStove(group, c, W, H, D, id);
        else this._buildGenericAppliance(group, c, W, H, D, id);
    },

    /**
     * یخچال واقعی — مطابق عکس محصول
     * doors=1 → فریزر بالا + یخچال پایین (دستگیره چپ، نمایشگر، آبسردکن)
     * doors=2 → ساید بای ساید (دستگیره وسط، دو نمایشگر، آبسردکن راست)
     */
    _buildFridge: function (group, c, W, H, D, id) {
        const m = this._applianceMats(id);
        W = Math.max(40, W); H = Math.max(120, H); D = Math.max(50, D);
        const doorT = 4.0;
        const gapDoors = 0.6;
        const bodyD = Math.max(22, D - doorT - 0.5);
        const frontZ = bodyD / 2;
        const doorZ = frontZ + doorT / 2;
        const doorCount = parseInt(c.doors, 10) || 1;

        // متریال استیل درب (مثل عکس)
        const steelDoor = this._mat('frgDoor_' + id,
            new BABYLON.Color3(0.72, 0.74, 0.76), new BABYLON.Color3(0.65, 0.65, 0.65));
        const chrome = m.chrome;
        const black = m.black;
        const dark = m.steelDark || m.blackSteel;

        // بدنه پشت درب
        this._box('frgB_' + id, W - 1.0, H - 1.5, bodyD, 0, 0, -0.3, m.steel, group);
        // پایه‌ها
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s, i) {
            this._cyl('frgFoot_' + id + i, 2.2, 2.0,
                s[0] * (W / 2 - 5), -H / 2 + 1.0, s[1] * (bodyD / 2 - 6),
                black, group, 10);
        }, this);

        const self = this;
        // دستگیره کروم عمودی بلند (مثل عکس)
        function addChromeHandle(x, y, len) {
            const zBar = doorZ + doorT / 2 + 1.15;
            const zPeg = doorZ + doorT / 2 + 0.45;
            // میله
            self._box('frgBar_' + id + '_' + Math.floor(x * 10) + '_' + Math.floor(y),
                1.15, len, 1.15, x, y, zBar, chrome, group);
            // کلاهک بالا/پایین
            self._box('frgCapT_' + id + '_' + Math.floor(y),
                1.25, 0.6, 1.25, x, y + len / 2, zBar, chrome, group);
            self._box('frgCapB_' + id + '_' + Math.floor(y),
                1.25, 0.6, 1.25, x, y - len / 2, zBar, chrome, group);
            // پایه اتصال به درب
            const span = len * 0.38;
            self._box('frgPegT_' + id + '_' + Math.floor(y),
                0.85, 0.85, 0.9, x, y + span, zPeg, chrome, group);
            self._box('frgPegB_' + id + '_' + Math.floor(y),
                0.85, 0.85, 0.9, x, y - span, zPeg, chrome, group);
        }

        // نمایشگر باریک عمودی
        function addDisplay(x, y, dw, dh) {
            const z = doorZ + doorT / 2 + 0.12;
            self._box('frgDispF_' + id + '_' + Math.floor(x * 10),
                dw, dh, 0.35, x, y, z, black, group);
            // صفحه داخلی کمی روشن‌تر
            const scr = self._mat('frgScr_' + id + '_' + Math.floor(x * 10),
                new BABYLON.Color3(0.08, 0.12, 0.18), new BABYLON.Color3(0.05, 0.05, 0.05));
            try { scr.emissiveColor = new BABYLON.Color3(0.05, 0.1, 0.18); } catch (e) {}
            self._box('frgDispS_' + id + '_' + Math.floor(x * 10),
                dw * 0.7, dh * 0.82, 0.2, x, y, z + 0.12, scr, group);
        }

        // آبسردکن
        function addDispenser(x, y) {
            const z = doorZ + doorT / 2;
            // قاب فرو رفته
            self._box('frgDispRec_' + id,
                12, 16, 1.2, x, y, z + 0.2, dark, group);
            // بدنه آبسردکن
            self._box('frgDispBody_' + id,
                10, 12, 2.5, x, y - 0.5, z + 1.4, dark, group);
            // سینی قطره
            self._box('frgDispTray_' + id,
                9, 1.2, 3.0, x, y - 6.5, z + 1.6, black, group);
            // خروجی آب
            self._cyl('frgDispNoz_' + id, 1.2, 1.5, x, y + 2.5, z + 2.2, chrome, group, 10);
        }

        if (doorCount >= 2) {
            // ========== ساید بای ساید (عکس دوم) ==========
            const doorH = H - 3.5;
            const doorW = (W - 1.5 - gapDoors) / 2;

            [-1, 1].forEach(function (side) {
                const dx = side * (doorW / 2 + gapDoors / 2);
                // درب استیل
                self._box('frgD_' + id + side, doorW, doorH, doorT, dx, 0, doorZ, steelDoor, group);
                // پخ لبه وسط
                self._box('frgEdge_' + id + side, 0.25, doorH * 0.98, 0.15,
                    dx - side * (doorW / 2 - 0.2), 0, doorZ + doorT / 2 + 0.05, dark, group);
                // نمایشگر بالای هر درب
                addDisplay(dx - side * (doorW * 0.15), doorH * 0.28, 3.2, 12);
            });
            // خط وسط
            self._box('frgMid_' + id, gapDoors, H - 4, doorT * 0.95, 0, 0, doorZ, black, group);

            // دستگیره‌های جفت نزدیک وسط (مثل عکس)
            const handleLen = Math.min(55, doorH * 0.42);
            addChromeHandle(-(gapDoors / 2 + 2.8), -doorH * 0.02, handleLen);
            addChromeHandle( (gapDoors / 2 + 2.8), -doorH * 0.02, handleLen);

            // آبسردکن روی درب راست
            addDispenser(doorW * 0.28, -doorH * 0.12);

            // لوگو بالای درب چپ
            self._box('frgLogo_' + id, 8, 1.2, 0.15,
                -doorW * 0.25, doorH * 0.42, doorZ + doorT / 2 + 0.1, dark, group);

        } else {
            // ========== فریزر بالا + یخچال پایین (عکس اول) ==========
            const gapH = 0.8;
            const topH = H * 0.28;
            const botH = H - topH - gapH - 3.5;
            const topY = H / 2 - 1.5 - topH / 2;
            const botY = -H / 2 + 1.8 + botH / 2;
            const doorW = W - 1.8;

            // درب بالا (فریزر)
            this._box('frgDT_' + id, doorW, topH, doorT, 0, topY, doorZ, steelDoor, group);
            // درب پایین
            this._box('frgDB_' + id, doorW, botH, doorT, 0, botY, doorZ, steelDoor, group);
            // شکاف افقی
            this._box('frgHG_' + id, doorW - 0.5, gapH, doorT * 0.9,
                0, (topY - topH / 2 + botY + botH / 2) / 2, doorZ, black, group);

            // دستگیره چپ روی هر دو درب
            const hx = -W / 2 + 7;
            addChromeHandle(hx, topY, Math.min(topH * 0.55, 22));
            addChromeHandle(hx, botY + botH * 0.02, Math.min(botH * 0.55, 55));

            // نمایشگر وسط درب فریزر
            addDisplay(0, topY, 3.0, Math.min(topH * 0.5, 14));

            // آبسردکن روی درب پایین (سمت راست)
            addDispenser(W * 0.18, botY + botH * 0.08);

            // لوگو بالای فریزر
            this._box('frgLogo_' + id, 7, 1.0, 0.15,
                0, topY + topH * 0.35, doorZ + doorT / 2 + 0.1, dark, group);
        }
    },


    /**
     * لباسشویی — مطابق عکس: بدنه نقره‌ای، پنل بالا با ولوم و نمایشگر،
     * درب دایره‌ای مشکی بزرگ، دستگیره کنار درب، دریچه فیلتر پایین
     */
    _buildWashingMachine: function (group, c, W, H, D, id) {
        const m = this._applianceMats(id);
        W = Math.max(45, W); H = Math.max(70, H); D = Math.max(45, D);
        const frontZ = D / 2;

        // بدنه نقره‌ای/خاکستری
        const bodyMat = this._mat('wmBody_' + id,
            new BABYLON.Color3(0.78, 0.80, 0.82), new BABYLON.Color3(0.25, 0.25, 0.25));
        this._box('wmB_' + id, W, H, D - 1.2, 0, 0, -0.5, bodyMat, group);

        // پایه‌ها
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s, i) {
            this._box('wmFoot_' + id + i, 2.5, 1.8, 2.5,
                s[0] * (W / 2 - 4), -H / 2 + 0.9, s[1] * (D / 2 - 5),
                m.black, group);
        }, this);

        // ---- پنل کنترل بالا ----
        const panelH = Math.min(16, H * 0.18);
        const panelY = H / 2 - panelH / 2;

        // پس‌زمینه پنل نقره‌ای
        this._box('wmPanel_' + id, W - 0.6, panelH, 1.5, 0, panelY, frontZ - 0.3, bodyMat, group);

        // کشوی مواد شوینده (چپ)
        this._box('wmDrawer_' + id, W * 0.32, panelH - 2.5, 2.0,
            -W * 0.30, panelY + 0.5, frontZ + 0.5, m.steel, group);
        // دستگیره کشو
        this._box('wmDrawerH_' + id, W * 0.22, 1.0, 1.0,
            -W * 0.30, panelY - panelH * 0.28, frontZ + 1.3, m.chrome, group);

        // ناحیه وسط/راست پنل (خاکستری روشن‌تر)
        this._box('wmPanelR_' + id, W * 0.58, panelH - 1.5, 0.8,
            W * 0.12, panelY, frontZ + 0.35, m.steel, group);

        // ولوم بزرگ وسط
        const dialX = -W * 0.02;
        const dial = this._cyl('wmDial_' + id, 5.5, 1.4, dialX, panelY + 1.0, frontZ + 1.0, m.chrome, group, 24);
        dial.rotation.x = Math.PI / 2;
        const dialKnob = this._cyl('wmDialK_' + id, 3.8, 1.2, dialX, panelY + 1.0, frontZ + 1.7, m.chrome, group, 20);
        dialKnob.rotation.x = Math.PI / 2;
        // نشانگر ولوم
        this._box('wmDialMark_' + id, 0.45, 1.6, 0.35,
            dialX, panelY + 1.0 + 1.5, frontZ + 2.0, m.black, group);

        // نمایشگر مشکی سمت راست
        const dispMat = this._mat('wmDisp_' + id,
            new BABYLON.Color3(0.05, 0.06, 0.08), new BABYLON.Color3(0.02, 0.02, 0.02));
        try { dispMat.emissiveColor = new BABYLON.Color3(0.02, 0.08, 0.12); } catch (e) {}
        this._box('wmDisp_' + id, W * 0.28, panelH * 0.55, 0.4,
            W * 0.28, panelY + 1.2, frontZ + 0.85, dispMat, group);

        // ردیف دکمه‌های زیر نمایشگر
        for (let i = 0; i < 5; i++) {
            const btn = this._box('wmBtn_' + id + i, 2.2, 1.0, 0.3,
                W * 0.12 + i * 2.8, panelY - panelH * 0.22, frontZ + 0.9,
                m.blackSteel || m.black, group);
        }

        // ---- درب دایره‌ای بزرگ مشکی ----
        const doorR = Math.min(W, H - panelH) * 0.36;
        const doorCy = -panelH * 0.12;
        const doorZ = frontZ + 0.5;

        // قاب بیرونی مشکی ضخیم
        const frame = BABYLON.MeshBuilder.CreateTorus('wmFrame_' + id, {
            diameter: doorR * 2.05, thickness: 4.2, tessellation: 36
        }, this.scene);
        frame.position.set(0, doorCy, doorZ + 0.3);
        frame.rotation.x = Math.PI / 2;
        frame.material = m.black; frame.parent = group; frame.isPickable = false;

        // حلقه داخلی
        const ring = BABYLON.MeshBuilder.CreateTorus('wmRing_' + id, {
            diameter: doorR * 1.75, thickness: 1.8, tessellation: 32
        }, this.scene);
        ring.position.set(0, doorCy, doorZ + 0.5);
        ring.rotation.x = Math.PI / 2;
        ring.material = m.blackSteel || m.black; ring.parent = group; ring.isPickable = false;

        // شیشه تیره
        const glass = BABYLON.MeshBuilder.CreateCylinder('wmGlass_' + id, {
            diameter: doorR * 1.65, height: 1.0, tessellation: 32
        }, this.scene);
        glass.rotation.x = Math.PI / 2;
        glass.position.set(0, doorCy, doorZ + 0.15);
        glass.material = m.glass; glass.parent = group; glass.isPickable = false;

        // دیگ / پره داخلی
        const drum = BABYLON.MeshBuilder.CreateCylinder('wmDrum_' + id, {
            diameter: doorR * 1.35, height: 0.6, tessellation: 24
        }, this.scene);
        drum.rotation.x = Math.PI / 2;
        drum.position.set(0, doorCy, doorZ - 0.6);
        drum.material = m.steelDark; drum.parent = group; drum.isPickable = false;

        // سه پره داخل دیگ
        for (let k = 0; k < 3; k++) {
            const blade = this._box('wmBlade_' + id + k, doorR * 0.55, 0.35, 1.2,
                0, doorCy, doorZ - 0.3, m.black, group);
            blade.rotation.z = (k / 3) * Math.PI * 2;
        }

        // دستگیره درب (سمت راست دایره)
        this._box('wmDoorH_' + id, 3.5, 8, 2.5,
            doorR * 0.85, doorCy, doorZ + 1.2, m.black, group);
        this._box('wmDoorH2_' + id, 2.0, 5, 1.5,
            doorR * 0.95, doorCy, doorZ + 2.0, m.black, group);

        // دریچه فیلتر پایین راست
        const filter = this._cyl('wmFilter_' + id, 7.5, 0.6,
            W * 0.22, -H / 2 + 10, frontZ + 0.4, bodyMat, group, 20);
        filter.rotation.x = Math.PI / 2;
        const filterIn = this._cyl('wmFilterIn_' + id, 5.5, 0.4,
            W * 0.22, -H / 2 + 10, frontZ + 0.7, m.steel, group, 16);
        filterIn.rotation.x = Math.PI / 2;
    },

    /**
     * ظرفشویی — مطابق عکس: درب استیل یک‌دست، نوار کنترل مشکی بالا،
     * دستگیره افقی زیر پنل، پاخور پایین
     */
    _buildDishwasher: function (group, c, W, H, D, id) {
        const m = this._applianceMats(id);
        W = Math.max(45, W); H = Math.max(70, H); D = Math.max(45, D);
        const frontZ = D / 2;
        const doorT = 3.8;

        // بدنه
        this._box('dwB_' + id, W, H, D - 1.5, 0, 0, -0.5, m.steel, group);

        // درب استیل کامل
        const kickH = 8;
        const doorH = H - kickH - 1;
        const doorY = -H / 2 + kickH + doorH / 2;
        const steelDoor = this._mat('dwDoor_' + id,
            new BABYLON.Color3(0.70, 0.72, 0.74), new BABYLON.Color3(0.6, 0.6, 0.6));
        this._box('dwD_' + id, W - 0.8, doorH, doorT, 0, doorY, frontZ - doorT / 2 + 0.3, steelDoor, group);

        // ---- نوار کنترل مشکی بالای درب ----
        const ctrlH = 5.5;
        const ctrlY = doorY + doorH / 2 - ctrlH / 2 - 0.5;
        this._box('dwCtrl_' + id, W - 2.5, ctrlH, 0.5,
            0, ctrlY, frontZ + 0.55, m.black, group);

        // نمایشگر وسط پنل
        const scr = this._mat('dwScr_' + id,
            new BABYLON.Color3(0.1, 0.15, 0.2), new BABYLON.Color3(0.05, 0.05, 0.05));
        try { scr.emissiveColor = new BABYLON.Color3(0.08, 0.15, 0.25); } catch (e) {}
        this._box('dwScr_' + id, 8, 3.2, 0.25, 0, ctrlY + 0.3, frontZ + 0.85, scr, group);

        // دکمه‌های چپ و راست پنل
        for (let i = 0; i < 4; i++) {
            this._box('dwBtnL_' + id + i, 2.4, 1.6, 0.2,
                -W * 0.32 + i * 3.0, ctrlY - 0.8, frontZ + 0.8, m.blackSteel || m.black, group);
            this._box('dwBtnR_' + id + i, 2.4, 1.6, 0.2,
                W * 0.12 + i * 3.0, ctrlY - 0.8, frontZ + 0.8, m.blackSteel || m.black, group);
        }

        // ---- دستگیره افقی فرورفته زیر پنل کنترل ----
        const handleY = ctrlY - ctrlH / 2 - 1.8;
        // شیار دستگیره
        this._box('dwHandleRec_' + id, W * 0.35, 2.2, 1.5,
            0, handleY, frontZ + 0.2, m.steelDark, group);
        // لبه دستگیره
        this._box('dwHandle_' + id, W * 0.32, 1.0, 1.8,
            0, handleY, frontZ + 0.9, m.chrome, group);

        // ---- پاخور پایین ----
        this._box('dwKick_' + id, W - 0.5, kickH - 1, 3.5,
            0, -H / 2 + kickH / 2, frontZ - 1.5, m.steelDark, group);
        // نوار براق لبه پاخور
        this._box('dwKickTop_' + id, W - 0.8, 0.6, 3.8,
            0, -H / 2 + kickH - 0.5, frontZ - 1.2, m.chrome, group);

        // پایه‌ها
        this._box('dwFootL_' + id, 3, 1.5, 3, -W / 2 + 4, -H / 2 + 0.7, frontZ - 4, m.black, group);
        this._box('dwFootR_' + id, 3, 1.5, 3, W / 2 - 4, -H / 2 + 0.7, frontZ - 4, m.black, group);
    },


    /** فر توکار */
    _buildOven: function (group, c, W, H, D, id) {
        const m = this._applianceMats(id);
        W = Math.max(50, W); H = Math.max(50, H); D = Math.max(45, D);
        const frontZ = D / 2;

        this._box('ovB_' + id, W, H, D - 1, 0, 0, -0.4, m.blackSteel, group);
        // قاب جلو
        this._box('ovF_' + id, W - 1, H - 1, 1.5, 0, 0, frontZ - 0.5, m.steelDark, group);
        // شیشه درب
        this._box('ovG_' + id, W * 0.72, H * 0.55, 0.8, 0, -H * 0.05, frontZ + 0.3, m.glass, group);
        // پنل کنترل بالا
        this._box('ovP_' + id, W - 3, H * 0.14, 0.6, 0, H / 2 - H * 0.1, frontZ + 0.4, m.black, group);
        for (let i = 0; i < 4; i++) {
            const kn = this._cyl('ovKn_' + id + i, 2.2, 1.0, -W * 0.28 + i * (W * 0.18), H / 2 - H * 0.1, frontZ + 1.0, m.chrome, group, 12);
            kn.rotation.x = Math.PI / 2;
        }
        // دستگیره افقی
        this._box('ovH_' + id, W * 0.5, 1.5, 1.8, 0, -H * 0.28, frontZ + 1.3, m.chrome, group);
    },

    /** هود — کانوپی + فیلتر + دودکش */
    _buildHood: function (group, c, W, H, D, id) {
        const m = this._applianceMats(id);
        W = Math.max(50, W); H = Math.max(30, H); D = Math.max(35, D);

        const canopyH = Math.min(14, Math.max(8, H * 0.28));
        const chimH = Math.max(10, H - canopyH);
        const chimW = W * 0.42;
        const chimD = D * 0.40;

        this._box('hdCan_' + id, W, canopyH, D, 0, -H / 2 + canopyH / 2, 0, m.steel, group);
        this._box('hdLip_' + id, W + 0.6, 1.2, D + 0.6, 0, -H / 2 + 0.6, 0, m.steelDark, group);

        const filterW = W * 0.78;
        const filterD = D * 0.62;
        this._box('hdFF_' + id, filterW + 1.2, 0.8, filterD + 1.2, 0, -H / 2 + 1.4, D * 0.06, m.steelDark, group);
        for (let i = 0; i < 2; i++) {
            const fw = (filterW - 1) / 2 - 0.6;
            this._box('hdF_' + id + i, fw, 0.35, filterD - 0.8,
                -filterW / 2 + fw / 2 + 0.5 + i * (fw + 0.8),
                -H / 2 + 1.5, D * 0.06, m.steelDark, group);
        }
        // LED نوار
        const ledMat = this._mat('hdLed_' + id, new BABYLON.Color3(0.95, 0.95, 0.9), new BABYLON.Color3(0.1, 0.1, 0.1));
        try { ledMat.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.7); } catch (e) {}
        this._box('hdLed_' + id, W * 0.7, 0.3, 0.4, 0, -H / 2 + 2.2, D / 2 - 1, ledMat, group);

        // دودکش
        const chimZ = -D * 0.15;
        this._box('hdChim_' + id, chimW, chimH, chimD, 0, -H / 2 + canopyH + chimH / 2, chimZ, m.steel, group);
        this._box('hdChimIn_' + id, chimW - 1.2, chimH * 0.95, chimD - 1.2, 0, -H / 2 + canopyH + chimH / 2 + 0.3, chimZ, m.steelDark, group);
        this._box('hdBand_' + id, chimW + 1.4, 1.8, chimD + 1.4, 0, -H / 2 + canopyH + 0.9, chimZ, m.steelDark, group);
    },

    /** اجاق گاز رومیزی */
    _buildStove: function (group, c, W, H, D, id) {
        const m = this._applianceMats(id);
        H = Math.max(H || 4, 4);
        this._box('stTop_' + id, W, 2, D, 0, H / 2 - 1, 0, m.black, group);
        const positions = [[-0.28, -0.25], [0.28, -0.25], [-0.28, 0.25], [0.28, 0.25]];
        for (let i = 0; i < positions.length; i++) {
            const px = positions[i][0] * W, pz = positions[i][1] * D;
            this._cyl('stB_' + id + i, W * 0.17, 1.2, px, H / 2 + 0.2, pz, m.steelDark, group, 16);
            this._cyl('stC_' + id + i, W * 0.1, 0.4, px, H / 2 + 0.9, pz, m.black, group, 12);
        }
        for (let i = 0; i < 4; i++) {
            const kn = this._cyl('stKn_' + id + i, 2.4, 1.5, -W * 0.3 + i * (W * 0.2), H / 2 - 0.5, D / 2 + 0.5, m.chrome, group, 12);
            kn.rotation.x = Math.PI / 2;
        }
    },

    _buildGenericAppliance: function (group, c, W, H, D, id) {
        const m = this._applianceMats(id);
        this._box('genB_' + id, W, H, D, 0, 0, 0, m.steel, group);
        this._box('genF_' + id, W - 2, H - 4, 1, 0, 0, D / 2 + 0.3, m.steelDark, group);
    },

    /**
     * کلاف یخچال — بغل‌ها + سقف + باکس هوایی اختیاری
     * معادل isFridgeWrap در view3d.js
     */
    /**
     * کلاف هود — بدنه چوبی + هود مشکی مثل عکس (سایه‌بان + دودکش + پنل کنترل)
     */
    _buildHoodWrap: function (group, c, W, H, D, thick, id, doorMat, bodyMat) {
        const t = thick || 1.6;
        const mat = doorMat || bodyMat;
        const sideDepth = D - t;

        // بدنه کلاف (پشت / بغل / سقف)
        if (c.enableHoodBack !== false) {
            this._box('hwBack_' + id, W, H, t, 0, 0, -D / 2 + t / 2, mat, group);
        }
        if (c.enableHoodSides !== false) {
            this._box('hwL_' + id, t, H, sideDepth, -W / 2 + t / 2, 0, t / 2, mat, group);
            this._box('hwR_' + id, t, H, sideDepth, W / 2 - t / 2, 0, t / 2, mat, group);
        }
        const topW = W - 2 * t;
        if (c.enableHoodCeiling !== false) {
            this._box('hwTop_' + id, topW, t, sideDepth, 0, H / 2 - t / 2, t / 2, mat, group);
        }

        // —— هود فلزی مشکی (مثل عکس استیل البرز) ——
        if (c.showMetalHood !== false) {
            const blackHood = this._mat('hwBlack_' + id,
                new BABYLON.Color3(0.08, 0.08, 0.09), new BABYLON.Color3(0.35, 0.35, 0.35));
            const chrome = this._mat('hwChrome_' + id,
                new BABYLON.Color3(0.75, 0.76, 0.78), new BABYLON.Color3(0.7, 0.7, 0.7));
            const darkPanel = this._mat('hwPanel_' + id,
                new BABYLON.Color3(0.04, 0.04, 0.05), new BABYLON.Color3(0.2, 0.2, 0.2));

            // سایه‌بان (canopy) پهن پایین
            const canopyW = Math.min(W - 2 * t - 1, topW + 4);
            const canopyD = Math.max(18, sideDepth * 0.95);
            const canopyH = 6.5;
            const canopyY = -H / 2 + canopyH / 2 + 0.5;
            const canopyZ = t / 2 + 1;

            this._box('hwCanopy_' + id, canopyW, canopyH, canopyD,
                0, canopyY, canopyZ, blackHood, group);

            // لبه شیبدار جلو (کمی بیرون‌زده)
            this._box('hwCanopyLip_' + id, canopyW + 0.4, 1.2, 2.5,
                0, canopyY - canopyH / 2 + 0.4, canopyZ + canopyD / 2 - 0.5, blackHood, group);

            // پنل کنترل روی لبه جلو
            this._box('hwCtrl_' + id, canopyW * 0.55, 0.8, 0.35,
                0, canopyY + canopyH / 2 - 0.6, canopyZ + canopyD / 2 + 0.15, darkPanel, group);
            // دکمه‌ها
            for (let i = 0; i < 5; i++) {
                const bx = -canopyW * 0.18 + i * 3.2;
                this._box('hwBtn_' + id + i, 1.4, 0.5, 0.25,
                    bx, canopyY + canopyH / 2 - 0.6, canopyZ + canopyD / 2 + 0.35,
                    chrome, group);
            }
            // نمایشگر کوچک وسط
            const scr = this._mat('hwScr_' + id,
                new BABYLON.Color3(0.1, 0.2, 0.15), new BABYLON.Color3(0.05, 0.05, 0.05));
            try { scr.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.1); } catch (e) {}
            this._box('hwScr_' + id, 5, 0.55, 0.2,
                0, canopyY + canopyH / 2 - 0.6, canopyZ + canopyD / 2 + 0.4, scr, group);

            // فیلتر زیر سایه‌بان
            this._box('hwFilter_' + id, canopyW * 0.85, 0.4, canopyD * 0.7,
                0, canopyY - canopyH / 2 - 0.3, canopyZ, chrome, group);
            for (let i = 0; i < 4; i++) {
                this._box('hwFiltLine_' + id + i, canopyW * 0.8, 0.08, 0.15,
                    0, canopyY - canopyH / 2 - 0.5, canopyZ - canopyD * 0.25 + i * (canopyD * 0.15),
                    this._mat('hwFL_' + id + i, new BABYLON.Color3(0.25, 0.25, 0.25), new BABYLON.Color3(0.15, 0.15, 0.15)),
                    group);
            }

            // دودکش مربعی بالا (chimney)
            const totalHoodH = c.hoodCeilingHeight !== undefined ? parseFloat(c.hoodCeilingHeight) : 40;
            const chimW = Math.min(W * 0.38, 32);
            const chimD = Math.min(canopyD * 0.55, 22);
            const chimH = Math.max(15, Math.min(totalHoodH, H - canopyH - 2));
            const chimY = canopyY + canopyH / 2 + chimH / 2;
            const chimZ = canopyZ - canopyD * 0.15;

            this._box('hwChim_' + id, chimW, chimH, chimD, 0, chimY, chimZ, blackHood, group);
            // لوگو روی دودکش
            this._box('hwLogo_' + id, chimW * 0.45, 1.4, 0.2,
                0, chimY + chimH * 0.15, chimZ + chimD / 2 + 0.1,
                chrome, group);
        }

        if (c.shelves && c.shelves.length) {
            this._createShelves(group, Object.assign({}, c, { isHoodWrap: false }), W, H, D, t, mat, id + '_hw');
        }
    },

    /**
     * آب‌چکان — بدنه بدون کف + سبد سیمی پایین (مثل عکس دیجی‌کالا)
     */
    _buildDishRack: function (group, c, W, H, D, thick, id, doorMat, bodyMat) {
        const t = thick || 1.6;
        const backThick = 0.3;
        const grooveDepth = 0.7;
        const backInset = 1.7;
        const bodyMat2 = bodyMat;
        const backMat = this._mat('drBack_' + id,
            new BABYLON.Color3(0.83, 0.82, 0.81), BABYLON.Color3.Black());

        // بغل چپ/راست
        this._box('drL_' + id, t, H, D, -W / 2 + t / 2, 0, 0, bodyMat2, group);
        this._box('drR_' + id, t, H, D, W / 2 - t / 2, 0, 0, bodyMat2, group);

        // سقف (بدون کف)
        const topDepth = D - 2.0;
        this._box('drTop_' + id, W - 2 * t, t, topDepth,
            0, H / 2 - t / 2, 1.0, bodyMat2, group);

        // فیبر پشت تا پایین‌ترین طبقه
        let lowestShelfH = H - t;
        if (c.shelves && c.shelves.length) {
            const valid = c.shelves.filter(function (s) {
                return s && s.height > 0 && s.height < H;
            });
            if (valid.length) {
                lowestShelfH = Math.min.apply(null, valid.map(function (s) { return Number(s.height); }));
            }
        }
        const topY = H / 2 - 0.2;
        const bottomY = -H / 2 + lowestShelfH;
        const backHeight = topY - bottomY;
        if (backHeight > 0.1) {
            const backWidth = (W - 2 * t) + (2 * grooveDepth);
            this._box('drFiber_' + id, backWidth, backHeight, backThick,
                0, bottomY + backHeight / 2,
                -D / 2 + backInset + backThick / 2,
                backMat, group);
        }

        // طبقات
        if (c.shelves && c.shelves.length) {
            this._createShelves(group, Object.assign({}, c, { isDishRack: false }), W, H, D, t, bodyMat2, id + '_dr');
        }

        // —— سبد سیمی آب‌چکان در پایین (مثل عکس) ——
        this._buildWireDishBasket(group, c, W, H, D, t, id);

        // درب‌ها
        if (c.showDoors !== false) {
            const dMat = doorMat || bodyMat2;
            this._createDoorSystem(group, c, W, H, D, t, dMat, id);
        }
    },

    /**
     * سبد سیمی آب‌چکان — میله‌های کروم + جا بشقاب + شبکه کف
     */
    _buildWireDishBasket: function (group, c, W, H, D, thick, id) {
        const chrome = this._mat('drWire_' + id,
            new BABYLON.Color3(0.78, 0.80, 0.82), new BABYLON.Color3(0.75, 0.75, 0.75));
        const sideMat = this._mat('drSideRail_' + id,
            new BABYLON.Color3(0.65, 0.66, 0.68), new BABYLON.Color3(0.45, 0.45, 0.45));

        const innerW = W - 2 * thick - 1.5;
        const basketD = Math.max(18, D - 6);
        const basketH = 12;
        // نزدیک کف باز (بدون کف بدنه)
        const basketY = -H / 2 + basketH / 2 + 2;
        const basketZ = 0.5;

        // ریل کناری چپ/راست (ورق اتصال)
        this._box('drRailL_' + id, 1.2, basketH + 2, basketD + 1,
            -innerW / 2 - 0.3, basketY, basketZ, sideMat, group);
        this._box('drRailR_' + id, 1.2, basketH + 2, basketD + 1,
            innerW / 2 + 0.3, basketY, basketZ, sideMat, group);

        // قاب دور سبد (۴ میله)
        // جلو / عقب
        this._box('drFrameF_' + id, innerW, 0.35, 0.35,
            0, basketY - basketH / 2 + 0.5, basketZ + basketD / 2, chrome, group);
        this._box('drFrameB_' + id, innerW, 0.35, 0.35,
            0, basketY - basketH / 2 + 0.5, basketZ - basketD / 2, chrome, group);
        this._box('drFrameFT_' + id, innerW, 0.35, 0.35,
            0, basketY + basketH / 2 - 0.5, basketZ + basketD / 2, chrome, group);
        this._box('drFrameBT_' + id, innerW, 0.35, 0.35,
            0, basketY + basketH / 2 - 0.5, basketZ - basketD / 2, chrome, group);
        // چپ / راست افقی
        this._box('drFrameSL_' + id, 0.35, 0.35, basketD,
            -innerW / 2, basketY - basketH / 2 + 0.5, basketZ, chrome, group);
        this._box('drFrameSR_' + id, 0.35, 0.35, basketD,
            innerW / 2, basketY - basketH / 2 + 0.5, basketZ, chrome, group);
        this._box('drFrameSLT_' + id, 0.35, 0.35, basketD,
            -innerW / 2, basketY + basketH / 2 - 0.5, basketZ, chrome, group);
        this._box('drFrameSRT_' + id, 0.35, 0.35, basketD,
            innerW / 2, basketY + basketH / 2 - 0.5, basketZ, chrome, group);

        // شبکه کف (میله‌های طولی)
        const gridCount = Math.max(6, Math.floor(innerW / 4));
        for (let i = 0; i < gridCount; i++) {
            const gx = -innerW / 2 + 1 + i * (innerW - 2) / Math.max(1, gridCount - 1);
            this._box('drGrid_' + id + i, 0.22, 0.22, basketD - 1,
                gx, basketY - basketH / 2 + 0.6, basketZ, chrome, group);
        }
        // میله‌های عرضی کف
        const crossCount = Math.max(3, Math.floor(basketD / 6));
        for (let j = 0; j < crossCount; j++) {
            const gz = -basketD / 2 + 1 + j * (basketD - 2) / Math.max(1, crossCount - 1);
            this._box('drCross_' + id + j, innerW - 1, 0.22, 0.22,
                0, basketY - basketH / 2 + 0.7, basketZ + gz, chrome, group);
        }

        // جا بشقاب (میله‌های موج‌دار / U شکل عمودی در یک سمت)
        const slotCount = Math.max(8, Math.floor(innerW / 5));
        const slotZoneW = innerW * 0.55;
        const slotStartX = -innerW / 2 + 1.5;
        for (let i = 0; i < slotCount; i++) {
            const sx = slotStartX + i * (slotZoneW / Math.max(1, slotCount - 1));
            // پایه U
            this._box('drSlotV_' + id + i, 0.25, basketH * 0.7, 0.25,
                sx, basketY - basketH * 0.05, basketZ + basketD * 0.15, chrome, group);
            // بازوی شیب‌دار جلو
            this._box('drSlotA_' + id + i, 0.22, 0.22, basketD * 0.35,
                sx, basketY + basketH * 0.15, basketZ + basketD * 0.05, chrome, group);
        }

        // بخش فنجان (میله‌های کوتاه‌تر سمت دیگر)
        const cupCount = Math.max(4, Math.floor(innerW * 0.35 / 6));
        const cupStartX = innerW * 0.15;
        for (let i = 0; i < cupCount; i++) {
            const cx = cupStartX + i * ((innerW / 2 - 2 - cupStartX) / Math.max(1, cupCount - 1));
            this._box('drCup_' + id + i, 0.25, basketH * 0.45, 0.25,
                cx, basketY - basketH * 0.1, basketZ - basketD * 0.1, chrome, group);
        }
    },

    /**
     * کلاف یخچال — معادل isFridgeWrap در view3d.js
     * دیواره قدی چپ/راست + یونیت هوایی (bridge) با بدنه توخالی + درب‌های واقعی
     */
    _buildFridgeWrap: function (group, c, W, H, D, thick, id, doorMat, bodyMat) {
        const mat = doorMat || bodyMat;
        const t = thick || 1.6;
        const leftH = parseFloat(c.leftH) || H;
        const rightH = parseFloat(c.rightH) || H;
        const leftD = parseFloat(c.leftD) || D;
        const rightD = parseFloat(c.rightD) || D;

        // دیواره قدی چپ
        if (c.hasLeft !== false) {
            this._box('fwL_' + id, t, leftH, leftD,
                -W / 2 + t / 2, -H / 2 + leftH / 2, 0, mat, group);
        }
        // دیواره قدی راست
        if (c.hasRight !== false) {
            this._box('fwR_' + id, t, rightH, rightD,
                W / 2 - t / 2, -H / 2 + rightH / 2, 0, mat, group);
        }

        // یونیت هوایی بالای یخچال
        if (c.hasBridge === false) {
            this._box('fwTop_' + id, W, t, D, 0, H / 2 - t / 2, 0, mat, group);
            return;
        }

        const topBoxHeight = parseFloat(c.bridgeH) || 40;
        const topBoxW = W - 2 * t;
        const topBoxD = c.bridgeD ? parseFloat(c.bridgeD) : (D - t);
        const topBoxZShift = ((D - topBoxD) / 2) - t;
        const backThick = 0.3;
        const bodyDepth = topBoxD - backThick;
        const innerH = Math.max(2, topBoxHeight - 2 * t);
        const bodyZPos = backThick / 2;
        const backZPos = -topBoxD / 2 + backThick / 2;

        // گروه محلی باکس هوایی (مختصات محلی مثل Three)
        const topBox = new BABYLON.TransformNode('fwBridge_' + id, this.scene);
        topBox.parent = group;
        // position: عین Three → -H/2 + (bridgeY || H-bridgeH) + bridgeH/2
        const bridgeBottom = (c.bridgeY !== undefined) ? parseFloat(c.bridgeY) : (H - topBoxHeight);
        topBox.position = new BABYLON.Vector3(
            0,
            -H / 2 + bridgeBottom + topBoxHeight / 2,
            topBoxZShift
        );

        const innerMat = this._mat('fwInner_' + id,
            new BABYLON.Color3(0.91, 0.90, 0.89), new BABYLON.Color3(0.05, 0.05, 0.05));
        const backMat = this._mat('fwBack_' + id,
            new BABYLON.Color3(0.83, 0.82, 0.81), BABYLON.Color3.Black());

        // سقف
        this._box('fwBT_' + id, topBoxW, t, bodyDepth, 0, topBoxHeight / 2 - t / 2, bodyZPos, innerMat, topBox);
        // کف
        this._box('fwBF_' + id, topBoxW, t, bodyDepth, 0, -topBoxHeight / 2 + t / 2, bodyZPos, innerMat, topBox);
        // پشت ۳ میل
        this._box('fwBB_' + id, topBoxW, topBoxHeight, backThick, 0, 0, backZPos, backMat, topBox);
        // بغل چپ/راست داخلی
        this._box('fwBL_' + id, t, innerH, bodyDepth, -topBoxW / 2 + t / 2, 0, bodyZPos, innerMat, topBox);
        this._box('fwBR_' + id, t, innerH, bodyDepth, topBoxW / 2 - t / 2, 0, bodyZPos, innerMat, topBox);

        // طبقات داخل باکس اگر تعریف شده
        if (c.shelves && c.shelves.length) {
            const bridgeCab = {
                shelves: c.shelves,
                shelvesColor: c.shelvesColor || c.bodyColor,
                w: topBoxW, h: topBoxHeight, d: topBoxD, id: id
            };
            this._createShelves(topBox, bridgeCab, topBoxW, topBoxHeight, topBoxD, t, innerMat, id + '_br');
        }

        // درب‌های واقعی باکس هوایی — عین createDoorSystem(topBoxGroup, topCabData)
        if (c.showDoors !== false) {
            const topCabData = Object.assign({}, c, {
                w: topBoxW,
                h: topBoxHeight,
                d: topBoxD,
                doors: c.doors || 2,
                doorType: c.doorType || 'side',
                isFridgeWrap: false, // تا در سیستم درب دوباره wrap نشود
                isDrawerBody: false,
                isBaseWithDrawer: false,
                type: 'wall',
                elevation: 100,
                // موقعیت‌های دستگیره از doorSizes خود c
                doorSizes: c.doorSizes,
                doorDirections: c.doorDirections || ['left', 'right'],
                hiddenHandle: c.hiddenHandle,
                doorColor: c.doorColor || c.bridgeMaterialValue || c.bodyColor || '#ffffff'
            });
            const bridgeDoorMat = this._makeDoorMaterial(topCabData, id + '_br', topBoxW, topBoxHeight);
            this._createDoorSystem(topBox, topCabData, topBoxW, topBoxHeight, topBoxD, t, bridgeDoorMat, id + '_br');
        }
    },


    /**
     * طبقات — عین createShelves در view3d.js
     * فقط اگر c.shelves آرایه داشته باشد ساخته می‌شود (بدون پیش‌فرض جعلی)
     * یونیت کشو معمولاً shelves ندارد → طبقه ساخته نمی‌شود
     */
    /**
     * متریال طبقه — رنگ / تکسچر / CutMaster مثل createShelves در view3d.js
     */
    _resolveShelfMaterial: function (shelf, c, pieceLabel, geoWidth, geoDepth, isVertical, id, index) {
        const self = this;
        let textureUrl = null;
        let solidHex = null;

        // ۱) CutMaster / isolatedDoorTextures
        try {
            if (window.isolatedDoorTextures) {
                if (window.isolatedDoorTextures[pieceLabel]) {
                    textureUrl = window.isolatedDoorTextures[pieceLabel];
                } else {
                    // جستجوی تقریبی برچسب
                    const keys = Object.keys(window.isolatedDoorTextures);
                    for (let i = 0; i < keys.length; i++) {
                        if (keys[i].indexOf('طبقه') >= 0 && keys[i].indexOf('U' + (c.id || '')) >= 0) {
                            // اگر شماره طبقه در کلید باشد
                            if (keys[i].indexOf(String(index + 1)) >= 0 || keys[i] === pieceLabel) {
                                textureUrl = window.isolatedDoorTextures[keys[i]];
                                break;
                            }
                        }
                    }
                    if (!textureUrl) {
                        for (let i = 0; i < keys.length; i++) {
                            if (keys[i] === pieceLabel || keys[i].indexOf(pieceLabel) >= 0) {
                                textureUrl = window.isolatedDoorTextures[keys[i]];
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {}

        // ۲) shelf.color / texture / material
        if (!textureUrl) {
            let raw = shelf.color || shelf.texture || shelf.material ||
                c.shelvesColor || c.bodyColor || '#E8E6E3';
            if (typeof raw === 'string') {
                const s = raw.trim();
                if (s.charAt(0) === '#') {
                    solidHex = s;
                } else if (
                    s.indexOf('http') === 0 ||
                    s.indexOf('data:image') === 0 ||
                    s.indexOf('assets/') >= 0 ||
                    s.indexOf('/') >= 0 ||
                    s.indexOf('.jpg') >= 0 ||
                    s.indexOf('.png') >= 0 ||
                    s.indexOf('.webp') >= 0
                ) {
                    textureUrl = s;
                } else {
                    // کد متریال از allMaterials
                    try {
                        if (window.allMaterials) {
                            const types = Object.keys(window.allMaterials);
                            for (let ti = 0; ti < types.length; ti++) {
                                const list = window.allMaterials[types[ti]];
                                if (!Array.isArray(list)) continue;
                                for (let j = 0; j < list.length; j++) {
                                    const m = list[j];
                                    if (!m) continue;
                                    if (m.texture === s || m.code === s || m.name === s) {
                                        if (m.texture) textureUrl = m.texture;
                                        else if (m.color) solidHex = m.color;
                                        break;
                                    }
                                }
                                if (textureUrl || solidHex) break;
                            }
                        }
                    } catch (e) {}
                    if (!textureUrl && !solidHex) solidHex = '#E8E6E3';
                }
            }
        }

        // finish
        const finishKey = (shelf.finish || c.shelvesFinish || 'matte').toString().toLowerCase();
        let specPower = 16;
        let specCol = new BABYLON.Color3(0.08, 0.08, 0.08);
        try {
            if (typeof window.getKitchenFinishPreset === 'function') {
                const preset = window.getKitchenFinishPreset(finishKey) || {};
                if (preset.roughness != null) {
                    specPower = Math.max(4, (1 - preset.roughness) * 64);
                }
            }
            if (finishKey === 'highgloss' || finishKey === 'high-gloss' || finishKey === 'glossy') {
                specPower = 64;
                specCol = new BABYLON.Color3(0.35, 0.35, 0.35);
            }
        } catch (e) {}

        const matName = 'shelfMat_' + id + '_' + index;
        const mat = new BABYLON.StandardMaterial(matName, this.scene);
        mat.specularColor = specCol;
        mat.specularPower = specPower;

        if (textureUrl) {
            try {
                const tex = new BABYLON.Texture(
                    textureUrl, this.scene, false, true,
                    BABYLON.Texture.TRILINEAR_SAMPLINGMODE
                );
                // مقیاس شبیه Three: geoWidth/100 , geoDepth/100
                tex.uScale = Math.max(0.05, (geoWidth || 50) / 100);
                tex.vScale = Math.max(0.05, (geoDepth || 40) / 100);
                tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                mat.diffuseTexture = tex;
                mat.diffuseColor = BABYLON.Color3.White();
            } catch (e) {
                mat.diffuseColor = this._hexToColor3(solidHex || '#E8E6E3');
            }
        } else {
            mat.diffuseColor = this._hexToColor3(solidHex || '#E8E6E3');
        }

        return mat;
    },

    _createShelves: function (group, c, W, H, D, thick, mat, id) {
        // یونیت‌هایی که طبقه ندارند
        if (c.isDrawerBody || c.isAppliance || c.isFridge || c.isFridgeWrap) return;
        if (!c.shelves || !c.shelves.length) return;

        const padding = 1.8;
        const shelfThick = thick || 1.6;
        const pinMat = this._mat('cabPin_' + id, new BABYLON.Color3(0.69, 0.69, 0.69), new BABYLON.Color3(0.4, 0.4, 0.4));

        for (let index = 0; index < c.shelves.length; index++) {
            const shelf = c.shelves[index];
            if (!shelf || shelf.height === undefined || shelf.height === null) continue;
            const shelfH = parseFloat(shelf.height);
            if (isNaN(shelfH) || shelfH <= 0) continue;

            const rotationDeg = Number(shelf.rotation) || 0;
            const isVertical = rotationDeg === 90;
            // faceRotation 90 = صورت طبقه رو به بیرون (چرخش حول Y)
            const faceOut = Number(shelf.faceRotation) === 90;
            const sLeftOffset = parseFloat(shelf.leftOffset) || 0;
            const sBottomOffset = parseFloat(shelf.bottomOffset) || 0;
            const depthAlign = shelf.depthAlign || 'back';
            const sDepth = (shelf.depth !== undefined && shelf.depth !== '' && Number(shelf.depth) !== D)
                ? Number(shelf.depth)
                : (D - padding - 1);
            const sWidth = (shelf.width !== undefined && shelf.width !== '')
                ? Number(shelf.width)
                : (W - padding * 2);
            const sVertHeight = (shelf.vertHeight !== undefined && shelf.vertHeight !== '')
                ? Number(shelf.vertHeight)
                : (H - padding * 2);
            const extraBack = parseFloat(shelf.closetBackOffset) || 0;
            const isRightAnchor = shelf.sideAnchor === 'right';

            let posX = 0, posY = 0, posZ = 0;
            let shelfWidth = 0, shelfHeight = 0, shelfDepth = Math.max(2, sDepth);

            if (faceOut) {
                // روبرو مثل ورق پشت:
                // عرض ← shelf.width (محور X، با لنگر چپ/راست)
                // طول ← فیلد عمق (ارتفاع صورت ورق روی محور Y)
                // ضخامت ← در محور Z
                shelfDepth = shelfThick;
                shelfWidth = Math.max(2, Math.min(sWidth, W - padding * 2));
                const lengthFromDepth = (shelf.depth !== undefined && shelf.depth !== '' && !isNaN(Number(shelf.depth)))
                    ? Number(shelf.depth)
                    : Math.min(40, H - padding * 2);
                shelfHeight = Math.max(shelfThick, Math.min(lengthFromDepth, H - padding * 2));

                if (isVertical) {
                    if (isRightAnchor) {
                        posX = (W / 2) - padding - shelfH - sLeftOffset - shelfWidth / 2;
                    } else {
                        posX = (-W / 2) + padding + shelfH + sLeftOffset + shelfWidth / 2;
                    }
                } else {
                    if (isRightAnchor) {
                        posX = (W / 2) - padding - sLeftOffset - shelfWidth / 2;
                    } else {
                        posX = (-W / 2) + padding + sLeftOffset + shelfWidth / 2;
                    }
                }
                // طول از پایین رشد می‌کند (bottomOffset)
                posY = (-H / 2) + padding + sBottomOffset + shelfHeight / 2;

                if (depthAlign === 'front') {
                    posZ = (D / 2) - (shelfDepth / 2) - extraBack;
                } else {
                    posZ = (-D / 2) + padding + (shelfDepth / 2) - extraBack;
                }
            } else if (isVertical) {
                shelfWidth = shelfThick;
                shelfHeight = Math.min(sVertHeight, H - padding * 2);
                shelfDepth = Math.max(2, sDepth);
                if (isRightAnchor) {
                    posX = (W / 2) - padding - shelfH - sLeftOffset - shelfWidth / 2;
                } else {
                    posX = (-W / 2) + padding + shelfH + sLeftOffset + shelfWidth / 2;
                }
                posY = (-H / 2) + padding + sBottomOffset + shelfHeight / 2;
                if (depthAlign === 'front') {
                    posZ = (D / 2) - (shelfDepth / 2) - extraBack;
                } else {
                    posZ = (-D / 2) + padding + (shelfDepth / 2) - extraBack;
                }
            } else {
                shelfHeight = shelfThick;
                shelfWidth = Math.min(sWidth, W - padding * 2);
                shelfDepth = Math.max(2, sDepth);
                posY = (-H / 2) + padding + shelfH;
                if (isRightAnchor) {
                    posX = (W / 2) - padding - sLeftOffset - shelfWidth / 2;
                } else {
                    posX = (-W / 2) + padding + sLeftOffset + shelfWidth / 2;
                }
                if (depthAlign === 'front') {
                    posZ = (D / 2) - (shelfDepth / 2) - extraBack;
                } else {
                    posZ = (-D / 2) + padding + (shelfDepth / 2) - extraBack;
                }
            }

            // متریال طبقه — عین createShelves در view3d.js
            // اولویت: CutMaster (isolatedDoorTextures) → shelf.color/texture URL → shelvesColor → bodyColor → پیش‌فرض
            const currentId = c.id || c.uId || id || '';
            const isGlassHolder = !isVertical && !!shelf.isGlassHolder;
            const labelBase = isVertical ? ('طبقه عمودی ' + (index + 1)) : ('طبقه افقی ' + (index + 1));
            const labelGlass = isGlassHolder ? ' (جای لیوانی - برش لبه)' : '';
            const pieceLabel = labelBase + labelGlass + ' U' + currentId;

            const shelfMat = this._resolveShelfMaterial(shelf, c, pieceLabel, shelfWidth, shelfDepth, isVertical, id, index);

            const sh = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_sh' + index, {
                width: Math.max(0.5, shelfWidth),
                height: Math.max(0.5, shelfHeight),
                depth: Math.max(0.5, shelfDepth)
            }, this.scene);
            sh.position.set(posX, posY, posZ);
            sh.material = shelfMat;
            sh.parent = group;
            sh.isPickable = false;
            sh.metadata = {
                partType: 'shelf',
                shelfIndex: index,
                isVertical: isVertical,
                pieceLabel: pieceLabel
            };

            // پین‌های نگهدارنده (افقی) — فقط کابینت آشپزخانه، نه چهارچوب کمد
            if (!isVertical && !c.isClosetFrame) {
                const hw = shelfWidth / 2 - 1;
                const hd = shelfDepth / 2 - 1;
                const pins = [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]];
                for (let p = 0; p < 4; p++) {
                    if (Math.abs(pins[p][0]) < 1 || Math.abs(pins[p][1]) < 1) continue;
                    const pin = BABYLON.MeshBuilder.CreateCylinder('cab_' + id + '_pin' + index + '_' + p, {
                        diameter: 0.5, height: 0.8, tessellation: 8
                    }, this.scene);
                    pin.rotation.z = Math.PI / 2;
                    pin.position.set(posX + pins[p][0], posY - shelfHeight / 2, posZ + pins[p][1]);
                    pin.material = pinMat;
                    pin.parent = group;
                    pin.isPickable = false;
                }
            }
        }
    },

    // =====================================================================
    // سیستم درب — استخراج‌شده از createDoorSystem / createMesh / getHingePos
    // در view3d.js (Three.js) — بدون تغییر منطق
    // =====================================================================

    _createDoorSystem: function (group, c, W, H, D, thick, doorMat, id) {
        if (c.showDoors === false) return;

        const SHADOW_GAP = 0.2;
        const doorType = c.doorType || 'side';
        const numDoors = c.doors || 1;

        // دهانه جلوی یونیت (بدون زاویه کناری در Babylon فعلاً)
        const angledFrontW = W;
        const angledFrontCX = 0;
        const angledSlotMinX = angledFrontCX - angledFrontW / 2;
        const angledSlotMaxX = angledFrontCX + angledFrontW / 2;

        if (c.isDrawerBody) {
            this._buildDrawerFronts(group, c, W, H, D, thick, doorMat, id, SHADOW_GAP);
            return;
        }
        if (c.isBaseWithDrawer) {
            this._buildBaseWithDrawer(group, c, W, H, D, thick, doorMat, id, SHADOW_GAP, angledFrontW, angledSlotMinX, angledSlotMaxX);
            return;
        }

        if (doorType === 'lift') {
            this._doorsLift(group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP);
        } else if (doorType === 'lift-side') {
            this._doorsLiftSide(group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP);
        } else if (doorType === 'split') {
            this._doorsSplit(group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP);
        } else if (doorType === 'combo') {
            this._doorsCombo(group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP);
        } else if (doorType === 'jaki-ghadi') {
            this._doorsJakiGhadi(group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP);
        } else {
            this._doorsSide(group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP);
        }
    },

    /**
     * getHingePos — دقیقاً از view3d.js
     * برمی‌گرداند مختصات محور لولا (لبه درب)، نه مرکز درب
     */
    _getHingePos: function (slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, isLeftHinge, axis, shiftDirX, shiftValueX) {
        lockX = lockX || 'center';
        lockY = lockY || 'center';
        shiftDirX = shiftDirX || 'none';
        shiftValueX = shiftValueX || 0;

        let cx, cy;
        if (lockX === 'left') cx = slotMinX + doorW / 2;
        else if (lockX === 'right') cx = slotMaxX - doorW / 2;
        else cx = (slotMinX + slotMaxX) / 2;

        if (shiftDirX === 'left') cx -= shiftValueX;
        else if (shiftDirX === 'right') cx += shiftValueX;

        if (lockY === 'top') cy = slotMaxY - doorH / 2;
        else if (lockY === 'bottom') cy = slotMinY + doorH / 2;
        else cy = (slotMinY + slotMaxY) / 2;

        let hx, hy;
        if (axis === 'y') {
            hy = cy;
            hx = isLeftHinge ? (cx - doorW / 2) : (cx + doorW / 2);
        } else {
            // محور افقی (جکی): لولا روی لبه بالای لنگه
            hx = cx;
            hy = cy + doorH / 2;
        }
        return { x: hx, y: hy };
    },

    /**
     * createMesh — کپی منطق view3d.js خطوط 9781–9920
     *
     * x,y = خروجی getHingePos = مختصات لبه لولا (نه مرکز درب)
     * openDir: -1 = لولای چپ | +1 = لولای راست
     * axis: 'y' لولایی | 'x' جکی
     *
     * باز شدن (از animate در Three):
     *   axis y → targetRotation = openDir * PI/2
     *   axis x → targetRotation = -1.6
     */
    /**
     * مدل درب سه‌بعدی — معادل createDoorByStyle در view3d.js
     * flat | beveled | shaker | frame | glass | fluted
     * خروجی: TransformNode با فرزندان مش (مرکز هندسی در مبدأ)
     */
    _createDoorByStyle: function (style, w, h, thick, doorMat, opts, uid) {
        opts = opts || {};
        const s = (style || 'flat').toString().toLowerCase().trim();
        const frameSize = opts.frameSize || 6.0;
        const scene = this.scene;
        const root = new BABYLON.TransformNode('doorStyle_' + uid, scene);

        const mat = doorMat || this._mat('doorFlat_' + uid, new BABYLON.Color3(0.96, 0.96, 0.96));
        const edgeMat = mat;

        function box(name, bw, bh, bd, x, y, z, material) {
            const m = BABYLON.MeshBuilder.CreateBox(name, {
                width: Math.max(0.2, bw),
                height: Math.max(0.2, bh),
                depth: Math.max(0.15, bd)
            }, scene);
            m.position.set(x || 0, y || 0, z || 0);
            m.material = material || mat;
            m.parent = root;
            m.isPickable = true;
            m.metadata = { isDoorPart: true };
            return m;
        }

        // ---- FLAT ----
        if (s === 'flat' || s === 'simple' || !s) {
            box('flat_' + uid, w, h, thick, 0, 0, 0, mat);
            root.metadata = { doorStyle: 'flat' };
            return root;
        }

        // ---- BEVELED: صفحه + لبه نازک روی محیط ----
        if (s === 'beveled' || s === 'bevel') {
            box('bevBase_' + uid, w, h, thick, 0, 0, 0, mat);
            const e = 0.35;
            const edgeCol = new BABYLON.Color3(0.88, 0.86, 0.82);
            const eMat = this._mat('bevEdge_' + uid, edgeCol, BABYLON.Color3.Black());
            // بالا / پایین
            box('bevT_' + uid, w, e, thick + 0.05, 0, h / 2 - e / 2, 0.02, eMat);
            box('bevB_' + uid, w, e, thick + 0.05, 0, -h / 2 + e / 2, 0.02, eMat);
            // چپ / راست
            box('bevL_' + uid, e, h - e * 2, thick + 0.05, -w / 2 + e / 2, 0, 0.02, eMat);
            box('bevR_' + uid, e, h - e * 2, thick + 0.05, w / 2 - e / 2, 0, 0.02, eMat);
            root.metadata = { doorStyle: 'beveled' };
            return root;
        }

        // ---- SHAKER: قاب کامل + پانل میانی فرورفته ----
        if (s === 'shaker') {
            const rail = Math.min(frameSize, w * 0.18, h * 0.18);
            const recess = 0.4;
            box('shOuter_' + uid, w, h, thick, 0, 0, 0, mat);
            const innerW = Math.max(1, w - rail * 2);
            const innerH = Math.max(1, h - rail * 2);
            const innerThick = Math.max(0.4, thick - recess);
            box('shInner_' + uid, innerW, innerH, innerThick, 0, 0, -recess / 2, mat);
            // شیار سایه
            const gMat = this._mat('shGroove_' + uid, new BABYLON.Color3(0.15, 0.15, 0.15), BABYLON.Color3.Black());
            try { gMat.alpha = 0.35; } catch (e) {}
            const gd = 0.15;
            box('shGT_' + uid, innerW + 0.2, gd, thick * 0.5, 0, innerH / 2 + gd / 2, thick * 0.15, gMat);
            box('shGB_' + uid, innerW + 0.2, gd, thick * 0.5, 0, -innerH / 2 - gd / 2, thick * 0.15, gMat);
            box('shGL_' + uid, gd, innerH, thick * 0.5, -innerW / 2 - gd / 2, 0, thick * 0.15, gMat);
            box('shGR_' + uid, gd, innerH, thick * 0.5, innerW / 2 + gd / 2, 0, thick * 0.15, gMat);
            root.metadata = { doorStyle: 'shaker' };
            return root;
        }

        // ---- FRAME: چهارچوب + پانل میانی ----
        if (s === 'frame') {
            const fs = Math.min(frameSize, w * 0.22, h * 0.22);
            box('frL_' + uid, fs, h, thick, -w / 2 + fs / 2, 0, 0, mat);
            box('frR_' + uid, fs, h, thick, w / 2 - fs / 2, 0, 0, mat);
            box('frT_' + uid, Math.max(0.5, w - fs * 2), fs, thick, 0, h / 2 - fs / 2, 0, mat);
            box('frB_' + uid, Math.max(0.5, w - fs * 2), fs, thick, 0, -h / 2 + fs / 2, 0, mat);
            const panelW = Math.max(1, w - fs * 2);
            const panelH = Math.max(1, h - fs * 2);
            box('frP_' + uid, panelW, panelH, Math.max(0.4, thick * 0.7), 0, 0, -0.15, mat);
            root.metadata = { doorStyle: 'frame' };
            return root;
        }

        // ---- GLASS: چهارچوب + شیشه ----
        if (s === 'glass' || s === 'glassdoor') {
            const fs = Math.min(frameSize, w * 0.2, h * 0.2);
            box('glL_' + uid, fs, h, thick, -w / 2 + fs / 2, 0, 0, mat);
            box('glR_' + uid, fs, h, thick, w / 2 - fs / 2, 0, 0, mat);
            box('glT_' + uid, Math.max(0.5, w - fs * 2), fs, thick, 0, h / 2 - fs / 2, 0, mat);
            box('glB_' + uid, Math.max(0.5, w - fs * 2), fs, thick, 0, -h / 2 + fs / 2, 0, mat);

            const glassMat = new BABYLON.StandardMaterial('glassMat_' + uid, scene);
            if (opts.isFrostedGlass) {
                glassMat.diffuseColor = new BABYLON.Color3(0.75, 0.78, 0.80);
                glassMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                glassMat.alpha = 0.55;
            } else {
                glassMat.diffuseColor = new BABYLON.Color3(0.55, 0.75, 0.92);
                glassMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.65);
                glassMat.alpha = 0.35;
            }
            try {
                glassMat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            } catch (e) {}

            const gw = Math.max(1, w - fs * 2 + 1);
            const gh = Math.max(1, h - fs * 2 + 1);
            const glass = BABYLON.MeshBuilder.CreateBox('glass_' + uid, {
                width: gw, height: gh, depth: 0.4
            }, scene);
            glass.position.set(0, 0, 0);
            glass.material = glassMat;
            glass.parent = root;
            glass.isPickable = true;
            glass.metadata = { isDoorPart: true, isGlass: true };
            root.metadata = { doorStyle: 'glass' };
            return root;
        }

        // ---- FLUTED: شیارهای عمودی ----
        if (s === 'fluted' || s === 'flute') {
            box('flBase_' + uid, w, h, thick * 0.7, 0, 0, -thick * 0.15, mat);
            const fluteW = 1.2;
            const fluteGap = 1.0;
            const step = fluteW + fluteGap;
            const usableW = w - 2.0;
            const count = Math.max(3, Math.floor(usableW / step));
            const totalFlutesW = count * fluteW + (count - 1) * fluteGap;
            const startX = -totalFlutesW / 2 + fluteW / 2;
            const fluteH = h - 1.2;
            for (let i = 0; i < count; i++) {
                const fx = startX + i * step;
                const flute = BABYLON.MeshBuilder.CreateCylinder('flute_' + uid + '_' + i, {
                    diameter: fluteW,
                    height: fluteH,
                    tessellation: 10
                }, scene);
                // نیم‌استوانه حس — با چرخش و مقیاس
                flute.scaling.z = 0.5;
                flute.position.set(fx, 0, thick * 0.2);
                flute.material = mat;
                flute.parent = root;
                flute.isPickable = true;
                flute.metadata = { isDoorPart: true };
            }
            root.metadata = { doorStyle: 'fluted' };
            return root;
        }

        // fallback flat
        box('flatFb_' + uid, w, h, thick, 0, 0, 0, mat);
        root.metadata = { doorStyle: 'flat' };
        return root;
    },

    _createDoorMesh: function (group, c, w, h, x, y, openDir, axis, doorMat, id, slotIndex, thick, hTarget) {
        const MICRO_REVEAL = 0.05;
        const actualW = Math.max(0.1, w - MICRO_REVEAL);
        const actualH = Math.max(0.1, h - MICRO_REVEAL);
        const D = parseFloat(c.d) || 55;
        axis = axis || 'y';
        thick = thick != null ? thick : 1.6;
        openDir = openDir != null ? openDir : -1;

        // ---- گره لولا (محور چرخش) ----
        // مبدأ لولا دقیقاً روی لبه جلوی یونیت تا در خروجی شعاع چرخش اشتباه نشود
        const hinge = new BABYLON.TransformNode('cab_' + id + '_hinge' + slotIndex, this.scene);
        hinge.parent = group;
        hinge.position = new BABYLON.Vector3(x, y, D / 2);

        if (axis === 'y') {
            // بدون شیفت اضافی روی X — لولا روی همان لبه getHingePos
            hinge.position.x += 0;
        } else {
            // جکی: لولا روی لبه بالا
            hinge.position.y -= thick / 2;
        }

        // ---- مدل درب بر اساس doorStyle (flat/beveled/shaker/frame/glass/fluted) ----
        const sizeStyle = (c.doorSizes && c.doorSizes[slotIndex] && c.doorSizes[slotIndex].doorStyle)
            ? c.doorSizes[slotIndex].doorStyle
            : null;
        let doorStyle = sizeStyle || c.doorStyle || 'flat';
        if (c.isGlassDoor && (!sizeStyle && !c.doorStyle)) doorStyle = 'glass';
        if (c.isGlassDoor && (doorStyle === 'flat' || doorStyle === 'beveled')) {
            if (!sizeStyle && !c.doorStyle) doorStyle = 'glass';
        }

        // تکسچر اختصاصی همین درب از کات‌مستر (نه تکرار درب ۱ روی همه)
        const slotMat = this._makeDoorMaterialForSlot(c, id, actualW, actualH, slotIndex || 0);
        const door = this._createDoorByStyle(doorStyle, actualW, actualH, thick, slotMat || doorMat, {
            isFrostedGlass: !!c.isFrostedGlass,
            frameSize: (c.doorFrameSize != null) ? parseFloat(c.doorFrameSize) : 6.0
        }, id + '_d' + slotIndex);
        door.parent = hinge;
        // همه مش‌های فرزند قابل کلیک
        try {
            const kids = door.getChildMeshes ? door.getChildMeshes(true) : [];
            for (let ki = 0; ki < kids.length; ki++) {
                kids[ki].isPickable = true;
            }
        } catch (e) {}

        // موقعیت محلی درب نسبت به لولا — مرکز درب در فاصله w/2 از لبه لولا
        if (axis === 'y') {
            door.position.set(
                (openDir === -1) ? (w / 2) : (-w / 2),
                0,
                thick / 2
            );
        } else {
            // جکی: مثل لولایی، جلوی درب روی صفحهٔ نما (z = thick/2) تا ~۸mm عقب نماند
            door.position.set(0, -h / 2 + thick / 2, thick / 2);
        }

        // ---- metadata برای کلیک و انیمیشن (+ extras خروجی GLB) ----
        // hingeNode برای انیمیشن داخل BJS ضروری است؛ hingeId برای خروجی GLB
        const hingeExportId = 'cab_' + id + '_hinge' + slotIndex;
        const doorAxis = axis || 'y';
        // عین _toggleDoorOrDrawer: محور y → dir*PI/2 | محور x (جکی/افقی) → -1.6
        const targetOpenAngle = (doorAxis === 'x') ? -1.6 : (openDir * (Math.PI / 2));
        const maxAng = Math.abs(targetOpenAngle);
        door.metadata = {
            isDoor: true,
            isOpen: false,
            openDirection: openDir,
            axis: doorAxis,
            maxAngle: maxAng,
            targetOpenAngle: targetOpenAngle,
            slotIndex: slotIndex,
            cabinetId: c.id,
            hingeId: hingeExportId,
            hingeNode: hinge
        };
        hinge.metadata = {
            isDoor: true,
            isHinge: true,
            isDoorGroup: true,
            isOpen: false,
            targetRotation: 0,
            axis: doorAxis,
            openDirection: openDir,
            maxAngle: maxAng,
            targetOpenAngle: targetOpenAngle,
            hingeId: hingeExportId
        };
        // مش‌های قابل‌کلیک: isDoor + hingeNode تا کلیک در BJS کار کند
        try {
            const kids = door.getChildMeshes ? door.getChildMeshes(true) : [];
            for (let ki = 0; ki < kids.length; ki++) {
                const km = kids[ki].metadata || {};
                kids[ki].metadata = Object.assign({}, km, {
                    isDoor: true,
                    isDoorPart: true,
                    openDirection: openDir,
                    axis: doorAxis,
                    maxAngle: maxAng,
                    targetOpenAngle: targetOpenAngle,
                    hingeId: hingeExportId,
                    slotIndex: slotIndex,
                    cabinetId: c.id,
                    hingeNode: hinge
                });
            }
        } catch (e) {}

        // ---- یراق لولا: صفحه ثابت روی بدنه + کاسه روی درب ----
        this._addHingeHardware(group, hinge, door, axis, openDir, w, h, thick, id, slotIndex, D);

        // ---- دستگیره ----
        this._addDoorHandle(door, axis, openDir, w, h, thick, id, slotIndex, hTarget);

        return { hinge: hinge, door: door };
    },

    /**
     * یراق لولا — عین createMesh در view3d.js (خطوط 9795–9864)
     * staticHinge روی group (ثابت) | cup+arm روی door (با درب)
     * همیشه ۲ لولا در ±(h/2 − ۱۰)
     */
    _addHingeHardware: function (group, hinge, door, axis, openDir, w, h, thick, id, slotIndex, cabD) {
        const hMat = this._mat('hgMat_' + id + '_' + slotIndex,
            new BABYLON.Color3(0.72, 0.72, 0.72), new BABYLON.Color3(0.7, 0.7, 0.7));
        const cupMat = this._mat('hgCupMat_' + id + '_' + slotIndex,
            new BABYLON.Color3(0.60, 0.60, 0.60), new BABYLON.Color3(0.55, 0.55, 0.55));

        // staticHinge در موقعیت لولا — فقط روی group (با درب حرکت نمی‌کند)
        const staticHinge = new BABYLON.TransformNode('staticHinge_' + id + '_' + slotIndex, this.scene);
        staticHinge.parent = group;
        staticHinge.position = hinge.position.clone();

        const offsets = (axis === 'y')
            ? [h / 2 - 10, -h / 2 + 10]
            : [w / 2 - 10, -w / 2 + 10];

        for (let i = 0; i < offsets.length; i++) {
            const offsetPos = offsets[i];
            const uid = id + '_hg' + slotIndex + '_' + i;

            // پایه ثابت روی بدنه
            const base = BABYLON.MeshBuilder.CreateBox('hgBase_' + uid, {
                width: 0.55, height: 4.2, depth: 2.1
            }, this.scene);
            base.material = hMat;
            base.parent = staticHinge;
            base.isPickable = false;

            // کاپ روی درب
            const cup = BABYLON.MeshBuilder.CreateCylinder('hgCup_' + uid, {
                diameterTop: 2.5, diameterBottom: 2.3, height: 0.45, tessellation: 20
            }, this.scene);
            cup.material = cupMat;
            cup.parent = door;
            cup.isPickable = false;
            cup.rotation.x = Math.PI / 2;

            // بازو روی درب
            const arm = BABYLON.MeshBuilder.CreateBox('hgArm_' + uid, {
                width: 2.6, height: 1.35, depth: 0.35
            }, this.scene);
            arm.material = hMat;
            arm.parent = door;
            arm.isPickable = false;

            if (axis === 'y') {
                const baseX = (openDir === -1) ? (thick / 2 + 0.25) : (-thick / 2 - 0.25);
                base.position.set(baseX, offsetPos, -thick - 1.5);

                const hingeEdgeX = (openDir === -1) ? (-w / 2) : (w / 2);
                const cupX = hingeEdgeX + ((openDir === -1) ? 2.5 : -2.5);
                cup.position.set(cupX, offsetPos, -thick / 2);

                const armX = hingeEdgeX + ((openDir === -1) ? 1.5 : -1.5);
                arm.position.set(armX, offsetPos, -thick - 0.5);
            } else {
                base.rotation.z = Math.PI / 2;
                arm.rotation.z = Math.PI / 2;

                const baseY = -(thick / 2 + 0.25);
                base.position.set(offsetPos, baseY, -thick - 1.5);

                const hingeEdgeY = h / 2;
                cup.position.set(offsetPos, hingeEdgeY - 2.5, -thick / 2);
                arm.position.set(offsetPos, hingeEdgeY - 1.5, -thick - 0.5);
            }
        }
    },


    /**
     * دستگیره میله‌ای — معادل createBarHandle در Three.js
     * orientation: 'vertical' | 'horizontal'
     */
    _createBarHandle: function (opts) {
        opts = opts || {};
        const orientation = opts.orientation || 'vertical';
        const length = opts.length || 14;
        const barRadius = opts.barRadius || 0.45;
        const postRadius = opts.postRadius || 0.55;
        const standoff = (opts.standoff !== undefined) ? opts.standoff : 1.4;
        const postSpan = opts.postSpan || Math.max(6, length * 0.72);
        const uid = opts.uid || ('hdl_' + Math.floor(Math.random() * 1e6));

        const root = new BABYLON.TransformNode('barHandle_' + uid, this.scene);
        const hMat = this._mat('barHdlMat_' + uid,
            new BABYLON.Color3(0.78, 0.78, 0.78), new BABYLON.Color3(0.55, 0.55, 0.55));

        const postLen = standoff + barRadius;
        const halfSpan = postSpan / 2;
        const postZ = postLen / 2;

        for (let s = 0; s < 2; s++) {
            const along = (s === 0) ? -halfSpan : halfSpan;
            const post = BABYLON.MeshBuilder.CreateCylinder('barPost_' + uid + '_' + s, {
                diameterTop: postRadius * 2 * 0.92,
                diameterBottom: postRadius * 2,
                height: postLen,
                tessellation: 12
            }, this.scene);
            post.rotation.x = Math.PI / 2;
            if (orientation === 'vertical') {
                post.position.set(0, along, postZ);
            } else {
                post.position.set(along, 0, postZ);
            }
            post.material = hMat;
            post.parent = root;
            post.isPickable = true;
            post.metadata = { isHandle: true };
        }

        const barZ = standoff + barRadius;
        const bar = BABYLON.MeshBuilder.CreateCylinder('barBody_' + uid, {
            diameter: barRadius * 2,
            height: length,
            tessellation: 16
        }, this.scene);
        if (orientation === 'horizontal') bar.rotation.z = Math.PI / 2;
        bar.position.set(0, 0, barZ);
        bar.material = hMat;
        bar.parent = root;
        bar.isPickable = true;
        bar.metadata = { isHandle: true };

        // کلاهک دو سر
        for (let s = 0; s < 2; s++) {
            const cap = BABYLON.MeshBuilder.CreateSphere('barCap_' + uid + '_' + s, {
                diameter: barRadius * 2.1,
                segments: 8
            }, this.scene);
            if (orientation === 'vertical') {
                cap.position.set(0, (s === 0 ? 1 : -1) * length / 2, barZ);
            } else {
                cap.position.set((s === 0 ? 1 : -1) * length / 2, 0, barZ);
            }
            cap.material = hMat;
            cap.parent = root;
            cap.isPickable = true;
            cap.metadata = { isHandle: true };
        }

        return root;
    },

    /**
     * پروفیل دستگیره مخفی — معادل createHiddenHandleProfile در view3d.js
     * روی بدنه یونیت (پشت درب) ساخته می‌شود؛ نه روی خود درب
     * hTarget: 'top' | 'bottom' | 'custom'
     */
    _createHiddenHandleProfile: function (group, c, slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size, uid) {
        if (!hTarget || hTarget === 'none' || hTarget === 'no-handle') return;
        if (hTarget.indexOf('normal') === 0) return; // روکار — پروفیل مخفی نیست

        size = size || {};
        const D = parseFloat(c.d) || 55;
        const profileW = slotMaxX - slotMinX;
        const cx = (slotMinX + slotMaxX) / 2;
        uid = uid || ('hh_' + Math.floor(Math.random() * 1e6));

        // متریال — هم‌رنگ درب یا رنگ/تکسچر مشخص‌شده
        let profileMat;
        const isTexture = hColor && (
            String(hColor).indexOf('http') >= 0 ||
            String(hColor).indexOf('assets/') >= 0 ||
            String(hColor).indexOf('/') >= 0 ||
            String(hColor).indexOf('.jpg') >= 0 ||
            String(hColor).indexOf('.png') >= 0
        );

        if (isTexture) {
            profileMat = new BABYLON.StandardMaterial('hhMat_' + uid, this.scene);
            try {
                const tex = new BABYLON.Texture(hColor, this.scene, false, true);
                tex.uScale = Math.max(0.2, profileW / 50);
                tex.vScale = 1;
                profileMat.diffuseTexture = tex;
                profileMat.diffuseColor = BABYLON.Color3.White();
            } catch (e) {
                profileMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
            }
            profileMat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
        } else {
            const col = this._hexStrToColor3(hColor || '#999999');
            profileMat = this._mat('hhMat_' + uid, col, new BABYLON.Color3(0.08, 0.08, 0.08));
        }

        const isCustom = (hTarget === 'custom');
        const cType = isCustom ? (size.customHandleType || 'l-bottom') : null;
        const customH = Number(size.customHandleHeight) || 5;
        const customW = Number(size.customHandleWidth) || profileW;
        const customYOff = Number(size.customHandlePosY) || 0;
        const customFwd = Number(size.customHandleForward) || 0;
        const customBwd = Number(size.customHandleBackward) || 0;

        // ---- قطعه عمودی ----
        const vertH = (isCustom && size.customHandleHeight) ? customH : 5;
        const vertD = 1.6;
        const actualW = (isCustom && size.customHandleWidth) ? customW : profileW;

        let vertY = slotMinY;
        if (isCustom) {
            vertY = slotMaxY - (vertH / 2);
            if (size.customHandleYDir === 'down') vertY -= Math.abs(customYOff);
            else if (size.customHandleYDir === 'up') vertY += Math.abs(customYOff);
        } else if (hTarget === 'top') {
            vertY = slotMaxY - vertH / 2;
        } else if (hTarget === 'bottom') {
            vertY = slotMinY + vertH / 2;
        }

        let zOffset = 0;
        if (isCustom) zOffset = customFwd - customBwd;

        const vert = BABYLON.MeshBuilder.CreateBox('hhVert_' + uid, {
            width: actualW, height: vertH, depth: vertD
        }, this.scene);
        // z: پشت درب — (c.d/2) - 1.6 - vertD/2
        vert.position.set(cx, vertY, (D / 2) - 1.6 - (vertD / 2) + zOffset);
        vert.material = profileMat;
        vert.parent = group;
        vert.isPickable = false;

        // ---- قطعه افقی (۱۶ میل) ----
        const horizH = 1.6;
        const extraDepth = isCustom ? customBwd : 0;
        const horizD = 3.2 + extraDepth;

        let horizY = vertY;
        if (isCustom) {
            if (cType === 'l-top') {
                horizY = vertY + (vertH / 2) + (horizH / 2);
            } else if (cType === 'l-bottom') {
                horizY = vertY - (vertH / 2) - (horizH / 2);
            }
        } else {
            if (hTarget === 'top') {
                horizY = vertY - (vertH / 2) - (horizH / 2);
            } else if (hTarget === 'bottom') {
                horizY = vertY + (vertH / 2) + (horizH / 2);
            }
        }

        const horiz = BABYLON.MeshBuilder.CreateBox('hhHoriz_' + uid, {
            width: actualW, height: horizH, depth: horizD
        }, this.scene);
        horiz.position.set(cx, horizY, (D / 2) - (horizD / 2) + zOffset);
        horiz.material = profileMat;
        horiz.parent = group;
        horiz.isPickable = false;
    },

    /**
     * محل دستگیره درب — از hiddenHandlePos پنل درب‌ها
     * none / normal / normal-top / normal-bottom / no-handle
     * عین createMesh در view3d.js
     */
    _addDoorHandle: function (door, axis, openDir, w, h, thick, id, slotIndex, hTarget) {
        hTarget = hTarget || 'none';
        if (hTarget === 'no-handle') return;
        // دستگیره مخفی پروفیل جداست — اینجا فقط روکار
        if (hTarget !== 'none' && hTarget.indexOf('normal') !== 0 && hTarget !== 'none') {
            // top/bottom/custom = پروفیل مخفی — فعلاً روکار نساز
            if (hTarget === 'top' || hTarget === 'bottom' || hTarget === 'custom') return;
        }

        const isHorizontal = (axis !== 'y');
        const handleLen = isHorizontal
            ? Math.min(16, Math.max(10, w * 0.35))
            : Math.min(16, Math.max(10, h * 0.22));

        const handle = this._createBarHandle({
            orientation: isHorizontal ? 'horizontal' : 'vertical',
            length: handleLen,
            standoff: 1.35,
            uid: id + '_h' + slotIndex
        });
        handle.parent = door;

        // مختصات محلی درب — عین createMesh در view3d.js (بدون کم کردن door.position)
        // openDir=-1 (لولای چپ) → دستگیره روی لبه راست:  x = w/2 - 3
        // openDir=+1 (لولای راست) → دستگیره روی لبه چپ:  x = -w/2 + 3
        if (axis === 'y') {
            const handleX = (openDir === -1) ? (w / 2 - 3) : (-w / 2 + 3);
            let handleY = 0;
            const offset = 4;
            const halfHandleH = handleLen / 2;
            if (hTarget === 'normal-top') {
                handleY = (h / 2) - offset - halfHandleH;
            } else if (hTarget === 'normal-bottom') {
                handleY = -(h / 2) + offset + halfHandleH;
            }
            handle.position.set(handleX, handleY, thick / 2);
        } else {
            // جکی: دستگیره افقی ۳ سانت از لبه پایین
            handle.position.set(0, -h / 2 + 3, thick / 2);
        }
    },


    _doorsSide: function (group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP) {
        const directions = c.doorDirections || [];
        const customSizes = c.doorSizes || [];
        const numDoors = c.doors || 1;

        const gapBetween = SHADOW_GAP;
        const doorSlotW = numDoors > 0
            ? (angledFrontW - (numDoors - 1) * gapBetween) / numDoors
            : angledFrontW;
        const standardDoorW = doorSlotW;
        const standardDoorH = H - 0.1;

        for (let i = 0; i < numDoors; i++) {
            const size = customSizes[i] || {};
            if (size.enabled === false) continue;

            const doorW = (size.w !== undefined && size.w !== '') ? parseFloat(size.w) : standardDoorW;
            const doorH = (size.h !== undefined && size.h !== '') ? parseFloat(size.h) : standardDoorH;

            const dirStr = directions[i] || (i % 2 === 0 ? 'left' : 'right');
            const isLeftHinge = (dirStr === 'left');
            const dir = isLeftHinge ? -1 : 1;

            const slotMinX = angledSlotMinX + i * (doorSlotW + gapBetween);
            const slotMaxX = slotMinX + doorSlotW;
            const slotMinY = -H / 2;
            const slotMaxY = H / 2;

            const lockX = size.lockX || 'center';
            const lockY = size.lockY || 'center';
            const shiftDirX = size.shiftDirX || 'none';
            const shiftValueX = parseFloat(size.shiftValueX) || 0;

            const pos = this._getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, isLeftHinge, 'y', shiftDirX, shiftValueX);
            const hTarget = size.hiddenHandlePos || c.hiddenHandle || 'none';
            const hColor = size.hiddenHandleColor || c.hiddenHandleColor || '#999';
            this._createHiddenHandleProfile(group, c, slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size, id + '_hh' + i);
            this._createDoorMesh(group, c, doorW, doorH, pos.x, pos.y, dir, 'y', doorMat, id, i, thick, hTarget);
        }
    },

    // ---- lift ----
    _doorsLift: function (group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP) {
        const numDoors = c.doors || 1;
        const customSizes = c.doorSizes || [];
        const gapBetween = (numDoors > 1) ? SHADOW_GAP : 0;
        const doorSlotH = numDoors > 0
            ? (H - (numDoors - 1) * gapBetween - 0.2) / numDoors
            : H;
        const autoW = angledFrontW - 0.1;

        for (let i = 0; i < numDoors; i++) {
            const size = customSizes[i] || {};
            if (size.enabled === false) continue;

            const doorW = (size.w !== undefined && size.w !== '') ? parseFloat(size.w) : autoW;
            const doorH = (size.h !== undefined && size.h !== '') ? parseFloat(size.h) : doorSlotH;

            const topReveal = 0.1;
            const slotMaxY = H / 2 - topReveal - i * (doorSlotH + gapBetween);
            const slotMinY = slotMaxY - doorSlotH;
            const slotMinX = angledSlotMinX;
            const slotMaxX = angledSlotMaxX;

            const lockX = size.lockX || 'center';
            const lockY = size.lockY || 'center';
            const shiftDirX = size.shiftDirX || 'none';
            const shiftValueX = parseFloat(size.shiftValueX) || 0;

            const pos = this._getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, true, 'x', shiftDirX, shiftValueX);
            const hTarget = size.hiddenHandlePos || c.hiddenHandle || 'none';
            const hColor = size.hiddenHandleColor || c.hiddenHandleColor || '#999';
            this._createHiddenHandleProfile(group, c, slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size, id + '_hh' + i);
            this._createDoorMesh(group, c, doorW, doorH, pos.x, pos.y, -1, 'x', doorMat, id, i, thick, hTarget);
        }
    },

    // ---- lift-side ----
    _doorsLiftSide: function (group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP) {
        const customSizes = c.doorSizes || [];
        const gapBetween = SHADOW_GAP;
        const doorSlotW = (angledFrontW - gapBetween) / 2;
        const autoH = H - 0.2;

        for (let i = 0; i < 2; i++) {
            const size = customSizes[i] || {};
            if (size.enabled === false) continue;

            const doorW = (size.w !== undefined && size.w !== '') ? parseFloat(size.w) : doorSlotW;
            const doorH = (size.h !== undefined && size.h !== '') ? parseFloat(size.h) : autoH;

            const slotMinX = angledSlotMinX + i * (doorSlotW + gapBetween);
            const slotMaxX = slotMinX + doorSlotW;
            const slotMinY = -H / 2;
            const slotMaxY = H / 2;

            const lockX = size.lockX || 'center';
            const lockY = size.lockY || 'center';
            const shiftDirX = size.shiftDirX || 'none';
            const shiftValueX = parseFloat(size.shiftValueX) || 0;

            const pos = this._getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, true, 'x', shiftDirX, shiftValueX);
            const hTarget = size.hiddenHandlePos || c.hiddenHandle || 'none';
            const hColor = size.hiddenHandleColor || c.hiddenHandleColor || '#999';
            this._createHiddenHandleProfile(group, c, slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size, id + '_hh' + i);
            this._createDoorMesh(group, c, doorW, doorH, pos.x, pos.y, -1, 'x', doorMat, id, i, thick, hTarget);
        }
    },

    // ---- split ----
    _doorsSplit: function (group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP) {
        const numDoors = c.doors || 1;
        const count = Math.min(Math.max(numDoors, 2), 3);
        const directions = c.doorDirections || [];
        const customSizes = c.doorSizes || [];
        const gapBetween = SHADOW_GAP;
        const doorSlotH = (H - (count - 1) * gapBetween) / count;
        const autoW = W - 0.1;

        for (let i = 0; i < count; i++) {
            const size = customSizes[i] || {};
            if (size.enabled === false) continue;

            const doorW = (size.w !== undefined && size.w !== '') ? parseFloat(size.w) : autoW;
            const doorH = (size.h !== undefined && size.h !== '') ? parseFloat(size.h) : doorSlotH;

            const dirStr = directions[i] || 'left';
            const isLeftHinge = (dirStr === 'left');
            const dir = isLeftHinge ? -1 : 1;

            const slotMinX = angledSlotMinX;
            const slotMaxX = angledSlotMaxX;
            const slotMaxY = H / 2 - i * (doorSlotH + gapBetween);
            const slotMinY = slotMaxY - doorSlotH;

            const lockX = size.lockX || 'center';
            const lockY = size.lockY || 'center';
            const shiftDirX = size.shiftDirX || 'none';
            const shiftValueX = parseFloat(size.shiftValueX) || 0;

            const pos = this._getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, isLeftHinge, 'y', shiftDirX, shiftValueX);
            const hTarget = size.hiddenHandlePos || c.hiddenHandle || 'none';
            const hColor = size.hiddenHandleColor || c.hiddenHandleColor || '#999';
            this._createHiddenHandleProfile(group, c, slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size, id + '_hh' + i);
            this._createDoorMesh(group, c, doorW, doorH, pos.x, pos.y, dir, 'y', doorMat, id, i, thick, hTarget);
        }
    },

    // ---- combo ----
    _doorsCombo: function (group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP) {
        const numDoors = c.doors || 3;
        const directions = c.doorDirections || [];
        const customSizes = c.doorSizes || [];
        const self = this;

        const renderComboMesh = function (i, slotMinX, slotMaxX, slotMinY, slotMaxY) {
            const size = customSizes[i] || {};
            if (size.enabled === false) return;

            let autoW = slotMaxX - slotMinX;
            let autoH = slotMaxY - slotMinY;
            if (numDoors === 3) {
                autoW = (angledFrontW - 0.1) / 2;
                if (i === 0) autoH = H;
                else autoH = (H - 0.3) / 2;
            } else if (numDoors === 4) {
                autoW = (angledFrontW - 0.1) / 2;
                autoH = (H - 0.3) / 2;
            }

            const doorW = (size.w !== undefined && size.w !== '') ? parseFloat(size.w) : autoW;
            const doorH = (size.h !== undefined && size.h !== '') ? parseFloat(size.h) : autoH;
            const dirStr = directions[i] || 'left';
            const isLeftHinge = (dirStr === 'left');
            const dir = isLeftHinge ? -1 : 1;

            const lockX = size.lockX || 'center';
            const lockY = size.lockY || 'center';
            const shiftDirX = size.shiftDirX || 'none';
            const shiftValueX = parseFloat(size.shiftValueX) || 0;

            const pos = self._getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, isLeftHinge, 'y', shiftDirX, shiftValueX);
            const hTarget = size.hiddenHandlePos || c.hiddenHandle || 'none';
            const hColor = size.hiddenHandleColor || c.hiddenHandleColor || '#999';
            self._createHiddenHandleProfile(group, c, slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size, id + '_hh' + i);
            self._createDoorMesh(group, c, doorW, doorH, pos.x, pos.y, dir, 'y', doorMat, id, i, thick, hTarget);
        };

        if (numDoors === 4) {
            renderComboMesh(0, -W / 2, 0, 0, H / 2);
            renderComboMesh(1, 0, W / 2, 0, H / 2);
            renderComboMesh(2, -W / 2, 0, -H / 2, 0);
            renderComboMesh(3, 0, W / 2, -H / 2, 0);
        } else {
            const layout = c.comboLayout || 'left-big';
            const defaultBigW = angledFrontW / 2;
            if (layout === 'left-big' || layout === 'left') {
                renderComboMesh(0, angledSlotMinX, angledSlotMinX + defaultBigW, -H / 2, H / 2);
                renderComboMesh(1, angledSlotMinX + defaultBigW, angledSlotMaxX, 0, H / 2);
                renderComboMesh(2, angledSlotMinX + defaultBigW, angledSlotMaxX, -H / 2, 0);
            } else {
                renderComboMesh(1, angledSlotMinX, angledSlotMaxX - defaultBigW, 0, H / 2);
                renderComboMesh(2, angledSlotMinX, angledSlotMaxX - defaultBigW, -H / 2, 0);
                renderComboMesh(0, angledSlotMaxX - defaultBigW, angledSlotMaxX, -H / 2, H / 2);
            }
        }
    },

    // ---- jaki-ghadi ----
    _doorsJakiGhadi: function (group, c, W, H, D, thick, doorMat, id, angledFrontW, angledSlotMinX, angledSlotMaxX, SHADOW_GAP) {
        const directions = c.doorDirections || [];
        const customSizes = c.doorSizes || [];
        const layout = c.jakiGhadiLayout || 'top';
        const count = Math.min(Math.max(c.doors || 2, 2), 3);
        const geomJakiH = (H - 0.3) / 2;
        const geomGhadiH = (H - 0.3) / 2;
        const halfW = W / 2;
        const self = this;

        const renderJGhadiMesh = function (i, sMinX, sMaxX, sMinY, sMaxY, axis) {
            const size = customSizes[i] || {};
            if (size.enabled === false) return;
            const doorW = (size.w !== undefined && size.w !== '') ? parseFloat(size.w) : (sMaxX - sMinX);
            const doorH = (size.h !== undefined && size.h !== '') ? parseFloat(size.h) : (sMaxY - sMinY);

            let isLeftHinge = true;
            let dir = -1;
            if (axis === 'y') {
                const dirStr = directions[i] || (i === 0 ? 'left' : 'right');
                isLeftHinge = (dirStr === 'left');
                dir = isLeftHinge ? -1 : 1;
            }

            const lockX = size.lockX || 'center';
            const lockY = size.lockY || 'center';
            const shiftDirX = size.shiftDirX || 'none';
            const shiftValueX = parseFloat(size.shiftValueX) || 0;

            const pos = self._getHingePos(sMinX, sMaxX, sMinY, sMaxY, doorW, doorH, lockX, lockY, isLeftHinge, axis, shiftDirX, shiftValueX);
            const hTarget = size.hiddenHandlePos || c.hiddenHandle || 'none';
            const hColor = size.hiddenHandleColor || c.hiddenHandleColor || '#999';
            self._createHiddenHandleProfile(group, c, sMinX, sMaxX, sMinY, sMaxY, hTarget, hColor, size, id + '_hh' + i);
            self._createDoorMesh(group, c, doorW, doorH, pos.x, pos.y, dir, axis, doorMat, id, i, thick, hTarget);
        };

        if (layout === 'bottom') {
            if (count === 2) {
                renderJGhadiMesh(0, -halfW, halfW, H / 2 - geomGhadiH, H / 2, 'y');
                renderJGhadiMesh(2, -halfW, halfW, -H / 2, -H / 2 + geomJakiH, 'x');
            } else {
                renderJGhadiMesh(0, -halfW, 0, H / 2 - geomGhadiH, H / 2, 'y');
                renderJGhadiMesh(1, 0, halfW, H / 2 - geomGhadiH, H / 2, 'y');
                renderJGhadiMesh(2, -halfW, halfW, -H / 2, -H / 2 + geomJakiH, 'x');
            }
        } else {
            if (count === 2) {
                renderJGhadiMesh(2, -halfW, halfW, H / 2 - geomJakiH, H / 2, 'x');
                renderJGhadiMesh(0, -halfW, halfW, -H / 2, -H / 2 + geomGhadiH, 'y');
            } else {
                renderJGhadiMesh(2, -halfW, halfW, H / 2 - geomJakiH, H / 2, 'x');
                renderJGhadiMesh(0, -halfW, 0, -H / 2, -H / 2 + geomGhadiH, 'y');
                renderJGhadiMesh(1, 0, halfW, -H / 2, -H / 2 + geomGhadiH, 'y');
            }
        }
    },

    // ---- drawers ----
    /**
     * کشو کامل — معادل isDrawerBody + createRealisticDrawer در view3d.js
     */
    /**
     * ریل کشو سه‌تکه تلسکوپی ساچمه‌ای
     * side: -1 چپ | +1 راست
     * Outer channel (U) + Middle slider + Inner runner + ball bearings + bumper
     */
    _createTelescopicRail: function (parent, side, innerWidth, innerHeight, innerDepth, uid) {
        const railLen = Math.max(8, innerDepth * 0.95);
        const railY = -innerHeight / 2 + 2.2;

        const matOuter = this._mat('railOut_' + uid, new BABYLON.Color3(0.43, 0.43, 0.43), new BABYLON.Color3(0.75, 0.75, 0.75));
        const matMiddle = this._mat('railMid_' + uid, new BABYLON.Color3(0.60, 0.60, 0.60), new BABYLON.Color3(0.80, 0.80, 0.80));
        const matInner = this._mat('railIn_' + uid, new BABYLON.Color3(0.78, 0.78, 0.78), new BABYLON.Color3(0.90, 0.90, 0.90));
        const matBall = this._mat('railBall_' + uid, new BABYLON.Color3(0.82, 0.82, 0.82), new BABYLON.Color3(0.95, 0.95, 0.95));
        const matBump = this._mat('railBump_' + uid, new BABYLON.Color3(0.13, 0.13, 0.13), BABYLON.Color3.Black());

        const railRoot = new BABYLON.TransformNode('rail_' + uid, this.scene);
        railRoot.parent = parent;

        const outerH = 1.35;
        const outerW = 1.15;
        const wallT = 0.12;

        // Outer U channel — کف
        const outerBase = BABYLON.MeshBuilder.CreateBox('railOB_' + uid, {
            width: outerW, height: wallT, depth: railLen
        }, this.scene);
        outerBase.position.set(0, -outerH / 2 + wallT / 2, 0);
        outerBase.material = matOuter; outerBase.parent = railRoot; outerBase.isPickable = false;

        // Outer — لبه بالا
        const outerTop = BABYLON.MeshBuilder.CreateBox('railOT_' + uid, {
            width: outerW, height: wallT, depth: railLen
        }, this.scene);
        outerTop.position.set(0, outerH / 2 - wallT / 2, 0);
        outerTop.material = matOuter; outerTop.parent = railRoot; outerTop.isPickable = false;

        // Outer — دیواره پشتی کانال (به سمت بیرون)
        const outerBack = BABYLON.MeshBuilder.CreateBox('railOBk_' + uid, {
            width: wallT, height: outerH, depth: railLen
        }, this.scene);
        outerBack.position.set(side * (outerW / 2 - wallT / 2), 0, 0);
        outerBack.material = matOuter; outerBack.parent = railRoot; outerBack.isPickable = false;

        // Middle slider
        const midH = 0.95;
        const midW = 0.78;
        const midLen = railLen * 0.88;
        const middle = BABYLON.MeshBuilder.CreateBox('railMid_' + uid, {
            width: midW, height: midH, depth: midLen
        }, this.scene);
        middle.position.set(-side * 0.08, 0, railLen * 0.04);
        middle.material = matMiddle; middle.parent = railRoot; middle.isPickable = false;

        // شیار روی قطعه میانی
        const midGroove = BABYLON.MeshBuilder.CreateBox('railMG_' + uid, {
            width: midW * 0.35, height: 0.06, depth: midLen * 0.9
        }, this.scene);
        midGroove.position.set(-side * 0.08, midH * 0.15, railLen * 0.04);
        midGroove.material = matInner; midGroove.parent = railRoot; midGroove.isPickable = false;

        // Inner runner — براق‌تر، کوتاه‌تر
        const inH = 0.55;
        const inW = 0.48;
        const inLen = railLen * 0.72;
        const inner = BABYLON.MeshBuilder.CreateBox('railIn_' + uid, {
            width: inW, height: inH, depth: inLen
        }, this.scene);
        inner.position.set(-side * 0.18, 0.05, railLen * 0.08);
        inner.material = matInner; inner.parent = railRoot; inner.isPickable = false;

        // ساچمه‌ها (بلبرینگ)
        const ballR = 0.12;
        const ballCount = 5;
        for (let b = 0; b < ballCount; b++) {
            const tt = (b + 0.5) / ballCount;
            const bz = -railLen / 2 + tt * railLen * 0.85 + railLen * 0.05;
            const ball = BABYLON.MeshBuilder.CreateSphere('railBall_' + uid + '_' + b, {
                diameter: ballR * 2, segments: 6
            }, this.scene);
            ball.position.set(-side * 0.12, -0.15, bz);
            ball.material = matBall; ball.parent = railRoot; ball.isPickable = false;
        }

        // ضربه‌گیر پلاستیکی انتها
        const bumper = BABYLON.MeshBuilder.CreateBox('railBump_' + uid, {
            width: outerW * 0.7, height: outerH * 0.6, depth: 0.35
        }, this.scene);
        bumper.position.set(0, 0, -railLen / 2 + 0.2);
        bumper.material = matBump; bumper.parent = railRoot; bumper.isPickable = false;

        // موقعیت نسبت به بدنه کشو
        const xPos = side < 0
            ? (-innerWidth / 2 - outerW / 2 - 0.15)
            : (innerWidth / 2 + outerW / 2 + 0.15);
        railRoot.position.set(xPos, railY, 0);

        return railRoot;
    },

    _buildDrawerFronts: function (group, c, W, H, D, thick, doorMat, id, GAP) {
        const numDrawers = c.drawerCount || (c.doorSizes && c.doorSizes.length) || 3;
        const gap = (c.drawerGap !== undefined) ? c.drawerGap : GAP;
        const availableHeight = H - (gap * (numDrawers - 1));
        const hasCustomDrawers = c.drawersData && c.drawersData.length === numDrawers;

        // ارتفاع اسلات‌ها با scale مثل Three
        const requested = [];
        let totalInput = 0;
        for (let i = 0; i < numDrawers; i++) {
            const dData = hasCustomDrawers ? c.drawersData[i] : null;
            const sData = (c.doorSizes && c.doorSizes[i]) ? c.doorSizes[i] : null;
            let slotH = availableHeight / numDrawers;
            let customBodyH = null;
            if (dData && dData.height && !isNaN(parseFloat(dData.height))) customBodyH = parseFloat(dData.height);
            else if (sData && sData.bodyH && !isNaN(parseFloat(sData.bodyH))) customBodyH = parseFloat(sData.bodyH);
            if (customBodyH !== null) {
                const defaultBodyH = (availableHeight / numDrawers) * 0.7 - 2;
                slotH += (customBodyH - defaultBodyH);
            }
            requested.push(slotH);
            totalInput += slotH;
        }
        const scaleFactor = totalInput > 0 ? (availableHeight / totalInput) : 1;

        let currentY = H / 2;
        const bodyMat = this._mat('drwBody_' + id, new BABYLON.Color3(0.91, 0.90, 0.89));
        const floorMat = this._mat('drwFloor_' + id, new BABYLON.Color3(0.88, 0.87, 0.85));
        const railMat = this._mat('drwRail_' + id, new BABYLON.Color3(0.55, 0.55, 0.55), new BABYLON.Color3(0.5, 0.5, 0.5));

        for (let i = 0; i < numDrawers; i++) {
            const dData = hasCustomDrawers ? c.drawersData[i] : null;
            const sData = (c.doorSizes && c.doorSizes[i]) ? c.doorSizes[i] : null;
            const currentSlotH = requested[i] * scaleFactor;
            const slotMaxY = currentY;
            const slotMinY = currentY - currentSlotH;
            currentY -= (currentSlotH + gap);

            let frontH = currentSlotH;
            if (sData && sData.h && !isNaN(parseFloat(sData.h))) frontH = parseFloat(sData.h);

            let frontW = W - 0.1;
            let shiftX = 0;
            let lockY = 'center';
            if (sData) {
                if (sData.w && !isNaN(parseFloat(sData.w))) frontW = parseFloat(sData.w);
                if (sData.lockY) lockY = sData.lockY;
                const sVal = parseFloat(sData.shiftValueX) || 0;
                if (sData.shiftDirX === 'left') shiftX = -sVal;
                if (sData.shiftDirX === 'right') shiftX = sVal;
            }

            // موقعیت عمودی جبهه
            let frontYPos;
            if (lockY === 'bottom') frontYPos = slotMinY + frontH / 2;
            else if (lockY === 'top') frontYPos = slotMaxY - frontH / 2;
            else frontYPos = slotMaxY - currentSlotH / 2;

            // متریال جبهه این کشو — تکسچر کات‌مستر همان اسلات (کشو n)
            let frontMat = doorMat;
            try {
                frontMat = this._makeDoorMaterialForSlot(c, id, frontW, frontH, i);
            } catch (e) {}

            const innerDepth = (dData && dData.depth) ? parseFloat(dData.depth) : D * 0.85;
            let customBodyH = null;
            if (dData && dData.height && !isNaN(parseFloat(dData.height))) customBodyH = parseFloat(dData.height);
            else if (sData && sData.bodyH && !isNaN(parseFloat(sData.bodyH))) customBodyH = parseFloat(sData.bodyH);
            const innerHeight = customBodyH !== null ? customBodyH : (currentSlotH * 0.7);
            const innerWidth = (W - 0.1) * 0.9;
            const bThick = 1.6;
            const bottomThick = 0.8;

            // pivot برای انیمیشن باز/بسته
            const closedZ = D / 2 + thick / 2;
            const openZ = closedZ + innerDepth * 0.8;
            const pivot = new BABYLON.TransformNode('cab_' + id + '_drwP' + i, this.scene);
            pivot.parent = group;
            pivot.position = new BABYLON.Vector3(shiftX, frontYPos, closedZ);
            pivot.metadata = { isDrawer: true, targetZ: closedZ, closedZ: closedZ, openZ: openZ, isOpen: false };

            // جبهه کشو — با لبه ظریف مثل createPanelMesh / bevel
            const front = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_drwF' + i, {
                width: frontW, height: Math.max(2, frontH - 0.05), depth: thick
            }, this.scene);
            front.material = frontMat;
            front.parent = pivot;
            front.isPickable = true;
            front.metadata = {
                isDrawer: true,
                isOpen: false,
                hingeNode: pivot,
                cabinetId: c.id,
                slotIndex: i
            };

            // بدنه داخلی (طرفین + جلو/عقب داخلی + کف)
            const body = new BABYLON.TransformNode('cab_' + id + '_drwBody' + i, this.scene);
            body.parent = pivot;
            let bodyTargetY = slotMinY + (innerHeight / 2) + 2;
            if (i === 0) bodyTargetY -= 1.8;
            const bodyLocalY = bodyTargetY - frontYPos;
            body.position.set(-shiftX, bodyLocalY, -(innerDepth / 2 + thick / 2));

            const sideL = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_drwSL' + i, {
                width: bThick, height: innerHeight, depth: innerDepth
            }, this.scene);
            sideL.position.set(-innerWidth / 2 + bThick / 2, 0, 0);
            sideL.material = bodyMat; sideL.parent = body; sideL.isPickable = false;

            const sideR = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_drwSR' + i, {
                width: bThick, height: innerHeight, depth: innerDepth
            }, this.scene);
            sideR.position.set(innerWidth / 2 - bThick / 2, 0, 0);
            sideR.material = bodyMat; sideR.parent = body; sideR.isPickable = false;

            const fbWidth = innerWidth - 2 * bThick;
            const frontInner = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_drwFI' + i, {
                width: fbWidth, height: innerHeight, depth: bThick
            }, this.scene);
            frontInner.position.set(0, 0, innerDepth / 2 - bThick / 2);
            frontInner.material = bodyMat; frontInner.parent = body; frontInner.isPickable = false;

            const backInner = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_drwBI' + i, {
                width: fbWidth, height: innerHeight, depth: bThick
            }, this.scene);
            backInner.position.set(0, 0, -innerDepth / 2 + bThick / 2);
            backInner.material = bodyMat; backInner.parent = body; backInner.isPickable = false;

            const bottom = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_drwBot' + i, {
                width: fbWidth + 1.4, height: bottomThick, depth: innerDepth - 2 * bThick + 1.4
            }, this.scene);
            bottom.position.set(0, -innerHeight / 2 + 1.7 + bottomThick / 2, 0);
            bottom.material = floorMat; bottom.parent = body; bottom.isPickable = false;

            // ریل تلسکوپی سه‌تکه (عین createRealisticDrawer در view3d.js)
            // Outer = ثابت روی بدنه | Middle = میانی | Inner = متصل به کشو + ساچمه
            this._createTelescopicRail(body, -1, innerWidth, innerHeight, innerDepth, id + '_rL' + i);
            this._createTelescopicRail(body, 1, innerWidth, innerHeight, innerDepth, id + '_rR' + i);

            // دستگیره مخفی یا روکار
            const hTarget = sData ? (sData.hiddenHandlePos || 'none') : 'none';
            const hColor = sData ? (sData.hiddenHandleColor || '#999') : '#999';
            this._createHiddenHandleProfile(group, c, -W / 2, W / 2, slotMinY, slotMaxY, hTarget, hColor, sData || {}, id + '_dhh' + i);
            if (hTarget === 'none' || (hTarget && hTarget.indexOf('normal') === 0)) {
                const handle = this._createBarHandle({
                    orientation: 'horizontal',
                    length: Math.min(18, Math.max(10, frontW * 0.35)),
                    standoff: 1.3,
                    uid: id + '_dh' + i
                });
                handle.parent = front;
                let hy = 0;
                if (hTarget === 'normal-top') hy = frontH * 0.28;
                else if (hTarget === 'normal-bottom') hy = -frontH * 0.28;
                handle.position.set(0, hy, thick / 2);
            }
        }

        // سقف اختیاری کشو
        if (c.drawerTopPanel) {
            const top = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_drwTop', {
                width: W, height: 1.6, depth: D
            }, this.scene);
            top.position.set(0, H / 2 + 0.8, 0);
            top.material = bodyMat; top.parent = group; top.isPickable = false;
        }
    },

    /**
     * isBaseWithDrawer — عین view3d.js
     * کشوی بالا: createRealisticDrawer + درب‌های پایین لولایی
     */
    _buildBaseWithDrawer: function (group, c, W, H, D, thick, doorMat, id, GAP, angledFrontW, angledSlotMinX, angledSlotMaxX) {
        const gap = (GAP != null) ? GAP : 0.2;
        const sData0 = (c.doorSizes && c.doorSizes[0]) ? c.doorSizes[0] : null;
        const dData0 = (c.drawersData && c.drawersData.length > 0) ? c.drawersData[0] : null;

        // —— ابعاد کشو (فرمول Three) ——
        let baseDrawerH = c.drawerFrontHeight ? parseFloat(c.drawerFrontHeight) : 18.0;
        let physicalSlotH = baseDrawerH + 0.8;
        const defaultInnerHeight = (baseDrawerH * 0.7) - 2;

        let customBodyH = null;
        if (dData0 && dData0.height && !isNaN(parseFloat(dData0.height))) {
            customBodyH = parseFloat(dData0.height);
        } else if (sData0 && sData0.bodyH && !isNaN(parseFloat(sData0.bodyH))) {
            customBodyH = parseFloat(sData0.bodyH);
        }
        const innerHeight = customBodyH !== null ? customBodyH : Math.max(6, defaultInnerHeight);
        const heightGrowth = innerHeight - defaultInnerHeight;

        let drawerActualSlotH = physicalSlotH + heightGrowth;
        let topDoorH = drawerActualSlotH;
        if (sData0 && sData0.h && !isNaN(parseFloat(sData0.h))) {
            topDoorH = parseFloat(sData0.h);
        }

        const currentY = H / 2;
        let frontW = (angledFrontW != null ? angledFrontW : W) - 0.1;
        let lockX = 'center';
        let lockY = 'top';
        let shiftDirX = 'none';
        let shiftValueX = 0;
        if (sData0) {
            if (sData0.w && !isNaN(parseFloat(sData0.w))) frontW = parseFloat(sData0.w);
            if (sData0.lockX) lockX = sData0.lockX;
            if (sData0.lockY) lockY = sData0.lockY;
            if (sData0.shiftDirX) shiftDirX = sData0.shiftDirX;
            if (sData0.shiftValueX) shiftValueX = parseFloat(sData0.shiftValueX) || 0;
        }

        const slotMaxX_drawer = angledSlotMaxX != null ? angledSlotMaxX : W / 2;
        const slotMinX_drawer = angledSlotMinX != null ? angledSlotMinX : -W / 2;
        const slotMaxY_drawer = currentY;
        const slotMinY_drawer = currentY - drawerActualSlotH;

        let drawerXPos = 0;
        if (lockX === 'left') drawerXPos = slotMinX_drawer + frontW / 2;
        else if (lockX === 'right') drawerXPos = slotMaxX_drawer - frontW / 2;
        if (shiftDirX === 'left') drawerXPos -= shiftValueX;
        if (shiftDirX === 'right') drawerXPos += shiftValueX;

        // Y — پیش‌فرض lockY = top → لبه بالای جبهه روی لبه بالای یونیت
        let drawerYPos = slotMaxY_drawer - (topDoorH / 2);
        if (lockY === 'bottom') drawerYPos = slotMinY_drawer + (topDoorH / 2);
        else if (lockY === 'center') drawerYPos = slotMaxY_drawer - (drawerActualSlotH / 2);

        const frontH = Math.max(1, topDoorH - gap);

        // متریال جبهه
        let frontMat = doorMat;
        try {
            if (sData0) {
                const fakeC = Object.assign({}, c);
                if (sData0.doorTexture || sData0.doorColor) {
                    fakeC.doorColor = sData0.doorTexture || sData0.doorColor;
                }
                if (sData0.doorMaterial) fakeC.doorMaterial = sData0.doorMaterial;
                frontMat = this._makeDoorMaterial(fakeC, id + '_bdTop', frontW, frontH);
            }
        } catch (e) {}

        // عمق و عرض بدنه — عین createRealisticDrawer
        let innerDepth = D * 0.85;
        if (dData0 && dData0.depth && !isNaN(parseFloat(dData0.depth))) {
            innerDepth = parseFloat(dData0.depth);
        }
        const innerWidth = frontW * 0.9;
        const bThick = 1.6;
        const bottomThick = 0.3;

        const closedZ = D / 2 + thick / 2;
        const openZ = closedZ + innerDepth * 0.8;

        // pivot روی موقعیت جبهه (world)
        const pivot = new BABYLON.TransformNode('cab_' + id + '_bdDrwP', this.scene);
        pivot.parent = group;
        pivot.position = new BABYLON.Vector3(drawerXPos, drawerYPos, closedZ);
        pivot.metadata = { isDrawer: true, targetZ: closedZ, closedZ: closedZ, openZ: openZ, isOpen: false };

        // جبهه
        const front = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_bdDrwF', {
            width: frontW, height: frontH, depth: thick
        }, this.scene);
        front.material = frontMat;
        front.parent = pivot;
        front.position.set(0, 0, 0);
        front.isPickable = true;
        front.metadata = {
            isDrawer: true,
            isOpen: false,
            hingeNode: pivot,
            cabinetId: c.id,
            slotIndex: 0
        };

        // متریال بدنه
        let bodyCol = new BABYLON.Color3(0.91, 0.90, 0.89);
        if (dData0 && dData0.color && String(dData0.color).charAt(0) === '#') {
            bodyCol = this._hexToColor3(dData0.color);
        }
        const bodyMat = this._mat('bdBody_' + id, bodyCol);
        const floorMat = this._mat('bdFloor_' + id, new BABYLON.Color3(1, 1, 1));

        // بدنه — parent به front مثل Three (drawerFront.add(drawerBody))
        // در Three: body.position = (-drawerXPos, bodyTargetY - drawerYPos, -(innerDepth/2 + thick/2))
        // و body روی drawerFront است که در (drawerXPos, drawerYPos, closedZ) است
        const body = new BABYLON.TransformNode('cab_' + id + '_bdDrwBody', this.scene);
        body.parent = pivot;

        // فرمول Three برای Y بدنه + ۵ میل بالاتر (فقط بدنه، نه جبهه)
        let fixedGapFromTop = physicalSlotH - defaultInnerHeight;
        let bodyTargetY = currentY - fixedGapFromTop - (innerHeight / 2);
        bodyTargetY -= 1.8; // فاصله از قید ۱۶ میل بالا
        bodyTargetY += 2.0; // ۲ سانت بالاتر تا با درب پایین تداخل نداشته باشد
        bodyTargetY += 0.5; // ۵ میلی‌متر بالاتر — فقط بدنه کشو
        const bodyLocalY = bodyTargetY - drawerYPos;
        body.position.set(-drawerXPos, bodyLocalY, -(innerDepth / 2 + thick / 2));

        // بغل‌ها
        const sideL = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_bdSL', {
            width: bThick, height: innerHeight, depth: innerDepth
        }, this.scene);
        sideL.position.set(-innerWidth / 2 + bThick / 2, 0, 0);
        sideL.material = bodyMat; sideL.parent = body; sideL.isPickable = false;

        const sideR = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_bdSR', {
            width: bThick, height: innerHeight, depth: innerDepth
        }, this.scene);
        sideR.position.set(innerWidth / 2 - bThick / 2, 0, 0);
        sideR.material = bodyMat; sideR.parent = body; sideR.isPickable = false;

        // جلو/عقب داخلی
        const fbWidth = Math.max(1, innerWidth - 2 * bThick);
        const frontInner = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_bdFI', {
            width: fbWidth, height: innerHeight, depth: bThick
        }, this.scene);
        frontInner.position.set(0, 0, innerDepth / 2 - bThick / 2);
        frontInner.material = bodyMat; frontInner.parent = body; frontInner.isPickable = false;

        const backInner = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_bdBI', {
            width: fbWidth, height: innerHeight, depth: bThick
        }, this.scene);
        backInner.position.set(0, 0, -innerDepth / 2 + bThick / 2);
        backInner.material = bodyMat; backInner.parent = body; backInner.isPickable = false;

        // کف
        const bottom = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_bdBot', {
            width: fbWidth + 1.4, height: bottomThick, depth: innerDepth - 2 * bThick + 1.4
        }, this.scene);
        bottom.position.set(0, -innerHeight / 2 + 1.7 + bottomThick / 2, 0);
        bottom.material = floorMat; bottom.parent = body; bottom.isPickable = false;

        // ریل سه‌تکه
        this._createTelescopicRail(body, -1, innerWidth, innerHeight, innerDepth, id + '_bdRL');
        this._createTelescopicRail(body, 1, innerWidth, innerHeight, innerDepth, id + '_bdRR');

        // دستگیره
        const hTarget0 = sData0 ? (sData0.hiddenHandlePos || 'none') : 'none';
        const hColor0 = sData0 ? (sData0.hiddenHandleColor || '#999') : '#999';
        this._createHiddenHandleProfile(
            group, c,
            slotMinX_drawer, slotMaxX_drawer,
            slotMinY_drawer, slotMaxY_drawer,
            hTarget0, hColor0, sData0 || {}, id + '_bdhh0'
        );
        if (hTarget0 === 'none' || (hTarget0 && hTarget0.indexOf('normal') === 0)) {
            const handle = this._createBarHandle({
                orientation: 'horizontal',
                length: Math.min(18, Math.max(10, frontW * 0.35)),
                standoff: 1.3,
                uid: id + '_bdh0'
            });
            handle.parent = front;
            let hy = 0;
            if (hTarget0 === 'normal-top') hy = frontH * 0.28;
            else if (hTarget0 === 'normal-bottom') hy = -frontH * 0.28;
            handle.position.set(0, hy, thick / 2);
        }

        // ========== درب‌های پایین ==========
        const bottomDoorsStartY = currentY - drawerActualSlotH;
        const totalParts = c.doors || 2;
        const bottomDoorsCount = totalParts > 1 ? totalParts - 1 : 1;
        const directions = c.doorDirections || [];
        const customSizes = c.doorSizes || [];
        const slotMinY = -H / 2;
        const slotMaxY = bottomDoorsStartY;
        const slotH = slotMaxY - slotMinY;
        const gapBetweenBottom = gap;
        const doorSlotWBottom = bottomDoorsCount > 0
            ? ((angledFrontW != null ? angledFrontW : W) - (bottomDoorsCount - 1) * gapBetweenBottom) / bottomDoorsCount
            : (angledFrontW != null ? angledFrontW : W);

        for (let i = 1; i < totalParts; i++) {
            const size = customSizes[i] || {};
            if (size.enabled === false) continue;

            const doorW = (size.w !== undefined && size.w !== '') ? parseFloat(size.w) : doorSlotWBottom;
            const doorHBot = (size.h !== undefined && size.h !== '') ? parseFloat(size.h) : Math.max(5, slotH - gap);

            const lockXb = size.lockX || 'center';
            const lockYb = size.lockY || 'center';
            const shiftDirXb = size.shiftDirX || 'none';
            const shiftValueXb = parseFloat(size.shiftValueX) || 0;

            const hTarget = size.hiddenHandlePos || 'none';
            const hColor = size.hiddenHandleColor || '#999';

            const physIndex = i - 1;
            const dirStr = directions[i] || (physIndex % 2 === 0 ? 'left' : 'right');
            const isLeftHinge = (dirStr === 'left');
            const dir = isLeftHinge ? -1 : 1;

            const baseMinX = angledSlotMinX != null ? angledSlotMinX : -W / 2;
            const slotMinX = baseMinX + physIndex * (doorSlotWBottom + gapBetweenBottom);
            const slotMaxX = slotMinX + doorSlotWBottom;

            this._createHiddenHandleProfile(group, c, slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size, id + '_bdhh' + i);

            const pos = this._getHingePos(
                slotMinX, slotMaxX, slotMinY, slotMaxY,
                doorW, doorHBot,
                lockXb, lockYb,
                isLeftHinge, 'y',
                shiftDirXb, shiftValueXb
            );

            let botMat = doorMat;
            try {
                if (size.doorTexture || size.doorColor) {
                    const fakeC = Object.assign({}, c, {
                        doorColor: size.doorTexture || size.doorColor,
                        doorMaterial: size.doorMaterial || c.doorMaterial
                    });
                    botMat = this._makeDoorMaterial(fakeC, id + '_bdBot' + i, doorW, doorHBot);
                }
            } catch (e) {}

            this._createDoorMesh(group, c, doorW, doorHBot, pos.x, pos.y, dir, 'y', botMat, id, i, thick, hTarget);
        }

        if (c.drawerTopPanel) {
            const topThick = 1.6;
            const topMesh = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_bdTopPanel', {
                width: W, height: topThick, depth: D
            }, this.scene);
            topMesh.position.set(0, H / 2 + topThick / 2, 0);
            topMesh.material = this._mat('bdTopP_' + id, new BABYLON.Color3(1, 1, 1));
            topMesh.parent = group;
            topMesh.isPickable = false;
        }
    },


    _addHandle: function (parent, length, localX, localZ, horizontal, uid) {
        const hMat = this._mat('cabHdl_' + uid, new BABYLON.Color3(0.75, 0.75, 0.78), new BABYLON.Color3(0.55, 0.55, 0.55));
        const barLen = Math.max(8, length);
        const bar = BABYLON.MeshBuilder.CreateCylinder('cab_hdl_' + uid, {
            diameter: 1.1, height: barLen, tessellation: 10
        }, this.scene);
        if (horizontal) {
            bar.rotation.z = Math.PI / 2;
            bar.position.set(0, 0, localZ);
        } else {
            bar.position.set(localX, 0, localZ);
        }
        bar.material = hMat; bar.parent = parent; bar.isPickable = true;
        bar.metadata = { isHandle: true };

        for (let i = 0; i < 2; i++) {
            const peg = BABYLON.MeshBuilder.CreateBox('cab_peg_' + uid + '_' + i, {
                width: 0.9, height: 0.9, depth: 1.2
            }, this.scene);
            if (horizontal) {
                peg.position.set((i === 0 ? -1 : 1) * barLen * 0.35, 0, localZ - 0.5);
            } else {
                peg.position.set(localX, (i === 0 ? -1 : 1) * barLen * 0.35, localZ - 0.5);
            }
            peg.material = hMat; peg.parent = parent; peg.isPickable = true;
            peg.metadata = { isHandle: true };
        }
    },

    // ---- تعامل کلیک ----
    _setupDoorInteraction: function () {
        if (!this.scene) return;
        const self = this;
        this._pointerDownPos = null;
        if (this._pointerObs) {
            try { this.scene.onPointerObservable.remove(this._pointerObs); } catch (e) {}
            this._pointerObs = null;
        }
        this._pointerObs = this.scene.onPointerObservable.add(function (pointerInfo) {
            const t = pointerInfo.type;
            if (t === BABYLON.PointerEventTypes.POINTERDOWN) {
                const e = pointerInfo.event;
                self._pointerDownPos = { x: e.clientX, y: e.clientY };
                return;
            }
            if (t !== BABYLON.PointerEventTypes.POINTERUP && t !== BABYLON.PointerEventTypes.POINTERPICK) return;
            if (self._pointerDownPos && pointerInfo.event) {
                const dx = pointerInfo.event.clientX - self._pointerDownPos.x;
                const dy = pointerInfo.event.clientY - self._pointerDownPos.y;
                if (dx * dx + dy * dy > 25) return; // drag = چرخش دوربین، نه کلیک
            }
            const pick = self.scene.pick(self.scene.pointerX, self.scene.pointerY);
            if (!pick || !pick.hit || !pick.pickedMesh) return;
            const doorOrDrawer = self._findDoorOrDrawer(pick.pickedMesh);
            if (!doorOrDrawer) return;
            self._toggleDoorOrDrawer(doorOrDrawer);
        });
    },

    _findDoorOrDrawer: function (mesh) {
        let o = mesh;
        while (o) {
            if (o.metadata && (o.metadata.isDoor || o.metadata.isDrawer)) return o;
            o = o.parent;
        }
        return null;
    },

    _toggleDoorOrDrawer: function (obj) {
        if (!obj || !obj.metadata) return;
        obj.metadata.isOpen = !obj.metadata.isOpen;
        const isOpen = obj.metadata.isOpen;

        if (obj.metadata.isSlidingDoor) {
            // درب ریلی چهارچوب: حرکت افقی بین closedX و openX
            obj.metadata.targetX = isOpen
                ? (obj.metadata.openX != null ? obj.metadata.openX : obj.position.x)
                : (obj.metadata.closedX != null ? obj.metadata.closedX : obj.position.x);
            this._markAnimating(obj);
        } else if (obj.metadata.isDoor) {
            // دقیقاً مثل view3d.js خطوط 12090–12112
            const hinge = obj.metadata.hingeNode;
            if (!hinge) return;
            const axis = obj.metadata.axis || 'y';
            const dir = obj.metadata.openDirection != null ? obj.metadata.openDirection : -1;

            let targetAngle = 0;
            if (isOpen) {
                if (axis === 'x') {
                    targetAngle = -1.6;           // جکی ≈ ۹۱.۷ درجه
                } else {
                    targetAngle = dir * (Math.PI / 2); // لولایی ±۹۰ درجه
                }
            }

            if (!hinge.metadata) hinge.metadata = {};
            hinge.metadata.targetRotation = targetAngle;
            hinge.metadata.axis = axis;
            this._markAnimating(hinge);
        } else if (obj.metadata.isDrawer) {
            const pivot = obj.metadata.hingeNode;
            if (!pivot || !pivot.metadata) return;
            pivot.metadata.targetZ = isOpen ? pivot.metadata.openZ : pivot.metadata.closedZ;
            this._markAnimating(pivot);
        }
    },

    _markAnimating: function (node) {
        if (!this._animating) this._animating = [];
        if (this._animating.indexOf(node) < 0) this._animating.push(node);
    },

    _tickDoorAnim: function () {
        if (!this._animating || !this._animating.length) return;
        const done = [];
        for (let i = 0; i < this._animating.length; i++) {
            const obj = this._animating[i];
            if (!obj || !obj.metadata) { done.push(obj); continue; }
            let still = false;

            if (typeof obj.metadata.targetRotation !== 'undefined') {
                // عین animate() در view3d.js: هر فریم ۱۲٪ فاصله تا هدف
                const target = obj.metadata.targetRotation;
                const axis = obj.metadata.axis || 'y';
                if (axis === 'x') {
                    const cur = obj.rotation.x;
                    const next = cur + (target - cur) * 0.12;
                    obj.rotation.x = next;
                    if (Math.abs(target - next) > 0.002) still = true;
                    else obj.rotation.x = target;
                } else {
                    const cur = obj.rotation.y;
                    const next = cur + (target - cur) * 0.12;
                    obj.rotation.y = next;
                    if (Math.abs(target - next) > 0.002) still = true;
                    else obj.rotation.y = target;
                }
            }
            if (typeof obj.metadata.targetZ !== 'undefined') {
                const targetZ = obj.metadata.targetZ;
                obj.position.z += (targetZ - obj.position.z) * 0.12;
                if (Math.abs(targetZ - obj.position.z) > 0.05) still = true;
                else obj.position.z = targetZ;
            }
            if (typeof obj.metadata.targetX !== 'undefined') {
                const targetX = obj.metadata.targetX;
                obj.position.x += (targetX - obj.position.x) * 0.12;
                if (Math.abs(targetX - obj.position.x) > 0.05) still = true;
                else obj.position.x = targetX;
            }
            if (!still) done.push(obj);
        }
        for (let i = 0; i < done.length; i++) {
            const idx = this._animating.indexOf(done[i]);
            if (idx >= 0) this._animating.splice(idx, 1);
        }
    },

    /**
     * باکس نما — معادل isFacadeBox در view3d.js
     * چهار دیواره اختیاری از c.panels با ابعاد مستقل
     */
    _buildFacadeBox: function (group, c, W, H, D, thick, id, doorMat, bodyMat) {
        const p = c.panels || {};
        const tL = (p.left && p.left.t) ? parseFloat(p.left.t) : 1.6;
        const tR = (p.right && p.right.t) ? parseFloat(p.right.t) : 1.6;
        const tF = (p.front && p.front.t) ? parseFloat(p.front.t) : 1.6;
        const tB = (p.back && p.back.t) ? parseFloat(p.back.t) : 1.6;

        const pFrontW = (p.front && p.front.w) ? parseFloat(p.front.w) : 0;
        const pBackW = (p.back && p.back.w) ? parseFloat(p.back.w) : 0;
        const innerW = Math.max(pFrontW, pBackW);
        const boxW = innerW > 0 ? (innerW + tL + tR) : W;

        const pLeftD = (p.left && p.left.w) ? parseFloat(p.left.w) : 0;
        const pRightD = (p.right && p.right.w) ? parseFloat(p.right.w) : 0;
        const boxD = Math.max(pLeftD, pRightD) > 0 ? Math.max(pLeftD, pRightD) : D;

        const hL = (p.left && p.left.h) ? parseFloat(p.left.h) : H;
        const hR = (p.right && p.right.h) ? parseFloat(p.right.h) : H;
        const hBk = (p.back && p.back.h) ? parseFloat(p.back.h) : H;
        const hF = (p.front && p.front.h) ? parseFloat(p.front.h) : H;
        const boxH = Math.max(hL, hR, hBk, hF) > 0 ? Math.max(hL, hR, hBk, hF) : H;

        const yL = (hL - boxH) / 2;
        const yR = (hR - boxH) / 2;
        const yBk = (hBk - boxH) / 2;
        const yF = (hF - boxH) / 2;

        const self = this;
        function panelMat(panelData, label) {
            const col = (panelData && panelData.color) ? panelData.color : '#FFFFFF';
            if (col && String(col).charAt(0) === '#') {
                return self._mat('fb_' + id + '_' + label, self._hexToColor3(col));
            }
            // تکسچر / URL
            const mat = new BABYLON.StandardMaterial('fb_' + id + '_' + label, self.scene);
            mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
            if (col && typeof col === 'string' && (col.indexOf('http') >= 0 || col.indexOf('/') >= 0)) {
                try {
                    const tex = new BABYLON.Texture(col, self.scene, false, true);
                    mat.diffuseTexture = tex;
                    mat.diffuseColor = BABYLON.Color3.White();
                } catch (e) {
                    mat.diffuseColor = BABYLON.Color3.White();
                }
            } else {
                mat.diffuseColor = BABYLON.Color3.White();
            }
            return mat;
        }

        const parts = [];
        if (p.left && p.left.active !== false) {
            parts.push({
                id: 'left',
                geo: [tL, hL, pLeftD > 0 ? pLeftD : boxD],
                pos: [-boxW / 2 + tL / 2, yL, 0],
                pData: p.left
            });
        }
        if (p.right && p.right.active !== false) {
            parts.push({
                id: 'right',
                geo: [tR, hR, pRightD > 0 ? pRightD : boxD],
                pos: [boxW / 2 - tR / 2, yR, 0],
                pData: p.right
            });
        }
        if (p.back && p.back.active !== false) {
            parts.push({
                id: 'back',
                geo: [pBackW > 0 ? pBackW : (boxW - tL - tR), hBk, tB],
                pos: [0, yBk, -boxD / 2 + tB / 2],
                pData: p.back
            });
        }
        if (p.front && p.front.active !== false) {
            parts.push({
                id: 'front',
                geo: [pFrontW > 0 ? pFrontW : (boxW - tL - tR), hF, tF],
                pos: [0, yF, boxD / 2 - tF / 2],
                pData: p.front
            });
        }

        // اگر panels خالی بود، باکس پیش‌فرض چهار دیواره
        if (!parts.length) {
            parts.push({ id: 'left', geo: [1.6, H, D], pos: [-W / 2 + 0.8, 0, 0], pData: { color: '#FFFFFF' } });
            parts.push({ id: 'right', geo: [1.6, H, D], pos: [W / 2 - 0.8, 0, 0], pData: { color: '#FFFFFF' } });
            parts.push({ id: 'back', geo: [W - 3.2, H, 1.6], pos: [0, 0, -D / 2 + 0.8], pData: { color: '#FFFFFF' } });
            parts.push({ id: 'front', geo: [W - 3.2, H, 1.6], pos: [0, 0, D / 2 - 0.8], pData: { color: '#FFFFFF' } });
        }

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const gw = part.geo[0], gh = part.geo[1], gd = part.geo[2];
            const mesh = BABYLON.MeshBuilder.CreateBox('fb_' + id + '_' + part.id, {
                width: Math.max(0.5, gw), height: Math.max(0.5, gh), depth: Math.max(0.5, gd)
            }, this.scene);
            mesh.position.set(part.pos[0], part.pos[1], part.pos[2]);
            mesh.material = panelMat(part.pData, part.id);
            mesh.parent = group;
            mesh.isPickable = false;
            mesh.metadata = { isFacadeBox: true, side: part.id };

            // شلف‌های ساده روی دیواره اگر تعریف شده
            const shelves = part.pData && part.pData.shelves;
            if (shelves && shelves.enabled && shelves.list && shelves.list.length) {
                const isSide = (part.id === 'left' || part.id === 'right');
                for (let s = 0; s < shelves.list.length; s++) {
                    const sh = shelves.list[s];
                    if (!sh) continue;
                    const sT = parseFloat(sh.t) || 1.6;
                    const sD = parseFloat(sh.d) || 20;
                    const sW = parseFloat(sh.w) || 25;
                    const sY = -gh / 2 + (parseFloat(sh.posY) || (s + 1) * (gh / (shelves.list.length + 1)));
                    if (isSide) {
                        const shelf = BABYLON.MeshBuilder.CreateBox('fbSh_' + id + '_' + part.id + '_' + s, {
                            width: sW, height: sT, depth: sD
                        }, this.scene);
                        const sx = (part.id === 'left') ? (gw / 2 + sW / 2) : (-gw / 2 - sW / 2);
                        shelf.position.set(part.pos[0] + sx, part.pos[1] + sY, part.pos[2]);
                        shelf.material = panelMat(sh, 'shelf' + s);
                        shelf.parent = group;
                        shelf.isPickable = false;
                    }
                }
            }
        }
    },

    /**
     * کافه بار — معادل isCoffeeBar در view3d.js
     * پشت + چپ + راست + سقف + کف + پیشخوان جلو
     */
    _buildCoffeeBar: function (group, c, W, H, D, thick, id, doorMat, bodyMat) {
        const t = thick || 1.6;
        const defaultCol = c.doorColor || c.color || '#FFFFFF';
        const self = this;

        function getPartConfig(name) {
            if (c.coffeeBarParts && c.coffeeBarParts[name]) return c.coffeeBarParts[name];
            return { active: true, color: defaultCol, finish: 'matte' };
        }

        function partMat(conf, label) {
            const col = (conf && conf.color) ? conf.color : defaultCol;
            if (col && String(col).charAt(0) === '#') {
                return self._mat('cb_' + id + '_' + label, self._hexToColor3(col));
            }
            const mat = new BABYLON.StandardMaterial('cb_' + id + '_' + label, self.scene);
            mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
            if (col && typeof col === 'string' && (col.indexOf('http') >= 0 || col.indexOf('/') >= 0)) {
                try {
                    const tex = new BABYLON.Texture(col, self.scene, false, true);
                    mat.diffuseTexture = tex;
                    mat.diffuseColor = BABYLON.Color3.White();
                } catch (e) {
                    mat.diffuseColor = BABYLON.Color3.White();
                }
            } else {
                mat.diffuseColor = BABYLON.Color3.White();
            }
            return mat;
        }

        function addThermo(conf, maxW, maxH, x, y, z, rotY) {
            if (!conf || !conf.thermo || !conf.thermo.active) return;
            const count = parseInt(conf.thermo.count, 10) || 1;
            const tWidth = parseFloat(conf.thermo.width) || 4;
            const tDepth = parseFloat(conf.thermo.depth) || 2;
            const tHeight = parseFloat(conf.thermo.height) || maxH;
            const tMat = partMat({ color: conf.thermo.color || '#3b2314' }, 'thermo');
            const step = count > 1 ? (maxW - tWidth) / (count - 1) : 0;
            const startX = count > 1 ? -maxW / 2 + tWidth / 2 : 0;
            for (let i = 0; i < count; i++) {
                const m = BABYLON.MeshBuilder.CreateBox('cbTh_' + id + '_' + i, {
                    width: tWidth, height: tHeight, depth: tDepth
                }, self.scene);
                m.position.set(x + startX + i * step, y, z + tDepth / 2);
                if (rotY) m.rotation.y = rotY;
                m.material = tMat; m.parent = group; m.isPickable = false;
            }
        }

        const sideDepth = D - t;
        const topBottomW = W - 2 * t;
        const innerH = H - 2 * t;

        const backConf = getPartConfig('back');
        const leftConf = getPartConfig('left');
        const rightConf = getPartConfig('right');
        const topConf = getPartConfig('top');
        const bottomConf = getPartConfig('bottom');
        const frontConf = getPartConfig('front');

        // ۱. پشت
        if (backConf.active !== false) {
            const m = BABYLON.MeshBuilder.CreateBox('cbBack_' + id, {
                width: W, height: H, depth: t
            }, this.scene);
            m.position.set(0, 0, -D / 2 + t / 2);
            m.material = partMat(backConf, 'back');
            m.parent = group; m.isPickable = false;
            addThermo(backConf, W - 2 * t, innerH, 0, 0, -D / 2 + t, 0);
        }

        // ۲. چپ
        if (leftConf.active !== false) {
            const m = BABYLON.MeshBuilder.CreateBox('cbL_' + id, {
                width: t, height: H, depth: sideDepth
            }, this.scene);
            m.position.set(-W / 2 + t / 2, 0, t / 2);
            m.material = partMat(leftConf, 'left');
            m.parent = group; m.isPickable = false;
        }

        // ۳. راست
        if (rightConf.active !== false) {
            const m = BABYLON.MeshBuilder.CreateBox('cbR_' + id, {
                width: t, height: H, depth: sideDepth
            }, this.scene);
            m.position.set(W / 2 - t / 2, 0, t / 2);
            m.material = partMat(rightConf, 'right');
            m.parent = group; m.isPickable = false;
        }

        // ۴. سقف
        if (topConf.active !== false) {
            const m = BABYLON.MeshBuilder.CreateBox('cbTop_' + id, {
                width: topBottomW, height: t, depth: sideDepth
            }, this.scene);
            m.position.set(0, H / 2 - t / 2, t / 2);
            m.material = partMat(topConf, 'top');
            m.parent = group; m.isPickable = false;
        }

        // ۵. کف
        if (bottomConf.active !== false) {
            const m = BABYLON.MeshBuilder.CreateBox('cbBot_' + id, {
                width: topBottomW, height: t, depth: sideDepth
            }, this.scene);
            m.position.set(0, -H / 2 + t / 2, t / 2);
            m.material = partMat(bottomConf, 'bottom');
            m.parent = group; m.isPickable = false;
        }

        // ۶. پیشخوان جلو
        if (frontConf && frontConf.active !== false) {
            const m = BABYLON.MeshBuilder.CreateBox('cbFront_' + id, {
                width: topBottomW, height: innerH, depth: t
            }, this.scene);
            m.position.set(0, 0, D / 2 - t / 2);
            m.material = partMat(frontConf, 'front');
            m.parent = group; m.isPickable = false;
        }

        // درب اگر فعال
        if (c.showDoors && c.doors !== 0) {
            this._createDoorSystem(group, c, W, H, D, t, doorMat || bodyMat, id);
        }

        // طبقات
        if (c.shelves && c.shelves.length) {
            this._createShelves(group, Object.assign({}, c, { isCoffeeBar: false }), W, H, D, t, bodyMat, id + '_cb');
        }

        // تاج
        this._createCrown(group, c, W, H, D, t, id);
    },

    /**
     * تاج کابینت + لاین نوری توکار زیر تاج
     * شیار: عرض ۲cm | عمق ۰٫۸cm | فاصله لبه جلو تاج تا لبه جلو شیار = ۲cm
     * اجزا: فضای توخالی + پروفیل آلومینیوم + نوار LED emissive + دیفیوزر
     */
    _createCrown: function (group, c, W, H, D, thick, id) {
        if (c.isAppliance || c.isFridge) return;
        if (!c.crown || c.crown.enabled === false) return;

        const isWallCabinet = c.position === 'wall' || c.type === 'wall' ||
            (c.elevation && Number(c.elevation) > 100) || c.isFridgeWrap ||
            c.h > 180 || c.isUpperTier || c.isCoffeeBar;
        if (!isWallCabinet && !c.isCoffeeBar) return;

        const crownHeight = parseFloat(c.crown.height) || 5;
        const proj = parseFloat(c.crown.projection) || 0;
        const t = thick || 1.6;
        const sides = c.crown.sides || { front: true, back: false, left: true, right: true };
        const crownFinishKey = c.crown.finish || 'matte';
        const currentId = c.id || c.uId || id || '';
        const self = this;

        // فعال‌سازی LED — boolean / 1 / 'true' / 'on'
        const rawLed = c.crown.ledLight;
        const ledOn = (rawLed === true || rawLed === 1 || rawLed === 'true' || rawLed === 'on');

        // مشخصات شیار (cm)
        const grooveWidth = 2.0;   // ۲۰mm
        const grooveDepth = 0.8;   // ۸mm
        const frontOffset = 2.0;   // ۲۰mm تا لبه جلوی شیار
        const gap = 0.03;

        const topEdgeY = H / 2; // سطح زیرین تاج / بالای بدنه
        const topY = topEdgeY + crownHeight / 2;

        function resolveTex(val) {
            if (!val || typeof val !== 'string' || !window.allMaterials) return null;
            try {
                const types = Object.keys(window.allMaterials);
                for (let ti = 0; ti < types.length; ti++) {
                    const list = window.allMaterials[types[ti]];
                    if (!Array.isArray(list)) continue;
                    for (let i = 0; i < list.length; i++) {
                        const m = list[i];
                        if (!m) continue;
                        if (m.texture === val || m.code === val || m.name === val) {
                            if (m.texture) return m.texture;
                        }
                    }
                }
            } catch (e) {}
            return null;
        }

        function createCrownMat(pieceLabel, faceW, faceH) {
            const mat = new BABYLON.StandardMaterial(
                'crownMat_' + id + '_' + String(pieceLabel || 'x').replace(/\s+/g, '_'),
                self.scene
            );
            mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
            mat.specularPower = 16;
            try {
                if (typeof window.getKitchenFinishPreset === 'function') {
                    const preset = window.getKitchenFinishPreset(crownFinishKey) || {};
                    if (preset.roughness != null) {
                        mat.specularPower = Math.max(4, (1 - preset.roughness) * 64);
                    }
                }
            } catch (e) {}

            let textureUrl = null;
            let solidHex = null;
            try {
                if (window.isolatedDoorTextures) {
                    const keys = Object.keys(window.isolatedDoorTextures);
                    for (let i = 0; i < keys.length; i++) {
                        if (keys[i] === pieceLabel || keys[i].indexOf(pieceLabel) >= 0) {
                            textureUrl = window.isolatedDoorTextures[keys[i]];
                            break;
                        }
                    }
                    if (!textureUrl) {
                        for (let i = 0; i < keys.length; i++) {
                            if (keys[i].indexOf('تاج') >= 0 && keys[i].indexOf('U' + currentId) >= 0) {
                                textureUrl = window.isolatedDoorTextures[keys[i]];
                                break;
                            }
                        }
                    }
                }
            } catch (e) {}

            if (!textureUrl && c.crown && c.crown.color) {
                const val = c.crown.color;
                if (typeof val === 'string') {
                    if (val.charAt(0) === '#') solidHex = val;
                    else if (val.indexOf('data:image') === 0) textureUrl = val;
                    else textureUrl = resolveTex(val) || val;
                }
            }

            if (textureUrl) {
                try {
                    const tex = new BABYLON.Texture(
                        textureUrl, self.scene, false, true,
                        BABYLON.Texture.TRILINEAR_SAMPLINGMODE
                    );
                    tex.uScale = Math.max(0.25, (faceW || W) / 80);
                    tex.vScale = Math.max(0.25, (faceH || crownHeight) / 80);
                    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                    mat.diffuseTexture = tex;
                    mat.diffuseColor = BABYLON.Color3.White();
                } catch (e) {
                    mat.diffuseColor = self._hexToColor3(solidHex || '#ffffff');
                }
            } else {
                mat.diffuseColor = self._hexToColor3(solidHex || '#ffffff');
            }
            return mat;
        }

        function addPiece(name, w, h, d, x, y, z, label, fw, fh) {
            if (w < 0.05 || h < 0.05 || d < 0.05) return null;
            const mesh = BABYLON.MeshBuilder.CreateBox(name, {
                width: w, height: h, depth: d
            }, self.scene);
            mesh.position.set(x, y, z);
            mesh.material = createCrownMat(label, fw || w, fh || h);
            mesh.parent = group;
            mesh.isPickable = false;
            mesh.metadata = { isCrown: true, pieceLabel: label };
            return mesh;
        }

        // لبه جلوی تاج (بیرونی‌ترین سطح)
        const crownFrontFaceZ = (D / 2) + proj + t;
        const crownFrontCenterZ = (D / 2) + proj + t / 2;

        // مختصات شیار از لبه جلو:
        // [frontFace - frontOffset - grooveWidth  …  frontFace - frontOffset]
        const grooveFrontZ = crownFrontFaceZ - frontOffset;
        const grooveBackZ = grooveFrontZ - grooveWidth;
        const grooveCenterZ = (grooveFrontZ + grooveBackZ) / 2;

        // عمق افقی زیر تاج که شیار روی آن سوار است
        // از لبه جلو تا کمی بعد از شیار
        const soffitBackZ = grooveBackZ - 0.5;
        const soffitDepth = crownFrontFaceZ - soffitBackZ; // ≈ frontOffset + grooveWidth + 0.5

        // ─── تاج جلو ───
        if (sides.front !== false && sides.front !== 0) {
            const label = 'تاج جلو U' + currentId;

            if (ledOn) {
                // ۱) بدنه عمودی تاج — کامل، بدون برش (شیار روی زیرسازی افقی است)
                addPiece('cab_' + id + '_crF', W, crownHeight, t,
                    0, topY, crownFrontCenterZ, label, W, crownHeight);

                // ۲) زیرسازی افقی (soffit) زیر تاج — با حفره شیار
                //    سطح زیر = topEdgeY ؛ ضخامت = grooveDepth
                //    سه تکه: لبه جلو | خالی (شیار) | لبه عقب

                // لبه جلو: از frontFace تا grooveFront (عرض frontOffset)
                const lipF = frontOffset - gap;
                if (lipF > 0.15) {
                    addPiece('cab_' + id + '_crSoftF', W, grooveDepth, lipF,
                        0, topEdgeY + grooveDepth / 2,
                        crownFrontFaceZ - lipF / 2,
                        label, W, grooveDepth);
                }

                // لبه عقب: از grooveBack تا soffitBack
                const lipB = (grooveBackZ - gap) - soffitBackZ;
                if (lipB > 0.15) {
                    addPiece('cab_' + id + '_crSoftB', W, grooveDepth, lipB,
                        0, topEdgeY + grooveDepth / 2,
                        soffitBackZ + lipB / 2,
                        label, W, grooveDepth);
                }

                // سقف شیار (بالای فضای خالی، زیر بدنه تاج)
                // فقط در محدوده Z شیار — ضخامت نازک تا با بدنه تداخل نکند
                addPiece('cab_' + id + '_crSoftRoof', W, 0.12, grooveWidth - gap * 2,
                    0, topEdgeY + grooveDepth - 0.06,
                    grooveCenterZ,
                    label, W, 0.12);

                // فضای [grooveBack+gap … grooveFront-gap] × [topEdgeY … topEdgeY+grooveDepth-0.12]
                // کاملاً توخالی است → لاین اینجا نصب می‌شود
            } else {
                addPiece('cab_' + id + '_crF', W, crownHeight, t,
                    0, topY, crownFrontCenterZ, label, W, crownHeight);
            }
        }

        // تاج عقب / چپ / راست
        if (sides.back) {
            addPiece('cab_' + id + '_crB', W, crownHeight, t,
                0, topY, -D / 2 - t / 2,
                'تاج عقب U' + currentId, W, crownHeight);
        }
        if (sides.left) {
            const extraFront = (sides.front !== false) ? (t + proj) : 0;
            const totalDepth = D + extraFront + (sides.back ? t : 0);
            addPiece('cab_' + id + '_crL', t, crownHeight, totalDepth,
                -W / 2 + t / 2, topY, proj / 2,
                'تاج چپ U' + currentId, totalDepth, crownHeight);
        }
        if (sides.right) {
            const extraFront = (sides.front !== false) ? (t + proj) : 0;
            const totalDepth = D + extraFront + (sides.back ? t : 0);
            addPiece('cab_' + id + '_crR', t, crownHeight, totalDepth,
                W / 2 - t / 2, topY, proj / 2,
                'تاج راست U' + currentId, totalDepth, crownHeight);
        }

        // زیر تاج بیرون‌زده (projection) — خارج از محدوده شیار
        if (proj > 0 && sides.front !== false) {
            const bottomWidth = W - (sides.left ? t : 0) - (sides.right ? t : 0);
            if (ledOn) {
                // فقط قسمت جلوتر از شروع شیار (روی projection)
                // projection از D/2 تا D/2+proj ؛ شیار نزدیک frontFace است
                const botDepth = Math.max(0.2, proj - 0.1);
                if (botDepth > 0.2) {
                    addPiece('cab_' + id + '_crBot', Math.max(1, bottomWidth), 1.6, botDepth,
                        0, topEdgeY + 0.8, D / 2 + botDepth / 2,
                        'زیر تاج U' + currentId, bottomWidth, 1.6);
                }
            } else {
                const bottomDepth = proj + t;
                addPiece('cab_' + id + '_crBot', Math.max(1, bottomWidth), 1.6, bottomDepth,
                    0, topEdgeY + 0.8, D / 2 + proj / 2,
                    'زیر تاج U' + currentId, bottomWidth, 1.6);
            }
        }

        // قید اتصال
        const supportThick = 1.6;
        const supportWidth = 5.0;
        if (sides.front !== false) {
            const sw = W - (sides.left ? t : 0) - (sides.right ? t : 0);
            addPiece('cab_' + id + '_crSupF', Math.max(1, sw), supportThick, supportWidth,
                0, topEdgeY + supportThick / 2, D / 2 - supportWidth / 2,
                'قید اتصال تاج جلو U' + currentId, sw, supportThick);
        }
        if (sides.left) {
            const sd = D - ((sides.front !== false) ? supportWidth : 0);
            const zPos = (sides.front !== false) ? (-supportWidth / 2) : 0;
            addPiece('cab_' + id + '_crSupL', supportWidth, supportThick, Math.max(1, sd),
                -W / 2 + t + supportWidth / 2, topEdgeY + supportThick / 2, zPos,
                'قید اتصال تاج چپ U' + currentId, sd, supportThick);
        }
        if (sides.right) {
            const sd = D - ((sides.front !== false) ? supportWidth : 0);
            const zPos = (sides.front !== false) ? (-supportWidth / 2) : 0;
            addPiece('cab_' + id + '_crSupR', supportWidth, supportThick, Math.max(1, sd),
                W / 2 - t - supportWidth / 2, topEdgeY + supportThick / 2, zPos,
                'قید اتصال تاج راست U' + currentId, sd, supportThick);
        }

        // ════════════════════════════════════════════════
        // لاین نوری داخل شیار توخالی — فقط جلو
        // ════════════════════════════════════════════════
        if (ledOn && sides.front !== false && sides.front !== 0) {
            const endGap = 0.6;
            const ledLength = Math.max(5, W - (sides.left ? t : 0) - (sides.right ? t : 0) - endGap * 2);

            // متریال‌ها
            const alumMat = new BABYLON.StandardMaterial('crownAlum_' + id, self.scene);
            alumMat.diffuseColor = new BABYLON.Color3(0.70, 0.72, 0.74);
            alumMat.specularColor = new BABYLON.Color3(0.55, 0.55, 0.55);
            alumMat.specularPower = 72;

            const ledStripMat = new BABYLON.StandardMaterial('crownLedStrip_' + id, self.scene);
            ledStripMat.diffuseColor = new BABYLON.Color3(1.0, 0.92, 0.78);
            ledStripMat.emissiveColor = new BABYLON.Color3(1.0, 0.90, 0.72);
            ledStripMat.specularColor = BABYLON.Color3.Black();
            ledStripMat.disableLighting = true;

            const diffMat = new BABYLON.StandardMaterial('crownDiff_' + id, self.scene);
            diffMat.diffuseColor = new BABYLON.Color3(1.0, 0.97, 0.90);
            diffMat.emissiveColor = new BABYLON.Color3(0.65, 0.58, 0.48);
            diffMat.specularColor = BABYLON.Color3.Black();
            diffMat.alpha = 0.88;
            try {
                diffMat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
                diffMat.zOffset = 2;
            } catch (e) {}

            // فضای داخلی شیار (با فاصله از لبه‌ها)
            const innerW = grooveWidth - gap * 2; // عمق در محور Z
            const innerH = grooveDepth - gap * 2;
            const gZ = grooveCenterZ;
            const baseY = topEdgeY + gap;

            // دیواره آلومینیوم جلو
            const wallT = 0.08;
            const wallF = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_crGWallF', {
                width: ledLength + 0.15, height: innerH, depth: wallT
            }, self.scene);
            wallF.position.set(0, baseY + innerH / 2, grooveFrontZ - gap - wallT / 2);
            wallF.material = alumMat; wallF.parent = group; wallF.isPickable = false;
            wallF.metadata = { isCrownLed: true };

            // دیواره آلومینیوم عقب
            const wallB = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_crGWallB', {
                width: ledLength + 0.15, height: innerH, depth: wallT
            }, self.scene);
            wallB.position.set(0, baseY + innerH / 2, grooveBackZ + gap + wallT / 2);
            wallB.material = alumMat; wallB.parent = group; wallB.isPickable = false;
            wallB.metadata = { isCrownLed: true };

            // پروفیل U کف (بالای دیفیوزر)
            const profileH = 0.1;
            const profileD = Math.max(0.4, innerW - wallT * 2 - 0.1);
            const profile = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_crProf', {
                width: ledLength, height: profileH, depth: profileD
            }, self.scene);
            profile.position.set(0, baseY + profileH / 2 + 0.02, gZ);
            profile.material = alumMat; profile.parent = group; profile.isPickable = false;
            profile.metadata = { isCrownLed: true };

            // نوار LED emissive — داخل شیار، بالای پروفیل
            const stripH = 0.18;
            const stripD = Math.max(0.35, profileD - 0.25);
            const strip = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_crLedStrip', {
                width: ledLength - 0.4, height: stripH, depth: stripD
            }, self.scene);
            strip.position.set(0, baseY + profileH + stripH / 2 + 0.05, gZ);
            strip.material = ledStripMat; strip.parent = group; strip.isPickable = false;
            strip.metadata = { isCrownLed: true };

            // دیفیوزر — دهانه زیر شیار (از پایین دیده می‌شود)
            const diffuser = BABYLON.MeshBuilder.CreateBox('cab_' + id + '_crDiff', {
                width: ledLength, height: 0.08, depth: Math.max(0.4, innerW - 0.12)
            }, self.scene);
            // دقیقاً روی سطح زیر تاج / کمی داخل
            diffuser.position.set(0, topEdgeY + 0.04, gZ);
            diffuser.material = diffMat; diffuser.parent = group; diffuser.isPickable = false;
            diffuser.metadata = { isCrownLed: true };

            // یک PointLight ملایم رو به پایین (نور واقعی روی درب)
            const cfg = (typeof Kitchen3D !== 'undefined' && Kitchen3D.config) ? Kitchen3D.config : (self.config || {});
            const fillI = Math.max(0.4, ((cfg.crownFillIntensity != null) ? parseFloat(cfg.crownFillIntensity) : 90) / 100);
            const fill = new BABYLON.PointLight(
                'cab_' + id + '_crFill',
                new BABYLON.Vector3(0, topEdgeY - 2.5, gZ),
                self.scene
            );
            fill.diffuse = new BABYLON.Color3(1.0, 0.93, 0.82);
            fill.intensity = fillI;
            fill.range = 55;
            fill.parent = group;
            fill.metadata = { isCrownLedLight: true };
        }
    },


    /**
     * سیستم پاخور + تکسچر — عین createKickboardMaterial / پیش‌نمایش پنل
     * هر رشتهٔ غیر # در kickboard.color به‌عنوان تکسچر لود می‌شود (مثل Three)
     */
    _createKickboard: function (group, c, W, H, D, thick, id) {
        if (c.isAppliance || c.isFridge || c.isFridgeWrap || c.isHoodWrap || c.isDishRack) return;
        const isFloorUnit = (c.type === 'floor' || c.type === 'waterproof' ||
            ((c.y || 0) < 60 || (c.elevation || 0) < 50));
        if (!c.kickboard || !c.kickboard.enabled || !isFloorUnit) return;

        const kbH = parseFloat(c.kickboard.height) || 14;
        let recess = 0;
        if (c.kickboard.recess !== undefined && c.kickboard.recess !== null && c.kickboard.recess !== '') {
            const r = parseFloat(c.kickboard.recess);
            if (Number.isFinite(r)) recess = r;
        }
        const sides = c.kickboard.sides || { front: true, back: false, left: false, right: false };
        const showFront = (sides.front !== false && sides.front !== 0);
        const showBack = !!sides.back;
        const showLeft = !!sides.left;
        const showRight = !!sides.right;

        const kickFinishKey = (c.kickboard && c.kickboard.finish) ? c.kickboard.finish : 'matte';
        const yPos = -H / 2 - kbH / 2;
        const sideInset = thick;
        const t = thick || 1.6;
        const currentId = c.id || c.uId || id || '';
        const self = this;

        /** پیدا کردن URL تکسچر از allMaterials با code / name / texture */
        function resolveMaterialTexture(val) {
            if (!val || typeof val !== 'string') return null;
            if (!window.allMaterials) return null;
            try {
                const types = Object.keys(window.allMaterials);
                for (let ti = 0; ti < types.length; ti++) {
                    const list = window.allMaterials[types[ti]];
                    if (!Array.isArray(list)) continue;
                    for (let i = 0; i < list.length; i++) {
                        const m = list[i];
                        if (!m) continue;
                        if (m.texture === val || m.code === val || m.name === val || m.colorName === val) {
                            if (m.texture) return m.texture;
                        }
                    }
                }
            } catch (e) {}
            return null;
        }

        /**
         * متریال پاخور — منطق عین Three:
         * isolated → اگر color با # شروع شود رنگ جامد → وگرنه لود تکسچر
         */
        function createKickMat(pieceLabel, faceW, faceH) {
            const matName = 'kbMat_' + id + '_' + (pieceLabel || 'x').replace(/\s+/g, '_');
            const mat = new BABYLON.StandardMaterial(matName, self.scene);
            mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
            mat.specularPower = 16;

            try {
                if (typeof window.getKitchenFinishPreset === 'function') {
                    const preset = window.getKitchenFinishPreset(kickFinishKey) || {};
                    if (preset.roughness != null) {
                        mat.specularPower = Math.max(4, (1 - preset.roughness) * 64);
                    }
                    if (preset.metalness != null && preset.metalness > 0.2) {
                        mat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
                    }
                }
            } catch (e) {}

            let textureUrl = null;
            let solidHex = null;

            // ۱) کات‌مستر isolatedDoorTextures
            try {
                if (window.isolatedDoorTextures) {
                    const keys = Object.keys(window.isolatedDoorTextures);
                    for (let i = 0; i < keys.length; i++) {
                        if (keys[i] === pieceLabel || keys[i].indexOf(pieceLabel) >= 0) {
                            textureUrl = window.isolatedDoorTextures[keys[i]];
                            break;
                        }
                    }
                    if (!textureUrl) {
                        for (let i = 0; i < keys.length; i++) {
                            if (keys[i].indexOf('پاخور') >= 0 && String(keys[i]).indexOf('U' + currentId) >= 0) {
                                textureUrl = window.isolatedDoorTextures[keys[i]];
                                break;
                            }
                        }
                    }
                }
            } catch (e) {}

            // ۲) kickboard.color — عین Three و پیش‌نمایش پنل
            if (!textureUrl && c.kickboard && c.kickboard.color) {
                const val = c.kickboard.color;
                if (typeof val === 'string') {
                    if (val.charAt(0) === '#') {
                        solidHex = val;
                    } else if (val.indexOf('data:image') === 0) {
                        textureUrl = val;
                    } else {
                        // اول خود مقدار را به‌عنوان URL تکسچر بگیر (مثل Three)
                        // اگر در allMaterials باشد texture واقعی‌اش را بردار
                        const resolved = resolveMaterialTexture(val);
                        textureUrl = resolved || val;
                    }
                }
            }

            // ۳) اگر هنوز فقط نام رنگ داریم
            if (!textureUrl && !solidHex && c.kickboard) {
                const tryKeys = [c.kickboard.colorName, c.kickboard.color];
                for (let k = 0; k < tryKeys.length; k++) {
                    if (!tryKeys[k]) continue;
                    const resolved = resolveMaterialTexture(tryKeys[k]);
                    if (resolved) {
                        textureUrl = resolved;
                        break;
                    }
                }
            }

            function applySolid(hex) {
                mat.diffuseTexture = null;
                mat.diffuseColor = self._hexToColor3(hex || '#8B4513');
            }

            if (textureUrl) {
                try {
                    // noMipmap=false, invertY=true — سازگار با تصاویر وب
                    const tex = new BABYLON.Texture(
                        textureUrl,
                        self.scene,
                        false,
                        true,
                        BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
                        function () {
                            // onLoad
                            mat.diffuseTexture = tex;
                            mat.diffuseColor = BABYLON.Color3.White();
                            mat.markAsDirty(BABYLON.Material.TextureDirtyFlag);
                        },
                        function () {
                            // onError → رنگ ساده
                            applySolid(solidHex || '#8B4513');
                        }
                    );
                    tex.uScale = Math.max(0.25, (faceW || W || 60) / 80);
                    tex.vScale = Math.max(0.25, (faceH || kbH || 14) / 80);
                    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                    // فوری هم وصل کن تا قبل از onLoad دیده شود
                    mat.diffuseTexture = tex;
                    mat.diffuseColor = BABYLON.Color3.White();
                } catch (e) {
                    applySolid(solidHex || '#8B4513');
                }
            } else {
                applySolid(solidHex || '#8B4513');
            }
            return mat;
        }

        function addKb(name, w, h, d, x, y, z, label, faceW, faceH) {
            const kbMat = createKickMat(label, faceW, faceH);
            const kb = BABYLON.MeshBuilder.CreateBox(name, {
                width: w, height: h, depth: d
            }, self.scene);
            kb.position.set(x, y, z);
            kb.material = kbMat;
            kb.parent = group;
            kb.isPickable = false;
            kb.metadata = { isKickboard: true, label: label };
            return kb;
        }

        if (showFront) {
            const frontW = Math.max(1, W - (showLeft ? sideInset : 0) - (showRight ? sideInset : 0));
            const xOff = ((showLeft ? sideInset / 2 : 0) - (showRight ? sideInset / 2 : 0));
            addKb('cab_' + id + '_kbF', frontW, kbH, t,
                xOff, yPos, D / 2 - recess - t / 2,
                'پاخور جلو U' + currentId, frontW, kbH);
        }
        if (showBack) {
            const backW = Math.max(1, W - (showLeft ? sideInset : 0) - (showRight ? sideInset : 0));
            const xOff = ((showLeft ? sideInset / 2 : 0) - (showRight ? sideInset / 2 : 0));
            addKb('cab_' + id + '_kbB', backW, kbH, t,
                xOff, yPos, -D / 2 + t / 2,
                'پاخور عقب U' + currentId, backW, kbH);
        }
        if (showLeft) {
            const sideDepth = Math.max(1, D - recess);
            addKb('cab_' + id + '_kbL', t, kbH, sideDepth,
                -W / 2 + t / 2, yPos, -recess / 2,
                'پاخور چپ U' + currentId, sideDepth, kbH);
        }
        if (showRight) {
            const sideDepth = Math.max(1, D - recess);
            addKb('cab_' + id + '_kbR', t, kbH, sideDepth,
                W / 2 - t / 2, yPos, -recess / 2,
                'پاخور راست U' + currentId, sideDepth, kbH);
        }
    },

    /** تبدیل #RRGGBB به Color3 */

    // =====================================================================
    // سیستم صفحه کابینت + سینک + گاز — معادل createSingleCountertopMesh
    // =====================================================================

    _clearCountertops: function () {
        if (!this.scene) return;
        const toDispose = [];
        this.scene.meshes.forEach(function (m) {
            if (m.metadata && m.metadata.isCountertop) toDispose.push(m);
        });
        if (this.scene.transformNodes) {
            this.scene.transformNodes.forEach(function (n) {
                if (n.metadata && n.metadata.isCountertopRoot) toDispose.push(n);
            });
        }
        for (let i = 0; i < toDispose.length; i++) {
            try {
                if (toDispose[i].dispose) toDispose[i].dispose();
            } catch (e) {}
        }
    },

    /**
     * رندر همه صفحات از allCountertops (+ صفحات روی کابینت)
     */
    _renderAllCountertops: function () {
        if (!this.scene) return;
        this._clearCountertops();

        if (typeof allCountertops !== 'undefined' && Array.isArray(allCountertops)) {
            for (let i = 0; i < allCountertops.length; i++) {
                const ct = allCountertops[i];
                if (ct && ct.enabled) {
                    this._createCountertopMesh(ct, i);
                }
            }
        }

        if (typeof cabinets !== 'undefined' && Array.isArray(cabinets)) {
            for (let i = 0; i < cabinets.length; i++) {
                const c = cabinets[i];
                if (c && c.countertop && c.countertop.enabled) {
                    const s = Object.assign({}, c.countertop);
                    if (s.x == null) s.x = c.x || 0;
                    if (s.y == null) s.y = c.y || 0;
                    this._createCountertopMesh(s, 'cab' + (c.id || i));
                }
            }
        }
    },

    /**
     * یک صفحه — ضخامت، تکسچر، سینک، گاز
     */
    _createCountertopMesh: function (settings, idx) {
        if (!settings || !this.scene) return;

        const thickness = parseFloat(settings.thickness) || 3.2;
        const edgeOpts = {
            edgeBevel: settings.edgeBevel !== false,
            edgeRadius: (settings.edgeRadius != null && isFinite(parseFloat(settings.edgeRadius)))
                ? parseFloat(settings.edgeRadius)
                : Math.min(0.45, Math.max(0.28, thickness * 0.12)),
            edgeBevelThickness: (settings.edgeBevelThickness != null)
                ? parseFloat(settings.edgeBevelThickness)
                : Math.min(0.4, Math.max(0.25, thickness * 0.1))
        };
        const totalLength = parseFloat(settings.length) || 180;
        const totalWidth = parseFloat(settings.width) || 60;
        const heightY = parseFloat(settings.height) || 90;
        const posX = parseFloat(settings.x) || 0;
        const posZ = parseFloat(settings.y) || 0;
        const rotationDeg = parseFloat(settings.rotation) || 0;
        const uid = 'ct_' + idx;
        const scene = this.scene;

        const root = new BABYLON.TransformNode('ctRoot_' + uid, scene);
        root.metadata = { isCountertopRoot: true };
        root.position = new BABYLON.Vector3(
            posX + totalLength / 2,
            heightY,
            posZ + totalWidth / 2
        );
        root.rotation.y = -(rotationDeg * Math.PI / 180);

        // —— متریال رویه ——
        const finishKey = (settings.finish || 'matte').toString().toLowerCase();
        let specPower = 24;
        let specCol = new BABYLON.Color3(0.12, 0.12, 0.12);
        try {
            if (typeof window.getKitchenFinishPreset === 'function') {
                const preset = window.getKitchenFinishPreset(finishKey) || {};
                if (preset.roughness != null) {
                    specPower = Math.max(4, (1 - preset.roughness) * 64);
                }
            }
            if (finishKey.indexOf('gloss') >= 0 || finishKey === 'highgloss') {
                specPower = 72;
                specCol = new BABYLON.Color3(0.4, 0.4, 0.4);
            }
        } catch (e) {}

        const topMat = new BABYLON.StandardMaterial('ctTop_' + uid, scene);
        topMat.specularColor = specCol;
        topMat.specularPower = specPower;

        let cleanLabel = '';
        if (typeof settings.countertopIndex !== 'undefined') {
            cleanLabel = 'صفحه کابینت ' + (settings.countertopIndex + 1) + ' (هوشمند)';
        } else {
            cleanLabel = String(settings.label || settings.name || '').replace('📌', '').trim();
        }

        let textureUrl = null;
        let solidHex = null;
        try {
            if (cleanLabel && window.isolatedDoorTextures && window.isolatedDoorTextures[cleanLabel]) {
                textureUrl = window.isolatedDoorTextures[cleanLabel];
            }
        } catch (e) {}

        if (!textureUrl) {
            const colorValue = settings.color || '#ffffff';
            if (typeof colorValue === 'string') {
                if (colorValue.charAt(0) === '#') {
                    solidHex = colorValue;
                } else if (
                    colorValue.indexOf('http') === 0 ||
                    colorValue.indexOf('data:image') === 0 ||
                    colorValue.indexOf('assets/') >= 0 ||
                    colorValue.indexOf('/') >= 0
                ) {
                    textureUrl = colorValue;
                } else {
                    try {
                        if (window.allMaterials) {
                            const types = Object.keys(window.allMaterials);
                            for (let ti = 0; ti < types.length && !textureUrl && !solidHex; ti++) {
                                const list = window.allMaterials[types[ti]];
                                if (!Array.isArray(list)) continue;
                                for (let j = 0; j < list.length; j++) {
                                    const m = list[j];
                                    if (!m) continue;
                                    if (m.texture === colorValue || m.code === colorValue || m.name === colorValue) {
                                        if (m.texture) textureUrl = m.texture;
                                        else if (m.color) solidHex = m.color;
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (e) {}
                    if (!textureUrl && !solidHex) solidHex = '#f2efe9';
                }
            }
        }

        if (textureUrl) {
            try {
                const tex = new BABYLON.Texture(
                    textureUrl, scene, false, true,
                    BABYLON.Texture.TRILINEAR_SAMPLINGMODE
                );
                tex.uScale = 1;
                tex.vScale = 1;
                tex.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                tex.wAng = Math.PI / 2;
                topMat.diffuseTexture = tex;
                topMat.diffuseColor = BABYLON.Color3.White();
            } catch (e) {
                topMat.diffuseColor = this._hexToColor3(solidHex || '#f2efe9');
            }
        } else {
            topMat.diffuseColor = this._hexToColor3(solidHex || '#f2efe9');
        }

        // حفره‌های برش (سینک + گاز) — مختصات محلی نسبت به مرکز صفحه
        const holes = [];
        if (settings.sink && settings.sink.enabled) {
            const sW = parseFloat(settings.sink.width) || 80;
            const sD = parseFloat(settings.sink.depth) || 50;
            const sX = parseFloat(settings.sink.x) || 0;
            const sY = parseFloat(settings.sink.y) || 0;
            holes.push({
                // مرکز حفره در فضای محلی صفحه (مبدأ = مرکز صفحه)
                cx: -totalLength / 2 + sX + sW / 2,
                cz: -totalWidth / 2 + sY + sD / 2,
                w: sW,
                d: sD,
                kind: 'sink'
            });
        }
        if (settings.gas && settings.gas.enabled) {
            const gW = parseFloat(settings.gas.width) || 60;
            const gD = parseFloat(settings.gas.depth) || 50;
            const gX = parseFloat(settings.gas.x) || 0;
            const gY = parseFloat(settings.gas.y) || 0;
            holes.push({
                cx: -totalLength / 2 + gX + gW / 2,
                cz: -totalWidth / 2 + gY + gD / 2,
                w: gW,
                d: gD,
                kind: 'gas'
            });
        }

        // ساخت اسلب با برش توخالی (بدون نوار edge رنگی)
        this._buildCountertopSlabWithHoles(
            root, totalLength, totalWidth, thickness, topMat, holes, uid, edgeOpts
        );

        if (settings.gas && settings.gas.enabled) {
            this._buildCountertopGas(root, settings, totalLength, totalWidth, thickness, uid);
        }
        if (settings.sink && settings.sink.enabled) {
            this._buildCountertopSink(root, settings, totalLength, totalWidth, thickness, uid);
        }

        return root;
    },

    /**
     * اسلب صفحه با حفره سینک/گاز — بدون لبه رنگی جدا
     * اولویت: CSG.subtract → در صورت نبود، تکه‌تکه کردن جعبه دور حفره
     */
    /**
     * اسلب صفحه با حفره سینک/گاز — بدون لبه رنگی
     * صفحه به سلول‌های مستطیلی تقسیم می‌شود و سلول‌های داخل حفره حذف می‌شوند
     */
    _buildCountertopSlabWithHoles: function (root, totalLength, totalWidth, thickness, topMat, holes, uid, edgeOpts) {
        const scene = this.scene;

        function mark(m) {
            m.isPickable = false;
            m.metadata = { isCountertop: true };
            m.parent = root;
            m.material = topMat;
            return m;
        }

        if (!holes || !holes.length) {
            const slab = this._createCountertopSlabRounded(
                'ctSlab_' + uid, totalLength, totalWidth, thickness, edgeOpts, scene
            );
            if (slab) mark(slab);
            else {
                const box = BABYLON.MeshBuilder.CreateBox('ctSlab_' + uid, {
                    width: totalLength, height: thickness, depth: totalWidth
                }, scene);
                box.position.set(0, thickness / 2, 0);
                mark(box);
            }
            return;
        }

        // خطوط تقسیم روی X و Z از لبه‌های صفحه + لبه‌های هر حفره
        const xs = [-totalLength / 2, totalLength / 2];
        const zs = [-totalWidth / 2, totalWidth / 2];
        for (let i = 0; i < holes.length; i++) {
            const h = holes[i];
            const pad = 0.08; // کمی بزرگ‌تر تا تداخل با سینک/گاز نماند
            xs.push(h.cx - h.w / 2 - pad);
            xs.push(h.cx + h.w / 2 + pad);
            zs.push(h.cz - h.d / 2 - pad);
            zs.push(h.cz + h.d / 2 + pad);
        }
        xs.sort(function (a, b) { return a - b; });
        zs.sort(function (a, b) { return a - b; });

        function uniq(arr) {
            const out = [];
            for (let i = 0; i < arr.length; i++) {
                if (i === 0 || Math.abs(arr[i] - arr[i - 1]) > 0.02) out.push(arr[i]);
            }
            return out;
        }
        const ux = uniq(xs);
        const uz = uniq(zs);

        function isInsideHole(cx, cz) {
            for (let i = 0; i < holes.length; i++) {
                const h = holes[i];
                const pad = 0.08;
                if (cx >= h.cx - h.w / 2 - pad && cx <= h.cx + h.w / 2 + pad &&
                    cz >= h.cz - h.d / 2 - pad && cz <= h.cz + h.d / 2 + pad) {
                    return true;
                }
            }
            return false;
        }

        let part = 0;
        for (let ix = 0; ix < ux.length - 1; ix++) {
            for (let iz = 0; iz < uz.length - 1; iz++) {
                const x0 = ux[ix];
                const x1 = ux[ix + 1];
                const z0 = uz[iz];
                const z1 = uz[iz + 1];
                const cw = x1 - x0;
                const cd = z1 - z0;
                if (cw < 0.05 || cd < 0.05) continue;
                const cx = (x0 + x1) / 2;
                const cz = (z0 + z1) / 2;
                if (isInsideHole(cx, cz)) continue;

                const cell = BABYLON.MeshBuilder.CreateBox('ctCell_' + uid + '_' + (part++), {
                    width: cw,
                    height: thickness,
                    depth: cd
                }, scene);
                cell.position.set(cx, thickness / 2, cz);
                mark(cell);
            }
        }

        // با حفره: باکس ساده (بدون قطعهٔ اضافه روی لبه)
    },


    /**
     * اسلب صفحه با لبه جلو/عقب کمی گرد (بالا و پایین) — بدون قطعهٔ اضافه.
     * ابعاد بیرونی همان length × width × thickness می‌ماند.
     * مقطع YZ یک مستطیل با گوشه‌های گرد است و در راستای طول (X) اکسترود می‌شود.
     */
    _createCountertopSlabRounded: function (name, length, width, thickness, edgeOpts, scene) {
        edgeOpts = edgeOpts || {};
        if (edgeOpts.edgeBevel === false) return null;
        let r = (edgeOpts.edgeRadius != null && isFinite(Number(edgeOpts.edgeRadius)))
            ? Number(edgeOpts.edgeRadius)
            : Math.min(0.45, Math.max(0.28, thickness * 0.12));
        r = Math.min(r, thickness * 0.4, width * 0.15);
        if (r < 0.15 || length < 2 || width < 2 || thickness < 0.5) return null;

        const hw = width / 2;
        const segs = 5;
        // شکل مقطع در صفحهٔ XY (x → محور عمق Z، y → ضخامت Y)
        const shape = [];
        function arc(cx, cy, a0, a1) {
            for (let i = 0; i <= segs; i++) {
                const t = i / segs;
                const a = a0 + (a1 - a0) * t;
                shape.push(new BABYLON.Vector3(
                    cx + r * Math.cos(a),
                    cy + r * Math.sin(a),
                    0
                ));
            }
        }
        // گوشه‌ها: عقب-پایین، جلو-پایین، جلو-بالا، عقب-بالا (پادساعت‌گرد)
        arc(-hw + r, r, Math.PI, Math.PI * 1.5);
        arc(hw - r, r, Math.PI * 1.5, Math.PI * 2);
        arc(hw - r, thickness - r, 0, Math.PI * 0.5);
        arc(-hw + r, thickness - r, Math.PI * 0.5, Math.PI);

        const path = [
            new BABYLON.Vector3(-length / 2, 0, 0),
            new BABYLON.Vector3(length / 2, 0, 0)
        ];

        try {
            const mesh = BABYLON.MeshBuilder.ExtrudeShape(name, {
                shape: shape,
                path: path,
                cap: BABYLON.Mesh.CAP_ALL,
                updatable: false,
                sideOrientation: BABYLON.Mesh.FRONTSIDE,
                closeShape: true
            }, scene);
            // ExtrudeShape: مسیر روی X، مقطع در Y/عمود — محور x مقطع را به Z ببر
            // پیش‌فرض Babylon: shape.x و shape.y در صفحه عمود بر مسیر می‌نشینند
            // مسیر موازی X → shape.x ≈ Z جهان، shape.y ≈ Y جهان  (معمولاً درست است)
            mesh.position.set(0, 0, 0);
            return mesh;
        } catch (e) {
            console.warn('[BJS] rounded slab failed', e);
            return null;
        }
    },


    /**
     * گاز روی صفحه — عین بخش گاز در createSingleCountertopMesh (view3d.js)
     */
    /**
     * گاز صفحه‌ای شیشه‌ای مشکی — مثل عکس:
     * صفحه مشکی براق، ۵ شعله با پایه فلزی ضربدری، دکمه‌ها جلو
     */
    _buildCountertopGas: function (parent, settings, totalLength, totalWidth, thickness, uid) {
        const gW = parseFloat(settings.gas.width) || 70;
        const gD = parseFloat(settings.gas.depth) || 52;
        const gTopH = 1.2;
        const gUnderH = 4.5;
        const gMatType = settings.gas.materialType || 'glass';
        const bCount = parseInt(settings.gas.burnerType, 10) || 5;
        const scene = this.scene;

        const gasRoot = new BABYLON.TransformNode('gas_' + uid, scene);
        gasRoot.parent = parent;

        const isGlass = (gMatType === 'glass' || gMatType === 'black' || !gMatType);

        // صفحه شیشه‌ای مشکی براق
        const glassMat = new BABYLON.StandardMaterial('gasGlass_' + uid, scene);
        glassMat.diffuseColor = isGlass
            ? new BABYLON.Color3(0.04, 0.04, 0.05)
            : new BABYLON.Color3(0.55, 0.56, 0.58);
        glassMat.specularColor = isGlass
            ? new BABYLON.Color3(0.95, 0.95, 0.98)
            : new BABYLON.Color3(0.5, 0.5, 0.5);
        glassMat.specularPower = isGlass ? 128 : 40;
        if (isGlass) {
            glassMat.emissiveColor = new BABYLON.Color3(0.01, 0.01, 0.015);
        }

        // فلز نقره‌ای شعله‌ها و پایه‌ها
        const metalMat = new BABYLON.StandardMaterial('gasMetal_' + uid, scene);
        metalMat.diffuseColor = new BABYLON.Color3(0.62, 0.64, 0.67);
        metalMat.specularColor = new BABYLON.Color3(0.85, 0.87, 0.9);
        metalMat.specularPower = 96;

        const metalDark = new BABYLON.StandardMaterial('gasMetalD_' + uid, scene);
        metalDark.diffuseColor = new BABYLON.Color3(0.28, 0.29, 0.31);
        metalDark.specularColor = new BABYLON.Color3(0.5, 0.5, 0.52);
        metalDark.specularPower = 64;

        const knobMat = new BABYLON.StandardMaterial('gasKnob_' + uid, scene);
        knobMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.13);
        knobMat.specularColor = new BABYLON.Color3(0.55, 0.55, 0.58);
        knobMat.specularPower = 72;

        const underMat = new BABYLON.StandardMaterial('gasUnder_' + uid, scene);
        underMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.11);
        underMat.specularColor = BABYLON.Color3.Black();

        function mark(m) {
            m.isPickable = false;
            m.metadata = { isCountertop: true };
            return m;
        }
        function add(mesh, mat) {
            mesh.material = mat;
            mesh.parent = gasRoot;
            return mark(mesh);
        }

        // صفحه شیشه‌ای
        const top = BABYLON.MeshBuilder.CreateBox('gasTop_' + uid, {
            width: gW, height: gTopH, depth: gD
        }, scene);
        top.position.set(0, gTopH / 2, 0);
        add(top, glassMat);

        // زیرصفحه
        const under = BABYLON.MeshBuilder.CreateBox('gasUnder_' + uid, {
            width: gW - 3, height: gUnderH, depth: gD - 3
        }, scene);
        under.position.set(0, -gUnderH / 2, 0);
        add(under, underMat);

        // موقعیت شعله‌ها — چیدمان مثل عکس (۵ شعله: ۴ گوشه + وسط بزرگ)
        let burnerPos = [];
        if (bCount === 2) {
            burnerPos = [
                { x: -0.22, z: 0.05, r: 0.9 },
                { x: 0.22, z: 0.05, r: 0.9 }
            ];
        } else if (bCount === 3) {
            burnerPos = [
                { x: -0.28, z: 0.08, r: 0.85 },
                { x: 0, z: -0.05, r: 1.15 },
                { x: 0.28, z: 0.08, r: 0.85 }
            ];
        } else if (bCount === 4) {
            burnerPos = [
                { x: -0.28, z: -0.22, r: 0.9 },
                { x: 0.28, z: -0.22, r: 0.9 },
                { x: -0.28, z: 0.18, r: 0.9 },
                { x: 0.28, z: 0.18, r: 0.9 }
            ];
        } else {
            // ۵ شعله مثل عکس
            burnerPos = [
                { x: -0.30, z: -0.22, r: 0.95 }, // عقب چپ
                { x: 0.30, z: -0.22, r: 0.95 },  // عقب راست
                { x: 0, z: -0.02, r: 1.25 },     // وسط بزرگ
                { x: -0.30, z: 0.22, r: 0.85 },  // جلو چپ
                { x: 0.30, z: 0.22, r: 0.85 }    // جلو راست
            ];
        }

        for (let i = 0; i < burnerPos.length; i++) {
            const p = burnerPos[i];
            const cx = p.x * gW;
            const cz = p.z * gD;
            const sc = p.r; // مقیاس شعله
            const baseY = gTopH;

            // حلقه پایه روی شیشه
            const ring = BABYLON.MeshBuilder.CreateCylinder('gRing_' + uid + '_' + i, {
                diameter: 7.5 * sc, height: 0.35, tessellation: 28
            }, scene);
            ring.position.set(cx, baseY + 0.2, cz);
            add(ring, metalDark);

            // کاسه شعله مرکزی
            const cup = BABYLON.MeshBuilder.CreateCylinder('gCup_' + uid + '_' + i, {
                diameterTop: 3.2 * sc, diameterBottom: 4.2 * sc, height: 1.1, tessellation: 20
            }, scene);
            cup.position.set(cx, baseY + 0.75, cz);
            add(cup, metalDark);

            // درپوش شعله
            const cap = BABYLON.MeshBuilder.CreateCylinder('gCap_' + uid + '_' + i, {
                diameter: 2.4 * sc, height: 0.45, tessellation: 20
            }, scene);
            cap.position.set(cx, baseY + 1.4, cz);
            add(cap, metalMat);

            // پایه‌های ضربدری نگهبان قابلمه (۴ بازو مثل عکس)
            const armLen = 5.8 * sc;
            const armT = 0.45;
            const armH = 1.35;
            const armY = baseY + 0.9;
            for (let a = 0; a < 4; a++) {
                const ang = (a * Math.PI / 2) + Math.PI / 4; // ضربدر ۴۵°
                const arm = BABYLON.MeshBuilder.CreateBox('gArm_' + uid + '_' + i + '_' + a, {
                    width: armT, height: armH, depth: armLen
                }, scene);
                arm.position.set(
                    cx + Math.sin(ang) * armLen * 0.22,
                    armY,
                    cz + Math.cos(ang) * armLen * 0.22
                );
                arm.rotation.y = ang;
                add(arm, metalMat);

                // نوک ایستاده انتهای بازو (مثل عکس)
                const tip = BABYLON.MeshBuilder.CreateBox('gTip_' + uid + '_' + i + '_' + a, {
                    width: armT * 1.1, height: 2.2 * sc, depth: armT * 1.1
                }, scene);
                tip.position.set(
                    cx + Math.sin(ang) * armLen * 0.48,
                    baseY + 1.1 * sc,
                    cz + Math.cos(ang) * armLen * 0.48
                );
                add(tip, metalMat);
            }
        }

        // دکمه‌های کنترل جلو (مثل عکس: ردیف وسط لبه جلو)
        const knobN = Math.min(bCount, 5);
        const knobSpan = gW * 0.42;
        const knobStart = -knobSpan / 2;
        const knobZ = gD / 2 - 3.2;
        for (let i = 0; i < knobN; i++) {
            const kx = (knobN === 1) ? 0 : (knobStart + i * (knobSpan / (knobN - 1)));
            // پایه دکمه
            const kBase = BABYLON.MeshBuilder.CreateCylinder('gKB_' + uid + '_' + i, {
                diameter: 2.0, height: 0.5, tessellation: 16
            }, scene);
            kBase.position.set(kx, gTopH + 0.3, knobZ);
            add(kBase, metalDark);

            // بدنه دکمه
            const knob = BABYLON.MeshBuilder.CreateCylinder('gK_' + uid + '_' + i, {
                diameter: 2.4, height: 1.6, tessellation: 16
            }, scene);
            knob.position.set(kx, gTopH + 1.2, knobZ);
            add(knob, knobMat);

            // نشانگر روی دکمه
            const ind = BABYLON.MeshBuilder.CreateBox('gKI_' + uid + '_' + i, {
                width: 0.35, height: 0.3, depth: 1.0
            }, scene);
            ind.position.set(kx, gTopH + 2.05, knobZ);
            add(ind, metalMat);
        }

        const savedGasRot = settings.gas.rotation !== undefined
            ? settings.gas.rotation
            : (typeof gasRotation !== 'undefined' ? gasRotation : 0);
        gasRoot.rotation.y = (parseFloat(savedGasRot) || 0) * Math.PI / 180;

        gasRoot.position.set(
            -(totalLength / 2) + (settings.gas.x || 0) + gW / 2,
            thickness,
            -(totalWidth / 2) + (settings.gas.y || 0) + gD / 2
        );
    },

    /**
     * سینک روی صفحه — عین بخش سینک در createSingleCountertopMesh (view3d.js)
     * مدل: single | double | *tray* | جهت left/right
     * متریال: steel | black | white
     * + شیر کامل با مفصل و دسته
     */
    /**
     * سینک استیل — عین عکس: دو لگن توخالی + سینی شیاردار + ریم قاب (بدون صفحه پر)
     */
    _buildCountertopSink: function (parent, settings, totalLength, totalWidth, thickness, uid) {
        const sWidth = settings.sink.width || 80;
        const sDepth = settings.sink.depth || 50;
        const sHeight = 18;
        const scene = this.scene;

        const sMatType = settings.sink.materialType || 'steel';
        const sModel = settings.sink.modelType || 'single';
        const sDir = settings.sink.direction || 'right';

        let sinkColor = new BABYLON.Color3(0.78, 0.80, 0.82);
        let sinkSpec = new BABYLON.Color3(0.9, 0.92, 0.95);
        let sinkPower = 110;
        if (sMatType === 'black') {
            sinkColor = new BABYLON.Color3(0.12, 0.12, 0.13);
            sinkSpec = new BABYLON.Color3(0.45, 0.45, 0.48);
            sinkPower = 48;
        } else if (sMatType === 'white') {
            sinkColor = new BABYLON.Color3(0.94, 0.94, 0.95);
            sinkSpec = new BABYLON.Color3(0.25, 0.25, 0.28);
            sinkPower = 36;
        }

        const sinkMat = new BABYLON.StandardMaterial('sinkMat_' + uid, scene);
        sinkMat.diffuseColor = sinkColor;
        sinkMat.specularColor = sinkSpec;
        sinkMat.specularPower = sinkPower;

        const innerMat = new BABYLON.StandardMaterial('sinkInner_' + uid, scene);
        innerMat.diffuseColor = new BABYLON.Color3(
            Math.max(0, sinkColor.r * 0.62),
            Math.max(0, sinkColor.g * 0.62),
            Math.max(0, sinkColor.b * 0.62)
        );
        innerMat.specularColor = new BABYLON.Color3(0.55, 0.58, 0.6);
        innerMat.specularPower = 64;

        const hasTray = String(sModel).indexOf('tray') >= 0;
        const isDouble = String(sModel).indexOf('double') >= 0;

        const sinkRoot = new BABYLON.TransformNode('sink_' + uid, scene);
        sinkRoot.parent = parent;

        function mark(m) {
            m.isPickable = false;
            m.metadata = { isCountertop: true };
            return m;
        }
        function box(name, w, h, d, x, y, z, mat) {
            const m = BABYLON.MeshBuilder.CreateBox(name, {
                width: Math.max(0.12, w),
                height: Math.max(0.12, h),
                depth: Math.max(0.12, d)
            }, scene);
            m.position.set(x, y, z);
            m.material = mat || sinkMat;
            m.parent = sinkRoot;
            return mark(m);
        }

        // —— فقط قاب ریم (نه صفحه پر روی کل سینک) ——
        const rimW = 2.0;
        const rimH = 0.5;
        // جلو / عقب
        box('rimF_' + uid, sWidth + rimW * 2, rimH, rimW,
            0, rimH / 2, sDepth / 2 + rimW / 2);
        box('rimB_' + uid, sWidth + rimW * 2, rimH, rimW,
            0, rimH / 2, -sDepth / 2 - rimW / 2);
        // چپ / راست
        box('rimL_' + uid, rimW, rimH, sDepth,
            -sWidth / 2 - rimW / 2, rimH / 2, 0);
        box('rimR_' + uid, rimW, rimH, sDepth,
            sWidth / 2 + rimW / 2, rimH / 2, 0);

        // تقسیم عرض: سینی + ناحیه کاسه
        let trayW = 0;
        let bowlAreaW = sWidth;
        let trayX = 0;
        let bowlAreaX = 0;

        if (hasTray) {
            trayW = sWidth * 0.30;
            bowlAreaW = sWidth - trayW;
            if (sDir === 'left') {
                // سینی سمت راست (مثل عکس رایج)
                trayX = sWidth / 2 - trayW / 2;
                bowlAreaX = -sWidth / 2 + bowlAreaW / 2;
            } else {
                trayX = -sWidth / 2 + trayW / 2;
                bowlAreaX = sWidth / 2 - bowlAreaW / 2;
            }

            // سطح سینی (کمی پایین‌تر از ریم)
            const trayY = -0.35;
            box('trayDeck_' + uid, trayW - 0.4, 0.5, sDepth - 0.4,
                trayX, trayY, 0);

            // شیارهای افقی سینی (مثل عکس: ۵–۶ نوار موازی در راستای عرض سینی)
            const nGr = 6;
            const gLen = trayW * 0.78;
            const gSpan = sDepth * 0.82;
            for (let i = 0; i < nGr; i++) {
                const gz = -gSpan / 2 + (i + 0.5) * (gSpan / nGr);
                // نوار برجسته
                box('trayRib_' + uid + '_' + i, gLen, 0.45, 1.4,
                    trayX, trayY + 0.35, gz, sinkMat);
                // شیار بین نوارها (فرورفتگی تیره‌تر)
                if (i < nGr - 1) {
                    const gz2 = gz + (gSpan / nGr) * 0.5;
                    box('traySlot_' + uid + '_' + i, gLen * 0.95, 0.25, 0.7,
                        trayX, trayY + 0.05, gz2, innerMat);
                }
            }

            // دیواره جدا سینی از کاسه
            const divX = (trayX < 0)
                ? (trayX + trayW / 2)
                : (trayX - trayW / 2);
            box('trayWall_' + uid, 0.8, sHeight * 0.4, sDepth - 0.6,
                divX, -sHeight * 0.15, 0);
        }

        // —— لگنی‌های توخالی ——
        const wallT = 1.0;
        const midGap = isDouble ? 2.0 : 0;
        const nBowls = isDouble ? 2 : 1;
        const bowlW = isDouble
            ? (bowlAreaW - midGap) / 2
            : bowlAreaW;
        const bowlD = sDepth - 0.6;

        for (let bi = 0; bi < nBowls; bi++) {
            let bx;
            if (isDouble) {
                const left = bowlAreaX - bowlAreaW / 2;
                bx = left + bowlW / 2 + bi * (bowlW + midGap);
            } else {
                bx = bowlAreaX;
            }

            // دیواره‌های کاسه (تو خالی از بالا دیده می‌شود)
            // جلو
            box('b' + bi + 'F_' + uid, bowlW, sHeight, wallT,
                bx, -sHeight / 2, bowlD / 2 - wallT / 2);
            // عقب
            box('b' + bi + 'B_' + uid, bowlW, sHeight, wallT,
                bx, -sHeight / 2, -bowlD / 2 + wallT / 2);
            // چپ
            box('b' + bi + 'L_' + uid, wallT, sHeight, bowlD - wallT * 2,
                bx - bowlW / 2 + wallT / 2, -sHeight / 2, 0);
            // راست
            box('b' + bi + 'R_' + uid, wallT, sHeight, bowlD - wallT * 2,
                bx + bowlW / 2 - wallT / 2, -sHeight / 2, 0);
            // کف
            box('b' + bi + 'Fl_' + uid, bowlW - wallT * 2, 0.5, bowlD - wallT * 2,
                bx, -sHeight + 0.25, 0, innerMat);

            // لبه داخلی بالای کاسه (قاب نازک دور دهانه)
            const lip = 0.55;
            const lipY = -0.15;
            box('b' + bi + 'LipF_' + uid, bowlW - wallT, lip, 0.7,
                bx, lipY, bowlD / 2 - wallT - 0.35);
            box('b' + bi + 'LipB_' + uid, bowlW - wallT, lip, 0.7,
                bx, lipY, -bowlD / 2 + wallT + 0.35);
            box('b' + bi + 'LipL_' + uid, 0.7, lip, bowlD - wallT * 2 - 1.4,
                bx - bowlW / 2 + wallT + 0.35, lipY, 0);
            box('b' + bi + 'LipR_' + uid, 0.7, lip, bowlD - wallT * 2 - 1.4,
                bx + bowlW / 2 - wallT - 0.35, lipY, 0);

            // چاه مربعی وسط کف
            box('drain' + bi + '_' + uid, 3.4, 0.4, 3.4,
                bx, -sHeight + 0.55, 0, sinkMat);
            box('drainIn' + bi + '_' + uid, 2.0, 0.5, 2.0,
                bx, -sHeight + 0.75, 0, innerMat);
        }

        // دیواره وسط دو لگن
        if (isDouble) {
            box('midDiv_' + uid, midGap, sHeight, bowlD,
                bowlAreaX, -sHeight / 2, 0);
            // لبه بالای دیواره وسط
            box('midLip_' + uid, midGap + 0.4, 0.55, bowlD - 1,
                bowlAreaX, -0.15, 0);
        }

        // —— شیر قوسی مدرن (سفید + طلایی) ——
        // لوله از یقه تا نوک = یک CreateTube یک‌تکه (بدون درز ساقه/قوس)
        const whiteMat = new BABYLON.StandardMaterial('faucetWhite_' + uid, scene);
        whiteMat.diffuseColor = new BABYLON.Color3(0.96, 0.96, 0.97);
        whiteMat.specularColor = new BABYLON.Color3(0.55, 0.55, 0.58);
        whiteMat.specularPower = 80;

        const goldMat = new BABYLON.StandardMaterial('faucetGold_' + uid, scene);
        goldMat.diffuseColor = new BABYLON.Color3(0.88, 0.70, 0.25);
        goldMat.specularColor = new BABYLON.Color3(0.98, 0.86, 0.42);
        goldMat.specularPower = 120;
        goldMat.emissiveColor = new BABYLON.Color3(0.05, 0.03, 0.01);

        const faucetRoot = new BABYLON.TransformNode('faucet_' + uid, scene);
        faucetRoot.parent = sinkRoot;

        function fPart(mesh, mat) {
            mesh.material = mat;
            mesh.parent = faucetRoot;
            mesh.isPickable = false;
            mesh.metadata = { isCountertop: true };
            return mesh;
        }

        // پایه طلایی
        fPart(BABYLON.MeshBuilder.CreateCylinder('fGBase_' + uid, {
            diameter: 4.4, height: 1.2, tessellation: 28
        }, scene), goldMat).position.set(0, 0.6, 0);

        // بدنه سفید
        fPart(BABYLON.MeshBuilder.CreateCylinder('fBody_' + uid, {
            diameter: 3.7, height: 7.5, tessellation: 28
        }, scene), whiteMat).position.set(0, 4.7, 0);

        // یقه طلایی
        const collarY = 8.7;
        fPart(BABYLON.MeshBuilder.CreateCylinder('fCollar_' + uid, {
            diameter: 3.95, height: 0.8, tessellation: 28
        }, scene), goldMat).position.set(0, collarY, 0);

        // مسیر یک‌تکه لوله: عمودی از یقه + قوس دایره‌ای نرم تا دهانه
        const pipeStartY = collarY + 0.4;
        const stemTop = pipeStartY + 9.5;
        const arcR = 9.5;
        const pipePath = [];

        // بخش عمودی (تراکم بیشتر برای صافی)
        for (let i = 0; i <= 12; i++) {
            const t = i / 12;
            pipePath.push(new BABYLON.Vector3(0, pipeStartY + (stemTop - pipeStartY) * t, 0));
        }

        // قوس: شروع مماس با عمودی (+Y)، خم به +Z، پایان رو به پایین
        // p = (0, stemTop + R*sin(a), R*(1-cos(a)))
        // a=0 → (stemTop, 0) مماس؛ a=π/2 → قله؛ a→2.1 → پایین‌جلو
        // خم بیشتر: تا زاویه ~۲.۶ rad تا دهانه تقریباً عمودی داخل کاسه باشد
        const nArc = 36;
        for (let i = 1; i <= nArc; i++) {
            const a = (i / nArc) * 2.55;
            const py = stemTop + arcR * Math.sin(a);
            const pz = arcR * (1 - Math.cos(a));
            pipePath.push(new BABYLON.Vector3(0, py, pz));
        }

        fPart(BABYLON.MeshBuilder.CreateTube('fPipe_' + uid, {
            path: pipePath,
            radius: 0.95,
            tessellation: 16,
            cap: BABYLON.Mesh.CAP_ALL
        }, scene), whiteMat);

        // نوک طلایی هم‌راستا با انتهای لوله
        const pA = pipePath[pipePath.length - 2];
        const pB = pipePath[pipePath.length - 1];
        const tipDir = pB.subtract(pA).normalize();
        const tipLen = 2.5;
        const tip = BABYLON.MeshBuilder.CreateCylinder('fTip_' + uid, {
            diameterTop: 1.25,
            diameterBottom: 1.95,
            height: tipLen,
            tessellation: 18
        }, scene);
        const yAxis = new BABYLON.Vector3(0, 1, 0);
        const tipDot = BABYLON.Vector3.Dot(yAxis, tipDir);
        if (tipDot < -0.999) {
            tip.rotation.x = Math.PI;
        } else if (tipDot < 0.999) {
            const axis = BABYLON.Vector3.Cross(yAxis, tipDir);
            if (axis.lengthSquared() > 1e-8) {
                axis.normalize();
                const ang = Math.acos(Math.max(-1, Math.min(1, tipDot)));
                tip.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, ang);
            }
        }
        tip.position = pB.add(tipDir.scale(tipLen * 0.42));
        fPart(tip, goldMat);

        // دسته: دایره افقی + اهرم
        const hY = 5.0;
        const bodyR = 1.85;
        const hub = BABYLON.MeshBuilder.CreateCylinder('fHub_' + uid, {
            diameter: 3.2, height: 1.35, tessellation: 24
        }, scene);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(bodyR + 0.55, hY, 0);
        fPart(hub, goldMat);

        const levPts = [
            new BABYLON.Vector3(bodyR + 1.3, hY, 0),
            new BABYLON.Vector3(bodyR + 2.8, hY + 0.3, 0),
            new BABYLON.Vector3(bodyR + 4.0, hY + 1.8, 0),
            new BABYLON.Vector3(bodyR + 4.3, hY + 4.0, 0),
            new BABYLON.Vector3(bodyR + 4.2, hY + 5.5, 0)
        ];
        fPart(BABYLON.MeshBuilder.CreateTube('fLever_' + uid, {
            path: levPts,
            radius: 0.48,
            tessellation: 10,
            cap: BABYLON.Mesh.CAP_ALL
        }, scene), goldMat);

        fPart(BABYLON.MeshBuilder.CreateSphere('fLevCap_' + uid, {
            diameter: 1.2, segments: 12
        }, scene), goldMat).position.copyFrom(levPts[levPts.length - 1]);

        // شیر روی لبه عقب ناحیه کاسه (نه روی سینی)
        faucetRoot.position.set(bowlAreaX, 0, -sDepth / 2 + 3.5);

        // چرخش و جای کل سینک
        const savedSinkRot = settings.sink.rotation !== undefined
            ? settings.sink.rotation
            : (typeof sinkRotation !== 'undefined' ? sinkRotation : 0);
        sinkRoot.rotation.y = -(parseFloat(savedSinkRot) || 0) * Math.PI / 180;

        // مبدأ سینک روی سطح بالای صفحه تا ریم و شیر دیده شوند
        sinkRoot.position.set(
            -(totalLength / 2) + (settings.sink.x || 0) + sWidth / 2,
            thickness,
            -(totalWidth / 2) + (settings.sink.y || 0) + sDepth / 2
        );
    },

    // =====================================================================
    // ستون‌ها — معادل Kitchen3D.renderPillars
    // =====================================================================

    _clearPillars: function () {
        if (!this.scene) return;
        const toDispose = [];
        this.scene.meshes.forEach(function (m) {
            if (m.metadata && m.metadata.isPillar) toDispose.push(m);
        });
        for (let i = 0; i < toDispose.length; i++) {
            try {
                const m = toDispose[i];
                if (m.material) m.material = null;
                m.dispose(false, false);
            } catch (e) {}
        }
    },

    /**
     * ستون‌ها از آرایهٔ سراسری pillars
     * p: { id, x, y, w, d } — ارتفاع = room.h
     * موقعیت مرکز: (x+w/2, h/2, y+d/2) عین Three
     * متریال: سرامیک دیوار روی وجوه جانبی، خاکستری روشن بالا/پایین
     */
    _renderPillars: function () {
        if (!this.scene) return;
        this._clearPillars();

        if (typeof pillars === 'undefined' || !pillars || !pillars.length) return;

        const h = (typeof room !== 'undefined' && room.h)
            ? room.h
            : ((this.config && this.config.wallHeight) || 280);
        const self = this;

        for (let i = 0; i < pillars.length; i++) {
            const p = pillars[i];
            if (!p) continue;
            const pw = parseFloat(p.w) || 30;
            const pd = parseFloat(p.d) || 30;
            const px = parseFloat(p.x) || 0;
            const pz = parseFloat(p.y) || 0;
            const pid = (p.id != null) ? p.id : i;

            // عین Three:
            // matSideX → وجوه چپ/راست (عرض بافت = p.d)
            // matSideZ → وجوه جلو/عقب (عرض بافت = p.w)
            const matSideX = this._makeInnerWallMaterial(h, pd);
            const matSideZ = this._makeInnerWallMaterial(h, pw);

            const topMat = new BABYLON.StandardMaterial('pillarTop_' + pid, this.scene);
            topMat.diffuseColor = new BABYLON.Color3(0.866, 0.866, 0.866);
            topMat.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
            topMat.specularPower = 8;

            // MultiMaterial مطابق ترتیب وجه باکس Babylon:
            // 0 front(+z), 1 back(-z), 2 right(+x), 3 left(-x), 4 top(+y), 5 bottom(-y)
            const multi = new BABYLON.MultiMaterial('pillarMulti_' + pid, this.scene);
            multi.subMaterials = [
                matSideZ, // front  — عرض pw
                matSideZ, // back   — عرض pw
                matSideX, // right  — عرض pd
                matSideX, // left   — عرض pd
                topMat,   // top
                topMat    // bottom
            ];

            // faceUV: هر وجه UV 0..1 تا تکسچر با uScale خودش روی عرض وجه بنشیند
            const faceUV = [];
            for (let f = 0; f < 6; f++) {
                faceUV.push(new BABYLON.Vector4(0, 0, 1, 1));
            }

            const box = BABYLON.MeshBuilder.CreateBox('pillar_' + pid, {
                width: pw,
                height: h,
                depth: pd,
                faceUV: faceUV,
                wrap: true
            }, this.scene);

            // ساخت subMeshes برای MultiMaterial (هر وجه یک subMesh)
            // CreateBox ایندکس: هر وجه 2 مثلث = 6 ایندکس
            box.subMeshes = [];
            const totalVertices = box.getTotalVertices();
            for (let f = 0; f < 6; f++) {
                box.subMeshes.push(new BABYLON.SubMesh(
                    f,              // materialIndex
                    0,              // verticesStart
                    totalVertices,  // verticesCount
                    f * 6,          // indexStart
                    6,              // indexCount
                    box
                ));
            }
            box.material = multi;

            box.position = new BABYLON.Vector3(
                px + pw / 2,
                h / 2,
                pz + pd / 2
            );
            box.isPickable = false;
            box.metadata = { isPillar: true };
        }
    },

    refreshPillars: function () {
        if (!this.scene || !this.isReady) return;
        this._renderPillars();
    },

    // =====================================================================
    // بین‌کابینتی (ورق روی دیوار) — معادل Kitchen3D.addInterPanels
    // =====================================================================

    _clearInterPanels: function () {
        if (!this.scene) return;
        const toDispose = [];
        this.scene.meshes.forEach(function (m) {
            if (m.metadata && m.metadata.isInterPanel) toDispose.push(m);
        });
        if (this.scene.transformNodes) {
            this.scene.transformNodes.forEach(function (n) {
                if (n.metadata && n.metadata.isInterPanel) toDispose.push(n);
            });
        }
        for (let i = 0; i < toDispose.length; i++) {
            try {
                if (toDispose[i].dispose) toDispose[i].dispose();
            } catch (e) {}
        }
    },

    /**
     * ساخت ورق‌های بین‌کابینتی از window.interPanels
     * p: { enabled, length, width, x, y, wall, color, materialType, finish, thickness }
     * wall: back | front | left | right
     */
    _renderInterPanels: function () {
        if (!this.scene) return;
        this._clearInterPanels();

        if (!window.interPanels || !window.interPanels.length) return;

        const roomW = (typeof room !== 'undefined' && room.w) ? room.w : (this._roomW || 400);
        const roomD = (typeof room !== 'undefined' && room.d) ? room.d : (this._roomD || 300);
        const wallThick = (this.config && this.config.wallThickness) || 20;
        const wallNameMap = { back: 'روبرو', left: 'چپ', right: 'راست', front: 'جلو' };
        const self = this;

        for (let idx = 0; idx < window.interPanels.length; idx++) {
            const p = window.interPanels[idx];
            if (!p || !p.enabled) continue;

            const len = parseFloat(p.length) || 100;
            const h = parseFloat(p.width) || 60; // ارتفاع ورق
            const px = parseFloat(p.x) || 0;
            const py = parseFloat(p.y) || 0;
            const wall = p.wall || 'back';

            // ضخامت ۲.۵ میل
            let thickness = 0.25;
            if (p.thickness != null && Number.isFinite(parseFloat(p.thickness))) {
                const tVal = parseFloat(p.thickness);
                thickness = (tVal >= 1.5) ? 0.25 : tVal;
            }
            const wallGap = (p.wallGap != null && Number.isFinite(parseFloat(p.wallGap)))
                ? parseFloat(p.wallGap) : 0.08;
            const faceOffset = (thickness / 2) + wallGap;
            const posY = py + h / 2;

            const wallLabel = wallNameMap[wall] || 'نامشخص';
            const targetLabel = 'ورق بین کابینتی ' + (idx + 1) + ' (دیوار ' + wallLabel + ')';

            // متریال
            const isMarble = (p.materialType === 'marbleSheet' || p.materialType === 'marble');
            const finishKey = (p.finish || (isMarble ? 'satin' : 'matte')).toString().toLowerCase();
            let specPower = isMarble ? 64 : 20;
            let specCol = isMarble
                ? new BABYLON.Color3(0.45, 0.45, 0.48)
                : new BABYLON.Color3(0.1, 0.1, 0.1);
            try {
                if (typeof window.getKitchenFinishPreset === 'function') {
                    const preset = window.getKitchenFinishPreset(finishKey) || {};
                    if (preset.roughness != null) {
                        specPower = Math.max(4, (1 - preset.roughness) * 80);
                    }
                }
                if (finishKey.indexOf('gloss') >= 0) {
                    specPower = 90;
                    specCol = new BABYLON.Color3(0.5, 0.5, 0.52);
                }
            } catch (e) {}

            const mat = new BABYLON.StandardMaterial('interMat_' + idx, this.scene);
            mat.specularColor = specCol;
            mat.specularPower = specPower;
            mat.backFaceCulling = true;

            let textureUrl = null;
            let solidHex = null;
            try {
                if (window.isolatedDoorTextures && window.isolatedDoorTextures[targetLabel]) {
                    textureUrl = window.isolatedDoorTextures[targetLabel];
                }
            } catch (e) {}

            if (!textureUrl && p.color && typeof p.color === 'string') {
                if (p.color.charAt(0) === '#') {
                    solidHex = p.color;
                } else if (
                    p.color.indexOf('http') === 0 ||
                    p.color.indexOf('data:image') === 0 ||
                    p.color.indexOf('assets/') >= 0 ||
                    p.color.indexOf('/') >= 0 ||
                    p.color.indexOf('.') >= 0
                ) {
                    textureUrl = p.color;
                } else {
                    // allMaterials lookup
                    try {
                        if (window.allMaterials) {
                            const types = Object.keys(window.allMaterials);
                            for (let ti = 0; ti < types.length && !textureUrl; ti++) {
                                const list = window.allMaterials[types[ti]];
                                if (!Array.isArray(list)) continue;
                                for (let j = 0; j < list.length; j++) {
                                    const m = list[j];
                                    if (!m) continue;
                                    if (m.texture === p.color || m.code === p.color || m.name === p.color) {
                                        if (m.texture) textureUrl = m.texture;
                                        else if (m.color) solidHex = m.color;
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (e) {}
                    if (!textureUrl && !solidHex) solidHex = '#f5f5f5';
                }
            }
            if (!textureUrl && !solidHex) solidHex = '#f5f5f5';

            if (textureUrl) {
                try {
                    const tex = new BABYLON.Texture(
                        textureUrl, this.scene, false, true,
                        BABYLON.Texture.TRILINEAR_SAMPLINGMODE
                    );
                    tex.uScale = 1;
                    tex.vScale = 1;
                    tex.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                    tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                    mat.diffuseTexture = tex;
                    mat.diffuseColor = BABYLON.Color3.White();
                } catch (e) {
                    mat.diffuseColor = this._hexToColor3(solidHex || '#f5f5f5');
                }
            } else {
                mat.diffuseColor = this._hexToColor3(solidHex || '#f5f5f5');
            }

            // مش ورق: طول × ارتفاع × ضخامت
            // برای دیوار back/front: width=length در X، height=h در Y، depth=thickness در Z
            // برای left/right: بعد از چرخش، thickness در X قرار می‌گیرد
            const mesh = BABYLON.MeshBuilder.CreateBox('inter_' + idx, {
                width: len,
                height: h,
                depth: thickness
            }, this.scene);
            mesh.material = mat;
            mesh.isPickable = false;
            mesh.metadata = { isInterPanel: true };

            // جای‌گذاری روی دیوار (عین Three)
            if (wall === 'back') {
                mesh.position = new BABYLON.Vector3(
                    px + len / 2,
                    posY,
                    faceOffset
                );
            } else if (wall === 'front') {
                mesh.rotation.y = Math.PI;
                mesh.position = new BABYLON.Vector3(
                    roomW - (px + len / 2),
                    posY,
                    roomD - faceOffset
                );
            } else if (wall === 'left') {
                mesh.rotation.y = Math.PI / 2;
                mesh.position = new BABYLON.Vector3(
                    faceOffset,
                    posY,
                    px + len / 2
                );
            } else if (wall === 'right') {
                mesh.rotation.y = -Math.PI / 2;
                mesh.position = new BABYLON.Vector3(
                    roomW - faceOffset,
                    posY,
                    px + len / 2
                );
            } else {
                // پیش‌فرض back
                mesh.position = new BABYLON.Vector3(px + len / 2, posY, faceOffset);
            }
        }
    },

    refreshInterPanels: function () {
        if (!this.scene || !this.isReady) return;
        this._renderInterPanels();
    },

    /**
     * placeCabinetInRoom — کپی دقیق از view3d.js خطوط 11308–11384
     */
    _placeCabinetInRoom: function (group, c, W, H, D) {
        W = parseFloat(c.w) || W || 60;
        H = parseFloat(c.h) || H || 72;
        D = parseFloat(c.d) || D || 55;

        const isRotated = (c.rot === 1 || c.rot === 3);
        const occupiedW = isRotated ? D : W;
        const occupiedD = isRotated ? W : D;

        let centerX, centerZ;

        if (c.angle !== undefined && c.angle !== null) {
            const normalizedAngle = ((c.angle % 360) + 360) % 360;
            if (Math.abs(normalizedAngle - 90) < 1 || Math.abs(normalizedAngle - 270) < 1) {
                centerX = c.x + D / 2;
                centerZ = c.y + W / 2;
            } else {
                centerX = c.x + W / 2;
                centerZ = c.y + D / 2;
            }
        } else {
            centerX = (c.x || 0) + occupiedW / 2;
            centerZ = (c.y || 0) + occupiedD / 2;
        }

        const rot = (c.rot || 0) % 4;
        const tolerance = 5;

        const roomW = (typeof room !== 'undefined') ? room.w : 0;
        const roomD = (typeof room !== 'undefined') ? room.d : 0;

        // وضعیت دیوارها — اول از room، بعد config
        const hasTop = (typeof room !== 'undefined' && room.hasTop !== undefined)
            ? room.hasTop
            : (this.config.hasTop !== false);
        const hasBottom = (typeof room !== 'undefined' && room.hasBottom !== undefined)
            ? room.hasBottom
            : (this.config.hasBottom === true);
        const hasLeft = (typeof room !== 'undefined' && room.hasLeft !== undefined)
            ? room.hasLeft
            : (this.config.hasLeft !== false);
        const hasRight = (typeof room !== 'undefined' && room.hasRight !== undefined)
            ? room.hasRight
            : (this.config.hasRight !== false);

        // اسنپ به دیوار — عین Three
        if (c.angle === undefined || c.angle === null || c.angle === 0) {
            if (rot === 0 && Math.abs(c.y || 0) <= tolerance && hasTop) {
                centerZ = occupiedD / 2;
            } else if (rot === 1 && Math.abs(c.x || 0) <= tolerance && hasLeft) {
                centerX = occupiedW / 2;
            } else if (rot === 2 && Math.abs(((c.y || 0) + occupiedW) - roomD) <= tolerance && hasBottom) {
                centerZ = roomD - occupiedD / 2;
            } else if (rot === 3 && Math.abs(((c.x || 0) + occupiedW) - roomW) <= tolerance && hasRight) {
                centerX = roomW - occupiedW / 2;
            }
        }

        // ارتفاع — عین Three: بدنه روی پاخور بلند می‌شود
        const kbHeight = (c.kickboard && c.kickboard.enabled &&
            ((c.y || 0) < 60 || (c.elevation || 0) < 50) &&
            !c.isAppliance && !c.isFridge && !c.isFridgeWrap)
            ? (parseFloat(c.kickboard.height) || 14)
            : 0;
        const baseElevation = parseFloat(c.elevation) || 0;
        const bottomOfCabinet = Math.max(baseElevation, kbHeight);
        const finalY = bottomOfCabinet + H / 2;

        group.position = new BABYLON.Vector3(centerX, finalY, centerZ);

        if (c.angle !== undefined && c.angle !== null) {
            group.rotation.y = -(c.angle * Math.PI / 180);
        } else {
            const effectiveRot = (4 - (c.rot || 0)) % 4;
            group.rotation.y = effectiveRot * (Math.PI / 2);
        }
    }

,

    // =====================================================================
    // چهارچوب کمد دیواری — معادل Kitchen3D.renderClosetFrameUnit
    // =====================================================================

    _renderClosetFrameUnits: function () {
        if (!this.scene) return;
        this._clearClosetFrames();

        const units = window.closetFrameUnits || [];
        for (let i = 0; i < units.length; i++) {
            try { this._buildClosetFrameUnit(units[i]); } catch (e) {}
        }
    },

    _clearClosetFrames: function () {
        if (!this.scene) return;
        const toDispose = [];
        this.scene.meshes.forEach(function (m) {
            if (m && m.name && m.name.indexOf('closetFrame_') === 0) toDispose.push(m);
        });
        if (this.scene.transformNodes) {
            this.scene.transformNodes.forEach(function (n) {
                if (n && n.name && (n.name.indexOf('closetFrameGroup_') === 0 || n.name.indexOf('closetFrame_ayeneRoot_') === 0)) toDispose.push(n);
            });
        }
        for (let i = 0; i < toDispose.length; i++) {
            try {
                const m = toDispose[i];
                // آزاد کردن MirrorTexture آیینه
                try {
                    if (m.metadata && m.metadata.mirrorTexture) {
                        try { m.metadata.mirrorTexture.dispose(); } catch (eT) {}
                        m.metadata.mirrorTexture = null;
                    }
                    if (m.metadata && m.metadata.mirrorProbe) {
                        try { m.metadata.mirrorProbe.dispose(); } catch (eP) {}
                        m.metadata.mirrorProbe = null;
                    }
                    if (m.material && m.material.reflectionTexture) {
                        try { m.material.reflectionTexture.dispose(); } catch (e2) {}
                        m.material.reflectionTexture = null;
                    }
                    if (m.material) {
                        try { m.material.dispose(); } catch (e3) {}
                    }
                } catch (eMat) {}
                if (m.material) m.material = null;
                m.dispose(false, false);
            } catch (e) {}
        }
    },

    _makeClosetWoodMat: function (uid) {
        const mat = new BABYLON.StandardMaterial('closetWood_' + uid, this.scene);
        mat.specularColor = new BABYLON.Color3(0.06, 0.05, 0.04);
        mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        try {
            const size = 256;
            const dyn = new BABYLON.DynamicTexture('closetWoodTex_' + uid, size, this.scene, false);
            const ctx = dyn.getContext();
            ctx.fillStyle = '#a9754f';
            ctx.fillRect(0, 0, size, size);
            for (let i = 0; i < 45; i++) {
                const y = (i * 37 + 13) % size;
                const dark = (i % 2 === 0);
                ctx.strokeStyle = dark ? 'rgba(90,55,30,0.3)' : 'rgba(150,105,65,0.25)';
                ctx.lineWidth = 1 + (i % 3);
                ctx.beginPath();
                ctx.moveTo(0, y);
                for (let x = 0; x <= size; x += 16) {
                    ctx.lineTo(x, y + ((i * x) % 7) - 3);
                }
                ctx.stroke();
            }
            dyn.update(true);
            dyn.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
            dyn.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
            dyn.uScale = 2;
            dyn.vScale = 4;
            mat.diffuseTexture = dyn;
        } catch (e) {
            mat.diffuseColor = new BABYLON.Color3(0.66, 0.46, 0.31);
        }
        return mat;
    },

    _makeRokoobMat: function (uid, colorVal) {
        const mat = new BABYLON.StandardMaterial('rokoob_' + uid, this.scene);
        mat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        if (colorVal && typeof colorVal === 'string' && colorVal.charAt(0) === '#') {
            mat.diffuseColor = this._hexStrToColor3(colorVal);
        } else {
            mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        }
        return mat;
    },

    _buildClosetFrameUnit: function (unit) {
        if (!unit || !unit.parts || !unit.parts.length || !this.scene) return;

        const FRAME_THICKNESS = 5.5;
        const frameDepth = parseFloat(unit.d) || FRAME_THICKNESS;
        const totalWidth = parseFloat(unit.w) || 1;
        const elev = parseFloat(unit.elevation) || 0;
        const uid = unit.id != null ? String(unit.id) : ('cf' + Date.now());

        let minX = Infinity;
        for (let i = 0; i < unit.parts.length; i++) {
            const p = unit.parts[i];
            if (p && p.x < minX) minX = p.x;
        }
        if (!Number.isFinite(minX)) minX = 0;

        const group = new BABYLON.TransformNode('closetFrameGroup_' + uid, this.scene);
        group.metadata = { isClosetFrame: true, closetFrameId: uid };

        const frameMat = this._makeClosetWoodMat(uid);
        const rokoobDataParts = unit.rokoobParts || [];
        const framePartDoors = unit.framePartDoors || {};

        for (let i = 0; i < unit.parts.length; i++) {
            const part = unit.parts[i];
            if (!part) continue;

            const pW = part.orientation === 'horizontal' ? part.length : FRAME_THICKNESS;
            const pH = part.orientation === 'vertical' ? part.length : FRAME_THICKNESS;

            const mesh = BABYLON.MeshBuilder.CreateBox('closetFrame_part_' + uid + '_' + i, {
                width: pW, height: pH, depth: frameDepth
            }, this.scene);

            const localX = (part.x - minX) - (totalWidth / 2) + (pW / 2);
            const localY = part.y + (pH / 2);
            mesh.position.set(localX, localY, 0);
            mesh.material = frameMat;
            mesh.parent = group;
            mesh.isPickable = false;
            mesh.metadata = { isClosetFrame: true, partId: part.id };

            // روکوب‌ها
            const rokoobPart = rokoobDataParts.find(function (rp) { return rp && rp.partId === part.id; });
            if (rokoobPart && rokoobPart.directions) {
                const dirs = ['top', 'bottom', 'left', 'right'];
                for (let d = 0; d < dirs.length; d++) {
                    const dir = dirs[d];
                    const dData = rokoobPart.directions[dir];
                    if (!dData || !dData.enabled) continue;

                    const rLen = dData.length || part.length;
                    const rWidth = dData.width || 4;
                    const rThick = dData.thickness || 1.6;
                    const colorVal = (dData.color && dData.color.value) ? dData.color.value : null;
                    const matR = this._makeRokoobMat(uid + '_' + i + '_' + dir, colorVal);

                    let rMesh = null;
                    if (part.orientation === 'vertical') {
                        let offsetCross = 0;
                        if (dData.align === 'top') offsetCross = (FRAME_THICKNESS / 2) - (rWidth / 2);
                        else if (dData.align === 'bottom') offsetCross = -(FRAME_THICKNESS / 2) + (rWidth / 2);

                        if (dir === 'top') {
                            rMesh = BABYLON.MeshBuilder.CreateBox('closetFrame_rok_' + uid + '_' + i + '_t', {
                                width: rWidth, height: rLen, depth: rThick
                            }, this.scene);
                            rMesh.position.set(localX + offsetCross, localY, frameDepth / 2 + rThick / 2);
                        } else if (dir === 'bottom') {
                            rMesh = BABYLON.MeshBuilder.CreateBox('closetFrame_rok_' + uid + '_' + i + '_b', {
                                width: rWidth, height: rLen, depth: rThick
                            }, this.scene);
                            rMesh.position.set(localX + offsetCross, localY, -frameDepth / 2 - rThick / 2);
                        } else if (dir === 'left') {
                            rMesh = BABYLON.MeshBuilder.CreateBox('closetFrame_rok_' + uid + '_' + i + '_l', {
                                width: rThick, height: rLen, depth: rWidth
                            }, this.scene);
                            rMesh.position.set(localX - FRAME_THICKNESS / 2 - rThick / 2, localY, offsetCross);
                        } else if (dir === 'right') {
                            rMesh = BABYLON.MeshBuilder.CreateBox('closetFrame_rok_' + uid + '_' + i + '_r', {
                                width: rThick, height: rLen, depth: rWidth
                            }, this.scene);
                            rMesh.position.set(localX + FRAME_THICKNESS / 2 + rThick / 2, localY, offsetCross);
                        }
                    } else {
                        // horizontal part
                        let offsetCross = 0;
                        if (dData.align === 'top') offsetCross = (FRAME_THICKNESS / 2) - (rWidth / 2);
                        else if (dData.align === 'bottom') offsetCross = -(FRAME_THICKNESS / 2) + (rWidth / 2);

                        if (dir === 'top') {
                            rMesh = BABYLON.MeshBuilder.CreateBox('closetFrame_rok_' + uid + '_' + i + '_t', {
                                width: rLen, height: rWidth, depth: rThick
                            }, this.scene);
                            rMesh.position.set(localX, localY + offsetCross, frameDepth / 2 + rThick / 2);
                        } else if (dir === 'bottom') {
                            rMesh = BABYLON.MeshBuilder.CreateBox('closetFrame_rok_' + uid + '_' + i + '_b', {
                                width: rLen, height: rWidth, depth: rThick
                            }, this.scene);
                            rMesh.position.set(localX, localY + offsetCross, -frameDepth / 2 - rThick / 2);
                        } else if (dir === 'left') {
                            rMesh = BABYLON.MeshBuilder.CreateBox('closetFrame_rok_' + uid + '_' + i + '_l', {
                                width: rLen, height: rThick, depth: rWidth
                            }, this.scene);
                            rMesh.position.set(localX, localY - FRAME_THICKNESS / 2 - rThick / 2, offsetCross);
                        } else if (dir === 'right') {
                            rMesh = BABYLON.MeshBuilder.CreateBox('closetFrame_rok_' + uid + '_' + i + '_r', {
                                width: rLen, height: rThick, depth: rWidth
                            }, this.scene);
                            rMesh.position.set(localX, localY + FRAME_THICKNESS / 2 + rThick / 2, offsetCross);
                        }
                    }

                    if (rMesh) {
                        rMesh.material = matR;
                        rMesh.parent = group;
                        rMesh.isPickable = false;
                    }
                }
            }

            // سیستم قدیمی درب تیرمحور (اگر frameCellDoors نباشد)
            if (!unit.frameCellDoors) {
                const doorCfg = framePartDoors[part.id];
                if (doorCfg && doorCfg.showDoors !== false) {
                    if (doorCfg.leftEnabled) {
                        this._addClosetPartDoor(group, doorCfg, localX, localY, pW, pH, frameDepth, 'left', uid + '_' + i + '_L');
                    }
                    if (doorCfg.rightEnabled) {
                        this._addClosetPartDoor(group, doorCfg, localX, localY, pW, pH, frameDepth, 'right', uid + '_' + i + '_R');
                    }
                }
            }
        }

        // درب‌های خانه‌ای
        if (unit.frameCellDoors) {
            this._addClosetCellDoors(group, unit, minX, totalWidth, frameDepth, uid);
        }

        // کشوهای بخش‌های چهارچوب (معمولی / مخفی / ریلی)
        if (unit.frameCellDrawers) {
            try { this._addClosetFrameCellDrawers(group, unit, minX, totalWidth, frameDepth, uid); } catch (e) {}
        }

        // بغل‌نما (left/right object مثل Three)
        if (unit.sideFacades && (unit.sideFacades.left || unit.sideFacades.right)) {
            this._addClosetSideFacades(group, unit, minX, totalWidth, frameDepth, uid);
        }

        // ایینه (unit.ayene)
        if (unit.ayene && unit.ayene.enabled) {
            try { this._addClosetAyene(group, unit, minX, totalWidth, frameDepth, uid); } catch (e) {
                try { console.warn('[BJS] closet ayene', e); } catch (e2) {}
            }
        }

        // طبقات چهارچوب کمد — عین view3d.js renderSingleClosetFrame
        if (unit.shelves && unit.shelves.length > 0) {
            try {
                const shelfDepthVal = parseFloat(unit.shelfBodyDepth) || frameDepth;
                const unitH = parseFloat(unit.h) || 280;
                const shelvesGroup = new BABYLON.TransformNode('closetFrameShelves_' + uid, this.scene);
                shelvesGroup.parent = group;
                // کل عمق طبقه پشت چهارچوب (سمت داخل)
                shelvesGroup.position.set(
                    0,
                    unitH / 2,
                    -(frameDepth / 2) - (shelfDepthVal / 2)
                );
                const shelfCab = {
                    w: totalWidth,
                    h: unitH,
                    d: shelfDepthVal,
                    id: unit.id || uid,
                    shelves: unit.shelves,
                    shelvesColor: unit.shelvesColor,
                    bodyColor: unit.shelvesColor || unit.bodyColor,
                    shelvesFinish: unit.shelvesFinish,
                    isClosetFrame: true
                };
                const thick = 1.6;
                this._createShelves(
                    shelvesGroup,
                    shelfCab,
                    totalWidth,
                    unitH,
                    shelfDepthVal,
                    thick,
                    null,
                    'cf_' + uid
                );
            } catch (e) {
                console.warn('[BJS] closet frame shelves', e);
            }
        }

        // موقعیت و چرخش — عین Three
        const centerX = (parseFloat(unit.x) || 0) + totalWidth / 2;
        const centerZ = (parseFloat(unit.y) || 0) + frameDepth / 2;
        group.position.set(centerX, elev, centerZ);
        const effectiveRot = (4 - (parseInt(unit.rot, 10) || 0)) % 4;
        group.rotation.y = effectiveRot * (Math.PI / 2);

        // صفحه بازتاب آیینه باید بعد از جای‌گذاری گروهی محاسبه شود
        if (unit.ayene && unit.ayene.enabled) {
            const selfAy = this;
            const grpAy = group;
            try { selfAy._refreshClosetAyeneMirror(grpAy); } catch (eAy) {}
            setTimeout(function () { try { selfAy._refreshClosetAyeneMirror(grpAy); } catch (e2) {} }, 80);
            setTimeout(function () { try { selfAy._refreshClosetAyeneMirror(grpAy); } catch (e3) {} }, 250);
        }
    },

    /**
     * درب کناری روی قطعه عمودی — ساده (بدون انیمیشن کامل)
     * FORWARD_OFFSET = 1.6 مثل Three
     */
    _addClosetPartDoor: function (group, doorCfg, localX, localY, pW, pH, frameDepth, side, id) {
        const FORWARD = 1.6;
        const doorThick = 1.6;
        const doorH = pH;
        const doorW = Math.max(10, (doorCfg.width || 40));
        const dir = (side === 'left') ? -1 : 1;

        const mat = new BABYLON.StandardMaterial('closetDoor_' + id, this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);

        // hinge روی لبه قطعه
        const hinge = new BABYLON.TransformNode('closetDoorHinge_' + id, this.scene);
        hinge.parent = group;
        hinge.position.set(
            localX + dir * (pW / 2),
            localY,
            frameDepth / 2 + FORWARD
        );

        const door = BABYLON.MeshBuilder.CreateBox('closetFrame_door_' + id, {
            width: doorW, height: doorH, depth: doorThick
        }, this.scene);
        door.position.set(dir * (doorW / 2), 0, doorThick / 2);
        door.material = mat;
        door.parent = hinge;
        door.isPickable = false;
        door.metadata = { isClosetDoor: true };
    },

    /**
     * درب‌های خانه‌ای چهارچوب — از unit.frameCellDoors
     */
    _addClosetCellDoors: function (group, unit, minX, totalWidth, frameDepth, uid) {
        const cellDoors = unit.frameCellDoors || {};
        if (!Object.keys(cellDoors).length) return;

        // هندسه خانه‌ها از detectClosetFrameCells (مثل Three) — نه از خود frameCellDoors
        let cells = [];
        if (typeof window.detectClosetFrameCells === 'function') {
            try { cells = window.detectClosetFrameCells(unit) || []; } catch (e) { cells = []; }
        }
        if (!cells.length) return;

        const SIDE_ORDER = ['left', 'right', 'top', 'bottom'];
        const frontRokoobT = (typeof this._getClosetFrontRokoobThickness === 'function')
            ? this._getClosetFrontRokoobThickness(unit)
            : 0;
        const OVERLAP = 1.6;
        const doorThick = 1.6;
        const self = this;

        function makeDoorMat(cfg, matId) {
            cfg = cfg || {};
            const mat = new BABYLON.StandardMaterial(matId, self.scene);
            mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
            let col = cfg.doorColor || cfg.color || '#ffffff';
            if (col && typeof col === 'object' && col.value) col = col.value;
            if (typeof col === 'string' && col.charAt(0) === '#') {
                mat.diffuseColor = self._hexStrToColor3(col);
            } else if (typeof col === 'string' && (col.indexOf('http') >= 0 || col.indexOf('/') >= 0)) {
                try {
                    const tex = new BABYLON.Texture(col, self.scene, false, true);
                    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                    mat.diffuseTexture = tex;
                    mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
                } catch (e) {
                    mat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
                }
            } else {
                mat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
            }
            if (cfg.isGlassDoor) {
                mat.alpha = 0.35;
                mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            }
            return mat;
        }

        function addBarHandle(parent, doorW, doorH, hingeSide, id) {
            try {
                const isVert = (hingeSide === 'left' || hingeSide === 'right');
                const handleLen = isVert
                    ? Math.min(16, Math.max(10, doorH * 0.22))
                    : Math.min(16, Math.max(10, doorW * 0.22));
                const hMat = new BABYLON.StandardMaterial('cfHandleMat_' + id, self.scene);
                hMat.diffuseColor = new BABYLON.Color3(0.78, 0.78, 0.78);
                hMat.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
                hMat.specularPower = 64;
                const bar = BABYLON.MeshBuilder.CreateCylinder('cfHandle_' + id, {
                    diameter: 0.9, height: handleLen, tessellation: 12
                }, self.scene);
                if (!isVert) bar.rotation.z = Math.PI / 2;
                if (hingeSide === 'left') bar.position.set(doorW / 2 - 3, 0, doorThick / 2 + 1.2);
                else if (hingeSide === 'right') bar.position.set(-(doorW / 2 - 3), 0, doorThick / 2 + 1.2);
                else if (hingeSide === 'bottom') bar.position.set(0, doorH / 2 - 3, doorThick / 2 + 1.2);
                else bar.position.set(0, -(doorH / 2 - 3), doorThick / 2 + 1.2);
                bar.material = hMat;
                bar.parent = parent;
                bar.isPickable = false;
            } catch (e) {}
        }

        function addSlidingDoors(cell, cellCfg) {
            self._addClosetSlidingDoors(group, unit, cell, cellCfg, minX, totalWidth, frameDepth, frontRokoobT, uid);
        }

        for (let ci = 0; ci < cells.length; ci++) {
            const cell = cells[ci];
            if (!cell || cell.w < 2 || cell.h < 2) continue;
            const cellCfg = cellDoors[cell.id];
            if (!cellCfg) continue;

            // مهاجرت فرمت قدیمی → sides
            let sidesMap = cellCfg.sides;
            if (!sidesMap) {
                sidesMap = {};
                if (cellCfg.enabled === true) {
                    const hs = cellCfg.hingeSide || 'left';
                    sidesMap[hs] = Object.assign({}, cellCfg, { enabled: true });
                }
            }

            const cellDoorType = cellCfg.doorType || (sidesMap.left && sidesMap.left.doorType) || 'side';
            const cellEnabled = cellCfg.enabled === true ||
                SIDE_ORDER.some(function (s) { return sidesMap[s] && sidesMap[s].enabled === true; });

            if (cellEnabled && cellDoorType === 'sliding' && cellCfg.showDoors !== false) {
                addSlidingDoors(cell, cellCfg);
                continue;
            }

            const leftOn = sidesMap.left && sidesMap.left.enabled === true && sidesMap.left.showDoors !== false;
            const rightOn = sidesMap.right && sidesMap.right.enabled === true && sidesMap.right.showDoors !== false;
            function isHorizType(tt) { return !tt || tt === 'side' || tt === 'lift-side'; }
            const bothLeftRightHoriz = leftOn && rightOn &&
                isHorizType(sidesMap.left.doorType) && isHorizType(sidesMap.right.doorType);

            for (let si = 0; si < SIDE_ORDER.length; si++) {
                const hingeSide = SIDE_ORDER[si];
                const cfg = sidesMap[hingeSide];
                if (!cfg || cfg.enabled !== true || cfg.showDoors === false) continue;

                const doorCount = Math.max(1, cfg.doors || 1);
                const doorMat = makeDoorMat(cfg, 'cfDoorMat_' + uid + '_' + cell.id + '_' + hingeSide);

                let defaultW = cell.w + OVERLAP * 2;
                const defaultH = cell.h + 3;
                if (bothLeftRightHoriz && (hingeSide === 'left' || hingeSide === 'right')) {
                    defaultW = (cell.w + 2) / 2 - 0.1;
                }

                for (let i = 0; i < doorCount; i++) {
                    let doorW = defaultW / doorCount;
                    let doorH = defaultH;
                    if (hingeSide === 'top' || hingeSide === 'bottom') {
                        doorW = cell.w + 3;
                        doorH = (cell.h + OVERLAP * 2) / doorCount;
                    }
                    const sizes = (cfg.doorSizes && cfg.doorSizes[i]) ? cfg.doorSizes[i] : null;
                    if (sizes) {
                        if (sizes.w && !isNaN(parseFloat(sizes.w))) doorW = parseFloat(sizes.w);
                        if (sizes.h && !isNaN(parseFloat(sizes.h))) doorH = parseFloat(sizes.h);
                    }

                    const cellCenterX = (cell.x - minX) - (totalWidth / 2) + cell.w / 2;
                    const cellCenterY = cell.y + cell.h / 2;
                    const spanW = (hingeSide === 'left' || hingeSide === 'right') ? defaultW : (cell.w + 3);
                    const spanH = (hingeSide === 'top' || hingeSide === 'bottom') ? (cell.h + OVERLAP * 2) : defaultH;
                    const offsetX = (hingeSide === 'left' || hingeSide === 'right')
                        ? (i - (doorCount - 1) / 2) * (spanW / doorCount) : 0;
                    const offsetY = (hingeSide === 'top' || hingeSide === 'bottom')
                        ? (i - (doorCount - 1) / 2) * (spanH / doorCount) : 0;

                    let hingeDirX = 0, hingeDirY = 0, axis = 'y', openDirection = -1;
                    const doorZ = (frameDepth / 2) + frontRokoobT + (doorThick / 2);

                    const hinge = new BABYLON.TransformNode(
                        'closetCellHinge_' + uid + '_' + cell.id + '_' + hingeSide + '_' + i,
                        self.scene
                    );
                    hinge.parent = group;

                    if (hingeSide === 'left') {
                        hingeDirX = -1; axis = 'y'; openDirection = -1;
                        if (bothLeftRightHoriz) {
                            hinge.position.set(cellCenterX - cell.w / 2 - 1 + offsetX, cellCenterY + offsetY, doorZ);
                        } else {
                            hinge.position.set(cellCenterX + offsetX - doorW / 2, cellCenterY + offsetY, doorZ);
                        }
                    } else if (hingeSide === 'right') {
                        hingeDirX = 1; axis = 'y'; openDirection = 1;
                        if (bothLeftRightHoriz) {
                            hinge.position.set(cellCenterX + cell.w / 2 + 1 + offsetX, cellCenterY + offsetY, doorZ);
                        } else {
                            hinge.position.set(cellCenterX + offsetX + doorW / 2, cellCenterY + offsetY, doorZ);
                        }
                    } else if (hingeSide === 'bottom') {
                        hingeDirY = -1; axis = 'x'; openDirection = -1;
                        hinge.position.set(cellCenterX + offsetX, cellCenterY + offsetY - doorH / 2, doorZ);
                    } else {
                        hingeDirY = 1; axis = 'x'; openDirection = 1;
                        hinge.position.set(cellCenterX + offsetX, cellCenterY + offsetY + doorH / 2, doorZ);
                    }

                    const doorMesh = BABYLON.MeshBuilder.CreateBox(
                        'closetFrame_cellDoor_' + uid + '_' + cell.id + '_' + hingeSide + '_' + i,
                        { width: Math.max(0.5, doorW), height: Math.max(0.5, doorH), depth: doorThick },
                        self.scene
                    );
                    // مرکز درب نسبت به لولا: لبه لولا روی محور چرخش
                    doorMesh.position.set(-hingeDirX * (doorW / 2), -hingeDirY * (doorH / 2), 0);
                    doorMesh.material = doorMat;
                    doorMesh.parent = hinge;
                    doorMesh.isPickable = true;

                    const hingeId = 'cfDoor_' + uid + '_' + cell.id + '_' + hingeSide + '_' + i;
                    const targetOpenAngle = (axis === 'x') ? -1.6 : (openDirection * (Math.PI / 2));
                    hinge.metadata = {
                        isHinge: true,
                        isDoorGroup: true,
                        hingeId: hingeId,
                        axis: axis,
                        openDirection: openDirection,
                        targetOpenAngle: targetOpenAngle,
                        maxAngle: targetOpenAngle
                    };
                    doorMesh.metadata = {
                        isDoor: true,
                        isDoorPart: true,
                        isClosetFrameDoor: true,
                        isOpen: false,
                        openDirection: openDirection,
                        axis: axis,
                        hingeId: hingeId,
                        hingeNode: hinge,
                        closetCellId: cell.id,
                        hingeSide: hingeSide,
                        targetOpenAngle: targetOpenAngle
                    };

                    addBarHandle(doorMesh, doorW, doorH, hingeSide, hingeId);
                }
            }
        }
    },


    /**
     * ضخامت روکوب در جهات نما — معادل getClosetRokoobInsets در view3d.js
     */
    _getClosetRokoobInsets: function (unit) {
        const out = { left: 0, right: 0, top: 0, bottom: 0, front: 0 };
        const list = (unit && unit.rokoobParts) ? unit.rokoobParts : [];
        const parts = (unit && unit.parts) ? unit.parts : [];
        function thick(d) {
            if (!d || d.enabled !== true) return 0;
            const t = parseFloat(d.thickness);
            return isNaN(t) ? 1.6 : t;
        }
        for (let i = 0; i < list.length; i++) {
            const rp = list[i];
            if (!rp || !rp.directions) continue;
            const framePart = parts.find(function (p) { return p && p.id === rp.partId; });
            const orient = framePart ? framePart.orientation : 'vertical';
            const d = rp.directions;
            if (orient === 'horizontal') {
                out.front = Math.max(out.front, thick(d.left));
                out.top = Math.max(out.top, thick(d.top));
                out.bottom = Math.max(out.bottom, thick(d.bottom));
            } else {
                out.front = Math.max(out.front, thick(d.top));
                out.left = Math.max(out.left, thick(d.left));
                out.right = Math.max(out.right, thick(d.right));
                out.bottom = Math.max(out.bottom, thick(d.bottom));
            }
        }
        return out;
    },

    /**
     * درب ریلی چهارچوب کمد — معادل addClosetSlidingDoors در view3d.js
     * چیدمان لایه‌ای در عمق، دستگیره لبه H، غلطک بالا/پایین، openX/closedX
     */
    _addClosetSlidingDoors: function (group, unit, cell, cellCfg, minX, totalWidth, frameDepth, frontRokoobT, uid) {
        if (!group || !cell || !this.scene) return;
        const scene = this.scene;
        const self = this;
        const doorCount = Math.max(1, cellCfg.doors || 2);
        const doorThick = 1.6;
        const rollerClear = 2.5;
        const EDGE_INSET = 2;

        const rok = this._getClosetRokoobInsets(unit);
        const leftRok = rok.left || 0;
        const rightRok = rok.right || 0;
        const topRok = rok.top || 0;
        const bottomRok = rok.bottom || 0;
        const frontRok = frontRokoobT || rok.front || 0;

        let usableW = cell.w - leftRok - rightRok;
        let usableH = cell.h - rollerClear - topRok - bottomRok;
        usableW = Math.max(usableW, 1);
        usableH = Math.max(usableH, 1);
        const defaultEachW = usableW / doorCount;

        // متریال درب
        const mat = new BABYLON.StandardMaterial('cfSlideMat_' + uid + '_' + cell.id, scene);
        mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
        let col = cellCfg.doorColor || cellCfg.color || '#ffffff';
        if (col && typeof col === 'object' && col.value) col = col.value;
        if (typeof col === 'string' && col.charAt(0) === '#') {
            mat.diffuseColor = this._hexStrToColor3(col);
        } else if (typeof col === 'string' && (col.indexOf('http') >= 0 || col.indexOf('/') >= 0)) {
            try {
                const tex = new BABYLON.Texture(col, scene, false, true);
                tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                mat.diffuseTexture = tex;
                mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
            } catch (e) {
                mat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
            }
        } else {
            mat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        }
        if (cellCfg.isGlassDoor) {
            mat.alpha = 0.35;
            mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        }

        const cellCenterX = (cell.x - minX) - (totalWidth / 2) + cell.w / 2;
        const openBottomY = cell.y + bottomRok;
        const openTopY = cell.y + cell.h - topRok;
        const openMidY = (openBottomY + openTopY) / 2;
        const cellLeft = cellCenterX - cell.w / 2;
        const cellRight = cellCenterX + cell.w / 2;
        const frontFaceZ = (frameDepth / 2) + frontRok;

        const hMat = new BABYLON.StandardMaterial('cfSlideHandleMat_' + uid + '_' + cell.id, scene);
        hMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        hMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        hMat.specularPower = 48;

        const metalMat = new BABYLON.StandardMaterial('cfSlideRollerMat_' + uid, scene);
        metalMat.diffuseColor = new BABYLON.Color3(0.72, 0.72, 0.74);
        metalMat.specularColor = new BABYLON.Color3(0.55, 0.55, 0.55);
        metalMat.specularPower = 64;
        const darkMetal = new BABYLON.StandardMaterial('cfSlideDark_' + uid, scene);
        darkMetal.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.26);
        darkMetal.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        const wheelMat = new BABYLON.StandardMaterial('cfSlideWheel_' + uid, scene);
        wheelMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);

        function makeSlidingEdgeHandle(doorH, onRightEdge, id) {
            const handleRoot = new BABYLON.TransformNode('cfSlideHandle_' + id, scene);
            const s = onRightEdge ? 1 : -1;
            const H = Math.max(doorH - 2, doorH * 0.96);
            const SLOT = doorThick;
            const OUT = 2.0;
            const tt = 0.14;
            // کانال U روی لبه ورق
            const web = BABYLON.MeshBuilder.CreateBox('cfHweb_' + id, {
                width: tt, height: H, depth: SLOT
            }, scene);
            web.position.set(s * (tt / 2), 0, 0);
            web.material = hMat; web.parent = handleRoot; web.isPickable = false;
            // باله بیرونی برای دست
            const lip = BABYLON.MeshBuilder.CreateBox('cfHlip_' + id, {
                width: OUT, height: H, depth: tt
            }, scene);
            lip.position.set(s * (SLOT / 2 + OUT / 2), 0, SLOT / 2 - tt / 2);
            // در Three: web on edge, OUT protrudes forward (Z+) for grip
            // Adjust: outer grip faces room
            lip.position.set(s * (tt / 2), 0, SLOT / 2 + OUT / 2);
            lip.material = hMat; lip.parent = handleRoot; lip.isPickable = false;
            // اتصال
            const join = BABYLON.MeshBuilder.CreateBox('cfHjoin_' + id, {
                width: tt, height: H, depth: OUT * 0.3
            }, scene);
            join.position.set(s * (tt / 2), 0, SLOT / 2 + OUT * 0.15);
            join.material = hMat; join.parent = handleRoot; join.isPickable = false;
            return handleRoot;
        }

        function makeSlidingRoller(isTop, id) {
            const g = new BABYLON.TransformNode('cfRoller_' + id, scene);
            const PROTRUDE = 0.5;
            // صفحه اتصال
            const plate = BABYLON.MeshBuilder.CreateBox('cfRpl_' + id, {
                width: 1.4, height: 0.35, depth: doorThick * 0.9
            }, scene);
            plate.position.set(0, isTop ? -0.15 : 0.15, 0);
            plate.material = metalMat; plate.parent = g; plate.isPickable = false;
            // فنرها
            [-0.4, 0.4].forEach(function (sx, si) {
                const spring = BABYLON.MeshBuilder.CreateCylinder('cfRsp_' + id + '_' + si, {
                    diameter: 0.16, height: 0.7, tessellation: 8
                }, scene);
                spring.rotation.z = Math.PI / 2;
                spring.position.set(sx, isTop ? -0.28 : 0.28, -doorThick / 2 - PROTRUDE * 0.15);
                spring.material = darkMetal; spring.parent = g; spring.isPickable = false;
            });
            const wheelZ = -doorThick / 2 - PROTRUDE * 0.35;
            const housing = BABYLON.MeshBuilder.CreateCylinder('cfRhs_' + id, {
                diameter: 1.4, height: 0.28, tessellation: 16
            }, scene);
            housing.rotation.x = Math.PI / 2;
            housing.position.set(0, isTop ? 0.4 : -0.4, wheelZ);
            housing.material = metalMat; housing.parent = g; housing.isPickable = false;
            const wheel = BABYLON.MeshBuilder.CreateCylinder('cfRwh_' + id, {
                diameter: 1.3, height: 0.32, tessellation: 18
            }, scene);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(0, isTop ? 0.52 : -0.52, wheelZ);
            wheel.material = wheelMat; wheel.parent = g; wheel.isPickable = false;
            return g;
        }

        function attachRollersToDoor(doorMesh, doorW, doorH, baseId) {
            const EDGE_FROM = 5;
            const halfW = doorW / 2;
            const inset = Math.min(EDGE_FROM, Math.max(1.5, halfW - 1.2));
            const positions = [
                { x: -halfW + inset, y: -doorH / 2, top: false },
                { x: halfW - inset, y: -doorH / 2, top: false },
                { x: -halfW + inset, y: doorH / 2, top: true },
                { x: halfW - inset, y: doorH / 2, top: true }
            ];
            for (let pi = 0; pi < positions.length; pi++) {
                const p = positions[pi];
                const roller = makeSlidingRoller(p.top, baseId + '_r' + pi);
                roller.parent = doorMesh;
                roller.position.set(p.x, p.y, 0);
            }
        }

        const innerLeft = cellLeft + EDGE_INSET + leftRok;
        const innerRight = cellRight - EDGE_INSET - rightRok;
        const spanW = Math.max(innerRight - innerLeft, 1);

        for (let i = 0; i < doorCount; i++) {
            let doorW = defaultEachW;
            let doorH = usableH;
            const sizes = (cellCfg.doorSizes && cellCfg.doorSizes[i]) ? cellCfg.doorSizes[i] : null;
            if (sizes) {
                if (sizes.w && !isNaN(parseFloat(sizes.w))) doorW = parseFloat(sizes.w);
                if (sizes.h && !isNaN(parseFloat(sizes.h))) doorH = parseFloat(sizes.h);
            }

            // چیدمان افقی بسته: از چپ به راست
            const closedX = innerLeft + doorW / 2 + i * (spanW / doorCount);
            // عمق لایه‌ای: درب اول ۲ سانت داخل، دوم ۴، ...
            const insetDepth = 2 + i * 2;
            const layerZ = frontFaceZ - insetDepth - doorThick / 2;
            const doorCenterY = openMidY;

            const doorId = uid + '_' + cell.id + '_s' + i;
            const doorMesh = BABYLON.MeshBuilder.CreateBox(
                'closetFrame_slideDoor_' + doorId,
                { width: Math.max(0.5, doorW), height: Math.max(0.5, doorH), depth: doorThick },
                scene
            );
            // پیش‌فرض: درب‌های ریلی باز (روی openX)
            const isLeftDoor = (i % 2 === 0);
            const minCenter = innerLeft + doorW / 2;
            const maxCenter = innerRight - doorW / 2;
            const openX = isLeftDoor ? maxCenter : minCenter;
            doorMesh.position.set(openX, doorCenterY, layerZ);
            doorMesh.material = mat;
            doorMesh.parent = group;
            doorMesh.isPickable = true;

            // دستگیره لبه H
            const onRightEdge = isLeftDoor;
            const handleLocalX = onRightEdge ? (doorW / 2) : (-doorW / 2);
            const handleGroup = makeSlidingEdgeHandle(doorH, onRightEdge, doorId);
            handleGroup.parent = doorMesh;
            handleGroup.position.set(handleLocalX, 0, 0);

            // غلطک‌ها
            attachRollersToDoor(doorMesh, doorW, doorH, doorId);

            doorMesh.metadata = {
                isDoor: true,
                isSlidingDoor: true,
                isOpen: true,
                closedX: closedX,
                openX: openX,
                targetX: openX,
                isClosetFrameDoor: true,
                closetCellId: cell.id,
                doorIndex: i
            };
        }
    },

    /**
     * بغل‌نما چپ/راست چهارچوب
     */
    /**
     * بغل‌نما چپ/راست چهارچوب — معادل addClosetFrameSideFacades
     * unit.sideFacades = { left: {enabled, width, height, frontOffset, color, colorName, finish}, right: {...} }
     */
    /**
     * آیینه — حالت آزمایشی سه‌مرحله‌ای
     * AYENE_EXPERIMENT:
     *   1 = فقط متریال نقره‌ای روشن، بدون بازتاب (آزمایش هندسه/متریال)
     *   2 = MirrorTexture + صفحه بازتاب (آزمایش جهت mirrorPlane)
     *   3 = مثل ۲ + لاگ کامل renderList و اطمینان از تولید تصویر
     */
    _addClosetAyene: function (group, unit, minX, totalWidth, frameDepth, uid) {
        if (!group || !unit || !this.scene) return;
        const cfg = unit.ayene;
        if (!cfg || !cfg.enabled) return;

        // ===== آزمایش ۲: MirrorTexture + جهت صفحه =====
        const AYENE_EXPERIMENT = 2;

        const FRAME_THICKNESS = 5.5;
        let minY = Infinity;
        let maxY = -Infinity;
        const parts = unit.parts || [];
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;
            const pH = part.orientation === 'vertical' ? part.length : FRAME_THICKNESS;
            minY = Math.min(minY, part.y);
            maxY = Math.max(maxY, part.y + pH);
        }
        if (!Number.isFinite(minY)) {
            minY = 0;
            maxY = parseFloat(unit.h) || 220;
        }

        const frameH = Math.max(1, maxY - minY);
        const frameW = Math.max(1, parseFloat(totalWidth) || 1);
        let mw = parseFloat(cfg.width);
        let mh = parseFloat(cfg.height);
        if (isNaN(mw) || mw <= 0) mw = Math.min(40, frameW);
        if (isNaN(mh) || mh <= 0) mh = Math.min(120, frameH);
        mw = Math.min(mw, frameW + 20);
        mh = Math.min(mh, frameH + 20);

        const placement = cfg.placement || 'front';
        const FORWARD = 0.4;
        const glassThick = 0.8;

        let localX = 0;
        let localY = minY + mh / 2 + Math.max(0, (frameH - mh) / 2);
        let localZ = 0;
        let rotY = 0;

        if (placement === 'side-left') {
            localX = -frameW / 2 - FORWARD - glassThick / 2;
            rotY = -Math.PI / 2;
        } else if (placement === 'side-right') {
            localX = frameW / 2 + FORWARD + glassThick / 2;
            rotY = Math.PI / 2;
        } else if (placement === 'inside') {
            localZ = -(frameDepth / 2) - FORWARD - glassThick / 2;
            rotY = Math.PI;
        } else {
            localZ = (frameDepth / 2) + FORWARD + glassThick / 2;
            rotY = 0;
        }

        const root = new BABYLON.TransformNode('closetFrame_ayeneRoot_' + uid, this.scene);
        root.parent = group;
        root.position.set(localX, localY, localZ);
        root.rotation.y = rotY;

        // پشت مات
        const backMat = new BABYLON.StandardMaterial('closetAyeneBackMat_' + uid, this.scene);
        backMat.diffuseColor = new BABYLON.Color3(0.35, 0.35, 0.37);
        backMat.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.045);
        backMat.specularColor = BABYLON.Color3.Black();
        backMat.backFaceCulling = true;
        backMat.disableLighting = false;
        const backPlate = BABYLON.MeshBuilder.CreatePlane('closetFrame_ayeneBack_' + uid, {
            width: mw, height: mh, sideOrientation: BABYLON.Mesh.FRONTSIDE
        }, this.scene);
        backPlate.rotation.y = Math.PI;
        backPlate.position.z = -glassThick / 2;
        backPlate.material = backMat;
        backPlate.parent = root;
        backPlate.isPickable = false;
        backPlate.metadata = { isClosetAyene: true, side: 'back' };

        // هسته نازک‌تر تا جلوی صفحه را نپوشاند
        const coreMat = new BABYLON.StandardMaterial('closetAyeneCoreMat_' + uid, this.scene);
        coreMat.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.22);
        coreMat.disableLighting = true;
        const core = BABYLON.MeshBuilder.CreateBox('closetFrame_ayeneCore_' + uid, {
            width: mw * 0.98, height: mh * 0.98, depth: 0.25
        }, this.scene);
        core.material = coreMat;
        core.parent = root;
        core.isPickable = false;
        core.metadata = { isClosetAyene: true, side: 'core' };
        // در آزمایش ۱ هسته را مخفی کن تا سیاهی وسط دیده نشود
        if (AYENE_EXPERIMENT === 1) {
            core.isVisible = false;
        }

        // ——— رویه جلو ———
        const frontMat = new BABYLON.StandardMaterial('closetAyeneMat_' + uid, this.scene);
        frontMat.backFaceCulling = true;

        if (AYENE_EXPERIMENT === 1) {
            // ===== آزمایش ۱: بدون بازتاب — نقره‌ای روشن اجباری =====
            frontMat.disableLighting = true;
            frontMat.diffuseColor = new BABYLON.Color3(0.85, 0.88, 0.92);
            frontMat.emissiveColor = new BABYLON.Color3(0.75, 0.78, 0.85);
            frontMat.specularColor = BABYLON.Color3.Black();
            frontMat.reflectionTexture = null;
            frontMat.backFaceCulling = false;
            try { console.log('[AYENE-EXP1] silver DOUBLESIDE, NO reflection', uid); } catch (e) {}
        } else {
            // آزمایش ۲ و ۳: متریال آماده بازتاب
            frontMat.disableLighting = false;
            frontMat.diffuseColor = new BABYLON.Color3(0.25, 0.27, 0.30);
            frontMat.specularColor = new BABYLON.Color3(0.9, 0.9, 0.95);
            frontMat.specularPower = 128;
            frontMat.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.22);
            frontMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.025);
        }

        // بازگشت به حالتی که بازتاب از جلو درست بود (بدون چرخش ۱۸۰)
        const frontPlate = BABYLON.MeshBuilder.CreatePlane('closetFrame_ayene_' + uid, {
            width: mw, height: mh, sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, this.scene);
        frontPlate.position.z = glassThick / 2 + 0.08;
        frontPlate.parent = root;
        frontPlate.isPickable = false;
        frontPlate.metadata = { isClosetAyene: true, side: 'front', experiment: AYENE_EXPERIMENT };
        frontMat.backFaceCulling = false;
        frontPlate.material = frontMat;
        // renderingGroupId نگذار — وگرنه از پشت دیوار هم دیده می‌شود

        let mirrorTex = null;
        if (AYENE_EXPERIMENT >= 2 && typeof BABYLON.MirrorTexture === 'function') {
            try {
                const size = this._isMobile ? 512 : 1024;
                mirrorTex = new BABYLON.MirrorTexture('closetAyeneMirrorTex_' + uid, size, this.scene, true);
                mirrorTex.level = 1;
                mirrorTex.clearColor = new BABYLON.Color4(0.5, 0.55, 0.6, 1);
                try { mirrorTex.refreshRate = 1; } catch (eR) {}
                frontMat.reflectionTexture = mirrorTex;
                frontPlate.metadata.mirrorTexture = mirrorTex;
                try { console.log('[AYENE-EXP' + AYENE_EXPERIMENT + '] MirrorTexture created'); } catch (e) {}
            } catch (eM) {
                try { console.warn('[AYENE] MirrorTexture failed', eM); } catch (e2) {}
            }
        }

        if (!group.metadata) group.metadata = {};
        group.metadata.ayeneMirror = {
            frontPlate: frontPlate,
            material: frontMat,
            mirrorTex: mirrorTex,
            root: root,
            placement: placement,
            experiment: AYENE_EXPERIMENT,
            // آزمایش ۲: 0 = نرمال داخل از (0,0,-1)، 1 = برعکس
            planeMode: 0
        };

        // قاب
        const frameMat = new BABYLON.StandardMaterial('closetAyeneFrameMat_' + uid, this.scene);
        frameMat.diffuseColor = new BABYLON.Color3(0.45, 0.47, 0.5);
        frameMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        const border = 1.5;
        const strips = [
            { w: mw + border * 2, h: border, x: 0, y: mh / 2 + border / 2 },
            { w: mw + border * 2, h: border, x: 0, y: -mh / 2 - border / 2 },
            { w: border, h: mh + border * 2, x: -mw / 2 - border / 2, y: 0 },
            { w: border, h: mh + border * 2, x: mw / 2 + border / 2, y: 0 }
        ];
        for (let s = 0; s < strips.length; s++) {
            const st = strips[s];
            const fr = BABYLON.MeshBuilder.CreateBox('closetFrame_ayeneFr_' + uid + '_' + s, {
                width: st.w, height: st.h, depth: glassThick + 0.4
            }, this.scene);
            fr.position.set(st.x, st.y, 0);
            fr.material = frameMat;
            fr.parent = root;
            fr.isPickable = false;
        }

    },

    /**
     * آزمایش ۲ و ۳: تنظیم mirrorPlane + renderList + لاگ
     */
    _refreshClosetAyeneMirror: function (group) {
        if (!group || !group.metadata || !group.metadata.ayeneMirror || !this.scene) return;
        const info = group.metadata.ayeneMirror;
        const frontPlate = info.frontPlate;
        const mirrorTex = info.mirrorTex;
        const mat = info.material;
        const exp = info.experiment || 1;
        if (!frontPlate || !mat) return;

        // آزمایش ۱: فقط متریال نقره‌ای
        if (exp === 1) {
            try {
                mat.reflectionTexture = null;
                mat.disableLighting = true;
                mat.diffuseColor = new BABYLON.Color3(0.85, 0.88, 0.92);
                mat.emissiveColor = new BABYLON.Color3(0.7, 0.74, 0.8);
                mat.backFaceCulling = false;
            } catch (e0) {}
            return;
        }

        if (!mirrorTex) {
            try {
                mat.disableLighting = true;
                mat.emissiveColor = new BABYLON.Color3(0.5, 0.2, 0.2);
                console.warn('[AYENE] no MirrorTexture');
            } catch (e0) {}
            return;
        }

        try {
            if (group.computeWorldMatrix) group.computeWorldMatrix(true);
            if (info.root && info.root.computeWorldMatrix) info.root.computeWorldMatrix(true);
            frontPlate.computeWorldMatrix(true);

            const pos = frontPlate.getAbsolutePosition().clone();
            const wm = frontPlate.getWorldMatrix();

            // نرمال محلی صفحه: +Z بیرون؛ داخل آیینه: (0,0,-1)
            // planeMode 0 → داخل، planeMode 1 → بیرون (برای تست جهت)
            const localN = (info.planeMode === 1)
                ? new BABYLON.Vector3(0, 0, 1)
                : new BABYLON.Vector3(0, 0, -1);
            let worldN = BABYLON.Vector3.TransformNormal(localN, wm);
            if (worldN.lengthSquared() < 1e-10) worldN = localN.clone();
            worldN.normalize();

            let plane;
            if (typeof BABYLON.Plane.FromPositionAndNormal === 'function') {
                plane = BABYLON.Plane.FromPositionAndNormal(pos, worldN);
            } else {
                plane = new BABYLON.Plane(worldN.x, worldN.y, worldN.z, -BABYLON.Vector3.Dot(worldN, pos));
            }
            mirrorTex.mirrorPlane = plane;

            // renderList
            const list = [];
            const names = [];
            const meshes = this.scene.meshes || [];
            for (let i = 0; i < meshes.length; i++) {
                const m = meshes[i];
                if (!m) continue;
                const n = m.name || '';
                if (m === frontPlate) continue;
                if (n.indexOf('closetFrame_ayeneBack_') === 0) continue;
                if (n.indexOf('closetFrame_ayeneCore_') === 0) continue;
                if (n.indexOf('closetFrame_ayeneFr_') === 0) continue;
                if (n.indexOf('closetFrame_ayene_') === 0 && n.indexOf('TestBall') < 0) continue;
                if (m.metadata && m.metadata.isClosetAyene && m.metadata.side === 'front') continue;
                try {
                    if (typeof m.isEnabled === 'function' && !m.isEnabled()) continue;
                } catch (eEn) {}
                list.push(m);
                if (names.length < 12) names.push(n || '(unnamed)');
            }
            mirrorTex.renderList = list;
            mirrorTex.level = 1;
            try { mirrorTex.clearColor = new BABYLON.Color4(0.4, 0.45, 0.5, 1); } catch (eC) {}

            mat.reflectionTexture = mirrorTex;
            mat.disableLighting = false;
            mat.backFaceCulling = false;
            mat.diffuseColor = new BABYLON.Color3(0.2, 0.22, 0.25);
            mat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.85);
            mat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.025);

            // ===== آزمایش ۳: لاگ خروجی =====
            try {
                console.log('[AYENE-EXP' + exp + '] plane normal', worldN.x.toFixed(3), worldN.y.toFixed(3), worldN.z.toFixed(3));
                console.log('[AYENE-EXP' + exp + '] plane pos', pos.x.toFixed(1), pos.y.toFixed(1), pos.z.toFixed(1));
                console.log('[AYENE-EXP' + exp + '] renderList count=', list.length, 'sample=', names.join(', '));
                console.log('[AYENE-EXP' + exp + '] hasTestBall=', names.some(function (x) { return x.indexOf('TestBall') >= 0; }));
            } catch (eL) {}
        } catch (e) {
            try { console.warn('[AYENE] refresh error', e); } catch (e2) {}
            try {
                mat.reflectionTexture = null;
                mat.disableLighting = true;
                mat.emissiveColor = new BABYLON.Color3(0.6, 0.2, 0.2);
            } catch (e3) {}
        }
    },

    _addClosetSideFacades: function (group, unit, minX, totalWidth, frameDepth, uid) {
        const sf = unit.sideFacades;
        if (!sf || typeof sf !== 'object') return;

        const unitH = parseFloat(unit.h) || 100;
        const unitD = parseFloat(unit.d) || frameDepth || 60;
        const THICK = 1.6;

        const self = this;
        const makeMaterial = function (cfg, sideKey) {
            const mat = new BABYLON.StandardMaterial('closetSideFac_' + uid + '_' + sideKey, self.scene);
            mat.specularColor = new BABYLON.Color3(0.06, 0.06, 0.06);
            const finishKey = (cfg && cfg.finish) || 'matte';
            const colorVal = (cfg && cfg.color) || '';
            const colorName = (cfg && cfg.colorName) || '';

            const isPath = function (v) {
                if (!v || typeof v !== 'string') return false;
                return v.indexOf('/') >= 0 || v.indexOf('http') === 0 ||
                    /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(v);
            };

            let mapUrl = '';
            if (colorName && window.isolatedDoorTextures && window.isolatedDoorTextures[colorName]) {
                mapUrl = window.isolatedDoorTextures[colorName];
            } else if (isPath(colorVal)) {
                mapUrl = colorVal;
            }

            if (mapUrl) {
                try {
                    const tex = new BABYLON.Texture(mapUrl, self.scene, false, true);
                    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                    mat.diffuseTexture = tex;
                    mat.diffuseColor = BABYLON.Color3.White();
                } catch (e) {
                    mat.diffuseColor = new BABYLON.Color3(0.945, 0.961, 0.976);
                }
            } else if (colorVal && colorVal.charAt(0) === '#') {
                mat.diffuseColor = self._hexStrToColor3(colorVal);
            } else {
                mat.diffuseColor = new BABYLON.Color3(0.945, 0.961, 0.976);
            }

            if (finishKey === 'highGloss' || finishKey === 'highgloss') {
                mat.specularColor = new BABYLON.Color3(0.35, 0.35, 0.35);
            }
            return mat;
        };

        const makePanel = function (side, cfg) {
            if (!cfg || cfg.enabled !== true) return;

            // عرض = گسترش به سمت عقب از لبه جلوی چهارچوب
            let backDepth = parseFloat(cfg.width);
            if (isNaN(backDepth) || backDepth <= 0 || Math.abs(backDepth - 1.6) < 0.001) {
                backDepth = unitD;
            }
            // بیرون‌زدگی به سمت جلو از لبه جلوی چهارچوب
            let frontOffset = parseFloat(cfg.frontOffset);
            if (isNaN(frontOffset) || frontOffset < 0) frontOffset = 0;

            let H = parseFloat(cfg.height);
            if (isNaN(H) || H <= 0) H = unitH;

            // لبه جلو چهارچوب در +frameDepth/2 (جلو = +Z)
            const frameFrontZ = frameDepth / 2;
            const frontZ = frameFrontZ + frontOffset;
            const backZ = frameFrontZ - backDepth;
            const panelDepth = Math.max(frontZ - backZ, 0.5);
            const centerZ = (frontZ + backZ) / 2;

            const mat = makeMaterial(cfg, side);
            const mesh = BABYLON.MeshBuilder.CreateBox('closetFrame_facade_' + uid + '_' + side, {
                width: THICK,
                height: H,
                depth: panelDepth
            }, self.scene);

            const x = (side === 'left')
                ? (-totalWidth / 2 - THICK / 2)
                : (totalWidth / 2 + THICK / 2);
            mesh.position.set(x, H / 2, centerZ);
            mesh.material = mat;
            mesh.parent = group;
            mesh.isPickable = false;
            mesh.metadata = { isClosetSideFacade: true, side: side };
        };

        makePanel('left', sf.left);
        makePanel('right', sf.right);
    },


    _getClosetFrontRokoobThickness: function (unit) {
        let front = 0;
        const list = (unit && unit.rokoobParts) ? unit.rokoobParts : [];
        const parts = (unit && unit.parts) ? unit.parts : [];
        for (let i = 0; i < list.length; i++) {
            const rp = list[i];
            if (!rp || !rp.directions) continue;
            const framePart = parts.find(function (p) { return p && p.id === rp.partId; });
            const dirs = rp.directions;
            // روکوب جلو روی قطعه = جهت top برای vertical یا left برای horizontal? در Three: front از insets
            ['top', 'bottom', 'left', 'right'].forEach(function (dir) {
                const d = dirs[dir];
                if (!d || d.enabled !== true) return;
                // روکوب جلوی نما (امتداد +Z) در کد Three برای vertical: dir==='top'
                if (framePart && framePart.orientation === 'vertical' && dir === 'top') {
                    const t = parseFloat(d.thickness);
                    front = Math.max(front, isNaN(t) ? 1.6 : t);
                }
                if (framePart && framePart.orientation === 'horizontal' && dir === 'left') {
                    const t = parseFloat(d.thickness);
                    front = Math.max(front, isNaN(t) ? 1.6 : t);
                }
            });
        }
        return front;
    },

    _makeClosetDrawerFrontMat: function (dData, uid) {
        dData = dData || {};
        const mat = new BABYLON.StandardMaterial('closetDrwFront_' + uid, this.scene);
        mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
        const colorVal = dData.color || '';
        if (colorVal && typeof colorVal === 'string' && colorVal.charAt(0) === '#') {
            mat.diffuseColor = this._hexStrToColor3(colorVal);
        } else {
            mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        }
        const finish = dData.finish || 'matte';
        if (finish === 'highGloss' || finish === 'highgloss') {
            mat.specularColor = new BABYLON.Color3(0.35, 0.35, 0.35);
        }
        return mat;
    },

    /**
     * بدنه کشو واقعی: جبهه (با لبه bevel مثل createPanelMesh) + بغل + عقب + کف + ریل سه‌تکه
     */
    _createRealisticClosetDrawer: function (opts, uid) {
        const frontW = opts.frontW;
        const frontH = opts.frontH;
        const thick = opts.thick || 1.6;
        const drawerDepth = opts.cabinetD || 50;
        const innerDepth = opts.innerDepth || drawerDepth * 0.85;
        const innerHeight = opts.innerHeight || frontH * 0.7;
        const innerWidth = opts.innerWidth || Math.max(frontW - 2.6, 2);
        const frontMat = opts.material;

        const root = new BABYLON.TransformNode('closetDrwAsm_' + uid, this.scene);

        // جبهه — عین جبهه کشو کابینت (لبه ظریف bevel)
        const front = BABYLON.MeshBuilder.CreateBox('closetDrwFront_' + uid, {
            width: frontW, height: Math.max(2, frontH), depth: thick
        }, this.scene);
        front.material = frontMat;
        front.parent = root;
        front.isPickable = true;

        // بدنه — موقعیت نهایی در _addClosetColumnDrawers تنظیم می‌شود
        const body = new BABYLON.TransformNode('closetDrwBody_' + uid, this.scene);
        body.parent = root;
        body.position.set(0, 0, 0);

        const bodyMat = new BABYLON.StandardMaterial('closetDrwBodyMat_' + uid, this.scene);
        bodyMat.diffuseColor = new BABYLON.Color3(0.91, 0.90, 0.89);
        bodyMat.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
        const floorMat = new BABYLON.StandardMaterial('closetDrwFloor_' + uid, this.scene);
        floorMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        floorMat.specularColor = new BABYLON.Color3(0.03, 0.03, 0.03);

        // ابعاد بدنه عین createRealisticDrawer در Three
        const bThick = 1.6;
        const bottomThick = 0.8;
        const sideH = Math.max(innerHeight, 2);
        // بغل چپ/راست — عمق کامل
        ['L', 'R'].forEach(function (side, si) {
            const sx = (si === 0 ? -1 : 1) * (innerWidth / 2 - bThick / 2);
            const sideMesh = BABYLON.MeshBuilder.CreateBox('closetDrwSide_' + uid + side, {
                width: bThick, height: sideH, depth: innerDepth
            }, this.scene);
            sideMesh.position.set(sx, 0, 0);
            sideMesh.material = bodyMat;
            sideMesh.parent = body;
            sideMesh.isPickable = false;
        }.bind(this));
        // جلو و عقب داخلی
        const fbWidth = Math.max(innerWidth - 2 * bThick, 2);
        const frontInner = BABYLON.MeshBuilder.CreateBox('closetDrwFI_' + uid, {
            width: fbWidth, height: sideH, depth: bThick
        }, this.scene);
        frontInner.position.set(0, 0, innerDepth / 2 - bThick / 2);
        frontInner.material = bodyMat;
        frontInner.parent = body;
        frontInner.isPickable = false;
        const back = BABYLON.MeshBuilder.CreateBox('closetDrwBack_' + uid, {
            width: fbWidth, height: sideH, depth: bThick
        }, this.scene);
        back.position.set(0, 0, -innerDepth / 2 + bThick / 2);
        back.material = bodyMat;
        back.parent = body;
        back.isPickable = false;
        // کف
        const bottom = BABYLON.MeshBuilder.CreateBox('closetDrwBot_' + uid, {
            width: fbWidth + 1.4, height: bottomThick, depth: Math.max(innerDepth - 2 * bThick + 1.4, 3)
        }, this.scene);
        bottom.position.set(0, -innerHeight / 2 + 1.7 + bottomThick / 2, 0);
        bottom.material = floorMat;
        bottom.parent = body;
        bottom.isPickable = false;

// ریل تلسکوپی سه‌تکه — نزدیک کف، دو طرف
        const railLen = Math.max(innerDepth * 0.95, 8);
        const railY = -innerHeight / 2 + 2.2;
        const matOuter = new BABYLON.StandardMaterial('closetRailOMat_' + uid, this.scene);
        matOuter.diffuseColor = new BABYLON.Color3(0.43, 0.43, 0.43);
        matOuter.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        const matMiddle = new BABYLON.StandardMaterial('closetRailMMat_' + uid, this.scene);
        matMiddle.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
        matMiddle.specularColor = new BABYLON.Color3(0.55, 0.55, 0.55);
        const matInner = new BABYLON.StandardMaterial('closetRailIMat_' + uid, this.scene);
        matInner.diffuseColor = new BABYLON.Color3(0.78, 0.78, 0.78);
        matInner.specularColor = new BABYLON.Color3(0.6, 0.6, 0.6);
        [-1, 1].forEach(function (s) {
            const baseX = s * (innerWidth / 2 - 0.55);
            const outer = BABYLON.MeshBuilder.CreateBox('closetRailO_' + uid + s, {
                width: 1.15, height: 0.12, depth: railLen
            }, this.scene);
            outer.position.set(baseX, railY - 0.5, 0);
            outer.material = matOuter; outer.parent = body; outer.isPickable = false;
            const outerWall = BABYLON.MeshBuilder.CreateBox('closetRailOW_' + uid + s, {
                width: 0.12, height: 1.2, depth: railLen
            }, this.scene);
            outerWall.position.set(baseX + s * 0.5, railY, 0);
            outerWall.material = matOuter; outerWall.parent = body; outerWall.isPickable = false;
            const mid = BABYLON.MeshBuilder.CreateBox('closetRailM_' + uid + s, {
                width: 0.7, height: 0.55, depth: railLen * 0.85
            }, this.scene);
            mid.position.set(baseX, railY, 0);
            mid.material = matMiddle; mid.parent = body; mid.isPickable = false;
            const inn = BABYLON.MeshBuilder.CreateBox('closetRailI_' + uid + s, {
                width: 0.45, height: 0.4, depth: railLen * 0.7
            }, this.scene);
            inn.position.set(baseX, railY + 0.1, 0);
            inn.material = matInner; inn.parent = body; inn.isPickable = false;
        }.bind(this));

        return { root: root, front: front, body: body };
    },

    _addClosetColumnDrawers: function (group, opts, uidBase) {
        const meta = opts.meta;
        const colCenterX = opts.colCenterX;
        const frontW = opts.frontW;
        const drawerBodyW = opts.drawerBodyW;
        const housingBottom = opts.housingBottom;
        const housingTop = opts.housingTop;
        const bodyFrontZ = opts.bodyFrontZ;
        const drawerDepth = opts.drawerDepth;
        const thick = opts.thick;
        const metalMat = opts.metalMat;
        const PANEL = opts.PANEL;
        const SIDE_PER_DRAWER = opts.SIDE_PER_DRAWER;
        const FRONT_BOTTOM_OVERLAP = opts.FRONT_BOTTOM_OVERLAP;
        const FRONT_TOP_INSET = opts.FRONT_TOP_INSET;
        const FRONT_GAP = opts.FRONT_GAP;
        const cellId = opts.cellId;
        const columnIndex = opts.columnIndex;
        const drawerType = opts.drawerType;
        const bodyCenterX = (opts.bodyCenterX !== undefined) ? opts.bodyCenterX : colCenterX;

        const count = meta.count;
        const drawersData = meta.drawersData || [];
        const bodyHeights = meta.bodyHeights;
        const sumBodies = meta.sumBodies;

        const stackBottom = housingBottom - FRONT_BOTTOM_OVERLAP;
        const stackTop = housingTop - FRONT_TOP_INSET;
        const totalFrontSpan = Math.max(stackTop - stackBottom, 4);
        const frontGapsTotal = FRONT_GAP * Math.max(count - 1, 0);
        const availableFrontH = Math.max(totalFrontSpan - frontGapsTotal, 4);
        const frontHeights = [];
        for (let i = 0; i < count; i++) {
            const ratio = sumBodies > 0 ? (bodyHeights[i] / sumBodies) : (1 / count);
            frontHeights.push(Math.max(availableFrontH * ratio, 4));
        }

        let frontYBottom = stackBottom;
        for (let i = 0; i < count; i++) {
            const bodyH = bodyHeights[i];
            const frontH = frontHeights[i];
            const slotBottom = housingBottom + i * SIDE_PER_DRAWER;
            const bodyCy = slotBottom + SIDE_PER_DRAWER / 2;
            const frontCy = frontYBottom + frontH / 2;
            frontYBottom += frontH + FRONT_GAP;

            const dData = drawersData[i] || {};
            let innerDepth = drawerDepth * 0.85;
            if (dData.depth && !isNaN(parseFloat(dData.depth))) {
                innerDepth = parseFloat(dData.depth);
            }
            innerDepth = Math.max(innerDepth, 20);

            const thisFrontMat = this._makeClosetDrawerFrontMat(dData, uidBase + '_c' + columnIndex + '_d' + i);
            const asm = this._createRealisticClosetDrawer({
                frontW: frontW,
                frontH: frontH,
                thick: thick,
                cabinetD: drawerDepth,
                innerDepth: innerDepth,
                innerHeight: bodyH,
                innerWidth: drawerBodyW,
                material: thisFrontMat
            }, uidBase + '_c' + columnIndex + '_d' + i);

            const closedZ = bodyFrontZ + thick / 2;
            const drawerRoot = new BABYLON.TransformNode('closetDrwRoot_' + uidBase + '_' + columnIndex + '_' + i, this.scene);
            drawerRoot.parent = group;
            drawerRoot.position.set(colCenterX, frontCy, closedZ);

            const openZ = closedZ + Math.min(innerDepth * 0.8, 40);
            // metadata روی pivot برای انیمیشن (مثل کشو کابینت)
            drawerRoot.metadata = {
                targetZ: closedZ,
                closedZ: closedZ,
                openZ: openZ
            };

            if (asm && asm.root) {
                asm.root.parent = drawerRoot;
                if (asm.body) {
                    asm.body.position.y = bodyCy - frontCy;
                    asm.body.position.x = bodyCenterX - colCenterX;
                    // بدنه پشت جبهه به سمت داخل (-Z محلی)
                    asm.body.position.z = -(innerDepth / 2 + thick / 2);
                }
                // دستگیره میله‌ای — عین Three روی جبهه
                const hw = Math.min(frontW * 0.35, 12);
                const handle = BABYLON.MeshBuilder.CreateBox('closetDrwH_' + uidBase + '_' + columnIndex + '_' + i, {
                    width: hw, height: 0.55, depth: 0.75
                }, this.scene);
                handle.position.set(0, 0, thick / 2 + 0.4);
                handle.material = metalMat;
                handle.parent = asm.front;
                handle.isPickable = false;

                // کلیک روی جبهه → باز/بسته (مثل کشو کابینت)
                if (asm.front) {
                    asm.front.isPickable = true;
                    asm.front.metadata = {
                        isDrawer: true,
                        isClosetFrameDrawer: true,
                        isOpen: false,
                        hingeNode: drawerRoot,
                        closetCellId: cellId,
                        drawerIndex: i,
                        columnIndex: columnIndex,
                        drawerType: drawerType
                    };
                }
            }
        }
    },

    _addClosetFrameCellDrawers: function (group, unit, minX, totalWidth, frameDepth, uid) {
        const cellDrawers = unit.frameCellDrawers || {};
        if (!Object.keys(cellDrawers).length) return;

        let cells = [];
        if (typeof window.detectClosetFrameCells === 'function') {
            try { cells = window.detectClosetFrameCells(unit) || []; } catch (e) { cells = []; }
        }
        if (!cells.length) return;

        const frontRokoobT = this._getClosetFrontRokoobThickness(unit) || 0;
        const frontFaceZ = (frameDepth / 2) + frontRokoobT;

        const DEFAULT_PANEL = 1.6;
        const DEFAULT_SIDE_PER = 22.5;
        const DEFAULT_STRIP_D = 12;
        const DEFAULT_DEPTH = 50;
        const DRAWER_BODY_CLEAR = 2.6;

        const carcassMat = new BABYLON.StandardMaterial('closetCarcass_' + uid, this.scene);
        carcassMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        carcassMat.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
        const metalMat = new BABYLON.StandardMaterial('closetMetal_' + uid, this.scene);
        metalMat.diffuseColor = new BABYLON.Color3(0.16, 0.16, 0.16);
        metalMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

        for (let ciCell = 0; ciCell < cells.length; ciCell++) {
            const cell = cells[ciCell];
            if (!cell || !cell.id) continue;
            const cfgRaw = cellDrawers[cell.id];
            if (!cfgRaw || cfgRaw.enabled !== true) continue;
            if (cell.w < 6 || cell.h < 6) continue;

            const cfg = (typeof window.normalizeKeshoDrawerCfg === 'function')
                ? window.normalizeKeshoDrawerCfg(cfgRaw)
                : cfgRaw;
            const drawerType = cfg.drawerType || 'normal';
            const housing = cfg.housing || {};

            let PANEL = parseFloat(housing.wallThickness);
            if (isNaN(PANEL) || PANEL <= 0) PANEL = DEFAULT_PANEL;
            let SIDE_PER_DRAWER = parseFloat(housing.sidePerDrawer);
            if (isNaN(SIDE_PER_DRAWER) || SIDE_PER_DRAWER <= 0) SIDE_PER_DRAWER = DEFAULT_SIDE_PER;
            let STRIP_D = parseFloat(housing.stripDepth);
            if (isNaN(STRIP_D) || STRIP_D <= 0) STRIP_D = DEFAULT_STRIP_D;
            let drawerDepth = parseFloat(housing.drawerDepth);
            if (isNaN(drawerDepth) || drawerDepth <= 0) {
                drawerDepth = (cfg.drawerDepth && !isNaN(parseFloat(cfg.drawerDepth)))
                    ? parseFloat(cfg.drawerDepth) : DEFAULT_DEPTH;
            }
            const FLOOR_MINUS_SIDES = PANEL * 2;

            let colCount = 1;
            if (drawerType === 'normal' || drawerType === 'hidden') {
                colCount = Math.max(1, Math.min(3, parseInt(cfg.columnCount, 10) || 1));
            } else if (drawerType === 'sliding') {
                colCount = Math.max(1, Math.min(2, parseInt(cfg.columnCount, 10) || 1));
            }

            let columns = Array.isArray(cfg.columns) && cfg.columns.length
                ? cfg.columns
                : [{
                    drawerCount: Math.max(1, parseInt(cfg.drawerCount, 10) || 1),
                    drawerGap: cfg.drawerGap !== undefined ? parseFloat(cfg.drawerGap) : 0.2,
                    drawersData: cfg.drawersData || []
                }];
            while (columns.length < colCount) {
                columns.push({
                    drawerCount: 1,
                    drawerGap: 0.2,
                    drawersData: [{ height: 17, doorHeight: 17, depth: 45, material: 'mdf', color: '', finish: 'matte' }]
                });
            }
            columns = columns.slice(0, colCount);

            const cellCenterX = (cell.x - minX) - (totalWidth / 2) + cell.w / 2;
            const W = cell.w;
            const H = cell.h;
            const HIDDEN_INSET = 3.0;
            const SLIDING_INSET = 12.0;
            let bodyFrontZ = frontFaceZ;
            if (drawerType === 'hidden') bodyFrontZ = frontFaceZ - HIDDEN_INSET;
            else if (drawerType === 'sliding') bodyFrontZ = frontFaceZ - SLIDING_INSET;
            const bodyCenterZ = bodyFrontZ - drawerDepth / 2;
            const thick = PANEL;

            const FRONT_BOTTOM_OVERLAP = (drawerType === 'sliding') ? -0.2 : 1.6;
            const FRONT_TOP_INSET = 0.3;
            const FRONT_GAP = 0.3;

            const colMeta = [];
            let maxCount = 1;
            for (let ci = 0; ci < colCount; ci++) {
                const colCfg = columns[ci] || {};
                const count = Math.max(1, parseInt(colCfg.drawerCount, 10) || 1);
                const drawersData = colCfg.drawersData || [];
                const bodyHeights = [];
                let sumBodies = 0;
                for (let i = 0; i < count; i++) {
                    const d = drawersData[i];
                    let h = d && d.height ? parseFloat(d.height)
                        : (d && d.doorHeight ? parseFloat(d.doorHeight) : NaN);
                    if (isNaN(h) || h <= 0) h = 17;
                    bodyHeights.push(h);
                    sumBodies += h;
                }
                if (count > maxCount) maxCount = count;
                colMeta.push({ count: count, drawersData: drawersData, bodyHeights: bodyHeights, sumBodies: sumBodies });
            }
            const allSameCount = colMeta.every(function (m) { return m.count === colMeta[0].count; });

            const cellLeft = cellCenterX - W / 2;
            const cellRight = cellCenterX + W / 2;
            const frontStripZ = bodyFrontZ - STRIP_D / 2;
            const backStripZ = bodyFrontZ - drawerDepth + STRIP_D / 2;

            let housingW = W;
            const hwRaw = parseFloat(housing.width);
            if (!isNaN(hwRaw) && hwRaw > 0) housingW = Math.min(Math.max(hwRaw, 10), W);
            const housingAlign = (housing.align === 'left' || housing.align === 'right') ? housing.align : 'center';
            let housingLeft;
            if (housingAlign === 'left') housingLeft = cellLeft;
            else if (housingAlign === 'right') housingLeft = cellRight - housingW;
            else housingLeft = cellLeft + (W - housingW) / 2;

            if (drawerType === 'hidden') {
                housingW = Math.max(housingW - 8.0, 6);
                housingLeft = housingLeft + 4.0;
            }
            if (drawerType === 'sliding') {
                housingW = Math.max(housingW - 13.0, 6);
                housingLeft = housingLeft + 6.5;
            }
            const housingCenterX = housingLeft + housingW / 2;

            const EDGE_OVERLAY = 1.6;
            const EDGE_INSET = 0.1;
            const MID_INSET = 0.15;

            const addBox = function (name, w, h, d, x, y, z, mat) {
                const m = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene);
                m.position.set(x, y, z);
                m.material = mat;
                m.parent = group;
                m.isPickable = false;
                return m;
            }.bind(this);

            if (allSameCount || colCount === 1) {
                let housingH = SIDE_PER_DRAWER * maxCount;
                if (housingH > H) housingH = H;
                const housingBottom = cell.y;
                const housingTop = housingBottom + housingH;

                // دیواره چپ/راست
                const sideH = housingH;
                const sideCy = housingBottom + sideH / 2;
                addBox('closetHsL_' + uid + '_' + cell.id, PANEL, sideH, drawerDepth,
                    housingLeft + PANEL / 2, sideCy, bodyCenterZ, carcassMat);
                addBox('closetHsR_' + uid + '_' + cell.id, PANEL, sideH, drawerDepth,
                    housingLeft + housingW - PANEL / 2, sideCy, bodyCenterZ, carcassMat);

                const floorCeilW = Math.max(housingW - FLOOR_MINUS_SIDES, 2);
                const floorY = housingBottom + PANEL / 2;
                const ceilY = housingTop - PANEL / 2;
                [[floorY, frontStripZ], [floorY, backStripZ], [ceilY, frontStripZ], [ceilY, backStripZ]].forEach(function (p, pi) {
                    addBox('closetHsFC_' + uid + '_' + cell.id + '_' + pi, floorCeilW, PANEL, STRIP_D,
                        housingCenterX, p[0], p[1], carcassMat);
                });

                if (drawerType === 'normal' || drawerType === 'hidden') {
                    addBox('closetHsBackRail_' + uid + '_' + cell.id, floorCeilW, 5.5, PANEL,
                        housingCenterX, housingBottom - 5.5 / 2, backStripZ, carcassMat);
                }
                if (drawerType === 'sliding') {
                    const railY = housingBottom - 10 / 2;
                    const frontRailZ = bodyFrontZ - PANEL / 2;
                    const backRailZ = (bodyFrontZ - drawerDepth) + PANEL / 2;
                    [frontRailZ, backRailZ].forEach(function (z, zi) {
                        addBox('closetHsSlideRail_' + uid + '_' + cell.id + '_' + zi, floorCeilW, 10, PANEL,
                            housingCenterX, railY, z, carcassMat);
                    });
                }

                const innerLeft = housingLeft + PANEL;
                const innerW = Math.max(housingW - PANEL * 2, 2);
                const dividerH = Math.max(housingH - PANEL * 2, 2);
                const dividerCy = housingBottom + PANEL + dividerH / 2;
                const isSlidingDouble = (drawerType === 'sliding' && colCount === 2);
                const midGapW = isSlidingDouble ? 10 : 0;
                const midBladesW = isSlidingDouble ? (PANEL * 2 + midGapW) : (PANEL * Math.max(colCount - 1, 0));
                const usableW = Math.max(innerW - midBladesW, 2);
                const colInnerW = usableW / colCount;

                if (isSlidingDouble) {
                    const leftBladeX = innerLeft + colInnerW + PANEL / 2;
                    const rightBladeX = leftBladeX + PANEL + midGapW;
                    [leftBladeX, rightBladeX].forEach(function (x, xi) {
                        addBox('closetHsMid_' + uid + '_' + cell.id + '_' + xi, PANEL, dividerH, drawerDepth,
                            x, dividerCy, bodyCenterZ, carcassMat);
                    });
                    const betweenX = (leftBladeX + rightBladeX) / 2;
                    const frontZ = bodyFrontZ - PANEL / 2;
                    const backZ = (bodyFrontZ - drawerDepth) + PANEL / 2;
                    [frontZ, backZ].forEach(function (z, zi) {
                        addBox('closetHsBetween_' + uid + '_' + cell.id + '_' + zi, Math.max(midGapW, 0.5), dividerH, PANEL,
                            betweenX, dividerCy, z, carcassMat);
                    });
                } else {
                    for (let di = 0; di < Math.max(colCount - 1, 0); di++) {
                        const divX = innerLeft + (di + 1) * colInnerW + di * PANEL + PANEL / 2;
                        addBox('closetHsDiv_' + uid + '_' + cell.id + '_' + di, PANEL, dividerH, drawerDepth,
                            divX, dividerCy, bodyCenterZ, carcassMat);
                    }
                }

                // هر ستون کشو
                for (let ci = 0; ci < colCount; ci++) {
                    let colLeft, colOuterW, colCenterX, drawerBodyW, frontW;
                    if (isSlidingDouble) {
                        const leftBladeX = innerLeft + colInnerW + PANEL / 2;
                        const rightBladeX = leftBladeX + PANEL + midGapW;
                        if (ci === 0) {
                            colLeft = housingLeft;
                            colOuterW = (leftBladeX - PANEL / 2) - housingLeft;
                        } else {
                            colLeft = rightBladeX + PANEL / 2;
                            colOuterW = (housingLeft + housingW) - colLeft;
                        }
                        colCenterX = colLeft + colOuterW / 2;
                        const colInW = Math.max(colOuterW - PANEL * 2, 2);
                        drawerBodyW = Math.max(colInW - DRAWER_BODY_CLEAR, 2);
                    } else {
                        colLeft = innerLeft + ci * (colInnerW + PANEL);
                        colOuterW = colInnerW + PANEL * 2;
                        // for first/last include outer walls
                        if (ci === 0) {
                            colLeft = housingLeft;
                            colOuterW = PANEL + colInnerW + (colCount > 1 ? PANEL / 2 : PANEL);
                        } else if (ci === colCount - 1) {
                            colLeft = innerLeft + ci * colInnerW + ci * PANEL - PANEL;
                            colOuterW = PANEL + colInnerW + PANEL;
                        } else {
                            colLeft = innerLeft + ci * colInnerW + ci * PANEL - PANEL / 2;
                            colOuterW = colInnerW + PANEL;
                        }
                        // simpler equal columns:
                        colLeft = housingLeft + ci * (housingW / colCount);
                        colOuterW = housingW / colCount;
                        colCenterX = colLeft + colOuterW / 2;
                        const colInW = Math.max(colOuterW - PANEL * 2, 2);
                        drawerBodyW = Math.max(colInW - DRAWER_BODY_CLEAR, 2);
                    }

                    const leftIsOuter = (ci === 0);
                    const rightIsOuter = (ci === colCount - 1);
                    const leftEdge = leftIsOuter
                        ? (colLeft - EDGE_OVERLAY + EDGE_INSET)
                        : (colLeft + MID_INSET);
                    const rightEdge = rightIsOuter
                        ? (colLeft + colOuterW + EDGE_OVERLAY - EDGE_INSET)
                        : (colLeft + colOuterW - MID_INSET);
                    frontW = Math.max(rightEdge - leftEdge, 2);
                    if (drawerType === 'hidden') {
                        frontW = Math.max(colOuterW - 1.0, 2);
                    }
                    colCenterX = colLeft + colOuterW / 2;

                    this._addClosetColumnDrawers(group, {
                        meta: colMeta[ci],
                        colCenterX: colCenterX,
                        bodyCenterX: colCenterX,
                        frontW: frontW,
                        drawerBodyW: drawerBodyW,
                        housingBottom: housingBottom,
                        housingTop: housingTop,
                        bodyFrontZ: bodyFrontZ,
                        drawerDepth: drawerDepth,
                        thick: thick,
                        metalMat: metalMat,
                        PANEL: PANEL,
                        SIDE_PER_DRAWER: SIDE_PER_DRAWER,
                        FRONT_BOTTOM_OVERLAP: FRONT_BOTTOM_OVERLAP,
                        FRONT_TOP_INSET: FRONT_TOP_INSET,
                        FRONT_GAP: FRONT_GAP,
                        cellId: cell.id,
                        columnIndex: ci,
                        drawerType: drawerType
                    }, uid + '_' + cell.id);
                }
            } else {
                // تعداد نابرابر: هر ستون housing جدا
                const colOuterW = housingW / colCount;
                for (let ci = 0; ci < colCount; ci++) {
                    const meta = colMeta[ci];
                    let housingH = SIDE_PER_DRAWER * meta.count;
                    if (housingH > H) housingH = H;
                    const housingBottom = cell.y;
                    const housingTop = housingBottom + housingH;
                    const colLeft = housingLeft + ci * colOuterW;
                    const bayCenterX = colLeft + colOuterW / 2;
                    const sideCy = housingBottom + housingH / 2;

                    addBox('closetBayL_' + uid + '_' + cell.id + '_' + ci, PANEL, housingH, drawerDepth,
                        colLeft + PANEL / 2, sideCy, bodyCenterZ, carcassMat);
                    addBox('closetBayR_' + uid + '_' + cell.id + '_' + ci, PANEL, housingH, drawerDepth,
                        colLeft + colOuterW - PANEL / 2, sideCy, bodyCenterZ, carcassMat);

                    const floorCeilW = Math.max(colOuterW - FLOOR_MINUS_SIDES, 2);
                    const floorY = housingBottom + PANEL / 2;
                    const ceilY = housingTop - PANEL / 2;
                    [[floorY, frontStripZ], [floorY, backStripZ], [ceilY, frontStripZ], [ceilY, backStripZ]].forEach(function (p, pi) {
                        addBox('closetBayFC_' + uid + '_' + cell.id + '_' + ci + '_' + pi, floorCeilW, PANEL, STRIP_D,
                            bayCenterX, p[0], p[1], carcassMat);
                    });
                    if (drawerType === 'normal' || drawerType === 'hidden') {
                        addBox('closetBayRail_' + uid + '_' + cell.id + '_' + ci, floorCeilW, 5.5, PANEL,
                            bayCenterX, housingBottom - 2.75, backStripZ, carcassMat);
                    }
                    if (drawerType === 'sliding') {
                        const railY = housingBottom - 5;
                        [bodyFrontZ - PANEL / 2, (bodyFrontZ - drawerDepth) + PANEL / 2].forEach(function (z, zi) {
                            addBox('closetBaySR_' + uid + '_' + cell.id + '_' + ci + '_' + zi, floorCeilW, 10, PANEL,
                                bayCenterX, railY, z, carcassMat);
                        });
                    }

                    const colInnerW = Math.max(colOuterW - PANEL * 2, 2);
                    const drawerBodyW = Math.max(colInnerW - DRAWER_BODY_CLEAR, 2);
                    const leftIsOuter = (ci === 0);
                    const rightIsOuter = (ci === colCount - 1);
                    const leftEdge = leftIsOuter ? (colLeft - EDGE_OVERLAY + EDGE_INSET) : (colLeft + MID_INSET);
                    const rightEdge = rightIsOuter ? (colLeft + colOuterW + EDGE_OVERLAY - EDGE_INSET) : (colLeft + colOuterW - MID_INSET);
                    let frontW = Math.max(rightEdge - leftEdge, 2);
                    if (drawerType === 'hidden') frontW = Math.max(colOuterW - 1.0, 2);

                    this._addClosetColumnDrawers(group, {
                        meta: meta,
                        colCenterX: bayCenterX,
                        bodyCenterX: bayCenterX,
                        frontW: frontW,
                        drawerBodyW: drawerBodyW,
                        housingBottom: housingBottom,
                        housingTop: housingTop,
                        bodyFrontZ: bodyFrontZ,
                        drawerDepth: drawerDepth,
                        thick: thick,
                        metalMat: metalMat,
                        PANEL: PANEL,
                        SIDE_PER_DRAWER: SIDE_PER_DRAWER,
                        FRONT_BOTTOM_OVERLAP: FRONT_BOTTOM_OVERLAP,
                        FRONT_TOP_INSET: FRONT_TOP_INSET,
                        FRONT_GAP: FRONT_GAP,
                        cellId: cell.id,
                        columnIndex: ci,
                        drawerType: drawerType
                    }, uid + '_' + cell.id);
                }
            }
        }
    },



    // =====================================================================
    // =====================================================================
    // خروجی عکس و GLB — فقط از نمای Babylon (بدون Three)
    // =====================================================================

    /** نمای Babylon باز و موتور آماده است؟ */
    isViewActive: function () {
        if (!this.isReady || !this.engine || !this.scene || !this.canvas) return false;
        const cont = document.getElementById('modal-babylon-container');
        if (!cont) return false;
        const st = window.getComputedStyle ? window.getComputedStyle(cont) : null;
        const display = st ? st.display : cont.style.display;
        const visibility = st ? st.visibility : cont.style.visibility;
        if (display === 'none' || visibility === 'hidden') return false;
        return true;
    },

    /**
     * خروجی PNG فقط از canvas Babylon
     */
    exportImage: function (fileName) {
        fileName = fileName || 'عکس_آشپزخانه.png';
        if (!this.engine || !this.scene || !this.camera || !this.canvas) {
            alert('اول نمای BJS را باز کنید تا خروجی عکس گرفته شود.');
            return;
        }
        const self = this;
        try {
            this.scene.render();
            if (typeof BABYLON !== 'undefined' && BABYLON.Tools && typeof BABYLON.Tools.CreateScreenshot === 'function') {
                BABYLON.Tools.CreateScreenshot(this.engine, this.camera, {
                    precision: 1,
                    width: this.canvas.width || this.engine.getRenderWidth(),
                    height: this.canvas.height || this.engine.getRenderHeight()
                }, function (dataUrl) {
                    self._downloadDataUrl(dataUrl, fileName);
                });
            } else {
                self._downloadDataUrl(this.canvas.toDataURL('image/png'), fileName);
            }
        } catch (err) {
            try { console.error('[KitchenBabylon] exportImage:', err); } catch (e) {}
            alert('خطا در گرفتن عکس از نمای Babylon!');
        }
    },

    _downloadDataUrl: function (dataUrl, fileName) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * خروجی GLB / HTML ویوور فقط از صحنه Babylon از مسیر OutputManager
     */
    exportGLB: function (fileName) {
        fileName = fileName || 'آشپزخانه_سه_بعدی.html';
        if (!this.scene || !this.isReady) {
            alert('اول نمای BJS را باز کنید تا خروجی سه‌بعدی گرفته شود.');
            return;
        }
        if (typeof OutputManager === 'undefined' || typeof OutputManager.exportToGLBFromBabylon !== 'function') {
            alert('OutputManager آماده نیست. صفحه را یک‌بار رفرش کنید.');
            return;
        }
        try {
            if (typeof this.renderCabinets === 'function') this.renderCabinets();
        } catch (e) {}
        try {
            const meshes = this.scene.meshes || [];
            for (let i = 0; i < meshes.length; i++) {
                try {
                    if (meshes[i] && meshes[i].computeWorldMatrix) meshes[i].computeWorldMatrix(true);
                } catch (e2) {}
            }
            this.scene.render();
        } catch (e) {}
        try {
            if (this._updateStatus) this._updateStatus('در حال خروجی GLB…');
        } catch (e) {}
        OutputManager.exportToGLBFromBabylon(this.scene, fileName);
    },


};

window.KitchenBabylon = KitchenBabylon;

// هر بار Kitchen3D.refreshRoom صدا شود، Babylon هم اگر باز است رفرش شود
(function patchKitchen3DRefresh() {
    function tryPatch() {
        if (typeof Kitchen3D === 'undefined' || !Kitchen3D.refreshRoom || Kitchen3D._babylonRefreshPatched) return;
        const original = Kitchen3D.refreshRoom.bind(Kitchen3D);
        Kitchen3D.refreshRoom = function () {
            original();
            if (typeof KitchenBabylon !== 'undefined' && KitchenBabylon.isReady &&
                typeof KitchenBabylon.refreshRoom === 'function') {
                KitchenBabylon.refreshRoom();
            }
        };
        Kitchen3D._babylonRefreshPatched = true;
    }
    tryPatch();
    setTimeout(tryPatch, 500);
    setTimeout(tryPatch, 2000);
})();


(function patchKitchen3DCabinets() {
    function tryPatch() {
        if (typeof Kitchen3D === 'undefined' || !Kitchen3D.refreshCabinets || Kitchen3D._babylonCabPatched) return;
        const original = Kitchen3D.refreshCabinets.bind(Kitchen3D);
        Kitchen3D.refreshCabinets = function (id) {
            original(id);
            if (typeof KitchenBabylon !== 'undefined' && KitchenBabylon.isReady &&
                typeof KitchenBabylon.refreshCabinets === 'function') {
                KitchenBabylon.refreshCabinets(id);
            }
        };
        Kitchen3D._babylonCabPatched = true;
    }
    tryPatch();
    setTimeout(tryPatch, 500);
    setTimeout(tryPatch, 2000);
})();



(function patchClosetFrameRefresh() {
    function tryPatch() {
        if (typeof Kitchen3D === 'undefined' || !Kitchen3D.renderClosetFrameUnit || Kitchen3D._babylonClosetPatched) return;
        const original = Kitchen3D.renderClosetFrameUnit.bind(Kitchen3D);
        Kitchen3D.renderClosetFrameUnit = function () {
            original();
            if (typeof KitchenBabylon !== 'undefined' && KitchenBabylon.isReady &&
                typeof KitchenBabylon._renderClosetFrameUnits === 'function') {
                try { KitchenBabylon._renderClosetFrameUnits(); } catch (e) {}
            }
        };
        Kitchen3D._babylonClosetPatched = true;
    }
    tryPatch();
    setTimeout(tryPatch, 500);
    setTimeout(tryPatch, 2000);
})();


(function patchKitchen3DExport() {
    function tryPatch() {
        if (typeof Kitchen3D === 'undefined') return;
        if (Kitchen3D._babylonExportPatched) return;

        // دکمه‌های منو هنوز Kitchen3D.export* را صدا می‌زنند — فقط به Babylon وصل می‌شوند
        Kitchen3D.exportImage = function (fileName) {
            if (typeof KitchenBabylon === 'undefined' || typeof KitchenBabylon.exportImage !== 'function') {
                alert('نمای Babylon آماده نیست. اول دکمه BJS را بزنید.');
                return;
            }
            return KitchenBabylon.exportImage(fileName || 'عکس_آشپزخانه.png');
        };

        Kitchen3D.exportGLB = function (fileName) {
            if (typeof KitchenBabylon === 'undefined' || typeof KitchenBabylon.exportGLB !== 'function') {
                alert('نمای Babylon آماده نیست. اول دکمه BJS را بزنید.');
                return;
            }
            return KitchenBabylon.exportGLB(fileName || 'آشپزخانه_سه_بعدی.html');
        };

        Kitchen3D._babylonExportPatched = true;
    }
    tryPatch();
    setTimeout(tryPatch, 500);
    setTimeout(tryPatch, 2000);
    setTimeout(tryPatch, 5000);
})();
