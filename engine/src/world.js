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

export function makeCliff({ x0 = -4600, x1 = 1400, z1 = 440, s = 8, seaY = -200 } = {}) {
  const list = [];
  const rock = C('#a8977f'), rockD = C('#776a5c'), moss = C('#6f7d3c'), sand = C('#d6c193');
  const q = (xx, zz) => (zz <= CLIFF_Z ? 1e9 : Math.round(cliffTop(xx, zz) / s) * s);
  for (let x = x0; x < x1; x += s) for (let z = CLIFF_Z; z < z1; z += s) {
    const cx = x + s / 2, cz = z + s / 2;
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
  return boxesToMesh(list, s, {}, mat);
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
  const colTop = 170 + 11 + 12; // shaft + base + capital of an intact h=170 column
  // colonnade along the cliff edge, receding toward -x
  const rows = [{ z: -78, x0: -300, x1: -1250, step: 74 }, { z: -170, x0: -330, x1: -1200, step: 74 }];
  rows.forEach((row, ri) => {
    for (let x = row.x0, k = 0; x > row.x1; x -= row.step, k++) {
      const r = rnd(); if (r < 0.12 && k > 4) continue;
      const broken = (r < 0.38 && k > 4) ? 1 : 0;
      const col = makeColumn({ h: 170 + ri * 10, r: 10, broken, seed: seed * 100 + k + ri * 50, mat: k % 3 ? mat : matD });
      col.position.set(x + (rnd() - 0.5) * 4, ground(x, row.z), row.z + (rnd() - 0.5) * 4); grp.add(col);
      if (broken && rnd() < 0.7) {
        const dm = new THREE.Mesh(fluteColumn(26, 10), mat); dm.rotation.z = Math.PI / 2; dm.rotation.y = rnd() * 3;
        dm.position.set(x + 20 + rnd() * 20, ground(x + 25, row.z) + 10, row.z + 18 + rnd() * 10);
        dm.castShadow = dm.receiveShadow = true; grp.add(dm);
      }
    }
  });
  // temple front: entablature + pediment over the first five columns of the front row
  const ent = new THREE.Mesh(new THREE.BoxGeometry(330, 18, 34), mat); ent.position.set(-448, ground(-448, -78) + colTop + 9, -78);
  const cor = new THREE.Mesh(new THREE.BoxGeometry(340, 6, 40), mat); cor.position.set(-448, ent.position.y + 12, -78);
  const [pg, pr] = pedimentGeo(340, 58, 36); const ped = new THREE.Mesh(pg, mat); ped.position.set(-448, cor.position.y + 3, -78);
  const pin = new THREE.Mesh(pr, matD); pin.position.copy(ped.position);
  const side = new THREE.Mesh(new THREE.BoxGeometry(18, 18, 120), mat); side.position.set(-300, ent.position.y, -124);
  for (const m of [ent, cor, ped, pin, side]) { m.castShadow = m.receiveShadow = true; grp.add(m); }
  // broken pediment fragment + architrave blocks lying in the grass
  const [fg] = pedimentGeo(180, 34, 30); const frag = new THREE.Mesh(fg, matD);
  frag.rotation.set(-1.25, 0.6, 0.15); frag.position.set(-905, ground(-905, -125) + 8, -125); frag.castShadow = frag.receiveShadow = true; grp.add(frag);
  for (const [x, z, ry] of [[-760, -128, 0.3], [-1010, -110, 1.2], [-640, -210, 2.0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(70, 16, 30), mat); b.rotation.set(0.05, ry, 0.08); b.position.set(x, ground(x, z) + 7, z); b.castShadow = b.receiveShadow = true; grp.add(b);
  }
  // stylobate steps under the colonnade
  for (let s = 0; s < 3; s++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(1000 - s * 10, 4, 160 - s * 12), matD);
    st.position.set(-780, ground(-780, -120) + 2 + s * 4 - 8, -124); st.receiveShadow = st.castShadow = true; grp.add(st);
  }
  // great gate further away (inland)
  const gx = -1050, gz = -330, gy = ground(gx, gz);
  for (const dx of [-60, 60]) { const p = makeColumn({ h: 300, r: 18, seed: 900 + dx, mat }); p.position.set(gx + dx, gy, gz); grp.add(p); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(190, 26, 50), mat); top.position.set(gx, gy + 300 + 11 + 12 + 13, gz); top.castShadow = top.receiveShadow = true; grp.add(top);
  grp.add(makeMonument({ mat, matD }));
  return grp;
}

// Talos-like monumental gate astride the causeway at the horizon: two pylons
// rising from the sea cliff, a colossal lintel, a stepped crown.
export function makeMonument({ x = -2650, mat, matD } = {}) {
  const grp = new THREE.Group(); mat = mat || stoneMat(); matD = matD || stoneMat('#cdbd9e');
  const add = (g, m, px, py, pz) => { const o = new THREE.Mesh(g, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; grp.add(o); return o; };
  const H = 640, zA = -110, zB = 104, W = 96;
  for (const z of [zA, zB]) {
    const y0 = z > 0 ? -200 : terrainHeight(x, z) - 10;
    add(new THREE.BoxGeometry(W, H - y0, W), mat, x, (H + y0) / 2, z);
    add(new THREE.BoxGeometry(W + 16, 14, W + 16), matD, x, y0 + 7 + (z > 0 ? 150 : 0), z);
    for (let k = 0; k < 6; k++) add(new THREE.BoxGeometry(W + 6, 3, W + 6), matD, x, H - 60 - k * 70, z); // banding
  }
  const span = zB - zA + W + 40;
  add(new THREE.BoxGeometry(W + 20, 60, span), mat, x, H + 30, (zA + zB) / 2);
  add(new THREE.BoxGeometry(W + 32, 10, span + 14), matD, x, H + 65, (zA + zB) / 2);
  add(new THREE.BoxGeometry(W - 8, 40, span * 0.55), mat, x, H + 90, (zA + zB) / 2);
  add(new THREE.BoxGeometry(W - 20, 26, span * 0.25), mat, x, H + 123, (zA + zB) / 2);
  // inner frame (smaller portal inside the big one)
  add(new THREE.BoxGeometry(18, 210, 18), matD, x + 10, 105, -40); add(new THREE.BoxGeometry(18, 210, 18), matD, x + 10, 105, 40);
  add(new THREE.BoxGeometry(22, 18, 104), matD, x + 10, 219, 0);
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
