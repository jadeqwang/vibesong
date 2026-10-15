// Torn-paper hand-offs between Act V looks (replaces the core 'stroke' wipe whose black zig-zag read as a glitch here):
//   act5.tear_title  194.06 -> 194.42 : the sketchbook spread is torn away (right -> left), revealing the pixel SAVE screen
//   act5.tear_last   198.035 -> 198.40: the pixel title screen (cream paper) is torn away, revealing the final spread
// The edge is cream paper fibres with a soft cast shadow on the revealed layer and a slight curl on the lifting paper.
// This module sets up the two neighbouring scenes itself and renders them through the runner (ctx.show.renderEntry),
// so the engine still owns timing. Core request R-D5 asks for a native 'tear' transition.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import * as T from '../../show/timing.js';

const FS = /* glsl */`
  uniform sampler2D tA, tB; uniform float uU, uAsp; uniform vec2 uRes; varying vec2 vUv;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float vn(float x){ float i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f); return mix(h21(vec2(i, 1.7)), h21(vec2(i + 1.0, 1.7)), f); }
  float tearX(float y){ // ragged torn edge: big wobble + small fibrous teeth
    return 0.035 * (vn(y * 4.0) - 0.5) + 0.018 * (vn(y * 19.0) - 0.5) + 0.008 * (vn(y * 83.0) - 0.5) + 0.003 * (h21(vec2(floor(y * 600.0), 3.0)) - 0.5);
  }
  void main(){
    float x = vUv.x, y = 1.0 - vUv.y;
    // the edge runs slightly diagonal and travels right -> left (the page is peeled off toward the left)
    float edge = mix(1.12, -0.16, uU) + 0.08 * (y - 0.5) + tearX(y);
    float d = (x - edge) * uRes.x;                 // px: < 0 = still the old page, > 0 = revealed
    vec3 a = texture2D(tA, vUv).rgb, b = texture2D(tB, vUv).rgb;
    vec3 c;
    if (d < 0.0) {
      // curl: the lifting paper near the tear brightens then darkens (a gentle roll), within ~70 px
      float k = clamp(-d / (70.0 * uRes.y / 1080.0), 0.0, 1.0);
      c = a * (0.86 + 0.14 * smoothstep(0.0, 1.0, k)) + vec3(0.05) * (1.0 - k) * smoothstep(0.0, 0.25, k);
    } else {
      float s = uRes.y / 1080.0;
      float fib = clamp(1.0 - d / (7.0 * s + 6.0 * s * h21(vec2(floor(y * 900.0), 7.0))), 0.0, 1.0);   // white torn fibres
      float shadow = exp(-d / (26.0 * s)) * 0.38;                                                      // soft cast shadow
      c = b * (1.0 - shadow);
      c = mix(c, vec3(0.985, 0.972, 0.94), fib * (0.75 + 0.25 * h21(floor(vUv * uRes / 2.0))));
    }
    gl_FragColor = vec4(c, 1.0);
  }`;

const PAIRS = {
  'act5.tear_title': { from: ['act5.outro', () => import('./spread.js')], to: ['act5.title', () => import('./title.js')], t0: 194.06, dur: 0.36 },
  'act5.tear_last': { from: ['act5.title', () => import('./title.js')], to: ['act5.last', () => import('./spread.js')], t0: 198.035, dur: 0.36 },
};

export async function setup(ctx) {
  const P = PAIRS[ctx.entry.id];
  const mk = async ([id, load]) => ({ id, inst: await (await load()).setup({ ...ctx, entry: { ...ctx.entry, id } }) });
  const A = await mk(P.from), B = await mk(P.to);
  const rtA = new THREE.WebGLRenderTarget(ctx.width, ctx.height), rtB = new THREE.WebGLRenderTarget(ctx.width, ctx.height);
  const q = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uU: { value: 0 }, uAsp: { value: ctx.width / ctx.height }, uRes: { value: new THREE.Vector2(ctx.width, ctx.height) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: FS, depthTest: false, depthWrite: false,
  }));
  const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };
  return {
    stage: { kind: '3d', fx },
    update() {},
    render(t, target) {
      ctx.show.renderEntry({ inst: A.inst }, t, rtA);
      ctx.show.renderEntry({ inst: B.inst }, t, rtB);
      fx.flash = 0;   // no global flashes during the tear (the clack lives on the cartridge sprite)
      q.material.uniforms.uU.value = T.ease.inOut(T.clamp01((t - P.t0) / P.dur));
      ctx.renderer.setRenderTarget(target); q.render(ctx.renderer);
    },
  };
}
