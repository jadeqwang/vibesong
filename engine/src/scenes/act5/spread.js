// OUTRO (PAPER) + THE LAST SCREEN: the sketchbook spread (illustration: media/act5/gen/spread_v1.png, NBP 4K from the
// v5 paper sheets; left page = the 2011 jam in graphite, right page = the three now in colour on the 一-bench).
// Everything written on the page is code: captions, credits (docs/credits.md, Jade's wording), the 一笔一画 title in
// colored pencil (true stroke order), the SAVE COMPLETE · 2026 stamp (v4; was SHIPPED ✓), the dedication (v4), subtitles (v4: SmoothSubs).
//   entry 'act5.outro' 186.65 -> 198.035 (v4; was -> 194.31): close on the right page (the 一 as a bench at sunset), a flower grows and
//                                         blooms on "blossoms"; 191.30 "(that's it.)": pull back to the whole spread;
//                                         lower-third captions write themselves
//   entry 'act5.last'  198.035 -> 203.0 (v4; was -> 207.2): the final image (never black): stamp lands, the opening's pencil
//                                         writes the dedication, 199.25/199.55/200.15/200.45 chop: 一 笔 一 画 draw themselves;
//                                         the credits ink in after the song ends (201.16) (v4 M3; see the page beats below)
// (v4 Pass B, open_close) THE OUTRO PAGE (approved still #11): the spread now carries the v11 brows (media/act5/tex/
// spread_*_v11.jpg); the end is the 2011 page from the opening (#01), now in colour with all three:
//   191.30-194.06  pull back to the whole spread (no captions on it any more: they moved to the page)
//   194.06-195.40  (the synth pulse) push into the LEFT page = the 2011 page (graphite, Charlie alone)
//   195.40-196.30  a rainbow pencil edge colours it in: page #11 (same plate as #01: media/act5/tex/page11*.jpg), drawn
//                  registered onto the spread's left page (PM), then it settles into its own full frame by 196.97
//   196.75-197.85  the two end-card lines ink in; 198.035 SAVE COMPLETE · 2026 stamps on the final drum tag
//   (v4 M3) one thing per beat, top to bottom: stamp -> dedication -> title -> credits
//   198.25-199.40  the opening's own pencil (pencil01, same angle) comes back in along its axis, WRITES the dedication on
//                  the next beat (198.471 -> 199.10, under the end-card lines), then lifts away the way it left at 0.343-0.85
//   199.25-200.95  一 笔 一 画 draw themselves on the chops (left column), 200.60 "The Vibe Coding Song" under them
//   201.025-202.0  the credits ink in, stacked, in the silence; the finished dedication is readable 199.10 -> 203.0
//   (the M2 rolling pencil at 200.85 is retired: the pencil's job is now the dedication); picture ends 203.0
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { loadFonts } from '../../core/text.js';
import { loadHanzi } from '../../hanzi.js';
import { InkQuad, handText, PencilHanzi, drawFlower, saveStampCanvas, drawPencil, INK } from './paperkit.js';
import { SmoothSubs } from '../act3/common.js';
import { subtitleFor } from '../../core/ui.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { FrameSeq } from './frames.js';
import { AER, diveXform } from './aerial.js';
import { drawDoodle, LAMP_BULB } from './doodles.js';   // v7: margin doodles (firefly lamp, pink Eraser in its cap)
import { pageKit, FrameLayer, WipeBand, loadImg, imgTex, TEX } from './paperkit.js';

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
export const OUT = { o0: 186.65, blossoms: 191.22, thats: 191.95,   /* (v4 M3) word onsets per the type unit's stem audit (were 189.68 = 'just', 191.30) */ pulse: 194.06, last: 198.035, chops: [199.25, 199.55, 200.15, 200.45], end: 201.16, ded: [198.471, 199.10], fin: 203.0,   /* (v4 M3) ded was [201.4, 202.4]: readable 0.5 s */
  pen: { in: 198.25, out: 199.40 }, sbs: [200.60, 201.00], cred: { t0: 201.025, step: 0.15, dur: 0.36 },   // (v4 M3) pencil in/out; title subline; credits after the title
  push: [194.06, 195.40], wipe: [195.40, 196.30], settle: 0.67, capA: [196.75, 197.40], capB: [197.20, 197.85] };   // on the synth pulse (0.448 s)   // (v4 Pass B) the page beats
// page frame px -> spread world (registered on the 2011 drawing: assets/v4_stills/tools/passB_oc/register.py, page #01 plate
// vs the spread's left page: A = 0.88992 B + (-418.1, -243.2), then x0.64978 + (122.3, 275.2) into spread_half px)
const PM = { ax: 5.3963e-4, bx: -0.097247, ay: 5.3542e-4, by: 0.923717 };
// the push target: the same scale as the page, slid right just enough to stay inside the spread (its left 9 % is beyond
// the book's edge); the page then settles into its own framing after the wipe
const PUSH = { cx: 0.51913, cy: 0.63459, h: 0.5784 };
// (v4, ONE ending) the sketchbook IS the end: 'act5.outro' runs 186.65 -> 198.035 (the page holds through the old pixel SAVE
// COMPLETE slot), 'act5.last' 198.035 -> 203.0 (the stamp lands on the final drum tag, credits, title, the dedication last).
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
  const img = new Image(); img.src = `/media/act5/tex/${H <= 540 ? 'spread_half_v11' : 'spread_full_v11'}.jpg`; await img.decode();   // (v4 Pass B) v11 brows
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
  if (!isLast) {   // (v4) the outro now holds the page to 198.035: the living layer settles into the approved still (194.06 -> 194.9)
    const VID_FS = `uniform sampler2D map; uniform vec4 uFeather; uniform float uWarm, uOp; varying vec2 vUv;
      void main(){ vec3 c = texture2D(map, vUv).rgb * mix(vec3(1.0), vec3(1.03, 0.99, 0.93), uWarm);
        float a = smoothstep(0.0, uFeather.x, vUv.x) * smoothstep(0.0, uFeather.y, 1.0 - vUv.x) * smoothstep(0.0, uFeather.z, vUv.y) * smoothstep(0.0, uFeather.w, 1.0 - vUv.y);
        gl_FragColor = vec4(c, a * uOp); }`;
    for (const [name, rect, feather, z] of [['spreadF', [21 / 5504, 0, 5461 / 5504, 1], [0.0001, 0.0001, 0.0001, 0.0001], 1], ['spreadR_v13c', [0.444, 0.235, 0.556, 0.5602], [0.04, 0.0001, 0.03, 0.04], 2]]) {
      const seq = await FrameSeq.load(name, ctx, { prefer: name.startsWith('spreadR') || H > 540 ? 1080 : 540 }); if (!seq) continue;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(rect[2] * A, rect[3]), new THREE.ShaderMaterial({ uniforms: { map: { value: null }, uFeather: { value: new THREE.Vector4(...feather) }, uWarm: { value: 1 }, uOp: { value: 1 } },
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
  const capL = cap(['Charlie wrote this about product management in 2011.'], 0.255, 0.815);
  const capR = cap(['We shipped The Vibe Coding Song in 2026.'], 0.735, 0.815);

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
  const sbs = handText(['The Vibe Coding Song'], { size: 48, align: 'center' });
  const sbsQ = add(new InkQuad(sbs.canvas, 0.042 * sbs.w / sbs.h, 0.042), 7); { const [x, y] = P(0.5, 0.245); sbsQ.position.set(x, y, 0); }

  // ---- (v4) the SAVE COMPLETE · 2026 stamp (top-right corner of the right page, where SHIPPED ✓ was; clear of the 画)
  const STW = 0.38; const stamp = add(new InkQuad(saveStampCanvas(), STW, STW * 240 / 1600), 8); { const [x, y] = P(0.856, 0.118); stamp.position.set(x, y, 0); }
  // ---- (v4, Jade 2026-10-18) the dedication, in the page's own hand (handText), right-aligned under the stamp; it inks in last
  const dedT = handText(['For every idea that waited in a drawer.'], { size: 64, align: 'center' }); const dedH = 0.036;
  const ded = add(new InkQuad(dedT.canvas, dedH * dedT.w / dedT.h, dedH), 7); { const [x1, y] = P(0.962, 0.205); ded.position.set(x1 - dedH * dedT.w / dedT.h / 2, y, 0); }
  stamp.material.uniforms.uSoft.value = 0.0001;

  // ---- (v7) margin doodles in the outer bottom corners, inked in with the credits: the firefly LAMP (left page, by
  //      Charlie's 2011 room) and the pink ERASER wearing Charlie's spare beige cap (right page, under the pencil)
  const DOODLES = [{ name: 'lamp', at: P(0.062, 0.872), h: 0.118, beat: 1 }, { name: 'eraser', at: P(0.948, 0.872), h: 0.105, beat: 3 }];
  const doodles = DOODLES.map((d) => { const cv = document.createElement('canvas'); cv.width = cv.height = H <= 540 ? 256 : 512;
    const q = add(new InkQuad(cv, d.h, d.h), 7); q.material.uniforms.uSoft.value = 0.0001; q.position.set(d.at[0], d.at[1], 0); q.visible = false; return { ...d, cv, q, key: '' }; });
  const bulbAt = [DOODLES[0].at[0] + (LAMP_BULB[0] - 0.5) * DOODLES[0].h, DOODLES[0].at[1] + (0.5 - LAMP_BULB[1]) * DOODLES[0].h];
  // ---- living detail: pencil rolling to a stop + the firefly LAMP's bulb blinking (v7: it is the doodled lamp now)
  const pcv = document.createElement('canvas'); pcv.width = 1024; pcv.height = 96;
  const pencil = add(new InkQuad(pcv, 0.36, 0.36 * 96 / 1024), 9); pencil.material.uniforms.uSoft.value = 0.0001;
  const fly = add(new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.075), new THREE.ShaderMaterial({
    uniforms: { uOn: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uOn; varying vec2 vUv; void main(){ vec2 d = vUv - 0.5; float r = length(d);
      float glow = exp(-r * r * 22.0) * uOn; float body = 0.0;   // v7: no bug body, the doodled lamp's bulb is under it
      vec3 c = mix(vec3(1.0, 0.92, 0.45), vec3(0.25, 0.2, 0.18), body * (1.0 - uOn * 0.6));
      gl_FragColor = vec4(c, clamp(glow * 0.9 + body * 0.85, 0.0, 1.0)); }`,
  })), 9);
  fly.position.set(bulbAt[0], bulbAt[1], 0); fly.scale.setScalar(0.62);

  // ---- (v4 Pass B) THE PAGE (#11): one plate with the opening page; everything on it in frame px (paperkit pageKit)
  const kit = await pageKit(ctx), PL = kit.lay;
  const pg = await kit.page('page11', 0);
  const cap11a = await kit.layer('cap11a', { z: 4 }), cap11b = await kit.layer('cap11b', { z: 4 });
  const ded11 = await kit.layer('ded11', { z: 4 });
  const SL = PL.stamp11; const stamp11 = await kit.layer('stamp11', { z: 7, anchor: [SL.w / 2, SL.h / 2] }); stamp11.place(SL.x + SL.w / 2, SL.y + SL.h / 2);
  for (const q of [cap11a, cap11b, ded11]) q.soft = 0.015;
  const TT = { x0: 50, y0: 410, s: 112, gap: 6 };                        // 一笔一画 in the left column, clear of the string lights
  const ptitles = titles.map(({ ph, n }, k) => { const q = new FrameLayer(new THREE.CanvasTexture(ph.cv), TT.s, TT.s, { res: kit.res, z: 5 });
    q.place(TT.x0 + k * (TT.s + TT.gap), TT.y0); kit.scene.add(q); return { ph, q, n }; });
  const sbsH = 40; const psbs = new FrameLayer(new THREE.CanvasTexture(sbs.canvas), sbsH * sbs.w / sbs.h, sbsH, { res: kit.res, z: 5 });
  psbs.place(TT.x0 + (4 * TT.s + 3 * TT.gap) / 2 - (sbsH * sbs.w / sbs.h) / 2, TT.y0 + TT.s + 10); psbs.soft = 0.015; kit.scene.add(psbs);
  // (v4 M3) the opening's pencil (pencil01: the approved still's yellow pencil, tip-anchored) writes the dedication
  const wpen = await kit.layer('pencil01', { z: 9, anchor: PL.pencil01.tip }), wshadow = await kit.shadow('pencil01', 8);
  wpen.visible = wshadow.visible = false;
  const DL = PL.ded11, WP = { ang: PL.pencil01.angle_deg, y: DL.y + DL.h * 0.56, soft: 0.015 };
  const pband = new WipeBand(kit.res, { rainbow: true, z: 10 }); kit.scene.add(pband);
  // credits: the left column under the title, one block per beat after the stamp (same text as CREDITS)
  const CR = { x0: 58, y0: 612, lh: 30, gap: 10, maxW: 520 };
  let cy0 = CR.y0;
  const crT = [CREDITS[0], CREDITS[2], CREDITS[1], CREDITS[3], CREDITS[4]].map((c) => handText(c.text, { size: 64, lineGap: 1.25 }));
  const crK = Math.min(CR.lh / 80, ...crT.map((t) => CR.maxW / t.w));   // one size for every credit line
  const pcredits = crT.map((t) => {
    const size = 64, k = crK; const q = new FrameLayer(new THREE.CanvasTexture(t.canvas), t.w * k, t.h * k, { res: kit.res, z: 5 });
    q.place(CR.x0 - size * 0.2 * k, cy0); q.soft = 0.015; kit.scene.add(q); cy0 += t.h * k - size * 0.3 * k + CR.gap; return q;
  });
  // the next page's paper to the right of the page's edge (it slides in from the left while it settles: no spread sliver)
  const pedge = new FrameLayer(imgTex(await loadImg(`${TEX}page_edge${H <= 540 ? '_half' : ''}.jpg`)), 600, 1080, { res: kit.res, z: 0 }); pedge.place(1920, 0); kit.scene.add(pedge);
  const pageLayers = [pg, pedge, cap11a, cap11b, ded11, stamp11, psbs, ...ptitles.map((x) => x.q), ...pcredits];
  const pageCam = (cx, cy, h) => [(cx - h * asp / 2 - PM.bx) / PM.ax, (cx + h * asp / 2 - PM.bx) / PM.ax, -(PM.by - (cy + h / 2)) / PM.ay, -(PM.by - (cy - h / 2)) / PM.ay];
  const setPageCam = (b) => { kit.cam.left = b[0]; kit.cam.right = b[1]; kit.cam.top = b[2]; kit.cam.bottom = b[3]; kit.cam.updateProjectionMatrix(); };
  const PAGE_NATIVE = [0, 1920, 0, -1080];

  // ---- (v4) subtitles: the ONE lyric style (SmoothSubs, bottom centre), not a handwritten slip
  const uiScene = new THREE.Scene(); const uiCam = new THREE.OrthographicCamera(0, W, H, 0, -1, 1);
  const smooth = new SmoothSubs(W, H); smooth.mesh.renderOrder = 20; uiScene.add(smooth.mesh);
  const subIds = [49, 48];   // (v4 M3) later line first, so line 48's 0.5 s hold doesn't delay '(that\'s it.)' (191.95)
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
        const v = T.span(t, OUT.push[0], OUT.push[1], T.ease.inOut);       // (v4 Pass B) into the 2011 page
        const c1 = [close[0] + (full[0] - close[0]) * u, close[1] + (full[1] - close[1]) * u, close[2] + (full[2] - close[2]) * u];
        const c2 = [c1[0] + (PUSH.cx - c1[0]) * v, c1[1] + (PUSH.cy - c1[1]) * v, c1[2] + (PUSH.h - c1[2]) * v]; camSet(...c2);
        // the page rides on the spread's left page through the wipe, then settles into its own frame
        const b0 = pageCam(...c2), w = T.span(t, OUT.wipe[1], OUT.wipe[1] + OUT.settle, T.ease.inOut);
        setPageCam(b0.map((x, i) => x + (PAGE_NATIVE[i] - x) * w));
      } else {
        const u = T.span(t, OUT.last, 207, T.ease.linear);
        camSet(full[0], full[1] - 0.004 * u, 1.0 - 0.018 * u);   // a breath of a push, so it is a moment, not a frozen frame
        const z = 1 - 0.016 * u; setPageCam([960 - 960 * z, 960 + 960 * z, -540 + 540 * z + 6 * u, -540 - 540 * z + 6 * u]);   // (v4 Pass B) the same breath on the page
      }
      paper.material.uniforms.uWarm.value = isLast ? 0 : 1 - T.span(t, OUT.thats, OUT.thats + 2);
      for (const { seq, m } of living) { m.material.uniforms.uWarm.value = paper.material.uniforms.uWarm.value; m.material.uniforms.map.value = seq.time(Math.max(0, t - OUT.o0) * seq.duration / (194.31 - OUT.o0));
        m.material.uniforms.uOp.value = 1 - T.span(t, OUT.pulse, OUT.pulse + 0.84, T.ease.inOut); m.visible = m.material.uniforms.uOp.value > 0.001; }   // (v4) settles into the still before the 198.035 cut
      // ---------------- flower: stem 187.0-188.8, bloom on "blossoms"
      const grow = isLast ? 1 : T.span(t, OUT.o0 + 0.3, OUT.blossoms - 0.3, T.ease.out);
      const bloom = isLast ? 1 : T.span(t, OUT.blossoms, OUT.blossoms + 0.9, T.ease.back);
      const sway = Math.sin(t * 1.3) * 0.15 * (1 - 0.4 * T.span(t, OUT.pulse, OUT.last));   // (v4) one continuous page across the 198.035 cut
      const k = `${grow.toFixed(3)}|${bloom.toFixed(3)}|${sway.toFixed(3)}`;
      if (k !== fkey) { drawFlower(fcv, grow, bloom, sway); flower.refresh(); fkey = k; }
      // ---------------- captions
      capL.visible = capR.visible = false;   // (v4 Pass B) the end-card lines live on the page (#11) now
      // ---------------- last screen elements
      // (v4 Pass B) the credits moved to the page (pcredits, left column, one per beat after the stamp)
      credits.forEach((q) => { q.visible = false; });
      { const C = OUT.cred; pcredits.forEach((q, i) => { q.visible = isLast; q.reveal = T.span(t, C.t0 + C.step * i, C.t0 + C.step * i + C.dur); }); }   // (v4 M3) after the title, not under the chops
      titles.forEach(({ q }) => { q.visible = false; });   // (v4 Pass B) the title is drawn on the page (ptitles)
      ptitles.forEach(({ ph, q, n }, k) => {
        q.visible = isLast;
        if (!isLast) return;
        const c0 = OUT.chops[k], dur = k === 1 ? 0.42 : k === 3 ? 0.5 : 0.18;
        const prog = []; for (let i = 0; i < n; i++) prog.push(T.span(t, c0 + dur * i / n, c0 + dur * (i + 1) / n));
        if (ph.draw(prog)) q.material.uniforms.map.value.needsUpdate = true;
      });
      sbsQ.visible = ded.visible = stamp.visible = false;   // (v4 Pass B) on the page now
      psbs.visible = isLast; psbs.reveal = T.span(t, OUT.sbs[0], OUT.sbs[1]);
      ded11.visible = isLast; ded11.reveal = T.span(t, OUT.ded[0], OUT.ded[1]);
      cap11a.reveal = T.span(t, OUT.capA[0], OUT.capA[1]); cap11b.reveal = T.span(t, OUT.capB[0], OUT.capB[1]);
      stamp11.visible = isLast;
      if (isLast) { const s = T.since(t, OUT.last); const sc = s < 0 ? 0 : [1.55, 1.22, 1.06, 0.98, 1.0][Math.min(4, Math.floor(s * 30))]; stamp11.scale.setScalar(sc); }
      // the page arrives behind the rainbow edge (outro entry), then it is the whole picture
      const pw = isLast ? 1 : T.span(t, OUT.wipe[0], OUT.wipe[1], T.ease.inOut);
      for (const q of pageLayers) q.wipe(pw < 1 ? pw : -1, -1);
      pband.wipe = isLast || t < OUT.wipe[0] ? -1 : pw; pband.visible = !isLast && pw > 0 && pw < 1;
      // (v4 M3) the pencil writes the dedication: in along its own axis (198.25 -> 198.471), the tip rides the reveal edge
      // with a small handwriting bob (198.471 -> 199.10), then it lifts back out along its axis (the opening's exit)
      pencil.visible = false;
      { const D = OUT.ded, inL = 1600 * Math.pow(1 - T.span(t, OUT.pen.in, D[0], T.ease.out), 1.7), outL = 1600 * Math.pow(T.span(t, D[1] + 0.02, OUT.pen.out), 1.7);
        const L = Math.max(inL, outL), on = isLast && t >= OUT.pen.in && L < 1500, writing = t >= D[0] && t < D[1] + 0.02;
        wpen.visible = wshadow.visible = on;
        if (on) {
          const r = T.span(t, D[0], D[1]), edge = r * (1 + 2 * WP.soft) - 1.6 * WP.soft;                 // the ink's leading edge (LAYER_FS)
          const bob = writing ? Math.sin(t * 2 * Math.PI * 7.5) * 9 + Math.sin(t * 2 * Math.PI * 3.1 + 1) * 4 : 0, wob = writing ? Math.sin(t * 50) * 0.35 : 0;
          const a = WP.ang * Math.PI / 180, x = DL.x + DL.w * edge, y = WP.y + bob;
          const tip = [x - Math.cos(a) * L, y - Math.sin(a) * L];
          wpen.place(tip[0], tip[1], WP.ang + wob); wshadow.set(tip, WP.ang + wob, L); wshadow.material.uniforms.uOp.value = 0.3 * (1 - T.span(L, 0, 900));
        } }
      fly.visible = false;   // (v4 Pass B) the firefly lamp doodle belonged to the spread's last screen (retired)
      if (fly.visible) { const ph = ((t - 201.3) % 1.7) / 1.7; fly.material.uniforms.uOn.value = Math.pow(Math.sin(Math.PI * Math.min(1, ph / 0.55)), 2); }
      { const bb = T.beatsIn(OUT.last - 0.02, 203, 1);
        for (const d of doodles) { d.q.visible = false; continue;   // (v4 Pass B) retired with the spread's last screen
          const p = T.span(t, bb[d.beat], bb[d.beat] + 1.3); const k = p.toFixed(3);
          if (k !== d.key) { drawDoodle(d.cv, d.name, p, d.name === 'lamp' ? 5 : 9); d.q.refresh(); d.key = k; } } }
      // ---------------- subtitles (outro only): the one style
      let sc = null; if (!isLast) for (const id of subIds) { const c = subtitleFor(t, id, { hold: 0.5 }); if (c) { sc = c; break; } }
      smooth.set(sc);
    },
    render(t, target) {
      const r = ctx.renderer;
      const wiping = wipe && wipe.dive && t < AER.paper + AER.paperWipe;
      const onPage = isLast || t >= T.snap(OUT.wipe[1] + OUT.settle);   // (v4 Pass B) from here (settled) the page is the whole picture
      r.setRenderTarget(wiping ? wipe.rt : target); r.setClearColor(0xefe6d2, 1); r.clear();
      if (!onPage) r.render(scene, cam);
      r.autoClear = false;
      if (onPage || t >= OUT.wipe[0]) kit.render(r, wiping ? wipe.rt : target);
      r.setRenderTarget(wiping ? wipe.rt : target); r.render(uiScene, uiCam); r.autoClear = true;
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
