// ACT I · 4.19-7.183 · "PAINT IT, RUN IT, SHIP IT!" — one word per beat (measured: 4.19 4.617 5.045 5.472 5.9 6.328),
// drum stabs (4.395 5.04 5.89 6.745) = 1-frame white flash + type punch. Hero type in the UI layer (crisp).
//  A 4.19  PAINT / 4.617 IT : push-in on 画; Jade pulls the BLUE-cap pencil from her bun (hair comes DOWN) and a
//          rainbow flood colours 画 (the only colour in the drafted world). Gloss stays readable at the bottom.
//  B 5.045 RUN / 5.472 IT  : Ricky's power chord fires a shockwave that slams a giant ▶ switch on.
//  C 5.9 SHIP / 6.328 IT    : Charlie flips his hat; a cartridge drops out of it and clacks into the console (LED on).
// Each word's Chinese (CHANT_ZH_PARTS, locked) sits directly under its hero type (words are in-world: no top line).
import * as T from '../../show/timing.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { PaperBG, SunburstBG, Batch, dust, debris, sparkle, shake } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { TextSprite } from '../../core/text.js';
import { Quad, canvasTex } from '../../core/gfx.js';
import { cartridgeCanvas, consoleCanvas, playSwitchCanvas } from '../../core/props.js';
import { TITLE, buildTitle, act1Atlas, floorColumn, arcCanvas } from './common.js';
import { CHANT_ZH_PARTS } from '../../show/subtitles.js';

const STAMP = [1.35, 1.15, 1.04, 1.0];
const PUNCH = [1.14, 1.05, 1.0];
function stampScale(t, on, stabs, base) {
  const k = Math.floor((t - T.snap(on)) * T.fps() + 1e-6); if (k < 0) return 0;
  let s = STAMP[Math.min(k, 3)];
  for (const e of stabs) { const j = Math.floor((t - T.snap(e)) * T.fps() + 1e-6); if (j >= 0 && j < 3 && T.snap(e) > T.snap(on)) s *= PUNCH[j]; }
  return s * base;
}
const heroSpec = (text, colors, outline = PAL.ink) => ({ text, font: 'px', charColor: colors, outline, outline8: true, shadow: { dx: 1, dy: -1, color: outline } });

export async function setup(ctx) {
  const C = (k) => T.cue('act1.' + k);
  const W = C('chant_words'), STABS = C('chant_stabs'), END = C('bar5_hit');
  const tA = W[0], tB = W[2], tC = W[4];
  const st = new Stage2D(ctx, { bg: PAL.paper });
  const paper = st.add(new PaperBG(), Z.BG);
  const burst = st.add(new SunburstBG({ a: PAL.paperHi, b: '#cfe6ff', rays: 16 }), Z.BG2);
  const atlas = act1Atlas(ctx.lib);
  const batch = st.add(new Batch(atlas), Z.FX);

  // ---------------------------------------------------------------- A: the title world, 画 floods with colour
  const y0 = TITLE.y0;
  const { hz, py } = await buildTitle(st, { y0 });
  const hua = hz[3]; hua.setAll(1); hz.forEach((h) => h.setAll(1));
  const b0 = hua.strokeBox(0), jx = Math.round((b0.x0 + b0.x1) / 2) + 2, jy = hua.strokeTopAt(0, jx);
  const jade = st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR);
  const gloss = st.addUI(new TextSprite({ spans: [{ text: '"stroke by stroke"', color: PAL.capBlueLo }, { text: ': how every kid learns\nto write Chinese. And how you vibe code.', color: PAL.g0 }], font: 'fp12', align: 'center', lineGap: 3 }, { anchor: 'bc' }), ZUI.SUBS);
  // ---------------------------------------------------------------- B/C: title-card stage (ground strip at the bottom)
  const floorTex = canvasTex(floorColumn(30));
  const floor = []; for (let i = 0; i < 22; i++) { const q = st.add(new Quad(floorTex, 16, 30), Z.PLATFORM); q.place(i * 16 - 8, 0); floor.push(q); }
  const ricky = st.add(new Actor(ctx.lib, 'ricky'), Z.ACTOR);
  const charlie = st.add(new Actor(ctx.lib, 'charlie'), Z.ACTOR);
  const swOff = canvasTex(playSwitchCanvas(false)), swOn = canvasTex(playSwitchCanvas(true));
  const sw = st.add(new Quad(swOff, 44, 52, { anchor: [22, 0] }), Z.PROP);
  const consoleOff = canvasTex(consoleCanvas(false)), consoleOn = canvasTex(consoleCanvas(true));
  const cons = st.add(new Quad(consoleOff, 80, 34, { anchor: [40, 0] }), Z.PROP);
  const cart = st.add(new Quad(canvasTex(cartridgeCanvas()), 34, 38, { anchor: [17, 0] }), Z.PROP - 1);
  const hatSp = ctx.lib.get('charlie_hat_boomerang');
  const hat = st.add(new Quad(hatSp.tex, 16, 16, { anchor: [8, 8] }), Z.ACTOR_FRONT);

  // ---------------------------------------------------------------- hero type (UI) + translations under it
  const RB = (i) => PAL.rainbow[(i * 2) % 12];
  const words = [
    { s: new TextSprite(heroSpec('PAINT', RB), { anchor: 'c' }), on: W[0] }, { s: new TextSprite(heroSpec('IT', (i) => RB(i + 5)), { anchor: 'c' }), on: W[1] },
    { s: new TextSprite(heroSpec('RUN', () => PAL.white), { anchor: 'c' }), on: W[2] }, { s: new TextSprite(heroSpec('IT!', () => PAL.white), { anchor: 'c' }), on: W[3] },
    { s: new TextSprite(heroSpec('SHIP', () => PAL.yellow), { anchor: 'c' }), on: W[4] }, { s: new TextSprite(heroSpec('IT!', () => PAL.yellow), { anchor: 'c' }), on: W[5] },
  ];
  words[2].s.set({ gradient: ['#ffffff', '#cfe6ff', '#7cc4ff', '#3b7bff'], charColor: undefined });
  words[3].s.set({ gradient: ['#ffffff', '#cfe6ff', '#7cc4ff', '#3b7bff'], charColor: undefined });
  words[4].s.set({ gradient: ['#fff3b0', '#ffd23f', '#ffb02e', '#ff7a1a'], charColor: undefined });
  words[5].s.set({ gradient: ['#fff3b0', '#ffd23f', '#ffb02e', '#ff7a1a'], charColor: undefined });
  for (const w of words) st.addUI(w.s, ZUI.BANNER);
  const zh = CHANT_ZH_PARTS.map((p) => st.addUI(new TextSprite({ text: p.replace(/[，！]$/, ''), font: 'fp12', color: PAL.white, outline: PAL.ink, outline8: true }, { anchor: 'c' }), ZUI.SUBS));
  zh.forEach((z) => z.setScale(2));

  return {
    stage: st,
    update(t) {
      const shot = t < T.snap(tB) ? 'A' : t < T.snap(tC) ? 'B' : 'C';
      const flashOn = T.exactFrame(t, STABS);
      st.fx.flash = flashOn ? 0.9 : 0;
      // visibility per shot
      const A = shot === 'A', B = shot === 'B', Cc = shot === 'C';
      hz.forEach((h, k) => (h.group.visible = A && k === 3)); py.forEach((p) => (p.visible = false)); gloss.visible = A; paper.visible = A; // room for PAINT IT: only 画 in the close shot
      burst.visible = !A; floor.forEach((q) => (q.visible = !A));
      jade.visible = A; ricky.visible = B; sw.visible = B; charlie.visible = Cc; cons.visible = Cc; cart.visible = false; hat.visible = false;
      batch.begin();
      if (A) {
        // push-in on 画 (1 -> 1.5) and the flood
        // hard cut to the close framing on the beat: 画 + Jade on the right, hero type on the left, gloss below
        st.cam.set({ x: 218, y: 111, zoom: 1.4, shake: shake(t, [STABS[0]], { amp: 1, dur: 0.12 }) });
        paper.cover(st.cam);
        const pulled = t >= tA + 0.09;
        jade.set({ x: jx, y: jy, anim: pulled ? 'draw_rainbow' : 'idle', t: t - tA, pencil: pulled, facing: -1 });
        if (!pulled) sparkle(batch, t, tA, jx, jy + 40, { n: 4, r: 6 });
        sparkle(batch, t, tA + 0.09, jx + 2, jy + 38, { n: 6, r: 12, color: PAL.capBlue });
        const r = 90 * T.span(t, STABS[0], STABS[0] + 0.35, T.ease.out);
        hua.flood(jx - 20, jy + 2, r, 7);
        if (r > 0) sparkle(batch, t, STABS[0], jx - 20, jy, { n: 10, r: 40, dur: 0.6 });
        gloss.place(160, 6);
      } else if (B) {
        st.cam.set({ x: 150, y: 64, zoom: 1.5, shake: shake(t, [STABS[1], W[3]], { amp: 2, dur: 0.15 }) });
        burst.cover(st.cam); burst.u.uC.value.set(228, 50); burst.u.uRot.value = -(t - tB) * 0.6;
        const fire = t < tB + 0.22;
        ricky.set({ x: 58, y: 30, anim: 'chord', frame: fire ? 1 : 0 });
        const hitT = tB + 0.3;
        // shockwave rings travelling to the switch
        for (let k = 0; k < 14; k++) {
          const born = tB + k * 0.03; const age = t - born; if (age < 0) continue;
          const x = 92 + age * 440; if (x > 214 || age > 0.5) continue;
          const r = [8, 12, 16, 20, 24][Math.min(4, Math.floor(age * 12))];
          batch.draw('arc' + r, x, 52);
        }
        const on = t >= hitT; sw.material.setMap(on ? swOn : swOff); sw.place(228, 30);
        sw.material.uniforms.flash.value = T.exactFrame(t, [hitT, W[3]]) ? 1 : 0;
        debris(batch, t, hitT, 210, 54, { n: 14, seed: 4, vx: [-120, 60], vy: [40, 160], dur: 0.7, floor: 30 });
        sparkle(batch, t, W[3], 228, 52, { n: 10, r: 26, color: PAL.white });
      } else {
        st.cam.set({ x: 150, y: 64, zoom: 1.5, shake: shake(t, [W[5]], { amp: 2, dur: 0.15 }) });
        burst.cover(st.cam); burst.u.uC.value.set(210, 60); burst.u.uRot.value = (t - tC) * 0.5; burst.u.uB.value.set('#ffe0b8');
        // Charlie flips the hat: it spins up over the console, the cartridge drops out and clacks in on "IT"
        const throwing = t < tC + 0.16;
        charlie.set({ x: 76, y: 30, anim: throwing ? 'throw' : 'idle', t: t - tC, frame: throwing ? (t < tC + 0.06 ? 0 : 1) : undefined });
        const u = T.span(t, tC + 0.05, tC + 0.30), back = T.span(t, tC + 0.62, tC + 0.95);
        if (t > tC + 0.05 && back < 1) {
          hat.visible = true;
          const hx = back > 0 ? 210 + (80 - 210) * back : 86 + (210 - 86) * u, hy = back > 0 ? 100 + (76 - 100) * back + 14 * Math.sin(Math.PI * back) : 70 + (100 - 70) * u + 22 * Math.sin(Math.PI * u);
          hat.setRect(Math.floor(t * 18) % 3 / 3, 0, 1 / 3, 1); hat.place(hx, hy);
        }
        const clack = W[5];
        const drop = T.span(t, tC + 0.3, clack, T.ease.inQuad);
        if (t >= tC + 0.28) { cart.visible = true; cart.place(210, 92 + (46 - 92) * drop); }
        cons.material.setMap(t >= clack ? consoleOn : consoleOff); cons.place(210, 30);
        if (t >= clack) cart.place(210, 46);
        dust(batch, t, clack, 210, 52, { n: 6, seed: 9, spread: 22 });
        sparkle(batch, t, STABS[3], 210, 90, { n: 12, r: 34, dur: 0.6, color: PAL.yellow });
        sparkle(batch, t, clack, 200, 70, { n: 6, r: 16, color: PAL.white });
      }
      batch.end();
      // hero type: A on the left of 画, B/C centred at the top
      const lay = { 0: [88, 152], 1: [88, 120], 2: [100, 156], 3: [222, 156], 4: [98, 156], 5: [228, 156] };
      words.forEach((w, i) => {
        const inShot = (i < 2 && A) || (i >= 2 && i < 4 && B) || (i >= 4 && Cc);
        const sc = inShot ? stampScale(t, w.on, STABS, i < 2 ? 3 : 4) : 0;
        w.s.visible = sc > 0; if (sc > 0) { w.s.setScale(sc); w.s.place(...lay[i]); }
      });
      const zi = A ? 0 : B ? 1 : 2; zh.forEach((z, i) => { z.visible = i === zi; });
      zh[0].place(88, 90); zh[1].place(160, 124); zh[2].place(160, 124);
    },
  };
}
