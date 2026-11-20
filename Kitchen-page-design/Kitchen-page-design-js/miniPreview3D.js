
const UnitMiniPreview = {
    container: null,
    renderer: null,
    scene: null,
    camera: null,
    currentUnitGroup: null,
    animationId: null,
    isInitialized: false,

    init: function(containerId, canvasId) {
        if (this.isInitialized) return;

        if (typeof THREE === 'undefined') {
            const self = this, args = arguments;
            if (typeof window.whenThreeReady === 'function') {
                window.whenThreeReady(function () { self.init.apply(self, args); });
            } else {
                window.addEventListener('three-ready', function onR() {
                    window.removeEventListener('three-ready', onR);
                    self.init.apply(self, args);
                });
            }
            return;
        }

        this.container = document.getElementById(containerId);
        const canvas = document.getElementById(canvasId);
        
        // ابعاد بوم را بر اساس کانتینر تنظیم می‌کنیم
        const width = canvas.clientWidth || 250;
        const height = canvas.clientHeight || 222;

        // alpha: true را نگه می‌داریم اما بک‌گراند صحنه را هم مقداردهی می‌کنیم
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        this.scene = new THREE.Scene();
        // یک پس‌زمینه طوسی بسیار روشن می‌گذاریم تا کابینت‌های سفید رنگ در پس‌زمینه سفید گم نشوند
        this.scene.background = new THREE.Color(0xf5f5f5); 
        
        // far را روی 5000 گذاشتیم چون اگر ابعاد میلی‌متری باشد دوربین باید برد بیشتری داشته باشد
        this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
        this.camera.position.set(100, 100, 150);
        this.camera.lookAt(0, 0, 0);

        // نورپردازی برای بهتر دیده شدن جزئیات
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight.position.set(500, 1000, 500);
        this.scene.add(dirLight);

        this.currentUnitGroup = new THREE.Group();
        this.scene.add(this.currentUnitGroup);

        this.isInitialized = true;
        this.animate();
    },

    // تابع نمایش دادن باکس پیش‌نمایش
    show: function() {
        if (this.container) {
            this.container.style.display = 'block';
            
            // ⚠️ بسیار مهم: وقتی از حالت display: none خارج می‌شود، سایز کانتینر تغییر می‌کند 
            // پس باید ابعاد رندر و دوربین را حتماً اینجا آپدیت کنیم تا صفحه سفید یا کشیده نشود
            const width = this.container.clientWidth || 250;
            const height = this.container.clientHeight || 222;
            this.renderer.setSize(width, height, false);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    },

    // تابع مخفی کردن باکس پیش‌نمایش
    hide: function() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    },

                  updatePreview: function(unitData) {
    if (!unitData) return;
    
    // ۱. پاک کردن مدل قبلی از صحنه مینی‌نمایش
    while(this.currentUnitGroup.children.length > 0){ 
        this.currentUnitGroup.remove(this.currentUnitGroup.children[0]);
    }

    // بررسی و ساخت صحنه سه‌بعدی در صورت نیاز
    if (window.Kitchen3D) {
        if (!Kitchen3D.scene) {
            Kitchen3D.scene = new THREE.Scene();
        }

        // 🟢 اصلاح شد: توابع اصلی لود و رفرش کابینت‌ها باید همیشه صدا زده شوند
        // تا صحنه اصلی بتواند هر ۴ کابینت را بسازد و رندر کند.
        try {
            if (typeof Kitchen3D.refreshCabinets === 'function') {
                Kitchen3D.refreshCabinets(); 
            } else if (typeof Kitchen3D.renderCabinets === 'function') {
                Kitchen3D.renderCabinets();
            }
        } catch (e) {
            console.warn("خطا در رفرش کابینت‌های صحنه اصلی:", e);
        }
    }

    // ۲. پیدا کردن کابینت در صحنه اصلی
    if (window.Kitchen3D && Kitchen3D.scene) {
        let realCabinet = null;
        const targetId = parseInt(unitData.id);

        // ایمن‌سازی traverse برای جلوگیری از ارور
        Kitchen3D.scene.traverse((obj) => {
            if (obj && obj.userData && obj.userData.isCabinet && obj.userData.cabinetData) {
                if (parseInt(obj.userData.cabinetData.id) === targetId) {
                    realCabinet = obj;
                }
            }
        });

        // اگر مدل پیدا شد، کارهای کلون و پیش‌نمایش را انجام بده
        if (realCabinet) {
            // ... بقیه کدهای مربوط به کلون کردن و باکس زدن (بدون تغییر) ...
            const userDataBackup = new Map();
            realCabinet.traverse((child) => {
                if (child) {
                    userDataBackup.set(child, child.userData);
                    child.userData = {}; 
                }
            });

            const unitMesh = realCabinet.clone(true);

            realCabinet.traverse((child) => {
                if (child) child.userData = userDataBackup.get(child);
            });

            unitMesh.position.set(0, 0, 0);
            unitMesh.rotation.set(0, 0, 0);
            if (unitMesh.quaternion) unitMesh.quaternion.identity(); 
            unitMesh.scale.set(1, 1, 1);
            unitMesh.updateMatrixWorld(true);

            const box = new THREE.Box3().setFromObject(unitMesh);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            if (size.x === 0 || size.y === 0 || size.z === 0) return;

            unitMesh.position.set(-center.x, -center.y, -center.z);
            this.currentUnitGroup.add(unitMesh);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = this.camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 1.5; 

            this.camera.position.set(maxDim * 0.9, maxDim * 0.8, cameraZ);
            this.camera.lookAt(0, 0, 0);
            
            this.scene.children.forEach(child => {
                if (child && child.isDirectionalLight) {
                    child.position.set(maxDim * 1.5, maxDim * 2, maxDim * 1.5);
                }
            });

            this.camera.updateProjectionMatrix();
            this.renderer.render(this.scene, this.camera);

        } else {
            // 🟢 اگر کابینت هنوز در صحنه اصلی ساخته نشده، کمی صبر میکنیم و دوباره تلاش میکنیم
            setTimeout(() => {
                if (!this.isRetrying) {
                    this.isRetrying = true;
                    this.updatePreview(unitData);
                    this.isRetrying = false;
                }
            }, 50); // ۵۰ میلی‌ثانیه فرصت به سیستم برای ساخت مدل در صحنه اصلی
        }
    }
},






    animate: function() {
        this.animationId = requestAnimationFrame(() => this.animate());
        // چرخش ملایم برای زیبایی (در صورت تمایل از کامنت خارج کنید)
        // this.currentUnitGroup.rotation.y += 0.005;
        this.renderer.render(this.scene, this.camera);
    }
};

// اجرای خودکار تابع آماده‌سازی به محض لود شدن صفحه
window.addEventListener('DOMContentLoaded', () => {
    // آیدی‌های HTML را به تابع می‌فرستیم تا متصل شوند
    UnitMiniPreview.init('mini-preview-container', 'unit-preview-canvas');
});
