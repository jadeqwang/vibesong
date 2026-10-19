// The 出发 launch set at the end of ACT II (state at the 77.757 handoff to Team B: see engine/HANDOFF_77.md).
// Import it to rebuild the exact frame:  const set = await buildLaunchSet(st, ctx); set.update(t);
// v5 (game-design pass): three PRESSURE PLATES (one per hero, flush with the ground, latched once pressed: the exit
// opens only when all three are on them), wires from the plates to the gate, and the gate's strokes drawn one by one
// on the frames listed in act2/plan.js (each stroke = +1 LINE OF CODE).
import * as T from '../../show/timing.js';
import { Z } from '../../core/stage2d.js';
import { Quad, canvasTex, pixelCanvas } from '../../core/gfx.js';
import { Hanzi2D } from '../../core/hanzi2d.js';
import { BlueprintBG } from '../../core/fx.js';
import { TextSprite } from '../../core/text.js';
import { grassTile, dirtTile, lampCanvas } from './art.js';
import { cubeCanvas } from '../act1/kaizo_art.js';
import { PAL } from '../../core/palette.js';
import { plan, LAY } from './plan.js';

export const LAUNCH = {
  t: 77.757,                               // bar 47 downbeat (triplet roll starts)
  camera: { x: 192, y: 90, zoom: 1 },
  groundTop: 60, groundX: [-208, 432],      // multiples of 16 (tile grid)
  party: { ricky: 54, charlie: 96, jade: 138 },   // v6: spread 42 px (one plate each)
  // pressure plates: centred on the party x, pressed (flush with groundTop, feet stay at y = 60) at these times.
  // Front to back, one per chant syllable: Jade 从, Charlie 这里, Ricky (trailing, heaviest) 出 completes the exit.
  plates: { w: 26, step: { jade: 72.466, charlie: 72.656, ricky: 73.057 } },
  chu: { x: 180, y: 60, size: 96, erupt: 73.057 },
  fa: { x: 262, y: 60, size: 96, erupt: 73.555 },
  lights: { x: 158, reds: [75.27, 76.10, 76.93], green: 77.757 },
};

/** recessed pressure plate: frame flush with the ground top; the pad sticks up 2 px until pressed, then glows */
function plateCanvas(on, w = LAUNCH.plates.w) {
  return pixelCanvas(w, 6, (g, px) => {
    const OUT = '#14121c';
    px(0, 2, OUT, w, 4); px(1, 3, '#6b6b72', w - 2, 3); px(1, 3, '#9a9aa2', w - 2, 1);      // frame (rows 2..5 = y 56..59)
    if (on) { px(3, 2, '#ffe14d', w - 6, 2); px(4, 2, '#ffffff', 4, 1); }                  // pressed flush, glowing
    else { px(2, 0, OUT, w - 4, 3); px(3, 1, '#e8344a', w - 6, 2); px(3, 1, '#ff8a8a', w - 6, 1); } // raised red pad (y 58..61)
  });
}

/**
 * opts: withBackground (true), withGround (true: always-visible grass ground; Act II draws its own hat-seeded ground),
 *       platesFrom / lampFrom (time the plates / lamp appear; default: always / 1.2 s before the first red)
 */
for (const [h, x] of Object.entries(LAUNCH.party)) if (LAY.plates[h] !== x) console.warn('launch_set: LAUNCH.party / plan LAY.plates mismatch for ' + h);

export async function buildLaunchSet(st, ctx, { withBackground = true, withGround = true, platesFrom = -1e9, lampFrom = LAUNCH.lights.reds[0] - 1.2 } = {}) {
  const L = LAUNCH;
  const bg = withBackground ? st.add(new BlueprintBG(), Z.BG) : null;
  const gT = [0, 1, 2].map((v) => canvasTex(grassTile(v))), dT = [0, 1].map((v) => canvasTex(dirtTile(v)));
  const ground = [];
  if (withGround) for (let x = L.groundX[0]; x < L.groundX[1]; x += 16) {
    const k = ((Math.floor(x / 16) % 3) + 3) % 3;
    for (let row = 0; row < 4; row++) { const q = st.add(new Quad(row === 0 ? gT[k] : dT[(Math.floor(x / 16) + row) & 1], 16, 16), Z.PLATFORM); q.place(x, L.groundTop - 16 * (row + 1)); ground.push(q); }
  }
  // plates + wires (wire = 1 px dots on the ground surface from each plate to the foot of 出)
  const pOff = canvasTex(plateCanvas(false)), pOn = canvasTex(plateCanvas(true));
  const plates = Object.entries(L.party).map(([hero, x]) => {
    const q = st.add(new Quad(pOff, L.plates.w, 6, { anchor: [Math.floor(L.plates.w / 2), 0] }), Z.PLATFORM + 3); q.place(x, L.groundTop - 4);
    const x0 = x + L.plates.w / 2, x1 = L.chu.x + 6, n = Math.max(1, Math.floor((x1 - x0) / 3));
    const wcv = (on) => pixelCanvas(x1 - x0, 1, (g, px) => { for (let i = 0; i < n; i++) px(i * 3, 0, on ? '#ffe14d' : '#4a4a58', 2, 1); });
    const wire = st.add(new Quad(canvasTex(wcv(false)), x1 - x0, 1), Z.PLATFORM + 3); wire.place(x0, L.groundTop - 2 - Object.keys(L.party).indexOf(hero));
    const wireOn = canvasTex(wcv(true)); const wireOff = wire.material.uniforms.map.value;
    return { hero, q, wire, wireOn, wireOff, t: L.plates.step[hero] };
  });
  const exitTxt = st.add(new TextSprite({ text: 'EXIT 0/3', font: 'sk', color: '#9ec2ff', outline: '#05060d', outline8: true }, { anchor: 'bc' }), Z.TEXT); exitTxt.place(96, 112);
  // the gate: each stroke drawn on its own frame (act2/plan.js GATE: one LINE OF CODE per stroke)
  const G = plan().GATE;
  const mk = async (ch, c, times) => {
    const h = await Hanzi2D.create(ch, { size: c.size, style: 'rainbow', shadowColor: '#0a1030', bold: 2 }); h.place(c.x, c.y); st.add(h.group, Z.PLATFORM + 2);
    if (h.n !== times.length) console.warn(`launch_set: ${ch} has ${h.n} strokes, plan has ${times.length}`);
    times.forEach((e, i) => { if (i < h.n) h.plan(e - G.half, e - G.half + G.dur, { strokes: [i] }); });
    return h;
  };
  const chu = await mk('出', L.chu, G.chu), fa = await mk('发', L.fa, G.fa);
  const lampTex = [0, 1, 2, 3].map((n) => canvasTex(lampCanvas(n, false))), lampGo = canvasTex(lampCanvas(3, true));
  const lamp = st.add(new Quad(lampTex[0], 16, 34, { anchor: [8, 0] }), Z.PROP); lamp.place(L.lights.x, L.groundTop);
  const cubes = [[40, 118, 20], [300, 112, 16], [340, 140, 24], [-20, 110, 18]].map(([x, y, s], i) => { const cv = cubeCanvas(s, PAL.gizmoBlue, i % 2 === 1); const q = st.add(new Quad(canvasTex(cv), cv.width, cv.height), Z.PARALLAX); return { q, x, y }; });
  return {
    bg, chu, fa, lamp, ground, plates, exitTxt,
    /** number of plates pressed at t (0..3) */
    pressed(t) { return plates.filter((p) => T.on(t, p.t)).length; },
    update(t, { showCubes = true } = {}) {
      if (bg) { bg.cover(st.cam); bg.u.uTime.value = t; }
      chu.apply(t); fa.apply(t);
      const sh = t > L.fa.erupt + 0.4 ? (t - L.fa.erupt) * 0.25 : 0; chu.u.uHueShift.value = sh; fa.u.uHueShift.value = sh;
      // erupting: the characters rise out of the ground as their strokes draw
      const rise = (h, c) => { const k = T.span(t, c.erupt - 0.06, c.erupt + 0.18, T.ease.back); h.place(c.x, c.y - Math.round((1 - k) * 40)); h.group.visible = t >= c.erupt - 0.06; };
      rise(chu, L.chu); rise(fa, L.fa);
      const n = L.lights.reds.filter((e) => T.on(t, e)).length;
      lamp.material.setMap(T.on(t, L.lights.green) ? lampGo : lampTex[n]); lamp.visible = t >= lampFrom;
      for (const p of plates) {
        const on = T.on(t, p.t); p.q.visible = p.wire.visible = t >= platesFrom;
        p.q.material.setMap(on ? pOn : pOff); p.wire.material.setMap(on ? p.wireOn : p.wireOff);
      }
      const k = this.pressed(t);
      exitTxt.visible = t >= 72.0 && t < L.fa.erupt + 0.5;
      if (exitTxt.visible) exitTxt.set({ text: k >= 3 ? 'EXIT OPEN' : `EXIT ${k}/3`, color: k >= 3 ? '#ffe14d' : '#9ec2ff' });
      const left = st.cam.left; cubes.forEach((c, i) => { c.q.visible = showCubes; c.q.place(c.x + (left - 32) * 0.6, c.y + Math.round(3 * Math.sin(t * 1.1 + i))); });
    },
  };
}
