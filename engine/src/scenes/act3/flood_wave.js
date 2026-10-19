// ACT III · 119.02 THE PAINT FLOOD, k09 version (flood_k09 unit, round 4; keyframe keyframes/concepts/k09_bug_dance_paint_flood.png).
// Opt-in: on with --look k08b (LOOKCFG.k08b); ?flood=old | k09 (or globalThis.FLOOD_STAGING) overrides. Without it battle.js
// runs the old flat ring + aerial, untouched.
//
// The wave is a VOLUME of coloured-pencil strokes, not a texture: four nested sheets of ribbon strokes laid along a curling
// profile (the k09 "C": it rises from the trough, crests, and throws its lip forward), swept along a spine.
//   HERO (119.02-120.135): the spine runs out from the pencil tip like a horn: tiny where the strokes leave the tip, growing to a
//     tall barrel at its far end, so looking down the barrel the colour bands (red at the pencil ... violet, pink at the far end)
//     nest as concentric C's, as in k09. The wave peels out along the spine and creeps forward (its lip side); behind it the
//     world is coloured.
//   RACE (120.135-121.405): the wave stands up as a ring around the pencil and races to the horizon, its lip thrown outward.
// Strokes flow up the face (each is "drawn" as it enters at the trough: leading-edge reveal) and break into paper-white voxel
// chips at the crest. Plus: a spray of short coloured strokes off the pencil tip, and floor streaks fanning from the tip to the
// trough. Everything is CPU geometry rebuilt per frame from t alone (pure function of t; no state carried between frames).
//
//   const FW = makeFloodWave(W, { centre, ground, psi, theta })   // once (cached on W)
//   FW.update(t, camera)                                          // per frame (hides itself outside the flood)
//   FW.state(t) -> { mode: 'hero' | 'race', s, L | R, H, curl, reveal, ... } | null
//   FW.frame(u, ws, out) -> trough point + travel direction + height at spine parameter u (0..1)
//   FW.surface(u, sigma, t) / FW.crest(u, t) / FW.trough(u, t)    riders + camera anchors (world Vector3)
//   FW.colour(x, z, t) -> 0..1                                    // colour amount behind the wave (for W.colorMap)
import * as THREE from 'three';
import { LOOKCFG } from '../../env.js';
import { mulberry32 } from '../../util.js';
import { tuftGeo, flowerGeo, VOX } from './world/k08b.js';   // (exported for this module: the k08b voxel grass / flowers)
import { patchPaint } from './world/paint.js';
import { R5 } from './common.js';

/** the k09 flood switch (evaluated at scene setup: LOOKCFG is set by ENGINE.init before scenes build) */
export function floodK9On() {
  let q = null; try { q = new URLSearchParams(globalThis.location?.search || '').get('flood'); } catch (e) { /* no location */ }
  q = q || globalThis.FLOOD_STAGING || null; if (q === 'old') return false; if (q === 'k09') return true; return !!LOOKCFG.k08b;
}

/** song times: the hero shot opens on beat 284 (Jade in the air, the pencil falling), the race cuts on the downbeat of bar 73 (底 120.12) */
export const K9T = { hero0: 118.525, plant: 119.02, race0: 120.135, wide: 120.94, reveal: 121.405 };
/** (v4b stage_3d, still 07) the flood as ONE ring from the plant: instead of k09's horn, the wave stands up round the pencil tip on
 *  119.02 and races outward (lip thrown out), through the front-on camera (~119.7, it fills the lens), on into the race (continuous
 *  with the race ring at 120.135: R 210, H 160). Off with ?flood4=0 (the round-4 horn). */
export function floodRingOn() { try { if (new URLSearchParams(globalThis.location?.search || '').get('flood4') === '0') return false; } catch (e) { /* no location */ } return R5(); }
/** the ring's radius from the plant to the race (pure in t): 14 -> 210 over 119.02-120.135 */
export const ringR = (t) => 14 + 196 * Math.pow(clamp01((t - K9T.plant) / (K9T.race0 - K9T.plant)), 0.85);

const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// coloured-pencil bands along the spine: red at the pencil ... violet, pink at the far end (k09)
const PAL = ['#ec3f3a', '#f5902a', '#f7d23a', '#5cc743', '#2fc3dd', '#3366e8', '#7d47dc', '#e862b4'];
const FOAM = '#fbf5e8';
const WHITE = new THREE.Color(1, 1, 1);
const NB = PAL.length;
const NL = 4;                  // nested sheets (the wave's thickness)
const NS = 64;                 // profile samples
const K = 8;                   // segments per wave stroke
const KF = 6;                  // segments per floor streak
const TURN = 1.36 * Math.PI;   // total turn of the profile tangent at full curl (up the face, over the crest, the lip down)
const A0 = 0.30;               // the face leaves the trough at ~17 deg (going back, then rising)
const LIPK = 0.24;             // (M4) how fast the profile tightens: low = a long lip that hangs forward over the trough (the barrel)

// full-curl normalisation: a unit-length profile, scaled so its crest is 1 high
const PROF_N = (() => { let x = 0, y = 0, ym = 0; for (let k = 1; k < 400; k++) { const s = (k - 0.5) / 399, a = A0 + TURN * Math.pow(s, 1.12), dl = (1 - LIPK * s) / 399; x += Math.cos(a) * dl; y += Math.sin(a) * dl; ym = Math.max(ym, y); } return 1 / ym; })();

const VS = /* glsl */`
attribute vec3 aInfo; varying vec3 vCol; varying vec2 vUv; varying vec3 vInfo;
void main(){ vCol = color; vUv = uv; vInfo = aInfo; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS = /* glsl */`
uniform float uGain; uniform vec3 uPaper; varying vec3 vCol; varying vec2 vUv; varying vec3 vInfo;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  float a = vUv.x, v = vUv.y, seed = vInfo.x, len = vInfo.y, kind = vInfo.z;
  vec3 col = vCol;
  if (kind > 1.5) {                                   // 2: paper / colour chip (a voxel fleck): solid square, darker rim
    float e = max(abs(a * 2.0 - 1.0), abs(v));
    col *= 1.0 - 0.18 * smoothstep(0.7, 1.0, e);
  } else {                                            // 0 wave / 1 floor + spray: a coloured-pencil stroke
    float taper = smoothstep(0.0, 0.07, a) * (1.0 - smoothstep(0.86, 1.0, a));
    float w = mix(0.25, 1.0, taper);
    if (abs(v) > w) discard;
    // paper tooth: ragged edges (the lead skips off the stroke), white paper grain showing inside it
    float g = h21(vec2(floor(a * len / 0.3), floor((v + 1.0) * 3.0)) + seed * 17.0);
    float g2 = h21(vec2(floor(a * len / 0.22) + 7.0, floor((v + 1.0) * 4.0)) + seed * 3.0);
    if (g < 0.05 + 0.2 * smoothstep(0.75, 1.0, a) + 0.22 * smoothstep(0.6, 1.0, abs(v) / w)) discard;
    // lead lines along the stroke
    col *= 0.88 + 0.12 * sin(v * 9.0 + seed * 40.0) + 0.05 * (g - 0.5);
    if (kind < 0.5) col = mix(col, uPaper, 0.55 * step(g2, 0.07));
  }
  gl_FragColor = vec4(col * uGain, 1.0);
}`;

export function makeFloodWave(W, { centre, ground, psi = 2.62, psiFrom = null, theta = 2.62, counts = {} } = {}) {
  const PSI0 = psiFrom ?? psi;   // the spine sweeps from PSI0 to psi (the wake it leaves is coloured)
  const psiAt = (s) => PSI0 + (psi - PSI0) * Math.pow(smooth(0, 0.8, s), 0.85) + 0.03 * smooth(0.8, 1.3, s);
  if (W._floodK9) return W._floodK9;
  const C = centre.clone();
  const N = { wave: 4400, floor: 700, spray: 460, chips: 3200, bloomT: 5200, bloomF: 1400, ...counts };
  const NW = NL * N.wave; const NER = 24, NE = NER * 12;   // lip-edge rows x columns per sheet
  const rnd = mulberry32(9091);
  const pal = PAL.map((h) => new THREE.Color(h)), foamC = new THREE.Color(FOAM), tmpC = new THREE.Color();
  // bands 0..6 (red .. violet) over u 0..0.975, the pink edge only at the far end
  const bandCol = (u, out) => { u = clamp01(u); const f = u < 0.975 ? Math.pow(u / 0.975, 1.3) * (NB - 2) : NB - 2 + (u - 0.975) / 0.025; const k = Math.min(NB - 2, Math.floor(f)); const w = smooth(0.3, 0.7, f - k); return out.copy(pal[k]).lerp(pal[k + 1], w); };

  // ---------------------------------------------------------------- stroke records (fixed at build: the seeds)
  const S = { layer: new Uint8Array(NW), u: new Float32Array(NW), ph: new Float32Array(NW), len: new Float32Array(NW), wd: new Float32Array(NW),
    tilt: new Float32Array(NW), col: new Float32Array(NW * 3), foam: new Float32Array(NW), seed: new Float32Array(NW) };
  let i = 0;
  for (let b = 0; b < NL; b++) for (let k = 0; k < N.wave; k++, i++) {
    // (M6) strokes run ALONG the wave (along the spine, at a fixed height on the profile): u = start, ph = profile position
    // sigma, len = length in u. They follow the colour arcs from the pencil tip up and over, as in k09.
    const paper = b === NL - 1;    // the outer sheet is the paper the hatching sits on (white showing between the strokes)
    const len = 0.14 + 0.26 * Math.pow(rnd(), 0.8); const u = -len * 0.6 + rnd() * (1 + len * 0.6);
    S.layer[i] = b; S.u[i] = u; S.ph[i] = rnd() * 0.94; S.len[i] = len; S.wd[i] = paper ? 2.2 + 1.6 * rnd() : 0.95 + 0.85 * rnd();
    S.tilt[i] = (rnd() * 2 - 1) * 0.55; S.foam[i] = rnd(); S.seed[i] = rnd();
    // (m6b) the lip's outer edge: the last NE strokes of each sheet tile the whole length in overlapping rows (sigma 0.935-1),
    // so the edge is one continuous curve (no stroke-end steps) that tapers with the wave; its upper rows are the white foam
    if (k >= N.wave - NE) { const j = k - (N.wave - NE), row = j % NER, col = Math.floor(j / NER); const nc = NE / NER;
      S.ph[i] = 0.935 + 0.065 * (row + 0.5 * rnd()) / NER; S.len[i] = 0.34; S.u[i] = -0.12 + (col + 0.3 * rnd()) * (1.12 / nc); S.tilt[i] *= 0.3;
      S.wd[i] = 1.3 + 0.8 * rnd(); S.foam[i] = S.ph[i] > 0.96 ? 0.2 * rnd() : 0.6 + 0.4 * rnd(); }
    // the band by position along the spine (+ a little scatter), pencil variance in hue / value; the outer sheets a shade deeper
    bandCol(u + (rnd() - 0.5) * 0.07, tmpC); const hsl = {}; tmpC.getHSL(hsl);
    tmpC.setHSL(hsl.h + (rnd() - 0.5) * 0.025, Math.min(1, hsl.s * (0.8 + 0.2 * rnd())), hsl.l * (0.88 + 0.22 * rnd()));
    tmpC.lerp(paper ? foamC : WHITE, paper ? 0.3 : 0.03 + 0.06 * rnd());   // coloured pencil on paper: a little pastel; the paper sheet a light wash of the band
    S.col[i * 3] = tmpC.r; S.col[i * 3 + 1] = tmpC.g; S.col[i * 3 + 2] = tmpC.b;
  }
  const F = { u: new Float32Array(N.floor), back: new Float32Array(N.floor), wd: new Float32Array(N.floor), col: new Float32Array(N.floor * 3), seed: new Float32Array(N.floor), curve: new Float32Array(N.floor), r0: new Float32Array(N.floor) };
  for (let k = 0; k < N.floor; k++) { F.u[k] = Math.pow(rnd(), 0.8); F.back[k] = rnd() < 0.7 ? rnd() * 0.5 : rnd() * 1.4; F.wd[k] = 0.8 + 1.4 * rnd(); F.seed[k] = rnd(); F.curve[k] = (rnd() * 2 - 1) * 0.12; F.r0[k] = 1.5 + 6 * rnd();
    bandCol(F.u[k] * 0.9 + rnd() * 0.12, tmpC).multiplyScalar(0.92 + 0.16 * rnd()); F.col[k * 3] = tmpC.r; F.col[k * 3 + 1] = tmpC.g; F.col[k * 3 + 2] = tmpC.b; }
  const P = { a: new Float32Array(N.spray), el: new Float32Array(N.spray), sp: new Float32Array(N.spray), life: new Float32Array(N.spray), ph: new Float32Array(N.spray), col: new Float32Array(N.spray * 3), seed: new Float32Array(N.spray), toward: new Uint8Array(N.spray) };
  for (let k = 0; k < N.spray; k++) { const tw = rnd() < 0.6; P.toward[k] = tw ? 1 : 0; P.a[k] = tw ? (rnd() * 2 - 1) * 0.7 : rnd() * Math.PI * 2; P.el[k] = 0.06 + (tw ? 0.8 : 1.2) * Math.pow(rnd(), 1.3); P.sp[k] = 130 + 260 * rnd(); P.life[k] = 0.15 + 0.22 * rnd(); P.ph[k] = rnd(); P.seed[k] = rnd();
    tmpC.copy(pal[Math.floor(rnd() * NB)]).multiplyScalar(1.1); P.col[k * 3] = tmpC.r; P.col[k * 3 + 1] = tmpC.g; P.col[k * 3 + 2] = tmpC.b; }
  const Q = { u: new Float32Array(N.chips), sg: new Float32Array(N.chips), off: new Float32Array(N.chips), sz: new Float32Array(N.chips), ph: new Float32Array(N.chips), life: new Float32Array(N.chips), col: new Float32Array(N.chips * 3), vx: new Float32Array(N.chips), vy: new Float32Array(N.chips) };
  for (let k = 0; k < N.chips; k++) { Q.u[k] = Math.pow(rnd(), 0.55); Q.sg[k] = 0.68 + 0.26 * rnd();   // along the lip, where it turns over (crest ~0.74 at full curl) Q.off[k] = rnd(); Q.sz[k] = 0.4 + 0.65 * Math.pow(rnd(), 2); Q.ph[k] = rnd(); Q.life[k] = 0.35 + 0.5 * rnd();
    Q.vx[k] = (rnd() * 2 - 1); Q.vy[k] = rnd();
    const white = rnd() < 0.88; if (white) tmpC.copy(foamC).multiplyScalar(0.94 + 0.08 * rnd()); else bandCol(Q.u[k], tmpC); Q.col[k * 3] = tmpC.r; Q.col[k * 3 + 1] = tmpC.g; Q.col[k * 3 + 2] = tmpC.b; }

  // ---------------------------------------------------------------- geometry (one draw call; positions rebuilt per frame)
  const nvW = (K + 1) * 2, nvF = (KF + 1) * 2;
  const offF = NW * nvW, offP = offF + N.floor * nvF, offQ = offP + N.spray * 4, NV = offQ + N.chips * 4;
  const pos = new Float32Array(NV * 3), colA = new Float32Array(NV * 3), uvA = new Float32Array(NV * 2), info = new Float32Array(NV * 3);
  const idx = new Uint32Array((NW * K + N.floor * KF + N.spray + N.chips) * 6); let ii = 0;
  const strip = (o, n) => { for (let s = 0; s < n; s++) { const a = o + s * 2; idx[ii++] = a; idx[ii++] = a + 1; idx[ii++] = a + 2; idx[ii++] = a + 1; idx[ii++] = a + 3; idx[ii++] = a + 2; } };
  for (let k = 0; k < NW; k++) strip(k * nvW, K);
  for (let k = 0; k < N.floor; k++) strip(offF + k * nvF, KF);
  for (let k = 0; k < N.spray; k++) strip(offP + k * 4, 1);
  for (let k = 0; k < N.chips; k++) strip(offQ + k * 4, 1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(colA, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvA, 2).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aInfo', new THREE.BufferAttribute(info, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: { uGain: { value: 1.0 }, uPaper: { value: new THREE.Color('#f8f2e6') } }, vertexColors: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.userData.noAO = true; mesh.name = 'flood_k09_wave';
  const group = new THREE.Group(); group.name = 'flood_k09'; group.add(mesh); group.visible = false; W.scene.add(group);

  // ---------------------------------------------------------------- the bloom: voxel grass + flowers grow in the hero wave's wake
  // (k08b's own tufts / flowers, a little bigger; on the stage mesa behind the trough line), scaled up from nothing as the
  // colour arrives at each spot (colour(x, z, t), so the garden follows the wave). Pure in t.
  const bloom = (() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }); m.userData.noPaint = true; patchPaint(m, { noPaint: true, k8kind: 10 });
    const PS = [['#2f7a2a', '#3f9a36', '#7fd05a'], ['#2f7a2a', '#4cae40', '#9ade62'], ['#3f9a36', '#5cc04a', '#b6e84a']];
    const PET = ['#f27aa6', '#ffd23f', '#fff4e6', '#a98bf0', '#e8463c', '#ff9a3c'];
    const geos = [...[0, 1, 2, 3].map((i) => tuftGeo(5000 + i * 31, VOX * 1.7, PS[i % 3], { w: 9, hMax: 14 })), ...PET.map((c, i) => flowerGeo(5100 + i, VOX * 1.9, c, { h: 11 }))];
    const lists = geos.map(() => []); const sx = Math.cos(psi), sz = Math.sin(psi), dx = Math.sin(psi), dz = -Math.cos(psi);
    const MB = { x0: 1090, x1: 1560, z0: 240, z1: 560 };
    const place = (n, gi0, gn) => { let k = 0, tries = 0; while (k < n && tries++ < n * 8) {
      // the swept sector + the ground behind the spine (bearing PSI0 - 0.3 .. psi + 1.0 from the pencil), on the stage mesa
      const th = PSI0 - 0.3 + rnd() * (psi - PSI0 + 1.3), rr = 12 + Math.pow(rnd(), 0.8) * 330; const x = C.x + Math.cos(th) * rr, z = C.z + Math.sin(th) * rr; void sx; void sz; void dx; void dz;
      if (x < MB.x0 + 3 || x > MB.x1 - 3 || z < MB.z0 + 3 || z > MB.z1 - 3 || Math.hypot(x - C.x, z - C.z) < 12) continue;
      lists[gi0 + Math.floor(rnd() * gn)].push([x, ground(x, z), z, rnd() * 6.283, 0.75 + 0.5 * rnd(), rnd()]); k++; } };
    place(N.bloomT, 0, 4); place(N.bloomF, 4, PET.length);
    const meshes = geos.map((gg, i) => { const im = new THREE.InstancedMesh(gg, m, Math.max(1, lists[i].length)); im.count = lists[i].length; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; im.userData.noAO = true; group.add(im); return im; });
    const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    return { meshes, update(t) {
      meshes.forEach((im, i) => { const L = lists[i];
        for (let k = 0; k < L.length; k++) { const [x, y, z, yaw, s0, j] = L[k]; const c = colour(x, z, t); const g = smooth(0.15 + 0.5 * j, 1.0, c);
          const s = s0 * g; q.setFromAxisAngle(Y, yaw); M4.compose(p.set(x, y - 0.2, z), q, sc.set(Math.max(1e-3, s * (0.4 + 0.6 * g)), Math.max(1e-3, s), Math.max(1e-3, s * (0.4 + 0.6 * g)))); im.setMatrixAt(k, M4); }
        im.instanceMatrix.needsUpdate = true; im.visible = true; }); },
      hide() { for (const im of meshes) im.visible = false; } };
  })();

  // ---------------------------------------------------------------- the wave (pure in t)
  const Lh = (s) => 20 + 275 * (1 - Math.exp(-s / 0.3)) + 12 * s;   // the horn peels out along its spine (M5: bigger in the world)
  const s0r = K9T.race0 - K9T.plant;
  const RING = floodRingOn();
  function state(t) {
    const s = t - K9T.plant; if (s < 0) return null;
    if (RING && t < K9T.race0) {   // (v4b) the ring from the plant (see floodRingOn)
      const R = ringR(t); const H = (10 + 0.2 * R + 120 * Math.pow(smooth(80, 150, R), 1.4)) * smooth(0, 0.12, s);   // low round her (still 07), rearing up as it reaches the lens
      return { mode: 'race', ring: true, s, R, L: R, H, curl: 0.3 + 0.7 * smooth(0.02, 0.4, s) + 0.025 * Math.sin(s * 5), reveal: smooth(0, 0.2, s), race: 0, wide: false };
    }
    if (t < K9T.race0) {
      return { mode: 'hero', s, L: Lh(s), H: 182 * Math.pow(smooth(0, 0.5, s), 0.7) + 8 * s, curl: 0.2 + 0.74 * smooth(0.04, 0.6, s) + 0.02 * Math.sin(s * 5),   // capped: the lip hangs over the face but never hides it (k09)
        psi: psiAt(s), travel: 0, reveal: smooth(0, 0.32, s) };
    }
    const u = clamp01((t - K9T.race0) / (K9T.reveal - K9T.race0));
    const R = 210 + 8800 * Math.pow(u, 1.55);
    // the wide (from 120.94): a low rolling crest band seen from above, not a tall fence
    const Hc = 160 + Math.min(560, 0.075 * (R - 210)); const H = t < K9T.wide ? Hc : Math.min(420, 150 + 0.04 * R);
    return { mode: 'race', s, R, H, curl: 1 + 0.025 * Math.sin(s * 5), reveal: 1, race: u, wide: t >= K9T.wide };
  }
  /** frame at spine parameter u: trough point (x, z), travel direction (dx, dz: the lip throws this way), height h */
  const fr = { x: 0, z: 0, dx: 0, dz: 0, h: 0, a: 0 };
  function frame(u, ws, o = fr) {
    if (ws.mode === 'hero') {
      const sx = Math.cos(ws.psi), sz = Math.sin(ws.psi), dx = Math.sin(ws.psi), dz = -Math.cos(ws.psi);
      const a = 3 + u * (ws.L - 3); o.a = a;
      o.x = C.x + sx * a + dx * ws.travel * u; o.z = C.z + sz * a + dz * ws.travel * u; o.dx = dx; o.dz = dz;
      o.h = ws.H * 1.12 * Math.pow(u, 0.62) * (1 - 0.9 * Math.pow(smooth(0.74, 1.0, u), 1.2));   // (M4) the far shoulder tapers away: one body, no end fin
      return o;
    }
    const th = theta + (Math.pow(u, 1 / 0.6) - 0.5) * Math.PI * 2; const cx = Math.cos(th), cz = Math.sin(th);   // (u was drawn as r^0.6: uniform round the ring)
    o.a = ws.R; o.x = C.x + cx * ws.R; o.z = C.z + cz * ws.R; o.dx = cx; o.dz = cz; o.h = ws.H; return o;
  }
  // the profile for this frame's curl (per nested sheet: scaled about the trough)
  const PR = { r: new Float32Array(NS), y: new Float32Array(NS), nr: new Float32Array(NS), ny: new Float32Array(NS) };
  let prKey = '';
  function profile(ws) {
    const key = ws.curl.toFixed(5); if (key === prKey) return; prKey = key;
    let x = 0, y = 0; const steps = 4; PR.r[0] = 0; PR.y[0] = 0; PR.nr[0] = -Math.sin(A0); PR.ny[0] = Math.cos(A0);
    for (let k = 1; k < NS; k++) {
      for (let q = 0; q < steps; q++) { const s = ((k - 1) * steps + q + 0.5) / ((NS - 1) * steps); const a = A0 + TURN * ws.curl * Math.pow(s, 1.12); const dl = (1 - LIPK * s) / ((NS - 1) * steps);
        x += Math.cos(a) * dl; y += Math.sin(a) * dl; }
      const s = k / (NS - 1), a = A0 + TURN * ws.curl * Math.pow(s, 1.12);
      PR.r[k] = x * PROF_N; PR.y[k] = y * PROF_N; PR.nr[k] = -Math.sin(a); PR.ny[k] = Math.cos(a);
    }
  }
  // colour sheets a little bigger each (the curl has thickness); the paper sheet sits just behind the innermost one (offset
  // back along the profile normal), so from the curl's open side it is always under the hatching
  const sheetK = (b) => (b === NL - 1 ? 1 : 1 + 0.022 * b);   // (M4) nearly coincident: ONE body, the sheets only give it depth
  /** profile at sigma: [rho (back from the trough, x h), y (x h), normal rho, normal y] */
  const samp = (sg, o) => { const f = Math.min(NS - 1 - 1e-4, Math.max(0, sg * (NS - 1))); const k = Math.floor(f), u = f - k;
    o[0] = PR.r[k] + (PR.r[k + 1] - PR.r[k]) * u; o[1] = PR.y[k] + (PR.y[k + 1] - PR.y[k]) * u; o[2] = PR.nr[k] + (PR.nr[k + 1] - PR.nr[k]) * u; o[3] = PR.ny[k] + (PR.ny[k + 1] - PR.ny[k]) * u; return o; };
  const _s = [0, 0, 0, 0], _f = { ...fr };
  const NU = 256; const TU = { x: new Float32Array(NU + 1), z: new Float32Array(NU + 1), dx: new Float32Array(NU + 1), dz: new Float32Array(NU + 1), h: new Float32Array(NU + 1), y: new Float32Array(NU + 1), ys: new Float32Array(NU + 1), tmp: new Float32Array(NU + 1) };
  const COOL = new THREE.Color(0.62, 0.72, 1.0);   // the hollow under the lip goes cooler
  /** world point on sheet b at (u, sigma) */
  function surface(u, sg, t, out = new THREE.Vector3(), b = 1, ws = state(t)) {
    if (!ws) return out.copy(C); profile(ws); frame(u, ws, _f); samp(sg, _s); const h = _f.h * sheetK(b);
    return out.set(_f.x - _f.dx * _s[0] * h, ground(_f.x, _f.z) + _s[1] * h, _f.z - _f.dz * _s[0] * h);
  }
  let crestSg = 0.5;
  function crest(u, t, out = new THREE.Vector3()) { const ws = state(t); if (!ws) return out.copy(C); profile(ws); let km = 0; for (let k = 1; k < NS; k++) if (PR.y[k] > PR.y[km]) km = k; crestSg = km / (NS - 1); return surface(u, crestSg, t, out, 1, ws); }
  function trough(u, t, out = new THREE.Vector3()) { const ws = state(t); if (!ws) return out.copy(C); frame(u, ws, _f); return out.set(_f.x, ground(_f.x, _f.z), _f.z); }
  /** colour amount at (x, z): HERO = the region the wave has passed (behind its trough line, along the spine) + the plant disc;
   *  RACE = everything inside the ring (just behind its trough), plus what the hero wave coloured */
  const hero0 = (x, z, ws) => {
    const sx = Math.cos(ws.psi), sz = Math.sin(ws.psi), dx = Math.sin(ws.psi), dz = -Math.cos(ws.psi); const rx = x - C.x, rz = z - C.z;
    const a = rx * sx + rz * sz, b = rx * dx + rz * dz - ws.travel * clamp01(a / ws.L);
    // the wake: everything behind the trough line, from the pencil out past the barrel's end, as far as the wave has peeled
    const Lr = ws.L * smooth(0, 0.42, ws.s) + 8;
    // (edges sharp: a soft ramp in the 17-unit map turns into a wide solid rainbow rim in the k08b shader)
    const along = clamp01((a + 12) / 4) * clamp01((Lr * 1.2 + 12 - a) / 6);
    // behind the trough, as deep as the wave body reaches (under the curl), so the colour arrives with the wave
    const hb = ws.H * Math.pow(clamp01(a / ws.L), 0.62) * 0.75 + 16; const behind = clamp01((3 - b) / 5) * clamp01((b + hb) / 6);
    const r = Math.hypot(rx, rz), disc = clamp01((26 * smooth(0, 0.12, ws.s) - r) / 4);
    // the sweep: the sector the spine has already passed over (PSI0 .. psi), out to the barrel's reach: the garden it leaves
    const dth = Math.atan2(Math.sin(Math.atan2(rz, rx) - PSI0), Math.cos(Math.atan2(rz, rx) - PSI0)), span = ws.psi - PSI0;
    const sweep = span > 0 ? clamp01((dth * r + 4) / 5) * clamp01(((span - dth) * r + 2) / 5) * clamp01((Lr * 1.15 + 10 - r) / 6) : 0;
    return Math.max(along * behind, disc, sweep);
  };
  const wsRace0 = state(K9T.race0 - 1e-4);
  function colour(x, z, t) {
    const ws = state(t); if (!ws) return 0;
    if (ws.mode === 'hero') return hero0(x, z, ws);
    const r = Math.hypot(x - C.x, z - C.z);
    const ring = clamp01((ws.R - 6 - r) / (14 + 0.02 * ws.R));
    return wsRace0.mode === 'hero' ? Math.max(hero0(x, z, wsRace0), ring) : ring;   // (v4b) the ring: everything inside it
  }

  // ---------------------------------------------------------------- per frame
  const cr = new THREE.Vector3(), cu = new THREE.Vector3(), cf = new THREE.Vector3();
  const zero = (v0, n) => { for (let q = 0; q < n; q++) { const o = (v0 + q) * 3; pos[o] = pos[o + 1] = pos[o + 2] = 0; } };
  function update(t, camera) {
    const ws = state(t);
    group.visible = mesh.visible = !!ws && t < K9T.reveal - 1 / 60;   // (the recruit cut lands on the frame nearest 121.405)
    if (!group.visible) return;
    profile(ws);
    camera.updateMatrixWorld(); cr.setFromMatrixColumn(camera.matrixWorld, 0); cu.setFromMatrixColumn(camera.matrixWorld, 1); cf.setFromMatrixColumn(camera.matrixWorld, 2);
    const race = ws.mode === 'race';
    const flow = 0;   // (M5) strokes hold their place on the profile: the bands (by profile position) stay crisp, no colour pops
    const sgEnd = 0.08 + 0.97 * ws.reveal;           // drawn extent of the profile (the wave rises out of the floor)
    const Hs = ws.H / 150;
    const wScale = race ? 1.4 + ws.R / 200 : 1;        // strokes widen with the ring (the aerial reads them at distance)
    const thin = race ? 1 - smooth(0.82, 1.0, ws.race) : 1;
    // ---- wave strokes (M6: laid along the spine at a fixed profile position sigma, so they follow the colour arcs)
    // the trough frame along the spine, tabulated once per frame (ground lookups are not cheap off the mesas)
    for (let q = 0; q <= NU; q++) { frame(q / NU, ws, _f); TU.x[q] = _f.x; TU.z[q] = _f.z; TU.dx[q] = _f.dx; TU.dz[q] = _f.dz; TU.h[q] = _f.h; TU.y[q] = ground(_f.x, _f.z); }
    // (m6b) the body rides a smoothed base (the seat steps / disc edge under the trough would otherwise step the whole curl and
    // kink the lip's edge); only the trough itself hugs the real ground
    TU.ys.set(TU.y); for (let pass = 0; pass < 3; pass++) { TU.tmp.set(TU.ys); for (let q = 0; q <= NU; q++) { let a = 0, n = 0; for (let j = -10; j <= 10; j++) { const qq = q + j; if (qq < 0 || qq > NU) continue; a += TU.tmp[qq]; n++; } TU.ys[q] = a / n; } }
    const tu = (u) => { const f = Math.min(NU - 1e-4, Math.max(0, u * NU)); const q = Math.floor(f), w = f - q;
      _f.x = TU.x[q] + (TU.x[q + 1] - TU.x[q]) * w; _f.z = TU.z[q] + (TU.z[q + 1] - TU.z[q]) * w; _f.dx = TU.dx[q] + (TU.dx[q + 1] - TU.dx[q]) * w; _f.dz = TU.dz[q] + (TU.dz[q + 1] - TU.dz[q]) * w;
      _f.h = TU.h[q] + (TU.h[q + 1] - TU.h[q]) * w; _f.ys = TU.ys[q] + (TU.ys[q + 1] - TU.ys[q]) * w; return TU.y[q] + (TU.y[q + 1] - TU.y[q]) * w; };
    const peelU = race ? 1.0 : Math.min(1, smooth(0, 0.42, ws.s) + 8 / ws.L);
    const spanL = race ? 2 * Math.PI * ws.R : ws.L;
    const curlK = clamp01((ws.curl - 0.4) / 0.5);
    let v = 0;
    for (let k = 0; k < NW; k++) {
      const b = S.layer[k]; const sg = S.ph[k]; const len = S.len[k]; const u0 = S.u[k];
      const lo = Math.max(0, u0), hi = Math.min(u0 + len, peelU, 1);
      if (!(hi > lo + 0.003) || sg > sgEnd || S.foam[k] > thin + 0.02) { zero(v, nvW); v += nvW; continue; }
      samp(Math.min(1, sg), _s); const pr = _s[0], py0 = _s[1], nr = _s[2], ny = _s[3];
      const tc = Math.cos(S.tilt[k]), ts = Math.sin(S.tilt[k]);
      // colour by the band (profile position): red / orange at the trough (leaving the pencil tip) -> violet, pink at the lip
      bandCol(Math.pow(clamp01(sg / 0.86), 0.78) + (S.seed[k] - 0.5) * 0.05, tmpC);
      { const j = 0.9 + 0.2 * S.foam[k]; tmpC.multiplyScalar(j); if (b === NL - 1) tmpC.lerp(foamC, 0.3); else tmpC.lerp(WHITE, 0.05); }
      // the hollow under the lip: darker and cooler; the lip's underside darker still; white foam strokes along the lip edge
      const hollow = smooth(0.3, 0.55, sg) * (1 - smooth(0.7, 0.8, sg)) * curlK;
      let shade = (0.8 + 0.2 * clamp01(0.55 + 0.45 * ny)) * (1 - 0.3 * hollow) * (ny < 0 ? 0.85 : 1);
      const cool = 0.28 * hollow;
      let r0 = tmpC.r * (1 - cool) + tmpC.r * COOL.r * cool, g0 = tmpC.g * (1 - cool) + tmpC.g * COOL.g * cool, b0 = tmpC.b * (1 - cool) + tmpC.b * COOL.b * cool;
      const fm = smooth(0.9, 0.955, sg) * (S.foam[k] < 0.5 ? 1 : 0.15);   // the white foam along the lip edge (m6b: a little thicker)
      r0 = (r0 + (foamC.r - r0) * fm) * shade; g0 = (g0 + (foamC.g - g0) * fm) * shade; b0 = (b0 + (foamC.b - b0) * fm) * shade;
      const L = len * spanL; const po = b === NL - 1 ? -0.035 : 0;   // paper: behind the hatching (x h)
      for (let q = 0; q <= K; q++) {
        const u = lo + (hi - lo) * (q / K); const yr = tu(u); const y0 = yr + (_f.ys - yr) * smooth(0.04, 0.3, sg); const h = _f.h * sheetK(b), dx = _f.dx, dz = _f.dz;
        const rr = pr * h + nr * po * h, yy = py0 * h + ny * po * h;
        const px = _f.x - dx * rr, py = y0 + yy, pz = _f.z - dz * rr;
        // ribbon side: across the stroke on the wave surface (the profile tangent), twisted by its tilt about the stroke
        const Tx = -dx * ny, Ty = -nr, Tz = -dz * ny, Nx = -dx * nr, Ny = ny, Nz = -dz * nr;
        const sx = Tx * tc + Nx * ts, sy = Ty * tc + Ny * ts, sz = Tz * tc + Nz * ts;
        const w = S.wd[k] * Math.max(0.5, Math.min(1.7, h / 120)) * wScale * 0.5;
        const a = (u - u0) / len;
        const ft = race ? 1 : smooth(0.12, 0.35, u) * (1 - smooth(0.82, 0.97, u));   // the foam fades in / out with the lip
        const f2 = fm * (1 - ft);   // where the lip is low (the wave's ends) the foam goes back to the band colour
        const cR = r0 + (tmpC.r * shade - r0) * f2, cG = g0 + (tmpC.g * shade - g0) * f2, cB = b0 + (tmpC.b * shade - b0) * f2;
        for (let sd = -1; sd <= 1; sd += 2) {
          const o = v * 3; pos[o] = px + sx * w * sd; pos[o + 1] = py + sy * w * sd; pos[o + 2] = pz + sz * w * sd;
          colA[o] = cR; colA[o + 1] = cG; colA[o + 2] = cB; uvA[v * 2] = a; uvA[v * 2 + 1] = sd; info[o] = S.seed[k]; info[o + 1] = L; info[o + 2] = 0; v++;
        }
      }
    }
    // ---- floor streaks (hero): from the pencil tip fanning out to the trough line and behind it
    const fOp = race && !ws.ring ? 0 : 1;   // (v4b) the ring keeps the floor streaks: a rainbow starburst from the tip to the ring
    for (let k = 0; k < N.floor; k++) {
      const uu = F.u[k]; frame(uu, ws, _f);
      if (!fOp || uu * ws.L > ws.L * smooth(0, 0.4, ws.s) + 6) { zero(v, nvF); v += nvF; continue; }
      const ex = _f.x - _f.dx * F.back[k] * (8 + 0.25 * _f.h), ez = _f.z - _f.dz * F.back[k] * (8 + 0.25 * _f.h);
      const L0 = Math.hypot(ex - C.x, ez - C.z); const ux = (ex - C.x) / (L0 || 1), uz = (ez - C.z) / (L0 || 1);
      const w = F.wd[k] * 0.5;
      for (let q = 0; q <= KF; q++) {
        const uq = q / KF; const r = F.r0[k] + (L0 - F.r0[k]) * uq; const bend = F.curve[k] * Math.sin(Math.PI * uq) * L0;
        const x = C.x + ux * r - uz * bend, z = C.z + uz * r + ux * bend; const y = ground(x, z) + 0.3 + 0.004 * (k % 40);
        for (let sd = -1; sd <= 1; sd += 2) { const o = v * 3; pos[o] = x - uz * w * sd; pos[o + 1] = y; pos[o + 2] = z + ux * w * sd;
          colA[o] = F.col[k * 3]; colA[o + 1] = F.col[k * 3 + 1]; colA[o + 2] = F.col[k * 3 + 2]; uvA[v * 2] = uq; uvA[v * 2 + 1] = sd; info[o] = F.seed[k]; info[o + 1] = L0; info[o + 2] = 1; v++; }
      }
    }
    // ---- spray off the pencil tip: short strokes along their velocity (camera-facing width), continuous emission
    const sprayOn = !race || !!ws.ring; const tipY = ground(C.x, C.z) + 0.5; const spsi = ws.psi ?? theta;
    for (let k = 0; k < N.spray; k++) {
      // this slot's current emission; before its first one it fires in the plant's starburst (all slots at s = 0)
      const life = P.life[k]; const n = Math.floor(ws.s / life - P.ph[k]); const first = n < 0; const age = first ? ws.s : ws.s - (n + P.ph[k]) * life;
      if (!sprayOn || age < 0 || age > life * (first ? 1.3 : 1)) { zero(v, 4); v += 4; continue; }
      const burst = first ? 1.7 : 1;
      const sp = P.sp[k] * burst * (1 - 0.5 * age / life), el = P.el[k], th = P.toward[k] ? spsi + P.a[k] : P.a[k];
      const dx = Math.cos(th) * Math.cos(el), dy = Math.sin(el), dz = Math.sin(th) * Math.cos(el);
      const d = sp * age, x = C.x + dx * d, y = tipY + dy * d - 120 * age * age, z = C.z + dz * d; const Ls = Math.min(d, 6 + 0.06 * sp);
      let sx = dy * cf.z - dz * cf.y, sy = dz * cf.x - dx * cf.z, sz = dx * cf.y - dy * cf.x; const sl = Math.hypot(sx, sy, sz) || 1; const w = 0.55 * (1 - 0.6 * age / life); sx *= w / sl; sy *= w / sl; sz *= w / sl;
      for (let e = 0; e < 2; e++) { const px = e ? x : x - dx * Ls, py = e ? y : y - dy * Ls, pz = e ? z : z - dz * Ls;
        for (let sd = -1; sd <= 1; sd += 2) { const o = v * 3; pos[o] = px + sx * sd; pos[o + 1] = py + sy * sd; pos[o + 2] = pz + sz * sd;
          colA[o] = P.col[k * 3]; colA[o + 1] = P.col[k * 3 + 1]; colA[o + 2] = P.col[k * 3 + 2]; uvA[v * 2] = e; uvA[v * 2 + 1] = sd; info[o] = P.seed[k]; info[o + 1] = Ls; info[o + 2] = 1; v++; } }
    }
    // ---- paper-white chips at the crest: voxel flecks thrown off the lip (camera-facing squares)
    for (let k = 0; k < N.chips; k++) {
      const uu = Q.u[k]; frame(uu, ws, _f); const life = Q.life[k]; const age = ((ws.s + Q.ph[k] * life) % life);
      const on = ws.reveal > 0.6 && _f.h > 25 && (race || (uu > 0.28 && uu < 0.9)) && (!race || (ws.race < 0.7 && k % 2 === 0)) && (race || uu * ws.L < ws.L * smooth(0, 0.42, ws.s));
      if (!on) { zero(v, 4); v += 4; continue; }
      const h = _f.h; samp(Math.min(1, Q.sg[k]), _s); const hs = h / 150;
      const nOut = (1.5 + 6 * Q.off[k]) * hs + 30 * age * hs;                        // thrown off the surface along its normal
      const drift = (Q.vx[k] * 18 * age) * hs;
      const px = _f.x - _f.dx * _s[0] * h - _f.dx * _s[2] * nOut + _f.dz * drift, py = ground(_f.x, _f.z) + _s[1] * h + _s[3] * nOut + (10 * Q.vy[k] * age - 60 * age * age) * hs, pz = _f.z - _f.dz * _s[0] * h - _f.dz * _s[2] * nOut - _f.dx * drift;
      const sz = Q.sz[k] * Math.max(0.8, hs) * (1 - 0.5 * age / life) * wScale;
      // quad corners as a strip: (-,-), (-,+), (+,-), (+,+)
      for (let e = 0; e < 2; e++) for (let sd = -1; sd <= 1; sd += 2) { const ux = e ? 1 : -1, uy = sd; const o = v * 3;
        pos[o] = px + (cr.x * ux + cu.x * uy) * sz; pos[o + 1] = py + (cr.y * ux + cu.y * uy) * sz; pos[o + 2] = pz + (cr.z * ux + cu.z * uy) * sz;
        colA[o] = Q.col[k * 3]; colA[o + 1] = Q.col[k * 3 + 1]; colA[o + 2] = Q.col[k * 3 + 2]; uvA[v * 2] = e; uvA[v * 2 + 1] = sd; info[o] = 0; info[o + 1] = 1; info[o + 2] = 2; v++; }
    }
    for (const k of ['position', 'color', 'uv', 'aInfo']) geo.attributes[k].needsUpdate = true;
    bloom.update(t);
  }
  const FW = { group, mesh, mat, state, frame, surface, crest, trough, colour, update, psi, theta, centre: C,
    crestSigma: () => crestSg, hide() { group.visible = false; mesh.visible = false; bloom.hide(); } };
  W._floodK9 = FW; return FW;
}

// ---------------------------------------------------------------- the giant every-colour pencil's rainbow core (k09 tip)
/** a six-colour hex cone that sits over the prop pencil's tip (props.js: tip cone r 1.4, h 4, apex at the group origin) */
export function rainbowTip() {
  const g = new THREE.ConeGeometry(1.55, 4.3, 6, 1).rotateX(Math.PI).translate(0, 2.1, 0).toNonIndexed();
  const cols = ['#ff4d6d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'].map((h) => new THREE.Color(h));
  const n = g.attributes.position.count; const c = new Float32Array(n * 3); const p = g.attributes.position;
  for (let i = 0; i < n; i += 3) { const ax = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, az = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const k = ((Math.round((Math.atan2(az, ax) / (Math.PI * 2)) * 6 + 6.5)) % 6 + 6) % 6; for (let j = 0; j < 3; j++) { c[(i + j) * 3] = cols[k].r; c[(i + j) * 3 + 1] = cols[k].g; c[(i + j) * 3 + 2] = cols[k].b; } }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }); m.color.setScalar(1.6);
  const mesh = new THREE.Mesh(g, m); mesh.userData.noAO = true; return mesh;
}
