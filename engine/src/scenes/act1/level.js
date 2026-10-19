// ACT I · LEVEL 1-1 · DRAFT: the ONE place for the Kaizo run's timing + layout + Eraser rules + LINES OF CODE events.
// Pure and synchronous (imports timing only) so src/show/loc.js can derive the counter from the same numbers that
// kaizo.js draws, without setting up any scene (partial renders of later acts still show the right count).
//
// Clocks: t = song time. u = SCENE time (the party's clock): frozen through the two instrumental stops (16.73-17.44,
// 23.695-24.22) and stuttered on the measured stutter hits (29.08-31.0). The Eraser lives on t (it creeps in the stops).
// Everything keys to measured cues / the beat grid (T helpers), never BPM math.
import * as T from '../../show/timing.js';
import { stutter } from '../../core/fx.js';

export const FLOOR = 60, V = 140;
// (v4b color M3) the bridge word + its flower-cell glyphs (rows top-down: 2 ascender rows + 5 x-height rows; '#' = one blossom cell).
// kaizo.js draws them; the geometry (letter x, the rub thresholds, the LOC blocks) is derived here so both files agree.
export const BRIDGE_WORD = 'blossoms', BRIDGE_CELL = 4;
export const BRIDGE_GLYPHS = {
  b: ['#...', '#...', '###.', '#..#', '#..#', '#..#', '###.'],
  l: ['##.', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  o: ['....', '....', '.##.', '#..#', '#..#', '#..#', '.##.'],
  s: ['....', '....', '.###', '#...', '.##.', '...#', '###.'],
  m: ['.....', '.....', '####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
};
/** the rubbing-edge x at which a bridge letter drops (60 % across it, as before) */
export const bridgeDropX = (b) => b.x + b.w * 0.6;
/** the floor lyric tiles end on "just": the held "blossoms" is the bridge (the flowers still bloom on the old tile spots, flowerTimes) */
export const FLOOR_LYRIC = 'Everything I love about life just';
const C = (k) => T.cue('act1.' + k);

let G = null;
/** lazily built constants (T must be loaded) */
export function L() {
  if (G) return G;
  const [F1a, F1b] = C('stop1'), [F2a, F2b] = C('stop2'); const d1 = F1b - F1a, d2 = F2b - F2a;
  const HITS = C('stutter_hits'), SPAN = C('stutter_span');
  const tau = (t) => {
    if (t >= F1a && t < F1b) return F1a;
    if (t >= F2a && t < F2b) return F2a - d1;
    const s = t >= SPAN[0] && t < SPAN[1] ? stutter(t, HITS, { start: SPAN[0], end: SPAN[1], play: 1 / 30 }) : t;
    return s - (t >= F1b ? d1 : 0) - (t >= F2b ? d2 : 0);
  };
  const S = (x) => T.snap(x), B = (n) => S(T.beat(n)), U = (x) => tau(S(x)), UB = (n) => tau(B(n));
  const T0 = C('verse_drop');                                  // 14.012
  const J1 = (u) => 196 + V * (u - T0);                         // room 1 autoscroll (Jade)
  // ---------------------------------------------------------------- layout (world px, y up, floor top 60)
  const X = {};
  X.crate = [J1(14.862) + 19, J1(14.862) + 41];                // the solo crate (Jade vaults it: takeoff 14.862, lands 15.286)
  X.freezeJ = J1(F1a);                                          // Jade at the first stop (~576)
  X.pit0 = 606; X.bridgeY = FLOOR;                               // the "blossoms" bridge spans [pit0, pit1)
  X.pit1 = 784; X.ledgeY = 84; X.ledge0 = 790;                   // raised ledge after the bridge
  // (v4b color M3) the bridge word is "blossoms" (the held note 18.10-20.11; the stem audit moved "because" to 20.13, under card 03).
  // 8 letters in the span the 7 of "because" used: a 4 px flower-cell font, 1-cell strokes, glyphs 3-5 cells wide + a 1-cell gap.
  X.bridge = { word: BRIDGE_WORD, cell: BRIDGE_CELL, x0: X.pit0 + 2, letters: [] };
  { let c = 0; for (const ch of BRIDGE_WORD) { const wc = BRIDGE_GLYPHS[ch][0].length; X.bridge.letters.push({ ch, x: X.bridge.x0 + c * BRIDGE_CELL, wc, w: wc * BRIDGE_CELL }); c += wc + 1; }
    X.bridge.w = (c - 1) * BRIDGE_CELL; X.bridge.x1 = X.bridge.x0 + X.bridge.w; }   // [608, 764): 156 px ("because" was [608, 777))
  X.ch0 = 1136; X.ch1 = 1306; X.colW = 24;                       // the chasm (linked); far column [ch1, ch1+colW) carries the post
  X.post = X.ch1 + 12;
  X.life0 = 1372; X.lifeTop = 40;                                     // "life" block letters (landing platform; gold = colour, locked)
  X.floor3 = 1478;                                               // floor resumes after life
  // ---------------------------------------------------------------- the lead (Jade) course: x(u) keys
  const uRe = U(T.beat(41));                                     // 17.827: run resumes after the re-hit actions
  const uLedge = UB(44);                                         // lands on the ledge (19.095)
  const uStop = U(21.45);                                        // skids to a stop at the chasm edge
  const uLife = U(25.42);                                        // the chain of three lands on "life"
  X.stopJ = X.ch0 - 8;
  // surge / colour
  const uShield = UB(61), uShield1 = UB(63), uSpin = U(27.80), uRun2 = UB(68);
  X.lifeLandJ = X.life0 + 30;
  X.spinJ = 1650;                                                // where Jade spins and paints behind them
  X.colorL = X.spinJ - 16 * 6; X.colorR = X.spinJ + 8;           // the painted strip (6 tiles behind her)
  // draw-ahead
  const uXF = U(31.348);
  X.XF = 1936;                                                   // the floor runs out here
  X.k = [[X.XF + 22, X.XF + 78, 72], [X.XF + 92, X.XF + 132, 84], [X.XF + 182, X.XF + 232, 78], [X.XF + 246, X.XF + 300, 90]];  // 一 platforms [x0, x1, top]
  X.wall = [X.XF + 300, 22, 52];                                 // [x, w, h] on the last platform's end, stands on the ledge
  X.ledge2 = [X.XF + 300, X.XF + 420, 90];                       // the last ledge (graphite), then the edge of the page
  X.edge = X.ledge2[1];
  X.spring = [X.XF + 157, 60];                                   // the 丶 spring in Ricky's gap (bottom-centre)
  const landK = [UB(74), UB(75), UB(76), UB(77)];
  const lead = [
    [13.0, J1(13.0)], [F1a + 1e-4, J1(F1a + 1e-4)], [uRe, X.freezeJ],
    [uLedge, X.ledge0 + 16], [uStop - 0.16, X.stopJ - 10], [uStop, X.stopJ],
  ];
  G = { F1a, F1b, F2a, F2b, d1, d2, HITS, SPAN, tau, S, B, U, UB, T0, J1, X, uRe, uLedge, uStop, uLife, uShield, uShield1, uSpin, uRun2, uXF, landK, lead };
  // ---------------------------------------------------------------- draw events (song time) for LINES OF CODE
  G.post = [S(21.70), S(22.30)];                                 // the 丨 post (Jade's graphite, drawn remotely)
  G.platDraw = landK.map((u, k) => [u - 0.30, u - 0.14]);         // u-time windows: done >= 4 frames before the landing
  G.springDraw = [U(32.20), U(32.30)]; G.springColor = U(32.78);
  G.slams = C('pre_accents').map(S);                             // 35.64 / 36.49: the sung words slam solid
  G.wei = [S(38.25), S(39.12)]; G.lai = [S(39.20), S(40.20)];     // 未 / 来 drawn while they climb
  G.eraserLeap = [S(33.86), B(80)];                              // the smeared Eraser leaps the pit, lands on the last ledge (34.298)
  G.peer = S(34.55);
  return G;
}

// ---------------------------------------------------------------- THE ERASER (song time t)
// rubX(t): world x of its rubbing edge (everything GRAPHITE left of it is rubbed out). Rules (spec): it only erases
// graphite; speed follows the music (creeps in the stops, lunges on re-hits 17.44 / 24.22), stalls on colour (27.8+),
// can't be hurt (17.6 NOT VERY EFFECTIVE), stops at the edge of the world (34.30). After Jade's colour smears its face it
// no longer rubs anything out (the counter stops dropping): it skids, leaps, and peers.
export function rubX(t) {
  const g = L(), X = g.X;
  if (t < g.F1a + 0.02) return -1e9;
  return T.keys(t, [
    [g.F1a + 0.02, X.freezeJ - 260], [g.F1a + 0.17, X.freezeJ - 72], [g.F1b, X.freezeJ - 69],       // slides in, rubs to just behind Ricky
    [g.S(T.beat(41)), X.freezeJ - 68], [g.S(18.0), 533], [g.S(18.5), 627], [g.S(19.0), 725], [g.S(19.30), 759],   // chews "blossoms" letter by letter
    [19.75, 790], [20.4, 840],
    // (v4b color M3) the edge now trails Ricky's heels by ~13 px from the stop to 19.0 (it used to run 8-25 px AHEAD of him, so he ran on
    // rubbed-out floor and on letters that had already dropped). The drops run 18.44 (b) ... 19.08 (m), then the last s on 19.30, the
    // frame Ricky falls short off it ("because" ran 18.29 ... 19.27). Was: F1a+0.17 -64, F1b -56, beat 41 -52, 18.6 690, 19.30 772.
    [21.45, 980], [22.4, 1012], [23.3, 1060], [g.F2a, 1066], [g.F2b, 1072],                          // creeps up on the chasm edge
    [24.80, 1110], [25.20, 1116], [25.62, 1330], [25.75, 1360],                        // LUNGE: rushes the edge, leaps the chasm, the post is gone
    [26.29, 1466], [27.13, 1502], [27.80, 1540], [28.32, X.colorL],     // the surge (Ricky half a step from it), then colour stops it
    [31.0, X.colorL], [31.01, -1e9],
  ]);
}
/** Eraser body: { x (feet-centre), y, mode: 'chase'|'blink'|'skid'|'leap'|'peer'|'off', smear 0..4, rot (deg) } */
export function eraserAt(t) {
  const g = L(), X = g.X;
  if (t < g.F1a + 0.02) return { mode: 'off' };
  const smear = t < g.S(28.32) ? 0 : Math.min(4, 1 + g.HITS.filter((h) => t >= h).length / 2.5 | 0);
  if (t < g.S(31.0)) {
    const rx = rubX(t); let x = rx - 40, y = FLOOR;
    if (x > X.ch0 - 30 && x < X.ch1 + 10 && t > g.F2b) {            // the lunge across the chasm: an arc
      const u = T.span(t, 25.20, 25.62); x = 1064 + (X.ch1 + 6 - 1064) * T.ease.inOut(u); y = X.ledgeY + 40 * Math.sin(Math.PI * u);
    } else if (x >= X.ledge0 - 20 && x < X.ch0 + 20) y = X.ledgeY;
    else if (x >= X.ch1 && x < X.life0 + 10) y = X.ledgeY;
    const blink = t >= g.S(17.70) && t < g.S(18.30);
    const skid = t >= g.S(28.32);
    return { x, y, mode: blink ? 'blink' : skid ? 'skid' : 'chase', smear, rot: skid ? 8 : 0 };
  }
  // stuck on the colour strip until it gives up erasing and LEAPS the draw-ahead pit (never touching Jade's graphite)
  const [l0, l1] = g.eraserLeap;
  if (t < l0) return { x: X.colorL - 40, y: FLOOR, mode: 'skid', smear: 4, rot: 8, off: true };
  if (t < l1) { const u = T.span(t, l0, l1); return { x: X.colorL - 40 + (X.ledge2[0] + 30 - X.colorL + 40) * u, y: FLOOR + (X.ledge2[2] - FLOOR) * u + 150 * Math.sin(Math.PI * u), mode: 'leap', smear: 4, rot: -10 * (1 - u) }; }
  const sk = T.span(t, l1, g.peer, T.ease.out);
  const x = X.ledge2[0] + 30 + (X.edge - 52 - X.ledge2[0] - 30) * sk;
  return { x, y: X.ledge2[2], mode: t < g.peer ? 'skid' : 'peer', smear: 4, rot: t < g.peer ? 8 : -9 };
}

// ---------------------------------------------------------------- LINES OF CODE events (ACT I)
// Strokes of the title (cold_open.js plans, Make Me a Hanzi stroke lengths), the level chunk, flowers, the drawn post /
// platforms / spring, the slammed words, 未来; and -1 per graphite block on the frame the Eraser's rubbing edge passes it.
const LENS = { '一': [811], '丨': [829], '丶': [316], '未': [363, 607, 912, 498, 598], '来': [424, 131, 177, 706, 888, 450, 536], '画': [433, 321, 653, 209, 229, 242, 873, 397], '笔': [311, 187, 93, 276, 228, 123, 370, 409, 668, 1017] };
/** stroke completion times of a Hanzi2D.plan(t0, t1, { strokes, gap }) (same maths as hanzi2d.js) */
export function strokeEnds(ch, t0, t1, { strokes = null, gap = 0.15 } = {}) {
  const lens = LENS[ch]; const idx = strokes || lens.map((_, i) => i); const mx = Math.max(...lens);
  const Ls = idx.map((i) => Math.max(lens[i], 0.35 * mx)); const Gp = gap * mx; const tot = Ls.reduce((a, b) => a + b, 0) + Gp * (idx.length - 1);
  let acc = 0; return idx.map((i, k) => { acc += Ls[k]; const b = t0 + (acc / tot) * (t1 - t0); acc += Gp; return b; });
}
/** ACT I graphite blocks that exist in LEVEL 1-1 (x = where the rubbing edge removes it) + coloured ones (never removed) */
export function levelBlocks() {
  const g = L(), X = g.X, out = [];
  const cols = (a, b) => { for (let x = Math.floor(a / 16) * 16; x < b; x += 16) out.push({ x: x + 8, gr: true }); };
  out.push({ x: 100, gr: true });                                 // the giant 一 we dived into (one stroke)
  cols(176, X.pit0); cols(X.ledge0, X.ch0); cols(X.ch1, X.ch1 + X.colW); cols(X.floor3, X.XF); cols(X.ledge2[0], X.ledge2[1]);
  for (let i = 0; i < FLOOR_LYRIC.length; i++) out.push({ x: 214 + i * 9 + 4, gr: true });    // the lyric floor tiles (graphite letters; spaces are tiles too)
  out.push({ x: X.crate[0] + 8, gr: true });
  for (const b of X.bridge.letters) out.push({ x: bridgeDropX(b), gr: true });   // b l o s s o m s (the bridge)
  out.push({ x: X.ch0 - 4, gr: true });                            // the near pillar (anchor of the hyperlink)
  out.push({ x: X.wall[0] + 8, gr: true });                        // the graphite wall
  for (let i = 0; i < 4; i++) out.push({ x: X.life0 + i * 24, gr: false }); // "life" (gold: colour)
  return out;
}
let LOC = null;
export function act1LocEvents() {
  if (LOC) return LOC;
  const g = L(), N = C('whistle_notes').map(T.snap), KICK = T.snap(C('first_kick'));
  const ev = [];
  const add = (t, n) => ev.push([t, 0, n]);
  // the title, stroke by stroke (cold_open.js)
  add(KICK, 1);
  strokeEnds('笔', N[0], N[0] + 0.27, { gap: 0.1 }).forEach((t) => add(t, 1));
  add(N[1] + 0.1, 1);
  strokeEnds('画', N[2], N[2] + 0.5, { strokes: [0, 1, 2, 3, 4, 5, 6], gap: 0.1 }).forEach((t) => add(t, 1));
  add(N[3] - 0.01, 1);
  // RUN IT: the running 画 grows six flowers (paint_run_ship.js); then LEVEL 1-1 is generated as one chunk on the dive
  const hit = T.snap(C('chant_words')[2] + 0.17); for (let i = 0; i < 6; i++) add(T.snap(hit + 0.05 + i * 0.07), 1);
  const blocks = levelBlocks(); add(T.snap(13.92), blocks.length);
  // flowers bloom from the lyric tiles under Jade's sneakers (every other letter, colour = locked)
  flowerTimes().forEach((t) => add(t, 1));
  // the Eraser rubs graphite out: the frame its rubbing edge passes each block
  const tms = []; for (let t = g.F1a; t < 31.0; t += 1 / 120) tms.push(t);
  let run = -1e9; const passes = tms.map((t) => (run = Math.max(run, rubX(t))));
  for (const b of blocks) if (b.gr) { const i = passes.findIndex((x) => x >= b.x); if (i >= 0) add(T.snap(tms[i]), -1); }
  // Jade's drawn post (graphite: rubbed out by the lunge), the life flowers, platforms, spring, slams, 未来
  add(g.post[1], 1); { const i = passes.findIndex((x) => x >= g.X.post); if (i >= 0) add(T.snap(tms[i]), -1); }
  for (let i = 0; i < 6; i++) add(T.snap(25.42 + 0.05 * i), 1);
  const ut = (u) => tOfU(u);
  g.platDraw.forEach(([a, b]) => add(T.snap(ut(b)), 1));
  add(T.snap(ut(g.springDraw[1])), 1);
  add(g.slams[0], 3); add(g.slams[1], 4);
  strokeEnds('未', g.wei[0], g.wei[1], { gap: 0.12 }).forEach((t) => add(t, 1));
  strokeEnds('来', g.lai[0], g.lai[1], { gap: 0.12 }).forEach((t) => add(t, 1));
  LOC = ev.sort((a, b) => a[0] - b[0]);
  return LOC;
}
/** first song time whose scene time reaches u (inverse of tau, ignoring stops) */
export function tOfU(u) { const g = L(); let t = u; for (let k = 0; k < 4; k++) t += u - g.tau(t); return t; }
/** song times the lyric-floor flowers bloom (Jade's foot passes the tile; even letters only) */
export function flowerTimes() {
  const g = L(); const out = []; const LY = 'Everything I love about life just blossoms';   // the full line on purpose (M3): same blooms as before
  for (let i = 0; i < LY.length; i += 2) { if (LY[i] === ' ') continue; const x = 214 + i * 9 + 4; const u = (x - 196) / V + g.T0; if (u < g.F1a) out.push(T.snap(u)); }
  return out;
}

// ---------------------------------------------------------------- HANDOFF (41.028): see engine/HANDOFF_41.md
export const HANDOFF = {
  t: 41.0,                                                              // the last Act I frame (kaizo ends at 41.028)
  screen: { charlie: [211, 75], jadeHand: [194, 78], rickyHand: [225, 78] },   // 320x180 screen px, y up
  canopy: true, riseSpeed: 132, driftSpeed: 30,                         // px/s, still accelerating upward
  jadeHair: 'down', active: 'ricky', poses: { charlie: 'charlie_parachute_carry', jade: 'jade_dangle', ricky: 'ricky_dangle_play' },
};
