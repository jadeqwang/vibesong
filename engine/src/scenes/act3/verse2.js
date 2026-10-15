// ACT III · 94.204-107.15 · VERSE 2 on mesa A.
//   94.22  "Everything I love about life just blossoms": a field of plaster flowers blooms in a wave around Jade;
//          colour follows only along her path (a capsule of hand-colouring from where she started to her feet)
//   100.12 "because": the word returns as monumental stone letters, BE | CAUSE, and the party walks through the gap
//   101.0  "my imagination is linked to my everyday life": THE CO-OP CROSSING (Talos / Portal 2 co-op, no portals)
//          my imagination  Charlie holds a pressure plate -> the gate grinds open -> a connector tripod
//          is linked       Jade carries the tripod to the cliff edge and plants it on "linked" (103.105)
//          to my everyday  Ricky's held note = the beam: guitar -> tripod -> receiver; the first coloured light;
//                          the bridge draws itself across the chasm as one long 一 stroke
//          life            Charlie can't leave the plate: he pulls a second hat out of his hat and drops it on the plate;
//                          all three cross and land on the snare with a co-op high-five
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { getWorld, MESA_A, MESA_B, CHASM } from './world/build.js';
import { make3D, CUE, V, aim, persp, runFrame, smooth, clamp01, LOOK, faceCam } from './common.js';

const PZ = 348, X0 = 600, XG = 784, TG = 100.55;           // path along +x at z = 228; through the BECAUSE gap at TG
const walkX = (t) => X0 + (XG - X0) * clamp01((t - CUE.v2) / (TG - CUE.v2));
const W_ = (t) => T.word(26, 0); void W_;
const WORD = (i) => T.word(26, i).start;                     // my 0 · imagination 1 · is 2 · linked 3 · to 4 · my 5 · everyday 6 · life 7
const PLATE = V(925, MESA_A.top, 320), GATE = V(982, MESA_A.top, 292), EDGE = V(990, MESA_A.top, 410);
const RICKY_SPOT = V(962, MESA_A.top, 300), RECV = V(1125, MESA_B.top, 455);
const HAT_DROP = 105.618, CROSS = [105.66, 106.43];          // bar 64.1 drop, land on the snare (bar 64.3)

export async function setup(ctx) {
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const bloomAt = (it) => CUE.v2 + 0.05 + Math.max(0, it.x - X0) / 62 + Math.abs(it.z - PZ) / 170;

  return make3D(ctx, W, {
    inWorldSubs: [25],
    frame(t) {
      const top = MESA_A.top;
      // ---- flowers + the path of colour
      P.flowers.visible = true;
      P.flowers.update((it) => clamp01((t - bloomAt(it)) / 0.45), t);
      P.because.visible = true;
      // ---- party
      const party = {};
      if (t < 101.0) {
        const walk = (dx, dz) => ({ x: walkX(t) + dx, y: top, z: PZ + dz });
        party.jade = { ...walk(0, 0), anim: 'run', frame: runFrame(t, 2, 1), pencil: true };
        party.charlie = { ...walk(-34, -12), anim: 'run', frame: runFrame(t, 6, 1.5) };
        party.ricky = { ...walk(-60, 10), anim: 'run', frame: runFrame(t + 0.2, 6, 1.5) };
      } else {
        // co-op crossing
        const tPlate = WORD(0);
        const onPlate = t >= tPlate + 0.15;
        const crossU = (d) => clamp01((t - CROSS[0] - d) / (CROSS[1] - CROSS[0]));
        // CHARLIE: steps onto the plate, holds it, pulls a hat out of his hat (105.2), drops it (105.618), runs
        if (t < HAT_DROP + 0.05) party.charlie = { x: PLATE.x, y: top + (onPlate ? 1.5 : 3), z: PLATE.z, anim: t >= WORD(7) ? 'pull' : 'idle', t: t >= WORD(7) ? t - WORD(7) : t };
        // JADE: to the gate, grabs the tripod (102.26), carries it to the edge, plants it on "linked"
        const jA = V(898, top, 298), jB = V(GATE.x - 16, top, GATE.z + 8), jC = V(EDGE.x - 16, top, EDGE.z);
        let jp;
        if (t < WORD(2)) jp = jA.clone().lerp(jB, smooth(101.0, WORD(2), t));
        else if (t < WORD(3)) jp = jB.clone().lerp(jC, smooth(WORD(2), WORD(3), t));
        else jp = jC.clone();
        party.jade = { x: jp.x, y: top, z: jp.z, anim: (t > WORD(2) && t < WORD(3)) || t < WORD(1) ? 'run' : 'idle', frame: runFrame(t, 2, 2), t, pencil: true };
        // RICKY: walks to his spot, holds the note from "everyday"
        const rp = V(880, top, 262).lerp(RICKY_SPOT, smooth(101.0, 102.6, t));
        party.ricky = { x: rp.x, y: top, z: rp.z, anim: t >= WORD(6) - 0.1 ? 'sustain' : 'idle', t };
        // all three cross on the stroke bridge
        if (t >= CROSS[0]) {
          const runs = { jade: [jC, 0], ricky: [RICKY_SPOT.clone(), 0.06], charlie: [PLATE.clone(), 0.0] };
          for (const [n, [from, d]] of Object.entries(runs)) {
            const u = crossU(d); const to = V(CHASM.x1 + 30 + (n === 'jade' ? 0 : n === 'ricky' ? 26 : -26), MESA_B.top, 412 + (n === 'jade' ? 0 : n === 'ricky' ? 8 : -8));
            const p = from.clone().lerp(to, u);
            party[n] = { x: p.x, y: top + 14 * Math.sin(Math.PI * Math.max(0, (u - 0.75) / 0.25)) * (u > 0.75 ? 1 : 0), z: p.z, anim: u < 1 ? 'run' : 'idle', frame: n === 'jade' ? runFrame(t, 2, 2) : runFrame(t, 6, 3), t: t - CROSS[1], pencil: n === 'jade' };
            if (u >= 1 && t < CROSS[1] + 0.3) { party[n].anim = 'jump'; party[n].frame = 1; }
          }
        }
        // ---- co-op props
        P.plate.visible = P.gate.visible = P.tripod.visible = P.receiver.visible = P.yiBridge.visible = true;
        P.plate.userData.plate.position.y = onPlate ? 0.4 : 1.5;
        P.plate.userData.edgeMat.color.set(onPlate ? '#fff6dc' : '#6a6258').multiplyScalar(onPlate ? 3 : 1);
        const open = smooth(tPlate + 0.3, WORD(1) + 0.6, t);
        P.gate.userData.doorL.position.x = -8 - 15 * open; P.gate.userData.doorR.position.x = 8 + 15 * open;
        // tripod: inside the gate, carried, planted
        let tp;
        if (t < WORD(2)) tp = GATE.clone().add(V(-2, 0, 0));
        else if (t < WORD(3)) { tp = V(party.jade.x + 9, top + 6, party.jade.z + 3); }
        else tp = EDGE.clone();
        P.tripod.position.copy(tp); P.tripod.rotation.y = t < WORD(3) ? 0.3 : 0;
        const plant = T.pulse(t, [WORD(3)], 0.15);
        P.tripod.position.y -= 3 * plant;
        // the hat stack holds the plate down once Charlie leaves
        if (t >= HAT_DROP) { P.hatStack.visible = true; W.put(P.hatStack, { x: PLATE.x, y: top + 0.4 + 30 * (1 - smooth(HAT_DROP - 0.15, HAT_DROP, t)), z: PLATE.z, anim: 'rest', frame: 0 }); }
        // beam: guitar -> tripod crystal -> receiver (coloured: sound = colour), bridge draws
        const tb = WORD(6);
        if (t >= tb - 0.05) {
          const gtr = V(party.ricky.x + 14, top + 22, party.ricky.z + 1);
          const cry = EDGE.clone().add(V(0, 29 * 1.4, 0)), rcv = RECV.clone().add(V(0, P.receiver.userData.cy, 0));
          const u = clamp01((t - tb) / 0.6); const atRicky = t < CROSS[0] + 0.1;
          if (atRicky) { P.beam2.visible = true; P.beam2.set([gtr, cry, rcv], u, { width: 1.1 + 0.25 * Math.sin(t * 30), colors: ['#ff5fd2', '#8a6bff'] }); }
          P.crystalMat.emissiveIntensity = 3 * smooth(tb + 0.1, tb + 0.3, t);
          P.recvMat.emissiveIntensity = 3 * smooth(tb + 0.45, tb + 0.6, t);
        }
        P.yiBridge.hz.setProgress(0, smooth(tb + 0.45, WORD(7) - 0.05, t));
        P.yiBridge.hz.setColour(clamp01((t - CROSS[0]) / (CROSS[1] - CROSS[0])) * 1.05);   // graphite -> colour under their feet
        // the colour of the beam lights the ground it touches (local paint on the mesa tops)
        // high five on the landing
        const hf = CROSS[1] + 0.05;
        if (t >= hf - 0.03 && t < hf + 0.2) { const s = t - hf; P.star.visible = true; P.star.scale.setScalar(1.5 + 7 * Math.max(0, s)); P.star.position.set(CHASM.x1 + 30, MESA_B.top + 48, 412); P.star.rotation.set(s * 6, s * 9, 0); }
      }
      for (const [n, s] of Object.entries(party)) W.put(W.heroes[n], s);
      if (!party.charlie) W.heroes.charlie.visible = false;
      P.burst.visible = true;
      P.burst.run(t, [{ t0: WORD(3), x: EDGE.x, y: MESA_A.top, z: EDGE.z, n: 14, speed: 40, up: 20, g: 150, dur: 0.6, seed: 5, size: 1.2 },
        { t0: HAT_DROP, x: PLATE.x, y: MESA_A.top + 1, z: PLATE.z, n: 12, speed: 40, up: 20, g: 150, dur: 0.5, seed: 6, size: 1.2 }]);
      P.petals.visible = true;
      P.petals.run(t, [0, 1, 2, 3, 4, 5].map((k) => ({ t0: 94.22 + k * 0.8, x: walkX(94.22 + k * 0.8) + 10, y: MESA_A.top + 4, z: PZ, n: 10, speed: 30, up: 30, g: 30, dur: 1.4, seed: 30 + k, size: 0.8, colors: ['#ff4d6d', '#ffe14d', '#e858d0', '#ffb02e'] })));

      // ---- cameras
      let pos, tgt, fov = 45, focus;
      const jp = W.heroes.jade.position;
      if (t < 97.07) {          // low side tracking through the blooming field
        const k = smooth(CUE.v2, 97.07, t);
        pos = V(jp.x - 40 + 30 * k, top + 16 + 6 * k, PZ + 95); tgt = V(jp.x + 10, top + 18, PZ - 10); fov = 48; focus = jp.clone();
      } else if (t < CUE.because) { // crane up: the path of colour through the white field
        const k = smooth(97.07, CUE.because, t);
        pos = V(560 - 20 * k, top + 60 + 50 * k, 450 + 30 * k); tgt = V(jp.x + 30, top + 10, PZ - 10); fov = 50; focus = jp.clone();
      } else if (t < 101.0) {   // BECAUSE: the party walks through the gap in the stone word
        const k = smooth(CUE.because, 101.0, t);
        pos = V(650 - 10 * k, top + 55, 420); tgt = V(784, top + 30, 365); fov = 48; focus = V(770, 20, 348);
      } else if (t < WORD(2)) { // Charlie on the plate, the gate grinding open behind
        const k = smooth(101.0, WORD(2), t);
        pos = V(840 - 10 * k, top + 44, 420 + 8 * k); tgt = V(950, top + 20, 305); fov = 46; focus = PLATE.clone();
      } else if (t < WORD(6)) { // follow Jade from a 3/4 front angle: grab, carry, plant (on "linked")
        const k = smooth(WORD(2), WORD(6), t); const j = W.heroes.jade.position;
        pos = V(j.x + 28 - 10 * k, top + 40, j.z + 105); tgt = V(j.x - 4, top + 18, j.z); fov = 44; focus = j.clone();
      } else if (t < WORD(7)) { // k08b: behind the party at the edge, beam across the chasm, the stroke bridge drawing
        const k = smooth(WORD(6), WORD(7), t);
        pos = V(850 - 15 * k, top + 66 + 6 * k, 550 + 6 * k); tgt = V(1075, top + 10, 415); fov = 48; focus = EDGE.clone();
      } else {                  // side-on wide: hat drop + the crossing + high five
        const k = smooth(WORD(7), 107.15, t);
        pos = V(1035 + 20 * k, top + 70 - 10 * k, 620 - 20 * k); tgt = V(1035 + 20 * k, top + 6, 400); fov = 50; focus = V(1045, 10, 410);
      }
      const camera = aim(persp('v2', aspect), pos, tgt, fov);
      faceCam(Object.values(W.heroes), pos, 0.45);
      return { camera, target: tgt, focus, look: LOOK({ rays: 0.3, dofAmount: 0.2 }), shadowExtent: 450 };
    },
  });
}
