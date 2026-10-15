// "LINES OF CODE" running gag (director's note 2026-10-15): the HUD counter counts up with every stroke and drawn
// block, with big jumps on big draws, and THE ERASER takes lines away. It's a PURE function of song time, so partial
// renders show the right number. Teams append events for their acts in their own block below (keep them sorted).
// event: [t0, dur, n, curve]: n lines arrive linearly over dur seconds (curve 'in' = accelerating), and n may be negative.
import * as T from './timing.js';

/** 'count' = the counter counts up (director's note 2026-10-15, default). 'zero' = the script.md joke: "LINES OF CODE: 0"
 *  never moves (we're not writing code). Switch here in one line. */
export const LOC_MODE = 'count';

let EV = null;
function build() {
  const C = (k) => T.cue('act1.' + k), N = C('whistle_notes');
  EV = [
    // ---------------------------------------------------------------- ACT I (Team A)
    [0.21, 0.13, 1], [N[0], 0.27, 10], [N[1], 0.1, 1], [N[2], 0.5, 7], [N[3] - 0.1, 0.09, 1],   // the title, stroke by stroke
    [C('chant_stabs')[0], 0.4, 12], [5.345, 0.2, 24], [C('chant_words')[5], 0.15, 64],          // PAINT / RUN / SHIP
    [C('breathy_syllables')[0], 1.5, 20],                                                         // PRESS START redraw
    [14.11, 2.6, 34], [C('stop1')[0] + 0.05, 0.6, -30],                                           // lyric floor; the Eraser rubs lines out
    [18.1, 1.8, 7], [T.word(7, 3).start, 0.1, 52],                                                // because; linked (52 links)
    [27.8, 3.2, 30], [31.2, 3.5, 24], [C('pre_accents')[0], 0.05, 3], [C('pre_accents')[1], 0.05, 4], [38.25, 1.72, 12],
    // ---------------------------------------------------------------- ACT II (Team A)
    [46.05, 1.6, 4], [49.4, 5.0, 40], [50.65, 2.2, 15],                                           // canvas, blueprint, typing
    [T.word(14, 3).start - 0.12, 0.57, 40], [T.word(14, 6).start, 0.7, 80],                       // FIXTURES / FUNCTIONS
    [59.555, 0.1, 16], [59.975, 0.1, 16], [60.425, 0.1, 16],                                      // oh oh oh
    [61.3, 6.3, 900, 'in'], [68.0, 4.0, 60],                                                      // everything goes from there
    [73.057, 0.36, 200], [73.555, 0.42, 200],                                                     // 出 发
    // ---------------------------------------------------------------- ACT III-V: Teams B/C/D append here
  ];
}
export function locAt(t) {
  if (LOC_MODE === 'zero') return 0;
  if (!EV) build();
  let v = 0;
  for (const [t0, dur, n, curve] of EV) {
    if (t < t0) continue; let u = dur > 0 ? Math.min(1, (t - t0) / dur) : 1; if (curve === 'in') u = u * u;
    v += n * u;
  }
  return Math.max(0, Math.floor(v));
}
/** let another act add events at load time (e.g. from a scene module): addLoc([t0, dur, n, curve], ...) */
export function addLoc(...evs) { if (!EV) build(); EV.push(...evs); }
