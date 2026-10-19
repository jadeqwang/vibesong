// ACT II (41.028-77.757) · THE PLAN: one pure, DOM-free module that is the single source of truth for
//   - every measured cue Act II keys to (CUE),
//   - the layout of the level the party builds (fixtures sweep, functions, the three switches, hat chunks, gate),
//   - the exact frame every stroke / block is DRAWN (LOC events: src/show/loc.js ACT II block reads them), and
//   - the REALITY build-bar increments (src/show/build_bar.js reads them).
// The scene (chorus.js) draws from the same data, so LINES OF CODE and the build bar move on the exact frame a
// block appears. Everything is a function of the render fps (frame-snapped with T.snap), memoised per fps.
import * as T from '../../show/timing.js';
import { mulberry32 } from '../../util.js';

/** measured cues (song seconds). Syllable onsets of line 13 measured on the vocal stem (20 ms RMS dips). */
export const CUE = {
  downbeat: 41.028,
  stop: [43.90, 44.47],                       // instrumental stop under "read" (measured)
  comment: [48.62, 48.74, 49.36, 49.76, 50.26], // "I just ask my-self"  -> '//' 'what' 'do' 'I' 'need?'
  promptChar: 50.66,                           // "what" -> the '>' of the command line
  cmd: [51.08, 51.86, 52.54],                  // "is" "that" "I" -> 'level' 'up' 'reality'
  enter: 52.62,                                // "need?" = ENTER
  ohs: [59.555, 59.975, 60.425],               // oh oh oh (measured onsets)
  goes: 61.30,                                 // "And everything goes from there"
  build: 67.778,                               // bar 41: the build (bar sticks at 99%)
  shout: 72.125,                               // vocal_accent of 一切从这里出发 (hard cut to the gate)
  chu: 73.057, fa: 73.555,
  reds: [75.27, 76.10, 76.93], green: 77.757,  // countdown lights; GREEN = handoff to Act III
  launch: 79.64, silence: 79.87, impact: 80.81,
};

export const FLOOR = 60;
/** layout (world game-px, y up). Reading / prompt order left->right: Charlie, Jade, Ricky (mock B5: Jade centred
 *  under the prompt), so nobody crosses anybody between the page sky, the prompt and the three functions. */
export const LAY = {
  read: { charlie: [-800, 226], jade: [-700, 240], ricky: [-600, 214] },   // page-platform centre x, top y
  party: { charlie: -800, jade: -700, ricky: -600 },                        // on the editor floor (prompt)
  core: [-864, -448],                    // fixtures ground columns (16 px tiles, 2 rows)
  spring: -704,                          // function 1 (Jade bounces)
  lift: { x0: -808, w: 32, top: [68, 116] },  // function 2 (Charlie rides it up to his throwing perch)
  door: -560, lintel: [[-576, 90], [-560, 90]], // function 3 (Ricky walks through), door frame 20x30 centred at x
  switches: [[-660, 128], [-836, 128], [-760, 100]],   // ▶ switch centres for spring / lift / door
  muzzle: [-630, 84],                    // Ricky's guitar (standing at party.ricky facing LEFT)
  bricks: [[-504, 116], [-488, 116], [-472, 88], [-456, 88]],  // floating function bricks (execute on rings)
  rickyPlay: -520,                       // Ricky plays the rings from here (61.3-67.78)
  charliePerch: [-792, 116],             // Charlie on top of the raised lift
  ringC: [-520, 84],
  jadeLand: [-440, 61.94], jadeSpeed: 44.5,   // Jade lands from the spring launch and runs right, painting
  ground: [-432, 416],                   // hat-seeded ground columns (4 rows, = launch-set ground to x 432)
  // the build-run course (67.78-70): two of the hat-seeded chunks are shaped: a PIT with a spring in it, then a TOWER
  pit: { x0: -96, rows: [12, -4], spring: -72 },      // floor top 28; the spring (alive) launches them onto the tower
  tower: { x0: -48, rows: [92, 76, 60, 44, 28, 12, -4] },  // top 108
  plates: { charlie: 96, jade: 138, ricky: 54 },      // = LAUNCH.party (spread 42 px)
};

const S = (x) => T.snap(x);
let MEMO = null, MEMO_FPS = -1;

/** full plan (memoised per fps). */
export function plan() {
  if (MEMO && MEMO_FPS === T.fps()) return MEMO;
  MEMO_FPS = T.fps();
  const fpsHalf = 0.5 / T.fps();
  const loc = [];   // [t, n]
  const bar = [];   // [t, pct points]

  // ------------------------------------------------------------------ fixtures sweep (graphite pencil, "the fixtures")
  const FIX = [S(T.word(14, 3).start) - 0.12, S(T.word(14, 3).start) + 0.47];
  const FUN = S(T.word(14, 6).start);
  const FUNC_C = [-680, 80];
  const core = [];   // { x, y, kind, t (drawn), tc (coloured) }
  const [cx0, cx1] = LAY.core;
  for (let x = cx0; x <= cx1; x += 16) { core.push({ x, y: 44, kind: 'ground' }); core.push({ x, y: 28, kind: 'under' }); }
  LAY.lintel.forEach(([x, y]) => core.push({ x, y, kind: 'block' }));
  LAY.bricks.forEach(([x, y]) => core.push({ x, y, kind: 'brick' }));
  // gray stand-ins for the three functions + their switches (coloured by the oh-oh-oh clicks, not by the flood)
  const stand = [
    { x: LAY.spring, y: FLOOR, kind: 'spring', fn: 0 },
    { x: LAY.lift.x0, y: FLOOR, kind: 'lift', fn: 1 }, { x: LAY.lift.x0 + 16, y: FLOOR, kind: 'lift', fn: 1 },
    { x: LAY.door, y: FLOOR, kind: 'door', fn: 2 },
    ...LAY.switches.map(([x, y], i) => ({ x, y, kind: 'switch', fn: i })),
  ];
  const sweepT = (x) => S(FIX[0] + T.clamp01((x - cx0) / (cx1 + 16 - cx0)) * (FIX[1] - FIX[0]));
  for (const c of core) { c.t = sweepT(c.x + 8); c.tc = S(FUN + Math.hypot(c.x + 8 - FUNC_C[0], c.y + 8 - FUNC_C[1]) / 800); }
  for (const c of stand) c.t = sweepT(c.x);
  const all = [...core, ...stand];
  for (const c of all) { loc.push([c.t, 1]); bar.push([c.t, 20 / all.length]); }
  for (const c of core) bar.push([c.tc, 25 / core.length]);

  // ------------------------------------------------------------------ oh oh oh: three clicks run three functions
  const OHS = CUE.ohs.map(S);
  OHS.forEach((e) => bar.push([e, 5]));

  // ------------------------------------------------------------------ "everything goes from there": hats seed chunks
  const jadeX = (t) => LAY.jadeLand[0] + LAY.jadeSpeed * (t - LAY.jadeLand[1]);
  const jadeT = (x) => LAY.jadeLand[1] + (x - LAY.jadeLand[0]) / LAY.jadeSpeed;
  const hand = [LAY.charliePerch[0] + 10, LAY.charliePerch[1] + 30];
  const flight = (tx, ty) => { const d = Math.hypot(tx - hand[0], ty - hand[1]); return { dur: 0.32 + d / 760, apex: 26 + d * 0.28 }; };
  const chunks = [];
  // ground chunks (4 rows deep, 3 columns), seeded just ahead of Jade's feet (Kaizo-tight), then the far ones
  const [g0, g1] = LAY.ground; const nG = Math.ceil((g1 - g0) / 48);
  const PLATES = LAY.plates, LAMP_X = 158;
  let far = 0;
  for (let k = 0; k < nG; k++) {
    const x0 = g0 + 48 * k, cols = Math.min(3, (g1 - x0) / 16);
    const reach = jadeT(x0 - 6);   // lands ~4 frames before her foot needs it (Kaizo-tight)
    const land = reach <= CUE.build - 0.3 ? Math.max(62.05, reach) : 66.15 + (far++) * 0.125;
    const plates = Object.entries(PLATES).filter(([, px]) => px >= x0 && px < x0 + cols * 16).map(([h]) => h);
    const lamp = LAMP_X >= x0 && LAMP_X < x0 + cols * 16;
    const shaped = x0 === LAY.pit.x0 ? LAY.pit : x0 === LAY.tower.x0 ? LAY.tower : null;
    const rows = shaped ? shaped.rows : [44, 28, 12, -4], spring = shaped && shaped.spring !== undefined ? shaped.spring : null;
    chunks.push({ kind: 'ground', x: x0, y: rows[0], rows, spring, n: cols, land: S(land), size: cols * rows.length + plates.length + (lamp ? 1 : 0) + (spring !== null ? 1 : 0), plates, lamp,
      tx: x0 + cols * 8, ty: rows[0] + 16 });
  }
  // floating islands: rows of grass/brick/rainbow chunks around the core, the 79 other hats (99 total)
  const r = mulberry32(2026);
  const cand = [];
  const ROWS = [124, 156, 188, 220, 252, 284, 316, 348];
  for (const y of ROWS) {
    let x = -1420 + Math.floor(r() * 40);
    while (x < 340) {
      const n = 2 + Math.floor(r() * 3), gap = 26 + Math.floor(r() * 44);
      const xs = Math.round(x / 16) * 16, xe = xs + n * 16;
      const inCore = xe > -900 && xs < -420 && y < 200;          // keep the built level + the switches clear
      const inLane = xs > -440 && y < 140;                         // keep the air over Jade's run clear
      const inGate = xe > 20 && y < 188;                            // keep the 出发 launch framing clean
      if (!inCore && !inLane && !inGate) {
        const u = r(); const kind = u < 0.2 ? 'brick' : u < 0.36 ? 'rainbow' : u < 0.46 ? 'spring' : 'grass';
        cand.push({ kind, x: xs, y, n, d: Math.min(Math.hypot(xs + n * 8 + 450, (y - 150) * 1.4), Math.hypot(xs + n * 8 + 200, (y - 180) * 1.2)) });
      }
      x = xe + gap;
    }
  }
  cand.sort((a, b) => a.d - b.d);
  const islands = cand.slice(0, 99 - chunks.length);
  // throw schedule for the islands: one per beat at first, then faster and faster ("hat after hat after hat")
  islands.sort((a, b) => Math.hypot(a.x - hand[0], a.y - hand[1]) - Math.hypot(b.x - hand[0], b.y - hand[1]));
  const nI = islands.length;
  islands.forEach((c, i) => {
    const u = i / Math.max(1, nI - 1);
    const th = T.beat(145.5) + (66.95 - T.beat(145.5)) * (1 - Math.pow(1 - u, 2.4));
    c.tx = c.x + c.n * 8; c.ty = c.y + 16;
    const f = flight(c.tx, c.ty); const t0 = Math.min(th, 67.68 - f.dur); c.throw = S(t0); c.land = S(t0 + f.dur); c.apex = f.apex;
    c.size = c.n * 2 + (c.kind === 'spring' ? 1 : 0);
    chunks.push(c);
  });
  for (const c of chunks) if (c.throw === undefined) { const f = flight(c.tx, c.ty); c.throw = S(c.land - f.dur); c.apex = 4 + Math.hypot(c.tx - hand[0], c.ty - hand[1]) * 0.03; }   // ground seeds: flat frisbee throws (they cross the Ricky / Jade shots)
  chunks.sort((a, b) => a.throw - b.throw);
  chunks.forEach((c, i) => { c.i = i; });
  // colour: Jade paints ground chunks as she runs over them; at 66.11 her rainbow flood reaches every other chunk
  const FLOOD_T = S(T.beat(156)), FLOOD_C = [jadeX(T.beat(156)), 70];
  for (const c of chunks) {
    const byRun = c.kind === 'ground' && jadeT(c.x + 8) < FLOOD_T;
    c.tc = byRun ? S(Math.max(c.land + 0.1, jadeT(c.x + 8))) : S(Math.max(c.land + 0.12, FLOOD_T + Math.hypot(c.tx - FLOOD_C[0], c.ty - FLOOD_C[1]) / 520));
    c.tcCol = (x) => (byRun ? S(Math.max(c.land + 0.1, jadeT(x + 8))) : c.tc);   // per-column paint time
  }
  for (const c of chunks) { loc.push([c.land, c.size]); bar.push([c.land, 39 / chunks.length]); }

  // ------------------------------------------------------------------ rings (Ricky's runtime) and the gate
  const RINGS = [...T.beatsIn(T.beat(145) - 0.01, T.beat(152) - 0.01, 1), ...T.beatsIn(T.beat(152) - 0.01, CUE.build - 0.05, 2)].map(S);
  const strokes = (erupt, n, step) => [...Array(n).keys()].map((i) => S(erupt - 0.06 + i * step));
  const GATE = { chu: strokes(CUE.chu, 5, 0.072), fa: strokes(CUE.fa, 5, 0.084), dur: 0.07, half: fpsHalf };
  [...GATE.chu, ...GATE.fa].forEach((e) => loc.push([e, 1]));

  loc.sort((a, b) => a[0] - b[0]); bar.sort((a, b) => a[0] - b[0]);
  MEMO = { FIX, FUN, FUNC_C, OHS, core, stand, chunks, RINGS, GATE, PLATES, LAMP_X, jadeX, jadeT, hand, FLOOD_T, FLOOD_C, loc, bar };
  return MEMO;
}

/** LOC events for src/show/loc.js: [t0, dur, n] with dur 0 (a step on the exact frame the block is drawn). */
export function act2LocEvents() { return plan().loc.map(([t, n]) => [t - 1e-6, 0, n]); }
/** REALITY build-bar points reached by time t (before the 99% clamp). */
export function act2BarPoints(t) { let v = 0; for (const [e, p] of plan().bar) { if (t >= e - 1e-6) v += p; else break; } return v; }
