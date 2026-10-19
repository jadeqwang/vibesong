// CREATURES: factories for the bugs, their features, the voxel morph, the graphite draft and the sculpted Eraser.
// See engine/WORLD_API.md "Creatures" for the scene-facing API.
//
//   import { makeBug, makeFeature, makeMorph, makeDraft, makeEraser, BUG_NAMES, FEATURE_OF } from '../../core/creatures/index.js';
//   const lb = makeBug('ladybug');                 // THREE.Group, origin = feet centre, face toward +x
//   lb.set({ anim: 'dance', t, beat });            // 'idle' | 'dance' | 'bug' (+ per-bug params, see bugs.js / below)
//   const bt = makeFeature('button');              // same voxel COUNT as the ladybug, same eyes
//   const mo = makeMorph('ladybug');               // owns its own bug + feature; mo.set({ u, t, to: [x,y,z], from: state | liveBug })
//   makeBug(name, { stance: 'upright' }) / set({ stance }) : stand on the hind legs (round 2)
//   const dr = makeDraft('caterpillar');           // graphite outline; dr.set({ p: 0..1 reveal, fill: 0..1 })
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { voxelizeSpec, coreCells, fitCount, makeMaterials, buildRig, resetRig } from './vox.js';
import { SPECS, ANIMS, BUG_NAMES } from './bugs.js';
import { FSPECS, FEATURE_OF, BUG_OF } from './features.js';
import { FANIMS, commonAnim } from './feature_anims.js';
import { buildMorph, buildDraft } from './morph.js';
import { applyStance, STANCES } from './stance.js';
export { STANCES };
export { makeEraser, ERASER_COLORS } from './eraser.js';
export { BUG_NAMES, FEATURE_OF, BUG_OF };

/** default voxel size (world units). Heroes are ~44-50 units tall, so a 48-voxel bug is ~21.6 units long (k09 proportion). */
export const VOXEL = 0.45;
export const FEATURE_NAMES = BUG_NAMES.map((b) => FEATURE_OF[b]);
const SEED = { ladybug: 1, beetle: 2, moth: 3, caterpillar: 4, firefly: 5, button: 1, wheel: 2, glider: 3, bridge: 4, lamp: 5 };

const _vox = new Map(); export const STATS = {};
/** canonical voxel set of a bug (cached) */
export function bugVox(name) {
  if (!_vox.has(name)) { const t0 = performance.now(); const v = voxelizeSpec(SPECS[name]()); v.core = coreCells(v); v.k = 1; _vox.set(name, v);
    STATS[name] = { voxels: v.core.length, ms: Math.round(performance.now() - t0), ...extent(v.core) }; }
  return _vox.get(name);
}
/** canonical voxel set of a feature, count-matched EXACTLY to its bug (size search on k, then interior trim / pad) */
export function featureVox(fname) {
  if (_vox.has(fname)) return _vox.get(fname);
  const t0 = performance.now(); const N = bugVox(BUG_OF[fname]).core.length; const spec = FSPECS[fname];
  const count = (k) => coreCells(voxelizeSpec(spec(k))).length;
  let lo = 0.6, hi = 1.0; let ch = count(hi); let it = 0;
  while (ch < N && it++ < 12) { lo = hi; hi *= 1.15; ch = count(hi); }
  for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (count(m) >= N) hi = m; else lo = m; }
  const v = voxelizeSpec(spec(hi)); const before = coreCells(v).length; fitCount(v, N); v.k = hi;
  _vox.set(fname, v); STATS[fname] = { voxels: v.core.length, before, k: +hi.toFixed(4), trimmed: v.trimmed || 0, trimMinDepth: v.trimMinDepth ?? null, padded: v.padded || 0, ms: Math.round(performance.now() - t0), ...extent(v.core) };
  return v;
}
function extent(cells) { const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (const c of cells) { b[0] = Math.min(b[0], c.x); b[1] = Math.min(b[1], c.y); b[2] = Math.min(b[2], c.z); b[3] = Math.max(b[3], c.x); b[4] = Math.max(b[4], c.y); b[5] = Math.max(b[5], c.z); }
  return { lenX: b[3] - b[0] + 1, lenY: b[4] - b[1] + 1, lenZ: b[5] - b[2] + 1 }; }

export function beatOf(t) { try { const b = T.beatAt(t); if (Number.isFinite(b)) return b; } catch (e) { /* timing not loaded */ } return t * 2; }

function assemble(name, vox, anims, kind, { s = VOXEL, onMaterial, light = false, stance: stance0 = 'crawl' } = {}) {
  const materials = makeMaterials({ onMaterial }); const rig = buildRig(vox, { s, materials });
  const group = new THREE.Group(); group.name = name; const inner = new THREE.Group(); inner.name = name + '_root'; group.add(inner); inner.add(rig.root);
  const J = { ...rig.J, root: inner }; const U = {};
  const pivots = Object.fromEntries(vox.parts.map((p) => [p.name, p.pivot || [0, 0, 0]]));
  if (light) { const glowPart = vox.parts.find((p) => p.mat === 'glow'); const L = new THREE.PointLight('#ffd86a', 1, 60 * s / 0.45, 1.6); L.castShadow = false;
    (J[glowPart.name] || inner).add(L); U.light = L; }
  group.userData = { kind, name, s, vox, J, U, rig, materials, N: vox.core.length, seed: SEED[name] || 0, stance: stance0, state: {} };
  group.set = (o = {}) => {
    resetRig(rig); inner.position.set(0, 0, 0); inner.rotation.set(0, 0, 0); inner.scale.set(1, 1, 1);
    U.flash = undefined; U.bonk = 0; U.glow = undefined;
    const t = o.t ?? 0; const b = o.beat ?? beatOf(t); const mode = o.anim || 'idle';
    anims.common?.(J, t, s, { ...o, seed: SEED[name] || 0 });
    anims[name](J, t, b, mode, s, { ...o, seed: SEED[name] || 0 }, U);
    const stance = o.stance ?? stance0; U.stance = stance;
    if (kind === 'bug' && stance === 'upright') applyStance(name, J, rig.rest, s, o, b, mode, pivots);
    group.userData.state = { ...o, t, beat: b, anim: mode, stance };
    return group;
  };
  group.set({});
  return group;
}

/** a bug: makeBug(name, { s, onMaterial(mat), light, stance: 'crawl'|'upright' (default for set(); set({ stance }) overrides) }) */
export function makeBug(name, opts = {}) { return assemble(name, bugVox(name), { ...ANIMS, common: commonAnim }, 'bug', opts); }
/** a feature, by feature name ('lamp'|'glider'|'wheel'|'bridge'|'button') or by its bug's name */
export function makeFeature(name, opts = {}) { const f = FEATURE_OF[name] || name; return assemble(f, featureVox(f), { ...FANIMS, common: commonAnim }, 'feature', opts); }
/** bug -> feature morph (owns a bug and a feature instance). opts: { s, arc, spin, stagger, onMaterial } */
export function makeMorph(bugName, opts = {}) { const b = makeBug(bugName, opts), f = makeFeature(bugName, opts); return buildMorph(b, f, opts); }
/** graphite draft of a bug (or a feature by name), posable like the creature. opts: { s, stance, color, width (px), resolution: [w, h], concave }
 *  set({ p, fill, opacity, resolution, anim, t, beat, stance, ... }) */
export function makeDraft(name, opts = {}) { const g = SPECS[name] ? makeBug(name, opts) : makeFeature(name, opts); return buildDraft(g, opts); }
