// ACT III · 107.15 -> 107.615 · CARD 05: "a band on a stage" in paper (v4 Pass B; the paper unit makes the clip, stage_3d places it).
// On 世界 (107.15, the downbeat out of verse 2) the paper close-up of the band in three spotlights (assets/v4_stills/05_paper_0147.png);
// on Jade's stutter stop (107.615) it cuts to the 3D front-on band shot (battle.js, still 08), which then holds without a cut through
// the type unit's 舞台 (109.09-110.41) to the rap downbeat. Full frame, the one lyric style on top. (Coordinator 2026-10-18: the 舞台
// span must not be split by a cut, so the card moved here from 台.)
// The clip is looked up in CARD05_SRCS (first one that loads); until it lands, the approved still plays as the placeholder with a slow
// push (src/scenes/act3/assets/card05_placeholder.jpg = assets/v4_stills/05_paper_0147.png, re-encoded).
// Frame-exact: clip frame = round((t - t0) * fps) (core/video.js), so the card's lip sync is the paper unit's measured offset.
import * as THREE from 'three';
import { loadFonts } from '../../core/text.js';
import { VideoClip } from '../../core/video.js';
import { Overlay } from '../act4/overlay.js';

export const CARD05 = { t0: 107.23, t1: 107.62 };   // first frame 107.233 (8th 107.238), last 107.600; the band shot owns 107.633 (beat 107.641)   // t0 on the 8th grid (the 107.15 section seam = 3 swirl frames, then the card)
const CUT = '/media/cutscenes/';
// the paper unit's card (media/cutscenes/README row 05): it covers 107.15 -> 110.41 with frame k = 107.15 + k / 30 (lip sync 0.00 vs the
// song mix); this slot plays the matching slice 107.238 -> 107.641
export const CARD05_SRCS = [CUT + 'paper_0147/paper_0147.mp4'];
export const CARD05_CLIP_T0 = 107.15;
const PLACEHOLDER = '/src/scenes/act3/assets/card05_placeholder.jpg';
const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FS = 'uniform sampler2D map; uniform vec4 uCrop; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(map, uCrop.xy + vUv * uCrop.zw).rgb, 1.0); }';

async function loadClip() {
  for (const src of CARD05_SRCS) { try { const v = await VideoClip.load(src); v.texture.colorSpace = THREE.NoColorSpace; v.src = src; return v; } catch (e) { /* next */ } }
  return null;
}

export async function setup(ctx) {
  await loadFonts(['sans']);
  const { width: W, height: H } = ctx; const t0 = ctx.entry?.t0 ?? CARD05.t0, t1 = ctx.entry?.t1 ?? CARD05.t1;
  const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };
  const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
  const clip = await loadClip();
  let tex = clip ? clip.texture : null;
  if (!tex) { tex = await new THREE.TextureLoader().loadAsync(PLACEHOLDER); tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; }
  console.log(`[engine] [card05] ${clip ? 'clip ' + clip.src : 'placeholder still ' + PLACEHOLDER}`);
  const U = { map: { value: tex }, uCrop: { value: new THREE.Vector4(0, 0, 1, 1) } };
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0), new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, depthTest: false }));
  m.scale.set(W, H, 1); scene.add(m);
  const ov = new Overlay(ctx);
  return {
    stage: { kind: '3d', fx },
    update(t) {
      if (clip) { U.map.value = clip.textureAt(t - CARD05_CLIP_T0); U.uCrop.value.set(0, 0, 1, 1); }
      else {   // the still: a slow push toward Jade's face (centre, upper third), so the placeholder is not a frozen frame
        const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); const z = 1 + 0.06 * u; const cx = 0.5, cy = 0.62;
        U.uCrop.value.set(cx - 0.5 / z, cy - (cy) / z, 1 / z, 1 / z);
      }
      ov.hideAll(); ov.subtitle(t, [27], 'sans');   // the one lyric style (line id 27 世界 是我的舞台 keeps its bar over the card)
    },
    render(t, target) { const r = ctx.renderer; r.setRenderTarget(target); r.setClearColor(0x000000, 1); r.clear(); r.render(scene, cam); ov.render(target); },
  };
}
