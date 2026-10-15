// PAPER kit for the outro: handwriting (LXGW WenKai, graphite), colored-pencil Hanzi drawn in true stroke order
// (Make Me a Hanzi outlines + medians), a colored-pencil flower, the SHIPPED stamp, a canon pencil sprite, and an
// ink-reveal quad material. All canvases are drawn in code (no text from models). Deterministic (seeded).
import * as THREE from 'three';
import { mulberry32 } from '../../util.js';

export const INK = '#3b3a40';
export const KAI = '"LXGWWenKai"';

/** Quad with a canvas texture; reveal wipes left->right with a ragged pencil edge (uReveal 0..1). */
export class InkQuad extends THREE.Mesh {
  constructor(canvas, w, h, { anchor = 'c' } = {}) {
    const tex = new THREE.CanvasTexture(canvas); tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uReveal: { value: 1 }, uOpacity: { value: 1 }, uSoft: { value: 0.015 } },
      transparent: true, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D map; uniform float uReveal, uOpacity, uSoft; varying vec2 vUv;
        float h(float y){ return fract(sin(y * 91.7) * 43758.5); }
        void main(){ vec4 c = texture2D(map, vUv);
          float edge = uReveal * (1.0 + 2.0 * uSoft) - uSoft + (h(floor(vUv.y * 40.0)) - 0.5) * uSoft;
          float m = 1.0 - smoothstep(edge - uSoft, edge, vUv.x);
          gl_FragColor = vec4(c.rgb, c.a * m * uOpacity); }`,
    });
    const g = new THREE.PlaneGeometry(w, h);
    const off = { c: [0, 0], l: [w / 2, 0], bl: [w / 2, h / 2], tl: [w / 2, -h / 2] }[anchor] || [0, 0];
    g.translate(off[0], off[1], 0);
    super(g, mat);
    this.tex = tex; this.cv = canvas; this.w = w; this.h = h;
  }
  set reveal(v) { this.material.uniforms.uReveal.value = v; }
  set opacity(v) { this.material.uniforms.uOpacity.value = v; }
  refresh() { this.tex.needsUpdate = true; }
}

function grain(g, w, h, seed = 1, amount = 0.22) {
  // erase speckles so strokes look like pencil on toothy paper
  const r = mulberry32(seed); g.save(); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < w * h / 90; i++) { g.fillStyle = `rgba(0,0,0,${amount * r()})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 1.5); }
  g.restore();
}

/** Handwritten text canvas. lines: [string] ; returns { canvas, w, h } (px) */
export function handText(lines, { size = 64, color = INK, align = 'left', lineGap = 1.25, seed = 3, maxW = 0 } = {}) {
  const m = document.createElement('canvas').getContext('2d'); m.font = `${size}px ${KAI}`;
  if (maxW > 0) { // word wrap
    const out = []; for (const l of lines) { let cur = ''; for (const w of l.split(' ')) { const c = cur ? cur + ' ' + w : w; if (m.measureText(c).width > maxW && cur) { out.push(cur); cur = w; } else cur = c; } out.push(cur); }
    lines = out;
  }
  const widths = lines.map((l) => m.measureText(l).width);
  const W = Math.ceil(Math.max(...widths) + size * 0.4), H = Math.ceil(size * lineGap * lines.length + size * 0.4);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.font = `${size}px ${KAI}`; g.fillStyle = color; g.textBaseline = 'alphabetic';
  const r = mulberry32(seed);
  lines.forEach((l, i) => {
    const x = align === 'center' ? (W - widths[i]) / 2 : size * 0.2;
    const y = size * (0.95 + i * lineGap);
    // slight per-line hand wobble
    g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 0.012); g.fillText(l, 0, 0); g.restore();
  });
  grain(g, W, H, seed, 0.35);
  return { canvas: cv, w: W, h: H, n: lines.length };
}

/** Colored-pencil fill helpers */
function hatchIn(g, w, h, color, { step = 5, angle = -0.75, width = 1.6, alpha = 0.55, seed = 1 } = {}) {
  const r = mulberry32(seed); g.save(); g.strokeStyle = color; g.lineWidth = width; g.globalAlpha = alpha;
  const L = Math.hypot(w, h); const ca = Math.cos(angle), sa = Math.sin(angle);
  for (let d = -L; d < L; d += step * (0.8 + 0.4 * r())) {
    g.beginPath(); const cx = w / 2 + d * -sa, cy = h / 2 + d * ca;
    g.moveTo(cx - ca * L, cy - sa * L); g.lineTo(cx + ca * L, cy + sa * L); g.stroke();
  }
  g.restore();
}
export const hsl = (h, s, l) => `hsl(${((h % 1) + 1) % 1 * 360}, ${s * 100}%, ${l * 100}%)`;

/** A Hanzi in colored pencil, drawn stroke by stroke. data = Make Me a Hanzi JSON line. */
export class PencilHanzi {
  constructor(data, { px = 360, hues, seed = 7 } = {}) {
    this.data = data; this.px = px; this.seed = seed;
    this.hues = hues || data.strokes.map((_, i) => i / data.strokes.length);
    this.cv = document.createElement('canvas'); this.cv.width = px; this.cv.height = px;
    this.paths = data.strokes.map((d) => new Path2D(d));
    this.key = '';
  }
  /** progress per stroke array (0..1) -> redraws only when changed */
  draw(prog) {
    const key = prog.map((p) => p.toFixed(3)).join(); if (key === this.key) return false; this.key = key;
    const g = this.cv.getContext('2d'); const s = this.px / 1024;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.px, this.px);
    if (!this.tmp) { this.tmp = document.createElement('canvas'); this.tmp.width = this.tmp.height = this.px; }
    const t2 = this.tmp.getContext('2d');
    this.data.strokes.forEach((_, i) => {
      const p = prog[i] || 0; if (p <= 0) return;
      const pts = medianPrefix(this.data.medians[i], p);
      t2.globalCompositeOperation = 'source-over'; t2.setTransform(1, 0, 0, 1, 0, 0); t2.clearRect(0, 0, this.px, this.px);
      t2.setTransform(s, 0, 0, -s, 0, 900 * s); t2.fillStyle = hsl(this.hues[i], 0.78, 0.6); t2.fill(this.paths[i]);
      t2.setTransform(1, 0, 0, 1, 0, 0); t2.globalCompositeOperation = 'source-atop';
      hatchIn(t2, this.px, this.px, hsl(this.hues[i] + 0.02, 0.85, 0.36), { step: this.px / 90, width: this.px / 260, alpha: 0.5, seed: this.seed + i });
      hatchIn(t2, this.px, this.px, 'rgb(255,250,235)', { step: this.px / 55, angle: 0.6, width: this.px / 400, alpha: 0.4, seed: this.seed + 50 + i });
      t2.globalCompositeOperation = 'destination-in'; t2.setTransform(s, 0, 0, -s, 0, 900 * s);
      t2.lineWidth = 200; t2.lineCap = 'round'; t2.lineJoin = 'round'; t2.strokeStyle = '#000';
      t2.beginPath(); pts.forEach(([x, y], k) => (k ? t2.lineTo(x, y) : t2.moveTo(x, y))); t2.stroke();
      g.drawImage(this.tmp, 0, 0);
    });
    grain(g, this.px, this.px, this.seed, 0.4);
    return true;
  }
}
function medianPrefix(med, p) {
  const L = []; let tot = 0; for (let i = 1; i < med.length; i++) { const l = Math.hypot(med[i][0] - med[i - 1][0], med[i][1] - med[i - 1][1]); L.push(l); tot += l; }
  const target = tot * Math.min(1, p) + (p >= 1 ? 80 : 0); const out = [med[0]]; let acc = 0;
  for (let i = 1; i < med.length; i++) {
    if (acc + L[i - 1] >= target) { const u = (target - acc) / L[i - 1]; out.push([med[i - 1][0] + (med[i][0] - med[i - 1][0]) * u, med[i - 1][1] + (med[i][1] - med[i - 1][1]) * u]); return out; }
    acc += L[i - 1]; out.push(med[i]);
  }
  // extend past the end so the clip fills the stroke's tip
  const a = med[med.length - 2], b = med[med.length - 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  out.push([b[0] + (b[0] - a[0]) / d * 80, b[1] + (b[1] - a[1]) / d * 80]);
  return out;
}
/** Colored-pencil flower: grow (0..1 stem+leaves), bloom (0..1 petals). */
export function drawFlower(cv, grow, bloom, sway = 0, seed = 11) {
  const g = cv.getContext('2d'); const W = cv.width, H = cv.height; g.clearRect(0, 0, W, H);
  const r = mulberry32(seed);
  const base = [W * 0.5, H * 0.98], top = [W * 0.5 + sway * W * 0.05, H * (0.98 - 0.62 * grow)];
  g.lineCap = 'round';
  // stem: several jittery pencil passes
  for (let k = 0; k < 4; k++) {
    g.strokeStyle = k < 2 ? '#3f7a32' : '#6aa64a'; g.lineWidth = W * (0.016 - k * 0.002); g.globalAlpha = 0.75;
    g.beginPath(); g.moveTo(base[0] + (r() - 0.5) * 3, base[1]);
    g.quadraticCurveTo(base[0] + W * 0.06 + sway * W * 0.02, (base[1] + top[1]) / 2, top[0] + (r() - 0.5) * 3, top[1]); g.stroke();
  }
  g.globalAlpha = 1;
  // leaves
  const leaf = (u, side) => {
    const lg = Math.min(1, Math.max(0, (grow - u) / 0.3)); if (lg <= 0) return;
    const y = base[1] - (base[1] - top[1]) * u * 0.9 / Math.max(grow, 1e-3) * grow; const x = base[0] + W * 0.03 * u;
    g.save(); g.translate(x, y); g.rotate(side * 0.9); g.scale(lg, lg);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(side * W * 0.12, -H * 0.05, side * W * 0.22, -H * 0.02); g.quadraticCurveTo(side * W * 0.1, H * 0.02, 0, 0);
    g.fillStyle = '#5c9a3e'; g.globalAlpha = 0.85; g.fill(); g.strokeStyle = '#2f5e26'; g.lineWidth = 2; g.stroke(); g.restore();
  };
  leaf(0.3, 1); leaf(0.5, -1);
  // bud / petals
  if (grow > 0.85) {
    const b = Math.max(0, Math.min(1, bloom)); const cx = top[0], cy = top[1];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3 + sway * 0.2; const len = W * (0.05 + 0.17 * b), wid = W * (0.04 + 0.07 * b);
      g.save(); g.translate(cx, cy); g.rotate(a - Math.PI / 2 * (1 - b) * 0.0);
      g.beginPath(); g.ellipse(0, -len * 0.55 * (0.3 + 0.7 * b), wid * 0.5, len * 0.55, 0, 0, Math.PI * 2);
      g.fillStyle = hsl(0.97 + i * 0.025, 0.85, 0.62); g.globalAlpha = 0.9; g.fill();
      g.strokeStyle = hsl(0.95 + i * 0.02, 0.7, 0.4); g.lineWidth = 2; g.globalAlpha = 0.8; g.stroke(); g.restore();
    }
    g.globalAlpha = 1; g.beginPath(); g.arc(cx, cy, W * (0.025 + 0.03 * b), 0, Math.PI * 2); g.fillStyle = '#f2b52f'; g.fill();
    g.strokeStyle = '#b7791f'; g.lineWidth = 2; g.stroke();
  }
  grain(g, W, H, seed, 0.3);
}

/** Red rubber stamp: SHIPPED ✓ (text drawn in code) */
export function stampCanvas() {
  const W = 760, H = 260; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const red = '#c8323a';
  g.strokeStyle = red; g.lineWidth = 14; roundRect(g, 12, 12, W - 24, H - 24, 26); g.stroke();
  g.lineWidth = 5; roundRect(g, 32, 32, W - 64, H - 64, 16); g.stroke();
  g.fillStyle = red; g.font = `900 132px "InterVar"`; g.textBaseline = 'middle'; g.fillText('SHIPPED', 62, H / 2 + 6);
  // check mark (drawn, not a glyph)
  g.lineWidth = 26; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(W - 150, H / 2 + 4); g.lineTo(W - 112, H / 2 + 44); g.lineTo(W - 48, H / 2 - 50); g.stroke();
  // ink wear
  const r = mulberry32(5); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${0.15 + 0.6 * r()})`; const s = 1 + r() * 5; g.fillRect(r() * W, r() * H, s, s * 0.7); }
  return cv;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/** Canon pencil seen from above, lying flat (rainbow core + BLUE cap = FUNCTIONS). phase = roll angle (rad). */
export function drawPencil(cv, phase = 0, kind = 'rainbow') {
  const W = cv.width, H = cv.height, g = cv.getContext('2d'); g.clearRect(0, 0, W, H);
  const r = H * 0.36, cy = H / 2, x0 = W * 0.04, xCone = W * 0.82, xTip = W * 0.97;
  // shadow
  g.fillStyle = 'rgba(60,45,30,0.25)'; g.beginPath(); g.ellipse(W * 0.5 + 6, cy + r * 0.9, W * 0.47, r * 0.35, 0, 0, Math.PI * 2); g.fill();
  // body: hex facets as stripes whose positions move with the roll phase
  for (let k = 0; k < 6; k++) {
    const a0 = phase + k * Math.PI / 3, a1 = a0 + Math.PI / 3; const y0 = Math.sin(a0) * r, y1 = Math.sin(a1) * r;
    if (Math.cos(a0 + Math.PI / 6) < 0) continue; // back facets hidden
    const shade = 0.75 + 0.25 * Math.cos(a0 + Math.PI / 6 - 0.6);
    g.fillStyle = `rgb(${242 * shade | 0},${194 * shade | 0},${48 * shade | 0})`;
    g.fillRect(x0 + r * 0.9, cy + Math.min(y0, y1), xCone - x0 - r * 0.9, Math.abs(y1 - y0) + 0.5);
  }
  // cone (wood) + rainbow lead tip
  g.fillStyle = '#e8c08a'; g.beginPath(); g.moveTo(xCone, cy - r); g.lineTo(xTip - W * 0.03, cy - r * 0.3); g.lineTo(xTip - W * 0.03, cy + r * 0.3); g.lineTo(xCone, cy + r); g.closePath(); g.fill();
  const grd = g.createLinearGradient(0, cy - r * 0.3, 0, cy + r * 0.3);
  (kind === 'rainbow' ? ['#ff4d6d', '#ffb02e', '#4fd06a', '#3b7bff', '#a35cff'] : ['#2e2e33', '#4a4a50', '#2e2e33']).forEach((c, i, a) => grd.addColorStop(i / (a.length - 1), c));
  g.fillStyle = grd; g.beginPath(); g.moveTo(xTip - W * 0.03, cy - r * 0.3); g.lineTo(xTip, cy); g.lineTo(xTip - W * 0.03, cy + r * 0.3); g.closePath(); g.fill();
  // ferrule + blue eraser cap
  g.fillStyle = '#c8c8d0'; g.fillRect(x0 + r * 0.45, cy - r * 1.02, r * 0.5, r * 2.04);
  g.fillStyle = kind === 'rainbow' ? '#4f8bff' : '#ff8a5c'; g.beginPath(); g.ellipse(x0 + r * 0.45, cy, r * 0.42, r, 0, Math.PI / 2, Math.PI * 1.5); g.fill(); g.fillRect(x0 + r * 0.42, cy - r, r * 0.06, r * 2);
  g.strokeStyle = 'rgba(80,60,20,0.5)'; g.lineWidth = 1.5; g.strokeRect(x0 + r * 0.9, cy - r, xCone - x0 - r * 0.9, 2 * r);
}
