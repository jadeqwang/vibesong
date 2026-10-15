// Typography. ALL text is rendered in code from OFL fonts in engine/assets/fonts (never images from models).
//
// Fonts (key -> use):
//   px    Press Start 2P 8px    hero type, HUD numbers, banners (Latin caps; scale x2..x6 for hero type)
//   sk    Silkscreen 8px        small caps labels (HUD, cards); skb = bold
//   fp12  Fusion Pixel 12px     in-game Chinese + mixed-case English (subtitle top line, bios, dialogue)
//   fp10  Fusion Pixel 10px     subtitle second line (translation), small CJK
//   fp8   Fusion Pixel 8px      tiny CJK/Latin (debug gizmos, marquee)
//   kai   LXGW WenKai           brush / handwritten (PAPER look), smooth (not binarised)
//   sans  Inter                 clean subtitles for 3D TALOS acts, smooth
// Pixel fonts are rasterised at their native size, glyphs at integer positions, then binarised (alpha >= 128)
// so they are exactly on the game-pixel grid. Make them big by scaling the Quad by an integer (hero type).
//
//   await loadFonts(['kai'])                  (pixel fonts load by default)
//   const r = raster({ text, font:'fp12', color, outline, shadow, align, maxWidth, gradient, spans, reveal })
//   const s = new TextSprite({ text:'PAINT IT', font:'px', gradient:[...], outline:'#000' }); s.place(x,y); s.setScale(4)
//   s.set({ reveal: 12 })  typewriter;  s.set({ spans: [...] }) karaoke colours; re-rasterises only on change
//   blockText('because', { font:'px', cell: 3 })  -> chunky block letters you can stand on (+ per-letter boxes)
import { canvasTex, Quad, pixelCanvas } from './gfx.js';
import { PAL } from './palette.js';

export const FONTS = {
  px: { family: 'PressStart2P', file: 'PressStart2P-Regular.ttf', size: 8 },
  sk: { family: 'SilkscreenR', file: 'Silkscreen-Regular.ttf', size: 8 },
  skb: { family: 'SilkscreenB', file: 'Silkscreen-Bold.ttf', size: 8 },
  fp12: { family: 'FusionPixel12', file: 'fusion-pixel-12px-proportional-zh_hans.ttf', size: 12 },
  fp10: { family: 'FusionPixel10', file: 'fusion-pixel-10px-proportional-zh_hans.ttf', size: 10 },
  fp8: { family: 'FusionPixel8', file: 'fusion-pixel-8px-proportional-zh_hans.ttf', size: 8 },
  kai: { family: 'LXGWWenKai', file: 'LXGWWenKai-Medium.ttf', size: 24, smooth: true, lazy: true },
  sans: { family: 'InterVar', file: 'Inter.ttf', size: 16, smooth: true, lazy: true },
};
const loaded = new Set();
export async function loadFonts(keys = Object.keys(FONTS).filter((k) => !FONTS[k].lazy)) {
  await Promise.all(keys.filter((k) => !loaded.has(k)).map(async (k) => {
    const f = FONTS[k]; const ff = new FontFace(f.family, `url(/assets/fonts/${f.file})`);
    await ff.load(); document.fonts.add(ff); loaded.add(k);
  }));
}

const measureCv = document.createElement('canvas').getContext('2d');
function fontCss(f, size) { return `${size || f.size}px "${f.family}"`; }
const isCJK = (ch) => /[　-鿿＀-￯]/.test(ch);

/** Lay out text into lines of { chars:[{ch,x,adv,color}], w }. */
function layout(spans, f, size, { maxWidth = 1e9, letterSpacing = 0 } = {}) {
  measureCv.font = fontCss(f, size);
  const chars = [];
  for (const sp of spans) for (const ch of Array.from(sp.text)) chars.push({ ch, color: sp.color, span: sp });
  for (const c of chars) c.adv = c.ch === '\n' ? 0 : Math.round(measureCv.measureText(c.ch).width) + letterSpacing;
  const lines = []; let cur = []; let w = 0; let lastBreak = -1;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c.ch === '\n') { lines.push(cur); cur = []; w = 0; lastBreak = -1; continue; }
    cur.push(c); w += c.adv;
    if (c.ch === ' ' || isCJK(c.ch) || c.ch === '·' || c.ch === '，') lastBreak = cur.length;
    if (w > maxWidth && cur.length > 1) {
      let cut = lastBreak > 0 && lastBreak < cur.length ? lastBreak : cur.length - 1;
      const rest = cur.slice(cut); lines.push(cur.slice(0, cut)); cur = rest; w = rest.reduce((s, x) => s + x.adv, 0); lastBreak = -1;
    }
  }
  lines.push(cur);
  return lines.map((ln, li) => {
    while (ln.length && ln[ln.length - 1].ch === ' ') ln.pop();
    if (li > 0) while (ln.length && ln[0].ch === ' ') ln.shift();
    let x = 0; for (const c of ln) { c.x = x; x += c.adv; }
    return { chars: ln, w: x };
  });
}

/**
 * Rasterise text to a binarised pixel canvas.
 * spec: { text | spans:[{text,color}], font, size?, color, outline?, outline8?, shadow?:{dx,dy,color}|true,
 *         align:'left'|'center'|'right', maxWidth, lineGap, letterSpacing, gradient?:[top..bottom colours],
 *         charColor?: (i, ch) => colour, reveal?: number of visible characters, pad }
 * returns { canvas, w, h, chars: [{ch, x, y, w, h, line, i}], ascent, lineH }
 */
export function raster(spec) {
  const f = FONTS[spec.font || 'fp12']; const size = spec.size || f.size;
  const spans = spec.spans || [{ text: String(spec.text ?? ''), color: spec.color || PAL.white }];
  for (const s of spans) if (!s.color) s.color = spec.color || PAL.white;
  const lines = layout(spans, f, size, spec);
  measureCv.font = fontCss(f, size);
  const m = measureCv.measureText('Hg国');
  const ascent = Math.ceil(m.fontBoundingBoxAscent ?? size * 0.8), descent = Math.ceil(m.fontBoundingBoxDescent ?? size * 0.2);
  const lineGap = spec.lineGap ?? 2;
  const glyphH = f.smooth ? ascent + descent : size;
  const lineH = glyphH + lineGap;
  const sh = spec.shadow === true ? { dx: 1, dy: -1, color: PAL.black } : spec.shadow;
  const o = spec.outline ? 1 : 0;
  const pad = spec.pad ?? 0;
  const padL = pad + o + Math.max(0, -(sh?.dx || 0)), padR = pad + o + Math.max(0, sh?.dx || 0);
  const padT = pad + o + Math.max(0, sh?.dy || 0), padB = pad + o + Math.max(0, -(sh?.dy || 0));
  const maxW = Math.max(1, ...lines.map((l) => l.w));
  const W = maxW + padL + padR, H = lines.length * lineH - lineGap + padT + padB;
  const cv = document.createElement('canvas'); cv.width = Math.max(1, W); cv.height = Math.max(1, H);
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.font = fontCss(f, size); g.textBaseline = 'alphabetic';
  const chars = []; let idx = 0;
  const yOff = f.smooth ? ascent : Math.round((size + ascent - descent) / 2); // pixel fonts: centre the em box
  lines.forEach((ln, li) => {
    const ox = spec.align === 'center' ? Math.floor((maxW - ln.w) / 2) : spec.align === 'right' ? maxW - ln.w : 0;
    for (const c of ln.chars) {
      const x = padL + ox + c.x, y = padT + li * lineH;
      const vis = spec.reveal === undefined || idx < spec.reveal;
      if (vis && c.ch !== ' ') { g.fillStyle = spec.charColor ? spec.charColor(idx, c.ch) : c.color; g.fillText(c.ch, x, y + yOff); }
      chars.push({ ch: c.ch, x, y: H - (y + glyphH), w: c.adv, h: glyphH, line: li, i: idx, span: c.span });
      idx++;
    }
  });
  if (!f.smooth) binarise(g, W, H, spec.gradient, padT, lineH, glyphH);
  if (o || sh) decorate(g, W, H, spec.outline, sh, spec.outline8);
  return { canvas: cv, w: W, h: H, chars, ascent, lineH, lines: lines.length };
}

function binarise(g, W, H, gradient, padT, lineH, glyphH) {
  const im = g.getImageData(0, 0, W, H), d = im.data;
  const grad = gradient ? gradient.map((c) => { const v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }) : null;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (d[i + 3] >= 128) {
      d[i + 3] = 255;
      if (grad) { const ly = ((y - padT) % lineH + lineH) % lineH; const k = Math.min(grad.length - 1, Math.max(0, Math.floor(ly / glyphH * grad.length))); d[i] = grad[k][0]; d[i + 1] = grad[k][1]; d[i + 2] = grad[k][2]; }
    } else d[i + 3] = 0;
  }
  g.putImageData(im, 0, 0);
}
function decorate(g, W, H, outline, sh, eight) {
  const im = g.getImageData(0, 0, W, H), d = im.data; const src = new Uint8ClampedArray(d);
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && src[(y * W + x) * 4 + 3] > 0;
  const hex = (c) => { const v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
  const oc = outline ? hex(outline) : null;
  const out = new Uint8ClampedArray(d.length);
  // outline mask = dilation of glyphs
  const om = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (solid(x, y)) { om[y * W + x] = 2; continue; }
    if (oc && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1) || (eight && (solid(x - 1, y - 1) || solid(x + 1, y - 1) || solid(x - 1, y + 1) || solid(x + 1, y + 1))))) om[y * W + x] = 1;
  }
  if (sh) { // shadow = offset copy of glyph+outline mask (dy>0 means down in canvas space? we take dy as world-up)
    const sc = hex(sh.color);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx = x - sh.dx, sy = y + sh.dy; if (sx < 0 || sy < 0 || sx >= W || sy >= H || !om[sy * W + sx]) continue;
      const i = (y * W + x) * 4; out[i] = sc[0]; out[i + 1] = sc[1]; out[i + 2] = sc[2]; out[i + 3] = 255;
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, m = om[y * W + x];
    if (m === 2) { out[i] = src[i]; out[i + 1] = src[i + 1]; out[i + 2] = src[i + 2]; out[i + 3] = 255; }
    else if (m === 1) { out[i] = oc[0]; out[i + 1] = oc[1]; out[i + 2] = oc[2]; out[i + 3] = 255; }
  }
  im.data.set(out); g.putImageData(im, 0, 0);
}

/**
 * A text Quad that re-rasterises only when its spec changes (deterministic: state is a function of the spec).
 * anchor: 'bl' | 'bc' | 'c' | 'tl' | 'tc' | [ax, ay] in texels.
 */
export class TextSprite extends Quad {
  constructor(spec, { anchor = 'bl' } = {}) {
    super(null, 1, 1);
    this.spec = {}; this.anchorMode = anchor; this._key = ''; this.set(spec);
  }
  set(patch) {
    const spec = { ...this.spec, ...patch };
    const key = JSON.stringify(spec, (k, v) => (typeof v === 'function' ? v.toString() : v));
    if (key === this._key) return this;
    this.spec = spec; this._key = key;
    const r = raster(spec); this.r = r;
    if (this.tex) this.tex.dispose();
    this.tex = canvasTex(r.canvas); this.material.setMap(this.tex);
    const a = this.anchorMode;
    this.anchor = Array.isArray(a) ? a : a === 'bc' ? [Math.floor(r.w / 2), 0] : a === 'c' ? [Math.floor(r.w / 2), Math.floor(r.h / 2)]
      : a === 'tl' ? [0, r.h] : a === 'tc' ? [Math.floor(r.w / 2), r.h] : a === 'br' ? [r.w, 0] : [0, 0];
    this.setSize(r.w, r.h);
    return this;
  }
}

/**
 * Chunky block letters built from the font's pixels: each glyph pixel becomes a cell x cell bevelled block.
 * Returns { canvas, w, h, letters: [{ch, x0, x1, canvas}], heightAt(x) } — heightAt gives the top surface
 * (in px from the bottom) of the text at column x, for standing on it.
 */
export function blockText(text, { font = 'px', cell = 3, face = PAL.g3, hi = PAL.g5, lo = PAL.g1, edge = PAL.g0, gap = 0 } = {}) {
  const r = raster({ text, font, color: '#ffffff' });
  const src = r.canvas.getContext('2d').getImageData(0, 0, r.w, r.h).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < r.w && y < r.h && src[(y * r.w + x) * 4 + 3] > 0;
  const W = r.w * cell + 1, H = r.h * cell + 1;
  const draw = (g, x0 = 0, x1 = r.w, colors = { face, hi, lo, edge }) => {
    for (let y = 0; y < r.h; y++) for (let x = x0; x < x1; x++) {
      if (!on(x, y)) continue;
      const X = (x - x0) * cell, Y = y * cell;
      g.fillStyle = colors.edge; g.fillRect(X, Y, cell + 1, cell + 1);
      g.fillStyle = colors.face; g.fillRect(X + 1, Y + 1, cell - 1, cell - 1);
      if (cell >= 3) { g.fillStyle = colors.hi; g.fillRect(X + 1, Y + 1, cell - 1, 1); g.fillRect(X + 1, Y + 1, 1, cell - 1); g.fillStyle = colors.lo; g.fillRect(X + cell - 1, Y + 2, 1, cell - 2); }
    }
  };
  const canvas = pixelCanvas(W, H, (g) => draw(g));
  const letters = r.chars.filter((c) => c.ch !== ' ').map((c) => {
    const x0 = c.x, x1 = c.x + c.w; const lw = (x1 - x0) * cell + 1;
    return { ch: c.ch, x0: x0 * cell, x1: x1 * cell, w: lw, h: H, draw: (colors) => pixelCanvas(lw, H, (g) => draw(g, x0, x1, colors)) };
  });
  const tops = new Int32Array(W).fill(-1);
  for (let x = 0; x < r.w; x++) for (let y = 0; y < r.h; y++) if (on(x, y)) { for (let k = 0; k <= cell; k++) tops[x * cell + k] = Math.max(tops[x * cell + k], (r.h - y) * cell + 1); break; }
  return { canvas, w: W, h: H, letters, heightAt: (x) => tops[Math.max(0, Math.min(W - 1, Math.floor(x)))] };
}
