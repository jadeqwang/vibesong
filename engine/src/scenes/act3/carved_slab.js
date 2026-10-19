// (v4b stage_3d) FIXTURES! / FUNCTIONS! CARVED INTO THE SLABS (targets assets/v4_stills/09_slab_fixtures.png, 10_slab_functions.png).
// (M3, 2026-10-18, Jade: "Carve it") The whole slab is one voxel-stone solid built here: a chipped silhouette (bites out of the
// sides and the top, broken top corners), the word cut `depth` units into the face as real geometry (groove walls + floor), and a
// stone material that does the carving read on its own, whatever the scene's sun does (drop 2's face is in the sun's shade):
//   - a chamfer (normal tilt from a signed-distance field of the cut) along every letter edge and the chipped outer edge, its width
//     varying + little bites (chipped lips): the lip toward the key catches it, the far lip goes dark
//   - a KEY that rakes across the face from the upper left (slab-local `keyDir`, same side as the drop-1 sun as seen by the camera):
//     it lights the groove walls that face it and the lips; the groove floor gets an analytic shadow from the walls (8 taps along the
//     key through the SDF) + an AO falloff into the corners; the walls darken toward the floor
//   - voxel stone on the face: per-voxel tone + normal jitter, mottling, a few cracks, the slab's pencil-scratch hatch (still 09)
//   'graphite'  FIXTURES: the groove floor is dark graphite stone
//   'rainbow'   FUNCTIONS: the groove floor is an unlit HDR rainbow (red -> violet across the word; alpha 0.5 = H11, exempt from the
//               colour script), the groove walls + lips pick up its light; setGlow(u) sweeps it in left to right
// Pure geometry + materials, built once; nothing here depends on t except setGlow().
// RNG: the engine seeds Math.random (main.js) and every THREE object takes 4 draws for its uuid. So the stream after setup stays
// what it was, makeCarvedFace() first replays the M1/M2 build (legacyBuild, same objects in the same order, then dropped) and builds
// the new slab under a local PRNG (Math.random swapped only inside synchronous code).
//
//   const face = await makeCarvedFace({ word: 'FIXTURES', w: 130, h: 183, depth: 5, thick: 9, kind: 'graphite', legacy: { ...M2 args } })
//   group (facing +Z, spanning x -w/2..w/2, y 0..h, front face at z 0, the grooves down to z -depth, the back at z -thick)
//   face.setGlow(0..1, gain); face.outlineTex(flipX) -> alpha texture of the chipped silhouette (for overlays on the back)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadFonts } from '../../core/text.js';
import { patchPaint } from './world/paint.js';

const RAINBOW_FS = /* glsl */`
uniform float uGlow, uGain; varying vec2 vUv;
vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  // red at the left -> violet at the right (0 .. 0.8 of the wheel), a coloured-pencil grain across it
  vec3 c = hue(vUv.x * 0.8);
  float g = h21(floor(vUv * vec2(420.0, 90.0)));
  c *= 0.82 + 0.18 * g;
  // the light fills in from the left (uGlow 0..1 = the sweep front)
  float on = 1.0 - smoothstep(uGlow * 1.15 - 0.15, uGlow * 1.15 - 0.1, vUv.x);
  gl_FragColor = vec4(mix(vec3(0.05, 0.05, 0.06), c * uGain, on), 0.5);   // (H11) alpha 0.5 = exempt from the colour script's pre-flood grade
}`;

/** a letter mask (canvas): 1 inside the word's glyphs. Grid nx x ny cells over the face (row 0 = top). */
function wordMask(word, nx, ny, { letterH, yC, track = 0.06 }) {
  const cv = document.createElement('canvas'); cv.width = nx; cv.height = ny;
  const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, nx, ny);
  const px = Math.round(ny * letterH / 0.73);                       // InterVar caps are ~0.73 em
  g.font = `900 ${px}px InterVar, sans-serif`; g.textBaseline = 'alphabetic';
  // condensed bold caps (the still's carved face): measure, squeeze to 82 % of the width
  const chars = [...word]; const adv = chars.map((c) => g.measureText(c).width); const tr = track * px;
  const wTot = adv.reduce((a, b) => a + b, 0) + tr * (chars.length - 1);
  const maxW = nx * 0.86; const sx = Math.min(0.82, maxW / wTot);
  g.save(); g.translate(nx / 2 - (wTot * sx) / 2, Math.round(ny * (1 - yC) + px * 0.73 / 2)); g.scale(sx, 1);
  g.fillStyle = '#fff'; let x = 0; chars.forEach((c, i) => { g.fillText(c, x, 0); x += adv[i] + tr; }); g.restore();
  const d = g.getImageData(0, 0, nx, ny).data; const m = new Uint8Array(nx * ny);
  for (let i = 0; i < nx * ny; i++) m[i] = d[i * 4] > 110 ? 1 : 0;
  return { m, cv };
}

// ------------------------------------------------------------------------------------------------ the M1/M2 build (RNG replay only)
/** the M1/M2 makeCarvedFace body after its font await, verbatim in what it allocates (geometries, materials, meshes, textures in the
 *  same order), so the seeded Math.random stream after setup is unchanged. Everything it makes is dropped. */
function legacyBuild({ word, w, h, depth = 3, cell = 1.25, letterH = 0.2, yC = 0.6, faceMat = null, kind = 'graphite', hatchMap = null, slab = 4 } = {}) {
  const nx = Math.round(w / cell), ny = Math.round(h / cell); const cw = w / nx, ch = h / ny;
  const { m } = wordMask(word, nx, ny, { letterH, yC });
  const geos = []; let r0 = -1;
  const rowHas = (j) => { for (let i = 0; i < nx; i++) if (m[j * nx + i]) return true; return false; };
  const flushBlock = (a, b) => { if (a < 0) return; const hh = (b - a) * ch; const gg = new THREE.BoxGeometry(w, hh, slab); geos.push(gg); };
  for (let j = 0; j < ny; j++) {
    if (!rowHas(j)) { if (r0 < 0) r0 = j; continue; }
    flushBlock(r0, j); r0 = -1;
    let i = 0;
    while (i < nx) {
      if (m[j * nx + i]) { i++; continue; }
      let k = i; while (k < nx && !m[j * nx + k]) k++;
      geos.push(new THREE.BoxGeometry((k - i) * cw, ch, depth)); i = k;
    }
  }
  flushBlock(r0, ny);
  const geo = mergeGeometries(geos); for (const gg of geos) gg.dispose();
  const mat = faceMat || (() => { const mm = new THREE.MeshStandardMaterial({ color: '#56565e', roughness: 0.42, metalness: 0.1 }); patchPaint(mm, { plaster: 0x5c5c64 }); return mm; })();
  const group = new THREE.Group();
  const face = new THREE.Mesh(geo, mat); group.add(face);
  let floorMat;
  if (kind === 'rainbow') floorMat = new THREE.ShaderMaterial({ uniforms: { uGlow: { value: 1 }, uGain: { value: 3.2 } }, vertexShader: 'void main(){ gl_Position = vec4(0.0); }', fragmentShader: RAINBOW_FS, toneMapped: false });
  else { floorMat = new THREE.MeshStandardMaterial({ color: '#26262c', roughness: 0.9, metalness: 0 }); patchPaint(floorMat, { noPaint: true }); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, h), floorMat); group.add(floor);
  if (hatchMap) {
    const am = new THREE.CanvasTexture(document.createElement('canvas'));
    const hm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: hatchMap, alphaMap: am, transparent: true, depthWrite: false })); group.add(hm);
    hm.geometry.dispose(); hm.material.dispose(); am.dispose();
  }
  geo.dispose(); floor.geometry.dispose(); floorMat.dispose(); if (!faceMat) mat.dispose();
}

// ------------------------------------------------------------------------------------------------ helpers
function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** squared Euclidean distance transform (Felzenszwalb) of a binary grid: 0 at feature cells */
function edt(feat, W, H) {
  const INF = 1e20; const f = new Float64Array(Math.max(W, H)); const d = new Float64Array(Math.max(W, H)); const v = new Int32Array(Math.max(W, H)); const z = new Float64Array(Math.max(W, H) + 1);
  const out = new Float64Array(W * H); for (let i = 0; i < W * H; i++) out[i] = feat[i] ? 0 : INF;
  const pass = (n, get, set) => {
    for (let q = 0; q < n; q++) f[q] = get(q);
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) { let s; do { const p = v[k]; s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p); if (s <= z[k]) k--; else break; } while (k >= 0); k++; v[k] = q; z[k] = s; z[k + 1] = INF; }
    k = 0; for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[p]; }
    for (let q = 0; q < n; q++) set(q, d[q]);
  };
  for (let x = 0; x < W; x++) pass(H, (q) => out[q * W + x], (q, val) => { out[q * W + x] = val; });
  for (let y = 0; y < H; y++) pass(W, (q) => out[y * W + q], (q, val) => { out[y * W + q] = val; });
  return out;
}
/** the slab's pencil-scratch hatch (the same recipe as prebattle_props hatchTex, an own copy so no shared cache changes) */
function hatchTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); let sd = 11; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) { const x = rnd() * 300 - 40, y = rnd() * 300 - 40, L = 30 + rnd() * 70; g.strokeStyle = `rgba(210,212,226,${0.10 + 0.22 * rnd()})`; g.lineWidth = 1 + rnd() * 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + L * 0.8, y - L * 0.6); g.stroke(); }
  for (let i = 0; i < 25; i++) { const x = rnd() * 256, y = rnd() * 256, L = 20 + rnd() * 40; g.strokeStyle = `rgba(20,20,26,${0.25 + 0.3 * rnd()})`; g.lineWidth = 1 + rnd(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + L * 0.6, y + L * 0.8); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ------------------------------------------------------------------------------------------------ shaders
const CARVE_COMMON = /* glsl */`
uniform sampler2D uCvSD, uCvHatch; uniform vec2 uCvWH, uCvHX; uniform float uCvBackK, uCvDepth, uCvBev, uCvKey, uCvGlow, uCvGain, uCvRain, uCvVox, uCvSDR, uCvHatchK;
uniform vec3 uCvKeyDir, uCvKeyCol;
varying vec3 vLP, vLN, vTx, vTy, vTz;
float cH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(cH(i), cH(i + vec2(1.0, 0.0)), f.x), mix(cH(i + vec2(0.0, 1.0)), cH(i + vec2(1.0, 1.0)), f.x), f.y); }
vec2 cUV(vec2 p){ return vec2(p.x / uCvWH.x + 0.5, p.y / uCvWH.y); }
float cSD(vec2 p){ return (texture2D(uCvSD, cUV(p)).r - 0.5) * 2.0 * uCvSDR; }          // > 0 on stone, < 0 in a cut (letter / outside)
float cOut(vec2 p){ return 1.0 - texture2D(uCvSD, cUV(p)).b; }                         // 1 outside the slab's silhouette
vec3 cHue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
float cOn(float hx){ return 1.0 - smoothstep(uCvGlow * 1.15 - 0.15, uCvGlow * 1.15 - 0.1, hx); }
vec3 gNL; float gKeyVis; vec3 gEmit; float gRough; float gMetal;
vec3 carveAlbedo(vec3 base){
  vec2 p = vLP.xy; float z = vLP.z; vec3 n = normalize(vLN);
  gNL = n; gKeyVis = 1.0; gEmit = vec3(0.0); gRough = 0.82; gMetal = 0.0;
  float hx = clamp((p.x - uCvHX.x) / (uCvHX.y - uCvHX.x), 0.0, 1.0); vec3 rb = cHue(hx * 0.8) * uCvGain * cOn(hx) * uCvRain;
  float sd = cSD(p);
  // voxel stone: per-voxel tone, mottling, a few cracks (in the plane of the surface)
  vec2 q = abs(n.z) > 0.5 ? p : (abs(n.x) > 0.5 ? vec2(p.y, z) : vec2(p.x, z));
  vec2 vc = floor(q / uCvVox);
  float tone = cH(vc + 0.37), mott = cN(q * 0.045) * 0.6 + cN(q * 0.13 + 3.1) * 0.4;
  float cr = abs(cN(q * 0.032 + 7.0) - 0.5); float crack = (1.0 - smoothstep(0.004, 0.012, cr)) * step(0.62, cN(q * 0.017 + 11.0));
  vec3 col = base * (0.9 + 0.12 * tone) * (0.84 + 0.3 * mott) * (1.0 - 0.22 * crack);
  if (n.z > 0.5 && z > -0.5 * uCvDepth) {                       // THE FACE
    vec4 ht = texture2D(uCvHatch, p / 60.0); col = mix(col, ht.rgb * 0.95, ht.a * uCvHatchK);
    float e = 0.3; vec2 g = vec2(cSD(p + vec2(e, 0.0)) - cSD(p - vec2(e, 0.0)), cSD(p + vec2(0.0, e)) - cSD(p - vec2(0.0, e))) / (2.0 * e);
    float bw = uCvBev * (0.55 + 0.9 * cN(p * 0.31 + 5.0));
    float chf = 1.0 - smoothstep(0.0, bw, sd);
    vec3 nl = normalize(vec3(-g * chf * 1.25, 1.0));
    nl = normalize(nl + vec3((cH(vc + 1.3) - 0.5) * 0.09, (cH(vc + 2.9) - 0.5) * 0.09, 0.0) + crack * vec3(0.0, 0.25, 0.0));
    float chip = step(0.66, cN(p * 0.38 + 9.0)) * (1.0 - smoothstep(0.0, bw * 2.0, sd));   // chipped lips: rough little bites
    vec2 cc = floor(p * 0.9); nl = normalize(nl + chip * vec3((cH(cc) - 0.5) * 0.6, (cH(cc + 4.0) - 0.5) * 0.6, 0.0));
    col *= 1.0 - 0.22 * chip - 0.12 * chf;
    gNL = nl; gRough = 0.93;   // rough: a smoother face mirrored the horizon as a dark band at the lens height
    gEmit = rb * chf * texture2D(uCvSD, cUV(p - g * 1.5)).g * 0.28;   // the lips round the lit letters catch the rainbow
  } else if (n.z > 0.5) {                                     // THE GROOVE FLOOR (graphite)
    float inC = smoothstep(0.0, 2.2, -sd);
    col *= 0.6 * (0.6 + 0.4 * inC);
    vec2 dir = normalize(uCvKeyDir.xy + vec2(1e-5)); float run = uCvDepth * length(uCvKeyDir.xy) / max(uCvKeyDir.z, 0.2);
    float lit = 1.0; for (int k = 1; k <= 8; k++) lit = min(lit, 1.0 - smoothstep(-0.3, 0.3, cSD(p + dir * run * (float(k) - 0.5) / 8.0)));
    gKeyVis = lit; gRough = 0.97;
  } else if (n.z < -0.5) {                                    // the back (drop 1: the plank's top once it lies down): the leaf's darker gloss
    col = mix(col, mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 0.55) * 0.72, uCvBackK); gRough = mix(gRough, 0.34, uCvBackK); gMetal = 0.12 * uCvBackK;   // drop 1: matched to the M2 plank (93.2)
  } else {                                                    // WALLS (groove walls + the chipped outer sides)
    float outer = cOut(p + n.xy * 0.7);
    float dz = clamp((z + uCvDepth) / uCvDepth, 0.0, 1.0);
    col *= mix(mix(0.42, 0.92, dz), 0.95, outer);
    col = mix(col, mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 0.55) * 0.76, outer * uCvBackK);   // the chipped outer sides read like the back
    gNL = normalize(n + vec3(0.0, 0.0, (cH(vc + 5.1) - 0.5) * 0.12));
    gEmit = rb * (1.0 - outer) * (0.55 - 0.35 * dz);
    gRough = 0.92;
  }
  return col;
}`;

function faceMaterial({ backK = 0, color, sdTex, hatch, w, h, depth, bev, keyDir, key, keyCol, hx, rain, vox, sdr, hatchK }) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.0 });
  m.userData.noPaint = true; m.userData.flatPatched = true;   // its own stone: never re-patched to plaster
  const U = {
    uCvSD: { value: sdTex }, uCvHatch: { value: hatch }, uCvWH: { value: new THREE.Vector2(w, h) }, uCvHX: { value: new THREE.Vector2(hx[0], hx[1]) },
    uCvBackK: { value: backK }, uCvDepth: { value: depth }, uCvBev: { value: bev }, uCvKey: { value: key }, uCvGlow: { value: 1 }, uCvGain: { value: 1.8 }, uCvRain: { value: rain ? 1 : 0 },
    uCvVox: { value: vox }, uCvSDR: { value: sdr }, uCvHatchK: { value: hatchK }, uCvKeyDir: { value: keyDir.clone().normalize() }, uCvKeyCol: { value: new THREE.Color(keyCol) },
  };
  m.userData.carveU = U;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLP, vLN, vTx, vTy, vTz;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vLP = position; vLN = normal;
        vTx = normalize(normalMatrix * vec3(1.0, 0.0, 0.0)); vTy = normalize(normalMatrix * vec3(0.0, 1.0, 0.0)); vTz = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + CARVE_COMMON)
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = carveAlbedo(diffuseColor.rgb);')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = gRough;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n metalnessFactor = gMetal;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n normal = normalize(gNL.x * vTx + gNL.y * vTy + gNL.z * vTz);')
      .replace('#include <opaque_fragment>', `
        outgoingLight += diffuseColor.rgb * uCvKeyCol * uCvKey * max(dot(gNL, uCvKeyDir), 0.0) * gKeyVis + gEmit;   // (M3) the raking key + the rainbow spill
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'carvedM3';
  return m;
}

const FLOOR_VS = 'varying vec3 vLP; void main(){ vLP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FLOOR_FS = /* glsl */`
uniform float uGlow, uGain, uSDR; uniform vec2 uHX, uWH; uniform sampler2D uSD; varying vec3 vLP;
vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  float hx = clamp((vLP.x - uHX.x) / (uHX.y - uHX.x), 0.0, 1.0);
  vec3 c = hue(hx * 0.8);                                             // red at the left -> violet at the right of the word
  c *= 0.84 + 0.16 * h21(floor(vLP.xy * vec2(2.2, 0.6)));             // a coloured-pencil grain
  float sd = (texture2D(uSD, vec2(vLP.x / uWH.x + 0.5, vLP.y / uWH.y)).r - 0.5) * 2.0 * uSDR;
  c *= 0.62 + 0.5 * smoothstep(0.0, 1.8, -sd);                        // the core of each stroke burns brighter than its edges
  float on = 1.0 - smoothstep(uGlow * 1.15 - 0.15, uGlow * 1.15 - 0.1, hx);   // the light fills in from the left (uGlow = the sweep front)
  gl_FragColor = vec4(mix(vec3(0.05, 0.05, 0.06), c * uGain, on), 0.5);       // (H11) alpha 0.5 = exempt from the colour script's grade
}`;

// ------------------------------------------------------------------------------------------------ the slab
/**
 * makeCarvedFace({ word, w, h, depth, thick, cell, letterH, yC, kind, color, chip, seed, keyDir, key, legacy })
 *  w, h       face size (world units); depth: groove depth; thick: the whole slab's thickness (front z 0 -> back z -thick)
 *  cell       voxel size of the solid (letters + chips are cut on this grid)
 *  letterH    cap height as a fraction of h; yC: the text's vertical centre (fraction of h from the bottom)
 *  kind       'graphite' | 'rainbow'
 *  chip       max depth of the bites out of the sides / top (units); chipBottom: also the bottom edge
 *  keyDir     the raking key, slab-local (default from the upper left as the camera sees the face); key: its intensity
 *  legacy     the M1/M2 call's options (RNG replay, see the header); omit to skip the replay
 */
export async function makeCarvedFace(o = {}) {
  await loadFonts(['sans']);
  if (o.legacy) legacyBuild(o.legacy);
  const R0 = Math.random; Math.random = mulberry(0x5eed ^ (o.seed ?? 1));
  try { return buildSlab(o); } finally { Math.random = R0; }
}

function buildSlab({ word, w, h, depth = 5, thick = 9, cell = 0.6, letterH = 0.2, yC = 0.6, kind = 'graphite', color = '#7c7c86', chip = 4, chipBottom = false, seed = 1,
  keyDir = new THREE.Vector3(-0.62, 0.52, 0.58), key = 1.6, backK = 0, keyCol = '#ffe2c4', bev = 1.3, vox = 1.2, hatchK = 0.55 } = {}) {
  const rnd = mulberry(seed * 7919 + 13);
  const nx = Math.round(w / cell), ny = Math.round(h / cell); const cw = w / nx, ch = h / ny;
  const L = wordMask(word, nx, ny, { letterH, yC }).m;
  // ---- the chipped silhouette O (1 = stone). Insets in cells per row (left / right) and per column (top / bottom)
  const bites = (n) => { const a = new Float32Array(n); let i = 0; const cd = chip / Math.min(cw, ch);
    // angular bites (a sharp break, a long ramp out: flaked stone), 8-30 u apart, straight edges between them
    while (i < n) { i += Math.round((8 + rnd() * 22) / cell); if (i >= n) break; const len = Math.max(3, Math.round((4 + rnd() * 12) / cell)); const dp = cd * (0.35 + 0.65 * rnd()); const pk = 0.15 + 0.3 * rnd();
      for (let k = 0; k < len && i + k < n; k++) { const u = (k + 0.5) / len; const s = u < pk ? u / pk : (1 - u) / (1 - pk); a[i + k] = Math.max(a[i + k], dp * s); } i += len; }
    return a; };
  const inL = bites(ny), inR = bites(ny), inT = bites(nx), inB = chipBottom ? bites(nx) : new Float32Array(nx);
  const corner = (cx, cy, r) => ({ cx, cy, r });
  const cRad = () => (chip * (1.2 + rnd() * 1.0)) / cell;
  const corners = [corner(0, 0, cRad()), corner(nx - 1, 0, cRad())]; if (chipBottom) corners.push(corner(0, ny - 1, cRad()), corner(nx - 1, ny - 1, cRad()));
  const O = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    let s = i >= Math.round(inL[j]) && i < nx - Math.round(inR[j]) && j >= Math.round(inT[i]) && j < ny - Math.round(inB[i]);
    for (const c of corners) { const dx = i - c.cx, dy = j - c.cy; const a = Math.atan2(dy, dx); if (dx * dx + dy * dy < c.r * c.r * (0.75 + 0.35 * Math.sin(a * 5 + c.r))) s = false; }
    O[j * nx + i] = s ? 1 : 0;
  }
  // cell state: 0 air, 1 groove (stone below -depth), 2 full stone
  const S = new Uint8Array(nx * ny); for (let k = 0; k < nx * ny; k++) S[k] = O[k] ? (L[k] ? 1 : 2) : 0;
  const st = (i, j) => (i < 0 || j < 0 || i >= nx || j >= ny ? 0 : S[j * nx + i]);
  const zTop = (s) => (s === 2 ? 0 : s === 1 ? -depth : null);
  // ---- the mesh: merged quads (front / floor / back runs per row, walls merged along their edge)
  const P = [], N = [], UV = [], I0 = [], I1 = [];   // I0: stone material, I1: rainbow floor
  const X = (i) => -w / 2 + i * cw, Y = (j) => h - j * ch;
  const quad = (a, b, c, d, n, idx) => { const v0 = P.length / 3; for (const p of [a, b, c, d]) { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); UV.push((p[0] + w / 2) / w, p[1] / h); }
    idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3); };
  // horizontal runs of a predicate per row, merged with identical runs on following rows
  const rects = (pred) => { const out = []; let open = new Map();
    for (let j = 0; j <= ny; j++) { const runs = new Map();
      if (j < ny) { let i = 0; while (i < nx) { if (!pred(i, j)) { i++; continue; } let k = i; while (k < nx && pred(k, j)) k++; runs.set(i + ':' + k, [i, k]); i = k; } }
      for (const [key2, r] of open) if (!runs.has(key2)) { out.push([r[0], r[1], r[2], j]); open.delete(key2); }
      for (const [key2, r] of runs) if (!open.has(key2)) open.set(key2, [r[0], r[1], j]);
    }
    return out; };   // [i0, i1, j0, j1)
  for (const [i0, i1, j0, j1] of rects((i, j) => st(i, j) === 2)) quad([X(i0), Y(j1), 0], [X(i1), Y(j1), 0], [X(i1), Y(j0), 0], [X(i0), Y(j0), 0], [0, 0, 1], I0);
  for (const [i0, i1, j0, j1] of rects((i, j) => st(i, j) === 1)) quad([X(i0), Y(j1), -depth], [X(i1), Y(j1), -depth], [X(i1), Y(j0), -depth], [X(i0), Y(j0), -depth], [0, 0, 1], kind === 'rainbow' ? I1 : I0);
  for (const [i0, i1, j0, j1] of rects((i, j) => st(i, j) > 0)) quad([X(i1), Y(j1), -thick], [X(i0), Y(j1), -thick], [X(i0), Y(j0), -thick], [X(i1), Y(j0), -thick], [0, 0, -1], I0);
  // walls: between a cell and its neighbour where the neighbour's top is lower (air: down to the back)
  const wallSpan = (a, b) => { const za = zTop(a); if (za == null) return null; const zb = b === 0 ? -thick : zTop(b); return zb < za - 1e-6 ? [za, zb] : null; };
  // vertical walls (normal -x on a cell's left edge, +x on its right edge), merged down the column
  for (const side of [-1, 1]) for (let i = 0; i < nx; i++) { let j0 = -1, cur = null;
    const flush = (j) => { if (cur) { const x = side < 0 ? X(i) : X(i + 1); const [zt, zb] = cur;
      if (side < 0) quad([x, Y(j), zb], [x, Y(j), zt], [x, Y(j0), zt], [x, Y(j0), zb], [-1, 0, 0], I0); else quad([x, Y(j), zt], [x, Y(j), zb], [x, Y(j0), zb], [x, Y(j0), zt], [1, 0, 0], I0); } cur = null; };
    for (let j = 0; j <= ny; j++) { const sp = j < ny ? wallSpan(st(i, j), st(i + side, j)) : null; const key2 = sp ? sp.join() : '';
      if (cur && cur.join() === key2) continue; flush(j); if (sp) { cur = sp; j0 = j; } } }
  // horizontal walls (normal +y on a cell's top edge, -y on its bottom edge), merged along the row
  for (const side of [-1, 1]) for (let j = 0; j < ny; j++) { let i0 = -1, cur = null;   // side -1: the neighbour above (j-1) -> normal +y
    const flush = (i) => { if (cur) { const y = side < 0 ? Y(j) : Y(j + 1); const [zt, zb] = cur;
      if (side < 0) quad([X(i0), y, zt], [X(i), y, zt], [X(i), y, zb], [X(i0), y, zb], [0, 1, 0], I0); else quad([X(i0), y, zb], [X(i), y, zb], [X(i), y, zt], [X(i0), y, zt], [0, -1, 0], I0); } cur = null; };
    for (let i = 0; i <= nx; i++) { const sp = i < nx ? wallSpan(st(i, j), st(i, j + side)) : null; const key2 = sp ? sp.join() : '';
      if (cur && cur.join() === key2) continue; flush(i); if (sp) { cur = sp; i0 = i; } } }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  geo.setIndex([...I0, ...I1]); geo.addGroup(0, I0.length, 0); if (I1.length) geo.addGroup(I0.length, I1.length, 1);
  geo.computeBoundingBox(); geo.computeBoundingSphere();
  // ---- the signed distance field of the cut (letters + outside), k texels per cell; G = letter, B = silhouette
  const k = 2, TW = nx * k, TH = ny * k, cut = new Uint8Array(TW * TH), stone = new Uint8Array(TW * TH);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const s = S[Math.floor(y / k) * nx + Math.floor(x / k)]; cut[y * TW + x] = s !== 2 ? 1 : 0; stone[y * TW + x] = s === 2 ? 1 : 0; }
  const dOut = edt(cut, TW, TH), dIn = edt(stone, TW, TH); const SDR = 6; const pxU = k / Math.min(cw, ch);
  const data = new Uint8Array(TW * TH * 4);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const src = y * TW + x, dst = ((TH - 1 - y) * TW + x) * 4; const s = S[Math.floor(y / k) * nx + Math.floor(x / k)];
    const sd = (s === 2 ? Math.sqrt(dOut[src]) - 0.5 : -(Math.sqrt(dIn[src]) - 0.5)) / pxU;
    data[dst] = Math.max(0, Math.min(255, Math.round((sd / SDR * 0.5 + 0.5) * 255))); data[dst + 1] = s === 1 ? 255 : 0; data[dst + 2] = s ? 255 : 0; data[dst + 3] = 255; }
  const sdTex = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat); sdTex.magFilter = sdTex.minFilter = THREE.LinearFilter; sdTex.generateMipmaps = false; sdTex.needsUpdate = true;
  // the word's x extent (the rainbow runs across the word, not the slab)
  let ix0 = nx, ix1 = 0; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (L[j * nx + i]) { ix0 = Math.min(ix0, i); ix1 = Math.max(ix1, i + 1); }
  const hx = [X(ix0), X(ix1)];
  const hatch = hatchTexture();
  const mat = faceMaterial({ backK, color, sdTex, hatch, w, h, depth, bev, keyDir, key, keyCol, hx, rain: kind === 'rainbow', vox, sdr: SDR, hatchK });
  const mats = [mat];
  let FU = null;
  if (kind === 'rainbow') {
    FU = { uGlow: { value: 1 }, uGain: { value: 1.8 }, uSDR: { value: SDR }, uHX: { value: new THREE.Vector2(hx[0], hx[1]) }, uWH: { value: new THREE.Vector2(w, h) }, uSD: { value: sdTex } };
    const fm = new THREE.ShaderMaterial({ uniforms: FU, vertexShader: FLOOR_VS, fragmentShader: FLOOR_FS, toneMapped: false }); fm.userData.noPaint = true; mats.push(fm);
  }
  const group = new THREE.Group(); group.name = 'carved_' + word;
  const face = new THREE.Mesh(geo, kind === 'rainbow' ? mats : mat); face.castShadow = face.receiveShadow = true; group.add(face);
  // the silhouette as an alpha texture (flipX: for a plane on the back that faces the other way)
  const oc = document.createElement('canvas'); oc.width = nx; oc.height = ny; { const g = oc.getContext('2d'); const id = g.createImageData(nx, ny);
    for (let q = 0; q < nx * ny; q++) { const v = O[q] ? 255 : 0; id.data[q * 4] = id.data[q * 4 + 1] = id.data[q * 4 + 2] = v; id.data[q * 4 + 3] = 255; } g.putImageData(id, 0, 0); }
  const outl = [false, true].map((flip) => { const t = new THREE.CanvasTexture(oc); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    if (flip) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; } return t; });
  const U = mat.userData.carveU;
  return {
    group, face, floor: null, w, h, depth, thick, material: mat,
    /** FUNCTIONS: the rainbow fills the grooves left to right (0..1); graphite: no-op */
    setGlow(u, gain = 1.8) { if (FU) { FU.uGlow.value = u; FU.uGain.value = gain; U.uCvGlow.value = u; U.uCvGain.value = gain; } },
    /** the raking key's intensity (slab-local direction fixed) */
    setKey(v) { U.uCvKey.value = v; },
    outlineTex(flipX = false) { return outl[flipX ? 1 : 0]; },
  };
}
