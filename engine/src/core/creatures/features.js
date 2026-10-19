// The five FEATURES the bugs turn into. Each spec takes a uniform size k (voxels scale with k, the EYES do not: they are
// the same eye balls as the bug's, so the feature reads as the same character). makeFeature() searches k so the feature
// has at least as many voxels as its bug, then trims the deepest interior voxels so the two counts match EXACTLY.
//   firefly -> LAMP (Charlie's beige flat cap as the shade) · moth -> GLIDER · beetle -> WHEEL (face on the +z hub)
//   caterpillar -> BRIDGE (plank deck, face at the +x end) · ladybug -> SHIP BUTTON (red dome, spots, face, base)
import { sphere, ell, capsule, tube, half, inter, union, sub, rbox, cyl, xform, shell, displace, vnoise, eyePart, EYE_R, INK, WHITE } from './vox.js';
import { C, eyes, EYE_OFF, smileAt, mothMark, spotCentres, SPOT_DIRS } from './bugs.js';

export const FEATURE_OF = { firefly: 'lamp', moth: 'glider', beetle: 'wheel', caterpillar: 'bridge', ladybug: 'button' };
export const BUG_OF = Object.fromEntries(Object.entries(FEATURE_OF).map(([b, f]) => [f, b]));
export const CAP = { body: '#cdae74', band: '#a88a54', seam: '#b99a62' };   // Charlie's flat cap (core/voxfig.js capGeo)
const SIDES = [1, -1]; const LR = (s) => (s > 0 ? 'L' : 'R');
const fluff = (x, y, z) => vnoise(x * 0.75, y * 0.75, z * 0.75);

/** Charlie's beige newsboy flat cap as an SDF (base centre c, crown radius R, crown height h, visor toward +x, u = 1 voxel) */
export function flatCapShape(c, R, h, u = 1) {
  const band = cyl([c[0], c[1] + h * 0.17, c[2]], R * 0.8, h * 0.17, 'y', 0.5 * u);
  const puff = half(xform(ell([0, 0, 0], [R, h * 0.62, R * 0.92]), [c[0] + R * 0.12, c[1] + h * 0.48, c[2]], [0, 0, -0.12]), 'y', c[1] + h * 0.15, 1);
  const visor = inter(ell([c[0] + R * 0.78, c[1] + 0.8 * u, c[2]], [R * 0.55, Math.max(1.1 * u, h * 0.12), R * 0.62]), half(rbox([c[0] + R, c[1], c[2]], [R, h, R]), 'x', c[0] + R * 0.5, 1));
  const button = sphere([c[0] + R * 0.16, c[1] + h * 1.07, c[2]], Math.max(1.2 * u, R * 0.09));
  return union(band, puff, visor, button);
}
export function flatCapCol(c, R, h) {
  return (x, y, z) => { const lx = x - c[0], ly = y - c[1], lz = z - c[2];
    if (lx > R * 0.55 && ly < h * 0.3) return CAP.band;                                                     // visor
    if (ly < h * 0.32 && Math.hypot(lx, lz) < R * 0.86) return CAP.band;                                      // band
    const a = Math.atan2(lz, lx - R * 0.12); const seg = ((a / (Math.PI / 3)) % 1 + 1) % 1; if (ly > h * 0.4 && (seg < 0.06 || seg > 0.94)) return CAP.seam;
    return CAP.body; };
}

export const FSPECS = {
  // ---------------------------------------------------------------- LAMP (firefly): base, the firefly's body as the post (face), bulb, cap shade
  lamp(k = 1) {
    const bodyC = [0, 12.5 * k, 0]; const head = [bodyC[0] + 3.6 * k, 13 * k, 0];
    const bulbC = [0, 26 * k, 0], capC = [0, 29 * k, 0], R = 11.5 * k, h = 7.5 * k;
    return { parts: [
      { name: 'body', shape: null, pivot: [0, 0, 0] },
      { name: 'head', shape: null, pivot: bodyC, parent: 'body' },
      ...eyes(head, { scale: 0.75, off: [5.6, 1.8, 3.4] }),
      { name: 'post', shape: shell(ell(bodyC, [9.5 * k, 9.5 * k, 9.5 * k]), 1.8), parent: 'head', pivot: bodyC,
        col: (x, y, z) => (x > 4 * k && smileAt(head[1] - 3.6, 2.4)(x, y, z) ? C.pinkMouth : (y < bodyC[1] - 3 && ((y + 40) % 3.4) < 1.1 ? C.navyTop : C.navy)) },
      { name: 'base', shape: shell(cyl([0, 1.6 * k, 0], 9 * k, 1.6 * k, 'y', 0.7), 1.6), parent: 'body', pivot: [0, 0, 0], col: (x, y) => (y > 2.4 * k ? C.navyTop : C.navy) },
      { name: 'neck', shape: cyl([0, 21.5 * k, 0], 2.6 * k, 1.6 * k, 'y'), parent: 'body', pivot: [0, 21.5 * k, 0], col: () => '#c9a24a' },
      { name: 'bulb', shape: shell(sphere(bulbC, 5.6 * k), 2.2), parent: 'body', pivot: bulbC, mat: 'glow', col: (x, y) => (y > bulbC[1] + 3 * k ? '#fff2a0' : C.glow) },
      { name: 'cap', shape: shell(flatCapShape(capC, R, h), 1.6), parent: 'body', pivot: capC, col: flatCapCol(capC, R, h) },
    ] };
  },
  // ---------------------------------------------------------------- GLIDER (moth): a moth-patterned delta wing over the fluffy fuselage
  glider(k = 1) {
    // the moth's own big fluffy face (same head radius and eye offsets as the moth: not scaled by k) up front, long wide wings
    const wy = 13 * k, span = 35 * k, cx = 0; const head = [11 * k + 4.5, 9.5 * k + 1.5, 0];
    const le = (z) => 10 * k - 0.4 * Math.abs(z), te = (z) => -15 * k + 0.2 * Math.abs(z);       // broad swept planform
    const wingShape = (s) => ({
      d: (x, y, z) => { if (s * z < -0.5) return 1; const az = Math.abs(z);
        const e = Math.max(x - le(az), te(az) - x, az - span); const th = Math.abs(y - (wy + 0.24 * az)) - 1.25; return Math.max(e, th); },
      box: [te(0) - 1, wy - 3, s > 0 ? 0 : -span - 1, le(0) + 1, wy + 0.24 * span + 3, s > 0 ? span + 1 : 0] });
    const wingCol = (x, y, z) => { const az = Math.abs(z); const dl = le(z) - x, dt = x - te(z), dtip = span - az;
      if (Math.min(dl, dt, dtip) < 1.8) return C.brown;                                                       // brown border
      if (Math.hypot(x + 3 * k, az - 19 * k) < 2.8 * k) return C.brown;                                  // eye spots
      if (Math.hypot(x + 3 * k, az - 19 * k) < 3.9 * k) return C.cream2;
      if (dl < 4.2 && az > 6 * k) return C.brownLt;                                                       // leading-edge band
      if (Math.abs(x - (le(z) + te(z)) / 2 - 1.5 * k) < 0.7 && az > 5 * k && az < span - 7 * k) return C.brownLt; // vein
      return C.cream; };
    return { parts: [
      { name: 'body', shape: null, pivot: [0, 0, 0] },
      { name: 'head', shape: null, pivot: [head[0] - 4.5, head[1] - 2, 0], parent: 'body' },
      ...eyes(head, { look: 0.4, off: [6.9, 2.0, 4.5] }),
      { name: 'skull', shape: displace(sphere(head, 8.4), fluff, 1.3), parent: 'head', pivot: head, mat: 'fluff', col: (x, y, z) => (x > head[0] + 5.5 && smileAt(head[1] - 4.2, 2.2)(x, y, z) ? C.brown : C.cream2) },
      ...SIDES.map((s) => ({ name: 'ant' + LR(s), parent: 'head', pivot: [head[0] + 3, head[1] + 6, s * 2.5],
        shape: union(tube([[head[0] + 3, head[1] + 6, s * 2.5], [head[0] + 4.5, head[1] + 10.5, s * 4.5], [head[0] + 5, head[1] + 15.5, s * 7]], 0.7), xform(ell([0, 0, 0], [1.0, 4.8, 2.7]), [head[0] + 4.7, head[1] + 12.5, s * 5.7], [s * 0.45, 0, 0])), col: () => C.brown })),
      ...SIDES.map((s) => ({ name: 'wing' + LR(s), shape: wingShape(s), parent: 'body', pivot: [cx, wy, 0], col: wingCol })),
      { name: 'fin', shape: inter(ell([-17 * k, 12 * k, 0], [4.5 * k, 7.5 * k, 1.1]), half(rbox([-17 * k, 17 * k, 0], [6 * k, 9 * k, 2]), 'y', 9 * k, 1)), parent: 'body', pivot: [-17 * k, 11 * k, 0], col: (x, y) => (y > 16.5 * k ? C.brownLt : C.brown) },
      { name: 'ruff', shape: displace(ell([head[0] - 6, head[1] - 0.5, 0], [3.6, 7.6, 8.2]), fluff, 1.4), parent: 'body', pivot: [head[0] - 6, head[1], 0], mat: 'fluff', col: () => C.cream2 },
      { name: 'thorax', shape: displace(ell([2 * k, 8.5 * k, 0], [7.5 * k, 6.4 * k, 6.4 * k]), fluff, 1.1), parent: 'body', pivot: [2 * k, 8.5 * k, 0], mat: 'fluff', col: () => C.cream },
      { name: 'abdomen', shape: displace(ell([-10.5 * k, 8.5 * k, 0], [9.5 * k, 5.2 * k, 5.2 * k]), fluff, 0.8), parent: 'body', pivot: [-10.5 * k, 8.5 * k, 0], mat: 'fluff', col: (x) => (((x + 60) % 4.6) < 1.5 ? C.brown : C.cream) },
      ...SIDES.map((s) => ({ name: 'skid' + LR(s), shape: tube([[3 * k, 3.5 * k, s * 2.6 * k], [5 * k, 1.2, s * 4 * k], [8 * k, 0.8, s * 4.4 * k]], 0.9), parent: 'body', pivot: [3 * k, 3.5 * k, s * 2.6 * k], col: () => C.brown })),
    ] };
  },
  // ---------------------------------------------------------------- WHEEL (beetle): dark tyre, teal metallic hub, face on +z
  wheel(k = 1) {
    const R = 19 * k, cy = R, hz = 6 * k; const head = [0, cy, 0];
    const tyre = { d: (x, y, z) => { const rr = Math.hypot(x, y - cy); const q1 = Math.abs(rr - (R - 3 * k)) - 3 * k + 1.2, q2 = Math.abs(z) - hz + 1.2; return Math.hypot(Math.max(q1, 0), Math.max(q2, 0)) + Math.min(Math.max(q1, q2), 0) - 1.2; }, box: [-R, 0, -hz, R, 2 * R, hz] };
    const hub = union(cyl([0, cy, 0], R - 5.5 * k, 4.4 * k, 'z', 1.2), ell([0, cy, 0], [R - 8 * k, R - 8 * k, 5.6 * k]));
    const fz = 5.6 * k;   // hub face plane (+z)
    // the mouth is its own part on the NON-spinning head (with the eyes); tyre, hub and horns spin on the 'spin' joint
    const hubZ = (x, y) => { const rr = Math.hypot(x, y - cy), re = R - 8 * k; return rr < re ? Math.max(4.4 * k, fz * Math.sqrt(1 - (rr / re) ** 2)) : 4.4 * k; };
    const mouth = { d: (x, y, z) => { const v = y - (cy - 4.4 + 0.22 * x * x); if (Math.abs(x) > 2.9 || v < 0 || v > 1.25) return 1; const zs = hubZ(x, y); return z > zs - 0.8 && z < zs + 0.9 ? -1 : 1; },
      box: [-3, cy - 4.6, 3 * k, 3, cy - 0.5, fz + 1.5] };
    return { parts: [
      { name: 'body', shape: null, pivot: [0, cy, 0] },
      { name: 'head', shape: null, pivot: [0, cy, 0], parent: 'body' },
      { name: 'spin', shape: null, pivot: [0, cy, 0], parent: 'head' },
      { name: 'mouth', shape: mouth, parent: 'head', pivot: [0, cy, 0], col: () => '#0a3d3b' },
      ...SIDES.map((s) => eyePart('eye' + LR(s), [s * EYE_OFF[2], cy + EYE_OFF[1], fz - 1.4], [s * 0.3, 0.05, 1], { parent: 'head' })),
      { name: 'tyre', shape: tyre, parent: 'spin', pivot: [0, cy, 0],
        col: (x, y, z) => { const rr = Math.hypot(x, y - cy); const a = Math.atan2(y - cy, x); if (rr > R - 1.3 && Math.floor(a * 20 / Math.PI + 40) % 2) return '#2f4350'; if (Math.abs(z) > hz - 1.3 && Math.abs(rr - (R - 3.2 * k)) < 0.6) return '#2f4350'; return C.tealDark; } },
      { name: 'hub', shape: hub, parent: 'spin', pivot: [0, cy, 0], mat: 'metal', faceK: { py: 1.15 },
        col: (x, y, z) => { const rr = Math.hypot(x, y - cy); if (Math.abs(rr - (R - 7.5 * k)) < 0.7) return C.tealSeam;
          const a = Math.atan2(y - cy, x); if (rr > 4 && rr < R - 8 * k && Math.abs(z) > 3 && ((a / (Math.PI / 3)) % 1 + 1) % 1 < 0.08) return C.tealSeam; return rr < R - 7.5 * k ? C.teal2 : C.teal; } },
      ...SIDES.map((s) => ({ name: 'horn' + LR(s), shape: tube([[s * 3, cy + R - 7.6 * k, 0], [s * 4.5, cy + R - 3.5 * k, 0], [s * 4, cy + R + 1.5, 0]], [1.1, 0.95]), parent: 'spin', pivot: [s * 3, cy + R - 8 * k, 0], col: () => C.tealDark })),
    ] };
  },
  // ---------------------------------------------------------------- BRIDGE (caterpillar): segmented plank deck on two stringers, face at +x
  bridge(k = 1) {
    const N = 8, L = 6.2 * k, x0 = -27 * k; const arch = (x) => 5.5 * k + 2.4 * k * Math.sin(Math.PI * (x - x0) / (N * L));
    const head = [x0 + N * L + 5.5, 9 * k + 1, 0];
    const plank = (i) => { const cx = x0 + (i + 0.5) * L, cy = arch(cx);
      return { name: 'plank' + i, shape: rbox([cx, cy, 0], [L / 2 - 0.5, 1.5 * k, 8.5 * k], 0.6), parent: 'body', pivot: [cx, cy, 0],
        col: (x, y, z) => { const d = Math.hypot(x - cx, z); if (y > cy + 0.8 * k) { if (d < 1.0) return C.yellow; if (d < 2.3) return C.orange; } return i % 2 ? C.green : C.green2; } }; };
    const rail = (s) => { const pts = []; for (let i = 0; i <= N; i++) { const x = x0 + i * L; pts.push([x, arch(x) - 2.2 * k, s * 5.4 * k]); } return { name: 'rail' + LR(s), shape: tube(pts, 0.95), parent: 'body', pivot: [0, 0, s * 5.4 * k], col: () => C.greenDark }; };
    const hand = (s) => { const pts = []; for (let i = 0; i <= N; i++) { const x = x0 + i * L; pts.push([x, arch(x) + 6.5 * k, s * 8 * k]); }
      return { name: 'hand' + LR(s), shape: union(tube(pts, 0.9), ...pts.map((p) => capsule([p[0], arch(p[0]) + 0.8 * k, p[2]], p, 0.85))), parent: 'body', pivot: [0, 0, s * 8 * k],
        col: (x, y) => (y > arch(x) + 5.6 * k ? C.green2 : C.greenDark) }; };
    const post = (name, x) => ({ name, shape: union(...SIDES.map((s) => capsule([x, arch(x) - 2, s * 5 * k], [x + 0.4, 0.7, s * 5.6 * k], 1.15))), parent: 'body', pivot: [x, 0, 0], col: () => C.greenDark });
    return { parts: [
      { name: 'body', shape: null, pivot: [0, 0, 0] },
      { name: 'head', shape: null, pivot: [head[0] - 3, 5, 0], parent: 'body' },
      ...eyes(head),
      { name: 'skull', shape: union(sphere(head, 7), ...SIDES.map((s) => capsule([head[0] - 1.5, 2.4, s * 2.6], [head[0] - 1, 0.6, s * 3.2], 1.05))), parent: 'head', pivot: head,
        col: (x, y, z) => (y < 2.4 ? C.greenDark : x > head[0] + 3.5 && smileAt(head[1] - 3.4, 2.4)(x, y, z) ? '#d8463a' : C.greenHead) },
      ...SIDES.map((s) => ({ name: 'ant' + LR(s), parent: 'head', pivot: [head[0] + 1.5, head[1] + 6, s * 2],
        shape: union(tube([[head[0] + 1.5, head[1] + 6, s * 2], [head[0] + 2.3, head[1] + 9.5, s * 3.2], [head[0] + 2.9, head[1] + 12, s * 4]], 0.7), sphere([head[0] + 2.9, head[1] + 12, s * 4], 1.4)),
        col: (x, y) => (y > head[1] + 10.8 ? C.orange : C.greenDark) })),
      ...Array.from({ length: N }, (_, i) => plank(i)),
      hand(1), hand(-1), rail(1), rail(-1), post('postA', x0 + 1.5), post('postB', x0 + N * L * 0.5), post('postC', x0 + N * L - 1.5),
    ] };
  },
  // ---------------------------------------------------------------- SHIP BUTTON (ladybug): red spotted dome with a face, on a metal base
  button(k = 1) {
    const dc = [0, 5 * k, 0], dr = [14 * k, 13.5 * k, 14 * k]; const dome = half(ell(dc, dr), 'y', dc[1], 1);
    const head = [dr[0] * 0.78, dc[1] + dr[1] * 0.28, 0];
    const eyeC = SIDES.map((s) => [head[0] + EYE_OFF[0] - 2.6, head[1] + EYE_OFF[1], s * EYE_OFF[2]]);
    const spotC = spotCentres(dc, dr).filter((p) => p[0] < dr[0] * 0.38 || p[1] > dc[1] + dr[1] * 0.8);
    const spots = union(...spotC.map((p) => sphere(p, 3.5 * Math.min(1.25, k))));
    const faceN = (x, y, z) => { const nx = (x - dc[0]) / dr[0], ny = (y - dc[1]) / dr[1], nz = (z - dc[2]) / dr[2]; return [nx, ny, nz]; };
    return { parts: [
      { name: 'body', shape: null, pivot: [0, 0, 0] },
      { name: 'head', shape: null, pivot: [0, 5 * k, 0], parent: 'body' },
      ...SIDES.map((s, i) => eyePart('eye' + LR(s), eyeC[i], [1, 0.08, s * 0.35], { parent: 'head' })),
      { name: 'spots', shape: inter(dome, spots), parent: 'head', pivot: [0, 5 * k, 0], mat: 'flash', col: () => C.blk },
      { name: 'dome', shape: dome, parent: 'head', pivot: [0, 5 * k, 0],
        col: (x, y, z) => { const [nx, ny] = faceN(x, y, z);
          if (nx > 0.5 && ny < 0.62) { if (smileAt(head[1] - 3.2, 2.8, 1.1, 0.2)(x, y, z)) return WHITE;
            for (const s of SIDES) if (Math.hypot(y - (head[1] - 1.6), z - s * 8.2 * Math.min(1, k)) < 2.0) return '#ff8aa0'; return C.blk; }
          return Math.abs(z) < 0.9 && nx < 0.45 ? C.blk : C.red; } },
      { name: 'base', shape: cyl([0, 2.6 * k, 0], dr[0] + 2.6 * k, 2.6 * k, 'y', 0.8), parent: 'body', pivot: [0, 0, 0],
        col: (x, y, z) => { const rr = Math.hypot(x, z); if (y > 4.0 * k && rr > dr[0] - 0.5) return '#b8b8c4'; if (Math.abs(y - 2.6 * k) < 0.6) return '#2c2c34'; return '#4a4a56'; } },
    ] };
  },
};
