// ACT III paint system: the TALOS world is unpainted plaster ("fixtures only"); colour exists only where the
// blue-eraser pencil has touched. One material patch handles every paint source, all pure functions of uniforms:
//   - the 2D flat look switch (G.uFlat, shared with the prototype's util.js patch)
//   - THE PAINT FLOOD (global sphere wavefront: G.uPaintC / G.uPaintR / G.uPaintW, coloured-pencil hatched edge)
//   - per-material LOCAL paint (hand-colouring single objects before the flood):
//       spheres  up to 8 (centre + radius)       e.g. spotlight pools, Jade's path through the flowers
//       capsule  a segment a->b with radius r     e.g. the path of colour in Jade's wake
//       wipe     paint everything above a height  e.g. a cypress turning green from the tip down
//       all      uniform coverage 0..1           (hatching grows in everywhere at once)
// The hatching (two diagonal colour-pencil line sets whose coverage grows with t) is the same for every source,
// so a hand-coloured tree and the flood read as the same tool.
//
//   patchPaint(material, { plaster: 0xf4efe6, noPaint: false })   -> material.userData.lp (local paint controls)
//   lp.sphere(i, x, y, z, r) / lp.clearSpheres() / lp.wipe(yThreshold, edge) / lp.all(v) / lp.reset()
import * as THREE from 'three';
import { G } from '../../../util.js';
import { LOOKCFG } from '../../../env.js';
/** shared Act III paint look uniforms: uAccent lifts hand-coloured objects (saturation/brightness) so each reads as an accent */
export const PAINT_U = { uAccent: { value: 1 } };
/** hero-only light layer (voxel heroes + bugs): soft camera-side fill + warm rim, so backlit faces/outfits read */
export const HERO_U = { uHeroFill: { value: 0 }, uHeroRim: { value: 0 }, uRimCol: { value: new THREE.Color(1.0, 0.72, 0.42) } };

const PAINT_GLSL = /* glsl */`
uniform float uFlat, uPaintR, uPaintW, uValueKeep, uNoPaint, uLAll, uLSW, uGlow; uniform vec3 uPaintC, uPlaster, uGlowC;
uniform float uAccent; uniform vec4 uLS[8]; uniform vec2 uLY; uniform vec4 uCapA; uniform vec3 uCapB;
varying vec3 vPW;
float pH(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float pN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(pH(i), pH(i+vec3(1,0,0)), f.x), mix(pH(i+vec3(0,1,0)), pH(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(pH(i+vec3(0,0,1)), pH(i+vec3(1,0,1)), f.x), mix(pH(i+vec3(0,1,1)), pH(i+vec3(1,1,1)), f.x), f.y), f.z); }
vec3 pHue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
float paintG(float n){ return uPaintR > 0.0 ? clamp((uPaintR - distance(vPW, uPaintC) + n * uPaintW * 0.8) / uPaintW, 0.0, 1.0) : 0.0; }
float paintL(float n){
  float t = 0.0;
  for (int i = 0; i < 8; i++) if (uLS[i].w > 0.0) t = max(t, clamp((uLS[i].w - distance(vPW, uLS[i].xyz) + n * uLSW * 0.8) / uLSW, 0.0, 1.0));
  if (uCapA.w > 0.0) { vec3 ab = uCapB - uCapA.xyz; float h = clamp(dot(vPW - uCapA.xyz, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
    t = max(t, clamp((uCapA.w - distance(vPW, uCapA.xyz + ab * h) + n * uLSW * 0.8) / uLSW, 0.0, 1.0)); }
  if (uLY.y > 0.0) t = max(t, clamp((vPW.y - uLY.x + n * uLY.y * 0.8) / uLY.y, 0.0, 1.0));
  return max(t, uLAll);
}
vec3 applyPaint(vec3 full){
  if (uNoPaint > 0.5) return full;
  float lum = dot(full, vec3(0.299, 0.587, 0.114));
  vec3 plaster = uPlaster * mix(1.0, 0.72 + 0.9 * lum, uValueKeep) * mix(1.0, 0.84, uFlat);
  float n = pN(vPW * 0.035) - 0.5;
  float tg = paintG(n), tl = paintL(n), t = max(tg, tl);
  if (tl > tg) { full = clamp(mix(vec3(lum), full, uAccent) * (0.9 + 0.1 * uAccent), 0.0, 1.0); }
  if (t <= 0.0) return plaster;
  if (t >= 1.0) return full;
  // the flood's leading edge: a solid rainbow pencil rim, readable from the air
  if (tg >= tl && tg < 0.09) return mix(plaster, pHue(dot(vPW, vec3(0.0011, 0.0006, 0.0013)) + n * 0.3) * 1.25, smoothstep(0.0, 0.02, tg));
  // hatching: the global flood draws wider strokes (readable from the air), hand-colouring fine ones
  float fq = tg >= tl ? 0.2 * clamp(90.0 / uPaintW, 0.1, 1.0) : 0.2;
  float h1 = fract(dot(vPW, normalize(vec3(1.0, 0.85, 0.35))) * fq + n * 0.6);
  float h2 = fract(dot(vPW, normalize(vec3(-0.6, 1.0, 0.5))) * fq - n * 0.6);
  float cov = max(step(h1, t * 1.25 - 0.05), step(h2, t * 1.25 - 0.55));
  vec3 pencil = mix(full, pHue(dot(vPW, vec3(0.002, 0.004, 0.003)) * (fq / 0.2) + n) * 1.15, 0.65 * (1.0 - t));
  return mix(plaster, pencil, cov);
}`;

const K8_PAINT_GLSL = /* glsl */`
uniform float uK8On, uK8Kind, uK8TealAmt, uK8ColOn, uK8Grain;
uniform vec3 uK8Sand, uK8Paper, uK8Stone, uK8Terra, uK8Teal, uK8Moss, uK8Rock, uK8RockF;
uniform sampler2D uK8ColMap; uniform vec4 uK8ColBox;
float k8h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
// masonry cells in world space: courses 12 high, blocks 30 long (staggered); top faces: 18-unit slabs.
// returns (tone hash 0..1, distance to the nearest joint in world units)
vec2 k8Ashlar(vec3 p, vec3 fn){
  if (abs(fn.y) > 0.7) {
    vec2 q = p.xz / 18.0; q.x += mod(floor(q.y), 2.0) * 0.5;
    vec2 fq = fract(q); float j = min(min(fq.x, 1.0 - fq.x), min(fq.y, 1.0 - fq.y)) * 18.0;
    return vec2(k8h(vec3(floor(q), 3.1)), j);
  }
  float cy = floor(p.y / 14.0); float ax = abs(fn.x) > abs(fn.z) ? p.z : p.x; float L = 34.0 + 14.0 * k8h(vec3(cy, 9.0, 1.0)); float u = (ax + k8h(vec3(cy, 3.0, 3.0)) * L) / L;
  float fx = fract(u), fy = fract(p.y / 14.0);
  return vec2(k8h(vec3(floor(u), cy, 7.0)), min(min(fx, 1.0 - fx) * L, min(fy, 1.0 - fy) * 14.0));
}
/** the colour-amount hook: a top-down map (r = 0..1 colour amount) over the box (x0, z0, 1/sizeX, 1/sizeZ) */
float k8ColMap(){ if (uK8ColOn < 0.5) return 0.0; vec2 uv = (vPW.xz - uK8ColBox.xy) * uK8ColBox.zw;
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return 0.0; return texture2D(uK8ColMap, uv).r; }
vec3 applyPaintK8(vec3 full){
  if (uK8On < 0.5) return applyPaint(full);
  vec3 fn = normalize(cross(dFdx(vPW), dFdy(vPW)));
  float px = length(fwidth(vPW));
  // voxel grain at the heroes' density (0.3 world units), faded out once a voxel is smaller than a pixel
  float grain = (k8h(floor(vPW / 0.3 + 0.013)) - 0.5) * (1.0 - smoothstep(0.08, 0.26, px)) * uK8Grain;
  float kind = uK8Kind;
  if (uNoPaint > 0.5) {
    if (kind > 9.5) return full * (1.0 + 0.30 * grain);                 // 10: always-coloured voxel props (flowers): grain only
    if (kind > 8.5) {                                                    // 9: the drawn level's grass: warm yellow-green, clumpy patches
      vec3 g = vec3(full.r + full.g * 0.34, full.g * 0.97, full.b * 0.55);
      float pa = pN(vPW * 0.11), pb = pN(vPW * 0.37 + 7.0), dry = smoothstep(0.60, 0.72, pN(vPW * 0.045 + 3.0));
      g *= (0.74 + 0.40 * pa) * (0.90 + 0.20 * pb);
      g = mix(g, vec3(0.42, 0.40, 0.08) * (0.8 + 0.4 * pb), dry * 0.55);
      return g * (1.0 + 0.30 * grain);
    }
    return full;
  }
  float lum = dot(full, vec3(0.299, 0.587, 0.114));
  vec2 ash = k8Ashlar(vPW, fn); float tone = ash.x;
  float jl = (1.0 - smoothstep(0.0, 0.5 + 2.0 * px, ash.y)) * (1.0 - smoothstep(0.5, 1.5, px));   // in the joint (fades at distance)
  float chip = (1.0 - smoothstep(0.0, 1.6, ash.y)) * step(0.72, pN(vPW * 0.8)) * (1.0 - smoothstep(0.4, 1.2, px));
  float wx = pN(vPW * 0.012);                                           // broad weathering
  float keep = mix(1.0, 0.76 + 0.48 * lum, 0.5);                        // the hidden colour's value (AO, strata) survives
  float up = smoothstep(0.55, 0.9, fn.y);
  vec3 P, F;
  if (kind < 1.5 || (kind > 4.5 && kind < 5.5)) {                       // 1 dressed stone / 5 mesa-top pavers
    float tt = k8h(vec3(tone * 91.0, 1.0, 2.0));
    vec3 s = uK8Sand * (0.91 + 0.15 * tone) * mix(vec3(1.0), vec3(1.05, 0.95, 0.90), step(0.72, tt));
    P = s * keep * (1.0 - 0.05 * jl - 0.08 * chip) * (0.93 + 0.14 * wx) * (1.0 + 0.10 * grain);
    vec3 st = uK8Stone * (0.86 + 0.26 * tone) * mix(vec3(1.0), vec3(1.06, 0.92, 0.86), step(0.7, tt));
    float terra = step(0.55, k8h(vec3(floor(vPW.y / 6.0), 2.0, 5.0))) * (1.0 - smoothstep(14.0, 15.0, vPW.y)) * step(-30.0, vPW.y) * (1.0 - smoothstep(0.3, 0.6, abs(fn.y)));   // terracotta plinths / base courses near the ground
    st = mix(st, uK8Terra * (0.88 + 0.24 * tone), terra * (kind < 1.5 ? 1.0 : 0.0));
    float teal = up * step(kind > 4.5 ? 0.80 : 0.86, tone) * uK8TealAmt;                                           // teal tile slabs
    st = mix(st, uK8Teal * (0.86 + 0.28 * tt), teal);
    F = st * mix(1.0, 0.80 + 0.32 * lum, 0.5) * (1.0 - 0.09 * jl - 0.12 * chip) * (0.94 + 0.12 * wx) * (1.0 + 0.12 * grain);
    float moss = jl * step(0.42, pN(vPW * 0.3)) * (0.35 + 0.65 * up) * (kind > 4.5 ? 1.0 : 0.6);                   // moss in the cracks
    F = mix(F, uK8Moss * (0.75 + 0.5 * tt) * (1.0 + 0.4 * grain), moss);
    P = mix(P, P * vec3(0.92, 0.93, 0.90), moss);
  } else if (kind < 2.5) {                                               // 2 rock: cliffs, mesa sides, sea stacks (strata via vertex colour)
    float kr = mix(1.0, 0.55 + 0.75 * lum, 0.7);
    P = uK8Rock * kr * (0.92 + 0.16 * wx) * (1.0 + 0.10 * grain);
    F = uK8RockF * kr * (0.90 + 0.2 * wx) * (1.0 + 0.12 * grain);
    float moss = up * smoothstep(0.45, 0.62, pN(vPW * 0.06));
    F = mix(F, uK8Moss * (0.8 + 0.4 * wx), moss * 0.85);
  } else if (kind < 3.5) {                                               // 3 meadow / grass / tufts
    P = uK8Paper * keep * (0.95 + 0.08 * wx) * (1.0 + 0.16 * grain);
    F = full * (1.0 + 0.30 * grain) * (0.94 + 0.12 * wx);
  } else if (kind < 4.5) {                                               // 4 clay (cypress, sculpture clay)
    P = uK8Paper * vec3(0.97, 0.95, 0.92) * keep * (1.0 + 0.10 * grain);
    F = full * (1.0 + 0.14 * grain);
  } else if (kind < 6.5) {                                               // 6 roof tiles
    P = mix(uK8Sand, uK8Sand * vec3(1.02, 0.88, 0.80), 0.6) * keep * (1.0 + 0.10 * grain);
    F = uK8Terra * (0.85 + 0.3 * tone) * mix(1.0, 0.8 + 0.4 * lum, 0.5);
  } else {                                                               // 7 ink strokes / 8 everything else: the old plaster, warmed
    P = uPlaster * mix(1.0, 0.72 + 0.9 * lum, uValueKeep) * vec3(1.0, 0.93, 0.83);
    F = full;
  }
  float n = pN(vPW * 0.035) - 0.5;
  float tg = max(paintG(n), k8ColMap()), tl = paintL(n), t = max(tg, tl);
  if (tl > tg) { F = clamp(mix(vec3(dot(F, vec3(0.299, 0.587, 0.114))), F, uAccent) * (0.9 + 0.1 * uAccent), 0.0, 1.0); }
  if (t <= 0.0) return P;
  if (t >= 1.0) return F;
  if (tg >= tl && tg < 0.09) return mix(P, pHue(dot(vPW, vec3(0.0011, 0.0006, 0.0013)) + n * 0.3) * 1.25, smoothstep(0.0, 0.02, tg));
  float fq = tg >= tl ? 0.2 * clamp(90.0 / uPaintW, 0.1, 1.0) : 0.2;
  float h1 = fract(dot(vPW, normalize(vec3(1.0, 0.85, 0.35))) * fq + n * 0.6);
  float h2 = fract(dot(vPW, normalize(vec3(-0.6, 1.0, 0.5))) * fq - n * 0.6);
  float cov = max(step(h1, t * 1.25 - 0.05), step(h2, t * 1.25 - 0.55));
  vec3 pencil = mix(F, pHue(dot(vPW, vec3(0.002, 0.004, 0.003)) * (fq / 0.2) + n) * 1.15, 0.65 * (1.0 - t));
  return mix(P, pencil, cov);
}`;
// soft sun shadows (PCSS: blocker search -> penumbra grows with the blocker distance): long soft shadows at golden hour.
// Directional lights only (spot lights keep three's PCF). uK8PenK = penumbra (shadow uv) per unit of shadow depth.
const K8_SHADOW_GLSL = /* glsl */`
uniform float uK8PenK, uK8Search, uK8PenMin;
const vec2 K8P[16] = vec2[16](vec2(-0.94201624,-0.39906216), vec2(0.94558609,-0.76890725), vec2(-0.09418410,-0.92938870), vec2(0.34495938,0.29387760),
  vec2(-0.91588581,0.45771432), vec2(-0.81544232,-0.87912464), vec2(-0.38277543,0.27676845), vec2(0.97484398,0.75648379),
  vec2(0.44323325,-0.97511554), vec2(0.53742981,-0.47373420), vec2(-0.26496911,-0.41893023), vec2(0.79197514,0.19090188),
  vec2(-0.24188840,0.99706507), vec2(-0.81409955,0.91437590), vec2(0.19984126,0.78641367), vec2(0.14383161,-0.14100790));
float getShadowK8( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
  if (uK8On < 0.5) return getShadow(shadowMap, shadowMapSize, shadowIntensity, shadowBias, shadowRadius, shadowCoord);
  shadowCoord.xyz /= shadowCoord.w; shadowCoord.z += shadowBias;
  if (!(all(greaterThanEqual(shadowCoord.xy, vec2(0.0))) && all(lessThanEqual(shadowCoord.xy, vec2(1.0))) && shadowCoord.z <= 1.0)) return 1.0;
  float a = 6.2831853 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  mat2 R = mat2(cos(a), sin(a), -sin(a), cos(a));
  float z = shadowCoord.z, sum = 0.0, nb = 0.0;
  for (int i = 0; i < 16; i++) { float d = unpackRGBAToDepth(texture2D(shadowMap, shadowCoord.xy + R * K8P[i] * uK8Search)); if (d < z) { sum += d; nb += 1.0; } }
  if (nb < 0.5) return 1.0;
  float pen = clamp((z - sum / nb) * uK8PenK, uK8PenMin, uK8Search);
  float lit = 0.0;
  for (int i = 0; i < 16; i++) lit += step(z, unpackRGBAToDepth(texture2D(shadowMap, shadowCoord.xy + R * K8P[i] * pen)));
  return mix(1.0, lit / 16.0, shadowIntensity);
}`;
/** k08b uniforms shared by every patched material (driven per frame by world/k08b.js) */
const _c = (h) => new THREE.Color(h);   // sRGB hex -> linear
export const K8M = {
  uK8On: { value: 0 }, uK8TealAmt: { value: 1 }, uK8Grain: { value: 1 },
  uK8Sand: { value: _c('#ecdcc4') }, uK8Paper: { value: _c('#efe5d4') }, uK8Stone: { value: _c('#eec79a') }, uK8Terra: { value: _c('#c2603e') },
  uK8Teal: { value: _c('#3aa89e') }, uK8Moss: { value: _c('#6f8f3a') }, uK8Rock: { value: _c('#d9bc98') }, uK8RockF: { value: _c('#d29a68') },
  uK8ColOn: { value: 0 }, uK8ColMap: { value: null }, uK8ColBox: { value: new THREE.Vector4(0, 0, 1, 1) },
  uK8PenK: { value: 0.1 }, uK8Search: { value: 0.004 }, uK8PenMin: { value: 0.0002 },
  uK8SunView: { value: new THREE.Vector3(0, 0, 1) }, uK8RimCol: { value: new THREE.Color(1.0, 0.72, 0.42) }, uK8Rim: { value: 0 }, uK8SkyRimCol: { value: new THREE.Color(0.45, 0.5, 0.9) },
  // --r5 column density (r5cols.js): cylinders (x, y0, z, radius) + heights whose fragments are discarded (0 = nothing culled)
  uR5CullN: { value: 0 }, uR5CullA: { value: Array.from({ length: 64 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uR5CullH: { value: new Float32Array(64) },
};
// --r5 column cull (LOOK_R5): discard fragments inside the selected columns' cylinders (see r5cols.js). Only injected with --r5.
const R5_CULL_GLSL = /* glsl */`
uniform float uR5CullN; uniform vec4 uR5CullA[64]; uniform float uR5CullH[64];
void r5Cull(){ int n = int(uR5CullN + 0.5); for (int i = 0; i < 64; i++) { if (i >= n) break; vec4 a = uR5CullA[i];
  float dx = vPW.x - a.x, dz = vPW.z - a.z; if (vPW.y > a.y - 0.5 && vPW.y < a.y + uR5CullH[i] && dx * dx + dz * dz < a.w * a.w) discard; } }`;
let R5_DEPTH = null;
/** the shadow-depth material for culled stone (so a culled column's shadow goes too); one shared instance, same uniforms */
export function r5DepthMaterial() {
  if (R5_DEPTH) return R5_DEPTH;
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uR5CullN: K8M.uR5CullN, uR5CullA: K8M.uR5CullA, uR5CullH: K8M.uR5CullH });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ mat4 mwp = modelMatrix;\n#ifdef USE_INSTANCING\n mwp = modelMatrix * instanceMatrix;\n#endif\n vPW = (mwp * vec4(position, 1.0)).xyz; }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vPW;\n' + R5_CULL_GLSL)
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n r5Cull();');
  };
  m.customProgramCacheKey = () => 'r5depth';
  R5_DEPTH = m; return m;
}
/** material kind by its plaster tag (Team B's PLASTER tables): drives the k08b stone / rock / meadow look */
const K8_KIND = { 0xf4efe6: 1, 0xf7f2e8: 1, 0xd9ccb4: 2, 0xe6dcc8: 3, 0xe2d6c0: 4, 0xeee5d4: 5, 0xe9dcc6: 6, 0xece4d4: 7 };
export function k8KindOf(mat, opts = {}) { if (opts.k8kind != null) return opts.k8kind; if (mat.userData.k8kind != null) return mat.userData.k8kind; const p = opts.plaster ?? mat.userData.plaster; return K8_KIND[p] ?? 8; }

export function patchPaint(mat, opts = {}) {
  if (mat.userData.lp) return mat;
  const prev = mat.onBeforeCompile;
  const U = {
    uPlaster: { value: new THREE.Color(opts.plaster ?? mat.userData.plaster ?? 0xe9e3d6) },
    uNoPaint: { value: (opts.noPaint || mat.userData.noPaint) ? 1 : 0 },
    uLS: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(0, 0, 0, -1)) },
    uLSW: { value: 30 }, uLY: { value: new THREE.Vector2(0, 0) }, uLAll: { value: 0 },
    uCapA: { value: new THREE.Vector4(0, 0, 0, -1) }, uCapB: { value: new THREE.Vector3() },
    uGlow: { value: 0 }, uGlowC: { value: new THREE.Color(1, 1, 1) },
  };
  const hero = !!opts.hero;
  const k8 = LOOKCFG.k08b; const K8K = { uK8Kind: { value: k8 ? k8KindOf(mat, opts) : 0 } };
  const cull = !!(k8 && LOOKCFG.r5 && !hero && !(opts.noPaint || mat.userData.noPaint));   // --r5: column cull on world materials (never heroes / always-coloured props)
  const heroMask = !!(k8 && LOOKCFG.r5 && hero);   // --r5: heroes / creatures write alpha 0.5 into the scene target = the mask the two-colour grade skips (canon colours stay as painted)
  if (cull) mat.userData.r5cull = true;
  if (k8) mat.userData.k8u = K8K;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    if (hero) Object.assign(sh.uniforms, HERO_U);
    if (k8) Object.assign(sh.uniforms, K8M, K8K);
    Object.assign(sh.uniforms, U, PAINT_U, { uFlat: G.uFlat, uPaintC: G.uPaintC, uPaintR: G.uPaintR, uPaintW: G.uPaintW, uValueKeep: G.uValueKeep });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPW;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { mat4 mwp = modelMatrix;
          #ifdef USE_INSTANCING
            mwp = modelMatrix * instanceMatrix;
          #endif
          vPW = (mwp * vec4(position, 1.0)).xyz; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + PAINT_GLSL + (k8 ? K8_PAINT_GLSL : '') + (cull ? R5_CULL_GLSL : ''))
      .replace('#include <clipping_planes_fragment>', cull ? '#include <clipping_planes_fragment>\n r5Cull();' : '#include <clipping_planes_fragment>')
      .replace('#include <color_fragment>', k8 ? '#include <color_fragment>\n diffuseColor.rgb = applyPaintK8(diffuseColor.rgb);' : '#include <color_fragment>\n diffuseColor.rgb = applyPaint(diffuseColor.rgb);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uGlowC * uGlow;')
      .replace('#include <common>', hero ? '#include <common>\nuniform float uHeroFill, uHeroRim; uniform vec3 uRimCol;' : '#include <common>')
      .replace('#include <opaque_fragment>', `
        ${hero ? `{ vec3 vV = normalize(vViewPosition); float nv = max(dot(normal, vV), 0.0);
          outgoingLight += diffuseColor.rgb * uHeroFill * (0.35 + 0.65 * nv) + uRimCol * uHeroRim * pow(1.0 - nv, 3.0) * 0.6; }` : ''}
        ${hero && k8 ? `if (uK8On > 0.5) { vec3 vV = normalize(vViewPosition); float nv = max(dot(normal, vV), 0.0); float fr = pow(1.0 - nv, 2.6);
          float ss = clamp(dot(normal, uK8SunView) * 0.5 + 0.5, 0.0, 1.0);   // k08b rim: warm on the sun side of the silhouette, cool sky on the other
          outgoingLight += (uK8RimCol * smoothstep(0.35, 0.95, ss) + uK8SkyRimCol * 0.3 * (1.0 - ss)) * fr * uK8Rim; }` : ''}
        { float fs = 0.86 + 0.14 * clamp(dot(normal, normalize(vec3(-0.35, 0.55, 0.75))), 0.0, 1.0);
          outgoingLight = mix(outgoingLight, diffuseColor.rgb * fs + totalEmissiveRadiance, uFlat); }
        #include <opaque_fragment>` + (heroMask ? '\n        gl_FragColor.a = 0.5;' : ''));
  };
  if (k8) { const pb = mat.onBeforeCompile; mat.onBeforeCompile = (sh, r) => { pb(sh, r);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <shadowmap_pars_fragment>', THREE.ShaderChunk.shadowmap_pars_fragment + '\n#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0\n' + K8_SHADOW_GLSL + '\n#endif\n')
      .replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.replace('getShadow( directionalShadowMap[ i ]', 'getShadowK8( directionalShadowMap[ i ]'))
      .replace('uniform float uK8On, uK8Kind', 'uniform float uK8Kind').replace('#include <common>', '#include <common>\nuniform float uK8On;\nuniform vec3 uK8SunView, uK8RimCol, uK8SkyRimCol; uniform float uK8Rim;'); }; }
  const prevKey = mat.customProgramCacheKey && mat.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? mat.customProgramCacheKey() : (prev ? prev.toString() : '');
  mat.customProgramCacheKey = () => prevKey + '|act3paint' + (hero ? '|hero' : '') + (k8 ? '|k8' : '') + (cull ? '|r5cull' : '') + (heroMask ? '|r5hero' : '');
  const lp = {
    U,
    sphere(i, x, y, z, r) { U.uLS.value[i].set(x, y, z, r); return lp; },
    clearSpheres() { for (const v of U.uLS.value) v.set(0, 0, 0, -1); return lp; },
    edge(w) { U.uLSW.value = w; return lp; },
    capsule(a, b, r) { U.uCapA.value.set(a.x, a.y, a.z, r); U.uCapB.value.copy(b); return lp; },
    wipe(y, edge = 20) { U.uLY.value.set(y, edge); return lp; },
    all(v) { U.uLAll.value = v; return lp; },
    glow(v, c) { U.uGlow.value = v; if (c) U.uGlowC.value.set(c); return lp; },
    /** add a sphere in the first free slot (returns false if full) */
    addSphere(x, y, z, r) { for (const v of U.uLS.value) if (v.w < 0) { v.set(x, y, z, Math.max(1e-3, r)); return true; } return false; },
    reset() { lp.clearSpheres(); U.uLY.value.set(0, 0); U.uLAll.value = 0; U.uGlow.value = 0; U.uCapA.value.w = -1; U.uLSW.value = 30; return lp; },
  };
  mat.userData.lp = lp; mat.userData.flatPatched = true;
  return mat;
}

/** Patch every Standard material under root (skips already patched ones). Returns the list of local-paint handles. */
export function patchTree(root, opts = {}) {
  const out = [];
  root.traverse((o) => {
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) if (m.isMeshStandardMaterial && !m.userData.lp) { patchPaint(m, { noPaint: o.userData.noPaint, ...opts }); out.push(m.userData.lp); }
  });
  return out;
}
