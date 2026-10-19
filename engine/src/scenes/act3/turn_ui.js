// ACT III · act3.turn UI: the Lost Vikings HUD + the REALITY build bar (Act II's widget), drawn into a render target
// so that on the 80.815 impact the whole 2D UI can SHATTER into pixel-grid shards that fall away with the VOID; then
// a small, brief "LEVEL LOADED" toast. All pure functions of t.
//   const ui = await makeTurnUI(ctx);  ui.update(t, { active, slotFlash, singing, chant });  ui.renderPre(renderer)
//   frame() returns ui2d: { scene: ui.scene, cam: ui.cam }
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { HUD, HUD_H, Subtitle, subtitleFor, panel } from '../../core/ui.js';
import { TextSprite } from '../../core/text.js';
import { rect, pixelCanvas, canvasTex, Quad } from '../../core/gfx.js';
import { PAL } from '../../core/palette.js';
import { locAt } from '../../show/loc.js';
import { ZUI } from '../../core/stage2d.js';

const GW = 320, GH = 180;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };

// ------------------------------------------------------------------ build bar (Act II owns src/show/build_bar.js; stub until it lands)
class StubBar extends THREE.Group {
  constructor({ x = 52, y = 164, w = 216 } = {}) {
    super(); this.x0 = x; this.y0 = y; this.w = w;
    this.bg = panel(w, 15, 'dialog'); this.bg.place(x, y); this.add(this.bg);
    this.title = new TextSprite({ text: 'REALITY LV1 → LV2', font: 'fp10', color: PAL.white, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bl' });
    this.title.place(x + 5, y + 3); this.title.userData.dz = 0.5; this.add(this.title);
    this.bx = x + 104; this.bw = w - 104 - 34;
    this.well = rect(this.bw + 2, 7, '#05060d'); this.well.place(this.bx - 1, y + 4); this.well.userData.dz = 0.2; this.add(this.well);
    this.fill = rect(1, 5, PAL.green); this.fill.userData.dz = 0.3; this.add(this.fill);
    this.hi = rect(1, 1, '#b8ffd0'); this.hi.userData.dz = 0.4; this.add(this.hi);
    this.pct = new TextSprite({ text: '0%', font: 'px', color: PAL.white, shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'br' });
    this.pct.place(x + w - 4, y + 4); this.pct.userData.dz = 0.5; this.add(this.pct);
  }
  set({ pct = 0, label, color } = {}) {
    const n = Math.max(0, Math.min(this.bw, Math.round(this.bw * pct))); const c = color || (pct >= 1 ? PAL.gold : PAL.green);
    this.fill.visible = this.hi.visible = n > 0;
    if (n > 0) { this.fill.setSize(n, 5); this.fill.place(this.bx, this.y0 + 5); this.fill.material.setColor(c); this.hi.setSize(n, 1); this.hi.place(this.bx, this.y0 + 9); }
    this.pct.set({ text: label || Math.round(pct * 100) + '%', color: pct >= 1 ? PAL.goldHi : PAL.white });
    return this;
  }
}
const LAST_HIT = 79.635;   // measured: the drums' last hit (launch), the bar reaches 100% here
const stubBuildAt = (t) => (t < T.snap(LAST_HIT) - 1e-6 ? 0.99 : 1);

// ------------------------------------------------------------------ shards (instanced tiles sampling the UI render target)
const SH_VS = /* glsl */`
  attribute vec4 aUV; varying vec2 vUv; varying vec2 vL;
  void main(){ vL = uv; vUv = aUV.xy + uv * aUV.zw; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`;
const SH_FS = /* glsl */`
  uniform sampler2D map; uniform float uCrack; uniform vec2 uEdge; uniform float uOpacity; varying vec2 vUv; varying vec2 vL;
  void main(){
    vec4 c = texture2D(map, vUv); if (c.a < 0.02) discard;
    vec2 e = min(vL, 1.0 - vL);
    if (e.x < uEdge.x || e.y < uEdge.y) c.rgb = mix(c.rgb, vec3(1.0, 0.96, 0.82), uCrack);
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
    #include <colorspace_fragment>
  }`;
function hash(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }

export async function makeTurnUI(ctx, { impact }) {
  const { width, height, renderer } = ctx; const lib = ctx.lib;
  // UI that shatters (rendered into rt)
  const uiScene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(0, GW, GH, 0, -10, 10);
  const addUI = (o, z) => { o.traverse((m) => { m.renderOrder = z + (m.userData.dz || 0); }); uiScene.add(o); return o; };
  const hud = addUI(new HUD(lib), ZUI.HUD);
  let BB = null; try { BB = await import('../../show/build_bar.js'); } catch (e) { BB = null; }
  const Bar = BB?.BuildBar || StubBar; const buildAt = BB?.buildAt || stubBuildAt;
  const bar = addUI(new Bar(), ZUI.BANNER);
  const usingStub = Bar === StubBar;
  // overlay (never shatters): shards, the pixel subtitle before the turn, the LEVEL LOADED toast
  const scene = new THREE.Scene();
  const rt = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  // tiles: the HUD band and the top band where the bar docks (empty tiles discard themselves)
  const TW = 10, TH = 9; const tiles = [];
  for (const [y0, y1, cx, cy] of [[0, HUD_H, 160, -6], [GH - 27, GH, 160, GH + 4]]) {
    for (let y = y0; y < y1; y += TH) for (let x = 0; x < GW; x += TW) { const w = Math.min(TW, GW - x), h = Math.min(TH, y1 - y); tiles.push({ x, y, w, h, cx, cy }); }
  }
  const geo = new THREE.PlaneGeometry(1, 1);
  const aUV = new Float32Array(tiles.length * 4); tiles.forEach((tl, i) => aUV.set([tl.x / GW, tl.y / GH, tl.w / GW, tl.h / GH], i * 4));
  geo.setAttribute('aUV', new THREE.InstancedBufferAttribute(aUV, 4));
  const shMat = new THREE.ShaderMaterial({ uniforms: { map: { value: rt.texture }, uCrack: { value: 0 }, uEdge: { value: new THREE.Vector2(1 / TW, 1 / TH) }, uOpacity: { value: 1 } },
    vertexShader: SH_VS, fragmentShader: SH_FS, transparent: true, depthTest: false, depthWrite: false });
  const shards = new THREE.InstancedMesh(geo, shMat, tiles.length); shards.frustumCulled = false; shards.renderOrder = ZUI.HUD; scene.add(shards);
  const sub = new Subtitle({ y: HUD_H + 3 }); sub.traverse((m) => { m.renderOrder = ZUI.SUBS + (m.userData.dz || 0); }); scene.add(sub);
  // toast: a small pill under where the bar was
  const toast = new THREE.Group();
  const tText = new TextSprite({ text: 'LEVEL LOADED', font: 'sk', color: '#ffffff', shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bl' });
  const check = new Quad(canvasTex(pixelCanvas(8, 7, (g, px) => { const c = PAL.green; px(0, 3, c, 2, 2); px(1, 4, c, 2, 2); px(2, 5, c, 2, 2); px(4, 3, c, 2, 2); px(5, 1, c, 2, 2); px(6, 0, c, 2, 2); })), 8, 7);
  const tw = tText.w + 8 + 12, th = 13; const tbg = panel(tw, th, 'dialog');
  toast.add(tbg, check, tText); tbg.place(0, 0); check.place(5, 3); tText.place(16, 3); check.userData.dz = tText.userData.dz = 0.5;
  toast.userData.w = tw; toast.traverse((m) => { m.renderOrder = ZUI.BANNER + (m.userData.dz || 0); }); scene.add(toast);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3();
  const IMP = impact;

  return {
    scene, cam, hud, bar, usingStub, buildAt,
    /** o: { active, slot, slotFlash, singing: {..} } */
    update(t, o = {}) {
      // ---- HUD (Jade holds both pencils the whole act: hair DOWN portrait = the HUD default)
      hud.visible = false;   // (v4) the HUD (LINES OF CODE / portraits) is retired; only the build bar shatters on the impact
      // ---- build bar: 99% stuck through the roll, 100% on the last hit, then only its text moves (silence)
      // (after the impact the bar keeps its last state: the shards sample it while they fall)
      const tb = Math.min(t, T.snap(IMP) - 0.5 / T.fps());
      const loading = tb >= T.snap(79.87) - 1e-6; const dots = ['.', '..', '...'][Math.floor((tb - 79.87) / 0.2 + 1e-6) % 3];
      if (usingStub) { const pct = buildAt(tb); bar.set({ pct }); bar.title.set({ text: loading ? 'LOADING' + dots : 'REALITY LV1 → LV2' }); }
      else {
        const b = buildAt(tb); bar.set({ ...b, visible: true, dock: 1, text: loading ? '100% · LOADING' + dots : b.text }, tb);
        // the long text goes where the label was (left of the full gold bar) instead of over the bar
        if (loading && bar.wide) bar.wide.place(bar.x0 + 6 + Math.floor(bar.wide.w / 2), bar.y0 + 3);
      }
      // ---- shards: in place before the impact, falling away after (with a 1-frame crack flash)
      const s = t - T.snap(IMP);
      shMat.uniforms.uCrack.value = s >= 0 && s < 0.1 ? 1 - s / 0.1 : 0;
      tiles.forEach((tl, i) => {
        let x = tl.x + tl.w / 2, y = tl.y + tl.h / 2, rz = 0, sc = 1;
        const dx = x - tl.cx, dy = y - tl.cy; const d = Math.hypot(dx, dy) || 1;
        const delay = 0.015 + 0.0009 * d + 0.03 * hash(i, 1);
        const u = s - delay;
        if (u > 0) {
          const sp = 60 + 120 * hash(i, 2), up = 50 + 140 * hash(i, 3);
          x += (dx / d) * sp * u + (hash(i, 4) - 0.5) * 30 * u;
          y += (dy / d) * sp * 0.25 * u + up * u - 0.5 * 620 * u * u;
          rz = (hash(i, 5) - 0.5) * 14 * u; sc = Math.max(0.2, 1 - 0.7 * u);
        }
        m4.compose(v.set(x, y, 0), q.setFromEuler(e.set(0, 0, rz)), s3.set(tl.w * sc, tl.h * sc, 1)); shards.setMatrixAt(i, m4);
      });
      shards.instanceMatrix.needsUpdate = true;
      shards.visible = s < 1.6;
      shMat.uniforms.uOpacity.value = 1 - smooth(0.6, 1.4, s);
      // ---- pixel subtitle before the turn (smooth subtitles take over after it, see make3D)
      const c18 = subtitleFor(t, 18); sub.visible = t < T.snap(IMP) - 1e-6 && !!c18; if (sub.visible) sub.set({ top: null, bot: c18.bot });
      // ---- LEVEL LOADED: a small toast that drops in where the bar was, then leaves (subtle; no big card)
      const ta = IMP + 0.42, tz = IMP + 1.55; toast.visible = false;   // (v4) drop 1 = a clear frame: no LEVEL LOADED toast
      if (toast.visible) { const inn = smooth(ta, ta + 0.12, t), out = smooth(tz, tz + 0.18, t);
        toast.position.set(Math.round(GW / 2 - toast.userData.w / 2), Math.round(GH - 4 - th + (1 - inn) * 18 + out * 22), 0); }
    },
    /** draw the shattering UI into its render target (call before the frame's overlay pass) */
    renderPre() {
      const prevT = renderer.getRenderTarget(), prevC = renderer.getClearColor(new THREE.Color()), prevA = renderer.getClearAlpha(), ac = renderer.autoClear;
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.autoClear = true; renderer.clear(); renderer.render(uiScene, cam);
      renderer.setRenderTarget(prevT); renderer.setClearColor(prevC, prevA); renderer.autoClear = ac;
    },
  };
}
