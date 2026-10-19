// Motion clips: retargeted mocap (assets/mocap/ual/ual_rig.json, built offline by tools/motion/mocap_extract.mjs) as
// per-joint quaternion tracks for the voxfig rig, plus pose maths (blend, layer, apply). Pure data + maths, no clock.
import * as THREE from 'three';

/** joint order of every Pose (matches the JSON); legs = pelvis group, body = torso (pivot at the hips) */
export const JOINTS = ['legs', 'body', 'head', 'shoulderR', 'elbowR', 'shoulderL', 'elbowL', 'hipR', 'kneeR', 'hipL', 'kneeL'];
export const NJ = JOINTS.length;
export const JI = Object.fromEntries(JOINTS.map((j, i) => [j, i]));
const ROW = NJ * 4 + 3 + 2 + 2;

/** joint masks for layers (weight per joint, 0..1) */
export const MASKS = {
  all: Object.fromEntries(JOINTS.map((j) => [j, 1])),
  upper: { body: 0.5, head: 1, shoulderR: 1, elbowR: 1, shoulderL: 1, elbowL: 1 },
  arms: { shoulderR: 1, elbowR: 1, shoulderL: 1, elbowL: 1 },
  armsHead: { head: 1, shoulderR: 1, elbowR: 1, shoulderL: 1, elbowL: 1 },
  lower: { legs: 1, hipR: 1, kneeR: 1, hipL: 1, kneeL: 1 },
};
const maskArr = (m) => { if (!m) return null; if (m instanceof Float32Array) return m; const o = typeof m === 'string' ? MASKS[m] : m; const a = new Float32Array(NJ); for (const [k, v] of Object.entries(o)) if (k in JI) a[JI[k]] = v; return a; };

/** a pose: joint quaternions (parent-local), root offset (world units, model space: x fwd, y up, z right), ankle pitch */
export class Pose {
  constructor() { this.q = new Float32Array(NJ * 4); this.root = new Float32Array(3); this.ankle = new Float32Array(2); this.identity(); }
  identity() { this.q.fill(0); for (let j = 0; j < NJ; j++) this.q[j * 4 + 3] = 1; this.root.fill(0); this.ankle.fill(0); return this; }
  copy(p) { this.q.set(p.q); this.root.set(p.root); this.ankle.set(p.ankle); return this; }
  quat(j, out = new THREE.Quaternion()) { const k = (typeof j === 'string' ? JI[j] : j) * 4; return out.set(this.q[k], this.q[k + 1], this.q[k + 2], this.q[k + 3]); }
  setQuat(j, q) { const k = (typeof j === 'string' ? JI[j] : j) * 4; this.q[k] = q.x; this.q[k + 1] = q.y; this.q[k + 2] = q.z; this.q[k + 3] = q.w; return this; }
}

/** out = weighted blend of poses (normalised nlerp per joint, hemisphere-aligned to the first pose) */
export function blendPoses(out, poses, weights) {
  let W = 0; for (const w of weights) W += w; if (W <= 1e-9) return out.copy(poses[0]);
  out.q.fill(0); out.root.fill(0); out.ankle.fill(0);
  const ref = poses[0].q;
  for (let i = 0; i < poses.length; i++) {
    const w = weights[i] / W; if (w <= 0) continue; const p = poses[i];
    for (let j = 0; j < NJ; j++) { const k = j * 4; const d = ref[k] * p.q[k] + ref[k + 1] * p.q[k + 1] + ref[k + 2] * p.q[k + 2] + ref[k + 3] * p.q[k + 3]; const s = d < 0 ? -w : w;
      out.q[k] += s * p.q[k]; out.q[k + 1] += s * p.q[k + 1]; out.q[k + 2] += s * p.q[k + 2]; out.q[k + 3] += s * p.q[k + 3]; }
    for (let c = 0; c < 3; c++) out.root[c] += w * p.root[c];
    out.ankle[0] += w * p.ankle[0]; out.ankle[1] += w * p.ankle[1];
  }
  for (let j = 0; j < NJ; j++) { const k = j * 4; const n = Math.hypot(out.q[k], out.q[k + 1], out.q[k + 2], out.q[k + 3]) || 1; out.q[k] /= n; out.q[k + 1] /= n; out.q[k + 2] /= n; out.q[k + 3] /= n; }
  return out;
}

const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
/** out = a layered toward b by weight w (per-joint mask; root / ankle use mask.root / w) */
export function layerPose(out, a, b, w, mask = null, rootW = null) {
  const m = maskArr(mask); if (out !== a) out.copy(a); if (w <= 0) return out;
  for (let j = 0; j < NJ; j++) { const wj = w * (m ? m[j] : 1); if (wj <= 0) continue; a.quat(j, _qa); b.quat(j, _qb); _qa.slerp(_qb, Math.min(1, wj)); out.setQuat(j, _qa); }
  const rw = w * (rootW ?? (m ? 0 : 1)); for (let c = 0; c < 3; c++) out.root[c] = a.root[c] + (b.root[c] - a.root[c]) * rw;
  return out;
}

/** read a figure's current joint rotations (after voxfig pose()) into a Pose (root offset = F.root.position) */
export function captureFigure(F, out = new Pose()) {
  for (let j = 0; j < NJ; j++) out.setQuat(j, F.J[JOINTS[j]].quaternion);
  out.root[0] = F.root.position.x; out.root[1] = F.root.position.y; out.root[2] = F.root.position.z; out.ankle.fill(0); return out;
}
/** write a Pose to a figure (joint quaternions + root offset) */
export function applyToFigure(F, p) {
  for (let j = 0; j < NJ; j++) { const k = j * 4; F.J[JOINTS[j]].quaternion.set(p.q[k], p.q[k + 1], p.q[k + 2], p.q[k + 3]); }
  F.root.position.set(p.root[0], p.root[1], p.root[2]);
}

// ------------------------------------------------------------------------------------------------ clip library
let _lib = null;
/** load the retargeted clip library once (fetch in the browser, fs in node) */
export async function loadMotionClips(url = '/assets/mocap/ual/ual_rig.json') {
  if (_lib && _lib.url === url) return _lib;
  let json;
  if (typeof fetch === 'function' && typeof window !== 'undefined') json = await (await fetch(url)).json();
  else { const fs = await import('node:fs'); json = JSON.parse(fs.readFileSync(url, 'utf8')); }
  const clips = {};
  for (const [name, c] of Object.entries(json.clips)) {
    const data = new Float32Array(c.frames.length * ROW); c.frames.forEach((r, i) => data.set(r, i * ROW));
    clips[name] = { ...c, name, frames: undefined, data };
  }
  _lib = { url, meta: json.meta, clips, rig: json.meta.rig };
  return _lib;
}

const _p0 = new Pose(), _p1 = new Pose();
function readFrame(c, i, out, unit) {
  const o = i * ROW, d = c.data; out.q.set(d.subarray(o, o + NJ * 4));
  out.root[0] = d[o + NJ * 4] * unit; out.root[1] = d[o + NJ * 4 + 1] * unit; out.root[2] = d[o + NJ * 4 + 2] * unit;
  out.ankle[0] = d[o + NJ * 4 + 3]; out.ankle[1] = d[o + NJ * 4 + 4]; return out;
}
/**
 * Sample a clip. u = cycle phase (loops: wraps, phase 0 = right-foot strike for locomotion) or progress 0..1 (one-shots: clamps).
 * unit = world units per design unit (figure model.u) for the root offset.
 */
export function sampleClip(c, u, out = new Pose(), unit = 1) {
  const n = c.n; let f;
  if (c.loop) { f = (((u % 1) + 1) % 1) * n; } else f = Math.min(1, Math.max(0, u)) * (n - 1);
  const i0 = Math.floor(f), a = f - i0, i1 = c.loop ? (i0 + 1) % n : Math.min(n - 1, i0 + 1);
  readFrame(c, i0 % n, _p0, unit); if (a < 1e-6) return out.copy(_p0);
  readFrame(c, i1, _p1, unit); return blendPoses(out, [_p0, _p1], [1 - a, a]);
}
/** contact flag of a clip at u (from its contact intervals; R / L) */
export function clipContact(c, u, side) {
  const iv = c.contacts[side]; const p = c.loop ? (((u % 1) + 1) % 1) : u;
  for (const [a, b] of iv) { if (p >= a && p < b) return true; if (c.loop && (p - 1 >= a && p - 1 < b || p + 1 >= a && p + 1 < b)) return true; }
  return false;
}
