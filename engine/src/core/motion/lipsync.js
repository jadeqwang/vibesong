// Lip sync: mouth visemes timed to the measured word times in analysis/lyrics_timed.json. Pure: lipSync(...) returns a
// function t -> viseme weights, fed to MotionFigure.apply(tr, t, { mouth }) and on to the figure's face API (models_r6).
//
//   import * as T from '../../show/timing.js';
//   const mouth = lipSync(T.raw().lyrics, { lines: [24, 25, 26] });          // Jade sings these lines
//   fig.apply(tr, t, { mouth });
//
// Canonical visemes: rest, A (ah), E (eh / neutral consonant), I (ee), O (oh), U (oo), M (m b p: closed), F (f v). The figure
// gets them mapped onto its own set (models_r6: rest / A / E / O / U / M / F) by toSet().
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

/** Mandarin: each sung character -> viseme sequence (initial if visible, then the final's vowel shapes), from its pinyin */
export const ZH = {
  一: 'I', 上: 'C A', 不: 'M U', 世: 'C E', 也: 'I E', 从: 'C O', 代: 'C A I', 再: 'C A I', 出: 'C U', 切: 'C I E', 发: 'F A', 句: 'C U', 只: 'C E',
  台: 'C A I', 回: 'U E', 在: 'C A I', 天: 'C I A', 存: 'C U E', 它: 'C A', 就: 'C I O', 屏: 'M I', 幅: 'F U', 幕: 'M U', 底: 'C I', 开: 'C A I', 当: 'C A',
  彩: 'C A I', 怕: 'M A', 想: 'C I A', 我: 'U O', 打: 'C A', 是: 'C E', 未: 'U E I', 来: 'C A I', 段: 'C U A', 每: 'M E I', 法: 'F A', 用: 'I O', 画: 'U A',
  界: 'C I E', 的: 'C E', 真: 'C E', 码: 'M A', 稿: 'C A O', 笔: 'M I', 答: 'C A', 背: 'M E I', 舞: 'U', 色: 'C E', 花: 'U A', 草: 'C A O', 话: 'U A',
  语: 'U', 说: 'C U O', 这: 'C E', 都: 'C O U', 里: 'C I',
};
/** English words of the lyric (lower case) -> viseme sequences (hand-made; unknown words fall back to letter rules) */
export const EN = {
  about: 'A M A U C', and: 'A C', ask: 'A C', because: 'M I C A C', blossoms: 'M C O C O M C', bug: 'M A C', everyday: 'E F E I C E I',
  everything: 'E F E I C I', fixtures: 'F I C U E C', from: 'F C O M', functions: 'F A C C E C', goes: 'C O U C', hey: 'E I', i: 'A I', imagination: 'I M A C I E I C E',
  is: 'I C', it: 'I C', just: 'C A C', life: 'C A I F', linked: 'C I C C', love: 'C A F', my: 'M A I', myself: 'M A I C E F', need: 'C I C', paint: 'M E I C',
  read: 'C I C', run: 'C A C', ship: 'C I M', stuff: 'C C A F', that: 'C A C', "that's": 'C A C', the: 'C E', there: 'C E', think: 'C I C', to: 'C U', what: 'U A C',
};
const VOW = new Set(['A', 'E', 'I', 'O', 'U']);
/** models_r6's face rig visemes (no I: -> E; M = m b p, F = f v) */
export const VISEMES = ['rest', 'A', 'E', 'O', 'U', 'M', 'F'];
function letters(w) {   // fallback: vowels -> shapes, b/m/p -> M, f/v -> F, other consonants -> C (collapsed runs)
  const out = []; for (const ch of w.toLowerCase()) { const v = 'aeiou'.includes(ch) ? ch.toUpperCase() : 'bmp'.includes(ch) ? 'M' : 'fv'.includes(ch) ? 'F' : /[a-z]/.test(ch) ? 'C' : null; if (v && out[out.length - 1] !== v) out.push(v); } return out.join(' ') || 'E';
}
/** viseme sequence for one lyric word (Chinese: one entry per character) */
export function wordVisemes(w) {
  const k = w.toLowerCase().replace(/[.,!?()"]/g, '');
  if (/[　-鿿]/.test(k)) return [...k].map((ch) => (ZH[ch] || 'E').split(' '));
  return [(EN[k] || letters(k)).split(' ')];
}
/**
 * keys for the given lines: [{ v, t0, t1 }] (consonants 60-70 ms, vowels share the rest of each syllable, the first vowel
 * gets the most: a held note is the nucleus). lead: visemes start this much before the sound (the mouth shapes first).
 */
export function visemeKeys(lyrics, { lines = null, lead = 0.035 } = {}) {
  const keys = []; const L = lyrics.lines.filter((l) => l.words && l.words.length && (!lines || lines.includes(l.id)));
  for (const l of L) for (const wd of l.words) {
    const syl = wordVisemes(wd.w); const span = Math.max(0.06, wd.end - wd.start) / syl.length;
    syl.forEach((seq, i) => {
      let t = wd.start + i * span - lead; const cons = seq.filter((v) => !VOW.has(v)).length, vows = seq.filter((v) => VOW.has(v));
      const cd = Math.min(0.07, span * 0.3), vd = Math.max(0.03, span - cons * cd); const wts = vows.map((_, j) => (j === 0 ? 2.2 : 1)); const W = wts.reduce((a, b) => a + b, 0) || 1; let vi = 0;
      for (const v of seq) { const d = VOW.has(v) ? vd * wts[vi++] / W : cd; keys.push({ v, t0: t, t1: t + d, line: l.id }); t += d; }
    });
  }
  return keys.sort((a, b) => a.t0 - b.t0);
}
/** map canonical weights onto a figure's viseme set ('rest A E O M' by default) */
export function toSet(w, set = VISEMES) {
  const has = new Set(set), o = Object.fromEntries(set.map((k) => [k, 0]));
  const add = (k, x) => { if (has.has(k)) o[k] += x; else o.rest = (o.rest || 0) + x; };
  for (const [k, x] of Object.entries(w)) {
    if (!x) continue;
    if (has.has(k)) { o[k] += x; continue; }
    if (k === 'I') { add('E', x); } else if (k === 'U') { add('O', 0.75 * x); add('M', 0.25 * x); } else if (k === 'F') { add('M', 0.55 * x); add('E', 0.3 * x); add('rest', 0.15 * x); }
    else if (k === 'C') { add('E', 0.4 * x); add('rest', 0.6 * x); } else add('rest', x);
  }
  return o;
}
/**
 * lipSync(lyrics, { lines, lead, set, open, attack, release }) -> (t) => weights over `set` (sum 1; rest outside singing).
 * open scales the jaw (0..1) for quieter lines; attack / release = co-articulation ramps (s).
 */
export function lipSync(lyrics, { lines = null, lead = 0.035, set = VISEMES, open = 1, attack = 0.05, release = 0.07, shift = 0 } = {}) {
  const K = visemeKeys(lyrics, { lines, lead });
  const fn = (t0) => { const t = t0 + shift;   // shift: play the song's lines at another time (dev scenes)
    const w = {}; let lo = 0, hi = K.length; while (lo < hi) { const m = (lo + hi) >> 1; if (K[m].t1 + release < t) lo = m + 1; else hi = m; }
    for (let i = Math.max(0, lo - 2); i < K.length && K[i].t0 - attack <= t; i++) { const k = K[i]; const x = Math.min(smooth((t - (k.t0 - attack)) / attack), 1 - smooth((t - k.t1) / release)); if (x > 0) w[k.v] = Math.max(w[k.v] || 0, x); }
    let s = 0; for (const k in w) { if (k !== 'rest') w[k] *= open; s += w[k]; } w.rest = Math.max(0, 1 - s) + (w.rest || 0);
    const o = toSet(w, set); let S = 0; for (const k in o) S += o[k]; for (const k in o) o[k] /= S || 1; return o;
  };
  fn.keys = K; return fn;
}
