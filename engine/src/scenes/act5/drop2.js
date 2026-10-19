// ACT V · 173.02 -> 176.6  DROP 2 in the voxel world, and THE SECOND TURN.
//   173.02  last hit: tight on Jade's rainbow pencil tip finishing the last hatch line on the first 一
//   173.41-174.00 silence: frozen (a 1° drift only, the 画 vocal bridges it)
//   174.395 DROP 2 (loudest moment): the camera rockets straight up through the clouds; from 1900 m the levels
//           spell 一笔一画 across the landscape (radial speed blur on the climb)
//   175.5-176.6 THE SECOND TURN: voxel cubes subdivide 8 -> 64 in a wave that sweeps in stroke order
//           (一, 笔 strokes 1-10, 一, 画 strokes 1-8); behind the wave the land is the photoreal aerial
//           (Seedance 2.0 first+last clip registered to this exact engine frame, played as a texture)
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import * as T from '../../show/timing.js';
import { buildWorld5, look5, makePencil, GLYPH, SUN_DIR } from './world5.js';
import { FrameSeq } from './frames.js';
import { viewXform } from './aerial.js';
import { Overlay } from '../act4/overlay.js';
import { mulberry32 as mulberry } from '../../util.js';
import { loadFonts } from '../../core/text.js';   // Team C's overlay: shared 一笔一画 chant stamp slots + subtitle style
import { makeAct5HUD } from './hud5.js';
import { SmoothSubs } from '../act3/common.js';  // v7: Act IV's subtitle style for line 43 (it switched to SmoothSubs), so 173.02 matches
import { subtitleFor } from '../../core/ui.js';         // v7: the bar's LOADING… in the silence, its shatter at 174.40, the LEVEL LOADED toast
import { makeRoute, REF_CAM } from './route5.js'; // v7: the world-map route, 4 flags, the nine party dots

export const AERIAL_CAM = { pos: new THREE.Vector3(0, 1850, 240), target: new THREE.Vector3(0, 0, -10), fov: 35 };
export const TIMES = { hit: 173.01, sil0: 173.19, sil1: 173.58, pick: [174.015, 174.22], drop: 174.40, settle: 175.45, wave0: 175.5, wave1: 176.6 }; // measured: data/cues.json act5

const WAVE_FS = /* glsl */`
  uniform sampler2D tVox, tVid, tOrder; uniform vec2 uRes; uniform float uF, uVid, uBlur, uBase, uVZ; uniform vec2 uBlurC, uVC;
  varying vec2 vUv;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  // progress field (screen space): diagonal sweep, pulled toward global stroke order inside the glyphs
  float prog(vec2 uv){
    vec2 q = vec2(uv.x, 1.0 - uv.y);
    float p = 0.78 * q.x + 0.22 * q.y;
    float o = texture2D(tOrder, uv).r;           // -1 outside glyphs, 0..1 global stroke order inside
    if (o >= 0.0) p = 0.45 * p + 0.55 * (0.04 + 0.92 * o);
    return p;
  }
  vec3 vox(vec2 uv){
    if (uBlur <= 0.001) return texture2D(tVox, uv).rgb;
    vec3 a = vec3(0.0); vec2 d = (uv - uBlurC);
    for (int i = 0; i < 12; i++) { float s = 1.0 - uBlur * float(i) / 11.0; a += texture2D(tVox, uBlurC + d * s).rgb; }
    return a / 12.0;
  }
  vec3 vid(vec2 uv){ return texture2D(tVid, uv).rgb; }
  void main(){
    vec2 suv = uVC + (vUv - 0.5) / uVZ;     // the shared 2D view transform (aerial.js viewXform)
    vec2 px = suv * uRes;
    if (uVid <= 0.0) { gl_FragColor = vec4(vox(suv), 1.0); return; }
    // quadtree: 64 -> 32 -> 16 -> 8 px (at 1080p); each level is one cube split into 8 (2x2 visible faces)
    float S = uBase; vec3 col = vec3(0.0); bool done = false;
    float thr[4]; thr[0] = 0.025; thr[1] = 0.0; thr[2] = -0.02; thr[3] = -0.04;
    for (int lv = 0; lv < 4; lv++) {
      vec2 c0 = floor(px / S) * S; vec2 cc = (c0 + 0.5 * S) / uRes;
      float d = prog(cc) - uF + (h21(c0 + float(lv) * 17.0) - 0.5) * 0.024;
      if (lv == 0 && d > 0.055) { col = vox(suv); done = true; break; }    // ahead of the wave: voxel world
      if (d < thr[lv]) {
        if (lv == 3) { col = vid(suv); done = true; break; }              // fully resolved: photoreal
        S *= 0.5; continue;
      }
      // a cube of size S: mean colour of the photo under it (first split still carries the voxel colour)
      vec3 m = vec3(0.0);
      for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) { vec2 u = (c0 + (vec2(i, j) + 0.5) * S / 4.0) / uRes; m += vid(u); }
      m /= 16.0;
      if (lv == 0) m = mix(m, vox(cc), 0.5);
      vec2 f = (px - c0) / S; float bw = max(1.0, (4.0 - float(lv)) * uBase / 64.0);
      vec2 e = (px - c0);
      if (e.x < bw || e.y > S - bw) m = clamp(m * 1.28 + 0.04, 0.0, 1.0);   // lit top-left bevel (y up)
      else if (e.y < bw || e.x > S - bw) m *= 0.62;
      col = m; done = true; break;
    }
    if (!done) col = vid(suv);
    gl_FragColor = vec4(col, 1.0);
  }`;

export async function setup(ctx) {
  await loadFonts(['kai', 'sans']);
  const W = await buildWorld5(ctx);
  const { scene, setShadow } = W;
  const cam = new THREE.PerspectiveCamera(35, ctx.width / ctx.height, 0.02, 40000);
  ctx.post.setScene(scene, cam);
  const rtVox = new THREE.WebGLRenderTarget(ctx.width, ctx.height);

  // ---- the pencil close-up rig on the first 一 (beside Jade)
  const pencil = makePencil({ kind: 'rainbow' });
  scene.add(pencil);
  const tip = new THREE.Vector3(W.heroes.jade.position.x + 14.0, GLYPH.top + 0.0, W.heroes.jade.position.z - 0.5); // clear of the 9-unit voxel figures on the climb
  // the hatch line the tip is finishing (rainbow ribbon on the surface)
  const lineN = 64;
  const lineGeo = new THREE.PlaneGeometry(1, 1, lineN, 1);
  const lineMat = new THREE.ShaderMaterial({
    uniforms: { uP: { value: 1 } }, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uP; varying vec2 vUv;
      vec3 hue2rgb(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){ if (vUv.x > uP) discard; float g = h(floor(vUv * vec2(900.0, 14.0)));
        float edge = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
        vec3 c = hue2rgb(vUv.x * 0.9 + 0.02); gl_FragColor = vec4(pow(c, vec3(2.2)), edge * (0.55 + 0.45 * g)); }`,
  });
  const line = new THREE.Mesh(lineGeo, lineMat);
  line.rotation.x = -Math.PI / 2; line.scale.set(2.4, 0.07, 1);
  line.position.set(tip.x - 1.2, GLYPH.top + 0.02, tip.z); line.renderOrder = 6; line.userData.noAO = true;
  scene.add(line);

  // ---- cloud layers the rocket punches through (soft puffs; each dissolves once the camera is above it)
  const cloudTex = (() => { // a defined cumulus puff: sunlit top-left, soft blue-grey underside, crisp-ish edge
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const g = cv.getContext('2d'); const r = mulberry(7);
    const blobs = []; for (let i = 0; i < 18; i++) blobs.push([256 + (r() - 0.5) * 300, 270 + (r() - 0.5) * 120 - Math.abs(r() - 0.5) * 60, 50 + r() * 70]);
    g.filter = 'blur(6px)';
    g.fillStyle = 'rgba(176,186,206,1)'; for (const [x, y, rad] of blobs) { g.beginPath(); g.arc(x + 6, y + 10, rad, 0, Math.PI * 2); g.fill(); }
    for (const [x, y, rad] of blobs) { const gr = g.createRadialGradient(x - rad * 0.35, y - rad * 0.4, rad * 0.1, x, y, rad);
      gr.addColorStop(0, 'rgba(255,253,246,1)'); gr.addColorStop(0.75, 'rgba(244,240,236,1)'); gr.addColorStop(1, 'rgba(224,226,236,1)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad * 0.92, 0, Math.PI * 2); g.fill(); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx; })();
  const puffs = []; { const r = mulberry(21);
    for (const [alt, n] of [[120, 4], [180, 5], [250, 5], [340, 5], [450, 5], [580, 5], [740, 4]]) for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0, fog: false }));
      const a = (i / n) * Math.PI * 2 + r() * 0.8, off = (0.6 + r() * 0.35) * alt; sp.userData = { alt: GLYPH.top + alt, a, off, size: alt * (0.38 + r() * 0.22) };
      sp.scale.setScalar(sp.userData.size); sp.userData.noAO = true; sp.renderOrder = 10; scene.add(sp); puffs.push(sp);
    } }
  function updatePuffs(t) {
    for (const sp of puffs) {
      const U = sp.userData; const on = t >= TIMES.drop;
      const k = (U.alt - GLYPH.top - 40) / 1300, mx = T.ease.inOut(T.clamp01(k));
      sp.position.set(THREE.MathUtils.lerp(close.pos.x, AERIAL_CAM.pos.x, mx) + Math.cos(U.a) * U.off, U.alt, THREE.MathUtils.lerp(close.pos.z, AERIAL_CAM.pos.z, mx) + Math.sin(U.a) * U.off);
      const above = cam.position.y - U.alt;
      sp.material.opacity = on ? 0.97 * (1 - T.span(t, 175.0, 175.32)) * (1 - T.clamp01((above - U.alt * 0.9) / (U.alt * 0.8))) * T.clamp01((U.alt + 200 - cam.position.y) / 200 + 1) : 0;
      sp.visible = sp.material.opacity > 0.003;
    }
  }

  // ---- photoreal resolve clip (Seedance 2.0 first+last = the photoreal of THIS frame), may be missing early on
  const resolve = await FrameSeq.load(globalThis.__A5_RESOLVE || 'resolve2', ctx);
  const order = await renderOrderMap(ctx, W, cam);

  const comp = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { tVox: { value: rtVox.texture }, tVid: { value: null }, tOrder: { value: order.texture }, uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
      uF: { value: -1 }, uVid: { value: 0 }, uBlur: { value: 0 }, uBlurC: { value: new THREE.Vector2(0.5, 0.5) }, uBase: { value: 64 * ctx.height / 1080 }, uVZ: { value: 1 }, uVC: { value: new THREE.Vector2(0.5, 0.5) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: WAVE_FS, depthTest: false, depthWrite: false,
  }));

  const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };
  const ov = new Overlay(ctx);
  const smooth = new SmoothSubs(ctx.width, ctx.height); ov.scene.add(smooth.mesh); smooth.mesh.renderOrder = 30;
  const W43 = T.words(43); // 一 笔 一 画 (chant line 43): Act IV stamps the first two, we stamp 一 + 画 in the same slots
  const STAMPS = [{ ch: '一', t: W43[0].start }, { ch: '笔', t: W43[1].start }, { ch: '一', t: W43[2].start }, { ch: '画', t: W43[3].start }];
  const close = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  const hud = makeAct5HUD(ctx);
  const route = await makeRoute(ctx);
  console.assert(REF_CAM.pos[1] === AERIAL_CAM.pos.y && REF_CAM.fov === AERIAL_CAM.fov, '[act5] route5 REF_CAM != AERIAL_CAM');
  const pv = new THREE.Vector3();
  /** world point -> output px (y down): the live camera, then the shared 2D view transform (identity before 175.5) */
  function toScreen(uv, p, X) {
    pv.copy(p).project(cam); if (pv.z > 1 || pv.z < -1) return null;
    const sx = (pv.x + 1) / 2, sy = (pv.y + 1) / 2;
    const vx = (sx - X.cx) * X.zoom + 0.5, vy = (sy - X.cy) * X.zoom + 0.5;
    return [vx * ctx.width, (1 - vy) * ctx.height];
  }
  const tmp = new THREE.Vector3();

  function closeUp(t) {
    // pencil finishing its line 173.02 -> 173.41, then frozen
    const u = T.span(t, TIMES.hit - 0.25, TIMES.sil0, T.ease.out);
    const tx = tip.x - 0.35 + 0.35 * u;
    const lift = 0.05 * T.span(t, TIMES.pick[0], TIMES.pick[0] + 0.08, T.ease.out) + 0.08 * T.span(t, TIMES.pick[1], TIMES.pick[1] + 0.1, T.ease.out);
    pencil.position.set(tx, GLYPH.top + 0.003 + lift, tip.z);
    pencil.rotation.set(0, 0, 0);
    pencil.rotateY(-0.5); pencil.rotateZ(-0.62); pencil.rotateX(0.18);
    lineMat.uniforms.uP.value = (tx - (tip.x - 2.4)) / 2.4;
    // camera: low, tight on the tip, the stroke surface running away toward the horizon
    // (v7) the camera holds still in the silence: 100% · LOADING… is the only motion there
    const sil = TIMES.sil1 - TIMES.sil0, te = t < TIMES.sil0 ? t : t < TIMES.sil1 ? TIMES.sil0 : t - sil;
    const drift = T.span(te, TIMES.hit, TIMES.drop - sil, T.ease.linear);
    close.pos.set(tip.x - 0.55 - 0.05 * drift, GLYPH.top + 0.26, tip.z + 0.62);
    close.look.set(tip.x - 0.05, GLYPH.top + 0.06, tip.z - 0.05);
  }

  function camAt(t) {
    closeUp(Math.min(t, TIMES.drop));
    if (t < TIMES.drop) { cam.position.copy(close.pos); cam.up.set(0, 1, 0); cam.lookAt(close.look); cam.fov = 35; cam.near = 0.02; cam.far = 4000; cam.updateProjectionMatrix(); return 0; }
    // rocket: log-altitude climb, pitch to near top-down, drift to the aerial centre
    const u = T.span(t, TIMES.drop, TIMES.settle, (x) => 1 - Math.pow(1 - x, 3.2));
    const h0 = close.pos.y - GLYPH.top + 0.0, h1 = AERIAL_CAM.pos.y - GLYPH.top;
    const alt = GLYPH.top + h0 * Math.pow(h1 / h0, u);
    const m = Math.min(1, Math.log(Math.max(alt - GLYPH.top, h0) / h0) / Math.log(h1 / h0)); // 0..1 by log-altitude
    const mx = T.ease.inOut(T.clamp01((alt - GLYPH.top - 40) / 1300)); // up first, drifting toward the composition from low altitude
    cam.position.set(THREE.MathUtils.lerp(close.pos.x, AERIAL_CAM.pos.x, mx), alt, THREE.MathUtils.lerp(close.pos.z, AERIAL_CAM.pos.z, mx));
    // look target: from the tip toward the ground under the aerial target; pitch reaches top-down early
    const pm = T.ease.inOut(T.clamp01(m / 0.3));
    tmp.copy(close.look).lerp(AERIAL_CAM.target, mx);
    const dir = tmp.clone().sub(cam.position).normalize();
    const down = new THREE.Vector3(AERIAL_CAM.target.x - AERIAL_CAM.pos.x, AERIAL_CAM.target.y - AERIAL_CAM.pos.y, AERIAL_CAM.target.z - AERIAL_CAM.pos.z).normalize();
    const look0 = close.look.clone().sub(close.pos).normalize();
    const d = look0.lerp(down, pm).lerp(dir, 0.0).normalize();
    cam.up.set(0, 1, 0); cam.lookAt(tmp.copy(cam.position).add(d));
    cam.fov = 35 + 26 * Math.sin(Math.PI * T.clamp01((alt - GLYPH.top - 20) / 1500)); // speed: FOV opens mid-climb so the levels come into view early
    cam.near = Math.max(0.02, (alt - GLYPH.top) * 0.02); cam.far = Math.max(4000, alt * 6); cam.updateProjectionMatrix();
    // speed (for blur): d(log alt)/dt
    const dt = 1 / 60; const u2 = T.span(t + dt, TIMES.drop, TIMES.settle, (x) => 1 - Math.pow(1 - x, 3.2));
    return (u2 - u) / dt;
  }

  function lookFor(t) {
    if (t < TIMES.drop) look5(ctx.post, t, { dof: 0.9, focus: cam.position.distanceTo(tip), ao: 0.5, bloom: 0.25, exposure: 0.7 });
    else look5(ctx.post, t, { dof: 0, ao: 0.75, bloom: 0.15, exposure: 0.68 });
    const close_ = t < TIMES.drop + 0.12;
    if (close_) setShadow(tip, 6); else setShadow(new THREE.Vector3(0, 0, 0), 1500);
    W.sun.shadow.normalBias = close_ ? 0.01 : 0.6; W.sun.shadow.bias = close_ ? -0.0002 : -0.0004;
  }

  return {
    stage: { kind: '3d', fx },
    world: W, camera: cam, tip,
    update(t) {
      // heroes: Jade mid draw (frozen through the silence), the others idle
      const tau = t < TIMES.sil0 ? t : (t < TIMES.drop ? TIMES.sil0 : t);
      W.heroes.jade.set({ anim: 'draw_rainbow', t: tau, pencil: true });
      W.heroes.charlie.set({ anim: 'idle', t: tau + 0.3 });
      W.heroes.ricky.set({ anim: 'idle', t: tau + 0.6 });
      this._speed = camAt(t); updatePuffs(t);
      lookFor(t);
      fx.flash = T.exactFrame(t, [TIMES.drop]) ? 0.6 : 0;
      hud.update(t);
    },
    render(t, target) {
      const r = ctx.renderer;
      const U = comp.material.uniforms;
      ctx.post.render(scene, cam, rtVox);
      U.uBlur.value = t >= TIMES.drop ? Math.min(0.12, this._speed * 0.045) : 0;
      // the wave
      const F = T.keys(t, [[TIMES.wave0, -0.1], [TIMES.wave1 - 0.08, 1.12]], (u) => u * (0.6 + 0.4 * u));
      const tex = resolve ? resolve.at(T.span(t, TIMES.wave0, TIMES.wave1)) : null;
      U.uVid.value = t >= TIMES.wave0 && tex ? 1 : 0; U.uF.value = F; U.tVid.value = tex;
      { const X = viewXform(t); U.uVZ.value = X.zoom; U.uVC.value.set(X.cx, X.cy); }
      r.setRenderTarget(target); comp.render(r);
      // chant stamps hold through the freeze; gone on the rocket (174.40)
      ov.hideAll();
      smooth.set(null);
      if (t < TIMES.drop) { ov.stampChars(t, 'yibi', STAMPS, { y: 0.62, size: 0.22, color: '#ffffff', stroke: '#1b1b22', gap: 0.08 });
        const c = subtitleFor(t, 43, { lit: '#ffd23f', unlit: '#ffffff', hold: 0.25 }); if (c) { c.hideTop = true; smooth.set(c, 'bottom'); } }
      ov.render(target);
      // (v7) the world map over the aerial (path + flags dissolve with the wave; the nine dots survive it), then the bar / toast
      { const X = viewXform(t); const waving = t >= TIMES.wave0 && U.uVid.value > 0;
        route.draw(t, { toScreen: (uv, p) => toScreen(uv, p, X), wave: waving ? { F, suv: (uv) => [uv[0], 1 - uv[1]] } : (t >= TIMES.wave0 ? { F: 9, suv: (uv) => [uv[0], 1 - uv[1]] } : null) });
        route.render(r, target); }
      if (hud.visibleAt(t)) hud.render(r, target);
    },
  };
}

/** Screen-space global stroke order at the locked aerial camera: R = order (0..1) inside glyph tops, -1 outside. */
async function renderOrderMap(ctx, W, cam0) {
  const cam = cam0.clone(); cam.position.copy(AERIAL_CAM.pos); cam.up.set(0, 1, 0); cam.lookAt(AERIAL_CAM.target); cam.fov = AERIAL_CAM.fov; cam.near = 37; cam.far = 11400; cam.updateProjectionMatrix();
  const s = new THREE.Scene();
  const geo = W.glyphs.geometry;
  const mat = new THREE.ShaderMaterial({
    vertexShader: 'attribute float aKind; varying float vK; void main(){ vK = aKind; gl_Position = projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying float vK; void main(){ gl_FragColor = vec4(vK / 19.0, 0.0, 0.0, 1.0); }',
  });
  const m = new THREE.InstancedMesh(geo, mat, W.glyphs.count); m.instanceMatrix = W.glyphs.instanceMatrix; m.frustumCulled = false; s.add(m);
  const rt = new THREE.WebGLRenderTarget(ctx.width, ctx.height, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const r = ctx.renderer; const prev = r.getClearColor(new THREE.Color()), pa = r.getClearAlpha();
  r.setRenderTarget(rt); r.setClearColor(new THREE.Color(-1, -1, -1), 1); r.clear(); r.render(s, cam); r.setRenderTarget(null); r.setClearColor(prev, pa);
  return rt;
}
