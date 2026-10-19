// ACT V · the party's route as a Mario-style WORLD MAP over the 一笔一画 landscape (docs/game_design_acts3-5.md, drop 2 ★)
//   174.85-175.35  the dotted path draws itself along the four characters in stroke order (一 → 笔 → 一 → 画), a little
//                  flag pops up at each place the party played: the causeway (一), the crossing (笔), the stage (一),
//                  the vantage point (画). NINE tiny dots march along the first 一: Jade, Charlie, Ricky, the pink Eraser
//                  (beige cap), lamp, glider, wheel, bridge, button, each in its main colour, hopping on the beat.
//   175.5-176.6    the subdivision wave eats the map: each path dot / flag turns into a pixel and is gone when the wave
//                  reaches it (same progress field as drop2.js WAVE_FS). The nine party dots SURVIVE: they are composited
//                  crisp over the photoreal (resolve clip, then the sweep clip, tracked per frame by
//                  media/act5/_work/track_sweep.py -> frames/sweep/track.json), until they leave frame (fade 179.75-180.15).
// Drawn on a 2D canvas at output resolution, composited after the scene. Pure function of t.
//   const R = await makeRoute(ctx);  R.draw(t, { toScreen, wave });  R.render(renderer, target)
//   toScreen(refUV:[u,v] y-down) -> [px, py] (y-down) or null; refUV = the locked aerial camera's frame (AERIAL_CAM).
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import * as T from '../../show/timing.js';
import { loadHanzi } from '../../hanzi.js';
import { loadFonts } from '../../core/text.js';

// the locked aerial camera (= drop2.js AERIAL_CAM; duplicated so aerial.js can use the route without importing drop2)
export const REF_CAM = { pos: [0, 1850, 240], target: [0, 0, -10], fov: 35, aspect: 16 / 9 };
const GL = { k: 0.47, xs: [-705, -235, 235, 705], z: 0, top: 70 };            // = world5.js GLYPH (glyph placement)
export const ROUTE_T = { draw0: 174.85, draw1: 175.35, out0: 179.75, out1: 180.15 };

/** the party, marching order (leader first): main colour + optional second colour (cap / band) */
export const PARTY = [
  { id: 'jade', c: '#f5f3ef', b: '#ff7a1a', band: 'mid' },     // white racer jacket, orange stripe
  { id: 'charlie', c: '#3c3c42', b: '#cdae74', band: 'cap' },  // dark tee, beige flat cap
  { id: 'ricky', c: '#5b8fd6', b: '#f2f4f8', band: 'mid' },    // blue striped shirt
  { id: 'eraser', c: '#f2788f', b: '#cdae74', band: 'cap' },   // the pink Eraser wearing Charlie's spare (beige) cap
  { id: 'lamp', c: '#ffe45c', glow: true },
  { id: 'glider', c: '#f2e4c4', b: '#8a5a36', band: 'mid' },   // moth-cream wing, brown band
  { id: 'wheel', c: '#17b2a6', b: '#22313a', band: 'ring' },
  { id: 'bridge', c: '#5cb83a' },
  { id: 'button', c: '#e3342b', b: '#1c1719', band: 'dot' },
];
// route: the stroke it follows in each character (global stroke index; 一=0, 笔=1..10, 一=11, 画=12..19)
// 笔: its last stroke (the 乚 hook, long and running right, toward the next 一); 画: its first stroke (the top 一 = the high ground)
const ROUTE_STROKES = [{ g: 0, s: 0, gs: 0 }, { g: 1, s: 9, gs: 10 }, { g: 2, s: 0, gs: 11 }, { g: 3, s: 0, gs: 12 }];
const FLAGS = [{ name: 'CAUSEWAY', at: 0.80 }, { name: 'CROSSING', at: 0.62 }, { name: 'STAGE', at: 0.5 }, { name: 'VANTAGE', at: 0.85 }];

// ---------------------------------------------------------------------------------------------- geometry (ref-cam uv)
let _geom = null;
/** world point -> ref uv (y down) through the locked aerial camera */
export function refCam() {
  const c = new THREE.PerspectiveCamera(REF_CAM.fov, REF_CAM.aspect, 37, 11400);
  c.position.set(...REF_CAM.pos); c.up.set(0, 1, 0); c.lookAt(new THREE.Vector3(...REF_CAM.target)); c.updateMatrixWorld(); c.updateProjectionMatrix();
  return c;
}
const projUV = (cam, p) => { const v = p.clone().project(cam); return [(v.x + 1) / 2, (1 - v.y) / 2, v.z]; };
const mm2w = (g, x, y) => new THREE.Vector3(GL.xs[g] + (x - 512) * GL.k, GL.top, GL.z - (y - 388) * GL.k);

/** world-space route: { pts: [{p, gs}] sampled every `step` world units, flags: [{p, gs, name, s}], yi: [a, b] (the first 一) } */
export async function routeGeom(step = 13) {
  if (_geom) return _geom;
  const datas = await Promise.all(['一', '笔', '一', '画'].map((c) => loadHanzi(c)));
  const legs = ROUTE_STROKES.map(({ g, s, gs }) => ({ gs, poly: datas[g].medians[s].map(([x, y]) => mm2w(g, x, y)) }));
  // the full polyline: leg 0, connector, leg 1, ... (connectors are off-glyph: gs = -1)
  const segs = [];
  legs.forEach((L, i) => {
    if (i > 0) segs.push({ gs: -1, poly: [legs[i - 1].poly[legs[i - 1].poly.length - 1], L.poly[0]] });
    segs.push(L);
  });
  const pts = []; const flags = [];
  let acc = 0;
  for (const sg of segs) {
    const P = sg.poly; let segLen = 0; for (let i = 1; i < P.length; i++) segLen += P[i].distanceTo(P[i - 1]);
    let d = (step - (acc % step)) % step;      // carry the spacing across segments
    let i = 1, run = 0;
    const startAcc = acc;
    while (d <= segLen + 1e-6) {
      while (i < P.length - 1 && run + P[i].distanceTo(P[i - 1]) < d) { run += P[i].distanceTo(P[i - 1]); i++; }
      const a = P[i - 1], b = P[i]; const L = a.distanceTo(b) || 1; const u = Math.min(1, (d - run) / L);
      pts.push({ p: a.clone().lerp(b, u), gs: sg.gs, s: startAcc + d });
      d += step;
    }
    acc += segLen;
    const fi = ROUTE_STROKES.findIndex((r) => r.gs === sg.gs);
    if (fi >= 0) {   // the flag on this leg
      const want = FLAGS[fi].at * segLen; let r2 = 0;
      for (let k = 1; k < P.length; k++) { const L = P[k].distanceTo(P[k - 1]); if (r2 + L >= want) { flags.push({ p: P[k - 1].clone().lerp(P[k], (want - r2) / L), gs: sg.gs, name: FLAGS[fi].name, s: startAcc + want }); break; } r2 += L; }
    }
  }
  const yi = legs[0].poly;
  _geom = { pts, flags, yi: [yi[0], yi[yi.length - 1]], total: acc };
  return _geom;
}

// ---------------------------------------------------------------------------------------------- the wave field (= drop2 WAVE_FS prog)
/** suv: screen uv of the VOXEL frame (x right, y UP) at the locked camera; gs: stroke under it or -1 */
export function waveProg(suvx, suvy, gs) {
  const qx = suvx, qy = 1 - suvy; let p = 0.78 * qx + 0.22 * qy;
  if (gs >= 0) p = 0.45 * p + 0.55 * (0.04 + 0.92 * gs / 19);
  return p;
}

// ---------------------------------------------------------------------------------------------- drawing
export async function makeRoute(ctx) {
  await loadFonts(['px']);
  const W = ctx.width, H = ctx.height, s = H / 1080;
  const G = await routeGeom();
  const cam = refCam();
  const ref = { pts: G.pts.map((q) => projUV(cam, q.p)), flags: G.flags.map((f) => projUV(cam, f.p)), yi: G.yi.map((p) => projUV(cam, p)) };
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace; tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const quad = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { map: { value: tex } }, transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,   // canvas pixels are premultiplied on upload below
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: 'uniform sampler2D map; varying vec2 vUv; void main(){ vec4 c = texture2D(map, vUv); gl_FragColor = c; }',
  }));
  tex.premultiplyAlpha = true;
  let drawn = false;

  const disc = (x, y, r, fill, line, lw) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); if (line) { g.lineWidth = lw; g.strokeStyle = line; g.stroke(); } };

  function pathDot(x, y, k, dis) {
    // dis: 0 intact .. 1 gone (the wave: round dot -> one pixel-grid square -> nothing)
    if (dis >= 1 || k <= 0) return;
    const r = 3.3 * s * k;
    if (dis <= 0) { disc(x, y + 1.2 * s, r, 'rgba(40,26,14,0.45)'); disc(x, y, r, '#f8e6a8', '#3a2a17', 1.3 * s); return; }
    const q = Math.max(1, Math.round(8 * s * (1 - dis)));
    g.globalAlpha = 1 - dis; g.fillStyle = '#f8e6a8'; g.fillRect(Math.round(x - q / 2), Math.round(y - q / 2), q, q); g.globalAlpha = 1;
  }
  function flag(x, y, k, dis, name, t) {
    if (dis >= 1 || k <= 0) return;
    const a = 1 - Math.max(0, dis);
    g.save(); g.globalAlpha = a; g.translate(x, y);
    if (dis > 0) { const q = Math.round(14 * s * (1 - dis)); g.fillStyle = '#ffd23f'; g.fillRect(-q / 2, -q / 2 - 8 * s, q, q); g.restore(); return; }
    const sc = k; g.scale(sc, sc);
    // level node (cleared: gold), pole, red pennant waving
    disc(0, 1.5 * s, 7.2 * s, 'rgba(40,26,14,0.45)');
    disc(0, 0, 6.6 * s, '#ffd23f', '#3a2a17', 1.6 * s);
    disc(-1.6 * s, -1.6 * s, 2.0 * s, '#fff3b0');
    g.fillStyle = '#2a2018'; g.fillRect(-1.1 * s, -26 * s, 2.2 * s, 26 * s);
    const wv = Math.sin(t * 9 + x * 0.01) * 1.6 * s;
    g.beginPath(); g.moveTo(1.1 * s, -26 * s); g.quadraticCurveTo(8 * s, -23.5 * s + wv, 15 * s, -21 * s + wv * 1.4); g.quadraticCurveTo(8 * s, -18.5 * s + wv, 1.1 * s, -16 * s); g.closePath();
    g.fillStyle = '#e3342b'; g.fill(); g.lineWidth = 1.3 * s; g.strokeStyle = '#3a1210'; g.stroke();
    disc(0, -27 * s, 2 * s, '#ffd23f', '#3a2a17', 1 * s);
    // label plate
    const fs = Math.round(8 * s) * 1; g.font = `${Math.max(8, Math.round(9 * s))}px "PressStart2P"`; g.textAlign = 'center'; g.textBaseline = 'top';
    const tw = g.measureText(name).width; const px = 3 * s, py = 2.5 * s, ty = 10 * s;
    g.fillStyle = 'rgba(16,20,44,0.86)'; g.fillRect(-tw / 2 - px, ty - py, tw + 2 * px, Math.max(8, Math.round(9 * s)) + 2 * py);
    g.strokeStyle = '#f2f2f2'; g.lineWidth = 1 * s; g.strokeRect(-tw / 2 - px, ty - py, tw + 2 * px, Math.max(8, Math.round(9 * s)) + 2 * py);
    g.fillStyle = '#ffffff'; g.fillText(name, 0, ty); void fs;
    g.restore();
  }
  function member(x, y, m, a) {
    const r = 6.4 * s; g.globalAlpha = a;
    if (m.glow) { const gr = g.createRadialGradient(x, y, 0, x, y, r * 3.2); gr.addColorStop(0, 'rgba(255,236,120,0.75)'); gr.addColorStop(1, 'rgba(255,236,120,0)'); g.fillStyle = gr; g.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4); }
    disc(x, y + 1.4 * s, r + 0.6 * s, 'rgba(20,14,8,0.5)');
    disc(x, y, r, m.c);
    if (m.band) {
      g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip(); g.fillStyle = m.b;
      if (m.band === 'cap') g.fillRect(x - r, y - r, 2 * r, r * 0.85);
      else if (m.band === 'mid') g.fillRect(x - r, y - r * 0.28, 2 * r, r * 0.56);
      else if (m.band === 'ring') { g.lineWidth = 1.6 * s; g.strokeStyle = m.b; g.beginPath(); g.arc(x, y, r * 0.45, 0, Math.PI * 2); g.stroke(); }
      else if (m.band === 'dot') { disc(x - r * 0.35, y + r * 0.2, r * 0.22, m.b); disc(x + r * 0.4, y - r * 0.15, r * 0.22, m.b); }
      g.restore();
    }
    g.lineWidth = 1.5 * s; g.strokeStyle = '#17110c'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    disc(x - r * 0.38, y - r * 0.42, r * 0.22, 'rgba(255,255,255,0.85)');
    g.globalAlpha = 1;
  }

  /** the nine dots' ref uv at t (along the first 一, leader first) + their hop (px at 1080p) */
  function partyAt(t) {
    const out = [];
    const u0 = 0.6 + 0.052 * (t - 175.0);              // leader position along the 一 (0..1)
    const gap = 0.05;                                    // spacing along the 一
    const bp = T.beatAt(t);
    PARTY.forEach((m, i) => {
      const u = u0 - i * gap; const ph = bp - i * 0.12; const f = ph - Math.floor(ph);
      const wob = 3.5 * Math.sin(i * 2.1);   // a loose line, not a ruler
      const p = G.yi[0].clone().lerp(G.yi[1], u); p.z += wob;
      out.push({ m, p, uv: projUV(cam, p), hop: Math.sin(Math.PI * Math.min(1, f / 0.42)) * (f < 0.42 ? 1 : 0) });
    });
    return out;
  }

  return {
    ref, geom: G,
    /** opts.toScreen(refUV, worldPoint) -> [x, y] px (y down) | null; opts.wave: { F, suv(refUV)->[x,y up] } | null; opts.map: false hides the map */
    draw(t, { toScreen, wave = null, map = true, party = true } = {}) {
      g.clearRect(0, 0, W, H); drawn = false;
      if (t < ROUTE_T.draw0 || t >= ROUTE_T.out1) return;
      const rev = T.span(t, ROUTE_T.draw0, ROUTE_T.draw1);         // reveal along the route (arc length)
      const sRev = rev * G.total;
      const dis = (uv, gs) => { if (!wave) return 0; const [x, y] = wave.suv(uv); const d = waveProg(x, y, gs) - wave.F; return T.clamp01((0.05 - d) / 0.06); };
      if (map && globalThis.ROUTE_MAP_V3 === true) {   // (v4) drop 2 = a clear frame: no world-map path / flags / labels (the party dots stay: they ARE the heroes)
        G.pts.forEach((q, i) => {
          const k = T.clamp01((sRev - q.s) / 30); if (k <= 0) return;
          const sp = toScreen(ref.pts[i], q.p); if (!sp) return;
          pathDot(sp[0], sp[1], k < 1 ? 0.5 + 0.7 * k : 1, dis(ref.pts[i], q.gs));
        });
        G.flags.forEach((f, i) => {
          const k = T.clamp01((sRev - f.s) / 40); if (k <= 0) return;
          const sp = toScreen(ref.flags[i], f.p); if (!sp) return;
          const pop = k < 1 ? T.ease.back(k) : 1;
          flag(sp[0], sp[1], pop, dis(ref.flags[i], f.gs), f.name, t);
        });
      }
      if (party) {
        const a = Math.min(T.span(t, ROUTE_T.draw0, ROUTE_T.draw0 + 0.25), 1 - T.span(t, ROUTE_T.out0, ROUTE_T.out1));
        const P = partyAt(t);
        for (let i = P.length - 1; i >= 0; i--) { const sp = toScreen(P[i].uv, P[i].p); if (!sp) continue; member(sp[0], sp[1] - P[i].hop * 3.2 * s, P[i].m, a); }
      }
      drawn = true; tex.needsUpdate = true;
    },
    render(r, target) { if (!drawn) return; r.setRenderTarget(target); const ac = r.autoClear; r.autoClear = false; quad.render(r); r.autoClear = ac; },
  };
}
