// MOCKS B (34.69-87): procedural pixel props for the game-design keyframe tableaux (docs/game_design_acts1-3.md).
// Only used by mocks_b.js. Canvases are 1 px = 1 game pixel, y down (canvas space).
import { pixelCanvas } from '../../core/gfx.js';
import { raster } from '../../core/text.js';
import { PAL } from '../../core/palette.js';

const OUT = '#14121c';

/** one frame of a sprite strip as its own canvas (optionally cropping rows off the top, e.g. the hang bar) */
export function spriteFrame(lib, name, f = 0, { cropTop = 0 } = {}) {
  const sp = lib.get(name);
  return pixelCanvas(sp.w, sp.h - cropTop, (g) => g.drawImage(sp.img, f * sp.w, cropTop, sp.w, sp.h - cropTop, 0, 0, sp.w, sp.h - cropTop));
}

/** CANON FIX for the HUD: Jade's portrait with the bun + pencils removed and long loose hair down the sides
 *  (pencils are in her hands in every B frame, so her hair is DOWN). Returns a 2-frame strip canvas (64x32). */
export function hairDownPortrait(lib) {
  const sp = lib.get('portrait_jade');
  const cv = pixelCanvas(sp.img.width, sp.img.height, (g) => g.drawImage(sp.img, 0, 0));
  const g = cv.getContext('2d'); const im = g.getImageData(0, 0, cv.width, cv.height); const d = im.data; const W = cv.width;
  const at = (x, y) => (y * W + x) * 4;
  const get = (x, y) => [d[at(x, y)], d[at(x, y) + 1], d[at(x, y) + 2], d[at(x, y) + 3]];
  const set = (x, y, c) => { const i = at(x, y); d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3] ?? 255; };
  const clear = (x, y) => { d[at(x, y) + 3] = 0; };
  const hair = new Set(['17,15,18', '36,32,40', '52,47,55', '26,23,29']);
  const isHair = (c) => hair.has(c.slice(0, 3).join(','));
  const H1 = [17, 15, 18], H2 = [36, 32, 40], H3 = [52, 47, 55];
  for (let f = 0; f < sp.n; f++) {
    const ox = f * sp.w;
    for (let y = 0; y < 7; y++) for (let x = 0; x < sp.w; x++) { const c = get(ox + x, y); if (y <= 2 || (c[3] && !isHair(c) && y < 5)) clear(ox + x, y); }
    const span = []; for (let x = 0; x < sp.w; x++) if (get(ox + x, 6)[3]) span.push(x);
    const l0 = Math.min(...span), r0 = Math.max(...span);
    for (let y = 3; y < 6; y++) for (let x = 0; x < sp.w; x++) if (get(ox + x, y)[3] && (x < l0 + (6 - y) || x > r0 - (6 - y))) clear(ox + x, y);
    // drop isolated crown pixels
    for (let y = 3; y < 6; y++) for (let x = 0; x < sp.w; x++) if (get(ox + x, y)[3] && !get(ox + x, y + 1)[3] && !get(ox + x - 1, y)[3] && !get(ox + x + 1, y)[3]) clear(ox + x, y);
    const r9 = []; for (let x = 0; x < sp.w; x++) if (get(ox + x, 9)[3]) r9.push(x);
    const L9 = Math.min(...r9), R9 = Math.max(...r9);
    for (let y = 9; y < sp.h; y++) {
      const u = (y - 9) / 22; const w = Math.round(3.2 * Math.sqrt(u)) + (y % 4 === 0 && y > 14 ? 1 : 0);
      for (let x = L9 - w; x < sp.w / 2 && !get(ox + x, y)[3]; x++) set(ox + x, y, x === L9 - w ? H1 : (x + y) % 7 === 0 ? H3 : H2);
      for (let x = R9 + w; x > sp.w / 2 && !get(ox + x, y)[3]; x--) set(ox + x, y, x === R9 + w ? H1 : (x * 2 + y) % 7 === 0 ? H3 : H2);
    }
  }
  g.putImageData(im, 0, 0);
  return cv;
}

/** tiny 3x5 digits (tab numbers, switch numbers) */
const DIG = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  7: ['111', '001', '010', '010', '010'], 9: ['111', '101', '111', '001', '111'],
};
export function digit(px, x, y, n, c) { (DIG[n] || DIG[0]).forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') px(x + i, y + j, c); })); }
/** paste a text raster into a canvas at (x, y) (canvas space, top-left) */
function text(g, s, x, y, spec) { const r = raster({ text: s, ...spec }); g.drawImage(r.canvas, x, y); return r; }

// ------------------------------------------------------------------ pages the heroes read (B4)
/** 字帖: stroke-order copybook page, red 田字格 grid, black model character + grey trace copies */
export function copybookPage() {
  return pixelCanvas(46, 50, (g, px) => {
    px(0, 0, OUT, 46, 50); px(1, 1, '#fbf3df', 44, 48); px(1, 1, '#f0e2c0', 44, 1);
    text(g, '字帖', 3, 2, { font: 'fp10', color: '#c8202a' });
    const C = 13, X0 = 3, Y0 = 14, red = '#e0484a', lite = '#f2a6a6';
    const rows = [['画', '画', '画'], ['笔', '笔', '']];
    rows.forEach((row, j) => row.forEach((ch, i) => {
      const x = X0 + i * C, y = Y0 + j * C;
      for (let k = 1; k < C; k += 2) { px(x + k, y + 6, lite); px(x + 6, y + k, lite); }
      px(x, y, red, C + 1, 1); px(x, y + C, red, C + 1, 1); px(x, y, red, 1, C + 1); px(x + C, y, red, 1, C + 1);
      if (ch) text(g, ch, x + 1, y + 1, { font: 'fp12', color: i === 0 ? '#1b1b22' : '#c9c2b4' });
    }));
    // stroke-order strip along the bottom (一 丨 ...), the copybook's "笔顺"
    for (let k = 0; k < 5; k++) { const x = 4 + k * 8; px(x, 44, '#9a9aa2', 5, 1); if (k > 0) px(x + 2, 42, '#9a9aa2', 1, 4); }
    px(40, 41, red, 3, 3);
  });
}
/** guitar TAB: six lines with fret numbers (power-chord riff) */
export function tabPage() {
  return pixelCanvas(50, 46, (g, px) => {
    px(0, 0, OUT, 50, 46); px(1, 1, '#ffffff', 48, 44); px(1, 1, '#e4e8f0', 48, 1);
    text(g, 'TAB', 3, 2, { font: 'skb', color: '#1b1b22' });
    text(g, 'riff', 28, 2, { font: 'sk', color: '#8a8a96' });
    const y0 = 15, dy = 5;
    for (let s = 0; s < 6; s++) px(3, y0 + s * dy, '#6b6b72', 44, 1);
    px(3, y0, '#1b1b22', 1, 5 * dy + 1); px(46, y0, '#1b1b22', 1, 5 * dy + 1); px(25, y0, '#9a9aa2', 1, 5 * dy + 1);
    // columns: [x, {string: fret}] strings 0 = high e (top) .. 5 = low E (bottom)
    const cols = [[7, { 5: 5, 4: 7, 3: 7 }], [13, { 5: 5, 4: 7, 3: 7 }], [19, { 5: 3, 4: 5, 3: 5 }], [29, { 5: 0, 4: 2, 3: 2 }], [35, { 5: 0, 4: 2, 3: 2 }], [41, { 2: 9, 1: 1 }]];
    for (const [x, m] of cols) for (const [s, n] of Object.entries(m)) { const y = y0 + s * dy - 2; px(x - 1, y, '#ffffff', 5, 5); digit(px, x, y, n, '#1b1b22'); }
    px(3, 43, '#e8344a', 10, 1);
  });
}
/** product SPEC page: header bar + bullet lines with checkboxes */
export function specPage() {
  return pixelCanvas(46, 50, (g, px) => {
    px(0, 0, OUT, 46, 50); px(1, 1, '#ffffff', 44, 48);
    px(1, 1, '#2f5fd0', 44, 11); text(g, 'SPEC', 4, 3, { font: 'skb', color: '#ffffff' }); text(g, 'v2', 33, 3, { font: 'sk', color: '#cfe0ff' });
    const lines = [[30, 1], [24, 1], [34, 0], [20, 1], [28, 0], [16, 0]];
    lines.forEach(([w, done], k) => {
      const y = 16 + k * 5;
      px(3, y, '#6b6b72', 4, 4); px(4, y + 1, done ? '#3ad06a' : '#ffffff', 2, 2);
      px(9, y + 1, k === 0 ? '#1b1b22' : '#9a9aa2', w, 2);
    });
    px(3, 46, '#ffb02e', 18, 1);
  });
}
/** flat page used as a platform (doc lying edge-on-ish, white with a shadow) */
export function platformPage(w = 40, seed = 1) {
  return pixelCanvas(w, 10, (g, px) => {
    px(0, 0, OUT, w, 10); px(1, 1, '#ffffff', w - 2, 6); px(1, 7, '#c8ccdc', w - 2, 2);
    for (let k = 0; k < 3; k++) px(4 + ((seed * 7 + k * 5) % 6), 2 + k * 2, '#b8b8c4', w - 14 - ((seed + k * 3) % 8), 1);
  });
}

// ------------------------------------------------------------------ prompt (B5)
export function paperclip(c = '#dfe4f0', lo = '#8a90a8') {
  return pixelCanvas(5, 10, (g, px) => {
    px(1, 0, c, 3, 1); px(0, 1, c, 1, 8); px(4, 1, c, 1, 7); px(2, 2, lo, 1, 6); px(1, 9, c, 3, 1); px(4, 8, lo, 1, 1); px(3, 1, lo, 1, 1);
  });
}
/** attachment chip: paperclip glyph + label */
export function chipCanvas(label) {
  const r = raster({ text: label, font: 'fp10', color: '#ffffff' });
  const w = r.w + 14, h = 13;
  return pixelCanvas(w, h, (g, px) => {
    px(1, 0, '#9ec2ff', w - 2, h); px(0, 1, '#9ec2ff', w, h - 2); px(1, 1, '#2a3672', w - 2, h - 2);
    g.drawImage(paperclip(), 3, 2); g.drawImage(r.canvas, 10, Math.floor((h - r.h) / 2));
  });
}
/** ⏎ return-key glyph (keycap), pressed = lit */
export function enterKey(pressed) {
  return pixelCanvas(15, 13, (g, px) => {
    const cap = pressed ? '#58f08a' : '#2a6a40', face = pressed ? '#d8ffe4' : '#7ad09a';
    px(0, pressed ? 1 : 0, cap, 15, 12); px(1, pressed ? 2 : 1, '#0d1022', 13, 9);
    const c = face, y = pressed ? 2 : 1;
    px(10, y + 1, c, 2, 5); px(4, y + 5, c, 8, 2); px(3, y + 4, c, 1, 4); px(2, y + 5, c, 1, 2);
  });
}
export function checkGlyph(c = PAL.yellow) { return pixelCanvas(8, 7, (g, px) => { px(0, 3, c, 2, 2); px(1, 4, c, 2, 2); px(2, 5, c, 2, 2); px(4, 3, c, 2, 2); px(5, 1, c, 2, 2); px(6, 0, c, 2, 2); }); }

// ------------------------------------------------------------------ switches, plates, ramps (B6, B8, B9)
/** clickable ▶ switch block, number n in the corner. state: 'off' | 'on' | 'hit' */
export function switchBlock(n, state) {
  return pixelCanvas(18, 18, (g, px) => {
    const face = state === 'on' ? ['#3ad06a', '#8cffb0', '#1e8a43'] : state === 'hit' ? ['#ffffff', '#ffffff', '#ffe14d'] : ['#c42a3a', '#ff6a7a', '#7a1020'];
    px(0, 0, OUT, 18, 18); px(1, 1, face[0], 16, 16); px(1, 1, face[1], 16, 2); px(1, 15, face[2], 16, 2); px(15, 1, face[2], 2, 16);
    for (let y = -4; y <= 4; y++) px(7, 9 + y, state === 'hit' ? '#ff7a1a' : '#ffffff', Math.round((4 - Math.abs(y)) * 1.3) + 1, 1);
    digit(px, 2, 3, n, state === 'hit' ? '#7a4a00' : '#ffffff');
  });
}
/** pressure plate (Lost Vikings exit rule), on = pressed + glowing */
export function plateCanvas(on) {
  return pixelCanvas(30, 8, (g, px) => {
    px(0, 3, OUT, 30, 5); px(1, 4, '#6b6b72', 28, 3); px(1, 4, '#9a9aa2', 28, 1);
    px(3, on ? 1 : 0, OUT, 24, on ? 3 : 4); px(4, on ? 2 : 1, on ? '#ffe14d' : '#c42a3a', 22, on ? 1 : 2);
    if (on) { px(5, 2, '#ffffff', 5, 1); px(2, 0, '#ffe14d', 1, 1); px(27, 0, '#ffe14d', 1, 1); px(14, 0, '#fff6b0', 2, 1); }
  });
}
/** a rising-note block (Ricky's pitch ramp) */
export function noteBlock(hue) {
  return pixelCanvas(12, 12, (g, px) => {
    px(0, 0, OUT, 12, 12); px(1, 1, hue, 10, 10); px(1, 1, '#ffffff', 10, 1);
    px(6, 3, '#ffffff', 1, 5); px(4, 7, '#ffffff', 3, 2); px(7, 3, '#ffffff', 2, 1); px(8, 4, '#ffffff', 1, 1);
  });
}
/** lift platform (2 bricks wide, with rails) */
export function liftCanvas() {
  return pixelCanvas(32, 8, (g, px) => {
    px(0, 0, OUT, 32, 8); px(1, 1, '#2bb4e8', 30, 6); px(1, 1, '#9ee6ff', 30, 1); px(1, 6, '#1a6a9a', 30, 1);
    for (let x = 4; x < 30; x += 6) px(x, 3, '#ffffff', 2, 2);
  });
}
export function arrowUp(c = '#9ee6ff') { return pixelCanvas(7, 8, (g, px) => { px(3, 0, c, 1, 8); px(2, 1, c, 3, 1); px(1, 2, c, 5, 1); px(0, 3, c, 7, 1); }); }

// ------------------------------------------------------------------ FX shapes
/** "︵" arc opening downward (rising sound wave) of radius r */
export function waveUp(r, c1 = '#c8fbff', c2 = '#2ee6ff') {
  const W = 2 * r + 3, H = r + 3;
  return pixelCanvas(W, H, (g, px) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - W / 2, dy = (H - 0.5) - y; const d = Math.hypot(dx, dy); const ang = Math.abs(Math.atan2(dx, dy));
      if (ang > 0.95) continue;
      if (Math.abs(d - r) < 1.0) px(x, y, c1); else if (Math.abs(d - r) < 2.0) px(x, y, c2);
    }
  });
}
/** full ring (sound ring = the runtime), dashed if dash > 0 */
export function ringCanvas(r, c1 = '#c8fbff', c2 = '#2bb4e8', dash = 0) {
  const S = 2 * r + 5;
  return pixelCanvas(S, S, (g, px) => {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - S / 2, dy = y + 0.5 - S / 2; const d = Math.hypot(dx, dy);
      if (dash && Math.floor((Math.atan2(dy, dx) + Math.PI) * r / dash) % 2) continue;
      if (Math.abs(d - r) < 0.8) px(x, y, c1); else if (Math.abs(d - r) < 1.8) px(x, y, c2);
    }
  });
}
export function streakV(len, c = '#5a7ac8') { return pixelCanvas(1, len, (g, px) => { px(0, 0, c, 1, len); }); }
export function dot(c, s = 1) { return pixelCanvas(s, s, (g, px) => px(0, 0, c, s, s)); }
/** comic impact burst (white star lines) */
export function impactCanvas(r = 14, c = '#ffffff') {
  const S = 2 * r + 1;
  return pixelCanvas(S, S, (g, px) => {
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.2; for (let d = r * 0.45; d < r; d += 0.5) px(Math.round(r + Math.cos(a) * d), Math.round(r + Math.sin(a) * d), k % 2 ? '#ffe14d' : c); }
  });
}
/** frame outline (UI highlight) */
export function frameCanvas(w, h, c = PAL.gold) { return pixelCanvas(w, h, (g, px) => { px(0, 0, c, w, 1); px(0, h - 1, c, w, 1); px(0, 0, c, 1, h); px(w - 1, 0, c, 1, h); px(1, 1, '#ffffff', 2, 1); }); }
/** cord (rope/strap) between two points, 1 px */
export function ropeCanvas(x0, y0, x1, y1, c = '#3a2a10') {
  const minx = Math.min(x0, x1), miny = Math.min(y0, y1), W = Math.abs(x1 - x0) + 1, H = Math.abs(y1 - y0) + 1;
  return { cv: pixelCanvas(W, H, (g, px) => { const n = Math.max(W, H); for (let i = 0; i <= n; i++) px(Math.round(x0 - minx + (x1 - x0) * i / n), H - 1 - Math.round(y0 - miny + (y1 - y0) * i / n), c); }), x: minx, y: miny };
}
