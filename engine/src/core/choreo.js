// Choreography: deterministic movement tracks for actors (pure functions of t; no simulation state).
//
//   const tr = new Track({ x: 40, y: 60, anim: 'idle' })
//     .run(T.beat(2), T.beat(4), 120)                       // run to x=120, arriving exactly on beat 4
//     .jump(T.beat(4), T.beat(5), 180, 90, { apex: 30 })     // jump arc landing on beat 5 at (180, 90)
//     .hold(T.beat(5), T.beat(6), { anim: 'victory' })
//     .fall(T.beat(6), T.beat(6.5), 20)                     // drop straight down to y=20 (gravity curve)
//     .path(t0, t1, (u) => [x, y], { anim })                 // anything custom
//   const s = tr.at(t)   -> { x, y, anim, t (anim time), frame (or undefined), facing, air, vy, landed (time since last landing) }
//   actor.set(s)
//
// Run cycles are stride-locked by default (frame from distance travelled, so feet don't skate);
// pass { cycle: 'beat', per: 6 } to lock a 6-frame cycle to the beat grid (two footfalls per beat).
// Ground-following: run(..., { ground: (x) => y }) keeps feet on a surface function while running.
import * as T from '../show/timing.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
export class Track {
  constructor(start = {}) {
    this.start = { x: 0, y: 0, anim: 'idle', facing: 1, ...start };
    this.segs = []; this.cur = { ...this.start }; this.landings = [];
  }
  _push(seg) { seg.from = { ...this.cur }; this.segs.push(seg); this.cur = { ...this.cur, ...seg.to }; return this; }
  hold(t0, t1, o = {}) { return this._push({ type: 'hold', t0, t1, o, to: { anim: o.anim ?? this.cur.anim, facing: o.facing ?? this.cur.facing, ...(o.y !== undefined ? { y: o.y } : {}), ...(o.x !== undefined ? { x: o.x } : {}) } }); }
  run(t0, t1, x1, o = {}) {
    const facing = x1 >= this.cur.x ? 1 : -1;
    return this._push({ type: 'run', t0, t1, o, to: { x: x1, y: o.ground ? o.ground(x1) : (o.y ?? this.cur.y), anim: o.after ?? (o.anim ?? 'run'), facing } });
  }
  jump(t0, t1, x1, y1, o = {}) {
    this.landings.push(t1);
    return this._push({ type: 'jump', t0, t1, o, to: { x: x1, y: y1, anim: o.land ?? 'run', facing: x1 >= this.cur.x ? 1 : -1 } });
  }
  fall(t0, t1, y1, o = {}) { this.landings.push(t1); return this._push({ type: 'fall', t0, t1, o, to: { y: y1, x: o.x ?? this.cur.x, anim: o.land ?? this.cur.anim } }); }
  path(t0, t1, fn, o = {}) { const end = fn(1, t1); return this._push({ type: 'path', t0, t1, fn, o, to: { x: end[0], y: end[1], anim: o.after ?? o.anim ?? this.cur.anim } }); }
  /** teleport/set state at t0 (e.g. off-screen re-entry) */
  set(t0, s) { return this._push({ type: 'set', t0, t1: t0, o: {}, to: s }); }

  at(t) {
    let st = { ...this.start, t: t, frame: undefined, air: false, vy: 0 };
    let landed = 1e9, lastEnd = this.segs.length ? -1e9 : 0;
    for (const L of this.landings) if (t >= L) landed = Math.min(landed, t - L);
    for (const s of this.segs) {
      if (t < s.t0) break;
      const done = t >= s.t1;
      const u = s.t1 > s.t0 ? clamp01((t - s.t0) / (s.t1 - s.t0)) : 1;
      const f = s.from, o = s.o;
      if (done) { lastEnd = s.t1; st = { ...st, ...f, ...s.to }; if (s.type === 'run' || s.type === 'jump') st.anim = s.to.anim; st.air = false; continue; }
      // active segment
      if (s.type === 'hold') { st = { ...st, ...f, anim: s.to.anim, facing: s.to.facing, t: t - s.t0 + (o.phase || 0) }; if (o.frame !== undefined) st.frame = o.frame; }
      else if (s.type === 'run') {
        const e = o.ease ? o.ease(u) : u;
        const x = f.x + (s.to.x - f.x) * e;
        const y = o.ground ? o.ground(x) : f.y + (s.to.y - f.y) * e;
        st = { ...st, x, y, anim: o.anim ?? 'run', facing: s.to.facing };
        if (o.cycle === 'beat') st.frame = Math.floor(T.beatAt(t) * (o.per || 6) * (o.mult || 1) + (o.phase || 0));
        else if (o.cycle === 'time') st.t = t - s.t0;
        else st.frame = Math.floor(Math.abs(x - (o.x0 ?? 0)) / (o.stride || 7) + (o.phase || 0));
      } else if (s.type === 'jump') {
        const e = o.ease ? o.ease(u) : u;
        const x = f.x + (s.to.x - f.x) * e;
        const top = Math.max(f.y, s.to.y) + (o.apex ?? 24);
        // parabola through (0,y0), (1,y1) with peak ~ top
        const c = 4 * (top - (f.y + s.to.y) / 2);
        const y = f.y + (s.to.y - f.y) * u + c * u * (1 - u) * (o.flat ? 0 : 1);
        const vy = (s.to.y - f.y) + c * (1 - 2 * u);
        st = { ...st, x, y, anim: o.anim ?? 'jump', facing: s.to.facing, air: true, vy, frame: o.frame ?? (vy > 0 ? 0 : 1) };
      } else if (s.type === 'fall') {
        const y = f.y + (s.to.y - f.y) * (u * u);
        st = { ...st, x: f.x + ((s.to.x ?? f.x) - f.x) * u, y, anim: o.anim ?? 'jump', air: true, vy: -1, frame: o.frame ?? 1 };
      } else if (s.type === 'path') {
        const res = s.fn(o.ease ? o.ease(u) : u, t); const [x, y] = res;   // fn may return [x, y, anim, frame, air]
        st = { ...st, x, y, anim: res[2] ?? o.anim ?? f.anim, air: res[4] ?? !!o.air, t: t - s.t0 };
        if (res[3] !== undefined) st.frame = res[3];
        if (o.frame !== undefined) st.frame = typeof o.frame === 'function' ? o.frame(u, t) : o.frame;
        if (o.facing !== undefined) st.facing = o.facing;
      }
      return { ...st, landed };
    }
    if (st.anim === 'run' || st.anim === 'run_pencil') st.frame = st.frame ?? 0;
    return { ...st, t: t - (lastEnd > -1e8 ? lastEnd : 0), landed };
  }
}

/** jump helper: the apex height that makes an arc of duration d look like gravity g (px/s^2) */
export const apexFor = (d, g = 900) => (g * d * d) / 8;

/** Box-filtered follow: average of fn(t + k*dt) over a window (pure, deterministic camera smoothing). */
export function smoothFollow(fn, t, win = 0.3, n = 9) {
  let sx = 0, sy = 0;
  for (let k = 0; k < n; k++) { const tt = t - win / 2 + (win * k) / (n - 1); const [x, y] = fn(tt); sx += x; sy += y; }
  return [sx / n, sy / n];
}
