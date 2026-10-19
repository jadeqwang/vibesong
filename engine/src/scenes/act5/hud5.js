// ACT V · the second build bar's last 1.4 s (173.02 -> 174.40) and its exit, on the half-1 320x180 UI grid.
//   173.02-173.19  REALITY LV2 → LV3 · 100% gold (= Act IV's last frame, 173.0: same widget, same state)
//   173.19-174.40  '100% · LOADING' + animated dots (. .. ... every 0.2 s): the only motion in the silence (like 79.87)
//   174.40         IMPACT: the bar SHATTERS into pixel-grid shards that fall away (the turn's 80.815 HUD shatter)
//   174.82-175.95  a small '✓ LEVEL LOADED' toast at the top (the turn's rule: no big card)
// The bar itself is Act IV/Act II's widget (src/show/build_bar.js buildAt2 / BuildBar2, read-only here). The shatter + toast
// are a copy of act3/turn_ui.js's (top band only). Pure function of t.
//   const hud = makeAct5HUD(ctx);  hud.update(t);  hud.render(renderer, target)
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { BuildBar2, buildAt2 } from '../../show/build_bar.js';
import { panel } from '../../core/ui.js';
import { TextSprite } from '../../core/text.js';
import { pixelCanvas, canvasTex, Quad } from '../../core/gfx.js';
import { PAL } from '../../core/palette.js';
import { ZUI } from '../../core/stage2d.js';


const GW = 320, GH = 180;
export const HUD5 = { silence: 173.19, impact: 174.40, toastIn: 174.82, toastOut: 175.95 };
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
function hash(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }

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

/** the bar's text at t: '100%' until the silence, then '100% · LOADING' + 1..3 dots (0.2 s each) */
export function loadingText(t) {
  if (t < HUD5.silence - 1e-6) return null;
  return '100% · LOADING' + ['.', '..', '...'][Math.floor((t - HUD5.silence) / 0.2 + 1e-6) % 3];
}

export function makeAct5HUD(ctx) {
  const { width, height, renderer } = ctx;
  // the bar, rendered into rt (it is what shatters)
  const uiScene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(0, GW, GH, 0, -10, 10);
  const bar = new BuildBar2(); bar.traverse((m) => { m.renderOrder = ZUI.BANNER + (m.userData.dz || 0); }); uiScene.add(bar);
  const rt = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  // overlay: shards + toast
  const scene = new THREE.Scene();
  const TW = 10, TH = 9; const tiles = [];
  { const y0 = GH - 27, y1 = GH, cx = 160, cy = GH + 4;
    for (let y = y0; y < y1; y += TH) for (let x = 0; x < GW; x += TW) tiles.push({ x, y, w: Math.min(TW, GW - x), h: Math.min(TH, y1 - y), cx, cy }); }
  const geo = new THREE.PlaneGeometry(1, 1);
  const aUV = new Float32Array(tiles.length * 4); tiles.forEach((tl, i) => aUV.set([tl.x / GW, tl.y / GH, tl.w / GW, tl.h / GH], i * 4));
  geo.setAttribute('aUV', new THREE.InstancedBufferAttribute(aUV, 4));
  const shMat = new THREE.ShaderMaterial({ uniforms: { map: { value: rt.texture }, uCrack: { value: 0 }, uEdge: { value: new THREE.Vector2(1 / TW, 1 / TH) }, uOpacity: { value: 1 } },
    vertexShader: SH_VS, fragmentShader: SH_FS, transparent: true, depthTest: false, depthWrite: false });
  const shards = new THREE.InstancedMesh(geo, shMat, tiles.length); shards.frustumCulled = false; shards.renderOrder = ZUI.BANNER; scene.add(shards);
  // toast (same build as the turn's)
  const toast = new THREE.Group();
  const tText = new TextSprite({ text: 'LEVEL LOADED', font: 'sk', color: '#ffffff', shadow: { dx: 1, dy: -1, color: '#000000' } }, { anchor: 'bl' });
  const check = new Quad(canvasTex(pixelCanvas(8, 7, (g, px) => { const c = PAL.green; px(0, 3, c, 2, 2); px(1, 4, c, 2, 2); px(2, 5, c, 2, 2); px(4, 3, c, 2, 2); px(5, 1, c, 2, 2); px(6, 0, c, 2, 2); })), 8, 7);
  const tw = tText.w + 8 + 12, th = 13; const tbg = panel(tw, th, 'dialog');
  toast.add(tbg, check, tText); tbg.place(0, 0); check.place(5, 3); tText.place(16, 3); check.userData.dz = tText.userData.dz = 0.5;
  toast.traverse((m) => { m.renderOrder = ZUI.TOP + (m.userData.dz || 0); }); scene.add(toast);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3();
  const IMP = HUD5.impact;

  return {
    scene, cam, bar,
    update(t) {
      // bar: frozen at its last pre-impact state after the impact (the shards sample it while they fall)
      const tb = Math.min(t, T.snap(IMP) - 0.5 / T.fps());
      const b = buildAt2(tb); const lt = loadingText(tb);
      bar.set({ ...b, visible: true, dock: 1, text: lt || b.text }, tb);
      // the long text sits where the label was, left edge fixed (as at 79.87), so only the dots move
      if (lt && bar.wide) bar.wide.place(bar.x0 + 6 + Math.floor(bar.wide.w / 2), bar.y0 + 3);
      // shards
      const s = t - T.snap(IMP);
      shMat.uniforms.uCrack.value = s >= 0 && s < 0.1 ? 1 - s / 0.1 : 0;
      tiles.forEach((tl, i) => {
        let x = tl.x + tl.w / 2, y = tl.y + tl.h / 2, rz = 0, sc = 1;
        const dx = x - tl.cx, dy = y - tl.cy; const d = Math.hypot(dx, dy) || 1;
        const u = s - (0.015 + 0.0009 * d + 0.03 * hash(i, 1));
        if (u > 0) {
          const sp = 60 + 120 * hash(i, 2), up = 50 + 140 * hash(i, 3);
          x += (dx / d) * sp * u + (hash(i, 4) - 0.5) * 30 * u;
          y += (dy / d) * sp * 0.25 * u + up * u - 0.5 * 620 * u * u;
          rz = (hash(i, 5) - 0.5) * 14 * u; sc = Math.max(0.2, 1 - 0.7 * u);
        }
        m4.compose(v.set(x, y, 0), q.setFromEuler(e.set(0, 0, rz)), s3.set(tl.w * sc, tl.h * sc, 1)); shards.setMatrixAt(i, m4);
      });
      shards.instanceMatrix.needsUpdate = true;
      shards.visible = s < 0.8;   // gone before the world map draws itself (174.85)
      shMat.uniforms.uOpacity.value = 1 - smooth(0.3, 0.75, s);
      // toast: drops in at the top, ~1.1 s, leaves upward
      const ta = HUD5.toastIn, tz = HUD5.toastOut; toast.visible = false;   // (v4) drop 2 = a clear frame: no LEVEL LOADED toast
      if (toast.visible) { const inn = smooth(ta, ta + 0.12, t), out = smooth(tz, tz + 0.18, t);
        toast.position.set(Math.round(GW / 2 - tw / 2), Math.round(GH - 4 - th + (1 - inn) * 18 + out * 22), 0); }
      return this;
    },
    visibleAt(t) { return t < T.snap(HUD5.impact) + 0.8; },   // (v4) the bar + its shatter only (no toast)
    /** draw over whatever is in `target` */
    render(r, target) {
      const prevC = r.getClearColor(new THREE.Color()), prevA = r.getClearAlpha(), ac = r.autoClear;
      r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.autoClear = true; r.clear(); r.render(uiScene, cam);
      r.setRenderTarget(target); r.setClearColor(prevC, prevA); r.autoClear = false; r.clearDepth(); r.render(scene, cam); r.autoClear = ac;
    },
  };
}
