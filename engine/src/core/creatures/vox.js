// CREATURES core: tiny SDF kit + a per-part voxelizer that turns a creature spec into a rigged voxel model.
// Units: VOXELS (one voxel = opts.s world units). +x = forward (the face), +y = up, z = sideways. Feet / base at y = 0.
//
//   spec = { parts: [ { name, shape, col(x,y,z) -> '#rrggbb', mat: 'base'|'metal'|'glow'|'wing'|'flash', parent, pivot:[x,y,z], extra } ] }
//     - parts are claimed in ORDER (first part whose shape contains a cell owns it): put eyes / spots before the body they sit in.
//     - a part with shape: null is a pure joint (a pivot group with no voxels).
//     - extra: true = not part of the canonical voxel set (caterpillar overflow segments): built and meshed, but not counted
//       and not in the morph.
//   voxelizeSpec(spec) -> { cells: [{ x, y, z, c:[r,g,b], p: partIndex }], parts, box }   (x,y,z = integer cell coords)
//   buildRig(vox, spec, { s, materials }) -> { root, J (joint groups by name), meshes, rest }
import * as THREE from 'three';
import { meshVoxelGrid } from '../../voxel.js';

// ------------------------------------------------------------------------------------------------ SDF kit
const hyp = Math.hypot;
export const sphere = (c, r) => ({ d: (x, y, z) => hyp(x - c[0], y - c[1], z - c[2]) - r, box: [c[0] - r, c[1] - r, c[2] - r, c[0] + r, c[1] + r, c[2] + r] });
/** ellipsoid (iq's bound-ish distance) */
export const ell = (c, r) => ({
  d: (x, y, z) => { const px = (x - c[0]) / r[0], py = (y - c[1]) / r[1], pz = (z - c[2]) / r[2]; const k0 = hyp(px, py, pz);
    const k1 = hyp(px / r[0], py / r[1], pz / r[2]); return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(...r); },
  box: [c[0] - r[0], c[1] - r[1], c[2] - r[2], c[0] + r[0], c[1] + r[1], c[2] + r[2]],
});
export const capsule = (a, b, r) => {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2]; const L2 = bx * bx + by * by + bz * bz || 1;
  return { d: (x, y, z) => { const px = x - a[0], py = y - a[1], pz = z - a[2]; const h = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / L2));
    return hyp(px - bx * h, py - by * h, pz - bz * h) - r; },
  box: [Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.min(a[2], b[2]) - r, Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r, Math.max(a[2], b[2]) + r] };
};
/** a polyline of capsules (legs, antennae, horns) */
export const tube = (pts, r) => union(...pts.slice(1).map((p, i) => capsule(pts[i], p, Array.isArray(r) ? r[i] : r)));
/** rounded box: centre c, half extents h, corner radius rr */
export const rbox = (c, h, rr = 0) => ({
  d: (x, y, z) => { const qx = Math.abs(x - c[0]) - h[0] + rr, qy = Math.abs(y - c[1]) - h[1] + rr, qz = Math.abs(z - c[2]) - h[2] + rr;
    return hyp(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - rr; },
  box: [c[0] - h[0], c[1] - h[1], c[2] - h[2], c[0] + h[0], c[1] + h[1], c[2] + h[2]],
});
/** capped cylinder along axis 'x'|'y'|'z', radius r, half length h, edge rounding rr */
export const cyl = (c, r, h, axis = 'y', rr = 0) => {
  const A = { x: 0, y: 1, z: 2 }[axis]; const U = (A + 1) % 3, V = (A + 2) % 3;
  const box = [0, 0, 0, 0, 0, 0]; for (let k = 0; k < 3; k++) { const e = k === A ? h : r; box[k] = c[k] - e; box[k + 3] = c[k] + e; }
  return { d: (x, y, z) => { const p = [x - c[0], y - c[1], z - c[2]]; const dr = hyp(p[U], p[V]) - r + rr, da = Math.abs(p[A]) - h + rr;
    return Math.min(Math.max(dr, da), 0) + hyp(Math.max(dr, 0), Math.max(da, 0)) - rr; }, box };
};
/** torus around axis (ring radius R, tube radius r) */
export const torus = (c, R, r, axis = 'y') => {
  const A = { x: 0, y: 1, z: 2 }[axis]; const U = (A + 1) % 3, V = (A + 2) % 3; const box = []; for (let k = 0; k < 3; k++) { const e = k === A ? r : R + r; box[k] = c[k] - e; box[k + 3] = c[k] + e; }
  return { d: (x, y, z) => { const p = [x - c[0], y - c[1], z - c[2]]; return hyp(hyp(p[U], p[V]) - R, p[A]) - r; }, box };
};
export function union(...s) { s = s.filter(Boolean); return { d: (x, y, z) => { let m = 1e9; for (const q of s) { const v = q.d(x, y, z); if (v < m) m = v; } return m; }, box: unionBox(s.map((q) => q.box)) }; }
export const sunion = (k, ...s) => ({ d: (x, y, z) => { let m = s[0].d(x, y, z); for (let i = 1; i < s.length; i++) { const b = s[i].d(x, y, z); const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - m) / k)); m = b * (1 - h) + m * h - k * h * (1 - h); } return m; }, box: unionBox(s.map((q) => q.box)) });
export const inter = (a, b) => ({ d: (x, y, z) => Math.max(a.d(x, y, z), b.d(x, y, z)), box: interBox(a.box, b.box) });
export const sub = (a, b) => ({ d: (x, y, z) => Math.max(a.d(x, y, z), -b.d(x, y, z)), box: a.box });
/** keep the part of s on one side of an axis plane: half(s, 'y', 5, +1) keeps y >= 5 */
export const half = (s, axis, v, sg = 1) => { const A = { x: 0, y: 1, z: 2 }[axis]; const box = s.box.slice(); if (sg > 0) box[A] = Math.max(box[A], v); else box[A + 3] = Math.min(box[A + 3], v);
  return { d: (x, y, z) => Math.max(s.d(x, y, z), sg * (v - [x, y, z][A])), box }; };
/** hollow shell of thickness t (interior removed: invisible, and lets a count-matched feature be bigger) */
export const shell = (s, t) => ({ d: (x, y, z) => { const v = s.d(x, y, z); return Math.max(v, -(v + t)); }, box: s.box });
/** surface displacement (fluff / wear): d - amp * fn(x,y,z), fn in [-1,1] */
export const displace = (s, fn, amp) => ({ d: (x, y, z) => s.d(x, y, z) - amp * fn(x, y, z), box: s.box.map((v, i) => v + (i < 3 ? -amp : amp)) });
/** rigid transform: shape authored in local space, placed at pos with euler rot [rx, ry, rz] (XYZ order, radians) */
export function xform(s, pos, rot = [0, 0, 0]) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'XYZ')); const e = m.elements; // column-major
  // inverse rotation = transpose
  const d = (x, y, z) => { const px = x - pos[0], py = y - pos[1], pz = z - pos[2];
    return s.d(e[0] * px + e[1] * py + e[2] * pz, e[4] * px + e[5] * py + e[6] * pz, e[8] * px + e[9] * py + e[10] * pz); };
  const b = s.box; const box = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; const v = new THREE.Vector3();
  for (let i = 0; i < 8; i++) { v.set(i & 1 ? b[3] : b[0], i & 2 ? b[4] : b[1], i & 4 ? b[5] : b[2]).applyMatrix4(m);
    box[0] = Math.min(box[0], v.x + pos[0]); box[1] = Math.min(box[1], v.y + pos[1]); box[2] = Math.min(box[2], v.z + pos[2]);
    box[3] = Math.max(box[3], v.x + pos[0]); box[4] = Math.max(box[4], v.y + pos[1]); box[5] = Math.max(box[5], v.z + pos[2]); }
  return { d, box };
}
export const mirrorZ = (f) => union(f(1), f(-1));
function unionBox(bs) { const o = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (const b of bs) for (let k = 0; k < 3; k++) { o[k] = Math.min(o[k], b[k]); o[k + 3] = Math.max(o[k + 3], b[k + 3]); } return o; }
function interBox(a, b) { return [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2]), Math.min(a[3], b[3]), Math.min(a[4], b[4]), Math.min(a[5], b[5])]; }

// ------------------------------------------------------------------------------------------------ noise
export function hash3(x, y, z) { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
export function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); const fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz); const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), L(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
    L(L(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), L(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w) * 2 - 1;
}
export const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ------------------------------------------------------------------------------------------------ colour
const _hex = new Map();
export function rgb(hex) { let v = _hex.get(hex); if (!v) { const n = parseInt(hex.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; _hex.set(hex, v); } return v; }
export const INK = '#16141c', WHITE = '#fbf8f0';

/** THE shared cute eye: a sclera ball with a big pupil cap looking along `look` and a glint. Same on bug and feature. */
export const EYE_R = 4.2;
export function eyePart(name, c, look, { r = EYE_R, sclera = WHITE, pupil = INK, parent = 'head', pupilK = 0.5 } = {}) {
  const L = new THREE.Vector3(...look).normalize(); const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(L, up).normalize();
  const G = L.clone().multiplyScalar(0.82).addScaledVector(up, 0.5).addScaledVector(side, 0.28).normalize();
  return { name, shape: sphere(c, r), parent, pivot: c, eye: true, look: [L.x, L.y, L.z],
    col: (x, y, z) => { const dx = x - c[0], dy = y - c[1], dz = z - c[2]; const n = hyp(dx, dy, dz) || 1;
      const dl = (dx * L.x + dy * L.y + dz * L.z) / n; const dg = (dx * G.x + dy * G.y + dz * G.z) / n;
      if (dl > pupilK) return dg > 0.9 ? WHITE : pupil; return sclera; } };
}

// ------------------------------------------------------------------------------------------------ voxelizer
/** claim cells part by part (order = priority). Returns cells + per-part cell index lists. */
export function voxelizeSpec(spec) {
  const parts = spec.parts; const sh = parts.filter((p) => p.shape);
  const B = unionBox(sh.map((p) => p.shape.box)); const x0 = Math.floor(B[0]) - 1, y0 = Math.floor(B[1]) - 1, z0 = Math.floor(B[2]) - 1;
  const nx = Math.ceil(B[3]) - x0 + 2, ny = Math.ceil(B[4]) - y0 + 2, nz = Math.ceil(B[5]) - z0 + 2;
  const own = new Int16Array(nx * ny * nz).fill(-1);
  parts.forEach((p, pi) => { if (!p.shape) return; const b = p.shape.box;
    const i0 = Math.max(0, Math.floor(b[0]) - x0 - 1), i1 = Math.min(nx - 1, Math.ceil(b[3]) - x0 + 1);
    const j0 = Math.max(0, Math.floor(b[1]) - y0 - 1), j1 = Math.min(ny - 1, Math.ceil(b[4]) - y0 + 1);
    const k0 = Math.max(0, Math.floor(b[2]) - z0 - 1), k1 = Math.min(nz - 1, Math.ceil(b[5]) - z0 + 1);
    for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const n = i + nx * (j + ny * k); if (own[n] >= 0) continue;
      if (p.shape.d(x0 + i + 0.5, y0 + j + 0.5, z0 + k + 0.5) <= 0) own[n] = pi;
    } });
  const cells = [];
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const pi = own[i + nx * (j + ny * k)]; if (pi < 0) continue;
    const x = x0 + i, y = y0 + j, z = z0 + k; const p = parts[pi]; cells.push({ x, y, z, p: pi, c: rgb(p.col ? p.col(x + 0.5, y + 0.5, z + 0.5) : '#ff00ff') }); }
  return { cells, parts, grid: { x0, y0, z0, nx, ny, nz, own } };
}
export const coreCells = (vox) => vox.cells.filter((c) => !vox.parts[c.p].extra);

/** depth of each cell from the EXTERIOR air (6-neighbour BFS; exposed = 1). Cells that only face an enclosed cavity
 *  (hollow shells) are deeper than 1, so trimming them never opens a hole you can see from outside. */
export function cellDepth(cells) {
  let b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (const c of cells) { b[0] = Math.min(b[0], c.x); b[1] = Math.min(b[1], c.y); b[2] = Math.min(b[2], c.z); b[3] = Math.max(b[3], c.x); b[4] = Math.max(b[4], c.y); b[5] = Math.max(b[5], c.z); }
  const x0 = b[0] - 1, y0 = b[1] - 1, z0 = b[2] - 1, nx = b[3] - x0 + 2, ny = b[4] - y0 + 2, nz = b[5] - z0 + 2; const I = (x, y, z) => (x - x0) + nx * ((y - y0) + ny * (z - z0));
  const cell = new Int32Array(nx * ny * nz).fill(-1); cells.forEach((c, i) => { cell[I(c.x, c.y, c.z)] = i; });
  const air = new Uint8Array(nx * ny * nz); const st = [0]; air[0] = 1;                  // flood the exterior air from a corner
  while (st.length) { const n = st.pop(); const x = n % nx, y = Math.floor(n / nx) % ny, z = Math.floor(n / (nx * ny));
    for (const [dx, dy, dz] of N6) { const X = x + dx, Y = y + dy, Z = z + dz; if (X < 0 || Y < 0 || Z < 0 || X >= nx || Y >= ny || Z >= nz) continue;
      const m = X + nx * (Y + ny * Z); if (air[m] || cell[m] >= 0) continue; air[m] = 1; st.push(m); } }
  const D = new Int32Array(cells.length).fill(0); let q = [];
  cells.forEach((c, i) => { for (const [dx, dy, dz] of N6) if (air[I(c.x + dx, c.y + dy, c.z + dz)]) { D[i] = 1; q.push(i); break; } });
  while (q.length) { const nq = []; for (const i of q) { const c = cells[i]; for (const [dx, dy, dz] of N6) { const j = cell[I(c.x + dx, c.y + dy, c.z + dz)]; if (j >= 0 && !D[j]) { D[j] = D[i] + 1; nq.push(j); } } } q = nq; }
  for (let i = 0; i < D.length; i++) if (!D[i]) D[i] = 1e6;
  return D;
}
const N6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

/** make a cell list exactly N long: trim the deepest interior cells first (invisible), or pad under the base (hidden). */
export function fitCount(vox, N) {
  const core = coreCells(vox); let cells = core;
  if (core.length > N) {
    const D = cellDepth(core); const order = core.map((_, i) => i).sort((a, b) => (D[b] - D[a]) || (hash3(core[b].x, core[b].y, core[b].z) - hash3(core[a].x, core[a].y, core[a].z)));
    const drop = new Set(order.slice(0, core.length - N)); cells = core.filter((_, i) => !drop.has(i));
    vox.trimmed = core.length - N; vox.trimMinDepth = Math.min(...order.slice(0, core.length - N).map((i) => D[i]));
  } else if (core.length < N) {
    // pad: stack spare voxels inside the deepest cell's column (duplicates are hidden inside the body)
    const D = cellDepth(core); let best = 0; for (let i = 1; i < core.length; i++) if (D[i] > D[best]) best = i;
    cells = core.slice(); for (let i = core.length; i < N; i++) cells.push({ ...core[best], pad: true });
    vox.padded = N - core.length;
  }
  const kept = new Set(cells); const removed = new Set(core.filter((c) => !kept.has(c)));
  vox.cells = vox.cells.filter((c) => !removed.has(c));
  vox.core = cells; return vox;
}

// ------------------------------------------------------------------------------------------------ rig + meshes
export function makeMaterials(opts = {}) {
  const M = {
    base: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0 }),
    fluff: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 }),
    metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.16, metalness: 0.45, envMapIntensity: 1.6 }),
    glow: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: new THREE.Color('#ffd84a'), emissiveIntensity: 1.6 }),
    flash: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 }),
    wing: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide }),
  };
  // glossy beetle metal: a fresnel rim (bright edge) on top of the specular
  const RIM = { uRim: { value: 0.55 } };
  M.metal.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, RIM);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uRim;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float fr = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
          totalEmissiveRadiance += (vColor.rgb * 0.7 + vec3(0.25, 0.45, 0.42)) * fr * uRim; }`); };
  M.metal.customProgramCacheKey = () => 'creatures_metal_rim';
  M.metal.userData.rim = RIM.uRim;
  for (const m of Object.values(M)) { m.userData.noPaint = true; if (opts.onMaterial) opts.onMaterial(m); }
  return M;
}

/** Build the joint hierarchy and one face-culled AO mesh per part. s = voxel size in world units. */
export function buildRig(vox, { s = 0.45, materials, ao = 0.34 }) {
  const parts = vox.parts; const root = new THREE.Group(); const J = {}; const rest = {}; const meshes = [];
  const byPart = parts.map(() => []); for (const c of vox.cells) byPart[c.p].push(c);
  const pv = (p) => p.pivot || [0, 0, 0];
  parts.forEach((p) => { const g = new THREE.Group(); g.name = p.name; J[p.name] = g; });
  parts.forEach((p, pi) => {
    const g = J[p.name]; const par = p.parent && J[p.parent] ? parts.find((q) => q.name === p.parent) : null;
    (par ? J[par.name] : root).add(g);
    const a = pv(p), b = par ? pv(par) : [0, 0, 0]; g.position.set((a[0] - b[0]) * s, (a[1] - b[1]) * s, (a[2] - b[2]) * s);
    rest[p.name] = { p: g.position.clone(), q: g.quaternion.clone(), s: g.scale.clone() };
    const cs = byPart[pi]; if (!cs.length) return;
    let bx0 = 1e9, by0 = 1e9, bz0 = 1e9, bx1 = -1e9, by1 = -1e9, bz1 = -1e9;
    for (const c of cs) { bx0 = Math.min(bx0, c.x); by0 = Math.min(by0, c.y); bz0 = Math.min(bz0, c.z); bx1 = Math.max(bx1, c.x); by1 = Math.max(by1, c.y); bz1 = Math.max(bz1, c.z); }
    const nx = bx1 - bx0 + 1, ny = by1 - by0 + 1, nz = bz1 - bz0 + 1; const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3);
    for (const c of cs) { const n = (c.x - bx0) + nx * ((c.y - by0) + ny * (c.z - bz0)); occ[n] = 1; col[n * 3] = c.c[0]; col[n * 3 + 1] = c.c[1]; col[n * 3 + 2] = c.c[2]; }
    // part.faceK = { py: 1.25, ... }: per-face brightness (e.g. lighter top facets on the glossy beetle shell)
    let faceCol;
    if (p.faceK) { faceCol = {}; for (const [k, f] of Object.entries(p.faceK)) { const a = new Uint8Array(nx * ny * nz * 3);
      for (let n = 0; n < nx * ny * nz; n++) if (occ[n]) for (let q = 0; q < 3; q++) a[n * 3 + q] = Math.max(1, Math.min(255, Math.round(col[n * 3 + q] * f))); faceCol[k] = a; } }
    const geo = meshVoxelGrid({ nx, ny, nz, occ, col, faceCol }, { s, origin: [(bx0 - a[0]) * s, (by0 - a[1]) * s, (bz0 - a[2]) * s], ao: p.ao ?? ao });
    const m = new THREE.Mesh(geo, materials[p.mat || 'base']); m.castShadow = true; m.receiveShadow = true; m.userData.noPaint = true; m.name = p.name + '_mesh';
    g.add(m); meshes.push(m);
  });
  return { root, J, rest, meshes };
}
export function resetRig(rig) { for (const [n, r] of Object.entries(rig.rest)) { const g = rig.J[n]; g.position.copy(r.p); g.quaternion.copy(r.q); g.scale.copy(r.s); g.visible = true; } }

// ------------------------------------------------------------------------------------------------ helpers for anims
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const sstep = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
/** deterministic blink: returns 0..1 (1 = closed) */
export function blinkAt(t, period = 3.3, phase = 0, dur = 0.13) { const u = ((t + phase) % period + period) % period; return u < dur ? Math.sin(Math.PI * u / dur) : 0; }
