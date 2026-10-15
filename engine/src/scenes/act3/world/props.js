// ACT III set pieces. Every prop is built once in setup and driven by pure per-frame setters.
// All text is rasterised in code (canvas). Coordinates are world units (see build.js).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loadHanzi, voxelizeHanzi, HanziVoxels } from '../../../hanzi.js';
import { makeColumn } from '../../../world.js';
import { triplanarMaterial, stoneTexture } from '../../../materials.js';
import { Actor } from '../../../core/sprites.js';
import { raster } from '../../../core/text.js';
import { mulberry32, vnoise } from '../../../util.js';
import { patchPaint } from './paint.js';
import { grassTile, dirtTile, lampCanvas } from '../../act2/art.js';
import { voxelizeFrame } from '../../../voxel.js';
import { boxesToMesh } from '../../../world.js';
import { MESA_A, MESA_B, CHASM, PLASTER } from './build.js';

const C = (h) => new THREE.Color(h);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
let _marble = null;
/** low-contrast warm marble (rgb albedo, a = height) so the painted world reads as clean stone, not pitted cork */
export function marbleTexture() {
  if (_marble) return _marble;
  const N = 256, d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const P = 8, f = (u, v, o) => { let a = 0, w = 0.5, s = 1; for (let k = 0; k < o; k++) { a += w * vnoise(((u * s) % (P * s)), ((v * s) % (P * s)), 3 + k); w *= 0.5; s *= 2; } return a; };
    const u = x / N * 8, v = y / N * 8; const n = f(u, v, 4), vein = Math.pow(1 - Math.abs(Math.sin((u + v * 0.6 + 2.5 * n) * 2.2)), 18);
    const k = 0.93 + 0.07 * (n - 0.5) - 0.08 * vein; const i = (y * N + x) * 4;
    d[i] = 255 * Math.min(1, k * 1.0); d[i + 1] = 255 * Math.min(1, k * 0.975); d[i + 2] = 255 * Math.min(1, k * 0.94); d[i + 3] = 255 * (0.5 + 0.4 * (n - 0.5));
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return (_marble = t);
}
function stoneMat(color = '#efe3cc', plaster = PLASTER.stone) { const m = triplanarMaterial({ tex: marbleTexture(), scale: 0.02, bump: 0.5, color, roughness: 0.7 }); m.userData.plaster = plaster; return m; }
const shadowAll = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

/** canvas texture with text, smooth (for in-world signage / engravings) */
export function textTexture(lines, { w = 512, h = 256, font = '700 120px InterVar, "Droid Sans Fallback", sans-serif', color = '#f4efe6', bg = null, stroke = null, lineH = 1.0, glow = 0 } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  const L = Array.isArray(lines) ? lines : [lines]; let fs = parseFloat(font.match(/(\d+)px/)[1]);
  g.font = font; const maxW = Math.max(...L.map((x) => g.measureText(x).width));
  if (maxW > w * 0.92) { fs = Math.floor(fs * w * 0.92 / maxW); font = font.replace(/\d+px/, fs + 'px'); }
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  L.forEach((s, i) => {
    const y = h / 2 + (i - (L.length - 1) / 2) * fs * lineH;
    if (glow) { g.shadowColor = color; g.shadowBlur = glow; }
    if (stroke) { g.lineWidth = fs * 0.08; g.strokeStyle = stroke; g.strokeText(s, w / 2, y); }
    g.fillStyle = color; g.fillText(s, w / 2, y); g.shadowBlur = 0;
  });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// --------------------------------------------------------------- generic particle burst (closed form in t)
export class Burst extends THREE.InstancedMesh {
  constructor(n = 64, { size = 2, color = '#e8dcc6', emissive = 0, geo } = {}) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, emissive: C(color), emissiveIntensity: emissive });
    super(geo || new THREE.BoxGeometry(size, size, size), mat, n);
    patchPaint(mat, { noPaint: true }); this.n = n; this.frustumCulled = false; this.castShadow = true; this.count = 0;
    this.base = C(color); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler();
    for (let i = 0; i < n; i++) this.setColorAt(i, this.base);
  }
  /** events: [{ t0, x, y, z, n, speed, up, g, dur, seed, colors?, spread? }] ; t = now */
  run(t, events) {
    let k = 0; const m = this._m;
    for (const e of events) {
      const s = t - e.t0; if (s < 0 || s > (e.dur ?? 0.9)) continue;
      const rnd = mulberry32(e.seed ?? 1); const n = e.n ?? 16;
      for (let i = 0; i < n && k < this.n; i++) {
        const a = rnd() * Math.PI * 2, el = (e.cone ?? 0.6) * rnd(), sp = (e.speed ?? 60) * (0.4 + 0.6 * rnd());
        const vx = Math.cos(a) * Math.cos(el) * sp * (e.sx ?? 1), vz = Math.sin(a) * Math.cos(el) * sp * (e.sz ?? 1), vy = (e.up ?? 40) * (0.5 + rnd()) + Math.sin(el) * sp;
        const g = e.g ?? 160; const life = (e.dur ?? 0.9) * (0.6 + 0.4 * rnd());
        if (s > life) { rnd(); rnd(); continue; }
        const sc = (e.size ?? 1) * (1 - Math.pow(s / life, 3)) * (0.5 + rnd());
        this._e.set(s * 7 * rnd(), s * 9 * rnd(), 0); this._q.setFromEuler(this._e);
        m.compose(new THREE.Vector3(e.x + vx * s, Math.max(e.floor ?? -1e9, e.y + vy * s - 0.5 * g * s * s), e.z + vz * s), this._q, new THREE.Vector3(sc, sc, sc));
        this.setMatrixAt(k, m);
        if (e.colors) this.setColorAt(k, C(e.colors[i % e.colors.length])); else this.setColorAt(k, this.base);
        k++;
      }
    }
    this.count = k; this.instanceMatrix.needsUpdate = true; if (this.instanceColor) this.instanceColor.needsUpdate = true;
    this.visible = k > 0;
  }
}

// --------------------------------------------------------------- beams (sound / light connectors)
export class Beam extends THREE.Group {
  constructor({ radius = 1.2, color = '#fff2d8', intensity = 6, glow = 4 } = {}) {
    super();
    this.coreMat = new THREE.MeshBasicMaterial({ color: C(color).multiplyScalar(intensity), toneMapped: false });
    this.glowMat = new THREE.MeshBasicMaterial({ color: C(color).multiplyScalar(1.2), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
    this.core = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 10, 1, true), this.coreMat);
    this.glowR = radius * glow; this.radius = radius;
    this.segs = []; this.frustumCulled = false; this.color = C(color); this.intensity = intensity;
    for (const o of [this.core]) o.userData.noAO = true;
  }
  _seg(i) {
    while (this.segs.length <= i) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true), this.coreMat);
      const g = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14, 1, true), this.glowMat);
      c.userData.noAO = g.userData.noAO = true; c.frustumCulled = g.frustumCulled = false;
      this.add(c); this.add(g); this.segs.push([c, g]);
    }
    return this.segs[i];
  }
  /** pts: [Vector3...]; p: 0..1 drawn fraction of total length; wobble: sound-wave thickness pulse; hue: optional colour per segment */
  set(pts, p = 1, { width = 1, colors = null, jitter = 0, t = 0 } = {}) {
    const lens = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = pts[i].distanceTo(pts[i - 1]); lens.push(l); total += l; }
    let remain = total * clamp01(p); let k = 0;
    for (let i = 1; i < pts.length; i++) {
      const [c, g] = this._seg(k); const l = Math.min(lens[i - 1], remain); remain -= l;
      if (l <= 0.01) { c.visible = g.visible = false; k++; continue; }
      const a = pts[i - 1], dir = new THREE.Vector3().subVectors(pts[i], a).normalize(), b = a.clone().addScaledVector(dir, l);
      const mid = a.clone().add(b).multiplyScalar(0.5); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      const w = width * (1 + jitter * Math.sin(t * 40 + i));
      for (const [m, r] of [[c, this.radius * w], [g, this.glowR * w]]) { m.visible = true; m.position.copy(mid); m.quaternion.copy(q); m.scale.set(r, l, r); }
      if (colors) { c.material = this._colMat(colors[(i - 1) % colors.length], true); g.material = this._colMat(colors[(i - 1) % colors.length], false); }
      k++;
    }
    for (; k < this.segs.length; k++) { this.segs[k][0].visible = this.segs[k][1].visible = false; }
    this.visible = p > 0;
    return this;
  }
  _colMat(hex, core) {
    this._cm ||= new Map(); const key = hex + core;
    if (!this._cm.has(key)) this._cm.set(key, core ? new THREE.MeshBasicMaterial({ color: C(hex).multiplyScalar(this.intensity), toneMapped: false })
      : new THREE.MeshBasicMaterial({ color: C(hex).multiplyScalar(1.4), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    return this._cm.get(key);
  }
}

// --------------------------------------------------------------- VOID wall (blueprint tiles that shatter in the turn)
const VOID_VS = /* glsl */`
  attribute vec3 aC; attribute float aDelay; attribute vec3 aAxis; attribute vec3 aVel;
  uniform float uT; varying vec2 vG; varying float vS;
  mat3 rotAxis(vec3 a, float ang){ float s = sin(ang), c = cos(ang), oc = 1.0 - c;
    return mat3(oc*a.x*a.x + c, oc*a.x*a.y + a.z*s, oc*a.z*a.x - a.y*s, oc*a.x*a.y - a.z*s, oc*a.y*a.y + c, oc*a.y*a.z + a.x*s, oc*a.z*a.x + a.y*s, oc*a.y*a.z - a.x*s, oc*a.z*a.z + c); }
  void main(){
    vG = aC.xy + position.xy;
    float s = max(0.0, uT - aDelay); vS = s;
    vec3 p = position;
    p = rotAxis(normalize(aAxis), s * length(aAxis)) * p;
    vec3 w = aC + p + aVel * s + vec3(0.0, -260.0, 0.0) * s * s;
    gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
  }`;
const VOID_FS = /* glsl */`
  uniform vec3 uBg, uMinor, uMajor; uniform float uCrack; varying vec2 vG; varying float vS;
  float line(float x, float st, float w){ float d = abs(mod(x + st * 0.5, st) - st * 0.5); return 1.0 - step(w, d); }
  void main(){
    vec3 c = uBg;
    float mi = max(line(vG.x, 8.0, 0.5), line(vG.y, 8.0, 0.5));
    float ma = max(line(vG.x, 32.0, 0.75), line(vG.y, 32.0, 0.75));
    c = mix(c, uMinor, mi); c = mix(c, uMajor, ma);
    // after the break the tile edges glow (the seams of the world)
    c += vec3(1.0, 0.75, 0.4) * ma * clamp(vS * 6.0, 0.0, 1.0) * 0.6;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;
export function makeVoidWall({ x0 = -520, x1 = 640, y0 = -96, y1 = 320, z = -25.5, tile = 32 } = {}) {
  const nx = Math.round((x1 - x0) / tile), ny = Math.round((y1 - y0) / tile), n = nx * ny;
  const geo = new THREE.InstancedBufferGeometry(); const base = new THREE.PlaneGeometry(tile, tile);
  geo.index = base.index; geo.attributes.position = base.attributes.position; geo.attributes.uv = base.attributes.uv;
  const aC = new Float32Array(n * 3), aDelay = new Float32Array(n), aAxis = new Float32Array(n * 3), aVel = new Float32Array(n * 3);
  const rnd = mulberry32(42); let i = 0;
  for (let ix = 0; ix < nx; ix++) for (let iy = 0; iy < ny; iy++, i++) {
    aC.set([x0 + (ix + 0.5) * tile, y0 + (iy + 0.5) * tile, z], i * 3);
    aAxis.set([(rnd() - 0.5) * 8, (rnd() - 0.5) * 8, (rnd() - 0.5) * 3], i * 3);
    aVel.set([(rnd() - 0.5) * 160, 40 + rnd() * 160, -(120 + rnd() * 380)], i * 3);
  }
  geo.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 3)); geo.setAttribute('aDelay', new THREE.InstancedBufferAttribute(aDelay, 1));
  geo.setAttribute('aAxis', new THREE.InstancedBufferAttribute(aAxis, 3)); geo.setAttribute('aVel', new THREE.InstancedBufferAttribute(aVel, 3));
  geo.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: -1 }, uBg: { value: C('#05060d') }, uMinor: { value: C('#0c1530') }, uMajor: { value: C('#13234a') }, uCrack: { value: 0 } },
    vertexShader: VOID_VS, fragmentShader: VOID_FS, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.userData.noAO = true;
  /** break the wall from point (bx, by): tiles leave in order of distance (speed px/s) */
  mesh.userData.setBreak = (bx, by, speed = 1400) => {
    for (let k = 0; k < n; k++) { const dx = aC[k * 3] - bx, dy = aC[k * 3 + 1] - by; aDelay[k] = Math.hypot(dx, dy) / speed + (vnoise(k * 0.37, 1, 3) * 0.05); }
    geo.attributes.aDelay.needsUpdate = true;
  };
  mesh.userData.setBreak(140, 60);
  return mesh;
}

// --------------------------------------------------------------- voxel hanzi with own colours (rainbow / plaster)
export async function hanziBlocks(ch, { cells = 64, voxel = 1, depth = 6, color = '#f4efe6', rainbow = false } = {}) {
  const vx = voxelizeHanzi(await loadHanzi(ch), { cells });
  const list = []; const { minx, miny } = vx.bounds;
  for (const v of vx.voxels) for (let z = 0; z < depth; z++) {
    const c = rainbow ? C(['#ff4d6d', '#ff7a3d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#3b7bff', '#a35cff'][Math.floor((v.gx - minx) / 6) % 8]) : C(color);
    list.push({ x: (v.gx - minx + 0.5) * voxel, y: (v.gy - miny + 0.5) * voxel, z: (z - depth / 2 + 0.5) * voxel, c, stroke: v.stroke, param: v.param });
  }
  return { list, w: (vx.bounds.maxx - minx + 1) * voxel, h: (vx.bounds.maxy - miny + 1) * voxel, vx };
}


/** stroke-order voxel hanzi with own colours: front layer `face`, deeper layers `side` (the void's extruded-block look) */
export function dilateHanzi(vx, bold, cells) {
  for (let b = 0; b < bold; b++) {
    const occ = new Map(vx.voxels.map((v) => [v.gy * cells + v.gx, v])); const add = [];
    for (const v of vx.voxels) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = v.gx + dx, y = v.gy + dy; if (x < 0 || y < 0 || x >= cells || y >= cells) continue;
      const k = y * cells + x; if (occ.has(k)) continue; const nv = { gx: x, gy: y, stroke: v.stroke, param: v.param, edge: 0 }; occ.set(k, nv); add.push(nv);
    }
    vx.voxels.push(...add);
  }
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9; for (const v of vx.voxels) { minx = Math.min(minx, v.gx); maxx = Math.max(maxx, v.gx); miny = Math.min(miny, v.gy); maxy = Math.max(maxy, v.gy); }
  vx.bounds = { minx, miny, maxx, maxy }; return vx;
}
/** wireframe gizmo cube (Team A's VOID gizmos) built from thin boxes so it survives the pixel post */
export function gizmoCube(s = 20, col = '#3d7bff', w = 1) {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: C(col) }); const h = s / 2;
  for (const [ax, sx, sy, sz] of [['x', s, w, w], ['y', w, s, w], ['z', w, w, s]]) for (const a of [-h, h]) for (const b of [-h, h]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); e.userData.noAO = true;
    if (ax === 'x') e.position.set(0, a, b); else if (ax === 'y') e.position.set(a, 0, b); else e.position.set(a, b, 0); g.add(e);
  }
  return g;
}
export class BlockHanzi {
  constructor(vx, { voxel = 1, depth = 6, face = '#f4efe6', side = '#3d7bff', grow = 0.06 } = {}) {
    const { minx, miny } = vx.bounds; const n = vx.voxels.length * depth;
    const geo = new THREE.BoxGeometry(voxel, voxel, voxel); const aS = new Float32Array(n), aP = new Float32Array(n);
    this.uniforms = { uProg: { value: new Array(32).fill(1) }, uGrow: { value: grow } };
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }); mat.userData.noPaint = true;
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aS; attribute float aP; uniform float uProg[32]; uniform float uGrow;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n float pr = uProg[int(aS + 0.5)]; float k = clamp((pr - aP) / uGrow, 0.0, 1.0); transformed *= k * k * (3.0 - 2.0 * k);'); };
    mat.customProgramCacheKey = () => 'blockhanzi'; patchPaint(mat, { noPaint: true });
    const mesh = new THREE.InstancedMesh(geo, mat, n); const m = new THREE.Matrix4(); const cf = C(face), cs = C(side); let i = 0;
    for (const v of vx.voxels) for (let z = 0; z < depth; z++) {
      m.makeTranslation((v.gx - minx + 0.5) * voxel, (v.gy - miny + 0.5) * voxel, (z - depth + 0.5) * voxel); mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, z === depth - 1 ? cf : cs); aS[i] = v.stroke; aP[i] = v.param; i++;
    }
    geo.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 1)); geo.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 1));
    mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
    this.mesh = mesh; this.vox = vx; this.widthWorld = (vx.bounds.maxx - minx + 1) * voxel; this.heightWorld = (vx.bounds.maxy - miny + 1) * voxel;
  }
  setProgress(i, p) { this.uniforms.uProg.value[i] = Math.max(0, Math.min(1, p)); }
  setAll(p) { for (let i = 0; i < 32; i++) this.uniforms.uProg.value[i] = p; }
}


/** a single calligraphy stroke as a walkable voxel sculpture: pillowed (tapered) depth, dry-brush rim, graphite ink that
 *  colours along the stroke (uCol: 0..1 of the median) -- the co-op bridge: graphite (fixtures) -> rainbow once crossed */
export class InkStroke {
  constructor(vx, { voxel = 1, depth = 16, seed = 5, dryBrush = 0.4 } = {}) {
    const { minx, miny } = vx.bounds; const rnd = mulberry32(seed); const cols = [];
    for (const v of vx.voxels) {
      const streak = Math.sin(v.param * 37.0 + v.stroke * 3.1) * 0.5 + 0.5;
      if (v.edge <= 1.5 && rnd() < dryBrush * (0.4 + 0.6 * streak) * (0.4 + 0.6 * v.param)) continue;
      const end = Math.min(v.param, 1 - v.param);                       // taper toward both ends of the stroke
      const d = Math.max(2, Math.round(depth * Math.min(1, Math.sqrt(Math.min(1, (v.edge - 0.5) / 3.5))) * (0.45 + 0.55 * Math.min(1, end * 5))));
      cols.push([v, d]);
    }
    const n = cols.reduce((a, [, d]) => a + d, 0);
    const geo = new THREE.BoxGeometry(voxel, voxel, voxel); const aS = new Float32Array(n), aP = new Float32Array(n), aE = new Float32Array(n);
    this.uniforms = { uProg: { value: new Array(32).fill(1) }, uGrow: { value: 0.04 }, uCol: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.2 }); mat.userData.noPaint = true;
    mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aS; attribute float aP; attribute float aE; uniform float uProg[32]; uniform float uGrow; varying float vP; varying float vE;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n float pr = uProg[int(aS + 0.5)]; float k = clamp((pr - aP) / uGrow, 0.0, 1.0); transformed *= k * k * (3.0 - 2.0 * k); vP = aP; vE = aE;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uCol; varying float vP; varying float vE;\nvec3 inkHue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }')
        .replace('#include <color_fragment>', `#include <color_fragment>
          { float dry = clamp((vE - 1.0) / 3.0, 0.0, 1.0);
            vec3 ink = mix(vec3(0.17, 0.168, 0.165), vec3(0.02, 0.02, 0.025), dry);
            vec3 rb = mix(inkHue(vP * 0.85 + 0.82), vec3(1.0), 0.12) * mix(1.15, 0.85, dry);
            float c = smoothstep(uCol - 0.03, uCol, vP);
            diffuseColor.rgb = mix(rb, ink, c); }`); };
    mat.customProgramCacheKey = () => 'inkstroke'; patchPaint(mat, { noPaint: true });
    const mesh = new THREE.InstancedMesh(geo, mat, n); const m = new THREE.Matrix4(); let i = 0;
    for (const [v, d] of cols) for (let z = 0; z < d; z++) {
      m.makeTranslation((v.gx - minx + 0.5) * voxel, (v.gy - miny + 0.5) * voxel, (z - d / 2 + 0.5) * voxel); mesh.setMatrixAt(i, m);
      aS[i] = v.stroke; aP[i] = v.param; aE[i] = v.edge; i++;
    }
    geo.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 1)); geo.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 1)); geo.setAttribute('aE', new THREE.InstancedBufferAttribute(aE, 1));
    mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false;
    this.mesh = mesh; this.vox = vx; this.heightWorld = (vx.bounds.maxy - miny + 1) * voxel; this.widthWorld = (vx.bounds.maxx - minx + 1) * voxel;
  }
  setProgress(i, p) { this.uniforms.uProg.value[i] = Math.max(0, Math.min(1, p)); }
  setAll(p) { for (let i = 0; i < 32; i++) this.uniforms.uProg.value[i] = p; }
  setColour(u) { this.uniforms.uCol.value = u; }
}

// --------------------------------------------------------------- flowers (instanced voxel flowers that grow)
const FLOWER_COLS = ['#ff4d6d', '#ffb02e', '#ffe14d', '#e858d0', '#a35cff', '#ffffff', '#ff7a3d', '#2bb4e8'];
export class FlowerField extends THREE.Group {
  constructor({ x0, x1, z0, z1, y = 10, n = 2400, seed = 9, avoid = null } = {}) {
    super();
    const rnd = mulberry32(seed); this.items = [];
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
      if (avoid && avoid(x, z)) continue;
      this.items.push({ x, z, h: 3 + Math.floor(rnd() * 4), col: FLOWER_COLS[Math.floor(rnd() * FLOWER_COLS.length)], rot: rnd() * 6.28, ph: rnd() });
    }
    const m = this.items.length;
    this.stemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }); this.stemMat.userData.plaster = PLASTER.meadow;
    this.headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }); this.headMat.userData.plaster = 0xf6f0e4;
    patchPaint(this.stemMat); patchPaint(this.headMat);
    this.stems = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), this.stemMat, m);
    const hg = mergeGeometries([new THREE.BoxGeometry(3, 1.4, 1).translate(0, 0, 0), new THREE.BoxGeometry(1, 1.4, 3), new THREE.BoxGeometry(1.2, 2, 1.2).translate(0, 0.4, 0)]);
    this.heads = new THREE.InstancedMesh(hg, this.headMat, m);
    this.items.forEach((it, i) => { this.stems.setColorAt(i, C('#5c8e33')); this.heads.setColorAt(i, C(it.col)); });
    for (const o of [this.stems, this.heads]) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; this.add(o); }
    this.y = y; this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion();
  }
  /** grow(i) -> 0..1 per item (pure fn of item), sway time t */
  update(growFn, t = 0) {
    const m = this._m, q = this._q;
    this.items.forEach((it, i) => {
      const g = growFn(it); const s = g <= 0 ? 0.0001 : Math.min(1.15, g < 0.7 ? g / 0.7 * 1.15 : 1.15 - (g - 0.7) / 0.3 * 0.15);
      q.setFromEuler(new THREE.Euler(0.08 * Math.sin(t * 2 + it.ph * 6), it.rot, 0));
      m.compose(new THREE.Vector3(it.x, this.y, it.z), q, new THREE.Vector3(1, it.h * s, 1)); this.stems.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(it.x, this.y + it.h * s + 0.3, it.z), q, new THREE.Vector3(s, s, s)); this.heads.setMatrixAt(i, m);
    });
    this.stems.instanceMatrix.needsUpdate = true; this.heads.instanceMatrix.needsUpdate = true;
  }
}

// --------------------------------------------------------------- pixel-font block letters in 3D
export function blockLetters3D(text, { font = 'fp12', cell = 6, depth = 10, plaster = PLASTER.stone, graphite = false } = {}) {
  const r = raster({ text, font, color: '#ffffff' });
  const d = r.canvas.getContext('2d').getImageData(0, 0, r.w, r.h).data;
  const geos = [];
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (d[(y * r.w + x) * 4 + 3] > 0)
    geos.push(new THREE.BoxGeometry(cell, cell, depth).translate((x + 0.5) * cell - r.w * cell / 2, (r.h - y - 0.5) * cell, 0));
  const mat = graphite ? (() => { const m = new THREE.MeshStandardMaterial({ color: 0x55555d, roughness: 0.45, metalness: 0.3 }); m.userData.noPaint = true; return m; })() : stoneMat('#e8dcc4', plaster);
  const mesh = new THREE.Mesh(mergeGeometries(geos), mat); shadowAll(mesh);
  // trim empty rows at the bottom so y = 0 is the baseline of the lowest pixel
  mesh.geometry.computeBoundingBox(); mesh.geometry.translate(0, -mesh.geometry.boundingBox.min.y, 0);
  mesh.userData.w = r.w * cell; return mesh;
}

// --------------------------------------------------------------- the DRAWN LEVEL (Team A's coloured void ground) as the 3D causeway
// Game coords of Act II map to world as x = gx - 200, y = gy - 60 (ground top = 0). Director's call: the slice the
// party drew stays coloured (slightly desaturated in 3D) and runs to the horizon through the unpainted world.
export const GX = (gx) => gx - 200, GY = (gy) => gy - 60;
export function makeDrawnStrip({ x0 = -408, x1 = 4400, zf = 24, zb = -24, depth = 64 } = {}) {
  // front texture: 6 columns x (grass + 3 dirt rows), exactly Team A's tile choice per column (period 96 px)
  const cv = document.createElement('canvas'); cv.width = 96; cv.height = 64; const g = cv.getContext('2d');
  for (let c = 0; c < 6; c++) { const gx = c * 16; const k = ((Math.floor(gx / 16) % 3) + 3) % 3;
    g.drawImage(grassTile(k), gx, 0); for (let row = 1; row < 4; row++) g.drawImage(dirtTile((Math.floor(gx / 16) + row) & 1), gx, row * 16); }
  const top = document.createElement('canvas'); top.width = 32; top.height = 32; const tg = top.getContext('2d'); const r = mulberry32(5);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { tg.fillStyle = ['#5cc04a', '#3f9a36', '#4cae40', '#2f7a2a'][Math.floor(r() * 4 * r())]; tg.fillRect(x, y, 1, 1); }
  const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (rep) t.repeat.set(...rep); return t; };
  const uSat = { value: 1 };
  const mk = (map) => { const m = new THREE.MeshStandardMaterial({ map, roughness: 0.92 }); m.userData.noPaint = true;
    m.onBeforeCompile = (sh) => { sh.uniforms.uStripSat = uSat; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uStripSat;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n { float l = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)); diffuseColor.rgb = mix(vec3(l) * vec3(1.04, 1.0, 0.94), diffuseColor.rgb, uStripSat); }'); };
    m.customProgramCacheKey = () => 'drawnstrip'; patchPaint(m, { noPaint: true }); return m; };
  const L = x1 - x0, grp = new THREE.Group();
  const face = (z, flip) => { const geo = new THREE.PlaneGeometry(L, depth); const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, ((uv.getX(i) * L + x0 + 200) / 96) * (flip ? -1 : 1));
    const m = new THREE.Mesh(geo, mk(tex(cv))); m.position.set((x0 + x1) / 2, -depth / 2, z); if (flip) m.rotation.y = Math.PI; m.receiveShadow = true; m.castShadow = true; return m; };
  grp.add(face(zf, false), face(zb, true));
  const tp = new THREE.Mesh(new THREE.PlaneGeometry(L, zf - zb), mk(tex(top, [L / 32, (zf - zb) / 32]))); tp.rotation.x = -Math.PI / 2; tp.position.set((x0 + x1) / 2, 0, (zf + zb) / 2); tp.receiveShadow = true; grp.add(tp);
  const end = new THREE.Mesh(new THREE.PlaneGeometry(zf - zb, depth), mk(tex(cv))); end.rotation.y = -Math.PI / 2; end.position.set(x0, -depth / 2, 0); grp.add(end);
  grp.userData.uSat = uSat;
  return grp;
}
/** Team A's rainbow 出 / 发 gate (Hanzi2D size 96, bold 2) as voxels: same cells, same dilation, same hue formula */
async function rainbowHanzi(ch, { size = 96, bold = 2, depth = 10, hueShift = 0.05 } = {}) {
  const vox = voxelizeHanzi(await loadHanzi(ch), { cells: size });
  for (let b = 0; b < bold; b++) {
    const occ = new Map(vox.voxels.map((v) => [v.gy * size + v.gx, v])); const addv = [];
    for (const v of vox.voxels) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = v.gx + dx, y = v.gy + dy; if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const k = y * size + x; if (occ.has(k)) continue; const nv = { gx: x, gy: y, stroke: v.stroke, param: v.param, edge: 0 }; occ.set(k, nv); addv.push(nv);
    }
    for (const v of vox.voxels) v.edge += 1; for (const v of addv) v.edge = 1; vox.voxels.push(...addv);
  }
  const fr = (x) => x - Math.floor(x), cl = (x) => Math.max(0, Math.min(1, x));
  const hue = (h) => [cl(Math.abs(fr(h) * 6 - 3) - 1), cl(Math.abs(fr(h + 2 / 3) * 6 - 3) - 1), cl(Math.abs(fr(h + 1 / 3) * 6 - 3) - 1)];
  const list = [];
  for (const v of vox.voxels) {
    let [r, g, b] = hue(((v.param * 0.55 + v.stroke * 0.137 + hueShift) % 1 + 1) % 1);
    if (v.edge <= 1) { r = r * 0.65 + 0.35; g = g * 0.65 + 0.35; b = b * 0.65 + 0.35; } else if (v.edge > 2.5) { r *= 0.92; g *= 0.92; b *= 0.92; }
    const c = new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
    for (let z = 0; z < depth; z++) list.push({ x: v.gx + 0.5, y: v.gy + 0.5, z: z - depth / 2 + 0.5, c });
  }
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 }); mat.userData.noPaint = true; patchPaint(mat, { noPaint: true });
  return boxesToMesh(list, 1, {}, mat);
}

// --------------------------------------------------------------- build all props
export async function buildProps({ scene, lib, groundY }) {
  const P = {};
  const add = (k, o) => { P[k] = o; scene.add(o); return o; };

  // ---- 2D/turn: drawn level strip, 出发 gate + lamp (Team A's set), void wall, drum blocks, chant characters, trampoline
  add('drawnStrip', makeDrawnStrip());
  P.gate2 = new THREE.Group(); { const chu = await rainbowHanzi('出'), fa = await rainbowHanzi('发'); chu.position.set(GX(180), GY(60), -9); fa.position.set(GX(262), GY(60), -9); P.gate2.add(chu, fa); } scene.add(P.gate2);
  { const cv = lampCanvas(3, true); const img = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
    const lm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }); patchPaint(lm, { noPaint: true });
    P.lamp = voxelizeFrame(img, { frameWidth: cv.width, frameHeight: cv.height, voxel: { baseDepth: 2, depthPerPixel: 1, maxDepth: 4 } }, 0, { material: lm }); P.lamp.position.set(GX(158), 0, -3); scene.add(P.lamp); }
  add('voidWall', makeVoidWall());
  P.gizmos = [[-150, 45, 20], [152, 122, 16], [-58, 62, 18]].map(([x, y, sz]) => { const g = gizmoCube(sz); g.userData.home = [x, y, -18]; scene.add(g); return g; });
  const blockMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.8 }); blockMat.userData.plaster = 0xf7f2e8;
  P.blocks = []; for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(11, 5, 8), blockMat); shadowAll(b); scene.add(b); P.blocks.push(b); }
  P.chant = [];
  for (const [i, ch] of ['一', '笔', '一', '画'].entries()) {
    const hz = dilateHanzi(voxelizeHanzi(await loadHanzi(ch), { cells: 52 }), 1, 52);
    const v = new BlockHanzi(hz, { voxel: 1, depth: 7 });
    const g = new THREE.Group(); g.add(v.mesh); g.hz = v; g.box = { w: v.widthWorld, h: v.heightWorld, minx: hz.bounds.minx, miny: hz.bounds.miny };
    scene.add(g); P.chant.push(g);
  }
  const tramp = new Actor(lib, { rest: 'charlie_prop_trampoline' }, { name: 'tramp' });
  const tm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }); patchPaint(tm, { noPaint: true });
  P.tramp = tramp.voxel({ material: tm }); scene.add(P.tramp);
  { const bm = new Actor(lib, { spin: 'charlie_hat_boomerang' }, { name: 'boomer' }); const mm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }); patchPaint(mm, { noPaint: true }); P.boomer = bm.voxel({ material: mm, scale: 1.4 }); scene.add(P.boomer); }
  const hatStack = new Actor(lib, { rest: 'charlie_prop_hat_stack' }, { name: 'hats' });
  const hm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }); patchPaint(hm, { noPaint: true });
  P.hatStack = hatStack.voxel({ material: hm }); scene.add(P.hatStack);

  // ---- drop 1: graphite slabs (FIXTURES / FUNCTIONS), connector beams, far switches
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x3e3e45, roughness: 0.42, metalness: 0.35 }); patchPaint(slabMat, { noPaint: true });
  P.slabs = [];
  const SLAB_DIMS = [[60, 84, 7], [26, 70, 6], [26, 64, 6], [60, 84, 7], [26, 72, 6], [26, 60, 6]];
  for (const [i, [w, h, d]] of SLAB_DIMS.entries()) {
    const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), slabMat); shadowAll(m); g.add(m);
    // graphite pencil-hatch on the faces (fixtures)
    g.userData = { w, h, d }; scene.add(g); P.slabs.push(g);
  }
  const engrave = (txt, w, h, col, glow) => { const t = textTexture(txt, { w: 1024, h: 256, font: '900 150px InterVar, sans-serif', color: col, glow }); const mm = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }); const q = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), mm); q.userData.noAO = true; return q; };
  P.fixturesText = engrave('FIXTURES', 56, 0, '#efe6d2'); P.slabs[0].add(P.fixturesText); P.fixturesText.position.set(0, 58, 3.6);
  P.functionsText = engrave('FUNCTIONS', 56, 0, '#fff4d6', 18); P.slabs[3].add(P.functionsText); P.functionsText.position.set(0, 58, 3.6);
  P.slabGlowMat = new THREE.MeshBasicMaterial({ color: C('#ffe7b0').multiplyScalar(3), toneMapped: false });
  P.slabEdges = P.slabs.map((s) => { const { w, h, d } = s.userData; const e = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 1.2, d + 0.6), P.slabGlowMat); e.position.y = h; s.add(e); return e; });
  add('beam', new Beam({ radius: 0.9, color: '#fff0d0', intensity: 7 }));
  add('beam2', new Beam({ radius: 1.1, color: '#ff5fd2', intensity: 6 }));
  P.switches = [];
  for (const [x, z] of [[1180, -330], [1250, -78]]) {
    const g = new THREE.Group(); const col = makeColumn({ h: 60, r: 7, mat: stoneMat() }); g.add(col);
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 1), new THREE.MeshBasicMaterial({ color: C('#fff2d0'), toneMapped: false })); orb.position.y = col.userData.top + 8; g.add(orb); g.userData.orb = orb;
    g.position.set(x, groundY(x, z), z); scene.add(g); P.switches.push(g);
  }

  // ---- verse 2: flowers on mesa A, BECAUSE letters, co-op set
  const A = MESA_A;
  add('flowers', new FlowerField({ x0: A.x0 + 30, x1: A.x1 - 40, z0: A.z0 + 30, z1: A.z1 - 30, y: A.top, n: 2800, avoid: (x) => x > 905 }));
  // BECAUSE as two monumental halves ('be' | 'cause') with a walk-through gap at z = 228
  P.because = new THREE.Group(); { const be = blockLetters3D('be', { font: 'fp12', cell: 5, depth: 10, graphite: true }), ca = blockLetters3D('cause', { font: 'fp12', cell: 5, depth: 10, graphite: true });
    be.position.set(0, 0, -(14 + be.userData.w / 2)); ca.position.set(0, 0, 14 + ca.userData.w / 2); be.rotation.y = ca.rotation.y = -Math.PI / 2; P.because.add(be, ca); }
  P.because.position.set(782, A.top, 348); scene.add(P.because);
  // pressure plate + gate + tripod + receiver + 一 bridge
  const plateMat = stoneMat('#e6dac2'); const plate = new THREE.Mesh(new THREE.BoxGeometry(26, 3, 26), plateMat); shadowAll(plate);
  const plateEdgeMat = new THREE.MeshBasicMaterial({ color: C('#ffffff'), toneMapped: false });
  const plateEdge = new THREE.Mesh(new THREE.BoxGeometry(30, 0.6, 30), plateEdgeMat);
  P.plate = new THREE.Group(); P.plate.add(plate, plateEdge); plate.position.y = 1.5; plateEdge.position.y = 0.4; P.plate.userData = { plate, edge: plateEdge, edgeMat: plateEdgeMat };
  P.plate.position.set(925, A.top, 320); scene.add(P.plate);
  const gateMat = stoneMat('#ddd0b4');
  P.gate = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 12), gateMat); frame.position.y = 54; shadowAll(frame);
  const postL = new THREE.Mesh(new THREE.BoxGeometry(8, 58, 12), gateMat); postL.position.set(-20, 29, 0); shadowAll(postL);
  const postR = postL.clone(); postR.position.x = 20;
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(16, 50, 6), gateMat); doorL.position.set(-8, 25, 0); shadowAll(doorL);
  const doorR = doorL.clone(); doorR.position.x = 8;
  P.gate.add(frame, postL, postR, doorL, doorR); P.gate.userData = { doorL, doorR };
  P.gate.position.set(982, A.top, 292); P.gate.rotation.y = -Math.PI / 2; scene.add(P.gate);
  // tripod: three wooden legs + a crystal connector
  const wood = new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: 0.6 }); wood.userData.plaster = 0xe8dcc6;
  P.tripod = new THREE.Group();
  for (let k = 0; k < 3; k++) { const a = k * 2.094; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 26, 6), wood); leg.position.set(Math.cos(a) * 5, 12, Math.sin(a) * 5); leg.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); shadowAll(leg); P.tripod.add(leg); }
  P.crystalMat = new THREE.MeshStandardMaterial({ color: 0xf2f6ff, roughness: 0.1, metalness: 0.2, emissive: C('#ff5fd2'), emissiveIntensity: 0 }); P.crystalMat.userData.noPaint = true;
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(5, 0), P.crystalMat); crystal.position.y = 29; shadowAll(crystal); P.tripod.add(crystal); P.tripod.userData.crystal = crystal;
  P.tripod.scale.setScalar(1.4); scene.add(P.tripod);
  P.receiver = new THREE.Group(); const rc = makeColumn({ h: 34, r: 6, mat: stoneMat() }); P.receiver.add(rc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(8, 1.6, 8, 24), stoneMat()); ring.position.y = rc.userData.top + 10; shadowAll(ring); P.receiver.add(ring);
  P.recvMat = new THREE.MeshStandardMaterial({ color: 0xf2f6ff, roughness: 0.1, emissive: C('#ff5fd2'), emissiveIntensity: 0 }); P.recvMat.userData.noPaint = true;
  const rcr = new THREE.Mesh(new THREE.OctahedronGeometry(4.5, 0), P.recvMat); rcr.position.y = rc.userData.top + 10; P.receiver.add(rcr); P.receiver.userData.cy = rc.userData.top + 10;
  P.receiver.position.set(1125, MESA_B.top, 455); scene.add(P.receiver);
  { // the 一 stroke bridge across the chasm (graphite ink, draws itself on)
    const hz = voxelizeHanzi(await loadHanzi('一'), { cells: 96 });
    const vox = (CHASM.x1 - CHASM.x0 + 40) / (hz.bounds.maxx - hz.bounds.minx + 1);
    const v = new InkStroke(hz, { voxel: vox, depth: Math.round(20 / vox), seed: 5, dryBrush: 0.45 });
    const g = new THREE.Group(); g.add(v.mesh); g.hz = v;
    const hh = v.heightWorld; g.position.set(CHASM.x0 - 20, A.top - hh + 1.5, 410); scene.add(g); P.yiBridge = g;
  }
  // old colonnade fragments on mesa B (background of the crossing) + amphitheatre / stage
  const B = MESA_B; const colMat = stoneMat();
  P.mesaRuins = new THREE.Group();
  for (const [x, z, h, br] of [[1130, 290, 150, 0], [1160, 382, 150, 0], [1112, 432, 120, 1], [1545, 520, 110, 1]]) {
    const c = makeColumn({ h, r: 9, broken: br, seed: x + z, mat: colMat }); c.position.set(x, B.top, z); P.mesaRuins.add(c);
  }
  scene.add(P.mesaRuins);
  // amphitheatre: stage disc at S, seat rows arcing on the -z/-x side, facing the stage
  const S = new THREE.Vector3(1360, B.top, 450); P.stageC = S;
  const seatMat = stoneMat('#e0d2b6'); const stageMat = stoneMat('#efe4cf', 0xf2ebdd);
  P.seatMat = seatMat; P.stageMat = stageMat;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(46, 48, 6, 64), stageMat); disc.position.set(S.x, B.top + 3, S.z); shadowAll(disc); scene.add(disc); P.stageDisc = disc;
  const seats = [];
  for (let k = 0; k < 7; k++) {
    const rIn = 70 + k * 13, rOut = rIn + 13, hgt = 4 + k * 4.5;
    const sh = new THREE.Shape(); const a0 = Math.PI * 0.74, a1 = Math.PI * 1.26;
    sh.absarc(0, 0, rOut, a0, a1, false); sh.absarc(0, 0, rIn, a1, a0, true);
    const g = new THREE.ExtrudeGeometry(sh, { depth: hgt, bevelEnabled: false, curveSegments: 48 }); g.rotateX(-Math.PI / 2);
    seats.push(g);
  }
  P.seats = new THREE.Mesh(mergeGeometries(seats), seatMat); P.seats.position.set(S.x, B.top, S.z); shadowAll(P.seats); scene.add(P.seats);
  // the arch behind the stage
  const arch = new THREE.Group();
  for (const dx of [-38, 38]) { const c = makeColumn({ h: 110, r: 7, mat: colMat }); c.position.set(dx, 0, 0); arch.add(c); }
  const lint = new THREE.Mesh(new THREE.BoxGeometry(100, 12, 16), colMat); lint.position.y = 136; shadowAll(lint); arch.add(lint);
  arch.position.set(S.x + 95, B.top, S.z - 20); arch.rotation.y = Math.PI / 2; scene.add(arch); P.arch = arch;
  // spotlights (volumetric cones + real spot lights)
  P.spots = [];
  for (const col of ['#fff2d8', '#ff4fb8', '#3fd8ff']) {   // warm white (Jade), magenta (Charlie), cyan (Ricky)
    const cone = new THREE.Mesh(new THREE.ConeGeometry(16, 170, 32, 1, true).translate(0, -85, 0),
      new THREE.MeshBasicMaterial({ color: C(col).multiplyScalar(0.8), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.userData.noAO = true; cone.frustumCulled = false;
    const light = new THREE.SpotLight(C(col), 0, 400, 0.22, 0.45, 1.2); light.castShadow = false;
    const tgt = new THREE.Object3D(); scene.add(tgt); light.target = tgt;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(15, 40), new THREE.MeshBasicMaterial({ color: C(col).lerp(C('#ffffff'), 0.1), transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    pool.rotation.x = -Math.PI / 2; pool.userData.noAO = true;
    scene.add(cone); scene.add(light); scene.add(pool); P.spots.push({ cone, light, tgt, pool, col });
  }

  // ---- rap: SYNTAX books, monolith screen, giant pencil
  P.books = [];
  const bookTitles = [['SYNTAX', '#b8442e'], ['语法', '#2e5ab8'], ['{ ; }', '#3c8a4a'], ['GRAMMAR', '#8a3cb8'], ['语法书', '#b88a2e'], ['MANUAL', '#2e8ab8']];
  for (const [i, [title, col]] of bookTitles.entries()) {
    const g = new THREE.Group(); const w = 44, h = 66 - (i % 3) * 6, d = 14;
    const coverMat = new THREE.MeshStandardMaterial({ color: C(col), roughness: 0.7 }); coverMat.userData.plaster = 0xefe7d6;
    const pagesMat = new THREE.MeshStandardMaterial({ color: 0xf7f0de, roughness: 0.9 }); pagesMat.userData.plaster = 0xf7f2e8;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(-w / 2, h / 2, 0), [pagesMat, coverMat, pagesMat, pagesMat, coverMat, coverMat]); shadowAll(body); g.add(body);
    const tt = textTexture(title, { w: 512, h: 128, font: '900 92px InterVar, "Droid Sans Fallback", sans-serif', color: '#2e2e33' });
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(36, 9), new THREE.MeshBasicMaterial({ map: tt, transparent: true, depthWrite: false }));
    lab.position.set(-w / 2, h * 0.62, d / 2 + 0.3); lab.userData.noAO = true; g.add(lab);
    const lab2 = lab.clone(); lab2.position.z = -d / 2 - 0.3; lab2.rotation.y = Math.PI; g.add(lab2);
    g.userData = { w, h, d }; scene.add(g); P.books.push(g);
  }
  { // monolith screen
    const g = new THREE.Group();
    const frameM = stoneMat('#e4d6bc'); const fr = new THREE.Mesh(new THREE.BoxGeometry(70, 100, 10).translate(0, 50, 0), frameM); shadowAll(fr); g.add(fr);
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(58, 58), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.set(0, 60, 5.2); scr.userData.noAO = true; g.add(scr);
    g.userData = { cv, tex, key: '' }; P.monolith = g; scene.add(g);
    g.userData.draw = (text, cursor, glow) => {
      const key = text + '|' + cursor + '|' + glow.toFixed(2); if (key === g.userData.key) return; g.userData.key = key;
      const c = cv.getContext('2d'); c.fillStyle = '#0d1022'; c.fillRect(0, 0, 512, 512);
      c.strokeStyle = '#1f3d7a'; c.lineWidth = 2; for (let y = 0; y < 512; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
      c.font = '700 40px InterVar, monospace'; c.fillStyle = '#58f08a'; c.textAlign = 'left'; c.fillText('>', 40, 270);
      c.font = '700 120px "Droid Sans Fallback", sans-serif'; c.fillStyle = '#ffffff'; c.shadowColor = '#9ec2ff'; c.shadowBlur = 20 * glow; c.fillText(text, 90, 300); c.shadowBlur = 0;
      if (cursor) { const w = c.measureText(text).width; c.fillStyle = '#58f08a'; c.fillRect(100 + w, 200, 34, 110); }
      tex.needsUpdate = true;
    };
  }
  add('burst', new Burst(260, { size: 2.2 }));
  add('petals', new Burst(320, { size: 2.6, geo: new THREE.BoxGeometry(3, 1.2, 3) }));
  add('sparks', new Burst(120, { size: 1.2, color: '#ffffff', emissive: 2.5 }));
  { // giant every-colour pencil (yellow hex body, blue cap, rainbow tip)
    const g = new THREE.Group(); const L = 78;
    const bodyM = new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.5 }); bodyM.userData.noPaint = true;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, L, 6).translate(0, 14 + L / 2, 0), bodyM); g.add(body);
    const woodM = new THREE.MeshStandardMaterial({ color: 0xe8c08a, roughness: 0.7 }); woodM.userData.noPaint = true;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4, 12, 6).rotateX(Math.PI).translate(0, 8, 0), woodM); g.add(cone);
    const tipM = new THREE.MeshStandardMaterial({ color: 0xff4fb8, emissive: C('#ff4fb8'), emissiveIntensity: 1.5, roughness: 0.3 }); tipM.userData.noPaint = true;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4, 6).rotateX(Math.PI).translate(0, 2, 0), tipM); g.add(tip);
    const ferM = new THREE.MeshStandardMaterial({ color: 0xc8c8d0, roughness: 0.3, metalness: 0.8 }); ferM.userData.noPaint = true;
    const fer = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 6, 12).translate(0, 14 + L + 3, 0), ferM); g.add(fer);
    const capM = new THREE.MeshStandardMaterial({ color: 0x4f8bff, roughness: 0.6 }); capM.userData.noPaint = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.1, 7, 12).translate(0, 14 + L + 9.5, 0), capM); g.add(cap);
    shadowAll(g); P.pencil = g; scene.add(g); g.userData.tipMat = tipM;
  }
  { // co-op high-five / gesture star
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(3, 0), new THREE.MeshBasicMaterial({ color: C('#fff6d8').multiplyScalar(4), toneMapped: false }));
    star.userData.noAO = true; P.star = star; scene.add(star);
  }

  P.reset = () => {
    for (const k of ['boomer', 'gate2', 'lamp', 'voidWall', 'tramp', 'hatStack', 'beam', 'beam2', 'flowers', 'because', 'plate', 'gate', 'tripod', 'receiver', 'yiBridge', 'monolith', 'pencil', 'star', 'burst', 'petals', 'sparks']) P[k].visible = false;
    P.voidWall.material.uniforms.uT.value = -1;
    for (const b of P.blocks) b.visible = false;
    for (const g of P.gizmos) g.visible = false;
    for (const c of P.chant) { c.visible = false; c.hz.setAll(1); c.rotation.set(0, 0, 0); c.scale.setScalar(1); }
    for (const s of P.slabs) { s.visible = false; s.rotation.set(0, 0, 0); }
    P.slabGlowMat.color.set('#ffe7b0').multiplyScalar(0); P.functionsText.material.opacity = 0; P.fixturesText.material.opacity = 1;
    for (const s of P.switches) s.userData.orb.material.color.set('#8a8070');
    for (const b of P.books) { b.visible = false; b.rotation.set(0, 0, 0); }
    for (const s of P.spots) { s.cone.visible = false; s.light.intensity = 0; s.pool.visible = false; }
    P.crystalMat.emissiveIntensity = 0; P.recvMat.emissiveIntensity = 0;
    P.gate.userData.doorL.position.x = -8; P.gate.userData.doorR.position.x = 8;
    P.plate.userData.plate.position.y = 1.5; P.plate.userData.edgeMat.color.set('#6a6258');
    P.yiBridge.hz.setAll(0); P.yiBridge.hz.setColour(0);
  };
  return P;
}
