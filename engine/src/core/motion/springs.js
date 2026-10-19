// Secondary motion: small-angle rotational springs on loose parts (bun pencils, slung guitars; hair / straps / cap brim once
// models_r6 separates them), driven by the motion of their anchor joint. Deterministic: each frame re-simulates a fixed
// look-back (SPRING_LOOK s) on the absolute 60 Hz grid from rest, using anchor transforms that are pure functions of
// (track, grid time) (MotionFigure caches them), so any frame renders the same alone or in sequence.
import * as THREE from 'three';

export const GDT = 1 / 60;
export const SPRING_LOOK = 1.0;
/**
 * spring spec: { name, anchor: 'body' | 'head' | joint name, pivot: [x, y, z] (anchor-local, model units), dir: [x, y, z] (pivot
 * -> the part's mass, anchor-local), freq (Hz), zeta, gain (rad/s^2 per world u/s^2 of pivot acceleration), inertia (0..1:
 * how much the part keeps its world orientation when the anchor rotates), max (rad), lim: { x: [lo, hi], y, z } (rad, anchor
 * axes; e.g. a guitar can't swing into the belly), apply(fig, q, w) }
 */
const _a = new THREE.Vector3(), _d = new THREE.Vector3(), _t = new THREE.Vector3(), _qi = new THREE.Quaternion(), _qr = new THREE.Quaternion(), _w0 = new THREE.Vector3(), _w1 = new THREE.Vector3();
/** angular velocity (anchor-local, rad/s) between two world orientations dt apart */
function angVel(qa, qb, dt, out) {
  _qr.copy(qa).invert().multiply(qb); if (_qr.w < 0) _qr.set(-_qr.x, -_qr.y, -_qr.z, -_qr.w);
  const s = Math.sqrt(Math.max(0, 1 - _qr.w * _qr.w)), ang = 2 * Math.acos(Math.min(1, _qr.w));
  return s < 1e-7 ? out.set(0, 0, 0) : out.set(_qr.x / s, _qr.y / s, _qr.z / s).multiplyScalar(ang / dt);
}
/**
 * simulate one spring over anchor samples A[k] = { p: Vector3 (world pivot position), q: Quaternion (anchor world rotation) }
 * on the 60 Hz grid (oldest first), then extrapolate by `rem` seconds. Returns the rotation vector (anchor-local, rad).
 */
export function simSpring(spec, A, rem = 0) {
  const w = 2 * Math.PI * spec.freq, z = spec.zeta, th = new THREE.Vector3(), v = new THREE.Vector3(); const dir = _d.set(...spec.dir).normalize();
  const sub = 2, h = GDT / sub; const af = new THREE.Vector3(), alf = new THREE.Vector3(); const kf = spec.smooth ?? 0.4;   // input low-pass (~30 ms): footfall jolts in the IK pelvis drop would flick light parts
  for (let k = 2; k < A.length; k++) {
    // pivot acceleration (backward difference, world -> anchor local), anchor angular acceleration (local)
    _a.copy(A[k].p).addScaledVector(A[k - 1].p, -2).add(A[k - 2].p).multiplyScalar(1 / (GDT * GDT));
    _qi.copy(A[k].q).invert(); _a.applyQuaternion(_qi);
    angVel(A[k - 2].q, A[k - 1].q, GDT, _w0); angVel(A[k - 1].q, A[k].q, GDT, _w1); const al = _w1.sub(_w0).multiplyScalar(1 / GDT);
    af.lerp(_a, kf); alf.lerp(al, spec.smoothAng ?? kf);
    _t.crossVectors(dir, _a.copy(af).negate()).multiplyScalar(spec.gain).addScaledVector(alf, -(spec.inertia ?? 0));
    for (let s = 0; s < sub; s++) {
      v.x += (-w * w * th.x - 2 * z * w * v.x + _t.x) * h; v.y += (-w * w * th.y - 2 * z * w * v.y + _t.y) * h; v.z += (-w * w * th.z - 2 * z * w * v.z + _t.z) * h;
      th.addScaledVector(v, h); limit(spec, th, v);
    }
  }
  if (rem > 0) { th.addScaledVector(v, rem); limit(spec, th, v); }
  return th;
}
function limit(spec, th, v) {
  if (spec.lim) for (const ax of ['x', 'y', 'z']) { const L = spec.lim[ax]; if (!L) continue; if (th[ax] < L[0]) { th[ax] = L[0]; if (v[ax] < 0) v[ax] *= -0.2; } if (th[ax] > L[1]) { th[ax] = L[1]; if (v[ax] > 0) v[ax] *= -0.2; } }
  const m = th.length(); if (spec.max && m > spec.max) th.multiplyScalar(spec.max / m);
}
export const rotvecQuat = (th, out = new THREE.Quaternion()) => { const a = th.length(); return a < 1e-9 ? out.identity() : out.setFromAxisAngle(_t.copy(th).multiplyScalar(1 / a), a); };

/** default springs for a built figure (only the parts that exist as separate objects); u = model units per design unit */
export function defaultSprings(F, hero) {
  const S = [], it = F.items || {}, J = F.J, u = F.model?.u ?? 1;
  const holderAbout = (holder, pivotLocal) => (fig, q, w) => {   // rotate the holder (posed by voxfig this frame) about a body-space pivot
    if (w <= 0) return; const qq = _qr.identity().slerp(q, w); const P = new THREE.Vector3(...pivotLocal);
    holder.position.sub(P).applyQuaternion(qq).add(P); holder.quaternion.premultiply(qq); holder.updateMatrixWorld(true); };
  const onBun = !!(it.bunPencils && J.bun && it.bunPencils.parent === J.bun);   // models_r6: the pencils ride J.bun, which springs itself
  if (it.bunPencils) S.push({ name: 'bunPencils', anchor: it.bunPencils.parent || 'head', pivot: it.bunPencils.position.toArray(), dir: [0, 1, 0], freq: onBun ? 7 : 5.5, zeta: 0.22, gain: onBun ? 0.05 : 0.12, inertia: onBun ? 0.15 : 0.35, max: onBun ? 0.04 : 0.09,
    apply: (fig, q, w) => { it.bunPencils.quaternion.identity().slerp(q, w); } });
  if (it.guitar && J.body) {
    const g = it.guitar; const slung = !!g.userData.slung; const base = (slung ? g.userData.slung.pos : g.userData.base) || g.position;
    // pivot: where the strap carries the weight, above the guitar (front: chest; back: between the shoulder blades)
    const piv = [base.x + (slung ? 1.5 : -1.5) * u, base.y + 13 * u, base.z];
    S.push({ name: 'guitar', anchor: g.parent || 'body', pivot: piv, dir: [0, -1, 0], freq: 2.3, zeta: 0.3, gain: 0.07, inertia: 0.45, max: 0.3,
      lim: slung ? { z: [-0.3, 0.03], x: [-0.2, 0.2], y: [-0.12, 0.12] } : { z: [-0.03, 0.3], x: [-0.2, 0.2], y: [-0.12, 0.12] },   // never into the belly / the back
      playing: true, apply: holderAbout(g, piv) });
  }
  // separable parts from models_r6 (hair, straps, cap) when they exist: identity-rest joints, rotated directly
  const part = (name, _a, dir, o) => { const j = J[name]; if (!j || !j.parent) return; S.push({ name, anchor: j.parent, pivot: j.position.toArray(), dir, joint: j, ...o,
    apply: (fig, q, w) => { j.quaternion.identity().slerp(q, w); } }); };
  part('bun', 'head', [0, 1, 0], { freq: 4.5, zeta: 0.3, gain: 0.08, inertia: 0.3, max: 0.06 });
  part('hairBack', 'head', [0, -1, 0], { freq: 2.2, zeta: 0.28, gain: 0.09, inertia: 0.6, max: 0.35, lim: { z: [-0.35, 0.08] } });
  part('hairBack2', 'hairBack', [0, -1, 0], { freq: 2.8, zeta: 0.25, gain: 0.09, inertia: 0.5, max: 0.3 });
  for (const sd of ['R', 'L']) { part('strap' + sd, 'legs', [0, -1, 0], { freq: 3.2, zeta: 0.3, gain: 0.08, inertia: 0.45, max: 0.3 }); part('strapThigh' + sd, 'hip' + sd, [0, -1, 0], { freq: 3.6, zeta: 0.3, gain: 0.08, inertia: 0.45, max: 0.28 }); part('wisp' + sd, 'head', [0, -1, 0], { freq: 3.5, zeta: 0.25, gain: 0.08, inertia: 0.5, max: 0.25 }); }
  part('capBrim', 'head', [1, 0, 0], { freq: 6, zeta: 0.3, gain: 0.22, inertia: 1.0, max: 0.09, smooth: 0.12, smoothAng: 0.6 });   // a few degrees on head turns / landings
  if (!J.capBrim) part('cap', 'head', [0, 1, 0], { freq: 6, zeta: 0.35, gain: 0.03, inertia: 0.2, max: 0.035 });
  return S;
}
