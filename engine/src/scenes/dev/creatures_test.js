// Dev turntables / review stills for the CREATURES (core/creatures): bugs, features, morphs, drafts, the Eraser.
// Lives in the 'dev' show only. Shot k plays at t = t0 + k + frac (frac = local anim phase); the shot list is logged at setup
// ("[creatures] shots ...") and mirrored by tools in out/review/creatures. Rendered inside the shared Act III world (plaster
// stage on mesa B, golden-hour look) so the models are judged in the light they will be used in.
import * as THREE from 'three';
import { getWorld, MESA_B, SUN_DIR } from '../act3/world/build.js';
import { patchPaint } from '../act3/world/paint.js';
import { LOOK } from '../act3/common.js';
import { makeBug, makeFeature, makeMorph, makeDraft, makeEraser, BUG_NAMES, FEATURE_OF, STATS } from '../../core/creatures/index.js';

const S = new THREE.Vector3(1360, MESA_B.top, 450);
const REVIEW_SUN = new THREE.Vector3(Math.cos(0.75) * Math.cos(1.3), Math.sin(0.75), Math.cos(0.75) * Math.sin(1.3));   // higher daylight sun for the close review stills (k09 is midday-bright)
const onMaterial = (m) => patchPaint(m, { noPaint: true, hero: true });
// k09 orientations (rotY relative to "face the camera"), elevation of the k09 camera
const K09 = { ladybug: -2.3, beetle: -2.6, moth: -0.25, caterpillar: 0.95, firefly: 1.9 };

export async function setup(ctx) {
  const W = await getWorld(ctx); const t0 = ctx.entry.t0; const aspect = ctx.width / ctx.height;
  const scene = W.scene; const root = new THREE.Group(); root.name = 'creatures_test'; scene.add(root);
  // the stage disc is raised above the mesa top: find the floor under S
  { const rc = new THREE.Raycaster(new THREE.Vector3(S.x, 400, S.z), new THREE.Vector3(0, -1, 0)); W.reset(); scene.updateMatrixWorld(true);
    const hit = rc.intersectObjects(scene.children, true).find((h) => h.object.visible && h.object.isMesh && !h.object.isInstancedMesh); if (hit) S.y = hit.point.y;
    console.log('[engine] [creatures] floor y = ' + S.y.toFixed(2) + ' (' + (hit?.object.name || '?') + ')'); }
  const tb = performance.now();
  const bugs = {}, feats = {}, morphs = {}, drafts = {};
  for (const n of BUG_NAMES) {
    bugs[n] = makeBug(n, { onMaterial, light: false }); root.add(bugs[n]);
    feats[n] = makeFeature(n, { onMaterial }); root.add(feats[n]);
    morphs[n] = makeMorph(n, { onMaterial }); root.add(morphs[n]);
    drafts[n] = makeDraft(n, { resolution: [ctx.width, ctx.height], width: 2.2 * ctx.height / 1080 }); root.add(drafts[n]);
  }
  const tBugs = performance.now() - tb;
  const te = performance.now(); const erasers = { mid: makeEraser({ lod: 'mid', onMaterial }), hi: makeEraser({ lod: 'hi', onMaterial }) };
  for (const e of Object.values(erasers)) root.add(e);
  const tEr = performance.now() - te;
  console.log(`[engine] [creatures] build: bugs+features+morphs+drafts ${Math.round(tBugs)} ms, erasers ${Math.round(tEr)} ms :: ${JSON.stringify(STATS)} :: eraser ${JSON.stringify(Object.fromEntries(Object.entries(erasers).map(([k, e]) => [k, e.userData.stats])))}`);
  const all = [...Object.values(bugs), ...Object.values(feats), ...Object.values(morphs), ...Object.values(drafts), ...Object.values(erasers)];

  const cam = new THREE.PerspectiveCamera(30, aspect, 0.5, 120000);
  const box = new THREE.Box3(), sph = new THREE.Sphere(), tb3 = new THREE.Box3();
  /** frame an object: az = camera azimuth (0 = from +x), el = elevation (rad), margin; returns cam spec */
  const frame = (objs, az, el, { fov = 26, margin = 1.15, lift = 0, dist } = {}) => {
    box.makeEmpty(); for (const o of [].concat(objs)) { o.updateWorldMatrix(true, true); o.traverseVisible((m) => { if (m.isMesh && m.geometry) { m.geometry.boundingBox || m.geometry.computeBoundingBox(); tb3.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); box.union(tb3); } }); } box.getBoundingSphere(sph);
    if (globalThis.__CRDBG) console.log('[engine] [creatures] frame r=' + sph.radius.toFixed(1) + ' c=' + sph.center.toArray().map((v) => v.toFixed(1)));
    const d = dist ?? sph.radius * margin / Math.sin(fov * Math.PI / 360); const tgt = sph.center.clone(); tgt.y += lift * sph.radius;
    return { pos: tgt.clone().add(new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(d)), tgt, fov };
  };
  const place = (g, p = S, rotY = 0) => { g.visible = true; g.position.copy(p); g.rotation.set(0, rotY, 0); return g; };
  const AZ = 0.55; // camera azimuth for the review stills (sun behind the camera's left shoulder)

  // ------------------------------------------------------------------ shot table
  const SH = [];
  const add = (name, fn) => SH.push({ name, fn });
  for (const n of BUG_NAMES) add(`k09_${n}`, (f) => { const g = place(bugs[n], S, -AZ - K09[n]); g.set({ anim: 'idle', t: 1.0, stance: n === 'caterpillar' ? 'crawl' : 'upright' }); return frame(g, AZ, 0.6, { margin: 1.05 }); });
  for (const n of BUG_NAMES) for (const [i, a] of [0.0, 1.5708, 3.1416, 4.7124].entries()) add(`turn_${n}_${i}`, (f) => { const g = place(bugs[n], S, -AZ + 0.6 + a); g.set({ anim: 'idle', t: 0.4 }); return frame(g, AZ, 0.32); });
  for (const n of BUG_NAMES) for (let i = 0; i < 4; i++) add(`dance_${n}_${i}`, (f) => { const g = place(bugs[n], S, -AZ + 0.6); g.set({ anim: 'dance', t: i * 0.25, beat: i * 0.25 }); return frame(bugs[n], AZ, 0.3, { margin: 1.5, dist: 34 }); });
  for (const n of BUG_NAMES) for (let i = 0; i < 6; i++) add(`bug_${n}_${i}`, (f) => { const b = { firefly: [0.1, 0.6, 1.62, 2.55, 3.6, 4.7], moth: [0.3, 0.62, 0.76, 0.9, 1.1, 1.6], beetle: [0, 0.33, 0.66, 1.0, 1.33, 1.66], caterpillar: [0.5, 1.5, 2.5, 3.5, 4.5, 5.9], ladybug: [0, 0.25, 0.5, 0.75, 1.0, 1.6] }[n][i];
    const g = place(bugs[n], S, -AZ + 0.6 + (n === 'beetle' ? -0.6 : 0)); g.set({ anim: 'bug', t: b / 2, beat: b }); const big = n === 'beetle' ? 52 : n === 'caterpillar' ? 50 : n === 'moth' ? 42 : 34;
    return frame(g, AZ, n === 'beetle' ? 0.75 : 0.3, { dist: big }); });
  for (const n of BUG_NAMES) for (const [i, a] of [0.0, 1.2, 2.6].entries()) add(`feat_${FEATURE_OF[n]}_${i}`, (f) => { const g = place(feats[n], S, -AZ + 0.55 + a + (n === 'beetle' ? 1.57 - 0.55 : 0)); g.set({ anim: 'idle', t: 1.0 }); return frame(g, AZ, 0.3); });
  for (const n of BUG_NAMES) for (let i = 0; i < 8; i++) add(`morph_${n}_${i}`, (f) => { const g = place(morphs[n], S, -AZ + 0.6); g.set({ u: i / 7, t: 0.4 });
    const bb = [morphs[n].userData.bug, morphs[n].userData.feature]; bb.forEach((o) => { o.visible = true; o.set({}); }); const c = frame(bb, AZ, 0.38, { margin: 1.25 }); g.set({ u: i / 7, t: 0.4 }); return c; });
  for (const n of BUG_NAMES) add(`draft_${n}`, (f) => { const g = place(drafts[n], S, -AZ + 0.6); g.set({ p: 1 }); return frame(g, AZ, 0.38, { margin: 1.1 }); });
  for (let i = 0; i < 4; i++) add(`draftp_caterpillar_${i}`, (f) => { const g = place(drafts.caterpillar, S, -AZ + 0.6); g.set({ p: (i + 1) / 4 }); return frame(g, AZ, 0.38, { margin: 1.1 }); });
  add('lineup_bugs', (f) => { BUG_NAMES.forEach((n, i) => { const g = place(bugs[n], S.clone().add(new THREE.Vector3(-6 + 2 * i, 0, -44 + 22 * i)), -AZ - K09[n]); g.set({ anim: 'idle', t: 0.4 + i }); }); return frame(Object.values(bugs), AZ, 0.5, { margin: 1.0 }); });
  add('lineup_features', (f) => { BUG_NAMES.forEach((n, i) => { const g = place(feats[n], S.clone().add(new THREE.Vector3(-6 + 2 * i, 0, -50 + 25 * i)), -AZ + 0.5 + (n === 'beetle' ? 1.1 : 0)); g.set({ anim: 'idle', t: 0.4 + i }); }); return frame(Object.values(feats), AZ, 0.25, { margin: 1.0 }); });
  // eraser: (gray, pink, pink + cap) at hero scale, then the mountain
  const ES = 60;   // eraser height in world units for the close shots (1.6 model units -> scale 37.5)
  const er = (lod, o, sc) => { const e = erasers[lod]; place(e, S, Math.PI / 2 - AZ); e.scale.setScalar(sc / 1.6); e.set(o); return e; };
  add('eraser_gray', (f) => frame(er('mid', { pink: 0, face: 'grumpy' }, ES), AZ, 0.18, { margin: 1.05 }));
  add('eraser_pink', (f) => frame(er('mid', { pink: 1, face: 'happy' }, ES), AZ, 0.18, { margin: 1.05 }));
  add('eraser_pink_cap', (f) => frame(er('mid', { pink: 1, face: 'happy', cap: true }, ES), AZ, 0.18, { margin: 1.1 }));
  add('eraser_gray_34', (f) => frame(er('mid', { pink: 0, face: 'grumpy' }, ES), AZ + 0.7, 0.3, { margin: 1.05 }));
  add('eraser_look', (f) => frame(er('mid', { pink: 0, face: 'look' }, ES), AZ, 0.18, { margin: 1.05 }));
  add('eraser_sing', (f) => frame(er('mid', { pink: 1, face: 'sing', cap: true }, ES), AZ - 0.5, 0.2, { margin: 1.1 }));
  const MP = new THREE.Vector3(2900, -200, 1100);
  add('eraser_mountain', (f) => { const e = er('hi', { pink: 0, face: 'grumpy' }, 900); e.position.copy(MP); e.rotation.y = -Math.PI / 2 - 0.45;
    BUG_NAMES.forEach((n, i) => { const d = 62 + 6 * (i % 2), side = -34 + 17 * i; const g = place(feats[n], S.clone().add(new THREE.Vector3(-10 + 0.92 * d - 0.36 * side, 0, 40 + 0.36 * d + 0.92 * side)), -1.95 + (n === 'beetle' ? 1.57 : 0)); g.set({ t: 1 }); });
    return { pos: S.clone().add(new THREE.Vector3(-10, 13, 40)), tgt: new THREE.Vector3(2900, 330, 1100), fov: 52 }; });
  add('eraser_mountain_face', (f) => { const e = er('hi', { pink: 0, face: 'grumpy' }, 900); e.position.copy(MP); e.rotation.y = -Math.PI / 2 - 0.45;
    return { pos: MP.clone().add(new THREE.Vector3(-900, 640, -420)), tgt: MP.clone().add(new THREE.Vector3(0, 660, 0)), fov: 42 }; });
  add('eraser_mountain_pink', (f) => { const e = er('hi', { pink: 1, face: 'happy', cap: true }, 900); e.position.copy(MP); e.rotation.y = -Math.PI / 2 - 0.45;
    return { pos: MP.clone().add(new THREE.Vector3(-1050, 600, -380)), tgt: MP.clone().add(new THREE.Vector3(0, 700, 0)), fov: 44 }; });
  // m3 (recruit mock) framings: features seen low and frontal, faces toward the camera
  const M3 = { lamp: [0.0, 0.12], glider: [-0.5, 0.35], wheel: [Math.PI / 2, 0.1], bridge: [-0.75, 0.3], button: [0.0, 0.2] };
  for (const n of BUG_NAMES) { const f = FEATURE_OF[n]; add(`m3_${f}`, () => { const g = place(feats[n], S, -AZ + M3[f][0]); g.set({ anim: 'idle', t: 1.0 }); return frame(g, AZ, M3[f][1], { margin: 1.02 }); }); }
  // perf: baseline / 10 animated creatures / 5 morphs in flight / mountain Eraser (frac drives the anim inside the shot)
  const LINE = (i, n) => S.clone().add(new THREE.Vector3(-30 + 15 * (i % 5), 0, -40 + 20 * (i % 5) + (n ? 24 : 0)));
  const perfCam = () => ({ pos: S.clone().add(new THREE.Vector3(110, 70, 110)), tgt: S.clone().add(new THREE.Vector3(0, 8, 0)), fov: 40 });
  add('perf_empty', () => perfCam());
  add('perf_creatures', (f) => { BUG_NAMES.forEach((n, i) => { place(bugs[n], LINE(i, 0), -AZ).set({ anim: 'dance', t: f, beat: f * 2 }); place(feats[n], LINE(i, 1), -AZ).set({ anim: 'dance', t: f, beat: f * 2 }); }); return perfCam(); });
  add('perf_morphs', (f) => { BUG_NAMES.forEach((n, i) => { place(morphs[n], LINE(i, 0), -AZ).set({ u: 0.05 + 0.9 * f, t: f }); }); return perfCam(); });
  add('perf_eraser_hi', (f) => { const e = er('hi', { pink: f, face: f < 0.5 ? 'grumpy' : 'happy', hatch: true, cap: f > 0.5 }, 900); e.position.copy(MP); e.rotation.y = -Math.PI / 2 - 0.45;
    return { pos: MP.clone().add(new THREE.Vector3(-1500, 500, -700)), tgt: MP.clone().add(new THREE.Vector3(0, 450, 0)), fov: 44 }; });
  // CPU probe: per-call cost of set() (pure function of t) for each kind
  { const time = (fn, k = 60) => { const a = performance.now(); for (let i = 0; i < k; i++) fn(i / k); return (performance.now() - a) / k; };
    const cpu = {}; for (const n of BUG_NAMES) { cpu[n] = +time((u) => bugs[n].set({ anim: 'bug', t: u * 3, beat: u * 6 })).toFixed(3); cpu[FEATURE_OF[n]] = +time((u) => feats[n].set({ anim: 'dance', t: u, beat: u * 2 })).toFixed(3);
      cpu['morph_' + n] = +time((u) => morphs[n].set({ u: 0.05 + 0.9 * u })).toFixed(2); cpu['draft_' + n] = +time((u) => drafts[n].set({ p: u })).toFixed(3); }
    cpu.eraser_mid = +time((u) => erasers.mid.set({ pink: u, face: u < 0.5 ? 'grumpy' : 'happy', blink: u > 0.9 ? 1 : 0 })).toFixed(3);
    console.log('[engine] [creatures] cpu ms per set() ' + JSON.stringify(cpu)); for (const g of all) g.visible = false; }
  // ---- round 2: UPRIGHT at the battle camera (3/4 high, el 0.45), morph from the live pose, wheel roll, upright drafts
  const BEL = 0.45, UP = { anim: 'idle', t: 1.0, stance: 'upright' };   // t 1.0: no creature is mid-blink
  for (const n of BUG_NAMES) { add(`up_${n}_front`, () => { const g = place(bugs[n], S, -AZ); g.set(UP); return frame(g, AZ, BEL, { margin: 1.08 }); });
    add(`up_${n}_34`, () => { const g = place(bugs[n], S, -AZ - 0.75); g.set(UP); return frame(g, AZ, BEL, { margin: 1.08 }); }); }
  for (const n of BUG_NAMES) for (let i = 0; i < 4; i++) add(`updance_${n}_${i}`, () => { const g = place(bugs[n], S, -AZ - 0.35); g.set({ anim: 'dance', t: i * 0.25, beat: i * 0.25 + 0.1, stance: 'upright' }); return frame(g, AZ, BEL, { margin: 1.5, dist: 38 }); });
  for (const n of BUG_NAMES) for (let i = 0; i < 4; i++) add(`upbug_${n}_${i}`, () => { const b = { firefly: [0.1, 0.6, 1.62, 2.55], moth: [0.3, 0.76, 0.9, 1.6], beetle: [0, 0.5, 1.0, 1.5], caterpillar: [0.5, 2.5, 4.5, 5.9], ladybug: [0, 0.25, 1.0, 1.6] }[n][i];
    const g = place(bugs[n], S, -AZ - 0.35); g.set({ anim: 'bug', t: b / 2, beat: b, stance: 'upright' }); return frame(g, AZ, n === 'beetle' ? 0.7 : BEL, { dist: n === 'beetle' ? 56 : n === 'caterpillar' ? 50 : 40 }); });
  add('lineup_upright', () => { BUG_NAMES.forEach((n, i) => { const g = place(bugs[n], S.clone().add(new THREE.Vector3(-8 + 4 * i, 0, -44 + 22 * i)), -AZ - 0.2); g.set({ ...UP, t: 0.4 + i }); }); return frame(Object.values(bugs), AZ, BEL, { margin: 0.95 }); });
  const POSE = { anim: 'dance', t: 0.3, beat: 0.6, stance: 'upright' };
  for (const n of BUG_NAMES) for (let i = 0; i < 8; i++) add(`morphpose_${n}_${i}`, () => { const g = place(morphs[n], S, -AZ - 0.35);
    const bb = [morphs[n].userData.bug, morphs[n].userData.feature]; g.set({ u: 0, from: POSE }); bb[1].visible = true; bb[1].set({}); const c = frame(bb, AZ, BEL, { margin: 1.25 });
    g.set({ u: i / 7, t: 0.3, from: POSE }); return c; });
  for (let i = 0; i < 4; i++) add(`wheelroll_${i}`, () => { const g = place(feats.beetle, S, -AZ + Math.PI / 2); g.set({ anim: 'roll', roll: i * 0.9 }); return frame(g, AZ, 0.25, { margin: 1.05 }); });
  for (const n of BUG_NAMES) add(`draftup_${n}`, () => { const g = place(drafts[n], S, -AZ - 0.35); g.set({ p: 1, ...UP }); return frame(g, AZ, BEL, { margin: 1.1 }); });
  for (let i = 0; i < 4; i++) add(`draftupp_ladybug_${i}`, () => { const g = place(drafts.ladybug, S, -AZ - 0.35); g.set({ p: (i + 1) / 4, ...UP }); return frame(g, AZ, BEL, { margin: 1.1 }); });
  console.log('[engine] [creatures] shots ' + JSON.stringify(SH.map((s, i) => [i, s.name])));

  const fx = { flash: 0, fade: 0 }; let cur = null; const ink = scene.getObjectByName('inkStrokes'); 
  return {
    stage: { kind: '3d', fx },
    W, shots: SH,
    update(t) {
      W.reset(); for (const g of all) g.visible = false;
      const u = t - t0; const k = Math.max(0, Math.min(SH.length - 1, Math.floor(u + 1e-6)));
      const c = SH[k].fn(u - k);
      const mountain = SH[k].name.startsWith('eraser_mountain');
      W.setSun(mountain ? SUN_DIR : REVIEW_SUN);
      if (ink) ink.visible = !mountain;   // the floating ink sculptures cross the mountain framing (dev page only; restored every frame)
      aimCam(cam, c.pos, c.tgt, c.fov);
      cur = { camera: cam, target: c.tgt, focus: c.tgt, shadowExtent: mountain ? 2600 : 120 };
      W.applyLook(t, LOOK({ rays: 0.2, dofAmount: mountain ? 0 : 0.12, atmos: mountain ? 1 : 0.3 }), cur);
    },
    render(t, target) { ctx.post.render(scene, cam, target); },
  };
}
function aimCam(cam, pos, tgt, fov) { cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(tgt); cam.fov = fov; cam.near = Math.max(0.3, pos.distanceTo(tgt) * 0.02); cam.far = 120000; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); }
