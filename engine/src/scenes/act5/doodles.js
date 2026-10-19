// OUTRO margin doodles (paperkit style, all code, no image model): small pencil drawings in the sketchbook spread's
// outer bottom corners, inked in with the credits on the last screen (198.035 ->):
//   - the FIREFLY LAMP (the firefly bug as a feature: navy round body with a smiling face as the post, a disc base, a gold
//     neck, the glowing bulb, Charlie's beige flat cap as the lampshade). Its bulb is the blinking "living detail".
//   - the PINK ERASER (UNDO, QA now) wearing Charlie's spare beige flat cap: pink block, paper sleeve with the blue stripe,
//     heavy-lidded eyes and a small smile, two stubby feet, a few rubber crumbs.
// drawX(cv, p): p 0..1 = how much is drawn (graphite outline strokes in order, then the coloured-pencil hatching).
// Deterministic (seeded jitter). Canvas: square, any size (512 recommended). Coordinates below are 0..1, y down.
import { mulberry32 } from '../../util.js';

const GRAPHITE = '#3b3a40';
// ---------------------------------------------------------------- shape samplers (-> polylines)
const arc = (cx, cy, rx, ry, a0, a1, n = 28) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
const seg = (...pts) => pts;
const quad = (a, c, b, n = 16) => { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; o.push([v * v * a[0] + 2 * u * v * c[0] + u * u * b[0], v * v * a[1] + 2 * u * v * c[1] + u * u * b[1]]); } return o; };
const rrect = (x0, y0, x1, y1, r) => [...arc(x0 + r, y0 + r, r, r, Math.PI, 1.5 * Math.PI, 6), ...arc(x1 - r, y0 + r, r, r, 1.5 * Math.PI, 2 * Math.PI, 6),
  ...arc(x1 - r, y1 - r, r, r, 0, 0.5 * Math.PI, 6), ...arc(x0 + r, y1 - r, r, r, 0.5 * Math.PI, Math.PI, 6), [x0, y0 + r]];
const len = (P) => { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; };

/** Charlie's flat (newsboy) cap seen from the side, visor to the right: a low puffy crown that overhangs a short brim */
function capStrokes(x0, x1, y, h) {
  const w = x1 - x0;
  return [
    [...quad([x0, y], [x0 - 0.04 * w, y - 0.9 * h], [x0 + 0.45 * w, y - 0.95 * h]), ...quad([x0 + 0.45 * w, y - 0.95 * h], [x1 + 0.22 * w, y - 0.98 * h], [x1 + 0.14 * w, y - 0.28 * h])],  // crown
    seg([x1 + 0.14 * w, y - 0.28 * h], [x1 + 0.26 * w, y + 0.04 * h], [x0 + 0.72 * w, y + 0.04 * h]),   // short brim under the overhang
    seg([x0, y], [x0 + 0.72 * w, y + 0.04 * h]),                                                          // band line
    arc(x0 + 0.47 * w, y - 0.98 * h, w * 0.035, w * 0.028, 0, Math.PI * 2, 10),                            // button
    quad([x0 + 0.3 * w, y - 0.92 * h], [x0 + 0.38 * w, y - 0.5 * h], [x0 + 0.5 * w, y - 0.12 * h]),      // a seam
  ];
}
const capFill = (x0, x1, y, h) => (g, W) => { const w = x1 - x0; g.beginPath(); g.moveTo(x0 * W, y * W);
  g.quadraticCurveTo((x0 - 0.04 * w) * W, (y - 0.9 * h) * W, (x0 + 0.45 * w) * W, (y - 0.95 * h) * W);
  g.quadraticCurveTo((x1 + 0.22 * w) * W, (y - 0.98 * h) * W, (x1 + 0.14 * w) * W, (y - 0.28 * h) * W);
  g.lineTo((x1 + 0.26 * w) * W, (y + 0.04 * h) * W); g.lineTo(x0 * W, y * W); g.closePath(); };

// ---------------------------------------------------------------- the two doodles: outline strokes + fills
export const LAMP_BULB = [0.5, 0.375];   // the bulb centre (0..1, y down): the blink sits here
function lampSpec() {
  const strokes = [
    ...capStrokes(0.26, 0.66, 0.335, 0.13),
    arc(0.5, 0.375, 0.075, 0.075, -0.15 * Math.PI, 1.15 * Math.PI, 22),        // bulb (under the shade)
    seg([0.465, 0.45], [0.465, 0.5]), seg([0.535, 0.45], [0.535, 0.5]),         // neck
    arc(0.5, 0.65, 0.155, 0.15, 0, Math.PI * 2, 40),                             // the firefly's round body (the post)
    arc(0.57, 0.6, 0.016, 0.02, 0, Math.PI * 2, 10), arc(0.625, 0.6, 0.016, 0.02, 0, Math.PI * 2, 10),   // eyes (looking right)
    quad([0.56, 0.665], [0.6, 0.7], [0.64, 0.66]),                               // smile
    quad([0.37, 0.6], [0.28, 0.5], [0.33, 0.66]), quad([0.63 + 0.0, 0.53], [0.72, 0.44], [0.67, 0.58]),   // little wings
    arc(0.5, 0.86, 0.2, 0.045, 0, Math.PI * 2, 36),                               // disc base
    seg([0.38, 0.78], [0.36, 0.85]), seg([0.62, 0.78], [0.64, 0.85]),             // legs onto the base
    seg([0.36, 0.38], [0.31, 0.4]), seg([0.64, 0.38], [0.69, 0.4]), seg([0.42, 0.47], [0.38, 0.52]), seg([0.58, 0.47], [0.62, 0.52]),  // light rays
  ];
  const fills = [
    { col: '#cdae74', path: capFill(0.26, 0.66, 0.335, 0.13), step: 7, angle: -0.8 },
    { col: '#ffe45c', path: (g, W) => { g.beginPath(); g.arc(0.5 * W, 0.375 * W, 0.07 * W, 0, Math.PI * 2); }, step: 5, angle: 0.6 },
    { col: '#28366c', path: (g, W) => { g.beginPath(); g.ellipse(0.5 * W, 0.65 * W, 0.15 * W, 0.145 * W, 0, 0, Math.PI * 2); }, step: 6, angle: -0.7, hole: [0.6, 0.63, 0.07] },
    { col: '#3a4c8a', path: (g, W) => { g.beginPath(); g.ellipse(0.5 * W, 0.86 * W, 0.195 * W, 0.04 * W, 0, 0, Math.PI * 2); }, step: 6, angle: 0.3 },
  ];
  return { strokes, fills };
}
function eraserSpec() {
  const strokes = [
    rrect(0.24, 0.36, 0.76, 0.86, 0.07),                                          // the block
    seg([0.24, 0.62], [0.76, 0.62]), seg([0.24, 0.84], [0.76, 0.84]),               // the paper sleeve
    seg([0.24, 0.71], [0.76, 0.71]), seg([0.24, 0.75], [0.76, 0.75]),               // its blue stripe
    arc(0.41, 0.49, 0.035, 0.03, Math.PI, 2 * Math.PI, 10), seg([0.375, 0.49], [0.445, 0.49]),   // heavy-lidded eyes
    arc(0.59, 0.49, 0.035, 0.03, Math.PI, 2 * Math.PI, 10), seg([0.555, 0.49], [0.625, 0.49]),
    quad([0.45, 0.545], [0.5, 0.58], [0.55, 0.545]),                               // small smile
    ...capStrokes(0.24, 0.66, 0.375, 0.13),                                          // Charlie's spare cap
    seg([0.34, 0.86], [0.34, 0.92], [0.42, 0.92]), seg([0.66, 0.86], [0.66, 0.92], [0.74, 0.92]),   // stubby feet
    arc(0.86, 0.9, 0.012, 0.01, 0, Math.PI * 2, 8), arc(0.9, 0.86, 0.009, 0.008, 0, Math.PI * 2, 8), arc(0.13, 0.9, 0.01, 0.009, 0, Math.PI * 2, 8),   // crumbs
  ];
  const fills = [
    { col: '#f2788f', path: (g, W) => { g.beginPath(); g.rect(0.25 * W, 0.37 * W, 0.5 * W, 0.25 * W); }, step: 6, angle: -0.75, hole: [0.5, 0.5, 0.0] },
    { col: '#dccfae', path: (g, W) => { g.beginPath(); g.rect(0.25 * W, 0.62 * W, 0.5 * W, 0.22 * W); }, step: 7, angle: 0.7 },
    { col: '#3f6fc2', path: (g, W) => { g.beginPath(); g.rect(0.25 * W, 0.71 * W, 0.5 * W, 0.04 * W); }, step: 4, angle: 0.7 },
    { col: '#cdae74', path: capFill(0.24, 0.66, 0.375, 0.13), step: 7, angle: -0.8 },
  ];
  return { strokes, fills };
}
const SPECS = { lamp: lampSpec(), eraser: eraserSpec() };

function hatch(g, W, f, a, seed) {
  const r = mulberry32(seed); g.save(); f.path(g, W); g.clip();
  g.strokeStyle = f.col; g.lineWidth = W * 0.007; g.globalAlpha = 0.7 * a; g.lineCap = 'round';
  const L = W * 1.5, ca = Math.cos(f.angle), sa = Math.sin(f.angle);
  for (let d = -L; d < L; d += f.step * (W / 512) * (0.8 + 0.4 * r())) {
    const cx = W / 2 - d * sa, cy = W / 2 + d * ca; g.beginPath(); g.moveTo(cx - ca * L, cy - sa * L); g.lineTo(cx + ca * L, cy + sa * L); g.stroke();
  }
  if (f.hole && f.hole[2] > 0) { g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; g.beginPath(); g.arc(f.hole[0] * W, f.hole[1] * W, f.hole[2] * W, 0, Math.PI * 2); g.fill(); }
  g.restore();
}

/** draw doodle `name` ('lamp' | 'eraser') into cv at progress p (0..1). Outline 0..0.72, colour hatching 0.6..1 */
export function drawDoodle(cv, name, p, seed = 5) {
  const g = cv.getContext('2d'); const W = cv.width; g.clearRect(0, 0, W, cv.height);
  const S = SPECS[name]; if (p <= 0) return;
  // colour hatching under the graphite
  const fa = Math.max(0, Math.min(1, (p - 0.6) / 0.4));
  if (fa > 0) S.fills.forEach((f, i) => hatch(g, W, f, fa, seed * 31 + i));
  // graphite outlines, in order, prefix by total length
  const lens = S.strokes.map(len); const total = lens.reduce((a, b) => a + b, 0);
  let budget = Math.min(1, p / 0.72) * total;
  g.lineCap = 'round'; g.lineJoin = 'round';
  S.strokes.forEach((P, si) => {
    if (budget <= 0) return; const take = Math.min(budget, lens[si]); budget -= take;
    for (let pass = 0; pass < 2; pass++) {
      const r = mulberry32(seed * 1000 + si * 7 + pass);
      g.strokeStyle = GRAPHITE; g.globalAlpha = pass ? 0.45 : 0.88; g.lineWidth = W * (pass ? 0.006 : 0.009);
      g.beginPath(); let acc = 0;
      for (let i = 0; i < P.length; i++) {
        const jx = (r() - 0.5) * 0.006, jy = (r() - 0.5) * 0.006;
        if (i > 0) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
          if (acc + d > take) { const u = (take - acc) / d; g.lineTo((P[i - 1][0] + (P[i][0] - P[i - 1][0]) * u) * W, (P[i - 1][1] + (P[i][1] - P[i - 1][1]) * u) * W); break; }
          acc += d; g.lineTo((P[i][0] + jx) * W, (P[i][1] + jy) * W); }
        else g.moveTo((P[i][0] + jx) * W, (P[i][1] + jy) * W);
      }
      g.stroke();
    }
  });
  g.globalAlpha = 1;
  // paper tooth
  const r = mulberry32(seed + 99); g.save(); g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < W * W / 120; i++) { g.fillStyle = `rgba(0,0,0,${0.3 * r()})`; g.fillRect(r() * W, r() * W, 1 + r() * 2, 1 + r() * 1.5); }
  g.restore();
}
