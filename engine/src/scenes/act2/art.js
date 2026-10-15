// Procedural pixel art for ACT II (VOID / EDITOR): fixture (graphite gray-box) and function (alive, coloured)
// tiles in the k06 style, pages/docs/manuals that stream like clouds, a pixel book, springs, door, waterfall.
import { pixelCanvas } from '../../core/gfx.js';
import { PAL } from '../../core/palette.js';
import { mulberry32 } from '../../util.js';

export const TILE = 16;
const OUT = '#14121c';
/** FIXTURES: graphite gray-box block (hatched, pencil outline) */
export function fixtureTile(v = 0) {
  return pixelCanvas(16, 16, (g, px) => {
    px(0, 0, PAL.g1, 16, 16); px(1, 1, PAL.g4, 14, 14); px(1, 1, PAL.g5, 14, 1); px(1, 1, PAL.g5, 1, 14); px(14, 2, PAL.g3, 1, 13); px(2, 14, PAL.g3, 12, 1);
    for (let i = 0; i < 6; i++) { const x = 3 + i * 2 + (v % 2); px(x, 4 + (i % 3), PAL.g3, 1, 4); }
  });
}
/** FUNCTIONS: grass top tile */
export function grassTile(v = 0) {
  const r = mulberry32(v + 3);
  return pixelCanvas(16, 16, (g, px) => {
    px(0, 0, '#5a3418', 16, 16); px(0, 5, '#8a5428', 16, 11); px(0, 15, '#5a3418', 16, 1);
    for (let i = 0; i < 6; i++) px(Math.floor(r() * 14) + 1, 7 + Math.floor(r() * 7), i % 2 ? '#a8703a' : '#6e4220', 2, 1);
    px(0, 0, '#2f7a2a', 16, 5); px(0, 0, '#5cc04a', 16, 2); px(0, 2, '#3f9a36', 16, 1);
    for (let x = 0; x < 16; x += 3) px(x + (v % 2), 5, '#2f7a2a', 1, 1 + ((x + v) % 2));
    px(0, 0, OUT, 16, 1);
  });
}
export function dirtTile(v = 0) {
  const r = mulberry32(v + 11);
  return pixelCanvas(16, 16, (g, px) => { px(0, 0, '#8a5428', 16, 16); for (let i = 0; i < 7; i++) px(Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, i % 2 ? '#a8703a' : '#6e4220', 2, 1); });
}
/** a coloured "alive" block (functions version of a floating fixture block) */
export function brickTile(v = 0) {
  return pixelCanvas(16, 16, (g, px) => {
    px(0, 0, OUT, 16, 16); px(1, 1, '#e88a3a', 14, 14); px(1, 1, '#ffc27a', 14, 2); px(1, 7, '#b85a20', 14, 1);
    px(8, 1, '#b85a20', 1, 6); px(4, 8, '#b85a20', 1, 7); px(12, 8, '#b85a20', 1, 7);
  });
}
export function springCanvas(state = 0, alive = true) {
  // state 0 compressed, 1 extended
  const h = state ? 22 : 12;
  return pixelCanvas(14, 24, (g, px) => {
    const top = 24 - h;
    px(0, 21, alive ? '#c42a3a' : PAL.g1, 14, 3); px(0, top, alive ? '#e8344a' : PAL.g2, 14, 3); px(1, top, alive ? '#ff8a8a' : PAL.g4, 12, 1);
    const n = 4; for (let i = 0; i < n; i++) { const y = top + 3 + Math.round(i * (h - 6) / n); px(2, y, alive ? '#dcdce4' : PAL.g3, 10, 1); px(i % 2 ? 2 : 10, y, alive ? '#9a9aa8' : PAL.g2, 2, Math.max(1, Math.round((h - 6) / n))); }
  });
}
export function doorCanvas(open = 0, alive = true) {
  return pixelCanvas(20, 30, (g, px) => {
    px(0, 0, OUT, 20, 30); px(1, 1, alive ? '#ffe9a0' : PAL.g5, 18, 29);
    const w = Math.round(18 * (1 - open));
    if (w > 0) { px(1, 1, alive ? '#a86a2a' : PAL.g3, w, 29); px(1, 1, alive ? '#c88a4a' : PAL.g4, w, 2); if (w > 6) px(w - 3, 15, alive ? PAL.yellow : PAL.g1, 2, 2); }
  });
}
export function waterCanvas(f, h = 64) {
  return pixelCanvas(12, h, (g, px) => {
    px(0, 0, '#2b6ae8', 12, h);
    for (let y = 0; y < h; y++) { const k = (y + f * 3) % 8; if (k < 2) px(2 + (y % 3), y, '#8fd0ff', 3, 1); if (k === 4) px(7, y, '#5aa8ff', 2, 1); }
    px(0, 0, '#1a3fa8', 1, h); px(11, 0, '#1a3fa8', 1, h);
  });
}
/** pages / docs / manuals / forum threads that stream past like clouds */
export function pageCanvas(kind, seed = 1) {
  const r = mulberry32(seed);
  if (kind === 'manual') return pixelCanvas(30, 38, (g, px) => {
    px(0, 0, OUT, 30, 38); px(1, 1, '#2f5fd0', 28, 36); px(1, 1, '#5a88ff', 28, 2); px(3, 1, '#1a3fa8', 2, 36);
    px(8, 8, '#ffe9a0', 18, 3); px(8, 14, '#cfe0ff', 14, 2); px(8, 18, '#cfe0ff', 10, 2); px(26, 33, '#ffffff', 2, 2);
  });
  if (kind === 'forum') return pixelCanvas(52, 30, (g, px) => {
    px(0, 0, OUT, 52, 30); px(1, 1, '#f4f1ea', 50, 28);
    for (let k = 0; k < 3; k++) { const y = 3 + k * 9; px(3, y, ['#ff7a3d', '#3ad06a', '#a35cff'][k], 5, 5); px(10, y, '#6b6b72', 8 + Math.floor(r() * 10), 1); px(10, y + 3, '#b8b8c0', 20 + Math.floor(r() * 18), 1); }
  });
  if (kind === 'code') return pixelCanvas(44, 34, (g, px) => {
    px(0, 0, OUT, 44, 34); px(1, 1, '#1d2236', 42, 32); px(1, 1, '#323a5c', 42, 4); px(3, 2, '#e8344a', 2, 2); px(6, 2, '#ffd23f', 2, 2); px(9, 2, '#3ad06a', 2, 2);
    for (let k = 0; k < 6; k++) { const y = 8 + k * 4, ind = [0, 3, 3, 6, 3, 0][k]; px(4 + ind, y, ['#ff7ac8', '#7cc4ff', '#ffd23f', '#9cf0a0'][k % 4], 4 + Math.floor(r() * 6), 1); px(12 + ind + Math.floor(r() * 4), y, '#c8cce0', 6 + Math.floor(r() * 14), 1); }
  });
  // plain page (docs / README)
  return pixelCanvas(34, 42, (g, px) => {
    px(0, 0, OUT, 34, 42); px(1, 1, '#ffffff', 32, 40); px(25, 1, OUT, 8, 1); px(26, 1, '#d8d8e0', 7, 7); // dog ear
    px(4, 5, '#2b2b33', 14, 2);
    for (let k = 0; k < 7; k++) px(4, 11 + k * 4, '#9a9aa2', 18 + Math.floor(r() * 9), 1);
  });
}
export function bookCanvas() {
  return pixelCanvas(26, 14, (g, px) => {
    px(0, 2, OUT, 26, 12); px(1, 3, '#2f5fd0', 24, 10);           // cover
    px(1, 0, OUT, 11, 12); px(14, 0, OUT, 11, 12);                 // pages
    px(2, 1, '#ffffff', 10, 10); px(14, 1, '#ffffff', 10, 10); px(12, 1, '#c8c8d0', 2, 11);
    for (let k = 0; k < 4; k++) { px(3, 3 + k * 2, '#9a9aa2', 7, 1); px(15, 3 + k * 2, '#9a9aa2', 7, 1); }
  });
}
/** start-gate lamp board: lit = number of red lamps on, green = go */
export function lampCanvas(lit, green) {
  return pixelCanvas(16, 34, (g, px) => {
    px(7, 24, PAL.g2, 2, 10);
    px(0, 0, OUT, 16, 26); px(1, 1, '#2a2d3a', 14, 24);
    for (let k = 0; k < 3; k++) {
      const y = 2 + k * 8, on = green ? true : k < lit, c = green ? '#3ad06a' : '#e8344a';
      px(4, y, OUT, 8, 6); px(5, y + 1, on ? c : '#3a1a20', 6, 4); if (on) px(5, y + 1, '#ffffff', 2, 1);
    }
  });
}
