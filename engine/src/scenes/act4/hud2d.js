// ACT IV · the 2D game UI over the 3D world (and over the recap montage), on the half-1 320x180 UI grid:
//   the second build bar  REALITY LV2 → LV3 (src/show/build_bar.js buildAt2 / BuildBar2), 149.22 → 173.0
//   the SPEEDRUN split timer (top right, under the bar): counts the video's own time from the 出发 launch (165.87),
//     green while running; a gold split row on every montage cut (the look it passes through), final time gold at 173.0
//   the party cart as a pixel sprite, racing through the 2D (pixel / void) callback frames of the montage
// Pure function of t. Drawn straight onto the frame after the post pass (ortho 320x180 -> output pixels, integer scale).
//   const hud = makeAct4HUD(ctx);  hud.update(t, { cart2d: 0..1 | null });  hud.render(renderer, target)
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { BuildBar2, buildAt2 } from '../../show/build_bar.js';
import { panel } from '../../core/ui.js';
import { TextSprite } from '../../core/text.js';
import { Quad, canvasTex, pixelCanvas } from '../../core/gfx.js';
import { PAL } from '../../core/palette.js';
import { ZUI } from '../../core/stage2d.js';

/** the montage's callback cuts, in recap order (montage.js plans its cuts from this; the split names come from `look`) */
export const CUTS = [
  { t: 0.62, look: 'pixel' }, { t: 4.45, look: 'pixel' }, { t: 12.6, look: 'pixel' }, { t: 18.6, look: 'pixel' }, { t: 27.9, look: 'pixel' },
  { t: 35.0, look: 'void' }, { t: 39.5, look: 'void' }, { t: 49.5, look: 'void' }, { t: 56.0, look: 'void' }, { t: 72.4, look: 'void' },
  { t: 82.2, look: 'plaster' }, { t: 87.0, look: 'plaster' }, { t: 92.8, look: 'plaster' }, { t: 108.4, look: 'plaster' },   // all three heroes read clearly
  { paper: 'lineup' }, { paper: 'laugh' }, { paper: 'sing' },
  { t: 121.0, look: 'color' }, { t: 130.0, look: 'color', own: true }, { t: 139.45, look: 'color', own: true }, { t: 147.5, look: 'color', own: true },
  { t: 157.3, look: 'color', own: true }, { t: 164.2, look: 'color', own: true }, { t: 166.4, look: 'color', own: true },
];
const SPLIT_NAME = { pixel: 'PIXEL', void: 'VOID', plaster: 'PLASTER', color: 'COLOR' };
export const RUN = { start: 165.87, eights: 168.075, pshot: 172.44, end: 173.0 };
/** the montage cut times (one per 8th) and the split list: [{ t, name }] */
export function montageCuts() { return T.beatsIn(RUN.eights - 0.02, RUN.pshot - 0.05, 2); }
export function splitList() {
  const cuts = montageCuts();
  const out = [{ t: RUN.start, name: '出发' }];
  cuts.forEach((ct, i) => { const c = CUTS[i % CUTS.length]; out.push({ t: ct, name: c.paper ? 'PAPER' : SPLIT_NAME[c.look] || 'COLOR' }); });
  out.push({ t: RUN.end, name: '100%' });
  return out;
}
const fmt = (s) => { const m = Math.floor(s / 60), r = s - m * 60; const cs = Math.floor(r * 100 + 1e-6); return `${m}:${String(Math.floor(cs / 100)).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`; };

function cartCanvas() {
  // 34 x 18: caterpillar chassis, two beetle wheels (teal hubs), moth wings, firefly headlight, ladybug button, pink Eraser bumper
  return pixelCanvas(34, 18, (g, px) => {
    px(2, 3, '#1b1b22', 30, 9);                                                       // outline block
    px(8, 6, '#4fd06a', 22, 4); px(8, 6, '#b6e84a', 22, 1); for (let x = 9; x < 29; x += 4) px(x, 8, '#1e8a43', 2, 1);   // chassis segments
    px(2, 4, '#1b1b22', 7, 10); px(3, 5, '#f2788f', 5, 8); px(3, 5, '#f7a1b0', 5, 1); px(3, 10, '#e9dfca', 5, 1); px(4, 7, '#1b1b22'); px(6, 7, '#1b1b22');   // the Eraser bumper
    px(3, 3, '#cdae74', 4, 2);                                                        // its cap
    px(28, 7, '#ffe14d', 4, 3); px(32, 7, '#fff6c0', 2, 3);                           // headlight + beam
    px(21, 4, '#e8344a', 4, 2); px(22, 4, '#1b1b22');                                 // the button on the dash
    px(10, 1, '#efe6d2', 12, 2); px(10, 1, '#8a5a3a', 2, 1); px(20, 1, '#8a5a3a', 2, 1); px(14, 0, '#efe6d2', 4, 1);   // wings
    for (const wx of [8, 22]) { px(wx, 11, '#1b1b22', 7, 7); px(wx + 1, 12, '#2a2f3a', 5, 5); px(wx + 2, 13, '#2ec4a6', 3, 3); }   // wheels
  });
}

// (v45_jam) opts.steps (sorted song times, last = the montage start 168.075): the REALITY LV2 -> LV3 bar holds between them and
// JUMPS on each (Ricky's strums power the cart, main3d.js CART_V45); outside [steps[0], last) the original curve, so the montage's bar is unchanged
export function makeAct4HUD(ctx, opts = {}) {
  const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(0, 320, 180, 0, -10, 10);
  const add = (o, z) => { o.traverse((m) => { m.renderOrder = z + (m.userData.dz || 0); }); scene.add(o); return o; };
  const bar = add(new BuildBar2(), ZUI.BANNER);
  // split timer: a dialog panel under the bar's right end
  const TX = 248, TY = 147, TW = 70, TH = 15;
  const timer = new THREE.Group();
  const tbg = panel(TW, TH, 'dialog'); tbg.place(TX, TY); timer.add(tbg);
  const ttxt = new TextSprite({ text: '0:00.00', font: 'px', color: PAL.termGreen, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'br' }); ttxt.userData.dz = 0.5; ttxt.place(TX + TW - 4, TY + 4); timer.add(ttxt);
  const rows = [0, 1].map((i) => {
    const g = new THREE.Group(); const bg = panel(TW, 11, 'dialog'); bg.place(TX, TY - 11 * (i + 1)); g.add(bg);
    const nm = new TextSprite({ text: '', font: 'sk', color: PAL.white }, { anchor: 'bl' }); nm.userData.dz = 0.5; g.add(nm);
    const tm = new TextSprite({ text: '', font: 'sk', color: PAL.goldHi }, { anchor: 'br' }); tm.userData.dz = 0.5; g.add(tm);
    g.userData = { bg, nm, tm, y: TY - 11 * (i + 1) }; return g;
  });
  add(timer, ZUI.BANNER); rows.forEach((r) => add(r, ZUI.BANNER));
  const cart = add(new Quad(canvasTex(cartCanvas()), 34, 18), ZUI.HUD);
  const splits = splitList();
  return {
    scene, cam, bar,
    /** o.cart2d: 0..1 = the pixel cart's run across this frame (2D callback cuts), null = hidden */
    update(t, o = {}) {
      const ST = opts.steps;
      if (ST && ST.length > 1 && t >= T.snap(ST[0]) && t < T.snap(ST[ST.length - 1])) {   // (v45_jam) stepped on the strums
        let tk = ST[0]; for (const x of ST) if (t >= T.snap(x)) tk = x;
        const s0 = buildAt2(t), sk = buildAt2(T.snap(tk) + 1e-4); bar.set({ ...s0, pct: sk.pct, text: s0.text === s0.pct + '%' ? sk.pct + '%' : s0.text }, t);
      } else bar.update(t);
      const on = false;   // (v4, Jade 2026-10-18: speedrun timer CUT) no split timer, no split rows
      timer.visible = on; rows.forEach((r) => { r.visible = false; });
      if (on) {
        const done = t >= T.snap(RUN.end);
        ttxt.set({ text: fmt(done ? RUN.end : t), color: done ? PAL.goldHi : PAL.termGreen });
        // the last two splits (newest on top, gold; it flashes white for 3 frames when it lands)
        const passed = splits.filter((s) => t >= T.snap(s.t));
        passed.slice(-2).reverse().forEach((s, i) => {
          const r = rows[i]; const U = r.userData; r.visible = true;
          const fresh = i === 0 && t - T.snap(s.t) < 0.1;
          U.nm.set({ text: s.name, color: fresh ? PAL.goldHi : PAL.white }); U.nm.place(TX + 4, U.y + 2);
          U.tm.set({ text: fmt(s.t).slice(0, -1), color: fresh ? PAL.white : PAL.goldHi }); U.tm.place(TX + TW - 4, U.y + 2);
        });
      }
      cart.visible = o.cart2d != null;
      if (cart.visible) { const u = o.cart2d; cart.place(-40 + 400 * u, 38 + Math.round(3 * Math.abs(Math.sin(u * 20)))); }
      return this;
    },
    render(renderer, target) {
      const r = renderer; r.setRenderTarget(target); const ac = r.autoClear; r.autoClear = false; r.clearDepth(); r.render(scene, cam); r.autoClear = ac;
    },
    visibleAt(t) { return buildAt2(t).visible; },   // (v4) the bar only (the speedrun timer is cut); the 2D cart rides montage.js's own call
  };
}
