// Sky dome, sea plane and image-based lighting. Pure functions of uniforms
// (sun dir, uTime=t) -> deterministic.
import * as THREE from 'three';

export const SKY_GLSL = /* glsl */`
uniform vec3 uSunDir;
uniform float uTime;
uniform float uSkyWarm;   // 0 = clear day-ish, 1 = deep golden hour
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return s; }
vec3 sunColor(){ return vec3(1.0, 0.62, 0.30); }
vec3 skyBase(vec3 dir){
  float h = dir.y;
  float mu = max(dot(dir, uSunDir), 0.0);
  vec2 dh = normalize(dir.xz + 1e-5), sh = normalize(uSunDir.xz + 1e-5);
  float side = pow(dot(dh, sh) * 0.5 + 0.5, 2.0);           // 1 toward the sun's azimuth
  vec3 zenith  = vec3(0.075, 0.17, 0.40);
  vec3 midAway = vec3(0.32, 0.42, 0.66), midSun = vec3(0.78, 0.62, 0.55);
  vec3 hzAway  = vec3(0.82, 0.58, 0.58), hzSun  = vec3(1.45, 0.72, 0.32);
  vec3 hz = mix(hzAway, hzSun, side), md = mix(midAway, midSun, side * 0.75);
  float hh = max(h, 0.0);
  vec3 c = mix(hz, md, smoothstep(0.0, 0.16, hh));
  c = mix(c, zenith, smoothstep(0.10, 0.65, hh));
  // sun halo: tight, saturated (keeps the sky around the sun from washing to white)
  c += vec3(1.3, 0.55, 0.18) * pow(mu, 10.0) * 0.38;
  c += vec3(1.6, 0.95, 0.45) * pow(mu, 120.0) * 1.6;
  if (h < 0.0) c = mix(hz * 0.9, vec3(0.30, 0.26, 0.30), smoothstep(0.0, -0.25, h));
  return c;
}
// altocumulus layer on a virtual plane, lit from the sun side
vec4 clouds(vec3 dir){
  if (dir.y <= 0.0) return vec4(0.0);
  vec2 uv = dir.xz / (dir.y + 0.06) * 1.3 + vec2(uTime * 0.012, uTime * 0.004);
  float n = fbm(uv * 1.1) * 0.65 + fbm(uv * 3.7 + 4.0) * 0.35;
  float cov = smoothstep(0.50, 0.78, n);
  cov *= smoothstep(0.015, 0.10, dir.y) * (1.0 - smoothstep(0.35, 0.8, dir.y));
  float mu = max(dot(dir, uSunDir), 0.0);
  float thick = smoothstep(0.55, 0.95, n);
  vec3 lit = vec3(1.7, 1.0, 0.55) * (0.6 + 1.6 * pow(mu, 6.0));
  vec3 shade = vec3(0.50, 0.40, 0.48);
  vec3 col = mix(lit, shade, thick * 0.75) ;
  col += vec3(1.8, 1.0, 0.45) * pow(mu, 30.0) * (1.0 - thick) * 2.0; // silver lining
  return vec4(col, cov * 0.85);
}
vec3 skyColor(vec3 dir, bool withSun){
  vec3 c = skyBase(dir);
  vec4 cl = clouds(dir);
  c = mix(c, cl.rgb, cl.a);
  if (withSun) c += vec3(40.0, 26.0, 13.0) * smoothstep(0.99986, 0.99993, dot(dir, uSunDir)) * (1.0 - cl.a);
  return c;
}`;

// ---------------------------------------------------------------- k08b world look (opt-in: render.js --look k08b)
// LOOKCFG is set by LookPass (src/look.js) in ENGINE.init, before any scene builds, so world builders can branch at build
// time. Without the flag nothing below is used and every shader string is the original one (default renders unchanged).
export const LOOKCFG = { name: null, k08b: false,
  /** round 5 flag (default ON since v4; render.js --r5 0 -> ?r5=0 opts out; same test as act3/common.js R5()): the LOOK_R5 preset (src/look.js) is a layer on k08b */
  r5: (() => { try { if (new URLSearchParams(globalThis.location?.search || '').get('r5') === '0') return false; } catch (e) { /* no location */ } return globalThis.R5 !== false; })() };
/** the second half starts here; the k08b world look is only ever switched on for t >= H2_T0 (half 1 stays as approved) */
export const H2_T0 = 86.385;
const c3 = (r, g, b) => ({ value: new THREE.Vector3(r, g, b) });
/** k08b sky / light uniforms, driven per frame from the time-of-day table (src/scenes/act3/world/k08b.js todAt) */
export const K8U = {
  uK8: { value: 0 },                       // 1 = k08b sky on (t >= H2_T0 and --look k08b)
  uK8Zen: c3(0.10, 0.06, 0.30), uK8Hi: c3(0.30, 0.15, 0.50), uK8MidSun: c3(1.05, 0.50, 0.42), uK8MidAway: c3(0.52, 0.30, 0.62),
  uK8HzSun: c3(1.60, 0.78, 0.34), uK8HzAway: c3(0.95, 0.55, 0.62),
  uK8CloudLit: c3(1.45, 0.86, 0.62), uK8CloudShade: c3(0.42, 0.28, 0.52), uK8CloudCov: { value: 0.5 },
  uK8SunCol: c3(1.0, 0.62, 0.30), uK8Halo: { value: 1 },
};
const K8_GLSL = /* glsl */`
uniform float uK8, uK8CloudCov, uK8Halo; uniform vec3 uK8Zen, uK8Hi, uK8MidSun, uK8MidAway, uK8HzSun, uK8HzAway, uK8CloudLit, uK8CloudShade, uK8SunCol;
vec3 sunColor(){ return uK8 > 0.5 ? uK8SunCol : sunColor0(); }
vec3 skyBase(vec3 dir){
  if (uK8 < 0.5) return skyBase0(dir);
  // k08b: deep purple zenith -> magenta -> pink/orange band at the horizon, hottest under the sun's azimuth
  float h = dir.y; float mu = max(dot(dir, uSunDir), 0.0);
  vec2 dh = normalize(dir.xz + 1e-5), sh = normalize(uSunDir.xz + 1e-5);
  float side = pow(dot(dh, sh) * 0.5 + 0.5, 1.6);
  float hh = max(h, 0.0);
  vec3 hz = mix(uK8HzAway, uK8HzSun, side), md = mix(uK8MidAway, uK8MidSun, side * side);
  vec3 c = mix(hz, md, smoothstep(0.0, 0.10, hh));
  c = mix(c, uK8Hi, smoothstep(0.06, 0.30, hh));
  c = mix(c, uK8Zen, smoothstep(0.25, 0.85, hh));
  c += uK8SunCol * vec3(1.25, 0.95, 0.75) * (pow(mu, 8.0) * 0.30 + pow(mu, 90.0) * 1.2) * uK8Halo;
  if (h < 0.0) c = mix(hz * 0.9, hz * vec3(0.36, 0.30, 0.40), smoothstep(0.0, -0.25, h));
  return c;
}
vec4 clouds(vec3 dir){
  if (uK8 < 0.5) return clouds0(dir);
  // soft stretched evening clouds: low contrast, lit peach from below toward the sun, lavender in shade
  if (dir.y <= 0.0) return vec4(0.0);
  vec2 uv = dir.xz / (dir.y + 0.10) * vec2(0.55, 1.1) + vec2(uTime * 0.006, uTime * 0.002);
  float n = fbm(uv * 0.9) * 0.7 + fbm(uv * 2.6 + 4.0) * 0.3;
  float cov = smoothstep(1.0 - uK8CloudCov, 1.0 - uK8CloudCov + 0.32, n);
  cov *= smoothstep(0.02, 0.12, dir.y) * (1.0 - smoothstep(0.30, 0.70, dir.y));
  float mu = max(dot(dir, uSunDir), 0.0);
  float thick = smoothstep(0.55, 1.0, n);
  vec3 col = mix(uK8CloudLit * (0.55 + 1.3 * pow(mu, 5.0)), uK8CloudShade, thick * 0.6);
  col += uK8SunCol * 1.6 * pow(mu, 24.0) * (1.0 - thick);
  return vec4(col, cov * 0.62);
}`;
/** the sky GLSL for the current look (the original string unless --look k08b) */
export function skyGLSL() {
  if (!LOOKCFG.k08b) return SKY_GLSL;
  return SKY_GLSL.replace('vec3 sunColor(){', 'vec3 sunColor0(){').replace('vec3 skyBase(vec3 dir){', 'vec3 skyBase0(vec3 dir){')
    .replace('vec4 clouds(vec3 dir){', 'vec4 clouds0(vec3 dir){').replace('vec3 skyColor(vec3 dir, bool withSun){', K8_GLSL + '\nvec3 skyColor(vec3 dir, bool withSun){');
}
const skyU = () => (LOOKCFG.k08b ? { ...envUniforms, ...K8U } : { ...envUniforms });

export const envUniforms = {
  uSunDir: { value: new THREE.Vector3(-0.99, 0.105, -0.087).normalize() },
  uTime: { value: 0 },
  uSkyWarm: { value: 1 },
};

/** Sky: a big sphere that follows the camera. In near-orthographic mode the
 *  view direction is synthesized from screen position with a virtual FOV so the
 *  2D view still gets a proper (banded) gradient instead of a flat colour. */
export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...skyU(), uVirtFov: { value: 0.6 }, uVirtMix: { value: 0 }, uAspect: { value: 16 / 9 },
      uCamFwd: { value: new THREE.Vector3(0, 0, -1) }, uCamRight: { value: new THREE.Vector3(1, 0, 0) }, uCamUp: { value: new THREE.Vector3(0, 1, 0) }, uSkyLift: { value: 0 } },
    vertexShader: /* glsl */`
      varying vec3 vDir; varying vec4 vClip;
      void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vDir = wp.xyz - cameraPosition;
        vec4 p = projectionMatrix * viewMatrix * wp; vClip = p; gl_Position = vec4(p.xy, p.w * 0.99999, p.w); }`,
    fragmentShader: skyGLSL() + /* glsl */`
      varying vec3 vDir; varying vec4 vClip;
      uniform float uVirtFov, uVirtMix, uAspect, uSkyLift; uniform vec3 uCamFwd, uCamRight, uCamUp;
      void main(){
        vec2 ndc = vClip.xy / vClip.w;
        float tf = tan(uVirtFov*0.5);
        vec3 vdir = normalize(uCamFwd + ndc.x*tf*uAspect*uCamRight + (ndc.y*tf + uSkyLift)*uCamUp);
        vec3 dir = normalize(mix(normalize(vDir), vdir, uVirtMix));
        gl_FragColor = vec4(skyColor(dir, true), 1.0);
      }`,
    side: THREE.BackSide, depthWrite: false, depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), mat);
  mesh.renderOrder = -1000; mesh.frustumCulled = false; mesh.userData.noAO = true;
  mesh.onBeforeRender = (r, s, cam) => {
    mesh.position.copy(cam.position); mesh.scale.setScalar(Math.min(cam.far * 0.5, 1e6)); mesh.updateMatrixWorld();
  };
  return mesh;
}

/** PMREM environment from the procedural sky (no sun disc) for IBL + reflections. */
export function makeEnvironment(renderer) {
  const s = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    uniforms: skyU(),
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: skyGLSL() + `varying vec3 vDir; void main(){ vec3 d = normalize(vDir);
      vec3 c = skyColor(d, false); if (d.y < 0.0) c = mix(vec3(0.20,0.19,0.14), c, exp(d.y*30.0));
      c += vec3(12.0,7.0,3.0) * pow(max(dot(d, uSunDir),0.0), 400.0);
      // (v4) one non-finite sky texel poisons the whole PMREM (every IBL-lit surface goes NaN -> black for that frame)
      if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
      gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide, depthWrite: false,
  });
  s.add(new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), mat));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0, 0.1, 1000);
  pm.dispose();
  return rt.texture;
}

/** Sea: big plane with procedural wave normals, Fresnel sky reflection,
 *  distance-widened sun glitter path. Aerial perspective is applied in post. */
export function makeSea(y = -200, size = 400000) {
  const mat = new THREE.ShaderMaterial({
    uniforms: skyU(),
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: (LOOKCFG.k08b ? '#define K8SEA\n' : '') + skyGLSL() + /* glsl */`
      varying vec3 vW;
      vec2 wave(vec2 p, vec2 d, float f, float a, float s){ float ph = dot(p,d)*f + uTime*s; return d * (a*f*cos(ph)); }
      void main(){
        vec3 V = vW - cameraPosition; float dist = length(V); V /= dist;
        vec2 p = vW.xz;
        float near = 1.0 / (1.0 + dist*0.0004);
        vec2 g = vec2(0.0);
        g += wave(p, normalize(vec2(1.0,0.3)), 0.010, 1.6, 0.8);
        g += wave(p, normalize(vec2(0.6,-1.0)), 0.019, 0.9, 1.2);
        g += wave(p, normalize(vec2(-0.8,0.5)), 0.041, 0.5, 1.8);
        g += wave(p, normalize(vec2(0.2,1.0)), 0.083, 0.28, 2.5) * near;
        vec2 q = p*0.02 + vec2(uTime*0.05, -uTime*0.03);
        g += (vec2(vnoise(q*3.1), vnoise(q*3.1+7.3)) - 0.5) * 0.18;
        g += (vec2(vnoise(q*9.7), vnoise(q*9.7+3.1)) - 0.5) * 0.30 * near;
        g += (vec2(vnoise(q*31.0), vnoise(q*31.0+5.7)) - 0.5) * 0.25 * near * near;
        vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
        vec3 R = reflect(V, N); R.y = abs(R.y) + 0.003;
        float cosT = max(dot(-V, N), 0.0);
        float fr = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
        vec3 deep = vec3(0.004, 0.026, 0.075), shallow = vec3(0.008, 0.070, 0.095);
        vec3 body = mix(deep, shallow, pow(max(dot(N, uSunDir),0.0), 2.0) * 0.6) * (0.6 + 0.6*max(uSunDir.y,0.0)*4.0);
        #ifdef K8SEA
        float k8near = 1.0 - smoothstep(500.0, 3500.0, dist);
        if (uK8 > 0.5) body = mix(body * 2.6 + vec3(0.030, 0.035, 0.060),                       // far: pale lavender haze
          vec3(0.011, 0.056, 0.078) + vec3(0.02, 0.08, 0.07) * pow(max(dot(N, uSunDir), 0.0), 2.0), k8near);   // near: clear blue-teal
        #endif
        vec3 col = mix(body, skyColor(R, false), fr);
        // glitter path: specular lobe widens with distance (sub-pixel wave facets)
        float far = clamp(dist / 6000.0, 0.0, 1.0);
        float spec = max(dot(R, uSunDir), 0.0);
        float lobe = pow(spec, mix(3000.0, 700.0, far)) * mix(90.0, 12.0, far);
        float sparkle = step(0.86, vnoise(p * 0.9 + uTime * 3.0)) * pow(spec, 500.0) * 40.0 * near;
        #ifdef K8SEA
        if (uK8 > 0.5) { lobe = mix(min(lobe * 0.05, 1.5), min(lobe * 0.5, 9.0), k8near); sparkle *= mix(0.08, 0.6, k8near); }   // k08b: glitter near, haze far
        #endif
        col += vec3(1.7, 1.05, 0.55) * (lobe + sparkle);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.frustumCulled = false; mesh.userData.noAO = true;
  return mesh;
}
