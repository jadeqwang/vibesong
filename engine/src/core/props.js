// Procedural pixel-art props, painted in code on the game-pixel grid (no generated images needed).
//   pencilCanvas({ kind:'graphite'|'rainbow', len })  vertical pencil, tip at the bottom.
//       CANON: yellow body; kind 'graphite' = PINK/ORANGE eraser cap + plain GRAPHITE core (FIXTURES, draws gray);
//              kind 'rainbow'  = BLUE eraser cap + RAINBOW multicolour core at the sharpened tip (FUNCTIONS, draws colour).
//   Pencil  (THREE.Group) anchored at the TIP: pencil.set({ x, y, angle (deg, 0 = pointing down), kind })
//   cartridgeCanvas(), consoleCanvas(), playSwitchCanvas(on), flowerCanvas(i), panelCanvas(w, h, style),
//   bubbleCanvas(w, h, tailX), bangCanvas(), iconCanvas(name), checkerCanvas(), crumbsFromStrip()
import * as THREE from 'three';
import { pixelCanvas, canvasTex, Quad } from './gfx.js';
import { PAL } from './palette.js';

const OUT = '#3a2a10';
export function pencilCanvas({ kind = 'graphite', len = 60 } = {}) {
  const W = 11, L = len;
  return pixelCanvas(W, L, (g, px) => {
    const cap = kind === 'rainbow' ? [PAL.capBlue, PAL.capBlueLo, '#9ec2ff'] : [PAL.capPink, PAL.capPinkLo, '#ffc0a0'];
    // outline silhouette first (1px), then fill
    const capH = 7, ferH = 5, coneH = 10, leadH = 4, bodyEnd = L - coneH - leadH;
    const row = (y, x0, x1, c) => px(x0, y, c, x1 - x0 + 1, 1);
    for (let y = 0; y < L; y++) {
      let x0 = 0, x1 = W - 1;
      if (y === 0) { x0 = 2; x1 = 8; }
      if (y >= bodyEnd) { const u = (y - bodyEnd) / (coneH + leadH); const half = Math.max(0.5, 5 * (1 - u)); x0 = Math.round(5 - half); x1 = Math.round(5 + half); }
      row(y, x0, x1, OUT);
    }
    for (let y = 1; y < capH; y++) { row(y, 1, 9, cap[0]); px(2, y, cap[2]); px(8, y, cap[1]); px(9, y, cap[1]); }
    row(1, 2, 8, cap[2]);
    for (let y = capH; y < capH + ferH; y++) { row(y, 1, 9, (y - capH) % 2 ? PAL.ferruleLo : PAL.ferrule); px(2, y, '#eef0f4'); }
    for (let y = capH + ferH; y < bodyEnd; y++) { row(y, 1, 9, PAL.pencilBody); row(y, 1, 2, PAL.pencilBodyHi); row(y, 7, 9, PAL.pencilBodyLo); px(5, y, PAL.pencilBodyLo); }
    for (let y = bodyEnd; y < L - leadH; y++) {
      const u = (y - bodyEnd) / (coneH + leadH); const half = Math.max(0.5, 5 * (1 - u)); const a = Math.round(5 - half) + 1, b = Math.round(5 + half) - 1;
      if (b >= a) { row(y, a, b, PAL.wood); px(b, y, PAL.woodLo); if (b - 1 > a) px(b - 1, y, PAL.woodLo); }
      if (y === bodyEnd) for (let x = 1; x <= 9; x += 2) px(x, y, PAL.pencilBodyLo); // scalloped paint edge
    }
    for (let y = L - leadH; y < L; y++) {
      const u = (y - bodyEnd) / (coneH + leadH); const half = Math.max(0.5, 5 * (1 - u)); const a = Math.round(5 - half), b = Math.round(5 + half);
      for (let x = a; x <= b; x++) px(x, y, kind === 'rainbow' ? PAL.rainbow[((x + y * 2) % 12 + 12) % 12] : (x === a ? PAL.g2 : PAL.g0));
    }
    if (kind === 'rainbow') { px(4, L - leadH - 1, PAL.rainbow[0]); px(5, L - leadH - 1, PAL.rainbow[4]); px(6, L - leadH - 1, PAL.rainbow[8]); }
  });
}

/** A pencil you can point anywhere; anchored at the tip. angle in degrees: 0 = tip down, +ve rotates CCW. */
export class Pencil extends THREE.Group {
  constructor({ kind = 'graphite', len = 60 } = {}) {
    super();
    this.kinds = {};
    for (const k of ['graphite', 'rainbow']) {
      const cv = pencilCanvas({ kind: k, len }); const q = new Quad(canvasTex(cv), cv.width, cv.height, { anchor: [5, 0] });
      q.place(0, 0, false); q.visible = k === kind; this.add(q); this.kinds[k] = q;
    }
    this.frustumCulled = false;
  }
  set({ x = this.position.x, y = this.position.y, angle = 0, kind, visible = true } = {}) {
    if (kind) for (const [k, q] of Object.entries(this.kinds)) q.visible = k === kind;
    this.visible = visible; this.position.set(x, y, 0); this.rotation.z = (angle * Math.PI) / 180; return this;
  }
}

export function cartridgeCanvas() {
  return pixelCanvas(34, 38, (g, px) => {
    px(0, 0, OUT, 34, 38);
    px(1, 1, '#b9b9c4', 32, 36); px(1, 1, '#d6d6de', 32, 2); px(31, 1, '#8c8c98', 2, 36);
    for (let x = 4; x < 30; x += 3) px(x, 3, '#9a9aa8', 1, 4);          // grip ridges
    px(4, 9, OUT, 26, 22); px(5, 10, PAL.paperHi, 24, 20);              // label
    for (let i = 0; i < 12; i++) px(5 + 2 * i, 10, PAL.rainbow[i], 2, 3);
    // mini 一笔一画 glyph marks (2-px strokes) on the label
    px(7, 18, PAL.ink, 4, 1); px(13, 15, PAL.ink, 1, 6); px(12, 17, PAL.ink, 4, 1); px(12, 20, PAL.ink, 4, 1);
    px(18, 18, PAL.ink, 4, 1); px(23, 15, PAL.ink, 4, 1); px(23, 16, PAL.ink, 1, 6); px(26, 16, PAL.ink, 1, 6); px(23, 21, PAL.ink, 4, 1); px(24, 18, PAL.ink, 2, 1);
    px(6, 24, PAL.g1, 22, 1); px(6, 26, PAL.g2, 16, 1);
    px(3, 33, '#7a7a86', 28, 3); for (let x = 5; x < 29; x += 2) px(x, 34, '#e0c060', 1, 2); // contacts
  });
}
export function consoleCanvas(on = false) {
  return pixelCanvas(80, 34, (g, px) => {
    px(2, 6, OUT, 76, 28); px(3, 7, '#c9c9d2', 74, 26); px(3, 7, '#e2e2ea', 74, 2); px(3, 30, '#9a9aa6', 74, 3);
    px(18, 2, OUT, 44, 8); px(19, 3, '#a8a8b4', 42, 6); px(22, 5, '#2a2a33', 36, 3);   // cartridge slot
    px(8, 14, '#7c5cff', 18, 3); px(8, 18, '#9a9aa6', 18, 2);                          // brand stripe
    px(56, 14, OUT, 8, 8); px(57, 15, '#9a9aa6', 6, 6); px(68, 14, OUT, 8, 8); px(69, 15, '#9a9aa6', 6, 6);
    px(10, 23, OUT, 5, 4); px(11, 24, on ? '#ff3a3a' : '#5a2a2a', 3, 2); if (on) px(11, 24, '#ffb0b0', 1, 1);
  });
}
export function playSwitchCanvas(on = false) {
  return pixelCanvas(44, 52, (g, px) => {
    // pedestal
    px(6, 34, OUT, 32, 18); px(7, 35, '#8a8a94', 30, 16); px(7, 35, '#a6a6b0', 30, 2); px(33, 35, '#6a6a74', 4, 16);
    // round button: red rim, green face
    const cx = 22, cy = 20, R = 18;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 44; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d < R + 1) px(x, y, OUT);
      if (d < R) px(x, y, d > R - 4 ? (y < cy ? '#ff5a5a' : '#c42a3a') : on ? (y < cy - 4 ? '#8cffb0' : '#3ad06a') : (y < cy - 4 ? '#5ad07a' : '#2a9a50'));
    }
    // play triangle
    for (let y = -8; y <= 8; y++) { const w = Math.round((8 - Math.abs(y)) * 1.2); px(cx - 5, cy + y, on ? '#ffffff' : '#1e6a3a', w + 1, 1); }
  });
}
export const FLOWER_COLORS = [PAL.rainbow[0], PAL.rainbow[2], PAL.rainbow[3], PAL.rainbow[8], PAL.rainbow[10], PAL.rainbow[11], '#ffffff'];
export function flowerCanvas(i = 0, stem = 4) {
  const c = FLOWER_COLORS[i % FLOWER_COLORS.length];
  return pixelCanvas(5, 4 + stem, (g, px) => {
    px(1, 0, c); px(3, 0, c); px(0, 1, c); px(4, 1, c); px(1, 2, c); px(3, 2, c); px(2, 1, PAL.yellow); px(2, 0, c); px(2, 2, c);
    for (let y = 3; y < 3 + stem; y++) px(2, y, '#3f8a3a'); px(3, 4, '#5cb04a');
  });
}
/** UI frame styles: 'hud' (slate bevel), 'gold' (navy + gold riveted), 'sub' (dark box), 'dialog' (navy + white), 'paper' */
export function panelCanvas(w, h, style = 'gold') {
  return pixelCanvas(w, h, (g, px) => {
    if (style === 'sub') { px(0, 0, '#0d1022', w, h); px(1, 0, '#0d1022', w - 2, 1); g.clearRect(0, 0, 1, 1); g.clearRect(w - 1, 0, 1, 1); g.clearRect(0, h - 1, 1, 1); g.clearRect(w - 1, h - 1, 1, 1); return; }
    if (style === 'hud') {
      px(0, 0, PAL.slateLo, w, h); px(1, 1, PAL.slate, w - 2, h - 2); px(1, 1, PAL.slateHi, w - 2, 1); px(1, 1, PAL.slateHi, 1, h - 2);
      px(1, h - 2, '#1a1c28', w - 2, 1); px(w - 2, 1, '#1a1c28', 1, h - 2);
      for (let y = 3; y < h - 3; y += 2) for (let x = 3 + (y % 4 ? 1 : 0); x < w - 3; x += 4) px(x, y, '#34394d');
      return;
    }
    if (style === 'well') { px(0, 0, '#11131d', w, h); px(1, 1, '#1d2030', w - 2, h - 2); px(1, h - 2, '#3a3f55', w - 2, 1); px(w - 2, 1, '#3a3f55', 1, h - 2); return; }
    if (style === 'dialog') { px(0, 0, PAL.white, w, h); px(1, 1, PAL.navy0, w - 2, h - 2); px(2, 2, PAL.navy2, w - 4, h - 4); px(3, 3, PAL.navy1, w - 6, h - 6); return; }
    if (style === 'paper') { px(0, 0, PAL.ink, w, h); px(1, 1, PAL.paperHi, w - 2, h - 2); return; }
    // gold
    px(0, 0, '#2a1c08', w, h); px(1, 1, PAL.goldLo, w - 2, h - 2); px(2, 2, PAL.gold, w - 4, h - 4); px(3, 3, PAL.goldLo, w - 6, h - 6);
    px(4, 4, PAL.navy0, w - 8, h - 8); px(5, 5, PAL.navy1, w - 10, h - 10);
    for (const [x, y] of [[2, 2], [w - 4, 2], [2, h - 4], [w - 4, h - 4]]) { px(x, y, PAL.goldHi, 2, 2); }
  });
}
/** speech bubble (white, ink outline) with a tail at tailX on the bottom edge */
export function bubbleCanvas(w, h, tailX = 8) {
  return pixelCanvas(w, h + 5, (g, px) => {
    px(1, 0, PAL.ink, w - 2, h); px(0, 1, PAL.ink, w, h - 2); px(2, 1, PAL.white, w - 4, h - 2); px(1, 2, PAL.white, w - 2, h - 4);
    for (let i = 0; i < 5; i++) { px(tailX - 1 + i, h - 1 + i, PAL.ink, 4 - i > 0 ? 4 - i : 1, 1); if (3 - i > 0) px(tailX + i, h - 1 + i, PAL.white, Math.max(1, 2 - i), 1); }
  });
}
export function bangCanvas() {
  return pixelCanvas(9, 14, (g, px) => {
    px(1, 0, PAL.ink, 7, 12); px(0, 1, PAL.ink, 9, 10); px(1, 1, PAL.white, 7, 10); px(3, 12, PAL.ink, 3, 2); px(4, 11, PAL.white, 1, 1);
    px(3, 2, PAL.red, 3, 5); px(4, 7, PAL.red, 1, 1); px(3, 8, PAL.red, 3, 2);
  });
}
export function checkerCanvas(cell = 4) {
  return pixelCanvas(cell * 2, cell * 2, (g, px) => { px(0, 0, PAL.missingA, cell, cell); px(cell, cell, PAL.missingA, cell, cell); px(cell, 0, PAL.missingB, cell, cell); px(0, cell, PAL.missingB, cell, cell); });
}
/** 14x14 item icons for HUD slots / select cards */
export function iconCanvas(name) {
  return pixelCanvas(14, 14, (g, px) => {
    if (name === 'pencil_graphite' || name === 'pencil_rainbow') {
      const cap = name === 'pencil_rainbow' ? PAL.capBlue : PAL.capPink;
      for (let i = 0; i < 10; i++) { px(2 + i, 11 - i, OUT, 2, 2); }
      for (let i = 1; i < 8; i++) px(2 + i, 11 - i, PAL.pencilBody);
      px(9, 3, PAL.ferrule); px(10, 2, cap); px(11, 1, cap); px(10, 1, cap);
      px(2, 11, name === 'pencil_rainbow' ? PAL.rainbow[0] : PAL.g0); px(3, 10, PAL.wood); px(1, 12, name === 'pencil_rainbow' ? PAL.rainbow[8] : PAL.g1);
      return;
    }
    if (name === 'guitar') {
      for (let i = 0; i < 7; i++) px(6 + i, 6 - i, '#6b4a2a', 1, 1);   // neck
      px(11, 0, '#3a2a1a', 2, 2);
      px(1, 7, OUT, 7, 6); px(2, 6, OUT, 5, 1); px(2, 8, '#d8b07a', 5, 4); px(3, 7, '#d8b07a', 3, 1); px(3, 9, '#f4f0e6', 3, 2); px(4, 10, OUT, 1, 1);
      return;
    }
    if (name === 'hat') {
      px(2, 6, OUT, 10, 6); px(1, 9, OUT, 12, 3); px(3, 6, '#d9b98a', 8, 4); px(2, 9, '#c9a46e', 10, 2); px(3, 7, '#ecd2a8', 4, 1); px(6, 5, OUT, 2, 1);
      return;
    }
    if (name === 'q') { px(4, 2, PAL.white, 6, 2); px(9, 4, PAL.white, 2, 3); px(6, 7, PAL.white, 3, 2); px(6, 11, PAL.white, 2, 2); return; }
  });
}
export function texOf(cv) { return canvasTex(cv); }
