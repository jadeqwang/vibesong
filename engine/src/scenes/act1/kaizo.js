// ACT I · 13.82-41.028 · LEVEL 1-1 · DRAFT (verse 1, Kaizo autoscroll) -> off the edge of the world -> the VOID (pre-chorus).
// One continuous world. Scene clock tau = song time with the two instrumental stops frozen (16.73-17.44, 23.695-24.22,
// measured re-hits) and the frame-stutter 29.08-31.00 (world jumps on each measured stutter hit, holds between).
//
//  13.82-14.012  zoom out of the 一 stroke into the level; LEVEL 1-1 · DRAFT
//  14.11  "Everything I love about life just blossoms": the lyric IS the floor (letter tiles); each tile blooms into
//         colour + a pixel flower as Jade's sneakers hit it.            subtitle: translation only (in-world words)
//  16.73  FREEZE: THE ERASER slides into the left edge and rubs the level behind the party to blank paper; "!" x3
//  17.44  RUN: the Eraser is now the autoscroll wall (everything left of it is rubbed out)
//  18.10  "because": the word is the bridge over a pit; its letters fall away as the Eraser chews them
//  20.12  "linked": hyperlink chain across a chasm; 22.06 Charlie boomerangs his hat onto it; 22.48 they grab and swing;
//         23.245 the link turns "visited" purple
//  23.695-24.22  freeze mid-air, silhouettes against the giant lit "life" sign; 24.596 land on the beat
//  27.55  Jade takes both pencils out (hair DOWN from here); 27.80 每一天 都是色彩: she taps the tiles, colour spreads
//  29.08-31.00  frame stutter locked to the measured stutter hits
//  31.28  真世界 就画出来: the floor runs out; Jade's graphite pencil draws a 一 platform on every beat, one beat ahead of
//         their feet; missing-texture checkerboard creeps into the paper
//  34.69  off the last tile into the VOID (blueprint grid, gizmos), HUD: LEVEL NOT FOUND
//  34.75  说出来 它就存在: words leave Jade's speech bubble and slam into place as platforms on the measured accents
//         35.64 / 36.49; missing-texture flashes in the chopped gaps
//  38.25  彩色笔 画出未来: the blue-cap (rainbow-core) pencil draws 未来 as a rainbow staircase; they climb it on the
//         beats 40.189 / 40.609 / 41.028 while the camera tilts up. HANDOFF at 41.028 (see HANDOFF_ACTS.md).
import * as T from '../../show/timing.js';
import { locAt } from '../../show/loc.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL, rainbowAt } from '../../core/palette.js';
import { PaperBG, BlueprintBG, Batch, dust, debris, sparkle, shake, stutter, CheckerRect } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { Track } from '../../core/choreo.js';
import { TextSprite, blockText } from '../../core/text.js';
import { Quad, canvasTex, rect, pixelCanvas } from '../../core/gfx.js';
import { HUD, HUD_H, Subtitle, subtitleFor, Bubble, Banner, panel } from '../../core/ui.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { Pencil, bangCanvas, checkerCanvas } from '../../core/props.js';
import { act1Atlas, floorColumn, PencilRig, speedLines } from './common.js';
import * as ART from './kaizo_art.js';
import { mulberry32 } from '../../util.js';

export async function setup(ctx) {
  const C = (k) => T.cue('act1.' + k);
  const V = 140, T0 = C('verse_drop'), FLOOR = 60, START = C('melisma')[1];
  const [F1a, F1b] = C('stop1'), [F2a, F2b] = C('stop2'); const d1 = F1b - F1a, d2 = F2b - F2a;
  const HITS = C('stutter_hits'), SPAN = C('stutter_span');
  /** scene clock: freezes + stutter (pure function of song time t) */
  const tau = (t) => {
    if (t >= F1a && t < F1b) return F1a;
    if (t >= F2a && t < F2b) return F2a - d1;
    const s = t >= SPAN[0] && t < SPAN[1] ? stutter(t, HITS, { start: SPAN[0], end: SPAN[1], play: 1 / 30 }) : t;
    return s - (t >= F1b ? d1 : 0) - (t >= F2b ? d2 : 0);
  };
  const J = (u) => 196 + V * (u - T0);         // Jade's base world x at scene time u (autoscroll)
  const X = (x) => (x - 196) / V + T0;         // inverse
  const tb = (n) => tau(T.snap(T.beat(n)));    // scene time of global beat n (frame-snapped: landings hit the beat frame)
  const ts = (x) => tau(T.snap(x));            // scene time of a frame-snapped song cue

  const st = new Stage2D(ctx, { bg: PAL.paper });
  const paper = st.add(new PaperBG(), Z.BG);
  const blue = st.add(new BlueprintBG(), Z.BG + 1);
  const atlas = act1Atlas(ctx.lib);
  ['g', 'h', 'i'].forEach((k, i) => atlas.add('floor' + k, floorColumn(60, i), [0, 0]));
  atlas.add('chk16', checkerCanvas(4), [0, 0]); atlas.add('chk8', checkerCanvas(2), [0, 0]);
  atlas.add('linkH', ART.linkCanvas(PAL.hyperlink, '#8fb0ff', false), [3, 2]); atlas.add('linkV', ART.linkCanvas(PAL.hyperlink, '#8fb0ff', true), [2, 3]);
  atlas.add('linkHv', ART.linkCanvas('#7a3cff', '#c2a0ff', false), [3, 2]); atlas.add('linkVv', ART.linkCanvas('#7a3cff', '#c2a0ff', true), [2, 3]);
  PAL.rainbow.forEach((h, i) => atlas.add('cap' + i, ART.colorCap(h), [0, 0]));
  atlas.add('brg', pixelCanvas(16, 14, (g, px) => { px(0, 0, PAL.g0, 16, 14); px(1, 1, PAL.g4, 14, 8); px(1, 1, PAL.g5, 14, 2); px(2, 10, PAL.g3, 12, 3); for (let i = 0; i < 5; i++) px(3 + i * 2, 4, PAL.g3, 1, 3); }), [8, 14]);
  atlas.add('brgc', pixelCanvas(16, 14, (g, px) => { px(0, 0, PAL.g0, 16, 14); px(1, 1, PAL.g4, 14, 8); px(1, 1, PAL.g5, 14, 2); px(2, 10, PAL.g3, 12, 3); px(7, 1, PAL.g0, 1, 4); px(8, 4, PAL.g0, 1, 3); px(6, 7, PAL.g0, 2, 1); px(11, 9, PAL.g0, 1, 4); px(3, 2, PAL.g0, 2, 1); }), [8, 14]);
  const bgBatch = st.add(new Batch(atlas, 600), Z.PLATFORM);
  const fxBatch = st.add(new Batch(atlas, 2000), Z.FX);
  const linkBatch = st.add(new Batch(atlas, 400), Z.PROP);

  // ---------------------------------------------------------------- parallax sketches
  const hillsTex = canvasTex(ART.hillsCanvas()), ruinsTex = canvasTex(ART.ruinsCanvas());
  const hills = [0, 1].map(() => st.add(new Quad(hillsTex, 512, 70), Z.PARALLAX));
  const ruins = [0, 1].map(() => st.add(new Quad(ruinsTex, 640, 96), Z.PARALLAX + 1));

  // ---------------------------------------------------------------- level geometry
  const PIT = [662, 888], CHASM = [Math.round(J(ts(22.48))) - 8, 1515], SPIKES = [1716, 1748], FLOOR_END = 2462;
  const BRIDGE = [CHASM[1] + 2, 1708]; // crumbling graphite bridge: cracks on the 24.22 re-hit, falls away behind the party
  const HOOK = CHASM[0] + 44;
  const floorAt = (x) => ((x > 176 && x < PIT[0]) || (x >= PIT[1] && x < CHASM[0]) || (x >= CHASM[1] && x < BRIDGE[0]) || (x >= BRIDGE[1] && x < FLOOR_END));
  // the first ground IS a giant 一 (the title stroke we dived into from PRESS START)
  const yiBig = await Hanzi2D.create('一', { size: 256, bold: 3 }); const ybx = -28;
  const ybTop = yiBig.strokeTopAt(0, 128); yiBig.place(ybx, FLOOR - ybTop); st.add(yiBig.group, Z.PLATFORM + 1);
  const yiCore = yiBig.medianAt(0, 0.3);
  // the lyric floor
  const LYRIC = 'Everything I love about life just blossoms', LX0 = 214;
  const letters = Array.from(LYRIC).map((ch, i) => {
    const hue = PAL.rainbow[(i * 5) % 12];
    const q = st.add(new Quad(canvasTex(ART.letterTile(ch, false)), 9, 10), Z.PLATFORM + 2); q.place(LX0 + i * 9, 50);
    return { ch, q, x: LX0 + i * 9, gray: q.material.uniforms.map.value, bloom: canvasTex(ART.letterTile(ch, true, hue)), c: i % 7 };
  });
  // "because" bridge: block letters (cell 4) whose x-height tops sit at floor level
  const bt = blockText('because', { cell: 4 });
  const BX0 = PIT[0] + 2, BY0 = FLOOR - 24;
  const bLetters = bt.letters.map((L) => { const q = st.add(new Quad(canvasTex(L.draw()), L.w, L.h), Z.PLATFORM + 1); return { ...L, q, x: BX0 + L.x0 }; });
  const becauseH = (x) => { const h = bt.heightAt(x - BX0); return h > 0 ? BY0 + h - 1 : null; };
  // linked chain
  const chainY = (x) => 122 - 16 * Math.sin(Math.PI * Math.max(0, Math.min(1, (x - CHASM[0]) / (CHASM[1] - CHASM[0]))));
  const pillarTex = canvasTex(ART.pillarCanvas(64));
  const pillars = [CHASM[0] - 8, CHASM[1] - 8].map((x) => { const q = st.add(new Quad(pillarTex, 16, 64), Z.PROP); q.place(x, FLOOR); return q; });
  const linkedLbl = st.add(new TextSprite({ text: 'linked', font: 'fp12', color: PAL.hyperlink }, { anchor: 'bc' }), Z.TEXT);
  const underline = st.add(rect(1, 1, PAL.hyperlink), Z.TEXT);
  const spikes = st.add(new Quad(canvasTex(ART.spikeCanvas(32)), 32, 10), Z.PROP); spikes.place(SPIKES[0], FLOOR);
  // the life sign (background; lit during the second stop)
  const signOff = canvasTex(ART.lifeSign(false)), signOn = canvasTex(ART.lifeSign(true));
  const sign = st.add(new Quad(signOff, 204, 60), Z.PROP + 7); sign.place(1328, 64);
  const dim = st.add(rect(1, 1, '#14141a', 0.66), Z.PROP + 6);

  // ---------------------------------------------------------------- drawn platforms (真世界 就画出来)
  const PB = [...Array(9)].map((_, k) => T.snap(T.beat(73 + k)));      // 31.348 ... 34.719 (beats 73..81)
  const PT = PB.map(tau), PX = PT.map(J);
  const PH = [72, 84, 78, 92, 86, 100, 94, 104];
  const PS = 72; const probe = await Hanzi2D.create('一', { size: PS, bold: 2 });
  const yi = []; // platform k landed at PB[k+1]
  for (let k = 0; k < 8; k++) {
    const h = await Hanzi2D.create('一', { size: PS, bold: 2 });
    const cx = PX[k + 1] + 4; const off = probe.strokeTopAt(0, PS / 2); // top surface at the centre when placed at y=0
    h.place(cx - PS / 2, PH[k] - off); h.plan(PT[k] - 0.2, PT[k] - 0.06); st.add(h.group, Z.PLATFORM + 3); yi.push(h);
  }
  const gPencil = st.add(new Pencil({ kind: 'graphite', len: 34 }), Z.FRONT);
  const gRig = new PencilRig(gPencil, yi.map((h) => ({ h, k: 0 })), { lift: 10, angle: -35 });

  // ---------------------------------------------------------------- VOID: words become platforms, then 未来
  const xs = J(ts(35.64));
  const ROW1 = { x0: xs - 18, y0: 80, text: '说出来', slam: C('pre_accents')[0] }, ROW2 = { x0: xs - 18 + 137, y0: 104, text: '它就存在', slam: C('pre_accents')[1] };
  const rows = [ROW1, ROW2].map((R) => ({ ...R, chars: Array.from(R.text).map((ch, i) => { const cv = ART.extrudedChar(ch); const q = st.add(new Quad(canvasTex(cv), cv.width, cv.height), Z.PLATFORM + 4); q.setScale(3); return { ch, q, x: R.x0 + i * 40, w: cv.width * 3, h: cv.height * 3 }; }) }));
  const ROWTOP = (R) => R.y0 + 36;
  const X_EDGE = PX[8] + 30;
  const MX = ROW2.x0 + 168;
  const wei = await Hanzi2D.create('未', { size: 96, style: 'rainbow', shadowColor: '#0a1030', bold: 2 }); wei.place(MX, 92); st.add(wei.group, Z.PLATFORM + 5);
  const laiProbe = await Hanzi2D.create('来', { size: 96 });
  const w0x = MX + 46, w0 = wei.strokeTopAt(0, w0x), w1x = MX + 30, w1 = wei.strokeTopAt(1, w1x);
  const lai = await Hanzi2D.create('来', { size: 96, style: 'rainbow', shadowColor: '#0a1030', bold: 2 });
  const LX = MX + 62; lai.place(LX, w0 + 24 - laiProbe.strokeTopAt(3, 40)); st.add(lai.group, Z.PLATFORM + 5);
  const l3x = LX + 44, l3 = lai.strokeTopAt(3, l3x);
  wei.plan(tau(38.25), tau(39.10), { gap: 0.12 }); lai.plan(tau(39.15), tau(39.97), { gap: 0.12 });
  const rPencil = st.add(new Pencil({ kind: 'rainbow', len: 60 }), Z.FRONT + 1);
  const rRig = new PencilRig(rPencil, [{ h: wei, k: 0 }, { h: lai, k: 0 }], { lift: 18, angle: -30, exit: [LX + 200, l3 + 160, 0.5] });
  const cubes = [[X_EDGE + 30, 150, 22], [X_EDGE + 140, 40, 16], [X_EDGE + 260, 160, 26], [X_EDGE + 380, 60, 18], [X_EDGE + 470, 200, 20]].map(([x, y, s], i) => {
    const cv = ART.cubeCanvas(s, PAL.gizmoBlue, i % 2 === 1); const q = st.add(new Quad(canvasTex(cv), cv.width, cv.height), Z.PARALLAX + 2); return { q, x, y };
  });
  const chkSq = [[X_EDGE + 70, 110, 12], [X_EDGE + 210, 190, 16], [X_EDGE + 330, 30, 10], [X_EDGE + 420, 130, 14]].map(([x, y, s]) => { const q = st.add(new CheckerRect(3), Z.PARALLAX + 3); q.setRect(x, y, s, s); return q; });
  const lorem = st.add(new TextSprite({ text: 'lorem ipsum dolor sit amet\nTODO: level_1_2.json\nnull', font: 'fp8', color: '#2a4a8a' }, { anchor: 'bl' }), Z.PARALLAX + 2); lorem.place(X_EDGE + 90, 150);

  // ---------------------------------------------------------------- Jade's course (scene time) ; followers = delayed path
  const tr = new Track({ x: J(13.0), y: FLOOR, anim: 'run' });
  const RUN = { cycle: 'beat', per: 8 };
  tr.run(13.0, X(650), 650, RUN)
    .jump(X(650), ts(18.10), J(ts(18.10)), becauseH(J(ts(18.10))), { apex: 9 })
    .run(ts(18.10), X(PIT[1]), PIT[1], { ...RUN, ground: (x) => becauseH(x) ?? FLOOR })
    .run(X(PIT[1]), ts(22.48), J(ts(22.48)), RUN)
    .jump(ts(22.48), ts(22.48) + 0.2, J(ts(22.48) + 0.2), chainY(J(ts(22.48) + 0.2)) - 43, { apex: 10, land: 'jump' })
    .path(ts(22.48) + 0.2, 22.83, (u) => { const x = J(ts(22.48) + 0.2) + (J(22.83) - J(ts(22.48) + 0.2)) * u; return [x, chainY(x) - 43]; }, { anim: 'jump', frame: 0, air: true })
    .jump(22.83, ts(24.596), CHASM[1] + 14, FLOOR, { apex: 24 })
    .run(ts(24.596), X(SPIKES[0] - 8) - 0.01, SPIKES[0] - 8, RUN)
    .jump(X(SPIKES[0] - 8) - 0.01, tb(61.5), J(tb(61.5)) + 6, FLOOR, { apex: 20 })
    .run(tb(61.5), PT[0], PX[0], RUN);
  for (let k = 0; k < 8; k++) tr.jump(PT[k], PT[k + 1], PX[k + 1], PH[k], { apex: 14 });
  // VOID
  const tS = ts(35.64), tJ2 = ts(36.10), tR2 = ts(36.49);
  tr.jump(tau(34.85), tS, xs, ROWTOP(ROW1), { apex: 24, anim: 'run' })
    .run(tS, tJ2, xs + 64, RUN)
    .jump(tJ2, tR2, xs + 64 + 55, ROWTOP(ROW2), { apex: 16 })
    .run(tR2, tau(37.4), ROW2.x0 + 132, { ...RUN, ease: T.ease.out })
    .hold(tau(37.4), tau(40.0), { anim: 'idle' })
    .jump(tau(40.0), tb(94), w1x, w1, { apex: 14 })
    .jump(tb(94) + 0.04, tb(95), w0x, w0, { apex: 12 })
    .jump(tb(95) + 0.04, tb(96), l3x, l3, { apex: 14 })
    .hold(tb(96), 100, { anim: 'idle' });
  const jade = st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR + 2);
  const charlie = st.add(new Actor(ctx.lib, 'charlie'), Z.ACTOR + 1);
  const ricky = st.add(new Actor(ctx.lib, 'ricky'), Z.ACTOR);
  const PENCILS_OUT = tau(27.552);
  const heroes = [{ a: jade, d: 0 }, { a: charlie, d: T.beat(1) - T.beat(0.5) }, { a: ricky, d: T.beat(1) - T.beat(0) }];
  const bang = canvasTex(bangCanvas());
  const bangs = heroes.map(() => st.add(new Quad(bang, 9, 14, { anchor: [4, 0] }), Z.TEXT));
  const hatSp = ctx.lib.get('charlie_hat_boomerang');
  const hat = st.add(new Quad(hatSp.tex, 16, 16, { anchor: [8, 8] }), Z.ACTOR_FRONT);
  // eraser
  const er = ctx.lib.get('eraser_chase_x2');
  const eraser = st.add(new Quad(er.tex, er.w, er.h, { anchor: [er.meta.anchor[0], er.h - 1 - er.meta.anchor[1]] }), Z.PROP + 5);

  // ---------------------------------------------------------------- UI
  const hud = st.addUI(new HUD(ctx.lib), ZUI.HUD);
  const subTop = st.addUI(new Subtitle({ y: 150 }), ZUI.SUBS), subBot = st.addUI(new Subtitle({ y: HUD_H + 3 }), ZUI.SUBS);
  const lvl = st.addUI(new Banner({ text: 'LEVEL 1-1 · DRAFT', font: 'px', color: PAL.ink }, { style: 'paper' }), ZUI.BANNER);
  const lnf = st.addUI(new Banner({ text: '! LEVEL NOT FOUND !', font: 'px', color: PAL.red }, { style: 'dialog' }), ZUI.BANNER);
  const axis = st.addUI(new Quad(canvasTex(ART.axisGizmoCanvas()), 28, 28), ZUI.BANNER); axis.place(288, 148);
  const bubble = st.add(new Bubble(), Z.TEXT + 2);
  const chops = C('pre_chop_gaps');

  /** follower state: Jade's course delayed by d, never closer than `gap` px behind the one ahead */
  const heroState = (u, i, aheadX) => {
    const s = tr.at(u - heroes[i].d);
    if (i > 0 && s.x > aheadX - 24) { s.x = aheadX - 24; }
    return s;
  };
  const jadeOnlyAnim = new Set(['sing', 'draw_rainbow', 'draw_graphite', 'victory']);
  const words = [5, 6, 7, 8, 9, 10, 11].flatMap((id) => T.words(id));

  return {
    stage: st,
    update(t) {
      const u = tau(t);
      // ---------------------------------------------------------------- heroes
      const S = []; let aheadX = 1e9;
      heroes.forEach((h, i) => { const s = heroState(u, i, aheadX); aheadX = s.x; S.push(s); });
      // ---------------------------------------------------------------- camera
      let cx = J(u) - 36, cy = 90, zoom = 1;
      if (t < T0) { const k = T.span(t, START, T0, T.ease.inQuad); zoom = Math.exp(Math.log(26) * (1 - k)); cx = yiCore[0] + (cx - yiCore[0]) * k; cy = yiCore[1] + (90 - yiCore[1]) * k; }
      const rise = Math.max(0, S[0].y - 64) * 0.75; cy += Math.min(40, rise * T.span(u, PT[0] - 0.5, PT[0]));
      // VOID camera: stop the autoscroll on the second slam, frame the staircase, tilt up for the climb
      const VX = ROW2.x0 + 150, VY = 132;
      if (u > tS) { const k = T.span(u, tS, tau(37.2), T.ease.inOut); cx = cx + (VX - cx) * k; cy = cy + (VY - cy) * k; }
      if (u > tau(38.25)) { const k = T.span(u, tau(38.25), tau(39.97), T.ease.inOut); cx += 26 * k; cy += 30 * T.span(u, tau(38.9), tau(39.9), T.ease.inOut); }
      if (u > tau(39.95)) { const k = T.span(u, tau(39.95), tb(96), T.ease.inOut); cy += (l3 - 30 - VY - 30) * k; cx += (l3x - 20 - VX - 26) * k * 0.6; }
      const sh = shake(t, [F1a + 0.4, F2b, ...HITS, ...C('pre_accents').map(T.snap), T0], { amp: 1, dur: 0.12 });
      st.cam.set({ x: cx, y: cy, zoom, shake: sh });
      const L = st.cam.left, R = L + st.cam.vw, B = st.cam.bottom;
      // ---------------------------------------------------------------- eraser: the autoscroll wall
      let esx = -200;
      if (t >= F1a + 0.02) {
        if (t < F1b) esx = -70 + 108 * T.span(t, F1a + 0.02, F1a + 0.42, T.ease.out) + (t > F1a + 0.42 ? Math.round(2 * Math.sin(t * 40)) : 0);
        else esx = 38 + Math.round(8 * T.beatPulse(t, 1, 0.12)) - 4;
      }
      let ex = L + esx;
      const EDGE_STOP = PX[7] - 40; if (ex > EDGE_STOP) ex = EDGE_STOP;
      const eraseX = esx > -150 ? ex + 34 : -1e9;
      eraser.visible = esx > -150; eraser.setRect((Math.floor(u * 6) % er.n) / er.n, 0, 1 / er.n, 1); eraser.place(ex, 54);
      // ---------------------------------------------------------------- backgrounds
      const inVoid = R > X_EDGE;
      paper.position.set(L - 16, B - 16, 0); paper.scale.set(Math.max(0.001, Math.min(R + 16, X_EDGE) - L + 16), st.cam.vh + 32, 1);
      blue.visible = inVoid; blue.position.set(Math.max(X_EDGE, L - 16), B - 16, 0); blue.scale.set(Math.max(0.001, R + 16 - Math.max(X_EDGE, L - 16)), st.cam.vh + 32, 1);
      paper.u.uBlankX.value = eraseX; paper.u.uMissing.value = 0.38 * T.span(t, 31.28, 34.69);
      blue.u.uTime.value = t; blue.u.uGlitch.value = chops.some(([a, b]) => t >= a && t < b) ? 0.12 : 0;
      const par = (q, k, w, y) => { const base = L * k; const off = ((L - base) % w + w) % w; q[0].place(L - off, y); q[1].place(L - off + w, y); q.forEach((qq) => { qq.material.uniforms.clipX.value = eraseX; qq.material.uniforms.clipR.value = X_EDGE - 4; qq.visible = L < X_EDGE; }); };
      par(hills, 0.25, 512, FLOOR + 10); par(ruins, 0.55, 640, FLOOR - 2);
      // ---------------------------------------------------------------- floor + lyric tiles + flowers
      bgBatch.begin(); bgBatch.material.uniforms.clipX.value = eraseX;
      const creep = T.span(t, 31.28, 34.69);
      for (let x = Math.floor((L - 16) / 16) * 16; x < R + 16; x += 16) {
        if (!floorAt(x + 8)) continue;
        const hsh = ((x * 2654435761) >>> 0) / 4294967296;
        if (x > 1900 && hsh < creep * 0.7) bgBatch.draw('chk16', x, 0, { sx: 2, sy: 7.5 }); else bgBatch.draw('floor' + 'ghi'[(x / 16) & 1 ? 1 : (x / 16) % 3 === 0 ? 2 : 0], x, 0);
        // 每一天 都是色彩: colour spreads tile by tile under the blue-cap pencil
        if (x >= 1953 && x < FLOOR_END) { const pass = X(x + 8); if (u >= pass && !(x > 1900 && hsh < creep * 0.7)) bgBatch.draw('cap' + ((x / 16) % 12 + 12) % 12, x, 50); }
      }
      // the crumbling bridge
      const cracked = t >= T.snap(F2b);
      for (let x = BRIDGE[0]; x < BRIDGE[1]; x += 16) {
        if (x > R + 16 || x < L - 32) continue;
        const uFall = X(x + 16) + heroes[2].d + 0.06;   // after Ricky (the last hero) is off it
        const s2 = u - uFall; const y = s2 > 0 ? FLOOR - 420 * s2 * s2 : FLOOR + (cracked && T.since(t, F2b) < 0.25 ? (Math.floor(t * 30) % 2) : 0);
        if (y > -20) bgBatch.draw(cracked ? 'brgc' : 'brg', x + 8, y, s2 > 0 ? { rot: -s2 * 3 * ((x / 16) % 2 ? 1 : -1), snap: false } : {});
      }
      bgBatch.end();
      fxBatch.begin(); fxBatch.material.uniforms.clipX.value = eraseX;
      letters.forEach((l, i) => {
        const on = J(u) + 4 >= l.x + 4; l.q.material.setMap(on ? l.bloom : l.gray); l.q.material.uniforms.clipX.value = eraseX;
        l.q.visible = l.x > L - 12 && l.x < R;
        if (on && l.ch !== ' ') { const age = u - X(l.x); const s = Math.min(4, Math.floor(age * 30)); fxBatch.draw(`flower${l.c}_${s}`, l.x + 4, FLOOR); if (age < 0.25) sparkle(fxBatch, u, X(l.x), l.x + 4, FLOOR + 6, { n: 3, r: 8, seed: i, dur: 0.25 }); }
      });
      // because letters: fall away as the eraser chews them
      bLetters.forEach((b, i) => {
        let y = BY0; b.q.rotation.z = 0;
        const uFall = X(b.x + 8 + 124);                   // when the eraser's rubbing edge (~ J - 124) reaches the letter
        if (u > uFall && t > F1b) { const s = u - uFall; y = BY0 - 300 * s * s; b.q.rotation.z = -s * 2.5; }
        b.q.place(b.x, y); b.q.visible = b.x > L - 40 && b.x < R && y > -40;
      });
      // chain + hat + label
      linkBatch.begin(); linkBatch.material.uniforms.clipX.value = eraseX;
      const visited = t >= T.snap(T.word(7, 3).start);
      for (let x = CHASM[0]; x <= CHASM[1]; x += 5) { const k = Math.round((x - CHASM[0]) / 5); linkBatch.draw((k % 2 ? 'linkV' : 'linkH') + (visited ? 'v' : ''), x, chainY(x)); }
      linkBatch.end();
      const LC = (CHASM[0] + CHASM[1]) / 2; linkedLbl.place(LC, chainY(LC) + 10); linkedLbl.set({ color: visited ? '#7a3cff' : PAL.hyperlink });
      underline.setSize(linkedLbl.w, 1); underline.place(LC - Math.floor(linkedLbl.w / 2), chainY(LC) + 9); underline.material.setColor(visited ? '#7a3cff' : PAL.hyperlink);
      linkedLbl.visible = underline.visible = t >= T.snap(T.word(7, 0).start) - 0.4 && L < 1560;
      const tThrow = tau(22.06), tHook = tThrow + 0.26, tBack = ts(24.596) + 0.05;
      hat.visible = false;
      if (u >= tThrow && u < tBack + 0.3) {
        hat.visible = true; const cp = S[1];
        if (u < tHook) { const k = (u - tThrow) / (tHook - tThrow); hat.place(cp.x + 8 + (HOOK - cp.x - 8) * k, cp.y + 30 + (chainY(HOOK) - cp.y - 30) * k + 24 * Math.sin(Math.PI * k)); }
        else if (u < tBack) hat.place(HOOK, chainY(HOOK) - 3);
        else { const k = (u - tBack) / 0.3; hat.place(HOOK + (cp.x - HOOK) * k, chainY(HOOK) + (cp.y + 40 - chainY(HOOK)) * k); }
        hat.setRect((Math.floor(u * 16) % 3) / 3, 0, 1 / 3, 1);
      }
      pillars.forEach((p) => (p.material.uniforms.clipX.value = eraseX));
      // the life sign + silhouette freeze
      const fr2 = t >= F2a && t < F2b;
      const lit = t >= F2a;
      sign.material.setMap(signOn); sign.visible = lit && t < F2b + 0.18; sign.material.uniforms.clipX.value = eraseX;
      dim.visible = fr2; dim.setSize(st.cam.vw + 4, st.cam.vh + 4); dim.place(L - 2, B - 2);
      // ---------------------------------------------------------------- drawn platforms + graphite pencil
      yiBig.eraseLeftOf(eraseX > -1e8 ? eraseX : null);
      yi.forEach((h) => { h.apply(u); h.eraseLeftOf(eraseX > -1e8 ? eraseX : null); });
      const gp = gRig.at(u); gPencil.visible = u > PT[0] - 0.4 && u < PT[7] + 0.05;
      if (gPencil.visible) gRig.apply(u);
      if (u > PT[0] - 0.3 && u < PT[8]) for (let k = 0; k < 8; k++) dust(fxBatch, u, PT[k + 1], PX[k + 1], PH[k], { n: 4, seed: k + 20, spread: 8 });
      // ---------------------------------------------------------------- VOID: bubbles -> words -> platforms
      rows.forEach((Rw, ri) => {
        const t0 = ri === 0 ? 35.30 : 36.18, slam = Rw.slam;
        Rw.chars.forEach((c, i) => {
          const a = T.snap(t0 + i * 0.05), k = T.span(t, a, T.snap(slam), T.ease.inQuad);
          const fromX = S[0].x + 6 + i * 10, fromY = S[0].y + 52;
          c.q.visible = t >= a;
          c.q.place(fromX + (c.x - fromX) * k, fromY + (Rw.y0 - fromY) * k);
          c.q.flash = 0; // the word lands clean (flash is on the frame before)
        });
        if (t >= T.snap(slam)) { dust(fxBatch, t, slam, Rw.x0 + Rw.chars.length * 20, Rw.y0 + 2, { n: 10, seed: 40 + ri, spread: 40, dur: 0.4 }); }
      });
      const bub = t >= 34.75 && t < 36.52 ? (t < 35.56 ? 0 : 1) : -1;
      bubble.visible = bub >= 0;
      if (bub >= 0) {
        const id = 10, ws = T.words(id), text = bub === 0 ? '说出来' : '它就存在';
        const wsel = bub === 0 ? ws.slice(0, 2) : ws.slice(2);
        let n = 0; for (const w of wsel) if (t >= w.start - 0.03) n += Array.from(w.w).length;
        const dropped = bub === 0 ? (t >= 35.30) : (t >= 36.18);
        const bw = Array.from(text).length * 24 + 16, by = Math.min(S[0].y + 46, B + st.cam.vh - 38);
        bubble.set({ spans: [{ text, color: dropped ? '#b8b8c8' : PAL.ink }], reveal: n, x: Math.min(S[0].x + 14, L + st.cam.vw - bw + 8), y: by, scale: 2 });
      }
      // gizmos (parallax 0.6 in the void)
      cubes.forEach((c, i) => { c.q.place(c.x - (L - X_EDGE) * 0.4, c.y + Math.round(3 * Math.sin(t * 1.3 + i))); c.q.visible = inVoid; });
      chkSq.forEach((q) => { q.visible = inVoid; });
      lorem.visible = inVoid;
      // chop flashes: missing-texture blocks flicker over the screen in the chopped gaps
      const chop = chops.some(([a, b]) => t >= a && t < b);
      if (chop) { const r = mulberry32(Math.floor(t * 30) * 7 + 3); for (let i = 0; i < 18; i++) { const gx = L + r() * st.cam.vw, gy = B + 30 + r() * (st.cam.vh - 30), sx = 1 + Math.floor(r() * 3), sy = 1 + Math.floor(r() * 2);
          if (rows.some((Rw) => gx + sx * 8 > Rw.x0 - 4 && gx < Rw.x0 + Rw.chars.length * 40 + 4 && gy + sy * 8 > Rw.y0 - 4 && gy < Rw.y0 + 44)) continue; // never on the words
          fxBatch.draw('chk16', gx, gy, { sx, sy }); } }
      // 未来: the rainbow pencil draws the staircase
      wei.apply(u); lai.apply(u);
      const rp = rRig.at(u); rPencil.visible = u > tau(38.0) && !rp.gone; if (rPencil.visible) rRig.apply(u);
      sparkle(fxBatch, u, tau(39.97), MX + 48, w0 + 10, { n: 10, r: 40, dur: 0.6 });
      // ---------------------------------------------------------------- heroes (pencils out from 27.55: hair DOWN)
      const fr1 = t >= F1a && t < F1b;
      heroes.forEach((h, i) => {
        const s = S[i]; const isJ = i === 0;
        let anim = s.anim; if (!isJ && jadeOnlyAnim.has(anim)) anim = 'idle';
        if (anim === 'hang') anim = 'jump';
        const pencil = isJ && u >= PENCILS_OUT;
        if (isJ && u >= tau(34.80) && u < tS) anim = 'sing';
        if (isJ && u >= tau(38.25) && u < tau(39.99) && s.anim === 'idle') anim = 'draw_rainbow';
        if (!isJ && i === 1 && u >= tThrow && u < tThrow + 0.16) { h.a.set({ ...s, anim: 'throw', frame: u < tThrow + 0.06 ? 0 : 1, sil: fr2 ? [0, 0, 0, 1] : null }); return; }
        h.a.set({ ...s, anim, pencil, facing: 1, frame: anim === 'sing' || anim === 'draw_rainbow' ? 0 : s.frame, sil: fr2 ? [0, 0, 0, 1] : null });
        // "!" over every head on the first stop
        const bq = bangs[i]; bq.visible = fr1 && t >= F1a + 0.06 + i * 0.04; bq.place(s.x, s.y + 46 + (T.exactFrame(t, [F1a + 0.06 + i * 0.04]) ? 3 : 0));
        if ((s.anim === 'run' || s.air) && !fr1 && !fr2 && isJ && t > T0) speedLines(fxBatch, t, s.x, s.y, 1);
      });
      // footstep sparkles while colouring tiles
      if (u >= tau(27.8) && u < tau(31.28)) for (const bt8 of T.beatsIn(t - 0.3, t + 0.01, 2)) sparkle(fxBatch, t, bt8, S[0].x + 10, FLOOR + 2, { n: 4, r: 8, seed: Math.round(bt8 * 100), color: rainbowAt(bt8 * 0.37) });
      // eraser crumbs
      if (eraseX > -1e8 && t < 34.8) for (let k = 0; k < 6; k++) { const t0 = Math.floor(t * 10) / 10 - k * 0.1; debris(fxBatch, t, t0, eraseX - 6, 60 + (k * 37) % 70, { n: 3, seed: Math.round(t0 * 10), names: ['ecrumb0', 'ecrumb1', 'ecrumb2', 'ecrumb3'], vx: [-40, 10], vy: [20, 80], dur: 0.6 }); }
      dust(fxBatch, u, ts(24.596), CHASM[1] + 14, FLOOR, { n: 7, seed: 31 });
      for (let x = BRIDGE[0]; x < BRIDGE[1]; x += 16) { const uF = X(x + 16) + heroes[2].d + 0.06; debris(fxBatch, u, uF, x + 8, FLOOR - 4, { n: 6, seed: x, vx: [-30, 30], vy: [-20, 60], dur: 0.7 }); }
      dust(fxBatch, u, tb(61.5), J(tb(61.5)) + 6, FLOOR, { n: 5, seed: 32 });
      fxBatch.end();
      // ---------------------------------------------------------------- flashes
      const flashT = [F1b, F2b, T0, ...C('pre_accents').map((e) => T.snap(e) - 1 / T.fps())];
      st.fx.flash = T.exactFrame(t, flashT) ? 0.8 : T.exactFrame(t, HITS) ? 0.3 : 0;
      // ---------------------------------------------------------------- UI: HUD, subtitles, banners
      const singing = words.some((w) => t >= w.start && t < w.end) && Math.floor(t * 8) % 2 === 0;
      hud.set({ singing: { jade: singing }, alert: t >= 34.69 && t < 37.2, alertOn: Math.floor(t * 4) % 2 === 0, loc: locAt(t) });
      let topC = null, botC = null;
      for (const id of [5, 6, 7, 8, 9]) { const c = subtitleFor(t, id, { hold: 0.25 }); if (c) topC = c; }
      if (topC && t > T.word(7, 7).start + 0.9 && t < T.line(8).start - 0.1) topC = null; // line 7 'life' held: let the world breathe
      for (const id of [10, 11]) { const c = subtitleFor(t, id, { hold: 0.3 }); if (c) botC = c; }
      if (t >= 34.6) topC = null; else botC = null;
      subTop.set(topC); subBot.set(botC);
      const lv = t < 14.6; lvl.visible = lv; lvl.place(160, 112 + (t > 14.45 ? Math.round((t - 14.45) * 600) : 0));
      lvl.bg.flash = 0;
      const nf = t >= 34.70 && t < 35.15 && Math.floor(t * 6) % 3 !== 2; lnf.visible = nf; lnf.place(160, 164); // brief, then the HUD carries LEVEL NOT FOUND
      axis.visible = inVoid;
    },
  };
}
