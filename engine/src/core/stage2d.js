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
import { CS, CS_GLSL, csAt, csTintVec } from './colorscript.js';

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

// ------------------------------------------------------------------ v4 colour script: the 2D grade path (unit "color")
// Only when the colour script is enabled (`--look k08b+cs`, src/core/colorscript.js). Each world / UI material is patched
// once (its main() wrapped: csGrade on gl_FragColor) and gets a per-material keep value every frame from state the scenes
// already set: hero Actors (jade / charlie / ricky), Pencil props, rainbow Hanzi2D (style 1 or an active colour flood),
// PixelMaterial rainbow FX, or an explicit `userData.cs` (0..1, inherited by children; scenes' hooks: engine/COLOR_REQUESTS.md).
// UI: the subtitle layer (ZUI.SUBS) is exempt; every other UI layer is graded like the world. Disabled: nothing is patched.
const CSU = { uCsOn: { value: 0 }, uCsSat: { value: 1 }, uCsTintAmt: { value: 0 }, uCsKeepAmt: { value: 1 }, uCsTint: { value: new THREE.Vector3(1, 1, 1) } };
const CS_MAIN = /void\s+main\s*\(\s*(void)?\s*\)/;
function csPatch(m) {
  if (m.userData.csKeep) return m.userData.csKeep;
  const keep = m.userData.csKeep = { value: 0 };
  if (m.isShaderMaterial) {
    if (!CS_MAIN.test(m.fragmentShader)) return keep;
    Object.assign(m.uniforms, CSU, { uCsKeep: keep });
    m.fragmentShader = m.fragmentShader.replace(CS_MAIN, CS_GLSL + 'uniform float uCsKeep;\nvoid cs_main_()')
      + '\nvoid main(){ cs_main_(); if (uCsOn > 0.5) gl_FragColor.rgb = csGrade(gl_FragColor.rgb, uCsKeep); }\n';
  } else {
    const prev = m.onBeforeCompile, pk = m.customProgramCacheKey.bind(m);
    m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); Object.assign(sh.uniforms, CSU, { uCsKeep: keep });
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', CS_GLSL + 'uniform float uCsKeep;\nvoid main() {')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  if (uCsOn > 0.5) gl_FragColor.rgb = csGrade(gl_FragColor.rgb, uCsKeep);'); };
    m.customProgramCacheKey = () => pk() + '|cs2d';
  }
  m.needsUpdate = true;
  return keep;
}
/** the auto exemption of one object (null = inherit from the parent) */
function csKeepOf(o) {
  if (o.userData.cs != null) return +o.userData.cs;
  if (o.lib && o.strips && /^(jade|charlie|ricky)/.test(o.name || '')) return 1;     // a hero Actor: canon colours (they bring the colour)
  if (o.kinds && o.kinds.rainbow) return 1;                                           // a Pencil prop (either kind: the pencils are canon)
  const U = o.material && o.material.uniforms;
  if (U) {
    if (U.rainbow && U.rainbow.value > 0) return 1;                                   // PixelMaterial rainbow FX = the FUNCTIONS pencil's colour
    if (U.uStyle && (U.uStyle.value === 1 || (U.uFloodR && U.uFloodR.value > 0))) return 1;   // a rainbow / colour-flooded Hanzi2D stroke
  }
  return null;
}
function csWalk(o, inh, ui) {
  if (!o.visible) return;
  const k = csKeepOf(o), kk = k != null ? k : inh;
  if (o.material) {
    const sub = ui && o.renderOrder >= ZUI.SUBS && o.renderOrder < ZUI.DIALOG;        // the lyric bar: one style, never graded
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) csPatch(m).value = sub ? 1 : kk;
  }
  for (const c of o.children) csWalk(c, kk, ui);
}
function csHook(scene, ui) {
  scene.onBeforeRender = () => {
    if (!CS.enabled) return;
    const s = csAt(CS.t);
    CSU.uCsOn.value = s.on ? 1 : 0;
    if (!s.on) return;
    CSU.uCsSat.value = ui ? s.uiSat : s.sat2d; CSU.uCsTintAmt.value = s.tintAmt2d; CSU.uCsKeepAmt.value = s.keepAmt;
    CSU.uCsTint.value.set(...csTintVec(s.tint === 'dusk' ? 'dusk' : 'paper', !ui));   // world renders into a linear RT; UI is sRGB-encoded
    for (const c of scene.children) csWalk(c, 0, ui);
  };
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
    this.scene.userData.cs2d = true; csHook(this.scene, false); csHook(this.ui, true);   // v4 colour script (inert unless enabled)
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
