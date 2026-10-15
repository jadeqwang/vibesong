// OUTRO · 194.06 -> 198.035  back to the pixel title screen (CARTRIDGE): `SAVE COMPLETE`.
//   194.06 synth pulse: the title 一笔一画 redraws in fast true stroke order, now in rainbow (FUNCTIONS) colour
//   pulse beats: SAVE COMPLETE types on, a save bar fills one block per beat
//   196.76 Charlie kneels at his hat (charlie_hat_pull), 197.19 reaches in, 197.62 tag hit: he pulls a cap out of the cap AND
//   a code-drawn cartridge pops out of the hat (arc to apex, held through the micro-silence 197.78-198.03)
//   198.035 final drum tag: CLACK frame (cartridge flashes, shake, sparks), then the stroke wipe to the last screen
import * as T from '../../show/timing.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { PaperBG, Batch, sparkle, dust, shake, freeze } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { TextSprite } from '../../core/text.js';
import { Quad } from '../../core/gfx.js';
import { cartridgeCanvas, texOf } from '../../core/props.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { TITLE, buildTitle, act1Atlas } from '../act1/common.js';

export async function setup(ctx) {
  const P0 = 194.06, HIT = 197.62, SIL = [197.78, 198.03], TAG = 198.035;
  const beats = T.beatsIn(P0 - 0.01, TAG, 1);
  const st = new Stage2D(ctx, { bg: PAL.paper });
  const bg = st.add(new PaperBG(), Z.BG);
  const y0 = 96;
  const { hz } = await buildTitle(st, { y0, pinyin: false, style: 'rainbow' });
  // one character per half beat; 画 completes exactly on beat 3 of the pulse (194.955)
  const B3 = beats[2] ?? 194.955, B2 = beats[1] ?? 194.52;
  const PL = [[P0, P0 + 0.1], [P0 + 0.1, B2], [B2, B2 + 0.1], [B2 + 0.1, B3]];
  hz.forEach((h, k) => h.plan(PL[k][0], PL[k][1], { gap: 0.02 }));
  const ledge = await Hanzi2D.create('一', { size: 200, style: 'graphite' }); ledge.place(58, -90); ledge.setAll(1); st.add(ledge.group, Z.PLATFORM);
  const ly = ledge.strokeTopAt(0, 104);
  const save = st.add(new TextSprite({ text: 'SAVE COMPLETE', font: 'px', color: PAL.gold, outline: PAL.ink, outline8: true, shadow: { dx: 1, dy: -1, color: '#3a2a08' } }, { anchor: 'c' }), Z.TEXT);
  const sub = st.add(new TextSprite({ text: '2011 -> 2026', font: 'px', color: PAL.g1 }, { anchor: 'c' }), Z.TEXT);
  const bar = []; for (let i = 0; i < 8; i++) { const q = st.add(new Quad(null, 9, 6, { color: PAL.g4 }), Z.TEXT); q.place(150 + i * 10, 76); bar.push(q); }
  const heroes = { jade: st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR), charlie: st.add(new Actor(ctx.lib, 'charlie', { name: 'charlie' }), Z.ACTOR), ricky: st.add(new Actor(ctx.lib, 'ricky', { name: 'ricky' }), Z.ACTOR) };
  const cart = st.add(new Quad(texOf(cartridgeCanvas()), 34, 38, { anchor: [17, 0] }), Z.ACTOR_BACK);
  const batch = st.add(new Batch(act1Atlas(ctx.lib)), Z.FX);
  const clackTxt = st.add(new TextSprite({ text: 'CLACK!', font: 'px', color: PAL.white, outline: PAL.ink, outline8: true }, { anchor: 'c' }), Z.HERO);

  return {
    stage: st,
    update(t) {
      const tau = freeze(t, SIL[0], 1e9);   // hold from the micro-silence to the cut
      st.cam.set({ x: 160, y: 90, zoom: 1, shake: shake(t, [HIT, TAG], { amp: 3, dur: 0.15 }) });
      bg.cover(st.cam);
      hz.forEach((h) => h.apply(t));
      // SAVE COMPLETE types on over the first two pulse beats; save bar fills one block per beat
      const nT = Math.round(13 * T.span(t, beats[1] ?? P0 + 0.45, (beats[3] ?? P0 + 1.3)));
      save.set({ reveal: nT }); save.place(190, 89);
      sub.visible = false;
      const filled = T.lastIdx(t, beats.slice(0, 8)) + 1;
      bar.forEach((q, i) => { q.material.setColor(i < filled ? PAL.rainbow[(i * 3) % 12] : PAL.g4); q.place(150 + i * 10, 76); });
      // heroes on the ledge (Jade: hair up, pencils in the bun; Charlie flips the hat on the tag hit)
      const bob = (ph) => Math.round(Math.max(0, Math.sin((T.beatAt(tau) + ph) * Math.PI)) * 1);
      heroes.ricky.set({ x: 222, y: ledge.strokeTopAt(0, 222), anim: 'idle', t: tau, facing: -1 });
      heroes.jade.set({ x: 160, y: ledge.strokeTopAt(0, 160) + bob(0.5), anim: 'idle', t: tau + 0.2, pencil: false, facing: 1 });
      const kneel = t >= T.snap(beats[beats.length - 3] ?? 196.76);
      const pf = t >= T.snap(HIT) ? 2 : t >= T.snap(beats[beats.length - 2] ?? 197.19) ? 1 : 0;
      heroes.charlie.set({ x: 104, y: ledge.strokeTopAt(0, 104), anim: kneel ? 'pull' : 'idle', frame: kneel ? pf : undefined, t: tau, facing: 1 });
      // the cartridge pops out of the hat on the ground (hat ~ x+8, y+4): arc up, held in the micro-silence, CLACK on the tag
      const up = T.span(tau, T.snap(HIT), SIL[0], T.ease.out);
      const clack = T.exactFrame(t, [TAG]) || T.exactFrame(t, [TAG + 1 / 30]);
      cart.visible = t >= T.snap(HIT);
      cart.place(112 + 6 * up, ly + 4 + 40 * up - (clack ? 3 : 0)); cart.setScale(0.45 + 0.4 * up);
      cart.flash = T.exactFrame(t, [TAG]) ? 1 : 0;
      clackTxt.visible = t >= T.snap(TAG) && t < T.snap(TAG) + 0.12; clackTxt.place(62, ly + 60);
      batch.begin();
      sparkle(batch, t, HIT, 112, ly + 12, { n: 8, r: 18, seed: 3, color: PAL.gold });
      sparkle(batch, t, TAG, 118, ly + 52, { n: 12, r: 26, seed: 9, color: PAL.white });
      hz.forEach((h, k) => dust(batch, t, PL[k][1], TITLE.xs[k] + 32, y0 + 20, { n: 5, seed: k + 4, spread: 30, dur: 0.3 }));
      batch.end();
      st.fx.flash = T.exactFrame(t, [P0]) ? 0.5 : T.exactFrame(t, [HIT]) ? 0.35 : 0;
    },
  };
}
