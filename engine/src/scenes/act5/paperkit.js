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
/** (v4, the one ending) the SAVE COMPLETE · 2026 stamp: same red rubber-stamp build as SHIPPED, one line, no check mark */
export const SAVE_STAMP_TEXT = 'SAVE COMPLETE · 2026';
export function saveStampCanvas() {
  const W = 1600, H = 240; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const red = '#c8323a';
  g.strokeStyle = red; g.lineWidth = 14; roundRect(g, 12, 12, W - 24, H - 24, 26); g.stroke();
  g.lineWidth = 5; roundRect(g, 32, 32, W - 64, H - 64, 16); g.stroke();
  let fs = 128; g.font = `900 ${fs}px "InterVar"`; const w = g.measureText(SAVE_STAMP_TEXT).width; if (w > W - 130) fs = Math.floor(fs * (W - 130) / w);
  g.fillStyle = red; g.font = `900 ${fs}px "InterVar"`; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(SAVE_STAMP_TEXT, W / 2, H / 2 + 6);
  const r = mulberry32(5); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4800; i++) { g.fillStyle = `rgba(0,0,0,${0.15 + 0.6 * r()})`; const s = 1 + r() * 5; g.fillRect(r() * W, r() * H, s, s * 0.7); }
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

// ================================================================== (v4 Pass B, open_close) the ONE page plate
// #01 (opening, graphite, Charlie alone) and #11 (outro, colour, all three) are the same sketchbook page: one paper plate
// (page edge + gutter), two drawings (media/act5/tex/page01*.jpg, page11*.jpg), overlays from
// assets/v4_stills/tools/passB_oc/build_pages.py (text set in code, same as the approved stills). Everything here is in
// 1920x1080 FRAME px (top-left origin, y down), drawn by an ortho camera that spans the frame at any output size.
export const TEX = '/media/act5/tex/';
export const FRAME_W = 1920, FRAME_H = 1080;
export async function loadImg(src) { const img = new Image(); img.src = src; await img.decode(); return img; }
export function imgTex(img, { nearest = false } = {}) {
  const t = new THREE.Texture(img); t.needsUpdate = true;
  if (nearest) { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
  else { t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; }
  return t;
}
const _json = {};
export async function loadJSON(path) { return (_json[path] ||= fetch(path).then((r) => r.json())); }

// the page wipe edge (screen space, q in 0..1, y up): a soft organic pencil edge sweeping left -> right
export const WIPE_GLSL = /* glsl */`
  float pw_h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float pw_vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(pw_h21(i), pw_h21(i+vec2(1,0)), f.x), mix(pw_h21(i+vec2(0,1)), pw_h21(i+vec2(1,1)), f.x), f.y); }
  // > 0 ahead of the edge (not yet wiped), < 0 behind it
  float pw_d(vec2 q, float u){ float e = q.x * 0.86 + (1.0 - q.y) * 0.14 + (pw_vn(q * vec2(3.0, 9.0)) - 0.5) * 0.07 + (pw_vn(q * 60.0) - 0.5) * 0.015; return e - (u * 1.3 - 0.12); }
  vec3 pw_hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }`;
const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
/** uWipe < 0: off. uWipeDir +1: the layer is wiped AWAY (visible ahead of the edge), -1: wiped IN (visible behind it) */
const LAYER_FS = /* glsl */`uniform sampler2D map; uniform float uOp, uReveal, uSoft, uWipe, uWipeDir; uniform vec3 uTint; uniform vec2 uRes; varying vec2 vUv;
  ${WIPE_GLSL}
  float lh(float y){ return fract(sin(y * 91.7) * 43758.5); }
  void main(){ vec4 c = texture2D(map, vUv);
    float edge = uReveal * (1.0 + 2.0 * uSoft) - uSoft + (lh(floor(vUv.y * 40.0)) - 0.5) * uSoft;
    float m = 1.0 - smoothstep(edge - uSoft, edge, vUv.x);
    if (uWipe >= 0.0) { float d = pw_d(gl_FragCoord.xy / uRes, uWipe) * uWipeDir; m *= smoothstep(-0.004, 0.012, d); }
    gl_FragColor = vec4(c.rgb * uTint, c.a * m * uOp); }`;

/** A textured quad in frame px. anchor = the point (sprite px from its top-left) that sits at (x, y) and that it rotates about. */
export class FrameLayer extends THREE.Mesh {
  constructor(tex, w, h, { res, anchor = [0, 0], z = 0 } = {}) {
    const g = new THREE.PlaneGeometry(w, h); g.translate(w / 2 - anchor[0], -(h / 2 - anchor[1]), 0);
    super(g, new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uOp: { value: 1 }, uReveal: { value: 1 }, uSoft: { value: 0.0001 }, uWipe: { value: -1 }, uWipeDir: { value: 1 },
      uTint: { value: new THREE.Color(1, 1, 1) }, uRes: { value: res } }, transparent: true, depthTest: false, depthWrite: false, vertexShader: VS, fragmentShader: LAYER_FS }));
    this.w = w; this.h = h; this.renderOrder = z;
  }
  place(x, y, rotDeg = 0, s = 1) { this.position.set(x, -y, 0); this.rotation.z = -rotDeg * Math.PI / 180; this.scale.setScalar(s); return this; }
  set opacity(v) { this.material.uniforms.uOp.value = v; }
  set reveal(v) { this.material.uniforms.uReveal.value = v; }
  set soft(v) { this.material.uniforms.uSoft.value = v; }
  wipe(u, dir = 1) { this.material.uniforms.uWipe.value = u; this.material.uniforms.uWipeDir.value = dir; }
}
/** the band of pencil hatching that rides the wipe edge (graphite, or rainbow for the colour wipe) */
export class WipeBand extends THREE.Mesh {
  constructor(res, { rainbow = false, z = 50 } = {}) {
    super(new THREE.PlaneGeometry(FRAME_W, FRAME_H), new THREE.ShaderMaterial({ uniforms: { uWipe: { value: -1 }, uRes: { value: res }, uRainbow: { value: rainbow ? 1 : 0 } },
      transparent: true, depthTest: false, depthWrite: false, vertexShader: VS, fragmentShader: /* glsl */`uniform float uWipe, uRainbow; uniform vec2 uRes; varying vec2 vUv;
      ${WIPE_GLSL}
      void main(){ if (uWipe < 0.0 || uWipe >= 1.0) discard; vec2 q = gl_FragCoord.xy / uRes; float d = pw_d(q, uWipe);
        float band = smoothstep(-0.006, 0.006, d) * (1.0 - smoothstep(0.012, 0.07, d));
        vec2 a = vec2(q.x * uRes.x / uRes.y, q.y);
        float hatch = smoothstep(0.35, 0.6, fract((a.x - a.y) * 150.0 + pw_vn(a * 25.0) * 0.8));
        vec3 c = uRainbow > 0.5 ? pw_hue(a.y * 1.4 + a.x * 0.25) * 0.95 : vec3(0.22, 0.215, 0.235);
        gl_FragColor = vec4(c, band * hatch * (uRainbow > 0.5 ? 0.8 : 0.55)); }` }));
    this.position.set(FRAME_W / 2, -FRAME_H / 2, 0); this.renderOrder = z;
  }
  set wipe(u) { this.material.uniforms.uWipe.value = u; }
}
/** the pencil's shadow on the page: the pencil's blurred alpha, sheared so it meets the tip on the paper and falls away
 *  toward the cap (light from the upper left), plus a uniform drop while the pencil is lifted */
export class PencilShadow extends THREE.Mesh {
  constructor(tex, P, res, { z = 8, color = 0x3c2d1e } = {}) {
    const pad = P.shadow_pad, w = P.w + 2 * pad, h = P.h + 2 * pad;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2)); g.setIndex([0, 2, 1, 2, 3, 1]);
    super(g, new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uOp: { value: 0.42 }, uCol: { value: new THREE.Color(color) }, uWipe: { value: -1 }, uWipeDir: { value: 1 }, uRes: { value: res } },
      transparent: true, depthTest: false, depthWrite: false, vertexShader: VS, fragmentShader: /* glsl */`uniform sampler2D map; uniform float uOp, uWipe, uWipeDir; uniform vec3 uCol; uniform vec2 uRes; varying vec2 vUv;
      ${WIPE_GLSL}
      void main(){ float a = texture2D(map, vUv).r * uOp; if (uWipe >= 0.0) a *= smoothstep(-0.004, 0.012, pw_d(gl_FragCoord.xy / uRes, uWipe) * uWipeDir); gl_FragColor = vec4(uCol, a); }` }));
    this.P = P; this.pad = pad; this.sw = w; this.sh = h; this.renderOrder = z; this.frustumCulled = false;
  }
  /** tip (frame px), angle (deg, y down), lift (px above its touch point), k = shadow spread per px of pencil length */
  set(tip, angDeg, lift = 0, k = [0.2, 0.13]) {
    const P = this.P, a = angDeg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), pos = this.geometry.attributes.position.array;
    const corners = [[-this.pad, -this.pad], [P.w + this.pad, -this.pad], [-this.pad, P.h + this.pad], [P.w + this.pad, P.h + this.pad]];
    corners.forEach(([sx, sy], i) => {
      const lx = sx - P.tip[0], ly = sy - P.tip[1];               // sprite px relative to the tip (x toward the tip = +)
      const fx = tip[0] + lx * ca - ly * sa, fy = tip[1] + lx * sa + ly * ca;
      const dist = Math.max(0, -lx);                               // length from the tip toward the cap
      const ox = (dist + lift * 1.3) * k[0] + lift * 0.25, oy = (dist + lift * 1.3) * k[1] + lift * 0.9;
      pos[i * 3] = fx + ox; pos[i * 3 + 1] = -(fy + oy); pos[i * 3 + 2] = 0;
    });
    this.geometry.attributes.position.needsUpdate = true;
  }
  wipe(u, dir = 1) { this.material.uniforms.uWipe.value = u; this.material.uniforms.uWipeDir.value = dir; }
}
/** Loads the page kit: { scene, cam, lay, layer(name, opts), page(which) }. Textures are full (1920) or half (960) by output size. */
export async function pageKit(ctx) {
  const res = new THREE.Vector2(ctx.width, ctx.height), half = ctx.height <= 540;
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(0, FRAME_W, 0, -FRAME_H, -10, 10);
  const lay = await loadJSON(TEX + 'page_layout.json');
  const kit = {
    scene, cam, lay, res,
    async page(which, z = 0) {   // 'page01' | 'page11' | 'page_plate': the full-frame drawing
      const t = imgTex(await loadImg(`${TEX}${which}${half ? '_half' : ''}.jpg`));
      const q = new FrameLayer(t, FRAME_W, FRAME_H, { res, z }); q.place(0, 0); scene.add(q); return q;
    },
    async layer(name, { z = 5, anchor, at } = {}) {   // an overlay at its built placement (or `at`)
      const L = lay[name]; const t = imgTex(await loadImg(`${TEX}${name}.png`));
      const q = new FrameLayer(t, L.w, L.h, { res, z, anchor }); if (!anchor) q.place(...(at || [L.x, L.y])); scene.add(q); return q;
    },
    async shadow(name = 'pencil01', z = 8) {
      const t = imgTex(await loadImg(`${TEX}${name}_shadow.png`)); const s = new PencilShadow(t, lay[name], res, { z }); scene.add(s); return s;
    },
    render(r, target) { r.setRenderTarget(target); r.render(scene, cam); },
  };
  return kit;
}
