// 3D-native hero models (MODELS team; round 2, 2026-10-16): Jade (hair up / hair down), Charlie (cap / hatless), Ricky.
// Stylized adults like k08b / k09: ~97 design units tall, head ~1/5 of the height, chunky limbs, big hands and feet. Built from
// part primitives (sdf.js) in DESIGN units and voxelized at RES voxels per unit, per rig part (voxfig.js buildFigure / pose
// drive them exactly like the carved figures). One flat colour per material; the mesher adds a per-voxel value jitter and a
// darkened edge ring per voxel face (LOOK) so every voxel reads, and its baked AO + the light do the shading.
// Model space: feet centre at the origin, y up, the hero faces +x, +z = the hero's right side.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ellipsoid, superEllipsoid, sphere, roundBox, cone, sprism, cylinder, ring, clip, disp, union, P, hash, textTest, FONT46, FONT36, voxelizeParts, meshItem, splitMesh, plugMesh, faceBlocks, voxelAt } from './sdf.js';

export const PARTS = ['head', 'torso', 'uarmR', 'larmR', 'uarmL', 'larmL', 'thighR', 'shinR', 'thighL', 'shinL'];
/** the approved density: every model below was authored (and signed off) at this lattice */
export const BASE_RES = 1.25;
/**
 * voxels per design unit (1.25: ~121 voxels tall; density spike: 2.5 = ~240 voxels tall). OPT-IN: ?figres=2.5 in the page URL
 * (render.js / tools/models_shots.js --figres 2.5) or globalThis.FIGRES; the default stays BASE_RES, so approved cuts are unchanged.
 */
export const RES = (() => { let q = NaN; try { q = parseFloat(new URLSearchParams(globalThis.location?.search || '').get('figres')); } catch (e) { /* no location */ }
  if (!(q > 0)) q = +globalThis.FIGRES; return q >= 1 && q <= 4 ? q : BASE_RES; })();
/** true when RES differs from the approved lattice: features authored in BASE lattice units are re-mapped (else code paths are untouched) */
const HI = RES !== BASE_RES;
/** base-lattice index of a voxel-centre design coordinate (== the raw lattice index at BASE_RES) */
const bi = (c) => Math.floor(c * BASE_RES);
/** n voxels at the approved density, in design units (depths authored in voxels keep their design size at any RES) */
const bvox = (n) => n / BASE_RES;
/** in-scene scale of the native figures vs the carved ones (feet anchors unchanged): world units per design unit = 0.54 * SCALE */
export const SCALE = (() => { try { const q = parseFloat(new URLSearchParams(globalThis.location?.search || '').get('figscale')); if (q > 0.5 && q < 3) return q; } catch (e) { /* no location */ } return 1.3; })();   // ?figscale= overrides (tuning)
export const UNIT = 0.54 * SCALE;
/** voxel read (k08b): per-voxel value jitter + darkened face-edge ring */
export const LOOK = { ao: 0.32, jitter: 0.045, edge: 0.2, inset: 0.15, edgeAttr: true };   // edge ring applied in the figure shader (voxfig patchVoxelEdges), faded below ~3 px per voxel

// ------------------------------------------------------------------------------------------------ skeleton
const SKEL = { neck: 76, hip: 45.5, knee: 24.5, ankle: 6, shY: 71.5, shZ: 12.4, elY: 55.5, wrY: 42, legZ: 6.0 };
function skeleton(o = {}) {
  const S = { ...SKEL, ...o };
  const side = (sg) => ({ sg, sh: [0, S.shY, sg * S.shZ], el: [0, S.elY, sg * S.shZ], wr: [0, S.wrY, sg * S.shZ], hipJ: [0, S.hip, sg * S.legZ], knee: [0, S.knee, sg * S.legZ], ankle: [0, S.ankle, sg * S.legZ] });
  S.R = side(1); S.L = side(-1);
  S.pivots = { head: [0.3, S.neck, 0], torso: [0, S.hip, 0], uarmR: S.R.sh, larmR: S.R.el, uarmL: S.L.sh, larmL: S.L.el, thighR: S.R.hipJ, shinR: S.R.knee, thighL: S.L.hipJ, shinL: S.L.knee };
  return S;
}
/** vertical rounded box between heights y0 < y1 around column (x, z), half width r (x) / rz (z) */
const vbox = (x, z, y0, y1, r, rad = Math.min(2, r), rz = r) => roundBox([x, (y0 + y1) / 2, z], [r, (y1 - y0) / 2, rz], rad);
/** ribbing: alternate a darker rib material on every other lattice column (by the larger of the two horizontal indices) */
const rib = (mat, ribMat, ok) => ({ kind: 'vol', mats: [mat], fn: (x, y, z, m, ix, iy, iz) => ok(x, y, z) && ((HI ? bi(x) + bi(z) : ix + iz) & 1) ? ribMat : null });   // HI: rib width kept in design units

/**
 * Arms (round, k08b: voxel cylinders). o = { skin: [upper, lower] radius, sleeve: mat | null, sleeveR: [upper, elbow, end],
 * sleeveTo, shoulder: shoulder-cap radius, cuff: { y0, y1, r, mat } }. Mitten hands with a visible thumb.
 */
function arms(S, M, o) {
  const n = 2.3;
  for (const A of [S.R, S.L]) {
    const U = A.sg > 0 ? 'uarmR' : 'uarmL', L = A.sg > 0 ? 'larmR' : 'larmL', z = A.sh[2], [ru, rl] = o.skin;
    M.prims.push(P(sprism(0, z, S.elY - 0.5, S.shY, ru * 0.92, ru * 0.92, ru, ru * 1.04, n, 1.4), U, 'skin'));
    M.prims.push(P(ellipsoid(A.el, [rl + 0.3, rl + 0.5, rl + 0.3]), L, 'skin'), P(sprism(0, z, S.wrY, S.elY, rl * 0.84, rl * 0.84, rl, rl, n, 1.2), L, 'skin'));
    const hy = S.wrY - 3.3;   // mitten: rounded palm block + a thumb on the inner front (15% bigger than r2)
    M.prims.push(P(superEllipsoid([0.6, hy, z], [3.0, 3.6, 2.55], 2.6), L, 'skin', { prio: 6 }), P(cone([1.7, hy + 1.6, z - A.sg * 1.5], [3.5, hy - 0.5, z - A.sg * 1.8], 1.2, 1.05), L, 'skin', { prio: 6 }));
    const sb = o.shoulder; M.prims.push(P(ellipsoid(A.sh, [sb, sb * 0.95, sb]), U, o.sleeve || 'skin', { prio: 2 }));   // round shoulder cap
    if (o.sleeve) {
      const [su, sl, se = sl * 0.88] = o.sleeveR;
      if (o.sleeveTo >= S.elY) M.prims.push(P(sprism(0, z, o.sleeveTo, S.shY, su * 1.03, su * 1.03, su, su, n, 1.4), U, o.sleeve, { prio: 2 }));
      else { M.prims.push(P(sprism(0, z, S.elY, S.shY, sl, sl, su, su, n, 1.8), U, o.sleeve, { prio: 2 }), P(ellipsoid(A.el, [sl + 0.2, sl + 0.3, sl + 0.2]), L, o.sleeve, { prio: 2 }),
        P(sprism(0, z, o.sleeveTo, S.elY, se, se, sl, sl, n, 1.4), L, o.sleeve, { prio: 2 })); }   // tapering to the cuff
      if (o.cuff) M.prims.push(P(sprism(0, z, o.cuff.y1, o.cuff.y0, o.cuff.r, o.cuff.r, o.cuff.r, o.cuff.r, n, 0.8), L, o.cuff.mat, { prio: 3 }));
    }
  }
}
/**
 * Legs (round thighs / knees / calves). o = { pants, hi: fold-ridge material, thigh: [r, cx], knee, shin: [r at the hem, cx],
 * calf: r (rounder calf below the knee), hemY, hem: { y1, r, fold }, creases / creasesBack: [y...] (2 voxels deep + a lighter
 * ridge above each, so folds survive shadow), shoe: { c: [x, y], h, rad, mat, sole, soleY, shaft, shaftR } }
 */
function legs(S, M, o) {
  const n = 2.4, depth = (HI ? bvox(2) : 2 / RES) + 0.1;   // 2 approved voxels deep at any RES
  for (const A of [S.R, S.L]) {
    const T = A.sg > 0 ? 'thighR' : 'thighL', Sh = A.sg > 0 ? 'shinR' : 'shinL', z = A.hipJ[2], [rt, cx] = o.thigh, rk = o.knee, [rh, sx] = o.shin;
    M.prims.push(P(sprism(cx, z, S.knee, S.hip + 0.6, rk, rk, rt, rt, n, 2.2), T, o.pants, { prio: 2 }));
    M.prims.push(P(ellipsoid([sx, S.knee, z], [rk, rk * 0.9, rk]), Sh, o.pants, { prio: 2 }));
    M.prims.push(P(sprism(sx, z, o.hemY, S.knee, rh, rh, rk, rk, n, 2.0), Sh, o.pants, { prio: 2 }));
    if (o.calf) M.prims.push(P(ellipsoid([sx - 0.9, S.knee - 7.5, z], [o.calf, 6.5, o.calf]), Sh, o.pants, { prio: 2 }));
    if (o.hem) { M.prims.push(P(sprism(sx + 0.2, z, o.hemY, o.hem.y1, o.hem.r, o.hem.r, o.hem.r - 0.2, o.hem.r - 0.2, n, 1.6), Sh, o.pants, { prio: 2 }));
      if (o.hem.fold) M.prims.push(P(sprism(sx + 0.2, z, o.hem.fold - 0.9, o.hem.fold + 0.9, o.hem.r - 0.1, o.hem.r - 0.1, o.hem.r - 0.1, o.hem.r - 0.1, n, 0.8), Sh, o.pants, { prio: 2 })); }
    const crease = (yc, front) => { const part = yc > S.knee ? T : Sh; const r = yc > S.knee ? rt : Math.max(rh, rk);
      const xf = front ? cx + r : cx - r, sg = front ? 1 : -1;
      M.cuts.push({ ...roundBox([xf - sg * (depth / 2 - 0.4), yc, z + (front ? 0 : A.sg * 0.6)], [depth / 2 + 0.4, 0.45, r * 0.75], 0), parts: [part], mats: [o.pants] });
      if (o.hi) M.decals.push({ kind: 'vol', parts: [part], mats: [o.pants], fn: (x, y) => y >= yc + 0.45 && y < yc + 1.6 && sg * (x - xf) > -depth - 1.4 ? o.hi : null }); };
    for (const yc of o.creases || []) crease(yc, true);
    for (const yc of o.creasesBack || []) crease(yc, false);
    const sh = o.shoe; M.prims.push(P(roundBox([sh.c[0], sh.c[1], z], sh.h, sh.rad), Sh, (x, y) => y < sh.soleY ? sh.sole : sh.mat, { prio: 1 }));
    if (sh.shaft) M.prims.push(P(sprism(0.2, z, 3, sh.shaft, sh.shaftR, sh.shaftR, sh.shaftR * 0.95, sh.shaftR * 0.95, n, 1.4), Sh, sh.mat, { prio: 1 }));
  }
}
function headBase(M, o) {
  M.prims.push(P(vbox(0.4, 0, 70.5, 80, o.neckR, 1.6), 'head', 'skin'));
  M.prims.push(P(roundBox(o.skull.c, o.skull.h, o.skull.rad), 'head', 'skin'));
  if (o.jaw) M.prims.push(P(roundBox(o.jaw.c, o.jaw.h, o.jaw.rad), 'head', 'skin'));
  if (o.face) M.prims.push(P(faceShape(o.face), 'head', 'skin'));
  if (o.ears) for (const sg of [1, -1]) M.prims.push(P(roundBox([o.ears[0], o.ears[1], sg * o.ears[2]], [1.4, 2.1, 1.1], 0.8), 'head', 'skin'));
}
/**
 * Face: rects [y0, y1, z0, z1, mat] painted on the front skin layer; nose bump rects; profile eye (the eye wraps the face corner
 * so a side view shows it, like k08b's Ricky)
 */
function face(M, feats, nose, eye, cheeks) {
  if (cheeks) for (const sg of [1, -1]) M.prims.push(P(ellipsoid([cheeks.x, cheeks.y, sg * cheeks.z], cheeks.r), 'head', 'skin'));   // cheek volume
  M.decals.push({ kind: 'proj', axis: '+x', parts: ['head'], mats: ['skin'], fn: (y, z) => { for (const [y0, y1, z0, z1, m] of feats) if (y >= y0 && y < y1 && z >= z0 && z < z1) return m; return null; } });
  if (nose) M.decals.push({ kind: 'add', axis: '+x', parts: ['head'], at: nose });
  if (eye) for (const ax of ['+z', '-z']) M.decals.push({ kind: 'proj', axis: ax, parts: ['head'], mats: ['skin'], fn: (y, x) => y >= eye.y0 && y < eye.y1 && x >= eye.x0 && x < eye.x1 ? eye.mat : null });
}
const mirror = (rects) => rects.flatMap(([y0, y1, z0, z1, m]) => [[y0, y1, z0, z1, m], [y0, y1, -z1, -z0, m]]);
/**
 * r4 face volume: ONE flat front plane (x = front) with rounded side corners; the width tapers from the cheekbones (wCheek at
 * yCheek) to a soft rounded chin (wChin at yChin): heart (Jade) or square-ish (Charlie / Ricky). No jaw box, so no stair-step
 * under the cheeks. o = { front, back, yChin, yCheek, yTop, wCheek, wChin, r }
 */
function faceShape(o) {
  const xc = (o.front + o.back) / 2, hx = (o.front - o.back) / 2;
  const C = o.chin;   // r6 (HI): a rounded U chin: quarter ellipse (half width C.w, height C.h), then a jaw line of slope C.k
  const w = C ? (y) => { const d = y - o.yChin; if (d < C.h) { const u = Math.max(0, d / C.h); return C.w * Math.sqrt(u * (2 - u)); } return Math.min(o.wCheek, C.w + C.k * (d - C.h)); } : (y) => { const t = Math.max(0, Math.min(1, (y - o.yChin) / (o.yCheek - o.yChin))); return Math.min(o.wChin + (o.wCheek - o.wChin) * Math.pow(t, o.taper ?? 0.85), o.wChin * Math.sqrt(Math.max(0, (y - o.yChin) / (o.chinR ?? 1.5))) + 0.6); };
  return { f: (x, y, z) => {
    const wy = w(y); const r = Math.min(o.r, wy * (C ? C.rk : 0.9)); const xf = o.front - Math.max(0, o.yChin + 1.2 - y) * 0.8;   // the chin's underside recedes a little
    const qx = Math.abs(x - (xc + (xf - o.front) / 2)) - (hx + (xf - o.front) / 2) + r, qz = Math.abs(z) - wy + r;
    const d = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
    return Math.max(d, o.yChin - y, y - o.yTop); },
  bb: [o.back, o.yChin, -o.wCheek, o.front, o.yTop, o.wCheek] };
}
/**
 * r4 hand-authored face mask, lattice-exact (no SDF thresholds): rows = { iy: 'string' } where each character is one voxel
 * column seen from the front, image-left first ('.' = leave skin); legend maps characters to materials. W = mask width (even,
 * centred on z = 0): column c -> lattice iz = W/2 - 1 - c (image-left = the hero's right = +z).
 */
function maskFace(M, rows, legend, W = 16) {
  const R = new Map(Object.entries(rows).map(([k, v]) => [Number(k), v]));
  if (!HI) { M.decals.push({ kind: 'proj', axis: '+x', parts: ['head'], mats: ['skin'], fn: (y, z, iy, iz) => { const row = R.get(iy); if (!row) return null; const c = W / 2 - 1 - iz; const ch = row[c]; return ch && ch !== '.' ? legend[ch] : null; } }); return; }
  // HI (density spike): the SAME approved mask sampled in base-lattice units (each feature voxel -> a KxK block, no redesign), plus
  // two cheap refinements in the finer rows: an eyelid shade row right above the lash line, and a lighter bottom row on the iris
  // so it reads as a glossy eye instead of a flat dark block (the approved catchlight stays where it was)
  const at = (by, bz) => { const row = R.get(by); if (!row) return '.'; const ch = row[W / 2 - 1 - bz]; return ch || '.'; };
  M.decals.push({ kind: 'proj', axis: '+x', parts: ['head'], mats: ['skin'], fn: (y, z) => {
    const by = bi(y), bz = bi(z), ch = at(by, bz), fy = y * BASE_RES - by;   // fy: position inside the base cell (0 bottom .. 1 top)
    if (ch === '.') { if (at(by - 1, bz) === 'k' && fy < 0.5 && legend.k === 'lash') return 'skinShade'; return null; }   // eyelid
    if (ch === 'i' && at(by - 1, bz) !== 'i' && fy < 0.5 && M.palette.irisHi) return 'irisHi';                       // lower iris
    return legend[ch]; } });
}
/** profile eye on both sides of the head (k08b): lattice rows iy0..iy1, depth band x0..x1 */
const profileEye = (M, y0, y1, x0, x1, mat) => { for (const ax of ['+z', '-z']) M.decals.push({ kind: 'proj', axis: ax, parts: ['head'], mats: ['skin'], fn: (y, x) => y >= y0 && y < y1 && x >= x0 && x < x1 ? mat : null }); };
/** r4 hair light: ONE smooth lighter band across the crown (height band, front / top only); grooves cut through it -> strands */
const crownBand = (x0, x1, yMin = 92) => ({ kind: 'proj', axis: '+y', parts: ['head'], mats: ['hair'], fn: (x, z, ix, iz, y) => x > x0 && x < x1 && y > yMin ? 'hairHi' : null });   // paints the TOP surface only (a band across the crown, like k09 / k08b)
/** 2-voxel-deep strand channels: angular period `n` around an axis; a(x, y, z) -> angle; ok(x, y, z) limits where they cut */
const grooves = (n, a, ok = () => true, depth = (HI ? bvox(2) : 2 / RES) + 0.05, frac = 0.17) => (x, y, z) => { if (!ok(x, y, z)) return 0; const f = a(x, y, z) * n / Math.PI + 0.5; return (f - Math.floor(f)) < frac ? depth : 0; };
/** HI only: a second, finer set of 1-voxel strand lines between the approved grooves (strands at a real scale); identity when !HI */
const fineGrooves = (g, n, a, ok) => HI ? ((fg) => (x, y, z) => Math.max(g(x, y, z), fg(x, y, z)))(grooves(n, a, ok, 1 / RES + 0.05, 0.12)) : g;
/** hair sheen: scattered lighter voxels in a height band (k08b hair texture; a solid ring read as a headband) */
const sheen = (y0, y1, xMin, thr, ok = () => true) => ({ kind: 'vol', parts: ['head'], mats: ['hair'], fn: (x, y, z, m, ix, iy, iz) => y > y0 && y < y1 && x > xMin && ok(x, y, z) && hash(ix + 99, iy + 99, iz + 99) > thr + Math.abs(y - (y0 + y1) / 2) / (y1 - y0) * 0.5 ? 'hairHi' : null });
/** a strap / sash band over the torso: |z - (z0 + (y0 - y) * k)| < w */
const sash = (z0, y0, k, w, mat, on) => ({ kind: 'vol', parts: ['torso'], mats: on, fn: (x, y, z) => Math.abs(z - (z0 + (y0 - y) * k)) < w ? mat : null });
/** hair shell = the skull box grown by t (top grown by tTop), with displacement g */
const shell = (sk, t, g, tTop = t) => disp(roundBox([sk.c[0] - 0.1, sk.c[1] + (tTop - t) / 2 + 0.3, sk.c[2]], [sk.h[0] + t, sk.h[1] + (t + tTop) / 2, sk.h[2] + t], sk.rad + t), g || (() => 0), 1.5);
/** curl clumps on rings around a head (k08b): spheres of radius ~r, positioned by angle (0 = front, +z = right) */
function clumps(c, rx, rz, rows, r, keep, seed = 1) {
  const out = [];
  for (const [y, a0, a1, step] of rows) for (let a = a0; a <= a1 + 1e-6; a += step) {
    const h1 = hash(Math.round(a), Math.round(y * 10), seed), h2 = hash(Math.round(a) + 7, Math.round(y * 10), seed + 3);
    const t = a * Math.PI / 180, p = [c[0] + Math.cos(t) * rx, y + (h1 - 0.5) * 1.2, c[2] + Math.sin(t) * rz];
    if (keep && !keep(p)) continue; out.push(sphere(p, r * (0.85 + 0.3 * h2)));
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ JADE
const JADE_PAL = { skin: '#f2c8a6', skinShade: '#e4b596', blush: '#f0b8a2', pantsHi: '#3e4a76', hair: '#33262a', hairHi: '#5a4448', jacket: '#f4f2ee', jacketRib: '#dcd9d2', orange: '#f27a22', top: '#1d1d23', dot: '#9ccbf2', ink: '#2b3f73',
  pants: '#2b3555', belt: '#18181c', shoe: '#f5f5f3', sole: '#c2c3ca', snap: '#a7acb5', lash: '#1c1414', iris: '#3d2a24', white: '#fbf7f2', brow: '#2a2224', mouth: '#c94a46', mouthD: '#a3322f', mouthIn: '#4a1a1c', patchK: '#1c1c1c', patchW: '#efefef',
  irisHi: '#654538', dotArt: '#94bee4', letter: '#272729',
  hpBand: '#18181b', hpCup: '#e8742a', hpPlate: '#2a2a30' };   // r6 (HI only): headphones around the neck (paper art 125.9: black band, dark cup shells with orange rims / cushions)   // HI only: lighter lower iris; the costume artwork's own back-dot + lettering colours
/**
 * Jacket back at RES > BASE_RES (density spike), after the costume artwork (rare-earth-techno-remix/costume/artwork/
 * back_dot_and_lettering.svg: a 7.75 in pale-blue #94BEE4 dot, RARE EARTH on ONE line below it, 7.5 in wide, #272729 Archivo):
 * a big dot over a single 4x6 bold-sans line about as wide as it. Where the lettering would be smaller than 4x6 voxels (RES < 2.3)
 * the dot is kept alone (Jade: prioritize the pale blue dot over the text). '-x' projection, so it reads flat from behind.
 */
function jacketBack() {
  const TXT = RES >= 2.3 ? textTest('RARE EARTH', 1, FONT36) : null;   // r6e: 3-wide glyphs (was FONT46, 44 voxels: the outer letters wrapped onto the sides)
  const j0 = Math.ceil(56.2 * RES);                                     // text baseline row, just above the ribbed hem
  const tTop = TXT ? (j0 + TXT.H) / RES : 55.6;
  const r = 7.1, yc = tTop + 1.0 + r;                                   // dot: 1 unit clear of the cap height (art: ~1.4 cap heights; the cropped back is short)
  const half = TXT ? TXT.W >> 1 : 0;
  return { kind: 'proj', axis: '-x', parts: ['torso'], mats: ['jacket'], fn: (y, z, iy, iz) => {
    if ((y - yc) ** 2 + z * z <= r * r) return 'dotArt';
    if (TXT && TXT.at(iz + half, iy - j0)) return 'letter';              // seen from behind, the hero's right (+z) is image-right
    return null; } };
}

/** r6 chin (HI): chin half-width 2.0 -> R6_CHIN.wChin, a rounder bottom (chinR: height of the round-off) and a straighter jaw taper */
const R6_CHIN = { chin: { w: 3.2, h: 2.0, k: 0.68, rk: 0.5 } };   // r5 (1.25): wChin 2.0 parabola, corners rounded 0.9 w (the flat front read as a V)
/**
 * r6 canon (HI only): headphones AROUND THE NECK (Jade 2026-10-16, paper art 125.9): a black band behind the neck resting on the
 * collar's back rim, an orange cup (dark outer plate) on the collar at each side of the neck, faces turned forward-out. Torso part
 * (they move with the chest, not the head). The cups stay >= 2 units clear of the snap throat-tab (z -1.8..1.9 on the collar front).
 */
function headphones(M) {
  const HP = { y: 74.9, x: 2.5, z: 5.5, r: 2.3, h: 0.85, turn: 0.82, el: 0.55, rim: 0.6 };   // r6b (coordinator): smaller + flatter, ON the collar; paper art: dark shell, orange rim + cushion   // el: cups tilted to face up-forward (lying on the collar / collarbones), so a high camera or a lowered chin doesn't hide them   // forward of the hair-down side locks, so they read with the hair down too
  for (const sg of [1, -1]) {
    const c = [HP.x, HP.y, sg * HP.z], ax = [Math.sin(HP.turn) * Math.cos(HP.el), Math.sin(HP.el), sg * Math.cos(HP.turn) * Math.cos(HP.el)], L = Math.hypot(...ax);
    const mat = (x, y, z) => { const px = x - c[0], py = y - c[1], pz = z - c[2]; const t = (px * ax[0] + py * ax[1] + pz * ax[2]) / L;
      const rr = Math.sqrt(Math.max(0, px * px + py * py + pz * pz - t * t)); return t < -0.25 || rr > HP.r - HP.rim ? 'hpCup' : 'hpPlate'; };   // dark charcoal shell, orange rim ring + cushion (collar side)
    M.prims.push(P(cylinder(c, ax, HP.r, HP.h, 0.6), 'torso', mat, { prio: 6 }));
  }
  M.prims.push(P(clip(ring(0.4, 0, 75.9, 77.4, 4.8, 5.8), (x) => x < 1.4), 'torso', 'hpBand', { prio: 6 }));   // the band, behind the neck
}

function jade(down) {
  const S = skeleton({ shZ: 12.0, legZ: 6.6 });
  const M = { prims: [], cuts: [], decals: [], palette: JADE_PAL };
  // torso: midriff, black crop top, puffy cropped racer jacket (band collar, snap throat-tab, snap epaulets, ribbed hem)
  M.prims.push(P(sprism(0, 0, 47.6, 54.4, 5.0, 8.6, 4.8, 8.2, 2.4, 1.5), 'torso', 'skin'));   // midriff (r6d: back to skin; jade_anime.png = a black high-neck CROP top above a bare midriff strip)
  M.prims.push(P(sprism(0, 0, 52.7, 70.3, 5.6, 9.4, 5.9, 9.8, 2.5, 2.0), 'torso', 'top', { prio: 2 }));
  M.prims.push(P(sprism(0, 0, 53.8, 73.8, 6.4, 10.9, 6.7, 11.4, 2.6, 3.4), 'torso', 'jacket', { prio: 3 }));   // puffy, rounded racer jacket
  M.prims.push(P(cone([0.3, 71.5, 0], [0.5, 76.0, 0], 4.8, 4.4), 'torso', 'jacket', { prio: 4 }));                       // band collar
  for (const sg of [1, -1]) M.prims.push(P(roundBox([0, 74.3, sg * 8.4], [1.6, 0.55, 3.2], 0.4), 'torso', 'jacket', { prio: 5 }));   // epaulets
  M.decals.push({ kind: 'vol', parts: ['torso'], mats: ['jacket'], fn: (x, y) => y >= 63.6 && y < 65.8 && x > -1.5 ? 'orange' : null });   // chest band (flat stripe; the arm bands are raised)
  M.prims.push(P(sprism(0, 0, 41.9, 51.1, 6.8, 12.2, 6.9, 12.4, 2.6, 2.2), 'torso', 'pants', { prio: 2 }));                     // cargo-pant seat
  arms(S, M, { skin: [3.0, 2.8], sleeve: 'jacket', sleeveR: [4.6, 4.1, 3.6], sleeveTo: 45, shoulder: 5.2, cuff: { y0: 45.4, y1: 42.6, r: 3.4, mat: 'jacket' } });
  for (const A of [S.R, S.L]) M.prims.push(P(sprism(0, A.sh[2], 63.4, 65.8, 4.75, 4.75, 4.85, 4.85, 2.3, 0.4), A.sg > 0 ? 'uarmR' : 'uarmL', 'orange', { prio: 5 }));   // raised arm bands, level with the chest band
  // full-length wide-leg baggy cargo pants: pockets with flaps, knee creases, a pooled hem breaking over chunky sneakers,
  // long orange straps hanging FREE of the cloth (belt loop to knee; pocket flap to below the knee)
  legs(S, M, { pants: 'pants', hi: 'pantsHi', thigh: [6.5, 0.3], shin: [6.6, 0.4], knee: 6.1, hemY: 1.8, hem: { y1: 7.6, r: 6.9, fold: 9.2 }, creases: [28.6, 31.8, 18.4, 21.2], creasesBack: [23.0, 26.2, 13.6],
    shoe: { c: [2.8, 3.6], h: [7.2, 3.6, 4.0], rad: 1.6, mat: 'shoe', sole: 'sole', soleY: 1.8 } });
  for (const A of [S.R, S.L]) {
    const T = A.sg > 0 ? 'thighR' : 'thighL', sg = A.sg;
    M.prims.push(P(roundBox([0.4, 32.6, sg * 13.4], [3.4, 4.2, 1.0], 0.5), T, 'pants', { prio: 2 }));                    // cargo pocket
    M.prims.push(P(roundBox([0.4, 36.4, sg * 14.0], [3.6, 1.2, 1.0], 0.4), T, 'pants', { prio: 3 }));                    // its flap
    M.prims.push(P(roundBox([1.2, 36.0, sg * 14.8], [0.6, 1.0, 0.6], 0), T, 'orange', { prio: 4 }));                     // strap tab on the flap...
    M.prims.push(P(roundBox([1.2, 27.4, sg * 15.6], [0.6, 8.6, 0.45], 0), T, 'orange', { prio: 4 }));                    // ...hanging free to below the knee
    M.prims.push(P(roundBox([7.4, 49.4, sg * 3.6], [1.0, 1.1, 0.7], 0), T, 'orange', { prio: 4 }));                      // belt-loop tab...
    M.prims.push(P(roundBox([8.4, 38.4, sg * 3.6], [0.45, 11.0, 0.7], 0), T, 'orange', { prio: 4 }));                    // ...strap hanging to the knee
    if (HI) {   // density spike: hardware that is sub-voxel at 1.25: strap buckles + the pocket-flap snap
      M.prims.push(P(roundBox([8.55, 47.6, sg * 3.6], [0.4, 0.45, 0.95], 0), T, 'snap', { prio: 5 }));                   // belt-strap buckle
      M.prims.push(P(roundBox([1.2, 34.4, sg * 15.65], [0.85, 0.4, 0.6], 0), T, 'snap', { prio: 5 }));                   // thigh-strap buckle
      M.prims.push(P(roundBox([-1.6, 36.3, sg * 15.1], [0.55, 0.55, 0.3], 0.2), T, 'snap', { prio: 5 }));                // flap snap
    }
  }
  M.decals.push({ kind: 'vol', parts: ['torso'], mats: ['pants'], fn: (x, y) => y > 49.6 ? 'belt' : null });
  M.decals.push({ kind: 'vol', parts: ['torso'], mats: ['jacket', 'orange'], fn: (x, y, z) => x > 3 && y < 71.5 && Math.abs(z) < 1.8 + Math.max(0, (58 - y) * 0.3) ? 'top' : null });   // open front
  M.decals.push({ ...rib('jacket', 'jacketRib', (x, y) => y < 55.6), parts: ['torso'] });                               // ribbed hem
  M.decals.push({ ...rib('jacket', 'jacketRib', (x, y) => y < 45.6), parts: ['larmR', 'larmL'] });                       // ribbed cuffs
  M.decals.push({ kind: 'vol', parts: ['torso'], mats: ['jacket'], fn: (x, y, z) => y > 73.7 && Math.abs(z) > 10.4 ? 'snap' : null });   // epaulet snaps
  M.decals.push({ kind: 'add', axis: '+x', parts: ['torso'], n: HI ? Math.max(1, Math.round(RES / BASE_RES)) : 1, at: [[74.2, 75.8, -1.8, 1.0, 'jacket'], [74.2, 75.8, 1.0, 1.9, 'snap']] });   // snap throat-tab
  if (!HI) M.decals.push({ kind: 'proj', axis: '+x', parts: ['torso'], mats: ['jacket'], fn: (y, z) => y >= 69.2 && y < 71.0 && z >= -6.6 && z < -4.8 ? 'dot' : null });   // small chest dot (her left)
  else M.decals.push({ kind: 'proj', axis: '+x', parts: ['torso'], mats: ['jacket'], fn: (y, z) => (y - 70.1) ** 2 + (z + 5.7) ** 2 <= 1.0 ? 'dotArt' : null });   // HI: a round chest dot (artwork chest_dot.svg)
  if (!HI) M.decals.push({ kind: 'proj', axis: '-z', parts: ['uarmL'], mats: ['jacket'], fn: (y, x) => { const r = (y - 68.8) ** 2 + x * x; const r2 = (y - 69.6) ** 2 + x * x; return r2 <= 2.0 ? 'patchW' : r2 <= 7.0 ? 'patchK' : null; } });   // 1420 MHz patch (her LEFT arm)
  else {   // HI: the patch artwork's layout (sleeve_patch_1420MHz.svg); r6d (Jade, jade_anime.png): centred ON the orange arm band, drawn over it
    // (M4 v4b stage_3d) turned PATCH_FWD toward the front: jade_anime.png's front + 3/4 views put it on the outer FRONT of the upper arm, so it
    // reads with her facing the camera (image right). r6d projected it straight from her left side ('-z'): edge-on in every front-on shot.
    const PY = 64.6, PATCH_FWD = 40 * Math.PI / 180, ct = Math.cos(PATCH_FWD), st = Math.sin(PATCH_FWD), az = S.L.sh[2];
    const art = (y, u) => { const r = Math.hypot(y - PY, u);                                                   // pale disc, thick black ring, two dark text lines
      if (r > 2.85) return null; if (r > 2.55) return 'patchW'; if (r > 1.55) return 'patchK';
      if ((y >= PY + 0.3 && y < PY + 0.7 && Math.abs(u) < 0.95) || (y >= PY - 0.7 && y < PY - 0.3 && Math.abs(u) < 0.75)) return 'patchK'; return 'patchW'; };
    M.decals.push({ kind: 'vol', parts: ['uarmL'], mats: ['jacket', 'orange'], fn: (x, y, z) => { const dz = z - az; return x * st - dz * ct > 0 ? art(y, x * ct + dz * st) : null; } });   // orthographic along (sin, 0, -cos): the arm's outer-front quarter
  }
  if (!HI) {   // approved RES 1.25 layout: small dot over RARE / EARTH on two lines (one 3x5 line would not fit the back)
    const RARE = textTest('RARE'), EARTH = textTest('EARTH'); const jE = Math.ceil(55.9 * RES), jR = jE + 6, yDot = (jR + 5) / RES + 0.9 + 3.0;
    M.decals.push({ kind: 'proj', axis: '-x', parts: ['torso'], mats: ['jacket'], fn: (y, z, iy, iz) => {
      if ((y - yDot) ** 2 + z * z <= 9.6) return 'dot';
      if (RARE.at(iz + (RARE.W >> 1), iy - jR)) return 'ink';
      if (EARTH.at(iz + (EARTH.W >> 1), iy - jE)) return 'ink';
      return null; } });
  } else { M.decals.push(jacketBack());
    M.prims.push(P(roundBox([-5.71, 57.6, 0], [0.75, 1.8, 7.9], 0.5), 'torso', 'jacket', { prio: 3 }));   // flush with the back at the centre (x -6.46); just wider / taller than the line   // r6e: a flat back panel under the RARE EARTH line (fills the jacket's curve there), so no letter sits on a side-facing step
  }
  if (HI) headphones(M);
  // head: heart-shaped face (wide cheekbones, narrow chin), larger eyes, two slightly different brows, tall forehead under a
  // high centre-parted hairline
  const skull = { c: [0.4, 87.4, 0], h: [7.2, 8.0, 7.0], rad: 3.4 };
  // r6 (Jade 2026-10-16: "heart-shaped, but my chin isn't quite THAT pointy"): HI only, a wider, rounder chin; cheekbones / forehead kept
  headBase(M, { neckR: 3.0, skull, face: { front: 7.6, back: -5.5, yChin: 76.2, yCheek: 83.4, yTop: 88.5, wCheek: 7.0, r: 3.0, ...(HI ? R6_CHIN : { wChin: 2.0 }) } });
  // r4 face (k09): flat plane, almond eyes (lash line + outer flick, iris, one catchlight) set larger + lower for a taller forehead,
  // thin soft-black brows with space above the eyes (image-left straight, image-right a slight arch), a 2-voxel nose shade (no
  // block), small red lips. Lattice rows: iy -> y centre (iy + 0.5) * 0.8.
  maskFace(M, {
    111: '...........bb...',
    110: '..bbbb....b..b..',
    108: '.kkkk......kkkk.',
    107: '..iiw......wii..',
    106: '..iii......iii..',
    105: '..iii......iii..',
    104: '...i........i...',
    101: '.......nn.......',
    99: '......mdm.......',
  }, { b: 'brow', k: 'lash', i: 'iris', w: 'white', n: 'skinShade', m: 'mouth', d: 'mouthD' });   // r5: eyes open one row; 3-voxel lips, darker centre
  profileEye(M, 83.2, 87.2, 5.4, 6.9, 'lash');
  const hairline = (z) => 93.8 - 0.2 * z * z;   // high, centre-parted
  const window = (x, y, z) => x > 0.8 && y < hairline(z);
  if (HI) M.decals.push({ kind: 'vol', parts: ['head'], mats: ['skin'], fn: (x, y, z) => !window(x, y, z) && y > (down ? 80 : 82.5) && x < 7.0 ? 'hair' : null });   // r6c: the scalp under the hair is hair-coloured, so a view down a strand groove (bent forward) shows no pale skin line
  const groovesBack = fineGrooves(grooves(7, (x, y, z) => Math.atan2(z, y - 87), (x, y) => x > -6 && (x < 2.5 || y > 95)), 21, (x, y, z) => Math.atan2(z, y - 87) + Math.PI / 21, (x, y) => x > -6 && (x < 2.5 || y > 95));   // not across the front hairline (jagged temples)            // strands swept back to the bun
  const groovesDown = fineGrooves(grooves(9, (x, y, z) => Math.atan2(z, x + 1), (x, y) => y < 94), 27, (x, y, z) => Math.atan2(z, x + 1) + Math.PI / 27, (x, y) => y < 94);          // strands falling
  M.shellPrim = P(clip(shell(skull, 1.6, down ? groovesDown : groovesBack, 0.8), (x, y, z) => !window(x, y, z) && (down ? y > 77 : y > (x < -3 ? 79 : 81.5))), 'head', 'hair', { prio: 3 }); M.prims.push(M.shellPrim);
  M.decals.push({ kind: 'vol', parts: ['head'], mats: ['hair'], fn: (x, y, z, m, ix, iy, iz) => (HI ? bi(z) : iz) === -1 && x > 1.5 && y > 92 && y < 96 ? 'skin' : null });   // the centre part, at the hairline only
  for (const sg of [1, -1]) M.prims.push(P(roundBox([2.0, 83.0, sg * 7.5], [0.7, 3.6, 0.7], 0.3), 'head', 'hair', { prio: 3 }));   // temple wisps
  if (!down) {
    const bunC = HI ? [-7.8, 94.4, 0] : [-9.6, 91.6, 0];   // bun at the back of the crown (r6b / HI: a top-back bun like the paper art, peeking over the crown from the front); voxfig buildFigure pushes the X pencils THROUGH it
    const spiral = (x, y, z) => { const f = Math.atan2(y - bunC[1], z) / Math.PI * 3 + (x - bunC[0]) * 0.15; return (f - Math.floor(f)) < 0.2 ? 0.8 : 0; };
    M.bunPrim = P(disp(superEllipsoid(bunC, [3.8, 4.7, 4.7], 2.4), spiral, 1), 'head', 'hair', { prio: 3 }); M.prims.push(M.bunPrim);
    M.bun = bunC;
  } else {
    // long and loose (k09): side locks framing the face and falling in front of the shoulders, a fuller crown, and the back as
    // separate clumps that part at their ends
    for (const sg of [1, -1]) {
      if (!HI) M.prims.push(P(cone([2.6, 85, sg * 7.7], [7.6, 63.5, sg * 7.6], 1.7, 1.5), 'head', 'hair', { prio: 3 }));
      else M.prims.push(P(cone([2.6, 85, sg * 7.8], [5.0, 74.4, sg * 9.0], 1.7, 1.6), 'head', 'hair', { prio: 3 }), P(cone([5.0, 74.4, sg * 9.0], [7.6, 63.5, sg * 8.1], 1.6, 1.5), 'head', 'hair', { prio: 3 }));   // r6: the front lock falls OUTSIDE the headphone cup
      M.prims.push(P(cone([0.4, 85, sg * 8.3], [2.8, 68, sg * 9.2], 1.5, 1.2), 'head', 'hair', { prio: 3 }));
    }
    const ends = [67.6, 66.4, 68.8, 66.9, 69.4, 67.8]; const zs = [-6.8, -4.1, -1.4, 1.4, 4.1, 6.8];   // shoulder-blade length: RARE EARTH stays readable below
    zs.forEach((zc, i) => {
      const xo = (i % 2 ? -0.5 : 0.3), zEnd = zc * 1.12;
      M.prims.push(P(cone([-8.6 + xo, 84, zc * 0.9], [-8.9 + xo, ends[i] + 1.2, zEnd], 1.9, 1.4), 'head', 'hair', { prio: 3 }));
    });
    M.prims.push(P(roundBox([-8.4, 80.5, 0], [1.6, 4.5, 8.2], 1.4), 'head', 'hair', { prio: 3 }));   // the curtain's top, joining the clumps
    if (HI) M.prims.push(P(roundBox([-8.0, 77.0, 0], [0.9, 8.6, 7.2], 0.6), 'head', 'hair', { prio: 3 }));   // r6c: a backing sheet inside the clumps, so a bent-forward view down the gaps shows hair, not the neck
  }
  M.decals.push(crownBand(-1.5, 3.5));
  return { M, S };
}

// ------------------------------------------------------------------------------------------------ CHARLIE
const CHARLIE_PAL = { skin: '#e2ad84', skinShade: '#c9926c', lash: '#1b1412', iris: '#4a2e1e', white: '#f6f1ea', jeansHi: '#5f84bd', hair: '#3b2516', hairHi: '#5e3d26', cap: '#d4b47c', capBand: '#a9874f', tee: '#4b4d52', strap: '#6e4426', jeans: '#46699d', boot: '#7a4a2a', bootSole: '#3a2416',
  eye: '#1b1412', brow: '#3b2516', mouth: '#b65a4c', irisHi: '#7d5638', mouthD: '#94463a', mouthIn: '#3f1a16' };   // mouthD / mouthIn: r6 visemes
const maleSkull = { c: [0.4, 86.8, 0], h: [7.2, 8.5, 7.0], rad: 3.2 };
const maleFace = (mouth) => [...mirror([[86.4, 87.2, 2.0, 4.0, 'lash'], [84.8, 86.4, 2.4, 3.2, 'iris'], [88.8, 89.6, 1.6, 4.4, 'brow']]), [85.6, 86.4, 3.2, 4.0, 'white'], [85.6, 86.4, -2.4, -1.6, 'white'], [81.6, 82.4, -0.8, 0.8, 'skinShade'], mouth];
function charlie(hat) {
  const S = skeleton();
  const M = { prims: [], cuts: [], decals: [], palette: CHARLIE_PAL };
  M.prims.push(P(sprism(0, 0, 56, 73.1, 5.9, 10.4, 6.4, 11.6, 2.4, 3.0), 'torso', 'tee', { prio: 2 }), P(sprism(0, 0, 47.2, 58.8, 5.8, 10.2, 5.9, 10.2, 2.4, 2.4), 'torso', 'tee', { prio: 2 }));   // ribcage -> waist
  M.prims.push(P(sprism(0, 0, 41.3, 49.7, 5.9, 10.6, 6.0, 10.6, 2.6, 2.2), 'torso', 'jeans'));
  M.decals.push(sash(-10, 74, 0.8, 1.4, 'strap', ['tee']));                                                              // acoustic strap: left shoulder -> right hip
  arms(S, M, { skin: [3.3, 3.0], sleeve: 'tee', sleeveR: [4.3, 4.0], sleeveTo: 61.5, shoulder: 4.8 });
  legs(S, M, { pants: 'jeans', hi: 'jeansHi', thigh: [5.7, 0], shin: [4.8, 0.1], knee: 5.2, calf: 5.1, hemY: 8.6, hem: { y1: 10.6, r: 5.6 }, creases: [27.6, 20.2], creasesBack: [23.4],
    shoe: { c: [2.2, 4.2], h: [6.6, 4.2, 4.0], rad: 1.8, mat: 'boot', sole: 'bootSole', soleY: 1.6, shaft: 11, shaftR: 4.6 } });
  headBase(M, { neckR: 3.3, skull: maleSkull, face: { front: 7.6, back: -5.5, yChin: 76.6, yCheek: 81.8, yTop: 88.5, wCheek: 7.0, wChin: 4.4, r: 2.8 }, ears: [-0.4, 85, 7.1] });
  maskFace(M, {
    110: '..bbbb....bbbb..',
    107: '..kkk......kkk..',
    106: '...iw......iw...',
    105: '...ii......ii...',
    102: '.......nn.......',
    99: '......mmmm......',
  }, { b: 'brow', k: 'lash', i: 'iris', w: 'white', n: 'skinShade', m: 'mouth' });
  profileEye(M, 84.0, 86.4, 5.6, 7.0, 'eye');
  // dark curls as distinct clumps, kept behind the face line (x < 1.2 below the brim) so they never cover his cheek in profile
  const C = maleSkull.c, faceOK = (p) => p[0] < 0.2 || p[1] > 90.5;
  M.prims.push(P(clip(shell(maleSkull, 0.9), (x, y) => (x < 1 && y > 82.5) || (x < -2.5 && y > 79)), 'head', 'hair', { prio: 3 }));
  const rows = hat ? [[83.2, 75, 285, 21], [86.4, 70, 290, 19], [89.4, 62, 298, 17], [80.4, 125, 235, 22]] : [[83.2, 75, 285, 21], [86.4, 70, 290, 19], [89.6, 40, 320, 18], [92.6, 0, 345, 22], [95.2, 0, 330, 40], [80.4, 125, 235, 22]];
  for (const sp of clumps(C, 8.0, 7.6, rows, 2.3, faceOK, 5)) M.prims.push(P(sp, 'head', 'hair', { prio: 3 }));
  if (hat) {   // the beige flat cap seated ON the curls: puffy crown pulled forward, a darker band, a short brim
    M.prims.push(P(clip(superEllipsoid([1.4, 92.8, 0], [9.8, 6.2, 9.2], 2.2), (x, y) => y > 92.4), 'head', 'cap', { prio: 5 }));   // r4: rounded dome crown (k09); the brim stays flat
    M.decals.push({ kind: 'vol', parts: ['head'], mats: ['cap'], fn: (x, y, z, m, ix, iy) => y > 93.5 && (HI ? bi(y) : iy) % 4 === 0 ? 'capBand' : null });   // k09 ridges
    M.prims.push(P(roundBox([0.8, 91.6, 0], [9.6, 1.0, 9.4], 3.6), 'head', 'capBand', { prio: 5 }));
    M.prims.push(P(roundBox([11.4, 91.6, 0], [2.8, 0.55, 6.6], 0.5), 'head', 'capBand', { prio: 5 }));
  } else {
    for (const z of [-4.5, -1.5, 1.5, 4.5]) M.prims.push(P(sphere([7.0, 91.6, z], 1.7), 'head', 'hair', { prio: 3 }));   // curls over the forehead
    M.decals.push(crownBand(-2, 2.5));
  }
  return { M, S };
}

// ------------------------------------------------------------------------------------------------ RICKY
// stripe colour: ricky-anime.png (muted blue stripes on white) / party_pixel_sheet (light blue on white)
const RICKY_PAL = { skin: '#e9b993', skinShade: '#d29d78', lash: '#18120f', iris: '#2e2018', white: '#f6f1ea', jeansHi: '#6c92c8', hair: '#211b20', hairHi: '#433842', shirt: '#eef1f6', stripe: '#6f8fca', button: '#b9bfcc', strap: '#26304e', jeans: '#5578ad',
  shoe: '#f3f3f1', sole: '#c6c7cc', eye: '#18120f', brow: '#17151b', mouth: '#bc5f52', irisHi: '#5e4635', mouthD: '#9a4a3f', mouthIn: '#3f1a16' };   // mouthD / mouthIn: r6 visemes
function ricky() {
  const S = skeleton();
  const M = { prims: [], cuts: [], decals: [], palette: RICKY_PAL };
  // vertical stripes, 1 blue + 2 white VOXELS by arc length around the torso / each sleeve's own axis
  const stripeOn = (f) => HI ? f - 3 * Math.floor(f / 3) < 1.25 : Math.floor(f) % 3 === 0;   // HI: same period in design units, ~1.25-voxel-wide stripe (the 1.25 read)
  const torsoStripe = (x, y, z) => { const f = (Math.atan2(z / 11.4, x / 6.2) / (2 * Math.PI) + 0.5) * 57.7 * (HI ? BASE_RES : RES); return stripeOn(f) ? 'stripe' : 'shirt'; };
  const sleeveStripe = (zc) => (x, y, z) => { const f = (Math.atan2(z - zc, x) / (2 * Math.PI) + 0.5) * 25 * (HI ? BASE_RES : RES); return stripeOn(f) ? 'stripe' : 'shirt'; };
  M.prims.push(P(sprism(0, 0, 56, 73.1, 5.8, 10.2, 6.2, 11.4, 2.4, 3.0), 'torso', torsoStripe, { prio: 2 }), P(sprism(0, 0, 45.9, 59.1, 5.8, 10.2, 5.8, 10.0, 2.4, 2.4), 'torso', torsoStripe, { prio: 2 }));
  M.prims.push(P(sprism(0, 0, 41, 49, 5.8, 10.4, 5.8, 10.4, 2.6, 2.2), 'torso', 'jeans'));
  for (const sg of [1, -1]) M.prims.push(P(roundBox([3.8, 73.6, sg * 3.2], [2.2, 1.2, 2.2], 0.6), 'torso', 'shirt', { prio: 3 }));   // collar points
  M.decals.push({ kind: 'vol', parts: ['torso'], mats: ['shirt', 'stripe'], fn: (x, y, z) => x > 3.4 && y > 68.5 && y < 73.5 && Math.abs(z) < 0.8 + (y - 68.5) * 0.5 ? 'skin' : null });   // open neck
  M.decals.push({ kind: 'vol', parts: ['torso'], mats: ['shirt', 'stripe'], fn: (x, y, z, m, ix, iy, iz) => x > 4 && (HI ? bi(z) : iz) === 0 && y < 68.5 ? ((HI ? bi(y) : iy) % 5 === 0 ? 'button' : 'shirt') : null });   // placket + buttons
  M.decals.push(sash(-9.6, 74, 0.78, 1.4, 'strap', ['shirt', 'stripe']));
  arms(S, M, { skin: [3.1, 2.9], sleeve: 'shirt', sleeveR: [4.3, 3.9, 3.7], sleeveTo: 48.0, shoulder: 4.7, cuff: { y0: 50.0, y1: 47.4, r: 4.2, mat: 'shirt' } });
  for (const p of M.prims) if (p.mat === 'shirt' && /arm/.test(p.part) && p.prio === 2) p.mat = sleeveStripe(p.part.endsWith('R') ? S.shZ : -S.shZ);
  legs(S, M, { pants: 'jeans', hi: 'jeansHi', thigh: [5.7, 0], shin: [4.9, 0.1], knee: 5.2, calf: 5.1, hemY: 5.2, hem: { y1: 7.4, r: 5.5 }, creases: [27.8, 19.6], creasesBack: [23.2],
    shoe: { c: [2.4, 3.2], h: [6.6, 3.2, 3.8], rad: 1.5, mat: 'shoe', sole: 'sole', soleY: 1.4 } });
  headBase(M, { neckR: 3.2, skull: maleSkull, face: { front: 7.6, back: -5.5, yChin: 76.6, yCheek: 81.8, yTop: 88.5, wCheek: 7.0, wChin: 4.2, r: 2.8 }, ears: [-0.4, 85.1, 7.1] });
  maskFace(M, {
    110: '..bbbb....bbbb..',
    107: '..kkk......kkk..',
    106: '...iw......iw...',
    105: '...ii......ii...',
    102: '.......nn.......',
    99: '.......mm.......',
  }, { b: 'brow', k: 'lash', i: 'iris', w: 'white', n: 'skinShade', m: 'mouth' });
  profileEye(M, 84.0, 86.4, 5.6, 7.0, 'eye');
  // r4 hair (k08b): tousled and rounded: a shell with strand channels, crown volume, a fringe that breaks over the forehead in 4
  // clumps, ears free (the sides stop above them), a lighter top
  const tousle = fineGrooves(grooves(8, (x, y, z) => Math.atan2(z, x + 2), (x, y) => y > 88), 24, (x, y, z) => Math.atan2(z, x + 2) + Math.PI / 24, (x, y) => y > 88);
  M.prims.push(P(clip(shell(maleSkull, 1.2, tousle, 2.0), (x, y, z) => !(x > 1 && y < 93.0 - 0.1 * z * z) && (x < -3 ? y > 80.5 + Math.abs(z) * 0.2 : y > 87.4)), 'head', 'hair', { prio: 3 }));
  M.prims.push(P(disp(ellipsoid([-0.4, 96.2, 0], [8.4, 4.0, 8.2]), grooves(7, (x, y, z) => Math.atan2(z, x), () => true, 1.3)), 'head', 'hair', { prio: 3 }));   // crown volume
  for (const sp of clumps([-0.4, 0, 0], 7.4, 7.2, [[97.6, 0, 345, 24], [95.4, 12, 348, 24], [92.6, 60, 300, 30]], 2.5, (p) => !(p[0] > 3 && p[1] < 94), 21)) M.prims.push(P(sp, 'head', 'hair', { prio: 3 }));   // tousled rounded silhouette
  for (const [z, yEnd, dz] of [[-4.8, 90.4, -1.0], [-1.8, 89.6, -0.5], [1.3, 90.0, 0.6], [4.4, 90.8, 1.0]]) M.prims.push(P(cone([4.4, 96.4, z * 0.85], [8.3, yEnd, z + dz], 1.8, 0.8), 'head', 'hair', { prio: 3 }));   // 4 fringe clumps, forehead showing between
  if (HI) M.decals.push({ kind: 'vol', parts: ['head'], mats: ['skin'], fn: (x, y, z) => y > 88.5 && !(x > 1 && y < 93.0 - 0.1 * z * z) ? 'hair' : null });   // r6c: scalp under the grooved hair = hair colour (no pale line down a groove)
  M.decals.push(crownBand(-3, 3));
  return { M, S };
}

// ------------------------------------------------------------------------------------------------ items (design units, continuous)
/** an item from a continuous fill(u, v, w) -> material | null over a design-unit box [u0, u1] x [v0, v1] x [w0, w1] */
function contItem(fill, box, pal, s, res = RES, pure = null) {
  if (!pure) { const prims = [{ f: (x, y, z) => fill(x, y, z) ? -1 : 1, bb: box, part: 'item', prio: 1, mat: (x, y, z) => fill(x, y, z) }]; return meshItem({ prims, palette: pal }, s, res, LOOK); }
  // canon colours (pencil eraser caps): meshed separately WITHOUT jitter / edge ring / heavy AO so they stay pure, then merged
  const sel = (keep) => (x, y, z) => { const m = fill(x, y, z); return m && keep(m) ? m : null; };
  const part = (f, look) => { const prims = [{ f: (x, y, z) => f(x, y, z) ? -1 : 1, bb: box, part: 'item', prio: 1, mat: (x, y, z) => f(x, y, z) }]; return meshItem({ prims, palette: pal }, s, res, look); };
  const a = part(sel((m) => !pure.has(m)), LOOK), b = part(sel((m) => pure.has(m)), { ao: 0.1, jitter: 0, edge: 0 });
  const ve = a.getAttribute('voxEdge'); if (ve && !b.getAttribute('voxEdge')) b.setAttribute('voxEdge', new THREE.Float32BufferAttribute(new Float32Array(b.getAttribute('position').count), 1));
  for (const g of [a, b]) g.setIndex(Array.from(g.index.array));
  const m = mergeGeometries([a, b]); m.computeBoundingSphere(); m.computeBoundingBox(); return m;
}
const PENCIL_PAL = { cap_blue: '#1f5fff', cap_pink: '#f2708c', ferrule: '#b9bec8', body: '#f6c531', wood: '#ebc999', lead: '#3a3a42', r: '#ff4d6d', y: '#ffe14d', g: '#4fd06a', b: '#2bb4e8', v: '#7a5cff' };
/** pencil along x, origin at its middle: eraser cap at -x, tip at +x (flip: reversed). cap 'blue' = rainbow core, 'pink' = graphite */
export function pencilGeo(cap, s = UNIT, len = 24, flip = false, R = 2.0, capLen = 4.8) {
  const L = len, c0 = capLen, c1 = capLen + 1.8 * R / 2, c2 = L - 4.6, c3 = L - 1.4;   // canon fix: eraser cap 1.5x longer, silver ferrule ring before the yellow body
  return contItem((x, y, z) => {
    const u = flip ? L / 2 - x : x + L / 2; const a = Math.abs(y), b = Math.abs(z);
    const oct = (r) => a <= r && b <= r && a + b <= r * 1.42;
    if (u < 0 || u > L) return null;
    if (u < c0) return oct(R * 0.98) ? 'cap_' + cap : null;
    if (u < c1) return oct(R * 1.04) ? 'ferrule' : null;
    if (u < c2) return oct(R) ? 'body' : null;
    const t = (u - c2) / (L - c2), r = R * (1 - t) + 0.25;
    if (!oct(r)) return null;
    if (u < c3) return 'wood';
    return cap === 'blue' ? (y >= 0 ? (z >= 0 ? 'r' : 'y') : (z >= 0 ? 'g' : 'b')) : 'lead';
  }, [-L / 2, -R * 1.1, -R * 1.1, L / 2, R * 1.1, R * 1.1], PENCIL_PAL, s, RES, new Set(['cap_blue', 'cap_pink']));
}
const STRAT_PAL = { body: '#d99a50', guard: '#f3f1ea', pickup: '#34343a', chrome: '#c7cbd2', fret: '#b9b2a6', maple: '#e3c28c', board: '#4b2e1f' };
/** Strat: body in the x-y plane, face toward +z (w 0..4, face at w > 3), neck along +x; origin = body centre */
export function stratGeo(s = UNIT) {
  const inBody = (u, v) => (((u + 3) / 8) ** 2 + (v / 7.2) ** 2 <= 1 || ((u - 4) / 5.5) ** 2 + ((v - 0.6) / 6.2) ** 2 <= 1 || ((u - 8.5) / 4.2) ** 2 + ((v - 4.4) / 1.9) ** 2 <= 1 || ((u - 7) / 3.2) ** 2 + ((v + 4.3) / 1.7) ** 2 <= 1)
    && !(u > 6.2 && Math.abs(v) < 2.6 && !(u < 10.5 && Math.abs(v) < 1.6));
  return contItem((u, v, wz) => {
    const w = wz + 2;
    if (inBody(u, v) && w >= 0 && w < 4) {
      if (w < 3) return 'body';
      if (u > -6.5 && u < -4.5 && Math.abs(v) < 2.2) return 'chrome';
      if ([-2.5, 0.5, 3.5].some((pu) => Math.abs(u - pu) < 0.6) && v > -1.6 && v < 2.6) return 'pickup';
      if ([[-4.5, -4.5], [-2.5, -5.5]].some(([a, b]) => Math.abs(u - a) < 0.7 && Math.abs(v - b) < 0.7)) return 'chrome';
      const inset = inBody(u - 1.5, v) && inBody(u + 1.5, v) && inBody(u, v - 1.5) && inBody(u, v + 1.5);
      if (inset && u < 9 && (v > -2.6 || (u > -4 && u < 1))) return 'guard';
      return 'body';
    }
    if (u >= 10 && u < 34 && Math.abs(v) <= 1.5 && w >= 1 && w < 4) return w >= 3 ? (u > 11 && (u % 4) < 0.6 ? 'fret' : 'board') : 'maple';
    if (u >= 34 && u < 40 && v >= -1.5 && v <= 3 && w >= 2 && w < 4) return 'maple';
    if (u >= 34.5 && u < 40 && (u % 2) < 0.8 && v > 3 && v < 4.3 && w >= 3 && w < 4) return 'chrome';
    return null;
  }, [-12, -8, -2, 40, 8, 2], STRAT_PAL, s);
}
const ACOUSTIC_PAL = { top: '#cf8f4c', side: '#7c4a28', hole: '#24160e', neck: '#5a3a22', board: '#2e1e14', head: '#3e2616', chrome: '#c7cbd2' };
/** acoustic: body figure-8 in the x-y plane, top face +z (w 0..5, top at w > 4), neck along +x; origin = waist centre, back at w = 0 */
export function acousticGeo(s = UNIT) {
  return contItem((u, v, w) => {
    if (w < 0 || w >= 5) return null;
    const body = ((u + 5.5) / 8.2) ** 2 + (v / 8.2) ** 2 <= 1 || ((u - 5) / 6.2) ** 2 + (v / 6.6) ** 2 <= 1;
    if (body) { if (w < 4) return 'side'; if ((u - 1.5) ** 2 + v * v <= 4.5) return 'hole'; if (u > -8.5 && u < -6.5 && Math.abs(v) < 3) return 'head'; return 'top'; }
    if (u >= 10 && u < 31 && Math.abs(v) <= 1.5 && w >= 2) return w >= 4 ? 'board' : 'neck';
    if (u >= 31 && u < 37 && Math.abs(v) <= 2 && w >= 3) return Math.abs(v) > 1.4 && (u % 2) < 1 ? 'chrome' : 'head';
    return null;
  }, [-14, -9, 0, 37, 9, 5], ACOUSTIC_PAL, s);
}
/** flat cap for the hat-in-hand poses: centred, bottom at y = 0, brim toward +x (same shape as the cap on his head) */
export function capGeo(s = UNIT) {
  return meshItem({ prims: [P(clip(superEllipsoid([1.6, 2.8, 0], [11.0, 4.6, 10.2], 2.8), (x, y) => y > 0.8), 'item', 'cap', { prio: 2 }), P(roundBox([0, 0.8, 0], [9.6, 1.0, 9.4], 3.6), 'item', 'capBand'), P(roundBox([10.6, 0.8, 0], [2.8, 0.55, 6.6], 0.5), 'item', 'capBand')],
    palette: { cap: CHARLIE_PAL.cap, capBand: CHARLIE_PAL.capBand } }, s, RES, LOOK);
}

// ------------------------------------------------------------------------------------------------ model (voxfig-compatible)
const NAME_IDX = { head: 1, torso: 2, uarmR: 3, larmR: 4, uarmL: 5, larmL: 6, thighR: 7, shinR: 8, thighL: 9, shinL: 10 };

// ------------------------------------------------------------------------------------------------ r6 rig split (HI only, opt-in in voxfig)
/** per hero: waist cut height (just above the belt), foot materials, top of the foot (above: the shin / boot shaft), toe break x */
const RIG = { jade: { waist: 51.6, footMats: ['shoe', 'sole'], ankleTop: 7.4, ballX: 5.4 }, charlie: { waist: 50.4, footMats: ['boot', 'bootSole'], ankleTop: 6.6, ballX: 4.6 },
  ricky: { waist: 49.8, footMats: ['shoe', 'sole'], ankleTop: 6.6, ballX: 4.8 } };
/** finger poses (besides 'fist' = the mitten as voxelized in the forearm part): skin primitives around the hand of side A */
function handPose(pose, S, A) {
  const z = A.sh[2], sg = A.sg, hy = S.wrY - 3.3, sk = (sh) => P(sh, 'hv', 'skin', { prio: 6 }); const out = [];
  if (pose === 'open') {   // flat palm, four fingers straight down, thumb out forward
    out.push(sk(superEllipsoid([0.6, hy + 1.0, z], [2.8, 2.4, 1.6], 2.6)));
    [[-1.5, 1.7], [-0.3, 2.0], [0.9, 2.1], [2.1, 1.7]].forEach(([fx, hl]) => out.push(sk(roundBox([fx, hy - 1.2 - hl, z], [0.52, hl, 1.15], 0.45))));
    out.push(sk(cone([2.2, hy + 1.6, z - sg * 0.8], [4.4, hy + 0.2, z - sg * 1.3], 1.0, 0.8)));
  } else if (pose === 'point') {   // fist + the index finger straight
    out.push(sk(superEllipsoid([0.2, hy + 0.5, z], [2.8, 3.0, 2.5], 2.6)), sk(cone([1.7, hy + 1.6, z - sg * 1.5], [3.3, hy - 0.2, z - sg * 1.8], 1.15, 1.0)));
    out.push(sk(cone([2.1, hy - 1.4, z - sg * 0.6], [2.5, hy - 6.2, z - sg * 0.6], 0.85, 0.7)));
  } else if (pose === 'grip') {   // C-shaped: palm behind, fingers curled in front around a channel along z (a handle / bar), thumb over it
    out.push(sk(superEllipsoid([-0.9, hy, z], [1.7, 3.5, 2.5], 2.6)));
    out.push(sk(clip(superEllipsoid([1.6, hy - 0.4, z], [1.8, 3.2, 2.5], 2.6), (x, y) => (x - 0.8) ** 2 + (y - (hy + 0.1)) ** 2 > 1.25 * 1.25)));
    out.push(sk(cone([1.0, hy + 2.1, z - sg * 1.6], [2.7, hy + 0.9, z - sg * 1.9], 1.0, 0.9)));
  }
  return out;
}
/**
 * r6 rig split (HI): the approved part meshes are partitioned BY VOXEL (same vertex buffers, new index arrays), so the figure at
 * rest is the same triangles: torso -> pelvis + chest (waist), shin -> shin + foot + toe (ankle, ball), lower arm -> forearm + hand
 * (wrist). Hidden plug meshes (interior voxels next to each cut) fill the crack when a joint bends. Finger poses: separate hand
 * meshes (grip / point / open) on the wrist; 'fist' = the original hand. Returns pivots in design units (voxfig scales them).
 */
/**
 * r6 spring parts (motion_r2 REQUESTS 1): pieces of a part mesh that get their own identity-rest joint at a pivot, for secondary
 * motion: { name, part (source mesh), parent (a spring name, or = part for the part's own joint), pivot (design), test(x, y, z, mat) }
 */
function springSpecs(vname, M) {
  const out = [], hairish = (m) => m === 'hair' || m === 'hairHi';
  if (vname === 'jade_up' && M.bunPrim) { const b = M.bun; out.push({ name: 'bun', part: 'head', parent: 'head', pivot: [b[0] + 2.6, b[1] - 2.2, 0], test: (x, y, z, m) => hairish(m) && M.bunPrim.f(x, y, z) <= 0.4 && M.shellPrim.f(x, y, z) > 0 }); }
  if (vname === 'jade_up') for (const sg of [1, -1]) out.push({ name: sg > 0 ? 'wispR' : 'wispL', part: 'head', parent: 'head', pivot: [2.0, 86.2, sg * 7.5], test: (x, y, z, m) => hairish(m) && Math.abs(x - 2.0) < 1.0 && Math.abs(z - sg * 7.5) < 1.0 && y > 79 && y < 86.2 });
  if (vname === 'jade_down') {
    out.push({ name: 'hairBack', part: 'head', parent: 'head', pivot: [-8.4, 79.8, 0], test: (x, y, z, m) => hairish(m) && x < -6.2 && y < 79.8 && y >= 73.5 });
    out.push({ name: 'hairBack2', part: 'head', parent: 'hairBack', pivot: [-8.7, 73.5, 0], test: (x, y, z, m) => hairish(m) && x < -6.2 && y < 73.5 });
    for (const sg of [1, -1]) out.push({ name: sg > 0 ? 'wispR' : 'wispL', part: 'head', parent: 'head', pivot: [2.6, 79.5, sg * 8.0], test: (x, y, z, m) => hairish(m) && x > 0 && sg * z > 6.9 && y < 79.5 });
  }
  if (vname.startsWith('jade')) for (const sg of [1, -1]) { const sd = sg > 0 ? 'R' : 'L', strap = (m) => m === 'orange' || m === 'snap';
    out.push({ name: 'strap' + sd, part: 'thigh' + sd, parent: 'thigh' + sd, pivot: [8.4, 48.4, sg * 3.6], test: (x, y, z, m) => strap(m) && x > 7.0 && Math.abs(z - sg * 3.6) < 1.3 && y < 48.4 });
    out.push({ name: 'strapThigh' + sd, part: 'thigh' + sd, parent: 'thigh' + sd, pivot: [1.2, 35.0, sg * 15.6], test: (x, y, z, m) => strap(m) && sg * z > 15.0 && y < 35.0 }); }
  if (vname === 'charlie') {
    out.push({ name: 'cap', part: 'head', parent: 'head', pivot: [8.2, 91.6, 0], test: (x, y, z, m) => (m === 'cap' || m === 'capBand') && y > 90.5 && !(m === 'capBand' && x > 9.6) });
    out.push({ name: 'capBrim', part: 'head', parent: 'cap', pivot: [9.8, 91.6, 0], test: (x, y, z, m) => m === 'capBand' && x > 9.6 });
  }
  return out;
}
function buildRig(hero, M, S, parts, vname) {
  const R = RIG[hero], fm = new Set(R.footMats), sub = {}, plugs = {}, piv = { waist: [0, R.waist, 0] };
  // spring parts: each source part partitioned into its rest + one class per spring piece
  const springs = []; let headCls = null;
  const specs = springSpecs(vname, M);
  for (const part of [...new Set(specs.map((s) => s.part))]) {
    const L = specs.filter((s) => s.part === part), m = parts[part];
    const sp = splitMesh(m, L.length + 1, (x, y, z, mat) => { for (let i = 0; i < L.length; i++) if (L[i].test(x, y, z, mat)) return i + 1; return 0; }, 3);   // r6c: 3-voxel overlap band (no cracks in thin hair)
    sub[part + '_rest'] = sp.index[0]; plugs[part + '_rest'] = plugMesh(m, sp.cls, 0); if (part === 'head') headCls = sp.index[0];
    L.forEach((s, i) => { sub['spring_' + s.name] = sp.index[i + 1]; plugs['spring_' + s.name] = plugMesh(m, sp.cls, i + 1); piv[s.name] = s.pivot; springs.push({ name: s.name, part, parent: s.parent }); });
  }
  const t = parts.torso; const st = splitMesh(t, 2, (x, y) => y >= R.waist ? 1 : 0);
  sub.pelvis = st.index[0]; sub.chest = st.index[1]; plugs.pelvis = plugMesh(t, st.cls, 0); plugs.chest = plugMesh(t, st.cls, 1);
  const hands = {};
  for (const A of [S.R, S.L]) {
    const sd = A.sg > 0 ? 'R' : 'L', z = A.hipJ[2];
    piv['ankle' + sd] = [0.6, Math.min(R.ankleTop - 1.4, 5.4), z]; piv['toe' + sd] = [R.ballX, 0.6, z];
    const sh = parts['shin' + sd]; const ss = splitMesh(sh, 3, (x, y, zz, m) => fm.has(m) && y < R.ankleTop ? (x > R.ballX ? 2 : 1) : 0);
    sub['shin' + sd] = ss.index[0]; sub['foot' + sd] = ss.index[1]; sub['toe' + sd] = ss.index[2];
    plugs['shin' + sd] = plugMesh(sh, ss.cls, 0); plugs['foot' + sd] = plugMesh(sh, ss.cls, 1); plugs['toe' + sd] = plugMesh(sh, ss.cls, 2);
    piv['wrist' + sd] = [0.4, S.wrY - 0.4, A.sh[2]];
    const la = parts['larm' + sd]; const sl = splitMesh(la, 2, (x, y, zz, m) => m === 'skin' && y < S.wrY - 0.4 ? 1 : 0);
    sub['larm' + sd] = sl.index[0]; sub['hand' + sd] = sl.index[1]; plugs['larm' + sd] = plugMesh(la, sl.cls, 0); plugs['hand' + sd] = plugMesh(la, sl.cls, 1);
    hands[sd] = {};
    for (const pose of ['grip', 'point', 'open']) {
      const hv = voxelizeParts({ prims: handPose(pose, S, A), cuts: [], decals: [], palette: M.palette }, ['hv'], { hv: piv['wrist' + sd] }, UNIT_S, RES, LOOK);
      hands[sd][pose] = hv.parts.hv.geo;
    }
  }
  return { piv, sub, plugs, hands, waist: R.waist, springs, headCls };
}
let UNIT_S = UNIT;   // world units per design unit of the model being built (nativeModel's s)

// ------------------------------------------------------------------------------------------------ r6 face states (HI, with the split rig)
const FACE_MATS = new Set(['skin', 'skinShade', 'blush', 'lash', 'iris', 'irisHi', 'white', 'mouth', 'mouthD', 'brow']);
const linHex = (h) => [1, 3, 5].map((i) => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });   // = voxel.js SRGB2LIN
/**
 * viseme shapes, rows relative to the base mouth's bottom fine row: [dr, outer half width, inner half width, inner material];
 * widths in fine voxels from the mouth centre ('hw' = the hero's base mouth half width). Cells of the base mouth not covered -> skin.
 */
const VISEMES = {
  M: (hw) => [[0, hw + 0.5, hw + 0.5, 'mouthD'], [1, hw - 0.5, 0, null]],                                        // closed, pressed lips (m b p)
  A: (hw) => [[1, hw - 1, 0, null], [0, hw, hw - 1, 'white'], [-1, hw, hw - 1, 'mouthIn'], [-2, hw, hw - 1, 'mouthIn'], [-3, hw - 1, 0, null]],   // open (a)
  E: (hw) => [[1, hw + 1, 0, null], [0, hw + 2, hw + 1, 'white'], [-1, hw + 2, hw + 1, 'mouthIn'], [-2, hw + 1, 0, null]],                   // wide (e i)
  O: () => [[2, 1, 0, null], [1, 2, 1, 'mouthIn'], [0, 2, 1, 'mouthIn'], [-1, 2, 1, 'mouthIn'], [-2, 1, 0, null]],                            // round (o)
  U: () => [[1, 1, 0, null], [0, 1.6, 1, 'mouthIn'], [-1, 1, 0, null]],                                                                    // pucker (u w)
  F: (hw) => [[1, hw, hw, 'white'], [0, hw, 0, null]],                                                                                       // teeth on the lip (f v)
};
/**
 * r6 face rig (HI): the head's front-plane voxel faces around the eyes and mouth become a small per-figure 'faceplate' mesh
 * (rig.sub.head = the head without them), recoloured per state with each vertex's baked jitter / AO kept. set({ blink, look,
 * viseme }) at rest restores the exact baked colours. Fine lattice indices (gj up, gk = +z = the hero's right = image-left).
 */
function faceRig(m, palette) {
  const FB = faceBlocks(m), front = new Map();
  for (let b = 0; b < FB.n; b++) { if (FB.ax[b] !== 0 || FB.sg[b] < 0) continue; const li = [FB.li[b * 3], FB.li[b * 3 + 1], FB.li[b * 3 + 2]]; const v = voxelAt(m, ...li);
    if (!FACE_MATS.has(v.mat) || v.x < 4.0) continue; const gj = li[1] + m.crop[1] + m.G.J0, gk = li[2] + m.crop[2] + m.G.K0, key = gj * 4096 + gk;
    const o = front.get(key); if (!o || v.x > o.x) front.set(key, { b, gj, gk, x: v.x, mat: v.mat }); }
  const cells = [...front.values()]; const K = (gj, gk) => gj * 4096 + gk;
  const eyes = [1, -1].map((sg) => { const E = new Map(), L = []; for (const c of cells) if ((c.gk + 0.5) * sg > 0) { if (c.mat === 'iris' || c.mat === 'irisHi' || c.mat === 'white') E.set(K(c.gj, c.gk), c); }
    const ej = [...E.values()].map((c) => c.gj); if (!ej.length) return null; const top = Math.max(...ej), bot = Math.min(...ej);
    for (const c of cells) if ((c.gk + 0.5) * sg > 0 && c.mat === 'lash' && c.gj > top && c.gj <= top + 3) L.push(c);
    const ks = (L.length ? L : [...E.values()]).map((c) => c.gk); return { E, L: new Set(L.map((c) => K(c.gj, c.gk))), top, bot, kmin: Math.min(...ks), kmax: Math.max(...ks), lashTop: L.length ? Math.max(...L.map((c) => c.gj)) : top + 2 }; }).filter(Boolean);
  const mo = cells.filter((c) => c.mat === 'mouth' || c.mat === 'mouthD'); const mb = Math.min(...mo.map((c) => c.gj)), mt = Math.max(...mo.map((c) => c.gj));
  const czc = mo.reduce((a, c) => a + c.gk + 0.5, 0) / mo.length, hw = (Math.max(...mo.map((c) => c.gk)) - Math.min(...mo.map((c) => c.gk)) + 1) / 2;
  const inEye = (c) => eyes.find((e) => c.gk >= e.kmin - 1 && c.gk <= e.kmax + 1 && c.gj >= e.bot - 1 && c.gj <= e.lashTop + 1);
  const inMouth = (c) => c.gj >= mb - 4 && c.gj <= mt + 3 && Math.abs(c.gk + 0.5 - czc) < hw + 3;
  const used = cells.filter((c) => inEye(c) || inMouth(c)); const nFront = used.length;
  // the profile eye (k08b: a dark mark on each side face of the head) closes with the blink too
  const eb = Math.min(...eyes.map((e) => e.bot)) - 3, et = Math.max(...eyes.map((e) => e.lashTop)) + 3, prof = { 1: [], '-1': [] };
  const taken = new Set(used.map((c) => c.b));
  for (let b = 0; b < FB.n; b++) { if (taken.has(b) || FB.ax[b] === 1 || (FB.ax[b] === 0 && FB.sg[b] < 0)) continue; const li = [FB.li[b * 3], FB.li[b * 3 + 1], FB.li[b * 3 + 2]]; const v = voxelAt(m, ...li);
    if ((v.mat !== 'lash' && v.mat !== 'eye') || v.x < 3) continue; const gj = li[1] + m.crop[1] + m.G.J0; if (gj < eb || gj > et) continue;
    const sd = v.z > 0 ? 1 : -1; const c = { b, gj, gk: li[2] + m.crop[2] + m.G.K0, x: v.x, mat: v.mat, prof: sd }; prof[sd].push(used.length); used.push(c); }
  // faceplate geometry: the used blocks' 8 vertices each, triangles re-indexed; the head index without them
  const src = m.geo, idx = src.index.array, sel = new Int32Array(FB.n).fill(-1); used.forEach((c, q) => { sel[c.b] = q; });
  const g = new THREE.BufferGeometry(), nU = used.length;
  for (const [k, a] of Object.entries(src.attributes)) { const w = a.itemSize, arr = new a.array.constructor(nU * 8 * w); used.forEach((c, q) => arr.set(a.array.subarray(c.b * 8 * w, (c.b + 1) * 8 * w), q * 8 * w)); g.setAttribute(k, new THREE.BufferAttribute(arr, w, a.normalized)); }
  const fi = [], hi = []; for (let t = 0; t < idx.length; t += 3) { const b = Math.floor(idx[t] / 8), q = sel[b]; if (q < 0) { hi.push(idx[t], idx[t + 1], idx[t + 2]); continue; } for (let e = 0; e < 3; e++) fi.push(q * 8 + idx[t + e] - b * 8); }
  g.setIndex(fi); g.computeBoundingBox(); g.computeBoundingSphere();
  const col0 = g.attributes.color.array.slice(), lin = Object.fromEntries(Object.keys(palette).map((k) => [k, linHex(palette[k])]));
  const fac = new Float32Array(nU * 8); used.forEach((c, q) => { const L0 = lin[c.mat], mx = Math.max(...L0) || 1; for (let v = 0; v < 8; v++) { const o = (q * 8 + v) * 3; fac[q * 8 + v] = Math.max(col0[o], col0[o + 1], col0[o + 2]) / mx; } });
  const at = new Map(used.slice(0, nFront).map((c, q) => [K(c.gj, c.gk), q]));
  /** desired material per used cell for a state */
  function mats(st) {
    const out = used.map((c) => c.mat); const blink = Math.max(0, Math.min(1, st.blink || 0)), look = st.look || [0, 0];
    const dx = Math.round(Math.max(-1, Math.min(1, look[0])) * 2), dy = Math.round(Math.max(-1, Math.min(1, look[1])) * 1);
    for (const e of eyes) {
      if (dx || dy) for (const [key, c] of e.E) { const s = e.E.get(K(c.gj - dy, c.gk - dx)); out[at.get(key)] = s ? s.mat : 'white'; }
      if (blink > 0) { const closed = e.bot + Math.round((e.top - e.bot) * 0.3), Lr = Math.round(e.top + 1 - blink * (e.top + 1 - closed));
        used.forEach((c, q) => { if (q >= nFront || c.gk < e.kmin || c.gk > e.kmax || c.gj < e.bot || c.gj > e.lashTop) return; const key = K(c.gj, c.gk), isE = e.E.has(key), isL = e.L.has(key);
          if (c.gj === Lr || c.gj === Lr + 1) { if (isE || isL || c.gj <= e.top + 1) out[q] = 'lash'; }
          else if (c.gj > Lr + 1) { if (isL) out[q] = blink > 0.3 ? 'skinShade' : 'lash'; else if (isE) out[q] = 'skin'; }
          else if (isE && blink >= 0.999) out[q] = 'skin'; }); }
    }
    if (blink > 0) for (const list of Object.values(prof)) { if (!list.length) continue; const js = list.map((q) => used[q].gj), top = Math.max(...js), bot = Math.min(...js);
      const closed = bot + Math.round((top - bot) * 0.3), Lr = Math.round(top + 1 - blink * (top + 1 - closed));
      for (const q of list) { const gj = used[q].gj; if (gj > Lr + 1 || (gj < Lr && blink >= 0.999)) out[q] = 'skin'; else if (gj >= Lr && gj <= Lr + 1) out[q] = used[q].mat; } }
    const vz = st.viseme && st.viseme !== 'rest' && VISEMES[st.viseme];
    if (vz) { const rows = new Map(vz(hw).map((r) => [mb + r[0], r]));
      used.forEach((c, q) => { if (q >= nFront || !inMouth(c)) return; if (c.mat === 'mouth' || c.mat === 'mouthD') out[q] = 'skin'; const r = rows.get(c.gj); if (!r) return; const d = Math.abs(c.gk + 0.5 - czc);
        if (d < r[1]) out[q] = 'mouth'; if (r[3] && d < r[2]) out[q] = r[3]; }); }
    return out;
  }
  return { geo: g, head: new Uint32Array(hi), fp: sel, used: used.map((c) => ({ gj: c.gj, gk: c.gk, mat: c.mat })), col0, fac, lin, mats, eyes: eyes.length, mouth: { mb, mt, czc, hw }, visemes: ['rest', ...Object.keys(VISEMES)] };
}
/**
 * Build a native model for a voxfig variant name ('jade_up' | 'jade_down' | 'charlie' | 'charlie_nohat' | 'ricky').
 * Returns the carveFigure() shape { source: 'native', parts, piv, u, height, hands, handY, J } plus `native` (items, bun,
 * hand offsets, guitar rigs) for voxfig buildFigure.
 */
/**
 * r6 canon (HI): BOTH bun eraser caps point UP (Jade 2026-10-16, paper art 125.9): pink cap up on her right (image-left from the
 * front), blue cap up on her left (image-right); the pencils cross in an X whose crossing is the bun centre, tips going down
 * into the bun and ending inside it (hidden). a = angle from vertical, back = backward lean of the caps, tipIn = tip end's depth
 * past the bun centre (inside the bun), len = pencil length.
 */
const R6_BUN = { len: 14, a: 27 * Math.PI / 180, back: 0.25, tipIn: 2.6 };   // r6b: ~40% less showing (caps + a short yellow length), exits closer together
/** bun-local placement { blue, pink: { tip (unit direction cap -> tip, pencil local +x), off (pencil centre, world units) } } */
function bunPlace(s) {
  const out = {};
  for (const [cap, sg] of [['pink', 1], ['blue', -1]]) {
    const cd = new THREE.Vector3(-R6_BUN.back, Math.cos(R6_BUN.a), sg * Math.sin(R6_BUN.a)).normalize();   // cap direction (up, out to +z = her right for pink)
    out[cap] = { tip: cd.clone().negate(), off: cd.clone().multiplyScalar((R6_BUN.len / 2 - R6_BUN.tipIn) * s) };
  }
  return out;
}
export function nativeModel(vname, s = UNIT) {
  const t0 = performance.now();
  const { M, S } = vname === 'jade_up' ? jade(false) : vname === 'jade_down' ? jade(true) : vname === 'charlie' ? charlie(true) : vname === 'charlie_nohat' ? charlie(false) : ricky();
  const { parts, voxels, top } = voxelizeParts(M, PARTS, S.pivots, s, RES, LOOK);
  UNIT_S = s; const hero = vname.startsWith('jade') ? 'jade' : vname.startsWith('charlie') ? 'charlie' : 'ricky';
  const V3 = (a) => new THREE.Vector3(a[0] * s, a[1] * s, a[2] * s);
  const freeLattices = () => { for (const p of Object.values(parts)) { delete p.G; delete p.look; delete p.palette; } };   // only needed for the rig split
  // r6 split rig data (HI): built LAZILY on the first native.rig read (voxfig buildFigure with rig on), then the lattices are freed
  const makeRig = () => { UNIT_S = s; const t1 = performance.now(); const rig = buildRig(hero, M, S, parts, vname);
    rig.face = faceRig(parts.head, M.palette); const hc = rig.headCls; rig.sub.head = rig.face.head;
    if (hc) { const fp = rig.face.fp, o = []; for (let t = 0; t < hc.length; t += 3) if (fp[Math.floor(hc[t] / 8)] < 0) o.push(hc[t], hc[t + 1], hc[t + 2]); rig.sub.head = new Uint32Array(o); }   // the head's rest class (incl. the overlap band of the spring pieces) minus the faceplate
    delete rig.headCls; for (const [k, v] of Object.entries(rig.piv)) rig.piv[k] = V3(v); freeLattices(); rig.buildMs = performance.now() - t1; return rig; };
  if (!HI) freeLattices();
  const piv = {}; for (const [n, i] of Object.entries(NAME_IDX)) piv[i] = V3(S.pivots[n]);
  const fist = V3([0.6, S.wrY - 3.3 - S.elY, 0]);                         // fist centre in elbow space (pencils / guitars attach here)
  const native = { hand: { R: fist.clone(), L: fist.clone() }, voxels, res: RES, scale: SCALE };
  if (vname.startsWith('jade')) {
    native.pencil = { blue: pencilGeo('blue', s, 24, true), pink: pencilGeo('pink', s, 24, true), len: 24 * s };   // in the hands: tip away from the cap end
    if (M.bun && !HI) { native.bun = V3(M.bun); native.bunPencil = { blue: pencilGeo('blue', s, 20, false, 1.6, 3.5), pink: pencilGeo('pink', s, 20, false, 1.6, 3.5) }; /* bun: caps ~1.1x the original length, thinner (no antennae read) */ }
    else if (M.bun) { native.bun = V3(M.bun); native.bunPencil = { blue: pencilGeo('blue', s, R6_BUN.len, false, 1.6, 3.5), pink: pencilGeo('pink', s, R6_BUN.len, false, 1.6, 3.5), place: bunPlace(s) }; }
  }
  if (vname === 'ricky') native.strat = { geo: stratGeo(s), base: V3([9.4, 7.5, 2.8]), fret: V3([24, 0, 1.5]), strum: V3([-1.5, 0, 2.5]) };
  if (vname.startsWith('charlie')) {
    // the acoustic: slung on his back (neck up toward his left shoulder, top facing back) unless he plays it (chord / sustain)
    const X = new THREE.Vector3(0, Math.cos(0.45), -Math.sin(0.45)), Z = new THREE.Vector3(-1, 0, 0), Y = new THREE.Vector3().crossVectors(Z, X);
    native.acoustic = { geo: acousticGeo(s), slung: { pos: V3([-6.6, 13, 0.5]), quat: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)) },
      base: V3([7.0, 9.5, 3.0]), fret: V3([22, 0, 5.4]), strum: V3([1.5, 0, 5.6]) };
    native.cap = capGeo(s);
  }
  if (HI) { let rig = null; Object.defineProperty(native, 'rig', { get: () => (rig ||= makeRig()), enumerable: false, configurable: true }); }
  return { source: 'native', native, parts, piv, u: s, height: top * s, handY: (S.wrY - 2.9) * s, hands: { R: V3(S.R.wr), L: V3(S.L.wr) },
    J: { neck: S.neck * s, hip: S.hip * s, knee: S.knee * s, shoulder: S.shY * s, elbow: S.elY * s, wrist: S.wrY * s }, buildMs: performance.now() - t0 };
}
