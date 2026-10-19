// ACT III shot COMPOSITION layer (density team, phase 2): the k07 recipe per camera, not just scattered buildings.
//   - floating ink-stroke sculptures in the sky (丿 丶 一 as monumental voxel stone, dry-brush ends, a broken tail):
//     placed from the logged cameras of 81.8 / 88.0 / 101.5 / 108.0; their sun-shadow footprints land in the sea or the far
//     meadow, never on the causeway / mesas. Plaster until the flood, graphite ink after it.
//   - a ruined two-tier sea arcade under the causeway edge (top below the strip: foreground framing in the turn shots)
//   - causeway parapets (ashlar, broken) shown only in WIDE shots (camera high or far), so low hero shots stay clear
//   - the far islands as stratified voxel islands with temples and cypress groves (replace the smooth blobs)
//   - per-shot framing pieces, time-gated to the shot ranges measured from the cameras (shots: see SHOTS below)
// update(t, camera) is called by applyLook every frame (pure function of t + camera). Nothing here is a gameplay anchor.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, vnoise, fbm } from '../../../util.js';
import { meshVoxelGrid, distToEdge8 } from '../../../voxel.js';
import { columnGeo, entablatureGeo, ashlarGeo, bake, place } from '../../../world.js';
import { triplanarMaterial, rockTexture, grassTexture } from '../../../materials.js';
import { marbleTexture } from './props.js';
import { templeGeo, voxelCypressGeo, arcadeBay } from './detail.js';

const PL = { stone: 0xf4efe6, ink: 0xece4d4, rock: 0xd9ccb4, meadow: 0xe6dcc8, clay: 0xe2d6c0 };
const ACT3_END = 123.354;
function stoneMat(color = '#efe3cc', plaster = PL.stone) { const m = triplanarMaterial({ tex: marbleTexture(), scale: 0.02, bump: 0.5, color, roughness: 0.72 }); m.userData.plaster = plaster; return m; }
const meshOf = (geo, mat, cast = true) => { const o = new THREE.Mesh(geo, mat); o.castShadow = cast; o.receiveShadow = true; return o; };

// --------------------------------------------------------------- ink strokes
/**
 * Rasterise a calligraphy stroke into a voxel slab. kind: 'pie' (丿), 'dian' (丶), 'heng' (一). Returns
 * { parts: [geo...] (main + broken tail), size } in voxel units of v, centred on the stroke's bounding box.
 */
function strokeGeos(kind, v, seed) {
  const rnd = mulberry32(seed);
  // centreline samples [x, y, w] in voxel units (y up)
  const P = [];
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const t = i / N; let x, y, w;
    if (kind === 'pie') { const a = [86, 104], b = [60, 46], c = [0, 0]; x = (1 - t) ** 2 * a[0] + 2 * t * (1 - t) * b[0] + t * t * c[0]; y = (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * b[1] + t * t * c[1];
      w = 23 * (1 - 0.9 * Math.pow(t, 1.25)) + (t < 0.1 ? 7 * (1 - t / 0.1) : 0); }
    else if (kind === 'heng') { x = 136 * t; y = 7 * Math.sin(Math.PI * t) - 3 * t; w = 15 + (t < 0.1 ? 7 * (1 - t / 0.1) : 0) + (t > 0.85 ? 12 * Math.sin(Math.PI * (t - 0.85) / 0.15) : 0);
      if (t > 0.93) { y -= (t - 0.93) / 0.07 * 9; x -= (t - 0.93) / 0.07 * 3; } }
    else { x = 14 * t + 2 * Math.sin(t * 3); y = 34 * (1 - t); w = 3 + 15 * Math.pow(t, 0.7) * (t > 0.85 ? 1 - (t - 0.85) * 2.5 : 1); }
    P.push([x, y, w, t]);
  }
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y, w] of P) { x0 = Math.min(x0, x - w); x1 = Math.max(x1, x + w); y0 = Math.min(y0, y - w); y1 = Math.max(y1, y + w); }
  const pad = 2, W = Math.ceil(x1 - x0) + 2 * pad, H = Math.ceil(y1 - y0) + 2 * pad;
  const mask = new Uint8Array(W * H), T = new Float32Array(W * H).fill(-1), Dd = new Float32Array(W * H).fill(1e9), Sg = new Float32Array(W * H);
  for (let i = 0; i < P.length; i++) {
    const [x, y, w, t] = P[i]; const nx = i < P.length - 1 ? P[i + 1][0] - x : x - P[i - 1][0], ny = i < P.length - 1 ? P[i + 1][1] - y : y - P[i - 1][1]; const nl = Math.hypot(nx, ny) || 1;
    const r = w / 2 + 1.5;
    for (let gy = Math.floor(y - r - y0 + pad); gy <= Math.ceil(y + r - y0 + pad); gy++) for (let gx = Math.floor(x - r - x0 + pad); gx <= Math.ceil(x + r - x0 + pad); gx++) {
      if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
      const px = gx + 0.5 + x0 - pad, py = gy + 0.5 + y0 - pad, dx = px - x, dy = py - y; const d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx); const rr = (w / 2) * (0.9 + 0.2 * vnoise(Math.cos(ang) * 2 + i * 0.03, Math.sin(ang) * 2, seed));
      if (d > rr) continue; const k = gy * W + gx; mask[k] = 1;
      if (d < Dd[k]) { Dd[k] = d; T[k] = t; Sg[k] = (dx * -ny + dy * nx) / nl / Math.max(1, w / 2); }
    }
  }
  // dry brush: streaks along the stroke in the tail (and the 一's press end)
  const dryFrom = kind === 'pie' ? 0.62 : kind === 'heng' ? 0.9 : 2;
  for (let k = 0; k < W * H; k++) { if (!mask[k] || T[k] < dryFrom) continue; const a = (T[k] - dryFrom) / (1 - dryFrom);
    const st = (Sg[k] * 4.2 + 0.25 * vnoise(T[k] * 40, Sg[k] * 3, seed)) % 1; if (Math.abs(st) < a * 0.55 || (a > 0.7 && rnd() < (a - 0.7) * 0.8)) mask[k] = 0; }
  const dist = distToEdge8(mask, W, H);
  const maxHalf = kind === 'dian' ? 6 : 5;
  // slab profile (cut stone): full thickness inside, a 2-3 voxel bevel at the rim, chipped by noise
  const halfAt = (k) => Math.max(1, Math.min(maxHalf, Math.round(maxHalf * Math.min(1, 0.35 + dist[k] / 3.2) - (vnoise((k % W) * 0.21, Math.floor(k / W) * 0.21, seed) > 0.72 ? 1 : 0))));
  const NZ = 2 * maxHalf + 2;
  // break the 丿 tail off along a jagged cut
  const cut = (k) => kind === 'pie' ? 0.83 + 0.04 * Math.sin(Sg[k] * 5 + seed) : 9;
  const build = (sel) => {
    const occ = new Uint8Array(W * H * NZ), col = new Uint8Array(W * H * NZ * 3); let any = false;
    for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) { const k = gy * W + gx; if (!mask[k] || !sel(k)) continue; const h = halfAt(k);
      for (let z = maxHalf + 1 - h; z < maxHalf + 1 + h; z++) { const n = gx + W * (gy + H * z); occ[n] = 1; any = true;
        // full colour = graphite ink: deep core, lighter rim, pale dry streaks; a faint sheen band
        const rim = Math.min(1, Math.max(0, 1 - dist[k] / 5)), dry = T[k] > dryFrom ? 0.4 : 0;
        const g = 40 + 34 * rim + 60 * dry + 14 * vnoise(gx * 0.3, gy * 0.3, z * 0.5 + seed);
        col[n * 3] = g; col[n * 3 + 1] = g; col[n * 3 + 2] = g + 8; } }
    return any ? meshVoxelGrid({ nx: W, ny: H, nz: NZ, occ, col }, { s: v, origin: [-W * v / 2, -H * v / 2, -(maxHalf + 1) * v], ao: 0.3 }) : null;
  };
  const parts = [build((k) => T[k] <= cut(k))]; const tail = build((k) => T[k] > cut(k)); if (tail) parts.push(tail);
  // where the tail broke (for offsetting it): the centreline point at the cut
  const ci = P.find((p) => p[3] >= 0.83) || P[P.length - 1];
  return { parts, size: [W * v, H * v], cutAt: [(ci[0] - x0 + pad - W / 2) * v, (ci[1] - y0 + pad - H / 2) * v], tailDir: [-0.74, -0.67] };
}

// --------------------------------------------------------------- voxel islands
const SAND = [0xd2, 0xbc, 0x92], ROCK = [0xae, 0x9a, 0x7c], ROCKD = [0x86, 0x74, 0x5e], GRASS = [0x5e, 0x9a, 0x2c], GRASS2 = [0x7f, 0xb8, 0x40];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function islandGeo({ x, z, R, H, v, seed, seaY }) {
  const n = Math.ceil(R * 1.25 / v), nx = 2 * n + 1, nz = nx; const base = seaY - 30; const ny = Math.ceil((H + 40) / v) + 2;
  const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3); const step = Math.max(2, Math.round(H / v / 9));
  let peak = { h: -1e9, x: 0, z: 0 };
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
    const lx = (i - n) * v, lz = (k - n) * v; const r = Math.hypot(lx, lz) / R, a = Math.atan2(lz, lx);
    const edge = 1 + 0.28 * (fbm(Math.cos(a) * 1.4 + seed, Math.sin(a) * 1.4, 3, seed) - 0.5) * 2; const rr = r / edge; if (rr > 1) continue;
    let h = H * Math.pow(1 - rr * rr, 0.7) * (0.65 + 0.55 * fbm(lx / R * 1.6 + seed, lz / R * 1.6, 4, seed + 3));
    if (rr > 0.86) h = Math.min(h, H * 0.18 * (1 - (rr - 0.86) / 0.14) + 6);              // sea cliffs at the rim
    const hv = Math.round(h / v); const q = Math.max(1, Math.floor(hv / step) * step + (hv % step > step * 0.6 ? step : 0)); // terraces
    const top = Math.round((seaY - base) / v) + q;
    if (seaY + q * v > peak.h && rr < 0.5) peak = { h: seaY + q * v, x: x + lx, z: z + lz };
    for (let j = 0; j <= Math.min(ny - 1, top); j++) { const y = base + (j + 0.5) * v; const idx = i + nx * (j + ny * k); occ[idx] = 1;
      const bed = Math.floor(y / (v * 1.5)); let c = mix3(ROCK, ROCKD, Math.min(1, Math.max(0, 0.2 + 0.6 * vnoise(bed * 0.7, seed, 2) + 0.3 * (vnoise(lx * 0.02, y * 0.02, seed) - 0.5))));
      if (vnoise(bed * 1.3, 4, seed) > 0.7) c = mix3(c, SAND, 0.5);
      if (j === top && rr < 0.92) c = mix3(GRASS, GRASS2, vnoise(lx * 0.01, lz * 0.01, seed + 5));
      if (y < seaY + 10) c = mix3(SAND, c, 0.3);
      col[idx * 3] = c[0]; col[idx * 3 + 1] = c[1]; col[idx * 3 + 2] = c[2]; }
  }
  return { geo: meshVoxelGrid({ nx, ny, nz, occ, col }, { s: v, origin: [x - (n + 0.5) * v, base, z - (n + 0.5) * v], ao: 0.25 }), peak };
}

// --------------------------------------------------------------- the layer
/** shot ranges measured from the logged cameras (engine/checkpoints/density.md); dressing is visible only inside them */
export const SHOTS = { s88: [87.845, 89.945], s101: [101.01, 102.245], s108a: [107.14, 108.675], s108b: [109.645, 110.405] };
const inShot = (t, ...ks) => ks.some((k) => t >= SHOTS[k][0] && t < SHOTS[k][1]);

export function buildCompose({ scene, sun, SEA_Y = -200, islandsOld }) {
  const t0 = performance.now(); const root = new THREE.Group(); root.name = 'compose'; scene.add(root);
  const stone = stoneMat('#efe3cc'), dark = stoneMat('#d8c7a6', PL.clay);
  const inkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05 }); inkMat.userData.plaster = PL.ink;
  // ---- floating ink strokes (positions from the 81.8 / 88 / 101.5 / 108 cameras; see the header)
  const strokes = new THREE.Group(); strokes.name = 'inkStrokes'; scene.add(strokes);
  const ST = [
    // solved from target screen spots (scratch solver, see checkpoint): 丿 + 丶 over the 81.8 vanishing point, ㇏ in the 101.5 sky,
    // 一 over the sea in the 108 stage shot. Sun-shadow footprints: (-421,211) sea, (92,281) sea, (453,-559) far meadow, (230,1442) sea.
    { kind: 'pie', v: 6.0, pos: [2317, 367, -354], rotY: -1.36, rotZ: 0.04, seed: 31 },
    { kind: 'dian', v: 6.8, pos: [2646, 342, -245], rotY: -1.42, rotZ: 0.1, seed: 32 },
    { kind: 'pie', v: 6.0, pos: [3154, 362, -1116], rotY: -0.98, rotZ: -0.04, seed: 34, mirror: true },
    { kind: 'heng', v: 6.4, pos: [2804, 345, 911], rotY: -1.84, rotZ: 0.05, seed: 33 },
  ];
  for (const S of ST) {
    const g = new THREE.Group(); const { parts, cutAt, tailDir } = strokeGeos(S.kind, S.v, S.seed);
    parts.forEach((geo, i) => { const m = meshOf(geo, inkMat); if (i === 1) { m.position.set(tailDir[0] * 6 * S.v, tailDir[1] * 6 * S.v, 0); m.rotation.z = -0.05; } g.add(m); });
    g.position.set(...S.pos); g.rotation.set(0, S.rotY, S.rotZ); if (S.mirror) g.scale.x = -1; strokes.add(g);
    // floating debris around the stroke (broken stone bits)
    const rr = mulberry32(S.seed + 9); const bits = [];
    for (let k = 0; k < 7; k++) { const b = new THREE.BoxGeometry(S.v * (1 + rr() * 2), S.v * (1 + rr() * 1.5), S.v * (1 + rr() * 1.5)); b.rotateX(rr() * 3); b.rotateY(rr() * 3);
      b.translate(cutAt[0] + tailDir[0] * S.v * (8 + rr() * 30) + (rr() - 0.5) * 40, cutAt[1] + tailDir[1] * S.v * (8 + rr() * 30) + (rr() - 0.5) * 40, (rr() - 0.5) * 30); bits.push(b); }
    if (S.kind !== 'dian') { const bm = meshOf(mergeGeometries(bits.map((b) => { b.deleteAttribute('uv'); const c = new Float32Array(b.attributes.position.count * 3).fill(0.05); b.setAttribute('color', new THREE.BufferAttribute(c, 3)); return b; })), inkMat); g.add(bm); }
  }
  // ---- ruined sea arcade under the causeway's sea edge (top y -4: below the strip, never shadows it)
  { const S = [], rnd = mulberry32(51); const P = 50, z = 118, yb = SEA_Y - 8, yt = -4, H1 = (yt - yb) * 0.62, H2 = (yt - yb) - H1;
    const b1 = arcadeBay(P, H1, 14, P * 0.6, H1 * 0.8), b2 = arcadeBay(P / 2, H2, 11, P * 0.3, H2 * 0.72);
    for (let x = 140 + P / 2; x < 1040; x += P) { const r = rnd(); if (r < 0.12) continue; S.push(place(b1, x, yb, z));
      if (r > 0.3) { S.push(place(b2, x - P / 4, yb + H1, z)); if (r > 0.45) S.push(place(b2, x + P / 4, yb + H1, z)); } }
    root.add(meshOf(bake(S), dark)); }
  // ---- causeway parapets (WIDE shots only): broken ashlar walls on both edges, coping, posts
  const parapet = new THREE.Group(); parapet.name = 'parapets'; scene.add(parapet);
  { const S = [], rnd = mulberry32(61);
    for (const z of [-26.5, 26.5]) for (let x = -380; x < 4380; x += 96) { if (rnd() < 0.14) continue; const L = 96 - 2 - (rnd() < 0.2 ? 30 * rnd() : 0);
      const w = ashlarGeo(L, 6.5, 3.2, { bw: 9, bh: 3.2, gap: 0.45, seed: Math.floor(x) + (z > 0 ? 7 : 0), jitter: 0.3 }); w.translate(x + L / 2, -0.5, z); S.push(w);
      S.push(place(new THREE.BoxGeometry(L + 1, 1.2, 4.4), x + L / 2, 6.6, z)); S.push(place(new THREE.BoxGeometry(5, 9, 5), x + 1, 4, z)); }
    parapet.add(meshOf(bake(S), stone)); }
  // ---- far islands: stratified voxel islands with temples + cypress groves (the old smooth blobs are hidden)
  if (islandsOld) islandsOld.visible = false;
  const isl = new THREE.Group(); isl.name = 'islands3'; scene.add(isl);
  { const rockM = triplanarMaterial({ tex: rockTexture(), scale: 0.006, bump: 0.5, roughness: 0.95, vertexColors: true }); rockM.color.setScalar(1.35); rockM.userData.plaster = PL.rock;
    const spots = [[5200, 2600, 900], [7600, 600, 1400], [3800, 4800, 700], [9000, -2200, 1800], [2600, 6400, 500], [12000, 3000, 2600], [4300, 1500, 420], [6200, -900, 650]];
    const T = [], C = [];
    spots.forEach(([x, z, s], i) => { const { geo, peak } = islandGeo({ x, z, R: s * 0.85, H: s * 0.3, v: Math.max(10, Math.round(s / 60)), seed: 70 + i, seaY: SEA_Y }); isl.add(meshOf(geo, rockM, false));
      if (i % 2 === 0) { const k = s / 500; const tg = templeGeo({ x: peak.x, z: peak.z, y: peak.h, nf: 6, ns: 10, sp: 34 * k, h: 110 * k, r: 7 * k, rotY: i * 0.8, ruin: i === 4 ? 0.5 : 0, seed: 90 + i }); tg.stone.forEach((g) => T.push(g)); tg.dark.forEach((g) => T.push(g)); }
      const rc = mulberry32(80 + i); for (let k = 0; k < 7; k++) { const a = rc() * 6.28, d = s * (0.15 + 0.3 * rc()); const h = s * (0.13 + 0.06 * rc()); const g = voxelCypressGeo(h, 2000 + i * 10 + k, Math.max(3, h / 45)); g.translate(x + Math.cos(a) * d, peak.h - 4, z + Math.sin(a) * d); C.push(g); } });
    if (T.length) isl.add(meshOf(bake(T), stone, false));
    if (C.length) { const cm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }); cm.userData.plaster = PL.clay; isl.add(meshOf(mergeGeometries(C), cm, false)); } }
  isl.traverse((o) => { if (o.isMesh) o.userData.noAO = true; });   // far (5-12k) geometry: GTAO depth precision drew a screen-wide band at the horizon
  // ---- per-shot framing (time-gated)
  const D = {};
  const shot = (name, list, mat = stone) => { const g = new THREE.Group(); g.name = 'shot_' + name; g.add(meshOf(bake(list), mat)); g.visible = false; scene.add(g); D[name] = g; return g; };
  { // 88.0: a tall ruined sea column pair rising from the water at the right edge, a fallen architrave across them
    const L = []; for (const [x, z, h, br] of [[640, 104, 330, 0], [668, 130, 250, 1]]) { const { geo, top } = columnGeo({ h, r: 12, broken: br, seed: 1200 + x }); geo.translate(x, SEA_Y - 10, z); L.push(geo); if (!br) { const e = entablatureGeo(70, 36, 26, { tri: 22 }); e.rotateY(0.6); e.translate(x + 8, SEA_Y - 10 + top, z + 10); L.push(e); } }
    shot('s88', L); }
  { // 101.5: a broken column stump + a fallen drum in the left foreground on mesa A
    const L = []; const { geo } = columnGeo({ h: 64, r: 8, broken: 1, seed: 1301 }); geo.translate(838, 10, 352); L.push(geo);
    const d = new THREE.CylinderGeometry(7.5, 7.5, 20, 24); d.rotateZ(Math.PI / 2); d.rotateY(0.7); d.translate(852, 17, 372); L.push(d); shot('s101', L); }
  { // 108.0: an intact column with a fragment of entablature at the right edge of the stage shot
    const L = []; const { geo, top } = columnGeo({ h: 120, r: 8.5, seed: 1401 }); geo.translate(1272, 10, 512); L.push(geo); const e = entablatureGeo(54, 28, 22, { tri: 18 }); e.rotateY(0.25); e.translate(1262, 10 + top, 514); L.push(e); shot('s108', L); }
  console.log(`[engine] [act3] compose layer built in ${Math.round(performance.now() - t0)} ms`);
  const tmp = new THREE.Vector3();
  return {
    root, strokes, parapet, islands: isl, dressing: D,
    /** per frame (applyLook): parapets only in wide shots of Act III, framing pieces inside their shots */
    update(t, camera) {
      const act3 = t < ACT3_END;
      const cy = camera.position.y, dz = Math.abs(camera.position.z);
      parapet.visible = act3 && t >= 86.39 && (cy > 110 || dz > 350);
      D.s88.visible = act3 && inShot(t, 's88'); D.s101.visible = act3 && inShot(t, 's101'); D.s108.visible = act3 && inShot(t, 's108a', 's108b');
      return tmp;
    },
  };
}
