// ACT IV · PAPER cutscenes. The bridge cutscene clips (media/cutscenes/, see its README) play frame-exact through
// core/video.js VideoClip: frame = round((t - slot in) * 30). Subtitles stay on top in the handwritten (kai) style.
//   act4.paper_jade_sing  125.769 -> 128.180  Jade sings (lip-sync B, lag 0.00): the 1920x1080 sketchbook card, full frame
//   act4.paper_listen     128.180 -> 129.385  split frame Charlie | Ricky (centre ~50 % crops; Ricky's face at ~0.45)
// The CLIPS table below is the single place to swap takes; the split frame auto-prefers the *_play_bridge_1 (playing
// guitar) clips when they exist and falls back to the *_listen_bridge_1 clips.
// buildPaper() (framed paper stills with code-driven motion) is still used by the recap montage and as a fallback if a
// clip fails to load (then the old PLACEHOLDER label shows again).
import * as THREE from 'three';
import { loadFonts } from '../../core/text.js';
import * as T from '../../show/timing.js';
import { Overlay } from './overlay.js';
import { VideoClip } from '../../core/video.js';

const A = '/src/scenes/act4/assets/';
const CUT = '/media/cutscenes/';
export const CLIPS = {
  // (v4, Jade's pick 2026-10-18: +0.10 s) the picture runs 0.1 s ahead of the v3 card: source take from 0.309 s (was 0.209 s);
  // built with tools/cutscenes/card.py from jade_sing_bridge_1/jade_sing_bridge_1_adv0.10.mp4. v3 card: fallback_card_480p_portrait_lag0.00.mp4
  // (v4 Pass B) the v11 brows tracked onto every frame of the source take (tools/cutscenes/pb_browtrack.py), same 0.309 s start;
  // the pre-brow card is fallback_card_480p_portrait_adv0.10.mp4
  // + flux-video-upscale precise 1.5x of the v11 take (lines crisper; frame-aligned, mouth curve corr 0.965 at shift 0): *_v11_up.mp4
  jade_sing: CUT + 'jade_sing_bridge_1/fallback_card_480p_portrait_adv0.10_v11_up.mp4',
  charlie: [CUT + 'charlie_play_bridge_1/charlie_play_bridge_1.mp4', CUT + 'charlie_listen_bridge_1/charlie_listen_bridge_1.mp4'],
  ricky: [CUT + 'ricky_play_bridge_1/ricky_play_bridge_1.mp4', CUT + 'ricky_listen_bridge_1/ricky_listen_bridge_1.mp4'],
};
export const SLOTS = {
  'act4.paper_jade_sing': {
    frames: [{ id: 'jade_sing_bridge_1', img: 'jade_sing_a.jpg', x: 0.5, y: 0.565, h: 0.74, push: [1.0, 1.07], drift: [-0.01, 0.006],
      note: 'Jade sings 一笔一画 都是我的 (soft, sultry), holds up the drawing/code sheet' }],
    subs: [34, 35],
  },
  'act4.paper_listen': {
    frames: [
      { id: 'charlie_listen_bridge_1', img: 'charlie_listen.jpg', x: 0.27, y: 0.575, h: 0.66, push: [1.03, 1.0], drift: [0.006, 0], note: 'Charlie listens, silent reaction' },
      { id: 'ricky_listen_bridge_1', img: 'ricky_listen.jpg', x: 0.73, y: 0.575, h: 0.66, push: [1.0, 1.03], drift: [-0.006, 0], note: 'Ricky listens, silent reaction', right: true },
    ],
    subs: [35],
  },
};

const BG_FS = /* glsl */`
  uniform float uT, uAspect; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  void main(){
    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    // k10 dusk page: lavender-violet sky hatched in coloured pencil, warming to peach and cream at the bottom
    vec3 top = vec3(0.62, 0.55, 0.80), mid = vec3(0.93, 0.70, 0.66), bot = vec3(0.98, 0.93, 0.84);
    float y = vUv.y + (n(p * 3.0) - 0.5) * 0.08;
    vec3 c = mix(bot, mid, smoothstep(0.15, 0.55, y)); c = mix(c, top, smoothstep(0.5, 0.95, y));
    float boil = floor(uT * 8.0);                                  // hand-drawn 'boil' at 8 fps
    float st = fract((p.x * 0.6 + p.y * 1.6) * 38.0 + n(p * vec2(4.0, 40.0) + boil * 0.37) * 1.8);
    float stroke = smoothstep(0.35, 0.5, st) * smoothstep(0.95, 0.6, st);
    c *= 0.94 + 0.08 * stroke;
    c = mix(c, vec3(0.99, 0.95, 0.87), 0.55 * smoothstep(0.62, 0.0, y) * n(p * 1.5 + 3.0));
    c *= 0.97 + 0.05 * h(floor(vUv * vec2(960.0, 540.0)) + boil);  // paper grain
    gl_FragColor = vec4(c, 1.0);
  }`;
const FR_FS = /* glsl */`
  uniform sampler2D map; uniform float uT, uPush, uLight, uAR; uniform vec2 uDrift; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  void main(){
    float boil = floor(uT * 8.0);
    vec2 q = vUv;
    // pencil frame line (wobbly), cream mat between line and picture
    vec2 e = min(q, 1.0 - q) * vec2(uAR, 1.0);
    float wob = (n(q * 30.0 + boil) - 0.5) * 0.004;
    float edge = min(e.x, e.y) + wob;
    if (edge < 0.0) discard;
    vec3 mat = vec3(0.985, 0.955, 0.895);
    vec3 col = mat;
    float inner = 0.022;
    if (edge > inner) {
      vec2 uv = (q - 0.5) / uPush + 0.5 + uDrift;
      vec3 img = texture2D(map, uv).rgb;
      // light shift: a warm sunset glow sliding across + a soft vignette
      float gx = (q.x - uLight) * 2.2; float glow = exp(-gx * gx) * 0.10;
      img = img * (1.0 + glow * vec3(1.0, 0.75, 0.45)) * mix(0.9, 1.0, smoothstep(0.0, 0.25, edge));
      col = img;
    }
    float line = smoothstep(0.004, 0.0, abs(edge - inner * 0.55)) * (0.55 + 0.45 * n(q * vec2(200.0, 7.0) + boil));
    col = mix(col, vec3(0.16, 0.14, 0.17), line * 0.8);
    col *= 0.97 + 0.05 * h(floor(gl_FragCoord.xy / 1.5) + boil);   // paper grain over everything
    gl_FragColor = vec4(col, 1.0);
  }`;
const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

function loadTex(url) { return new Promise((res, rej) => new THREE.TextureLoader().load(url, (t) => { t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; res(t); }, undefined, rej)); }

/** Build a paper slot renderer (also used by the montage for its PAPER callback cuts). */
export async function buildPaper(ctx, cfg) {
  await loadFonts(['kai', 'sans']);
  const { width: W, height: H } = ctx;
  const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(W, H).translate(W / 2, H / 2, 0), new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uAspect: { value: W / H } }, vertexShader: VS, fragmentShader: BG_FS, depthTest: false }));
  scene.add(bg);
  const frames = [];
  for (const f of cfg.frames) {
    const tex = await loadTex(A + f.img); const ar = tex.image.width / tex.image.height;
    const fh = f.h * H, fw = fh * ar;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uT: { value: 0 }, uPush: { value: 1 }, uLight: { value: 0 }, uAR: { value: ar }, uDrift: { value: new THREE.Vector2() } },
      vertexShader: VS, fragmentShader: FR_FS, depthTest: false }));
    m.position.set(f.x * W, f.y * H, 0); m.renderOrder = 2; scene.add(m);
    // soft drop shadow
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(fw * 1.02, fh * 1.02), new THREE.MeshBasicMaterial({ color: 0x3a2a40, transparent: true, opacity: 0.18, depthTest: false }));
    sh.position.set(f.x * W + 10 * H / 1080, f.y * H - 12 * H / 1080, 0); sh.renderOrder = 1; scene.add(sh);
    frames.push({ f, m, sh, ar });
  }
  const ov = new Overlay(ctx);
  return {
    scene, cam, ov, frames,
    update(t, t0, t1, { labels = true, subs = true } = {}) {
      const u = T.clamp01((t - t0) / Math.max(0.001, t1 - t0)); const e = T.ease.inOut(u);
      bg.material.uniforms.uT.value = t;
      for (const { f, m, sh } of frames) {
        const U = m.material.uniforms; U.uT.value = t; U.uPush.value = T.lerp(f.push[0], f.push[1], e);
        U.uDrift.value.set(f.drift[0] * e, f.drift[1] * e); U.uLight.value = -0.2 + 1.4 * u;
        const bob = Math.sin(t * 1.3 + f.x * 5) * 2 * H / 1080; m.position.y = f.y * H + bob; sh.position.y = f.y * H - 12 * H / 1080 + bob;
        m.rotation.z = sh.rotation.z = (f.x - 0.5) * -0.02 + Math.sin(t * 0.7 + f.x) * 0.003;
      }
      ov.hideAll();
      if (labels) for (const { f } of frames) ov.placeholder(f.id, t0, t1, f.note, { right: !!f.right });
      if (subs && cfg.subs) ov.subtitle(t, cfg.subs, 'sans');   // (v4) the one lyric style (no handwritten paper strip)
    },
    render(target) {
      const r = ctx.renderer; r.setRenderTarget(target); r.setClearColor(0x000000, 1); r.clear();
      r.render(scene, cam); ov.render(target);
    },
  };
}

async function loadFirst(srcs) {
  for (const src of [].concat(srcs)) { try { const v = await VideoClip.load(src); v.texture.colorSpace = THREE.NoColorSpace; v.src = src; return v; } catch (e) { /* try the next */ } }
  return null;
}
const CLIP_FS = 'uniform sampler2D map; uniform vec4 uCrop; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, uCrop.xy + vUv * uCrop.zw).rgb, 1.0); }';

/** clip slots: [{ clip, x0, w (screen fraction), crop: [u0, v0, du, dv] }] -> full-height panels; returns null if any clip is missing */
async function buildClips(ctx, panels) {
  const { width: W, height: H } = ctx;
  const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
  const out = [];
  for (const p of panels) {
    const v = await loadFirst(p.src); if (!v) return null;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0), new THREE.ShaderMaterial({
      uniforms: { map: { value: v.texture }, uCrop: { value: new THREE.Vector4(...p.crop) } }, vertexShader: VS, fragmentShader: CLIP_FS, depthTest: false }));
    m.scale.set(p.w * W, H, 1); m.position.set(p.x0 * W, 0, 0); scene.add(m); out.push({ v, m });
  }
  if (panels.length > 1) { // a pencil divider between the panels
    const d = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2, 3 * H / 1080), H), new THREE.MeshBasicMaterial({ color: 0x2a2530 }));
    d.position.set(panels[1].x0 * W, H / 2, 0); d.renderOrder = 5; scene.add(d);
  }
  const ov = new Overlay(ctx);
  return { scene, cam, ov, out, srcs: out.map((o) => o.v.src) };
}

const SLOT_CLIPS = {
  'act4.paper_jade_sing': { panels: [{ src: CLIPS.jade_sing, x0: 0, w: 1, crop: [0, 0, 1, 1] }], subs: [34, 35], subPos: { x: 0.72, y: 0.1 } },   // beside the card, off her sheet
  'act4.paper_listen': { panels: [
    { src: CLIPS.charlie, x0: 0, w: 0.5, crop: [0.25, 0, 0.5, 1] },                 // centre 50 %
    { src: CLIPS.ricky, x0: 0.5, w: 0.5, crop: [0.20, 0, 0.5, 1] },                  // Ricky's face sits at ~0.45
  ], subs: [35] },
};

export async function setup(ctx) {
  await loadFonts(['kai', 'sans']);
  const { t0, t1 } = ctx.entry;
  const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };
  const sc = SLOT_CLIPS[ctx.entry.id];
  const C = sc ? await buildClips(ctx, sc.panels) : null;
  if (C) {
    console.log(`[act4] ${ctx.entry.id} clips: ${C.srcs.join(', ')}`);
    return {
      stage: { kind: '3d', fx },
      update(t) { for (const o of C.out) o.m.material.uniforms.map.value = o.v.textureAt(t - t0); C.ov.hideAll(); C.ov.subtitle(t, sc.subs, 'sans'); },   // (v4) one style, one slot
      render(t, target) { const r = ctx.renderer; r.setRenderTarget(target); r.setClearColor(0x000000, 1); r.clear(); r.render(C.scene, C.cam); C.ov.render(target); },
    };
  }
  // fallback: the framed paper-sheet stills with PLACEHOLDER labels
  const cfg = SLOTS[ctx.entry.id]; if (!cfg) throw new Error('act4/paper: no slot config for ' + ctx.entry.id);
  const P = await buildPaper(ctx, cfg);
  return { stage: { kind: '3d', fx }, update(t) { P.update(t, t0, t1); }, render(t, target) { P.render(target); } };
}
