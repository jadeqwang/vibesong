// Offline FK over a GLB skeleton + its animations (data only). World = glTF scene space (y up).
import * as THREE from 'three';
import { readGLB } from './glb.mjs';

export function loadMocap(path) {
  const { json, acc } = readGLB(path);
  const N = json.nodes, parent = new Array(N.length).fill(-1);
  N.forEach((n, i) => (n.children || []).forEach((c) => (parent[c] = i)));
  const byName = {}; N.forEach((n, i) => (byName[n.name] = i));
  const order = []; const seen = new Set(); const visit = (i) => { if (seen.has(i)) return; if (parent[i] >= 0) visit(parent[i]); seen.add(i); order.push(i); };
  N.forEach((_, i) => visit(i));
  const rest = N.map((n) => ({ t: new THREE.Vector3(...(n.translation || [0, 0, 0])), r: new THREE.Quaternion(...(n.rotation || [0, 0, 0, 1])), s: new THREE.Vector3(...(n.scale || [1, 1, 1])) }));
  const clips = {};
  for (const a of json.animations || []) {
    const ch = a.channels.map((c) => { const s = a.samplers[c.sampler]; return { node: c.target.node, path: c.target.path, times: acc(s.input).data, vals: acc(s.output), interp: s.interpolation || 'LINEAR' }; });
    let dur = 0; for (const c of ch) dur = Math.max(dur, c.times[c.times.length - 1]);
    clips[a.name] = { name: a.name, ch, dur };
  }
  /** local TRS of every node at time t of clip (LINEAR / STEP; slerp for rotations) */
  function localAt(clip, t) {
    const L = rest.map((r) => ({ t: r.t.clone(), r: r.r.clone(), s: r.s.clone() }));
    if (!clip) return L;
    for (const c of clip.ch) {
      const T = c.times; let k = 0; while (k < T.length - 2 && T[k + 1] <= t) k++;
      const f = T.length < 2 ? 0 : Math.min(1, Math.max(0, (t - T[k]) / Math.max(1e-9, T[k + 1] - T[k])));
      const n = c.vals.n, v = c.vals.data, k2 = Math.min(T.length - 1, k + 1);
      const g = (kk) => Array.from(v.subarray(kk * n, kk * n + n));
      if (c.path === 'rotation') { const qa = new THREE.Quaternion(...g(k)), qb = new THREE.Quaternion(...g(k2)); L[c.node].r.copy(c.interp === 'STEP' ? qa : qa.slerp(qb, f)); }
      else if (c.path === 'translation' || c.path === 'scale') { const a = new THREE.Vector3(...g(k)), b = new THREE.Vector3(...g(k2)); L[c.node][c.path === 'translation' ? 't' : 's'].copy(c.interp === 'STEP' ? a : a.lerp(b, f)); }
    }
    return L;
  }
  /** world matrices / positions / quaternions of every node */
  function worldAt(clip, t) {
    const L = localAt(clip, t); const M = new Array(N.length);
    for (const i of order) { const m = new THREE.Matrix4().compose(L[i].t, L[i].r, L[i].s); M[i] = parent[i] >= 0 ? M[parent[i]].clone().multiply(m) : m; }
    const P = {}, Q = {};
    for (let i = 0; i < N.length; i++) { const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); M[i].decompose(p, q, s); P[N[i].name] = p; Q[N[i].name] = q; }
    return { P, Q };
  }
  return { json, N, byName, parent, rest, clips, localAt, worldAt };
}
