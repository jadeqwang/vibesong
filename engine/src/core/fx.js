// FX: everything is a pure function of t (and of event times), so frames can be rendered in any order.
//
// Time warps (scene time vs song time):
//   freeze(t, a, b)                 hold the scene at a while a <= t < b (freeze-frame), shifted after if `shift`
//   stutter(t, hits, { hold })      repeat frames: scene time jumps to each hit and holds `hold` s (frame-stutter)
//   chain(t, ...warps)              compose
// Camera:
//   shake(t, events, { amp, dur, freq, seed })  -> [dx, dy] integer game px, decaying after each event
// Flash: stage.fx.flash = T.exactFrame(t, times) ? 1 : 0     (1-frame white flash, composited over everything)
//
// Batch: immediate-mode instanced sprites (particles, flowers, crumbs, tiles, debris). Register small canvases
// in an Atlas once, then every frame: batch.begin(); batch.draw('flower0', x, y, {...}); batch.end().
// Particle presets (dust, crumbs, sparkle, petals) are pure functions of (t - t0) and a seed.
//
// Backgrounds (world-locked shader quads that cover the camera view):
//   PaperBG  cream paper with a faint 16-bit dither grain + optional ruled lines + 'blank' (erased) mask
//   BlueprintBG  VOID: black, blueprint grid (minor 8 / major 32 px), optional scanline flicker
//   checker overlay via PaperBG.u.uMissing (purple/black missing-texture creeping in by noise threshold)
import * as THREE from 'three';
import { pixelCanvas, canvasTex } from './gfx.js';
import { PAL } from './palette.js';
import { mulberry32 } from '../util.js';

// ------------------------------------------------------------------ time warps
export function freeze(t, a, b, { shift = false } = {}) { if (t >= a && t < b) return a; return t >= b && shift ? t - (b - a) : t; }
/** frame stutter: inside [start, end) scene time is held at the most recent hit (+ `play` s of motion) */
export function stutter(t, hits, { start = hits[0], end = hits[hits.length - 1], play = 0.067, hold = 1e9 } = {}) {
  if (t < start || t >= end) return t;
  let h = start; for (const x of hits) if (x <= t) h = x;
  const d = t - h;
  return d < play ? t : h + play + Math.max(0, d - play - hold);
}
export function chain(t, ...ws) { return ws.reduce((tt, w) => w(tt), t); }

// ------------------------------------------------------------------ shake
function hash1(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export function shake(t, events, { amp = 2, dur = 0.25, freq = 30, seed = 1 } = {}) {
  let dx = 0, dy = 0;
  for (const e of events) {
    const s = t - e; if (s < 0 || s > dur) continue;
    const k = Math.floor(s * freq), a = amp * (1 - s / dur);
    dx += (hash1(k + seed * 13.1 + e) - 0.5) * 2 * a; dy += (hash1(k * 1.7 + seed * 7.3 + e) - 0.5) * 2 * a;
  }
  return [Math.round(dx), Math.round(dy)];
}

// ------------------------------------------------------------------ atlas + batch
export class Atlas {
  constructor(size = 1024) { this.size = size; this.cv = pixelCanvas(size, size); this.g = this.cv.getContext('2d'); this.map = new Map(); this.x = 1; this.y = 1; this.rowH = 0; this.tex = null; }
  add(name, cv, anchor = [cv.width / 2, cv.height / 2]) {
    if (this.map.has(name)) return this;
    if (this.x + cv.width + 1 > this.size) { this.x = 1; this.y += this.rowH + 1; this.rowH = 0; }
    this.g.drawImage(cv, this.x, this.y);
    this.map.set(name, { x: this.x, y: this.y, w: cv.width, h: cv.height, anchor });
    this.x += cv.width + 1; this.rowH = Math.max(this.rowH, cv.height);
    if (this.tex) this.tex.needsUpdate = true;
    return this;
  }
  /** add every frame of a sprite strip image as name0, name1, ... */
  addStrip(name, img, fw, fh, n, anchor) { for (let i = 0; i < n; i++) { const cv = pixelCanvas(fw, fh, (g) => g.drawImage(img, i * fw, 0, fw, fh, 0, 0, fw, fh)); this.add(name + i, cv, anchor || [fw / 2, 0]); } return this; }
  texture() { if (!this.tex) this.tex = canvasTex(this.cv); return this.tex; }
}

const BVS = /* glsl */`
  attribute vec4 aRect; attribute vec4 aTint; varying vec2 vUv; varying vec4 vTint; varying float vWX;
  void main(){ vUv = aRect.xy + uv * aRect.zw; vTint = aTint; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vWX = w.x; gl_Position = projectionMatrix * viewMatrix * w; }`;
const BFS = /* glsl */`
  uniform sampler2D map; uniform float clipX; varying vec2 vUv; varying vec4 vTint; varying float vWX;
  void main(){ vec4 c = texture2D(map, vUv); if (c.a < 0.5 || vWX < clipX) discard; vec3 col = vTint.a < 0.0 ? vTint.rgb : c.rgb * vTint.rgb; gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`;
export class Batch extends THREE.InstancedMesh {
  constructor(atlas, cap = 4000) {
    const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
    const rects = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4), tints = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
    geo.setAttribute('aRect', rects); geo.setAttribute('aTint', tints);
    const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: atlas.texture() }, clipX: { value: -1e9 } }, vertexShader: BVS, fragmentShader: BFS, transparent: true, depthTest: false, depthWrite: false });
    super(geo, mat, cap); this.atlas = atlas; this.cap = cap; this.n = 0; this.frustumCulled = false; this.rects = rects; this.tints = tints; this.count = 0;
    this._m = new THREE.Matrix4(); this._c = new THREE.Color();
  }
  begin() { this.n = 0; return this; }
  /** draw atlas entry `name` with its anchor at (x, y). o: { sx, sy, flip, color (multiply), solid (replace colour), snap=true, rot } */
  draw(name, x, y, o = {}) {
    const e = this.atlas.map.get(name); if (!e || this.n >= this.cap) return this;
    const sx = (o.sx ?? o.s ?? 1) * (o.flip ? -1 : 1), sy = o.sy ?? o.s ?? 1, S = this.atlas.size;
    let X = x - e.anchor[0] * sx, Y = y - e.anchor[1] * sy;
    if (o.snap !== false) { X = Math.round(X); Y = Math.round(Y); }
    this._m.makeScale(e.w * sx, e.h * sy, 1); if (o.rot) this._m.premultiply(new THREE.Matrix4().makeRotationZ(o.rot));
    this._m.setPosition(X, Y, 0); this.setMatrixAt(this.n, this._m);
    this.rects.setXYZW(this.n, e.x / S, 1 - (e.y + e.h) / S, e.w / S, e.h / S);
    if (o.solid) { this._c.set(o.solid); this.tints.setXYZW(this.n, this._c.r, this._c.g, this._c.b, -1); }
    else if (o.color) { this._c.set(o.color); this.tints.setXYZW(this.n, this._c.r, this._c.g, this._c.b, 1); }
    else this.tints.setXYZW(this.n, 1, 1, 1, 1);
    this.n++; return this;
  }
  end() { this.count = this.n; this.instanceMatrix.needsUpdate = true; this.rects.needsUpdate = true; this.tints.needsUpdate = true; return this; }
}

/** Standard particle atlas entries (call once per atlas). */
export function addParticleSprites(atlas) {
  for (let r = 1; r <= 5; r++) atlas.add('puff' + r, pixelCanvas(2 * r + 1, 2 * r + 1, (g, px) => {
    for (let y = 0; y <= 2 * r; y++) for (let x = 0; x <= 2 * r; x++) { const d = Math.hypot(x - r, y - r); if (d <= r + 0.2) px(x, y, d > r - 1 ? PAL.g4 : PAL.white); }
  }), [r, r]);
  atlas.add('px1', pixelCanvas(1, 1, (g, px) => px(0, 0, PAL.white)), [0, 0]);
  atlas.add('px2', pixelCanvas(2, 2, (g, px) => px(0, 0, PAL.white, 2, 2)), [1, 1]);
  atlas.add('spark', pixelCanvas(5, 5, (g, px) => { px(2, 0, PAL.white, 1, 5); px(0, 2, PAL.white, 5, 1); }), [2, 2]);
  atlas.add('crumb0', pixelCanvas(3, 3, (g, px) => { px(0, 0, PAL.g1, 3, 3); px(0, 0, PAL.g3, 2, 1); }), [1, 1]);
  atlas.add('crumb1', pixelCanvas(2, 2, (g, px) => { px(0, 0, PAL.g2, 2, 2); }), [1, 1]);
  atlas.add('crumb2', pixelCanvas(4, 3, (g, px) => { px(0, 0, PAL.g1, 4, 3); px(1, 0, PAL.g4, 2, 1); }), [2, 1]);
  return atlas;
}

/** dust puff burst at (x, y) starting t0 (feet landing). Pure function of t. */
export function dust(batch, t, t0, x, y, { n = 6, seed = 1, dur = 0.35, spread = 14 } = {}) {
  const s = t - t0; if (s < 0 || s > dur) return;
  const r = mulberry32(seed * 977 + 13); const u = s / dur;
  for (let i = 0; i < n; i++) {
    const dir = (i % 2 ? 1 : -1), sp = spread * (0.5 + r()), lift = 3 + 5 * r();
    const px = x + dir * sp * (1 - Math.pow(1 - u, 2)), py = y + lift * u + 1;
    const rad = Math.max(1, Math.round((1 - u) * (2 + 3 * r())));
    batch.draw('puff' + Math.min(5, rad), px, py);
  }
}
/** ballistic debris (crumbs/rubble/sparks): names array, from (x,y) with velocity spread, gravity g */
export function debris(batch, t, t0, x, y, { n = 10, seed = 1, dur = 0.8, vx = [-60, 60], vy = [40, 140], g = 420, names = ['crumb0', 'crumb1', 'crumb2'], color, floor = -1e9 } = {}) {
  const s = t - t0; if (s < 0 || s > dur) return;
  const r = mulberry32(seed * 7919 + 1);
  for (let i = 0; i < n; i++) {
    const a = vx[0] + (vx[1] - vx[0]) * r(), b = vy[0] + (vy[1] - vy[0]) * r(), nm = names[Math.floor(r() * names.length)];
    const yy = Math.max(floor, y + b * s - 0.5 * g * s * s);
    batch.draw(nm, x + a * s, yy, color ? { color } : {});
  }
}
/** sparkle twinkles around a point */
export function sparkle(batch, t, t0, x, y, { n = 5, seed = 1, dur = 0.5, r: R = 12, color } = {}) {
  const s = t - t0; if (s < 0 || s > dur) return; const r = mulberry32(seed * 31 + 7);
  for (let i = 0; i < n; i++) { const a = r() * 6.283, d = R * (0.3 + 0.7 * r()) * (s / dur); const life = (s / dur + r() * 0.5) % 1; batch.draw(life < 0.6 ? 'spark' : 'px2', x + Math.cos(a) * d, y + Math.sin(a) * d, color ? { solid: color } : {}); }
}

// ------------------------------------------------------------------ backgrounds
const BG_VS = 'varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }';
const PAPER_FS = /* glsl */`
  uniform vec3 uPaper, uHi, uLo, uSpeck, uBlank, uMissA, uMissB, uRule; uniform float uBlankX, uMissing, uRules, uMissCell, uTime;
  varying vec2 vW;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
  float bayer4(vec2 p){ ivec2 q = ivec2(mod(p, 4.0)); int i = q.x + q.y*4;
    float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.); return (m[i] + 0.5) / 16.0; }
  void main(){
    vec2 p = floor(vW);
    float n = vn(p * 0.11) * 0.5 + vn(p * 0.37) * 0.3 + h21(p) * 0.2;
    vec3 c = uPaper;
    float b = bayer4(p);
    if (n > 0.66 && b > 0.72) c = uLo; else if (n < 0.30 && b > 0.66) c = uHi;
    if (h21(p + 0.37) > 0.997) c = uSpeck;
    if (uRules > 0.0 && mod(p.y, uRules) < 1.0) c = mix(c, uRule, 0.55);
    // erased: blank white paper left of uBlankX (ragged rubbing edge)
    float edge = uBlankX + (vn(vec2(p.y * 0.25, 3.0)) - 0.5) * 10.0;
    if (p.x < edge) c = uBlank;
    // missing-texture checkerboard creeping in
    if (uMissing > 0.0) {
      vec2 cell = floor(p / 16.0);
      float m = vn(cell * 0.45 + 2.0) * 0.7 + h21(cell) * 0.3;
      if (m < uMissing) { vec2 q = floor(p / uMissCell); c = mod(q.x + q.y, 2.0) < 1.0 ? uMissA : uMissB; }
    }
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;
const GRID_FS = /* glsl */`
  uniform vec3 uBg, uMinor, uMajor; uniform float uMinorStep, uMajorStep, uAlpha, uGlitch, uTime; varying vec2 vW;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec2 p = floor(vW); vec3 c = uBg;
    if (mod(p.x, uMinorStep) < 1.0 || mod(p.y, uMinorStep) < 1.0) c = uMinor;
    if (mod(p.x, uMajorStep) < 1.0 || mod(p.y, uMajorStep) < 1.0) c = uMajor;
    if (uGlitch > 0.0 && h21(vec2(floor(p.y / 3.0), floor(uTime * 30.0))) < uGlitch) c = mix(c, uMajor * 1.6, 0.6);
    gl_FragColor = vec4(c, uAlpha);
    #include <colorspace_fragment>
  }`;
const col = (h) => ({ value: new THREE.Color(h) });
class ViewQuad extends THREE.Mesh {
  constructor(mat) { super(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0), mat); this.frustumCulled = false; }
  /** cover the camera view (+margin) */
  cover(cam, m = 16) { this.position.set(cam.left - m, cam.bottom - m, 0); this.scale.set(cam.vw + 2 * m, cam.vh + 2 * m, 1); return this; }
}
export class PaperBG extends ViewQuad {
  constructor({ rules = 0 } = {}) {
    const u = { uPaper: col(PAL.paper), uHi: col(PAL.paperHi), uLo: col(PAL.paperLo), uSpeck: col(PAL.paperSpeck), uBlank: col(PAL.blank),
      uMissA: col(PAL.missingA), uMissB: col(PAL.missingB), uRule: col('#c9d3e6'), uBlankX: { value: -1e9 }, uMissing: { value: 0 }, uRules: { value: rules }, uMissCell: { value: 4 }, uTime: { value: 0 } };
    super(new THREE.ShaderMaterial({ uniforms: u, vertexShader: BG_VS, fragmentShader: PAPER_FS, depthTest: false, depthWrite: false }));
    this.u = u;
  }
}
export class BlueprintBG extends ViewQuad {
  constructor({ minor = 8, major = 32 } = {}) {
    const u = { uBg: col(PAL.void), uMinor: col('#0c1530'), uMajor: col(PAL.grid), uMinorStep: { value: minor }, uMajorStep: { value: major }, uAlpha: { value: 1 }, uGlitch: { value: 0 }, uTime: { value: 0 } };
    super(new THREE.ShaderMaterial({ uniforms: u, vertexShader: BG_VS, fragmentShader: GRID_FS, transparent: true, depthTest: false, depthWrite: false }));
    this.u = u;
  }
}
/** world-space rectangle filled with the missing-texture checker (for tiles, gaps, glitches) */
export class CheckerRect extends THREE.Mesh {
  constructor(cell = 4) {
    const u = { uA: col(PAL.missingA), uB: col(PAL.missingB), uCell: { value: cell }, uAlpha: { value: 1 } };
    super(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0), new THREE.ShaderMaterial({ uniforms: u, vertexShader: BG_VS,
      fragmentShader: `uniform vec3 uA, uB; uniform float uCell, uAlpha; varying vec2 vW; void main(){ vec2 q = floor(floor(vW) / uCell); gl_FragColor = vec4(mod(q.x + q.y, 2.0) < 1.0 ? uA : uB, uAlpha);
      #include <colorspace_fragment>
      }`, transparent: true, depthTest: false, depthWrite: false }));
    this.u = u; this.frustumCulled = false;
  }
  setRect(x, y, w, h) { this.position.set(Math.round(x), Math.round(y), 0); this.scale.set(Math.max(1e-3, Math.round(w)), Math.max(1e-3, Math.round(h)), 1); return this; }
}

/** Rotating sunburst (Lost Vikings title-card energy). World-locked; centre/colours/rays/rotation via u. */
export class SunburstBG extends ViewQuad {
  constructor({ a = PAL.paperHi, b = '#bfe0ff', rays = 14, cx = 160, cy = 90 } = {}) {
    const u = { uA: col(a), uB: col(b), uC: { value: new THREE.Vector2(cx, cy) }, uRays: { value: rays }, uRot: { value: 0 } };
    super(new THREE.ShaderMaterial({ uniforms: u, vertexShader: BG_VS, fragmentShader: `
      uniform vec3 uA, uB; uniform vec2 uC; uniform float uRays, uRot; varying vec2 vW;
      void main(){ vec2 d = floor(vW) + 0.5 - uC; float a = atan(d.y, d.x) + uRot; float k = fract(a / 6.2831853 * uRays);
        gl_FragColor = vec4(k < 0.5 ? uA : uB, 1.0);
        #include <colorspace_fragment>
      }`, depthTest: false, depthWrite: false }));
    this.u = u;
  }
}
