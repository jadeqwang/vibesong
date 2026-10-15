// ACT I · 11.02-13.82 · PRESS START (breathy 一 11.14 / 笔 11.40 / 一 11.68 / 画 12.31, measured onsets).
// Jade (hair DOWN: graphite pencil in hand) taps START on each syllable; that title character redraws in fast
// stroke order. Subtitle: translation only ("stroke by stroke"; the characters themselves are on screen).
// 12.95-13.82 melisma riser: the camera dives into the first 一 stroke (it becomes the ground of LEVEL 1-1).
import * as T from '../../show/timing.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { PaperBG, Batch, sparkle, dust, shake } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { TextSprite } from '../../core/text.js';
import { panel, Subtitle, subtitleFor } from '../../core/ui.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { TITLE, buildTitle, act1Atlas } from './common.js';

export async function setup(ctx) {
  const C = (k) => T.cue('act1.' + k);
  const SY = C('breathy_syllables'), MEL = C('melisma'), DIVE0 = 12.95, END = MEL[1];
  const st = new Stage2D(ctx, { bg: PAL.paper });
  const bg = st.add(new PaperBG(), Z.BG);
  const y0 = 112;
  const { hz } = await buildTitle(st, { y0, pinyin: false });
  // each syllable SLAMS its character in big at centre (fast true stroke order), then it flies into its title slot
  const SL = SY.map(T.snap);
  hz.forEach((h, k) => h.plan(SL[k] - 0.01, SL[k] + (k === 1 || k === 3 ? 0.16 : 0.09), { gap: 0.05 }));
  const BIG = 1.7, CEN = [226, 68];
  const flyAt = (k) => (k < 3 ? SL[k + 1] - 0.1 : SL[3] + 0.36), flyDur = (k) => (k < 3 ? 0.09 : 0.18);
  // a 一 stroke for Jade to stand on (nothing appears except by a stroke)
  const ledge = await Hanzi2D.create('一', { size: 64 }); ledge.place(6, 2); ledge.setAll(1); st.add(ledge.group, Z.PLATFORM);
  const ly = ledge.strokeTopAt(0, 40);
  const btnUp = panel(78, 22, 'gold'), btnDn = panel(78, 22, 'dialog');
  st.add(btnUp, Z.PROP); st.add(btnDn, Z.PROP);
  const start = st.add(new TextSprite({ text: 'START', font: 'px', color: PAL.gold, shadow: { dx: 1, dy: -1, color: '#3a2a08' } }, { anchor: 'c' }), Z.TEXT);
  const press = st.add(new TextSprite({ text: 'PRESS', font: 'px', color: PAL.g1 }, { anchor: 'c' }), Z.TEXT);
  const jade = st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR);
  const sub = st.addUI(new Subtitle({ y: 4 }), ZUI.SUBS); sub.position.x = 50; // bottom-right, clear of Jade/START
  const batch = st.add(new Batch(act1Atlas(ctx.lib)), Z.FX);
  const P0 = hz[0].medianAt(0, 0.5); const P = [P0[0], P0[1]]; // dive target: the middle of the first 一 stroke (in its slot)

  return {
    stage: st,
    update(t) {
      // ---------------------------------------------------------------- camera: still, then the dive
      const u = T.span(t, DIVE0, END);
      const zoom = Math.exp(Math.log(26) * Math.pow(u, 2.2));
      const k = 1 - 1 / zoom; // centre slides to the stroke as we dive
      const sh = shake(t, SL, { amp: 2, dur: 0.12 });
      st.cam.set({ x: 160 + (P[0] - 160) * Math.min(1, k * 1.15), y: 90 + (P[1] - 2 - 90) * Math.min(1, k * 1.15), zoom, shake: u > 0 ? [0, 0] : sh });
      bg.cover(st.cam);
      // ---------------------------------------------------------------- taps
      hz.forEach((h, k) => {
        h.apply(t);
        const f = T.span(t, flyAt(k), flyAt(k) + flyDur(k), T.ease.inOut);
        const punch = 1 + 0.18 * Math.max(0, 1 - (t - SL[k]) * 12) * (t >= SL[k] ? 1 : 0);
        const sc = (BIG + (1 - BIG) * f) * punch;
        const slot = [TITLE.xs[k] + 32, y0 + 32];
        const cx = CEN[0] + (slot[0] - CEN[0]) * f, cy = CEN[1] + (slot[1] - CEN[1]) * f;
        h.group.scale.set(sc, sc, 1); h.group.position.set(Math.round(cx - 32 * sc), Math.round(cy - 32 * sc), 0);
        h.group.renderOrder = f < 1 ? Z.TEXT : Z.PLATFORM;
        h.group.traverse((o) => { o.renderOrder = f < 1 ? Z.TEXT : Z.PLATFORM; });
      });
      const kk = T.lastIdx(t, SY); const tapT = kk >= 0 ? SY[kk] : -1;
      const tapping = kk >= 0 && t - T.snap(tapT) < 0.14;
      jade.set({ x: 40, y: ly, anim: tapping ? 'draw_graphite' : 'sing', frame: 0, pencil: true, facing: 1 });
      btnUp.place(84, ly + 6); btnDn.place(84, ly + 5);
      btnUp.visible = !tapping; btnDn.visible = tapping;
      start.place(123, ly + 17 - (tapping ? 1 : 0)); start.set({ color: tapping ? PAL.white : PAL.gold });
      press.place(123, ly + 38); press.visible = Math.floor(t * 3) % 2 === 0 && !tapping;
      batch.begin();
      SL.forEach((e, i) => { sparkle(batch, t, e, 123, ly + 18, { n: 6, r: 16, seed: i + 2, color: PAL.gold }); dust(batch, t, e, CEN[0], CEN[1] - 44, { n: 10, seed: i + 7, spread: 44, dur: 0.3 }); });
      batch.end();
      st.fx.flash = T.exactFrame(t, [SL[3]]) ? 0.6 : T.exactFrame(t, SL.slice(0, 3)) ? 0.3 : 0;
      // ---------------------------------------------------------------- subtitle (translation only: the title is on screen)
      const c = subtitleFor(t, 4, { hold: 0.9 });
      sub.set(u > 0.2 ? null : c);
    },
  };
}
