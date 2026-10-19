// ACT III shared helpers: measured micro-cues, the 3D scene wrapper (post + UI overlay), smooth bilingual subtitles,
// camera helpers and hero locomotion. Everything is a pure function of song time t.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { subtitleFor } from '../../core/ui.js';
import { loadFonts } from '../../core/text.js';
import { makeLedger } from './paintlog.js';
import { r5Shot, r5ShotNow } from '../../look.js';

/** (v4b stage_3d) the DOF cap: look_r5's tilt-shift could blur up to 24 px (1080p) at the far plane / the tilt band, so the world
 *  went to mush behind the subject. Every Act III-IV frame now caps the blur RADIUS at DOF_CAP_PX (1080p; scaled with the output
 *  height by look.js), whatever the shot's dof / tilt: the subject stays the sharpest thing, the world still reads. */
export const DOF_CAP_PX = 8;
/** (v4b stage_3d, colour hooks H9-H12) exempt a material from the colour script's pre-flood graphite grade: it writes alpha 0.5 into
 *  the scene target (the mask core/colorscript.js reads; COLOR_REQUESTS.md "How a scene exempts something"). Opaque materials only
 *  (blended ones cannot carry the mask: name them + userData.cs instead). Chains any existing onBeforeCompile; idempotent. */
export function csTag(mat) {
  if (!mat || mat.userData.csTag || mat.transparent) return mat;
  if (mat.isShaderMaterial) return mat;   // custom shaders write their own alpha (see carved_slab.js)
  const prev = mat.onBeforeCompile; const prevKey = mat.customProgramCacheKey?.bind(mat);
  mat.onBeforeCompile = (sh, r) => { if (prev) prev.call(mat, sh, r); sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', '#include <opaque_fragment>\n  gl_FragColor.a = 0.5;   // (csTag)'); };
  mat.customProgramCacheKey = () => (prevKey ? prevKey() : '') + '|csTag';
  mat.userData.csTag = true; mat.needsUpdate = true; return mat;
}
export function csTagObject(o) { o.traverse((m) => { if (!m.isMesh) return; for (const x of [].concat(m.material || [])) csTag(x); }); return o; }
export function capDof() { const s = r5ShotNow(); if (!s || s.dofMaxPx == null || s.dofMaxPx > DOF_CAP_PX) r5Shot({ dofMaxPx: DOF_CAP_PX }); }

// Measured from the demucs stems (5 ms RMS envelopes, 2026-10-14, team B). Post-stop / accent transients land
// 30-80 ms after the timing.json grid; these are the transients.
export const CUE = {
  roll: [77.757, 77.895, 78.033, 78.17, 78.308, 78.446, 78.583, 78.721, 78.859, 78.996, 79.134, 79.272], // triplet grid (onsets within 30 ms)
  chant: [79.36, 79.536, 79.767, 80.309],     // 一 笔 一 画 (word onsets; accent 79.56)
  lastHit: 79.82, silence: [79.87, 80.805], impact: 80.815, b49: 81.058,
  whistle: [81.87, 82.93, 84.15, 85.19, 85.63],
  pairs: [82.265, 83.09, 85.56, 86.385, 88.86, 89.68],
  fixtures: 86.87, fixStop: [87.26, 87.83], answer: [88.48, 89.88],
  functions: 89.95, funStop: [90.375, 91.11],
  hey: [92.78, 93.25, 93.65],
  v2: 94.204, because: 100.12, linked: 101.0,
  stage: 107.15, stops: [107.615, 108.195, 108.835], stageHits: [108.08, 108.68, 109.28],
  rap: 110.41, eh: [112.33, 112.56, 112.78], rapAcc: [111.705, 112.515, 114.95, 118.175, 118.38, 121.405],
  sentence: 113.82, bug: 116.88, flood: 119.02, end: 123.354,
};

// ------------------------------------------------------------------ smooth subtitles (TALOS look: clean sans)
const FONT_STACK = 'InterVar, "Droid Sans Fallback", sans-serif';
export class SmoothSubs {
  constructor(width, height) {
    this.W = width; this.H = height; this.h = Math.round(height * 0.2);
    this.cv = document.createElement('canvas'); this.cv.width = width; this.cv.height = this.h;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.minFilter = THREE.LinearFilter;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, this.h), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false }));
    this.key = '';
  }
  /** c = subtitleFor() result, or null. (v4) ONE fixed slot, bottom centre: `pos` is ignored, and a line flagged
   *  hideTop / inWorld (its words are built into the world) shows NO subtitle (never a translation-only chip). */
  set(c, pos = 'bottom') {
    pos = 'bottom'; if (c && (c.hideTop || c.inWorld)) c = null;
    const key = c ? JSON.stringify([c.top, c.bot, c.hideTop, pos]) : '';
    this.mesh.visible = !!c;
    this.mesh.position.set(this.W / 2, pos === 'top' ? this.H - this.h / 2 - this.H * 0.02 : this.h / 2 + this.H * 0.03, 0);
    if (!c || key === this.key) return;
    this.key = key;
    const g = this.cv.getContext('2d'); g.clearRect(0, 0, this.W, this.h);
    const fsTop = Math.round(this.H * 0.052), fsBot = Math.round(this.H * 0.036);
    const top = c.hideTop || c.inWorld ? null : c.top; const bot = c.bot;
    g.textBaseline = 'alphabetic';
    let wTop = 0, wBot = 0;
    if (top) { g.font = `600 ${fsTop}px ${FONT_STACK}`; wTop = top.reduce((s, sp) => s + g.measureText(sp.text).width, 0); }
    if (bot) { g.font = `500 ${fsBot}px ${FONT_STACK}`; wBot = g.measureText(bot).width; }
    const bw = Math.max(wTop, wBot) + fsTop * 1.2, bh = (top ? fsTop * 1.25 : 0) + (bot ? fsBot * 1.35 : 0) + fsTop * 0.45;
    const bx = (this.W - bw) / 2, by = (pos === 'top' ? 0.05 * this.h : this.h - bh - 0.05 * this.h);
    g.fillStyle = 'rgba(13,16,34,0.55)'; const r = fsTop * 0.35;
    g.beginPath(); g.roundRect(bx, by, bw, bh, r); g.fill();
    let y = by + fsTop * 0.3;
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 4; g.shadowOffsetY = 2;
    if (top) {
      y += fsTop; g.font = `600 ${fsTop}px ${FONT_STACK}`; let x = (this.W - wTop) / 2;
      for (const sp of top) { g.fillStyle = sp.color === '#ffffff' || sp.color === '#fff' ? '#ffffff' : (sp.color || '#fff'); g.fillText(sp.text, x, y); x += g.measureText(sp.text).width; }
      y += fsTop * 0.25;
    }
    if (bot) { y += fsBot * 1.05; g.font = `500 ${fsBot}px ${FONT_STACK}`; g.fillStyle = '#d6e0ff'; g.fillText(bot, (this.W - wBot) / 2, y); }
    this.tex.needsUpdate = true;
  }
}

/** round 5 flag. DEFAULT ON since v4 (2026-10-18). Opt out for the pre-r5 (round 4) staging with render.js `--r5 0` -> `?r5=0`
 *  (or globalThis.R5 = false in dev). All r5 behaviour is gated by this. */
export function R5() { try { if (new URLSearchParams(globalThis.location?.search || '').get('r5') === '0') return false; } catch (e) { /* no location */ } return globalThis.R5 !== false; }

/** lyric line ids sung inside Act III, in order */
export const ACT3_LINES = [18, 24, 25, 26, 27, 28, 30, 32, 33, 34];
export function currentSub(t, { inWorld = [] } = {}) {
  for (const id of ACT3_LINES) {
    const c = subtitleFor(t, id, { lit: '#ffd23f', unlit: '#ffffff', hold: 0.25 });
    if (c) return inWorld.includes(id) ? null : c;   // (v4) in-world line: no subtitle
  }
  return null;
}

// ------------------------------------------------------------------ 3D scene wrapper
/**
 * make3D(ctx, W, { update(t) -> { camera, look, target, focus, shadowExtent, virtFov }, ui })
 * Renders the world with the post chain, then the overlay (subtitles; optional 2D UI scene).
 */
export async function make3D(ctx, W, { frame, subs = true, subPos, inWorldSubs = [] }) {
  await loadFonts(['sans']);
  const { renderer, post, width, height } = ctx;
  const ui = new THREE.Scene(); const uiCam = new THREE.OrthographicCamera(0, width, height, 0, -10, 10);
  const smooth = new SmoothSubs(width, height); ui.add(smooth.mesh);
  const fx = { flash: 0, flashColor: '#ffffff', fade: 0, fadeColor: '#000000' };
  let cur = null;
  W.ledger ||= makeLedger(W);
  return {
    stage: { kind: '3d', fx, beginFrame() { fx.flash = 0; fx.fade = 0; } },
    W, ui, uiCam, smooth,
    update(t) {
      W.reset();
      W.ledger(t);
      cur = frame(t, fx);
      W.applyLook(t, cur.look, cur);
      capDof();   // (v4b stage_3d) after the shot's own look.r5 has been forwarded
      if (subs) smooth.set(cur.noSubs ? null : currentSub(t, { inWorld: inWorldSubs }), (typeof subPos === 'function' ? subPos(t) : subPos) || cur.subPos || 'bottom');
      else smooth.set(null);
    },
    render(t, target) {
      post.render(W.scene, cur.camera, target);
      renderer.autoClear = false; renderer.setRenderTarget(target); renderer.clearDepth();
      if (cur.ui2d) renderer.render(cur.ui2d.scene, cur.ui2d.cam);
      renderer.render(ui, uiCam); renderer.autoClear = true;
    },
  };
}

// ------------------------------------------------------------------ cameras
const _cams = new Map();
export function persp(key, aspect) { if (!_cams.has(key)) _cams.set(key, new THREE.PerspectiveCamera(40, aspect, 1, 120000)); return _cams.get(key); }
export function aim(cam, pos, target, fov, roll = 0) {
  cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(target);
  if (roll) cam.rotateZ(roll * Math.PI / 180);
  cam.fov = fov; cam.near = Math.max(0.5, pos.distanceTo(target) * 0.02); cam.far = 120000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  return cam;
}
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
/** Catmull-Rom through keyframes [[t, Vector3], ...] (clamped), eased per segment */
export function pathAt(t, keys) {
  if (t <= keys[0][0]) return keys[0][1].clone();
  if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1].clone();
  let i = 0; while (t > keys[i + 1][0]) i++;
  const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]);
  const p0 = keys[Math.max(0, i - 1)][1], p1 = keys[i][1], p2 = keys[i + 1][1], p3 = keys[Math.min(keys.length - 1, i + 2)][1];
  const u2 = u * u, u3 = u2 * u;
  return new THREE.Vector3().addScaledVector(p0, -0.5 * u3 + u2 - 0.5 * u).addScaledVector(p1, 1.5 * u3 - 2.5 * u2 + 1)
    .addScaledVector(p2, -1.5 * u3 + 2 * u2 + 0.5 * u).addScaledVector(p3, 0.5 * u3 - 0.5 * u2);
}
/** pick the shot active at t from [[t0, fn], ...] */
export function shotAt(t, shots) { let s = shots[0]; for (const x of shots) if (t >= T.snap(x[0]) - 1e-6) s = x; return s; }

// ------------------------------------------------------------------ heroes
/** beat-locked run frame for a 6-frame strip (or 2-frame for Jade's hair-down run) */
export const runFrame = (t, n = 6, perBeat = 3) => Math.floor(T.beatAt(t) * perBeat + 1e-6) % n;
/** a jump arc from (x0,y0) at ta to (x1,y1) at tb with apex height above the higher end */
export function arc(t, ta, tb, x0, y0, x1, y1, apex) {
  const u = Math.max(0, Math.min(1, (t - ta) / (tb - ta)));
  const top = Math.max(y0, y1) + apex; // parabola through 3 points
  const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (2 * top - (y0 + y1) / 2) + u * u * y1;
  return { x: x0 + (x1 - x0) * u, y, u, rising: u < 0.5 };
}
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
/** crisp golden hour (v8): half the haze and only in the far distance, deeper AO/contact shadows, warm key + cool shadows,
 *  hand-coloured objects lifted as accents. Spread into every Act III look (LOOK() and the turn's look). */
export const CRISP = { heroFill: 0.42, heroRim: 0.55, fill: 0.95, atmos: 0.5, hazeStart: 650, envInt: 0.55, hemiLo: 0.3, sunWarm: 1, coolShadows: 1, contrast: 1.13, aoRadius: 11, aoScale: 1.8, accent: 1.3 };
export const LOOK = (o = {}) => ({ flat: 0, light: 1, shadow: 1, tone: 1, palette: 0, pix: 1, outline: 0, bloom: 1, dof: 1, grade: 1, rays: 0.3, ao: 1, dofAmount: 0.25, ...CRISP, ...o, atmos: CRISP.atmos * (o.atmos ?? 1) });

/** turn voxel sprites partly toward the camera (k = fraction of the horizontal angle, capped) so thin sprites read in 3D */
export function faceCam(groups, camPos, k = 0.6, cap = 55) {
  for (const g of groups) {
    if (!g.visible) continue;
    const ang = Math.atan2(camPos.x - g.position.x, camPos.z - g.position.z);
    const c = cap * Math.PI / 180; g.rotation.y = Math.max(-c, Math.min(c, ang * k));
  }
}
