// 3D-native hero models (MODELS team): signed-distance part models -> voxel lattice -> per-part face-culled meshes.
//
// Models are written in DESIGN units (a ~96-unit-tall figure; feet centre at the origin, y up, the hero faces +x, +z = the
// hero's right side) and voxelized on a global lattice of `res` voxels per design unit (voxel centres at (n + 0.5) / res), so
// the same model can be sampled denser without touching its geometry. The caller scales design units to world units (s).
//
// A model is a list of primitives { f(x, y, z) -> signed distance (<= 0 inside), bb: [x0, y0, z0, x1, y1, z1], part,
//   mat: 'name' | (x, y, z) -> 'name', prio (the highest-priority primitive containing a voxel paints it) }
// plus cuts ({ f, bb, mats?, parts? } remove voxels) and decals applied after the fill:
//   { kind: 'vol', mats?, fn(x, y, z, mat) -> newMat | null }                    recolour voxels in place
//   { kind: 'proj', axis: '+x'|'-x'|'+z'|'-z'|'+y', mats?, depth = 1, fn(a, b, ia, ib) -> newMat | null }
//        paints the first voxel(s) of each column seen from `axis`; (a, b) = voxel-centre design coords across the column
//        (+-x: (y, z), +-z: (y, x), +y: (x, z)); (ia, ib) = the matching GLOBAL integer lattice indices (pixel-exact text)
//   { kind: 'add', axis, at: [[a0, a1, b0, b1, mat], ...], n = 1 } n extra voxels in front of the first hit for columns inside a rect
// Every decal can be restricted with `parts: [...]`. Parts are voxelized independently from their own primitives (a rigid-part
// rig: parts may overlap at rest, so a rotating limb never opens a hole in its neighbour).
import { meshVoxelGrid } from '../../voxel.js';

// ------------------------------------------------------------------------------------------------ SDF primitives
const len3 = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
export function ellipsoid(c, r) {
  const [cx, cy, cz] = c, [rx, ry, rz] = r;
  return { f: (x, y, z) => { const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz; const k0 = len3(px, py, pz); const k1 = len3(px / rx, py / ry, pz / rz); return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz); },
    bb: [cx - rx, cy - ry, cz - rz, cx + rx, cy + ry, cz + rz] };
}
export const sphere = (c, r) => ellipsoid(c, [r, r, r]);
/** superellipsoid (n = 2: ellipsoid; larger n: boxier); approximate distance */
export function superEllipsoid(c, r, n = 3) {
  const [cx, cy, cz] = c, [rx, ry, rz] = r, m = Math.min(rx, ry, rz);
  return { f: (x, y, z) => (Math.pow(Math.pow(Math.abs((x - cx) / rx), n) + Math.pow(Math.abs((y - cy) / ry), n) + Math.pow(Math.abs((z - cz) / rz), n), 1 / n) - 1) * m,
    bb: [cx - rx, cy - ry, cz - rz, cx + rx, cy + ry, cz + rz] };
}
/** rounded box: centre c, half extents h, corner radius rad (<= min h) */
export function roundBox(c, h, rad = 0) {
  const [cx, cy, cz] = c, [hx, hy, hz] = h;
  return { f: (x, y, z) => { const qx = Math.abs(x - cx) - hx + rad, qy = Math.abs(y - cy) - hy + rad, qz = Math.abs(z - cz) - hz + rad;
    return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - rad; },
  bb: [cx - hx, cy - hy, cz - hz, cx + hx, cy + hy, cz + hz] };
}
/** tapered capsule from a (radius ra) to b (radius rb) */
export function cone(a, b, ra, rb = ra) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2]; const L2 = bx * bx + by * by + bz * bz || 1e-9; const R = Math.max(ra, rb);
  return { f: (x, y, z) => { const px = x - a[0], py = y - a[1], pz = z - a[2]; const t = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / L2));
    return len3(px - bx * t, py - by * t, pz - bz * t) - (ra + (rb - ra) * t); },
  bb: [Math.min(a[0], b[0]) - R, Math.min(a[1], b[1]) - R, Math.min(a[2], b[2]) - R, Math.max(a[0], b[0]) + R, Math.max(a[1], b[1]) + R, Math.max(a[2], b[2]) + R] };
}
/** r6: rounded cylinder (a disc when h is small): centre c, unit-ish axis a, radius r, half height h, edge radius rad */
export function cylinder(c, a, r, h, rad = 0.4) {
  const L = Math.hypot(a[0], a[1], a[2]) || 1, ax = a[0] / L, ay = a[1] / L, az = a[2] / L, R = Math.max(r, h);
  return { f: (x, y, z) => { const px = x - c[0], py = y - c[1], pz = z - c[2]; const t = px * ax + py * ay + pz * az;
    const qx = Math.hypot(px - ax * t, py - ay * t, pz - az * t) - r + rad, qy = Math.abs(t) - h + rad;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad; },
  bb: [c[0] - R, c[1] - R, c[2] - R, c[0] + R, c[1] + R, c[2] + R] };
}
/** r6: vertical ring (annulus) around column (x, z) between heights y0..y1, radii rIn..rOut */
export function ring(x, z, y0, y1, rIn, rOut) {
  return { f: (px, py, pz) => { const d = Math.hypot(px - x, pz - z); return Math.max(rIn - d, d - rOut, y0 - py, py - y1); }, bb: [x - rOut, y0, z - rOut, x + rOut, y1, z + rOut] };
}
/**
 * vertical prism with a superellipse cross-section (exponent n: 2 = ellipse, larger = squarer) around column (x, z), from y0 to
 * y1, tapering linearly from half-widths (rx0, rz0) at y0 to (rx1, rz1) at y1, with ends rounded by rad. Limbs / torsos that read
 * as voxel cylinders (k08b) instead of boards.
 */
export function sprism(x, z, y0, y1, rx0, rz0, rx1 = rx0, rz1 = rz0, n = 2.4, rad = 1.5) {
  const H = y1 - y0, R = Math.max(rx0, rz0, rx1, rz1);
  return { f: (px, py, pz) => {
    const t = Math.max(0, Math.min(1, (py - y0) / H)); const rx = rx0 + (rx1 - rx0) * t, rz = rz0 + (rz1 - rz0) * t;
    const q = Math.pow(Math.pow(Math.abs((px - x) / rx), n) + Math.pow(Math.abs((pz - z) / rz), n), 1 / n);
    const dxz = (q - 1) * Math.min(rx, rz) + rad, dy = Math.max(y0 - py, py - y1) + rad;
    return Math.hypot(Math.max(dxz, 0), Math.max(dy, 0)) + Math.min(Math.max(dxz, dy), 0) - rad; },
  bb: [x - R, y0, z - R, x + R, y1, z + R] };
}
/** clip a primitive to where keep(x, y, z) is true */
export const clip = (Pr, keep) => ({ ...Pr, f: (x, y, z) => keep(x, y, z) ? Pr.f(x, y, z) : 1 });
/** displace a primitive's surface: d + g(x, y, z) (g > 0 carves in, g < 0 bulges out) */
export const disp = (Pr, g, grow = 1.5) => ({ ...Pr, f: (x, y, z) => Pr.f(x, y, z) + g(x, y, z), bb: Pr.bb.map((v, i) => v + (i < 3 ? -grow : grow)) });
/** union of primitives (min distance) */
export const union = (...Ps) => ({ f: (x, y, z) => { let d = 1e9; for (const Q of Ps) d = Math.min(d, Q.f(x, y, z)); return d; },
  bb: [0, 1, 2].map((i) => Math.min(...Ps.map((Q) => Q.bb[i]))).concat([3, 4, 5].map((i) => Math.max(...Ps.map((Q) => Q.bb[i])))) });
/** tag a primitive: P(shape, part, mat, { prio }) */
export const P = (shape, part, mat, { prio = 1 } = {}) => ({ ...shape, part, mat, prio });

// small deterministic hash -> [0, 1)
export const hash = (a, b = 0, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };

// 3x5 pixel font for decal lettering (glyphs carry their own widths: E is 2 wide so EARTH fits across a jacket back). RES 1.25 only.
export const FONT = { R: ['110', '101', '110', '101', '101'], A: ['010', '101', '111', '101', '101'], E: ['11', '10', '11', '10', '11'], T: ['111', '010', '010', '010', '010'], H: ['101', '101', '111', '101', '101'] };
/**
 * 4x6 bold sans (density spike, RES >= 2.3): wide, square-ish capitals like the costume's Archivo lettering (R / A / H 4 wide,
 * E 3, T 5 so its stem is centred), 1-voxel strokes, bars just above the middle. ' ' = a 1-voxel word space (3 with the gaps).
 */
export const FONT46 = {
  R: ['1110', '1001', '1001', '1110', '1010', '1001'],
  A: ['0110', '1001', '1001', '1111', '1001', '1001'],
  E: ['111', '100', '111', '100', '100', '111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100'],
  H: ['1001', '1001', '1111', '1001', '1001', '1001'],
  ' ': ['0', '0', '0', '0', '0', '0'],
};
/**
 * r6e: 3x6 bold sans (RES >= 2.3 jacket back): the FONT46 shapes narrowed to 3 columns, so one line of RARE EARTH (37 voxels at
 * 2.5 = 14.8 units, about the dot's width) stays on the flat back panel and never wraps onto the jacket's sides.
 */
export const FONT36 = {
  R: ['110', '101', '101', '110', '101', '101'],
  A: ['010', '101', '101', '111', '101', '101'],
  E: ['111', '100', '111', '100', '100', '111'],
  T: ['111', '010', '010', '010', '010', '010'],
  H: ['101', '101', '111', '101', '101', '101'],
  ' ': ['0', '0', '0', '0', '0', '0'],
};
/** pixel-exact text: at(u, v) with u = column from the left, v = row from the BOTTOM; W x H in voxels */
export function textTest(str, gap = 1, font = FONT) {
  const H = font[str[0]].length; const xs = []; let W = 0; for (const ch of str) { xs.push(W); W += font[ch][0].length + gap; } W -= gap;
  return { W, H, at(u, v) { if (u < 0 || v < 0 || u >= W || v >= H) return false;
    for (let i = str.length - 1; i >= 0; i--) if (u >= xs[i]) { const g = font[str[i]], cu = u - xs[i]; return cu < g[0].length && g[H - 1 - v][cu] === '1'; } return false; } };
}

// ------------------------------------------------------------------------------------------------ voxelizer
/**
 * Voxelize one part model M = { prims, cuts, decals, palette } on the global lattice of `res` voxels per design unit.
 * Returns G = { X0, Y0, Z0 (design coords of the grid's min corner, multiples of 1/res), I0, J0, K0 (global lattice
 * indices of that corner), h, nx, ny, nz, occ, mat (index into matNames), matNames }.
 */
export function voxelize(M, res = 1) {
  const prims = M.prims; const h = 1 / res; let b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  for (const p of prims) for (let i = 0; i < 3; i++) { b[i] = Math.min(b[i], p.bb[i]); b[i + 3] = Math.max(b[i + 3], p.bb[i + 3]); }
  const I0 = Math.floor(b[0] * res) - 3, J0 = Math.floor(b[1] * res) - 3, K0 = Math.floor(b[2] * res) - 3;
  const nx = Math.ceil(b[3] * res) + 3 - I0, ny = Math.ceil(b[4] * res) + 3 - J0, nz = Math.ceil(b[5] * res) + 3 - K0, N = nx * ny * nz;
  const X0 = I0 * h, Y0 = J0 * h, Z0 = K0 * h;
  const occ = new Uint8Array(N), mat = new Uint8Array(N), pr = new Int8Array(N).fill(-128);
  const matNames = Object.keys(M.palette); const mi = new Map(matNames.map((n, i) => [n, i]));
  const matIdx = (n) => { const i = mi.get(n); if (i === undefined) throw new Error('heromodels: unknown material ' + n); return i; };
  const range = (bb) => [Math.max(0, Math.floor((bb[0] - X0) * res - 1)), Math.max(0, Math.floor((bb[1] - Y0) * res - 1)), Math.max(0, Math.floor((bb[2] - Z0) * res - 1)),
    Math.min(nx - 1, Math.ceil((bb[3] - X0) * res)), Math.min(ny - 1, Math.ceil((bb[4] - Y0) * res)), Math.min(nz - 1, Math.ceil((bb[5] - Z0) * res))];
  for (const p of prims) {
    const [i0, j0, k0, i1, j1, k1] = range(p.bb); const fixedMat = typeof p.mat === 'string' ? matIdx(p.mat) : -1;
    for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = X0 + (i + 0.5) * h, y = Y0 + (j + 0.5) * h, z = Z0 + (k + 0.5) * h; if (p.f(x, y, z) > 0) continue;
      const n = i + nx * (j + ny * k); occ[n] = 1;
      if (p.prio >= pr[n]) { pr[n] = p.prio; mat[n] = fixedMat >= 0 ? fixedMat : matIdx(p.mat(x, y, z)); }
    }
  }
  for (const c of M.cuts || []) {
    const [i0, j0, k0, i1, j1, k1] = range(c.bb); const ms = c.mats ? new Set(c.mats.map(matIdx)) : null;
    for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const n = i + nx * (j + ny * k); if (!occ[n] || (ms && !ms.has(mat[n]))) continue;
      if (c.f(X0 + (i + 0.5) * h, Y0 + (j + 0.5) * h, Z0 + (k + 0.5) * h) <= 0) occ[n] = 0; }
  }
  const G = { X0, Y0, Z0, I0, J0, K0, h, res, nx, ny, nz, occ, mat, matNames };
  for (const d of M.decals || []) applyDecal(G, d, matIdx);
  return G;
}

function applyDecal(G, d, matIdx) {
  const { X0, Y0, Z0, I0, J0, K0, h, nx, ny, nz, occ, mat, matNames } = G;
  const mOK = d.mats ? new Set(d.mats.map(matIdx)) : null;
  if (d.kind === 'vol') {
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const n = i + nx * (j + ny * k); if (!occ[n] || (mOK && !mOK.has(mat[n]))) continue;
      const r = d.fn(X0 + (i + 0.5) * h, Y0 + (j + 0.5) * h, Z0 + (k + 0.5) * h, matNames[mat[n]], i + I0, j + J0, k + K0); if (r) mat[n] = matIdx(r); }
    return;
  }
  const ax = d.axis[1], sg = d.axis[0] === '+' ? 1 : -1;
  const dims = { x: [nx, ny, nz], z: [nz, ny, nx], y: [ny, nx, nz] }[ax];
  const cell = (t, a, b) => ax === 'x' ? [t, a, b] : ax === 'z' ? [b, a, t] : [a, t, b];
  const coord = (i, j, k) => ax === 'x' ? [Y0 + (j + 0.5) * h, Z0 + (k + 0.5) * h, j + J0, k + K0] : ax === 'z' ? [Y0 + (j + 0.5) * h, X0 + (i + 0.5) * h, j + J0, i + I0] : [X0 + (i + 0.5) * h, Z0 + (k + 0.5) * h, i + I0, k + K0];
  for (let a = 0; a < dims[1]; a++) for (let b = 0; b < dims[2]; b++) {
    let hit = 0;
    for (let s = 0; s < dims[0]; s++) {
      const t = sg > 0 ? dims[0] - 1 - s : s; const [i, j, k] = cell(t, a, b); const n = i + nx * (j + ny * k);
      if (!occ[n]) { if (hit) break; continue; }
      const [ca, cb, ia, ib] = coord(i, j, k);
      if (d.kind === 'add') {
        const r = d.at.find(([a0, a1, b0, b1]) => ca >= a0 && ca < a1 && cb >= b0 && cb < b1);
        if (r) for (let q = 1; q <= (d.n || 1); q++) { const t2 = t + sg * q; if (t2 >= 0 && t2 < dims[0]) { const [i2, j2, k2] = cell(t2, a, b); const n2 = i2 + nx * (j2 + ny * k2); if (!occ[n2]) { occ[n2] = 1; mat[n2] = matIdx(r[4]); } } }   // d.n voxels thick (default 1)
        break;
      }
      if (!mOK || mOK.has(mat[n])) { const r = d.fn(ca, cb, ia, ib, Y0 + (j + 0.5) * h); if (r) mat[n] = matIdx(r); }
      if (++hit >= (d.depth || 1)) break;
    }
  }
}

const rgb = (hx) => [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)];
/**
 * Mesh a voxelized part. pivot [x, y, z] design units; s = world units per design unit; look = { ao, jitter, edge, inset }.
 * Returns { geo, pivot: [x, y, z] world, count }.
 */
export function meshGrid(G, palette, pivot, s, look = {}) {
  const { X0, Y0, Z0, I0, J0, K0, h, nx, ny, nz, occ, mat, matNames } = G;
  const pal = matNames.map((n) => rgb(palette[n]));
  let i0 = nx, j0 = ny, k0 = nz, i1 = -1, j1 = -1, k1 = -1, cnt = 0;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { if (!occ[i + nx * (j + ny * k)]) continue;
    cnt++; if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; if (k < k0) k0 = k; if (k > k1) k1 = k; }
  if (!cnt) return null;
  const sx = i1 - i0 + 1, sy = j1 - j0 + 1, sz = k1 - k0 + 1; const o2 = new Uint8Array(sx * sy * sz), col = new Uint8Array(sx * sy * sz * 3);
  for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const n = i + nx * (j + ny * k); if (!occ[n]) continue;
    const q = (i - i0) + sx * ((j - j0) + sy * (k - k0)); o2[q] = 1; const c = pal[mat[n]]; col[q * 3] = c[0]; col[q * 3 + 1] = c[1]; col[q * 3 + 2] = c[2]; }
  const pv = pivot || [0, 0, 0];
  const geo = meshVoxelGrid({ nx: sx, ny: sy, nz: sz, occ: o2, col }, { s: s * h, origin: [(X0 + i0 * h - pv[0]) * s, (Y0 + j0 * h - pv[1]) * s, (Z0 + k0 * h - pv[2]) * s],
    ao: look.ao ?? 0.3, jitter: look.jitter || 0, edge: look.edge || 0, inset: look.inset ?? 0.14, hashOrigin: [I0 + i0, J0 + j0, K0 + k0], edgeAttr: !!look.edgeAttr });
  return { geo, pivot: pv.map((v) => v * s), count: cnt, G, crop: [i0, j0, k0, sx, sy, sz], vs: s * h, org: [(X0 + i0 * h - pv[0]) * s, (Y0 + j0 * h - pv[1]) * s, (Z0 + k0 * h - pv[2]) * s], look };
}

// ------------------------------------------------------------------------------------------------ r6 rig helpers
/**
 * r6: the voxel behind every face block of a part mesh (edge mode: each voxel face = 8 consecutive vertices). Returns
 * { n (blocks), li: Int32Array(3n) crop-local lattice index, ax: Int8Array(n) face axis 0..2, sg: Int8Array(n) +-1 }.
 */
export function faceBlocks(m) {
  const pos = m.geo.attributes.position.array, nrm = m.geo.attributes.normal.array, nv = pos.length / 3; if (nv % 8) throw new Error('faceBlocks: not an edge-mode mesh');
  const n = nv / 8, li = new Int32Array(3 * n), ax = new Int8Array(n), sg = new Int8Array(n), u = [0, 0, 0];
  for (let b = 0; b < n; b++) {
    let a = 0; for (let q = 0; q < 3; q++) if (nrm[b * 24 + q] !== 0) a = q; const s = nrm[b * 24 + a] > 0 ? 1 : -1;
    for (let q = 0; q < 3; q++) { let c = 0; for (let v = 0; v < 8; v++) c += pos[(b * 8 + v) * 3 + q]; u[q] = (c / 8 - m.org[q]) / m.vs; }
    for (let q = 0; q < 3; q++) li[b * 3 + q] = q === a ? (s > 0 ? Math.round(u[q]) - 1 : Math.round(u[q])) : Math.floor(u[q]);
    ax[b] = a; sg[b] = s;
  }
  return { n, li, ax, sg };
}
/** design coords + material of a crop-local voxel of mesh m */
export function voxelAt(m, i, j, k) {
  const { G, crop } = m; const gi = i + crop[0], gj = j + crop[1], gk = k + crop[2]; const n = gi + G.nx * (gj + G.ny * gk);
  return { x: G.X0 + (gi + 0.5) * G.h, y: G.Y0 + (gj + 0.5) * G.h, z: G.Z0 + (gk + 0.5) * G.h, mat: G.matNames[G.mat[n]], n, occ: G.occ[n] };
}
/**
 * r6: partition a part mesh by voxel class. cls(x, y, z, mat) -> class index 0..K-1. Returns { index: [Uint32Array per class]
 * (triangles of the SAME vertex buffers), cls: Uint8Array per grid voxel (255 = empty) }.
 */
export function splitMesh(m, K, cls, band = 0) {
  const { G } = m; const FB = faceBlocks(m); const vc = new Uint8Array(G.nx * G.ny * G.nz).fill(255);
  for (let n = 0; n < vc.length; n++) if (G.occ[n]) { const i = n % G.nx, j = Math.floor(n / G.nx) % G.ny, k = Math.floor(n / (G.nx * G.ny));
    vc[n] = cls(G.X0 + (i + 0.5) * G.h, G.Y0 + (j + 0.5) * G.h, G.Z0 + (k + 0.5) * G.h, G.matNames[G.mat[n]]); }
  const bc = new Uint8Array(FB.n); const { crop } = m;
  for (let b = 0; b < FB.n; b++) { const gi = FB.li[b * 3] + crop[0], gj = FB.li[b * 3 + 1] + crop[1], gk = FB.li[b * 3 + 2] + crop[2]; const c = vc[gi + G.nx * (gj + G.ny * gk)]; bc[b] = c === 255 ? 0 : c; }
  // band > 0 (spring pieces): faces within `band` voxels of another class are ALSO drawn by that class (same vertices: identical at
  // rest), so a rotated piece overlaps its neighbour instead of opening a crack in thin parts (hair clumps, straps)
  let extra = null;
  if (band > 0) { extra = new Uint8Array(FB.n).fill(255); const { nx, ny, nz } = G; const at = (i, j, k) => i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz ? vc[i + nx * (j + ny * k)] : 255;
    for (let b = 0; b < FB.n; b++) { const gi = FB.li[b * 3] + crop[0], gj = FB.li[b * 3 + 1] + crop[1], gk = FB.li[b * 3 + 2] + crop[2], c = bc[b];
      search: for (let d = 1; d <= band; d++) for (const [di, dj, dk] of [[d, 0, 0], [-d, 0, 0], [0, d, 0], [0, -d, 0], [0, 0, d], [0, 0, -d]]) { const o = at(gi + di, gj + dj, gk + dk); if (o !== 255 && o !== c) { extra[b] = o; break search; } } } }
  const idx = m.geo.index.array, out = Array.from({ length: K }, () => []);
  for (let t = 0; t < idx.length; t += 3) { const b = Math.floor(idx[t] / 8); out[bc[b]].push(idx[t], idx[t + 1], idx[t + 2]); if (extra && extra[b] !== 255) out[extra[b]].push(idx[t], idx[t + 1], idx[t + 2]); }
  return { index: out.map((a) => new Uint32Array(a)), cls: vc, blocks: FB, blockCls: bc };
}
/**
 * r6: hidden "plug" mesh for class c: interior voxels (all 6 neighbours filled) of class c within `reach` voxels of another class.
 * Same frame as the part mesh (pivot-relative); invisible at rest (behind the surface), it fills the crack when the joint bends.
 */
export function plugMesh(m, vc, c, reach = 3) {
  const { G } = m; const { nx, ny, nz } = G; const at = (i, j, k) => i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz ? vc[i + nx * (j + ny * k)] : 255;
  const pal = G.matNames.map((nm) => rgb(m.palette[nm]));
  const [i0, j0, k0, sx, sy, sz] = m.crop; const occ = new Uint8Array(sx * sy * sz), col = new Uint8Array(sx * sy * sz * 3); let any = 0;
  for (let k = 0; k < sz; k++) for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) {
    const gi = i + i0, gj = j + j0, gk = k + k0; if (at(gi, gj, gk) !== c) continue;
    if (at(gi + 1, gj, gk) === 255 || at(gi - 1, gj, gk) === 255 || at(gi, gj + 1, gk) === 255 || at(gi, gj - 1, gk) === 255 || at(gi, gj, gk + 1) === 255 || at(gi, gj, gk - 1) === 255) continue;   // surface voxel: already meshed
    let near = false; for (let d = -reach; d <= reach && !near; d++) for (const [di, dj, dk] of [[d, 0, 0], [0, d, 0], [0, 0, d]]) { const o = at(gi + di, gj + dj, gk + dk); if (o !== 255 && o !== c) { near = true; break; } }
    if (!near) continue;
    const q = i + sx * (j + sy * k); occ[q] = 1; any++; const cc = pal[G.mat[gi + nx * (gj + ny * gk)]]; col[q * 3] = cc[0]; col[q * 3 + 1] = cc[1]; col[q * 3 + 2] = cc[2];
  }
  if (!any) return null;
  const geo = meshVoxelGrid({ nx: sx, ny: sy, nz: sz, occ, col }, { s: m.vs, origin: m.org, ao: 0.3, edge: 0.2, inset: m.look?.inset ?? 0.14, edgeAttr: !!m.look?.edgeAttr, hashOrigin: [G.I0 + i0, G.J0 + j0, G.K0 + k0], jitter: m.look?.jitter || 0 });
  return geo;
}

/** voxelize + mesh every rig part from its own primitives. Returns { parts, voxels, top (design units) } */
export function voxelizeParts(M, partNames, pivots, s, res = 1, look = {}) {
  const parts = {}; let voxels = 0, top = 0;
  for (const pn of partNames) {
    const prims = M.prims.filter((p) => p.part === pn); if (!prims.length) continue;
    const sub = { prims, palette: M.palette, cuts: (M.cuts || []).filter((c) => !c.parts || c.parts.includes(pn)), decals: (M.decals || []).filter((d) => !d.parts || d.parts.includes(pn)) };
    const G = voxelize(sub, res);
    for (let n = 0; n < G.occ.length; n++) if (G.occ[n]) { voxels++; const j = Math.floor(n / G.nx) % G.ny; top = Math.max(top, G.Y0 + (j + 1) * G.h); }
    const m = meshGrid(G, M.palette, pivots[pn], s, look); if (m) { m.palette = M.palette; parts[pn] = m; }
  }
  return { parts, voxels, top };
}

/** voxelize + mesh a single item (pencil, guitar, cap): returns a BufferGeometry, origin = item origin */
export function meshItem(M, s, res = 1, look = {}) {
  const G = voxelize(M, res); return meshGrid(G, M.palette, [0, 0, 0], s, { ao: 0.28, ...look }).geo;
}
