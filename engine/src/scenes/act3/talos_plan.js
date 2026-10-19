// talos_r4: node-safe helpers for the rebuilt Talos rooms (no DOM): the MotionTrack planner, the deterministic follow cam,
// the freeze clock, and the room layouts + hero tracks (so tools can check the timing without a browser).
import * as THREE from 'three';
import { MotionTrack } from '../../core/motion/track.js';
import { MotionGroup } from '../../core/motion/group.js';

/** a MotionTrack planner with absolute-time helpers. calls are recorded and replayed, so until(T) can measure the emergent time.
 *  plan(R, fig, { t0, pos, heading, v0, ground }).move(...).until(T, { face }).clip(...).build() */
export function plan(R, fig, { t0, pos, heading = 0, v0 = 0, ground = () => 0, name = '' }) {
  const calls = [];
  const mk = () => { const tr = new MotionTrack(R.clips, { t0, pos, heading, unit: fig.unit, ground, name }); tr.cur.v = v0; for (const [k, a] of calls) tr[k](...a); return tr; };
  const api = {
    idle(d, o) { calls.push(['idle', [d, o]]); return api; },
    move(p, o) { calls.push(['move', [p, o]]); return api; },
    jump(o) { calls.push(['jump', [o]]); return api; },
    clip(n, o) { calls.push(['clip', [n, o]]); return api; },
    /** stand (optionally turning to face) until song time T */
    until(T, o = {}) { calls.push(['idle', [0, { ...o, until: T }]]); return api; },
    /** a hop in place (a step toward a partner) whose apex lands on song time T */
    hopAt(T, { air = 0.4, toward = null, d = 3, crouch = null, recover = null } = {}) {
      const tr = mk().build(); const st = tr.state(tr.t1); let a = st.h; if (toward) a = Math.atan2(toward[1] - st.z, toward[0] - st.x);
      calls.push(['jump', [{ to: [st.x + Math.cos(a) * d, st.z + Math.sin(a) * d], style: 'hop', air, crouch, recover, landAt: T + air / 2, settle: false }]]); return api; },
    step(to, o) { calls.push(['step', [to, o]]); return api; },
    now() { return mk().build().t1; },
    /** the unbuilt track (for a MotionGroup) */
    track() { return mk(); },
    build() { return mk().build(); },
  };
  return api;
}
export const headingTo = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);

/** deterministic follow cam: fn(tt) -> { pos, tgt, fov } is the desired rig; a damped spring (zeta < 1: slight overshoot) chases
 *  it, re-simulated over a fixed look-back from max(t - look, t0) (t0 = shot start: the cut lands exactly on the rig). Pure in t. */
export function springCam(fn, t, t0, { w = 6, zeta = 0.72, look = 1.2, dt = 1 / 120 } = {}) {
  const ts = Math.max(t0, t - look); const s0 = fn(ts); const p = s0.pos.clone(), q = s0.tgt.clone(); const vp = new THREE.Vector3(), vq = new THREE.Vector3();
  const n = Math.max(0, Math.round((t - ts) / dt)); const h = n > 0 ? (t - ts) / n : 0; let last = s0;
  for (let i = 1; i <= n; i++) { const d = fn(ts + i * h); last = d;
    for (const [x, v, g] of [[p, vp, d.pos], [q, vq, d.tgt]]) { const ax = w * w * (g.x - x.x) - 2 * zeta * w * v.x, ay = w * w * (g.y - x.y) - 2 * zeta * w * v.y, az = w * w * (g.z - x.z) - 2 * zeta * w * v.z;
      v.x += ax * h; v.y += ay * h; v.z += az * h; x.x += v.x * h; x.y += v.y * h; x.z += v.z * h; } }
  return { ...last, pos: p, tgt: q, fov: last.fov ?? 50 };   // extra fields of the rig (focus, r5 look fields) pass through
}
/** a continuous clock that holds through freezes [[a, b], ...] (camera paths across the song's stops) */
export const holdClock = (t, stops) => { let o = 0; for (const [a, b] of stops) { if (t >= b) o += b - a; else if (t >= a) return a - o; } return t - o; };

const clamp01 = (x) => Math.max(0, Math.min(1, x));
// =====================================================================================================================
// ROOM A (86.385-94.204), world x / z. The cameras look east (from over the sea west of the gap): the crossing (+z) reads
// left -> right, the causeway (+x) runs into the picture. Amp and receiver share x, so the wall between them (along x) is seen
// end-on in perspective: a long wall down the middle of the gap, the slabs going round its far (east) end.
// =====================================================================================================================
export const RA = {
  // M4 layout (coordinator option a): the beam path runs ACROSS the picture for cameras looking east from over the sea west of
  // the gap: amp + slabs strung along the causeway's sea edge and the gap (left), the wall in the middle, the receiver + gate on
  // mesa A to the east-south-east (right, backlit). Topology as talos_level.svg Room A: amp -> 1 -> 2 -> 3 -> receiver around the
  // wall's north end; the wall cuts the straight shot.
  AMP: [600, 18], AMP_Y: 16,                       // Ricky's fixed amp-emitter (plinth), aimed straight at the receiver
  BASE: [[620, 40], [742, 76], [780, 176]],        // slab bases in Charlie's order; slab 1 rises in the amp's line at the causeway edge
  BY: [1, 4, 7],                                   // deck height at each base (the bridge climbs to the mesa, y 10)
  CH: [29, 83, 76],                                // crystal mount heights on the slabs' sides (C1 in the amp's line, C2 / C3 above the wall)
  FOOT: [640, 22],                                 // the bridge foot on the causeway
  LAND: [796, 266], LY: 10,                        // the bridge lands on mesa A's lip
  RECV: [760, 300], RECV_H: 26,                    // receiver: straight across from the amp, the wall in between
  GATE: [826, 294],                                // force-field gate past the receiver
  WALL: { c: [720, 207], dir: [0, 1], len: 84, top: 56, thick: 20 },    // across the amp -> receiver line (runs north-south; M5: shorter + south so the low bridge beam clears its north end)
  SLASH: [86.63, 86.87, 87.13], RISE: 0.16, PULSE: 86.45,
  THROW: 88.48, TAPS: [88.878, 89.284, 89.55], CATCH: 89.88,
  HOP: [0.08, 0.16, 0.24, 0.32], LAMPS: [90.29, 90.32, 90.35],
  SWING_DT: 0.12, SWING_DUR: 0.36,
  HEY: [92.78, 93.25, 93.65],
  STOP: { jade: [664, -16], charlie: [626, -22], ricky: [580, -20] },   // a diagonal row along the causeway's north edge (Ricky nearest the west cameras)
  SPOT: { jade: [834, 330], charlie: [814, 316], ricky: [856, 318] },   // past the gate, facing west (the camera)
};
/** deck height along the bridge (projection onto the polyline foot -> bases -> landing), causeway 0, mesa 10 */
export function deckYA(x, z) {
  if (z <= 20) return 0; if (z >= RA.LAND[1] + 2) return RA.LY;
  const P = [[RA.FOOT[0], RA.FOOT[1] - 4, 0], ...RA.BASE.map((b, k) => [b[0], b[1], RA.BY[k]]), [RA.LAND[0], RA.LAND[1], RA.LY]]; let best = 1e9, y = 0;
  for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; const dx = b[0] - a[0], dz = b[1] - a[1]; const u = clamp01(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz));
    const d = Math.hypot(a[0] + dx * u - x, a[1] + dz * u - z); if (d < best) { best = d; y = a[2] + (b[2] - a[2]) * u; } }
  return y;
}
/** the three Room A tracks (song time). R = { clips }, units = { jade, charlie, ricky } (fig.unit) */
export function roomATracks(R, units, SWING0) {
  const A = RA, g = deckYA, face = (a, b) => ({ face: headingTo(a, b) });
  const bridge = [A.FOOT, ...A.BASE, A.LAND];
  // hey hey hey: 92.78 Jade's fist pump as she runs through the dissolving field, 93.25 Charlie's running high five as he
  // reaches her, 93.65 all three jump (the hop's apex on the beat)
  const H3 = { air: 0.32, crouch: 0.08, recover: 0.3 };
  const hop3 = (p) => p.until(A.HEY[2] - 0.5, face(A.SPOT[p.name], [700, 350])).hopAt(A.HEY[2], { toward: [700, 350], ...H3 }).idle(0.8);
  const S = A.STOP;
  const jade = plan(R, { unit: units.jade }, { t0: 86.385, pos: [624, 2], v0: 82, ground: g, name: 'jade' })
    .move([S.jade], { speed: 82, decel: 420 }).until(87.4, face(S.jade, A.BASE[1]))
    .until(SWING0 + 0.02, face(S.jade, A.BASE[0]))
    .move([...bridge, A.GATE, A.SPOT.jade], { speed: 'sprint', accel: 700, decel: 950, jerk: 9000 });
  const charlie = plan(R, { unit: units.charlie }, { t0: 86.385, pos: [590, -9], v0: 82, ground: g, name: 'charlie' })
    .move([S.charlie], { speed: 82, decel: 420 }).until(SWING0 + 0.4, face(S.charlie, A.BASE[0]))
    .move([...bridge, [A.GATE[0] + 4, A.GATE[1]], A.SPOT.charlie], { speed: 'sprint', accel: 700, decel: 950, jerk: 9000 });
  const ricky = plan(R, { unit: units.ricky }, { t0: 86.385, pos: [552, 8], v0: 82, ground: g, name: 'ricky' })
    .move([S.ricky], { speed: 82, decel: 420 }).until(88.5, face(S.ricky, A.AMP))
    .clip('interact', { rate: 2.4 }).until(SWING0 + 0.16, face(S.ricky, A.BASE[0]))
    .move([[622, 0], ...bridge, [A.GATE[0] - 4, A.GATE[1]], A.SPOT.ricky], { speed: 'sprint', accel: 700, decel: 950, jerk: 9000 });
  for (const [p, n] of [[jade, 'jade'], [charlie, 'charlie'], [ricky, 'ricky']]) p.name = n;
  // single file over the planks: a MotionGroup with no sideways push (speed yielding keeps the gaps); Ricky arrives on the third
  // hey with his arms up (no time to hop)
  // (single file is staged by the start times: 0.24 s apart on the same path; MotionGroup's yields slowed the whole run by ~0.5 s)
  return { jade: hop3(jade).build(), charlie: charlie.until(93.95, face(A.SPOT.charlie, [700, 350])).idle(0.6).build(), ricky: ricky.until(93.95, face(A.SPOT.ricky, [700, 350])).idle(0.6).build() };   // Charlie + Ricky arrive on the third hey, arms up
}

// =====================================================================================================================
// ROOM B (101.0-107.15): the co-op crossing (k08b). A ruined sea stack in the chasm blocks Ricky's fixed amp's straight shot at
// receiver 2; the tripod socket on the cliff edge sees both. Receiver 2 sits behind a field curtain on mesa B, open only while
// the pressure plate is held. Receiver 2 lit -> the pencil-stroke bridge (world props yiBridge) draws.
// The cameras look north along the cliff edge (mesa B and the crossing on the right, the sun turned to ahead-right).
// =====================================================================================================================
const WORDB = [101.0, 101.36, 102.26, 103.105, 103.425, 103.676, 103.78, 105.2];   // my imagination is linked to my everyday life
export const RB = {
  // M4 layout (talos_level.svg Room B, revised): a ruined sea stack in the chasm blocks the amp's straight shot at receiver 2; the
  // tripod socket on the near cliff edge is the one spot that sees both; receiver 2 sits behind a field curtain on the far cliff,
  // open only while the plate is held. Laid out for the k08b frame (camera 3/4 behind the trio, looking north along the edge).
  TOP: 10,
  AMP: [962, 420],                               // Ricky's fixed amp at his feet (aimed at receiver 2: the stack takes it)
  STACK: { c: [1046, 406], w: 22, d: 18, h: 40 },   // the ruined sea stack in the chasm
  PLATE: [936, 510],                             // pressure plate (Charlie): the left foreground of the k08b frame
  TRIPOD0: [990, 524],                           // the tripod stands here at first (folded)
  SOCKET: [990, 468],                            // the socket on the cliff edge: sees the amp and receiver 2
  STAND: [982, 487],                             // where Jade stands to plant it (her right hand stays on it)
  RECV: [1118, 392],                             // receiver 2 on mesa B
  CURTAIN: { x: 1101, z: 402, w: 40, h: 64 },    // the field curtain in front of receiver 2 (square to the socket's line)
  BRIDGE: { x0: 980, x1: 1110, z: 500, tilt: -0.1113, dy: 12.35, sz: 1.4, half: 6 },   // the 一 stroke bridge, levelled (its top ~11.5 from x 990 to 1100); walk lane |z - 500| < 6 (world props yiBridge, moved here for this room)
  WORD: WORDB,
  T: { amp: 101.36, plate: 101.955, plant: 103.105, threat: [104.42, 104.62], pull: 105.2, hatDrop: 105.52, off: 105.618, fp: [102.768, 104.396] },
  MOTH: [104.396, 104.803],
  ENTER: { jade: [962, 528], charlie: [892, 506], ricky: [912, 418] },
};
export const groundB = (x, z) => (x > RB.BRIDGE.x0 - 4 && x < RB.BRIDGE.x1 + 4 && Math.abs(z - RB.BRIDGE.z) < 12 && (x > 996 && x < 1094) ? RB.TOP + 1.5 : RB.TOP);
/** Room B tracks (song time). The plate is "held" while Charlie's track is on it (see plateHeld) or the spare hat is down. */
/** the Room B cameras' positions over time (screenCheck: nobody hides behind someone) */
export const RB_CAM = (t) => (t < 102.768 ? [970, 115, 680] : t < 104.396 ? null : [992, 75, 637]);
export function roomBTracks(R, units) {
  const B = RB, g = groundB, face = (a, b) => ({ face: headingTo(a, b) }), T = B.T;
  const P = B.PLATE, S = B.STAND, FOOTB = [B.BRIDGE.x0 + 6, B.BRIDGE.z];
  const fast = { accel: 900, decel: 900, jerk: 12000 };
  // Jade: in, picks up the tripod, carries it to the edge (first person), plants it on "linked", keeps a hand on it; then crosses first
  const jade = plan(R, { unit: units.jade }, { t0: 101.0, pos: B.ENTER.jade, heading: 0, v0: 50, ground: g, name: 'jade' })
    .move([[B.TRIPOD0[0] - 13, B.TRIPOD0[1] + 2]], { speed: 'jog', ...fast })
    .clip('pickup', { rate: 1.9 })
    .move([[984, 512], S], { speed: 'brisk', ...fast, arriveAt: 102.98 })
    .until(105.75, face(S, B.RECV))
    .move([[974, 499], [988, 500], [FOOTB[0] + 14, B.BRIDGE.z], [B.BRIDGE.x1, B.BRIDGE.z], [1146, 505]], { speed: 'run', accel: 700, decel: 600, jerk: 9000, autoTurn: false }).idle(0.6);
  // Charlie: onto the plate; the threat (a quick step off: the curtain shuts; a step back); the spare cap out of his cap onto the
  // plate; off and across last
  const charlie = plan(R, { unit: units.charlie }, { t0: 101.0, pos: B.ENTER.charlie, heading: 0, v0: 40, ground: g, name: 'charlie' })
    .move([P], { speed: 'brisk', ...fast, arriveAt: T.plate }).until(T.threat[0], face(P, [1010, 440]))
    .step([P[0] + 9, P[1] + 5], { dur: 0.2, shuffle: false }).until(T.threat[1]).step(P, { dur: 0.22, shuffle: false })
    .until(T.pull + 0.04, face(P, [1010, 440])).clip('pickup', { rate: 2.2 })
    .until(106.25, face(P, [1010, 440]))
    .move([[966, 506], [FOOTB[0] + 14, B.BRIDGE.z + 1], [B.BRIDGE.x1, B.BRIDGE.z + 1], [1124, 514]], { speed: [[0, 'brisk'], [0.5, 'run']], accel: 800, decel: 700, jerk: 9000, autoTurn: false }).idle(0.6);
  // Ricky: at his amp, plugs in + chord (the amp keeps running); plays on; crosses second
  const ricky = plan(R, { unit: units.ricky }, { t0: 101.0, pos: B.ENTER.ricky, heading: 0, v0: 20, ground: g, name: 'ricky' })
    .move([[B.AMP[0] - 20, B.AMP[1] + 3]], { speed: 'walk', ...fast }).until(105.8, face([B.AMP[0] - 20, B.AMP[1] + 3], [1000, 470]))
    .move([[944, 460], [962, 492], [FOOTB[0] + 14, B.BRIDGE.z - 1], [B.BRIDGE.x1, B.BRIDGE.z - 1], [1134, 494]], { speed: [[0, 'jog'], [0.4, 'run']], accel: 700, decel: 600, jerk: 9000, autoTurn: false }).idle(0.6);
  const out = { jade: jade.build(), charlie: charlie.build(), ricky: ricky.build() };
  out.screen = screenCheck(out, RB_CAM, 101.0, 107.15); return out;
}
/** is the plate held at t (Charlie's track on it, or the spare hat down) */
export function plateHeld(charlie, t) { if (t >= RB.T.hatDrop + 0.06) return true; const s = charlie.state(t); return Math.hypot(s.x - RB.PLATE[0], s.z - RB.PLATE[1]) < 7; }

// =====================================================================================================================
// ROOM 2 (94.204-101.0): the climb. A raised terrace on mesa A; each hero gets up it with their room-1 solo (Jade's flip vault
// over a block, Charlie's hat-trampoline bounce, Ricky's heavy hop onto a LIFT whose pressure plate raises it while he stands on
// it, sinking again once he steps off). On the terrace: the stone-letter gate b | e | cause (the e toppled flat in the gap as
// the doorstep), Ricky tests the e with one foot. Jade's lane is the paint ledger's colour path (paintlog PATH_V2, z 348).
// Cameras look north (+x reads left -> right).
// =====================================================================================================================
export const R2 = {
  TOP: 10, TER: { x0: 652, x1: 905, z0: 300, z1: 422, y: 44 },
  LANE: { jade: 348, charlie: 392, ricky: 312 },   // Charlie in front (south), Ricky's lift at the back so it rises above the others
  BLOCK: [634, 348],                               // Jade's vault block
  CAPSPOT: [608, 392],                             // Charlie's cap on the ground before the terrace wall
  LIFT: [624, 314], LIFT_UP: 56,                   // Ricky's lift pad (rises to y 56 while held), its plate on top
  VAULT: [94.42, 94.889], CH: { throw: 94.97, hatDown: 95.06, on: 95.16, boing: 95.255, land: 95.6, caught: 95.8 },
  RK: { stomp: 95.831, off: 96.613 }, LIFT_T: [95.9, 96.3],
  GATE_X: 862, GZ: 348, BC: { test: [100.2, 100.62], step: 100.66, ready: 99.3 },
};
/** ground (x, z, t): the terrace, and the lift pad whose height changes with time (motion_r2: feet ride it) */
export function groundR2(x, z, t = 0) { const T = R2.TER; if (Math.abs(x - R2.LIFT[0]) < 16 && Math.abs(z - R2.LIFT[1]) < 16) return R2.TOP + 1.6 + liftY(t); return x >= T.x0 && x <= T.x1 && z >= T.z0 && z <= T.z1 ? T.y : R2.TOP; }
/** the lift's height above the mesa top at t (pure): rises after Ricky's stomp, sinks after he steps off */
export function liftY(t) { const [a, b] = R2.LIFT_T; const up = PLAN.r5 ? liftRise5(t) : smooth01((t - a) / (b - a)); const down = smooth01((t - R2.RK.off - 0.05) / 0.5); return (R2.LIFT_UP - R2.TOP) * up * (1 - down); }
/** round-5 staging switch for the node-safe planner (set by the r5 scenes before they build tracks; tools may set it too) */
export const PLAN = { r5: false };
/** r5: the lift's rise 0..1 with the beetle in its gear housing: three jerks to 40 %, a shuddering stall, then (Jade's poke at
 *  R2_5.POKE frees the beetle) a smooth rise to the top. Pure in t. */
export function liftRise5(t) {
  const L = R2_5.LIFT5; if (t < L.t0) return 0;
  if (t < L.stall) { const u = (t - L.t0) / (L.stall - L.t0); const k = Math.min(2, Math.floor(u * 3)); const f = clamp01((u * 3 - k) / 0.55); return 0.4 * (k / 3 + f * f * (3 - 2 * f) / 3); }
  if (t < L.free) return 0.4 + 0.012 * Math.sin((t - L.stall) * 90) * (1 - 0.5 * clamp01((t - L.stall) / 0.2));
  return 0.4 + 0.6 * smooth01((t - L.free) / (L.top - L.free));
}
const smooth01 = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
export function room2Tracks(R, units) {
  const A = R2, g = groundR2, face = (a, b) => ({ face: headingTo(a, b) }); const L = A.LANE, T = A.TER;
  const eX = A.GATE_X - 52;                       // the doorstep e's near edge (Ricky's toes)
  // Jade: run in, flip vault over the block onto the terrace (lands on "I"), on along the colour path through the gap, waits past it
  const jade = plan(R, { unit: units.jade }, { t0: 94.204, pos: [606, L.jade], heading: 0, v0: 0, ground: g, name: 'jade' })
    .jump({ to: [674, L.jade], style: 'jump', air: A.VAULT[1] - A.VAULT[0], crouch: 0.02, landAt: A.VAULT[1], recover: 0.45, settle: false })
    .move([[700, L.jade], [790, L.jade + 4], [eX - 6, L.jade]], { speed: 'brisk', arriveAt: 98.6 })
    .move([[A.GATE_X + 20, L.jade], [A.GATE_X + 39, L.jade - 22], [A.GATE_X + 31, L.jade - 25]], { speed: 'brisk', arriveAt: 100.1 }).until(101.1).build();   // M6: she arrives already facing back at the gate (a turn step left a foot hovering)
  const charlie = plan(R, { unit: units.charlie }, { t0: 94.204, pos: [588, L.charlie], heading: 0, v0: 80, ground: g, name: 'charlie' })
    .move([[596, L.charlie]], { speed: 'jog', decel: 500 }).until(A.CH.throw - 0.02, face([596, L.charlie], A.CAPSPOT))
    .until(A.CH.on - 0.2).step(A.CAPSPOT, { dur: 0.2, shuffle: false })
    .jump({ to: [668, L.charlie], style: 'jump', air: A.CH.land - A.CH.boing, crouch: A.CH.boing - A.CH.on - 0.075, landAt: A.CH.land, recover: 0.45, settle: false })
    .until(96.7, face([668, L.charlie], [760, L.charlie]))
    .move([[760, L.charlie + 6], [eX - 4, L.jade - 24]], { speed: 'walk', arriveAt: A.BC.ready + 0.6 }).until(101.1, face([eX - 4, L.jade - 24], [eX - 18, L.jade])).build();
  const ricky = plan(R, { unit: units.ricky }, { t0: 94.204, pos: [568, L.ricky], heading: 0, v0: 70, ground: g, name: 'ricky' })
    .move([[596, L.ricky]], { speed: 'jog', decel: 500 }).until(95.3, face([596, L.ricky], A.LIFT))
    .jump({ to: A.LIFT, style: 'hop', air: 0.26, crouch: 0.16, landAt: A.RK.stomp, recover: 0.1, settle: false })
    .move([[A.LIFT[0] + 1.5, A.LIFT[1]]], { speed: 'jog', accel: 1400, decel: 1400, jerk: 30000 })   // a shuffle on the risen lift: the hop-off then starts from its top (M6)
    .jump({ to: [672, L.ricky], style: 'jump', air: 0.24, crouch: 0.03, landAt: A.RK.off, recover: 0.2, settle: true })
    .move([[730, L.ricky], [eX - 30, L.jade + 8], [eX - 14, L.jade]], { speed: 'brisk', arriveAt: A.BC.test[0] - 0.08 }).until(A.BC.step, face([eX - 14, L.jade], [A.GATE_X + 60, L.jade]))
    .move([[A.GATE_X + 20, L.jade + 6]], { speed: 'walk' }).idle(0.5).build();
  return { jade, charlie, ricky };
}

/** heroes hiding behind each other from a camera (the MotionGroup rule: view-angle gap >= the hero width + a gap): list of [t, a, b, deg] */
export function screenCheck(tracks, camAt, t0, t1, dt = 0.05) {
  const out = [], names = Object.keys(tracks).filter((n) => tracks[n].state);
  for (let t = t0; t < t1; t += dt) { const C = camAt(t); if (!C) continue; for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = tracks[names[i]].state(t), b = tracks[names[j]].state(t); const ra = [a.x - C[0], a.z - C[2]], rb = [b.x - C[0], b.z - C[2]];
    const la = Math.hypot(...ra), lb = Math.hypot(...rb); const ang = Math.abs(Math.atan2(ra[0] * rb[1] - ra[1] * rb[0], ra[0] * rb[0] + ra[1] * rb[1]));
    const minA = Math.atan((0.95 * tracks[names[i]].H) / Math.max(la, lb)); if (ang < minA && Math.hypot(a.x - b.x, a.z - b.z) < 6 * tracks[names[i]].H) out.push([+t.toFixed(2), names[i], names[j], +(ang * 57.3).toFixed(1)]); } }
  return out;
}

// =====================================================================================================================
// COLLISION CHECK (node; jade's note "the laser cuts through a solid object / the players walk through the tripod").
// Input: the frames an R4 render logs with engine/out/dev/talos_dump.json present (prebattle_props talosDump: '[engine] TDUMP {...}').
// Each beam segment is tested against every solid (one OBB per mesh) and every hero (vertical capsule); each hero capsule is
// tested against every solid. A beam may start inside its emitter and end on its relay / receiver / splash target: the first and
// last END_TOL units of each segment are free. Heroes: the capsule starts FOOT_CLEAR above the feet (standing on things is fine),
// and solids lower than LOW_H (plate, socket ring) are floor.
// =====================================================================================================================
const END_TOL = 5, HERO_R = 5.5, FOOT_CLEAR = 5, LOW_H = 4, MIN_PEN = 1.0;
function inv4(m) {   // inverse of a column-major affine 4x4 (three.js elements)
  const [a, b, c, , d, e, f, , g, h, i, , x, y, z] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C; if (Math.abs(det) < 1e-12) return null;
  const r = [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, -(d * i - f * g) / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
  return { r, t: [x, y, z] };
}
const toLocal = (I, p) => { const v = [p[0] - I.t[0], p[1] - I.t[1], p[2] - I.t[2]]; return [I.r[0] * v[0] + I.r[3] * v[1] + I.r[6] * v[2], I.r[1] * v[0] + I.r[4] * v[1] + I.r[7] * v[2], I.r[2] * v[0] + I.r[5] * v[1] + I.r[8] * v[2]]; };
/** segment a->b vs box [lo, hi] (local): [t0, t1] or null */
function segBox(a, b, lo, hi, pad = 0) {
  let t0 = 0, t1 = 1; const P = Array.isArray(pad) ? pad : [pad, pad, pad];
  for (let k = 0; k < 3; k++) { const d = b[k] - a[k], l = lo[k] - P[k], h = hi[k] + P[k];
    if (Math.abs(d) < 1e-9) { if (a[k] < l || a[k] > h) return null; continue; }
    let u = (l - a[k]) / d, v = (h - a[k]) / d; if (u > v) [u, v] = [v, u]; t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) return null; }
  return [t0, t1];
}
/** closest distance between segments p1-q1 and p2-q2, and the parameter on the first */
function segSeg(p1, q1, p2, q2) {
  const d1 = q1.map((v, k) => v - p1[k]), d2 = q2.map((v, k) => v - p2[k]), r = p1.map((v, k) => v - p2[k]);
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2]; const a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r);
  let s, t; if (a < 1e-9) { s = 0; t = Math.min(1, Math.max(0, f / e)); }
  else { const c = dot(d1, r); if (e < 1e-9) { t = 0; s = Math.min(1, Math.max(0, -c / a)); }
    else { const b = dot(d1, d2), den = a * e - b * b; s = den > 1e-9 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0; t = (b * s + f) / e;
      if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); } } }
  const c1 = p1.map((v, k) => v + d1[k] * s), c2 = p2.map((v, k) => v + d2[k] * t); return { d: Math.hypot(c1[0] - c2[0], c1[1] - c2[1], c1[2] - c2[2]), s };
}
/**
 * frames: [{ t, room, beams: [{ n, segs: [[ax,ay,az,bx,by,bz]] }], solids: [{ n, m, lo, hi }], heroes: [{ n, x, z, y0, y1 }] }]
 * opts.skip(kind, a, b, frame) -> true to exempt a pair (kind 'beam-solid' | 'beam-hero' | 'hero-solid').
 * Returns failures [{ t, kind, vis, a, b, pen }] (pen = penetration length outside the free end zones, units; vis = on screen).
 */
export function collisionReport(frames, opts = {}) {
  const out = []; const skip = opts.skip || (() => false);
  for (const F of frames) {
    for (const H of F.heroes) if ((H.feet || []).length) H.y0 = Math.min(...H.feet.flatMap((f) => [f.heel[1], f.toe[1]]));   // the capsule starts at the soles (the visible box can include props hanging off a hero)
    const S = F.solids.map((s) => ({ ...s, I: inv4(s.m), base: s.n.split('#')[0] }));
    // world-space height of each solid (for the 'floor' rule): its 8 corners' y
    for (const s of S) { let y0 = 1e9, y1 = -1e9; for (const x of [s.lo[0], s.hi[0]]) for (const y of [s.lo[1], s.hi[1]]) for (const z of [s.lo[2], s.hi[2]]) { const m = s.m; const wy = m[1] * x + m[5] * y + m[9] * z + m[13]; y0 = Math.min(y0, wy); y1 = Math.max(y1, wy); } s.wy0 = y0; s.wy1 = y1; }
    for (const B of F.beams) for (const g of B.segs) {
      const a = g.slice(0, 3), b = g.slice(3, 6), L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); if (L < 1e-3) continue; const vis = g[6] !== 0;
      const free0 = END_TOL / L, free1 = 1 - END_TOL / L;
      for (const s of S) { if (!s.I || skip('beam-solid', B.n, s.base, F)) continue; const h = segBox(toLocal(s.I, a), toLocal(s.I, b), s.lo, s.hi); if (!h) continue;
        const pen = (Math.min(h[1], free1) - Math.max(h[0], free0)) * L; if (pen > MIN_PEN) out.push({ t: F.t, room: F.room, kind: 'beam-solid', vis, a: B.n, b: s.base, pen: +pen.toFixed(1), at: a.map((v, k) => Math.round(v + (b[k] - v) * (h[0] + h[1]) / 2)) }); }
      for (const H of F.heroes) { if (skip('beam-hero', B.n, H.n, F)) continue; const r = segSeg(a, b, [H.x, H.y0 + FOOT_CLEAR, H.z], [H.x, H.y1 - 2, H.z]);
        if (r.d < HERO_R - 1 && r.s > free0 && r.s < free1) out.push({ t: F.t, room: F.room, kind: 'beam-hero', vis: vis && H.vis !== 0, a: B.n, b: H.n, pen: +(HERO_R - r.d).toFixed(1) }); }
    }
    for (const H of F.heroes) { const p = [H.x, H.y0 + FOOT_CLEAR, H.z], q = [H.x, Math.max(H.y0 + FOOT_CLEAR + 1, H.y1 - 2), H.z];
      for (const s of S) { if (!s.I || s.wy1 - s.wy0 < LOW_H || skip('hero-solid', H.n, s.base, F)) continue;
        // pad the box by the capsule radius sideways only (not along its most vertical local axis: standing on things is fine)
        const m = s.m, up = [0, 1, 2].map((k) => Math.abs(m[4 * k + 1]) / (Math.hypot(m[4 * k], m[4 * k + 1], m[4 * k + 2]) || 1)), kv = up.indexOf(Math.max(...up));
        const sc = [0, 1, 2].map((k) => Math.hypot(m[4 * k], m[4 * k + 1], m[4 * k + 2]) || 1), pad = [0, 1, 2].map((k) => (k === kv ? 0 : HERO_R / sc[k]));
        const h = segBox(toLocal(s.I, p), toLocal(s.I, q), s.lo, s.hi, pad);
        if (!h) continue; const pen = (h[1] - h[0]) * (q[1] - p[1]); if (pen > MIN_PEN) out.push({ t: F.t, room: F.room, kind: 'hero-solid', vis: H.vis !== 0, a: H.n, b: s.base, pen: +pen.toFixed(1) }); } }
  }
  return out;
}
/** parse TDUMP lines out of a render log */
export function parseDump(text) { const fr = []; for (const line of text.split('\n')) { const i = line.indexOf('TDUMP '); if (i >= 0) { try { fr.push(JSON.parse(line.slice(i + 6))); } catch { /* truncated */ } } } fr.sort((x, y) => x.t - y.t); return fr.filter((f, i) => i === 0 || f.t !== fr[i - 1].t || f.room !== fr[i - 1].room); }   // a frame can be logged twice (shot handover)

// ---------------------------------------------------------------------------------------------- SUPPORT CHECK (M6)
// Every planted foot (contact flag on, not in a designed jump's air phase) must stand on something walkable: the world ground
// (causeway / meadow y 0, mesa A / mesa B tops y 10) or the top face of a dumped support OBB (planks, the stroke bridge, terrace,
// lift, plate, letters) within SUP_TOL. The foot point = the lower of its heel / toe contact points, x/z at their middle.
const SUP_TOL = 3, SUP_EDGE = 1.5, SUP_HOVER = 12;
const MESAS = [{ x0: 560, x1: 1000, z0: 260, z1: 540, y: 10 }, { x0: 1090, x1: 1560, z0: 240, z1: 560, y: 10 }];
export function worldGroundY(x, z) { for (const m of MESAS) if (x >= m.x0 && x <= m.x1 && z >= m.z0 && z <= m.z1) return m.y; if (z <= 24 && z > -600 && x < 1000) return 0; return null; }
export function supportReport(frames) {
  const out = []; const prev = new Map();
  for (const F of frames) {
    const S = (F.sup || []).map((s) => { const I = inv4(s.m); const m = s.m; const ys = [0, 1, 2].map((k) => m[4 * k + 1] / (Math.hypot(m[4 * k], m[4 * k + 1], m[4 * k + 2]) || 1));
      const kv = ys.map(Math.abs).indexOf(Math.max(...ys.map(Math.abs))); const sc = Math.hypot(m[4 * kv], m[4 * kv + 1], m[4 * kv + 2]) || 1; return { ...s, I, kv, up: ys[kv] > 0 ? 1 : -1, sc }; });
    // heights of the walkable tops under a point (world ground + every support whose footprint holds it)
    const topsUnder = (p) => { const r = []; const g = worldGroundY(p[0], p[2]); if (g != null) r.push(g);
      for (const s of S) { if (!s.I) continue; const q = toLocal(s.I, p); let inside = true;
        for (let k = 0; k < 3; k++) { if (k === s.kv) continue; if (q[k] < s.lo[k] - SUP_EDGE || q[k] > s.hi[k] + SUP_EDGE) { inside = false; break; } }
        if (inside) { const top = s.up > 0 ? s.hi[s.kv] : s.lo[s.kv]; r.push(p[1] - (q[s.kv] - top) * s.up * s.sc); } }
      return r; };
    for (const H of F.heroes) { if (H.air === 1 || H.air == null || !(H.feet || []).length) continue;
      const pts = H.feet.map((f) => ({ f, p: [(f.heel[0] + f.toe[0]) / 2, Math.min(f.heel[1], f.toe[1]), (f.heel[2] + f.toe[2]) / 2] }));
      // planted = the contact flag AND the foot not moving (a turn step's swing foot can still carry the flag for a frame)
      for (const q of pts) { const k = H.n + q.f.sd, o = prev.get(k); q.moving = !!o && Math.hypot(q.p[0] - o[0], q.p[1] - o[1], q.p[2] - o[2]) > 1.0; prev.set(k, q.p); }
      const lowest = pts.reduce((a, b) => (b.p[1] < a.p[1] ? b : a));
      for (const { f, p, moving } of pts) { const planted = f.c === 1 && !moving; if (!planted && f !== lowest.f) continue;
        const gaps = topsUnder(p).map((y) => p[1] - y).filter((d) => d >= -SUP_TOL); const gap = gaps.length ? Math.min(...gaps) : null;
        const max = planted ? SUP_TOL : SUP_HOVER;   // a moving hero's lower foot may be in a stride's flight, not above nothing
        if (gap == null || gap > max) out.push({ t: F.t, room: F.room, kind: 'unsupported', a: H.n, b: f.sd + (planted ? ' planted' : ' stride'), vis: H.vis !== 0, at: p.map(Math.round), gap: gap == null ? 'none' : +gap.toFixed(1) }); } }
  }
  return out;
}


// =====================================================================================================================
// ROUND 5 (talos_r5, docs/game_design_half2_r5.md). Behind the --r5 flag (R5() in common.js). ROOM A is re-laid: the road
// ends in an eraser bite; ONE graphite slab in the gap (its three strokes = Jade's three slashes); a tall ruined wall on mesa
// A in the amp -> socket line; the socket + plate + gate just past the wall's east end, so the slab's crystal relays AROUND the
// wall's end. Charlie glides across on the hat-parachute and lands on the plate; the receiver rises out of the socket.
// All cameras look +z (toward the sea / mesa A) from behind the party at chest height.
// =====================================================================================================================
export const RA5 = {
  AMP: [670, 18], AMP_Y: 16,                                     // Ricky's fixed amp on its plinth at the causeway's sea edge, aimed at the socket
  STUB: { x0: 740, x1: 820, z0: 24, z1: 76, bite: { x: 780, z: 96, r: 36 } },   // the eaten road: a stub with a clean eraser bite at its end, crumbs on the lip
  BASE: [812, 250], BY: 10, FOOT: [800, 72], HINGE: [812, 252],  // the one slab's pier at mesa A's lip, in the sea beside the wall's east end; its plank falls SOUTH into the bite (M1 notes: a bend in plan, not in elevation)
  LAND: [806, 64], LY: 10,                                       // where the plank's free end lands: on the stub, across the bite
  SOCKET: [750, 316], PLATE: [784, 316], RECV_H: 26,             // the empty socket (the receiver rises out of it) and the plate beside it
  GATE: [770, 362],                                              // the force-field gate, lamps facing the bridge (-z)
  WALL: { c: [683, 262], dir: [1, 0], len: 126, top: 92, thick: 18 },   // tall ruined wall on the lip, square across the amp -> socket line (its east end at x 748)
  STELE: [830, -56], STELE_YAW: 0.12, STELE_H: 38, STELE_LEAN: 0.42,   // leans back: its carved face meets the raised reveal camera                            // the broken stele in the reveal's right foreground: `> level up reality`
  STRUT: { len: 42, out: 30, anchorY: 88 },                      // the 丿 stroke: from the slab's east flank at mid-height slanting down and out to the crystal at chest height (y ~46)
  SLASH: [86.63, 86.87, 87.13], RISE: 0.16, PULSE: 86.45,
  POP: 88.3, LAND_T: 88.86, RISE_R: 89.68,                       // Charlie pops the hat at the bite, lands on the plate on the accent; the receiver rises
  HOP: [0.1, 0.2], LAMPS: [90.29, 90.32, 90.35],                 // the beam reaches the crystal / the receiver after the chord; the gate lamps
  SWING0: 91.11, JOLT: 0.2, SWING_DUR: 0.36, RESUME: 92.56, SLAM: 92.86,   // the swing starts on the re-hit, jolts to a stop at 20 %, resumes on the first hey, slams down
  HEY: [92.56, 93.18, 93.58],                                    // the hey hey hey ad-libs (analysis/lyrics_timed.json word onsets): Ricky's metronome chords
  FF: { on: 90.9, hop: [92.56, 93.18], off: 93.58, gone: 94.3 },  // the firefly on the receiver lens
  STOP: { jade: [782, 10], charlie: [758, 36], ricky: [738, 2] },   // the reveal: the party at the bite (Ricky walks back to the amp after the slab stop)
  GLAM: { jade: [674, -8] },                                       // in front of the amp from the glamour camera (k08b: the beam emerges past her)                                       // beside the amp, screen-right of the beam's start (the beam emerges past her, k08b-style)                                     // FUNCTIONS!: Jade beside the amp (the tripod-equivalent spot), Ricky at its jack, Charlie far on the plate
  RICKY_AMP: [648, -16],                                         // Ricky at the amp's jack
  RUN: 92.02, OFFPLATE: 93.7, TIP: 93.85,                        // she anticipates the slab's swing (resumes 92.56, lands 92.86): on the plank as it settles                        // Jade runs as the slab lands; Charlie steps off the plate and tips his hat
  OFFSPOT: [768, 296],                                           // where Charlie steps to (between the socket and the plate, clear of Jade's lane)
  CAM: { reveal: [[822, 60, -112], [770, 18, 300]], reveal1: [[830, 104, -98], [776, -12, 212]], reveal2: [[832, 112, -96], [776, -16, 210]], glamour: [[672, 44, -152], [740, 36, 230]], close: [[730, 60, 352], [756, 54, 310]], cross: [[848, 36, 42], [776, 28, 330]] },
};
/** deck height along the one slab (foot -> base -> landing), causeway 0, mesa 10 */
export function deckYA5(x, z) {
  if (z <= RA5.LAND[1]) return 0; if (z >= RA5.HINGE[1] - 10) return RA5.LY;   // the stub (0) -> up the plank (0 .. 10 from its free end to the hinge) -> the mesa (10)
  return RA5.LY * clamp01((z - RA5.LAND[1]) / (RA5.HINGE[1] - 10 - RA5.LAND[1]));
}
/** the three Room A r5 tracks (song time). R = { clips }, units = { jade, charlie, ricky } */
export function roomATracksR5(R, units) {
  const A = RA5, g = deckYA5, face = (a, b) => ({ face: headingTo(a, b) }); const S = A.STOP;
  const bridge = [A.FOOT, [804, 150], [806, 240], [806, 268]];   // the stub's lip -> up the plank (x 789-835) -> the mesa
  // Jade: walks up to the bite, slashes (upper body), watches; runs the bridge as the slab lands; east of the plate; to the gate
  const jade = plan(R, { unit: units.jade }, { t0: 86.385, pos: [A.STOP.jade[0] - 1, A.STOP.jade[1] - 11], v0: 55, heading: Math.PI / 2, ground: g, name: 'jade' })
    .move([S.jade], { speed: 55, decel: 400 }).until(87.4, face(S.jade, [A.BASE[0], 200])).until(87.84)
    .move([A.GLAM.jade], { speed: 'walk', accel: 600, decel: 600, jerk: 9000, arriveAt: 89.5 }).until(A.RUN - 0.02, face(A.GLAM.jade, A.BASE))
    .move([[702, 2], [750, 4], [778, 30], ...bridge, [822, 300], [786, 340], A.GATE, [770, 410]], { speed: 'sprint', accel: 700, decel: 950, jerk: 9000 }).idle(0.5);
  // Charlie: at the bite; after the stop he runs to the lip, pops the hat (a jump whose y the scene replaces with the glide) and
  // lands on the plate on the accent; holds it; steps off; tips his hat
  const charlie = plan(R, { unit: units.charlie }, { t0: 86.385, pos: [A.STOP.charlie[0] - 1, A.STOP.charlie[1] - 12], v0: 55, heading: Math.PI / 2, ground: g, name: 'charlie' })
    .move([S.charlie], { speed: 55, decel: 400 }).until(87.84, face(S.charlie, A.PLATE))
    .move([[754, 56]], { speed: 120, accel: 1200, decel: 1200, jerk: 20000, arriveAt: A.POP - 0.15 }).until(A.POP - 0.1)
    .jump({ to: A.PLATE, style: 'jump', air: A.LAND_T - A.POP, apex: 40, crouch: 0.05, landAt: A.LAND_T, recover: 0.3, settle: false })
    .until(A.OFFPLATE, face(A.PLATE, [A.LAND[0] - 10, A.LAND[1] - 40]))
    .step(A.OFFSPOT, { dur: 0.26, shuffle: true, face: headingTo(A.OFFSPOT, [800, 200]) }).until(94.4);
  // Ricky: at the bite for the reveal, back to the amp after the stop, plugs in, plays (FUNCTIONS!, the three metronome chords),
  // then follows Jade over the bridge
  const ricky = plan(R, { unit: units.ricky }, { t0: 86.385, pos: [A.STOP.ricky[0] + 10, A.STOP.ricky[1] - 8], v0: 55, heading: 2.5, ground: g, name: 'ricky' })
    .move([S.ricky], { speed: 55, decel: 400 }).until(87.84)
    .move([A.RICKY_AMP], { speed: 130, accel: 800, decel: 800, jerk: 12000, arriveAt: 89.0 }).until(89.06, face(A.RICKY_AMP, A.AMP))
    .clip('interact', { rate: 2.4 }).until(93.76, face(A.RICKY_AMP, [A.BASE[0], 150]))
    .move([[712, -2], [750, 4], [778, 30], ...bridge, [818, 300]], { speed: 'sprint', accel: 700, decel: 900, jerk: 9000 }).idle(0.5);
  for (const [p, n] of [[jade, 'jade'], [charlie, 'charlie'], [ricky, 'ricky']]) p.name = n;
  return { jade: jade.build(), charlie: charlie.build(), ricky: ricky.build() };
}

// ---------------------------------------------------------------------------------------------- ROOM 2 r5: the beetle in the lift
export const R2_5 = {
  HOUSING: [668, 44, 329], HOUSING_W: 22,                      // between Ricky's hop-off landing (672, 304) and Jade's lane (z 348): box z 318-340                      // the lift's gear housing (an open cage) on the terrace top's north-west corner, beside the lift
  LIFT5: { t0: 95.9, stall: 96.18, free: 96.26, top: 96.36 },  // the rise: three jerks (the beetle), a stall, free after the poke
  POKE: { reach: 96.02, hit: 96.2, done: 96.34 },              // Jade pokes the housing with the graphite pencil
  BEETLE: { out: 96.26, gone: 97.2 },                          // the beetle rolls out and away, still circling
  JADE_POKE: [688, 352],                                        // where she stands on the terrace's edge to poke
  DUCK: { t0: 100.72, t1: 101.0 },                              // Charlie ducks through the because gate (the ladybug close-up)
  SHOT4: 100.735,                                               // beat 240: the ladybug close-up
};
/** Room 2 tracks with the r5 additions: Jade's poke detour, Charlie's duck through the gate */
export function room2TracksR5(R, units) {
  const A = R2, g = groundR2, face = (a, b) => ({ face: headingTo(a, b) }); const L = A.LANE; const Q = R2_5;
  const eX = A.GATE_X - 52;
  const jade = plan(R, { unit: units.jade }, { t0: 94.204, pos: [606, L.jade], heading: 0, v0: 0, ground: g, name: 'jade' })
    .jump({ to: [674, L.jade], style: 'jump', air: A.VAULT[1] - A.VAULT[0], crouch: 0.02, landAt: A.VAULT[1], recover: 0.45, settle: false })
    .move([Q.JADE_POKE], { speed: 'walk', arriveAt: Q.POKE.reach - 0.1 }).until(Q.POKE.done, face(Q.JADE_POKE, [Q.HOUSING[0], Q.HOUSING[2]]))
    .move([[700, L.jade], [790, L.jade + 4], [eX - 6, L.jade]], { speed: 'brisk', arriveAt: 98.6 })
    .move([[A.GATE_X + 20, L.jade], [A.GATE_X + 39, L.jade - 22], [A.GATE_X + 31, L.jade - 25]], { speed: 'brisk', arriveAt: 100.1 }).until(101.1).build();
  const charlie = plan(R, { unit: units.charlie }, { t0: 94.204, pos: [588, L.charlie], heading: 0, v0: 80, ground: g, name: 'charlie' })
    .move([[596, L.charlie]], { speed: 'jog', decel: 500 }).until(A.CH.throw - 0.02, face([596, L.charlie], A.CAPSPOT))
    .until(A.CH.on - 0.2).step(A.CAPSPOT, { dur: 0.2, shuffle: false })
    .jump({ to: [668, L.charlie], style: 'jump', air: A.CH.land - A.CH.boing, crouch: A.CH.boing - A.CH.on - 0.075, landAt: A.CH.land, recover: 0.45, settle: false })
    .until(96.7, face([668, L.charlie], [760, L.charlie]))
    .move([[760, L.charlie + 6], [eX - 4, L.jade - 24]], { speed: 'walk', arriveAt: A.BC.ready + 0.6 }).until(Q.DUCK.t0 - 0.3, face([eX - 4, L.jade - 24], [eX - 18, L.jade]))
    .move([[eX - 8, L.jade - 6], [A.GATE_X + 4, L.jade], [A.GATE_X + 30, L.jade + 2]], { speed: 120, accel: 800, decel: 800, jerk: 12000, arriveAt: Q.DUCK.t1 + 0.3 }).until(101.5).build();
  const ricky = plan(R, { unit: units.ricky }, { t0: 94.204, pos: [568, L.ricky], heading: 0, v0: 70, ground: g, name: 'ricky' })
    .move([[596, L.ricky]], { speed: 'jog', decel: 500 }).until(95.3, face([596, L.ricky], A.LIFT))
    .jump({ to: A.LIFT, style: 'hop', air: 0.26, crouch: 0.16, landAt: A.RK.stomp, recover: 0.1, settle: false })
    .move([[A.LIFT[0] + 1.5, A.LIFT[1]]], { speed: 'jog', accel: 1400, decel: 1400, jerk: 30000 })
    .jump({ to: [672, L.ricky - 3], style: 'jump', air: 0.24, crouch: 0.03, landAt: A.RK.off, recover: 0.2, settle: true })   // z 309: inside the terrace's north edge (300), clear of the housing (z 318-340)
    .move([[730, L.ricky], [eX - 30, L.jade + 8], [eX - 14, L.jade]], { speed: 'brisk', arriveAt: A.BC.test[0] - 0.08 }).until(A.BC.step, face([eX - 14, L.jade], [A.GATE_X + 60, L.jade]))
    .move([[A.GATE_X + 20, L.jade + 6]], { speed: 'walk' }).idle(0.5).build();
  return { jade, charlie, ricky };
}

// ---------------------------------------------------------------------------------------------- ROOM B r5: the acting
// Layout and logic as RB (round 4). Times: the reveal holds a bar (101.0-102.768), the plant moves to beat 248 (103.988), first
// person runs to beat 250 (104.803) so the plant is seen in first person, the moth's two bonks stutter the bridge (no step-off
// threat), the hat trick on "life" (105.2), the tip of the hat on 105.7, the crossing from 105.75.
export const RB5 = { ...RB,
  T: { amp: 101.36, plate: 103.45, plant: 104.7, pull: 105.2, hatDrop: 105.52, off: 105.618, tip: 105.68, fp: [103.581, 104.803], point: [102.78, 103.06], nod: 102.8, snap: [104.35, 104.45] },
  MOTH: [104.9, 105.3],
  CAM: { reveal: [[970, 44, 652], [1040, 16, 430]], act: [[846, 44, 588], [962, 28, 498]], k08b: [[992, 58, 637], [1010, 24, 325]] },
};
export const RB5_CAM = (t) => (t < 102.768 ? RB5.CAM.reveal[0] : t < 103.581 ? RB5.CAM.act[0] : t < 104.803 ? null : [992, 58, 637]);
export function roomBTracksR5(R, units) {
  const B = RB5, g = groundB, face = (a, b) => ({ face: headingTo(a, b) }), T = B.T;
  const P = B.PLATE, S = B.STAND, FOOTB = [B.BRIDGE.x0 + 6, B.BRIDGE.z];
  const fast = { accel: 900, decel: 900, jerk: 12000 };
  // Jade: in, nods to Charlie's plan, picks up the tripod, carries it to the edge (first person), plants it on beat 248, keeps a
  // hand on it; crosses first
  const jade = plan(R, { unit: units.jade }, { t0: 101.0, pos: [B.TRIPOD0[0] - 13, B.TRIPOD0[1] + 2], heading: headingTo([B.TRIPOD0[0] - 13, B.TRIPOD0[1] + 2], B.STACK.c), v0: 0, ground: g, name: 'jade' })
    .until(T.nod)
    .clip('yes', { rate: 6 })
    .clip('pickup', { rate: 2.3 })
    .move([[984, 512], S], { speed: 'stroll', ...fast, arriveAt: T.plant - 0.16 })
    .until(105.75, face(S, B.RECV))
    .move([[974, 499], [988, 500], [FOOTB[0] + 14, B.BRIDGE.z], [B.BRIDGE.x1, B.BRIDGE.z], [1146, 505]], { speed: 'run', accel: 700, decel: 600, jerk: 9000, autoTurn: false }).idle(0.6);
  // Charlie: points at the plate, walks to it; holds it; the spare cap out of his cap onto the plate; tips his hat; off and across last
  const charlie = plan(R, { unit: units.charlie }, { t0: 101.0, pos: [930, 530], heading: headingTo([930, 530], B.STACK.c), v0: 0, ground: g, name: 'charlie' })   // inside mesa A (its south edge is z 540)
    .until(T.point[1]).move([P], { speed: 120, ...fast, arriveAt: T.plate })   // he holds south-west of the plate: the plate and the stack are both ahead of him
    .until(T.pull + 0.04, face(P, [1010, 440])).clip('pickup', { rate: 2.2 })
    .until(106.25, face(P, [1010, 440]))
    .move([[966, 506], [FOOTB[0] + 14, B.BRIDGE.z + 1], [B.BRIDGE.x1, B.BRIDGE.z + 1], [1124, 514]], { speed: [[0, 'brisk'], [0.5, 'run']], accel: 800, decel: 700, jerk: 9000, autoTurn: false }).idle(0.6);
  // Ricky: at his amp, plugs in + chord (the amp keeps running); plays on; crosses second
  const ricky = plan(R, { unit: units.ricky }, { t0: 101.0, pos: B.ENTER.ricky, heading: 0, v0: 20, ground: g, name: 'ricky' })
    .move([[B.AMP[0] - 20, B.AMP[1] + 3]], { speed: 'walk', ...fast }).until(105.8, face([B.AMP[0] - 20, B.AMP[1] + 3], [1000, 470]))
    .move([[944, 460], [962, 492], [FOOTB[0] + 14, B.BRIDGE.z - 1], [B.BRIDGE.x1, B.BRIDGE.z - 1], [1134, 494]], { speed: [[0, 'jog'], [0.4, 'run']], accel: 700, decel: 600, jerk: 9000, autoTurn: false }).idle(0.6);
  const out = { jade: jade.build(), charlie: charlie.build(), ricky: ricky.build() };
  out.screen = screenCheck(out, RB5_CAM, 101.0, 107.15); return out;
}
/** r5: the plate is held once Charlie stands on it (no step-off threat) or the spare hat is down */
export function plateHeld5(charlie, t) { if (t >= RB5.T.hatDrop + 0.06) return true; const s = charlie.state(t); return Math.hypot(s.x - RB5.PLATE[0], s.z - RB5.PLATE[1]) < 7; }
