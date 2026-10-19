// LOOK_R5 column density (round 5, look_r5 unit; only built with --look k08b --r5): the design rule is "at most three columns
// in frame", the sets have ten. Every known column of the shared world is registered here (world coordinates, replayed from
// the same seeded RNGs the builders use, so nothing in the sets is rebuilt or moved) and a scene can cull any subset per shot:
//   r5Shot({ columns: { keep: ['A4', 'A5'] } })   (see checkpoints/look_r5.md "API"; W.r5.columnsInView(camera) lists ids in frame)
// Culling is a fragment discard inside each column's cylinder (paint.js R5_CULL_GLSL, on every stone material and on the shadow
// depth material): the column and its shadow go, the entablature over it stays (a lone architrave over a gap reads as a ruin).
// Deterministic: the uniforms are a pure function of the selection; nothing is cached between frames.
import * as THREE from 'three';
import { columnGeo, terrainHeight } from '../../../world.js';
import { mulberry32 } from '../../../util.js';
import { K8M } from './paint.js';

export const R5_CULL_MAX = 64;

export function buildR5Columns({ MESA_B, SEA_Y }) {
  const C = {};
  const add = (id, set, x, y, z, top, r) => { C[id] = { id, set, x, y, z, top, r }; };
  const topOf = (o) => { const { geo, top } = columnGeo(o); geo.dispose(); return top; };
  // --- the prototype colonnade (src/world.js makeRuins, seed 3; the mirror group maps proto x -> world -x). Same RNG order.
  { const seed = 3, rnd = mulberry32(seed); const ground = (x, z) => terrainHeight(x, z);
    const rows = [{ z: -78, x0: -300, x1: -1250, step: 74 }, { z: -170, x0: -330, x1: -1200, step: 74 }];
    rows.forEach((row, ri) => {
      for (let x = row.x0, k = 0; x > row.x1; x -= row.step, k++) {
        const r = rnd(); if (r < 0.12 && k > 4) continue;
        const broken = (r < 0.38 && k > 4) ? 1 : 0; const h = 170 + ri * 10;
        const top = topOf({ h, r: 10, broken, seed: seed * 100 + k + ri * 50 });
        const px = x + (rnd() - 0.5) * 4, pz = row.z + (rnd() - 0.5) * 4, py = ground(x, row.z);
        if (broken && rnd() < 0.7) { rnd(); rnd(); rnd(); }   // the fallen drum beside it (x offset, yaw, z offset)
        add((ri ? 'B' : 'A') + k, ri ? 'B' : 'A', -px, py, pz, top, 10);
      }
    });
    // the great gate (two colossal columns)
    const gx = -1050, gz = -330, gy = ground(gx, gz);
    [-60, 60].forEach((dx, i) => add('G' + i, 'G', -(gx + dx), gy, gz, topOf({ h: 300, r: 18, seed: 900 + dx }), 18));
  }
  // --- mesa B's ruin columns + the arch behind the stage (props.js makeColumn: top = 11 + shaft (+ 12 if intact))
  { const mkTop = (h, broken, seed) => { const rnd = mulberry32(seed); const sh = broken ? h * (0.3 + 0.5 * rnd()) : h; return 11 + sh + (broken ? 0 : 12); };
    [[1130, 290, 150, 0], [1160, 382, 150, 0], [1112, 432, 120, 1], [1545, 520, 110, 1]].forEach(([x, z, h, br], i) => add('M' + i, 'M', x, MESA_B.top, z, mkTop(h, br, x + z), 9));
    const S = { x: 1360, z: 450 }; [[-38, 0], [38, 1]].forEach(([dx, i]) => add('R' + i, 'R', S.x + 95, MESA_B.top, S.z - 20 - dx, 11 + 110 + 12, 7));   // arch.rotation.y = PI/2: local +x -> world -z
  }
  // --- the stoa down the causeway (detail.js, mulberry32(91), x 1660..2480 step 42, z -96)
  { const z = -96, rs = mulberry32(91); const gY = (x, zz) => terrainHeight(-x, zz);
    for (let x = 1660, k = 0; x <= 2480; x += 42, k++) { const r = rs(); if (r < 0.1) continue; const broken = r < 0.3;
      add('S' + k, 'S', x, gY(x, z), z, topOf({ h: 150, r: 8.5, broken: broken ? 1 : 0, seed: 600 + k }), 8.5); }
  }
  // --- compose.js per-shot framing columns
  add('C88a', 'C', 640, SEA_Y - 10, 104, topOf({ h: 330, r: 12, broken: 0, seed: 1200 + 640 }), 12);
  add('C88b', 'C', 668, SEA_Y - 10, 130, topOf({ h: 250, r: 12, broken: 1, seed: 1200 + 668 }), 12);
  add('C101', 'C', 838, 10, 352, topOf({ h: 64, r: 8, broken: 1, seed: 1301 }), 8);
  add('C108', 'C', 1272, 10, 512, topOf({ h: 120, r: 8.5, seed: 1401 }), 8.5);

  const ids = Object.keys(C);
  const A = K8M.uR5CullA.value, H = K8M.uR5CullH.value;
  let lastKey = '';
  /** the list of column ids a `columns` selection culls (see the API table) */
  function cullIds(sel) {
    if (!sel) return [];
    const keep = new Set(sel.keep || []); let out = [];
    if (sel.thin > 1) { const sets = sel.sets || ['A', 'B', 'S']; for (const s of sets) ids.filter((id) => C[id].set === s).forEach((id, i) => { if (i % sel.thin !== 0) out.push(id); }); }
    else if (sel.keep || sel.all === false) out = ids.slice();
    if (sel.cull) out.push(...sel.cull);
    return [...new Set(out)].filter((id) => C[id] && !keep.has(id));
  }
  /** push this frame's selection into the cull uniforms (pure function of the selection; `zones` = extra cylinders [x, z, r, y0, h]) */
  function apply(sel, zones) {
    const list = cullIds(sel); const key = list.join(',') + '|' + (zones ? JSON.stringify(zones) : '');
    if (key === lastKey) return list; lastKey = key;
    let n = 0;
    for (const id of list) { if (n >= R5_CULL_MAX) break; const c = C[id]; A[n].set(c.x, c.y, c.z, c.r * 2); H[n] = c.top - 0.3; n++; }
    if (zones) for (const [x, z, r, y0, h] of zones) { if (n >= R5_CULL_MAX) break; A[n].set(x, y0, z, r); H[n] = h; n++; }
    K8M.uR5CullN.value = n;
    return list;
  }
  const _p = new THREE.Vector3();
  /** authoring aid: the registered columns inside the camera's frustum, nearest first ({ id, set, sx, sy, dist }; screen 0..1, y up) */
  function columnsInView(camera, { margin = 0.05 } = {}) {
    camera.updateMatrixWorld(); const cp = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld); const out = [];
    for (const id of ids) { const c = C[id]; _p.set(c.x, c.y + c.top * 0.5, c.z); const dist = _p.distanceTo(cp); _p.project(camera);
      if (_p.z > 1 || Math.abs(_p.x) > 1 + margin * 2 || Math.abs(_p.y) > 1 + margin * 2) continue;
      out.push({ id, set: c.set, sx: +(_p.x * 0.5 + 0.5).toFixed(3), sy: +(_p.y * 0.5 + 0.5).toFixed(3), dist: Math.round(dist) }); }
    return out.sort((a, b) => a.dist - b.dist);
  }
  return { columns: C, ids, cullIds, apply, columnsInView };
}
