// ACT IV · THE PERSPECTIVE LOCK. A real anamorphic 画 built from the Make Me a Hanzi strokes.
//
// Geometry (all exact, no screen-space cheating):
//   E      Jade's eye (world point).  Fh = horizontal forward, R = right, Up = world up.
//   A glyph point (fx, fy) in MMAH font units (1024 box, y up, y in [-124, 900]) defines the ray
//          dir(fx, fy) = Fh + R * (fx - xC) * s + Up * (fy - yH) * s          (picture plane at unit distance along Fh)
//   yH is the horizon row: glyph rows below yH look DOWN from E and hit the ground at  lambda = E.y / ((yH - fy) * s).
//   AIR strokes (the 一 and the 田) are cut into fragments. Each fragment is a planar quad placed at a random depth on
//          its own ray with a random tilt; its corners are the central projection (through E) of the fragment's
//          image-space box onto that tilted plane. The fragment shader maps every world point P back through E onto
//          the picture plane (uv = project(P)) and keeps only the texels of its own stroke piece, so from E the
//          pieces land exactly on the glyph, and from anywhere else they are tilted shards at scattered depths.
//   GROUND strokes (the 凵 enclosure, strokes 6-7) are the Eraser's white rub trails: the ground shader projects
//          each ground point through E the same way, so the trails are long anamorphic smears on the paper that
//          close the character only from E (negative space: erasing was drawing all along).
// Animation never breaks the math: chaos = per-fragment rotation/offset about its rest pose, decaying to exactly 0
// on the slam; the idle drift slides fragments ALONG their own rays (alignment-preserving from E).
import * as THREE from 'three';
import { loadHanzi } from '../../hanzi.js';
import { mulberry32 } from '../../util.js';
import { envUniforms } from '../../env.js';

const TEX = 1024; // mask texture = the 1024 font box
const Y0 = -124;  // font box bottom

function medianParam(x, y, med) {
  let total = 0; const lens = [];
  for (let i = 1; i < med.length; i++) { const l = Math.hypot(med[i][0] - med[i - 1][0], med[i][1] - med[i - 1][1]); lens.push(l); total += l; }
  let best = Infinity, bestS = 0, acc = 0;
  for (let i = 1; i < med.length; i++) {
    const [ax, ay] = med[i - 1], [bx, by] = med[i]; const dx = bx - ax, dy = by - ay; const L2 = dx * dx + dy * dy || 1;
    let t = ((x - ax) * dx + (y - ay) * dy) / L2; t = Math.max(0, Math.min(1, t));
    const dd = (x - ax - dx * t) ** 2 + (y - ay - dy * t) ** 2;
    if (dd < best) { best = dd; bestS = acc + t * lens[i - 1]; }
    acc += lens[i - 1];
  }
  return total > 0 ? bestS / total : 0;
}
function medianLen(med) { let L = 0; for (let i = 1; i < med.length; i++) L += Math.hypot(med[i][0] - med[i - 1][0], med[i][1] - med[i - 1][1]); return L; }

/** Rasterise the strokes: RGBA8 texel = (stroke id, median param, distance-to-edge, coverage). Row j <-> fy = Y0 + j + 0.5. */
function rasterGlyph(data) {
  const cv = document.createElement('canvas'); cv.width = cv.height = TEX;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const cov = []; // per stroke alpha
  for (const d of data.strokes) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, TEX, TEX);
    g.setTransform(1, 0, 0, -1, 0, 900); g.fillStyle = '#fff'; g.fill(new Path2D(d));
    const a = g.getImageData(0, 0, TEX, TEX).data; const c = new Uint8Array(TEX * TEX);
    for (let i = 0; i < c.length; i++) c[i] = a[i * 4 + 3];
    cov.push(c);
  }
  const out = new Uint8Array(TEX * TEX * 4); const id = new Int8Array(TEX * TEX).fill(-1);
  for (let row = 0; row < TEX; row++) for (let x = 0; x < TEX; x++) {
    const ci = row * TEX + x; let best = -1, bc = 0;
    for (let s = 0; s < cov.length; s++) if (cov[s][ci] > bc + 40 || (best < 0 && cov[s][ci] > 0)) { best = s; bc = cov[s][ci]; } // earlier stroke wins near-ties
    if (best < 0) continue;
    let A = 0; for (let s = 0; s < cov.length; s++) A = Math.max(A, cov[s][ci]);
    const j = TEX - 1 - row, fy = Y0 + j + 0.5, fx = x + 0.5, o = (j * TEX + x) * 4;
    out[o] = best; out[o + 1] = Math.round(255 * medianParam(fx, fy, data.medians[best])); out[o + 3] = A; id[j * TEX + x] = best;
  }
  // chamfer distance to the stroke-union edge (texels, capped) -> B (used for the pencil hatch edge)
  const D = new Float32Array(TEX * TEX); for (let i = 0; i < D.length; i++) D[i] = id[i] >= 0 ? 255 : 0;
  for (let j = 0; j < TEX; j++) for (let x = 0; x < TEX; x++) { const i = j * TEX + x; if (!D[i]) continue; D[i] = Math.min(D[i], (x ? D[i - 1] : 0) + 1, (j ? D[i - TEX] : 0) + 1); }
  for (let j = TEX - 1; j >= 0; j--) for (let x = TEX - 1; x >= 0; x--) { const i = j * TEX + x; if (!D[i]) continue; D[i] = Math.min(D[i], (x < TEX - 1 ? D[i + 1] : 0) + 1, (j < TEX - 1 ? D[i + TEX] : 0) + 1); }
  for (let i = 0; i < D.length; i++) out[i * 4 + 2] = Math.min(255, D[i] * 4);
  const tex = new THREE.DataTexture(out, TEX, TEX, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return { tex, data: out };
}

// GLSL shared by fragments, their shadow depth material and the ground: project a world point through E.
export const PROJ_GLSL = /* glsl */`
uniform vec3 uE, uFh, uR; uniform float uS, uXC, uYH; uniform sampler2D tGlyph;
// returns (fx, fy) in font units; w = 1 if in front of the eye
vec3 glyphProj(vec3 P){ vec3 d = P - uE; float f = dot(d, uFh); if (f <= 1e-3) return vec3(0.0, 0.0, 0.0);
  float xt = dot(d, uR) / f, yt = d.y / f; return vec3(uXC + xt / uS, uYH + yt / uS, 1.0); }
vec4 glyphTexel(vec2 fxy){ vec2 uv = vec2(fxy.x, fxy.y - (${Y0.toFixed(1)})) / ${TEX.toFixed(1)};
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec4(0.0); return texture2D(tGlyph, uv); }
float glyphId(vec4 g){ return floor(g.r * 255.0 + 0.5); }
vec3 rbHue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
// coloured-pencil hatching (two diagonal sets in font space) -> coverage 0..1
float hatch(vec2 fxy, float k){ float h1 = fract((fxy.x + fxy.y) * 0.045); float h2 = fract((fxy.x - fxy.y * 0.6) * 0.038 + 0.37);
  return max(step(h1, k), step(h2, k - 0.35)); }`;

/**
 * Build the anamorphic field.
 * opts: { E, Fh (horizontal unit), s, xC, yH, groundStrokes, seed, airDepth:[a,b] fraction of ground distance,
 *         skyDepth:[a,b] absolute, minDist }
 */
export async function buildGlyphField(ch, opts) {
  const o = { s: 0.00095, xC: 500, yH: 520, groundStrokes: [6, 7], coherentStrokes: [0], groundY: 0, seed: 7, airDepth: [0.1, 0.85], skyDepth: [130, 1150], minDist: 85, ...opts };
  // (act4 r5) opts.pieceScale / maxPieces: more, smaller shards (the chaos reads as a mess); opts.r5: vivid shard skin GLSL (injected only with r5)
  const R5_SHARD = o.r5 ? ' skin = mix(skin * 1.3, hueF * 1.9, 0.45);' : '';
  const data = await loadHanzi(ch);
  const { tex, data: px } = rasterGlyph(data);
  const E = o.E.clone(), Fh = o.Fh.clone().setY(0).normalize(), R = new THREE.Vector3(-Fh.z, 0, Fh.x), Up = new THREE.Vector3(0, 1, 0);
  const dirOf = (fx, fy) => Fh.clone().addScaledVector(R, (fx - o.xC) * o.s).addScaledVector(Up, (fy - o.yH) * o.s);
  const GY = o.groundY; const groundLambda = (fy) => (fy < o.yH ? (E.y - GY) / ((o.yH - fy) * o.s) : Infinity);
  const nS = data.strokes.length;
  const ground = new Set(o.groundStrokes);
  const rnd = mulberry32(o.seed);

  // ---- split air strokes into pieces along the median (longer strokes -> more pieces)
  const frags = [];
  for (let s = 0; s < nS; s++) {
    if (ground.has(s)) continue;
    const L = medianLen(data.medians[s]); const n = Math.max(2, Math.min(o.maxPieces ?? 5, Math.round(L / 120 * (o.pieceScale ?? 1))));
    const cuts = [0]; for (let k = 1; k < n; k++) cuts.push((k + (rnd() - 0.5) * 0.45) / n); cuts.push(1);
    for (let k = 0; k < n; k++) frags.push({ stroke: s, p0: cuts[k], p1: cuts[k + 1], box: [1e9, 1e9, -1e9, -1e9], n: 0, sx: 0, sy: 0 });
  }
  const byStroke = new Map(); frags.forEach((f) => { if (!byStroke.has(f.stroke)) byStroke.set(f.stroke, []); byStroke.get(f.stroke).push(f); });
  for (let j = 0; j < TEX; j++) for (let x = 0; x < TEX; x++) {
    const i = (j * TEX + x) * 4; if (!px[i + 3]) continue;
    const list = byStroke.get(px[i]); if (!list) continue;
    const p = px[i + 1] / 255; const f = list.find((q) => p >= q.p0 - 1e-6 && p <= q.p1 + 1e-6) || list[list.length - 1];
    const fx = x + 0.5, fy = Y0 + j + 0.5; const b = f.box;
    b[0] = Math.min(b[0], fx); b[1] = Math.min(b[1], fy); b[2] = Math.max(b[2], fx); b[3] = Math.max(b[3], fy); f.n++; f.sx += fx; f.sy += fy;
  }

  // ---- materials
  const U = {
    uE: { value: E }, uFh: { value: Fh }, uR: { value: R }, uS: { value: o.s }, uXC: { value: o.xC }, uYH: { value: o.yH }, tGlyph: { value: tex },
    uIgnite: { value: 0 }, uIgniteT: { value: 0 }, uTime: { value: 0 }, uSunDir: envUniforms.uSunDir, uGlow: { value: 0 }, uShow: { value: 1 },
    uColorShards: { value: 0 }, uLampP: { value: new THREE.Vector3() }, uLampK: { value: 0 },   // (act4 M3) colour shards + the firefly lamp
  };
  const VS = /* glsl */`
    attribute vec3 aFrag; // stroke id, p0, p1
    varying vec3 vW; varying vec3 vFrag; varying vec3 vN;
    void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vFrag = aFrag; vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * w; }`;
  const FS = PROJ_GLSL + /* glsl */`
    uniform float uIgnite, uIgniteT, uTime, uGlow, uShow, uColorShards, uLampK; uniform vec3 uSunDir, uLampP;
    varying vec3 vW; varying vec3 vFrag; varying vec3 vN;
    void main(){
      vec3 q = glyphProj(vW); if (q.z < 0.5) discard;
      vec4 g = glyphTexel(q.xy); if (g.a < 0.5 || abs(glyphId(g) - vFrag.x) > 0.5) discard;
      float p = g.g; if (p < vFrag.y - 0.004 || p > vFrag.z + 0.004) discard;
      if (uShow < 0.5) discard;
      vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
      float edge = clamp(g.b * 255.0 / 4.0 / 7.0, 0.0, 1.0);
      // graphite flake: dark, slightly metallic sheen, pencil grain along the stroke
      float grain = fract(sin(dot(floor(q.xy * 0.5), vec2(12.9898, 78.233))) * 43758.5453);
      vec3 graphite = mix(vec3(0.010, 0.011, 0.016), vec3(0.045, 0.046, 0.056), 0.6 * edge + 0.4 * grain);
      float diff = max(dot(n, uSunDir), 0.0); float back = max(dot(n, -uSunDir), 0.0);
      vec3 col = graphite * (0.7 + 0.8 * diff + 0.5 * back) + vec3(0.30, 0.26, 0.24) * pow(diff, 12.0) * 0.25;
      // (act4 M3) the rule: graphite was rubbed out; what floats is COLOUR: each fragment is a piece of the coloured world, in
      // coloured-pencil hatching (its own hue), lit warm by the firefly lamp so Jade can see and measure them in the dusk
      if (uColorShards > 0.0) {
        vec3 hueF = rbHue(vFrag.x * 0.137 + vFrag.y * 0.53 + 0.07) * 0.78 + 0.04;
        float hc0 = hatch(q.xy, 0.82);
        vec3 skin = mix(vec3(0.62, 0.58, 0.54), hueF, 0.35 + 0.65 * hc0) * (0.55 + 0.75 * diff + 0.35 * back);
        vec3 toL = uLampP - vW; float lamp = uLampK * (0.35 + 0.65 * max(dot(n, normalize(toL)), 0.0)) / (1.0 + length(toL) / 900.0);
        skin += hueF * vec3(1.0, 0.78, 0.45) * lamp;` + R5_SHARD + /* glsl */`
        col = mix(col, skin, uColorShards);
      }
      col *= gl_FrontFacing ? 1.0 : 0.7;
      // ignition: rainbow coloured-pencil hatching sweeping in stroke order
      float k = clamp(uIgnite * 1.4 - (vFrag.x / 8.0) * 0.4 - p * 0.15, 0.0, 1.0);
      if (k > 0.0) {
        vec3 rb = rbHue(q.x * 0.0011 + q.y * 0.0007 - uIgniteT * 0.08);
        float hc = hatch(q.xy, 0.25 + 0.75 * k);
        vec3 lit = mix(rb * 0.55, rb * (2.2 + 1.6 * uGlow) + vec3(0.25), hc * (0.55 + 0.45 * edge));
        col = mix(col, lit, smoothstep(0.0, 0.35, k));
      }
      gl_FragColor = vec4(col, 1.0);
    }`;
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide });
  // shadow caster with the same discard (so shards cast shard-shaped shadows on the paper)
  const depthMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`attribute vec3 aFrag; varying vec3 vW; varying vec3 vFrag; varying vec2 vHighPrecisionZW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vFrag = aFrag; gl_Position = projectionMatrix * viewMatrix * w; vHighPrecisionZW = gl_Position.zw; }`,
    fragmentShader: PROJ_GLSL + /* glsl */`
#include <packing>
      uniform float uShow; varying vec3 vW; varying vec3 vFrag; varying vec2 vHighPrecisionZW;
      void main(){ vec3 q = glyphProj(vW); if (q.z < 0.5 || uShow < 0.5) discard; vec4 g = glyphTexel(q.xy);
        if (g.a < 0.5 || abs(glyphId(g) - vFrag.x) > 0.5 || g.g < vFrag.y - 0.004 || g.g > vFrag.z + 0.004) discard;
        float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5; gl_FragColor = packDepthToRGBA(fragCoordZ); }`,
    side: THREE.DoubleSide,
  });

  // ---- place each fragment in 3D
  const group = new THREE.Group();
  const v3 = new THREE.Vector3();
  const coherent = new Set(o.coherentStrokes);
  const strokeHome = new Map();   // stroke -> { lam, nrm } shared plane for coherent strokes
  for (const s of coherent) {
    const fs = frags.filter((f) => f.stroke === s && f.n); if (!fs.length) continue;
    const n = fs.reduce((a, f) => a + f.n, 0); const cx = fs.reduce((a, f) => a + f.sx, 0) / n, cy = fs.reduce((a, f) => a + f.sy, 0) / n;
    const lg = groundLambda(cy); const lam = Number.isFinite(lg) ? lg * 0.5 : 0.5 * (o.skyDepth[0] + o.skyDepth[1]);
    strokeHome.set(s, { lam, nrm: dirOf(cx, cy).normalize().negate(), c: E.clone().addScaledVector(dirOf(cx, cy), lam) });
  }
  for (const f of frags) {
    if (!f.n) continue;
    const home = strokeHome.get(f.stroke);
    const [x0, y0, x1, y1] = f.box; const m = 7;
    const cx = f.sx / f.n, cy = f.sy / f.n; const dc = dirOf(cx, cy);
    let placed = null;
    for (let tries = 0; tries < 40 && !placed; tries++) {
      // depth on the centre ray
      const lg = groundLambda(Math.min(y0, cy));
      const lam = Number.isFinite(lg) ? Math.max(o.minDist, lg * (o.airDepth[0] + rnd() * (o.airDepth[1] - o.airDepth[0])))
        : o.skyDepth[0] + rnd() * (o.skyDepth[1] - o.skyDepth[0]);
      let Pc = E.clone().addScaledVector(dc, lam);
      // plane normal: facing back toward the eye, tilted up to ~60 degrees about a random axis
      let nrm = dc.clone().negate().normalize();
      const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
      nrm.applyAxisAngle(axis, (0.35 + 0.75 * rnd()) * (rnd() < 0.5 ? -1 : 1));
      if (home) { // coherent stroke: every piece on the stroke's one plane
        nrm = home.nrm.clone(); const den = dc.dot(nrm); Pc = E.clone().addScaledVector(dc, home.c.clone().sub(E).dot(nrm) / den); }
      const corners = [[x0 - m, y0 - m], [x1 + m, y0 - m], [x1 + m, y1 + m], [x0 - m, y1 + m]].map(([fx, fy]) => {
        const d = dirOf(fx, fy); const den = d.dot(nrm); if (Math.abs(den) < 0.25) return null;
        const t = v3.copy(Pc).sub(E).dot(nrm) / den; return t > 20 ? E.clone().addScaledVector(d, t) : null;
      });
      if (corners.some((c) => !c || c.y < GY + 3)) continue;
      placed = { Pc, nrm, corners, lam };
    }
    if (!placed) continue;
    const { Pc, corners } = placed;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(12); corners.forEach((c, k) => { pos[k * 3] = c.x - Pc.x; pos[k * 3 + 1] = c.y - Pc.y; pos[k * 3 + 2] = c.z - Pc.z; });
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aFrag', new THREE.BufferAttribute(new Float32Array([f.stroke, f.p0, f.p1, f.stroke, f.p0, f.p1, f.stroke, f.p0, f.p1, f.stroke, f.p0, f.p1]), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat); mesh.customDepthMaterial = depthMat; mesh.castShadow = true; mesh.receiveShadow = false;
    mesh.frustumCulled = false; mesh.userData.noAO = true; mesh.position.copy(Pc);
    // rest pose + per-fragment chaos (deterministic)
    const chaosAxis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    mesh.userData.frag = {
      ...f, rest: Pc.clone(), dir: Pc.clone().sub(E).normalize(), lam: placed.lam,
      chaosAxis, chaosAng: (0.15 + rnd() * 0.35) * (rnd() < 0.5 ? -1 : 1),
      chaosOff: new THREE.Vector3(rnd() - 0.5, (rnd() - 0.5) * 0.6, rnd() - 0.5).multiplyScalar(0.05 * placed.lam),
      phase: rnd() * 6.283, order: 0, coherent: !!home, scatter: home ? 0.35 + 1.5 * rnd() : 1,
    };
    group.add(mesh);
  }
  // lock order: earlier strokes lock first; the top 一 (stroke 0) is the lone-hit snap
  const meshes = group.children.slice();
  meshes.forEach((m, i) => { m.userData.frag.order = i / Math.max(1, meshes.length - 1); });

  const q = new THREE.Quaternion();
  /**
   * chaos: 0 = locked rest pose (exact), 1 = full scatter. Per-fragment amounts: chaosOf(frag) -> 0..1.
   * drift (world units, along each fragment's own ray; never breaks alignment from E), t for bobbing.
   */
  function pose({ chaosOf, drift = 0, t = 0 }) {
    for (const m of meshes) {
      const F = m.userData.frag; const c = chaosOf(F);
      const slide = drift * Math.sin(t * 0.7 + F.phase) * (0.4 + 0.6 * F.order);
      // slide along the rays = a homothety about E: from E nothing changes, from anywhere else the depth order shifts
      let sc = (F.lam + slide) / F.lam;
      if (F.coherent) sc *= 1 + (F.scatter - 1) * c;           // coherent strokes: scattered depths -> their one plane
      m.scale.setScalar(sc);
      m.position.copy(E).addScaledVector(F.rest.clone().sub(E), sc);
      if (c > 0) {
        q.setFromAxisAngle(F.chaosAxis, F.chaosAng * c + 0.08 * c * Math.sin(t * 1.3 + F.phase));
        m.quaternion.copy(q); if (!F.coherent) m.position.addScaledVector(F.chaosOff, c);
        m.position.y = Math.max(m.position.y, GY + 4);
      } else m.quaternion.identity();
    }
  }

  // ---- ground: the Eraser's rub trails (strokes 6, 7) as negative space on the paper, projected through E
  const groundStrokes = [...ground];
  return { group, meshes, U, mat, depthMat, tex, E, Fh, R, dirOf, groundLambda, groundStrokes, pose, opts: o, data, nStrokes: nS };
}

/**
 * Patch a MeshStandardMaterial into the erased-world PAPER ground: pale paper + the rub trails that close the 画
 * from E (+ rainbow ignition + a colour-return wavefront). Keeps three's lighting + shadows.
 */
export function patchPaperGround(mat, field, extra, opts = {}) {
  // (act4 r5) opts.r5: blank-paper details (faint pencil grid, graphite smudges, eraser dust) injected only with --r5 (the default
  // shader string is untouched)
  const R5_PAPER = opts.r5 ? /* glsl */`
          { vec2 gp = vGW.xz / 46.0 + 0.025 * vec2(gn(vGW.zx * 0.03), gn(vGW.xz * 0.03 + 7.0));   // a hand-ruled pencil grid, 46 u
            vec2 gf = abs(fract(gp) - 0.5); float gl = 1.0 - smoothstep(0.0, 0.03, min(gf.x, gf.y));
            float gw = 0.45 + 0.55 * gn(vGW.xz * 0.13);                                             // the pencil pressure wanders
            diffuseColor.rgb *= 1.0 - 0.13 * gl * gw;
            float sm = smoothstep(0.58, 0.9, gn(vGW.xz * 0.0055 + 3.0)) * (0.55 + 0.45 * gn(vGW.xz * 0.045));   // graphite smudges
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.74, 0.73, 0.77), 0.4 * sm);
            float dust = step(0.982, gh(floor(vGW.xz * 0.6))) * smoothstep(0.35, 0.7, gn(vGW.xz * 0.02 + 11.0));  // eraser dust specks
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.58, 0.56, 0.60), 0.7 * dust); }` : '';
  const U = { ...field.U, uTrail: { value: 0 }, uTrailIgnite: { value: 0 }, uPaperVis: { value: 1 },
    uEraseC: { value: new THREE.Vector3() }, uEraseR: { value: 1e9 },
    uColC: { value: new THREE.Vector3() }, uColR: { value: -1 }, uRestC: { value: new THREE.Vector3() }, uRestR: { value: -1 }, ...extra };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vGW = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + PROJ_GLSL + /* glsl */`
        varying vec3 vGW; uniform float uTrail, uTrailIgnite, uIgniteT, uEraseR, uColR, uRestR, uPaperVis; uniform vec3 uEraseC, uColC, uRestC;
        float gh(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(gh(i), gh(i+vec2(1,0)), f.x), mix(gh(i+vec2(0,1)), gh(i+vec2(1,1)), f.x), f.y); }
        vec3 paperEmit = vec3(0.0);`)
      .replace('#include <clipping_planes_fragment>', /* glsl */`#include <clipping_planes_fragment>
        // paper exists only where the world has been erased and not yet restored (revealed rub trails stay, as ribbons)
        bool trailHere = false;
        { vec3 q0 = glyphProj(vGW); if (q0.z > 0.5) { vec4 g0 = glyphTexel(q0.xy); float i0 = glyphId(g0);
            trailHere = i0 > 5.5 && i0 < 7.5 && g0.a > 0.5 && g0.g <= uTrail * 1.05; } }
        if (uPaperVis < 0.5 || distance(vGW.xz, uEraseC.xz) > uEraseR || (uRestR > 0.0 && distance(vGW.xz, uRestC.xz) < uRestR && !trailHere)) discard;`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {
          // paper tooth
          float tooth = gn(vGW.xz * 0.9) * 0.6 + gn(vGW.xz * 3.7) * 0.4;
          diffuseColor.rgb *= 0.94 + 0.08 * tooth;` + R5_PAPER + /* glsl */`
          // rub trails: the ground part of the glyph, revealed along each trail (uTrail = 0..1 rub progress)
          vec3 q = glyphProj(vGW);
          if (q.z > 0.5) {
            vec4 g = glyphTexel(q.xy); float id = glyphId(g);
            bool gs = (id > 5.5 && id < 7.5) && g.a > 0.5;
            if (gs) {
              // rubbing streaks run along the ray from E (radial on the ground): sample noise in (angle, distance)
              vec2 dv = vGW.xz - uE.xz; float ang = atan(dv.y, dv.x); float dist = length(dv);
              float streak = gn(vec2(ang * 900.0, dist * 0.02)) * 0.7 + gn(vec2(ang * 3100.0, dist * 0.08)) * 0.3;
              float rev = step(g.g, uTrail * 1.05);
              float edge = clamp(g.b * 255.0 / 4.0 / 5.0, 0.0, 1.0);
              vec3 white = vec3(1.55) * (0.95 + 0.1 * streak);
              diffuseColor.rgb = mix(diffuseColor.rgb, white, rev * (0.75 + 0.25 * edge) * (0.82 + 0.18 * streak));
              if (uTrailIgnite > 0.0) {
                vec3 rb = rbHue(q.x * 0.0011 + q.y * 0.0007 - uIgniteT * 0.08);
                float hc = hatch(q.xy, 0.3 + 0.7 * uTrailIgnite);
                paperEmit = rev * uTrailIgnite * mix(rb * 0.3, rb * 1.6, hc * (0.5 + 0.5 * edge));
                diffuseColor.rgb = mix(diffuseColor.rgb, rb, rev * uTrailIgnite * 0.7 * hc);
              }
            }
          }
          // colour pouring back from the glyph: a coloured-pencil hatching wavefront racing out over the page
          if (uColR > 0.0) {
            float dist = distance(vGW.xz, uColC.xz); float n = gn(vGW.xz * 0.012) - 0.5;
            float k = clamp((uColR - dist + n * 160.0) / 420.0, 0.0, 1.0);
            if (k > 0.0) {
              float h1 = fract(dot(vGW.xz, vec2(0.71, 0.70)) * 0.11 + n * 0.8);
              float h2 = fract(dot(vGW.xz, vec2(-0.45, 0.89)) * 0.09 - n * 0.8);
              float cov = max(step(h1, k * 1.25 - 0.05), step(h2, k * 1.25 - 0.55));
              vec3 meadow = mix(vec3(0.16, 0.36, 0.08), vec3(0.55, 0.50, 0.16), gn(vGW.xz * 0.004)) * (0.9 + 0.2 * gn(vGW.xz * 0.05));
              vec3 pencil = mix(meadow, rbHue(dot(vGW.xz, vec2(0.0021, 0.0034)) + n), 0.6 * (1.0 - k));
              diffuseColor.rgb = mix(diffuseColor.rgb, pencil, cov);
            }
          }
        }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += paperEmit;');
  };
  mat.customProgramCacheKey = () => 'act4paperground' + (opts.r5 ? '_r5' : '');
  mat.userData.U = U;
  return U;
}
