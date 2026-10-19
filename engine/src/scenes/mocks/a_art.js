// Procedural pixel art + sprite surgery for the Team-A keyframe mocks (mocks_a.js). Mock-only helpers: poses that
// have no strip yet (human chain, flipped-pencil erase, Eraser blink / smear / peer) are composed here from the live
// strips with nearest-neighbour rotations and pixel patches. Everything is painted in code.
import { pixelCanvas } from '../../core/gfx.js';
import { PAL, hexToRgb } from '../../core/palette.js';
import { mulberry32 } from '../../util.js';

/** copy one frame of a preloaded strip into its own canvas */
export function frameCanvas(lib, strip, f = 0) {
  const sp = lib.get(strip);
  return pixelCanvas(sp.w, sp.h, (g) => g.drawImage(sp.img, f * sp.w, 0, sp.w, sp.h, 0, 0, sp.w, sp.h));
}
/** drop the top n rows (e.g. the grab bar baked into the *_hang strips) */
export function cropTop(cv, n) { return pixelCanvas(cv.width, cv.height - n, (g) => g.drawImage(cv, 0, n, cv.width, cv.height - n, 0, 0, cv.width, cv.height - n)); }
export function cropX(cv, a, b) { return pixelCanvas(cv.width - a - b, cv.height, (g) => g.drawImage(cv, a, 0, cv.width - a - b, cv.height, 0, 0, cv.width - a - b, cv.height)); }
export function flipX(cv) { return pixelCanvas(cv.width, cv.height, (g) => { g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); }); }
export function flipY(cv) { return pixelCanvas(cv.width, cv.height, (g) => { g.translate(0, cv.height); g.scale(1, -1); g.drawImage(cv, 0, 0); }); }
/** solid silhouette of a canvas (all opaque pixels -> colour) */
export function silhouette(cv, c = '#000000') {
  return pixelCanvas(cv.width, cv.height, (g) => { g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = c; g.fillRect(0, 0, cv.width, cv.height); });
}

/**
 * Nearest-neighbour rotation about a pivot (canvas coords, y down). deg > 0 = counter-clockwise ON SCREEN.
 * Returns { cv, px, py }: the rotated canvas and where the pivot sits in it (canvas coords).
 */
export function rotCanvas(src, deg, pivot = [src.width / 2, src.height / 2]) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const [px, py] = pivot; const W = src.width, H = src.height;
  const R = Math.ceil(Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - px, y - py)))) + 1;
  const S = 2 * R + 1;
  const sd = src.getContext('2d').getImageData(0, 0, W, H).data;
  const cv = pixelCanvas(S, S, (g) => {
    const im = g.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - R, dy = y + 0.5 - R;          // dest offset from pivot (y down)
      // screen-CCW rotation by a in y-down coords: dest = [c s; -s c] src  ->  src = [c -s; s c] dest
      const sx = Math.floor(px + c * dx - s * dy), sy = Math.floor(py + s * dx + c * dy);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      const i = (sy * W + sx) * 4, o = (y * S + x) * 4;
      if (sd[i + 3] < 128) continue;
      im.data[o] = sd[i]; im.data[o + 1] = sd[i + 1]; im.data[o + 2] = sd[i + 2]; im.data[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  });
  return { cv, px: R, py: R };
}
/** rotate a canvas point (canvas coords) about pivot like rotCanvas does; returns the point in rotated-canvas coords */
export function rotPoint(p, deg, pivot, R) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = p[0] - pivot[0], dy = p[1] - pivot[1];
  return [R + c * dx + s * dy, R - s * dx + c * dy];
}

// ------------------------------------------------------------------ Jade
/** HUD portrait with hair DOWN (the strip only has the bun + crossed pencils): pencils and bun removed, long hair. */
export function jadePortraitDown(lib) {
  const sp = lib.get('portrait_jade');
  return [0, 1].map((f) => pixelCanvas(32, 32, (g) => {
    g.drawImage(sp.img, f * 32, 0, 32, 32, 0, 0, 32, 32);
    const WELL = [0x1d, 0x20, 0x30];   // HUD well colour: the overlay is opaque so the bun underneath never shows
    const im = g.getImageData(0, 0, 32, 32), d = im.data;
    const get = (x, y) => { const i = (y * 32 + x) * 4; return d[i + 3] < 128 ? null : [d[i], d[i + 1], d[i + 2]]; };
    const put = (x, y, c) => { const i = (y * 32 + x) * 4; if (!c) { d[i + 3] = 0; return; } const [r, gg, b] = hexToRgb(c); d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; };
    const dark = (c) => c && c[0] + c[1] + c[2] < 200;
    // 1. remove bun + pencils: clear rows 0-4, round the crown on row 5
    for (let y = 0; y <= 4; y++) for (let x = 0; x < 32; x++) put(x, y, null);
    for (let x = 0; x < 32; x++) if (get(x, 5) && !dark(get(x, 5))) put(x, 5, '#24202a');
    // 2. long loose hair down both sides of the face to the shoulders
    const HAIR = '#24202a', HL = '#34303a', OUT = '#110f12';
    for (let y = 6; y <= 29; y++) {
      let lx = -1, rx = -1; for (let x = 0; x < 32; x++) { const c = get(x, y); if (c && !dark(c)) { if (lx < 0) lx = x; rx = x; } }
      if (y >= 9 && y <= 22 && lx > 0) { // left of the face
        const x0 = Math.max(3, 6 - Math.floor((y - 9) / 6)); for (let x = x0; x < lx; x++) { const c = get(x, y); if (!c || dark(c)) put(x, y, (x + y) % 5 ? HAIR : HL); } put(x0 - 1, y, OUT);
      }
      if (y >= 23 && y <= 29) { // over the left shoulder
        const x0 = 4 + Math.max(0, y - 27), x1 = 10 - Math.max(0, y - 25); for (let x = x0; x <= x1; x++) put(x, y, (x + y) % 4 ? HAIR : HL); put(x0 - 1, y, OUT); put(x1 + 1, y, OUT);
      }
      if (y >= 9 && y <= 27) { // right side, behind the cheek / neck down to the shoulder
        const x1 = Math.min(27, 25 + Math.floor((y - 9) / 7)); let st = -1; for (let x = 31; x >= 0; x--) { const c = get(x, y); if (c && !dark(c) && !(c[0] > 240 && c[1] > 240)) { st = x; break; } }
        const from = y <= 22 ? Math.max(st + 1, 23) : 23; for (let x = from; x <= x1; x++) { const c = get(x, y); if (!c || dark(c) || y > 22) put(x, y, (x * 3 + y) % 7 ? HAIR : HL); } put(x1 + 1, y, OUT);
      }
    }
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] < 128) { d[i] = WELL[0]; d[i + 1] = WELL[1]; d[i + 2] = WELL[2]; d[i + 3] = 255; }
    g.putImageData(im, 0, 0);
  }));
}
/** jade_draw_graphite with the drawn line + pencil removed (hand stays), for the flipped-pencil erase pose */
export function jadeEmptyHand(lib) {
  const cv = frameCanvas(lib, 'jade_draw_graphite', 0);
  const g = cv.getContext('2d');
  g.clearRect(42, 0, 30, 20); g.clearRect(41, 13, 4, 6);   // the stroke line + the pencil above the fist
  return cv;
}
/** a small in-hand pencil, horizontal, 3 px thick; tip on the LEFT, eraser cap on the RIGHT (flip for the other way).
 *  kind 'graphite' = PINK/ORANGE cap + graphite core; 'rainbow' = BLUE cap + rainbow core. */
export function tinyPencil(kind = 'graphite', len = 14) {
  const cap = kind === 'rainbow' ? [PAL.capBlue, PAL.capBlueLo] : [PAL.capPink, PAL.capPinkLo];
  return pixelCanvas(len, 5, (g, px) => {
    px(1, 0, PAL.ink, len - 1, 5); px(0, 2, PAL.ink, 1, 1); // outline
    px(1, 2, kind === 'rainbow' ? PAL.rainbow[0] : PAL.g0, 1, 1); if (kind === 'rainbow') { px(2, 1, PAL.rainbow[4], 1, 1); px(2, 3, PAL.rainbow[8], 1, 1); px(2, 2, PAL.rainbow[2], 1, 1); } else { px(2, 1, PAL.g1, 1, 3); }
    px(3, 1, PAL.wood, 2, 3);
    px(5, 1, PAL.pencilBody, len - 10, 3); px(5, 1, PAL.pencilBodyHi, len - 10, 1); px(5, 3, PAL.pencilBodyLo, len - 10, 1);
    px(len - 5, 1, PAL.ferrule, 1, 3); px(len - 4, 1, cap[0], 3, 3); px(len - 4, 1, '#ffffff', 1, 1); px(len - 2, 2, cap[1], 1, 2);
  });
}

// ------------------------------------------------------------------ Eraser
// eraser_chase_x2 frame 0 faces right; its eye is around (96..112, 58..72), mouth (80..100, 82..96), canvas coords.
export function eraserBlink(lib) {
  const cv = frameCanvas(lib, 'eraser_chase_x2', 0); const g = cv.getContext('2d');
  const im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
  const body = [0x8a, 0x82, 0x84];
  for (let y = 58; y <= 74; y++) for (let x = 90; x <= 113; x++) { const i = (y * cv.width + x) * 4; if (d[i + 3] < 128) continue; const l = d[i] + d[i + 1] + d[i + 2]; if (l > 400 || l < 120) { d[i] = body[0]; d[i + 1] = body[1]; d[i + 2] = body[2]; } }
  g.putImageData(im, 0, 0);
  g.fillStyle = '#000000'; g.fillRect(93, 66, 18, 2); g.fillRect(91, 64, 3, 2); g.fillRect(110, 64, 2, 2); // shut lid (a flat line)
  for (const [x, y] of [[100, 72], [105, 73]]) g.fillRect(x, y, 2, 1);                                  // lashes
  return cv;
}
/** rainbow smudge across the Eraser's face (it rubbed colour and it won't come off) + sweat-y squint */
export function eraserSmear(lib, frame = 0) {
  const cv = frameCanvas(lib, 'eraser_chase_x2', frame); const g = cv.getContext('2d');
  const im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
  for (let y = 74; y < 112; y++) for (let x = 76; x < 128; x++) {
    const i = (y * cv.width + x) * 4; if (d[i + 3] < 128) continue;
    const l = d[i] + d[i + 1] + d[i + 2]; if (l < 90) continue;                      // keep the black outline / pupils
    const u = (x - 60) * 0.55 + (118 - y) * 0.9;                                       // diagonal smear bands
    const band = Math.floor(u / 3); if (u < 26 || u > 26 + 3 * 6) continue;
    if (((x * 7 + y * 3) % 11) === 0) continue;                                        // rubbed-in grain
    const [r, gg, b] = hexToRgb(PAL.rainbow[(band * 2) % 12]);
    d[i] = (r * 0.8 + d[i] * 0.2) | 0; d[i + 1] = (gg * 0.8 + d[i + 1] * 0.2) | 0; d[i + 2] = (b * 0.8 + d[i + 2] * 0.2) | 0;
  }
  g.putImageData(im, 0, 0);
  return cv;
}

// ------------------------------------------------------------------ props / fx
/** big pixel flower (7x7 head) on a stem: the colour that won't erase */
export function bigFlower(i = 0, stem = 6) {
  const cols = [PAL.rainbow[0], PAL.rainbow[2], PAL.rainbow[11], PAL.rainbow[8], PAL.rainbow[10], PAL.rainbow[3], PAL.rainbow[6]];
  const c = cols[i % cols.length]; const [r, gg, b] = hexToRgb(c); const lo = `rgb(${r * 0.7 | 0},${gg * 0.7 | 0},${b * 0.7 | 0})`;
  return pixelCanvas(9, 9 + stem, (g, px) => {
    const O = PAL.ink;
    px(3, 0, O, 3, 1); px(1, 1, O, 2, 1); px(6, 1, O, 2, 1); px(0, 2, O, 1, 5); px(8, 2, O, 1, 5); px(1, 7, O, 2, 1); px(6, 7, O, 2, 1); px(3, 8, O, 3, 1);
    px(3, 1, c, 3, 7); px(1, 2, c, 7, 5); px(2, 1, c, 1, 1); px(6, 1, c, 1, 1);
    px(1, 5, lo, 2, 2); px(6, 5, lo, 2, 2); px(2, 2, '#ffffff', 1, 1);
    px(3, 3, PAL.yellow, 3, 3); px(4, 4, PAL.orange, 1, 1);
    for (let y = 9; y < 9 + stem; y++) px(4, y, '#3f8a3a'); px(5, 10, '#5cb04a', 2, 1); px(2, 12, '#5cb04a', 2, 1);
  });
}
/** light rubbing streaks left on blank paper by the Eraser */
export function rubStreaks(w, h, seed = 3) {
  const r = mulberry32(seed);
  return pixelCanvas(w, h, (g, px) => {
    for (let k = 0; k < 14; k++) {
      const y0 = Math.floor(r() * h), x0 = Math.floor(r() * w * 0.6), L = 20 + Math.floor(r() * (w * 0.5)), amp = 2 + r() * 4;
      for (let x = 0; x < L; x++) { const y = Math.round(y0 + amp * Math.sin((x / L) * Math.PI)); if ((x + k) % 3 !== 0) px(x0 + x, y, '#ece6da'); }
    }
  });
}
export function sweatDrop() {
  return pixelCanvas(5, 7, (g, px) => { px(2, 0, PAL.ink, 1, 1); px(1, 1, PAL.ink, 3, 1); px(0, 2, PAL.ink, 5, 4); px(1, 6, PAL.ink, 3, 1); px(2, 1, '#bfe6ff', 1, 1); px(1, 2, '#7cc4ff', 3, 4); px(1, 2, '#ffffff', 1, 2); });
}
/** speech-pop burst (jagged) with room for text; text drawn separately */
export function burstCanvas(w, h, fill = '#ffffff', edge = PAL.ink) {
  return pixelCanvas(w, h, (g, px) => {
    const cx = w / 2, cy = h / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy = (y + 0.5 - cy) / (h / 2); const a = Math.atan2(dy, dx);
      const rr = 0.86 + 0.14 * (Math.floor(((a + Math.PI) / (2 * Math.PI)) * 18) % 2);
      const d = Math.hypot(dx, dy);
      if (d < rr) px(x, y, d > rr - 0.12 ? edge : fill);
    }
  });
}
/** graphite wall drawn by the pencil (hatched), with an optional rubbed doorway (blank paper showing through) */
export function wallCanvas(w, h, door = null) {
  const r = mulberry32(9);
  return pixelCanvas(w, h, (g, px) => {
    px(0, 0, PAL.g0, w, h); px(1, 1, PAL.g2, w - 2, h - 2);
    for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) { if ((x + y) % 4 === 0) px(x, y, PAL.g1); else if (r() > 0.93) px(x, y, PAL.g3); }
    for (let y = 6; y < h; y += 12) px(1, y, PAL.g1, w - 2, 1);
    if (door) { // ragged rubbed hole: [x, yTop, dw, dh] in canvas coords (dh from the bottom)
      const [dx, dy, dw, dh] = door;
      for (let y = dy; y < dy + dh; y++) for (let x = dx; x < dx + dw; x++) {
        const edge = Math.min(x - dx, dx + dw - 1 - x, y - dy);
        const rough = (Math.sin(x * 2.1 + y * 1.3) + 1) * 0.9;
        if (edge >= rough) g.clearRect(x, y, 1, 1); else if (edge >= rough - 1) px(x, y, PAL.g4);
      }
      // the arch top
      for (let x = dx + 2; x < dx + dw - 2; x++) g.clearRect(x, dy - 2 + (x === dx + 2 || x === dx + dw - 3 ? 1 : 0), 1, 2);
    }
  });
}
/** coil spring under the coloured 丶 (a function: it springs) */
export function springCanvas(h = 14) {
  return pixelCanvas(13, h, (g, px) => {
    for (let y = 0; y < h; y++) { const ph = Math.floor(y / 2) % 2; px(ph ? 2 : 8, y, PAL.ink, 3, 1); if (y % 2 === 0) px(2, y, PAL.ink, 9, 1); }
    for (let y = 0; y < h; y++) if (y % 2 === 0) px(3, y, PAL.rainbow[(y * 2) % 12], 7, 1);
  });
}
/** motion lines (vertical: falling / rising) */
export function motionLines(n = 3, L = 10, gap = 6, c = PAL.g2) { return pixelCanvas(n * gap, L + 4, (g, px) => { for (let i = 0; i < n; i++) px(i * gap + 1, (i % 2) * 3, c, 1, L - (i % 2) * 3); }); }
/** dotted bounce arc from (0,0) to (w, h) (canvas y down: start bottom-left, end top-right) */
export function arcDots(w, h, apex = 20, c = PAL.ink) {
  return pixelCanvas(w + 2, h + apex + 2, (g, px) => {
    for (let i = 0; i <= 24; i++) { const u = i / 24; const x = u * w; const y = h * u + apex * 4 * u * (1 - u); if (i % 2 === 0) px(Math.round(x), Math.round(h + apex - y), c, 2, 2); }
    // arrow head at the end
    px(w - 3, apex - 1, c, 2, 2); px(w - 5, apex + 1, c, 2, 2); px(w, apex + 2, c, 2, 2);
  });
}
/** HUD: lit frame around the acting hero's portrait well (36x36) */
export function hudHi(w = 36, h = 36, c = PAL.yellow) { return pixelCanvas(w, h, (g, px) => { px(0, 0, c, w, 2); px(0, h - 2, c, w, 2); px(0, 0, c, 2, h); px(w - 2, 0, c, 2, h); px(0, 0, '#ffffff', 4, 1); px(w - 4, h - 1, '#ffffff', 4, 1); }); }
/** ragged paper edge (torn), to overlay where the page ends into the VOID; paper on the left */
export function tornEdge(h, seed = 5) {
  const r = mulberry32(seed);
  return pixelCanvas(10, h, (g, px) => { let w = 4; for (let y = 0; y < h; y++) { w = Math.max(1, Math.min(9, w + Math.round((r() - 0.5) * 3))); px(0, y, PAL.paper, w, 1); px(w, y, PAL.g3, 1, 1); } });
}
/** chain link sprites in visited purple, drawn along a path (returns a canvas covering the bbox) */
export function linkCanvas(c = '#7a3cff', hi = '#c2a0ff', vertical = false) {
  return vertical ? pixelCanvas(4, 6, (g, px) => { px(0, 1, c, 4, 4); px(1, 0, c, 2, 6); g.clearRect(1, 2, 2, 2); px(0, 1, hi, 1, 2); })
    : pixelCanvas(6, 4, (g, px) => { px(1, 0, c, 4, 4); px(0, 1, c, 6, 2); g.clearRect(2, 1, 2, 2); px(1, 0, hi, 2, 1); });
}
/** canopy strings from a parachute rim down to the hands */
export function stringsCanvas(w, h, c = PAL.g0) {
  return pixelCanvas(w, h, (g, px) => { const cx = w / 2; for (let y = 0; y < h; y++) { const u = y / (h - 1); px(Math.round(u * (cx - 2)), y, c); px(Math.round(w - 1 - u * (cx - 2)), y, c); } });
}
/** solid silhouette with a 1px rim light around it (reads against dark or busy backdrops) */
export function rimSilhouette(cv, fill = '#000000', rim = '#fff6d0') {
  const W = cv.width + 2, H = cv.height + 2; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < cv.width && y < cv.height && d[(y * cv.width + x) * 4 + 3] >= 128;
  return pixelCanvas(W, H, (g, px) => {
    for (let y = -1; y <= cv.height; y++) for (let x = -1; x <= cv.width; x++) {
      if (on(x, y)) px(x + 1, y + 1, fill);
      else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) px(x + 1, y + 1, rim);
    }
  });
}
/** the giant "life" sign, BACKLIT for the freeze: bright panel, warm bulb letters (silhouettes read in front of it) */
export function lifeSignBacklit(W = 204, X0 = 22) {
  const H = 60;
  return pixelCanvas(W, H, (g, px) => {
    px(0, 0, '#3a2f10', W, H); px(2, 2, '#fff1c4', W - 4, H - 4); px(4, 4, '#fff8e2', W - 8, H - 8);
    for (let x = 4; x < W - 4; x += 6) { px(x, 1, '#ffd23f', 2, 1); px(x, H - 2, '#ffd23f', 2, 1); }
    // 'life' in 6px bulbs (5x7 glyph grid, hand-set)
    const G = { l: ['11000', '01000', '01000', '01000', '01000', '01000', '11100'], i: ['01000', '00000', '11000', '01000', '01000', '01000', '11100'],
      f: ['00110', '01000', '11110', '01000', '01000', '01000', '01000'], e: ['00000', '00000', '01110', '10001', '11111', '10000', '01111'] };
    let X = X0;
    for (const ch of 'life') { const gl = G[ch]; for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (gl[r][c] === '1') { px(X + c * 6, 8 + r * 6, '#ff9a1a', 5, 5); px(X + c * 6 + 1, 9 + r * 6, '#ffd23f', 2, 2); } X += ch === 'l' || ch === 'i' ? 26 : 40; }
  });
}
