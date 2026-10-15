// Sprite actors. Strips come LIVE from assets/sprites (served at /sprites/) via sprites.json, so art-dept
// updates drop in without engine changes. One strip = one animation (frames laid out horizontally).
//
//   const lib = await SpriteLib.load();              // ctx.lib in scenes (shared, cached)
//   const jade = new Actor(lib, CAST_STRIPS.jade);   // or lib.actor('jade')
//   jade.set({ x, y, anim:'run', t, facing: 1, pencil:false });   // x,y = feet in world px
//   stage.add(jade, Z.ACTOR)
//
// Animation time: set({ t }) uses the strip's own fps (loop / clamp per sprites.json);
// set({ frame }) picks a frame explicitly (e.g. beat-locked run cycles from choreo.js).
//
// JADE HAIR CANON (bible): hair UP (bun + crossed pencils) whenever her hands are empty; hair DOWN whenever
// a pencil is in her hand. Actor enforces it: with pencil:true, 'run' maps to jade_run_hairdown, 'idle'
// maps to jade_sing frame 0 ... and asking for a hair-up strip while pencil:true throws in strict mode.
//
// 3D: actor.voxel() returns a VoxelSprite-like Group (instanced cubes per frame) using the same strips and
// the same canon mapping; call voxel.set({...}) with the same arguments.
import * as THREE from 'three';
import { Quad, imageTex, loadImage } from './gfx.js';
import { distToEdge } from '../voxel.js';

export class SpriteLib {
  static async load(base = '/sprites/') {
    const meta = await (await fetch(base + 'sprites.json', { cache: 'no-store' })).json();
    const lib = new SpriteLib(meta.sprites, base);
    return lib;
  }
  constructor(meta, base) { this.meta = meta; this.base = base; this.cache = new Map(); }
  has(name) { return !!this.meta[name]; }
  /** preload strips (await before rendering; textures must exist before first frame) */
  async preload(names) {
    await Promise.all(names.map(async (n) => {
      if (this.cache.has(n)) return;
      const m = this.meta[n]; if (!m) throw new Error('no sprite ' + n);
      const img = await loadImage(this.base + m.file + '?v=' + (m.colors || 0));
      this.cache.set(n, { meta: m, img, tex: imageTex(img), w: m.frame_w, h: m.frame_h, n: m.frames });
    }));
  }
  async preloadAll(prefixes) { await this.preload(Object.keys(this.meta).filter((k) => !prefixes || prefixes.some((p) => k.startsWith(p)))); }
  get(name) { const s = this.cache.get(name); if (!s) throw new Error(`sprite ${name} not preloaded`); return s; }
  /** colours used by a set of strips (for building quantise palettes) */
  colors(names) {
    const out = new Set();
    for (const n of names) {
      const { img } = this.get(n); const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const g = cv.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, img.width, img.height).data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 127) out.add('#' + ((1 << 24) | (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]).toString(16).slice(1));
    }
    return [...out];
  }
}

/** Strip maps per hero. Keys are animation names used by choreography. */
export const STRIPS = {
  jade: {
    idle: 'jade_idle', run: 'jade_run', jump: 'jade_jump', victory: 'jade_victory', back: 'jade_back',
    // pencil in hand -> hair DOWN
    draw_graphite: 'jade_draw_graphite', draw_rainbow: 'jade_draw_rainbow', sing: 'jade_sing', drum: 'jade_drum', run_pencil: 'jade_run_hairdown',
    back_pencil: 'jade_back_hairdown', back_run_pencil: 'jade_back_hairdown_run',
  },
  charlie: { idle: 'charlie_idle', run: 'charlie_run', back: 'charlie_back', back_run: 'charlie_back_run', jump: 'charlie_jump', shield: 'charlie_hat_shield', parachute: 'charlie_hat_parachute',
    trampoline: 'charlie_hat_trampoline', throw: 'charlie_hat_throw', pull: 'charlie_hat_pull' },
  ricky: { idle: 'ricky_idle', run: 'ricky_run', back: 'ricky_back', back_run: 'ricky_back_run', jump: 'ricky_jump', chord: 'ricky_power_chord', sustain: 'ricky_sustain', victory: 'ricky_victory' },
  eraser: { chase: 'eraser_chase_x2', loom: 'eraser_loom_x2', redeemed: 'eraser_redeemed_x2', chase1: 'eraser_chase', loom1: 'eraser_loom', redeemed1: 'eraser_redeemed' },
};
/** back-view strips per hero (R-C2); used by Actor.voxel({ back: true }) when present in sprites.json */
export const BACKS = { jade: 'jade_back', jade_pencil: 'jade_back_hairdown', charlie: 'charlie_back', ricky: 'ricky_back' };
const HAIR_DOWN = new Set(['jade_back_hairdown', 'jade_back_hairdown_run', 'jade_back_down', 'jade_draw_graphite', 'jade_draw_rainbow', 'jade_sing', 'jade_drum', 'jade_run_hairdown']);
/** when Jade holds a pencil, these hair-up anims are remapped to hair-down equivalents */
const PENCIL_REMAP = { run: 'run_pencil', idle: 'sing', jump: 'run_pencil', victory: 'draw_rainbow', back: 'back_pencil', back_run: 'back_run_pencil' };
export const ALL_HERO_STRIPS = [...new Set(Object.values(STRIPS).flatMap((m) => Object.values(m)))];

export class Actor extends Quad {
  constructor(lib, strips, { name = '', strict = true } = {}) {
    super(null, 1, 1);
    this.lib = lib; this.strips = typeof strips === 'string' ? STRIPS[strips] : strips; this.name = name || (typeof strips === 'string' ? strips : '');
    this.strict = strict; this.state = { anim: Object.keys(this.strips)[0], t: 0, facing: 1, pencil: false };
    this.visible = true;
  }
  /** resolve an anim name to a strip name, applying Jade's hair canon */
  stripFor(anim, pencil) {
    let a = anim;
    if (pencil && this.name === 'jade' && PENCIL_REMAP[a]) a = PENCIL_REMAP[a];
    const s = this.strips[a] || a;
    if (this.name === 'jade' && this.strict) {
      if (pencil && s.startsWith('jade_') && !HAIR_DOWN.has(s)) throw new Error(`Jade canon: pencil in hand but strip ${s} has hair up`);
      if (!pencil && HAIR_DOWN.has(s)) throw new Error(`Jade canon: strip ${s} has hair down / pencil in hand; pass pencil:true`);
    }
    return s;
  }
  /** s: { x, y, anim, t, frame, facing (1 right, -1 left), pencil, flash, sil:[r,g,b,a], opacity, visible } */
  set(s) {
    Object.assign(this.state, s);
    const st = this.state;
    if (st.visible === false) { this.visible = false; return this; }
    this.visible = true;
    const name = this.stripFor(st.anim, st.pencil);
    const sp = this.lib.get(name);
    if (this.material.uniforms.map.value !== sp.tex) this.material.setMap(sp.tex);
    let f;
    if (st.frame !== undefined && st.frame !== null) f = st.frame;
    else { const k = Math.floor(Math.max(0, st.t) * sp.meta.fps + 1e-6); f = sp.meta.loop ? k % sp.n : Math.min(sp.n - 1, k); }
    f = ((Math.floor(f) % sp.n) + sp.n) % sp.n;
    this.setRect(f / sp.n, 0, 1 / sp.n, 1);
    const [ax, ay] = sp.meta.anchor; // top-left origin, feet contact pixel
    this.anchor = [ax, sp.h - 1 - ay];
    this.w = sp.w; this.h = sp.h;
    this.setFlip((st.facing ?? 1) < 0);
    this.material.uniforms.flash.value = st.flash || 0;
    if (st.sil) this.material.uniforms.sil.value.set(...st.sil); else this.material.uniforms.sil.value.set(0, 0, 0, 0);
    this.material.uniforms.opacity.value = st.opacity ?? 1;
    this.place(st.x ?? this.px, st.y ?? this.py);
    this.curStrip = name; this.curFrame = f;
    return this;
  }
  /**
   * Build a voxel (3D) version: a Group with .set() taking the same state. Hair canon is shared.
   * opts: scale, material, depth { baseDepth, depthPerPixel, maxDepth } (pillow extrusion; default max 16 for volume
   *       from 3/4 angles), back: true | 'strip_name' | false. With back, the rear half (-z) of every frame is built
   *       from a BACK-VIEW strip (BACKS map: jade_back, jade_back_hairdown when a pencil is in hand, charlie_back,
   *       ricky_back; used only if present in sprites.json), mirrored about the feet anchor, so a hero seen from
   *       behind shows its back (dot + RARE EARTH, the guitar on Charlie's back...) instead of a mirrored relief.
   */
  voxel({ scale = 1, material, back = false, depth = {} } = {}) {
    const self = this; const g = new THREE.Group(); const cache = new Map();
    const D = { baseDepth: 2, depthPerPixel: 2, maxDepth: 16, ...depth };
    material = material || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); // shared by every frame (patchable once)
    const pixels = (strip, f) => {
      const sp = self.lib.get(strip); f = ((f % sp.n) + sp.n) % sp.n;
      if (!sp._data) { const cv = document.createElement('canvas'); cv.width = sp.img.width; cv.height = sp.img.height; const c2 = cv.getContext('2d'); c2.drawImage(sp.img, 0, 0); sp._data = c2.getImageData(0, 0, cv.width, cv.height); }
      const W = sp.w, H = sp.h, mask = new Uint8Array(W * H), col = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * sp._data.width + f * W + x) * 4; if (sp._data.data[i + 3] >= 128) { mask[y * W + x] = 1; col[y * W + x] = [sp._data.data[i], sp._data.data[i + 1], sp._data.data[i + 2]]; } }
      return { W, H, mask, col, dist: distToEdge(mask, W, H), ax: sp.meta.anchor[0], ay: sp.meta.anchor[1] };
    };
    const pillow = (d) => Math.max(1, Math.min(D.maxDepth, Math.round(D.baseDepth + D.depthPerPixel * (d - 1))));
    const frameMesh = (strip, f, bstrip) => {
      const key = strip + ':' + f + ':' + (bstrip || ''); if (cache.has(key)) return cache.get(key);
      const F = pixels(strip, f), Bk = bstrip ? pixels(bstrip, 0) : null;
      const cells = new Map(); // key rx,ry -> { f: [depth, rgb], b: [depth, rgb] }
      const put = (rx, ry, side, d, c) => { const k = rx + ',' + ry; const o = cells.get(k) || {}; o[side] = [d, c]; cells.set(k, o); };
      for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) if (F.mask[y * F.W + x]) put(x - F.ax, F.ay - y, 'f', pillow(F.dist[y * F.W + x]), F.col[y * F.W + x]);
      if (Bk) for (let y = 0; y < Bk.H; y++) for (let x = 0; x < Bk.W; x++) if (Bk.mask[y * Bk.W + x]) put(-(x - Bk.ax), Bk.ay - y, 'b', pillow(Bk.dist[y * Bk.W + x]), Bk.col[y * Bk.W + x]);
      const cubes = [];
      for (const [k, o] of cells) {
        const [rx, ry] = k.split(',').map(Number); const fr = o.f || o.b, bk = o.b || o.f;
        const nf = Math.ceil(fr[0] / 2), nb = Math.ceil(bk[0] / 2);
        for (let z = 0; z < nf; z++) cubes.push([rx, ry, z + 0.5, fr[1]]);
        for (let z = 0; z < nb; z++) cubes.push([rx, ry, -z - 0.5, bk[1]]);
      }
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(scale, scale, scale), material, cubes.length);
      const m4 = new THREE.Matrix4(), c = new THREE.Color();
      cubes.forEach(([x, y, z, rgb], i) => { m4.makeTranslation((x + 0.5) * scale, (y + 0.5) * scale, z * scale); mesh.setMatrixAt(i, m4); mesh.setColorAt(i, c.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace)); });
      mesh.castShadow = mesh.receiveShadow = true; mesh.userData.noPaint = true; material.userData.noPaint = true;
      mesh.visible = false; g.add(mesh); cache.set(key, mesh); return mesh;
    };
    g.set = (s) => {
      Object.assign(self.state, s); const st = self.state;
      const strip = self.stripFor(st.anim, st.pencil); const sp = self.lib.get(strip);
      let f = st.frame ?? Math.floor(Math.max(0, st.t) * sp.meta.fps + 1e-6); f = sp.meta.loop ? f % sp.n : Math.min(sp.n - 1, f);
      let bstrip = null;
      if (back) { const cand = typeof back === 'string' ? back : (self.name === 'jade' && st.pencil ? BACKS.jade_pencil : BACKS[self.name]); if (cand && self.lib.has(cand)) bstrip = cand; }
      for (const m of cache.values()) m.visible = false;
      frameMesh(strip, f, bstrip).visible = true;
      if (st.x !== undefined) g.position.x = st.x; if (st.y !== undefined) g.position.y = st.y;
      g.scale.x = (st.facing ?? 1) < 0 ? -1 : 1;
      return g;
    };
    /** prebuild every frame of the given anims (so material patches / shader compiles happen in setup) */
    g.prebuild = (anims, pencil = false) => { for (const a of anims) { const sp = self.lib.get(self.stripFor(a, pencil)); for (let f = 0; f < sp.n; f++) g.set({ anim: a, frame: f, pencil }); } return g; };
    return g;
  }
}
