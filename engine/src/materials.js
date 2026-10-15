// Procedural PBR-ish materials: tileable textures generated in JS (deterministic),
// applied with world-space TRIPLANAR mapping (no UV stretching on boxes/instances)
// plus derivative bump mapping from the height channel (alpha).
import * as THREE from 'three';
import { mulberry32 } from './util.js';

// ---------------------------------------------------------------- tileable noise
function hashP(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function tnoise(x, y, P, s) { // value noise with period P
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const m = (a) => ((a % P) + P) % P;
  const a = hashP(m(xi), m(yi), s), b = hashP(m(xi + 1), m(yi), s), c = hashP(m(xi), m(yi + 1), s), d = hashP(m(xi + 1), m(yi + 1), s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function tfbm(x, y, P, oct, s) { let a = 0.5, f = 1, sum = 0, n = 0; for (let i = 0; i < oct; i++) { sum += a * tnoise(x * f, y * f, P * f, s + i * 31); n += a; a *= 0.5; f *= 2; } return sum / n; }

function makeTex(N, fn, srgb = true) {
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const [r, g, b, h] = fn(x / N, y / N);
    const i = (y * N + x) * 4;
    data[i] = Math.max(0, Math.min(255, r * 255)); data[i + 1] = Math.max(0, Math.min(255, g * 255));
    data[i + 2] = Math.max(0, Math.min(255, b * 255)); data[i + 3] = Math.max(0, Math.min(255, h * 255));
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 8; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.needsUpdate = true;
  return t;
}

const cache = {};
export function stoneTexture() { // weathered limestone / marble: pits, sediment, lichen
  return cache.stone ||= makeTex(512, (u, v) => {
    const P = 8, x = u * P, y = v * P;
    const n = tfbm(x, y, P, 5, 1), n2 = tfbm(x * 2, y * 2, P * 2, 4, 2);
    const band = 0.5 + 0.5 * Math.sin((y + 0.6 * tfbm(x * 0.5, y * 0.5, P / 2, 3, 3)) * 9.0);
    const pit = Math.max(0, tfbm(x * 4, y * 4, P * 4, 2, 4) - 0.62) * 4;
    const lich = Math.max(0, tfbm(x * 1.5, y * 1.5, P * 1.5, 4, 5) - 0.6) * 3.2;
    let r = 0.80 + 0.10 * (n - 0.5) + 0.03 * band - 0.25 * pit, g = 0.75 + 0.09 * (n - 0.5) + 0.025 * band - 0.25 * pit, b = 0.64 + 0.08 * (n2 - 0.5) + 0.02 * band - 0.22 * pit;
    const gray = Math.max(0, n2 - 0.55) * 0.6; r -= gray * 0.5; g -= gray * 0.45; b -= gray * 0.35; // grime
    r = r * (1 - lich) + 0.78 * lich; g = g * (1 - lich) + 0.60 * lich; b = b * (1 - lich) + 0.30 * lich; // orange lichen
    return [r, g, b, 0.55 * n + 0.25 * n2 + 0.1 * band - 0.5 * pit];
  });
}
export function rockTexture() { // cliff basalt / sandstone with cracks and strata
  return cache.rock ||= makeTex(512, (u, v) => {
    const P = 6, x = u * P, y = v * P;
    const n = tfbm(x, y, P, 5, 11);
    const cr = 1 - Math.abs(tfbm(x * 1.7, y * 1.7, P * 1.7, 3, 12) * 2 - 1); const crack = Math.pow(cr, 12);
    const strata = 0.5 + 0.5 * Math.sin(y * 14 + n * 6);
    const k = 0.62 + 0.25 * (n - 0.5) + 0.06 * strata - 0.45 * crack;
    const moss = Math.max(0, tfbm(x * 2, y * 2, P * 2, 3, 13) - 0.6) * 2.5;
    return [k * 1.0 * (1 - moss) + 0.36 * moss, k * 0.92 * (1 - moss) + 0.42 * moss, k * 0.82 * (1 - moss) + 0.20 * moss, n * 0.8 + 0.2 * strata - crack];
  });
}
export function grassTexture() { // meadow detail (multiplied with vertex colours)
  return cache.grass ||= makeTex(512, (u, v) => {
    const P = 16, x = u * P, y = v * P;
    const n = tfbm(x, y, P, 5, 21), m = tfbm(x * 3, y * 3, P * 3, 3, 22), blade = tfbm(x * 8, y * 8, P * 8, 2, 23);
    const dirt = Math.max(0, tfbm(x * 0.5, y * 0.5, P / 2, 3, 24) - 0.63) * 3;
    const k = 0.78 + 0.35 * (n - 0.5) + 0.25 * (blade - 0.5);
    return [k * (1 - dirt) + 0.95 * dirt, k * (1 - dirt) + 0.75 * dirt, k * 0.9 * (1 - dirt) + 0.5 * dirt, 0.5 * blade + 0.5 * m];
  });
}

/** MeshStandardMaterial with triplanar world-space texture (rgb=albedo multiplier, a=height). */
export function triplanarMaterial({ tex, scale = 0.02, bump = 1.0, color = 0xffffff, roughness = 0.9, metalness = 0, vertexColors = false, roughVar = 0.25, envMapIntensity = 1 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, vertexColors, envMapIntensity });
  const U = { tTri: { value: tex }, uTriScale: { value: scale }, uBump: { value: bump }, uRoughVar: { value: roughVar } };
  m.userData.tri = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriPos; varying vec3 vTriNrm;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { mat4 mw = modelMatrix;
          #ifdef USE_INSTANCING
            mw = modelMatrix * instanceMatrix;
          #endif
          vTriPos = (mw * vec4(transformed, 1.0)).xyz; vTriNrm = normalize(mat3(mw) * objectNormal); }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D tTri; uniform float uTriScale, uBump, uRoughVar; varying vec3 vTriPos; varying vec3 vTriNrm;
        vec4 triSample(){ vec3 w = pow(abs(normalize(vTriNrm)), vec3(4.0)); w /= (w.x + w.y + w.z);
          vec3 p = vTriPos * uTriScale;
          return texture2D(tTri, p.zy) * w.x + texture2D(tTri, p.xz) * w.y + texture2D(tTri, p.xy) * w.z; }
        vec3 triPerturb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float fd){
          vec3 sx = normalize(dFdx(surf_pos)), sy = normalize(dFdy(surf_pos)); vec3 R1 = cross(sy, surf_norm), R2 = cross(surf_norm, sx);
          float det = dot(sx, R1) * fd; vec3 g = sign(det) * (dHdxy.x * R1 + dHdxy.y * R2); return normalize(abs(det) * surf_norm - g); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec4 triT = triSample(); diffuseColor.rgb *= triT.rgb;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor * (1.0 + uRoughVar * (0.5 - triT.a) * 2.0), 0.04, 1.0);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = triPerturb(-vViewPosition, normal, vec2(dFdx(triT.a), dFdy(triT.a)) * uBump, faceDirection);`);
  };
  m.customProgramCacheKey = () => 'triplanar' + (vertexColors ? 'vc' : '');
  return m;
}

export const rng = mulberry32;
