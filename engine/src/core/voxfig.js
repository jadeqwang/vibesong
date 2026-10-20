// Sculpted voxel hero figures (density team, phase 2, 2026-10-15).
//
// The keyframes (k07 / k08b) show the heroes as volumetric voxel figures (chibi, rounded heads, real depth, readable from
// behind and from 3/4), not extruded sprites. This module CARVES each hero from orthographic turnaround views and RIGS it:
//   1. visual hull: a voxel is solid when the side, front and back silhouettes all cover it
//   2. rounding: every horizontal slice of the hull is a union of boxes (side interval x front interval); each box is
//      replaced by its inscribed superellipse, and thin boxes get a near-round cross-section (arms / legs become limbs)
//   3. colour: each surface voxel takes its colour from the view that faces it (front / back / side)
//   4. parts: head, torso, upper / lower arms, thighs / shins split at the joint rows, each a face-culled mesh with baked
//      AO (voxel.js meshVoxelGrid) under a pivot group, posed procedurally per Actor anim name (poses below)
// Views: assets/sprites/turn/turnaround.json (ART_REQUESTS A-4, served at /sprites/turn/) when present, else built-in
// stand-in turnarounds drawn on a canvas here (same layout), so the pipeline runs before the art lands.
//
// Model space: feet centre at the origin, y up, the hero FACES +x (direction of travel), +z = the hero's right side, so a
// camera at +z sees the right profile (= the 2D side view, as the extruded sprites did).
import * as THREE from 'three';
import { meshVoxelGrid } from '../voxel.js';
import { nativeModel } from './heromodels/heroes.js';

/** FIGURE SOURCE SWITCH (MODELS team, 2026-10-15). 'carve' = the figures carved from the A-4 turnarounds (shipped, default);
 *  'native' = the 3D-native part models of core/heromodels/ (adult, ~96 voxels, ~5.5 heads). Pending Jade's review gate:
 *  do not flip the default here until it passes. Override per page with ?fig=native (render tools) or globalThis.FIGURE_SRC. */
export const FIGURE_SRC = (() => { try { const q = new URLSearchParams(globalThis.location?.search || '').get('fig'); if (q === 'native' || q === 'carve') return q; } catch (e) { /* no location */ }
  return globalThis.FIGURE_SRC === 'native' ? 'native' : 'carve'; })();
/**
 * Shader half of the native figures' voxel-edge ring (voxel.js edgeAttr): darken by `edge` toward each voxel face's border
 * (attribute voxEdge), faded out as a voxel shrinks below ~6 px on screen (gone at 2.5 px), so distant figures don't shimmer.
 * Chains any existing onBeforeCompile; meshes without the attribute read 0 (no effect). Idempotent per material.
 */
export function patchVoxelEdges(material, voxelWorldSize, edge = 0.2) {
  if (material.userData.voxEdges) { material.userData.voxEdges.uVoxSize.value = voxelWorldSize; return material; }
  const U = { uVoxSize: { value: voxelWorldSize }, uVoxEdge: { value: edge } }; material.userData.voxEdges = U;
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(material, sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float voxEdge; varying float vVoxEdge;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvVoxEdge = voxEdge;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vVoxEdge; uniform float uVoxSize, uVoxEdge;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ float wpp = max(length(fwidth(vViewPosition)), 1e-6); float fade = smoothstep(2.5, 6.0, uVoxSize / wpp); diffuseColor.rgb *= 1.0 - uVoxEdge * vVoxEdge * fade; }');
  };
  const pk = material.customProgramCacheKey; material.customProgramCacheKey = () => (pk ? pk.call(material) : '') + '|voxEdge';
  material.needsUpdate = true; return material;
}
/** r6 RIG SWITCH (models_r6): the split rig (pelvis + chest, ankle + foot + toe, wrist + fingers, springs, face states). It only
 *  exists on native models built at --figres 2.5 (heroes.js HI); there it is ON by default (coordinator 2026-10-16, after
 *  motion_r2's check). Opt out per page with ?figrig=0 (render.js / models_shots.js --figrig 0) or globalThis.FIGRIG = false, or
 *  per figure with buildFigure(model, mat, { rig: false }). Carve and native 1.25 have no rig data: unchanged either way. */
export const FIGRIG = (() => { try { const q = new URLSearchParams(globalThis.location?.search || '').get('figrig'); if (q !== null) return !(q === '0' || q === 'false'); } catch (e) { /* no location */ }
  return globalThis.FIGRIG !== false; })();
/** model for a hero variant ('jade_up' | 'jade_down' | 'charlie' | 'charlie_nohat' | 'ricky') from the active source */
export function figureModel(vname, turn, src = FIGURE_SRC) {
  if (src === 'native') return nativeModel(vname);
  const V = turn.heroes[vname]; return carveFigure(V, { u: turn.unitsPerPx ?? (V.source === 'art' ? 0.64 : 0.6) });
}

const HEROES = ['jade_up', 'jade_down', 'charlie', 'ricky'];
const D2R = Math.PI / 180;

// ------------------------------------------------------------------------------------------------ loading
async function loadImg(url) { const img = new Image(); img.src = url; await img.decode(); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, img.height); }
/** the pixel art's 1-px dark silhouette outline would become a black shell around the 3D figure: recolour outline pixels
 *  (dark + touching transparency) from their brighter interior neighbour, darkened a little (in place) */
function deOutline(img) {
  const W = img.width, H = img.height, d = img.data, src = d.slice();
  const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && src[(y * W + x) * 4 + 3] >= 128;
  const lum = (i) => (0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2]) / 255;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!op(x, y) || lum(i) > 0.17) continue;
    if (op(x - 1, y) && op(x + 1, y) && op(x, y - 1) && op(x, y + 1)) continue;
    let best = -1, bl = 0.2; for (let r = 1; r <= 2 && best < 0; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (!op(x + dx, y + dy)) continue; const j = (y + dy) * W + x + dx; const l = lum(j); if (l > bl) { bl = l; best = j; } }
    if (best < 0) continue; for (let c = 0; c < 3; c++) d[i * 4 + c] = Math.round(src[best * 4 + c] * 0.8); }
  return img;
}
/** Load turnaround views: { heroes: { jade_up: { front, side, back (ImageData), baseline, cx, joints, armGap, source } }, items, unitsPerPx } */
export async function loadTurnarounds(base = '/sprites/') {
  const out = { heroes: {}, items: {}, unitsPerPx: null };
  let J = null;
  try { const r = await fetch(base + 'turn/turnaround.json', { cache: 'no-store' }); if (r.ok) J = await r.json(); } catch (e) { J = null; }
  if (J && J.views) {   // art dept schema (tools/sprites/a4_turn.py): views{ turn_<hero>_<view>: { file, baseline_y, centre_x, parts } }, items{}
    out.unitsPerPx = J.unitsPerPx ?? null;
    const V = J.views; const bl = J.baseline_y ?? 95, c0 = J.centre_x ?? 36;
    const jointsFrom = (P) => { if (!P || !P.head || !P.torso || !P.legs || !P.arm_r) return null; const sh = P.torso[1] + 2, hip = P.legs[1], armB = Math.max(P.arm_r[3], P.arm_l ? P.arm_l[3] : 0);
      return { neck: P.head[3], shoulder: sh, elbow: Math.round(sh + (armB - sh) * 0.48), wrist: armB - 5, hip, knee: Math.round(hip + (bl - hip) * 0.5) }; };
    const armsFrom = (P) => P && P.arm_r && P.arm_l ? { R: P.arm_r, L: P.arm_l } : null;
    for (const name of HEROES) {
      try {
        const v = {}; for (const k of ['front', 'side', 'back']) { const e = V[`turn_${name}_${k}`]; if (!e) continue; const raw = await loadImg(base + e.file); v[k + 'Parts'] = e.parts; if (name === 'charlie') v[k + 'Raw'] = new ImageData(new Uint8ClampedArray(raw.data), raw.width, raw.height); v[k] = { img: deOutline(raw), baseline: e.baseline_y ?? bl, cx: e.centre_x ?? c0, parts: e.parts }; }
        if (!v.front || !v.side) continue;
        const ref = name === 'jade_down' ? V.turn_jade_up_front?.parts : v.front.parts; const refB = name === 'jade_down' ? V.turn_jade_up_back?.parts : v.back?.parts;
        out.heroes[name] = { ...v, joints: jointsFrom(ref), arms: armsFrom(ref), armsBack: armsFrom(refB), source: 'art' };
      } catch (e) { console.warn('[voxfig] turnaround ' + name + ' failed: ' + e.message); }
    }
    if (out.heroes.charlie?.source === 'art') out.heroes.charlie_nohat = hatless(out.heroes.charlie);
    if (out.heroes.jade_up?.source === 'art' && out.heroes.jade_down?.source === 'art') out.heroes.jade_down = hairDownOnUp(out.heroes.jade_up, out.heroes.jade_down);
    for (const [k, e] of Object.entries(J.items || {})) { try { const im0 = deOutline(await loadImg(base + e.file)); out.items[k] = { img: cleanLines(quantise(im0, buildPalette([im0])), 0), pivot: e.pivot }; } catch (err) { console.warn('[voxfig] item ' + k + ': ' + err.message); } }
  } else if (J) {
    out.unitsPerPx = J.unitsPerPx ?? null;
    for (const [name, h] of Object.entries(J.heroes || {})) {
      try {
        const v = {}; for (const k of ['front', 'side', 'back']) { const e = h[k]; if (!e) continue; const f = typeof e === 'string' ? e : e.file;
          v[k] = { img: await loadImg(base + 'turn/' + f), baseline: (typeof e === 'object' && e.baseline != null) ? e.baseline : h.baseline, cx: (typeof e === 'object' && e.cx != null) ? e.cx : h.cx }; }
        if (v.front && v.side) out.heroes[name] = { ...v, joints: h.joints || null, armGap: h.armGap ?? null, source: 'art' };
      } catch (e) { console.warn('[voxfig] turnaround ' + name + ' failed: ' + e.message); }
    }
  }
  for (const n of HEROES) if (!out.heroes[n]) out.heroes[n] = standin(n);
  return out;
}

/** Jade hair-down = the hair-up body (identical jacket / arms / pose; its arm boxes are clean) + the hair-down head and the
 *  long hair: above the neck the hair-down view as drawn; below it the hair-up pixels, plus hair-down hair only where the
 *  hair-up body is transparent (hair beside the body, down the back in the side / back views). The joints / arm boxes of
 *  jade_up apply (the hair-down art's part boxes are distorted by the hair). */
function hairDownOnUp(up, dn) {
  const neckY = up.joints?.neck ?? 41;
  const mix = (U, D, frontView) => {
    const a = U.img, b = D.img, W = a.width, H = a.height, o = new ImageData(W, H), od = o.data, ad = a.data, bd = b.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4;
      const useD = y <= neckY ? true : (ad[i + 3] < 128 && bd[i + 3] >= 128 && (!frontView || y < neckY + 22));
      const src = useD ? bd : ad; od[i] = src[i]; od[i + 1] = src[i + 1]; od[i + 2] = src[i + 2]; od[i + 3] = src[i + 3]; }
    return { ...D, img: o };
  };
  return { ...dn, front: mix(up.front, dn.front, true), side: mix(up.side, dn.side, false), back: dn.back && up.back ? mix(up.back, dn.back, false) : dn.back,
    joints: up.joints, arms: up.arms, armsBack: up.armsBack, frontParts: up.frontParts, sideParts: up.sideParts, backParts: up.backParts };
}

/** Charlie without his flat cap (hat in the air / used as parachute, trampoline, shield): every cap pixel in the head box
 *  becomes curly dark-brown hair, the brim that sticks out past the face in the side view is cut away. */
const CAP = [[210, 165, 110], [193, 146, 92], [176, 130, 78], [228, 186, 130], [160, 118, 70], [168, 122, 71], [185, 138, 85], [209, 161, 103], [189, 141, 84]], CURL = [[54, 29, 10], [70, 38, 12], [38, 21, 8], [96, 49, 14], [44, 27, 11]];
function hatless(h) {
  const near = (d, i, set, tol = 14) => set.some((c) => Math.abs(d[i] - c[0]) + Math.abs(d[i + 1] - c[1]) + Math.abs(d[i + 2] - c[2]) < tol);
  const fix = (raw, parts, side) => {
    const img = new ImageData(new Uint8ClampedArray(raw.data), raw.width, raw.height), d = img.data, W = img.width; const hb = parts?.head || [0, 0, W - 1, 30];
    const capBot = hb[1] + Math.round((hb[3] - hb[1]) * 0.48);       // the cap covers the top ~half of the head box
    let faceX = -1; if (side) for (let y = capBot; y <= hb[3]; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (d[i + 3] > 127 && near(d, i, [[228, 166, 126], [212, 154, 105]], 30)) faceX = Math.max(faceX, x); }
    if (side && faceX > 0) for (let y = hb[1] - 2; y <= capBot + 3; y++) for (let x = faceX + 1; x < W; x++) d[(y * W + x) * 4 + 3] = 0;   // the brim, any shade
    for (let y = hb[1] - 2; y <= capBot; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (d[i + 3] < 128) continue;
      const isCap = near(d, i, CAP, 10) || (d[i] + d[i + 1] + d[i + 2] < 30);      // cap shades + its black seam lines
      if (!isCap) continue;
      if (side && faceX > 0 && x > faceX) { d[i + 3] = 0; continue; }       // the brim
      const c = CURL[((x * 7 + y * 13) ^ (x * y)) % CURL.length]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
    return deOutline(img);
  };
  const v = { ...h }; v.front = { ...h.front, img: fix(h.frontRaw, h.frontParts, false) }; v.side = { ...h.side, img: fix(h.sideRaw, h.sideParts, true) };
  if (h.back) v.back = { ...h.back, img: fix(h.backRaw, h.backParts, false) };
  return v;
}

// ------------------------------------------------------------------------------------------------ stand-in turnarounds
// 48 x 86 px, baseline 85, cx 24 (front / back), side cx 24. Chibi proportions as in k08b (head ~1/3 of the height).
const W0 = 48, H0 = 86, BL = 85, CX = 24;
const PAL = {
  jade: { skin: '#f0c29c', skinD: '#d9a27c', hair: '#1c1616', hairH: '#3a2c2c', jacket: '#f5f3ef', jacketD: '#d9d6d0', stripe: '#ff7a1a', top: '#1b1b22', pants: '#1f2a4a', pantsD: '#18213b', strap: '#ff7a1a', shoe: '#f2f2f2', sole: '#b9b9bf', dot: '#8cc8ff', eye: '#1a1414', mouth: '#c4504a', blush: '#f2a08c' },
  charlie: { skin: '#dba277', skinD: '#c08560', hair: '#3a2618', hairH: '#5a3c26', cap: '#cdae74', capD: '#a88a54', tee: '#3c3c42', teeD: '#2e2e33', jeans: '#2f5ea8', jeansD: '#264e8e', boot: '#6b4428', bootD: '#4f3120', eye: '#1a1414', mouth: '#a65040' },
  ricky: { skin: '#c98d5e', skinD: '#ab734a', hair: '#121212', hairH: '#2a2a2a', s1: '#5b8fd6', s2: '#f2f4f8', jeans: '#2f5ea8', jeansD: '#264e8e', shoe: '#f2f2f2', sole: '#b9b9bf', eye: '#141010', mouth: '#a65040' },
};
const FONT = { R: ['110', '101', '110', '101', '101'], A: ['010', '101', '111', '101', '101'], E: ['111', '100', '110', '100', '111'], T: ['111', '010', '010', '010', '010'], H: ['101', '101', '111', '101', '101'] };
function canvasView(w = W0, h = H0) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const V = {
    g, cv,
    rect(x0, y0, x1, y1, c) { g.fillStyle = c; g.fillRect(Math.round(x0), Math.round(y0), Math.round(x1) - Math.round(x0), Math.round(y1) - Math.round(y0)); return V; },
    px(x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); return V; },
    ell(cx, cy, rx, ry, c, test) { g.fillStyle = c; for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v <= 1 && (!test || test(x, y))) g.fillRect(x, y, 1, 1); } return V; },
    text(str, x, y, c) { let xx = x; for (const ch of str) { const f = FONT[ch]; if (f) f.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') V.px(xx + i, y + j, c); })); xx += 4; } return V; },
    data() { return g.getImageData(0, 0, w, h); },
  };
  return V;
}
// shared lower body: legs + shoes (front/back view), and side view
function legsFront(V, p, { pants, pantsD, shoe, sole, strap, boots = false }) {
  V.rect(CX - 11, 60, CX + 11, 67, pants);                                        // hips
  for (const s of [-1, 1]) { const x0 = s < 0 ? CX - 11 : CX + 1, x1 = s < 0 ? CX - 1 : CX + 11;
    V.rect(x0, 66, x1, 80, pants); V.rect(s < 0 ? x0 : x1 - 2, 66, s < 0 ? x0 + 2 : x1, 80, pantsD);
    if (strap) V.rect(s < 0 ? x0 + 1 : x1 - 2, 68, s < 0 ? x0 + 2 : x1 - 1, 79, strap);
    V.rect(x0 - (s < 0 ? 1 : 0), 79, x1 + (s > 0 ? 1 : 0), 85, shoe); V.rect(x0 - (s < 0 ? 1 : 0), 84, x1 + (s > 0 ? 1 : 0), 85, sole); }
}
function legsSide(V, { pants, pantsD, shoe, sole, strap }) {
  V.rect(CX - 8, 60, CX + 9, 67, pants); V.rect(CX - 6, 66, CX + 7, 80, pants); V.rect(CX - 6, 66, CX - 4, 80, pantsD);
  if (strap) V.rect(CX, 67, CX + 2, 79, strap);
  V.rect(CX - 7, 79, CX + 12, 85, shoe); V.rect(CX - 7, 84, CX + 12, 85, sole);
}
function armsFront(V, sleeve, sleeveD, hand, { stripe, rolled } = {}) {
  for (const s of [-1, 1]) { for (let y = 38; y < 61; y++) { const out = Math.floor((y - 38) / 12); const x0 = s < 0 ? CX - 18 - out : CX + 13 + out; const c = y >= 56 ? hand : (rolled && y >= 49 ? hand : sleeve);
      V.rect(x0, y, x0 + 5, y + 1, c); if (y < 56 && !(rolled && y >= 49)) V.px(s < 0 ? x0 : x0 + 4, y, sleeveD); if (stripe && y > 41 && y < 54 && (y % 5 === 0 || y % 5 === 1)) V.rect(x0, y, x0 + 5, y + 1, stripe); } }
}
function standin(name) {
  const hero = name.startsWith('jade') ? 'jade' : name; const P = PAL[hero]; const down = name === 'jade_down';
  const F = canvasView(), S = canvasView(), B = canvasView();
  // ---------------- lower body
  if (hero === 'jade') { const L = { pants: P.pants, pantsD: P.pantsD, shoe: P.shoe, sole: P.sole, strap: P.strap }; legsFront(F, P, L); legsFront(B, P, L); legsSide(S, L); }
  else if (hero === 'charlie') { const L = { pants: P.jeans, pantsD: P.jeansD, shoe: P.boot, sole: P.bootD }; legsFront(F, P, L); legsFront(B, P, L); legsSide(S, L); }
  else { const L = { pants: P.jeans, pantsD: P.jeansD, shoe: P.shoe, sole: P.sole }; legsFront(F, P, L); legsFront(B, P, L); legsSide(S, L); }
  // ---------------- torso + arms
  if (hero === 'jade') {
    for (const V of [F, B]) { V.rect(CX - 12, 37, CX + 12, 52, P.jacket); V.rect(CX - 12, 37, CX - 9, 52, P.jacketD); V.rect(CX + 9, 37, CX + 12, 52, P.jacketD);
      V.rect(CX - 12, 44, CX - 9, 46, P.stripe); V.rect(CX + 9, 44, CX + 12, 46, P.stripe); V.rect(CX - 9, 52, CX + 9, 57, P.top); V.rect(CX - 9, 57, CX + 9, 60, P.skin); }
    F.rect(CX - 3, 37, CX + 3, 39, P.jacketD); F.px(CX, 39, P.sole); F.rect(CX + 4, 41, CX + 6, 43, P.dot);            // band collar, snap tab, small chest dot (her left)
    F.rect(CX - 1, 39, CX + 1, 52, P.jacketD);
    B.rect(CX - 12, 37, CX + 12, 62, P.jacket); B.rect(CX - 12, 37, CX - 9, 62, P.jacketD); B.rect(CX + 9, 37, CX + 12, 62, P.jacketD);   // back: big dot + RARE EARTH
    B.ell(CX, 44, 6.5, 5.5, P.dot); B.text('RARE', CX - 8, 51, '#2b3f73'); B.text('EARTH', CX - 10, 57, '#2b3f73');
    armsFront(F, P.jacket, P.jacketD, P.skin, { stripe: P.stripe }); armsFront(B, P.jacket, P.jacketD, P.skin, { stripe: P.stripe });
    F.rect(CX + 13, 45, CX + 16, 48, '#3b7bff'); B.rect(CX - 16, 45, CX - 13, 48, '#3b7bff');                          // 1420 MHz patch on her LEFT sleeve (front: screen right, back: screen left)
    S.rect(CX - 8, 37, CX + 9, 52, P.jacket); S.rect(CX - 8, 44, CX + 9, 46, P.stripe); S.rect(CX - 7, 52, CX + 8, 57, P.top); S.rect(CX - 7, 57, CX + 8, 60, P.skin);
    S.rect(CX - 3, 38, CX + 4, 56, P.jacket); S.rect(CX - 3, 42, CX + 4, 44, P.stripe); S.rect(CX - 3, 49, CX + 4, 51, P.stripe); S.rect(CX - 2, 56, CX + 3, 61, P.skin);
  } else if (hero === 'charlie') {
    for (const V of [F, B]) { V.rect(CX - 12, 37, CX + 12, 61, P.tee); V.rect(CX - 12, 37, CX - 9, 61, P.teeD); V.rect(CX + 9, 37, CX + 12, 61, P.teeD); }
    F.rect(CX - 3, 37, CX + 3, 39, P.skin); F.rect(CX - 8, 38, CX - 6, 60, '#6b4428');                                // neck + guitar strap
    B.rect(CX - 8, 38, CX - 6, 60, '#6b4428');
    armsFront(F, P.tee, P.teeD, P.skin, { rolled: true }); armsFront(B, P.tee, P.teeD, P.skin, { rolled: true });
    S.rect(CX - 8, 37, CX + 9, 61, P.tee); S.rect(CX - 3, 38, CX + 4, 49, P.tee); S.rect(CX - 3, 49, CX + 4, 61, P.skin);
  } else {
    for (const V of [F, B]) for (let x = CX - 12; x < CX + 12; x++) V.rect(x, 37, x + 1, 61, (Math.floor((x - CX + 12) / 2) % 2) ? P.s2 : P.s1);
    F.rect(CX - 2, 37, CX + 2, 40, P.skin);
    armsFront(F, P.s2, P.s1, P.skin, { rolled: true }); armsFront(B, P.s2, P.s1, P.skin, { rolled: true });
    for (let x = CX - 8; x < CX + 9; x++) S.rect(x, 37, x + 1, 61, (Math.floor((x - CX + 8) / 2) % 2) ? P.s2 : P.s1);
    S.rect(CX - 3, 38, CX + 4, 49, P.s2); S.rect(CX - 3, 47, CX + 4, 49, P.s1); S.rect(CX - 3, 49, CX + 4, 61, P.skin);
  }
  // ---------------- head
  const skinF = (V) => V.ell(CX, 22, 12.5, 13.5, P.skin);
  // front face
  skinF(F); F.rect(CX - 3, 34, CX + 3, 38, P.skinD);
  F.rect(CX - 7, 21, CX - 4, 26, P.eye); F.rect(CX + 4, 21, CX + 7, 26, P.eye); F.px(CX - 6, 22, '#ffffff'); F.px(CX + 5, 22, '#ffffff');
  F.rect(CX - 1, 29, CX + 2, 30, P.mouth); if (P.blush) { F.rect(CX - 10, 27, CX - 7, 28, P.blush); F.rect(CX + 7, 27, CX + 10, 28, P.blush); }
  F.rect(CX - 8, 19, CX - 3, 20, P.hair); F.rect(CX + 3, 19, CX + 8, 20, P.hair);
  // side face (facing right): skull ellipse, face toward +x
  S.ell(CX + 1, 22, 12, 13.5, P.skin); S.rect(CX - 2, 34, CX + 3, 38, P.skinD); S.rect(CX + 7, 21, CX + 9, 26, P.eye); S.px(CX + 8, 22, '#ffffff'); S.rect(CX + 9, 29, CX + 11, 30, P.mouth);
  S.ell(CX - 1, 24, 2, 2.5, P.skinD);                                                                                // ear
  B.ell(CX, 22, 12.5, 13.5, P.hair); B.rect(CX - 3, 34, CX + 3, 38, P.skinD);
  // hair per hero
  if (hero === 'jade') {
    F.ell(CX, 15, 13.5, 9, P.hair, (x, y) => y < 18 || x < CX - 10 || x > CX + 9); F.rect(CX - 14, 16, CX - 11, 31, P.hair); F.rect(CX + 11, 16, CX + 14, 31, P.hair);
    F.px(CX - 4, 18, P.hair); F.px(CX + 2, 18, P.hair); F.px(CX + 3, 18, P.hair);
    S.ell(CX - 1, 16, 12.5, 9.5, P.hair, (x, y) => y < 17 || x < CX + 3); S.rect(CX - 11, 16, CX + 2, 31, P.hair); S.ell(CX - 1, 24, 2, 2.5, P.skinD);
    B.ell(CX, 15, 13.5, 9, P.hair);
    if (!down) { for (const V of [F, B]) V.ell(CX, 6, 6.5, 5.5, P.hair); S.ell(CX - 5, 7, 6, 5.5, P.hair); for (const V of [F, B, S]) V.px(V === S ? CX - 6 : CX - 1, 4, P.hairH); }
    else { for (const V of [F, B]) { V.rect(CX - 14, 16, CX - 10, 38, P.hair); V.rect(CX + 10, 16, CX + 14, 38, P.hair); V.rect(CX - 11, 38, CX - 8, 46, P.hair); V.rect(CX + 8, 38, CX + 11, 46, P.hair); }
      B.rect(CX - 11, 30, CX + 11, 55, P.hair); for (let x = CX - 10; x < CX + 10; x += 3) B.px(x, 55, P.hair); S.rect(CX - 12, 16, CX - 3, 55, P.hair); S.rect(CX - 12, 30, CX - 7, 54, P.hairH); }
  } else if (hero === 'charlie') {
    for (const V of [F, B]) { V.ell(CX, 13, 14.5, 7.5, P.cap); V.rect(CX - 14, 13, CX + 14, 16, P.capD); for (let x = CX - 14; x < CX + 14; x += 3) V.px(x, 17, P.hair); V.rect(CX - 13, 16, CX - 10, 30, P.hair); V.rect(CX + 10, 16, CX + 13, 30, P.hair); }
    B.rect(CX - 12, 16, CX + 12, 33, P.hair); for (let x = CX - 12; x < CX + 12; x += 2) B.px(x, 33, P.hairH);
    S.ell(CX - 1, 13, 13.5, 7.5, P.cap); S.rect(CX - 13, 13, CX + 17, 16, P.capD); S.rect(CX - 12, 16, CX + 1, 32, P.hair); for (let y = 17; y < 32; y += 3) S.px(CX - 12, y, P.hairH); S.ell(CX - 1, 24, 2, 2.5, P.skinD);
  } else {
    for (const V of [F, B]) { V.ell(CX, 13, 13.5, 8.5, P.hair, (x, y) => y < 17 || x < CX - 10 || x > CX + 10); for (let x = CX - 12; x < CX + 12; x += 3) V.px(x, 4 + (x % 2), P.hair); }
    B.rect(CX - 12, 14, CX + 12, 30, P.hair);
    S.ell(CX - 1, 14, 12.5, 9, P.hair, (x, y) => y < 17 || x < CX + 1); S.rect(CX - 12, 15, CX - 1, 28, P.hair); for (let x = CX - 10; x < CX + 8; x += 3) S.px(x, 4 + (x % 2), P.hair); S.ell(CX - 1, 24, 2, 2.5, P.skinD);
  }
  const joints = { neck: 35, shoulder: 39, elbow: 49, wrist: 56, hip: 66, knee: 73 };
  const mk = (V) => ({ img: V.data(), baseline: BL, cx: CX });
  return { front: mk(F), side: mk(S), back: mk(B), joints, armGap: 13, source: 'standin' };
}

// ------------------------------------------------------------------------------------------------ carving
const alphaAt = (img, x, y) => (x < 0 || y < 0 || x >= img.width || y >= img.height) ? 0 : img.data[(y * img.width + x) * 4 + 3];
const rgbAt = (img, x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]]; };
function intervals(row) { const out = []; let a = -1; for (let i = 0; i <= row.length; i++) { const on = i < row.length && row[i]; if (on && a < 0) a = i; if (!on && a >= 0) { out.push([a, i - 1]); a = -1; } } return out; }

/**
 * Carve one hero variant. views = { front, side, back, joints, armGap }. Returns
 * { parts: { name: { geo, pivot: Vector3 (model units) } }, u (units per px), height, joints (model units), armZ, legZ }.
 */
/** the side view with the profile eye painted out to skin (rows of the front view's eyes, forward half of the head), so a 3/4
 *  view never shows the front eyes AND the profile eye: the eyes exist only on the front of the head */
function sideNoEyes(Sv, Fv, neckRow) {
  const F = Fv.img, S0 = Sv.img; const W = F.width, top = Math.max(0, neckRow - 40);
  const at = (img, x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]; };
  // eye rows: front-view rows above the neck with eye-white pixels; skin: the commonest light warm front-view colour in the head
  let e0 = 1e9, e1 = -1; const hist = new Map();
  const warm = (c) => c[3] >= 128 && c[0] > 150 && c[0] > c[2] + 30 && c[1] > 90;
  for (let y = top; y < neckRow; y++) for (let x = 3; x < W - 3; x++) { const c = at(F, x, y); if (c[3] < 128) continue;
    const lumc = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    // an eye: a white pixel, or a dark pixel with face skin on both sides within 3 px (pupils in faces without eye-whites)
    const isEye = (c[0] > 225 && c[1] > 225 && c[2] > 225) || (lumc < 60 && [1, 2, 3].some((d) => warm(at(F, x - d, y))) && [1, 2, 3].some((d) => warm(at(F, x + d, y))));
    if (isEye) { e0 = Math.min(e0, y); e1 = Math.max(e1, y); } }
  for (let y = e0; y < neckRow; y++) for (let x = 0; x < S0.width; x++) { const c = at(S0, x, y); if (c[3] < 128) continue;   // skin: commonest warm colour of the SIDE view's face rows
    if (c[0] > 150 && c[0] > c[2] + 30 && c[1] > 90) { const k = c.slice(0, 3).join(','); hist.set(k, (hist.get(k) || 0) + 1); } }
  if (e1 < 0 || !hist.size) return Sv;
  const skin = [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
  const img = new ImageData(new Uint8ClampedArray(S0.data), S0.width, S0.height), d = img.data;
  const isSkin = (r, g, b) => Math.abs(r - skin[0]) + Math.abs(g - skin[1]) + Math.abs(b - skin[2]) < 90 && r > g && g > b;
  // the profile eye: small non-skin blobs (<= 16 px) in the head rows that touch only skin (never transparency or the hair mass)
  // and overlap the front view's eye rows -> painted to skin. Fringe strands connect to the hair, the brim to the background.
  const W2 = S0.width, src = S0.data, seen = new Uint8Array(W2 * S0.height);
  const opq = (x, y) => x >= 0 && y >= 0 && x < W2 && y < S0.height && src[(y * W2 + x) * 4 + 3] >= 128;
  const skinAt = (x, y) => { const i = (y * W2 + x) * 4; return isSkin(src[i], src[i + 1], src[i + 2]); };
  for (let y0 = top; y0 < neckRow; y0++) for (let x0 = 0; x0 < W2; x0++) { const q0 = y0 * W2 + x0; if (seen[q0] || !opq(x0, y0) || skinAt(x0, y0)) continue;
    const comp = [], st = [[x0, y0]]; seen[q0] = 1; let ok = true;
    while (st.length && comp.length <= 16) { const [x, y] = st.pop(); comp.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!opq(nx, ny)) { ok = false; continue; } const q = ny * W2 + nx; if (seen[q] || skinAt(nx, ny)) continue; seen[q] = 1; st.push([nx, ny]); } }
    if (!ok || comp.length > 16 || st.length) continue;
    if (!comp.some(([, y]) => y >= e0 - 1 && y <= e1 + 1)) continue;
    for (const [x, y] of comp) { const i = (y * W2 + x) * 4; d[i] = skin[0]; d[i + 1] = skin[1]; d[i + 2] = skin[2]; } }
  return { ...Sv, img };
}


// ------------------------------------------------------------------------------------------------ flat materials (phase 2c)
// k08b reads clean because every material is ONE colour and the light does the shading. Each hero's views are quantised
// to a small material palette (greedy by frequency: a colour joins the palette entry with the same chroma and a similar
// value, so painted shading collapses onto its base tone; near-black is its own material), thin interior outline lines are
// replaced by the surrounding material, and the face is cleaned from the front view (skin + explicit eyes / brows / mouth).
const chroma = (c) => { const s = c[0] + c[1] + c[2]; return [c[0] / s, c[1] / s, c[2] / s, s]; };
function sameMaterial(a, b) {
  const A = chroma(a), B = chroma(b);
  if (A[3] < 60 || B[3] < 60) return A[3] < 60 && B[3] < 60;            // the blacks
  const r = A[3] / B[3]; if (r < 0.66 || r > 1.5) return false;
  const lowSat = (C) => Math.max(C[0], C[1], C[2]) - Math.min(C[0], C[1], C[2]) < 0.06;
  if (lowSat(A) && lowSat(B)) return r > 0.8 && r < 1.25;              // whites / greys: a narrower value window
  return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2])) < 0.045;
}
/** seeds: [[r,g,b]...] material base colours that never merge with each other (sampled per body region, so e.g. Charlie's
 *  beige cap and his skin stay two materials although their chroma is the same); other colours join the nearest compatible entry */
export function buildPalette(imgs, seeds = []) {
  const hist = new Map();
  for (const img of imgs) { if (!img) continue; const d = img.data; for (let i = 0; i < d.length; i += 4) if (d[i + 3] >= 128) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; hist.set(k, (hist.get(k) || 0) + 1); } }
  const cols = [...hist.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => [[(k >> 16) & 255, (k >> 8) & 255, k & 255], n]);
  const pal = [], map = new Map(); const key = (c) => (c[0] << 16) | (c[1] << 8) | c[2];
  for (const c of seeds) if (!pal.some((p) => key(p.c) === key(c))) { pal.push({ c, n: 0, seed: true }); }
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  for (const [c, n] of cols) { let e = null, bd = 1e9; for (const p of pal) if (sameMaterial(p.c, c)) { const dd = d2(p.c, c); if (dd < bd) { bd = dd; e = p; } }
    if (!e) { e = { c, n: 0 }; pal.push(e); } e.n += n; map.set(key(c), e.c); }
  return { pal: pal.map((p) => p.c), map };
}
/** most frequent opaque colour inside a box [x0, y0, x1, y1] (optionally a vertical sub-range as fractions) */
function boxMode(img, b, f0 = 0, f1 = 1) { if (!img || !b) return null; const W = img.width, d = img.data, h = new Map();
  const y0 = Math.round(b[1] + (b[3] - b[1]) * f0), y1 = Math.round(b[1] + (b[3] - b[1]) * f1);
  for (let y = y0; y <= y1; y++) for (let x = b[0]; x <= b[2]; x++) { const i = (y * W + x) * 4; if (d[i + 3] < 128) continue; const s = d[i] + d[i + 1] + d[i + 2]; if (s < 60) continue; const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; h.set(k, (h.get(k) || 0) + 1); }
  if (!h.size) return null; const k = [...h.entries()].sort((a, c) => c[1] - a[1])[0][0]; return [(k >> 16) & 255, (k >> 8) & 255, k & 255]; }
function quantise(img, P) { const o = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), d = o.data;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] >= 128) { const c = P.map.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]); if (c) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; } } return o; }
/** replace thin dark interior lines (<= 3 dark 8-neighbours, lit material on two opposite sides) below row y0 by the local mode;
 *  `keep(x, y)` protects canon detail (RARE EARTH lettering) */
function cleanLines(img, y0, keep) {
  const W = img.width, H = img.height, d = img.data, src = d.slice();
  const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && src[(y * W + x) * 4 + 3] >= 128;
  const blk = (x, y) => op(x, y) && src[(y * W + x) * 4] + src[(y * W + x) * 4 + 1] + src[(y * W + x) * 4 + 2] < 60;
  for (let y = Math.max(1, y0); y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!blk(x, y) || (keep && keep(x, y))) continue;
    const lit = (xx, yy) => op(xx, yy) && !blk(xx, yy);
    // a line: the dark run through this pixel is <= 2 px between lit material, horizontally or vertically
    const run = (dx, dy) => { let a = 0, b = 0; while (a < 3 && blk(x - dx * (a + 1), y - dy * (a + 1))) a++; while (b < 3 && blk(x + dx * (b + 1), y + dy * (b + 1))) b++;
      return a + b + 1 <= 2 && lit(x - dx * (a + 1), y - dy * (a + 1)) && lit(x + dx * (b + 1), y + dy * (b + 1)); };
    if (!run(1, 0) && !run(0, 1)) continue;
    const cnt = new Map(); let best = null, bn = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!lit(x + dx, y + dy)) continue; const i = ((y + dy) * W + x + dx) * 4; const k = (src[i] << 16) | (src[i + 1] << 8) | src[i + 2]; const n = (cnt.get(k) || 0) + 1; cnt.set(k, n); if (n > bn) { bn = n; best = i; } }
    if (best !== null) { const i = (y * W + x) * 4; d[i] = src[best]; d[i + 1] = src[best + 1]; d[i + 2] = src[best + 2]; }
  }
  return img;
}
/** front-view face: inside the face span (between the outermost skin pixels of each row, from the eye rows to the chin) every
 *  non-skin blob that is NOT small and enclosed by skin (eyes, brows, mouth) becomes skin: no hair strands / shadow over the cheeks */
function cleanFace(img, headBox, neckRow, skinSeed = null) {
  const W = img.width, d = img.data; const at = (x, y) => (y * W + x) * 4;
  const warm = (i) => d[i + 3] >= 128 && d[i] > 140 && d[i] > d[i + 2] + 25 && d[i + 1] > 80;
  const y0h = headBox ? headBox[1] : Math.max(0, neckRow - 30), y1 = Math.min(img.height - 1, neckRow);
  const hist = new Map(); for (let y = y0h; y <= y1; y++) for (let x = 0; x < W; x++) { const i = at(x, y); if (warm(i)) { const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; hist.set(k, (hist.get(k) || 0) + 1); } }
  if (!hist.size && !skinSeed) return img; const sk = hist.size ? [...hist.entries()].sort((a, b) => b[1] - a[1])[0][0] : 0; const skin = skinSeed || [(sk >> 16) & 255, (sk >> 8) & 255, sk & 255];
  const isSkin = (i) => d[i + 3] >= 128 && d[i] === skin[0] && d[i + 1] === skin[1] && d[i + 2] === skin[2];
  // face rows: from the first row whose skin span is >= 40% of the head width (below the fringe) to the neck
  const hw = headBox ? headBox[2] - headBox[0] : 24; let fy0 = -1; const span = [];
  for (let y = y0h; y <= y1; y++) { let a = -1, b = -1; for (let x = 0; x < W; x++) if (isSkin(at(x, y))) { if (a < 0) a = x; b = x; } span[y] = [a, b]; if (fy0 < 0 && a >= 0 && b - a >= hw * 0.4) fy0 = y; }
  if (fy0 < 0) return img;
  const inF = (x, y) => y >= fy0 && y <= y1 && span[y] && span[y][0] >= 0 && x > span[y][0] && x < span[y][1];
  // explicit features: eyes / brows / mouth are dark or white marks with face skin within 4 px on BOTH sides (a strand at the
  // cheek edge has hair, not skin, on its outer side): never painted, even when they touch the fringe
  const keep = new Uint8Array(W * img.height);
  for (let y = fy0 - 3; y <= y1; y++) for (let x = 1; x < W - 1; x++) { if (y < 0) continue; const i = at(x, y); if (d[i + 3] < 128 || isSkin(i)) continue;
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; if (lum > 90 && lum < 215) continue;
    let L = false, R = false; for (let k = 1; k <= 4; k++) { if (x - k >= 0 && isSkin(at(x - k, y))) L = true; if (x + k < W && isSkin(at(x + k, y))) R = true; }
    if (L && R) keep[y * W + x] = 1; }
  const seen = new Uint8Array(W * img.height);
  for (let y = fy0; y <= y1; y++) for (let x = 0; x < W; x++) { if (!inF(x, y) || seen[y * W + x] || isSkin(at(x, y)) || d[at(x, y) + 3] < 128) continue;
    const comp = [], st = [[x, y]]; seen[y * W + x] = 1; let edge = false;
    while (st.length) { const [cx, cy] = st.pop(); comp.push([cx, cy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (!inF(nx, ny)) { if (!(isSkin(at(nx, ny)))) edge = true; continue; } const q = ny * W + nx; if (seen[q] || isSkin(at(nx, ny))) continue; seen[q] = 1; st.push([nx, ny]); } }
    if (!edge && comp.length <= 24) continue;                                 // eye / brow / mouth: keep
    for (const [cx, cy] of comp) { if (keep[cy * W + cx]) continue; const i = at(cx, cy); d[i] = skin[0]; d[i + 1] = skin[1]; d[i + 2] = skin[2]; }
  }
  return img;
}
/** prepare a hero's views: one palette for front/side/back, thin lines cleaned, a clean front face */
function flatViews(views) {
  const F0 = views.front, S0 = views.side, B0 = views.back || null;
  const fp = views.frontParts || {}, bp = views.backParts || {}, sp = views.sideParts || {};
  const seeds = [boxMode(F0.img, fp.head, 0.62, 0.95), boxMode(F0.img, fp.head, 0, 0.3), boxMode(F0.img, fp.torso), boxMode(F0.img, fp.legs, 0, 0.7),
    boxMode(F0.img, fp.arm_r, 0, 0.5), boxMode(B0?.img, bp.torso, 0, 0.3), boxMode(F0.img, fp.legs, 0.85, 1)].filter(Boolean);
  const P = buildPalette([F0.img, S0.img, B0 && B0.img], seeds);
  const warmC = (c) => c && c[0] > 140 && c[0] > c[1] && c[1] > c[2];
  let skinC = warmC(seeds[0]) ? P.map.get((seeds[0][0] << 16) | (seeds[0][1] << 8) | seeds[0][2]) : null;
  if (!warmC(skinC)) skinC = null;   // cleanFace then finds the commonest warm colour of the head itself
  const neck = (views.joints || guessJoints(F0)).neck;
  // protect Jade's back lettering: the back view's torso box, below the big dot
  const tb = views.backParts?.torso; const keepB = tb ? (x, y) => x > tb[0] + 2 && x < tb[2] - 2 && y > tb[1] + (tb[3] - tb[1]) * 0.35 && y < tb[3] - 1 : null;
  const F = cleanFace(cleanLines(quantise(F0.img, P), neck + 1), fp.head, neck, skinC);
  const S = cleanFace(cleanLines(quantise(S0.img, P), neck + 1), sp.head, neck, skinC), B = B0 ? cleanLines(quantise(B0.img, P), neck + 1, keepB) : null;
  return { ...views, front: { ...F0, img: F }, side: { ...S0, img: S }, back: B0 ? { ...B0, img: B } : null, palette: P.pal };
}

export function carveFigure(views, { u = 0.52, superP = 2.6, ao = 0.24, grow = { head: [1.1, 1.08], body: [1.2, 1.07], limb: [1.18, 1.18] } } = {}) {
  views = views.source === 'art' && !views.palette ? flatViews(views) : views;
  const Fv = views.front, Bv = views.back || null; const Sv0 = views.side;
  const Sv = sideNoEyes(Sv0, Fv, (views.joints || guessJoints(Fv)).neck);
  const H = Math.max(Fv.img.height, Sv.img.height); const BLf = Fv.baseline, BLs = Sv.baseline, BLb = Bv ? Bv.baseline : 0;
  const NX = Sv.img.width, NZ = Fv.img.width, cxS = Sv.cx, cxF = Fv.cx, cxB = Bv ? Bv.cx : 0;
  const top = Math.max(BLf, BLs) + 1; const NY = top;
  // per-row masks: side over x (i), front/back over z (k). Front column for z cell k: ixF = 2cxF - k - 1; back: ixB = k - cxF + cxB.
  const occ = new Uint8Array(NX * NY * NZ); const bU = new Float32Array(NX * NY * NZ), bW = new Float32Array(NX * NY * NZ); // normalised offset from the slice-box centre (x: front/back, z: sides)
  const idx = (i, j, k) => i + NX * (j + NY * k);
  const neckJ = BLf - (views.joints || guessJoints(Fv)).neck; const headRow = (j) => j > neckJ;
  // arm boxes (front image coords [x0, y0, x1, y1]; R = the hero's right = screen left in the front view) -> z cell boundaries
  const A = views.arms ? { kR: 2 * cxF - views.arms.R[2] - 1, kL: 2 * cxF - views.arms.L[0], y0: Math.min(views.arms.R[1], views.arms.L[1]) + 2, y1: Math.max(views.arms.R[3], views.arms.L[3]) } : null;
  for (let j = 0; j < NY; j++) {
    const yS = BLs - j, yF = BLf - j, yB = BLb - j;
    const sRow = new Uint8Array(NX), zRow = new Uint8Array(NZ);
    for (let i = 0; i < NX; i++) sRow[i] = alphaAt(Sv.img, i, yS) >= 128 ? 1 : 0;
    for (let k = 0; k < NZ; k++) { const f = alphaAt(Fv.img, 2 * cxF - k - 1, yF) >= 128; const b = Bv ? alphaAt(Bv.img, k - cxF + cxB, yB) >= 128 : true; zRow[k] = f && b ? 1 : 0; }
    let Iz = intervals(zRow); const Is = intervals(sRow);
    // arms drawn touching the torso: split the lateral intervals at the arm edges so each limb gets its own rounded section
    if (A && yF >= A.y0 && yF <= A.y1) { const cuts = [A.kR, A.kL]; const out2 = []; for (const [a, b] of Iz) { let s0 = a; for (const c of cuts) if (c > s0 && c <= b) { out2.push([s0, c - 1]); s0 = c; } out2.push([s0, b]); } Iz = out2; }
    for (const [xa, xb] of Is) for (const [za, zb] of Iz) {
      let wx = xb - xa + 1; const wz = zb - za + 1; let xc = (xa + xb + 1) / 2; const zc = (za + zb + 1) / 2;
      // thin in z (a limb seen against the torso in the side view): give it a near-round section, unless it's the feet
      if (j > 6 && wx > wz * 1.3) { const w2 = Math.max(wz * 1.15, 3); xc = Math.min(xb + 1 - w2 / 2, Math.max(xa + w2 / 2, xc)); wx = w2; }
      // chibi bulk (k08b): grow each slice's section past the drawn silhouette (head a little, torso / legs deeper, limbs chunkier)
      const armBox = A && yF >= A.y0 && yF <= A.y1 && (za >= A.kR || zb < A.kL);
      const g = j <= 6 ? [1, 1] : headRow(j) ? grow.head : armBox ? grow.limb : grow.body;
      const rx = wx / 2 * g[0], rz = wz / 2 * g[1]; const p = (wx <= 3 || wz <= 3) ? 6 : (headRow(j) ? superP + 0.9 : superP);
      const i0 = Math.max(0, Math.floor(xc - rx)), i1 = Math.min(NX - 1, Math.ceil(xc + rx)), k0 = Math.max(0, Math.floor(zc - rz)), k1 = Math.min(NZ - 1, Math.ceil(zc + rz));
      for (let i = i0; i <= i1; i++) for (let k = k0; k <= k1; k++) {
        const dx = Math.abs((i + 0.5 - xc) / rx), dz = Math.abs((k + 0.5 - zc) / rz);
        if (Math.pow(dx, p) + Math.pow(dz, p) <= 1.0001) { const n = idx(i, j, k); occ[n] = 1; bU[n] = (i + 0.5 - xc) / rx; bW[n] = (k + 0.5 - zc) / rz; }
      }
    }
  }
  // colour: pick the view facing the exposed side of each voxel
  const col = new Uint8Array(NX * NY * NZ * 3);
  const filled = (i, j, k) => i >= 0 && j >= 0 && k >= 0 && i < NX && j < NY && k < NZ && occ[idx(i, j, k)];
  const dark = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 46;
  // grown voxels sit just outside the drawn silhouette: take the nearest opaque pixel in that row (up to 4 px toward the centre)
  const colFrom = (view, ix, iy, cx) => { if (!view) return null; for (let d = 0; d <= 4; d++) { const x = ix + (ix < cx ? d : ix > cx ? -d : 0); if (alphaAt(view.img, x, iy) >= 128) return rgbAt(view.img, x, iy); } return null; };
  for (let k = 0; k < NZ; k++) for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const n = idx(i, j, k); if (!occ[n]) continue;
    const sideC = colFrom(Sv, i, BLs - j, cxS), frontC = colFrom(Fv, 2 * cxF - k - 1, BLf - j, cxF), backC = colFrom(Bv, k - cxF + cxB, BLb - j, cxB);
    // which view owns this voxel: the direction from the slice centre (front / back inside +-52 deg on the head, +-60 on the body,
    // else the side view). One view per voxel, so a stepped 3/4 surface never interleaves front and side pixels (the face smear).
    const L = Math.hypot(bU[n], bW[n]) || 1, cu = bU[n] / L; const lim = j > neckJ ? 0.2 : 0.5;   /* head: the front view owns the whole front half (face + fringe), the side view the sides */
    let c = cu > lim ? (frontC || sideC || backC) : cu < -lim ? (backC || sideC || frontC) : (sideC || (cu >= 0 ? frontC : backC) || frontC || backC);
    c = c || [200, 200, 200];
    const o = n * 3; col[o] = c[0]; col[o + 1] = c[1]; col[o + 2] = c[2];
  }
  // joints (px rows from the image top, front view) -> voxel rows j; arm / leg lateral split
  const J = views.joints || guessJoints(Fv);
  const jr = (y) => BLf - y; const jt = { neck: jr(J.neck), shoulder: jr(J.shoulder), elbow: jr(J.elbow), wrist: jr(J.wrist), hip: jr(J.hip), knee: jr(J.knee) };
  const armGap = views.armGap ?? 12; // px from cx to the inner arm edge
  const kOf = (zpx) => cxF + zpx; // z cell of a lateral px offset (+ = the hero's right)
  // the arm column as carved: x-range of the forearm voxels (rows between elbow and wrist, inside the arm z-zones)
  const inZone = (k, R) => A ? (R ? k >= A.kR : k < A.kL) : (R ? k + 0.5 - cxF >= armGap : cxF - k - 0.5 >= armGap);
  const armCol = { R: null, L: null };
  for (const R of [true, false]) { const xs = [];
    for (let j = jt.wrist; j <= jt.elbow; j++) for (let k = 0; k < NZ; k++) if (inZone(k, R)) for (let i = 0; i < NX; i++) if (occ[idx(i, j, k)]) xs.push(i);
    xs.sort((a, b) => a - b); armCol[R ? 'R' : 'L'] = xs.length > 8 ? [xs[Math.floor(xs.length * 0.08)], xs[Math.floor(xs.length * 0.92)]] : [cxS - 4, cxS + 4]; }
  const part = new Uint8Array(NX * NY * NZ); // 1 head 2 torso 3 uarmR 4 larmR 5 uarmL 6 larmL 7 thighR 8 shinR 9 thighL 10 shinL
  for (let k = 0; k < NZ; k++) for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const n = idx(i, j, k); if (!occ[n]) continue; const zpx = k + 0.5 - cxF; const R = zpx > 0;
    const ac = armCol[R ? 'R' : 'L']; // hair / a carried guitar behind the arm column stays on the torso
    const isArm = (A ? (j <= BLf - A.y0 + 2 && j >= BLf - A.y1 && (k >= A.kR || k < A.kL)) : (Math.abs(zpx) >= armGap && j > jt.hip - 6)) && i >= ac[0] - 3 && i <= ac[1] + 5;
    let p;
    if (j > jt.neck) p = 1;
    else if (isArm) p = j > jt.elbow ? (R ? 3 : 5) : (R ? 4 : 6);
    else if (j >= jt.hip) p = 2;
    else p = j >= jt.knee ? (R ? 7 : 9) : (R ? 8 : 10);
    part[n] = p;
  }
  // 3D mode filter (per part): a voxel with <= 1 same-colour neighbour among its 26 (same part) takes the majority colour
  // when that colour holds >= 5 of them: isolated off-colour voxels are absorbed, 1-voxel-wide strokes (letters, stripes) survive
  if (views.palette) for (let pass = 0; pass < 2; pass++) { const src = col.slice();
    for (let k = 0; k < NZ; k++) for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const n = idx(i, j, k); if (!occ[n]) continue;
      const me = (src[n * 3] << 16) | (src[n * 3 + 1] << 8) | src[n * 3 + 2]; const cnt = new Map(); let same = 0;
      for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy && !dz) continue;
        const x = i + dx, y = j + dy, z = k + dz; if (x < 0 || y < 0 || z < 0 || x >= NX || y >= NY || z >= NZ) continue; const q = idx(x, y, z); if (!occ[q] || part[q] !== part[n]) continue;
        const c = (src[q * 3] << 16) | (src[q * 3 + 1] << 8) | src[q * 3 + 2]; if (c === me) same++; else cnt.set(c, (cnt.get(c) || 0) + 1); }
      if (same > 1) continue; let best = -1, bn = 0; for (const [c, m] of cnt) if (m > bn) { bn = m; best = c; }
      if (bn >= 5) { col[n * 3] = (best >> 16) & 255; col[n * 3 + 1] = (best >> 8) & 255; col[n * 3 + 2] = best & 255; } } }
  // pivots (model units). x centre from the side view torso / head mid columns
  const midX = (jrow) => { let a = 1e9, b = -1e9; for (let i = 0; i < NX; i++) if (alphaAt(Sv.img, i, BLs - jrow) >= 128) { a = Math.min(a, i); b = Math.max(b, i); } return a > b ? cxS : (a + b + 1) / 2; };
  const X = (i) => (i - cxS) * u, Y = (j) => j * u, Z = (k) => (k - cxF) * u;
  const torsoX = X(midX(Math.round((jt.shoulder + jt.hip) / 2)));
  const armZ = A ? ((A.kR - cxF) + 2.5) * u : (armGap + 2) * u, armZL = A ? ((cxF - A.kL) + 2.5) * u : armZ, legZ = 5 * u;
  // centroid of a part's voxels within rows [j0, j1] (model units) -> joint pivots / hands sit on the actual geometry
  const cen = (pp, j0, j1, fb) => { let n = 0, sx = 0, sz = 0; for (let k = 0; k < NZ; k++) for (let j = Math.max(0, j0); j <= Math.min(NY - 1, j1); j++) for (let i = 0; i < NX; i++) { const q = idx(i, j, k); if (occ[q] && pp.includes(part[q])) { n++; sx += i + 0.5; sz += k + 0.5; } }
    return n ? new THREE.Vector3(X(sx / n - 0.5), 0, Z(sz / n - 0.5)) : fb.clone(); };
  const armPiv = (up, lo, sgn) => { const zf = new THREE.Vector3(torsoX, 0, sgn * armZ);
    const sh = cen([up], jt.shoulder - 4, jt.shoulder - 1, zf), el = cen([up, lo], jt.elbow - 1, jt.elbow + 1, zf), hd = cen([lo], jt.wrist - 3, jt.wrist + 1, el);
    return { sh: sh.setY(Y(jt.shoulder - 1)), el: el.setY(Y(jt.elbow)), hd: hd.setY(Y(jt.wrist - 2)) }; };
  const aR = armPiv(3, 4, 1), aL = armPiv(5, 6, -1);
  const piv = {
    1: new THREE.Vector3(torsoX, Y(jt.neck + 1), 0), 2: new THREE.Vector3(torsoX, Y(jt.hip), 0),
    3: aR.sh, 4: aR.el, 5: aL.sh, 6: aL.el,
    7: new THREE.Vector3(torsoX, Y(jt.hip), legZ), 8: new THREE.Vector3(torsoX, Y(jt.knee), legZ),
    9: new THREE.Vector3(torsoX, Y(jt.hip), -legZ), 10: new THREE.Vector3(torsoX, Y(jt.knee), -legZ),
  };
  const NAMES = { 1: 'head', 2: 'torso', 3: 'uarmR', 4: 'larmR', 5: 'uarmL', 6: 'larmL', 7: 'thighR', 8: 'shinR', 9: 'thighL', 10: 'shinL' };
  const parts = {};
  for (let p = 1; p <= 10; p++) {
    const o2 = new Uint8Array(NX * NY * NZ); let any = false; for (let n = 0; n < o2.length; n++) if (part[n] === p) { o2[n] = 1; any = true; }
    if (!any) continue;
    const pv = piv[p];
    const geo = meshVoxelGrid({ nx: NX, ny: NY, nz: NZ, occ: o2, col }, { s: u, origin: [X(0) - pv.x, Y(0) - pv.y, Z(0) - pv.z], ao });
    parts[NAMES[p]] = { geo, pivot: pv };
  }
  const handY = Y(jt.wrist - 2), headTop = (() => { for (let j = NY - 1; j >= 0; j--) for (let i = 0; i < NX; i++) if (alphaAt(Sv.img, i, BLs - j) >= 128) return Y(j + 1); return Y(NY); })();
  return { source: views.source, hands: { R: aR.hd, L: aL.hd }, parts, u, height: headTop, jt, J: Object.fromEntries(Object.entries(jt).map(([k, v]) => [k, Y(v)])), armZ, legZ, torsoX, handY, piv, NAMES };
}
function guessJoints(Fv) {
  // rows by fraction of the figure height (chibi proportions) when the art gives no joints
  const h = Fv.baseline; return { neck: Math.round(h * 0.41), shoulder: Math.round(h * 0.46), elbow: Math.round(h * 0.58), wrist: Math.round(h * 0.66), hip: Math.round(h * 0.77), knee: Math.round(h * 0.86) };
}

// ------------------------------------------------------------------------------------------------ items (procedural stand-ins)
function gridMesh(nx, ny, nz, fill, { s = 0.5, origin = [0, 0, 0], ao = 0.3 } = {}) {
  const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const c = fill(i, j, k); if (!c) continue; const n = i + nx * (j + ny * k); occ[n] = 1; const v = new THREE.Color(c); col[n * 3] = Math.round(v.r * 255); col[n * 3 + 1] = Math.round(v.g * 255); col[n * 3 + 2] = Math.round(v.b * 255); }
  return meshVoxelGrid({ nx, ny, nz, occ, col }, { s, origin, ao });
}
const RAINBOW = ['#ff4d6d', '#ff7a3d', '#ffe14d', '#4fd06a', '#2bb4e8', '#6a5cff'];
/** pencil along +x, origin at its middle. cap 'blue' (rainbow core) or 'pink' (graphite core). */
export function pencilGeo(cap, s = 0.45) {
  const L = 30; const capC = cap === 'blue' ? '#2f6bff' : '#ff6f8f';
  return gridMesh(L, 3, 3, (i, j, k) => {
    const edge = (j === 0 || j === 2) && (k === 0 || k === 2);
    if (i < 3) return edge ? null : capC;                                     // eraser cap
    if (i < 5) return edge ? null : '#c9ccd4';                                // ferrule
    if (i < 24) return edge ? (i % 2 ? '#e8b81e' : null) : (j === 2 ? '#ffd23a' : '#f2c230');
    if (i < 28) return (j === 1 && k === 1) || i < 26 ? (j === 1 && k === 1 ? (cap === 'blue' ? RAINBOW[i % 6] : '#3a3a40') : '#e9c79a') : null;
    if (i < 30) return j === 1 && k === 1 ? (cap === 'blue' ? RAINBOW[(i + 2) % 6] : '#2a2a30') : null;
    return null;
  }, { s, origin: [-L * s / 2, -1.5 * s, -1.5 * s] });
}
/** Strat (natural wood, white pickguard): body in the x-y plane, neck along +x; origin = body centre */
export function stratGeo(s = 0.5) {
  const nx = 52, ny = 20, nz = 3;
  return gridMesh(nx, ny, nz, (i, j, k) => {
    const bx = (i - 10) / 10, by = (j - 9) / 8.5; const horn = (i > 12 && i < 20 && (j > 15 || j < 3) && Math.abs(j - 9) < 10);
    const body = (bx * bx + by * by <= 1 && i < 21) || (horn && ((j > 15 && i < 18) || (j < 3 && i < 19)));
    if (body) { if (k === 2 && i > 4 && i < 17 && j > 4 && j < 14 && !(i > 9 && i < 13 && j > 7 && j < 11)) return (i + j) % 7 === 0 ? '#d8d8d8' : '#f4f4f0'; if (k === 2 && i > 9 && i < 13 && j > 7 && j < 11) return '#c0c0c8'; return (i * 3 + j) % 5 === 0 ? '#c9934e' : '#dba45c'; }
    if (i >= 21 && i < 46 && j >= 8 && j <= 10 && k >= 1) return k === 2 && j === 9 && i % 3 === 0 ? '#e0e0e0' : '#e6c08a';
    if (i >= 46 && i < 52 && j >= 7 && j <= 12 && k >= 1) return '#e6c08a';
    return null;
  }, { s, origin: [-10 * s, -9 * s, -1.5 * s] });
}
/** acoustic guitar (Charlie, carried on the back): body figure-8, sound hole, neck along +x */
export function acousticGeo(s = 0.5) {
  const nx = 56, ny = 26, nz = 6;
  return gridMesh(nx, ny, nz, (i, j, k) => {
    const a = ((i - 9) / 9) ** 2 + ((j - 13) / 12) ** 2 <= 1, b = ((i - 22) / 8) ** 2 + ((j - 13) / 10) ** 2 <= 1;
    if (a || b) { if (k === nz - 1 && ((i - 18) ** 2 + (j - 13) ** 2 <= 9)) return '#2a1a10'; return k === nz - 1 ? ((i + j) % 6 === 0 ? '#c88a46' : '#d89a52') : '#8a5a2e'; }
    if (i >= 30 && i < 50 && j >= 11 && j <= 14 && k >= 2) return '#5a3a20';
    if (i >= 50 && i < 56 && j >= 10 && j <= 15 && k >= 2) return '#4a2e18';
    return null;
  }, { s, origin: [-14 * s, -13 * s, -3 * s] });
}
/** flat cap (beige newsboy) for hat-in-hand poses */
export function capGeo(s = 0.52) {
  return gridMesh(30, 9, 28, (i, j, k) => { const u2 = ((i - 13) / 13.5) ** 2 + ((k - 14) / 13.5) ** 2; if (j < 7 && u2 <= 1 - (j / 8) ** 2 * 0.5 && u2 <= 1) return j < 2 ? '#a88a54' : '#cdae74'; if (j < 2 && i >= 24 && Math.abs(k - 14) < 10) return '#a88a54'; return null; },
    { s, origin: [-13 * s, 0, -14 * s] });
}

/** carve an item from its front + side views (2-view hull). Local axes: x = front image horizontal, y up, z = side image
 *  horizontal; origin at the item's pivot (front image px). Returns a BufferGeometry. */
export function carveItem(front, side, pivot, u = 0.52) {
  const FW = front.img.width, FH = front.img.height, SW = side.img.width, SH = side.img.height; const H = Math.max(FH, SH);
  const nx = FW, ny = H, nz = SW; const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3);
  // align bottoms: row j counts up from each image's bottom row
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const fy = FH - 1 - j, sy = SH - 1 - j; if (fy < 0 || sy < 0) continue;
    if (alphaAt(front.img, i, fy) < 128 || alphaAt(side.img, k, sy) < 128) continue;
    const n = i + nx * (j + ny * k); occ[n] = 1;
  }
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const n = i + nx * (j + ny * k); if (!occ[n]) continue;
    const exX = (i === 0 || !occ[n - 1]) || (i === nx - 1 || !occ[n + 1]); const exZ = (k === 0 || !occ[n - nx * ny]) || (k === nz - 1 || !occ[n + nx * ny]);
    const c = (exX && !exZ) ? rgbAt(side.img, k, SH - 1 - j) : rgbAt(front.img, i, FH - 1 - j); col[n * 3] = c[0]; col[n * 3 + 1] = c[1]; col[n * 3 + 2] = c[2]; }
  const px = pivot ? pivot[0] : FW / 2, py = pivot ? FH - 1 - pivot[1] : 0;
  return meshVoxelGrid({ nx, ny, nz, occ, col }, { s: u, origin: [-px * u, -py * u, -nz * u / 2], ao: 0.25 });
}

// ------------------------------------------------------------------------------------------------ figure + rig
/**
 * Build a posable figure Group from a carved model. Returns { root, joints, items, model }.
 * joints: body (bob/lean pivot = hips), head, shoulderR/L, elbowR/L, hipR/L, kneeR/L; items: pencilR/L, guitar, cap, bunPencils.
 */
export function buildFigure(model, material, { hero = 'jade', down = false, items: ART = null, rig = FIGRIG } = {}) {
  const root = new THREE.Group(); const J = {};
  const mesh = (name) => { const p = model.parts[name]; if (!p) return new THREE.Group(); const m = new THREE.Mesh(p.geo, material); m.castShadow = m.receiveShadow = true; m.userData.noPaint = true; return m; };
  const jointAt = (parent, pivotWorld, parentPivot) => { const g = new THREE.Group(); g.position.copy(pivotWorld).sub(parentPivot); parent.add(g); return g; };
  const O = new THREE.Vector3();
  const P = model.piv;
  J.body = jointAt(root, P[2], O); J.body.add(mesh('torso'));
  J.head = jointAt(J.body, P[1], P[2]); J.head.add(mesh('head'));
  J.shoulderR = jointAt(J.body, P[3], P[2]); J.shoulderR.add(mesh('uarmR')); J.elbowR = jointAt(J.shoulderR, P[4], P[3]); J.elbowR.add(mesh('larmR'));
  J.shoulderL = jointAt(J.body, P[5], P[2]); J.shoulderL.add(mesh('uarmL')); J.elbowL = jointAt(J.shoulderL, P[6], P[5]); J.elbowL.add(mesh('larmL'));
  // chibi bulk (k08b): bigger head, chunkier torso / limbs; mesh scales about each joint, so pivots and feet stay put
  // (bulk is carved in: carveFigure grow factors; non-uniform mesh scaling speckled the shading)
  J.legs = jointAt(root, P[2], O);
  J.hipR = jointAt(J.legs, P[7], P[2]); J.hipR.add(mesh('thighR')); J.kneeR = jointAt(J.hipR, P[8], P[7]); J.kneeR.add(mesh('shinR'));
  J.hipL = jointAt(J.legs, P[9], P[2]); J.hipL.add(mesh('thighL')); J.kneeL = jointAt(J.hipL, P[10], P[9]); J.kneeL.add(mesh('shinL'));
  const items = {};
  // the hand = the fist at the bottom of the lower-arm mesh (elbow space; the mesh geometry is already pivot-relative)
  const hand = (side) => { const el = side === 'R' ? J.elbowR : J.elbowL; const g = new THREE.Group(); const m = el.children[0];
    if (model.native) g.position.copy(model.native.hand[side]);
    else if (m && m.geometry) { m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; g.position.set((b.min.x + b.max.x) / 2, b.min.y + 2.2 * model.u, (b.min.z + b.max.z) / 2); }
    else g.position.set(0, model.handY - (side === 'R' ? P[4].y : P[6].y), 0);
    el.add(g); return g; };
  J.handR = hand('R'); J.handL = hand('L');
  const im = (geo) => { const m = new THREE.Mesh(geo, material); m.castShadow = m.receiveShadow = true; m.userData.noPaint = true; return m; };
  if (model.native) { const F = { root, J, items: null, model }; root.userData.F = F; if (rig && model.native.rig) splitRig(F, material); F.items = nativeItems(model, J, im, hero, down); return F; }
  const art = model.source === 'art';
  const artItem = (name, fix) => { const f = ART && ART[name + '_front'], sd = ART && ART[name + '_side']; if (!f || !sd) return null; const g = carveItem(f, sd, f.pivot, model.u); fix(g); return g; };
  const artPencil = (c) => artItem('item_pencil_' + c, (g) => g.rotateZ(Math.PI / 2));   // cap (top) -> -x, tip -> +x, like pencilGeo
  if (hero === 'jade') {
    items.pencilR = im(artPencil('blue') || pencilGeo('blue')); items.pencilL = im(artPencil('pink') || pencilGeo('pink')); items.geoBlue = items.pencilR.geometry; items.geoPink = items.pencilL.geometry;
    for (const [h, pc] of [[J.handR, items.pencilR], [J.handL, items.pencilL]]) { const grip = new THREE.Group(); h.add(grip); grip.add(pc); pc.scale.setScalar(0.8); pc.geometry.computeBoundingBox(); pc.position.x = -0.1 * (pc.geometry.boundingBox.max.x - pc.geometry.boundingBox.min.x) * 0.8; }
    items.pencilR.rotation.z = Math.PI / 2 - 0.3; items.pencilL.rotation.z = Math.PI / 2 - 0.3;   // held upright, tip down-forward
    if (!down && !art) { // the two pencils crossed in an X THROUGH the bun (art turnarounds carve their own): caps out one side (back-left), tips out the other
      // tips point down-back-out, caps up-out: seen from behind they cross in an X, the crossing hidden inside the bun
      const bun = new THREE.Group(); bun.position.set(-4.5 * model.u - P[1].x, 78 * model.u - P[1].y, 0); J.head.add(bun);
      const a = im(pencilGeo('blue', 0.55)), b = im(pencilGeo('pink', 0.55));
      for (const [m, sg] of [[a, 1], [b, -1]]) { m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-0.35, -0.75, sg * 0.66).normalize()); bun.add(m); }
      items.bunPencils = bun;
    }
  }
  if (hero === 'ricky') { // the Strat on its strap in front of the belly, neck to his left and up; the hands reach it by IK (poses)
    const uu = model.u; const gt = im(artItem('item_strat', (g) => { g.translate(0, -11 * uu, 0); g.rotateZ(-Math.PI / 2); }) || stratGeo(0.48));
    const holder = new THREE.Group(); holder.add(gt); J.body.add(holder); items.guitar = holder;
    holder.userData = { base: new THREE.Vector3(9 * uu, 8 * uu, 3 * uu), fret: new THREE.Vector3(22 * uu, 0, 3.5 * uu), strum: new THREE.Vector3(-3 * uu, 0, 4.5 * uu) };
    holder.position.copy(holder.userData.base); holder.rotation.set(0.5, Math.PI / 2, 0); }
  if (hero === 'charlie') {
    if (!art) { const gt = im(acousticGeo(0.5)); const holder = new THREE.Group(); holder.position.set(-8.6 * model.u, 4.5, 0); holder.add(gt); gt.rotation.set(0, -Math.PI / 2, 1.05); J.body.add(holder); items.guitar = holder; } // art: the acoustic is carved on his back
    items.cap = im(artItem('item_flatcap', (g) => g.rotateY(Math.PI / 2)) || capGeo()); J.handR.add(items.cap); items.cap.visible = false; }
  return { root, J, items, model };
}

/** a geometry sharing a part mesh's attributes with another index (cached on the model: shared by every figure instance) */
function subGeo(model, part, key) {
  const R = model.native.rig; R._geo ||= {}; if (R._geo[key]) return R._geo[key];
  const src = model.parts[part].geo, g = new THREE.BufferGeometry(); for (const [k, a] of Object.entries(src.attributes)) g.setAttribute(k, a);
  g.setIndex(new THREE.BufferAttribute(R.sub[key], 1)); g.boundingBox = src.boundingBox; g.boundingSphere = src.boundingSphere; return (R._geo[key] = g);
}
/**
 * r6 split rig (native, figres 2.5, opt-in): re-parents the r5 tree into pelvis (J.body) + chest (J.chest, at the waist; head and
 * shoulders hang from it), knee -> ankle (J.ankleR/L) -> toe (J.toeR/L), elbow -> wrist (J.wristR/L, which now carries J.handR/L).
 * Meshes are the r5 part meshes partitioned by voxel, so at rest every triangle is where it was; F.hands[sd][pose] = finger-pose
 * meshes (fist = the r5 hand). F.rig = { piv (model space), foot: { R/L: { heel, toe, ball, ankle } (ankle space) } }.
 */
function splitRig(F, material) {
  const { J, model } = F, R = model.native.rig, P = model.piv;
  const mk = (geo) => { const m = new THREE.Mesh(geo, material); m.castShadow = m.receiveShadow = true; m.userData.noPaint = true; return m; };
  const meshOf = (j) => j.children.find((c) => c.isMesh);
  const reparent = (j, to, toPivot) => { const w = j.position.clone(); to.add(j); j.position.copy(w).sub(toPivot); };
  // pelvis + chest
  const W = R.piv.waist; J.chest = new THREE.Group(); J.chest.userData.chest = true; J.chest.position.copy(W).sub(P[2]); J.body.add(J.chest);
  const tm = meshOf(J.body); tm.geometry = subGeo(model, 'torso', 'pelvis');
  const cm = mk(subGeo(model, 'torso', 'chest')); cm.position.copy(P[2]).sub(W); J.chest.add(cm);
  for (const [k, j] of [['pelvis', J.body], ['chest', J.chest]]) if (R.plugs[k]) { const pm = mk(R.plugs[k]); if (j === J.chest) pm.position.copy(P[2]).sub(W); j.add(pm); }
  for (const k of ['head', 'shoulderR', 'shoulderL']) { const j = J[k]; const p = j.position.clone().add(P[2]); J.chest.add(j); j.position.copy(p).sub(W); }
  F.hands = {}; F.rig = { piv: R.piv, foot: {} }; meshOf(J.head).geometry = subGeo(model, 'head', 'head');   // head minus faceplate + spring pieces
  // face states: the head minus its eye / mouth faceplate + this figure's own faceplate (own colour buffer), see heroes.js faceRig
  if (R.face) {
    const FR = R.face;
    const g = new THREE.BufferGeometry(); for (const [k, a] of Object.entries(FR.geo.attributes)) g.setAttribute(k, k === 'color' ? new THREE.BufferAttribute(a.array.slice(), 3) : a);
    g.setIndex(FR.geo.index); g.boundingBox = FR.geo.boundingBox; g.boundingSphere = FR.geo.boundingSphere;
    const fm = mk(g); fm.name = 'faceplate'; J.head.add(fm); let cur = null;
    F.face = { mesh: fm, state: {}, set(st = {}) {
      const want = FR.mats(st), col = g.attributes.color.array; let dirty = false; cur ||= FR.used.map((c) => c.mat);
      for (let q = 0; q < want.length; q++) { if (want[q] === cur[q]) continue; dirty = true; cur[q] = want[q]; const o = q * 24;
        if (want[q] === FR.used[q].mat) { col.set(FR.col0.subarray(o, o + 24), o); continue; }
        const L = FR.lin[want[q]]; for (let v = 0; v < 8; v++) { const f = FR.fac[q * 8 + v]; col[o + v * 3] = L[0] * f; col[o + v * 3 + 1] = L[1] * f; col[o + v * 3 + 2] = L[2] * f; } }
      if (dirty) g.attributes.color.needsUpdate = true; this.state = { ...st }; return this; } };
  }
  for (const sd of ['R', 'L']) {
    const kn = J['knee' + sd], Pk = P[sd === 'R' ? 8 : 10], A = R.piv['ankle' + sd], T = R.piv['toe' + sd];
    meshOf(kn).geometry = subGeo(model, 'shin' + sd, 'shin' + sd); if (R.plugs['shin' + sd]) kn.add(mk(R.plugs['shin' + sd]));
    const aj = new THREE.Group(); aj.position.copy(A).sub(Pk); kn.add(aj); J['ankle' + sd] = aj;
    const fmesh = mk(subGeo(model, 'shin' + sd, 'foot' + sd)); fmesh.position.copy(Pk).sub(A); aj.add(fmesh); if (R.plugs['foot' + sd]) { const pm = mk(R.plugs['foot' + sd]); pm.position.copy(Pk).sub(A); aj.add(pm); }
    const tj = new THREE.Group(); tj.position.copy(T).sub(A); aj.add(tj); J['toe' + sd] = tj;
    const tmesh = mk(subGeo(model, 'shin' + sd, 'toe' + sd)); tmesh.position.copy(Pk).sub(T); tj.add(tmesh); if (R.plugs['toe' + sd]) { const pm = mk(R.plugs['toe' + sd]); pm.position.copy(Pk).sub(T); tj.add(pm); }
    // foot contact points (ankle space): heel / toe at the sole, from the shoe bounds
    const b = model.parts['shin' + sd].geo.boundingBox; const u = model.u;
    F.rig.foot[sd] = { heel: new THREE.Vector3(b.min.x + 1.3 * u, b.min.y, Pk.z - A.z).add(Pk).sub(A), toe: new THREE.Vector3(b.max.x - 1.3 * u, b.min.y, Pk.z - A.z).add(Pk).sub(A), ball: T.clone().sub(A), ankle: new THREE.Vector3() };
    F.rig.foot[sd].heel.z = F.rig.foot[sd].toe.z = 0;
    // wrist + hand + finger poses
    const el = J['elbow' + sd], Pe = P[sd === 'R' ? 4 : 6], Wr = R.piv['wrist' + sd];
    meshOf(el).geometry = subGeo(model, 'larm' + sd, 'larm' + sd); if (R.plugs['larm' + sd]) el.add(mk(R.plugs['larm' + sd]));
    const wj = new THREE.Group(); wj.position.copy(Wr).sub(Pe); el.add(wj); J['wrist' + sd] = wj;
    const fist = mk(subGeo(model, 'larm' + sd, 'hand' + sd)); fist.position.copy(Pe).sub(Wr); wj.add(fist);
    if (R.plugs['hand' + sd]) { const pm = mk(R.plugs['hand' + sd]); pm.position.copy(Pe).sub(Wr); fist.add(pm); pm.position.set(0, 0, 0); }
    F.hands[sd] = { fist };
    for (const [pose, g] of Object.entries(R.hands[sd])) { const m = mk(g); m.visible = false; wj.add(m); F.hands[sd][pose] = m; }
    const h = J['hand' + sd]; const hp = h.position.clone().add(Pe); wj.add(h); h.position.copy(hp).sub(Wr);
  }
  // spring parts (motion_r2): identity-rest joints at their pivots, each carrying its piece of the source part mesh
  const JOF = { head: 'head', torso: 'body', thighR: 'hipR', thighL: 'hipL' }, POF = { head: P[1], torso: P[2], thighR: P[7], thighL: P[9] };
  F.rig.springs = [];
  for (const part of [...new Set(R.springs.map((s) => s.part))]) { const j = J[JOF[part]]; if (part !== 'head') meshOf(j).geometry = subGeo(model, part, part + '_rest'); if (R.plugs[part + '_rest']) j.add(mk(R.plugs[part + '_rest'])); }
  for (const s of R.springs) {
    const own = s.parent === s.part, pj = own ? J[JOF[s.part]] : J[s.parent], pp = own ? POF[s.part] : R.piv[s.parent], Sp = R.piv[s.name];
    const g = new THREE.Group(); g.name = s.name; g.position.copy(Sp).sub(pp); pj.add(g); J[s.name] = g; F.rig.springs.push(s.name);
    const m = mk(subGeo(model, s.part, 'spring_' + s.name)); m.position.copy(POF[s.part]).sub(Sp); g.add(m);
    if (R.plugs['spring_' + s.name]) { const pm = mk(R.plugs['spring_' + s.name]); pm.position.copy(m.position); g.add(pm); }
  }
  F.setHand = (sd, pose) => setHand(F, sd, pose); F.setFace = (st) => setFace(F, st);
}
/** r6: finger pose of hand sd ('R' | 'L'): 'fist' (default, the r5 hand) | 'grip' | 'point' | 'open'. No-op without the split rig. */
export function setHand(F, sd, pose = 'fist') { const H = F.hands && F.hands[sd]; if (!H) return; const p = H[pose] ? pose : 'fist'; for (const [k, m] of Object.entries(H)) m.visible = k === p; F.handPose = { ...(F.handPose || {}), [sd]: p }; }
/** r6: face state (see heroes.js faceRig): { blink 0..1, look: [x, y] in -1..1, viseme: 'rest' | 'A' | 'E' | 'O' | 'U' | 'M' | 'F' }. No-op without a face rig. */
export function setFace(F, st = {}) { if (F.face) F.face.set(st); }
/** items of a native model (core/heromodels): the same item names / conventions as the carved figures */
function nativeItems(model, J, im, hero, down) {
  const N = model.native, items = {}, P = model.piv;
  if (hero === 'jade') {
    items.pencilR = im(N.pencil.blue); items.pencilL = im(N.pencil.pink); items.geoBlue = items.pencilR.geometry; items.geoPink = items.pencilL.geometry;
    // the pencil goes THROUGH the fist at an angle to the forearm (grip tilt), held about a third of the way from the cap
    if (!N.pencil.gripped) { N.pencil.blue.translate(-N.pencil.len * 0.08, 0, 0); N.pencil.pink.translate(-N.pencil.len * 0.08, 0, 0); N.pencil.gripped = true; }   // native pencils: cap end at +x; gripped nearer the tip so the eraser cap stands clear of the fist / cuff
    for (const [h, pc] of [[J.handR, items.pencilR], [J.handL, items.pencilL]]) { const grip = new THREE.Group(); grip.rotation.z = 0.9; h.add(grip); grip.add(pc); }
    items.pencilR.rotation.z = Math.PI / 2 - 0.3; items.pencilL.rotation.z = Math.PI / 2 - 0.3;
    if (!down && N.bun) {
      // canon: the two pencils go THROUGH the bun like hair sticks, crossing in an X inside it (the crossing is hidden in the
      // bun); both caps come out on one side (her left, -z), both tips on the other (+z); they never lie on the hair
      const bun = new THREE.Group(); if (J.bun) { bun.position.copy(N.bun).sub(N.rig.piv.bun); J.bun.add(bun); } else { bun.position.copy(N.bun).sub(P[1]); J.head.add(bun); }   // r6 rig: the pencils ride the bun spring joint
      const a = im(N.bunPencil.blue), b = im(N.bunPencil.pink);
      if (N.bunPencil.place) {   // r6 canon (heroes.js bunPlace, figres path): BOTH caps up (pink her right, blue her left), X crossing at the bun centre, tips inside the bun
        const Q = N.bunPencil.place; a.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), Q.blue.tip); a.position.copy(Q.blue.off); b.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), Q.pink.tip); b.position.copy(Q.pink.off);
      } else {
      a.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -0.375, 0.927));   // blue: cap up-left -> tip down-right (22 deg: from the front the X stays behind the head, no 'antennae')
      b.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0.375, 0.927));    // pink: cap down-left -> tip up-right
      }
      bun.add(a, b); items.bunPencils = bun;
    }
  }
  if (hero === 'ricky' && N.strat) {
    const holder = new THREE.Group(); holder.add(im(N.strat.geo)); (J.chest || J.body).add(holder); items.guitar = holder;   // r6 rig: on the chest (strap over the shoulder)
    holder.userData = { base: N.strat.base.clone().sub(J.chest ? J.chest.position : new THREE.Vector3()), fret: N.strat.fret.clone(), strum: N.strat.strum.clone() };
    holder.position.copy(holder.userData.base); holder.rotation.set(0.5, Math.PI / 2, 0);
  }
  if (hero === 'charlie' && N.acoustic) {   // slung on his back; chord / sustain swing it to the front and play it (pose -> playGuitar)
    const A = N.acoustic; const holder = new THREE.Group(); holder.add(im(A.geo)); (J.chest || J.body).add(holder); items.guitar = holder;
    const co = J.chest ? J.chest.position : new THREE.Vector3();   // r6 rig: guitar on the chest; positions in chest space
    holder.userData = { base: A.base.clone().sub(co), fret: A.fret.clone(), strum: A.strum.clone(), slung: J.chest ? { pos: A.slung.pos.clone().sub(co), quat: A.slung.quat } : A.slung };
    holder.position.copy(A.slung.pos); holder.quaternion.copy(A.slung.quat);
    items.cap = im(N.cap); J.handR.add(items.cap); items.cap.visible = false;
    items.capFront = im(N.cap); J.body.add(items.capFront); items.capFront.visible = false;   // shield: held out front by both hands (IK)
  }
  return items;
}

// ------------------------------------------------------------------------------------------------ IK
const _v = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3()); const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
/** 2-bone arm IK: put hand `sd` ('R' | 'L') at `target` (J.body space), elbow toward `pole` (body-space direction) */
function ikArm(F, sd, target, pole) {
  const J = F.J, sh = J['shoulder' + sd], el = J['elbow' + sd], hd = J['hand' + sd];
  if (sh.parent !== J.body) { const c = sh.parent; c.updateMatrix(); target = target.clone().applyMatrix4(new THREE.Matrix4().copy(c.matrix).invert()); pole = pole.clone().applyQuaternion(c.quaternion.clone().invert()); }   // r6 rig: the shoulders hang from J.chest; targets stay in J.body space
  const E0 = el.position, Hh = hd.parent === el ? hd.position : _v[5].copy(hd.position).applyQuaternion(hd.parent.quaternion).add(hd.parent.position);   // r6 rig: the hand hangs from the wrist
  const T = _v[0].copy(target).sub(sh.position); const d = T.length();
  const handAt = (th, out) => out.set(Hh.x * Math.cos(th) - Hh.y * Math.sin(th), Hh.x * Math.sin(th) + Hh.y * Math.cos(th), Hh.z).add(E0);
  let lo = 0, hi = 2.7; const H0 = _v[1];
  if (handAt(0, H0).length() <= d) hi = 0; else if (handAt(hi, H0).length() >= d) lo = hi;
  else for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (handAt(m, H0).length() > d) lo = m; else hi = m; }
  const th = (lo + hi) / 2; handAt(th, H0);
  const Tn = _v[2].copy(T).normalize(); _q.setFromUnitVectors(H0.normalize(), Tn);
  const E1 = _v[3].copy(E0).applyQuaternion(_q); const Pp = _v[4].copy(pole);
  E1.addScaledVector(Tn, -E1.dot(Tn)); Pp.addScaledVector(Tn, -Pp.dot(Tn));
  if (E1.lengthSq() > 1e-8 && Pp.lengthSq() > 1e-8) { E1.normalize(); Pp.normalize(); const ang = Math.atan2(_v[1].crossVectors(E1, Pp).dot(Tn), E1.dot(Pp)); _q2.setFromAxisAngle(Tn, ang); _q.premultiply(_q2); }
  sh.quaternion.copy(_q); el.rotation.set(0, 0, th);
}
const _pt = new THREE.Vector3();
/** a point on the guitar (holder-local, before the guitar mesh) in J.body space */
function guitarPt(g, local) { g.updateMatrix(); _pt.copy(local).applyMatrix4(g.matrix); if (g.parent && g.parent.name !== 'body' && g.parent.parent && g.parent.userData.chest) { g.parent.updateMatrix(); _pt.applyMatrix4(g.parent.matrix); } return _pt; }   // r6 rig: chest space -> J.body space

// ------------------------------------------------------------------------------------------------ poses
/** (v47_hands) guitar-playing rig: null = v4.6 (hands IK'd onto points inside the guitar) | 'grip' = hands on the strings (fretting hand wraps the
 *  neck, picking hand over the sound hole / pickups, no forearm through the body) */
export const HANDS_V47 = 'grip';
/** both hands on the Strat: neck = raise angle (rad), strum = picking-hand offset (model px), lift = guitar raise (px) */
function playGuitar(F, { strum = 0, neck = 0.5, lift = 0, off = null } = {}) {
  if ((globalThis.__HANDS47 !== undefined ? globalThis.__HANDS47 : HANDS_V47) && F.model.native) return playGuitar47(F, { strum, neck, lift, off });   // (__HANDS47: dev bench override)
  const g = F.items.guitar, U = g.userData, u = F.model.u;
  g.position.copy(U.base).add(_v[0].set(0, lift * u, 0)); g.rotation.set(neck, Math.PI / 2, 0);
  const fret = guitarPt(g, U.fret).clone(), st = guitarPt(g, U.strum).clone().add(_v[0].set(0, strum * u, 0));
  ikArm(F, 'L', fret, _v[1].set(0.1, -1, -0.7).clone());
  ikArm(F, 'R', st, _v[2].set(-0.4, -1, 0.6).clone());
}
/** (v47_hands) guitar geometry in guitar-mesh local model px (heroes.js stratGeo / acousticGeo): face = top-face z, neckZ = neck centre z,
 *  fret = fretting-hand u along the neck, pick = picking-hand [u, v] (Strat: between the pickups; acoustic: over the sound hole),
 *  wrap = fretting-hand centre offset from the neck centre [z, v] (px; behind + under: the palm takes the neck, the fingers close over the board),
 *  over = picking-hand centre above the face (px), elbow / elbowL = elbow pole directions (guitar local) */
export const GTR47 = {
  strat: { face: 2, neckZ: 0.5, fret: 23, wrap: [0.6, 0], pick: [-1.0, 0.4], over: 4.4, elbow: [-0.55, 0.9, 1.25], elbowL: [0.15, -1, -0.55] },
  acoustic: { face: 5, neckZ: 3.5, fret: 21, wrap: [0.6, 0], pick: [1.8, 0.2], over: 4.4, elbow: [-0.6, 0.75, 0.9], elbowL: [0.15, -1, -0.55] },
};
const _m47 = new THREE.Matrix4(), _q47 = new THREE.Quaternion(), _q47b = new THREE.Quaternion();
/** (v47_hands) both hands ON the strings, nothing through the guitar: the fretting hand wraps the neck ('grip': palm behind the neck, fingers
 *  curled over the fretboard, the wrist turned so the grip runs along the neck), the picking hand ('grip' = holding the pick) hovers over the
 *  sound hole / pickups at a fist's height above the top and moves ACROSS the strings (guitar-local v), its forearm coming over the top of
 *  the lower bout (elbow in front of the body, not behind it). Same signature as playGuitar. */
function playGuitar47(F, { strum = 0, neck = 0.5, lift = 0, off = null } = {}) {
  const g = F.items.guitar, U = g.userData, u = F.model.u, G = U.slung ? GTR47.acoustic : GTR47.strat, J = F.J;
  g.position.copy(U.base).add(_v[0].set(0, lift * u, 0)); g.rotation.set(neck, Math.PI / 2, 0);
  const mesh = g.children.find((c) => c.isMesh) || g;
  const loc = (x, y, z) => guitarPt(g, _v[0].set(x * u, y * u, z * u).applyMatrix4(mesh.matrix)).clone();   // guitar-mesh px -> J.body space
  const o = loc(0, 0, 0); const dir = (x, y, z) => loc(x, y, z).sub(o).normalize();
  const fret = loc(G.fret, G.wrap[1], G.neckZ + G.wrap[0]), pick = loc(G.pick[0], G.pick[1] + strum, G.face + G.over);
  if (off) pick.add(_v[1].set(off[0] * u, off[1] * u, off[2] * u));   // (slab_insert strumPose) extra picking-hand offset, J.body space px
  const poleL = dir(...G.elbowL), poleR = dir(...G.elbow);
  if (F.setHand) { setHand(F, 'L', 'grip'); setHand(F, 'R', 'grip'); }
  // the fretting wrist: hand x (fingers) -> the fretboard normal, hand z (the grip channel) -> along the neck; re-solve the arm after turning it
  const wL = J.wristL;
  for (let k = 0; k < 3; k++) {
    ikArm(F, 'L', fret, poleL);
    if (!wL) break;
    F.root.updateMatrixWorld(true);
    const gw = mesh.matrixWorld, X = _v[2].setFromMatrixColumn(gw, 2).normalize(), Z = _v[3].setFromMatrixColumn(gw, 0).normalize(), Y = _v[4].crossVectors(Z, X).normalize();
    _q47.setFromRotationMatrix(_m47.makeBasis(X, Y, Z));                                  // wanted hand orientation (world)
    wL.parent.getWorldQuaternion(_q47b); wL.quaternion.copy(_q47b.invert().multiply(_q47));
  }
  ikArm(F, 'L', fret, poleL); ikArm(F, 'R', pick, poleR);
  F._gtr47 = { wL: wL ? wL.quaternion.clone() : null };   // for MotionFigure layers (core/motion/figure.js): the wrist + finger poses survive the FK capture
}
/** (v47_hands) the playing pose for scene helpers (slab_insert strumPose): playGuitar with an extra picking-hand offset off = [x, y, z] (J.body px) */
export function playGuitarRig(F, opts = {}) { if (F.items?.guitar?.userData.base) playGuitar(F, opts); }
/** (v47_hands) where the picking hand plays (guitar-holder local; for FX origins / world IK): over the strings, not inside the body */
export function guitarPick47(g, F) { const G = g.userData.slung ? GTR47.acoustic : GTR47.strat, u = F.model.u; return new THREE.Vector3(G.pick[0] * u, G.pick[1] * u, (G.face + G.over) * u); }
/** zero every joint */
function rest(F) { for (const k of ['body', 'head', 'shoulderR', 'shoulderL', 'elbowR', 'elbowL', 'hipR', 'hipL', 'kneeR', 'kneeL', 'legs', 'handR', 'handL']) { const j = F.J[k]; j.rotation.set(0, 0, 0); }
  if (F.rig) { for (const k of ['chest', 'ankleR', 'ankleL', 'toeR', 'toeL', 'wristR', 'wristL']) F.J[k].rotation.set(0, 0, 0); setHand(F, 'R', 'fist'); setHand(F, 'L', 'fist'); if (F.face) F.face.set({}); for (const k of F.rig.springs || []) F.J[k].rotation.set(0, 0, 0); }   /* r6 split rig: new joints, springs, fingers, face at rest */ F.J.body.position.y = F.model.piv[2].y; F.J.legs.position.y = F.model.piv[2].y; F.root.position.y = 0; }
const S = (deg) => deg * D2R;
/**
 * Pose a figure. a = anim name (Actor anim, e.g. 'run'), p = cycle phase 0..1 (looping) or progress 0..1 (one-shot),
 * opts = { pencil, hero }. Joint convention (hero faces +x): rotation.z > 0 swings a hanging limb FORWARD, elbows bend
 * forward with +z, knees bend backward with -z; abduction (arm out sideways) = rotation.x (-) right / (+) left.
 */
export function pose(F, a, p, { hero = 'jade', pencil = false } = {}) {
  rest(F); const J = F.J, it = F.items; const s = Math.sin(p * Math.PI * 2), c = Math.cos(p * Math.PI * 2);
  const set = (j, z = 0, x = 0, y = 0) => J[j].rotation.set(S(x), S(y), S(z));
  const bob = (v) => { F.root.position.y = v * F.model.u; };
  const armsA = (ab = 9) => { set('shoulderR', 0, -ab); set('shoulderL', 0, ab); };
  if (it.pencilR) { it.pencilR.geometry = it.geoBlue; it.pencilL.geometry = it.geoPink; /* blue cap (rainbow) right, pink cap (graphite) left */ it.pencilR.visible = it.pencilL.visible = !!pencil; it.pencilR.position.set(0, 0, 0); it.pencilR.rotation.set(0, 0, Math.PI / 2 - 0.3); it.pencilL.rotation.set(0, 0, Math.PI / 2 - 0.3); }
  if (it.bunPencils) it.bunPencils.visible = !pencil;
  if (it.cap) it.cap.visible = false;
  if (it.capFront) it.capFront.visible = false;
  F._gtr47 = null;
  if (it.guitar && it.guitar.userData.slung) { it.guitar.position.copy(it.guitar.userData.slung.pos); it.guitar.quaternion.copy(it.guitar.userData.slung.quat); }   // native Charlie: on his back
  else if (it.guitar && it.guitar.userData.base) { it.guitar.position.copy(it.guitar.userData.base); it.guitar.rotation.set(0.5, Math.PI / 2, 0); }
  let base = a.replace(/^(jade|charlie|ricky)_/, '').replace(/^hat_/, '').replace(/^back_/, '').replace(/_pencil$/, '').replace(/_hairdown$/, '');
  base = ({ power_chord: 'chord', run_hairdown: 'run', bun_pull: 'victory', twin_draw: 'draw_rainbow', erase: 'drum', dangle: 'hang', dangle_play: 'sustain', parachute_carry: 'parachute' })[base] || base;
  switch (base) {
    case 'run': case 'back_run': {
      set('hipR', 38 * s); set('hipL', -38 * s); set('kneeR', -12 - 58 * Math.max(0, -s)); set('kneeL', -12 - 58 * Math.max(0, s));
      set('shoulderR', -42 * s, -8); set('shoulderL', 42 * s, 8); set('elbowR', 68 + 10 * s); set('elbowL', 68 - 10 * s);
      set('body', -10); set('head', 6); bob(1.4 * Math.abs(c)); break; }
    case 'jump': { const up = p < 0.5; set('hipR', up ? 55 : 20); set('hipL', up ? 15 : -10); set('kneeR', up ? -80 : -30); set('kneeL', up ? -45 : -20); set('shoulderR', 150, -14); set('shoulderL', 120, 14); set('elbowR', 25); set('elbowL', 35); set('body', -6); break; }
    case 'victory': { set('shoulderR', 165, -12); set('elbowR', 10); set('shoulderL', -15, 25); set('elbowL', 20); set('head', 8); bob(0.6 * Math.abs(s)); break; }
    case 'sing': { set('shoulderR', 62, -10); set('elbowR', 105); set('shoulderL', -10 + 6 * s, 38); set('elbowL', 25); set('head', 10 + 3 * s); set('hipR', 8); set('hipL', -8); bob(0.5 * Math.abs(s));
      if (it.pencilR) { it.pencilR.rotation.set(0, 0, Math.PI / 2 + 0.2); } break; }
    case 'draw_rainbow': case 'draw_graphite': {
      set('shoulderR', 84, -4); set('elbowR', 6); set('shoulderL', -18, 22); set('elbowL', 18); set('hipR', 18); set('hipL', -14); set('kneeL', -8); set('body', -6); set('head', 2);
      if (it.pencilR) { if (base === 'draw_graphite') { it.pencilR.geometry = it.geoPink; it.pencilL.geometry = it.geoBlue; } it.pencilR.rotation.set(0, 0, 0.15); it.pencilR.position.set(1.5, 0, 0); }
      if (F.model.native && hero === 'jade') {   // k09 lunge: front knee bent, back leg long, leaning into the stroke, pencil hand forward-down
        set('hipR', 46); set('kneeR', -48); set('hipL', -26); set('kneeL', -6); set('body', -14); set('head', 8); bob(-4.2);
        set('shoulderR', 58, -6); set('elbowR', 24); set('shoulderL', -34, 28); set('elbowL', 30);
        if (it.pencilR) it.pencilR.rotation.set(0, 0, 0.5);
      } break; }
    case 'drum': { set('shoulderR', 50 + 28 * s, -10); set('shoulderL', 50 - 28 * s, 10); set('elbowR', 55 - 25 * s); set('elbowL', 55 + 25 * s); set('hipR', 10); set('hipL', -10); bob(0.5 * Math.abs(s));
      if (it.pencilR) { it.pencilR.rotation.set(0, 0, 0.3); it.pencilL.rotation.set(0, 0, 0.3); } break; }
    case 'throw': { const w = p < 0.4 ? p / 0.4 : 1; const f = p < 0.4 ? 0 : (p - 0.4) / 0.6; set('shoulderR', -60 * (1 - f) * w + 115 * f, -20); set('elbowR', 70 * (1 - f) + 10 * f); set('shoulderL', 30 - 40 * f, 15); set('body', 8 - 18 * f); set('hipR', 20); set('hipL', -18);
      if (F.model.native) {   // hand-keyed (native): wind-up (arm cocked back and high, torso twisted back), then a follow-through across the body
        const wu = Math.min(1, p / 0.3), ft = p < 0.42 ? 0 : Math.min(1, (p - 0.42) / 0.4), e = ft * ft * (3 - 2 * ft);
        const W2 = wu * (1 - e);
        set('shoulderR', -150 * W2 + 72 * e, -22 * W2 + 46 * e, 0); set('elbowR', 85 * W2 + 22 * e);       // overhand: cocked up behind the head -> forward-down across the body
        set('shoulderL', 70 * W2 + 15 * e, 16 - 6 * e, 0); set('elbowL', 30 * W2 + 40 * e);
        J.body.rotation.set(0, S(-28 * W2 + 32 * e), S(6 * W2 - 14 * e)); set('head', 4);
        set('hipR', 6 * W2 - 18 * e); set('kneeR', -10 * e); set('hipL', -10 * W2 + 28 * e); set('kneeL', -18 * e);
      } break; }
    case 'shield': { set('shoulderR', 80, -12); set('elbowR', 60); set('shoulderL', 75, 12); set('elbowL', 65); set('body', -8); set('hipR', 15); set('hipL', -12); if (it.cap) { it.cap.visible = true; it.cap.rotation.set(0, 0, Math.PI / 2); it.cap.position.set(2, 0, -1.2); }
      if (F.model.native && it.capFront) {   // hand-keyed (native): the flat cap held out in front of the chest, crown forward, both hands on its rim
        const u = F.model.u; it.cap.visible = false; it.capFront.visible = true; set('body', -6); set('head', -4); set('hipR', 18); set('kneeR', -14); set('hipL', -16); set('kneeL', -4);
        it.capFront.position.set(10.4 * u, 21 * u, 0); it.capFront.rotation.set(0, 0, -Math.PI / 2 + 0.12);
        ikArm(F, 'R', _v[0].set(11.2 * u, 21 * u, 8.4 * u).clone(), _v[1].set(-0.3, -1, 0.9).clone()); ikArm(F, 'L', _v[2].set(11.2 * u, 21 * u, -8.4 * u).clone(), _v[3].set(-0.3, -1, -0.9).clone());
      } break; }
    case 'parachute': { set('shoulderR', 172, -8); set('shoulderL', 172, 8); set('elbowR', 8); set('elbowL', 8); set('hipR', 10 + 6 * s); set('hipL', -6 - 6 * s); set('kneeR', -15); set('kneeL', -25); break; }
    case 'trampoline': { const b = Math.abs(s); set('hipR', 45 * b); set('hipL', 40 * b); set('kneeR', -75 * b); set('kneeL', -70 * b); set('shoulderR', 30 + 30 * b, -20); set('shoulderL', 30 + 30 * b, 20); bob(-3.2 * b); break; }
    case 'pull': { set('body', 14); set('shoulderR', 72, -6); set('shoulderL', 68, 6); set('elbowR', 35); set('elbowL', 40); set('hipR', 28); set('hipL', -22); set('kneeL', -15); break; }
    case 'chord': { set('body', -5); set('head', -9); set('hipR', 14); set('hipL', -14); set('kneeL', -6); bob(0.4 * Math.abs(s));
      if (it.guitar && it.guitar.userData.base) playGuitar(F, { strum: 2.6 * s, neck: 0.5 }); else { set('shoulderR', 25 + 12 * Math.max(0, s), -18); set('elbowR', 75 - 10 * s); set('shoulderL', 72, 22); set('elbowL', 85); } break; }
    case 'sustain': { set('body', 13); set('head', 12); set('hipR', 20); set('hipL', -12); set('kneeR', -14); set('kneeL', -6); // leaning back, neck up (k08b Ricky)
      if (it.guitar && it.guitar.userData.base) playGuitar(F, { strum: 0, neck: 0.95, lift: 2 }); else { set('shoulderR', 140, -20); set('elbowR', 20); set('shoulderL', 80, 18); set('elbowL', 80); } break; }
    case 'dance': { set('shoulderR', 60 + 50 * s, -25); set('shoulderL', -30 * s, 30); set('elbowR', 40); set('elbowL', 40); set('hipR', 18 * s); set('hipL', -18 * s); set('kneeR', -20 * Math.max(0, s)); set('kneeL', -20 * Math.max(0, -s)); bob(1.2 * Math.abs(s)); break; }
    case 'hang': { set('shoulderR', 178, -6); set('shoulderL', 178, 6); set('hipR', 6 + 4 * s); set('hipL', -6 - 4 * s); set('kneeR', -12); set('kneeL', -18); break; }
    case 'read': { set('shoulderR', 52, -12); set('shoulderL', 52, 12); set('elbowR', 82); set('elbowL', 82); set('head', -12); bob(0.3 * Math.abs(s)); break; }
    default: { // idle / back / anything unknown: breathing stand
      armsA(9 + 2 * s); set('elbowR', 10); set('elbowL', 10); set('head', 2 * s); bob(0.3 * (0.5 + 0.5 * s));
      if (pencil) { set('elbowR', 35); set('elbowL', 35); }
      if (it.guitar && it.guitar.userData.base && hero === 'ricky') playGuitar(F, { strum: 0.6 * s, neck: 0.45 });   // Ricky idles with his hands on the Strat
    }
  }
}
