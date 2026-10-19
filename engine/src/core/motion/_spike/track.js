// MotionTrack: deterministic locomotion / action timeline for one hero. Built ONCE in setup (fixed-step simulation at
// 240 Hz from the track start), then queried as a pure function of song time t: state(t) -> root position, facing, lean,
// weighted animation sources (gait blend by speed with a distance-driven cycle phase, or mocap one-shots) and foot contacts.
//
//   const tr = new MotionTrack(clips, { t0, pos: [x, z], heading: 0, unit: fig.unit, ground: (x, z) => 0 })
//     .idle(0.4)
//     .move([[x, z], ...], { speed: [[0, 'walk'], [1.5, 'jog']], accel: 160, decel: 220 })   // spline path, brakes to a stop at its end
//     .idle(0.3, { face: angle })
//     .jump({ to: [x, z], air: 0.55 })                                                     // anticipation, push-off, ballistic arc, land
//     .clip('yes', { dur: 1.2 })                                                           // a one-shot in place
//     .build();
//   tr.state(t)  (see MotionFigure.apply for the consumer)
import { Path } from './path.js';
import { clipContact } from './clips.js';

export const DT = 1 / 240;
/** one gravity for every jump (world units / s^2; the heroes are ~68 units tall at figscale 1.3) */
export const GRAVITY = 900;
export const FADE = 0.2;
const GAITS = ['walk', 'jog', 'run'];
const DS_PHASE = 0.07;      // double-support phases (k / 2 + 0.07: one foot just struck, the other not lifted yet): stops land here
const IDLE_PHASE = 0.57;    // the idle / landing stance is left-foot-forward = the walk at 0.57 (left just struck, right about to lift)
const toIdleParity = (ph) => Math.ceil(ph - IDLE_PHASE - 1e-9) + IDLE_PHASE;
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/** gait weights for a ground speed v (world u/s): { idle, walk, jog, run } (linear blend between the clips' natural speeds) */
export function gaitWeights(G, v) {
  const w = { idle: 0, walk: 0, jog: 0, run: 0 };
  if (v <= 1e-6) { w.idle = 1; return w; }
  const sp = [['idle', 0], ...GAITS.map((g) => [g, G[g].v])];
  if (v >= sp[sp.length - 1][1]) { w[sp[sp.length - 1][0]] = 1; return w; }
  for (let i = 0; i < sp.length - 1; i++) if (v < sp[i + 1][1]) { const a = (v - sp[i][1]) / (sp[i + 1][1] - sp[i][1]); w[sp[i][0]] = 1 - a; w[sp[i + 1][0]] = a; break; }
  return w;
}

export class MotionTrack {
  /** clips: loadMotionClips() result; opts: { t0, pos: [x, z], heading (rad; facing (cos h, sin h) in x/z), unit (world per design unit), ground(x, z) } */
  constructor(clips, { t0 = 0, pos = [0, 0], heading = 0, unit = 0.702, ground = () => 0, gaits = {} } = {}) {
    this.clips = clips.clips; this.t0 = t0; this.unit = unit; this.ground = ground;
    this.G = {}; for (const g of GAITS) { const c = this.clips[gaits[g] || g]; const len = (sd) => c.contacts[sd].reduce((m, x) => Math.max(m, x[1] - x[0]), 0);
      this.G[g] = { clip: c, v: c.speed * unit, stride: c.stride * unit, duty: (len('R') + len('L')) / 2 }; }
    this.cur = { x: pos[0], z: pos[1], y: ground(pos[0], pos[1]), h: heading, hv: 0, ph: IDLE_PHASE, v: 0 };
    this.segs = []; this.S = []; this.built = false;
  }
  /** cycle length (world units) at speed v, consistent with the blended pose: stance sweeps blend by weight, so the stride is the
   *  stance-duration-weighted mean (idle counts as all-stance, zero stride), i.e. between gaits the cadence rises, not the stride */
  stride(v) { const w = gaitWeights(this.G, v); let num = 0, den = w.idle; for (const g of GAITS) if (w[g] > 0) { const d = this.G[g].duty; num += w[g] * d * this.G[g].stride; den += w[g] * d; } return den > 0 ? num / den : 0; }
  speedOf(x) { return typeof x === 'number' ? x : this.G[x].v; }

  _push(seg) { this.segs.push(seg); return this; }
  /** stand for dur seconds; face: heading to turn toward (damped) */
  idle(dur, { face = null } = {}) { return this._push({ kind: 'idle', dur, face }); }
  /** follow a spline through pts (starting from the current position) with a target-speed profile [[tau, speed], ...] */
  move(pts, { speed = [[0, 'walk']], accel = 160, decel = 220, stop = true, turn = 9 } = {}) { return this._push({ kind: 'move', pts, speed, accel, decel, stop, turn }); }
  /** jump to [x, z] (landing height = ground there unless toY): crouch (s), air (s) or apex (units above the higher end) */
  /** settle: per-foot step windows (s after touchdown) during the recovery, or false */
  jump({ to, toY = null, crouch = 0.3, air = null, apex = 40, recover = 1.15, settle = { R: [0.72, 0.94], L: [0.93, 1.15] } } = {}) { return this._push({ kind: 'jump', to, toY, crouch, air, apex, recover, settle }); }
  /** a one-shot mocap clip in place (u = progress); dur defaults to the clip's own duration / rate */
  clip(name, { dur = null, rate = 1, face = null } = {}) { return this._push({ kind: 'clip', name, dur, rate, face }); }

  // ---------------------------------------------------------------------------------------------- build (fixed step)
  build() {
    const S = this.S, c = this.cur; let t = this.t0; let prevEnd = null;   // prevEnd: sources at the previous segment's end
    const turnTo = (target, w, dt) => { const err = wrapPi(target - c.h); const acc = w * w * err - 2 * w * c.hv; c.hv += acc * dt; c.h += c.hv * dt; };
    const emit = (src, extra = {}) => {
      // cross-fade from the previous segment's final sources over FADE
      const tau = t - segStart; let sources = src;
      if (prevEnd && tau < FADE) { const s = smooth(tau / FADE); sources = [...prevEnd.map((q) => ({ ...q, w: q.w * (1 - s) })), ...src.map((q) => ({ ...q, w: q.w * s }))]; }
      S.push({ t, x: c.x, y: c.y, z: c.z, h: c.h, v: c.v, ph: c.ph, src: sources, ...extra });
      t += DT;
    };
    let segStart = t;
    for (const seg of this.segs) {
      segStart = t; let last = null;
      if (seg.kind === 'idle' || seg.kind === 'clip') {
        const c0 = seg.kind === 'clip' ? this.clips[seg.name] : null; const dur = seg.dur ?? (c0 ? c0.dur / seg.rate : 1);
        const n = Math.max(1, Math.round(dur / DT));
        for (let i = 0; i < n; i++) { if (seg.face !== null) turnTo(seg.face, 8, DT); c.v = 0; c.y = this.ground(c.x, c.z);
          last = seg.kind === 'idle' ? [{ k: 'loco', v: 0, w: 1 }] : [{ k: 'clip', c: seg.name, u: c0.loop ? (i * DT * seg.rate / c0.dur) % 1 : (i * DT * seg.rate) / c0.dur, w: 1 }];
          emit(last); }
      } else if (seg.kind === 'move') {
        const P = new Path([[c.x, c.z], ...seg.pts]); let s = 0, v = c.v; const i0 = S.length; const keys = seg.speed.map(([a, b]) => [a, this.speedOf(b)]);
        for (let i = 0; i < 240 * 60; i++) {
          const tau = i * DT; let target = keys[0][1]; for (const [a, b] of keys) if (tau >= a) target = b;
          const vBrake = seg.stop ? Math.sqrt(2 * seg.decel * Math.max(0, P.length - s)) : Infinity;
          if (seg.stop) target = Math.min(target, Math.sqrt(2 * seg.decel * 0.8 * Math.max(0, P.length - s)));
          const acc = Math.max(-seg.decel, Math.min(seg.accel, (target - v) * 7)); v = Math.min(vBrake, Math.max(0, v + acc * DT));   // never overshoot the stop
          s = Math.min(P.length, s + v * DT); const p = P.at(s); c.x = p.x; c.z = p.z; c.y = this.ground(c.x, c.z); c.v = v;
          turnTo(Math.atan2(p.tz, p.tx), seg.turn, DT);
          const st = this.stride(v); if (v > 1e-4 && st > 1e-6) c.ph += (v / st) * DT;
          last = [{ k: 'loco', v, w: 1 }]; emit(last);
          if (seg.stop && P.length - s < 0.02) { c.v = 0; break; }
          if (!seg.stop && s >= P.length) break;
        }
        if (seg.stop) {   // stride warp: end the stop in double support (both feet planted), spread over the last 0.8 s
          const n = S.length - i0, ph = c.ph; let best = null;
          for (let k = Math.floor(ph * 2) - 1; k <= Math.floor(ph * 2) + 2; k++) { const cand = k / 2 + DS_PHASE; if (best === null || Math.abs(cand - ph) < Math.abs(best - ph)) best = cand; }
          const delta = best - ph, m = Math.min(n, Math.round(0.8 / DT));
          for (let j = 0; j < m; j++) { const r = S[S.length - m + j]; r.ph += delta * smooth((j + 1) / m); }
          c.ph = best; c.v = 0; S[S.length - 1].v = 0; last = [{ k: 'loco', v: 0, w: 1 }];
        }
      } else if (seg.kind === 'jump') {
        const x0 = c.x, z0 = c.z, y0 = c.y, [x1, z1] = seg.to, y1 = seg.toY ?? this.ground(x1, z1);
        const face = Math.atan2(z1 - z0, x1 - x0);
        let T = seg.air; if (!T) { const top = Math.max(y0, y1) + seg.apex; T = Math.sqrt(2 * (top - y0) / GRAVITY) + Math.sqrt(2 * (top - y1) / GRAVITY); }
        const v0 = (y1 - y0) / T + GRAVITY * T / 2;
        const JS = this.clips.jump_start, JL = this.clips.jump_land, JP = this.clips.jump_loop;
        const tPush = 0.075, uA0 = 0.8 / JL.dur, uA1 = 0.1 / JL.dur;   // anticipation = the landing recovery reversed (stand -> crouch)
        const nA = Math.round(seg.crouch / DT), nP = Math.round(tPush / DT), nAir = Math.round(T / DT), nR = Math.round(seg.recover / DT);
        for (let i = 0; i < nA; i++) { turnTo(face, 14, DT); c.v = 0; const a = smooth(i / nA); last = [{ k: 'clip', c: 'jump_land', u: uA0 + (uA1 - uA0) * a, w: 1, cR: 1, cL: 1 }]; emit(last); }
        for (let i = 0; i < nP; i++) { turnTo(face, 14, DT); last = [{ k: 'clip', c: 'jump_start', u: (i * DT) / JS.dur, w: 1, cR: 1, cL: 1 }]; emit(last, { push: 1 }); }
        for (let i = 0; i < nAir; i++) {
          const tau = (i + 1) * DT; const a = tau / T; turnTo(face, 14, DT);
          c.x = x0 + (x1 - x0) * a; c.z = z0 + (z1 - z0) * a; c.y = y0 + v0 * tau - GRAVITY * tau * tau / 2; c.v = Math.hypot(x1 - x0, z1 - z0) / T;
          const uS = (tPush + tau) / JS.dur, wLoop = smooth((tau - 0.25) / 0.2), wLand = smooth((tau - (T - 0.12)) / 0.1);
          last = [{ k: 'clip', c: 'jump_start', u: uS, w: (1 - wLoop) * (1 - wLand), cR: 0, cL: 0 }, { k: 'clip', c: 'jump_loop', u: (tau / JP.dur) % 1, w: wLoop * (1 - wLand), cR: 0, cL: 0 },
            { k: 'clip', c: 'jump_land', u: 0, w: wLand, cR: 0, cL: 0 }];
          emit(last, { air: 1 });
        }
        c.x = x1; c.z = z1; c.y = y1; c.v = 0;
        // recovery, with one settle step per foot (lift and re-plant at the idle stance: tiny when the landing stance is already fine)
        const inW = (tau, w) => w && tau >= w[0] && tau < w[1] ? 0 : 1;
        for (let i = 0; i < nR; i++) { const tau = i * DT, u = Math.min(0.63, tau / JL.dur); const wI = smooth((tau - 0.5) / 0.25); /* Jump_Land has recovered by ~0.75 s: idle from there */ const cR = inW(tau, seg.settle?.R), cL = inW(tau, seg.settle?.L);
          last = [{ k: 'clip', c: 'jump_land', u, w: 1 - wI, cR, cL }, { k: 'loco', v: 0, w: wI, cR, cL }]; emit(last); }
        last = [{ k: 'loco', v: 0, w: 1 }];
      }
      if (seg.kind === 'jump' || seg.kind === 'clip') c.ph = toIdleParity(c.ph);   // feet now in the idle stance: the next walk starts from it
      seg.t0 = segStart; seg.t1 = t;
      prevEnd = last ? last.filter((q) => q.w > 1e-4) : prevEnd;
      // hold the final source for the cross-fade but keep loops advancing (one-shots freeze)
    }
    this.t1 = t;
    // lean: tilt toward the (smoothed) horizontal acceleration
    const n = S.length, k = Math.round(0.06 / DT);
    for (let i = 0; i < n; i++) {
      const a = S[Math.max(0, i - k)], b = S[i], d = S[Math.min(n - 1, i + k)], h = k * DT;
      const ax = b.air || a.air || d.air ? 0 : (d.x - 2 * b.x + a.x) / (h * h), az = b.air || a.air || d.air ? 0 : (d.z - 2 * b.z + a.z) / (h * h);
      b.ax = ax; b.az = az;
    }
    const m = Math.round(0.1 / DT);   // box-smooth the acceleration (0.2 s window)
    const AX = S.map((r) => r.ax), AZ = S.map((r) => r.az);
    for (let i = 0; i < n; i++) { let sx = 0, sz = 0, c2 = 0; for (let j = Math.max(0, i - m); j <= Math.min(n - 1, i + m); j++) { sx += AX[j]; sz += AZ[j]; c2++; } S[i].ax = sx / c2; S[i].az = sz / c2; }
    // contacts per sample, then contact intervals per foot
    // locomotion contact = a strike-gated state machine per foot: a contact starts only when the cycle passes the (speed-
    // blended) strike phase and ends at the blended toe-off, so gait blending can never re-plant a foot mid-swing
    for (const sd of ['R', 'L']) {
      let on = true, prevLp = null, sx = 0, dist = 0, px = S[0].x, pz = S[0].z;
      for (const r of S) {
        dist += Math.hypot(r.x - px, r.z - pz); px = r.x; pz = r.z;
        const v = r.src.reduce((m, q) => (q.k === 'loco' ? Math.max(m, q.v) : m), 0); const g = gaitWeights(this.G, v); this._v = v; const { on: a, dur, travel } = this._gaitContact(g, sd);
        const lp = (((r.ph - a) % 1) + 1) % 1;   // 0 at the strike
        if (g.idle > 0.85) on = true;
        else if (prevLp !== null && lp < prevLp - 0.5) { on = true; sx = dist; }   // wrapped past the strike
        else if (lp >= dur || (on && dist - sx > 1.3 * travel + 2)) on = false;   // toe-off, or the body has left the foot behind
        prevLp = lp; r['l' + sd] = on ? 1 : 0;
      }
    }
    for (const r of S) { r.cR = this._contact(r, 'R'); r.cL = this._contact(r, 'L'); }
    this.contacts = { R: [], L: [] };
    for (const sd of ['R', 'L']) { let a = -1; for (let i = 0; i <= n; i++) { const on = i < n && S[i]['c' + sd]; if (on && a < 0) a = i; if (!on && a >= 0) { this.contacts[sd].push({ i0: a, i1: i, t0: S[a].t, t1: i < n ? S[i].t : this.t1 }); a = -1; } } }
    this.built = true; return this;
  }
  /** strike phase and stance length (cycle units) of foot sd for gait weights g (blended over walk / jog / run) */
  _gaitContact(g, sd) {
    let a = 0, d = g.idle, Wa = 0, W = g.idle;
    for (const gg of GAITS) { if (!(g[gg] > 0)) continue; const iv = this.G[gg].clip.contacts[sd]; const best = iv.reduce((m, x) => (x[1] - x[0] > m[1] - m[0] ? x : m), iv[0]);
      let on = best[0]; if (sd === 'L' && on < 0.25) on += 1; if (sd === 'R' && on > 0.75) on -= 1;   // R strikes near 0, L near 0.5
      a += g[gg] * on; Wa += g[gg]; d += g[gg] * (best[1] - best[0]); W += g[gg]; }
    const on = Wa > 0 ? a / Wa : (sd === 'L' ? 0.5 : 0), dur = W > 0 ? d / W : 1;
    return { on, dur, travel: dur * this.stride(this._v ?? 0) };
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
    const S = this.S, n = S.length; const f = Math.min(n - 1, Math.max(0, (t - this.t0) / DT)); const i = Math.min(n - 2, Math.floor(f)), a = Math.max(0, Math.min(1, f - i));
    const A = S[i], B = S[Math.min(n - 1, i + 1)]; const L = (k) => A[k] + (B[k] - A[k]) * a;
    const same = A.src.length === B.src.length && A.src.every((q, j) => q.k === B.src[j].k && q.c === B.src[j].c);
    const src = A.src.map((q, j) => { if (!same) return q; const r = B.src[j]; const o = { ...q, w: q.w + (r.w - q.w) * a };
      if (q.u !== undefined) { let du = r.u - q.u; if (this.clips[q.c].loop) du -= Math.round(du); o.u = q.u + du * a; } if (q.v !== undefined) o.v = q.v + (r.v - q.v) * a; return o; });
    const tt = Math.max(this.t0, Math.min(t, this.t1));
    return { t: tt, x: L('x'), y: L('y'), z: L('z'), h: A.h + wrapPi(B.h - A.h) * a, v: L('v'), ph: L('ph'), ax: L('ax'), az: L('az'), src, air: !!A.air, idx: f };
  }
  /** the contact interval of foot sd containing time t, else the previous / next ones: { cur, prev, next } */
  contactAt(sd, t) {
    const C = this.contacts[sd]; let prev = null, next = null, cur = null;
    for (const iv of C) { if (t >= iv.t0 && t < iv.t1) cur = iv; else if (iv.t1 <= t) prev = iv; else if (iv.t0 > t && !next) next = iv; }
    if (t >= this.t1 && C.length && C[C.length - 1].t1 >= this.t1 - DT) cur = C[C.length - 1];
    return { cur, prev, next };
  }
}
