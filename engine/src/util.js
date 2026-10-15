// Deterministic helpers: seeded RNG, value noise, easing, and the global
// "flat <-> lit" material patch used by the 2D/3D blend.
import * as THREE from 'three';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hash2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, oct = 4, s = 0) { let a = 0.5, f = 1, sum = 0; for (let i = 0; i < oct; i++) { sum += a * vnoise(x * f, y * f, s + i * 17); a *= 0.5; f *= 2.03; } return sum; }

export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const smootherstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Global uniforms shared by every patched material.
//   uFlat   1 = unlit albedo (2D CARTRIDGE look), 0 = PBR
//   PAINT   the "functions 上色" colour flood: world starts as white plaster / clay
//           ("fixtures only"); a spherical wavefront from uPaintC with radius uPaintR
//           and a coloured-pencil HATCHED edge of width uPaintW turns it full colour.
export const G = {
  uFlat: { value: 1 },
  uPaintC: { value: new THREE.Vector3(0, 0, 0) },
  uPaintR: { value: -1 },        // < 0: nothing painted
  uPaintW: { value: 90 },
  uValueKeep: { value: 0.35 },   // how much of the hidden colour's value survives in plaster
};

const PAINT_GLSL = /* glsl */`
uniform float uFlat, uPaintR, uPaintW, uValueKeep, uNoPaint, uPaintBias; uniform vec3 uPaintC, uPlaster;
varying vec3 vPW;
float pH(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float pN(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(pH(i), pH(i+vec3(1,0,0)), f.x), mix(pH(i+vec3(0,1,0)), pH(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(pH(i+vec3(0,0,1)), pH(i+vec3(1,0,1)), f.x), mix(pH(i+vec3(0,1,1)), pH(i+vec3(1,1,1)), f.x), f.y), f.z); }
vec3 pHue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
// returns colour after the plaster/paint decision
vec3 applyPaint(vec3 full){
  if (uNoPaint > 0.5) return full;
  float lum = dot(full, vec3(0.299, 0.587, 0.114));
  vec3 plaster = uPlaster * mix(1.0, 0.72 + 0.9 * lum, uValueKeep) * mix(1.0, 0.84, uFlat);
  float d = uPaintR - distance(vPW, uPaintC);
  float n = pN(vPW * 0.035) - 0.5;
  float t = clamp((d + n * uPaintW * 0.8) / uPaintW, 0.0, 1.0);
  t = max(t, uPaintBias);
  if (t <= 0.0) return plaster;
  if (t >= 1.0) return full;
  // coloured-pencil hatching: two diagonal line sets whose coverage grows with t
  float h1 = fract(dot(vPW, normalize(vec3(1.0, 0.85, 0.35))) * 0.2 + n * 0.6);
  float h2 = fract(dot(vPW, normalize(vec3(-0.6, 1.0, 0.5))) * 0.2 - n * 0.6);
  float cov = max(step(h1, t * 1.25 - 0.05), step(h2, t * 1.25 - 0.55));
  vec3 pencil = mix(full, pHue(dot(vPW, vec3(0.002, 0.004, 0.003)) + n), 0.55 * (1.0 - t));
  return mix(plaster, pencil, cov);
}`;

/** Patch a built-in material: flat 2D look switch (uFlat) + plaster/paint wavefront.
 *  opts: { plaster: Color (clay tint), noPaint: bool (heroes, ink keep their colour) } */
export function patchFlat(mat, opts = {}) {
  const prev = mat.onBeforeCompile;
  const U = { uPlaster: { value: new THREE.Color(opts.plaster ?? 0xe9e3d6) }, uNoPaint: { value: opts.noPaint ? 1 : 0 }, uPaintBias: { value: 0 } };
  mat.userData.paint = U;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    Object.assign(sh.uniforms, U, { uFlat: G.uFlat, uPaintC: G.uPaintC, uPaintR: G.uPaintR, uPaintW: G.uPaintW, uValueKeep: G.uValueKeep });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPW;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        { mat4 mwp = modelMatrix;
          #ifdef USE_INSTANCING
            mwp = modelMatrix * instanceMatrix;
          #endif
          vPW = (mwp * vec4(position, 1.0)).xyz; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + PAINT_GLSL)
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = applyPaint(diffuseColor.rgb);')
      .replace('#include <opaque_fragment>', `
        { float fs = 0.86 + 0.14 * clamp(dot(normal, normalize(vec3(-0.35, 0.55, 0.75))), 0.0, 1.0);
          outgoingLight = mix(outgoingLight, diffuseColor.rgb * fs + totalEmissiveRadiance, uFlat); }
        #include <opaque_fragment>`);
  };
  // program cache key must differ per distinct shader patch (three's default key is
  // onBeforeCompile.toString(), which is now our wrapper for every material)
  const prevKey = mat.customProgramCacheKey && mat.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? mat.customProgramCacheKey() : (prev ? prev.toString() : '');
  mat.customProgramCacheKey = () => prevKey + '|flatpaint';
  return mat;
}

/** Walk a scene and patch every Standard/Lambert/Phong material once. */
export function patchSceneFlat(root) {
  root.traverse((o) => {
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) if (!m.userData.flatPatched && (m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) {
      patchFlat(m, { plaster: m.userData.plaster, noPaint: m.userData.noPaint || o.userData.noPaint }); m.userData.flatPatched = true; }
  });
}
