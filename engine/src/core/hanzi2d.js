// Hanzi as 2D pixel platforms with per-stroke draw-on, in TRUE stroke order (Make Me a Hanzi data).
// Same voxelisation as the 3D HanziVoxels (src/hanzi.js), so a character drawn in 2D can become the 3D one.
//
//   const h = await Hanzi2D.create('笔', { size: 64, style: 'graphite' });   // size = box in game px
//   stage.add(h.group, Z.PLATFORM); h.place(x, y);            // bottom-left of the 1024-unit em box
//   h.drawOver(t, t0, t1)        draw all strokes in order between t0..t1 (durations ~ stroke length)
//   h.setProgress(i, p) / h.setAll(p) / h.setSequential(g)
//   h.tip(t)  -> { x, y, stroke, active }   world position of the pencil tip while drawing
//   h.topAt(xw, yBelow, { revealed:true })  top surface (world y) at column xw at/below yBelow (platforms)
//   h.u.uStyle: 0 graphite, 1 rainbow, 2 ink, 3 white block, 4 solid colour (uColor)
//   h.flood(cx, cy, r, w)  graphite -> rainbow colour flood (world coords, radius in px)
//   h.u.uErase              0..1 pixel-dissolve erase (THE ERASER), from left edge if uEraseX set
import * as THREE from 'three';
import { loadHanzi, voxelizeHanzi } from '../hanzi.js';
import { PAL } from './palette.js';

const cacheData = new Map();
async function getData(ch) { if (!cacheData.has(ch)) cacheData.set(ch, await loadHanzi(ch)); return cacheData.get(ch); }

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FS = /* glsl */`
  uniform sampler2D tData; uniform float uSize; uniform float uProg[32]; uniform float uStyle; uniform float uTime;
  uniform vec3 uG0, uG1, uG2, uG3, uTip, uColor; uniform float uShadow; uniform vec3 uShadowCol;
  uniform vec2 uFloodC; uniform float uFloodR, uFloodW; uniform float uErase, uEraseX, uAlpha, uHueShift, uTipAmt; uniform float uDim[32]; uniform float uHi[32]; uniform vec3 uDimCol, uHiCol;
  varying vec2 vUv;
  vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float bayer4(vec2 p){ ivec2 q = ivec2(mod(p, 4.0)); int i = q.x + q.y*4;
    float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.); return (m[i] + 0.5) / 16.0; }
  vec3 s2l(vec3 c){ return pow(c, vec3(2.2)); }
  void main(){
    vec4 d = texture2D(tData, vUv);
    if (d.a < 0.5) discard;
    int s = int(d.r * 255.0 + 0.5) - 1; float p = d.g; float e = d.b * 255.0;
    float prog = uProg[s];
    if (p > prog + 0.0001 || prog <= 0.0) discard;
    vec2 tp = floor(vUv * uSize);
    if (uEraseX > -1e8 && tp.x < uEraseX + h21(vec2(tp.y, 7.0)) * 3.0) discard;   // rubbed out left of a world-x line
    if (uErase > 0.0 && h21(tp + 3.1) < uErase) discard;                            // pixel dissolve
    if (uShadow > 0.5) { gl_FragColor = vec4(uShadowCol, uAlpha); return; }
    float n = h21(tp); float bay = bayer4(tp);
    // graphite: dark core, lighter rim, streaks along the stroke, paper grain specks
    float streak = h21(vec2(floor(p * 28.0), float(s))) ;
    vec3 gcol = e <= 1.0 ? uG2 : (e <= 2.0 ? uG1 : uG0);
    if (e > 1.0 && streak > 0.72 && n > 0.45) gcol = uG1;
    if (e <= 1.0 && n > 0.8) gcol = uG3;
    vec3 rcol = hue(p * 0.55 + float(s) * 0.137 + uHueShift) ; rcol = s2l(mix(rcol, vec3(1.0), e <= 1.0 ? 0.35 : 0.0) * (e > 2.5 ? 0.92 : 1.0));
    vec3 col = gcol;
    if (uStyle > 0.5 && uStyle < 1.5) col = rcol;
    else if (uStyle > 1.5 && uStyle < 2.5) col = e <= 1.0 ? uG1 : uG0;
    else if (uStyle > 2.5 && uStyle < 3.5) col = e <= 1.0 ? vec3(0.55, 0.65, 1.0) : vec3(1.0);
    else if (uStyle > 3.5) col = uColor * (e <= 1.0 ? 0.8 : 1.0);
    // flood: graphite -> rainbow with an ordered-dither (coloured pencil) edge
    if (uFloodR > 0.0) { float dd = (uFloodR - distance(tp, uFloodC)) / max(uFloodW, 1.0); if (dd > bay * 1.0 - 0.0) col = rcol; else if (dd > -0.6 && bay > 0.6) col = mix(col, rcol, 0.5); }
    // the drawing tip glows
    float tip = (prog < 0.999) ? (1.0 - smoothstep(0.0, 0.07, prog - p)) : 0.0;
    col = mix(col, uTip, tip * uTipAmt);
    col = mix(col, uDimCol, uDim[s]);                    // de-emphasise a stroke (e.g. non-step strokes)
    col = mix(col, uHiCol, uHi[s] * (e <= 1.0 ? 1.0 : 0.55)); // highlight / landing flash on a stroke
    gl_FragColor = vec4(col, uAlpha);
    #include <colorspace_fragment>
  }`;

const lin = (hex) => new THREE.Color(hex); // THREE.Color(hex) is linear (ColorManagement on)

export class Hanzi2D {
  static async create(ch, opts = {}) { return new Hanzi2D(ch, await getData(ch), opts); }
  constructor(ch, data, { size = 64, style = 'graphite', shadow = true, shadowColor = '#cdbf9f', tip = PAL.g4, bold = Math.round(size / 64) } = {}) {
    this.ch = ch; this.data = data; this.size = size; this.n = data.strokes.length;
    const vox = voxelizeHanzi(data, { cells: size }); this.vox = vox;
    // bold: dilate the strokes by `bold` cells (pixel glyphs read thin at game resolution)
    for (let b = 0; b < bold; b++) {
      const occ = new Map(vox.voxels.map((v) => [v.gy * size + v.gx, v])); const add = [];
      for (const v of vox.voxels) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = v.gx + dx, y = v.gy + dy; if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const k = y * size + x; if (occ.has(k)) continue; const nv = { gx: x, gy: y, stroke: v.stroke, param: v.param, edge: 0 }; occ.set(k, nv); add.push(nv);
      }
      for (const v of vox.voxels) v.edge += 1; for (const v of add) v.edge = 1; vox.voxels.push(...add);
    }
    const buf = new Uint8Array(size * size * 4);
    for (const v of vox.voxels) { const i = (v.gy * size + v.gx) * 4; buf[i] = v.stroke + 1; buf[i + 1] = Math.round(v.param * 255); buf[i + 2] = Math.min(255, v.edge); buf[i + 3] = 255; }
    const tex = new THREE.DataTexture(buf, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
    const styles = { graphite: 0, rainbow: 1, ink: 2, block: 3, solid: 4 };
    this.u = {
      tData: { value: tex }, uSize: { value: size }, uProg: { value: new Array(32).fill(1) }, uStyle: { value: styles[style] ?? 0 }, uTime: { value: 0 },
      uG0: { value: lin('#2c2c31') }, uG1: { value: lin(PAL.g1) }, uG2: { value: lin(PAL.g2) }, uG3: { value: lin(PAL.g4) }, uTip: { value: lin(tip) }, uColor: { value: lin(PAL.white) },
      uShadow: { value: 0 }, uShadowCol: { value: lin(shadowColor) }, uFloodC: { value: new THREE.Vector2() }, uFloodR: { value: 0 }, uFloodW: { value: 6 },
      uErase: { value: 0 }, uEraseX: { value: -1e9 }, uAlpha: { value: 1 }, uHueShift: { value: 0 }, uTipAmt: { value: 0.85 },
      uDim: { value: new Array(32).fill(0) }, uHi: { value: new Array(32).fill(0) }, uDimCol: { value: lin(PAL.paperLo) }, uHiCol: { value: lin('#ffffff') },
    };
    const mk = (shadowFlag) => {
      const u = { ...this.u, uShadow: { value: shadowFlag } };
      const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: FS, transparent: true, depthTest: false, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size).translate(size / 2, size / 2, 0), m); mesh.frustumCulled = false; return mesh;
    };
    this.group = new THREE.Group();
    this.main = mk(0);
    if (shadow) { this.shadow = mk(1); this.shadow.position.set(1, -1, -0.5); this.group.add(this.shadow); } // z<0: drawn before the main mesh (same renderOrder)
    this.group.add(this.main);
    this.x = 0; this.y = 0;
    // stroke lengths (median arc length) for draw scheduling
    this.lens = data.medians.map((m) => { let L = 0; for (let i = 1; i < m.length; i++) L += Math.hypot(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]); return L; });
    // column spans: for each column, list of [yBottom, yTop) of solid runs with the stroke of the top cell
    this.cols = [];
    const grid = new Int16Array(size * size).fill(-1); const par = new Float32Array(size * size);
    for (const v of vox.voxels) { grid[v.gy * size + v.gx] = v.stroke; par[v.gy * size + v.gx] = v.param; }
    this.grid = grid; this.par = par;
  }
  set style(s) { this.u.uStyle.value = { graphite: 0, rainbow: 1, ink: 2, block: 3, solid: 4 }[s] ?? s; }
  place(x, y) { this.x = Math.round(x); this.y = Math.round(y); this.group.position.set(this.x, this.y, 0); return this; }
  setProgress(i, p) { this.u.uProg.value[i] = Math.max(0, Math.min(1, p)); return this; }
  setAll(p) { for (let i = 0; i < 32; i++) this.u.uProg.value[i] = p; return this; }
  setSequential(g) { for (let i = 0; i < 32; i++) this.setProgress(i, g - i); return this; }
  /** per-stroke [start,end] fractions of a total drawing time, proportional to stroke length (+min) */
  schedule(gap = 0.15, minFrac = 0.35) {
    const L = this.lens.map((l) => Math.max(l, minFrac * Math.max(...this.lens)));
    const tot = L.reduce((a, b) => a + b, 0) + gap * Math.max(...this.lens) * (this.n - 1);
    const out = []; let acc = 0;
    for (let i = 0; i < this.n; i++) { out.push([acc / tot, (acc + L[i]) / tot]); acc += L[i] + gap * Math.max(...this.lens); }
    return out;
  }
  /** draw all strokes in stroke order over [t0, t1]; returns index of the stroke being drawn (or -1) */
  drawOver(t, t0, t1, { gap = 0.15, ease = (u) => u } = {}) {
    const sch = this.schedule(gap); let active = -1;
    for (let i = 0; i < this.n; i++) {
      const a = t0 + sch[i][0] * (t1 - t0), b = t0 + sch[i][1] * (t1 - t0);
      const u = t <= a ? 0 : t >= b ? 1 : ease((t - a) / (b - a));
      this.setProgress(i, u); if (u > 0 && u < 1) active = i;
    }
    this._sched = { t0, t1, sch }; return active;
  }
  /** Plan a drawing pass: strokes (default all, in order) drawn between t0..t1. Several plans may coexist
   *  (e.g. strokes 0-6 on one note, stroke 7 on the next). Then apply(t) sets progress, tipAt(t) is pure. */
  plan(t0, t1, { strokes = null, gap = 0.15, ease = (u) => u } = {}) {
    const idx = strokes || [...Array(this.n).keys()];
    const L = idx.map((i) => Math.max(this.lens[i], 0.35 * Math.max(...this.lens)));
    const G = gap * Math.max(...this.lens); const tot = L.reduce((a, b) => a + b, 0) + G * (idx.length - 1);
    let acc = 0; const items = idx.map((i, k) => { const a = t0 + (acc / tot) * (t1 - t0); acc += L[k]; const b = t0 + (acc / tot) * (t1 - t0); acc += G; return { i, a, b }; });
    (this.plans ||= []).push({ t0, t1, items, ease }); return this;
  }
  progressAt(t) {
    const P = new Array(this.n).fill(0);
    for (const pl of this.plans || []) for (const it of pl.items) P[it.i] = t <= it.a ? 0 : t >= it.b ? 1 : pl.ease((t - it.a) / (it.b - it.a));
    return P;
  }
  apply(t) { const P = this.progressAt(t); P.forEach((p, i) => this.setProgress(i, p)); return this; }
  /** pencil tip at time t from the plans (pure): { x, y, active, stroke } */
  tipAt(t) {
    for (const pl of this.plans || []) for (const it of pl.items) if (t >= it.a && t < it.b) { const [x, y] = this.medianAt(it.i, pl.ease((t - it.a) / (it.b - it.a))); return { x, y, active: true, stroke: it.i }; }
    return { active: false };
  }
  /** first/last point of a plan (for moving the pencil between plans) */
  planEnds(k) { const pl = this.plans[k]; const f = pl.items[0], l = pl.items[pl.items.length - 1]; return { start: this.medianAt(f.i, 0), end: this.medianAt(l.i, 1), t0: f.a, t1: l.b }; }
  /** world position of stroke i's median at fraction p */
  medianAt(i, p) {
    const m = this.data.medians[i]; let L = 0; const seg = [];
    for (let k = 1; k < m.length; k++) { const l = Math.hypot(m[k][0] - m[k - 1][0], m[k][1] - m[k - 1][1]); seg.push(l); L += l; }
    let target = Math.max(0, Math.min(1, p)) * L, k = 0;
    while (k < seg.length - 1 && target > seg[k]) { target -= seg[k]; k++; }
    const u = seg[k] ? target / seg[k] : 0;
    const fx = m[k][0] + (m[k + 1][0] - m[k][0]) * u, fy = m[k][1] + (m[k + 1][1] - m[k][1]) * u;
    return [this.x + (fx / 1024) * this.size, this.y + ((fy + 124) / 1024) * this.size];
  }
  /** pencil tip for the current drawOver() state: the stroke in progress (or last finished) */
  tip() {
    const P = this.u.uProg.value; let i = -1;
    for (let k = 0; k < this.n; k++) if (P[k] > 0) i = k;
    if (i < 0) return { active: false, stroke: -1, ...this._pt(this.medianAt(0, 0)) };
    return { active: P[i] < 1, stroke: i, ...this._pt(this.medianAt(i, P[i])) };
  }
  _pt([x, y]) { return { x, y }; }
  /** is cell (gx, gy) solid (optionally only revealed cells)? */
  solid(gx, gy, revealed = true) {
    if (gx < 0 || gy < 0 || gx >= this.size || gy >= this.size) return false;
    const s = this.grid[gy * this.size + gx]; if (s < 0) return false;
    return !revealed || this.par[gy * this.size + gx] <= this.u.uProg.value[s] + 1e-4 && this.u.uProg.value[s] > 0;
  }
  /** top surface of stroke s in column xw (scanning from the top), or null */
  strokeTopAt(s, xw) { const gx = Math.floor(xw - this.x); for (let gy = this.size - 1; gy >= 0; gy--) if (this.grid[gy * this.size + gx] === s) return this.y + gy + 1; return null; }
  /** top surface (world y of the cell top) of the first solid run at/below yBelow in column xw; null if none */
  topAt(xw, yBelow = 1e9, { revealed = true } = {}) {
    const gx = Math.floor(xw - this.x); if (gx < 0 || gx >= this.size) return null;
    let gy = Math.min(this.size - 1, Math.floor(yBelow - this.y));
    for (; gy >= 0; gy--) if (this.solid(gx, gy, revealed)) return this.y + gy + 1;
    return null;
  }
  /** horizontal extent (world) of stroke i's top surface, useful to plan landings */
  strokeBox(i) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const v of this.vox.voxels) if (v.stroke === i) { x0 = Math.min(x0, v.gx); x1 = Math.max(x1, v.gx); y0 = Math.min(y0, v.gy); y1 = Math.max(y1, v.gy); }
    return { x0: this.x + x0, x1: this.x + x1 + 1, y0: this.y + y0, y1: this.y + y1 + 1 };
  }
  /** flood colour from world point (cx, cy) with radius r (px) and dithered edge width w */
  flood(cx, cy, r, w = 6) { this.u.uFloodC.value.set(cx - this.x, cy - this.y); this.u.uFloodR.value = r; this.u.uFloodW.value = w; return this; }
  set alpha(a) { this.u.uAlpha.value = a; }
  /** per-stroke de-emphasis toward uDimCol (0..1) and highlight toward uHiCol (0..1) */
  setDim(i, v) { this.u.uDim.value[i] = v; return this; }
  setHi(i, v) { this.u.uHi.value[i] = v; return this; }
  /** rub out everything left of world x (THE ERASER); null to disable */
  eraseLeftOf(xw) { this.u.uEraseX.value = xw === null ? -1e9 : xw - this.x; return this; }
}
