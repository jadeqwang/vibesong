// Life: deterministic "never frozen" signals for a hero, every one a pure function of (seed, t, track): blinks, eye darts
// (saccades), breathing (rate and depth follow recent exertion), idle weight shifts, idle glances, and the head look-at
// follower (critically damped toward a target, re-simulated over a fixed look-back so frames render in any order).
const DT = 1 / 60;
/** integer hash -> [0, 1) (mulberry32 step; identical in node and the browser) */
export function hash01(a, b = 0) {
  let x = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x7f4a7c15, 0x85ebca6b)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
export const seedOf = (s) => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

/** event schedule: times of a jittered periodic process (mean `every` s, +-jit fraction), indexed from a fixed origin */
function eventNear(seed, t, every, jit, origin = 0) {
  // events at origin + every * (k + jitter_k); returns the last event time <= t and the next one
  const k0 = Math.floor((t - origin) / every); let last = -Infinity, next = Infinity, li = 0;
  for (let k = k0 - 2; k <= k0 + 2; k++) { const e = origin + every * (k + (hash01(seed, k) - 0.5) * jit); if (e <= t && e > last) { last = e; li = k; } if (e > t && e < next) next = e; }
  return { last, next, k: li };
}
/** eyelid closure 0..1 at t: blinks every ~3.4 s (2-5 s), 50 ms down / 90 ms up; every ~6th is a double blink */
export function blink(seed, t, { every = 3.4, extra = [] } = {}) {
  const shape = (dt) => (dt < 0 || dt > 0.16 ? 0 : dt < 0.055 ? smooth(dt / 0.055) : 1 - smooth((dt - 0.065) / 0.09));
  const e = eventNear(seed, t, every, 0.9); let v = shape(t - e.last);
  if (hash01(seed + 7, e.k) < 0.17) v = Math.max(v, shape(t - e.last - 0.22));
  for (const x of extra) v = Math.max(v, shape(t - x));
  return v;
}
/** eye saccades: small fixations held 0.4-1.8 s, jumping in ~40 ms. Returns [yaw, pitch] (rad) */
export function saccade(seed, t, { yaw = 0.07, pitch = 0.035 } = {}) {
  const e = eventNear(seed + 101, t, 1.1, 1.2); const j = (k) => [(hash01(seed + 3, k) - 0.5) * 2 * yaw, (hash01(seed + 5, k) - 0.5) * 2 * pitch];
  const a = j(e.k - 1), b = j(e.k), s = smooth((t - e.last) / 0.04); return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
}
/** breathing: { phase (rad), depth 0..1 }; exertion 0 (rested) .. 1 (after a sprint) raises the rate 0.28 -> 0.75 Hz */
export function breath(seed, t, exertion = 0) {
  const f = 0.28 + 0.47 * exertion, ph = 2 * Math.PI * (f * t) + hash01(seed, 9) * 6.283;   // (rate changes slowly: the phase stays smooth enough)
  return { s: Math.sin(ph), depth: 0.35 + 0.65 * exertion };
}
/** idle weight shift: lateral hip offset (fraction of the hip width) drifting with ~6-9 s periods, plus a slower lean */
export function weightShift(seed, t) {
  const a = hash01(seed, 21) * 6.283, b = hash01(seed, 22) * 6.283;
  return 0.65 * Math.sin(2 * Math.PI * t / (6.5 + 2.5 * hash01(seed, 23)) + a) + 0.35 * Math.sin(2 * Math.PI * t / 13.7 + b);
}
/** idle glances: head yaw / pitch offsets (rad), a slow drift plus an occasional look-away held ~1-2 s */
export function glance(seed, t) {
  const drift = 0.06 * Math.sin(t * 0.7 + hash01(seed, 31) * 6) + 0.035 * Math.sin(t * 1.9 + hash01(seed, 32) * 6);
  const e = eventNear(seed + 211, t, 5.5, 0.8); const hold = 0.9 + hash01(seed + 2, e.k) * 1.2, dt = t - e.last;
  const on = smooth(dt / 0.25) * (1 - smooth((dt - hold) / 0.35)); const side = hash01(seed + 4, e.k) < 0.5 ? -1 : 1;
  return [drift + on * side * (0.25 + 0.25 * hash01(seed + 6, e.k)), 0.03 * Math.sin(t * 0.53 + hash01(seed, 33) * 6) + on * (hash01(seed + 8, e.k) - 0.6) * 0.18];
}
/** exertion 0..1 from the track: mean speed over the last 6 s (weighted to the recent past) vs a run */
export function exertion(track, t) {
  let s = 0, w = 0; const run = 4.6 * track.M;
  for (let k = 0; k < 24; k++) { const tt = t - k * 0.25; if (tt < track.t0) break; const wk = Math.exp(-k * 0.25 / 2.5); s += wk * Math.min(1.3, track.state(tt).v / run); w += wk; }
  return w > 0 ? Math.min(1, s / w) : 0;
}
/**
 * critically damped follow of a desired angle pair over a fixed look-back (pure in t): desired(tk) -> [yaw, pitch]; omega in
 * rad/s. Simulated on the absolute 60 Hz grid from grid(t) - n to t, starting at the desired value there.
 */
export function follow(desired, t, { omega = 11, look = 0.7 } = {}) {
  const k1 = Math.floor(t / DT), n = Math.round(look / DT); let k = k1 - n; let y = desired(k * DT).slice(), v = [0, 0];
  const step = (tg, dt) => { for (let i = 0; i < 2; i++) { const a = omega * omega * (tg[i] - y[i]) - 2 * omega * v[i]; v[i] += a * dt; y[i] += v[i] * dt; } };
  for (k = k1 - n + 1; k <= k1; k++) step(desired(k * DT), DT);
  const rem = t - k1 * DT; if (rem > 1e-6) step(desired(t), rem);
  return y;
}
