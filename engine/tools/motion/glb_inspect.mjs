// node tools/motion/glb_inspect.mjs <file.glb>  -> skeleton hierarchy (rest TRS) + animation list
import { readGLB } from './glb.mjs';
const { json, acc } = readGLB(process.argv[2]);
const N = json.nodes; const parent = {}; N.forEach((n, i) => (n.children || []).forEach((c) => (parent[c] = i)));
const skin = json.skins?.[0]; console.log('skins', json.skins?.length, 'joints', skin?.joints.length, 'meshes', json.meshes?.length, 'nodes', N.length);
const depth = (i) => (parent[i] === undefined ? 0 : 1 + depth(parent[i]));
const f = (a) => (a ? a.map((v) => +v.toFixed(3)).join(',') : '-');
for (const j of skin?.joints || []) { const n = N[j]; console.log('  '.repeat(depth(j)) + n.name, 'T', f(n.translation), 'R', f(n.rotation), n.scale ? 'S ' + f(n.scale) : ''); }
console.log('roots', N.map((n, i) => (parent[i] === undefined ? n.name : null)).filter(Boolean).join(' | '));
for (const a of json.animations || []) {
  let dur = 0; for (const s of a.samplers) { const t = json.accessors[s.input]; dur = Math.max(dur, t.max?.[0] ?? 0); }
  const paths = new Set(a.channels.map((c) => c.target.path)); console.log('ANIM', a.name, dur.toFixed(2) + 's', a.channels.length + 'ch', [...paths].join('/'));
}
