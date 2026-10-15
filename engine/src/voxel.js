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
