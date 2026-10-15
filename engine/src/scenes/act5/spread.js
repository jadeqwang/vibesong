// OUTRO (PAPER) + THE LAST SCREEN: the sketchbook spread (illustration: media/act5/gen/spread_v1.png, NBP 4K from the
// v5 paper sheets; left page = the 2011 jam in graphite, right page = the three now in colour on the 一-bench).
// Everything written on the page is code: captions, credits (docs/credits.md, Jade's wording), the 一笔一画 title in
// colored pencil (true stroke order), the SHIPPED ✓ stamp, subtitles (handwritten, both directions).
//   entry 'act5.outro' 186.70 -> 194.06 : close on the right page (the 一 as a bench at sunset), a flower grows and
//                                         blooms on "blossoms"; 191.30 "(that's it.)": pull back to the whole spread;
//                                         lower-third captions write themselves
//   entry 'act5.last'  198.035 -> 207.2 : the final image (never black): stamp lands, credits ink in one per beat,
//                                         199.25/199.55/200.15/200.45 chop: 一 笔 一 画 draw themselves across the top;
//                                         after the song ends (201.16) a pencil rolls to a stop, a firefly blinks
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { loadFonts } from '../../core/text.js';
import { SUBS } from '../../show/subtitles.js';
import { loadHanzi } from '../../hanzi.js';
import { InkQuad, handText, PencilHanzi, drawFlower, stampCanvas, drawPencil, INK } from './paperkit.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { FrameSeq } from './frames.js';
import { AER, diveXform } from './aerial.js';

// 186.65 hand-off: the photoreal dive (same pure transform as aerial.js) is drawn over by the rainbow pencil -> the page
const WIPE_FS = /* glsl */`
  uniform sampler2D tA, tB, tP; uniform float uWipe, uZoom; uniform vec2 uC, uRes, uPenA, uPenB; uniform float uPenOn; varying vec2 vUv;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
  vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  void main(){
    vec3 a = texture2D(tA, uC + (vUv - 0.5) / uZoom).rgb, b = texture2D(tB, vUv).rgb;
    vec2 q = vec2(vUv.x * uRes.x / uRes.y, 1.0 - vUv.y);
    // soft, organic pencil edge (smooth noise, no per-row steps)
    float e = q.x * 0.82 + q.y * 0.38 + (vn(q * vec2(3.0, 9.0)) - 0.5) * 0.08 + (vn(q * 60.0) - 0.5) * 0.02;
    float k = uWipe * 2.3 - 0.1, d = k - e;
    vec3 c = mix(a, b, smoothstep(0.0, 0.035, d));
    // a band of coloured-pencil hatching right behind the edge
    float band = smoothstep(-0.005, 0.01, d) * (1.0 - smoothstep(0.02, 0.09, d));
    float hatch = smoothstep(0.35, 0.6, fract((q.x - q.y) * 120.0 + vn(q * 25.0) * 0.8));
    c = mix(c, mix(c, hue(q.y * 1.4 + q.x * 0.25) * 0.95, 0.75), band * hatch);
    if (uPenOn > 0.5) { vec2 p = vUv * uRes; vec2 ab = uPenB - uPenA; float L = length(ab); vec2 dir = ab / L; vec2 n = vec2(-dir.y, dir.x);
      float s = dot(p - uPenA, dir) / L, w = dot(p - uPenA, n) / (L * 96.0 / 1024.0) + 0.5;
      if (s > 0.0 && s < 1.0 && w > 0.0 && w < 1.0) { vec4 pc = texture2D(tP, vec2(s, w)); c = mix(c, pc.rgb, pc.a); } }
    gl_FragColor = vec4(c, 1.0);
  }`;

const A = 5504 / 3072;                       // spread aspect (world: x 0..A, y 0..1, y up)
const P = (u, v) => [u * A, 1 - v];          // image-normalised (u right, v down) -> world
export const OUT = { o0: 186.65, blossoms: 189.68, thats: 191.30, pulse: 194.06, last: 198.035, chops: [199.25, 199.55, 200.15, 200.45], end: 201.16 };
// Credits: docs/credits.md (Jade's wording). MODELS is filled at picture lock with only models whose output is in the cut.
export const MODELS = 'Veo 3.1, GPT Image 2.5, Nano Banana Pro, Seedance 2.0 and Seedance 2.5'; // audited: docs/credits_models.md
// keep each model name on one line when wrapping (non-breaking spaces inside names)
const NB = (m) => { const nb = (x) => x.replace(/ /g, '\u00a0'); const k = m.lastIndexOf(' and '); const head = k >= 0 ? m.slice(0, k) : m, last = k >= 0 ? m.slice(k + 5) : null; return head.split(', ').map(nb).join(', ') + (last ? ' and ' + nb(last) : ''); };
const CREDITS = [
  { text: ['English lyrics: Charlie van Norman'], at: P(0.255, 0.868), lh: 0.034 },
  { text: ['Chinese lyrics: Jade Wang and Claude Opus 5.5'], at: P(0.735, 0.868), lh: 0.034 },
  { text: ['Melody and chords: Charlie van Norman'], at: P(0.255, 0.912), lh: 0.034 },
  { text: ['Arrangement: Jade Wang and Suno'], at: P(0.735, 0.912), lh: 0.034 },
  // explicit, balanced line breaks (the MODELS string stays the single source; split after "supporting cast of")
  { text: ['Animation: Opus 5.5 and a', 'supporting cast of ' + MODELS.split(', ')[0] + ',', MODELS.split(', ').slice(1, 3).join(', ') + ',', MODELS.split(', ').slice(3).join(', ')], at: P(0.146, 0.13), lh: 0.031 },
];

export async function setup(ctx) {
  const isLast = ctx.entry.id === 'act5.last';
  await loadFonts(['kai', 'sans']);
  const W = ctx.width, H = ctx.height, asp = W / H;
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);

  // ---- the spread
  const img = new Image(); img.src = `/media/act5/tex/${H <= 540 ? 'spread_half' : 'spread_full'}.jpg`; await img.decode();
  const ptex = new THREE.Texture(img); ptex.needsUpdate = true; ptex.minFilter = THREE.LinearMipmapLinearFilter; ptex.anisotropy = 8;
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(A, 1), new THREE.ShaderMaterial({
    uniforms: { map: { value: ptex }, uWarm: { value: 0 } }, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform float uWarm; varying vec2 vUv; void main(){ vec3 c = texture2D(map, vUv).rgb; c *= mix(vec3(1.0), vec3(1.03, 0.99, 0.93), uWarm); gl_FragColor = vec4(c, 1.0); }',
  }));
  paper.position.set(A / 2, 0.5, 0); scene.add(paper);
  // living illustration (outro only): Veo 3.1 Fast clips registered to the still (full spread + a crisp right-page crop),
  // played as textures over their rects; the crop is feathered into the full clip at its edges (blank paper there)
  const living = [];
  if (!isLast) {
    const VID_FS = `uniform sampler2D map; uniform vec4 uFeather; uniform float uWarm; varying vec2 vUv;
      void main(){ vec3 c = texture2D(map, vUv).rgb * mix(vec3(1.0), vec3(1.03, 0.99, 0.93), uWarm);
        float a = smoothstep(0.0, uFeather.x, vUv.x) * smoothstep(0.0, uFeather.y, 1.0 - vUv.x) * smoothstep(0.0, uFeather.z, vUv.y) * smoothstep(0.0, uFeather.w, 1.0 - vUv.y);
        gl_FragColor = vec4(c, a); }`;
    for (const [name, rect, feather, z] of [['spreadF', [21 / 5504, 0, 5461 / 5504, 1], [0.0001, 0.0001, 0.0001, 0.0001], 1], ['spreadR', [0.444, 0.235, 0.556, 0.5602], [0.04, 0.0001, 0.03, 0.04], 2]]) {
      const seq = await FrameSeq.load(name, ctx, { prefer: name === 'spreadR' || H > 540 ? 1080 : 540 }); if (!seq) continue;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(rect[2] * A, rect[3]), new THREE.ShaderMaterial({ uniforms: { map: { value: null }, uFeather: { value: new THREE.Vector4(...feather) }, uWarm: { value: 1 } },
        transparent: true, depthTest: false, depthWrite: false, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: VID_FS }));
      m.position.set((rect[0] + rect[2] / 2) * A, 1 - (rect[1] + rect[3] / 2), 0); m.renderOrder = z; scene.add(m); living.push({ seq, m });
    }
  }
  const add = (o, z) => { o.renderOrder = z; scene.add(o); return o; };

  // ---- flower (grows on the right page, left end of the bench)
  const fcv = document.createElement('canvas'); fcv.width = 512; fcv.height = 768;
  const flower = add(new InkQuad(fcv, 0.07, 0.105, { anchor: 'c' }), 5);
  { const [x, y] = P(0.551, 0.700); flower.position.set(x, y, 0); }
  let fkey = '';

  // ---- captions (lower thirds, handwritten)
  const cap = (lines, u, v, size = 64) => { const t = handText(lines, { size, align: 'center' }); const h = 0.046; const q = new InkQuad(t.canvas, h * t.w / t.h, h, {}); const [x, y] = P(u, v); q.position.set(x, y, 0); return add(q, 6); };
  const capL = cap(['Charlie wrote this in 2011.'], 0.255, 0.815);
  const capR = cap(['We finally shipped it in 2026.'], 0.735, 0.815);

  // ---- credits (last screen)
  const credits = CREDITS.map((c) => {
    const size = 64, lineGap = 1.25;
    // wrap width in px so the world width stays <= wrapU (image-normalised) at this line height
    const maxW = c.wrapU ? (c.wrapU * A) / (c.lh / (size * lineGap)) : 0;
    const t = handText(c.text, { size, align: 'center', lineGap, maxW });
    const h = c.lh * t.h / (size * lineGap); const q = new InkQuad(t.canvas, h * t.w / t.h, h);
    q.position.set(c.at[0], c.at[1], 0); return add(q, 6);
  });

  // ---- title: 一笔一画 in colored pencil, true stroke order, across the top of both pages
  const chars = ['一', '笔', '一', '画']; const datas = await Promise.all(chars.map((c) => loadHanzi(c)));
  let gs = 0; const titles = datas.map((d, k) => {
    const hues = d.strokes.map((_, i) => ((gs + i) / 20) * 0.86 + 0.98); gs += d.strokes.length;
    const ph = new PencilHanzi(d, { px: 512, hues, seed: 30 + k });
    const q = add(new InkQuad(ph.cv, 0.2, 0.2), 7); const [x, y] = P(0.5 + (k - 1.5) * 0.118, 0.13); q.position.set(x, y, 0);
    q.material.uniforms.uReveal.value = 1; return { ph, q, n: d.strokes.length };
  });
  const sbs = handText(['stroke by stroke'], { size: 48, align: 'center' });
  const sbsQ = add(new InkQuad(sbs.canvas, 0.042 * sbs.w / sbs.h, 0.042), 7); { const [x, y] = P(0.5, 0.245); sbsQ.position.set(x, y, 0); }

  // ---- SHIPPED ✓ stamp (top-right corner of the right page)
  const stamp = add(new InkQuad(stampCanvas(), 0.25, 0.25 * 260 / 760), 8); { const [x, y] = P(0.865, 0.12); stamp.position.set(x, y, 0); }
  stamp.material.uniforms.uSoft.value = 0.0001;

  // ---- living detail: pencil rolling to a stop + a firefly-lamp blinking
  const pcv = document.createElement('canvas'); pcv.width = 1024; pcv.height = 96;
  const pencil = add(new InkQuad(pcv, 0.36, 0.36 * 96 / 1024), 9); pencil.material.uniforms.uSoft.value = 0.0001;
  const fly = add(new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.075), new THREE.ShaderMaterial({
    uniforms: { uOn: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uOn; varying vec2 vUv; void main(){ vec2 d = vUv - 0.5; float r = length(d);
      float glow = exp(-r * r * 22.0) * uOn; float body = smoothstep(0.075, 0.06, length(d * vec2(1.0, 1.6) - vec2(0.0, 0.03)));
      vec3 c = mix(vec3(1.0, 0.92, 0.45), vec3(0.25, 0.2, 0.18), body * (1.0 - uOn * 0.6));
      gl_FragColor = vec4(c, clamp(glow * 0.9 + body * 0.85, 0.0, 1.0)); }`,
  })), 9);
  { const [x, y] = P(0.905, 0.30); fly.position.set(x, y, 0); }

  // ---- handwritten subtitle slip (screen space): sung line on top (words ink in as sung), translation below
  const uiScene = new THREE.Scene(); const uiCam = new THREE.OrthographicCamera(0, W, H, 0, -1, 1);
  const subCache = new Map();
  function subQuad(id, t) {
    const S = SUBS[id]; const L = T.line(id); if (!S || !L) return null;
    const key = id; if (!subCache.has(key)) {
      const sz = Math.round(H * 0.045);
      const top = handText([S.top], { size: sz, color: '#2b2a30' }), bot = handText([S.bot], { size: Math.round(sz * 0.72), color: '#55525a' });
      const cv = document.createElement('canvas'); const pad = sz * 0.6;
      cv.width = Math.max(top.w, bot.w) + pad * 2; cv.height = top.h + bot.h + pad * 1.2;
      const g = cv.getContext('2d'); g.fillStyle = 'rgba(250,245,232,0.94)'; g.fillRect(0, 0, cv.width, cv.height);
      g.strokeStyle = 'rgba(120,110,95,0.35)'; g.lineWidth = 2; g.strokeRect(1, 1, cv.width - 2, cv.height - 2);
      const topX = (cv.width - top.w) / 2; g.globalAlpha = 0.22; g.drawImage(top.canvas, topX, pad * 0.5); g.globalAlpha = 1;
      g.drawImage(bot.canvas, (cv.width - bot.w) / 2, pad * 0.5 + top.h);
      const cv2 = document.createElement('canvas'); cv2.width = cv.width; cv2.height = cv.height; cv2.getContext('2d').drawImage(top.canvas, topX, pad * 0.5);
      // word boundaries along x (the sung line inks in word by word)
      const m = document.createElement('canvas').getContext('2d'); m.font = `${sz}px "LXGWWenKai"`;
      const words = S.top.split(' '); let acc = 0; const xs = [];
      words.forEach((w, i) => { acc += m.measureText(w + (i < words.length - 1 ? ' ' : '')).width; xs.push((topX + sz * 0.2 + acc) / cv.width); });
      const q = new InkQuad(cv, cv.width, cv.height); q.position.set(W / 2, H * 0.955 - cv.height / 2, 0); q.rotation.z = -0.008;
      q.material.uniforms.uSoft.value = 0.0001; q.renderOrder = 20; uiScene.add(q);
      const q2 = new InkQuad(cv2, cv.width, cv.height); q2.position.copy(q.position); q2.rotation.z = q.rotation.z;
      q2.material.uniforms.uSoft.value = 0.01; q2.renderOrder = 21; uiScene.add(q2); q.ink = q2;
      subCache.set(key, { q, xs, L, nW: words.length });
    }
    return subCache.get(key);
  }
  const subIds = [48, 49];
  subIds.forEach((id) => subQuad(id, 0));

  function camSet(cx, cy, h) {
    cam.left = cx - h * asp / 2; cam.right = cx + h * asp / 2; cam.top = cy + h / 2; cam.bottom = cy - h / 2; cam.updateProjectionMatrix();
  }
  const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };
  // the 186.65 hand-off from the dive (outro entry only)
  let wipe = null;
  if (!isLast) {
    const dive = await FrameSeq.load('dive', ctx);
    const pc = document.createElement('canvas'); pc.width = 1024; pc.height = 96; drawPencil(pc, 0.4, 'rainbow');
    const rt = new THREE.WebGLRenderTarget(W, H);
    const m = new THREE.ShaderMaterial({ uniforms: { tA: { value: null }, tB: { value: rt.texture }, tP: { value: new THREE.CanvasTexture(pc) }, uWipe: { value: 0 }, uZoom: { value: 1 },
      uC: { value: new THREE.Vector2(0.5, 0.5) }, uRes: { value: new THREE.Vector2(W, H) }, uPenA: { value: new THREE.Vector2() }, uPenB: { value: new THREE.Vector2() }, uPenOn: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: WIPE_FS, depthTest: false, depthWrite: false });
    wipe = { dive, rt, m, q: new FullScreenQuad(m) };
  }

  return {
    stage: { kind: '3d', fx },
    update(t) {
      // ---------------- camera
      const full = [A / 2, 0.5, 1.0];
      const [cx0, cy0] = P(0.737, 0.515);
      if (!isLast) {
        const push = T.span(t, OUT.o0, OUT.thats, T.ease.linear);
        const close = [cx0 + 0.008 * push, cy0, 0.56 - 0.05 * push];
        const u = T.span(t, OUT.thats, OUT.thats + 1.6, T.ease.inOut);
        camSet(close[0] + (full[0] - close[0]) * u, close[1] + (full[1] - close[1]) * u, close[2] + (full[2] - close[2]) * u);
      } else {
        const u = T.span(t, OUT.last, 207, T.ease.linear);
        camSet(full[0], full[1] - 0.004 * u, 1.0 - 0.018 * u);   // a breath of a push, so it is a moment, not a frozen frame
      }
      paper.material.uniforms.uWarm.value = isLast ? 0 : 1 - T.span(t, OUT.thats, OUT.thats + 2);
      for (const { seq, m } of living) m.material.uniforms.uWarm.value = paper.material.uniforms.uWarm.value, m.material.uniforms.map.value = seq.time(Math.max(0, t - OUT.o0) * seq.duration / (194.31 - OUT.o0));
      // ---------------- flower: stem 187.0-188.8, bloom on "blossoms"
      const grow = isLast ? 1 : T.span(t, OUT.o0 + 0.3, OUT.blossoms - 0.3, T.ease.out);
      const bloom = isLast ? 1 : T.span(t, OUT.blossoms, OUT.blossoms + 0.9, T.ease.back);
      const sway = Math.sin(t * 1.3) * 0.15 * (isLast ? 0.6 : 1);
      const k = `${grow.toFixed(3)}|${bloom.toFixed(3)}|${sway.toFixed(3)}`;
      if (k !== fkey) { drawFlower(fcv, grow, bloom, sway); flower.refresh(); fkey = k; }
      // ---------------- captions
      capL.reveal = isLast ? 1 : T.span(t, OUT.thats + 0.15, OUT.thats + 1.15);
      capR.reveal = isLast ? 1 : T.span(t, OUT.thats + 1.0, OUT.thats + 2.1);
      // ---------------- last screen elements
      const beats = T.beatsIn(OUT.last - 0.02, 201.5, 1).slice(0, CREDITS.length);
      credits.forEach((q, i) => { q.visible = isLast; q.reveal = T.span(t, beats[i], beats[i] + 0.36); });
      titles.forEach(({ ph, q, n }, k) => {
        q.visible = isLast;
        if (!isLast) return;
        const c0 = OUT.chops[k], dur = k === 1 ? 0.42 : k === 3 ? 0.5 : 0.18;
        const prog = []; for (let i = 0; i < n; i++) prog.push(T.span(t, c0 + dur * i / n, c0 + dur * (i + 1) / n));
        if (ph.draw(prog)) q.refresh();
      });
      sbsQ.visible = isLast; sbsQ.reveal = T.span(t, 200.75, 201.35);
      stamp.visible = isLast;
      if (isLast) {
        const s = T.since(t, OUT.last); const sc = s < 0 ? 0 : [1.55, 1.22, 1.06, 0.98, 1.0][Math.min(4, Math.floor(s * 30))];
        stamp.scale.setScalar(sc); stamp.rotation.z = 0.12; stamp.material.uniforms.uOpacity.value = s < 0 ? 0 : 0.92;
      }
      // pencil: set down after the title (200.8), rolls toward the lower right of the right page, stops ~202.6
      pencil.visible = isLast && t >= 200.85;
      if (pencil.visible) {
        const u = T.clamp01((t - 200.85) / 1.75); const e = 1 - (1 - u) * (1 - u);
        const rock = u >= 1 ? Math.exp(-(t - 202.6) * 3) * Math.sin((t - 202.6) * 9) * 0.004 : 0;
        const [x0, y0] = P(0.925, 0.58), [x1, y1] = P(0.957, 0.60);
        pencil.position.set(x0 + (x1 - x0) * e + rock, y0 + (y1 - y0) * e, 0); pencil.rotation.z = Math.PI / 2 - 0.05;
        const ph = (e * 0.057 + rock) / 0.0105; // roll angle = distance / radius
        if (pencil._ph !== ph.toFixed(3)) { drawPencil(pcv, ph); pencil.refresh(); pencil._ph = ph.toFixed(3); }
        pencil.opacity = T.span(t, 200.85, 200.95);
      }
      fly.visible = isLast && t >= 201.3;
      if (fly.visible) { const ph = ((t - 201.3) % 1.7) / 1.7; fly.material.uniforms.uOn.value = Math.pow(Math.sin(Math.PI * Math.min(1, ph / 0.55)), 2); fly.position.y = P(0.905, 0.30)[1] + Math.sin(t * 0.9) * 0.006; }
      // ---------------- subtitles (outro only)
      subIds.forEach((id) => { const s = subCache.get(id); s.q.visible = false; s.q.ink.visible = false; });
      if (!isLast) for (const id of subIds) {
        const s = subCache.get(id); const L = s.L; if (t < L.start - 0.12 || t > L.end + 0.5) continue;
        s.q.visible = true;
        const ws = L.words || []; let reveal = 0;
        ws.forEach((w, i) => { if (t >= w.start) reveal = s.xs[Math.min(i, s.xs.length - 1)]; });
        // the translation line is fully visible; the sung line inks in word by word (left part of the slip)
        const op = Math.min(T.span(t, L.start - 0.12, L.start + 0.05), 1 - T.span(t, L.end + 0.3, L.end + 0.5));
        s.q.material.uniforms.uReveal.value = 1; s.q.material.uniforms.uOpacity.value = op;
        s.q.ink.visible = true; s.q.ink.material.uniforms.uReveal.value = reveal; s.q.ink.material.uniforms.uOpacity.value = op;
      }
    },
    render(t, target) {
      const r = ctx.renderer;
      const wiping = wipe && wipe.dive && t < AER.paper + AER.paperWipe;
      r.setRenderTarget(wiping ? wipe.rt : target); r.setClearColor(0xefe6d2, 1); r.clear();
      r.render(scene, cam);
      r.autoClear = false; r.render(uiScene, uiCam); r.autoClear = true;
      if (wiping) {
        const U = wipe.m.uniforms, d = diveXform(t, wipe.dive.duration), u = T.clamp01((t - AER.paper) / AER.paperWipe);
        U.tA.value = wipe.dive.time(d.clip); U.uZoom.value = d.zoom; U.uC.value.set(d.cx, d.cy); U.uWipe.value = T.ease.inOut(u);
        // the rainbow pencil rides the edge, cap end up-left
        const k = T.ease.inOut(u) * 2.3 - 0.1, qy = 0.5, qx = (k - qy * 0.38) / 0.82;
        const tip = new THREE.Vector2(qx * H, (1 - qy) * H), dir = new THREE.Vector2(0.55, 0.83).normalize(), L = H * 0.6;
        U.uPenB.value.copy(tip); U.uPenA.value.set(tip.x - dir.x * L, tip.y + dir.y * L); U.uPenOn.value = u < 1 ? 1 : 0;
        r.setRenderTarget(target); wipe.q.render(r);
      }
    },
  };
}
