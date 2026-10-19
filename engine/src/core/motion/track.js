// MotionTrack: deterministic locomotion / action timeline for one hero. Built ONCE in setup (fixed-step simulation at
// 240 Hz from the track start), then queried as a pure function of song time t: state(t) -> root position, facing, lean,
// weighted animation sources (gait blend by speed with a cadence-driven cycle phase, or mocap one-shots) and foot contacts.
//
//   const tr = new MotionTrack(clips, { t0, pos: [x, z], heading: 0, unit: fig.unit, ground: (x, z) => 0 })
//     .idle(0.4)
//     .move([[x, z], ...], { speed: [[0, 'walk'], [1.5, 'jog']] })     // spline path, brakes to a stop at its end
//     .idle(0.6, { face: angle })                                       // turn in place WITH steps (> 35 deg)
//     .traverse({ to: [x, z] })                                         // step / hop / climb, chosen by the height change
//     .jump({ to: [x, z], landAt: T.beat(212) })                        // anticipation, push-off, ballistic arc, short squash
//     .clip('yes')                                                      // a one-shot in place
//     .build();
//   tr.state(t)  (see MotionFigure.apply for the consumer)
//
// r2 (motion_r2, 2026-10-16): gait bands with stride / cadence model (walk 0.35-1.85 m/s, quick walk->jog switch, jog / run
// from the jog clip with its swing scaled to the stride, sprint), phase warp to natural duty factors, hop vs jump vs climb by
// height, short landing squash, turn-in-place steps, jerk-limited starts, momentum lean (underdamped), arriveAt / landAt /
// until for beat locking, footfalls on beats (move({ beats })), separation via MotionGroup (group.js).
import { Path } from './path.js';
import { clipContact, clipStats } from './clips.js';
import { mantleClip } from './mantle.js';

export const DT = 1 / 240;
/** one gravity for every jump (world units / s^2; the heroes are ~68 units tall at figscale 1.3) */
export const GRAVITY = 900;
export const FADE = 0.2;
export const GAITS = ['walk', 'jog', 'sprint'];
const DS_PHASE = 0.07;      // double-support phases (k / 2 + 0.07: one foot just struck, the other not lifted yet): stops land here
const IDLE_PHASE = 0.57;    // the idle / landing stance is left-foot-forward = the walk at 0.57 (left just struck, right about to lift)
const toIdleParity = (ph) => Math.ceil(ph - IDLE_PHASE - 1e-9) + IDLE_PHASE;
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const D2R = Math.PI / 180;

/**
 * Gait model, speeds in m/s at the mocap scale (48.8 design units per metre; x track.M = world u/s). Cadence in cycles/s
 * (= steps per minute / 120), duty = stance fraction per foot. Real-gait numbers: walking cadence ~ 72 + 29 v spm, the walk ->
 * run switch is abrupt at ~2 m/s (so the blend band is narrow: no "power walk"), running cadence 150-180 spm.
 */
export const GAIT_MODEL = {
  bands: { idleWalk: [0, 0.35], walkJog: [1.85, 2.12], jogSprint: [6.0, 7.0] },
  walk: { clip: 'walk', cad: (v) => (72 + 29 * v) / 120, duty: (k) => clamp(0.62 - 0.05 * (k - 1), 0.55, 0.66) },
  jog: { clip: 'jog', cad: (v) => (150 + 6 * (v - 2)) / 120, duty: (k, v) => clamp(0.40 - 0.04 * (v - 2), 0.24, 0.40) },
  sprint: { clip: 'run', cad: (v) => (178 + 4 * Math.max(0, v - 6)) / 120, duty: () => 0.22 },
};
/** named speeds (m/s) for move({ speed }) */
export const SPEEDS = { stroll: 0.9, walk: 1.3, brisk: 1.75, jog: 2.8, run: 4.6, sprint: 7.2 };

/** gait weights for a ground speed v (world u/s): { idle, walk, jog, sprint } (narrow smooth bands) */
export function gaitWeights(G, v) {
  const w = { idle: 0, walk: 0, jog: 0, sprint: 0 }; const m = v / G.M, B = GAIT_MODEL.bands;
  if (m <= 1e-6) { w.idle = 1; return w; }
  const mix = (a, b, band) => { const x = (m - band[0]) / (band[1] - band[0]); const s = a === 'idle' ? clamp(x, 0, 1) : smooth(x); w[a] = 1 - s; w[b] = s; };
  if (m < B.idleWalk[1]) mix('idle', 'walk', B.idleWalk);
  else if (m < B.walkJog[0]) w.walk = 1;
  else if (m < B.walkJog[1]) mix('walk', 'jog', B.walkJog);
  else if (m < B.jogSprint[0]) w.jog = 1;
  else if (m < B.jogSprint[1]) mix('jog', 'sprint', B.jogSprint);
  else w.sprint = 1;
  return w;
}
/** full gait state at speed v (world u/s), optional cadence override f (cycles/s): { w, f, stride, duty, k: { walk, jog, sprint } } */
export function gaitInfo(G, v, fo = null) {
  const w = gaitWeights(G, v), m = v / G.M; let f = 0, W = 0;
  for (const g of GAITS) if (w[g] > 0) { f += w[g] * G[g].cad(m); W += w[g]; }
  f = fo ?? (W > 0 ? f / W : G.walk.cad(0));
  const stride = f > 1e-6 ? v / f : 0; const k = {}; let duty = w.idle, dW = w.idle, dg = 0;
  for (const g of GAITS) { k[g] = G[g].stride > 0 ? stride / G[g].stride : 1; if (w[g] > 0) { const d = G[g].duty(k[g], m); duty += w[g] * d; dW += w[g]; dg += w[g] * d; } }
  dg = W > 0 ? dg / W : 0.6;
  // amplitudes per gait: the stance sweep (foot travel under the hip = duty x stride) vs the clip's own; the arm swing by the
  // stride ratio; the bounce by the flight time (a slow jog barely leaves the ground; the walk has none: follow the sweep)
  const K = {};
  for (const g of GAITS) { const st = G[g].st, kk = k[g]; const leg = st.duty > 0 ? (dg * stride) / (st.duty * G[g].stride) : kk;
    const tf = Math.max(0, 0.5 - dg) / Math.max(1e-3, f), tfc = Math.max(0, 0.5 - st.duty) * G[g].clip.dur;
    K[g] = { leg, arm: Math.pow(Math.max(0, kk), 0.6), rootY: tfc > 0.02 ? 0.4 + 0.6 * Math.min(1, (tf / tfc) ** 2) : Math.pow(Math.max(0, leg), 0.85) }; }
  return { w, f, stride, duty: dW > 0 ? duty / dW : 1, dutyG: dg, k, K };
}

export class MotionTrack {
  /**
   * clips: loadMotionClips() result; opts: { t0, pos: [x, z], heading (rad; facing (cos h, sin h) in x/z), unit (world per
   * design unit = fig.unit), ground(x, z), gaits: { walk: 'carry_walk' } (swap a gait's clip), timing (the show's timing
   * module, for beats), name }
   */
  constructor(clips, { t0 = 0, pos = [0, 0], heading = 0, unit = 0.702, ground = () => 0, gaits = {}, timing = null, name = '' } = {}) {
    this.lib = clips; this.clips = clips.clips; this.t0 = t0; this.unit = unit; this.ground = ground; this._tNow = t0;
    this.gnd = (x, z) => this.ground(x, z, this._tNow); this.timing = timing; this.name = name;   // ground(x, z, t) may change with time (a lift): the simulation passes the sample time
    this.M = (clips.meta?.designPerMetre || 48.82) * unit;            // world units per metre
    this.H = (clips.rig?.hip || 45.5) * unit;                        // hip height (world)
    this.G = { M: this.M };
    for (const g of GAITS) { const c = this.clips[gaits[g] || GAIT_MODEL[g].clip]; clipStats(c);
      this.G[g] = { clip: c, st: clipStats(c), stride: c.stride * unit, cad: GAIT_MODEL[g].cad, duty: GAIT_MODEL[g].duty }; }
    if (!this.clips.mantle) this.clips.mantle = mantleClip();
    this.cur = { x: pos[0], z: pos[1], y: ground(pos[0], pos[1]), h: heading, hv: 0, ph: IDLE_PHASE, v: 0, a: 0 };
    this.segs = []; this._plan = []; this.S = []; this.built = false; this.warnings = []; this.gov = []; this._init = { ...this.cur };
  }
  /** speed governor (MotionGroup yields): product of slow-down windows { t0, t1, m } with 0.4 s ramps */
  govern(t) { let k = 1; for (const g of this.gov) { const r = Math.min(smooth((t - g.t0) / 0.4), 1 - smooth((t - (g.t1 - 0.4)) / 0.4)); k *= 1 - (1 - g.m) * r; } return k; }
  /** cycle length (world units) at speed v */
  stride(v) { return gaitInfo(this.G, v).stride; }
  /** a speed: number = world u/s; name (SPEEDS) = m/s x M; { mps } */
  speedOf(x) { if (typeof x === 'number') return x; if (x && typeof x === 'object') return x.mps * this.M; if (!(x in SPEEDS)) throw new Error('unknown speed ' + x); return SPEEDS[x] * this.M; }

  _push(seg) { if (this.built) throw new Error('MotionTrack already built'); this._plan.push(seg); return this; }
  /** stand for dur seconds (or until song time `until`); face: heading to turn to (> 35 deg: turn-in-place steps unless steps: false) */
  idle(dur, { face = null, until = null, steps = true, fade = null, clip = null } = {}) { return this._push({ kind: 'idle', dur, face, until, steps, fade, clip }); }
  /**
   * follow a spline through pts (starting from the current position) with a target-speed profile [[tau, speed], ...];
   * opts: accel, decel (u/s^2), jerk (u/s^3), stop (brake to a stop at the end), turn (facing spring rad/s), arriveAt (song
   * time the stop must land on: solves the speed scale), beats (true / { every }: footfalls on the beat grid; needs timing),
   * autoTurn (turn-in-place steps first if the path starts > 60 deg off the facing)
   */
  move(pts, { speed = [[0, 'walk']], accel = 300, decel = 260, jerk = 2600, stop = true, turn = 9, arriveAt = null, beats = null, autoTurn = true, fade = null } = {}) {
    if (typeof speed === 'string' || typeof speed === 'number') speed = [[0, speed]];
    return this._push({ kind: 'move', pts, speed, accel, decel, jerk, stop, turn, arriveAt, beats, autoTurn, fade });
  }
  /**
   * jump to [x, z] (landing height = ground there unless toY). style 'hop' (quick, low, short crouch: small steps) | 'jump'
   * (bigger crouch and arc) | 'auto' (by height and distance). air (s) or apex (units above the higher end); landAt = song time
   * of the touchdown (waits in idle before the take-off; warns if it can't be met); settle: false to skip the settle steps.
   */
  jump({ to, toY = null, style = 'auto', crouch = null, air = null, apex = null, landAt = null, recover = null, settle = true, fade = null } = {}) {
    return this._push({ kind: 'jump', to, toY, style, crouch, air, apex, landAt, recover, settle, fade });
  }
  hop(o) { return this.jump({ ...o, style: 'hop' }); }
  /**
   * a quick single step / sidestep / shuffle (e.g. 10-15 units in 0.18-0.3 s): the root eases to `to`, the foot on the side of
   * the step goes first and plants at the new stance, the other follows (shuffle: false = it stays: a lunge / threat step).
   * face: heading at the end (default: unchanged).
   */
  step(to, { dur = 0.22, face = null, shuffle = true, fade = 0.08 } = {}) { return this._push({ kind: 'step', to, dur, face, shuffle, fade }); }
  /**
   * walk up to a hand target and face it: stops `reach` (hip heights, default 0.42 = a comfortable arm's reach with a little
   * hip bend) short of `at` ([x, y, z] or [x, z]) on the line from where the hero is then, so the last steps already face it.
   * from: optional [x, z]: approach along the line from there (the path bends into a straight 0.9-hip lead-in on it).
   */
  approach(at, { reach = 0.42, speed = 'walk', from = null, ...o } = {}) { return this._push({ kind: 'approach', at, reach, speed, from, o }); }
  /** climb / mantle onto a ledge: hands on the edge (arm IK), pull up, knee up, stand at `to` (edge: [x, z] on the lip, default
   *  = the first point toward `to` where the ground rises) */
  climb({ to, toY = null, edge = null, landAt = null } = {}) { return this._push({ kind: 'climb', to, toY, edge, landAt }); }
  /** go to `to` and up / down whatever is in the way, decided at build time from the height change: walk (|dy| < 0.3 hip),
   *  hop (up to 0.85 hip up / 1.1 hip down), climb (taller, up) or jump (bigger drops) */
  traverse({ to, toY = null, speed = 'walk', ...o } = {}) { return this._push({ kind: 'traverse', to, toY, speed, o }); }
  /** a one-shot mocap clip in place (u = progress); dur defaults to the clip's own duration / rate */
  clip(name, { dur = null, rate = 1, face = null, fade = null } = {}) { return this._push({ kind: 'clip', name, dur, rate, face, fade }); }

  // ---------------------------------------------------------------------------------------------- build (fixed step)
  build() { this._simulate(); this._finalize(); return this; }

  _simulate() {
    this.S = []; this.warnings = []; this.segs = this._plan.map((q, i) => ({ ...q, _pi: i }));
    this._init = this._initBase ? { ...this._initBase, x: this._initBase.x + (this.shift0?.[0] || 0), z: this._initBase.z + (this.shift0?.[1] || 0) } : this._init; if (!this._initBase) this._initBase = { ...this._init };
    this.cur = { ...this._init };
    const S = this.S, c = this.cur; let t = this.t0; this._needSettle = false; this._tNow = t; let prevEnd = null, segStart = t, segFade = FADE;
    const G = this.G;
    const turnTo = (target, w, dt) => { const err = wrapPi(target - c.h); const acc = w * w * err - 2 * w * c.hv; c.hv += acc * dt; c.h += c.hv * dt; };
    const emit = (src, extra = {}) => {
      const tau = t - segStart; let sources = src;
      if (prevEnd && tau < segFade) { const s = smooth(tau / segFade); const ov = {}; for (const sd of ['cR', 'cL']) if (src[0][sd] !== undefined) ov[sd] = src[0][sd];   // explicit contacts win over the fading sources
        sources = [...prevEnd.map((q) => ({ ...q, w: q.w * (1 - s), ...ov })), ...src.map((q) => ({ ...q, w: q.w * s }))]; }
      S.push({ t, x: c.x, y: c.y, z: c.z, h: c.h, v: c.v, ph: c.ph, f: c.f || 0, src: sources, ...extra });
      t += DT; this._tNow = t;
    };
    // turn in place with steps: heading follows a smooth curve, the feet step in windows; locks use the pose at lkT (final heading)
    const turnSteps = (face, T) => {
      const h0 = c.h, d = wrapPi(face - h0), n = Math.max(1, Math.round(T / DT)); const lead = d > 0 ? 'R' : 'L', trail = lead === 'R' ? 'L' : 'R';
      const W = Math.abs(d) <= 100 * D2R ? [[lead, 0.04, 0.5, 1], [trail, 0.4, 0.96, 1]] : [[lead, 0.03, 0.37, 0.62], [trail, 0.3, 0.67, 1], [lead, 0.6, 0.97, 1]];
      const tS = t;
      for (let i = 0; i < n; i++) {
        const u = (i + 1) / n; c.h = h0 + d * smooth(u); c.hv = 0; c.v = 0; c.y = this.gnd(c.x, c.z);
        const q = { k: 'loco', v: 0, w: 1 }; const ex = {};
        for (const [sd, a, b, lk] of W) if (u >= a && u < b) { q['c' + sd] = 0; } else if (u >= b && u < b + 2 / n) { ex['lk' + sd] = tS + Math.min(lk * T, T - DT); }
        q.cR ??= 1; q.cL ??= 1; emit([q], ex);
      }
      return [{ k: 'loco', v: 0, w: 1 }];
    };
    const turnTime = (d) => 0.3 + 0.55 * Math.abs(d) / Math.PI;
    let last = null;
    for (let si = 0; si < this.segs.length; si++) {
      let seg = this.segs[si];
      if (seg.shift && seg.kind === 'move' && !seg._shifted) { seg.pts = seg.pts.map((p, k) => (k === seg.pts.length - 1 ? [p[0] + seg.shift[0], p[1] + seg.shift[1]] : p)); seg._shifted = true; }
      if (seg.shift && seg.kind === 'traverse' && !seg._shifted) { seg.to = [seg.to[0] + seg.shift[0], seg.to[1] + seg.shift[1]]; seg._shifted = true; }
      if (seg.kind === 'approach') {   // stand point at arm's reach in front of the target, on the line from the current position
        const tx = seg.at[0], tz = seg.at.length > 2 ? seg.at[2] : seg.at[1]; const fr = seg.from || [c.x, c.z]; const sh = seg.shift || [0, 0];
        const dx = tx - fr[0], dz = tz - fr[1], L = Math.hypot(dx, dz) || 1, r = seg.reach * this.H; const stand = [tx - dx / L * r + sh[0], tz - dz / L * r + sh[1]];
        const lead = [stand[0] - dx / L * 0.9 * this.H, stand[1] - dz / L * 0.9 * this.H];   // from = the approach direction: a straight lead-in to the stand point
        const pts = seg.from && Math.hypot(lead[0] - c.x, lead[1] - c.z) > 0.5 * this.H ? [lead, stand] : [stand]; const face = Math.atan2(tz - stand[1], tx - stand[0]);
        const mv = { kind: 'move', pts, speed: [[0, seg.speed]], accel: 300, decel: 260, jerk: 2600, stop: true, turn: 9, arriveAt: null, beats: null, autoTurn: true, fade: null, ...seg.o };
        const out = Math.hypot(stand[0] - c.x, stand[1] - c.z) > 1 ? [mv] : []; out.push({ kind: 'idle', dur: 0.3, face, until: null, steps: true, fade: null });
        for (const q of out) q._pi = seg._pi; this.segs.splice(si, 1, ...out); seg = this.segs[si];
      }
      if (seg.kind === 'traverse') {   // resolve by the height change now that the start height is known
        const r = this._resolveTraverse(seg, c); for (const q of r) q._pi = seg._pi; this.segs.splice(si, 1, ...r); seg = this.segs[si];
      }
      segStart = t; segFade = seg.fade ?? FADE; last = null; seg.t0 = t;
      if (seg.kind === 'idle' || seg.kind === 'clip') {
        const c0 = seg.kind === 'clip' ? this.clips[seg.name] : null; let dur = seg.until != null ? seg.until - t : (seg.dur ?? (c0 ? c0.dur / seg.rate : 1));
        if (dur < -1e-6) this.warnings.push(`${this.name} ${seg.kind} until ${seg.until?.toFixed(3)} already passed at ${t.toFixed(3)}`);
        dur = Math.max(0, dur);
        let turned = false;
        if (seg.kind === 'idle' && seg.face !== null && seg.steps !== false && Math.abs(wrapPi(seg.face - c.h)) > 35 * D2R && dur > 0.25) {
          const T = Math.min(dur, turnTime(wrapPi(seg.face - c.h))); last = turnSteps(seg.face, T); dur -= T; turned = true; this._needSettle = false; }
        const n = Math.round(dur / DT);
        // after a walking stop the feet are a stride apart: bring the trailing foot up, then square the front one (idle stance)
        let settle = null;
        if (seg.kind === 'idle' && this._needSettle && !turned && dur > 0.4) { this._needSettle = false; const fr = (((c.ph % 1) + 1) % 1); const front = fr < 0.5 ? 'R' : 'L', back = front === 'R' ? 'L' : 'R';
          settle = { [back]: [0.04, 0.3], [front]: [0.3, 0.52] }; }
        for (let i = 0; i < n; i++) { if (seg.face !== null) turnTo(seg.face, 8, DT); c.v = 0; c.y = this.gnd(c.x, c.z); const tau = i * DT;
          if (seg.kind === 'idle') { const q = { k: 'loco', v: 0, w: 1 }; if (settle) for (const sd of ['R', 'L']) q['c' + sd] = tau >= settle[sd][0] && tau < settle[sd][1] ? 0 : 1; last = [q]; }
          else last = [{ k: 'clip', c: seg.name, u: c0.loop ? (i * DT * seg.rate / c0.dur) % 1 : (i * DT * seg.rate) / c0.dur, w: 1 }];
          emit(last); }
        if (seg.kind === 'idle' && settle) last = [{ k: 'loco', v: 0, w: 1 }];
      } else if (seg.kind === 'step') {
        const x0 = c.x, z0 = c.z, h0 = c.h, [x1, z1] = seg.to, n = Math.max(2, Math.round(seg.dur / DT)), tS = t, T = n * DT;
        const dl = (x1 - x0) * -Math.sin(h0) + (z1 - z0) * Math.cos(h0), df = (x1 - x0) * Math.cos(h0) + (z1 - z0) * Math.sin(h0);   // lateral (+ right) / forward
        const lead = Math.abs(dl) > Math.abs(df) * 0.6 ? (dl > 0 ? 'R' : 'L') : (((((c.ph % 1) + 1) % 1) < 0.5) ? 'L' : 'R'), trail = lead === 'R' ? 'L' : 'R';
        const W = { [lead]: [0.02, 0.62], [trail]: seg.shuffle ? [0.5, 1.0] : null }; const dh = seg.face == null ? 0 : wrapPi(seg.face - h0);
        for (let i = 0; i < n; i++) { const u = (i + 1) / n, e = smooth(u); const px = c.x, pz = c.z; c.x = x0 + (x1 - x0) * e; c.z = z0 + (z1 - z0) * e; c.h = h0 + dh * e; c.hv = 0; c.y = this.gnd(c.x, c.z); c.v = 0;
          const q = { k: 'loco', v: 0, w: 1 }; const ex = {};
          for (const sd of ['R', 'L']) { const w = W[sd]; q['c' + sd] = w && u >= w[0] && u < w[1] ? 0 : 1; if (w && u >= w[1] && u < w[1] + 2 / n) ex['lk' + sd] = tS + T - DT; }
          emit([q], ex); }
        if (seg.shuffle) for (let i = 0; i < Math.round(0.12 / DT); i++) { c.y = this.gnd(c.x, c.z); emit([{ k: 'loco', v: 0, w: 1 }]); }
        this._needSettle = false; last = [{ k: 'loco', v: 0, w: 1 }];
      } else if (seg.kind === 'move') {
        last = this._move(seg, c, emit, turnTo, () => t, turnSteps, turnTime);
      } else if (seg.kind === 'jump') {
        last = this._jump(seg, c, emit, turnTo, () => t);
      } else if (seg.kind === 'climb') {
        last = this._climb(seg, c, emit, turnTo, () => t);
      }
      if (seg.kind === 'move') this._needSettle = !!seg.stop; else if (seg.kind !== 'idle') this._needSettle = false;
      if (seg.kind === 'jump' || seg.kind === 'clip' || seg.kind === 'climb') c.ph = toIdleParity(c.ph);   // feet in the idle stance: the next walk starts from it
      seg.t1 = t; this._lastY = c.y;
      prevEnd = last ? last.filter((q) => q.w > 1e-4) : prevEnd;
    }
    this.t1 = t;
  }

  /** traverse -> [approach move, hop | climb | jump, rest move] from the first height change on the straight line to `to` */
  _resolveTraverse(seg, c) {
    const H = this.H, [tx, tz] = seg.to, L = Math.hypot(tx - c.x, tz - c.z), ux = (tx - c.x) / (L || 1), uz = (tz - c.z) / (L || 1);
    const mv = (pt, o = {}) => ({ kind: 'move', pts: [pt], speed: [[0, seg.speed]], accel: 300, decel: 260, jerk: 2600, stop: true, turn: 9, arriveAt: null, beats: null, autoTurn: true, fade: null, ...o });
    const g = (s) => this.gnd(c.x + ux * s, c.z + uz * s);
    let e = -1; const y0 = c.y; for (let s = 0.5; s <= L; s += 0.5) if (Math.abs(g(s) - y0) > 0.3 * H) { e = s; break; }
    const yT = seg.toY ?? this.gnd(tx, tz);
    if (e < 0) return [mv(seg.to, seg.o)];                                   // flat (or a gentle slope): walk it, the feet follow the ground
    const dy = g(e + 1) - y0, pt = (s) => [c.x + ux * s, c.z + uz * s], out = [];
    let land = Math.min(L, e + (dy > 0 ? 0.45 : 0.6) * H);                  // landing spot just past the edge
    if (dy > 0.85 * H) {                                                    // climb: stop ~0.45 hip heights from the lip
      const ap = e - 0.55 * H; if (ap > 0.25 * H) out.push(mv(pt(ap)));
      out.push({ kind: 'climb', to: pt(Math.min(L, e + 0.5 * H)), toY: null, edge: pt(e), landAt: seg.o.landAt ?? null });
      land = Math.min(L, e + 0.5 * H);
    } else {
      const take = e - (dy > 0 ? 0.5 : 0.3) * H; if (take > 0.25 * H) out.push(mv(pt(take)));
      out.push({ kind: 'jump', to: pt(land), toY: null, style: dy > -1.1 * H ? 'hop' : 'jump', crouch: null, air: null, apex: null, landAt: seg.o.landAt ?? null, recover: null, settle: true, fade: null });
    }
    if (L - land > 0.3 * H) out.push({ kind: 'traverse', to: seg.to, toY: seg.toY, speed: seg.speed, o: { ...seg.o, landAt: null } });   // the rest (more edges are resolved in turn)
    return out;
  }
  /** move segment: jerk-limited speed profile along the spline, cadence-driven phase, ground-smoothed root height */
  _move(seg, c, emit, turnTo, now, turnSteps, turnTime) {
    const P = new Path([[c.x, c.z], ...seg.pts]);
    const p0 = P.at(0.5); const d0 = wrapPi(Math.atan2(p0.tz, p0.tx) - c.h);
    if (seg.autoTurn && c.v < 1 && Math.abs(d0) > 60 * D2R) turnSteps(Math.atan2(p0.tz, p0.tx), turnTime(d0));
    const G = this.G, H = this.H;
    const tA = now();
    const sim = (m, out) => {   // m = speed scale; returns duration (and emits if out)
      let s = 0, v = c.v, a = c.a || 0, tau = 0; const keys = seg.speed.map(([k, b]) => [k, this.speedOf(b) * m]);
      for (let i = 0; i < 240 * 90; i++) {
        tau = i * DT; let target = keys[0][1]; for (const [k, b] of keys) if (tau >= k) target = b;
        if (this.gov.length) target *= this.govern(tA + tau);
        const rem = Math.max(0, P.length - s); const vBrake = seg.stop ? Math.sqrt(2 * seg.decel * rem) : Infinity;
        if (seg.stop) target = Math.min(target, Math.sqrt(2 * seg.decel * 0.8 * rem));
        const aDes = clamp((target - v) * 6, -seg.decel, seg.accel); a += clamp(aDes - a, -seg.jerk * DT, seg.jerk * DT);
        let vn = Math.max(0, v + a * DT); if (vn > vBrake) { vn = vBrake; a = (vn - v) / DT; } v = vn;
        s = Math.min(P.length, s + v * DT);
        if (out) out(s, v, a);
        if (seg.stop && P.length - s < 0.02) return { dur: tau + DT, v: 0, a: 0 };
        if (!seg.stop && s >= P.length) return { dur: tau + DT, v, a };
      }
      return { dur: tau, v, a };
    };
    let m = 1;
    if (seg.arriveAt != null) {   // bisection on the speed scale so the move ends at arriveAt
      const want = seg.arriveAt - now(); let lo = 0.15, hi = 6;
      if (sim(hi).dur > want || sim(lo).dur < want) this.warnings.push(`${this.name} move arriveAt ${seg.arriveAt.toFixed(3)} not reachable (start ${now().toFixed(3)})`);
      for (let k = 0; k < 40; k++) { const mid = Math.sqrt(lo * hi); if (sim(mid).dur > want) lo = mid; else hi = mid; }
      m = Math.sqrt(lo * hi);
    }
    const i0 = this.S.length; const gy = (s) => {   // root height: the ground averaged over a window along the path (stairs, steps)
      const w = Math.min(0.5 * H, s, P.length - s); if (w < 0.5) { const p = P.at(s); return this.gnd(p.x, p.z); }
      let acc = 0, W = 0; for (let k = -3; k <= 3; k++) { const p = P.at(s + w * k / 3), wt = 4 - Math.abs(k); acc += wt * this.gnd(p.x, p.z); W += wt; } return acc / W; };
    const res = sim(m, (s, v, a) => {
      const p = P.at(s); c.x = p.x; c.z = p.z; c.y = gy(s); c.v = v; c.a = a;
      turnTo(Math.atan2(p.tz, p.tx), seg.turn, DT);
      const gi = gaitInfo(this.G, v); c.f = gi.f; if (v > 1e-4) c.ph += gi.f * DT;
      emit([{ k: 'loco', v, w: 1 }]);
    });
    c.v = res.v; c.a = res.a;
    const S = this.S, n = S.length - i0;
    if (seg.beats && this.timing && n > 4) this._lockBeats(S, i0, seg.beats);
    if (seg.stop) {   // stride warp: end the stop in double support (both feet planted), spread over the last 0.8 s
      const ph = c.ph = S[S.length - 1].ph; let best = null;
      for (let k = Math.floor(ph * 2) - 1; k <= Math.floor(ph * 2) + 2; k++) { const cand = k / 2 + DS_PHASE; if (best === null || Math.abs(cand - ph) < Math.abs(best - ph)) best = cand; }
      const delta = best - ph, mm = Math.min(n, Math.round(0.8 / DT));
      for (let j = 0; j < mm; j++) { const r = S[S.length - mm + j]; r.ph += delta * smooth((j + 1) / mm); }
      c.ph = best; c.v = 0; c.a = 0; S[S.length - 1].v = 0; return [{ k: 'loco', v: 0, w: 1 }];
    }
    c.ph = S[S.length - 1].ph;
    return [{ k: 'loco', v: c.v, w: 1 }];
  }
  /** footfalls on the beat grid: blend the natural phase into ph = c0 + (r / 2) * beatAt(t) (r steps per beat) */
  _lockBeats(S, i0, opt) {
    const T = this.timing, n = S.length - i0; const o = typeof opt === 'object' ? opt : {};
    let vmax = 0; for (let i = i0; i < S.length; i++) vmax = Math.max(vmax, S[i].v);
    const cruise = []; for (let i = i0; i < S.length; i++) if (S[i].v > 0.85 * vmax) cruise.push(i);
    if (!cruise.length) return;
    const fNat = cruise.reduce((m, i) => m + S[i].f, 0) / cruise.length, bps = 1 / T.beatLen(S[cruise[cruise.length >> 1]].t);
    let r = o.every ? 1 / o.every : [0.5, 1, 2].reduce((b, x) => (Math.abs(Math.log(2 * fNat / (x * bps))) < Math.abs(Math.log(2 * fNat / (b * bps))) ? x : b), 1);
    const lockAt = (i) => (r / 2) * T.beatAt(S[i].t);
    let off = 0; for (const i of cruise) off += S[i].ph - lockAt(i); off /= cruise.length;
    const c0 = Math.round(off * 2) / 2;   // strikes (ph = k / 2) exactly on beats
    const tA = S[cruise[0]].t, tB = S[cruise[cruise.length - 1]].t;
    for (let i = i0; i < S.length; i++) { const r2 = S[i]; const w = smooth((r2.t - (S[i0].t)) / Math.max(0.3, tA - S[i0].t)) * (1 - smooth((r2.t - tB) / 0.6));
      const lk = c0 + lockAt(i); r2.ph += (lk - r2.ph) * w; }
    for (let i = i0 + 1; i < S.length - 1; i++) S[i].f = Math.max(0, (S[i + 1].ph - S[i - 1].ph) / (2 * DT));
    this.beatLock = { r, c0 };
  }

  /** jump / hop: anticipation crouch, push-off, ballistic arc (one gravity), short squash scaled by the impact, quick recovery */
  _jump(seg, c, emit, turnTo, now) {
    const x0 = c.x, z0 = c.z, y0 = c.y, [x1, z1] = seg.to, y1 = seg.toY ?? this.gnd(x1, z1), H = this.H;
    const dist = Math.hypot(x1 - x0, z1 - z0); const face = Math.atan2(z1 - z0, x1 - x0);
    const style = seg.style === 'auto' ? (Math.abs(y1 - y0) < 0.85 * H && dist < 2.2 * H ? 'hop' : 'jump') : seg.style;
    const hop = style === 'hop';
    const down = y1 < y0 - 0.3 * H;   // stepping / jumping off a ledge: a small push, most of the arc is the fall
    const crouch = seg.crouch ?? (down ? 0.12 : hop ? 0.13 : 0.24), depth = down ? 0.3 : hop ? 0.5 : 0.85;
    let T = seg.air; if (!T) { const apex = seg.apex ?? (down ? Math.max(3, 0.08 * H + 0.03 * dist) : hop ? Math.max(3, 0.12 * H + 0.04 * dist) : Math.max(0.35 * H, 0.18 * dist)); const top = Math.max(y0, y1) + apex; T = Math.sqrt(2 * (top - y0) / GRAVITY) + Math.sqrt(2 * (top - y1) / GRAVITY); }
    const v0 = (y1 - y0) / T + GRAVITY * T / 2, vImp = Math.abs(v0 - GRAVITY * T);
    const JS = this.clips.jump_start, JL = this.clips.jump_land, JP = this.clips.jump_loop;
    const tPush = hop ? 0.06 : 0.075, uA0 = 0.8 / JL.dur, uA1 = 0.8 / JL.dur + (0.1 / JL.dur - 0.8 / JL.dur) * depth;   // anticipation = the landing recovery reversed (stand -> crouch)
    if (seg.landAt != null) {   // wait so the touchdown lands on landAt
      const wait = seg.landAt - (now() + crouch + tPush + T);
      if (wait < -1e-3) this.warnings.push(`${this.name} jump landAt ${seg.landAt.toFixed(3)} missed by ${(-wait).toFixed(3)} s`);
      const nW = Math.round(Math.max(0, wait) / DT); for (let i = 0; i < nW; i++) { turnTo(face, 10, DT); c.v = 0; emit([{ k: 'loco', v: 0, w: 1 }]); }
    }
    const nA = Math.round(crouch / DT), nP = Math.round(tPush / DT), nAir = Math.max(1, Math.round(T / DT));
    for (let i = 0; i < nA; i++) { turnTo(face, 16, DT); c.v = 0; const a = smooth((i + 1) / nA); emit([{ k: 'clip', c: 'jump_land', u: uA0 + (uA1 - uA0) * a, w: 1, cR: 1, cL: 1 }]); }
    for (let i = 0; i < nP; i++) { turnTo(face, 16, DT); emit([{ k: 'clip', c: 'jump_start', u: (0.075 * (i + 1) / nP) / JS.dur, w: 1, cR: 1, cL: 1 }], { push: 1 }); }
    const loopIn = hop ? [0.05, 0.1] : [0.22, 0.2], landIn = hop ? 0.09 : 0.12;
    for (let i = 0; i < nAir; i++) {
      const tau = (i + 1) * DT * (T / (nAir * DT)); const a = tau / T; turnTo(face, 16, DT);
      c.x = x0 + (x1 - x0) * a; c.z = z0 + (z1 - z0) * a; c.y = y0 + v0 * tau - GRAVITY * tau * tau / 2; c.v = dist / T;
      const uS = (0.075 + tau) / JS.dur, wLoop = smooth((tau - loopIn[0]) / loopIn[1]), wLand = smooth((tau - (T - landIn)) / (landIn * 0.8));
      emit([{ k: 'clip', c: 'jump_start', u: uS, w: (1 - wLoop) * (1 - wLand), cR: 0, cL: 0 }, { k: 'clip', c: 'jump_loop', u: (tau / JP.dur) % 1, w: wLoop * (1 - wLand), cR: 0, cL: 0 },
        { k: 'clip', c: 'jump_land', u: 0, w: wLand, cR: 0, cL: 0 }], { air: 1 });
    }
    c.x = x1; c.z = z1; c.y = y1; c.v = 0; c.hv = 0;
    seg.touch = now();
    // landing: Jump_Land time-compressed (crouch peak at 0.08-0.1 s instead of 0.2, recovered by ~0.42 s), its weight = squash depth
    const d = clamp(0.08 + vImp / 450, 0.24, 1), tPk = 0.07 + 0.05 * d, tRec = (seg.recover ?? (0.3 + 0.35 * d)), uPk = 0.16, uRec = 0.6;
    const uOf = (tau) => (tau < tPk ? uPk * (tau / tPk) : uPk + (uRec - uPk) * (1 - Math.pow(1 - Math.min(1, (tau - tPk) / (tRec - tPk)), 2)));
    const settle = seg.settle === false ? null : { R: [tRec * 0.62, tRec * 0.62 + 0.15], L: [tRec * 0.62 + 0.11, tRec * 0.62 + 0.26] };
    const nR = Math.round((tRec + 0.3) / DT);
    const inW = (tau, w) => (w && tau >= w[0] && tau < w[1] ? 0 : 1);
    let last;
    for (let i = 0; i < nR; i++) { const tau = i * DT; const wI = smooth((tau - tRec * 0.55) / (tRec * 0.55)); const cR = inW(tau, settle?.R), cL = inW(tau, settle?.L);
      last = [{ k: 'clip', c: 'jump_land', u: uOf(tau), w: d * (1 - wI), cR, cL }, { k: 'loco', v: 0, w: 1 - d * (1 - wI), cR, cL }]; emit(last, { land: tau }); }
    return [{ k: 'loco', v: 0, w: 1 }];
  }

  /** climb / mantle: approach crouch, spring up to hang the hands on the edge, pull and press, knee up, stand up on top */
  _climb(seg, c, emit, turnTo, now) {
    const x0 = c.x, z0 = c.z, y0 = c.y, [x1, z1] = seg.to, y1 = seg.toY ?? this.gnd(x1, z1), H = this.H, dy = y1 - y0;
    const face = Math.atan2(z1 - z0, x1 - x0), fx = Math.cos(face), fz = Math.sin(face);
    let ex, ez; if (seg.edge) [ex, ez] = seg.edge; else {   // the lip: first point toward `to` where the ground rises past half the height
      let s = 0; const L = Math.hypot(x1 - x0, z1 - z0); for (; s < L; s += 0.5) if (this.gnd(x0 + fx * s, z0 + fz * s) > y0 + dy * 0.5) break; ex = x0 + fx * s; ez = z0 + fz * s; }
    const dEdge = (ex - x0) * fx + (ez - z0) * fz;   // distance to the lip along the facing
    const MC = this.clips.mantle; const dur = MC.dur * clamp(0.85 + 0.3 * dy / H, 0.9, 1.5);
    const sx = -fz, sz = fx, hw = 0.24 * H;           // hand spread (sideways)
    // root keys (u: progress): x along facing from the start, y above y0. Hands go on the lip from 0.28 to 0.7.
    const reach = dEdge - 0.3 * H;                   // the start of the climb: about an arm's length from the wall
    const K = [[0, 0, 0], [0.12, 0, -0.18 * H], [0.3, reach, Math.max(0, dy - 1.2 * H)], [0.45, dEdge - 0.22 * H, dy - 0.8 * H], [0.53, dEdge - 0.17 * H, dy - 0.76 * H], [0.6, dEdge - 0.08 * H, dy - 0.74 * H], [0.68, dEdge - 0.01 * H, dy - 0.5 * H], [0.8, dEdge + 0.3 * H, dy - 0.05 * H], [1, Math.max(dEdge + 0.45 * H, (x1 - x0) * fx + (z1 - z0) * fz), dy]];
    if (dEdge > 0.75 * H) this.warnings.push(`${this.name} climb starts ${(dEdge / H).toFixed(2)} hip heights from the lip (stop ~0.45 away; traverse() does)`);
    const keyAt = (u) => { for (let i = 0; i < K.length - 1; i++) if (u <= K[i + 1][0]) { const a = (u - K[i][0]) / (K[i + 1][0] - K[i][0]), s = smooth(a); return [K[i][1] + (K[i + 1][1] - K[i][1]) * s, K[i][2] + (K[i + 1][2] - K[i][2]) * s]; } return [K[K.length - 1][1], K[K.length - 1][2]]; };
    if (seg.landAt != null) { const wait = seg.landAt - (now() + dur); if (wait < -1e-3) this.warnings.push(`${this.name} climb landAt missed by ${(-wait).toFixed(3)} s`); const nW = Math.round(Math.max(0, wait) / DT); for (let i = 0; i < nW; i++) { turnTo(face, 10, DT); c.v = 0; emit([{ k: 'loco', v: 0, w: 1 }]); } }
    const n = Math.round(dur / DT); const lipY = y0 + dy;
    const hand = (sg) => [ex + sx * hw * sg - fx * 0.02 * H, lipY + 0.6, ez + sz * hw * sg - fz * 0.02 * H];
    for (let i = 0; i < n; i++) {
      const u = (i + 1) / n; turnTo(face, 16, DT); const [ax, ay] = keyAt(u); const px = c.x, pz = c.z;
      c.x = x0 + fx * ax; c.z = z0 + fz * ax; c.y = y0 + ay; c.v = Math.hypot(c.x - px, c.z - pz) / DT;
      const hw2 = smooth((u - 0.17) / 0.1) * (1 - smooth((u - 0.57) / 0.08));
      const cR = u < 0.14 || u >= 0.6 ? 1 : 0, cL = u < 0.14 || u >= 0.86 ? 1 : 0;
      emit([{ k: 'clip', c: 'mantle', u, w: 1, cR, cL }], { hR: [...hand(1), hw2], hL: [...hand(-1), hw2], air: u >= 0.14 && u < 0.6 ? 1 : 0, climb: 1 });
    }
    c.x = x0 + fx * K[K.length - 1][1]; c.z = z0 + fz * K[K.length - 1][1]; c.y = y1; c.v = 0;
    const nR = Math.round(0.35 / DT); let last;
    for (let i = 0; i < nR; i++) { last = [{ k: 'loco', v: 0, w: 1 }]; emit(last); }
    return last;
  }

  // ---------------------------------------------------------------------------------------------- finalize (lean, contacts)
  _finalize() {
    const S = this.S, n = S.length; if (!n) throw new Error('empty MotionTrack');
    // acceleration (central differences over 0.06 s), then an underdamped 2nd-order response: the body leans into
    // acceleration / turns and sways back past upright for a beat after a stop (momentum), deterministic over the table
    const k = Math.round(0.06 / DT);
    for (let i = 0; i < n; i++) {
      const a = S[Math.max(0, i - k)], b = S[i], d = S[Math.min(n - 1, i + k)], h = k * DT; const air = b.air || a.air || d.air || b.climb;
      b.ax = air ? 0 : (d.x - 2 * b.x + a.x) / (h * h); b.az = air ? 0 : (d.z - 2 * b.z + a.z) / (h * h);
    }
    const w = 2 * Math.PI * 1.7, z = 0.62; let yx = 0, yz = 0, vx = 0, vz = 0;
    for (let i = 0; i < n; i++) { const r = S[i]; vx += (w * w * (r.ax - yx) - 2 * z * w * vx) * DT; vz += (w * w * (r.az - yz) - 2 * z * w * vz) * DT; yx += vx * DT; yz += vz * DT; r.ax = yx; r.az = yz; }
    // locomotion contact = a strike-gated state machine per foot (strike at phase 0 (R) / 0.5 (L), stance = the blended duty)
    for (const sd of ['R', 'L']) {
      let on = true, prevLp = null, lx = S[0].x, lz = S[0].z; const side = (sd === 'R' ? 1 : -1) * 6.3 * this.unit, reach = 0.62 * this.H;
      for (const r of S) {
        const v = r.src.reduce((m, q) => (q.k === 'loco' ? Math.max(m, q.v) : m), 0); const gi = gaitInfo(this.G, v, r.f > 0 && v > 1e-4 ? r.f : null);
        const strike = sd === 'R' ? 0 : 0.5, dur = gi.duty, travel = dur * gi.stride;
        const lp = (((r.ph - strike) % 1) + 1) % 1;   // 0 at the strike
        if (gi.w.idle > 0.85) on = true;
        else if (prevLp !== null && lp < prevLp - 0.5) {   // wrapped past the strike: the foot lands about half a stance ahead
          on = true; const ch = Math.cos(r.h), sh = Math.sin(r.h); lx = r.x + ch * travel * 0.5 - sh * side; lz = r.z + sh * travel * 0.5 + ch * side; }
        else if (lp >= dur || (on && Math.hypot(r.x - lx, r.z - lz) > reach)) on = false;   // toe-off, or the hip has left the foot out of reach
        prevLp = lp; r['l' + sd] = on ? 1 : 0;
      }
    }
    for (const r of S) { r.cR = this._contact(r, 'R'); r.cL = this._contact(r, 'L'); }
    this.contacts = { R: [], L: [] };
    for (const sd of ['R', 'L']) { let a = -1; for (let i = 0; i <= n; i++) { const on = i < n && S[i]['c' + sd]; if (on && a < 0) a = i; if (!on && a >= 0) {
      let lk = null; for (let j = a; j < Math.min(n, a + 3); j++) if (S[j]['lk' + sd] != null) lk = S[j]['lk' + sd];
      this.contacts[sd].push({ i0: a, i1: i, t0: S[a].t, t1: i < n ? S[i].t : this.t1, lockT: lk ?? S[a].t }); a = -1; } } }
    this.built = true; return this;
  }
  /** blended contact for a sample's sources */
  _contact(r, sd) {
    let c = 0, W = 0;
    for (const q of r.src) {
      if (q.w <= 0) continue; W += q.w;
      if (q['c' + sd] !== undefined) { c += q.w * q['c' + sd]; continue; }
      if (q.k === 'clip') { c += q.w * (clipContact(this.clips[q.c], q.u, sd) ? 1 : 0); continue; }
      c += q.w * (q.v <= 1e-6 ? 1 : r['l' + sd]);
    }
    return W > 0 && c / W > 0.5 ? 1 : 0;
  }

  /** state at song time t (interpolated between fixed-step samples; sources from the lower sample, params interpolated) */
  state(t) {
    const S = this.S, n = S.length; const f = Math.min(n - 1, Math.max(0, (t - this.t0) / DT)); const i = Math.min(n - 2, Math.floor(f)), a = n > 1 ? Math.max(0, Math.min(1, f - i)) : 0;
    const A = S[Math.max(0, i)], B = S[Math.min(n - 1, i + 1)]; const L = (k) => (A[k] ?? 0) + ((B[k] ?? 0) - (A[k] ?? 0)) * a;
    const same = A.src.length === B.src.length && A.src.every((q, j) => q.k === B.src[j].k && q.c === B.src[j].c);
    const src = A.src.map((q, j) => { if (!same) return q; const r = B.src[j]; const o = { ...q, w: q.w + (r.w - q.w) * a };
      if (q.u !== undefined) { let du = r.u - q.u; if (this.clips[q.c].loop) du -= Math.round(du); o.u = q.u + du * a; } if (q.v !== undefined) o.v = q.v + (r.v - q.v) * a; return o; });
    const tt = Math.max(this.t0, Math.min(t, this.t1));
    const hv = (k) => (A[k] && B[k] ? A[k].map((x, j) => x + (B[k][j] - x) * a) : A[k] || null);
    return { t: tt, x: L('x'), y: L('y'), z: L('z'), h: A.h + wrapPi(B.h - A.h) * a, v: L('v'), ph: L('ph'), f: L('f'), ax: L('ax'), az: L('az'), src, air: !!A.air, idx: f, hR: hv('hR'), hL: hv('hL'), land: A.land };
  }
  /** the contact interval of foot sd containing time t, else the previous / next ones: { cur, prev, next } */
  contactAt(sd, t) {
    const C = this.contacts[sd]; let prev = null, next = null, cur = null;
    for (const iv of C) { if (t >= iv.t0 && t < iv.t1) cur = iv; else if (iv.t1 <= t) prev = iv; else if (iv.t0 > t && !next) next = iv; }
    if (t >= this.t1 && C.length && C[C.length - 1].t1 >= this.t1 - DT) cur = C[C.length - 1];
    return { cur, prev, next };
  }
  /** footfall (strike) times of foot sd ('R' | 'L' | null = both), song time */
  footfalls(sd = null) { const out = []; for (const s of sd ? [sd] : ['R', 'L']) for (const iv of this.contacts[s]) out.push({ t: iv.t0, foot: s }); return out.sort((a, b) => a.t - b.t); }
  /** final position / heading (after build) */
  end() { const r = this.S[this.S.length - 1]; return { x: r.x, y: r.y, z: r.z, h: r.h, t: this.t1 }; }
}
