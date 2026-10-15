// ACT III TALOS world builder (shared by Act III, the Act IV bridge/final chorus and Drop 2; see engine/WORLD_API.md).
//
// The prototype world (src/world.js: causeway strip, meadow, sea cliff, colonnade, temple, great gate, monument,
// islands) is reused through a MIRROR group (scale.x = -1) so that +x is "forward": the party keeps running to
// the right as in the 2D acts, and the low golden sun sits ahead of them at +x. On top of it this file adds:
//   - a cypress avenue along the causeway (one material per tree, so each can be hand-coloured on an accent)
//   - two plaster mesas rising from the sea (mesa A: verse 2 meadow + co-op chasm edge; mesa B: the stage)
//   - the paint patch (paint.js) on every material: plaster until coloured, flat-2D switch for the turn
//
// World coordinates: 1 unit = 1 sprite pixel (heroes are ~44 units tall). y up. Causeway top y = 0 along
// z in [-24, 24]; the sea (y = -200) is at +z; the meadow / ruins / hills at -z.
//
//   const W = await getWorld(ctx)     // built once per page, cached (all Act III-V scenes share one instance)
//   W.reset()                         // call first in every update(t): default visibility / paint / heroes
//   W.look(t, L, cam)                 // lights + post for this frame (see applyLook)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeSky, makeSea, makeEnvironment, envUniforms } from '../../../env.js';
import { makeStrip, makeMeadow, makeCliff, makeTufts, makeBoulders, makeRuins, makeIslands, terrainHeight, boxesToMesh } from '../../../world.js';
import { triplanarMaterial, rockTexture, stoneTexture } from '../../../materials.js';
import { G, mulberry32, vnoise, fbm, lerp } from '../../../util.js';
import { Actor } from '../../../core/sprites.js';
import { patchPaint, patchTree, PAINT_U, HERO_U } from './paint.js';
import { buildProps, marbleTexture } from './props.js';

export const SEA_Y = -200;
export const SUN_DIR = new THREE.Vector3(0.97, 0.13, -0.2).normalize();
export const PLASTER = { stone: 0xf4efe6, clay: 0xe2d6c0, meadow: 0xe6dcc8, rock: 0xd9ccb4, mesa: 0xeee5d4 };
/** meadow ground height at WORLD (x, z) (the prototype meadow is mirrored) */
export const groundY = (x, z) => terrainHeight(-x, z);

// mesas (world coords): A = verse-2 meadow + co-op near side, B = the stage (amphitheatre, rap verse, flood)
export const MESA_A = { x0: 560, x1: 1000, z0: 260, z1: 540, top: 10 };
export const MESA_B = { x0: 1090, x1: 1560, z0: 240, z1: 560, top: 10 };
export const CHASM = { x0: 1000, x1: 1090 };

export const PALETTE_2D = [
  '#05060d', '#0c1530', '#13234a', '#1f3d7a', '#3d7bff', '#9ec2ff', '#ffffff', '#f4efe6', '#e2d6bd', '#c9bba0', '#a8977f', '#776a5c', '#4a4a50', '#2e2e33',
  '#fffaf0', '#f4ecdc', '#e8dcc6', '#d8c9b0', '#c4b399', '#ab9a82', '#8f7f6c', '#6f6253', '#4d4339',
  '#ff4d6d', '#ff7a3d', '#ffb02e', '#ffe14d', '#b6e84a', '#4fd06a', '#2ec4a6', '#2bb4e8', '#3b7bff', '#6a5cff', '#a35cff', '#e858d0',
  '#1b1b22', '#9a9aa2', '#dcdce0', '#f2c230',
];

let WORLD = null;
export function getWorld(ctx) { return (WORLD ||= build(ctx)); }

// --------------------------------------------------------------- cypress (per-tree mesh, from the prototype's recipe)
function cypressGeo(h, seed) {
  // a smooth plaster sculpture: a few large, soft lobes stacked along a flame-shaped spindle (no popcorn)
  const rnd = mulberry32(seed); const r0 = h * 0.13; const parts = [];
  const prof = (t) => r0 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02 + 0.03)), 0.7) * (1 - 0.35 * t);
  const core = new THREE.CylinderGeometry(r0 * 0.3, r0 * 0.6, h * 0.9, 12); core.translate(0, h * 0.45, 0); parts.push([core, 0.4]);
  const n = 9 + Math.round(h * 0.03);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n + (rnd() - 0.5) * 0.04, a = rnd() * Math.PI * 2, rr = prof(t);
    const b = new THREE.SphereGeometry(rr * (0.95 + 0.12 * rnd()), 20, 14);
    const p = b.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k); const s2 = 0.94 + 0.12 * vnoise(x * 0.12 + i, y * 0.12 + z * 0.1, 5); p.setXYZ(k, x * s2, y * s2 * 1.45, z * s2); }
    b.translate(Math.cos(a) * rr * 0.12, t * h * 0.94, Math.sin(a) * rr * 0.12);
    parts.push([b, 0.6 + 0.4 * t]);
  }
  const tip = new THREE.ConeGeometry(r0 * 0.35, h * 0.14, 14); tip.translate(0, h * 1.0, 0); parts.push([tip, 1]);
  const geos = parts.map(([g, ao]) => { const gg = g.index ? g.toNonIndexed() : g; gg.deleteAttribute('uv');
    const c = new Float32Array(gg.attributes.position.count * 3);
    for (let k = 0; k < gg.attributes.position.count; k++) { const out = Math.min(1, Math.hypot(gg.attributes.position.getX(k), gg.attributes.position.getZ(k)) / (r0 * 0.9));
      const v = (0.55 + 0.45 * out) * ao; c[k * 3] = 0.16 * v + 0.03; c[k * 3 + 1] = 0.40 * v + 0.07; c[k * 3 + 2] = 0.15 * v + 0.03; }
    gg.setAttribute('color', new THREE.BufferAttribute(c, 3)); return gg; });
  return mergeGeometries(geos);
}

// --------------------------------------------------------------- mesas
function makeMesa({ x0, x1, z0, z1, top }, { seed = 1, s = 6, topKind = 'grass' } = {}) {
  const rnd = mulberry32(seed); const list = []; const topList = [];
  const rock = new THREE.Color('#b9a68a'), rockD = new THREE.Color('#8c7a64'), sand = new THREE.Color('#d8c49a');
  const grass = [new THREE.Color('#6d9e3c'), new THREE.Color('#7cad46'), new THREE.Color('#5c8e33'), new THREE.Color('#86b552')];
  const paver = new THREE.Color('#cdbd9e');
  const margin = (x, z) => 4 + 16 * fbm(x * 0.02, z * 0.02, 3, seed);
  const inside = (x, z) => { const m = margin(x, z); return x > x0 + m && x < x1 - m && z > z0 + m && z < z1 - m; };
  for (let x = x0; x < x1; x += s) for (let z = z0; z < z1; z += s) {
    const cx = x + s / 2, cz = z + s / 2; if (!inside(cx, cz)) continue;
    const edge = !inside(cx + s, cz) || !inside(cx - s, cz) || !inside(cx, cz + s) || !inside(cx, cz - s);
    let c;
    if (topKind === 'grass') c = grass[Math.floor(fbm(cx * 0.05, cz * 0.05, 2, 3) * 4) % 4].clone().multiplyScalar(0.92 + 0.12 * rnd());
    else { const px = Math.floor(cx / 18), pz = Math.floor(cz / 18); c = paver.clone().offsetHSL(0, 0, (vnoise(px * 1.3, pz * 1.7, seed) - 0.5) * 0.12); }
    if (edge) c = c.clone().lerp(rock, 0.4);
    topList.push({ x: cx, y: top - s / 2, z: cz, c });
    if (!edge) continue;
    const ledge = Math.floor(vnoise(cx * 0.05, cz * 0.05, seed + 4) * 3);
    for (let y = top - s * 1.5, k = 0; y > SEA_Y - 20; y -= s, k++) {
      if (k > 2 && k % 7 === ledge) continue; // ledges / strata
      let col = rock.clone().lerp(rockD, vnoise(cx * 0.06, y * 0.06 + cz * 0.04, seed + 9)).multiplyScalar(0.9 + 0.15 * vnoise(cx * 0.5, y * 0.3, 7));
      if (y < SEA_Y + 14) col = sand.clone().lerp(col, 0.5);
      list.push({ x: cx, y, z: cz, c: col });
    }
  }
  const g = new THREE.Group();
  const rockMat = triplanarMaterial({ tex: rockTexture(), scale: 0.02, bump: 1.4, roughness: 0.9 }); rockMat.userData.plaster = PLASTER.rock;
  const sides = boxesToMesh(list, s, {}, rockMat); g.add(sides);
  const topMat = triplanarMaterial({ tex: stoneTexture(), scale: 0.03, bump: 0.8, roughness: 0.9 }); topMat.userData.plaster = PLASTER.mesa;
  const tops = boxesToMesh(topList, s, {}, topMat); g.add(tops);
  g.userData = { top, sides, tops };
  return g;
}

// --------------------------------------------------------------- look (lights + post) for 3D frames
function makeLook(scene, renderer, post, width, height, sky) {
  const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.74, 0.46), 3);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.8; sun.shadow.radius = 3;
  const sunTarget = new THREE.Object3D(); scene.add(sunTarget); sun.target = sunTarget; scene.add(sun);
  const hemi = new THREE.HemisphereLight(new THREE.Color(0.50, 0.60, 0.90), new THREE.Color(0.80, 0.58, 0.36), 1.0); scene.add(hemi);
  const fill = new THREE.DirectionalLight(new THREE.Color(1.0, 0.85, 0.7), 0); scene.add(fill); scene.add(fill.target);
  let envKey = '';
  function setSun(dir) {
    envUniforms.uSunDir.value.copy(dir).normalize();
    const key = envUniforms.uSunDir.value.toArray().map((v) => v.toFixed(4)).join();
    if (key !== envKey) { if (scene.environment) scene.environment.dispose(); scene.environment = makeEnvironment(renderer); envKey = key; }
  }
  /**
   * L: { flat, light, shadow, tone, palette, pix, outline, bloom, dof, dofAmount, grade, atmos, rays, ao, exposure, fill, sat }
   * cam: { camera, target, focus, shadowExtent, virtFov }
   */
  function applyLook(t, L, { camera, target, focus, shadowExtent = 700, virtFov = 0, distOffset = 0 }) {
    envUniforms.uTime.value = t;
    G.uFlat.value = L.flat;
    G.uValueKeep.value = lerp(0.9, 0.35, L.light);
    const dim = L.dim ?? 1;
    // optional "crisp golden hour" controls (defaults = the original look, so other acts are unaffected)
    const warm = L.sunWarm ?? 0, cool = L.coolShadows ?? 0;
    sun.color.setRGB(1.0, 0.74 - 0.06 * warm, 0.46 - 0.07 * warm);
    hemi.color.setRGB(0.50 - 0.08 * cool, 0.60 - 0.04 * cool, 0.90 + 0.1 * cool); hemi.groundColor.setRGB(0.80 - 0.16 * cool, 0.58 - 0.06 * cool, 0.36 + 0.06 * cool);
    sun.intensity = lerp(0.0, 3.6, L.light) * dim * (L.sunGain ?? 1);
    hemi.intensity = lerp(1.0, L.hemiLo ?? 0.45, L.light) * (L.hemi ?? 1) * (0.25 + 0.75 * dim);
    scene.environmentIntensity = lerp(0.0, L.envInt ?? 0.75, L.light) * (0.2 + 0.8 * dim);
    PAINT_U.uAccent.value = L.accent ?? 1;
    HERO_U.uHeroFill.value = (L.heroFill ?? 0) * L.light; HERO_U.uHeroRim.value = (L.heroRim ?? 0) * L.light;
    if (post.gtao) { const key = `${L.aoRadius ?? 7}|${L.aoScale ?? 1.25}`; if (key !== post.gtao.userData_act3) { post.gtao.updateGtaoMaterial({ radius: L.aoRadius ?? 7, scale: L.aoScale ?? 1.25 }); post.gtao.userData_act3 = key; } }
    sun.shadow.intensity = L.shadow;
    const sd = envUniforms.uSunDir.value;
    sunTarget.position.copy(target); sun.position.copy(target).addScaledVector(sd, 3000);
    const sc = sun.shadow.camera; sc.left = sc.bottom = -shadowExtent; sc.right = sc.top = shadowExtent; sc.near = 10; sc.far = 6000; sc.updateProjectionMatrix();
    sunTarget.updateMatrixWorld(); sun.updateMatrixWorld();
    fill.intensity = (L.fill ?? 0.55) * L.light * dim; fill.position.copy(camera.position).add(new THREE.Vector3(0, 200, 0)); fill.target.position.copy(target); fill.updateMatrixWorld(); fill.target.updateMatrixWorld();
    const sm = sky.material.uniforms;
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    sm.uCamFwd.value.copy(fwd); sm.uCamRight.value.copy(right); sm.uCamUp.value.copy(up);
    sm.uAspect.value = width / height;
    const fovRad = (camera.isPerspectiveCamera ? camera.fov : 0) * Math.PI / 180;
    sm.uVirtFov.value = lerp(fovRad, 0.75, virtFov); sm.uVirtMix.value = virtFov; sm.uSkyLift.value = 0.12 * virtFov;
    const F = post.finalMat.uniforms;
    F.uPix.value = L.pix; F.uPalMix.value = L.palette; F.uDither.value = 0.35; F.uOutline.value = L.outline; F.uOutlineDepth.value = 6;
    F.uTone.value = L.tone; F.uExposure.value = (L.exposure ?? lerp(0.82, 0.6, L.light)) * (0.35 + 0.65 * dim);
    F.uVignette.value = 0.38 * L.grade + (L.vignette ?? 0); F.uGrain.value = 0.016 * L.grade; F.uTime.value = t; F.uFlatGain.value = 1;
    F.uGrade.value = L.grade; F.uSat.value = lerp(1.0, L.sat ?? 1.12, L.grade); F.uContrast.value = lerp(1.0, L.contrast ?? 1.07, L.grade);
    post.params.bloom = (L.bloomAmt ?? 0.35) * L.bloom; post.bloom.threshold = L.bloomThr ?? 1.2; post.bloom.radius = 0.6;
    post.params.dof = (L.dofAmount ?? 0.4) * L.dof; post.params.focus = camera.position.distanceTo(focus || target); post.dofMat.uniforms.uMaxR.value = 7;
    post.params.ao = L.ao; post.params.atmos = L.atmos; post.params.rays = L.rays; post.params.distOffset = L.hazeStart ?? distOffset;
  }
  return { sun, hemi, fill, setSun, applyLook };
}

/** the settled TALOS look (u = 1) */
export const LOOK3D = { flat: 0, light: 1, shadow: 1, tone: 1, palette: 0, pix: 1, outline: 0, bloom: 1, dof: 1, grade: 1, atmos: 1, rays: 0.35, ao: 1, dofAmount: 0.3 };

// --------------------------------------------------------------- build
async function build(ctx) {
  const { renderer, post, width, height, lib } = ctx;
  const t0 = performance.now();
  const scene = new THREE.Scene();
  const sky = makeSky(); scene.add(sky);
  const sea = makeSea(SEA_Y); scene.add(sea);

  // prototype world, mirrored so +x is forward
  const M = new THREE.Group(); M.scale.x = -1; scene.add(M);
  const strip = makeStrip(); M.add(strip); strip.visible = false; // replaced by the coloured drawn-level strip (props.drawnStrip)
  const meadow = makeMeadow({ x0: -3600, x1: 1600, z0: -4200 }); M.add(meadow);
  const cliff = makeCliff({ seaY: SEA_Y }); M.add(cliff);
  const tufts = makeTufts({ x0: -2000, x1: 700, count: 60000 }); M.add(tufts);
  // lusher full colour (what THE PAINT FLOOD reveals): more saturated, greener meadow and tufts
  const lush = (c) => { const h = {}; c.getHSL(h); if (h.h > 0.07 && h.h < 0.22) h.h += (0.24 - h.h) * 0.45; c.setHSL(h.h, Math.min(1, h.s * 1.45 + 0.05), Math.min(0.62, h.l * 1.04)); return c; };
  { const ca = meadow.geometry.attributes.color, c = new THREE.Color(); for (let i = 0; i < ca.count; i++) { c.setRGB(ca.getX(i), ca.getY(i), ca.getZ(i)); lush(c); ca.setXYZ(i, c.r, c.g, c.b); } ca.needsUpdate = true; }
  if (tufts.instanceColor) { const a = tufts.instanceColor, c = new THREE.Color(); for (let i = 0; i < tufts.count; i++) { c.fromArray(a.array, i * 3); lush(c).toArray(a.array, i * 3); } a.needsUpdate = true; }
  const boulders = makeBoulders(); M.add(boulders);
  const ruins = makeRuins(); M.add(ruins);
  const islands = makeIslands({ seaY: SEA_Y }); M.add(islands);

  // cypress avenue (meadow side of the causeway, between the colonnade columns) + background clumps
  const avenue = [];
  const rnd = mulberry32(77);
  for (let k = 0; k < 9; k++) {
    const x = 262 + 74 * k + (rnd() - 0.5) * 8, z = -47 + (rnd() - 0.5) * 4, h = 125 + rnd() * 45;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }); mat.userData.plaster = PLASTER.clay;
    const m = new THREE.Mesh(cypressGeo(h, 500 + k), mat); m.position.set(x, groundY(x, z) - 2, z); m.rotation.y = rnd() * 6.28;
    m.castShadow = m.receiveShadow = true; m.userData = { h, base: m.position.y }; scene.add(m); avenue.push(m);
  }
  const clumpSpots = [[900, -520, 1.2], [180, -560, 1], [480, -470, 0.9],
    [1500, -420, 1.3], [1180, -470, 1.0], [1230, -500, 0.85], [2000, -380, 1.2], [2060, -420, 1.0], [760, -900, 1.4], [820, -940, 1.1], [300, -1200, 1.5],
    [1600, -1100, 1.6], [1700, -1150, 1.3], [2400, -900, 1.6], [-200, -800, 1.2], [-260, -840, 1.0], [-120, -300, 1.1], [-60, -380, 0.9]];
  const cg = []; clumpSpots.forEach(([x, z, s], i) => { const h = (140 + rnd() * 90) * s; const g = cypressGeo(h, 900 + i); g.rotateY(rnd() * 6.28); g.translate(x, groundY(x, z) - 2, z); cg.push(g); });
  const clumpMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }); clumpMat.userData.plaster = PLASTER.clay;
  const clumps = new THREE.Mesh(mergeGeometries(cg), clumpMat); clumps.castShadow = clumps.receiveShadow = true; scene.add(clumps);

  // mesas out in the sea
  const mesaA = makeMesa(MESA_A, { seed: 3, topKind: 'grass' }); scene.add(mesaA);
  const mesaB = makeMesa(MESA_B, { seed: 5, topKind: 'paver' }); scene.add(mesaB);
  { // grass tufts on mesa A (plaster until coloured)
    const r2 = mulberry32(31); const list = []; const greens = ['#6f9a36', '#86a744', '#9aaf4c', '#5d8530'].map((h) => new THREE.Color(h));
    for (let i = 0; i < 3500; i++) { const x = MESA_A.x0 + 25 + r2() * (MESA_A.x1 - MESA_A.x0 - 50), z = MESA_A.z0 + 25 + r2() * (MESA_A.z1 - MESA_A.z0 - 50);
      const h = 1 + Math.floor(r2() * 2); for (let k = 0; k < h; k++) list.push({ x: Math.round(x) + 0.5, y: MESA_A.top + k + 0.5, z: Math.round(z) + 0.5, c: greens[Math.floor(r2() * 4)] }); }
    const tm = boxesToMesh(list, 1, { roughness: 0.9, plaster: PLASTER.meadow }); tm.material.userData.plaster = PLASTER.meadow; tm.castShadow = false; scene.add(tm); mesaA.userData.tufts = tm;
  }

  // heroes (full colour voxels, never plaster) + bugs
  const heroes = {};
  for (const n of ['jade', 'charlie', 'ricky']) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); mat.userData.noPaint = true;
    const a = new Actor(lib, n, { name: n }); const g = a.voxel({ scale: 1, material: mat, back: true, depth: { baseDepth: 3, depthPerPixel: 2.2, maxDepth: 18 } }); g.actor = a; g.name = n;
    patchPaint(mat, { noPaint: true, hero: true }); scene.add(g); heroes[n] = g;
  }
  const BUGS = ['ladybug', 'beetle', 'moth', 'caterpillar', 'firefly'];
  const FEATURE = { ladybug: 'button', beetle: 'wheel', moth: 'glider', caterpillar: 'bridge', firefly: 'lamp' };
  const bugs = {};
  for (const n of BUGS) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }); patchPaint(mat, { noPaint: true, hero: true });
    const a = new Actor(lib, { idle: `bug_${n}_idle`, dance: `bug_${n}_dance`, feature: `bug_${n}_${FEATURE[n]}` }, { name: n });
    const g = a.voxel({ scale: 1, material: mat, depth: { baseDepth: 3, depthPerPixel: 2.2, maxDepth: 18 } }); g.actor = a; g.name = n; g.feature = FEATURE[n]; g.mat = mat; scene.add(g); bugs[n] = g;
  }

  const props = await buildProps({ scene, lib, groundY });

  const look = makeLook(scene, renderer, post, width, height, sky);
  look.setSun(SUN_DIR);

  // the painted (post-flood) stone should read as warm clean marble, not pitted cork: soften the prototype's bump
  for (const root of [ruins, mesaA, mesaB, boulders]) root.traverse((o) => { const m = o.material; if (m?.userData?.tri) { m.userData.tri.uBump.value = Math.min(m.userData.tri.uBump.value, 0.55); if (root === ruins) { m.userData.tri.tTri.value = marbleTexture(); m.color.lerp(new THREE.Color('#fff4e0'), 0.4); } } });
  mesaB.userData.tops.material.userData.tri.tTri.value = marbleTexture();
  mesaB.userData.tops.material.color.set('#fff4e2');
  // paint patch on everything not yet patched (prototype materials carry userData.plaster tints)
  patchTree(scene);
  const avenueLP = avenue.map((m) => m.material.userData.lp);

  post.setScene(scene, new THREE.PerspectiveCamera());
  const spriteStrips = Object.keys(lib.meta).filter((k) => /^(jade|charlie|ricky|bug)_/.test(k));
  post.setPalette([...PALETTE_2D, ...lib.colors(spriteStrips)]);

  // everything a scene may toggle; reset() puts it back each frame (pure function of t per scene)
  const W = {
    scene, sky, sea, M, strip, meadow, cliff, tufts, boulders, ruins, islands, avenue, avenueLP, clumps, mesaA, mesaB,
    heroes, bugs, BUGS, props, ...look, groundY,
    reset() {
      G.uPaintR.value = -1; G.uPaintC.value.set(0, 0, 0); G.uPaintW.value = 160;
      for (const lp of avenueLP) lp.reset();
      scene.traverse((o) => { if (o.material?.userData?.lp && !o.userData.keepPaint) o.material.userData.lp.reset(); });
      for (const h of Object.values(heroes)) { h.visible = false; h.rotation.set(0, 0, 0); h.position.z = 0; }
      for (const b of Object.values(bugs)) { b.visible = false; b.rotation.set(0, 0, 0); b.position.z = 0; }
      props.reset();
      sky.visible = sea.visible = true; M.visible = true;
    },
    /** place a voxel hero/bug: s = { x, y, z, anim, t, frame, pencil, facing, rotY, visible } */
    put(g, s) {
      if (s.visible === false) { g.visible = false; return g; }
      g.visible = true; g.set({ anim: s.anim, t: s.t ?? 0, frame: s.frame ?? null, pencil: !!s.pencil, facing: s.facing ?? 1, x: s.x, y: s.y });
      g.position.z = s.z ?? 0; g.rotation.y = s.rotY ?? 0; return g;
    },
  };
  W.reset();
  console.log(`[act3] world built in ${Math.round(performance.now() - t0)} ms`);
  return W;
}
