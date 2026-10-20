// (v4b stage_3d) DROP 2 · the carved slabs again (targets assets/v4_stills/09 / 10, reversed for a front-on hero shot).
// Drop 2 is the aerial (act5/aerial.js: photoreal plates, the graphite redraw on FIXTURES!, colour back on FUNCTIONS!). On each accent
// the aerial cuts to this insert in the shared TALOS world (the coloured world after the flood), on mesa B's stage:
//   180.21 -> 181.125  FIXTURES!  the trio FRONT-ON (Charlie left, Jade centre, Ricky right) shouting it; behind them a graphite slab
//                      slams up out of the stage with FIXTURES carved into it (the biggest thing in frame), dust + chips
//   183.30 -> 183.87   FUNCTIONS! the same framing, the slab slams up again with FUNCTIONS: the grooves fill with rainbow light left
//                      to right on the accent; then the aerial's dive takes over
// Front-on = the drop-2 section's front-on medium of Jade (the critique: every 3D section has one). Pure function of t.
//
//   const ins = await makeSlabInsert(ctx); ins.window(t) -> null | 'fix' | 'fun'; ins.update(t); ins.render(t, target)
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { G } from '../../util.js';
import { getWorld, MESA_B } from './world/build.js';
import { make3D, V, aim, persp, smooth, clamp01, LOOK } from './common.js';
import { makeCarvedFace } from './carved_slab.js';
import { r5ShotClear } from '../../look.js';
import { Beam, Burst } from './world/props.js';

export const INSERTS = { fix: [180.21, 181.125], fun: [183.30, 183.87] };
const top = MESA_B.top;
const SLAB = { c: V(1436, top, 432), w: 230, h: 160, d: 16 };            // standing across the stage front (in front of the arch), facing the seats (-x)
const TRIO = { charlie: V(1388, top, 400), jade: V(1376, top, 432), ricky: V(1388, top, 464) };
const RISE = 0.17;
// (M3) the slab's graphite stone; the SUN rakes across it from the upper left (k08b's per-frame LOOK override: azimuth turn 108 from the
// world's sun = front-left of the slab, elevation 26), so the trio + the slab share one key and real shadows; SLAB_KEY = the carved face's
// own extra key along the same direction (slab-local)
// (v45_accents) THE GUITARS CAUSE THE SLABS. 'new' = each insert opens ON a big downstroke (the shot's first frame IS the hit; the
// slab rises from that frame): Charlie's strum slams FIXTURES up (a swoosh along his stroke, a shock ring off his guitar, a dust ring
// racing across the stage floor to the slab foot); Ricky's chord lights FUNCTIONS (rainbow swoosh, sparks off his Strat, a rainbow
// spark trail arcs from it to the F, where the groove fill starts, then his victory fist). Follow-through, then real 8th strums.
// 'off' = v4.4 (both toggle a 2-frame chord on the 8ths, no cause). Backup engine/out/bak_v45/v45_accents/slab_insert.js.v44.
export const SLAB_STRUM = 'new';
const SLAB_STONE = '#7a7882', SLAB_SUN = { k8SunAz: 108, k8SunElev: 26 }, SLAB_KEY = 0.6, SLAB_KEYDIR = new THREE.Vector3(-0.71, 0.44, 0.40);

// ---------------------------------------------------------------- (v45_accents) the big strum, for native figures (also used by battle.js)
// Copies of voxfig.js ikArm / guitarPt (not exported there; core is read-only for this unit). Call strumPose AFTER g.set({ anim: 'chord' }).
const _w = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3()); const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(); const _pt = new THREE.Vector3();
function ikArm(F, sd, target, pole) {
  const J = F.J, sh = J['shoulder' + sd], el = J['elbow' + sd], hd = J['hand' + sd];
  if (sh.parent !== J.body) { const c = sh.parent; c.updateMatrix(); target = target.clone().applyMatrix4(new THREE.Matrix4().copy(c.matrix).invert()); pole = pole.clone().applyQuaternion(c.quaternion.clone().invert()); }
  const E0 = el.position, Hh = hd.parent === el ? hd.position : _w[5].copy(hd.position).applyQuaternion(hd.parent.quaternion).add(hd.parent.position);
  const Tg = _w[0].copy(target).sub(sh.position); const d = Tg.length();
  const handAt = (th, out) => out.set(Hh.x * Math.cos(th) - Hh.y * Math.sin(th), Hh.x * Math.sin(th) + Hh.y * Math.cos(th), Hh.z).add(E0);
  let lo = 0, hi = 2.7; const H0 = _w[1];
  if (handAt(0, H0).length() <= d) hi = 0; else if (handAt(hi, H0).length() >= d) lo = hi;
  else for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; if (handAt(m, H0).length() > d) lo = m; else hi = m; }
  const th = (lo + hi) / 2; handAt(th, H0);
  const Tn = _w[2].copy(Tg).normalize(); _qa.setFromUnitVectors(H0.normalize(), Tn);
  const E1 = _w[3].copy(E0).applyQuaternion(_qa); const Pp = _w[4].copy(pole);
  E1.addScaledVector(Tn, -E1.dot(Tn)); Pp.addScaledVector(Tn, -Pp.dot(Tn));
  if (E1.lengthSq() > 1e-8 && Pp.lengthSq() > 1e-8) { E1.normalize(); Pp.normalize(); const ang = Math.atan2(_w[1].crossVectors(E1, Pp).dot(Tn), E1.dot(Pp)); _qb.setFromAxisAngle(Tn, ang); _qa.premultiply(_qb); }
  sh.quaternion.copy(_qa); el.rotation.set(0, 0, th);
}
function guitarPt(g, local) { g.updateMatrix(); _pt.copy(local).applyMatrix4(g.matrix); if (g.parent && g.parent.name !== 'body' && g.parent.parent && g.parent.userData.chest) { g.parent.updateMatrix(); _pt.applyMatrix4(g.parent.matrix); } return _pt; }
/** the visible native figure (voxfig buildFigure F) inside a world hero group, or null */
export const figOf = (g) => { for (const o of g.children[0]?.children || []) if (o.visible && o.userData.F) return o.userData.F; return null; };
/** re-pose a native figure's playing: strum = picking hand along body y (model px, + up), out = along body x (+ = toward the lens for
 *  a hero facing -1), side = along body z (+ = his right), neck (rad), lift (px); lean / nod (deg, - = forward / down); crouch 0..1. Returns false on carve figures. */
export function strumPose(g, { strum = 0, out = 0, side = 0, neck = 0.5, lift = 0, lean = 0, nod = 0, crouch = 0 } = {}) {
  const F = figOf(g); const gt = F?.items?.guitar; if (!F || !F.model?.native || !gt?.userData.base) return false;
  const J = F.J, U = gt.userData, u = F.model.u, d = Math.PI / 180;
  J.body.rotation.z = (-5 + lean) * d; J.head.rotation.z = (-9 + nod) * d;
  J.hipR.rotation.z = (14 + 22 * crouch) * d; J.kneeR.rotation.z = (-34 * crouch) * d; J.hipL.rotation.z = (-14 + 12 * crouch) * d; J.kneeL.rotation.z = (-6 - 26 * crouch) * d;
  F.root.position.y = -2.2 * crouch * u;
  gt.position.copy(U.base).add(_w[0].set(0, lift * u, 0)); gt.rotation.set(neck, Math.PI / 2, 0);
  const fret = guitarPt(gt, U.fret).clone(), st = guitarPt(gt, U.strum).clone().add(_w[0].set(out * u, strum * u, side * u));
  ikArm(F, 'L', fret, _w[1].set(0.1, -1, -0.7).clone());
  ikArm(F, 'R', st, _w[2].set(-0.4, -1, 0.6).clone());
  return true;
}
/** the big downstroke's envelope, s = seconds since the hit frame (s = 0: the pick is just through the strings, going down), then
 *  the follow-through (low, out, crouched, neck up) and the recovery into 8th strums by ~0.34 s. r = how far it has recovered. */
export function strumHit(s) {
  const k = 1 - Math.pow(1 - clamp01(s / 0.05), 3), r = smooth(0.1, 0.34, s), h = 1 - r;
  return { strum: (-1.5 - 9 * k) * h, out: (3 + 4 * k) * h, neck: 0.5 + 0.14 * k * h, lift: 1.5 * k * h, lean: (-4 - 5 * k) * h, nod: (-1 - 3 * k) * h, crouch: (0.55 + 0.45 * k) * h, r };
}
/** an 8th-note strum (down fast through the strings ON each 8th, up slowly), amplitude a px */
export function strum8(t, a = 3) { const ph = ((T.beatAt(t) * 2 + 0.12) % 1 + 1) % 1; return ph < 0.24 ? a - 2 * a * smooth(0, 0.24, ph) : -a + 2 * a * smooth(0.24, 1, ph); }
/** the swoosh: where the picking hand came from (a windup arc high and out, never shown as a pose) down to now; world points */
export function swooshPts(g, cur, n = 7, { up = 24, out = 5, side = 13 } = {}) {
  const pts = [];
  for (let j = 0; j <= n; j++) { const a = j / n; strumPose(g, { ...cur, strum: up + (cur.strum - up) * a, out: out + (cur.out - out) * a + 3 * Math.sin(Math.PI * a), side: side * (1 - a) + 0.55 * side * Math.sin(Math.PI * a) }); pts.push(g.hand('R', new THREE.Vector3())); }
  strumPose(g, cur); return pts;
}
/** private seeded Math.random while allocating (THREE uuids): the global stream other scenes depend on stays untouched */
export function seeded(seed, fn) { let a = seed >>> 0; const R0 = Math.random;
  Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  try { return fn(); } finally { Math.random = R0; } }
/** an additive ring (radius 1 at scale 1) */
export function ringMesh(color) { const m = new THREE.Mesh(new THREE.RingGeometry(0.78, 1, 72), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  m.userData.noAO = true; m.frustumCulled = false; m.visible = false; return m; }
/** the time of the first rendered frame whose t >= t0 (frame times are f / fps in floating point: 5499 / 30 < 183.30) */
export function firstFrame(t0) { const fps = T.fps(); let f = Math.ceil(t0 * fps - 1e-6); while (f / fps < t0) f++; return f / fps; }
const RAINBOW = ['#ff4d6d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'];
const bez = (a, b, c, u) => a.clone().multiplyScalar((1 - u) * (1 - u)).addScaledVector(b, 2 * u * (1 - u)).addScaledVector(c, u * u);

export async function makeSlabInsert(ctx) {
  const W = await getWorld(ctx); const aspect = ctx.width / ctx.height;
  // the slab: a graphite block with the carved face toward -x (two slabs, one per word, at the same spot); a light graphite (the face is
  // in the sun's shade from the seats: the dark grooves must read against it)
  const slabMat = new THREE.MeshStandardMaterial({ color: '#a4a4ae', roughness: 0.5, metalness: 0.05 }); slabMat.userData.noPaint = true;
  const mk = async (word, kind) => {
    const g = new THREE.Group(); g.position.copy(SLAB.c); g.rotation.y = -Math.PI / 2;   // local +z (the carved face) -> world -x
    // (M3) the old box body is still allocated (the seeded Math.random stream: THREE uuids) but no longer used: carved_slab builds the
    // whole slab (chipped voxel-stone solid, SLAB.d thick, the word cut 5 u deep, its own raking key)
    const body = new THREE.Mesh(new THREE.BoxGeometry(SLAB.w, SLAB.h, SLAB.d - 3), slabMat); body.geometry.dispose();
    const face = await makeCarvedFace({ word, w: SLAB.w, h: SLAB.h, depth: 5, thick: SLAB.d, cell: 0.6, letterH: 0.26, yC: 0.66, kind, color: SLAB_STONE, chip: 4.5, seed: 1,
      key: SLAB_KEY, keyDir: SLAB_KEYDIR, legacy: { word, w: SLAB.w, h: SLAB.h, depth: 3, slab: 3, cell: 1.0, letterH: 0.26, yC: 0.66, kind, faceMat: slabMat } });
    g.add(face.group); g.visible = false; W.scene.add(g); return { g, face };
  };
  const [FX, FN] = await Promise.all([mk('FIXTURES', 'graphite'), mk('FUNCTIONS', 'rainbow')]);
  const P = W.props;
  // (v45_accents) the strum's own fx objects (seeded allocation: the global Math.random stream is untouched); hidden outside render()
  const NEW = SLAB_STRUM === 'new';
  const A = NEW ? seeded(0x45acc, () => { const o = { swoosh: new Beam({ radius: 0.8, color: '#fff6e6', intensity: 5, glow: 3 }), trail: new Beam({ radius: 0.7, color: '#ffffff', intensity: 6, glow: 3.5 }),
    gRing: ringMesh('#fff1dc'), fRing: ringMesh('#f6ead2'), sp: new Burst(160, { size: 1.2, color: '#ffffff', emissive: 2.5 }), dust: new Burst(90, { size: 1.8, color: '#e8dcc6' }) };
    o.fRing.rotation.x = -Math.PI / 2;
    // a plain Object3D holder: act4/world4.js leaves type 'Object3D' children of the scene alone (no erase patch, no re-show)
    const holder = new THREE.Object3D(); W.scene.add(holder); for (const m of Object.values(o)) { m.visible = false; holder.add(m); } return o; }) : null;
  const guitarAt = (g, out = new THREE.Vector3()) => { const gt = figOf(g)?.items?.guitar; if (!gt) return out.copy(g.position).setY(g.position.y + 26); gt.updateWorldMatrix(true, false); return gt.localToWorld(out.copy(gt.userData.strum)); };
  const which = (t) => (t >= INSERTS.fix[0] && t < INSERTS.fix[1] ? 'fix' : t >= INSERTS.fun[0] && t < INSERTS.fun[1] ? 'fun' : null);
  const sc = await make3D(ctx, W, {
    subs: false,
    frame(t, fxs) {
      r5ShotClear?.();
      const k = which(t) || 'fix'; const t0 = INSERTS[k][0]; const s = t - t0;
      // the world as the flood left it: coloured everywhere
      G.uPaintC.value.set(1354, top, 454); G.uPaintR.value = 1e5; G.uPaintW.value = 60;
      // the slab slams up (overshoot), shakes the lens
      const S = k === 'fix' ? FX : FN; FX.g.visible = k === 'fix'; FN.g.visible = k === 'fun';
      const u = clamp01(s / RISE); const rise = 1 - Math.pow(1 - u, 3) + 0.05 * Math.sin(Math.PI * u);
      // (v45_accents) hit = the shot's first frame (180.233 / 183.300): the strum IS that frame; sh = time since it
      const hit = firstFrame(t0), sh = t - hit, hitFrame = Math.round(sh * T.fps()) === 0;
      S.g.position.y = top - SLAB.h * (1 - rise);
      if (NEW) FN.face.setGlow(smooth(hit + 0.08, hit + 0.28, t), 1.9 + 0.9 * T.pulse(t, [hit + 0.1], 0.25));   // the fill starts where Ricky's trail lands (the F)
      else FN.face.setGlow(smooth(t0 + 0.05, t0 + 0.2, t), 1.9 + 0.9 * T.pulse(t, [t0 + 0.05], 0.25));   // (M3) gain down: the hues stay saturated (was 3.4-5.0: white cores)
      // the trio, front-on to the seats (facing -x): they shout it (Jade's rainbow pencil up on FUNCTIONS)
      const e8 = Math.floor(T.beatAt(t) * 2);
      const H = NEW ? {   // (v45_accents) both guitarists play (strumPose below); the hitter's downstroke opens the shot
        charlie: { anim: 'chord', frame: 0, hat: true }, ricky: { anim: 'chord', frame: 0 },
        jade: { anim: k === 'fun' ? 'draw_rainbow' : 'sing', t: s, pencil: true, frame: null },
      } : {
        charlie: { anim: 'chord', frame: e8 % 2, hat: true }, ricky: { anim: k === 'fun' ? 'victory' : 'chord', frame: (e8 + 1) % 2 },
        jade: { anim: k === 'fun' ? 'draw_rainbow' : 'sing', t: s, pencil: true, frame: null },
      };
      const hitter = k === 'fix' ? 'charlie' : 'ricky';
      for (const n of ['jade', 'charlie', 'ricky']) { const g = W.heroes[n]; const p = TRIO[n]; g.visible = true;
        const hop = NEW && n === hitter ? 0 : 4 * T.pulse(t, [t0], 0.2) * (n === 'jade' ? 1 : 0.6);
        g.set({ ...H[n], facing: -1, x: p.x, y: p.y + hop }); g.position.z = p.z; g.rotation.y = n === 'charlie' ? 0.24 : n === 'ricky' ? -0.24 : 0; }
      let cur = null;
      if (NEW) {
        const other = hitter === 'charlie' ? 'ricky' : 'charlie';
        strumPose(W.heroes[other], { strum: strum8(t, 2.6) });
        const e = strumHit(sh);
        // after the follow-through: Charlie back into 8ths; Ricky lets the chord ring, neck up, leaning back (his sustain, played)
        const after = hitter === 'charlie' ? { strum: strum8(t, 3), out: 0, neck: 0.5, lift: 0, lean: 0, nod: 0, crouch: 0 }
          : { strum: -4, out: 4, neck: 0.95, lift: 2, lean: 13, nod: 18, crouch: 0.25 };
        cur = {}; for (const q of ['strum', 'out', 'neck', 'lift', 'lean', 'nod', 'crouch']) cur[q] = e[q] + e.r * after[q] - (q === 'neck' ? e.r * 0.5 : 0);
        strumPose(W.heroes[hitter], cur);
      }
      // dust + chips where it breaks out of the stage; rainbow sparks on FUNCTIONS
      P.burst.visible = true;
      P.burst.run(t, [{ t0, x: SLAB.c.x - 12, y: top, z: SLAB.c.z, n: 70, speed: 110, up: 50, g: 180, dur: 0.9, seed: 900 + (k === 'fun' ? 1 : 0), size: 2.2, colors: ['#e8dcc6', '#cfc0a4', '#9a9aa2', '#4a4a50'] }]);
      if (k === 'fun' && !NEW) { P.sparks.visible = true; P.sparks.run(t, [{ t0: t0 + 0.05, x: SLAB.c.x - 10, y: top + SLAB.h * 0.66, z: SLAB.c.z, n: 60, speed: 90, up: 40, g: 60, dur: 0.7, seed: 910, colors: ['#ff4d6d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'] }]); }
      if (!NEW && T.exactFrame(t, [t0])) { fxs.flash = 0.22; fxs.flashColor = k === 'fun' ? '#fff4fb' : '#ffffff'; }
      if (NEW && hitFrame) { fxs.flash = 0.2; fxs.flashColor = k === 'fun' ? '#fff4fb' : '#fff8ee'; }
      // camera: front-on from the seats, chest-to-head height, the slab filling the upper two thirds behind them; a punch on the slam
      const punch = T.pulse(t, [t0 + RISE * 0.8], 0.12); const push = smooth(t0, INSERTS[k][1], t);
      const pos = V(1196 + 14 * push, top + 74, 432 + Math.sin(t * 70) * 1.6 * punch), tgt = V(1450, top + 70, 432);
      const camera = aim(persp('slabIns', aspect), pos, tgt, 40 - 3 * punch);
      const focus = TRIO.jade.clone().setY(top + 50);
      if (NEW) {   // (v45_accents) the cause -> effect fx
        const g = W.heroes[hitter]; const G0 = guitarAt(g);
        strumPose(g, strumHit(0)); const Gh = guitarAt(g); strumPose(g, cur);   // particle origins: where the guitar was ON the hit (fixed)
        // the swoosh: the stroke's path (from a windup high and out, down through the strings), retracting into the hand in 2 frames
        const pw = 1 - sh / 0.075;
        if (pw > 0) { const pts = swooshPts(g, cur, 7, k === 'fun' ? { up: 26, out: 10, side: 7 } : undefined).reverse(); A.swoosh.set(pts, pw, { width: 1, colors: k === 'fun' ? RAINBOW : null }); A.swoosh.visible = true; }
        // the shock ring off the guitar body (faces the lens, a little in front of the guitar)
        const gr = clamp01(sh / 0.22); if (gr < 1) { A.gRing.visible = true; A.gRing.position.copy(G0).addScaledVector(camera.position.clone().sub(G0).normalize(), 4);
          A.gRing.quaternion.copy(camera.quaternion); A.gRing.scale.setScalar(3 + 24 * (1 - Math.pow(1 - gr, 3))); A.gRing.material.opacity = 0.95 * (1 - gr);
          A.gRing.material.color.set(k === 'fun' ? RAINBOW[Math.min(5, Math.floor(gr * 6))] : '#fff1dc'); }
        if (k === 'fix') {
          // FIXTURES: the ring runs along the stage floor from Charlie's feet to the slab foot as it breaks out; a dust ring with it
          const fr = clamp01(sh / 0.2); if (fr < 1) { A.fRing.visible = true; A.fRing.position.set(TRIO.charlie.x, top + 0.6, TRIO.charlie.z); A.fRing.scale.setScalar(6 + 150 * (1 - Math.pow(1 - fr, 2))); A.fRing.material.opacity = 0.9 * (1 - fr); }
          A.dust.run(t, [{ t0: hit, x: TRIO.charlie.x, y: top + 1, z: TRIO.charlie.z, n: 80, speed: 230, up: 10, cone: 0.08, g: 90, dur: 0.45, seed: 941, size: 1.4, floor: top + 0.5, colors: ['#e8dcc6', '#cfc0a4', '#9a9aa2', '#6a6a72'] }]);
          A.sp.run(t, [{ t0: hit, x: Gh.x, y: Gh.y, z: Gh.z, n: 26, speed: 70, up: 30, g: 120, dur: 0.4, seed: 942, size: 0.9, colors: ['#ffffff', '#f3e6cc', '#c8c8d0'] }]);
        } else {
          // FUNCTIONS: sparks off the Strat, a rainbow spark trail arcs to the F (the fill starts there), a burst where it lands
          const FpAt = (tt) => { const uu = clamp01((tt - t0) / RISE); return V(SLAB.c.x - SLAB.d / 2 - 3, top - SLAB.h * (Math.pow(1 - uu, 3) - 0.05 * Math.sin(Math.PI * uu)) + 0.66 * SLAB.h, SLAB.c.z - 0.39 * SLAB.w); };
          const Fp = FpAt(t), C = V(1392, top + 150, 424); const head = (x) => 1 - Math.pow(1 - clamp01(x / 0.1), 3);
          const uh = head(sh), ut = smooth(0.05, 0.22, sh);
          if (uh > ut + 0.01) { const pts = []; for (let i = 0; i <= 14; i++) pts.push(bez(G0, C, Fp, ut + (uh - ut) * i / 14)); A.trail.set(pts, 1, { width: 1, colors: RAINBOW }); A.trail.visible = true; }
          const Fl = FpAt(hit + 0.1);
          const B = [{ t0: hit, x: Gh.x, y: Gh.y, z: Gh.z, n: 46, speed: 85, up: 34, g: 70, dur: 0.5, seed: 931, size: 1.0, colors: RAINBOW }, { t0: hit + 0.1, x: Fl.x, y: Fl.y, z: Fl.z, n: 56, speed: 80, up: 36, g: 60, dur: 0.6, seed: 932, colors: [...RAINBOW, '#ffffff'] }];
          for (let i = 0; i < 6; i++) { const te = 0.03 + 0.012 * i; const q = bez(Gh, C, FpAt(hit + te), head(te)); B.push({ t0: hit + te, x: q.x, y: q.y, z: q.z, n: 8, speed: 30, up: 6, g: 120, dur: 0.35, seed: 950 + i, size: 0.8, colors: RAINBOW }); }
          A.sp.run(t, B);
        }
      }
      return { camera, target: tgt, focus, shadowExtent: 520,
        // (M3) ao 0: after any drop_r5 frame in the same process the GTAO pass draws a dark horizontal band across the slab at the
        // lens height (a state leak into this shot, seen in full_v4 at 180.5; not reproducible without a drop-1 frame first)
        look: LOOK({ rays: 0.25, dofAmount: 0.06, sat: 1.18, exposure: 0.6, ao: 0, ...SLAB_SUN, r5: { dof: 0.12, tilt: 0, focus } }) };
    },
  });
  return {
    window: which, stage: sc.stage,
    update(t) { sc.update(t); },
    render(t, target) { FX.g.visible = which(t) === 'fix'; FN.g.visible = which(t) === 'fun';
      try { sc.render(t, target); } finally { FX.g.visible = FN.g.visible = false; P.burst.count = 0; P.sparks.count = 0;
        if (A) { for (const m of Object.values(A)) m.visible = false; A.sp.count = 0; A.dust.count = 0; for (const b of [A.swoosh, A.trail]) b.set([V(0, 0, 0), V(0, 0, 1)], 0); } } },
  };
}
