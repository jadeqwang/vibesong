// BUG -> FEATURE voxel morph and the graphite DRAFT.
//   makeMorph(bug, opts) -> Group with .set({ u, t, beat, anim, to })   u in 0..1 (pure function of time; scene owns the clock)
//     u <= 0: the bug model, u >= 1: the feature model, between: N instanced voxels flying from bug slot to feature slot.
//     Pairing: both voxel sets sorted along the stroke-order axis (x, left -> right), chunked, then top -> bottom inside a chunk.
//     Each voxel: staggered start in stroke order, eased flight on an arc, integer spin turns (lands square), shrinks in
//     flight, colour lerps; glowing voxels (firefly tail / lamp bulb) carry their glow.
//   makeDraft(bug, opts) -> Group with .set({ p, fill })  pencil-gray outline-only render (creases + colour boundaries),
//     p = 0..1 reveal in stroke order (Jade sketching it), fill = optional paper-white body behind the lines.
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { meshVoxelGrid } from '../../voxel.js';
import { hash3, mulberry, clamp01, sstep } from './vox.js';

const easeIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** pair two equal-length cell lists in stroke order. Returns index array P: bug cell i -> feature cell P[i], and rank[i] (0..1) */
export function strokePair(A, B, K = 28) {
  const N = A.length; if (B.length !== N) throw new Error(`morph: voxel counts differ ${N} vs ${B.length}`);
  const norm = (L) => { let b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (const c of L) { b[0] = Math.min(b[0], c.x); b[1] = Math.min(b[1], c.y); b[2] = Math.min(b[2], c.z); b[3] = Math.max(b[3], c.x); b[4] = Math.max(b[4], c.y); b[5] = Math.max(b[5], c.z); }
    return L.map((c, i) => ({ i, x: (c.x - b[0]) / (b[3] - b[0] + 1), y: (c.y - b[1]) / (b[4] - b[1] + 1), z: (c.z - b[2]) / (b[5] - b[2] + 1), h: hash3(c.x, c.y, c.z) })); };
  const order = (L) => { const s = norm(L).sort((a, b) => a.x - b.x || a.h - b.h); const out = [];
    for (let g = 0; g < K; g++) { const ch = s.slice(Math.floor(g * N / K), Math.floor((g + 1) * N / K)); ch.sort((a, b) => b.y - a.y || a.z - b.z || a.h - b.h); out.push(...ch); } return out.map((o) => o.i); };
  const oa = order(A), ob = order(B); const P = new Int32Array(N), rank = new Float32Array(N);
  for (let r = 0; r < N; r++) { P[oa[r]] = ob[r]; rank[oa[r]] = r / Math.max(1, N - 1); }
  return { P, rank };
}

/** per-cell soft AO factor from the 26-neighbourhood (instanced cubes have no baked AO) */
function aoFactors(cells) {
  const S = new Set(cells.map((c) => c.x + ',' + c.y + ',' + c.z)); const f = new Float32Array(cells.length);
  cells.forEach((c, i) => { let n = 0; for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy || dz) && S.has((c.x + dx) + ',' + (c.y + dy) + ',' + (c.z + dz))) n++;
    f[i] = 1 - 0.32 * clamp01((n - 14) / 12) + 0.04 * clamp01((12 - n) / 6); });
  return f;
}

/**
 * makeMorph(bugGroup, featureGroup, opts): both groups come from makeBug / makeFeature with the same s (index.js wraps this).
 * opts: { s, arc = 1, spin = 1, stagger = 0.45, dur = 0.55 }
 */
export function buildMorph(bug, feat, { arc = 1, spin = 1, stagger = 0.45, onMaterial } = {}) {
  const s = bug.userData.s; const A = bug.userData.vox.core, B = feat.userData.vox.core; const N = A.length;
  const { P, rank } = strokePair(A, B);
  const glowA = bug.userData.vox.parts.map((p) => p.mat === 'glow'), glowB = feat.userData.vox.parts.map((p) => p.mat === 'glow');
  const aoA = aoFactors(A), aoB = aoFactors(B);
  const geo = new THREE.BoxGeometry(s * 0.98, s * 0.98, s * 0.98);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0 }); mat.userData.noPaint = true;
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aGlow; varying float vGlow;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = aGlow;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGlow;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * vGlow * 2.2;');
  };
  if (onMaterial) onMaterial(mat);
  const mesh = new THREE.InstancedMesh(geo, mat, N); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.userData.noPaint = true;
  const aGlow = new THREE.InstancedBufferAttribute(new Float32Array(N), 1); aGlow.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aGlow', aGlow);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.setColorAt(0, new THREE.Color()); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  // per-voxel constants
  const R = mulberry(1234); const D = new Float32Array(N), H = new Float32Array(N), AX = new Float32Array(N * 3), TURN = new Float32Array(N), SW = new Float32Array(N);
  const SRGB = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const CA = new Float32Array(N * 3), CB = new Float32Array(N * 3), PA = new Float32Array(N * 3), PB = new Float32Array(N * 3), GA = new Float32Array(N), GB = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = A[i], b = B[P[i]];
    PA[i * 3] = (a.x + 0.5) * s; PA[i * 3 + 1] = (a.y + 0.5) * s; PA[i * 3 + 2] = (a.z + 0.5) * s;
    PB[i * 3] = (b.x + 0.5) * s; PB[i * 3 + 1] = (b.y + 0.5) * s; PB[i * 3 + 2] = (b.z + 0.5) * s;
    for (let k = 0; k < 3; k++) { CA[i * 3 + k] = SRGB(a.c[k]) * aoA[i]; CB[i * 3 + k] = SRGB(b.c[k]) * aoB[P[i]]; }
    GA[i] = glowA[a.p] ? 1 : 0; GB[i] = glowB[b.p] ? 1 : 0;
    D[i] = stagger * rank[i] + 0.05 * R();
    const dist = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z); H[i] = (3 + 0.32 * dist + 5 * R()) * s * arc;
    const ax = new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize(); AX.set([ax.x, ax.y, ax.z], i * 3);
    TURN[i] = spin * (1 + Math.floor(R() * 2)) * Math.PI * 2 * (R() < 0.5 ? -1 : 1); SW[i] = (R() - 0.5) * 2;
  }
  const dur = 1 - stagger - 0.05;
  // live-pose sampling: each voxel's position comes from its part's joint (local cell centre -> morph-group space), so
  // the flight starts from the bug's CURRENT pose (dance / stance / bug loop) and lands on the feature's current pose.
  const locals = (cells, vox, pick) => { const L = new Float32Array(cells.length * 3), PI = new Int16Array(cells.length);
    cells.forEach((c, n) => { const i = pick ? pick[n] : n; const cc = cells[i]; const pv = vox.parts[cc.p].pivot || [0, 0, 0];
      L[n * 3] = (cc.x + 0.5 - pv[0]) * s; L[n * 3 + 1] = (cc.y + 0.5 - pv[1]) * s; L[n * 3 + 2] = (cc.z + 0.5 - pv[2]) * s; PI[n] = cc.p; }); return { L, PI }; };
  const LA = locals(A, bug.userData.vox), LB = locals(B, feat.userData.vox, P);   // LB is indexed like A (pairing applied)
  const inv = new THREE.Matrix4(), PM = [], tmp = new THREE.Matrix4();
  const sample = (src, vox, { L, PI }, out) => {
    src.updateWorldMatrix(true, true); const J = src.userData.J;
    vox.parts.forEach((pt, k) => { PM[k] = J[pt.name] ? tmp.copy(inv).multiply(J[pt.name].matrixWorld).clone() : null; });
    for (let n = 0; n < N; n++) { const M = PM[PI[n]]; if (!M) continue; const e = M.elements, x = L[n * 3], y = L[n * 3 + 1], z = L[n * 3 + 2];
      out[n * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; out[n * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; out[n * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14]; }
  };
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), axis = new THREE.Vector3();
  const group = new THREE.Group(); group.add(mesh); const to = new THREE.Vector3();
  bug.visible = false; feat.visible = false; group.add(bug); group.add(feat);
  group.userData = { N, bug, feature: feat, mesh, s, P };
  /** u 0..1 · from: a state object for the internal bug ({ anim, t, beat, stance, ... }) OR a live bug Group of the same
   *  kind (the scene's own dancing bug: the morph then never draws its internal bug; hide yours once u > 0) ·
   *  featureState: state for the landing feature · to: feature offset (world units, morph-group space) */
  group.set = ({ u = 0, t = 0, beat, anim, bugAnim, featureAnim, stance, from, featureState, to: toOff } = {}) => {
    to.set(0, 0, 0); if (toOff) to.set(toOff[0] ?? toOff.x ?? 0, toOff[1] ?? toOff.y ?? 0, toOff[2] ?? toOff.z ?? 0);
    const live = from && from.isObject3D; const bState = live ? null : { anim: bugAnim || anim || 'idle', t, beat, stance, ...(from || {}) };
    const fState = { anim: featureAnim || anim || 'idle', t, beat, ...(featureState || {}) };
    bug.visible = !live && u <= 0; feat.visible = u >= 1; mesh.visible = u > 0 && u < 1;
    if (!live) bug.set(bState);
    feat.position.copy(to); feat.set(fState);
    if (!mesh.visible) return group;
    group.updateWorldMatrix(true, false); inv.copy(group.matrixWorld).invert();
    sample(live ? from : bug, bug.userData.vox, LA, PA); sample(feat, feat.userData.vox, LB, PB);
    const ia = mesh.instanceMatrix.array, ic = mesh.instanceColor.array, ig = aGlow.array;
    for (let i = 0; i < N; i++) {
      const e0 = clamp01((u - D[i]) / dur); const e = easeIO(e0); const sn = Math.sin(Math.PI * e);
      const i3 = i * 3;
      p.set(PA[i3] + (PB[i3] - PA[i3]) * e, PA[i3 + 1] + (PB[i3 + 1] - PA[i3 + 1]) * e + H[i] * sn, PA[i3 + 2] + (PB[i3 + 2] - PA[i3 + 2]) * e + SW[i] * H[i] * 0.35 * sn);
      axis.set(AX[i3], AX[i3 + 1], AX[i3 + 2]); q.setFromAxisAngle(axis, TURN[i] * e); const k = 1 - 0.32 * sn; sc.set(k, k, k);
      m4.compose(p, q, sc); m4.toArray(ia, i * 16);
      const c = sstep(0.3, 0.75, e0); ic[i3] = CA[i3] + (CB[i3] - CA[i3]) * c; ic[i3 + 1] = CA[i3 + 1] + (CB[i3 + 1] - CA[i3 + 1]) * c; ic[i3 + 2] = CA[i3 + 2] + (CB[i3 + 2] - CA[i3 + 2]) * c;
      ig[i] = GA[i] + (GB[i] - GA[i]) * c;
    }
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; aGlow.needsUpdate = true;
    return group;
  };
  group.set({ u: 0 });
  return group;
}

// ------------------------------------------------------------------------------------------------ graphite draft
/** outline-only pencil render, POSABLE (round 2): lines are built per rig part (creases + colour boundaries inside the part,
 *  outlines where parts meet) and parented to the part's joint of a hidden copy of the creature, whose meshes become the
 *  depth-only occluder. set({ p, fill, opacity, resolution, anim, t, beat, stance, ... }) poses it like the creature. */
export function buildDraft(rigGroup, { color = '#55545c', width = 1.6, resolution = [1920, 1080], jitter = 0.1, concave = false, onMaterial } = {}) {
  const vox = rigGroup.userData.vox, s = rigGroup.userData.s, J = rigGroup.userData.J;
  const coreSet = new Set(vox.core);
  const byPart = vox.parts.map(() => []); for (const c of vox.cells) if (coreSet.has(c)) byPart[c.p].push(c);
  const R = mulberry(77); const all = [];
  byPart.forEach((cells, pi) => { if (!cells.length) return;
    const key = (x, y, z) => x + ',' + y + ',' + z; const M = new Map(cells.map((c) => [key(c.x, c.y, c.z), c])); const at = (x, y, z) => M.get(key(x, y, z));
    const grp = (c) => c.c[0] * 65536 + c.c[1] * 256 + c.c[2]; const segs = new Map();
    for (const c of cells) for (let a = 0; a < 3; a++) for (const sg of [-1, 1]) {
      const n = [0, 0, 0]; n[a] = sg; if (at(c.x + n[0], c.y + n[1], c.z + n[2])) continue;
      for (let eb = 1; eb <= 2; eb++) { const b = (a + eb) % 3; const e = 3 - a - b;
        for (const sb of [-1, 1]) {
          const d = [0, 0, 0]; d[b] = sb; const nb = at(c.x + d[0], c.y + d[1], c.z + d[2]); let draw;
          if (!nb) draw = true; else if (at(c.x + d[0] + n[0], c.y + d[1] + n[1], c.z + d[2] + n[2])) draw = concave; else draw = grp(nb) !== grp(c);
          if (!draw) continue;
          const p0 = [c.x, c.y, c.z], p1 = [c.x, c.y, c.z]; p0[a] += sg > 0 ? 1 : 0; p1[a] = p0[a]; p0[b] += sb > 0 ? 1 : 0; p1[b] = p0[b]; p1[e] += 1;
          const k = p0.join(',') + '|' + p1.join(','); if (!segs.has(k)) segs.set(k, [p0, p1, e]);
        } }
    }
    const byLine = new Map(); for (const [p0, , e] of segs.values()) { const k = e + ':' + p0.filter((_, i) => i !== e).join(','); if (!byLine.has(k)) byLine.set(k, []); byLine.get(k).push(p0[e]); }
    for (const [k, list] of byLine) { const e = +k[0]; const fix = k.slice(2).split(',').map(Number); list.sort((x, y) => x - y);
      let st = list[0], pr = list[0]; const flush = () => { const a0 = [0, 0, 0], a1 = [0, 0, 0]; let fi = 0; for (let i = 0; i < 3; i++) { if (i === e) { a0[i] = st; a1[i] = pr + 1; } else { a0[i] = a1[i] = fix[fi++]; } } all.push({ a0, a1, pi }); };
      for (let i = 1; i < list.length; i++) { if (list[i] === pr + 1) { pr = list[i]; continue; } flush(); st = pr = list[i]; } flush(); }
  });
  // global stroke order (rest pose): left -> right, then top -> bottom
  all.sort((r1, r2) => (Math.min(r1.a0[0], r1.a1[0]) - Math.min(r2.a0[0], r2.a1[0])) || (Math.max(r2.a0[1], r2.a1[1]) - Math.max(r1.a0[1], r1.a1[1])));
  const fronts = all.map((r) => Math.max(r.a0[0], r.a1[0]) * s); for (let i = 1; i < fronts.length; i++) fronts[i] = Math.max(fronts[i], fronts[i - 1]);
  const lm = new LineMaterial({ color: new THREE.Color(color), linewidth: width, worldUnits: false, transparent: true, opacity: 0.95 }); lm.resolution.set(resolution[0], resolution[1]);
  const parts = vox.parts.map((pt, pi) => { const runs = all.map((r, gi) => ({ ...r, gi })).filter((r) => r.pi === pi); if (!runs.length) return null;
    const pv = pt.pivot || [0, 0, 0]; const pos = new Float32Array(runs.length * 6);
    runs.forEach(({ a0, a1 }, i) => { const over = 0.18; const dir = [a1[0] - a0[0], a1[1] - a0[1], a1[2] - a0[2]]; const L = Math.hypot(...dir) || 1;
      for (let k = 0; k < 3; k++) { pos[i * 6 + k] = (a0[k] - pv[k] - dir[k] / L * over + (R() - 0.5) * jitter) * s; pos[i * 6 + 3 + k] = (a1[k] - pv[k] + dir[k] / L * over + (R() - 0.5) * jitter) * s; } });
    const lg = new LineSegmentsGeometry(); lg.setPositions(pos); const ln = new LineSegments2(lg, lm); ln.renderOrder = 2; ln.frustumCulled = false; ln.userData.noAO = true;
    J[pt.name].add(ln); return { lg, gis: runs.map((r) => r.gi) }; });
  // occluder: the hidden creature's own meshes, depth only, clipped to the drawn front (rest x) so AO/DOF never ghost it
  const UF = { uFront: { value: 1e9 } };
  const om = new THREE.MeshBasicMaterial({ color: '#f3efe6', transparent: true, opacity: 0, colorWrite: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
  om.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, UF);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aRestX; varying float vLX;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLX = aRestX;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uFront; varying float vLX;').replace('void main() {', 'void main() {\n if (vLX > uFront) discard;'); };
  om.customProgramCacheKey = () => 'creatures_draft_occluder2';
  if (onMaterial) onMaterial(om);
  rigGroup.traverse((m) => { if (!m.isMesh || m.isLineSegments2 || !m.geometry?.attributes?.position) return; if (m instanceof LineSegments2) return;
    const pt = vox.parts.find((q) => q.name + '_mesh' === m.name); const px = ((pt?.pivot || [0, 0, 0])[0]) * s; const P = m.geometry.attributes.position;
    const rx = new Float32Array(P.count); for (let i = 0; i < P.count; i++) rx[i] = P.getX(i) + px; m.geometry.setAttribute('aRestX', new THREE.BufferAttribute(rx, 1));
    m.material = om; m.castShadow = false; m.receiveShadow = false; m.renderOrder = 1; m.userData.noAO = true; });
  const group = rigGroup; const animSet = rigGroup.set;
  group.userData.segments = all.length; group.userData.lines = parts.filter(Boolean);
  group.set = ({ p = 1, fill = 0, opacity = 0.95, resolution: res, ...pose } = {}) => {
    animSet(pose);
    const nI = Math.round(clamp01(p) * all.length);
    for (const pr of parts) { if (!pr) continue; let c = 0; while (c < pr.gis.length && pr.gis[c] < nI) c++; pr.lg.instanceCount = c; }
    lm.opacity = opacity; om.colorWrite = fill > 0; om.opacity = fill; om.depthWrite = true;
    UF.uFront.value = p >= 1 ? 1e9 : nI ? fronts[nI - 1] : -1e9;
    rigGroup.traverse((m) => { if (m.isMesh && m.material === om) m.visible = nI > 0 && m.parent.visible; });
    if (res) lm.resolution.set(res[0], res[1]);
    return group;
  };
  group.set({});
  return group;
}
