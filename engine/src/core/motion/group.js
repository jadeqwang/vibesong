// Group motion: formation slots + deterministic mutual avoidance for several MotionTracks (the trio never bunches or
// overlaps). Build-time only; the result is still a per-track table queried as a pure function of t.
//
//   const F = formation(path, [{ side: 0 }, { side: -34, back: 22 }, { side: 34, back: 26 }]);     // slots along a shared path
//   const grp = new MotionGroup({ radius: 0.55 });                                                 // personal radius (x hip height)
//   const tj = grp.add(new MotionTrack(clips, { pos: F[0].start, heading: F[0].heading, ... }).idle(0.3).move(F[0].pts));
//   ...; grp.build();   // instead of each track.build()
//
// Avoidance: every track keeps a 2D world offset from its own planned path. Each 240 Hz step the offsets are pushed apart
// where two heroes are closer than the sum of their radii, and relax back slowly otherwise. Offsets only change sideways to
// the hero's own heading and only while it moves (rate <= 0.45 x speed), so a standing hero never slides; overlaps left at a
// standstill are reported in group.warnings. Heading turns slightly into the sidestep.
import { DT } from './track.js';
import { Path } from './path.js';

/**
 * Formation slots along a shared path. pts: [[x, z], ...] (the leader's path, start first). slots: [{ side (world units,
 * + = right of the direction of travel), back (units behind the leader, at the start and the end) }]. Returns per slot
 * { start: [x, z], pts: [[x, z], ...] (for move(), without the start), heading }.
 */
export function formation(pts, slots) {
  const P = new Path(pts), L = P.length, p0 = P.at(0);
  return slots.map(({ side = 0, back = 0 }) => {
    const off = (s, behind = 0) => { const p = P.at(s); return [p.x - p.tz * side - p.tx * behind, p.z + p.tx * side - p.tz * behind]; };
    const n = Math.max(3, pts.length * 2), out = [];
    for (let i = 1; i <= n; i++) out.push(off(Math.max(0, L - back) * (i / n)));
    return { start: off(0, back), pts: out, heading: Math.atan2(p0.tz, p0.tx) };
  });
}

/** single file along one path (planks, a ledge): n slots, each `gap` (world units) behind the previous; followers stop short */
export function column(pts, n, gap) { return formation(pts, Array.from({ length: n }, (_, i) => ({ side: 0, back: i * gap }))); }

export class MotionGroup {
  /** radius: personal radius in hip heights (each hero; two heroes keep >= the sum apart); gain: push strength */
  /** camera: optional { pos: [x, y, z] } (or a function of t): standing heroes are also kept from hiding behind each other on
   *  screen (horizontal view angle >= the hero width + a gap, for heroes within 6 hip heights of each other) */
  /** sideways: false = never push sideways (single file on a plank): only yielding speed and moving stop spots keep the gaps */
  constructor({ radius = 0.55, gain = 1, relax = 0.35, camera = null, sideways = true } = {}) { this.radius = radius; this.gain = gain; this.relax = relax; this.camera = camera; this.sideways = sideways; this.members = []; this.warnings = []; }
  /** add a track (not built yet); weight: how much it yields (2 = yields twice as much as a 1); pin: never moved (a hero tied
   *  to a prop: holding a post, on a plate) */
  add(track, { weight = 1, radius = null, pin = false } = {}) { this.members.push({ track, weight, radius: radius ?? this.radius, pin }); return track; }
  build() {
    for (const m of this.members) m.track._simulate();
    this._stage();
    this._yield();
    if (this.sideways) this._separate();
    for (const m of this.members) m.track._finalize();
    return this;
  }
  /**
   * standing / hand-placed staging: where two heroes STAND too close (or one hides the other from the camera), move the
   * yielder's rest spot itself (its start position, or the end of the move that brought it there) and re-simulate, so the
   * fix is part of the plan and nobody slides. Up to 10 passes; leftovers are reported in warnings.
   */
  _stage() {
    const M = this.members; if (M.length < 2) return; this.staged = [];
    const at = (m, t) => { const S = m.track.S; const i = Math.round((t - m.track.t0) / DT); return S[Math.max(0, Math.min(S.length - 1, i))]; };
    const conflict = (i, j, t) => {
      const a = at(M[i], t), b = at(M[j], t); if (a.v > 1 || b.v > 1 || a.air || b.air) return null;
      const H = M[i].track.H, R = (M[i].radius * H + M[j].radius * M[j].track.H), dx = a.x - b.x, dz = a.z - b.z, d = Math.hypot(dx, dz);
      if (d < R * 0.97) return { need: R - d + 1, dir: d > 1e-3 ? [dx / d, dz / d] : [-Math.sin(a.h), Math.cos(a.h)] };
      const C = typeof this.camera?.pos === 'function' ? this.camera.pos(t) : this.camera?.pos; if (!C || d > 6 * H) return null;
      const ra = [a.x - C[0], a.z - C[2]], rb = [b.x - C[0], b.z - C[2]], la = Math.hypot(...ra), lb = Math.hypot(...rb);
      const ang = Math.abs(Math.atan2(ra[0] * rb[1] - ra[1] * rb[0], ra[0] * rb[0] + ra[1] * rb[1])), far = Math.max(la, lb), minA = Math.atan((0.95 * H) / far);
      if (ang >= minA) return null;
      const n = [-(la > lb ? ra : rb)[1] / far, (la > lb ? ra : rb)[0] / far]; const side = (dx * n[0] + dz * n[1]) * (la > lb ? 1 : -1) >= 0 ? 1 : -1;   // push the farther one sideways off the view ray
      return { need: (minA - ang) * far + 2, dir: [n[0] * side, n[1] * side], screen: true, farI: la > lb };
    };
    for (let pass = 0; pass < 10; pass++) {
      const t0 = Math.min(...M.map((m) => m.track.t0)), t1 = Math.max(...M.map((m) => m.track.t1)); let hit = null;
      for (let t = t0; t <= t1 && !hit; t += 0.05) for (let i = 0; i < M.length && !hit; i++) for (let j = i + 1; j < M.length && !hit; j++) {
        const c = conflict(i, j, t); if (!c) continue;
        let y = c.screen ? (c.farI ? i : j) : (M[j].weight >= M[i].weight ? j : i); let sg = y === i ? 1 : -1; if (c.screen) sg = 1;
        if (M[y].pin) { const o = y === i ? j : i; if (M[o].pin) { this.warnings.push(`pinned ${M[i].track.name} / ${M[j].track.name} too close at ${t.toFixed(2)}`); continue; } y = o; sg = -sg; }
        hit = { y, t, d: [c.dir[0] * sg * c.need, c.dir[1] * sg * c.need] };
      }
      if (!hit) break;
      const tr = M[hit.y].track; const seg = tr.segs.filter((q) => q.t0 <= hit.t + 1e-6 && (q.kind === 'move')).pop();
      if (!seg || seg._pi == null) { tr.shift0 = [(tr.shift0?.[0] || 0) + hit.d[0], (tr.shift0?.[1] || 0) + hit.d[1]]; }   // its start spot
      else { const P = tr._plan[seg._pi]; P.shift = [(P.shift?.[0] || 0) + hit.d[0], (P.shift?.[1] || 0) + hit.d[1]]; }
      tr._simulate(); this.staged.push({ hero: tr.name, t: +hit.t.toFixed(2), by: hit.d.map((x) => +x.toFixed(1)) });
    }
  }
  /** crossing paths: the lower-priority hero (higher weight, then later in the list) slows down before the first predicted
   *  conflict and its track is re-simulated (up to 8 passes); what is left (shared stop points) goes to the lateral pass */
  _yield() {
    const M = this.members; if (M.length < 2) return; this.yields = [];
    const at = (m, t) => { const S = m.track.S; const i = Math.round((t - m.track.t0) / DT); return S[Math.max(0, Math.min(S.length - 1, i))]; };
    for (let pass = 0; pass < 8; pass++) {
      const t0 = Math.min(...M.map((m) => m.track.t0)), t1 = Math.max(...M.map((m) => m.track.t1)); let hit = null;
      for (let t = t0; t <= t1 && !hit; t += 0.05) for (let i = 0; i < M.length && !hit; i++) for (let j = i + 1; j < M.length; j++) {
        const a = at(M[i], t), b = at(M[j], t), R = (M[i].radius * M[i].track.H + M[j].radius * M[j].track.H) * 0.92;
        if (Math.hypot(a.x - b.x, a.z - b.z) >= R) continue;
        const y = M[j].weight > M[i].weight || (M[j].weight === M[i].weight) ? j : i, o = y === i ? j : i;   // the yielder
        const ry = at(M[y], t), ro = at(M[o], t);
        if (ry.v < 5 || ro.v < 5) continue;                       // a stop on top of someone: not fixable by slowing (lateral pass / staging)
        const dx = ro.x - ry.x, dz = ro.z - ry.z; if (dx * Math.cos(ry.h) + dz * Math.sin(ry.h) < -0.3 * R) continue;   // the other one is behind: not ours to yield
        hit = { y, t }; break;
      }
      if (!hit) break;
      const tr = M[hit.y].track; tr.gov.push({ t0: hit.t - 1.8, t1: hit.t + 0.8, m: 0.5 }); tr._simulate(); this.yields.push({ hero: tr.name, t: +hit.t.toFixed(2) });
    }
  }
  _separate() {
    const M = this.members; if (M.length < 2) return;
    const t0 = Math.min(...M.map((m) => m.track.t0)), t1 = Math.max(...M.map((m) => m.track.t1));
    const st = M.map((m) => ({ ox: 0, oz: 0, R: m.radius * m.track.H, ul: new Float32Array(m.track.S.length) }));
    const at = (m, t) => { const S = m.track.S; const i = Math.round((t - m.track.t0) / DT); return S[Math.max(0, Math.min(S.length - 1, i))]; };
    const steps = Math.round((t1 - t0) / DT); let overlapIdle = 0, worst = Infinity;
    for (let k = 0; k <= steps; k++) {
      const t = t0 + k * DT; const pos = M.map((m, i) => { const r = at(m, t); return [r.x + st[i].ox, r.z + st[i].oz, r]; });
      for (let i = 0; i < M.length; i++) {
        const r = pos[i][2], S = M[i].track.S, idx = Math.round((t - M[i].track.t0) / DT); if (idx < 0 || idx >= S.length) continue;
        let px = 0, pz = 0, clear = Infinity;
        for (let j = 0; j < M.length; j++) { if (j === i) continue; const R = st[i].R + st[j].R;
          // anticipation: the closest approach over the next 2 s of both plans (offsets held), discounted with lead time
          let dx = pos[i][0] - pos[j][0], dz = pos[i][1] - pos[j][1]; let d = Math.hypot(dx, dz); if (d < worst) worst = d;
          for (const tau of [0.4, 0.8, 1.2, 1.6, 2.0]) { const a = at(M[i], t + tau), b = at(M[j], t + tau); const fx = a.x + st[i].ox - b.x - st[j].ox, fz = a.z + st[i].oz - b.z - st[j].oz;
            const fd = Math.hypot(fx, fz) + tau * 0.12 * R; if (fd < d) { d = fd; dx = fx; dz = fz; } }
          clear = Math.min(clear, d / R); if (d >= R) continue;
          let ux = dx, uz = dz; if (d < 1e-3) { ux = -Math.sin(r.h) * (i < j ? 1 : -1); uz = Math.cos(r.h) * (i < j ? 1 : -1); d = 1e-3; } else { ux /= d; uz /= d; }
          const share = M[i].weight / (M[i].weight + M[j].weight) * 2; const s = this.gain * share * (R - d) * 8;
          px += ux * s; pz += uz * s;
          if (r.v < 1 && pos[j][2].v < 1 && R - d > 0.15 * R) overlapIdle++;
        }
        if (clear > 1.35) { px -= st[i].ox * this.relax; pz -= st[i].oz * this.relax; }   // relax back to the planned path only when nothing is near
        const nx = -Math.sin(r.h), nz = Math.cos(r.h); let ul = px * nx + pz * nz;   // sideways only
        const lim = (r.air || r.climb) ? 0 : 0.45 * r.v; ul = Math.max(-lim, Math.min(lim, ul));
        st[i].ox += ul * nx * DT; st[i].oz += ul * nz * DT; st[i].ul[idx] = ul;
      }
      for (let i = 0; i < M.length; i++) { const S = M[i].track.S, idx = Math.round((t - M[i].track.t0) / DT); if (idx >= 0 && idx < S.length) { S[idx]._ox = st[i].ox; S[idx]._oz = st[i].oz; } }
    }
    // apply: offsets into the tables (samples past the shared clock keep their last offset), heading eases into the sidestep
    for (let i = 0; i < M.length; i++) {
      const S = M[i].track.S; let ox = 0, oz = 0; const yaw = new Float32Array(S.length);
      for (let k = 0; k < S.length; k++) { const r = S[k]; if (r._ox !== undefined) { ox = r._ox; oz = r._oz; } r.x += ox; r.z += oz; delete r._ox; delete r._oz;
        yaw[k] = r.v > 1 ? Math.max(-0.35, Math.min(0.35, Math.atan2(st[i].ul[k], r.v))) * 0.7 : 0; }
      const w = Math.round(0.15 / DT); let acc = 0; const pre = new Float64Array(S.length + 1); for (let k = 0; k < S.length; k++) pre[k + 1] = pre[k] + yaw[k];
      for (let k = 0; k < S.length; k++) { const a = Math.max(0, k - w), b = Math.min(S.length, k + w + 1); S[k].h += (pre[b] - pre[a]) / (b - a); }
      M[i].track.offsetEnd = [ox, oz];
    }
    this.minDist = worst;
    if (overlapIdle > 0) this.warnings.push(`overlap left while standing: ${(overlapIdle * DT).toFixed(2)} s (stage the stops further apart)`);
  }
}
