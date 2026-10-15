// Stage2D: the CARTRIDGE / VOID look. A world scene on the 320x180 game-pixel grid seen by a pixel-perfect
// orthographic camera, plus a crisp UI overlay (HUD, subtitles, dialogue) that never shakes or zooms.
//
//   const st = new Stage2D(ctx, { bg: PAL.paper });
//   st.add(obj, Z.ACTOR)          world layer (pixelated by the post shader at block = outH / (180 / zoom))
//   st.addUI(obj, ZUI.SUBS)       UI layer in fixed 320x180 screen pixels (0,0 = bottom-left)
//   st.cam.set({ x, y, zoom, shake: [sx, sy] })  centre in world px; zoom 1 = 320x180 visible
//   st.fx.flash = 1               white flash this frame (the runner composites it over everything)
//
// Pixel-perfect rules: the camera's bottom-left is snapped to whole world pixels, so every Quad placed on
// integer coordinates lands exactly on output blocks. Zoom 2 = 2x bigger pixels (6 px blocks at 540p).
// Non-integer zoom is allowed for moves (pull-backs, dives); blocks are then fractional but still uniform-ish.
import * as THREE from 'three';

export const GAME_W = 320, GAME_H = 180;
/** World z-order (render order). Leave gaps so teams can slot layers in between. */
export const Z = { BG: 0, BG2: 5, PARALLAX: 10, BACK: 20, PLATFORM: 30, PROP: 40, ACTOR_BACK: 45, ACTOR: 50, ACTOR_FRONT: 55, FRONT: 60, FX: 70, TEXT: 80, HERO: 90, TOP: 99 };
/** UI z-order (separate pass, drawn after the world, unaffected by camera, shake and pixel post) */
export const ZUI = { BACK: 0, HUD: 10, BANNER: 20, SUBS: 30, DIALOG: 40, TOP: 50 };

export class PixelCamera {
  constructor() {
    this.cam = new THREE.OrthographicCamera(0, GAME_W, GAME_H, 0, 0.1, 4000);
    this.cam.position.set(0, 0, 1000); this.cam.lookAt(0, 0, 0);
    this.x = GAME_W / 2; this.y = GAME_H / 2; this.zoom = 1; this.shake = [0, 0];
  }
  set(o) { Object.assign(this, o); return this; }
  get vw() { return GAME_W / this.zoom; }
  get vh() { return GAME_H / this.zoom; }
  /** bottom-left of the view in world px (snapped) */
  get left() { return Math.round(this.x - this.vw / 2 + this.shake[0]); }
  get bottom() { return Math.round(this.y - this.vh / 2 + this.shake[1]); }
  /** screen (0..320, 0..180) -> world */
  toWorld(sx, sy) { return [this.left + sx / this.zoom, this.bottom + sy / this.zoom]; }
  toScreen(wx, wy) { return [(wx - this.left) * this.zoom, (wy - this.bottom) * this.zoom]; }
  apply() {
    const c = this.cam, l = this.left, b = this.bottom;
    c.left = l; c.right = l + this.vw; c.bottom = b; c.top = b + this.vh;
    c.updateProjectionMatrix(); c.updateMatrixWorld();
    return c;
  }
}

export class Stage2D {
  constructor(ctx, { bg = '#000000', palette = null, palMix = 0, dither = 0.35 } = {}) {
    this.ctx = ctx;
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(bg);
    this.ui = new THREE.Scene();
    this.uiCam = new THREE.OrthographicCamera(0, GAME_W, GAME_H, 0, -10, 10);
    this.cam = new PixelCamera();
    this.look = { palette, palMix, dither };
    this.fx = { flash: 0, flashColor: '#ffffff', fade: 0, fadeColor: '#000000' };
    this.kind = '2d';
  }
  setBg(c) { this.scene.background.set(c); }
  add(obj, z = Z.PROP) { obj.traverse((o) => { o.renderOrder = z + (o.userData.dz || 0); }); this.scene.add(obj); return obj; }
  addUI(obj, z = ZUI.HUD) { obj.traverse((o) => { o.renderOrder = z + (o.userData.dz || 0); }); this.ui.add(obj); return obj; }
  // composite widgets: set child.userData.dz (e.g. 0.5) to draw a child above its siblings within the same layer
  /** block size in output pixels for the current zoom */
  pix(outH) { return outH / (GAME_H / this.cam.zoom); }
  /** reset per-frame FX (the runner calls this before update) */
  beginFrame() { this.fx.flash = 0; this.fx.fade = 0; }
}
