// Hand contacts for MotionFigure.apply(tr, t, { hands: { R: spec, L: spec } }) (two-bone arm IK, blended with the FK arm by
// the spec's weight envelope). A spec: { at: Vector3 | [x, y, z] | (t) => either (world), t0, t1, fade, w, pole (J.body-space
// elbow direction) }. These helpers build specs for the staged contacts; all are pure functions of t.
import * as THREE from 'three';
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const V = (p) => (Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p.clone());

/** hold a world point from t0 to t1 (fade in / out): e.g. both hands on the planted tripod legs, a ledge, a rail */
export function hold(at, t0, t1, { fade = 0.2, pole = null, w = 1, pose = 'grip' } = {}) { return { at, t0, t1, fade, pole, w, pose, kind: 'hold' }; }
/**
 * press a button / plate: reach from t0 (arrives at tHit), push `depth` along `dir` (default down) for `hold` s, release by t1.
 * Returns { spec, hit: tHit } (put the button's own travel / light on `hit`).
 */
export function press(at, t0, { tHit = t0 + 0.45, depth = 2.2, dir = [0, -1, 0], hold: hd = 0.1, t1 = null, pole = null, pose = 'open' } = {}) {
  const base = V(at), d = V(dir).normalize(); const end = t1 ?? tHit + hd + 0.45;
  // the hand comes in from 4 units above / behind the cap, lands on it at tHit, pushes `depth` over ~2 frames, holds, lifts off
  const fn = (t) => { const k = smooth((t - tHit) / 0.07) * (1 - smooth((t - (tHit + 0.07 + hd)) / 0.08)); const app = 1 - smooth((t - t0) / Math.max(0.05, tHit - t0));
    const lift = smooth((t - (tHit + 0.15 + hd)) / 0.25);
    return base.clone().addScaledVector(d, depth * k).addScaledVector(d, -4 * Math.max(app, lift)); };
  return { spec: { at: fn, t0, t1: end, fade: Math.min(0.25, (tHit - t0) * 0.6), pole, pose, palm: d.clone().negate().toArray(), kind: 'press', hit: tHit, push: [tHit, tHit + 0.07 + hd] }, hit: tHit };
}
/** follow an object's local points (a carried prop: tripod, cap): the stager poses the prop for t first, then calls apply */
export function onObject(obj, local, t0 = null, t1 = null, { fade = 0.2, pole = null } = {}) {
  const p = V(local); return { at: () => { obj.updateWorldMatrix(true, false); return p.clone().applyMatrix4(obj.matrixWorld); }, t0, t1, fade, pole, pose: 'grip', kind: 'carry' };
}
/** both hands on a two-handled prop: { R, L } specs at its local handle points */
export function carry(obj, { R, L }, t0 = null, t1 = null, o = {}) { return { R: onObject(obj, R, t0, t1, o), L: onObject(obj, L, t0, t1, o) }; }
/** the torso joint a carried prop rides on (the chest on the split rig) */
const torso = (fig) => fig.F.J.chest || fig.F.J.body;
/**
 * carry in front of the chest: hand targets at torso-local points (model units / fig.F.model.u = design units), computed
 * inside apply from this frame's posed torso, so the hands and the prop (place it with carryFrame AFTER apply) agree exactly.
 */
export function carryBody(fig, { R = null, L = null, reach = 0.8 } = {}, t0 = null, t1 = null, { fade = 0.25 } = {}) {
  const b0 = torso(fig), u = fig.F.model?.u ?? 1;
  // default handles: in front of and below each shoulder, at `reach` x the arm length (comfortably inside it), hands a little inward
  const auto = (sd) => { const sh = fig.F.J['shoulder' + sd]; const p = sh.position.clone(); if (sh.parent !== b0) p.add(sh.parent.position); const a = fig._armLen(sd) * reach;
    return [(p.x + 0.62 * a) / u, (p.y - 0.72 * a) / u, (p.z * 0.75) / u]; };
  const mk = (loc) => ({ at: (t, f) => { const b = torso(f || fig); b.updateWorldMatrix(true, false); return new THREE.Vector3(loc[0] * u, loc[1] * u, loc[2] * u).applyMatrix4(b.matrixWorld); }, t0, t1, fade, pose: 'grip', kind: 'carry' });
  const r = R || auto('R'), l = L || auto('L'); const out = { R: mk(r), L: mk(l) }; out.mid = [(r[0] + l[0]) / 2, (r[1] + l[1]) / 2, 0]; return out;
}
/** where a body-carried prop should be this frame (call after apply): { position, quaternion } of torso-local `local` */
export function carryFrame(fig, local = [8, -7, 0]) {
  const b = torso(fig); b.updateWorldMatrix(true, false); const u = fig.F.model?.u ?? 1;
  return { position: new THREE.Vector3(local[0] * u, local[1] * u, local[2] * u).applyMatrix4(b.matrixWorld), quaternion: b.getWorldQuaternion(new THREE.Quaternion()) };
}
/** a guitar point ('fret' | 'strum' | 'base', holder-local from voxfig) in world space, after the figure is posed */
export function guitarPoint(fig, which = 'fret', slide = 0) {
  const g = fig.F.items?.guitar; if (!g) return null; g.updateWorldMatrix(true, false); const p = (g.userData[which] || g.userData.fret).clone(); p.x += slide * (fig.F.model?.u ?? 1);
  return p.applyMatrix4(g.matrixWorld);
}
/** left hand on the guitar neck (fret position slides along the neck by slide(t) model px) */
export function neckHand(fig, t0, t1, { slide = () => 0, fade = 0.2 } = {}) { return { at: (t) => guitarPoint(fig, 'fret', slide(t)), t0, t1, fade, pole: [0.1, -1, -0.7], pose: 'grip' }; }
/** a hand on a point of a figure's own (or another figure's) joint, joint-local model units: e.g. Charlie's hand to his cap
 *  (`onJoint(charlie, 'cap', [1, 2, 0], t0, t1)`; J.cap on the split rig, J.head otherwise) */
export function onJoint(fig, joint, local = [0, 0, 0], t0 = null, t1 = null, { fade = 0.2, pose = 'grip', pole = null } = {}) {
  const p = V(local); return { at: () => { const j = fig.F.J[joint] || fig.F.J.head; j.updateWorldMatrix(true, false); return p.clone().applyMatrix4(j.matrixWorld); }, t0, t1, fade, pose, pole, kind: 'hold' };
}
/**
 * set a held item down on a spot: the hand comes down onto `at` by tDown (the item touches there: reparent it from the hand to the
 * world at tDown), rests `hold` s, then lifts away open. Returns { spec, down }. For floor-level spots, crouch with a clip
 * (track.clip('pickup') covers ~0.83 s) or the hip bend reaches about 40 deg.
 */
export function place(at, t0, { tDown = t0 + 0.5, hold: hd = 0.15, lift = 4, pose = 'grip', pole = null } = {}) {
  const base = V(at); const up = new THREE.Vector3(0, 1, 0);
  const fn = (t) => base.clone().addScaledVector(up, lift * Math.max(1 - smooth((t - t0) / Math.max(0.05, tDown - t0)), smooth((t - (tDown + hd)) / 0.3)));
  return { spec: { at: fn, t0, t1: tDown + hd + 0.4, fade: Math.min(0.25, (tDown - t0) * 0.6), pole, pose, kind: 'place', push: [tDown, tDown + hd] }, down: tDown };
}
