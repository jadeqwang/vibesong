// ACT III · BATTLE CAST ADAPTER: the ONE place the battle scene (battle.js) touches bugs and features.
// Backend: the CREATURES module (src/core/creatures, WORLD_API.md "Creatures"): one makeMorph(bug) per bug (its own bug +
// feature + the voxel flight between them) and makeDraft(bug) for the triple tech's graphite drafts. The old sprite bugs
// (W.bugs) stay hidden (W.reset()).
//
//   const cast = getCast(W, ctx)            shared per world (the battle entries and Act IV's handover use the same models)
//   cast.getBug(name)                       -> { group, height }
//   cast.setBugState(name, s)               s = { x, y, z (origin = feet / base centre), facing (+1 = face +x, toward the
//                                                 party), rotY (added yaw; θ turns the face to (cos θ, 0, -sin θ)), t,
//                                                 pose: 'idle' | 'dance' | 'bug' | 'feature' (feature anim: 'idle'),
//                                                 u: 0 bug .. 1 feature (the voxel morph), draft: 0/1 show the graphite
//                                                 draft (draftP = 0..1 stroke-order reveal, the bug hides once p = 1),
//                                                 paint: 0..1 (< 1 = plaster + coloured-pencil hatching on the bug),
//                                                 scale, stance (default STANCE = 'upright'), wingTint { k, hue },
//                                                 bug params: blink, glow, flash, overflow; feature params: roll, glow,
//                                                 press, bank, flap; visible,
//                                                 (r5) glitch: 0..1 (the body flickers to the missing-texture checkerboard on a
//                                                 deterministic fraction of frames: the diegetic "buggy" state; 0 = fixed, solid),
//                                                 glitchSync: hash seed shared by the row (synchronized flicker), silhouette: 0/1
//                                                 (the whole bug flat white: the conversion card's hit-stop flash) }
//   cast.setRider(s)                        (r5) the small ladybug riding Charlie's cap in the encounter: s = { visible, x, y, z,
//                                                 rotY, t, scale } (origin = its feet; crawl stance; ~0.3 x the battle scale)
//   cast.anchor(name, out)                  -> world point just above the creature (battle UI tags)
//   cast.show() / cast.hide()               the models are NOT part of W.reset(): show them only while rendering
//   cast.end()                              restore per-frame material state (after render)
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { makeMorph, makeDraft, makeBug, BUG_NAMES, FEATURE_OF, VOXEL } from '../../core/creatures/index.js';
import { patchPaint } from './world/paint.js';

export { BUG_NAMES, FEATURE_OF };
/** creature scale in the battle: 2.0x the module default (upright bugs ~25 units: knee-to-waist next to the ~69-unit native heroes)  */
export const CAST_S = VOXEL * 2.0;
/** bug stance: 'upright' (creatures round 2, WORLD_API "Creatures round 2 additions"); 'crawl' = round 1 */
export const STANCE = 'upright';
const DRAFTED = ['ladybug', 'caterpillar'];

function heightOf(obj) { const b = new THREE.Box3().setFromObject(obj); return Number.isFinite(b.max.y) ? b.max.y - Math.min(0, b.min.y) : 20; }
/** (r5) the missing-texture checkerboard as a body material: unlit magenta / near-black cells in each part's local space (2 voxels
 *  per cell, so the pattern sticks to the body while it animates). Same colours as battle_fx's floor checker. */
function checkerMat(cell) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uCell: { value: cell }, uA: { value: new THREE.Color('#b028c8') }, uB: { value: new THREE.Color('#120814') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uCell; uniform vec3 uA; uniform vec3 uB; varying vec3 vP;
      void main(){ vec3 c = floor((vP + 0.5 * uCell) / uCell); float k = mod(c.x + c.y + c.z, 2.0);
        gl_FragColor = vec4(mix(uB, uA, k), 1.0); }`,
    toneMapped: false });
  m.userData.noPaint = true; return m;
}
const hash = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

export function getCast(W, ctx) {
  if (W._battleCast) return W._battleCast;
  const onMaterial = (m) => patchPaint(m, { noPaint: true, hero: true });
  const root = new THREE.Group(); root.name = 'battle_cast'; root.visible = false; W.scene.add(root);
  const C = {};
  for (const n of BUG_NAMES) {
    const g = new THREE.Group(); g.name = 'cast_' + n; root.add(g);
    const mo = makeMorph(n, { s: CAST_S, onMaterial }); g.add(mo);
    const bug = mo.userData.bug, feat = mo.userData.feature;
    bug.set({ stance: STANCE }); feat.set({});
    const hB = heightOf(bug), hF = heightOf(feat); bug.visible = false; feat.visible = false;
    let draft = null;
    // (no onMaterial for the draft: its occluder is a MeshBasicMaterial and the hero paint patch needs lit normals)
    if (DRAFTED.includes(n)) { draft = makeDraft(n, { s: CAST_S, stance: STANCE, resolution: [ctx.width, ctx.height], width: Math.max(1.6, ctx.height / 540 * 1.4) }); draft.visible = false; g.add(draft); }
    const mats = Object.values(bug.userData.materials || {});
    // the wing meshes (they share the body's material): a tintable copy for the moth's flower colours
    const wings = []; bug.traverse((o) => { if (o.isMesh && /wing/i.test(o.name)) wings.push(o); });
    let wingMat = null; if (wings.length) { wingMat = wings[0].material.clone(); delete wingMat.userData.lp; patchPaint(wingMat, { noPaint: true, hero: true }); }
    const meshes = []; bug.traverse((o) => { if (o.isMesh) meshes.push(o); });
    C[n] = { g, mo, bug, feat, draft, hB, hF, mats, wings, wingMat, meshes };
  }
  // (r5) glitch / silhouette materials (shared), and the cap-riding ladybug of the encounter (built lazily: r5 only)
  const glitchMat = checkerMat(CAST_S * 2), silMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); silMat.userData.noPaint = true;
  let rider = null;
  const touched = new Set(), tinted = new Map(); const last = {};
  const cast = {
    root, C,
    getBug(name) { return { group: C[name].g, height: last[name] ?? C[name].hB }; },
    setBugState(name, s = {}) {
      const c = C[name]; const g = c.g;
      if (s.visible === false) { g.visible = false; last[name] = null; return g; }
      g.visible = true; g.position.set(s.x, s.y, s.z);
      g.rotation.set(0, (s.rotY ?? 0) + ((s.facing ?? 1) < 0 ? Math.PI : 0), 0);
      g.scale.setScalar(s.scale ?? 1);
      const t = s.t ?? 0, beat = T.beatAt(t); const u = s.u ?? 0;
      const drafting = (s.draft ?? 0) > 0 && u <= 0; const p = s.draftP ?? 1;
      const bugAnim = s.pose === 'bug' ? 'bug' : s.pose === 'dance' ? 'dance' : 'idle';
      c.mo.visible = !(drafting && p >= 1);
      const stance = s.stance || STANCE;
      c.mo.set({ u, t, beat, bugAnim, featureAnim: 'idle', stance, from: { anim: bugAnim, t, beat, stance } });
      const bp = { anim: bugAnim, t, beat, stance };
      for (const k of ['blink', 'glow', 'flash', 'overflow', 'ringR']) if (s[k] !== undefined) bp[k] = s[k];
      if (u <= 0) c.bug.set(bp);
      if (u >= 1) { const fp = { anim: 'idle', t, beat }; for (const k of ['roll', 'glow', 'press', 'bank', 'flap', 'dist']) if (s[k] !== undefined) fp[k] = s[k]; c.feat.set(fp); }
      if (c.draft) { c.draft.visible = drafting; if (drafting) c.draft.set({ p, fill: s.silhouette ? 1 : 0, opacity: 0.95, anim: 'idle', t, beat, stance }); }   // (r5) fill = the hit-stop's white silhouette
      // colouring (the moth's wings): plaster + hatching on the bug's own materials, restored in end()
      const paint = s.paint ?? 1;
      if (paint < 1 && u < 1) for (const m of c.mats) { const lp = m.userData.lp; if (!lp) continue; touched.add(m); lp.U.uNoPaint.value = 0; lp.all(Math.max(0, paint)); }
      // wing tint (the moth's wings take the flower colours): the bug's wing material, restored in end()
      if (s.wingTint && u < 1 && c.wings.length) {
        c.wingMat.color.set(0xffffff).lerp(new THREE.Color().setHSL(((s.wingTint.hue % 1) + 1) % 1, 0.85, 0.72), 0.75 * s.wingTint.k);
        for (const m of c.wings) { if (!tinted.has(m)) tinted.set(m, m.material); m.material = c.wingMat; } }
      // (r5) diegetic state: the buggy body flickers to the missing-texture checkerboard on a deterministic fraction of frames
      //      (per-frame hash, seeded per bug unless the row flickers in sync); the hit-stop silhouette flashes it flat white
      if (s.silhouette) { for (const m of c.meshes) { if (!tinted.has(m)) tinted.set(m, m.material); m.material = silMat; } }
      else if ((s.glitch ?? 0) > 0 && u < 1) {
        const f = Math.round(t * T.fps()); const seed = s.glitchSync ?? (BUG_NAMES.indexOf(name) + 1) * 17;
        const all = hash(f, seed) < s.glitch;                                          // whole body: glitch = the duty cycle (frames)
        for (const m of c.meshes) { const mi = c.meshes.indexOf(m);
          if (all || hash(f + mi * 31, seed + 3) < s.glitch * 0.4) { if (!tinted.has(m)) tinted.set(m, m.material); m.material = glitchMat; } }   // + single parts
      }
      last[name] = (u >= 0.5 ? c.hF : c.hB) * (s.scale ?? 1);
      return g;
    },
    /** (r5) the small ladybug on Charlie's cap (crawl stance); hidden unless s.visible */
    setRider(s = {}) {
      if (!rider) { rider = makeBug('ladybug', { s: CAST_S * 0.3, onMaterial, stance: 'crawl' }); rider.name = 'cast_rider'; rider.visible = false; root.add(rider); }
      if (!s.visible) { rider.visible = false; return rider; }
      rider.visible = true; rider.position.set(s.x, s.y, s.z); rider.rotation.set(0, s.rotY ?? 0, 0); rider.scale.setScalar(s.scale ?? 1);
      const t = s.t ?? 0; rider.set({ anim: s.anim || 'idle', t, beat: T.beatAt(t), stance: 'crawl' });
      return rider;
    },
    anchor(name, out = new THREE.Vector3()) { const g = C[name].g; return out.set(g.position.x, g.position.y + (last[name] ?? C[name].hB) + 3, g.position.z); },
    show() { root.visible = true; },
    // hide the children too: act4/world4 captures every top-level scene group as a 'baseObj' and re-shows the roots itself
    hide() { root.visible = false; for (const c of Object.values(C)) c.g.visible = false; if (rider) rider.visible = false; },
    end() { for (const m of touched) { const lp = m.userData.lp; lp.U.uNoPaint.value = 1; lp.all(0); } touched.clear();
      for (const [m, mat] of tinted) m.material = mat; tinted.clear(); },
  };
  W._battleCast = cast;
  return cast;
}
