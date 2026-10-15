// ACT V world: the 一笔一画 landscape seen from above at drop 2 (174.395). A self-contained voxel builder
// (Team B's act3/world builder was not available when this was written; swap in later if it lands).
//   - four colossal characters 一 笔 一 画 as raised voxel plateaus, true Make Me a Hanzi strokes, tops
//     coloured with rainbow coloured-pencil hatching by GLOBAL stroke order (一=0, 笔=1..10, 一=11, 画=12..19)
//   - terraced voxel meadow, sea + lakes with stepped turquoise shallows, cypress rows, two terracotta ruins,
//     voxel clouds, the three heroes as tiny voxel figures on the first 一
//   - a hero-scale rainbow pencil (blue cap, FUNCTIONS) for the 173.02 close-up
// Everything is deterministic (seeded hashes only). World units: 1 = 1 m-ish; glyph = 430 units across.
import * as THREE from 'three';
import { loadHanzi, voxelizeHanzi } from '../../hanzi.js';
import { makeSky, makeEnvironment, envUniforms } from '../../env.js';
import { Actor } from '../../core/sprites.js';
import { fbm, vnoise, mulberry32 } from '../../util.js';

export const CHARS = ['一', '笔', '一', '画'];
export const GLYPH = { k: 0.47, cells: 64, xs: [-705, -235, 235, 705], z: 0, base: 14, top: 70, bold: 1.6 };
export const WATER_Y = 4;
export const SUN_DIR = new THREE.Vector3(-0.55, 0.72, -0.42).normalize();

const TERR = { x0: -1500, x1: 1500, z0: -950, z1: 950, cell: 10, step: 6 };

// ------------------------------------------------------------------ terrain height field
function waterMask(x, z) {
  // designed basins (sea top-left, bays bottom-left, lake bottom-centre, lake right) + noise
  const blobs = [[-1250, -820, 520], [-1450, -200, 300], [-1150, 700, 430], [80, 760, 330], [1250, 820, 360], [1450, -650, 260]];
  let m = 0;
  for (const [bx, bz, r] of blobs) { const d = Math.hypot(x - bx, z - bz) / r; m = Math.max(m, 1 - d); }
  return m + (fbm(x * 0.004, z * 0.004, 3, 77) - 0.5) * 0.55;
}
function rawHeight(x, z) {
  const w = waterMask(x, z);
  const hills = fbm(x * 0.0022 + 3.1, z * 0.0022 - 1.7, 4, 5) * 110 - 20;
  let h = Math.max(hills, 10);
  if (w > 0.05) h = Math.min(h, 10 - (w - 0.05) * 260);      // shore slopes into the water
  return h;
}

/** column index helpers on the terrain grid */
const TNX = Math.round((TERR.x1 - TERR.x0) / TERR.cell), TNZ = Math.round((TERR.z1 - TERR.z0) / TERR.cell);

function hsv(h, s, v) { const c = new THREE.Color(); c.setHSL(h, s, v); return c; }
function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

/** Thicken a voxelized glyph by r cells (brush weight like the concept frames); recompute edge distance. */
function boldVoxels(v, cells, r) {
  const id = new Int32Array(cells * cells).fill(-1);
  v.voxels.forEach((c, i) => { id[c.gy * cells + c.gx] = i; });
  const out = v.voxels.map((c) => ({ ...c }));
  const R = Math.ceil(r);
  for (let gy = 0; gy < cells; gy++) for (let gx = 0; gx < cells; gx++) {
    if (id[gy * cells + gx] >= 0) continue;
    let best = -1, bd = 1e9;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const x = gx + dx, y = gy + dy; if (x < 0 || y < 0 || x >= cells || y >= cells) continue;
      const j = id[y * cells + x]; const d = dx * dx + dy * dy;
      if (j >= 0 && d <= r * r && (d < bd || (d === bd && v.voxels[j].stroke < v.voxels[best].stroke))) { bd = d; best = j; }
    }
    if (best >= 0) out.push({ gx, gy, stroke: v.voxels[best].stroke, param: v.voxels[best].param, edge: 0 });
  }
  const occ = new Uint8Array(cells * cells); for (const c of out) occ[c.gy * cells + c.gx] = 1;
  const D = new Float32Array(cells * cells); for (let i = 0; i < D.length; i++) D[i] = occ[i] ? 1e6 : 0;
  for (let gy = 0; gy < cells; gy++) for (let gx = 0; gx < cells; gx++) { const i = gy * cells + gx; if (!D[i]) continue;
    D[i] = Math.min(D[i], (gx ? D[i - 1] : 0) + 1, (gy ? D[i - cells] : 0) + 1); }
  for (let gy = cells - 1; gy >= 0; gy--) for (let gx = cells - 1; gx >= 0; gx--) { const i = gy * cells + gx; if (!D[i]) continue;
    D[i] = Math.min(D[i], (gx < cells - 1 ? D[i + 1] : 0) + 1, (gy < cells - 1 ? D[i + cells] : 0) + 1); }
  for (const c of out) c.edge = D[c.gy * cells + c.gx];
  return { ...v, voxels: out };
}

// ------------------------------------------------------------------ shared GLSL bits
const VOX_VS_HEAD = /* glsl */`
  varying vec3 vWP; varying vec3 vWN;
  attribute float aHue; attribute float aKind; varying float vHue; varying float vKind;`;
const VOX_VS_BODY = /* glsl */`
  { mat4 mwp = modelMatrix;
    #ifdef USE_INSTANCING
      mwp = modelMatrix * instanceMatrix;
    #endif
    vWP = (mwp * vec4(position, 1.0)).xyz; vWN = normalize(mat3(mwp) * objectNormal); vHue = aHue; vKind = aKind; }`;
const NOISE_GLSL = /* glsl */`
  float vh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(vh(i), vh(i+vec2(1,0)), f.x), mix(vh(i+vec2(0,1)), vh(i+vec2(1,1)), f.x), f.y); }
  vec3 hue2rgb(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  // anti-aliased line coverage for a periodic coordinate (lines of width w in period units)
  float lineAA(float x, float w){ float fw = max(fwidth(x), 1e-4); float d = abs(fract(x) - 0.5); return 1.0 - smoothstep(0.5 - w - fw, 0.5 - w + fw, d); }
  float fadeFreq(float x){ float fw = fwidth(x); return 1.0 - smoothstep(0.18, 0.45, fw); }`;

function patchVoxel(mat, fragBody) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VOX_VS_HEAD)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VOX_VS_BODY);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; varying float vHue; varying float vKind;\n' + NOISE_GLSL)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + fragBody);
  };
  mat.customProgramCacheKey = () => 'act5vox|' + fragBody.length;
  return mat;
}

// glyph columns: rainbow coloured-pencil hatching on top (two scales: coarse visible from the air, fine in the
// close-up), cream plaster sides with voxel layer lines
const GLYPH_FRAG = /* glsl */`
  vec3 paper = vec3(0.95, 0.91, 0.83);
  if (vWN.y > 0.5) {
    vec3 hc = hue2rgb(vHue); hc = pow(hc * 0.9 + 0.06, vec3(1.25));
    float n = vn(vWP.xz * 0.05);
    vec2 p = vWP.xz;
    // coarse hatching (reads from 1900 m up): two diagonal sets, slight wobble
    float c1 = lineAA(dot(p, vec2(0.83, 0.56)) / 3.4 + n * 0.8, 0.30);
    float c2 = lineAA(dot(p, vec2(-0.5, 0.87)) / 4.1 - n * 0.6, 0.22);
    // fine hatching (pencil grain at hero scale)
    float fx = dot(p, vec2(0.83, 0.56)) / 0.055 + vn(p * 4.0) * 0.35 + vn(p * 0.7) * 2.0;
    float f1 = lineAA(fx, 0.32) * fadeFreq(fx);
    float grain = vn(p * 9.0) * 0.5 + vn(p * 31.0) * 0.5;
    float cw = smoothstep(0.003, 0.03, fwidth(dot(p, vec2(0.83, 0.56)) / 3.4));   // coarse set only from afar
    float cov = clamp(0.72 + 0.3 * cw * max(c1, c2 * 0.8) + 0.3 * f1 - 0.25 * grain + 0.15 * n, 0.0, 1.0);
    vec3 col = mix(paper, hc * (0.86 + 0.22 * grain), cov);
    // pencil pressure varies along the stroke
    col *= 0.93 + 0.1 * vn(p * 0.02 + vHue * 13.0);
    diffuseColor.rgb = col;
  } else {
    float lay = lineAA(vWP.y / 3.0, 0.06);
    vec3 side = paper * vec3(0.98, 0.93, 0.84) * (0.92 + 0.08 * vn(vWP.xy * 0.3 + vWP.zy * 0.3));
    side *= 1.0 - 0.22 * lay;
    diffuseColor.rgb = side;
  }`;

// terrain columns: instance colour on top (+ faint voxel grid), earthy layered sides
const TERR_FRAG = /* glsl */`
  vec3 top = diffuseColor.rgb;
  vec2 g = vWP.xz / 10.0;
  float grid = max(lineAA(g.x, 0.03), lineAA(g.y, 0.03));
  if (vWN.y > 0.5) {
    float n = vn(vWP.xz * 0.21) * 0.5 + vn(vWP.xz * 0.9) * 0.5;
    diffuseColor.rgb = top * (0.9 + 0.2 * n) * (1.0 - 0.06 * grid);
  } else {
    float lay = lineAA(vWP.y / 6.0, 0.05);
    vec3 soil = mix(top * 0.55, vec3(0.45, 0.34, 0.22), vKind > 0.5 ? 0.2 : 0.55);
    diffuseColor.rgb = soil * (1.0 - 0.25 * lay) * (1.0 - 0.15 * grid);
  }`;

// ------------------------------------------------------------------ pencil (hero scale, canon: yellow body,
// rainbow core + BLUE cap = FUNCTIONS)
export function makePencil({ len = 1.7, r = 0.045, kind = 'rainbow' } = {}) {
  const g = new THREE.Group();
  const coneL = r * 3.6, leadL = coneL * 0.32;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.45 }));
  body.position.y = coneL + len / 2; g.add(body);
  // painted facet edges: thin darker hex prism slightly rotated
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.32, coneL - leadL, 6, 1, false), new THREE.MeshStandardMaterial({ color: 0xe8c08a, roughness: 0.8 }));
  wood.position.y = leadL + (coneL - leadL) / 2; g.add(wood);
  // rainbow lead: a short cone with vertical hue bands (Koh-i-Noor Magic)
  const leadMat = new THREE.ShaderMaterial({
    uniforms: { uKind: { value: kind === 'rainbow' ? 1 : 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float uKind; varying vec3 vP;
      vec3 hue2rgb(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
      void main(){ float a = atan(vP.z, vP.x) / 6.2831853 + 0.5;
        vec3 c = mix(vec3(0.16,0.16,0.18), hue2rgb(floor(a * 6.0) / 6.0) * 0.95, uKind);
        gl_FragColor = vec4(pow(c, vec3(2.2)) * 0.9, 1.0); }`,
  });
  const lead = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.32, 0.002, leadL, 12), leadMat);
  lead.position.y = leadL / 2; g.add(lead);
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, r * 2.2, 16), new THREE.MeshStandardMaterial({ color: 0xc8c8d0, metalness: 0.8, roughness: 0.3 }));
  ferrule.position.y = coneL + len + r * 1.1; g.add(ferrule);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r * 0.98, r * 2.4, 16), new THREE.MeshStandardMaterial({ color: kind === 'rainbow' ? 0x4f8bff : 0xff8a5c, roughness: 0.7 }));
  cap.position.y = coneL + len + r * 3.3; g.add(cap);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.tipLen = 0; // origin = tip
  return g;
}

// ------------------------------------------------------------------ build
export async function buildWorld5(ctx) {
  const scene = new THREE.Scene();
  const sky = makeSky(); scene.add(sky);
  envUniforms.uSunDir.value.copy(SUN_DIR);
  scene.environment = makeEnvironment(ctx.renderer);
  scene.environmentIntensity = 0.55;

  const k = GLYPH.k, cells = GLYPH.cells, cs = 1024 / cells, vox = cs * k;
  // ---- glyph occupancy (for terrain flattening) and glyph columns
  const occ = new Uint8Array(TNX * TNZ);
  const glyphCols = []; let strokeBase = 0; const strokeMeta = [];
  const totalStrokes = 20;
  const glyphData = [];
  for (let gi = 0; gi < 4; gi++) {
    const data = await loadHanzi(CHARS[gi]); glyphData.push(data);
    const v = boldVoxels(voxelizeHanzi(data, { cells }), cells, GLYPH.bold);
    const cx = GLYPH.xs[gi], cz = GLYPH.z;
    for (const c of v.voxels) {
      const x = cx + ((c.gx + 0.5) * cs - 512) * k;
      const z = cz - ((c.gy + 0.5) * cs - 124 - 388) * k;
      const gs = strokeBase + c.stroke;
      glyphCols.push({ x, z, gs, param: c.param, edge: c.edge });
      // occupancy (dilated by ~2 terrain cells)
      const ix = Math.floor((x - TERR.x0) / TERR.cell), iz = Math.floor((z - TERR.z0) / TERR.cell);
      for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
        const jx = ix + dx, jz = iz + dz; if (jx >= 0 && jz >= 0 && jx < TNX && jz < TNZ) occ[jz * TNX + jx] = Math.max(occ[jz * TNX + jx], dx * dx + dz * dz <= 9 ? 2 : 1);
      }
    }
    for (let s = 0; s < v.strokeCount; s++) strokeMeta.push({ glyph: gi, stroke: s, gs: strokeBase + s });
    strokeBase += v.strokeCount;
  }
  void totalStrokes;
  // soft flatten field around the glyphs (distance in cells, blurred)
  const flat = new Float32Array(TNX * TNZ);
  for (let i = 0; i < occ.length; i++) flat[i] = occ[i] ? 1 : 0;
  for (let it = 0; it < 6; it++) { // cheap blur/dilate passes
    const nf = new Float32Array(flat);
    for (let z = 1; z < TNZ - 1; z++) for (let x = 1; x < TNX - 1; x++) {
      const i = z * TNX + x; nf[i] = Math.max(flat[i], 0.8 * Math.max(flat[i - 1], flat[i + 1], flat[i - TNX], flat[i + TNX]));
    }
    flat.set(nf);
  }

  // ---- terrain columns
  const tGeo = new THREE.BoxGeometry(1, 1, 1); tGeo.translate(0, 0.5, 0);
  const tMat = patchVoxel(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92 }), TERR_FRAG);
  const tCount = TNX * TNZ;
  const terrain = new THREE.InstancedMesh(tGeo, tMat, tCount);
  const aKindT = new Float32Array(tCount), aHueT = new Float32Array(tCount);
  const hmap = new Float32Array(tCount);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  const bottom = -60;
  for (let iz = 0; iz < TNZ; iz++) for (let ix = 0; ix < TNX; ix++) {
    const i = iz * TNX + ix;
    const x = TERR.x0 + (ix + 0.5) * TERR.cell, z = TERR.z0 + (iz + 0.5) * TERR.cell;
    let h = rawHeight(x, z);
    const f = flat[i];
    h = h * (1 - f) + GLYPH.base * f;
    h = Math.round(h / TERR.step) * TERR.step;
    if (h < WATER_Y - 2) h = Math.min(h, -4 - Math.floor(-(h) / 10) * 2);
    hmap[i] = h;
    const top = h;
    m4.makeScale(TERR.cell, top - bottom, TERR.cell); m4.setPosition(x, bottom, z);
    terrain.setMatrixAt(i, m4);
    const n = fbm(x * 0.01, z * 0.01, 2, 9);
    if (h < WATER_Y - 2) { // seabed: turquoise shallows -> deep
      const d = Math.min(1, (WATER_Y - h) / 60);
      col.setRGB(0.25 - 0.22 * d, 0.78 - 0.45 * d, 0.74 - 0.18 * d); aKindT[i] = 1;
    } else if (h <= WATER_Y + 6) { col.setRGB(0.93, 0.85, 0.62); aKindT[i] = 1; }       // sand
    else {
      const hh = Math.min(1, (h - 10) / 90);
      col.setRGB(0.36 + 0.14 * hh + 0.06 * n, 0.62 + 0.06 * hh + 0.05 * n, 0.2 + 0.03 * n);
      // field patches (rotated 70-unit grid) on the gentler ground: gold / light / dark green, striped rows
      const fa = 0.35, fu = (x * Math.cos(fa) + z * Math.sin(fa)) / 70, fv = (-x * Math.sin(fa) + z * Math.cos(fa)) / 52;
      const fh = hash(Math.floor(fu), Math.floor(fv), 12);
      if (h < 60 && fh < 0.55 && f < 0.3) {
        const pal = [[0.78, 0.72, 0.32], [0.55, 0.7, 0.28], [0.27, 0.5, 0.17], [0.68, 0.76, 0.36], [0.85, 0.66, 0.3]];
        const pc = pal[Math.floor(fh / 0.55 * pal.length) % pal.length];
        const stripe = (Math.floor(fv * 52 / 20) % 2 === 0) ? 1 : 0.9;
        col.setRGB(pc[0] * stripe, pc[1] * stripe, pc[2] * stripe);
      }
      if (hash(ix, iz, 3) < 0.04) col.multiplyScalar(0.9);
      aKindT[i] = 0;
    }
    terrain.setColorAt(i, col.convertSRGBToLinear());
  }
  tGeo.setAttribute('aKind', new THREE.InstancedBufferAttribute(aKindT, 1));
  tGeo.setAttribute('aHue', new THREE.InstancedBufferAttribute(aHueT, 1));
  terrain.castShadow = true; terrain.receiveShadow = true; terrain.frustumCulled = false;
  scene.add(terrain);
  const heightAt = (x, z) => {
    const ix = Math.max(0, Math.min(TNX - 1, Math.floor((x - TERR.x0) / TERR.cell))), iz = Math.max(0, Math.min(TNZ - 1, Math.floor((z - TERR.z0) / TERR.cell)));
    return hmap[iz * TNX + ix];
  };

  // ---- water: semi-transparent turquoise sheet with sun glints
  const waterMat = new THREE.ShaderMaterial({
    uniforms: { uTime: envUniforms.uTime, uSunDir: envUniforms.uSunDir },
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: NOISE_GLSL + /* glsl */`
      uniform float uTime; uniform vec3 uSunDir; varying vec3 vW;
      void main(){
        vec2 p = vW.xz;
        float n = vn(p * 0.03 + vec2(uTime * 0.15, uTime * 0.07)) * 0.6 + vn(p * 0.11 - vec2(uTime * 0.3, 0.0)) * 0.4;
        vec3 V = normalize(vW - cameraPosition);
        vec3 N = normalize(vec3((n - 0.5) * 0.35, 1.0, (vn(p * 0.07 + 3.0 + uTime * 0.1) - 0.5) * 0.35));
        vec3 R = reflect(V, N);
        float spec = pow(max(dot(R, uSunDir), 0.0), 220.0) * 6.0;
        vec3 c = vec3(0.05, 0.42, 0.55);
        gl_FragColor = vec4(c * (0.8 + 0.4 * n) + vec3(1.0, 0.92, 0.75) * spec, 0.5 + 0.12 * n);
      }`,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(TERR.x1 - TERR.x0 + 4000, TERR.z1 - TERR.z0 + 4000), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.y = WATER_Y; water.userData.noAO = true; water.renderOrder = 5;
  scene.add(water);
  // far ground beyond the voxel field (so the close-up horizon is not empty)
  const farMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.32, 0.55, 0.22), roughness: 1 });
  const far = new THREE.Mesh(new THREE.RingGeometry(1700, 30000, 64, 1), farMat); far.rotation.x = -Math.PI / 2; far.position.y = 0; far.receiveShadow = true;
  scene.add(far);

  // ---- glyph columns
  const gGeo = new THREE.BoxGeometry(1, 1, 1); gGeo.translate(0, 0.5, 0);
  const gMat = patchVoxel(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), GLYPH_FRAG);
  const glyphs = new THREE.InstancedMesh(gGeo, gMat, glyphCols.length);
  const aHueG = new Float32Array(glyphCols.length), aKindG = new Float32Array(glyphCols.length);
  glyphCols.forEach((c, i) => {
    const pillow = Math.min(1, Math.sqrt(Math.max(0, c.edge - 0.5) / 3));
    const top = GLYPH.top - (c.edge <= 1 ? 3 : 0) + 0 * pillow; // the brush edge steps down one notch
    m4.makeScale(vox * 1.001, top - GLYPH.base + 8, vox * 1.001); m4.setPosition(c.x, GLYPH.base - 8, c.z);
    glyphs.setMatrixAt(i, m4);
    aHueG[i] = (c.gs / 20) * 0.86 + 0.98; // red-orange -> ... -> magenta (wraps)
    aKindG[i] = c.gs;
  });
  gGeo.setAttribute('aHue', new THREE.InstancedBufferAttribute(aHueG, 1));
  gGeo.setAttribute('aKind', new THREE.InstancedBufferAttribute(aKindG, 1));
  glyphs.castShadow = true; glyphs.receiveShadow = true; glyphs.frustumCulled = false;
  scene.add(glyphs);

  // ---- cypresses (voxel stacks) in rows along the hills, away from glyphs and water
  const rnd = mulberry32(55);
  const trees = [];
  for (let tries = 0; tries < 9000 && trees.length < 420; tries++) {
    const x = TERR.x0 + 60 + rnd() * (TERR.x1 - TERR.x0 - 120), z = TERR.z0 + 60 + rnd() * (TERR.z1 - TERR.z0 - 120);
    const ix = Math.floor((x - TERR.x0) / TERR.cell), iz = Math.floor((z - TERR.z0) / TERR.cell);
    if (flat[iz * TNX + ix] > 0.05) continue;
    const h = heightAt(x, z); if (h < 16) continue;
    if (vnoise(x * 0.006, z * 0.006, 41) < 0.6) continue; // clustered groves
    trees.push([x, h, z, 0.7 + rnd() * 0.6]);
  }
  const tb = [];
  for (const [x, h, z, s] of trees) {
    const levels = 5;
    for (let l = 0; l < levels; l++) { const w = (6.5 - l * 1.1) * s; tb.push([x, h + l * 5 * s, z, w, 5.2 * s]); }
  }
  const trGeo = new THREE.BoxGeometry(1, 1, 1); trGeo.translate(0, 0.5, 0);
  const trees3 = new THREE.InstancedMesh(trGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(0.08, 0.2, 0.07), roughness: 0.9 }), tb.length);
  tb.forEach(([x, y, z, w, hh], i) => { m4.makeScale(w, hh, w); m4.setPosition(x, y, z); trees3.setMatrixAt(i, m4); });
  trees3.castShadow = true; trees3.receiveShadow = true; trees3.frustumCulled = false; scene.add(trees3);

  // ---- ruins: terracotta temple + a broken enclosure
  const ruinBoxes = [];
  const temple = (cx, cz, rot) => {
    const h0 = heightAt(cx, cz);
    const B = (x, y, z, w, h, d) => { const c = Math.cos(rot), s = Math.sin(rot); ruinBoxes.push([cx + x * c - z * s, h0 + y, cz + x * s + z * c, w, h, d, rot]); };
    B(0, 0, 0, 110, 6, 70); B(0, 6, 0, 100, 4, 60);
    for (let i = 0; i < 7; i++) for (const zz of [-24, 24]) if (!(i === 5 && zz > 0)) B(-45 + i * 15, 10, zz, 7, i === 2 && zz < 0 ? 12 : 26, 7);
    for (const zz of [-10, 10]) B(-45, 10, zz, 7, 26, 7);
    B(-12, 36, -24, 70, 5, 9);
  };
  temple(120, -520, 0.15);
  const enclosure = (cx, cz) => {
    const h0 = heightAt(cx, cz);
    const B = (x, z, w, d, h) => ruinBoxes.push([cx + x, h0, cz + z, w, h, d, 0]);
    B(0, -40, 120, 6, 14); B(-60, 0, 6, 80, 10); B(60, 10, 6, 60, 8); B(-30, 40, 60, 6, 12); B(-20, -5, 40, 30, 22);
  };
  enclosure(-640, 560);
  const rGeo = new THREE.BoxGeometry(1, 1, 1); rGeo.translate(0, 0.5, 0);
  const ruins = new THREE.InstancedMesh(rGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(0.78, 0.42, 0.25).convertSRGBToLinear(), roughness: 0.85 }), ruinBoxes.length);
  const q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  ruinBoxes.forEach(([x, y, z, w, h, d, r], i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r); m4.compose(ps.set(x, y, z), q, sc.set(w, h, d)); ruins.setMatrixAt(i, m4); });
  ruins.castShadow = true; ruins.receiveShadow = true; scene.add(ruins);

  // ---- voxel clouds (between the final aerial camera and the ground; the rocket climbs through them)
  const cloudBoxes = []; const crnd = mulberry32(91);
  const cloudSpots = [[-560, 980, -330, 1.0], [-760, 760, -440, 0.8], [600, 1050, -320, 0.9], [640, 900, 460, 1.0], [-640, 1000, 430, 0.8], [180, 760, 640, 0.7]];
  for (const [cx, cy, cz, s] of cloudSpots) {
    const n = Math.round(26 * s);
    for (let i = 0; i < n; i++) {
      const a = crnd() * Math.PI * 2, rr = Math.sqrt(crnd()) * 70 * s;
      const w = (22 + crnd() * 30) * s;
      cloudBoxes.push([Math.round((cx + Math.cos(a) * rr * 1.5) / 8) * 8, Math.round((cy + (crnd() - 0.5) * 18 * s) / 8) * 8, Math.round((cz + Math.sin(a) * rr) / 8) * 8, w, w * 0.6, w]);
    }
  }
  const cGeo = new THREE.BoxGeometry(1, 1, 1);
  const clouds = new THREE.InstancedMesh(cGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: new THREE.Color(0.32, 0.32, 0.36) }), cloudBoxes.length);
  cloudBoxes.forEach(([x, y, z, w, h, d], i) => { m4.makeScale(w, h, d); m4.setPosition(x, y, z); clouds.setMatrixAt(i, m4); });
  clouds.castShadow = false; clouds.userData.noAO = true; scene.add(clouds);

  // ---- heroes: tiny voxel figures on the first 一 (they read as dots from the air)
  const heroes = {};
  const yi = glyphCols.filter((c) => c.gs === 0);
  const yiMinX = Math.min(...yi.map((c) => c.x)), yiMaxX = Math.max(...yi.map((c) => c.x));
  const yiZ = yi.reduce((a, c) => a + c.z, 0) / yi.length;
  const S = 0.2;
  const spots = { jade: [yiMinX + (yiMaxX - yiMinX) * 0.47, yiZ + 1], charlie: [yiMinX + (yiMaxX - yiMinX) * 0.41, yiZ - 8], ricky: [yiMinX + (yiMaxX - yiMinX) * 0.36, yiZ - 3] };
  for (const n of ['jade', 'charlie', 'ricky']) {
    const a = new Actor(ctx.lib, n, { name: n }).voxel({ scale: S });
    a.set({ anim: n === 'jade' ? 'draw_rainbow' : 'idle', t: 0, pencil: n === 'jade' });
    a.position.set(spots[n][0], GLYPH.top, spots[n][1]);
    a.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    heroes[n] = a; scene.add(a);
  }

  // ---- lights
  const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.86, 0.68), 3.4);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  const sunT = new THREE.Object3D(); scene.add(sunT); sun.target = sunT; scene.add(sun);
  const hemi = new THREE.HemisphereLight(new THREE.Color(0.55, 0.68, 0.95), new THREE.Color(0.55, 0.45, 0.3), 0.55); scene.add(hemi);
  function setShadow(center, extent) {
    sunT.position.copy(center); sun.position.copy(center).addScaledVector(SUN_DIR, 4000);
    const c = sun.shadow.camera; c.left = c.bottom = -extent; c.right = c.top = extent; c.near = 10; c.far = 9000; c.updateProjectionMatrix();
    sunT.updateMatrixWorld(); sun.updateMatrixWorld();
  }
  setShadow(new THREE.Vector3(0, 0, 0), 1600);

  return { scene, sky, terrain, glyphs, glyphCols, strokeMeta, clouds, heroes, sun, hemi, setShadow, heightAt, yi: { minX: yiMinX, maxX: yiMaxX, z: yiZ }, water, vox, glyphData };
}

/** The post look for the Act V 3D world (no pixelation / palette; ACES, gentle grade). */
export function look5(post, t, { dof = 0, focus = 100, ao = 0.7, bloom = 0.22, exposure = 0.66, atmos = 0.0, vignette = 0.28 } = {}) {
  envUniforms.uTime.value = t; envUniforms.uSunDir.value.copy(SUN_DIR);
  const F = post.finalMat.uniforms;
  F.uPix.value = 1; F.uPalMix.value = 0; F.uOutline.value = 0; F.uTone.value = 1; F.uExposure.value = exposure;
  F.uVignette.value = vignette; F.uGrain.value = 0.012; F.uTime.value = t; F.uGrade.value = 0.7; F.uSat.value = 1.12; F.uContrast.value = 1.05; F.uFlatGain.value = 1;
  post.params.bloom = bloom; post.bloom.threshold = 1.1; post.bloom.radius = 0.5;
  post.params.dof = dof; post.params.focus = focus; post.dofMat.uniforms.uMaxR.value = 9;
  post.params.ao = ao; post.params.atmos = atmos; post.params.rays = 0; post.params.distOffset = 0;
}
