// Choreography of the motion dev scene (shared by the scene and the node drift check tools/motion/drift_check.mjs).
// Three heroes in lanes: idle -> walk -> speed up (walk/jog blend) along an S-curve -> brake to a stop -> turn ->
// jump onto a step -> land, recover, idle. OLD = today's approach for comparison (polyline lerp at constant speed,
// facing snapped per segment, pose('run') cycling on time, sin-arc jump with the 2-frame 'jump' pose).
import { MotionTrack } from '../../core/motion/index.js';

export const HEROES = ['jade', 'charlie', 'ricky'];
const LANE = { jade: 0, charlie: -46, ricky: 46 };
const DELAY = { jade: 0, charlie: 0.3, ricky: 0.55 };
/** the step everyone jumps onto (world units): x0..x1, z0..z1, height */
export const STEP = { x0: 150, x1: 240, z0: -75, z1: 75, h: 16 };
export const ground = (x, z) => (x >= STEP.x0 && x <= STEP.x1 && z >= STEP.z0 && z <= STEP.z1 ? STEP.h : 0);
// base path (lane 0), offset per lane along the local normal
const BASE = [[-235, -20], [-170, -30], [-95, 10], [-20, 34], [55, 8], [105, 0]];
function lane(off) {
  return BASE.map((p, i) => { const a = BASE[Math.max(0, i - 1)], b = BASE[Math.min(BASE.length - 1, i + 1)]; const tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz);
    return [p[0] - (tz / l) * off, p[1] + (tx / l) * off]; });   // normal = (-tz, tx)
}

/** NEW: one MotionTrack per hero. t0 = scene start (song time). */
export function buildTracks(clips, unit, t0) {
  const tracks = {};
  for (const h of HEROES) {
    const P = lane(LANE[h]); const start = P[0];
    const tr = new MotionTrack(clips, { t0, pos: start, heading: Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0]), unit, ground })
      .idle(0.45 + DELAY[h])
      .move(P.slice(1), { speed: [[0, 'walk'], [1.25, 'jog']], accel: 260, decel: 240 })
      .idle(0.3, { face: 0 })
      .jump({ to: [P[P.length - 1][0] + 75, P[P.length - 1][1]], crouch: 0.3, apex: 26 })
      .idle(3)
      .build();
    tracks[h] = tr;
  }
  return tracks;
}
/** Ricky strums (keyed voxfig 'chord' pose) on his arms + head while his legs walk: an upper-body layer */
export function layersFor(h, tr) {
  if (h !== 'ricky') return [];
  const mv = tr.segs[1]; return [{ anim: 'chord', t0: mv.t0 + 0.2, t1: mv.t0 + 1.6, mask: 'armsHead', rate: 2 }];
}

/** OLD: the current approach, on the same segment times as the NEW track */
export function oldState(h, tr, t) {
  const P = lane(LANE[h]); const [, mv, , jp] = tr.segs;
  const lens = []; let L = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); lens.push(d); L += d; }
  const at = (s) => { for (let i = 0; i < lens.length; i++) { if (s <= lens[i] || i === lens.length - 1) { const a = Math.min(1, s / lens[i]); return { x: P[i][0] + (P[i + 1][0] - P[i][0]) * a, z: P[i][1] + (P[i + 1][1] - P[i][1]) * a, h: Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]) }; } s -= lens[i]; } };
  const end = P[P.length - 1], to = [end[0] + 75, end[1]];
  if (t < mv.t0) return { ...at(0), y: 0, anim: 'idle', t: t - tr.t0 };
  if (t < mv.t1) { const u = (t - mv.t0) / (mv.t1 - mv.t0); return { ...at(u * L), y: 0, anim: 'run', t }; }
  if (t < jp.t0 + 0.3) return { x: end[0], z: end[1], h: 0, y: 0, anim: 'idle', t: t - mv.t1 };
  const tl = jp.t1 - 1.15; // landing time of the NEW jump (recover 1.15 s)
  if (t < tl) { const u = (t - jp.t0 - 0.3) / (tl - jp.t0 - 0.3); return { x: end[0] + (to[0] - end[0]) * u, z: end[1], h: 0, y: STEP.h * u + 30 * Math.sin(Math.PI * u), anim: 'jump', frame: u < 0.5 ? 0 : 1 }; }
  return { x: to[0], z: to[1], h: 0, y: STEP.h, anim: 'idle', t: t - tl };
}
