// "LINES OF CODE" running gag (director's note 2026-10-15): the HUD counter counts up with every stroke and drawn
// block, with big jumps on big draws, and THE ERASER takes lines away. It's a PURE function of song time, so partial
// renders show the right number. Teams append events for their acts in their own block below (keep them sorted).
// event: [t0, dur, n, curve]: n lines arrive linearly over dur seconds (curve 'in' = accelerating), and n may be negative.
import * as T from './timing.js';
import { act1LocEvents } from '../scenes/act1/level.js';
import { act2LocEvents } from '../scenes/act2/plan.js';   // ACT II: exact draw frames (one source with the scene)

/** 'count' = the counter counts up (director's note 2026-10-15, default). 'zero' = the script.md joke: "LINES OF CODE: 0"
 *  never moves (we're not writing code). Switch here in one line. */
export const LOC_MODE = 'count';

let EV = null;
function build() {
  const C = (k) => T.cue('act1.' + k), N = C('whistle_notes');
  EV = [
    // ---------------------------------------------------------------- ACT I (Team A1) — DERIVED, don't hand-edit:
    // scenes/act1/level.js act1LocEvents(): +1 on the frame each stroke/block is drawn (title strokes, flowers, Jade's post,
    // platforms, spring, slammed words, 未来 strokes; the generated LEVEL 1-1 chunk on the dive), -1 on the frame the
    // Eraser's rubbing edge passes a GRAPHITE block (colour is locked; it stops dropping once Jade colours, 28.32).
    ...act1LocEvents(),
    // ---------------------------------------------------------------- END ACT I
    // ---------------------------------------------------------------- ACT II (Team A)
    // Round 2 rule: +1 on the exact frame each stroke/block is drawn, +chunk size when a hat seeds a chunk; never down
    // (no Eraser in the void). The frames come from src/scenes/act2/plan.js, which the Act II scene draws from.
    ...act2LocEvents(),
    // ---------------------------------------------------------------- ACT III-V: Teams B/C/D append here
    // act3.turn (triplet roll, measured hits = act3/common.js CUE.roll): each drum hit pumps a graphite pillar up by c+1
    // bricks (pillar c = 0..2), the last triplet taps out the 一 (3 segments), 一笔一画 = 1+10+1+8 strokes in stroke order,
    // the impact loads Reality Lv 2 (one generated 16x16x16 chunk), Ricky's clicks raise causeway chunks (16-px tiles x 4 rows)
    ...[77.757, 77.895, 78.033, 78.17, 78.308, 78.446, 78.583, 78.721, 78.859, 78.996, 79.134, 79.272].map((e, i) => [T.snap(e) - 1e-6, 0, i < 9 ? Math.floor(i / 3) + 1 : 1]),
    [79.36, 0.025, 1], [79.536, 0.25, 10], [79.767, 0.025, 1], [80.309, 0.2, 8],
    [T.snap(80.815) - 1e-6, 0.3, 4096, 'in'],
    [T.snap(82.265) - 1e-6, 0.16, 28], [T.snap(83.09) - 1e-6, 0.16, 52], [T.snap(85.56) - 1e-6, 0.16, 28], [T.snap(86.385) - 1e-6, 0.16, 184],   // (the last chunk rises in act3.drop's first beat)
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
