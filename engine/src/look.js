// Opt-in LOOK presets (render.js --look k08b), toward keyframes/concepts/k08b_coop_crossing.png (+ k09 / k08 for colour).
// Round 4 (world_look): the look is now mostly in the WORLD (src/scenes/act3/world/k08b.js + paint.js K8 material model:
// sandstone, terracotta, teal, voxel grass, PCSS soft shadows, hero rim; env.js k08b sky). This file keeps the parts that
// belong in post, all inside one HDR pass in Post._chain (after atmosphere, before DOF / bloom), perspective cameras only:
//   - the time-of-day table (TOD / todAt / applyTod): sky, sun, fill, rim, fog colours per song time (script: golden hour in
//     Act III, dusk from 123.18, afterglow at the 139.70 slam, sunset in the rebuilt world, Act V's own day)
//   - volumetric light: height fog over the sea + sun shafts, ray-marched through the world's sun shadow map
//   - anamorphic streaks on the brightest pixels (beams, sun glints), a light key/fill split tone, vignette and grain
// Gate: only for song time t >= H2_T0 (86.385, read from envUniforms.uTime, which every 3D scene sets) so half 1 (incl.
// the 3D turn) renders exactly as without the flag. Without --look this module is never instantiated.
//
// Round 5 (look_r5): the LOOK_R5 diorama preset, a layer on top of k08b behind render.js --r5 (LOOKCFG.r5), for
// 86.385 <= t < 173.02 only: tilt-shift DOF (48-tap gather, 12 px, a screen band), a two-colour grade target per range
// (sand + sky / paper + one accent: off-pair chroma is desaturated toward the pair, the pair also drives the key/fill split
// tone), a re-graded dusk, stronger key-to-fill and hero rim (k08b.js), the sunbeam per shot, column density (r5cols.js).
// Per-shot overrides: r5Shot({...}) from a scene's frame(t), or look: LOOK({ r5: {...} }). API: checkpoints/look_r5.md.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { SKY_GLSL, envUniforms, LOOKCFG, H2_T0, K8U } from './env.js';
import { makeDofMat } from './post.js';
import { CS } from './core/colorscript.js';

export const LOOKS = {
  k08b: {
    warm: 0.22,          // residual re-tint of low-saturation surfaces (the world is sandstone now; this only unifies stray props)
    sand: [1.50, 0.90, 0.52],
    split: 0.22,         // key/fill split toning strength
    key: [1.06, 1.01, 0.90], fill: [0.90, 0.96, 1.10],
    rays: 0.45, bloom: 0.38, vignette: 0.30, grain: 0.03, sat: 1.13, contrast: 1.04, grade: 1,
    streak: 0.10, streakThr: 3.2,
  },
};

// ------------------------------------------------------------------ time of day (linear colours)
const v = (r, g, b) => [r, g, b];
export const TOD_PRESETS = {
  // m3 grading (coordinator): dusty lilac -> peach -> pale gold skies (never royal/magenta), high key, light cool-blue shadows
  golden: {   // Act III: low golden sun (k08b)
    sunElev: 13, expo: 1.45, lift: 0.07,
    zen: v(0.26, 0.22, 0.40), hi: v(0.44, 0.32, 0.46), midSun: v(0.95, 0.46, 0.27), midAway: v(0.62, 0.40, 0.48), hzSun: v(1.25, 0.84, 0.42), hzAway: v(0.86, 0.64, 0.58),
    cloudLit: v(1.30, 0.92, 0.70), cloudShade: v(0.48, 0.40, 0.56), cloudCov: 0.5, sunCol: v(1.0, 0.70, 0.40), halo: 0.8,
    sunLight: v(1.0, 0.80, 0.56), sunGain: 1.2, hemiSky: v(0.62, 0.74, 1.05), hemiGround: v(0.86, 0.75, 0.60), hemiGain: 1.05, envGain: 0.42,
    rim: 0.6, rimCol: v(1.0, 0.78, 0.52), skyRim: v(0.55, 0.65, 1.0),
    fogCol: v(0.95, 0.88, 0.82), fogDens: 0.0016, fogFall: 0.011, haze: 0.000016, shaft: 0.5, fogAmb: 0.55, fogStart: 500,
  },
  dusk: {     // Act IV bridge: the sun on the horizon, deeper but soft (123.18 ->)
    sunElev: 3.5, expo: 1.15, lift: 0.06,
    zen: v(0.11, 0.10, 0.17), hi: v(0.24, 0.17, 0.27), midSun: v(0.75, 0.30, 0.19), midAway: v(0.38, 0.26, 0.31), hzSun: v(1.05, 0.44, 0.15), hzAway: v(0.48, 0.26, 0.29),
    cloudLit: v(1.05, 0.58, 0.45), cloudShade: v(0.26, 0.20, 0.32), cloudCov: 0.5, sunCol: v(1.0, 0.52, 0.26), halo: 0.9,
    sunLight: v(1.0, 0.62, 0.38), sunGain: 0.95, hemiSky: v(0.56, 0.62, 0.86), hemiGround: v(0.70, 0.58, 0.48), hemiGain: 1.0, envGain: 0.42,
    rim: 1.2, rimCol: v(1.0, 0.58, 0.34), skyRim: v(0.45, 0.52, 1.0),
    fogCol: v(0.62, 0.55, 0.62), fogDens: 0.0016, fogFall: 0.011, haze: 0.000016, shaft: 1.0, fogAmb: 0.7, fogStart: 500,
  },
  afterglow: { // the 139.70 slam: colour pours back, the low sun flares warm
    sunElev: 5.5, expo: 1.3, lift: 0.06,
    zen: v(0.17, 0.15, 0.27), hi: v(0.34, 0.24, 0.36), midSun: v(0.90, 0.38, 0.22), midAway: v(0.48, 0.30, 0.38), hzSun: v(1.25, 0.64, 0.25), hzAway: v(0.70, 0.46, 0.44),
    cloudLit: v(1.25, 0.80, 0.60), cloudShade: v(0.38, 0.30, 0.44), cloudCov: 0.5, sunCol: v(1.0, 0.62, 0.32), halo: 1.0,
    sunLight: v(1.0, 0.74, 0.50), sunGain: 1.1, hemiSky: v(0.56, 0.66, 1.0), hemiGround: v(0.80, 0.66, 0.52), hemiGain: 1.0, envGain: 0.45,
    rim: 1.1, rimCol: v(1.0, 0.68, 0.42), skyRim: v(0.5, 0.6, 1.0),
    fogCol: v(0.82, 0.72, 0.72), fogDens: 0.0016, fogFall: 0.011, haze: 0.000016, shaft: 1.0, fogAmb: 0.6, fogStart: 500,
  },
  sunset: {   // the rebuilt world and the cart (149.2 -> 173): a soft sunset, not purple
    sunElev: 7.5, expo: 1.35, lift: 0.06,
    zen: v(0.24, 0.21, 0.32), hi: v(0.42, 0.30, 0.40), midSun: v(0.90, 0.42, 0.24), midAway: v(0.60, 0.42, 0.44), hzSun: v(1.20, 0.68, 0.30), hzAway: v(0.76, 0.52, 0.50),
    cloudLit: v(1.25, 0.84, 0.64), cloudShade: v(0.42, 0.34, 0.48), cloudCov: 0.5, sunCol: v(1.0, 0.64, 0.34), halo: 0.9,
    sunLight: v(1.0, 0.76, 0.54), sunGain: 1.1, hemiSky: v(0.58, 0.70, 1.02), hemiGround: v(0.82, 0.70, 0.56), hemiGain: 1.0, envGain: 0.45,
    rim: 1.0, rimCol: v(1.0, 0.70, 0.45), skyRim: v(0.52, 0.62, 1.0),
    fogCol: v(0.86, 0.76, 0.74), fogDens: 0.0016, fogFall: 0.011, haze: 0.000016, shaft: 0.9, fogAmb: 0.6, fogStart: 500,
  },
};
/** [t, preset] keys; the look blends linearly between neighbouring keys (holds before the first / after the last) */
export const TOD = [
  [H2_T0, 'golden'], [123.18, 'golden'], [124.9, 'dusk'],       // 123.18 是一幅画: dusk while the Eraser rises
  [139.70, 'dusk'], [140.4, 'afterglow'], [149.22, 'afterglow'], // 139.70 FULL SLAM: colour pours back
  [151.0, 'sunset'], [173.02, 'sunset'],                         // the rebuilt world
];
/** Act V (173.02 ->) keeps its own sky and light (world5's high sun); only the grade / lens apply there */
export const K8_SKY_END = 173.02;

// ------------------------------------------------------------------ round 5: LOOK_R5 (behind --r5, a layer on k08b)
/** the preset applies for 86.385 <= t < R5_T1 (Act V keeps its own look) */
export const R5_T1 = 173.02;
/** is the r5 preset on for song time t: the flag + the k08b look + the time gate */
export const r5On = (t) => !!LOOKCFG.r5 && LOOKCFG.k08b && t >= H2_T0 - 1e-6 && t < R5_T1;
/** per-range defaults (what a scene gets for free); every field can be overridden per shot with r5Shot() */
export const R5_RANGES = [
  // Talos rooms: sand + lilac sky; hero columns per room (everything else registered in r5cols.js is culled)
  [86.385, 94.204, { dof: 0.7, tilt: 0.4, pair: ['#f0cf9a', '#8a7fb8'], pairAmt: 0.7, columns: { keep: ['A4', 'A5', 'C88a'] } }],
  [94.204, 101.0, { dof: 0.7, tilt: 0.4, pair: ['#f0cf9a', '#8a7fb8'], pairAmt: 0.7, columns: { keep: ['A4', 'C101', 'M2'] } }],
  [101.0, 107.15, { dof: 0.7, tilt: 0.4, pair: ['#f0cf9a', '#8a7fb8'], pairAmt: 0.7, columns: { keep: ['M1', 'M2', 'C101'] } }],
  [107.15, 119.02, { dof: 0.55, tilt: 0.3, pair: ['#f0cf9a', '#7d6cb0'], pairAmt: 0.7, columns: { keep: ['R0', 'R1', 'C108'] } }],   // the stage + rap (k08): sand + purple
  [119.02, 123.354, { dof: 0.45, tilt: 0.2, pair: ['#f0cf9a', '#7d6cb0'], pairAmt: 0.0, columns: { keep: ['R0', 'R1', 'C108'] } }],   // the flood / wave / recruit: the colour is the point
  // Act IV: paper + one accent; the sun flare (god rays, halo, streaks) off where the camera looks into the sun
  [123.354, 129.34, { dof: 0.4, tilt: 0.2, pair: ['#efe2d2', '#e8905a'], pairAmt: 0.75, columns: { keep: ['R0', 'R1', 'M1'] }, skyGain: 1.3, lift: 0.12, hemiGain: 1.3, protectSat: 1.6 }],   // the Eraser rises: luminous dusk sky behind the silhouette, the band's backs lifted
  [129.34, 135.6, { dof: 0.4, tilt: 0.2, pair: ['#efe2d2', '#e8905a'], pairAmt: 0.75, columns: { keep: ['R0', 'R1', 'M1'] }, protectSat: 1.6 }],                 // the erased world: the colour shards stay saturated over the paper
  [135.6, 143.48, { dof: 0.3, tilt: 0, pair: ['#efe2d2', '#e8905a'], pairAmt: 0.75, columns: { keep: ['R0', 'R1', 'M1'] }, flare: 0, beam: 0, protectL: 0.9, protectSat: 1.6 }],   // the lock: no flare behind the glyph, the glyph sharp and saturated (act4_r5 sets focus on it)
  [143.48, 149.22, { dof: 0.5, tilt: 0.2, pair: ['#efe2d2', '#f0b060'], pairAmt: 0.75, columns: { keep: ['R0', 'R1', 'M1'] }, protectL: 0.9, protectSat: 1.6 }],
  [149.22, 154.26, { dof: 0.55, tilt: 0.3, pair: ['#f3e4c8', '#4f9fb0'], pairAmt: 0.65, columns: { keep: ['R0', 'M1', 'M2'] } }],   // the rebuilt world: cream + teal-blue
  [154.26, 160.83, { dof: 0.55, tilt: 0.3, pair: ['#f3e4c8', '#4f9fb0'], pairAmt: 0.65, columns: { keep: ['R0', 'M1', 'M2'] }, flare: 0, beam: 0 }],   // the swarm wide: no flare dead centre
  [160.83, R5_T1, { dof: 0.55, tilt: 0.3, pair: ['#f3e4c8', '#4f9fb0'], pairAmt: 0.65, columns: { keep: ['R0', 'M1', 'M2'] } }],    // the cart, 99 %, the speedrun
];
export const R5_DEFAULTS = { dofMaxPx: 24, tilt: 0, rim: 1.4, vignette: 0.34, grain: 0.03, sunGain: 1.1, hemiGain: 0.9, flare: 1, protectL: 2.0, protectSat: 2.2, skyGain: 1, warm: 0.45 };
export function r5At(t) { for (const [a, b, o] of R5_RANGES) if (t >= a && t < b) return o; return R5_RANGES[R5_RANGES.length - 1][2]; }
/** the dusk re-grade (the 124.6 foreground was dark and muddy): brighter, warmer bounce, lighter fog */
export const R5_TOD = {
  dusk: { expo: 1.32, lift: 0.08, fogCol: v(0.80, 0.70, 0.74), fogAmb: 0.5, hemiSky: v(0.60, 0.66, 0.90), hemiGround: v(0.84, 0.68, 0.54), hemiGain: 1.15, envGain: 0.48 },
};
let SHOT = null, FOCUS_PT = null;
/** the frame's focus point (Vector3, world) from the scene's shot (set by k08b.js post()); the tilt band centres on it */
export function r5SetFocusPoint(v) { FOCUS_PT = v && v.isVector3 ? v : null; }
/** per-shot override for THIS frame's render (merged over the range defaults; cleared after the frame's post.render).
 *  Fields: dof, focus (distance | Vector3), dofMaxPx, tilt, keyElev, keyAz, keyTurn, rim, pair, pairAmt, protectL, protectSat, beam,
 *  flare, columns, zones, vignette, grain, lift, skyGain, sunGain, hemiGain, warm. See checkpoints/look_r5.md "API". Returns the merged shot object. */
export function r5Shot(o) { if (o) SHOT = Object.assign(SHOT || {}, o); return SHOT; }
export function r5ShotNow() { return SHOT; }
export function r5ShotClear() { SHOT = null; }
/** the resolved r5 settings for song time t: defaults < range < this frame's r5Shot() */
export function r5Frame(t) { return { ...R5_DEFAULTS, ...r5At(t), ...(SHOT || {}) }; }
/** '#rrggbb' or [r, g, b] (sRGB 0..1) -> linear [r, g, b] */
export function r5Lin(c) {
  if (typeof c === 'string') { const k = new THREE.Color(c); return [k.r, k.g, k.b]; }
  const f = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return [f(c[0]), f(c[1]), f(c[2])];
}

const _tod = {};
export function todAt(t) {
  let a = TOD[0], b = TOD[0];
  for (let i = 0; i < TOD.length; i++) { if (t >= TOD[i][0]) { a = TOD[i]; b = TOD[Math.min(i + 1, TOD.length - 1)]; } }
  const u = b[0] > a[0] ? Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))) : 0, s = u * u * (3 - 2 * u);
  const PR = (n) => (r5On(t) && R5_TOD[n] ? { ...TOD_PRESETS[n], ...R5_TOD[n] } : TOD_PRESETS[n]);   // --r5: re-graded presets
  const A = PR(a[1]), B = PR(b[1]);
  for (const k of Object.keys(A)) _tod[k] = Array.isArray(A[k]) ? A[k].map((x, i) => x + (B[k][i] - x) * s) : A[k] + (B[k] - A[k]) * s;
  _tod.key = a[1] + '>' + b[1] + ':' + s.toFixed(3) + (r5On(t) ? '|r5' : '');
  return _tod;
}
/** is the k08b look on at song time t (flag + second half) */
export const k8On = (t) => LOOKCFG.k08b && t >= H2_T0 - 1e-6;
/** push the sky uniforms for song time t (called by every perspective post.render via LookPass.begin, and by the world) */
export function applyTod(t) {
  const on = k8On(t) && t < K8_SKY_END; K8U.uK8.value = on ? 1 : 0;
  if (!on) return null;
  const P = todAt(t), set = (u, a) => u.value.set(a[0], a[1], a[2]);
  set(K8U.uK8Zen, P.zen); set(K8U.uK8Hi, P.hi); set(K8U.uK8MidSun, P.midSun); set(K8U.uK8MidAway, P.midAway); set(K8U.uK8HzSun, P.hzSun); set(K8U.uK8HzAway, P.hzAway);
  set(K8U.uK8CloudLit, P.cloudLit); set(K8U.uK8CloudShade, P.cloudShade); K8U.uK8CloudCov.value = P.cloudCov; set(K8U.uK8SunCol, P.sunCol); K8U.uK8Halo.value = P.halo;
  return P;
}

const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
const FS = '#include <packing>\n' + SKY_GLSL + /* glsl */`
  uniform sampler2D tColor, tDepth, tShadow, tScene; uniform mat4 uInvProj, uCamWorld, uShadowM; uniform vec3 uCamPos; uniform vec2 uRes;
  uniform float uFogStart, uOn, uWarm, uSplit, uShadowOn, uVolMax, uFogDens, uFogFall, uFogBase, uHaze, uShaft, uFogAmb, uStreak, uStreakThr;
  uniform vec3 uSand, uKey, uFill, uFogCol, uSunC;
  uniform float uPairOn, uPairAmt, uProtL, uProtSat, uSkyGain; uniform vec3 uPairA, uPairB;
  varying vec2 vUv;
  vec3 worldAt(vec2 uv, float d){ vec4 v = uInvProj * vec4(uv*2.0-1.0, d*2.0-1.0, 1.0); v /= v.w; return (uCamWorld * v).xyz; }
  float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
  float unpackD(vec4 v){ return unpackRGBAToDepth(v); }
  float sunLit(vec3 p){
    if (uShadowOn < 0.5) return 1.0;
    vec4 sc = uShadowM * vec4(p, 1.0); sc.xyz /= sc.w;
    if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0 || sc.z > 1.0) return 1.0;
    return step(sc.z - 0.0004, unpackD(texture2D(tShadow, sc.xy)));
  }
  vec3 safe(vec3 c){ return (any(isnan(c)) || any(isinf(c))) ? vec3(0.0) : c; }
  // --r5 two-colour grade: chroma aligned with pair colour A or B is kept, everything else is desaturated (and nudged)
  // toward the nearer of the two. Deliberate accents (strongly saturated: pencil caps, straps, the rainbow) and HDR
  // emissives (the beam, the glyph) are protected. skyK halves the effect on the sky (it keeps its own two-tone gradient).
  vec3 pairGrade(vec3 c, float skyK){
    float L = lum(c); vec3 ch = c - vec3(L); float m = length(ch); if (m < 1e-5 || L < 1e-5) return c;
    vec3 d = ch / m;
    vec3 ca = normalize(uPairA - vec3(lum(uPairA))), cb = normalize(uPairB - vec3(lum(uPairB)));
    float a = max(dot(d, ca), 0.0), b = max(dot(d, cb), 0.0);
    float al = max(a, b); al *= al;
    float keep = max(al, smoothstep(uProtSat, uProtSat * 1.5, m / L));
    float amt = uPairAmt * skyK * (1.0 - smoothstep(uProtL, uProtL * 1.6, L));
    vec3 tgt = a >= b ? ca : cb;
    vec3 d2 = normalize(mix(d, tgt, amt * 0.6 * (1.0 - keep)));
    return max(vec3(L) + d2 * m * mix(1.0 - amt, 1.0, keep), 0.0);
  }
  void main(){
    vec3 c = safe(texture2D(tColor, vUv).rgb);
    if (uOn < 0.5) { gl_FragColor = vec4(c, 1.0); return; }
    float d = texture2D(tDepth, vUv).x; bool sky = d >= 0.99999;
    vec3 wp = worldAt(vUv, sky ? 0.9999 : d); vec3 dv = wp - uCamPos; float dist = sky ? 1e7 : length(dv); vec3 rd = normalize(dv);
    float L = lum(c);
    if (!sky) {
      // residual warmth on low-saturation surfaces + key/fill split tone (lit warm, shade cool lavender)
      float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)); float sat = (mx - mn) / max(mx, 1e-4);
      float water = 1.0 - smoothstep(uFogBase + 2.0, uFogBase + 12.0, wp.y);
      c = mix(c, L * uSand, uWarm * (1.0 - smoothstep(0.10, 0.45, sat)) * (1.0 - water));
      if (uPairOn > 0.5) { float heroM = 1.0 - smoothstep(0.08, 0.2, abs(texture2D(tScene, vUv).a - 0.5)); c = mix(pairGrade(c, 1.0), c, heroM); }   // heroes / creatures (alpha 0.5 from paint.js) keep their painted colours
      float lit = smoothstep(0.04, 0.55, L / (1.0 + L));
      c *= mix(vec3(1.0), mix(uFill, uKey, lit), uSplit);
    } else { if (uPairOn > 0.5) c = pairGrade(c, 0.5); c *= uSkyGain; }
    // volumetric light: height fog thickest over the sea + sun shafts through the shadow map (fixed 40 steps, jittered)
    float mu = dot(rd, uSunDir);
    float g = 0.55; float hg = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * mu, 1.5) * 0.06;   // forward-scattering lobe (~1 at 90 deg)
    float Lm = min(dist, uVolMax); const int N = 40;
    float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float ds = Lm / float(N); float tr = 1.0; vec3 ins = vec3(0.0);
    vec3 amb = mix(skyBase(normalize(vec3(rd.x, max(rd.y, 0.0) * 0.25 + 0.015, rd.z))), uFogCol, 0.25) * uFogAmb; vec3 sunS = uSunC * uShaft * hg;
    for (int i = 0; i < N; i++) {
      vec3 p = uCamPos + rd * ((float(i) + jit) * ds);
      float s = (float(i) + jit) * ds; float hb = max(p.y - uFogBase, 0.0);
      float dens = (uFogDens * exp(-hb * uFogFall) + uHaze + uFogDens * 1.2 * exp(-hb * 0.06)) * smoothstep(uFogStart * 0.5, uFogStart * 3.0, s);   // + a thin sea mist; near water / near ground stay clear
      float od = dens * ds; float sl = sunLit(p);
      ins += tr * od * (amb + sunS * sl);
      tr *= exp(-od);
    }
    if (sky) { c = c * mix(1.0, tr, 0.5) + ins * 0.7; }   // the sky already carries its own haze: keep it bright
    else c = c * tr + ins;
    // anamorphic streaks on the brightest pixels (beams, glints)
    if (uStreak > 0.0) {
      vec3 st = vec3(0.0); float px = 5.0 / uRes.x * (uRes.y / 1080.0) * (uRes.x / uRes.y) / 1.7778;
      for (int k = -12; k <= 12; k++) { if (k == 0) continue; float fk = float(k);
        vec3 s = safe(texture2D(tColor, vUv + vec2(fk * px, 0.0)).rgb); float l = lum(s);
        st += s / max(l, 1e-4) * max(l - uStreakThr, 0.0) * exp(-abs(fk) * 0.22); }
      c += st * uStreak * vec3(0.95, 0.9, 1.1);
    }
    gl_FragColor = vec4(c, 1.0);
  }`;

export class LookPass {
  constructor(post, name) {
    // v4 colour script (src/core/colorscript.js): `--look k08b+cs` (or `+cs=warm`, the M1 alternative) = this look + the ration grade
    const [base, ...mods] = String(name).split('+'); name = base;
    const cs = mods.find((m) => /^cs(=|$)/.test(m));
    if (cs) { CS.variant = cs.split('=')[1] || 'default'; post.enableCS(); }
    const P = LOOKS[name]; if (!P) throw new Error('unknown look ' + name + ' (have: ' + Object.keys(LOOKS).join(', ') + ')');
    this.name = name; this.P = P;
    LOOKCFG.name = name; LOOKCFG.k08b = name === 'k08b';
    if (LOOKCFG.k08b) post.enableK8();
    const v3 = (a) => ({ value: new THREE.Vector3(...a) });
    this.mat = new THREE.ShaderMaterial({
      uniforms: { ...envUniforms, tColor: { value: null }, tDepth: { value: null }, tShadow: { value: null }, tScene: { value: null }, uShadowM: { value: new THREE.Matrix4() }, uShadowOn: { value: 0 },
        uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() }, uRes: { value: new THREE.Vector2(post.w, post.h) },
        uOn: { value: 0 }, uWarm: { value: P.warm }, uSplit: { value: P.split }, uSand: v3(P.sand), uKey: v3(P.key), uFill: v3(P.fill),
        uVolMax: { value: 2600 }, uFogStart: { value: 380 }, uLift: { value: 0 }, uFogDens: { value: 0.004 }, uFogFall: { value: 0.0085 }, uFogBase: { value: -200 }, uHaze: { value: 0.00005 },
        uShaft: { value: 1 }, uFogAmb: { value: 1 }, uFogCol: v3([0.7, 0.55, 0.8]), uSunC: v3([1, 0.6, 0.3]), uStreak: { value: P.streak }, uStreakThr: { value: P.streakThr },
        uPairOn: { value: 0 }, uPairAmt: { value: 0 }, uPairA: v3([1, 0.8, 0.55]), uPairB: v3([0.3, 0.25, 0.5]), uProtL: { value: 2 }, uProtSat: { value: 2.2 }, uSkyGain: { value: 1 } },
      vertexShader: VS, fragmentShader: FS, depthTest: false, depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.mat);
    this.fog = { scale: 1, shaft: 1 };   // per-frame multipliers a world may set (k08b.js), reset after each render
    this.r5 = null;                      // this frame's resolved LOOK_R5 settings (null when the preset is off)
  }
  /** before the chain: time of day + nudges of the scene's own post params; returns a restore function */
  begin(post, camera) {
    const t = envUniforms.uTime.value; this.on = k8On(t) || (!LOOKCFG.k08b);
    this.tod = applyTod(t);
    if (!this.on) return null;
    const p = post.params, F = post.finalMat.uniforms, P = this.P;
    const save = { rays: p.rays, bloom: p.bloom, v: F.uVignette.value, g: F.uGrain.value, s: F.uSat.value, c: F.uContrast.value, gr: F.uGrade.value };
    p.rays = Math.max(p.rays, P.rays); p.bloom = Math.max(p.bloom, P.bloom);
    F.uVignette.value = Math.max(F.uVignette.value, P.vignette); F.uGrain.value = Math.max(F.uGrain.value, P.grain);
    F.uSat.value *= P.sat; F.uContrast.value *= P.contrast; F.uGrade.value = Math.max(F.uGrade.value, P.grade);
    if (F.uK8Lift) F.uK8Lift.value = this.tod ? this.tod.lift : 0.04;
    const undoR5 = this._beginR5(post, camera, t);
    return () => { if (undoR5) undoR5(); if (F.uK8Lift) F.uK8Lift.value = 0; p.rays = save.rays; p.bloom = save.bloom; F.uVignette.value = save.v; F.uGrain.value = save.g; F.uSat.value = save.s; F.uContrast.value = save.c; F.uGrade.value = save.gr; };
  }
  /** --r5 (LOOK_R5): tilt-shift DOF, the two-colour grade, lens; everything restored after the frame's render */
  _beginR5(post, camera, t) {
    this.r5 = null; const U = this.mat.uniforms;
    if (!r5On(t)) { U.uPairOn.value = 0; return null; }
    const R = this.r5 = r5Frame(t), p = post.params, F = post.finalMat.uniforms, P = this.P;
    if (!post.dofMatR5) { post.dofMatR5 = makeDofMat(post.w, post.h, 64, true); post.dofQuadR5 = new FullScreenQuad(post.dofMatR5); }
    const save = { mat: post.dofMat, quad: post.dofQuad, dof: p.dof, focus: p.focus, v: F.uVignette.value, g: F.uGrain.value, rays: p.rays, halo: K8U.uK8Halo.value, streak: U.uStreak.value, warm: U.uWarm.value, lift: F.uK8Lift ? F.uK8Lift.value : 0 };
    // DOF: the 48-tap gather with the preset's aperture / radius; focus = the shot's own (distance from the camera), or the override
    post.dofMat = post.dofMatR5; post.dofQuad = post.dofQuadR5;
    const D = post.dofMatR5.uniforms, camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    p.dof = R.dof > 0 ? 2.2 * R.dof : 0;
    if (R.focus != null) p.focus = R.focus.isVector3 ? camPos.distanceTo(R.focus) : +R.focus;
    D.uMaxR.value = R.dofMaxPx * post.h / 1080; D.uTilt.value = R.tilt || 0; D.uProtL.value = R.protectL;
    let fy = 0.5; const fp = R.focus?.isVector3 ? R.focus : FOCUS_PT;
    if (R.tilt > 0 && fp) { const q = fp.clone().project(camera); if (Number.isFinite(q.y)) fy = Math.min(0.95, Math.max(0.05, q.y * 0.5 + 0.5)); }
    D.uTiltY.value = fy;
    // the flare (god rays, the sun's halo / disc, anamorphic streaks) per shot; warmth of low-saturation surfaces; sky gain; lifted blacks
    p.rays *= R.flare; K8U.uK8Halo.value *= R.flare; U.uStreak.value = P.streak * R.flare; U.uWarm.value = R.warm; U.uSkyGain.value = R.skyGain;
    U.uProtL.value = R.protectL; U.uProtSat.value = R.protectSat;
    if (F.uK8Lift && R.lift != null) F.uK8Lift.value = R.lift;
    // the two-colour grade: pair chroma kept, the pair also drives the split tone (A lit, B shade)
    const amt = R.pairAmt ?? 0, pair = R.pair || ['#f0cf9a', '#8a7fb8'];
    U.uPairOn.value = amt > 0 ? 1 : 0; U.uPairAmt.value = amt;
    const A = r5Lin(pair[0]), B = r5Lin(pair[1]); U.uPairA.value.set(A[0], A[1], A[2]); U.uPairB.value.set(B[0], B[1], B[2]);
    if (amt > 0) {
      const nl = (c) => { const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; return c.map((x) => Math.min(1.6, x / Math.max(l, 1e-4))); };
      const nA = nl(A), nB = nl(B);
      U.uKey.value.set(P.key[0] + (nA[0] - P.key[0]) * 0.5, P.key[1] + (nA[1] - P.key[1]) * 0.5, P.key[2] + (nA[2] - P.key[2]) * 0.5);
      U.uFill.value.set(P.fill[0] + (nB[0] - P.fill[0]) * 0.3, P.fill[1] + (nB[1] - P.fill[1]) * 0.3, P.fill[2] + (nB[2] - P.fill[2]) * 0.3);
    }
    F.uVignette.value = Math.max(F.uVignette.value, R.vignette); F.uGrain.value = Math.max(F.uGrain.value, R.grain);
    return () => { post.dofMat = save.mat; post.dofQuad = save.quad; p.dof = save.dof; p.focus = save.focus; F.uVignette.value = save.v; F.uGrain.value = save.g;
      p.rays = save.rays; K8U.uK8Halo.value = save.halo; U.uStreak.value = save.streak; U.uWarm.value = save.warm; U.uSkyGain.value = 1; if (F.uK8Lift) F.uK8Lift.value = save.lift;
      U.uKey.value.set(...P.key); U.uFill.value.set(...P.fill); U.uPairOn.value = 0; r5ShotClear(); FOCUS_PT = null; };
  }
  render(post, src, dst, camera, scene) {
    const U = this.mat.uniforms, r = post.r;
    U.uOn.value = this.on ? 1 : 0;
    U.tColor.value = src.texture; U.tDepth.value = post.rtScene.depthTexture; U.tScene.value = post.rtScene.texture;
    U.uInvProj.value.copy(camera.projectionMatrixInverse); U.uCamWorld.value.copy(camera.matrixWorld); U.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
    // volumetric light: only where this frame's scene owns a k08b sun with a fresh shadow map (the shared TALOS world)
    const sun = post.k8Sun, T = this.tod;
    const vol = !!(this.on && T && sun && scene && post.k8Scene === scene && sun.castShadow && sun.shadow.map);
    U.uShadowOn.value = vol ? 1 : 0;
    if (vol) { U.tShadow.value = sun.shadow.map.texture; U.uShadowM.value.copy(sun.shadow.matrix); }
    const f = this.fog;
    if (T) {
      U.uFogDens.value = T.fogDens * f.scale; U.uFogFall.value = T.fogFall; U.uHaze.value = T.haze * f.scale; U.uShaft.value = T.shaft * f.shaft; U.uFogAmb.value = T.fogAmb;
      U.uFogCol.value.set(...T.fogCol); U.uFogStart.value = T.fogStart; U.uSunC.value.set(T.sunCol[0] * 2.2, T.sunCol[1] * 2.2, T.sunCol[2] * 2.2);
    } else { U.uFogDens.value = 0; U.uHaze.value = 0; }   // Act V: grade + streaks only
    this.fog = { scale: 1, shaft: 1 };
    r.setRenderTarget(dst); this.quad.render(r);
  }
}
