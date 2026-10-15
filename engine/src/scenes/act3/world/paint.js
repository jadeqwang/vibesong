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
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    if (hero) Object.assign(sh.uniforms, HERO_U);
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
      .replace('#include <common>', '#include <common>\n' + PAINT_GLSL)
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = applyPaint(diffuseColor.rgb);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uGlowC * uGlow;')
      .replace('#include <common>', hero ? '#include <common>\nuniform float uHeroFill, uHeroRim; uniform vec3 uRimCol;' : '#include <common>')
      .replace('#include <opaque_fragment>', `
        ${hero ? `{ vec3 vV = normalize(vViewPosition); float nv = max(dot(normal, vV), 0.0);
          outgoingLight += diffuseColor.rgb * uHeroFill * (0.35 + 0.65 * nv) + uRimCol * uHeroRim * pow(1.0 - nv, 3.0) * 0.6; }` : ''}
        { float fs = 0.86 + 0.14 * clamp(dot(normal, normalize(vec3(-0.35, 0.55, 0.75))), 0.0, 1.0);
          outgoingLight = mix(outgoingLight, diffuseColor.rgb * fs + totalEmissiveRadiance, uFlat); }
        #include <opaque_fragment>`);
  };
  const prevKey = mat.customProgramCacheKey && mat.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? mat.customProgramCacheKey() : (prev ? prev.toString() : '');
  mat.customProgramCacheKey = () => prevKey + '|act3paint' + (hero ? '|hero' : '');
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
