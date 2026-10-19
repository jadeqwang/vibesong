// TYPE (v4 Pass B): the split couplet 是一幅画 也是一段代码 (line 34, 123.354-125.769; once: the line-36 reuse was dropped,
// coordinator 2026-10-18, so line 36 keeps its subtitle).
// The thesis of the song in one frame: the world under it (act4.main, the bridge) is shown twice at once. The LEFT half
// is the painting: the same picture as a graphite sketch on paper (edges + hatching by value + a faint watercolour of
// its own colours). The RIGHT half is the code: the editor (the VOID navy), the same picture made of its own source
// (this engine's hanzi2d.js, the code that draws strokes in order), each glyph lit with the colour of the picture under
// it. A torn paper edge is the seam. The sung line crosses it: 是一幅画 in graphite drawn stroke by stroke on the paper,
// 也是一段代码 typed in pixel type with a cursor on the editor's current line, one character per sung syllable.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import * as T from '../../show/timing.js';
import { loadHanziVec, graphiteGlyph, gloss, pixelRaster, progAt, schedule, smooth, clamp01 } from './lib.js';
import { COMMENT } from './beats.js';

const FS = /* glsl */`
  uniform sampler2D tScene, tCode, tType; uniform vec2 uRes; uniform float uSeam, uScroll, uT, uK;
  varying vec2 vUv;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
  float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
  float L(vec2 o){ return lum(texture2D(tScene, vUv + o / uRes).rgb); }
  void main(){
    vec2 q = gl_FragCoord.xy / uK;                       // 1080p-referenced pixels (uK = H / 1080)
    vec3 sc = texture2D(tScene, vUv).rgb;
    float boil = floor(uT * 8.0);
    float seam = uSeam + (vn(vec2(vUv.y * 38.0, 3.0)) - 0.5) * 0.010 + (vn(vec2(vUv.y * 160.0, 9.0)) - 0.5) * 0.003;
    vec3 col;
    if (vUv.x < seam) {
      // ---- the painting: graphite on paper
      float s = 1.6 * uK;
      float gx = -L(vec2(-s, s)) - 2.0*L(vec2(-s, 0.)) - L(vec2(-s, -s)) + L(vec2(s, s)) + 2.0*L(vec2(s, 0.)) + L(vec2(s, -s));
      float gy = -L(vec2(-s, -s)) - 2.0*L(vec2(0., -s)) - L(vec2(s, -s)) + L(vec2(-s, s)) + 2.0*L(vec2(0., s)) + L(vec2(s, s));
      float edge = smoothstep(0.10, 0.55, length(vec2(gx, gy)));
      float d = 1.0 - lum(sc);
      float wob = (vn(q * 0.05 + boil) - 0.5) * 2.0;
      float h1 = abs(fract((q.x + q.y + wob) / 7.0) - 0.5) * 2.0;           // 45 deg hatch
      float h2 = abs(fract((q.x - q.y + wob) / 6.0) - 0.5) * 2.0;           // cross hatch in the darks
      float hatch = smoothstep(0.62, 0.92, d) * (1.0 - smoothstep(0.0, 0.28, h1)) + smoothstep(0.78, 1.0, d) * (1.0 - smoothstep(0.0, 0.25, h2)) * 0.8;
      vec3 paper = vec3(0.965, 0.935, 0.865) * (0.97 + 0.05 * h21(floor(q) + boil));
      vec3 wash = mix(vec3(lum(sc)), sc, 0.55);                              // a faint watercolour of its own colours
      col = mix(paper, paper * (0.75 + 0.35 * wash), 0.45);
      col *= 1.0 - 0.80 * edge * (0.75 + 0.25 * vn(q * 0.3));
      col *= 1.0 - 0.38 * clamp(hatch, 0.0, 1.0);
      col *= 1.0 - 0.18 * smoothstep(0.75, 1.0, d);
      // the paper's torn edge: a little graphite on the lip
      col *= 1.0 - 0.55 * smoothstep(0.0025, 0.0, seam - vUv.x);
    } else {
      // ---- the code: the editor, the picture made of its own source
      vec2 cu = vec2((vUv.x - 0.5) * 2.0, 1.0 - (1.0 - vUv.y) * 0.5 - uScroll);
      float m = texture2D(tCode, cu).a;
      // local contrast (the bridge is a low-contrast dusk): luminance against a wide ring mean, so the shapes of the
      // picture show through the code as lit / unlit glyphs, in the picture's own (saturated) colours
      float l = lum(sc), mean = 0.0; float rr = 34.0 * uK;
      for (int i = 0; i < 8; i++) { float a = float(i) * 0.7854; mean += L(vec2(cos(a), sin(a)) * rr); }
      mean /= 8.0;
      float lc = clamp(0.42 + (l - mean) * 3.2 + (l - 0.6) * 0.8, 0.0, 1.0);
      vec3 sat = clamp(mix(vec3(l), sc, 1.8), 0.0, 1.0);
      vec3 bright = clamp(sat * (0.35 + 1.15 * lc) + 0.04, 0.0, 1.0);
      vec3 bg = mix(vec3(0.03, 0.045, 0.10), sat * (0.25 + 0.5 * lc), 0.42);   // the picture, dimmed, under the code
      col = mix(bg, bright, m);
      // the paper casts a soft shadow onto the editor
      col *= 1.0 - 0.6 * smoothstep(0.018, 0.0, vUv.x - seam);
    }
    vec4 ty = texture2D(tType, vUv);
    col = mix(col, ty.rgb, ty.a);
    gl_FragColor = vec4(col, 1.0);
  }`;

export const COUPLETS = {
  couplet: { line: 34, left: '是一幅画', right: ['也', '是', '一', '段', '代', '码'], rightWords: [[0, 0], [0, 0.5], [1, 0], [2, 0], [3, 0], [4, 0]] },
};
// syntax colours for the typed half (a keyword, a number, a type, a string)
const SYN = ['#c792ea', '#c792ea', '#f78c6c', '#82aaff', '#c3e88d', '#c3e88d'];

export async function buildCouplet(ctx, key) {
  const C = COUPLETS[key]; const W = ctx.width, H = ctx.height, r = ctx.renderer; const k1080 = H / 1080;
  const words = T.words(C.line);   // [是, 一, 幅, 画, 也是, 一, 段, 代, 码]
  const t0 = ctx.entry.t0;
  // left: 是一幅画, each character drawn over its sung syllable (the first one from the cut if it was sung before it)
  const hvs = []; for (const ch of C.left) hvs.push(await loadHanziVec(ch));
  const lw = words.slice(0, 4);
  const leftSched = hvs.map((hv, i) => { const a = Math.max(lw[i].start, t0 + 0.02) ; const b = Math.min(a + 0.42, (lw[i + 1] ? lw[i + 1].start : lw[i].end) + 0.12); return schedule(hv, { a, b: Math.max(b, a + 0.18) }); });
  // right: 也 是 一 段 代 码 typed on the syllables (也是 is one word in lyrics_timed: 是 at its midpoint)
  const rw = words.slice(4);
  const rightT = C.rightWords.map(([wi, f]) => rw[wi].start + f * (rw[wi].end - rw[wi].start));

  // the code listing (the engine's own stroke-order drawer), pixel type, lit by the picture in the shader
  let src = ''; try { src = await (await fetch('/src/core/hanzi2d.js')).text(); } catch { src = '// 一笔一画'; }
  const kc = Math.max(1, Math.round(H / 540));
  const codeCv = document.createElement('canvas'); codeCv.width = Math.round(W / 2); codeCv.height = H * 2;
  { const g = codeCv.getContext('2d'); g.imageSmoothingEnabled = false; const lines = src.replace(/\t/g, '  ').split('\n');
    const lh = 10 * kc; let y = 6 * kc, li = 0;
    while (y < codeCv.height) { const ln = lines[li % lines.length]; li++;
      if (ln.trim()) { const rr = pixelRaster(ln.slice(0, 160), 'fp8', '#ffffff'); g.drawImage(rr.canvas, 0, 0, rr.w, rr.h, 34 * kc, y, rr.w * kc, rr.h * kc); }
      const num = pixelRaster(String(li).padStart(3, ' '), 'fp8', '#ffffff'); g.globalAlpha = 0.35; g.drawImage(num.canvas, 0, 0, num.w, num.h, 4 * kc, y, num.w * kc, num.h * kc); g.globalAlpha = 1;
      y += lh; } }
  const codeTex = new THREE.CanvasTexture(codeCv); codeTex.colorSpace = THREE.NoColorSpace; codeTex.magFilter = codeTex.minFilter = THREE.NearestFilter; codeTex.generateMipmaps = false;
  codeTex.wrapS = codeTex.wrapT = THREE.RepeatWrapping;

  const typeCv = document.createElement('canvas'); typeCv.width = W; typeCv.height = H; const tg = typeCv.getContext('2d');
  const typeTex = new THREE.CanvasTexture(typeCv); typeTex.colorSpace = THREE.NoColorSpace; typeTex.generateMipmaps = false; typeTex.minFilter = typeTex.magFilter = THREE.LinearFilter;
  const rt = new THREE.WebGLRenderTarget(W, H);
  const mat = new THREE.ShaderMaterial({ uniforms: { tScene: { value: rt.texture }, tCode: { value: codeTex }, tType: { value: typeTex }, uRes: { value: new THREE.Vector2(W, H) },
    uSeam: { value: 0.5 }, uScroll: { value: 0 }, uT: { value: 0 }, uK: { value: k1080 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: FS, depthTest: false, depthWrite: false });
  const quad = new FullScreenQuad(mat);

  // layout (fractions of the frame): the line runs across the seam on one baseline, low in the frame
  const S = 0.15 * H, rowY = 0.70 * H;
  const lx0 = 0.25 * W - 2 * S * 1.04;
  const rasters = C.right.map((ch, i) => pixelRaster(ch, 'fp12', SYN[i]));
  const natW = rasters.reduce((s, x) => s + x.w, 0) + 4 * (rasters.length - 1) + 6;   // + the cursor
  const kr = Math.max(1, Math.floor(Math.min(0.13 * H / 12, 0.40 * W / natW)));
  const rwid = rasters.reduce((s, x) => s + x.w * kr, 0) + kr * 4 * (rasters.length - 1);
  const rx0 = 0.75 * W - rwid / 2 + 0.01 * W;

  function drawType(t) {
    const g = tg; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    // paper wash behind the painted half of the line
    g.save(); g.filter = `blur(${Math.round(0.02 * H)}px)`; g.fillStyle = 'rgba(247,240,224,0.72)'; g.fillRect(lx0 - 0.02 * H, rowY - 0.03 * H, 4 * S * 1.04 + 0.04 * H, S + 0.16 * H); g.restore();
    hvs.forEach((hv, i) => graphiteGlyph(g, hv, { x: lx0 + i * S * 1.04, y: rowY, S, prog: progAt(leftSched[i], t), smudge: 0.35, tip: '#ffd23f', seed: 31 + i }));
    gloss(g, "it's a painting,", { x: 0.25 * W, y: rowY + S + 0.075 * H, size: 0.036 * H, t, a: leftSched[0][0].a + 0.2, dur: 0.5, color: '#2a2a31' });
    // the editor's current line (highlight band + gutter mark), then the typed half with its cursor
    const anyTyped = t >= rightT[0] - 0.25;
    g.fillStyle = 'rgba(22,34,74,0.9)'; g.fillRect(0.5 * W + 0.012 * W, rowY - 0.02 * H, 0.5 * W, S + 0.04 * H);
    g.fillStyle = 'rgba(8,12,28,0.82)'; g.fillRect(0.5 * W + 0.012 * W, rowY + S + 0.02 * H, 0.5 * W, 0.075 * H);
    g.fillStyle = anyTyped ? '#ffd23f' : 'rgba(255,210,63,0.5)'; g.fillRect(0.5 * W + 0.012 * W, rowY - 0.02 * H, Math.max(2, Math.round(0.003 * W)), S + 0.04 * H);
    let x = rx0; const yT = rowY + (S - rasters[0].h * kr) / 2; let shown = 0;
    g.imageSmoothingEnabled = false;
    rasters.forEach((rr, i) => { if (t >= rightT[i]) { g.drawImage(rr.canvas, 0, 0, rr.w, rr.h, Math.round(x), Math.round(yT), rr.w * kr, rr.h * kr); shown = i + 1; x += rr.w * kr + kr * 4; } });
    const blink = shown < rasters.length || Math.floor((t - rightT[rightT.length - 1]) * 3.4) % 2 === 0;
    if (blink) { g.fillStyle = '#ffd23f'; g.fillRect(Math.round(x), Math.round(yT + kr), kr * 5, rasters[0].h * kr - 2 * kr); }
    // the code half's gloss is a comment, typed after 段
    const ct = "// and it's also code"; const kc2 = Math.max(1, Math.round(H / 270)); const rev = clamp01((t - rightT[3]) / 0.55) * ct.length;
    if (rev > 0) { const rr = pixelRaster(ct, 'fp10', COMMENT); const n = Math.floor(rev); const cw = n >= ct.length ? rr.w : (rr.chars[n] ? rr.chars[n].x : rr.w);
      g.drawImage(rr.canvas, 0, 0, cw, rr.h, Math.round(0.75 * W - rr.w * kc2 / 2 + 0.02 * W), Math.round(rowY + S + 0.04 * H), cw * kc2, rr.h * kc2); }
    typeTex.needsUpdate = true;
  }
  return {
    rt,
    render(t, target) {
      drawType(t);
      mat.uniforms.uT.value = t; mat.uniforms.uScroll.value = ((t - t0) * 0.035) % 1;
      r.setRenderTarget(target); quad.render(r);
    },
  };
}
