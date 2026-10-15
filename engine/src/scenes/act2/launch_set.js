// The 出发 launch set at the end of ACT II (state at the 77.757 handoff to Team B: see engine/HANDOFF_77.md).
// Import it to rebuild the exact frame:  const set = await buildLaunchSet(st, ctx); set.update(t);
import * as T from '../../show/timing.js';
import { Z } from '../../core/stage2d.js';
import { Quad, canvasTex } from '../../core/gfx.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { BlueprintBG } from '../../core/fx.js';
import { grassTile, dirtTile, lampCanvas } from './art.js';
import { cubeCanvas } from '../act1/kaizo_art.js';
import { PAL } from '../../core/palette.js';

export const LAUNCH = {
  t: 77.757,                               // bar 47 downbeat (triplet roll starts)
  camera: { x: 192, y: 90, zoom: 1 },
  groundTop: 60, groundX: [-208, 432],      // multiples of 16 (tile grid)
  party: { ricky: 74, charlie: 104, jade: 136 },
  chu: { x: 180, y: 60, size: 96, erupt: 73.057 },
  fa: { x: 262, y: 60, size: 96, erupt: 73.555 },
  lights: { x: 158, reds: [75.27, 76.10, 76.93], green: 77.757 },
};

export async function buildLaunchSet(st, ctx, { withBackground = true } = {}) {
  const L = LAUNCH;
  const bg = withBackground ? st.add(new BlueprintBG(), Z.BG) : null;
  const gT = [0, 1, 2].map((v) => canvasTex(grassTile(v))), dT = [0, 1].map((v) => canvasTex(dirtTile(v)));
  const ground = [];
  for (let x = L.groundX[0]; x < L.groundX[1]; x += 16) {
    const k = ((Math.floor(x / 16) % 3) + 3) % 3;
    for (let row = 0; row < 4; row++) { const q = st.add(new Quad(row === 0 ? gT[k] : dT[(Math.floor(x / 16) + row) & 1], 16, 16), Z.PLATFORM); q.place(x, L.groundTop - 16 * (row + 1)); ground.push(q); }
  }
  const mk = async (ch, c) => { const h = await Hanzi2D.create(ch, { size: c.size, style: 'rainbow', shadowColor: '#0a1030', bold: 2 }); h.place(c.x, c.y); st.add(h.group, Z.PLATFORM + 2); return h; };
  const chu = await mk('出', L.chu), fa = await mk('发', L.fa);
  chu.plan(L.chu.erupt - 0.06, L.chu.erupt + 0.3, { gap: 0.06 }); fa.plan(L.fa.erupt - 0.06, L.fa.erupt + 0.36, { gap: 0.06 });
  const lampTex = [0, 1, 2, 3].map((n) => canvasTex(lampCanvas(n, false))), lampGo = canvasTex(lampCanvas(3, true));
  const lamp = st.add(new Quad(lampTex[0], 16, 34, { anchor: [8, 0] }), Z.PROP); lamp.place(L.lights.x, L.groundTop);
  const cubes = [[40, 118, 20], [300, 112, 16], [340, 140, 24], [-20, 110, 18]].map(([x, y, s], i) => { const cv = cubeCanvas(s, PAL.gizmoBlue, i % 2 === 1); const q = st.add(new Quad(canvasTex(cv), cv.width, cv.height), Z.PARALLAX); return { q, x, y }; });
  return {
    bg, chu, fa, lamp, ground,
    update(t) {
      if (bg) { bg.cover(st.cam); bg.u.uTime.value = t; }
      chu.apply(t); fa.apply(t);
      const sh = t > L.fa.erupt + 0.4 ? (t - L.fa.erupt) * 0.25 : 0; chu.u.uHueShift.value = sh; fa.u.uHueShift.value = sh;
      // erupting: the characters rise out of the ground as their strokes draw
      const rise = (h, c) => { const k = T.span(t, c.erupt - 0.06, c.erupt + 0.18, T.ease.back); h.place(c.x, c.y - Math.round((1 - k) * 40)); h.group.visible = t >= c.erupt - 0.06; };
      rise(chu, L.chu); rise(fa, L.fa);
      const n = L.lights.reds.filter((e) => T.on(t, e)).length;
      lamp.material.setMap(T.on(t, L.lights.green) ? lampGo : lampTex[n]); lamp.visible = t >= L.lights.reds[0] - 1.2;
      const left = st.cam.left; cubes.forEach((c, i) => c.q.place(c.x + (left - 32) * 0.6, c.y + Math.round(3 * Math.sin(t * 1.1 + i))));
    },
  };
}
