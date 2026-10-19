// Beat locking: put footfalls, landings, stops and strum hits on the song's measured beat grid (src/show/timing.js, which
// reads analysis/timing.json; variable tempo 140 -> 152 BPM, never a fixed BPM). T = the timing module (import * as T).
//   new MotionTrack(clips, { ..., timing: T }).move(pts, { beats: true })          // every footfall on a beat (or { every: 2 })
//   .move(pts, { arriveAt: stopOn(T, T.bar(64, 1)) })                              // the stop lands on bar 64 beat 1
//   .jump({ to, landAt: T.bar(65, 1) })                                            // touchdown on the downbeat
//   layers: [strumLayer(T, t0, t1, { every: 1 })]                                  // Ricky's downstrokes on every beat
/** song time a move should "arrive" so its final plant (double support, ~0.07 cycles after the last strike) sits on beat time b */
export const stopOn = (T, b, lag = 0.06) => b + lag;
/** phase function for a voxfig cyclic pose so that phase `hitPhase` falls on every `every`-th beat (chord downstroke = 0.5) */
export function beatPhase(T, { every = 1, hitPhase = 0.5, offset = 0 } = {}) { return (t) => hitPhase + (T.beatAt(t) - offset) / every; }
/** an upper-body strum layer for MotionFigure.apply: the 'chord' pose with its downstroke on the beats */
export function strumLayer(T, t0, t1, { every = 1, anim = 'chord', mask = 'armsHead', fade = 0.2 } = {}) { return { anim, t0, t1, mask, fade, p: beatPhase(T, { every }) }; }
/** beat-alignment report for a built track: each footfall's offset (s) to the nearest grid beat (subdivision sub) */
export function footfallReport(track, T, sub = 1) {
  const out = track.footfalls().map((f) => ({ ...f, beat: T.nearestBeat(f.t, sub), off: f.t - T.nearestBeat(f.t, sub) }));
  const offs = out.map((f) => Math.abs(f.off)); return { falls: out, maxOff: offs.length ? Math.max(...offs) : 0, meanOff: offs.length ? offs.reduce((a, b) => a + b, 0) / offs.length : 0 };
}
/** the touchdown time of every jump / hop in a built track (song time) */
export const landings = (track) => track.segs.filter((s) => s.touch != null).map((s) => s.touch);
