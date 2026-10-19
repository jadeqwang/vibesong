// Pixel-art sprite -> instanced-cube voxel model.
//
// Sprite format (see assets/sprites/*.json):
//   PNG strip, frames laid out horizontally, each frameWidth x frameHeight,
//   transparent background (alpha < 128 = empty). Sidecar JSON:
//   { image, frameWidth, frameHeight, frames, anims:{name:{frames:[..],fps}},
//     voxel:{ baseDepth, depthPerPixel, maxDepth } }
//
// One cube per opaque pixel column, extruded symmetrically in z. Depth per pixel
// is a "pillow": clamp(baseDepth + depthPerPixel * distToSilhouetteEdge, .., maxDepth),
// so torsos/heads are thicker than arms/outlines. 1 pixel = `scale` world units.
// Feet (bottom row of the frame) sit at y=0, sprite centred on x=0, z=0.

import * as THREE from 'three';

export async function loadImageData(url) {
  const img = new Image(); img.src = url; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, img.width, img.height);
}

export function distToEdge(mask, w, h) {
  // chamfer distance (4-neighbour) from each opaque pixel to nearest empty pixel
  const D = new Float32Array(w * h).fill(1e6);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!mask[y * w + x]) D[y * w + x] = 0;
  for (let pass = 0; pass < 2; pass++) {
    const ys = pass ? [...Array(h).keys()].reverse() : [...Array(h).keys()];
    const xs = pass ? [...Array(w).keys()].reverse() : [...Array(w).keys()];
    for (const y of ys) for (const x of xs) {
      const i = y * w + x; if (!D[i]) continue;
      const nb = pass ? [[x + 1, y], [x, y + 1]] : [[x - 1, y], [x, y - 1]];
      for (const [nx, ny] of nb) {
        const v = (nx < 0 || ny < 0 || nx >= w || ny >= h) ? 0 : D[ny * w + nx];
        D[i] = Math.min(D[i], v + 1);
      }
    }
  }
  return D;
}

/** Build one InstancedMesh for frame `f` of a sprite sheet. */
export function voxelizeFrame(imgData, meta, f, { scale = 1, material } = {}) {
  const W = meta.frameWidth, H = meta.frameHeight, ox = f * W;
  const { baseDepth = 2, depthPerPixel = 2, maxDepth = 10 } = meta.voxel || {};
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) mask[y * W + x] = imgData.data[((y * imgData.width) + ox + x) * 4 + 3] >= 128 ? 1 : 0;
  const D = distToEdge(mask, W, H);
  const cubes = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!mask[y * W + x]) continue;
    const i = ((y * imgData.width) + ox + x) * 4;
    const col = new THREE.Color().setRGB(imgData.data[i] / 255, imgData.data[i + 1] / 255, imgData.data[i + 2] / 255, THREE.SRGBColorSpace);
    const depth = Math.max(1, Math.min(maxDepth, Math.round(baseDepth + depthPerPixel * (D[y * W + x] - 1))));
    for (let z = 0; z < depth; z++) cubes.push([x, y, z - (depth - 1) / 2, col]);
  }
  const geo = new THREE.BoxGeometry(scale, scale, scale);
  const mat = material || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
  const mesh = new THREE.InstancedMesh(geo, mat, cubes.length);
  const m = new THREE.Matrix4();
  cubes.forEach(([x, y, z, c], k) => {
    m.makeTranslation((x - W / 2 + 0.5) * scale, (H - 1 - y + 0.5) * scale, z * scale);
    mesh.setMatrixAt(k, m); mesh.setColorAt(k, c);
  });
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

/** A voxel character: a Group holding one mesh per frame; setTime(t) picks the anim frame. */
export class VoxelSprite extends THREE.Group {
  static async load(url, opts = {}) {
    const meta = await (await fetch(url)).json();
    const base = url.slice(0, url.lastIndexOf('/') + 1);
    const img = await loadImageData(base + meta.image);
    return new VoxelSprite(img, meta, opts);
  }
  constructor(img, meta, opts = {}) {
    super();
    this.meta = meta; this.frames = [];
    for (let f = 0; f < meta.frames; f++) { const m = voxelizeFrame(img, meta, f, opts); m.visible = f === 0; this.frames.push(m); this.add(m); }
    this.anim = Object.keys(meta.anims || {})[0];
  }
  showFrame(f) { this.frames.forEach((m, i) => (m.visible = i === f)); }
  /** deterministic: frame chosen from explicit time t (seconds) and phase offset */
  setTime(t, phase = 0) {
    const a = this.meta.anims?.[this.anim]; if (!a) return;
    const idx = Math.floor((t + phase) * a.fps) % a.frames.length;
    this.showFrame(a.frames[(idx + a.frames.length) % a.frames.length]);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Face-culled voxel mesher (density pass, 2026-10-15). Only faces between a filled and an empty voxel are emitted,
// with classic per-vertex voxel AO baked into the vertex colour (soft creases make small voxel figures read).
//   grid = { nx, ny, nz, occ: Uint8Array(nx*ny*nz), col: Uint8Array(nx*ny*nz*3) sRGB bytes }   index = x + nx*(y + ny*z)
//   opts = { s: voxel size, origin: [x,y,z] world position of voxel (0,0,0)'s min corner, ao: 0..1 crease darkening }
// Returns an indexed BufferGeometry with position / normal (Int8 normalized) / color (linear) attributes.
/** stable hash of an integer voxel index -> [0, 1) */
export function voxHash(x, y, z) { let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const SRGB2LIN = new Float32Array(256).map((_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
// Opt-in "voxel read" (MODELS team round 2, 2026-10-16; default OFF so the world look is unchanged):
//   jitter: per-voxel value jitter (+-jitter, hashed from the GLOBAL voxel index = hashOrigin + local index; stable over time)
//   edge:   darken a thin border ring of every face (each face = an inner quad + 4 border quads, outer vertices x (1 - edge),
//           ring width `inset` of a voxel), so every voxel stays visible inside flat single-colour areas (k08b look)
//   edgeAttr: instead of baking the ring darkness into the colour, emit a float attribute `voxEdge` (1 outer ring, 0 inner) so a
//           shader can apply it and fade it with on-screen voxel size (no shimmer when a voxel is ~1 px; voxfig native figures)
export function meshVoxelGrid(grid, { s = 1, origin = [0, 0, 0], ao = 0.32, jitter = 0, edge = 0, inset = 0.14, hashOrigin = [0, 0, 0], edgeAttr = false } = {}) {
  const { nx, ny, nz, occ, col } = grid; const N = [nx, ny, nz];
  // optional per-face colours (grid.faceCol = { px, nx, py, ny, pz, nz }: Uint8Arrays laid out like col; 0,0,0,0-alpha-free:
  // a face uses its array when present, else the voxel colour). Lets a carved figure take each face from the view facing it.
  const FC = grid.faceCol || null; const fcArr = FC ? [[FC.nx, FC.px], [FC.ny, FC.py], [FC.nz, FC.pz]] : null;
  const at = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= nx || y >= ny || z >= nz) ? 0 : occ[x + nx * (y + ny * z)];
  const pos = [], nrm = [], clr = [], idx = [], ved = []; let nv = 0;
  const p = [0, 0, 0], q = [0, 0, 0];
  const aoK = [1 - ao, 1 - ao * 0.62, 1 - ao * 0.28, 1];
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const i = x + nx * (y + ny * z); if (!occ[i]) continue;
    let r0 = SRGB2LIN[col[i * 3]], g0 = SRGB2LIN[col[i * 3 + 1]], b0 = SRGB2LIN[col[i * 3 + 2]];
    if (jitter) { const jf = 1 + jitter * (2 * voxHash(x + hashOrigin[0], y + hashOrigin[1], z + hashOrigin[2]) - 1); r0 *= jf; g0 *= jf; b0 *= jf; }
    for (let a = 0; a < 3; a++) for (let sg = -1; sg <= 1; sg += 2) {
      p[0] = x; p[1] = y; p[2] = z; p[a] += sg; if (at(p[0], p[1], p[2])) continue;
      let r = r0, g = g0, b = b0; const fa = fcArr && fcArr[a][sg > 0 ? 1 : 0];
      if (fa && fa[i * 3 + 3 * 0] + fa[i * 3 + 1] + fa[i * 3 + 2] > 0) { r = SRGB2LIN[fa[i * 3]]; g = SRGB2LIN[fa[i * 3 + 1]]; b = SRGB2LIN[fa[i * 3 + 2]]; }
      const u = (a + 1) % 3, v = (a + 2) % 3; const base = nv;
      const lv = [];
      if (edge) {   // inner quad + 4 border quads; outer ring darkened
        const cc4 = [], pp4 = [];
        for (let c = 0; c < 4; c++) {
          const du = c === 1 || c === 2 ? 1 : 0, dv = c >= 2 ? 1 : 0;
          q[0] = p[0]; q[1] = p[1]; q[2] = p[2]; q[u] += du ? 1 : -1; const s1 = at(q[0], q[1], q[2]);
          q[u] = p[u]; q[v] += dv ? 1 : -1; const s2 = at(q[0], q[1], q[2]);
          q[u] += du ? 1 : -1; const cc = at(q[0], q[1], q[2]);
          const l = s1 && s2 ? 0 : 3 - (s1 + s2 + cc); cc4.push(aoK[l]);
          const w = [x, y, z]; w[a] += sg > 0 ? 1 : 0; w[u] += du; w[v] += dv; pp4.push(w);
        }
        const n = [0, 0, 0]; n[a] = sg * 127; const ek = 1 - edge;
        for (let ring = 0; ring < 2; ring++) for (let c = 0; c < 4; c++) {   // 0..3 outer, 4..7 inner
          const w = pp4[c].slice(); if (ring) { const du = c === 1 || c === 2 ? 1 : 0, dv = c >= 2 ? 1 : 0; w[u] += du ? -inset : inset; w[v] += dv ? -inset : inset; }
          const k = cc4[c] * (ring || edgeAttr ? 1 : ek); if (edgeAttr) ved.push(ring ? 0 : 1);
          pos.push(origin[0] + w[0] * s, origin[1] + w[1] * s, origin[2] + w[2] * s); nrm.push(n[0], n[1], n[2]); clr.push(r * k, g * k, b * k); nv++;
        }
        const quad = (A, B, C, D) => { if (sg > 0) idx.push(base + A, base + B, base + C, base + A, base + C, base + D); else idx.push(base + A, base + C, base + B, base + A, base + D, base + C); };
        quad(4, 5, 6, 7); quad(0, 1, 5, 4); quad(1, 2, 6, 5); quad(2, 3, 7, 6); quad(3, 0, 4, 7);
        continue;
      }
      for (let c = 0; c < 4; c++) {
        const du = c === 1 || c === 2 ? 1 : 0, dv = c >= 2 ? 1 : 0;
        // AO: the voxels in the layer in front of the face, around this corner
        q[0] = p[0]; q[1] = p[1]; q[2] = p[2]; q[u] += du ? 1 : -1; const s1 = at(q[0], q[1], q[2]);
        q[u] = p[u]; q[v] += dv ? 1 : -1; const s2 = at(q[0], q[1], q[2]);
        q[u] += du ? 1 : -1; const cc = at(q[0], q[1], q[2]);
        const l = s1 && s2 ? 0 : 3 - (s1 + s2 + cc); lv.push(l); const k = aoK[l];
        const w = [x, y, z]; w[a] += sg > 0 ? 1 : 0; w[u] += du; w[v] += dv;
        pos.push(origin[0] + w[0] * s, origin[1] + w[1] * s, origin[2] + w[2] * s);
        const n = [0, 0, 0]; n[a] = sg * 127; nrm.push(n[0], n[1], n[2]);
        clr.push(r * k, g * k, b * k); nv++;
      }
      // winding: CCW seen from outside; flip the diagonal so AO interpolates without the anisotropy seam
      const flip = lv[0] + lv[2] < lv[1] + lv[3];
      const t = sg > 0 ? (flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3]) : (flip ? [1, 3, 2, 1, 0, 3] : [0, 2, 1, 0, 3, 2]);
      for (const k of t) idx.push(base + k);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(nrm), 3, true));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(clr, 3));
  if (edgeAttr && ved.length) geo.setAttribute('voxEdge', new THREE.Float32BufferAttribute(ved, 1));
  geo.setIndex(nv > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  geo.computeBoundingSphere(); geo.computeBoundingBox();
  return geo;
}

/** 8-neighbour chamfer distance (1, 1.414) from each opaque pixel to the nearest empty pixel: rounder pillows than distToEdge */
export function distToEdge8(mask, w, h) {
  const D = new Float32Array(w * h); const S = Math.SQRT2;
  for (let i = 0; i < w * h; i++) D[i] = mask[i] ? 1e6 : 0;
  const g = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : D[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!D[i]) continue;
    D[i] = Math.min(D[i], g(x - 1, y) + 1, g(x, y - 1) + 1, g(x - 1, y - 1) + S, g(x + 1, y - 1) + S); }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!D[i]) continue;
    D[i] = Math.min(D[i], g(x + 1, y) + 1, g(x, y + 1) + 1, g(x + 1, y + 1) + S, g(x - 1, y + 1) + S); }
  return D;
}

/** Scale2x / EPX upscale of RGBA pixels (Uint8ClampedArray w*h*4) -> { w: 2w, h: 2h, data } (smooths pixel-art diagonals) */
export function scale2x(data, w, h) {
  const px = new Uint32Array(w * h);
  for (let i = 0; i < w * h; i++) px[i] = data[i * 4 + 3] < 128 ? 0 : ((data[i * 4] << 16) | (data[i * 4 + 1] << 8) | data[i * 4 + 2] | 0x1000000) >>> 0;
  const P = (x, y) => px[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  const W2 = w * 2, out = new Uint8ClampedArray(W2 * h * 2 * 4);
  const put = (x, y, c) => { const i = (y * W2 + x) * 4; if (!c) return; out[i] = (c >> 16) & 255; out[i + 1] = (c >> 8) & 255; out[i + 2] = c & 255; out[i + 3] = 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const E = P(x, y), A = P(x, y - 1), B = P(x + 1, y), C = P(x - 1, y), D = P(x, y + 1);
    let e0 = E, e1 = E, e2 = E, e3 = E;
    if (A !== D && C !== B) { e0 = C === A ? A : E; e1 = A === B ? B : E; e2 = C === D ? C : E; e3 = D === B ? B : E; }
    put(2 * x, 2 * y, e0); put(2 * x + 1, 2 * y, e1); put(2 * x, 2 * y + 1, e2); put(2 * x + 1, 2 * y + 1, e3);
  }
  return { w: W2, h: h * 2, data: out };
}
