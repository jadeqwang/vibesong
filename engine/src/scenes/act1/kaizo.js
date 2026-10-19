// ACT I · 13.82-41.028 · LEVEL 1-1 · DRAFT: the Kaizo run (game-design pass 2026-10-15, docs/game_design_acts1-3.md).
// One continuous world. Timing, layout, the Eraser's rub line and the LINES OF CODE events live in ./level.js (pure);
// this file draws it. Scene clock u = song time with the two stops frozen and the stutter stuttered (level.js tau).
// Every co-op beat is the party grammar: Jade PAINTs -> Ricky RUNs -> Charlie SHIPs. Formation: Jade leads, Charlie mid,
// Ricky trails (heaviest, nearest the Eraser); spacing breathes 12-40 px; jump heights Jade > Charlie > Ricky.
//
//  13.82-14.55  zoom out of the 一 stroke into the level; level card The Vibe Coding Song / (一笔一画) (common.js)
//  14.11  Room 1 (solos): the lyric IS the floor; each tile blooms a COLOURED flower under Jade's sneakers. One crate,
//         three styles: Jade flips over it (lands 15.286), Charlie bounces off his own hat, Ricky lumbers onto it.
//  16.73  FREEZE: the Eraser slides in and rubs the level behind them to blank paper, EXCEPT the coloured flowers,
//         which stay hanging on the blank page (the clue). "!" x3.
//  17.44  RE-HIT: Jade pulls both pencils from her bun like twin swords (hair DOWN from here); 17.615 Ricky fires a
//         power chord at the Eraser: *blink*, NOT VERY EFFECTIVE... 17.827 they run.
//  18.10  "blossoms" (SHIP saves RUN; the held note 18.10-20.11): the word is the bridge, letters grown from graphite blossoms
//         that open on the sung onset; the Eraser chews it letter by letter and each letter bursts into petals; Ricky is on
//         the last s when it drops (19.30); Charlie spins, throws the hat down as a trampoline, BOING (19.46), Ricky lands
//         on the ledge on beat 46 (19.941). ("because" is sung 20.13, as card 03 cuts in at 20.167.)
//  20.12  "my imagination is linked..." (first full PAINT -> RUN -> SHIP): a chasm too wide for anyone. 21.63-22.30 Jade
//         draws a graphite 丨 post on the far cliff; 22.903 Ricky's chord CLICKS the limp blue hyperlink, it shoots across
//         and latches on the post, visited purple on "linked" (23.245); 23.326 Charlie boomerangs the hat onto the chain
//         and zips; Jade grabs his boot, Ricky grabs hers: a human chain. 23.695-24.22 FREEZE (silhouettes vs the lit
//         "life" sign). 24.22 they let go, the hat pops into a parachute, the chain of three drifts onto "life" (25.42).
//         The Eraser LUNGES across the chasm on the re-hit and rubs out Jade's graphite post: the chain falls.
//  25.42  the Eraser surges; 26.29-27.13 crumb spray, Charlie's hat-SHIELD over the three; Ricky half a step from it.
//  27.55  Jade glances back at the flowers still standing on the erased page (thought bubble: flower -> bulb).
//  27.80  每一天 都是色彩: she spins and paints the floor behind them; 28.32 the Eraser hits colour: SQUEAK, skid, smear;
//         29.08-31.0 every stutter hit is a squeak (+ smudge, sweat). TIP: COLOR IS HARD TO ERASE.
//  31.28  真世界 就画出来: the floor runs out; Jade draws 一 platforms ahead of their feet (done >= 4 frames before a foot);
//         Ricky can't make one gap, she colours the 丶 under him: a SPRING (32.86). 33.10 a graphite wall: she flips the
//         pencil and erases a doorway with the pink cap. 33.86 the smeared Eraser LEAPS the pit (never touching her
//         graphite), lands on the last ledge on 34.298, skids to the edge, teeters, peers into the void, stays put.
//  34.0   off the last tile into the VOID; 34.72 Charlie's parachute catches all three (Jade + Ricky dangling from his
//         boots). 说出来: words fall from Jade's bubble as ghosts; 它就存在: Ricky's chord SLAMS them solid on the measured
//         accents 35.64 / 36.49; Charlie steers onto them (touch 36.05, land 37.245). HUD: LEVEL NOT FOUND.
//  38.25  彩色笔 画出未来: the rainbow pencil draws 未 then 来 and they jump onto each stroke WHILE it is drawn, chasing
//         the tip (Jade high route 未一 -> 来一; Charlie 未's long 一 -> 来's long 一; Ricky falls short, Charlie's hat
//         trampoline 40.30). 40.536 来 held: Ricky sustains, neck UP: an updraft; 40.609 Charlie pops the parachute, Ricky
//         hangs from his strap, Jade grabs the other boot; they ride the updraft past the top of 来 into the chorus.
//         HANDOFF at 41.028: engine/HANDOFF_41.md.
import * as T from '../../show/timing.js';
import { locAt } from '../../show/loc.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL, rainbowAt } from '../../core/palette.js';
import { PaperBG, BlueprintBG, Batch, dust, debris, sparkle, shake, CheckerRect } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { HERO_JUMP, breathe } from '../../core/choreo.js';
import { TextSprite, blockText } from '../../core/text.js';
import { Quad, canvasTex, rect, pixelCanvas } from '../../core/gfx.js';
import { HUD, HUD_H, Subtitle, subtitleFor, Bubble, Banner, panel } from '../../core/ui.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { Pencil, bangCanvas, checkerCanvas } from '../../core/props.js';
import { act1Atlas, floorColumn, PencilRig, speedLines, buildLevelCard } from './common.js';
import * as ART from './kaizo_art.js';
import * as A from '../mocks/a_art.js';
import { L, FLOOR, rubX, eraserAt, flowerTimes, BRIDGE_GLYPHS, bridgeDropX, FLOOR_LYRIC } from './level.js';
import { buildPoses, PoseQuad, rotCache } from './kaizo_poses.js';
import { mulberry32 } from '../../util.js';

/** piecewise keys [[u, v, ease?], ...] -> fn(u) */
const pw = (ks) => (u) => {
  if (u <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) { const [u1, v1, e] = ks[i]; if (u <= u1) { const [u0, v0] = ks[i - 1]; const k = u1 > u0 ? (u - u0) / (u1 - u0) : 1; return v0 + (v1 - v0) * (e ? e(k) : k); } }
  return ks[ks.length - 1][1];
};
const arc = (a, b, k, h) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + h * 4 * k * (1 - k)];

export async function setup(ctx) {
  const lib = ctx.lib, g = L(), X = g.X;
  const { tau, S, B, U, UB, F1a, F1b, F2a, F2b, HITS, T0 } = g;
  const C = (k) => T.cue('act1.' + k);
  const START = C('melisma')[1];
  const st = new Stage2D(ctx, { bg: PAL.paper });
  const paper = st.add(new PaperBG(), Z.BG);
  const blue = st.add(new BlueprintBG(), Z.BG + 1);
  const P = buildPoses(lib); const rot = rotCache();
  const [BL, BR] = P.charlie_parachute_carry.bootOff;                 // Charlie's boots (offset from his anchor, y up)
  const DROP = P.jade_dangle.h - 1 - P.jade_dangle.anchor[1];          // hand -> feet when dangling

  // ---------------------------------------------------------------- atlas
  const atlas = act1Atlas(lib);
  for (const F of [60, 84, 90]) for (let v = 0; v < 3; v++) atlas.add(`fl${F}_${v}`, floorColumn(F, v), [0, 0]);
  atlas.add('chk16', checkerCanvas(4), [0, 0]);
  atlas.add('linkH', ART.linkCanvas(PAL.hyperlink, '#8fb0ff', false), [3, 2]); atlas.add('linkV', ART.linkCanvas(PAL.hyperlink, '#8fb0ff', true), [2, 3]);
  atlas.add('linkHv', ART.linkCanvas('#7a3cff', '#c2a0ff', false), [3, 2]); atlas.add('linkVv', ART.linkCanvas('#7a3cff', '#c2a0ff', true), [2, 3]);
  PAL.rainbow.forEach((h, i) => atlas.add('cap' + i, ART.colorCap(h), [0, 0]));
  for (let i = 0; i < 7; i++) atlas.add('bf' + i, A.bigFlower(i), [4, 0]);
  atlas.add('sweat', A.sweatDrop(), [2, 0]);
  atlas.add('crate', pixelCanvas(22, 18, (gg, px) => { px(0, 0, PAL.g0, 22, 18); px(1, 1, PAL.g4, 20, 16); px(1, 1, PAL.g5, 20, 2); px(1, 8, PAL.g1, 20, 1); px(2, 2, PAL.g2, 2, 14); px(18, 2, PAL.g2, 2, 14); for (let i = 0; i < 7; i++) { px(4 + i * 2, 3 + i * 2, PAL.g1, 2, 2); } }), [0, 0]);
  atlas.add('pillar', ART.pillarCanvas(60), [0, 0]);
  petalCanvases().forEach((cv, i) => atlas.add('pt' + i, cv, [cv.width / 2, cv.height / 2]));   // (M3) the bridge's pixel petals
  const bgBatch = st.add(new Batch(atlas, 900), Z.PLATFORM);
  const flBatch = st.add(new Batch(atlas, 400), Z.PROP + 2);       // COLOUR (flowers, colour caps): never clipped by the Eraser
  const fxBatch = st.add(new Batch(atlas, 2000), Z.FX);
  const linkBatch = st.add(new Batch(atlas, 400), Z.PROP + 9);
  const hiFx = st.add(new Batch(atlas, 600), Z.TOP);               // crumbs over the heroes, sparkles over the Eraser
  // v4 colour script (engine/COLOR_REQUESTS.md H1-H4): the colour she earns keeps its colour before the flood (tags only, no timing)
  flBatch.userData.cs = 1;                                         // H1: the flowers + colour caps (colour is hard to erase)
  const cxFx = st.add(new Batch(atlas, 200), Z.FX); cxFx.userData.cs = 1;    // H3: colour sparkles (blooms, 来, the latched link)
  const cxHi = st.add(new Batch(atlas, 100), Z.TOP); cxHi.userData.cs = 1;   // H3: the rainbow squeak sparks on the Eraser
  const ptBatch = st.add(new Batch(atlas, 300), Z.FX); ptBatch.userData.cs = BLOSSOM_KEEP;   // (M3) the bridge's petals: graphite with a blush of pink

  // ---------------------------------------------------------------- parallax sketches
  const hillsTex = canvasTex(ART.hillsCanvas()), ruinsTex = canvasTex(ART.ruinsCanvas());
  const hills = [0, 1].map(() => st.add(new Quad(hillsTex, 512, 70), Z.PARALLAX));
  const ruins = [0, 1].map(() => st.add(new Quad(ruinsTex, 640, 96), Z.PARALLAX + 1));
  const rubTex = canvasTex(A.rubStreaks(170, 110));
  const streaks = st.add(new Quad(rubTex, 170, 110), Z.BG2);

  // ---------------------------------------------------------------- level geometry
  // the first ground IS a giant 一 (the title stroke we dived into from PRESS START)
  const yiBig = await Hanzi2D.create('一', { size: 256, bold: 3 }); const ybx = -28;
  const ybTop = yiBig.strokeTopAt(0, 128); yiBig.place(ybx, FLOOR - ybTop); st.add(yiBig.group, Z.PLATFORM + 1);
  const yiCore = yiBig.medianAt(0, 0.3);
  const LYRIC = 'Everything I love about life just blossoms', LX0 = 214;
  const letters = Array.from(FLOOR_LYRIC).map((ch, i) => { const q = st.add(new Quad(canvasTex(ART.letterTile(ch, false)), 9, 10), Z.PLATFORM + 2); q.place(LX0 + i * 9, 50); return { ch, q, x: LX0 + i * 9 }; });
  const FT = flowerTimes(); // song times of the flower blooms (even letters of the full line: they still bloom where "blossoms" was tiled)
  const flowers = []; { let k = 0; for (let i = 0; i < LYRIC.length; i += 2) { if (LYRIC[i] === ' ') continue; const x = LX0 + i * 9 + 4; if (k < FT.length) flowers.push({ x, t: FT[k], c: k % 7 }); k++; } }
  // "blossoms": the bridge (v4b color M3/M3b; was "because" in graphite block letters). Each letter is a graphite cherry branch
  // bent into the glyph (level.js BRIDGE_GLYPHS) with pale-pink 5-petal blossoms on it (blossomLetter); x-height tops at floor
  // level (as before). The Eraser can only eat graphite: it eats the branch and the blossoms burst off as petals. The path
  // flowers stay the only saturated colour (the clue). Buds until the sung "blossoms" (18.10), then they open left to right.
  const BRG = X.bridge, BC = BRG.cell, BM = 7;
  const BX0 = BRG.x0, BX1 = BRG.x1, BYQ = FLOOR - 5 * BC - BM;      // quad y: the outline above the x-height row sits on FLOOR
  const tBloom = S(T.word(5, 6).start);                             // "blossoms" (18.10)
  const bLetters = BRG.letters.map((Lt, i) => {
    const tex = [false, true].map((open) => canvasTex(blossomLetter(Lt.ch, i, open, BM)));
    const q = st.add(new Quad(tex[0], Lt.w + 2 * BM, 7 * BC + 2 * BM), Z.PLATFORM + 1); q.userData.cs = BLOSSOM_KEEP;
    const gl = BRIDGE_GLYPHS[Lt.ch], tops = [...Array(Lt.wc)].map((_, cx) => { for (let y = 0; y < 7; y++) if (gl[y][cx] === '#') return y; return null; });
    return { ...Lt, i, q, tex, tops, tOpen: S(tBloom + i / T.fps()) };   // a one-frame ripple left to right
  });
  const colTop = (x) => { for (const b of bLetters) if (x >= b.x && x < b.x + b.w) { const yt = b.tops[Math.floor((x - b.x) / BC)]; return yt == null ? null : FLOOR + (2 - yt) * BC; } return null; };
  // walking height: the highest blossom cell under a ~6 px foot (an o's shoulder is not a pothole); a column whose only cell is
  // low (the l's base serif) counts as a gap between letters (null -> FLOOR, as before)
  const bridgeH = (x) => { let h = null; for (const dx of [-3, 0, 3]) { const v = colTop(x + dx); if (v != null && (h == null || v > h)) h = v; } return h != null && h >= FLOOR - BC ? h : null; };
  const letterFall = (b) => { const xr = bridgeDropX(b); for (let t = F1b; t < 21; t += 1 / 60) if (rubX(t) >= xr) return t; return 99; };
  bLetters.forEach((b) => (b.tFall = letterFall(b)));
  const tChew = [bLetters[0].tFall - 0.1, bLetters[bLetters.length - 1].tFall + 0.15];   // the rubbing edge is in the bridge: petals, not crumbs
  // the hat-trampoline prop + the solo crate
  const tramp = lib.get('charlie_prop_trampoline');
  const trampQ = st.add(new Quad(tramp.tex, tramp.w, tramp.h, { anchor: [29, 0] }), Z.ACTOR + 3);
  // the chasm: near pillar (hyperlink anchor), far column + Jade's post, the life sign + the life platform
  const pillarTop = X.ledgeY + 60;
  const post = await Hanzi2D.create('丨', { size: 70, bold: 3 }); post.place(0, 0); { const pb = post.strokeBox(0); post.place(X.post - (pb.x0 + pb.x1) / 2, X.ledgeY - pb.y0); }
  st.add(post.group, Z.PROP + 8); post.plan(g.post[0], g.post[1]);
  const postTop = post.strokeBox(0).y1 - 3;
  const signW = 226; const sign = st.add(new Quad(canvasTex(A.lifeSignBacklit(signW, 104)), signW, 60), Z.PROP + 7); sign.place(X.ch0 + 6, 66);
  const dim = st.add(rect(1, 1, '#14141a', 0.66), Z.PROP + 6);
  const lifeBt = blockText('life', { cell: 3, face: '#fff6d0', hi: '#ffffff', lo: '#d9b24a', edge: '#3a2f10' });
  const lifeQ = st.add(new Quad(canvasTex(lifeBt.canvas), lifeBt.w, lifeBt.h), Z.PLATFORM + 2); lifeQ.place(X.life0, X.lifeTop - lifeBt.h + 1);
  const lifeTopAt = (x) => { const h = lifeBt.heightAt(x - X.life0); return h > 0 ? X.lifeTop - lifeBt.h + h : null; };
  const LIFE1 = X.life0 + lifeBt.w;
  const linkedLbl = st.add(new TextSprite({ text: 'linked', font: 'fp12', color: PAL.hyperlink, outline: PAL.paperHi }, { anchor: 'bc' }), Z.TEXT);
  const underline = st.add(rect(1, 1, PAL.hyperlink), Z.TEXT);
  // draw-ahead: 一 platforms, the 丶 spring, the graphite wall with the rubbed door, the last ledge
  const plats = [];
  for (let k = 0; k < 4; k++) {
    const [x0, x1, top] = X.k[k]; const size = Math.round((x1 - x0) / 0.82);
    const h = await Hanzi2D.create('一', { size, bold: 2 }); h.place(0, 0); const bx = h.strokeBox(0);
    h.place((x0 + x1) / 2 - (bx.x0 + bx.x1) / 2, top - h.strokeTopAt(0, (bx.x0 + bx.x1) / 2)); st.add(h.group, Z.PLATFORM + 3);
    const [a, b] = g.platDraw[k]; h.plan(a, b); plats.push(h);
  }
  const dian = await Hanzi2D.create('丶', { size: 44, bold: 2 }); dian.place(0, 0); { const db = dian.strokeBox(0); dian.place(X.spring[0] - (db.x0 + db.x1) / 2, X.spring[1] + 14 - db.y0 - 1); }
  st.add(dian.group, Z.PLATFORM + 4); dian.plan(g.springDraw[0], g.springDraw[1]);
  const dianTop = dian.strokeBox(0).y1;
  const springQ = st.add(new Quad(canvasTex(A.springCanvas(14)), 13, 14, { anchor: [6, 0] }), Z.PLATFORM + 3);
  const [WX, WW, WH] = X.wall;
  const wallTex = [0, 0.34, 0.67, 1].map((k) => canvasTex(A.wallCanvas(WW, WH, k > 0 ? [4, WH - Math.round(30 * k), 12, Math.round(30 * k)] : null)));
  const wall = st.add(new Quad(wallTex[0], WW, WH), Z.PLATFORM + 4); wall.place(WX, X.ledge2[2]);
  const gPencil = st.add(new Pencil({ kind: 'graphite', len: 34 }), Z.FRONT);
  const gRig = new PencilRig(gPencil, [{ h: post, k: 0 }, ...plats.map((h) => ({ h, k: 0 })), { h: dian, k: 0 }], { lift: 12, angle: -35 });
  const torn = st.add(new Quad(canvasTex(A.tornEdge(180)), 10, 180), Z.BG2); torn.place(X.edge, -60);

  // ---------------------------------------------------------------- VOID: words -> platforms, then 未来
  const X_EDGE = X.edge;
  const R1Y = -66, R2Y = -78;
  const ROW1 = { x0: X_EDGE + 60, y0: R1Y, text: '说出来', slam: g.slams[0], born: 35.30 }, ROW2 = { x0: X_EDGE + 60 + 128, y0: R2Y, text: '它就存在', slam: g.slams[1], born: 36.18 };
  const rows = [ROW1, ROW2].map((R) => ({ ...R, chars: Array.from(R.text).map((ch, i) => { const cv = ART.extrudedChar(ch); const q = st.add(new Quad(canvasTex(cv), cv.width, cv.height), Z.PLATFORM + 4); q.setScale(3); return { ch, q, x: R.x0 + i * 40, w: cv.width * 3, h: cv.height * 3 }; }) }));
  const rowTop = (R) => R.y0 + 36;
  const R1T = rowTop(ROW1), R2T = rowTop(ROW2), R2END = ROW2.x0 + 4 * 40 - 2;
  const wei = await Hanzi2D.create('未', { size: 96, style: 'rainbow', shadowColor: '#0a1030', bold: 2 }); wei.place(0, 0);
  { const sb = wei.strokeBox(1); wei.place(R2END + 6 - sb.x0, R2T - wei.strokeTopAt(1, (sb.x0 + sb.x1) / 2) + 0); }
  st.add(wei.group, Z.PLATFORM + 5);
  const W1 = wei.strokeBox(1), W0 = wei.strokeBox(0);
  const W0T = wei.strokeTopAt(0, (W0.x0 + W0.x1) / 2), W1T = wei.strokeTopAt(1, (W1.x0 + W1.x1) / 2);
  const lai = await Hanzi2D.create('来', { size: 96, style: 'rainbow', shadowColor: '#0a1030', bold: 2 }); lai.place(0, 0);
  { const s3 = lai.strokeBox(3); lai.place(W1.x1 + 30 - s3.x0, W0T + 22 - lai.strokeTopAt(3, (s3.x0 + s3.x1) / 2)); }
  st.add(lai.group, Z.PLATFORM + 5);
  const L3 = lai.strokeBox(3), L0b = lai.strokeBox(0);
  const L3T = lai.strokeTopAt(3, (L3.x0 + L3.x1) / 2), L0T = lai.strokeTopAt(0, (L0b.x0 + L0b.x1) / 2);
  wei.plan(g.wei[0], g.wei[1], { gap: 0.12 }); lai.plan(g.lai[0], g.lai[1], { gap: 0.12 });
  const doneAt = (h, i) => h.plans[0].items.find((it) => it.i === i).b, startAt = (h, i) => h.plans[0].items.find((it) => it.i === i).a;
  const rPencil = st.add(new Pencil({ kind: 'rainbow', len: 60 }), Z.FRONT + 1);
  const rRig = new PencilRig(rPencil, [{ h: wei, k: 0 }, { h: lai, k: 0 }], { lift: 18, angle: -30, exit: [L3.x1 + 120, L0T + 140, 0.5] });
  const cubes = [[X_EDGE + 30, 150, 22], [X_EDGE + 140, 40, 16], [X_EDGE + 260, 160, 26], [X_EDGE + 380, -20, 18], [X_EDGE + 470, 200, 20], [X_EDGE + 200, -90, 20], [X_EDGE + 420, 90, 14], [X_EDGE + 60, -40, 16]].map(([x, y, s], i) => {
    const cv = ART.cubeCanvas(s, PAL.gizmoBlue, i % 2 === 1); const q = st.add(new Quad(canvasTex(cv), cv.width, cv.height), Z.PARALLAX + 2); return { q, x, y };
  });
  const chkSq = [[X_EDGE + 70, 110, 12], [X_EDGE + 210, 190, 16], [X_EDGE + 330, 30, 10], [X_EDGE + 420, 130, 14], [X_EDGE + 300, -60, 12]].map(([x, y, s]) => { const q = st.add(new CheckerRect(3), Z.PARALLAX + 3); q.setRect(x, y, s, s); return q; });
  const lorem = st.add(new TextSprite({ text: 'lorem ipsum dolor sit amet\nTODO: level_1_2.json\nnull', font: 'fp8', color: '#2a4a8a' }, { anchor: 'bl' }), Z.PARALLAX + 2); lorem.place(X_EDGE + 90, 150);

  // ---------------------------------------------------------------- the course (x -> ground y) + the lead (Jade) x(u)
  const xCrate = X.crate;
  const tkCrate = g.J1(14.862), ldCrate = g.J1(15.286);
  const Lk = [X.k[0][0] + 14, X.k[1][0] + 10, X.k[2][0] + 12, X.k[3][1] - 18];
  const jumps = [
    { x0: tkCrate, x1: ldCrate, apex: 34, flip: true },
    { x0: BX1 - 6, x1: X.ledge0 + 16, apex: 12 },
    { x0: X.floor3 - 16, x1: X.floor3 + 10, apex: 10 },
    { x0: X.XF - 4, x1: Lk[0], apex: 16 }, { x0: X.k[0][1] - 6, x1: Lk[1], apex: 16 }, { x0: X.k[1][1] - 4, x1: Lk[2], apex: 14 }, { x0: X.k[2][1] - 4, x1: Lk[3], apex: 16 },
  ];
  const ground = (x) => {
    if (x < X.pit0) return FLOOR;
    if (x < BX1) return bridgeH(x) ?? FLOOR;
    if (x < X.ch0 + 4) return X.ledgeY;
    if (x < X.ch1 + X.colW) return X.ledgeY;
    if (x < X.floor3 - 8) return lifeTopAt(Math.min(LIFE1 - 2, Math.max(X.life0 + 2, x))) ?? X.lifeTop;
    if (x < X.XF + 4) return FLOOR;
    for (let k = 0; k < 4; k++) if (x >= X.k[k][0] - 8 && x < X.k[k][1] + 2) return X.k[k][2];
    return X.ledge2[2];
  };
  jumps.forEach((j) => { j.y0 = ground(j.x0 - 0.5); j.y1 = ground(j.x1 + 0.5); });
  const courseAt = (x, apexK = 1) => {
    for (const j of jumps) if (x > j.x0 && x < j.x1) {
      const k = (x - j.x0) / (j.x1 - j.x0); const top = Math.max(j.y0, j.y1) + j.apex; const c = 4 * (top - (j.y0 + j.y1) / 2) * apexK;
      return { y: j.y0 + (j.y1 - j.y0) * k + c * k * (1 - k), air: true, rising: (j.y1 - j.y0) + c * (1 - 2 * k) > 0, jump: j, k };
    }
    return { y: ground(x), air: false };
  };
  const io = T.ease.inOut, eo = T.ease.out;
  const uPaint = [g.uSpin, g.uRun2];
  const leadX = pw([
    ...g.lead,
    [U(22.69), X.stopJ],
    [g.uLife - 1e-4, X.stopJ], [g.uLife, X.lifeLandJ], [g.uShield, 1530], [g.uShield1, 1566], [U(27.55), 1614], [g.uSpin, X.spinJ, eo],
    [g.uRun2, X.spinJ], [g.landK[0], Lk[0]], [g.landK[1], Lk[1]], [g.landK[2], Lk[2]], [g.landK[3], Lk[3]],
    [U(33.10), WX - 12, eo], [U(33.30), WX - 12], [U(33.44), WX + 22], [U(34.0), X_EDGE + 2], [U(34.8), X_EDGE + 120],
  ]);
  /** breathing gap behind the hero ahead (px), tightened while huddled under the shield */
  const gapAt = (u, i) => {
    const hud = T.span(u, g.uShield - 0.2, g.uShield) * (1 - T.span(u, g.uShield1, g.uShield1 + 0.3));
    const base = breathe(u, i, { min: 14, max: 38, seed: 3, rate: 0.9, bias: i === 2 ? 0.7 : 0.4 });
    const flee = T.span(u, U(33.30), U(33.6));
    return base + ((hud > flee ? 27 : 20) - base) * Math.max(hud, flee);
  };
  const HEROES = ['jade', 'charlie', 'ricky'];
  const defaultState = (u, i) => {
    let x = leadX(u); for (let k = 1; k <= i; k++) x -= gapAt(u, k);
    const c = courseAt(x, HERO_JUMP[HEROES[i]].apex);
    const dx = (leadX(u + 0.02) - leadX(u - 0.02)) / 0.04;
    const moving = Math.abs(dx) > 12;
    return { x, y: c.y, air: c.air, anim: c.air ? 'jump' : moving ? 'run' : 'idle', frame: c.air ? (c.rising ? 0 : 1) : moving ? Math.floor(x / 7 + i * 2) : undefined, t: u, facing: 1, jump: c.jump, k: c.k };
  };

  // ---------------------------------------------------------------- set pieces (per-hero overrides, u-time)
  const OV = { jade: [], charlie: [], ricky: [] };
  const ov = (h, u0, u1, fn) => OV[h].push({ u0, u1, fn });
  const dEnd = (i, u) => defaultState(u, i);
  // Room 1 solos -------------------------------------------------------------------------------------------------
  // Charlie bounces off his own hat (dropped on the floor) over the crate; lands on the 8th 15.498
  { const u0 = U(14.98), uHat = U(15.06), uOn = U(15.16), uLand = S(15.498); const hatX = xCrate[0] - 16;
    const a = dEnd(1, u0); const e = dEnd(1, uLand);
    ov('charlie', u0, uLand, (u) => {
      if (u < uHat) return { ...defaultState(u, 1), anim: 'throw', frame: u < u0 + 0.04 ? 0 : 1 };
      if (u < uOn) { const k = (u - uHat) / (uOn - uHat); const [x, y] = arc([a.x + 4, FLOOR], [hatX, FLOOR + 4], k, 10); return { x, y, anim: 'jump', frame: k < 0.5 ? 0 : 1, air: true }; }
      const k = (u - uOn) / (uLand - uOn); const [x, y] = arc([hatX, FLOOR + 4], [e.x, FLOOR], k, 44); return { x, y, anim: 'jump', frame: k < 0.5 ? 0 : 1, air: true };
    });
    G1.charlieHat = { hatX, uHat, uOn, uLand }; }
  // Ricky lumbers ONTO the crate (short heavy jump, stomp), walks across, drops off; lags, then rejoins on beat 37
  { const u0 = U(15.24), uOn = S(15.498), uWalk = U(15.62), uOff = UB(36), uJoin = UB(37); const top = FLOOR + 18;
    const a = dEnd(2, u0), e = dEnd(2, uJoin);
    ov('ricky', u0, uJoin, (u) => {
      if (u < uOn) { const k = (u - u0) / (uOn - u0); const [x, y] = arc([a.x, FLOOR], [xCrate[0] + 4, top], k, 6); return { x, y, anim: 'jump', frame: k < 0.6 ? 0 : 1, air: true }; }
      if (u < uWalk) return { x: xCrate[0] + 4 + 8 * (u - uOn) / (uWalk - uOn), y: top, anim: 'run', frame: Math.floor((u - uOn) * 16) };
      if (u < uOff) { const k = (u - uWalk) / (uOff - uWalk); const [x, y] = arc([xCrate[0] + 12, top], [xCrate[1] + 14, FLOOR], k, 4); return { x, y, anim: 'jump', frame: 1, air: true }; }
      const k = (u - uOff) / (uJoin - uOff); const x = xCrate[1] + 14 + (e.x - xCrate[1] - 14) * k; return { x, y: FLOOR, anim: 'run', frame: Math.floor(x / 7) };
    }); }
  // Jade's martial-arts flip over the crate (rotation drawn from pre-rotated frames)
  const flipFrames = [...Array(12)].map((_, i) => { const cv = A.frameCanvas(lib, 'jade_jump', 0); const r = A.rotCanvas(cv, -i * 30, [18, 24]); return { tex: canvasTex(r.cv), w: r.cv.width, h: r.cv.height, n: 1, anchor: [r.px, r.py] }; });
  // Re-hit: Jade's twin-pencil draw (pose) + stance; Ricky turns and fires the chord at the Eraser
  const uRH = U(F1b) + 1e-4, uChord = U(17.615);
  ov('jade', uRH, g.uRe, (u) => { const s = defaultState(u, 0); const tt = u - uRH; const n = P.jade_twin_draw.n;
    if (tt < 0.06 * n || P.jade_twin_draw.art) return { ...s, pose: P.jade_twin_draw, pframe: Math.min(n - 1, Math.floor(tt / 0.06)), facing: -1 };   // art: hold f3 (stance)
    return { ...s, anim: 'drum', frame: 1, facing: -1 }; });
  ov('ricky', uRH, g.uRe, (u) => ({ ...defaultState(u, 2), anim: u < uChord ? 'idle' : 'chord', frame: u < uChord ? 0 : u < uChord + 0.14 ? 1 : 0, facing: -1 }));
  // blossoms: Ricky falls short off the last s; Charlie's hat trampoline in the pit; BOING; ledge on beat 46
  const uEdrop = U(19.30), uBoing = U(19.46), uRlede = UB(46), uThrowB = U(19.30), uHatPit = U(19.42);
  const pitHat = [X.pit1 - 6, 36];
  const rEdge = BX1 - 4;    // (M3) Ricky slows to the end of the last s (he reaches it ~19.1; was BX1 - 14, which now walked him backwards)
  { const u0 = U(19.10); const a = () => dEnd(2, u0);
    ov('ricky', u0, uRlede + 0.12, (u) => {
      const A0 = a();
      if (u < uEdrop) { const x = A0.x + (rEdge - A0.x) * (u - u0) / (uEdrop - u0); return { x, y: bridgeH(x) ?? FLOOR, anim: 'run', frame: Math.floor(x / 7) }; }
      if (u < uBoing) { const k = (u - uEdrop) / (uBoing - uEdrop); const [x, y] = arc([rEdge, FLOOR], [pitHat[0], pitHat[1] + 10], k, 8); return { x, y, anim: 'jump', frame: k < 0.3 ? 0 : 1, air: true }; }
      if (u < uRlede) { const k = (u - uBoing) / (uRlede - uBoing); const [x, y] = arc([pitHat[0], pitHat[1] + 10], [X.ledge0 + 12, X.ledgeY], k, 40); return { x, y, anim: 'jump', frame: k < 0.55 ? 0 : 1, air: true }; }
      return { x: X.ledge0 + 12 + 30 * (u - uRlede), y: X.ledgeY, anim: 'run', frame: Math.floor(u * 20) };
    });
  }
  const rejoin = (h, i, u0, u1, from) => ov(h, u0, u1, (u) => { const e = dEnd(i, u1); const k = T.ease.inOut((u - u0) / (u1 - u0)); const x = from[0] + (e.x - from[0]) * k; const c = courseAt(x, HERO_JUMP[h].apex); return { x, y: c.air ? c.y : ground(x), anim: c.air ? 'jump' : 'run', frame: c.air ? 1 : Math.floor(x / 7), air: c.air }; });
  rejoin('ricky', 2, uRlede + 0.12, uRlede + 0.75, [X.ledge0 + 12 + 3.6, X.ledgeY]);
  { const u0 = U(19.27), u1 = UB(46) + 0.15;
    ov('charlie', u0, u1, (u) => { const s = defaultState(u0, 1); const x = Math.max(X.ledge0 + 26, s.x);
      if (u < uThrowB + 0.10) return { x, y: X.ledgeY, anim: 'throw', frame: u < uThrowB + 0.04 ? 0 : 1, facing: -1 };
      return { x, y: X.ledgeY, anim: 'idle', facing: -1 }; });
    rejoin('charlie', 1, u1, u1 + 0.5, [Math.max(X.ledge0 + 26, defaultState(u0, 1).x), X.ledgeY]); }
  // linked: Jade draws the post (pose), Ricky's click, Charlie's hook + the human chain, the freeze, the parachute
  const uDraw = [UB(50), U(22.36)], uRClick = UB(53), uCThrow = UB(54), uHook = U(23.41), uCgrab = U(23.49), uJjump = U(23.45), uJgrab = U(23.56), uRjump = U(23.50), uRgrab = U(23.64);
  const uLetGo = U(F2b) + 1e-4, uPop = U(24.42), uLand = g.uLife;
  const chainA = [X.ch0 - 2, pillarTop - 2], chainB = [X.post, postTop];
  const chainY = (x) => { const k = Math.max(0, Math.min(1, (x - chainA[0]) / (chainB[0] - chainA[0]))); return chainA[1] + (chainB[1] - chainA[1]) * k - 10 * Math.sin(Math.PI * k); };
  const hookX = (u) => X.ch0 + 30 + (u > uHook ? Math.min(1, (u - uHook) / 0.9) * 110 : 0) * (u > uCgrab ? 1 : 0.15);
  const hookAt = (u) => { const x = hookX(u); return [x, chainY(x) - 2]; };
  const swing = (u) => P.jade_dangle.art ? 12 + 14 * Math.sin(Math.max(0, u - uCgrab) * 6.0) : 16 + 16 * Math.sin(Math.max(0, u - uCgrab) * 6.0);   // art: trails down-LEFT as the hat zips right        // pendulum (deg, + = trailing left)
  /** the human chain at scene time u: [charlie, jade, ricky] grip/foot points and angles (jade/ricky only once grabbed) */
  // art: Jade hangs MIRRORED (grip top-left, pencil hand down-right) so the chain marches down-right and every
  // hand-hold sits in clear air: hook -> Charlie -> his boot / Jade's fist -> her free hand / Ricky's fist
  const JFLIP = !!P.jade_dangle.art;
  const chainPose = (u) => {
    const hook = hookAt(u); const th = swing(u);
    const c = rot(P.charlie_dangle, 0, th); const cf = [hook[0] + c.foot[0], hook[1] + c.foot[1]];
    const ja = th + 8; const j = rot(P.jade_dangle, 1, JFLIP ? -ja : ja);
    const jfoot = JFLIP ? [-j.foot[0], j.foot[1]] : j.foot;
    const jf = [cf[0] + jfoot[0] + (JFLIP ? 3 : 0), cf[1] + jfoot[1] - (JFLIP ? 3 : 0)];   // arms out: each hand-hold reads
    const r = rot(P.ricky_dangle, 0, th + 14);
    return { hook, th, c, cf, j, jf, r };
  };
  { const sC = () => dEnd(1, uCThrow);
    ov('charlie', uRClick - 0.3, uCThrow, (u) => ({ ...defaultState(u, 1), anim: 'idle', facing: 1 }));
    ov('charlie', uCThrow, uLetGo, (u) => {
      if (u < uHook) return { ...sC(), anim: 'throw', frame: u < uCThrow + 0.05 ? 0 : 1 };
      if (u < uCgrab) { const k = (u - uHook) / (uCgrab - uHook); const h = hookAt(u); const [x, y] = arc([sC().x, X.ledgeY], [h[0], h[1] - 42], k, 10); return { x, y, anim: 'jump', frame: 0, air: true }; }
      const cp = chainPose(u); return { x: cp.hook[0], y: cp.hook[1], rotPose: cp.c, air: true };
    });
    ov('jade', uDraw[0], uJjump, (u) => ({ ...defaultState(u, 0), anim: u < uDraw[1] ? 'draw_graphite' : 'idle', frame: 0 }));
    ov('jade', uJjump, uLetGo, (u) => {
      const s0 = defaultState(uJjump, 0);
      if (u < uJgrab) { const k = (u - uJjump) / (uJgrab - uJjump); const cp = chainPose(uJgrab); const [x, y] = arc([s0.x, X.ledgeY], [cp.cf[0], cp.cf[1] - 42], k, 16); return { x, y, anim: 'jump', frame: 0, air: true }; }
      const cp = chainPose(u); return { x: cp.cf[0], y: cp.cf[1], rotPose: cp.j, air: true, facing: JFLIP ? -1 : 1 };
    });
    ov('ricky', uRClick - 0.3, uRjump, (u) => ({ ...defaultState(u, 2), anim: u >= uRClick ? 'chord' : 'idle', frame: u >= uRClick && u < uRClick + 0.14 ? 1 : 0 }));
    ov('ricky', uRjump, uLetGo, (u) => {
      const s0 = defaultState(uRjump, 2);
      if (u < uRgrab) { const k = (u - uRjump) / (uRgrab - uRjump); const cp = chainPose(uRgrab); const [x, y] = arc([s0.x, X.ledgeY], [cp.jf[0], cp.jf[1] - 42], k, 10); return { x, y, anim: 'jump', frame: 0, air: true }; }
      const cp = chainPose(u); return { x: cp.jf[0], y: cp.jf[1], rotPose: cp.r, air: true };
    });
  }
  // the parachute: let go 24.22, fall a beat, the hat pops into a canopy (24.34), the chain of three drifts onto "life"
  const pcLand = [X.lifeLandJ - BL[0], (lifeTopAt(X.lifeLandJ) ?? X.lifeTop) + DROP - BL[1]];
  const pcAt = (u) => {
    const cp = chainPose(uLetGo - 2e-4); const p0 = [cp.hook[0], cp.hook[1] - 42];
    if (u < uPop) { const k = (u - uLetGo) / (uPop - uLetGo); return [p0[0] + 36 * k, p0[1] + 26 * (1 - (1 - k) * (1 - k))]; }   // released at the top of the swing
    const p1 = [p0[0] + 36, p0[1] + 26]; const k = T.ease.inOut((u - uPop) / (uLand - uPop));
    return [p1[0] + (pcLand[0] - p1[0]) * k, p1[1] + (pcLand[1] - p1[1]) * k + 6 * Math.sin(Math.PI * k) + 2 * Math.sin(u * 7)];
  };
  ov('charlie', uLetGo, uLand + 0.12, (u) => { if (u >= uLand) { const k = (u - uLand) / 0.12; return { x: pcLand[0], y: pcLand[1] + (X.lifeTop - pcLand[1]) * k, anim: 'jump', frame: 1, air: true }; }
    const [x, y] = pcAt(u); return u < uPop ? { x, y, anim: 'jump', frame: 1, air: true } : { x, y, pose: P.charlie_parachute_carry, pframe: Math.floor(u * 6), air: true }; });
  ov('jade', uLetGo, uLand, (u) => { const [x, y] = pcAt(u); return { x: x + BL[0], y: y + BL[1], pose: P.jade_dangle, pframe: 1, air: true, hang: true }; });
  ov('ricky', uLetGo, uLand, (u) => { const [x, y] = pcAt(u); return { x: x + BR[0], y: y + BR[1], pose: P.ricky_dangle, pframe: 0, air: true, hang: true }; });
  // after the landing on "life": Charlie and Ricky fall back into formation behind Jade
  { const u0 = uLand, u1 = U(26.0);
    for (const [h, i, x0] of [['charlie', 1, pcLand[0]], ['ricky', 2, pcLand[0] + BR[0]]]) ov(h, h === 'charlie' ? u0 + 0.12 : u0, u1, (u) => { const e = dEnd(i, u1); const k = (u - u0) / (u1 - u0); const x = x0 + (e.x - x0) * k; const c = courseAt(x, HERO_JUMP[h].apex); return { x, y: c.y, anim: c.air ? 'jump' : 'run', frame: c.air ? 1 : Math.floor(x / 7), air: c.air }; }); }
  // the shield: Charlie's hat held up over the huddle
  ov('charlie', g.uShield, g.uShield1, (u) => ({ ...defaultState(u, 1), anim: 'shield', frame: Math.floor(u * 6) % 3 }));
  // colour: Charlie + Ricky run past Jade while she spins and paints; they wait and watch, then rejoin
  { const u0 = U(27.40), uW = g.uSpin + 0.35, u1 = U(30.40); const wait = { charlie: X.spinJ + 78, ricky: X.spinJ + 52 };
    for (const [h, i] of [['charlie', 1], ['ricky', 2]]) {
      const a = () => dEnd(i, u0), e = () => dEnd(i, u1);
      ov(h, u0, u1, (u) => {
        if (u < uW) { const k = (u - u0) / (uW - u0); const x = a().x + (wait[h] - a().x) * eo(k); return { x, y: FLOOR, anim: k < 0.95 ? 'run' : 'idle', frame: Math.floor(x / 7) }; }
        const go = g.uRun2 + (i === 1 ? 0.25 : 0.4);
        if (u < go) return { x: wait[h], y: FLOOR, anim: 'idle', facing: -1 };
        const k = (u - go) / (u1 - go); const x = wait[h] + (e().x - wait[h]) * k; return { x, y: FLOOR, anim: 'run', frame: Math.floor(x / 7) };
      });
    }
    ov('jade', U(27.55), g.uSpin, (u) => ({ ...defaultState(u, 0), facing: u < U(27.70) ? -1 : 1 }));
    ov('jade', g.uSpin, g.uRun2, (u) => ({ ...defaultState(u, 0), anim: 'draw_rainbow', frame: 0, facing: -1 }));
  }
  // draw-ahead: Ricky falls short of the k1 -> k2 gap; Jade colours the 丶: a spring; BOING onto k2 on beat 77
  const uRj = UB(76), uSpr = U(32.86), uRk2 = UB(77);
  { const sA = () => dEnd(2, uRj); const e = () => dEnd(2, uRk2 + 0.25);
    ov('ricky', uRj - 0.15, uRk2 + 0.25, (u) => {
      const a = sA();
      if (u < uRj) { const x = X.k[1][1] - 8 + (u - uRj) * 60; return { x, y: X.k[1][2], anim: 'run', frame: Math.floor(x / 7) }; }
      if (u < uSpr) { const k = (u - uRj) / (uSpr - uRj); const [x, y] = arc([X.k[1][1] - 8, X.k[1][2]], [X.spring[0], dianTop], k, 10); void a; return { x, y, anim: 'jump', frame: k < 0.35 ? 0 : 1, air: true }; }
      if (u < uRk2) { const k = (u - uSpr) / (uRk2 - uSpr); const [x, y] = arc([X.spring[0], dianTop], [X.k[2][0] + 10, X.k[2][2]], k, 34); return { x, y, anim: 'jump', frame: k < 0.5 ? 0 : 1, air: true }; }
      const k = (u - uRk2) / 0.25; const x = X.k[2][0] + 10 + (e().x - X.k[2][0] - 10) * k; const c = courseAt(x, HERO_JUMP.ricky.apex); return { x, y: c.y, anim: c.air ? 'jump' : 'run', frame: Math.floor(x / 7), air: c.air };
    });
  }
  ov('jade', U(32.74), U(32.92), (u) => ({ ...defaultState(u, 0), anim: 'draw_rainbow', frame: 0, facing: -1 }));
  ov('jade', U(33.10), U(33.30), (u) => ({ ...defaultState(u, 0), pose: P.jade_erase, pframe: Math.floor(u * 14) }));
  // off the edge into the VOID; the parachute catch (beat 81); 说出来 / 它就存在; touch 36.05, land 37.245
  const uCatch = UB(81), uT1 = U(g.slams[0]), uLand2 = UB(87);
  const edgeT = (i) => { let lo = U(33.5), hi = U(35.5); for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (defaultState(m, i).x >= X_EDGE) hi = m; else lo = m; } return hi; };
  const uEdge = [edgeT(0), edgeT(1), edgeT(2)];
  const fallAt = (i, u) => { const s = u - uEdge[i]; return [X_EDGE + 2 + 95 * s, X.ledge2[2] + 30 * s - 0.5 * 200 * s * s]; };
  const pc0 = fallAt(1, uCatch);
  // the canopy steers down onto the ghost 说出来 and touches it on the exact frame Ricky's chord slams it solid (35.64)
  const pcTouch = [ROW1.x0 + 62, R1T + DROP - BL[1]];
  const pcVoid = (u) => { const k = io(T.clamp01((u - uCatch) / (uT1 - uCatch))); return [pc0[0] + (pcTouch[0] - pc0[0]) * k, pc0[1] + (pcTouch[1] - pc0[1]) * k + 4 * Math.sin(u * 6)]; };
  const R1E = ROW1.x0 + 112;                          // row 1's right end; hop down to 它就存在 as it slams (36.49)
  const uT2 = U(g.slams[1]);
  const hopTo = (a, b, u0, u1, h, o = {}) => (u) => { const k = T.clamp01((u - u0) / (u1 - u0)); const [x, y] = arc(a, b, k, h); return { x, y, anim: 'jump', frame: k < 0.5 ? 0 : 1, air: true, ...o }; };
  const runTo = (x0, x1, y, u0, u1, o = {}) => (u) => { const k = T.clamp01((u - u0) / (u1 - u0)); const x = x0 + (x1 - x0) * eo(k); return { x, y, anim: k < 0.98 ? 'run' : 'idle', frame: Math.floor(x / 7), ...o }; };
  const sPos = { jade: R2END - 6, charlie: R2END - 34, ricky: R2END - 60 };
  const seq = (parts) => (u) => { for (const [u1, fn] of parts) if (u < u1) return fn(u); return parts[parts.length - 1][1](u); };
  // Jade: fall -> dangle (sings 说出来) -> touch -> run to row 1's end -> hop onto 它就存在 as it slams -> her spot on 在
  ov('jade', uEdge[0], uLand2, seq([
    [uCatch, (u) => { const [x, y] = fallAt(0, u); return { x, y, anim: 'jump', frame: 1, air: true }; }],
    [uT1, (u) => { const [x, y] = pcVoid(u); const f = fallAt(0, uCatch), k = T.span(u, uCatch, uCatch + 0.1); return { x: f[0] + (x + BL[0] - f[0]) * k, y: f[1] + (y + BL[1] - f[1]) * k, pose: P.jade_dangle, pframe: 1, air: true, hang: true }; }],
    [U(35.95), (u) => ({ x: pcTouch[0] + BL[0], y: R1T, anim: 'sing', frame: 0 })],
    [U(36.18), runTo(pcTouch[0] + BL[0], R1E, R1T, U(35.95), U(36.18))],
    [uT2, hopTo([R1E, R1T], [ROW2.x0 + 36, R2T], U(36.18), uT2, 14)],
    [U(37.0), runTo(ROW2.x0 + 36, sPos.jade, R2T, uT2, U(37.0))],
    [1e9, () => ({ x: sPos.jade, y: R2T, anim: 'sing', frame: 0 })],
  ]));
  // Charlie: fall -> pops the canopy (beat 81), steers down -> lands on 说出来, canopy closes -> hops down (beat 86)
  ov('charlie', uEdge[1], uLand2, seq([
    [uCatch, (u) => { const [x, y] = fallAt(1, u); return { x, y, anim: 'jump', frame: 1, air: true }; }],
    [uT1, (u) => { const [x, y] = pcVoid(u); return { x, y, pose: P.charlie_parachute_carry, pframe: Math.floor(u * 6), air: true }; }],
    [U(35.80), (u) => { const k = T.span(u, uT1, U(35.80)); return { x: pcTouch[0], y: pcTouch[1] + (R1T - pcTouch[1]) * io(k), pose: P.charlie_parachute_carry, pframe: 0, air: k < 1 }; }],
    [U(36.40), runTo(pcTouch[0], R1E - 4, R1T, U(35.80), U(36.40))],
    [UB(86), hopTo([R1E - 4, R1T], [ROW2.x0 + 30, R2T], U(36.40), UB(86), 12)],
    [1e9, runTo(ROW2.x0 + 30, sPos.charlie, R2T, UB(86), uLand2 + 0.2)],
  ]));
  // Ricky: fall -> dangles (chord slams 说出来 while hanging) -> touch -> standing chord slams 它就存在 -> hops down (beat 87)
  ov('ricky', uEdge[2], uLand2 + 0.4, seq([
    [uCatch, (u) => { const [x, y] = fallAt(2, u); return { x, y, anim: 'jump', frame: 1, air: true }; }],
    [uT1, (u) => { const [x, y] = pcVoid(u); const f = fallAt(2, uCatch), k = T.span(u, uCatch, uCatch + 0.1); const playing = u >= uT1 - 0.14;
      return { x: f[0] + (x + BR[0] - f[0]) * k, y: f[1] + (y + BR[1] - f[1]) * k, pose: playing ? P.ricky_dangle_play : P.ricky_dangle, pframe: playing ? 1 : 0, air: true, hang: true }; }],
    [uT2 - 0.14, (u) => ({ x: pcTouch[0] + BR[0], y: R1T, anim: 'idle' })],
    [uT2 + 0.2, (u) => ({ x: pcTouch[0] + BR[0], y: R1T, anim: 'chord', frame: u < uT2 + 0.02 ? 1 : 0 })],
    [U(36.95), runTo(pcTouch[0] + BR[0], R1E - 8, R1T, uT2 + 0.2, U(36.95))],
    [uLand2, hopTo([R1E - 8, R1T], [ROW2.x0 + 24, R2T], U(36.95), uLand2, 8)],
    [1e9, runTo(ROW2.x0 + 24, sPos.ricky, R2T, uLand2, uLand2 + 0.4)],
  ]));
  // 未来: chase the pencil tip up the strokes while they are drawn
  const uW0 = U(doneAt(wei, 0)) , uJ1 = UB(90), uL0 = UB(93), uC2 = UB(94), uRf = U(40.10), uTr = U(40.30), uLai = U(40.536), uPara = UB(95), uJgrab2 = U(40.88);
  const W0x = (W0.x0 + W0.x1) / 2, L0x = (L0b.x0 + L0b.x1) / 2;
  ov('jade', uLand2, U(41.2), (u) => {
    if (u < U(38.25)) return { x: sPos.jade, y: R2T, anim: 'sing', frame: 0 };
    if (u < U(38.30)) return { x: sPos.jade, y: R2T, anim: 'draw_rainbow', frame: 0 };
    if (u < uJ1) { const k = (u - U(38.30)) / (uJ1 - U(38.30)); const [x, y] = arc([sPos.jade, R2T], [W0.x0 + 8, W0T], k, 18); return { x, y, anim: 'jump', frame: k < 0.5 ? 0 : 1, air: true }; }
    if (u < U(39.40)) { const x = W0.x0 + 8 + (W0.x1 - 10 - W0.x0 - 8) * Math.min(1, (u - uJ1) / 0.45); return { x, y: W0T, anim: u - uJ1 < 0.45 ? 'run' : 'draw_rainbow', frame: Math.floor(x / 7) }; }
    if (u < uL0) { const k = (u - U(39.40)) / (uL0 - U(39.40)); const [x, y] = arc([W0.x1 - 10, W0T], [L0x - 6, L0T], k, 22); return { x, y, anim: 'jump', frame: k < 0.55 ? 0 : 1, air: true }; }
    if (u < uJgrab2) return { x: L0x - 6, y: L0T, anim: u < U(40.4) ? 'draw_rainbow' : 'sing', frame: 0 };
    const [x, y] = pcRise(u); const k = T.span(u, uJgrab2, uJgrab2 + 0.07);
    if (k < 1) return { x: L0x - 6 + (x + BL[0] - L0x + 6) * k, y: L0T + (y + BL[1] - DROP - L0T) * k, anim: 'jump', frame: 1, air: true };
    return { x: x + BL[0], y: y + BL[1], pose: P.jade_dangle, pframe: 1, air: true, hang: true };
  });
  const W1end = W1.x1 - 6, L3x = L3.x0 + 16;
  ov('charlie', uLand2, U(41.2), (u) => {
    if (u < uLand2 + 0.2) return runTo(ROW2.x0 + 30, sPos.charlie, R2T, UB(86), uLand2 + 0.2)(u);
    if (u < U(38.60)) return { x: sPos.charlie, y: R2T, anim: 'idle' };
    if (u < U(39.80)) { const x = sPos.charlie + (W1end - 6 - sPos.charlie) * Math.min(1, (u - U(38.60)) / 0.8); return { x, y: R2T, anim: u - U(38.60) < 0.8 ? 'run' : 'idle', frame: Math.floor(x / 7) }; }
    if (u < uC2) { const k = (u - U(39.80)) / (uC2 - U(39.80)); const [x, y] = arc([W1end - 6, W1T], [L3x + 14, L3T], k, 14); return { x, y, anim: 'jump', frame: k < 0.5 ? 0 : 1, air: true }; }
    if (u < uRf + 0.04) return { x: L3x + 14, y: L3T, anim: 'idle' };
    if (u < uTr + 0.08) return { x: L3x + 10, y: L3T, anim: 'throw', frame: u < uRf + 0.08 ? 0 : 1, facing: -1 };
    if (u < uPara) return { x: L3x + 10, y: L3T, anim: 'idle', facing: -1 };
    const [x, y] = pcRise(u); return { x, y, pose: P.charlie_parachute_carry, pframe: Math.floor(u * 6), air: true };
  });
  const trHat = [W1.x1 + 14, W1T - 10];
  ov('ricky', uLand2 + 0.4, U(41.2), (u) => {
    if (u < U(38.80)) return { x: sPos.ricky, y: R2T, anim: 'idle' };
    if (u < uRf) { const x = sPos.ricky + (W1end - sPos.ricky) * Math.min(1, (u - U(38.80)) / 0.9); return { x, y: R2T, anim: u - U(38.80) < 0.9 ? 'run' : 'idle', frame: Math.floor(x / 7) }; }
    if (u < uTr) { const k = (u - uRf) / (uTr - uRf); const [x, y] = arc([W1end, W1T], [trHat[0], trHat[1] + 6], k, 8); return { x, y, anim: 'jump', frame: k < 0.4 ? 0 : 1, air: true }; }
    if (u < uLai) { const k = (u - uTr) / (uLai - uTr); const [x, y] = arc([trHat[0], trHat[1] + 6], [L3x - 6, L3T], k, 30); return { x, y, anim: 'jump', frame: k < 0.5 ? 0 : 1, air: true }; }
    if (u < uPara + 0.05) return { x: L3x - 6, y: L3T, anim: 'sustain', t: u - uLai };
    const [x, y] = pcRise(u); return { x: x + BR[0], y: y + BR[1], pose: P.ricky_dangle_play, pframe: Math.floor(u * 4), air: true, hang: true };
  });
  function pcRise(u) { const s = Math.max(0, u - uPara); return [L3x + 10 + 30 * s + 3 * Math.sin(s * 5), L3T + 6 + 100 * s + 40 * s * s]; }
  G1.tramp2 = trHat;

  const stateAt = (u, i) => { const h = HEROES[i]; for (const o of OV[h]) if (u >= o.u0 && u < o.u1) return { ...defaultState(u, i), frame: undefined, ...o.fn(u), hero: h }; return { ...defaultState(u, i), hero: h }; };

  // ---------------------------------------------------------------- actors
  const actors = { jade: st.add(new Actor(lib, 'jade', { name: 'jade' }), Z.ACTOR + 2), charlie: st.add(new Actor(lib, 'charlie'), Z.ACTOR + 1), ricky: st.add(new Actor(lib, 'ricky'), Z.ACTOR) };
  const poseQ = { jade: st.add(new PoseQuad(), Z.ACTOR + 2), charlie: st.add(new PoseQuad(), Z.ACTOR + 1), ricky: st.add(new PoseQuad(), Z.ACTOR) };
  const bang = canvasTex(bangCanvas());
  const bangs = HEROES.map(() => st.add(new Quad(bang, 9, 14, { anchor: [4, 0] }), Z.TEXT));
  const hatSp = lib.get('charlie_hat_boomerang');
  const hat = st.add(new Quad(hatSp.tex, 16, 16, { anchor: [8, 8] }), Z.ACTOR_FRONT);
  const strap = st.add(rect(1, 1, '#5a3a1a'), Z.ACTOR - 1);
  const eraserQ = st.add(new PoseQuad(), Z.PROP + 5); eraserQ.userData.cs = 1;   // H2: the rainbow smudge she rubs onto it (the Eraser is grey anyway)
  const smearQ = st.add(new PoseQuad(), Z.PROP + 5);
  const shieldDome = (() => { const dome = A.cropX(A.frameCanvas(lib, 'charlie_prop_parachute', 0), 6, 6); const r = A.rotCanvas(dome, 12, [dome.width / 2, dome.height - 4]); return st.add(new Quad(canvasTex(r.cv), r.cv.width, r.cv.height, { anchor: [r.px, r.cv.height - 1 - r.py] }), Z.ACTOR + 4); })();
  const thought = st.add(new Quad(canvasTex(thoughtCanvas(false)), 30, 26, { anchor: [6, 0] }), Z.TEXT + 1);
  const thoughtTex = [canvasTex(thoughtCanvas(false)), canvasTex(thoughtCanvas(true))];
  const sqBurst = st.add(new Quad(canvasTex(A.burstCanvas(62, 26)), 62, 26, { anchor: [31, 13] }), Z.TEXT);
  const pop = (text, color, font = 'px', outline = PAL.ink) => st.add(new TextSprite({ text, font, color, outline, outline8: !!outline }, { anchor: 'c' }), Z.TEXT + 2);
  const pops = { shing: pop('SHING!', PAL.yellow, 'sk'), blink: pop('*blink*', PAL.g0, 'sk', PAL.white), boing: pop('BOING!', PAL.yellow), squeak: pop('SQUEAK!', PAL.red, 'px', null), q: pop('?', PAL.ink, 'px', PAL.white), boing2: pop('BOING!', PAL.rainbow[9]), boing3: pop('BOING!', PAL.yellow), dots: pop('...', PAL.g4, 'px', null) };
  pops.q.setScale(2);
  const sweatQ = [0, 1, 2].map(() => st.add(new Quad(canvasTex(A.sweatDrop()), 5, 7, { anchor: [2, 0] }), Z.TEXT));

  // ---------------------------------------------------------------- UI
  // (v4) no HUD (LINES OF CODE / portraits retired); ONE subtitle slot, bottom centre (core/ui.js SUB_*)
  const sub = st.addUI(new Subtitle(), ZUI.SUBS);
  const card = buildLevelCard(st, ZUI.BANNER);
  const lnf = st.addUI(new Banner({ text: '! LEVEL NOT FOUND !', font: 'px', color: PAL.red }, { style: 'dialog' }), ZUI.BANNER);
  const nve = (() => { const grp = st.addUI(panel(176, 20, 'dialog'), ZUI.BANNER); grp.place(4, 6); const tx = st.addUI(new TextSprite({ text: 'NOT VERY EFFECTIVE...', font: 'px', color: PAL.white }, { anchor: 'bl' }), ZUI.BANNER + 1); tx.place(11, 12); return { bg: grp, tx }; })();   // (M3) y 42 -> 6: below the bridge, so the whole word "blossoms" reads (it hid the b l)
  const tip = st.addUI(new Banner({ text: 'TIP: COLOR IS HARD TO ERASE', font: 'skb', color: PAL.yellow }, { style: 'dialog', padX: 6, padY: 4 }), ZUI.BANNER);
  const axis = st.addUI(new Quad(canvasTex(ART.axisGizmoCanvas()), 28, 28), ZUI.BANNER); axis.place(288, 148);
  const bubble = st.add(new Bubble(), Z.TEXT + 2);
  const chops = C('pre_chop_gaps'); const BUB = {};
  const words = [5, 6, 7, 8, 9, 10, 11].flatMap((id) => T.words(id));
  // the acting hero (Lost Vikings HUD highlight): [t0, t1, hero, slot]
  const ACT = [
    [S(14.80), S(15.30), 'jade', null], [S(15.00), S(15.50), 'charlie', 0], [S(17.44), S(17.60), 'jade', 0], [S(17.60), S(18.40), 'ricky', 0],
    [S(19.28), S(19.95), 'charlie', 0], [S(21.63), S(22.40), 'jade', 0], [S(22.88), S(23.30), 'ricky', 0], [S(23.30), F2b + 1.2, 'charlie', 0],
    [S(26.20), S(27.20), 'charlie', 0], [S(27.55), S(29.30), 'jade', 1], [S(31.28), S(32.70), 'jade', 0], [S(32.70), S(33.00), 'jade', 1],
    [S(33.08), S(33.40), 'jade', 0], [S(34.70), S(35.50), 'charlie', 0], [S(35.50), S(35.85), 'ricky', 0], [S(36.35), S(36.70), 'ricky', 0],
    [S(36.70), S(37.30), 'charlie', 0], [S(38.25), S(40.15), 'jade', 1], [S(40.15), S(40.50), 'charlie', 0], [S(40.50), 42, 'ricky', 0],
  ];
  const slotFlashT = [S(15.0), S(17.44), S(17.615), S(19.30), S(21.633), S(22.903), S(23.326), S(24.42), S(26.29), S(27.80), S(31.28), S(32.80), S(33.10), S(34.72), ...g.slams, S(38.25), S(40.20), S(40.536)];

  // ---------------------------------------------------------------- camera
  const camX = (t, u, S0) => {
    let cx = S0.x - 36 - 54 * T.span(t, 16.45, 16.73, io) * (1 - T.span(t, 17.83, 18.4, io));
    if (t < T0) { /* dive: handled below */ }
    const lk = T.span(t, 21.2, 21.6, io) * (1 - T.span(t, 24.4, 25.2, io));               // frame the chasm
    cx = cx + (X.ch0 + 64 - cx) * lk;
    cx -= 44 * T.span(t, 27.50, 27.62, eo) * (1 - T.span(t, 27.78, 28.0, io));            // Jade glances back
    const vk = T.span(t, 34.0, 34.4, io);                                                 // the edge + the Eraser
    cx = cx + (X_EDGE + 10 - cx) * vk * (1 - T.span(t, 34.69, 35.2, io));
    return cx;
  };

  return {
    stage: st,
    update(t) {
      const u = tau(t);
      const SS = [0, 1, 2].map((i) => stateAt(u, i));
      const [SJ, SC, SR] = SS;
      // ---------------------------------------------------------------- camera
      let cx = camX(t, u, SJ), cy = 90, zoom = 1;
      if (t >= 34.69) {
        const k1 = T.span(t, 34.69, 35.1, io);
        const pc = pcVoid(Math.max(uCatch, Math.min(u, uT1)));
        cx = cx + (pc[0] + 10 - cx) * k1; cy = cy + (pc[1] - 42 - cy) * k1;
        const k2 = T.span(t, 36.0, 37.0, io); cx = cx + (ROW2.x0 + 120 - cx) * k2; cy = cy + (R2T + 4 - cy) * k2;
        const k3 = T.span(t, 38.3, 40.9, io); const mid = (Math.max(SJ.y, SC.y, SR.y) + Math.min(SJ.y, SC.y, SR.y)) / 2 + 14; cx = cx + ((W0.x1 + L3.x0) / 2 + 10 - cx) * k3; cy = cy + (Math.max(R2T + 4, mid) - cy) * k3;
      }
      { const pk = T.span(t, S(33.0), S(33.10), io) * (1 - T.span(t, S(33.42), S(33.58), io));   // push in on the pink-cap door rub
        if (pk > 0) { zoom = 1 + 0.5 * pk; cx = cx + (WX - 6 - cx) * pk; cy = cy + (X.ledge2[2] + 22 - cy) * pk; } }
      if (t < T0) { const k = T.span(t, START, T0, T.ease.inQuad); zoom = Math.exp(Math.log(26) * (1 - k)); cx = yiCore[0] + (cx - yiCore[0]) * k; cy = yiCore[1] + (90 - yiCore[1]) * k; }
      if (t >= F2a - 0.6 && t < 24.6) cy += 18 * T.span(t, F2a - 0.6, F2a) * (1 - T.span(t, 24.22, 24.6));
      if (t >= 24.3 && t < 26.0) cy -= 12 * T.span(t, 24.3, 24.9, io) * (1 - T.span(t, 25.5, 26.0, io));
      const sh = shake(t, [F1a + 0.4, F2b, S(25.62), ...HITS, ...g.slams, T0, g.eraserLeap[1], S(28.32)], { amp: 1, dur: 0.12 });
      st.cam.set({ x: cx, y: cy, zoom, shake: sh });
      const Lc = st.cam.left, R = Lc + st.cam.vw, Bc = st.cam.bottom;
      // ---------------------------------------------------------------- the Eraser
      const rx = rubX(t); const eraseX = rx > -1e8 ? rx : -1e9;
      const E = eraserAt(t);
      const eOff = 52;   // body front = the rubbing edge (it never rubs ahead of itself)
      eraserQ.visible = smearQ.visible = false;
      if (E.mode !== 'off') {
        let ex = E.x, ey = E.y;
        if (t < S(31.0) && E.mode !== 'leap') { ex = rx - eOff; if (t > S(25.20) && t < S(25.62)) { const k = T.span(t, S(25.20), S(25.62)); ex = 1064 + (X.ch1 + 6 - 1064) * io(k); ey = X.ledgeY + 40 * Math.sin(Math.PI * k); } else if (ex >= X.ledge0 - 30 && ex < X.ch0 + 30) ey = X.ledgeY; else if (ex >= X.ch1 - 10 && ex < X.life0 - 10) ey = X.ledgeY; else if (ex >= X.life0 - 10 && ex < X.floor3 - 10) ey = X.lifeTop; else ey = FLOOR; }
        if (t >= F1a && t < F1b) ex += Math.round(2 * Math.sin(t * 40)) * (t > F1a + 0.45 ? 1 : 0);
        else if (E.mode === 'chase') ex += Math.round(8 * T.beatPulse(t, 1, 0.12)) - 4;
        if (E.mode === 'skid') ex += Math.round(2 * Math.sin(t * 50));
        if (E.mode === 'peer' && !P.eraser_peer.art) ex += 44;
        const base = E.mode === 'blink' ? P.eraser_blink : E.mode === 'skid' ? P.eraser_skid : E.mode === 'peer' ? P.eraser_peer : E.mode === 'leap' ? P.eraser_leap : P.eraser_chase;
        const key = E.mode === 'blink' ? null : E.mode === 'skid' ? 'eraser_skid' : E.mode === 'peer' ? 'eraser_peer' : E.mode === 'leap' ? 'eraser_leap' : 'eraser_chase';
        const lv = E.smear || 0;
        const pose = !P.smearArt && lv > 0 && key ? P[key + '_smear'][lv - 1] : base;
        const fr = E.mode === 'blink' ? (t < S(18.0) ? 0 : 1) : Math.floor(t * (pose.fps || 6));
        eraserQ.show(pose, fr, ex, ey, { sil: t >= F2a && t < F2b ? [0, 0, 0, 1] : null });
        if (P.smearArt && lv > 0) { let ox = 0, oy = 0; const so = P.smearArt.skidOffset; if (E.mode === 'skid' && so && base === P.eraser_skid) { const o = so[((fr % so.length) + so.length) % so.length]; ox = o[0]; oy = -o[1]; }
          if (E.mode !== 'peer' || !P.eraser_peer.art) smearQ.show(P.smearArt, Math.min(3, lv - 1), ex + ox, ey + oy); }
        E.sx = ex; E.sy = ey;
      }
      // ---------------------------------------------------------------- backgrounds
      const inVoid = R > X_EDGE;
      paper.position.set(Lc - 16, Bc - 16, 0); paper.scale.set(Math.max(0.001, Math.min(R + 16, X_EDGE) - Lc + 16), st.cam.vh + 32, 1);
      blue.visible = inVoid; blue.position.set(Math.max(X_EDGE, Lc - 16), Bc - 16, 0); blue.scale.set(Math.max(0.001, R + 16 - Math.max(X_EDGE, Lc - 16)), st.cam.vh + 32, 1);
      paper.u.uBlankX.value = eraseX; paper.u.uMissing.value = 0.4 * T.span(t, 31.28, 34.3);
      blue.u.uTime.value = t; blue.u.uGlitch.value = chops.some(([a, b]) => t >= a && t < b) ? 0.12 : 0;
      streaks.visible = eraseX > -1e8 && t < 31; streaks.place(eraseX - 168, 40);
      const par = (q, k, w, y) => { const base = Lc * k; const off = ((Lc - base) % w + w) % w; q[0].place(Lc - off, y); q[1].place(Lc - off + w, y); q.forEach((qq) => { qq.material.uniforms.clipX.value = eraseX; qq.material.uniforms.clipR.value = X_EDGE - 4; qq.visible = Lc < X_EDGE; }); };
      par(hills, 0.25, 512, FLOOR + 10); par(ruins, 0.55, 640, FLOOR - 2);
      torn.visible = Lc < X_EDGE + 12 && R > X_EDGE - 12;
      // ---------------------------------------------------------------- floors, tiles, flowers, colour
      bgBatch.begin(); bgBatch.material.uniforms.clipX.value = eraseX;
      flBatch.begin(); fxBatch.begin(); fxBatch.material.uniforms.clipX.value = -1e9; hiFx.begin(); cxFx.begin(); cxHi.begin(); ptBatch.begin(); ptBatch.material.uniforms.clipX.value = -1e9; linkBatch.begin(); linkBatch.material.uniforms.clipX.value = -1e9;
      const creep = T.span(t, 31.28, 34.3);
      const cols = (a, b, F) => { for (let x = Math.floor(a / 16) * 16; x < b; x += 16) { if (x + 16 < Lc - 16 || x > R + 16) continue; const hsh = ((x * 2654435761) >>> 0) / 4294967296;
        if (x > X.colorR + 80 && x < X.XF && hsh < creep * 0.55) bgBatch.draw('chk16', x, 0, { sx: 2, sy: F / 8 }); else bgBatch.draw(`fl${F}_${((x / 16) % 3 + 3) % 3}`, x, 0); } };
      cols(176, X.pit0, 60); cols(X.ledge0, X.ch0, 84); cols(X.ch1, X.ch1 + X.colW, 84); cols(X.floor3, X.XF, 60); cols(X.ledge2[0], X.ledge2[1], 90);
      if (xCrate[0] > Lc - 20 && xCrate[0] < R) bgBatch.draw('crate', xCrate[0], FLOOR);
      if (X.ch0 - 10 > Lc - 20 && X.ch0 - 10 < R) bgBatch.draw('pillar', X.ch0 - 10, X.ledgeY);
      // 每一天 都是色彩: colour tiles (locked) — painted strokes on the syllables, footprints after
      const paintT = (x) => { const d = X.spinJ - x; if (d >= -8 && d < 16 * 2) return S(27.80) + d * 0.004; if (d >= 16 * 2 && d <= X.spinJ - X.colorL + 2) return S(28.10) + (d - 32) * 0.003; return null; };
      for (let x = Math.floor(X.colorL / 16) * 16; x < X.colorR + 8; x += 16) { const pt = paintT(x + 8); if (pt !== null && t >= pt && x + 16 > Lc && x < R) flBatch.draw('cap' + ((Math.floor(x / 16) % 12) + 12) % 12, x, 50); }
      for (const st8 of [S(28.755), S(30.038), S(30.289)]) { const ux = SJ.x; const x = Math.floor((leadX(tau(st8)) + 4) / 16) * 16; if (t >= st8 && x + 16 > Lc && x < R && x < X.XF) flBatch.draw('cap' + (((x / 16) % 12) + 12) % 12, x, 50); void ux; }
      bgBatch.end();
      // lyric tiles + flowers (the flowers are COLOUR: never rubbed out)
      letters.forEach((l) => { l.q.material.uniforms.clipX.value = eraseX; l.q.visible = l.x > Lc - 12 && l.x < R; });
      flowers.forEach((f, i) => { if (t < f.t || f.x < Lc - 10 || f.x > R + 10) return; const age = u - tau(f.t); if (age < 0.12) flBatch.draw(`flower${f.c % 6}_${Math.min(4, Math.floor(age * 30))}`, f.x, FLOOR); else flBatch.draw('bf' + f.c, f.x, FLOOR);
        if (age < 0.25) sparkle(cxFx, u, tau(f.t), f.x, FLOOR + 8, { n: 3, r: 8, seed: i, dur: 0.25 }); });
      // flowers bloom on "life" when they land on it (colour; the clue reprise at 27.55)
      for (let i = 0; i < 6; i++) { const ft = S(25.42 + 0.05 * i), fx = X.life0 + 8 + i * 16; if (t >= ft && fx > Lc - 10 && fx < R + 10) { const ht = lifeTopAt(fx) ?? X.lifeTop; flBatch.draw('bf' + ((i + 3) % 7), fx, ht); } }
      // blossoms letters: open on the sung word, fall away as the rubbing edge reaches them and burst into petals
      bLetters.forEach((b) => { let y = BYQ; b.q.rotation.z = 0; if (t > b.tFall) { const s = u - tau(b.tFall); y = BYQ - 300 * s * s; b.q.rotation.z = -s * 2.5; }
        b.q.material.setMap(b.tex[t >= b.tOpen ? 1 : 0]);
        b.q.place(b.x - BM, y); b.q.visible = b.x > Lc - 40 && b.x < R && y > -60; b.q.material.uniforms.clipX.value = t > b.tFall ? -1e9 : eraseX;
        if (b.x > Lc - 40 && b.x < R + 10) {
          if (t >= b.tOpen && t < b.tOpen + 0.3) sparkle(ptBatch, t, b.tOpen, b.x + b.w / 2, FLOOR - 8, { n: 3, r: 10, seed: 60 + b.i, dur: 0.3 });
          petalBurst(ptBatch, t, b.tFall, b, BYQ + BM, BC); } });
      // the hat-trampoline (blossoms pit, 未来 gap)
      trampQ.visible = false;
      if (u >= uHatPit && u < uRlede) { trampQ.visible = true; const sq = u >= uBoing && u < uBoing + 0.06; trampQ.setRect((sq ? 1 : u >= uBoing ? 2 : 0) / 3, 0, 1 / 3, 1); trampQ.place(pitHat[0], pitHat[1] - 4); }
      if (u >= uRf + 0.08 && u < uLai) { trampQ.visible = true; const sq = u >= uTr && u < uTr + 0.06; trampQ.setRect((sq ? 1 : u >= uTr ? 2 : 0) / 3, 0, 1 / 3, 1); trampQ.place(trHat[0], trHat[1] - 4); }
      // the post (graphite: drawn by Jade, rubbed out by the lunge) + pencil rig
      post.apply(t); post.eraseLeftOf(eraseX > -1e8 ? eraseX : null);
      plats.forEach((h) => h.apply(u)); dian.apply(u);
      const dianOn = u >= g.springColor; dian.style = dianOn ? 'rainbow' : 'graphite';
      const sb = u >= uSpr && u < uSpr + 0.12 ? -4 : 0; springQ.visible = dianOn; springQ.place(X.spring[0], X.spring[1]); springQ.setSize(13, 14 + sb);
      const gp = u > U(21.60) && u < U(22.40) ? 'post' : u > g.platDraw[0][0] - 0.3 && u < g.springDraw[1] + 0.05 ? 'plat' : null;
      gPencil.visible = !!gp; if (gp === 'post') { const p = post.tipAt(t); if (p.active) gPencil.set({ x: p.x, y: p.y, angle: -35 + Math.sin(t * 40) * 3 }); else gPencil.set({ x: X.post + (t < g.post[0] ? -30 : 0), y: postTop + 14, angle: -35 }); }
      else if (gp === 'plat') gRig.apply(u);
      // the wall + door (Jade's pink cap)
      const dk = T.span(u, U(33.12), U(33.28)); wall.material.setMap(wallTex[Math.min(3, Math.ceil(dk * 3))]);
      if (u >= U(33.10) && u < U(33.30)) debris(fxBatch, u, U(33.10) + Math.floor((u - U(33.10)) * 10) / 10, WX + 4, X.ledge2[2] + 14, { n: 4, seed: Math.floor(u * 10), names: ['px1', 'px2'], color: PAL.capPink, vx: [-40, -10], vy: [10, 50], dur: 0.3 });
      // ---------------------------------------------------------------- the hyperlink chain (limp -> clicked -> latched -> falls)
      const tClick = S(22.98), tLatch = S(T.word(7, 3).start), visited = t >= tLatch, tChainFall = S(25.62);
      linkBatch.userData.cs = linkedLbl.userData.cs = underline.userData.cs = t >= tClick ? 1 : 0;   // H4: graphite until Ricky's chord clicks it, then the hyperlink blue / visited purple
      if (t >= 20.0 && Lc < X.ch1 + 60 && R > X.ch0 - 20) {
        const nL = t < tClick ? 10 : 40; const end = t < tClick ? [X.ch0 + 10, pillarTop - 48] : t < tLatch ? (() => { const k = T.span(t, tClick, tLatch, eo); return [X.ch0 + 10 + (chainB[0] - X.ch0 - 10) * k, pillarTop - 48 + (chainB[1] - pillarTop + 48) * k]; })() : chainB;
        const fall = t >= tChainFall ? T.since(t, tChainFall) : 0;
        for (let i = 0; i <= nL; i++) {
          const k = i / nL; let x, y;
          if (t < tLatch) { x = chainA[0] + (end[0] - chainA[0]) * k; y = chainA[1] + (end[1] - chainA[1]) * k - (t < tClick ? 0 : 10 * Math.sin(Math.PI * k)) + (t < tClick ? -6 * Math.sin(Math.PI * k) * 0 : 0); if (t < tClick) { x = chainA[0] + 10 * Math.sin(k * 1.5) + 2 * Math.sin(t * 3 + k * 4); y = chainA[1] - 48 * k; } }
          else { x = chainA[0] + (chainB[0] - chainA[0]) * k; y = chainY(x); }
          if (fall > 0) { y -= 260 * fall * fall * (0.6 + 0.4 * k); x += 20 * fall * (k - 0.5); }
          if (y < Bc - 40) continue;
          linkBatch.draw((i % 2 ? 'linkV' : 'linkH') + (visited ? 'v' : ''), x, y);
        }
        const lp = t < tClick ? [X.ch0 + 18, pillarTop - 58] : [(chainA[0] + chainB[0]) / 2 + 30, chainY((chainA[0] + chainB[0]) / 2 + 30) + 8];
        linkedLbl.visible = underline.visible = t < tChainFall + 0.1; linkedLbl.place(lp[0], lp[1]); linkedLbl.set({ color: visited ? '#7a3cff' : PAL.hyperlink });
        underline.setSize(linkedLbl.w, 1); underline.place(lp[0] - Math.floor(linkedLbl.w / 2), lp[1] - 1); underline.material.setColor(visited ? '#7a3cff' : PAL.hyperlink);
        linkedLbl.flash = T.exactFrame(t, [tClick, tLatch]) ? 1 : 0;
        if (t >= tLatch) sparkle(cxFx, t, tLatch, chainB[0], chainB[1], { n: 8, r: 12, color: '#c2a0ff' });
        sparkle(fxBatch, t, tClick, lp[0], lp[1] + 4, { n: 8, r: 14, color: PAL.white });
      } else linkedLbl.visible = underline.visible = false;
      // the chord shots (re-hit at the Eraser; the click; the slams): arcs travelling along a line
      const shot = (t0, dur, a, b) => { for (let k = 0; k < 8; k++) { const born = t0 + k * 0.02, age = t - born; if (age < 0 || age > dur) continue; const q = age / dur; fxBatch.draw('arc' + [8, 12, 16, 20][Math.min(3, Math.floor(q * 4))], a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, { flip: b[0] < a[0] }); } };
      if (E.sx !== undefined) shot(S(17.615), 0.09, [SR.x - 24, SR.y + 22], [E.sx + 40, E.sy + 70]);
      shot(S(22.903), 0.08, [SR.x + 26, SR.y + 22], [X.ch0 + 18, pillarTop - 52]);
      g.slams.forEach((sl) => shot(sl - 0.1, 0.1, [SR.x + 10, SR.y - 8], [sl === g.slams[0] ? ROW1.x0 + 60 : ROW2.x0 + 80, sl === g.slams[0] ? R1T : R2T]));
      if (E.sx !== undefined) for (let i = 0; i < 7; i++) if (t >= S(17.70) && t < S(18.05)) { const a = i * 0.9; hiFx.draw(i % 2 ? 'spark' : 'px2', E.sx + 40 + Math.cos(a) * 10, E.sy + 72 + Math.sin(a) * 10, { solid: PAL.yellow }); }
      // the sign + the freeze
      const fr2 = t >= F2a && t < F2b; sign.visible = t >= F2a - 0.3 && t < F2b + 0.15; sign.material.uniforms.clipX.value = -1e9;
      dim.visible = fr2; dim.setSize(st.cam.vw + 4, st.cam.vh + 4); dim.place(Lc - 2, Bc - 2);
      // ---------------------------------------------------------------- VOID: bubbles -> ghost words -> slammed platforms
      { const bw = (t < 35.56 ? 3 : 4) * 24 + 16; BUB.x = Math.max(Lc + 14, Math.min(SJ.x - bw + 4, Lc + st.cam.vw - bw + 8)); BUB.y = Math.min(SJ.y + (SJ.hang ? 4 : 40), Bc + st.cam.vh - 40); }   // pure: from this frame's state
      rows.forEach((Rw) => {
        const born = S(Rw.born), slam = Rw.slam;
        Rw.chars.forEach((c, i) => {
          const a = S(born + i * 0.05), k = T.span(t, a, slam, T.ease.inQuad);
          const fromX = (BUB.x || SJ.x) + 12 + i * 22, fromY = (BUB.y || SJ.y + 40) + 6;
          c.q.visible = t >= a;
          c.q.place(t >= slam ? c.x : fromX + (c.x - fromX) * k, t >= slam ? Rw.y0 : fromY + (Rw.y0 - fromY) * k);
          c.q.material.uniforms.opacity.value = t >= slam ? 1 : 0.45; c.q.material.setColor(t >= slam ? 0xffffff : 0x9ec2ff);
        });
        if (t >= slam) dust(fxBatch, t, slam, Rw.x0 + Rw.chars.length * 20, Rw.y0 + 2, { n: 10, seed: 40, spread: 40, dur: 0.4 });
        if (t >= slam && t < slam + 0.12) for (let i = 0; i < 6; i++) fxBatch.draw('chk16', Rw.x0 - 8 + i * 30, Rw.y0 - 4 + (i % 2) * 30, { sx: 0.5, sy: 0.5 });
      });
      const bub = t >= 34.80 && t < 36.52 ? (t < 35.56 ? 0 : 1) : -1;
      bubble.visible = bub >= 0;
      if (bub >= 0) {
        const ws = T.words(10), text = bub === 0 ? '说出来' : '它就存在', wsel = bub === 0 ? ws.slice(0, 2) : ws.slice(2);
        let n = 0; for (const w of wsel) if (t >= w.start - 0.03) n += Array.from(w.w).length;
        const dropped = bub === 0 ? t >= 35.30 : t >= 36.18; const bw = Array.from(text).length * 24 + 16;
        bubble.set({ spans: [{ text, color: dropped ? '#b8b8c8' : PAL.ink }], reveal: n, x: BUB.x, y: BUB.y, scale: 2 }); void bw;
      }
      cubes.forEach((c, i) => { c.q.place(c.x - (Lc - X_EDGE) * 0.4, c.y + (Bc - 0) * 0.5 + Math.round(3 * Math.sin(t * 1.3 + i))); c.q.visible = inVoid; });
      chkSq.forEach((q) => { q.visible = inVoid; }); lorem.visible = inVoid;
      const chop = chops.some(([a, b]) => t >= a && t < b);
      if (chop) { const r = mulberry32(Math.floor(t * 30) * 7 + 3); for (let i = 0; i < 16; i++) { const gx = Lc + r() * st.cam.vw, gy = Bc + 40 + r() * (st.cam.vh - 40), sx = 1 + Math.floor(r() * 3), sy = 1 + Math.floor(r() * 2);
          if (rows.some((Rw) => gx + sx * 8 > Rw.x0 - 4 && gx < Rw.x0 + Rw.chars.length * 40 + 4 && gy + sy * 8 > Rw.y0 - 4 && gy < Rw.y0 + 50)) continue;
          if (SS.some((s) => Math.abs(gx - s.x) < 30 && gy > s.y - 50 && gy < s.y + 50)) continue;
          fxBatch.draw('chk16', gx, gy, { sx, sy }); } }
      // 未来
      wei.apply(t); lai.apply(t);
      const rp = rRig.at(t); rPencil.visible = t > 38.10 && !rp.gone; if (rPencil.visible) rRig.apply(t);
      sparkle(cxFx, t, g.lai[1], L3.x0 + 40, L3T + 10, { n: 10, r: 40, dur: 0.6 });
      // the updraft: rising sound-wave rings from Ricky's guitar (held 来)
      if (t >= S(40.536)) { const sr = stateAt(u, 2); for (let i = 0; i < 7; i++) { const ph = ((t - 40.536) * 2.2 + i / 7) % 1; const ox = (i % 3 - 1) * 8; linkBatch.draw('arc' + [12, 16, 20][i % 3], sr.x + 2 + ox, (sr.hang ? sr.y - 70 : sr.y + 12) + ph * (sr.hang ? 130 : 90), { rot: Math.PI / 2, color: i % 2 ? '#7cc4ff' : '#ffffff' }); } }   // behind the heroes
      // ---------------------------------------------------------------- heroes
      const fr1 = t >= F1a && t < F1b;
      const pencilOut = t >= S(F1b);
      strap.visible = false;
      SS.forEach((s, i) => {
        const h = HEROES[i], a = actors[h], pq = poseQ[h]; const isJ = i === 0;
        const sil = fr2 ? [0, 0, 0, 1] : null;
        // Jade's crate flip (hair up, before the pencils come out)
        if (isJ && s.jump && s.jump.flip && s.air) { a.visible = false; const f = flipFrames[Math.min(11, Math.floor(s.k * 12))]; pq.show(f, 0, s.x, s.y + 22, {}); }
        else if (s.rotPose) { a.visible = false; pq.show(fr2 ? rot.rim(s.rotPose) : s.rotPose, 0, s.x, s.y, { flip: (s.facing ?? 1) < 0 }); }   // the freeze: rim-lit silhouettes vs the lit sign
        else if (s.pose) { a.visible = false; pq.show(s.pose, s.pframe || 0, s.x, s.y, { flip: (s.facing ?? 1) < 0, sil }); }
        else {
          pq.visible = false;
          let anim = s.anim; if (!isJ && ['sing', 'draw_rainbow', 'draw_graphite', 'drum'].includes(anim)) anim = 'idle';
          if (i !== 2 && ['chord', 'sustain'].includes(anim)) anim = 'idle';
          if (i !== 1 && ['throw', 'shield', 'parachute'].includes(anim)) anim = 'idle';
          const pencil = isJ && pencilOut;
          if (isJ && !pencil && ['draw_graphite', 'draw_rainbow', 'sing', 'drum'].includes(anim)) anim = 'idle';
          a.set({ x: s.x, y: s.y, anim, frame: s.frame, t: s.t ?? u, pencil, facing: s.facing ?? 1, sil });
        }
        const bq = bangs[i]; bq.visible = fr1 && t >= F1a + 0.06 + i * 0.04; bq.place(s.x, s.y + 46 + (T.exactFrame(t, [F1a + 0.06 + i * 0.04]) ? 3 : 0));
        if (isJ && s.anim === 'run' && !fr1 && !fr2 && t > T0 && t < 34.0) speedLines(fxBatch, t, s.x, s.y, 1);
      });
      if (SR.pose === P.ricky_dangle_play && SC.pose) { strap.visible = true; strap.setSize(1, 6); strap.place(SR.x - 1, SR.y - 2); }
      // Charlie's hat: solo bounce pad, boomerang to the chain, the shield dome
      hat.visible = false; hat.setScale(1); shieldDome.visible = false;
      { const ch = G1.charlieHat; if (u >= ch.uHat && u < ch.uLand + 0.2) { hat.visible = true; if (u < ch.uOn + 0.08) { const sq = u >= ch.uOn && u < ch.uOn + 0.08; hat.place(ch.hatX, FLOOR + 6 - (sq ? 2 : 0)); hat.setRect(0, 0, 1 / 3, 1); } else { const k = T.span(u, ch.uOn + 0.08, ch.uLand + 0.2); hat.place(ch.hatX + (SC.x - ch.hatX) * k, FLOOR + 6 + (SC.y + 40 - FLOOR - 6) * k + 16 * Math.sin(Math.PI * k)); hat.setRect((Math.floor(t * 16) % 3) / 3, 0, 1 / 3, 1); } } }
      if (u >= uThrowB + 0.04 && u < uHatPit) { hat.visible = true; const k = T.span(u, uThrowB + 0.04, uHatPit); hat.place(SC.x - 8 + (pitHat[0] - SC.x + 8) * k, X.ledgeY + 30 + (pitHat[1] + 6 - X.ledgeY - 30) * k); hat.setRect((Math.floor(t * 16) % 3) / 3, 0, 1 / 3, 1); }
      if (u >= uBoing + 0.1 && u < uBoing + 0.4) { hat.visible = true; const k = T.span(u, uBoing + 0.1, uBoing + 0.4); hat.place(pitHat[0] + (SC.x - pitHat[0]) * k, pitHat[1] + (SC.y + 40 - pitHat[1]) * k + 20 * Math.sin(Math.PI * k)); hat.setRect((Math.floor(t * 16) % 3) / 3, 0, 1 / 3, 1); }
      if (u >= uCThrow + 0.04 && u < uLetGo) { hat.visible = true; const hk = hookAt(u); if (u < uHook) { const k = T.span(u, uCThrow + 0.04, uHook); const a0 = [SC.x + 10, X.ledgeY + 30]; hat.place(a0[0] + (hk[0] - a0[0]) * k, a0[1] + (hk[1] - a0[1]) * k + 14 * Math.sin(Math.PI * k)); hat.setRect((Math.floor(t * 16) % 3) / 3, 0, 1 / 3, 1); } else { hat.place(hk[0], hk[1] - 2); hat.setRect(0, 0, 1 / 3, 1); } hat.material.uniforms.sil.value.set(...(fr2 ? [0, 0, 0, 1] : [0, 0, 0, 0])); }
      if (u >= uRf + 0.04 && u < uRf + 0.12) { hat.visible = true; const k = T.span(u, uRf + 0.04, uRf + 0.12); hat.place(SC.x - 6 + (trHat[0] - SC.x + 6) * k, SC.y + 30 + (trHat[1] - SC.y - 30) * k); }
      if (u >= g.uShield && u < g.uShield1) { shieldDome.visible = true; shieldDome.place(SC.x + 2, SC.y + 46); }
      // crumb spray (surge): from the Eraser's mouth over the party, bouncing off the dome
      if (t >= S(26.29) && t < S(27.20) && E.sx !== undefined) for (let k = 0; k < 8; k++) { const t0 = Math.floor(t * 12) / 12 - k / 12; const s = t - t0; if (s < 0 || s > 0.6) continue;
        const r = mulberry32(Math.round(t0 * 120)); const vx = 120 + r() * 60, vy = 90 + r() * 40; const x = E.sx + 46 + vx * s, y = E.sy + 70 + vy * s - 260 * s * s;
        const domeY = SC.y + 52; const hitX = SC.x - 20; if (x > hitX && y < domeY + 6) { hiFx.draw('ecrumb' + (k % 4), hitX - (x - hitX) * 0.6, domeY + 6 + (x - hitX) * 0.5); continue; }
        hiFx.draw('ecrumb' + (k % 4), x, y); }
      // eraser crumbs while it rubs
      if (eraseX > -1e8 && t < 28.32 && !(t >= F1a + 0.3 && t < S(18.4))) for (let k = 0; k < 5; k++) { const t0 = Math.floor(t * 10) / 10 - k * 0.1;
        if (t0 >= tChew[0] && t0 < tChew[1]) { debris(ptBatch, t, t0, eraseX - 8, FLOOR - 14 + (k * 7) % 18, { n: 2, seed: Math.round(t0 * 10), names: ['pt0', 'pt1', 'pt2', 'pt3'], vx: [-30, 25], vy: [10, 60], g: 110, dur: 0.8 }); continue; }   // (M3) chewing blossoms: petals
        debris(fxBatch, t, t0, eraseX - 28, 60 + (k * 37) % 60, { n: 2, seed: Math.round(t0 * 10), names: ['ecrumb0', 'ecrumb1', 'ecrumb2', 'ecrumb3'], vx: [-40, 10], vy: [20, 80], dur: 0.6 }); }
      // landings / impacts
      dust(fxBatch, u, tau(S(15.286)), g.J1(15.286), FLOOR, { n: 6, seed: 5 });
      dust(fxBatch, u, tau(S(15.498)), xCrate[0] + 8, FLOOR + 18, { n: 6, seed: 6 });
      dust(fxBatch, u, uRlede, X.ledge0 + 12, X.ledgeY, { n: 6, seed: 7 });
      dust(fxBatch, t, S(25.62), X.ch1 + 6, X.ledgeY, { n: 10, seed: 8, spread: 26 });
      dust(fxBatch, u, uLand, pcLand[0], X.lifeTop, { n: 8, seed: 9 });
      g.landK.forEach((lk, k) => dust(fxBatch, u, lk, Lk[k], X.k[k][2], { n: 4, seed: 20 + k }));
      dust(fxBatch, t, g.eraserLeap[1], X.ledge2[0] + 30, X.ledge2[2], { n: 14, seed: 33, spread: 40, dur: 0.5 });
      debris(fxBatch, t, S(25.62), X.post, postTop - 20, { n: 10, seed: 34, vx: [-60, 60], vy: [0, 80], dur: 0.7 });
      for (const sk of [S(28.32), ...HITS.filter((h) => h >= 29)]) if (E.sx !== undefined && t >= sk && t < sk + 0.2) for (let i = 0; i < 6; i++) cxHi.draw('px2', E.sx + 30 + i * 4, FLOOR + 1 + (i % 2), { solid: PAL.rainbow[(i * 2 + Math.floor(sk * 10)) % 12] });
      // pops
      Object.values(pops).forEach((p) => (p.visible = false)); sqBurst.visible = false; sweatQ.forEach((q) => (q.visible = false)); thought.visible = false;
      if (t >= S(17.46) && t < S(17.85)) { pops.shing.visible = true; pops.shing.place(SJ.x, SJ.y + 54); }
      if (E.sx !== undefined && t >= S(17.70) && t < S(18.30)) { pops.blink.visible = true; pops.blink.place(Math.max(Lc + 30, E.sx + 10), E.sy + 132); }
      if (u >= uBoing && u < uBoing + 0.45) { pops.boing.visible = true; pops.boing.place(pitHat[0] - 22, pitHat[1] + 40); }
      if (u >= uSpr && u < uSpr + 0.45) { pops.boing2.visible = true; pops.boing2.place(X.spring[0] - 26, X.spring[1] + 50); }
      if (u >= uTr && u < uTr + 0.4) { pops.boing3.visible = true; pops.boing3.place(trHat[0], trHat[1] - 14); }
      if (t >= S(21.47) && t < S(21.66)) { pops.q.visible = true; pops.q.place(SJ.x, SJ.y + 56); }
      if (E.sx !== undefined && t >= S(28.32) && t < 31.0) { const hitSq = [S(28.32), ...HITS.filter((h) => h >= 29)].some((h) => t >= h && t < h + 0.22); sqBurst.visible = pops.squeak.visible = hitSq;
        const sx = Math.max(Lc + 34, E.sx + 76), sy = Math.min(Bc + 132, E.sy + 70); sqBurst.place(sx, sy); pops.squeak.place(sx, sy);
        for (let i = 0; i < Math.min(3, E.smear); i++) { sweatQ[i].visible = true; sweatQ[i].place(E.sx + 30 + i * 9, E.sy + 108 + ((Math.floor(t * 6) + i) % 3) * 3); } }
      if (E.mode === 'peer' && t < 35.3) { pops.q.visible = !P.eraser_peer.art; pops.q.place(E.sx + 70, E.sy + 70); pops.dots.visible = t > S(34.9); pops.dots.place(E.sx + 66, E.sy + 54); }
      if (t >= S(26.29) && t < S(27.0)) { pops.q.visible = false; bangs[2].visible = true; bangs[2].place(SR.x, SR.y + 46); sweatQ[0].visible = sweatQ[1].visible = true; sweatQ[0].place(SR.x - 10, SR.y + 38); sweatQ[1].place(SR.x + 10, SR.y + 40); }
      if (t >= S(32.70) && t < S(32.86)) { bangs[2].visible = true; bangs[2].place(SR.x, SR.y + 46); }
      if (t >= S(27.52) && t < S(27.98)) { thought.visible = true; thought.material.setMap(thoughtTex[t >= S(27.74) ? 1 : 0]); thought.place(SJ.x + 6, SJ.y + 44); }
      fxBatch.end(); flBatch.end(); hiFx.end(); cxFx.end(); cxHi.end(); ptBatch.end(); linkBatch.end();
      // ---------------------------------------------------------------- flashes
      // (v4) the pre-chorus slams (35.56 / 36.41) were a one-frame 80 % white over the dark VOID (Y 60 -> 200: read as a dropped
      // frame, critique 0:36). Now a short decaying hit: 0.3 on the slam frame, 0.12 on the next, so it reads as a punch.
      const slamF = g.slams.map((e) => e - 1 / T.fps());
      st.fx.flash = T.exactFrame(t, [F1b, F2b, T0]) ? 0.8 : T.exactFrame(t, slamF) ? 0.3 : T.exactFrame(t, slamF.map((e) => e + 1 / T.fps())) ? 0.12 : T.exactFrame(t, HITS) ? 0.3 : 0;
      // ---------------------------------------------------------------- UI
      const singing = words.some((w) => t >= w.start && t < w.end) && Math.floor(t * 8) % 2 === 0;
      let act = null; for (const a of ACT) if (t >= a[0] && t < a[1]) act = a;
      const sf = Math.max(0, ...slotFlashT.map((e) => (t >= e && t < e + 0.25 ? 1 - (t - e) / 0.25 : 0)));
      // (v4) one bilingual line in the one slot; lines built into the world (5 floor lyric + the blossoms bridge, 10 说出来 它就存在) have none.
      // (M3) 6 "because" (20.13) is sung as card 03 cuts in (20.167): it is not in act 1's list, so a caption for it (if the type unit
      // flips line 6 off inWorld) shows on the card only and never flashes here for the 4 frames before the cut.
      let subC = null;
      for (const id of [5, 7, 8, 9, 10, 11]) { const c = subtitleFor(t, id, { hold: id >= 10 ? 0.3 : 0.25 }); if (c) subC = c; }
      if (subC && T.line(7) && t > T.word(7, 7).start + 0.9 && t < T.line(8).start - 0.1) subC = null;   // the held "life": the sign carries it
      sub.set(subC);
      card.update(t);
      const nf = false; lnf.visible = nf;   // spec: LEVEL NOT FOUND flickers in the HUD only (the banner hid the peering Eraser) lnf.place(160, 126);
      nve.bg.visible = nve.tx.visible = t >= S(17.72) && t < S(18.70);
      tip.visible = t >= B(68) && t < B(72) + 0.2; tip.place(232, 132);
      axis.visible = inVoid;
      if (globalThis.KAIZO_DEBUG) globalThis.KAIZO_DEBUG.push({ t, u, J: [SJ.x | 0, SJ.y | 0], C: [SC.x | 0, SC.y | 0], R: [SR.x | 0, SR.y | 0], rub: eraseX | 0, E: [E.sx | 0, E.sy | 0, E.mode], cam: [cx | 0, cy | 0] });
    },
  };
}
const G1 = {};

// ---------------------------------------------------------------- (v4b color M3b) the "blossoms" bridge art
// Each letter is a graphite cherry BRANCH bent into the glyph (3 px, top-lit, small knots, twigs off the free ends) with clusters
// of real 5-petal blossoms on it, densest at the ends and joints, a few tiny ones along the strokes, petals hanging below.
// The dark branch carries the word; the pale-pink flowers make it blossoms. The branch is graphite (the Eraser eats it, and
// the blossoms burst off as petals); the flowers keep BLOSSOM_KEEP of their pink through the colour script, a clear pale pink
// that is still not a painted colour (Jade's colour is the saturated path flowers).
const BLOSSOM_KEEP = 0.85;
const BL_C = { pl: '#fde8ee', pm: '#f6bccd', po: '#d9879f', pc: '#a3456a', white: '#ffffff', bud: '#e9a3b8', core: PAL.g0, top: PAL.g1 };
/** a 5-petal blossom (size 7 / 5) or a tiny 4-petal one (3): Map 'dx,dy' -> colour, petals = discs around the centre */
function blossomShape(size, rot, r) {
  const out = new Map();
  if (size === 3) { out.set('0,0', BL_C.pc); for (const [a, b] of [[1, 0], [-1, 0], [0, 1]]) out.set(a + ',' + b, BL_C.pm); out.set('0,-1', BL_C.pl); return out; }
  const d = size === 5 ? 1.25 : 1.9, pr = size === 5 ? 1.25 : 1.65, R = (size >> 1) + 1;
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
    let best = 9; for (let k = 0; k < 5; k++) { const a = rot + k * 2 * Math.PI / 5; if (Math.hypot(x - d * Math.cos(a), y - d * Math.sin(a)) < pr) best = Math.min(best, Math.hypot(x, y)); }
    if (best < 9) out.set(x + ',' + y, best < d * 0.9 ? BL_C.pl : BL_C.pm);
  }
  out.set('0,0', BL_C.pc); if (size === 7 && r() < 0.5) out.set('1,0', BL_C.pc);
  return out;
}
/** one bridge letter canvas (margin M around the cells). The branch's top row sits where the walking surface is (canvas row
 *  M + y*c - 1 for the top cell of a column = world FLOOR + (2 - y) * c, the same as bridgeH). open = false: buds only. */
function blossomLetter(ch, idx, open, M) {
  const gl = BRIDGE_GLYPHS[ch], c = 4, wc = gl[0].length, W = wc * c + 2 * M, H = 7 * c + 2 * M;
  const r = mulberry32(211 + idx * 31);
  const on = (x, y) => y >= 0 && y < 7 && x >= 0 && x < wc && gl[y][x] === '#';
  const nodes = []; for (let y = 0; y < 7; y++) for (let x = 0; x < wc; x++) if (on(x, y)) nodes.push([x, y]);
  const deg = (x, y) => { let n = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if ((a || b) && on(x + a, y + b)) n++; return n; };
  const br = new Set(), K = (x, y) => x + ',' + y;
  const seg = (x0, y0, x1, y1) => { for (let i = 0; i <= 8; i++) { const X = Math.round(M + (x0 + (x1 - x0) * i / 8) * c), Y = Math.round(M + (y0 + (y1 - y0) * i / 8) * c) - 1; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) br.add(K(X + a, Y + b)); } };
  for (const [x, y] of nodes) {
    seg(x, y, x, y);
    for (const [dx, dy] of [[1, 0], [0, 1]]) if (on(x + dx, y + dy)) seg(x, y, x + dx, y + dy);
    for (const [dx, dy] of [[1, 1], [1, -1]]) if (on(x + dx, y + dy) && !on(x + dx, y) && !on(x, y + dy)) seg(x, y, x + dx, y + dy);   // bend round the corner
  }
  return pixelCanvas(W, H, (g, px) => {
    // the branch: graphite, lit along its top; a few knots on the sides / underside (never on top: that is the walking line)
    for (const k of br) { const [x, y] = k.split(',').map(Number); px(x, y, br.has(K(x, y - 1)) ? BL_C.core : BL_C.top); }
    for (const k of br) { const [x, y] = k.split(',').map(Number); if (br.has(K(x, y - 1)) && !br.has(K(x, y + 1)) && r() < 0.12) px(x, y + 1, BL_C.core); }
    // twigs off the free ends (pointing away from the letter's middle), each with a bud
    for (const [x, y] of nodes) if (deg(x, y) === 1 && r() < 0.6) {
      const sx = M + x * c + 1, sy = M + y * c, dx = r() < 0.5 ? -1 : 1, dy = y >= 4 ? 1 : -1, n = 2 + (r() < 0.5 ? 1 : 0);
      for (let k = 1; k <= n; k++) px(sx + dx * (k + 1), sy + dy * k, BL_C.top);
      px(sx + dx * (n + 2), sy + dy * (n + 1), BL_C.bud);
    }
    if (!open) {   // closed buds along the branch (they open on the sung word)
      for (const [x, y] of nodes) if (r() < 0.6) { const bx = M + x * c + 1 + Math.floor(r() * 3) - 1, by = M + y * c + Math.floor(r() * 3); px(bx, by - 1, BL_C.bud, 1, 2); px(bx, by + 1, BL_C.po); }
      return;
    }
    const topOf = (x) => { for (let y = 0; y < 7; y++) if (on(x, y)) return y; return 9; };
    const fl = [];
    for (const [x, y] of nodes) {
      const d = deg(x, y), p = d === 1 ? 0.9 : d >= 3 ? 0.7 : 0.45;   // clusters at the ends and the joints
      if (r() >= p) continue;
      const size = d === 1 && r() < 0.6 ? 7 : d !== 2 || r() < 0.3 ? 5 : 3;
      const fx = M + x * c + 1 + Math.floor(r() * 3) - 1, fy = M + y * c + Math.floor(r() * 3) + (y === topOf(x) ? 1 : 0);   // low on the top row (feet)
      fl.push([fx, fy, size, r() * 6.283, r() < 0.3]);
    }
    for (const [fx, fy, size, rot, white] of fl) {
      const f = blossomShape(size, rot, r);
      for (const k of f.keys()) { const [a, b] = k.split(',').map(Number); for (const [u, v] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!f.has(K(a + u, b + v))) px(fx + a + u, fy + b + v, BL_C.po); }
      for (const [k, col] of f) { const [a, b] = k.split(',').map(Number); px(fx + a, fy + b, white && col === BL_C.pl ? BL_C.white : white && col === BL_C.pm ? BL_C.pl : col); }
    }
    for (const [x, y] of nodes) if (y === 6 && r() < 0.35) px(M + x * c + Math.floor(r() * 4), M + 7 * c + 2 + Math.floor(r() * 3), BL_C.pm);   // petals hanging off the bottom
  });
}
/** pixel petals: face-on / edge-on, white / pink (atlas pt0..pt3) */
const petalCanvases = () => [
  pixelCanvas(3, 2, (g, px) => { px(0, 1, BL_C.pl, 2, 1); px(1, 0, BL_C.white, 2, 1); px(2, 1, BL_C.po); }),
  pixelCanvas(3, 1, (g, px) => { px(0, 0, BL_C.pl, 2, 1); px(2, 0, BL_C.po); }),
  pixelCanvas(3, 2, (g, px) => { px(0, 1, BL_C.pm, 2, 1); px(1, 0, BL_C.pm, 2, 1); px(2, 1, BL_C.po); }),
  pixelCanvas(3, 1, (g, px) => { px(0, 0, BL_C.pm, 2, 1); px(2, 0, BL_C.po); }),
];
/** a letter bursts into petals when the rubbing edge drops it: a small pop, then a slow flutter down into the pit.
 *  y0 = world y of the bottom of its cells (where it stood), c = cell px */
function petalBurst(batch, t, t0, b, y0, c) {
  const s = t - t0; if (s < 0 || s > 1.6) return;
  const r = mulberry32(b.i * 977 + 13), gl = BRIDGE_GLYPHS[b.ch];
  for (let k = 0; k < 16; k++) {
    let cx = 0, cy = 0; for (let n = 0; n < 12; n++) { cx = Math.floor(r() * b.wc); cy = Math.floor(r() * 7); if (gl[cy][cx] === '#') break; }
    const x0 = b.x + cx * c + 2, yy0 = y0 + (6 - cy) * c + 2;
    const vx = -20 + r() * 55, vy = 20 + r() * 50, ph = r() * 6.28, delay = r() * 0.12;
    const ss = s - delay; if (ss < 0) continue;
    const x = x0 + vx * ss + 5 * Math.sin(ph + ss * 7) * Math.min(1, ss * 2), y = yy0 + vy * ss - 55 * ss * ss;
    batch.draw('pt' + ((k + Math.floor((ss + ph) * 8)) % 2 + (k % 3 === 0 ? 2 : 0)), x, y);   // flutter flat <-> face-on; every third petal pink
  }
}

/** thought bubble: a flower (the clue), then a light bulb (the idea) */
function thoughtCanvas(bulb) {
  return pixelCanvas(30, 26, (g, px) => {
    const O = PAL.ink;
    for (let y = 0; y < 18; y++) for (let x = 0; x < 30; x++) { const dx = (x + 0.5 - 15) / 14, dy = (y + 0.5 - 12) / 7.5; const d = dx * dx + dy * dy; if (d < 1) px(x, y + 8 - 2, d > 0.78 ? O : '#ffffff'); }
    px(3, 3, O, 4, 3); px(4, 4, '#ffffff', 2, 1); px(0, 0, O, 2, 2);
    if (!bulb) { const c = PAL.rainbow[0]; px(13, 13, c, 5, 5); px(12, 14, c, 7, 3); px(14, 15, PAL.yellow, 3, 2); px(15, 9, '#3f8a3a', 1, 4); }
    else { px(12, 10, O, 7, 9); px(13, 11, PAL.yellow, 5, 7); px(14, 12, '#ffffff', 2, 2); px(13, 8, PAL.g2, 5, 2); for (const [x, y] of [[9, 14], [21, 14], [15, 21], [10, 19], [20, 19]]) px(x, y, PAL.yellow, 1, 1); }
  });
}
