// ACT I · 0:00-4.19 · COLD OPEN: "the level draws itself under her feet" (the Twitter hook).
//  0.00  first frame already moving: the graphite pencil (pink cap = FIXTURES) sketches a guide line
//  0.21-0.343  the pencil slashes 一 in 4 frames; Jade (hair UP) drops in and lands ON the kick (0.343): dust + 2px shake
//  whistle notes (measured 0.91 / 1.35 / 1.78 / 2.63): each draws the next character in true stroke order a split
//  second before her foot needs it: 笔 (staircase: lands stroke 7 on beat 1.199, stroke 4 on beat 1.627),
//  一 (long leap, lands on the bar-2 downbeat 2.054), 画 (strokes 0-6 on note 3, the closing stroke 7 on note 4,
//  she lands on top of it on the held note 2.63)
//  2.63-3.35  camera pulls back 2x -> 1x: the title 一笔一画; pinyin pops in; the gloss types on
//  3.763  bar-3 hit: 1-frame flash, FREEZE (scene time held) through the gap to 4.19
import * as T from '../../show/timing.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { PaperBG, Batch, dust, shake } from '../../core/fx.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { Actor } from '../../core/sprites.js';
import { Track, smoothFollow } from '../../core/choreo.js';
import { TextSprite } from '../../core/text.js';
import { Pencil } from '../../core/props.js';
import { TITLE, buildTitle, PencilRig, act1Atlas, speedLines } from './common.js';
import { mulberry32 } from '../../util.js';

export async function setup(ctx) {
  const C = (k) => T.cue('act1.' + k);
  // discrete visual events land on the frame nearest the measured time (T.snap)
  const KICK = T.snap(C('first_kick')), N = C('whistle_notes').map(T.snap), HIT = C('bar3_hit');
  const B = (n) => T.snap(T.beat(n));
  const st = new Stage2D(ctx, { bg: PAL.paper });
  const bg = st.add(new PaperBG(), Z.BG);
  const { hz, py } = await buildTitle(st);
  const [h0, h1, h2, h3] = hz;
  // light sketch guide under the first stroke (the very first frame is already a pencil in motion)
  const sketch = await Hanzi2D.create('一', { size: TITLE.size, style: 'solid', shadow: false }); sketch.place(TITLE.xs[0], TITLE.y0 - 1);
  sketch.u.uColor.value.set(PAL.g4); sketch.u.uTipAmt.value = 0; st.add(sketch.group, Z.PLATFORM - 1);

  // ---------------------------------------------------------------- drawing plans (true stroke order)
  sketch.plan(0, 0.30, { ease: (u) => u * 0.55 });
  h0.plan(0.21, KICK);
  h1.plan(N[0], N[0] + 0.27, { gap: 0.1 });
  h2.plan(N[1], N[1] + 0.1);
  h3.plan(N[2], N[2] + 0.5, { strokes: [0, 1, 2, 3, 4, 5, 6], gap: 0.1 });
  h3.plan(N[3] - 0.1, N[3] - 0.01, { strokes: [7] });
  const pencil = st.add(new Pencil({ kind: 'graphite', len: 60 }), Z.FRONT);
  const rig = new PencilRig(pencil, [{ h: sketch, k: 0 }, { h: h0, k: 0 }, { h: h1, k: 0 }, { h: h2, k: 0 }, { h: h3, k: 0 }, { h: h3, k: 1 }], { lift: 16, angle: -30, exit: [372, 230, 0.45] });

  // ---------------------------------------------------------------- Jade's route (landings computed from the glyphs)
  const mid = (h, s) => { const b = h.strokeBox(s); return Math.round((b.x0 + b.x1) / 2); };
  const top = (h, s, x) => h.strokeTopAt(s, x);
  const L1 = [TITLE.xs[0] + 14, null]; L1[1] = top(h0, 0, L1[0]);
  const g0 = (x) => top(h0, 0, Math.max(TITLE.xs[0] + 8, Math.min(TITLE.xs[0] + 56, x))) ?? L1[1];
  const b7 = h1.strokeBox(7), b4 = h1.strokeBox(4), b0 = h3.strokeBox(0);
  const L2x = b7.x0 + 8, L2 = [L2x, top(h1, 7, L2x)];
  const L3x = Math.round((b4.x0 + b4.x1) / 2), L3 = [L3x, top(h1, 4, L3x)];
  const L4x = TITLE.xs[2] + 22, L4 = [L4x, top(h2, 0, L4x)];
  const g2 = (x) => top(h2, 0, Math.max(TITLE.xs[2] + 8, Math.min(TITLE.xs[2] + 56, x))) ?? L4[1];
  const L5x = mid(h3, 0) + 2, L5 = [L5x, top(h3, 0, L5x)];
  const tr = new Track({ x: L1[0], y: 205, anim: 'jump' })
    .fall(0.10, KICK, L1[1], { x: L1[0], land: 'idle' })
    .hold(KICK, KICK + 0.07, { anim: 'idle' })
    .run(KICK + 0.07, 0.95, TITLE.xs[0] + 50, { ground: g0, stride: 6, x0: L1[0] })
    .jump(0.95, B(2), L2[0], L2[1], { apex: 12 })
    .run(B(2), B(2) + 0.08, L2[0] + 6, { ground: (x) => top(h1, 7, x) ?? L2[1], stride: 6 })
    .jump(B(2) + 0.08, B(3), L3[0], L3[1], { apex: 10 })
    .run(B(3), 1.70, b4.x1 - 5, { ground: (x) => top(h1, 4, x) ?? L3[1], stride: 6 })
    .jump(1.70, B(4), L4[0], L4[1], { apex: 20 })
    .run(B(4), 2.24, TITLE.xs[2] + 48, { ground: g2, stride: 6, x0: L4[0] })
    .jump(2.24, N[3], L5[0], L5[1], { apex: 16 })
    .hold(N[3], 10, { anim: 'victory' });
  const jade = st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR);
  const landings = [KICK, B(2), B(3), B(4), N[3]];

  // ---------------------------------------------------------------- type
  const gloss = st.addUI(new TextSprite({ spans: [
    { text: '"stroke by stroke"', color: PAL.capBlueLo }, { text: ': how every kid learns\nto write Chinese. And how you vibe code.', color: PAL.g0 }],
  font: 'fp12', align: 'center', lineGap: 3 }, { anchor: 'bc' }), ZUI.SUBS);
  const glossLen = gloss.r.chars.length;
  const atlas = act1Atlas(ctx.lib); const batch = st.add(new Batch(atlas), Z.FX);
  const crumbs = mulberry32(5);
  const crumbSeeds = [...Array(64)].map(() => [crumbs() * 2 - 1, crumbs()]);

  return {
    stage: st,
    update(t) {
      const tt = Math.min(t, HIT); // FREEZE on the bar-3 hit through the gap
      // strokes
      for (const h of [sketch, ...hz]) h.apply(tt);
      // 笔 reads as a STAIRCASE: the two step strokes (7, then 4) stay solid, the rest recede while she climbs
      const dim = 0.6 * T.span(tt, N[0], N[0] + 0.2) * (1 - T.span(tt, N[3], N[3] + 0.5));
      for (let i = 0; i < h1.n; i++) h1.setDim(i, i === 7 || i === 4 ? 0 : dim);
      // landing flash on the stroke under her feet (3 frames)
      const hit = (L) => Math.max(0, 1 - (tt - L) * 10) * (tt >= L ? 1 : 0);
      h0.setHi(0, 0.8 * hit(KICK)); h1.setHi(7, 0.8 * hit(B(2))); h1.setHi(4, 0.8 * hit(B(3))); h2.setHi(0, 0.8 * hit(B(4))); h3.setHi(0, 0.8 * hit(N[3]));
      sketch.alpha = 1 - T.span(tt, KICK, KICK + 0.25);
      // pencil
      rig.apply(tt);
      // Jade
      const s = tr.at(tt);
      jade.set({ ...s, pencil: false });
      // camera: 2x following Jade, then pull back to the title framing
      const follow = (u) => { const q = tr.at(Math.max(KICK, Math.min(u, N[3]))); return [q.x + 24, q.y + 10]; };
      const [fx, fy] = smoothFollow(follow, tt, 0.6, 13);
      const pb = T.span(tt, N[3], N[3] + 0.72, T.ease.inOut);
      const zoom = 2 - pb;
      const cx = fx + (160 - fx) * pb, cy = fy + (90 - fy) * pb;
      const sh = shake(tt, [KICK], { amp: 1.4, dur: 0.16 });
      st.cam.set({ x: cx, y: cy, zoom, shake: sh });
      bg.cover(st.cam);
      // pinyin pop-in during the pull-back
      py.forEach((p, k) => { const a = N[3] + 0.18 + 0.08 * k; p.visible = tt >= a; p.place(TITLE.xs[k] + TITLE.size / 2, TITLE.y0 - 15 + Math.round(4 * (1 - T.span(tt, a, a + 0.08)))); });
      // gloss: typed on, in the UI layer (fixed, crisp)
      const g0t = N[3] + 0.42, g1t = HIT - 0.12;
      gloss.visible = tt >= g0t; gloss.set({ reveal: Math.floor(glossLen * T.span(tt, g0t, g1t)) }); gloss.place(160, 14);
      // FX: dust on landings, speed lines while running/leaping, graphite crumbs off the pencil tip
      batch.begin();
      landings.forEach((L, i) => { const q = tr.at(L + 0.001); dust(batch, tt, L, q.x, q.y, { seed: i + 1, n: i === 0 ? 8 : 5, spread: i === 0 ? 16 : 10 }); });
      if ((s.anim === 'run' || s.air) && tt > KICK && tt < N[3]) speedLines(batch, tt, s.x, s.y, 1);
      for (let k = 0; k < 10; k++) {
        const e = tt - k / 30; if (e < 0) break;
        const p = rig.at(e); if (!p.drawing) continue;
        const [r1, r2] = crumbSeeds[(Math.floor(e * 30) * 3 + k) % 64]; const age = tt - e;
        batch.draw(r2 > 0.5 ? 'crumb1' : 'px1', p.x + r1 * 4 + 10 * age, p.y - 40 * age * age * 6 + 2, { color: PAL.g1 });
      }
      batch.end();
      st.fx.flash = T.exactFrame(t, [HIT]) ? 0.85 : 0;
    },
  };
}
