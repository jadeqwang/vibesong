// Motion clips: retargeted mocap (assets/mocap/ual/ual_rig.json, built offline by tools/motion/mocap_extract.mjs) as
// per-joint quaternion tracks for the voxfig rig, plus pose maths (blend, layer, apply). Pure data + maths, no clock.
import * as THREE from 'three';

/** joint order of every Pose (matches the JSON); legs = pelvis group, body = torso (pivot at the hips) */
export const JOINTS = ['legs', 'body', 'head', 'shoulderR', 'elbowR', 'shoulderL', 'elbowL', 'hipR', 'kneeR', 'hipL', 'kneeL'];
export const NJ = JOINTS.length;
export const JI = Object.fromEntries(JOINTS.map((j, i) => [j, i]));
const ROW = NJ * 4 + 3 + 2 + 2;
/** rig-split extras per pose: body2 (lower torso), chest (on body2), head2 (on chest) quats, wrist flex R, L */
export const EXN = 14;

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
  constructor() { this.q = new Float32Array(NJ * 4); this.root = new Float32Array(3); this.ankle = new Float32Array(2); this.ex = new Float32Array(EXN); this.identity(); }
  identity() { this.q.fill(0); for (let j = 0; j < NJ; j++) this.q[j * 4 + 3] = 1; this.root.fill(0); this.ankle.fill(0); this.ex.fill(0); this.ex[3] = this.ex[7] = this.ex[11] = 1; return this; }
  copy(p) { this.q.set(p.q); this.root.set(p.root); this.ankle.set(p.ankle); this.ex.set(p.ex); return this; }
  quat(j, out = new THREE.Quaternion()) { const k = (typeof j === 'string' ? JI[j] : j) * 4; return out.set(this.q[k], this.q[k + 1], this.q[k + 2], this.q[k + 3]); }
  setQuat(j, q) { const k = (typeof j === 'string' ? JI[j] : j) * 4; this.q[k] = q.x; this.q[k + 1] = q.y; this.q[k + 2] = q.z; this.q[k + 3] = q.w; return this; }
}

/** out = weighted blend of poses (normalised nlerp per joint, hemisphere-aligned to the first pose) */
export function blendPoses(out, poses, weights) {
  let W = 0; for (const w of weights) W += w; if (W <= 1e-9) return out.copy(poses[0]);
  out.q.fill(0); out.root.fill(0); out.ankle.fill(0); out.ex.fill(0);
  const ref = poses[0].q;
  for (let i = 0; i < poses.length; i++) {
    const w = weights[i] / W; if (w <= 0) continue; const p = poses[i];
    for (let j = 0; j < NJ; j++) { const k = j * 4; const d = ref[k] * p.q[k] + ref[k + 1] * p.q[k + 1] + ref[k + 2] * p.q[k + 2] + ref[k + 3] * p.q[k + 3]; const s = d < 0 ? -w : w;
      out.q[k] += s * p.q[k]; out.q[k + 1] += s * p.q[k + 1]; out.q[k + 2] += s * p.q[k + 2]; out.q[k + 3] += s * p.q[k + 3]; }
    for (let c = 0; c < 3; c++) out.root[c] += w * p.root[c];
    out.ankle[0] += w * p.ankle[0]; out.ankle[1] += w * p.ankle[1];
    const e = p.ex, r = poses[0].ex; for (let k = 0; k < 12; k += 4) { const d = r[k] * e[k] + r[k + 1] * e[k + 1] + r[k + 2] * e[k + 2] + r[k + 3] * e[k + 3]; const s = d < 0 ? -w : w; for (let c = 0; c < 4; c++) out.ex[k + c] += s * e[k + c]; }
    out.ex[12] += w * e[12]; out.ex[13] += w * e[13];
  }
  for (let k = 0; k < 12; k += 4) { const n = Math.hypot(out.ex[k], out.ex[k + 1], out.ex[k + 2], out.ex[k + 3]); if (n < 1e-9) { out.ex[k] = out.ex[k + 1] = out.ex[k + 2] = 0; out.ex[k + 3] = 1; } else for (let c = 0; c < 4; c++) out.ex[k + c] /= n; }
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
    let exData = null; if (c.ex && c.ex.length === c.frames.length) { exData = new Float32Array(c.ex.length * EXN); c.ex.forEach((r, i) => exData.set(r, i * EXN)); }
    clips[name] = { ...c, name, frames: undefined, ex: undefined, data, exData };
  }
  _lib = { url, meta: json.meta, clips, rig: json.meta.rig };
  return _lib;
}

const _p0 = new Pose(), _p1 = new Pose();
function readFrame(c, i, out, unit) {
  const o = i * ROW, d = c.data; out.q.set(d.subarray(o, o + NJ * 4));
  out.root[0] = d[o + NJ * 4] * unit; out.root[1] = d[o + NJ * 4 + 1] * unit; out.root[2] = d[o + NJ * 4 + 2] * unit;
  out.ankle[0] = d[o + NJ * 4 + 3]; out.ankle[1] = d[o + NJ * 4 + 4];
  if (c.exData) out.ex.set(c.exData.subarray(i * EXN, i * EXN + EXN)); else { out.ex.fill(0); out.ex[3] = out.ex[7] = out.ex[11] = 1; }
  return out;
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

// ------------------------------------------------------------------------------------------------ gait scaling (r2)
const _qn = new THREE.Quaternion(), _qr = new THREE.Quaternion();
/**
 * Per-clip statistics, computed once: the neutral (cycle-mean) pose and the contact knots in clip phase
 * { neutral: Pose (root in design units), R: [strike, off], L: [strike, off] } (L strike normalised into (0.25, 0.75]).
 */
export function clipStats(c) {
  if (c._stats) return c._stats;
  const poses = [], ws = [];
  for (let i = 0; i < c.n; i++) { poses.push(readFrame(c, i, new Pose(), 1)); ws.push(1); }
  const neutral = blendPoses(new Pose(), poses, ws);
  const best = (sd) => { const iv = c.contacts[sd]; if (!iv || !iv.length) return null; return iv.reduce((m, x) => (x[1] - x[0] > m[1] - m[0] ? x : m), iv[0]).slice(); };
  const R = best('R'), L = best('L');
  if (L && L[0] < 0.25) { L[0] += 1; L[1] += 1; } if (L && L[0] > 0.75) { L[0] -= 1; L[1] -= 1; }
  c._stats = { neutral, R, L, duty: R && L ? ((R[1] - R[0]) + (L[1] - L[0])) / 2 : 1 };
  return c._stats;
}
/**
 * Phase warp track -> clip for a loop with contacts: the track's gait has the right strike at 0, the left at 0.5 and a stance
 * of `duty` (cycle units) per foot; the clip's own (possibly asymmetric, very short or long) stances are mapped onto that.
 * Returns the clip phase for track phase ph. Falls back to identity if the knots would not be monotone.
 */
export function warpPhase(c, ph, duty) {
  const s = clipStats(c); ph = ((ph % 1) + 1) % 1; if (!s.R || !s.L) return ph;
  const K = [[0, 0], [duty % 1, s.R[1]], [0.5, s.L[0]], [(0.5 + duty) % 1, s.L[1] - Math.floor(s.L[1])]].map(([a, b]) => [((a % 1) + 1) % 1, ((b % 1) + 1) % 1]);
  K.sort((a, b) => a[0] - b[0]); K.push([1, 1]);
  for (let i = 1; i < K.length; i++) if (K[i][1] < K[i - 1][1] || K[i][0] - K[i - 1][0] < 1e-4) return ph;
  for (let i = 0; i < K.length - 1; i++) if (ph < K[i + 1][0]) { const a = (ph - K[i][0]) / (K[i + 1][0] - K[i][0]); return K[i][1] + (K[i + 1][1] - K[i][1]) * a; }
  return ph;
}
/** which amplitude drives each joint ('leg' = the stance sweep, 'arm' = the arm / torso swing) and its exponent */
export const STRIDE_EXP = { legs: ['leg', 0.8], body: ['arm', 0.6], head: ['arm', 0.3], shoulderR: ['arm', 1], elbowR: ['arm', 0.7], shoulderL: ['arm', 1], elbowL: ['arm', 0.7], hipR: ['leg', 1], kneeR: ['leg', 0.65], hipL: ['leg', 1], kneeL: ['leg', 0.65] };
const _SE = JOINTS.map((j) => STRIDE_EXP[j] || ['leg', 1]); const _qi = new THREE.Quaternion();
/**
 * Scale a gait pose's swing about the clip's neutral pose. K = { leg, arm, rootY } (or one number for all): every joint's
 * rotation relative to neutral is scaled in angle by K[driver]^e; root x / z by leg, root y (bounce) by rootY, ankle pitch by leg^0.8.
 */
export function scaleGaitPose(p, c, K, unit = 1) {
  if (typeof K === 'number') K = { leg: K, arm: K, rootY: Math.pow(Math.max(0, K), 0.85) };
  if (Math.abs(K.leg - 1) < 1e-4 && Math.abs(K.arm - 1) < 1e-4 && Math.abs(K.rootY - 1) < 1e-4) return p;
  const N = clipStats(c).neutral;
  for (let j = 0; j < NJ; j++) {
    const kj = Math.pow(Math.max(0, K[_SE[j][0]]), _SE[j][1]); if (Math.abs(kj - 1) < 1e-4) continue; N.quat(j, _qn); p.quat(j, _qr);
    _qr.premultiply(_qi.copy(_qn).invert()); if (_qr.w < 0) { _qr.x = -_qr.x; _qr.y = -_qr.y; _qr.z = -_qr.z; _qr.w = -_qr.w; }
    const ang = 2 * Math.acos(Math.min(1, _qr.w)), s = Math.sqrt(Math.max(0, 1 - _qr.w * _qr.w));
    if (s > 1e-6) { const a2 = ang * kj / 2, sa = Math.sin(a2) / s; _qr.set(_qr.x * sa, _qr.y * sa, _qr.z * sa, Math.cos(a2)); }
    p.setQuat(j, _qn.multiply(_qr));
  }
  for (let c2 = 0; c2 < 3; c2++) { const m = N.root[c2] * unit; p.root[c2] = m + (p.root[c2] - m) * (c2 === 1 ? K.rootY : K.leg); }
  const ka = Math.pow(Math.max(0, K.leg), 0.8); for (let a = 0; a < 2; a++) p.ankle[a] = N.ankle[a] + (p.ankle[a] - N.ankle[a]) * ka;
  return p;
}
/** a synthetic one-shot clip from key poses: keys [[u, { joint: [x, y, z] degrees (voxfig euler) }, rootDesign?], ...] */
export function keyedClip(name, keys, { dur = 1, n = 41, contacts = { R: [], L: [] } } = {}) {
  const e = new THREE.Euler(), q = new THREE.Quaternion(); const data = new Float32Array(n * ROW);
  const at = (u, j) => { let a = keys[0], b = keys[keys.length - 1]; for (let i = 0; i < keys.length - 1; i++) if (u >= keys[i][0] && u <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; }
    const f = b[0] > a[0] ? (u - a[0]) / (b[0] - a[0]) : 0, s = f * f * (3 - 2 * f); const va = a[1][j] || [0, 0, 0], vb = b[1][j] || [0, 0, 0]; return va.map((x, i) => x + (vb[i] - x) * s); };
  for (let i = 0; i < n; i++) { const u = i / (n - 1);
    for (let j = 0; j < NJ; j++) { const d = at(u, JOINTS[j]).map((x) => x * Math.PI / 180); e.set(d[0], d[1], d[2]); q.setFromEuler(e); data.set([q.x, q.y, q.z, q.w], i * ROW + j * 4); } }
  return { name, n, dur, loop: false, speed: 0, stride: 0, contacts, data, synthetic: true };
}
