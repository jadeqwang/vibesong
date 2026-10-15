// Song timing for the whole show. Everything keys to MEASURED times:
//   analysis/timing.json        beat grid (variable tempo 140->152 BPM), sections, silences, accents
//   analysis/lyrics_timed.json  lines + word times (+ vocal_accent for shouted chants)
//   engine/data/cues.json       measured micro-cues that refine/correct the above (whistle notes, stabs,
//                               stutter hits, post-stop accents which land 50-80 ms after the grid)
// Never use a fixed BPM. Call `await load()` once (the show runner does it), then use the helpers
// synchronously. All helpers are pure functions of their arguments.
//
//   beat(i)            time of global beat i (0-based; fractional i interpolates; 0 = bar 1 beat 1 = 0.343 s)
//   bar(n, b=1)        time of bar n (1-based), beat b (1-based, fractional ok): bar(5) = 7.183
//   barBeat(n, b)      alias of bar(n, b)
//   beatAt(t)          fractional global beat index at time t (inverse of beat())
//   barAt(t)           { bar, beat } (1-based, beat fractional)
//   nearestBeat(t, s)  nearest grid time with subdivision s (1 beat, 2 8ths, 3 triplets, 4 16ths)
//   beatsIn(a, b, s)   all grid times in [a, b) with subdivision s
//   line(idOrText)     a lyric line object (id number, or exact/substring text match)
//   word(lineId, i)    { w, start, end } of the i-th word of a line
//   words(lineId)      all words of a line
//   accent(lineId)     vocal_accent of a chant (cut shouts here), else the line start
//   section(name)      { name, start, end, start_bar, ... } (exact or prefix match: 'Verse 1')
//   cue('act1.whistle_notes')   value from data/cues.json (dot path)
//   snap(e)            event time snapped to the render frame grid (round to nearest frame)
//   on(t, e)           true from the frame nearest to e onward
//   since(t, e)        t - snap(e)   (>= 0 once the cue frame is reached)
//   frameOf(e)         integer frame index nearest to e
//   pulse(t, times, d) 1 on each event frame, decaying exponentially with time constant d (s)
//   beatPulse(t, s, d) pulse on every grid beat (subdivision s)
//   keys(t, [[t,v],..], ease)   piecewise interpolation of numbers or arrays
//   ease.*             easing curves (inOut, out, in, back, elastic, step)

let TM = null, LY = null, CUES = null, FPS = 30, BEATS = null;

export async function load(base = '') {
  if (TM) return;
  const [a, b, c] = await Promise.all([
    fetch(`${base}/analysis/timing.json`).then((r) => r.json()),
    fetch(`${base}/analysis/lyrics_timed.json`).then((r) => r.json()),
    fetch(`${base}/data/cues.json`).then((r) => r.json()),
  ]);
  TM = a; LY = b; CUES = c;
  BEATS = TM.beat_grid.beats.map((x) => x.t);
}
/** For node-side use (tools) or tests: inject already-parsed JSON. */
export function init(timing, lyrics, cues) { TM = timing; LY = lyrics; CUES = cues || {}; BEATS = TM.beat_grid.beats.map((x) => x.t); }

export const raw = () => ({ timing: TM, lyrics: LY, cues: CUES });
export function setFps(f) { FPS = f; }
export const fps = () => FPS;

// ------------------------------------------------------------------ beat grid
export function beat(i) {
  const n = BEATS.length;
  if (i <= 0) return BEATS[0] + i * (BEATS[1] - BEATS[0]);
  if (i >= n - 1) return BEATS[n - 1] + (i - (n - 1)) * (BEATS[n - 1] - BEATS[n - 2]);
  const k = Math.floor(i), f = i - k;
  return BEATS[k] + f * (BEATS[k + 1] - BEATS[k]);
}
export function bar(n, b = 1) { return beat((n - 1) * 4 + (b - 1)); }
export const barBeat = bar;
export function beatAt(t) {
  const n = BEATS.length;
  if (t <= BEATS[0]) return (t - BEATS[0]) / (BEATS[1] - BEATS[0]);
  if (t >= BEATS[n - 1]) return n - 1 + (t - BEATS[n - 1]) / (BEATS[n - 1] - BEATS[n - 2]);
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (BEATS[m] <= t) lo = m; else hi = m; }
  return lo + (t - BEATS[lo]) / (BEATS[lo + 1] - BEATS[lo]);
}
export function barAt(t) { const b = beatAt(t); return { bar: Math.floor(b / 4) + 1, beat: (b - 4 * Math.floor(b / 4)) + 1 }; }
export function nearestBeat(t, s = 1) { return beat(Math.round(beatAt(t) * s) / s); }
export function beatsIn(a, b, s = 1) {
  const out = []; let k = Math.ceil(beatAt(a) * s - 1e-9);
  for (;; k++) { const tt = beat(k / s); if (tt >= b) break; if (tt >= a) out.push(tt); }
  return out;
}
export const beatLen = (t) => beat(Math.floor(beatAt(t)) + 1) - beat(Math.floor(beatAt(t)));

// ------------------------------------------------------------------ lyrics
export function lines() { return LY.lines; }
export function line(q) {
  if (typeof q === 'number') return LY.lines.find((l) => l.id === q);
  return LY.lines.find((l) => l.text === q) || LY.lines.find((l) => l.text.includes(q));
}
export function words(q) { return (line(q) || { words: [] }).words; }
export function word(q, i) { return words(q)[i]; }
export function accent(q) { const l = line(q); return l.vocal_accent ?? l.start; }
export function hooks() { return LY.lines.filter((l) => l.type === 'hook'); }

// ------------------------------------------------------------------ structure
export function section(name) {
  const s = TM.sections;
  return s.find((x) => x.name === name) || s.find((x) => x.name.startsWith(name));
}
export function sections() { return TM.sections; }
export function silences() { return TM.silences.full_instrumental; }
export function accents(a = -1e9, b = 1e9) { return TM.accent_hits.filter((x) => x.t >= a && x.t < b).map((x) => x.t); }
export function cue(path) {
  let v = CUES; for (const k of path.split('.')) { v = v?.[k]; }
  if (v === undefined) throw new Error('unknown cue ' + path);
  return v;
}

// ------------------------------------------------------------------ frame quantisation
export const frameOf = (e) => Math.round(e * FPS);
export const snap = (e) => frameOf(e) / FPS;
export const on = (t, e) => t >= snap(e) - 1e-6;
export const since = (t, e) => t - snap(e);
/** index of the last event in sorted `times` that is on() at t, or -1 */
export function lastIdx(t, times) { let k = -1; for (let i = 0; i < times.length; i++) if (on(t, times[i])) k = i; return k; }
/** true only on the single frame nearest to one of `times` (1-frame flashes) */
export function exactFrame(t, times) { const f = Math.round(t * FPS); return times.some((e) => frameOf(e) === f); }
export function pulse(t, times, d = 0.12) {
  let v = 0; for (const e of times) { const s = since(t, e); if (s >= -1e-6) v = Math.max(v, Math.exp(-Math.max(0, s) / d)); }
  return v;
}
export function beatPulse(t, s = 1, d = 0.1) { const b = beatAt(t + 0.5 / FPS) * s; const k = Math.floor(b); return Math.exp(-Math.max(0, t - snap(beat(k / s))) / d); }

// ------------------------------------------------------------------ easing + keys
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const ease = {
  linear: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - Math.pow(1 - u, 3),
  inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  outQuad: (u) => 1 - (1 - u) * (1 - u),
  inQuad: (u) => u * u,
  expoIn: (u) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10)),
  expoOut: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  back: (u) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
  elastic: (u) => (u <= 0 ? 0 : u >= 1 ? 1 : Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
  step: (u) => (u < 1 ? 0 : 1),
};
/** u in [0,1] over [a,b], eased */
export const span = (t, a, b, e = ease.linear) => e(clamp01((t - a) / (b - a)));
export function keys(t, ks, e = ease.linear) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t < ks[i][0]) {
      const [t0, v0] = ks[i - 1], [t1, v1, ei] = ks[i]; const u = (ei || e)(clamp01((t - t0) / (t1 - t0)));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], u)) : lerp(v0, v1, u);
    }
  }
  return ks[ks.length - 1][1];
}
