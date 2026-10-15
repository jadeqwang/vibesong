// ACT II · 41.028-77.757 · VOID / EDITOR: vibe coding (chorus 1 + build). One continuous editor world.
//  41.03  the party climbs on from 来: pages, docs, manuals, forum threads stream past like clouds; pages are the
//         stepping stones (landings on beats 97-100). Jade puts both pencils back in her bun (hair UP, hands free).
//  43.72  "read": she picks up a book; 43.90-44.47 (measured stop) FREEZE on Jade reading; the re-hit tosses it
//  46.05  they land on the editor canvas (dashed selection rectangle)
//  48.62  "I just ask myself...": prompt box `> what do I need?` typed per syllable, blinking cursor
//  54.84  "That's it": pencils out (hair DOWN). 55.83 "the fixtures": the graphite pencil draws a gray-box level in one
//         sweep; FIXTURES carved into the ground. 57.42 "the functions": the rainbow pencil touches it and it comes
//         alive (colour flood, spring, moving platform, door, waterfall, flowers); FUNCTIONS carved in rainbow
//  59.56 / 59.98 / 60.43  "Oh oh oh" (measured onsets): Ricky's power chord flips three far switches
//  61.3-67.6  "And everything goes from there": the level auto-extends in every direction, faster and faster, the camera
//         pulls back
//  67.78  build: the party runs right through the world they built; 72.125 (vocal_accent of 一切从这里出发) HARD CUT to the
//         launch set; 出 73.057 / 发 73.555 erupt as the starting gate; lights 75.27 / 76.10 / 76.93, GREEN 77.757 = handoff.
import * as T from '../../show/timing.js';
import { locAt } from '../../show/loc.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL, rainbowAt } from '../../core/palette.js';
import { BlueprintBG, Atlas, Batch, addParticleSprites, dust, debris, sparkle, shake, freeze } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { Track, smoothFollow } from '../../core/choreo.js';
import { TextSprite, blockText } from '../../core/text.js';
import { Quad, canvasTex, pixelCanvas } from '../../core/gfx.js';
import { HUD, Subtitle, subtitleFor, PromptBox } from '../../core/ui.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { Pencil } from '../../core/props.js';
import { act1Atlas, PencilRig } from '../act1/common.js';
import { cubeCanvas } from '../act1/kaizo_art.js';
import * as A2 from './art.js';
import { buildLaunchSet, LAUNCH } from './launch_set.js';
import { mulberry32 } from '../../util.js';

export async function setup(ctx) {
  const S = (x) => T.snap(x), B = (n) => S(T.beat(n));
  const T0 = ctx.entry.t0, STOP = [43.90, 44.47], OHS = [59.555, 59.975, 60.425].map(S), SHOUT = S(T.accent(17));
  const FIX = [S(T.word(14, 3).start) - 0.12, S(T.word(14, 3).start) + 0.45];        // the fixtures sweep
  const FUN = S(T.word(14, 6).start);                                                  // the functions touch
  const EXT = [S(T.line(16).start), 67.6];
  const st = new Stage2D(ctx, { bg: PAL.void });
  const bgq = st.add(new BlueprintBG(), Z.BG);

  // ---------------------------------------------------------------- atlas
  const atlas = act1Atlas(ctx.lib);
  atlas.add('fix', A2.fixtureTile(0), [0, 0]); atlas.add('fix1', A2.fixtureTile(1), [0, 0]);
  [0, 1, 2].forEach((v) => atlas.add('grass' + v, A2.grassTile(v), [0, 0])); [0, 1].forEach((v) => atlas.add('dirt' + v, A2.dirtTile(v), [0, 0]));
  atlas.add('brick', A2.brickTile(0), [0, 0]);
  atlas.add('spawn', pixelCanvas(16, 16, (g, px) => { px(0, 0, '#ffffff', 16, 1); px(0, 15, '#ffffff', 16, 1); px(0, 0, '#ffffff', 1, 16); px(15, 0, '#ffffff', 1, 16); }), [0, 0]);
  atlas.add('dash', pixelCanvas(4, 1, (g, px) => px(0, 0, PAL.gizmoBlue, 2, 1)), [0, 0]);
  atlas.add('dashv', pixelCanvas(1, 4, (g, px) => px(0, 0, PAL.gizmoBlue, 1, 2)), [0, 0]);
  atlas.add('bp', pixelCanvas(16, 16, (g, px) => { for (let i = 0; i < 16; i += 3) { px(i, 0, PAL.gizmoBlue, 2, 1); px(i, 15, PAL.gizmoBlue, 2, 1); px(0, i, PAL.gizmoBlue, 1, 2); px(15, i, PAL.gizmoBlue, 1, 2); } px(7, 7, '#1f3d7a', 2, 2); }), [0, 0]);
  atlas.add('bpHi', pixelCanvas(16, 16, (g, px) => { px(0, 0, '#9ec2ff', 16, 1); px(0, 15, '#9ec2ff', 16, 1); px(0, 0, '#9ec2ff', 1, 16); px(15, 0, '#9ec2ff', 1, 16); px(1, 1, '#14306a', 14, 14); }), [0, 0]);
  atlas.add('cubeW', cubeCanvas(18, PAL.gizmoBlue, false), [12, 12]);
  atlas.add('bang', pixelCanvas(9, 14, (g, px) => { px(1, 0, PAL.ink, 7, 12); px(0, 1, PAL.ink, 9, 10); px(1, 1, PAL.white, 7, 10); px(3, 2, PAL.red, 3, 5); px(3, 8, PAL.red, 3, 2); }), [4, 0]);
  [0, 1, 2, 3].forEach((f) => atlas.add('water' + f, A2.waterCanvas(f, 90), [0, 0]));
  atlas.add('spring0', A2.springCanvas(0, false), [7, 0]); atlas.add('spring0a', A2.springCanvas(0, true), [7, 0]); atlas.add('spring1a', A2.springCanvas(1, true), [7, 0]);
  [0, 0.5, 1].forEach((o, i) => { atlas.add('door' + i, A2.doorCanvas(o, true), [10, 0]); }); atlas.add('doorG', A2.doorCanvas(0, false), [10, 0]);
  atlas.add('leverR', pixelCanvas(8, 14, (g, px) => { px(0, 0, PAL.g0, 8, 4); px(1, 1, PAL.g3, 6, 2); px(1, 4, PAL.g1, 2, 9); px(0, 11, PAL.red, 4, 3); }), [4, 0]);
  atlas.add('leverG', pixelCanvas(8, 14, (g, px) => { px(0, 0, PAL.g0, 8, 4); px(1, 1, PAL.g3, 6, 2); px(5, 4, PAL.g1, 2, 9); px(4, 11, PAL.green, 4, 3); }), [4, 0]);
  const PAGES = ['page', 'manual', 'forum', 'code'];
  for (let i = 0; i < 12; i++) atlas.add('pg' + i, A2.pageCanvas(PAGES[i % 4], i + 1), [0, 0]);
  const clouds = st.add(new Batch(atlas, 300), Z.PARALLAX);
  const tiles = st.add(new Batch(atlas, 3000), Z.PLATFORM);
  const props = st.add(new Batch(atlas, 400), Z.PROP);
  const fx = st.add(new Batch(atlas, 1500), Z.FX);
  const front = st.add(new Batch(atlas, 50), Z.FRONT);

  // ---------------------------------------------------------------- the launch set (end state, shared with Team B)
  const set = await buildLaunchSet(st, ctx, { withBackground: false });

  // ---------------------------------------------------------------- page stepping-stones (Jade lands on beats)
  const STONES = [[-1300, 110, 97, 2], [-1252, 138, 98, 4], [-1200, 166, 99, 10], [-1146, 192, 100, 1], [-1075, 162, 105, 6], [-1010, 128, 106, 3], [-948, 96, 107, 8]];
  // [x (landing), y (page top), beat index of landing, page sprite]
  const stoneW = (k) => atlas.map.get('pg' + STONES[k][3]).w, stoneH = (k) => atlas.map.get('pg' + STONES[k][3]).h;
  const FLOOR_Y = 60, CANVAS = [-900, -470];
  // the book she reads
  const book = st.add(new Quad(canvasTex(A2.bookCanvas()), 26, 14, { anchor: [13, 0] }), Z.ACTOR_FRONT);

  // ---------------------------------------------------------------- Jade's course; followers = delayed path (as Act I)
  const RUN_END = 71.8, STOP_X = 112;                     // the party is in frame (stopped) before the shout cut
  const HOPS = T.beatsIn(68.9, RUN_END - 0.1, 0.5).map(S);   // landing times (half-bar grid)
  const runX = (t) => -756 + (STOP_X + 756) * T.clamp01((t - 68.0) / (RUN_END - 68.0));
  const tr = new Track({ x: -1330, y: -20, anim: 'jump' });
  tr.jump(T0 - 0.2, B(97), STONES[0][0], STONES[0][1], { apex: 40 });
  for (let k = 1; k < 4; k++) tr.jump(B(STONES[k - 1][2]) + 0.03, B(STONES[k][2]), STONES[k][0], STONES[k][1], { apex: 16 });
  tr.run(B(100), B(100) + 0.3, STONES[3][0] + 14, { stride: 5 }).hold(B(100) + 0.3, S(STOP[1]), { anim: 'idle' });
  tr.jump(S(STOP[1]) + 0.02, B(105), STONES[4][0], STONES[4][1], { apex: 14 });
  for (let k = 5; k < 7; k++) tr.jump(B(STONES[k - 1][2]) + 0.03, B(STONES[k][2]), STONES[k][0], STONES[k][1], { apex: 12 });
  tr.jump(B(107) + 0.03, B(108), -880, FLOOR_Y, { apex: 16 })
    .run(B(108), B(110), -756, { stride: 6 })
    .hold(B(110), FIX[0] - 0.1, { anim: 'idle' })
    .hold(FIX[0] - 0.1, FUN + 0.7, { anim: 'idle' })
    .hold(FUN + 0.7, 68.0, { anim: 'idle' })
    // the build: run right through the world they built to the start line
    .path(68.0, RUN_END, (k, t) => {   // run right, hopping a brick on every half-bar (70-72 s energy)
      const x = runX(t); const hop = HOPS.find((h) => t >= h - 0.32 && t < h);
      if (hop) { const q = (t - (hop - 0.32)) / 0.32; return [x, FLOOR_Y + 22 * 4 * q * (1 - q), 'jump', q < 0.5 ? 0 : 1, true]; }
      return [x, FLOOR_Y, 'run', Math.floor(T.beatAt(t) * 8)];
    }, { anim: 'run' })
    .hold(RUN_END, 72.9, { anim: 'idle' })                                        // stop and look up at the words
    .jump(72.9, LAUNCH.chu.erupt, LAUNCH.party.jade, FLOOR_Y, { apex: 20 })      // land as 出 erupts
    .hold(LAUNCH.chu.erupt, 100, { anim: 'idle' });
  const jade = st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR + 2);
  const charlie = st.add(new Actor(ctx.lib, 'charlie'), Z.ACTOR + 1);
  const ricky = st.add(new Actor(ctx.lib, 'ricky'), Z.ACTOR);
  const heroes = [{ a: jade, d: 0, gap: 0 }, { a: charlie, d: T.beat(1) - T.beat(0.5), gap: LAUNCH.party.jade - LAUNCH.party.charlie }, { a: ricky, d: T.beat(1) - T.beat(0), gap: LAUNCH.party.charlie - LAUNCH.party.ricky }];
  // set-piece positions (fixtures/functions): Charlie bounces on the spring, Ricky on the stairs
  const SPRING_X = -608, STAIR_TOP = [-696, 108];
  const PENCILS_IN = B(97), PENCILS_OUT = S(T.line(13).start); // pencils out to 'type' the prompt

  // ---------------------------------------------------------------- the level they build (tile lists)
  const core = []; // { x, y, kind, t (reveal time by the sweep), d (distance from the functions touch) }
  const add = (x, y, kind = 'block') => core.push({ x, y, kind });
  for (let x = -800; x < -470; x += 16) { add(x, 44, 'ground'); add(x, 28, 'under'); }
  [[-736, 60], [-720, 60], [-720, 76], [-704, 60], [-704, 76], [-704, 92]].forEach(([x, y]) => add(x, y, 'block'));
  [[-656, 108], [-640, 108], [-624, 108]].forEach(([x, y]) => add(x, y, 'brick'));
  [[-576, 60], [-576, 76], [-576, 92]].forEach(([x, y]) => add(x, y, 'block'));
  [[-512, 60], [-496, 60], [-512, 76], [-496, 76]].forEach(([x, y]) => add(x, y, 'block'));
  const FUNC_C = [-650, 70];
  for (const c of core) { c.t = FIX[0] + ((c.x + 800) / 330) * (FIX[1] - FIX[0]); c.d = Math.hypot(c.x + 8 - FUNC_C[0], c.y + 8 - FUNC_C[1]); }
  const MOVER = [-552, 100], DOOR = [-504, 92], WATER_X = -478, LEVERS = [[-640, 124], [-570, 108], [-520, 92]];
  // FIXTURES / FUNCTIONS carved into the ground face (y 38..56)
  const fxText = blockText('FIXTURES', { font: 'px', cell: 2, face: PAL.g2, hi: PAL.g3, lo: PAL.g0, edge: PAL.g0 });
  const fixQ = st.add(new Quad(canvasTex(fxText.canvas), fxText.w, fxText.h), Z.PLATFORM + 2); fixQ.place(-794, 39);
  const fnText = blockText('FUNCTIONS', { font: 'px', cell: 2 });
  const fnQ = fnText.letters.map((L, i) => { const c = PAL.rainbow[(i * 4) % 12]; const q = st.add(new Quad(canvasTex(L.draw({ face: c, hi: '#ffffff', lo: PAL.ink, edge: PAL.ink })), L.w, L.h), Z.PLATFORM + 2); return { q, x: -632 + L.x0 }; });
  // auto-extension chunks (seeded), ordered by distance from the core, appearing faster and faster
  const r = mulberry32(77); const chunks = [];
  // terraces: clean grass-top platform rows at fixed altitudes, growing outward from the core (fewer, bolder, more air)
  const ROWS = [140, 204, 268, 332, 396];
  ROWS.forEach((y, ri) => {
    let x = -1640 + Math.floor(r() * 40);
    while (x < (y >= 140 ? -40 : -300)) {
      const n = 3 + Math.floor(r() * 5), gap = 40 + Math.floor(r() * 56);
      const overCore = x + n * 16 > -820 && x < -460 && y < 180;
      if (!overCore) {
        const kind = r() < 0.18 ? 'water' : r() < 0.3 ? 'pillar' : 'island';
        chunks.push({ x: Math.round(x / 16) * 16, y, kind, n, d: Math.hypot(x + n * 8 + 640, (y - 100) * 1.6) });
      }
      x += n * 16 + gap;
    }
    void ri;
  });
  for (let x = -1700; x < -800; x += 16) chunks.push({ x, y: 44, kind: 'ground', n: 1, d: Math.abs(x + 640) });
  for (let x = -464; x < LAUNCH.groundX[0]; x += 16) chunks.push({ x, y: 44, kind: 'ground', n: 1, d: Math.abs(x + 640) * 0.8 });
  chunks.sort((a, b) => a.d - b.d);
  chunks.forEach((c, i) => { const u = (i + 1) / chunks.length; c.t = T.nearestBeat(EXT[0] + (EXT[1] - EXT[0]) * Math.pow(u, 0.5), 4); });
  const groundAppear = (x) => { if (x < -464) return -1; const c = chunks.find((q) => q.kind === 'ground' && q.x === x); return c ? c.t : EXT[0] + (EXT[1] - EXT[0]) * Math.pow(Math.min(1, Math.abs(x + 640) * 0.8 / 1100), 2); };
  set.ground.forEach((q) => { q.userData.appear = groundAppear(Math.floor(q.position.x / 16) * 16); });

  // ---------------------------------------------------------------- pencils
  const gPencil = st.add(new Pencil({ kind: 'graphite', len: 60 }), Z.FRONT + 2);
  const rPencil = st.add(new Pencil({ kind: 'rainbow', len: 60 }), Z.FRONT + 2);
  // ---------------------------------------------------------------- UI
  const hud = st.addUI(new HUD(ctx.lib), ZUI.HUD);
  const sub = st.addUI(new Subtitle({ y: 150 }), ZUI.SUBS);
  const prompt = st.addUI(new PromptBox({ w: 190, x: 65, y: 118 }), ZUI.DIALOG);
  const subBot = st.addUI(new Subtitle({ y: 39 }), ZUI.SUBS);
  // the gang shout 一切从这里出发 slams in as hero type, word by word (出发 in rainbow, the gate erupts under it)
  const W17 = T.words(17); const CH = [['一', 0], ['切', 1], ['从', 2], ['这', 3], ['里', 3], ['出', 4], ['发', 5]];
  const chant = CH.map(([ch, wi], i) => { const q = new TextSprite({ text: ch, font: 'fp12', color: i >= 5 ? PAL.rainbow[i === 5 ? 0 : 8] : PAL.white, outline: PAL.ink, outline8: true, shadow: { dx: 1, dy: -1, color: PAL.ink } }, { anchor: 'c' });
    st.addUI(q, ZUI.BANNER); return { q, on: i === 0 ? SHOUT : S(W17[wi].start) + (ch === '里' ? 0.12 : 0), x: 160 - 3 * 30 + i * 30 }; });
  const words = [12, 13, 14, 16, 17].flatMap((id) => T.words(id));
  const cubes = [[-1240, 260, 22], [-1050, 40, 16], [-860, 230, 26], [-720, 250, 18], [-400, 220, 20]].map(([x, y, s], i) => { const cv = cubeCanvas(s, PAL.gizmoBlue, i % 2 === 1); const q = st.add(new Quad(canvasTex(cv), cv.width, cv.height), Z.PARALLAX + 1); return { q, x, y }; });
  // prompt typed per syllable: "what"(what) "do"(it, is) "I"(I) "need?"(need)
  const W13 = T.words(13), wt = (i) => S(W13[i].start);
  const PROMPT = 'what do I need?';
  const typed = (t) => {
    const keys = [[wt(4), 1], [wt(4) + 0.05, 2], [wt(4) + 0.1, 3], [wt(4) + 0.14, 5], [wt(5), 6], [wt(6), 8], [wt(8), 10], [wt(9), 11], [wt(9) + 0.06, 12], [wt(9) + 0.12, 13], [wt(9) + 0.18, 15]];
    let n = 0; for (const [e, k] of keys) if (t >= e) n = k; return n;
  };

  // ---------------------------------------------------------------- 46-55 s: the prompt is answered by blueprints
  const WD = (i) => S(W13[i].start);
  const typingAt = (u) => (u >= WD(0) && u < WD(3) + 0.3) || (u >= WD(4) && u < WD(9) + 0.5);
  // each typed word answers with blueprint outlines of part of the level (the FIXTURES sweep fills exactly these)
  const group = (c) => (c.kind === 'ground' || c.kind === 'under' ? 0 : c.x <= -704 ? 1 : c.kind === 'brick' || c.x === -576 ? 2 : 3);
  const GT = [WD(4), WD(5), WD(7), WD(8)];       // what / it / that / I
  for (const c of core) { const g = group(c); const spread = g === 0 ? (c.x + 800) / 330 * 0.35 : (core.filter((q) => group(q) === g).indexOf(c)) * 0.035; c.bp = GT[g] + spread; }
  const BP_EXTRA = [[MOVER[0], MOVER[1], 2], [SPRING_X - 7, FLOOR_Y, 1], [DOOR[0] - 10, DOOR[1], 1]].map(([x, y, n]) => ({ x, y, n, bp: WD(9) }));
  const THINK = [...Array(11).keys()].map((k) => B(109 + k));   // one wireframe cube per beat from the landing on: thinking
  const thinkCubes = THINK.map((e, i) => ({ e, x: -800 + ((i * 53) % 300), y: 100 + ((i * 37) % 70) }));
  const heroAt = (u, i, aheadX) => { const s = tr.at(u - heroes[i].d); if (i > 0 && s.x > aheadX - heroes[i].gap) s.x = aheadX - heroes[i].gap; return s; };
  const jadeOnly = new Set(['sing', 'draw_rainbow', 'draw_graphite', 'victory', 'drum']);

  return {
    stage: st,
    update(t) {
      const u = freeze(t, S(STOP[0]), S(STOP[1]));          // the stop under "read": everything holds
      const frozen = t >= S(STOP[0]) && t < S(STOP[1]);
      // ---------------------------------------------------------------- heroes
      const P = []; let ax = 1e9; heroes.forEach((h, i) => { const s = heroAt(u, i, ax); ax = s.x; P.push(s); });
      // Charlie on the spring, Ricky up the stairs once the level exists
      if (u > FUN + 0.5 && u < 67.9) {
        const bt = T.beatAt(u) % 1; const ph = (u - (FUN + 0.5)) < 0.3 ? 0 : 1;
        P[1] = { ...P[1], x: SPRING_X, y: FLOOR_Y + 22 + (ph ? Math.round(30 * 4 * bt * (1 - bt)) : 0), anim: 'jump', frame: bt < 0.5 ? 0 : 1, air: true };
        P[2] = { ...P[2], x: STAIR_TOP[0], y: STAIR_TOP[1], anim: 'idle' };
      } else if (u > FIX[1] + 0.2 && u < 67.9) { P[2] = { ...P[2], x: STAIR_TOP[0], y: STAIR_TOP[1], anim: 'idle' }; }
      // ---------------------------------------------------------------- camera
      let cx, cy, zoom = 1;
      const follow = (q) => { const s = tr.at(q); return [s.x + 50, Math.max(90, s.y + 36)]; };
      const [fx0, fy0] = smoothFollow(follow, u, 0.7, 11);
      const EDIT = [-640, 96];
      const ex = -690 + 50 * T.span(u, FIX[0] - 0.7, FIX[0] - 0.1, T.ease.inOut);   // party centred for the prompt, then the level
      const k1 = T.span(u, B(108) - 0.3, B(110), T.ease.inOut);
      cx = fx0 + (ex - fx0) * k1; cy = fy0 + (EDIT[1] - fy0) * k1;
      { const pin = T.span(u, S(T.line(13).start), WD(4), T.ease.inOut) * (1 - T.span(u, B(127), B(128) + 0.1, T.ease.inOut));
        zoom = 1 + 0.45 * pin; cx += (P[0].x + 40 - cx) * pin * 0.8 + 18 * pin * T.span(u, WD(4), B(127)); cy += (96 - cy) * pin; }   // ground stays above the HUD at zoom 1.45
      if (t >= EXT[0]) {                                       // pull back: the world keeps extending
        const k = T.span(t, EXT[0], 67.7, T.ease.in);
        zoom = 1 + (0.45 - 1) * k; cx = EDIT[0] + 70 * k; cy = EDIT[1] + 120 * k;
      }
      if (t >= 67.778) {                                       // build: push back in and track the run right
        const k = T.span(t, 67.778, 70.2, T.ease.inOut); const [jx] = [P[0].x];
        zoom = 0.45 + (1.25 - 0.45) * k; cx = (EDIT[0] + 70) + (jx + 40 - EDIT[0] - 70) * k; cy = (EDIT[1] + 120) + (84 - EDIT[1] - 120) * k; // tight on the run; the shout cuts wide
      }
      if (t >= SHOUT) { zoom = LAUNCH.camera.zoom; cx = LAUNCH.camera.x; cy = LAUNCH.camera.y; } // HARD CUT on the shout
      const sh = shake(t, [B(97), S(STOP[1]), FUN, ...OHS, SHOUT, LAUNCH.chu.erupt, LAUNCH.fa.erupt], { amp: 1, dur: 0.12 });
      st.cam.set({ x: cx, y: cy, zoom, shake: t >= LAUNCH.lights.reds[2] ? [0, 0] : sh });
      bgq.cover(st.cam); bgq.u.uTime.value = t;
      const L = st.cam.left, Rr = L + st.cam.vw, Bt = st.cam.bottom, Tp = Bt + st.cam.vh;
      // ---------------------------------------------------------------- clouds: pages streaming past
      clouds.begin(); front.begin();
      for (let i = 0; i < 26; i++) {
        const rr = mulberry32(i * 31 + 5); const speed = 18 + rr() * 40, span = 900;
        const x0 = -1500 + rr() * span, y0 = 20 + rr() * 300, nm = 'pg' + (i % 12);
        const x = -1560 + ((((x0 - speed * (u - T0)) + 1560) % span) + span) % span;
        if (u < FIX[0] - 1.2) clouds.draw(nm, x, y0 + Math.round(2 * Math.sin(u * 1.5 + i)), { color: i % 2 ? '#8a90b0' : '#ffffff' });
      }
      if (u > T0 && u < 47) for (let i = 0; i < 3; i++) { const x = -900 - ((u - T0) * 120 + i * 260) % 760; front.draw('pg' + (i * 5 % 12), x, 70 + i * 50); }
      clouds.end(); front.end();
      // stepping-stone pages (bob)
      props.begin();
      STONES.forEach(([x, y, , sp], k) => { const w = stoneW(k), h = stoneH(k); if (u < 47.5) props.draw('pg' + sp, x - Math.floor(w / 2), y - h + Math.round(Math.sin(u * 2 + k)), {}); });
      // followers standing still up in the page section get a page of their own under their feet
      if (u < B(108)) [1, 2].forEach((i) => { const s = P[i]; if (!s.air && s.y > 70 && s.anim !== 'run') props.draw('pg' + (i * 4 + 1), s.x - 17, s.y - 42 + Math.round(Math.sin(u * 2 + i))); });
      // ---------------------------------------------------------------- the editor canvas (dashed selection) and the level
      tiles.begin();
      const fixOn = (c) => u >= c.t, funOn = (c) => u >= FUN && c.d < 560 * T.span(u, FUN, FUN + 0.7, T.ease.out);
      if (!core.every(fixOn)) for (let x = CANVAS[0]; x < CANVAS[1]; x += 4) { if (u > FIX[0] + ((x + 800) / 330) * (FIX[1] - FIX[0]) && x > -800) continue; const mo = Math.floor(u * 16) % 4; tiles.draw('dash', x + mo, FLOOR_Y - 1); }
      HOPS.forEach((h) => tiles.draw('brick', Math.round(runX(h - 0.16)) - 8, FLOOR_Y));
      // blueprint outlines answering the prompt (pulse on the beat, all flash on bar 33 before "That's it")
      const pulse = T.beatPulse(u, 1, 0.12) > 0.6 && u > GT[0] && u < FIX[0];
      for (const c of core) { if (c.kind === 'under' || u < c.bp || fixOn(c)) continue; const age = u - c.bp; tiles.draw(age < 0.067 ? 'spawn' : (pulse || T.exactFrame(t, [B(128)]) ? 'bpHi' : 'bp'), c.x, c.y); }
      for (const e of BP_EXTRA) if (u >= e.bp && u < FIX[0] + 0.3) for (let i = 0; i < e.n; i++) tiles.draw(u - e.bp < 0.067 ? 'spawn' : 'bp', e.x + i * 16, e.y);
      if (u >= WD(9) && u < FUN + 0.25) for (let y = 60; y < 150; y += 16) tiles.draw('bp', WATER_X - 2, y);
      for (const c of core) {
        if (!fixOn(c)) continue;
        const alive = funOn(c);
        const nm = c.kind === 'under' ? (alive ? 'dirt' + ((c.x / 16) & 1) : 'fix1') : c.kind === 'ground' ? (alive ? 'grass' + (((c.x / 16) % 3 + 3) % 3) : 'fix') : c.kind === 'brick' ? (alive ? 'brick' : 'fix') : (alive ? 'grass1' : 'fix');
        const pop = u - c.t < 0.05;
        tiles.draw(pop ? 'spawn' : nm, c.x, c.y);
      }
      // moving platform, spring, door, waterfall, levers
      const alive = u >= FUN + 0.15;
      if (u >= FIX[0] + 0.4) {
        const mx = MOVER[0] + (alive ? Math.round(26 * Math.sin((u - FUN) * 2.2)) : 0);
        tiles.draw(alive ? 'brick' : 'fix', mx, MOVER[1]); tiles.draw(alive ? 'brick' : 'fix', mx + 16, MOVER[1]);
        const bt = T.beatAt(u) % 1;
        props.draw(alive ? (bt < 0.25 && u > FUN + 0.8 ? 'spring1a' : (u < FUN + 0.4 ? 'spring1a' : 'spring0a')) : 'spring0', SPRING_X, FLOOR_Y);
        props.draw(alive ? 'door' + Math.min(2, Math.floor((u - FUN - 0.15) * 8)) : 'doorG', DOOR[0], DOOR[1]);
        LEVERS.forEach(([lx, ly], i) => props.draw(t >= OHS[i] ? 'leverG' : 'leverR', lx, ly));
      }
      if (u >= FUN + 0.25) { const len = Math.min(90, Math.round((u - FUN - 0.25) * 300)); tiles.draw('water' + (Math.floor(u * 12) % 4), WATER_X, 150 - len, { sy: len / 90 }); }
      // flowers on the alive ground
      if (alive) for (let x = -792; x < -480; x += 22) { const c = core.find((q) => q.kind === 'ground' && q.x === Math.floor((x + 800) / 16) * 16 - 800); if (!c || !funOn(c)) continue; const age = u - FUN - c.d / 800; if (age > 0) fx.draw(`flower${(x / 22 | 0) % 7}_${Math.min(4, Math.floor(age * 20))}`, x, FLOOR_Y); }
      // the extension: chunks pop in, faster and faster
      for (const c of chunks) {
        if (u < c.t) continue; const pop = u - c.t < 0.05;
        if (c.kind === 'ground') { tiles.draw(pop ? 'spawn' : 'grass' + (((c.x / 16) % 3 + 3) % 3), c.x, 44); tiles.draw('dirt' + ((c.x / 16) & 1), c.x, 28); continue; }
        if (c.x + 100 < L - 40 || c.x > Rr + 40 || c.y > Tp + 40 || c.y + 80 < Bt - 40) continue;
        for (let i = 0; i < c.n; i++) { tiles.draw(pop ? 'spawn' : 'grass' + (i % 3), c.x + i * 16, c.y); tiles.draw('dirt' + (i & 1), c.x + i * 16, c.y - 16); }
        if (c.kind === 'pillar') for (let j = 1; j <= 3; j++) tiles.draw(pop ? 'spawn' : 'brick', c.x + 16, c.y + j * 16);
        if (c.kind === 'water') tiles.draw('water' + (Math.floor(u * 12) % 4), c.x + c.n * 8 - 6, c.y - 16 - 90 + 2);
      }
      tiles.end(); props.end();
      set.ground.forEach((q) => { q.visible = u >= q.userData.appear && u > EXT[0]; });
      set.update(t);
      // FIXTURES / FUNCTIONS carved
      fixQ.visible = u >= FIX[0] + 0.25; fixQ.place(-794, 39);
      fnQ.forEach((f, i) => { f.q.visible = u >= FUN + 0.05 + i * 0.03; f.q.place(f.x, 39 + (u - FUN - 0.05 - i * 0.03 < 0.05 ? 3 : 0)); });
      // ---------------------------------------------------------------- pencils
      gPencil.visible = u >= FIX[0] - 0.15 && u < FIX[1] + 0.25;
      if (gPencil.visible) { const k = T.span(u, FIX[0], FIX[1]); gPencil.set({ x: -800 + 330 * k, y: 70 + 60 * Math.sin(Math.PI * k) + 12, angle: -38 + 10 * Math.sin(u * 30) }); }
      rPencil.visible = u >= FUN - 0.25 && u < FUN + 0.6;
      if (rPencil.visible) { const k = T.span(u, FUN - 0.25, FUN, T.ease.out); rPencil.set({ x: FUNC_C[0] - 30 + 30 * k, y: FUNC_C[1] + 60 - 50 * k, angle: -30 }); }
      // ---------------------------------------------------------------- heroes
      heroes.forEach((h, i) => {
        const s = P[i]; const isJ = i === 0;
        let anim = s.anim; if (!isJ && jadeOnly.has(anim)) anim = 'idle';
        let pencil = isJ && (u < PENCILS_IN || u >= PENCILS_OUT);
        let frame = s.frame;
        if (isJ && pencil) {
          if (anim === 'idle') { anim = 'sing'; frame = 0; }
          if (u >= PENCILS_OUT && u < FIX[0] - 0.1) { anim = 'drum'; frame = typingAt(u) ? Math.floor(T.beatAt(u) * 4) % 2 : 0; }  // typing with her pencils
          if (u >= FIX[0] - 0.1 && u < FIX[1] + 0.2) { anim = 'draw_graphite'; frame = 0; }
          if (u >= FUN - 0.25 && u < FUN + 0.6) { anim = 'draw_rainbow'; frame = 0; }
          if (t >= LAUNCH.lights.reds[0] && s.anim === 'idle') { anim = 'drum'; frame = 0; }
        }
        if (!isJ && i === 2 && OHS.some((e) => t >= e && t < e + 0.2)) { anim = 'chord'; frame = 1; }
        if (i === 1 && u >= WD(4) && u < WD(4) + 0.6) { anim = 'pull'; frame = Math.min(2, Math.floor((u - WD(4)) * 8)); }
        if (i === 2 && u >= WD(7) && u < WD(9)) { anim = 'sustain'; frame = Math.floor(u * 8) % 2; }
        if ((i === 1 || i === 2) && u >= WD(9) && u < WD(9) + 0.36) { const k = (u - WD(9)) / 0.36; h.a.set({ ...s, y: s.y + Math.round(14 * 4 * k * (1 - k)), anim: 'jump', frame: k < 0.5 ? 0 : 1, facing: 1 }); return; }
        h.a.set({ ...s, anim, pencil, frame, facing: 1 });
      });
      // the book: picked up on "read", held through the stop, tossed on the re-hit
      const rd = S(T.word(12, 5).start);
      book.visible = u >= rd && u < S(STOP[1]) + 0.5;
      if (book.visible) { if (u < S(STOP[1])) book.place(P[0].x + 4, P[0].y + 12); else { const k = (u - S(STOP[1])) / 0.5; book.place(P[0].x + 4 - 120 * k, P[0].y + 16 + 80 * k - 120 * k * k); } }
      // ---------------------------------------------------------------- FX
      fx.begin();
      sparkle(fx, u, PENCILS_IN, P[0].x, P[0].y + 42, { n: 8, r: 10, color: PAL.capBlue });
      sparkle(fx, u, PENCILS_OUT, P[0].x, P[0].y + 42, { n: 8, r: 10, color: PAL.capPink });
      STONES.forEach(([x, y, b], k) => dust(fx, u, B(b), x, y, { n: 4, seed: k + 3, spread: 8 }));
      dust(fx, u, B(108), -880, FLOOR_Y, { n: 6, seed: 9 });
      if (u > FIX[0] && u < FIX[1] + 0.1) for (let k = 0; k < 6; k++) { const e = u - k / 30; const kk = T.span(e, FIX[0], FIX[1]); debris(fx, u, e, -800 + 330 * kk, 70 + 60 * Math.sin(Math.PI * kk), { n: 2, seed: k + Math.floor(e * 30), names: ['crumb1', 'px1'], color: PAL.g1, dur: 0.4 }); }
      sparkle(fx, u, FUN, FUNC_C[0], FUNC_C[1], { n: 16, r: 60, dur: 0.7 });
      thinkCubes.forEach((c) => { if (u >= c.e && u < FIX[0]) { const a = u - c.e; fx.draw(a < 0.067 ? 'px2' : 'cubeW', c.x, c.y + Math.round(4 * Math.sin(u * 2 + c.x)), a < 0.067 ? { s: 6 } : {}); } });
      for (let k = 0; k < 4; k++) sparkle(fx, u, GT[k], P[0].x + 14, P[0].y + 30, { n: 5, r: 12, seed: 40 + k, color: PAL.gizmoBlue });   // keystroke sparks
      if (u >= WD(9) && u < WD(9) + 0.6) [1, 2].forEach((i) => fx.draw('bang', P[i].x, P[i].y + 46 + (u - WD(9) < 0.067 ? 3 : 0)));
      OHS.forEach((e, i) => {
        const [lx, ly] = LEVERS[i]; const ag = t - e;
        if (ag >= 0 && ag < 0.16) { const k = ag / 0.16; fx.draw('arc' + [8, 12, 16][Math.min(2, Math.floor(k * 3))], STAIR_TOP[0] + 24 + (lx - STAIR_TOP[0] - 24) * k, STAIR_TOP[1] + 22 + (ly + 8 - STAIR_TOP[1] - 22) * k); }
        sparkle(fx, t, e + 0.16, lx, ly + 10, { n: 8, r: 14, color: PAL.yellow });
      });
      sparkle(fx, t, LAUNCH.chu.erupt, LAUNCH.chu.x + 48, 90, { n: 14, r: 50, dur: 0.6 });
      sparkle(fx, t, LAUNCH.fa.erupt, LAUNCH.fa.x + 48, 90, { n: 14, r: 50, dur: 0.6 });
      debris(fx, t, LAUNCH.chu.erupt, LAUNCH.chu.x + 48, 62, { n: 12, seed: 5, names: ['crumb0', 'crumb2'], vx: [-90, 90], vy: [60, 180], floor: 60 });
      debris(fx, t, LAUNCH.fa.erupt, LAUNCH.fa.x + 48, 62, { n: 12, seed: 6, names: ['crumb0', 'crumb2'], vx: [-90, 90], vy: [60, 180], floor: 60 });
      fx.end();
      cubes.forEach((c, i) => { c.q.place(c.x + (L + 640) * 0.3, c.y + Math.round(3 * Math.sin(t + i))); c.q.visible = t < SHOUT; });
      // ---------------------------------------------------------------- UI
      const singing = words.some((w) => t >= w.start && t < w.end) && Math.floor(t * 8) % 2 === 0;
      hud.set({ singing: { jade: singing }, loc: locAt(t) });
      let c = null; for (const id of [12, 13, 14, 16]) { const q = subtitleFor(t, id, { hold: 0.3 }); if (q) c = q; }
      if (t > 66.5 && t < 72.0) c = null;   // the held "there": let the world extend
      sub.set(c);
      // the chant row (hero type, UI), and its translation in the bottom slot
      chant.forEach((c) => { const a = t - T.snap(c.on); c.q.visible = t >= SHOUT && a >= 0 && t < 75.4; if (c.q.visible) { c.q.setScale(a < 0.034 ? 2.8 : a < 0.067 ? 2.3 : 2); c.q.place(c.x, 166); } });
      subBot.set(t >= SHOUT && t < 75.4 ? { top: null, bot: 'everything starts from here!' } : null);
      prompt.visible = t >= S(T.line(13).start) - 0.1 && t < S(T.line(14).start) + 0.3;
      if (prompt.visible) prompt.set({ text: PROMPT, reveal: typed(t), t });
      st.fx.flash = T.exactFrame(t, [SHOUT]) ? 0.9 : T.exactFrame(t, [FUN, ...OHS, LAUNCH.lights.green]) ? 0.45 : T.exactFrame(t, [S(STOP[0])]) ? 0.35 : 0;
      void frozen; void rainbowAt;
    },
  };
}
