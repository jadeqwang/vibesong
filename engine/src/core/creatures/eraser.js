// THE ERASER, sculpted in voxels (replaces the smooth act4/eraser3d.js block when a scene wants it; same set() names).
// A big beveled rubber block with wear and chipped corners, a crumbly rubbed end (the bottom front edge is worn into a
// wedge), the Act I rainbow smudge on its cheek (it rubbed colour and it would not come off), heavy-lidded eyes and bags,
// the beige paper sleeve with two blue stripes (art-dept design), stubby arms, rubber crumbs, and an optional small beige
// flat cap (Charlie's, the SHIP-it role at 149.22).
//   const e = makeEraser({ lod: 'lo'|'mid'|'hi', onMaterial, sleeve: true, crumbs: true });
//   e.set({ pink: 0..1, face: 'grumpy'|'look'|'happy'|'sing', blink: 0..1, cap: bool, scrub, lean, squash, wave })
// Model units like eraser3d: origin = bottom centre, height 1.6, width 1.0 (x), depth 0.62 (z), FACE TOWARD +z.
// Scale the group to size (mountain: e.scale.setScalar(900 / 1.6)). LOD = voxels across the width: lo 60, mid 120, hi 240
// (the face is 0.86 wide: ~206 voxels at hi). pink is a per-vertex colour pair + a top-down hatched colouring wavefront
// (Act IV's Jade-colours-it-in transition), so pink can be animated 0..1 without re-meshing.
import * as THREE from 'three';
import { vnoise, hash3, mulberry, rgb, ell, sphere, xform } from './vox.js';
import { flatCapShape, flatCapCol } from './features.js';

const W = 1.0, H = 1.6, D = 0.62, BEV = 0.075;
export const ERASER_COLORS = { gray: '#8f8c92', gray2: '#8a878d', graySpeck: '#7b787f', grayTop: '#a3a0a6', grayRub: '#6c6970',
  pink: '#f2788f', pink2: '#ef7389', pinkSpeck: '#e3687f', pinkTop: '#f7a1b0', pinkRub: '#da6179',
  sleeve: '#dccfae', sleeve2: '#d2c4a0', stripe: '#3f6fc2', ink: '#1d1b22', lash: '#2a2830', white: '#f4efe4', mouth: '#2a2228',
  mouthRed: '#7a1630', tongue: '#ff6b8a', blush: '#ff7f98', browG: '#3b3940', browP: '#8c3a50' };
const C = ERASER_COLORS; const LOD = { lo: 60, mid: 120, hi: 240 };
const RAINBOW = ['#ff4d4d', '#ff9a3c', '#ffe14d', '#4fd06a', '#3fa0ff', '#a35cff'];
// face slab: a pocket in the front of the body filled by one slab per expression (relief height map + colours)
const FACE = { x: 0.43, y0: 0.88, y1: 1.5, depth: 0.04 }; const FY = 1.17;   // FY = face centre height

// ------------------------------------------------------------------------------------------------ dual-colour mesher
// occ(i,j,k) -> bool via Uint8Array; colFn(i,j,k) -> [grayRGB, pinkRGB] (sRGB byte triplets) called for surface cells only.
const SRGB2LIN = new Float32Array(256).map((_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
function meshDual(occ, nx, ny, nz, colFn, { s, origin, ao = 0.34 }) {
  const at = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= nx || y >= ny || z >= nz) ? 0 : occ[x + nx * (y + ny * z)];
  let nf = 0;
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) { if (!occ[x + nx * (y + ny * z)]) continue;
    nf += !at(x - 1, y, z) + !at(x + 1, y, z) + !at(x, y - 1, z) + !at(x, y + 1, z) + !at(x, y, z - 1) + !at(x, y, z + 1); }
  const pos = new Float32Array(nf * 12), nrm = new Int8Array(nf * 12), c1 = new Float32Array(nf * 12), c2 = new Float32Array(nf * 12);
  const idx = nf * 4 > 65535 ? new Uint32Array(nf * 6) : new Uint16Array(nf * 6);
  const aoK = [1 - ao, 1 - ao * 0.62, 1 - ao * 0.28, 1]; const p = [0, 0, 0], q = [0, 0, 0], w = [0, 0, 0], lv = [0, 0, 0, 0];
  let nv = 0, ni = 0;
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    if (!occ[x + nx * (y + ny * z)]) continue; let cc = null;
    for (let a = 0; a < 3; a++) for (let sg = -1; sg <= 1; sg += 2) {
      p[0] = x; p[1] = y; p[2] = z; p[a] += sg; if (at(p[0], p[1], p[2])) continue;
      if (!cc) cc = colFn(x, y, z, a, sg);
      const u = (a + 1) % 3, v = (a + 2) % 3; const base = nv;
      for (let c = 0; c < 4; c++) {
        const du = c === 1 || c === 2 ? 1 : 0, dv = c >= 2 ? 1 : 0;
        q[0] = p[0]; q[1] = p[1]; q[2] = p[2]; q[u] += du ? 1 : -1; const s1 = at(q[0], q[1], q[2]);
        q[u] = p[u]; q[v] += dv ? 1 : -1; const s2 = at(q[0], q[1], q[2]);
        q[u] += du ? 1 : -1; const s3 = at(q[0], q[1], q[2]);
        const l = s1 && s2 ? 0 : 3 - (s1 + s2 + s3); lv[c] = l; const k = aoK[l];
        w[0] = x; w[1] = y; w[2] = z; w[a] += sg > 0 ? 1 : 0; w[u] += du; w[v] += dv;
        const o = nv * 3; pos[o] = origin[0] + w[0] * s; pos[o + 1] = origin[1] + w[1] * s; pos[o + 2] = origin[2] + w[2] * s;
        nrm[o] = a === 0 ? sg * 127 : 0; nrm[o + 1] = a === 1 ? sg * 127 : 0; nrm[o + 2] = a === 2 ? sg * 127 : 0;
        const A = cc[0], B = cc[1];
        c1[o] = SRGB2LIN[A[0]] * k; c1[o + 1] = SRGB2LIN[A[1]] * k; c1[o + 2] = SRGB2LIN[A[2]] * k;
        c2[o] = SRGB2LIN[B[0]] * k; c2[o + 1] = SRGB2LIN[B[1]] * k; c2[o + 2] = SRGB2LIN[B[2]] * k; nv++;
      }
      const flip = lv[0] + lv[2] < lv[1] + lv[3];
      const t = sg > 0 ? (flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3]) : (flip ? [1, 3, 2, 1, 0, 3] : [0, 2, 1, 0, 3, 2]);
      for (const k of t) idx[ni++] = base + k;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3, true));
  geo.setAttribute('color', new THREE.BufferAttribute(c1, 3)); geo.setAttribute('color2', new THREE.BufferAttribute(c2, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere(); geo.computeBoundingBox(); geo.userData.faces = nf;
  return geo;
}

// ------------------------------------------------------------------------------------------------ shapes (model units)
function rboxD(x, y, z, hx, hy, hz, cy, rr) { const qx = Math.abs(x) - hx + rr, qy = Math.abs(y - cy) - hy + rr, qz = Math.abs(z) - hz + rr;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - rr; }
const R0 = mulberry(4242);
const CHIPS = Array.from({ length: 16 }, () => { // chips along the vertical edges and the top rim
  const e = Math.floor(R0() * 3); const sx = R0() < 0.5 ? -1 : 1, sz = R0() < 0.5 ? -1 : 1;
  const c = e === 0 ? [sx * W / 2, 0.25 + R0() * 1.25, sz * D / 2] : e === 1 ? [(R0() - 0.5) * W * 0.9, H, sz * D / 2] : [sx * W / 2, H, (R0() - 0.5) * D * 0.8];
  if (sz > 0 && e !== 2 && c[1] > FACE.y0 - 0.05 && Math.abs(c[0]) < W / 2 - 0.02 && e === 1) c[2] = -D / 2;   // keep chips off the face
  return { c, r: 0.025 + R0() * 0.035 }; });
/** worn-end cut height at z: the bottom front edge rubbed into a wedge */
const rubCut = (z) => 0.015 + 0.17 * Math.pow(Math.max(0, z / D + 0.5), 2.2);
function bodyD(x, y, z) {
  let d = rboxD(x, y, z, W / 2, H / 2, D / 2, H / 2, BEV);
  if (d > 0.012) return d;                                    // outside the max wear displacement
  let near = null;
  for (const ch of CHIPS) { const q = (x - ch.c[0]) ** 2 + (y - ch.c[1]) ** 2 + (z - ch.c[2]) ** 2; if (q < (ch.r * 1.25) ** 2) (near ||= []).push(ch); }
  if (d < -0.012 && !near) return d;                          // deep inside, no chip here
  // wear lives on the edges and corners (flat faces stay flat: low-frequency wear on a flat terraces into contour lines)
  const a0 = Math.min(1, Math.max(0, (Math.abs(x) - (W / 2 - 0.12)) / 0.12)), a1 = Math.min(1, Math.max(0, (Math.abs(y - H / 2) - (H / 2 - 0.12)) / 0.12)), a2 = Math.min(1, Math.max(0, (Math.abs(z) - (D / 2 - 0.12)) / 0.12));
  const edgeK = a0 + a1 + a2 - Math.max(a0, a1, a2);                                   // ~ second largest: > 0 only near an edge
  d -= Math.min(1, edgeK) * (0.009 * vnoise(x * 16, y * 16, z * 16) + 0.004 * vnoise(x * 55, y * 55, z * 55));
  if (near) for (const ch of near) { const e = Math.hypot(x - ch.c[0], y - ch.c[1], z - ch.c[2]) - ch.r * (0.8 + 0.4 * vnoise(x * 70, y * 70, z * 70)); d = Math.max(d, -e); }
  return d;
}
function bodyOcc(x, y, z) {
  if (Math.abs(x) < W / 2 - 0.11 && Math.abs(z) < D / 2 - 0.11 && y > 0.3 && y < H - 0.11) return true;   // deep inside
  if (y < rubCut(z) + 0.03) { const cut = rubCut(z); if (y < cut) return false;
    if (vnoise(x * 70, y * 70, z * 70) > 0.15 && y < cut + 0.025) return false; }                       // crumbly rubbed edge
  return bodyD(x, y, z) <= 0;
}
const inFacePocket = (x, y, z) => z > D / 2 - FACE.depth && Math.abs(x) < FACE.x && y > FACE.y0 && y < FACE.y1;

// ------------------------------------------------------------------------------------------------ face (2D relief + colours)
// returns { h (height above the front plane, model units), c: [gray, pink] hex }
function ellD(x, y, cx, cy, rx, ry) { return Math.hypot((x - cx) / rx, (y - cy) / ry); }
function smudge(x, y) {   // the Act I rainbow smear on its right cheek (+x) and a fainter one top-left
  const sm = (ax, ay, bx, by, wd, fade) => { const dx = bx - ax, dy = by - ay; const L = Math.hypot(dx, dy); const tt = ((x - ax) * dx + (y - ay) * dy) / (L * L); if (tt < 0 || tt > 1) return null;
    const off = ((x - ax) * dy - (y - ay) * dx) / L; if (Math.abs(off) > wd) return null; if (vnoise(x * 90, y * 90, 3) > 0.25 + 0.4 * (1 - fade * Math.sin(Math.PI * tt))) return null;
    const band = Math.floor((off / wd * 0.5 + 0.5) * 6); return RAINBOW[Math.max(0, Math.min(5, band))]; };
  return sm(0.13, FY - 0.31, 0.4, FY - 0.05, 0.085, 1) || sm(-0.4, FY + 0.27, -0.2, FY + 0.31, 0.03, 0.6);
}
function faceAt(x, y, kind, blink) {
  const body = null; let h = 0, c = body;
  const set = (hh, cc) => { h = hh; c = cc; };
  const grumpyLike = kind === 'grumpy' || kind === 'look';
  // nose bump
  { const e = ellD(x, y, 0, FY - 0.06, 0.045, 0.055); if (e < 1) set(0.016 * Math.sqrt(1 - e * e), body); }
  for (const s of [1, -1]) {
    const ex = s * 0.2, ey = FY + 0.05;
    if (grumpyLike) {
      const rx = 0.125, ry = 0.085; const e = ellD(x, y, ex, ey, rx, ry);
      // bags (both expressions of the heavy-lidded set)
      const eb = ellD(x, y, ex, ey - 0.045, 0.14, 0.1); if (eb < 1 && e >= 1 && y < ey) set(0.007, 'bag');
      if (kind === 'grumpy') { const ebb = ellD(x, y, ex, ey - 0.075, 0.14, 0.1); if (ebb < 1 && eb >= 1 && y < ey - 0.05) set(0.004, 'bag2'); }
      if (e < 1) {
        const lidK = (kind === 'grumpy' ? 0.52 : 0.2) + (1 - (kind === 'grumpy' ? 0.52 : 0.2)) * blink; // fraction of the eye height covered
        const lidY = ey + ry - lidK * 2 * ry + s * (x - ex) * (kind === 'grumpy' ? -0.08 : 0);     // droops toward the outside
        if (y > lidY) { const k = Math.sqrt(Math.max(0, 1 - e * e)); set(0.012 + 0.012 * k, y < lidY + 0.014 ? 'lash' : null); }
        else { const lx = ex + (kind === 'look' ? 0.045 : 0.025 * s * 0), ly = ey - 0.025; const pe = Math.hypot(x - lx, y - ly);
          if (pe < 0.05) set(-0.004, Math.hypot(x - lx - 0.016, y - ly - 0.018) < 0.013 ? C.white : C.ink); else set(-0.004, C.white); }
      } else if (e < 1.09) set(0.004, 'lash');
      // heavy brows
      const bx0 = s * 0.075, by0 = kind === 'grumpy' ? FY + 0.17 : FY + 0.22, bx1 = s * 0.34, by1 = kind === 'grumpy' ? FY + 0.2 : FY + 0.235;
      const tt = Math.max(0, Math.min(1, (x - bx0) / (bx1 - bx0))); const by = by0 + (by1 - by0) * tt + (kind === 'look' ? 0.03 * Math.sin(Math.PI * tt) : 0);
      if (Math.abs(y - by) < 0.022 && tt > 0 && tt < 1) set(0.02, 'brow');
    } else {
      const rx = 0.1, ry = 0.115; const e = ellD(x, y, ex, ey, rx, ry);
      if (blink > 0.5) { if (Math.abs(y - (ey - 0.02 + 0.05 * (1 - Math.pow((x - ex) / rx, 2)))) < 0.014 && Math.abs(x - ex) < rx) set(0.01, 'lash'); }
      else if (e < 1) { const lx = ex - s * 0.012, ly = ey - 0.01; const pe = Math.hypot(x - lx, y - ly);
        if (pe < 0.065) { const g1 = Math.hypot(x - lx - 0.022, y - ly - 0.024) < 0.019, g2 = Math.hypot(x - lx + 0.02, y - ly + 0.022) < 0.009; set(-0.002, g1 || g2 ? C.white : C.ink); }
        else set(-0.002, C.white); }
      else if (e < 1.1) set(0.004, 'lash');
      // arched brows, blush
      const tt = (x - s * 0.1) / (s * 0.22); if (tt > 0 && tt < 1 && Math.abs(y - (FY + 0.22 + 0.04 * Math.sin(Math.PI * tt))) < 0.014) set(0.014, 'brow');
      if (Math.hypot(x - s * 0.31, y - (FY - 0.1)) < 0.065 && h <= 0) set(0.002, C.blush);
    }
  }
  // mouths
  const my = FY - 0.2;
  if (kind === 'grumpy') { if (Math.abs(x) < 0.13 && Math.abs(y - (my + 0.02 - 0.07 * (x / 0.13) ** 2)) < 0.013) set(-0.012, C.mouth); }
  else if (kind === 'look') { const e = ellD(x, y, 0.02, my + 0.01, 0.04, 0.05); if (e < 1) set(-0.015, C.mouth); else if (e < 1.35) set(0.003, 'lip'); }
  else if (kind === 'happy') { const top = my + 0.06, bot = top - 0.13 * (1 - (x / 0.17) ** 2);
    if (Math.abs(x) < 0.17 && y < top && y > bot) set(-0.02, y < bot + 0.045 && Math.abs(x) < 0.09 ? C.tongue : C.mouthRed);
    else if (Math.abs(x) < 0.185 && y < top + 0.014 && y > bot - 0.014) set(0.004, 'lip'); }
  else if (kind === 'sing') { const e = ellD(x, y, 0, my, 0.075, 0.095); if (e < 1) set(-0.02, y < my - 0.04 ? C.tongue : C.mouthRed); else if (e < 1.18) set(0.004, 'lip'); }
  // smudge paints over skin-coloured relief only
  if (c === null || c === 'bag' || c === 'bag2') { const sm = smudge(x, y); if (sm) c = sm; }
  return { h, c };
}

// ------------------------------------------------------------------------------------------------ colours (gray / pink pairs)
function skin(x, y, z, a, sg, kind) {
  const n = vnoise(x * 4.5, y * 4.5, z * 4.5), sp = hash3(Math.floor(x * 400), Math.floor(y * 400), Math.floor(z * 400));
  if (a === 1 && sg > 0 && y > H - 0.06) return [rgb(C.grayTop), rgb(C.pinkTop)];
  if (y < rubCut(z) + 0.035) { const g = vnoise(x * 40, y * 120, z * 40) > 0.1; return [rgb(g ? C.grayRub : C.graySpeck), rgb(g ? C.pinkRub : C.pink2)]; }
  if (kind === 'bag') return [rgb(C.gray2), rgb(C.pink2)];
  if (kind === 'bag2') return [rgb(C.graySpeck), rgb(C.pink2)];
  if (sp > 0.996) return [rgb(C.graySpeck), rgb(C.pinkSpeck)];
  return n > 0.5 ? [rgb(C.gray2), rgb(C.pink2)] : [rgb(C.gray), rgb(C.pink)];
}
function faceColour(fc, x, y, z, a, sg) {
  if (fc === null || fc === 'bag' || fc === 'bag2') return skin(x, y, z, a, sg, fc);
  if (fc === 'lash') return [rgb(C.lash), rgb('#5a1e30')];
  if (fc === 'brow') return [rgb(C.browG), rgb(C.browP)];
  if (fc === 'lip') { const s = skin(x, y, z, a, sg); return [s[0].map((v) => v * 0.85 | 0), s[1].map((v) => v * 0.88 | 0)]; }
  return [rgb(fc), rgb(fc)];
}

// ------------------------------------------------------------------------------------------------ builders
function gridMesh(n, box, occFn, colFn, opts = {}) {
  // box = [x0, y0, z0, x1, y1, z1] model units; voxel v = W / n
  const v = W / n; const i0 = Math.floor(box[0] / v), j0 = Math.floor(box[1] / v), k0 = Math.floor(box[2] / v);
  const nx = Math.ceil(box[3] / v) - i0, ny = Math.ceil(box[4] / v) - j0, nz = Math.ceil(box[5] / v) - k0;
  const occ = new Uint8Array(nx * ny * nz); let count = 0;
  for (let k = 0; k < nz; k++) { const z = (k0 + k + 0.5) * v; for (let j = 0; j < ny; j++) { const y = (j0 + j + 0.5) * v; for (let i = 0; i < nx; i++) { const x = (i0 + i + 0.5) * v;
    if (occFn(x, y, z)) { occ[i + nx * (j + ny * k)] = 1; count++; } } } }
  const geo = meshDual(occ, nx, ny, nz, (i, j, k, a, sg) => colFn((i0 + i + 0.5) * v, (j0 + j + 0.5) * v, (k0 + k + 0.5) * v, a, sg), { s: v, origin: [i0 * v, j0 * v, k0 * v], ao: opts.ao ?? 0.34 });
  geo.userData.voxels = count; return geo;
}

function eraserMaterial(U, key) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 color2; varying vec3 vColor2; varying vec3 vLP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvColor2 = color2; vLP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uPink, uWave; varying vec3 vColor2; varying vec3 vLP;
      float eh(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      float en(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(eh(i), eh(i+vec3(1,0,0)), f.x), mix(eh(i+vec3(0,1,0)), eh(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(eh(i+vec3(0,0,1)), eh(i+vec3(1,0,1)), f.x), mix(eh(i+vec3(0,1,1)), eh(i+vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      { float n = en(vLP * 9.0);
        // top -> bottom coloured-pencil wavefront (uWave = 1) or a straight blend (uWave = 0)
        float front = uPink * 2.2 - 0.6 - (1.0 - vLP.y / ${H.toFixed(2)}) * 1.0 + (n - 0.5) * 0.25;
        float k = clamp(front, 0.0, 1.0);
        float h1 = fract((vLP.x + vLP.y) * 26.0 + n), h2 = fract((vLP.x * 0.7 - vLP.y + vLP.z) * 19.0 - n);
        float cov = mix(uPink, max(step(h1, k * 1.3), step(h2, k * 1.3 - 0.45)) * step(0.001, uPink), uWave);
        diffuseColor.rgb = diffuse * mix(vColor, vColor2, clamp(cov, 0.0, 1.0)); }`);
  };
  m.customProgramCacheKey = () => 'creatures_eraser_' + key;
  m.userData.noPaint = true; return m;
}

/** build (or fetch cached) geometries for a LOD */
const _geo = new Map();
function lodGeos(lod) {
  if (_geo.has(lod)) return _geo.get(lod);
  const n = LOD[lod] || LOD.mid; const t0 = performance.now(); const G = { n, faces: {}, stats: {} };
  G.body = gridMesh(n, [-W / 2 - 0.01, 0, -D / 2 - 0.01, W / 2 + 0.01, H + 0.01, D / 2 + 0.01], (x, y, z) => !inFacePocket(x, y, z) && bodyOcc(x, y, z), (x, y, z, a, sg) => skin(x, y, z, a, sg));
  // the sleeve: a paper band wrapped around the lower middle, with a torn top edge
  const sTop = (x, z) => 0.85 + 0.02 * vnoise(x * 30, 7, z * 30) + 0.012 * vnoise(x * 90, 3, z * 90);
  G.sleeve = gridMesh(n, [-W / 2 - 0.04, 0.28, -D / 2 - 0.04, W / 2 + 0.04, 0.9, D / 2 + 0.04], (x, y, z) => y > 0.3 && y < sTop(x, z) && rboxD(x, y, z, W / 2 + 0.018, H / 2, D / 2 + 0.018, H / 2, BEV + 0.02) <= 0 && rboxD(x, y, z, W / 2 - 0.004, H / 2, D / 2 - 0.004, H / 2, BEV) > 0,
    (x, y, z) => { const st = (y > 0.36 && y < 0.4) || (y > 0.75 && y < 0.79); const c = st ? C.stripe : (vnoise(x * 50, y * 50, z * 50) > 0.3 ? C.sleeve2 : C.sleeve); return [rgb(c), rgb(c)]; });
  G.arm = gridMesh(n, [-0.11, -0.14, -0.11, 0.11, 0.14, 0.11], (x, y, z) => Math.hypot(x / 0.095, y / 0.125, z / 0.09) <= 1, (x, y, z, a, sg) => skin(x + 0.5, y + 0.5, z, a, sg));
  // rubber crumbs scattered in front of the worn end
  const R = mulberry(99); const crumbs = Array.from({ length: 26 }, () => ({ c: [(R() - 0.5) * 1.3, 0, D / 2 + 0.05 + R() * 0.45], r: 0.012 + R() * 0.026 })); crumbs.forEach((q) => { q.c[1] = q.r * 0.7; });
  G.crumbs = gridMesh(n, [-0.8, 0, D / 2, 0.8, 0.08, D / 2 + 0.56], (x, y, z) => crumbs.some((q) => Math.hypot(x - q.c[0], y - q.c[1], z - q.c[2]) < q.r * (0.8 + 0.4 * vnoise(x * 90, y * 90, z * 90))), (x, y, z) => [rgb(C.graySpeck), rgb(C.pinkRub)]);
  // the small beige flat cap (Charlie's), tilted on the top
  const capC = [0, 0, 0], CR = 0.3, CH = 0.17; const cap = flatCapShape(capC, CR, CH, W / n); const capCol = flatCapCol(capC, CR, CH);
  G.cap = gridMesh(n, [-CR - 0.02, -0.01, -CR - 0.02, CR * 1.45, CH * 1.3, CR + 0.02], (x, y, z) => cap.d(x, y, z) <= 0, (x, y, z) => { const c = capCol(x, y, z); return [rgb(c), rgb(c)]; });
  G.ms = Math.round(performance.now() - t0);
  G.stats = { lod, widthVoxels: n, faceVoxelsWide: Math.round(2 * FACE.x * n), bodyVoxels: G.body.userData.voxels, bodyFaces: G.body.userData.faces, ms: G.ms };
  _geo.set(lod, G); return G;
}
function faceGeo(G, kind, blink) {
  const key = kind + (blink ? '_b' : ''); if (G.faces[key]) return G.faces[key];
  const n = G.n; const z0 = D / 2 - FACE.depth; const cache = new Map(); const v = W / n;
  const F = (x, y) => { const k = Math.round(x / v) + ',' + Math.round(y / v); let r = cache.get(k); if (!r) { r = faceAt(x, y, kind, blink ? 1 : 0); cache.set(k, r); } return r; };
  const t0 = performance.now();
  G.faces[key] = gridMesh(n, [-FACE.x, FACE.y0, z0, FACE.x, FACE.y1, D / 2 + 0.03],
    (x, y, z) => inFacePocket(x, y, z) && z <= D / 2 + F(x, y).h,
    (x, y, z, a, sg) => faceColour(F(x, y).c, x, y, z, a, sg));
  G.faces[key].userData.ms = Math.round(performance.now() - t0);
  return G.faces[key];
}

/** the sculpted Eraser. See the header for the API. */
export function makeEraser({ lod = 'mid', onMaterial, sleeve = true, crumbs = true } = {}) {
  const G = lodGeos(lod); const U = { uPink: { value: 0 }, uWave: { value: 0 } };
  const mat = eraserMaterial(U, 'body'); if (onMaterial) onMaterial(mat);
  const g = new THREE.Group(); g.name = 'eraser_' + lod; const inner = new THREE.Group(); g.add(inner);
  const M = (geo, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = m.receiveShadow = true; m.userData.noPaint = true; return m; };
  const body = M(G.body, 'body'); inner.add(body);
  const sl = M(G.sleeve, 'sleeve'); inner.add(sl); sl.visible = sleeve;
  const arms = [-1, 1].map((sx) => { const a = M(G.arm, 'arm'); a.position.set(sx * (W / 2 + 0.075), H * 0.3, 0.05); inner.add(a); return a; });
  const cr = M(G.crumbs, 'crumbs'); g.add(cr); cr.visible = crumbs;
  const cap = M(G.cap, 'cap'); cap.position.set(0.03, H - 0.006, -0.03); cap.rotation.set(0.0, -Math.PI / 2 + 0.3, -0.1); inner.add(cap);   // visor toward the face (+z), jaunty
  const face = M(faceGeo(G, 'grumpy', false), 'face'); inner.add(face);
  g.userData = { body, sleeve: sl, arms, face, cap, crumbs: cr, U, lod, stats: G.stats, material: mat };
  g.set = ({ pink = 0, face: f = 'grumpy', blink = 0, scrub = 0, lean = 0, squash = 0, wave = 0, cap: capOn = false, hatch = false, sleeve: slOn, crumbs: crOn } = {}) => {
    U.uPink.value = pink; U.uWave.value = hatch ? 1 : 0;
    face.geometry = faceGeo(G, f, blink > 0.5);
    cap.visible = !!capOn; if (slOn != null) sl.visible = slOn; if (crOn != null) cr.visible = crOn;
    inner.rotation.z = lean; inner.position.x = scrub; inner.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5);
    arms[0].position.y = H * (0.3 + 0.12 * wave); arms[1].position.y = H * (0.3 + 0.12 * Math.max(0, -wave) + 0.05 * wave);
    return g;
  };
  g.set({});
  return g;
}
export const ERASER_LODS = LOD;
