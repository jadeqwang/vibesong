// ACT III world DENSITY layer (2026-10-15): everything that makes the shared TALOS world read like the keyframes
// (k07 / k08b / k09): voxel flame cypresses, temples with peristyles + pediments + roofs, terraces with ashlar coursing
// and stairs, an aqueduct over the sea, stratified voxel sea stacks, and stepped voxel strata over the inland hills.
// Pure decoration: no gameplay anchors live here, nothing a scene toggles. Built once inside build(), added to the scene
// as top-level children (Act IV's erase patch and visibility toggles apply to every top-level child), plaster until
// coloured (patchTree in build.js).
//
// Shadow rule: the golden-hour sun is very low, ahead at +x and slightly -z (SUN_DIR), so anything tall on the meadow
// side throws a shadow ~7x its height back across the causeway. sunSafeH() gives the max top height (world y) for a
// piece at (x, z) that keeps the action strip (causeway x -300..1800) out of its shadow; big masses respect it.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, vnoise, fbm } from '../../../util.js';
import { meshVoxelGrid } from '../../../voxel.js';
import { columnGeo, entablatureGeo, pedimentGeo2, roofGeo, stairGeo, ashlarGeo, bake, place, terrainHeight } from '../../../world.js';
import { triplanarMaterial, rockTexture, grassTexture } from '../../../materials.js';
import { marbleTexture } from './props.js';

const PL = { stone: 0xf4efe6, clay: 0xe2d6c0, rock: 0xd9ccb4, roof: 0xe9dcc6, meadow: 0xe6dcc8 };
export const groundY = (x, z) => terrainHeight(-x, z);

/** max world-y top for a meadow-side piece at (x, z) that does not shadow the causeway action strip */
export function sunSafeH(x, z, sun) {
  if (z > -24) return Infinity;
  const hx = sun.x, hz = sun.z, hl = Math.hypot(hx, hz), tanE = sun.y / hl;
  const s = (-24 - z) / (-hz / hl);            // horizontal distance from the strip edge back along the sun ray
  const xs = x - s * (hx / hl);                // where on the strip that ray starts
  if (xs < -300 || xs > 1800) return Infinity;
  return s * tanE;
}

function stoneMat(color = '#efe3cc', plaster = PL.stone, bump = 0.5) { const m = triplanarMaterial({ tex: marbleTexture(), scale: 0.02, bump, color, roughness: 0.72 }); m.userData.plaster = plaster; return m; }
// the triplanar detail textures are albedo MULTIPLIERS (rock ~0.62, grass ~0.78): lift the base colour so the vertex colours read true after the flood
function rockMat(plaster = PL.rock) { const m = triplanarMaterial({ tex: rockTexture(), scale: 0.025, bump: 0.7, roughness: 0.92, vertexColors: true }); m.color.setScalar(1.45); m.userData.plaster = plaster; return m; }
function hillMat(plaster = PL.meadow) { const m = triplanarMaterial({ tex: grassTexture(), scale: 0.03, bump: 0.5, roughness: 0.95, vertexColors: true }); m.color.setScalar(1.22); m.userData.plaster = plaster; return m; }
const meshOf = (geo, mat, { cast = true } = {}) => { const o = new THREE.Mesh(geo, mat); o.castShadow = cast; o.receiveShadow = true; return o; };

// --------------------------------------------------------------- voxel cypress
const CYP_DARK = [0x2f, 0x5a, 0x2a], CYP_LIGHT = [0x5f, 0x8e, 0x3c], TRUNK = [0x6b, 0x52, 0x3a];
/**
 * A flame-shaped Italian cypress as a voxel sculpture (face-culled, baked AO): tall spindle, pointed tip, foliage
 * in soft tiers with a few lobes, a short trunk. h = height (world), v = voxel size. Base at y = 0, centred on x/z = 0.
 */
export function voxelCypressGeo(h, seed, v = 2) {
  const rnd = mulberry32(seed); const r0 = h * (0.105 + 0.02 * rnd());
  const R = Math.ceil(r0 * 1.35 / v) + 2, nx = 2 * R + 1, ny = Math.ceil(h * 1.04 / v) + 1, nz = nx;
  const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3);
  const tiers = 7 + Math.floor(rnd() * 4), ph = rnd() * 6.28, trunkH = h * 0.06;
  const lobes = Array.from({ length: 6 + Math.floor(rnd() * 4) }, () => ({ t: 0.15 + 0.65 * rnd(), a: rnd() * 6.28, s: 0.10 + 0.08 * rnd() }));
  for (let j = 0; j < ny; j++) {
    const y = (j + 0.5) * v, t = y / h; if (t > 1.02) continue;
    // flame profile: swells low, long taper to a sharp tip
    let prof = Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.95)), 0.55) * (1 - 0.62 * Math.pow(t, 1.25));
    if (t > 0.86) prof *= Math.max(0, (1.02 - t) / 0.16);
    const tier = 0.86 + 0.14 * Math.pow(0.5 + 0.5 * Math.sin(t * tiers * Math.PI * 2 + ph), 1.6);
    for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
      const x = (i - R) * v, z = (k - R) * v, d = Math.hypot(x, z), a = Math.atan2(z, x);
      let rr;
      if (y < trunkH) rr = Math.max(v * 0.8, r0 * 0.18);
      else {
        rr = r0 * prof * tier * (0.92 + 0.16 * vnoise(Math.cos(a) * 2.2 + seed, Math.sin(a) * 2.2 + t * 9, seed));
        for (const L of lobes) { const da = Math.atan2(Math.sin(a - L.a), Math.cos(a - L.a)); const dt = t - L.t; rr += r0 * L.s * Math.exp(-(da * da) / 0.35 - (dt * dt) / 0.004); }
      }
      if (d > rr) continue;
      const idx = i + nx * (j + ny * k); occ[idx] = 1;
      let c;
      if (y < trunkH) c = TRUNK;
      else { const out = Math.min(1, d / Math.max(1, rr)); const n = vnoise(x * 0.4 + seed, y * 0.35, z * 0.4); const w = Math.min(1, Math.max(0, 0.15 + 0.55 * out * (0.4 + 0.6 * t) + 0.35 * (n - 0.5)));
        c = [0, 1, 2].map((q) => CYP_DARK[q] + (CYP_LIGHT[q] - CYP_DARK[q]) * w); }
      col[idx * 3] = c[0]; col[idx * 3 + 1] = c[1]; col[idx * 3 + 2] = c[2];
    }
  }
  return meshVoxelGrid({ nx, ny, nz, occ, col }, { s: v, origin: [-(R + 0.5) * v, 0, -(R + 0.5) * v], ao: 0.4 });
}

// --------------------------------------------------------------- temple
/**
 * Peristyle Doric temple on a 3-step crepidoma with an entrance stair, cella walls in ashlar, full entablature, both
 * pediments, tiled roof. Front faces +x when rotY = 0 (long axis along x). ruin: 0..1 drops columns / roof / a pediment.
 * Returns { stone: [geo], dark: [geo] } in world coordinates.
 */
export function templeGeo({ x, z, y, nf = 6, ns = 11, sp = 34, h = 120, r = 7.5, rotY = 0, ruin = 0, seed = 1 }) {
  const rnd = mulberry32(seed); const S = [], D = [];
  const W = (nf - 1) * sp, Ln = (ns - 1) * sp; const pad = r * 3;
  // crepidoma + stair flight on the front
  for (let k = 0; k < 3; k++) { const g = ashlarGeo(Ln + pad * 2 + 24 - k * 8, 5, W + pad * 2 + 24 - k * 8, { bw: 26, bh: 5, gap: 0.5, seed: seed + k, jitter: 0 }); g.rotateY(Math.PI / 2); g.rotateY(-Math.PI / 2); g.translate(0, k * 5, 0); D.push(g); }
  { const st = stairGeo(5, 3, 3.5, W * 0.55); st.translate(-(Ln / 2 + pad + 12) - 17.5, -1, 0); D.push(st); }
  const base = 15; const { top } = columnGeo({ h, r });
  const colsAt = []; for (let i = 0; i < ns; i++) for (let j = 0; j < nf; j++) if (i === 0 || i === ns - 1 || j === 0 || j === nf - 1) colsAt.push([-Ln / 2 + i * sp, -W / 2 + j * sp, i, j]);
  for (const [cx, cz, i, j] of colsAt) {
    const gone = ruin > 0 && rnd() < ruin * 0.35 && i > 0 && i < ns - 1; if (gone) continue;
    const broken = ruin > 0 && rnd() < ruin * 0.4 && i > 1 && i < ns - 2;
    const { geo } = columnGeo({ h, r, broken: broken ? 1 : 0, seed: seed * 31 + i * 7 + j, plinth: false }); geo.translate(cx, base, cz); S.push(geo);
  }
  // cella (ashlar walls) with an open door on the front
  const cw = W - sp * 1.6, cl = Ln - sp * 2.2, ch = top - 2;
  for (const sg of [-1, 1]) { const g = ashlarGeo(cl, ch, 6, { bw: 24, bh: 9, seed: seed + 10 + sg }); g.translate(0, base, sg * cw / 2); S.push(g); }
  { const g = ashlarGeo(cw, ch, 6, { bw: 24, bh: 9, seed: seed + 20 }); g.rotateY(Math.PI / 2); g.translate(cl / 2, base, 0); S.push(g);
    for (const sg of [-1, 1]) { const f = ashlarGeo(cw * 0.32, ch, 6, { bw: 22, bh: 9, seed: seed + 21 + sg }); f.rotateY(Math.PI / 2); f.translate(-cl / 2, base, sg * cw * 0.34); S.push(f); }
    const lin = new THREE.BoxGeometry(6, ch * 0.3, cw * 0.4); lin.translate(-cl / 2, base + ch * 0.85, 0); S.push(lin); }
  // entablature around (front/back along z, sides along x), pediments, roof
  const eh = Math.round(h * 0.26), ey = base + top;
  const roofIntact = ruin < 0.5;
  for (const sg of [-1, 1]) { const e = entablatureGeo(Ln + r * 3, r * 3.2, eh, { tri: sp / 2 }); e.translate(0, ey, sg * W / 2); S.push(e); }
  for (const sg of [-1, 1]) { if (ruin >= 0.5 && sg < 0) continue; const e = entablatureGeo(W + r * 3, r * 3.2, eh, { tri: sp / 2 }); e.rotateY(Math.PI / 2); e.translate(sg * Ln / 2, ey, 0); S.push(e);
    const pd = pedimentGeo2(W + r * 3 + 8, W * 0.2, r * 3.4); pd.rotateY(Math.PI / 2); pd.translate(sg * Ln / 2, ey + eh, 0); S.push(pd); }
  if (roofIntact) { const rf = roofGeo(W + r * 3 + 12, Ln + 6, W * 0.2 + 2); rf.rotateY(Math.PI / 2); rf.translate(0, ey + eh + 1, 0); D.push(rf); }
  const out = (list) => list.map((g) => { g.rotateY(rotY); g.translate(x, y, z); return g; });
  return { stone: out(S), dark: out(D), top: y + ey + eh + W * 0.2 };
}

// --------------------------------------------------------------- terrace (retaining wall + stair + coping)
export function terraceGeo({ x, z, y0, y1, L, D: dep = 60, rotY = 0, seed = 1, stair = true }) {
  const S = [], H = y1 - y0;
  const w = ashlarGeo(L, H, 8, { bw: 26, bh: 8, seed }); w.translate(0, 0, dep / 2); S.push(w);
  for (const sg of [-1, 1]) { const sw = ashlarGeo(dep, H, 8, { bw: 26, bh: 8, seed: seed + sg }); sw.rotateY(Math.PI / 2); sw.translate(sg * L / 2, 0, 0); S.push(sw); }
  S.push(place(new THREE.BoxGeometry(L + 6, 3, 12), 0, H + 1.5, dep / 2));            // coping
  S.push(place(new THREE.BoxGeometry(L, H - 1, dep), 0, (H - 1) / 2, 0));              // fill
  if (stair) { const n = Math.max(3, Math.round(H / 4)); const st = stairGeo(n, H / n, 4.5, 26); st.rotateY(Math.PI / 2); st.translate(L * 0.18, 0, dep / 2 + 4.5 * n + 4); S.push(st);
    for (const sg of [-1, 1]) S.push(place(new THREE.BoxGeometry(4, H * 0.6, 4.5 * n), L * 0.18 + sg * 15, H * 0.3, dep / 2 + 4.5 * n / 2 + 4, 0, Math.atan2(H, 4.5 * n) * 0, 0)); }
  return S.map((g) => { g.rotateY(rotY); g.translate(x, y0, z); return g; });
}

// --------------------------------------------------------------- aqueduct (two arcaded tiers + channel)
export function arcadeBay(P, H, Dp, archW, archH) {
  const s = new THREE.Shape(); s.moveTo(-P / 2, 0); s.lineTo(P / 2, 0); s.lineTo(P / 2, H); s.lineTo(-P / 2, H); s.closePath();
  const hole = new THREE.Path(); const r = archW / 2, sh = archH - r;
  hole.moveTo(-r, 0); hole.lineTo(-r, sh); hole.absarc(0, sh, r, Math.PI, 0, true); hole.lineTo(r, 0); hole.closePath();
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: Dp, bevelEnabled: false, curveSegments: 14 }); g.translate(0, 0, -Dp / 2);
  // voussoir ring + impost blocks
  const ring = new THREE.Shape(); ring.absarc(0, sh, r + 3.2, 0, Math.PI, false); ring.lineTo(-r, sh); ring.absarc(0, sh, r, Math.PI, 0, true); ring.closePath();
  const rg = new THREE.ExtrudeGeometry(ring, { depth: Dp + 1.6, bevelEnabled: false, curveSegments: 14 }); rg.translate(0, 0, -(Dp + 1.6) / 2);
  const parts = [g, rg];
  for (const sg of [-1, 1]) parts.push(place(new THREE.BoxGeometry(6, 2.5, Dp + 2), sg * (r + 1), sh - 1.25, 0));
  parts.push(place(new THREE.BoxGeometry(P, 2.2, Dp + 2.5), 0, H - 1.1, 0)); // string course
  return bake(parts);
}
export function aqueductGeo({ x0, x1, z, yb, yt, P = 56 }) {
  const out = []; const H1 = (yt - yb) * 0.58, H2 = (yt - yb) * 0.3, H3 = (yt - yb) - H1 - H2;
  const b1 = arcadeBay(P, H1, 16, P * 0.62, H1 * 0.78), b2 = arcadeBay(P / 2, H2, 12, P * 0.3, H2 * 0.74);
  for (let x = x0 + P / 2; x < x1; x += P) {
    out.push(place(b1, x, yb, z)); out.push(place(b2, x - P / 4, yb + H1, z)); out.push(place(b2, x + P / 4, yb + H1, z));
    out.push(place(new THREE.BoxGeometry(P, H3 * 0.55, 14), x, yb + H1 + H2 + H3 * 0.275, z));
    for (const sg of [-1, 1]) out.push(place(new THREE.BoxGeometry(P - 0.6, H3 * 0.45, 2.6), x, yb + H1 + H2 + H3 * 0.775, z + sg * 5.7));
  }
  return out;
}

// --------------------------------------------------------------- voxel strata (sea stacks, hills)
const SAND = [0xc9, 0xb3, 0x8c], ROCK = [0xb3, 0x9f, 0x80], ROCKD = [0x8a, 0x77, 0x60], GRASS = [0x5e, 0x9a, 0x2c], GRASS2 = [0x7f, 0xb8, 0x40];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** strata colour at height y (bands every ~band units with per-band tone) */
function strataCol(x, y, z, seed, band = 7) {
  const b = Math.floor(y / band); const tone = vnoise(b * 0.77, seed, 3); const streak = vnoise(x * 0.05 + z * 0.05, y * 0.01, seed + 5);
  let c = mix3(ROCK, ROCKD, Math.min(1, Math.max(0, 0.15 + 0.6 * tone + 0.35 * (streak - 0.5))));
  if (vnoise(b * 1.3, 7, seed) > 0.72) c = mix3(c, SAND, 0.55);   // pale sandstone beds
  return c;
}
/**
 * Voxel sea stack / islet: a stratified rock column with ledges, a grassy cap, optional top platform.
 * Returns { geo (vertex-coloured, for rockMat), top }.
 */
export function seaStackGeo({ x, z, r = 70, top = 60, base = -215, v = 4, seed = 1 }) {
  const R = Math.ceil(r * 1.5 / v) + 1, nx = 2 * R + 1, nz = nx, ny = Math.ceil((top - base) / v) + 2;
  const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3);
  for (let j = 0; j < ny; j++) { const y = base + (j + 0.5) * v; if (y > top) break; const t = (y - base) / (top - base);
    const band = Math.floor((y - base) / (v * 3)); const ledge = 1 + 0.12 * (vnoise(band * 0.9, seed, 1) - 0.5) * 2;
    for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
      const lx = (i - R) * v, lz = (k - R) * v, a = Math.atan2(lz, lx), d = Math.hypot(lx, lz);
      const rr = r * ledge * (1.12 - 0.25 * t + 0.08 * Math.sin(t * 3 + seed)) * (0.78 + 0.34 * fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6 + band * 0.07, 3, seed));
      if (d > rr) continue; const idx = i + nx * (j + ny * k); occ[idx] = 1;
      let c = y > top - v * 1.5 ? mix3(GRASS, GRASS2, vnoise(lx * 0.08, lz * 0.08, seed)) : strataCol(x + lx, y, z + lz, seed);
      if (y < -192) c = mix3(SAND, c, 0.4);
      col[idx * 3] = c[0]; col[idx * 3 + 1] = c[1]; col[idx * 3 + 2] = c[2];
    } }
  const geo = meshVoxelGrid({ nx, ny, nz, occ, col }, { s: v, origin: [x - (R + 0.5) * v, base, z - (R + 0.5) * v], ao: 0.35 });
  return { geo, top };
}

/**
 * Stepped voxel strata over the inland hills (z < -430): the smooth heightfield stays (W.groundY is the gameplay
 * ground), this layer sits on it as terraced rock ledges and grassy shelves (k07 cliffs). Cells only where the
 * quantised terrain stands above the smooth one, so the meadow near the action is untouched.
 */
export function hillStrataGeo({ x0, x1, z0, z1, v = 5, step = 10, seed = 1 }) {
  const nx = Math.ceil((x1 - x0) / v), nz = Math.ceil((z1 - z0) / v);
  const hs = new Float32Array(nx * nz); let hmax = -1e9, hmin = 1e9;
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) { const x = x0 + (i + 0.5) * v, z = z0 + (k + 0.5) * v; const h = groundY(x, z); hs[i + nx * k] = h; hmax = Math.max(hmax, h); hmin = Math.min(hmin, h); }
  const yb = Math.floor((hmin - 12) / v) * v; const ny = Math.ceil((hmax + step + 4 - yb) / v);
  const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3);
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
    const x = x0 + (i + 0.5) * v, z = z0 + (k + 0.5) * v; const h = hs[i + nx * k];
    const fade = Math.min(1, Math.max(0, (-z - 430) / 120)); if (fade <= 0) continue;
    // slope decides cliff vs shelf: steep ground -> exposed stratified faces, gentle -> grass shelves
    const hx = hs[Math.min(nx - 1, i + 1) + nx * k] - hs[Math.max(0, i - 1) + nx * k], hz = hs[i + nx * Math.min(nz - 1, k + 1)] - hs[i + nx * Math.max(0, k - 1)];
    const slope = Math.hypot(hx, hz) / (2 * v);
    const st = step * (0.8 + 0.5 * vnoise(x * 0.004, z * 0.004, seed));
    const q = Math.ceil((h + 2) / st) * st + 2 * (vnoise(x * 0.03, z * 0.03, seed + 2) - 0.5) * v; // terraced top
    const topY = Math.min(q, h + st * fade + 2);
    if (topY <= h - v) continue;
    const jt = Math.floor((topY - yb) / v);
    const jb = Math.max(0, Math.floor((h - 10 - yb) / v));
    for (let j = jb; j <= jt && j < ny; j++) {
      const y = yb + (j + 0.5) * v; const idx = i + nx * (j + ny * k); occ[idx] = 1;
      let c = mix3(strataCol(x, y, z, seed, 6), SAND, 0.25);
      if ((j === jt && slope < 1.6) || (j === jt - 1 && slope < 0.35)) c = mix3(GRASS, GRASS2, vnoise(x * 0.02, z * 0.02, seed + 3)).map((u) => u * (0.85 + 0.2 * vnoise(x * 0.2, z * 0.2, 9)));
      col[idx * 3] = c[0]; col[idx * 3 + 1] = c[1]; col[idx * 3 + 2] = c[2];
    }
  }
  return meshVoxelGrid({ nx, ny, nz, occ, col }, { s: v, origin: [x0, yb, z0], ao: 0.2 });
}

// --------------------------------------------------------------- the whole layer
/**
 * Build the density layer. ctx = { scene, sun (SUN_DIR), SEA_Y, MESA_A, MESA_B }.
 * Returns { group, temples: [{ x, z, top }], stacks } (handles for debugging / future props).
 */
export function buildDetail({ scene, sun, SEA_Y = -200 }) {
  const t0 = performance.now();
  const group = new THREE.Group(); group.name = 'density'; scene.add(group);
  const stone = stoneMat('#efe3cc'), dark = stoneMat('#d8c7a6', PL.clay), roof = stoneMat('#c47a58', PL.roof, 0.3), rock = rockMat();
  const S = [], D = [], RF = [], R = [];
  const temples = [];
  const safe = (x, z, want) => Math.min(want, sunSafeH(x, z, sun));
  // --- temples on the inland hills / meadow edge (fronts face -x, toward the camera coming down the causeway)
  const T = [
    { x: 1500, z: -760, nf: 6, ns: 13, sp: 34, h: 120, rotY: 0, ruin: 0, seed: 11 },
    { x: 2350, z: -640, nf: 6, ns: 11, sp: 30, h: 100, rotY: 0.2, ruin: 0.6, seed: 12 },
    { x: 720, z: -980, nf: 8, ns: 15, sp: 32, h: 115, rotY: -0.15, ruin: 0, seed: 13 },
    { x: 3300, z: -900, nf: 6, ns: 13, sp: 34, h: 120, rotY: 0.1, ruin: 0, seed: 14 },
    { x: -150, z: -820, nf: 6, ns: 9, sp: 30, h: 100, rotY: -0.4, ruin: 0.5, seed: 15 },
  ];
  for (const p of T) {
    const y = groundY(p.x, p.z) + 6;
    const hMax = safe(p.x, p.z, 1e9) - y; const h = Math.max(50, Math.min(p.h, hMax - 70));
    const tg = templeGeo({ ...p, y, h, r: h / 16, rotY: p.rotY });
    tg.stone.forEach((g) => S.push(g)); tg.dark.forEach((g, i) => (i >= tg.dark.length - 1 && p.ruin < 0.5 ? RF : D).push(g));
    temples.push({ x: p.x, z: p.z, top: tg.top });
    // platform terrace under each temple (fills the slope)
    terraceGeo({ x: p.x, z: p.z, y0: y - 30, y1: y, L: (p.ns + 1) * p.sp + 70, D: (p.nf + 1) * p.sp + 60, rotY: p.rotY + Math.PI / 2 * 0, seed: p.seed + 50, stair: true }).forEach((g) => D.push(g));
  }
  // --- terraced retaining walls climbing the hills between the temples
  const TR = [[1100, -600, 260, 22], [1180, -660, 200, 18], [1950, -560, 300, 20], [2050, -620, 220, 24], [400, -700, 240, 20], [2800, -700, 260, 22], [3000, -760, 200, 26]];
  TR.forEach(([x, z, L, H], i) => { const y = groundY(x, z); terraceGeo({ x, z, y0: y - 4, y1: y + Math.min(H, safe(x, z, 1e9) - y - 4), L, D: 70, seed: 200 + i }).forEach((g) => D.push(g)); });
  // --- aqueduct over the sea, parallel to the causeway beyond mesa B (top below the causeway: never shadows it)
  aqueductGeo({ x0: 1620, x1: 3900, z: 175, yb: SEA_Y - 8, yt: -14, P: 58 }).forEach((g) => S.push(g));
  // --- sea stacks with small ruins on top (mid-ground density for the mesa / stage shots)
  const ST = [[3960, 175, 70, -10], [2200, 880, 90, 40], [2900, 640, 60, 10], [1700, 1250, 110, 70], [-250, 760, 80, 20], [600, 1150, 95, 55], [3400, 1300, 120, 90], [1150, 1500, 70, 30]];
  const stacks = [];
  ST.forEach(([x, z, r, top], i) => { const s = seaStackGeo({ x, z, r, top, base: SEA_Y - 15, v: 4, seed: 300 + i }); R.push(s.geo); stacks.push({ x, z, top });
    if (i % 2 === 0) { const tg = templeGeo({ x, z, y: top, nf: 4, ns: 6, sp: r * 0.32, h: r * 0.9, r: r * 0.055, rotY: i * 0.7, ruin: i === 0 ? 0 : 0.45, seed: 400 + i }); tg.stone.forEach((g) => S.push(g)); tg.dark.forEach((g) => D.push(g)); }
    else for (let k = 0; k < 5; k++) { const a = k * 1.256 + i, rr = r * 0.45; const { geo } = columnGeo({ h: r * (0.6 + 0.3 * ((k * 7) % 3)), r: r * 0.06, broken: k % 2, seed: 500 + i * 10 + k }); geo.translate(x + Math.cos(a) * rr, top, z + Math.sin(a) * rr); S.push(geo); } });
  // --- a stoa down the causeway toward the monument (colonnade + ashlar back wall + roof), some bays fallen
  { const z = -96, rs = mulberry32(91); let run = [];
    const flush = () => { if (run.length > 1) { const xa = run[0].x, xb = run[run.length - 1].x; const e = entablatureGeo(xb - xa + 30, 30, 30, { tri: 21 }); e.translate((xa + xb) / 2, run[0].y, z); S.push(e);
      const rf = roofGeo(70, xb - xa + 34, 16); rf.rotateY(Math.PI / 2); rf.translate((xa + xb) / 2, run[0].y + 30, z - 30); RF.push(rf); } run = []; };
    for (let x = 1660, k = 0; x <= 2480; x += 42, k++) { const r = rs(); const y = groundY(x, z);
      if (r < 0.1) { flush(); continue; } const broken = r < 0.3;
      const { geo, top } = columnGeo({ h: 150, r: 8.5, broken: broken ? 1 : 0, seed: 600 + k }); geo.translate(x, y, z); S.push(geo);
      if (broken) flush(); else run.push({ x, y: y + top }); }
    flush();
    const wall = ashlarGeo(840, 120, 10, { bw: 30, bh: 12, seed: 95 }); wall.translate(2070, groundY(2070, -160) - 2, -160); D.push(wall);
    for (let k = 0; k < 3; k++) { const st = ashlarGeo(860 - k * 8, 4, 110 - k * 10, { bw: 40, bh: 4, gap: 0.5, seed: 96 + k, jitter: 0 }); st.translate(2070, groundY(2070, -120) - 9 + k * 4, -125); D.push(st); } }
  // --- a low terrace wall with stairs behind the colonnade's back row, and a ruined triumphal arch
  terraceGeo({ x: 780, z: -265, y0: groundY(780, -265) - 3, y1: groundY(780, -265) + 16, L: 900, D: 40, seed: 120 }).forEach((g) => D.push(g));
  { const ax = 1480, az = -270, ay = groundY(ax, az) - 2; const H = Math.min(150, safe(ax, az, 1e9) - ay - 2), Wd = 120, P = 26;
    const sh = new THREE.Shape(); sh.moveTo(-Wd / 2, 0); sh.lineTo(Wd / 2, 0); sh.lineTo(Wd / 2, H); sh.lineTo(-Wd / 2, H); sh.closePath();
    const r = Wd / 2 - P, hole = new THREE.Path(); hole.moveTo(-r, 0); hole.lineTo(-r, H * 0.62 - r); hole.absarc(0, H * 0.62 - r, r, Math.PI, 0, true); hole.lineTo(r, 0); hole.closePath(); sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 34, bevelEnabled: false, curveSegments: 16 }); g.translate(0, 0, -17);
    const attic = new THREE.BoxGeometry(Wd + 8, 6, 40); attic.translate(0, H * 0.78, 0);
    const parts = [g, attic]; for (const sx of [-1, 1]) { const c = columnGeo({ h: H * 0.62, r: 4.5, seed: 700 + sx, plinth: true }).geo; c.translate(sx * (Wd / 2 - 13), 0, 19); parts.push(c); }
    const arch = bake(parts); arch.rotateY(Math.PI / 2 - 0.3); arch.translate(ax, ay, az); S.push(arch);
    // its fallen attic blocks
    for (let k = 0; k < 4; k++) { const b = new THREE.BoxGeometry(22 + 8 * k, 10, 14); b.rotateY(k * 1.3); b.rotateZ(0.08 * k); b.translate(ax + 40 + 18 * k, groundY(ax + 40, az + 20) + 3, az + 30 - 9 * k); D.push(b); } }
  // --- scattered fallen drums / column stumps on the meadow edge (low: never shadow the strip)
  { const rr = mulberry32(131); for (let k = 0; k < 26; k++) { const x = 1250 + rr() * 1500, z = -60 - rr() * 260; if (Math.abs(x - 1480) < 90 && Math.abs(z + 270) < 70) continue;
      if (rr() < 0.5) { const { geo } = columnGeo({ h: 20 + 40 * rr(), r: 7 + 3 * rr(), broken: 1, seed: 800 + k }); geo.translate(x, groundY(x, z) - 1, z); S.push(geo); }
      else { const d = new THREE.CylinderGeometry(8, 8, 22, 20); d.rotateZ(Math.PI / 2); d.rotateY(rr() * 3); d.translate(x, groundY(x, z) + 7, z); D.push(d); } } }
  // --- rows of voxel cypresses (processional avenues to the temples, groves on terraces, pairs at the great gate)
  const CY = []; const rc = mulberry32(77);
  const tree = (x, z, h) => { const y = groundY(x, z); const hh = Math.min(h, safe(x, z, 1e9) - y - 2); if (hh < 40) return; const g = voxelCypressGeo(hh, 1000 + CY.length, hh > 150 ? 2.5 : 2); g.rotateY(rc() * 6.28); g.translate(x, y - 2, z); CY.push(g); };
  const row = (xa, za, xb, zb, n, h0, h1) => { for (let k = 0; k < n; k++) { const u = n > 1 ? k / (n - 1) : 0; tree(xa + (xb - xa) * u + (rc() - 0.5) * 6, za + (zb - za) * u + (rc() - 0.5) * 6, h0 + (h1 - h0) * rc()); } };
  row(1290, -300, 1380, -650, 8, 110, 150); row(1350, -290, 1440, -640, 8, 110, 150);           // avenue to temple 1
  row(1620, -430, 2650, -470, 13, 95, 140);                                                    // hedge-line along the hill foot
  row(560, -420, 980, -460, 7, 100, 140);                                                      // behind the colonnade
  for (const [x, z] of [[985, -335], [1115, -335]]) tree(x, z, 135);                          // the great gate
  for (const t of T) for (let k = 0; k < 6; k++) { const a = rc() * 6.28, d = (t.ns * t.sp) * (0.6 + 0.25 * rc()); tree(t.x + Math.cos(a) * d, t.z + Math.sin(a) * d * 0.6, 90 + 60 * rc()); }
  row(2900, -560, 3600, -640, 9, 100, 150); row(-500, -520, 200, -560, 9, 100, 150);
  if (CY.length) { const cm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }); cm.userData.plaster = PL.clay; group.add(meshOf(mergeGeometries(CY), cm)); }
  // --- stepped strata over the inland hills
  const hill = hillMat();
  group.add(meshOf(hillStrataGeo({ x0: -900, x1: 4200, z0: -1700, z1: -430, v: 5, step: 11, seed: 21 }), hill));
  group.add(meshOf(hillStrataGeo({ x0: -1500, x1: 4800, z0: -3600, z1: -1690, v: 8, step: 20, seed: 22 }), hill));

  group.add(meshOf(bake(S), stone), meshOf(bake(D), dark));
  for (const g of R) group.add(meshOf(g, rock));
  if (RF.length) group.add(meshOf(bake(RF), roof));
  console.log(`[engine] [act3] density layer built in ${Math.round(performance.now() - t0)} ms`);
  return { group, temples, stacks, mats: { stone, dark, roof, rock, hill } };
}
