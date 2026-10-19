// TYPE (v4 Pass B, unit type): the show-entry module for every `type.*` entry (show/main.js `type` block).
// A type entry is a later show entry that overlaps the scene(s) beneath it. The ShowRunner only draws the top entry
// when the later one has a `cut` transition, so this module renders what is beneath it itself, exactly the way the
// runner would (one entry, or the top pair with its transition), and then draws its type over that frame. The runner's
// flash / fade overlays are taken from the scene beneath (stage.fx is forwarded). Nothing in the scenes beneath is touched.
//   type.yibi / type.void / type.chufa       in-world glosses on 2D lines (beats.js drawGloss2D)
//   type.zhan / type.wutai / type.da         one big character (or 舞台) + a small gloss (beats.js drawBig)
//   type.couplet                             the split couplet (couplet.js): it replaces the picture with paper | code
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { loadFonts } from '../../core/text.js';
import { L as act1Level } from '../act1/level.js';
import { BIG, prepareBig, drawBig, drawGloss2D } from './beats.js';
import { COUPLETS, buildCouplet } from './couplet.js';

function beneath(ctx) {
  const show = ctx.show, me = ctx.entry, r = ctx.renderer; let rtA = null, rtB = null;
  const list = (t) => show.entries.filter((e) => e !== me && e.inst && !String(e.id).startsWith('type.') && t >= e.t0 - 1e-9 && t < e.t1).sort((a, b) => a.t0 - b.t0);
  return {
    top(t) { const L = list(t); return L[L.length - 1] || null; },
    render(t, target) {
      const L = list(t);
      if (!L.length) { r.setRenderTarget(target); r.setClearColor(0x000000, 1); r.clear(); return; }
      if (L.length === 1) { show.renderEntry(L[0], t, target); return; }
      const a = L[L.length - 2], b = L[L.length - 1], tr = b.transition || { type: 'cut' };
      if (tr.type === 'cut') { show.renderEntry(b, t, target); return; }
      if (!rtA) { rtA = new THREE.WebGLRenderTarget(ctx.width, ctx.height); rtB = new THREE.WebGLRenderTarget(ctx.width, ctx.height); }
      show.renderEntry(a, t, rtA); show.renderEntry(b, t, rtB);
      const U = show.comp.material.uniforms; U.tA.value = rtA.texture; U.tB.value = rtB.texture;
      U.uU.value = Math.max(0, Math.min(1, (t - b.t0) / (tr.dur || 0.3))); U.uType.value = { stroke: 1, iris: 2 }[tr.type] || 0;
      r.setRenderTarget(target); show.comp.render(r);
    },
  };
}

export async function setup(ctx) {
  const key = String(ctx.entry.id).replace(/^type\./, '').replace(/#\d+$/, '');   // show/main.js splits an entry at scene starts (id#n)
  const W = ctx.width, H = ctx.height, r = ctx.renderer;
  await loadFonts(['kai']);
  const under = beneath(ctx);
  let lastT = ctx.entry.t0;
  const stage = { kind: 'type', get fx() { const e = under.top(lastT); return e && e.inst && e.inst.stage ? e.inst.stage.fx : undefined; } };

  if (COUPLETS[key]) {
    const C = await buildCouplet(ctx, key);
    return { stage, update(t) { lastT = t; }, render(t, target) { under.render(t, C.rt); C.render(t, target); } };
  }

  // a transparent canvas the size of the frame, drawn over the frame beneath
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = false; tex.minFilter = tex.magFilter = THREE.LinearFilter;
  const quad = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { map: { value: tex } }, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ gl_FragColor = texture2D(map, vUv); }' }));
  if (BIG[key]) await prepareBig(key);
  const env = {};
  if (key === 'void') env.edge = act1Level().X.edge;

  return {
    stage,
    update(t) { lastT = t; },
    render(t, target) {
      under.render(t, target);
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      if (BIG[key]) drawBig(g, W, H, t, key);
      else { const top = under.top(t); env.cam = top && top.inst && top.inst.stage ? top.inst.stage.cam : null; drawGloss2D(g, W, H, t, key, env); }
      tex.needsUpdate = true;
      r.setRenderTarget(target); const ac = r.autoClear; r.autoClear = false; quad.render(r); r.autoClear = ac;
    },
  };
}
