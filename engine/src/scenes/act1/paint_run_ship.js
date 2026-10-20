// ACT I · 4.19-7.183 · "PAINT IT, RUN IT, SHIP IT!" = the class tutorial: ONE causal chain, the party grammar
// (game-design pass 2026-10-15): Jade paints it -> Ricky runs it -> Charlie ships it.
// One word per beat (measured: 4.19 4.617 5.045 5.472 5.9 6.328), drum stabs (4.395 5.04 5.89 6.745) = 1-frame white
// flash + type punch. Hero type in the UI layer (crisp); each word's stamp carries its hero's colour
// (PAINT rainbow / RUN Ricky blue-white / SHIP Charlie hat-beige).
//  A 4.19  PAINT / 4.617 IT : push-in on 画; Jade pulls the BLUE-cap pencil (hair comes DOWN) and a rainbow flood
//          colours the gray 画 (the only colour in the drafted world). Gloss stays readable at the bottom.
//  B 5.045 RUN / 5.472 IT   : the coloured 画 sits on the stage. Ricky's power chord shockwave crosses the screen and
//          CLICKS the ▶ switch; the 画 starts RUNNING: it bobs on the beat, a highlight runs through its strokes in
//          stroke order (executing), flowers pop out of it. Colour + sound = running code.
//  C 5.9 SHIP / 6.328 IT    : Charlie throws his hat over the running 画, it SWALLOWS it, flies on over the console and
//          drops a cartridge with 画 on the label that clacks in on "IT!" (LED on). SHIPPED stamp.
// Each word's Chinese (CHANT_ZH_PARTS, locked) sits directly under its hero type (words are in-world: no top line).
import * as T from '../../show/timing.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { PaperBG, SunburstBG, Batch, dust, debris, sparkle, shake } from '../../core/fx.js';
import { Actor } from '../../core/sprites.js';
import { TextSprite, raster } from '../../core/text.js';
import { Quad, canvasTex } from '../../core/gfx.js';
import { cartridgeCanvas, consoleCanvas, playSwitchCanvas } from '../../core/props.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { pixelCanvas } from '../../core/gfx.js';
import { TITLE, buildTitle, act1Atlas, floorColumn, arcCanvas } from './common.js';
import { CHANT_ZH_PARTS } from '../../show/subtitles.js';

// (v47 intro) Jade 10-19: "0:04 during paint it! run it! ship it! maybe we can find a way to introduce Jade, Ricky, and Charlie,
// since we no longer have character intro screens any more". One name tag per hero, landing on that hero's word, bottom-left
// (A: in the free band between 画出来 and the gloss; B/C: on the floor strip under the hero). Copy is shared by both variants.
//   null    = v4.6 (no tags)
//   'plate' = fighting-game name plate: ink slab + hero-colour top stripe + P1/P2/P3 chip + NAME (in its word's colours) + one line;
//             slams in from the left on the hero's word, flashes on the second word
//   'card'  = JRPG party card in the SAVE FILE FOUND screen's language (navy, gold frame, the HUD pixel portrait, cream name, teal line);
//             slams in from the left on the word (same move as the plate); the portrait shouts each chant word (mouth frame); Jade's portrait lets the
//             hair down on the same frame her sprite pulls the pencil (hair rule)
export const INTRO_V47 = 'plate';
const INTRO_COPY = [
  { id: 'jade', p: 'P1', name: 'JADE', line: 'vocals · paints the world' },
  { id: 'ricky', p: 'P2', name: 'RICKY', line: 'electric guitar' },
  { id: 'charlie', p: 'P3', name: 'CHARLIE', line: 'wrote this song in 2011' },
];
const STAMP = [1.35, 1.15, 1.04, 1.0];
const PUNCH = [1.14, 1.05, 1.0];
function stampScale(t, on, stabs, base) {
  const k = Math.floor((t - T.snap(on)) * T.fps() + 1e-6); if (k < 0) return 0;
  let s = STAMP[Math.min(k, 3)];
  for (const e of stabs) { const j = Math.floor((t - T.snap(e)) * T.fps() + 1e-6); if (j >= 0 && j < 3 && T.snap(e) > T.snap(on)) s *= PUNCH[j]; }
  return s * base;
}
const heroSpec = (text, colors, outline = PAL.ink) => ({ text, font: 'px', charColor: colors, outline, outline8: true, shadow: { dx: 1, dy: -1, color: outline } });

// ---------------------------------------------------------------- (v47 intro) name tags, built once as canvases
const RICKY_GRAD = ['#ffffff', '#cfe6ff', '#7cc4ff', '#3b7bff'], CHARLIE_GRAD = ['#fff4dc', '#ecd3a4', '#cfa96c', '#a07848'];
const INTRO_NAME = {   // the name in its word's colours (PAINT rainbow / RUN blue-white / SHIP hat-beige)
  jade: { charColor: (i) => PAL.rainbow[(i * 3 + 1) % 12] }, ricky: { gradient: RICKY_GRAD }, charlie: { gradient: CHARLIE_GRAD },
};
const INTRO_ACCENT = { jade: null, ricky: '#4f9cff', charlie: '#cfa96c' };   // null = the rainbow stripe (her FUNCTIONS pencil)
function x2(g, cv, x, y) { g.drawImage(cv, 0, 0, cv.width, cv.height, x, y, cv.width * 2, cv.height * 2); }
function introPlate(c) {
  const name = raster({ text: c.name, font: 'px', ...INTRO_NAME[c.id], shadow: { dx: 1, dy: -1, color: '#000000' } }), line = raster({ text: c.line, font: 'fp12', color: '#ece6d6' });
  const chip = raster({ text: c.p, font: 'px', color: PAL.ink });
  const NX = 30, W = Math.max(NX + name.w * 2, NX + line.w) + 14, H = 36;
  const acc = (x) => INTRO_ACCENT[c.id] || PAL.rainbow[Math.floor(x / 6) % 12];
  return pixelCanvas(W, H, (g, px) => {
    for (let y = 0; y < H; y++) { const xr = W - 1 - Math.floor((H - 1 - y) / 3); px(0, y, y < 3 ? '#000000' : '#15171f', xr + 1, 1); }
    for (let x = 0; x < W - 12; x++) px(x, 0, acc(x), 1, 3);                      // hero-colour stripe on top
    px(0, H - 1, '#3b3f52', W - 1, 1);
    px(4, 7, acc(4), 22, 13); px(4, 7, '#ffffff', 22, 1); px(4, 19, '#00000055', 22, 1);   // P chip
    g.drawImage(chip.canvas, 4 + Math.floor((22 - chip.w) / 2), 8 + Math.floor((12 - chip.h) / 2));
    x2(g, name.canvas, NX, 4);
    g.drawImage(line.canvas, NX + 1, Math.min(H - line.h - 1, 4 + name.h * 2 + 1));
  });
}
function introCard(c, portrait, frame) {
  const name = raster({ text: c.name, font: 'px', color: '#f9f4d8', shadow: { dx: 1, dy: -1, color: '#05091c' } }), line = raster({ text: c.line, font: 'fp12', color: '#8fe3b6' });
  const NX = 41, W = Math.max(NX + name.w * 2, NX + line.w) + 7, H = 38;
  return pixelCanvas(W, H, (g, px) => {
    px(0, 0, '#fed25a', W, H); px(1, 1, '#0e1e46', W - 2, H - 2); px(1, H - 2, '#08122e', W - 2, 1);   // save-screen panel: gold rim, navy
    px(2, 2, '#cfa52c', 34, 34); px(3, 3, '#1d2030', 32, 32);                                       // portrait well (gold frame)
    g.drawImage(portrait.img, frame * 32, 0, 32, 32, 3, 3, 32, 32);
    x2(g, name.canvas, NX, 4);
    g.drawImage(line.canvas, NX, Math.min(H - line.h - 2, 4 + name.h * 2 + 2));
  });
}

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
  hat.userData.cs = 1;   // (v44 open) Charlie's hat is hero gear: exempt from the pre-flood graphite grade (Jade 10-19: "0:06 charlie's hat is grey here")
  // the coloured 画 on the stage (B: it runs; C: the hat swallows it)
  const HS = 64, HX = 140, HY = 31;
  const run = await Hanzi2D.create('画', { size: HS, style: 'rainbow', shadowColor: '#c9b48a' }); run.place(HX, HY); run.setAll(1); st.add(run.group, Z.PROP + 1);
  // cartridge with 画 on the label (code-painted label over the stock cartridge)
  const cartCv = cartridgeCanvas(); { const g = cartCv.getContext('2d'); g.fillStyle = PAL.paperHi; g.fillRect(5, 13, 24, 17); }
  const cartQ = cart; cartQ.material.setMap(canvasTex(cartCv));
  const label = st.add(new TextSprite({ text: '画', font: 'fp12', color: PAL.ink }, { anchor: 'c' }), Z.PROP);
  const shipped = st.addUI(new TextSprite({ text: 'SHIPPED', font: 'px', color: PAL.termGreen, outline: PAL.ink, outline8: true }, { anchor: 'c' }), ZUI.TOP);

  // ---------------------------------------------------------------- hero type (UI) + translations under it
  const RB = (i) => PAL.rainbow[(i * 2) % 12];
  const words = [
    { s: new TextSprite(heroSpec('PAINT', RB), { anchor: 'c' }), on: W[0] }, { s: new TextSprite(heroSpec('IT', (i) => RB(i + 5)), { anchor: 'c' }), on: W[1] },
    { s: new TextSprite(heroSpec('RUN', () => PAL.white), { anchor: 'c' }), on: W[2] }, { s: new TextSprite(heroSpec('IT!', () => PAL.white), { anchor: 'c' }), on: W[3] },
    { s: new TextSprite(heroSpec('SHIP', () => PAL.yellow), { anchor: 'c' }), on: W[4] }, { s: new TextSprite(heroSpec('IT!', () => PAL.yellow), { anchor: 'c' }), on: W[5] },
  ];
  words[2].s.set({ gradient: ['#ffffff', '#cfe6ff', '#7cc4ff', '#3b7bff'], charColor: undefined });
  words[3].s.set({ gradient: ['#ffffff', '#cfe6ff', '#7cc4ff', '#3b7bff'], charColor: undefined });
  const BEIGE = ['#fff4dc', '#ecd3a4', '#cfa96c', '#a07848'];   // Charlie's hat
  words[4].s.set({ gradient: BEIGE, charColor: undefined, outline: '#3a2a14', shadow: { dx: 1, dy: -1, color: '#3a2a14' } });
  words[5].s.set({ gradient: BEIGE, charColor: undefined, outline: '#3a2a14', shadow: { dx: 1, dy: -1, color: '#3a2a14' } });
  for (const w of words) st.addUI(w.s, ZUI.BANNER);
  const zh = CHANT_ZH_PARTS.map((p) => st.addUI(new TextSprite({ text: p.replace(/[，！]$/, ''), font: 'fp12', color: PAL.white, outline: PAL.ink, outline8: true }, { anchor: 'c' }), ZUI.SUBS));
  zh.forEach((z) => z.setScale(2));
  // (v47 intro) one tag per shot (A Jade, B Ricky, C Charlie); 'card' swaps textures for the mouth / Jade's hair
  const tags = [];
  if (INTRO_V47) {
    const P = { jade: 'portrait_jade', ricky: 'portrait_ricky', charlie: 'portrait_charlie' };
    if (INTRO_V47 === 'card') await ctx.lib.preload(['portrait_jade', 'portrait_jade_hairdown', 'portrait_ricky', 'portrait_charlie'].filter((n) => ctx.lib.has(n)));
    for (const c of INTRO_COPY) {
      let tex;
      if (INTRO_V47 === 'card') {
        const mk = (name) => { const sp = ctx.lib.get(name); return [0, 1].map((f) => canvasTex(introCard(c, sp, Math.min(f, sp.n - 1)))); };
        tex = { up: mk(P[c.id]) }; if (c.id === 'jade') tex.down = mk(ctx.lib.has('portrait_jade_hairdown') ? 'portrait_jade_hairdown' : P.jade);
      } else tex = { up: [canvasTex(introPlate(c))] };
      const img = tex.up[0].image, q = st.addUI(new Quad(tex.up[0], img.width, img.height), ZUI.BANNER);
      q.userData.cs = 1;   // hero ID card = hero colour (like the heroes and Charlie's hat): exempt from the pre-flood graphite grade
      tags.push({ q, tex });
    }
  }

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
      run.group.visible = B || Cc; label.visible = false; shipped.visible = false;
      for (let i = 0; i < run.n; i++) run.setHi(i, 0);
      run.group.scale.set(1, 1, 1);
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
        // RUN: chord -> shockwave crosses -> CLICKS ▶ -> the coloured 画 runs (bob, stroke-order highlight, flowers)
        st.cam.set({ x: 128, y: 64, zoom: 1.5, shake: shake(t, [STABS[1], W[3]], { amp: 2, dur: 0.15 }) });
        burst.cover(st.cam); burst.u.uC.value.set(172, 60); burst.u.uRot.value = -(t - tB) * 0.6;
        const fire = t < tB + 0.2;
        ricky.set({ x: 40, y: 30, anim: 'chord', frame: fire ? 1 : 0 });
        const hitT = T.snap(tB + 0.17);
        for (let k = 0; k < 10; k++) {
          const born = tB + k * 0.025; const age = t - born; if (age < 0) continue;
          const x = 70 + age * 260; if (x > 98 || age > 0.4) continue;
          batch.draw('arc' + [8, 12, 16, 20, 24][Math.min(4, Math.floor(age * 16))], x, 52);
        }
        const on = t >= hitT; sw.material.setMap(on ? swOn : swOff); sw.place(112, 30);
        sw.material.uniforms.flash.value = T.exactFrame(t, [hitT]) ? 1 : 0;
        if (on) sparkle(batch, t, hitT, 112, 52, { n: 8, r: 16, color: PAL.white });
        // running: bob on the 8ths, a highlight sweeps the strokes in stroke order, flowers pop out
        const bob = on ? T.beatPulse(t, 2, 0.1) : 0;
        run.place(HX, HY + Math.round(4 * bob)); run.u.uHueShift.value = on ? (t - hitT) * 1.5 : 0;
        if (on) { const k = Math.floor((t - hitT) * 22) % run.n; for (let i = 0; i < run.n; i++) run.setHi(i, i === k ? 0.85 : 0); }
        for (let i = 0; i < 6; i++) {
          const born = T.snap(hitT + 0.05 + i * 0.07); const age = t - born; if (age < 0) continue;
          const dir = i % 2 ? 1 : -1, x = HX + 32 + dir * (14 + 10 * (i >> 1)) * Math.min(1, age * 4), y = HY + 40 + 70 * age - 160 * age * age;
          if (y > 30) batch.draw(`flower${i % 6}_${Math.min(4, Math.floor(age * 30))}`, x, y);
        }
      } else {
        // SHIP: the hat flies over the running 画, swallows it, carries it to the console, the 画 cartridge clacks in
        st.cam.set({ x: 150, y: 64, zoom: 1.5, shake: shake(t, [W[5]], { amp: 2, dur: 0.15 }) });
        burst.cover(st.cam); burst.u.uC.value.set(200, 60); burst.u.uRot.value = (t - tC) * 0.5; burst.u.uB.value.set('#ffe0b8');
        const throwing = t < tC + 0.14;
        charlie.set({ x: 62, y: 30, anim: throwing ? 'throw' : 'idle', t: t - tC, frame: throwing ? (t < tC + 0.05 ? 0 : 1) : undefined });
        const CX2 = 96, KX = 220;
        const clack = W[5], over = T.snap(tC + 0.12), gulp = T.snap(tC + 0.2), drop0 = T.snap(tC + 0.27);
        // the 画 keeps running until the hat lands on it, then shrinks into the hat
        const sw2 = T.span(t, over, gulp, T.ease.inQuad);
        run.group.visible = t < gulp; run.u.uHueShift.value = (t - tB) * 1.5;
        if (t < gulp) { const sc = 1 - 0.85 * sw2; run.group.scale.set(sc, sc, 1); run.place(CX2 + 32 * (1 - sc), HY + Math.round(4 * T.beatPulse(t, 2, 0.1)) + 40 * sw2 * 0.6); }
        // hat path: Charlie -> over 画 (big, mouth down) -> above the console -> back
        const P = [[74, 64], [CX2 + 32, HY + 60], [KX, 100], [70, 76]];
        let hx, hy, hs = 1;
        if (t < over) { const u = T.span(t, tC + 0.03, over); hx = P[0][0] + (P[1][0] - P[0][0]) * u; hy = P[0][1] + (P[1][1] - P[0][1]) * u + 20 * Math.sin(Math.PI * u); hs = 1 + 2 * u; }
        else if (t < gulp) { hx = P[1][0]; hy = P[1][1] - 18 * sw2; hs = 3; }
        else if (t < drop0) { const u = T.span(t, gulp, drop0, T.ease.inOut); hx = P[1][0] + (P[2][0] - P[1][0]) * u; hy = P[1][1] - 18 + (P[2][1] - P[1][1] + 18) * u + 16 * Math.sin(Math.PI * u); hs = 3 - 1.5 * u; }
        else { const u = T.span(t, clack + 0.05, clack + 0.4, T.ease.inOut); hx = P[2][0] + (P[3][0] - P[2][0]) * u; hy = P[2][1] + (P[3][1] - P[2][1]) * u + 14 * Math.sin(Math.PI * u); hs = 1.5 - 0.5 * u; }
        hat.visible = t > tC + 0.03 && t < clack + 0.42; hat.setScale(Math.round(hs * 2) / 2); hat.place(hx, hy);
        hat.setRect((t >= over && t < drop0 ? 0 : Math.floor(t * 18) % 3) / 3, 0, 1 / 3, 1);
        if (T.exactFrame(t, [gulp])) hat.flash = 0.8; else hat.flash = 0;
        sparkle(batch, t, gulp, P[1][0], P[1][1] - 10, { n: 10, r: 20, color: PAL.yellow });
        const drop = T.span(t, drop0, clack, T.ease.inQuad);
        if (t >= drop0) { cart.visible = true; const cy = t >= clack ? 46 : 92 + (46 - 92) * drop; cart.place(KX, cy); label.visible = true; label.place(KX, cy + 21); }
        cons.material.setMap(t >= clack ? consoleOn : consoleOff); cons.place(KX, 30);
        dust(batch, t, clack, KX, 52, { n: 6, seed: 9, spread: 22 });
        sparkle(batch, t, STABS[3], KX, 90, { n: 12, r: 34, dur: 0.6, color: PAL.yellow });
        sparkle(batch, t, clack, KX - 10, 70, { n: 6, r: 16, color: PAL.white });
        shipped.visible = t >= clack + 0.03; if (shipped.visible) { const k = Math.floor((t - clack - 0.03) * T.fps()); shipped.setScale([3, 2.5, 2, 2][Math.min(3, k)]); shipped.place(262, 112); }
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
      zh[0].place(88, 90); zh[1].place(110, 124); zh[2].place(46, 124);
      // (v47 intro) the hero's tag lands on their first word, flashes on the second; card: the portrait shouts each word
      tags.forEach((g, i) => {
        const on = W[2 * i], k = Math.floor((t - T.snap(on)) * T.fps() + 1e-6);
        g.q.visible = i === zi && k >= 0; if (!g.q.visible) return;
        const k2 = Math.floor((t - T.snap(W[2 * i + 1])) * T.fps() + 1e-6);
        const talk = (k >= 0 && k < 5) || (k2 >= 0 && k2 < 5);
        const hair = g.tex.down && t >= tA + 0.09 ? g.tex.down : g.tex.up;      // same frame as the sprite's pencil pull
        g.q.material.setMap(hair[talk && hair.length > 1 ? 1 : 0]);
        const card = INTRO_V47 === 'card', x0 = 4, y0 = i === 0 ? 36 : card ? 0 : 2;      // B/C: the tag's top stays under the heroes' feet (floor top 39)
        const bump = k2 >= 0 && k2 < 3 ? -[2, 1, 0][k2] : 0;                              // second word: a 2 px dip on the beat (no wash; never up into the feet)
        g.q.place(x0 + [-(g.q.w + 8), -Math.round(g.q.w * 0.4), 6, 0][Math.min(k, 3)], y0 + bump);   // slams in from the left (A: never crosses the gloss)
        g.q.flash = k === 1 ? 0.7 : 0;
      });
    },
  };
}
