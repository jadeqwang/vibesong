// Frame sequences of conformed AI clips, played as textures so the ENGINE keeps control of timing.
// Layout: media/act5/frames/<name>/<h>/f_00000.jpg ... + index.json { n, fps, w, h }
// (served via the /media/ mount in render.js).
// All frames are fetched in setup as <img> elements (compressed in memory); the needed one is uploaded on
// demand: at(u) / frame(i) are pure functions of their argument -> deterministic.
import * as THREE from 'three';

const BASE = '/media/act5/frames';

export class FrameSeq {
  static async load(name, ctx, { prefer } = {}) {
    const h = prefer || (ctx.height <= 540 ? 540 : 1080);
    for (const hh of [h, 1080, 540]) {
      const r = await fetch(`${BASE}/${name}/${hh}/index.json`).catch(() => null);
      if (r && r.ok) { const idx = await r.json(); const s = new FrameSeq(name, hh, idx); await s.preload(); return s; }
    }
    console.warn(`[act5] frame seq ${name} missing`);
    return null;
  }
  constructor(name, h, idx) {
    Object.assign(this, { name, h, n: idx.n, fps: idx.fps || 30, ext: idx.ext || 'jpg' });
    this.tex = new THREE.Texture(); this.tex.minFilter = THREE.LinearFilter; this.tex.magFilter = THREE.LinearFilter; this.tex.generateMipmaps = false;
    this.cur = -1; this.imgs = [];
  }
  async preload() {
    const jobs = [];
    for (let i = 0; i < this.n; i++) {
      const img = new Image(); img.src = `${BASE}/${this.name}/${this.h}/f_${String(i).padStart(5, '0')}.${this.ext}`;
      this.imgs.push(img); jobs.push(img.decode().catch(() => {}));
    }
    await Promise.all(jobs);
  }
  /** texture showing frame i (clamped) */
  frame(i) {
    i = Math.max(0, Math.min(this.n - 1, Math.round(i)));
    if (i !== this.cur) { this.tex.image = this.imgs[i]; this.tex.needsUpdate = true; this.cur = i; }
    return this.tex;
  }
  /** u in [0,1] over the whole clip */
  at(u) { return this.frame(u * (this.n - 1)); }
  /** clip time in seconds (at the sequence fps) */
  time(s) { return this.frame(s * this.fps); }
  get duration() { return this.n / this.fps; }
}
