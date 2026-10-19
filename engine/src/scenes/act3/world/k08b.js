// k08b WORLD PASS (round 4, world_look unit): opt-in with render.js --look k08b, only for song time t >= 86.385.
// Without the flag build.js never imports anything from here that runs, so default renders are unchanged.
//
// What lives here (the material model itself is in paint.js K8_PAINT_GLSL, the sky in env.js, fog/shafts in look.js):
//   - ground at the heroes' density: voxel grass tufts (0.3-unit voxels = hero RES 2.5, ~240 voxels tall) on the causeway
//     (the drawn level: always coloured), mesa A (plaster until coloured; mirrors the old tufts' local paint so Jade's path
//     of colour still shows), mesa B's paver joints and rim, the meadow by the colonnade; voxel flowers on the causeway
//     verges and the meadow; a coarse far layer. Chunked InstancedMeshes, shown by camera distance (pure function of camera).
//   - per-frame light from the time-of-day table (look.js TOD): sun / sky fill / env colours, sun-side hero rim, PCSS
//     penumbra scale for the frame's shadow extent, DOF on story beats.
//   - W.colorMap: the "colour amount per region" hook for the k09 wave (see engine/checkpoints/world_look.md).
// Nothing here moves a gameplay anchor: all decoration, no collision, positions of every existing object untouched.
import * as THREE from 'three';
import { meshVoxelGrid } from '../../../voxel.js';
import { mulberry32, fbm } from '../../../util.js';
import { K8U, LOOKCFG } from '../../../env.js';
import { todAt, applyTod, k8On, r5On, r5Frame, r5Shot, r5SetFocusPoint } from '../../../look.js';
import { patchPaint, K8M } from './paint.js';

export const VOX = 0.3;   // ground voxel size = the heroes' voxel at RES 2.5 (native x1.3 ~69 units / 240)

// ------------------------------------------------------------------ voxel tuft / flower geometry (baked AO, sRGB vertex colours)
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, u) => a.map((x, i) => Math.round(x + (b[i] - x) * u));
function gridGeo(nx, ny, nz, fill, s, ao = 0.38) {
  const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3);
  fill((x, y, z, c) => { if (x < 0 || y < 0 || z < 0 || x >= nx || y >= ny || z >= nz) return; const i = x + nx * (y + ny * z); occ[i] = 1; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; });
  const g = meshVoxelGrid({ nx, ny, nz, occ, col }, { s, origin: [-nx * s / 2, 0, -nz * s / 2], ao });
  if (g.index) { const n = g.toNonIndexed(); g.dispose(); return n; }
  return g;
}
/** a grass tuft: a low mound + 5..9 blades, taller in the middle, dark base -> light tip */
export function tuftGeo(seed, s, pal, { w = 7, hMax = 10 } = {}) {
  const r = mulberry32(seed); const c = (w - 1) / 2;
  return gridGeo(w, hMax + 1, w, (put) => {
    const base = hex(pal[0]), mid = hex(pal[1]), tip = hex(pal[2]);
    for (let x = 0; x < w; x++) for (let z = 0; z < w; z++) { const d = Math.hypot(x - c, z - c); if (d < c * 0.75 && r() < 0.8) put(x, 0, z, mixc(base, mid, r() * 0.4)); }
    const nb = 5 + Math.floor(r() * 5);
    for (let b = 0; b < nb; b++) {
      const x = Math.round(c + (r() - 0.5) * (w - 1)), z = Math.round(c + (r() - 0.5) * (w - 1)); const d = Math.hypot(x - c, z - c) / (c + 0.5);
      const h = Math.max(2, Math.round((hMax * (0.45 + 0.55 * r())) * (1 - 0.55 * d)));
      let lx = x, lz = z; const lean = r() < 0.5 ? [Math.sign(x - c) || 1, 0] : [0, Math.sign(z - c) || 1];
      for (let y = 0; y < h; y++) { if (y > h * 0.6 && r() < 0.35) { lx += lean[0]; lz += lean[1]; } put(lx, y, lz, mixc(mixc(base, mid, Math.min(1, y / (h * 0.5))), tip, Math.max(0, (y - h * 0.5) / (h * 0.5)))); }
    }
  }, s);
}
/** a voxel flower: stem + leaf + a plus-shaped head with a yellow eye */
export function flowerGeo(seed, s, petal, { h = 9 } = {}) {
  const r = mulberry32(seed); const stem = hex('#4f8a2c'), leaf = hex('#6aa83a'), P = hex(petal), eye = hex('#ffd23f');
  return gridGeo(5, h + 3, 5, (put) => {
    const hh = h - Math.floor(r() * 3);
    for (let y = 0; y < hh; y++) put(2, y, 2, stem);
    put(r() < 0.5 ? 1 : 3, Math.floor(hh * 0.4), 2, leaf);
    put(2, hh, 2, eye); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(2 + dx, hh, 2 + dz, P);
    put(2, hh + 1, 2, P); if (r() < 0.5) for (const [dx, dz] of [[1, 1], [-1, -1]]) put(2 + dx, hh, 2 + dz, mixc(P, [255, 255, 255], 0.25));
  }, s);
}

// ------------------------------------------------------------------ colour makes the grass grow
// The uncoloured meadow is plaster stubble (stub x height); wherever colour arrives (the flood, a hand-coloured path, the
// colour map) each tuft grows to full height (flowers open). Same coverage terms as paint.js, evaluated at the instance origin.
const GROW_VS = /* glsl */`
uniform float uK8On, uK8Stub, uPaintR, uPaintW, uLSW, uLAll, uK8ColOn; uniform vec3 uPaintC, uCapB; uniform vec4 uLS[8], uCapA, uK8ColBox; uniform vec2 uLY; uniform sampler2D uK8ColMap;
float k8Cov(vec3 o){
  float t = uPaintR > 0.0 ? clamp((uPaintR - distance(o, uPaintC)) / uPaintW + 0.4, 0.0, 1.0) : 0.0;
  for (int i = 0; i < 8; i++) if (uLS[i].w > 0.0) t = max(t, clamp((uLS[i].w - distance(o, uLS[i].xyz)) / uLSW + 0.4, 0.0, 1.0));
  if (uCapA.w > 0.0) { vec3 ab = uCapB - uCapA.xyz; float h = clamp(dot(o - uCapA.xyz, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
    t = max(t, clamp((uCapA.w - distance(o, uCapA.xyz + ab * h)) / uLSW + 0.4, 0.0, 1.0)); }
  if (uLY.y > 0.0) t = max(t, clamp((o.y - uLY.x) / uLY.y + 0.4, 0.0, 1.0));
  if (uK8ColOn > 0.5) { vec2 uv = (o.xz - uK8ColBox.xy) * uK8ColBox.zw; if (all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0)))) t = max(t, texture2D(uK8ColMap, uv).r); }
  return max(t, uLAll);
}`;
function growWithColour(mat, stub) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => { prev.call(mat, sh, r); sh.uniforms.uK8Stub = { value: stub };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + GROW_VS)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
        if (uK8On > 0.5) { vec3 o = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; float c = k8Cov(o); float g = mix(uK8Stub, 1.0, c * c * (3.0 - 2.0 * c));
          transformed.y *= g; transformed.xz *= mix(1.0, g, step(uK8Stub, 0.01)); }
        #endif`); };
  const pk = mat.customProgramCacheKey(); mat.customProgramCacheKey = () => pk + '|k8grow';
}

// ------------------------------------------------------------------ chunked scatter (InstancedMesh per chunk x variant)
function scatter({ geos, material, count, sample, seed = 1, chunk = 96, near = 0, far = 400, snap = VOX, yaw4 = true, name }) {
  const rnd = mulberry32(seed); const cells = new Map(); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < count; i++) {
    const s = sample(rnd); if (!s) continue;
    const x = Math.round(s.x / snap) * snap, z = Math.round(s.z / snap) * snap;
    const k = `${Math.floor(x / chunk)},${Math.floor(z / chunk)}`; const vi = Math.floor(rnd() * geos.length) % geos.length;
    q.setFromEuler(e.set(0, yaw4 ? Math.floor(rnd() * 4) * Math.PI / 2 : rnd() * 6.283, 0));
    m4.compose(p.set(x, s.y, z), q, sc.setScalar(s.k ?? 1));
    if (!cells.has(k)) cells.set(k, { cx: (Math.floor(x / chunk) + 0.5) * chunk, cz: (Math.floor(z / chunk) + 0.5) * chunk, lists: geos.map(() => []) });
    cells.get(k).lists[vi].push(m4.clone());
  }
  const group = new THREE.Group(); group.name = name || 'k8scatter'; const meshes = [];
  for (const c of cells.values()) c.lists.forEach((L, vi) => {
    if (!L.length) return;
    const im = new THREE.InstancedMesh(geos[vi], material, L.length); L.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.castShadow = false; im.receiveShadow = true; im.userData.noAO = true;
    im.userData.c = c; group.add(im); meshes.push(im);
  });
  return {
    group, meshes,
    update(cam) { const cx = cam.position.x, cz = cam.position.z, cy = Math.abs(cam.position.y);
      for (const im of meshes) { const d = Math.hypot(im.userData.c.cx - cx, im.userData.c.cz - cz) - chunk * 0.72; const dd = Math.hypot(Math.max(0, d), cy * 0.5); im.visible = dd < far && (near <= 0 || dd >= near - chunk); } },
  };
}

/** Act III sun elevation per range (deg; azimuth = the scene's). A scene can override per frame with LOOK({ k8SunElev, k8SunAz }).
 *  k08b's long shadows want 9..14 deg; talos_r4 owns the per-shot choice (see engine/checkpoints/world_look.md). */
export const SUN_ELEV = [
  [86.385, 94.204, 11],    // room A (drop): long shadows across the gap
  [94.204, 107.15, 12],    // room B / co-op crossing (verse 2)
  [107.15, 123.18, 13],    // the stage + rap (k08)
];
/** --r5 (LOOK_R5) default elevations = k08b's. Lower = longer shadows (the diorama rule) but the terrain decides: Room B (azimuth
 *  turn 42) is in the inland hills' shadow below ~11.5 deg (the whole room goes black at 10). Lower PER SHOT: r5Shot({ keyElev: 9.5 }). */
export const SUN_ELEV_R5 = [
  [86.385, 94.204, 9.5],    // room A (verified lit at 90.375)
  [94.204, 101.0, 11],      // room 2 (the climb on mesa A)
  [101.0, 107.15, 12],      // room B (azimuth turn 42): the whole room is in the inland hills' shadow at 11.5 and below
  [107.15, 123.18, 12.5],   // the stage + rap: black at 11.5 (k08b used 13)
];

// ------------------------------------------------------------------ build
export function buildK8({ W, ctx, MESA_A, MESA_B, groundY }) {
  const { scene } = W; const root = new THREE.Group(); root.name = 'k08b_ground'; scene.add(root);   // top-level (Act IV's erase patch reaches it)
  const PL_MEADOW = 0xe6dcc8;
  const mk = (kind, noPaint, plaster = PL_MEADOW, stub = 0.2) => { const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }); m.userData.plaster = plaster; m.userData.k8kind = kind;
    if (noPaint) m.userData.noPaint = true; patchPaint(m, { noPaint, k8kind: kind }); if (!noPaint) growWithColour(m, stub); return m; };
  const stripMat = mk(9, true);      // the drawn level's grass: always coloured
  const meadowMat = mk(3, false);    // meadow (colonnade side): plaster until the flood
  const mesaAMat = mk(3, false, PL_MEADOW, 0.12);     // mesa A: mirrors the old tufts' local paint (Jade's path of colour, 94.22)
  const mesaBMat = mk(3, false);     // mesa B paver joints / rim
  const stripFlowerMat = mk(10, true), meadowFlowerMat = mk(3, false, PL_MEADOW, 0.0);   // meadow flowers open only where colour arrives
  // palettes (sRGB): the strip uses Team A's greens; the meadow the lush post-flood greens
  const PS = [['#2f7a2a', '#3f9a36', '#7fd05a'], ['#2f7a2a', '#4cae40', '#9ade62'], ['#3f9a36', '#5cc04a', '#b6e84a']];
  const PM = [['#3f6e22', '#5c8e33', '#a5c75a'], ['#466f25', '#6d9e3c', '#b9d46a'], ['#3a6420', '#7cad46', '#c8dc78'], ['#4c7528', '#86b552', '#d9e08a']];
  const tufts = (pal, n, s, o) => Array.from({ length: n }, (_, i) => tuftGeo(1000 + i * 17 + (o?.seed || 0), s, pal[i % pal.length], o));
  const stripG = tufts(PS, 6, VOX, { w: 9, hMax: 16 }), stripEdgeG = tufts(PS, 4, VOX, { w: 11, hMax: 24, seed: 300 }), meadowG = tufts(PM, 8, VOX), farG = tufts(PM, 4, VOX * 3, { w: 5, hMax: 6, seed: 400 });
  const PETALS = ['#f27aa6', '#ffd23f', '#fff4e6', '#a98bf0', '#e8463c', '#ff9a3c'];
  const flowersG = PETALS.flatMap((c, i) => [flowerGeo(70 + i, VOX, c, { h: 9 }), flowerGeo(90 + i, VOX, c, { h: 13 })]);
  const flowersBigG = PETALS.map((c, i) => flowerGeo(150 + i, VOX * 1.6, c, { h: 12 }));   // read at the causeway's wide cameras
  const flowersFarG = PETALS.map((c, i) => flowerGeo(130 + i, VOX * 2.5, c, { h: 7 }));

  // regions
  const rimA = (x, z, M, seed) => 4 + 16 * fbm(x * 0.02, z * 0.02, 3, seed);   // makeMesa's ragged margin
  const onMesa = (M, seed) => (x, z) => { const s = 6, cx = M.x0 + Math.floor((x - M.x0) / s) * s + s / 2, cz = M.z0 + Math.floor((z - M.z0) / s) * s + s / 2; const m = rimA(cx, cz, M, seed);
    return cx > M.x0 + m && cx < M.x1 - m && cz > M.z0 + m && cz < M.z1 - m; };
  const inA = onMesa(MESA_A, 3), inB = onMesa(MESA_B, 5);
  const S = [];
  // the causeway (drawn level, y = 0, z in [-24, 24]): dense near the Talos room, overhanging the edges a little
  S.push(scatter({ name: 'strip', geos: stripG, material: stripMat, count: 32000, seed: 11, far: 420, sample: (r) => ({ x: 120 + r() * 1500, y: 0, z: (r() * 2 - 1) * 24.4 }) }));
  S.push(scatter({ name: 'stripFar', geos: stripG, material: stripMat, count: 26000, seed: 12, far: 1500, chunk: 160, sample: (r) => { const x = -400 + r() * 4800; return { x, y: 0, z: (r() * 2 - 1) * 24.2, k: 1.6 }; } }));
  // mesa A (the verse-2 meadow and the co-op near side): grass everywhere on the top
  S.push(scatter({ name: 'mesaA', geos: meadowG, material: mesaAMat, count: 62000, seed: 13, far: 460, sample: (r) => { const x = MESA_A.x0 + r() * (MESA_A.x1 - MESA_A.x0), z = MESA_A.z0 + r() * (MESA_A.z1 - MESA_A.z0); return inA(x, z) ? { x, y: MESA_A.top, z } : null; } }));
  // mesa B (pavers): grass in the joints of the 18-unit slabs and along the ragged rim
  S.push(scatter({ name: 'mesaB', geos: meadowG, material: mesaBMat, count: 60000, seed: 14, far: 420, sample: (r) => {
    const x = MESA_B.x0 + r() * (MESA_B.x1 - MESA_B.x0), z = MESA_B.z0 + r() * (MESA_B.z1 - MESA_B.z0); if (!inB(x, z)) return null;
    const rim = !inB(x + 9, z) || !inB(x - 9, z) || !inB(x, z + 9) || !inB(x, z - 9);
    const qx = ((x / 18) % 1 + 1) % 1, qz = ((z / 18 + (Math.floor(x / 18) % 2) * 0.5) % 1 + 1) % 1; const joint = Math.min(qx, 1 - qx, qz, 1 - qz) * 18 < 0.9;
    const stage = Math.hypot(x - 1360, z - 450) < 120;   // keep the stage floor and the band's marks clean
    return (rim && r() < 0.8) || (joint && !stage && r() < 0.25) ? { x, y: MESA_B.top, z } : null; } }));
  // the meadow on the colonnade side of the causeway
  S.push(scatter({ name: 'meadow', geos: meadowG, material: meadowMat, count: 50000, seed: 15, far: 300, sample: (r) => { const x = 160 + r() * 1400, z = -26 - Math.pow(r(), 1.6) * 360; return { x, y: groundY(x, z) - 0.3, z }; } }));
  S.push(scatter({ name: 'meadowFar', geos: farG, material: meadowMat, count: 30000, seed: 16, far: 1600, chunk: 200, snap: VOX * 3, sample: (r) => { const x = -200 + r() * 2800, z = -30 - Math.pow(r(), 1.3) * 1100; return { x, y: groundY(x, z) - 0.5, z }; } }));
  S.push(scatter({ name: 'mesaAFar', geos: farG, material: mesaAMat, count: 9000, seed: 17, near: 460, far: 2400, chunk: 160, snap: VOX * 3, sample: (r) => { const x = MESA_A.x0 + r() * (MESA_A.x1 - MESA_A.x0), z = MESA_A.z0 + r() * (MESA_A.z1 - MESA_A.z0); return inA(x, z) ? { x, y: MESA_A.top, z } : null; } }));
  // flowers: the drawn level's verges (coloured) and the meadow (plaster until the flood)
  // the causeway's edges: bigger tufts overhanging the rim break the flat silhouette line
  S.push(scatter({ name: 'stripEdge', geos: stripEdgeG, material: stripMat, count: 5200, seed: 21, far: 900, chunk: 128, sample: (r) => ({ x: 100 + r() * 1700, y: 0, z: (r() < 0.5 ? -1 : 1) * (22.2 + r() * 2.6) }) }));
  S.push(scatter({ name: 'stripFlowersBig', geos: flowersBigG, material: stripFlowerMat, count: 5000, seed: 22, far: 900, chunk: 128, sample: (r) => { const x = 100 + r() * 1700, z = (r() * 2 - 1) * 23.5; return Math.abs(z) > 14 || r() < 0.3 ? { x, y: 0, z } : null; } }));
  S.push(scatter({ name: 'stripFlowers', geos: flowersG, material: stripFlowerMat, count: 2600, seed: 18, far: 420, sample: (r) => ({ x: 120 + r() * 1500, y: 0, z: (r() < 0.5 ? -1 : 1) * (17 + r() * 7.2) }) }));
  S.push(scatter({ name: 'meadowFlowers', geos: flowersG, material: meadowFlowerMat, count: 9000, seed: 19, far: 320, sample: (r) => { const x = 160 + r() * 1400, z = -27 - Math.pow(r(), 1.4) * 360; return fbm(x * 0.012, z * 0.012, 2, 9) > 0.5 ? { x, y: groundY(x, z) - 0.3, z } : null; } }));
  S.push(scatter({ name: 'meadowFlowersFar', geos: flowersFarG, material: meadowFlowerMat, count: 8000, seed: 20, near: 300, far: 1600, chunk: 200, snap: VOX * 2.5, sample: (r) => { const x = -200 + r() * 2800, z = -30 - Math.pow(r(), 1.3) * 1100; return fbm(x * 0.012, z * 0.012, 2, 9) > 0.52 ? { x, y: groundY(x, z) - 0.4, z } : null; } }));
  for (const s of S) root.add(s.group);

  // the drawn level's top: voxel grain at hero density on Team A's greens (kind 9: grain only, colour untouched)
  const strip = W.props.drawnStrip; if (strip) strip.traverse((o) => { if (o.isMesh && o.rotation.x !== 0 && o.material?.userData?.k8u) o.material.userData.k8u.uK8Kind.value = 9; });

  // ---------------------------------------------------------------- the colour-amount hook (for the k09 wave unit)
  const CM = 256; const cmData = new Uint8Array(CM * CM * 4);
  const cmTex = new THREE.DataTexture(cmData, CM, CM, THREE.RGBAFormat, THREE.UnsignedByteType); cmTex.magFilter = cmTex.minFilter = THREE.LinearFilter; cmTex.needsUpdate = true;
  const box = { x0: -600, z0: -1400, sx: 4400, sz: 2600 };
  K8M.uK8ColMap.value = cmTex; K8M.uK8ColBox.value.set(box.x0, box.z0, 1 / box.sx, 1 / box.sz);
  const colorMap = {
    tex: cmTex, box, size: CM, data: cmData,
    /** fill from fn(x, z) -> 0..1 colour amount (world coords); call every frame you need it (pure function of t), then on(true) */
    fill(fn) { for (let j = 0; j < CM; j++) for (let i = 0; i < CM; i++) { const x = box.x0 + (i + 0.5) / CM * box.sx, z = box.z0 + (j + 0.5) / CM * box.sz;
      cmData[(j * CM + i) * 4] = Math.round(255 * Math.max(0, Math.min(1, fn(x, z)))); } cmTex.needsUpdate = true; return colorMap; },
    clear() { cmData.fill(0); cmTex.needsUpdate = true; return colorMap; },
    on(v = true) { K8M.uK8ColOn.value = v ? 1 : 0; return colorMap; },
  };

  // ---------------------------------------------------------------- per frame
  const mirror = [[W.mesaA.userData.tufts?.material, mesaAMat], [W.mesaB.userData.tops?.material, mesaBMat], [W.meadow?.material, meadowMat], [W.meadow?.material, meadowFlowerMat]];
  const copyLP = (a, b) => { const A = a?.userData?.lp?.U, B = b.userData.lp?.U; if (!A || !B) return;
    for (let i = 0; i < 8; i++) B.uLS.value[i].copy(A.uLS.value[i]); B.uLSW.value = A.uLSW.value; B.uLY.value.copy(A.uLY.value); B.uLAll.value = A.uLAll.value;
    B.uCapA.value.copy(A.uCapA.value); B.uCapB.value.copy(A.uCapB.value); };
  const BEATS = [[89.95, 91.085, 0.42], [101.0, 107.13, 0.36], [123.18, 125.6, 0.4], [143.48, 149.2, 0.38]];   // DOF on story beats
  const sv = new THREE.Vector3();
  // ---------------------------------------------------------------- art-directed sunbeam (k08b's shaft from the upper left)
  // A soft additive volume (open cone, fresnel-soft edges, streaked along its length), placed per frame relative to the
  // camera and the shot's target: it enters from the upper left and lands just behind the target. Depth-tested, no shadow.
  const beamMat = new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(1.0, 0.90, 0.76) }, uAmt: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 uCol; uniform float uAmt; varying vec2 vUv; varying vec3 vN, vV;
      float h(float x){ return fract(sin(x * 91.7) * 43758.5); }
      void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float core = pow(f, 2.2);
        float along = smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));
        float st = 0.7 + 0.3 * sin(vUv.x * 37.7 + 3.0 * h(floor(vUv.x * 12.0))) * sin(vUv.x * 11.3 + 1.7);
        gl_FragColor = vec4(uCol * uAmt * core * along * st, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false });
  const beamGeo = new THREE.CylinderGeometry(0.35, 1, 1, 40, 1, true); beamGeo.translate(0, -0.5, 0); beamGeo.rotateX(-Math.PI / 2);   // apex end at z=0, axis +z
  { const uv = beamGeo.attributes.uv; const pz = beamGeo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setY(i, pz.getZ(i)); }
  const beam = new THREE.Mesh(beamGeo, beamMat); beam.frustumCulled = false; beam.userData.noAO = true; beam.renderOrder = 5; root.add(beam);
  const BEAMS = [[89.95, 91.085, 1.0], [101.0, 107.13, 0.85]];   // the key frames 90.4 (FUNCTIONS!) and 104.6 (the co-op crossing)
  const bf = new THREE.Vector3(), br = new THREE.Vector3(), bu = new THREE.Vector3(0, 1, 0), bs = new THREE.Vector3(), be = new THREE.Vector3();
  function beamAt(t, camera, target, LK) {
    let a = 0; for (const [t0, t1, k] of BEAMS) if (t >= t0 && t < t1) a = Math.max(a, k * Math.min(1, (t - t0) / 0.3, (t1 - t) / 0.3));
    if (LK && LK.k8Beam != null) a *= LK.k8Beam;                                   // talos_r4's request: LOOK({ k8Beam: 0 }) switches the beam off (inert unless passed)
    const R5 = r5On(t) ? r5Frame(t) : null; if (R5 && R5.beam != null) a = R5.beam;   // --r5: per-shot beam (0 = off, 1 = on; the scene fades it)
    beam.visible = a > 0 && !!target; if (!beam.visible) return;
    camera.getWorldDirection(bf); bf.y = 0; bf.normalize(); br.crossVectors(bf, bu).normalize();
    const d = camera.position.distanceTo(target);
    be.copy(target).addScaledVector(bf, 0.35 * d).addScaledVector(br, -0.25 * d); be.y = target.y - 25;          // lands behind / left of the target
    bs.copy(be).addScaledVector(br, -1.6 * d).addScaledVector(bf, 0.8 * d); bs.y = be.y + 2.2 * d;               // enters high, upper left
    const L = bs.distanceTo(be); beam.position.copy(bs); beam.lookAt(be); beam.scale.set(0.16 * d, 0.16 * d, L);   // cone: apex radius 0 -> 0.16 d at the ground
    beamMat.uniforms.uAmt.value = 0.9 * a;
  }
  let todKey = ''; let tNow = 0; const effDir = new THREE.Vector3();
  /** the sun the world is lit by: the scene's azimuth, the time of day's elevation (quantised so the IBL key is stable) */
  let Lnow = null;
  /** sun elevation (deg) at t: the scene's per-frame LOOK override (L.k8SunElev) > SUN_ELEV ranges > the time-of-day preset */
  const elevAt = (t) => { const R = r5On(t) ? r5Frame(t) : null; if (R && R.keyElev != null) return R.keyElev;
    if (Lnow && Lnow.k8SunElev != null) return Lnow.k8SunElev; for (const [a, b, e] of (R ? SUN_ELEV_R5 : SUN_ELEV)) if (t >= a && t < b) return e; return todAt(t).sunElev; };
  const sunX = (dir) => { if (!k8On(tNow)) return dir; const el = Math.round(elevAt(tNow) * 20) / 20 * Math.PI / 180;
    let ax = dir.x, az = dir.z; const R = r5On(tNow) ? r5Frame(tNow) : null;
    if (R && R.keyAz != null) { ax = Math.cos(R.keyAz * Math.PI / 180); az = Math.sin(R.keyAz * Math.PI / 180); }   // --r5: absolute azimuth (0 = +x ahead, 90 = +z)
    const rot = ((Lnow?.k8SunAz || 0) + (R?.keyTurn || 0)) * Math.PI / 180;   // optional azimuth turn (deg, about +y)
    if (rot) { const c = Math.cos(rot), s2 = Math.sin(rot); [ax, az] = [ax * c + az * s2, -ax * s2 + az * c]; }
    const h = Math.hypot(ax, az) || 1; return effDir.set(ax / h * Math.cos(el), Math.sin(el), az / h * Math.cos(el)); };
  let xfSet = false;
  /** before the base look: the sky uniforms + sun elevation for t (so an env regeneration in setSun uses them) */
  function pre(t, look, L) { tNow = t; Lnow = L || null; if (L && L.r5 && LOOKCFG.r5) r5Shot(L.r5); if (!xfSet) { look.setSunXform(sunX); xfSet = true; } applyTod(t); }
  /** after the base look (lights, post params) are set for this frame */
  function post(t, L, { camera, target, focus, shadowExtent = 700 }, look) {
    r5SetFocusPoint(focus || target);   // --r5: the tilt band centres on the shot's focus point
    const on = k8On(t); K8M.uK8On.value = on ? 1 : 0;
    if (!on) { root.visible = false; if (todKey !== 'off') { todKey = 'off'; look.refreshEnv(); } return; }
    if (W.mesaA.userData.tufts) W.mesaA.userData.tufts.visible = false;   // replaced by the voxel tufts
    for (const s of S) s.update(camera);
    beamAt(t, camera, target, L);
    for (const [a, b] of mirror) copyLP(a, b);
    const P = todAt(t); const dim = L.dim ?? 1;
    // env (IBL) follows the sky: regenerate when the time of day moved (cheap check; PMREM only on change)
    if (K8U.uK8.value > 0.5 && P.key !== todKey) { todKey = P.key; look.refreshEnv(); }
    look.sun.color.setRGB(...P.sunLight); look.sun.intensity *= P.sunGain;
    ctx.post.finalMat.uniforms.uExposure.value *= P.expo;
    look.hemi.color.setRGB(...P.hemiSky); look.hemi.groundColor.setRGB(...P.hemiGround); look.hemi.intensity *= P.hemiGain;
    scene.environmentIntensity *= P.envGain;
    K8M.uK8Rim.value = P.rim * L.light * (0.4 + 0.6 * dim); K8M.uK8RimCol.value.setRGB(...P.rimCol); K8M.uK8SkyRimCol.value.setRGB(...P.skyRim);
    // --r5 (LOOK_R5): one key, less fill, rim on heroes; this frame's column selection (r5cols.js)
    const R5 = r5On(t) ? r5Frame(t) : null;
    if (R5) { look.sun.intensity *= R5.sunGain; look.hemi.intensity *= R5.hemiGain; K8M.uK8Rim.value *= R5.rim; }
    if (W.r5cols) W.r5cols.apply(R5 ? R5.columns : null, R5 ? R5.zones : null);
    camera.updateMatrixWorld(); sv.copy(look.sun.position).sub(look.sun.target.position).normalize().transformDirection(camera.matrixWorldInverse); K8M.uK8SunView.value.copy(sv);
    // PCSS: penumbra = 3% of the blocker distance; search up to 9 units; the shadow camera spans 2 * extent over 6000 deep
    const ext = shadowExtent; K8M.uK8PenK.value = 5990 * 0.03 / (2 * ext); K8M.uK8Search.value = 9 / (2 * ext); K8M.uK8PenMin.value = 1.0 / 4096;
    let dofB = 0; for (const [a, b, v] of BEATS) if (t >= a && t < b) dofB = Math.max(dofB, v * Math.min(1, (t - a) / 0.25, (b - t) / 0.25));
    if (dofB > 0 && L.dof > 0) ctx.post.params.dof = Math.max(ctx.post.params.dof, dofB * L.dof);
  }
  return { root, scatters: S, colorMap, pre, post, mats: { stripMat, meadowMat, mesaAMat, mesaBMat, stripFlowerMat, meadowFlowerMat } };
}
