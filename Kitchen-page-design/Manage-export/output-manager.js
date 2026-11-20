// output-manager.js — خروجی Babylon با کاتالوگ کدگذاری‌شده (یونیت/تکسچر/انیمیشن)

const OutputManager = {

    _sanitizeUserDataForGLTF: function (ud) {
        ud = ud || {};
        const out = {};
        const keys = [
            'isDoor', 'isDrawer', 'isHinge', 'isDoorGroup', 'isDoorPart',
            'isCountertop', 'isCrown', 'isKickboard', 'isGlass', 'isCabinet',
            'axis', 'hingeSide', 'openDirection', 'closedZ', 'openZ', 'openDistance',
            'isOpen', 'hingeId', 'slotIndex', 'cabinetId', 'maxAngle', 'targetOpenAngle', 'exportCode'
        ];
        keys.forEach(function (k) {
            if (ud[k] === undefined || ud[k] === null) return;
            const t = typeof ud[k];
            if (t === 'string' || t === 'number' || t === 'boolean') out[k] = ud[k];
        });
        return out;
    },

    _isOuterEnvNode: function (node) {
        if (!node) return true;
        try {
            const md = node.metadata || {};
            if (md.excludeFromExport || md.isOuterEnv) return true;
        } catch (e) {}
        const n = (node.name || '').toLowerCase();
        if (!n) return false;
        if (n.indexOf('outer') >= 0) return true;
        try {
            const mat = node.material;
            if (mat && mat.name) {
                const mn = String(mat.name).toLowerCase();
                if (mn === 'parquet' || mn.indexOf('outer') >= 0) return true;
            }
        } catch (e) {}
        return false;
    },

    /**
     * استخراج dataURL از DynamicTexture یا Texture
     */
    _textureToDataUrl: function (tex) {
        if (!tex) return null;
        try {
            try { if (tex.update) tex.update(true); } catch (e) {}
            if (tex.getContext) {
                const ctx = tex.getContext();
                if (ctx && ctx.canvas) {
                    const url = ctx.canvas.toDataURL('image/png');
                    if (url && url.indexOf('data:image') === 0) return url;
                }
            }
            if (tex.url && String(tex.url).indexOf('data:image') === 0) return tex.url;
        } catch (e) {
            console.warn('[OutputManager] _textureToDataUrl', e);
        }
        return null;
    },

    /**
     * ساخت کاتالوگ کامل صحنه: کد یکتا برای هر مش/تکسچر/درب/کشو
     */
    _buildSceneCatalog: function (scene, interiorMeshes) {
        const catalog = {
            version: 2,
            textures: {},
            meshes: {},
            interactives: []
        };
        let texSeq = 0;
        let meshSeq = 0;
        let doorSeq = 0;
        let drawerSeq = 0;
        const texKeyByData = {}; // dataUrl hash short -> code (dedupe)

        function ensureTexCode(tex, hint) {
            if (!tex) return null;
            const dataUrl = OutputManager._textureToDataUrl(tex);
            if (!dataUrl) return null;
            const sig = dataUrl.length + '_' + dataUrl.slice(32, 64);
            if (texKeyByData[sig]) return texKeyByData[sig];
            const code = 'TEX_' + (hint || 'img') + '_' + (texSeq++);
            catalog.textures[code] = {
                code: code,
                dataUrl: dataUrl,
                uScale: tex.uScale != null ? tex.uScale : 1,
                vScale: tex.vScale != null ? tex.vScale : 1,
                uOffset: tex.uOffset != null ? tex.uOffset : 0,
                vOffset: tex.vOffset != null ? tex.vOffset : 0
            };
            texKeyByData[sig] = code;
            return code;
        }

        // مش‌های داخلی
        for (let i = 0; i < interiorMeshes.length; i++) {
            const m = interiorMeshes[i];
            if (!m) continue;
            const name = m.name || ('mesh_' + i);
            const code = 'M_' + meshSeq++;
            const md = m.metadata || {};
            let role = 'part';
            const ln = name.toLowerCase();
            if (ln === 'floor' || md.isFloor) role = 'floor';
            else if (ln === 'ceiling' || md.isCeiling || ln.indexOf('cornice') === 0) role = 'ceiling';
            else if (ln.indexOf('wall') >= 0 || md.isWall) role = 'wall';
            else if (md.isDoor || md.isDoorPart) role = 'door';
            else if (md.isDrawer) role = 'drawer';

            let texCode = null;
            try {
                if (m.material) {
                    const mat = m.material;
                    if (mat.subMaterials && mat.subMaterials[0]) {
                        texCode = ensureTexCode(mat.subMaterials[0].diffuseTexture || mat.subMaterials[0].albedoTexture, role);
                    } else {
                        texCode = ensureTexCode(mat.diffuseTexture || mat.albedoTexture, role);
                    }
                }
            } catch (e) {}

            catalog.meshes[name] = {
                code: code,
                name: name,
                role: role,
                texCode: texCode,
                isDoor: !!(md.isDoor || md.isDoorPart),
                isDrawer: !!md.isDrawer,
                hingeId: md.hingeId || null,
                openDirection: md.openDirection != null ? Number(md.openDirection) : null,
                axis: md.axis || null,
                maxAngle: md.maxAngle != null ? Number(md.maxAngle) : null,
                closedZ: md.closedZ != null ? Number(md.closedZ) : null,
                openZ: md.openZ != null ? Number(md.openZ) : null
            };

            // کد روی metadata برای بقا در GLB extras
            try {
                m.metadata = Object.assign({}, md, {
                    exportCode: code,
                    texCode: texCode || undefined
                });
            } catch (e) {}
        }

        // انیمیشن‌ها از TransformNode + مش — با لیست نام مش‌های قابل کلیک
        function collectMeshNamesUnder(root) {
            const names = [];
            if (!root) return names;
            try {
                if (root.getChildMeshes) {
                    const kids = root.getChildMeshes(true);
                    for (let k = 0; k < kids.length; k++) {
                        if (kids[k] && kids[k].name) names.push(kids[k].name);
                    }
                }
            } catch (e) {}
            if (root.getVerticesData && root.name) names.push(root.name);
            return names;
        }

        function findHingeNode(hingeId, hingeName, hingeNodeRef) {
            if (hingeNodeRef && hingeNodeRef.name) return hingeNodeRef;
            const all = (scene.transformNodes || []).concat(scene.meshes || []);
            for (let i = 0; i < all.length; i++) {
                if (hingeName && all[i].name === hingeName) return all[i];
            }
            for (let i = 0; i < all.length; i++) {
                if (hingeId && all[i].name === hingeId) return all[i];
            }
            for (let i = 0; i < all.length; i++) {
                const md = all[i].metadata || {};
                if (hingeId && md.hingeId === hingeId && (md.isHinge || md.isDoorGroup)) return all[i];
            }
            return null;
        }

        const nodes = (scene.transformNodes || []).concat(scene.meshes || []);
        const seenHinge = {};
        const seenDrawer = {};

        // اول همه لولاها را از TransformNode جمع کن
        for (let i = 0; i < (scene.transformNodes || []).length; i++) {
            const tn = scene.transformNodes[i];
            if (!tn || OutputManager._isOuterEnvNode(tn)) continue;
            const md = tn.metadata || {};
            if (!(md.isHinge || md.isDoorGroup)) continue;
            const hingeId = md.hingeId || tn.name;
            if (!hingeId || seenHinge[hingeId]) continue;
            seenHinge[hingeId] = 1;
            const pickNames = collectMeshNamesUnder(tn);
            var hPos = null, hQuat = null;
            try {
                if (tn.computeWorldMatrix) tn.computeWorldMatrix(true);
                if (tn.getAbsolutePosition) {
                    var ap = tn.getAbsolutePosition();
                    hPos = { x: ap.x, y: ap.y, z: ap.z };
                } else if (tn.position) {
                    hPos = { x: tn.position.x, y: tn.position.y, z: tn.position.z };
                }
                // چرخش جهانی لولا (مثل hinge.getWorldQuaternion در Three)
                var aq = tn.absoluteRotationQuaternion;
                if (aq) hQuat = { x: aq.x, y: aq.y, z: aq.z, w: aq.w };
            } catch (e) {}
            var od1 = md.openDirection != null ? Number(md.openDirection) : -1;
            var ax1 = md.axis || 'y';
            // BJS: axis x → -1.6 | y → (PI/2)*dir
            var maxOpen1 = (ax1 === 'x') ? -1.6 : ((Math.PI / 2) * od1);
            // موقعیت محلی اولین فرزند مستقیم لولا (درب)
            var doorLocalPos = null;
            try {
                var ch = tn.getChildren ? tn.getChildren() : [];
                for (var ci = 0; ci < ch.length; ci++) {
                    if (ch[ci] && ch[ci].position) {
                        doorLocalPos = { x: ch[ci].position.x, y: ch[ci].position.y, z: ch[ci].position.z };
                        break;
                    }
                }
            } catch (e) {}
            catalog.interactives.push({
                code: 'D_' + (doorSeq++),
                kind: 'door',
                hingeId: hingeId,
                hingeName: tn.name,
                pickMeshNames: pickNames,
                hingeWorldPos: hPos,
                hingeWorldQuat: hQuat,
                doorLocalPos: doorLocalPos,
                openDirection: od1,
                axis: ax1,
                maxOpenAngle: maxOpen1,
                targetOpenAngle: maxOpen1
            });
        }

        // درب‌هایی که فقط روی مش metadata دارند
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            if (!n || OutputManager._isOuterEnvNode(n)) continue;
            const md = n.metadata || {};
            const name = n.name || '';

            if (md.isDrawer) {
                const key = md.hingeId || name || ('drw_' + drawerSeq);
                if (seenDrawer[key]) continue;
                seenDrawer[key] = 1;
                const pivot = md.hingeNode;
                let closedZ = md.closedZ, openZ = md.openZ;
                let pivotName = name;
                if (pivot) {
                    pivotName = pivot.name || pivotName;
                    if (pivot.metadata) {
                        if (closedZ == null) closedZ = pivot.metadata.closedZ;
                        if (openZ == null) openZ = pivot.metadata.openZ;
                    }
                }
                const pickNames = pivot ? collectMeshNamesUnder(pivot) : collectMeshNamesUnder(n);
                if (name && pickNames.indexOf(name) < 0) pickNames.push(name);
                catalog.interactives.push({
                    code: 'DR_' + (drawerSeq++),
                    kind: 'drawer',
                    nodeName: pivotName,
                    meshName: name,
                    pickMeshNames: pickNames,
                    closedZ: closedZ != null ? Number(closedZ) : 0,
                    openZ: openZ != null ? Number(openZ) : -35
                });
                continue;
            }

            if (md.isDoor || md.isDoorPart) {
                const hingeId = md.hingeId || null;
                if (!hingeId) continue;
                if (seenHinge[hingeId]) {
                    // فقط نام مش را به لیست قبلی اضافه کن
                    for (let j = 0; j < catalog.interactives.length; j++) {
                        const it = catalog.interactives[j];
                        if (it.kind === 'door' && it.hingeId === hingeId) {
                            if (!it.pickMeshNames) it.pickMeshNames = [];
                            if (name && it.pickMeshNames.indexOf(name) < 0) it.pickMeshNames.push(name);
                            const under = collectMeshNamesUnder(n);
                            for (let u = 0; u < under.length; u++) {
                                if (it.pickMeshNames.indexOf(under[u]) < 0) it.pickMeshNames.push(under[u]);
                            }
                        }
                    }
                    continue;
                }
                const hingeNode = findHingeNode(hingeId, hingeId, md.hingeNode);
                const hingeName = (hingeNode && hingeNode.name) || hingeId;
                seenHinge[hingeId] = 1;
                let pickNames = hingeNode ? collectMeshNamesUnder(hingeNode) : [];
                if (name && pickNames.indexOf(name) < 0) pickNames.push(name);
                const under = collectMeshNamesUnder(n);
                for (let u = 0; u < under.length; u++) {
                    if (pickNames.indexOf(under[u]) < 0) pickNames.push(under[u]);
                }
                var hPos2 = null, hQuat2 = null;
                try {
                    var hn2 = hingeNode || findHingeNode(hingeId, hingeName, null);
                    if (hn2) {
                        if (hn2.computeWorldMatrix) hn2.computeWorldMatrix(true);
                        if (hn2.getAbsolutePosition) {
                            var ap2 = hn2.getAbsolutePosition();
                            hPos2 = { x: ap2.x, y: ap2.y, z: ap2.z };
                        }
                        var aq2 = hn2.absoluteRotationQuaternion;
                        if (aq2) hQuat2 = { x: aq2.x, y: aq2.y, z: aq2.z, w: aq2.w };
                    }
                } catch (e) {}
                var od2 = md.openDirection != null ? Number(md.openDirection) : -1;
                var ax2 = md.axis || 'y';
                var maxOpen2 = (ax2 === 'x') ? -1.6 : ((Math.PI / 2) * od2);
                var doorLocalPos2 = null;
                try {
                    var hnLoc = hingeNode || findHingeNode(hingeId, hingeName, null);
                    if (hnLoc && hnLoc.getChildren) {
                        var ch2 = hnLoc.getChildren();
                        for (var ci2 = 0; ci2 < ch2.length; ci2++) {
                            if (ch2[ci2] && ch2[ci2].position) {
                                doorLocalPos2 = { x: ch2[ci2].position.x, y: ch2[ci2].position.y, z: ch2[ci2].position.z };
                                break;
                            }
                        }
                    }
                } catch (e) {}
                catalog.interactives.push({
                    code: 'D_' + (doorSeq++),
                    kind: 'door',
                    hingeId: hingeId,
                    hingeName: hingeName,
                    pickMeshNames: pickNames,
                    hingeWorldPos: hPos2,
                    hingeWorldQuat: hQuat2,
                    doorLocalPos: doorLocalPos2,
                    openDirection: od2,
                    axis: ax2,
                    maxOpenAngle: maxOpen2,
                    targetOpenAngle: maxOpen2
                });
            }
        }

        console.log('[OutputManager] catalog textures:', Object.keys(catalog.textures).length,
            'meshes:', Object.keys(catalog.meshes).length,
            'interactives:', catalog.interactives.length);
        return catalog;
    },

    /**
     * بسته‌بندی GLB + کاتالوگ داخل HTML ویوور
     */
    _packageAndDownloadGlbViewerBabylon: function (glbBuffer, fileName, meshCount, catalog) {
        if (!glbBuffer) {
            alert('فایل GLB خالی است!');
            return;
        }
        fileName = fileName || 'آشپزخانه_سه_بعدی.html';
        meshCount = meshCount || 0;
        catalog = catalog || { version: 2, textures: {}, meshes: {}, interactives: [] };

        const bytes = new Uint8Array(glbBuffer);
        let binary = '';
        const chunkSize = 16384;
        for (let i = 0; i < bytes.byteLength; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength)));
        }
        const base64Data = btoa(binary);

        // کاتالوگ را JSON امن برای قرار دادن در script بساز
        let catalogJson = '{}';
        try {
            catalogJson = JSON.stringify(catalog);
            // جلوگیری از شکستن تگ script
            catalogJson = catalogJson.replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
        } catch (e) {
            console.warn('[OutputManager] catalog stringify', e);
        }

        const htmlContent = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>نمایشگر سه‌بعدی آشپزخانه</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');
*{box-sizing:border-box}body{margin:0;padding:0;overflow:hidden;background:#0d111c;font-family:'Vazirmatn',sans-serif;color:#fff}
#header{width:100%;min-height:52px;background:#131b2e;display:flex;align-items:center;justify-content:space-between;padding:8px 14px;gap:10px;flex-wrap:wrap}
h1{margin:0;font-size:17px}#controls{display:flex;gap:8px;flex-wrap:wrap}
button{background:#1d2950;color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-family:inherit;font-size:13px}
button:hover{background:#e94560}
#canvas-container{width:100%;height:calc(100vh - 52px);position:relative}
canvas{width:100%;height:100%;display:block;outline:none;touch-action:none}
#loading{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.85);padding:16px 24px;border-radius:12px;z-index:10}
#info{position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,.65);padding:8px 12px;border-radius:10px;font-size:12px;z-index:10}
</style>
</head>
<body>
<div id="header">
  <h1>نمایشگر سه‌بعدی آشپزخانه</h1>
  <div id="controls">
    <button id="btnReset">ریست دوربین</button>
    <button id="btnFullscreen">تمام صفحه</button>
  </div>
</div>
<div id="canvas-container">
  <canvas id="renderCanvas"></canvas>
  <div id="loading">در حال بارگذاری مدل… (${meshCount} قطعه)</div>
  <div id="info">کلیک روی درب/کشو: باز و بسته • چرخش و زوم با لمس/موس</div>
</div>
<script>
const RAW_BASE64 = "${base64Data}";
const SCENE_CATALOG = ${catalogJson};
<\/script>
<script src="https://cdn.babylonjs.com/babylon.js"><\/script>
<script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"><\/script>
<script>
function readExtras(node) {
  const md = (node && node.metadata) || {};
  return (md.gltf && md.gltf.extras) || md.extras || md || {};
}

window.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.07, 0.09, 0.14, 1);
  const camera = new BABYLON.ArcRotateCamera('cam', -Math.PI/3, Math.PI/3, 400, new BABYLON.Vector3(0, 80, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 20;
  camera.upperRadiusLimit = 5000;
  camera.wheelPrecision = 0.35;
  camera.panningSensibility = 35;
  camera.minZ = 0.1;
  // نور همه‌جانبه تا زیر اجسام سیاه نباشد
  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 1.15;
  hemi.groundColor = new BABYLON.Color3(0.55, 0.55, 0.58); // نور از پایین
  hemi.diffuse = new BABYLON.Color3(1, 1, 1);
  // نور پرکننده از پایین
  const hemiUp = new BABYLON.HemisphericLight('hemiUp', new BABYLON.Vector3(0, -1, 0), scene);
  hemiUp.intensity = 0.55;
  hemiUp.groundColor = new BABYLON.Color3(0.75, 0.75, 0.78);
  // جهت‌دار ملایم
  const dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-0.3, -1, -0.25), scene);
  dir.intensity = 0.45;
  // نور جانبی برای پر کردن سایه‌ها
  const dir2 = new BABYLON.DirectionalLight('dir2', new BABYLON.Vector3(0.4, 0.2, 0.5), scene);
  dir2.intensity = 0.35;

  const interactive = [];
  const catalog = (typeof SCENE_CATALOG !== 'undefined' && SCENE_CATALOG) ? SCENE_CATALOG : { textures: {}, meshes: {}, interactives: [] };

  function hideLoading() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
  }

  function fitCamera() {
    let min = new BABYLON.Vector3(1e9, 1e9, 1e9);
    let max = new BABYLON.Vector3(-1e9, -1e9, -1e9);
    let any = false;
    scene.meshes.forEach(function (m) {
      if (!m.getBoundingInfo) return;
      try {
        m.computeWorldMatrix(true);
        const bi = m.getBoundingInfo();
        min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
        max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
        any = true;
      } catch (e) {}
    });
    if (!any) return;
    const center = min.add(max).scale(0.5);
    const size = max.subtract(min);
    camera.setTarget(center);
    camera.radius = Math.max(size.x, size.y, size.z, 50) * 1.35;
  }

  function findNodeByName(name) {
    if (!name) return null;
    const all = (scene.transformNodes || []).concat(scene.meshes || []);
    for (let i = 0; i < all.length; i++) {
      if ((all[i].name || '') === name) return all[i];
    }
    // match partial (GLTF گاهی prefix می‌گذارد)
    for (let i = 0; i < all.length; i++) {
      const n = all[i].name || '';
      if (n === name || n.endsWith('_' + name) || n.indexOf(name) >= 0) return all[i];
    }
    return null;
  }

  /** اعمال تکسچرهای کاتالوگ روی مش‌ها (کف/دیوار/سقف) */
  function applyCatalogTextures() {
    const textures = catalog.textures || {};
    const meshesInfo = catalog.meshes || {};
    let applied = 0;

    Object.keys(meshesInfo).forEach(function (meshName) {
      const info = meshesInfo[meshName];
      if (!info || !info.texCode) return;
      const texInfo = textures[info.texCode];
      if (!texInfo || !texInfo.dataUrl) return;

      const mesh = findNodeByName(meshName);
      if (!mesh || !mesh.material) {
        // جستجو در همه مش‌ها با نام مشابه
        const candidates = (scene.meshes || []).filter(function (m) {
          const n = m.name || '';
          return n === meshName || n.indexOf(meshName) >= 0 || meshName.indexOf(n) >= 0;
        });
        candidates.forEach(function (m) { applyTexToMesh(m, texInfo); applied++; });
        return;
      }
      applyTexToMesh(mesh, texInfo);
      applied++;
    });

    // اگر با نام match نشد، نقش role را روی نام‌های استاندارد بزن
    ['floor', 'ceiling', 'wallTop', 'wallBottom', 'wallLeft', 'wallRight'].forEach(function (stdName) {
      const info = meshesInfo[stdName];
      if (!info || !info.texCode) return;
      const texInfo = textures[info.texCode];
      if (!texInfo) return;
      (scene.meshes || []).forEach(function (m) {
        const n = (m.name || '').toLowerCase();
        if (n === stdName.toLowerCase() || n.indexOf(stdName.toLowerCase()) >= 0) {
          applyTexToMesh(m, texInfo);
        }
      });
    });

    console.log('[viewer] textures applied:', applied, 'catalog tex:', Object.keys(textures).length);
  }

  function applyTexToMesh(mesh, texInfo) {
    if (!mesh) return;
    try {
      const mat = new BABYLON.StandardMaterial('catMat_' + (mesh.name || 'm'), scene);
      mat.diffuseColor = new BABYLON.Color3(1, 1, 1);
      mat.specularColor = new BABYLON.Color3(0.06, 0.06, 0.06);
      mat.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.04);
      mat.backFaceCulling = false;
      mat.twoSidedLighting = true;
      const tex = new BABYLON.Texture(texInfo.dataUrl, scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
      tex.uScale = texInfo.uScale != null ? texInfo.uScale : 1;
      tex.vScale = texInfo.vScale != null ? texInfo.vScale : 1;
      tex.uOffset = texInfo.uOffset != null ? texInfo.uOffset : 0;
      tex.vOffset = texInfo.vOffset != null ? texInfo.vOffset : 0;
      tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
      tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
      mat.diffuseTexture = tex;
      mesh.material = mat;
    } catch (e) {
      console.warn('[viewer] applyTex', mesh.name, e);
    }
  }

  /** بعد از لود GLB: متریال‌ها را از هر طرف روشن کن (زیر اجسام سیاه نباشد) */
  function fixMaterialsAllAround() {
    (scene.materials || []).forEach(function (mat) {
      if (!mat) return;
      try {
        mat.backFaceCulling = false;
        if (mat.twoSidedLighting !== undefined) mat.twoSidedLighting = true;
        // PBR از GLTF اغلب metallic بالا → زیر مشکی
        if (mat.metallic !== undefined) mat.metallic = Math.min(mat.metallic || 0, 0.05);
        if (mat.roughness !== undefined && (mat.roughness == null || mat.roughness < 0.2)) mat.roughness = 0.55;
        if (mat.metallicF0Factor !== undefined) mat.metallicF0Factor = 0;
        // Standard
        if (mat.specularColor && mat.specularColor.r > 0.4) {
          mat.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);
        }
        // کمی emissive تا سطح کاملاً سیاه نشود
        if (mat.emissiveColor) {
          const e = mat.emissiveColor;
          if (e.r + e.g + e.b < 0.05) {
            mat.emissiveColor = new BABYLON.Color3(0.03, 0.03, 0.03);
          }
        }
      } catch (e) {}
    });
    (scene.meshes || []).forEach(function (m) {
      try {
        if (m.material) {
          // اگر MultiMaterial
          if (m.material.subMaterials) {
            m.material.subMaterials.forEach(function (sm) {
              if (sm) { sm.backFaceCulling = false; try { sm.twoSidedLighting = true; } catch (e) {} }
            });
          }
        }
      } catch (e) {}
    });
  }

  /** ثبت انیمیشن از کاتالوگ */
  function registerFromCatalog() {
    interactive.length = 0;
    const list = catalog.interactives || [];
    const pickMap = Object.create(null);
    const allNodes = (scene.transformNodes || []).concat(scene.meshes || []);

    function extrasOf(node) {
      const md = (node && node.metadata) || {};
      return (md.gltf && md.gltf.extras) || md.extras || md;
    }
    function findNodeExact(name, hingeId) {
      if (name) {
        for (let i = 0; i < allNodes.length; i++) {
          if (allNodes[i] && allNodes[i].name === name) return allNodes[i];
        }
      }
      if (hingeId) {
        for (let i = 0; i < allNodes.length; i++) {
          const n = allNodes[i];
          const md = extrasOf(n);
          if (n && (md.hingeId === hingeId || n.name === hingeId)) return n;
        }
      }
      return null;
    }
    function findMeshesExact(names) {
      const found = [];
      const all = scene.meshes || [];
      (names || []).forEach(function (want) {
        if (!want) return;
        for (let j = 0; j < all.length; j++) {
          const m = all[j];
          if (m && m.name === want && found.indexOf(m) < 0) found.push(m);
        }
      });
      return found;
    }
    function descendantsOf(node) {
      if (!node) return [];
      try { return node.getChildMeshes ? node.getChildMeshes(false) : []; }
      catch (e) { return []; }
    }
    function registerPickTargets(entry, meshes) {
      (meshes || []).forEach(function (m) {
        if (!m) return;
        if (m.name) pickMap[m.name] = entry;
        try { m.isPickable = true; } catch (e) {}
      });
      if (entry.node && entry.node.name) pickMap[entry.node.name] = entry;
    }

    list.forEach(function (item) {
      if (!item) return;

      if (item.kind === 'door') {
        // The GLB already contains the original hinge TransformNode and its child hierarchy.
        // Animate that node directly; never re-parent door meshes or infer pivots from bounds.
        const hinge = findNodeExact(item.hingeName, item.hingeId);
        if (!hinge) {
          console.warn('[viewer] exported hinge node not found; door left static:', item.code, item.hingeName, item.hingeId);
          return;
        }
        let meshes = descendantsOf(hinge);
        if (!meshes.length) meshes = findMeshesExact(item.pickMeshNames || []);
        if (!meshes.length) {
          console.warn('[viewer] no meshes under exported hinge:', item.code);
          return;
        }

        const axis = item.axis || 'y';
        const openDir = item.openDirection != null ? Number(item.openDirection) : -1;
        let targetAngle = item.targetOpenAngle;
        if (targetAngle == null || !isFinite(Number(targetAngle))) targetAngle = item.maxOpenAngle;
        if (targetAngle == null || !isFinite(Number(targetAngle))) {
          targetAngle = axis === 'x' ? -1.6 : (Math.PI / 2) * openDir;
        }
        targetAngle = Number(targetAngle);

        // Preserve the imported local rotation exactly. Rotation happens in hinge-local space,
        // so a cabinet rotated 0/90/180/270 degrees keeps the same correct opening direction.
        if (hinge.computeWorldMatrix) hinge.computeWorldMatrix(true);
        let startQ;
        if (hinge.rotationQuaternion) startQ = hinge.rotationQuaternion.clone();
        else {
          const r = hinge.rotation || BABYLON.Vector3.Zero();
          startQ = BABYLON.Quaternion.FromEulerAngles(r.x, r.y, r.z);
          hinge.rotationQuaternion = startQ.clone();
        }
        const entry = {
          code: item.code,
          node: hinge,
          kind: 'door',
          isOpen: false,
          progress: 0,
          openDir: openDir,
          axis: axis,
          maxOpenAngle: targetAngle,
          startQuaternion: startQ.clone(),
          localAxis: axis === 'x' ? new BABYLON.Vector3(1, 0, 0) : new BABYLON.Vector3(0, 1, 0),
          hingeId: item.hingeId,
          meshes: meshes
        };
        interactive.push(entry);
        registerPickTargets(entry, meshes);
      } else if (item.kind === 'drawer') {
        // Keep the GLB's original drawer pivot and parent-child relationships.
        const node = findNodeExact(item.nodeName, item.hingeId) || findNodeExact(item.meshName, null);
        if (!node) {
          console.warn('[viewer] exported drawer pivot not found:', item.code, item.nodeName);
          return;
        }
        let meshes = descendantsOf(node);
        if (!meshes.length) meshes = findMeshesExact(item.pickMeshNames || []);
        const closedZ = item.closedZ != null ? Number(item.closedZ) : node.position.z;
        const openZ = item.openZ != null ? Number(item.openZ) : closedZ - 35;
        const entry = {
          code: item.code,
          node: node,
          kind: 'drawer',
          isOpen: false,
          progress: 0,
          closedZ: closedZ,
          openZ: openZ,
          closedPosition: node.position.clone(),
          meshes: meshes
        };
        interactive.push(entry);
        registerPickTargets(entry, meshes);
      }
    });

    window.__pickMap = pickMap;
    console.log('[viewer] interactives:', interactive.length, 'pickMap:', Object.keys(pickMap).length);
  }

  function findInteractive(mesh) {
    let cur = mesh;
    const pickMap = window.__pickMap || {};
    while (cur) {
      if (cur.name && pickMap[cur.name]) return pickMap[cur.name];
      for (let i = 0; i < interactive.length; i++) {
        const it = interactive[i];
        if (it.node === cur || (it.meshes && it.meshes.indexOf(cur) >= 0)) return it;
      }
      cur = cur.parent;
    }
    return null;
  }

  // کلیک موبایل: POINTERDOWN + فاصله کم تا POINTERUP
  var _ptrDown = null;
  scene.onPointerObservable.add(function (pi) {
    if (pi.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      _ptrDown = { x: scene.pointerX, y: scene.pointerY, t: Date.now() };
      return;
    }
    if (pi.type !== BABYLON.PointerEventTypes.POINTERUP &&
        pi.type !== BABYLON.PointerEventTypes.POINTERPICK &&
        pi.type !== BABYLON.PointerEventTypes.POINTERTAP) return;

    if (_ptrDown) {
      const dx = scene.pointerX - _ptrDown.x;
      const dy = scene.pointerY - _ptrDown.y;
      if (dx * dx + dy * dy > 100) { _ptrDown = null; return; } // درگ دوربین
      _ptrDown = null;
    }

    const pick = scene.pick(scene.pointerX, scene.pointerY);
    if (!pick || !pick.hit || !pick.pickedMesh) return;
    const item = findInteractive(pick.pickedMesh);
    if (item) {
      item.isOpen = !item.isOpen;
      console.log('[viewer] toggle', item.code, item.kind, 'axis=', item.axis, 'open=', item.isOpen);
    }
  });

  try {
    const binary_string = atob(RAW_BASE64);
    const arr = new Uint8Array(binary_string.length);
    for (let i = 0; i < binary_string.length; i++) arr[i] = binary_string.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr.buffer], { type: 'model/gltf-binary' }));

    BABYLON.SceneLoader.Append(url, '', scene, function () {
      applyCatalogTextures();
      fixMaterialsAllAround();
      registerFromCatalog();
      hideLoading();
      fitCamera();
      setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    }, null, function (s, msg) {
      hideLoading();
      alert('خطا در بارگذاری مدل: ' + (msg || ''));
    }, '.glb');
  } catch (e) {
    hideLoading();
    console.error(e);
    alert('خطا در خواندن داده مدل');
  }

  engine.runRenderLoop(function () {
    for (let i = 0; i < interactive.length; i++) {
      const it = interactive[i];
      const target = it.isOpen ? 1 : 0;
      it.progress += (target - it.progress) * 0.12;
      if (it.kind === 'door' && it.node) {
        // عین Three.js: startQuaternion * deltaRotation(localAxis, maxOpenAngle * progress)
        const ang = (it.maxOpenAngle != null ? it.maxOpenAngle : 0) * it.progress;
        const axisVec = it.localAxis || ((it.axis === 'x')
          ? new BABYLON.Vector3(1, 0, 0)
          : new BABYLON.Vector3(0, 1, 0));
        const delta = BABYLON.Quaternion.RotationAxis(axisVec, ang);
        const startQ = it.startQuaternion || BABYLON.Quaternion.Identity();
        it.node.rotationQuaternion = startQ.multiply(delta);
      } else if (it.kind === 'drawer' && it.node) {
        const basePos = it.closedPosition || it.node.position;
        it.node.position.x = basePos.x;
        it.node.position.y = basePos.y;
        it.node.position.z = it.closedZ + (it.openZ - it.closedZ) * it.progress;
      }
    }
    scene.render();
  });

  window.addEventListener('resize', function () { engine.resize(); });
  document.getElementById('btnReset').onclick = function () { fitCamera(); };
  document.getElementById('btnFullscreen').onclick = function () {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  };
});
<\/script>
</body>
</html>`;

        const outName = fileName.indexOf('.html') >= 0 ? fileName : (fileName.replace(/\\.glb$/i, '') + '.html');
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = outName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        const nTex = catalog.textures ? Object.keys(catalog.textures).length : 0;
        const nInt = catalog.interactives ? catalog.interactives.length : 0;
        alert('✅ فایل نمایشگر دانلود شد\\nمش: ' + meshCount + ' | تکسچر: ' + nTex + ' | انیمیشن: ' + nInt);
    },

    /**
     * خروجی از صحنه Babylon + کاتالوگ کدگذاری‌شده
     */
    exportToGLBFromBabylon: function (babylonScene, fileName) {
        fileName = fileName || 'آشپزخانه_سه_بعدی.html';
        if (!babylonScene) {
            alert('صحنه Babylon وجود ندارد! اول دکمه BJS را بزنید.');
            return;
        }
        if (typeof BABYLON === 'undefined' || !BABYLON.GLTF2Export || typeof BABYLON.GLTF2Export.GLBAsync !== 'function') {
            alert('کتابخانه serializers بابیلون لود نشده. صفحه را رفرش کنید.');
            return;
        }

        const scene = babylonScene;
        const meshes = scene.meshes || [];
        const restoreList = [];
        const outerHide = [];
        const bakedTextures = [];
        let meshCount = 0;

        function isOuter(node) {
            return OutputManager._isOuterEnvNode(node);
        }

        function bakeDynamicTextureAsync(tex, sceneRef) {
            return new Promise(function (resolve) {
                if (!tex) { resolve(null); return; }
                try {
                    const cn = (typeof tex.getClassName === 'function') ? tex.getClassName() : '';
                    if (cn && cn !== 'DynamicTexture') {
                        if (tex.url && String(tex.url).indexOf('data:image') === 0) {
                            resolve(tex);
                            return;
                        }
                        resolve(tex);
                        return;
                    }
                    const dataUrl = OutputManager._textureToDataUrl(tex);
                    if (!dataUrl || dataUrl.indexOf('data:image') !== 0) {
                        resolve(null);
                        return;
                    }
                    let done = false;
                    const finish = function (r) {
                        if (done) return;
                        done = true;
                        resolve(r);
                    };
                    const baked = new BABYLON.Texture(
                        dataUrl, sceneRef, false, true,
                        BABYLON.Texture.TRILINEAR_SAMPLINGMODE,
                        function () { finish(baked); },
                        function () { finish(null); }
                    );
                    try {
                        baked.name = (tex.name || 'dyn') + '_baked';
                        baked.uScale = tex.uScale != null ? tex.uScale : 1;
                        baked.vScale = tex.vScale != null ? tex.vScale : 1;
                        baked.uOffset = tex.uOffset != null ? tex.uOffset : 0;
                        baked.vOffset = tex.vOffset != null ? tex.vOffset : 0;
                        baked.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                        baked.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                        baked.gammaSpace = true;
                    } catch (e) {}
                    bakedTextures.push(baked);
                    try { if (baked.isReady && baked.isReady()) finish(baked); } catch (e) {}
                    setTimeout(function () { finish(baked); }, 3000);
                } catch (e) {
                    resolve(null);
                }
            });
        }

        function prepareMaterialAsync(mat, id) {
            return new Promise(function (resolve) {
                if (!mat) { resolve(null); return; }
                try {
                    if (mat.subMaterials && mat.subMaterials.length) {
                        Promise.all(mat.subMaterials.map(function (sm, si) {
                            return prepareMaterialAsync(sm, id + '_s' + si);
                        })).then(function (subs) {
                            const multi = new BABYLON.MultiMaterial('__exp_multi_' + id, scene);
                            multi.subMaterials = subs;
                            resolve(multi);
                        });
                        return;
                    }
                    const cloned = (typeof mat.clone === 'function') ? mat.clone('__exp_mat_' + id) : mat;
                    const jobs = [];
                    if (cloned.diffuseTexture) {
                        jobs.push(bakeDynamicTextureAsync(cloned.diffuseTexture, scene).then(function (baked) {
                            if (baked) {
                                cloned.diffuseTexture = baked;
                                try { cloned.albedoTexture = baked; } catch (e) {}
                                cloned.diffuseColor = new BABYLON.Color3(1, 1, 1);
                                try { cloned.metallic = 0; } catch (e) {}
                            }
                        }));
                    }
                    Promise.all(jobs).then(function () {
                        const matName = String(mat.name || '').toLowerCase();
                        if (!cloned.diffuseTexture) {
                            if (matName.indexOf('floor') >= 0 || matName.indexOf('cer') >= 0)
                                cloned.diffuseColor = new BABYLON.Color3(0.86, 0.83, 0.78);
                            else if (matName.indexOf('wall') >= 0 || matName.indexOf('inner') >= 0)
                                cloned.diffuseColor = new BABYLON.Color3(0.96, 0.95, 0.93);
                            else if (matName.indexOf('ceil') >= 0)
                                cloned.diffuseColor = new BABYLON.Color3(1, 1, 1);
                            else if (!cloned.diffuseColor)
                                cloned.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
                        } else {
                            cloned.diffuseColor = new BABYLON.Color3(1, 1, 1);
                        }
                        cloned.alpha = 1;
                        resolve(cloned);
                    });
                } catch (e) {
                    const solid = new BABYLON.StandardMaterial('__exp_solid_' + id, scene);
                    solid.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
                    resolve(solid);
                }
            });
        }

        function ensureExportMetadata(node) {
            if (!node || !node.metadata) return;
            const md = node.metadata;
            const clean = {};
            ['isDoor','isDrawer','isHinge','isDoorGroup','isDoorPart','isCabinet','isGlass',
             'isFloor','isCeiling','isWall','axis','openDirection','closedZ','openZ',
             'isOpen','hingeId','slotIndex','cabinetId','maxAngle','targetOpenAngle','exportCode','texCode'
            ].forEach(function (k) {
                if (md[k] === undefined || md[k] === null) return;
                const t = typeof md[k];
                if (t === 'string' || t === 'number' || t === 'boolean') clean[k] = md[k];
            });
            if (Object.keys(clean).length) node.metadata = Object.assign({}, md, clean);
        }

        // مخفی کردن بیرون
        for (let i = 0; i < meshes.length; i++) {
            const m = meshes[i];
            if (!m) continue;
            if (isOuter(m)) {
                try {
                    outerHide.push({ mesh: m, enabled: m.isEnabled(), visible: m.isVisible });
                    m.setEnabled(false);
                    m.isVisible = false;
                } catch (e) {}
            }
        }
        const tnodes = scene.transformNodes || [];
        for (let i = 0; i < tnodes.length; i++) {
            if (isOuter(tnodes[i])) {
                try {
                    outerHide.push({ mesh: tnodes[i], enabled: tnodes[i].isEnabled(), visible: true });
                    tnodes[i].setEnabled(false);
                } catch (e) {}
            }
        }

        const interiorMeshes = [];
        for (let i = 0; i < meshes.length; i++) {
            const m = meshes[i];
            if (!m) continue;
            try {
                if (isOuter(m)) continue;
                if (typeof m.isEnabled === 'function' && !m.isEnabled()) continue;
                if (m.isVisible === false) continue;
                const vc = (typeof m.getTotalVertices === 'function') ? m.getTotalVertices() : 0;
                if (!vc || vc <= 0) continue;
                meshCount++;
                try { m.computeWorldMatrix(true); } catch (e) {}
                // کپی extras از parent لولا
                try {
                    let p = m.parent, d = 0;
                    const smd = m.metadata || {};
                    while (p && d < 6) {
                        const pmd = p.metadata || {};
                        if (pmd.isDoor || pmd.isHinge || pmd.isDoorGroup || pmd.isDrawer) {
                            m.metadata = Object.assign({}, smd, {
                                isDoor: !!(pmd.isDoor || pmd.isHinge || pmd.isDoorGroup || smd.isDoor),
                                isDrawer: !!(pmd.isDrawer || smd.isDrawer),
                                isHinge: !!pmd.isHinge,
                                openDirection: pmd.openDirection != null ? pmd.openDirection : smd.openDirection,
                                axis: pmd.axis || smd.axis || 'y',
                                maxAngle: pmd.maxAngle != null ? pmd.maxAngle : smd.maxAngle,
                                hingeId: pmd.hingeId || smd.hingeId || p.name,
                                closedZ: pmd.closedZ != null ? pmd.closedZ : smd.closedZ,
                                openZ: pmd.openZ != null ? pmd.openZ : smd.openZ,
                                hingeNode: smd.hingeNode || pmd.hingeNode || (pmd.isHinge ? p : null)
                            });
                            break;
                        }
                        p = p.parent;
                        d++;
                    }
                } catch (e) {}
                ensureExportMetadata(m);
                interiorMeshes.push(m);
            } catch (e) {}
        }

        if (meshCount === 0) {
            outerHide.forEach(function (h) {
                try { h.mesh.setEnabled(h.enabled); h.mesh.isVisible = h.visible; } catch (e) {}
            });
            alert('هیچ مش داخلی پیدا نشد. اول BJS را باز کنید.');
            return;
        }

        // کاتالوگ قبل از تغییر متریال (تکسچر اصلی DynamicTexture هنوز هست)
        const catalog = OutputManager._buildSceneCatalog(scene, interiorMeshes);

        const matPromises = interiorMeshes.map(function (mesh, idx) {
            if (!mesh.material) return Promise.resolve();
            restoreList.push({ mesh: mesh, material: mesh.material });
            return prepareMaterialAsync(mesh.material, idx).then(function (prepared) {
                mesh.material = prepared;
            });
        });

        const restoreAll = function () {
            for (let i = 0; i < outerHide.length; i++) {
                try {
                    outerHide[i].mesh.setEnabled(outerHide[i].enabled);
                    if (outerHide[i].visible != null) outerHide[i].mesh.isVisible = outerHide[i].visible;
                } catch (e) {}
            }
            for (let i = 0; i < restoreList.length; i++) {
                try {
                    const item = restoreList[i];
                    const tmp = item.mesh.material;
                    item.mesh.material = item.material;
                    if (tmp && tmp !== item.material) {
                        try {
                            if (tmp.subMaterials) tmp.subMaterials.forEach(function (sm) { try { sm.dispose(); } catch (e) {} });
                            tmp.dispose();
                        } catch (e) {}
                    }
                } catch (e) {}
            }
            for (let i = 0; i < bakedTextures.length; i++) {
                try { bakedTextures[i].dispose(); } catch (e) {}
            }
        };

        Promise.all(matPromises).then(function () {
            try { scene.render(); } catch (e) {}
            return new Promise(function (r) { setTimeout(r, 120); });
        }).then(function () {
            return BABYLON.GLTF2Export.GLBAsync(scene, 'kitchen_interior_export', {
                shouldExportNode: function (node) {
                    if (!node) return false;
                    if (isOuter(node)) return false;
                    const n = node.name || '';
                    if (n.indexOf('__') === 0 && n.indexOf('__exp_') !== 0) return false;
                    try {
                        if (typeof node.isEnabled === 'function' && !node.isEnabled()) return false;
                    } catch (e) {}
                    const cn = (typeof node.getClassName === 'function') ? node.getClassName() : '';
                    if (cn.indexOf('Camera') >= 0 || cn.indexOf('Light') >= 0) return false;
                    return true;
                },
                exportUnusedUVs: true,
                removeNoopRootNodes: false
            });
        }).then(function (glbData) {
            function toArrayBuffer(blobOrBuffer) {
                if (!blobOrBuffer) return Promise.reject(new Error('empty'));
                if (blobOrBuffer instanceof ArrayBuffer) return Promise.resolve(blobOrBuffer);
                if (blobOrBuffer.buffer && blobOrBuffer.byteLength != null) {
                    const copy = new Uint8Array(blobOrBuffer.byteLength);
                    copy.set(new Uint8Array(blobOrBuffer.buffer, blobOrBuffer.byteOffset || 0, blobOrBuffer.byteLength));
                    return Promise.resolve(copy.buffer);
                }
                if (typeof Blob !== 'undefined' && blobOrBuffer instanceof Blob) return blobOrBuffer.arrayBuffer();
                if (typeof blobOrBuffer.arrayBuffer === 'function') return blobOrBuffer.arrayBuffer();
                return Promise.reject(new Error('unknown'));
            }
            let fileBlob = null;
            try {
                const files = glbData && glbData.glTFFiles;
                if (files) {
                    const keys = Object.keys(files);
                    const glbKey = keys.find(function (k) { return /\\.glb$/i.test(k); }) || keys[0];
                    fileBlob = files[glbKey];
                }
            } catch (e) {}
            restoreAll();
            if (!fileBlob) {
                alert('خروجی GLB خالی بود.');
                return;
            }
            return toArrayBuffer(fileBlob).then(function (buf) {
                const size = buf && buf.byteLength ? buf.byteLength : 0;
                console.log('[OutputManager] GLB size:', size, 'catalog tex:', Object.keys(catalog.textures).length);
                if (size < 300) {
                    alert('فایل GLB خیلی کوچک است.');
                    return;
                }
                OutputManager._packageAndDownloadGlbViewerBabylon(buf, fileName, meshCount, catalog);
            });
        }).catch(function (err) {
            restoreAll();
            console.error('[OutputManager]', err);
            alert('خطا در export: ' + (err && err.message ? err.message : err));
        });
    },

    exportToGLB: function (sceneOrIgnored, fileName) {
        if (typeof KitchenBabylon !== 'undefined' && KitchenBabylon.scene) {
            return OutputManager.exportToGLBFromBabylon(KitchenBabylon.scene, fileName);
        }
        alert('خروجی فقط از نمای Babylon است. اول BJS را باز کنید.');
    },

    exportImage: function (a, b, c, fileName) {
        if (typeof KitchenBabylon !== 'undefined' && KitchenBabylon.engine && KitchenBabylon.camera) {
            try {
                if (BABYLON.Tools && BABYLON.Tools.CreateScreenshot) {
                    BABYLON.Tools.CreateScreenshot(KitchenBabylon.engine, KitchenBabylon.camera, { precision: 1 }, function (dataUrl) {
                        const link = document.createElement('a');
                        link.href = dataUrl;
                        link.download = fileName || 'عکس_آشپزخانه.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    });
                    return;
                }
            } catch (e) {}
        }
        alert('نمای Babylon آماده نیست.');
    }
};

window.OutputManager = OutputManager;
