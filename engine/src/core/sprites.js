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
import { meshVoxelGrid, distToEdge8, scale2x } from '../voxel.js';
import { loadTurnarounds, buildFigure, pose, figureModel, FIGURE_SRC, patchVoxelEdges } from './voxfig.js';

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
  async preloadAll(prefixes) {
    await this.preload(Object.keys(this.meta).filter((k) => !prefixes || prefixes.some((p) => k.startsWith(p))));
    // sculpted 3D hero turnarounds (A-4; built-in stand-ins until the art lands), used by Actor.voxel() figures
    if (!this.turn) { try { this.turn = await loadTurnarounds(this.base); } catch (e) { console.warn('[sprites] turnarounds: ' + e.message); this.turn = null; } }
  }
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
/** `_hi` strips held back from the voxel heroes (canon review, density team 2026-10-15): Actor.voxel falls back to the
 *  Scale2x upscale of the canon low-res strip. ART_REQUESTS A-3 review: the hair-down Jade redraws invented headphones.
 *  Remove a name once the art is re-delivered. */
export const HI_HOLD = new Set(['jade_sing_hi', 'jade_draw_rainbow_hi', 'jade_draw_graphite_hi', 'jade_run_hairdown_hi']);
/** timing for figure-only anims (a pose with no sprite strip; voxelFigure only) */
const FIG_ONLY_TIMING = { n: 8, meta: { fps: 8, loop: true } };
/** heroes built as sculpted voxel figures by Actor.voxel() (bugs and props stay extruded) */
export const FIGURE_HEROES = ['jade', 'charlie', 'ricky'];
export const ALL_HERO_STRIPS = [...new Set(Object.values(STRIPS).flatMap((m) => Object.values(m)))];


/** recolour dark silhouette-outline pixels (touching transparency) from their brighter interior neighbours, in place */
function deOutline(px, W, H) {
  const lum = (i) => (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
  const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && px[(y * W + x) * 4 + 3] >= 128;
  const src = px.slice(); const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!op(x, y) || lum(i) > 0.16) continue;
    if (!N4.some(([dx, dy]) => !op(x + dx, y + dy))) continue; // not on the silhouette
    let best = -1, bl = 0.22;
    for (let r = 1; r <= 2 && best < 0; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (!op(x + dx, y + dy)) continue; const j = (y + dy) * W + x + dx;
      const l = (0.299 * src[j * 4] + 0.587 * src[j * 4 + 1] + 0.114 * src[j * 4 + 2]) / 255; if (l > bl) { bl = l; best = j; }
    }
    if (best < 0) continue; // dark region (hair, boots): keep
    for (let c = 0; c < 3; c++) px[i * 4 + c] = Math.round(src[best * 4 + c] * 0.72);
  }
}

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
   * opts: scale, material, depth { baseDepth, depthPerPixel, maxDepth } (pillow extrusion in sprite pixels; default max 16
   *       for volume from 3/4 angles), back: true | 'strip_name' | false. With back, the rear half (-z) of every frame is built
   *       from a BACK-VIEW strip (BACKS map: jade_back, jade_back_hairdown when a pencil is in hand, charlie_back,
   *       ricky_back; used only if present in sprites.json), mirrored about the feet anchor, so a hero seen from
   *       behind shows its back (dot + RARE EARTH, the guitar on Charlie's back...) instead of a mirrored relief.
   *       density (default 2 when scale >= 0.5, else 1): voxels per sprite pixel along each axis. The model keeps its world
   *       size; at density 2 every strip uses `<strip>_hi` (2x frame, anchor 2*[ax, ay] + [0, 1], ART_REQUESTS A-3) when it
   *       exists, else a Scale2x upscale of the low-res strip (smoothed diagonals). Frames are face-culled meshes with
   *       baked voxel AO (src/voxel.js meshVoxelGrid), one per (strip, frame), built lazily and cached.
   *       deoutline (default true, upscale fallback only): the 2D sprites' dark silhouette outline is recoloured from the
   *       adjacent interior colour (darkened), so the 3D figure is shaded by light instead of wrapped in a black shell.
   */
  voxel({ scale = 1, material, back = false, depth = {}, density, ao = 0.32, deoutline = true, figure = 'auto' } = {}) {
    if (figure !== false && FIGURE_HEROES.includes(this.name) && this.lib.turn) return this.voxelFigure({ scale, material });
    const self = this; const g = new THREE.Group(); const cache = new Map();
    const DEN = density ?? (scale >= 0.5 ? 2 : 1);
    const D = { baseDepth: 2, depthPerPixel: 2, maxDepth: 16, ...depth };
    material = material || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); // shared by every frame (patchable once)
    material.vertexColors = true; material.userData.noPaint = true;
    const raw = (sp) => { if (!sp._data) { const cv = document.createElement('canvas'); cv.width = sp.img.width; cv.height = sp.img.height; const c2 = cv.getContext('2d'); c2.drawImage(sp.img, 0, 0); sp._data = c2.getImageData(0, 0, cv.width, cv.height); } return sp._data; };
    const pixels = (strip, f) => {
      const hiName = strip + '_hi'; const hi = DEN === 2 && !HI_HOLD.has(hiName) && self.lib.has(hiName) && self.lib.cache?.has(hiName);
      const sp = self.lib.get(hi ? hiName : strip); f = ((f % sp.n) + sp.n) % sp.n;
      const data = raw(sp); let W = sp.w, H = sp.h, px = new Uint8ClampedArray(W * H * 4);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * data.width + f * W + x) * 4, o = (y * W + x) * 4; px[o] = data.data[i]; px[o + 1] = data.data[i + 1]; px[o + 2] = data.data[i + 2]; px[o + 3] = data.data[i + 3]; }
      let ax = sp.meta.anchor[0], ay = sp.meta.anchor[1];
      if (DEN === 2 && !hi && deoutline) deOutline(px, W, H);
      if (DEN === 2 && !hi) { const up = scale2x(px, W, H); W = up.w; H = up.h; px = up.data; ax = 2 * ax; ay = 2 * ay + 1; }
      else if (DEN !== 1 && !hi) throw new Error('Actor.voxel: density must be 1 or 2');
      const mask = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) mask[i] = px[i * 4 + 3] >= 128 ? 1 : 0;
      return { W, H, mask, px, dist: distToEdge8(mask, W, H), ax, ay };
    };
    // pillow: total thickness in sprite pixels from the distance to the silhouette (in sprite pixels), soft-clamped at maxDepth
    const pillow = (dPx) => { const lin = D.baseDepth + D.depthPerPixel * (dPx - 1); const m = D.maxDepth; return Math.max(1, lin < m - 2 ? lin : m - 2 * Math.exp(-(lin - m + 2) / 2)); };
    const halfN = (dHi) => Math.max(1, Math.ceil(pillow((dHi + DEN - 1) / DEN) * DEN / 2)); // voxels per side
    const frameMesh = (strip, f, bstrip) => {
      const key = strip + ':' + f + ':' + (bstrip || ''); if (cache.has(key)) return cache.get(key);
      const F = pixels(strip, f), Bk = bstrip ? pixels(bstrip, 0) : null;
      const cells = new Map(); // key rx,ry (hi units, relative to the anchor) -> { f: [n, i, px], b: [n, i, px] }
      const put = (rx, ry, side, n, i, P) => { const k = rx + ',' + ry; const o = cells.get(k) || {}; o[side] = [n, i, P]; cells.set(k, o); };
      for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) { const i = y * F.W + x; if (F.mask[i]) put(x - F.ax, F.ay - y, 'f', halfN(F.dist[i]), i, F.px); }
      // back strip mirrored about the centre of the anchor pixel (x = 0.5 sprite px = DEN/2 voxels)
      if (Bk) for (let y = 0; y < Bk.H; y++) for (let x = 0; x < Bk.W; x++) { const i = y * Bk.W + x; if (Bk.mask[i]) put(DEN - 1 - (x - Bk.ax), Bk.ay - y, 'b', halfN(Bk.dist[i]), i, Bk.px); }
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, zmax = 1;
      for (const [k, o] of cells) { const [rx, ry] = k.split(',').map(Number); x0 = Math.min(x0, rx); x1 = Math.max(x1, rx); y0 = Math.min(y0, ry); y1 = Math.max(y1, ry); zmax = Math.max(zmax, (o.f || o.b)[0], (o.b || o.f)[0]); }
      const nx = x1 - x0 + 1, ny = y1 - y0 + 1, nz = 2 * zmax; const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3);
      for (const [k, o] of cells) {
        const [rx, ry] = k.split(',').map(Number); const fr = o.f || o.b, bk = o.b || o.f; const gx = rx - x0, gy = ry - y0;
        const fill = (z, src) => { const j = gx + nx * (gy + ny * z); occ[j] = 1; const P = src[2], i = src[1] * 4; col[j * 3] = P[i]; col[j * 3 + 1] = P[i + 1]; col[j * 3 + 2] = P[i + 2]; };
        for (let z = 0; z < fr[0]; z++) fill(zmax + z, fr);
        for (let z = 0; z < bk[0]; z++) fill(zmax - 1 - z, bk);
      }
      const s = scale / DEN;
      const geo = meshVoxelGrid({ nx, ny, nz, occ, col }, { s, origin: [x0 * s, y0 * s, -zmax * s], ao });
      const mesh = new THREE.Mesh(geo, material);
      mesh.castShadow = mesh.receiveShadow = true; mesh.userData.noPaint = true;
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
  /**
   * Sculpted, rigged voxel figure (core/voxfig.js): carved from the hero's turnaround views, posed procedurally from the same
   * set({ anim, t | frame, pencil, facing, x, y }) state (anim timing = the strip's fps / frame count, so beat-locked frames
   * keep working). Jade: the hair canon picks the variant (hair-down + pencils in hand whenever the resolved strip is a
   * hair-down strip, else the bun with the X pencils). facing -1 turns the figure around (no mirroring); back / back_run
   * anims turn its back to the +z camera, as the back-view strips did. Use voxel({ figure: false }) for the extruded sprite.
   */
  voxelFigure({ scale = 1, material } = {}) {
    const self = this; const g = new THREE.Group(); const orient = new THREE.Group(); orient.scale.setScalar(scale); g.add(orient);
    material = material || new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
    material.vertexColors = true; material.userData.noPaint = true;
    const hero = this.name; const variants = new Map();
    const lib = this.lib; lib._figModels ||= new Map();
    const get = (vname) => {
      if (variants.has(vname)) return variants.get(vname);
      const mkey = FIGURE_SRC + ':' + vname; let model = lib._figModels.get(mkey);
      if (!model) { model = figureModel(vname, lib.turn); lib._figModels.set(mkey, model); }   // source switch: voxfig FIGURE_SRC ('carve' default | 'native')
      if (model.native) patchVoxelEdges(material, model.u / model.native.res * scale, 0.2);   // native: shader voxel-edge ring, faded with distance
      const F = buildFigure(model, material, { hero, down: vname === 'jade_down', items: lib.turn.items }); F.hatless = vname === 'charlie_nohat'; orient.add(F.root); variants.set(vname, F); return F;
    };
    g.set = (s) => {
      Object.assign(self.state, s); const st = self.state;
      const strip = self.stripFor(st.anim, st.pencil);
      // figure-only anims (no sprite strip, e.g. Charlie 'chord' / 'sustain' with the acoustic): procedural pose, 8 frames @ 8 fps
      const sp = self.lib.cache?.has(strip) ? self.lib.get(strip) : FIG_ONLY_TIMING;
      const down = hero === 'jade' && HAIR_DOWN.has(strip);
      // Charlie's hat: per call (never kept in state). hat:false = hatless; undefined = auto (hatless while the hat is the shield / parachute / trampoline / pull prop)
      const hatOff = hero === 'charlie' && lib.turn.heroes.charlie_nohat && (s.hat === false || (s.hat === undefined && /hat_(shield|parachute|trampoline|pull)$/.test(strip)));
      delete st.hat;
      const vname = hero === 'jade' ? (down ? 'jade_down' : 'jade_up') : hatOff ? 'charlie_nohat' : hero;
      const F = get(vname); for (const [k, v] of variants) v.root.visible = k === vname;
      const n = sp.n, fps = sp.meta.fps; let p;
      if (st.frame !== undefined && st.frame !== null) p = (((Math.floor(st.frame) % n) + n) % n) / n;
      else { const f = Math.max(0, st.t || 0) * fps; p = sp.meta.loop ? (f / n) % 1 : Math.min(1, f / Math.max(1, n - 1 + 0.999)); }
      const animName = self.strips[st.anim] ? st.anim : strip;
      pose(F, animName, p, { hero, pencil: down });
      const isBack = /(^|_)back(_|$)/.test(animName) || /_back(_|$)/.test(strip);
      orient.rotation.y = isBack ? Math.PI / 2 : ((st.facing ?? 1) < 0 ? Math.PI : 0);
      if (st.x !== undefined) g.position.x = st.x; if (st.y !== undefined) g.position.y = st.y;
      g.scale.set(1, 1, 1);
      g.curStrip = strip; g.variant = vname;
      return g;
    };
    g.prebuild = (anims, pencil = false) => { for (const a of anims) g.set({ anim: a, t: 0, pencil }); return g; };
    /** world position of the posed figure's hand ('R' | 'L'), after set(): scenes can attach props to it instead of fixed heights */
    g.hand = (side = 'R', out = new THREE.Vector3()) => { const F = variants.get(g.variant); if (!F) return out.copy(g.position); const h = F.J['hand' + side]; h.updateWorldMatrix(true, false); return h.getWorldPosition(out); };
    g.figure = true;
    return g;
  }
}
