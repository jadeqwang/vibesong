// Dev scene: exercises every core system on one screen (render: node render.js --show dev --stills 2:x.png).
import * as T from '../../show/timing.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { PaperBG, Atlas, Batch, addParticleSprites, dust, CheckerRect } from '../../core/fx.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { Actor } from '../../core/sprites.js';
import { Track } from '../../core/choreo.js';
import { TextSprite, blockText } from '../../core/text.js';
import { Quad, canvasTex } from '../../core/gfx.js';
import { HUD, Subtitle, subtitleFor, DialogueBox, PromptBox, Bubble } from '../../core/ui.js';
import { Pencil } from '../../core/props.js';

export async function setup(ctx) {
  const st = new Stage2D(ctx, { bg: PAL.paper });
  const bg = st.add(new PaperBG(), Z.BG);
  const h = await Hanzi2D.create('笔', { size: 64 }); h.place(20, 60); st.add(h.group, Z.PLATFORM);
  const h2 = await Hanzi2D.create('画', { size: 64, style: 'rainbow' }); h2.place(100, 60); st.add(h2.group, Z.PLATFORM);
  const pencil = st.add(new Pencil({ kind: 'graphite', len: 48 }), Z.FRONT);
  const jade = st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR);
  const tr = new Track({ x: 180, y: 60 }).run(0, 2, 260, { cycle: 'beat' }).jump(2, 2.6, 290, 60, { apex: 20 });
  const hero = st.add(new TextSprite({ text: 'RUN IT!', font: 'px', gradient: ['#ffffff', '#9ec2ff', '#3b7bff', '#2f5fd0'], outline: PAL.navy0, shadow: { dx: 2, dy: -2, color: PAL.navy0 } }, { anchor: 'c' }), Z.HERO);
  const bt = blockText('because', { cell: 3 }); const bq = st.add(new Quad(canvasTex(bt.canvas), bt.w, bt.h), Z.PLATFORM); bq.place(180, 100);
  const chk = st.add(new CheckerRect(4), Z.BACK); chk.setRect(170, 150, 40, 20);
  const atlas = addParticleSprites(new Atlas(256)); const batch = st.add(new Batch(atlas), Z.FX);
  const hud = st.addUI(new HUD(ctx.lib), ZUI.HUD);
  const sub = st.addUI(new Subtitle(), ZUI.SUBS);
  const dlg = new DialogueBox(ctx.lib, { y: 130, h: 44 }); st.addUI(dlg, ZUI.DIALOG);
  const pb = st.addUI(new PromptBox({ x: 200, y: 64, w: 110 }), ZUI.DIALOG);
  const bub = st.add(new Bubble(), Z.TEXT);
  return {
    stage: st,
    update(t) {
      st.cam.set({ x: 160, y: 90, zoom: 1 });
      bg.cover(st.cam);
      h.drawOver(t, 0, 2); const tip = h.tip(); pencil.set({ x: tip.x, y: tip.y, angle: 25, visible: tip.active });
      h2.flood(130, 90, (t % 3) * 30, 6);
      const s = tr.at(t); jade.set({ ...s });
      hero.place(240, 160); hero.setScale(2 + Math.max(0, 0.4 - (t % 1)) * 2);
      batch.begin(); dust(batch, t, 2.6, 290, 60, { seed: 3 }); batch.end();
      hud.set({ singing: { jade: Math.floor(t * 4) % 2 === 0 } });
      sub.set(subtitleFor(28.5 + t, 8));
      dlg.set({ who: 'jade', text: 'I think about stuff I read', reveal: Math.floor(t * 10), talking: Math.floor(t * 8) % 2 === 0 });
      pb.set({ text: 'what do I need?', reveal: Math.floor(t * 8), t });
      bub.set({ text: '说出来', x: 250, y: 112 });
      st.fx.flash = T.exactFrame(t, [1.0]) ? 1 : 0;
    },
  };
}
