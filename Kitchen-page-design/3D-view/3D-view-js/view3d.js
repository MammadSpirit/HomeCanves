// js/view3d.js - نسخه نهایی: دیوار ضخیم، سقف، لامپ قابل کنترل و رفع باگ فاصله کابینت
let customWallsList = [];

// =====================================================================
// پرداخت نوری ورق (فقط Roughness / Metalness / Clearcoat)
// جنس ورق (mdf / highGloss / leteron) همان انتخاب قبلی کاتالوگ رنگ است؛
// اینجا فقط رفتار نور همان جنس روی سطح درب اعمال می‌شود.
// =====================================================================
// مرحله 47 — PBR واقعی‌تر
// BaseColor / Roughness / Metalness / Normal / Bump / Clearcoat / IOR / Transmission
window.KITCHEN_FINISH_PRESETS = {
    matte: {
        label: 'مات',
        roughness: 0.92,
        metalness: 0.0,
        envMapIntensity: 0.12,
        bumpScale: 0.12,
        clearcoat: 0,
        clearcoatRoughness: 1,
        ior: 1.5,
        transmission: 0,
        thickness: 0,
        reflectivity: 0.35
    },
    semiMatte: {
        label: 'نیمه‌مات',
        roughness: 0.62,
        metalness: 0.02,
        envMapIntensity: 0.4,
        bumpScale: 0.1,
        clearcoat: 0,
        clearcoatRoughness: 1,
        ior: 1.5,
        transmission: 0,
        reflectivity: 0.4
    },
    satin: {
        label: 'ساتین',
        roughness: 0.28,
        metalness: 0.05,
        envMapIntensity: 0.85,
        bumpScale: 0.05,
        clearcoat: 0.25,
        clearcoatRoughness: 0.28,
        ior: 1.5,
        transmission: 0,
        reflectivity: 0.5
    },
    highGloss: {
        label: 'براق / های‌گلاس',
        roughness: 0.04,
        metalness: 0.06,
        envMapIntensity: 0.75,
        bumpScale: 0.012,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        ior: 1.55,
        transmission: 0,
        reflectivity: 0.55
    },
    highgloss: {
        label: 'براق / های‌گلاس',
        roughness: 0.04,
        metalness: 0.06,
        envMapIntensity: 0.75,
        bumpScale: 0.012,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        ior: 1.55,
        transmission: 0,
        reflectivity: 0.55
    },
    mdf: {
        label: 'مات',
        roughness: 0.92,
        metalness: 0.0,
        envMapIntensity: 0.12,
        bumpScale: 0.12,
        clearcoat: 0,
        clearcoatRoughness: 1,
        ior: 1.5,
        transmission: 0
    },
    leteron: {
        label: 'نیمه‌مات',
        roughness: 0.62,
        metalness: 0.02,
        envMapIntensity: 0.4,
        bumpScale: 0.1,
        clearcoat: 0,
        clearcoatRoughness: 1,
        ior: 1.5,
        transmission: 0
    },
    chrome: {
        label: 'کروم',
        roughness: 0.06,
        metalness: 1.0,
        envMapIntensity: 1.5,
        bumpScale: 0.0,
        clearcoat: 0.35,
        clearcoatRoughness: 0.06,
        ior: 2.5,
        transmission: 0,
        reflectivity: 1.0
    },
    stainless: {
        label: 'استیل',
        roughness: 0.2,
        metalness: 0.95,
        envMapIntensity: 1.3,
        bumpScale: 0.025,
        clearcoat: 0.12,
        clearcoatRoughness: 0.18,
        ior: 2.2,
        transmission: 0,
        reflectivity: 0.9
    },
    stainlessSteel: {
        label: 'استیل',
        roughness: 0.2,
        metalness: 0.95,
        envMapIntensity: 1.3,
        bumpScale: 0.025,
        clearcoat: 0.12,
        clearcoatRoughness: 0.18,
        ior: 2.2,
        transmission: 0,
        reflectivity: 0.9
    },
    // شیشه / ویترین
    glass: {
        label: 'شیشه',
        roughness: 0.05,
        metalness: 0.0,
        envMapIntensity: 1.2,
        bumpScale: 0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        ior: 1.5,
        transmission: 0.92,
        thickness: 1.6,
        transparent: true,
        opacity: 1.0,
        attenuationColor: '#e8f4ff',
        attenuationDistance: 2.5,
        reflectivity: 0.5
    },
    frostedGlass: {
        label: 'شیشه مات',
        roughness: 0.35,
        metalness: 0.0,
        envMapIntensity: 0.7,
        bumpScale: 0.04,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
        ior: 1.45,
        transmission: 0.7,
        thickness: 1.6,
        transparent: true,
        opacity: 1.0,
        attenuationColor: '#f0f4f8',
        attenuationDistance: 1.2
    },
    // سنگ / مرمر صفحه
    marble: {
        label: 'سنگ / مرمر',
        roughness: 0.22,
        metalness: 0.02,
        envMapIntensity: 0.7,
        bumpScale: 0.08,
        clearcoat: 0.45,
        clearcoatRoughness: 0.12,
        ior: 1.55,
        transmission: 0,
        reflectivity: 0.45
    },
    polishedStone: {
        label: 'سنگ براق',
        roughness: 0.08,
        metalness: 0.04,
        envMapIntensity: 0.9,
        bumpScale: 0.04,
        clearcoat: 0.85,
        clearcoatRoughness: 0.06,
        ior: 1.6,
        transmission: 0,
        reflectivity: 0.5
    }
};

window.getKitchenFinishPreset = function(type) {
    const key = (type || 'matte').toString();
    const p = window.KITCHEN_FINISH_PRESETS[key] || window.KITCHEN_FINISH_PRESETS.matte;
    // کپی سطحی تا تغییر caller روی preset اصلی ننویسد
    return Object.assign({}, p);
};

/**
 * اعمال کامل پارامترهای PBR روی params متریال Three.js
 * BaseColor / Roughness / Metalness / Bump / Clearcoat / IOR / Transmission
 */
window.applyKitchenPBRParams = function(params, preset, extras) {
    params = params || {};
    preset = preset || window.getKitchenFinishPreset('matte');
    extras = extras || {};

    params.roughness = extras.roughness != null ? extras.roughness : preset.roughness;
    params.metalness = extras.metalness != null ? extras.metalness : preset.metalness;
    if (preset.envMapIntensity != null || extras.envMapIntensity != null) {
        params.envMapIntensity = extras.envMapIntensity != null ? extras.envMapIntensity : preset.envMapIntensity;
    }

    const clearcoat = extras.clearcoat != null ? extras.clearcoat : (preset.clearcoat || 0);
    const transmission = extras.transmission != null ? extras.transmission : (preset.transmission || 0);
    const needsPhysical = clearcoat > 0.05 || transmission > 0.01 ||
        (preset.ior && preset.ior !== 1.5) || extras.forcePhysical;

    if (needsPhysical && typeof THREE !== 'undefined' && typeof THREE.MeshPhysicalMaterial === 'function') {
        if (clearcoat > 0.05) {
            params.clearcoat = clearcoat;
            params.clearcoatRoughness = extras.clearcoatRoughness != null
                ? extras.clearcoatRoughness
                : (preset.clearcoatRoughness != null ? preset.clearcoatRoughness : 0.05);
        }
        if (preset.ior != null || extras.ior != null) {
            params.ior = extras.ior != null ? extras.ior : preset.ior;
        }
        if (transmission > 0.01) {
            params.transmission = transmission;
            params.thickness = extras.thickness != null ? extras.thickness : (preset.thickness || 1.0);
            params.transparent = true;
            params.opacity = extras.opacity != null ? extras.opacity : (preset.opacity != null ? preset.opacity : 1);
            if (preset.attenuationColor || extras.attenuationColor) {
                try {
                    params.attenuationColor = new THREE.Color(extras.attenuationColor || preset.attenuationColor);
                } catch (e) {}
            }
            if (preset.attenuationDistance != null || extras.attenuationDistance != null) {
                params.attenuationDistance = extras.attenuationDistance != null
                    ? extras.attenuationDistance
                    : preset.attenuationDistance;
            }
        }
        if (preset.reflectivity != null || extras.reflectivity != null) {
            params.reflectivity = extras.reflectivity != null ? extras.reflectivity : preset.reflectivity;
        }
        params.__usePhysical = true;
    }
    return params;
};

window.createKitchenPBRMaterial = function(params) {
    params = params || {};
    const usePhysical = params.__usePhysical;
    delete params.__usePhysical;
    if (usePhysical && typeof THREE.MeshPhysicalMaterial === 'function') {
        return new THREE.MeshPhysicalMaterial(params);
    }
    return new THREE.MeshStandardMaterial(params);
};


// =====================================================================
// مرحله 6 — TextureLoader / ColorSpace
// رنگی (map, emissive): SRGBColorSpace
// داده‌ای (normal/roughness/bump/metalness/ao): NoColorSpace
// TextureLoader پیش‌فرض = رنگی (تکسچر MDF/کاتالوگ)
// =====================================================================
(function unifyAllTextureColors() {
    /** اعمال colorSpace صحیح روی تکسچر
     *  kind: 'color' | 'data'
     */
    window.applyKitchenTextureColorSpace = function (tex, kind) {
        if (!tex || typeof THREE === 'undefined') return tex;
        const isData = (kind === 'data' || kind === 'linear' || kind === 'bump' ||
            kind === 'normal' || kind === 'roughness' || kind === 'metalness' || kind === 'ao');
        if (isData) {
            if (THREE.NoColorSpace != null) tex.colorSpace = THREE.NoColorSpace;
            else if (THREE.LinearSRGBColorSpace != null) tex.colorSpace = THREE.LinearSRGBColorSpace;
        } else {
            if (THREE.SRGBColorSpace != null) tex.colorSpace = THREE.SRGBColorSpace;
        }
        return tex;
    };

    /**
     * اگر همان تکسچر رنگی برای bumpMap هم لازم است،
     * یک کلون با NoColorSpace برمی‌گرداند تا map خراب نشود.
     */
    window.asDataMapTexture = function (srcTex) {
        if (!srcTex || typeof THREE === 'undefined') return srcTex;
        // اگر از قبل data است، همان را برگردان
        if (THREE.NoColorSpace != null && srcTex.colorSpace === THREE.NoColorSpace) return srcTex;
        let clone;
        try {
            clone = srcTex.clone();
        } catch (e) {
            clone = srcTex;
        }
        window.applyKitchenTextureColorSpace(clone, 'data');
        clone.needsUpdate = true;
        return clone;
    };

    function applyTexturePatch() {
        if (typeof THREE === 'undefined' || !THREE.TextureLoader) return;
        if (THREE.TextureLoader.prototype.__unifiedColorPatch) return;
        const originalLoad = THREE.TextureLoader.prototype.load;

        // مرحله 43 — Texture Optimization (موبایل: سایز، mipmap، anisotropy، cache)
        window.optimizeKitchenTexture = function (tex, opts) {
            if (!tex) return tex;
            opts = opts || {};
            const isMobile = !!(window.Kitchen3D && Kitchen3D._isMobile) ||
                (typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || ''));
            const maxEdge = opts.maxEdge || (isMobile ? 1024 : 2048);
            const maxAniso = isMobile ? 2 : 4;

            if (typeof window.applyKitchenTextureColorSpace === 'function') {
                window.applyKitchenTextureColorSpace(tex, opts.dataMap ? 'data' : 'color');
            } else if (THREE.SRGBColorSpace != null && !opts.dataMap) {
                tex.colorSpace = THREE.SRGBColorSpace;
            }

            // Mipmaps + فیلتر مناسب
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            if (window.Kitchen3D && Kitchen3D.renderer) {
                tex.anisotropy = Math.min(maxAniso, Kitchen3D.renderer.capabilities.getMaxAnisotropy() || maxAniso);
            } else {
                tex.anisotropy = maxAniso;
            }

            // محدود کردن سایز تصویر روی موبایل (canvas downscale)
            try {
                const img = tex.image;
                if (img && (img.width || img.videoWidth) && isMobile) {
                    const w = img.width || img.videoWidth || 0;
                    const h = img.height || img.videoHeight || 0;
                    const edge = Math.max(w, h);
                    if (edge > maxEdge && typeof document !== 'undefined') {
                        const scale = maxEdge / edge;
                        const nw = Math.max(1, Math.round(w * scale));
                        const nh = Math.max(1, Math.round(h * scale));
                        const canvas = document.createElement('canvas');
                        canvas.width = nw;
                        canvas.height = nh;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, nw, nh);
                            tex.image = canvas;
                            tex.needsUpdate = true;
                        }
                    }
                }
            } catch (e) { /* ignore */ }

            tex.needsUpdate = true;
            return tex;
        };

        THREE.TextureLoader.prototype.load = function (url, onLoad, onProgress, onError) {
            const tex = originalLoad.call(this, url, function (loadedTex) {
                if (typeof window.optimizeKitchenTexture === 'function') {
                    window.optimizeKitchenTexture(loadedTex);
                }
                if (onLoad) onLoad(loadedTex);
            }, onProgress, onError);

            if (typeof window.optimizeKitchenTexture === 'function') {
                window.optimizeKitchenTexture(tex);
            }
            return tex;
        };

        THREE.TextureLoader.prototype.__unifiedColorPatch = true;
    }
    if (typeof window.whenThreeReady === 'function') {
        window.whenThreeReady(applyTexturePatch);
    } else if (typeof THREE !== 'undefined') {
        applyTexturePatch();
    } else {
        window.addEventListener('three-ready', applyTexturePatch, { once: true });
    }
})();

// ---------------------------------------------------------------------------
// Three.js r186 (via three-bridge.js)
// Environment Map: PMREM با intensity پایین (مرحله 46) — برای براق/شیشه/فلز.
// ---------------------------------------------------------------------------
(function threeVersionInfo() {
    function logVer() {
        if (typeof THREE === 'undefined') return;
        try {
            if (console && console.info) console.info('[Kitchen3D] Three.js r' + (THREE.REVISION || '?') + ' loaded');
        } catch (e) { /* ignore */ }
    }
    if (typeof window.whenThreeReady === 'function') window.whenThreeReady(logVer);
    else if (typeof THREE !== 'undefined') logVer();
    else window.addEventListener('three-ready', logVer, { once: true });
})();

const Kitchen3D = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    animationId: null,

    // r186: THREE بعد از three-bridge لود می‌شود
    raycaster: null,
    mouse: null,

    // ---- Shared Geometry / Material cache (فاز ۱۱ — بهینه‌سازی r186) ----
    _geoCache: Object.create(null),
    _matCache: Object.create(null),

    /**
     * هندسه اشتراکی — یک بار ساخته می‌شود، بین مش‌ها reuse
     * @param {string} key کلید یکتا (شامل پارامترها)
     * @param {function(): THREE.BufferGeometry} factory
     */
    getSharedGeometry: function(key, factory) {
        if (!this._geoCache) this._geoCache = Object.create(null);
        if (!this._geoCache[key]) {
            const g = factory();
            if (g) {
                g.userData = g.userData || {};
                g.userData.sharedGeometry = true;
                g.userData.sharedKey = key;
            }
            this._geoCache[key] = g;
        }
        return this._geoCache[key];
    },

    /**
     * متریال اشتراکی (مثلاً کروم دستگیره یکسان)
     */
    getSharedMaterial: function(key, factory) {
        if (!this._matCache) this._matCache = Object.create(null);
        if (!this._matCache[key]) {
            const m = factory();
            if (m) {
                m.userData = m.userData || {};
                m.userData.sharedMaterial = true;
                m.userData.sharedKey = key;
            }
            this._matCache[key] = m;
        }
        return this._matCache[key];
    },

    _texCache: Object.create(null),

    /** تکسچر اشتراکی برای یک URL — یک TextureLoader برای همه مش‌ها */
    getSharedTexture: function(url, onLoad) {
        if (!url) return null;
        if (!this._texCache) this._texCache = Object.create(null);
        const key = String(url);
        if (this._texCache[key]) {
            if (onLoad) onLoad(this._texCache[key]);
            return this._texCache[key];
        }
        const loader = new THREE.TextureLoader();
        if (typeof loader.setCrossOrigin === 'function') loader.setCrossOrigin('anonymous');
        const self = this;
        const tex = loader.load(key, function (loaded) {
            if (typeof window.optimizeKitchenTexture === 'function') {
                window.optimizeKitchenTexture(loaded);
            } else if (THREE.SRGBColorSpace != null) {
                loaded.colorSpace = THREE.SRGBColorSpace;
            }
            loaded.userData = loaded.userData || {};
            loaded.userData.sharedTexture = true;
            loaded.needsUpdate = true;
            if (onLoad) onLoad(loaded);
        });
        if (typeof window.optimizeKitchenTexture === 'function') {
            window.optimizeKitchenTexture(tex);
        } else if (THREE.SRGBColorSpace != null) {
            tex.colorSpace = THREE.SRGBColorSpace;
        }
        tex.userData = tex.userData || {};
        tex.userData.sharedTexture = true;
        this._texCache[key] = tex;
        return tex;
    },

    /**
     * متریال استاندارد/فیزیکال اشتراکی از روی مشخصات یکسان
     * 30 کابینت MDF یکسان → 1 Material
     */
    buildSharedSurfaceMaterial: function(spec) {
        spec = spec || {};
        const finish = spec.finish || 'matte';
        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(finish)
            : {};
        const mapUrl = spec.mapUrl || '';
        const color = (spec.color != null) ? String(spec.color) : '';
        const rough = spec.roughness != null ? Number(spec.roughness) : (preset.roughness != null ? preset.roughness : 0.55);
        const metal = spec.metalness != null ? Number(spec.metalness) : (preset.metalness != null ? preset.metalness : 0.03);
        const envI = spec.envMapIntensity != null ? Number(spec.envMapIntensity) : (preset.envMapIntensity != null ? preset.envMapIntensity : 0.5);
        const bump = spec.bumpScale != null ? Number(spec.bumpScale) : (preset.bumpScale != null ? preset.bumpScale : 0);
        const clearcoat = spec.clearcoat != null ? Number(spec.clearcoat) : (preset.clearcoat || 0);
        const transmission = spec.transmission != null ? Number(spec.transmission) : (preset.transmission || 0);
        // تکسچر کاتالوگ: بدون نور/PBR تا دقیقاً همان تصویر دیده شود (نه تیره‌تر نه روشن‌تر)
        const key = mapUrl
            ? ['albedo-exact', mapUrl].join('|')
            : ['pbr', finish, color, rough.toFixed(3), metal.toFixed(3), envI.toFixed(2), bump.toFixed(2), clearcoat.toFixed(2), transmission.toFixed(2)].join('|');

        const self = this;
        return this.getSharedMaterial(key, function () {
            // —— مسیر دقیق تکسچر: MeshBasicMaterial (بدون سایه/محیط/پرداخت رنگی) ——
            if (mapUrl) {
                const tex = self.getSharedTexture(mapUrl);
                if (tex) {
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    if (typeof window.applyKitchenTextureColorSpace === 'function') {
                        window.applyKitchenTextureColorSpace(tex, 'color');
                    } else if (THREE.SRGBColorSpace != null) {
                        tex.colorSpace = THREE.SRGBColorSpace;
                    }
                    tex.needsUpdate = true;
                }
                return new THREE.MeshBasicMaterial({
                    map: tex || null,
                    color: 0xffffff,
                    toneMapped: false  // از ACES/exposure تیره‌کننده رد شود
                });
            }

            let params = {};
            // Base Color (بدون map)
            if (false) {
            } else if (color) {
                try { params.color = new THREE.Color(color); }
                catch (e) { params.color = 0xffffff; }
            } else {
                params.color = 0xffffff;
            }

            // Normal map جدا (اختیاری)
            if (spec.normalMapUrl) {
                const nTex = self.getSharedTexture(spec.normalMapUrl);
                if (nTex) {
                    if (typeof window.applyKitchenTextureColorSpace === 'function') {
                        window.applyKitchenTextureColorSpace(nTex, 'normal');
                    } else if (THREE.NoColorSpace != null) {
                        nTex.colorSpace = THREE.NoColorSpace;
                    }
                    params.normalMap = nTex;
                    params.normalScale = new THREE.Vector2(
                        spec.normalScale != null ? spec.normalScale : 1,
                        spec.normalScale != null ? spec.normalScale : 1
                    );
                }
            }

            // PBR کامل: Roughness / Metalness / Clearcoat / IOR / Transmission
            if (typeof window.applyKitchenPBRParams === 'function') {
                params = window.applyKitchenPBRParams(params, preset, {
                    roughness: rough,
                    metalness: metal,
                    envMapIntensity: envI,
                    clearcoat: clearcoat,
                    clearcoatRoughness: spec.clearcoatRoughness != null ? spec.clearcoatRoughness : preset.clearcoatRoughness,
                    transmission: transmission,
                    thickness: spec.thickness != null ? spec.thickness : preset.thickness,
                    ior: spec.ior != null ? spec.ior : preset.ior,
                    reflectivity: spec.reflectivity != null ? spec.reflectivity : preset.reflectivity
                });
            } else {
                params.roughness = rough;
                params.metalness = metal;
                params.envMapIntensity = envI;
            }

            if (typeof window.createKitchenPBRMaterial === 'function') {
                return window.createKitchenPBRMaterial(params);
            }
            if (params.__usePhysical && typeof THREE.MeshPhysicalMaterial === 'function') {
                delete params.__usePhysical;
                return new THREE.MeshPhysicalMaterial(params);
            }
            delete params.__usePhysical;
            return new THREE.MeshStandardMaterial(params);
        });
    },

    /** هنگام dispose — هندسه/متریال اشتراکی را آزاد نکن */
    safeDisposeGeometry: function(geo) {
        if (!geo || !geo.dispose) return;
        if (geo.userData && geo.userData.sharedGeometry) return;
        try { geo.dispose(); } catch (e) {}
    },
    safeDisposeMaterial: function(mat) {
        if (!mat || !mat.dispose) return;
        if (mat.userData && mat.userData.sharedMaterial) return;
        try { mat.dispose(); } catch (e) {}
    },

    /**
     * آزادسازی کامل درخت Object3D از GPU (هندسه / متریال / تکسچر غیرمشترک / سایه نور)
     * برای جلوگیری از کرش بعد از کار طولانی با رفرش مکرر کابینت‌ها
     */
    disposeObjectTree: function(root) {
        if (!root) return;
        const self = this;
        const mapKeys = [
            'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap',
            'bumpMap', 'emissiveMap', 'alphaMap', 'lightMap', 'displacementMap',
            'clearcoatMap', 'clearcoatNormalMap', 'transmissionMap'
        ];

        // از لیست انیمیشن هم خارج کن
        if (self._animatingObjects && self._animatingObjects.has) {
            try {
                root.traverse(function (ch) {
                    if (self._animatingObjects.has(ch)) self._animatingObjects.delete(ch);
                });
                if (self._animatingObjects.has(root)) self._animatingObjects.delete(root);
            } catch (e) {}
        }

        try {
            root.traverse(function (child) {
                if (!child) return;
                if (child.geometry) {
                    self.safeDisposeGeometry(child.geometry);
                    child.geometry = null;
                }
                if (child.material) {
                    const list = Array.isArray(child.material) ? child.material : [child.material];
                    for (let i = 0; i < list.length; i++) {
                        const m = list[i];
                        if (!m) continue;
                        for (let k = 0; k < mapKeys.length; k++) {
                            const tex = m[mapKeys[k]];
                            if (tex && tex.dispose && !(tex.userData && tex.userData.sharedTexture)) {
                                try { tex.dispose(); } catch (e2) {}
                            }
                        }
                        self.safeDisposeMaterial(m);
                    }
                    child.material = null;
                }
                // سایه نورها حافظه زیادی می‌گیرند
                if (child.isLight && child.shadow && child.shadow.map) {
                    try { child.shadow.map.dispose(); } catch (e3) {}
                    try { child.shadow.map = null; } catch (e4) {}
                }
            });
        } catch (e) {}

        if (root.parent) {
            try { root.parent.remove(root); } catch (e) {}
        } else if (self.scene) {
            try { self.scene.remove(root); } catch (e) {}
        }
    },
    
    // مراجع جدید برای کنترل لامپ
    ceilingLight: null, 
    bulbMesh: null,
    
             config: {
    wallHeight: 280,
    wallThickness: 20,
    hasTop: true,
    hasLeft: true,
    hasRight: true,
    hasBottom: false,
    wallColor: 0xeaeaea,
    floorColor: 0xeeeeee,
    ceilingColor: 0xffffff,
    ceilingThickness: 18,          // ضخامت واقعی سقف (cm)
    ceilingRoughness: 0.82,        // گچ مات
    ceilingCornice: true,          // قرنیز/کُوِه گوشه سقف-دیوار
    ceilingCorniceH: 6,            // ارتفاع قرنیز
    ceilingCorniceD: 5,            // پیش‌آمدگی قرنیز از دیوار
    backgroundColor: 0xf5f5f7,
    // ---- مرحله 48 — نورپردازی پیشرفته ----
    ceilingLightIntensity: 2600,     // هالوژن سقف (متعادل‌تر از 3200)
    ceilingLightColor: 0xfff2e6,      // سفید گرم
    ceilingLightRange: 0,             // 0 = خودکار
    ceilingLightAngle: 1.15,          // پوشش یکنواخت‌تر
    ceilingLightPenumbra: 0.94,       // لبه خیلی نرم
    ceilingLightDecay: 2,
    ceilingLightShadows: true,
    ceilingLightOn: true,

    // نور پایه / روز
    ambientLightIntensity: 0.42,
    hemiLightIntensity: 0.38,
    dirLightIntensity: 0.55,          // نور طبیعی پنجره/روز

    // زیر کابینت دیواری
    underCabinetBaseIntensity: 850,
    underCabinetFillIntensity: 140,
    underCabinetColor: 0xfff2e0,

    // داخل یونیت
    interiorBaseIntensity: 180,

    // تاج
    crownSpotIntensity: 480,
    crownFillIntensity: 90,
    crownLightColor: 0xfff0e0,

    // پنجره / نور طبیعی
    windowLightIntensity: 1400,
    windowLightColor: 0xfff4e8,

    // مرحله 49 — Post Processing (شدت کم؛ موبایل سبک‌تر)
    postProcessing: true,
    postBloom: true,
    postBloomStrength: 0.12,   // خیلی کم — جلوگیری از سفید شدن
    postBloomRadius: 0.35,
    postBloomThreshold: 0.88,
    postAA: true,              // SMAA / FXAA
    postColorGrade: true,
    postSharpen: true,
    postSharpenAmount: 0.12,
        ambientLightIntensity: 0.48,
    dirLightIntensity: 0.1,

    // 🆕 جدید
    wallStyle: 'ceramic',          // 'ceramic' | 'white'
    wallBandLowerColor1: '#fdfbf7',
    wallBandLowerColor2: '#f4f1ea',
    wallBandMidColor1: '#161616',
    wallBandMidColor2: '#1d1d1d',
    wallBandUpperColor1: '#fdfbf7',
    wallBandUpperColor2: '#f4f1ea',
    wallGroutColor: '#c8c2b8',     // رنگ بند سرامیک دیوار
    wallRoughness: 0.42,           // زبری سطح سرامیک (واقعی‌تر از براق افراطی)
    wallBumpScale: 0.35,           // عمق گروت / برجستگی کاشی
    floorStyle: 'ceramic',         // 'ceramic' | 'parquet'
    floorTileColor1: '#DCD3C6',
    floorTileColor2: '#CFC4B5',
    floorGroutColor: '#9a8f82',
    floorTileSizeCm: 60,           // ابعاد واقعی کاشی کف (cm)
    floorRoughness: 0.38,          // زبری سطح سرامیک کف
    floorBumpScale: 0.55,          // عمق گروت / برجستگی کاشی
    floorEnvIntensity: 0.4         // بازتاب کنترل‌شده
},

    // --- توابع اصلی کنترل ---

        open: function() {
        if (typeof THREE === 'undefined') {
            alert("خطا: کتابخانه Three.js لود نشده است. چند لحظه صبر کنید و دوباره تلاش کنید.");
            return;
        }
        if (!this.raycaster) this.raycaster = new THREE.Raycaster();
        if (!this.mouse) this.mouse = new THREE.Vector2();
        if (typeof room === 'undefined' || room.w <= 0) {
            alert("لطفاً ابتدا ابعاد اتاق را تایید کنید.");
            return;
        }

        const modal = document.getElementById('modal-3d');
        // 👇 این شرط اضافه شد
        if (modal) {
            modal.classList.add('open');
        }

        setTimeout(() => this.init(), 100);
    },


             close: function() {
        const modal = document.getElementById('modal-3d');
        if (modal) {
            modal.classList.remove('open');
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        // 👇👇 تغییر جدید: پاکسازی wallEditor برای جلوگیری از تکرار عملکردها 👇👇
        if (typeof wallEditor !== 'undefined' && wallEditor) {
            wallEditor.enabled = false;
            // اگر دیواری در حالت انتخاب است، از حالت انتخاب خارج شود
            if (wallEditor.selectedWall) wallEditor.removeHighlight(wallEditor.selectedWall);
            // پاکسازی رفرنس
            wallEditor = null; 
        }
        // 👆👆 پایان بخش جدید 👆👆

        if (this.renderer) {
            this.renderer.dispose();
            const container = document.getElementById('3d-container');
            if (container) container.innerHTML = '';
        }
        
        // پاکسازی مراجع
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.ceilingLight = null;
        this.bulbMesh = null;
        this.controls = null;
    },



    // 🎨 تابع جدید برای بروزرسانی رنگ محیط بدون نیاز به رفرش کامل
    refreshRoom: function() {
        if (!this.scene) return;
        
        // پاک کردن محیط قبلی
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            if (child.isMesh && (child.geometry.type === 'PlaneGeometry' || child.geometry.type === 'ExtrudeGeometry')) {
                // فرض بر این است که دیوارها، کف و سقف از این نوع هستند (ساده‌ترین راه بازسازی است)
                objectsToRemove.push(child);
            }
        });
        
        // بازسازی مجدد محیط با رنگ‌های جدید
        const centerX = room.w / 2;
        const centerZ = room.d / 2;
        
        // حذف دیوارهای قدیمی
        this.scene.children = this.scene.children.filter(child => !objectsToRemove.includes(child));
        
        // ساخت مجدد محیط
        this.createEnvironment(centerX, centerZ);
    },

    // --- راه‌اندازی صحنه ---

            init: function() {
        const container = document.getElementById('3d-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        const centerX = room.w / 2;
        const centerZ = room.d / 2;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.fog = null; // بدون مه
        // رنگ پس‌زمینه بیرون از محیط اتاق
        this.scene.background = new THREE.Color(this.config.backgroundColor || 0xe0e4ea);

// ==========================================        // 2. Camera (اصلاح شده: تنظیم هوشمند ارتفاع بر اساس سقف)
        // ==========================================
        this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 8000);
        
        // محاسبه ارتفاع واقعی اتاق
        const currentRoomH = room.h || (this.config && this.config.wallHeight) || 280;
        
        // دوربین را در 55 درصد ارتفاع سقف قرار می‌دهیم
        this.camera.position.set(centerX, currentRoomH * 0.55, room.d - 40);

        // 3. Renderer
        // 3. Renderer — r186
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        // pixelRatio سقف‌دار (موبایل/رتینا)
        const isMobile = (width < 768) || (typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || ''));
        this._isMobile = !!isMobile;
        // بهینه‌سازی: pixelRatio پایین‌تر = GPU کمتر (کیفیت هنوز خوب است)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5));

        // مرحله 44 — Shadow Optimization
        this.renderer.shadowMap.enabled = true;
        // موبایل: PCF ساده (سریع‌تر) | دسکتاپ: Soft
        this.renderer.shadowMap.type = isMobile
            ? (THREE.PCFShadowMap != null ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap)
            : THREE.PCFSoftShadowMap;
        // autoUpdate دستی در animate — هر ۲ فریم یک‌بار (سبک‌تر)
        if (this.renderer.shadowMap.autoUpdate !== undefined) {
            this.renderer.shadowMap.autoUpdate = false;
        }
        this._animatingObjects = this._animatingObjects || new Set();
        this._shadowFrame = 0;

        // Color Management + Tone Mapping (r186)
        // physicallyCorrectLights در r155+ حذف شد؛ نور فیزیکی پیش‌فرض است
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = isMobile ? 0.88 : 0.92;
        this.renderer.localClippingEnabled = true; 

        container.appendChild(this.renderer.domElement);
                // ==========================================
        // 4. Controls
        // ==========================================
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        window.controls = this.controls; // برای اینکه ادیتور بتواند کنترلر دوربین را موقتاً غیرفعال کند
       
        // هدف دوربین در 35 درصد ارتفاع سقف
        this.controls.target.set(centerX, currentRoomH * 0.35, centerZ);
        
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 1.8;
        this.controls.keys = {};

        // برد زوم مناسب برای دیدن از بیرون و داخل
        this.controls.minDistance = 40;
        this.controls.maxDistance = 2500; 

        // مرز نامرئی روی کل خانه و محیط بیرونی (Environment Box) — قابل دیدن از بیرون
        this.controls.addEventListener('change', () => {
            if (!this.config) return;
            
            const margin = 20;
            const E = 820; // فضای بیرون خانه
            
            const currentW = this.config.w || room.w;
            const currentD = this.config.d || room.d;
            const currentH = room.h || this.config.wallHeight || this.config.h || 280;

            const minX = -E + margin;
            const maxX = currentW + E - margin;
            const minZ = -E + margin;
            const maxZ = currentD + E - margin;

            const minY = margin;
            const maxY = currentH - margin;

            this.camera.position.x = Math.max(minX, Math.min(maxX, this.camera.position.x));
            this.camera.position.y = Math.max(minY, Math.min(maxY, this.camera.position.y));
            this.camera.position.z = Math.max(minZ, Math.min(maxZ, this.camera.position.z));

            this.controls.target.x = Math.max(minX, Math.min(maxX, this.controls.target.x));
            this.controls.target.y = Math.max(minY, Math.min(maxY, this.controls.target.y));
            this.controls.target.z = Math.max(minZ, Math.min(maxZ, this.controls.target.z));
        });



        // 5. Lighting & Objects
        this.setupLights(centerX, centerZ);
        this.createEnvironment(centerX, centerZ);
        this.createCeilingLamp(centerX, centerZ); // لامپ سقف
        // مرحله 46 — PMREM Environment برای High Gloss / Glass / Metal / Marble
        if (typeof this.setupEnvironmentReflection === 'function') {
            this.setupEnvironmentReflection();
        }
        // مرحله 49 — Post Processing
        if (typeof this.setupPostProcessing === 'function') {
            this.setupPostProcessing();
        }

        this.renderCabinets();
        this.renderPillars();
        // بعد از ساخت یونیت‌ها: envMapIntensity متریال‌های مات را محدود کن
        if (typeof this.clampMatteEnvMapIntensity === 'function') {
            this.clampMatteEnvMapIntensity();
        }
          
        // فراخوانی توابع ساخت صفحات رویه، تاج و پنل‌ها
        if (typeof updateAllCountertopsIn3D === 'function') {
            updateAllCountertopsIn3D();
        }
        if (typeof updateAllCabinetCrownsIn3D === 'function') {
            updateAllCabinetCrownsIn3D();
        }
        this.refreshInterPanels();

        // 6. Events
        this.renderer.domElement.addEventListener('click', (e) => this.onObjectClick(e));
        
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.onObjectClick(e.touches[0]);
            }
        }, { passive: false });

        window.addEventListener('resize', () => this.onWindowResize());
        
        // 👇👇 کدهای جدید برای تغییر سایز خودکار نمای 3D با باز/بسته شدن منو 👇👇
        if (!this.resizeObserver) {
            // استفاده از Arrow Function برای حفظ کانتکست this
            this.resizeObserver = new ResizeObserver(() => {
                if (typeof this.onWindowResize === 'function') {
                    this.onWindowResize();
                }
            });
        }
        if (container) {
            this.resizeObserver.observe(container);
        }
        // 👆👆 پایان کدهای جدید 👆👆

        this.animate();
    },


/**
 * Shadow حرفه‌ای — تمرکز روی نقاط مهم:
 * زیر کابینت، بین درب‌ها، داخل یونیت، زیر صفحه، روی کف، پشت تاج، کنار دیوار
 */
applyProfessionalShadows: function() {
    if (!this.scene) return;

    // Renderer
    if (this.renderer && this.renderer.shadowMap) {
        // Shadow API r186 — همان PCF Soft قبلی
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.needsUpdate = true;
    }

    // تنظیم دقیق‌تر دوربین سایه نور جهت‌دار روی محدوده فعلی اتاق
    if (this.dirLight && this.dirLight.shadow) {
        const rw = (typeof room !== 'undefined' && room.w) ? room.w : 400;
        const rd = (typeof room !== 'undefined' && room.d) ? room.d : 400;
        const rh = (typeof room !== 'undefined' && room.h) ? room.h : 280;
        const halfW = Math.max(rw, rd) * 0.65 + 80;
        const cam = this.dirLight.shadow.camera;
        cam.left = -halfW; cam.right = halfW;
        cam.top = halfW; cam.bottom = -halfW;
        cam.near = 20;
        cam.far = Math.max(800, rh + rw + rd);
        if (cam.updateProjectionMatrix) cam.updateProjectionMatrix();
        this.dirLight.shadow.bias = -0.00035;
        this.dirLight.shadow.normalBias = 0.035;
        this.dirLight.shadow.radius = 3.5;
    }

    this.scene.traverse(obj => {
        if (!obj.isMesh) return;
        const ud = obj.userData || {};
        const name = (obj.name || '').toLowerCase();

        // اشیایی که نباید سایه سنگین داشته باشند
        const isGlass = !!(ud.isGlass || (obj.material && (obj.material.transmission > 0.3 || (obj.material.transparent && obj.material.opacity < 0.5))));
        const isLed = !!(ud.isCrownLed || ud.isUnderCabinetLed || ud.isInteriorCabinetLed || ud.isCrownLedLight);
        const isLightHelper = !!(ud.isCeilingLamp);

        if (isLed || isLightHelper) {
            obj.castShadow = false;
            obj.receiveShadow = true;
            return;
        }

        // کف و سقف: فقط دریافت سایه
        if (ud.isCeiling || name.indexOf('floor') >= 0 || name.indexOf('ceil') >= 0) {
            obj.castShadow = false;
            obj.receiveShadow = true;
            return;
        }

        // دیوارها: دریافت + کمی پرتاب (کنار دیوار سایه یونیت)
        if (ud.isWall || ud.isCustomWall || name.indexOf('wall') >= 0) {
            obj.castShadow = true;
            obj.receiveShadow = true;
            return;
        }

        // کابینت / درب / کشو / پاخور / صفحه / تاج / طبقات
        if (
            ud.isCabinet || ud.isDoor || ud.isDrawer || ud.isCrown ||
            ud.isKickboard || ud.isCountertop || ud.isShelf ||
            ud.isUnitBody || ud.isFacade || ud.isClosetFrame ||
            name.indexOf('door') >= 0 || name.indexOf('cabinet') >= 0
        ) {
            obj.castShadow = !isGlass;
            obj.receiveShadow = true;
            return;
        }

        // پیش‌فرض مش‌های صحنه آشپزخانه
        if (!ud.excludeFromExport) {
            obj.castShadow = !isGlass;
            obj.receiveShadow = true;
        }
    });

    // کف را صریحاً پیدا کن
    this.scene.traverse(obj => {
        if (!obj.isMesh) return;
        if (obj.receiveShadow === undefined) return;
        // BoxGeometry کف ضخیم معمولاً y منفی دارد
        if (obj.geometry && obj.geometry.type === 'BoxGeometry' && obj.position && obj.position.y < 0) {
            obj.receiveShadow = true;
        }
    });
},


/** دوربین قبلی — بدون محدودیت سخت داخل کابینت */
constrainCameraArchitectural: function() {
    // غیرفعال — محدودیت قبلی Environment Box کافی است
},

setupLights: function(centerX, centerZ) {
    // مرحله 48 — نور پایه / طبیعی
    // Ambient + Hemisphere + Directional = روز بدون چراغ کابینت هم خوانا

    const cfg = this.config || {};
    const ambientIntensity = cfg.ambientLightIntensity != null
        ? Math.max(0.28, parseFloat(cfg.ambientLightIntensity))
        : 0.42;
    const hemiIntensity = cfg.hemiLightIntensity != null
        ? parseFloat(cfg.hemiLightIntensity)
        : 0.38;
    const dirIntensity = cfg.dirLightIntensity != null
        ? parseFloat(cfg.dirLightIntensity)
        : 0.55;

    // ۱. Ambient — پرکننده سایه (نه سفیدکننده)
    const ambientLight = new THREE.AmbientLight(0xf7f5f2, ambientIntensity);
    this.scene.add(ambientLight);
    this.ambientLight = ambientLight;

    // ۲. Hemisphere — آسمان سرد / زمین گرم (نور طبیعی)
    const hemiLight = new THREE.HemisphereLight(0xe8eef8, 0xb0a090, hemiIntensity);
    hemiLight.position.set(0, (room.h || 280) + 50, 0);
    this.scene.add(hemiLight);
    this.hemiLight = hemiLight;

    // ۳. Directional — نور روز (پنجره / خورشید نرم)
    const dirLight = new THREE.DirectionalLight(0xfff8f0, dirIntensity);
    dirLight.color.setRGB(1.0, 0.97, 0.93);
    dirLight.userData.isNaturalLight = true;
    const rw = (typeof room !== 'undefined' && room.w) ? room.w : 400;
    const rd = (typeof room !== 'undefined' && room.d) ? room.d : 400;
    const rh = (typeof room !== 'undefined' && room.h) ? room.h : 280;
    dirLight.position.set(rw * 0.35 + 120, rh + 280, rd * 0.25 + 100);
    dirLight.target.position.set(rw * 0.5, rh * 0.35, rd * 0.5);
    this.scene.add(dirLight.target);

    // Shadow حرفه‌ای: فریم روی محدوده اتاق (نه کل دنیا) تا دقت سایه روی کف/کابینت بیشتر شود
    dirLight.castShadow = true;
    // سایه dir: 512 موبایل / 1024 دسکتاپ
    const mapSize = this._isMobile ? 512 : 1024;
    dirLight.shadow.mapSize.width = mapSize;
    dirLight.shadow.mapSize.height = mapSize;
    dirLight.shadow.camera.near = 20;
    dirLight.shadow.camera.far = Math.max(800, rh + rw + rd);
    // Tight frustum around kitchen volume
    const halfW = Math.max(rw, rd) * 0.65 + 80;
    dirLight.shadow.camera.left = -halfW;
    dirLight.shadow.camera.right = halfW;
    dirLight.shadow.camera.top = halfW;
    dirLight.shadow.camera.bottom = -halfW;
    dirLight.shadow.bias = -0.00035;
    dirLight.shadow.normalBias = 0.035;
    dirLight.shadow.radius = 3.5; // نرم‌تر شدن لبه سایه (PCF)
    if (dirLight.shadow.camera.updateProjectionMatrix) {
        dirLight.shadow.camera.updateProjectionMatrix();
    }

    this.scene.add(dirLight);
    this.dirLight = dirLight;

    // اعمال پرچم‌های سایه روی صحنه بعد از ساخت
    if (typeof this.applyProfessionalShadows === 'function') {
        // تأخیر کوتاه تا کف/دیوار/کابینت ساخته شده باشند
        setTimeout(() => this.applyProfessionalShadows(), 0);
    }
},





    // تابع جدید برای ساخت لامپ سقفی
 createCeilingLamp: function() {
    if (this.lampMasterGroup) {
        this.scene.remove(this.lampMasterGroup);
        this.lampMasterGroup = null;
    }

    this.lampMasterGroup = new THREE.Group();
    this.ceilingLights = [];
    this.bulbMeshes = [];

    const cfg = this.config || {};
    const h = (typeof room !== 'undefined' && room.h) ? room.h : (cfg.wallHeight || 280);
    const rw = (typeof room !== 'undefined' && room.w) ? room.w : 400;
    const rd = (typeof room !== 'undefined' && room.d) ? room.d : 400;

    // --- پارامترهای کنترل‌شده نور سقفی ---
    const intensity = (cfg.ceilingLightIntensity != null) ? parseFloat(cfg.ceilingLightIntensity) : 3200;
    const lightColor = (cfg.ceilingLightColor != null) ? cfg.ceilingLightColor : 0xfff1e0;
    const range = (cfg.ceilingLightRange && parseFloat(cfg.ceilingLightRange) > 0)
        ? parseFloat(cfg.ceilingLightRange)
        : Math.max(380, h * 1.65 + 40);
    const angle = (cfg.ceilingLightAngle != null) ? parseFloat(cfg.ceilingLightAngle) : 1.25;
    const penumbra = (cfg.ceilingLightPenumbra != null) ? parseFloat(cfg.ceilingLightPenumbra) : 0.92;
    const decay = (cfg.ceilingLightDecay != null) ? parseFloat(cfg.ceilingLightDecay) : 2;
    const shadowsEnabled = (cfg.ceilingLightShadows !== false);
    const startOn = (cfg.ceilingLightOn !== false);
    this._ceilingLightIntensity = intensity; // برای toggle بدون سوختن صحنه

    // چیدمان ۵ نقطه‌ای برای پوشش یکنواخت
    const positions = [
        { x: rw * 0.25, z: rd * 0.25, shadow: false },
        { x: rw * 0.75, z: rd * 0.25, shadow: false },
        { x: rw * 0.50, z: rd * 0.50, shadow: true },  // فقط مرکز سایه می‌اندازد
        { x: rw * 0.25, z: rd * 0.75, shadow: false },
        { x: rw * 0.75, z: rd * 0.75, shadow: false }
    ];

    const ceilT = (cfg.ceilingThickness != null) ? parseFloat(cfg.ceilingThickness) : 18;
    const undersideY = h - 0.3;
    const recessY = undersideY - 1.2;

    positions.forEach((pos, idx) => {
        const lampGroup = new THREE.Group();
        lampGroup.userData.isCeilingLamp = true;
        lampGroup.userData.lampIndex = idx;

        // فریم هالوژن توکار
        const frame = new THREE.Mesh(
            new THREE.CylinderGeometry(6.2, 7.2, 1.2, 32),
            new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.75, roughness: 0.28 })
        );
        frame.position.set(0, recessY, 0);
        frame.castShadow = false;
        frame.receiveShadow = true;
        lampGroup.add(frame);

        const housing = new THREE.Mesh(
            new THREE.CylinderGeometry(5.8, 5.8, Math.min(8, ceilT * 0.45), 24),
            new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4, roughness: 0.6 })
        );
        housing.position.set(0, recessY + Math.min(4, ceilT * 0.2), 0);
        lampGroup.add(housing);

        // طلق نورانی
        const bulb = new THREE.Mesh(
            new THREE.CylinderGeometry(5.2, 5.2, 0.45, 32),
            new THREE.MeshStandardMaterial({
                color: lightColor,
                emissive: lightColor,
                emissiveIntensity: startOn ? 1.0 : 0.0,
                roughness: 0.35,
                metalness: 0.05
            })
        );
        bulb.position.set(0, recessY - 0.55, 0);
        lampGroup.add(bulb);
        this.bulbMeshes.push(bulb);

        // SpotLight متعادل (بدون سوختن نزدیک چراغ)
        const spotLight = new THREE.SpotLight(lightColor, startOn ? intensity : 0);
        spotLight.position.set(0, recessY - 0.8, 0);
        spotLight.angle = angle;
        spotLight.penumbra = penumbra;
        spotLight.distance = range;
        spotLight.decay = decay;

        // سایه فقط برای یک چراغ مرکزی — یکنواختی + عملکرد
        const doShadow = shadowsEnabled && !!pos.shadow && !this._isMobile;
        spotLight.castShadow = doShadow;
        if (doShadow) {
            // سایه مرکزی سقف: زیر کابینت، روی کف، بین یونیت‌ها
            spotLight.shadow.bias = -0.0004;
            spotLight.shadow.normalBias = 0.04;
            // فقط یک Spot سقف سایه دارد — رزولوشن محدود
            const spotMap = (this._isMobile ? 256 : 512);
            spotLight.shadow.mapSize.width = spotMap;
            spotLight.shadow.mapSize.height = spotMap;
            spotLight.shadow.camera.near = 4;
            spotLight.shadow.camera.far = range + 80;
            spotLight.shadow.radius = 2.5;
        }

        const target = new THREE.Object3D();
        target.position.set(0, 0, 0);
        lampGroup.add(target);
        spotLight.target = target;

        if (typeof this.registerLightState === 'function') {
            this.registerLightState(spotLight, {
                intensity: intensity,
                color: lightColor,
                state: startOn
            });
        } else {
            spotLight.userData.baseIntensity = intensity;
            spotLight.userData.savedIntensity = intensity;
            spotLight.userData.savedColor = lightColor;
            spotLight.userData.savedState = startOn;
            spotLight.intensity = startOn ? intensity : 0;
        }
        lampGroup.add(spotLight);
        this.ceilingLights.push(spotLight);

        lampGroup.position.set(pos.x, 0, pos.z);
        this.lampMasterGroup.add(lampGroup);
    });

    this.scene.add(this.lampMasterGroup);
},



/**
 * Environment Map برای Reflection واقعی
 * High Gloss / Glass / Chrome / Stainless بدون envMap فقط «رنگ براق» دیده می‌شوند.
 * این تابع یک محیط نرم آشپزخانه (آسمان + زمین + دیواره‌های روشن) می‌سازد
 * و با PMREM روی scene.environment قرار می‌دهد.
 */
/**
 * مرحله 46 — Environment Lighting (PMREM)
 * برای High Gloss / Glass / Metal / Marble
 * شدت پایین نگه داشته می‌شود تا صحنه سفید/مه نشود.
 */
setupEnvironmentReflection: function() {
    if (!this.scene || !this.renderer) return;
    if (typeof THREE === 'undefined' || typeof THREE.PMREMGenerator !== 'function') return;

    // پاک‌سازی قبلی
    if (this._envRT) {
        try { this._envRT.dispose(); } catch (e) {}
        this._envRT = null;
        this._envMap = null;
    }

    try {
        const isMobile = !!this._isMobile;
        const size = isMobile ? 128 : 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // محیط استودیوی نرم آشپزخانه — نه سفید خالص
        const sky = ctx.createLinearGradient(0, 0, 0, size);
        sky.addColorStop(0.0, '#b8c4d4');   // آسمان نرم
        sky.addColorStop(0.42, '#9aa3ae');
        sky.addColorStop(0.52, '#7a756f');  // افق
        sky.addColorStop(1.0, '#3e3c3a');   // زمین تیره
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, size, size);

        // پنجره‌های نرم (هایلایت برای براق / شیشه / فلز)
        ctx.fillStyle = 'rgba(255, 248, 235, 0.45)';
        ctx.fillRect(size * 0.08, size * 0.12, size * 0.22, size * 0.28);
        ctx.fillRect(size * 0.70, size * 0.14, size * 0.22, size * 0.26);
        // سافت‌باکس سقف
        ctx.fillStyle = 'rgba(255, 252, 245, 0.35)';
        ctx.beginPath();
        ctx.ellipse(size * 0.5, size * 0.18, size * 0.28, size * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        const envTexture = new THREE.CanvasTexture(canvas);
        if (THREE.SRGBColorSpace != null) envTexture.colorSpace = THREE.SRGBColorSpace;
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        envTexture.needsUpdate = true;

        const pmrem = new THREE.PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        const rt = pmrem.fromEquirectangular(envTexture);
        this._envRT = rt;
        this._envMap = rt.texture;
        this.scene.environment = this._envMap;

        // شدت پایین: مات‌ها تقریباً بدون تغییر؛ براق/فلز/شیشه از envMapIntensity خودشان استفاده می‌کنند
        const intensity = isMobile ? 0.16 : 0.26;
        if (this.scene.environmentIntensity !== undefined) {
            this.scene.environmentIntensity = intensity;
        }
        this._envIntensity = intensity;

        envTexture.dispose();
        pmrem.dispose();

        if (typeof this.clampMatteEnvMapIntensity === 'function') {
            this.clampMatteEnvMapIntensity();
        }
    } catch (err) {
        console.warn('[Kitchen3D] setupEnvironmentReflection failed:', err);
        this.scene.environment = null;
    }
},

/** متریال‌های خیلی مات نباید envMap قوی بگیرند */
clampMatteEnvMapIntensity: function() {
    if (!this.scene) return;
    this.scene.traverse(function (obj) {
        if (!obj.isMesh || !obj.material) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(function (m) {
            if (!m || m.envMapIntensity == null) return;
            const rough = m.roughness != null ? m.roughness : 0.5;
            // مات: سقف envMapIntensity پایین
            if (rough >= 0.55 && m.envMapIntensity > 0.45) {
                m.envMapIntensity = 0.35;
                m.needsUpdate = true;
            }
        });
    });
},

/** شدت بازتاب کل صحنه (برای براق / فلز) */
setEnvironmentIntensity: function(value) {
    if (!this.scene) return;
    const v = Math.max(0, Math.min(1.5, Number(value) || 0));
    this._envIntensity = v;
    if (this.scene.environmentIntensity !== undefined) {
        this.scene.environmentIntensity = v;
    }
},

/**
 * مرحله 49 — Post Processing
 * Bloom خیلی کم + Color Grade ملایم + Sharpen + AA
 * بدون AO سنگین (موبایل) — صحنه سفید نمی‌شود
 */
setupPostProcessing: function() {
    if (!this.renderer || !this.scene || !this.camera) return;
    if (typeof THREE === 'undefined' || typeof THREE.EffectComposer !== 'function') {
        console.info('[Kitchen3D] PostProcessing addons not loaded — skip');
        this._postEnabled = false;
        return;
    }
    const cfg = this.config || {};
    if (cfg.postProcessing === false) {
        this._postEnabled = false;
        return;
    }

    // dispose previous
    if (this.composer) {
        try {
            this.composer.passes.forEach(function (p) {
                if (p.dispose) p.dispose();
            });
        } catch (e) {}
        this.composer = null;
    }

    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const pixelRatio = this.renderer.getPixelRatio();
    const w = Math.floor(size.x * pixelRatio);
    const h = Math.floor(size.y * pixelRatio);
    const isMobile = !!this._isMobile;

    const composer = new THREE.EffectComposer(this.renderer);
    composer.setPixelRatio(1); // size already includes PR via setSize below
    composer.setSize(size.x, size.y);

    // 1) Scene
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    composer.addPass(renderPass);

    // 2) Bloom خیلی کم — فقط هایلایت براق/کروم
    if (cfg.postBloom !== false && typeof THREE.UnrealBloomPass === 'function') {
        const strength = isMobile
            ? Math.min(0.08, cfg.postBloomStrength != null ? cfg.postBloomStrength : 0.08)
            : (cfg.postBloomStrength != null ? cfg.postBloomStrength : 0.12);
        const bloom = new THREE.UnrealBloomPass(
            new THREE.Vector2(w, h),
            strength,
            cfg.postBloomRadius != null ? cfg.postBloomRadius : 0.35,
            cfg.postBloomThreshold != null ? cfg.postBloomThreshold : 0.88
        );
        composer.addPass(bloom);
        this._bloomPass = bloom;
    }

    // 3) Color Grading ملایم (کنتراست/اشباع خیلی کم)
    if (cfg.postColorGrade !== false && typeof THREE.ShaderPass === 'function') {
        const gradeShader = {
            uniforms: {
                tDiffuse: { value: null },
                brightness: { value: 0.0 },
                contrast: { value: isMobile ? 0.04 : 0.06 },
                saturation: { value: isMobile ? 0.03 : 0.05 }
            },
            vertexShader: [
                'varying vec2 vUv;',
                'void main() {',
                '  vUv = uv;',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform sampler2D tDiffuse;',
                'uniform float brightness;',
                'uniform float contrast;',
                'uniform float saturation;',
                'varying vec2 vUv;',
                'void main() {',
                '  vec4 c = texture2D(tDiffuse, vUv);',
                '  c.rgb += brightness;',
                '  c.rgb = (c.rgb - 0.5) * (1.0 + contrast) + 0.5;',
                '  float g = dot(c.rgb, vec3(0.299, 0.587, 0.114));',
                '  c.rgb = mix(vec3(g), c.rgb, 1.0 + saturation);',
                '  gl_FragColor = c;',
                '}'
            ].join('\n')
        };
        const gradePass = new THREE.ShaderPass(gradeShader);
        composer.addPass(gradePass);
        this._gradePass = gradePass;
    }

    // 4) Sharpen خیلی کم
    if (cfg.postSharpen !== false && !isMobile && typeof THREE.ShaderPass === 'function') {
        const amt = cfg.postSharpenAmount != null ? cfg.postSharpenAmount : 0.12;
        const sharpenShader = {
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(w, h) },
                amount: { value: amt }
            },
            vertexShader: [
                'varying vec2 vUv;',
                'void main() {',
                '  vUv = uv;',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform sampler2D tDiffuse;',
                'uniform vec2 resolution;',
                'uniform float amount;',
                'varying vec2 vUv;',
                'void main() {',
                '  vec2 px = 1.0 / resolution;',
                '  vec4 c = texture2D(tDiffuse, vUv);',
                '  vec4 n = texture2D(tDiffuse, vUv + vec2(0.0, px.y));',
                '  vec4 s = texture2D(tDiffuse, vUv - vec2(0.0, px.y));',
                '  vec4 e = texture2D(tDiffuse, vUv + vec2(px.x, 0.0));',
                '  vec4 w = texture2D(tDiffuse, vUv - vec2(px.x, 0.0));',
                '  vec4 sharp = c * (1.0 + 4.0 * amount) - (n + s + e + w) * amount;',
                '  gl_FragColor = clamp(sharp, 0.0, 1.0);',
                '}'
            ].join('\n')
        };
        const sharpenPass = new THREE.ShaderPass(sharpenShader);
        composer.addPass(sharpenPass);
        this._sharpenPass = sharpenPass;
    }

    // 5) Anti-Aliasing
    if (cfg.postAA !== false) {
        if (typeof THREE.SMAAPass === 'function' && !isMobile) {
            const smaa = new THREE.SMAAPass(w, h);
            composer.addPass(smaa);
            this._smaaPass = smaa;
        } else if (typeof THREE.ShaderPass === 'function' && THREE.FXAAShader) {
            const fxaa = new THREE.ShaderPass(THREE.FXAAShader);
            fxaa.material.uniforms['resolution'].value.set(1 / w, 1 / h);
            composer.addPass(fxaa);
            this._fxaaPass = fxaa;
        }
    }

    // 6) OutputPass — color space صحیح r186
    if (typeof THREE.OutputPass === 'function') {
        composer.addPass(new THREE.OutputPass());
    }

    this.composer = composer;
    this._postEnabled = true;
    console.info('[Kitchen3D] PostProcessing enabled (Bloom/Grade/Sharpen/AA)');
},

setPostProcessingEnabled: function(on) {
    this._postEnabled = !!on && !!this.composer;
},

resizePostProcessing: function() {
    if (!this.composer || !this.renderer) return;
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    this.composer.setSize(size.x, size.y);
    const pr = this.renderer.getPixelRatio();
    const w = Math.floor(size.x * pr);
    const h = Math.floor(size.y * pr);
    if (this._sharpenPass && this._sharpenPass.uniforms && this._sharpenPass.uniforms.resolution) {
        this._sharpenPass.uniforms.resolution.value.set(w, h);
    }
    if (this._fxaaPass && this._fxaaPass.material && this._fxaaPass.material.uniforms.resolution) {
        this._fxaaPass.material.uniforms.resolution.value.set(1 / w, 1 / h);
    }
    if (this._smaaPass && this._smaaPass.setSize) {
        this._smaaPass.setSize(w, h);
    }
    if (this._bloomPass && this._bloomPass.resolution) {
        this._bloomPass.resolution.set(w, h);
    }
},


createEnvironment: function(centerX, centerZ) {
    const h = room.h || this.config.wallHeight || 280; 

    // 🌟 ۱. تابع کمکی ارتقا یافته برای کشیدن رگه‌های سنگ با قابلیت تنظیم ضخامت (کد اصلی شما)
    const drawMarbleVeins = (ctx, x, y, w, h, color, veinCount, thickness = 1) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip(); 
        
        ctx.strokeStyle = color;
        for (let i = 0; i < veinCount; i++) {
            ctx.lineWidth = thickness + (Math.random() * thickness * 1.5);
            ctx.beginPath();
            
            let startX = x + Math.random() * w;
            let startY = y + (Math.random() > 0.5 ? 0 : h); 
            ctx.moveTo(startX, startY);
            
            ctx.bezierCurveTo(
                x + Math.random() * w, y + Math.random() * h,
                x + Math.random() * w, y + Math.random() * h,
                x + (Math.random() > 0.5 ? 0 : w), y + Math.random() * h
            );
            ctx.stroke();
        }
        ctx.restore();
    };

    // این تابع جا افتاده بود، آن را اینجا اضافه کنید 👇
    const createFloorEdgeMaterial = (lengthCm) => {
        const c = this.config || {};
        const tileCol = c.floorTileColor1 || '#DCD3C6';
        const grout = c.floorGroutColor || '#9a8f82';
        const roughCfg = (c.floorRoughness !== undefined) ? parseFloat(c.floorRoughness) : 0.38;
        const bumpCfg = (c.floorBumpScale !== undefined) ? parseFloat(c.floorBumpScale) : 0.55;

        const canvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 256;
        bumpCanvas.width = 1024; bumpCanvas.height = 256;

        const ctx = canvas.getContext('2d');
        const bumpCtx = bumpCanvas.getContext('2d');
        const gap = 6;

        ctx.fillStyle = grout; ctx.fillRect(0, 0, canvas.width, canvas.height);
        bumpCtx.fillStyle = '#1a1a1a'; bumpCtx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = tileCol;
        ctx.fillRect(gap, gap, canvas.width - gap * 2, canvas.height - gap * 2);
        // لبه bevel بصری
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 3;
        ctx.strokeRect(gap + 2, gap + 2, canvas.width - gap * 2 - 4, canvas.height - gap * 2 - 4);

        if (typeof drawMarbleVeins === 'function') {
            drawMarbleVeins(ctx, gap, gap, canvas.width - gap * 2, canvas.height - gap * 2, 'rgba(255, 255, 255, 0.5)', 4, 1.5);
            drawMarbleVeins(ctx, gap, gap, canvas.width - gap * 2, canvas.height - gap * 2, 'rgba(168, 153, 138, 0.35)', 4, 1);
        }

        bumpCtx.fillStyle = '#f0f0f0';
        bumpCtx.fillRect(gap, gap, canvas.width - gap * 2, canvas.height - gap * 2);
        bumpCtx.strokeStyle = '#888888';
        bumpCtx.lineWidth = gap;
        bumpCtx.strokeRect(gap, gap, canvas.width - gap * 2, canvas.height - gap * 2);

        const mapTex = new THREE.CanvasTexture(canvas);
        mapTex.wrapS = THREE.RepeatWrapping; mapTex.wrapT = THREE.RepeatWrapping;
        mapTex.repeat.set(Math.max(0.5, lengthCm / 80), 1);
        mapTex.colorSpace = THREE.SRGBColorSpace;

        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        if (typeof window.applyKitchenTextureColorSpace === 'function') window.applyKitchenTextureColorSpace(bumpTex, 'data');
        else if (typeof THREE !== 'undefined' && THREE.NoColorSpace != null) bumpTex.colorSpace = THREE.NoColorSpace;
        bumpTex.wrapS = THREE.RepeatWrapping; bumpTex.wrapT = THREE.RepeatWrapping;
        bumpTex.repeat.set(Math.max(0.5, lengthCm / 80), 1);

        if (this.renderer && this.renderer.capabilities) {
const maxA = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
            mapTex.anisotropy = maxA; bumpTex.anisotropy = maxA;
        }

        return new THREE.MeshStandardMaterial({
            map: mapTex, bumpMap: bumpTex, bumpScale: Math.min(0.9, bumpCfg + 0.15),
            roughness: Math.max(0.25, roughCfg), metalness: 0.03,
            envMapIntensity: (c.floorEnvIntensity !== undefined) ? parseFloat(c.floorEnvIntensity) : 0.35
        });
    };
    // 👆 پایان تابع جا افتاده 👆

    // 🌟 ۲. کف سرامیک واقعی: اسکیل cm + گروت عمیق + variation + roughness/reflection کنترل‌شده
    const createFloorCeramicMaterial = (roomW, roomD) => {
    const c = this.config || {};
    const tile1 = c.floorTileColor1 || '#DCD3C6';
    const tile2 = c.floorTileColor2 || '#CFC4B5';
    const grout = c.floorGroutColor || '#9a8f82';
    const tileSize = Math.max(30, parseFloat(c.floorTileSizeCm) || 60);
    const roughCfg = (c.floorRoughness !== undefined) ? parseFloat(c.floorRoughness) : 0.38;
    const bumpCfg = (c.floorBumpScale !== undefined) ? parseFloat(c.floorBumpScale) : 0.55;
    const envI = (c.floorEnvIntensity !== undefined) ? parseFloat(c.floorEnvIntensity) : 0.4;

    const shadeHex = (hex, amount) => {
        try {
            const h = String(hex).replace('#', '');
            const n = parseInt(h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h, 16);
            let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
            r = Math.max(0, Math.min(255, Math.round(r + amount)));
            g = Math.max(0, Math.min(255, Math.round(g + amount)));
            b = Math.max(0, Math.min(255, Math.round(b + amount)));
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        } catch (e) { return hex; }
    };

    // واحد بافت = ۲×۲ کاشی تا تکرار کم‌تر و طبیعی‌تر باشد
    const tilesPerSide = 2;
    const texSizeCm = tileSize * tilesPerSide;
    const canvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 2048;
    bumpCanvas.width = 2048; bumpCanvas.height = 2048;

    const ctx = canvas.getContext('2d');
    const bumpCtx = bumpCanvas.getContext('2d');
    const pxPerCm = canvas.width / texSizeCm;

    // گروت پایه (عمق‌دار در bump)
    ctx.fillStyle = grout;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    bumpCtx.fillStyle = '#141414';
    bumpCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    // عرض گروت واقعی ~۲–۳ میلی‌متر در مقیاس پیکسل
    const gapCm = 0.28;
    const gapPx = Math.max(2.5, gapCm * pxPerCm);

    for (let y = 0; y < texSizeCm - 0.01; y += tileSize) {
        for (let x = 0; x < texSizeCm - 0.01; x += tileSize) {
            const col = Math.round(x / tileSize);
            const row = Math.round(y / tileSize);
            const drawX = x * pxPerCm;
            const drawY = y * pxPerCm;
            const drawW = tileSize * pxPerCm;
            const drawH = tileSize * pxPerCm;

            const ix = drawX + gapPx;
            const iy = drawY + gapPx;
            const iw = Math.max(1, drawW - gapPx * 2);
            const ih = Math.max(1, drawH - gapPx * 2);

            // Variation: نه فقط checkerboard ساده
            const base = ((col + row) % 2 === 0) ? tile1 : tile2;
            const variation = ((col * 19 + row * 37) % 11) - 5; // -5..+5
            const tileColor = shadeHex(base, variation);
            ctx.fillStyle = tileColor;
            ctx.fillRect(ix, iy, iw, ih);

            // نویز خیلی ملایم روی سطح کاشی (جلوگیری از سطح پلاستیکی)
            const noiseCount = 80;
            for (let n = 0; n < noiseCount; n++) {
                const nx = ix + Math.random() * iw;
                const ny = iy + Math.random() * ih;
                const a = 0.015 + Math.random() * 0.03;
                ctx.fillStyle = (Math.random() > 0.5)
                    ? `rgba(255,255,255,${a})`
                    : `rgba(0,0,0,${a})`;
                ctx.fillRect(nx, ny, 1.2 + Math.random() * 2, 1.2 + Math.random() * 2);
            }

            // bevel لبه کاشی
            const edge = Math.max(1.5, Math.min(5, gapPx * 0.9));
            ctx.strokeStyle = shadeHex(tileColor, -20);
            ctx.lineWidth = edge;
            ctx.strokeRect(ix + edge * 0.5, iy + edge * 0.5, iw - edge, ih - edge);
            ctx.strokeStyle = shadeHex(tileColor, 18);
            ctx.beginPath();
            ctx.moveTo(ix + 1, iy + ih - 1);
            ctx.lineTo(ix + 1, iy + 1);
            ctx.lineTo(ix + iw - 1, iy + 1);
            ctx.stroke();

            // رگه‌های ظریف سنگ/سرامیک
            if (typeof drawMarbleVeins === 'function') {
                drawMarbleVeins(ctx, ix, iy, iw, ih, 'rgba(255,255,255,0.35)', 5, 1.5);
                drawMarbleVeins(ctx, ix, iy, iw, ih, 'rgba(120,100,80,0.25)', 4, 1);
            }

            // bump: سطح روشن + لبه نیمه‌تیره (bevel) — گروت از قبل تیره است
            bumpCtx.fillStyle = '#f4f4f4';
            bumpCtx.fillRect(ix, iy, iw, ih);
            // سایه داخلی لبه برای عمق گروت
            bumpCtx.strokeStyle = '#6a6a6a';
            bumpCtx.lineWidth = edge * 1.4;
            bumpCtx.strokeRect(ix + edge * 0.4, iy + edge * 0.4, iw - edge * 0.8, ih - edge * 0.8);
            // کمی نویز bump
            for (let n = 0; n < 30; n++) {
                const nx = ix + Math.random() * iw;
                const ny = iy + Math.random() * ih;
                const v = 200 + Math.floor(Math.random() * 40);
                bumpCtx.fillStyle = `rgb(${v},${v},${v})`;
                bumpCtx.fillRect(nx, ny, 2, 2);
            }
        }
    }

    const mapTex = new THREE.CanvasTexture(canvas);
    mapTex.wrapS = THREE.RepeatWrapping;
    mapTex.wrapT = THREE.RepeatWrapping;
    // اسکیل واقعی: هر texSizeCm یک تکرار → کاشی‌ها دقیقاً tileSize سانتی‌متر
    mapTex.repeat.set(Math.max(0.2, roomW / texSizeCm), Math.max(0.2, roomD / texSizeCm));
    mapTex.colorSpace = THREE.SRGBColorSpace;

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        if (typeof window.applyKitchenTextureColorSpace === 'function') window.applyKitchenTextureColorSpace(bumpTex, 'data');
        else if (typeof THREE !== 'undefined' && THREE.NoColorSpace != null) bumpTex.colorSpace = THREE.NoColorSpace;
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(Math.max(0.2, roomW / texSizeCm), Math.max(0.2, roomD / texSizeCm));

    if (this.renderer && this.renderer.capabilities) {
const maxA = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        mapTex.anisotropy = maxA;
        bumpTex.anisotropy = maxA;
    }
    mapTex.needsUpdate = true;
    bumpTex.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
        map: mapTex,
        bumpMap: bumpTex,
        bumpScale: bumpCfg,
        roughness: roughCfg,
        metalness: 0.03,
        envMapIntensity: envI
    });
};

    // 🌟 ۳. ساخت سرامیک دیواری (کد اصلی شما)
const createWallCeramicMaterial = (wallHeight, wallWidth) => {
    const style = (this.config && this.config.wallStyle) || 'ceramic';
    const c = this.config || {};
    const roughCfg = (c.wallRoughness !== undefined && c.wallRoughness !== null)
        ? parseFloat(c.wallRoughness) : 0.42;
    const bumpCfg = (c.wallBumpScale !== undefined && c.wallBumpScale !== null)
        ? parseFloat(c.wallBumpScale) : 0.35;
    const groutColor = c.wallGroutColor || '#c8c2b8';

    // رنگ‌آمیزی جزئی کاشی برای حس واقعی‌تر (نه سطح یکدست)
    const shadeHex = (hex, amount) => {
        try {
            const h = String(hex).replace('#', '');
            const n = parseInt(h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h, 16);
            let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
            r = Math.max(0, Math.min(255, Math.round(r + amount)));
            g = Math.max(0, Math.min(255, Math.round(g + amount)));
            b = Math.max(0, Math.min(255, Math.round(b + amount)));
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        } catch (e) { return hex; }
    };

    // دیوار سفید گچی — کمی زبری و bump ملایم (نه صفحه صاف)
    if (style === 'white') {
        const canvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 512;
        bumpCanvas.width = 512; bumpCanvas.height = 512;
        const ctx = canvas.getContext('2d');
        const bctx = bumpCanvas.getContext('2d');
        ctx.fillStyle = '#f5f5f5'; ctx.fillRect(0, 0, 512, 512);
        bctx.fillStyle = '#e8e8e8'; bctx.fillRect(0, 0, 512, 512);
        // نویز خیلی ملایم گچ
        for (let i = 0; i < 4000; i++) {
            const x = Math.random() * 512, y = Math.random() * 512;
            const a = 0.03 + Math.random() * 0.04;
            ctx.fillStyle = `rgba(0,0,0,${a})`;
            ctx.fillRect(x, y, 1.5, 1.5);
            bctx.fillStyle = `rgba(${180 + Math.random() * 50},${180 + Math.random() * 50},${180 + Math.random() * 50},0.5)`;
            bctx.fillRect(x, y, 2, 2);
        }
        const mapTex = new THREE.CanvasTexture(canvas);
        if (typeof window.applyKitchenTextureColorSpace === 'function') window.applyKitchenTextureColorSpace(mapTex, 'color');
        else if (typeof THREE !== 'undefined' && THREE.SRGBColorSpace != null) mapTex.colorSpace = THREE.SRGBColorSpace;
        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        if (typeof window.applyKitchenTextureColorSpace === 'function') window.applyKitchenTextureColorSpace(bumpTex, 'data');
        else if (typeof THREE !== 'undefined' && THREE.NoColorSpace != null) bumpTex.colorSpace = THREE.NoColorSpace;
        [mapTex, bumpTex].forEach(tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(Math.max(1, wallWidth / 120), Math.max(1, wallHeight / 120));
        });
        mapTex.colorSpace = THREE.SRGBColorSpace;
        if (this.renderer && this.renderer.capabilities) {
const maxA = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
            mapTex.anisotropy = maxA; bumpTex.anisotropy = maxA;
        }
        return new THREE.MeshStandardMaterial({
            map: mapTex,
            bumpMap: bumpTex,
            bumpScale: 0.08,
            roughness: Math.max(0.55, roughCfg),
            metalness: 0.0,
            envMapIntensity: 0.25
        });
    }

    // --- سرامیک واقعی: گروت + کاشی + اسکیل cm + bump/normal ---
    const lower1 = c.wallBandLowerColor1 || '#fdfbf7';
    const lower2 = c.wallBandLowerColor2 || '#f4f1ea';
    const mid1   = c.wallBandMidColor1   || '#161616';
    const mid2   = c.wallBandMidColor2   || '#1d1d1d';
    const upper1 = c.wallBandUpperColor1 || '#fdfbf7';
    const upper2 = c.wallBandUpperColor2 || '#f4f1ea';

    const canvas = document.createElement('canvas');
    const bumpCanvas = document.createElement('canvas');
    // واحد بافت: ۲۴۰cm افقی — تکرار روی طول دیوار با UV/repeat
    const texWCm = 240;
    const texHCm = Math.max(120, wallHeight || 280);

    canvas.width = 2048; canvas.height = 2048;
    bumpCanvas.width = 2048; bumpCanvas.height = 2048;

    const ctx = canvas.getContext('2d');
    const bumpCtx = bumpCanvas.getContext('2d');

    // پایه = رنگ گروت (بند بین کاشی‌ها)
    ctx.fillStyle = groutColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // bump پایه تیره = فرورفتگی گروت
    bumpCtx.fillStyle = '#1a1a1a';
    bumpCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

    const pxPerCmX = canvas.width / texWCm;
    const pxPerCmY = canvas.height / texHCm;

    const drawTiles = (startCm, endCm, tileW, tileH, color1, color2, gapCm, veinColor, veinCount, thickness = 1) => {
        const gap = Math.max(1.5, gapCm * pxPerCmX * 0.35); // gap پیکسلی متناسب
        const gapY = Math.max(1.5, gapCm * pxPerCmY * 0.35);
        for (let y = startCm; y < endCm - 0.01; y += tileH) {
            let currentTileH = Math.min(tileH, endCm - y);
            for (let x = 0; x < texWCm; x += tileW) {
                const drawX = x * pxPerCmX;
                const topYCm = y + currentTileH;
                const drawY = canvas.height - (topYCm * pxPerCmY);
                const drawW = tileW * pxPerCmX;
                const drawH = currentTileH * pxPerCmY;

                const col = Math.floor(x / tileW);
                const row = Math.floor(y / tileH);
                const isEven = (col + row) % 2 === 0;
                // تغییر جزئی رنگ هر کاشی
                const base = isEven ? color1 : color2;
                const variation = ((col * 17 + row * 31) % 7) - 3;
                ctx.fillStyle = shadeHex(base, variation);

                const ix = drawX + gap;
                const iy = drawY + gapY;
                const iw = Math.max(1, drawW - gap * 2);
                const ih = Math.max(1, drawH - gapY * 2);
                ctx.fillRect(ix, iy, iw, ih);

                // لبه نرم کاشی (bevel بصری روی رنگ)
                const edge = Math.max(1, Math.min(4, gap * 0.6));
                ctx.strokeStyle = shadeHex(base, -18);
                ctx.lineWidth = edge;
                ctx.strokeRect(ix + edge * 0.5, iy + edge * 0.5, iw - edge, ih - edge);

                // هایلایت لبه بالا/چپ
                ctx.strokeStyle = shadeHex(base, 22);
                ctx.beginPath();
                ctx.moveTo(ix + 1, iy + ih - 1);
                ctx.lineTo(ix + 1, iy + 1);
                ctx.lineTo(ix + iw - 1, iy + 1);
                ctx.stroke();

                if (veinColor && veinCount > 0) {
                    drawMarbleVeins(ctx, ix, iy, iw, ih, veinColor, veinCount, thickness);
                    if (thickness > 2) {
                        drawMarbleVeins(ctx, ix, iy, iw, ih, 'rgba(255, 255, 255, 0.95)', Math.ceil(veinCount / 1.5), thickness / 3);
                    }
                }

                // bump: سطح کاشی روشن + لبه نیمه‌روشن (bevel) + گروت تیره
                bumpCtx.fillStyle = '#f2f2f2';
                bumpCtx.fillRect(ix, iy, iw, ih);
                // لبه bevel روی bump
                bumpCtx.strokeStyle = '#b0b0b0';
                bumpCtx.lineWidth = edge * 1.2;
                bumpCtx.strokeRect(ix + edge * 0.5, iy + edge * 0.5, iw - edge, ih - edge);
            }
        }
    };

    // باند پایین (۰ تا ۹۰) — کاشی ۶۰×۳۰
    drawTiles(0, 90, 60, 30, lower1, lower2, 2.2, null, 0);
    // باند وسط (۹۰ تا ۱۵۰) — کاشی بزرگ‌تر با رگه‌های ظریف
    drawTiles(90, 150, 80, 60, mid1, mid2, 3, 'rgba(255, 255, 255, 0.35)', 5, 4);
    // باند بالا تا سقف
    drawTiles(150, texHCm, 60, 30, upper1, upper2, 2.2, null, 0);

    const mapTex = new THREE.CanvasTexture(canvas);
    mapTex.wrapS = THREE.RepeatWrapping;
    mapTex.wrapT = THREE.ClampToEdgeWrapping; // عمودی یک‌بار روی ارتفاع دیوار
    // اسکیل افقی واقعی: هر ۲۴۰cm یک تکرار
    mapTex.repeat.set(Math.max(0.25, wallWidth / texWCm), 1);
    mapTex.colorSpace = THREE.SRGBColorSpace;

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        if (typeof window.applyKitchenTextureColorSpace === 'function') window.applyKitchenTextureColorSpace(bumpTex, 'data');
        else if (typeof THREE !== 'undefined' && THREE.NoColorSpace != null) bumpTex.colorSpace = THREE.NoColorSpace;
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.ClampToEdgeWrapping;
    bumpTex.repeat.set(Math.max(0.25, wallWidth / texWCm), 1);

    if (this.renderer && this.renderer.capabilities) {
const maxA = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        mapTex.anisotropy = maxA;
        bumpTex.anisotropy = maxA;
    }
    mapTex.needsUpdate = true;
    bumpTex.needsUpdate = true;

    return new THREE.MeshStandardMaterial({
        map: mapTex,
        bumpMap: bumpTex,
        bumpScale: bumpCfg,
        roughness: roughCfg,
        metalness: 0.02,
        envMapIntensity: 0.45
    });
};
    
    // --- رسم دیوارهای اصلی آشپزخانه (کد اصلی شما بدون تغییر) ---
    const t = this.config.wallThickness || 20; 
    const windowsList = window.roomWindows || [];
    const doorsList = window.roomDoors || []; 

    const buildWallWithElements = (wallType, width, extrudeDepth, posX, posZ, rotY, interiorOffsetLeft) => {
        const shape = new THREE.Shape();
                // اضافه کردن 20 سانت به پایین و 20 سانت به بالای دیوار
        const wallBottom = -20; 
        const wallTop = h + 20; 
        
        shape.moveTo(0, wallBottom); 
        shape.lineTo(width, wallBottom); 
        shape.lineTo(width, wallTop); 
        shape.lineTo(0, wallTop); 
        shape.lineTo(0, wallBottom);


        const wallMat = createWallCeramicMaterial(h, width);
        const elementsGroup = new THREE.Group();

       windowsList.filter(w => w.wall === wallType).forEach(win => {
            const hole = new THREE.Path();
            const winX = interiorOffsetLeft + win.offset;
            const winY = win.elevation !== undefined ? win.elevation : 90;
            const winW = win.w;
            const winH = win.h;
            hole.moveTo(winX, winY);
            hole.lineTo(winX, winY + winH);
            hole.lineTo(winX + winW, winY + winH);
            hole.lineTo(winX + winW, winY);
            hole.lineTo(winX, winY);
            shape.holes.push(hole);

            const zMid = extrudeDepth / 2;
            const frameW = 5.5;                 // عرض قاب دیده شده
            const frameDepth = extrudeDepth + 6; // عمق قاب (از داخل تا بیرون دیوار)
            const glassT = 0.8;                 // ضخامت شیشه
            const innerClear = 1.2;             // فاصله شیشه از لبه داخلی قاب

            // --- متریال قاب با عمق و سایه ---
            const frameMat = new THREE.MeshStandardMaterial({
                color: 0xf2f2f2,
                roughness: 0.45,
                metalness: 0.08,
                envMapIntensity: 0.35
            });
            const frameInnerMat = new THREE.MeshStandardMaterial({
                color: 0xd8d8d8,
                roughness: 0.55,
                metalness: 0.05,
                envMapIntensity: 0.2
            });

            const addFramePart = (geo, x, y, z, mat) => {
                const m = new THREE.Mesh(geo, mat || frameMat);
                m.position.set(x, y, z);
                m.castShadow = true;
                m.receiveShadow = true;
                elementsGroup.add(m);
                return m;
            };

            // قاب بیرونی (ضخامت کامل دیوار + بیرون‌زدگی)
            addFramePart(new THREE.BoxGeometry(winW, frameW, frameDepth),
                winX + winW / 2, winY + winH - frameW / 2, zMid);
            addFramePart(new THREE.BoxGeometry(winW, frameW, frameDepth),
                winX + winW / 2, winY + frameW / 2, zMid);
            addFramePart(new THREE.BoxGeometry(frameW, winH, frameDepth),
                winX + frameW / 2, winY + winH / 2, zMid);
            addFramePart(new THREE.BoxGeometry(frameW, winH, frameDepth),
                winX + winW - frameW / 2, winY + winH / 2, zMid);

            // لبه داخلی قاب (سایه داخل قاب) — کمی جلوتر و تیره‌تر
            const innerZ = zMid + extrudeDepth * 0.15;
            const innerInset = frameW * 0.55;
            addFramePart(new THREE.BoxGeometry(winW - frameW, 1.6, 1.2),
                winX + winW / 2, winY + winH - innerInset, innerZ, frameInnerMat);
            addFramePart(new THREE.BoxGeometry(winW - frameW, 1.6, 1.2),
                winX + winW / 2, winY + innerInset, innerZ, frameInnerMat);
            addFramePart(new THREE.BoxGeometry(1.6, winH - frameW, 1.2),
                winX + innerInset, winY + winH / 2, innerZ, frameInnerMat);
            addFramePart(new THREE.BoxGeometry(1.6, winH - frameW, 1.2),
                winX + winW - innerInset, winY + winH / 2, innerZ, frameInnerMat);

            // --- مولیون با عمق ---
            const mullionW = 3.2;
            const mullionD = frameDepth - 2;
            const mullionV = new THREE.Mesh(
                new THREE.BoxGeometry(mullionW, winH - frameW * 2, mullionD),
                frameMat
            );
            mullionV.position.set(winX + winW / 2, winY + winH / 2, zMid);
            mullionV.castShadow = true;
            mullionV.receiveShadow = true;
            elementsGroup.add(mullionV);

            let hasCross = winH > 90;
            if (hasCross) {
                const mullionH = new THREE.Mesh(
                    new THREE.BoxGeometry(winW - frameW * 2, mullionW, mullionD),
                    frameMat
                );
                mullionH.position.set(winX + winW / 2, winY + winH / 2, zMid);
                mullionH.castShadow = true;
                mullionH.receiveShadow = true;
                elementsGroup.add(mullionH);
            }

            // --- شیشه بهتر: Reflection + Transmission ---
            const glassMatParams = {
                color: 0xcfe8ff,
                transparent: true,
                opacity: 0.22,
                roughness: 0.05,
                metalness: 0.0,
                transmission: 0.92,
                thickness: 1.2,
                ior: 1.45,
                envMapIntensity: 1.35,
                clearcoat: 1.0,
                clearcoatRoughness: 0.04,
                side: THREE.DoubleSide
            };
            // دو لنگه شیشه (چپ/راست مولیون)
            const paneW = (winW - frameW * 2 - mullionW) / 2 - innerClear;
            const paneH = hasCross
                ? (winH - frameW * 2 - mullionW) / 2 - innerClear
                : (winH - frameW * 2) - innerClear * 2;
            const glassMat = (typeof THREE.MeshPhysicalMaterial === 'function')
                ? new THREE.MeshPhysicalMaterial(glassMatParams)
                : new THREE.MeshStandardMaterial({
                    color: 0xaaccff, transparent: true, opacity: 0.35,
                    roughness: 0.08, metalness: 0.05, envMapIntensity: 1.0
                });

            const paneZs = zMid; // وسط عمق دیوار
            const leftX = winX + frameW + innerClear + paneW / 2;
            const rightX = winX + winW - frameW - innerClear - paneW / 2;

            if (hasCross) {
                const topY = winY + winH - frameW - innerClear - paneH / 2;
                const botY = winY + frameW + innerClear + paneH / 2;
                [[leftX, topY], [rightX, topY], [leftX, botY], [rightX, botY]].forEach(([px, py]) => {
                    const g = new THREE.Mesh(new THREE.BoxGeometry(paneW, paneH, glassT), glassMat.clone ? glassMat.clone() : glassMat);
                    g.position.set(px, py, paneZs);
                    g.castShadow = false;
                    g.receiveShadow = true;
                    elementsGroup.add(g);
                });
            } else {
                [[leftX, winY + winH / 2], [rightX, winY + winH / 2]].forEach(([px, py]) => {
                    const g = new THREE.Mesh(new THREE.BoxGeometry(paneW, paneH, glassT), glassMat.clone ? glassMat.clone() : glassMat);
                    g.position.set(px, py, paneZs);
                    g.receiveShadow = true;
                    elementsGroup.add(g);
                });
            }

            // --- آستانه با پیش‌آمدگی واقعی ---
            const sillMat = new THREE.MeshStandardMaterial({
                color: 0xe6e2dc,
                roughness: 0.55,
                metalness: 0.04,
                envMapIntensity: 0.25
            });
            const sillDepth = frameDepth + 10;
            const sill = new THREE.Mesh(
                new THREE.BoxGeometry(winW + 10, 3.2, sillDepth),
                sillMat
            );
            sill.position.set(winX + winW / 2, winY - 1.2, zMid + 2);
            sill.castShadow = true;
            sill.receiveShadow = true;
            elementsGroup.add(sill);
            // لبه آستانه (nose)
            const sillNose = new THREE.Mesh(
                new THREE.BoxGeometry(winW + 12, 1.4, 2.2),
                sillMat
            );
            sillNose.position.set(winX + winW / 2, winY - 2.2, zMid + sillDepth / 2 - 1);
            sillNose.castShadow = true;
            elementsGroup.add(sillNose);

            // --- نور طبیعی پنجره (Window / Natural) ---
            try {
                const cfgW = (typeof Kitchen3D !== 'undefined' && Kitchen3D.config) ? Kitchen3D.config : {};
                const dayIntensity = cfgW.windowLightIntensity != null ? parseFloat(cfgW.windowLightIntensity) : 1400;
                const winColor = cfgW.windowLightColor != null ? cfgW.windowLightColor : 0xfff4e8;
                const winLight = new THREE.SpotLight(winColor, dayIntensity, 480, Math.PI / 3.0, 0.88, 1.7);
                winLight.position.set(winX + winW / 2, winY + winH * 0.55, zMid - extrudeDepth * 0.8 - 8);
                const winTarget = new THREE.Object3D();
                winTarget.position.set(winX + winW / 2, winY + winH * 0.3, zMid + 90);
                elementsGroup.add(winTarget);
                winLight.target = winTarget;
                // سایه پنجره فقط دسکتاپ (عملکرد موبایل)
                const isMob = !!(typeof Kitchen3D !== 'undefined' && Kitchen3D._isMobile);
                winLight.castShadow = !isMob;
                if (!isMob) {
                    winLight.shadow.mapSize.width = 512;
                    winLight.shadow.mapSize.height = 512;
                    winLight.shadow.bias = -0.0008;
                    winLight.shadow.radius = 3;
                }
                winLight.userData.isNaturalLight = true;
                winLight.userData.isWindowLight = true;
                elementsGroup.add(winLight);
                if (!Kitchen3D.naturalLights) Kitchen3D.naturalLights = [];
                Kitchen3D.naturalLights.push(winLight);
            } catch (e) { /* ignore */ }
        });

        doorsList.filter(d => d.wall === wallType).forEach(door => {
            const hole = new THREE.Path();
            const doorX = interiorOffsetLeft + door.offset;
            const doorY = 0;
            const doorW = door.w;
            const doorH = door.h;
            hole.moveTo(doorX, doorY);
            hole.lineTo(doorX, doorY + doorH);
            hole.lineTo(doorX + doorW, doorY + doorH);
            hole.lineTo(doorX + doorW, doorY);
            hole.lineTo(doorX, doorY);
            shape.holes.push(hole);

            const zMid = extrudeDepth / 2;
            const frameW = 5;
            const frameDepth = extrudeDepth + 5;
            const leafT = 4.2;

            const frameMat = new THREE.MeshStandardMaterial({
                color: 0xe8e8e8,
                roughness: 0.48,
                metalness: 0.06,
                envMapIntensity: 0.3
            });
            const addDoorFrame = (geo, x, y, z) => {
                const m = new THREE.Mesh(geo, frameMat);
                m.position.set(x, y, z);
                m.castShadow = true;
                m.receiveShadow = true;
                elementsGroup.add(m);
            };
            // قاب در با عمق
            addDoorFrame(new THREE.BoxGeometry(doorW, frameW, frameDepth),
                doorX + doorW / 2, doorY + doorH - frameW / 2, zMid);
            addDoorFrame(new THREE.BoxGeometry(frameW, doorH, frameDepth),
                doorX + frameW / 2, doorY + doorH / 2, zMid);
            addDoorFrame(new THREE.BoxGeometry(frameW, doorH, frameDepth),
                doorX + doorW - frameW / 2, doorY + doorH / 2, zMid);
            // آستانه در
            addDoorFrame(new THREE.BoxGeometry(doorW, 2.5, frameDepth + 2),
                doorX + doorW / 2, doorY + 1.25, zMid);

            // لنگه در
            const doorMat = new THREE.MeshStandardMaterial({
                color: 0x5C4033,
                roughness: 0.58,
                metalness: 0.02,
                envMapIntensity: 0.25
            });
            // لنگه در — شکل یکسان روی هر دو سمت (داخل و بیرون)
            const leafZ = zMid;
            const doorMesh = new THREE.Mesh(
                new THREE.BoxGeometry(doorW - frameW * 1.2, doorH - frameW - 2, leafT),
                doorMat
            );
            doorMesh.position.set(doorX + doorW / 2, doorY + (doorH - frameW) / 2 + 1, leafZ);
            doorMesh.castShadow = true;
            doorMesh.receiveShadow = true;
            elementsGroup.add(doorMesh);

            const panelMat = new THREE.MeshStandardMaterial({
                color: 0x6b4a35,
                roughness: 0.62,
                metalness: 0.02
            });
            const panelFrameMat = new THREE.MeshStandardMaterial({ color: 0x4a3224, roughness: 0.7 });
            const panelInset = 7;
            const panelW = doorW - frameW * 1.2 - panelInset * 2;
            const gapBetween = 6;
            const usableH = doorH - frameW - 2;
            const topPanelH = usableH * 0.32;
            const bottomPanelH = usableH - topPanelH - gapBetween - panelInset * 2;
            const topPanelY = doorY + doorH - frameW - panelInset - topPanelH / 2;
            const bottomPanelY = doorY + 2 + panelInset + bottomPanelH / 2;
            const doorCX = doorX + doorW / 2;

            // تکرار نما روی هر دو وجه درب
            [-1, 1].forEach(faceSign => {
                const panelZ = leafZ + faceSign * (leafT / 2 + 0.55);

                const topPanel = new THREE.Mesh(new THREE.BoxGeometry(panelW, topPanelH, 1.2), panelMat);
                topPanel.position.set(doorCX, topPanelY, panelZ);
                topPanel.castShadow = true;
                elementsGroup.add(topPanel);

                const bottomPanel = new THREE.Mesh(new THREE.BoxGeometry(panelW, bottomPanelH, 1.2), panelMat);
                bottomPanel.position.set(doorCX, bottomPanelY, panelZ);
                bottomPanel.castShadow = true;
                elementsGroup.add(bottomPanel);

                [topPanel, bottomPanel].forEach(panel => {
                    const pw = panel.geometry.parameters.width;
                    const ph = panel.geometry.parameters.height;
                    const rim = new THREE.Mesh(
                        new THREE.BoxGeometry(pw + 1.2, ph + 1.2, 0.5),
                        panelFrameMat
                    );
                    rim.position.copy(panel.position);
                    rim.position.z = panel.position.z - faceSign * 0.55;
                    elementsGroup.add(rim);
                });
            });

            // دستگیره روی هر دو سمت درب (همان موقعیت نسبی)
            const handleMat = new THREE.MeshStandardMaterial({
                color: 0xd4af37, metalness: 0.88, roughness: 0.22, envMapIntensity: 0.9
            });
            const handleSide = doorX + doorW - frameW - 6;
            const handleY = doorY + doorH * 0.45;
            [-1, 1].forEach(faceSign => {
                const handleZ = leafZ + faceSign * (leafT / 2 + 1.15);
                const handleBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.2, 16), handleMat);
                handleBase.rotation.x = Math.PI / 2;
                handleBase.position.set(handleSide, handleY, handleZ);
                handleBase.castShadow = true;
                elementsGroup.add(handleBase);
                const handleLever = new THREE.Mesh(new THREE.BoxGeometry(9, 1.5, 1.5), handleMat);
                handleLever.position.set(handleSide - 4, handleY, handleZ + faceSign * 0.55);
                handleLever.castShadow = true;
                elementsGroup.add(handleLever);
            });

            // لولا روی هر دو سمت (لبه لولا)
            const hingeMat = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 0.75, roughness: 0.28 });
            [-1, 1].forEach(faceSign => {
                [0.15, 0.5, 0.85].forEach(ratio => {
                    const hinge = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9, 1.8), hingeMat);
                    hinge.position.set(
                        doorX + frameW + 1,
                        doorY + doorH * ratio,
                        leafZ + faceSign * (leafT / 2 + 0.75)
                    );
                    hinge.castShadow = true;
                    elementsGroup.add(hinge);
                });
            });
        });

        // ExtrudeGeometry r186: depth/bevel* همچنان معتبر — بدون تغییر API
        // Bevel ظریف گوشه‌های دیوار (نه باکس تخت)
        const extrudeSettings = {
            depth: extrudeDepth,
            bevelEnabled: true,
            bevelThickness: 0.7,
            bevelSize: 0.55,
            bevelSegments: 2,
            curveSegments: 2
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        const pos = geo.attributes.position;
        const uv = geo.attributes.uv;
        // UV اسکیل‌شده به cm دیوار — با repeat تکسچر هماهنگ است
        if (pos && uv) {
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                uv.setXY(i, x / width, y / h);
            }
            uv.needsUpdate = true;
        }
        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(geo, wallMat);
        mesh.receiveShadow = true; mesh.castShadow = true;

        const finalWallGroup = new THREE.Group();
        finalWallGroup.add(mesh); finalWallGroup.add(elementsGroup); 
        finalWallGroup.rotation.y = rotY; finalWallGroup.position.set(posX, 0, posZ);
        finalWallGroup.userData.isWall = true;
        finalWallGroup.userData.wallType = 'main';
        
        this.scene.add(finalWallGroup);
    };
        // 0. ایجاد ساختار پیش‌فرض در صورت نبود room.walls برای جلوگیری از ارور
    const walls = room.walls || {
        top:    { len: room.w || 400, angle: 0 },
        bottom: { len: room.w || 400, angle: 0 },
        left:   { len: room.d || 300, angle: 90 },
        right:  { len: room.d || 300, angle: 90 }
    };
    // 1. تبدیل زوایای کاربر به رادیان
    const tAngRad = (walls.top.angle || 0) * (Math.PI / 180);
    const lAngRad = (walls.left.angle || 0) * (Math.PI / 180);
    const rAngRad = (walls.right.angle || 0) * (Math.PI / 180);
    const bAngRad = (walls.bottom.angle || 0) * (Math.PI / 180);

    // 2. محاسبه مختصات نقطه شروع برای دیوارهای راست و پایین
    const trX = walls.top.len * Math.cos(tAngRad);
    const trZ = walls.top.len * Math.sin(tAngRad);
    const blX = walls.left.len * Math.cos(lAngRad);
    const blZ = walls.left.len * Math.sin(lAngRad);
    
    // 👇 --- کدهای اصلاح‌شده صفحات برش (Clipping Planes) --- 👇
    const clipPlanes = [];

    // محاسبه مختصات دقیق نقاط انتهایی دیوار راست و پایین
    const brX_right = trX + walls.right.len * Math.cos(Math.PI - rAngRad);
    const brZ_right = trZ - walls.right.len * Math.sin(Math.PI - rAngRad);

    const brX_bottom = blX + walls.bottom.len * Math.cos(Math.PI - bAngRad);
    const brZ_bottom = blZ - walls.bottom.len * Math.sin(Math.PI - bAngRad);

    // تابع هوشمند جدید (بدون نیاز به مرکز، بر اساس ترتیب نقاط در جهت عقربه‌های ساعت)
    const addClipPlane = (x1, z1, x2, z2) => {
        const dx = x2 - x1;
        const dz = z2 - z1;
        // محاسبه بردار نرمال
        const normal = new THREE.Vector3(-dz, 0, dx).normalize(); 
        clipPlanes.push(new THREE.Plane().setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(x1, 0, z1)));
    };

    // اعمال صفحه برش فقط برای دیوارهایی که زاویه آن‌ها تغییر کرده است
    // دقت کنید: ترتیب ارسال نقاط برای چپ و پایین اصلاح شده است تا ساعت‌گرد باشند
    
    if (this.config.hasTop && (walls.top.angle || 0) !== 0) {
        addClipPlane(0, 0, trX, trZ); // بالا: از چپ به راست
    }
    if (this.config.hasRight && (walls.right.angle || 90) !== 90) {
        addClipPlane(trX, trZ, brX_right, brZ_right); // راست: از بالا به پایین
    }
    if (this.config.hasBottom && (walls.bottom.angle || 0) !== 0) {
        addClipPlane(brX_bottom, brZ_bottom, blX, blZ); // پایین: از راست به چپ (اصلاح شد)
    }
    if (this.config.hasLeft && (walls.left.angle || 90) !== 90) {
        addClipPlane(blX, blZ, 0, 0); // چپ: از پایین به بالا (اصلاح شد)
    }


    // 3. رسم دیوارها با زوایا و طول‌های جدید
    // دیوار والد کوتاه نمی‌شود — فاصله ایجاد می‌کرد.
    // هم‌پوشانی اتصال روی خود دیوار کاستوم انجام می‌شود.
     if (this.config.hasTop) {
        buildWallWithElements('top', walls.top.len, t, 0, -t, -tAngRad, 0);
    }

    if (this.config.hasLeft) {
        buildWallWithElements('left', walls.left.len, t, 0, 0, -lAngRad, 0);
    }
       if (this.config.hasRight) {
        const shiftX = t * Math.sin(rAngRad);
        const shiftZ = t * Math.cos(rAngRad);
        buildWallWithElements('right', walls.right.len, t, trX - shiftX, trZ + shiftZ, Math.PI - rAngRad, 0);
    }

        if (this.config.hasBottom) {
        buildWallWithElements('bottom', walls.bottom.len, t, blX, blZ, Math.PI - bAngRad, 0);
    }

    // =========================================================================
    // --- رسم دیوارهای سفارشی (customWalls) در نمای 3D ---
    // =========================================================================

    // ✨ تغییر مهم: تعریف متغیر خارج از بلاک if تا در انتهای کد هم در دسترس باشد
    let baseEndpoints3D = {}; 

if (window.customWalls && window.customWalls.length > 0) {
    const wallThick = this.config.wallThickness || 20; 
    const wallHeight = h;

    const ptTL = { x: 0,         z: 0 };
    const ptTR = { x: trX,       z: trZ };
    const ptBL = { x: blX,       z: blZ };
    const ptBR = { x: brX_right, z: brZ_right };

    baseEndpoints3D = {
        top:    { start: ptTL, end: ptTR }, 
        bottom: { start: ptBL, end: ptBR },
        left:   { start: ptTL, end: ptBL },
        right:  { start: ptTR, end: ptBR } 
    };
    // اگر گروه وجود نداشت بساز
    if (!this.customWallLampsGroup) {
        this.customWallLampsGroup = new THREE.Group();
    }
    
    // همیشه مطمئن شو که گروه در صحنه حضور دارد
    this.scene.add(this.customWallLampsGroup);

    // پاک‌سازی لامپ‌های قدیمی قبل از شروع حلقه
    while (this.customWallLampsGroup.children.length > 0) { 
        this.customWallLampsGroup.remove(this.customWallLampsGroup.children[0]); 
    }

    // آرایه‌های موقت برای ذخیره لامپ‌های همین دور
    const tempCustomBulbs = [];
    const tempCustomLights = [];

    window.customWalls.forEach(cWall => {
        let p1; 

        if (cWall.x !== undefined && cWall.y !== undefined) {
            p1 = { x: cWall.x, z: cWall.y };
        } else {
            const targetWallId = cWall.targetWall;
            const target = baseEndpoints3D[targetWallId];
            
            if (!target) {
                console.error("Target wall not found:", targetWallId);
                return; 
            }

            p1 = (cWall.attachment === 'end') ? { x: target.end.x, z: target.end.z } : { x: target.start.x, z: target.start.z };
        }
        
        const cAngRad = cWall.angle * (Math.PI / 180);
        const dirX = Math.cos(cAngRad);
        const dirZ = Math.sin(cAngRad);

        // هم‌پوشانی داخل دیوار والد تا فاصله نماند و سطح انتهای والد پوشیده شود
        const overlap = (cWall.shift === 'left' || cWall.shift === 'right') ? wallThick : 0;
        const drawP1 = {
            x: p1.x - dirX * overlap,
            z: p1.z - dirZ * overlap
        };
        const drawLen = cWall.len + overlap;

        const p2 = {
            x: p1.x + cWall.len * dirX,
            z: p1.z + cWall.len * dirZ
        };
        baseEndpoints3D[cWall.id] = { start: p1, end: p2 };

        const cWallMat = createWallCeramicMaterial(wallHeight, drawLen);

        let customWallMesh = window.buildCustomWallSegment(
            drawP1,
            cAngRad,
            drawLen,
            wallThick,
            wallHeight,
            cWallMat,
            this.scene,
            cWall.shift
        );

        if (customWallMesh) {
            customWallMesh.userData.isWall = true;
            customWallMesh.userData.wallType = 'custom';
            customWallMesh.userData.wallId = cWall.id;
            customWallMesh.isCustomWall = true;
            customWallsList.push(customWallMesh);
            
            // 🌟 اگر می‌خواهید فقط بعضی دیوارها لامپ داشته باشند، اینجا می‌توانید شرط if (cWall.hasLamp) بگذارید
            // =========================================================
            // 💡 ساخت لامپ برای دیوار کاستوم
            // =========================================================
            const cfgL = this.config || {};
            const defaultIntensity = (cfgL.ceilingLightIntensity != null) ? parseFloat(cfgL.ceilingLightIntensity) : 3200;
            const lightColor = (cfgL.ceilingLightColor != null) ? cfgL.ceilingLightColor : 0xfff1e0;
            const range = (cfgL.ceilingLightRange && parseFloat(cfgL.ceilingLightRange) > 0)
                ? parseFloat(cfgL.ceilingLightRange)
                : Math.max(380, wallHeight * 1.65 + 40);
            const lampGroup = new THREE.Group();

            const frame = new THREE.Mesh(
                new THREE.CylinderGeometry(6, 7, 1, 32), 
                new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.2 })
            );
            frame.position.set(0, wallHeight - 2, 0);
            lampGroup.add(frame);

            const bulb = new THREE.Mesh(
                new THREE.CylinderGeometry(5.5, 5.5, 0.5, 32),
                new THREE.MeshStandardMaterial({ color: lightColor, emissive: lightColor, emissiveIntensity: 1 })
            );
            bulb.position.set(0, wallHeight - 2.4, 0);
            lampGroup.add(bulb);
            
            tempCustomBulbs.push(bulb);

            const spotLight = new THREE.SpotLight(lightColor, defaultIntensity);
            spotLight.position.set(0, wallHeight - 3, 0);
            spotLight.angle = (cfgL.ceilingLightAngle != null) ? parseFloat(cfgL.ceilingLightAngle) : 1.25;
            spotLight.penumbra = (cfgL.ceilingLightPenumbra != null) ? parseFloat(cfgL.ceilingLightPenumbra) : 0.92;
            spotLight.distance = range;
            spotLight.decay = (cfgL.ceilingLightDecay != null) ? parseFloat(cfgL.ceilingLightDecay) : 2;
            spotLight.castShadow = false; // فقط لامپ مرکزی اصلی سایه دارد
            if (typeof this.registerLightState === 'function') {
                this.registerLightState(spotLight, {
                    intensity: defaultIntensity,
                    color: lightColor,
                    state: true
                });
            } else {
                spotLight.userData.baseIntensity = defaultIntensity;
                spotLight.userData.savedIntensity = defaultIntensity;
                spotLight.userData.savedColor = lightColor;
                spotLight.userData.savedState = true;
            }

            const target = new THREE.Object3D();
            target.position.set(0, 0, 0); 
            lampGroup.add(target);
            spotLight.target = target;

            lampGroup.add(spotLight);
            tempCustomLights.push(spotLight);
                        // پیدا کردن نقطه وسط خط اصلی دیوار
            const midX = (p1.x + p2.x) / 2;
            const midZ = (p1.z + p2.z) / 2;

            // محاسبه میزان شیفت (جابجایی) و چرخش مختص این دیوار
            let zShift = 0;
            let baseDistance = 50; 
            let flipAngle = 0; 

            if (cWall.shift === 'right') {
                zShift = wallThick / 2;
                baseDistance = -50; 
                flipAngle = 0;
            } else if (cWall.shift === 'left') {
                zShift = -wallThick / 2;
                baseDistance = 50;  // 🌟 اضافه شد: رفتن به سمت دیگر
                flipAngle = Math.PI; // 🌟 اضافه شد: چرخش ۱۸۰ درجه لامپ
            }

            // فاصله پایه لامپ از دیوار به علاوه میزان شیفت دیوار
            const effectiveDistance = baseDistance + zShift;
            
            // محاسبه آفست نهایی با استفاده از فاصله ترکیب شده با شیفت
            const offsetX = -Math.sin(cAngRad) * effectiveDistance; 
            const offsetZ = Math.cos(cAngRad) * effectiveDistance;

            // تنظیم ارتفاع (محور Y) روی 0 و اعمال موقعیت در صحنه
            lampGroup.position.set(midX + offsetX, 0, midZ + offsetZ);

            // 🌟 چرخش لامپ برای هم‌راستا شدن با دیوار + چرخش ۱۸۰ درجه در صورت نیاز
            lampGroup.rotation.y = -cAngRad + flipAngle; 
            
            this.customWallLampsGroup.add(lampGroup);

        }
    });

    // =========================================================
    // 💡 اضافه کردن قطعی به آرایه‌های دکمه با یک تاخیر کوتاه
    // =========================================================
    setTimeout(() => {
        if (!this.bulbMeshes) this.bulbMeshes = [];
        if (!this.ceilingLights) this.ceilingLights = [];
        
        tempCustomBulbs.forEach(b => {
            if (!this.bulbMeshes.includes(b)) this.bulbMeshes.push(b);
        });
        tempCustomLights.forEach(l => {
            if (!this.ceilingLights.includes(l)) this.ceilingLights.push(l);
        });
    }, 500);
}





// =================================================================
// END: REPLACEMENT CODE
// =================================================================

    // =========================================================================
    // 🌟 ۴. ساخت نمای بیرونی (محیط یکپارچه / Environment Box)
    // =========================================================================
    const E = 800; // حاشیه اطراف خانه (۶ متر)
    
    // ۱. پیدا کردن بزرگترین و کوچکترین مختصات از بین تمام دیوارهای صحنه
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    let hasAnyWall = false;
    for (let key in baseEndpoints3D) {
        let p = baseEndpoints3D[key];
        if (p && p.start && p.end) {
            hasAnyWall = true;
            minX = Math.min(minX, p.start.x, p.end.x);
            maxX = Math.max(maxX, p.start.x, p.end.x);
            minZ = Math.min(minZ, p.start.z, p.end.z);
            maxZ = Math.max(maxZ, p.start.z, p.end.z);
        }
    }
    
    // اگر هنوز دیواری نبود، ابعاد پایه را در نظر بگیر
    if (!hasAnyWall) {
        minX = 0; maxX = room.w;
        minZ = 0; maxZ = room.d;
    }

    // =========================================================
    // 🌟 ساخت کف و سقف داینامیک (بر اساس دیوارهای اصلی + کاستوم)
    // =========================================================
    const innerW = maxX - minX;
    const innerD = maxZ - minZ;
    const innerCX = minX + (innerW / 2);
    const innerCZ = minZ + (innerD / 2);

    // --- ساخت کف اصلی آشپزخانه ---
    const createParquetMaterial = (widthCm, depthCm) => {
        const c = this.config || {};
        const roughCfg = (c.floorRoughness !== undefined) ? Math.max(0.45, parseFloat(c.floorRoughness) + 0.15) : 0.55;
        const bumpCfg = (c.floorBumpScale !== undefined) ? parseFloat(c.floorBumpScale) : 0.45;
        const envI = (c.floorEnvIntensity !== undefined) ? parseFloat(c.floorEnvIntensity) * 0.7 : 0.28;

        const canvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        canvas.width = 2048; canvas.height = 2048;
        bumpCanvas.width = 2048; bumpCanvas.height = 2048;

        const ctx = canvas.getContext('2d');
        const bumpCtx = bumpCanvas.getContext('2d');

        // تخته پارکت واقعی‌تر: طول ~120cm عرض ~12cm
        const boardW = 120;
        const boardH = 12;
        const texSizeCm = 240; // ۲ ردیف طولی
        const pxPerCm = canvas.width / texSizeCm;
        const gap = Math.max(1.5, 0.15 * pxPerCm);

        // درز تیره بین تخته‌ها
        ctx.fillStyle = '#1a120c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        bumpCtx.fillStyle = '#101010';
        bumpCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

        const woodPalette = ['#a8794f', '#9c6f49', '#8b5e3c', '#825938', '#734a2c', '#6b4226', '#94663d'];

        for (let y = 0; y < texSizeCm - 0.01; y += boardH) {
            const row = Math.floor(y / boardH);
            const offset = (row % 2 === 0) ? 0 : boardW * 0.5;
            for (let x = -boardW; x < texSizeCm + boardW; x += boardW) {
                const drawX = (x + offset) * pxPerCm;
                const drawY = y * pxPerCm;
                const drawW = boardW * pxPerCm;
                const drawH = boardH * pxPerCm;
                const ix = drawX + gap, iy = drawY + gap;
                const iw = Math.max(1, drawW - gap * 2), ih = Math.max(1, drawH - gap * 2);

                // رنگ ثابت‌تر بر اساس موقعیت (قابل تکرار بین رندرها با seed موقعیتی)
                const seed = Math.abs((row * 97 + Math.floor((x + offset) / boardW) * 53) % woodPalette.length);
                const base = woodPalette[seed];
                ctx.fillStyle = base;
                ctx.fillRect(ix, iy, iw, ih);

                // دانه چوب (grain) طولی
                for (let i = 0; i < 10; i++) {
                    const gy = iy + (ih * (0.08 + i * 0.09)) + ((seed + i) % 3);
                    ctx.strokeStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.02})`;
                    ctx.lineWidth = 1 + (i % 2);
                    ctx.beginPath();
                    ctx.moveTo(ix, gy);
                    ctx.lineTo(ix + iw, gy + ((i % 2) ? 1.5 : -1));
                    ctx.stroke();
                }
                // هایلایت ملایم
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fillRect(ix, iy, iw, ih * 0.25);

                bumpCtx.fillStyle = '#ececec';
                bumpCtx.fillRect(ix, iy, iw, ih);
                bumpCtx.strokeStyle = '#777777';
                bumpCtx.lineWidth = gap;
                bumpCtx.strokeRect(ix, iy, iw, ih);
            }
        }

        const mapTex = new THREE.CanvasTexture(canvas);
        mapTex.wrapS = THREE.RepeatWrapping;
        mapTex.wrapT = THREE.RepeatWrapping;
        mapTex.repeat.set(Math.max(0.2, widthCm / texSizeCm), Math.max(0.2, depthCm / texSizeCm));
        mapTex.colorSpace = THREE.SRGBColorSpace;

        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        if (typeof window.applyKitchenTextureColorSpace === 'function') window.applyKitchenTextureColorSpace(bumpTex, 'data');
        else if (typeof THREE !== 'undefined' && THREE.NoColorSpace != null) bumpTex.colorSpace = THREE.NoColorSpace;
        bumpTex.wrapS = THREE.RepeatWrapping;
        bumpTex.wrapT = THREE.RepeatWrapping;
        bumpTex.repeat.set(Math.max(0.2, widthCm / texSizeCm), Math.max(0.2, depthCm / texSizeCm));

        if (this.renderer && this.renderer.capabilities) {
const maxA = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
            mapTex.anisotropy = maxA; bumpTex.anisotropy = maxA;
        }

        return new THREE.MeshStandardMaterial({
            map: mapTex, bumpMap: bumpTex, bumpScale: bumpCfg,
            roughness: roughCfg, metalness: 0.02, envMapIntensity: envI
        });
    };

const floorThickness = 20;
const floorGeo = new THREE.BoxGeometry(innerW, floorThickness, innerD);

let floorMat;
if ((this.config && this.config.floorStyle) === 'parquet') {
    floorMat = createParquetMaterial(innerW, innerD);   // تابعی که از قبل داری
} else {
    floorMat = createFloorCeramicMaterial(innerW, innerD);
}

const edgeMatFrontBack = createFloorEdgeMaterial(innerW);
const edgeMatLeftRight = createFloorEdgeMaterial(innerD);

const floorMaterials = [
    edgeMatLeftRight, edgeMatLeftRight, 
    floorMat, floorMat, 
    edgeMatFrontBack, edgeMatFrontBack
];

    // اعمال صفحات برش به متریال‌های کف جدید
    if (clipPlanes.length > 0) {
        floorMaterials.forEach(mat => {
            mat.clippingPlanes = clipPlanes;
            mat.clipIntersection = false;
            mat.needsUpdate = true;
        });
    }

    const floor = new THREE.Mesh(floorGeo, floorMaterials);
    floor.position.set(innerCX, -floorThickness / 2, innerCZ);
    floor.receiveShadow = true;
    floor.castShadow = false;
    this.scene.add(floor);

    // --- سقف واقعی: ضخامت + گوشه + سایه + قرنیز ---
    const ceilThickness = (this.config && this.config.ceilingThickness != null)
        ? parseFloat(this.config.ceilingThickness) : 18;
    const ceilRough = (this.config && this.config.ceilingRoughness != null)
        ? parseFloat(this.config.ceilingRoughness) : 0.82;
    const ceilColor = this.config.ceilingColor || 0xfafafa;

    // متریال زیر سقف (سطح دیده می‌شود) — گچ مات با کمی variation
    const makeCeilingPlasterMat = (isEdge) => {
        const mat = new THREE.MeshStandardMaterial({
            color: ceilColor,
            roughness: isEdge ? Math.min(0.95, ceilRough + 0.08) : ceilRough,
            metalness: 0.0,
            envMapIntensity: 0.15,
            clippingPlanes: clipPlanes.length > 0 ? clipPlanes : null,
            clipIntersection: false
        });
        // لبه کمی تیره‌تر برای حس ضخامت
        if (isEdge) {
            try {
                const c = new THREE.Color(ceilColor);
                c.multiplyScalar(0.88);
                mat.color.copy(c);
            } catch (e) { /* ignore */ }
        }
        return mat;
    };

    const ceilMatTop = makeCeilingPlasterMat(false);    // روی سقف (بیرون اتاق)
    const ceilMatBottom = makeCeilingPlasterMat(false); // زیر سقف (داخل)
    const ceilMatEdge = makeCeilingPlasterMat(true);    // لبه‌های ضخامت

    // Box materials: +x -x +y -y +z -z
    const ceilMaterials = [
        ceilMatEdge, ceilMatEdge,
        ceilMatTop, ceilMatBottom,
        ceilMatEdge, ceilMatEdge
    ];

    const ceilGeo = new THREE.BoxGeometry(innerW, ceilThickness, innerD);
    // bevel خیلی ظریف گوشه سقف با کمی inset روی UV لازم نیست — ضخامت خودش گوشه می‌سازد
    const ceiling = new THREE.Mesh(ceilGeo, ceilMaterials);
    // سطح زیرین دقیقاً روی h بنشیند تا با دیوار یکپارچه شود
    ceiling.position.set(innerCX, h + (ceilThickness / 2), innerCZ);
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    ceiling.userData.isCeiling = true;
    this.scene.add(ceiling);

    // قرنیز / کُوِه دور تا دور محل اتصال سقف و دیوار
    const corniceOn = !(this.config && this.config.ceilingCornice === false);
    if (corniceOn && innerW > 10 && innerD > 10) {
        const cH = Math.max(3, parseFloat(this.config.ceilingCorniceH) || 6);
        const cD = Math.max(2, parseFloat(this.config.ceilingCorniceD) || 5);
        const corniceMat = new THREE.MeshStandardMaterial({
            color: ceilColor,
            roughness: Math.min(0.95, ceilRough + 0.05),
            metalness: 0.0,
            envMapIntensity: 0.12,
            clippingPlanes: clipPlanes.length > 0 ? clipPlanes : null,
            clipIntersection: false
        });

        const addCorniceStrip = (len, alongX, cx, cz) => {
            // پروفیل ساده L: نوار افقی زیر سقف + نوار عمودی روی دیوار
            const group = new THREE.Group();
            const horiz = new THREE.Mesh(
                new THREE.BoxGeometry(alongX ? len : cD, cH * 0.35, alongX ? cD : len),
                corniceMat
            );
            horiz.position.set(0, -cH * 0.15, 0);
            horiz.castShadow = true;
            horiz.receiveShadow = true;
            group.add(horiz);

            const vert = new THREE.Mesh(
                new THREE.BoxGeometry(alongX ? len : (cD * 0.45), cH, alongX ? (cD * 0.45) : len),
                corniceMat
            );
            // چسبیده به دیوار، کمی پایین‌تر از سقف
            vert.position.set(
                alongX ? 0 : (cx < innerCX ? cD * 0.2 : -cD * 0.2),
                -cH * 0.5,
                alongX ? (cz < innerCZ ? cD * 0.2 : -cD * 0.2) : 0
            );
            vert.castShadow = true;
            vert.receiveShadow = true;
            group.add(vert);

            group.position.set(cx, h, cz);
            group.userData.isCeilingCornice = true;
            this.scene.add(group);
        };

        // چهار ضلع داخلی
        const inset = cD / 2;
        addCorniceStrip(innerW - cD * 0.5, true,  innerCX, minZ + inset);           // back
        addCorniceStrip(innerW - cD * 0.5, true,  innerCX, maxZ - inset);           // front
        addCorniceStrip(innerD - cD * 0.5, false, minX + inset, innerCZ);           // left
        addCorniceStrip(innerD - cD * 0.5, false, maxX - inset, innerCZ);           // right
    }
    // =========================================================

    // ۲. محاسبه مرزهای محیط بیرونی با احتساب فاصله E
    const outerMinX = minX - E;
    const outerMaxX = maxX + E;
    const outerMinZ = minZ - E;
    const outerMaxZ = maxZ + E;

    const outerW = outerMaxX - outerMinX;
    const outerD = outerMaxZ - outerMinZ;
    const outerCX = outerMinX + (outerW / 2);
    const outerCZ = outerMinZ + (outerD / 2);

    const outerFloorY = -floorThickness; 
    const outerCeilY = h + ceilThickness + 1; 
    const outerHouseH = outerCeilY - outerFloorY;

    const createOuterWallMaterial = (wallHeightCm, wallWidthCm) => {
        const canvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        const texWCm = 120; const texHCm = wallHeightCm; 
        
        canvas.width = 1024; canvas.height = 2048;
        bumpCanvas.width = 1024; bumpCanvas.height = 2048;
        
        const ctx = canvas.getContext('2d');
        const bumpCtx = bumpCanvas.getContext('2d');

        ctx.fillStyle = '#f5f2eb'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        bumpCtx.fillStyle = '#ffffff'; bumpCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);

        const pxPerCmX = canvas.width / texWCm;
        const pxPerCmY = canvas.height / texHCm;
        const tileW = 60; const tileH = 30; const gap = 2;

        for (let y = 0; y < 112; y += tileH) {
            let currentTileH = Math.min(tileH, 112 - y);
            for (let x = 0; x < texWCm; x += tileW) {
                let drawX = x * pxPerCmX;
                let topYCm = y + currentTileH;
                let drawY = canvas.height - (topYCm * pxPerCmY);
                let drawW = tileW * pxPerCmX;
                let drawH = currentTileH * pxPerCmY;

                let isEven = (Math.floor(x/tileW) + Math.floor(y/tileH)) % 2 === 0;
                ctx.fillStyle = isEven ? '#dcb68a' : '#c89d6b';
                ctx.fillRect(drawX + gap, drawY + gap, drawW - gap*2, drawH - gap*2);

                if (typeof drawMarbleVeins === 'function') {
                    drawMarbleVeins(ctx, drawX + gap, drawY + gap, drawW - gap*2, drawH - gap*2, 'rgba(255, 255, 255, 0.5)', 5, 2);
                    drawMarbleVeins(ctx, drawX + gap, drawY + gap, drawW - gap*2, drawH - gap*2, 'rgba(90, 60, 30, 0.3)', 4, 1);
                }

                bumpCtx.fillStyle = '#dddddd';
                bumpCtx.fillRect(drawX + gap, drawY + gap, drawW - gap*2, drawH - gap*2);
                bumpCtx.lineWidth = gap; bumpCtx.strokeStyle = '#555555'; 
                bumpCtx.strokeRect(drawX + gap, drawY + gap, drawW - gap*2, drawH - gap*2);
            }
        }
        
        let sepY = canvas.height - (112 * pxPerCmY);
        ctx.fillStyle = '#6b4527'; ctx.fillRect(0, sepY - 6, canvas.width, 12);
        bumpCtx.fillStyle = '#888888'; bumpCtx.fillRect(0, sepY - 6, canvas.width, 12);

        const mapTex = new THREE.CanvasTexture(canvas);
        mapTex.wrapS = THREE.RepeatWrapping; mapTex.wrapT = THREE.RepeatWrapping;
        mapTex.repeat.set(wallWidthCm / texWCm, 1);
        mapTex.colorSpace = THREE.SRGBColorSpace;

        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        if (typeof window.applyKitchenTextureColorSpace === 'function') window.applyKitchenTextureColorSpace(bumpTex, 'data');
        else if (typeof THREE !== 'undefined' && THREE.NoColorSpace != null) bumpTex.colorSpace = THREE.NoColorSpace;
        bumpTex.wrapS = THREE.RepeatWrapping; bumpTex.wrapT = THREE.RepeatWrapping;
        bumpTex.repeat.set(wallWidthCm / texWCm, 1);

        return new THREE.MeshStandardMaterial({
            map: mapTex, bumpMap: bumpTex, bumpScale: 0.5, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide
        });
    };

    // ----- ب) ساخت کف و سقف یکپارچه -----
    const outerFloorThickness = 20; 
    const houseFloorGeo = new THREE.BoxGeometry(outerW, outerFloorThickness, outerD);
    const houseFloorMat = createParquetMaterial(outerW, outerD);
    const houseFloor = new THREE.Mesh(houseFloorGeo, houseFloorMat);

houseFloor.userData.excludeFromExport = true;

houseFloor.position.set(
    outerCX,
    outerFloorY - (outerFloorThickness / 2),
    outerCZ
);

houseFloor.receiveShadow = true;

this.scene.add(houseFloor);

// سقف بیرونی با ضخامت (نه فقط Plane تخت)
const houseCeilMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.1
});
const houseCeilEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    roughness: 0.95,
    metalness: 0.0
});
const houseCeilThick = Math.max(12, ceilThickness * 0.85);
const houseCeilGeo = new THREE.BoxGeometry(outerW, houseCeilThick, outerD);
const houseCeil = new THREE.Mesh(houseCeilGeo, [
    houseCeilEdgeMat, houseCeilEdgeMat,
    houseCeilMat, houseCeilMat,
    houseCeilEdgeMat, houseCeilEdgeMat
]);
houseCeil.userData.excludeFromExport = true;
houseCeil.position.set(outerCX, outerCeilY + houseCeilThick / 2, outerCZ);
houseCeil.castShadow = true;
houseCeil.receiveShadow = true;
this.scene.add(houseCeil);

    // ----- ج) کشیدن دقیقا ۴ دیوار دور تا دور کل فضا -----
    const addOuterBoxWall = (x1, z1, x2, z2) => {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const length = Math.sqrt(dx*dx + dz*dz);
        if (length < 0.1) return;
        
        const wallMat = createOuterWallMaterial(outerHouseH, length);
        const wallGeo = new THREE.PlaneGeometry(length, outerHouseH);
const wallMesh = new THREE.Mesh(wallGeo, wallMat);

wallMesh.userData.excludeFromExport = true;

wallMesh.position.set(
    x1 + dx/2,
    outerFloorY + outerHouseH/2,
    z1 + dz/2
);

wallMesh.rotation.y = -Math.atan2(dz, dx);

this.scene.add(wallMesh);
    };

    addOuterBoxWall(outerMinX, outerMinZ, outerMaxX, outerMinZ); // دیوار بالا
    addOuterBoxWall(outerMinX, outerMaxZ, outerMaxX, outerMaxZ); // دیوار پایین
    addOuterBoxWall(outerMinX, outerMinZ, outerMinX, outerMaxZ); // دیوار چپ
    addOuterBoxWall(outerMaxX, outerMinZ, outerMaxX, outerMaxZ); // دیوار راست


    if (typeof this.createBaseboards === "function") {
        this.createBaseboards(t);
    }

},

createSingleUnit3D: function(c) {
    const group = new THREE.Group();
    
    // ۱. متریال بدنه داخل یونیت (کمی تاریک‌تر برای حس عمق)
    const bodyMat = (c.bodyColor)
        ? new THREE.MeshStandardMaterial({ color: c.bodyColor, roughness: 0.62, metalness: 0.0 })
        : ((typeof this.createInteriorMaterials === 'function')
            ? this.createInteriorMaterials().bodyMat
            : new THREE.MeshStandardMaterial({ color: 0xe8e6e3, roughness: 0.62, metalness: 0.0 }));

    // ۲. متریال درب
    const initialColor = c.doorColor || c.color || "#8B4513";
    const isTexture = initialColor.includes('http') || initialColor.includes('assets/');
    
    const _fk = c.doorFinish || 'matte';
    const _fp2 = (typeof window.getKitchenFinishPreset === 'function')
        ? window.getKitchenFinishPreset(_fk)
        : { roughness: 0.7, metalness: 0.02 };
    const doorMat = new THREE.MeshStandardMaterial({ 
        color: isTexture ? 0xffffff : parseInt(initialColor.replace('#', '').substring(0, 6), 16), 
        roughness: _fp2.roughness,  
        metalness: _fp2.metalness
    });

    const thickness = 1.6; // ضخامت ورق

    // ۳. لوازم خانگی — همان سیستم واقعی صحنه
    if (c.isAppliance) {
        if (typeof this.createApplianceSystem === 'function') {
            // مدل‌ها حول y=0 ساخته می‌شوند؛ برای مینی‌پریویو نصف ارتفاع شیفت
            const temp = new THREE.Group();
            this.createApplianceSystem(temp, c);
            temp.position.y = (c.h || 80) / 2;
            group.add(temp);
        } else {
            const appMesh = new THREE.Mesh(
                new THREE.BoxGeometry(c.w, c.h, c.d),
                new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.7, roughness: 0.3 })
            );
            appMesh.position.set(0, c.h / 2, 0);
            group.add(appMesh);
        }
    } 
    // ۴. اگر کابینت معمولی است
    else {
        // ساخت بدنه اصلی (باکس توپر برای پیش‌نمایش یا پنل‌های جداگانه)
        // برای پیش‌نمایش یک باکس ساده با کمی تو رفتگی برای درب کافیست
        const bodyDepth = c.d - thickness;
        const body = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, bodyDepth), bodyMat);
        body.position.set(0, c.h / 2, -thickness / 2);
        group.add(body);

        // ساخت درب
        const door = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, thickness), doorMat);
        // قرار دادن درب در جلوی بدنه
        door.position.set(0, c.h / 2, bodyDepth / 2);
        group.add(door);
    }

    // مرکز ثقل را تنظیم می‌کنیم تا در مینی‌پریویو وسط بیفتد
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.set(-center.x, -center.y, -center.z);

    return group;
},



// =====================================================================
// 30 — سیستم لوازم آشپزخانه (جدا از کابینت معمولی)
// یخچال / لباسشویی / ظرفشویی / فر / هود / اجاق
// =====================================================================

createApplianceSystem: function(group, c) {
    if (!group || !c) return;
    const label = (c.label || c.name || '').toString();
    const lower = label.toLowerCase();

    const isFridge = c.h > 150 || label.includes('یخچال') || lower.includes('fridge');
    const isWash = label.includes('لباسشویی') || lower.includes('wash');
    const isDish = label.includes('ظرفشویی') || lower.includes('dish');
    const isOven = label.includes('فر') || c.isOven || lower.includes('oven');
    const isHood = label.includes('هود') || c.isHood || lower.includes('hood');
    const isStove = label.includes('اجاق') || label.includes('گاز') || lower.includes('stove') || lower.includes('cooktop');

    let model = null;
    if (isFridge) model = this.buildFridgeAppliance(c);
    else if (isWash) model = this.buildWashingMachineAppliance(c);
    else if (isDish) model = this.buildDishwasherAppliance(c);
    else if (isOven) model = this.buildOvenAppliance(c);
    else if (isHood) model = this.buildHoodAppliance(c);
    else if (isStove) model = this.buildStoveAppliance(c);
    else model = this.buildGenericAppliance(c);

    if (model) {
        model.userData.isApplianceModel = true;
        model.visible = true;
        model.traverse(o => {
            if (o.isMesh) {
                o.visible = true;
                o.castShadow = true;
                o.receiveShadow = true;
                // جلوگیری از متریال نامرئی
                if (o.material) {
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach(m => {
                        if (!m) return;
                        if (m.opacity !== undefined && m.opacity < 0.1) m.opacity = 1;
                        if (m.transparent && m.opacity >= 0.99) m.transparent = false;
                        m.needsUpdate = true;
                    });
                }
            }
        });
        group.add(model);
    } else {
        // fallback تا حداقل یک باکس دیده شود
        const W = c.w || 70, H = c.h || 180, D = c.d || 70;
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(W, H, D),
            new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.75, roughness: 0.3 })
        );
        box.userData.isApplianceModel = true;
        group.add(box);
    }
},

/** متریال‌های مشترک لوازم */
_applianceMats: function() {
    return {
        steel: Kitchen3D.getSharedMaterial('app_steel', function(){ return new THREE.MeshStandardMaterial({ color: 0xd0d4d8, metalness: 0.82, roughness: 0.28 }); }),
        steelDark: Kitchen3D.getSharedMaterial('app_steelDark', function(){ return new THREE.MeshStandardMaterial({ color: 0x6a6e72, metalness: 0.8, roughness: 0.32 }); }),
        black: Kitchen3D.getSharedMaterial('app_black', function(){ return new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.45, roughness: 0.5 }); }),
        blackSteel: Kitchen3D.getSharedMaterial('app_blackSteel', function(){ return new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.85, roughness: 0.32 }); }),
        glass: Kitchen3D.getSharedMaterial('app_glass', function(){ return new THREE.MeshStandardMaterial({ color: 0x0a0a12, metalness: 0.9, roughness: 0.08, transparent: true, opacity: 0.85 }); }),
        chrome: Kitchen3D.getSharedMaterial('app_chrome', function(){ return new THREE.MeshStandardMaterial({ color: 0xe8e8ec, metalness: 0.95, roughness: 0.12 }); }),
        white: Kitchen3D.getSharedMaterial('app_white', function(){ return new THREE.MeshStandardMaterial({ color: 0xf5f5f5, metalness: 0.08, roughness: 0.42 }); }),
        plastic: Kitchen3D.getSharedMaterial('app_plastic', function(){ return new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.1, roughness: 0.7 }); }),
        rubber: Kitchen3D.getSharedMaterial('app_rubber', function(){ return new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.0, roughness: 0.9 }); })
    };
},

buildFridgeAppliance: function(c) {
    // یخچال واقعی‌تر: درب سفید، بدنه استیل، لاستیک دور درب، دستگیره مشکی، فاصله واقعی
    const W = Math.max(40, c.w || 70);
    const H = Math.max(120, c.h || 180);
    const D = Math.max(50, c.d || 70);
    const m = this._applianceMats();
    const g = new THREE.Group();
    g.name = 'fridgeAppliance';

    const doorT = 4.2;                 // ضخامت واقعی درب
    const gapDoors = 1.6;              // فاصله بین درب‌ها
    const sealT = 0.32;                // نوار لاستیکی ظریف (بدون تداخل گوشه)
    const bodyInset = 1.2;
    const bodyW = W - bodyInset;
    const bodyH = H - 2;
    const bodyD = Math.max(22, D - doorT - 0.8);
    const frontZ = bodyD / 2;          // جلوی بدنه
    const doorZ = frontZ + doorT / 2;  // مرکز درب

    // --- بدنه (جزئیات کمتر پشت/کنار برای Performance) ---
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), m.steel);
    body.position.set(0, 0, -doorT * 0.15);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // کناره‌های باریک استیل
    const sideGeo = new THREE.BoxGeometry(0.45, bodyH - 1, bodyD - 2);
    const sideL = new THREE.Mesh(sideGeo, m.steel);
    sideL.position.set(-W / 2 + 0.35, 0, -doorT * 0.15);
    g.add(sideL);
    const sideR = sideL.clone();
    sideR.position.x = W / 2 - 0.35;
    g.add(sideR);

    // پایه
    const footGeo = new THREE.CylinderGeometry(1.3, 1.5, 2.2, 10);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        const f = new THREE.Mesh(footGeo, m.plastic);
        f.position.set(sx * (W / 2 - 6), -H / 2 + 1.1, sz * (D / 2 - 8) - 1);
        g.add(f);
    });

    // گریل بالا
    const grille = new THREE.Mesh(new THREE.BoxGeometry(W * 0.72, 1.4, 2.2), m.steelDark);
    grille.position.set(0, H / 2 - 2.2, frontZ - 1);
    g.add(grille);

    // سایه شکاف بین درب و بدنه (نوار تیره نازک)
    const gapStrip = new THREE.Mesh(
        new THREE.BoxGeometry(W - 1.5, H - 3, 0.35),
        m.black
    );
    gapStrip.position.set(0, 0, frontZ + 0.15);
    g.add(gapStrip);

    const doorCount = c.doors || 1;
    const handleMat = m.blackSteel || m.black;
    const doorMat = m.white;
    const sealMat = m.rubber;

    const addSeal = (parent, dw, dh) => {
        // نوار لاستیکی روی وجه داخلی درب (سمت بدنه) — بدون هم‌پوشانی گوشه و بدون بیرون‌زدگی جلو
        const s = sealT;
        const inset = 0.8;           // فاصله از لبه بیرونی درب
        const z = -doorT / 2 + s / 2 + 0.02; // پشت درب، رو به بدنه
        const innerW = Math.max(2, dw - 2 * inset);
        const innerH = Math.max(2, dh - 2 * inset);
        // افقی: فقط بین دو نوار عمودی
        const top = new THREE.Mesh(new THREE.BoxGeometry(innerW, s, s), sealMat);
        top.position.set(0, dh / 2 - inset - s / 2, z);
        parent.add(top);
        const bot = new THREE.Mesh(new THREE.BoxGeometry(innerW, s, s), sealMat);
        bot.position.set(0, -dh / 2 + inset + s / 2, z);
        parent.add(bot);
        // عمودی: فقط بین دو نوار افقی (بدون تداخل گوشه)
        const sideH = Math.max(1, innerH - 2 * s);
        const left = new THREE.Mesh(new THREE.BoxGeometry(s, sideH, s), sealMat);
        left.position.set(-dw / 2 + inset + s / 2, 0, z);
        parent.add(left);
        const right = new THREE.Mesh(new THREE.BoxGeometry(s, sideH, s), sealMat);
        right.position.set(dw / 2 - inset - s / 2, 0, z);
        parent.add(right);
    };

    const addHandle = (x, y, len, vertical) => {
        const rad = 0.7;
        const bar = new THREE.Mesh(
            vertical ? new THREE.CylinderGeometry(rad, rad, len, 12)
                     : new THREE.CylinderGeometry(rad, rad, len, 12),
            handleMat
        );
        if (!vertical) bar.rotation.z = Math.PI / 2;
        bar.position.set(x, y, doorZ + doorT / 2 + 1.0);
        g.add(bar);
        const pegLen = 1.6;
        const offs = vertical ? [len / 2 - 1.8, -len / 2 + 1.8] : [len / 2 - 1.8, -len / 2 + 1.8];
        offs.forEach(o => {
            const peg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, pegLen), handleMat);
            if (vertical) peg.position.set(x, y + o, doorZ + doorT / 2 + 0.35);
            else peg.position.set(x + o, y, doorZ + doorT / 2 + 0.35);
            g.add(peg);
        });
    };

    if (doorCount === 2) {
        // Side-by-Side: فریزر | یخچال
        const doorW = (W - gapDoors) / 2 - 0.4;
        const doorH = H - 4;
        [-1, 1].forEach((side) => {
            const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorT), doorMat);
            door.position.set(side * (doorW / 2 + gapDoors / 2), 0, doorZ);
            door.castShadow = true;
            door.receiveShadow = true;
            g.add(door);
            addSeal(door, doorW, doorH);
            // پنل مشکی باریک وسط لبه داخلی
            const innerEdge = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, doorH * 0.92, 0.2),
                m.black
            );
            innerEdge.position.set(-side * (doorW / 2 - 0.4), 0, doorT / 2 + 0.08);
            door.add(innerEdge);
            // دستگیره عمودی نزدیک وسط
            addHandle(side * (gapDoors / 2 + 3.5), 0, doorH * 0.38, true);
        });
        // خط اتصال وسط
        const midGap = new THREE.Mesh(
            new THREE.BoxGeometry(gapDoors * 0.7, H - 5, doorT * 0.9),
            m.black
        );
        midGap.position.set(0, 0, doorZ);
        g.add(midGap);
    } else {
        // فریزر بالا + یخچال پایین
        const gapH = 1.8;
        const topH = H * 0.30 - gapH / 2;
        const botH = H * 0.70 - gapH / 2;
        const topY = H / 2 - topH / 2 - 1.2;
        const botY = -H / 2 + botH / 2 + 1.2;
        const doorW = W - 2.2;

        const topDoor = new THREE.Mesh(new THREE.BoxGeometry(doorW, topH, doorT), doorMat);
        topDoor.position.set(0, topY, doorZ);
        topDoor.castShadow = true;
        g.add(topDoor);
        addSeal(topDoor, doorW, topH);

        const botDoor = new THREE.Mesh(new THREE.BoxGeometry(doorW, botH, doorT), doorMat);
        botDoor.position.set(0, botY, doorZ);
        botDoor.castShadow = true;
        g.add(botDoor);
        addSeal(botDoor, doorW, botH);

        // شکاف افقی بین درب‌ها
        const hGap = new THREE.Mesh(new THREE.BoxGeometry(doorW - 1, gapH * 0.7, doorT * 0.85), m.black);
        hGap.position.set(0, (topY - topH / 2 + botY + botH / 2) / 2, doorZ);
        g.add(hGap);

        addHandle(-W / 2 + 8, topY, topH * 0.42, true);
        addHandle(-W / 2 + 8, botY + botH * 0.12, botH * 0.28, true);

        // نمایشگر کوچک روی درب بالا (اختیاری)
        const disp = new THREE.Mesh(
            new THREE.BoxGeometry(W * 0.18, topH * 0.22, 0.25),
            m.black
        );
        disp.position.set(W * 0.22, topY, doorZ + doorT / 2 + 0.12);
        g.add(disp);
    }

    return g;
},

buildWashingMachineAppliance: function(c) {
    // لباسشویی واقعی: پنل کنترل، ولوم، درب دایره‌ای، شیشه، لاستیک، دیگ
    const W = Math.max(45, c.w || 60);
    const H = Math.max(70, c.h || 85);
    const D = Math.max(45, c.d || 60);
    const m = this._applianceMats();
    const g = new THREE.Group();
    g.name = 'washingMachine';

    // بدنه با گوشه نرم‌تر (باکس اصلی + پخ بصری با پنل جلو)
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D - 1.5), m.white);
    body.position.set(0, 0, -0.6);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    const frontZ = D / 2;
    const panelH = Math.min(14, H * 0.16);
    const panelY = H / 2 - panelH / 2;

    // پنل کنترل recessed
    const panelRecess = new THREE.Mesh(
        new THREE.BoxGeometry(W - 3, panelH - 1.5, 1.2),
        m.black
    );
    panelRecess.position.set(0, panelY, frontZ - 0.2);
    g.add(panelRecess);

    const panelFace = new THREE.Mesh(
        new THREE.BoxGeometry(W - 4, panelH - 2.5, 0.4),
        m.blackSteel || m.black
    );
    panelFace.position.set(0, panelY, frontZ + 0.5);
    g.add(panelFace);

    // نمایشگر
    const display = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.28, panelH * 0.45, 0.25),
        new THREE.MeshStandardMaterial({
            color: 0x0a1a12,
            emissive: 0x113322,
            emissiveIntensity: 0.35,
            roughness: 0.4,
            metalness: 0.1
        })
    );
    display.position.set(-W * 0.22, panelY, frontZ + 0.7);
    g.add(display);

    // ولوم / Dial واقعی
    const dialBase = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 1.2, 24), m.chrome);
    dialBase.rotation.x = Math.PI / 2;
    dialBase.position.set(W * 0.28, panelY, frontZ + 0.9);
    g.add(dialBase);
    const dialKnob = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 1.6, 20), m.black);
    dialKnob.rotation.x = Math.PI / 2;
    dialKnob.position.set(W * 0.28, panelY, frontZ + 1.7);
    g.add(dialKnob);
    // نشانگر ولوم
    const dialMark = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.3), m.chrome);
    dialMark.position.set(W * 0.28, panelY + 1.0, frontZ + 2.2);
    g.add(dialMark);

    // دکمه‌های کوچک
    for (let i = 0; i < 4; i++) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 12), m.chrome);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(-W * 0.02 + i * 2.8, panelY - panelH * 0.22, frontZ + 0.85);
        g.add(btn);
    }

    // --- درب دایره‌ای ---
    const doorR = Math.min(W, H - panelH) * 0.34;
    const doorCy = -panelH * 0.15;
    const doorZ = frontZ + 0.4;

    // قاب درب (ring)
    const frame = new THREE.Mesh(
        new THREE.TorusGeometry(doorR, 1.6, 12, 40),
        m.chrome
    );
    frame.position.set(0, doorCy, doorZ + 0.5);
    g.add(frame);

    // لاستیک مشکی دور درب
    const seal = new THREE.Mesh(
        new THREE.TorusGeometry(doorR - 0.4, 0.7, 8, 36),
        m.rubber
    );
    seal.position.set(0, doorCy, doorZ + 0.15);
    g.add(seal);

    // شیشه تیره
    const glassMat = m.glass || new THREE.MeshStandardMaterial({
        color: 0x0a0a14, metalness: 0.85, roughness: 0.08, transparent: true, opacity: 0.82
    });
    const glass = new THREE.Mesh(new THREE.CircleGeometry(doorR - 1.8, 40), glassMat);
    glass.position.set(0, doorCy, doorZ + 0.55);
    g.add(glass);

    // فضای داخلی / دیگ (استوانه تیره پشت شیشه)
    const drum = new THREE.Mesh(
        new THREE.CylinderGeometry(doorR - 3.2, doorR - 3.2, 8, 28, 1, true),
        m.steelDark
    );
    drum.rotation.x = Math.PI / 2;
    drum.position.set(0, doorCy, doorZ - 3);
    g.add(drum);

    // الگوی سوراخ دیگ (کم برای Performance)
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const hole = new THREE.Mesh(
            new THREE.CircleGeometry(0.7, 8),
            m.black
        );
        hole.position.set(
            Math.cos(a) * (doorR * 0.35),
            doorCy + Math.sin(a) * (doorR * 0.35),
            doorZ + 0.58
        );
        g.add(hole);
    }

    // دستگیره درب
    const dHandle = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.45, 8, 20, Math.PI), m.chrome);
    dHandle.rotation.z = -Math.PI / 2;
    dHandle.position.set(doorR * 0.55, doorCy, doorZ + 1.2);
    g.add(dHandle);

    // پایه جلو
    const kick = new THREE.Mesh(new THREE.BoxGeometry(W - 2, 6, 2), m.steelDark);
    kick.position.set(0, -H / 2 + 3, frontZ - 4);
    g.add(kick);

    return g;
},

buildDishwasherAppliance: function(c) {
    // ظرفشویی: شکاف واقعی، پنل recessed، بدون EdgesGeometry
    const W = Math.max(45, c.w || 60);
    const H = Math.max(70, c.h || 85);
    const D = Math.max(45, c.d || 60);
    const m = this._applianceMats();
    const g = new THREE.Group();
    g.name = 'dishwasher';

    const frontZ = D / 2;
    const doorT = 3.2;
    const panelH = Math.min(12, H * 0.14);
    const doorH = H - panelH - 2.5;
    const gap = 1.2;

    // بدنه
    const body = new THREE.Mesh(new THREE.BoxGeometry(W - 0.5, H - 1, D - doorT), m.steel);
    body.position.set(0, 0, -doorT * 0.35);
    body.castShadow = true;
    body.receiveShadow = true;
    g.add(body);

    // پنل کنترل بالا (recessed)
    const panelY = H / 2 - panelH / 2 - 0.5;
    const panelBack = new THREE.Mesh(
        new THREE.BoxGeometry(W - 2.5, panelH - 1, 1.4),
        m.black
    );
    panelBack.position.set(0, panelY, frontZ - 0.5);
    g.add(panelBack);

    const panelFace = new THREE.Mesh(
        new THREE.BoxGeometry(W - 3.5, panelH - 2.2, 0.35),
        m.blackSteel || m.black
    );
    panelFace.position.set(0, panelY, frontZ + 0.35);
    g.add(panelFace);

    // نمایشگر
    const disp = new THREE.Mesh(
        new THREE.BoxGeometry(W * 0.22, panelH * 0.4, 0.2),
        new THREE.MeshStandardMaterial({
            color: 0x001a00, emissive: 0x003311, emissiveIntensity: 0.3, roughness: 0.4
        })
    );
    disp.position.set(W * 0.25, panelY, frontZ + 0.55);
    g.add(disp);

    // دکمه‌ها
    for (let i = 0; i < 5; i++) {
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.4, 10), m.chrome);
        btn.rotation.x = Math.PI / 2;
        btn.position.set(-W * 0.32 + i * 2.6, panelY, frontZ + 0.6);
        g.add(btn);
    }

    // شکاف واقعی بین پنل و درب
    const seam = new THREE.Mesh(
        new THREE.BoxGeometry(W - 2, gap * 0.65, doorT * 0.7),
        m.black
    );
    seam.position.set(0, panelY - panelH / 2 - gap / 2, frontZ - 0.5);
    g.add(seam);

    // درب اصلی با bevel بصری (لبه تیره‌تر)
    const doorY = -H / 2 + doorH / 2 + 1;
    const door = new THREE.Mesh(new THREE.BoxGeometry(W - 1.2, doorH, doorT), m.steel);
    door.position.set(0, doorY, frontZ - doorT / 2 + 0.2);
    door.castShadow = true;
    door.receiveShadow = true;
    g.add(door);

    // لبه bevel (roughness کمی متفاوت)
    const edgeMat = m.steelDark;
    const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(W - 2, 0.5, 0.25), edgeMat);
    edgeTop.position.set(0, doorH / 2 - 0.3, doorT / 2 + 0.05);
    door.add(edgeTop);
    const edgeBot = edgeTop.clone();
    edgeBot.position.y = -doorH / 2 + 0.3;
    door.add(edgeBot);

    // دستگیره افقی واقعی
    const hLen = W * 0.5;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, hLen, 12), m.chrome);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, doorY + doorH * 0.35, frontZ + 0.9);
    g.add(handle);
    [-hLen / 2 + 2, hLen / 2 - 2].forEach(ox => {
        const peg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.5), m.chrome);
        peg.position.set(ox, handle.position.y, frontZ + 0.25);
        g.add(peg);
    });

    // درز پایین / kick
    const kick = new THREE.Mesh(new THREE.BoxGeometry(W - 2, 7, 2), m.steelDark);
    kick.position.set(0, -H / 2 + 3.5, frontZ - 3);
    g.add(kick);

    // سایه زیر پنل
    const underPanelShadow = new THREE.Mesh(
        new THREE.BoxGeometry(W - 3, 0.4, 1.5),
        m.black
    );
    underPanelShadow.position.set(0, panelY - panelH / 2 - 0.3, frontZ - 1);
    g.add(underPanelShadow);

    return g;
},

buildHoodAppliance: function(c) {
    // هود واقعی: کانوپی، فیلتر، دودکش ضخیم، LED، استیل
    // isHoodWrap جدا می‌ماند — فقط خود هود
    const W = Math.max(50, c.w || 90);
    const H = Math.max(30, c.h || 45);
    const D = Math.max(35, c.d || 50);
    const m = this._applianceMats();
    const g = new THREE.Group();
    g.name = 'hoodAppliance';

    const canopyH = Math.min(14, Math.max(8, H * 0.28));
    const chimH = Math.max(10, H - canopyH);
    const chimW = W * 0.42;
    const chimD = D * 0.40;

    // --- کانوپی (بدنه اصلی) با لبه نرم‌تر ---
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(W, canopyH, D), m.steel);
    canopy.position.set(0, -H / 2 + canopyH / 2, 0);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    g.add(canopy);

    // لبه پایین کانوپی (ضخیم‌تر)
    const lip = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 1.2, D + 0.6), m.steelDark);
    lip.position.set(0, -H / 2 + 0.6, 0);
    g.add(lip);

    // ناحیه فیلتر
    const filterW = W * 0.78;
    const filterD = D * 0.62;
    const filterFrame = new THREE.Mesh(
        new THREE.BoxGeometry(filterW + 1.2, 0.8, filterD + 1.2),
        m.steelDark
    );
    filterFrame.position.set(0, -H / 2 + 1.4, D * 0.06);
    g.add(filterFrame);

    // فیلتر فلزی (roughness بالاتر)
    const filterMat = m.steelDark;
    const nFilters = 2;
    for (let i = 0; i < nFilters; i++) {
        const fw = (filterW - 1) / nFilters - 0.6;
        const filter = new THREE.Mesh(
            new THREE.BoxGeometry(fw, 0.35, filterD - 0.8),
            filterMat
        );
        filter.position.set(
            -filterW / 2 + fw / 2 + 0.5 + i * (fw + 0.8),
            -H / 2 + 1.5,
            D * 0.06
        );
        g.add(filter);
        // خطوط فیلتر
        for (let k = 0; k < 4; k++) {
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(fw * 0.9, 0.08, 0.15),
                m.black
            );
            line.position.set(
                filter.position.x,
                -H / 2 + 1.75,
                filter.position.z - filterD * 0.3 + k * (filterD * 0.2)
            );
            g.add(line);
        }
    }

    // LED زیر هود
    const ledMat = new THREE.MeshStandardMaterial({
        color: 0xfff5e6,
        emissive: 0xffe8c0,
        emissiveIntensity: 0.85,
        roughness: 0.4,
        metalness: 0.1
    });
    [-0.28, 0.28].forEach(px => {
        const led = new THREE.Mesh(new THREE.BoxGeometry(W * 0.18, 0.35, 1.2), ledMat);
        led.position.set(px * W, -H / 2 + 0.4, D / 2 - 3);
        g.add(led);
    });

    // پنل کنترل کوچک زیر جلو
    const ctrl = new THREE.Mesh(new THREE.BoxGeometry(W * 0.22, 0.5, 2.5), m.black);
    ctrl.position.set(0, -H / 2 + 0.5, D / 2 - 5);
    g.add(ctrl);
    for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 10), m.chrome);
        b.rotation.x = Math.PI / 2;
        b.position.set(-2.2 + i * 2.2, -H / 2 + 0.55, D / 2 - 4.2);
        g.add(b);
    }

    // --- دودکش با ضخامت واقعی ---
    const chimZ = -D * 0.12;
    // جدار بیرونی
    const chimOuter = new THREE.Mesh(new THREE.BoxGeometry(chimW, chimH, chimD), m.steel);
    chimOuter.position.set(0, -H / 2 + canopyH + chimH / 2, chimZ);
    chimOuter.castShadow = true;
    g.add(chimOuter);

    // جدار داخلی کمی کوچک‌تر (حس ضخامت)
    const chimInner = new THREE.Mesh(
        new THREE.BoxGeometry(chimW - 1.6, chimH - 1, chimD - 1.6),
        m.steelDark
    );
    chimInner.position.copy(chimOuter.position);
    chimInner.position.y += 0.3;
    g.add(chimInner);

    // نوار اتصال دودکش به کانوپی
    const band = new THREE.Mesh(
        new THREE.BoxGeometry(chimW + 1.4, 1.8, chimD + 1.4),
        m.steelDark
    );
    band.position.set(0, -H / 2 + canopyH + 0.9, chimZ);
    g.add(band);

    // درزهای عمودی دودکش
    const seamL = new THREE.Mesh(new THREE.BoxGeometry(0.2, chimH * 0.9, 0.2), m.black);
    seamL.position.set(-chimW / 2 + 0.3, chimOuter.position.y, chimZ + chimD / 2);
    g.add(seamL);
    const seamR = seamL.clone();
    seamR.position.x = chimW / 2 - 0.3;
    g.add(seamR);

    return g;
},

buildStoveAppliance: function(c) {
    const W = c.w || 60, H = Math.max(c.h || 4, 4), D = c.d || 55;
    const m = this._applianceMats();
    const g = new THREE.Group();

    // صفحه اجاق
    const top = new THREE.Mesh(new THREE.BoxGeometry(W, 2, D), m.black);
    top.position.y = H / 2 - 1;
    g.add(top);

    // شعله‌ها (۴ شعله)
    const positions = [
        [-0.28, -0.25], [0.28, -0.25],
        [-0.28, 0.25], [0.28, 0.25]
    ];
    positions.forEach(([px, pz]) => {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.08, W * 0.09, 1.2, 20), m.steelDark);
        base.position.set(px * W, H / 2 + 0.2, pz * D);
        g.add(base);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.05, W * 0.05, 0.4, 16), m.black);
        cap.position.set(px * W, H / 2 + 0.9, pz * D);
        g.add(cap);
        // شبکه
        for (let a = 0; a < 4; a++) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.14, 0.3, 0.5), m.steelDark);
            bar.position.set(px * W, H / 2 + 1.3, pz * D);
            bar.rotation.y = (a / 4) * Math.PI;
            g.add(bar);
        }
    });

    // دسته‌های جلو
    for (let i = 0; i < 4; i++) {
        const kn = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.5, 12), m.chrome);
        kn.rotation.x = Math.PI / 2;
        kn.position.set(-W * 0.3 + i * (W * 0.2), H / 2 - 0.5, D / 2 + 0.5);
        g.add(kn);
    }

    return g;
},

buildGenericAppliance: function(c) {
    const W = c.w || 60, H = c.h || 85, D = c.d || 60;
    const m = this._applianceMats();
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), m.steel);
    g.add(body);
    const front = new THREE.Mesh(new THREE.BoxGeometry(W - 2, H - 4, 1), m.steelDark);
    front.position.set(0, 0, D / 2 + 0.3);
    g.add(front);
    return g;
},

/** فر داخل یونیت فر کمدی — درب شیشه‌ای و پنل کنترل */
addOvenIntoCabinet: function(group, c) {
    if (!group || !c || !c.isOvenCabinet) return;
    const W = c.w || 60;
    const H = c.h || 70;
    const D = c.d || 55;
    // فر در ارتفاع استاندارد حدود ۷۰–۹۰ از کف یونیت
    const ovenH = Math.min(60, H * 0.35);
    const ovenY = -H / 2 + 14 + ovenH / 2 + 10; // بالای پاخور
    const ovenC = { w: W - 4, h: ovenH, d: D - 8, label: 'فر' };
    const oven = this.buildOvenAppliance(ovenC);
    oven.position.set(0, ovenY, D * 0.05);
    oven.userData.isOvenInsert = true;
    group.add(oven);
},


        renderCabinets: function(onlyId) {
          // onlyId: اگر داده شود فقط همان یونیت ساخته می‌شود (بازسازی جزئی)
          if (onlyId == null) {
              this.renderClosetFrameUnit();
          }
        if (!cabinets || cabinets.length === 0) return;

        const list = (onlyId != null)
            ? cabinets.filter(function(c) { return c && c.id === onlyId; })
            : cabinets;
        if (!list.length) return;

        list.forEach(c => {
            const group = new THREE.Group();

           // ۱. تنظیمات متریال بدنه (داخل یونیت کمی تاریک‌تر از بیرون)
const bodyMat = (typeof this.createInteriorMaterials === 'function')
    ? this.createInteriorMaterials().bodyMat
    : new THREE.MeshStandardMaterial({ 
        color: 0xe8e6e3, 
        roughness: 0.62,
        metalness: 0.0
    });



            const initialColor = c.doorColor || "#8B4513";
            const isTexture = initialColor.includes('http') || initialColor.includes('assets/');
            // ۲. تنظیمات متریال درب
const _finishKey = c.doorFinish || 'matte';
const _fp = (typeof window.getKitchenFinishPreset === 'function')
    ? window.getKitchenFinishPreset(_finishKey)
    : { roughness: 0.7, metalness: 0.02, envMapIntensity: 0.3 };
const doorMat = new THREE.MeshStandardMaterial({ 
    color: isTexture ? 0xffffff : parseInt(initialColor.replace('#', '').substring(0, 6), 16), 
    roughness: _fp.roughness,
    metalness: _fp.metalness,
    envMapIntensity: _fp.envMapIntensity || 0.3
});


            const thickness = 1.6; // ضخامت ورق ۱۶ میل

            // ==========================================================
            // 30 — لوازم آشپزخانه (مدل جدا از کابینت)
            // ==========================================================
            if (c.isAppliance) {
                this.createApplianceSystem(group, c);
            }
              else if (c.isFridgeWrap) {
    // 🌟 تابع ارتقا یافته و امن، متصل به کراپ‌های HD کات‌مستر بر اساس ID کابینت و نام قطعه
    // پرداخت سطح جدا از جنس ورق: matte / semiMatte / satin / highGloss
    const createWrapMaterial = (val, fallback, pieceLabel, finishKey) => {
        const finalVal = val || fallback;
        const fk = finishKey || 'matte';
        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(fk)
            : { roughness: 0.7, metalness: 0.02, envMapIntensity: 0.3, bumpScale: 0.08, clearcoat: 0 };

        let frontMap = null;
        let frontColor = null;

        // ۱. اولویت اول: تکسچر کات‌مستر
        if (pieceLabel && window.isolatedDoorTextures && window.isolatedDoorTextures[pieceLabel]) {
            const texLoader = new THREE.TextureLoader();
            const tex = texLoader.load(window.isolatedDoorTextures[pieceLabel]);
            tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.repeat.set(1, 1);
            tex.colorSpace = THREE.SRGBColorSpace;
            frontMap = tex;
        } else if (finalVal && (String(finalVal).includes('http') || String(finalVal).includes('assets/') || String(finalVal).includes('/') || String(finalVal).includes('.'))) {
            const tex = new THREE.TextureLoader().load(finalVal);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(1, 1);
            tex.colorSpace = THREE.SRGBColorSpace;
            frontMap = tex;
        } else if (finalVal) {
            frontColor = finalVal;
        }

        if (typeof this.createFaceMaterials === 'function') {
            const faces = this.createFaceMaterials({
                frontMap: frontMap,
                frontColor: frontColor || '#FFFFFF',
                edgeColor: (frontColor && String(frontColor).startsWith('#')) ? frontColor : '#D4CFC4',
                finishType: fk,
                materialType: fk
            });
            return faces.boxArray;
        }

        const params = {
            roughness: preset.roughness,
            metalness: preset.metalness,
            envMapIntensity: preset.envMapIntensity || 0.3
        };
        if (frontMap) {
            params.map = frontMap;
            params.color = 0xffffff;
            if (preset.bumpScale) { params.bumpMap = (typeof window.asDataMapTexture === 'function') ? window.asDataMapTexture(frontMap) : frontMap; params.bumpScale = preset.bumpScale; }
        } else if (frontColor) {
            try {
                const cleanColor = String(frontColor).replace('#', '');
                params.color = parseInt(cleanColor, 16);
            } catch (e) {
                params.color = 0xffffff;
            }
        }
        if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
            params.clearcoat = preset.clearcoat;
            params.clearcoatRoughness = preset.clearcoatRoughness || 0.05;
            return new THREE.MeshPhysicalMaterial(params);
        }
        return new THREE.MeshStandardMaterial(params);
    };

    const fEnabled = c.frameEnabled || false;
    const fProt = parseFloat(c.frameProtrusion) || 5; 
    const fDepth = parseFloat(c.frameDepth) || 1.6;  

    const frameOverlap = 5; 
    const totalFrameZ = fProt + frameOverlap; 

    const defaultMatValue = c.bodyColor || "#FFFFFF"; // فالبک سفید یخچالی
    
    // 🟢 اصلاح طلایی: پیدا کردن ID کابینت برای انطباق ۱۰۰٪ با لیبل کات‌مستر
    const uId = c.id || c.uId || ""; // شناسه کابینت که ممکن است در متغیر id یا uId باشد.

    // 🌟 ساخت لیبل‌های دقیقاً هم‌نام با خروجی collectPieces (دیواره قدی چپ یخچال U1)
    const leftPieceLabel = `دیواره قدی چپ یخچال U${uId}`;
    const rightPieceLabel = `دیواره قدی راست یخچال U${uId}`;
    
    // پرداخت سطح هر بخش
    const leftFinish = c.leftFinish || 'matte';
    const rightFinish = c.rightFinish || 'matte';
    const frameFinish = c.frameFinish || 'matte';
    const bridgeFinish = c.bridgeFinish || c.doorFinish || 'matte';

    // ارسال لیبل‌ها + پرداخت به تابع متریال‌ساز
    // مثل نسخه قبلی کلاف — متریال دیواره‌ها و پل
    const leftMat = createWrapMaterial(c.leftMaterialValue, defaultMatValue, leftPieceLabel, leftFinish);
    const rightMat = createWrapMaterial(c.rightMaterialValue, defaultMatValue, rightPieceLabel, rightFinish);
    const bridgeMat = createWrapMaterial(c.bridgeMaterialValue, defaultMatValue, `درب بالای یخچال U${uId}`, bridgeFinish);
    // قاب بیرون‌زدگی: همه وجه‌ها همان رنگ/تکسچر (نه فقط روبرو)
    const frameMatRaw = createWrapMaterial(c.frameMaterialValue, c.frameMaterialValue || "#888888", null, frameFinish);
    const frameMat = (function (mat) {
        if (Array.isArray(mat) && mat.length >= 5) {
            const f = mat[4];
            return [f, f, f, f, f, f];
        }
        return mat;
    })(frameMatRaw); 
    
    // 🟢 متریال داخل یونیت هوایی — کمی تاریک‌تر برای حس عمق
    const internalBodyColor = c.bodyColor || "#E8E6E3";
    const internalBodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(internalBodyColor),
        roughness: 0.62,
        metalness: 0.0
    });

    const totalWidth = c.w;
    const leftH  = c.leftH  || c.h; 
    const rightH = c.rightH || c.h; 
    const leftD  = c.leftD  || c.d;
    const rightD = c.rightD || c.d;

    const topBoxHeight = c.bridgeH || 40;
    const bridgeBottomY = c.bridgeY !== undefined ? parseFloat(c.bridgeY) : (c.h - topBoxHeight);
    const frameWallHeight = (c.hasBridge !== false) ? bridgeBottomY : c.h;

    // رسم دیواره چپ
    if (c.hasLeft !== false) {
        const geoL = new THREE.BoxGeometry(thickness, leftH, leftD);
        const leftPanel = new THREE.Mesh(geoL, leftMat);
        leftPanel.position.set(-totalWidth / 2 + thickness / 2, -c.h / 2 + leftH / 2, 0);
        group.add(leftPanel);

        if (fEnabled) {
            const frameGeo = new THREE.BoxGeometry(fDepth, frameWallHeight, totalFrameZ);
            const frameMesh = new THREE.Mesh(frameGeo, frameMat);
            const frameYPos = (-leftH / 2) + (frameWallHeight / 2);
            const frameZPos = leftD / 2 + (fProt - frameOverlap) / 2;
            frameMesh.position.set(thickness / 2 + fDepth / 2, frameYPos, frameZPos);
            leftPanel.add(frameMesh);
        }
    }

    // رسم دیواره راست
    if (c.hasRight !== false) {
        const geoR = new THREE.BoxGeometry(thickness, rightH, rightD);
        const rightPanel = new THREE.Mesh(geoR, rightMat);
        rightPanel.position.set(totalWidth / 2 - thickness / 2, -c.h / 2 + rightH / 2, 0);
        group.add(rightPanel);

        if (fEnabled) {
            const frameGeo = new THREE.BoxGeometry(fDepth, frameWallHeight, totalFrameZ);
            const frameMesh = new THREE.Mesh(frameGeo, frameMat);
            const frameYPos = (-rightH / 2) + (frameWallHeight / 2);
            const frameZPos = rightD / 2 + (fProt - frameOverlap) / 2;
            frameMesh.position.set(-thickness / 2 - fDepth / 2, frameYPos, frameZPos);
            rightPanel.add(frameMesh);
        }
    }
    // رسم یونیت باکس هوایی بالای یخچال
    if (c.hasBridge !== false) {
        const topBoxW = c.w - (2 * thickness);
        
        // --- اصلاح عمق و موقعیت برای هم‌باد شدن درب‌ها با دیواره‌ها ---
        const topBoxD = c.bridgeD ? parseFloat(c.bridgeD) : (c.d - thickness);
        // محاسبه شیفت Z
        const topBoxZShift = ((c.d - topBoxD) / 2) - thickness;
        
        const topBoxGroup = new THREE.Group();
        
        // --- ابعاد جدید بدنه یونیت ---
        const backThick = 0.3; // ضخامت ۳ میل پشت
        const bodyDepth = topBoxD - backThick; 
        const innerH = topBoxHeight - (2 * thickness); 

        // تنظیم مرکز ثقل Z برای جا باز کردن ۳ میل در پشت
        const bodyZPos = backThick / 2;
        const backZPos = -topBoxD / 2 + backThick / 2;

        const parts = [
            // سقف و کف و دیواره‌ها 
            { geo: [topBoxW, thickness, bodyDepth], pos: [0, topBoxHeight / 2 - thickness / 2, bodyZPos] },
            { geo: [topBoxW, thickness, bodyDepth], pos: [0, -topBoxHeight / 2 + thickness / 2, bodyZPos] },
            { geo: [topBoxW, topBoxHeight, backThick], pos: [0, 0, backZPos] },
            { geo: [thickness, innerH, bodyDepth], pos: [-topBoxW / 2 + thickness / 2, 0, bodyZPos] },
            { geo: [thickness, innerH, bodyDepth], pos: [topBoxW / 2 - thickness / 2, 0, bodyZPos] }
        ];

        parts.forEach(p => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(...p.geo), internalBodyMat);
            m.position.set(...p.pos);
            topBoxGroup.add(m);
        });

        // --- 🟢 اصلاح طبقات پیش‌فرض عددی (shelfCount) ---
        const bridgeShelfCount = parseInt(c.shelfCount) || 0;
        if (bridgeShelfCount > 0) {
            const shelfW = topBoxW - (2 * thickness);
            const setback = 2; 
            const shelfD = bodyDepth - setback;
            const spacing = innerH / (bridgeShelfCount + 1);

            for (let i = 1; i <= bridgeShelfCount; i++) {
                const shelfY = (-innerH / 2) + (i * spacing);
                const shelfZ = bodyZPos - setback / 2;
                const shelfMesh = new THREE.Mesh(new THREE.BoxGeometry(shelfW, thickness, shelfD), internalBodyMat);
                shelfMesh.position.set(0, shelfY, shelfZ);
                topBoxGroup.add(shelfMesh); 
            }
            // حذف شد: c.shelfCount = 0; دیگه دیتای کلی رو دستکاری نمی‌کنیم
        }

        // --- 🟢 اتصال فوق هوشمند به تابع سفارشی createShelves برای یونیت هوایی ---
        if (c.shelves && c.shelves.length > 0) {
            // ساخت یک شیء کپی و مجزا صرفاً با ابعاد باکس هوایی جهت فریب دادن مهندسی تابع createShelves
            const bridgeVirtualData = {
                ...c,
                w: topBoxW,
                h: topBoxHeight,
                d: topBoxD,
                bodyColor: internalBodyColor
            };
            // فراخوانی متد برای اضافه شدن طبقات سفارشی دقیقاً داخل گروپِ باکس هوایی
            this.createShelves(topBoxGroup, bridgeVirtualData);
        }

        if (fEnabled) {
            const frameGeo = new THREE.BoxGeometry(topBoxW, fDepth, totalFrameZ);
            const frameMesh = new THREE.Mesh(frameGeo, frameMat);
            const frameZPos = (c.d / 2) + (fProt - frameOverlap) / 2 - topBoxZShift;
            
            frameMesh.position.set(0, -topBoxHeight / 2 - fDepth / 2, frameZPos);
            topBoxGroup.add(frameMesh);
        }

        const topCabData = { ...c, w: topBoxW, h: topBoxHeight, d: topBoxD, doors: c.doors || 2 };
        this.createDoorSystem(topBoxGroup, topCabData, bridgeMat); 
        
        // اعمال topBoxZShift برای اینکه کل یونیت به عقب برود
        topBoxGroup.position.set(0, -c.h / 2 + (c.bridgeY || (c.h - topBoxHeight)) + topBoxHeight / 2, topBoxZShift);
        group.add(topBoxGroup);
    }

}

         
else if (c.isFacadeBox) {
    const fbGroup = new THREE.Group();
    const p = c.panels || {}; 

    const tL = p.left ? (p.left.t || 1.6) : 1.6;
    const tR = p.right ? (p.right.t || 1.6) : 1.6;
    const tF = p.front ? (p.front.t || 1.6) : 1.6;
    const tB = p.back ? (p.back.t || 1.6) : 1.6;

    const pFrontW = p.front && p.front.w ? p.front.w : 0;
    const pBackW = p.back && p.back.w ? p.back.w : 0;
    const innerW = Math.max(pFrontW, pBackW);
    const boxW = innerW > 0 ? (innerW + tL + tR) : c.w; 

    const pLeftD = p.left && p.left.w ? p.left.w : 0;
    const pRightD = p.right && p.right.w ? p.right.w : 0;
    const boxD = Math.max(pLeftD, pRightD) > 0 ? Math.max(pLeftD, pRightD) : c.d; 

    const hL = (p.left && p.left.h) ? p.left.h : c.h;
    const hR = (p.right && p.right.h) ? p.right.h : c.h;
    const hB = (p.back && p.back.h) ? p.back.h : c.h;
    const hF = (p.front && p.front.h) ? p.front.h : c.h;
    const boxH = Math.max(hL, hR, hB, hF) > 0 ? Math.max(hL, hR, hB, hF) : c.h; 

    const yL = (hL - boxH) / 2;
    const yR = (hR - boxH) / 2;
    const yB = (hB - boxH) / 2;
    const yF = (hF - boxH) / 2;

    const lineMat = new THREE.LineBasicMaterial({ color: 0x555555 });
    
    // تابع پویای اصلاح‌شده جهت بررسی دقیق کشیدگی تکسچر روی دیواره‌های Extrude
    function getSceneDynamicMaterial(panelOrItemData, pieceLabel = '', defaultColor = '#FFFFFF') {
        const isThermo = pieceLabel && String(pieceLabel).includes('ترمووال');
        const finishKey = (panelOrItemData && panelOrItemData.finish)
            ? panelOrItemData.finish
            : (isThermo ? 'satin' : 'matte');
        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(finishKey)
            : { roughness: isThermo ? 0.48 : 0.6, metalness: isThermo ? 0.08 : 0.1, envMapIntensity: isThermo ? 0.85 : 0.5, bumpScale: isThermo ? 0.18 : 0, clearcoat: 0 };
        const rough = preset.roughness;
        const metal = preset.metalness;
        const envI = preset.envMapIntensity != null ? preset.envMapIntensity : (isThermo ? 0.85 : 0.5);
        const bump = isThermo ? Math.max(preset.bumpScale || 0, 0.18) : (preset.bumpScale || 0);
        const cc = (preset.clearcoat && preset.clearcoat > 0.05) ? preset.clearcoat : 0;

        // Shared Materials: رنگ/تکسچر + finish یکسان → یک Material
        let mapUrl = '';
        if (pieceLabel && window.isolatedDoorTextures) {
            const cleanLabel = pieceLabel.replace('📌', '').trim();
            if (window.isolatedDoorTextures[cleanLabel]) {
                mapUrl = window.isolatedDoorTextures[cleanLabel];
            }
        }
        if (!mapUrl && panelOrItemData && panelOrItemData.texture) {
            mapUrl = panelOrItemData.texture;
        }
        let colorStr = panelOrItemData?.color || panelOrItemData?.code;
        if (!colorStr || colorStr === 'null' || colorStr === '') colorStr = defaultColor;

        if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.buildSharedSurfaceMaterial === 'function') {
            return Kitchen3D.buildSharedSurfaceMaterial({
                finish: finishKey,
                mapUrl: mapUrl || '',
                color: mapUrl ? '' : colorStr,
                roughness: rough,
                metalness: metal,
                envMapIntensity: envI,
                bumpScale: bump,
                clearcoat: cc,
                clearcoatRoughness: preset.clearcoatRoughness || 0.05
            });
        }

        // fallback اگر Kitchen3D آماده نباشد
        const makeMat = (params) => {
            if (cc > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
                params.clearcoat = cc;
                params.clearcoatRoughness = preset.clearcoatRoughness || 0.05;
                return new THREE.MeshPhysicalMaterial(params);
            }
            return new THREE.MeshStandardMaterial(params);
        };
        if (mapUrl) {
            const texture = new THREE.TextureLoader().load(mapUrl);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            return makeMat({
                map: texture,
                bumpMap: bump > 0 ? texture : null,
                bumpScale: bump,
                roughness: rough,
                metalness: metal,
                envMapIntensity: envI,
                color: 0xffffff
            });
        }
        return makeMat({ color: colorStr, roughness: rough, metalness: metal, envMapIntensity: envI });
    }

    const parts = [];
    if (p.left && p.left.active !== false) parts.push({ id: 'left', pData: p.left, geo: [tL, hL, pLeftD > 0 ? pLeftD : boxD], pos: [-boxW / 2 + tL / 2, yL, 0] });
    if (p.right && p.right.active !== false) parts.push({ id: 'right', pData: p.right, geo: [tR, hR, pRightD > 0 ? pRightD : boxD], pos: [boxW / 2 - tR / 2, yR, 0] });
    if (p.back && p.back.active !== false) parts.push({ id: 'back', pData: p.back, geo: [pBackW > 0 ? pBackW : (boxW - tL - tR), hB, tB], pos: [0, yB, -boxD / 2 + tB / 2] });
    if (p.front && p.front.active !== false) parts.push({ id: 'front', pData: p.front, geo: [pFrontW > 0 ? pFrontW : (boxW - tL - tR), hF, tF], pos: [0, yF, boxD / 2 - tF / 2] });

    parts.forEach(part => {
        const wallH = part.geo[1];
        const isZAxis = (part.id === 'left' || part.id === 'right');
        const wallW = isZAxis ? part.geo[2] : part.geo[0]; 
        const wallT = isZAxis ? part.geo[0] : part.geo[2]; 

        const wallLabel = part.id === 'left' ? 'چپ' : part.id === 'right' ? 'راست' : part.id === 'front' ? 'جلو' : 'عقب';
        const mainWallLabel = `دیواره ${wallLabel} باکس نما U${c.id}`;

        const shape = new THREE.Shape();
        const boxEps = 0.02; 
        const zEps = 0.05;   

        let wallNiches = [];
        if (part.pData && part.pData.niches && part.pData.niches.enabled && part.pData.niches.list) {
            wallNiches = part.pData.niches.list;
        }

        const leftNiches = wallNiches.filter(n => n.openEdge === 'left');
        const rightNiches = wallNiches.filter(n => n.openEdge === 'right');
        const centerNiches = wallNiches.filter(n => !n.openEdge || n.openEdge === 'none' || n.openEdge === 'both');

        shape.moveTo(-wallW / 2, -wallH / 2);
        shape.lineTo(wallW / 2, -wallH / 2);

        if (rightNiches.length > 0) {
            [...rightNiches].sort((a, b) => a.posY - b.posY).forEach(n => {
                shape.lineTo(wallW / 2, -wallH / 2 + n.posY);
                shape.lineTo(wallW / 2 - n.w, -wallH / 2 + n.posY);
                shape.lineTo(wallW / 2 - n.w, -wallH / 2 + n.posY + n.h);
                shape.lineTo(wallW / 2, -wallH / 2 + n.posY + n.h);
            });
        }
        shape.lineTo(wallW / 2, wallH / 2);
        shape.lineTo(-wallW / 2, wallH / 2);

        if (leftNiches.length > 0) {
            [...leftNiches].sort((a, b) => (b.posY + b.h) - (a.posY + a.h)).forEach(n => {
                shape.lineTo(-wallW / 2, -wallH / 2 + n.posY + n.h);
                shape.lineTo(-wallW / 2 + n.w, -wallH / 2 + n.posY + n.h);
                shape.lineTo(-wallW / 2 + n.w, -wallH / 2 + n.posY);
                shape.lineTo(-wallW / 2, -wallH / 2 + n.posY);
            });
        }
        shape.lineTo(-wallW / 2, -wallH / 2);

        centerNiches.forEach(n => {
            const nx = -wallW / 2 + n.posX;
            const ny = -wallH / 2 + n.posY;
            const holePath = new THREE.Path();
            holePath.moveTo(nx, ny);
            holePath.lineTo(nx + n.w, ny);
            holePath.lineTo(nx + n.w, ny + n.h);
            holePath.lineTo(nx, ny + n.h);
            holePath.lineTo(nx, ny);
            shape.holes.push(holePath);
        });

        const nicheGroup = new THREE.Group();
        
        wallNiches.forEach((niche, nIdx) => {
            const nw = niche.w !== undefined && niche.w !== '' ? Number(niche.w) : 40;
            const nh = niche.h !== undefined && niche.h !== '' ? Number(niche.h) : 40;
            const nd = niche.d !== undefined && niche.d !== '' ? Number(niche.d) : 15;
            const nx = -wallW / 2 + (niche.posX !== undefined && niche.posX !== '' ? Number(niche.posX) : 0);
            const ny = -wallH / 2 + (niche.posY !== undefined && niche.posY !== '' ? Number(niche.posY) : 0);
            const openEdge = niche.openEdge || 'none';

            let extraLeft = 0; let extraRight = 0;
            if (!isZAxis) { 
                if (openEdge === 'left' || openEdge === 'both') extraLeft = 3.2;
                if (openEdge === 'right' || openEdge === 'both') extraRight = 3.2;
            }
            
            const drawnW = nw + extraLeft + extraRight;
            const drawnX = nx - extraLeft;

            const insideGeo = new THREE.BoxGeometry(drawnW - (boxEps * 2), nh - (boxEps * 2), nd);
            
            const internalNicheLabel = `سقف و کف بدنه داخلی نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`;
            const nicheMat = getSceneDynamicMaterial(niche, internalNicheLabel, '#ffffff');
            nicheMat.side = THREE.BackSide;
            const invisibleMat = new THREE.MeshBasicMaterial({ visible: false });

            let nicheZPos, frameZPos, openFaceIndex;
            const frameThick = 1.6; const frameWidth = 3.2;

            if (part.id === 'right' || part.id === 'front') {
                nicheZPos = (wallT / 2) - (nd / 2); openFaceIndex = 4; frameZPos = (wallT / 2) + (frameThick / 2) + zEps; 
            } else {
                nicheZPos = (-wallT / 2) + (nd / 2); openFaceIndex = 5; frameZPos = (-wallT / 2) - (frameThick / 2) - zEps; 
            }

            const materials = [nicheMat, nicheMat, nicheMat, nicheMat, nicheMat, nicheMat];
            materials[openFaceIndex] = invisibleMat;
            if (openEdge === 'right' || openEdge === 'both') materials[0] = invisibleMat;
            if (openEdge === 'left' || openEdge === 'both') materials[1] = invisibleMat;

            const insideBox = new THREE.Mesh(insideGeo, materials);
            insideBox.position.set(drawnX + drawnW / 2, ny + nh / 2, nicheZPos);

            const nicheWrapper = new THREE.Group();
            nicheWrapper.add(insideBox);

            const horizFrameLabel = `فریم افقی نما نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`;
            const frameMatHoriz = getSceneDynamicMaterial(niche, horizFrameLabel, '#ffffff');

            let topBotWidth = drawnW + (frameWidth * 2); let topBotX = drawnX + drawnW / 2;
            if (openEdge === 'left') { topBotWidth = drawnW + frameWidth; topBotX = drawnX + drawnW / 2 + frameWidth / 2; }
            else if (openEdge === 'right') { topBotWidth = drawnW + frameWidth; topBotX = drawnX + drawnW / 2 - frameWidth / 2; }
            else if (openEdge === 'both') { topBotWidth = drawnW; topBotX = drawnX + drawnW / 2; }

            const topGeo = new THREE.BoxGeometry(topBotWidth, frameWidth, frameThick);
            const topFrame = new THREE.Mesh(topGeo, frameMatHoriz);
            topFrame.add(new THREE.LineSegments(new THREE.EdgesGeometry(topGeo), lineMat)); 
            topFrame.position.set(topBotX, ny + nh + frameWidth/2, frameZPos);

            const botGeo = new THREE.BoxGeometry(topBotWidth, frameWidth, frameThick);
            const botFrame = new THREE.Mesh(botGeo, frameMatHoriz);
            botFrame.add(new THREE.LineSegments(new THREE.EdgesGeometry(botGeo), lineMat));
            botFrame.position.set(topBotX, ny - frameWidth/2, frameZPos);
            nicheWrapper.add(topFrame, botFrame);

            if (openEdge !== 'left' && openEdge !== 'both') {
                const vertLeftLabel = `فریم عمودی چپ نما نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`;
                const frameMatVertLeft = getSceneDynamicMaterial(niche, vertLeftLabel, '#ffffff');
                const leftGeo = new THREE.BoxGeometry(frameWidth, nh, frameThick);
                const leftFrame = new THREE.Mesh(leftGeo, frameMatVertLeft);
                leftFrame.add(new THREE.LineSegments(new THREE.EdgesGeometry(leftGeo), lineMat));
                leftFrame.position.set(drawnX - frameWidth/2, ny + nh/2, frameZPos);
                nicheWrapper.add(leftFrame);
            }

            if (openEdge !== 'right' && openEdge !== 'both') {
                const vertRightLabel = `فریم عمودی راست نما نیچ ${nIdx + 1} دیواره ${wallLabel} U${c.id}`;
                const frameMatVertRight = getSceneDynamicMaterial(niche, vertRightLabel, '#ffffff');
                const rightGeo = new THREE.BoxGeometry(frameWidth, nh, frameThick);
                const rightFrame = new THREE.Mesh(rightGeo, frameMatVertRight);
                rightFrame.add(new THREE.LineSegments(new THREE.EdgesGeometry(rightGeo), lineMat));
                rightFrame.position.set(drawnX + drawnW + frameWidth/2, ny + nh/2, frameZPos);
                nicheWrapper.add(rightFrame);
            }

            if (isZAxis) nicheWrapper.rotation.y = Math.PI / 2;
            nicheGroup.add(nicheWrapper);
        });

        const extrudeSettings = { depth: wallT, bevelEnabled: false };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.translate(0, 0, -wallT / 2); 
        if (isZAxis) geo.rotateY(Math.PI / 2);

        // 🔄 اصلاحیه اصلی: انتساب متریال کات‌مستر به کل آرایه وجوه ExtrudeGeometry
        const mat = getSceneDynamicMaterial(part.pData, mainWallLabel, '#FFFFFF');
        
        // همگام‌سازی UV وجه‌های جانبی بریده‌شده برای عدم افت کیفیت تکسچر
        geo.computeVertexNormals();
        
        // ساخت مش نهایی با متریال واحد روی تمام سطوح اکسترود
        const mesh = new THREE.Mesh(geo, mat);
        
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat));
        mesh.add(nicheGroup);

        // ترمووال‌ها
        if (part.pData && part.pData.thermowall && part.pData.thermowall.enabled && part.pData.thermowall.count > 0) {
            const th = part.pData.thermowall;
            const n = th.count;
            const slatW = th.w;
            
            for (let i = 0; i < n; i++) {
                let offset = 0;
                if (n === 1) { offset = 0; } 
                else {
                    const startPos = -wallW / 2 + slatW / 2;
                    const step = (wallW - slatW) / (n - 1);
                    offset = startPos + (i * step);
                }

                const tGeo = isZAxis ? new THREE.BoxGeometry(th.d, wallH, slatW) : new THREE.BoxGeometry(slatW, wallH, th.d); 
                const tEdges = new THREE.EdgesGeometry(tGeo);

                if (part.pData.posLeft) {
                    const thermoLabelLeft = `ترمووال سمت چپ شاخه ${i + 1} - دیواره ${wallLabel} U${c.id}`;
                    const currentThermoMatL = getSceneDynamicMaterial(th, thermoLabelLeft, '#FFFFFF');
                    
                    const tMeshOut = new THREE.Mesh(tGeo, currentThermoMatL);
                    tMeshOut.castShadow = true;
                    tMeshOut.receiveShadow = true;
                    tMeshOut.add(new THREE.LineSegments(tEdges, lineMat)); 
                    if (isZAxis) tMeshOut.position.set(-wallT/2 - th.d/2, 0, offset); 
                    else tMeshOut.position.set(offset, 0, -wallT/2 - th.d/2); 
                    mesh.add(tMeshOut);
                }

                if (part.pData.posRight) {
                    const thermoLabelRight = `ترمووال سمت راست شاخه ${i + 1} - دیواره ${wallLabel} U${c.id}`;
                    const currentThermoMatR = getSceneDynamicMaterial(th, thermoLabelRight, '#FFFFFF');

                    const tMeshIn = new THREE.Mesh(tGeo, currentThermoMatR);
                    tMeshIn.castShadow = true;
                    tMeshIn.receiveShadow = true;
                    tMeshIn.add(new THREE.LineSegments(tEdges, lineMat)); 
                    if (isZAxis) tMeshIn.position.set(wallT/2 + th.d/2, 0, offset); 
                    else tMeshIn.position.set(offset, 0, wallT/2 + th.d/2); 
                    mesh.add(tMeshIn);
                }
            }
        }

        // شلف‌ها
        if (part.pData && part.pData.shelves && part.pData.shelves.enabled && part.pData.shelves.list && part.pData.shelves.list.length > 0) {
            part.pData.shelves.list.forEach((shelf, shIdx) => {
                const sW = shelf.w !== undefined && shelf.w !== '' ? Number(shelf.w) : 30; 
                const sD = shelf.d !== undefined && shelf.d !== '' ? Number(shelf.d) : 60; 
                const sT = shelf.t !== undefined && shelf.t !== '' ? Number(shelf.t) : 1.6; 
                const sH = shelf.h !== undefined && shelf.h !== '' ? Number(shelf.h) : 50; 

                let sGeo, sPosX, sPosZ;
                const sPosY = -wallH / 2 + sH + (sT / 2); 

                if (isZAxis) { 
                    sGeo = new THREE.BoxGeometry(sW, sT, sD);
                    const shelfOffset = shelf.pos !== undefined && shelf.pos !== '' ? Number(shelf.pos) : 0;
                    sPosZ = (-wallW / 2) + (sD / 2) + shelfOffset; 
                    
                    if (part.pData.posLeft) {
                        const shelfLabelL = `شلف ${shIdx + 1} سمت چپ - دیواره ${wallLabel} U${c.id}`;
                        const shelfMatL = getSceneDynamicMaterial(Object.assign({}, shelf, { finish: shelf.finish || (part.pData.shelves && part.pData.shelves.finish) || 'matte' }), shelfLabelL, '#ffffff');
                        const sMeshL = new THREE.Mesh(sGeo, shelfMatL);
                        sMeshL.add(new THREE.LineSegments(new THREE.EdgesGeometry(sGeo), lineMat));
                        sMeshL.position.set(-wallT / 2 - sW / 2, sPosY, sPosZ);
                        mesh.add(sMeshL);
                    }
                    if (part.pData.posRight) {
                        const shelfLabelR = `شلف ${shIdx + 1} سمت راست - دیواره ${wallLabel} U${c.id}`;
                        const shelfMatR = getSceneDynamicMaterial(Object.assign({}, shelf, { finish: shelf.finish || (part.pData.shelves && part.pData.shelves.finish) || 'matte' }), shelfLabelR, '#ffffff');
                        const sMeshR = new THREE.Mesh(sGeo, shelfMatR);
                        sMeshR.add(new THREE.LineSegments(new THREE.EdgesGeometry(sGeo), lineMat));
                        sMeshR.position.set(wallT / 2 + sW / 2, sPosY, sPosZ);
                        mesh.add(sMeshR);
                    }
                } else { 
                    sGeo = new THREE.BoxGeometry(sD, sT, sW);
                    const shelfOffset = shelf.pos !== undefined && shelf.pos !== '' ? Number(shelf.pos) : 0;
                    sPosX = (-wallW / 2) + (sD / 2) + shelfOffset; 

                    if (part.pData.posLeft) {
                        const shelfLabelL = `شلف ${shIdx + 1} سمت چپ - دیواره ${wallLabel} U${c.id}`;
                        const shelfMatL = getSceneDynamicMaterial(Object.assign({}, shelf, { finish: shelf.finish || (part.pData.shelves && part.pData.shelves.finish) || 'matte' }), shelfLabelL, '#ffffff');
                        const sMeshL = new THREE.Mesh(sGeo, shelfMatL);
                        sMeshL.add(new THREE.LineSegments(new THREE.EdgesGeometry(sGeo), lineMat));
                        sMeshL.position.set(sPosX, sPosY, -wallT / 2 - sW / 2);
                        mesh.add(sMeshL);
                    }
                    if (part.pData.posRight) {
                        const shelfLabelR = `شلف ${shIdx + 1} سمت راست - دیواره ${wallLabel} U${c.id}`;
                        const shelfMatR = getSceneDynamicMaterial(Object.assign({}, shelf, { finish: shelf.finish || (part.pData.shelves && part.pData.shelves.finish) || 'matte' }), shelfLabelR, '#ffffff');
                        const sMeshR = new THREE.Mesh(sGeo, shelfMatR);
                        sMeshR.add(new THREE.LineSegments(new THREE.EdgesGeometry(sGeo), lineMat));
                        sMeshR.position.set(sPosX, sPosY, wallT / 2 + sW / 2);
                        mesh.add(sMeshR);
                    }
                }
            });
        }

        mesh.position.set(part.pos[0], part.pos[1], part.pos[2]);
        fbGroup.add(mesh);
    });

    group.add(fbGroup);
}




else if (c.isCoffeeBar) {
    // 🟢 احترام به انتخاب کاربر برای نمایش یا عدم نمایش درب
    if (c.showDoors && c.doors === 0) {
        c.doors = 1; 
    } else if (!c.showDoors) {
        c.doors = 0; 
    }

    // --- ساختار کافه بار ---
    const bodyGroup = new THREE.Group();
    const panelThickness = thickness || 1.6; 
    
    const W = c.w;
    const H = c.h;
    const D = c.d;

    // 🎯 متریال قطعه کافه‌بار + پرداخت سطح (مات/براق) جدا از جنس ورق
    const createPartMaterial = (partLabel, fallbackColor, finishKey) => {
        const fk = finishKey || 'matte';
        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(fk)
            : { roughness: 0.55, metalness: 0.03, envMapIntensity: 0.5, bumpScale: 0.06, clearcoat: 0 };
        const bump = preset.bumpScale || 0;
        const cc = (preset.clearcoat && preset.clearcoat > 0.05) ? preset.clearcoat : 0;

        let mapUrl = '';
        let finalVal = fallbackColor;
        if (partLabel && window.isolatedDoorTextures) {
            const clean = String(partLabel).replace('📌', '').trim();
            if (window.isolatedDoorTextures[clean]) mapUrl = window.isolatedDoorTextures[clean];
        }
        // مقادیر رنگ/URL از caller اغلب در finalVal می‌آید — بررسی URL بودن
        if (!mapUrl && finalVal && typeof finalVal === 'string' &&
            (finalVal.includes('http') || finalVal.includes('assets/') || finalVal.includes('/') || finalVal.includes('data:image'))) {
            mapUrl = finalVal;
            finalVal = '';
        }

        if (typeof Kitchen3D !== 'undefined' && typeof Kitchen3D.buildSharedSurfaceMaterial === 'function') {
            return Kitchen3D.buildSharedSurfaceMaterial({
                finish: fk,
                mapUrl: mapUrl || '',
                color: mapUrl ? '' : (finalVal || '#ffffff'),
                roughness: preset.roughness,
                metalness: preset.metalness,
                envMapIntensity: preset.envMapIntensity || 0.5,
                bumpScale: bump,
                clearcoat: cc,
                clearcoatRoughness: preset.clearcoatRoughness || 0.05
            });
        }
        const params = { roughness: preset.roughness, metalness: preset.metalness, envMapIntensity: preset.envMapIntensity || 0.5 };
        if (mapUrl) {
            const tex = new THREE.TextureLoader().load(mapUrl);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            params.map = tex; params.color = 0xffffff;
        } else {
            try { params.color = new THREE.Color(finalVal || '#ffffff'); } catch (e) { params.color = 0xffffff; }
        }
        if (cc > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
            params.clearcoat = cc;
            params.clearcoatRoughness = 0.05;
            return new THREE.MeshPhysicalMaterial(params);
        }
        return new THREE.MeshStandardMaterial(params);
    };

    // 🪵 تابع کمکی اختصاصی برای تولید گروه تیرک‌های ترمووال
    // ضخامت/عمق واقعی + متریال چوب با Reflection/Roughness + لبه برای عمق
    const buildThermoGroup = (thermoConf, maxDimensionW, maxDimensionH) => {
        if (!thermoConf || !thermoConf.active) return null;

        const count = parseInt(thermoConf.count) || 1;
        const tWidth = parseFloat(thermoConf.width) || 4;     // عرض تیرک
        const tDepth = parseFloat(thermoConf.depth) || 2;     // برجستگی از سطح
        const tHeight = parseFloat(thermoConf.height) || maxDimensionH;

        const baseMat = createPartMaterial(`ترمووال U${c.id}`, thermoConf.color || "#3b2314", thermoConf.finish || 'matte');
        // لبه تیرک کمی تیره‌تر تا ضخامت واقعی دیده شود
        const edgeMat = baseMat.clone();
        edgeMat.map = null;
        edgeMat.bumpMap = null;
        try {
            const ec = (baseMat.color && baseMat.color.clone) ? baseMat.color.clone() : new THREE.Color(0x3b2314);
            ec.multiplyScalar(0.78);
            edgeMat.color.copy(ec);
        } catch (e) { edgeMat.color = new THREE.Color(0x2a1a10); }
        edgeMat.roughness = Math.min(0.85, (baseMat.roughness || 0.48) + 0.15);
        edgeMat.metalness = 0.04;
        // [+x,-x,+y,-y,+z front,-z back]
        const mats = [edgeMat, edgeMat, edgeMat, edgeMat, baseMat, edgeMat];

        const thermoGroup = new THREE.Group();
        const step = count > 1 ? (maxDimensionW - tWidth) / (count - 1) : 0;
        const startX = count > 1 ? -maxDimensionW / 2 + tWidth / 2 : 0;

        for (let i = 0; i < count; i++) {
            const geom = new THREE.BoxGeometry(tWidth, tHeight, tDepth);
            const mesh = new THREE.Mesh(geom, mats);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const posX = startX + (i * step);
            mesh.position.set(posX, 0, tDepth / 2);
            thermoGroup.add(mesh);
        }

        return thermoGroup;
    };

    const defaultMatValue = c.doorColor || c.color || "#FFFFFF";
    
    const getPartConfig = (partName) => {
        if (c.coffeeBarParts && c.coffeeBarParts[partName]) {
            return c.coffeeBarParts[partName];
        }
        return { active: true, color: defaultMatValue }; 
    };

    const backConf = getPartConfig('back');
    const leftConf = getPartConfig('left');
    const rightConf = getPartConfig('right');
    const topConf = getPartConfig('top');
    const bottomConf = getPartConfig('bottom');

    const sideDepth = D - panelThickness;
    const topBottomW = W - (2 * panelThickness);
    const innerH = H - (2 * panelThickness);

    // ۱. ورق پشت (۱۶ میل) و ترمووال پشت
    if (backConf.active) {
        const backLabel = `ورق پشت ۱۶میل کافه بار U${c.id}`;
        const backMat = createPartMaterial(backLabel, backConf.color, backConf.finish || 'matte');
        
        const backGeo = new THREE.BoxGeometry(W, H, panelThickness);
        const backMesh = new THREE.Mesh(backGeo, backMat);
        backMesh.position.set(0, 0, -D / 2 + panelThickness / 2);
        bodyGroup.add(backMesh);

        // ترمووال روی پشت کار
        if (backConf.thermo && backConf.thermo.active) {
            const thermoBack = buildThermoGroup(backConf.thermo, W - (2 * panelThickness), innerH);
            if (thermoBack) {
                // قرارگیری چسبیده به سطح جلوئی ورق پشت
                thermoBack.position.set(0, 0, -D / 2 + panelThickness);
                bodyGroup.add(thermoBack);
            }
        }
    }

    // ۲. دیواره چپ و ترمووال آن
    if (leftConf.active) {
        const leftLabel = `دیواره چپ کافه بار U${c.id}`;
        const leftMat = createPartMaterial(leftLabel, leftConf.color, leftConf.finish || 'matte');
        
        const sideGeo = new THREE.BoxGeometry(panelThickness, H, sideDepth);
        const leftMesh = new THREE.Mesh(sideGeo, leftMat);
        leftMesh.position.set(-W / 2 + panelThickness / 2, 0, panelThickness / 2); 
        bodyGroup.add(leftMesh);

        // ترمووال دیواره چپ (داخل یونیت)
        if (leftConf.thermo && leftConf.thermo.active) {
            const thermoLeft = buildThermoGroup(leftConf.thermo, sideDepth, innerH);
            if (thermoLeft) {
                thermoLeft.rotation.y = Math.PI / 2;
                thermoLeft.position.set(-W / 2 + panelThickness, 0, panelThickness / 2);
                bodyGroup.add(thermoLeft);
            }
        }
    }

    // ۳. دیواره راست و ترمووال آن
    if (rightConf.active) {
        const rightLabel = `دیواره راست کافه بار U${c.id}`;
        const rightMat = createPartMaterial(rightLabel, rightConf.color, rightConf.finish || 'matte');
        
        const sideGeo = new THREE.BoxGeometry(panelThickness, H, sideDepth);
        const rightMesh = new THREE.Mesh(sideGeo, rightMat);
        rightMesh.position.set(W / 2 - panelThickness / 2, 0, panelThickness / 2);
        bodyGroup.add(rightMesh);

        // ترمووال دیواره راست (داخل یونیت)
        if (rightConf.thermo && rightConf.thermo.active) {
            const thermoRight = buildThermoGroup(rightConf.thermo, sideDepth, innerH);
            if (thermoRight) {
                thermoRight.rotation.y = -Math.PI / 2;
                thermoRight.position.set(W / 2 - panelThickness, 0, panelThickness / 2);
                bodyGroup.add(thermoRight);
            }
        }
    }

    // ۴. سقف و ترمووال آن
    if (topConf.active) {
        const topLabel = `سقف کافه بار U${c.id}`;
        const topMat = createPartMaterial(topLabel, topConf.color, topConf.finish || 'matte');
        
        const topGeo = new THREE.BoxGeometry(topBottomW, panelThickness, sideDepth);
        const topMesh = new THREE.Mesh(topGeo, topMat);
        topMesh.position.set(0, H / 2 - panelThickness / 2, panelThickness / 2); 
        bodyGroup.add(topMesh);

        // ترمووال سقف (رو به پایین)
        if (topConf.thermo && topConf.thermo.active) {
            const thermoTop = buildThermoGroup(topConf.thermo, topBottomW, sideDepth);
            if (thermoTop) {
                thermoTop.rotation.x = Math.PI / 2;
                thermoTop.position.set(0, H / 2 - panelThickness, panelThickness / 2);
                bodyGroup.add(thermoTop);
            }
        }
    }

    // ۵. کف و ترمووال آن
    if (bottomConf.active) {
        const bottomLabel = `کف کافه بار U${c.id}`;
        const bottomMat = createPartMaterial(bottomLabel, bottomConf.color, bottomConf.finish || 'matte');
        
        const bottomGeo = new THREE.BoxGeometry(topBottomW, panelThickness, sideDepth);
        const bottomMesh = new THREE.Mesh(bottomGeo, bottomMat);
        bottomMesh.position.set(0, -H / 2 + panelThickness / 2, panelThickness / 2); 
        bodyGroup.add(bottomMesh);

        // ترمووال کف (رو به بالا)
        if (bottomConf.thermo && bottomConf.thermo.active) {
            const thermoBottom = buildThermoGroup(bottomConf.thermo, topBottomW, sideDepth);
            if (thermoBottom) {
                thermoBottom.rotation.x = -Math.PI / 2;
                thermoBottom.position.set(0, -H / 2 + panelThickness, panelThickness / 2);
                bodyGroup.add(thermoBottom);
            }
        }
    }

    // ۶. پیشخوان جلویی کافه بار (بدون ترمووال)
    const frontConf = getPartConfig('front');
    if (frontConf && frontConf.active) {
        const frontLabel = `پیشخوان جلوی کافه بار U${c.id}`;
        const frontMat = createPartMaterial(frontLabel, frontConf.color, frontConf.finish || 'matte');
        
        const innerHalfW = (W / 2) - panelThickness; 
        const topY = (H / 2) - panelThickness; 
        
        if (frontConf.isCurved) {
            const panelHeight = frontConf.height || 80;
            const bottomY = (H / 2) - panelHeight;
            const lip = 5;
            const panelBottom = -H / 2 + panelThickness;
            const arcTop = bottomY;

            // ---------- قاب بیرونی ----------
            const shape = new THREE.Shape();
            shape.moveTo(-innerHalfW, topY);
            shape.lineTo(innerHalfW, topY);
            shape.lineTo(innerHalfW, panelBottom);
            shape.lineTo(-innerHalfW, panelBottom);
            shape.closePath();

            // ---------- سوراخ داخلی ----------
            const hole = new THREE.Path();
            const r = innerHalfW - lip;
            hole.moveTo(-(innerHalfW - lip), panelBottom + lip);
            hole.lineTo(-(innerHalfW - lip), arcTop);
            hole.absarc(0, arcTop, r, Math.PI, 0, true);
            hole.lineTo(innerHalfW - lip, panelBottom + lip);
            hole.lineTo(-(innerHalfW - lip), panelBottom + lip);
            shape.holes.push(hole);

            const extrudeSettings = {
                steps: 1,
                depth: panelThickness,
                bevelEnabled: false
            };

            const frontGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            frontGeo.computeVertexNormals();
            
            const frontMesh = new THREE.Mesh(frontGeo, frontMat);
            frontMesh.position.set(0, 0, D / 2 - panelThickness);
            bodyGroup.add(frontMesh);
        } else {
            const frontGeo = new THREE.BoxGeometry(topBottomW, innerH, panelThickness);
            const frontMesh = new THREE.Mesh(frontGeo, frontMat);
            frontMesh.position.set(0, 0, D / 2 - panelThickness / 2);
            bodyGroup.add(frontMesh);
        }
    }

    group.add(bodyGroup);

    if (typeof this.createDoorSystem === 'function') {
        const finalDoorMat = typeof doorMat !== 'undefined' ? doorMat : createPartMaterial(`درب کافه بار U${c.id}`, defaultMatValue);
        this.createDoorSystem(group, c, finalDoorMat);
    }
    
    if (typeof this.createShelves === 'function') {
        this.createShelves(group, c);
    }
}





                        else {
                // ==========================================================
                // ساخت کابینت‌های معمولی (زمینی، دیواری، کمدی و ...)
                // ==========================================================
                               if (c.type === 'floor') {
    // --- ساختار نهایی و استاندارد کابینت زمینی ---
    const bodyGroup = new THREE.Group(); 
    
    const panelThickness = thickness; // 1.6 (ضخامت ورق)
    const backPanelThickness = 0.3;   // ضخامت فیبر پشت (3 میل)
    const topStripHeight = 6.0;       // ارتفاع قیدها (6 سانت)
    const backInset = 1.7;            // فاصله از لبه پشت تا فیبر (17 میل)
    const grooveDepth = 0.7;          // عمق شیار (7 میلی‌متر)

    const W = c.w;
    const H = c.h;
    const D = c.d;

    // ==========================================================
    // متریال‌های نهایی — داخل یونیت کمی تاریک‌تر برای حس عمق
    // ==========================================================
    const _interiorFloor = (typeof this.createInteriorMaterials === 'function')
        ? this.createInteriorMaterials()
        : null;
    const whiteMat = _interiorFloor
        ? _interiorFloor.whiteMat
        : new THREE.MeshStandardMaterial({ color: 0xe8e6e3, roughness: 0.62 });
    const backMat  = _interiorFloor
        ? _interiorFloor.backMat
        : new THREE.MeshStandardMaterial({ color: 0xd4d2cf, roughness: 0.75 });
    const legMat   = new THREE.MeshStandardMaterial({ color: 0x333333 }); // خاکستری تیره برای پایه‌ها

    // متغیر بررسی دستگیره مخفی (در همان ابتدا تعریف می‌کنیم)
    let hasTopHiddenHandle = false;
    if (c.hiddenHandle === 'top' || c.drawerHiddenHandle === 'top') hasTopHiddenHandle = true;
    if (c.doorSizes && c.doorSizes.some(s => s.hiddenHandlePos === 'top')) hasTopHiddenHandle = true;

    // ۱. پانل کف (ذوزنقه‌ای وقتی زاویه کناری ≠ ۹۰)
    {
        const m0 = (typeof this.getSideAngleMetrics === 'function') ? this.getSideAngleMetrics(c) : null;
        let floorMesh;
        if (m0 && (Math.abs(m0.devL) > 0.01 || Math.abs(m0.devR) > 0.01)) {
            const shape = new THREE.Shape();
            // بعد از rotation.x = -PI/2: shapeY → -worldZ
            // پس برای عقب worldZ=-D/2 باید shapeY = +D/2 باشد
            const fl = -W / 2 + m0.insetL; // جلوی چپ
            const fr = W / 2 + m0.insetR;  // جلوی راست
            shape.moveTo(-W / 2, D / 2);  // عقب چپ
            shape.lineTo(W / 2, D / 2);   // عقب راست
            shape.lineTo(fr, -D / 2);     // جلو راست
            shape.lineTo(fl, -D / 2);     // جلو چپ
            shape.closePath();
            const floorGeo = new THREE.ExtrudeGeometry(shape, { depth: panelThickness, bevelEnabled: false });
            floorMesh = new THREE.Mesh(floorGeo, whiteMat);
            floorMesh.rotation.x = -Math.PI / 2;
            floorMesh.position.y = -H / 2;
        } else {
            const floorGeo = new THREE.BoxGeometry(W, panelThickness, D);
            floorMesh = new THREE.Mesh(floorGeo, whiteMat);
            floorMesh.position.y = -H / 2 + panelThickness / 2;
        }
        floorMesh.name = 'bodyFloor';
        bodyGroup.add(floorMesh);
    }

    // ۲ و ۳. پانل‌های بغل چپ و راست (زاویه کناری + برش L دستگیره مخفی)
    const sideNotchD = 3.2; // عمق برش L (عقب‌نشینی قید)
    const sideNotchH = 6.6; // ارتفاع برش L
    const sideH = H - panelThickness;
    const sideY = panelThickness / 2;

    const sideM = (typeof this.getSideAngleMetrics === 'function')
        ? this.getSideAngleMetrics(c)
        : { radL: 0, radR: 0, insetL: 0, insetR: 0, frontW: W, frontCenterX: 0 };
    const radL = sideM.radL;
    const radR = sideM.radR;
    const leftLen = D / Math.max(0.25, Math.cos(radL));
    const rightLen = D / Math.max(0.25, Math.cos(radR));
    const frontWAdj = sideM.frontW;
    const frontCX = sideM.frontCenterX;

    // لولا در لبه عقب — چرخش حول Y (مثبت چپ = جلو به داخل)
    const leftPivot = new THREE.Group();
    leftPivot.name = 'bodyLeftPivot';
    leftPivot.position.set(-W / 2 + panelThickness / 2, sideY, -D / 2);
    leftPivot.rotation.y = radL;

    const rightPivot = new THREE.Group();
    rightPivot.name = 'bodyRightPivot';
    rightPivot.position.set(W / 2 - panelThickness / 2, sideY, -D / 2);
    rightPivot.rotation.y = radR;

    if (hasTopHiddenHandle) {
        const scaleL = leftLen / D;
        const scaleR = rightLen / D;
        const backDepthL = (D - sideNotchD) * scaleL;
        const frontDepthL = sideNotchD * scaleL;
        const backDepthR = (D - sideNotchD) * scaleR;
        const frontDepthR = sideNotchD * scaleR;

        const leftBack = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, sideH, backDepthL), whiteMat);
        leftBack.position.set(0, 0, backDepthL / 2);
        const leftFront = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, sideH - sideNotchH, frontDepthL), whiteMat);
        leftFront.position.set(0, -sideNotchH / 2, backDepthL + frontDepthL / 2);
        leftPivot.add(leftBack, leftFront);

        const rightBack = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, sideH, backDepthR), whiteMat);
        rightBack.position.set(0, 0, backDepthR / 2);
        const rightFront = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, sideH - sideNotchH, frontDepthR), whiteMat);
        rightFront.position.set(0, -sideNotchH / 2, backDepthR + frontDepthR / 2);
        rightPivot.add(rightBack, rightFront);
    } else {
        const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, sideH, leftLen), whiteMat);
        leftMesh.name = 'bodyLeft';
        leftMesh.position.set(0, 0, leftLen / 2);
        leftPivot.add(leftMesh);

        const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, sideH, rightLen), whiteMat);
        rightMesh.name = 'bodyRight';
        rightMesh.position.set(0, 0, rightLen / 2);
        rightPivot.add(rightMesh);
    }

    bodyGroup.add(leftPivot);
    bodyGroup.add(rightPivot);

    // ۴. فیبر پشت ۳ میل (کمی تیره‌تر)
    const backWidth = (W - 2 * panelThickness) + (2 * grooveDepth);
    const backHeight = H - panelThickness;
    
    const backGeo = new THREE.BoxGeometry(backWidth, backHeight, backPanelThickness);
    const backMesh = new THREE.Mesh(backGeo, backMat);
    
    backMesh.position.z = -D / 2 + backInset + backPanelThickness / 2;
    backMesh.position.y = (-H / 2 + panelThickness - grooveDepth) + (backHeight / 2);
    bodyGroup.add(backMesh);

    // ==========================================================
    // ۵ و ۶. مدیریت سقف (تفاوت یونیت فر با یونیت زمینی عادی)
    // ==========================================================
    if (c.isOvenCabinet) {
        // ساخت سقف یکپارچه ۱۶ میل بین دو دیواره با ۲ سانت عمق کمتر (بخاطر فیبر ۳ میل)
        const topDepth = D - 2.0; 
        const topGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, topDepth);
        const topMesh = new THREE.Mesh(topGeo, whiteMat);
        topMesh.position.x = 0;
        topMesh.position.y = H / 2 - panelThickness / 2; // چسبیده به سقف
        topMesh.position.z = 1.0; // مماس با لبه‌ی جلو (عقب‌نشینی ۲ سانتی‌متری در پشت میافتد)
        bodyGroup.add(topMesh);
    } else {
        // حالت عادی کابینت زمینی: ساخت دو عدد قید ۶ سانتی‌متری
        // قید پشت بالا ۶ سانتی
        const topBackGeo = new THREE.BoxGeometry(W - 2 * panelThickness, topStripHeight, panelThickness);
        const topBackMesh = new THREE.Mesh(topBackGeo, whiteMat);
        topBackMesh.position.y = H / 2 - topStripHeight / 2;
        topBackMesh.position.z = -D / 2 + panelThickness / 2; 
        bodyGroup.add(topBackMesh);

        // قید جلوی بالا ۶ سانتی — عرض مطابق دهانه جلوی زاویه‌دار
        const mFront = (typeof this.getSideAngleMetrics === 'function') ? this.getSideAngleMetrics(c) : null;
        const frontRailW = mFront ? Math.max(panelThickness, mFront.frontW - 2 * panelThickness) : (W - 2 * panelThickness);
        const frontRailX = mFront ? mFront.frontCenterX : 0;
        const topFrontGeo = new THREE.BoxGeometry(frontRailW, topStripHeight, panelThickness);
        const topFrontMesh = new THREE.Mesh(topFrontGeo, whiteMat);
        topFrontMesh.position.x = frontRailX;
        topFrontMesh.position.y = H / 2 - topStripHeight / 2;

        if (hasTopHiddenHandle) {
            topFrontMesh.position.z = (D / 2) - 3.2 - (panelThickness / 2);
        } else {
            topFrontMesh.position.z = (D / 2) - (panelThickness / 2);
        }
        bodyGroup.add(topFrontMesh);
    }


    // ==========================================================
    // ۷. افزودن ۴ پایه ۱۴ سانتی — موقعیت X با زاویه دیوارها تنظیم می‌شود
    // ==========================================================
    if (c.drawerLegs !== false) {
        const legHeight = 14.0;
        const legRadius = 1.5;
        const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);

        const legY = -H / 2 - (legHeight / 2);
        const sideInset = 4.0;
        const backInsetLeg = 4.0;
        const frontInsetLeg = 6.0;

        const mLeg = (typeof this.getSideAngleMetrics === 'function')
            ? this.getSideAngleMetrics(c)
            : { insetL: 0, insetR: 0 };
        const shiftL = mLeg.insetL || 0;
        const shiftR = mLeg.insetR || 0;
        // لبه چپ/راست در عمق z: از عقب (-D/2) تا جلو (+D/2)
        const edgeX = (z, isLeft) => {
            const t = (z + D / 2) / Math.max(0.001, D); // 0=عقب … 1=جلو
            if (isLeft) return -W / 2 + t * shiftL;
            return W / 2 + t * shiftR;
        };
        const zB = -D / 2 + backInsetLeg;
        const zF = D / 2 - frontInsetLeg;

        const legBL = new THREE.Mesh(legGeo, legMat);
        legBL.position.set(edgeX(zB, true) + sideInset, legY, zB);
        bodyGroup.add(legBL);

        const legBR = new THREE.Mesh(legGeo, legMat);
        legBR.position.set(edgeX(zB, false) - sideInset, legY, zB);
        bodyGroup.add(legBR);

        const legFL = new THREE.Mesh(legGeo, legMat);
        legFL.position.set(edgeX(zF, true) + sideInset, legY, zF);
        bodyGroup.add(legFL);

        const legFR = new THREE.Mesh(legGeo, legMat);
        legFR.position.set(edgeX(zF, false) - sideInset, legY, zF);
        bodyGroup.add(legFR);
    }

    group.add(bodyGroup);
    
    this.createDoorSystem(group, c, doorMat);
    this.createShelves(group, c);
}


                       
                       else if (c.type === 'waterproof') {
    // --- بدنه ضد آب (سینک) - مشابه کابینت زمینی اما بدون فیبر پشت ---
    const bodyGroup = new THREE.Group(); 
    
    const panelThickness = thickness; // 1.6 (ضخامت ورق PVC)
    const topStripHeight = 6.0;       // ارتفاع قیدها (6 سانت)

    const W = c.w;
    const H = c.h;
    const D = c.d;

    // متریال‌های نهایی (پی‌وی‌سی سفید)
    const pvcMat = (typeof this.createInteriorMaterials === 'function')
        ? this.createInteriorMaterials().bodyMat
        : new THREE.MeshStandardMaterial({ color: 0xe8e6e3, roughness: 0.62 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); // خاکستری تیره برای پایه‌ها

    // ۱. پانل کف
    const floorGeo = new THREE.BoxGeometry(W, panelThickness, D);
    const floorMesh = new THREE.Mesh(floorGeo, pvcMat);
    floorMesh.position.y = -H / 2 + panelThickness / 2;
    bodyGroup.add(floorMesh);

    // ۲ و ۳. پانل بغل چپ/راست با زاویه کناری
    {
        const _smW = (typeof this.getSideAngleMetrics === 'function')
            ? this.getSideAngleMetrics(c)
            : { radL: 0, radR: 0 };
        const radL = _smW.radL, radR = _smW.radR;
        const sideH = H - panelThickness;
        const leftLen = D / Math.max(0.25, Math.cos(radL));
        const rightLen = D / Math.max(0.25, Math.cos(radR));
        const leftPivot = new THREE.Group();
        leftPivot.position.set(-W / 2 + panelThickness / 2, panelThickness / 2, -D / 2);
        leftPivot.rotation.y = radL;
        const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, sideH, leftLen), pvcMat);
        leftMesh.position.set(0, 0, leftLen / 2);
        leftPivot.add(leftMesh);
        bodyGroup.add(leftPivot);
        const rightPivot = new THREE.Group();
        rightPivot.position.set(W / 2 - panelThickness / 2, panelThickness / 2, -D / 2);
        rightPivot.rotation.y = radR;
        const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, sideH, rightLen), pvcMat);
        rightMesh.position.set(0, 0, rightLen / 2);
        rightPivot.add(rightMesh);
        bodyGroup.add(rightPivot);
    }

    // ** (فیبر پشت ۳ میل در بدنه ضد آب حذف شده است تا فضای لوله‌ها باز باشد) **
    // ۵. قید پشت بالا ۶ سانتی
    const topBackGeo = new THREE.BoxGeometry(W - 2 * panelThickness, topStripHeight, panelThickness);
    const topBackMesh = new THREE.Mesh(topBackGeo, pvcMat);
    topBackMesh.position.y = H / 2 - topStripHeight / 2;
    topBackMesh.position.z = -D / 2 + panelThickness / 2; 
    bodyGroup.add(topBackMesh);

    // ==========================================================
    // ۶. قید جلوی بالا ۶ سانتی (آپدیت شده برای دستگیره مخفی)
    // ==========================================================
    const topFrontGeo = new THREE.BoxGeometry(W - 2 * panelThickness, topStripHeight, panelThickness);
    const topFrontMesh = new THREE.Mesh(topFrontGeo, pvcMat);
    topFrontMesh.position.y = H / 2 - topStripHeight / 2;

    // بررسی می‌کنیم که آیا دستگیره مخفی بالا در تنظیمات کابینت یا درب‌ها روشن است؟
    let hasTopHiddenHandle = false;
    if (c.hiddenHandle === 'top' || c.drawerHiddenHandle === 'top') hasTopHiddenHandle = true;
    if (c.doorSizes && c.doorSizes.some(s => s.hiddenHandlePos === 'top')) hasTopHiddenHandle = true;

    if (hasTopHiddenHandle) {
        // اگر دستگیره مخفی بالا داریم، قید ۳.۲ سانت میره عقب
        topFrontMesh.position.z = (D / 2 - panelThickness / 2) - 3.2;
    } else {
        // حالت عادی بدون دستگیره مخفی
        topFrontMesh.position.z = D / 2 - panelThickness / 2;
    }
    bodyGroup.add(topFrontMesh);

    // ==========================================================
    // ۷. افزودن ۴ پایه ۱۴ سانتی — موقعیت با زاویه دیوارها
    // ==========================================================
    const legHeight = 14.0;
    const legRadius = 1.5;
    const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);

    const legY = -H / 2 - (legHeight / 2);
    const sideInset = 4.0;
    const backInsetLeg = 4.0;
    const frontInsetLeg = 6.0;

    const mLeg = (typeof this.getSideAngleMetrics === 'function')
        ? this.getSideAngleMetrics(c)
        : { insetL: 0, insetR: 0 };
    const shiftL = mLeg.insetL || 0;
    const shiftR = mLeg.insetR || 0;
    const edgeX = (z, isLeft) => {
        const t = (z + D / 2) / Math.max(0.001, D);
        if (isLeft) return -W / 2 + t * shiftL;
        return W / 2 + t * shiftR;
    };
    const zB = -D / 2 + backInsetLeg;
    const zF = D / 2 - frontInsetLeg;

    const legBL = new THREE.Mesh(legGeo, legMat);
    legBL.position.set(edgeX(zB, true) + sideInset, legY, zB);
    bodyGroup.add(legBL);

    const legBR = new THREE.Mesh(legGeo, legMat);
    legBR.position.set(edgeX(zB, false) - sideInset, legY, zB);
    bodyGroup.add(legBR);

    const legFL = new THREE.Mesh(legGeo, legMat);
    legFL.position.set(edgeX(zF, true) + sideInset, legY, zF);
    bodyGroup.add(legFL);

    const legFR = new THREE.Mesh(legGeo, legMat);
    legFR.position.set(edgeX(zF, false) - sideInset, legY, zF);
    bodyGroup.add(legFR);

    group.add(bodyGroup);
    
    // اضافه کردن سیستم درب و طبقات 
    // (کاربر می‌تواند در ویرایشگر برای آن درب دوتایی تعریف کند)
    this.createDoorSystem(group, c, doorMat);
    this.createShelves(group, c);
}


                                       else if (c.type === 'wall' && c.isUpperTier) {
                    // --- ساختار کابینت دیواری پله دوم (سقف و کف ۲ سانت کوتاه) ---
                    const bodyGroup = new THREE.Group();
                    
                    const panelThickness = thickness; // 1.6
                    const backPanelThickness = 0.3;   // ضخامت فیبر (3 میل)
                    const grooveDepth = 0.7;          // عمق شیار دیواره‌ها (7 میل)
                    const backInset = 1.7;            // فاصله از پشت (17 میل)
                    
                    const W = c.w;
                    const H = c.h;
                    const D = c.d;

                    const _intMat = (typeof this.createInteriorMaterials === 'function') ? this.createInteriorMaterials() : null;
                    const whiteMat = _intMat ? _intMat.whiteMat : new THREE.MeshStandardMaterial({ color: 0xe8e6e3, roughness: 0.62 });
                    const backMat  = _intMat ? _intMat.backMat  : new THREE.MeshStandardMaterial({ color: 0xd4d2cf, roughness: 0.75 });

                    // ۱ و ۲. دیواره چپ/راست با زاویه کناری
                    {
                        const _sm = (typeof this.getSideAngleMetrics === 'function')
                            ? this.getSideAngleMetrics(c)
                            : { radL: 0, radR: 0 };
                        const radL = _sm.radL, radR = _sm.radR;
                        const leftLen = D / Math.max(0.25, Math.cos(radL));
                        const rightLen = D / Math.max(0.25, Math.cos(radR));
                        const leftPivot = new THREE.Group();
                        leftPivot.position.set(-W / 2 + panelThickness / 2, 0, -D / 2);
                        leftPivot.rotation.y = radL;
                        const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, H, leftLen), whiteMat);
                        leftMesh.position.set(0, 0, leftLen / 2);
                        leftPivot.add(leftMesh);
                        bodyGroup.add(leftPivot);
                        const rightPivot = new THREE.Group();
                        rightPivot.position.set(W / 2 - panelThickness / 2, 0, -D / 2);
                        rightPivot.rotation.y = radR;
                        const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, H, rightLen), whiteMat);
                        rightMesh.position.set(0, 0, rightLen / 2);
                        rightPivot.add(rightMesh);
                        bodyGroup.add(rightPivot);
                    }

                    // ۳. سقف (بین دو دیواره، ۲ سانت کوتاه‌تر از عقب)
                    const shortDepth = D - 2.0; 
                    const topGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, shortDepth);
                    const topMesh = new THREE.Mesh(topGeo, whiteMat);
                    topMesh.position.x = 0;
                    topMesh.position.y = H / 2 - panelThickness / 2;
                    // مماس با جلو: (1.0 = مرکز قطعه‌ای که 2 سانت کوتاه شده و به جلو چسبیده)
                    topMesh.position.z = 1.0; 
                    bodyGroup.add(topMesh);

                    // ۴. کف (بین دو دیواره، ۲ سانت کوتاه‌تر از عقب، دقیقاً مثل سقف)
                    const bottomGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, shortDepth);
                    const bottomMesh = new THREE.Mesh(bottomGeo, whiteMat);
                    bottomMesh.position.x = 0;
                    bottomMesh.position.y = -H / 2 + panelThickness / 2;
                    bottomMesh.position.z = 1.0; // مماس با جلو
                    bodyGroup.add(bottomMesh);

                    // ۵. فیبر پشت ۳ میل
                    // عرض: بین دو دیواره + (۲ تا ۷ میل شیار)
                    const backWidth = (W - 2 * panelThickness) + (2 * grooveDepth);
                    
                    // ارتفاع: چون سقف و کف به فیبر نمی‌رسند (۲ سانت جلوتر تمام می‌شوند)،
                    // فیبر می‌تواند کل ارتفاع را بپوشاند. ما 4 میل (از بالا 2 و از پایین 2 میل) 
                    // کوتاهتر می‌گیریم که بیرون‌زدگی نداشته باشد.
                    const backHeight = H - 0.4;
                    
                    const backGeo = new THREE.BoxGeometry(backWidth, backHeight, backPanelThickness);
                    const backMesh = new THREE.Mesh(backGeo, backMat);
                    
                    backMesh.position.x = 0;
                    backMesh.position.y = 0; // دقیقاً وسط قرار می‌گیرد
                    
                    // موقعیت محور Z: 17 میل از لبه پشت کابینت فاصله دارد
                    backMesh.position.z = -D / 2 + backInset + (backPanelThickness / 2);
                    
                    bodyGroup.add(backMesh);

                    group.add(bodyGroup);
                    
                    this.createDoorSystem(group, c, doorMat);
                    this.createShelves(group, c);
                    if (typeof this.createUnderCabinetLight === 'function') this.createUnderCabinetLight(group, c);
                                       } else if (c.type === 'wall' && c.isDishRack) {
                    // --- ساختار کابینت آب‌چکان (بدون کف + فیبر داینامیک) ---
                    const bodyGroup = new THREE.Group();
                    
                    const panelThickness = thickness; // 1.6
                    const backPanelThickness = 0.3;   // ضخامت فیبر (3 میل)
                    const grooveDepth = 0.7;          // عمق شیار دیواره‌ها (7 میل)
                    const backInset = 1.7;            // فاصله از پشت (17 میل)
                    
                    const W = c.w;
                    const H = c.h;
                    const D = c.d;

                    const _intMat = (typeof this.createInteriorMaterials === 'function') ? this.createInteriorMaterials() : null;
                    const whiteMat = _intMat ? _intMat.whiteMat : new THREE.MeshStandardMaterial({ color: 0xe8e6e3, roughness: 0.62 });
                    const backMat  = _intMat ? _intMat.backMat  : new THREE.MeshStandardMaterial({ color: 0xd4d2cf, roughness: 0.75 });

                    // ۱ و ۲. دیواره چپ/راست با زاویه کناری
                    {
                        const _sm = (typeof this.getSideAngleMetrics === 'function')
                            ? this.getSideAngleMetrics(c)
                            : { radL: 0, radR: 0 };
                        const radL = _sm.radL, radR = _sm.radR;
                        const leftLen = D / Math.max(0.25, Math.cos(radL));
                        const rightLen = D / Math.max(0.25, Math.cos(radR));
                        const leftPivot = new THREE.Group();
                        leftPivot.position.set(-W / 2 + panelThickness / 2, 0, -D / 2);
                        leftPivot.rotation.y = radL;
                        const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, H, leftLen), whiteMat);
                        leftMesh.position.set(0, 0, leftLen / 2);
                        leftPivot.add(leftMesh);
                        bodyGroup.add(leftPivot);
                        const rightPivot = new THREE.Group();
                        rightPivot.position.set(W / 2 - panelThickness / 2, 0, -D / 2);
                        rightPivot.rotation.y = radR;
                        const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, H, rightLen), whiteMat);
                        rightMesh.position.set(0, 0, rightLen / 2);
                        rightPivot.add(rightMesh);
                        bodyGroup.add(rightPivot);
                    }

                    // ۳. سقف (بین دو دیواره، ۲ سانت کوتاه‌تر از عقب)
                    const shortDepth = D - 2.0; 
                    const topGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, shortDepth);
                    const topMesh = new THREE.Mesh(topGeo, whiteMat);
                    topMesh.position.x = 0;
                    topMesh.position.y = H / 2 - panelThickness / 2;
                    topMesh.position.z = 1.0; // مماس با جلو
                    bodyGroup.add(topMesh);

                    // ❌ کف پایین حذف شد! (هیچ کدی برای کف نوشته نمی‌شود)

                    // ۴. محاسبه و ساخت فیبر پشت ۳ میل (متصل به طبقات)
                    // الف) ابتدا پایین‌ترین طبقه را پیدا می‌کنیم:
                    let lowestShelfH = H - panelThickness; // اگر طبقه‌ای نبود، فیبر تا بالا می‌رود و محو می‌شود
                    
                    if (c.shelves && c.shelves.length > 0) {
                        // فقط طبقاتی که در محدوده منطقی هستند را فیلتر می‌کنیم
                        const validShelves = c.shelves.filter(s => s.height > 0 && s.height < H);
                        if (validShelves.length > 0) {
                            // پیدا کردن کمترین ارتفاع (نزدیک‌ترین به پایین)
                            lowestShelfH = Math.min(...validShelves.map(s => s.height));
                        }
                    }

                    // عرض فیبر: بین دو دیواره + (۲ تا ۷ میل شیار)
                    const backWidth = (W - 2 * panelThickness) + (2 * grooveDepth);
                    
                    // محاسبه مختصات بالا و پایین فیبر
                    const topY = H / 2 - 0.2; // 2 میل پایین‌تر از سقف
                    const bottomY = -H / 2 + lowestShelfH; // روی ارتفاع پایین‌ترین طبقه
                    
                    let backHeight = topY - bottomY;

                    // اگر ارتفاع فیبر از صفر بیشتر بود، آن را رسم می‌کنیم
                    if (backHeight > 0.1) {
                        const backGeo = new THREE.BoxGeometry(backWidth, backHeight, backPanelThickness);
                        const backMesh = new THREE.Mesh(backGeo, backMat);
                        
                        backMesh.position.x = 0;
                        // Y در مرکزِ فاصله بالا تا پایین قرار می‌گیرد
                        backMesh.position.y = bottomY + (backHeight / 2); 
                        backMesh.position.z = -D / 2 + backInset + (backPanelThickness / 2);
                        
                        bodyGroup.add(backMesh);
                    }

                    group.add(bodyGroup);
                    
                    this.createDoorSystem(group, c, doorMat);
                    this.createShelves(group, c);

                                       } else if (c.type === 'wall' && c.isHoodWrap) {
    // --- ساختار کلاف هود + نمای شماتیک هود ---
    const bodyGroup = new THREE.Group();
    const panelThickness = thickness; // 1.6
    
    const W = c.w;
    const H = c.h;
    const D = c.d;
    const currentUnitId = c.id || ''; // 🟢 جایگزین امن برای uId جهت جلوگیری از لوپ بی‌نهایت و خطا

    // 🎨 متریال کلاف هود + پرداخت سطح (مات/براق) جدا از جنس ورق
    const createWrapMaterial = (pieceLabel, fallbackVal, fallbackColor, finishKey) => {
        const fk = finishKey || 'matte';
        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(fk)
            : { roughness: 0.7, metalness: 0.02, envMapIntensity: 0.3, bumpScale: 0.08, clearcoat: 0 };

        let frontMap = null;
        let frontColor = null;
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin('anonymous');

        // ۱. بافت کات‌مستر
        if (window.isolatedDoorTextures && window.isolatedDoorTextures[pieceLabel]) {
            const cachedTex = textureLoader.load(window.isolatedDoorTextures[pieceLabel]);
            cachedTex.colorSpace = THREE.SRGBColorSpace;
            frontMap = cachedTex;
        } else {
            const finalVal = fallbackVal || fallbackColor;
            if (finalVal && (String(finalVal).includes('http') || String(finalVal).includes('assets/') || String(finalVal).includes('/') || String(finalVal).includes('.'))) {
                const tex = textureLoader.load(finalVal);
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.colorSpace = THREE.SRGBColorSpace;
                frontMap = tex;
            } else if (finalVal) {
                frontColor = finalVal;
            } else {
                frontColor = '#ffffff';
            }
        }

        if (typeof this.createFaceMaterials === 'function') {
            const faces = this.createFaceMaterials({
                frontMap: frontMap,
                frontColor: frontColor || '#FFFFFF',
                edgeColor: (frontColor && String(frontColor).startsWith('#')) ? frontColor : '#D4CFC4',
                finishType: fk,
                materialType: fk
            });
            return faces.boxArray;
        }

        const params = {
            roughness: preset.roughness,
            metalness: preset.metalness,
            envMapIntensity: preset.envMapIntensity || 0.3
        };
        if (frontMap) {
            params.map = frontMap;
            params.color = 0xffffff;
            if (preset.bumpScale) { params.bumpMap = (typeof window.asDataMapTexture === 'function') ? window.asDataMapTexture(frontMap) : frontMap; params.bumpScale = preset.bumpScale; }
        } else {
            try { params.color = new THREE.Color(frontColor || '#ffffff'); } catch (e) { params.color = 0xffffff; }
        }
        if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
            params.clearcoat = preset.clearcoat;
            params.clearcoatRoughness = preset.clearcoatRoughness || 0.05;
            return new THREE.MeshPhysicalMaterial(params);
        }
        return new THREE.MeshStandardMaterial(params);
    };

    // رنگ پیش‌فرض در صورت انتخاب نشدن متریال
    const defaultMatValue = c.doorColor || c.color || "#ffffff";
    const backFinish = c.hoodBackFinish || 'matte';
    const sidesFinish = c.hoodSidesFinish || 'matte';
    const ceilingFinish = c.hoodCeilingFinish || 'matte';
    
    // 🟢 ساخت متریال‌ها با کلیدِ نام قطعه + پرداخت سطح
    const backMat    = createWrapMaterial(`ورق پشت کلاف هود U${currentUnitId}`, c.hoodBackMaterialValue, defaultMatValue, backFinish);
    const sidesMat   = createWrapMaterial(`بدنه کناری کلاف هود U${currentUnitId}`, c.hoodSidesMaterialValue, defaultMatValue, sidesFinish);
    const ceilingMat = createWrapMaterial(`سقف کلاف هود U${currentUnitId}`, c.hoodCeilingMaterialValue, defaultMatValue, ceilingFinish);

    // ۱. ورق ۱۶ میل کامل پشت
    if (c.enableHoodBack !== false) {
        const backGeo = new THREE.BoxGeometry(W, H, panelThickness);
        const backMesh = new THREE.Mesh(backGeo, backMat);
        backMesh.position.set(0, 0, -D / 2 + panelThickness / 2);
        bodyGroup.add(backMesh);
    }

    const sideDepth = D - panelThickness;

    // ۲. دو تا ۱۶ قدی (چپ و راست)
    if (c.enableHoodSides !== false) {
        const sideGeo = new THREE.BoxGeometry(panelThickness, H, sideDepth);
        
        const leftMesh = new THREE.Mesh(sideGeo, sidesMat);
        leftMesh.position.set(-W / 2 + panelThickness / 2, 0, panelThickness / 2); 
        bodyGroup.add(leftMesh);

        const rightMesh = new THREE.Mesh(sideGeo, sidesMat);
        rightMesh.position.set(W / 2 - panelThickness / 2, 0, panelThickness / 2);
        bodyGroup.add(rightMesh);
    }

    const topW = W - (2 * panelThickness);

    // ۳. ورق ۱۶ میل سقف (ثابت در بالاترین بخش کلاف)
    if (c.enableHoodCeiling !== false) {
        const topGeo = new THREE.BoxGeometry(topW, panelThickness, sideDepth);
        const topMesh = new THREE.Mesh(topGeo, ceilingMat);
        topMesh.position.set(0, H / 2 - panelThickness / 2, panelThickness / 2); 
        bodyGroup.add(topMesh);
    }

    // -----------------------------------------------------
    // ۴. ساختار شماتیک هود فلزی (تابعِ تغییر سایز داینامیک)
    if (c.showMetalHood !== false) {
        const hoodMat = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            metalness: 0.7, 
            roughness: 0.2 
        });

        // الف) صفحه مکش و فیلتر (۵ سانتی‌متر ثابت)
        const hoodBaseW = topW - 0.2; 
        const hoodBaseH = 5.0; 
        const hoodBaseD = sideDepth - 2.0; 
        
        const hoodBaseGeo = new THREE.BoxGeometry(hoodBaseW, hoodBaseH, hoodBaseD);
        const hoodBaseMesh = new THREE.Mesh(hoodBaseGeo, hoodMat);
        hoodBaseMesh.position.set(0, -H / 2 + hoodBaseH / 2, panelThickness / 2);
        bodyGroup.add(hoodBaseMesh);

        // ب) تغییر سایز داینامیک ارتفاع کل هود بر اساس فیلد پنل تنظیمات
        const totalHoodHeightInput = c.hoodCeilingHeight !== undefined ? parseFloat(c.hoodCeilingHeight) : 40;
        
        // ارتفاع بخش دودکش = ارتفاع کل خواسته شده منهای ۵ سانتی‌مترِ پایه هود
        const chimneyH = Math.max(1.0, totalHoodHeightInput - hoodBaseH); 
        const chimneyD = hoodBaseD * 0.6; 
        const chimneyW = W * 0.5; 
        
        const chimneyGeo = new THREE.BoxGeometry(chimneyW, chimneyH, chimneyD);
        const chimneyMesh = new THREE.Mesh(chimneyGeo, hoodMat);
        
        // مماس شدن دقیق روی صفحه پایه فیلتر
        chimneyMesh.position.y = hoodBaseMesh.position.y + hoodBaseH / 2 + chimneyH / 2; 
        chimneyMesh.position.z = panelThickness / 2 - hoodBaseD / 2 + chimneyD / 2; 
        bodyGroup.add(chimneyMesh);
    }
    // -----------------------------------------------------

    group.add(bodyGroup);
    
    if (typeof this.createShelves === 'function') {
        this.createShelves(group, c);
    }
}





else if (c.type === 'wall' && c.isHiddenHood) {
                    // --- ساختار کابینت دیواری: بدنه هود مخفی ---
                    const bodyGroup = new THREE.Group();
                    
                    const panelThickness = thickness; // 1.6
                    const backPanelThickness = 0.3;   // ضخامت فیبر پشت
                    const grooveDepth = 0.7;          // عمق شیار
                    const backInset = 1.7;            // فاصله فیبر از لبه پشت
                    
                    const W = c.w;
                    const H = c.h;
                    const D = c.d;

                    const _intMat2 = (typeof this.createInteriorMaterials === 'function') ? this.createInteriorMaterials() : null;
                    const whiteMat = _intMat2 ? _intMat2.whiteMat : new THREE.MeshStandardMaterial({ color: 0xe8e6e3, roughness: 0.62 });
                    const backMat  = _intMat2 ? _intMat2.backMat  : new THREE.MeshStandardMaterial({ color: 0xd4d2cf, roughness: 0.75 });

                    // ۱ و ۲. پانل بغل چپ/راست (با زاویه کناری در صورت وجود)
                    {
                        const _sm = (typeof this.getSideAngleMetrics === 'function')
                            ? this.getSideAngleMetrics(c)
                            : { radL: 0, radR: 0 };
                        const radL = _sm.radL, radR = _sm.radR;
                        const leftLen = D / Math.max(0.25, Math.cos(radL));
                        const rightLen = D / Math.max(0.25, Math.cos(radR));
                        const leftPivot = new THREE.Group();
                        leftPivot.position.set(-W / 2 + panelThickness / 2, 0, -D / 2);
                        leftPivot.rotation.y = radL;
                        const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, H, leftLen), whiteMat);
                        leftMesh.position.set(0, 0, leftLen / 2);
                        leftPivot.add(leftMesh);
                        bodyGroup.add(leftPivot);
                        const rightPivot = new THREE.Group();
                        rightPivot.position.set(W / 2 - panelThickness / 2, 0, -D / 2);
                        rightPivot.rotation.y = radR;
                        const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, H, rightLen), whiteMat);
                        rightMesh.position.set(0, 0, rightLen / 2);
                        rightPivot.add(rightMesh);
                        bodyGroup.add(rightPivot);
                    }

                    // ۳. پانل کف (کف کابینت که هود روی آن/زیر آن نصب می‌شود)
                    const bottomGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, D);
                    const bottomMesh = new THREE.Mesh(bottomGeo, whiteMat);
                    bottomMesh.position.x = 0;
                    bottomMesh.position.y = -H / 2 + panelThickness / 2;
                    bodyGroup.add(bottomMesh);

                    // ۴. پانل سقف
                    const topDepth = D - 2.0;
                    const topGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, topDepth);
                    const topMesh = new THREE.Mesh(topGeo, whiteMat);
                    topMesh.position.x = 0;
                    topMesh.position.y = H / 2 - panelThickness / 2;
                    topMesh.position.z = 1.0; 
                    bodyGroup.add(topMesh);

                    // ۵. فیبر پشت ۳ میل
                    const backWidth = (W - 2 * panelThickness) + (2 * grooveDepth);
                    const bottomGrooveY = -H / 2 + panelThickness - grooveDepth; 
                    const topEdgeY = H / 2 - 0.2; 
                    const backHeight = topEdgeY - bottomGrooveY;

                    const backGeo = new THREE.BoxGeometry(backWidth, backHeight, backPanelThickness);
                    const backMesh = new THREE.Mesh(backGeo, backMat);
                    backMesh.position.x = 0;
                    backMesh.position.y = bottomGrooveY + (backHeight / 2);
                    backMesh.position.z = -D / 2 + backInset + (backPanelThickness / 2);
                    bodyGroup.add(backMesh);

                    // ۶. اضافه کردن شبیه‌ساز هود مخفی
                    const hoodMat = new THREE.MeshStandardMaterial({ 
                        color: 0x888888, 
                        metalness: 0.7, 
                        roughness: 0.2 
                    });

                    // الف) صفحه فیلتر هود (۱ سانت بیرون‌زدگی از زیر کف)
                    const hoodBaseW = (W - 2 * panelThickness) * 0.8; // عرض فیلتر هود
                    const hoodBaseD = D * 0.6; // عمق فیلتر هود
                    const hoodBaseH = 1.0; // ۱ سانتی‌متر ضخامت (بیرون‌زدگی)
                    
                    const hoodBaseGeo = new THREE.BoxGeometry(hoodBaseW, hoodBaseH, hoodBaseD);
                    const hoodBaseMesh = new THREE.Mesh(hoodBaseGeo, hoodMat);
                    hoodBaseMesh.position.x = 0;
                    // مماس با زیر کف کابینت و ۱ سانت پایین‌تر
                    hoodBaseMesh.position.y = -H / 2 - hoodBaseH / 2; 
                    // قرارگیری در نیمه جلویی کف
                    hoodBaseMesh.position.z = D / 4 - hoodBaseD / 2 + 1.0; 
                    bodyGroup.add(hoodBaseMesh);

                    // ب) موتور/بدنه داخلی هود (که داخل کابینت جا می‌گیرد)
                    const motorW = hoodBaseW * 0.85;
                    const motorD = hoodBaseD * 0.85;
                    const motorH = H * 0.45; // حدود نصف ارتفاع کابینت را پر می‌کند
                    
                    const motorGeo = new THREE.BoxGeometry(motorW, motorH, motorD);
                    const motorMesh = new THREE.Mesh(motorGeo, hoodMat);
                    motorMesh.position.x = 0;
                    // قرارگیری روی کف به سمت بالا (داخل فضای کابینت)
                    motorMesh.position.y = -H / 2 + panelThickness + motorH / 2;
                    motorMesh.position.z = hoodBaseMesh.position.z;
                    bodyGroup.add(motorMesh);

                    group.add(bodyGroup);
                    
                    // درب و طبقات روی این مدل هم اعمال می‌شوند تا بتواند درب داشته باشد
                    this.createDoorSystem(group, c, doorMat);
                    this.createShelves(group, c);
}


 
                                else if (c.type === 'wall') {
                    // --- ساختار نهایی و استاندارد کابینت دیواری ---
                    const bodyGroup = new THREE.Group();
                    
                    const panelThickness = thickness; // 1.6 (ضخامت ورق)
                    const backPanelThickness = 0.3;   // ضخامت فیبر پشت (3 میل)
                    const grooveDepth = 0.7;          // عمق شیار (7 میلی‌متر)
                    const backInset = 1.7;            // فاصله فیبر از لبه پشت (17 میل)
                    
                    const W = c.w;
                    const H = c.h;
                    const D = c.d;

                    // ==========================================================
                    // متریال‌های نهایی
                    // ==========================================================
                    const _intMat3 = (typeof this.createInteriorMaterials === 'function') ? this.createInteriorMaterials() : null;
                    const whiteMat = _intMat3 ? _intMat3.whiteMat : new THREE.MeshStandardMaterial({ color: 0xe8e6e3, roughness: 0.62 });
                    const backMat  = _intMat3 ? _intMat3.backMat  : new THREE.MeshStandardMaterial({ color: 0xd4d2cf, roughness: 0.75 });

                    // ۱ و ۲. پانل بغل چپ/راست (با زاویه کناری در صورت وجود)
                    {
                        const _sm = (typeof this.getSideAngleMetrics === 'function')
                            ? this.getSideAngleMetrics(c)
                            : { radL: 0, radR: 0 };
                        const radL = _sm.radL, radR = _sm.radR;
                        const leftLen = D / Math.max(0.25, Math.cos(radL));
                        const rightLen = D / Math.max(0.25, Math.cos(radR));
                        const leftPivot = new THREE.Group();
                        leftPivot.position.set(-W / 2 + panelThickness / 2, 0, -D / 2);
                        leftPivot.rotation.y = radL;
                        const leftMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, H, leftLen), whiteMat);
                        leftMesh.position.set(0, 0, leftLen / 2);
                        leftPivot.add(leftMesh);
                        bodyGroup.add(leftPivot);
                        const rightPivot = new THREE.Group();
                        rightPivot.position.set(W / 2 - panelThickness / 2, 0, -D / 2);
                        rightPivot.rotation.y = radR;
                        const rightMesh = new THREE.Mesh(new THREE.BoxGeometry(panelThickness, H, rightLen), whiteMat);
                        rightMesh.position.set(0, 0, rightLen / 2);
                        rightPivot.add(rightMesh);
                        bodyGroup.add(rightPivot);
                    }

                    // ۳. پانل کف (بین دو بغل، عمق کامل)
                    const bottomGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, D);
                    const bottomMesh = new THREE.Mesh(bottomGeo, whiteMat);
                    bottomMesh.position.x = 0;
                    bottomMesh.position.y = -H / 2 + panelThickness / 2;
                    bodyGroup.add(bottomMesh);

                    // ۴. پانل سقف (بین دو بغل، 2 سانت کوتاهتر در عمق)
                    const topDepth = D - 2.0;
                    const topGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, topDepth);
                    const topMesh = new THREE.Mesh(topGeo, whiteMat);
                    topMesh.position.x = 0;
                    topMesh.position.y = H / 2 - panelThickness / 2;
                    // قرارگیری مماس با جلو: لبه جلوی کابینت D/2 است. مرکز قطعه سقف باید محاسبه شود
                    topMesh.position.z = 1.0; 
                    bodyGroup.add(topMesh);

                    // ۵. فیبر پشت ۳ میل
                    // عرض: بین دو دیواره + (۲ تا ۷ میل شیار)
                    const backWidth = (W - 2 * panelThickness) + (2 * grooveDepth);
                    
                    // ارتفاع: پایین 7 میل تو میره، بالا هم 2 میل کوتاهتر از لبه سقف
                    // کف شیار پایین کجاست؟ لبه بالایی کف (-H/2 + 1.6) منهای 7 میل (- 0.7)
                    const bottomGrooveY = -H / 2 + panelThickness - grooveDepth; 
                    // لبه بالایی فیبر: 2 میل پایین تر از بالاترین نقطه کابینت (H/2 - 0.2)
                    const topEdgeY = H / 2 - 0.2; 
                    const backHeight = topEdgeY - bottomGrooveY;

                    const backGeo = new THREE.BoxGeometry(backWidth, backHeight, backPanelThickness);
                    const backMesh = new THREE.Mesh(backGeo, backMat);
                    
                    backMesh.position.x = 0;
                    backMesh.position.y = bottomGrooveY + (backHeight / 2);
                    // موقعیت محور Z: لبه پشت کابینت -D/2 است. فیبر 17 میل میاد جلوتر
                    backMesh.position.z = -D / 2 + backInset + (backPanelThickness / 2);
                    
                    bodyGroup.add(backMesh);

                    group.add(bodyGroup);
                    
                    this.createDoorSystem(group, c, doorMat);
                    this.createShelves(group, c);
                    if (typeof this.createUnderCabinetLight === 'function') this.createUnderCabinetLight(group, c);
                }


else {
                    // --- بدنه واقعی یونیت (سیستم Body) برای سایر انواع ---
                    // Left / Right / Top / Bottom / Back — دیگر فضای خالی ساده نیست
                    if (typeof this.createUnitBody === 'function') {
                        this.createUnitBody(group, c, {
                            panelThickness: thickness,
                            bodyMat: bodyMat
                        });
                    } else {
                        // فالبک بسیار نادر
                        const innerW = c.w - 2 * thickness;
                        const innerH = c.h - 2 * thickness;
                        const innerD = c.d - thickness;
                        const back = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, thickness), bodyMat);
                        back.position.z = -innerD / 2; group.add(back);
                        const top = new THREE.Mesh(new THREE.BoxGeometry(c.w, thickness, innerD), bodyMat);
                        top.position.y = innerH / 2; group.add(top);
                        const bottom = new THREE.Mesh(new THREE.BoxGeometry(c.w, thickness, innerD), bodyMat);
                        bottom.position.y = -innerH / 2; group.add(bottom);
                        const left = new THREE.Mesh(new THREE.BoxGeometry(thickness, innerH, innerD), bodyMat);
                        left.position.x = -innerW / 2; group.add(left);
                        const right = new THREE.Mesh(new THREE.BoxGeometry(thickness, innerH, innerD), bodyMat);
                        right.position.x = innerW / 2; group.add(right);
                    }

                    this.createDoorSystem(group, c, doorMat);
                    this.createShelves(group, c);
                }
            }


            // ==========================================================
            // ۴. سیستم پاخور واقعی
            // ارتفاع + عقب‌رفتگی + ضخامت ۱۶ میل + Bevel ظریف
            // نتیجه: زیر کابینت سایه می‌افتد و بدنه روی زمین «کاشته» نمی‌شود
            // ==========================================================
              if (!c.isAppliance && c.kickboard && c.kickboard.enabled && (c.y < 60 || c.elevation < 50)) {
    const kbH = parseFloat(c.kickboard.height) || 14;
    const thick = 1.6; // ضخامت ورق پاخور ۱۶ میل
    // عقب‌رفتگی از لبه جلوی کابینت (پیش‌فرض ۵ سانت — جای پا)
    // توجه: recess=0 معتبر است — از || استفاده نکن (۰ را به ۵ تبدیل می‌کرد)
    let recess = 0;
    if (c.kickboard.recess !== undefined && c.kickboard.recess !== null && c.kickboard.recess !== '') {
        const r = parseFloat(c.kickboard.recess);
        if (Number.isFinite(r)) recess = r;
    }
    const yPos = -c.h / 2 - kbH / 2;

    const sides = c.kickboard.sides || { front: true, back: false, left: false, right: false };
    const currentId = c.id || c.uId || "";

    // پرداخت سطح پاخور (جدا از جنس ورق رنگ)
    const kickFinishKey = (c.kickboard && c.kickboard.finish) ? c.kickboard.finish : 'matte';

    const createKickboardMaterial = (pieceLabel) => {
        let frontMap = null;
        let frontColor = null;

        if (window.isolatedDoorTextures && window.isolatedDoorTextures[pieceLabel]) {
            const base64Data = window.isolatedDoorTextures[pieceLabel];
            const tex = new THREE.TextureLoader().load(base64Data);
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            frontMap = tex;
        } else if (c.kickboard.color) {
            const val = c.kickboard.color;
            if (typeof val === 'string' && val.startsWith('#')) {
                frontColor = val;
            } else if (typeof val === 'string') {
                const tex = new THREE.TextureLoader().load(val);
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(c.w / 80, kbH / 80);
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
                frontMap = tex;
            }
        }

        // متریال با پرداخت نور واقعی
        if (typeof this.createFaceMaterials === 'function') {
            const faces = this.createFaceMaterials({
                frontMap: frontMap,
                frontColor: frontColor || '#8B4513',
                edgeColor: (frontColor && frontColor.startsWith('#')) ? frontColor : '#D4CFC4',
                backColor: frontColor || '#8B4513',
                finishType: kickFinishKey,
                materialType: kickFinishKey
            });
            return faces; // { front, edge, back, boxArray }
        }

        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(kickFinishKey)
            : { roughness: 0.7, metalness: 0.02 };
        const kickMat = new THREE.MeshStandardMaterial({
            map: frontMap || null,
            color: frontMap ? 0xffffff : (frontColor || '#8B4513'),
            roughness: preset.roughness,
            metalness: preset.metalness,
            envMapIntensity: preset.envMapIntensity || 0.3
        });
        return { front: kickMat, edge: kickMat, back: kickMat, boxArray: kickMat };
    };

    // ساخت مش پاخور با Bevel/Edge در صورت وجود سیستم پنل
    const makeKickMesh = (w, h, d, matOrFaces) => {
        let mesh;
        let matInput = matOrFaces;
        if (matOrFaces && matOrFaces.boxArray) {
            matInput = matOrFaces.boxArray;
        } else if (matOrFaces && matOrFaces.isMaterial) {
            matInput = matOrFaces;
        }
        if (typeof this.createPanelMesh === 'function') {
            mesh = this.createPanelMesh(w, h, d, matInput, 0.08);
        } else {
            mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matInput);
        }
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.kickFinish = kickFinishKey;
        return mesh;
    };

    // عرض پاخور جلو/عقب: کمی کوتاه‌تر اگر کناره‌ها فعال باشند تا گوشه دوبل نشود
    const sideInset = thick; // هم‌پوشانی گوشه با پاخور کناری

    // جلو — عقب‌رفته از لبه کابینت تا سایه زیر بدنه دیده شود
    if (sides.front) {
        const label = `پاخور جلو U${currentId}`;
        const mat = createKickboardMaterial(label);
        const frontW = c.w - (sides.left ? sideInset : 0) - (sides.right ? sideInset : 0);
        const kbFront = makeKickMesh(Math.max(1, frontW), kbH, thick, mat);
        const xOff = ((sides.left ? sideInset / 2 : 0) - (sides.right ? sideInset / 2 : 0));
        kbFront.position.set(xOff, yPos, c.d / 2 - recess - thick / 2);
        kbFront.userData.isKickboard = true;
        kbFront.userData.label = label;
        group.add(kbFront);
    }

    // عقب
    if (sides.back) {
        const label = `پاخور عقب U${currentId}`;
        const mat = createKickboardMaterial(label);
        const backW = c.w - (sides.left ? sideInset : 0) - (sides.right ? sideInset : 0);
        const kbBack = makeKickMesh(Math.max(1, backW), kbH, thick, mat);
        const xOff = ((sides.left ? sideInset / 2 : 0) - (sides.right ? sideInset / 2 : 0));
        kbBack.position.set(xOff, yPos, -c.d / 2 + thick / 2);
        kbBack.userData.isKickboard = true;
        kbBack.userData.label = label;
        group.add(kbBack);
    }

    // چپ — عمق تا خط عقب‌رفتگی جلو
    if (sides.left) {
        const label = `پاخور چپ U${currentId}`;
        const mat = createKickboardMaterial(label);
        const sideDepth = Math.max(1, c.d - recess);
        const kbLeft = makeKickMesh(thick, kbH, sideDepth, mat);
        kbLeft.position.set(-c.w / 2 + thick / 2, yPos, -recess / 2);
        kbLeft.userData.isKickboard = true;
        kbLeft.userData.label = label;
        group.add(kbLeft);
    }

    // راست
    if (sides.right) {
        const label = `پاخور راست U${currentId}`;
        const mat = createKickboardMaterial(label);
        const sideDepth = Math.max(1, c.d - recess);
        const kbRight = makeKickMesh(thick, kbH, sideDepth, mat);
        kbRight.position.set(c.w / 2 - thick / 2, yPos, -recess / 2);
        kbRight.userData.isKickboard = true;
        kbRight.userData.label = label;
        group.add(kbRight);
    }
}



            // ==========================================================
            // ۵. تاج کابینت (با شرط جلوگیری از رسم برای لوازم خانگی)
            // ==========================================================
  const isWallCabinet = c.position === 'wall' || (c.elevation && c.elevation > 100) || c.isFridgeWrap || c.h > 180;

if (!c.isAppliance && (isWallCabinet || c.isCoffeeBar) && c.crown && c.crown.enabled !== false) {
    const crownHeight = c.crown.height || 5; 
    const proj = c.crown.projection || 0; 
    const thick = 1.6; 
    const sides = c.crown.sides || { front: true, back: false, left: true, right: true };

    // پرداخت سطح تاج (جدا از جنس ورق / رنگ)
    const crownFinishKey = (c.crown && c.crown.finish) ? c.crown.finish : 'matte';

    const getCrownMaterialForPiece = (pieceLabel) => {
        let frontMap = null;
        let frontColor = null;

        if (window.isolatedDoorTextures && window.isolatedDoorTextures[pieceLabel]) {
            const loader = new THREE.TextureLoader();
            loader.setCrossOrigin('anonymous');
            const isolatedTex = loader.load(window.isolatedDoorTextures[pieceLabel]);
            if (typeof THREE.SRGBColorSpace !== 'undefined') {
                isolatedTex.colorSpace = THREE.SRGBColorSpace;
            } 
            isolatedTex.wrapS = THREE.ClampToEdgeWrapping;
            isolatedTex.wrapT = THREE.ClampToEdgeWrapping;
            frontMap = isolatedTex;
        } else if (c.crown.color) {
            const value = c.crown.color;
            if (typeof value === 'string' && value.startsWith('#')) {
                frontColor = value;
            } else if (typeof value === 'string') {
                const loader = new THREE.TextureLoader();
                loader.setCrossOrigin('anonymous');
                const texture = loader.load(value);
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(c.w / 80, crownHeight / 80);
                if (typeof THREE.SRGBColorSpace !== 'undefined') {
                    texture.colorSpace = THREE.SRGBColorSpace;
                } 
                frontMap = texture;
            }
        }

        if (typeof this.createFaceMaterials === 'function') {
            const faces = this.createFaceMaterials({
                frontMap: frontMap,
                frontColor: frontColor || '#ffffff',
                edgeColor: (frontColor && frontColor.startsWith('#')) ? frontColor : '#D4CFC4',
                backColor: frontColor || '#ffffff',
                finishType: crownFinishKey,
                materialType: crownFinishKey
            });
            return faces.boxArray;
        }

        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(crownFinishKey)
            : { roughness: 0.7, metalness: 0.02, envMapIntensity: 0.3 };
        const mat = new THREE.MeshStandardMaterial({
            map: frontMap || null,
            color: frontMap ? 0xffffff : (frontColor || '#ffffff'),
            roughness: preset.roughness,
            metalness: preset.metalness,
            envMapIntensity: preset.envMapIntensity || 0.3
        });
        return mat;
    };

    let topEdgeY;
    if (c.isFridgeWrap) {
        const bY = c.bridgeY !== undefined ? parseFloat(c.bridgeY) : (c.h - (c.bridgeH || 40));
        const bH = c.bridgeH ? parseFloat(c.bridgeH) : 40;
        topEdgeY = (-c.h / 2) + bY + bH;
    } else {
        topEdgeY = (c.h / 2);
    }

    const topY = topEdgeY + (crownHeight / 2);
    const cabinetId = c.id; 

    // الف) تاج جلو
    if (sides.front) {
        const geo = new THREE.BoxGeometry(c.w, crownHeight, thick);
        const label = `تاج جلو U${cabinetId}`;
        const mesh = new THREE.Mesh(geo, getCrownMaterialForPiece(label));
        mesh.position.set(0, topY, (c.d / 2) + proj + (thick / 2));
        mesh.userData.isCrown = true;
        mesh.userData.pieceLabel = label; // 🟢 ذخیره برچسب برای لایه آپدیت
        group.add(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    // ب) تاج عقب
    if (sides.back) {
        const geo = new THREE.BoxGeometry(c.w, crownHeight, thick);
        const label = `تاج عقب U${cabinetId}`;
        const mesh = new THREE.Mesh(geo, getCrownMaterialForPiece(label));
        mesh.position.set(0, topY, -c.d / 2 - thick / 2);
        mesh.userData.isCrown = true;
        mesh.userData.pieceLabel = label;
        group.add(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    // ج) تاج چپ
    if (sides.left) {
        const extraFront = sides.front ? (thick + proj) : 0;
        const totalDepth = c.d + extraFront + (sides.back ? thick : 0);
        const geo = new THREE.BoxGeometry(thick, crownHeight, totalDepth);
        const label = `تاج چپ U${cabinetId}`;
        const mesh = new THREE.Mesh(geo, getCrownMaterialForPiece(label));
        mesh.position.set(-c.w / 2 + thick / 2, topY, proj / 2);
        mesh.userData.isCrown = true;
        mesh.userData.pieceLabel = label;
        group.add(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    // د) تاج راست
    if (sides.right) {
        const extraFront = sides.front ? (thick + proj) : 0;
        const totalDepth = c.d + extraFront + (sides.back ? thick : 0);
        const geo = new THREE.BoxGeometry(thick, crownHeight, totalDepth);
        const label = `تاج راست U${cabinetId}`;
        const mesh = new THREE.Mesh(geo, getCrownMaterialForPiece(label));
        mesh.position.set(c.w / 2 - thick / 2, topY, proj / 2);
        mesh.userData.isCrown = true;
        mesh.userData.pieceLabel = label;
        group.add(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    // ۵. زیر تاج
    if (proj > 0 && sides.front) {
        const bottomDepth = proj + thick; 
        const bottomWidth = c.w - (sides.left ? thick : 0) - (sides.right ? thick : 0);
        const bottomGeo = new THREE.BoxGeometry(bottomWidth, 1.6, bottomDepth);
        const label = `زیر تاج U${cabinetId}`;
        const bottomMesh = new THREE.Mesh(bottomGeo, getCrownMaterialForPiece(label));
        const posY = topEdgeY + (1.6 / 2);
        const posZ = (c.d / 2) + (proj / 2);
        bottomMesh.position.set(0, posY, posZ);
        bottomMesh.userData.isCrown = true; 
        bottomMesh.userData.pieceLabel = label;
        group.add(bottomMesh);
        bottomMesh.castShadow = true;
        bottomMesh.receiveShadow = true;
    }

    // ۶. قیدهای اتصال داخلی ۵ سانتی‌متری
    const supportThick = 1.6;
    const supportWidth = 5.0;

    if (sides.front) {
        const geo = new THREE.BoxGeometry(c.w - (sides.left ? thick : 0) - (sides.right ? thick : 0), supportThick, supportWidth);
        const label = `قید اتصال تاج جلو U${cabinetId}`;
        const mesh = new THREE.Mesh(geo, getCrownMaterialForPiece(label));
        mesh.position.set(0, topEdgeY + (supportThick / 2), (c.d / 2) - (supportWidth / 2));
        mesh.userData.isCrown = true;
        mesh.userData.pieceLabel = label;
        group.add(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    if (sides.left) {
        const geo = new THREE.BoxGeometry(supportWidth, supportThick, c.d - (sides.front ? supportWidth : 0));
        const label = `قید اتصال تاج چپ U${cabinetId}`;
        const mesh = new THREE.Mesh(geo, getCrownMaterialForPiece(label));
        const zPos = sides.front ? (-supportWidth / 2) : 0;
        mesh.position.set(-c.w / 2 + thick + (supportWidth / 2), topEdgeY + (supportThick / 2), zPos);
        mesh.userData.isCrown = true;
        mesh.userData.pieceLabel = label;
        group.add(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    if (sides.right) {
        const geo = new THREE.BoxGeometry(supportWidth, supportThick, c.d - (sides.front ? supportWidth : 0));
        const label = `قید اتصال تاج راست U${cabinetId}`;
        const mesh = new THREE.Mesh(geo, getCrownMaterialForPiece(label));
        const zPos = sides.front ? (-supportWidth / 2) : 0;
        mesh.position.set(c.w / 2 - thick - (supportWidth / 2), topEdgeY + (supportThick / 2), zPos);
        mesh.userData.isCrown = true;
        mesh.userData.pieceLabel = label;
        group.add(mesh);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

// ⭐ نور تاج حرفه‌ای: نوار LED ظریف + نور خطی واقعی
    // نور به سمت درب‌ها و دیوار می‌افتد و گرادیان طبیعی می‌سازد
    if (c.crown.ledLight) {
        const ledColor = 0xfff2e0; // سفید گرم (نه زرد مصنوعی)
        const ledMat = new THREE.MeshStandardMaterial({
            color: ledColor,
            emissive: ledColor,
            emissiveIntensity: 1.6,
            roughness: 0.35,
            metalness: 0.05,
            toneMapped: false
        });
        const ledThick = 0.45;
        const stripY = topEdgeY + 0.15; // دقیقاً زیر تاج، روی لبه بدنه

        const addCrownLedStrip = (geo, x, y, z) => {
            const led = new THREE.Mesh(geo, ledMat);
            led.position.set(x, y, z);
            led.userData.isCrown = true;
            led.userData.isCrownLed = true;
            led.castShadow = false;
            led.receiveShadow = true;
            group.add(led);
            return led;
        };

        // نوارهای LED ظریف روی اضلاع فعال تاج
        if (sides.front) {
            const frontZ = (c.d / 2) + proj - ledThick * 0.3;
            const frontW = Math.max(5, c.w - (sides.left ? thick : 0) - (sides.right ? thick : 0));
            addCrownLedStrip(
                new THREE.BoxGeometry(frontW, ledThick, ledThick),
                0, stripY, frontZ
            );

            // نور خطی واقعی: چند اسپات نرم در طول تاج جلو → گرادیان روی درب‌ها
            const lightCount = Math.max(2, Math.min(5, Math.round(frontW / 28)));
            const span = frontW * 0.82;
            const startX = -span / 2;
            for (let i = 0; i < lightCount; i++) {
                const t = lightCount === 1 ? 0.5 : i / (lightCount - 1);
                const lx = startX + span * t;
                const crownI = (Kitchen3D.config && Kitchen3D.config.crownSpotIntensity != null)
                    ? parseFloat(Kitchen3D.config.crownSpotIntensity) : 480;
                const spot = new THREE.SpotLight(ledColor, crownI, 100, Math.PI / 3.2, 0.92, 2);
                spot.position.set(lx, stripY - 0.4, frontZ - 1);
                const tgt = new THREE.Object3D();
                // گرادیان روی درب‌ها + کمی دیوار
                tgt.position.set(lx, stripY - 48, frontZ - 14);
                group.add(tgt);
                spot.target = tgt;
                spot.castShadow = false;
                spot.userData.isCrownLedLight = true;
                group.add(spot);
            }
            const crownFill = (Kitchen3D.config && Kitchen3D.config.crownFillIntensity != null)
                ? parseFloat(Kitchen3D.config.crownFillIntensity) : 90;
            const fill = new THREE.PointLight(ledColor, crownFill, 75, 2);
            fill.position.set(0, stripY - 6, frontZ - 8);
            fill.userData.isCrownLedLight = true;
            group.add(fill);
        }
        if (sides.back) {
            const backZ = -(c.d / 2) - ledThick * 0.2;
            addCrownLedStrip(
                new THREE.BoxGeometry(c.w, ledThick, ledThick),
                0, stripY, backZ
            );
            // نور به سمت دیوار پشت
            const backSpot = new THREE.SpotLight(ledColor, 400, 70, Math.PI / 3.2, 0.85, 2);
            backSpot.position.set(0, stripY - 0.3, backZ + 1);
            const backTgt = new THREE.Object3D();
            backTgt.position.set(0, stripY - 35, backZ - 15);
            group.add(backTgt);
            backSpot.target = backTgt;
            backSpot.castShadow = false;
            backSpot.userData.isCrownLedLight = true;
            group.add(backSpot);
        }
        if (sides.left) {
            const extraFront = sides.front ? (thick + proj) : 0;
            const totalDepth = c.d + extraFront + (sides.back ? thick : 0);
            const leftX = -c.w / 2 + thick - ledThick * 0.2;
            addCrownLedStrip(
                new THREE.BoxGeometry(ledThick, ledThick, totalDepth),
                leftX, stripY, proj / 2
            );
        }
        if (sides.right) {
            const extraFront = sides.front ? (thick + proj) : 0;
            const totalDepth = c.d + extraFront + (sides.back ? thick : 0);
            const rightX = c.w / 2 - thick + ledThick * 0.2;
            addCrownLedStrip(
                new THREE.BoxGeometry(ledThick, ledThick, totalDepth),
                rightX, stripY, proj / 2
            );
        }
    }
}
            // ==========================================================
            // ۶. صفحه روی کابینت — ضخامت واقعی + Edge
            // ==========================================================
            if (!c.isFridgeWrap && !c.isAppliance && c.countertopThickness > 0) {
                const ctThick = parseFloat(c.countertopThickness) || 3.2;
                const ctW = c.w;
                const ctD = c.d;
                const topMat = new THREE.MeshStandardMaterial({
                    color: c.countertopColor || "#f2efe9",
                    roughness: 0.28,
                    metalness: 0.04
                });
                const edgeMat = new THREE.MeshStandardMaterial({
                    color: 0xd4cfc6,
                    roughness: 0.55,
                    metalness: 0.02
                });
                const bottomMat = new THREE.MeshStandardMaterial({
                    color: 0xe8e4de,
                    roughness: 0.7,
                    metalness: 0
                });
                // [+x,-x,+y,-y,+z,-z]
                const ctMats = [edgeMat, edgeMat, topMat, bottomMat, edgeMat, edgeMat];
                const ctGeo = new THREE.BoxGeometry(ctW, ctThick, ctD);
                const ctMesh = new THREE.Mesh(ctGeo, ctMats);
                ctMesh.position.set(0, (c.h / 2) + (ctThick / 2), 0);
                ctMesh.castShadow = true;
                ctMesh.receiveShadow = true;
                ctMesh.userData.isCountertop = true;
                group.add(ctMesh);
            }
            // ==========================================================
            // ۷. افزودن نمای کابینت (Facade) بر اساس تنظیمات پنل
            // ==========================================================
         if (c.facadeConfig && c.facadeConfig.enabled) {
    const facadeGroup = new THREE.Group();
    const fConf = c.facadeConfig;
    const uId = c.id; 
    
    // --- الف: متریال نما + پرداخت سطح (مات/براق) جدا از جنس ورق ---
    const getFacadeMaterial = (labelKey, fallbackValue, defaultColor, finishKey) => {
        const isThermo = labelKey && String(labelKey).includes('ترمووال');
        const fk = finishKey || (isThermo ? 'satin' : 'matte');
        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(fk)
            : { roughness: isThermo ? 0.48 : 0.5, metalness: isThermo ? 0.08 : 0.05, envMapIntensity: isThermo ? 0.85 : 0.5, bumpScale: isThermo ? 0.18 : 0, clearcoat: 0 };
        // ترمووال کمی بافت/بازه نور بیشتری می‌گیرد
        const rough = preset.roughness;
        const metal = preset.metalness;
        const envI = preset.envMapIntensity != null ? preset.envMapIntensity : (isThermo ? 0.85 : 0.5);
        const bump = (isThermo ? Math.max(preset.bumpScale || 0, 0.18) : (preset.bumpScale || 0));
        const applyColorSpace = (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
        };

        let frontMap = null;
        let frontColor = defaultColor || '#FFFFFF';

        if (window.isolatedDoorTextures && window.isolatedDoorTextures[labelKey]) {
            const texture = new THREE.TextureLoader().load(window.isolatedDoorTextures[labelKey]);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            applyColorSpace(texture);
            frontMap = texture;
        } else if (fallbackValue && (String(fallbackValue).includes('/') || String(fallbackValue).startsWith('http') || String(fallbackValue).includes('.'))) {
            const texture = new THREE.TextureLoader().load(fallbackValue);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            applyColorSpace(texture);
            frontMap = texture;
        } else if (fallbackValue) {
            frontColor = fallbackValue;
        }

        const params = {
            roughness: rough,
            metalness: metal,
            envMapIntensity: envI
        };
        if (frontMap) {
            params.map = frontMap;
            params.color = 0xffffff;
            if (bump > 0) { params.bumpMap = (typeof window.asDataMapTexture === 'function') ? window.asDataMapTexture(frontMap) : frontMap; params.bumpScale = bump; }
        } else {
            try { params.color = new THREE.Color(frontColor); } catch (e) { params.color = 0xffffff; }
        }
        if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
            params.clearcoat = preset.clearcoat;
            params.clearcoatRoughness = preset.clearcoatRoughness || 0.05;
            return new THREE.MeshPhysicalMaterial(params);
        }
        return new THREE.MeshStandardMaterial(params);
    };
    // --- ب: استخراج پارامترها و ابعاد دقیقاً مطابق پیش‌نمایش پنل ---
    const customH = fConf.customLength > 0 ? fConf.customLength : c.h; 
    const customW = fConf.customWidth > 0 ? fConf.customWidth : c.d;
    
    const thick16 = 1.6;
    const offset16 = fConf.is16mm ? thick16 : 0;
        const thermoCount = fConf.thermoCount || 1;
    const twWidth = fConf.thermoWidth || 4;  
    const twThick = fConf.thermoThickness || 2; 
    
    // 🟢 استخراج پارامترهای جدید ارتفاع و موقعیت ارتفاعی ترمووال
    const thermoCustomHeightVal = fConf.thermoCustomHeight || 0;
    const thermoH = thermoCustomHeightVal > 0 ? thermoCustomHeightVal : customH;
    const thermoHeightPos = fConf.thermoHeightPos || 'center';

    const facadeDepth = fConf.is16mm ? customW : c.d;

    // 🟢 استخراج پارامترهای جدید عرض اختصاصی و موقعیت عرضی نما صفحه (Worktop)
    const worktopCustomWidthVal = fConf.worktopCustomWidth || 0;
    const wtDepth = worktopCustomWidthVal > 0 ? worktopCustomWidthVal : facadeDepth;
    const wtWidthPos = fConf.worktopWidthPos || 'center';


    // ۱. محاسبه دقیق موقعیت Y (طول کاستوم) متناسب با سیستم مختصات محلی کابینت
    const lengthPos = fConf.customLengthPos || 'center';
    let yPos = 0; 
    if (lengthPos === 'start') {
        yPos = -(c.h / 2) + (customH / 2); 
    } else if (lengthPos === 'end') {
        yPos = (c.h / 2) - (customH / 2); 
    } else if (lengthPos === 'center') {
        yPos = 0;
    }


    // ۲. محاسبه دقیق موقعیت Z (عرض کاستوم)
    const widthPos = fConf.customWidthPos || 'center';   // 🟢 اصلاح شد
    let zPos = 0;
    if (widthPos === 'start') {
        zPos = -c.d / 2 + customW / 2;
    } else if (widthPos === 'end') {
        zPos = c.d / 2 - customW / 2;
    } else if (widthPos === 'center') {
        zPos = 0;
    }


    // --- ج: تابع ساخت هندسه نما برای یک سمت (چپ یا راست) ---
    const buildSideFacade = (isLeft) => {
        const sideGroup = new THREE.Group();
        const sideText = isLeft ? 'چپ' : 'راست';

        // ۱. ساخت پنل ۱۶ میل
        if (fConf.is16mm) {
            const label16mm = `پنل نمای ۱۶میل جانبی ${sideText} U${uId}`;
            const mat16 = getFacadeMaterial(label16mm, c.facade16mmMaterialValue, "#FFFFFF", c.facade16mmFinish || 'matte');
            
            const geo16 = new THREE.BoxGeometry(thick16, customH, customW);
            const mesh16 = new THREE.Mesh(geo16, mat16);
            
            const xPos = isLeft ? (-c.w/2 - thick16/2) : (c.w/2 + thick16/2);

            // 🟢 اصلاح شد: موقعیت‌دهی بر اساس متغیرهای محاسباتی جدید
            mesh16.position.set(xPos, yPos, zPos);
            sideGroup.add(mesh16);
        }
        
        // 🌟 ۲. ساخت ترمووال‌ها
        // 🌟 ۲. ساخت ترمووال‌ها
        if (fConf.isThermo) {
            // 🟢 نقاط شروع و پایان در راستای Z بر اساس موقعیت ورق (zPos) و عمق کاستوم
            const startZ = zPos - (facadeDepth / 2) + (twWidth / 2); 
            const endZ = zPos + (facadeDepth / 2) - (twWidth / 2); 
            
            // 🟢 محاسبه دقیق موقعیت Y ترمووال بر اساس موقعیت انتخابی (ابتدا، وسط، انتها) نسبت به مرکز ورق
            let thermoYPos = yPos; 
            if (thermoHeightPos === 'start') {
                thermoYPos = (yPos - customH / 2) + (thermoH / 2); // تراز از پایین ورق
            } else if (thermoHeightPos === 'end') {
                thermoYPos = (yPos + customH / 2) - (thermoH / 2); // تراز از بالای ورق
            } else if (thermoHeightPos === 'center') {
                thermoYPos = yPos; // وسط‌چین شده روی ورق
            }

            for(let i = 0; i < thermoCount; i++) {
                const labelThermo = `شاخه ترمووال ${i + 1} نمای جانبی ${sideText} U${uId}`;
                const matThermo = getFacadeMaterial(labelThermo, c.facadeThermoMaterialValue, "#FFFFFF", c.facadeThermoFinish || 'matte');

                // 🟢 اعمال ارتفاع کاستوم جدید روی هندسه ترمووال
                const geoT = new THREE.BoxGeometry(twThick, thermoH, twWidth);
                // Reflection/Roughness چوب روی متریال نما
                if (matThermo) {
                    matThermo.roughness = (matThermo.roughness !== undefined) ? Math.min(matThermo.roughness, 0.52) : 0.48;
                    matThermo.metalness = Math.max(matThermo.metalness || 0, 0.08);
                    matThermo.envMapIntensity = 0.85;
                    matThermo.needsUpdate = true;
                }
                const meshT = new THREE.Mesh(geoT, matThermo);
                meshT.castShadow = true;
                meshT.receiveShadow = true;
                
                const xPos = isLeft ? (-c.w/2 - offset16 - twThick/2) : (c.w/2 + offset16 + twThick/2);
                
                let zThermoPos = 0;
                if (thermoCount === 1) {
                    zThermoPos = zPos;
                } else {
                    const step = (endZ - startZ) / (thermoCount - 1);
                    zThermoPos = startZ + (i * step);
                }

                // 🟢 موقعیت عمودی جدید ترمووال اعمال می‌شود
                meshT.position.set(xPos, thermoYPos, zThermoPos);
                sideGroup.add(meshT);
            }
        }


                // ۳. ساخت نما صفحه (Worktop)
        if (fConf.isWorktop) {
            const labelWorktop = `پیشانی نما صفحه جانبی (Worktop) ${sideText} U${uId}`;
            const matWorktop = getFacadeMaterial(labelWorktop, c.facadeWorktopMaterialValue, "#FFFFFF", c.facadeWorktopFinish || 'matte');

            const wtHeight = fConf.worktopHeight || 5;
            const wtThickness = fConf.worktopThickness || 3.2;

            // 🟢 اعمال عرض اختصاصی نما صفحه روی عمق جعبه (Z)
            const wtGeo = new THREE.BoxGeometry(wtThickness, wtHeight, wtDepth);
            const wtMesh = new THREE.Mesh(wtGeo, matWorktop);
            
            // موقعیت عمودی تراز شده با لبه بالایی موقعیت جدید پنل
            const wtYPos = (yPos + customH / 2) - (wtHeight / 2); 
            
            // 🟢 محاسبه دقیق موقعیت Z نما صفحه بر اساس موقعیت عرضی انتخابی ابتدا، وسط یا انتها نسبت به ورق بستر (zPos)
            let zWtPos = zPos;
            if (wtWidthPos === 'start') {
                zWtPos = (zPos - facadeDepth / 2) + (wtDepth / 2); // تراز از جلوی کار
            } else if (wtWidthPos === 'end') {
                zWtPos = (zPos + facadeDepth / 2) - (wtDepth / 2); // تراز از انتهای کار
            } else if (wtWidthPos === 'center') {
                zWtPos = zPos; // وسط‌چین شده نسبت به ورق
            }
            
            const xPos = isLeft ? (-c.w/2 - offset16 - wtThickness/2) : (c.w/2 + offset16 + wtThickness/2);

            wtMesh.position.set(xPos, wtYPos, zWtPos);
            sideGroup.add(wtMesh);
        }

        
        return sideGroup;
    };


    // --- د: اضافه کردن نما به سمت‌های تیک‌خورده ---
    if (fConf.isLeft) facadeGroup.add(buildSideFacade(true));
    if (fConf.isRight) facadeGroup.add(buildSideFacade(false));

    group.add(facadeGroup);
}




// موقعیت دهی نهایی
this.placeCabinetInRoom(group, c);
group.userData.isCabinet = true;
group.userData.cabinetData = c;
this.scene.add(group);


 ;

            // موقعیت دهی نهایی
            this.placeCabinetInRoom(group, c);
            group.userData.isCabinet = true;
            group.userData.cabinetData = c;
            this.scene.add(group);
        });

        if (typeof updateAllCabinetDoorsIn3D === 'function') updateAllCabinetDoorsIn3D();
    },

 // --- تابع جدید: ساخت و قرار دادن چهارچوب کمد دیواری در صحنه ۳D ---
  renderClosetFrameUnit: function() {
    // صحنه هنوز آماده نیست (قبل از init یا بعد از dispose)
    if (!this.scene || typeof this.scene.traverse !== "function") {
        return;
    }
    // 🌟 حذف تمام چهارچوب‌های قبلی (نه فقط یکی) قبل از بازسازی
    const oldFrames = [];
    this.scene.traverse((obj) => {
        if (obj && obj.userData && obj.userData.isClosetFrame) oldFrames.push(obj);
    });
    oldFrames.forEach((obj) => {
        if (this.scene && obj) this.scene.remove(obj);
    });

    const units = window.closetFrameUnits || [];
    units.forEach((unit) => this.renderSingleClosetFrame(unit));
},

renderSingleClosetFrame: function(unit) {
    if (!unit || !unit.parts || unit.parts.length === 0) return;

    const group = new THREE.Group();
    group.name = "closetFrameUnit_" + unit.id;

    // ⭐ ساخت تکسچر چوب به‌صورت رویه‌ای روی کنواس برای چهارچوب
    const woodCanvas = document.createElement('canvas');
    woodCanvas.width = 256;
    woodCanvas.height = 256;
    const wctx = woodCanvas.getContext('2d');

    wctx.fillStyle = '#a9754f';
    wctx.fillRect(0, 0, woodCanvas.width, woodCanvas.height);

    for (let i = 0; i < 45; i++) {
        const y = Math.random() * woodCanvas.height;
        const isDark = Math.random() > 0.5;
        wctx.strokeStyle = (isDark ? 'rgba(90,55,30,' : 'rgba(150,105,65,') + (0.15 + Math.random() * 0.25) + ')';
        wctx.lineWidth = 1 + Math.random() * 2;
        wctx.beginPath();
        wctx.moveTo(0, y);
        for (let x = 0; x <= woodCanvas.width; x += 16) {
            wctx.lineTo(x, y + (Math.random() * 6 - 3));
        }
        wctx.stroke();
    }

    const woodTexture = new THREE.CanvasTexture(woodCanvas);
    if (typeof window.applyKitchenTextureColorSpace === 'function') window.applyKitchenTextureColorSpace(woodTexture, 'color');
    else if (typeof THREE !== 'undefined' && THREE.SRGBColorSpace != null) woodTexture.colorSpace = THREE.SRGBColorSpace;
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(2, 4);

    const frameMat = new THREE.MeshStandardMaterial({
        map: woodTexture,
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0.02
    });

    // تابع کمکی برای ساخت ساختار متریال/رنگ روکوب‌ها
    const createRokoobMaterial = (colorVal) => {
        const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.02 });
        if (colorVal && colorVal.startsWith("#")) {
            mat.color.set(colorVal);
        } else if (colorVal) {
            const loader = new THREE.TextureLoader();
            loader.setCrossOrigin('anonymous');
            const tex = loader.load(colorVal);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            mat.map = tex;
            mat.color.set(0xffffff);
        } else {
            mat.color.set(0xffffff);
        }
        return mat;
    };

    const FRAME_THICKNESS = 5.5;
    const frameDepth = unit.d || FRAME_THICKNESS;

    let minX = Infinity;
    unit.parts.forEach(p => { if (p.x < minX) minX = p.x; });
    if (minX === Infinity) minX = 0;

    const totalWidth = unit.w || 1;

    // دریافت تنظیمات ذخیره‌شده روکوب‌ها
    const rokoobDataParts = (unit.rokoobParts) ? unit.rokoobParts : []; // 🌟 مختص همین یونیت، نه سراسری
const framePartDoors = (unit.framePartDoors) ? unit.framePartDoors : {};

    unit.parts.forEach(part => {
        const pW = part.orientation === 'horizontal' ? part.length : FRAME_THICKNESS;
        const pH = part.orientation === 'vertical' ? part.length : FRAME_THICKNESS;

        const geo = new THREE.BoxGeometry(pW, pH, frameDepth);
        const mesh = new THREE.Mesh(geo, frameMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const localX = (part.x - minX) - (totalWidth / 2) + (pW / 2);
        const localY = part.y + (pH / 2);

        mesh.position.set(localX, localY, 0);
        group.add(mesh);

        // ⭐ ساخت و اضافه کردن مش روکوب‌های متعلق به این قطعه
        const rokoobPart = rokoobDataParts.find(p => p.partId === part.id);
        if (rokoobPart && rokoobPart.directions) {
            const dirList = ["top", "bottom", "left", "right"];

            dirList.forEach(dir => {
                const dData = rokoobPart.directions[dir];
                if (!dData || !dData.enabled) return;

                const rLen = dData.length || part.length;
                const rWidth = dData.width || 4;             // پهنای روکوب
                const rThick = dData.thickness || 1.6;        // ضخامت ثابت MDF (1.6cm)

                const matR = createRokoobMaterial(dData.color ? dData.color.value : null);
                let rMesh;

                if (part.orientation === 'vertical') {
                    // قطعه عمودی چهارچوب (امتداد طول در محور Y)
                    let offsetCross = 0; // انحراف عرضی بر اساس قفل تراز
                    if (dData.align === 'top') offsetCross = (FRAME_THICKNESS / 2) - (rWidth / 2);
                    else if (dData.align === 'bottom') offsetCross = -(FRAME_THICKNESS / 2) + (rWidth / 2);

                    if (dir === "top") { // رو به بیرون (امتداد Z مثبت)
                        rMesh = new THREE.Mesh(new THREE.BoxGeometry(rWidth, rLen, rThick), matR);
                        rMesh.position.set(localX + offsetCross, localY, frameDepth / 2 + rThick / 2);
                    } else if (dir === "bottom") { // پشت قطعه (امتداد Z منفی)
                        rMesh = new THREE.Mesh(new THREE.BoxGeometry(rWidth, rLen, rThick), matR);
                        rMesh.position.set(localX + offsetCross, localY, -frameDepth / 2 - rThick / 2);
                    } else if (dir === "left") { // وجه چپ قطعه
                        rMesh = new THREE.Mesh(new THREE.BoxGeometry(rThick, rLen, rWidth), matR);
                        rMesh.position.set(localX - FRAME_THICKNESS / 2 - rThick / 2, localY, offsetCross);
                    } else if (dir === "right") { // وجه راست قطعه
                        rMesh = new THREE.Mesh(new THREE.BoxGeometry(rThick, rLen, rWidth), matR);
                        rMesh.position.set(localX + FRAME_THICKNESS / 2 + rThick / 2, localY, offsetCross);
                    }
                } else {
                    // قطعه افقی چهارچوب (امتداد طول در محور X)
                    let offsetCross = 0; // انحراف عرضی بر اساس قفل تراز
                    if (dData.align === 'top') offsetCross = (FRAME_THICKNESS / 2) - (rWidth / 2);
                    else if (dData.align === 'bottom') offsetCross = -(FRAME_THICKNESS / 2) + (rWidth / 2);

                    if (dir === "top") { // وجه بالای تیر
                        rMesh = new THREE.Mesh(new THREE.BoxGeometry(rLen, rThick, rWidth), matR);
                        rMesh.position.set(localX, localY + FRAME_THICKNESS / 2 + rThick / 2, offsetCross);
                    } else if (dir === "bottom") { // وجه پایین تیر
                        rMesh = new THREE.Mesh(new THREE.BoxGeometry(rLen, rThick, rWidth), matR);
                        rMesh.position.set(localX, localY - FRAME_THICKNESS / 2 - rThick / 2, offsetCross);
                    } else if (dir === "left") { // جلوی قطعه (امتداد Z مثبت)
                        rMesh = new THREE.Mesh(new THREE.BoxGeometry(rLen, rWidth, rThick), matR);
                        rMesh.position.set(localX, localY + offsetCross, frameDepth / 2 + rThick / 2);
                    } else if (dir === "right") { // پشت قطعه (امتداد Z منفی)
                        rMesh = new THREE.Mesh(new THREE.BoxGeometry(rLen, rWidth, rThick), matR);
                        rMesh.position.set(localX, localY + offsetCross, -frameDepth / 2 - rThick / 2);
                    }
                }

                if (rMesh) {
                    rMesh.castShadow = true;
                    rMesh.receiveShadow = true;
                    group.add(rMesh);
                }
            });
        }
   // سیستم قدیمی (تیرمحور) — فقط اگر سیستم خانه فعال نباشد
        const doorCfg = framePartDoors[part.id];
        if (!unit.frameCellDoors && doorCfg && doorCfg.showDoors !== false && (doorCfg.leftEnabled || doorCfg.rightEnabled)) {
            if (doorCfg.leftEnabled) this.addClosetFramePartDoor(group, doorCfg, localX, localY, pW, pH, frameDepth, "left");
            if (doorCfg.rightEnabled) this.addClosetFramePartDoor(group, doorCfg, localX, localY, pW, pH, frameDepth, "right");
        }
    });

    // ⭐ سیستم جدید: درب بر اساس خانه‌های باز چهارچوب
    if (unit.frameCellDoors && typeof this.addClosetFrameCellDoors === "function") {
        this.addClosetFrameCellDoors(group, unit, minX, totalWidth, frameDepth);
    }

    // ⭐ کشوهای بخش‌های چهارچوب کمد
    if (unit.frameCellDrawers && typeof this.addClosetFrameCellDrawers === "function") {
        this.addClosetFrameCellDrawers(group, unit, minX, totalWidth, frameDepth);
    }

    if (unit.sideFacades && typeof this.addClosetFrameSideFacades === "function") {
        this.addClosetFrameSideFacades(group, unit, minX, totalWidth, frameDepth);
    }

 if (unit.shelves && unit.shelves.length > 0) {
        const shelvesGroup = new THREE.Group();
        const shelfDepthVal = unit.shelfBodyDepth || frameDepth;
        shelvesGroup.position.set(
            0,
            (unit.h || 280) / 2,
            -(frameDepth / 2) - (shelfDepthVal / 2) // 🌟 اصلاح شد: کل عمق طبقه پشت چهارچوب (سمت داخل) قرار می‌گیره
        );
        this.createShelves(shelvesGroup, {
            w: totalWidth,
            h: unit.h || 280,
            d: unit.shelfBodyDepth || frameDepth, 
            id: unit.id,
            shelves: unit.shelves,
            shelvesColor: unit.shelvesColor,
            bodyColor: unit.shelvesColor,
            isClosetFrame: true   // 🌟 پین‌های طبقه مخصوص کابینت آشپزخانه هستند و نباید روی چهارچوب کمد دیده شوند
        });
        group.add(shelvesGroup);
    }

    const centerX = unit.x + (totalWidth / 2);
    const centerZ = unit.y + (frameDepth / 2);
    group.position.set(centerX, unit.elevation || 0, centerZ);

    const effectiveRot = (4 - (unit.rot || 0)) % 4;
    group.rotation.y = effectiveRot * (Math.PI / 2);

    group.userData.isCabinet = true;
    group.userData.isClosetFrame = true;
    group.userData.cabinetData = unit;
    group.userData.closetFrameId = unit.id;

    if (!this.scene) return;
    this.scene.add(group);
},

// --- ⭐ به‌روزرسانی سبک موقعیت/چرخش چهارچوب کمد بدون بازسازی کامل (برای درگ لحظه‌ای) ---
updateClosetFrameTransform: function(unit) {
    if (!unit || !unit.id || !this.scene) return;
    let targetGroup = null;
    this.scene.traverse((obj) => {
        if (obj && obj.userData && obj.userData.isClosetFrame && obj.userData.closetFrameId === unit.id) {
            targetGroup = obj;
        }
    });
    if (!targetGroup) {
        // اگر هنوز در صحنه نیست، یک‌بار کامل بساز
        this.renderSingleClosetFrame(unit);
        return;
    }
    const totalWidth = unit.w || 1;
    const frameDepth = unit.d || 5.5;
    const centerX = unit.x + (totalWidth / 2);
    const centerZ = unit.y + (frameDepth / 2);
    targetGroup.position.set(centerX, unit.elevation || 0, centerZ);
    const effectiveRot = (4 - (unit.rot || 0)) % 4;
    targetGroup.rotation.y = effectiveRot * (Math.PI / 2);
    // داده را هم همگام نگه دار
    targetGroup.userData.cabinetData = unit;
},

// --- ⭐ ساخت متریال درب برای قطعات چهارچوب کمد دیواری (رنگ ساده / تکسچر / شیشه) ---
buildClosetFrameDoorMaterial: function(cfg) {
    const initialColor = cfg.doorColor || "#ffffff";
    const isTexture = typeof initialColor === "string" && (initialColor.includes("http") || initialColor.includes("assets/") || initialColor.includes("/"));
    const isGlass = cfg.isGlassDoor === true;

    const doorMat = new THREE.MeshPhysicalMaterial({
        color: isTexture ? 0xffffff : (parseInt(String(initialColor).replace("#", "").substring(0, 6), 16) || 0xffffff),
        roughness: isGlass ? 0.05 : 0.35,
        metalness: 0.05,
        transparent: isGlass,
        opacity: isGlass ? (cfg.isFrostedGlass ? 0.55 : 0.25) : 1
    });

    if (isGlass && cfg.isFrostedGlass) {
        doorMat.color.set(0x111111);
    }

    if (isTexture) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        loader.load(initialColor, (tex) => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            doorMat.map = tex;
            doorMat.color.set(0xffffff);
            doorMat.needsUpdate = true;
        });
    }

    return doorMat;
},

/**
 * درب ریلی چهارچوب کمد — داخل محدوده بخش، حرکت به سمت داخل
 * - لبه اول از چوب ۲ سانت به داخل
 * - درب بعدی ۲ سانت پشت درب جلو
 * - لغزش فقط به داخل بخش (بیرون نمی‌زند)
 * - دستگیره قدی مشکی لبه‌ای
 */
addClosetSlidingDoors: function(group, unit, cell, cellCfg, minX, totalWidth, frameDepth, frontRokoobT) {
    const doorCount = Math.max(1, cellCfg.doors || 2);
    const doorThick = 1.6;
    const rollerClear = 2.5;
    const EDGE_INSET = 2;   // ۲ سانت از لبه چوب به داخل (افقی)

    // روکوب جداگانه برای چپ/راست/بالا/پایین
    const rok = (typeof this.getClosetRokoobInsets === "function")
        ? this.getClosetRokoobInsets(unit)
        : { left: 0, right: 0, top: 0, bottom: 0, front: frontRokoobT || 0 };
    const leftRok = rok.left || 0;
    const rightRok = rok.right || 0;
    const topRok = rok.top || 0;
    const bottomRok = rok.bottom || 0;
    const frontRok = frontRokoobT || rok.front || 0;

    // عرض: کسر روکوب چپ و راست | ارتفاع: کسر غلطک + روکوب بالا و پایین جداگانه
    let usableW = cell.w - leftRok - rightRok;
    let usableH = cell.h - rollerClear - topRok - bottomRok;
    usableW = Math.max(usableW, 1);
    usableH = Math.max(usableH, 1);

    const defaultEachW = usableW / doorCount;
    const doorMat = this.buildClosetFrameDoorMaterial(cellCfg);
    const cellCenterX = (cell.x - minX) - (totalWidth / 2) + cell.w / 2;
    // مرکز عمودی با در نظر گرفتن روکوب نامتقارن بالا/پایین
    const openBottomY = cell.y + bottomRok;
    const openTopY = cell.y + cell.h - topRok;
    const openMidY = (openBottomY + openTopY) / 2;
    // محدوده افقی بخش (مختصات محلی گروه)
    const cellLeft = cellCenterX - cell.w / 2;
    const cellRight = cellCenterX + cell.w / 2;
    // سطح جلوی چهارچوب / روکوب — عمق درب‌ها از این لبه به داخل حساب می‌شود
    const frontFaceZ = (frameDepth / 2) + frontRok;

    /**
     * دستگیره ریلی مدل H (پروفیل قدی)
     * - قسمت روی لبه ورق: ۱۶ میل (قطر درب)
     * - قسمت بیرون برای دست: ۲ سانت
     */
    const makeSlidingEdgeHandle = (doorH, onRightEdge) => {
        const handleGroup = new THREE.Group();
        handleGroup.userData.isHandle = true;
        const hMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.82,
            roughness: 0.28
        });
        const s = onRightEdge ? 1 : -1;
        const H = Math.max(doorH - 2, doorH * 0.96);
        const SLOT = doorThick; // ۱۶ میل — روی ضخامت ورق
        const OUT = 2.0;        // ۲ سانت بیرون برای دستگیره
        const t = 0.14;         // ضخامت جداره پروفیل

        // کانال U روی لبه ورق (اسلات ۱۶ میل در راستای Z)
        const web = new THREE.Mesh(new THREE.BoxGeometry(t, H, SLOT), hMat);
        web.position.set(s * (t / 2), 0, 0);
        web.castShadow = true;
        handleGroup.add(web);

        const flangeF = new THREE.Mesh(new THREE.BoxGeometry(t * 1.2, H, t), hMat);
        flangeF.position.set(s * (t / 2), 0, SLOT / 2 - t / 2);
        handleGroup.add(flangeF);

        const flangeB = new THREE.Mesh(new THREE.BoxGeometry(t * 1.2, H, t), hMat);
        flangeB.position.set(s * (t / 2), 0, -SLOT / 2 + t / 2);
        handleGroup.add(flangeB);

        // بال بیرونی دستگیره (۲ سانت بیرون) — شکل H عکس
        const outerPlate = new THREE.Mesh(new THREE.BoxGeometry(OUT, H, t), hMat);
        outerPlate.position.set(s * (t + OUT / 2), 0, SLOT / 2 - t / 2);
        outerPlate.castShadow = true;
        handleGroup.add(outerPlate);

        const returnLip = new THREE.Mesh(new THREE.BoxGeometry(t, H, SLOT * 0.4), hMat);
        returnLip.position.set(
            s * (t + OUT - t / 2),
            0,
            SLOT / 2 - t / 2 - (SLOT * 0.4) / 2
        );
        handleGroup.add(returnLip);

        const midRib = new THREE.Mesh(new THREE.BoxGeometry(OUT * 0.35, H, t * 0.8), hMat);
        midRib.position.set(s * (t + OUT * 0.25), 0, 0);
        handleGroup.add(midRib);

        return handleGroup;
    };

    /**
     * غلطک درب ریلی — صفحه روی قطر ۱۶ میل ورق، بیرون‌زدگی فقط ۵ میلی‌متر
     */
    const makeSlidingRoller = (isTop) => {
        const g = new THREE.Group();
        g.userData.isHandle = true;
        g.userData.isRoller = true;

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0xc8c8c8,
            metalness: 0.85,
            roughness: 0.25
        });
        const darkMetal = new THREE.MeshStandardMaterial({
            color: 0x9a9a9a,
            metalness: 0.8,
            roughness: 0.3
        });
        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0xf0f0f0,
            metalness: 0.05,
            roughness: 0.55
        });

        // صفحه نصب: عرض ۳.۲، ضخامت ۰.۲۵، عمق = قطر ورق (۱.۶) + بیرون‌زدگی ۰.۵
        const PROTRUDE = 0.5; // ۵ میلی‌متر بیرون از پشت ورق
        const plateW = 3.2;
        const plateH = 0.22;
        const plateD = doorThick + PROTRUDE; // روی ۱۶ میل + ۵ میل بیرون
        // مبدأ گروه = مرکز ضخامت درب؛ صفحه از جلو تا پشت+۰.۵
        // مرکز صفحه در Z: کمی به سمت پشت
        const plateZ = -PROTRUDE / 2;
        const plate = new THREE.Mesh(new THREE.BoxGeometry(plateW, plateH, plateD), metalMat);
        plate.position.set(0, isTop ? -0.08 : 0.08, plateZ);
        g.add(plate);

        // بال‌های نصب — هم‌عمق با صفحه
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, plateD * 0.95), metalMat);
        const wingL = wing.clone();
        wingL.position.set(-1.35, isTop ? -0.04 : 0.04, plateZ);
        g.add(wingL);
        const wingR = wing.clone();
        wingR.position.set(1.35, isTop ? -0.04 : 0.04, plateZ);
        g.add(wingR);

        // فنرها — نزدیک لبه پشت
        const springGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.1, 8);
        const springY = isTop ? -0.28 : 0.28;
        const springZ = -doorThick / 2 - PROTRUDE * 0.15;
        [-0.4, 0.4].forEach(sx => {
            const spring = new THREE.Mesh(springGeo, darkMetal);
            spring.rotation.z = Math.PI / 2;
            spring.position.set(sx, springY, springZ);
            g.add(spring);
        });

        // چرخ و بدنه — فقط در محدوده بیرون‌زدگی ۵ میل پشت ورق
        const wheelZ = -doorThick / 2 - PROTRUDE * 0.35;
        const housing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.7, 0.28, 16, 1, false, 0, Math.PI),
            metalMat
        );
        housing.rotation.x = Math.PI / 2;
        housing.rotation.z = isTop ? Math.PI : 0;
        housing.position.set(0, isTop ? 0.4 : -0.4, wheelZ);
        g.add(housing);

        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.32, 18), wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(0, isTop ? 0.52 : -0.52, wheelZ);
        g.add(wheel);

        const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 10), darkMetal);
        axle.rotation.x = Math.PI / 2;
        axle.position.set(0, isTop ? 0.52 : -0.52, wheelZ);
        g.add(axle);

        return g;
    };

    const attachRollersToDoor = (doorMesh, doorW, doorH) => {
        const EDGE_FROM = 5; // ۵ سانت از هر لبه درب
        const halfW = doorW / 2;
        const inset = Math.min(EDGE_FROM, Math.max(1.5, halfW - 1.2));
        const positions = [
            { x: -halfW + inset, y: -doorH / 2, top: false },
            { x:  halfW - inset, y: -doorH / 2, top: false },
            { x: -halfW + inset, y:  doorH / 2, top: true  },
            { x:  halfW - inset, y:  doorH / 2, top: true  }
        ];
        positions.forEach(p => {
            const roller = makeSlidingRoller(p.top);
            // مبدأ غلطک = مرکز ضخامت ورق (صفحه روی ۱۶ میل می‌نشیند)
            roller.position.set(p.x, p.y, 0);
            doorMesh.add(roller);
        });
    };

    // محدوده مفید با کسر روکوب چپ/راست تا درب و دستگیره داخل روکوب نروند
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

        // چیدمان افقی بسته: از چپ به راست داخل inset + روکوب
        const closedX = innerLeft + doorW / 2 + i * (spanW / doorCount);

        // عمق از لبه چوب به داخل: درب اول ۲ سانت، درب دوم ۴ سانت، ...
        const insetDepth = 2 + i * 2; // 2, 4, 6, ...
        const layerZ = frontFaceZ - insetDepth - doorThick / 2;

        // مرکز عمودی: با روکوب بالا/پایین جابه‌جا می‌شود تا غلطک روی روکوب بنشیند
        const doorCenterY = openMidY;

        const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorThick), doorMat);
        doorMesh.castShadow = true;
        doorMesh.receiveShadow = true;
        doorMesh.position.set(closedX, doorCenterY, layerZ);
        group.add(doorMesh);

        // دستگیره روی لبه نوار — بدنه بیشتر داخل درب
        const isLeftDoor = (i % 2 === 0);
        const onRightEdge = isLeftDoor;
        const handleLocalX = onRightEdge ? (doorW / 2) : (-doorW / 2);
        const handleGroup = makeSlidingEdgeHandle(doorH, onRightEdge);
        handleGroup.position.set(handleLocalX, 0, 0);
        doorMesh.add(handleGroup);

        // ۴ غلطک: ۲ پایین + ۲ بالا — با کوتاه شدن درب روی روکوب می‌نشینند
        attachRollersToDoor(doorMesh, doorW, doorH);

        // باز شدن کامل تا انتها داخل محدوده بدون روکوب
        const minCenter = innerLeft + doorW / 2;
        const maxCenter = innerRight - doorW / 2;
        const openX = isLeftDoor ? maxCenter : minCenter;

        doorMesh.userData = {
            isDoor: true,
            isSlidingDoor: true,
            isOpen: false,
            closedX: closedX,
            openX: openX,
            targetX: closedX,
            isClosetFrameDoor: true,
            closetCellId: cell.id,
            doorIndex: i
        };
    }
},

// ضخامت روکوب جلویی (وجه رو به بیرون) — درب باید روی همین سطح بنشیند
getClosetFrontRokoobThickness: function(unit) {
    const insets = this.getClosetRokoobInsets(unit);
    return insets.front || 0;
},

/**
 * ضخامت روکوب در جهات نمای روبه‌رو (سانتی‌متر)
 * left/right → کاهش عرض درب | top/bottom → کاهش ارتفاع (غلطک روی روکوب)
 */
getClosetRokoobInsets: function(unit) {
    const out = { left: 0, right: 0, top: 0, bottom: 0, front: 0 };
    const list = (unit && unit.rokoobParts) ? unit.rokoobParts : [];
    const parts = (unit && unit.parts) ? unit.parts : [];
    const thick = (d) => {
        if (!d || d.enabled !== true) return 0;
        const t = parseFloat(d.thickness);
        return isNaN(t) ? 1.6 : t;
    };
    list.forEach(rp => {
        if (!rp || !rp.directions) return;
        const framePart = parts.find(p => p.id === rp.partId);
        const orient = framePart ? framePart.orientation : "vertical";
        const d = rp.directions;
        if (orient === "horizontal") {
            // افقی: left=جلو, right=عقب, top=بالا, bottom=پایین
            out.front = Math.max(out.front, thick(d.left));
            out.top = Math.max(out.top, thick(d.top));
            out.bottom = Math.max(out.bottom, thick(d.bottom));
        } else {
            // عمودی: top=جلو, bottom=عقب, left=چپ, right=راست
            out.front = Math.max(out.front, thick(d.top));
            out.left = Math.max(out.left, thick(d.left));
            out.right = Math.max(out.right, thick(d.right));
        }
    });
    // اگر فقط روکوب جلو روی عمودی‌هاست و left/right صفر مانده،
    // برای عرض از همان ضخامت جلو به‌عنوان هر طرف استفاده کن (رفتار قبلی ۳.۲)
    if (out.front > 0 && out.left === 0 && out.right === 0) {
        out.left = out.front;
        out.right = out.front;
    }
    // روکوب جلو روی تیر افقی هم برای بالا/پایین اگر top/bottom صفر بود
    if (out.front > 0 && out.top === 0 && out.bottom === 0) {
        // فقط وقتی تیر افقی روکوب جلو دارد، لزوماً ارتفاع کم نمی‌شود —
        // ارتفاع فقط با top/bottom واقعی کم می‌شود
    }
    return out;
},

/**
 * کشو داخل بخش‌های چهارچوب کمد (unit.frameCellDrawers)
 *
 * کشو معمولی — محل قرارگیری:
 *  - دیواره چپ/راست: ارتفاع = ارتفاع بدنه کشو + ۴ سانتی‌متر
 *  - کف و سقف: عرض = عرض بخش − ۳.۲ (دو دیواره ۱.۶)
 *  - عرض بدنه کشو: عرض کف/سقف − ۲.۶
 *  - بقیه ساخت بدنه/ریل با createRealisticDrawer
 *  (کشو ریلی و مخفی بعداً فرمول جدا دارند)
 */

/**
 * بغل‌نما چپ/راست چهارچوب کمد (unit.sideFacades)
 */
addClosetFrameSideFacades: function(group, unit, minX, totalWidth, frameDepth) {
    const sf = unit.sideFacades;
    if (!sf) return;
    const unitH = unit.h || 100;
    const unitD = unit.d || frameDepth || 60;
    const THICK = 1.6;

    const makeMaterial = (cfg) => {
        const finishKey = (cfg && cfg.finish) || "matte";
        const colorVal = (cfg && cfg.color) || "";
        const colorName = (cfg && cfg.colorName) || "";
        const isPath = (v) => {
            if (!v || typeof v !== "string") return false;
            return v.includes("/") || v.startsWith("http") || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(v);
        };

        // URL تکسچر از کاتالوگ یا مسیر مستقیم
        let mapUrl = "";
        if (colorName && window.isolatedDoorTextures && window.isolatedDoorTextures[colorName]) {
            mapUrl = window.isolatedDoorTextures[colorName];
        } else if (isPath(colorVal)) {
            mapUrl = colorVal;
        }

        // همان مسیر متریال درب/کابینت — colorSpace و کش مشترک
        if (typeof this.buildSharedSurfaceMaterial === "function") {
            const preset = (typeof window.getKitchenFinishPreset === "function")
                ? window.getKitchenFinishPreset(finishKey)
                : {};
            // برای تکسچر کمی روشن‌تر از matte خیلی تیره
            let envI = preset.envMapIntensity != null ? preset.envMapIntensity : 0.5;
            if (mapUrl && envI < 0.45) envI = 0.55;
            let rough = preset.roughness != null ? preset.roughness : 0.55;
            if (mapUrl && rough > 0.75) rough = 0.62;
            return this.buildSharedSurfaceMaterial({
                finish: finishKey,
                mapUrl: mapUrl,
                color: mapUrl ? "#ffffff" : (colorVal || "#f1f5f9"),
                roughness: rough,
                metalness: preset.metalness != null ? preset.metalness : 0.03,
                envMapIntensity: envI
            });
        }

        // فالبک ساده
        const preset = (typeof window.getKitchenFinishPreset === "function")
            ? window.getKitchenFinishPreset(finishKey)
            : { roughness: 0.55, metalness: 0.03, envMapIntensity: 0.55 };
        let frontMap = null;
        let frontColor = colorVal || "#f1f5f9";
        try {
            if (mapUrl && typeof this.getSharedTexture === "function") {
                frontMap = this.getSharedTexture(mapUrl);
            } else if (mapUrl) {
                frontMap = new THREE.TextureLoader().load(mapUrl);
                if (typeof window.optimizeKitchenTexture === "function") window.optimizeKitchenTexture(frontMap);
                else if (THREE.SRGBColorSpace) frontMap.colorSpace = THREE.SRGBColorSpace;
            }
            if (frontMap) {
                frontMap.wrapS = THREE.RepeatWrapping;
                frontMap.wrapT = THREE.RepeatWrapping;
            }
        } catch (e) { frontMap = null; }
        const params = {
            roughness: (mapUrl && (preset.roughness || 1) > 0.75) ? 0.62 : (preset.roughness || 0.55),
            metalness: preset.metalness != null ? preset.metalness : 0.03,
            envMapIntensity: (mapUrl && (preset.envMapIntensity || 0) < 0.45) ? 0.55 : (preset.envMapIntensity || 0.55)
        };
        if (frontMap) {
            params.map = frontMap;
            params.color = 0xffffff;
        } else {
            try { params.color = new THREE.Color(frontColor); }
            catch (e) { params.color = 0xf1f5f9; }
        }
        return new THREE.MeshStandardMaterial(params);
    };

    const makePanel = (side, cfg) => {
        if (!cfg || !cfg.enabled) return;
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

        const mat = makeMaterial(cfg);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(THICK, H, panelDepth), mat);
        const x = (side === "left")
            ? (-totalWidth / 2 - THICK / 2)
            : (totalWidth / 2 + THICK / 2);
        mesh.position.set(x, H / 2, centerZ);
        mesh.userData.isClosetSideFacade = true;
        mesh.userData.side = side;
        group.add(mesh);
    };
    makePanel("left", sf.left);
    makePanel("right", sf.right);
},

addClosetFrameCellDrawers: function(group, unit, minX, totalWidth, frameDepth) {
    const cellDrawers = unit.frameCellDrawers || {};
    if (!Object.keys(cellDrawers).length) return;

    let cells = [];
    if (typeof window.detectClosetFrameCells === "function") {
        cells = window.detectClosetFrameCells(unit);
    }
    if (!cells.length) return;

    const frontRokoobT = (typeof this.getClosetFrontRokoobThickness === "function")
        ? this.getClosetFrontRokoobThickness(unit)
        : 0;
    const frontFaceZ = (frameDepth / 2) + (frontRokoobT || 0);
    // پیش‌فرض‌ها — داخل هر سلول از cfg.housing قابل‌تنظیم‌اند
    const DEFAULT_PANEL = 1.6;
    const DEFAULT_SIDE_PER = 22.5;
    const DEFAULT_STRIP_D = 12;
    const DEFAULT_DEPTH = 50;
    const DRAWER_BODY_CLEAR = 2.6; // کسر از عرض کف/سقف برای بدنه کشو

    const carcassMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.75,
        metalness: 0.02
    });
    const metalMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.75,
        roughness: 0.3
    });
    const frontMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.45,
        metalness: 0.04
    });

    cells.forEach(cell => {
        const cfgRaw = cellDrawers[cell.id];
        if (!cfgRaw || cfgRaw.enabled !== true) return;
        if (cell.w < 6 || cell.h < 6) return;

        // نرمال‌سازی ستون‌ها
        const cfg = (typeof window.normalizeKeshoDrawerCfg === "function")
            ? window.normalizeKeshoDrawerCfg(cfgRaw)
            : cfgRaw;
        const drawerType = cfg.drawerType || "normal";
        // تنظیمات محل قرارگیری از پنل مدیریت
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
                ? parseFloat(cfg.drawerDepth)
                : DEFAULT_DEPTH;
        }
        const FLOOR_MINUS_SIDES = PANEL * 2;
        // معمولی و مخفی: تا ۳ ردیف؛ ریلی: تا ۲ ردیف
        let colCount = 1;
        if (drawerType === "normal" || drawerType === "hidden") {
            colCount = Math.max(1, Math.min(3, parseInt(cfg.columnCount, 10) || 1));
        } else if (drawerType === "sliding") {
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
                drawersData: [{ height: 17, doorHeight: 17, depth: 45, material: "mdf", color: "", finish: "matte" }]
            });
        }
        columns = columns.slice(0, colCount);

        const cellCenterX = (cell.x - minX) - (totalWidth / 2) + cell.w / 2;
        const W = cell.w;
        const H = cell.h;
        // مخفی: ۳ سانتی به داخل؛ ریلی: ۱۲ سانتی به داخل از لبه چهارچوب
        const HIDDEN_INSET = 3.0;
        const SLIDING_INSET = 12.0;
        let bodyFrontZ = frontFaceZ;
        if (drawerType === "hidden") bodyFrontZ = frontFaceZ - HIDDEN_INSET;
        else if (drawerType === "sliding") bodyFrontZ = frontFaceZ - SLIDING_INSET;
        const bodyCenterZ = bodyFrontZ - drawerDepth / 2;
        const thick = PANEL;
        // ریلی: بدون ۱۶ میل پایین — هم‌تراز لبه کف، سپس ۲ میل بالا
        const FRONT_BOTTOM_OVERLAP = (drawerType === "sliding") ? -0.2 : 1.6;
        const FRONT_TOP_INSET = 0.3;
        const FRONT_GAP = 0.3;
        // آماده‌سازی داده هر ستون
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
            colMeta.push({ count, drawersData, bodyHeights, sumBodies });
        }

        // آیا همه ستون‌ها تعداد کشوی یکسان دارند؟
        const allSameCount = colMeta.every(m => m.count === colMeta[0].count);

        const cellLeft = cellCenterX - W / 2;
        const cellRight = cellCenterX + W / 2;
        const frontStripZ = bodyFrontZ - STRIP_D / 2;
        const backStripZ = bodyFrontZ - drawerDepth + STRIP_D / 2;

        // عرض و تراز محل قرارگیری (قابل‌تنظیم از پنل)
        // housing.width خالی/نامعتبر = عرض کامل بخش
        let housingW = W;
        const hwRaw = parseFloat(housing.width);
        if (!isNaN(hwRaw) && hwRaw > 0) {
            housingW = Math.min(Math.max(hwRaw, 10), W);
        }
        const housingAlign = (housing.align === "left" || housing.align === "right")
            ? housing.align
            : "center";
        let housingLeft;
        if (housingAlign === "left") {
            housingLeft = cellLeft;
        } else if (housingAlign === "right") {
            housingLeft = cellRight - housingW;
        } else {
            housingLeft = cellLeft + (W - housingW) / 2;
        }
        // کشو مخفی: از هر طرف (چپ و راست) ۴ سانتی‌متر کمتر
        if (drawerType === "hidden") {
            const SIDE_INSET = 4.0;
            housingW = Math.max(housingW - SIDE_INSET * 2, 6);
            housingLeft = housingLeft + SIDE_INSET;
        }
        // کشو ریلی: از هر طرف ۶.۵ سانتی‌متر کمتر (جمع ۱۳) — تیغه وسط و ۱۰ سانتی‌ها همان اندازه
        if (drawerType === "sliding") {
            const SLIDING_SIDE_INSET = 6.5;
            housingW = Math.max(housingW - SLIDING_SIDE_INSET * 2, 6);
            housingLeft = housingLeft + SLIDING_SIDE_INSET;
        }
        const housingRight = housingLeft + housingW;
        const housingCenterX = housingLeft + housingW / 2;

        // عرض مساوی ستون‌ها داخل محل قرارگیری
        // در حالت یکسان: دیواره بیرونی مشترک + تیغه میانی
        // در حالت نابرابر: هر ستون دیواره چپ/راست خودش را دارد

        if (allSameCount || colCount === 1) {
            // ========== محل قرارگیری یکپارچه (تعداد برابر) ==========
            let housingH = SIDE_PER_DRAWER * maxCount;
            if (housingH > H) housingH = H;
            const housingBottom = cell.y;
            const housingTop = housingBottom + housingH;
            const housingCenterY = housingBottom + housingH / 2;

            // دیواره چپ و راست بیرونی
            // ریلی: ۱۰ سانتی به پایین اضافه می‌شود
            const sideExtraDown = (drawerType === "sliding") ? 10 : 0;
            const sideH = housingH + sideExtraDown;
            const sideCy = housingCenterY - sideExtraDown / 2;
            const leftSide = new THREE.Mesh(
                new THREE.BoxGeometry(PANEL, sideH, drawerDepth), carcassMat
            );
            leftSide.position.set(housingLeft + PANEL / 2, sideCy, bodyCenterZ);
            leftSide.castShadow = true; leftSide.receiveShadow = true;
            group.add(leftSide);
            const rightSide = new THREE.Mesh(
                new THREE.BoxGeometry(PANEL, sideH, drawerDepth), carcassMat
            );
            rightSide.position.set(housingRight - PANEL / 2, sideCy, bodyCenterZ);
            rightSide.castShadow = true; rightSide.receiveShadow = true;
            group.add(rightSide);

            // کف/سقف سراسری داخل محل
            const floorCeilW = Math.max(housingW - FLOOR_MINUS_SIDES, 2);
            const floorY = housingBottom + PANEL / 2;
            const ceilY = housingTop - PANEL / 2;
            [
                [floorY, frontStripZ], [floorY, backStripZ],
                [ceilY, frontStripZ], [ceilY, backStripZ]
            ].forEach(([y, z]) => {
                const m = new THREE.Mesh(
                    new THREE.BoxGeometry(floorCeilW, PANEL, STRIP_D), carcassMat
                );
                m.position.set(housingCenterX, y, z);
                m.castShadow = true; m.receiveShadow = true;
                group.add(m);
            });

            // معمولی/مخفی: تیغه ۵.۵ زیر کف عقبی
            if (drawerType === "normal" || drawerType === "hidden") {
                const BACK_RAIL_H = 5.5;
                const backRailZ = backStripZ;
                const backRailY = housingBottom - BACK_RAIL_H / 2;
                const backRail = new THREE.Mesh(
                    new THREE.BoxGeometry(floorCeilW, BACK_RAIL_H, PANEL),
                    carcassMat
                );
                backRail.position.set(housingCenterX, backRailY, backRailZ);
                backRail.castShadow = true;
                backRail.receiveShadow = true;
                group.add(backRail);
            }

            // ریلی: دو تیغه ۱۰ سانتی زیر کف‌ها — روی لبه اول (بیرونی) هر کف ۱۲ سانتی
            if (drawerType === "sliding") {
                const SLIDE_RAIL_H = 10;
                const railY = housingBottom - SLIDE_RAIL_H / 2;
                // لبه جلو کف جلو: bodyFrontZ → مرکز تیغه کمی عقب‌تر
                const frontRailZ = bodyFrontZ - PANEL / 2;
                // لبه عقب کف عقب: bodyFrontZ - drawerDepth
                const backRailZ = (bodyFrontZ - drawerDepth) + PANEL / 2;
                [frontRailZ, backRailZ].forEach(z => {
                    const rail = new THREE.Mesh(
                        new THREE.BoxGeometry(floorCeilW, SLIDE_RAIL_H, PANEL),
                        carcassMat
                    );
                    rail.position.set(housingCenterX, railY, z);
                    rail.castShadow = true;
                    rail.receiveShadow = true;
                    group.add(rail);
                });
            }

            const innerLeft = housingLeft + PANEL;
            const innerW = Math.max(housingW - PANEL * 2, 2);
            const dividerH = Math.max(housingH - PANEL * 2, 2);
            const dividerCy = housingBottom + PANEL + dividerH / 2;
            // ریلی دو ردیفه: تیغه وسط دوتایی + فاصله بین آن‌ها برای تیغه ۱۰ سانتی
            const isSlidingDouble = (drawerType === "sliding" && colCount === 2);
            // فاصله بین دو تیغه ۱۶ میل وسط (برای تیغه ۱۰ سانتی بینشان)
            const midGapW = isSlidingDouble ? 10 : 0;
            const midBladesW = isSlidingDouble ? (PANEL * 2 + midGapW) : (PANEL * Math.max(colCount - 1, 0));
            const usableW = Math.max(innerW - midBladesW, 2);
            const colInnerW = usableW / colCount;

            if (isSlidingDouble) {
                // دو تیغه ۱۶ میل وسط — فقط بین کف و سقف (بدون ادامه به پایین)
                const leftBladeX = innerLeft + colInnerW + PANEL / 2;
                const rightBladeX = leftBladeX + PANEL + midGapW;
                [leftBladeX, rightBladeX].forEach(x => {
                    const blade = new THREE.Mesh(
                        new THREE.BoxGeometry(PANEL, dividerH, drawerDepth), carcassMat
                    );
                    blade.position.set(x, dividerCy, bodyCenterZ);
                    blade.castShadow = true; blade.receiveShadow = true;
                    group.add(blade);
                });
                // فضای خالی ۱۰ سانتی بین دو تیغه:
                // تکه جلو و عقب — هم‌ارتفاع تیغه‌های وسط
                // از روی کف ۱۲ سانتی تا زیر سقف ۱۲ سانتی
                const betweenX = (leftBladeX + rightBladeX) / 2;
                const betweenW = Math.max(midGapW, 0.5);
                const frontZ = bodyFrontZ - PANEL / 2;
                const backZ = (bodyFrontZ - drawerDepth) + PANEL / 2;
                [frontZ, backZ].forEach(z => {
                    const piece = new THREE.Mesh(
                        new THREE.BoxGeometry(betweenW, dividerH, PANEL),
                        carcassMat
                    );
                    piece.position.set(betweenX, dividerCy, z);
                    piece.castShadow = true;
                    piece.receiveShadow = true;
                    group.add(piece);
                });
            } else {
                const dividerCount = Math.max(colCount - 1, 0);
                for (let di = 0; di < dividerCount; di++) {
                    const divX = innerLeft + (di + 1) * colInnerW + di * PANEL + PANEL / 2;
                    const blade = new THREE.Mesh(
                        new THREE.BoxGeometry(PANEL, dividerH, drawerDepth), carcassMat
                    );
                    blade.position.set(divX, dividerCy, bodyCenterZ);
                    blade.castShadow = true; blade.receiveShadow = true;
                    group.add(blade);
                }
            }

            // کشوهای هر ستون — عرض جبهه (ردیف‌های هم‌تعداد):
            // معمولی: از هر طرف ۱۶ میل روی چهارچوب
            // مخفی / ریلی: بدون ۱۶ میل بیرونی — هم‌تراز لبه محل، ۱ میل کمتر
            // ریلی سمت تیغه وسط: هم‌تراز تیغه ۱۶ میل، ۱ میل کمتر
            const isFlushFront = (drawerType === "hidden" || drawerType === "sliding");
            const EDGE_OVERLAY = isFlushFront ? 0 : 1.6;
            const EDGE_INSET = isFlushFront ? 0.1 : 0; // ۱ میل از لبه محل
            const MID_GAP_HALF = 0.15; // معمولی چندردیفه
            const MID_INSET_SLIDING = 0.1; // ریلی: ۱ میل از لبه تیغه وسط
            const bayStep = isSlidingDouble ? (colInnerW + midBladesW) : (colInnerW + PANEL);
            for (let ci = 0; ci < colCount; ci++) {
                const meta = colMeta[ci];
                const bayLeft = innerLeft + ci * bayStep;
                const bayCenterX = bayLeft + colInnerW / 2;
                const drawerBodyW = Math.max(colInnerW - DRAWER_BODY_CLEAR, 2);

                let frontW, frontCenterX;
                if (colCount === 1) {
                    frontW = Math.max(housingW + EDGE_OVERLAY * 2 - EDGE_INSET * 2, 2);
                    frontCenterX = housingCenterX;
                } else {
                    const leftIsOuter = (ci === 0);
                    const rightIsOuter = (ci === colCount - 1);
                    let leftEdge, rightEdge;
                    if (leftIsOuter) {
                        leftEdge = housingLeft - EDGE_OVERLAY + EDGE_INSET;
                    } else if (drawerType === "sliding") {
                        // لبه راست تیغه(های) وسط + ۱ میل داخل
                        const leftDivRight = isSlidingDouble
                            ? (innerLeft + colInnerW + midBladesW)
                            : (innerLeft + ci * colInnerW + (ci - 1) * PANEL + PANEL);
                        leftEdge = leftDivRight + MID_INSET_SLIDING;
                    } else {
                        const leftDivRight = innerLeft + ci * colInnerW + (ci - 1) * PANEL + PANEL;
                        leftEdge = leftDivRight + MID_GAP_HALF;
                    }
                    if (rightIsOuter) {
                        rightEdge = housingRight + EDGE_OVERLAY - EDGE_INSET;
                    } else if (drawerType === "sliding") {
                        const rightDivLeft = isSlidingDouble
                            ? (innerLeft + colInnerW)
                            : (innerLeft + (ci + 1) * colInnerW + ci * PANEL);
                        rightEdge = rightDivLeft - MID_INSET_SLIDING;
                    } else {
                        const rightDivLeft = innerLeft + (ci + 1) * colInnerW + ci * PANEL;
                        rightEdge = rightDivLeft - MID_GAP_HALF;
                    }
                    frontW = Math.max(rightEdge - leftEdge, 2);
                    frontCenterX = (leftEdge + rightEdge) / 2;
                }

                this._addClosetColumnDrawers(group, {
                    meta,
                    colCenterX: frontCenterX,
                    bodyCenterX: bayCenterX,
                    frontW, drawerBodyW,
                    housingBottom, housingTop: housingBottom + housingH,
                    bodyFrontZ, drawerDepth, thick, frontMat, metalMat,
                    PANEL, SIDE_PER_DRAWER, FRONT_BOTTOM_OVERLAP: FRONT_BOTTOM_OVERLAP,
                    FRONT_TOP_INSET: 0.3, FRONT_GAP: 0.3,
                    cellId: cell.id, columnIndex: ci, drawerType
                });
            }
        } else {
            // ========== محل قرارگیری جدا برای هر ستون (تعداد نابرابر) ==========
            // هر ستون: دیواره چپ+راست + کف/سقف خودش
            // دیواره‌ها به هم می‌چسبند تا بادخور درب‌ها ۳ میل شود
            const gapBetween = 0;
            const colOuterW = Math.max(housingW / colCount, 8);
            const isFlushFront = (drawerType === "hidden" || drawerType === "sliding");
            const EDGE_OVERLAY = isFlushFront ? 0 : 1.6;
            const EDGE_INSET = isFlushFront ? 0.1 : 0;
            const MID_INSET = 0.15;
            const FRONT_BOTTOM_OVERLAP = (drawerType === "sliding") ? -0.2 : 1.6;
            const FRONT_TOP_INSET = 0.3;
            const FRONT_GAP = 0.3;

            // ارتفاع مرجع جبهه از ستون با کمترین تعداد کشو
            // تا درب پایین ستون‌ها هم‌اندازه باشد
            const minCount = Math.min.apply(null, colMeta.map(m => m.count));
            let refHousingH = SIDE_PER_DRAWER * minCount;
            if (refHousingH > H) refHousingH = H;
            const refStackBottom = cell.y - FRONT_BOTTOM_OVERLAP;
            const refStackTop = cell.y + refHousingH - FRONT_TOP_INSET;
            const refSpan = Math.max(refStackTop - refStackBottom, 4);
            const refGaps = FRONT_GAP * Math.max(minCount - 1, 0);
            const unitFrontH = Math.max((refSpan - refGaps) / minCount, 4);

            for (let ci = 0; ci < colCount; ci++) {
                const meta = colMeta[ci];
                const count = meta.count;
                let housingH = SIDE_PER_DRAWER * count;
                if (housingH > H) housingH = H;
                const housingBottom = cell.y;
                const housingTop = housingBottom + housingH;
                const housingCenterY = housingBottom + housingH / 2;

                const colLeft = housingLeft + ci * (colOuterW + gapBetween);
                const bayCenterX = colLeft + colOuterW / 2;

                // دیواره چپ / راست این ستون — ریلی: ۱۰ سانتی پایین‌تر
                const sideExtraDown = (drawerType === "sliding") ? 10 : 0;
                const sideH = housingH + sideExtraDown;
                const sideCy = housingCenterY - sideExtraDown / 2;
                const leftSide = new THREE.Mesh(
                    new THREE.BoxGeometry(PANEL, sideH, drawerDepth), carcassMat
                );
                leftSide.position.set(colLeft + PANEL / 2, sideCy, bodyCenterZ);
                leftSide.castShadow = true; leftSide.receiveShadow = true;
                group.add(leftSide);
                const rightSide = new THREE.Mesh(
                    new THREE.BoxGeometry(PANEL, sideH, drawerDepth), carcassMat
                );
                rightSide.position.set(colLeft + colOuterW - PANEL / 2, sideCy, bodyCenterZ);
                rightSide.castShadow = true; rightSide.receiveShadow = true;
                group.add(rightSide);

                // کف و سقف جدا برای این ستون
                const floorCeilW = Math.max(colOuterW - FLOOR_MINUS_SIDES, 2);
                const floorY = housingBottom + PANEL / 2;
                const ceilY = housingTop - PANEL / 2;
                [
                    [floorY, frontStripZ], [floorY, backStripZ],
                    [ceilY, frontStripZ], [ceilY, backStripZ]
                ].forEach(([y, z]) => {
                    const m = new THREE.Mesh(
                        new THREE.BoxGeometry(floorCeilW, PANEL, STRIP_D), carcassMat
                    );
                    m.position.set(bayCenterX, y, z);
                    m.castShadow = true; m.receiveShadow = true;
                    group.add(m);
                });

                if (drawerType === "normal" || drawerType === "hidden") {
                    const BACK_RAIL_H = 5.5;
                    const backRailZ = backStripZ;
                    const backRailY = housingBottom - BACK_RAIL_H / 2;
                    const backRail = new THREE.Mesh(
                        new THREE.BoxGeometry(floorCeilW, BACK_RAIL_H, PANEL),
                        carcassMat
                    );
                    backRail.position.set(bayCenterX, backRailY, backRailZ);
                    backRail.castShadow = true;
                    backRail.receiveShadow = true;
                    group.add(backRail);
                }
                if (drawerType === "sliding") {
                    const SLIDE_RAIL_H = 10;
                    const railY = housingBottom - SLIDE_RAIL_H / 2;
                    const frontRailZ = bodyFrontZ - PANEL / 2;
                    const backRailZ = (bodyFrontZ - drawerDepth) + PANEL / 2;
                    [frontRailZ, backRailZ].forEach(z => {
                        const rail = new THREE.Mesh(
                            new THREE.BoxGeometry(floorCeilW, SLIDE_RAIL_H, PANEL),
                            carcassMat
                        );
                        rail.position.set(bayCenterX, railY, z);
                        rail.castShadow = true;
                        rail.receiveShadow = true;
                        group.add(rail);
                    });
                }

                const colInnerW = Math.max(colOuterW - PANEL * 2, 2);
                const drawerBodyW = Math.max(colInnerW - DRAWER_BODY_CLEAR, 2);

                // عرض جبهه: معمولی +۱۶ میل؛ مخفی هم‌تراز لبه محل −۱ میل
                const leftIsOuter = (ci === 0);
                const rightIsOuter = (ci === colCount - 1);
                const leftEdge = leftIsOuter
                    ? (colLeft - EDGE_OVERLAY + EDGE_INSET)
                    : (colLeft + MID_INSET);
                const rightEdge = rightIsOuter
                    ? (colLeft + colOuterW + EDGE_OVERLAY - EDGE_INSET)
                    : (colLeft + colOuterW - MID_INSET);
                const frontW = Math.max(rightEdge - leftEdge, 2);
                const frontCenterX = (leftEdge + rightEdge) / 2;

                // ارتفاع جبهه‌ها: درب‌های پایین هم‌ارتفاع با ستون کوتاه‌تر؛ بقیه فضای باقی‌مانده
                const stackBottom = housingBottom - FRONT_BOTTOM_OVERLAP;
                const stackTop = housingTop - FRONT_TOP_INSET;
                const totalFrontSpan = Math.max(stackTop - stackBottom, 4);
                const frontGapsTotal = FRONT_GAP * Math.max(count - 1, 0);
                const frontHeights = [];
                if (count <= minCount) {
                    for (let i = 0; i < count; i++) frontHeights.push(unitFrontH);
                } else {
                    // count > minCount: minCount تای اول = unitFrontH، بقیه تقسیم باقی‌مانده
                    const usedBottom = unitFrontH * minCount + FRONT_GAP * minCount;
                    // gaps: minCount gaps between bottom group and upper, plus gaps among upper
                    // ساده‌تر: minCount تای اول unitFrontH با FRONT_GAP بین همه
                    for (let i = 0; i < minCount; i++) frontHeights.push(unitFrontH);
                    const remainCount = count - minCount;
                    const usedByBottom = unitFrontH * minCount + FRONT_GAP * (count - 1);
                    const remainH = Math.max(totalFrontSpan - usedByBottom, 4 * remainCount);
                    const eachUpper = remainH / remainCount;
                    for (let i = 0; i < remainCount; i++) frontHeights.push(Math.max(eachUpper, 4));
                }

                this._addClosetColumnDrawers(group, {
                    meta,
                    colCenterX: frontCenterX,
                    bodyCenterX: bayCenterX,
                    frontW, drawerBodyW,
                    housingBottom, housingTop,
                    bodyFrontZ, drawerDepth, thick, frontMat, metalMat,
                    PANEL, SIDE_PER_DRAWER,
                    FRONT_BOTTOM_OVERLAP: FRONT_BOTTOM_OVERLAP,
                    FRONT_TOP_INSET: FRONT_TOP_INSET,
                    FRONT_GAP: FRONT_GAP,
                    frontHeightsOverride: frontHeights,
                    cellId: cell.id, columnIndex: ci, drawerType
                });
            }
        }
    });
},

/**
 * ساخت جبهه و بدنه کشوهای یک ستون داخل محل قرارگیری
 */

/**
 * متریال جبهه کشو کمد از color/texture و finish ذخیره‌شده در drawersData
 */
_makeClosetDrawerFrontMaterial: function(dData, fallbackMat) {
    dData = dData || {};
    const finishKey = dData.finish || "matte";
    const preset = (typeof window.getKitchenFinishPreset === "function")
        ? window.getKitchenFinishPreset(finishKey)
        : { roughness: 0.45, metalness: 0.04, envMapIntensity: 0.5, clearcoat: 0 };

    const colorVal = dData.color || "";
    const colorName = dData.colorName || "";
    let frontMap = null;
    let frontColor = "#ffffff";

    const isPath = (v) => {
        if (!v || typeof v !== "string") return false;
        return v.includes("/") || v.startsWith("http") || /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(v);
    };

    try {
        if (colorName && window.isolatedDoorTextures && window.isolatedDoorTextures[colorName]) {
            frontMap = new THREE.TextureLoader().load(window.isolatedDoorTextures[colorName]);
        } else if (isPath(colorVal)) {
            frontMap = new THREE.TextureLoader().load(colorVal);
        } else if (colorVal) {
            frontColor = colorVal;
        }
        if (frontMap) {
            frontMap.wrapS = THREE.RepeatWrapping;
            frontMap.wrapT = THREE.RepeatWrapping;
            if (THREE.SRGBColorSpace) frontMap.colorSpace = THREE.SRGBColorSpace;
        }
    } catch (e) {
        frontMap = null;
    }

    const params = {
        roughness: preset.roughness != null ? preset.roughness : 0.45,
        metalness: preset.metalness != null ? preset.metalness : 0.04,
        envMapIntensity: preset.envMapIntensity != null ? preset.envMapIntensity : 0.5
    };
    if (frontMap) {
        params.map = frontMap;
        params.color = 0xffffff;
    } else {
        try {
            params.color = new THREE.Color(frontColor);
        } catch (e) {
            params.color = 0xffffff;
        }
    }
    if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === "function") {
        params.clearcoat = preset.clearcoat;
        params.clearcoatRoughness = preset.clearcoatRoughness || 0.05;
        return new THREE.MeshPhysicalMaterial(params);
    }
    return new THREE.MeshStandardMaterial(params);
},

_addClosetColumnDrawers: function(group, opts) {
    const {
        meta, colCenterX, frontW, drawerBodyW,
        housingBottom, housingTop,
        bodyFrontZ, drawerDepth, thick, frontMat, metalMat,
        PANEL, SIDE_PER_DRAWER,
        FRONT_BOTTOM_OVERLAP, FRONT_TOP_INSET, FRONT_GAP,
        cellId, columnIndex, drawerType
    } = opts;
    const bodyCenterX = (opts.bodyCenterX !== undefined) ? opts.bodyCenterX : colCenterX;

    const count = meta.count;
    const drawersData = meta.drawersData;
    const bodyHeights = meta.bodyHeights;
    const sumBodies = meta.sumBodies;

    const stackBottom = housingBottom - FRONT_BOTTOM_OVERLAP;
    const stackTop = housingTop - FRONT_TOP_INSET;
    const totalFrontSpan = Math.max(stackTop - stackBottom, 4);
    const frontGapsTotal = FRONT_GAP * Math.max(count - 1, 0);
    const availableFrontH = Math.max(totalFrontSpan - frontGapsTotal, 4);
    let frontHeights = [];
    if (opts.frontHeightsOverride && opts.frontHeightsOverride.length === count) {
        frontHeights = opts.frontHeightsOverride.slice();
    } else {
        for (let i = 0; i < count; i++) {
            const ratio = sumBodies > 0 ? (bodyHeights[i] / sumBodies) : (1 / count);
            frontHeights.push(Math.max(availableFrontH * ratio, 4));
        }
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
        const innerDepth = (dData.depth && !isNaN(parseFloat(dData.depth)))
            ? parseFloat(dData.depth)
            : Math.max(drawerDepth * 0.85, 20);

        // متریال جبهه از تنظیمات پنل درب (رنگ / تکسچر / پرداخت هر کشو)
        const thisFrontMat = (typeof this._makeClosetDrawerFrontMaterial === "function")
            ? this._makeClosetDrawerFrontMaterial(dData, frontMat)
            : frontMat;

        let drawerAsm = null;
        if (typeof this.createRealisticDrawer === "function") {
            drawerAsm = this.createRealisticDrawer({
                frontW: frontW,
                frontH: frontH,
                thick: thick,
                cabinetD: drawerDepth,
                cabinetW: frontW,
                innerDepth: innerDepth,
                innerHeight: bodyH,
                innerWidth: drawerBodyW,
                material: thisFrontMat,
                bodyColor: "#ffffff",
                bodyMaterialType: "mdf",
                bevel: 0.12
            });
        }

        const drawerRoot = new THREE.Group();
        const closedZ = bodyFrontZ + thick / 2;
        drawerRoot.position.set(colCenterX, frontCy, closedZ);

        if (drawerAsm && drawerAsm.front) {
            drawerAsm.front.position.set(0, 0, 0);
            if (drawerAsm.body) {
                drawerAsm.body.position.y = bodyCy - frontCy;
                drawerAsm.body.position.x = bodyCenterX - colCenterX;
            }
            drawerRoot.add(drawerAsm.front);

            const hw = Math.min(frontW * 0.35, 12);
            const handle = new THREE.Mesh(
                new THREE.BoxGeometry(hw, 0.55, 0.75),
                metalMat
            );
            handle.position.set(0, 0, thick / 2 + 0.4);
            handle.userData.isHandle = true;
            drawerAsm.front.add(handle);
        } else {
            const front = new THREE.Mesh(
                new THREE.BoxGeometry(frontW, frontH, thick),
                thisFrontMat
            );
            drawerRoot.add(front);
        }

        const openDelta = Math.min(innerDepth * 0.8, 40);
        drawerRoot.userData = {
            isDrawer: true,
            isClosetFrameDrawer: true,
            isOpen: false,
            closedZ: closedZ,
            openZ: closedZ + openDelta,
            targetZ: closedZ,
            closetCellId: cellId,
            drawerIndex: i,
            columnIndex: columnIndex,
            drawerType: drawerType
        };
        group.add(drawerRoot);
    }
},




// --- ⭐ تشخیص خانه‌ها و قرار دادن درب داخل هر خانه باز چهارچوب ---
addClosetFrameCellDoors: function(group, unit, minX, totalWidth, frameDepth) {
    const cellDoors = unit.frameCellDoors || {};
    if (!Object.keys(cellDoors).length) return;

    // همان الگوریتم پنل درب — فقط خانه‌هایی که هر چهار ضلع‌شان تیر واقعی دارد
    let cells = [];
    if (typeof window.detectClosetFrameCells === "function") {
        cells = window.detectClosetFrameCells(unit);
    }
    if (!cells.length) return;

    const SIDE_ORDER = ["left", "right", "top", "bottom"];
    // اگر روکوب جلو فعال باشد، درب روی سطح بیرونی روکوب (۱۶ میل) می‌نشیند
    const frontRokoobT = (typeof this.getClosetFrontRokoobThickness === "function")
        ? this.getClosetFrontRokoobThickness(unit)
        : 0;

    cells.forEach(cell => {
        let cellCfg = cellDoors[cell.id];
        if (!cellCfg) return;

        // مهاجرت فرمت قدیمی → sides
        let sidesMap = cellCfg.sides;
        if (!sidesMap) {
            sidesMap = {};
            if (cellCfg.enabled === true) {
                const hs = cellCfg.hingeSide || "left";
                sidesMap[hs] = Object.assign({}, cellCfg, { enabled: true });
            }
        }

        const OVERLAP = 1.6;
        if (cell.w < 2 || cell.h < 2) return;

        // ——— درب ریلی: داخل محدوده بخش، حرکت چپ/راست ———
        const cellDoorType = cellCfg.doorType || (sidesMap.left && sidesMap.left.doorType) || "side";
        const cellEnabled = cellCfg.enabled === true ||
            SIDE_ORDER.some(s => sidesMap[s] && sidesMap[s].enabled === true);
        if (cellEnabled && cellDoorType === "sliding" && cellCfg.showDoors !== false) {
            this.addClosetSlidingDoors(group, unit, cell, cellCfg, minX, totalWidth, frameDepth, frontRokoobT);
            return;
        }

        // همپوشانی استاندارد ۱۶ میل روی لولا
        // تک‌سمت: عرض = خانه+۳.۲ | جفت چپ+راست افقی: هر درب = (خانه+۲)/۲
        const leftOn = sidesMap.left && sidesMap.left.enabled === true && sidesMap.left.showDoors !== false;
        const rightOn = sidesMap.right && sidesMap.right.enabled === true && sidesMap.right.showDoors !== false;
        const isHorizType = (t) => !t || t === "side" || t === "lift-side";
        const bothLeftRightHoriz = leftOn && rightOn &&
            isHorizType(sidesMap.left.doorType) && isHorizType(sidesMap.right.doorType);

        SIDE_ORDER.forEach(hingeSide => {
            const cfg = sidesMap[hingeSide];
            if (!cfg || cfg.enabled !== true || cfg.showDoors === false) return;

            const doorCount = Math.max(1, cfg.doors || 1);
            const doorThick = 1.6;
            const doorMat = this.buildClosetFrameDoorMaterial(cfg);

            let defaultW = cell.w + OVERLAP * 2;
            const defaultH = cell.h + 3;
            if (bothLeftRightHoriz && (hingeSide === "left" || hingeSide === "right")) {
                defaultW = (cell.w + 2) / 2 - 0.1; // (عرض داخلی + ۲) / ۲ منهای یک میل بادخور
            }

            for (let i = 0; i < doorCount; i++) {
                let doorW = defaultW / doorCount;
                let doorH = defaultH;
                if (hingeSide === "top" || hingeSide === "bottom") {
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
                const spanW = (hingeSide === "left" || hingeSide === "right") ? defaultW : (cell.w + 3);
                const spanH = (hingeSide === "top" || hingeSide === "bottom") ? (cell.h + OVERLAP * 2) : defaultH;
                const offsetX = (hingeSide === "left" || hingeSide === "right")
                    ? (i - (doorCount - 1) / 2) * (spanW / doorCount) : 0;
                const offsetY = (hingeSide === "top" || hingeSide === "bottom")
                    ? (i - (doorCount - 1) / 2) * (spanH / doorCount) : 0;

                const hinge = new THREE.Group();
                let hingeDirX = 0, hingeDirY = 0, axis = "y", openDirection = -1;
                // پشت درب روی سطح جلوی چهارچوب؛ اگر روکوب جلو باشد روی سطح بیرونی روکوب (۱۶ میل)
                const doorZ = (frameDepth / 2) + frontRokoobT + (doorThick / 2);

                // لولا روی لبه — جفت چپ/راست هر کدام نصف دهانه را می‌پوشانند
                if (hingeSide === "left") {
                    hingeDirX = -1; axis = "y"; openDirection = -1;
                    if (bothLeftRightHoriz) {
                        // لولا نزدیک لبه چپ بازشو (+۱ از جمع +۲)
                        hinge.position.set(cellCenterX - cell.w / 2 - 1 + offsetX, cellCenterY + offsetY, doorZ);
                    } else {
                        hinge.position.set(cellCenterX + offsetX - doorW / 2, cellCenterY + offsetY, doorZ);
                    }
                } else if (hingeSide === "right") {
                    hingeDirX = 1; axis = "y"; openDirection = 1;
                    if (bothLeftRightHoriz) {
                        hinge.position.set(cellCenterX + cell.w / 2 + 1 + offsetX, cellCenterY + offsetY, doorZ);
                    } else {
                        hinge.position.set(cellCenterX + offsetX + doorW / 2, cellCenterY + offsetY, doorZ);
                    }
                } else if (hingeSide === "bottom") {
                    hingeDirY = -1; axis = "x"; openDirection = -1;
                    hinge.position.set(cellCenterX + offsetX, cellCenterY + offsetY - doorH / 2, doorZ);
                } else {
                    hingeDirY = 1; axis = "x"; openDirection = 1;
                    hinge.position.set(cellCenterX + offsetX, cellCenterY + offsetY + doorH / 2, doorZ);
                }
                group.add(hinge);

                const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorThick), doorMat);
                doorMesh.castShadow = true;
                doorMesh.receiveShadow = true;
                // مرکز درب نسبت به لولا: لبهٔ لولا روی محور چرخش
                doorMesh.position.set(-hingeDirX * (doorW / 2), -hingeDirY * (doorH / 2), 0);
                hinge.add(doorMesh);

                if (typeof this.createBarHandle === "function") {
                    const isVerticalHinge = hingeSide === "left" || hingeSide === "right";
                    const handleLen = isVerticalHinge
                        ? Math.min(16, Math.max(10, doorH * 0.22))
                        : Math.min(16, Math.max(10, doorW * 0.22));
                    const handleGroup = this.createBarHandle({
                        orientation: isVerticalHinge ? "vertical" : "horizontal",
                        length: handleLen,
                        standoff: 1.35,
                        metalness: 0.96,
                        roughness: 0.14,
                        color: 0xc8c8c8
                    });
                    // دستگیره نزدیک لبهٔ آزاد (مقابل لولا) روی سطح جلوی درب
                    // مختصات محلی درب: لبه لولا = hingeDir سمت منفی، لبه آزاد = سمت مثبت مخالف
                    if (hingeSide === "left") {
                        // لبه آزاد در +X محلی
                        handleGroup.position.set(doorW / 2 - 3, 0, doorThick / 2);
                    } else if (hingeSide === "right") {
                        // لبه آزاد در -X محلی
                        handleGroup.position.set(-(doorW / 2 - 3), 0, doorThick / 2);
                    } else if (hingeSide === "bottom") {
                        handleGroup.position.set(0, doorH / 2 - 3, doorThick / 2);
                    } else {
                        handleGroup.position.set(0, -(doorH / 2 - 3), doorThick / 2);
                    }
                    doorMesh.add(handleGroup);
                }

                doorMesh.userData = {
                    isDoor: true,
                    isOpen: false,
                    openDirection: openDirection,
                    axis: axis,
                    hinge: hinge,
                    isClosetFrameDoor: true,
                    closetCellId: cell.id,
                    hingeSide: hingeSide
                };
            }
        });
    });
},

// --- ⭐ ساخت درب کناری روی یک قطعه چهارچوب کمد دیواری (سمت راست/چپ) ---
addClosetFramePartDoor: function(group, cfg, beamCenterX, beamCenterY, beamW, beamH, beamD, side) {
    const REVEAL = 1.6;   // فاصله لبه تا شروع درب (سمت لولا)
    const doorThick = 1.6; // ضخامت استاندارد درب ۱۶ میل
    const FORWARD_OFFSET = 1.6; // ۱۶ میل جلوتر از روی چهارچوب

    const sizes = (cfg.doorSizes && cfg.doorSizes[0]) ? cfg.doorSizes[0] : {};
    const doorH = (sizes.h && !isNaN(parseFloat(sizes.h))) ? parseFloat(sizes.h) : beamH;
    const doorW = (sizes.w && !isNaN(parseFloat(sizes.w))) ? parseFloat(sizes.w) : 35;

    const doorZ = (beamD / 2) - (doorThick / 2) + FORWARD_OFFSET;

    // 🌟 لبه‌ی لولا دقیقاً روی خودِ چهارچوب (لبه‌ی بیرونی تیر) قرار می‌گیره
    const edgeX = side === "left" ? -(beamW / 2) : (beamW / 2);
    const dir = side === "left" ? -1 : 1;

// ⭐ گروه «لولا» — همون چیزی که سیستم کلیک برای چرخوندن دنبالش می‌گرده
    // 🌟 اصلاح: همپوشانیِ روی چهارچوب رو اینجا (موقعیت خودِ لولا) اعمال می‌کنیم، نه روی افست درب،
    // تا محور چرخش دقیقاً روی لبه‌ی واقعی درب بمونه و موقع باز شدن داخل چهارچوب نره
    const hinge = new THREE.Group();
    hinge.position.set(beamCenterX + edgeX - dir * REVEAL, beamCenterY, doorZ);
    group.add(hinge);

    const doorMat = this.buildClosetFrameDoorMaterial(cfg);
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorThick), doorMat);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    // محور چرخش دقیقاً روی لبه‌ی واقعی درب (نصف عرض)، درست مثل درب یونیت‌ها
    doorMesh.position.set(dir * (doorW / 2), 0, 0);
    hinge.add(doorMesh);

    // دستگیره میله‌ای استاندارد (مثل درب‌های کابینت آشپزخانه) روی لبه مقابل لولا
    // تا با درب بچرخه و شکل درست داشته باشد
    const handleLen = Math.min(16, Math.max(10, doorH * 0.22));
    let handleGroup;
    if (typeof this.createBarHandle === 'function') {
        handleGroup = this.createBarHandle({
            orientation: 'vertical',
            length: handleLen,
            standoff: 1.35,
            metalness: 0.96,
            roughness: 0.14,
            color: 0xc8c8c8
        });
    } else {
        // fallback ساده
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.9, roughness: 0.2 });
        handleGroup = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, handleLen, 16), handleMat);
    }
    // نزدیک لبه‌ی آزاد درب (مقابل لولا)
    const handleLocalX = dir * (doorW / 2 - 3);
    handleGroup.position.set(handleLocalX, 0, doorThick / 2);
    doorMesh.add(handleGroup);

    // ⭐ لولای واقعی — دقیقاً همون الگوی درب‌های کابینت معمولی: یه پایه‌ی ثابت روی چهارچوب
    // + بازو/کاپ که با خودِ درب می‌چرخه، تا از بیرون هم لولا دیده بشه
    const hMat = new THREE.MeshPhysicalMaterial({ color: 0xcccccc, metalness: 1.0, roughness: 0.1, clearcoat: 1.0 });
    const staticHinge = new THREE.Object3D();
    staticHinge.position.copy(hinge.position);
    group.add(staticHinge);

    const baseGeo = new THREE.BoxGeometry(0.5, 4, 2);
    const armGeo = new THREE.BoxGeometry(2.5, 1.5, 0.4);
    const cupGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 16);
    cupGeo.rotateX(Math.PI / 2);

    const hingeEdgeLocalX = -dir * (doorW / 2); // سمت لولا، در مختصات محلی خودِ درب

    const addOneClosetHinge = (offsetY) => {
        const base = new THREE.Mesh(baseGeo, hMat);
        const baseX = (-dir) * (doorThick / 2 + 0.25);
        base.position.set(baseX, offsetY, -doorThick - 1.5);
        staticHinge.add(base);

        const cup = new THREE.Mesh(cupGeo, hMat);
        const cupX = hingeEdgeLocalX + (dir * 2.5);
        cup.position.set(cupX, offsetY, -doorThick / 2);
        doorMesh.add(cup);

        const arm = new THREE.Mesh(armGeo, hMat);
        const armX = hingeEdgeLocalX + (dir * 1.5);
        arm.position.set(armX, offsetY, -doorThick - 0.5);
        doorMesh.add(arm);
    };

    addOneClosetHinge(doorH / 2 - 10);
    addOneClosetHinge(-doorH / 2 + 10);

    // ⭐ اتصال به سیستم کلیک/انیمیشن باز‌شدن (همون چیزی که درب‌های کابینت معمولی دارن)
    doorMesh.userData = {
        isDoor: true,
        isOpen: false,
        openDirection: -dir, // 🌟 معکوس شد تا درب به سمت بیرون چهارچوب باز بشه
        axis: 'y',
        hinge: hinge
    };
},
        // --- تابع جدید برای بروزرسانی فقط کابینت‌ها در نمای 3D ---
   /**
    * بازسازی کابینت‌ها در نمای ۳D
    * @param {number|string} [cabinetId] اگر داده شود فقط همان یونیت؛ وگرنه همه
    */
   refreshCabinets: function(cabinetId) {
    if (!this.scene) return;

    const onlyOne = (cabinetId != null && cabinetId !== -1 && cabinetId !== '');

    // ۱. جمع‌آوری کابینت(های) قبلی
    const cabinetsToRemove = [];
    this.scene.traverse((obj) => {
        if (!(obj && obj.userData && obj.userData.isCabinet)) return;
        if (onlyOne) {
            const data = obj.userData.cabinetData;
            if (data && data.id === cabinetId) cabinetsToRemove.push(obj);
        } else {
            cabinetsToRemove.push(obj);
        }
    });

    // ۲. حذف + آزادسازی GPU
    cabinetsToRemove.forEach((obj) => {
        if (typeof this.disposeObjectTree === 'function') {
            this.disposeObjectTree(obj);
        } else {
            try { this.scene.remove(obj); } catch (e) {}
        }
    });

    // ۳. ساخت مجدد — فقط همان یونیت یا همه
    if (typeof this.renderCabinets === 'function') {
        this.renderCabinets(onlyOne ? cabinetId : undefined);
    }

    // سایه و اجزای سراسری فقط در رفرش کامل (نه برای تغییر یک درب)
    if (!onlyOne) {
        if (typeof this.applyProfessionalShadows === 'function') {
            this.applyProfessionalShadows();
        }
        if (typeof updateAllCountertopsIn3D === 'function') updateAllCountertopsIn3D();
        if (typeof updateAllCabinetCrownsIn3D === 'function') updateAllCabinetCrownsIn3D();
        if (typeof updateAllShelvesIn3D === 'function') updateAllShelvesIn3D();
        if (typeof this.refreshInterPanels === 'function') {
            this.refreshInterPanels();
        }
    } else {
        // برای تک‌یونیت: درب/تکسچر همان یونیت
        if (typeof updateAllCabinetDoorsIn3D === 'function') {
            try { updateAllCabinetDoorsIn3D(); } catch (e) {}
        }
    }
},

    /** میانبر واضح برای آپدیت یک یونیت */
    refreshCabinetById: function(cabinetId) {
        return this.refreshCabinets(cabinetId);
    },


    
            refreshRoom: function() {
        if (!this.scene) return;

        // حذف اشیاء محیطی (دیوار، کف، سقف و ستون‌ها)
        const toRemove = [];
        this.scene.traverse((obj) => {
            if (obj.isMesh && 
                !obj.userData.isCabinet && 
                !obj.userData.isKickboard && 
                !obj.userData.isCrown && 
                !obj.userData.isCountertop) {
                toRemove.push(obj);
            }
        });
        toRemove.forEach(o => this.scene.remove(o));

        const centerX = room.w / 2;
        const centerZ = room.d / 2;
        
        this.createEnvironment(centerX, centerZ);
        this.renderPillars(); 
        
        // <--- این خط اضافه شد تا هالوژن‌ها هم با ارتفاع جدید دوباره ساخته شوند --->
        this.createCeilingLamp(); 
        
        if (this.renderer && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },


    // =====================================================================
    // 🪵 سیستم هندسه پایه پنل کابینت (Panel System)
    // Panel
    //  ├─ Front  (وجه رویه)
    //  ├─ Edge   (لبه‌ها)
    //  └─ Back   (پشت)
    // با Bevel ظریف و کنترل‌شده روی لبه‌های قابل مشاهده
    // ابعاد خارجی، Pivot، Rotation و Animation دست‌نخورده باقی می‌مانند.
    // =====================================================================
    createPanelGeometry: function(width, height, depth, bevelRadius = 0.12) {
        const w = Math.max(0.01, width);
        const h = Math.max(0.01, height);
        const d = Math.max(0.01, depth);
        // شعاع خیلی کوچک تا فقط گوشه‌ها کمی نرم شوند (ظریف)
        const r = Math.min(bevelRadius, w * 0.15, h * 0.15, 0.25);

        const shape = new THREE.Shape();
        const hw = w / 2;
        const hh = h / 2;

        // مستطیل گردشده (rounded rect) — ابعاد کلی دقیقاً w × h
        shape.moveTo(-hw + r, -hh);
        shape.lineTo( hw - r, -hh);
        shape.quadraticCurveTo( hw, -hh,  hw, -hh + r);
        shape.lineTo( hw,  hh - r);
        shape.quadraticCurveTo( hw,  hh,  hw - r,  hh);
        shape.lineTo(-hw + r,  hh);
        shape.quadraticCurveTo(-hw,  hh, -hw,  hh - r);
        shape.lineTo(-hw, -hh + r);
        shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

        // ExtrudeGeometry r186 — depth (نه amount)، bevel/UV/normals سازگار
        const extrudeSettings = {
            depth: d,
            bevelEnabled: false,
            curveSegments: 3
        };

        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Extrude از z=0 تا z=d → مرکز روی مبدأ
        geo.translate(0, 0, -d / 2);
        geo.computeVertexNormals();

        // 🔧 UV مثل BoxGeometry (رویه/پشت ۰..۱)
        const pos = geo.attributes.position;
        const uv  = geo.attributes.uv;
        const nor = geo.attributes.normal;

        if (pos && uv && nor) {
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i);
                const y = pos.getY(i);
                const z = pos.getZ(i);
                const nx = nor.getX(i);
                const ny = nor.getY(i);
                const nz = nor.getZ(i);

                if (Math.abs(nz) > 0.5) {
                    uv.setXY(i, (x / w) + 0.5, (y / h) + 0.5);
                } else if (Math.abs(nx) > 0.5) {
                    uv.setXY(i, (z / d) + 0.5, (y / h) + 0.5);
                } else if (Math.abs(ny) > 0.5) {
                    uv.setXY(i, (x / w) + 0.5, (z / d) + 0.5);
                }
            }
            uv.needsUpdate = true;
        }

        return geo;
    },

    /**
     * ساخت مش پنل با Bevel ظریف + متریال Front/Edge/Back
     * برای اطمینان از نمایش تکسچر، در صورت مشکل گروه Extrude از BoxGeometry استفاده می‌شود.
     */
    createPanelMesh: function(width, height, depth, material, bevelRadius = 0.12) {
        // تفکیک متریال‌ها
        let edgeMat, frontMat, backMat;
        if (Array.isArray(material) && material.length >= 6) {
            // Box order: [+x,-x,+y,-y,+z(front),-z(back)]
            edgeMat  = material[0];
            frontMat = material[4];
            backMat  = material[5];
        } else if (Array.isArray(material) && material.length === 3) {
            edgeMat  = material[0];
            backMat  = material[1];
            frontMat = material[2];
        } else {
            // تک‌متریال
            edgeMat = frontMat = backMat = material;
        }

        // 🔧 استفاده از BoxGeometry با متریال ۶وجهی — پایدارترین روش برای نمایش تکسچر
        // Bevel خیلی ظریف را فعلاً با همان گوشه نرم‌شده‌ی قبلی نگه می‌داریم فقط اگر تک‌متریال باشد
        // اولویت: تکسچر حتماً دیده شود
        const boxGeo = new THREE.BoxGeometry(width, height, depth);
        const boxMats = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];
        const mesh = new THREE.Mesh(boxGeo, boxMats);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    },

    // =====================================================================
    // 🔩 دستگیره سه‌بعدی واقعی (پایه + بدنه + فاصله از درب)
    // orientation: 'vertical' | 'horizontal'
    // =====================================================================
    createBarHandle: function(opts = {}) {
        const orientation = opts.orientation || 'vertical';
        const length = opts.length || 14;
        const barRadius = opts.barRadius || 0.45;
        const postRadius = opts.postRadius || 0.55;
        const standoff = opts.standoff !== undefined ? opts.standoff : 1.4; // فاصله از سطح درب
        const postSpan = opts.postSpan || Math.max(6, length * 0.72);
        const color = opts.color !== undefined ? opts.color : 0xc8c8c8;
        const metalness = opts.metalness !== undefined ? opts.metalness : 0.95;
        const roughness = opts.roughness !== undefined ? opts.roughness : 0.18;

        // متریال اشتراکی برای دستگیره‌های هم‌رنگ
        const matKey = 'handleMat_' + color + '_' + metalness + '_' + roughness;
        const mat = this.getSharedMaterial(matKey, function () {
            return new THREE.MeshStandardMaterial({
                color: color,
                metalness: metalness,
                roughness: roughness
            });
        });

        const group = new THREE.Group();
        group.name = 'barHandle';
        group.userData.isHandle = true;

        // هندسه‌های اشتراکی (ثابت‌ترین بخش‌های تکراری صحنه)
        const postLen = standoff + barRadius;
        const postKey = ['cyl', postRadius.toFixed(3), (postRadius * 0.92).toFixed(3), postLen.toFixed(3), 16].join('_');
        const postGeo = this.getSharedGeometry(postKey, function () {
            return new THREE.CylinderGeometry(postRadius, postRadius * 0.92, postLen, 16);
        });
        const halfSpan = postSpan / 2;
        const postZ = postLen / 2;

        [-halfSpan, halfSpan].forEach((along) => {
            const post = new THREE.Mesh(postGeo, mat);
            post.rotation.x = Math.PI / 2;
            if (orientation === 'vertical') {
                post.position.set(0, along, postZ);
            } else {
                post.position.set(along, 0, postZ);
            }
            post.castShadow = true;
            post.receiveShadow = true;
            group.add(post);
        });

        // بدنه (میله)
        const barZ = standoff + barRadius;
        const barKey = ['cyl', barRadius.toFixed(3), barRadius.toFixed(3), length.toFixed(2), 20].join('_');
        const barGeo = this.getSharedGeometry(barKey, function () {
            return new THREE.CylinderGeometry(barRadius, barRadius, length, 20);
        });
        const bar = new THREE.Mesh(barGeo, mat);
        if (orientation === 'horizontal') bar.rotation.z = Math.PI / 2;
        bar.position.set(0, 0, barZ);
        bar.castShadow = true;
        bar.receiveShadow = true;
        group.add(bar);

        // کلاهک دو سر میله
        const capR = barRadius * 1.05;
        const capKey = ['sph', capR.toFixed(3), 12, 10].join('_');
        const capGeo = this.getSharedGeometry(capKey, function () {
            return new THREE.SphereGeometry(capR, 12, 10);
        });
        const capA = new THREE.Mesh(capGeo, mat);
        const capB = new THREE.Mesh(capGeo, mat);
        if (orientation === 'vertical') {
            capA.position.set(0, length / 2, barZ);
            capB.position.set(0, -length / 2, barZ);
        } else {
            capA.position.set(length / 2, 0, barZ);
            capB.position.set(-length / 2, 0, barZ);
        }
        group.add(capA, capB);

        return group;
    },


    // =====================================================================
    // 🎨 سیستم متریال واقعی لبه (Edge Material System)
    // برای قطعات قابل مشاهده:
    //   Front Material  → سطح تمام‌شده (تکسچر / رنگ)
    //   Edge Material   → نوار لبه (PVC/ABS) — نه ادامه تخت تکسچر رویه
    //   Back Material   → پشت (معمولاً ملامینه سفید)
    // وقتی از زاویه نگاه شود لبه MDF مصنوعی به نظر نمی‌رسد.
    // =====================================================================
    /**
     * ساخت سه‌تایی متریال Front / Edge / Back
     * @returns {{ front: THREE.Material, edge: THREE.Material, back: THREE.Material, boxArray: THREE.Material[] }}
     */
    createFaceMaterials: function(opts = {}) {
        // پرداخت نوری: doorFinish اولویت دارد، بعد materialType، بعد پیش‌فرض mdf
        const finishKey = opts.finishType || opts.materialType || opts.type || 'matte';
        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(finishKey)
            : { roughness: 0.35, metalness: 0.05, envMapIntensity: 0.5, bumpScale: 0.08, clearcoat: 0 };

        const roughnessFront = opts.roughnessFront !== undefined ? opts.roughnessFront : preset.roughness;
        const roughnessEdge  = opts.roughnessEdge  !== undefined ? opts.roughnessEdge  : Math.min(0.9, preset.roughness + 0.2);
        const metalness      = opts.metalness !== undefined ? opts.metalness : preset.metalness;
        const envMapIntensity = opts.envMapIntensity !== undefined ? opts.envMapIntensity : (preset.envMapIntensity || 0.5);
        const bumpScale      = opts.bumpScale !== undefined ? opts.bumpScale : (preset.bumpScale || 0);

        const safeColor = (val, fallback) => {
            if (typeof val === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val.trim())) {
                return new THREE.Color(val.trim());
            }
            if (typeof val === 'number' && isFinite(val)) {
                return new THREE.Color(val);
            }
            return new THREE.Color(fallback || '#FFFFFF');
        };

        const buildFront = (map, colorVal) => {
            const params = {
                roughness: roughnessFront,
                metalness: metalness,
                envMapIntensity: envMapIntensity
            };
            if (map) {
                params.map = map;
                params.color = 0xffffff;
                if (bumpScale > 0) {
                    params.bumpMap = (typeof window.asDataMapTexture === 'function') ? window.asDataMapTexture(map) : map;
                    params.bumpScale = bumpScale;
                }
            } else {
                params.color = safeColor(colorVal, '#FFFFFF');
            }
            if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
                params.clearcoat = preset.clearcoat;
                params.clearcoatRoughness = preset.clearcoatRoughness || 0.1;
                return new THREE.MeshPhysicalMaterial(params);
            }
            return new THREE.MeshStandardMaterial(params);
        };

        let frontMat = opts.frontMap ? buildFront(opts.frontMap, null) : buildFront(null, opts.frontColor);

        let edgeColorHex = null;
        if (opts.edgeColor && typeof opts.edgeColor === 'string' && opts.edgeColor.startsWith('#')) {
            edgeColorHex = opts.edgeColor;
        } else if (opts.frontColor && typeof opts.frontColor === 'string' && opts.frontColor.startsWith('#')) {
            edgeColorHex = opts.frontColor;
        } else if (opts.materialCode && typeof opts.materialCode === 'string' && opts.materialCode.startsWith('#')) {
            edgeColorHex = opts.materialCode;
        }
        if (!edgeColorHex) edgeColorHex = opts.fallbackEdgeColor || '#C8B8A8';

        const edgeColor = safeColor(edgeColorHex, '#C8B8A8');
        edgeColor.multiplyScalar(0.92);
        const edgeMetal = (finishKey === 'steel') ? Math.max(0.7, metalness * 0.9) : Math.min(0.08, metalness);
        const edgeMat = new THREE.MeshStandardMaterial({
            color: edgeColor,
            roughness: roughnessEdge,
            metalness: edgeMetal,
            envMapIntensity: envMapIntensity * 0.7
        });

        let backMat = opts.frontMap
            ? buildFront(opts.frontMap, null)
            : buildFront(null, opts.backColor || opts.frontColor);

        // اطمینان از اعمال واقعی roughness/metalness روی متریال‌ها
        [frontMat, backMat].forEach(m => {
            if (!m) return;
            m.roughness = roughnessFront;
            m.metalness = metalness;
            if (m.envMapIntensity !== undefined) m.envMapIntensity = envMapIntensity;
            if (!(preset.clearcoat && preset.clearcoat > 0.05)) {
                if (m.clearcoat !== undefined) m.clearcoat = 0;
            }
            m.needsUpdate = true;
        });

        const boxArray = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];
        return { front: frontMat, edge: edgeMat, back: backMat, boxArray };
    },


    // =====================================================================
    // 🌑 سیستم داخل یونیت (Interior System)
    // فضای داخلی (پشت / کف / سقف / دیواره‌ها) کمی تاریک‌تر از بیرون است
    // تا وقتی درب باز می‌شود عمق کابینت کاملاً حس شود.
    // =====================================================================
    createInteriorMaterials: function(opts = {}) {
        // دیواره / کف / سقف — Shared Materials (یک MDF → یک Material)
        const sideColor = opts.sideColor || 0xe8e6e3;
        const topBotColor = opts.topBotColor || 0xe4e2df;
        const backColor = opts.backColor || 0xd4d2cf;
        const roughness = opts.roughness !== undefined ? opts.roughness : 0.62;
        const metalness = 0.0;
        const self = this;

        const side = this.getSharedMaterial(
            'interior_side_' + sideColor + '_' + roughness,
            function () {
                return new THREE.MeshStandardMaterial({
                    color: sideColor, roughness: roughness, metalness: metalness
                });
            }
        );
        const topBottom = this.getSharedMaterial(
            'interior_tb_' + topBotColor + '_' + (roughness + 0.05),
            function () {
                return new THREE.MeshStandardMaterial({
                    color: topBotColor, roughness: roughness + 0.05, metalness: metalness
                });
            }
        );
        const back = this.getSharedMaterial(
            'interior_back_' + backColor,
            function () {
                return new THREE.MeshStandardMaterial({
                    color: backColor, roughness: 0.75, metalness: 0.0
                });
            }
        );

        return {
            side: side,
            topBottom: topBottom,
            back: back,
            whiteMat: side,
            backMat: back,
            bodyMat: side
        };
    },


    // =====================================================================
    // 📦 سیستم بدنه واقعی یونیت (Unit Body System)
    // Body
    //  ├─ Left Panel
    //  ├─ Right Panel
    //  ├─ Top
    //  ├─ Bottom
    //  ├─ Back
    //  └─ Shelf (از طریق createShelves)
    // وقتی درب باز شود داخل کابینت واقعاً ساخته‌شده دیده می‌شود.
    // ابعاد خارجی، محل یونیت، Rotation و Pivot دست‌نخورده می‌مانند.
    // =====================================================================
    /**
     * متریک زاویه دیوار کناری
     * UI: ۹۰=صاف | کمتر=بسته (جلو جمع) | بیشتر=باز (جلو گشاد)
     * سازگاری با مقادیر قدیمی ‎-۴۵..۴۵
     */
    getSideAngleMetrics: function(c) {
        // UI: ۹۰=صاف | کمتر از ۹۰=چرخش به چپ | بیشتر=چرخش به راست
        const normalizeUI = (v) => {
            if (v === undefined || v === null || v === '') return 90;
            let a = parseFloat(v);
            if (!Number.isFinite(a)) return 90;
            if (c && c.sideAngleUI !== true && a >= -45 && a <= 45) {
                a = 90 - a; // مهاجرت یک‌باره از سیستم قدیمی
            }
            return Math.max(0, Math.min(180, a));
        };
        const uiL = normalizeUI(c && c.sideAngleLeft);
        const uiR = normalizeUI(c && c.sideAngleRight);
        // انحراف از صاف: منفی=چپ ، مثبت=راست
        const devL = uiL - 90;
        const devR = uiR - 90;
        const W = parseFloat(c && c.w) || 60;
        const D = parseFloat(c && c.d) || 55;
        const radL = devL * Math.PI / 180;
        const radR = devR * Math.PI / 180;
        // جابه‌جایی لبه جلو نسبت به عقب در محور X (چرخش حول لبه عقب)
        const shiftL = Math.tan(radL) * D;
        const shiftR = Math.tan(radR) * D;
        const frontLeft = -W / 2 + shiftL;
        const frontRight = W / 2 + shiftR;
        const frontW = Math.max(1, frontRight - frontLeft);
        const frontCenterX = (frontLeft + frontRight) / 2;
        return {
            uiL: uiL, uiR: uiR,
            devL: devL, devR: devR,
            radL: radL, radR: radR,
            // inset* برای شکل کف: فاصله افقی لبه جلو از گوشهٔ عقب هم‌طرف
            insetL: shiftL,
            insetR: shiftR,
            frontW: frontW,
            frontCenterX: frontCenterX,
            frontLeft: frontLeft,
            frontRight: frontRight,
            W: W, D: D
        };
    },

    createUnitBody: function(group, c, options = {}) {
        const bodyGroup = new THREE.Group();
        bodyGroup.name = 'unitBody';

        const panelThickness = options.panelThickness || 1.6;
        const backPanelThickness = options.backPanelThickness !== undefined ? options.backPanelThickness : 0.3;
        const grooveDepth = options.grooveDepth !== undefined ? options.grooveDepth : 0.7;
        const backInset = options.backInset !== undefined ? options.backInset : 1.7;
        const shortTopDepth = options.shortTopDepth !== undefined ? options.shortTopDepth : 2.0; // سقف ۲ سانت کوتاه‌تر از عقب
        const includeBack = options.includeBack !== false;
        const includeTop = options.includeTop !== false;
        const includeBottom = options.includeBottom !== false;
        const sidesFullDepth = options.sidesFullDepth !== false;

        const W = parseFloat(c.w) || 60;
        const H = parseFloat(c.h) || 72;
        const D = parseFloat(c.d) || 55;

        // متریال داخل یونیت (کمی تاریک‌تر از بیرون برای حس عمق)
        const interior = (typeof this.createInteriorMaterials === 'function')
            ? this.createInteriorMaterials()
            : null;
        const bodyMat = options.bodyMat || (interior
            ? interior.bodyMat
            : new THREE.MeshStandardMaterial({ color: 0xe8e6e3, roughness: 0.62, metalness: 0.0 }));
        const backMat = options.backMat || (interior
            ? interior.backMat
            : new THREE.MeshStandardMaterial({ color: 0xd4d2cf, roughness: 0.75, metalness: 0.0 }));

        // ---- Left / Right Panels (UI: ۹۰=صاف | کمتر=بسته | بیشتر=باز) ----
        const _smBody = (typeof this.getSideAngleMetrics === 'function')
            ? this.getSideAngleMetrics(c)
            : { radL: 0, radR: 0, frontW: W, frontCenterX: 0, insetL: 0, insetR: 0 };
        const radL = _smBody.radL;
        const radR = _smBody.radR;

        // طول مؤثر ورق کناری (با زاویه کمی بلندتر می‌شود)
        const leftLen = D / Math.max(0.25, Math.cos(radL));
        const rightLen = D / Math.max(0.25, Math.cos(radR));

        // لولا در لبه عقب — چرخش حول Y
        const leftPivot = new THREE.Group();
        leftPivot.name = 'bodyLeftPivot';
        leftPivot.position.set(-W / 2 + panelThickness / 2, 0, -D / 2);
        leftPivot.rotation.y = radL; // مثبت: جلو به +X (داخل)
        const leftGeo = new THREE.BoxGeometry(panelThickness, H, leftLen);
        const leftMesh = new THREE.Mesh(leftGeo, bodyMat);
        leftMesh.name = 'bodyLeft';
        leftMesh.position.set(0, 0, leftLen / 2);
        leftMesh.castShadow = true;
        leftMesh.receiveShadow = true;
        leftPivot.add(leftMesh);
        bodyGroup.add(leftPivot);

        const rightPivot = new THREE.Group();
        rightPivot.name = 'bodyRightPivot';
        rightPivot.position.set(W / 2 - panelThickness / 2, 0, -D / 2);
        rightPivot.rotation.y = radR; // مثبت: جلو به -X (داخل)
        const rightGeo = new THREE.BoxGeometry(panelThickness, H, rightLen);
        const rightMesh = new THREE.Mesh(rightGeo, bodyMat);
        rightMesh.name = 'bodyRight';
        rightMesh.position.set(0, 0, rightLen / 2);
        rightMesh.castShadow = true;
        rightMesh.receiveShadow = true;
        rightPivot.add(rightMesh);
        bodyGroup.add(rightPivot);

        // ---- Bottom ----
        if (includeBottom) {
            const bottomDepth = sidesFullDepth ? D : (D - shortTopDepth);
            let bottomMesh;
            if (Math.abs(_smBody.radL) > 0.001 || Math.abs(_smBody.radR) > 0.001) {
                const shape = new THREE.Shape();
                const halfD = bottomDepth / 2;
                const iL = _smBody.insetL * (bottomDepth / D);
                const iR = _smBody.insetR * (bottomDepth / D);
                // shapeY معکوس می‌شود با rotation.x=-PI/2
                const fl = -W / 2 + panelThickness + iL;
                const fr = W / 2 - panelThickness + iR;
                shape.moveTo(-W / 2 + panelThickness, halfD);
                shape.lineTo(W / 2 - panelThickness, halfD);
                shape.lineTo(fr, -halfD);
                shape.lineTo(fl, -halfD);
                shape.closePath();
                const bottomGeo = new THREE.ExtrudeGeometry(shape, { depth: panelThickness, bevelEnabled: false });
                bottomMesh = new THREE.Mesh(bottomGeo, bodyMat);
                bottomMesh.rotation.x = -Math.PI / 2;
                bottomMesh.position.set(0, -H / 2, sidesFullDepth ? 0 : 1.0);
            } else {
                const bottomGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, bottomDepth);
                bottomMesh = new THREE.Mesh(bottomGeo, bodyMat);
                bottomMesh.position.set(0, -H / 2 + panelThickness / 2, sidesFullDepth ? 0 : 1.0);
            }
            bottomMesh.name = 'bodyBottom';
            bottomMesh.castShadow = true;
            bottomMesh.receiveShadow = true;
            bodyGroup.add(bottomMesh);
        }

        // ---- Top ----
        if (includeTop) {
            const topDepth = D - shortTopDepth;
            const topGeo = new THREE.BoxGeometry(W - 2 * panelThickness, panelThickness, topDepth);
            const topMesh = new THREE.Mesh(topGeo, bodyMat);
            topMesh.name = 'bodyTop';
            // مماس با جلو؛ ۲ سانت عقب‌نشینی از پشت برای فیبر
            topMesh.position.set(0, H / 2 - panelThickness / 2, shortTopDepth / 2);
            topMesh.castShadow = true;
            topMesh.receiveShadow = true;
            bodyGroup.add(topMesh);
        }

        // ---- Back (فیبر ۳ میل) ----
        if (includeBack) {
            const backWidth = (W - 2 * panelThickness) + (2 * grooveDepth);
            const bottomGrooveY = includeBottom
                ? (-H / 2 + panelThickness - grooveDepth)
                : (-H / 2);
            const topEdgeY = includeTop ? (H / 2 - 0.2) : (H / 2);
            const backHeight = Math.max(1, topEdgeY - bottomGrooveY);

            const backGeo = new THREE.BoxGeometry(backWidth, backHeight, backPanelThickness);
            const backMesh = new THREE.Mesh(backGeo, backMat);
            backMesh.name = 'bodyBack';
            backMesh.position.set(
                0,
                bottomGrooveY + backHeight / 2,
                -D / 2 + backInset + backPanelThickness / 2
            );
            backMesh.castShadow = false;
            backMesh.receiveShadow = true;
            bodyGroup.add(backMesh);
        }

        group.add(bodyGroup);
        return bodyGroup;
    },


    // =====================================================================
    // 📦 سیستم کشوی واقعی (Realistic Drawer Assembly)
    // Front: Bevel + Gap + Edge
    // داخل (وقتی باز می‌شود): Side / Bottom / Back / Rail
    // =====================================================================
    /**
     * ساخت یک کشوی کامل
     * @returns {{ front: THREE.Object3D, body: THREE.Group, closedZ: number, openZ: number }}
     */
    createRealisticDrawer: function(opts) {
        // ابعاد دقیقاً مطابق فرمول قبلی کارگاه (بدون تغییر سایز)
        const frontW = opts.frontW;
        const frontH = opts.frontH;
        const thick = opts.thick || 1.6; // ضخامت استاندارد درب/جبهه ۱۶ میل
        const cabinetD = opts.cabinetD || 55;
        const cabinetW = opts.cabinetW || frontW;
        const innerDepth = opts.innerDepth || cabinetD * 0.85;
        const innerHeight = opts.innerHeight || frontH * 0.7;
        const material = opts.material;
        const bodyColor = opts.bodyColor || null;
        const bodyTexture = opts.bodyTexture || null;
        const bodyMaterialType = opts.bodyMaterialType || 'mdf';
        const bevel = opts.bevel !== undefined ? opts.bevel : 0.12;

        // ---- Front: Bevel + Edge (فقط ظاهر، نه تغییر اندازه) ----
        let drawerFront;
        if (typeof this.createPanelMesh === 'function') {
            drawerFront = this.createPanelMesh(frontW, frontH, thick, material, bevel);
        } else {
            drawerFront = new THREE.Mesh(new THREE.BoxGeometry(frontW, frontH, thick), material);
        }
        drawerFront.castShadow = true;
        drawerFront.receiveShadow = true;

        // ---- متریال بدنه ----
        let sideMat;
        if (bodyTexture) {
            const tex = new THREE.TextureLoader().load(bodyTexture);
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(0.05, 0.05);
            sideMat = new THREE.MeshStandardMaterial({
                map: tex,
                roughness: (bodyMaterialType === 'highGloss' || bodyMaterialType === 'highgloss') ? 0.1 : 0.7,
                metalness: 0.05
            });
        } else if (bodyColor) {
            sideMat = new THREE.MeshStandardMaterial({
                roughness: (bodyMaterialType === 'highGloss' || bodyMaterialType === 'highgloss') ? 0.1 : 0.7,
                metalness: 0.05
            });
            sideMat.color.set(bodyColor);
        } else if (typeof this.createInteriorMaterials === 'function') {
            sideMat = this.createInteriorMaterials().side;
        } else {
            sideMat = new THREE.MeshStandardMaterial({ color: 0xe8e6e3, roughness: 0.8 });
        }
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });

        // ---- ابعاد بدنه: همان فرمول قبلی ----
        // innerWidth = (c.w - 0.1) * 0.9  → از بیرون پاس داده می‌شود یا اینجا محاسبه
        const innerWidth = (opts.innerWidth !== undefined)
            ? opts.innerWidth
            : ((cabinetW - 0.1) * 0.9);
        const bThick = 1.6;
        const bottomThick = 0.3;

        const drawerBody = new THREE.Group();
        drawerBody.name = 'drawerBody';

        // Side Left / Right
        const sideGeo = new THREE.BoxGeometry(bThick, innerHeight, innerDepth);
        const leftSide = new THREE.Mesh(sideGeo, sideMat);
        leftSide.name = 'drawerSideLeft';
        leftSide.position.set(-innerWidth / 2 + bThick / 2, 0, 0);
        leftSide.castShadow = true;
        drawerBody.add(leftSide);

        const rightSide = new THREE.Mesh(sideGeo, sideMat);
        rightSide.name = 'drawerSideRight';
        rightSide.position.set(innerWidth / 2 - bThick / 2, 0, 0);
        rightSide.castShadow = true;
        drawerBody.add(rightSide);

        // Front inner + Back (فرمول قبلی)
        const fbWidth = innerWidth - (2 * bThick);
        const fbGeo = new THREE.BoxGeometry(fbWidth, innerHeight, bThick);
        const frontSide = new THREE.Mesh(fbGeo, sideMat);
        frontSide.position.set(0, 0, innerDepth / 2 - bThick / 2);
        drawerBody.add(frontSide);
        const backSide = new THREE.Mesh(fbGeo, sideMat);
        backSide.name = 'drawerBack';
        backSide.position.set(0, 0, -innerDepth / 2 + bThick / 2);
        backSide.castShadow = true;
        drawerBody.add(backSide);

        // Bottom — دقیقاً همان مختصات قبلی
        const bottomGeo = new THREE.BoxGeometry(fbWidth + 1.4, bottomThick, innerDepth - (2 * bThick) + 1.4);
        const bottom = new THREE.Mesh(bottomGeo, floorMat);
        bottom.name = 'drawerBottom';
        bottom.position.set(0, -innerHeight / 2 + 1.7 + (bottomThick / 2), 0);
        bottom.castShadow = true;
        bottom.receiveShadow = true;
        drawerBody.add(bottom);

        // ---- ریل تلسکوپی سه‌تکه (واقعی) ----
        // Outer  = قطعه ثابت روی دیواره کابینت (کانال بیرونی)
        // Middle = قطعه میانی متحرک
        // Inner  = قطعه متصل به بدنه کشو
        const createTelescopicRail = (side) => {
            // side: -1 چپ | +1 راست
            const railGroup = new THREE.Group();
            railGroup.name = side < 0 ? 'drawerRailLeft' : 'drawerRailRight';

            const matOuter = new THREE.MeshStandardMaterial({
                color: 0x6e6e6e, metalness: 0.95, roughness: 0.28
            });
            const matMiddle = new THREE.MeshStandardMaterial({
                color: 0x9a9a9a, metalness: 0.92, roughness: 0.22
            });
            const matInner = new THREE.MeshStandardMaterial({
                color: 0xc8c8c8, metalness: 0.98, roughness: 0.15
            });
            const matBall = new THREE.MeshStandardMaterial({
                color: 0xd0d0d0, metalness: 1.0, roughness: 0.12
            });

            const railLen = Math.max(8, innerDepth * 0.95);
            const railY = -innerHeight / 2 + 2.2; // نزدیک کف کشو (ساید‌مانت پایین)

            // ۱) Outer channel — پروفیل U شکل (کف + دو بال)
            const outerH = 1.35;
            const outerW = 1.15;
            const wallT = 0.12;
            const outerBase = new THREE.Mesh(
                new THREE.BoxGeometry(outerW, wallT, railLen),
                matOuter
            );
            outerBase.position.set(0, -outerH / 2 + wallT / 2, 0);
            railGroup.add(outerBase);
            const outerTopLip = new THREE.Mesh(
                new THREE.BoxGeometry(outerW, wallT, railLen),
                matOuter
            );
            outerTopLip.position.set(0, outerH / 2 - wallT / 2, 0);
            railGroup.add(outerTopLip);
            const outerBack = new THREE.Mesh(
                new THREE.BoxGeometry(wallT, outerH, railLen),
                matOuter
            );
            // دیواره کانال به سمت بیرون کابینت
            outerBack.position.set(side * (outerW / 2 - wallT / 2), 0, 0);
            railGroup.add(outerBack);

            // ۲) Middle slider — داخل کانال، کمی کوتاه‌تر
            const midH = 0.95;
            const midW = 0.78;
            const midLen = railLen * 0.88;
            const middle = new THREE.Mesh(
                new THREE.BoxGeometry(midW, midH, midLen),
                matMiddle
            );
            middle.position.set(-side * 0.08, 0, railLen * 0.04);
            railGroup.add(middle);

            // شیار نازک روی قطعه میانی
            const midGroove = new THREE.Mesh(
                new THREE.BoxGeometry(midW * 0.35, 0.06, midLen * 0.9),
                matInner
            );
            midGroove.position.set(-side * 0.08, midH * 0.15, railLen * 0.04);
            railGroup.add(midGroove);

            // ۳) Inner runner — متصل به بدنه کشو، براق‌تر و کوتاه‌تر
            const inH = 0.55;
            const inW = 0.48;
            const inLen = railLen * 0.72;
            const inner = new THREE.Mesh(
                new THREE.BoxGeometry(inW, inH, inLen),
                matInner
            );
            inner.position.set(-side * 0.18, 0.05, railLen * 0.08);
            railGroup.add(inner);

            // بلبرینگ‌های کوچک بین قطعات (حس تلسکوپی)
            const ballR = 0.12;
            const ballGeo = new THREE.SphereGeometry(ballR, 8, 6);
            const ballCount = 5;
            for (let b = 0; b < ballCount; b++) {
                const t = (b + 0.5) / ballCount;
                const bz = -railLen / 2 + t * railLen * 0.85 + railLen * 0.05;
                const ball = new THREE.Mesh(ballGeo, matBall);
                ball.position.set(-side * 0.12, -0.15, bz);
                railGroup.add(ball);
            }

            // ضربه گیر پلاستیکی انتهای ریل
            const bumper = new THREE.Mesh(
                new THREE.BoxGeometry(outerW * 0.7, outerH * 0.6, 0.35),
                new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7, metalness: 0.05 })
            );
            bumper.position.set(0, 0, -railLen / 2 + 0.2);
            railGroup.add(bumper);

            // موقعیت کلی ریل نسبت به بدنه کشو
            const xPos = side < 0
                ? (-innerWidth / 2 - outerW / 2 - 0.15)
                : (innerWidth / 2 + outerW / 2 + 0.15);
            railGroup.position.set(xPos, railY, 0);
            return railGroup;
        };

        drawerBody.add(createTelescopicRail(-1));
        drawerBody.add(createTelescopicRail(1));

        // اتصال بدنه به پشت جبهه — همان فرمول قبلی
        drawerBody.position.set(0, 0, -(innerDepth / 2 + thick / 2));
        drawerFront.add(drawerBody);

        const closedZ = cabinetD / 2 + thick / 2;
        const openZ = closedZ + (innerDepth * 0.8);

        return {
            front: drawerFront,
            body: drawerBody,
            closedZ: closedZ,
            openZ: openZ,
            innerDepth: innerDepth,
            innerHeight: innerHeight,
            innerWidth: innerWidth
        };
    },


    // =====================================================================
    // 🚪 سیستم حرفه‌ای مدل درب (Door Style System)
    // مدل‌ها: flat | beveled | shaker | frame | glass | fluted
    // Pivot / لولا / جهت باز شدن / Animation دست‌نخورده می‌مانند.
    // فقط Geometry عوض می‌شود.
    // =====================================================================
    /**
     * @param {string} style - flat|beveled|shaker|frame|glass|fluted
     * @param {number} w, h, thick
     * @param {*} material - متریال تک یا آرایه ۶وجهی
     * @param {object} opts - { isFrostedGlass, frameSize }
     * @returns {THREE.Object3D} Mesh یا Group
     */
    createDoorByStyle: function(style, w, h, thick, material, opts = {}) {
        const s = (style || 'flat').toString().toLowerCase().trim();
        const frameSize = opts.frameSize || 6.0;

        // استخراج متریال رویه و لبه از آرایه یا تک‌متریال
        let frontMat, edgeMat, backMat;
        if (Array.isArray(material) && material.length >= 6) {
            edgeMat = material[0];
            frontMat = material[4];
            backMat = material[5];
        } else if (Array.isArray(material) && material.length === 3) {
            edgeMat = material[0];
            backMat = material[1];
            frontMat = material[2];
        } else {
            frontMat = edgeMat = backMat = material;
        }
        const boxMats = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];
        const solidMat = frontMat || material;

        // ---- FLAT: صفحه ساده ----
        if (s === 'flat' || s === 'simple') {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, thick), boxMats);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.doorStyle = 'flat';
            return mesh;
        }

        // ---- BEVELED: گوشه‌های نرم رویه ----
        if (s === 'beveled' || s === 'bevel') {
            if (typeof this.createPanelMesh === 'function') {
                const mesh = this.createPanelMesh(w, h, thick, boxMats, 0.35);
                mesh.userData.doorStyle = 'beveled';
                return mesh;
            }
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, thick), boxMats);
            mesh.userData.doorStyle = 'beveled';
            return mesh;
        }

        // ---- SHAKER: قاب برجسته + پانل میانی فرورفته ----
        if (s === 'shaker') {
            const door = new THREE.Group();
            door.userData.doorStyle = 'shaker';
            const rail = Math.min(frameSize, w * 0.18, h * 0.18);
            const recess = 0.4; // عمق فرورفتگی پانل میانی

            // قاب بیرونی (ضخامت کامل)
            const outer = new THREE.Mesh(new THREE.BoxGeometry(w, h, thick), boxMats);
            outer.castShadow = true;
            door.add(outer);

            // پانل میانی: کمی عقب‌تر و نازک‌تر → حس Shaker
            const innerW = Math.max(1, w - rail * 2);
            const innerH = Math.max(1, h - rail * 2);
            const innerThick = Math.max(0.4, thick - recess);
            const innerMats = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];
            const inner = new THREE.Mesh(new THREE.BoxGeometry(innerW, innerH, innerThick), innerMats);
            inner.position.z = -recess / 2; // فرورفته به سمت داخل
            inner.castShadow = true;
            door.add(inner);

            // خط سایه داخلی (لبه قاب) برای تفکیک بصری
            const grooveMat = new THREE.MeshStandardMaterial({
                color: 0x222222,
                roughness: 0.9,
                metalness: 0,
                transparent: true,
                opacity: 0.25
            });
            const grooveDepth = 0.15;
            const gTop = new THREE.Mesh(new THREE.BoxGeometry(innerW + 0.2, grooveDepth, thick * 0.5), grooveMat);
            gTop.position.set(0, innerH / 2 + grooveDepth / 2, thick * 0.15);
            door.add(gTop);
            const gBot = gTop.clone();
            gBot.position.y = -innerH / 2 - grooveDepth / 2;
            door.add(gBot);
            const gLeft = new THREE.Mesh(new THREE.BoxGeometry(grooveDepth, innerH, thick * 0.5), grooveMat);
            gLeft.position.set(-innerW / 2 - grooveDepth / 2, 0, thick * 0.15);
            door.add(gLeft);
            const gRight = gLeft.clone();
            gRight.position.x = innerW / 2 + grooveDepth / 2;
            door.add(gRight);

            return door;
        }

        // ---- FRAME: قاب + پانل توپر میانی (بدون شیشه) ----
        if (s === 'frame') {
            const door = new THREE.Group();
            door.userData.doorStyle = 'frame';
            const fs = frameSize;

            const left = new THREE.Mesh(new THREE.BoxGeometry(fs, h, thick), boxMats);
            left.position.x = -w / 2 + fs / 2;
            door.add(left);
            const right = new THREE.Mesh(new THREE.BoxGeometry(fs, h, thick), boxMats);
            right.position.x = w / 2 - fs / 2;
            door.add(right);
            const top = new THREE.Mesh(new THREE.BoxGeometry(w - fs * 2, fs, thick), boxMats);
            top.position.y = h / 2 - fs / 2;
            door.add(top);
            const bot = new THREE.Mesh(new THREE.BoxGeometry(w - fs * 2, fs, thick), boxMats);
            bot.position.y = -h / 2 + fs / 2;
            door.add(bot);

            // پانل میانی کمی عقب‌تر
            const panelW = w - fs * 2 + 0.5;
            const panelH = h - fs * 2 + 0.5;
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(panelW, panelH, thick * 0.55),
                boxMats
            );
            panel.position.z = -thick * 0.15;
            door.add(panel);
            return door;
        }

        // ---- GLASS: قاب + شیشه (منطق قبلی) ----
        if (s === 'glass') {
            const door = new THREE.Group();
            door.userData.doorStyle = 'glass';
            const fs = frameSize;

            const left = new THREE.Mesh(new THREE.BoxGeometry(fs, h, thick), boxMats);
            left.position.x = -w / 2 + fs / 2;
            left.userData = { isFrameMesh: true, partType: 'bao_left' };
            door.add(left);
            const right = new THREE.Mesh(new THREE.BoxGeometry(fs, h, thick), boxMats);
            right.position.x = w / 2 - fs / 2;
            right.userData = { isFrameMesh: true, partType: 'bao_right' };
            door.add(right);
            const top = new THREE.Mesh(new THREE.BoxGeometry(w - fs * 2, fs, thick), boxMats);
            top.position.y = h / 2 - fs / 2;
            top.userData = { isFrameMesh: true, partType: 'pasar_top' };
            door.add(top);
            const bot = new THREE.Mesh(new THREE.BoxGeometry(w - fs * 2, fs, thick), boxMats);
            bot.position.y = -h / 2 + fs / 2;
            bot.userData = { isFrameMesh: true, partType: 'pasar_bottom' };
            door.add(bot);

            const glassMat = opts.isFrostedGlass
                ? new THREE.MeshPhysicalMaterial({
                    color: 0x1a1a1a, transmission: 0.3, opacity: 0.9, transparent: true,
                    roughness: 0.75, metalness: 0.05, clearcoat: 0.1
                })
                : new THREE.MeshPhysicalMaterial({
                    color: 0x88ccff, transmission: 0.9, opacity: 0.4, transparent: true,
                    roughness: 0.05, metalness: 0.1, clearcoat: 1.0
                });
            const glass = new THREE.Mesh(
                new THREE.BoxGeometry(w - fs * 2 + 1, h - fs * 2 + 1, 0.4),
                glassMat
            );
            door.add(glass);
            return door;
        }

        // ---- FLUTED: شیارهای عمودی روی رویه ----
        if (s === 'fluted' || s === 'flute') {
            const door = new THREE.Group();
            door.userData.doorStyle = 'fluted';

            // بدنه اصلی
            const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, thick * 0.7), boxMats);
            base.position.z = -thick * 0.15;
            base.castShadow = true;
            door.add(base);

            // تعداد شیار بر اساس عرض (حدود هر ۴–۵ سانت یک فلوت)
            const fluteW = 1.2;
            const fluteGap = 1.0;
            const step = fluteW + fluteGap;
            const usableW = w - 2.0;
            const count = Math.max(3, Math.floor(usableW / step));
            const totalFlutesW = count * fluteW + (count - 1) * fluteGap;
            const startX = -totalFlutesW / 2 + fluteW / 2;
            const fluteH = h - 1.2;
            const fluteDepth = thick * 0.45;

            for (let i = 0; i < count; i++) {
                const fx = startX + i * step;
                // نیم‌استوانه عمودی به‌عنوان فلوت برجسته
                const fluteGeo = new THREE.CylinderGeometry(fluteW / 2, fluteW / 2, fluteH, 8, 1, false, 0, Math.PI);
                fluteGeo.rotateY(Math.PI / 2);
                const flute = new THREE.Mesh(fluteGeo, solidMat);
                flute.position.set(fx, 0, thick * 0.2);
                flute.castShadow = true;
                door.add(flute);
            }
            return door;
        }

        // پیش‌فرض: flat
        const fallback = new THREE.Mesh(new THREE.BoxGeometry(w, h, thick), boxMats);
        fallback.userData.doorStyle = 'flat';
        return fallback;
    },


    // ⭐ ساخت «قطعه ثابت» (بدون بازشو) کنار درب‌های اصلی یونیت - بدون لولا و بدون انیمیشن باز/بسته شدن
    createFixedPanel: function(group, c, sharedDoorMaterial) {
        const fp = c.fixedPanel;
        if (!fp || fp.enabled !== true) return;

        // ضخامت یکسان با درب/کشو (۱۶ میل)
        const panelThick = 1.6;
        const SHADOW_GAP = 0.2; // ۲ میل فاصله سایه با درب مجاور
        const cabW = parseFloat(c.w) || 0;
        const cabH = parseFloat(c.h) || 0;
        const cabD = parseFloat(c.d) || 0;

        const w = (fp.w !== undefined && fp.w !== "" && !isNaN(parseFloat(fp.w))) ? parseFloat(fp.w) : 10;
        const h = (fp.h !== undefined && fp.h !== "" && !isNaN(parseFloat(fp.h))) ? parseFloat(fp.h) : cabH;

        // ---- متریال Front / Edge / Back (هم‌تراز با سیستم پنل درب) ----
        const colorVal = fp.color || "#ffffff";
        const isTexture = typeof colorVal === "string" && (
            colorVal.includes("http") || colorVal.includes("assets/") ||
            colorVal.includes("/") || colorVal.includes(".")
        );

        let frontMap = null;
        if (isTexture) {
            const loader = new THREE.TextureLoader();
            frontMap = loader.load(colorVal, (tex) => {
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.colorSpace = THREE.SRGBColorSpace;
            });
        }

        let faceMats;
        if (typeof this.createFaceMaterials === 'function') {
            faceMats = this.createFaceMaterials({
                frontColor: isTexture ? '#FFFFFF' : colorVal,
                frontMap: frontMap,
                edgeColor: isTexture ? '#E8E4DC' : colorVal, // نوار لبه — نه ادامه تخت تکسچر
                backColor: isTexture ? '#F5F5F5' : colorVal,
                roughnessFront: 0.35,
                roughnessEdge: 0.55
            });
        } else {
            const fallback = new THREE.MeshStandardMaterial({
                color: isTexture ? 0xffffff : (parseInt(String(colorVal).replace("#", "").substring(0, 6), 16) || 0xffffff),
                map: frontMap,
                roughness: 0.4,
                metalness: 0.05
            });
            faceMats = { boxArray: fallback, front: fallback, edge: fallback, back: fallback };
        }

        // سیستم پنل پایه: ضخامت + Bevel ظریف + Edge واقعی
        const matInput = faceMats.boxArray || faceMats.front;
        const panelMesh = (typeof this.createPanelMesh === 'function')
            ? this.createPanelMesh(w, h, panelThick, matInput, 0.12)
            : new THREE.Mesh(new THREE.BoxGeometry(w, h, panelThick), faceMats.front);
        panelMesh.castShadow = true;
        panelMesh.receiveShadow = true;
        panelMesh.name = 'fixedPanel';

        // تراز افقی + Shadow Gap به سمت داخل (کنار درب مجاور)
        // لبه بیرونی روی لبه یونیت می‌ماند؛ فاصله ۲ میل از سمت درب ایجاد می‌شود
        let x;
        if (fp.side === "right") {
            x = (cabW / 2 - w / 2) - SHADOW_GAP; // کمی به چپ (به سمت درب)
        } else {
            x = (-cabW / 2 + w / 2) + SHADOW_GAP; // کمی به راست (به سمت درب)
        }

        // قفل عمودی: بالا / وسط / پایین — مثل درب‌ها
        let y;
        if (fp.lockY === "top") y = (cabH / 2) - (h / 2);
        else if (fp.lockY === "bottom") y = -(cabH / 2) + (h / 2);
        else y = 0;

        // هم‌تراز با جلوی درب‌های اصلی (بدون لولا / بدون انیمیشن)
        const z = (cabD / 2) + (panelThick / 2);

        panelMesh.position.set(x, y, z);
        panelMesh.userData = { isFixedPanel: true, isDoor: false, isDrawer: false };

        group.add(panelMesh);
    },

    createDoorSystem: function(group, c, material) {
    if (c.showDoors === false) return;

    // 🟢 اگر قطعه ثابت (بدون بازشو) فعال باشد، کنار درب‌های اصلی این یونیت ساخته می‌شود
    if (typeof this.createFixedPanel === 'function') {
        this.createFixedPanel(group, c, material);
    }

    const thick = 1.6; // ضخامت استاندارد درب/کشو ۱۶ میل
    // 🌑 Shadow Gap استاندارد کارگاهی: ۲ میلی‌متر بین درب‌ها/کشوها
    // این فاصله با Position و اندازه واقعی اعمال می‌شود، نه خط روی تکسچر
    const SHADOW_GAP = 0.2;
    const gap = SHADOW_GAP; // سازگاری با بخش‌های قدیمی‌تر همین تابع

    // عرض/مرکز دهانه جلوی یونیت با توجه به زاویه دیوارها
    const sideMetrics = (typeof this.getSideAngleMetrics === 'function')
        ? this.getSideAngleMetrics(c)
        : { frontW: c.w, frontCenterX: 0, insetL: 0, insetR: 0, W: c.w };
    const angledFrontW = sideMetrics.frontW;
    const angledFrontCX = sideMetrics.frontCenterX;
    const angledSlotMinX = angledFrontCX - angledFrontW / 2;
    const angledSlotMaxX = angledFrontCX + angledFrontW / 2;

if (c.isDrawerBody) {
    const numDrawers = c.drawerCount || 3;
    const gap = c.drawerGap !== undefined ? c.drawerGap : SHADOW_GAP; 
    
    const hasCustomDrawers = c.drawersData && c.drawersData.length === numDrawers;
    const topThick = 1.6; 
    
    // 🟢 فرمول کارگاهی: کسر مجموع بادخورهای بین درب‌ها از کل ارتفاع کابینت
    const availableHeight = c.h - (gap * (numDrawers - 1)); 
    
    let totalInputHeight = 0;
    let requestedSlotHeights = []; 
    
    for (let i = 0; i < numDrawers; i++) {
        const dData = hasCustomDrawers ? c.drawersData[i] : null;
        const sData = (c.doorSizes && c.doorSizes[i]) ? c.doorSizes[i] : null; 
        
        let slotH = availableHeight / numDrawers;
        
        let customBodyH = null;
        if (dData && dData.height && !isNaN(parseFloat(dData.height))) {
            customBodyH = parseFloat(dData.height);
        } else if (sData && sData.bodyH && !isNaN(parseFloat(sData.bodyH))) {
            customBodyH = parseFloat(sData.bodyH); 
        }

        if (customBodyH !== null) {
            let defaultBodyH = (availableHeight / numDrawers) * 0.7 - 2;
            let growth = customBodyH - defaultBodyH;
            slotH += growth;
        }

        requestedSlotHeights.push(slotH);
        totalInputHeight += slotH;
    }
    
    const scaleFactor = totalInputHeight > 0 ? (availableHeight / totalInputHeight) : 1;
    let currentY = (c.h / 2); 

    // ساخت کشوها
    for (let i = 0; i < numDrawers; i++) {
        const dData = hasCustomDrawers ? c.drawersData[i] : null;
        const sData = (c.doorSizes && c.doorSizes[i]) ? c.doorSizes[i] : null;
        
        const currentSlotH = requestedSlotHeights[i] * scaleFactor; 
        
        const slotMaxY = currentY;
        const slotMinY = currentY - currentSlotH;
        currentY -= (currentSlotH + gap); 

        let frontH = currentSlotH;
        if (sData && sData.h && !isNaN(parseFloat(sData.h))) {
            frontH = parseFloat(sData.h);
        }

        // عرض جبهه — فرمول قبلی کارگاه
        let frontW = angledFrontW - 0.1;
        let shiftX = 0;
        let lockY = "center"; 

        if (sData) {
            if (sData.w && !isNaN(parseFloat(sData.w))) frontW = parseFloat(sData.w); 
            if (sData.lockY) lockY = sData.lockY;
            
            let sVal = parseFloat(sData.shiftValueX) || 0;
            if (sData.shiftDirX === "left") shiftX = -sVal;
            if (sData.shiftDirX === "right") shiftX = sVal;
        }

        let frontYPos = slotMaxY - (frontH / 2); 
        
        if (lockY === 'bottom') {
            frontYPos = slotMinY + (frontH / 2);
        } else if (lockY === 'top') {
            frontYPos = slotMaxY - (frontH / 2);
        } else if (lockY === 'center') {
            frontYPos = slotMaxY - (currentSlotH / 2);
        }

        // 🟢 متریال Front / Edge / Back
        let drawerColorHex = "#ffffff"; 
        let drawerTextureUrl = null;

        if (sData) {
            if (sData.doorTexture) drawerTextureUrl = sData.doorTexture;
            else if (sData.texture) drawerTextureUrl = sData.texture;
            else if (sData.doorColor) drawerColorHex = sData.doorColor;
        } else {
            if (c.doorTexture) drawerTextureUrl = c.doorTexture;
            else if (c.texture) drawerTextureUrl = c.texture;
            else if (c.doorColor) drawerColorHex = c.doorColor;
        }

        const isHighGloss = (c.doorMaterial === 'highgloss' || c.doorMaterial === 'highGloss');
        const expectedLabel = `یونیت کشو U${c.id} - کشو ${i + 1}`;
        let frontMap = null;

        if (window.isolatedDoorTextures && window.isolatedDoorTextures[expectedLabel]) {
            const imgEl = new Image();
            imgEl.src = window.isolatedDoorTextures[expectedLabel];
            const cachedTex = new THREE.Texture(imgEl);
            imgEl.onload = () => { cachedTex.needsUpdate = true; };
            cachedTex.wrapS = THREE.ClampToEdgeWrapping;
            cachedTex.wrapT = THREE.ClampToEdgeWrapping;
            cachedTex.repeat.set(1, 1);
            frontMap = cachedTex;
        } else if (drawerTextureUrl) {
            const textureLoader = new THREE.TextureLoader();
            const loadedTexture = textureLoader.load(drawerTextureUrl);
            loadedTexture.wrapS = THREE.RepeatWrapping;
            loadedTexture.wrapT = THREE.RepeatWrapping;
            const scaleX = frontW / 60;
            const scaleY = frontH / 60;
            loadedTexture.repeat.set(scaleX > 0 ? scaleX : 1, scaleY > 0 ? scaleY : 1);
            frontMap = loadedTexture;
        }

        const drawerFinish = (dData && (dData.finish || dData.doorFinish)) || c.doorFinish || (isHighGloss ? 'highGloss' : 'matte');
        const drawerFaces = Kitchen3D.createFaceMaterials({
            frontMap: frontMap,
            frontColor: drawerColorHex,
            edgeColor: (typeof drawerColorHex === 'string' && drawerColorHex.startsWith('#')) ? drawerColorHex : null,
            finishType: drawerFinish,
            materialType: drawerFinish
        });
        const drawerMatArray = drawerFaces.boxArray;

        // ابعاد بدنه — همان فرمول قبلی
        const innerDepth = (dData && dData.depth) ? parseFloat(dData.depth) : c.d * 0.85;
        let customBodyH = null;
        if (dData && dData.height && !isNaN(parseFloat(dData.height))) customBodyH = parseFloat(dData.height);
        else if (sData && sData.bodyH && !isNaN(parseFloat(sData.bodyH))) customBodyH = parseFloat(sData.bodyH);
        const innerHeight = customBodyH !== null ? customBodyH : (currentSlotH * 0.7);
        const innerWidth = (c.w - 0.1) * 0.9;

        // 📦 Front (Bevel/Edge) + Side/Bottom/Back/Rail با سایز قبلی
        const drawerAsm = Kitchen3D.createRealisticDrawer({
            frontW: frontW,
            frontH: frontH,
            thick: thick,
            cabinetD: c.d,
            cabinetW: c.w,
            innerDepth: innerDepth,
            innerHeight: innerHeight,
            innerWidth: innerWidth,
            material: drawerMatArray,
            bodyColor: dData ? dData.color : null,
            bodyTexture: dData ? dData.texture : null,
            bodyMaterialType: dData ? dData.material : null,
            bevel: 0.12
        });
        const drawerFront = drawerAsm.front;

        // تراز بدنه — فرمول قبلی
        // کشوی اول (بالایی): فقط بدنه ۱۸ میل پایین‌تر تا با قید/سقف ۱۶ میل برخورد نکند
        // جبهه (درب کشو) دست‌نخورده می‌ماند
        let bodyTargetY = slotMinY + (innerHeight / 2) + 2;
        if (i === 0) {
            bodyTargetY -= 1.8; // ۱۸ میل فقط برای بدنه کشوی اول
        }
        let bodyLocalY = bodyTargetY - frontYPos;
        if (drawerAsm.body) {
            drawerAsm.body.position.set(-shiftX, bodyLocalY, -(innerDepth / 2 + thick / 2));
        }

        // --- دستگیره روکار ---
        const hTarget = sData ? (sData.hiddenHandlePos || 'none') : 'none';
        const hColor = sData ? (sData.hiddenHandleColor || '#999') : '#999';

        if (hTarget === 'none' || (hTarget && hTarget.startsWith('normal-'))) {
            // دستگیره افقی واقعی روی کشو: پایه + بدنه + فاصله از درب
            const handle = (typeof this.createBarHandle === 'function')
                ? this.createBarHandle({
                    orientation: 'horizontal',
                    length: Math.min(18, Math.max(10, frontW * 0.35)),
                    standoff: 1.3,
                    metalness: 0.95,
                    roughness: 0.16,
                    color: 0xb0b0b0
                })
                : new THREE.Mesh(
                    new THREE.BoxGeometry(15, 1.5, 1.5),
                    new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 })
                );
            handle.position.set(0, 0, thick / 2);
            drawerFront.add(handle);
        }

        drawerFront.userData = { 
            isDrawer: true, isOpen: false, 
            closedZ: c.d / 2 + thick / 2, 
            openZ: (c.d / 2 + thick / 2) + (innerDepth * 0.8)
        };
        
        drawerFront.position.set(shiftX, frontYPos, drawerFront.userData.closedZ);
        group.add(drawerFront);

        const slotMinX = angledSlotMinX; const slotMaxX = angledSlotMaxX;
        const profileMaxY = slotMaxY; 
        createHiddenHandleProfile(slotMinX, slotMaxX, slotMinY, profileMaxY, hTarget, hColor, sData || {});
    }

    if (c.drawerTopPanel) {
        const topGeom = new THREE.BoxGeometry(c.w, topThick, c.d);
        const topWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const topMesh = new THREE.Mesh(topGeom, topWhiteMat);
        topMesh.position.set(0, (c.h / 2) + (topThick / 2), 0);
        group.add(topMesh);
    }
    return; 
}


    // ==========================================
    // پایان بخش کشوها
    // ==========================================


    const numDoors = c.doors || 1;
    const doorType = c.doorType || 'side';

const createMesh = (w, h, x, y, openDir, axis = 'y', hTarget = 'none', slotIndex = 0) => {
    let door;
    // 🌑 Shadow Gap از قبل در محاسبه عرض/ارتفاع اسلات و Position اعمال شده.
    // اینجا دیگر از ابعاد کم نمی‌کنیم تا فاصله دوبل نشود.
    // فقط یک micro-reveal خیلی کوچک (۰.۵ میل) برای جلوگیری از z-fighting با بدنه
    const MICRO_REVEAL = 0.05;
    const actualW = Math.max(0.1, w - MICRO_REVEAL);
    const actualH = Math.max(0.1, h - MICRO_REVEAL);

    // ==========================================================
    // 🛠️ بخش ۱: لود داده‌های پایه متریال از سیستم
    // ==========================================================
    // کاتالوگ رنگ = doorMaterial | پرداخت نوری = doorFinish (اگر نبود از جنس ورق)
    // کاتالوگ رنگ = doorMaterial (mdf / highGloss / leteron) — بدون تغییر
    // پرداخت نور = doorFinish (matte / semiMatte / satin / highGloss) — گزینه جدا
    const sizeMat = (c.doorSizes && c.doorSizes[slotIndex] && c.doorSizes[slotIndex].doorMaterial)
        ? c.doorSizes[slotIndex].doorMaterial : null;
    const currentMatType = sizeMat || c.doorMaterial || "mdf";
    const sizeFinish = (c.doorSizes && c.doorSizes[slotIndex] && c.doorSizes[slotIndex].doorFinish)
        ? c.doorSizes[slotIndex].doorFinish : null;
    const finishType = sizeFinish || c.doorFinish || "matte";
    const materialsList = (window.allMaterials && window.allMaterials[currentMatType]) ? window.allMaterials[currentMatType] : [];
    const sizeColor = (c.doorSizes && c.doorSizes[slotIndex])
        ? (c.doorSizes[slotIndex].doorTexture || c.doorSizes[slotIndex].doorColor) : null;
    const colorKey = sizeColor || c.doorColor;
    const activeMatInfo = materialsList.find(item => item.code === colorKey || item.texture === colorKey) || materialsList[0];
    
    let doorMaterial;

    if (activeMatInfo && activeMatInfo.texture) {
        const textureLoader = new THREE.TextureLoader();

        // تفکیک منطق لود رویه بر اساس نوع درب (شیشه‌خور یا معمولی)
        if (c.isGlassDoor) {
            // الف) درب شیشه‌خور
            const frontTex = textureLoader.load(activeMatInfo.texture);
            frontTex.colorSpace = THREE.SRGBColorSpace;

            const faces = Kitchen3D.createFaceMaterials({
                frontMap: frontTex,
                materialCode: activeMatInfo.code,
                edgeColor: activeMatInfo.edgeColor || activeMatInfo.code,
                finishType: finishType
            });
            doorMaterial = faces.boxArray;
        } else {
            // ب) درب‌های معمولی، کشوها و سایر مدل‌ها
            const expectedSnippetDoor = `U${c.id} - درب ${slotIndex + 1}`;
            const expectedSnippetDrawer = `U${c.id} - کشو ${slotIndex + 1}`;
            const expectedSnippetComboTop = `U${c.id} - کشو بالا`;
            const expectedSnippetComboBottom = `U${c.id} - درب پایین ${slotIndex}`;
            const expectedSnippetJakiGhadi = `U${c.id} - درب جکی`;
            const expectedSnippetJakiGhadi2 = `U${c.id} - درب قدی`;
            
            let finalTextureUrl = activeMatInfo.texture;
            let isIsolated = false;

            if (window.isolatedDoorTextures) {
                const matchedKey = Object.keys(window.isolatedDoorTextures).find(key => 
                    key.includes(expectedSnippetDoor) || 
                    key.includes(expectedSnippetDrawer) ||
                    key.includes(expectedSnippetComboTop) ||
                    key.includes(expectedSnippetComboBottom) ||
                    key.includes(expectedSnippetJakiGhadi) ||
                    key.includes(expectedSnippetJakiGhadi2)
                );
                if (matchedKey) {
                    finalTextureUrl = window.isolatedDoorTextures[matchedKey];
                    isIsolated = true;
                }
            }

            const frontTex = textureLoader.load(finalTextureUrl);
            frontTex.colorSpace = THREE.SRGBColorSpace;

            if (isIsolated) {
                frontTex.wrapS = THREE.ClampToEdgeWrapping;
                frontTex.wrapT = THREE.ClampToEdgeWrapping;
                frontTex.repeat.set(1, 1);
                frontTex.offset.set(0, 0);
                frontTex.rotation = 0;
            } else {
                // جهت تکسچر ثابت مثل یونیت معمولی — چرخش بر اساس عرض/ارتفاع
                // روی یونیت زاویه‌دار (عرض دهانه جلو متفاوت) باعث برعکس دیده شدن می‌شد
                frontTex.wrapS = THREE.RepeatWrapping;
                frontTex.wrapT = THREE.RepeatWrapping;
                frontTex.center.set(0.5, 0.5);
                frontTex.rotation = 0;
                frontTex.offset.set(0, 0);
                frontTex.repeat.set(
                    Math.max(0.05, actualW / 100),
                    Math.max(0.05, actualH / 100)
                );
            }

            // 🎨 Front / Edge / Back جدا — لبه دیگر ادامه تخت تکسچر نیست
            // پرداخت نور از جنس ورق (mdf / highGloss / leteron) — بدون hardcode
            const faces = Kitchen3D.createFaceMaterials({
                frontMap: frontTex,
                materialCode: activeMatInfo.code,
                edgeColor: activeMatInfo.edgeColor || (typeof activeMatInfo.code === 'string' && activeMatInfo.code.startsWith('#') ? activeMatInfo.code : null),
                frontColor: (typeof c.doorColor === 'string' && c.doorColor.startsWith('#')) ? c.doorColor : null,
                finishType: finishType,
                materialType: finishType
            });
            doorMaterial = faces.boxArray;
        }
    } else {
        // ج) حالت بدون تکسچر (رنگ ثابت) — باز هم Edge و Back جدا
        const fallbackColor = (activeMatInfo && activeMatInfo.code) ? activeMatInfo.code : (c.doorColor || "#8B4513");
        const faces = Kitchen3D.createFaceMaterials({
            frontColor: fallbackColor,
            edgeColor: (activeMatInfo && activeMatInfo.edgeColor) ? activeMatInfo.edgeColor : fallbackColor,
            materialCode: fallbackColor,
            finishType: finishType,
            materialType: finishType
        });
        doorMaterial = faces.boxArray;
    }

        // ==========================================================
    // 📐 بخش ۳: ساخت هندسه درب بر اساس مدل (Door Style System)
    // مدل‌ها: flat | beveled | shaker | frame | glass | fluted
    // Pivot / لولا / Animation بعد از این بخش بدون تغییر اعمال می‌شوند.
    // ==========================================================
    {
        // اولویت استایل: doorSizes[slot] → c.doorStyle → isGlassDoor → flat
        const sizeStyle = (c.doorSizes && c.doorSizes[slotIndex] && c.doorSizes[slotIndex].doorStyle)
            ? c.doorSizes[slotIndex].doorStyle
            : null;
        let doorStyle = sizeStyle || c.doorStyle || 'flat';
        if (c.isGlassDoor && (!sizeStyle && !c.doorStyle)) {
            doorStyle = 'glass';
        }
        if (c.isGlassDoor && (doorStyle === 'flat' || doorStyle === 'beveled')) {
            // اگر تیک شیشه فعال است ولی استایل صریح نیست → glass
            if (!sizeStyle && !c.doorStyle) doorStyle = 'glass';
        }

        if (typeof Kitchen3D.createDoorByStyle === 'function') {
            door = Kitchen3D.createDoorByStyle(doorStyle, actualW, actualH, thick, doorMaterial, {
                isFrostedGlass: !!c.isFrostedGlass,
                frameSize: 6.0
            });
        } else if (c.isGlassDoor) {
            // فالبک شیشه قدیمی
            door = new THREE.Group();
            const frameSize = 6.0;
            const leftBao = new THREE.Mesh(new THREE.BoxGeometry(frameSize, actualH, thick), doorMaterial);
            leftBao.position.set(-actualW / 2 + frameSize / 2, 0, 0);
            door.add(leftBao);
            const rightBao = new THREE.Mesh(new THREE.BoxGeometry(frameSize, actualH, thick), doorMaterial);
            rightBao.position.set(actualW / 2 - frameSize / 2, 0, 0);
            door.add(rightBao);
            const topPasar = new THREE.Mesh(new THREE.BoxGeometry(actualW - frameSize * 2, frameSize, thick), doorMaterial);
            topPasar.position.set(0, actualH / 2 - frameSize / 2, 0);
            door.add(topPasar);
            const bottomPasar = new THREE.Mesh(new THREE.BoxGeometry(actualW - frameSize * 2, frameSize, thick), doorMaterial);
            bottomPasar.position.set(0, -actualH / 2 + frameSize / 2, 0);
            door.add(bottomPasar);
            const glassMat = c.isFrostedGlass
                ? new THREE.MeshPhysicalMaterial({ color: 0x1a1a1a, transmission: 0.3, opacity: 0.9, transparent: true, roughness: 0.75 })
                : new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transmission: 0.9, opacity: 0.4, transparent: true, roughness: 0.05, clearcoat: 1.0 });
            door.add(new THREE.Mesh(new THREE.BoxGeometry(actualW - frameSize * 2 + 1, actualH - frameSize * 2 + 1, 0.4), glassMat));
        } else {
            door = new THREE.Mesh(new THREE.BoxGeometry(actualW, actualH, thick), doorMaterial);
        }
    }

    // ==========================================================
    // 🔩 بخش ۴: جابجایی‌ها، لولاها، دستگیره و سیستم ترورس کلیک
    // ==========================================================
    const hinge = new THREE.Object3D();
    hinge.position.set(x, y, c.d / 2 + thick/2);
    
    if (axis === 'y') {
        const hingeXShift = (openDir === -1) ? (thick / 2) : (-thick / 2);
        hinge.position.x += hingeXShift; 
        
        const xOffset = (openDir === -1) ? (w/2 - thick/2) : (-w/2 + thick/2);
        door.position.set(xOffset, 0, 0);
    } else {
        hinge.position.y -= thick / 2;
        door.position.set(0, -h/2 + thick/2, 0);
    }

    // یراق لولا — فلز مات ظریف (پایه / بازو / کاپ)
    const hMat = new THREE.MeshStandardMaterial({
        color: 0xb8b8b8,
        metalness: 0.92,
        roughness: 0.28
    });
    const cupMat = new THREE.MeshStandardMaterial({
        color: 0x9a9a9a,
        metalness: 0.88,
        roughness: 0.35
    });

    const staticHinge = new THREE.Object3D();
    staticHinge.position.copy(hinge.position);
    group.add(staticHinge);

    const baseGeo = new THREE.BoxGeometry(0.55, 4.2, 2.1);
    const armGeo = new THREE.BoxGeometry(2.6, 1.35, 0.35);
    const cupGeo = new THREE.CylinderGeometry(1.25, 1.15, 0.45, 20);
    cupGeo.rotateX(Math.PI / 2);

    const addHingeParts = (offsetPos) => {
        const base = new THREE.Mesh(baseGeo, hMat);
        const arm = new THREE.Mesh(armGeo, hMat);
        const cup = new THREE.Mesh(cupGeo, cupMat);
        base.castShadow = true;
        arm.castShadow = true;
        cup.castShadow = true;

        if (axis === 'y') {
            const baseX = (openDir === -1) ? (thick / 2 + 0.25) : (-thick / 2 - 0.25);
            base.position.set(baseX, offsetPos, -thick - 1.5);
            staticHinge.add(base);

            const hingeEdgeX = (openDir === -1) ? -w / 2 : w / 2;

            const cupX = hingeEdgeX + ((openDir === -1) ? 2.5 : -2.5);
            cup.position.set(cupX, offsetPos, -thick / 2);
            door.add(cup);

            const armX = hingeEdgeX + ((openDir === -1) ? 1.5 : -1.5);
            arm.position.set(armX, offsetPos, -thick - 0.5);
            door.add(arm);
        } else {
            base.rotation.z = Math.PI / 2;
            arm.rotation.z = Math.PI / 2;

            const baseY = (thick / 2 + 0.25);
            base.position.set(offsetPos, -baseY, -thick - 1.5);
            staticHinge.add(base);

            const hingeEdgeY = h / 2;

            const cupY = hingeEdgeY - 2.5;
            cup.position.set(offsetPos, cupY, -thick / 2);
            door.add(cup);

            const armY = hingeEdgeY - 1.5;
            arm.position.set(offsetPos, armY, -thick - 0.5);
            door.add(arm);
        }
    };

    if (axis === 'y') {
        addHingeParts(h / 2 - 10);  
        addHingeParts(-h / 2 + 10); 
    } else {
        addHingeParts(w / 2 - 10);  
        addHingeParts(-w / 2 + 10); 
    }

    if (hTarget === 'none' || (hTarget && hTarget.startsWith('normal-'))) {
        // دستگیره میله‌ای واقعی: پایه + بدنه + فاصله از سطح درب
        const isHorizontal = (axis !== 'y');
        const handleLen = isHorizontal
            ? Math.min(16, Math.max(10, w * 0.35))
            : Math.min(16, Math.max(10, h * 0.22));
        const handle = (typeof Kitchen3D.createBarHandle === 'function')
            ? Kitchen3D.createBarHandle({
                orientation: isHorizontal ? 'horizontal' : 'vertical',
                length: handleLen,
                standoff: 1.35,
                metalness: 0.96,
                roughness: 0.14,
                color: 0xc8c8c8
            })
            : new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 15, 1.5),
                new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.95, roughness: 0.15 })
            );

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
            handle.position.set(0, -h / 2 + 3, thick / 2);
        }

        door.add(handle);
    }

        const prevStyle = door.userData && door.userData.doorStyle;
        door.userData = { 
        isDoor: true, 
        isOpen: false, 
        openDirection: openDir, 
        axis: axis, 
        hinge: hinge,
        slotIndex: slotIndex,
        doorStyle: prevStyle || c.doorStyle || (c.isGlassDoor ? 'glass' : 'flat')
    };
    
    // 🛠️ فیکس اختصاصی: فقط مِش‌های فریم دیتای لولا و آپدیت بافت را می‌گیرند، نه شیشه میانی!
    door.traverse(function(child) {
        if (child.isMesh) {
            // اگر مِش مربوط به شیشه بود، از کپی شدن دیتای درب روی آن جلوگیری کن
            if (child.material instanceof THREE.MeshPhysicalMaterial && child.material.transmission > 0) {
                child.userData = { isGlassPane: true }; // شیشه مجزا بماند
            } else {
                child.userData = Object.assign({}, child.userData, door.userData);
            }
        }
    });

    hinge.add(door);
    group.add(hinge);
};


    function getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, isLeftHinge, axis, shiftDirX = 'none', shiftValueX = 0) {
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
            hx = cx;
            hy = cy + doorH / 2;
        }
        return { x: hx, y: hy };
    }

    // 💡 تغییر ۳: تابع کمکی برای رسم پروفیل دستگیره مخفی پشت درب (روی بدنه)
          
function createHiddenHandleProfile(slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size = {}) {
    // اگر دستگیره هیچ، بدون‌دستگیره، یا روکار (normal) بود، پروفیل مخفی ساخته نشود
    if (hTarget === 'none' || hTarget === 'no-handle' || (hTarget && hTarget.startsWith('normal-'))) return;

    const profileW = slotMaxX - slotMinX;

    // -----------------------------------------------------
    // 🟢 اصلاحیه اصلی: هم‌رنگ و هم‌جنس کردن با متریال درب‌ها
    // -----------------------------------------------------
    let profileMat;
    
    const isTexture = hColor && (
        hColor.toString().includes('http') || 
        hColor.toString().includes('assets/') || 
        hColor.toString().includes('/') || 
        hColor.toString().includes('.jpg') || 
        hColor.toString().includes('.png')
    );

    if (isTexture) {
        const textureLoader = new THREE.TextureLoader();
        const handleTex = textureLoader.load(hColor);
        
        handleTex.wrapS = THREE.RepeatWrapping;
        handleTex.wrapT = THREE.RepeatWrapping;
        handleTex.repeat.set(profileW / 50, 1); 

        // 🔥 نکته طلایی: اصلاح فضای رنگی تکسچر برای جلوگیری از تیره شدن تصویر
        if (typeof THREE.SRGBColorSpace !== 'undefined') {
            handleTex.colorSpace = THREE.SRGBColorSpace;
        } 

        profileMat = new THREE.MeshPhysicalMaterial({ 
            map: handleTex, 
            roughness: 0.4,   // مقداری شبیه به درب‌ها (کمی مات)
            metalness: 0.1,   // حذف انعکاس شدید فلزی که باعث سیاهی می‌شد
            clearcoat: 0.0    
        });
    } else {
        const validColor = hColor ? hColor : "#999999";
        profileMat = new THREE.MeshPhysicalMaterial({ 
            color: new THREE.Color(validColor), 
            roughness: 0.4,   // دقیقا مشابه حالت تکسچر چوب/رنگ متمایل به مات
            metalness: 0.1,   // جلوگیری از بازتاب آینه‌ای محیط تیره
            clearcoat: 0.0    
        });
    }

    // -----------------------------------------------------
    // تنظیمات ابعاد و موقعیت (بدون تغییر نسبت به کد خودت)
    // -----------------------------------------------------
    const isCustom = (hTarget === 'custom');
    const cType = isCustom ? (size.customHandleType || 'l-bottom') : null;

    const customH = Number(size.customHandleHeight) || 5;
    const customW = Number(size.customHandleWidth) || profileW;
    const customYOff = Number(size.customHandlePosY) || 0;
    const customFwd = Number(size.customHandleForward) || 0;
    const customBwd = Number(size.customHandleBackward) || 0;

    // -----------------------------------------------------
    // قطعه اول: بخش عمودی دستگیره
    // -----------------------------------------------------
    const vertH = (isCustom && size.customHandleHeight) ? customH : 5; 
    const vertD = 1.6; 
    const actualW = (isCustom && size.customHandleWidth) ? customW : profileW;

    const vertGeo = new THREE.BoxGeometry(actualW, vertH, vertD);
    const vertMesh = new THREE.Mesh(vertGeo, profileMat);
    
    const cx = (slotMinX + slotMaxX) / 2;
    let vertY = slotMinY; 
    
    if (isCustom) {
        vertY = slotMaxY - (vertH / 2);
        if (size.customHandleYDir === 'down') {
            vertY -= Math.abs(customYOff);
        } else if (size.customHandleYDir === 'up') {
            vertY += Math.abs(customYOff);
        }
    } else if (hTarget === 'top') {
        vertY = slotMaxY - vertH / 2;
    } else if (hTarget === 'bottom') {
        vertY = slotMinY + vertH / 2;
    }
    
    let zOffset = 0;
    if (isCustom) {
        zOffset = customFwd - customBwd;
    }
    
    vertMesh.position.set(cx, vertY, (c.d / 2) - 1.6 - (vertD / 2) + zOffset);
    group.add(vertMesh);

    // -----------------------------------------------------
    // قطعه دوم: بخش افقی (قطعه ۱۶ میل)
    // -----------------------------------------------------
    const horizH = 1.6; 
    const extraDepth = isCustom ? customBwd : 0;
    const horizD = 3.2 + extraDepth; 

    const horizGeo = new THREE.BoxGeometry(actualW, horizH, horizD);
    const horizMesh = new THREE.Mesh(horizGeo, profileMat);

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

    horizMesh.position.set(cx, horizY, (c.d / 2) - (horizD / 2) + zOffset);
    group.add(horizMesh);
}


if (c.isBaseWithDrawer) {
    // ضخامت (thick) و فاصله (gap) از ابتدای تابع خوانده می‌شود
    
    // گرفتن تنظیمات ابعاد درب از پنل ابعاد
    const sData0 = (c.doorSizes && c.doorSizes[0]) ? c.doorSizes[0] : null;
    
    // گرفتن دیتای اختصاصی بدنه کشو از پنل "مدیریت کشو"
    const dData0 = (c.drawersData && c.drawersData.length > 0) ? c.drawersData[0] : null;
    
    // ارتفاع پایه کشو
    let baseDrawerH = c.drawerFrontHeight ? parseFloat(c.drawerFrontHeight) : 18.0; 
    let physicalSlotH = baseDrawerH + 0.8; 
    
    // محاسبه ارتفاع بدنه کشو و میزان رشد آن
    const defaultInnerHeight = (baseDrawerH * 0.7) - 2;
    let customBodyH = null;
    if (dData0 && dData0.height && !isNaN(parseFloat(dData0.height))) {
        customBodyH = parseFloat(dData0.height);
    } else if (sData0 && sData0.bodyH && !isNaN(parseFloat(sData0.bodyH))) {
        customBodyH = parseFloat(sData0.bodyH); 
    }
    const innerHeight = customBodyH !== null ? customBodyH : defaultInnerHeight;
    const heightGrowth = innerHeight - defaultInnerHeight; 
    
    // فضای واقعی که کشو با توجه به رشد بدنه اشغال می‌کند
    let drawerActualSlotH = physicalSlotH + heightGrowth;
    
    // ارتفاع نهایی درب کشو
    let topDoorH = drawerActualSlotH; 
    if (sData0 && sData0.h && !isNaN(parseFloat(sData0.h))) {
        topDoorH = parseFloat(sData0.h); // اعمال سایز دستی درب
    }

    // نمای بیرونی درب کشو از همان لبه بالای کابینت شروع می‌شود 
    let currentY = c.h / 2;

    // 🟢 اصلاحیه جدید: عرض کشوی بالا بر اساس فرمول کارگاهی منهای ۱ میلی‌متر بادخور ثابت
    let frontW = angledFrontW - 0.1;
    let lockX = "center";
    let lockY = "top"; 
    let shiftDirX = "none";
    let shiftValueX = 0;

    if (sData0) {
        if (sData0.w && !isNaN(parseFloat(sData0.w))) frontW = parseFloat(sData0.w);
        if (sData0.lockX) lockX = sData0.lockX;
        if (sData0.lockY) lockY = sData0.lockY;
        if (sData0.shiftDirX) shiftDirX = sData0.shiftDirX;
        if (sData0.shiftValueX) shiftValueX = parseFloat(sData0.shiftValueX) || 0;
    }

    // محاسبه محدوده‌های قفل شدن فقط برای کشو
    let slotMaxX_drawer = angledSlotMaxX;
    let slotMinX_drawer = angledSlotMinX;
    let slotMaxY_drawer = currentY;
    let slotMinY_drawer = currentY - drawerActualSlotH; 

    // محاسبه X نهایی کشو
    let drawerXPos = 0;
    if (lockX === 'left') drawerXPos = slotMinX_drawer + (frontW / 2);
    else if (lockX === 'right') drawerXPos = slotMaxX_drawer - (frontW / 2);
    
    if (shiftDirX === 'left') drawerXPos -= shiftValueX;
    if (shiftDirX === 'right') drawerXPos += shiftValueX;

    // محاسبه Y نهایی کشو
    let drawerYPos = slotMaxY_drawer - (topDoorH / 2); 
    if (lockY === 'bottom') drawerYPos = slotMinY_drawer + (topDoorH / 2); 
    else if (lockY === 'center') drawerYPos = slotMaxY_drawer - (drawerActualSlotH / 2); 

       // ==========================================
    // ۱. ساخت کشوی بالا (اصلاح شده برای رفع ارور و فعال‌سازی انیمیشن)
    // ==========================================
        // ==========================================
    // ۱. ساخت کشوی بالا (اصلاح شده و هماهنگ با اکسپورتر)
    // ==========================================
    let drawerColorHex = "#ffffff"; 
    let drawerTextureUrl = null;

    if (sData0) {
        if (sData0.doorTexture) drawerTextureUrl = sData0.doorTexture;
        else if (sData0.texture) drawerTextureUrl = sData0.texture;
        else if (sData0.doorColor) drawerColorHex = sData0.doorColor;
    } else {
        if (c.doorTexture) drawerTextureUrl = c.doorTexture;
        else if (c.texture) drawerTextureUrl = c.texture;
        else if (c.doorColor) drawerColorHex = c.doorColor;
    }

    const isHighGloss = (c.doorMaterial === 'highgloss' || c.doorMaterial === 'highGloss');
    
    let drawerFrontMat = new THREE.MeshPhysicalMaterial({ 
        roughness: isHighGloss ? 0.05 : 0.4, 
        metalness: isHighGloss ? 0.1 : 0.02, 
        clearcoat: isHighGloss ? 0.8 : 0.1, 
        clearcoatRoughness: isHighGloss ? 0.02 : 0.1 
    }); 

    if (drawerTextureUrl) {
        drawerFrontMat.color.setHex(0xffffff);
    } else {
        drawerFrontMat.color.set(drawerColorHex);
    }

    // اسکن هوشمند تکسچر کات‌مستر برای کشو بالا
    const expectedSnippetComboTop = `U${c.id} - کشو بالا`;
    let hasIsolatedTextureTop = false;

    if (window.isolatedDoorTextures && window.isolatedDoorTextures[expectedSnippetComboTop]) {
        const imgEl = new Image();
        imgEl.src = window.isolatedDoorTextures[expectedSnippetComboTop];
        const cachedTex = new THREE.Texture(imgEl);
        imgEl.onload = () => { cachedTex.needsUpdate = true; };
        cachedTex.wrapS = THREE.ClampToEdgeWrapping;
        cachedTex.wrapT = THREE.ClampToEdgeWrapping;
        cachedTex.repeat.set(1, 1);
        drawerFrontMat.map = cachedTex;
        drawerFrontMat.color.setHex(0xffffff);
        hasIsolatedTextureTop = true;
    }

    if (!hasIsolatedTextureTop && drawerTextureUrl) {
        const textureLoader = new THREE.TextureLoader();
        const loadedTexture = textureLoader.load(drawerTextureUrl);
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        const scaleX = frontW / 60; 
        const scaleY = (topDoorH - gap) / 60;
        loadedTexture.repeat.set(scaleX > 0 ? scaleX : 1, scaleY > 0 ? scaleY : 1); 
        drawerFrontMat.map = loadedTexture;
    }
    drawerFrontMat.needsUpdate = true;

    // 📦 کشوی واقعی با createRealisticDrawer
    let innerDepthTop = c.d * 0.85;
    if (dData0 && dData0.depth && !isNaN(parseFloat(dData0.depth))) innerDepthTop = parseFloat(dData0.depth);

    // متریال جبهه با Edge
    const baseDrawerFinish = (dData0 && dData0.doorFinish) || c.doorFinish || 'matte';
    const baseDrawerFaces = (typeof Kitchen3D.createFaceMaterials === 'function')
        ? Kitchen3D.createFaceMaterials({
            frontMap: drawerFrontMat.map || null,
            frontColor: drawerColorHex,
            edgeColor: (typeof drawerColorHex === 'string' && drawerColorHex.startsWith('#')) ? drawerColorHex : null,
            finishType: baseDrawerFinish,
            materialType: baseDrawerFinish
        })
        : { boxArray: drawerFrontMat };

    const drawerAsmTop = Kitchen3D.createRealisticDrawer({
        frontW: frontW,
        frontH: Math.max(1, topDoorH - gap),
        thick: thick,
        cabinetD: c.d,
        cabinetW: c.w,
        innerDepth: innerDepthTop,
        innerHeight: innerHeight,
        innerWidth: frontW * 0.9, // فرمول قبلی
        material: baseDrawerFaces.boxArray || drawerFrontMat,
        bodyColor: dData0 ? dData0.color : null,
        bodyTexture: dData0 ? dData0.texture : null,
        bodyMaterialType: dData0 ? dData0.material : null,
        bevel: 0.12
    });
    const drawerFront = drawerAsmTop.front;
    drawerFront.name = "drawer";

    // تراز بدنه — فرمول قبلی
    // ۱۸ میل پایین از قید بالا + ۲ سانت بالا تا روی درب‌های پایین نیاید (جبهه ثابت)
    let fixedGapFromTop = physicalSlotH - defaultInnerHeight;
    let bodyTargetY = currentY - fixedGapFromTop - (innerHeight / 2);
    bodyTargetY -= 1.8; // فاصله از قید ۱۶ میل بالا
    bodyTargetY += 2.0; // ۲ سانت بالاتر تا با درب‌های پایین تداخل نداشته باشد
    if (drawerAsmTop.body) {
        drawerAsmTop.body.position.set(
            -drawerXPos,
            bodyTargetY - drawerYPos,
            -(innerDepthTop / 2 + thick / 2)
        );
    }

    drawerFront.userData = {
        isDrawer: true,
        isOpen: false,
        closedZ: c.d / 2 + thick / 2,
        openZ: (c.d / 2 + thick / 2) + (innerDepthTop * 0.8)
    };

    // -- دستگیره روکار کشو --
    const hTarget0 = sData0 ? (sData0.hiddenHandlePos || 'none') : 'none';
    const hColor0 = sData0 ? (sData0.hiddenHandleColor || '#999') : '#999';

    if (hTarget0 === 'none' || (hTarget0 && hTarget0.startsWith('normal-'))) {
        const handle = (typeof Kitchen3D.createBarHandle === 'function')
            ? Kitchen3D.createBarHandle({
                orientation: 'horizontal',
                length: Math.min(18, Math.max(10, frontW * 0.35)),
                standoff: 1.3,
                metalness: 0.95,
                roughness: 0.16,
                color: 0xb0b0b0
            })
            : new THREE.Mesh(
                new THREE.BoxGeometry(15, 1.5, 1.5),
                new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 })
            );
        handle.position.set(0, 0, thick / 2);
        drawerFront.add(handle);
    }

    drawerFront.position.set(drawerXPos, drawerYPos, drawerFront.userData.closedZ);
    group.add(drawerFront);

    const slotMinX_top = -c.w / 2; const slotMaxX_top = c.w / 2;
    const slotMaxY_top = currentY; const slotMinY_top = currentY - topDoorH; 
    createHiddenHandleProfile(slotMinX_top, slotMaxX_top, slotMinY_top, slotMaxY_top, hTarget0, hColor0, sData0 || {});


    // ==========================================
    // ۲. ساخت درهای پایینی
    // ==========================================
    let bottomDoorsStartY = currentY - drawerActualSlotH;

    const totalParts = c.doors || 2; 
    const bottomDoorsCount = totalParts > 1 ? totalParts - 1 : 1; 
    
    const directions = c.doorDirections || [];
    const customSizes = c.doorSizes || [];
    
    const slotMinY = -c.h / 2; 
    const slotMaxY = bottomDoorsStartY; 
    const slotH = slotMaxY - slotMinY; 
    
    // 🌑 Shadow Gap افقی بین درب‌های پایینی
    const gapBetweenBottom = SHADOW_GAP;
    const doorSlotWBottom = bottomDoorsCount > 0
        ? (angledFrontW - (bottomDoorsCount - 1) * gapBetweenBottom) / bottomDoorsCount
        : angledFrontW;
    
    for (let i = 1; i < totalParts; i++) {
        const size = customSizes[i] || {};
        if (size.enabled === false) continue; 

        const doorW = (size.w !== undefined && size.w !== "") ? parseFloat(size.w) : doorSlotWBottom;
        const doorH = (size.h !== undefined && size.h !== "") ? parseFloat(size.h) : (slotH - gap);
        
        const lockX = size.lockX || 'center';
        const lockY = size.lockY || 'center';
        const shiftDirX = size.shiftDirX || 'none';
        const shiftValueX = parseFloat(size.shiftValueX) || 0;
        const shiftDirY = size.shiftDirY || 'none';
        const shiftValueY = parseFloat(size.shiftValueY) || 0;

        const hTarget = size.hiddenHandlePos || 'none';
        const hColor = size.hiddenHandleColor || '#999';

        const physIndex = i - 1; 
        const dirStr = directions[i] || (physIndex % 2 === 0 ? 'left' : 'right');
        const isLeftHinge = (dirStr === 'left');
        const dir = isLeftHinge ? -1 : 1;

        const slotMinX = angledSlotMinX + physIndex * (doorSlotWBottom + gapBetweenBottom);
        const slotMaxX = slotMinX + doorSlotWBottom;

        createHiddenHandleProfile(slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size);

        const pos = getHingePos(
            slotMinX, slotMaxX, slotMinY, slotMaxY, 
            doorW, doorH, 
            lockX, lockY, 
            isLeftHinge, 'y', 
            shiftDirX, shiftValueX,
            shiftDirY, shiftValueY  
        );
        
        // 🟢 تغییر مهم: ارسال شاخص دقیق حلقه (i) به عنوان slotIndex جهت اتصال به کات‌مستر
        createMesh(doorW, doorH, pos.x, pos.y, dir, 'y', hTarget, i);
    }

    if (c.drawerTopPanel) {
        const topThick = 1.6; 
        const topGeom = new THREE.BoxGeometry(c.w, topThick, c.d);
        const topWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const topMesh = new THREE.Mesh(topGeom, topWhiteMat);
        topMesh.position.set(0, (c.h / 2) + (topThick / 2), 0);
        group.add(topMesh);
    }
    return; 
}





  if (doorType === 'lift') {
    const customSizes = c.doorSizes || [];
    const numDoors = c.doors || 1;

    const autoW = angledFrontW - 0.1;
    // 🌑 Shadow Gap عمودی بین درب‌های جکی
    const gapBetween = (numDoors > 1) ? SHADOW_GAP : 0;
    const doorSlotH = numDoors > 0
        ? (c.h - (numDoors - 1) * gapBetween - 0.2) / numDoors  // 0.2 بادخور تاج
        : c.h;
    const autoH = doorSlotH;

    for (let i = 0; i < numDoors; i++) {
        const size = customSizes[i] || {};
        if (size.enabled === false) continue; 

        const doorW = (size.w !== undefined && size.w !== "") ? parseFloat(size.w) : autoW;
        const doorH = (size.h !== undefined && size.h !== "") ? parseFloat(size.h) : autoH;

        const lockX = size.lockX || 'center';
        const lockY = size.lockY || 'center';
        const shiftDirX = size.shiftDirX || 'none';
        const shiftValueX = parseFloat(size.shiftValueX) || 0;
        
        const hTarget = size.hiddenHandlePos || 'none';
        const hColor = size.hiddenHandleColor || '#999';

        const slotMinX = angledSlotMinX;
        const slotMaxX = angledSlotMaxX;
        
        // از بالا با بادخور تاج ۰.۱ شروع می‌کنیم
        const topReveal = 0.1;
        const slotMaxY = c.h / 2 - topReveal - i * (doorSlotH + gapBetween);
        const slotMinY = slotMaxY - doorSlotH;

        if (typeof createHiddenHandleProfile === 'function') {
            createHiddenHandleProfile(slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size);
        }

        const pos = getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, true, 'x', shiftDirX, shiftValueX);
        createMesh(doorW, doorH, pos.x, pos.y, -1, 'x', hTarget, i);
    }
}


else if (doorType === 'lift-side') {
    const customSizes = c.doorSizes || [];
    // 🌑 Shadow Gap افقی بین دو لنگه
    const gapBetween = SHADOW_GAP;
    const doorSlotW = (angledFrontW - gapBetween) / 2;
    const autoW = doorSlotW;
    const autoH = c.h - 0.2;

    for(let i = 0; i < 2; i++) {
        const size = customSizes[i] || {};
        if (size.enabled === false) continue; 

        const doorW = (size.w !== undefined && size.w !== "") ? parseFloat(size.w) : autoW;
        const doorH = (size.h !== undefined && size.h !== "") ? parseFloat(size.h) : autoH;

        const lockX = size.lockX || 'center';
        const lockY = size.lockY || 'center';
        const shiftDirX = size.shiftDirX || 'none';
        const shiftValueX = parseFloat(size.shiftValueX) || 0;
        
        const hTarget = size.hiddenHandlePos || 'none';
        const hColor = size.hiddenHandleColor || '#999';

        const slotMinX = angledSlotMinX + i * (doorSlotW + gapBetween);
        const slotMaxX = slotMinX + doorSlotW;
        const slotMinY = -c.h / 2;
        const slotMaxY = c.h / 2;

        if (typeof createHiddenHandleProfile === 'function') {
            createHiddenHandleProfile(slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size);
        }

        const pos = getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, true, 'x', shiftDirX, shiftValueX);
        createMesh(doorW, doorH, pos.x, pos.y, -1, 'x', hTarget, i);
    }
}
else if (doorType === 'split') {
    const count = Math.min(Math.max(numDoors, 2), 3);
    const directions = c.doorDirections || []; 
    const customSizes = c.doorSizes || []; 

    const autoW = c.w - 0.1;
    // 🌑 Shadow Gap عمودی بین درب‌های روی هم
    const gapBetween = SHADOW_GAP;
    const doorSlotH = (c.h - (count - 1) * gapBetween) / count;
    const autoH = doorSlotH;

    for(let i=0; i<count; i++) {
        const size = customSizes[i] || {};
        if (size.enabled === false) continue; 

        const doorW = (size.w !== undefined && size.w !== "") ? parseFloat(size.w) : autoW;
        const doorH = (size.h !== undefined && size.h !== "") ? parseFloat(size.h) : autoH;
        
        const lockX = size.lockX || 'center';
        const lockY = size.lockY || 'center';
        const shiftDirX = size.shiftDirX || 'none';
        const shiftValueX = parseFloat(size.shiftValueX) || 0;
        
        const hTarget = size.hiddenHandlePos || 'none';
        const hColor = size.hiddenHandleColor || '#999';

        const dirStr = directions[i] || 'left'; 
        const isLeftHinge = (dirStr === 'left');
        const dir = isLeftHinge ? -1 : 1;
        
        const slotMinX = angledSlotMinX;
        const slotMaxX = angledSlotMaxX;
        const slotMaxY = c.h / 2 - i * (doorSlotH + gapBetween);
        const slotMinY = slotMaxY - doorSlotH;

        if (typeof createHiddenHandleProfile === 'function') {
            createHiddenHandleProfile(slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size);
        }

        const pos = getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, isLeftHinge, 'y', shiftDirX, shiftValueX);
        createMesh(doorW, doorH, pos.x, pos.y, dir, 'y', hTarget, i);
    }
}
else if (doorType === 'combo') {
    const directions = c.doorDirections || []; 
    const customSizes = c.doorSizes || [];

    const renderComboMesh = (i, slotMinX, slotMaxX, slotMinY, slotMaxY) => {
        const size = customSizes[i] || {};
        if (size.enabled === false) return; 

        const slotW = slotMaxX - slotMinX;
        const slotH = slotMaxY - slotMinY;

        let autoW = slotW;
        let autoH = slotH;

        if (numDoors === 3) {
            autoW = (angledFrontW - 0.1) / 2;
            if (i === 0) {
                autoH = c.h;
            } else {
                autoH = (c.h - 0.3) / 2;
            }
        } 
        // 🟢 اصلاحیه محاسباتی حالت ۴ درب بر اساس تذکر شما
        else if (numDoors === 4) {
            autoW = (angledFrontW - 0.1) / 2;   // کسر ۱ میل بادخور عرضی کل و تقسیم بر ۲
            autoH = (c.h - 0.3) / 2;   // کسر ۳ میل بادخور میانی بین درب‌های بالا و پایین و تقسیم بر ۲
        }

        const doorW = (size.w !== undefined && size.w !== "") ? parseFloat(size.w) : autoW;
        const doorH = (size.h !== undefined && size.h !== "") ? parseFloat(size.h) : autoH;

        const lockX = size.lockX || 'center';
        const lockY = size.lockY || 'center';
        const shiftDirX = size.shiftDirX || 'none';
        const shiftValueX = parseFloat(size.shiftValueX) || 0;
        
        const hTarget = size.hiddenHandlePos || 'none';
        const hColor = size.hiddenHandleColor || '#999';

        const dirStr = directions[i] || 'left';
        const isLeftHinge = (dirStr === 'left');
        const dir = isLeftHinge ? -1 : 1;

        if (typeof createHiddenHandleProfile === 'function') {
            createHiddenHandleProfile(slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size);
        }

        const pos = getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, isLeftHinge, 'y', shiftDirX, shiftValueX);
        createMesh(doorW, doorH, pos.x, pos.y, dir, 'y', hTarget, i);
    };

    if (numDoors === 3) {
        const layout = c.comboLayout || 'left-big';
        const defaultBigW = angledFrontW / 2;

        if (layout === 'left-big' || layout === 'left') {
            renderComboMesh(0, angledSlotMinX, angledSlotMinX + defaultBigW, -c.h/2, c.h/2); 
            renderComboMesh(1, angledSlotMinX + defaultBigW, angledSlotMaxX, 0, c.h/2);        
            renderComboMesh(2, angledSlotMinX + defaultBigW, angledSlotMaxX, -c.h/2, 0);       
        } else {
            renderComboMesh(1, angledSlotMinX, angledSlotMaxX - defaultBigW, 0, c.h/2);        
            renderComboMesh(2, angledSlotMinX, angledSlotMaxX - defaultBigW, -c.h/2, 0);       
            renderComboMesh(0, angledSlotMaxX - defaultBigW, angledSlotMaxX, -c.h/2, c.h/2);    
        }
    } else if (numDoors === 4) {
        renderComboMesh(0, -c.w/2, 0, 0, c.h/2);  
        renderComboMesh(1, 0, c.w/2, 0, c.h/2);   
        renderComboMesh(2, -c.w/2, 0, -c.h/2, 0); 
        renderComboMesh(3, 0, c.w/2, -c.h/2, 0);  
    }
}
else if (doorType === 'jaki-ghadi') {
    const directions = c.doorDirections || []; 
    const customSizes = c.doorSizes || [];
    const layout = c.jakiGhadiLayout || 'top'; 

    const count = Math.min(Math.max(numDoors, 2), 3);

    // اسلات‌بندی هندسی واقعی مطابق کدهای دو بعدی و قدیمی
    const geomJakiH = c.h * 0.4;
    const geomGhadiH = c.h - geomJakiH;

    const renderJGhadiMesh = (i, slotMinX, slotMaxX, slotMinY, slotMaxY, axis) => {
        const size = customSizes[i] || {};
        if (size.enabled === false) return; 

        const slotW = slotMaxX - slotMinX;
        const slotH = slotMaxY - slotMinY;

        // اولویت با ابعاد دستی دیتابیس است؛ در غیر این صورت از ابعاد دقیق اسلات منهای بادخور استفاده می‌شود
        const doorW = (size.w !== undefined && size.w !== "") ? parseFloat(size.w) : (slotW - 0.1);
        const doorH = (size.h !== undefined && size.h !== "") ? parseFloat(size.h) : (slotH - 0.4);

        const lockX = size.lockX || 'center';
        const lockY = size.lockY || 'center';
        const shiftDirX = size.shiftDirX || 'none';
        const shiftValueX = parseFloat(size.shiftValueX) || 0;
        
        const hTarget = size.hiddenHandlePos || 'none';
        const hColor = size.hiddenHandleColor || '#999';

        let isLeftHinge = true;
        let dir = -1;
        
        if (axis === 'y') { 
            const dirStr = directions[i] || (i === 0 ? 'left' : 'right');
            isLeftHinge = (dirStr === 'left');
            dir = isLeftHinge ? -1 : 1;
        } else { 
            isLeftHinge = true; 
            dir = -1;
        }

        if (typeof createHiddenHandleProfile === 'function') {
            createHiddenHandleProfile(slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size);
        }

        const pos = getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, isLeftHinge, axis, shiftDirX, shiftValueX);
        createMesh(doorW, doorH, pos.x, pos.y, dir, axis, hTarget, i);
    };

    // اسلات‌بندی هندسی چپ/راست و بالا/پایین دقیق برای حذف کامل جابجایی
    const halfW = c.w / 2;
    if (layout === 'bottom') {
        if (count === 2) {
            renderJGhadiMesh(0, -halfW, halfW, c.h/2 - geomGhadiH, c.h/2, 'y');
            renderJGhadiMesh(2, -halfW, halfW, -c.h/2, -c.h/2 + geomJakiH, 'x');
        } else {
            renderJGhadiMesh(0, -halfW, 0, c.h/2 - geomGhadiH, c.h/2, 'y');
            renderJGhadiMesh(1, 0, halfW, c.h/2 - geomGhadiH, c.h/2, 'y');
            renderJGhadiMesh(2, -halfW, halfW, -c.h/2, -c.h/2 + geomJakiH, 'x');
        }
    } else {
        if (count === 2) {
            renderJGhadiMesh(2, -halfW, halfW, c.h/2 - geomJakiH, c.h/2, 'x');
            renderJGhadiMesh(0, -halfW, halfW, -c.h/2, -c.h/2 + geomGhadiH, 'y');
        } else {
            renderJGhadiMesh(2, -halfW, halfW, c.h/2 - geomJakiH, c.h/2, 'x');
            renderJGhadiMesh(0, -halfW, 0, -c.h/2, -c.h/2 + geomGhadiH, 'y');
            renderJGhadiMesh(1, 0, halfW, -c.h/2, -c.h/2 + geomGhadiH, 'y');
        }
    }
}



  // ==========================================
// درب‌های معمولی کنار هم (Side) — Shadow Gap واقعی
// ==========================================
else {
    const directions = c.doorDirections || [];
    const customSizes = c.doorSizes || [];
    const numDoors = c.doors || 1;

    // 🌑 Shadow Gap: فاصله واقعی ۲ میلی‌متر بین هر دو درب مجاور
    // فرمول هم‌تراز با door-editor.js:
    //   doorSlotW = (cabW - (n-1) * gap) / n
    //   درب i از: i * (doorSlotW + gap)
    const gapBetween = SHADOW_GAP; // 0.2 cm = 2mm
    const doorSlotW = numDoors > 0
        ? (angledFrontW - (numDoors - 1) * gapBetween) / numDoors
        : angledFrontW;
    const standardDoorW = doorSlotW;

    // ارتفاع: کمی بادخور بالا/پایین برای تک‌درب (۱ میل از هر طرف)
    const standardDoorH = c.h - (numDoors === 1 ? 0.1 : 0.1);

    for (let i = 0; i < numDoors; i++) {
        const size = customSizes[i] || {};
        if (size.enabled === false) continue; 

        const doorW = (size.w !== undefined && size.w !== "") ? parseFloat(size.w) : standardDoorW;
        const doorH = (size.h !== undefined && size.h !== "") ? parseFloat(size.h) : standardDoorH;
        
        const lockX = size.lockX || 'center';
        const lockY = size.lockY || 'center';
        const shiftDirX = size.shiftDirX || 'none';
        const shiftValueX = parseFloat(size.shiftValueX) || 0;
        
        const hTarget = size.hiddenHandlePos || 'none';
        const hColor = size.hiddenHandleColor || '#999';

        const dirStr = directions[i] || (i % 2 === 0 ? 'left' : 'right');
        const isLeftHinge = (dirStr === 'left');
        const dir = isLeftHinge ? -1 : 1;

        // 🌑 اسلات واقعی با فاصله Shadow Gap بین درب‌ها (دهانه جلوی زاویه‌دار)
        const slotMinX = angledSlotMinX + i * (doorSlotW + gapBetween);
        const slotMaxX = slotMinX + doorSlotW;
        const slotMinY = -c.h / 2; 
        const slotMaxY = c.h / 2;  

        createHiddenHandleProfile(slotMinX, slotMaxX, slotMinY, slotMaxY, hTarget, hColor, size);

        const pos = getHingePos(slotMinX, slotMaxX, slotMinY, slotMaxY, doorW, doorH, lockX, lockY, isLeftHinge, 'y', shiftDirX, shiftValueX);
        
        createMesh(doorW, doorH, pos.x, pos.y, dir, 'y', hTarget, i);
    }
}

    // نور داخل کابینت (شیشه / ویترین یا وقتی درب باز است)
    if (typeof this.createInteriorCabinetLight === 'function') {
        this.createInteriorCabinetLight(group, c);
    }
},

        createFacadeSystem: function(group, c) {
        // بررسی می‌کنیم که آیا این کابینت تنظیمات نما دارد و فعال است یا خیر
        if (!c.facade || !c.facade.enabled) return;

        const textureLoader = new THREE.TextureLoader();
        const f = c.facade;

        const isLeft = f.isLeft;
        const isRight = f.isRight;
        let offset16 = 0;

        // ابعاد مبنا برای نما (در صورت عدم تنظیم، از ابعاد خود کابینت استفاده می‌شود)
        const customH = f.custom16Length || c.h;
        const customW = f.custom16Width || c.d;

        // ==========================================
        // 1. رسم ورق 16 میل
        // ==========================================
        if (f.is16mmEnabled) {
            const thick16 = 1.6;
            offset16 = thick16; // ذخیره ضخامت برای شیفت دادن لایه‌های بعدی به بیرون
            
            let mat16;
            if (f.color16Texture) {
                mat16 = new THREE.MeshStandardMaterial({ map: textureLoader.load(f.color16Texture) });
            } else {
                mat16 = new THREE.MeshStandardMaterial({ color: new THREE.Color(f.color16Code || 0x8b5a2b) });
            }
            
            const geo16 = new THREE.BoxGeometry(thick16, customH, customW);
            const zPos = (customW - c.d) / 2;

            if (isLeft) {
                const meshL = new THREE.Mesh(geo16, mat16);
                meshL.position.set(-c.w/2 - thick16/2, customH/2, zPos); 
                group.add(meshL);
            }
            if (isRight) {
                const meshR = new THREE.Mesh(geo16, mat16);
                meshR.position.set(c.w/2 + thick16/2, customH/2, zPos);
                group.add(meshR);
            }
        }

        // ==========================================
        // 2. رسم ترمووال
        // ==========================================
        if (f.isThermoEnabled) {
            const thermoCount = f.thermoCount || 1;
            const twWidth = f.thermoWidth || 4; 
            const twThick = f.thermoThickness || 2; 
            
            let twMat;
            if (f.colorThermoTexture) {
                twMat = new THREE.MeshStandardMaterial({ map: textureLoader.load(f.colorThermoTexture) });
            } else {
                twMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(f.colorThermoCode || 0x4a3728) });
            }

            const facadeDepth = f.is16mmEnabled ? customW : c.d;
            const startZ = -c.d/2 + (twWidth / 2);
            const endZ = -c.d/2 + facadeDepth - (twWidth / 2);

            for(let i = 0; i < thermoCount; i++) {
                const twGeo = new THREE.BoxGeometry(twThick, customH, twWidth);
                
                let zThermoPos = 0;
                if (thermoCount === 1) {
                    zThermoPos = -c.d/2 + (facadeDepth / 2);
                } else {
                    const step = (endZ - startZ) / (thermoCount - 1);
                    zThermoPos = startZ + (i * step);
                }

                if (isLeft) {
                    const twL = new THREE.Mesh(twGeo, twMat);
                    twL.position.set(-c.w/2 - offset16 - twThick/2, customH/2, zThermoPos);
                    group.add(twL);
                }
                if (isRight) {
                    const twR = new THREE.Mesh(twGeo, twMat);
                    twR.position.set(c.w/2 + offset16 + twThick/2, customH/2, zThermoPos);
                    group.add(twR);
                }
            }
        }

        // ==========================================
        // 3. رسم نما صفحه (Worktop)
        // ==========================================
        if (f.isWorktopEnabled) {
            const wtHeight = f.worktopHeight || 5;
            const wtThickness = f.worktopThickness || 3.2;

            let wtMat;
            if (f.colorWorktopTexture) {
                wtMat = new THREE.MeshStandardMaterial({ map: textureLoader.load(f.colorWorktopTexture) });
            } else {
                wtMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(f.colorWorktopCode || 0xdddddd) });
            }

            const facadeDepth = f.is16mmEnabled ? customW : c.d;
            const wtGeo = new THREE.BoxGeometry(wtThickness, wtHeight, facadeDepth);
            
            // اصلاح محاسبه ارتفاع به سمت پایین (مشابه پیش‌نمایش)
            const wtYPos = customH - (wtHeight / 2); 
            const zWtPos = (facadeDepth - c.d) / 2;

            if (isLeft) {
                const wtL = new THREE.Mesh(wtGeo, wtMat);
                wtL.position.set(-c.w/2 - offset16 - wtThickness/2, wtYPos, zWtPos);
                group.add(wtL);
            }
            if (isRight) {
                const wtR = new THREE.Mesh(wtGeo, wtMat);
                wtR.position.set(c.w/2 + offset16 + wtThickness/2, wtYPos, zWtPos);
                group.add(wtR);
            }
        }
    },


// =====================================================================
// 📚 سیستم طبقات واقعی (Real Shelf System)
// طبقه = قطعه MDF واقعی:
//   • ضخامت ۱۶ میل
//   • Edge (نوار لبه جدا از رویه)
//   • فاصله از دیواره (padding)
//   • پین/نگهدارنده در محل اتصال به دیواره
// از کنار مثل صفحه MDF واقعی دیده می‌شود.
// =====================================================================

/**
 * نور LED زیر کابینت دیواری / پله دوم
 * از زیر کف یونیت به پایین می‌تابد → صفحه کابینت و بین کابینتی
 */
createUnderCabinetLight: function(group, c) {
    if (!group || !c) return;
    if (c.type !== 'wall') return;
    if (c.isAppliance) return;

    // پیش‌فرض: خاموش (عملکرد)
    if (!c.underCabinetLight) {
        c.underCabinetLight = { enabled: false, intensity: 1.0, color: 0xfff2e0 }; // پیش‌فرض خاموش — سبک‌تر
    }
    if (c.underCabinetLight.enabled === false) return;

    const W = c.w || 90;
    const H = c.h || 70;
    const D = c.d || 35;
    const intensityScale = (c.underCabinetLight.intensity != null) ? parseFloat(c.underCabinetLight.intensity) : 1.0;
    const ledColor = (c.underCabinetLight.color != null) ? c.underCabinetLight.color : 0xfff2e0;

    // نوار LED زیر کف (نزدیک لبه جلو)
    const stripW = Math.max(10, W - 4);
    const stripH = 0.7;
    const stripD = 1.2;
    const stripY = -H / 2 - stripH / 2 - 0.15;
    const stripZ = D / 2 - 4; // کمی عقب از لبه جلو

    const ledMat = new THREE.MeshStandardMaterial({
        color: ledColor,
        emissive: ledColor,
        emissiveIntensity: 1.4,
        roughness: 0.4,
        metalness: 0.05,
        toneMapped: false
    });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(stripW, stripH, stripD), ledMat);
    strip.position.set(0, stripY, stripZ);
    strip.userData.isUnderCabinetLed = true;
    strip.userData.cabinetId = c.id;
    group.add(strip);

    // نور زیر کابینت: چند اسپات نرم روی صفحه + بین کابینتی
    const cfg = this.config || {};
    const baseSpot = (cfg.underCabinetBaseIntensity != null ? parseFloat(cfg.underCabinetBaseIntensity) : 850) * intensityScale;
    const fillI = (cfg.underCabinetFillIntensity != null ? parseFloat(cfg.underCabinetFillIntensity) : 140) * intensityScale;
    const dist = Math.max(85, (c.elevation || 145) * 0.5 + 35);
    const count = Math.max(1, Math.min(4, Math.round(W / 35)));
    const span = stripW * 0.78;
    const startX = count === 1 ? 0 : -span / 2;

    for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const lx = count === 1 ? 0 : (startX + span * t);
        const light = new THREE.SpotLight(ledColor, baseSpot / Math.sqrt(count));
        light.position.set(lx, stripY - 0.4, stripZ - 1);
        light.angle = Math.PI / 2.8;
        light.penumbra = 0.9;
        light.distance = dist;
        light.decay = 2;
        light.castShadow = false;
        const target = new THREE.Object3D();
        target.position.set(lx, stripY - 55, stripZ + 10);
        group.add(target);
        light.target = target;
        light.userData.isUnderCabinetLight = true;
        light.userData.cabinetId = c.id;
        light.userData.baseIntensity = baseSpot / Math.sqrt(count);
        light.userData.savedIntensity = light.userData.baseIntensity;
        light.userData.savedColor = ledColor;
        light.userData.savedState = true;
        group.add(light);
    }

    const fill = new THREE.PointLight(ledColor, fillI, 65, 2);
    fill.position.set(0, stripY - 10, stripZ - 4);
    fill.userData.isUnderCabinetLight = true;
    fill.userData.cabinetId = c.id;
    group.add(fill);
},


/**
 * نور داخل کابینت
 * فقط وقتی درب شیشه‌ای/ویترین است یا حداقل یک درب باز است.
 * عمق داخلی و طبقات را واضح‌تر نشان می‌دهد.
 */
createInteriorCabinetLight: function(group, c) {
    if (!group || !c) return;
    if (c.isAppliance) return;
    if (c.showDoors === false && !c.isGlassDoor) return;

    // کنترل از پنل ویرایش کابینت
    if (!c.interiorLight) {
        c.interiorLight = { enabled: false, intensity: 1.0, color: 0xfff5e8 }; // پیش‌فرض خاموش — سبک‌تر
    }
    if (c.interiorLight.enabled === false) {
        group.userData.interiorLightDisabled = true;
        group.userData.hasGlassDoor = false;
        return;
    }
    group.userData.interiorLightDisabled = false;

    const isGlass = !!(c.isGlassDoor || c.doorStyle === 'glass' ||
        (c.doorSizes && c.doorSizes.some(s => s && (s.doorStyle === 'glass' || s.isGlassDoor))));

    const W = c.w || 60;
    const H = c.h || 70;
    const D = c.d || 35;
    const intensityScale = (c.interiorLight.intensity != null) ? parseFloat(c.interiorLight.intensity) : 1.0;
    const color = (c.interiorLight.color != null) ? c.interiorLight.color : 0xfff5e8;

    // نوار LED کوچک نزدیک سقف داخل یونیت
    const stripW = Math.max(8, W - 6);
    const stripY = H / 2 - 2.2;
    const stripZ = -D / 2 + 6;
    const ledMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: isGlass ? 1.1 : 0.0,
        roughness: 0.45,
        metalness: 0.05,
        toneMapped: false
    });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(stripW, 0.5, 0.8), ledMat);
    strip.position.set(0, stripY, stripZ);
    strip.userData.isInteriorCabinetLed = true;
    strip.userData.cabinetId = c.id;
    group.add(strip);

    // PointLight نرم داخل بدنه (شیشه یا درب باز)
    const cfgI = (this && this.config) ? this.config : {};
    const baseIntensity = (cfgI.interiorBaseIntensity != null ? parseFloat(cfgI.interiorBaseIntensity) : 180) * intensityScale;
    const light = new THREE.PointLight(color, isGlass ? baseIntensity : 0, Math.max(48, Math.min(H, D) * 1.7), 2);
    light.position.set(0, stripY - 2, 0);
    light.castShadow = false;
    light.userData.isInteriorCabinetLight = true;
    light.userData.cabinetId = c.id;
    light.userData.baseIntensity = baseIntensity;
    light.userData.savedIntensity = baseIntensity;
    light.userData.savedColor = color;
    light.userData.savedState = isGlass; // شیشه: روشن؛ در غیر این صورت با باز شدن درب
    light.userData.isGlassDefault = isGlass;
    group.add(light);

    // ذخیره روی گروه برای روشن شدن هنگام باز شدن درب
    group.userData.interiorCabinetLight = light;
    group.userData.interiorCabinetLed = strip;
    group.userData.hasGlassDoor = isGlass;
    group.userData.cabinetData = group.userData.cabinetData || c;
},

/** شدت نور داخل را بر اساس شیشه یا باز بودن درب/کشو تنظیم می‌کند */
syncInteriorCabinetLight: function(fromObj) {
    if (!fromObj) return;
    // پیدا کردن ریشه کابینت
    let root = fromObj;
    while (root.parent && !(root.userData && root.userData.isCabinet)) {
        root = root.parent;
    }
    if (!root || !root.userData) return;
    const light = root.userData.interiorCabinetLight;
    const led = root.userData.interiorCabinetLed;
    if (!light) return;

    let anyOpen = false;
    root.traverse(o => {
        if (o.userData && (o.userData.isDoor || o.userData.isDrawer) && o.userData.isOpen) {
            anyOpen = true;
        }
    });

    // اگر از پنل غیرفعال شده باشد، همیشه خاموش
    if (root.userData.interiorLightDisabled) {
        light.intensity = 0;
        if (led && led.material) {
            led.material.emissiveIntensity = 0.0;
            led.material.needsUpdate = true;
        }
        return;
    }
    const cab = root.userData.cabinetData;
    if (cab && cab.interiorLight && cab.interiorLight.enabled === false) {
        light.intensity = 0;
        if (led && led.material) {
            led.material.emissiveIntensity = 0.0;
            led.material.needsUpdate = true;
        }
        return;
    }

    const on = !!(root.userData.hasGlassDoor || anyOpen);
    const base = (light.userData && light.userData.baseIntensity != null) ? light.userData.baseIntensity : 220;
    light.intensity = on ? base : 0;
    if (led && led.material) {
        led.material.emissiveIntensity = on ? 1.1 : 0.0;
        led.material.needsUpdate = true;
    }
},

createShelves: function(group, c) {
    if (!c.shelves || c.shelves.length === 0) return;

    const thickness = 1.6;           // ضخامت ورق طبقه (۱۶ میل)
    const padding = 1.8;             // فاصله استاندارد از دیواره‌های داخلی
    const pinRadius = 0.25;          // شعاع پین نگهدارنده (~۵ میل)
    const pinLength = 0.8;           // طول بیرون‌زده پین داخل سوراخ دیواره
    const currentId = c.id || c.uId || "";

    // متریال پین فلزی/پلاستیکی استاندارد
    const pinMat = new THREE.MeshStandardMaterial({
        color: 0xb0b0b0,
        metalness: 0.7,
        roughness: 0.35
    });

    c.shelves.forEach((shelf, index) => {
        if (!shelf || shelf.height === undefined) return;

        const rotationDeg = Number(shelf.rotation) || 0;
        const isVertical = rotationDeg === 90;

        const labelBase = isVertical ? `طبقه عمودی ${index + 1}` : `طبقه افقی ${index + 1}`;
        const labelGlassHolder = !isVertical && shelf.isGlassHolder ? ` (جای لیوانی - برش لبه)` : ``;
        const calculatedLabel = `${labelBase}${labelGlassHolder} U${currentId}`;

        // --- لود تکسچر/رنگ طبقه (بدون ساخت نهایی متریال) ---
        // متریال نهایی پایین‌تر با createFaceMaterials + finish ساخته می‌شود
        // تا تکسچر از دست نرود و رویه درست روی +y/-y بنشیند.
        const resolveShelfSurface = (pieceLabel, geoWidth, geoDepth, isExtrudeGeo) => {
            let frontMap = null;
            let frontColor = null;
            let hasCutMaster = false;

            if (window.isolatedDoorTextures && window.isolatedDoorTextures[pieceLabel]) {
                const base64Data = window.isolatedDoorTextures[pieceLabel];
                const tex = new THREE.TextureLoader().load(base64Data);
                tex.colorSpace = THREE.SRGBColorSpace;
                if (isExtrudeGeo) {
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    tex.repeat.set(1 / Math.max(geoWidth, 0.01), 1 / Math.max(geoDepth, 0.01));
                } else {
                    tex.wrapS = THREE.ClampToEdgeWrapping;
                    tex.wrapT = THREE.ClampToEdgeWrapping;
                    tex.repeat.set(1, 1);
                }
                tex.needsUpdate = true;
                frontMap = tex;
                hasCutMaster = true;
            } else {
                let rawColor = shelf.color || c.shelvesColor || c.bodyColor || "#E8E6E3";
                if (typeof rawColor === 'string' &&
                    (rawColor.startsWith('http') || rawColor.includes('assets/') || rawColor.includes('/') ||
                     rawColor.includes('.jpg') || rawColor.includes('.png') || rawColor.includes('data:image'))) {
                    const tex = new THREE.TextureLoader().load(rawColor);
                    tex.wrapS = THREE.RepeatWrapping;
                    tex.wrapT = THREE.RepeatWrapping;
                    tex.colorSpace = THREE.SRGBColorSpace;
                    if (isExtrudeGeo) {
                        tex.repeat.set(1 / 50, 1 / 50);
                    } else {
                        tex.repeat.set(Math.max(geoWidth / 100, 0.01), Math.max(geoDepth / 100, 0.01));
                    }
                    tex.needsUpdate = true;
                    frontMap = tex;
                } else {
                    frontColor = rawColor;
                }
            }
            return { frontMap, frontColor, hasCutMaster };
        };

        let sWidth = (shelf.width !== undefined && shelf.width !== c.w) ? shelf.width : (c.w - (padding * 2));
        let sVertHeight = (shelf.vertHeight !== undefined && shelf.vertHeight !== c.h) ? shelf.vertHeight : (c.h - (padding * 2));
        let sDepth = (shelf.depth !== undefined && shelf.depth !== c.d) ? shelf.depth : (c.d - padding - 1);

        const sLeftOffset = shelf.leftOffset || 0;
        const sBottomOffset = shelf.bottomOffset || 0;
        const depthAlign = shelf.depthAlign || "back";

        let posX = 0, posY = 0, posZ = 0;
        let shelfWidth = 0, shelfHeight = 0, shelfDepth = sDepth;

        const extraBack = shelf.closetBackOffset || 0;

        if (depthAlign === "front") {
            posZ = (c.d / 2) - (shelfDepth / 2) - extraBack;
        } else {
            posZ = (-c.d / 2) + padding + (shelfDepth / 2) - extraBack;
        }

        const isRightAnchor = shelf.sideAnchor === "right";

        if (isVertical) {
            shelfWidth = thickness;
            shelfHeight = Math.min(sVertHeight, c.h - (padding * 2));
            if (isRightAnchor) {
                const rightInnerEdge = (c.w / 2) - padding;
                posX = rightInnerEdge - shelf.height - sLeftOffset - (shelfWidth / 2);
            } else {
                const leftInnerEdge = (-c.w / 2) + padding;
                posX = leftInnerEdge + shelf.height + sLeftOffset + (shelfWidth / 2);
            }
            const bottomInnerEdge = (-c.h / 2) + padding;
            posY = bottomInnerEdge + sBottomOffset + (shelfHeight / 2);
        } else {
            shelfHeight = thickness;
            shelfWidth = Math.min(sWidth, c.w - (padding * 2));
            posY = (-c.h / 2) + padding + shelf.height;
            if (isRightAnchor) {
                const rightInnerEdge = (c.w / 2) - padding;
                posX = rightInnerEdge - sLeftOffset - (shelfWidth / 2);
            } else {
                const leftInnerEdge = (-c.w / 2) + padding;
                posX = leftInnerEdge + sLeftOffset + (shelfWidth / 2);
            }
        }

        let shelfGeo;
        const isGlassHolderMode = (shelf.isGlassHolder && !isVertical);

        if (isGlassHolderMode) {
            // جای لیوانی: Extrude با شیارهای لبه
            const shape = new THREE.Shape();
            const slotWidth = 3;
            const slotDepth = 7;
            const spacing = 15;

            shape.moveTo(0, 0);
            shape.lineTo(shelfWidth, 0);
            shape.lineTo(shelfWidth, shelfDepth);

            const minPadding = 6;
            const availableWidth = shelfWidth - (2 * minPadding);
            let numSlots = 0;
            if (availableWidth >= 0) {
                numSlots = Math.floor(availableWidth / spacing) + 1;
            }

            if (numSlots > 0) {
                const totalSlotsWidth = (numSlots - 1) * spacing;
                const sideMargin = (shelfWidth - totalSlotsWidth) / 2;
                const startX = shelfWidth - sideMargin;
                for (let i = 0; i < numSlots; i++) {
                    let cx = startX - (i * spacing);
                    shape.lineTo(cx + slotWidth / 2, shelfDepth);
                    shape.lineTo(cx + slotWidth / 2, shelfDepth - slotDepth);
                    shape.absarc(cx, shelfDepth - slotDepth, slotWidth / 2, 0, Math.PI, true);
                    shape.lineTo(cx - slotWidth / 2, shelfDepth);
                }
            }

            shape.lineTo(0, shelfDepth);
            shape.lineTo(0, 0);

            const extrudeSettings = { depth: thickness, bevelEnabled: false };
            shelfGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            shelfGeo.computeBoundingBox();
            const bbox = shelfGeo.boundingBox;
            shelfGeo.translate(
                -(bbox.max.x + bbox.min.x) / 2,
                -(bbox.max.y + bbox.min.y) / 2,
                -(bbox.max.z + bbox.min.z) / 2
            );
            shelfGeo.rotateX(Math.PI / 2);
        } else {
            shelfGeo = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth);
        }

        const surface = resolveShelfSurface(calculatedLabel, shelfWidth, shelfDepth, isGlassHolderMode);
        const shelfFinishKey = shelf.finish || c.shelvesFinish || 'matte';

        // 🎨 متریال واقعی: رویه / لبه / زیر + پرداخت نور
        // Box order: [+x, -x, +y(top), -y(bottom), +z, -z]
        let appliedMaterial;
        if (typeof this.createFaceMaterials === 'function') {
            const faces = this.createFaceMaterials({
                frontMap: surface.frontMap,
                frontColor: surface.frontColor || '#E8E6E3',
                edgeColor: (surface.frontColor && String(surface.frontColor).startsWith('#')) ? surface.frontColor : null,
                fallbackEdgeColor: '#D0C8BC',
                finishType: shelfFinishKey,
                materialType: shelfFinishKey
            });
            if (isGlassHolderMode) {
                // Extrude: یک متریال رویه کافی است
                appliedMaterial = faces.front;
            } else if (isVertical) {
                appliedMaterial = [
                    faces.edge, faces.edge,           // +x -x (ضخامت)
                    faces.front, faces.front,         // +y -y
                    faces.front, faces.front          // +z -z
                ];
            } else {
                // افقی: رویه/زیر = front (تکسچر)، لبه‌ها = edge
                appliedMaterial = [
                    faces.edge, faces.edge,           // +x -x لبه چپ/راست
                    faces.front, faces.front,         // +y -y رویه و زیر
                    faces.edge, faces.edge            // +z -z لبه جلو/عقب
                ];
            }
        } else {
            // fallback ساده
            const preset = (typeof window.getKitchenFinishPreset === 'function')
                ? window.getKitchenFinishPreset(shelfFinishKey)
                : { roughness: 0.7, metalness: 0.02 };
            const mat = new THREE.MeshStandardMaterial({
                map: surface.frontMap || null,
                color: surface.frontMap ? 0xffffff : (surface.frontColor || '#E8E6E3'),
                roughness: preset.roughness,
                metalness: preset.metalness
            });
            appliedMaterial = isGlassHolderMode ? mat : [mat, mat, mat, mat, mat, mat];
        }

        const shelfMesh = new THREE.Mesh(shelfGeo, appliedMaterial);
        shelfMesh.position.set(posX, posY, posZ);
        shelfMesh.castShadow = true;
        shelfMesh.receiveShadow = true;
        shelfMesh.userData = {
            partType: 'shelf',
            shelfIndex: index,
            isVertical: isVertical,
            pieceLabel: calculatedLabel,
            shelfFinish: shelf.finish || c.shelvesFinish || 'matte'
        };
        group.add(shelfMesh);

        // ---- پین / نگهدارنده طبقه (فقط برای طبقات افقی کابینت آشپزخانه) ----
        // پین‌ها مخصوص یونیت‌های آشپزخانه هستند و روی چهارچوب کمد دیواری نباید دیده شوند
        if (!isVertical && !isGlassHolderMode && !c.isClosetFrame) {
            const pinGeo = new THREE.CylinderGeometry(pinRadius, pinRadius, pinLength, 8);
            pinGeo.rotateZ(Math.PI / 2); // محور در امتداد X

            const halfW = shelfWidth / 2;
            const halfD = shelfDepth / 2;
            const pinY = posY; // هم‌ارتفاع سطح زیرین تقریبی طبقه
            // کمی زیر رویه تا روی لبه ضخامت بنشیند
            const pinOffsetY = -thickness / 2;

            // فاصله پین‌ها از جلو/عقب (حدود ۲۰٪ عمق)
            const zFront = posZ + halfD * 0.55;
            const zBack  = posZ - halfD * 0.55;

            const pinPositions = [
                { x: posX - halfW - pinLength / 2, z: zFront }, // چپ جلو
                { x: posX - halfW - pinLength / 2, z: zBack  }, // چپ عقب
                { x: posX + halfW + pinLength / 2, z: zFront }, // راست جلو
                { x: posX + halfW + pinLength / 2, z: zBack  }  // راست عقب
            ];

            pinPositions.forEach((p, pi) => {
                const pin = new THREE.Mesh(pinGeo, pinMat);
                pin.position.set(p.x, pinY + pinOffsetY, p.z);
                pin.castShadow = true;
                pin.userData = { partType: 'shelfPin', shelfIndex: index, pinIndex: pi };
                group.add(pin);
            });
        }
    });
}

,



            placeCabinetInRoom: function(group, c) {
    // ۱. محاسبه ابعاد چرخش‌یافته برای حالت‌های پیش‌فرض
    const isRotated = (c.rot === 1 || c.rot === 3);
    const occupiedW = isRotated ? c.d : c.w;
    const occupiedD = isRotated ? c.w : c.d;

    let centerX, centerZ;

    // ۲. بررسی هوشمند زاویه برای اصلاح موقعیت مرکز
    if (c.angle !== undefined && c.angle !== null) {
        // نرمال‌سازی زاویه بین 0 تا 360 درجه
        const normalizedAngle = ((c.angle % 360) + 360) % 360;

        // اگر زاویه ۹۰ یا ۲۷۰ درجه دقیق بود، باید جای عرض و عمق عوض شود (حل مشکل زاویه ۹۰)
        if (Math.abs(normalizedAngle - 90) < 1 || Math.abs(normalizedAngle - 270) < 1) {
            centerX = c.x + c.d / 2;
            centerZ = c.y + c.w / 2;
        } else {
            // برای بقیه زوایا مثل ۴۰ درجه (منطق کاملاً درست خودتان)
            centerX = c.x + c.w / 2;
            centerZ = c.y + c.d / 2;
        }
    } else {
        // حالت پیش‌فرض بدون زاویه سفارشی (بر اساس rot)
        centerX = c.x + occupiedW / 2;
        centerZ = c.y + occupiedD / 2;
    }
    
    const rot = (c.rot || 0) % 4;
    const tolerance = 5;
    
    // دریافت ابعاد اتاق
    const roomW = (typeof room !== 'undefined') ? room.w : 0;
    const roomD = (typeof room !== 'undefined') ? room.d : 0;

    // بررسی وضعیت دیوارها
    const hasTop = (typeof room !== 'undefined' && room.hasTop !== undefined) ? room.hasTop : true;
    const hasBottom = (typeof room !== 'undefined' && room.hasBottom !== undefined) ? room.hasBottom : true;
    const hasLeft = (typeof room !== 'undefined' && room.hasLeft !== undefined) ? room.hasLeft : true;
    const hasRight = (typeof room !== 'undefined' && room.hasRight !== undefined) ? room.hasRight : true;
    
    // اعمال اسنپ فقط برای حالت‌های بدون زاویه سفارشی یا زوایای صفر
    if (c.angle === undefined || c.angle === null || c.angle === 0) {
        if (rot === 0 && Math.abs(c.y) <= tolerance && hasTop) { 
            centerZ = occupiedD / 2;
        } else if (rot === 1 && Math.abs(c.x) <= tolerance && hasLeft) { 
            centerX = occupiedW / 2; 
        } else if (rot === 2 && Math.abs((c.y + occupiedW) - roomD) <= tolerance && hasBottom) { 
            centerZ = roomD - occupiedD / 2;
        } else if (rot === 3 && Math.abs((c.x + occupiedW) - roomW) <= tolerance && hasRight) { 
            centerX = roomW - occupiedW / 2;
        }
    }

    const kbHeight = (c.kickboard && c.kickboard.enabled && c.y < 60)
        ? (parseFloat(c.kickboard.height) || 14)
        : 0;

    // ۱. ارتفاع نصب وارد شده توسط کاربر
    const baseElevation = parseFloat(c.elevation) || 0;

    // ۲. کف بدنه کابینت
    const bottomOfCabinet = Math.max(baseElevation, kbHeight);

    // ۳. محاسبه نهایی Y
    const finalY = bottomOfCabinet + (c.h / 2);

    group.position.set(centerX, finalY, centerZ);
    
    // اعمال چرخش نهایی بدون تداخل با موقعیت مرکز
    if (c.angle !== undefined && c.angle !== null) {
        group.rotation.y = -(c.angle * Math.PI / 180);
    } else {
        const effectiveRot = (4 - (c.rot || 0)) % 4;
        group.rotation.y = effectiveRot * (Math.PI / 2);
    }
},



// 🧱 تابع کمکی مشترک: کشیدن رگه‌های سنگ (همون منطق داخل createEnvironment، اینجا به‌صورت متد مشترک تا هم دیوار هم ستون بتونن ازش استفاده کنن)
    drawMarbleVeinsShared: function(ctx, x, y, w, h, color, veinCount, thickness = 1) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        ctx.strokeStyle = color;
        for (let i = 0; i < veinCount; i++) {
            ctx.lineWidth = thickness + (Math.random() * thickness * 1.5);
            ctx.beginPath();

            let startX = x + Math.random() * w;
            let startY = y + (Math.random() > 0.5 ? 0 : h);
            ctx.moveTo(startX, startY);

            ctx.bezierCurveTo(
                x + Math.random() * w, y + Math.random() * h,
                x + Math.random() * w, y + Math.random() * h,
                x + (Math.random() > 0.5 ? 0 : w), y + Math.random() * h
            );
            ctx.stroke();
        }
        ctx.restore();
    },

    // 🧱 تابع کمکی مشترک: ساخت متریال سرامیک دیواری — دقیقاً همون طرحی که روی دیوارهای آشپزخانه اعمال می‌شود
    createWallCeramicMaterialShared: function(wallHeight, wallWidth) {
        // همان کیفیت متریال دیوار اصلی (گروت + اسکیل + bump + roughness)
        // از createWallCeramicMaterial داخلی refreshRoom استفاده می‌شود؛ اینجا نسخهٔ مستقل برای ستون‌ها
        const c = this.config || {};
        const style = c.wallStyle || 'ceramic';
        const roughCfg = (c.wallRoughness !== undefined) ? parseFloat(c.wallRoughness) : 0.42;
        const bumpCfg = (c.wallBumpScale !== undefined) ? parseFloat(c.wallBumpScale) : 0.35;
        const groutColor = c.wallGroutColor || '#c8c2b8';

        if (style === 'white') {
            return new THREE.MeshStandardMaterial({
                color: 0xf5f5f5,
                roughness: Math.max(0.55, roughCfg),
                metalness: 0.0,
                envMapIntensity: 0.25
            });
        }

        const lower1 = c.wallBandLowerColor1 || '#fdfbf7';
        const lower2 = c.wallBandLowerColor2 || '#f4f1ea';
        const mid1   = c.wallBandMidColor1   || '#161616';
        const mid2   = c.wallBandMidColor2   || '#1d1d1d';
        const upper1 = c.wallBandUpperColor1 || '#fdfbf7';
        const upper2 = c.wallBandUpperColor2 || '#f4f1ea';

        const shadeHex = (hex, amount) => {
            try {
                const h = String(hex).replace('#', '');
                const n = parseInt(h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h, 16);
                let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
                r = Math.max(0, Math.min(255, Math.round(r + amount)));
                g = Math.max(0, Math.min(255, Math.round(g + amount)));
                b = Math.max(0, Math.min(255, Math.round(b + amount)));
                return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            } catch (e) { return hex; }
        };

        const canvas = document.createElement('canvas');
        const bumpCanvas = document.createElement('canvas');
        const texWCm = 240;
        const texHCm = Math.max(120, wallHeight || 280);
        canvas.width = 2048; canvas.height = 2048;
        bumpCanvas.width = 2048; bumpCanvas.height = 2048;
        const ctx = canvas.getContext('2d');
        const bumpCtx = bumpCanvas.getContext('2d');
        ctx.fillStyle = groutColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
        bumpCtx.fillStyle = '#1a1a1a'; bumpCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
        const pxPerCmX = canvas.width / texWCm;
        const pxPerCmY = canvas.height / texHCm;

        const drawTiles = (startCm, endCm, tileW, tileH, color1, color2, gapCm, veinColor, veinCount, thickness = 1) => {
            const gap = Math.max(1.5, gapCm * pxPerCmX * 0.35);
            const gapY = Math.max(1.5, gapCm * pxPerCmY * 0.35);
            for (let y = startCm; y < endCm - 0.01; y += tileH) {
                let currentTileH = Math.min(tileH, endCm - y);
                for (let x = 0; x < texWCm; x += tileW) {
                    const drawX = x * pxPerCmX;
                    const topYCm = y + currentTileH;
                    const drawY = canvas.height - (topYCm * pxPerCmY);
                    const drawW = tileW * pxPerCmX;
                    const drawH = currentTileH * pxPerCmY;
                    const col = Math.floor(x / tileW), row = Math.floor(y / tileH);
                    const base = ((col + row) % 2 === 0) ? color1 : color2;
                    const variation = ((col * 17 + row * 31) % 7) - 3;
                    const ix = drawX + gap, iy = drawY + gapY;
                    const iw = Math.max(1, drawW - gap * 2), ih = Math.max(1, drawH - gapY * 2);
                    ctx.fillStyle = shadeHex(base, variation);
                    ctx.fillRect(ix, iy, iw, ih);
                    const edge = Math.max(1, Math.min(4, gap * 0.6));
                    ctx.strokeStyle = shadeHex(base, -18);
                    ctx.lineWidth = edge;
                    ctx.strokeRect(ix + edge * 0.5, iy + edge * 0.5, iw - edge, ih - edge);
                    if (veinColor && veinCount > 0 && typeof this.drawMarbleVeinsShared === 'function') {
                        this.drawMarbleVeinsShared(ctx, ix, iy, iw, ih, veinColor, veinCount, thickness);
                    }
                    bumpCtx.fillStyle = '#f2f2f2';
                    bumpCtx.fillRect(ix, iy, iw, ih);
                    bumpCtx.strokeStyle = '#b0b0b0';
                    bumpCtx.lineWidth = edge * 1.2;
                    bumpCtx.strokeRect(ix + edge * 0.5, iy + edge * 0.5, iw - edge, ih - edge);
                }
            }
        };

        drawTiles(0, 90, 60, 30, lower1, lower2, 2.2, null, 0);
        drawTiles(90, 150, 80, 60, mid1, mid2, 3, 'rgba(255, 255, 255, 0.35)', 5, 4);
        drawTiles(150, texHCm, 60, 30, upper1, upper2, 2.2, null, 0);

        const mapTex = new THREE.CanvasTexture(canvas);
        mapTex.wrapS = THREE.RepeatWrapping;
        mapTex.wrapT = THREE.ClampToEdgeWrapping;
        mapTex.repeat.set(Math.max(0.25, wallWidth / texWCm), 1);
        mapTex.colorSpace = THREE.SRGBColorSpace;

        const bumpTex = new THREE.CanvasTexture(bumpCanvas);
        if (typeof window.applyKitchenTextureColorSpace === 'function') window.applyKitchenTextureColorSpace(bumpTex, 'data');
        else if (typeof THREE !== 'undefined' && THREE.NoColorSpace != null) bumpTex.colorSpace = THREE.NoColorSpace;
        bumpTex.wrapS = THREE.RepeatWrapping;
        bumpTex.wrapT = THREE.ClampToEdgeWrapping;
        bumpTex.repeat.set(Math.max(0.25, wallWidth / texWCm), 1);

        if (this.renderer && this.renderer.capabilities) {
const maxA = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
            mapTex.anisotropy = maxA; bumpTex.anisotropy = maxA;
        }

        return new THREE.MeshStandardMaterial({
            map: mapTex, bumpMap: bumpTex, bumpScale: bumpCfg,
            roughness: roughCfg, metalness: 0.02, envMapIntensity: 0.45
        });
    },
    renderPillars: function() {
    if (typeof pillars === 'undefined' || !pillars || pillars.length === 0) return;
    
    // گرفتن ارتفاع مستقیم از متغیر اصلی اتاق (room.h)
    // اگر به هر دلیلی room.h تعریف نشده بود، از کانفیگ یا مقدار پیش‌فرض ۲۸۰ استفاده می‌کند
    const h = room.h || this.config.wallHeight || 280; 
    
    pillars.forEach(p => {
        // ساخت هندسه با ارتفاع جدید h
        const geo = new THREE.BoxGeometry(p.w, h, p.d);
        
        const matSideX = this.createWallCeramicMaterialShared(h, p.d); // وجه‌های چپ و راست ستون
const matSideZ = this.createWallCeramicMaterialShared(h, p.w); // وجه‌های جلو و عقب ستون
const matTopBottom = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8 }); // زیر و روی ستون

const materials = [matSideX, matSideX, matTopBottom, matTopBottom, matSideZ, matSideZ];

const mesh = new THREE.Mesh(geo, materials);
        
        // تنظیم موقعیت: مرکز ستون باید در h/2 باشد تا روی زمین قرار بگیرد
        mesh.position.set(
            p.x + p.w / 2, 
            h / 2, 
            p.y + p.d / 2
        );
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isPillar = true;
        
        this.scene.add(mesh);
    });
},
    // --- تابع برای کنترل گروه هالوژن‌ها ---
/**
 * ثبت شدت/رنگ/وضعیت اولیه هر چراغ تا ON همیشه همان مقدار ساخت را برگرداند
 * نه عدد ثابت اشتباه مثل 3200
 */
registerLightState: function(light, opts) {
    if (!light) return light;
    opts = opts || {};
    if (!light.userData) light.userData = {};
    const intensity = (opts.intensity != null)
        ? opts.intensity
        : ((light.userData.savedIntensity != null)
            ? light.userData.savedIntensity
            : ((light.userData.baseIntensity != null) ? light.userData.baseIntensity : light.intensity));
    const color = (opts.color != null)
        ? opts.color
        : ((light.userData.savedColor != null) ? light.userData.savedColor : (light.color ? light.color.getHex() : 0xffffff));
    const state = (opts.state != null)
        ? !!opts.state
        : ((light.userData.savedState != null) ? !!light.userData.savedState : (intensity > 0));

    light.userData.savedIntensity = intensity;
    light.userData.baseIntensity = intensity; // سازگاری با کدهای قبلی
    light.userData.savedColor = color;
    light.userData.savedState = state;
    if (light.color && typeof light.color.setHex === 'function') {
        try { light.color.setHex(color); } catch (e) { /* ignore */ }
    }
    light.intensity = state ? intensity : 0;
    return light;
},

/** روشن کردن یک چراغ با مقدار ذخیره‌شده */
setLightOn: function(light) {
    if (!light || !light.userData) return;
    const i = (light.userData.savedIntensity != null)
        ? light.userData.savedIntensity
        : ((light.userData.baseIntensity != null) ? light.userData.baseIntensity : 0);
    light.intensity = i;
    light.userData.savedState = true;
    if (light.color && light.userData.savedColor != null && typeof light.color.setHex === 'function') {
        try { light.color.setHex(light.userData.savedColor); } catch (e) { /* ignore */ }
    }
},

/** خاموش کردن یک چراغ بدون از دست دادن شدت ذخیره‌شده */
setLightOff: function(light) {
    if (!light || !light.userData) return;
    // اگر الان روشن است و savedIntensity خالی است، شدت فعلی را حفظ کن
    if (light.intensity > 0 && light.userData.savedIntensity == null) {
        light.userData.savedIntensity = light.intensity;
        light.userData.baseIntensity = light.intensity;
    }
    light.intensity = 0;
    light.userData.savedState = false;
},

/** روشن/خاموش گروهی با حفظ intensity ساخت */
setLightsGroupState: function(lights, on) {
    if (!lights || !lights.length) return;
    lights.forEach(light => {
        if (on) this.setLightOn(light);
        else this.setLightOff(light);
    });
},

   // --- کنترل گروه هالوژن‌های سقفی (و لامپ دیوار کاستوم) ---
   toggleCeilingLight: function(buttonElement) {
    if (!this.ceilingLights || this.ceilingLights.length === 0) return;

    // وضعیت را از savedState یا intensity می‌خوانیم
    const first = this.ceilingLights[0];
    const isOn = first && (
        (first.userData && first.userData.savedState === true) ||
        (first.intensity > 0)
    );

    // اطمینان: هر چراغ intensity ذخیره‌شده دارد
    const fallback = (this._ceilingLightIntensity != null)
        ? this._ceilingLightIntensity
        : ((this.config && this.config.ceilingLightIntensity != null)
            ? parseFloat(this.config.ceilingLightIntensity)
            : 3200);

    this.ceilingLights.forEach(light => {
        if (!light.userData) light.userData = {};
        if (light.userData.savedIntensity == null) {
            const i = (light.userData.baseIntensity != null)
                ? light.userData.baseIntensity
                : (light.intensity > 0 ? light.intensity : fallback);
            light.userData.savedIntensity = i;
            light.userData.baseIntensity = i;
        }
        if (light.userData.savedColor == null && light.color) {
            try { light.userData.savedColor = light.color.getHex(); } catch (e) { light.userData.savedColor = 0xfff1e0; }
        }
    });

    if (isOn) {
        this.setLightsGroupState(this.ceilingLights, false);
        if (this.bulbMeshes) {
            this.bulbMeshes.forEach(bulb => {
                if (bulb && bulb.material) {
                    if (bulb.userData && bulb.userData.savedEmissiveIntensity == null) {
                        bulb.userData.savedEmissiveIntensity =
                            (bulb.material.emissiveIntensity != null) ? bulb.material.emissiveIntensity : 1.0;
                    }
                    bulb.material.emissiveIntensity = 0;
                }
            });
        }
        if (this.config) this.config.ceilingLightOn = false;
        if (buttonElement) buttonElement.classList.remove('on');
    } else {
        this.setLightsGroupState(this.ceilingLights, true);
        if (this.bulbMeshes) {
            this.bulbMeshes.forEach(bulb => {
                if (bulb && bulb.material) {
                    const e = (bulb.userData && bulb.userData.savedEmissiveIntensity != null)
                        ? bulb.userData.savedEmissiveIntensity
                        : 1.0;
                    bulb.material.emissiveIntensity = e;
                }
            });
        }
        if (this.config) this.config.ceilingLightOn = true;
        if (buttonElement) buttonElement.classList.add('on');
    }
},





exportGLB: function(fileName = "آشپزخانه_سه_بعدی.html") {
    // خروجی فقط از نمای Babylon — مسیر Three حذف شد
    if (typeof KitchenBabylon !== "undefined" && typeof KitchenBabylon.exportGLB === "function") {
        return KitchenBabylon.exportGLB(fileName);
    }
    alert("خروجی سه‌بعدی فقط از نمای BJS در دسترس است. اول دکمه BJS را بزنید.");
},

        
        
    exportImage: function(fileName = "عکس_آشپزخانه.png") {
        // خروجی عکس فقط از نمای Babylon — مسیر Three حذف شد
        if (typeof KitchenBabylon !== "undefined" && typeof KitchenBabylon.exportImage === "function") {
            return KitchenBabylon.exportImage(fileName);
        }
        alert("خروجی عکس فقط از نمای BJS در دسترس است. اول دکمه BJS را بزنید.");
    },
    // اضافه کردن متغیر وضعیت کیفیت به کلاس (در متد constructor یا بالای فایل)
    // isHighQuality = false;
    // تابع فعال‌سازی رندر واقعی
    async toggleHighQuality(btn) {
        this.isPathTracing = !this.isPathTracing;

        if (this.isPathTracing) {
            btn.innerHTML = "⏳ در حال رندر... (توقف)";
            btn.style.backgroundColor = "#ff9800";
            
            // 1. اگر موتور Path Tracer هنوز ساخته نشده، آن را می‌سازیم
            if (!this.pathTracer) {
                // توجه: مطمئن شوید کتابخانه three-gpu-pathtracer به درستی اضافه شده باشد
                this.pathTracer = new WebGLPathTracer( this.renderer );
                this.pathTracer.multipleImportanceSampling = true;
                this.pathTracer.bounces = 3; // تعداد پرش‌های نور
            }

            // 2. آماده‌سازی صحنه برای رندر واقعی
            // این کار ممکن است یکی دو ثانیه صفحه را نگه دارد
            await this.pathTracer.setSceneAsync( this.scene, this.camera );
            
            // 3. شروع حلقه رندر
            this.renderRealistic();

        } else {
            // بازگشت به حالت عادی (Real-time)
            btn.innerHTML = "🌟 رندر واقعی";
            btn.style.backgroundColor = "";
            
            // نمایش مجدد حالت عادی و سبک
            this.renderer.render(this.scene, this.camera);
        }
    },

    // حلقه رندر برای پردازش پیکسل به پیکسل
    renderRealistic() {
        if (!this.isPathTracing) return; // اگر کاربر دکمه توقف را زد، ادامه نده

        // رندر کردن یک نمونه (Sample) جدید
        this.pathTracer.renderSample();

        const samples = Math.floor(this.pathTracer.samples);
        
        // اگر به 100 نمونه رسیدیم متوقف می‌شویم (می‌توانید این عدد را برای کیفیت بیشتر بالاتر ببرید، مثلا 200 یا 500)
        if (samples < 100) {
            // درخواست فریم بعدی برای ادامه رندر
            requestAnimationFrame(() => this.renderRealistic());
        } else {
            console.log("رندر واقعی کامل شد!");
            // در صورت تمایل می‌توانید متن دکمه را اینجا تغییر دهید
        }
    },


        // بین‌کابینتی (ورق ۲ میلی‌متری) - فقط در نمای 3D
       // بین‌کابینتی (ورق ۲ میلی‌متری) - فقط در نمای 3D
addInterPanels: function() {
    if (!window.interPanels || window.interPanels.length === 0) return;

    const loader = new THREE.TextureLoader();
    const roomW = window.room?.w || 400;
    const roomD = window.room?.d || 400;
    const wallThick = this.config?.wallThickness || 20;

    // نقشه‌راه برچسب دیوارها برای بازسازی دقیق لیبل کات‌مستر
    const wallNameMap = { 'back': 'روبرو', 'left': 'چپ', 'right': 'راست', 'front': 'جلو' };

    // متریال واقعی بین‌کابینتی بر اساس نوع ورق
    const buildInterMaterial = (p, targetLabel) => {
        const isMarble = (p.materialType === 'marbleSheet' || p.materialType === 'marble');
        // پرداخت سطح جدا از جنس ورق؛ پیش‌فرض ماربل ساتین، MDF مات
        const finishKey = p.finish || (isMarble ? 'satin' : 'matte');
        const preset = (typeof window.getKitchenFinishPreset === 'function')
            ? window.getKitchenFinishPreset(finishKey)
            : { roughness: isMarble ? 0.18 : 0.42, metalness: isMarble ? 0.35 : 0.06, envMapIntensity: isMarble ? 1.2 : 0.55, bumpScale: isMarble ? 0.08 : 0.15, clearcoat: 0 };
        const metalness = preset.metalness;
        const roughness = preset.roughness;
        const envI = preset.envMapIntensity != null ? preset.envMapIntensity : (isMarble ? 1.2 : 0.55);
        const bump = preset.bumpScale != null ? preset.bumpScale : (isMarble ? 0.08 : 0.15);

        // تکسچر روی کل ورق بدون هیچ تکراری (یک طرح برای هر ورق، مثل تایل ۱۲۲×۲۸۰)
        const configureTex = (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.repeat.set(1, 1);
            tex.offset.set(0, 0);
            tex.center.set(0.5, 0.5);
            tex.needsUpdate = true;
        };

        let map = null;
        if (window.isolatedDoorTextures && window.isolatedDoorTextures[targetLabel]) {
            map = loader.load(window.isolatedDoorTextures[targetLabel], configureTex);
        } else if (p.color && (typeof p.color === 'string') &&
            (p.color.startsWith('http') || p.color.includes('assets') || p.color.includes('/') || p.color.includes('.'))) {
            map = loader.load(p.color, configureTex);
        }

        const frontParams = {
            color: map ? 0xffffff : (p.color || 0xffffff),
            map: map,
            bumpMap: map || null,
            bumpScale: map ? bump : 0,
            metalness: metalness,
            roughness: roughness,
            envMapIntensity: envI,
            side: THREE.FrontSide
        };
        let frontMat;
        if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
            frontParams.clearcoat = preset.clearcoat;
            frontParams.clearcoatRoughness = preset.clearcoatRoughness || 0.05;
            frontMat = new THREE.MeshPhysicalMaterial(frontParams);
        } else {
            frontMat = new THREE.MeshStandardMaterial(frontParams);
        }
        // لبه ضخامت — کمی تیره‌تر تا عمق واقعی دیده شود
        const edgeMat = new THREE.MeshStandardMaterial({
            color: isMarble ? 0xc8c4be : 0xd0cbc3,
            metalness: Math.min(0.25, metalness + 0.02),
            roughness: Math.min(0.85, roughness + 0.15),
            side: THREE.FrontSide
        });
        const backMat = new THREE.MeshStandardMaterial({
            color: 0xe8e4de,
            metalness: 0.02,
            roughness: 0.7,
            side: THREE.FrontSide
        });
        // BoxGeometry: [+x,-x,+y,-y,+z front,-z back]
        return [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];
    };

    // --- محاسبه دیوارهای کاستوم ---
    const baseEndpoints = {
        back:   { start: { x: 0, z: 0 }, end: { x: roomW, z: 0 } },
        front:  { start: { x: 0, z: roomD }, end: { x: roomW, z: roomD } },
        top:    { start: { x: 0, z: 0 }, end: { x: roomW, z: 0 } },
        bottom: { start: { x: 0, z: roomD }, end: { x: roomW, z: roomD } },
        left:   { start: { x: 0, z: 0 }, end: { x: 0, z: roomD } },
        right:  { start: { x: roomW, z: 0 }, end: { x: roomW, z: roomD } }
    };

    const customWallsData = {};
    if (window.customWalls) {
        window.customWalls.forEach(cWall => {
            let p1;
            if (cWall.x !== undefined && cWall.y !== undefined) {
                p1 = { x: cWall.x, z: cWall.y };
            } else {
                const target = baseEndpoints[cWall.targetWall];
                if (target) {
                    p1 = (cWall.attachment === 'end') ? { x: target.end.x, z: target.end.z } : { x: target.start.x, z: target.start.z };
                } else {
                    p1 = { x: 0, z: 0 };
                }
            }
            const cAngRad = cWall.angle * (Math.PI / 180);
            const p2 = { x: p1.x + cWall.len * Math.cos(cAngRad), z: p1.z + cWall.len * Math.sin(cAngRad) };
            baseEndpoints[cWall.id] = { start: p1, end: p2 };

            let zShift = 0;
            let panelSideModifier = 1; 
            let flipAngle = 0; 

            if (cWall.shift === 'right') {
                zShift = wallThick / 2;
                panelSideModifier = -1; 
                flipAngle = Math.PI;    
            } else if (cWall.shift === 'left') {
                zShift = -wallThick / 2;
                panelSideModifier = 1;  
                flipAngle = 0;
            }

            customWallsData[cWall.id] = { 
                p1, angle: cAngRad, len: cWall.len, shift: zShift, 
                panelSideModifier, flipAngle 
            };
        });
    }
    // ---------------------------------------------------

    window.interPanels.forEach((p, idx) => {
        if (!p.enabled) return;

        // ضخامت واقعی ورق بین‌کابینتی: ۲.۵ میل = ۰.۲۵ سانت
        // (اگر مقدار قدیمی ۲ سانت ذخیره شده باشد، به ۲.۵ میل اصلاح می‌شود)
        let thickness = 0.25;
        if (p.thickness !== undefined && p.thickness !== null && Number.isFinite(parseFloat(p.thickness))) {
            const tVal = parseFloat(p.thickness);
            thickness = (tVal >= 1.5) ? 0.25 : tVal; // مقادیر قدیمی cm را نادیده بگیر
        }
        const wallGap = (p.wallGap !== undefined && p.wallGap !== null && Number.isFinite(parseFloat(p.wallGap)))
            ? parseFloat(p.wallGap)
            : 0.05; // فاصله خیلی کم از دیوار برای جلوگیری از Z-fighting

        const geometry = new THREE.BoxGeometry(p.length, p.width, thickness);

        // 🔍 بازسازی دقیق برچسب قطعه برای مطابقت با بافت کات‌مستر
        const wallLabel = wallNameMap[p.wall] || 'نامشخص';
        const targetLabel = `ورق بین کابینتی ${idx + 1} (دیوار ${wallLabel})`;

        const material = buildInterMaterial(p, targetLabel);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.isInterPanel = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const posY = p.y + (p.width / 2);
        // مرکز ورق = نصف ضخامت + فاصله از دیوار
        const faceOffset = (thickness / 2) + wallGap;

        // --- بخش دیوارهای کاستوم ---
        if (customWallsData && customWallsData[p.wall]) {
            const cw = customWallsData[p.wall];

            const dummyGroup = new THREE.Group();
            dummyGroup.position.set(cw.p1.x, 0, cw.p1.z);
            dummyGroup.rotation.y = -cw.angle;

            const pivotGroup = new THREE.Group();
            pivotGroup.position.x = cw.len / 2;
            pivotGroup.position.z = cw.shift;
            dummyGroup.add(pivotGroup);

            const localX = p.x - (cw.len / 2) + (p.length / 2);

            const offsetZ = cw.panelSideModifier * ((wallThick / 2) + faceOffset);
            mesh.position.set(localX, posY, offsetZ);

            mesh.rotation.y = cw.flipAngle;

            pivotGroup.add(mesh);
            dummyGroup.userData.isInterPanel = true;
            this.scene.add(dummyGroup);

            return;
        }
        // -------------------------------------------

        // 🔵 BACK
        else if (p.wall === 'back') {
            mesh.position.set(
                p.x + (p.length / 2),
                posY,
                faceOffset
            );
        }

        // 🔴 FRONT
        else if (p.wall === 'front') {
            mesh.rotation.y = Math.PI;
            mesh.position.set(
                roomW - (p.x + p.length / 2),
                posY,
                roomD - faceOffset
            );
        }

        // 🔵 LEFT
        else if (p.wall === 'left') {
            mesh.rotation.y = Math.PI / 2;
            mesh.position.set(
                faceOffset,
                posY,
                p.x + (p.length / 2)
            );
        }

        // 🔴 RIGHT
        else if (p.wall === 'right') {
            mesh.rotation.y = -Math.PI / 2;
            mesh.position.set(
                roomW - faceOffset,
                posY,
                p.x + (p.length / 2)
            );
        }

        this.scene.add(mesh);
    });
},



    refreshInterPanels: function() {
    if (!this.scene) return;

    // ۱. حذف تمام پنل‌های موجود (پاکسازی صحنه)
    const toRemove = [];
    this.scene.traverse((obj) => {
        if (obj.userData && obj.userData.isInterPanel) {
            toRemove.push(obj);
        }
    });
    toRemove.forEach(obj => {
        if (obj.geometry) this.safeDisposeGeometry(obj.geometry);
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => this.safeDisposeMaterial(m));
            } else {
                this.safeDisposeMaterial(obj.material);
            }
        }
        if (obj.parent) obj.parent.remove(obj);
        else this.scene.remove(obj);
    });

    // ۲. فراخوانی تابع ساخت
    this.addInterPanels();
},

    onObjectClick: function(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    
    // تشخیص اینکه آیا رویداد لمسی (Touch) است یا موس (Mouse)
    // یک بررسی امنیتی برای length اضافه شد تا در گوشی خطا ندهد
    const isTouch = event.touches && event.touches.length > 0;
    const clientX = isTouch ? event.touches[0].clientX : event.clientX;
    const clientY = isTouch ? event.touches[0].clientY : event.clientY;

    // تبدیل مختصات به فضای سه بعدی
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
        // پیدا کردن درب/کشو — روی خود مش یا والد (دستگیره/غلطک)
        const findDoorOrDrawer = (obj) => {
            let o = obj;
            while (o) {
                if (o.userData && (o.userData.isDoor || o.userData.isDrawer)) return o;
                o = o.parent;
            }
            return null;
        };
        let obj = null;
        for (let i = 0; i < intersects.length; i++) {
            obj = findDoorOrDrawer(intersects[i].object);
            if (obj) break;
        }

        if (obj) {
            obj.userData.isOpen = !obj.userData.isOpen;
            
            // ---- منطق باز و بسته شدن درب‌ها ----
            if (obj.userData.isDoor) {
                // درب ریلی: حرکت چپ/راست روی ریل
                if (obj.userData.isSlidingDoor) {
                    obj.userData.targetX = obj.userData.isOpen
                        ? obj.userData.openX
                        : obj.userData.closedX;
                    if (typeof this.markAnimating === "function") this.markAnimating(obj);
                    if (typeof logAction === 'function') {
                        logAction("success", `درب ریلی ${obj.userData.isOpen ? "باز" : "بسته"} شد`);
                    }
                } else {
                    // درب لولایی: چرخش حول لولا
                    const hinge = obj.userData.hinge;
                    const axis = obj.userData.axis;
                    const dir = obj.userData.openDirection;

                    let targetAngle = 0;
                    if (obj.userData.isOpen) {
                        if (axis === 'x') targetAngle = -1.6;
                        else targetAngle = dir * (Math.PI / 2);
                    }
                    if (hinge) {
                        hinge.userData.targetRotation = targetAngle;
                        if (typeof this.markAnimating === "function") this.markAnimating(hinge);
                    }

                    if (typeof logAction === 'function') {
                        logAction("success", `درب ${obj.userData.isOpen ? "باز" : "بسته"} شد`);
                    }
                }
            } 
            // ---- منطق باز و بسته شدن کشوها (حرکت رو به جلو) ----
            else if (obj.userData.isDrawer) {
                let targetZ = 0;
                if (obj.userData.isOpen) {
                    targetZ = obj.userData.openZ; // مقداری که در createDoorSystem تعریف کردیم
                } else {
                    targetZ = obj.userData.closedZ;
                }
                obj.userData.targetZ = targetZ; // ذخیره هدف حرکت برای تابع انیمیشن
                if (typeof this.markAnimating === "function") this.markAnimating(obj);

                if (typeof logAction === 'function') {
                    logAction("success", `کشو ${obj.userData.isOpen ? "باز" : "بسته"} شد`);
                }
            }

            // روشن/خاموش نور داخل با باز شدن درب یا کشو
            if (typeof this.syncInteriorCabinetLight === 'function') {
                this.syncInteriorCabinetLight(obj);
            }
        }
    }
},

    animate: function() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // تب مخفی: رندر نکن (صرفه‌جویی CPU/GPU)
    if (typeof document !== 'undefined' && document.hidden) return;

    // یک‌بار بعد از پایدار شدن صحنه، آمار draw call
    if (!this._statsLoggedOnce && this.scene && this.renderer) {
        this._statsFrameCount = (this._statsFrameCount || 0) + 1;
        if (this._statsFrameCount === 45) {
            this._statsLoggedOnce = true;
            try { this.logRenderStats('auto-after-load'); } catch (e) {}
        }
    }

    if (this.controls) this.controls.update();

    // فقط اشیاء در حال انیمیشن — نه traverse کل صحنه
    if (!this._animatingObjects) this._animatingObjects = new Set();
    if (this._animatingObjects.size > 0) {
        const done = [];
        this._animatingObjects.forEach((obj) => {
            if (!obj || !obj.userData) { done.push(obj); return; }
            let still = false;
            if (typeof obj.userData.targetRotation !== 'undefined') {
                const target = obj.userData.targetRotation;
                const door = obj.children[0];
                const axis = (door && door.userData && door.userData.axis === 'x') ? 'x' : 'y';
                const cur = axis === 'x' ? obj.rotation.x : obj.rotation.y;
                const next = cur + (target - cur) * 0.12;
                if (axis === 'x') obj.rotation.x = next; else obj.rotation.y = next;
                if (Math.abs(target - next) > 0.002) still = true;
                else {
                    if (axis === 'x') obj.rotation.x = target; else obj.rotation.y = target;
                }
            }
            if (typeof obj.userData.targetZ !== 'undefined') {
                const targetZ = obj.userData.targetZ;
                obj.position.z += (targetZ - obj.position.z) * 0.12;
                if (Math.abs(targetZ - obj.position.z) > 0.05) still = true;
                else obj.position.z = targetZ;
            }
            // حرکت افقی درب ریلی
            if (typeof obj.userData.targetX !== 'undefined') {
                const targetX = obj.userData.targetX;
                obj.position.x += (targetX - obj.position.x) * 0.12;
                if (Math.abs(targetX - obj.position.x) > 0.05) still = true;
                else obj.position.x = targetX;
            }
            if (!still) done.push(obj);
        });
        done.forEach((o) => this._animatingObjects.delete(o));
    }

    // به‌روزرسانی Shadow Map هر ۲ فریم (autoUpdate=false)
    this._shadowFrame = (this._shadowFrame || 0) + 1;
    if (this.renderer.shadowMap && this.renderer.shadowMap.enabled) {
        const needShadow = (this._shadowFrame % 2 === 0) ||
            (this._animatingObjects && this._animatingObjects.size > 0);
        this.renderer.shadowMap.needsUpdate = !!needShadow;
    }

    // Post Processing یا رندر مستقیم
    if (this._postEnabled && this.composer) {
        this.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
    }
},

    /** ثبت درب/کشو برای انیمیشن فریمی (بدون traverse سراسری) */
    markAnimating: function(obj) {
        if (!obj) return;
        if (!this._animatingObjects) this._animatingObjects = new Set();
        this._animatingObjects.add(obj);
    },

    /**
     * مرحله 45 — Draw Calls / Triangles / Textures / Materials
     * در کنسول: Kitchen3D.logRenderStats()
     */
    logRenderStats: function(label) {
        if (!this.renderer || !this.scene) {
            console.warn('[Kitchen3D] stats: renderer/scene not ready');
            return null;
        }
        // یک فریم رندر برای پر شدن info
        try {
            if (this.camera) this.renderer.render(this.scene, this.camera);
        } catch (e) {}

        const info = this.renderer.info || {};
        const mem = info.memory || {};
        const render = info.render || {};

        let meshCount = 0, groupCount = 0, lightCount = 0;
        let triEstimate = 0;
        const materialSet = new Set();
        const textureSet = new Set();
        const geoSet = new Set();
        let sharedMat = 0, sharedGeo = 0, sharedTex = 0;

        this.scene.traverse(function (obj) {
            if (obj.isLight) lightCount++;
            if (obj.isGroup) groupCount++;
            if (!obj.isMesh) return;
            meshCount++;
            const geo = obj.geometry;
            if (geo) {
                geoSet.add(geo.uuid || geo);
                if (geo.userData && geo.userData.sharedGeometry) sharedGeo++;
                const idx = geo.index;
                const pos = geo.attributes && geo.attributes.position;
                if (idx) triEstimate += (idx.count / 3);
                else if (pos) triEstimate += (pos.count / 3);
            }
            const mats = Array.isArray(obj.material) ? obj.material : (obj.material ? [obj.material] : []);
            mats.forEach(function (m) {
                if (!m) return;
                materialSet.add(m.uuid || m);
                if (m.userData && m.userData.sharedMaterial) sharedMat++;
                ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'bumpMap', 'emissiveMap'].forEach(function (k) {
                    const tex = m[k];
                    if (!tex) return;
                    textureSet.add(tex.uuid || tex);
                    if (tex.userData && tex.userData.sharedTexture) sharedTex++;
                });
            });
        });

        const stats = {
            label: label || 'scene',
            drawCalls: render.calls != null ? render.calls : null,
            triangles: render.triangles != null ? render.triangles : Math.round(triEstimate),
            points: render.points || 0,
            lines: render.lines || 0,
            geometries: mem.geometries != null ? mem.geometries : geoSet.size,
            textures: mem.textures != null ? mem.textures : textureSet.size,
            meshes: meshCount,
            groups: groupCount,
            lights: lightCount,
            uniqueMaterials: materialSet.size,
            uniqueTextures: textureSet.size,
            uniqueGeometries: geoSet.size,
            sharedMaterialRefs: sharedMat,
            sharedGeometryRefs: sharedGeo,
            sharedTextureRefs: sharedTex,
            programs: (info.programs && info.programs.length) || null
        };

        const lines = [
            '======= Kitchen3D Render Stats (' + stats.label + ') =======',
            'Draw Calls:        ' + stats.drawCalls,
            'Triangles:         ' + stats.triangles,
            'Meshes:            ' + stats.meshes,
            'Geometries (GPU):  ' + stats.geometries + '  | unique: ' + stats.uniqueGeometries + '  | shared refs: ' + stats.sharedGeometryRefs,
            'Textures (GPU):    ' + stats.textures + '  | unique: ' + stats.uniqueTextures + '  | shared refs: ' + stats.sharedTextureRefs,
            'Materials:         ' + stats.uniqueMaterials + '  | shared refs: ' + stats.sharedMaterialRefs,
            'Lights:            ' + stats.lights,
            'Programs:          ' + stats.programs,
            '========================================================'
        ];
        if (console && console.info) console.info(lines.join('\n'));
        this._lastRenderStats = stats;
        return stats;
    },



        onWindowResize: function() {
        const container = document.getElementById('3d-container');
        if (!container || !this.camera || !this.renderer) return;
        
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        if (typeof this.resizePostProcessing === 'function') {
            this.resizePostProcessing();
        }
    }, // 🔴 دقت کنید: این کاما حتماً باید اینجا اضافه شود!

    // 👇 تابع نمای کابینت دقیقاً اینجا (داخل آبجکت و قبل از براکت بسته) قرار می‌گیرد 👇
      createCabinetFacadeMeshes: function(c) {
        const facadeGroup = new THREE.Group();
        facadeGroup.name = "FacadeGroup";

        // 🔴 لاگ گیری برای دیباگ: با زدن F12 و رفتن به تب Console این پیام ها را می بینید
        console.log(`بررسی نمای کابینت [${c.id || c.name || 'نامشخص'}]:`, c.facadeSettings);

        // بررسی اینکه آیا تنظیمات نما در این کابینت ذخیره و فعال شده است؟
        if (!c.facadeSettings) {
            console.warn("تنظیمات نمایی برای این کابینت وجود ندارد.");
            return facadeGroup; 
        }
        if (c.facadeSettings.enabled === false) {
            console.warn("تنظیمات نما برای این کابینت خاموش است.");
            return facadeGroup; 
        }

        const fs = c.facadeSettings;
        const w = parseFloat(c.w) || 0;
        const h = parseFloat(c.h) || 0;
        const d = parseFloat(c.d) || 0;
        
        const panelThickness = 1.6; 
        const thermoThickness = parseFloat(fs.thermoThickness) || 2.0; 

        // 1. ساخت متریال پنل نمای اصلی
        let facadeMat;
        const colorVal = fs.color || "#ffffff";
        const isTexture = colorVal.includes('http') || colorVal.includes('assets/') || colorVal.includes('/');
        
        if (isTexture) {
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load(colorVal);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, h / 100); 
            facadeMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5, metalness: 0.1 });
        } else {
            // استفاده از THREE.Color برای جلوگیری از خطای پارس کردن کدهای رنگی
            facadeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorVal), roughness: 0.5, metalness: 0.1 });
        }

        // 2. ساخت متریال ترمووال
        let thermoMat;
        if (fs.hasThermovall) {
            const thermoColor = fs.thermoColor || "#8B4513";
            const isThermoTexture = thermoColor.includes('http') || thermoColor.includes('assets/') || thermoColor.includes('/');
            
            if (isThermoTexture) {
                const textureLoader = new THREE.TextureLoader();
                const thermoTex = textureLoader.load(thermoColor);
                thermoTex.wrapS = THREE.RepeatWrapping;
                thermoTex.wrapT = THREE.RepeatWrapping;
                thermoTex.repeat.set(1, Math.max(1, h / 120));
                thermoTex.colorSpace = THREE.SRGBColorSpace;
                thermoMat = new THREE.MeshStandardMaterial({
                    map: thermoTex,
                    bumpMap: (typeof window.asDataMapTexture === 'function') ? window.asDataMapTexture(thermoTex) : thermoTex,
                    bumpScale: 0.18,
                    roughness: 0.48,
                    metalness: 0.08,
                    envMapIntensity: 0.85
                });
            } else {
                thermoMat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(thermoColor),
                    roughness: 0.48,
                    metalness: 0.08,
                    envMapIntensity: 0.85
                });
            }
        }

        const sides = Array.isArray(fs.sides) ? fs.sides : []; 
        const thermoSides = Array.isArray(fs.thermoSides) ? fs.thermoSides : [];
        console.log("طرف‌های انتخاب شده برای ساخت:", sides);

        // نمای سمت چپ
        if (sides.includes('left')) {
            const leftGeo = new THREE.BoxGeometry(panelThickness, h, d);
            const leftMesh = new THREE.Mesh(leftGeo, facadeMat);
            leftMesh.position.set(-(w / 2) - (panelThickness / 2), 0, 0);
            facadeGroup.add(leftMesh);

            if (fs.hasThermovall && thermoSides.includes('left')) {
                const thGeo = new THREE.BoxGeometry(thermoThickness, h, d);
                const thMesh = new THREE.Mesh(thGeo, thermoMat);
                thMesh.castShadow = true;
                thMesh.receiveShadow = true;
                thMesh.position.set(-(w / 2) - panelThickness - (thermoThickness / 2), 0, 0);
                facadeGroup.add(thMesh);
            }
        }

        // نمای سمت راست
        if (sides.includes('right')) {
            const rightGeo = new THREE.BoxGeometry(panelThickness, h, d);
            const rightMesh = new THREE.Mesh(rightGeo, facadeMat);
            rightMesh.position.set((w / 2) + (panelThickness / 2), 0, 0);
            facadeGroup.add(rightMesh);

            if (fs.hasThermovall && thermoSides.includes('right')) {
                const thGeo = new THREE.BoxGeometry(thermoThickness, h, d);
                const thMesh = new THREE.Mesh(thGeo, thermoMat);
                thMesh.castShadow = true;
                thMesh.receiveShadow = true;
                thMesh.position.set((w / 2) + panelThickness + (thermoThickness / 2), 0, 0);
                facadeGroup.add(thMesh);
            }
        }

        // نمای سقف (top)
        if (sides.includes('top')) {
            const totalWidth = w + (sides.includes('left') ? panelThickness : 0) + (sides.includes('right') ? panelThickness : 0);
            const topGeo = new THREE.BoxGeometry(totalWidth, panelThickness, d);
            const topMesh = new THREE.Mesh(topGeo, facadeMat);
            topMesh.position.set(0, (h / 2) + (panelThickness / 2), 0);
            facadeGroup.add(topMesh);

            if (fs.hasThermovall && thermoSides.includes('top')) {
                const thGeo = new THREE.BoxGeometry(totalWidth, thermoThickness, d);
                const thMesh = new THREE.Mesh(thGeo, thermoMat);
                thMesh.castShadow = true;
                thMesh.receiveShadow = true;
                thMesh.position.set(0, (h / 2) + panelThickness + (thermoThickness / 2), 0);
                facadeGroup.add(thMesh);
            }
        }
        
        // نمای کف (bottom)
        if (sides.includes('bottom')) {
            const totalWidth = w + (sides.includes('left') ? panelThickness : 0) + (sides.includes('right') ? panelThickness : 0);
            const bottomGeo = new THREE.BoxGeometry(totalWidth, panelThickness, d);
            const bottomMesh = new THREE.Mesh(bottomGeo, facadeMat);
            bottomMesh.position.set(0, -(h / 2) - (panelThickness / 2), 0);
            facadeGroup.add(bottomMesh);

            if (fs.hasThermovall && thermoSides.includes('bottom')) {
                const thGeo = new THREE.BoxGeometry(totalWidth, thermoThickness, d);
                const thMesh = new THREE.Mesh(thGeo, thermoMat);
                thMesh.castShadow = true;
                thMesh.receiveShadow = true;
                thMesh.position.set(0, -(h / 2) - panelThickness - (thermoThickness / 2), 0);
                facadeGroup.add(thMesh);
            }
        }

        console.log("تعداد قطعات ساخته شده برای نما:", facadeGroup.children.length);
        return facadeGroup;
    }


}; // 🔵 این همان علامت پایان آبجکت Kitchen3D است که باید بعد از تابع جدید شما باشد

// تابع واسط برای استفاده در HTML
window.Kitchen3D = Kitchen3D;
(function initKitchen3DThreeDeps() {
    function bind() {
        if (typeof THREE === 'undefined') return;
        if (!Kitchen3D.raycaster) Kitchen3D.raycaster = new THREE.Raycaster();
        if (!Kitchen3D.mouse) Kitchen3D.mouse = new THREE.Vector2();
    }
    if (typeof window.whenThreeReady === 'function') window.whenThreeReady(bind);
    else if (typeof THREE !== 'undefined') bind();
    else window.addEventListener('three-ready', bind, { once: true });
})();

function open3DView() { Kitchen3D.open(); }
function close3DView() { Kitchen3D.close(); }
function toggleLamp(button) { Kitchen3D.toggleCeilingLight(button); }



// --- کنترل دوربین با کیبورد (فلش‌ها) و دکمه‌های روی صفحه ---
let keyboardPanActive = false;



// --- فعال کردن کنترل با کیبورد (فقط فلش‌ها) ---
document.addEventListener('keydown', (event) => {
    // اصلاح مشکل classList با افزودن چکِ null
    const modal3d = document.getElementById('modal-3d');
    if (!modal3d || !modal3d.classList.contains('open')) return; // فقط وقتی 3D بازه و وجود داره


});


// 🌐 تابع اصلی بروزرسانی درب‌ها در محیط سه بعدی
function updateAllCabinetDoorsIn3D() {
    if (!Kitchen3D.scene || !window.allMaterials || !window.allMaterials.mdf) return;

    const mdfList = window.allMaterials.mdf;
    const frameSize = 6.0;

    Kitchen3D.scene.traverse((obj) => {
        if ((obj.isMesh || obj.isGroup) && obj.userData.isDoor) {
            
            const cabinetGroup = obj.parent?.parent;
            if (!cabinetGroup || !cabinetGroup.userData.cabinetData) return;
            const c = cabinetGroup.userData.cabinetData;

            if (c.showDoors === false) {
                obj.visible = false;
                return; 
            } else {
                obj.visible = true;
            }

            const selected = mdfList.find(item => 
                item.code === c.doorColor || item.texture === c.doorColor
            );

            if (selected) {
                const slotIndex = obj.userData.slotIndex || 0;
                
                const applyMaterialToBoxMesh = (targetMesh, forcedLabel = null) => {
                    if (!targetMesh || !targetMesh.isMesh) return;

                    let finalTextureUrl = selected.texture; 
                    let isIsolated = false;

                    // ۱. پیدا کردن نام دقیق قطعه برچسب‌گذاری شده از کات‌مستر
                    if (window.isolatedDoorTextures) {
                        if (forcedLabel) {
                            const matchedKey = Object.keys(window.isolatedDoorTextures).find(key => 
                                key.trim() === forcedLabel.trim()
                            );
                            if (matchedKey) {
                                finalTextureUrl = window.isolatedDoorTextures[matchedKey];
                                isIsolated = true; // تکسچر کراپ شده کات‌مستر پیدا شد
                            }
                        } else {
                            const expectedSnippetDoor = `U${c.id} - درب ${slotIndex + 1}`;
                            const expectedSnippetDrawer = `U${c.id} - کشو ${slotIndex + 1}`;
                            const expectedSnippetComboTop = `U${c.id} - کشو بالا`;
                            const expectedSnippetComboBottom = `U${c.id} - درب پایین ${slotIndex}`;
                            const expectedSnippetJakiGhadi = `U${c.id} - درب جکی`;
                            const expectedSnippetJakiGhadi2 = `U${c.id} - درب قدی`;

                            const matchedKey = Object.keys(window.isolatedDoorTextures).find(key => {
                                if (c.isBaseWithDrawer) {
                                    return slotIndex === 0 
                                        ? key.includes(expectedSnippetComboTop) 
                                        : key.includes(expectedSnippetComboBottom);
                                }
                                return key.includes(expectedSnippetDoor) || 
                                       key.includes(expectedSnippetDrawer) ||
                                       key.includes(expectedSnippetJakiGhadi) ||
                                       key.includes(expectedSnippetJakiGhadi2);
                            });
                            
                            if (matchedKey) {
                                finalTextureUrl = window.isolatedDoorTextures[matchedKey];
                                isIsolated = true;
                            }
                        }
                    }

                    if (finalTextureUrl) {
                        const textureLoader = new THREE.TextureLoader();
                        const frontTex = textureLoader.load(finalTextureUrl);
                        frontTex.colorSpace = THREE.SRGBColorSpace;

                        if (isIsolated) {
                            // فیکس کات‌مستر: بافت باید کاملاً روی قید قفل شود و تکرار نشود
                            frontTex.wrapS = THREE.ClampToEdgeWrapping;
                            frontTex.wrapT = THREE.ClampToEdgeWrapping;
                            frontTex.repeat.set(1, 1);
                            frontTex.offset.set(0, 0);
                        } else {
                            // جهت تکسچر ثابت مثل یونیت معمولی (بدون چرخش ۹۰° بر اساس عرض/ارتفاع)
                            frontTex.wrapS = THREE.RepeatWrapping;
                            frontTex.wrapT = THREE.RepeatWrapping;
                            frontTex.center.set(0.5, 0.5);
                            frontTex.rotation = 0;
                            frontTex.offset.set(0, 0);
                            let geoW = (targetMesh.geometry.parameters && targetMesh.geometry.parameters.width) || 100;
                            let geoH = (targetMesh.geometry.parameters && targetMesh.geometry.parameters.height) || 100;
                            frontTex.repeat.set(
                                Math.max(0.05, geoW / 100),
                                Math.max(0.05, geoH / 100)
                            );
                        }

                        // 🎨 Edge واقعی + پرداخت نور از doorFinish (نه roughness ثابت)
                        const slotFinish = (c.doorSizes && c.doorSizes[slotIndex] && c.doorSizes[slotIndex].doorFinish)
                            ? c.doorSizes[slotIndex].doorFinish
                            : null;
                        const doorFinishKey = slotFinish || c.doorFinish || 'matte';
                        const faces = Kitchen3D.createFaceMaterials({
                            frontMap: frontTex,
                            materialCode: selected.code,
                            edgeColor: selected.edgeColor || (typeof selected.code === 'string' && selected.code.startsWith('#') ? selected.code : null),
                            finishType: doorFinishKey,
                            materialType: doorFinishKey
                        });

                        // همیشه آرایه ۶وجهی Box (پایدار برای نمایش تکسچر)
                        targetMesh.material = faces.boxArray;
                        if (Array.isArray(targetMesh.material)) {
                            targetMesh.material.forEach(m => { if (m) m.needsUpdate = true; });
                        }

                        // 🛠️ فیکس نهایی و قطعی اصلاح مختصات ورتکس‌های جابه‌جا شده‌ی پاسارها
                        if (isIsolated && targetMesh.userData && (targetMesh.userData.partType === 'pasar_top' || targetMesh.userData.partType === 'pasar_bottom')) {
                            const geometry = targetMesh.geometry;
                            const uv = geometry.attributes.uv;
                            const pos = geometry.attributes.position;
                            
                            // به جای تقسیم بر بازار، بر اساس کل محدودهboundingBox رفتار می‌کنیم تا لبه‌های ۴۵ درجه کش نیایند
                            geometry.computeBoundingBox();
                            const minX = geometry.boundingBox.min.x;
                            const maxX = geometry.boundingBox.max.x;
                            const rangeX = maxX - minX;

                            for (let i = 0; i < pos.count; i++) {
                                if (geometry.attributes.normal.getZ(i) > 0.5) {
                                    let u = (pos.getX(i) - minX) / rangeX;
                                    let v = (pos.getY(i) / frameSize) + 0.5;
                                    uv.setXY(i, u, v);
                                }
                            }
                            uv.needsUpdate = true;
                        }

                    } else if (selected.code) {
                        const slotFinish2 = (c.doorSizes && c.doorSizes[slotIndex] && c.doorSizes[slotIndex].doorFinish)
                            ? c.doorSizes[slotIndex].doorFinish
                            : null;
                        const finishKey2 = slotFinish2 || c.doorFinish || 'matte';
                        const faces2 = Kitchen3D.createFaceMaterials({
                            frontColor: selected.code,
                            materialCode: selected.code,
                            finishType: finishKey2,
                            materialType: finishKey2
                        });
                        targetMesh.material = faces2.boxArray;
                    }
                };

                if (obj.isMesh) {
                    applyMaterialToBoxMesh(obj);
                } else if (obj.isGroup) {
                    // تفکیک نام‌ها بر اساس سیستم جدید نام‌گذاری کوتاه شده در collectPieces
                    obj.children.forEach(child => {
                        if (child.userData && child.userData.isFrameMesh) {
                            let pieceLabel = "";
                            if (child.userData.partType === 'pasar_top') {
                                pieceLabel = `U${c.id}-D${slotIndex + 1}-PasarTop`;
                            } else if (child.userData.partType === 'pasar_bottom') {
                                pieceLabel = `U${c.id}-D${slotIndex + 1}-PasarBottom`;
                            } else if (child.userData.partType === 'bao_left') {
                                pieceLabel = `U${c.id}-D${slotIndex + 1}-BaoLeft`;
                            } else if (child.userData.partType === 'bao_right') {
                                pieceLabel = `U${c.id}-D${slotIndex + 1}-BaoRight`;
                            }
                            
                            if (pieceLabel) {
                                applyMaterialToBoxMesh(child, pieceLabel);
                            }
                        }
                    });
                }
            }
        }
    });
}





function updateAllCabinetCrownsIn3D() {
    if (!Kitchen3D.scene) return;

    // 🟢 اصلاح شد: به‌جای محدود کردن جستجو به لیست mdf، همه‌ی دسته‌های متریال (mdf, highGloss, leteron, ...)
// با هم ترکیب می‌شوند تا رنگ/تکسچر تاج برای هر نوع جنسی درست پیدا شود؛ در غیر این صورت مقادیر
// های‌گلاس (که فقط در دسته‌ی highGloss هستند) پیدا نمی‌شدند و به‌اشتباه به‌صورت رنگ مشکی رندر می‌شدند.
const allMaterialsFlat = window.allMaterials
    ? Object.values(window.allMaterials).flat()
    : [];
const mdfList = allMaterialsFlat;
const doorTextures = window.threeDoorTextures || {};

    Kitchen3D.scene.traverse((obj) => {
        if (obj.isMesh && obj.userData.isCrown) {
            // LED تاج را دست نزن
            if (obj.userData.isCrownLed) return;

            const cabinetGroup = obj.parent;
            if (!cabinetGroup || !cabinetGroup.userData.cabinetData) return;
            
            const c = cabinetGroup.userData.cabinetData;
            if (!c.crown || c.crown.enabled === false) {
                obj.visible = false;
                return;
            }
            obj.visible = true;

            const finishKey = (c.crown && c.crown.finish) ? c.crown.finish : 'matte';
            const preset = (typeof window.getKitchenFinishPreset === 'function')
                ? window.getKitchenFinishPreset(finishKey)
                : { roughness: 0.7, metalness: 0.02, envMapIntensity: 0.3, clearcoat: 0 };

            const applyFinishToMat = (mat) => {
                if (!mat || !mat.isMaterial) return;
                mat.roughness = preset.roughness;
                mat.metalness = preset.metalness;
                if (mat.envMapIntensity !== undefined) mat.envMapIntensity = preset.envMapIntensity || 0.3;
                if (!(preset.clearcoat && preset.clearcoat > 0.05) && mat.clearcoat !== undefined) mat.clearcoat = 0;
                mat.needsUpdate = true;
            };
            const applyFinish = () => {
                if (Array.isArray(obj.material)) obj.material.forEach(applyFinishToMat);
                else applyFinishToMat(obj.material);
            };

            // 👑 اولویت طلایی و اصلی: بررسی وجود بافت کراپ‌شده اختصاصی از کات‌مستر
            const pieceLabel = obj.userData.pieceLabel;
            if (pieceLabel && window.isolatedDoorTextures && window.isolatedDoorTextures[pieceLabel]) {
                const loader = new THREE.TextureLoader();
                loader.setCrossOrigin('anonymous');
                const hdTex = loader.load(window.isolatedDoorTextures[pieceLabel]);
                
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => { if (m) { m.map = hdTex; m.color.set(0xffffff); } });
                } else if (obj.material) {
                    obj.material.map = hdTex;
                    obj.material.color.set(0xffffff);
                }
                applyFinish();
                return;
            }

            // 🧩 فالبک‌های بعدی (اگر هنوز کات‌مستر محاسبه نشده بود)
            const crownValue = c.crown.color || c.doorColor || "#8B4513";

            let selected = mdfList.find(item =>
                item.code === crownValue || item.texture === crownValue
            );

            if (selected) {
                if (selected.texture) {
                    const loader = new THREE.TextureLoader();
                    loader.setCrossOrigin('anonymous');
                    loader.load(selected.texture, (tex) => {
                        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                        tex.repeat.set(c.w / 100, (c.crown.height || 6) / 100);
                        tex.colorSpace = THREE.SRGBColorSpace;
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach(m => { if (m) { m.map = tex; m.color.set(0xffffff); } });
                        } else if (obj.material) {
                            obj.material.map = tex;
                            obj.material.color.set(0xffffff);
                        }
                        applyFinish();
                    });
                } else if (selected.code) {
                    const hex = selected.code.replace('#', '');
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => { if (m) { m.map = null; m.color.setHex(parseInt(hex, 16)); } });
                    } else if (obj.material) {
                        obj.material.map = null;
                        obj.material.color.setHex(parseInt(hex, 16));
                    }
                    applyFinish();
                }
            } else {
                if (crownValue.startsWith('assets/') && doorTextures[crownValue]) {
                    const tex = doorTextures[crownValue].clone();
                    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                    tex.repeat.set((c.w + 4) / 80, (c.crown.height || 8) / 80);
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => { if (m) { m.map = tex; m.color.set(0xffffff); } });
                    } else if (obj.material) {
                        obj.material.map = tex;
                        obj.material.color.set(0xffffff);
                    }
                    applyFinish();
                } else {
                    const hex = crownValue.replace('#', '');
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => {
                            if (m) {
                                m.map = null;
                                m.color.setHex(parseInt(hex.length === 8 ? hex.substring(0,6) : hex, 16));
                            }
                        });
                    } else if (obj.material) {
                        obj.material.map = null;
                        obj.material.color.setHex(parseInt(hex.length === 8 ? hex.substring(0,6) : hex, 16));
                    }
                    applyFinish();
                }
            }
        }
    });
}



function updateAllCountertopsIn3D() {
    if (!Kitchen3D || !Kitchen3D.scene) return;

    // ۱. پاکسازی کامل تمام صفحات قبلی از صحنه
    const toRemove = [];
    Kitchen3D.scene.traverse(obj => {
        if (obj.userData && obj.userData.isCountertop) {
            toRemove.push(obj);
        }
    });
    toRemove.forEach(obj => {
        if (obj.parent) obj.parent.remove(obj);
        else Kitchen3D.scene.remove(obj);
    });

    // ۲. رندر کردن صفحات از لیست آرایه (allCountertops)
    // این بخش تمام صفحات مستقل که در پنل اضافه کردید را می‌سازد
    if (typeof allCountertops !== 'undefined') {
        allCountertops.forEach((ct) => {
            if (ct.enabled) {
                // ارسال مختصات پایه 0 چون خود صفحه X و Y داخلی دارد
                createSingleCountertopMesh(ct, 0, 0);
            }
        });
    }

    // ۳. رندر کردن صفحات متصل به کابینت‌ها (اگر سیستم کابینت‌محور هم دارید)
    if (typeof cabinets !== 'undefined') {
        cabinets.forEach(c => {
            if (c.countertop && c.countertop.enabled) {
                // ارسال مختصات کابینت به عنوان پایه
                createSingleCountertopMesh(c.countertop, c.x, c.y);
            }
        });
    }
}


function updateAllShelvesIn3D() {
    if (!Kitchen3D.scene) return;

    Kitchen3D.scene.traverse((obj) => {
        if (obj.isMesh && obj.userData && obj.userData.partType === 'shelf') {
            const pieceLabel = obj.userData.pieceLabel;
            if (!pieceLabel) return;

            // پیدا کردن کلید در مخزن بافت کات‌مستر
            let finalTextureUrl = null;
            if (window.isolatedDoorTextures && window.isolatedDoorTextures[pieceLabel]) {
                finalTextureUrl = window.isolatedDoorTextures[pieceLabel];
            } else if (window.isolatedDoorTextures) {
                const matchedKey = Object.keys(window.isolatedDoorTextures).find(key => key.trim() === pieceLabel.trim());
                if (matchedKey) finalTextureUrl = window.isolatedDoorTextures[matchedKey];
            }

            // پرداخت نور از userData.finish یا cabinet
            const finishKey = obj.userData.shelfFinish || obj.userData.finish || 'matte';
            const preset = (typeof window.getKitchenFinishPreset === 'function')
                ? window.getKitchenFinishPreset(finishKey)
                : { roughness: 0.7, metalness: 0.02, envMapIntensity: 0.3, clearcoat: 0 };

            const applyFinish = (mat) => {
                if (!mat) return;
                mat.roughness = preset.roughness;
                mat.metalness = preset.metalness;
                if (mat.envMapIntensity !== undefined) mat.envMapIntensity = preset.envMapIntensity || 0.3;
                if (!(preset.clearcoat && preset.clearcoat > 0.05) && mat.clearcoat !== undefined) mat.clearcoat = 0;
                mat.needsUpdate = true;
            };

            if (finalTextureUrl) {
                const textureLoader = new THREE.TextureLoader();
                textureLoader.setCrossOrigin('anonymous');
                const tex = textureLoader.load(finalTextureUrl);
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.wrapS = THREE.ClampToEdgeWrapping;
                tex.wrapT = THREE.ClampToEdgeWrapping;

                if (Array.isArray(obj.material)) {
                    obj.material.forEach((mat) => {
                        mat.map = tex;
                        mat.color.set(0xffffff);
                        applyFinish(mat);
                    });
                } else if (obj.material) {
                    obj.material.map = tex;
                    obj.material.color.set(0xffffff);
                    applyFinish(obj.material);
                }
            } else {
                if (Array.isArray(obj.material)) obj.material.forEach(applyFinish);
                else applyFinish(obj.material);
            }
        }
    });
}







// تابع کمکی برای جلوگیری از تکرار کد ساخت Mesh
function createSingleCountertopMesh(settings, x, z) {
    // ---- صفحه واقعی: ضخامت + Edge + Bevel + Cutout + Texture/Roughness ----
    const thickness = parseFloat(settings.thickness) || 3.2;
    const totalLength = parseFloat(settings.length) || 180;
    const totalWidth = parseFloat(settings.width) || 60;

    // پرداخت سطح صفحه (جدا از جنس ورق / رنگ)
    const finishKey = settings.finish || 'matte';
    const preset = (typeof window.getKitchenFinishPreset === 'function')
        ? window.getKitchenFinishPreset(finishKey)
        : { roughness: 0.28, metalness: 0.04, envMapIntensity: 0.5, bumpScale: 0.12, clearcoat: 0 };
    const roughnessTop = settings.roughness !== undefined ? parseFloat(settings.roughness) : preset.roughness;
    const metalnessTop = settings.metalness !== undefined ? parseFloat(settings.metalness) : preset.metalness;

    let cleanLabel = "";
    if (typeof settings.countertopIndex !== 'undefined') {
        cleanLabel = `صفحه کابینت ${settings.countertopIndex + 1} (هوشمند)`;
    } else {
        cleanLabel = (settings.label || settings.name || "").replace('📌', '').trim();
    }

    const configureTexture = (tex, width, length, isIsolated = false) => {
        // راه ورق در راستای طول صفحه
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.center.set(0.5, 0.5);
        tex.offset.set(0, 0);
        // چرخش ۹۰° تا دانه‌بندی افقی تصویر روی طول صفحه بیفتد (نه روی عرض ۶۰)
        tex.rotation = Math.PI / 2;
        tex.repeat.set(1, 1);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
    };


    // متریال رویه با پرداخت نور
    let topMat;
    if (preset.clearcoat && preset.clearcoat > 0.05 && typeof THREE.MeshPhysicalMaterial === 'function') {
        topMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: metalnessTop,
            roughness: roughnessTop,
            clearcoat: preset.clearcoat,
            clearcoatRoughness: preset.clearcoatRoughness || 0.05,
            envMapIntensity: preset.envMapIntensity || 0.5
        });
    } else {
        topMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: metalnessTop,
            roughness: roughnessTop,
            envMapIntensity: preset.envMapIntensity || 0.5
        });
    }
    // متریال لبه صفحه — کمی تیره‌تر و خشن‌تر
    const edgeMat = new THREE.MeshStandardMaterial({
        color: 0xd8d2c8,
        metalness: 0.02,
        roughness: Math.min(0.85, roughnessTop + 0.35)
    });
    const bottomMat = new THREE.MeshStandardMaterial({
        color: 0xe8e4de,
        metalness: 0.0,
        roughness: 0.7
    });

    const applyMapToTop = (tex, isIsolated) => {
        configureTexture(tex, totalWidth, totalLength, isIsolated);
        topMat.map = tex;
        topMat.color.set(0xffffff);
        // Bump از همان تکسچر → حس برجستگی سطح بدون نیاز به normal map جدا
        topMat.bumpMap = (typeof window.asDataMapTexture === 'function') ? window.asDataMapTexture(tex) : tex;
        topMat.bumpScale = 0.12;
        topMat.needsUpdate = true;
        // لبه بدون map رویه
        edgeMat.map = null;
        edgeMat.needsUpdate = true;
    };

    if (cleanLabel && window.isolatedDoorTextures && window.isolatedDoorTextures[cleanLabel]) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        const hdTex = loader.load(window.isolatedDoorTextures[cleanLabel], (tex) => {
            applyMapToTop(tex, true);
        });
        topMat.map = hdTex;
        topMat.bumpMap = (typeof window.asDataMapTexture === 'function') ? window.asDataMapTexture(hdTex) : hdTex;
        topMat.bumpScale = 0.12;
    } else {
        const colorValue = settings.color || "#ffffff";
        if (typeof colorValue === 'string' && (colorValue.startsWith("http") || colorValue.startsWith("assets/") || colorValue.includes('/'))) {
            const loader = new THREE.TextureLoader();
            loader.setCrossOrigin('anonymous');
            const texture = loader.load(colorValue, (tex) => {
                applyMapToTop(tex, false);
            });
            topMat.map = texture;
            topMat.bumpMap = (typeof window.asDataMapTexture === 'function') ? window.asDataMapTexture(texture) : texture;
            topMat.bumpScale = 0.12;
        } else if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
            topMat.map = null;
            topMat.bumpMap = null;
            topMat.color.set(colorValue);
            // لبه کمی تیره‌تر از رنگ رویه
            try {
                const c = new THREE.Color(colorValue);
                c.multiplyScalar(0.82);
                edgeMat.color.copy(c);
            } catch (e) { /* ignore */ }
        } else {
            topMat.color.set(0xffffff);
        }
    }

    let finalZ = z;
    if (settings.enabled && typeof currentCabinetForCountertop !== 'undefined' && !currentCabinetForCountertop) {
        finalZ = totalWidth / 2;
    }

    const mainGroup = new THREE.Group();
    mainGroup.position.set(x, settings.height, finalZ);

    const rotationDeg = settings.rotation || 0;
    mainGroup.rotation.y = THREE.MathUtils.degToRad(-rotationDeg);
    mainGroup.userData.isCountertop = true;
    Kitchen3D.scene.add(mainGroup);

    let geometry;
    let material;
    const hasSink = settings.sink && settings.sink.enabled;
    // گردی لبه صفحه واقعی (حدود ۳–۴ میلی‌متر قابل‌مشاهده روی جلو/عقب)
    const bevelSize = Math.min(0.45, Math.max(0.28, thickness * 0.12));
    const bevelThickness = Math.min(0.4, Math.max(0.25, thickness * 0.1));

    const fixExtrudeUVs = (geo) => {
        geo.computeBoundingBox();
        const bbox = geo.boundingBox;
        const sizeX = Math.max(0.001, bbox.max.x - bbox.min.x);
        const sizeZ = Math.max(0.001, bbox.max.z - bbox.min.z);
        const uvAttribute = geo.attributes.uv;
        const posAttribute = geo.attributes.position;
        if (!uvAttribute || !posAttribute) return;
        // UV پایه: U←طول ، V←عرض — جهت راه ورق با tex.rotation در configureTexture
        for (let i = 0; i < posAttribute.count; i++) {
            const xPos = posAttribute.getX(i);
            const zPos = posAttribute.getZ(i);
            const u = (xPos - bbox.min.x) / sizeX;
            const v = (zPos - bbox.min.z) / sizeZ;
            uvAttribute.setXY(i, u, v);
        }
        uvAttribute.needsUpdate = true;
    };

    // همیشه Extrude + Bevel تا لبه جلو/عقب گرد دیده شود (نه Box تیز)
    const shape = new THREE.Shape();
    shape.moveTo(-totalLength / 2, -totalWidth / 2);
    shape.lineTo(totalLength / 2, -totalWidth / 2);
    shape.lineTo(totalLength / 2, totalWidth / 2);
    shape.lineTo(-totalLength / 2, totalWidth / 2);
    shape.closePath();

    if (hasSink) {
        const sWidth = settings.sink.width || 80;
        const sDepth = settings.sink.depth || 50;
        const holeX = settings.sink.x || 0;
        const holeY = settings.sink.y || 0;

        const holePath = new THREE.Path();
        const hLeft = -totalLength / 2 + holeX;
        const hTop = -totalWidth / 2 + holeY;
        holePath.moveTo(hLeft, hTop);
        holePath.lineTo(hLeft + sWidth, hTop);
        holePath.lineTo(hLeft + sWidth, hTop + sDepth);
        holePath.lineTo(hLeft, hTop + sDepth);
        holePath.closePath();
        shape.holes.push(holePath);
    }

    // ExtrudeGeometry r186: bevel لبه جلو/عقب صفحه — API بدون تغییر
    geometry = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelSegments: 4,
        curveSegments: 4
    });
    geometry.rotateX(Math.PI / 2);
    geometry.translate(0, thickness / 2, 0);
    fixExtrudeUVs(geometry);
    // رویه + لبه با همان متریال رویه تا تکسچر پایدار بماند
    material = topMat;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.renderOrder = 2;
    mesh.userData.isCountertop = true;
    mainGroup.add(mesh);

    // --- بخش گاز در ۳بعدی ---
    if (settings.gas && settings.gas.enabled) {
        const gW = settings.gas.width || 60; const gD = settings.gas.depth || 50;
        const gTopHeight = 1.5; const gUnderDepth = 5;
        const gMatType = settings.gas.materialType || "steel";
        const bCount = settings.gas.burnerType || 5;

        const gasGroup = new THREE.Group();
        const gasMat = new THREE.MeshStandardMaterial({ 
            color: gMatType === "glass" ? 0x050505 : 0x999999, 
            metalness: gMatType === "glass" ? 0.9 : 0.6, roughness: gMatType === "glass" ? 0.05 : 0.3
        });

        const topMesh = new THREE.Mesh(new THREE.BoxGeometry(gW, gTopHeight, gD), gasMat); topMesh.position.set(0, gTopHeight/2, 0); gasGroup.add(topMesh);
        const underMesh = new THREE.Mesh(new THREE.BoxGeometry(gW - 4, gUnderDepth, gD - 4), new THREE.MeshStandardMaterial({ color: 0x222222 })); underMesh.position.set(0, -gUnderDepth/2, 0); gasGroup.add(underMesh);

        const knobGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 16);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
        const knobSpacing = (gW * 0.6) / (bCount > 1 ? bCount - 1 : 1);
        const startKnobX = -(bCount - 1) * knobSpacing / 2;

        for (let i = 0; i < bCount; i++) {
            const knob = new THREE.Mesh(knobGeo, knobMat); knob.position.set(startKnobX + (i * knobSpacing), gTopHeight + 0.3, gD/2 - 4); gasGroup.add(knob);
        }

        let burnerPositions = [];
        if (bCount === 2) burnerPositions = [{x:-0.2, z:0}, {x:0.2, z:0}];
        else if (bCount === 3) burnerPositions = [{x:-0.25, z:0}, {x:0, z:0}, {x:0.25, z:0}];
        else if (bCount === 4) burnerPositions = [{x:-0.25, z:-0.2}, {x:0.25, z:-0.2}, {x:-0.25, z:0.2}, {x:0.25, z:0.2}];
        else burnerPositions = [{x:-0.25, z:-0.25}, {x:0.25, z:-0.25}, {x:0, z:0}, {x:-0.25, z:0.25}, {x:0.25, z:0.25}];

        const burnerBaseMat = new THREE.MeshStandardMaterial({ color: 0x333333 }); 
        const burnerCapMat = new THREE.MeshStandardMaterial({ color: gMatType === "glass" ? 0xaaaaaa : 0x000000 }); 

        burnerPositions.forEach(p => {
            const base = new THREE.Mesh(new THREE.CylinderGeometry(gW/12, gW/11, 1.5, 32), burnerBaseMat); base.position.set(p.x * gW, gTopHeight + 0.6, p.z * gD); gasGroup.add(base);
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(gW/14, gW/14, 0.5, 32), burnerCapMat); cap.position.set(p.x * gW, gTopHeight + 1.4, p.z * gD); gasGroup.add(cap);
        });

        const savedGasRot = settings.gas.rotation !== undefined ? settings.gas.rotation : (typeof gasRotation !== 'undefined' ? gasRotation : 0);
        gasGroup.rotation.y = THREE.MathUtils.degToRad(savedGasRot);

        gasGroup.position.set(
            -(totalLength/2) + (settings.gas.x || 0) + gW/2, 
            (thickness / 2), 
            -(totalWidth/2) + (settings.gas.y || 0) + gD/2
        );
        
        gasGroup.traverse(obj => { if(obj.isMesh) obj.renderOrder = 3; obj.userData.isCountertop = true; });
        mainGroup.add(gasGroup);
    }

    // --- بخش سینک ---
    if (settings.sink && settings.sink.enabled) {
        const sWidth = settings.sink.width || 80; const sDepth = settings.sink.depth || 50; const sHeight = 15;
        const sinkGroup = new THREE.Group();
        
        const sMatType = settings.sink.materialType || "steel";
        const sModel = settings.sink.modelType || "single";
        const sDir = settings.sink.direction || "right";

        let sinkColor = 0xcccccc; let sinkRoughness = 0.2; let sinkMetalness = 1.0;
        if (sMatType === "black") { sinkColor = 0x222222; sinkRoughness = 0.4; sinkMetalness = 0.8; } 
        else if (sMatType === "white") { sinkColor = 0xeeeeee; sinkRoughness = 0.1; sinkMetalness = 0.1; }

        const sinkMat = new THREE.MeshStandardMaterial({ color: sinkColor, metalness: sinkMetalness, roughness: sinkRoughness });
        const hasTray = sModel.includes("tray"); const isDouble = sModel.includes("double");

        const rimW = 1.5; const rimH = 0.3; 
        const backRim = new THREE.Mesh(new THREE.BoxGeometry(sWidth + (rimW*2), rimH, rimW), sinkMat); backRim.position.set(0, rimH / 2, -sDepth / 2 - rimW / 2); backRim.renderOrder = 3; sinkGroup.add(backRim);
        const frontRim = new THREE.Mesh(new THREE.BoxGeometry(sWidth + (rimW*2), rimH, rimW), sinkMat); frontRim.position.set(0, rimH / 2, sDepth / 2 + rimW / 2); frontRim.renderOrder = 3; sinkGroup.add(frontRim);
        const leftRim = new THREE.Mesh(new THREE.BoxGeometry(rimW, rimH, sDepth), sinkMat); leftRim.position.set(-sWidth / 2 - rimW / 2, rimH / 2, 0); leftRim.renderOrder = 3; sinkGroup.add(leftRim);
        const rightRim = new THREE.Mesh(new THREE.BoxGeometry(rimW, rimH, sDepth), sinkMat); rightRim.position.set(sWidth / 2 + rimW / 2, rimH / 2, 0); rightRim.renderOrder = 3; sinkGroup.add(rightRim);

        const deckDepth = 8;
        const deck = new THREE.Mesh(new THREE.BoxGeometry(sWidth, 2, deckDepth), sinkMat); deck.position.set(0, -1, -sDepth/2 + deckDepth/2); sinkGroup.add(deck);

        const basinAreaDepth = sDepth - deckDepth; const basinAreaZ = -sDepth/2 + deckDepth + basinAreaDepth/2;
        let trayWidth = 0; let bowlAreaWidth = sWidth; let trayX = 0; let bowlCenterX = 0;

        if (hasTray) {
            trayWidth = sWidth * 0.4; bowlAreaWidth = sWidth * 0.6;
            if (sDir === "left") { trayX = (sWidth / 2) - (trayWidth / 2); bowlCenterX = -(sWidth / 2) + (bowlAreaWidth / 2); } 
            else { trayX = -(sWidth / 2) + (trayWidth / 2); bowlCenterX = (sWidth / 2) - (bowlAreaWidth / 2); }
            const tray = new THREE.Mesh(new THREE.BoxGeometry(trayWidth, 2, basinAreaDepth), sinkMat); tray.position.set(trayX, -1, basinAreaZ); sinkGroup.add(tray);
        }

        const bWallThick = 1;
        const bFloor = new THREE.Mesh(new THREE.BoxGeometry(bowlAreaWidth, bWallThick, basinAreaDepth), sinkMat); bFloor.position.set(bowlCenterX, -sHeight, basinAreaZ); sinkGroup.add(bFloor);
        const bLeft = new THREE.Mesh(new THREE.BoxGeometry(bWallThick, sHeight, basinAreaDepth), sinkMat); bLeft.position.set(bowlCenterX - bowlAreaWidth/2 + bWallThick/2, -sHeight/2, basinAreaZ); sinkGroup.add(bLeft);
        const bRight = new THREE.Mesh(new THREE.BoxGeometry(bWallThick, sHeight, basinAreaDepth), sinkMat); bRight.position.set(bowlCenterX + bowlAreaWidth/2 - bWallThick/2, -sHeight/2, basinAreaZ); sinkGroup.add(bRight);
        const bFront = new THREE.Mesh(new THREE.BoxGeometry(bowlAreaWidth, sHeight, bWallThick), sinkMat); bFront.position.set(bowlCenterX, -sHeight/2, basinAreaZ + basinAreaDepth/2 - bWallThick/2); sinkGroup.add(bFront);
        const bBack = new THREE.Mesh(new THREE.BoxGeometry(bowlAreaWidth, sHeight, bWallThick), sinkMat); bBack.position.set(bowlCenterX, -sHeight/2, basinAreaZ - basinAreaDepth/2 + bWallThick/2); sinkGroup.add(bBack);

        if (isDouble) {
            const dividerThick = 3.5;
            const divider = new THREE.Mesh(new THREE.BoxGeometry(dividerThick, sHeight, basinAreaDepth), sinkMat); divider.position.set(bowlCenterX, -sHeight/2, basinAreaZ); sinkGroup.add(divider);
        }
        
        const faucetGroup = new THREE.Group();
        const faucetMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.1 }); 

        const fBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1, 32), faucetMat); fBase.position.y = 0.5; faucetGroup.add(fBase);
        const fBody = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 22, 32), faucetMat); fBody.position.y = 12; faucetGroup.add(fBody);
        const fTopJoint = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 16), faucetMat); fTopJoint.position.y = 23; faucetGroup.add(fTopJoint);
        const fArm = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 18, 32), faucetMat); fArm.rotation.x = Math.PI / 2; fArm.position.set(0, 23, 9); faucetGroup.add(fArm);
        const fFrontJoint = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 16), faucetMat); fFrontJoint.position.set(0, 23, 18); faucetGroup.add(fFrontJoint);
        const fNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 3, 32), faucetMat); fNozzle.position.set(0, 21.5, 18); faucetGroup.add(fNozzle);

        const handleGroup = new THREE.Group();
        const hBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2, 16), faucetMat); hBase.rotation.z = Math.PI / 2; hBase.position.set(1.5, 0, 0); handleGroup.add(hBase);
        const hLever = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 16), faucetMat); hLever.position.set(2.5, 2.5, 0); hLever.rotation.z = -Math.PI / 8; handleGroup.add(hLever);
        handleGroup.position.set(0, 6, 0); faucetGroup.add(handleGroup);
        faucetGroup.position.set(bowlCenterX, 0, -sDepth/2 + 4); sinkGroup.add(faucetGroup);

        const savedSinkRot = settings.sink.rotation !== undefined ? settings.sink.rotation : (typeof sinkRotation !== 'undefined' ? sinkRotation : 0);
        sinkGroup.rotation.y = THREE.MathUtils.degToRad(-savedSinkRot);
        
        sinkGroup.position.set(
            -(totalLength/2) + (settings.sink.x || 0) + sWidth/2, 
            (thickness / 2), 
            -(totalWidth/2) + (settings.sink.y || 0) + sDepth/2
        );

        sinkGroup.traverse(obj => { if(obj.isMesh && obj.parent === faucetGroup) obj.renderOrder = 3; obj.userData.isCountertop = true; });
        mainGroup.add(sinkGroup);
    }
}






// تابع ساخت مدل سه بعدی یخچال
function createFridge3D(cabinet) {
    // ایجاد یک گروه برای قرار دادن بدنه، درب‌ها و دستگیره‌ها در آن
    const fridgeGroup = new THREE.Group();

    // ابعاد پایه
    const w = cabinet.w; // عرض
    const h = cabinet.h; // ارتفاع
    const d = cabinet.d || 70; // عمق (اگر مقدار نداشت 70 در نظر بگیر)
    const doorCount = cabinet.doors || 1;

    // متریال‌ها (ظاهر استیل/نقره‌ای برای بدنه و درب‌ها)
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x9ca3af, // خاکستری
        metalness: 0.4, 
        roughness: 0.6 
    });
    const doorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xe2e8f0, // نقره‌ای روشن‌تر برای درب
        metalness: 0.6, 
        roughness: 0.3 
    });
    const handleMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e293b, // تیره برای دستگیره
        metalness: 0.8, 
        roughness: 0.2 
    });

    // 1. ساخت بدنه اصلی یخچال
    const bodyGeo = new THREE.BoxGeometry(w, h, d - 4); // عمق کمتر برای جا دادن درب
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    // قرار دادن مرکز بدنه به گونه‌ای که کف آن روی زمین (y=0) قرار بگیرد
    bodyMesh.position.set(0, h / 2, -(d - 4) / 2); 
    fridgeGroup.add(bodyMesh);

    // ضخامت درب
    const doorDepth = 4;
    const doorZ = 0; // موقعیت Z درب‌ها (جلوی یخچال)

    // 2. ساخت درب‌ها بر اساس مدل انتخابی
    if (doorCount === 1) {
        // --- مدل تک درب (فریزر بالا، یخچال پایین) ---
        
        // ابعاد
        const freezerH = h * 0.3; // 30% ارتفاع برای فریزر
        const fridgeH = h * 0.7 - 2; // 70% برای یخچال (منهای 2 سانت فاصله)

        // درب فریزر (بالا)
        const freezerGeo = new THREE.BoxGeometry(w - 2, freezerH, doorDepth);
        const freezerMesh = new THREE.Mesh(freezerGeo, doorMaterial);
        freezerMesh.position.set(0, h - (freezerH / 2) - 1, doorZ);
        fridgeGroup.add(freezerMesh);

        // دستگیره فریزر
        const fHandleGeo = new THREE.BoxGeometry(2, freezerH * 0.5, 3);
        const fHandleMesh = new THREE.Mesh(fHandleGeo, handleMaterial);
        fHandleMesh.position.set((w / 2) - 5, h - (freezerH / 2) - 1, doorZ + 2);
        fridgeGroup.add(fHandleMesh);

        // درب یخچال (پایین)
        const fridgeGeo = new THREE.BoxGeometry(w - 2, fridgeH, doorDepth);
        const fridgeMesh = new THREE.Mesh(fridgeGeo, doorMaterial);
        fridgeMesh.position.set(0, (fridgeH / 2) + 1, doorZ);
        fridgeGroup.add(fridgeMesh);

        // دستگیره یخچال
        const rHandleGeo = new THREE.BoxGeometry(2, fridgeH * 0.4, 3);
        const rHandleMesh = new THREE.Mesh(rHandleGeo, handleMaterial);
        rHandleMesh.position.set((w / 2) - 5, (fridgeH / 2) + 10, doorZ + 2);
        fridgeGroup.add(rHandleMesh);

    } else {
        // --- مدل دو درب (ساید بای ساید) ---
        
        const doorW = (w / 2) - 1.5; // عرض هر درب (با کمی فاصله در وسط)
        const doorH = h - 2; // ارتفاع درب

        // درب چپ (معمولاً فریزر)
        const leftDoorGeo = new THREE.BoxGeometry(doorW, doorH, doorDepth);
        const leftDoorMesh = new THREE.Mesh(leftDoorGeo, doorMaterial);
        leftDoorMesh.position.set(-(w / 4) - 0.5, h / 2, doorZ);
        fridgeGroup.add(leftDoorMesh);

        // درب راست (یخچال)
        const rightDoorGeo = new THREE.BoxGeometry(doorW, doorH, doorDepth);
        const rightDoorMesh = new THREE.Mesh(rightDoorGeo, doorMaterial);
        rightDoorMesh.position.set((w / 4) + 0.5, h / 2, doorZ);
        fridgeGroup.add(rightDoorMesh);

        // دستگیره‌های ساید بای ساید (در مرکز)
        const handleH = h * 0.4;
        const sHandleGeo = new THREE.BoxGeometry(2, handleH, 3);
        
        const leftHandle = new THREE.Mesh(sHandleGeo, handleMaterial);
        leftHandle.position.set(-3, h / 2, doorZ + 2);
        fridgeGroup.add(leftHandle);

        const rightHandle = new THREE.Mesh(sHandleGeo, handleMaterial);
        rightHandle.position.set(3, h / 2, doorZ + 2);
        fridgeGroup.add(rightHandle);
    }

    // بازگرداندن کل گروه ساخته شده
    return fridgeGroup;
}
