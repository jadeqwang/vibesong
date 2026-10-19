// TYPE (v4 Pass B, unit type): canvas-only drawing helpers for the lyric type overlays (no three.js here, so a dev page
// can draw the same type over a still). Everything is a pure function of its arguments (seeded grain, no Math.random).
//
//   HanziVec      Make Me a Hanzi outlines + medians as Path2D; draws a glyph stroke by stroke in TRUE stroke order
//                 (the video's title device: 一笔一画 = stroke by stroke), each stroke revealed along its median.
//   graphiteGlyph the big-character look: a graphite pencil fill (grain + streaks along the hatch), a soft graphite
//                 smudge that creeps out after the stroke lands (Moongazing's "ink creeping into the paper"), an optional
//                 paper-light halo for legibility over busy 3D, and a coloured point at the pencil tip while it draws
//                 (the colour rule: before 1:59 colour only at the tip and on what she just drew).
//   gloss         the small gloss under a big character, in the page's own hand (LXGW WenKai), written in left to right.
//   pixelText     a pixel-font line (Fusion Pixel / Silkscreen via core/text.js raster) scaled by whole game pixels.
import { raster } from '../../core/text.js';
import { mulberry32, vnoise } from '../../util.js';

export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const easeOut = (u) => 1 - (1 - clamp01(u)) ** 3;

const DATA = new Map();
export async function loadHanziVec(ch) {
  if (!DATA.has(ch)) {
    const r = await fetch(`/hanzi/${encodeURIComponent(ch)}`);
    if (!r.ok) throw new Error('type: hanzi not found ' + ch);
    DATA.set(ch, new HanziVec(await r.json()));
  }
  return DATA.get(ch);
}

export class HanziVec {
  constructor(d) {
    this.ch = d.character;
    this.paths = d.strokes.map((s) => new Path2D(s));
    this.med = d.medians.map((m) => m.map(([x, y]) => [x, y]));
    this.len = this.med.map((m) => { let L = 0; for (let i = 1; i < m.length; i++) L += Math.hypot(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]); return Math.max(1, L); });
    this.n = this.paths.length;
  }
  /** point at fraction p along stroke i's median (font units, y up) */
  at(i, p) {
    const m = this.med[i]; let want = clamp01(p) * this.len[i];
    for (let k = 1; k < m.length; k++) {
      const d = Math.hypot(m[k][0] - m[k - 1][0], m[k][1] - m[k - 1][1]);
      if (want <= d || k === m.length - 1) { const u = d > 0 ? Math.min(1, want / d) : 0; return [m[k - 1][0] + (m[k][0] - m[k - 1][0]) * u, m[k - 1][1] + (m[k][1] - m[k - 1][1]) * u]; }
      want -= d;
    }
    return m[m.length - 1];
  }
  /** the glyph's mask (opaque white) into g, in a box of S px with its top-left at (0,0). prog[i] = 0..1 per stroke */
  mask(g, S, prog, { color = '#ffffff', width = 190 } = {}) {
    g.save(); g.scale(S / 1024, S / 1024); g.translate(0, 900); g.scale(1, -1);
    g.fillStyle = color; g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = width;
    for (let i = 0; i < this.n; i++) {
      const p = prog[i] || 0; if (p <= 0) continue;
      if (p >= 1) { g.fill(this.paths[i]); continue; }
      g.save(); g.clip(this.paths[i]);
      const m = this.med[i]; let want = p * this.len[i];
      g.beginPath(); g.moveTo(m[0][0], m[0][1]);
      for (let k = 1; k < m.length && want > 0; k++) {
        const d = Math.hypot(m[k][0] - m[k - 1][0], m[k][1] - m[k - 1][1]);
        if (want >= d) { g.lineTo(m[k][0], m[k][1]); want -= d; } else { const u = want / d; g.lineTo(m[k - 1][0] + (m[k][0] - m[k - 1][0]) * u, m[k - 1][1] + (m[k][1] - m[k - 1][1]) * u); want = 0; }
      }
      g.stroke(); g.restore();
    }
    g.restore();
  }
  /** the pencil tip: the head of the stroke being drawn (in box px, y down) or null */
  tip(S, prog) {
    for (let i = 0; i < this.n; i++) { const p = prog[i] || 0; if (p > 0 && p < 1) { const [x, y] = this.at(i, p); return { x: x * S / 1024, y: (900 - y) * S / 1024, stroke: i }; } }
    return null;
  }
}

/** per-stroke progress for a schedule [{a, b}] (start/end time of each stroke) at time t */
export function progAt(sched, t) { return sched.map(({ a, b }) => (t <= a ? 0 : t >= b ? 1 : easeOut((t - a) / (b - a)) * 0.98 + 0.02 * ((t - a) / (b - a)))); }
/** strokes back to back: stroke i starts at starts[i], lasts dur (or len-weighted inside [a, b] when starts is null) */
export function schedule(hv, { starts = null, a, b, dur = 0.3, minDur = 0.012 } = {}) {   // fast characters: ~1 frame per stroke is fine (press_start's slams are 0.09-0.16 s per character)
  if (starts) return hv.len.map((_, i) => ({ a: starts[i], b: starts[i] + dur }));
  const W = hv.len.map((L) => 0.35 + L / 600), tot = W.reduce((s, x) => s + x, 0); let u = a;
  return W.map((w) => { const d = Math.max(minDur, (b - a) * w / tot); const r = { a: u, b: u + d * 0.9 }; u += d; return r; });
}

// ------------------------------------------------------------------------------------------------ graphite
const GRAIN = new Map();
/** graphite pencil fill (S x S), seeded: dark core, streaks along a -28 deg hatch, paper tooth showing through */
function grain(S, seed = 7, rgb = [40, 40, 47]) {
  const k = `${S}|${seed}|${rgb}`; if (GRAIN.has(k)) return GRAIN.get(k);
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'); const im = g.createImageData(S, S), d = im.data; const R = mulberry32(seed);
  const ca = Math.cos(-0.49), sa = Math.sin(-0.49), sc = 1024 / S;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = (x * ca - y * sa) * sc, v = (x * sa + y * ca) * sc;
    const streak = vnoise(u * 0.012, v * 0.35, seed) * 0.6 + vnoise(u * 0.03, v * 0.9, seed + 3) * 0.4;   // long along the hatch
    const tooth = R();
    const l = 0.82 + 0.34 * (streak - 0.5) + (tooth > 0.93 ? 0.35 : 0);
    const i = (y * S + x) * 4;
    d[i] = Math.min(255, rgb[0] * l + (tooth > 0.93 ? 40 : 0)); d[i + 1] = Math.min(255, rgb[1] * l + (tooth > 0.93 ? 40 : 0)); d[i + 2] = Math.min(255, rgb[2] * l + (tooth > 0.93 ? 44 : 0));
    d[i + 3] = 255 * (0.86 + 0.14 * streak - (tooth > 0.965 ? 0.45 : 0));
  }
  g.putImageData(im, 0, 0); GRAIN.set(k, cv); return cv;
}
const SCR = new Map();
function scratch(name, S) { const k = name + S; let c = SCR.get(k); if (!c) { c = document.createElement('canvas'); c.width = c.height = S; SCR.set(k, c); } const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.clearRect(0, 0, S, S); return [c, g]; }

/**
 * Draw a big character. o: { x, y (top-left of the S box, canvas px), S, prog[], alpha, halo (0..1 paper-light glow),
 *   haloColor, smudge (0..1 graphite creep), tint: { color, alpha, strokes:[i..] } (a wash on what she just drew),
 *   tip: colour of the pencil point while drawing (null = none), scale (about the box centre), seed, rgb }
 */
export function graphiteGlyph(g, hv, o) {
  const S = Math.max(8, Math.round(o.S)), al = o.alpha ?? 1; if (al <= 0) return;
  const [M, mg] = scratch('m', S); hv.mask(mg, S, o.prog);
  g.save();
  const sc = o.scale ?? 1; g.translate(o.x + S / 2, o.y + S / 2); g.scale(sc, sc); g.translate(-S / 2, -S / 2);
  // paper-light halo (legibility over 3D), then the graphite smudge creeping out
  const tintMask = (color) => { const [H, hg] = scratch('h', S); hg.fillStyle = color; hg.fillRect(0, 0, S, S); hg.globalCompositeOperation = 'destination-in'; hg.drawImage(M, 0, 0); return H; };
  if ((o.halo ?? 0) > 0) { g.globalAlpha = al * o.halo; g.filter = `blur(${(S * 0.045).toFixed(1)}px)`; const H = tintMask(o.haloColor || '#f7f0e0'); g.drawImage(H, 0, 0); g.drawImage(H, 0, 0); g.filter = 'none'; }
  if ((o.smudge ?? 0) > 0) { g.globalAlpha = al * 0.22 * o.smudge; g.filter = `blur(${(S * (0.012 + 0.03 * o.smudge)).toFixed(1)}px)`; g.drawImage(tintMask('#26262c'), 0, 0); g.filter = 'none'; }
  // the graphite itself
  const [F, fg] = scratch('f', S); fg.drawImage(grain(S, o.seed ?? 7, o.rgb), 0, 0); fg.globalCompositeOperation = 'destination-in'; fg.drawImage(M, 0, 0);
  if (o.tint && o.tint.alpha > 0) {   // a soft colour wash on the strokes she just drew
    const [W2, wg] = scratch('w', S); hv.mask(wg, S, o.prog.map((p, i) => (o.tint.strokes ? (o.tint.strokes.includes(i) ? p : 0) : p)));
    wg.globalCompositeOperation = 'source-in'; wg.fillStyle = o.tint.color; wg.fillRect(0, 0, S, S);
    fg.globalCompositeOperation = 'source-atop'; fg.globalAlpha = o.tint.alpha; fg.drawImage(W2, 0, 0); fg.globalAlpha = 1;
  }
  g.globalAlpha = al; g.drawImage(F, 0, 0);
  // the pencil point (the only colour while drawing)
  if (o.tip) {
    const tp = hv.tip(S, o.prog);
    if (tp) {
      const r = S * 0.016; g.globalAlpha = al;
      const gr = g.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, r * 3.2); gr.addColorStop(0, o.tip); gr.addColorStop(0.35, o.tip + 'aa'); gr.addColorStop(1, o.tip + '00');
      g.fillStyle = gr; g.beginPath(); g.arc(tp.x, tp.y, r * 3.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(tp.x, tp.y, r * 0.55, 0, Math.PI * 2); g.fill();
    }
  }
  g.restore();
}

// ------------------------------------------------------------------------------------------------ gloss
/** the small gloss, in the page's own hand, written in left to right over [a, a + dur] (canvas px; y = baseline) */
// n = number of characters written in (float; overrides the a/dur sweep, for a word-by-word reveal)
export function gloss(g, text, { x, y, size, align = 'center', color = '#2a2a31', halo = 0, haloColor = '#f7f0e0', a = 0, dur = 0.6, t = 1e9, alpha = 1, font = 'LXGWWenKai', italic = false, n = null } = {}) {
  const k = n != null ? clamp01(n / Math.max(1, text.length)) : smooth(a, a + dur, t);
  if (k <= 0 || alpha <= 0) return;
  g.save(); g.font = `${italic ? 'italic ' : ''}${Math.round(size)}px "${font}"`; g.textBaseline = 'alphabetic';
  const w = g.measureText(text).width; const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  let cw = (w + size * 1.2) * k + size * 0.1 - size;
  if (n != null) { const i = Math.floor(n), f = n - i; cw = g.measureText(text.slice(0, i)).width + (i < text.length ? f * g.measureText(text[i]).width : size); }
  g.beginPath(); g.rect(x0 - size, y - size * 1.4, size + cw, size * 2.2); g.clip();
  g.globalAlpha = alpha;
  if (halo > 0) {   // a soft paper-light ground under the words (legibility over 3D), never a box
    g.save(); g.filter = `blur(${(size * 0.2).toFixed(1)}px)`; g.globalAlpha = alpha * halo * 0.75; g.strokeStyle = haloColor; g.lineJoin = 'round';
    g.lineWidth = size * 0.4; g.strokeText(text, x0, y); g.restore(); g.globalAlpha = alpha; }
  g.fillStyle = color; g.fillText(text, x0, y);
  g.restore();
  return w;
}

// ------------------------------------------------------------------------------------------------ pixel text
const PXT = new Map();
export function pixelRaster(text, font, color) { const k = `${text}|${font}|${color}`; if (!PXT.has(k)) PXT.set(k, raster({ text, font, color })); return PXT.get(k); }
/** pixel-font text at whole-pixel scale k; (x, yTop) canvas px; reveal = number of characters shown (typewriter) */
export function pixelText(g, text, { x, y, k, font = 'fp10', color = '#ffffff', align = 'left', reveal = Infinity, alpha = 1, cursor = false, cursorColor = '#ffffff' } = {}) {
  if (alpha <= 0) return null;
  const r = pixelRaster(text, font, color); const W = r.w * k, H = r.h * k;
  const x0 = Math.round(align === 'center' ? x - W / 2 : align === 'right' ? x - W : x), y0 = Math.round(y);
  const n = Array.from(text).length; const shown = Math.min(n, Math.max(0, Math.floor(reveal)));
  let cw = r.w; if (shown < n) { const c = r.chars[shown]; cw = c ? c.x : r.w; }
  g.save(); g.imageSmoothingEnabled = false; g.globalAlpha = alpha;
  if (cw > 0) g.drawImage(r.canvas, 0, 0, cw, r.h, x0, y0, cw * k, H);
  if (cursor) { g.fillStyle = cursorColor; g.fillRect(x0 + cw * k + k, y0 + k, Math.max(k, Math.round(r.h * k * 0.08) * 0 + k * 4), H - 2 * k); }
  g.restore();
  return { x0, y0, w: W, h: H, cw: cw * k };
}
