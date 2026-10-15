// ACT III · 86.385-94.204 · DROP 1 in 3D, second half.
//   86.87 FIXTURES!  monumental graphite slabs slam up around the party (freeze over the stop 87.26-87.83)
//   88.48-89.88      whistle answer: Ricky aims; the accent pair 88.86 / 89.68 = two power chords flip far switches
//   89.95 FUNCTIONS! Ricky's chord fires a light connector that links the slab tops; they glow (freeze 90.375-91.11)
//   91.11            the re-hit: the slabs swing out over the sea and lay themselves down as a bridge to mesa A
//   92.56 hey hey hey  three co-op gestures on the far side
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { getWorld, MESA_A } from './world/build.js';
import { make3D, CUE, V, aim, persp, runFrame, smooth, clamp01, LOOK, faceCam } from './common.js';

const C0 = V(630, 0, 0);                  // the party's stop on the causeway
const STAND = [ // slab standing poses: [x, z, rotY]
  [628, -17, 0], [595, -58, 0.3], [540, 2, 1.35], [694, -15, -0.3], [742, 0, -1.3], [668, -72, -0.1],
];
const ORDER = [2, 1, 0, 5, 3, 4];          // order the light connector visits the slabs (and the order they fly)
const RUN_V = 82, LAND_T = 81.47, LAND_J = 210;
const STOP = 86.8;
const slabBase = (W, i) => { const [x, z] = STAND[i]; return Math.abs(z) <= 24 ? 0 : W.groundY(x, z) - 2; };
const plankPose = (i) => ({ pos: V(700 + (i % 2 ? 6 : -6), 1.5 + 1.7 * i, 26 + 44 * i), rot: new THREE.Euler(Math.PI / 2, (i % 2 ? 0.04 : -0.05), 0) });

function partyAt(t) {
  // run in from the fly-over, decelerate to the stop, then idle; cross the bridge after 91.75
  const xRun = (dx) => { const x = LAND_J + dx + RUN_V * (Math.min(t, STOP) - LAND_T); return x; };
  const P = {};
  const base = [['jade', 0, 0], ['charlie', -28, -7], ['ricky', -52, 7]];
  for (const [n, dx, z] of base) {
    let s;
    if (t < STOP) s = { x: xRun(dx), y: 0, z, anim: 'run', frame: n === 'jade' ? runFrame(t, 2, 2) : runFrame(t, 6, 3) };
    else s = { x: xRun(dx), y: 0, z, anim: 'idle', t: t - STOP };
    P[n] = s;
  }
  P.jade.pencil = true;
  return P;
}

export async function setup(ctx) {
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const slabTop = (i) => { const s = P.slabs[i]; return V(STAND[i][0], slabBase(W, i) + s.userData.h + 1, STAND[i][1]); };

  return make3D(ctx, W, {
    frame(t, fx) {
      const party = partyAt(t);
      // ---- slabs
      const slam = (i) => CUE.fixtures - 0.1 + ORDER.indexOf(i) * 0.03;
      P.slabs.forEach((s, i) => {
        const [x, z, ry] = STAND[i]; const b = slabBase(W, i); const h = s.userData.h;
        const k = smooth(0, 1, clamp01((t - slam(i)) / 0.12));
        if (t < slam(i)) return;
        s.visible = true; s.position.set(x, b - h * (1 - k) - (Math.abs(z) > 24 ? 0 : 0), z); s.rotation.set(0, ry, 0);
        // fly into the bridge on the re-hit
        const tf = CUE.funStop[1] + ORDER.indexOf(i) * 0.11; const u = smooth(0, 1, clamp01((t - tf) / 0.42));
        if (u > 0) {
          const pp = plankPose(ORDER.indexOf(i)); const a = V(x, b, z);
          s.position.lerpVectors(a, pp.pos, u); s.position.y += 70 * Math.sin(Math.PI * u);
          const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), q1 = new THREE.Quaternion().setFromEuler(pp.rot);
          s.quaternion.slerpQuaternions(q0, q1, u);
          // pivot: lying planks are centred on their thickness
          if (u >= 1) s.position.copy(pp.pos).add(V(0, s.userData.d / 2, 0));
        }
      });
      // slab glow after the connector reaches each one
      const beamT0 = CUE.functions, beamT1 = CUE.functions + 0.38;
      const lit = clamp01((t - beamT0) / (beamT1 - beamT0));
      P.slabGlowMat.color.set('#ffe7b0').multiplyScalar(4 * smooth(beamT0, beamT1, t) * (1 - 0.6 * smooth(92.2, 93.2, t)));
      P.functionsText.material.opacity = smooth(CUE.functions + 0.15, CUE.functions + 0.35, t);
      P.fixturesText.material.opacity = 1;
      // the light connector: guitar -> slab tops (in ORDER), visible from FUNCTIONS! through the freeze
      const gtr = V(party.ricky.x + 16, 24, party.ricky.z);
      if (t >= beamT0 && t < CUE.funStop[1] + 0.05) {
        P.beam.visible = true; P.beam.set([gtr, ...ORDER.map(slabTop)], lit, { width: 1 + 0.4 * T.pulse(t, [CUE.functions], 0.2) });
      }
      // far switches on the accent pair (88.86, 89.68)
      const shots = [[CUE.pairs[4], 0], [CUE.pairs[5], 1]];
      for (const [te, k] of shots) {
        const sw = P.switches[k]; const orb = sw.position.clone().add(V(0, sw.userData.orb.position.y, 0));
        if (t >= te) sw.userData.orb.material.color.set('#fff2d0').multiplyScalar(3);
        if (t >= te - 0.01 && t < te + 0.22) { P.beam2.visible = true; P.beam2.set([gtr, orb], clamp01((t - te + 0.01) / 0.1), { width: 0.7 }); P.beam2.coreMat.color.set('#fff0d0').multiplyScalar(7); }
      }
      // Ricky's poses: aim (88.48), blasts, the big chord on FUNCTIONS!
      if (t >= CUE.answer[0] - 0.1 && t < 91.75) {
        const blast = [CUE.pairs[4], CUE.pairs[5], CUE.functions].some((e) => t >= e && t < e + 0.18);
        party.ricky = { ...party.ricky, anim: 'chord', frame: blast ? 1 : 0 };
      }
      // cross the bridge (91.75 -> 92.5): turn toward +z and run over the planks onto mesa A
      const cross = (n, delay) => {
        const a = 91.72 + delay, b = a + 0.75; if (t < a) return;
        const u = clamp01((t - a) / (b - a)); const s = party[n];
        s.x = 700 + (n === 'charlie' ? -14 : n === 'ricky' ? 14 : 0); s.z = 0 + u * 300; s.y = u < 0.12 ? 0 : 10 * Math.min(1, (u - 0.12) / 0.8);
        s.anim = 'run'; s.frame = n === 'jade' ? runFrame(t, 2, 2) : runFrame(t, 6, 3); s.rotY = -Math.PI / 2;
        if (u >= 1) { s.anim = 'idle'; s.t = t - b; s.rotY = 0; }
      };
      cross('jade', 0); cross('charlie', 0.08); cross('ricky', 0.16);
      // hey hey hey: positions on mesa A after crossing
      if (t >= 92.5) {
        const base = { jade: [700, 342], charlie: [672, 352], ricky: [728, 352] };
        for (const [n, [x, z]] of Object.entries(base)) Object.assign(party[n], { x, z, y: MESA_A.top, anim: 'idle', t: t - 92.5, rotY: 0 });
        const heys = CUE.hey;
        const pairs = [['jade', 'charlie'], ['charlie', 'ricky'], ['jade', 'charlie', 'ricky']];
        heys.forEach((te, i) => {
          const s = t - te; if (s < -0.12 || s > 0.3) return;
          const u = clamp01((s + 0.12) / 0.42);
          for (const n of pairs[i]) { party[n].anim = 'jump'; party[n].frame = u < 0.5 ? 0 : 1; party[n].y = MESA_A.top + 16 * Math.sin(Math.PI * u); }
        });
        // a white star where the hands meet
        const hi = heys.findIndex((te) => t >= te - 0.02 && t < te + 0.16);
        if (hi >= 0) {
          const ps = pairs[hi].map((n) => party[n]); const cx = ps.reduce((a, p) => a + p.x, 0) / ps.length;
          P.star.visible = true; const s = t - heys[hi]; P.star.scale.setScalar(1 + 6 * s); P.star.position.set(cx, MESA_A.top + 46 + 16 * Math.sin(Math.PI * clamp01((s + 0.12) / 0.42)), 352);
          P.star.rotation.set(s * 6, s * 9, 0);
        }
      }
      for (const [n, s] of Object.entries(party)) W.put(W.heroes[n], { ...s, pencil: n === 'jade' });
      // dust when the slabs land + when the planks land
      P.burst.visible = true;
      P.burst.run(t, [
        ...STAND.map(([x, z], i) => ({ t0: slam(i) + 0.05, x, y: slabBase(W, i), z: z + 4, n: 18, speed: 70, up: 30, g: 200, dur: 0.8, seed: 70 + i, size: 1.8, colors: ['#e8dcc6', '#cfc0a4', '#4a4a50'] })),
        ...ORDER.map((i, k) => { const pp = plankPose(k); return { t0: CUE.funStop[1] + k * 0.11 + 0.42, x: pp.pos.x, y: pp.pos.y, z: pp.pos.z + 20, n: 10, speed: 50, up: 25, g: 200, dur: 0.6, seed: 90 + k, size: 1.4, colors: ['#4a4a50', '#9a9aa2'] }; }),
      ]);

      // ---- cameras
      const frz = (a, b) => (t >= a && t < b ? a : t);
      let pos, tgt, fov = 50, focus = V(party.jade.x, 30, 0), ext = 600;
      const tc = frz(CUE.fixStop[0], CUE.fixStop[1]);
      if (t < CUE.fixStop[1]) {            // S1: low from the sea side; the slabs slam up behind
        const k = smooth(86.385, 87.26, tc);
        pos = C0.clone().add(V(-25 + 10 * k, 20 + 4 * k, 150 - 18 * k)); tgt = C0.clone().add(V(8, 46, -30));
        const sh = T.pulse(tc, [CUE.fixtures], 0.12) * 2.2; pos.x += Math.sin(tc * 90) * sh; pos.y += Math.cos(tc * 70) * sh;
      } else if (t < CUE.functions) {      // S2: over Ricky's shoulder toward the far switches
        const k = smooth(CUE.fixStop[1], CUE.functions, t);
        const r = party.ricky; pos = V(r.x - 85 - 12 * k, 36, r.z + 95); tgt = V(r.x + 260, 40, -110); fov = 44;
        focus = V(r.x, 25, r.z);
      } else if (t < CUE.funStop[1]) {     // S3: FUNCTIONS! wide, higher (freeze in the stop)
        const k = smooth(CUE.functions, CUE.funStop[0], frz(CUE.funStop[0], CUE.funStop[1]));
        pos = C0.clone().add(V(-70 - 10 * k, 64 + 8 * k, 210)); tgt = C0.clone().add(V(30, 40, -34)); fov = 52;
      } else if (t < 92.5) {               // S4: high side shot, the slabs fly out over the sea into a bridge
        const k = smooth(CUE.funStop[1], 92.5, t);
        pos = V(540 + 30 * k, 170 - 20 * k, 400 - 20 * k); tgt = V(700, 0, 150); fov = 50; focus = V(700, 5, 90); ext = 700;
      } else {                             // S5: front medium on mesa A, the co-op gestures
        const k = smooth(92.5, 94.204, t);
        pos = V(735 + 30 * k, MESA_A.top + 40, 352 + 175 - 15 * k); tgt = V(700, MESA_A.top + 30, 345); fov = 42; focus = V(700, 30, 348);
      }
      const camera = aim(persp('drop', aspect), pos, tgt, fov);
      if (t >= CUE.funStop[1] && t < 92.5) {
        // crossing heroes face the side camera
        faceCam(Object.values(W.heroes), pos, 1.0, 180);
      } else if (t < CUE.funStop[1]) faceCam(Object.values(W.heroes), pos, 0.5);
      return { camera, target: tgt, focus, look: LOOK({ rays: 0.3, dofAmount: 0.22 }), shadowExtent: ext };
    },
  });
}
