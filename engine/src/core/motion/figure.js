// MotionFigure: a voxfig hero driven by a MotionTrack (mocap blend + layers), with foot locking and two-bone leg IK.
// Every call is a pure function of (track, t): foot locks are derived from the track's contact intervals (the foot's FK
// position at the moment of contact, put on the ground), cached per interval, so frames can render in any order.
//
// ANKLE PROTOTYPE (ankles: true, default): the rig has no ankle (the shoe is part of the shin mesh), so a planted foot tilts
// with the shin (tiptoe). Here each shin mesh is split at the ankle into shin + foot meshes that SHARE the cached model's
// vertex buffers (only new index arrays; triangles in a thin band at the cut go to both, hiding the seam) and the foot hangs
// from a new J.ankleR / J.ankleL group. Planted feet then stay flat and locked; heel / toe roll follows the mocap foot pitch.
// The proper fix is the rig upgrade (split foot parts in heromodels + an ankle joint in voxfig buildFigure / pose()).
//
//   const fig = new MotionFigure(ctx.lib, 'ricky');  scene.add(fig.group);
//   const tr = new MotionTrack(clips, { t0, pos, unit: fig.unit, ground }).idle(0.4).move(...).build();
//   update(t) { fig.apply(tr, t, { layers: [{ anim: 'chord', t0: 2, t1: 4, mask: 'arms' }] }); }
import * as THREE from 'three';
import { figureModel, buildFigure, pose as voxPose, patchVoxelEdges, FIGURE_SRC } from '../voxfig.js';
import { Pose, blendPoses, layerPose, captureFigure, applyToFigure, sampleClip, warpPhase, scaleGaitPose, clipStats } from './clips.js';
import { gaitInfo, GAITS, DT } from './track.js';
import { defaultSprings, simSpring, rotvecQuat, GDT, SPRING_LOOK } from './springs.js';
import { seedOf, blink, saccade, breath, weightShift, glance, exertion, follow } from './life.js';

const V = () => new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _v = [V(), V(), V(), V(), V(), V(), V()];
const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1);
/** eye look sign vs models_r6's look [x, y] (+x = her right? to confirm against their API doc): flip here if the eyes go the wrong way */
export const LOOK_SIGN = [1, 1];
/** idle stance: feet at side x the hip spacing (1 = straight under the hips), fore-aft offsets in hip heights */
/** standing-arm clearance: allowed penetration into the pants / jacket (model units: about a voxel; the armpit seam hides
 *  the jacket's), and a margin (deg) on top of the smallest clear abduction */
export const ARM_CLEAR = { pants: 0.5, jacket: 1.3, margin: 1 };
export const IDLE_FOOT = { side: 1.2, fwd: { R: -0.06, L: 0.09 } };
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

/** split a knee-space shin geometry at height cut into { shin, foot } geometries sharing its attributes (band: overlap) */
function splitShin(geo, cut, band) {
  const idx = geo.index.array, pos = geo.attributes.position.array; const A = [], B = [];
  for (let i = 0; i < idx.length; i += 3) {
    const y = (pos[idx[i] * 3 + 1] + pos[idx[i + 1] * 3 + 1] + pos[idx[i + 2] * 3 + 1]) / 3;
    if (y >= cut - band) A.push(idx[i], idx[i + 1], idx[i + 2]); if (y <= cut + band) B.push(idx[i], idx[i + 1], idx[i + 2]);
  }
  const mk = (I) => { const g = new THREE.BufferGeometry(); for (const [k, a] of Object.entries(geo.attributes)) g.setAttribute(k, a); g.setIndex(I); g.computeBoundingBox(); g.computeBoundingSphere(); return g; };
  return { shin: mk(A), foot: mk(B) };
}

export class MotionFigure {
  /** lib: SpriteLib (ctx.lib); hero 'jade' | 'charlie' | 'ricky'; opts { variant ('jade_down', 'charlie_nohat'), scale, material, armOut (deg), ankles } */
  constructor(lib, hero, { variant = null, scale = 1, material = null, armOut = 7, src = FIGURE_SRC, ankles = true, maxDrop = 0.22, rig = undefined, springs = true } = {}) {
    this.hero = hero; this.armOut = armOut * Math.PI / 180; this.ankles = ankles;
    this.group = new THREE.Group(); this.orient = new THREE.Group(); this.orient.scale.setScalar(scale); this.group.add(this.orient);
    material = material || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); material.vertexColors = true; material.userData.noPaint = true;
    const vname = variant || (hero === 'jade' ? 'jade_up' : hero); this.vname = vname;
    lib._figModels ||= new Map(); const key = src + ':' + vname; let model = lib._figModels.get(key);
    if (!model) { model = figureModel(vname, lib.turn, src); lib._figModels.set(key, model); }
    if (model.native) patchVoxelEdges(material, model.u / model.native.res * scale, 0.2);
    this.F = buildFigure(model, material, { hero, down: vname === 'jade_down', items: lib.turn?.items, ...(rig !== undefined ? { rig } : {}) }); this.F.hatless = vname === 'charlie_nohat';
    this.orient.add(this.F.root);
    const P = model.piv; this.rs = P[2].y / 45.5; this.unit = this.rs * scale; this.scale = scale;   // model / world units per design unit
    // feet: sole heel / toe points and the ankle, from the shin mesh bounds (knee space; the shoe is part of the shin mesh)
    this.foot = {}; const rs = this.rs;
    for (const sd of ['R', 'L']) {
      const kn = this.F.J['knee' + sd], m = kn.children.find((c) => c.isMesh); m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; const ins = 1.3 * rs, zc = (b.min.z + b.max.z) / 2;
      const ankle = new THREE.Vector3(0, b.min.y + 6 * rs, zc);
      const f = { heel: new THREE.Vector3(b.min.x + ins, b.min.y, zc), toe: new THREE.Vector3(b.max.x - ins, b.min.y, zc), ankle, len: b.max.x - b.min.x - 2 * ins, parent: kn };
      const nat = this.F.J['ankle' + sd];
      if (nat && nat.parent === kn) {   // models_r6 rig split: a native ankle joint with its own foot mesh(es) -> use it, no shin split
        const fb = new THREE.Box3(); nat.updateMatrixWorld(true); kn.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(nat.matrixWorld).invert();
        nat.traverse((o) => { if (o.isMesh) { o.geometry.computeBoundingBox(); fb.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld))); } });
        const RF = this.F.rig?.foot?.[sd];
        if (RF) { f.heel.copy(RF.heel); f.toe.copy(RF.toe); f.len = RF.toe.x - RF.heel.x; }   // models_r6 contact points (ankle space)
        else if (!fb.isEmpty()) { const zc2 = (fb.min.z + fb.max.z) / 2; f.heel.set(fb.min.x + ins, fb.min.y, zc2); f.toe.set(fb.max.x - ins, fb.min.y, zc2); f.len = fb.max.x - fb.min.x - 2 * ins; }
        else { f.heel.sub(nat.position); f.toe.sub(nat.position); }
        f.parent = nat; f.ankleLocal = nat.position.clone(); f.ankle = new THREE.Vector3(); f.native = true; this.nativeAnkles = true;
      } else if (ankles) {
        const { shin, foot } = splitShin(m.geometry, b.min.y + 7.6 * rs, 1.7 * rs); m.geometry = shin;
        const aj = new THREE.Group(); aj.position.copy(ankle); kn.add(aj); const fm = new THREE.Mesh(foot, material); fm.castShadow = fm.receiveShadow = true; fm.userData.noPaint = true; fm.position.copy(ankle).negate(); aj.add(fm);
        this.F.J['ankle' + sd] = aj; f.parent = aj; f.heel.sub(ankle); f.toe.sub(ankle); f.ankleLocal = ankle.clone(); f.ankle = new THREE.Vector3();   // points now in ankle space
      }
      this.foot[sd] = f;
    }
    this.thigh = this.F.J.kneeR.position.length(); this.hip = P[2].y * scale; this.maxDrop = maxDrop * P[2].y * scale; this.clear = 0.14 * P[2].y * scale;   // max swing clearance
    this._cache = new Map(); this._pool = Array.from({ length: 20 }, () => new Pose()); this.debug = { R: {}, L: {} };
    this.ankles = ankles || !!this.nativeAnkles;
    this.palm = 1.9 * this.rs * scale; this.seed = seedOf(hero + ':' + vname); this.headY = P[1].y * scale; this.springs = springs ? defaultSprings(this.F, hero) : []; this._anchors = new Map();
    this.face = { blinkL: 0, blinkR: 0, eyeYaw: 0, eyePitch: 0, mouth: null };
  }

  // ---------------------------------------------------------------------------------------------- pose evaluation
  /** blended pose of a track state's sources (gait blend by speed at the distance phase, clips by progress) */
  evalSources(track, st, out) {
    const poses = [], ws = []; let k = 0; const take = () => this._pool[k++];
    for (const q of st.src) {
      if (q.w <= 1e-4 || k > 15) continue;
      if (q.k === 'clip') { poses.push(sampleClip(track.clips[q.c], q.u, take(), this.rs)); ws.push(q.w); continue; }
      // gait blend: every gait sampled at the same (warped) phase so the stances line up with the track's contacts, its swing
      // scaled to the actual stride (k = stride / the clip's natural stride): longer walking strides, a real slow jog
      const gi = gaitInfo(track.G, q.v, st.f > 0 && q.v > 1e-4 ? st.f : null); const sub = [], sw = [];
      if (gi.w.idle > 0) { const ic = track.clips.idle; const p = sampleClip(ic, ((st.t - track.t0) / ic.dur) % 1, take(), this.rs); this._narrowIdle(track, p); this._relaxArms(track, p, st.t); sub.push(p); sw.push(gi.w.idle); }
      for (const gg of GAITS) if (gi.w[gg] > 0) { const c = track.G[gg].clip; const p = sampleClip(c, warpPhase(c, st.ph, gi.dutyG), take(), this.rs); scaleGaitPose(p, c, gi.K[gg], this.rs);
        if (gg === 'jog') this._jogPosture(track, p, q.v / track.M); sub.push(p); sw.push(gi.w[gg]); }
      const p = take(); blendPoses(p, sub, sw); poses.push(p); ws.push(q.w);
    }
    if (!poses.length) return out.identity();
    return blendPoses(out, poses, ws);
  }
  /**
   * The UAL idle stands with the feet ~2x hip width apart and staggered (a sumo stance on our chunky heroes). A constant hip
   * correction, calibrated once per figure from the idle FK, puts the feet about hip width apart (+-IDLE_FOOT.side x the
   * hip spacing) with a small stagger (left a little forward, the idle / landing stance convention).
   */
  _narrowIdle(track, p) {
    if (!this._idleFix) {
      const ic = track.clips.idle, P0 = sampleClip(ic, 0, new Pose(), this.rs), J = this.F.J;
      applyToFigure(this.F, P0); if (this.ankles) { J.ankleR.rotation.set(0, 0, 0); J.ankleL.rotation.set(0, 0, 0); }
      this.group.position.set(0, 0, 0); this.group.quaternion.identity(); this.group.updateMatrixWorld(true);
      const inv = new THREE.Quaternion(); J.legs.getWorldQuaternion(inv).invert(); this._idleFix = {};
      for (const sd of ['R', 'L']) {
        const hip = J['hip' + sd].getWorldPosition(new THREE.Vector3()), ft = this._pt(sd, 'heel', new THREE.Vector3()).add(this._pt(sd, 'toe', new THREE.Vector3())).multiplyScalar(0.5);
        const cur = ft.clone().sub(hip), hz = hip.z, des = new THREE.Vector3(IDLE_FOOT.fwd[sd] * this.hip, 0, hz * IDLE_FOOT.side - hz);
        des.y = -Math.sqrt(Math.max(1, cur.lengthSq() - des.x * des.x - des.z * des.z));
        const q = new THREE.Quaternion().setFromUnitVectors(cur.normalize().applyQuaternion(inv), des.normalize().applyQuaternion(inv)); this._idleFix[sd] = q;
      }
    }
    for (const sd of ['R', 'L']) { p.quat('hip' + sd, _q); p.setQuat('hip' + sd, _q.premultiply(this._idleFix[sd])); }
  }
  /**
   * Standing arms: hang relaxed close to the body (the UAL idle holds them ~19 deg out, + armOut = an A-pose on our heroes).
   * The abduction is this figure's own clearance: the smallest angle at which the arm line clears its torso and pants at
   * every height the arm passes (from the meshes, once), + 1.5 deg. Soft elbow, a little forward, swaying with breathing.
   */
  _relaxArms(track, p, t) {
    if (!this._armFix) this._armFix = this._calibArms(track);
    const A = this._armFix, br = breath(this.seed, t, this._ex ?? 0), ws = weightShift(this.seed, t);
    for (const [sd, sg] of [['R', -1], ['L', 1]]) {
      const abd = A[sd] - this.armOut + 0.012 * br.s * br.depth, fwd = 0.08 + 0.025 * ws * sg + 0.01 * br.s;
      _q.setFromAxisAngle(Z, fwd); _q2.setFromAxisAngle(X, sg * abd); p.setQuat('shoulder' + sd, _q2.multiply(_q));
      _q.setFromAxisAngle(Z, 0.24 + 0.02 * br.s); p.setQuat('elbow' + sd, _q);
    }
  }
  _calibArms(track) {
    // sweep the abduction (with the relaxed elbow / forward hang) and measure how deep the arm meshes go into the jacket and the
    // pants (1-unit cells of the body-space surface); the shoulder cap (top 10 design units) sits in the torso by design and is skipped
    const J = this.F.J, ic = track.clips.idle, P0 = sampleClip(ic, 0, new Pose(), this.rs); this._narrowIdle(track, P0);
    applyToFigure(this.F, P0); this.group.position.set(0, 0, 0); this.group.quaternion.identity(); this.group.updateMatrixWorld(true);
    const body = J.chest || J.body, inv = new THREE.Matrix4().copy(body.matrixWorld).invert(), V = new THREE.Vector3(), occ = new Map(), out = {};
    const add = (o, tag) => { const pos = o.geometry.attributes.position; const M = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      for (let i = 0; i < pos.count; i += 2) { V.fromBufferAttribute(pos, i).applyMatrix4(M); const k = tag + Math.round(V.x) + ',' + Math.round(V.y) + (V.z > 0 ? 'R' : 'L'); occ.set(k, Math.max(occ.get(k) || 0, Math.abs(V.z))); } };
    for (const j of [J.body, J.chest].filter(Boolean)) for (const c of j.children) if (c.isMesh) add(c, 'T');
    for (const j of [J.hipR, J.hipL]) for (const c of j.children) if (c.isMesh) add(c, 'P');
    const pen = (sd, ang) => { const sg = sd === 'R' ? -1 : 1, sh = J['shoulder' + sd], el = J['elbow' + sd]; sh.quaternion.setFromEuler(new THREE.Euler(sg * ang, 0, 0.08)); el.rotation.set(0, 0, 0.24); this.F.root.updateMatrixWorld(true);
      const S = sh.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv); let wT = 0, wP = 0;
      for (const j of [sh, el]) for (const c of j.children) if (c.isMesh) { const pos = c.geometry.attributes.position; const M = new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld);
        for (let i = 0; i < pos.count; i += 2) { V.fromBufferAttribute(pos, i).applyMatrix4(M); if (S.y - V.y < 10 * this.rs || (V.z > 0 ? 'R' : 'L') !== sd) continue; const cell = Math.round(V.x) + ',' + Math.round(V.y) + sd;
          const t = occ.get('T' + cell), p = occ.get('P' + cell); if (t !== undefined) wT = Math.max(wT, t - Math.abs(V.z)); if (p !== undefined) wP = Math.max(wP, p - Math.abs(V.z)); } }
      return [wT, wP]; };
    for (const sd of ['R', 'L']) { let ang = 0; for (let d = 0; d <= 24; d++) { const [t, p] = pen(sd, d / 57.3); ang = d; if (p <= ARM_CLEAR.pants && t <= ARM_CLEAR.jacket) break; } out[sd] = (ang + ARM_CLEAR.margin) / 57.3; }
    this.armClear = { R: +(out.R * 57.3).toFixed(1), L: +(out.L * 57.3).toFixed(1) };
    return out;
  }
  /** the jog clip is a 5 m/s run with a run's forward lean: ease the torso back toward the walk's posture at jogging speeds */
  _jogPosture(track, p, mps) {
    const s = 0.75 * Math.min(1, Math.max(0, 1 - (mps - 2.2) / 3.6)); if (s <= 0) return;
    if (!this._jogFix) { const W = clipStats(track.G.walk.clip).neutral, R = clipStats(track.G.jog.clip).neutral; this._jogFix = W.quat('body').multiply(R.quat('body').invert()); }
    p.quat('body', _q); _q2.identity().slerp(this._jogFix, s); p.setQuat('body', _q.premultiply(_q2));
  }
  /** layers: [{ anim (voxfig keyed pose) | clip (mocap), t0, t1, fade = 0.2, mask = 'upper', rate (cycles/s), p(t) }] */
  _layered(track, st, P, layers, pencil, t) {
    let itemsDone = false; this._animW = 0;
    for (const L of layers) {
      const fade = L.fade ?? 0.2; const w = Math.min(smooth((t - L.t0) / fade), 1 - smooth((t - (L.t1 - fade)) / fade)); if (w <= 0) continue;
      const K = this._pool[19];
      if (L.anim) { this._animW = Math.max(this._animW, w); const p = L.p ? L.p(t) : (((t - L.t0) * (L.rate ?? 1)) % 1); voxPose(this.F, L.anim, p, { hero: this.hero, pencil: L.pencil ?? pencil }); captureFigure(this.F, K); K.root.fill(0); if (w > 0.5) itemsDone = true; else voxPose(this.F, 'idle', 0, { hero: this.hero, pencil }); }
      else { const c = track.clips[L.clip]; sampleClip(c, L.p ? L.p(t) : (t - L.t0) * (L.rate ?? 1) / c.dur, K, this.rs); }
      layerPose(P, P, K, w, L.mask ?? 'upper', L.rootW ?? 0);
    }
    return itemsDone;
  }
  /** FK pose at t (no IK): sets every joint, the root offset and the group transform; returns the track state */
  poseAt(track, t, opts = {}) {
    const { layers = [], pencil = false } = opts;
    const st = track.state(t); const P = this._pool[18]; this._animW = 0;
    this.evalSources(track, st, P);
    const items = layers.length ? this._layered(track, st, P, layers, pencil, t) : false;
    if (!items) voxPose(this.F, 'idle', 0, { hero: this.hero, pencil });   // items (pencils, guitar, cap) at their defaults
    if (this.armOut) { // a little abduction so mocap arms clear the chunky torso
      for (const [sd, sg] of [['shoulderR', -1], ['shoulderL', 1]]) { P.quat(sd, _q); _q2.setFromAxisAngle(X, sg * this.armOut); P.setQuat(sd, _q.premultiply(_q2)); } }
    applyToFigure(this.F, P);
    this._splitRig(P);
    if (this.ankles) { this.F.J.ankleR.rotation.set(0, 0, P.ankle[0]); this.F.J.ankleL.rotation.set(0, 0, P.ankle[1]); }
    if (opts.life !== false) this._lifeBody(track, st, t);
    const g = this.group; g.position.set(st.x, st.y, st.z);
    _q.setFromAxisAngle(Y, -st.h);
    const G = 900; const up = _v[0].set(st.ax, G, st.az).normalize(); const tilt = Math.acos(Math.min(1, up.y)), maxT = 0.22;
    if (tilt > maxT) { const s = Math.sin(maxT) / Math.max(1e-6, Math.hypot(up.x, up.z)); up.set(up.x * s, Math.cos(maxT), up.z * s); }
    _q2.setFromUnitVectors(Y, up); g.quaternion.copy(_q2).multiply(_q);
    g.updateMatrixWorld(true);
    if (opts.life !== false || opts.look) this._look(track, st, t, opts);
    return st;
  }

  /** models_r6 rig split (when present): lower torso from the mocap's pelvis / spine_01, the chest carries the rest of the torso
   *  rotation (counter-rotation emerges), wrists flex from the mocap hands. No-op on the unsplit rig. */
  _splitRig(P) {
    const J = this.F.J;
    if (J.chest && J.chest.parent === J.body) { const T = J.body.quaternion.clone(); _q.set(P.ex[0], P.ex[1], P.ex[2], P.ex[3]); J.body.quaternion.copy(_q); J.chest.quaternion.copy(_q.invert().multiply(T)); }
    if (J.wristR) J.wristR.rotation.set(0, 0, P.ex[12] * 0.8); if (J.wristL) J.wristL.rotation.set(0, 0, P.ex[13] * 0.8);
  }

  // ---------------------------------------------------------------------------------------------- life (pure in t)
  /** idle weight of a state: how much of it is standing locomotion (0 moving / one-shot clip .. 1 standing) */
  _idleW(track, st) { let w = 0, W = 0; for (const q of st.src) { W += q.w; if (q.k === 'loco') w += q.w * gaitInfo(track.G, q.v).w.idle; } return W > 0 ? w / W : 0; }
  /** breathing (chest heave, faster and deeper after exertion) and idle weight shifts (hips drift side to side; IK keeps the feet) */
  _lifeBody(track, st, t) {
    const J = this.F.J, ex = exertion(track, t), br = breath(this.seed, t, ex), wi = this._idleW(track, st); this._ex = ex; this._wi = wi;
    const chest = J.chest || J.body; _q.setFromAxisAngle(Z, -0.022 * br.depth * br.s); chest.quaternion.multiply(_q);
    _q.setFromAxisAngle(Z, 0.012 * br.depth * br.s); J.head.quaternion.multiply(_q);
    for (const [sd, sg] of [['shoulderR', -1], ['shoulderL', 1]]) { _q.setFromAxisAngle(X, sg * 0.018 * br.depth * (0.5 + 0.5 * br.s)); J[sd].quaternion.premultiply(_q); }
    if (wi > 0.01) { const ws = weightShift(this.seed, t) * wi; this.F.root.position.z += ws * 1.3 * this.rs; this.F.root.position.y -= Math.abs(ws) * 0.25 * this.rs;
      _q.setFromAxisAngle(X, -ws * 0.035); J.body.quaternion.premultiply(_q); _q.setFromAxisAngle(X, ws * 0.03); J.head.quaternion.premultiply(_q); }
  }
  /**
   * head (+ a share of the torso) aims at the look target; eyes lead; idle glances when nothing is targeted. look spec:
   * { at: Vector3 | [x, y, z] | (t) => either, t0, t1, fade = 0.3, w = 1, body = share of the yaw taken by the torso }, or an array.
   */
  _look(track, st, t, opts) {
    const specs = !opts.look ? [] : Array.isArray(opts.look) ? opts.look : [opts.look];
    const idle = opts.life !== false;
    const desired = (tk) => {
      const s = track.state(tk); let yaw = 0, pitch = 0, W = 0;
      for (const L of specs) {
        let w = L.w ?? 1; if (L.t0 != null) { const fd = L.fade ?? 0.3; w *= Math.min(smooth((tk - L.t0) / fd), L.t1 != null ? 1 - smooth((tk - (L.t1 - fd)) / fd) : 1); }
        if (w <= 1e-3) continue; let p = typeof L.at === 'function' ? L.at(tk) : L.at; if (!p) continue; if (!Array.isArray(p)) p = [p.x, p.y, p.z];
        const dx = p[0] - s.x, dz = p[2] - s.z, dy = p[1] - (s.y + this.headY), c = Math.cos(s.h), sn = Math.sin(s.h); const lx = dx * c + dz * sn, lz = -dx * sn + dz * c;
        const y = Math.max(-1.35, Math.min(1.35, Math.atan2(lz, lx))), pt = Math.max(-0.6, Math.min(0.45, Math.atan2(dy, Math.hypot(lx, lz)))); yaw += w * y; pitch += w * pt; W += w;
      }
      const g = idle ? glance(this.seed, tk) : [0, 0]; const wg = Math.max(0, 1 - W);
      if (W > 1) { yaw /= W; pitch /= W; }
      return [yaw + wg * g[0], pitch + wg * g[1]];
    };
    const [yaw, pitch] = follow(desired, t, { omega: 10, look: 0.7 }); const want = desired(t);
    const J = this.F.J, share = Math.min(0.5, (specs[0]?.body ?? 0.28) * (0.4 + 0.6 * (this._wi ?? 1)));
    _q.setFromAxisAngle(Y, -yaw * share); (J.chest || J.body).quaternion.premultiply(_q);
    _q.setFromAxisAngle(Y, -yaw * (1 - share)); _q2.setFromAxisAngle(Z, pitch * 0.8); J.head.quaternion.premultiply(_q2).premultiply(_q);
    this.group.updateMatrixWorld(true);
    // eyes: lead the head toward the wanted direction (what the head has not turned yet), plus saccades
    const sc = saccade(this.seed, t); this.face.eyeYaw = Math.max(-0.4, Math.min(0.4, (want[0] - yaw) * 0.8 + sc[0])); this.face.eyePitch = Math.max(-0.25, Math.min(0.25, (want[1] - pitch) * 0.6 + sc[1]));
    this._lookYaw = yaw;
  }
  /** face state for this frame (blinks, eyes from _look, mouth from opts.mouth) -> the figure's face API if models_r6 provides one */
  _faceOut(track, t, opts) {
    const b = opts.life === false ? 0 : blink(this.seed, t, { extra: opts.blinks || [] }); const f = this.face; f.blinkL = f.blinkR = b;
    if (opts.blink != null) f.blinkL = f.blinkR = Math.max(b, typeof opts.blink === 'function' ? opts.blink(t) : opts.blink);
    f.mouth = opts.mouth ? (typeof opts.mouth === 'function' ? opts.mouth(t) : opts.mouth) : null;
    const F = this.F; if (!F.face && typeof F.setFace !== 'function') return;
    // models_r6 face rig: { blink 0..1, look [x, y] in -1..1, viseme: one of rest A E O U M F } (the strongest mouth weight)
    let vis = 'rest'; if (f.mouth) { let best = -1; for (const [k, v] of Object.entries(f.mouth)) if (v > best) { best = v; vis = k; } }
    const st = { blink: Math.max(f.blinkL, f.blinkR), look: [Math.max(-1, Math.min(1, LOOK_SIGN[0] * f.eyeYaw / 0.4)), Math.max(-1, Math.min(1, LOOK_SIGN[1] * f.eyePitch / 0.25))], viseme: vis, mouth: f.mouth };
    if (typeof F.setFace === 'function') F.setFace(st); else F.face.set(st);
  }

  // ---------------------------------------------------------------------------------------------- springs (pure in t)
  /** anchor samples for every spring at grid index k (cached; a full pose without springs at k * GDT) */
  _anchorAt(track, k, opts) {
    const key = track.id + k; let A = this._anchors.get(key); if (A) return A;
    this.apply(track, k * GDT, { ...opts, springs: false, _inner: true }); A = this._grabAnchors();
    this._anchors.set(key, A); if (this._anchors.size > 8000) this._anchors.delete(this._anchors.keys().next().value);
    return A;
  }
  _grabAnchors() {
    return this.springs.map((sp) => { const a = typeof sp.anchor === 'string' ? this.F.J[sp.anchor] : sp.anchor; a.updateWorldMatrix(true, false);
      return { p: new THREE.Vector3(...sp.pivot).applyMatrix4(a.matrixWorld), q: a.getWorldQuaternion(new THREE.Quaternion()) }; });
  }
  _springsStep(track, t, opts, cur) {
    const k1 = Math.floor(t / GDT + 1e-9), n = Math.round(SPRING_LOOK / GDT); const series = [];
    for (let k = k1 - n; k <= k1; k++) series.push(this._anchorAt(track, k, opts));
    return { series, rem: t - k1 * GDT };
  }


  // ---------------------------------------------------------------------------------------------- feet
  _pt(sd, which, out) { const f = this.foot[sd]; f.parent.updateWorldMatrix(true, false); return out.copy(f[which]).applyMatrix4(f.parent.matrixWorld); }
  /** lock for contact interval iv: heel / toe world points (pivot = the lower one at contact time, put on the ground), foot dir */
  _lock(track, sd, iv, opts) {
    const key = track.id + sd + 'L' + iv.i0; let L = this._cache.get(key); if (L) return L;
    this.poseAt(track, iv.t0, opts);
    const heel = this._pt(sd, 'heel', V()), toe = this._pt(sd, 'toe', V());
    const dir = toe.clone().sub(heel).setY(0); if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0); dir.normalize();
    const len = this.foot[sd].len * this.scale, heelLow = heel.y <= toe.y; const pv = heelLow ? heel : toe; const fkY = pv.y;
    const tg = iv.lockT ?? iv.t0; const gP = track.ground(pv.x, pv.z, tg), gO = track.ground((heelLow ? toe : heel).x, (heelLow ? toe : heel).z, tg);
    pv.y = gO > gP && gO - gP < 0.3 * this.hip ? gO : gP;   // a foot over a small edge rests on the higher side (never on top of a wall it touches)
    const tl = iv.lockT ?? iv.t0; const gx = pv.x, gz = pv.z;
    if (heelLow) toe.copy(heel).addScaledVector(dir, len); else heel.copy(toe).addScaledVector(dir, -len);
    L = { heel, toe, dir, fkY, pivotY: pv.y, gx, gz, g0: track.ground(gx, gz, tl) }; this._cache.set(key, L); return L;
  }
  /** a lock at time t: on time-varying ground (a lift) the planted foot rides it (vertical follow of the ground under the pivot) */
  _lockAt(track, L, t) {
    const dy = track.ground(L.gx, L.gz, t) - L.g0; if (Math.abs(dy) < 1e-6) return L;
    return { ...L, heel: L.heel.clone().setY(L.heel.y + dy), toe: L.toe.clone().setY(L.toe.y + dy), pivotY: L.pivotY + dy };
  }
  /** IK - FK ankle offset at the end of a contact (the swing foot eases from the lock back to its FK path) */
  _liftOff(track, sd, iv, opts) {
    const key = track.id + sd + 'O' + iv.i0; let o = this._cache.get(key); if (o) return o;
    const L = this._lock(track, sd, iv, opts); const tl = Math.max(iv.t0, iv.t1 - DT);
    this.poseAt(track, tl, opts); const fk = this._ankleW(sd, V()); const fq = this._footQ(sd, new THREE.Quaternion());
    this._stance(sd, this._lockAt(track, L, tl)); const ik = this._ankleW(sd, V()); const iq = this._footQ(sd, new THREE.Quaternion());
    o = { off: ik.sub(fk), dq: iq.multiply(fq.invert()), lock: L }; this._cache.set(key, o); return o;
  }
  /** stance-plan - FK ankle offset (and foot rotation) at the start of a contact: where the swing must arrive */
  _strikeOff(track, sd, iv, opts) {
    const key = track.id + sd + 'S' + iv.i0; let o = this._cache.get(key); if (o) return o;
    const L = this._lock(track, sd, iv, opts); this.poseAt(track, iv.t0, opts);
    const fk = this._ankleW(sd, V()), fq = this._footQ(sd, new THREE.Quaternion());
    let off, dq;
    if (this.ankles) { const sp = this._stancePlan(sd, L); off = sp.ankle.clone().sub(fk); dq = sp.q.clone().multiply(fq.clone().invert()); }
    else { off = L.heel.clone().sub(this._pt(sd, 'heel', V())); dq = new THREE.Quaternion(); }
    o = { off, dq, lock: L }; this._cache.set(key, o); return o;
  }
  _ankleW(sd, out) { const f = this.foot[sd]; if (!this.ankles) return this._pt(sd, 'ankle', out); f.parent.updateWorldMatrix(true, false); return out.setFromMatrixPosition(f.parent.matrixWorld); }
  _footQ(sd, out) { return this.foot[sd].parent.getWorldQuaternion(out); }
  /** the planted foot: ankles -> flat on its lock with the FK pitch (heel / toe roll) and the lock's heading; rigid -> pin heel or toe */
  _stancePlan(sd, L) {
    const f = this.foot[sd];
    if (!this.ankles) return null;
    const fq = this._footQ(sd, _q3); const fw = _v[6].copy(X).applyQuaternion(fq); const pitch = Math.asin(Math.max(-1, Math.min(1, fw.y)));
    const fd = new THREE.Vector3(L.dir.x * Math.cos(pitch), Math.sin(pitch), L.dir.z * Math.cos(pitch));
    const right = new THREE.Vector3().crossVectors(fd, Y).normalize(), up = new THREE.Vector3().crossVectors(right, fd);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(fd, up, right));
    // desired world foot orientation includes the figure scale: points in ankle space scale by this.scale
    const usePivot = pitch >= 0 ? 'heel' : 'toe'; const pl = f[usePivot].clone().multiplyScalar(this.scale).applyQuaternion(q);
    const ankle = (usePivot === 'heel' ? L.heel : L.toe).clone().sub(pl);
    return { q, ankle, pivot: usePivot };
  }
  _stance(sd, L, plan = null) {
    const pole = this._pole(sd);
    if (this.ankles) {
      plan = plan || this._stancePlan(sd, L);
      this._solve(sd, plan.ankle, this.foot[sd].ankleLocal, pole); this._setFootQ(sd, plan.q); return plan.pivot;
    }
    this._solve(sd, L.heel, this.foot[sd].heel, pole);
    const toe = this._pt(sd, 'toe', _v[5]);
    if (toe.y < L.toe.y - 1e-3) { this._solve(sd, L.toe, this.foot[sd].toe, pole); return 'toe'; }
    return 'heel';
  }
  _setFootQ(sd, qWorld) { const kn = this.F.J['knee' + sd], aj = this.F.J['ankle' + sd]; kn.updateWorldMatrix(true, false); kn.getWorldQuaternion(_q); aj.quaternion.copy(_q.invert().multiply(qWorld)); aj.updateMatrixWorld(true); }
  _pole(sd) { const h = this.F.J['hip' + sd]; h.getWorldQuaternion(_q); return V().copy(X).applyQuaternion(_q); }
  /** two-bone IK: put knee-space point e of leg sd at world target, knee toward the world pole direction */
  _solve(sd, target, e, pole) {
    const J = this.F.J, hip = J['hip' + sd], knee = J['knee' + sd], legs = J.legs;
    legs.updateWorldMatrix(true, false); _m.copy(legs.matrixWorld).invert();
    const T = _v[1].copy(target).applyMatrix4(_m).sub(hip.position);
    legs.getWorldQuaternion(_q); const pl = _v[2].copy(pole).applyQuaternion(_q.invert());
    const K0 = knee.position, d = T.length();
    const endAt = (th, o) => o.set(e.x * Math.cos(th) + e.y * Math.sin(th), -e.x * Math.sin(th) + e.y * Math.cos(th), e.z).add(K0);
    const beta = Math.atan2(e.x, -e.y); let lo = Math.max(0, beta), hi = 2.6; const E = _v[3];
    if (endAt(lo, E).length() <= d) hi = lo; else if (endAt(hi, E).length() >= d) lo = hi;
    else for (let k = 0; k < 28; k++) { const m = (lo + hi) / 2; if (endAt(m, E).length() > d) lo = m; else hi = m; }
    const th = (lo + hi) / 2; endAt(th, E);
    const Tn = _v[4].copy(T).normalize(); _q.setFromUnitVectors(E.normalize(), Tn);
    const F = _v[0].copy(X).applyQuaternion(_q); F.addScaledVector(Tn, -F.dot(Tn)); pl.addScaledVector(Tn, -pl.dot(Tn));
    if (F.lengthSq() > 1e-8 && pl.lengthSq() > 1e-8) { F.normalize(); pl.normalize(); const ang = Math.atan2(_v[5].crossVectors(F, pl).dot(Tn), F.dot(pl)); _q2.setFromAxisAngle(Tn, ang); _q.premultiply(_q2); }
    hip.quaternion.copy(_q); knee.rotation.set(0, 0, -th);
    hip.updateMatrixWorld(true);
  }

  /**
   * Pose the hero at song time t: mocap / layers (FK), then foot locking. opts: { layers, pencil, ik = true }.
   * Returns the track state. this.debug.R / .L = { mode: 'heel' | 'toe' | 'swing' | 'fk', pivot (world lock point) }.
   */
  apply(track, t, opts = {}) {
    if (opts.freezeAt != null && t > opts.freezeAt) t = opts.freezeAt;   // a deliberate song stop: hold the whole pose (life included)
    if (!track.id) track.id = 'tr' + (MotionFigure._ids = (MotionFigure._ids || 0) + 1) + ':';
    const doSpr = opts.springs !== false && this.springs.length > 0;
    const pre = doSpr ? this._springsStep(track, t, opts) : null;   // past anchors first (they re-pose the figure), then this frame
    const st = this._apply(track, t, opts);
    if (doSpr) {
      const cur = this._grabAnchors(); this.debug.springs = {};
      for (let i = 0; i < this.springs.length; i++) { const sp = this.springs[i]; const A = pre.series.map((a) => a[i]); A.push(cur[i]);
        const th = simSpring(sp, A.slice(0, -1), pre.rem); const w = sp.playing ? 1 - (this._animW || 0) : 1;
        sp.apply(this, rotvecQuat(th, _q3), w); this.debug.springs[sp.name] = th.length(); }
      this.group.updateMatrixWorld(true);
    }
    if (!opts._inner && opts.face !== false) this._faceOut(track, t, opts);
    return st;
  }
  _apply(track, t, opts = {}) {
    const ik = opts.ik !== false; const plan = {};
    if (ik) for (const sd of ['R', 'L']) {
      const { cur, prev, next } = track.contactAt(sd, t);
      if (cur) { plan[sd] = { lock: this._lockAt(track, this._lock(track, sd, cur, opts), t) }; continue; }
      // swing: the IK correction blends across the whole swing from the lift-off lock to the next plant (both deterministic),
      // with a minimum clearance arc, so every swing is a real step even where the blended FK would drag the foot
      const A = prev ? this._liftOff(track, sd, prev, opts) : null, B = next ? this._strikeOff(track, sd, next, opts) : null;
      const p = { off: V(), dq: new THREE.Quaternion(), arc: 0 }; let any = false;
      if (A && B) { const pr = (t - prev.t1) / Math.max(1e-6, next.t0 - prev.t1), w = smooth(pr); p.off.copy(A.off).lerp(B.off, w); p.dq.copy(A.dq).slerp(B.dq, w);
        const d = Math.hypot(B.lock.heel.x - A.lock.heel.x, B.lock.heel.z - A.lock.heel.z); p.arc = Math.min(this.clear, 0.35 * d) * Math.sin(Math.PI * Math.min(1, Math.max(0, pr))); any = true; }
      else if (A) { const a = 1 - smooth((t - prev.t1) / 0.14); if (a > 0) { p.off.copy(A.off).multiplyScalar(a); p.dq.slerp(A.dq, a); any = true; } }
      else if (B) { const a = smooth(1 - (next.t0 - t) / 0.14); if (a > 0) { p.off.copy(B.off).multiplyScalar(a); p.dq.slerp(B.dq, a); any = true; } }
      plan[sd] = any ? p : null;
    }
    const st = this.poseAt(track, t, opts);
    if (!ik) { this._hands(st, t, opts.hands); return st; }
    // stance targets (from the FK foot pitch), then a pelvis drop so both planted feet stay reachable (soft-capped)
    let drop = 0;
    for (const sd of ['R', 'L']) { const L = plan[sd]?.lock; if (!L) continue;
      const sp = this._stancePlan(sd, L); plan[sd].sp = sp; const tgt = sp ? sp.ankle : L.heel; const e = sp ? this.foot[sd].ankleLocal : this.foot[sd].heel;
      const H = this.F.J['hip' + sd].getWorldPosition(_v[0]); const R = 0.995 * (this.thigh + e.length()) * this.scale;
      const dx = tgt.x - H.x, dz = tgt.z - H.z; const need = H.y - tgt.y - Math.sqrt(Math.max(0, R * R - dx * dx - dz * dz)); if (need > drop) drop = need; }
    if (drop > 0) { const m = this.maxDrop, k0 = 0.65 * m; if (drop > k0) drop = k0 + (m - k0) * Math.tanh((drop - k0) / (m - k0));   // exact up to 65% of the cap, then soft
      this.group.position.y -= drop; this.group.updateMatrixWorld(true); }
    this.drop = drop;
    for (const sd of ['R', 'L']) {
      const p = plan[sd]; const D = this.debug[sd];
      if (p?.lock) { D.mode = this._stance(sd, p.lock, p.sp); D.pivot = (D.mode === 'heel' ? p.lock.heel : p.lock.toe).clone(); continue; }
      // swing: FK + the swing correction, clearing the ground by the arc
      const fq = this._footQ(sd, new THREE.Quaternion());
      const ank = this._ankleW(sd, V()); if (p) ank.add(p.off);
      const heel = this._pt(sd, 'heel', _v[0]), toe = this._pt(sd, 'toe', _v[1]); const dx = p ? p.off.x : 0, dz = p ? p.off.z : 0;
      // clearance near ledges: the ground under the heel, toe and a little ahead of the toe (the toe clears an edge before it gets
      // there, +0.8 margin near any edge). A wall (ground far above the foot) pushes the foot back out of it instead of lifting it.
      const fx = toe.x - heel.x, fz = toe.z - heel.z, fl = Math.hypot(fx, fz) || 1, ux = fx / fl, uz = fz / fl, low0 = Math.min(heel.y, toe.y) + (p ? p.off.y : 0);
      const gAt = (x, z) => track.ground(x, z, t), gA = gAt(ank.x, ank.z);
      let gy = Math.max(gA, gAt(heel.x + dx, heel.z + dz), gAt(toe.x + dx, toe.z + dz)), wall = 0;
      for (const a of [0.35, 0.7]) { const g2 = gAt(toe.x + dx + ux * fl * a, toe.z + dz + uz * fl * a); if (g2 > gy) gy = g2; }
      if (gy - low0 > 0.35 * this.hip) {   // a wall in front of the foot: back off until the toe is clear (up to a foot length)
        for (let k = 1; k <= 12; k++) { const b = k * fl / 8; if (Math.max(gAt(toe.x + dx - ux * b, toe.z + dz - uz * b), gAt(heel.x + dx - ux * b, heel.z + dz - uz * b)) - low0 <= 0.35 * this.hip) { wall = b; break; } }
        if (wall > 0) { ank.x -= ux * wall; ank.z -= uz * wall; gy = Math.max(gAt(heel.x + dx - ux * wall, heel.z + dz - uz * wall), gAt(toe.x + dx - ux * wall, toe.z + dz - uz * wall), gAt(ank.x, ank.z)); }
      }
      if (gy !== gA || wall) gy += 0.8;
      const low = low0, need = gy + (p ? p.arc : 0); if (low < need) ank.y += need - low;
      if (p || low < need || wall) {
        this._solve(sd, ank, this.foot[sd].ankleLocal || this.foot[sd].ankle, this._pole(sd));
        if (this.ankles) { if (p) fq.premultiply(p.dq); this._setFootQ(sd, fq); }
        D.mode = 'swing';
      } else D.mode = 'fk';
      D.pivot = null;
    }
    this._hands(st, t, opts.hands);
    return st;
  }
  // ---------------------------------------------------------------------------------------------- hands (arm IK)
  /**
   * two-bone arm IK: hand sd at a world target, elbow toward pole (J.body-space direction), blended with the FK arm by w.
   * Reach is clamped (a target out of reach gets a straight arm pointing at it). Returns the residual distance (world).
   */
  solveArm(sd, target, w = 1, pole = null) {
    if (w <= 0) return 0;
    const J = this.F.J, sh = J['shoulder' + sd], body = sh.parent, el = J['elbow' + sd], hd = J['hand' + sd];   // the shoulder's parent (J.chest on the split rig)
    body.updateWorldMatrix(true, false); _m.copy(body.matrixWorld).invert();
    const T = _v[0].copy(target).applyMatrix4(_m).sub(sh.position); const d = T.length();
    const E0 = el.position, Hh = hd.parent === el ? hd.position : _v[6].copy(hd.position).applyQuaternion(hd.parent.quaternion).add(hd.parent.position);   // split rig: hand under the wrist
    const handAt = (th, out) => out.set(Hh.x * Math.cos(th) - Hh.y * Math.sin(th), Hh.x * Math.sin(th) + Hh.y * Math.cos(th), Hh.z).add(E0);
    let lo = 0, hi = 2.7; const H0 = _v[1];
    if (handAt(0, H0).length() <= d) hi = 0; else if (handAt(hi, H0).length() >= d) lo = hi;
    else for (let k = 0; k < 26; k++) { const m = (lo + hi) / 2; if (handAt(m, H0).length() > d) lo = m; else hi = m; }
    const th = (lo + hi) / 2; handAt(th, H0);
    const Tn = _v[2].copy(T).normalize(); _q.setFromUnitVectors(H0.normalize(), Tn);
    const pl = pole ? _v[4].set(pole[0], pole[1], pole[2]) : _v[4].set(-0.3, -1, sd === 'R' ? 0.75 : -0.75);
    const E1 = _v[3].copy(E0).applyQuaternion(_q); E1.addScaledVector(Tn, -E1.dot(Tn)); pl.addScaledVector(Tn, -pl.dot(Tn));
    if (E1.lengthSq() > 1e-8 && pl.lengthSq() > 1e-8) { E1.normalize(); pl.normalize(); const ang = Math.atan2(_v[5].crossVectors(E1, pl).dot(Tn), E1.dot(pl)); _q2.setFromAxisAngle(Tn, ang); _q.premultiply(_q2); }
    if (w >= 1) { sh.quaternion.copy(_q); el.rotation.set(0, 0, th); }
    else { sh.quaternion.slerp(_q, w); const e0 = el.rotation.z; el.rotation.set(0, 0, e0 + (th - e0) * w); }
    sh.updateMatrixWorld(true);
    return Math.max(0, d - handAt(th, _v[1]).length());
  }
  /** resolve a hand spec { at: Vector3 | [x, y, z] | (t) => either, w: number | (t) => number, t0, t1, fade, pole } at t */
  static handTarget(spec, t, fig = null) {
    if (!spec) return null; let w = typeof spec.w === 'function' ? spec.w(t) : (spec.w ?? 1);
    if (spec.t0 != null) { const fd = spec.fade ?? 0.2; w *= Math.min(smooth((t - spec.t0) / fd), spec.t1 != null ? 1 - smooth((t - (spec.t1 - fd)) / fd) : 1); }
    if (w <= 0) return null; let p = typeof spec.at === 'function' ? spec.at(t, fig) : spec.at; if (!p) return null;
    if (Array.isArray(p)) p = new THREE.Vector3(p[0], p[1], p[2]);
    return { p, w: Math.min(1, w), pole: spec.pole || null, pose: spec.pose || null, palm: spec.palm || null };
  }
  _hands(st, t, hands) {
    this.debug.hands = {};
    const resolve = () => { const out = {};
      for (const sd of ['R', 'L']) {
        let tg = null; const tr = st['h' + sd]; if (tr && tr[3] > 0) tg = { p: new THREE.Vector3(tr[0], tr[1], tr[2]), w: tr[3], pole: null, track: true };   // track (climb)
        const sp = hands && MotionFigure.handTarget(hands[sd], t, this); if (sp) tg = tg ? (sp.w >= tg.w ? sp : tg) : sp;
        if (tg && tg.palm) tg.p = tg.p.clone().addScaledVector(_v[6].set(...tg.palm), this.palm);   // the hand joint sits a palm's thickness off the surface
        out[sd] = tg; }
      return out; };
    let T = resolve();
    // one hip bend for both hands (the farther target decides), then re-evaluate (torso-relative targets move with it) and solve
    const need = ['R', 'L'].filter((sd) => T[sd]).map((sd) => ({ sd, d: this._reachNeed(sd, T[sd].p) })).sort((x, y) => y.d - x.d)[0];
    if (need && need.d > 0) { this._reachLean(need.sd, T[need.sd].p, T[need.sd].w); T = resolve(); }
    for (const sd of ['R', 'L']) {
      const tg = T[sd], tr = st['h' + sd];
      if (this.F.setHand) this.F.setHand(sd, tg && tg.w > 0.5 && tg.pose ? tg.pose : (hands?.pose?.[sd] || (tr && tr[3] > 0.5 ? 'open' : 'fist')));   // finger poses (models_r6 rig)
      if (!tg) continue; const res = this.solveArm(sd, tg.p, tg.w, tg.pole); this.debug.hands[sd] = { target: tg.p, w: tg.w, residual: res };
    }
  }
  _armLen(sd) { const J = this.F.J, hd = J['hand' + sd], el = J['elbow' + sd]; return el.position.length() + (hd.parent === el ? hd.position.length() : hd.position.clone().add(hd.parent.position).length()); }
  /** how far (model units) a target is beyond 94% of the arm from the shoulder */
  _reachNeed(sd, target) { const sh = this.F.J['shoulder' + sd]; sh.updateWorldMatrix(true, false); return sh.getWorldPosition(_v[5]).distanceTo(target) / this.scale - 0.94 * this._armLen(sd); }
  /** bend at the hips toward a hand target that is out of reach (no lunge: the feet stay; up to 40 deg forward, 25 deg sideways) */
  _reachLean(sd, target, w) {
    const J = this.F.J, sh = J['shoulder' + sd], arm = this._armLen(sd);
    const dist = () => { sh.updateWorldMatrix(true, false); return sh.getWorldPosition(_v[5]).distanceTo(target) / this.scale; };
    if (dist() <= 0.94 * arm) return;
    const body = J.body, q0 = body.quaternion.clone(); body.updateWorldMatrix(true, false);
    const loc = _v[4].copy(target).applyMatrix4(_m.copy(body.matrixWorld).invert()); const yaw = Math.atan2(-loc.z, loc.x);   // toward the target in body space
    const axis = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();   // tips the torso toward the target
    let lo = 0, hi = 0.7;
    for (let k = 0; k < 10; k++) { const m = (lo + hi) / 2; body.quaternion.copy(q0).premultiply(_q.setFromAxisAngle(axis, m)); body.updateMatrixWorld(true); if (dist() > 0.94 * arm) lo = m; else hi = m; }
    body.quaternion.copy(q0).premultiply(_q.setFromAxisAngle(axis, hi * Math.min(1, w))); body.updateMatrixWorld(true);
  }

  /** world position of a hand ('R' | 'L') after apply() */
  hand(sd = 'R', out = V()) { const h = this.F.J['hand' + sd]; h.updateWorldMatrix(true, false); return h.getWorldPosition(out); }
  /** world positions of a foot's heel / toe (after apply()) */
  footPts(sd) { return { heel: this._pt(sd, 'heel', V()), toe: this._pt(sd, 'toe', V()) }; }
}
