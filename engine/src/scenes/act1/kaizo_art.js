// Procedural pixel art for LEVEL 1-1 (graphite draft world) and the VOID. All painted in code.
import { pixelCanvas } from '../../core/gfx.js';
import { raster } from '../../core/text.js';
import { PAL, hexToRgb } from '../../core/palette.js';
import { mulberry32, vnoise } from '../../util.js';

/** far hills: sketchy graphite outline + light hatching, tileable (w px) */
export function hillsCanvas(w = 512, h = 70, seed = 2) {
  return pixelCanvas(w, h, (g, px) => {
    const H = (x) => Math.round(h - 18 - 34 * (vnoise(x * 0.012, 0, seed) * 0.7 + vnoise(x * 0.04, 1, seed) * 0.3));
    for (let x = 0; x < w; x++) {
      const y = H(x), y2 = H((x + 1) % w);
      for (let yy = Math.min(y, y2); yy <= Math.max(y, y2); yy++) px(x, yy, PAL.g3);
      for (let yy = y + 2; yy < h; yy++) if ((x + yy) % 5 === 0 && yy < y + 12) px(x, yy, PAL.g5);
    }
  });
}
/** mid ruins: sketched columns, arches and cypresses (graphite lines on transparent) */
export function ruinsCanvas(w = 640, h = 96, seed = 4) {
  const r = mulberry32(seed);
  return pixelCanvas(w, h, (g, px) => {
    let x = 10;
    while (x < w - 40) {
      const kind = r();
      if (kind < 0.45) { // column
        const ch = 40 + Math.floor(r() * 40), cw = 10;
        px(x, h - ch, PAL.g2, cw, 1); px(x - 2, h - ch - 3, PAL.g2, cw + 4, 3); px(x, h - ch, PAL.g2, 1, ch); px(x + cw - 1, h - ch, PAL.g2, 1, ch);
        for (let k = 2; k < cw - 2; k += 3) for (let y = h - ch + 4; y < h; y += 2) px(x + k, y, PAL.g4);
        if (r() < 0.4) px(x - 1, h - ch - 8 - Math.floor(r() * 6), PAL.g3, 8, 2); // broken capital fragment
        x += cw + 14 + Math.floor(r() * 30);
      } else if (kind < 0.7) { // cypress
        const ch = 30 + Math.floor(r() * 30);
        for (let y = 0; y < ch; y++) { const ww = Math.round(4 * Math.sin(Math.PI * (y / ch) ** 0.7)) + 1; px(x + 4 - ww, h - y, PAL.g3); px(x + 4 + ww, h - y, PAL.g3); if (y % 3 === 0) px(x + 4, h - y, PAL.g4, 1, 1); }
        x += 22 + Math.floor(r() * 30);
      } else { // arch
        const aw = 34, ah = 44;
        for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; px(x + Math.round(aw / 2 - Math.cos(a) * (aw / 2 - 4)), h - ah + 8 - Math.round(Math.sin(a) * 12), PAL.g2, 2, 2); }
        px(x, h - ah + 8, PAL.g2, 4, ah - 8); px(x + aw - 4, h - ah + 8, PAL.g2, 4, ah - 8);
        x += aw + 20 + Math.floor(r() * 30);
      }
    }
  });
}
/** a graphite stone pillar (chain anchor) */
export function pillarCanvas(h = 64) {
  return pixelCanvas(16, h, (g, px) => {
    px(0, 0, PAL.g0, 16, 6); px(1, 1, PAL.g4, 14, 4); px(2, 6, PAL.g0, 12, h - 6); px(3, 6, PAL.g4, 10, h - 6);
    for (let y = 8; y < h; y += 2) { px(5, y, PAL.g3); px(8, y, PAL.g3); px(11, y, PAL.g3); }
    px(12, 6, PAL.g2, 1, h - 6);
  });
}
export function spikeCanvas(w = 32) {
  return pixelCanvas(w, 10, (g, px) => {
    for (let s = 0; s < w; s += 8) for (let y = 0; y < 10; y++) { const half = Math.floor((y + 1) * 4 / 10); px(s + 4 - half, y, PAL.g0, 2 * half, 1); if (half > 1) px(s + 4 - half + 1, y, PAL.g4, 1, 1); }
  });
}
/** chain link sprites (hyperlink blue / visited purple), two orientations */
export function linkCanvas(c, hi, vertical) {
  return vertical ? pixelCanvas(4, 6, (g, px) => { px(0, 1, c, 4, 4); px(1, 0, c, 2, 6); px(1, 2, '#00000000', 2, 2); g.clearRect(1, 2, 2, 2); px(0, 1, hi, 1, 2); })
    : pixelCanvas(6, 4, (g, px) => { px(1, 0, c, 4, 4); px(0, 1, c, 6, 2); g.clearRect(2, 1, 2, 2); px(1, 0, hi, 2, 1); });
}
/** CJK character as a chunky white block platform with a blue extrusion (VOID, k05). Returns canvas at 1x;
 *  scale the Quad x3 for 36 px characters. */
export function extrudedChar(ch, { face = '#ffffff', ex = ['#7aa2ff', '#4f78e8', '#2f4fb8'], outline = '#0a1030' } = {}) {
  const r = raster({ text: ch, font: 'fp12', color: face });
  const src = r.canvas.getContext('2d').getImageData(0, 0, r.w, r.h).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < r.w && y < r.h && src[(y * r.w + x) * 4 + 3] > 0;
  const D = 2, W = r.w + D + 2, H = r.h + D + 2;
  return pixelCanvas(W, H, (g, px) => {
    for (let k = D; k >= 1; k--) for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (on(x, y)) px(x + 1 + k, y + 1 + k, ex[Math.min(ex.length - 1, k)]);
    for (let y = -1; y <= r.h; y++) for (let x = -1; x <= r.w; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) px(x + 1, y + 1, outline);
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (on(x, y)) px(x + 1, y + 1, face);
  });
}
/** wireframe cube gizmo (isometric, 1px blue lines) */
export function cubeCanvas(s = 18, c = PAL.gizmoBlue, dashed = false) {
  const o = Math.round(s * 0.45);
  return pixelCanvas(s + o + 1, s + o + 1, (g, px) => {
    const line = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { if (dashed && (i >> 1) % 2) continue; px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); } };
    const F = [[0, o], [s, o], [s, o + s], [0, o + s]], B = F.map(([x, y]) => [x + o, y - o]);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; line(...F[i], ...F[j]); line(...B[i], ...B[j]); line(...F[i], ...B[i]); }
  });
}
export function axisGizmoCanvas() {
  return pixelCanvas(28, 28, (g, px) => {
    px(6, 6, '#3ad06a', 2, 18); px(5, 2, '#3ad06a', 4, 4);       // y (green, up)
    px(6, 21, '#e8344a', 18, 2); px(23, 20, '#e8344a', 4, 4);    // x (red, right)
    for (let i = 0; i < 6; i++) px(6 - i, 22 + i * 0.7 | 0, '#3d7bff', 2, 2); // z (blue)
  });
}
/** the giant 'life' marquee sign: block letters with bulbs; lit = bright */
export function lifeSign(lit) {
  const r = raster({ text: 'life', font: 'px', color: '#ffffff' });
  const src = r.canvas.getContext('2d').getImageData(0, 0, r.w, r.h).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < r.w && y < r.h && src[(y * r.w + x) * 4 + 3] > 0;
  const c = 6, W = r.w * c + 12, H = r.h * c + 12;
  return pixelCanvas(W, H, (g, px) => {
    px(0, 0, lit ? '#3a2f10' : PAL.g1, W, H); px(2, 2, lit ? '#1a1408' : PAL.g4, W - 4, H - 4);
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (on(x, y)) {
      const X = 6 + x * c, Y = 6 + y * c;
      px(X, Y, lit ? '#fff6d0' : PAL.g2, c - 1, c - 1);
      px(X + 2, Y + 2, lit ? '#ffffff' : PAL.g3, 2, 2);
    }
    for (let x = 4; x < W - 4; x += 6) { px(x, 1, lit ? '#ffd23f' : PAL.g2, 2, 1); px(x, H - 2, lit ? '#ffd23f' : PAL.g2, 2, 1); }
  });
}
/** floor tile with a letter (the lyric is the floor): graphite version and bloomed (coloured) version */
export function letterTile(ch, bloom, hue) {
  const r = ch === ' ' ? null : raster({ text: ch, font: 'px', color: '#ffffff' });
  const src = r ? r.canvas.getContext('2d').getImageData(0, 0, r.w, r.h).data : null;
  return pixelCanvas(9, 10, (g, px) => {
    px(0, 0, PAL.g0, 9, 10);
    px(0, 1, bloom ? hue : PAL.paperHi, 9, 9);
    if (bloom) px(0, 1, '#ffffff', 9, 1);
    if (!r) return;
    const ox = Math.floor((9 - Math.min(8, r.w)) / 2);
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (src[(y * r.w + x) * 4 + 3] > 0) px(ox + x, 2 + y - (r.h > 8 ? 1 : 0), bloom ? '#ffffff' : PAL.ink);
  });
}
/** coloured floor cap tile (每一天 都是色彩): rainbow fill with a pencil-hatch edge */
export function colorCap(hue) {
  const [r, g0, b] = hexToRgb(hue);
  const lo = `rgb(${r * 0.7 | 0},${g0 * 0.7 | 0},${b * 0.7 | 0})`;
  return pixelCanvas(16, 10, (g, px) => { px(0, 0, PAL.g0, 16, 10); px(1, 1, hue, 14, 8); px(1, 1, '#ffffff', 14, 1); for (let i = 0; i < 6; i++) px(3 + i * 2, 4 + (i % 2), lo, 1, 3); px(15, 0, lo, 1, 10); });
}
