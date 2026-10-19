// World builders for the TALOS look ("fixtures only": an unpainted plaster/clay
// maquette lit by a real golden-hour sky; full colour lives underneath and is
// revealed by the paint wavefront, see util.js patchFlat).
//   - fine-voxel play strip = "the slice", continuing as a causeway to the horizon
//   - smooth meadow + relief hills, voxel basalt cliff, boulders
//   - colonnade, temple pediment, steps, monumental gate, clumped cypresses
//   - pixel-art parallax flats for the 2D camera only
// All randomness is seeded -> identical world every run.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, fbm, vnoise } from './util.js';
import { triplanarMaterial, stoneTexture, rockTexture, grassTexture } from './materials.js';
import { meshVoxelGrid } from './voxel.js';

const C = (h) => new THREE.Color(h);
const PLASTER = { stone: 0xf4efe6, clay: 0xcfc0a4, meadow: 0xd9c9aa, rock: 0xcbbb9f, ink: 0x202020 };
const withPlaster = (m, tint) => { m.userData.plaster = tint; return m; };

/** InstancedMesh of boxes (size s) from [{x,y,z,c:THREE.Color}] (box centres). */
export function boxesToMesh(list, s = 1, matOpts = {}, material) {
  const geo = new THREE.BoxGeometry(s, s, s);
  const mat = material || withPlaster(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, ...matOpts }), matOpts.plaster ?? PLASTER.stone);
  delete mat.plaster;
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4();
  list.forEach((b, i) => { m.makeTranslation(b.x, b.y, b.z); mesh.setMatrixAt(i, m); mesh.setColorAt(i, b.c); });
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}


// --------------------------------------------------------------- architecture kit (density pass 2026-10-15)
// Geometry-only builders (position + normal, no uv: every stone material is triplanar). Combine with `bake([...])`
// into one merged geometry per material: hundreds of columns cost a handful of draw calls.
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
/** normalise a geometry for merging: non-indexed, no uv, normals present */
export function prep(g) { let o = g.index ? g.toNonIndexed() : g; if (o.attributes.uv) o.deleteAttribute('uv'); if (o.attributes.uv1) o.deleteAttribute('uv1'); if (!o.attributes.normal) o.computeVertexNormals(); return o; }
/** transformed copy: g placed at (x,y,z), rotated (rx,ry,rz), scaled */
export function place(g, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const o = prep(g.clone()); _q.setFromEuler(_e.set(rx, ry, rz)); _m4.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz)); o.applyMatrix4(_m4); return o;
}
/** merge a list of geometries (any mix of indexed / uv) into one */
export function bake(list) { return list.length ? mergeGeometries(list.map(prep)) : new THREE.BufferGeometry(); }
const box = (w, h, d, x = 0, y = 0, z = 0, ry = 0) => place(new THREE.BoxGeometry(w, h, d), x, y, z, ry);
const cyl = (rt, rb, h, seg, y, open = false) => place(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), 0, y, 0);

/** Doric column (base at y = 0): plinth + attic base, fluted shaft with entasis, necking, curved echinus, abacus.
 *  h = shaft height, r = shaft radius. broken: jagged top, no capital. Returns { geo, top } (top = height of the abacus top). */
export function columnGeo({ h = 160, r = 10, flutes = 20, broken = 0, seed = 1, plinth = true } = {}) {
  const rnd = mulberry32(seed); const parts = []; let y = 0;
  if (plinth) { parts.push(box(r * 2.9, r * 0.55, r * 2.9, 0, r * 0.275)); y = r * 0.55; }
  parts.push(cyl(r * 1.26, r * 1.36, r * 0.32, 40, y + r * 0.16)); y += r * 0.32;          // lower torus
  parts.push(cyl(r * 1.12, r * 1.18, r * 0.16, 40, y + r * 0.08)); y += r * 0.16;          // scotia
  parts.push(cyl(r * 1.12, r * 1.2, r * 0.18, 40, y + r * 0.09)); y += r * 0.18;           // upper torus
  const sh = broken ? h * (0.25 + 0.5 * rnd()) : h; const seg = flutes * 8, hs = Math.max(4, Math.round(sh / 8));
  const shaft = new THREE.CylinderGeometry(1, 1, sh, seg, hs, true); const P = shaft.attributes.position;
  const dropTop = broken ? (a) => r * (0.4 + 1.6 * fbm(Math.cos(a) * 2 + seed, Math.sin(a) * 2, 2, seed)) : () => 0;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), yy = P.getY(i), z = P.getZ(i); const a = Math.atan2(z, x); const t = (yy + sh / 2) / sh; const H = h ? (t * sh) / h : t;
    const R = r * (1 - 0.13 * H + 0.035 * Math.sin(Math.PI * H)); const u = ((a / (Math.PI * 2)) * flutes % 1 + 1) % 1;
    const k = 1 - 0.07 * Math.pow(Math.sin(Math.PI * u), 0.8);
    let yo = yy; if (broken && t > 0.999) yo -= dropTop(a);
    P.setXYZ(i, Math.cos(a) * R * k, yo, Math.sin(a) * R * k);
  }
  shaft.computeVertexNormals(); parts.push(place(shaft, 0, y + sh / 2, 0, rnd() * 6.28));
  if (broken) { // a jagged cap over the break
    const cap = new THREE.CircleGeometry(r * (1 - 0.13 * sh / h) * 0.93, 24); cap.rotateX(-Math.PI / 2); const C2 = cap.attributes.position;
    for (let i = 0; i < C2.count; i++) { const a = Math.atan2(C2.getZ(i), C2.getX(i)); C2.setY(i, -(Math.hypot(C2.getX(i), C2.getZ(i)) > 0.01 ? dropTop(a) : r * 0.8)); }
    cap.computeVertexNormals(); parts.push(place(cap, 0, y + sh, 0));
    return { geo: bake(parts), top: y + sh };
  }
  y += sh; const rt = r * (1 - 0.13 + 0) * 1.0;
  parts.push(cyl(rt * 0.98, rt, r * 0.3, 48, y + r * 0.15)); y += r * 0.3;                  // necking
  for (let k = 0; k < 3; k++) parts.push(cyl(rt * 1.03, rt * 1.03, r * 0.05, 48, y + r * (0.03 + 0.08 * k)));   // annulets
  y += r * 0.24;
  const prof = [[rt * 0.98, 0], [rt * 1.1, r * 0.1], [rt * 1.3, r * 0.24], [r * 1.42, r * 0.38], [r * 1.48, r * 0.46]].map(([a, b]) => new THREE.Vector2(a, b));
  parts.push(place(new THREE.LatheGeometry(prof, 48), 0, y, 0)); y += r * 0.46;             // echinus
  parts.push(box(r * 3.05, r * 0.5, r * 3.05, 0, y + r * 0.25)); y += r * 0.5;             // abacus
  return { geo: bake(parts), top: y };
}

/** Doric entablature along x, centred, bottom at y = 0: architrave (2 fasciae + taenia), triglyph frieze, cornice with mutules.
 *  L length, D depth, H total height, tri = triglyph spacing (0 = plain). */
export function entablatureGeo(L, D, H, { tri = 37, guttae = true } = {}) {
  const P = []; const a = H * 0.38, f = H * 0.34, c = H * 0.28;
  P.push(box(L, a * 0.48, D - 2, 0, a * 0.24)); P.push(box(L + 0.8, a * 0.42, D - 1.2, 0, a * 0.48 + a * 0.21)); P.push(box(L + 1.6, a * 0.1, D - 0.4, 0, a * 0.95));
  P.push(box(L - 1, f, D - 3.2, 0, a + f / 2));                                              // frieze (metope plane)
  if (tri) { const n = Math.max(1, Math.round(L / tri)); const w = Math.min(tri * 0.42, D * 0.3);
    for (let k = 0; k <= n; k++) { const x = -L / 2 + 1 + (L - 2) * k / n;
      for (const zs of [1, -1]) { const z = zs * (D / 2 - 1.2);
        for (let b = 0; b < 3; b++) P.push(box(w * 0.26, f, 1.6, x + (b - 1) * w * 0.36, a + f / 2, z));   // triglyph bars
        if (guttae) P.push(box(w, a * 0.08, 1.4, x, a * 0.86, z + zs * 0.3)); } } }
  P.push(box(L + 6, c * 0.42, D + 6, 0, a + f + c * 0.21));                                  // geison
  P.push(box(L + 7.5, c * 0.3, D + 7.5, 0, a + f + c * 0.42 + c * 0.15));                    // sima moulding
  P.push(box(L + 6.6, c * 0.28, D + 6.6, 0, a + f + c * 0.72 + c * 0.14));
  if (tri) { const n = Math.max(1, Math.round(L / tri)) * 2; for (let k = 0; k <= n; k++) { const x = -L / 2 + L * k / n;
    for (const zs of [1, -1]) P.push(box(Math.min(5, tri * 0.3), 1.1, 2.6, x, a + f - 0.5, zs * (D / 2 + 1.8))); } }   // mutules under the geison
  return bake(P);
}

/** pediment over a W-wide front, bottom at y = 0, apex height Hp, depth D: tympanum (recessed), raking cornices, acroteria */
export function pedimentGeo2(W, Hp, D) {
  const P = []; const s = new THREE.Shape(); s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(0, Hp); s.closePath();
  const tri = new THREE.ExtrudeGeometry(s, { depth: D - 4, bevelEnabled: false }); P.push(place(tri, 0, 0, -(D - 4) / 2));
  const ang = Math.atan2(Hp, W / 2), len = Math.hypot(W / 2, Hp) + 6;
  for (const sg of [-1, 1]) {
    P.push(place(new THREE.BoxGeometry(len, 4.5, D + 6), sg * W / 4, Hp / 2 + 2.4, 0, 0, 0, -sg * ang));
    P.push(place(new THREE.BoxGeometry(len, 2.2, D + 8), sg * W / 4, Hp / 2 + 5.6, 0, 0, 0, -sg * ang));
    P.push(box(7, 9, 7, sg * (W / 2 + 1), 4.5, D / 2 + 1)); P.push(box(7, 9, 7, sg * (W / 2 + 1), 4.5, -D / 2 - 1));
  }
  P.push(box(8, 12, 8, 0, Hp + 8, D / 2)); P.push(box(8, 12, 8, 0, Hp + 8, -D / 2));
  return bake(P);
}
/** gabled tile roof over a W x Len footprint (ridge along z), eaves at y = 0, apex Hp; ridge tiles as fine ribs */
export function roofGeo(W, Len, Hp, { ribs = 3.2 } = {}) {
  const P = []; const ang = Math.atan2(Hp, W / 2), sl = Math.hypot(W / 2, Hp) + 4;
  for (const sg of [-1, 1]) {
    const cx = sg * W / 4, cy = Hp / 2;
    P.push(place(new THREE.BoxGeometry(sl, 3, Len), cx, cy, 0, 0, 0, -sg * ang));
    for (let z = -Len / 2 + ribs / 2; z < Len / 2; z += ribs * 2) P.push(place(new THREE.BoxGeometry(sl, 1.2, ribs * 0.7), cx + Math.sin(ang) * sg * 0, cy + 1.9, z, 0, 0, -sg * ang));
  }
  P.push(place(new THREE.CylinderGeometry(2.4, 2.4, Len + 2, 8), 0, Hp + 1.5, 0, 0, Math.PI / 2));
  return bake(P);
}
/** a straight stair flight along +x: n steps of (rise, run), width w (z), starting at the origin going up */
export function stairGeo(n, rise, run, w) { const P = []; for (let k = 0; k < n; k++) P.push(box(run * (n - k), rise, w, run * k + run * (n - k) / 2, rise * (k + 0.5), 0)); return bake(P); }
/** ashlar wall (x along length) built from individual blocks with a mortar gap: reads as masonry coursing at any scale */
export function ashlarGeo(L, H, D, { bw = 22, bh = 9, gap = 0.7, seed = 1, jitter = 0.6 } = {}) {
  const rnd = mulberry32(seed); const P = []; const rows = Math.max(1, Math.round(H / bh)), rh = H / rows;
  for (let r = 0; r < rows; r++) { let x = -L / 2 - (r % 2 ? bw / 2 : 0);
    while (x < L / 2) { const w = bw * (0.7 + 0.6 * rnd()); const x0 = Math.max(-L / 2, x), x1 = Math.min(L / 2, x + w);
      if (x1 - x0 > 1) P.push(box(x1 - x0 - gap, rh - gap, D + (rnd() - 0.5) * jitter, (x0 + x1) / 2, rh * (r + 0.5), (rnd() - 0.5) * jitter * 0.5));
      x += w; } }
  P.push(box(L, gap * 1.5, D - 1.5, 0, H / 2)); // mortar core (fills the gaps from behind)
  P.push(place(new THREE.BoxGeometry(L - 0.5, H - 0.5, D - 1.4), 0, H / 2, 0));
  return bake(P);
}

// --------------------------------------------------------------- geography
export const CLIFF_Z = 24;
export const STRIP = { x0: -4400, x1: 700, zBack: -24, zFront: 24, depth: 44 };
const ridged = (x, z, s) => 1 - Math.abs(2 * fbm(x, z, 4, s) - 1);
export function terrainHeight(x, z) {
  if (z > CLIFF_Z) return -1e9;
  let h = -0.6 - 3 * fbm(x * 0.012, z * 0.012, 3, 7) * Math.min(1, (CLIFF_Z - z) / 60);
  const back = Math.max(0, -z - 450);
  const ramp = Math.min(1, back / 500);
  h += Math.pow(back / 900, 1.5) * 150 * (0.5 + 0.7 * fbm(x * 0.0016, z * 0.0016, 3, 9));
  h += ramp * (70 * Math.pow(1 - Math.abs(2 * fbm(x * 0.0035, z * 0.0035, 3, 2) - 1), 2.2) + 10 * (fbm(x * 0.008, z * 0.008, 2, 3) - 0.5));
  return h;
}
// smooth notch-free offset so the cliff drops below the strip's brick face
function stripDrop(x) { const d = Math.min(x - STRIP.x0, STRIP.x1 - x); return d <= 0 ? 0 : Math.min(1, d / 60); }
export function cliffTop(x, z) {
  const d = z - CLIFF_Z;
  let h = -10 - d * 2.2 - 70 * fbm(x * 0.02, z * 0.03, 3, 4);
  const near = Math.max(h, -8 - 28 * vnoise(x * 0.05, z * 0.05, 3));
  if (d < 40) h = near;
  const s = stripDrop(x);
  return s > 0 ? Math.min(h, h * (1 - s) + Math.min(h, -50 - 20 * vnoise(x * 0.04, z * 0.04, 8)) * s) : h;
}

// --------------------------------------------------------------- play strip / causeway
// Voxel size s (1 = sprite pixel). Top: stone pavers with grass verges; front: brick wall.
function stripSegment(x0, x1, s, seed, tufts) {
  const rnd = mulberry32(seed); const list = [];
  const grass = [C('#6d9e3c'), C('#7cad46'), C('#5c8e33'), C('#86b552')];
  const dark = C('#3f6b2a');
  const paver = (x, z) => { const px = Math.floor(x / 12), pz = Math.floor((z + 100) / 12); return C('#b9ab92').offsetHSL(0, 0, (vnoise(px * 1.3, pz * 1.7, 5) - 0.5) * 0.12); };
  const brick = (x, y) => {
    const row = Math.floor(-y / 8), off = (row % 2) * 8, bx = Math.floor((x + off) / 16);
    const mortar = ((((-y) % 8) + 8) % 8 < s) || ((((x + off) % 16) + 16) % 16 < s);
    const base = new THREE.Color().setHSL(0.09 + 0.02 * vnoise(bx, row, 3), 0.32 + 0.1 * vnoise(bx, row, 4), 0.52 + 0.1 * (vnoise(bx * 1.7, row * 1.3, 5) - 0.5));
    if (mortar && s <= 2) base.multiplyScalar(0.62);
    base.multiplyScalar(0.92 + 0.12 * vnoise(x * 0.5, y * 0.5, 9));
    return base;
  };
  for (let x = x0; x < x1; x += s) {
    const drip = 2 + Math.floor(vnoise(x * 0.35, 0, 11) * 4);
    for (let z = STRIP.zBack; z < STRIP.zFront; z += s) {
      const verge = z < STRIP.zBack + 6 + 3 * vnoise(x * 0.1, 1, 2) || z > STRIP.zFront - 7 - 3 * vnoise(x * 0.1, 2, 2);
      const gap = !verge && (((x % 12) + 12) % 12 < s || (((z + 100) % 12) + 12) % 12 < s) && s === 1;
      const g = verge || (gap && rnd() < 0.5) ? grass[Math.floor(fbm(x * 0.13, z * 0.13, 2, 1) * 4) % 4].clone().multiplyScalar(0.95 + rnd() * 0.1) : paver(x, z);
      list.push({ x: x + s / 2, y: s === 1 ? (gap ? -1.5 : -0.5) : -s / 2, z: z + s / 2, c: g });
      if (tufts && verge && rnd() < 0.18) { const h = 1 + Math.floor(rnd() * 3); for (let k = 0; k < h; k++) list.push({ x: x + 0.5, y: k + 0.5, z: z + 0.5, c: grass[3].clone().multiplyScalar(0.9 + 0.2 * rnd()) }); }
    }
    for (let y = -2 * s; y >= -STRIP.depth; y -= s) {
      const c = y > -1 - drip ? (y <= -drip ? dark.clone() : grass[2].clone()) : brick(x, y);
      list.push({ x: x + s / 2, y: y + s / 2, z: STRIP.zFront - s / 2, c });
    }
    for (let y = -2 * s; y >= -8; y -= s) list.push({ x: x + s / 2, y: y + s / 2, z: STRIP.zBack + s / 2, c: brick(x, y) }); // curb on the meadow side
  }
  return boxesToMesh(list, s, { roughness: 0.92, plaster: PLASTER.stone });
}
export function makeStrip() {
  const g = new THREE.Group();
  g.add(stripSegment(-640, STRIP.x1, 1, 7, true));
  g.add(stripSegment(-1840, -640, 2, 8, false));
  g.add(stripSegment(STRIP.x0, -1840, 4, 9, false));
  return g;
}

// --------------------------------------------------------------- terrain
export function makeMeadow({ x0 = -6000, x1 = 2000, z0 = -4200, z1 = CLIFF_Z, nx = 640, nz = 420 } = {}) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
  const p = g.attributes.position; const col = new Float32Array(p.count * 3);
  const grassA = C('#5f8a30'), grassB = C('#8a9c3c'), dry = C('#b49a58'), far = C('#7f8f4a'), rockC = C('#9a8f80');
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = Math.min(p.getZ(i), CLIFF_Z - 0.01);
    const h = terrainHeight(x, z); p.setY(i, h);
    const n = fbm(x * 0.01, z * 0.01, 4, 21);
    c.copy(grassA).lerp(grassB, n).lerp(dry, Math.max(0, fbm(x * 0.003, z * 0.003, 3, 5) - 0.42) * 1.8);
    c.lerp(far, Math.min(1, Math.max(0, -z - 500) / 2000) * 0.5);
    const slope = Math.abs(terrainHeight(x + 6, z) - h) + Math.abs(terrainHeight(x, z + 6) - h);
    c.lerp(rockC, Math.min(1, Math.max(0, slope - 5) / 6));
    c.multiplyScalar(0.85 + 0.25 * vnoise(x * 0.08, z * 0.08, 33));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const mat = withPlaster(triplanarMaterial({ tex: grassTexture(), scale: 0.035, bump: 0.6, vertexColors: true, roughness: 0.95 }), PLASTER.meadow);
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true; m.castShadow = true;
  return m;
}

export function makeCliff({ x0 = -4600, x1 = 1400, z1 = 440, s = 8, seaY = -200, fine = null } = {}) {
  const list = [];
  const inFine = (x) => fine && x >= fine.x0 && x < fine.x1;
  const rock = C('#a8977f'), rockD = C('#776a5c'), moss = C('#6f7d3c'), sand = C('#d6c193');
  const q = (xx, zz) => (zz <= CLIFF_Z ? 1e9 : Math.round(cliffTop(xx, zz) / s) * s);
  for (let x = x0; x < x1; x += s) for (let z = CLIFF_Z; z < z1; z += s) {
    const cx = x + s / 2, cz = z + s / 2; if (inFine(cx)) continue;
    const h = Math.round(cliffTop(cx, cz) / s) * s;
    if (h < seaY - 8) continue;
    const base = rock.clone().lerp(rockD, vnoise(cx * 0.07, cz * 0.07, 41)).multiplyScalar(0.85 + 0.3 * vnoise(cx * 0.9, cz * 0.9, 7));
    const hidden = Math.min(q(cx + s, cz), q(cx - s, cz), q(cx, cz + s), cz - s <= CLIFF_Z ? 1e9 : q(cx, cz - s));
    for (let y = h - s / 2, k = 0; y >= seaY - 16; y -= s, k++) {
      if (k > 0 && y < hidden - s) break;
      let c = base.clone().multiplyScalar(0.92 + 0.12 * vnoise(cx, y * 0.15, 9));
      if (k === 0 && h > -70) c = moss.clone().lerp(base, 0.4 + 0.4 * vnoise(cx * 0.3, cz * 0.3, 2));
      if (y < seaY + 12) c = sand.clone().lerp(base, 0.5);
      list.push({ x: cx, y, z: cz, c });
    }
  }
  // skirt under the meadow edge / brick wall so there is never a gap
  for (let x = x0; x < x1; x += s) {
    const cx = x + s / 2, inStrip = cx > STRIP.x0 && cx < STRIP.x1;
    const front = Math.round(cliffTop(cx, CLIFF_Z + s / 2) / s) * s;
    for (let y = inStrip ? -STRIP.depth - s / 2 : -s / 2 - 1; y > front - s; y -= s)
      list.push({ x: cx, y, z: CLIFF_Z - s / 2, c: rock.clone().lerp(rockD, vnoise(cx * 0.1, y * 0.1, 5)) });
  }
  const mat = withPlaster(triplanarMaterial({ tex: rockTexture(), scale: 0.02, bump: 1.6, roughness: 0.9 }), PLASTER.rock);
  const coarse = boxesToMesh(list, s, {}, mat);
  if (!fine) return coarse;
  // fine segment (density pass): v-sized voxels, solid columns face-culled by the mesher, sedimentary beds every ~6 units,
  // moss on the lip, sand at the waterline, baked AO
  const v = fine.s, yb = seaY - 16, nx = Math.ceil((fine.x1 - fine.x0) / v), nz = Math.ceil((z1 - CLIFF_Z) / v);
  let ymax = -1e9; const tops = new Float32Array(nx * nz);
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) { const t = cliffTop(fine.x0 + (i + 0.5) * v, CLIFF_Z + (k + 0.5) * v); tops[i + nx * k] = t; ymax = Math.max(ymax, t); }
  const ny = Math.ceil((ymax - yb) / v) + 1; const occ = new Uint8Array(nx * ny * nz), col = new Uint8Array(nx * ny * nz * 3);
  const c = new THREE.Color();
  for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
    const cx = fine.x0 + (i + 0.5) * v, cz = CLIFF_Z + (k + 0.5) * v; const h = tops[i + nx * k]; if (h < seaY - 8) continue;
    const jt = Math.min(ny - 1, Math.floor((h - yb) / v));
    for (let j = 0; j <= jt; j++) {
      const y = yb + (j + 0.5) * v, bed = Math.floor((y + 3 * vnoise(cx * 0.01, 0, 3)) / 6);
      c.copy(rock).lerp(rockD, Math.min(1, Math.max(0, 0.25 + 0.6 * vnoise(bed * 0.71, 1.3, 41) + 0.3 * (vnoise(cx * 0.04, y * 0.03, 7) - 0.5))));
      if (vnoise(bed * 1.7, 4.1, 42) > 0.72) c.lerp(sand, 0.45);
      c.multiplyScalar(0.9 + 0.15 * vnoise(cx * 0.6, y * 0.4, cz * 0.6));
      if (j === jt && h > -70) c.lerp(moss, 0.55);
      if (y < seaY + 12) c.lerp(sand, 0.5);
      const idx = i + nx * (j + ny * k); occ[idx] = 1; col[idx * 3] = Math.round(c.r * 255); col[idx * 3 + 1] = Math.round(c.g * 255); col[idx * 3 + 2] = Math.round(c.b * 255);
    }
  }
  const fmat = withPlaster(triplanarMaterial({ tex: rockTexture(), scale: 0.02, bump: 0.9, roughness: 0.9, vertexColors: true }), PLASTER.rock);
  const fm = new THREE.Mesh(meshVoxelGrid({ nx, ny, nz, occ, col }, { s: v, origin: [fine.x0, yb, CLIFF_Z], ao: 0.32 }), fmat);
  fm.castShadow = fm.receiveShadow = true;
  const g = new THREE.Group(); g.add(coarse, fm); return g;
}

// grass tufts + wildflowers scattered on the meadow near the action
export function makeTufts({ count = 55000, x0 = -1700, x1 = 600, z0 = -800, z1 = CLIFF_Z - 1, seed = 17 } = {}) {
  const rnd = mulberry32(seed); const list = [];
  const greens = [C('#6f9a36'), C('#86a744'), C('#9aaf4c'), C('#5d8530')];
  const flowers = [C('#f4f0e2'), C('#f2d04a'), C('#e98a5a'), C('#b9a3e0')];
  for (let i = 0; i < count; i++) {
    const x = x0 + rnd() * (x1 - x0), z = z0 + Math.pow(rnd(), 0.6) * (z1 - z0);
    if (z > STRIP.zBack - 2) continue;
    if (fbm(x * 0.01, z * 0.01, 2, 3) < 0.36) continue;
    const y = terrainHeight(x, z); const fl = rnd() < 0.07;
    const h = fl ? 2 : 1 + Math.floor(rnd() * 2);
    for (let k = 0; k < h; k++) list.push({ x: Math.round(x) + 0.5, y: y + k + 0.5, z: Math.round(z) + 0.5, c: (fl && k === h - 1) ? flowers[Math.floor(rnd() * 4)] : greens[Math.floor(rnd() * 4)].clone().multiplyScalar(0.9 + 0.25 * rnd()) });
  }
  const m = boxesToMesh(list, 1, { roughness: 0.9, plaster: PLASTER.meadow }); m.castShadow = false; return m;
}

// --------------------------------------------------------------- rocks
function boulderGeo(r, seed, flat = 0.6) {
  const g = new THREE.IcosahedronGeometry(r, 3); const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize();
    const k = 0.7 + 0.5 * fbm(n.x * 2 + seed, n.y * 2 + n.z * 1.3, 4, seed) + 0.12 * Math.abs(Math.sin(n.y * 9 + seed));
    v.multiplyScalar(k); v.y *= flat; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
export function makeBoulders({ seed = 31, count = 70 } = {}) {
  const rnd = mulberry32(seed); const geos = [];
  for (let i = 0; i < count; i++) {
    const x = -2600 + rnd() * 3000, z = -1800 + rnd() * 1650; if (z > -60) continue;
    const r = 6 + Math.pow(rnd(), 2.5) * 40; const g = boulderGeo(r, i + seed, 0.5 + rnd() * 0.3);
    g.rotateY(rnd() * 6.28); g.translate(x, terrainHeight(x, z) + r * 0.15, z); geos.push(g);
  }
  const mat = withPlaster(triplanarMaterial({ tex: rockTexture(), scale: 0.03, bump: 1.2, color: 0xb9ab97, roughness: 0.92 }), PLASTER.rock);
  const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = m.receiveShadow = true; return m;
}

// --------------------------------------------------------------- ruins
function stoneMat(color = '#e4d8bf') {
  return withPlaster(triplanarMaterial({ tex: stoneTexture(), scale: 0.025, bump: 1.4, color, roughness: 0.82 }), PLASTER.stone);
}
function fluteColumn(h, r) {
  const g = new THREE.CylinderGeometry(r * 0.92, r, h, 32, Math.max(1, Math.round(h / 10)));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), rr = Math.hypot(x, z);
    if (rr < 0.01) continue;
    const k = 1 - 0.06 * Math.pow(Math.abs(Math.cos(a * 10)), 0.6);
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}
export function makeColumn({ h = 160, r = 10, broken = 0, seed = 1, mat }) {
  const rnd = mulberry32(seed); const grp = new THREE.Group(); mat = mat || stoneMat();
  const base = new THREE.Mesh(new THREE.BoxGeometry(r * 3, 6, r * 3), mat); base.position.y = 3; grp.add(base);
  const torus = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.2, r * 1.32, 5, 32), mat); torus.position.y = 8.5; grp.add(torus);
  const sh = broken ? h * (0.3 + 0.5 * rnd()) : h;
  const drums = Math.max(1, Math.round(sh / 28)); let y = 11;
  for (let d = 0; d < drums; d++) {
    const dh = sh / drums - 0.6; const m = new THREE.Mesh(fluteColumn(dh, r), mat);
    m.position.y = y + dh / 2; m.rotation.y = rnd() * 6.28; y += dh + 0.6;
    if (broken && d === drums - 1) { m.rotation.z = (rnd() - 0.5) * 0.12; m.rotation.x = (rnd() - 0.5) * 0.12; }
    grp.add(m);
  }
  if (!broken) {
    const ech = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.45, r * 0.95, 6, 32), mat); ech.position.y = y + 3; grp.add(ech);
    const ab = new THREE.Mesh(new THREE.BoxGeometry(r * 3.1, 6, r * 3.1), mat); ab.position.y = y + 9; grp.add(ab);
  }
  grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  grp.userData.top = y + (broken ? 0 : 12);
  return grp;
}
function pedimentGeo(w, h, d) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const inner = new THREE.Shape(); inner.moveTo(-w / 2 + 14, 5); inner.lineTo(w / 2 - 14, 5); inner.lineTo(0, h - 9); inner.closePath(); // tympanum recess
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
  const g2 = new THREE.ExtrudeGeometry(inner, { depth: 4, bevelEnabled: false }); g2.translate(0, 0, d / 2 - 1);
  return [g, g2];
}
export function makeRuins({ seed = 3 } = {}) {
  const rnd = mulberry32(seed); const grp = new THREE.Group();
  const mat = stoneMat('#e6dac2'), matD = stoneMat('#cdbd9e');
  const ground = (x, z) => terrainHeight(x, z);
  const L = [], LD = []; // merged geometry lists for mat / matD
  const colTop = columnGeo({ h: 170, r: 10 }).top; // top of an intact h=170 column
  // colonnade along the cliff edge, receding toward -x (same RNG order as before: column positions are gameplay anchors)
  const rows = [{ z: -78, x0: -300, x1: -1250, step: 74 }, { z: -170, x0: -330, x1: -1200, step: 74 }];
  const runs = [];
  rows.forEach((row, ri) => {
    let run = [];
    for (let x = row.x0, k = 0; x > row.x1; x -= row.step, k++) {
      const r = rnd(); if (r < 0.12 && k > 4) { if (run.length) runs.push({ ri, cols: run }); run = []; continue; }
      const broken = (r < 0.38 && k > 4) ? 1 : 0;
      const h = 170 + ri * 10; const { geo, top } = columnGeo({ h, r: 10, broken, seed: seed * 100 + k + ri * 50 });
      const px = x + (rnd() - 0.5) * 4, pz = row.z + (rnd() - 0.5) * 4, py = ground(x, row.z);
      geo.translate(px, py, pz); (k % 3 ? L : LD).push(geo);
      if (!broken && !(ri === 0 && k <= 4)) run.push({ x: px, y: py + top, z: pz }); else { if (run.length) runs.push({ ri, cols: run }); run = []; }
      if (broken && rnd() < 0.7) {
        const dm = place(fluteColumn(26, 10), x + 20 + rnd() * 20, 0, 0, rnd() * 3, 0, Math.PI / 2);
        dm.translate(0, ground(x + 25, row.z) + 10, row.z + 18 + rnd() * 10); L.push(dm);
      }
    }
    if (run.length) runs.push({ ri, cols: run });
  });
  // continuous Doric entablature over every run of standing columns (single standing columns keep a lone block)
  for (const { cols } of runs) {
    const xa = Math.max(...cols.map((c) => c.x)), xb = Math.min(...cols.map((c) => c.x)); const y = Math.min(...cols.map((c) => c.y)); const z = cols[0].z;
    const len = xa - xb + 34; const e = entablatureGeo(len, 34, cols.length > 1 ? 34 : 22, { tri: 37 }); e.translate((xa + xb) / 2, y, z); L.push(e);
  }
  // temple front: entablature + pediment over the first five columns of the front row
  const fy = ground(-448, -78) + colTop;
  { const e = entablatureGeo(334, 36, 38, { tri: 37 }); e.translate(-448, fy, -78); L.push(e);
    const pd = pedimentGeo2(344, 62, 40); pd.translate(-448, fy + 38, -78); L.push(pd);
    const ty = new THREE.BoxGeometry(300, 2, 4); // tympanum shadow line
    L.push(place(ty, -448, fy + 40, -78 + 18));
    // side return toward the back row (a roofed porch: entablature + roof)
    const se = entablatureGeo(120, 34, 38, { tri: 37 }); se.rotateY(Math.PI / 2); se.translate(-292, fy, -124); L.push(se);
    const rf = roofGeo(344, 100, 62); rf.translate(-448, fy + 38, -128); LD.push(rf); }
  // broken pediment fragment + architrave blocks lying in the grass
  { const fg = pedimentGeo2(180, 34, 30); const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-1.25, 0.6, 0.15)); fg.applyMatrix4(m); fg.translate(-905, ground(-905, -125) + 8, -125); LD.push(fg); }
  for (const [x, z, ry] of [[-760, -128, 0.3], [-1010, -110, 1.2], [-640, -210, 2.0]]) {
    const e = entablatureGeo(70, 30, 18, { tri: 35 }); e.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.05, ry, 0.08))); e.translate(x, ground(x, z) - 1, z); L.push(e);
  }
  // stylobate steps under the colonnade (crepidoma: three steps with block joints)
  for (let s = 0; s < 3; s++) {
    const st = ashlarGeo(1000 - s * 10, 4, 160 - s * 12, { bw: 40, bh: 4, gap: 0.6, seed: 40 + s, jitter: 0 });
    st.translate(-780, ground(-780, -120) + s * 4 - 10, -124); LD.push(st);
  }
  // great gate further away (inland): two colossal columns + a full entablature
  const gx = -1050, gz = -330, gy = ground(gx, gz);
  let gTop = 0; for (const dx of [-60, 60]) { const { geo, top } = columnGeo({ h: 300, r: 18, seed: 900 + dx }); geo.translate(gx + dx, gy, gz); L.push(geo); gTop = top; }
  { const e = entablatureGeo(190, 56, 46, { tri: 40 }); e.translate(gx, gy + gTop, gz); L.push(e); }
  const meshOf = (list, m) => { const o = new THREE.Mesh(bake(list), m); o.castShadow = o.receiveShadow = true; return o; };
  grp.add(meshOf(L, mat), meshOf(LD, matD));
  grp.add(makeMonument({ mat, matD }));
  return grp;
}

// Talos-like monumental gate astride the causeway at the horizon: two pylons
// rising from the sea cliff, a colossal lintel, a stepped crown.
export function makeMonument({ x = -2650, mat, matD } = {}) {
  const grp = new THREE.Group(); mat = mat || stoneMat(); matD = matD || stoneMat('#cdbd9e');
  const A = [], B = []; // mat / matD geometry lists (density pass: ashlar coursing, mouldings, a Doric lintel, a framed inner portal)
  const H = 640, zA = -110, zB = 104, W = 96;
  for (const z of [zA, zB]) {
    const y0 = z > 0 ? -200 : terrainHeight(x, z) - 10;
    const body = ashlarGeo(W, H - y0, W, { bw: 34, bh: 16, gap: 0.9, seed: z > 0 ? 71 : 72, jitter: 0.8 }); body.translate(x, y0, z); A.push(body);
    const pb = y0 + (z > 0 ? 150 : 0); // plinth (on the sea side it starts above the water line)
    for (let k = 0; k < 3; k++) { const g = ashlarGeo(W + 30 - k * 9, 10, W + 30 - k * 9, { bw: 40, bh: 10, seed: 80 + k, jitter: 0 }); g.translate(x, pb + k * 10, z); B.push(g); }
    for (let k = 0; k < 5; k++) { const yy = H - 70 - k * 120; B.push(place(new THREE.BoxGeometry(W + 7, 4, W + 7), x, yy, z)); B.push(place(new THREE.BoxGeometry(W + 4, 2, W + 4), x, yy - 3, z)); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.push(place(new THREE.BoxGeometry(8, H - pb - 30, 8), x + sx * (W / 2 + 1), (H + pb + 30) / 2, z + sz * (W / 2 + 1))); // corner pilasters
  }
  const span = zB - zA + W + 40, zc = (zA + zB) / 2;
  { const e = entablatureGeo(span, W + 20, 70, { tri: 44 }); e.rotateY(Math.PI / 2); e.translate(x, H, zc); A.push(e); }
  { const c1 = ashlarGeo(span * 0.62, 36, W - 6, { bw: 36, bh: 12, seed: 90 }); c1.rotateY(Math.PI / 2); c1.translate(x, H + 70, zc); A.push(c1);
    const c2 = ashlarGeo(span * 0.3, 28, W - 22, { bw: 30, bh: 14, seed: 91 }); c2.rotateY(Math.PI / 2); c2.translate(x, H + 106, zc); A.push(c2);
    B.push(place(new THREE.BoxGeometry(W + 2, 4, span * 0.64), x, H + 108, zc)); }
  // inner portal: two Doric columns + entablature
  for (const z of [-40, 40]) { const { geo } = columnGeo({ h: 176, r: 9, seed: 950 + z }); geo.translate(x + 10, -1, z); B.push(geo); }
  { const e = entablatureGeo(104, 26, 24, { tri: 26 }); e.rotateY(Math.PI / 2); e.translate(x + 10, 196, 0); B.push(e); }
  for (const [list, m] of [[A, mat], [B, matD]]) { const o = new THREE.Mesh(bake(list), m); o.castShadow = o.receiveShadow = true; grp.add(o); }
  return grp;
}

// --------------------------------------------------------------- cypresses
// Dense clustered foliage: many noise-displaced blobs along a spindle profile,
// merged into one mesh per forest (vertex AO: darker toward the core/bottom).
function cypressGeo(h, seed) {
  const rnd = mulberry32(seed); const r0 = h * 0.12; const parts = [];
  const prof = (t) => r0 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.04 + 0.02)), 0.75) * (1 - 0.3 * t);
  const core = new THREE.CylinderGeometry(r0 * 0.25, r0 * 0.55, h * 0.92, 8); core.translate(0, h * 0.46, 0); parts.push([core, 0.35]);
  const n = Math.round(h * 0.55);
  for (let i = 0; i < n; i++) {
    const t = Math.pow(rnd(), 0.9), a = rnd() * Math.PI * 2, rr = prof(t);
    const b = new THREE.IcosahedronGeometry(rr * (0.45 + 0.35 * rnd()), 1);
    const p = b.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k); const s = 0.75 + 0.5 * vnoise(x * 0.4 + i, y * 0.4 + z * 0.3, 5); p.setXYZ(k, x * s, y * s * 1.25, z * s); }
    b.translate(Math.cos(a) * rr * 0.62, t * h * 0.95 + rr * 0.3, Math.sin(a) * rr * 0.62);
    parts.push([b, 0.55 + 0.45 * t]);
  }
  const geos = parts.map(([g, ao]) => { const gg = g.index ? g.toNonIndexed() : g; gg.deleteAttribute('uv');
    const c = new Float32Array(gg.attributes.position.count * 3);
    for (let k = 0; k < gg.attributes.position.count; k++) { const out = Math.min(1, Math.hypot(gg.attributes.position.getX(k), gg.attributes.position.getZ(k)) / (r0 * 0.9));
      const v = (0.45 + 0.55 * out) * ao; c[k * 3] = 0.20 * v + 0.05; c[k * 3 + 1] = 0.33 * v + 0.06; c[k * 3 + 2] = 0.17 * v + 0.04; }
    gg.setAttribute('color', new THREE.BufferAttribute(c, 3)); return gg; });
  return mergeGeometries(geos);
}
export function makeCypresses({ seed = 5, spots } = {}) {
  const rnd = mulberry32(seed); const geos = [];
  spots.forEach(([x, z, s], i) => {
    const h = (140 + rnd() * 90) * s; const g = cypressGeo(h, seed * 1000 + i);
    g.rotateY(rnd() * 6.28); g.translate(x, terrainHeight(x, z) - 2, z); geos.push(g);
  });
  const mat = withPlaster(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), PLASTER.clay);
  const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = m.receiveShadow = true;
  return m;
}

// --------------------------------------------------------------- distant islands
export function makeIslands({ seed = 11, seaY = -200 } = {}) {
  const rnd = mulberry32(seed); const grp = new THREE.Group();
  const mat = withPlaster(new THREE.MeshStandardMaterial({ color: '#9a8f86', roughness: 1 }), PLASTER.rock);
  const spots = [[-5200, 2600, 900], [-7600, 600, 1400], [-3800, 4800, 700], [-9000, -2200, 1800], [-2600, 6400, 500], [-12000, 3000, 2600]];
  for (const [x, z, s] of spots) {
    const g = new THREE.IcosahedronGeometry(1, 5); const p = g.attributes.position; const flat = 0.35 + 0.15 * rnd();
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const n = fbm(v.x * 0.9 + x, v.z * 0.9 + z, 3, 3);
      v.multiplyScalar(0.8 + 0.4 * n); v.y = Math.max(v.y, -0.2) * flat;
      p.setXYZ(i, v.x * s, v.y * s, v.z * s * 0.8);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.position.set(x, seaY - 10, z); m.receiveShadow = true; grp.add(m);
  }
  return grp;
}

// --------------------------------------------------------------- 2D parallax flats
// Pixel-art cards drawn procedurally into canvases (1 texel = 1 world unit),
// nearest-filtered, unlit. They only exist for the 2D camera and fade away in the turn.
function pixelCanvas(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); draw(g, w, h);
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function ridge(g, w, h, base, amp, freq, seed, col, oct = 3) {
  g.fillStyle = col;
  for (let x = 0; x < w; x++) { const y = Math.round(base - amp * fbm(x * freq, 0.5, oct, seed)); g.fillRect(x, y, 1, h - y); }
}
export function makeBackdrop({ width = 1400 } = {}) {
  const grp = new THREE.Group();
  const layers = [
    { z: -110, f: 0.75, h: 200, y: -40, draw: (g, w, h) => { // far sea-cliff mountains, hazy violet
      ridge(g, w, h, 160, 90, 0.006, 3, '#cdbfc2');
      g.fillStyle = '#e2d6d4'; for (let x = 0; x < w; x++) { const y = Math.round(160 - 90 * fbm(x * 0.006, 0.5, 3, 3)); const y2 = Math.round(160 - 90 * fbm((x + 3) * 0.006, 0.5, 3, 3)); if (y2 < y) g.fillRect(x, y, 1, 2 + Math.round(vnoise(x * 0.1, 1, 2) * 3)); }
      ridge(g, w, h, 176, 50, 0.012, 4, '#b5a7ad'); } },
    { z: -90, f: 0.5, h: 200, y: -40, draw: (g, w, h) => { // hills with ruins silhouettes
      ridge(g, w, h, 178, 46, 0.008, 8, '#a0959c', 2);
      g.fillStyle = '#a0959c';
      for (let x = 40; x < w; x += 170) { const by = Math.round(178 - 46 * fbm(x * 0.008, 0.5, 2, 8)); for (let c = 0; c < 4; c++) { if ((x / 170 + c) % 5 === 3) continue; const hh = 36 + ((c * 7 + x) % 3) * 6; g.fillRect(x + c * 14, by - hh, 6, hh); g.fillRect(x + c * 14 - 1, by - hh - 2, 8, 2); } g.fillRect(x - 2, by - 40, 50, 3); }
      ridge(g, w, h, 190, 22, 0.02, 9, '#857f88', 2); } },
    { z: -60, f: 0.25, h: 200, y: -40, draw: (g, w, h) => { // near cypress silhouettes + bushes
      g.fillStyle = '#6e6c70';
      for (let x = 20; x < w; x += 97 + (x % 41)) { const hh = 44 + (x % 23); for (let y = 0; y < hh; y++) { const t = y / hh; const r = Math.round(6 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.8) * (1 - 0.3 * t)); g.fillRect(x - r, 196 - y, 2 * r + 1, 1); } }
      ridge(g, w, h, 198, 12, 0.05, 12, '#7c7a7c', 2); } },
    { z: -130, f: 0.85, h: 200, y: -10, cloud: true, draw: (g, w) => { // pixel clouds
      // puffy pixel clouds: union of discs, lit top (cream), shaded underside (peach)
      const disc = (cx, cy, r, col) => { g.fillStyle = col; for (let y = -r; y <= r; y++) { const hw = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(Math.round(cx - hw), Math.round(cy + y), 2 * hw + 1, 1); } };
      const cloud = (cx, cy, s, seed) => {
        const parts = []; for (let k = 0; k < 5; k++) parts.push([cx + (k - 2) * s * 0.9, cy - s * 0.5 * Math.sin((k + 0.5) / 5 * Math.PI) * (1 + 0.4 * vnoise(k, seed, 2)), s * (0.6 + 0.5 * Math.sin((k + 0.5) / 5 * Math.PI))]);
        for (const [x, y, r] of parts) disc(x, y + 2, r, '#e8a774');
        for (const [x, y, r] of parts) disc(x, y, r, '#ffe9c8');
        for (const [x, y, r] of parts) disc(x - r * 0.25, y - r * 0.3, r * 0.55, '#fff6e6');
        g.clearRect(cx - s * 3, cy + s * 0.55, s * 6, s * 2);
      };
      for (let x = 60, k = 0; x < w; x += 230 + (k * 37) % 90, k++) cloud(x, 46 + (k * 29) % 50, 8 + (k * 3) % 6, k); } },
  ];
  for (const L of layers) {
    const tex = pixelCanvas(width, L.h, L.draw);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, fog: false, depthWrite: true });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, L.h), mat);
    m.position.set(0, L.y + L.h / 2, L.z); m.userData = { f: L.f, baseY: L.y + L.h / 2, cloud: !!L.cloud, noAO: true };
    grp.add(m);
  }
  /** parallax + fade: camX = 2D camera x, fade 0..1 (1 = gone) */
  grp.userData.update = (camX, t, fade) => {
    for (const m of grp.children) {
      const drift = m.userData.cloud ? t * 6 : 0;
      m.position.x = Math.round(camX * m.userData.f + drift);
      m.position.y = m.userData.baseY - fade * fade * 120;
      m.material.opacity = 1 - fade; m.material.alphaTest = fade > 0 ? 0.01 : 0.5;
      m.material.depthWrite = fade === 0;
      m.visible = fade < 0.999;
    }
  };
  return grp;
}
