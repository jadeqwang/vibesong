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
import { figureModel, buildFigure, pose as voxPose, patchVoxelEdges, FIGURE_SRC } from '../../voxfig.js';
import { Pose, blendPoses, layerPose, captureFigure, applyToFigure, sampleClip } from './clips.js';
import { gaitWeights, DT } from './track.js';

const V = () => new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _v = [V(), V(), V(), V(), V(), V(), V()];
const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
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
  constructor(lib, hero, { variant = null, scale = 1, material = null, armOut = 7, src = FIGURE_SRC, ankles = true, maxDrop = 0.22 } = {}) {
    this.hero = hero; this.armOut = armOut * Math.PI / 180; this.ankles = ankles;
    this.group = new THREE.Group(); this.orient = new THREE.Group(); this.orient.scale.setScalar(scale); this.group.add(this.orient);
    material = material || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); material.vertexColors = true; material.userData.noPaint = true;
    const vname = variant || (hero === 'jade' ? 'jade_up' : hero); this.vname = vname;
    lib._figModels ||= new Map(); const key = src + ':' + vname; let model = lib._figModels.get(key);
    if (!model) { model = figureModel(vname, lib.turn, src); lib._figModels.set(key, model); }
    if (model.native) patchVoxelEdges(material, model.u / model.native.res * scale, 0.2);
    this.F = buildFigure(model, material, { hero, down: vname === 'jade_down', items: lib.turn?.items }); this.F.hatless = vname === 'charlie_nohat';
    this.orient.add(this.F.root);
    const P = model.piv; this.rs = P[2].y / 45.5; this.unit = this.rs * scale; this.scale = scale;   // model / world units per design unit
    // feet: sole heel / toe points and the ankle, from the shin mesh bounds (knee space; the shoe is part of the shin mesh)
    this.foot = {}; const rs = this.rs;
    for (const sd of ['R', 'L']) {
      const kn = this.F.J['knee' + sd], m = kn.children.find((c) => c.isMesh); m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; const ins = 1.3 * rs, zc = (b.min.z + b.max.z) / 2;
      const ankle = new THREE.Vector3(0, b.min.y + 6 * rs, zc);
      const f = { heel: new THREE.Vector3(b.min.x + ins, b.min.y, zc), toe: new THREE.Vector3(b.max.x - ins, b.min.y, zc), ankle, len: b.max.x - b.min.x - 2 * ins, parent: kn };
      if (ankles) {
        const { shin, foot } = splitShin(m.geometry, b.min.y + 7.6 * rs, 1.7 * rs); m.geometry = shin;
        const aj = new THREE.Group(); aj.position.copy(ankle); kn.add(aj); const fm = new THREE.Mesh(foot, material); fm.castShadow = fm.receiveShadow = true; fm.userData.noPaint = true; fm.position.copy(ankle).negate(); aj.add(fm);
        this.F.J['ankle' + sd] = aj; f.parent = aj; f.heel.sub(ankle); f.toe.sub(ankle); f.ankleLocal = ankle.clone(); f.ankle = new THREE.Vector3();   // points now in ankle space
      }
      this.foot[sd] = f;
    }
    this.thigh = this.F.J.kneeR.position.length(); this.maxDrop = maxDrop * P[2].y * scale; this.clear = 0.14 * P[2].y * scale;   // max swing clearance
    this._cache = new Map(); this._pool = Array.from({ length: 20 }, () => new Pose()); this.debug = { R: {}, L: {} };
  }

  // ---------------------------------------------------------------------------------------------- pose evaluation
  /** blended pose of a track state's sources (gait blend by speed at the distance phase, clips by progress) */
  evalSources(track, st, out) {
    const poses = [], ws = []; let k = 0; const take = () => this._pool[k++];
    for (const q of st.src) {
      if (q.w <= 1e-4 || k > 15) continue;
      if (q.k === 'clip') { poses.push(sampleClip(track.clips[q.c], q.u, take(), this.rs)); ws.push(q.w); continue; }
      const g = gaitWeights(track.G, q.v); const sub = [], sw = [];
      if (g.idle > 0) { const ic = track.clips.idle; sub.push(sampleClip(ic, ((st.t - track.t0) / ic.dur) % 1, take(), this.rs)); sw.push(g.idle); }
      for (const gg of ['walk', 'jog', 'run']) if (g[gg] > 0) { sub.push(sampleClip(track.G[gg].clip, st.ph, take(), this.rs)); sw.push(g[gg]); }
      const p = take(); blendPoses(p, sub, sw); poses.push(p); ws.push(q.w);
    }
    if (!poses.length) return out.identity();
    return blendPoses(out, poses, ws);
  }
  /** layers: [{ anim (voxfig keyed pose) | clip (mocap), t0, t1, fade = 0.2, mask = 'upper', rate (cycles/s), p(t) }] */
  _layered(track, st, P, layers, pencil, t) {
    let itemsDone = false;
    for (const L of layers) {
      const fade = L.fade ?? 0.2; const w = Math.min(smooth((t - L.t0) / fade), 1 - smooth((t - (L.t1 - fade)) / fade)); if (w <= 0) continue;
      const K = this._pool[19];
      if (L.anim) { const p = L.p ? L.p(t) : (((t - L.t0) * (L.rate ?? 1)) % 1); voxPose(this.F, L.anim, p, { hero: this.hero, pencil: L.pencil ?? pencil }); captureFigure(this.F, K); K.root.fill(0); if (w > 0.5) itemsDone = true; else voxPose(this.F, 'idle', 0, { hero: this.hero, pencil }); }
      else { const c = track.clips[L.clip]; sampleClip(c, L.p ? L.p(t) : (t - L.t0) * (L.rate ?? 1) / c.dur, K, this.rs); }
      layerPose(P, P, K, w, L.mask ?? 'upper', L.rootW ?? 0);
    }
    return itemsDone;
  }
  /** FK pose at t (no IK): sets every joint, the root offset and the group transform; returns the track state */
  poseAt(track, t, { layers = [], pencil = false } = {}) {
    const st = track.state(t); const P = this._pool[18];
    this.evalSources(track, st, P);
    const items = layers.length ? this._layered(track, st, P, layers, pencil, t) : false;
    if (!items) voxPose(this.F, 'idle', 0, { hero: this.hero, pencil });   // items (pencils, guitar, cap) at their defaults
    if (this.armOut) { // a little abduction so mocap arms clear the chunky torso
      for (const [sd, sg] of [['shoulderR', -1], ['shoulderL', 1]]) { P.quat(sd, _q); _q2.setFromAxisAngle(X, sg * this.armOut); P.setQuat(sd, _q.premultiply(_q2)); } }
    applyToFigure(this.F, P);
    if (this.ankles) { this.F.J.ankleR.rotation.set(0, 0, P.ankle[0]); this.F.J.ankleL.rotation.set(0, 0, P.ankle[1]); }
    const g = this.group; g.position.set(st.x, st.y, st.z);
    _q.setFromAxisAngle(Y, -st.h);
    const G = 900; const up = _v[0].set(st.ax, G, st.az).normalize(); const tilt = Math.acos(Math.min(1, up.y)), maxT = 0.22;
    if (tilt > maxT) { const s = Math.sin(maxT) / Math.max(1e-6, Math.hypot(up.x, up.z)); up.set(up.x * s, Math.cos(maxT), up.z * s); }
    _q2.setFromUnitVectors(Y, up); g.quaternion.copy(_q2).multiply(_q);
    g.updateMatrixWorld(true);
    return st;
  }

  // ---------------------------------------------------------------------------------------------- feet
  _pt(sd, which, out) { const f = this.foot[sd]; f.parent.updateWorldMatrix(true, false); return out.copy(f[which]).applyMatrix4(f.parent.matrixWorld); }
  /** lock for contact interval iv: heel / toe world points (pivot = the lower one at contact time, put on the ground), foot dir */
  _lock(track, sd, iv, opts) {
    const key = track.id + sd + 'L' + iv.i0; let L = this._cache.get(key); if (L) return L;
    this.poseAt(track, iv.t0, opts);
    const heel = this._pt(sd, 'heel', V()), toe = this._pt(sd, 'toe', V());
    const dir = toe.clone().sub(heel).setY(0); if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0); dir.normalize();
    const len = this.foot[sd].len * this.scale, heelLow = heel.y <= toe.y; const pv = heelLow ? heel : toe; const fkY = pv.y; pv.y = track.ground(pv.x, pv.z);
    if (heelLow) toe.copy(heel).addScaledVector(dir, len); else heel.copy(toe).addScaledVector(dir, -len);
    L = { heel, toe, dir, fkY, pivotY: pv.y }; this._cache.set(key, L); return L;
  }
  /** IK - FK ankle offset at the end of a contact (the swing foot eases from the lock back to its FK path) */
  _liftOff(track, sd, iv, opts) {
    const key = track.id + sd + 'O' + iv.i0; let o = this._cache.get(key); if (o) return o;
    const L = this._lock(track, sd, iv, opts); const tl = Math.max(iv.t0, iv.t1 - DT);
    this.poseAt(track, tl, opts); const fk = this._ankleW(sd, V()); const fq = this._footQ(sd, new THREE.Quaternion());
    this._stance(sd, L); const ik = this._ankleW(sd, V()); const iq = this._footQ(sd, new THREE.Quaternion());
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
    if (!track.id) track.id = 'tr' + (MotionFigure._ids = (MotionFigure._ids || 0) + 1) + ':';
    const ik = opts.ik !== false; const plan = {};
    if (ik) for (const sd of ['R', 'L']) {
      const { cur, prev, next } = track.contactAt(sd, t);
      if (cur) { plan[sd] = { lock: this._lock(track, sd, cur, opts) }; continue; }
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
    if (!ik) return st;
    // stance targets (from the FK foot pitch), then a pelvis drop so both planted feet stay reachable (soft-capped)
    let drop = 0;
    for (const sd of ['R', 'L']) { const L = plan[sd]?.lock; if (!L) continue;
      const sp = this._stancePlan(sd, L); plan[sd].sp = sp; const tgt = sp ? sp.ankle : L.heel; const e = sp ? this.foot[sd].ankleLocal : this.foot[sd].heel;
      const H = this.F.J['hip' + sd].getWorldPosition(_v[0]); const R = 0.995 * (this.thigh + e.length()) * this.scale;
      const dx = tgt.x - H.x, dz = tgt.z - H.z; const need = H.y - tgt.y - Math.sqrt(Math.max(0, R * R - dx * dx - dz * dz)); if (need > drop) drop = need; }
    if (drop > 0) { drop = this.maxDrop * Math.tanh(drop / this.maxDrop); this.group.position.y -= drop; this.group.updateMatrixWorld(true); }
    this.drop = drop;
    for (const sd of ['R', 'L']) {
      const p = plan[sd]; const D = this.debug[sd];
      if (p?.lock) { D.mode = this._stance(sd, p.lock, p.sp); D.pivot = (D.mode === 'heel' ? p.lock.heel : p.lock.toe).clone(); continue; }
      // swing: FK + the swing correction, clearing the ground by the arc
      const fq = this._footQ(sd, new THREE.Quaternion());
      const ank = this._ankleW(sd, V()); if (p) ank.add(p.off);
      const heel = this._pt(sd, 'heel', _v[0]), toe = this._pt(sd, 'toe', _v[1]); const gy = track.ground(ank.x, ank.z);
      const low = Math.min(heel.y, toe.y) + (p ? p.off.y : 0), need = gy + (p ? p.arc : 0); if (low < need) ank.y += need - low;
      if (p || low < need) {
        this._solve(sd, ank, this.foot[sd].ankleLocal || this.foot[sd].ankle, this._pole(sd));
        if (this.ankles) { if (p) fq.premultiply(p.dq); this._setFootQ(sd, fq); }
        D.mode = 'swing';
      } else D.mode = 'fk';
      D.pivot = null;
    }
    return st;
  }
  /** world position of a hand ('R' | 'L') after apply() */
  hand(sd = 'R', out = V()) { const h = this.F.J['hand' + sd]; h.updateWorldMatrix(true, false); return h.getWorldPosition(out); }
  /** world positions of a foot's heel / toe (after apply()) */
  footPts(sd) { return { heel: this._pt(sd, 'heel', V()), toe: this._pt(sd, 'toe', V()) }; }
}
