/**
 * three-bridge.js — پل سازگاری HomeCanvas با Three.js r186
 *
 * نکته: namespace ماژول ESM غیرقابل‌گسترش است؛ نباید THREE.OrbitControls = ... روی خود ماژول نوشت.
 */
import * as ThreeNS from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Post Processing (مرحله 49)
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

const THREE = {};
for (const key of Object.getOwnPropertyNames(ThreeNS)) {
    try { THREE[key] = ThreeNS[key]; } catch (e) { /* ignore */ }
}

THREE.OrbitControls = OrbitControls;
THREE.GLTFLoader = GLTFLoader;
THREE.GLTFExporter = GLTFExporter;

// Post-processing classes on THREE for classic scripts
THREE.EffectComposer = EffectComposer;
THREE.RenderPass = RenderPass;
THREE.UnrealBloomPass = UnrealBloomPass;
THREE.ShaderPass = ShaderPass;
THREE.OutputPass = OutputPass;
THREE.SMAAPass = SMAAPass;
THREE.FXAAShader = FXAAShader;

window.THREE = THREE;

// Color Management r186
if (THREE.ColorManagement) {
    THREE.ColorManagement.enabled = true;
}

const queue = Array.isArray(window.__threeReadyQueue) ? window.__threeReadyQueue.slice() : [];
window.__threeReadyQueue = [];
queue.forEach(function (cb) {
    try { cb(THREE); } catch (err) { console.error('[three-bridge] ready callback error:', err); }
});

window.dispatchEvent(new Event('three-ready'));
console.info('[HomeCanvas] Three.js r' + (THREE.REVISION || '186') + ' bridge ready (OrbitControls, GLTF, PostProcessing)');
