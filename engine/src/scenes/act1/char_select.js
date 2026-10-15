// ACT I · 7.183-11.02 · CHARACTER SELECT (808 enters; whistle phrase 2). Lost Vikings party select.
// Cursor hops one portrait per bar (measured 7.183 / 8.894 / 10.563): CHARLIE -> RICKY -> JADE.
// The selected hero plays an ability demo loop in the stage window + bio card (Jade's own wording, show/cast.js).
//   CHARLIE: shield -> parachute -> trampoline -> boomerang -> "???" (a hat pulled out of the hat), one per beat
//   RICKY:   power chord flips a far switch -> a sustained note becomes a light bridge
//   JADE:    graphite draws a block (fixtures) -> every-colour pencil colours it (functions). Hair DOWN (pencils in hand).
import * as T from '../../show/timing.js';
import { Stage2D, Z } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { Batch, sparkle, shake } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { TextSprite } from '../../core/text.js';
import { Quad, canvasTex, pixelCanvas, rect } from '../../core/gfx.js';
import { panel } from '../../core/ui.js';
import { iconCanvas } from '../../core/props.js';
import { CAST, SELECT_ORDER, SAVE_MARQUEE } from '../../show/cast.js';
import { act1Atlas } from './common.js';
import { mulberry32 } from '../../util.js';

function brickWall() {
  return pixelCanvas(320, 180, (g, px) => {
    px(0, 0, '#0e1230', 320, 180); const r = mulberry32(3);
    for (let y = 0; y < 180; y += 10) for (let x = -((y / 10) % 2) * 12; x < 320; x += 24) {
      const c = ['#1b2150', '#20275c', '#181d48', '#232b66'][Math.floor(r() * 4)];
      px(x + 1, y + 1, c, 22, 8); px(x + 1, y + 1, '#2c3474', 22, 1); px(x + 1, y + 8, '#12163a', 22, 1);
      if (r() > 0.7) px(x + 4 + Math.floor(r() * 14), y + 3 + Math.floor(r() * 4), '#2a3170', 2, 1);
    }
  });
}
function bracketCanvas(w, h) {
  return pixelCanvas(w, h, (g, px) => {
    const L = 9, c = PAL.gold, d = '#7a5410';
    for (const [x, y, sx, sy] of [[0, 0, 1, 1], [w - 1, 0, -1, 1], [0, h - 1, 1, -1], [w - 1, h - 1, -1, -1]]) {
      for (let i = 0; i < L; i++) { px(x + sx * i, y, d); px(x, y + sy * i, d); px(x + sx * i, y + sy, c); px(x + sx, y + sy * i, c); px(x + sx * i, y + 2 * sy, c); px(x + 2 * sx, y + sy * i, c); }
    }
  });
}
function flameCanvas(f) {
  return pixelCanvas(10, 16, (g, px) => {
    const o = [0, 1, -1][f];
    px(3 + o, 2, '#ffd23f', 3, 3); px(2, 5, '#ff9a1a', 6, 5); px(3, 4 + f % 2, '#ffd23f', 4, 5); px(4, 6, '#fff3b0', 2, 3); px(1, 10, '#e8344a', 8, 3); px(3, 13, '#7a3a10', 4, 3); px(2 + o, 1, '#ff9a1a', 2, 2);
  });
}

export async function setup(ctx) {
  const C = (k) => T.cue('act1.' + k);
  const HOPS = C('select_hops'), END = C('breathy_syllables')[0];
  const st = new Stage2D(ctx, { bg: '#0e1230' });
  const wall = st.add(new Quad(canvasTex(brickWall()), 320, 180), Z.BG); wall.place(0, 0);
  const flames = [0, 1, 2].map((f) => canvasTex(flameCanvas(f)));
  const torches = [6, 304].map((x) => { const q = st.add(new Quad(flames[0], 10, 16), Z.BACK); q.place(x, 118); return q; });
  for (const x of [4, 302]) { const b = st.add(rect(14, 4, '#7a5410'), Z.BACK); b.place(x, 114); }
  // title
  const tp = st.add(panel(176, 20, 'gold'), Z.PROP); tp.place(72, 158);
  const title = st.add(new TextSprite({ text: 'CHOOSE YOUR PARTY', font: 'px', color: PAL.gold, shadow: { dx: 1, dy: -1, color: '#3a2a08' } }, { anchor: 'c' }), Z.TEXT); title.place(160, 168);
  // cards
  const CX = [62, 160, 258];
  const cards = SELECT_ORDER.map((id, i) => {
    const fr = st.add(panel(70, 70, 'gold'), Z.PROP); fr.place(CX[i] - 35, 80);
    const sp = ctx.lib.get(CAST[id].portrait);
    const p = st.add(new Quad(sp.tex, 32, 32), Z.ACTOR); p.setScale(2); p.place(CX[i] - 32, 83); p.setRect(0, 0, 1 / sp.n, 1);
    const plate = st.add(panel(66, 13, 'dialog'), Z.FRONT); plate.place(CX[i] - 33, 73);
    const name = st.add(new TextSprite({ text: CAST[id].name, font: 'px', color: PAL.white }, { anchor: 'c' }), Z.TEXT); name.place(CX[i], 80);
    return { id, fr, p, sp, name };
  });
  const brackets = st.add(new Quad(canvasTex(bracketCanvas(78, 78)), 78, 78), Z.FX);
  const onep = st.add(new TextSprite({ text: '▼1P', font: 'fp8', color: PAL.gold }, { anchor: 'c' }), Z.TEXT);
  // marquee
  const marq = st.add(new TextSprite({ text: SAVE_MARQUEE, font: 'fp8', color: PAL.termGreen }, { anchor: 'c' }), Z.TEXT); marq.place(160, 66);
  // demo window + bio card
  const dw = st.add(panel(112, 60, 'well'), Z.BACK); dw.place(4, 1);
  const dp = st.add(rect(108, 56, PAL.paper), Z.BACK + 1); dp.place(6, 3);
  const ground = st.add(rect(108, 5, PAL.g1), Z.PLATFORM); ground.place(6, 3);
  const bioP = st.add(panel(200, 60, 'dialog'), Z.BACK); bioP.place(118, 1);
  const bio = st.add(new TextSprite({ text: '', font: 'fp12', color: PAL.white, maxWidth: 186, lineGap: 1 }, { anchor: 'tl' }), Z.TEXT); bio.place(125, 60);
  const note = st.add(new TextSprite({ text: '', font: 'fp10', color: PAL.blueHi, lineGap: 0 }, { anchor: 'tl' }), Z.TEXT); note.place(125, 22);
  const item = st.add(new TextSprite({ text: '', font: 'px', color: PAL.gold }, { anchor: 'bl' }), Z.TEXT); item.place(125, 24);
  const icons = { hat: canvasTex(iconCanvas('hat')), guitar: canvasTex(iconCanvas('guitar')), pg: canvasTex(iconCanvas('pencil_graphite')), pr: canvasTex(iconCanvas('pencil_rainbow')) };
  const ic1 = st.add(new Quad(icons.hat, 14, 14), Z.TEXT), ic2 = st.add(new Quad(icons.pr, 14, 14), Z.TEXT);
  // demo actors / props
  const charlie = st.add(new Actor(ctx.lib, 'charlie'), Z.ACTOR), ricky = st.add(new Actor(ctx.lib, 'ricky'), Z.ACTOR), jade = st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR);
  const prop = st.add(new Quad(null, 1, 1, { anchor: [0, 0] }), Z.PROP);
  const boom = ctx.lib.get('charlie_prop_boomerang');
  const lever = st.add(new Quad(null, 1, 1), Z.PROP);
  const leverOff = canvasTex(pixelCanvas(8, 14, (g, px) => { px(0, 0, PAL.g0, 8, 4); px(1, 1, PAL.g3, 6, 2); px(1, 4, PAL.g1, 2, 9); px(0, 11, PAL.red, 4, 3); }));
  const leverOn = canvasTex(pixelCanvas(8, 14, (g, px) => { px(0, 0, PAL.g0, 8, 4); px(1, 1, PAL.g3, 6, 2); px(5, 4, PAL.g1, 2, 9); px(4, 11, PAL.green, 4, 3); }));
  const q3 = st.add(new TextSprite({ text: '???', font: 'px', color: PAL.ink }, { anchor: 'c' }), Z.TEXT);
  const block = st.add(new Quad(null, 20, 20), Z.PROP);
  const blockG = (n) => canvasTex(pixelCanvas(20, 20, (g, px) => { const L = Math.round(n * 80); for (let i = 0; i < L; i++) { const s = Math.floor(i / 20), k = i % 20; const [x, y] = [[k, 0], [19, k], [19 - k, 19], [0, 19 - k]][s]; px(x, y, PAL.g0); } }));
  const blockTex = [0, 0.25, 0.5, 0.75, 1].map(blockG);
  const blockR = canvasTex(pixelCanvas(20, 20, (g, px) => { px(0, 0, PAL.g0, 20, 20); for (let y = 1; y < 19; y++) for (let x = 1; x < 19; x++) px(x, y, PAL.rainbow[Math.floor((x + y) / 3) % 12]); px(1, 1, '#ffffff', 18, 1); }));
  const atlas = act1Atlas(ctx.lib); const batch = st.add(new Batch(atlas), Z.FX);

  const DEMO_X = 46, GY = 8;
  return {
    stage: st,
    update(t) {
      st.cam.set({ x: 160, y: 90, zoom: 1, shake: shake(t, [HOPS[0]], { amp: 2, dur: 0.12 }) });
      torches.forEach((q, i) => q.material.setMap(flames[(Math.floor(t * 10) + i) % 3]));
      const sel = Math.max(0, T.lastIdx(t, HOPS)); const hopT = HOPS[sel];
      st.fx.flash = T.exactFrame(t, [HOPS[0]]) ? 0.9 : 0;
      // cursor: slides over 3 frames from the previous card
      const u = T.span(t, T.snap(hopT), T.snap(hopT) + 0.1, T.ease.out);
      const bx = sel === 0 ? CX[0] : CX[sel - 1] + (CX[sel] - CX[sel - 1]) * u;
      const blink = Math.floor((t - hopT) * 6) % 2 === 0 || t - hopT < 0.3;
      brackets.visible = blink; brackets.place(bx - 39, 76);
      onep.place(bx, 155);
      cards.forEach((c, i) => {
        const on = i === sel;
        c.p.material.setColor(on ? 0xffffff : 0x6a6f8a); c.p.flash = on && T.exactFrame(t, [hopT]) ? 0.8 : 0;
        c.p.setRect((on && t - hopT < 0.35 ? 1 : 0) / c.sp.n, 0, 1 / c.sp.n, 1);
        c.name.set({ color: on ? PAL.gold : '#8a90b0' });
      });
      marq.visible = Math.floor(t * 2.5) % 4 !== 3;
      // bio card (typed on after each hop)
      const id = SELECT_ORDER[sel], cast = CAST[id];
      const bioText = cast.bio.join(' · ');
      bio.set({ text: bioText, reveal: Math.floor(T.span(t, hopT, hopT + 0.3) * bioText.length + 0.5) });
      note.set({ text: cast.note ? cast.note.join('\n') : '' }); note.visible = !!cast.note && t > hopT + 0.15;
      const itemText = 'ITEM: ' + cast.item;
      item.set({ text: itemText }); item.visible = t > hopT + 0.2;
      ic1.visible = ic2.visible = item.visible; ic1.place(125 + item.w + 4, 21);
      if (id === 'charlie') { ic1.material.setMap(icons.hat); ic2.visible = false; }
      if (id === 'ricky') { ic1.material.setMap(icons.guitar); ic2.visible = false; }
      if (id === 'jade') { ic1.material.setMap(icons.pg); ic2.material.setMap(icons.pr); ic2.place(125 + item.w + 18, 21); }
      // ---------------------------------------------------------------- ability demos
      charlie.visible = ricky.visible = jade.visible = false; prop.visible = lever.visible = q3.visible = block.visible = false;
      batch.begin();
      if (id === 'charlie') {
        const B = [hopT, T.beat(17), T.beat(18), T.beat(19), T.beat(19.5)]; const k = T.lastIdx(t, B); const lt = t - B[Math.max(0, k)];
        if (k <= 0) charlie.set({ x: DEMO_X, y: GY, anim: 'shield', t: lt });
        else if (k === 1) charlie.set({ x: DEMO_X, y: GY + Math.round(36 * (1 - T.span(lt, 0, 0.4, T.ease.out))), anim: 'parachute', t: lt });
        else if (k === 2) {
          const sp = ctx.lib.get('charlie_prop_trampoline'); prop.visible = true; prop.material.setMap(sp.tex); prop.anchor = [29, 0]; prop.setSize(58, 30);
          const ph = (lt % 0.21) / 0.21; const squash = ph < 0.2; prop.setRect((squash ? 1 : 0) / 3, 0, 1 / 3, 1); prop.place(DEMO_X + 20, GY);
          charlie.set({ x: DEMO_X + 20, y: GY + 12 + Math.round(26 * 4 * ph * (1 - ph)), anim: 'jump', frame: ph < 0.5 ? 0 : 1 });
        } else if (k === 3) {
          charlie.set({ x: DEMO_X - 14, y: GY, anim: 'throw', frame: lt < 0.06 ? 0 : 1 });
          const a = Math.min(1, lt / 0.2); const x = DEMO_X - 4 + 60 * Math.sin(Math.PI * a); prop.visible = true; prop.material.setMap(boom.tex); prop.anchor = [23, 14]; prop.setSize(46, 28);
          prop.setRect((Math.floor(lt * 24) % 4) / 4, 0, 1 / 4, 1); prop.place(x, GY + 26);
        } else {
          charlie.set({ x: DEMO_X - 10, y: GY, anim: 'pull', t: lt });
          const sp = ctx.lib.get('charlie_prop_hat_stack'); prop.visible = true; prop.material.setMap(sp.tex); prop.anchor = [24, 0]; prop.setSize(48, 44); prop.setRect(0, 0, 1, 1); prop.place(DEMO_X + 34, GY);
          q3.visible = true; q3.place(DEMO_X + 34, GY + 48);
        }
      } else if (id === 'ricky') {
        const sus = T.beat(22); const lt = t - hopT;
        lever.visible = true; lever.setSize(8, 14); lever.place(104, GY); lever.material.setMap(t >= hopT + 0.16 ? leverOn : leverOff);
        if (t < sus) {
          ricky.set({ x: 30, y: GY, anim: 'chord', frame: lt < 0.25 ? 1 : 0 });
          if (lt < 0.16) batch.draw('arc' + 12, 56 + lt * 300, GY + 22);
          sparkle(batch, t, hopT + 0.16, 106, GY + 12, { n: 6, r: 10, color: PAL.yellow });
        } else {
          ricky.set({ x: 30, y: GY, anim: 'sustain', t: t - sus });
          const n = Math.floor(T.span(t, sus, sus + 0.5) * 8);
          for (let i = 0; i < n; i++) batch.draw('px2', 56 + i * 6, GY + 14 + Math.round(2 * Math.sin(t * 20 + i)), { solid: i % 2 ? '#7cc4ff' : '#ffffff', sx: 3, sy: 1 });
        }
      } else {
        const g2 = hopT + 0.24; const drawing = t < g2;
        jade.set({ x: DEMO_X - 10, y: GY, anim: drawing ? 'draw_graphite' : 'draw_rainbow', pencil: true, t: t - hopT });
        block.visible = true; block.place(86, GY + 10);
        block.material.setMap(drawing ? blockTex[Math.min(4, Math.floor(T.span(t, hopT, g2) * 5))] : blockR);
        if (!drawing) sparkle(batch, t, g2, 96, GY + 20, { n: 8, r: 14 });
      }
      batch.end();
    },
  };
}
