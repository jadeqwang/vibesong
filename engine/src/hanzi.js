// Make Me a Hanzi stroke data -> voxel geometry with per-stroke draw-on.
//
// Data: one JSON line per character from data/graphics.txt:
//   { character, strokes: [svgPath...], medians: [[[x,y],...], ...] }
// Coordinates live in a 1024 box, y-UP, baseline such that y ∈ [-124, 900].
// The render server exposes GET /hanzi/<char> returning that JSON line.
//
// voxelizeHanzi(data, opts) rasterises every stroke outline onto a grid of
// `cells` x `cells` voxels (cell = 1024/cells font units). For each filled cell
// it records the stroke index (stroke order) and `param` = normalised arc length
// (0..1) of the nearest point on that stroke's median. A HanziVoxels object
// renders these as one InstancedMesh; setProgress(i, p) shows stroke i drawn
// from its start to fraction p along its median (voxels pop in with a short
// grow + emissive "ink tip" glow). Everything is a pure function of the
// progress values -> deterministic.

import * as THREE from 'three';

// ---------------------------------------------------------- SVG path -> polygon
function flattenPath(d, seg = 8) {
  const toks = d.match(/[MLQCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
  const pts = []; let i = 0, cx = 0, cy = 0, cmd = null;
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    if (/[MLQCZ]/i.test(toks[i])) cmd = toks[i++].toUpperCase();
    if (cmd === 'M' || cmd === 'L') { cx = num(); cy = num(); pts.push([cx, cy]); }
    else if (cmd === 'Q') {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num();
      for (let s = 1; s <= seg; s++) { const t = s / seg, u = 1 - t;
        pts.push([u * u * cx + 2 * u * t * x1 + t * t * x2, u * u * cy + 2 * u * t * y1 + t * t * y2]); }
      cx = x2; cy = y2;
    } else if (cmd === 'C') {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
      for (let s = 1; s <= seg; s++) { const t = s / seg, u = 1 - t;
        pts.push([u*u*u*cx + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3, u*u*u*cy + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3]); }
      cx = x3; cy = y3;
    } else if (cmd === 'Z') { /* closed */ }
    else i++;
  }
  return pts;
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// normalised arc-length parameter of the closest point on a polyline
function medianParam(x, y, med) {
  let total = 0; const lens = [];
  for (let i = 1; i < med.length; i++) { const l = Math.hypot(med[i][0] - med[i-1][0], med[i][1] - med[i-1][1]); lens.push(l); total += l; }
  let best = Infinity, bestS = 0, acc = 0;
  for (let i = 1; i < med.length; i++) {
    const [ax, ay] = med[i-1], [bx, by] = med[i]; const dx = bx - ax, dy = by - ay; const L2 = dx*dx + dy*dy || 1;
    let t = ((x - ax) * dx + (y - ay) * dy) / L2; t = Math.max(0, Math.min(1, t));
    const px = ax + dx * t, py = ay + dy * t, dd = (x - px) ** 2 + (y - py) ** 2;
    if (dd < best) { best = dd; bestS = acc + t * lens[i-1]; }
    acc += lens[i-1];
  }
  return total > 0 ? bestS / total : 0;
}

/**
 * @returns {{cells:number, cellSize:number, voxels:Array<{gx,gy,stroke,param}>, strokeCount:number, bounds}}
 * gx, gy: integer grid coords (gy up). cellSize in font units.
 */
export function voxelizeHanzi(data, { cells = 128 } = {}) {
  const cs = 1024 / cells;
  const polys = data.strokes.map((d) => flattenPath(d));
  const voxels = []; let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  for (let gy = 0; gy < cells; gy++) for (let gx = 0; gx < cells; gx++) {
    const x = (gx + 0.5) * cs, y = -124 + (gy + 0.5) * cs;
    for (let s = 0; s < polys.length; s++) {
      if (pointInPoly(x, y, polys[s])) {
        voxels.push({ gx, gy, stroke: s, param: medianParam(x, y, data.medians[s]) });
        minx = Math.min(minx, gx); maxx = Math.max(maxx, gx); miny = Math.min(miny, gy); maxy = Math.max(maxy, gy);
        break; // first stroke wins on overlaps (earlier in stroke order)
      }
    }
  }
  // distance (in cells) from each voxel to the character's silhouette edge -> pillow depth + dry-brush
  const occ = new Uint8Array(cells * cells); for (const v of voxels) occ[v.gy * cells + v.gx] = 1;
  const D = new Float32Array(cells * cells); for (let i = 0; i < D.length; i++) D[i] = occ[i] ? 1e6 : 0;
  for (let gy = 0; gy < cells; gy++) for (let gx = 0; gx < cells; gx++) { const i = gy * cells + gx; if (!D[i]) continue;
    D[i] = Math.min(D[i], (gx ? D[i - 1] : 0) + 1, (gy ? D[i - cells] : 0) + 1); }
  for (let gy = cells - 1; gy >= 0; gy--) for (let gx = cells - 1; gx >= 0; gx--) { const i = gy * cells + gx; if (!D[i]) continue;
    D[i] = Math.min(D[i], (gx < cells - 1 ? D[i + 1] : 0) + 1, (gy < cells - 1 ? D[i + cells] : 0) + 1); }
  for (const v of voxels) v.edge = D[v.gy * cells + v.gx];
  return { cells, cellSize: cs, voxels, strokeCount: polys.length, bounds: { minx, miny, maxx, maxy } };
}

export async function loadHanzi(ch, base = '') {
  const r = await fetch(`${base}/hanzi/${encodeURIComponent(ch)}`);
  if (!r.ok) throw new Error('hanzi not found: ' + ch);
  return r.json();
}

/**
 * Build an InstancedMesh for a voxelized character.
 * opts: voxel (world size per cell), depth (voxels along z), origin (world pos of grid min corner,
 *       i.e. bounds.minx/miny maps here), color, tipColor, material overrides.
 */
export class HanziVoxels {
  constructor(vox, { voxel = 1, depth = 12, origin = new THREE.Vector3(), color = 0x1c2030, tipColor = 0x3b7bff,
    jitter = 0.02, seed = 1, pillow = true, dryBrush = 0.35 } = {}) {
    this.vox = vox; this.voxel = voxel; this.depth = depth;
    let rng = seed >>> 0; const rand = () => { rng = (rng + 0x6D2B79F5) >>> 0; let t = rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    // per-cell extrusion: rounded "pillow" (thin at the brush edge, full depth inside); dry-brush gaps at the rim
    const cols = [];
    for (const v of vox.voxels) {
      const streak = Math.sin(v.param * 37.0 + v.stroke * 3.1) * 0.5 + 0.5;
      if (v.edge <= 1 && rand() < dryBrush * (0.4 + 0.6 * streak) * (0.5 + 0.5 * v.param)) continue;
      const d = pillow ? Math.max(2, Math.min(depth, Math.round(2 + (depth - 2) * Math.sqrt(Math.min(1, (v.edge - 0.5) / 4))))) : depth;
      cols.push([v, d]);
    }
    const n = cols.reduce((a, [, d]) => a + d, 0);
    const geo = new THREE.BoxGeometry(voxel, voxel, voxel);
    const aStroke = new Float32Array(n), aParam = new Float32Array(n), aEdge = new Float32Array(n);
    this.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.0, envMapIntensity: 1.2 });
    this.material.userData.noPaint = true; // the ink strokes stay graphite
    this.uniforms = { uProg: { value: new Array(32).fill(1) }, uTip: { value: new THREE.Color(tipColor) }, uGrow: { value: 0.035 } };
    this.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute float aStroke; attribute float aParam; attribute float aEdge; uniform float uProg[32]; uniform float uGrow;
          varying float vTip; varying float vEdge; varying float vParam; varying float vStroke;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float prog = uProg[int(aStroke + 0.5)];
          float k = clamp((prog - aParam) / uGrow, 0.0, 1.0);
          k = k * k * (3.0 - 2.0 * k);
          transformed *= k;
          vEdge = aEdge; vParam = aParam; vStroke = aStroke;
          vTip = (prog < 0.999) ? (1.0 - smoothstep(0.0, 0.12, prog - aParam)) * step(aParam, prog) : 0.0;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform vec3 uTip; varying float vTip; varying float vEdge; varying float vParam; varying float vStroke;
          float inkH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float inkN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
            return mix(mix(inkH(i), inkH(i+vec2(1,0)), f.x), mix(inkH(i+vec2(0,1)), inkH(i+vec2(1,1)), f.x), f.y); }
          float inkMix(){ // 0 = wet glossy ink core, 1 = dry graphite brush edge; streaks run along the stroke
            float e = clamp((vEdge - 1.0) / 3.0, 0.0, 1.0);
            float streak = inkN(vec2(vEdge * 1.7 + vStroke * 5.3, vParam * 7.0)) * 0.6 + inkN(vec2(vEdge * 5.1, vParam * 40.0)) * 0.4;
            return clamp(pow(1.0 - e, 1.4) * (0.35 + 0.9 * streak) + smoothstep(0.85, 1.0, vParam) * 0.35 * streak, 0.0, 1.0); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          float im = inkMix();
          diffuseColor.rgb = mix(vec3(0.012, 0.012, 0.016), vec3(0.17, 0.168, 0.165), im);`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          roughnessFactor = mix(0.16, 0.62, im);`)
        .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
          metalnessFactor = mix(0.0, 0.45, im);`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += uTip * vTip * 6.0; diffuseColor.rgb = mix(diffuseColor.rgb, uTip, vTip * 0.8);`);
    };
    this.depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    this.depthMaterial.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute float aStroke; attribute float aParam; uniform float uProg[32]; uniform float uGrow;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float prog = uProg[int(aStroke + 0.5)];
          float k = clamp((prog - aParam) / uGrow, 0.0, 1.0);
          transformed *= k;`);
    };
    const mesh = new THREE.InstancedMesh(geo, this.material, n);
    mesh.customDepthMaterial = this.depthMaterial;
    const m = new THREE.Matrix4(), c = new THREE.Color(), base = new THREE.Color(color);
    let i = 0; const { minx, miny } = vox.bounds;
    for (const [v, d] of cols) for (let z = 0; z < d; z++) {
      m.makeTranslation(origin.x + (v.gx - minx + 0.5) * voxel, origin.y + (v.gy - miny + 0.5) * voxel, origin.z + (z - d / 2 + 0.5) * voxel);
      mesh.setMatrixAt(i, m);
      c.copy(base).offsetHSL(0, 0, (rand() - 0.5) * jitter); mesh.setColorAt(i, c);
      aStroke[i] = v.stroke; aParam[i] = v.param; aEdge[i] = v.edge; i++;
    }
    geo.setAttribute('aStroke', new THREE.InstancedBufferAttribute(aStroke, 1));
    geo.setAttribute('aParam', new THREE.InstancedBufferAttribute(aParam, 1));
    geo.setAttribute('aEdge', new THREE.InstancedBufferAttribute(aEdge, 1));
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    this.mesh = mesh;
    this.widthWorld = (vox.bounds.maxx - minx + 1) * voxel;
    this.heightWorld = (vox.bounds.maxy - miny + 1) * voxel;
  }
  /** progress of stroke i (stroke order index), 0..1 along its median */
  setProgress(i, p) { this.uniforms.uProg.value[i] = Math.max(0, Math.min(1, p)); }
  setAll(p) { for (let i = 0; i < 32; i++) this.uniforms.uProg.value[i] = p; }
  /** convenience: draw strokes sequentially; global progress g in [0, strokeCount] */
  setSequential(g) { for (let i = 0; i < 32; i++) this.setProgress(i, g - i); }
  /** top surface height (world y) of column at world x, or null */
  surfaceAt(worldX, origin) {
    const gx = Math.floor((worldX - origin.x) / this.voxel) + this.vox.bounds.minx;
    let best = null;
    for (const v of this.vox.voxels) if (v.gx === gx) best = Math.max(best ?? -1e9, v.gy);
    return best === null ? null : origin.y + (best - this.vox.bounds.miny + 1) * this.voxel;
  }
}
