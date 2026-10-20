// ACT I · 0:00-4.19 · COLD OPEN: "the level draws itself under her feet" (the Twitter hook).
//  0.00  first frame already moving: the graphite pencil (pink cap = FIXTURES) sketches a guide line
//  0.21-0.343  the pencil slashes 一 in 4 frames; Jade (hair UP) drops in and lands ON the kick (0.343): dust + 2px shake
//  whistle notes (measured 0.91 / 1.35 / 1.78 / 2.63): each draws the next character in true stroke order a split
//  second before her foot needs it: 笔 (staircase: lands stroke 7 on beat 1.199, stroke 4 on beat 1.627),
//  一 (long leap, lands on the bar-2 downbeat 2.054), 画 (strokes 0-6 on note 3, the closing stroke 7 on note 4,
//  she lands on top of it on the held note 2.63)
//  2.63-3.35  camera pulls back 2x -> 1x: the title 一笔一画; pinyin pops in; the gloss types on
//  3.763  bar-3 hit: 1-frame flash, FREEZE (scene time held) through the gap to 4.19
// (v4 Pass B, open_close) THE 2011 PAGE (approved still #01) opens the video, drawn over the level until the first whistle:
//  0.00   the sketchbook page (graphite, Charlie alone), the dedication `For every partial project in a drawer.` over the slate `a song about product management (2011)` (v4.3 order);
//         frame 0 = the approved still (the autoplay / thumbnail frame): the yellow pencil mid-stroke on the floor line
//  0.00-0.21  the pencil draws on; 0.21-0.343 it SLASHES the rest of the 一 and stops on the kick (page nudge)
//  0.343-0.85 the pencil lifts off up and out along its own axis (the shadow lets go of the page)
//  0.85-2.909 the page HOLDS through the whistle hook (a slow 3.5 % push-in): slate + dedication read for ~2.9 s
//         (coordinator M1 call: the reason for the video is clear by second 3)
//  2.909-3.336 (beat 6 -> beat 7) the page becomes Level 1: a graphite pencil edge wipes it away left -> right; the title
//         一笔一画 (drawn stroke by stroke on the whistle notes under the page) is waiting there with its pinyin
//  3.12-3.763 Jade drops in: lands on 一 on beat 7 (3.336), hops to 笔 on the 8th (3.549), lands on 画 on the bar-3 hit
//         (3.763: flash + FREEZE through 4.19 as before). Her v3 route (kick landing, 2x follow cam) is retired.
import * as T from '../../show/timing.js';
import { Stage2D, Z, ZUI } from '../../core/stage2d.js';
import { PAL } from '../../core/palette.js';
import { PaperBG, Batch, dust, shake } from '../../core/fx.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { Actor } from '../../core/sprites.js';
import { Track, smoothFollow } from '../../core/choreo.js';
import { TextSprite } from '../../core/text.js';
import { Pencil } from '../../core/props.js';
import { TITLE, buildTitle, PencilRig, act1Atlas, speedLines } from './common.js';
import { mulberry32 } from '../../util.js';
import { pageKit, WipeBand, FrameLayer, WIPE_GLSL, TEX, loadImg, imgTex, loadJSON } from '../act5/paperkit.js';
import * as THREE from 'three';

// (v4.5, v45_open) Charlie strums on the 2011 page. null = v4.4 (static page). Variants (engine/checkpoints/v45_open.md):
//   'strum'  forearm + wrist strum only (smaller swing)
//   'groove' a fuller strum + Charlie nods his head on the beats
export const STRUM_V45 = 'groove';
const STRUM_VARIANTS = {
  strum: { elbow: 4.0, wrist: 7.0, nod: 0 },
  groove: { elbow: 6.0, wrist: 10.0, nod: 2.4 },
};

export async function setup(ctx) {
  const C = (k) => T.cue('act1.' + k);
  // discrete visual events land on the frame nearest the measured time (T.snap)
  const KICK = T.snap(C('first_kick')), N = C('whistle_notes').map(T.snap), HIT = C('bar3_hit');
  const B = (n) => T.snap(T.beat(n));
  const st = new Stage2D(ctx, { bg: PAL.paper });
  const bg = st.add(new PaperBG(), Z.BG);
  const { hz, py } = await buildTitle(st);
  const [h0, h1, h2, h3] = hz;
  // light sketch guide under the first stroke (the very first frame is already a pencil in motion)
  const sketch = await Hanzi2D.create('一', { size: TITLE.size, style: 'solid', shadow: false }); sketch.place(TITLE.xs[0], TITLE.y0 - 1);
  sketch.u.uColor.value.set(PAL.g4); sketch.u.uTipAmt.value = 0; st.add(sketch.group, Z.PLATFORM - 1);

  // ---------------------------------------------------------------- drawing plans (true stroke order)
  sketch.plan(0, 0.30, { ease: (u) => u * 0.55 });
  h0.plan(0.21, KICK);
  h1.plan(N[0], N[0] + 0.27, { gap: 0.1 });
  h2.plan(N[1], N[1] + 0.1);
  h3.plan(N[2], N[2] + 0.5, { strokes: [0, 1, 2, 3, 4, 5, 6], gap: 0.1 });
  h3.plan(N[3] - 0.1, N[3] - 0.01, { strokes: [7] });
  const pencil = st.add(new Pencil({ kind: 'graphite', len: 60 }), Z.FRONT);
  const rig = new PencilRig(pencil, [{ h: sketch, k: 0 }, { h: h0, k: 0 }, { h: h1, k: 0 }, { h: h2, k: 0 }, { h: h3, k: 0 }, { h: h3, k: 1 }], { lift: 16, angle: -30, exit: [372, 230, 0.45] });

  // ---------------------------------------------------------------- Jade's route (landings computed from the glyphs)
  const mid = (h, s) => { const b = h.strokeBox(s); return Math.round((b.x0 + b.x1) / 2); };
  const top = (h, s, x) => h.strokeTopAt(s, x);
  const L1 = [TITLE.xs[0] + 14, null]; L1[1] = top(h0, 0, L1[0]);
  const g0 = (x) => top(h0, 0, Math.max(TITLE.xs[0] + 8, Math.min(TITLE.xs[0] + 56, x))) ?? L1[1];
  const b7 = h1.strokeBox(7), b4 = h1.strokeBox(4), b0 = h3.strokeBox(0);
  const L2x = b7.x0 + 8, L2 = [L2x, top(h1, 7, L2x)];
  const L3x = Math.round((b4.x0 + b4.x1) / 2), L3 = [L3x, top(h1, 4, L3x)];
  const L4x = TITLE.xs[2] + 22, L4 = [L4x, top(h2, 0, L4x)];
  const g2 = (x) => top(h2, 0, Math.max(TITLE.xs[2] + 8, Math.min(TITLE.xs[2] + 56, x))) ?? L4[1];
  const L5x = mid(h3, 0) + 2, L5 = [L5x, top(h3, 0, L5x)];
  // (v4 Pass B) Jade's first jumps start after the page's wipe: 一 on beat 7, 笔 on its 8th, 画 on the bar-3 hit
  void g0; void g2; void L2; void L4;
  const J1 = T.snap(T.beat(7)), J2 = T.snap((T.beat(7) + T.beat(8)) / 2);
  const tr = new Track({ x: L1[0], y: 205, anim: 'jump' })
    .hold(0, J1 - 0.22, { anim: 'jump' })
    .fall(J1 - 0.22, J1, L1[1], { x: L1[0], land: 'idle' })
    .hold(J1, J1 + 0.04, { anim: 'idle' })
    .jump(J1 + 0.04, J2, L3[0], L3[1], { apex: 14 })
    .jump(J2 + 0.02, HIT, L5[0], L5[1], { apex: 16 })
    .hold(HIT, 10, { anim: 'victory' });
  const jade = st.add(new Actor(ctx.lib, 'jade', { name: 'jade' }), Z.ACTOR);
  const landings = [J1, J2, HIT];

  // ---------------------------------------------------------------- type
  const gloss = st.addUI(new TextSprite({ spans: [
    { text: '"stroke by stroke"', color: PAL.capBlueLo }, { text: ': how every kid learns\nto write Chinese. And how you vibe code.', color: PAL.g0 }],
  font: 'fp12', align: 'center', lineGap: 3 }, { anchor: 'bc' }), ZUI.SUBS);
  const glossLen = gloss.r.chars.length;
  const atlas = act1Atlas(ctx.lib); const batch = st.add(new Batch(atlas), Z.FX);
  const crumbs = mulberry32(5);
  const crumbSeeds = [...Array(64)].map(() => [crumbs() * 2 - 1, crumbs()]);

  // ---------------------------------------------------------------- (v4 Pass B) the 2011 page over the level
  const kit = await pageKit(ctx), PL = kit.lay;
  const page = await kit.page('page01', 0);
  const yi = await kit.layer('yi01', { z: 3 }); yi.soft = 0.004;
  const ded = await kit.layer('ded01', { z: 4 });
  const pShadow = await kit.shadow('pencil01', 6);
  const pen = await kit.layer('pencil01', { z: 9, anchor: PL.pencil01.tip });
  const slate = await kit.layer('slate01', { z: 12 });
  const band = new WipeBand(kit.res, { z: 10 }); kit.scene.add(band);
  const PG = { x0: PL.yi01.x, x1: PL.yi01.x + PL.yi01.w, y: PL.pencil01.tip_in_still[1], tip0: PL.pencil01.tip_in_still[0], ang: PL.pencil01.angle_deg,
    W0: T.snap(T.beat(6)), W1: T.snap(T.beat(7)) };   // the wipe: beat 6 (2.909) -> beat 7 (3.336)
  const pageAt = (t) => {
    // tip x along the floor line: 0-0.21 draw on (from the still's mid-stroke), 0.21-KICK the slash to the end, then lift-off
    const xs = PG.x1 - 2, xm = PG.tip0 + 50;
    const x = t < 0.21 ? PG.tip0 + (xm - PG.tip0) * (t / 0.21) : xm + (xs - xm) * T.span(t, 0.21, KICK, T.ease.out);
    const L = 1600 * Math.pow(T.span(t, KICK + 0.03, 0.85), 1.7);        // lift: back along its own axis
    const a = PG.ang * Math.PI / 180;
    return { tip: [x - Math.cos(a) * L, PG.y - Math.sin(a) * L], lift: L, drawing: t < KICK + 0.03, reveal: (Math.min(x, xs) - PG.x0) / (PG.x1 - PG.x0) };
  };
  const pageState = { on: true, wipe: -1 };

  // ---------------------------------------------------------------- (v4.5, v45_open) Charlie strums while the page is up
  // Jade 10-19: "0:00 - can we animate some guitar strumming on Charlie, even here?" A 2D puppet cut from the page itself
  // (assets/v4_stills/tools/v45_open/build_strum.py): hole01 = the guitar redrawn under the forearm (NBP edit, ONLY inside the
  // forearm footprint) over the untouched page01, arm01 = the forearm + hand cut from page01. At rest page01 + hole01 + arm01 == page01,
  // so frame 0 is still the approved still. The forearm swings about the elbow (+ a lagging wrist) through the strings on
  // the song's 8th grid; the strokes that hit are the measured mid-band hits (see STRUM below), the rest are ghost strokes.
  const SV = STRUM_V45 && STRUM_VARIANTS[STRUM_V45];
  const strum = SV ? await strumRig(kit, page, SV) : null;

  return {
    stage: st,
    render(t, target) {
      const r = ctx.renderer;
      const covered = t < PG.W0;                                        // the page hides the level completely
      if (covered) { r.setRenderTarget(target); r.setClearColor(0xefe6d2, 1); r.clear(); }
      else {
        ctx.post.set2D({ pix: st.pix(ctx.height), palMix: st.look.palMix, dither: st.look.dither });
        if (st.look.palette) ctx.post.setPalette(st.look.palette);
        st.cam.apply(); ctx.post.render(st.scene, st.cam.cam, target);
        r.autoClear = false; r.setRenderTarget(target); r.clearDepth(); r.render(st.ui, st.uiCam); r.autoClear = true;
      }
      if (!pageState.on) return;
      r.autoClear = false; kit.render(r, target); r.autoClear = true;
    },
    update(t) {
      // ---- the 2011 page (frame px)
      pageState.on = t < PG.W1;
      if (pageState.on) {
        const p = pageAt(t), wob = p.drawing ? Math.sin(t * 50) * 0.35 : 0;
        const u = t < PG.W0 ? -1 : T.span(t, PG.W0, PG.W1, T.ease.inOut);
        const gone = u >= 1;
        page.visible = yi.visible = ded.visible = pShadow.visible = !gone; band.visible = u >= 0 && !gone;
        for (const q of [page, yi, ded, slate]) q.wipe(u); pShadow.wipe(u); band.wipe = u;
        if (strum) { strum.wipe(u); strum.visible(!gone); strum.apply(t); }   // (v4.5) Charlie strums
        yi.reveal = p.reveal;
        pen.visible = p.lift < 1500; pen.place(p.tip[0], p.tip[1], PG.ang + wob);
        pShadow.set(p.tip, PG.ang + wob, p.lift); pShadow.material.uniforms.uOp.value = 0.3 * (1 - T.span(p.lift, 0, 900));
        // a slow push-in while the page holds (about the slate / Charlie), + the 5 px nudge on the kick
        const z = 1 - 0.035 * T.span(t, KICK, PG.W1, T.ease.inOut), fx = 760, fy = 420;
        const sh = shake(t, [KICK], { amp: 5, dur: 0.16 });
        kit.cam.left = fx - fx * z - sh[0]; kit.cam.right = fx + (1920 - fx) * z - sh[0];
        kit.cam.top = -(fy - fy * z) + sh[1]; kit.cam.bottom = -(fy + (1080 - fy) * z) + sh[1]; kit.cam.updateProjectionMatrix();
      }
      const tt = Math.min(t, HIT); // FREEZE on the bar-3 hit through the gap
      // strokes
      for (const h of [sketch, ...hz]) h.apply(tt);
      // 笔 reads as a STAIRCASE: the two step strokes (7, then 4) stay solid, the rest recede while she climbs
      const dim = 0.6 * T.span(tt, N[0], N[0] + 0.2) * (1 - T.span(tt, N[3], N[3] + 0.5));
      for (let i = 0; i < h1.n; i++) h1.setDim(i, i === 7 || i === 4 ? 0 : dim);
      // landing flash on the stroke under her feet (3 frames)
      const hit = (L) => Math.max(0, 1 - (tt - L) * 10) * (tt >= L ? 1 : 0);
      h0.setHi(0, 0.8 * hit(J1)); h1.setHi(4, 0.8 * hit(J2)); h3.setHi(0, 0.8 * hit(HIT));
      sketch.alpha = 1 - T.span(tt, KICK, KICK + 0.25);
      // pencil
      rig.apply(tt);
      if (t < PG.W1) pencil.visible = false;   // (v4 Pass B) the page's pencil leads; the level's own pencil takes over after the wipe
      // Jade
      const s = tr.at(tt);
      jade.set({ ...s, pencil: false });
      // camera: (v4 Pass B) the title framing from the wipe on (the v3 2x follow + pull-back ran under the page); a nudge per landing
      void smoothFollow;
      const sh = shake(tt, [J1, J2], { amp: 1.4, dur: 0.16 });
      st.cam.set({ x: 160, y: 90, zoom: 1, shake: sh });
      bg.cover(st.cam);
      // pinyin pop-in during the pull-back
      py.forEach((p, k) => { const a = N[3] + 0.18 + 0.08 * k; p.visible = tt >= a; p.place(TITLE.xs[k] + TITLE.size / 2, TITLE.y0 - 15 + Math.round(4 * (1 - T.span(tt, a, a + 0.08)))); });
      // gloss: typed on, in the UI layer (fixed, crisp)
      const g0t = PG.W1, g1t = HIT - 0.05;   // (v4 Pass B) typed on once the page has gone
      gloss.visible = tt >= g0t; gloss.set({ reveal: Math.floor(glossLen * T.span(tt, g0t, g1t)) }); gloss.place(160, 14);
      // FX: dust on landings, speed lines while running/leaping, graphite crumbs off the pencil tip
      batch.begin();
      landings.forEach((L, i) => { const q = tr.at(L + 0.001); dust(batch, tt, L, q.x, q.y, { seed: i + 1, n: i === 0 ? 8 : 5, spread: i === 0 ? 16 : 10 }); });
      if ((s.anim === 'run' || s.air) && tt > J1 && tt < HIT) speedLines(batch, tt, s.x, s.y, 1);
      for (let k = 0; k < 10; k++) {
        const e = tt - k / 30; if (e < 0) break;
        const p = rig.at(e); if (!p.drawing) continue;
        const [r1, r2] = crumbSeeds[(Math.floor(e * 30) * 3 + k) % 64]; const age = tt - e;
        batch.draw(r2 > 0.5 ? 'crumb1' : 'px1', p.x + r1 * 4 + 10 * age, p.y - 40 * age * age * 6 + 2, { color: PAL.g1 });
      }
      batch.end();
      st.fx.flash = T.exactFrame(t, [HIT]) ? 0.85 : 0;
    },
  };
}

// ================================================================== (v4.5, v45_open) the strum puppet on the 2011 page
// Song hits (measured on the mix, 300-3000 Hz short "chk" transients; no guitar stem exists and the intro has no sustained guitar):
// 0.348 (kick) 0.998 1.207 1.637 1.846 2.072 2.276 2.490 (2.688 weak) 2.914 3.129 3.355. They all sit on the 8th grid
// (within 5-18 ms; the grid is drum-anchored), so the strokes cross the strings exactly on the grid 8ths c_k = beat(k/2):
// even k = downstroke on the beat, odd k = upstroke on the "and". S = how hard each crossing is (1 = a measured hit, 0.35 = a ghost stroke).
const STRUM_S = { '-1': 0.55, 0: 1, 1: 0.35, 2: 0.35, 3: 0.9, 4: 1, 5: 0.35, 6: 1, 7: 0.9, 8: 1, 9: 0.9, 10: 1, 11: 0.6, 12: 1, 13: 0.9, 14: 1, 15: 0.5 };
/** hand position through the strings at t: 0 = the drawn pose (on the strings), + = below (after a downstroke), - = above */
export function strumAt(t) {
  const c = (k) => T.beat(k / 2), s = (k) => STRUM_S[k] ?? 0.35;
  const k = Math.floor(T.beatAt(t) * 2); if (k < -1 || k > 15) return 0;
  const u = (t - c(k)) / (c(k + 1) - c(k)), K = 1.8;
  const p = ((s(k) + s(k + 1)) / 2) * Math.tanh(K * Math.sin(Math.PI * u)) / Math.tanh(K) * ((k & 1) ? -1 : 1);
  return p * T.span(t, 0.10, 0.30, T.ease.inOut);   // frame 0 = the still; the hand winds up for the first stroke on the kick
}
const PUP_VS = 'varying vec2 vF; void main(){ vF = vec2(position.x, -position.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const PUP_COMMON = /* glsl */`uniform float uOp, uWipe, uWipeDir; uniform vec2 uRes; varying vec2 vF;
  ${WIPE_GLSL}
  vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
  float wipeM(){ return uWipe >= 0.0 ? smoothstep(-0.004, 0.012, pw_d(gl_FragCoord.xy / uRes, uWipe) * uWipeDir) : 1.0; }`;
function pupMesh(box, uniforms, fs, res, z) {
  const [x0, y0, x1, y1] = box, g = new THREE.PlaneGeometry(x1 - x0, y1 - y0); g.translate((x0 + x1) / 2, -(y0 + y1) / 2, 0);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uOp: { value: 1 }, uWipe: { value: -1 }, uWipeDir: { value: 1 }, uRes: { value: res }, ...uniforms },
    transparent: true, depthTest: false, depthWrite: false, vertexShader: PUP_VS, fragmentShader: PUP_COMMON + fs }));
  m.renderOrder = z; m.frustumCulled = false; return m;
}
async function strumRig(kit, page, SV) {
  const L = await loadJSON(TEX + 'strum01.json'), A = L.arm01, H = L.head01, V2 = (p) => new THREE.Vector2(p[0], p[1]);
  const E = [A.x + A.elbow[0], A.y + A.elbow[1]], W = [A.x + A.wrist[0], A.y + A.wrist[1]], Hd = [A.x + A.hand[0], A.y + A.hand[1]];
  const ax = (a, b) => { const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d); return [d[0] / l, d[1] / l]; };
  const hole = new FrameLayer(imgTex(await loadImg(TEX + 'hole01.png')), A.w, A.h, { res: kit.res, z: 1 }).place(A.x, A.y); kit.scene.add(hole);
  const M = 30;   // room for the swing
  // the forearm: swings about the elbow (weight ramps in over the first ~25 px of forearm, so the elbow itself stays put),
  // then the hand turns about the wrist; inverse-mapped per pixel so the pencil lines bend, never tear
  const arm = pupMesh([A.x - M, A.y - M, A.x + A.w + M, A.y + A.h + M], {
    map: { value: imgTex(await loadImg(TEX + 'arm01.png')) }, uBox: { value: new THREE.Vector4(A.x, A.y, A.w, A.h) },
    uE: { value: V2(E) }, uW: { value: V2(W) }, uAxE: { value: V2(ax(E, Hd)) }, uAxW: { value: V2(ax(W, Hd)) }, uAE: { value: 0 }, uAW: { value: 0 } },
  /* glsl */`uniform sampler2D map; uniform vec4 uBox; uniform vec2 uE, uW, uAxE, uAxW; uniform float uAE, uAW;
    void main(){
      vec2 d = vF - uE; float w = smoothstep(-4.0, 22.0, dot(d, uAxE));
      vec2 q = uE + rot(d, -uAE * w);
      vec2 d2 = q - uW; float w2 = smoothstep(-14.0, 14.0, dot(d2, uAxW));
      q = uW + rot(d2, -uAW * w2);
      vec2 uv = (q - uBox.xy) / uBox.zw;
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
      vec4 c = texture2D(map, vec2(uv.x, 1.0 - uv.y));
      gl_FragColor = vec4(c.rgb, c.a * uOp * wipeM()); }`, kit.res, 2);
  kit.scene.add(arm);
  // the head nod ('groove'): an opaque patch of the page itself, rotated about the base of the neck inside the head ellipse,
  // weight 0 at the patch edge and below the neck (so it is the page, pixel for pixel, at rest and at its border)
  let head = null;
  if (SV.nod) {
    head = pupMesh(H.box, { map: { value: page.material.uniforms.map.value }, uP: { value: V2(H.pivot) }, uC: { value: V2(H.center) },
      uRad: { value: V2(H.radii) }, uFall: { value: H.fall }, uA: { value: 0 }, uDy: { value: 0 } },
    /* glsl */`uniform sampler2D map; uniform vec2 uP, uC, uRad; uniform float uFall, uA, uDy;
      void main(){
        vec2 e = (vF - uC) / uRad; float w = 1.0 - smoothstep(0.0, uFall, (length(e) - 1.0) * min(uRad.x, uRad.y));
        w *= 1.0 - smoothstep(uP.y - 22.0, uP.y + 6.0, vF.y);
        vec2 q = uP + rot(vF - uP, -uA * w) - vec2(0.0, uDy * w);
        vec4 c = texture2D(map, vec2(q.x / 1920.0, 1.0 - q.y / 1080.0));
        gl_FragColor = vec4(c.rgb, uOp * wipeM()); }`, kit.res, 1);
    kit.scene.add(head);
  }
  const D = Math.PI / 180, KICK = T.cue('act1.first_kick');
  return {
    apply(t) {
      const p = strumAt(t), pw = strumAt(t - 0.035);   // the hand trails the forearm a little (wrist whip)
      arm.material.uniforms.uAE.value = p * SV.elbow * D;
      arm.material.uniforms.uAW.value = pw * SV.wrist * D;
      if (head) {   // nods down into every other beat (the half-time kick/snare feel), from the kick on
        const ph = T.beatAt(t) / 2, dip = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * (ph - Math.floor(ph))), 2) * T.span(t, KICK, KICK + 0.5, T.ease.inOut);
        head.material.uniforms.uA.value = SV.nod * dip * D; head.material.uniforms.uDy.value = 1.2 * dip;
      }
    },
    wipe(u) { for (const m of [hole, arm, head]) if (m) m.material.uniforms.uWipe.value = u; },
    visible(v) { hole.visible = arm.visible = v; if (head) head.visible = v; },
  };
}
