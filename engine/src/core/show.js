// ShowRunner: a show is a list of scene entries, each owning a [t0, t1) range on the song timeline.
//   { id, t0, t1, load: () => import('../scenes/act1/x.js'), transition?: { type:'stroke'|'cut'|'iris', dur } }
// Only entries overlapping the render range are loaded + set up (fast partial renders).
// Overlaps are allowed: when two entries are active, both render to targets and the later-starting one is
// composited over the earlier one with its `transition` (default: cut).
//
// Scene module contract (see engine/HANDOFF_ACTS.md):
//   export async function setup(ctx) -> { stage, update(t) }      stage = Stage2D (2D) or { kind:'3d', ... }
//     ctx = { renderer, post, width, height, fps, T (timing), lib (SpriteLib), entry, show }
//   update(t) receives ABSOLUTE song time and must be a pure function of t.
//   2D stages are rendered by the runner (world -> pixel post -> UI overlay -> flash).
//   3D/custom scenes may return render(t, target) and drive post themselves (see scenes/dev/turn_show.js).
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import * as T from '../show/timing.js';
import { SpriteLib } from './sprites.js';
import { loadFonts } from './text.js';
import { SHOWS } from '../show/index.js';

const COMP_FS = /* glsl */`
  uniform sampler2D tA, tB; uniform float uU, uType, uAspect; varying vec2 vUv;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec4 a = texture2D(tA, vUv), b = texture2D(tB, vUv); float m = 1.0;
    if (uType > 0.5 && uType < 1.5) {        // stroke wipe: a ragged graphite brush edge sweeping left->right
      vec2 q = floor(vUv * vec2(320.0, 180.0));
      float edge = vUv.x * 0.9 + (1.0 - vUv.y) * 0.1 + (h21(vec2(q.y, 1.0)) - 0.5) * 0.04;
      float k = uU * 1.15 - 0.05;
      m = step(edge, k);
      if (abs(edge - k) < 0.012) { gl_FragColor = vec4(vec3(0.08), 1.0); return; }
    } else if (uType > 1.5) {                // iris
      vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0); m = step(length(d), uU * 1.1);
    }
    gl_FragColor = mix(a, b, m);
  }`;

export class ShowRunner {
  constructor({ renderer, post, width, height, fps }) {
    Object.assign(this, { renderer, post, width, height, fps });
    this.rtA = new THREE.WebGLRenderTarget(width, height); this.rtB = new THREE.WebGLRenderTarget(width, height);
    this.comp = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tA: { value: null }, tB: { value: null }, uU: { value: 0 }, uType: { value: 0 }, uAspect: { value: width / height } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }', fragmentShader: COMP_FS, depthTest: false, depthWrite: false }));
    this.overlay = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color(1, 1, 1) }, uA: { value: 0 } }, transparent: true,
      vertexShader: 'void main(){ gl_Position=vec4(position.xy,0.,1.); }', fragmentShader: 'uniform vec3 uC; uniform float uA; void main(){ gl_FragColor = vec4(uC, uA); }', depthTest: false, depthWrite: false }));
  }
  async load(name, from = 0, to = 1e9) {
    const def = SHOWS[name]; if (!def) throw new Error('unknown show ' + name);
    this.entries = (await def()).default(T);
    this.duration = Math.max(...this.entries.map((e) => e.t1));
    this.lib = await SpriteLib.load();
    await this.lib.preloadAll(); // every strip in sprites.json (small PNGs; read live so art updates drop in)
    await loadFonts();
    const ctx = { renderer: this.renderer, post: this.post, width: this.width, height: this.height, fps: this.fps, T, lib: this.lib, show: this };
    for (const e of this.entries) {
      if (e.t1 <= from - 1e-6 || e.t0 >= to) continue;
      const mod = await e.load();
      const t0 = performance.now();
      e.inst = await mod.setup({ ...ctx, entry: e });
      console.log(`[engine] setup ${e.id} [${e.t0.toFixed(3)}, ${e.t1.toFixed(3)}) ${Math.round(performance.now() - t0)}ms`);
    }
    // warm-up: compile every program once
    for (const e of this.entries) if (e.inst) this.renderEntry(e, Math.max(e.t0, Math.min(e.t1 - 1e-3, from)), this.rtA);
  }
  renderEntry(e, t, target) {
    const inst = e.inst, st = inst.stage, r = this.renderer;
    if (st?.beginFrame) st.beginFrame();
    inst.update(t);
    if (inst.render) return inst.render(t, target);
    if (st?.kind === '2d') {
      this.post.set2D({ pix: st.pix(this.height), palMix: st.look.palMix, dither: st.look.dither });
      if (st.look.palette) this.post.setPalette(st.look.palette);
      st.cam.apply();
      this.post.render(st.scene, st.cam.cam, target);
      r.autoClear = false; r.setRenderTarget(target); r.clearDepth(); r.render(st.ui, st.uiCam); r.autoClear = true;
      return;
    }
    // legacy { scene, camera, update }
    this.post.render(inst.scene, inst.camera, target);
  }
  /** optional async per-frame preparation (R-D4): scenes may export prepare(t) to load only what this frame needs */
  async prepare(t) {
    for (const e of this.entries) if (e.inst?.prepare && t >= e.t0 - 1e-9 && t < e.t1) await e.inst.prepare(t);
  }
  render(t) {
    const r = this.renderer;
    const act = this.entries.filter((e) => e.inst && t >= e.t0 - 1e-9 && t < e.t1).sort((a, b) => a.t0 - b.t0);
    if (!act.length) { r.setRenderTarget(null); r.setClearColor(0x000000, 1); r.clear(); return; }
    if (act.length === 1) this.renderEntry(act[0], t, null);
    else {
      const a = act[act.length - 2], b = act[act.length - 1], tr = b.transition || { type: 'cut' };
      if (tr.type === 'cut') this.renderEntry(b, t, null);
      else {
        this.renderEntry(a, t, this.rtA); this.renderEntry(b, t, this.rtB);
        const U = this.comp.material.uniforms; U.tA.value = this.rtA.texture; U.tB.value = this.rtB.texture;
        U.uU.value = Math.max(0, Math.min(1, (t - b.t0) / (tr.dur || 0.3))); U.uType.value = { stroke: 1, iris: 2 }[tr.type] || 0;
        r.setRenderTarget(null); this.comp.render(r);
      }
    }
    // global overlays (flash / fade) from the topmost active stage
    const fx = act[act.length - 1].inst.stage?.fx;
    if (fx && (fx.flash > 0 || fx.fade > 0)) {
      const O = this.overlay.material.uniforms;
      r.setRenderTarget(null); r.autoClear = false;
      if (fx.fade > 0) { O.uC.value.set(fx.fadeColor); O.uA.value = fx.fade; this.overlay.render(r); }
      if (fx.flash > 0) { O.uC.value.set(fx.flashColor); O.uA.value = fx.flash; this.overlay.render(r); }
      r.autoClear = true;
    }
  }
}
