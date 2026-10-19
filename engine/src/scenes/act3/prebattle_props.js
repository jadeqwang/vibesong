// ACT III PRE-BATTLE props (86.385-107.15, act3.drop + act3.verse2). Owner: the PRE-BATTLE team (checkpoints/prebattle.md).
// Built once per shared world (W._pb) and parented to ONE root group that W.reset() hides again, so nothing here leaks
// into the battle (107.15+) or into Act IV / V frames. Scenes call PB.begin() in frame() and switch on what they use.
//
//   slabs[5]      Jade's graphite FIXTURES slabs (each its own paintable material: plaster = graphite, full = its hue)
//   trails[5]     the graphite slash ribbons in the air (setArc)
//   streaks[5]    the stroke's ground line from Jade to where the slab erupts
//   pings[5]      Charlie's waypoint pings (diamond + order number + ring + light pillar), the act3.turn look
//   blocks        room 1 remix plaster blocks (jade / charlie / ricky), paintable
//   cap           Charlie's flat cap as a 3D prop (the hat-trampoline), voxfig capGeo
//   letters       'b' (with the fresh eraser bite) / 'e' (toppled flat: the doorstep) / 'cause'; crumbs
//   bugs          ladybug, beetle, firefly, moth (creatures module, small scale)
//   glitch        missing-texture checker overlay for one avenue cypress (firefly plant)
// Helpers: heroJoints(g) (posed-joint overrides on voxfig figures), headTop(g), putHero(W, g, s) (keeps `hat`).
import * as THREE from 'three';
import { makeBug, VOXEL } from '../../core/creatures/index.js';
import { capGeo } from '../../core/voxfig.js';
import { raster } from '../../core/text.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { patchPaint } from './world/paint.js';
import { textTexture } from './world/props.js';
import { triplanarMaterial } from '../../materials.js';
import { marbleTexture } from './world/props.js';
import { MESA_A, PLASTER } from './world/build.js';

const C = (h) => new THREE.Color(h);
const shadowAll = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

// slab dims [w, h, d] (heroes: carve ~52, native ~69 tall: the slabs are ~1.6-2x a hero: monumental)
export const SLAB_DIMS = [[40, 104, 9], [36, 96, 8], [70, 124, 10], [38, 92, 8], [52, 110, 9]];
export const SLAB_HUE = ['#ff5a4e', '#ffb02e', '#3fc46a', '#2f8cff', '#a05cff'];

export async function ensurePB(W) {
  if (W._pb) return W._pb;
  const root = new THREE.Group(); root.name = 'prebattle'; W.scene.add(root);
  const hs = heroH(W, 'jade') / 52;                     // 1 = carved figures (~52 tall), ~1.3 = native
  const PB = { root, hs };

  // ---------------------------------------------------------------- slabs
  PB.slabMats = []; PB.slabs = [];
  PB.glowMat = new THREE.MeshBasicMaterial({ color: C('#ffe7b0'), toneMapped: false });
  for (const [i, [w, h, d]] of SLAB_DIMS.entries()) {
    const m = new THREE.MeshStandardMaterial({ color: C(SLAB_HUE[i]), roughness: 0.34, metalness: 0.25 });
    patchPaint(m, { plaster: 0x9a9aa2 }); PB.slabMats.push(m);
    const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), m); shadowAll(body); g.add(body);
    // pencil-hatch grooves on the face: thin darker bevels (reads as a drawn slab, not a monolith)
    const edge = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 1.6, d + 0.8), PB.glowMat); edge.position.y = h; edge.userData.noAO = true; g.add(edge);
    g.userData = { w, h, d, body, edge }; root.add(g); PB.slabs.push(g);
  }
  const engrave = (txt, w, col, glow) => { const t = textTexture(txt, { w: 1024, h: 256, font: '900 150px InterVar, sans-serif', color: col, glow });
    const mm = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }); const q = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), mm); q.userData.noAO = true; return q; };
  PB.fixtures = engrave('FIXTURES', 64, '#efe6d2'); PB.slabs[2].add(PB.fixtures); PB.fixtures.position.set(0, 86, SLAB_DIMS[2][2] / 2 + 0.3);
  PB.functions = engrave('FUNCTIONS', 48, '#fff4d6', 18); PB.slabs[4].add(PB.functions); PB.functions.position.set(0, 76, SLAB_DIMS[4][2] / 2 + 0.3);

  // ---------------------------------------------------------------- slash trails (ribbons) + ground streaks
  const N = 28;
  PB.trailMat = new THREE.MeshBasicMaterial({ color: C('#3c3c45'), side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false });
  PB.trailEdgeMat = new THREE.MeshBasicMaterial({ color: C('#c9c9d2').multiplyScalar(1.6), side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false });
  PB.trails = [0, 1, 2, 3, 4].map(() => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 2 * 3), 3));
    const idx = []; for (let k = 0; k < N; k++) { const a = 2 * k; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
    const m = new THREE.Mesh(geo, PB.trailMat); m.frustumCulled = false; m.userData.noAO = true;
    const e = new THREE.Mesh(geo, PB.trailEdgeMat); e.frustumCulled = false; e.userData.noAO = true; e.scale.setScalar(1); m.add(e); e.visible = false;
    root.add(m); m.userData.N = N; return m;
  });
  PB.streakMat = new THREE.MeshStandardMaterial({ color: C('#33333a'), roughness: 0.4, metalness: 0.3 }); patchPaint(PB.streakMat, { noPaint: true });
  PB.streaks = [0, 1, 2, 3, 4].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 3.2).translate(0.5, 0, 0), PB.streakMat); m.receiveShadow = true; root.add(m); return m; });

  // ---------------------------------------------------------------- Charlie's waypoint pings (act3.turn look) + order numbers
  const pingCol = C('#ffb02e');
  PB.pings = [1, 2, 3, 4, 5].map((n) => {
    const g = new THREE.Group();
    const dia = new THREE.Mesh(new THREE.OctahedronGeometry(7, 0), new THREE.MeshBasicMaterial({ color: pingCol.clone().multiplyScalar(2.2), toneMapped: false })); dia.scale.y = 1.5; g.add(dia);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(12, 1.2, 6, 32), new THREE.MeshBasicMaterial({ color: pingCol.clone().multiplyScalar(1.8), transparent: true, toneMapped: false, depthWrite: false })); ring.rotation.x = Math.PI / 2; g.add(ring);
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1, 8, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: pingCol.clone().multiplyScalar(1.5), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(pil);
    const tex = textTexture(String(n), { w: 128, h: 128, font: '900 104px InterVar, sans-serif', color: '#ffffff' });
    const num = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, toneMapped: false, depthWrite: false, color: C('#fff3dc').multiplyScalar(1.4) })); num.scale.set(12, 12, 1); g.add(num);
    for (const o of [dia, ring, pil, num]) o.userData.noAO = true;
    g.userData = { dia, ring, pil, num }; root.add(g); return g;
  });

  // ---------------------------------------------------------------- room 1 remix: plaster blocks (paintable)
  const stone = (col = '#efe2c8') => { const m = new THREE.MeshStandardMaterial({ color: C(col), roughness: 0.8 }); patchPaint(m, { plaster: PLASTER.stone }); return m; };
  PB.blocks = {};
  for (let [n, [w, h, d], col] of [['jade', [16, 22, 26], '#f5a27a'], ['charlie', [18, 18, 24], '#8fcfe6'], ['ricky', [30, 18, 26], '#dba6d6']]) {
    const m = stone(col); w *= hs; h *= hs; d *= hs; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), m); shadowAll(b); b.userData = { w, h, d, mat: m }; root.add(b); PB.blocks[n] = b;
  }

  // ---------------------------------------------------------------- Charlie's flat cap as a prop (hat-trampoline)
  { const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }); patchPaint(m, { noPaint: true, hero: true });
    PB.cap = new THREE.Mesh(capGeo(0.52), m); shadowAll(PB.cap); root.add(PB.cap); }

  // ---------------------------------------------------------------- because: b (bitten) | e (toppled flat, the doorstep) | cause
    const gMat = new THREE.MeshStandardMaterial({ color: 0x7c7c86, roughness: 0.42, metalness: 0.25 }); patchPaint(gMat, { noPaint: true });
  const smudgeMat = new THREE.MeshStandardMaterial({ color: 0xe9e3d6, roughness: 0.9, metalness: 0.0 }); patchPaint(smudgeMat, { noPaint: true });
  // monumental condensed pixel letters: cells cw x ch (tall), so b·e·cause fits across mesa A and stands ~1.5-2x a hero
  const CW = 5.8 * hs / 1.3, CH = 17.5 * hs / 1.3, DEPTH = Math.round(14 * hs / 1.3);
  const letterMesh = (text, bite = null) => {
    const r = raster({ text, font: 'fp12', color: '#ffffff' });
    const d = r.canvas.getContext('2d').getImageData(0, 0, r.w, r.h).data; const on = (x, y) => d[(y * r.w + x) * 4 + 3] > 0;
    let miny = 1e9, minx = 1e9, maxx = -1e9; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (on(x, y)) { miny = Math.min(miny, r.h - y - 1); minx = Math.min(minx, x); maxx = Math.max(maxx, x); }
    const A = [], B = []; const w = (maxx - minx + 1) * CW; let hmax = 0;
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
      if (!on(x, y)) continue;
      const gx = (x - minx + 0.5) * CW - w / 2, gy = (r.h - y - 1 - miny + 0.5) * CH; hmax = Math.max(hmax, gy + CH / 2);
      if (bite) {   // the bite is carved per sub-cell (4x8 per pixel) so its edge is round, not a missing pixel
        const sx = 4, sy = 8; for (let a = 0; a < sx; a++) for (let b = 0; b < sy; b++) {
          const cx = gx - CW / 2 + (a + 0.5) * CW / sx, cy = gy - CH / 2 + (b + 0.5) * CH / sy; const dd = Math.hypot(cx - bite.x, cy - bite.y);
          if (dd < bite.r) continue; (dd < bite.r + 3 ? B : A).push(new THREE.BoxGeometry(CW / sx, CH / sy, DEPTH * (dd < bite.r + 3 ? 1.02 : 1)).translate(cx, cy, 0)); }
        continue;
      }
      A.push(new THREE.BoxGeometry(CW, CH, DEPTH).translate(gx, gy, 0));
    }
    const g = new THREE.Group(); const m = new THREE.Mesh(mergeGeometries(A.map((x) => { x.deleteAttribute('uv'); return x; })), gMat); shadowAll(m); g.add(m);
    if (B.length) { const sm = new THREE.Mesh(mergeGeometries(B.map((x) => { x.deleteAttribute('uv'); return x; })), smudgeMat); shadowAll(sm); g.add(sm); }
    g.userData = { w, h: hmax, depth: DEPTH }; return g;
  };
  { const tmp = letterMesh('b'); const top = tmp.userData.h, bw = tmp.userData.w;
    const bite = { x: bw / 2 - 0.05 * bw, y: 0.7 * top, r: 0.62 * bw };   // a big round fresh bite out of the bowl's top-right corner
    PB.letterB = letterMesh('b', bite); PB.letterB.userData.bite = V3(bite.x, bite.y, 0); PB.letterB.userData.biteR = bite.r; }
  PB.letterE = letterMesh('e'); PB.letterCause = letterMesh('cause');
  for (const o of [PB.letterB, PB.letterE, PB.letterCause]) root.add(o);
  // eraser crumbs on the ground under the bite (pink-gray rubbings) + a few rolled crumbs on the b's foot
  { const geo = new THREE.BoxGeometry(2.4, 1.4, 1.8); const cm = new THREE.MeshStandardMaterial({ color: 0xd9a3a8, roughness: 0.9 }); patchPaint(cm, { noPaint: true });
    const N = 70; PB.crumbs = new THREE.InstancedMesh(geo, cm, N); let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const M4 = new THREE.Matrix4(); for (let i = 0; i < N; i++) { const a = rnd() * 6.28, rr = Math.pow(rnd(), 0.7) * 22 * hs / 1.3; const sc = (0.6 + rnd() * 0.9) * hs / 1.3;
      M4.compose(V3(Math.cos(a) * rr * 1.4, 0.7 * sc, Math.sin(a) * rr), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(), rnd() * 3, rnd())), V3(sc, sc, sc)); PB.crumbs.setMatrixAt(i, M4); }
    PB.crumbs.castShadow = true; PB.crumbs.receiveShadow = true; root.add(PB.crumbs); }
  console.log(`[engine] [prebattle] letters b ${PB.letterB.userData.w.toFixed(0)}x${PB.letterB.userData.h.toFixed(0)}, e ${PB.letterE.userData.w.toFixed(0)}x${PB.letterE.userData.h.toFixed(0)}, cause ${PB.letterCause.userData.w.toFixed(0)}x${PB.letterCause.userData.h.toFixed(0)}`);

  // ---------------------------------------------------------------- bug plants (creatures module, small)
  const onMaterial = (m) => patchPaint(m, { noPaint: true, hero: true });
  PB.bugs = {
    ladybug: makeBug('ladybug', { s: VOXEL * 0.26, onMaterial }),
    beetle: makeBug('beetle', { s: VOXEL * 0.5, onMaterial }),
    firefly: makeBug('firefly', { s: VOXEL * 0.5, onMaterial }),
    moth: makeBug('moth', { s: VOXEL * 0.8, onMaterial }),
  };
  for (const b of Object.values(PB.bugs)) { shadowAll(b); root.add(b); }

  // ---------------------------------------------------------------- the glitch overlay (missing-texture checker, Act I void)
  const GU = { uC: { value: new THREE.Vector3() }, uR: { value: 0 }, uCell: { value: 2.2 } };
  PB.glitchU = GU;
  const gm = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  gm.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, GU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGW = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW; uniform vec3 uC; uniform float uR, uCell;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 dv = vGW - uC; float ragged = fract(sin(dot(floor(vGW / uCell), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          // a ragged vertical streak on the bark around the firefly (hugs the surface: narrow across, tall along the trunk)
          float m = length(vec2(length(dv.xz) / 0.5, dv.y / 1.6)) / uR;
          if (m > 0.7 + 0.45 * ragged) discard;
          vec3 q = floor(vGW / uCell); float ch = mod(q.x + q.y + q.z, 2.0);
          diffuseColor.rgb = ch > 0.5 ? vec3(1.0, 0.0, 1.0) : vec3(0.02, 0.0, 0.03); }`);
  };
  gm.customProgramCacheKey = () => 'pb-glitch';
  PB.glitch = new THREE.Mesh(new THREE.BufferGeometry(), gm); PB.glitch.matrixAutoUpdate = false; PB.glitch.frustumCulled = false; PB.glitch.userData.noAO = true; root.add(PB.glitch);
  PB.glitchOn = (tree, center, r) => {
    PB.glitch.geometry = tree.geometry; tree.updateWorldMatrix(true, false); PB.glitch.matrix.copy(tree.matrixWorld); PB.glitch.matrixWorld.copy(tree.matrixWorld);
    GU.uC.value.copy(center); GU.uR.value = r; PB.glitch.visible = true;
  };

  // ---------------------------------------------------------------- per frame
  PB.begin = () => {
    root.visible = true;
    root.children.forEach((c) => (c.visible = false));
    for (const s of PB.slabs) { s.rotation.set(0, 0, 0); s.quaternion.identity(); s.scale.setScalar(1); }
    PB.glowMat.color.set('#ffe7b0').multiplyScalar(0); PB.fixtures.material.opacity = 1; PB.functions.material.opacity = 0;
  };
  // W.reset() hides the whole pre-battle set again (battle, Act IV and V never see it)
  { const r0 = W.reset; W.reset = function () { r0.call(this); root.visible = false; }; }
  root.visible = false;
  W._pb = PB; return PB;
}
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

/** set a slash ribbon: arc around centre c in the plane (dir, up); angles a0 -> a1 (rad); head/tail 0..1 of the arc; radius r */
export function setArc(m, c, dir, a0, a1, head, tail, r, width) {
  const N = m.userData.N; const pos = m.geometry.attributes.position; const up = V3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(dir, up).normalize();
  for (let k = 0; k <= N; k++) {
    const u = tail + (head - tail) * (k / N); const a = a0 + (a1 - a0) * u;
    const p = c.clone().addScaledVector(dir, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r);
    const taper = Math.sin(Math.PI * Math.min(1, Math.max(0, k / N))) ** 0.6; const w = width * (0.25 + 0.75 * taper) * (k / N);
    const nrm = p.clone().sub(c).normalize();
    const a1v = p.clone().addScaledVector(nrm, w * 0.5).addScaledVector(side, 0), b1v = p.clone().addScaledVector(nrm, -w * 0.5);
    pos.setXYZ(2 * k, a1v.x, a1v.y, a1v.z); pos.setXYZ(2 * k + 1, b1v.x, b1v.y, b1v.z);
  }
  pos.needsUpdate = true; m.geometry.computeBoundingSphere(); m.visible = head > tail;
}

/** posed joints of a voxfig hero group (after g.set / W.put): body / head / shoulders / hips / knees. null for sprites. */
export function heroJoints(g) {
  const orient = g.children[0]; const root = orient?.children?.find((c) => c.visible); if (!root || root.children.length < 2) return null;
  const body = root.children[0], legs = root.children[1];
  if (!body || body.children.length < 4 || !legs || legs.children.length < 2) return null;
  const hipR = legs.children[0], hipL = legs.children[1];
  return { root, body, head: body.children[1], shoulderR: body.children[2], shoulderL: body.children[3], elbowR: body.children[2].children[1], elbowL: body.children[3].children[1], legs, hipR, hipL, kneeR: hipR.children[1], kneeL: hipL.children[1] };
}
const D2R = Math.PI / 180;
/** override joint rotations (degrees, main swing = z like voxfig pose()) */
export function setJ(J, name, z = 0, x = 0, y = 0) { if (J && J[name]) J[name].rotation.set(x * D2R, y * D2R, z * D2R); }

const _box = new THREE.Box3();
/** world point on top of a hero's head (cap top for Charlie); x/z from the head joint */
export function headTop(g, out = new THREE.Vector3()) {
  g.updateWorldMatrix(true, true); _box.setFromObject(g);
  const J = heroJoints(g); if (J) { J.head.getWorldPosition(out); } else out.copy(g.position);
  out.y = Number.isFinite(_box.max.y) ? _box.max.y : g.position.y + 52; return out;
}
/** hero height in world units (carve ~52, native ~69): measured once per hero from the idle pose */
export function heroH(W, n) {
  W._pbH ||= {}; if (W._pbH[n]) return W._pbH[n];
  const g = W.heroes[n]; const vis = g.visible; W.put(g, { x: 0, y: 0, z: 0, anim: 'idle', t: 0, pencil: n === 'jade' });
  g.updateWorldMatrix(true, true); _box.setFromObject(g); const h = _box.max.y - _box.min.y; g.visible = vis; W._pbH[n] = Number.isFinite(h) && h > 10 ? h : 52; return W._pbH[n];
}
/** W.put that keeps Charlie's per-call `hat` (W.put drops it) */
export function putHero(W, g, s) {
  W.put(g, s); if (s.hat !== undefined && g.figure) { g.set({ anim: s.anim, t: s.t ?? 0, frame: s.frame ?? null, pencil: !!s.pencil, facing: s.facing ?? 1, x: s.x, y: s.y, hat: s.hat }); }
  return g;
}
export { MESA_A };

// =====================================================================================================================
// ROUND 4 (talos_r4): the rebuilt Talos rooms (docs/pages/talos_level.svg). Opt-in: R4 (the --figres 2.5 review path, or
// ?pb=r4); the default staging above is untouched. Everything hangs under R.root (inside PB.root, so W.reset() hides it).
//   R.figs        MotionFigures (core/motion) for the heroes: jade (hair down, pencils in hand), charlie, charlieNH (cap off), ricky
//   Crystal       a Talos-style connector: a glass crystal on a mount, an aim fin, a glow where beams meet, a sound-ring pulse
//   Dashes        a dotted line (instanced), for aim rays and Charlie's trail
//   Field         a force field (blue hex shimmer) that dissolves (open 0..1)
//   amp / receiver / gate / wall / slab / tripod / plate / socket builders
// =====================================================================================================================
import { loadMotionClips, MotionFigure } from '../../core/motion/index.js';
export { plan, headingTo, springCam, holdClock } from './talos_plan.js';
import { RES as FIG_RES } from '../../core/heromodels/heroes.js';
import { Beam } from './world/props.js';
import { R5 } from './common.js';
import { PAL } from '../../core/palette.js';

/** the round-4 staging switch: on for the 2.5 review path; ?pb=v2 | r4 (or globalThis.PB_STAGING) overrides */
export const R4 = (() => {
  let q = null; try { q = new URLSearchParams(globalThis.location?.search || '').get('pb'); } catch (e) { /* no location */ }
  q = q || globalThis.PB_STAGING || null; if (q === 'v2') return false; if (q === 'r4') return true; if (R5()) return true; return FIG_RES >= 2;   // r5 builds on the r4 path: --r5 alone picks it
})();

let _hatch = null;
/** pencil hatching (light strokes on transparent): laid over the graphite slabs so they read as drawn, not as grey pillars */
export function hatchTex() {
  if (_hatch) return _hatch;
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); let sd = 11; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) { const x = rnd() * 300 - 40, y = rnd() * 300 - 40, L = 30 + rnd() * 70; g.strokeStyle = `rgba(210,212,226,${0.10 + 0.22 * rnd()})`; g.lineWidth = 1 + rnd() * 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + L * 0.8, y - L * 0.6); g.stroke(); }
  for (let i = 0; i < 25; i++) { const x = rnd() * 256, y = rnd() * 256, L = 20 + rnd() * 40; g.strokeStyle = `rgba(20,20,26,${0.25 + 0.3 * rnd()})`; g.lineWidth = 1 + rnd(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + L * 0.6, y + L * 0.8); g.stroke(); }
  _hatch = new THREE.CanvasTexture(cv); _hatch.wrapS = _hatch.wrapT = THREE.RepeatWrapping; _hatch.colorSpace = THREE.SRGBColorSpace; return _hatch;
}
let _glowTex = null;
export function glowTex() {
  if (_glowTex) return _glowTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); _glowTex = new THREE.CanvasTexture(cv); _glowTex.colorSpace = THREE.SRGBColorSpace; return _glowTex;
}
const additive = (col, op = 1) => new THREE.MeshBasicMaterial({ color: C(col), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
/** shared stone (the world's triplanar marble + plaster tag: picks up world_look's k08b stone through patchPaint) */
export function r4Stone(color = '#efe3cc', plaster = PLASTER.stone) {
  const m = triplanarMaterial({ tex: marbleTexture(), scale: 0.02, bump: 0.5, color, roughness: 0.7 }); m.userData.plaster = plaster; patchPaint(m, { plaster }); return m;
}
export function r4Graphite(hue = '#9a9aa2', plaster = 0x9a9aa2) { const m = new THREE.MeshStandardMaterial({ color: C(hue), roughness: 0.36, metalness: 0.28 }); patchPaint(m, { plaster }); return m; }
/** dark glossy graphite (the FIXTURES slabs): plaster state = graphite, painted = its hue; + a hatch overlay mesh helper */
export function r4GraphiteDark(hue) { const m = new THREE.MeshStandardMaterial({ color: C(hue), roughness: 0.34, metalness: 0.12 }); patchPaint(m, { plaster: 0x6e6e78 }); return m; }
export function hatchOverlay(w, h, rep = 1) { const t = hatchTex().clone(); t.needsUpdate = true; t.repeat.set(w / 60 * rep, h / 60 * rep);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: true })); m.userData.noAO = true; return m; }
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
const cyl = (r0, r1, h, mat, seg = 16) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.castShadow = m.receiveShadow = true; return m; };

/** a Talos connector crystal. group origin = the mount's foot. crystal centre at userData.cy. */
export class Crystal extends THREE.Group {
  constructor({ r = 5, mountMat, color = '#ff5fd2', mount = true, fin = 1, glowK = 1, emiK = 1, faceted = false } = {}) {
    super(); this.r = r; this.col = C(color); this.glowK = glowK; this.emiK = emiK;
    this.mat = new THREE.MeshStandardMaterial({ color: C('#eef3ff'), roughness: 0.06, metalness: 0.15, emissive: C(color), emissiveIntensity: 0, transparent: true, opacity: 0.92 });
    patchPaint(this.mat, { noPaint: true });
    if (mount) { const cup = cyl(r * 0.55, r * 0.9, r * 0.8, mountMat || r4Graphite('#55555c'), 8); cup.position.y = r * 0.4; this.add(cup); }
    this.cy = mount ? r * 0.8 + r * 1.25 : 0;
    this.gem = new THREE.Mesh(faceted ? new THREE.IcosahedronGeometry(r, 0) : new THREE.OctahedronGeometry(r, 0), this.mat); this.gem.scale.y = faceted ? 1.15 : 1.35; this.gem.position.y = this.cy; this.gem.castShadow = true; this.add(this.gem);
    // aim fin: a short cone pointing local +x from the crystal (Talos connectors show which way they face)
    this.aim = new THREE.Group(); this.aim.position.y = this.cy; this.add(this.aim);
    const finM = new THREE.Mesh(new THREE.ConeGeometry(r * 0.32 * Math.max(fin, 0.1), r * 1.5 * Math.max(fin, 0.1), 6).rotateZ(-Math.PI / 2).translate(r * (0.9 + 0.75 * fin), 0, 0), new THREE.MeshStandardMaterial({ color: C('#ffc24a'), roughness: 0.3, metalness: 0.6, emissive: C('#ff9a20'), emissiveIntensity: 0.35 }));
    patchPaint(finM.material, { noPaint: true }); finM.castShadow = true; this.aim.add(finM); this.fin = finM; finM.visible = fin > 0;
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: this.col.clone().multiplyScalar(2.5), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true }));
    this.glow.position.y = this.cy; this.add(this.glow); this.glow.userData.noAO = true;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 48), additive(color, 1)); this.ring.position.y = this.cy; this.add(this.ring); this.ring.userData.noAO = true;
    this.reset();
  }
  reset() { this.mat.emissiveIntensity = 0; this.glow.visible = false; this.ring.visible = false; this.gem.rotation.set(0, 0, 0); return this; }
  /** world position of the crystal centre */
  centre(out = new THREE.Vector3()) { this.updateWorldMatrix(true, false); return out.set(0, this.cy, 0).applyMatrix4(this.matrixWorld); }
  /** point the aim fin at a world point (yaw + pitch) */
  aimAt(p) { const c = this.centre(); const d = p.clone().sub(c); const wq = new THREE.Quaternion(); this.getWorldQuaternion(wq);
    d.applyQuaternion(wq.invert()); this.aim.rotation.set(0, Math.atan2(-d.z, d.x), Math.atan2(d.y, Math.hypot(d.x, d.z)), 'YZX'); }
  aimYaw(yaw, pitch = 0) { this.aim.rotation.set(0, yaw, pitch, 'YZX'); }
  /** k 0..1 lit; spin: crystal turns slowly while powered */
  lit(k, t = 0) { this.mat.emissiveIntensity = 3.5 * k * this.emiK; this.glow.visible = k > 0.01 && this.glowK > 0; this.glow.scale.setScalar(this.r * (5 + 2.5 * k) * k * this.glowK); this.glow.material.opacity = Math.min(1, k * 1.2); this.gem.rotation.y = t * 1.6 * k; }
  /** sound-ring pulse: age (s) since a hit, axis = direction the ring faces (world); grows and fades over dur */
  pulse(age, axis, dur = 0.6, size = 1) {
    if (age < 0 || age > dur) { this.ring.visible = false; return; }
    const u = age / dur; this.ring.visible = true; this.ring.scale.setScalar(this.r * size * (1.4 + 5 * u)); this.ring.material.opacity = (1 - u) * (1 - u);
    const c = this.centre(); this.ring.lookAt(c.clone().add(axis)); }
}

/** a dotted line set: segments [[a, b, frac]] drawn as small cubes every `gap` units (instanced, max n) */
export class Dashes extends THREE.InstancedMesh {
  constructor(n = 240, { size = 1.6, color = '#ffb02e', glow = 1.6 } = {}) {
    super(new THREE.BoxGeometry(size, size * 0.6, size * 0.6), new THREE.MeshBasicMaterial({ color: C(color).multiplyScalar(glow), toneMapped: false, transparent: true, opacity: 0.95 }), n);
    this.frustumCulled = false; this.count = 0; this.userData.noAO = true; this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3();
  }
  set(segs, { gap = 6, phase = 0, scale = 1 } = {}) {
    let k = 0; const up = new THREE.Vector3(1, 0, 0);
    for (const [a, b, frac = 1] of segs) {
      const d = b.clone().sub(a); const L = d.length() * Math.max(0, Math.min(1, frac)); if (L < 0.5) continue; d.normalize(); this._q.setFromUnitVectors(up, d);
      for (let s = (phase % gap + gap) % gap; s < L && k < this.count + 1e9 && k < this.instanceMatrix.count; s += gap) {
        this._m.compose(a.clone().addScaledVector(d, s), this._q, this._s.setScalar(scale)); this.setMatrixAt(k++, this._m); }
    }
    this.count = k; this.instanceMatrix.needsUpdate = true; this.visible = k > 0; return this;
  }
}

/** force field: a hex shimmer plane w x h (origin bottom centre, faces +z); open 0..1 dissolves it from the bottom up */
export class Field extends THREE.Mesh {
  constructor(w, h, { color = '#5ab4ff' } = {}) {
    const U = { uT: { value: 0 }, uOpen: { value: 0 }, uCol: { value: C(color) }, uSize: { value: new THREE.Vector2(w, h) }, uFlash: { value: 0 } };
    const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uT, uOpen, uFlash; uniform vec3 uCol; uniform vec2 uSize;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){
          vec2 p = vUv * uSize / 5.0; vec2 r = vec2(1.0, 1.732); vec2 h = r * 0.5;
          vec2 a = mod(p, r) - h, b = mod(p - h, r) - h; vec2 g = dot(a, a) < dot(b, b) ? a : b;
          float edge = smoothstep(0.36, 0.5, max(abs(g.x) * 0.866 + abs(g.y) * 0.5, abs(g.y)));
          vec2 cell = p - g; float n = h21(floor(cell * 3.0));
          float scan = 0.5 + 0.5 * sin(vUv.y * uSize.y * 0.9 - uT * 9.0);
          float border = 1.0 - smoothstep(0.0, 0.06, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
          float a0 = 0.10 + 0.55 * edge + 0.12 * scan + 0.7 * border + uFlash;
          float dis = vUv.y + 0.25 * n;                       // dissolve: cells vanish from the bottom up
          float open = uOpen * 1.3; if (dis < open) discard;
          float rim = 1.0 - smoothstep(0.0, 0.08, dis - open);
          gl_FragColor = vec4(uCol * (a0 + 2.5 * rim * step(0.001, uOpen)), 1.0);
        }` });
    super(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), mat); this.U = U; this.userData.noAO = true; this.renderOrder = 2;
  }
  set(t, open, flash = 0) { this.U.uT.value = t; this.U.uOpen.value = open; this.U.uFlash.value = flash; this.visible = open < 0.999; return this; }
}

/** Ricky's fixed amp-emitter: plaster pedestal + amp cabinet + brass lens (faces local +x). userData.lens (local), jack (local) */
function makeAmp(stone) {
  const g = new THREE.Group(); const dark = new THREE.MeshStandardMaterial({ color: C('#2b2a30'), roughness: 0.6 }); patchPaint(dark, { noPaint: true });
  const grille = new THREE.MeshStandardMaterial({ color: C('#6b5a4a'), roughness: 0.9 }); patchPaint(grille, { noPaint: true });
  const brass = new THREE.MeshStandardMaterial({ color: C('#d6a950'), roughness: 0.25, metalness: 0.85 }); patchPaint(brass, { noPaint: true });
  const orange = new THREE.MeshStandardMaterial({ color: C('#ff8a2a'), roughness: 0.5, emissive: C('#ff6a00'), emissiveIntensity: 0 }); patchPaint(orange, { noPaint: true });
  g.add(box(22, 16, 20, stone, 0, 8, 0));
  g.add(box(18, 15, 16, dark, 0, 23.5, 0)); g.add(box(0.6, 11, 12, grille, 9.1, 23.5, 0)); g.add(box(0.8, 1.6, 16.4, orange, 9.2, 30, 0));
  const lens = cyl(3.2, 4.4, 6, brass, 16); lens.rotation.z = Math.PI / 2; lens.position.set(12.5, 23.5, 0); g.add(lens);
  const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(3, 20), new THREE.MeshBasicMaterial({ color: C('#ff5fd2').multiplyScalar(0.2), toneMapped: false })); lensGlass.rotation.y = Math.PI / 2; lensGlass.position.set(15.6, 23.5, 0); g.add(lensGlass);
  const knob = cyl(0.9, 0.9, 1.4, brass, 8); knob.rotation.z = Math.PI / 2; knob.position.set(-9.4, 26, 4); g.add(knob);
  g.userData = { lens: new THREE.Vector3(16, 23.5, 0), jack: new THREE.Vector3(-9.4, 21, -4), lensMat: lensGlass.material, stripe: orange };
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
/** receiver: a plaster post with a ring holder and a crystal (dark until lit). origin = foot. */
function makeReceiver(stone, { h = 34, color = '#ff5fd2' } = {}) {
  const g = new THREE.Group(); g.add(box(14, 4, 14, stone, 0, 2, 0)); const post = cyl(4.6, 5.4, h, stone, 14); post.position.y = 4 + h / 2; g.add(post);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(8, 1.5, 8, 28), stone); ring.position.y = 4 + h + 10; ring.castShadow = true; g.add(ring);
  const cr = new Crystal({ r: 4.6, mount: false, color }); cr.position.y = 4 + h + 10; g.add(cr); g.userData = { crystal: cr, ring };
  return g;
}
/** gate with a force field: two posts, lintel, three lamps; origin = bottom centre, the opening faces +z */
function makeGate(stone, { w = 46, h = 84 } = {}) {
  const g = new THREE.Group(); const P = 10;
  g.add(box(P, h + 6, P + 2, stone, -w / 2 - P / 2, (h + 6) / 2, 0)); g.add(box(P, h + 6, P + 2, stone, w / 2 + P / 2, (h + 6) / 2, 0));
  g.add(box(w + 2 * P + 8, 10, P + 6, stone, 0, h + 11, 0));
  const lamps = [-1, 0, 1].map((k) => { const m = new THREE.MeshStandardMaterial({ color: C('#3a3540'), roughness: 0.2, emissive: C('#ffd27a'), emissiveIntensity: 0 }); patchPaint(m, { noPaint: true });
    const l = new THREE.Mesh(new THREE.SphereGeometry(3, 14, 10), m); l.position.set(k * 15, h + 11, P / 2 + 3.2); g.add(l); return l; });
  const field = new Field(w, h); g.add(field);
  g.userData = { lamps, field, w, h };
  return g;
}
/** a ground conduit (Talos cable groove): polyline of world points, lit as a flowing dashed glow (Dashes) */

/** upright tripod (Talos connector stand): three legs splay DOWN from the head to the ground, the crystal on top.
 *  origin = ground centre. set(splay 0..1): 0 = legs folded together (carried), 1 = planted */
export class Tripod extends THREE.Group {
  constructor({ H = 42, r = 13, color = '#ff5fd2' } = {}) {
    super(); this.H = H; this.r = r;
    const wood = new THREE.MeshStandardMaterial({ color: C('#d7c09a'), roughness: 0.7 }); patchPaint(wood, { noPaint: true });
    const dark = new THREE.MeshStandardMaterial({ color: C('#5a5048'), roughness: 0.38, metalness: 0.55 }); patchPaint(dark, { noPaint: true });
    this.legs = [0, 1, 2].map((k) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.8, 1, 7).translate(0, -0.5, 0), wood); m.castShadow = true; this.add(m); return m; });
    this.feet = [0, 1, 2].map(() => { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.6, 8), dark); this.add(f); return f; });
    this.head = new THREE.Group(); this.add(this.head);
    { const hub = cyl(1.9, 2.3, 2.6, dark, 12); hub.position.y = 0; const cup = cyl(2.0, 1.2, 1.8, dark, 12); cup.position.y = 2.2; const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.3, 6, 18), dark); ring.rotation.x = Math.PI / 2; ring.position.y = 3.1; this.head.add(hub, cup, ring); }
    this.crystal = new Crystal({ r: 1.9, mount: false, color, fin: 0, glowK: 0, emiK: 0.12, faceted: true }); this.add(this.crystal); this.crystal.mat.color.set('#f4f8ff'); this.crystal.mat.opacity = 0.85;
    this.set(1);
  }
  set(splay, yaw = 0) {
    const H = this.H, r = 1.6 + (this.r - 1.6) * splay, top = new THREE.Vector3(0, H, 0);
    this.legs.forEach((m, k) => { const a = yaw + k * 2.0944; const foot = new THREE.Vector3(Math.cos(a) * r, (1 - splay) * 4, Math.sin(a) * r);
      const d = foot.clone().sub(top); m.position.copy(top); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().normalize()); m.scale.set(1, d.length(), 1); this.feet[k].position.copy(foot); });
    this.head.position.set(0, H + 1.2, 0); this.crystal.position.set(0, H + 1.2 + 3.1 + 2.0, 0); return this;
  }
  centre(out = new THREE.Vector3()) { return this.crystal.centre(out); }
}

export async function ensureR4(W, ctx) {
  if (W._r4) return W._r4;
  const PB = await ensurePB(W);
  const root = new THREE.Group(); root.name = 'talos_r4'; PB.root.add(root);
  const R = { root, PB, hs: PB.hs };
  R.clips = await loadMotionClips();
  // ---- heroes (MotionFigures; full colour, never plaster; hero lighting)
  const heroMat = () => { const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); m.userData.noPaint = true; patchPaint(m, { noPaint: true, hero: true }); return m; };
  R.figs = { jade: new MotionFigure(ctx.lib, 'jade', { variant: 'jade_down', material: heroMat() }), charlie: new MotionFigure(ctx.lib, 'charlie', { material: heroMat() }),
    charlieNH: new MotionFigure(ctx.lib, 'charlie', { variant: 'charlie_nohat', material: heroMat() }), ricky: new MotionFigure(ctx.lib, 'ricky', { material: heroMat() }) };
  for (const f of Object.values(R.figs)) { root.add(f.group); f.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
  R.unit = R.figs.jade.unit;
  const stone = r4Stone('#efe3cc'), rock = r4Stone('#d9ccb4', PLASTER.rock); R.stone = stone; R.rock = rock;
  R.beams = [0, 1, 2].map(() => { const b = new Beam({ radius: 1.15, color: '#ff5fd2', intensity: 6 }); root.add(b); return b; });
  R.dashes = [0, 1, 2, 3].map((k) => { const d = new Dashes(260, { color: k === 0 ? '#ffb02e' : '#ff8fe0', size: k === 0 ? 1.7 : 1.2 }); root.add(d); return d; });
  R.makeAmp = () => { const a = makeAmp(stone); root.add(a); return a; };
  R.makeReceiver = (o) => { const a = makeReceiver(stone, o); root.add(a); return a; };
  R.makeGate = (o) => { const a = makeGate(stone, o); root.add(a); return a; };
  R.makeCrystal = (o) => { const c = new Crystal(o); root.add(c); return c; };
  R.add = (o) => { root.add(o); return o; };
  R.box = box; R.cyl = cyl; R.graphite = r4Graphite; R.graphiteDark = r4GraphiteDark; R.hatch = hatchOverlay;
  // cable from a guitar jack to an amp: 14 short cylinder segments (catenary), set per frame
  R.cable = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: C('#1c1c22'), roughness: 0.6 }); patchPaint(m, { noPaint: true });
    for (let k = 0; k < 14; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1, 6), m); s.castShadow = true; R.cable.add(s); } root.add(R.cable); }
  R.setCable = (a, b, sag = 14) => { const n = R.cable.children.length; const P = (u) => a.clone().lerp(b, u).add(new THREE.Vector3(0, -sag * 4 * u * (1 - u), 0));
    R.cable.visible = true; R.cable.children.forEach((s, k) => { const p0 = P(k / n), p1 = P((k + 1) / n); const d = p1.clone().sub(p0); s.position.copy(p0).add(p1).multiplyScalar(0.5); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); s.scale.set(1, d.length() + 0.3, 1); }); };
  // a glow sprite pool (beam hits / crystal meets)
  R.glows = Array.from({ length: 8 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: C('#ff9ae6').multiplyScalar(2.2), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true })); s.userData.noAO = true; root.add(s); return s; });
  R.glowAt = (k, p, size, op = 1) => { const s = R.glows[k]; s.visible = true; s.position.copy(p); s.scale.setScalar(size); s.material.opacity = op; };
  // crosshair dot (first-person shot): its own 2D overlay scene
  { const sc = new THREE.Scene(); const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1); const asp = ctx.width / ctx.height;
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.02, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthTest: false })); dot.scale.x = 1 / asp;
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.027, 28), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthTest: false })); rim.scale.x = 1 / asp;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.042, 0.052, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false })); ring.scale.x = 1 / asp;
    const g = new THREE.Group(); g.add(rim, dot, ring); sc.add(g); R.cross = { scene: sc, cam, dot, rim, ring, g, asp }; }
  R.begin = () => {
    root.visible = true; root.children.forEach((c) => (c.visible = false));
  };
  W._r4 = R; return R;
}


// ------------------------------------------------------------------------------------------------ talos_r4 collision dump (dev)
// Off unless engine/out/dev/talos_dump.json exists (fetched once). When on, every R4 frame logs one '[engine] TDUMP {...}' line:
// the drawn beam segments, the solid props (one OBB per mesh: matrixWorld + geometry box) and the heroes (vertical capsules), for
// talos_plan.js collisionReport (node). Relays (Crystal instances) and glow / additive / line meshes are not solids.
let DUMP = null;
/** an instanced voxel surface (the stroke bridge) as local boxes per 6-unit x bin (cached: the instances are static) */
const _bins = new WeakMap();
function instBins(o) { if (_bins.has(o)) return _bins.get(o); const m = new THREE.Matrix4(), p = new THREE.Vector3(); const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const h = g.boundingBox.max.clone().sub(g.boundingBox.min).multiplyScalar(0.5);
  const B = new Map(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); p.setFromMatrixPosition(m); const k = Math.floor(p.x / 6); const b = B.get(k) || { lo: [1e9, 1e9, 1e9], hi: [-1e9, -1e9, -1e9] };
    [p.x, p.y, p.z].forEach((v, j) => { const e = [h.x, h.y, h.z][j]; b.lo[j] = Math.min(b.lo[j], v - e); b.hi[j] = Math.max(b.hi[j], v + e); }); B.set(k, b); }
  const out = [...B.values()]; _bins.set(o, out); return out; }
export async function dumpInit() { if (DUMP !== null) return DUMP; try { const r = await fetch('/out/dev/talos_dump.json'); DUMP = r.ok; } catch { DUMP = false; } return DUMP; }
const r2 = (v) => Math.round(v * 100) / 100;
function worldVisible(o) { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; }
function underCrystal(o) { for (let q = o; q; q = q.parent) if (q instanceof Crystal || q.userData?.relay) return true; return false; }
/** solids: { name: Object3D }; heroes: { name: Object3D (figure group) }; beams: { name: Beam group } */
export function talosDump(t, { solids = {}, heroes = {}, beams = {}, room = '', camera = null, supports = {}, states = {} }) {
  if (!DUMP) return;
  const fr = new THREE.Frustum(); if (camera) { camera.updateMatrixWorld(); fr.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)); }
  const seen = (box) => (camera ? fr.intersectsBox(box) : true); const sb = new THREE.Box3();
  const out = { t: r2(t), room, beams: [], solids: [], heroes: [] }; const a = new THREE.Vector3(), b = new THREE.Vector3();
  for (const [n, B] of Object.entries(beams)) { if (!B || !worldVisible(B)) continue; const segs = [];
    for (const [c] of B.segs || []) { if (!c.visible || c.scale.x < 0.02) continue; c.updateWorldMatrix(true, false); a.set(0, -0.5, 0).applyMatrix4(c.matrixWorld); b.set(0, 0.5, 0).applyMatrix4(c.matrixWorld); sb.makeEmpty().expandByPoint(a).expandByPoint(b); segs.push([...a.toArray(), ...b.toArray()].map(r2).concat(seen(sb) ? 1 : 0)); }
    if (segs.length) out.beams.push({ n, segs }); }
  for (const [n, root] of Object.entries(solids)) { if (!root || !worldVisible(root)) continue; root.updateWorldMatrix(true, true); let k = 0;
    root.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || !worldVisible(o) || underCrystal(o)) return; const m = o.material;
      if (m && (m.blending === THREE.AdditiveBlending || m.depthWrite === false || (m.transparent && m.opacity < 0.6))) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; if (!isFinite(bb.min.x)) return;
      out.solids.push({ n: n + '#' + (k++), m: o.matrixWorld.elements.map(r2), lo: bb.min.toArray().map(r2), hi: bb.max.toArray().map(r2) }); }); }
  const hb = new THREE.Box3();
  // walkable surfaces (one OBB per mesh, same format as solids)
  out.sup = []; for (const [n, root] of Object.entries(supports)) { if (!root || !worldVisible(root)) continue; root.updateWorldMatrix(true, true); let k = 0;
    root.traverse((o) => { if (!o.isMesh || !o.geometry || !worldVisible(o)) return;
      if (o.isInstancedMesh) { const bins = instBins(o); for (const b of bins) out.sup.push({ n: n + '#' + (k++), m: o.matrixWorld.elements.map(r2), lo: b.lo.map(r2), hi: b.hi.map(r2) }); return; }
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox; if (!isFinite(bb.min.x)) return;
      out.sup.push({ n: n + '#' + (k++), m: o.matrixWorld.elements.map(r2), lo: bb.min.toArray().map(r2), hi: bb.max.toArray().map(r2) }); }); }
  const fp = new THREE.Vector3();
  for (const [n, h] of Object.entries(heroes)) { const g = h?.isObject3D ? h : h?.group; if (!g || !worldVisible(g)) continue; g.updateWorldMatrix(true, true); hb.makeEmpty(); g.traverseVisible((o) => { if (!o.isMesh || !o.geometry) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); hb.union(sb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); }); const st = states[n]; const feet = [];
    if (h?.foot) for (const sd of ['R', 'L']) { const f = h.foot[sd]; if (!f?.parent) continue; f.parent.updateWorldMatrix(true, false); const pts = [f.heel, f.toe].map((q) => fp.copy(q).applyMatrix4(f.parent.matrixWorld).toArray().map(r2));
      feet.push({ sd, heel: pts[0], toe: pts[1], c: st?.src?.[0]?.['c' + sd] ?? null }); }
    out.heroes.push({ n, x: r2(g.position.x), z: r2(g.position.z), y0: r2(hb.min.y), y1: r2(hb.max.y), vis: seen(hb) ? 1 : 0, air: st ? (st.air ? 1 : 0) : null, feet }); }
  console.log('[engine] TDUMP ' + JSON.stringify(out));
}


// =====================================================================================================================
// ROUND 5 (talos_r5, docs/game_design_half2_r5.md): props for the re-staged Room A and the Room 2 / Room B additions. Opt-in
// through R5() (common.js; the R4 switch above is on too, so one flag picks the whole r5 path). Built once under R.root.
//   makeStub      the eaten road: a causeway stub whose end is cut by the eraser's arc, a pale smudge lip, a crumb pile
//   makeStele     a broken stele with the carved prompt (text decal: world/props textTexture on a plane, polygon-offset)
//   makePlate / makeSocket   the Room B plate / socket builders shared with Room A (the socket has a hole: the receiver rises out)
//   canopy        Charlie's cap as the parachute (voxfig capGeo on the cap's material) + four strings
//   makeHousing   the lift's gear housing (an open cage with a cog) + its checker skin (Act I's missing-texture colours,
//                 PAL.missingA/B, world-space cells) + two glitch rings
//   makeStrut     the 丿 stroke: a slanted graphite strut carrying a Crystal at its tip
// =====================================================================================================================
export function ensureR5(R) {
  if (R.r5) return R.r5;
  const root = R.root, PB = R.PB, Q = {}; const stone = R.stone;
  const smudge = new THREE.MeshStandardMaterial({ color: 0xe9e3d6, roughness: 0.92 }); patchPaint(smudge, { noPaint: true });
  const crumbMat = new THREE.MeshStandardMaterial({ color: 0xd9a3a8, roughness: 0.9 }); patchPaint(crumbMat, { noPaint: true });
  Q.makeStub = ({ x0, x1, z0, z1, bite }) => {
    const sh = new THREE.Shape(); sh.moveTo(x0, z0); sh.lineTo(x1, z0); sh.lineTo(x1, z1);
    const dx = Math.sqrt(Math.max(0, bite.r * bite.r - (bite.z - z1) ** 2)); const xa = Math.min(x1, bite.x + dx), xb = Math.max(x0, bite.x - dx);
    const a0 = Math.atan2(z1 - bite.z, xa - bite.x), a1 = Math.atan2(z1 - bite.z, xb - bite.x); const da = a1 - a0 - (a1 > a0 ? 2 * Math.PI : 0);   // sweep through the near side (-z)
    const arc = []; const N = 30; for (let i = 0; i <= N; i++) { const a = a0 + da * i / N; arc.push([bite.x + Math.cos(a) * bite.r, bite.z + Math.sin(a) * bite.r]); }
    sh.lineTo(xa, z1); for (const [x, z] of arc.slice(1)) sh.lineTo(x, z); sh.lineTo(xb, z1); sh.lineTo(x0, z1); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 222, bevelEnabled: false }); geo.rotateX(Math.PI / 2); geo.deleteAttribute('uv');
    const m = new THREE.Mesh(geo, stone); m.castShadow = m.receiveShadow = true; root.add(m);
    // the eraser's lip: a pale smudge band inside the arc on the top face
    { const pos = []; const idx = []; for (let i = 0; i < arc.length; i++) { const [x, z] = arc[i]; const nx = (bite.x - x) / bite.r, nz = (bite.z - z) / bite.r;   // inward = toward the bite centre... the stone is on the far side: band goes outward from the arc
        pos.push(x, 0.12, z, x - nx * 7, 0.12, z - nz * 7); if (i) { const a = 2 * (i - 1); idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const lip = new THREE.Mesh(g, smudge); lip.receiveShadow = true; lip.userData.noAO = true; root.add(lip); m.userData.lip = lip; }
    // the crumb pile: rubbings heaped along the lip (denser at the bite's deepest point), a few rolled back onto the road
    { const geo2 = new THREE.BoxGeometry(2.2, 1.3, 1.7); const N2 = 110; const inst = new THREE.InstancedMesh(geo2, crumbMat, N2); let sd = 19; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
      const M4 = new THREE.Matrix4(); for (let i = 0; i < N2; i++) { const u = Math.pow(rnd(), 1.4) * (rnd() < 0.5 ? 1 : -1); const a = a0 + da * (0.5 + 0.5 * u); const rr = bite.r + 2 + Math.pow(rnd(), 0.8) * 12 * (i < 95 ? 1 : 3); const sc = 0.55 + rnd() * 0.9;
        const x = bite.x + Math.cos(a) * rr, z = bite.z + Math.sin(a) * rr; const y = 0.6 * sc + (rr < bite.r + 6 ? rnd() * 2.4 : 0);
        M4.compose(V3(x, y, Math.max(z0 + 2, z)), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(), rnd() * 3, rnd())), V3(sc, sc, sc)); inst.setMatrixAt(i, M4); }
      inst.castShadow = true; inst.receiveShadow = true; root.add(inst); m.userData.crumbs = inst; }
    return m;
  };
  Q.makeStele = (lines, { w = 24, h = 46, d = 6 } = {}) => {
    const g = new THREE.Group();
    g.add(box(w, h, d, stone, 0, h / 2, 0));
    const brk = box(w * 0.5, 9, d + 0.3, stone, -w * 0.24, h + 2.5, 0); brk.rotation.z = 0.22; g.add(brk);                 // the jagged break
    const cap = box(w * 0.66, 11, d, stone, w * 0.95, 5.2, 7); cap.rotation.set(0.18, 0.55, 1.18); g.add(cap);               // the broken-off top at its foot
    const tex = textTexture(lines, { w: 1024, h: 340, font: '600 112px InterVar, "Droid Sans Fallback", sans-serif', color: '#36323a', stroke: '#f3ebd8', lineH: 1.12 });
    const mm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: true });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, w * 0.94 * 340 / 1024), mm); q.userData.noAO = true; q.position.set(0, h * 0.72, -d / 2 - 0.45); q.rotation.y = Math.PI; g.add(q);   // 0.45 off the face: the triplanar stone z-fought a closer decal at grazing angles
    g.userData = { text: q }; root.add(g); return g;
  };
  Q.makePlate = () => { const g = new THREE.Group(); const edgeMat = new THREE.MeshBasicMaterial({ color: C('#ffd27a'), toneMapped: false });
    g.add(box(34, 1.2, 34, stone, 0, 0.6, 0)); const slab = box(26, 3, 26, stone, 0, 1.5, 0); g.add(slab);
    for (const [x, z, w, d] of [[0, 15.5, 31, 1.2], [0, -15.5, 31, 1.2], [15.5, 0, 1.2, 31], [-15.5, 0, 1.2, 31]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, d), edgeMat); e.position.set(x, 1.3, z); e.userData.noAO = true; g.add(e); }
    g.userData = { slab, edgeMat }; root.add(g); return g; };
  Q.makeSocket = () => { const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(13, 15.5, 40), new THREE.MeshBasicMaterial({ color: C('#ff9ae6').multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0.9, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.45; ring.userData.noAO = true; g.add(ring);
    g.add(box(30, 0.6, 30, r4Graphite('#77777f'), 0, 0, 0));
    const hole = new THREE.Mesh(new THREE.CircleGeometry(9.5, 28), new THREE.MeshBasicMaterial({ color: C('#0b0a10'), toneMapped: false })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.4; hole.userData.noAO = true; g.add(hole);
    g.userData = { ring, hole }; root.add(g); return g; };
  // Charlie's cap as the parachute canopy + four strings to his hands
  { Q.canopy = new THREE.Mesh(capGeo(0.52), PB.cap.material); Q.canopy.castShadow = true; root.add(Q.canopy);
    const sm = new THREE.MeshStandardMaterial({ color: C('#5a3a18'), roughness: 0.7 }); patchPaint(sm, { noPaint: true });
    Q.strings = [0, 1, 2, 3].map(() => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1, 5).translate(0, 0.5, 0), sm); s.castShadow = true; root.add(s); return s; }); }
  Q.setString = (k, a, b) => { const s = Q.strings[k]; const d = b.clone().sub(a); s.visible = true; s.position.copy(a); s.scale.set(1, Math.max(0.1, d.length()), 1); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
  // the missing-texture checker (Act I's colours), world-space cells; used as a flickering skin on glitching props
  Q.checkerMat = (cell = 2.0) => { const gm = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -4 });
    const U = { uCell: { value: cell }, uA: { value: C(PAL.missingA) }, uB: { value: C(PAL.missingB) } };
    gm.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGW = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW; uniform vec3 uA, uB; uniform float uCell;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n{ vec3 q = floor(vGW / uCell); diffuseColor.rgb = mod(q.x + q.y + q.z, 2.0) > 0.5 ? uA : uB; }'); };
    gm.customProgramCacheKey = () => 'r5-checker'; gm.userData.U = U; return gm; };
  Q.makeHousing = (w = 22) => { const g = new THREE.Group(); const dark = r4Graphite('#4a4a52', 0x4a4a52);
    g.add(box(w, 1.2, w, dark, 0, 0.6, 0)); g.add(box(w, 1.6, w, dark, 0, w * 0.7, 0));
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(1.6, w * 0.7, 1.6, dark, x * (w / 2 - 0.8), w * 0.35, z * (w / 2 - 0.8)));
    for (let k = -2; k <= 2; k++) for (const sd of [-1, 1]) { g.add(box(0.6, w * 0.7, 0.6, dark, k * w / 6, w * 0.35, sd * (w / 2 - 0.3))); g.add(box(0.6, w * 0.7, 0.6, dark, sd * (w / 2 - 0.3), w * 0.35, k * w / 6)); }
    const cog = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.3, w * 0.3, 1.6, 12), dark); cog.position.y = w * 0.7 + 1.6; cog.castShadow = true; g.add(cog);
    const skin = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, w * 0.7 + 2.4, w + 0.6).translate(0, w * 0.35 + 0.6, 0), Q.checkerMat()); skin.visible = false; skin.userData.noAO = true; g.add(skin);
    const rings = [0, 1].map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 40), additive('#ff5fd2', 1)); r.rotation.x = -Math.PI / 2; r.position.y = w * 0.35; r.visible = false; r.userData.noAO = true; g.add(r); return r; });
    g.userData = { cog, skin, rings, w }; root.add(g); return g; };
  // the 丿 stroke: a slanted graphite strut (local: from the origin toward (dx, -dy, dz)) with a Crystal mounted at its tip
  Q.makeStrut = (dir, mat, { r = 6.5, fin = 1.8 } = {}) => { const g = new THREE.Group(); const L = dir.length();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(5, L, 5).translate(0, L / 2, 0), mat); bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()); bar.castShadow = bar.receiveShadow = true; bar.userData.relay = true; g.add(bar);   // the crystal's mount arm: not a solid for the beam check (the beam ends in the crystal it carries)
    const crystal = new Crystal({ r, fin }); crystal.position.copy(dir); g.add(crystal); g.userData = { bar, crystal, L }; return g; };
  // the cap-rider ladybug (battle_r5's hand-over spec: s VOXEL * 0.6, crawl, origin at the cap crown + (-3, -1.5, 0), rotation.y 0.4, idle)
  Q.ladybug = makeBug('ladybug', { s: VOXEL * 0.6, stance: 'crawl', onMaterial: (m) => patchPaint(m, { noPaint: true, hero: true }) }); shadowAll(Q.ladybug); root.add(Q.ladybug);
  /** put the rider on a MotionFigure's cap: bbox top of the figure (the cap crown), x / z from the head joint */
  const _hb = new THREE.Box3();
  Q.rideCap = (fig, t) => { const g = fig.group; g.updateWorldMatrix(true, true); const h = fig.F.J.head.getWorldPosition(V3(0, 0, 0));
    if (fig._capUp == null) { _hb.setFromObject(fig.F.J.head); fig._capUp = Number.isFinite(_hb.max.y) ? _hb.max.y - h.y : 10; }   // the cap crown above the head joint, measured once (the figure bbox would include the guitar neck when he bends)
    const lb = Q.ladybug; lb.visible = true; lb.position.set(h.x - 3, h.y + fig._capUp - 1.5, h.z); lb.rotation.set(0, 0.4, 0); lb.set({ anim: 'idle', t, stance: 'crawl' }); return lb; };
  R.r5 = Q; return Q;
}
