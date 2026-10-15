// Post-processing chain (all deterministic, driven by uniforms):
//   scene -> rtScene (HDR, MSAA, depth texture)
//   -> GTAO (ambient occlusion, 3D only)
//   -> ATMOS: height fog / aerial perspective with sun in-scatter + screen-space god rays
//   -> DOF (depth-based gather blur)            -> rtA
//   -> UnrealBloom (adds into rtA)
//   -> FINAL: tone-map blend (none <-> ACES) + grade + vignette + grain
//             + PIXELATE (block size uPix, point-sampled at block centres)
//             + depth outline + palette quantisation (3D LUT, ordered dither)
//   -> canvas
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SKY_GLSL, envUniforms } from './env.js';

// ------------------------------------------------------------- palette LUT
function srgbToOklab([r, g, b]) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  r = lin(r); g = lin(g); b = lin(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export function buildPaletteLUT(hexes, N = 32) {
  const pal = hexes.map((h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; }); // THREE.Color(hex) stores linear; convert back
  const palS = hexes.map((h) => { const v = parseInt(h.replace('#', ''), 16); return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255]; });
  const labs = palS.map(srgbToOklab);
  const data = new Uint8Array(N * N * N * 4);
  for (let b = 0; b < N; b++) for (let g = 0; g < N; g++) for (let r = 0; r < N; r++) {
    const L = srgbToOklab([r / (N - 1), g / (N - 1), b / (N - 1)]);
    let best = 0, bd = 1e9;
    for (let k = 0; k < labs.length; k++) {
      const dl = (L[0] - labs[k][0]) * 1.0, da = L[1] - labs[k][1], db = L[2] - labs[k][2];
      const d = dl * dl + da * da + db * db; if (d < bd) { bd = d; best = k; }
    }
    const i = ((b * N + g) * N + r) * 4; const c = palS[best];
    data[i] = Math.round(c[0] * 255); data[i + 1] = Math.round(c[1] * 255); data[i + 2] = Math.round(c[2] * 255); data[i + 3] = 255;
  }
  void pal;
  const tex = new THREE.Data3DTexture(data, N, N, N);
  tex.format = THREE.RGBAFormat; tex.type = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.unpackAlignment = 1; tex.needsUpdate = true;
  return tex;
}

const LUT_CACHE = new Map();
const DEPTH_GLSL = /* glsl */`
uniform float uNear, uFar, uOrtho;
float viewDist(float d){
  if (uOrtho > 0.5) return uNear + d * (uFar - uNear);
  float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}`;

export class Post {
  constructor(renderer, w, h) {
    this.r = renderer; this.w = w; this.h = h;
    const dt = new THREE.DepthTexture(w, h); dt.type = THREE.FloatType;
    this.rtScene = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4, depthTexture: dt });
    this.rtA = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });
    this.rtB = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });
    this.rtRays = new THREE.WebGLRenderTarget(w >> 1, h >> 1, { type: THREE.HalfFloatType });
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.35, 0.6, 0.9);
    this.gtao = null; // created in setScene (needs scene + a perspective camera)

    const VS = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
    const RECON = /* glsl */`
      uniform mat4 uInvProj, uCamWorld; uniform vec3 uCamPos;
      vec3 worldAt(vec2 uv, float d){ vec4 v = uInvProj * vec4(uv*2.0-1.0, d*2.0-1.0, 1.0); v /= v.w; return (uCamWorld * v).xyz; }`;
    const camU = () => ({ uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() } });
    this.raysMat = new THREE.ShaderMaterial({
      uniforms: { ...envUniforms, ...camU(), tDepth: { value: null }, uSunUV: { value: new THREE.Vector2() }, uAspect: { value: w / h }, uOn: { value: 0 } },
      vertexShader: VS,
      fragmentShader: RECON + /* glsl */`
        uniform sampler2D tDepth; uniform vec3 uSunDir; uniform vec2 uSunUV; uniform float uAspect, uOn; varying vec2 vUv;
        float h12(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        float mask(vec2 uv){
          if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) uv = clamp(uv, 0.0, 1.0);
          float d = texture2D(tDepth, uv).x; if (d < 0.99999) return 0.0;
          vec3 rd = normalize(worldAt(uv, 0.5) - uCamPos);
          float mu = max(dot(rd, uSunDir), 0.0); return pow(mu, 40.0) + 0.15 * pow(mu, 12.0);
        }
        void main(){
          if (uOn <= 0.0) { gl_FragColor = vec4(0.0); return; }
          vec2 dv = uSunUV - vUv; float L = length(dv * vec2(uAspect, 1.0));
          dv *= min(1.0, 0.9 / max(L, 1e-4));
          const int N = 72; vec2 st = dv / float(N);
          vec2 uv = vUv + st * h12(gl_FragCoord.xy);
          float acc = 0.0, dec = 1.0;
          for (int i = 0; i < N; i++) { acc += mask(uv) * dec; dec *= 0.975; uv += st; }
          gl_FragColor = vec4(vec3(acc / float(N)), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.raysQuad = new FullScreenQuad(this.raysMat);
    this.atmosMat = new THREE.ShaderMaterial({
      uniforms: { ...envUniforms, ...camU(), tColor: { value: null }, tDepth: { value: null }, tRays: { value: null },
        uAtmos: { value: 0 }, uDistOffset: { value: 0 }, uDensity: { value: 0.00035 }, uHeightFall: { value: 0.004 }, uSeaY: { value: -200 }, uRays: { value: 0 } },
      vertexShader: VS,
      fragmentShader: SKY_GLSL + RECON + /* glsl */`
        uniform sampler2D tColor, tDepth, tRays; uniform float uAtmos, uDistOffset, uDensity, uHeightFall, uSeaY, uRays; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tColor, vUv).rgb;
          float d = texture2D(tDepth, vUv).x;
          if (d < 0.99999 && uAtmos > 0.0) {
            vec3 wp = worldAt(vUv, d); vec3 dv = wp - uCamPos; float dist = length(dv); vec3 rd = dv / dist;
            float eff = max(dist - uDistOffset, 0.0);
            float hAvg = max(mix(uCamPos.y, wp.y, 0.6) - uSeaY, 0.0);
            float dens = uDensity * exp(-hAvg * uHeightFall);
            float f = 1.0 - exp(-eff * dens);
            float mu = max(dot(rd, uSunDir), 0.0);
            vec3 ins = skyBase(normalize(vec3(rd.x, max(rd.y, 0.0) * 0.25 + 0.015, rd.z)));
            ins += sunColor() * (pow(mu, 8.0) * 0.25 + pow(mu, 60.0) * 0.6);
            c = mix(c, ins, f * uAtmos);
          }
          c += sunColor() * vec3(1.6, 1.25, 1.0) * texture2D(tRays, vUv).r * uRays;
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.atmosQuad = new FullScreenQuad(this.atmosMat);

    this.dofMat = new THREE.ShaderMaterial({
      uniforms: { tColor: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2(w, h) },
        uNear: { value: 1 }, uFar: { value: 1000 }, uOrtho: { value: 0 }, uFocus: { value: 300 }, uAperture: { value: 0 }, uMaxR: { value: 10 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader: DEPTH_GLSL + /* glsl */`
        uniform sampler2D tColor, tDepth; uniform vec2 uRes; uniform float uFocus, uAperture, uMaxR; varying vec2 vUv;
        float coc(vec2 uv){ float z = viewDist(texture2D(tDepth, uv).x); return clamp(uAperture * abs(z - uFocus) / z, 0.0, 1.0) * uMaxR; }
        vec3 sane(vec3 c){ return (any(isnan(c)) || any(isinf(c))) ? vec3(0.0) : min(max(c, 0.0), vec3(64.0)); }
        void main(){
          vec4 c0 = texture2D(tColor, vUv); c0.rgb = sane(c0.rgb);   // NaN/Inf guard (protects bloom mips)
          if (uAperture <= 0.0) { gl_FragColor = c0; return; }
          float r0 = coc(vUv);
          vec3 acc = c0.rgb; float wsum = 1.0;
          const int N = 32; const float GA = 2.39996323;
          for (int i = 1; i < N; i++) {
            float fi = float(i); float rr = sqrt(fi / float(N)); float th = fi * GA;
            vec2 off = vec2(cos(th), sin(th)) * rr * uMaxR / uRes;
            vec2 uv = vUv + off;
            float rs = coc(uv);
            // sample contributes if its own CoC reaches us (background can't bleed over sharp foreground)
            float w = smoothstep(rr * uMaxR - 1.0, rr * uMaxR + 0.5, max(min(rs, r0 + 2.0), 0.0));
            acc += sane(texture2D(tColor, uv).rgb) * w; wsum += w;
          }
          gl_FragColor = vec4(acc / wsum, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.dofQuad = new FullScreenQuad(this.dofMat);

    this.finalMat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null }, tDepth: { value: null }, tLut: { value: null }, uRes: { value: new THREE.Vector2(w, h) },
        uNear: { value: 1 }, uFar: { value: 1000 }, uOrtho: { value: 1 },
        uPix: { value: 6 }, uPalMix: { value: 1 }, uDither: { value: 0.5 }, uOutline: { value: 1 }, uOutlineDepth: { value: 4 },
        uTone: { value: 0 }, uExposure: { value: 1 }, uFlatGain: { value: 1 }, uVignette: { value: 0 }, uGrain: { value: 0 }, uTime: { value: 0 },
        uGrade: { value: 0 }, uSat: { value: 1 }, uContrast: { value: 1 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader: DEPTH_GLSL + /* glsl */`
        precision highp sampler3D;
        uniform sampler2D tColor, tDepth; uniform sampler3D tLut; uniform vec2 uRes;
        uniform float uPix, uPalMix, uDither, uOutline, uOutlineDepth, uTone, uExposure, uFlatGain, uVignette, uGrain, uTime, uGrade, uSat, uContrast;
        varying vec2 vUv;
        vec3 RRTAndODTFit(vec3 v){ vec3 a = v*(v+0.0245786)-0.000090537; vec3 b = v*(0.983729*v+0.4329510)+0.238081; return a/b; }
        vec3 aces(vec3 color){
          const mat3 ACESInputMat = mat3(vec3(0.59719,0.07600,0.02840), vec3(0.35458,0.90834,0.13383), vec3(0.04823,0.01566,0.83777));
          const mat3 ACESOutputMat = mat3(vec3(1.60475,-0.10208,-0.00327), vec3(-0.53108,1.10813,-0.07276), vec3(-0.07367,-0.00605,1.07602));
          color *= uExposure / 0.6; color = ACESInputMat*color; color = RRTAndODTFit(color); color = ACESOutputMat*color; return clamp(color,0.0,1.0);
        }
        vec3 toSRGB(vec3 c){ c = max(c, 0.0); return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4))-0.055, step(0.0031308, c)); }
        float bayer4(vec2 p){ ivec2 q = ivec2(mod(p, 4.0)); int i = q.x + q.y*4;
          float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.); return (m[i] + 0.5) / 16.0; }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime*3.17) * 43758.5453); }
        vec3 shade(vec2 uv){
          vec3 hdr = texture2D(tColor, uv).rgb;
          if (any(isnan(hdr)) || any(isinf(hdr))) hdr = vec3(0.0);
          vec3 flatc = clamp(hdr * uFlatGain, 0.0, 1.0);
          vec3 lin = mix(flatc, aces(hdr), uTone);
          vec3 s = toSRGB(lin);
          // grade (3D): gentle S-curve, warm highlights / teal-ish shadows, saturation
          float l = dot(s, vec3(0.299,0.587,0.114));
          vec3 g = mix(vec3(l), s, uSat);
          g = (g - 0.5) * uContrast + 0.5;
          g += uGrade * (vec3(0.035, 0.012, -0.03) * smoothstep(0.4, 1.0, l) + vec3(-0.02, 0.0, 0.03) * (1.0 - smoothstep(0.0, 0.4, l)));
          return clamp(g, 0.0, 1.0);
        }
        void main(){
          vec2 frag = vUv * uRes;
          vec2 cell = floor(frag / uPix);
          vec2 cpx = (cell + 0.5) * uPix;
          vec2 uv = uPix > 1.01 ? cpx / uRes : vUv;
          vec3 col = shade(uv);
          // depth outline at block resolution: darken where a neighbour block is much farther
          if (uOutline > 0.0) {
            float d0 = viewDist(texture2D(tDepth, uv).x); float dmax = 0.0;
            vec2 o = vec2(uPix) / uRes;
            dmax = max(dmax, viewDist(texture2D(tDepth, uv + vec2(o.x,0.)).x) - d0);
            dmax = max(dmax, viewDist(texture2D(tDepth, uv - vec2(o.x,0.)).x) - d0);
            dmax = max(dmax, viewDist(texture2D(tDepth, uv + vec2(0.,o.y)).x) - d0);
            dmax = max(dmax, viewDist(texture2D(tDepth, uv - vec2(0.,o.y)).x) - d0);
            float e = step(uOutlineDepth, dmax);
            col = mix(col, col * vec3(0.30, 0.27, 0.36), e * uOutline);
          }
          // palette quantisation with ordered dither in block space
          if (uPalMix > 0.0) {
            float b = bayer4(cell) - 0.5;
            vec3 dc = clamp(col + b * uDither * 0.09, 0.0, 1.0);
            vec3 q = texture(tLut, dc * (31.0/32.0) + 0.5/32.0).rgb;
            col = mix(col, q, uPalMix);
          }
          // vignette + grain (full-res, 3D only)
          vec2 vv = vUv - 0.5; vv.x *= uRes.x / uRes.y;
          col *= 1.0 - uVignette * smoothstep(0.35, 1.05, length(vv));
          col += (hash(frag) - 0.5) * uGrain;
          gl_FragColor = vec4(col, 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    this.finalQuad = new FullScreenQuad(this.finalMat);
    this.params = { dof: 0, focus: 300, bloom: 0.35, ao: 0, atmos: 0, distOffset: 0, rays: 0 };
  }
  setScene(scene, perspCamera) {
    this.gtao = new GTAOPass(scene, perspCamera, this.w, this.h);
    const g = this.gtao, cache = g._visibilityCache;
    g.overrideVisibility = () => scene.traverse((o) => { cache.set(o, o.visible); if (o.isPoints || o.isLine || o.userData.noAO) o.visible = false; });
    g.updateGtaoMaterial({ radius: 7, distanceExponent: 1.6, thickness: 4, scale: 1.25, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
    g.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  }
  setPalette(hexes) {
    const key = hexes.join(',');
    if (!LUT_CACHE.has(key)) LUT_CACHE.set(key, buildPaletteLUT(hexes));
    this.finalMat.uniforms.tLut.value = LUT_CACHE.get(key);
  }
  /** Reset the look to the flat 2D CARTRIDGE defaults (no tone map, no AO/atmos/DOF/bloom). */
  set2D({ pix = 6, palMix = 0, dither = 0.35, outline = 0, exposure = 1 } = {}) {
    const F = this.finalMat.uniforms;
    F.uPix.value = pix; F.uPalMix.value = palMix; F.uDither.value = dither; F.uOutline.value = outline; F.uTone.value = 0;
    F.uExposure.value = exposure; F.uFlatGain.value = 1; F.uVignette.value = 0; F.uGrain.value = 0; F.uGrade.value = 0; F.uSat.value = 1; F.uContrast.value = 1;
    Object.assign(this.params, { dof: 0, bloom: 0, ao: 0, atmos: 0, rays: 0, distOffset: 0 });
  }
  /** target: null = canvas, or a WebGLRenderTarget (used by the show runner for transitions). */
  render(scene, camera, target = null) {
    const r = this.r; const U = this.finalMat.uniforms, D = this.dofMat.uniforms, A = this.atmosMat.uniforms, R = this.raysMat.uniforms;
    const ortho = camera.isOrthographicCamera ? 1 : 0;
    for (const u of [U, D]) { u.uNear.value = camera.near; u.uFar.value = camera.far; u.uOrtho.value = ortho; }
    for (const u of [A, R]) { u.uInvProj.value.copy(camera.projectionMatrixInverse); u.uCamWorld.value.copy(camera.matrixWorld); u.uCamPos.value.setFromMatrixPosition(camera.matrixWorld); }
    r.setRenderTarget(this.rtScene); r.clear(); r.render(scene, camera);
    let src = this.rtScene;
    // ambient occlusion
    if (this.gtao && this.params.ao > 0.001 && camera.isPerspectiveCamera) {
      this.gtao.camera = camera; this.gtao.blendIntensity = this.params.ao;
      this.gtao.render(r, this.rtB, this.rtScene); src = this.rtB;
    }
    // god rays (half res) toward the sun's screen position
    const sunW = new THREE.Vector3().copy(envUniforms.uSunDir.value).multiplyScalar(1e4).add(A.uCamPos.value);
    const sp = sunW.clone().applyMatrix4(camera.matrixWorldInverse); const inFront = sp.z < 0;
    sunW.project(camera);
    R.uSunUV.value.set(sunW.x * 0.5 + 0.5, sunW.y * 0.5 + 0.5);
    const raysOn = this.params.rays > 0.001 && inFront && camera.isPerspectiveCamera;
    R.uOn.value = raysOn ? 1 : 0; R.tDepth.value = this.rtScene.depthTexture;
    if (raysOn) { r.setRenderTarget(this.rtRays); this.raysQuad.render(r); }
    // atmosphere (skipped entirely in flat 2D: no fog, no rays)
    let dst = src;
    if (this.params.atmos > 0.001 || raysOn) {
      A.tColor.value = src.texture; A.tDepth.value = this.rtScene.depthTexture; A.tRays.value = this.rtRays.texture;
      A.uAtmos.value = this.params.atmos; A.uDistOffset.value = this.params.distOffset; A.uRays.value = raysOn ? this.params.rays : 0;
      dst = src === this.rtB ? this.rtA : this.rtB;
      r.setRenderTarget(dst); this.atmosQuad.render(r);
    }
    // DOF
    let dof = dst;
    if (this.params.dof > 0.0001 || this.params.bloom > 0.001) { // bloom always reads a sanitised copy (R-D3)
      D.tColor.value = dst.texture; D.tDepth.value = this.rtScene.depthTexture;
      D.uAperture.value = this.params.dof; D.uFocus.value = this.params.focus;
      dof = dst === this.rtA ? this.rtB : this.rtA;
      r.setRenderTarget(dof); this.dofQuad.render(r);
    }
    if (this.params.bloom > 0.001) {
      if (dof === this.rtScene) { // bloom must not write into the MSAA scene target: copy via the dof pass at aperture 0
        D.tColor.value = dof.texture; D.uAperture.value = 0; r.setRenderTarget(this.rtA); this.dofQuad.render(r); dof = this.rtA;
      }
      this.bloom.strength = this.params.bloom; this.bloom.render(r, null, dof, 0, false);
    }
    U.tColor.value = dof.texture; U.tDepth.value = this.rtScene.depthTexture;
    r.setRenderTarget(target); this.finalQuad.render(r);
  }
}
