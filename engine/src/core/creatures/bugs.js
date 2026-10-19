// The five BUGS as 3D-native voxel models (authored as SDF part unions, voxelized, one AO mesh per rigged part).
// Head / face toward +x, feet at y = 0 (the firefly hovers: its body sits ~20 voxels up), centred on z = 0.
//   anims: 'idle' (breath, blink, antennae, flutter) · 'dance' (beat-locked) · 'bug' (its software-bug behaviour loop)
//   firefly: blinks OFF the beat · moth: dives forward and bonks · beetle: rolls in a tight circle · caterpillar: grows extra
//   segments (overflow) · ladybug: flashes its error spots.
import * as THREE from 'three';
import { sphere, ell, capsule, tube, half, inter, union, xform, displace, vnoise, hash3, eyePart, EYE_R, clamp01, sstep } from './vox.js';

export const BUG_NAMES = ['ladybug', 'beetle', 'moth', 'caterpillar', 'firefly'];
export const C = {
  red: '#e3342b', blk: '#1c1719', wh: '#f4efe6', pinkMouth: '#ff7d90',
  teal: '#17b2a6', teal2: '#5fe0d0', tealSeam: '#0b6560', tealDark: '#22313a', beetleFace: '#2f4a55', brownLeg: '#3b2a24',
  cream: '#f2e4c4', cream2: '#f8eed6', brown: '#8a5a36', brownLt: '#b07a4c',
  green: '#5cb83a', green2: '#72c64b', greenHead: '#8ed14f', greenDark: '#2f6a26', orange: '#f2832a', yellow: '#ffd23f',
  navy: '#1f2a55', navy2: '#28366c', navyTop: '#3a4c8a', glow: '#ffe45c', wingBlue: '#a9d4ff',
};
const SIDES = [1, -1];
const LR = (s) => (s > 0 ? 'L' : 'R');

// ---------------------------------------------------------------------------------------------- shared part builders
/** the face: two shared cute eyes placed at a fixed offset from the head centre (bugs and features use the same numbers) */
export const EYE_OFF = [4.5, 2.2, 4.3];
/** off = [forward, up, side] eye-centre offset from the head centre (bigger heads push the eyes out to their surface);
 *  scale shrinks the eye balls (lamp) — the default eye is the shared EYE_R ball. */
export function eyes(head, { look = 0.35, parent = 'head', axis = 'x', r = EYE_R, off = EYE_OFF, scale = 1 } = {}) {
  r *= scale;
  return SIDES.map((s) => {
    if (axis === 'z') { const c = [head[0] + s * off[2], head[1] + off[1], head[2] + off[0]]; return eyePart('eye' + LR(s), c, [s * look, 0.05, 1], { parent, r }); }
    const c = [head[0] + off[0], head[1] + off[1], head[2] + s * off[2]]; return eyePart('eye' + LR(s), c, [1, 0.05, s * look], { parent, r });
  });
}
/** smile: a little upturned arc on a surface facing +x at (x >= xMin), centred (cy, 0) */
export const smileAt = (cy, w = 2.6, th = 1.1, k = 0.22) => (x, y, z) => { const v = y - (cy + k * z * z); return Math.abs(z) < w && v >= 0 && v < th; };
function leg(name, pts, r, col, parent = 'body') { return { name, shape: tube(pts, r), col: () => col, parent, pivot: pts[0], leg: true }; }
function legs6(hipX, hipY, hipZ, spread, drop, r, col, { footY = 0.7, kneeUp = 0, parent = 'body' } = {}) {
  const P = []; hipX.forEach((x, i) => SIDES.forEach((s) => { const sw = (i - 1) * 1.6;
    P.push(leg(`leg${LR(s)}${i}`, [[x, hipY, s * hipZ], [x + sw, hipY + kneeUp, s * (hipZ + spread)], [x + sw * 1.8, footY + drop, s * (hipZ + spread + 1.5)]], r, col, parent)); }));
  return P;
}
function antennae(base, mid, tip, r, col, tipCol, tipR = 1.5, parent = 'head') {
  return SIDES.map((s) => { const z = (p) => [p[0], p[1], s * p[2]];
    return { name: 'ant' + LR(s), shape: union(tube([z(base), z(mid), z(tip)], r), sphere(z(tip), tipR)), parent, pivot: z(base),
      col: (x, y, zz) => (Math.hypot(x - tip[0], y - tip[1], zz - s * tip[2]) < tipR + 0.2 ? tipCol : col) }; });
}
/** world-space colour function for a shape authored in local space at (pos, rot) */
export function localCol(pos, rot, f) {
  const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'XYZ')); const e = m.elements;
  return (x, y, z) => { const px = x - pos[0], py = y - pos[1], pz = z - pos[2]; return f(e[0] * px + e[1] * py + e[2] * pz, e[4] * px + e[5] * py + e[6] * pz, e[8] * px + e[9] * py + e[10] * pz); };
}
/** moth wing marks (u = span from hinge 0..~22, v = chord, + toward the leading edge) */
export function mothMark(u, v, s = 1) {
  u /= s; v /= s;
  if (u > 18 + 1.0 * Math.sin(v * 1.1)) return C.brown;                          // dark outer border (wavy)
  if (Math.hypot(u - 11, v + 3.2) < 2.2) return C.brown;                         // eye spot
  if (v > 5.2 && u > 4) return C.brownLt;                                        // leading edge band
  return C.cream;
}
const fluff = (x, y, z) => vnoise(x * 0.75, y * 0.75, z * 0.75);
/** ladybug spot directions (unit sphere dirs mapped onto the shell ellipsoid) */
export const SPOT_DIRS = [[0.5, 0.62, 0.6], [-0.1, 0.86, 0.42], [-0.62, 0.6, 0.46], [0.18, 0.32, 0.92], [-0.42, 0.24, 0.86], [-0.94, 0.34, 0.001], [0.05, 0.99, 0.001]]
  .flatMap((d) => (Math.abs(d[2]) < 0.01 ? [d] : [d, [d[0], d[1], -d[2]]]));
export function spotCentres(c, r, dirs = SPOT_DIRS) { return dirs.map((d) => { const n = Math.hypot(...d); return [c[0] + r[0] * d[0] / n, c[1] + r[1] * d[1] / n, c[2] + r[2] * d[2] / n]; }); }

// ---------------------------------------------------------------------------------------------- the specs
export const SPECS = {
  ladybug() {
    const head = [16.5, 10, 0];
    const shC = [-4, 12, 0], shR = [17, 12, 15]; const shell = half(ell(shC, shR), 'y', 6, 1);
    const spots = union(...spotCentres(shC, shR).map((p) => sphere(p, 3.5)));
    const P = [
      { name: 'body', shape: null, pivot: [0, 9, 0] },
      { name: 'head', shape: null, pivot: [12, 9, 0], parent: 'body' },
      ...eyes(head),
      ...SIDES.map((s) => ({ name: 'spots' + LR(s), shape: half(inter(shell, spots), 'z', 0, s), col: () => C.blk, mat: 'flash', parent: 'shell' + LR(s), pivot: [5, 18, 0] })),
      ...SIDES.map((s) => ({ name: 'shell' + LR(s), shape: half(shell, 'z', 0, s), col: (x, y, z) => (Math.abs(z) < 0.95 && x < 9 ? C.blk : C.red), parent: 'body', pivot: [5, 18, 0] })),
      { name: 'skull', shape: sphere(head, 7), parent: 'head', pivot: head, col: (x, y, z) => (x > 20 && smileAt(6.3)(x, y, z) ? C.pinkMouth : C.blk) },
      { name: 'pronotum', shape: ell([11, 11, 0], [5.5, 7, 10]), parent: 'body', pivot: [11, 11, 0], col: (x, y, z) => (Math.abs(z) > 5.6 && y > 11.5 ? C.wh : C.blk) },
      { name: 'belly', shape: ell([-3, 7.5, 0], [15, 4.5, 11.5]), parent: 'body', pivot: [-3, 7, 0], col: () => C.blk },
      ...antennae([19, 15.5, 2], [22, 21, 4.5], [24, 25, 6], 0.75, C.blk, C.red),
      ...legs6([8, 1, -6], 7, 7, 6, 0, 1.1, C.blk),
    ];
    return { parts: P };
  },
  beetle() {
    const head = [20.5, 11, 0];
    const shell = half(ell([-5, 13, 0], [19, 11, 13]), 'y', 6, 1);
    const P = [
      { name: 'body', shape: null, pivot: [0, 9, 0] },
      { name: 'head', shape: null, pivot: [16, 9, 0], parent: 'body' },
      ...eyes(head, { off: [5.6, 2.4, 4.4] }),
      ...SIDES.map((s) => ({ name: 'shell' + LR(s), shape: half(shell, 'z', 0, s), mat: 'metal', parent: 'body', pivot: [8, 19, 0], faceK: { py: 1.28, pz: 1.08, nz: 1.08 },
        col: (x, y, z) => (Math.abs(z) < 0.95 ? C.tealSeam : (y > 21.5 && Math.abs(z) > 2.5 && Math.abs(z) < 5 && x > -16 && x < 4 ? C.teal2 : C.teal)) })),
      { name: 'pronotum', shape: ell([12.5, 13, 0], [6.5, 8, 10.5]), mat: 'metal', parent: 'body', pivot: [12, 12, 0], faceK: { py: 1.28 }, col: (x, y) => (y > 18.5 ? C.teal2 : C.teal) },
      { name: 'skull', shape: ell(head, [6.4, 6.6, 7.4]), parent: 'head', pivot: head, col: (x, y, z) => (x > 24 && smileAt(7.0, 2.4)(x, y, z) ? C.pinkMouth : (x > 23.5 && Math.abs(z) < 5.5 && y < 13 ? C.beetleFace : C.tealDark)) },
      ...SIDES.map((s) => ({ name: 'horn' + LR(s), shape: tube([[19.5, 16.5, s * 2.8], [22.5, 21.5, s * 4], [22, 26, s * 6], [24.5, 28, s * 6.8]], [1.3, 1.1, 0.95]), parent: 'head', pivot: [19.5, 16.5, s * 2.8], col: () => C.tealDark })),
      { name: 'belly', shape: ell([-3, 7.5, 0], [17, 4.5, 10]), parent: 'body', pivot: [-3, 7, 0], col: (x, y, z) => (Math.abs(z) < 0.8 ? C.tealDark : '#2e4650') },
      ...legs6([9, 1, -7], 7, 7, 6.5, 0, 1.3, C.brownLeg),
    ];
    return { parts: P };
  },
  moth() {
    const head = [14.5, 14.5, 0];   // big fluffy face up front (k09)
    const wingF = (s) => { const pos = [3.5, 18, s * 4.5], rot = [-s * 0.55, -s * 0.3, 0];
      return { name: 'wing' + LR(s), shape: xform(ell([-2.5, 0, s * 11.5], [9.6, 1.3, 12]), pos, rot), parent: 'body', pivot: pos,
        col: localCol(pos, rot, (lx, ly, lz) => mothMark(Math.abs(lz), lx + 2.5)) }; };
    const wingH = (s) => { const pos = [-2, 14, s * 4.5], rot = [-s * 0.25, -s * 0.85, 0];
      return { name: 'hwing' + LR(s), shape: xform(ell([-1, 0, s * 7.6], [6, 1.2, 7.8]), pos, rot), parent: 'body', pivot: pos,
        col: localCol(pos, rot, (lx, ly, lz) => (Math.abs(lz) > 12.5 || Math.hypot(Math.abs(lz) - 8, lx + 0.5) < 1.8 ? C.brown : C.cream)) }; };
    const P = [
      { name: 'body', shape: null, pivot: [0, 11, 0] },
      { name: 'head', shape: null, pivot: [10, 12.5, 0], parent: 'body' },
      ...eyes(head, { look: 0.4, off: [6.9, 2.0, 4.5] }),
      { name: 'skull', shape: displace(sphere(head, 8.4), fluff, 1.3), parent: 'head', pivot: head, col: (x, y, z) => (x > 20 && smileAt(10.3, 2.2)(x, y, z) ? C.brown : C.cream2), mat: 'fluff' },
      ...SIDES.map((s) => ({ name: 'ant' + LR(s), parent: 'head', pivot: [17.5, 20.5, s * 2.5],
        shape: union(tube([[17.5, 20.5, s * 2.5], [19, 25, s * 4.5], [19.5, 30, s * 7]], 0.7), xform(ell([0, 0, 0], [1.0, 4.8, 2.7]), [19.2, 27, s * 5.7], [s * 0.45, 0, 0])), col: () => C.brown })),
      wingF(1), wingF(-1), wingH(1), wingH(-1),
      { name: 'ruff', shape: displace(ell([8.5, 13, 0], [3.8, 8.6, 9.2]), fluff, 1.6), parent: 'body', pivot: [8.5, 13, 0], col: () => C.cream2, mat: 'fluff' },
      { name: 'thorax', shape: displace(sphere([3.5, 12, 0], 8.8), fluff, 1.4), parent: 'body', pivot: [3.5, 12, 0], col: () => C.cream, mat: 'fluff' },
      { name: 'abdomen', shape: displace(ell([-9.5, 10, 0], [11.5, 7.6, 7.6]), fluff, 1.1), parent: 'body', pivot: [-2, 10, 0], mat: 'fluff',
        col: (x) => (x < -4 && ((x + 40) % 4.6) < 1.5 ? C.brown : C.cream) },
      ...legs6([7, 3, -1], 5.5, 4.5, 3, 0, 0.8, C.brown),
    ];
    return { parts: P };
  },
  caterpillar() {
    const head = [19.5, 9, 0]; const SEG = 6.4; const segX = (i) => -19 + i * SEG;
    const seg = (name, cx, r, extra) => { const cy = r + 1.4;
      const shape = union(sphere([cx, cy, 0], r), ...SIDES.map((s) => capsule([cx, 2.2, s * 2.4], [cx + 0.6, 0.6, s * 3.2], 1.05)));
      const col = (x, y, z) => { if (y < 2.4) return C.greenDark;
        for (const s of SIDES) { const d = Math.hypot(x - cx, y - (cy + 1), z - s * (r - 0.2)); if (d < 1.0) return C.yellow; if (d < 2.4) return C.orange; }
        const dt = Math.hypot(x - cx, y - (cy + r), z); if (dt < 0.9) return C.yellow; if (dt < 1.9) return C.orange;
        return Math.round((cx + 40) / SEG) % 2 ? C.green : C.green2; };
      return { name, shape, col, parent: 'body', pivot: [cx, 0, 0], extra }; };
    const P = [
      { name: 'body', shape: null, pivot: [0, 0, 0] },
      { name: 'head', shape: null, pivot: [16, 6, 0], parent: 'body' },
      ...eyes(head),
      { name: 'skull', shape: union(sphere(head, 7), ...SIDES.map((s) => capsule([18, 2.4, s * 2.6], [18.6, 0.6, s * 3.2], 1.05))), parent: 'head', pivot: head,
        col: (x, y, z) => (y < 2.4 ? C.greenDark : x > 23 && smileAt(5.6, 2.4)(x, y, z) ? '#d8463a' : C.greenHead) },
      ...antennae([21, 15, 2], [21.8, 18.5, 3.2], [22.4, 21, 4], 0.7, C.greenDark, C.orange, 1.4),
      ...[0, 1, 2, 3, 4, 5].map((i) => seg('seg' + i, segX(i), 4.6 + 0.25 * i, false)),
      ...[0, 1, 2, 3, 4, 5].map((e) => seg('xseg' + e, segX(0) - (e + 1) * SEG, 4.6, true)),
    ];
    return { parts: P };
  },
  firefly() {
    const head = [13.2, 22, 0];
    const abd = { pos: [-8.5, 18.5, 0], rot: [0, 0, 0.22] }; const abdomen = xform(ell([0, 0, 0], [11, 6.2, 6.6]), abd.pos, abd.rot);
    const wing = (s) => { const pos = [4, 26, s * 2.5], rot = [-s * 0.95, -s * 0.75, 0];
      return { name: 'wing' + LR(s), shape: xform(ell([-1, 0, s * 6.5], [5.2, 0.9, 7]), pos, rot), parent: 'body', pivot: pos, mat: 'wing',
        col: localCol(pos, rot, (lx, ly, lz) => (Math.abs(lx + 1 - 0.2 * Math.abs(lz)) < 0.5 && Math.abs(lz) > 2 ? '#d6ebff' : C.wingBlue)) }; };
    const P = [
      { name: 'body', shape: null, pivot: [0, 20, 0] },
      { name: 'head', shape: null, pivot: [9, 21, 0], parent: 'body' },
      ...eyes(head),
      { name: 'skull', shape: sphere(head, 6.6), parent: 'head', pivot: head, col: (x, y, z) => (x > 17.5 && smileAt(19.0, 2.2)(x, y, z) ? C.pinkMouth : C.navy) },
      ...antennae([15, 27, 1.8], [17, 31, 3.5], [19.5, 33, 4.5], 0.65, C.navy, C.glow, 1.3),
      { name: 'tail', shape: half(abdomen, 'x', -9.6, -1), mat: 'glow', parent: 'body', pivot: [-6, 18, 0], col: (x) => (x > -11 ? '#f6cf3a' : C.glow) },
      wing(1), wing(-1),
      { name: 'thorax', shape: ell([4, 21, 0], [6, 5.6, 6]), parent: 'body', pivot: [4, 21, 0], col: (x, y) => (y > 24.6 ? C.navyTop : C.navy2) },
      { name: 'abdomen', shape: abdomen, parent: 'body', pivot: [-6, 18, 0], col: (x) => (((x + 40) % 3.4) < 1.1 ? C.navyTop : C.navy) },
      ...SIDES.flatMap((s) => [6, 3, 0].map((x, i) => leg(`leg${LR(s)}${i}`, [[x, 16.5, s * 3], [x + 1, 13, s * 6], [x + 2.6, 10, s * 6.6]], 0.75, C.navy))),
    ];
    return { parts: P };
  },
};

// ---------------------------------------------------------------------------------------------- animation
// set() calls these with the rig reset to rest. s = voxel size (world units). Everything is a pure function of (t, beat).
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function legsWalk(J, ph, amp = 0.35, lift = 0.25) {
  for (const s of SIDES) for (let i = 0; i < 3; i++) { const g = J[`leg${LR(s)}${i}`]; if (!g) continue;
    const p = ph * Math.PI * 2 + ((i + (s > 0 ? 0 : 1)) % 2) * Math.PI; g.rotation.y += s * amp * Math.sin(p); g.rotation.x += -s * lift * Math.max(0, Math.cos(p)); }
}
function wingsFlap(J, a, names = ['wingL', 'wingR']) { for (const n of names) if (J[n]) J[n].rotation.x += (n.endsWith('L') ? 1 : -1) * a; }

export const ANIMS = {
  ladybug(J, t, b, mode, s, o, U) {
    const B = J.body.position; const flashK = o.flash;
    if (mode === 'dance') {
      B.y += s * 2.4 * Math.abs(Math.sin(Math.PI * b)); J.body.rotation.x = 0.13 * Math.sin(Math.PI * b); J.head.rotation.z = 0.16 * Math.sin(2 * Math.PI * b);
      const open = Math.pow(Math.max(0, Math.sin(Math.PI * b)), 3) * 0.35; J.shellL.rotation.x = -open; J.shellR.rotation.x = open;
      legsWalk(J, b * 0.5, 0.3, 0.45);
    } else if (mode === 'bug') {
      // flashes its spots: an error strobe on the 16ths in 2-beat bursts, shell twitch, the glitch wave rolls from here
      const f = b % 2; const on = f < 1.25 ? (Math.floor(b * 4) % 2 === 0 ? 1 : 0.35) : 0; U.flash = on;
      J.shellL.rotation.x = -0.12 * on; J.shellR.rotation.x = 0.12 * on; B.y += s * 0.6 * on; J.body.rotation.z += 0.04 * on * Math.sin(b * 40);
      legsWalk(J, t * 0.3, 0.1, 0.1);
    } else { B.y += s * 0.25 * Math.sin(t * 2.6); J.head.rotation.y = 0.12 * Math.sin(t * 0.8 + 1); legsWalk(J, t * 0.15, 0.06, 0.05); }
    const fl = flashK ?? U.flash ?? 0; U.flash = fl;
    for (const n of ['spotsL', 'spotsR']) { const m = J[n].children[0]?.material; if (m?.emissive) { m.emissive.setRGB(1, 0.92, 0.55); m.emissiveIntensity = 2.2 * fl; } }
  },
  beetle(J, t, b, mode, s, o, U) {
    const B = J.body.position;
    if (mode === 'dance') {
      B.y += s * 2 * Math.abs(Math.sin(Math.PI * b)); J.body.rotation.x = 0.15 * Math.sin(Math.PI * b); J.head.rotation.z = -0.14 * Math.sin(2 * Math.PI * b);
      J.hornL.rotation.x = 0.15 * Math.sin(2 * Math.PI * b); J.hornR.rotation.x = -0.15 * Math.sin(2 * Math.PI * b); legsWalk(J, b * 0.5, 0.3, 0.4);
    } else if (mode === 'bug') {
      // the infinite loop: a tight circle, one lap per 2 beats, leaning in; ring radius exposed for the scene's glitch rings
      const R = (o.ringR ?? 20) * s; const a = (b / 2) * Math.PI * 2; U.ringR = R; U.ringC = V(0, 0, 0);
      J.root.position.set(R * Math.sin(a), 0, R * (1 - Math.cos(a)) - R); J.root.rotation.y = -a; J.body.rotation.x = -0.12;
      legsWalk(J, b * 2, 0.45, 0.35); J.head.rotation.z = 0.05 * Math.sin(b * 12);
    } else { B.y += s * 0.2 * Math.sin(t * 2.2); J.head.rotation.y = 0.1 * Math.sin(t * 0.9); legsWalk(J, t * 0.15, 0.05, 0.05); }
  },
  moth(J, t, b, mode, s, o, U) {
    const B = J.body.position; const flap = (a, f) => wingsFlap(J, a * Math.sin(f), ['wingL', 'wingR', 'hwingL', 'hwingR']);
    if (mode === 'dance') {
      B.y += s * 3 * Math.abs(Math.sin(Math.PI * b)); J.body.rotation.z += 0.1 * Math.sin(Math.PI * b); flap(0.5, Math.PI * 2 * b); J.head.rotation.z = 0.15 * Math.sin(2 * Math.PI * b);
      legsWalk(J, b * 0.5, 0.25, 0.3);
    } else if (mode === 'bug') {
      // crash loop: wind up, dive forward, BONK, bounce back dizzy, recover (2 beats)
      const f = ((b % 2) + 2) % 2; let x = 0, y = 0, rz = 0, sq = 0; U.bonk = 0;
      if (f < 0.6) { const k = sstep(0, 0.6, f); x = -6 * k; y = 6 * k; rz = 0.25 * k; flap(0.6, f * 30); }
      else if (f < 0.85) { const k = (f - 0.6) / 0.25; x = -6 + 26 * k * k; y = 6 - 9 * k; rz = 0.25 - 0.7 * k; wingsFlap(J, -0.5, ['wingL', 'wingR', 'hwingL', 'hwingR']); }
      else if (f < 1.3) { const k = (f - 0.85) / 0.45; x = 20 - 14 * sstep(0, 1, k); y = -3 + 5 * Math.sin(Math.PI * k); rz = -0.45 + 0.9 * k; sq = Math.exp(-k * 5); U.bonk = k < 0.15 ? 1 : 0;
        J.body.rotation.y = 0.5 * Math.sin(k * 18) * (1 - k); J.head.rotation.x = 0.4 * Math.sin(k * 24) * (1 - k); flap(0.4, k * 20); }
      else { const k = sstep(1.3, 2, f); x = 6 * (1 - k); y = 2 * (1 - k); flap(0.5, f * 25); }
      B.x += x * s; B.y += y * s; J.body.rotation.z += rz; J.body.scale.set(1 - 0.3 * sq, 1 + 0.18 * sq, 1 + 0.18 * sq);
    } else { B.y += s * 0.3 * Math.sin(t * 2.4); flap(0.12, t * 5.5); J.head.rotation.y = 0.12 * Math.sin(t * 0.7); }
  },
  caterpillar(J, t, b, mode, s, o, U) {
    // overflow: 0..6 extra tail segments (fractional = the newest one popping in)
    let ov = o.overflow ?? 0;
    if (mode === 'bug' && o.overflow == null) ov = Math.min(6, (b % 8) * 1.0);            // one new segment per beat, overflows, resets every 2 bars
    for (let e = 0; e < 6; e++) { const g = J['xseg' + e]; const k = clamp01(ov - e); g.visible = k > 0; const pop = k < 1 ? 1.25 * sstep(0, 0.7, k) - 0.25 * sstep(0.7, 1, k) : 1; g.scale.setScalar(Math.max(0.001, pop)); }
    U.overflow = ov;
    const segs = [...[5, 4, 3, 2, 1, 0].map((i) => 'xseg' + i), 'seg0', 'seg1', 'seg2', 'seg3', 'seg4', 'seg5'];
    if (mode === 'dance') {
      segs.forEach((n, i) => { J[n].position.y += s * 2.4 * Math.max(0, Math.sin(Math.PI * 2 * b - i * 0.7)); });
      J.head.position.y += s * 2.4 * Math.max(0, Math.sin(Math.PI * 2 * b + 0.7)); J.head.rotation.z = 0.2 * Math.sin(Math.PI * b);
    } else if (mode === 'bug') {
      segs.forEach((n, i) => { J[n].position.y += s * 1.2 * Math.max(0, Math.sin(Math.PI * 4 * b - i * 0.9)); J[n].position.z += s * 1.0 * Math.sin(b * 2 + i * 0.6); });
      J.head.rotation.y = 0.15 * Math.sin(b * Math.PI);
    } else { segs.forEach((n, i) => { J[n].position.y += s * 0.5 * Math.max(0, Math.sin(t * 3 - i * 0.8)); }); J.head.rotation.z = 0.06 * Math.sin(t * 1.3); }
  },
  firefly(J, t, b, mode, s, o, U) {
    const B = J.body.position; let glow = 0.75 + 0.25 * Math.sin(t * 3);   // (rotation.z is +=: stance adds its pitch after)
    wingsFlap(J, 0.35 * Math.sin(t * 2 * Math.PI * 7.3));
    if (mode === 'dance') {
      const a = Math.PI * b; B.x += s * 4 * Math.sin(a); B.y += s * 3 * Math.sin(2 * a); J.body.rotation.z += 0.15 * Math.cos(a); glow = 0.6 + 0.4 * Math.abs(Math.cos(Math.PI * b));
      legsWalk(J, b, 0.25, 0.2);
    } else if (mode === 'bug') {
      // a flaky test: blinks OFF the beat (the 'and's, jittered), sometimes skips. U.glow = 0/1 for the light it lands on
      const k = Math.floor(b); const off = 0.5 + (hash3(k, 7, 3) - 0.5) * 0.4; const ph = b - k; const skip = hash3(k, 1, 9) < 0.25;
      glow = !skip && ph > off && ph < off + 0.22 ? 1 : 0.05; B.y += s * 1.2 * Math.sin(t * 3.1); B.x += s * 1.5 * Math.sin(t * 1.3);
    } else { B.y += s * 1.4 * Math.sin(t * 2.2); B.x += s * 0.8 * Math.sin(t * 0.9); }
    glow = o.glow ?? glow; U.glow = glow;
    const m = J.tail.children[0]?.material; if (m) m.emissiveIntensity = 0.15 + 2.4 * glow;
    if (U.light) U.light.intensity = (o.lightK ?? 1) * glow;
  },
};
