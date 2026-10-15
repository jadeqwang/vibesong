// Deterministic video clips as textures (R-C1). A clip is sampled by time, frame-exact:
//   frame = clamp(round(dt * clip.fps), 0, n - 1)   (dt = seconds since the clip's start on YOUR timeline)
// mp4/webm sources are decoded ONCE by the render server into a cached JPEG sequence (out/cache/clips/), so every
// render (any order, any worker) sees identical pixels. JPEG/PNG sequences can be used directly.
//
//   const v = await VideoClip.load('/media/clips/jade_sing_bridge_1.mp4');          // preloads all frames (default)
//   const v = await VideoClip.load('/media/clips/x.mp4', { fps: 30 });               // resample to 30 fps at decode
//   const v = await VideoClip.sequence('/media/act4/frames/', { n: 120, fps: 24, pattern: 'f_%05d.jpg', first: 1 });
//   quad.material.setMap(v.textureAt(t - t0));      // sync; returns the same THREE.Texture, image swapped per frame
// Long clips: pass { lazy: true } and call `await v.prepare(t - t0)` from your scene's prepare(t) (see ShowRunner).
import * as THREE from 'three';
import { loadImage } from './gfx.js';

const pad = (i, w) => String(i).padStart(w, '0');
function frameUrl(info, i) {
  const k = i + (info.first ?? 1);
  return info.base + info.pattern.replace(/%0(\d)d/, (_, w) => pad(k, +w)).replace('%d', String(k));
}

export class VideoClip {
  static async load(src, { fps, lazy = false, filter = 'linear' } = {}) {
    const r = await fetch(`/clip?src=${encodeURIComponent(src)}${fps ? `&fps=${fps}` : ''}`);
    if (!r.ok) throw new Error('VideoClip: ' + (await r.text()));
    const v = new VideoClip(await r.json(), { filter });
    if (!lazy) await v.preloadAll();
    return v;
  }
  static async sequence(base, { n, fps = 24, pattern = 'f_%05d.jpg', first = 1, lazy = false, filter = 'linear' } = {}) {
    const v = new VideoClip({ n, fps, base: base.endsWith('/') ? base : base + '/', pattern, first }, { filter });
    if (!lazy) await v.preloadAll();
    return v;
  }
  constructor(info, { filter = 'linear' } = {}) {
    this.info = info; this.n = info.n; this.fps = info.fps; this.cache = new Map(); this.cur = -1;
    this.texture = new THREE.Texture(); this.texture.colorSpace = THREE.SRGBColorSpace; this.texture.generateMipmaps = false;
    this.texture.minFilter = this.texture.magFilter = filter === 'nearest' ? THREE.NearestFilter : THREE.LinearFilter;
  }
  get duration() { return this.n / this.fps; }
  frameIndex(dt) { return Math.max(0, Math.min(this.n - 1, Math.round(dt * this.fps))); }
  async _get(i) { if (!this.cache.has(i)) this.cache.set(i, await loadImage(frameUrl(this.info, i))); return this.cache.get(i); }
  async preloadAll() { for (let i = 0; i < this.n; i += 16) await Promise.all([...Array(Math.min(16, this.n - i)).keys()].map((k) => this._get(i + k))); }
  /** make sure the frame for dt (and a few after it) is loaded: call from scene.prepare(t) for lazy clips */
  async prepare(dt, ahead = 2) { const i = this.frameIndex(dt); for (let k = 0; k <= ahead; k++) if (i + k < this.n) await this._get(i + k); }
  /** the texture showing the frame at dt (sync). Throws if that frame isn't loaded (lazy clip without prepare). */
  textureAt(dt) {
    const i = this.frameIndex(dt);
    if (i !== this.cur) {
      const img = this.cache.get(i); if (!img) throw new Error(`VideoClip frame ${i} not loaded: call await clip.prepare(dt) in scene.prepare`);
      this.texture.image = img; this.texture.needsUpdate = true; this.cur = i;
    }
    return this.texture;
  }
}
