#!/usr/bin/env node
// Generates PLACEHOLDER pixel-art sprite strips for the three heroes.
// Output: assets/sprites/<name>.png (horizontal strip, FRAME_W x FRAME_H per frame,
// transparent background) + <name>.json sidecar describing frames/anims.
// Real sprite sheets can replace these PNGs as long as they keep the same layout
// (or update the sidecar JSON).
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'assets', 'sprites');
fs.mkdirSync(OUT, { recursive: true });

const FW = 24, FH = 40;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];

class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = c; }
  get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.d[y * this.w + x]; }
  rect(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.px(x, y, c); }
  hline(x0, x1, y, c) { this.rect(x0, y, x1, y, c); }
  vline(x, y0, y1, c) { this.rect(x, y0, x, y1, c); }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
        if (dx * dx + dy * dy <= 1) this.px(x, y, c);
      }
  }
  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) this.px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  }
  // recolor pixels of color `from` inside a rect
  swap(x0, y0, x1, y1, from, to) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.get(x, y) === from) this.px(x, y, to);
  }
  // selective outline: transparent pixels touching the silhouette get a darkened
  // version of the neighbouring colour (classic 16-bit "sel-out").
  outline(dark = 0.38) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      const nb = [this.get(x - 1, y), this.get(x + 1, y), this.get(x, y - 1), this.get(x, y + 1)].filter(Boolean);
      if (nb.length) {
        const c = hex(nb[0]);
        add.push([x, y, c.map((v, i) => i < 3 ? Math.round(v * dark + 10 * (1 - dark) * 0.5) : 255)]);
      }
    }
    for (const [x, y, c] of add) this.d[y * this.w + x] = c;
  }
  rgba(x, y) { const c = this.get(x, y); if (!c) return [0, 0, 0, 0]; return Array.isArray(c) ? c : hex(c); }
}

// ---------------------------------------------------------------- characters
// All sprites are drawn 3/4-front facing, feet on the bottom row (y = 39).
// `f` is the frame index; frame 1 is a 1px "breath" (upper body down 1px).

function jade(f) {
  const c = new Canvas(FW, FH);
  const SK = '#f2c6a2', SKs = '#d39a7a', HR = '#16141b', HRh = '#3b3747';
  const WH = '#f3f2ee', WHs = '#c3c7d2', OR = '#ff7a1a', ORd = '#c4520b';
  const TOP = '#1b1b20', NV = '#1f2a46', NVs = '#121a2e', SN = '#f6f6f6', SO = '#a9adb6';
  const BL = '#3b7bff', BLd = '#1f4fc4';
  const b = f === 1 ? 1 : 0; // breathing offset for upper body
  // back hair, hanging down behind the jacket to the waist
  c.rect(5, 6 + b, 18, 23 + b, HR); c.rect(6, 24 + b, 17, 24 + b, HR);
  // legs: wide navy cargo pants
  c.rect(6, 23, 11, 36, NV); c.rect(12, 23, 17, 36, NV);
  c.vline(11, 26, 36, NVs); c.vline(17, 24, 36, NVs); c.vline(12, 26, 36, NVs);
  c.rect(7, 29, 9, 31, NVs); c.rect(14, 29, 16, 31, NVs); // cargo pockets
  c.vline(7, 24, 34, OR); c.vline(16, 24, 34, OR); // orange straps
  c.px(7, 35, ORd); c.px(16, 35, ORd);
  // chunky sneakers
  c.rect(5, 37, 11, 38, SN); c.rect(12, 37, 18, 38, SN); c.hline(5, 11, 39, SO); c.hline(12, 18, 39, SO);
  c.px(8, 37, SO); c.px(15, 37, SO);
  // midriff + black crop top
  c.rect(8, 20 + b, 15, 22, SK); c.hline(8, 15, 22, SKs);
  c.rect(8, 14 + b, 15, 19 + b, TOP);
  // white cropped jacket (open), sleeves
  c.rect(5, 13 + b, 8, 21 + b, WH); c.rect(15, 13 + b, 18, 21 + b, WH);
  c.rect(3, 15 + b, 5, 25, WH); c.rect(18, 15 + b, 20, 25, WH);
  c.vline(5, 16 + b, 25, WHs); c.vline(18, 16 + b, 25, WHs); c.vline(8, 14 + b, 21 + b, WHs);
  // orange stripes across sleeves + chest
  c.hline(3, 8, 18 + b, OR); c.hline(15, 20, 18 + b, OR);
  c.px(17, 15 + b, BL); c.px(16, 15 + b, '#7fb0ff'); // round blue patch
  // hands
  c.rect(3, 26, 5, 27, SK); c.rect(18, 26, 20, 27, SK); c.px(5, 27, SKs); c.px(20, 27, SKs);
  // long black hair: front strands over the shoulders (back hair is drawn first, below)
  c.rect(6, 4 + b, 17, 12 + b, HR); c.vline(6, 12 + b, 19 + b, HR); c.vline(17, 12 + b, 19 + b, HR);
  c.vline(7, 12 + b, 16 + b, HR); c.vline(16, 12 + b, 16 + b, HR);
  // face
  c.rect(8, 6 + b, 15, 12 + b, SK); c.hline(9, 14, 13 + b, SK); c.vline(15, 7 + b, 12 + b, SKs);
  c.hline(8, 15, 5 + b, HR); c.rect(8, 6 + b, 10, 6 + b, HR); c.rect(13, 6 + b, 15, 6 + b, HR); // bangs
  c.px(10, 9 + b, '#1a1420'); c.px(13, 9 + b, '#1a1420'); // eyes
  c.px(10, 8 + b, HRh); c.px(13, 8 + b, HRh);
  c.px(11, 11 + b, SKs); c.hline(11, 12, 12 + b, '#c9746a'); // nose, mouth
  // orange headphones around neck
  c.hline(8, 15, 14 + b, ORd); c.rect(7, 13 + b, 8, 15 + b, OR); c.rect(15, 13 + b, 16, 15 + b, OR);
  // bun on top
  c.ellipse(11.5, 2.5 + b, 3, 2, HR); c.px(10, 1 + b, HRh); c.px(11, 1 + b, HRh);
  // two pencils through the bun, eraser caps sticking out (bible v1.1):
  //  left  = graphite FIXTURES pencil, pink/orange eraser cap
  //  right = every-colour FUNCTIONS pencil (rainbow body), blue eraser cap
  c.line(6, 1 + b, 11, 4 + b, '#8a8f99'); c.px(7, 1 + b, '#6b707a'); c.px(5, 0 + b, '#c9cdd4'); c.px(4, 0 + b, '#ff8a6e');
  const RB = ['#ff4d4d', '#ffb21a', '#ffe14d', '#4dd16b', '#3b7bff', '#a24dff'];
  for (let k = 0; k < 6; k++) c.px(17 - k, Math.round(0 + b + k * 0.6), RB[k]);
  c.px(18, 0 + b, '#c9cdd4'); c.px(19, 0 + b, BL);
  c.outline();
  return c;
}

function charlie(f) {
  const c = new Canvas(FW, FH);
  const SK = '#e7b48f', SKs = '#c18a68', HR = '#2b1d15', CAP = '#d8c39d', CAPs = '#b29b74', CAPh = '#eadcbf';
  const TEE = '#3c3c42', TEEs = '#2a2a2f', JN = '#3f5f90', JNs = '#2c466f', JNh = '#5a7bb0';
  const BT = '#6b4428', BTs = '#4a2d19', STR = '#7a4a26', GT = '#b9824a', GTd = '#8a5a2e';
  const b = f === 1 ? 1 : 0;
  // guitar on back: body peeks out on the left, neck over right shoulder
  c.ellipse(4.5, 23 + b, 2.5, 4, GT); c.vline(4, 20 + b, 26 + b, GTd);
  c.line(18, 13 + b, 21, 3 + b, GTd); c.rect(20, 1 + b, 22, 3 + b, '#5a3a1e');
  // jeans
  c.rect(7, 25, 11, 36, JN); c.rect(12, 25, 16, 36, JN);
  c.vline(11, 26, 36, JNs); c.vline(16, 25, 36, JNs); c.vline(8, 27, 35, JNh); c.vline(13, 27, 35, JNh);
  c.hline(7, 16, 25, JNs);
  // brown boots
  c.rect(6, 37, 11, 39, BT); c.rect(12, 37, 17, 39, BT); c.hline(6, 11, 39, BTs); c.hline(12, 17, 39, BTs);
  c.px(9, 37, BTs); c.px(14, 37, BTs);
  // charcoal tee + arms
  c.rect(6, 13 + b, 17, 24, TEE); c.vline(17, 14 + b, 24, TEEs); c.hline(6, 17, 24, TEEs);
  c.rect(4, 14 + b, 6, 18 + b, TEE); c.rect(17, 14 + b, 19, 18 + b, TEE);
  c.rect(4, 19 + b, 5, 24, SK); c.rect(18, 19 + b, 19, 24, SK); c.vline(5, 19 + b, 24, SKs); c.vline(19, 19 + b, 24, SKs);
  // diagonal guitar strap
  c.line(16, 13 + b, 8, 23, STR); c.line(17, 13 + b, 9, 23, STR);
  // neck + face
  c.rect(10, 12 + b, 13, 13 + b, SKs);
  c.rect(7, 5 + b, 16, 11 + b, SK); c.hline(8, 15, 12 + b, SK); c.vline(16, 6 + b, 11 + b, SKs);
  c.px(9, 8 + b, '#1d140f'); c.px(13, 8 + b, '#1d140f'); c.hline(9, 10, 7 + b, HR); c.hline(13, 14, 7 + b, HR);
  c.px(11, 10 + b, SKs); c.hline(10, 13, 11 + b, '#b46a58');
  // curly dark hair poking from under the cap
  c.px(6, 6 + b, HR); c.px(6, 8 + b, HR); c.px(17, 6 + b, HR); c.px(17, 8 + b, HR); c.px(6, 7 + b, '#4a3324'); c.px(17, 7 + b, '#4a3324');
  c.px(7, 9 + b, HR); c.px(16, 9 + b, HR);
  // beige newsboy flat cap (wide, brim to the right)
  c.ellipse(11.5, 3 + b, 6, 2.6, CAP); c.hline(6, 18, 5 + b, CAPs); c.hline(14, 19, 6 + b, CAPs);
  c.hline(9, 13, 1 + b, CAPh); c.px(11, 0 + b, CAPs);
  c.outline();
  return c;
}

function ricky(f) {
  const c = new Canvas(FW, FH);
  const SK = '#eabf98', SKs = '#c4936f', HR = '#121216', HRh = '#2e2e38';
  const SW = '#f4f6fb', SB = '#5f86c8', SBd = '#3f62a0';
  const JN = '#4a6a9c', JNs = '#334f7c', SN = '#f2f2f2', SO = '#b1b4bb';
  const WD = '#d9a15c', WDd = '#a8712f', PG = '#f5f1e6', NK = '#c98f4c';
  const b = f === 1 ? 1 : 0;
  // jeans
  c.rect(7, 25, 11, 36, JN); c.rect(12, 25, 16, 36, JN); c.vline(11, 26, 36, JNs); c.vline(16, 25, 36, JNs);
  // white sneakers
  c.rect(6, 37, 11, 38, SN); c.rect(12, 37, 17, 38, SN); c.hline(6, 11, 39, SO); c.hline(12, 17, 39, SO);
  // striped shirt: vertical blue/white stripes
  c.rect(6, 13 + b, 17, 25, SW);
  for (let x = 6; x <= 17; x += 2) c.vline(x, 13 + b, 25, SB);
  c.vline(17, 14 + b, 25, SBd);
  c.rect(4, 14 + b, 6, 19 + b, SW); c.rect(17, 14 + b, 19, 19 + b, SW); c.vline(5, 14 + b, 19 + b, SB); c.vline(18, 14 + b, 19 + b, SB);
  c.hline(4, 6, 19 + b, SBd); c.hline(17, 19, 19 + b, SBd); // rolled cuffs
  c.rect(4, 20 + b, 5, 23, SK); c.rect(18, 20 + b, 19, 22 + b, SK);
  c.hline(9, 14, 13 + b, SW); c.px(11, 14 + b, SBd); c.px(12, 14 + b, SBd); // collar
  // natural-wood strat held across the body
  c.ellipse(9, 23, 4, 3, WD); c.ellipse(8, 22, 2, 1.5, PG); c.px(10, 23, '#333333'); c.px(11, 22, '#888888');
  c.hline(5, 13, 26, WDd); c.px(13, 24, WDd);
  c.line(12, 21, 21, 13, NK); c.line(13, 21, 22, 13, NK); c.rect(21, 11, 23, 13, WDd);
  c.rect(17, 16 + b, 18, 17 + b, SK); // fretting hand on neck
  c.rect(10, 20, 11, 21, SK); // strumming hand
  // strap
  c.line(16, 13 + b, 14, 20, '#24324f');
  // neck, face, short black hair
  c.rect(10, 12 + b, 13, 12 + b, SKs);
  c.rect(7, 5 + b, 16, 11 + b, SK); c.hline(8, 15, 12 + b, SK); c.vline(16, 6 + b, 11 + b, SKs);
  c.px(9, 8 + b, '#141016'); c.px(13, 8 + b, '#141016'); c.hline(9, 10, 7 + b, HR); c.hline(13, 14, 7 + b, HR);
  c.px(11, 10 + b, SKs); c.hline(10, 12, 11 + b, '#b36a5a');
  c.rect(6, 1 + b, 17, 4 + b, HR); c.rect(6, 5 + b, 7, 7 + b, HR); c.rect(16, 5 + b, 17, 7 + b, HR);
  c.px(7, 0 + b, HR); c.px(10, 0 + b, HR); c.px(13, 0 + b, HR); c.px(16, 0 + b, HR); // spikes
  c.hline(9, 14, 5 + b, HR); c.px(9, 2 + b, HRh); c.px(12, 2 + b, HRh); c.px(15, 3 + b, HRh);
  c.outline();
  return c;
}

const CHARS = { jade, charlie, ricky };
const NFRAMES = 2;

for (const [name, fn] of Object.entries(CHARS)) {
  const png = new PNG({ width: FW * NFRAMES, height: FH });
  for (let f = 0; f < NFRAMES; f++) {
    const c = fn(f);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const [r, g, bb, a] = c.rgba(x, y);
      const i = (y * png.width + f * FW + x) * 4;
      png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = bb; png.data[i + 3] = a;
    }
  }
  fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(png));
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({
    image: `${name}.png`, frameWidth: FW, frameHeight: FH, frames: NFRAMES,
    anims: { idle: { frames: [0, 1], fps: 2 } },
    // voxel extrusion hints (see src/voxel.js): pillow depth = clamp(base + k*distToEdge, base, max)
    voxel: { baseDepth: 2, depthPerPixel: 2, maxDepth: 10 },
  }, null, 2));
  console.log('wrote', name);
}
