// PAPER INSERTS (v4 Pass B, paper unit): animated paper close-ups cut in OVER the scene beneath them. They are later,
// overlapping show entries (show/main.js `paper` block, transition 'cut'), so the scene underneath keeps running and
// takes the frame back on the insert's t1. Each clip is slot-exact like the bridge clips (media/cutscenes/README.md):
// 1920x1080, 30 fps, frame = round((t - t0) * 30), with its own measured lip-sync offset baked in (no retiming here).
//   paper.p03  0:20.15  "my imagination is linked" (still #03, the everyday-things chain), back to act1 on 23.75
//   paper.p04  0:48.57  "I just ask myself" (still #04, the prompt window in her eyes), back to the prompt box on 50.66
//   paper.p06  2:23.40  "I just ask myself what it is" (still #06 v2, to the Eraser), back to the 3D prompt on 146.197,
//                       before the typing starts at 146.556
// Card 05 (1:47, three paper spotlights) is NOT registered here: stage_3d integrates it (CLIPS.p05 below is the path).
// If a clip fails to load, the approved still is shown full-frame instead (never a black frame).
import * as THREE from 'three';
import { loadFonts } from '../core/text.js';
import { VideoClip } from '../core/video.js';
import { Overlay } from './act4/overlay.js';

const CUT = '/media/cutscenes/';
// (v47_cards, Jade 10-19 on v4.6: "amplify expression and body language") per-card switch: a suffix picks
// paper_00XX/paper_00XX_<suffix>.mp4 (the v4.7 acting takes, slot-exact, lag baked in); null = the v4.6 clip paper_00XX.mp4.
// Suffixes: 'v47' (installed pick = a copy of one timing variant), or a variant itself, e.g. 'v47_cur1_shift+2'
// (all variants: media/cutscenes/paper_00XX/paper_00XX_v47_*.mp4; checkpoint engine/checkpoints/v47_cards.md).
const CARDS_V47 = { p03: 'v47', p04: 'v47', p06: 'v47' };
const pick = (dir, k) => CUT + `${dir}/${dir}${CARDS_V47[k] ? '_' + CARDS_V47[k] : ''}.mp4`;
export const CLIPS = {
  p03: pick('paper_0020', 'p03'),
  p04: pick('paper_0048', 'p04'),
  p05: CUT + 'paper_0147/paper_0147.mp4',      // for stage_3d (107.15-110.41)
  p06: pick('paper_0223', 'p06'),
};
const INSERTS = {
  'paper.p03': { clip: CLIPS.p03, still: CUT + 'paper_0020/still.png', subs: [7] },
  'paper.p04': { clip: CLIPS.p04, still: CUT + 'paper_0048/still.png', subs: [13] },
  'paper.p06': { clip: CLIPS.p06, still: CUT + 'paper_0223/still.png', subs: [39] },
};

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FS = 'uniform sampler2D map; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, vUv).rgb, 1.0); }';

function loadTex(url) {
  return new Promise((res, rej) => new THREE.TextureLoader().load(url, (t) => { t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; res(t); }, undefined, rej));
}

export async function setup(ctx) {
  await loadFonts(['sans']);
  const { width: W, height: H } = ctx; const { t0 } = ctx.entry;
  const cfg = INSERTS[ctx.entry.id]; if (!cfg) throw new Error('paper_inserts: no insert config for ' + ctx.entry.id);
  let clip = null;
  try { clip = await VideoClip.load(cfg.clip); clip.texture.colorSpace = THREE.NoColorSpace; } catch (e) { console.warn('[paper] clip missing, showing the still:', cfg.clip, e.message); }
  let map = clip ? clip.texture : null;
  if (!map) try { map = await loadTex(cfg.still); } catch (e) { console.warn('[paper] still missing too, cream card:', cfg.still); }
  if (!map) { map = new THREE.DataTexture(new Uint8Array([247, 241, 228, 255]), 1, 1); map.needsUpdate = true; }   // never throw: other units render across these ranges
  const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(W, H).translate(W / 2, H / 2, 0),
    new THREE.ShaderMaterial({ uniforms: { map: { value: map } }, vertexShader: VS, fragmentShader: FS, depthTest: false }));
  scene.add(quad); scene.userData.csSkip = true;   // COLOR_REQUESTS H14: full-colour approved paper, the grade must not reach it (we render direct, not via post)
  const ov = new Overlay(ctx);
  console.log(`[paper] ${ctx.entry.id} ${clip ? cfg.clip : 'STILL ' + cfg.still}`);
  return {
    stage: { kind: '3d', fx: { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' } },
    update(t) {
      if (clip) quad.material.uniforms.map.value = clip.textureAt(t - t0);
      ov.hideAll(); ov.subtitle(t, cfg.subs, 'sans');   // the one lyric style (SmoothSubs), same slot as the scene beneath
    },
    render(t, target) {
      const r = ctx.renderer; r.setRenderTarget(target); r.setClearColor(0x000000, 1); r.clear();
      r.render(scene, cam); ov.render(target);
    },
  };
}
