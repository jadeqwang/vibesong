// ACT V · 176.6 -> 187.05  the real world (photoreal AI clips played as textures; the engine owns timing).
//   176.6-180.23  top-down sweep (Veo 3.1 Fast from the photoreal of the engine frame), conformed 24->30 fps
//   180.21 "FIXTURES!" (vocal accent): the graphite pencil (PINK cap = FIXTURES) streaks across and the world snaps to a
//          graphite drawing of itself (nano-banana-pro redraw of the exact clip frame, registered); stop 180.21-180.70
//          frozen; whistle answer 180.70-183.30: a slow drift over the drawing
//   183.30 "FUNCTIONS!": the rainbow pencil (BLUE cap = FUNCTIONS) streaks back: living colour, the clip resumes from
//          the same frame; stop 183.30-183.86 slow-motion
//   183.87-186.65 riser: the camera dives straight down into the first 一 (Veo take from the clip frame at 184.3 + an
//          accelerating engine zoom onto the stroke), handing off to the PAPER outro (stroke wipe at 186.70)
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import * as T from '../../show/timing.js';
import { FrameSeq } from './frames.js';
import { drawPencil } from './paperkit.js';

// measured (data/cues.json act5): the stops are ~0.4 s earlier than timing.json says
export const AER = { t0: 176.6, fix: 180.21, stop1: [180.21, 180.70], fun: 183.30, stop2: [183.30, 183.86], dive: 183.87, end: 187.0, paper: 186.65, paperWipe: 0.4 };
// first 一 (world5 glyph 0) centre in the 1920x1080 aerial frame (projected; see media/act5/_work/glyphmask.py)
export const YI_UV = [0.155, 0.505];

/** clip time (s) of the sweep at song time t (pencil phase holds the frame at the FIXTURES accent) */
export function sweepTime(t) {
  const sFix = AER.fix - AER.t0;
  if (t < AER.fix) return t - AER.t0;
  if (t < AER.fun) return sFix;
  return sFix + 0.22 * (Math.min(t, AER.stop2[1]) - AER.fun) + Math.max(0, t - AER.stop2[1]); // stop 2: suspended, slow-motion
}

/** the engine's 2D camera over the photoreal plates (pure in t): VIEW centre (cx, cy) + zoom.
 *  175.5-176.6 (resolve): lean in toward the first strokes; 176.6-180.21: SWEEP left -> right in stroke order (on top of the
 *  clip's own push-in); pencil phase: slow drift; 183.87 dive: ease back to the clip framing + accelerating zoom. Used by drop2.js
 *  (wave composite), this scene and the outro's hand-off wipe, so all three stay registered. */
export function viewXform(t) {
  const a = T.span(t, 175.5, AER.t0, T.ease.inOut);
  let z = 1 + 0.24 * a, cx = 0.5 - 0.1 * a, cy = 0.5 + 0.015 * a;
  cx += 0.2 * T.span(t, AER.t0, AER.fix, (u) => u * u * (3 - 2 * u));
  z *= 1 + 0.035 * T.span(t, AER.stop1[1], AER.fun, T.ease.inOut);
  if (t >= AER.dive) {
    const c = T.span(t, AER.dive, AER.dive + 1.2, T.ease.inOut); z += (1 - z) * c; cx += (0.5 - cx) * c; cy += (0.5 - cy) * c;
    z *= Math.exp(Math.log(1.35) * Math.pow(T.span(t, AER.dive, AER.end), 2.4));
  }
  const m = 0.5 / z; cx = Math.min(1 - m, Math.max(m, cx)); cy = Math.min(1 - m, Math.max(m, cy));
  return { zoom: z, cx, cy };
}
/** dive state: clip time (s) for a dive clip of duration dur + the view transform */
export function diveXform(t, dur) {
  return { clip: Math.max(0, t - AER.dive) * dur / (AER.end - 0.35 - AER.dive), ...viewXform(t) };
}

const FS = /* glsl */`
  uniform sampler2D tA, tB, tP; uniform float uWipe, uKind, uZoom, uHasB; uniform vec2 uC, uRes, uPenA, uPenB; uniform float uPenOn;
  varying vec2 vUv;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  vec2 xf(vec2 uv){ return uC + (uv - 0.5) / uZoom; }   // uC = view centre
  void main(){
    vec2 uv = xf(vUv);
    vec3 a = texture2D(tA, uv).rgb;
    vec3 c = a;
    if (uHasB > 0.5) {
      vec3 b = texture2D(tB, uv).rgb;
      // a pencil stroke sweeping diagonally: B is revealed behind its edge
      vec2 q = vec2(vUv.x * uRes.x / uRes.y, 1.0 - vUv.y);
      float e = q.x * 0.82 + q.y * 0.38 + (h21(vec2(floor(q.y * 90.0), 3.0)) - 0.5) * 0.03 + (h21(floor(q * 260.0)) - 0.5) * 0.012;
      float k = uWipe * 2.25 - 0.08;
      c = e < k ? b : a;
      float d = k - e;
      if (d > 0.0 && d < 0.05) {      // the drawn band right behind the tip: graphite hatch or rainbow hatch
        float hatch = step(0.45, fract((q.x - q.y) * 140.0 + h21(floor(q * 40.0)) * 0.6));
        vec3 ink = uKind < 0.5 ? vec3(0.29, 0.29, 0.31) : hue(q.y * 1.6 + q.x * 0.3);
        c = mix(c, ink, (1.0 - d / 0.05) * 0.85 * hatch);
      }
    }
    // the pencil itself riding the edge (sprite)
    if (uPenOn > 0.5) {
      vec2 p = vUv * uRes; vec2 ab = uPenB - uPenA; float L = length(ab); vec2 dir = ab / L; vec2 n = vec2(-dir.y, dir.x);
      float s = dot(p - uPenA, dir) / L, w = dot(p - uPenA, n) / (L * 96.0 / 1024.0) + 0.5;
      if (s > 0.0 && s < 1.0 && w > 0.0 && w < 1.0) { vec4 pc = texture2D(tP, vec2(s, w)); c = mix(c, pc.rgb, pc.a); }
    }
    gl_FragColor = vec4(c, 1.0);
  }`;

export async function setup(ctx) {
  const W = ctx.width, H = ctx.height;
  const [sweep, dive] = await Promise.all([FrameSeq.load('sweep', ctx), FrameSeq.load('dive', ctx)]);
  const loadImg = async (name) => {
    const img = new Image(); img.src = `/media/act5/stills/${name}`;
    try { await img.decode(); } catch { return null; }
    const tx = new THREE.Texture(img); tx.needsUpdate = true; tx.minFilter = THREE.LinearFilter; tx.generateMipmaps = false; return tx;
  };
  const pencilTex = await loadImg('fixtures_pencil.jpg');
  const photoTex = await loadImg('aerial_photo.jpg');
  const pcv = { graphite: document.createElement('canvas'), rainbow: document.createElement('canvas') };
  const ptx = {};
  for (const k of ['graphite', 'rainbow']) { pcv[k].width = 1024; pcv[k].height = 96; drawPencil(pcv[k], 0.4, k); ptx[k] = new THREE.CanvasTexture(pcv[k]); }

  const mat = new THREE.ShaderMaterial({
    uniforms: { tA: { value: null }, tB: { value: null }, tP: { value: ptx.graphite }, uWipe: { value: 0 }, uKind: { value: 0 }, uZoom: { value: 1 }, uHasB: { value: 0 },
      uC: { value: new THREE.Vector2(0.5, 0.5) }, uRes: { value: new THREE.Vector2(W, H) }, uPenA: { value: new THREE.Vector2() }, uPenB: { value: new THREE.Vector2() }, uPenOn: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: FS, depthTest: false, depthWrite: false,
  });
  const quad = new FullScreenQuad(mat);
  const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };
  const U = mat.uniforms;
  const sweepTex = (s) => (sweep ? sweep.time(s) : photoTex);
  const WIPE = 0.14; // seconds for the pencil to cross the frame (~4 frames)

  function pen(t, t0, kind) {
    const u = T.clamp01((t - t0) / WIPE);
    U.uPenOn.value = t >= t0 && u < 1 ? 1 : 0; U.tP.value = ptx[kind];
    // the tip rides the wipe edge: edge line x*0.82*asp + y*0.38 = k ; put the tip on the edge at mid-height
    const k = u * 2.25 - 0.08, asp = W / H;
    const qy = 0.5, qx = (k - qy * 0.38) / 0.82; const tip = new THREE.Vector2(qx / asp * W, (1 - qy) * H);
    const dir = new THREE.Vector2(0.55, 0.83).normalize(); const L = H * 0.6;
    U.uPenB.value.copy(tip); U.uPenA.value.copy(tip).addScaledVector(dir, -L).add(new THREE.Vector2(0, 0)); // cap end up-left, tip on the edge
    U.uPenA.value.set(tip.x - dir.x * L, tip.y + dir.y * L);
  }

  return {
    stage: { kind: '3d', fx },
    update(t) {
      U.uHasB.value = 0; U.uPenOn.value = 0;
      const X = viewXform(t); U.uZoom.value = X.zoom; U.uC.value.set(X.cx, X.cy);
      if (t < AER.fix) { U.tA.value = sweepTex(sweepTime(t)); if (t >= AER.fix - 0.001) {} }
      else if (t < AER.fix + WIPE) { U.tA.value = sweepTex(sweepTime(t)); U.tB.value = pencilTex || U.tA.value; U.uHasB.value = 1; U.uWipe.value = (t - AER.fix) / WIPE; U.uKind.value = 0; pen(t, AER.fix, 'graphite'); }
      else if (t < AER.fun) { U.tA.value = pencilTex || sweepTex(sweepTime(t)); }
      else if (t < AER.fun + WIPE) { U.tA.value = pencilTex || sweepTex(sweepTime(t)); U.tB.value = sweepTex(sweepTime(t)); U.uHasB.value = 1; U.uWipe.value = (t - AER.fun) / WIPE; U.uKind.value = 1; pen(t, AER.fun, 'rainbow'); }
      else if (t < AER.dive || !dive) { U.tA.value = sweepTex(sweepTime(t)); }
      else { const d = diveXform(t, dive.duration); U.tA.value = dive.time(d.clip); } // Seedance first+last dive, compressed to the riser
      fx.flash = 0;
    },
    render(t, target) { ctx.renderer.setRenderTarget(target); quad.render(ctx.renderer); },
  };
}
