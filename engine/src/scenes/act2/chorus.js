// ACT II · 41.028-77.757 · VOID / EDITOR (chorus 1 + build) · v5, game-design pass (docs/game_design_acts1-3.md)
//  41.03  CUT: the party rides Charlie's hat-parachute up into a sky of floating pages (Jade on the left boot, Ricky on
//         the right boot playing the updraft). Jade drops onto her page (41.45), Ricky onto his (41.86), Charlie
//         steers back and lands in the middle (42.28). Each grabs a page they'd really read: Jade 字帖, Charlie SPEC.
//  42.42  "stuff": Ricky's TAB blows out of reach; 42.70 Charlie's boomerang hat curves out, hooks it (43.12) and
//         drops it in Ricky's hands (43.54). 43.72 "read": all three read.  43.90-44.47 STOP = reading freeze.
//  44.47  the pages fold into the HUD as context chips (字帖 / tab / spec), one per beat; the pages carry them down
//         onto the editor canvas (46.05).
//  48.62  the prompt box lands with the chips attached; `// what do I need?` typed on "I just ask my-self",
//         `> level up reality` one word per syllable ("is" "that" "I"), ENTER on "need?" (52.62): "✓ on it", the
//         REALITY build bar docks (src/show/build_bar.js) and the answer sketches in as blueprints.
//  55.7   "the fixtures": the graphite pencil sweeps the gray level in (every block = +1 LINE OF CODE, +bar);
//  57.42  "the functions": the rainbow touch floods it alive (switches + their functions stay gray).
//  59.56 / 59.98 / 60.43  oh oh oh: Ricky's chord clicks switch 1 (spring: Jade bounces), 2 (lift: Charlie rides
//         up to his perch), 3 (door: Ricky walks through). +5% each.
//  61.30-67.78 "And everything goes from there": PAINT + RUN + SHIP in parallel, staged as three closer shots and a
//         pull-back: S1 Charlie pulls hat after hat and throws them (HUD 🎩 ×1 -> ×99; every landing seeds a gray
//         chunk: +chunk size LOC); S2 Ricky's sound rings make every COLOURED block they touch execute; S3 Jade runs
//         and paints the chunks Charlie seeds just ahead of her feet; S4 pull back: her rainbow floods the rest.
//  67.78  the build: the bar sticks at 99%; everyone runs right to the start line.
//  72.125 HARD CUT (shout) to the 出发 gate; three pressure plates: Ricky (从), Charlie (这里), Jade (出) -> exit open,
//         出 73.057 / 发 73.555 erupt; red lights 75.27 / 76.10 / 76.93; GREEN 77.757 = handoff (HANDOFF_77.md).
// Timings / layout / every drawn block's frame: ./plan.js (shared with src/show/loc.js and src/show/build_bar.js).
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { locAt } from '../../show/loc.js';
import { BuildBar, buildAt } from '../../show/build_bar.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { BlueprintBG, Atlas, Batch, addParticleSprites, dust, debris, sparkle, shake, freeze } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { TextSprite, blockText } from '../../core/text.js';
import { Quad, canvasTex, pixelCanvas, rect } from '../../core/gfx.js';
import { HUD, HUD_H, Subtitle, subtitleFor, panel } from '../../core/ui.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { Pencil, flowerCanvas, FLOWER_COLORS, iconCanvas } from '../../core/props.js';
import { arcCanvas } from '../act1/common.js';
import { cubeCanvas } from '../act1/kaizo_art.js';
import * as A2 from './art.js';
import * as B from './b_art.js';
import { buildLaunchSet, LAUNCH } from './launch_set.js';
import { plan, CUE, LAY, FLOOR } from './plan.js';
import { HANDOFF as A1HANDOFF } from '../act1/level.js';
import { mulberry32 } from '../../util.js';

// Jade holds both pencils through all of Act II -> hair DOWN in every strip (canon gate, checked on every set()).
const JADE_OK = new Set(['jade_sing', 'jade_drum', 'jade_draw_graphite', 'jade_draw_rainbow', 'jade_run_hairdown', 'jade_back_hairdown',
  'jade_back_hairdown_run', 'jade_read', 'jade_dangle']);

export async function setup(ctx) {
  const lib = ctx.lib, S = (x) => T.snap(x), B_ = (n) => S(T.beat(n));
  const P = plan();
  // (v4 Pass B, type unit: cut snap) the three "oh" hits (chord click, switch, sparkle, 0.45 flash, shake) land on the
  // nearest 8th of analysis/timing.json (59.643 / 60.061 / 60.478; frame-snapped -10 / +6 / -11 ms) instead of the sung
  // onsets 59.555 / 59.975 / 60.425 (they were 45-94 ms off the grid). Was: OHS = P.OHS
  const T0 = ctx.entry.t0, STOP = CUE.stop.map(S), OHS = P.OHS.map((e) => S(T.nearestBeat(e, 2))), SHOUT = S(CUE.shout);
  const GOES = S(CUE.goes), BUILD = S(CUE.build), ENTER = S(CUE.enter);
  // (v4 Pass B, type unit: cut snap) the "functions" touch (rainbow pencil, 0.45 flash, shake, sparkle, FUNCTIONS letters) lands
  // on the nearest 8th (57.345, frame-snapped 57.333 = -12 ms) instead of the sung onset (57.42, the cut read +88 ms off the grid).
  // plan.js's core flood still radiates from its own FUN (57.42), 0.09 s after the touch. Was: P.FUN everywhere below.
  const FUN = S(T.nearestBeat(P.FUN, 2));
  const SHOTS = [GOES, B_(148), B_(152), B_(156), BUILD];          // S1 Charlie, S2 Ricky, S3 Jade, S4 pull back
  const st = new Stage2D(ctx, { bg: PAL.void });
  const bgq = st.add(new BlueprintBG(), Z.BG);

  // ---------------------------------------------------------------- atlas
  const atlas = addParticleSprites(new Atlas(2048));
  FLOWER_COLORS.forEach((c, i) => { for (let s = 0; s <= 4; s++) atlas.add(`flower${i}_${s}`, flowerCanvas(i, s), [2, 0]); });
  [8, 12, 16, 20, 24].forEach((r) => atlas.add('arc' + r, arcCanvas(r), [0, r + 1]));
  [6, 10, 14].forEach((L) => atlas.add('speed' + L, pixelCanvas(L, 1, (g, px) => px(0, 0, '#9ec2ff', L, 1)), [L, 0]));
  [6, 10, 14, 18, 22, 26].forEach((r) => atlas.add('wup' + r, B.waveUp(r), [r + 1, 0]));
  atlas.add('fix', A2.fixtureTile(0), [0, 0]); atlas.add('fix1', A2.fixtureTile(1), [0, 0]);
  [0, 1, 2].forEach((v) => atlas.add('grass' + v, A2.grassTile(v), [0, 0])); [0, 1].forEach((v) => atlas.add('dirt' + v, A2.dirtTile(v), [0, 0]));
  atlas.add('brick', A2.brickTile(0), [0, 0]);
  PAL.rainbow.forEach((h, i) => atlas.add('cblk' + i, pixelCanvas(16, 16, (g, px) => { px(0, 0, '#14121c', 16, 16); px(1, 1, h, 14, 14); px(1, 1, '#ffffff', 14, 2); px(1, 13, '#00000055', 14, 2); }), [0, 0]));
  atlas.add('spawn', pixelCanvas(16, 16, (g, px) => { px(0, 0, '#ffffff', 16, 1); px(0, 15, '#ffffff', 16, 1); px(0, 0, '#ffffff', 1, 16); px(15, 0, '#ffffff', 1, 16); }), [0, 0]);
  atlas.add('bp', pixelCanvas(16, 16, (g, px) => { for (let i = 0; i < 16; i += 3) { px(i, 0, PAL.gizmoBlue, 2, 1); px(i, 15, PAL.gizmoBlue, 2, 1); px(0, i, PAL.gizmoBlue, 1, 2); px(15, i, PAL.gizmoBlue, 1, 2); } px(7, 7, '#1f3d7a', 2, 2); }), [0, 0]);
  atlas.add('bpHi', pixelCanvas(16, 16, (g, px) => { px(0, 0, '#9ec2ff', 16, 1); px(0, 15, '#9ec2ff', 16, 1); px(0, 0, '#9ec2ff', 1, 16); px(15, 0, '#9ec2ff', 1, 16); px(1, 1, '#14306a', 14, 14); }), [0, 0]);
  atlas.add('dash', pixelCanvas(4, 1, (g, px) => px(0, 0, PAL.gizmoBlue, 2, 1)), [0, 0]);
  atlas.add('bang', pixelCanvas(9, 14, (g, px) => { px(1, 0, PAL.ink, 7, 12); px(0, 1, PAL.ink, 9, 10); px(1, 1, PAL.white, 7, 10); px(3, 2, PAL.red, 3, 5); px(3, 8, PAL.red, 3, 2); }), [4, 0]);
  atlas.add('spring0', A2.springCanvas(0, false), [7, 0]); atlas.add('spring0a', A2.springCanvas(0, true), [7, 0]); atlas.add('spring1a', A2.springCanvas(1, true), [7, 0]);
  [0, 0.5, 1].forEach((o, i) => atlas.add('door' + i, pixelCanvas(20, 30, (g, px) => { px(0, 0, '#14121c', 20, 30); px(1, 1, '#0d1430', 18, 29); for (let y = 4; y < 30; y += 5) px(3 + (y % 3), y, '#2b4a9a', 12, 1); px(1, 1, '#ffd23f', 18, 1); px(1, 1, '#ffd23f', 1, 29); px(18, 1, '#ffd23f', 1, 29); const w = Math.round(17 * (1 - o)); if (w > 0) { px(1, 1, '#a86a2a', w, 29); px(1, 1, '#c88a4a', w, 2); if (w > 6) px(w - 3, 15, PAL.yellow, 2, 2); } }), [10, 0])); atlas.add('doorG', A2.doorCanvas(0, false), [10, 0]);
  atlas.add('liftA', B.liftCanvas(), [0, 0]);
  atlas.add('liftG', pixelCanvas(32, 8, (g, px) => { px(0, 0, '#14121c', 32, 8); px(1, 1, PAL.g4, 30, 6); px(1, 1, PAL.g5, 30, 1); for (let x = 4; x < 30; x += 6) px(x, 3, PAL.g3, 2, 2); }), [0, 0]);
  [1, 2, 3].forEach((n) => ['off', 'on', 'hit'].forEach((s) => atlas.add(`sw${n}${s}`, B.switchBlock(n, s), [9, 9])));
  atlas.add('swG', pixelCanvas(18, 18, (g, px) => { px(0, 0, '#14121c', 18, 18); px(1, 1, PAL.g4, 16, 16); px(1, 1, PAL.g5, 16, 2); for (let y = -4; y <= 4; y++) px(7, 9 + y, PAL.g2, Math.round((4 - Math.abs(y)) * 1.3) + 1, 1); }), [9, 9]);
  ['wireG', 'wireOn', 'wireHit'].forEach((k, i) => atlas.add(k, B.dot(['#4a4a58', '#3ad06a', '#ffe14d'][i], 2), [1, 1]));
  atlas.add('arrowUp', B.arrowUp(), [3, 0]);
  atlas.add('impact', B.impactCanvas(14), [14, 14]); atlas.add('impactS', B.impactCanvas(9), [9, 9]);
  const PAGES = ['page', 'manual', 'forum', 'code'];
  for (let i = 0; i < 12; i++) atlas.add('pg' + i, A2.pageCanvas(PAGES[i % 4], i + 1), [0, 0]);
  [14, 18, 24].forEach((s) => { atlas.add('cube' + s, cubeCanvas(s, PAL.gizmoBlue, false), [0, 0]); atlas.add('cubeD' + s, cubeCanvas(s, PAL.gizmoBlue, true), [0, 0]); });
  [0, 1, 2].forEach((f) => atlas.add('hat' + f, B.spriteFrame(lib, 'charlie_hat_boomerang', f), [8, 0]));
  { const sp = lib.get('charlie_prop_boomerang'); for (let f = 0; f < sp.n; f++) atlas.add('boom' + f, B.spriteFrame(lib, 'charlie_prop_boomerang', f), [sp.meta.anchor[0], sp.h - 1 - sp.meta.anchor[1]]); }
  const clouds = st.add(new Batch(atlas, 400), Z.PARALLAX);
  const back = st.add(new Batch(atlas, 4000), Z.BACK);
  const tiles = st.add(new Batch(atlas, 6000), Z.PLATFORM);
  const props = st.add(new Batch(atlas, 1500), Z.PROP);
  const fx = st.add(new Batch(atlas, 6000), Z.FX);
  // v4 colour script (engine/COLOR_REQUESTS.md H5-H7, tags only, no timing): what Jade's rainbow pencil touches keeps its colour
  const cTiles = st.add(new Batch(atlas, 1500), Z.PLATFORM); cTiles.userData.cs = 1;   // H5: the rainbow chunk tiles
  const cFx = st.add(new Batch(atlas, 600), Z.FX); cFx.userData.cs = 1;                // H5: her paint sparks, launch trail, paint tip
  const cHats = st.add(new Batch(atlas, 200), Z.PROP); cHats.userData.cs = 1;           // (v43 hat) Charlie's hats (in flight / seeding chunks) + the boomerang: canon tan, never graded

  // ---------------------------------------------------------------- the launch set (end state, shared with Team B)
  const groundChunk = (x) => P.chunks.find((c) => c.kind === 'ground' && x >= c.x && x < c.x + c.n * 16);
  const set = await buildLaunchSet(st, ctx, { withBackground: false, withGround: false,
    platesFrom: Math.min(...Object.values(LAUNCH.party).map((x) => groundChunk(x).land)), lampFrom: P.chunks.find((c) => c.lamp).land });

  // ---------------------------------------------------------------- page sky props (B4 canvases, Jade-approved)
  const pagePlat = Object.fromEntries(Object.entries(LAY.read).map(([h, [x, y]], i) => {
    const q = st.add(new Quad(canvasTex(B.platformPage(48, i + 1)), 48, 10), Z.PLATFORM); return [h, { q, x, y }]; }));
  const readCv = { jade: B.copybookPage(), charlie: B.specPage(), ricky: B.tabPage() };
  const readQ = Object.fromEntries(Object.entries(readCv).map(([h, cv]) => [h, st.add(new Quad(canvasTex(cv), cv.width, cv.height, { anchor: [0, 0] }), Z.ACTOR_FRONT)]));
  const PROP_PG = { jade: 'prop_page_zitie', charlie: 'prop_page_spec', ricky: 'prop_page_tab' };
  const smallQ = Object.fromEntries(Object.entries(PROP_PG).map(([h, n]) => {
    if (lib.has(n)) { const sp = lib.get(n); return [h, st.add(new Quad(sp.tex, sp.w, sp.h, { anchor: [sp.meta.anchor[0], sp.h - 1 - sp.meta.anchor[1]] }), Z.ACTOR_FRONT)]; }
    const cv = readCv[h]; const q = st.add(new Quad(canvasTex(cv), cv.width, cv.height, { anchor: [Math.floor(cv.width / 2), cv.height - 1] }), Z.ACTOR_FRONT); q.setScale(0.45); return [h, q];
  }));
  const chute = lib.get('charlie_prop_parachute');
  const canopy = st.add(new Quad(chute.tex, chute.w, chute.h, { anchor: [chute.meta.anchor[0], chute.h - 1 - chute.meta.anchor[1]] }), Z.ACTOR + 3); canopy.userData.cs = 1;   // (v43 hat)
  const boomSp = lib.get('charlie_prop_boomerang');
  const lai = await Hanzi2D.create('来', { size: 96, style: 'rainbow', shadowColor: '#0a1030', bold: 2 }); lai.setAll(1); st.add(lai.group, Z.PLATFORM + 1);
  const CARRY = lib.has('charlie_parachute_carry');

  // ---------------------------------------------------------------- actors (Jade: canon gate below)
  const jade = st.add(new Actor(lib, 'jade', { name: 'jade', strict: false }), Z.ACTOR + 2);
  const charlie = st.add(new Actor(lib, 'charlie'), Z.ACTOR + 1);
  const ricky = st.add(new Actor(lib, 'ricky'), Z.ACTOR);
  const has = (n) => lib.has(n);
  const setJade = (s) => {
    let anim = s.anim; if (anim === 'jade_read' && !has('jade_read')) anim = 'sing'; if (anim === 'jade_dangle' && !has('jade_dangle')) anim = 'drum';
    const strip = jade.stripFor(anim, true);
    if (!JADE_OK.has(strip)) throw new Error('Act II Jade canon: pencils in hand -> hair down, but strip ' + strip);
    jade.set({ facing: 1, ...s, anim, pencil: true });
  };
  const rawOr = (name, fb) => (has(name) ? name : fb);

  // ---------------------------------------------------------------- the level they build (FIXTURES / FUNCTIONS)
  const fxText = blockText('FIXTURES', { font: 'px', cell: 2, face: PAL.g2, hi: PAL.g3, lo: PAL.g0, edge: PAL.g0 });
  const fixQ = st.add(new Quad(canvasTex(fxText.canvas), fxText.w, fxText.h), Z.PLATFORM + 2); fixQ.place(-834, 45);
  const fnText = blockText('FUNCTIONS', { font: 'px', cell: 2 });
  const fnQ = fnText.letters.map((L, i) => { const c = PAL.rainbow[(i * 4) % 12]; const q = st.add(new Quad(canvasTex(L.draw({ face: c, hi: '#ffffff', lo: PAL.ink, edge: PAL.ink })), L.w, L.h), Z.PLATFORM + 2); q.userData.cs = 1; /* H6: the FUNCTIONS word is the stroke */ return { q, x: -700 + L.x0 }; });
  const gPencil = st.add(new Pencil({ kind: 'graphite', len: 60 }), Z.FRONT + 2);
  const rPencil = st.add(new Pencil({ kind: 'rainbow', len: 60 }), Z.FRONT + 2);
  // blueprint answer after ENTER: the plan of the level sketches in, a quarter per beat
  const BPG = [B_(124), B_(125), B_(126), B_(127)];
  const bpAt = (x) => BPG[Math.min(3, Math.floor((x - LAY.core[0]) / 112))];
  const switchT = (i) => OHS[i];

  // ---------------------------------------------------------------- UI
  // (v4) no HUD (LINES OF CODE / portraits / the hat counter retired); ONE subtitle slot, bottom centre (core/ui.js SUB_*)
  const sub = st.addUI(new Subtitle(), ZUI.SUBS);
  const bar = st.addUI(new BuildBar(), ZUI.BANNER);
  const pauseLbl = st.addUI(new TextSprite({ text: '❚❚ READ', font: 'sk', color: '#9ec2ff', outline: '#05060d' }, { anchor: 'tl' }), ZUI.BANNER); pauseLbl.place(6, 176);
  // CONTEXT ASSEMBLY (44.5-47.7): the prompt box frames up out of blueprint gizmos while each reader's page flies into
  // it as an attachment chip, one per beat (CLICK); the box goes solid on beat 111 so 48.62 starts typing at once.
  const CHIPS = [['charlie', 'spec'], ['jade', '字帖'], ['ricky', 'tab']];
  const CLICK = { jade: B_(108), ricky: B_(109), charlie: B_(110) };
  const FOLD = Object.fromEntries(Object.entries(CLICK).map(([h, e]) => [h, e - 0.3]));   // a page leaves its reader
  const BOX_GIZMO = B_(107), BOX_EDGES = [B_(107), B_(108)], BOX_SOLID = B_(111);
  // the prompt box, staged like mock B5 but bigger: 290x66 centred over Jade; the command line at 2x
  const PB = { x: 15, y: 84, w: 290, h: 66 };
  const chipQ = CHIPS.map(([h, lab]) => { const cv = B.chipCanvas(lab); const q = st.addUI(new Quad(canvasTex(cv), cv.width, cv.height), ZUI.DIALOG + 1); return { h, q, w: cv.width }; });
  { let x = PB.x + 7; chipQ.forEach((c) => { c.inBox = [x, PB.y + PB.h - 17]; x += c.w + 4; }); }
  const box = st.addUI(panel(PB.w, PB.h, 'dialog'), ZUI.DIALOG);
  const bpFill = st.addUI(rect(PB.w - 2, PB.h - 2, '#0a1840', 0.55), ZUI.DIALOG); bpFill.place(PB.x + 1, PB.y + 1);
  const edges = [0, 1, 2, 3].map(() => st.addUI(rect(1, 1, '#4f8bff'), ZUI.DIALOG + 0.2));
  const gizmos = [[PB.x, PB.y], [PB.x + PB.w, PB.y], [PB.x, PB.y + PB.h], [PB.x + PB.w, PB.y + PB.h]].map(([x, y]) => { const q = st.addUI(rect(5, 5, '#9ec2ff'), ZUI.DIALOG + 0.3); q.place(x - 2, y - 2); return q; });
  const l1 = st.addUI(new TextSprite({ text: '', font: 'fp12', color: '#7aa08a' }, { anchor: 'bl' }), ZUI.DIALOG + 0.5);
  const l2 = st.addUI(new TextSprite({ text: '', font: 'fp12', color: PAL.termGreen }, { anchor: 'bl' }), ZUI.DIALOG + 0.5); l2.setScale(2);
  const cursor = st.addUI(rect(5, 9, PAL.termGreen), ZUI.DIALOG + 0.6);
  const entQ = [false, true].map((p) => { const q = st.addUI(new Quad(canvasTex(B.enterKey(p)), 15, 13), ZUI.DIALOG + 0.6); q.setScale(2); return q; });
  const ckQ = st.addUI(new Quad(canvasTex(B.checkGlyph()), 8, 7), ZUI.DIALOG + 1.6);
  const okQ = st.addUI(new TextSprite({ text: 'on it', font: 'fp12', color: PAL.yellow }, { anchor: 'bl' }), ZUI.DIALOG + 1.5);
  // the reply is a solid sticker over the box corner (so the box border never cuts through the glyphs)
  const badgeO = st.addUI(rect(86, 32, PAL.yellow), ZUI.DIALOG + 1.1), badgeI = st.addUI(rect(84, 30, '#14121c'), ZUI.DIALOG + 1.2);
  const COMMENT = ['//', ' what', ' do', ' I', ' need?'], CMD = [' level', ' up', ' reality'];
  const typedText = (t, toks, times, pre = '') => { let s = pre; toks.forEach((tok, i) => { const a = t - S(times[i]); if (a >= 0) s += tok.slice(0, Math.min(tok.length, 1 + Math.floor(a * 45))); }); return s; };
  // hat counter in Charlie's empty item slot
  // (loose meshes sort before every Group, so UI drawn over the HUD group goes in its own Group)
  const grp = (o, z) => { const g = new THREE.Group(); g.add(o); st.addUI(g, z); return o; };
  const hatIc = grp(new Quad(canvasTex(iconCanvas('hat')), 14, 14), ZUI.HUD + 3); hatIc.place(62, 11);
  const hatN = grp(new TextSprite({ text: '×1', font: 'skb', color: PAL.yellow, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bc' }), ZUI.HUD + 4);
  // chant row (hero type) + translation
  const W17 = T.words(17); const CH = [['一', 0], ['切', 1], ['从', 2], ['这', 3], ['里', 3], ['出', 4], ['发', 5]];
  const chant = CH.map(([ch, wi], i) => { const q = new TextSprite({ text: ch, font: 'fp12', color: i >= 5 ? PAL.rainbow[i === 5 ? 0 : 8] : PAL.white, outline: PAL.ink, outline8: true, shadow: { dx: 1, dy: -1, color: PAL.ink } }, { anchor: 'c' });
    if (i >= 5) q.userData.cs = 1;   // H7: the 出 发 chant echoes the rainbow 出发 (一切从这里 stays white)
    st.addUI(q, ZUI.BANNER); return { q, on: i === 0 ? SHOUT : S(W17[wi].start) + (ch === '里' ? 0.12 : 0), x: 140 - 3 * 28 + i * 28 }; });
  const words = [12, 13, 14, 16, 17].flatMap((id) => T.words(id));

  // ---------------------------------------------------------------- choreography helpers
  const lerp = T.lerp, E = T.ease;
  const arc = (t, t0, t1, x0, y0, x1, y1, h) => { const q = T.clamp01((t - t0) / (t1 - t0)); return [x0 + (x1 - x0) * q, y0 + (y1 - y0) * q + h * 4 * q * (1 - q), q]; };
  const bob = (u, k) => Math.round(Math.sin(u * 2 + k * 1.7));
  // parachute (Charlie's boots) path: rise with the updraft, drop Jade, drift right, drop Ricky, steer back, land
  // 41.028 matches act1/level.js HANDOFF.screen (feet, zoom 1): Charlie (146,122), Jade (124,96), Ricky (168,94)
  // 41.028 continues Act I's last frame exactly (act1/level.js HANDOFF, final for act1_v5): same screen position and grips,
  // still rising/drifting at Act I's speed for the first frames, then easing into the page-sky framing.
  const HO = A1HANDOFF, HOdt = T0 - HO.t;
  const SC0 = [HO.screen.charlie[0] + HO.driftSpeed * HOdt, HO.screen.charlie[1] + HO.riseSpeed * HOdt];
  const GRIP = { jade: [HO.screen.jadeHand[0] - HO.screen.charlie[0], HO.screen.jadeHand[1] - HO.screen.charlie[1]],
    ricky: [HO.screen.rickyHand[0] - HO.screen.charlie[0], HO.screen.rickyHand[1] - HO.screen.charlie[1]] };   // hand / strap points from Charlie's boots anchor
  const FEET = { jade: [GRIP.jade[0] - 9, GRIP.jade[1] - 41], ricky: [GRIP.ricky[0] + 2, GRIP.ricky[1] - 46] };   // dangle strip anchor -> feet
  const LAI0 = [165, -40];   // 来's box bottom-left on screen at 41.028 (its top strokes peek over the HUD, as in Act I)
  const S0 = [-690, 248], CAM0 = [S0[0] - SC0[0] + 160, S0[1] - SC0[1] + 90];
  const V0 = [HO.driftSpeed, HO.riseSpeed], LIN = T0 + 0.12;
  const CHUTE = [[LIN, S0[0] + V0[0] * (LIN - T0), S0[1] + V0[1] * (LIN - T0)], [S(41.25), LAY.read.jade[0] - FEET.jade[0], LAY.read.jade[1] - FEET.jade[1] + 2],
    [S(41.70), LAY.read.ricky[0] - FEET.ricky[0], LAY.read.ricky[1] - FEET.ricky[1] + 2], [B_(99), LAY.read.charlie[0], LAY.read.charlie[1]]];
  const chuteAt = (u) => {
    if (u < LIN) return [S0[0] + V0[0] * (u - T0), S0[1] + V0[1] * (u - T0)];
    let i = 0; while (i < CHUTE.length - 2 && u >= CHUTE[i + 1][0]) i++;
    const [ta, xa, ya] = CHUTE[i], [tb, xb, yb] = CHUTE[i + 1]; const k = (i === 0 ? E.out : E.inOut)(T.clamp01((u - ta) / (tb - ta)));
    return [lerp(xa, xb, k), lerp(ya, yb, k)];
  };
  const JDROP = S(41.25), JLAND = B_(97), RDROP = S(41.70), RLAND = B_(98), CLAND = B_(99);
  const GRAB = { jade: B_(98), charlie: CLAND + 0.1 };
  const GUST = S(T.word(12, 3).start), THROW = B_(100), HOOK = B_(101), CATCH = B_(102), HATBACK = S(43.80), READ = S(T.word(12, 5).start);
  const DESC = [B_(105) + 0.02, B_(107)];                     // pages carry them down onto the editor canvas (still reading)
  const platTop = (h, u) => { const [, y] = LAY.read[h]; return Math.round(lerp(y, FLOOR, E.inOut(T.span(u, DESC[0], DESC[1])))) + (u < DESC[0] ? bob(u, h.length) : 0); };
  // TAB: drifts in, gust blows it up-right, boomerang hooks it and brings it back to Ricky
  const TAB_FAR = [-568, 292];
  const handPt = (h, x, y) => [x + 16, y + 1];
  const boomPath = (u, rx, ry, cx, cy) => {          // -> [x, y] or null
    if (u < THROW || u >= HATBACK) return null;
    const bez = (a, c, b, q) => [(1 - q) * (1 - q) * a[0] + 2 * (1 - q) * q * c[0] + q * q * b[0], (1 - q) * (1 - q) * a[1] + 2 * (1 - q) * q * c[1] + q * q * b[1]];
    const A = [cx + 10, cy + 32];
    if (u < HOOK) return bez(A, [-690, 350], TAB_FAR, E.out(T.span(u, THROW, HOOK)));
    if (u < CATCH) return bez(TAB_FAR, [-548, 330], [rx + 6, ry + 40], E.inOut(T.span(u, HOOK, CATCH)));
    return bez([rx + 6, ry + 40], [-700, 330], [cx, cy + 46], E.in(T.span(u, CATCH, HATBACK)));
  };
  // ohs: lift rise, spring bounce
  const LIFT_UP = [OHS[1], OHS[1] + 0.33];
  const liftTop = (u) => Math.round(lerp(LAY.lift.top[0], LAY.lift.top[1], E.inOut(T.span(u, LIFT_UP[0], LIFT_UP[1]))));
  const RWALK = [S(60.62), S(61.22)];
  const JLAUNCH = [GOES, S(LAY.jadeLand[1])];
  // build run (67.78-72.1): Jade jogs right to the start line; the others catch up from their posts
  // the course to the gate is built from the hat-seeded chunks: sprint, drop into the PIT onto the spring (a function
  // they made), launch onto the TOWER, hop down, jog to the start line. Followers run the same path behind her:
  // Charlie an 8th, Ricky (heavy) a beat behind; his spring landing on the tower edge is the near-miss.
  const STOPS = { jade: LAUNCH.party.jade - 34, charlie: LAUNCH.party.charlie - 34, ricky: LAUNCH.party.ricky - 34 };
  const DELAY = { jade: 0, charlie: T.beat(162.5) - T.beat(162), ricky: T.beat(164) - T.beat(162) };   // Ricky (heaviest) trails two beats
  const PIT = LAY.pit, TOWER_TOP = LAY.tower.rows[0] + 16, PIT_TOP = PIT.rows[0] + 16;
  const CRS = { a: S(68.45), spring: B_(162), tower: B_(163), off: S(69.22), down: B_(164), stop: S(71.75) };
  const course = (t, LX = LAY.tower.x0 + 16, LH = 46) => {          // Jade's path from the build downbeat; t < BUILD extends it left (followers sprint in)
    const X0 = P.jadeX(BUILD);
    if (t < BUILD) return { x: X0 - 240 * (BUILD - t), y: FLOOR, anim: 'run', frame: Math.floor(T.beatAt(t) * 4) % 4 };
    if (t < CRS.a) return { x: lerp(X0, PIT.x0 - 8, T.span(t, BUILD, CRS.a)), y: FLOOR, anim: 'run', frame: Math.floor(T.beatAt(t) * 4) % 4 };
    if (t < CRS.spring) { const [x, y] = arc(t, CRS.a, CRS.spring, PIT.x0 - 8, FLOOR, PIT.spring, PIT_TOP + 12, 8); return { x, y, anim: 'jump', frame: 1, air: true }; }
    if (t < CRS.tower) { const [x, y, q] = arc(t, CRS.spring, CRS.tower, PIT.spring, PIT_TOP + 12, LX, TOWER_TOP, LH); return { x, y, anim: 'jump', frame: q < 0.5 ? 0 : 1, air: true }; }
    if (t < CRS.off) return { x: lerp(LX, LAY.tower.x0 + 42, E.in(T.span(t, CRS.tower, CRS.off))), y: TOWER_TOP, anim: 'run', frame: Math.floor(T.beatAt(t) * 4) % 4 };
    if (t < CRS.down) { const [x, y, q] = arc(t, CRS.off, CRS.down, LAY.tower.x0 + 42, TOWER_TOP, LAY.tower.x0 + 60, FLOOR, 12); return { x, y, anim: 'jump', frame: q < 0.5 ? 0 : 1, air: true }; }
    return { x: lerp(LAY.tower.x0 + 60, STOPS.jade, E.out(T.span(t, CRS.down, CRS.stop))), y: FLOOR, anim: t < CRS.stop ? 'run' : 'idle', frame: Math.floor(T.beatAt(t) * 4) % 4 };
  };
  const springFire = (u) => Object.values(DELAY).some((d) => u >= CRS.spring + d && u < CRS.spring + d + 0.12);
  // plates: one per chant beat
  const PL = LAUNCH.plates.step;

  function heroState(u, t) {
    const J = {}, C = {}, R = {};
    const [cx, cy] = chuteAt(u);
    // ------------------------------------------------ page sky (41.03-46.05)
    if (u < DESC[1] + 0.001) {
      // Charlie
      if (u < CLAND) Object.assign(C, { x: cx, y: cy, anim: CARRY ? 'charlie_parachute_carry' : 'charlie_hang', frame: Math.floor(T.beatAt(u)) % (CARRY ? 3 : 2) });
      else {
        const y = platTop('charlie', u); Object.assign(C, { x: LAY.read.charlie[0], y, anim: 'idle', frame: 0 });
        if (u >= THROW && u < THROW + 0.2) Object.assign(C, { anim: 'throw', frame: u < THROW + 0.07 ? 0 : 1 });
      }
      // Jade
      if (u < JDROP) Object.assign(J, has('jade_dangle') ? { x: cx + GRIP.jade[0], y: cy + GRIP.jade[1], anim: 'jade_dangle', frame: Math.floor(T.beatAt(u)) % 2 } : { x: cx + FEET.jade[0], y: cy + FEET.jade[1], anim: 'drum', frame: 1 });
      else if (u < JLAND) { const [x, y] = arc(u, JDROP, JLAND, cx + FEET.jade[0], cy + FEET.jade[1], LAY.read.jade[0], LAY.read.jade[1], 8); Object.assign(J, { x, y, anim: 'run_pencil', frame: 1 }); }
      else Object.assign(J, { x: LAY.read.jade[0], y: platTop('jade', u), anim: u >= GRAB.jade && u < FOLD.jade ? 'jade_read' : 'sing', frame: 0 });
      // Ricky (hangs by his strap, playing the updraft)
      if (u < RDROP) Object.assign(R, has('ricky_dangle_play') ? { x: cx + GRIP.ricky[0], y: cy + GRIP.ricky[1], anim: 'ricky_dangle_play', frame: Math.floor(T.beatAt(u) * 2) % 2 } : { x: cx + FEET.ricky[0], y: cy + FEET.ricky[1], anim: 'sustain', frame: Math.floor(u * 8) % 2, facing: -1 });
      else if (u < RLAND) { const [x, y] = arc(u, RDROP, RLAND, cx + FEET.ricky[0], cy + FEET.ricky[1], LAY.read.ricky[0], LAY.read.ricky[1], 6); Object.assign(R, { x, y, anim: 'jump', frame: 1 }); }
      else Object.assign(R, { x: LAY.read.ricky[0], y: platTop('ricky', u), anim: u >= CATCH && u < FOLD.ricky ? rawOr('ricky_read', 'idle') : 'idle', frame: 0 });
      if (C.anim === 'idle' && u >= GRAB.charlie && u < FOLD.charlie) C.anim = rawOr('charlie_read', 'idle');
      return { J, C, R };
    }
    // ------------------------------------------------ editor floor: prompt, fixtures/functions, ohs (46.05-61.30)
    if (u < GOES) {
      const P0 = LAY.party;
      Object.assign(J, { x: P0.jade, y: FLOOR, anim: 'sing', frame: 0 });
      Object.assign(C, { x: P0.charlie, y: FLOOR, anim: 'idle', frame: 0 });
      Object.assign(R, { x: P0.ricky, y: FLOOR, anim: 'idle', frame: 0, facing: -1 });
      // typing: Jade drums the keys with her pencils on the syllables
      const keys = [...CUE.comment, CUE.promptChar, ...CUE.cmd, CUE.enter].map(S);
      if (u >= S(CUE.comment[0]) - 0.05 && u < ENTER + 0.4) { const k = keys.filter((e) => u >= e).length; J.anim = 'drum'; J.frame = (k + (u - keys[Math.max(0, k - 1)] < 0.1 ? 1 : 0)) % 2; }
      // ENTER: the others jump for joy
      if (u >= ENTER + 0.12 && u < ENTER + 0.48) { const q = (u - ENTER - 0.12) / 0.36; const dy = Math.round(14 * 4 * q * (1 - q)); C.y += dy; R.y += dy; C.anim = R.anim = 'jump'; C.frame = R.frame = q < 0.5 ? 0 : 1; }
      // the fixtures sweep / the functions touch
      if (u >= P.FIX[0] - 0.12 && u < P.FIX[1] + 0.2) { J.anim = 'draw_graphite'; J.frame = 0; }
      if (u >= FUN - 0.25 && u < FUN + 0.6) { J.anim = 'draw_rainbow'; J.frame = 0; }
      // to their posts after the touch: Jade onto the gray spring, Charlie onto the gray lift
      const POST = [B_(137), B_(138)];
      if (u >= POST[0]) {
        const k = T.span(u, POST[0], POST[1]);
        const sy = 72;                                                   // compressed spring top
        if (u < POST[1]) { const [x, y] = arc(u, POST[0], POST[1], P0.jade, FLOOR, LAY.spring, sy, 10); Object.assign(J, { x, y, anim: 'run_pencil', frame: 1 }); }
        else Object.assign(J, { x: LAY.spring, y: sy, anim: 'sing', frame: 0 });
        const lx = LAY.lift.x0 + 16;
        if (u < POST[1]) { const [x, y] = arc(u, POST[0] + 0.1, POST[1], P0.charlie, FLOOR, lx, LAY.lift.top[0], 8); Object.assign(C, { x: u < POST[0] + 0.1 ? P0.charlie : x, y: u < POST[0] + 0.1 ? FLOOR : y, anim: 'jump', frame: 1 }); }
        else Object.assign(C, { x: lx, y: liftTop(u), anim: 'idle', frame: 0 });
        void k;
      }
      // oh 1: the spring runs -> Jade bounces on it (one bounce per beat)
      if (u >= OHS[0]) {
        const bt = (T.beatAt(u) - T.beatAt(OHS[0])); const q = bt - Math.floor(bt);
        const h = 22 + 10 * Math.min(1, bt);
        Object.assign(J, { x: LAY.spring, y: 84 + Math.round(h * 4 * q * (1 - q)), anim: q > 0.15 && q < 0.85 ? 'drum' : 'sing', frame: q > 0.15 && q < 0.85 ? 1 : 0 });
      }
      // Ricky clicks the switches (power chord facing left)
      OHS.forEach((e) => { if (u >= e - 0.03 && u < e + 0.22) Object.assign(R, { anim: 'chord', frame: u >= e ? 1 : 0, facing: -1 }); });
      // oh 3: the door opens -> Ricky walks through to his post
      if (u >= RWALK[0]) { const k = T.span(u, RWALK[0], RWALK[1]); Object.assign(R, { x: lerp(P0.ricky, LAY.rickyPlay, k), y: FLOOR, anim: k < 1 ? 'run' : 'sustain', frame: k < 1 ? Math.floor(T.beatAt(u) * 4) % 4 : 0, facing: 1 }); }
      return { J, C, R };
    }
    // ------------------------------------------------ everything goes from there (61.30-67.78)
    if (u < BUILD) {
      // Charlie on his perch: pull, throw, pull, throw...
      const th = P.chunks.map((c) => c.throw);
      let k = -1; for (let i = 0; i < th.length; i++) if (u >= th[i]) k = i;
      const prev = k >= 0 ? th[k] : GOES, next = k + 1 < th.length ? th[k + 1] : BUILD;
      const a = u - prev, I = next - prev;
      const tgt = P.chunks[Math.min(th.length - 1, k + 1)];
      const face = tgt.tx >= LAY.charliePerch[0] ? 1 : -1;
      if (k >= 0 && a < 0.08) Object.assign(C, { anim: 'throw', frame: 1 });
      else if (I > 0.28) Object.assign(C, { anim: 'pull', frame: Math.min(2, Math.floor(T.clamp01((a - 0.08) / (I - 0.16)) * 3)) });
      else Object.assign(C, { anim: 'throw', frame: 0 });
      Object.assign(C, { x: LAY.charliePerch[0], y: LAY.charliePerch[1], facing: face });
      // Ricky plays the runtime
      Object.assign(R, { x: LAY.rickyPlay, y: FLOOR, anim: 'sustain', frame: Math.floor(u * 8) % 2, facing: 1 });
      // the last bar: the others leave their posts and sprint after Jade (seen leaving in the pull-back)
      const LEAVE = S(67.36);
      if (u >= LEAVE) { const [x, y, q] = arc(u, LEAVE, LEAVE + 0.3, LAY.charliePerch[0], LAY.charliePerch[1], LAY.charliePerch[0] + 40, FLOOR, 10); Object.assign(C, u < LEAVE + 0.3 ? { x, y, anim: 'jump', frame: q < 0.5 ? 0 : 1, facing: 1 } : { x: LAY.charliePerch[0] + 40 + 240 * (u - LEAVE - 0.3), y: FLOOR, anim: 'run', frame: Math.floor(T.beatAt(u) * 4) % 4, facing: 1 }); }
      if (u >= LEAVE + 0.1) Object.assign(R, { x: LAY.rickyPlay + 220 * (u - LEAVE - 0.1), anim: 'run', frame: Math.floor(T.beatAt(u) * 4) % 4 });
      // Jade: spring launch, then runs right painting the chunks as they land
      if (u < JLAUNCH[1]) { const [x, y, q] = arc(u, JLAUNCH[0], JLAUNCH[1], LAY.spring, 84, LAY.jadeLand[0], FLOOR, 90); Object.assign(J, { x, y, anim: 'run_pencil', frame: q < 0.5 ? 1 : 0 }); }
      else Object.assign(J, { x: P.jadeX(u), y: FLOOR, anim: 'run_pencil', frame: Math.floor(T.beatAt(u) * 4) % 2 ? 1 : 0 });
      return { J, C, R };
    }
    // ------------------------------------------------ the build run + the 出发 plates (67.78-77.76)
    const leg = (h) => { const c = h === 'ricky' ? course(u - DELAY[h], LAY.tower.x0 + 3, 38) : course(u - DELAY[h]);   /* Ricky (shortest jump) lands on the very edge */ return !c.air && c.x >= STOPS[h] ? { ...c, x: STOPS[h], anim: 'idle', frame: 0 } : c; };
    const cj = leg('jade'); Object.assign(J, { ...cj, anim: cj.anim === 'run' || cj.anim === 'jump' ? 'run_pencil' : 'sing', frame: cj.anim === 'idle' ? 0 : cj.anim === 'jump' ? 1 : cj.frame % 2 });
    Object.assign(C, leg('charlie')); Object.assign(R, leg('ricky'));
    // staggered formation on the last stretch: never closer than 38 px (Ricky trails)
    if (u >= CRS.down) { if (!C.air && C.x > J.x - 38 && J.x - 38 > 4) C.x = J.x - 38; if (!R.air && R.x > C.x - 38 && C.x - 38 > 4) R.x = C.x - 38; }
    // plates, front to back, one per chant syllable (hops of 0.3 s): Jade 从, Charlie 这里, Ricky 出 (completes the exit)
    const hop = (x0, x1, tl, h) => { const t0 = tl - 0.3; if (u < t0) return null; if (u >= tl) return { x: x1, y: FLOOR, anim: 'idle', frame: 0 }; const [x, y, q] = arc(u, t0, tl, x0, FLOOR, x1, FLOOR, h); return { x, y, anim: 'jump', frame: q < 0.5 ? 0 : 1 }; };
    const rP = hop(STOPS.ricky, LAUNCH.party.ricky, S(PL.ricky), 12); if (rP) Object.assign(R, rP);
    const cP = hop(STOPS.charlie, LAUNCH.party.charlie, S(PL.charlie), 14); if (cP) Object.assign(C, cP);
    const jP = hop(STOPS.jade, LAUNCH.party.jade, S(PL.jade), 18); if (jP) Object.assign(J, { ...jP, anim: jP.anim === 'idle' ? 'sing' : 'run_pencil', frame: jP.anim === 'idle' ? 0 : 1 });
    if (t >= LAUNCH.lights.reds[0] && J.anim === 'sing') { J.anim = 'drum'; J.frame = 0; }
    if (u >= SHOUT) { R.facing = C.facing = J.facing = 1; }
    return { J, C, R };
  }

  // ---------------------------------------------------------------- camera
  function camera(u, t, H) {
    let cx, cy, zoom = 1;
    if (u < DESC[0]) {                                   // page sky
      // hold Act I's framing for 0.12 s (the trio keeps rising on screen), then follow the chute up, then settle on the page sky
      const followX = u < LIN ? CAM0[0] : chuteAt(u)[0] + (CAM0[0] - S0[0]) - V0[0] * (LIN - T0);
      cx = lerp(followX, -700, T.span(u, S(41.3), S(41.75), E.inOut));
      const follow = u < LIN ? CAM0[1] : chuteAt(u)[1] + (CAM0[1] - S0[1]) - V0[1] * (LIN - T0);
      cy = lerp(follow, 250, T.span(u, S(41.3), S(41.7), E.inOut));
      const push = T.span(u, READ, S(STOP[0]), E.out) * (1 - T.span(u, S(STOP[1]), S(STOP[1]) + 0.3, E.inOut));
      zoom = 1 + 0.04 * push; cy += 2 * push; cx += 10 * T.span(u, S(41.7), GRAB.charlie + 0.3, E.inOut);
    } else if (u < S(54.84)) {                           // descend, then push in on Jade under the forming prompt
      const k = E.inOut(T.span(u, DESC[0], DESC[1])); const pk = E.inOut(T.span(u, B_(110), B_(112)));
      zoom = lerp(1, 1.1, pk); cx = -700; cy = lerp(lerp(250, 112, k), 108.2, pk);   // zoom 1.1: floor at screen y 37
    } else if (u < GOES) {                               // fixtures / functions / ohs (carving clear of the subtitle)
      const k = E.inOut(T.span(u, S(54.84), S(55.5))); const k2 = E.inOut(T.span(u, S(59.3), OHS[0]));
      zoom = lerp(1.1, 1, k); cx = lerp(-700, -690, k); cy = lerp(108.2, 64, k) + 20 * k2;
    } else if (u < SHOTS[1]) { zoom = 1.5; cx = -770; cy = 130; }                         // S1 Charlie
    else if (u < SHOTS[2]) { zoom = 1.5; cx = LAY.rickyPlay - 6; cy = 73; }               // S2 Ricky
    else if (u < SHOTS[3]) { zoom = 1.5; cx = H.J.x + 34; cy = 73; }                      // S3 Jade (tracking)
    else if (u < BUILD) {                                                                  // S4 pull back
      // ride Jade's rainbow flood back across everything they built (hats raining in, rings, chunks executing)
      const k = E.inOut(T.span(u, SHOTS[3], BUILD - 0.15)); zoom = lerp(1.5, 0.75, k);
      cx = lerp(H.J.x + 34, -560, k); cy = lerp(73, 128, k);
    } else {                                                                               // the build run
      zoom = 1.25; cx = H.J.x + 30;                                                         // CUT on bar 41 to the run
      cy = T.keys(u, [[CRS.a, 86], [CRS.tower, 112], [CRS.off, 112], [CRS.down + 0.25, 86]], E.inOut);
      if (t >= SHOUT) { zoom = LAUNCH.camera.zoom; cx = LAUNCH.camera.x; cy = LAUNCH.camera.y; }
    }
    return { cx, cy, zoom };
  }

  // ---------------------------------------------------------------- rings: Ricky's runtime
  const RING_V = 230, RING_MAX = 700;
  const ringHit = (u, x, y) => {      // seconds since the latest ring reached (x, y), or Infinity
    const d = Math.hypot(x - LAY.ringC[0], y - LAY.ringC[1]);
    for (let k = P.RINGS.length - 1; k >= 0; k--) { const h = P.RINGS[k] + d / RING_V; if (h <= u) return d / RING_V > RING_MAX / RING_V ? Infinity : u - h; }
    return Infinity;
  };
  const execBob = (u, x, y) => { const a = ringHit(u, x, y); return a < 0.28 ? Math.round(3 * (1 - a / 0.28)) : 0; };

  // ---------------------------------------------------------------- active hero (HUD highlight) timeline
  const ACT = [[T0, 'ricky', 0], [JDROP, 'charlie', 0], [GUST, 'ricky', null], [THROW, 'charlie', 0], [CATCH, 'ricky', null], [READ, null, null],
    [S(CUE.comment[0]), 'jade', null], [ENTER + 0.4, null, null], [P.FIX[0], 'jade', 0], [FUN - 0.2, 'jade', 1], [FUN + 0.8, null, null],
    [OHS[0] - 0.05, 'ricky', 0], [RWALK[1], null, null], [GOES, 'charlie', 0], [SHOTS[1], 'ricky', 0], [SHOTS[2], 'jade', 1], [SHOTS[3], 'all', null],
    [BUILD, null, null], [S(PL.ricky), 'ricky', null], [S(PL.charlie), 'charlie', null], [S(PL.jade), 'jade', null], [S(CUE.fa) + 0.4, null, null]];
  ACT.sort((a, b) => a[0] - b[0]);
  const FLASHES = { charlie: [THROW, ...P.chunks.map((c) => c.throw)], jade: [P.FIX[0], FUN], ricky: [...OHS] };

  return {
    stage: st,
    update(t) {
      const u = freeze(t, STOP[0], STOP[1]);
      const frozen = t >= STOP[0] && t < STOP[1];
      const H = heroState(u, t);
      const cam = camera(u, t, H);
      const sh = shake(t, [JLAND, CLAND, S(STOP[1]), ENTER, FUN, ...OHS, SHOUT, LAUNCH.chu.erupt, LAUNCH.fa.erupt], { amp: 1, dur: 0.12 });
      st.cam.set({ x: cam.cx, y: cam.cy, zoom: cam.zoom, shake: t >= LAUNCH.lights.reds[2] || (t >= GOES && t < BUILD) ? [0, 0] : sh });
      bgq.cover(st.cam); bgq.u.uTime.value = t;
      const L = st.cam.left, Rr = L + st.cam.vw, Bt = st.cam.bottom, Tp = Bt + st.cam.vh;
      const inView = (x, y, m = 40) => x > L - m && x < Rr + m && y > Bt - m && y < Tp + m;
      const launchShot = t >= SHOUT;

      clouds.begin(); back.begin(); tiles.begin(); props.begin(); fx.begin(); cTiles.begin(); cFx.begin(); cHats.begin();
      // the finished rainbow 来 they rode up from: under them on the cut, then it drops away out of frame (we rise)
      lai.group.visible = u < T0 + 0.35;
      if (lai.group.visible) { const k = u - T0; lai.place(CAM0[0] - 160 + LAI0[0], CAM0[1] - 90 + LAI0[1] - Math.round(150 * k + 420 * k * k)); }
      // ================================================================ page sky
      const sky = u < DESC[1] + 0.3;
      if (sky) {
        for (let i = 0; i < 24; i++) {
          const rr = mulberry32(i * 31 + 5);
          const x = -1000 + rr() * 560 - (u - T0) * (6 + rr() * 10), y = 150 + rr() * 260 - Math.max(0, 41.6 - u) * 60;
          clouds.draw('pg' + (i % 12), x, y + Math.round(2 * Math.sin(u * 1.5 + i)), { color: i % 2 ? '#5a6080' : '#8a90b0' });
        }
        // the updraft (Ricky's held note) while they ride the chute
        if (u < RDROP) { const [cx, cy] = chuteAt(u); [6, 10, 14, 18, 22].forEach((r, i) => back.draw('wup' + r, cx + 24, cy - 8 + i * 8 + Math.floor(((u - T0) * 40) % 8))); }
        // parachute canopy + ropes
        canopy.visible = !CARRY && u < CLAND + 0.12;
        if (canopy.visible) {
          const [cx, cy] = u < CLAND ? chuteAt(u) : [LAY.read.charlie[0], platTop('charlie', u)];
          const fold = T.span(u, CLAND, CLAND + 0.12);
          canopy.setRect((Math.floor(u * 4) % 2) / chute.n, 0, 1 / chute.n, 1); canopy.setScale(1 - 0.7 * fold, 1 - 0.5 * fold); canopy.place(cx, cy + 46 - 10 * fold);
          if (fold === 0) { rope(fx, cx - 26, cy + 47, cx - 9, cy + 41, '#5a3a18'); rope(fx, cx + 26, cy + 47, cx + 9, cy + 41, '#5a3a18'); }
          if (u < RDROP) rope(fx, cx + 4, cy + 1, cx + 12, cy - 12, '#3a2a10');   // Ricky's strap on Charlie's boot
        }
        // page platforms
        for (const [h, p] of Object.entries(pagePlat)) { const y = platTop(h, u); p.q.visible = u < DESC[1] + 0.1; p.q.place(p.x - 24, y - 10); }
        if (T.on(u, DESC[1])) ['jade', 'charlie', 'ricky'].forEach((h, i) => sparkle(fx, u, DESC[1], LAY.party[h], FLOOR + 2, { n: 8, r: 16, seed: i + 2, color: '#ffffff' }));
      } else { canopy.visible = false; Object.values(pagePlat).forEach((p) => (p.q.visible = false)); }
      // reading pages: a small page drifts in and is grabbed (the hero switches to the *_read pose, page in hand); Ricky's
      // TAB blows away and the boomerang fetches it; on "read" each page opens as a big readable panel beside its reader
      // (the mocks' B4 pages); the panels fold into the HUD chips one per beat.
      const sOf = (h) => (h === 'jade' ? H.J : h === 'charlie' ? H.C : H.R);
      for (const h of ['jade', 'charlie', 'ricky']) {
        const sq = smallQ[h], q = readQ[h], s = sOf(h);
        let sx = null, sy = 0;
        if (h === 'jade' && u < GRAB.jade) { const k = E.out(T.span(u, T0, GRAB.jade)); sx = lerp(-880, s.x + 10, k); sy = lerp(300, s.y + 20, k) + Math.round(3 * Math.sin(u * 4)); }
        if (h === 'charlie' && u >= S(41.5) && u < GRAB.charlie) { const k = E.out(T.span(u, S(41.5), GRAB.charlie)); sx = lerp(-660, s.x + 10, k); sy = lerp(350, s.y + 20, k) + Math.round(3 * Math.sin(u * 4 + 1)); }
        if (h === 'ricky' && u >= S(41.6) && u < CATCH) {
          const hx = LAY.read.ricky[0] + 10, hy = LAY.read.ricky[1] + 20;
          if (u < GUST) { const k = E.out(T.span(u, S(41.6), GUST)); sx = lerp(-470, hx, k); sy = lerp(310, hy, k) + Math.round(2 * Math.sin(u * 5)); }
          else if (u < HOOK) { const k = E.out(T.span(u, GUST, GUST + 0.45)); sx = lerp(hx, TAB_FAR[0], k) + Math.round(3 * Math.sin(u * 13)); sy = lerp(hy, TAB_FAR[1] - 22, k) + Math.round(2 * Math.cos(u * 11)); }
          else { const b = boomPath(u, H.R.x, H.R.y, H.C.x, H.C.y); sx = b[0]; sy = b[1] - 24; }
        }
        sq.visible = sx !== null; if (sq.visible) sq.place(sx, sy);
        // the big panel (opens on "read", folds into its chip)
        const open = S(READ) - 0.02; let vis = u >= open && u < FOLD[h] + 0.3;
        q.visible = vis;
        if (vis) {
          let x = s.x + 15, y = s.y + 2, sc = E.back(T.span(u, open, open + 0.12)), scy = sc;
          if (u >= FOLD[h]) {
            const k = E.in(T.span(u, FOLD[h], FOLD[h] + 0.3)); const c = chipQ.find((c) => c.h === h);
            const wx = L + (c.inBox[0] + 4) / st.cam.zoom, wy = Bt + (c.inBox[1] + 2) / st.cam.zoom;   // into its chip slot
            x = lerp(x, wx, k); y = lerp(y, wy, k); sc = lerp(1, 0.18, k); scy = sc * lerp(1, 0.4, T.span(u, FOLD[h], FOLD[h] + 0.15));
          } else for (let k = 0; k < 3; k++) fx.draw('px1', s.x + 9 + k * 2, s.y + 24 + k, { solid: '#9ec2ff' });   // magnifier dots
          q.setScale(Math.max(0.05, sc), Math.max(0.05, scy)); q.place(x, y);
        }
      }
      // boomerang hat
      { const b = boomPath(u, H.R.x, H.R.y, H.C.x, H.C.y); if (b) cFx.draw('boom' + (Math.floor(u * 16) % boomSp.n), b[0], b[1] - 10); }
      if (u >= GUST && u < GUST + 0.6) { fx.draw('bang', H.R.x, H.R.y + 48 + (u - GUST < 0.067 ? 3 : 0)); for (let k = 0; k < 4; k++) fx.draw('speed' + [14, 10, 6][k % 3], H.R.x - 10 + k * 9, H.R.y + 26 + k * 5); }
      if (u >= READ && u < S(STOP[1])) for (const s of [H.J, H.C, H.R]) for (let k = 0; k < 3; k++) fx.draw('px1', s.x + 8 + k * 2, s.y + 34 - k, { solid: '#ffffff' });
      STONE_DUST(fx, u);
      { const e = CRS.tower + DELAY.ricky; if (u >= e && u < e + 0.45) { fx.draw('bang', H.R.x + 4, H.R.y + 48 + (u - e < 0.07 ? 3 : 0)); dust(fx, u, e, LAY.tower.x0 + 2, TOWER_TOP, { n: 5, seed: 31 }); debris(fx, u, e, LAY.tower.x0 + 1, TOWER_TOP - 2, { n: 4, seed: 32, names: ['crumb0', 'crumb1'], vx: [-40, -10], vy: [10, 60] }); } }

      // ================================================================ the editor level (core)
      const showCore = u >= DESC[1] - 0.2;
      if (showCore) {
        // dashed selection: the editor canvas (until the sweep has drawn the ground)
        if (u < P.FIX[1] + 0.1) for (let x = LAY.core[0] - 16; x < LAY.core[1] + 32; x += 4) { const swept = P.core.find((c) => c.kind === 'ground' && x >= c.x && x < c.x + 16 && u >= c.t); if (swept) continue; tiles.draw('dash', x + Math.floor(u * 16) % 4, FLOOR - 1); }
        // blueprint answer (after ENTER) until the sweep draws each block
        const pulse = T.beatPulse(u, 1, 0.12) > 0.6;
        for (const c of [...P.core, ...P.stand]) {
          if (c.kind === 'under' || u < bpAt(c.x) || u >= c.t) continue;
          const nm = (pulse || T.exactFrame(t, [B_(128)])) ? 'bpHi' : 'bp';
          if (c.kind === 'switch') tiles.draw(nm, c.x - 8, c.y - 8); else if (c.kind === 'spring' || c.kind === 'door') tiles.draw(nm, c.x - 8, c.y); else tiles.draw(nm, c.x, c.y);
        }
        for (const c of P.core) {
          if (u < c.t) continue;
          const alive = u >= c.tc, pop = u - c.t < 0.067;
          const dy = alive && t >= GOES ? execBob(u, c.x + 8, c.y + 8) : 0;
          const nm = c.kind === 'under' ? (alive ? 'dirt' + (((c.x / 16) & 1)) : 'fix1') : c.kind === 'ground' ? (alive ? 'grass' + (((c.x / 16) % 3 + 3) % 3) : 'fix') : alive ? 'brick' : 'fix';
          tiles.draw(pop ? 'spawn' : nm, c.x, c.y + (c.kind === 'brick' ? dy : 0));
          if (alive && c.kind === 'brick' && dy) props.draw('arrowUp', c.x + 8, c.y + 18 + dy, { color: '#9ee6ff' });
          if (alive && c.kind === 'ground' && (c.x / 16) % 2 === 0) { const age = u - c.tc; const st_ = Math.min(4, Math.floor(age * 20)) ; const pop2 = execBob(u, c.x + 8, FLOOR) > 1 ? 4 : st_; props.draw(`flower${((c.x / 32) % 7 + 7) % 7}_${Math.max(0, pop2)}`, c.x + 6, FLOOR); }
        }
        // the three functions + switches (gray until clicked)
        const sp = P.stand;
        for (const c of sp) {
          if (u < c.t) continue; const pop = u - c.t < 0.067;
          const on = u >= switchT(c.fn), hit = on && u < switchT(c.fn) + 0.15;
          if (c.kind === 'switch') { props.draw(pop ? 'spawn' : on ? `sw${c.fn + 1}${hit ? 'hit' : 'on'}` : 'swG', c.x + (pop ? -8 : 0), c.y + (pop ? -8 : 0)); continue; }
          if (c.kind === 'spring') {
            let nm = on ? 'spring0a' : 'spring0';
            if (on) { const bt = T.beatAt(u) - T.beatAt(OHS[0]); const q = bt - Math.floor(bt); nm = q < 0.12 || q > 0.92 ? 'spring1a' : 'spring0a'; if (u >= JLAUNCH[0] && u < JLAUNCH[0] + 0.15) nm = 'spring1a'; if (t >= GOES && execBob(u, c.x, 70) > 1) nm = 'spring1a'; }
            props.draw(pop ? 'spawn' : nm, c.x + (pop ? -8 : 0), c.y); continue;
          }
          if (c.kind === 'lift') { if (c.x === LAY.lift.x0) props.draw(pop ? 'spawn' : on ? 'liftA' : 'liftG', c.x, liftTop(u) - 8); continue; }
          if (c.kind === 'door') { const o = on ? Math.min(2, Math.floor((u - switchT(2)) * 12)) : -1; props.draw(pop ? 'spawn' : o >= 0 ? 'door' + o : 'doorG', c.x + (pop ? -8 : 0), c.y); }
        }
        // wires: switch -> function (gray, then green; yellow on the click)
        if (u >= P.stand.find((c) => c.kind === 'switch').t) {
          const W = [[LAY.switches[0], [[LAY.switches[0][0], LAY.switches[0][1] - 10], [LAY.switches[0][0], 92], [LAY.spring + 8, 92]]],
            [LAY.switches[1], [[LAY.switches[1][0], LAY.switches[1][1] - 10], [LAY.switches[1][0], liftTop(u) + 2], [LAY.lift.x0, liftTop(u) + 2]]],
            [LAY.switches[2], [[LAY.switches[2][0] + 10, LAY.switches[2][1]], [-566, LAY.switches[2][1]], [-566, 106]]]];
          W.forEach(([, pts], i) => {
            const on = u >= switchT(i), hit = on && u < switchT(i) + 0.2; const nm = hit ? 'wireHit' : on ? 'wireOn' : 'wireG';
            for (let s = 0; s + 1 < pts.length; s++) { const [a, b] = [pts[s], pts[s + 1]]; const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4)); for (let j = 0; j <= n; j++) back.draw(nm, a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n); }
          });
          ['1 SPRING', '2 LIFT', '3 DOOR'].forEach(() => {});
        }
        // the clicks: chord shot from Ricky's guitar to the switch
        OHS.forEach((e, i) => {
          const ag = t - e; if (ag < 0 || ag > 0.16) return;
          const [x0, y0] = LAY.muzzle, [x1, y1] = LAY.switches[i]; const k = Math.min(1, ag / 0.1);
          const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 3 * k);
          for (let j = 0; j < n; j++) back.draw('px2', x0 + (x1 - x0) * j * 3 / Math.hypot(x1 - x0, y1 - y0), y0 + (y1 - y0) * j * 3 / Math.hypot(x1 - x0, y1 - y0), { solid: j % 3 ? '#ffe14d' : '#ffffff' });
          if (k >= 1) { fx.draw('impact', x1, y1); }
          sparkle(fx, t, e + 0.1, x1, y1, { n: 10, r: 18, color: PAL.yellow });
        });
        // functions running: sparkles at each function when its switch fires
        sparkle(fx, u, OHS[0], LAY.spring, 80, { n: 10, r: 16, seed: 3, color: '#3ad06a' });
        sparkle(fx, u, OHS[1], LAY.lift.x0 + 16, 74, { n: 10, r: 18, seed: 4, color: '#9ee6ff' });
        sparkle(fx, u, OHS[2], LAY.door, 76, { n: 10, r: 16, seed: 5, color: '#ffc27a' });
        if (u >= LIFT_UP[0] && u < LIFT_UP[1] + 0.2) [LAY.lift.x0 - 8, LAY.lift.x0 + 40].forEach((x, i) => fx.draw('arrowUp', x, liftTop(u) - 14 + i * 4 + Math.floor(u * 20) % 6, { color: '#9ee6ff' }));
        // the sweep debris + touch sparkle
        if (u > P.FIX[0] && u < P.FIX[1] + 0.1) for (let k = 0; k < 6; k++) { const e = u - k / 30; const kk = T.span(e, P.FIX[0], P.FIX[1]); debris(fx, u, e, LAY.core[0] + (LAY.core[1] + 16 - LAY.core[0]) * kk, 66 + 40 * Math.sin(Math.PI * kk), { n: 2, seed: k + Math.floor(e * 30), names: ['crumb1', 'px1'], color: PAL.g1, dur: 0.4 }); }
        sparkle(fx, u, FUN, P.FUNC_C[0], P.FUNC_C[1], { n: 18, r: 70, dur: 0.7 });
      }
      // FIXTURES / FUNCTIONS carved into the ground face
      fixQ.visible = showCore && u >= P.FIX[0] + 0.25 && !launchShot;
      fnQ.forEach((f, i) => { f.q.visible = showCore && u >= FUN + 0.05 + i * 0.03 && !launchShot; f.q.place(f.x, 45 + (u - FUN - 0.05 - i * 0.03 < 0.05 ? 3 : 0)); });
      // pencils (fixtures sweep / functions touch)
      gPencil.visible = u >= P.FIX[0] - 0.15 && u < P.FIX[1] + 0.25;
      if (gPencil.visible) { const k = T.span(u, P.FIX[0], P.FIX[1]); gPencil.set({ x: LAY.core[0] + (LAY.core[1] + 16 - LAY.core[0]) * k, y: 66 + 40 * Math.sin(Math.PI * k) + 10, angle: -38 + 10 * Math.sin(u * 30) }); }
      rPencil.visible = u >= FUN - 0.25 && u < FUN + 0.6;
      if (rPencil.visible) { const k = T.span(u, FUN - 0.25, FUN, E.out); rPencil.set({ x: P.FUNC_C[0] - 30 + 30 * k, y: P.FUNC_C[1] + 60 - 50 * k, angle: -30 }); }

      // ================================================================ hats, chunks, rings (61.3 ->)
      if (u >= GOES - 0.5) {
        for (const c of P.chunks) {
          // the hat in flight
          if (u >= c.throw && u < c.land) {
            const [hx, hy] = P.hand; const q = (u - c.throw) / (c.land - c.throw);
            const x = hx + (c.tx - hx) * q, y = hy + (c.ty - hy) * q + c.apex * 4 * q * (1 - q);
            if (inView(x, y, 20)) cHats.draw('hat' + (Math.floor(u * 15 + c.i) % 3), x, y - 6);
            continue;
          }
          if (u < c.land) continue;
          const pop = u - c.land < 0.067;
          const rows = c.rows || [c.y, c.y - 16], top = rows[0] + 16;
          if (!inView(c.x + c.n * 8, c.y, c.n * 8 + 70)) continue;
          for (let i = 0; i < c.n; i++) {
            const x = c.x + i * 16; const alive = u >= c.tcCol(x);
            const dy = alive && t < BUILD ? execBob(u, x + 8, rows[0] + 8) : 0;
            rows.forEach((y, r) => {
              let nm;
              if (pop) nm = 'spawn';
              else if (!alive) nm = r === 0 ? 'fix' : 'fix1';
              else if (c.kind === 'brick') nm = 'brick';
              else if (c.kind === 'rainbow') nm = 'cblk' + (((x / 16) + r * 3) % 12 + 12) % 12;
              else nm = r === 0 ? 'grass' + (((x / 16) % 3 + 3) % 3) : 'dirt' + (((x / 16) + r) & 1);
              (nm.startsWith('cblk') ? cTiles : tiles).draw(nm, x, y + (c.kind === 'ground' ? (r === 0 ? Math.min(dy, 2) : 0) : dy));   // H5
            });
            if (alive && !pop && c.kind !== 'ground' && i === 0) { if (dy) fx.draw('arrowUp', c.x + c.n * 8, c.y + 22 + dy, { color: '#9ee6ff' }); }
            if (alive && !pop && c.kind === 'grass' && i % 2 === 1) props.draw(`flower${(c.i + i) % 7}_${dy ? 4 : Math.min(4, Math.floor((u - c.tcCol(x)) * 16))}`, x + 6, c.y + 16 + dy);
            if (alive && !pop && c.kind === 'ground' && (x / 16) % 3 === 0 && x < 0) props.draw(`flower${((x / 16) % 7 + 7) % 7}_${dy ? 4 : Math.min(4, Math.floor((u - c.tcCol(x)) * 16))}`, x + 6, top + Math.min(dy, 2));
          }
          if (c.kind === 'spring' && !pop) { const alive = u >= c.tc; const fire = alive && execBob(u, c.tx, c.y + 16) > 1; props.draw(!alive ? 'spring0' : fire ? 'spring1a' : 'spring0a', c.x + 8, c.y + 16); }
          if (c.kind === 'ground' && !pop && u < c.tc) cHats.draw('hat0', c.tx, top);
          if (c.spring !== null && c.spring !== undefined && !pop) props.draw(u < c.tc ? 'spring0' : springFire(u) ? 'spring1a' : 'spring0a', c.spring, top);
          if (c.kind !== 'ground' && !pop && c.kind !== 'spring') cHats.draw('hat0', c.tx, c.y + 16 + (u >= c.tc && t < BUILD ? execBob(u, c.tx, c.y + 8) : 0));
          if (pop || u - c.land < 0.3) sparkle(fx, u, c.land, c.tx, c.ty + 2, { n: 6, r: 14, seed: c.i + 3, dur: 0.3 });
          // Jade's paint: rainbow sparks where her pencil colours a column
          if (c.kind === 'ground') for (let i = 0; i < c.n; i++) { const x = c.x + i * 16, e = c.tcCol(x); if (u >= e && u < e + 0.3 && e > c.land + 0.05) sparkle(cFx, u, e, x + 8, top + 2, { n: 5, r: 10, seed: c.i * 7 + i, dur: 0.3 }); }
        }
        // rings
        if (u >= P.RINGS[0] && t < BUILD) {
          for (const e of P.RINGS) {
            const r = (u - e) * RING_V; if (r < 4 || r > RING_MAX) continue;
            const n = Math.max(24, Math.min(900, Math.round(2 * Math.PI * r / (5 / Math.max(0.6, st.cam.zoom)))));
            const col = r < 120 ? '#c8fbff' : r < 320 ? '#7ad8ff' : '#2bb4e8';
            for (let j = 0; j < n; j++) { if (j % 4 === 3) continue; const a = j / n * Math.PI * 2; const x = LAY.ringC[0] + Math.cos(a) * r, y = LAY.ringC[1] + Math.sin(a) * r; if (inView(x, y, 2)) fx.draw('px2', x, y, { solid: col }); }
          }
        }
        // Jade's spring launch trail + paint tip
        if (u >= JLAUNCH[0] && u < BUILD) { for (let k = 1; k < 5; k++) { const e = u - k * 0.03; if (e < JLAUNCH[0]) break; const s = heroState(e, e).J; cFx.draw('px2', s.x - 4, s.y + 18, { solid: PAL.rainbow[(k * 3 + Math.floor(u * 30)) % 12] }); } }
        if (u >= JLAUNCH[1] && u < BUILD) { const s = H.J; cFx.draw('px2', s.x + 14, s.y + 3, { solid: PAL.rainbow[Math.floor(u * 30) % 12] }); cFx.draw('px1', s.x + 17, s.y + 1, { solid: PAL.rainbow[(Math.floor(u * 30) + 4) % 12] }); }
      }

      // ================================================================ launch set + plates
      set.update(t, { showCubes: launchShot });
      sparkle(fx, t, LAUNCH.chu.erupt, LAUNCH.chu.x + 48, 90, { n: 14, r: 50, dur: 0.6 });
      sparkle(fx, t, LAUNCH.fa.erupt, LAUNCH.fa.x + 48, 90, { n: 14, r: 50, dur: 0.6 });
      debris(fx, t, LAUNCH.chu.erupt, LAUNCH.chu.x + 48, 62, { n: 12, seed: 5, names: ['crumb0', 'crumb2'], vx: [-90, 90], vy: [60, 180], floor: 60 });
      debris(fx, t, LAUNCH.fa.erupt, LAUNCH.fa.x + 48, 62, { n: 12, seed: 6, names: ['crumb0', 'crumb2'], vx: [-90, 90], vy: [60, 180], floor: 60 });
      Object.entries(PL).forEach(([h, e], i) => sparkle(fx, t, S(e), LAUNCH.party[h], FLOOR + 3, { n: 6, r: 10, seed: 20 + i, color: PAL.yellow }));
      if (launchShot) [[60, 140, 'cube18'], [-8, 74, 'cubeD14']].forEach(([x, y, n], i) => clouds.draw(n, x, y + Math.round(3 * Math.sin(t + i))));

      // ================================================================ heroes
      setJade(H.J);
      charlie.set({ facing: 1, ...H.C });
      ricky.set({ facing: 1, ...H.R });
      clouds.end(); back.end(); tiles.end(); props.end(); fx.end(); cTiles.end(); cFx.end(); cHats.end();

      // ================================================================ UI
      const singing = words.some((w) => t >= w.start && t < w.end) && Math.floor(t * 8) % 2 === 0;
      let act = null, slot = null, at = -1; for (const [e, h, s] of ACT) if (u >= e) { act = h; slot = s; at = e; }
      if (act === 'all') { act = ['charlie', 'jade', 'ricky'][Math.floor(T.beatAt(u) * 2) % 3]; slot = 0; }
      const fl = act && FLASHES[act] ? Math.max(0, ...FLASHES[act].filter((e) => e <= u).slice(-1).map((e) => 1 - (u - e) / 0.2)) : 0;
      void at; void fl; void singing;
      // build bar
      bar.update(t);
      // hat counter
      const thrown = P.chunks.filter((c) => u >= c.throw).length;
      const hatsOn = t >= GOES && t < SHOUT;
      hatIc.visible = hatN.visible = false; void hatsOn; void thrown;   // (v4) the hat counter lived in the retired HUD
      // subtitles
      let c = null;
      for (const id of [12, 13, 14, 16]) { const q = subtitleFor(t, id, { hold: id === 14 ? 0.08 : 0.3 }); if (q) c = q; }
      if (t > S(T.word(16, 4).start + 0.46) && t < 72) c = null;   // the held "there": let the world extend (type M3: keyed to "there" 65.68, was a fixed 64.6 = old 64.14 + 0.46, which hid the bar before "from there" was sung)
      sub.set(c);   // (v4) the one slot (the bar no longer docks at ENTER, so line 13 keeps its tail)
      // pause label during the reading freeze
      pauseLbl.visible = false; void frozen;   // (v4) chorus: no UI beyond the prompt box (the ❚❚ READ label is retired)
      // ---- the prompt box: blueprint gizmos -> edges draw -> chips click in (one per beat) -> solid -> typing
      const P0 = S(CUE.comment[0]), OUT = S(54.84), dy = boxDy(t);
      const asm = t >= BOX_GIZMO && t < OUT + 0.15;
      gizmos.forEach((q, i) => { q.visible = asm && t < BOX_SOLID + 0.1; if (q.visible) q.place([PB.x, PB.x + PB.w][i % 2] - 2, [PB.y, PB.y + PB.h][i >> 1] - 2 + dy); });
      const ek = E.out(T.span(t, BOX_EDGES[0], BOX_EDGES[1]));
      const EW = Math.max(1, Math.round(PB.w * ek)), EH = Math.max(1, Math.round(PB.h * ek));
      edges.forEach((q) => (q.visible = asm && t < BOX_SOLID + 0.1));
      if (edges[0].visible) {
        edges[0].setSize(EW, 1); edges[0].place(PB.x, PB.y + PB.h + dy);                  // top: left -> right
        edges[1].setSize(1, EH); edges[1].place(PB.x + PB.w, PB.y + PB.h - EH + dy);      // right: top -> down
        edges[2].setSize(EW, 1); edges[2].place(PB.x + PB.w - EW, PB.y + dy);             // bottom: right -> left
        edges[3].setSize(1, EH); edges[3].place(PB.x, PB.y + dy);                          // left: bottom -> up
      }
      bpFill.visible = asm && t >= BOX_EDGES[1] && t < BOX_SOLID; bpFill.place(PB.x + 1, PB.y + 1 + dy);
      box.visible = t >= BOX_SOLID && t < OUT + 0.15; box.place(PB.x, PB.y + dy);
      chipQ.forEach((ch) => {
        const arrive = CLICK[ch.h]; ch.q.visible = u >= arrive && t < OUT + 0.15;
        if (ch.q.visible) ch.q.place(ch.inBox[0], ch.inBox[1] + dy + (u - arrive < 0.07 ? 2 : 0));
      });
      const boxOn = t >= BOX_SOLID && t < OUT + 0.15;
      l1.visible = l2.visible = boxOn;
      entQ.forEach((q) => (q.visible = false)); ckQ.visible = okQ.visible = cursor.visible = badgeO.visible = badgeI.visible = false;
      if (boxOn) {
        l1.set({ text: typedText(t, COMMENT, CUE.comment) }); l1.place(PB.x + 8, PB.y + 35 + dy);
        const cmd = t >= S(CUE.promptChar) ? typedText(t, CMD, CUE.cmd, '>') : '';
        l2.set({ text: cmd }); l2.place(PB.x + 8, PB.y + 6 + dy);
        const onL2 = t >= S(CUE.promptChar);
        cursor.visible = (Math.floor(t * 4) % 2 === 0 || Math.abs(t - P0) < 0.1) && t < ENTER;
        if (onL2) { cursor.setSize(9, 20); cursor.place(PB.x + 10 + (cmd ? l2.w * 2 : 0), PB.y + 7 + dy); }
        else { cursor.setSize(5, 10); cursor.place(PB.x + 9 + l1.w, PB.y + 36 + dy); }
        if (t >= S(CUE.cmd[2])) { const pressed = t >= ENTER && t < ENTER + 0.3; const q = entQ[pressed ? 1 : 0]; q.visible = true; q.place(PB.x + 14 + l2.w * 2, PB.y + 6 + dy - (pressed ? 2 : 0)); }
        // the reply lands as a stamp on the box's top-right corner on "need?"
        if (t >= ENTER + 0.1) {
          const a = t - ENTER - 0.1, sc = a < 0.034 ? 3 : a < 0.1 ? 2.4 : 2;
          ckQ.visible = okQ.visible = badgeO.visible = badgeI.visible = true; ckQ.setScale(sc); okQ.setScale(sc);
          const bx = PB.x + PB.w - 94, by = PB.y + PB.h - 22 + dy; badgeO.place(bx, by); badgeI.place(bx + 1, by + 1);
          ckQ.place(bx + 6, by + 9); okQ.place(bx + 25, by + 3);
        }
      }
      // chant row (hero type) + translation
      chant.forEach((c) => { const a = t - T.snap(c.on); c.q.visible = t >= SHOUT && a >= 0 && t < 75.4; if (c.q.visible) { c.q.setScale(a < 0.034 ? 2.8 : a < 0.067 ? 2.3 : 2); c.q.place(c.x, 144); } });
      // (v4) 一切从这里出发 is type in the scene (the chant row + the rainbow 出发): no translation chip on top of it
      st.fx.flash = T.exactFrame(t, [SHOUT]) ? 0.9 : T.exactFrame(t, [FUN, ...OHS, LAUNCH.lights.green]) ? 0.45 : T.exactFrame(t, [STOP[0], ENTER]) ? 0.35 : 0;
    },
  };
  function boxDy(t) { return Math.round(120 * E.in(T.span(t, S(54.84), S(54.84) + 0.15))); }   // flies up into the bar on "That's it"
  function rope(b, x0, y0, x1, y1, c) { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))); for (let i = 0; i <= n; i++) b.draw('px1', x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, { solid: c }); }
  function STONE_DUST(b, u) { dust(b, u, JLAND, LAY.read.jade[0], LAY.read.jade[1], { n: 4, seed: 3 }); dust(b, u, RLAND, LAY.read.ricky[0], LAY.read.ricky[1], { n: 4, seed: 4 }); dust(b, u, CLAND, LAY.read.charlie[0], LAY.read.charlie[1], { n: 5, seed: 5 }); dust(b, u, DESC[1], -700, FLOOR, { n: 10, seed: 9, spread: 40 }); }
}
