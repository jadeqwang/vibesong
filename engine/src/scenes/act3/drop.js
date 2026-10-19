// ACT III · 86.385-94.204 · DROP 1 in 3D: "FIXTURES! / FUNCTIONS!" = ROOM A of the Talos level (docs/pages/talos_level.svg).
// talos_r4 (round 4). The approved v2 staging lives on in drop_v2.js and is what default renders run (see prebattle_props R4).
//
// Room A: the near ledge (the causeway) | a sea gap with a tall wall in it | mesa A's north lip with a force-field gate + a
// dark receiver. Goal: power the receiver so the field drops. The wall blocks the straight shot from Ricky's fixed amp-emitter.
//   86.385-87.26  reveal: a crane up and back over the sea shows the gap, the wall, the dark receiver and the blue field
//   86.63/86.87/87.13  FIXTURES!  Jade's three slashes raise three graphite slabs out of the sea, a crystal connector on each,
//                 their aim fins pointing the wrong way; freeze on the stop (87.26-87.83)
//   88.48-89.88   Charlie's hat taps each crystal 1 -> 2 -> 3 and turns it to face the next, leaving a dotted trail; Ricky plugs in
//   89.95         FUNCTIONS!  Ricky's chord switches the amp on (it keeps running): amp -> 1 -> 2 -> 3 -> receiver, around the
//                 wall; the receiver lights (sound-ring pulse), the gate's three lamps light one by one = unlocked (latched).
//                 Freeze on the stop (90.375-91.11) = the glamour frame
//   91.11         re-hit: the slabs swing down along the trail into a bridge; Jade colours each as she crosses; the field
//                 dissolves as she reaches it; 92.56 hey hey hey = three co-op jumps at the open gate
// Screen direction: the journey reads left -> right from A2 on (cameras over the sea / causeway look east). A1 (the reveal) looks
// south from the meadow so the trio sit low right with the wall, gate + receiver behind them; the beam axis runs into depth there.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { getWorld } from './world/build.js';
import { make3D, CUE, V, aim, persp, smooth, clamp01, LOOK, pathAt, R5 } from './common.js';
import { turnCarry } from './turn.js';
import { R4, ensurePB, ensureR4, headingTo, springCam, holdClock, Crystal, dumpInit, talosDump } from './prebattle_props.js';
import { RA, roomATracks } from './talos_plan.js';
import { press } from '../../core/motion/index.js';

export async function setup(ctx) {
  if (R5()) return (await import('./drop_r5.js')).setup(ctx);   // round 5 (talos_r5): Room A re-staged, --r5 only
  if (!R4) return (await import('./drop_v2.js')).setup(ctx);
  return setupR4(ctx);
}

// ------------------------------------------------------------------------------------------------ Room A layout (talos_plan.js RA)
const { AMP, BASE, BY, LAND, LY, RECV, GATE, WALL, SLASH, RISE, THROW, TAPS, CATCH, HOP, LAMPS, SWING_DT, SWING_DUR, HEY, CH, PULSE } = RA;
const FUN = CUE.functions;
const SWING0 = CUE.funStop[1];
const STOPS = [CUE.fixStop, CUE.funStop];
const tau = (t) => (t >= CUE.fixStop[0] && t < CUE.fixStop[1] ? CUE.fixStop[0] : t >= CUE.funStop[0] && t < CUE.funStop[1] ? CUE.funStop[0] : t);
const SHOT = [86.385, 88.052, 89.694, 91.746, 94.204];           // cuts on beats 209 / 213 / 218
const L2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const NODES = [...BASE, LAND];
const LEN = BASE.map((b, k) => L2(b, NODES[k + 1]) - 3);       // leaf k reaches (almost) the next base when it lies down

async function setupR4(ctx) {
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const carry = await turnCarry(ctx, W);
  const PB = await ensurePB(W); const R = await ensureR4(W, ctx); const F = R.figs;
  const A = buildRoomA(R); await dumpInit();

  // ---------------------------------------------------------------------------------------------- hero tracks (song time)
  const { jade, charlie, ricky } = roomATracks(R, { jade: F.jade.unit, charlie: F.charlie.unit, ricky: F.ricky.unit }, SWING0);
  const TR = { jade, charlie, ricky };
  // when each hero reaches the gate (the field dissolves as Jade gets there)
  const reach = (tr, p, r) => { for (let t = SWING0; t < 94; t += 1 / 120) { const s = tr.state(t); if (Math.hypot(s.x - p[0], s.z - p[1]) < r) return t; } return 94; };
  const tGate = reach(jade, [GATE[0], GATE[1] - 6], 34);
  const tPlank = BASE.map((b) => reach(jade, b, 10));
  const tAll = reach(ricky, [GATE[0], GATE[1] + 8], 14) + 0.1;     // all three through the gate: then the amp's beam may fade
  const OFF = (tt) => smooth(tAll, tAll + 0.35, tt);
  console.log(`[engine] [talos_r4] room A: jade at the gate ${tGate.toFixed(3)}, on the bases ${tPlank.map((x) => x.toFixed(2)).join(' ')}; hops ${jade.segs.filter((s) => s.kind === 'jump').map((s) => s.t1.toFixed(2)).join(' ')}`);
  for (const tr of [jade, charlie, ricky]) for (const w of tr.warnings || []) console.log('[engine] [talos_r4] motion warning: ' + w);

  // upper-body actions (layers on top of the mocap) ------------------------------------------------------------
  const vic = (t0, t1, mask = 'arms') => ({ anim: 'victory', t0, t1, mask, p: (t) => t * 2 });
  const layers = {
    jade: [{ anim: 'draw_graphite', t0: SLASH[0] - 0.12, t1: SLASH[2] + 0.35, mask: 'upper', p: () => 0.4 }, vic(HEY[0] - 0.15, HEY[0] + 0.3), vic(HEY[1] - 0.15, HEY[1] + 0.3), vic(HEY[2] - 0.2, HEY[2] + 0.4)],
    charlie: [{ anim: 'throw', t0: THROW - 0.3, t1: THROW + 0.5, mask: 'upper', p: (t) => clamp01((t - THROW + 0.3) / 0.62) },
      { anim: 'throw', t0: CATCH - 0.12, t1: CATCH + 0.3, mask: 'arms', p: () => 0.25 }, vic(HEY[1] - 0.15, HEY[1] + 0.3), vic(HEY[2] - 0.2, HEY[2] + 0.4)],
    ricky: [{ anim: 'chord', t0: 89.55, t1: SWING0 + 0.1, mask: 'armsHead', rate: 2 }, vic(HEY[2] - 0.2, HEY[2] + 0.4)],
  };
  // Ricky plugs his jack into the amp (arm IK: reach, push in along the socket axis, let go)
  const plugT0 = ricky.segs.find((s) => s.kind === 'clip').t0, ampFwd = V(1, 0, 0).applyQuaternion(A.amp.quaternion);
  A.amp.updateMatrixWorld(true); const plug = press(A.amp.localToWorld(A.amp.userData.jack.clone()), plugT0, { tHit: plugT0 + 0.32, depth: 2, dir: ampFwd.toArray(), pose: 'grip' });
  const hatOff = (t) => t >= THROW - 0.42 && t < CATCH + 0.12;    // cap in his hand or in the air

  // ---------------------------------------------------------------------------------------------- the hat's flight
  const crysAt = (k) => A.slabs[k].crystal.centre();
  A.amp.updateMatrixWorld(true); const lens0 = A.amp.localToWorld(A.amp.userData.lens.clone());
  const crysAt0 = (() => { const s = A.slabs[0]; s.group.position.y = 0; s.leafPivot.rotation.z = 0; s.group.updateMatrixWorld(true); return s.crystal.centre(); })();
  // the test pulse flies along the amp's aim (straight at the receiver) and splashes on the wall's face (M5: it used to stop in mid-air)
  A.recv.updateMatrixWorld(true); const recv0 = A.recv.userData.crystal.centre();
  const pHit = A.wallHit(lens0, recv0), pDir = pHit.clone().sub(lens0).normalize(), pHitS = lens0.distanceTo(pHit), pHitT = PULSE + pHitS / 900;
  // his hand at the release and the catch (measured once: frames must not depend on render order)
  const handAt = (tt) => { F.charlieNH.apply(charlie, tt, { layers: layers.charlie }); return F.charlieNH.hand('R').clone(); };
  const H_THROW = handAt(THROW), H_CATCH = handAt(CATCH);
  const capPath = (t) => {   // Charlie's hand -> above each crystal (tap) -> back to his hand
    const keys = [[THROW, H_THROW.clone()]];
    TAPS.forEach((te, k) => keys.push([te, crysAt(k).add(V(0, 7, 0))]));
    keys.push([CATCH, H_CATCH.clone()]);
    return pathAt(t, keys);
  };

  const scene = await make3D(ctx, W, {
    frame(t) {
      const tc = tau(t);
      PB.begin(); R.begin();
      // ---------------------------------------------------------------------------------- heroes
      const hNH = hatOff(tc);
      const ch = hNH ? F.charlieNH : F.charlie;
      F.jade.group.visible = ch.group.visible = F.ricky.group.visible = true;
      F.jade.apply(jade, tc, { layers: layers.jade, pencil: true });
      ch.apply(charlie, tc, { layers: layers.charlie });
      F.ricky.apply(ricky, tc, { layers: layers.ricky, hands: { R: plug.spec } });
      slashPose(F.jade, tc);
      const st = { jade: jade.state(tc), charlie: charlie.state(tc), ricky: ricky.state(tc) };
      carry.update(t, { ricky: { x: st.ricky.x, z: st.ricky.z }, jade: { x: st.jade.x, z: st.jade.z }, charlie: { x: st.charlie.x, z: st.charlie.z } });
      if (t >= CUE.pairs[3] + 0.2) P.beam.visible = false;   // the turn's switch-4 click beam lasts 0.2 s (it stayed on in R4)

      // ---------------------------------------------------------------------------------- the room: wall, amp, receiver, gate
      for (const o of [A.wall, A.amp, A.plinth, A.recv, A.gate, A.conduit]) o.visible = true;
      A.recv.userData.crystal.reset(); A.recv.userData.crystal.visible = true;
      const tR = FUN + HOP[3];
      const recvLit = smooth(tR, tR + 0.06, tc) * (1 - OFF(tc));
      A.recv.userData.crystal.lit(recvLit, tc);
      A.recv.userData.crystal.pulse(tc - tR, V(0, 0, -1), 0.7, 1.4);
      A.gate.userData.lamps.forEach((l, k) => { l.material.emissiveIntensity = 4 * smooth(LAMPS[k], LAMPS[k] + 0.03, tc) * (1 - OFF(tc)); });
      const fieldOpen = smooth(tGate - 0.28, tGate + 0.06, t) * (1 - smooth(tAll + 0.35, tAll + 0.8, t));   // the field re-forms behind them
      A.gate.userData.field.set(t, fieldOpen, 0.6 * T.pulse(tc, LAMPS, 0.1));
      // conduit: dashes from the receiver to the gate, flowing once it is lit
      A.conduit.set([[A.cp[0], A.cp[1], 1]], { gap: 4, phase: recvLit > 0 ? tc * 40 : 0, scale: recvLit > 0 ? 1 : 0.6 });
      A.conduit.material.color.set(recvLit > 0 ? '#ff9ae6' : '#5a4a55').multiplyScalar(recvLit > 0 ? 2.2 : 1);
      // the amp: a fixed emitter, its aim ray shows where it points (at slab 1's spot)
      const lens = A.amp.localToWorld(A.amp.userData.lens.clone());
      A.amp.userData.lensMat.color.set('#ff5fd2').multiplyScalar(tc >= FUN ? 3 : 0.25);
      // cable: Ricky's guitar -> the amp's jack once he plugs in (88.6 -> 89)
      const jack = A.amp.localToWorld(A.amp.userData.jack.clone());
      const gtr = F.ricky.F.items.guitar; const plugT = ricky.segs.find((s) => s.kind === 'clip').t0 + 0.35;
      const gj = gtr ? gtr.localToWorld(gtr.userData.strum.clone()) : F.ricky.hand('R');
      if (tc >= plugT && tc < SWING0 + 0.32) R.setCable(gj, jack, 10);

      // ---------------------------------------------------------------------------------- slabs: rise, aim, swing, colour
      A.slabs.forEach((s, k) => {
        const t0 = SLASH[k] + 0.04; if (tc < t0) return;
        s.group.visible = true; const u = clamp01((tc - t0) / RISE); const e = 1 - Math.pow(1 - u, 3) + 0.06 * Math.sin(Math.PI * u);
        s.group.position.y = s.y0 - (1 - e) * (s.len + 240);
        // swing down into the bridge (hinge at the base, falling toward the next base along the trail)
        const ts = SWING0 + k * SWING_DT; const w = clamp01((tc - ts) / SWING_DUR); const fall = w * w;   // gravity-like
        s.leafPivot.rotation.z = -s.flat * fall; s.crystal.rotation.z = s.flat * fall;   // the crystal rides the plank, upright
        A.pads[k + 1].visible = w >= 1; if (k === 0) A.pads[0].visible = w >= 1;
        // crystal: wrong aim -> the hat turns it to face the next node; dark -> lit by the beam; retracts once the slab lies down
        const cr = s.crystal; cr.reset(); cr.visible = true;
        const next = k < 2 ? crysAt(k + 1) : A.recv.userData.crystal.centre();
        const turn = smooth(TAPS[k], TAPS[k] + 0.14, tc);
        cr.aimYaw(s.wrongYaw * (1 - turn) + aimYawLocal(s, next) * turn, (1 - turn) * s.wrongPitch + turn * aimPitch(cr, next));
        if (fall > 0) cr.aimYaw(aimYawLocal(s, next), 0);
        const lit = tc >= FUN + HOP[k] ? smooth(FUN + HOP[k], FUN + HOP[k] + 0.04, tc) * (1 - OFF(tc)) : 0;
        cr.lit(lit * 0.7, tc); cr.pulse(tc - FUN - HOP[k], V(0, 1, 0), 0.45, 1);
        // Jade colours each plank as she reaches it (colour = function; it stays)
        const tf = tPlank[k] - 0.05; if (t >= tf) { const c = clamp01((t - tf) / 0.35); const b = BASE[k]; s.mat.userData.lp.edge(14).addSphere(b[0], BY[k], b[1], 10 + 130 * (1 - Math.pow(1 - c, 2))); }
      });

      // ---------------------------------------------------------------------------------- the reveal's test pulse: the amp fires
      // along its fixed aim, the wall stops it (a flare + sparks): the block is shown, not labelled. Slab 1 then rises in that line.
      { const s0 = (tc - PULSE) * 900; const dir = pDir, hitS = pHitS;
        if (s0 > 0 && s0 < hitS + 40) { const a = lens0.clone().addScaledVector(dir, Math.max(0, Math.min(hitS, s0) - 46)), b = lens0.clone().addScaledVector(dir, Math.min(hitS, s0));
          R.beams[1].visible = true; R.beams[1].set([a, b], 1, { width: 1.5 * (1 - smooth(hitS, hitS + 40, s0)) }); }
        const hitT = PULSE + hitS / 620; if (tc >= hitT && tc < hitT + 0.45) R.glowAt(6, lens0.clone().addScaledVector(dir, hitS), 70 * (1 - (tc - hitT) / 0.45) + 16, 1 - (tc - hitT) / 0.45);
        if (tc >= PULSE - 0.02 && tc < PULSE + 0.15) R.glowAt(7, lens0, 10, 0.7); }

      // ---------------------------------------------------------------------------------- dotted trail + aim rays
      const segs = [];
      if (tc < SWING0 + 0.4) {
        const fade = 1 - smooth(SWING0, SWING0 + 0.4, tc);
        // amp aim ray (fixed: it points at slab 1's spot)
        const c1 = crysAt(0); segs.push([lens, tc < SLASH[0] ? lens.clone().lerp(c1, 0.45) : c1, fade]);
        R.dashes[1].set(segs, { gap: 5, phase: tc * 10, scale: 0.8 });
        // Charlie's trail: dots along the hat's flight, from his throw to the last tap (1 -> 2 -> 3), stays until the swing
        if (tc >= THROW) {
          const pts = []; const tEnd = Math.min(tc, TAPS[2]); for (let tt = THROW + 0.06; tt <= tEnd; tt += 0.012) pts.push(capPath(tt));
          trailDots(R.dashes[0], pts, 5.5, fade);
        }
        // aim rays: after each tap, a faint ray from the crystal to the next node (the plan)
        const rays = []; A.slabs.forEach((s, k) => { if (!s.group.visible) return; const a = s.crystal.centre();
          if (tc < TAPS[k] + 0.1) { const d = s.crystal.aim.localToWorld(V(30, 0, 0)).sub(a); rays.push([a, a.clone().add(d), smooth(SLASH[k] + 0.25, SLASH[k] + 0.4, tc)]); return; }   // aimed wrong
          const b = k < 2 ? crysAt(k + 1) : A.recv.userData.crystal.centre(); rays.push([a, b, smooth(TAPS[k] + 0.1, TAPS[k] + 0.3, tc) * fade]); });
        R.dashes[2].set(rays, { gap: 5, phase: tc * 12, scale: 0.7 });
      }
      // the hat in flight / in hand
      const cap = PB.cap; const capS = 1.3 * R.hs;
      if (tc >= THROW - 0.42 && tc < THROW) { cap.visible = true; const h = F.charlieNH.hand('R'); cap.position.copy(h); cap.rotation.set(0.2, 0, -0.3); cap.scale.setScalar(capS); }
      else if (tc >= THROW && tc < CATCH) { cap.visible = true; cap.position.copy(capPath(tc)); cap.rotation.set(0.5, tc * 16, 0.15); cap.scale.setScalar(capS); }
      else if (tc >= CATCH && tc < CATCH + 0.12) { cap.visible = true; cap.position.copy(F.charlieNH.hand('R')); cap.rotation.set(0.2, 0, -0.3); cap.scale.setScalar(capS); }

      // ---------------------------------------------------------------------------------- FUNCTIONS!: the beam
      if (tc >= FUN && tc < tAll + 0.4) {
        const pts = [lens, crysAt(0), crysAt(1), crysAt(2), A.recv.userData.crystal.centre()];
        const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
        // progress: reach node i at FUN + HOP[i-1]
        const tt = tc - FUN; let d = 0; const H = [0, ...HOP];
        for (let i = 1; i < pts.length; i++) { if (tt >= H[i]) d = L[i]; else { d = L[i - 1] + (L[i] - L[i - 1]) * clamp01((tt - H[i - 1]) / (H[i] - H[i - 1])); break; } }
        const off = OFF(tc);
        const low = smooth(SWING0, SWING0 + 0.5, tc);   // once the slabs lie down the beam runs low along the bridge: thinner
        // a hero crossing the beam stops it (splash on them; the relays past them go dark for those frames: the gate stays latched)
        const drawn = [pts[0]]; { let r = d; for (let i = 1; i < pts.length && r > 0; i++) { const l = L[i] - L[i - 1]; drawn.push(r >= l ? pts[i] : pts[i - 1].clone().lerp(pts[i], r / l)); r -= l; } }
        const blk = heroBlock(drawn, [st.jade, st.charlie, st.ricky]);
        R.beams[0].visible = off < 0.999; R.beams[0].set(blk.pts, 1, { width: (1 - 0.35 * low) * (1 - off) * (1 + 0.35 * T.pulse(tc, [FUN], 0.2) + 0.12 * Math.sin(tc * 40)) });
        if (blk.hit && off < 0.999) R.glowAt(6, blk.hit, 16, 0.9 * (1 - off));
        pts.slice(1).forEach((p, i) => { if (tt >= H[i + 1] && i < blk.seg) R.glowAt(i, p, (26 - 12 * low) + 14 * T.pulse(tc, [FUN + H[i + 1]], 0.15), 0.9 * (1 - off)); });
        R.glowAt(5, lens, 22, 1 - off);
      }

      // ---------------------------------------------------------------------------------- particles
      P.burst.visible = true;
      P.burst.run(tc, [
        ...BASE.map((b, k) => ({ t0: SLASH[k] + 0.04, x: b[0], y: -196, z: b[1], n: 26, speed: 120, up: 140, g: 260, dur: 1.0, seed: 70 + k, size: 3.2, colors: ['#ffffff', '#cfe6f2', '#9fc6dc'] })),
        ...BASE.map((b, k) => ({ t0: SLASH[k] + 0.04 + RISE, x: b[0], y: BY[k] + A.slabs[k].len, z: b[1], n: 14, speed: 50, up: 30, g: 200, dur: 0.6, seed: 80 + k, size: 1.8, colors: ['#4a4a50', '#9a9aa2'] })),
        ...BASE.map((b, k) => { const n = NODES[k + 1]; return { t0: SWING0 + k * SWING_DT + SWING_DUR, x: n[0], y: BY[k] + 4, z: n[1], n: 20, speed: 70, up: 30, g: 220, dur: 0.6, seed: 90 + k, size: 2, colors: ['#4a4a50', '#9a9aa2', '#e8dcc6'] }; }),
      ]);
      P.sparks.visible = true;
      P.sparks.run(tc, [
        { t0: pHitT, x: pHit.x, y: pHit.y, z: pHit.z - 2, n: 30, speed: 70, up: 30, g: 120, dur: 0.6, seed: 450, colors: ['#ff5fd2', '#ffffff', '#ffb0e8'] },
        ...TAPS.map((te, k) => { const p = crysAt(k); return { t0: te, x: p.x, y: p.y + 4, z: p.z, n: 14, speed: 40, up: 20, g: 60, dur: 0.45, seed: 400 + k, colors: ['#ffb02e', '#ffffff'] }; }),
        ...BASE.map((b, k) => ({ t0: tPlank[k] - 0.05, x: b[0], y: BY[k] + 2, z: b[1], n: 16, speed: 45, up: 30, g: 120, dur: 0.5, seed: 200 + k, colors: ['#ff4d6d', '#ffe14d', '#3ad06a', '#2bb4e8', '#a35cff'] })),
        { t0: tGate - 0.1, x: GATE[0], y: LY + 40, z: GATE[1], n: 30, speed: 60, up: 20, g: 40, dur: 0.6, seed: 500, colors: ['#5ab4ff', '#ffffff'] },
      ]);

      // ---------------------------------------------------------------------------------- cameras (cuts on beats, >= 1.6 s)
      const cam = cameraA(t, tc, st, F, A, TR);
      // A2 (the hat follow): the avenue cypresses between the camera and the slabs are hidden in this shot only (restored after render)
      if (t < SHOT[3]) for (const m of W.avenue) if (m.position.x > 500 && m.position.x < 820) m.visible = false;   // A1-A3 look over the avenue: its cypresses here would wall off the lens
      const camera = aim(persp('dropR4', aspect), cam.pos, cam.tgt, cam.fov);
      talosDump(t, { room: 'A', solids: { wall: A.wall, amp: A.amp, plinth: A.plinth, gate: A.gate, recv: A.recv, ...Object.fromEntries(A.slabs.map((s, k) => ['slab' + k, s.group])) },
        heroes: { jade: F.jade, charlie: ch, ricky: F.ricky }, states: st, supports: { ...Object.fromEntries(A.slabs.map((s, k) => ['slab' + k, s.group])), ...Object.fromEntries(A.pads.map((m, k) => ['pad' + k, m])) }, beams: { relay: R.beams[0], pulse: R.beams[1], beam2: R.beams[2], switch: P.beam }, camera });
      return { camera, target: cam.tgt, focus: cam.focus || cam.tgt, look: LOOK({ rays: 0.3, dofAmount: 0.18 }), shadowExtent: 650 };
    },
  });
  // the compose layer's 88.0 sea columns and the sea arcade (z 118) sit in Room A's gap: off here (they read as a way across)
  // A1 (the reveal) looks south from the meadow: the merged ruin / colonnade meshes north of the causeway (all behind or right at
  // the lens there) are off in that shot only, else a column fills the frame (restored after render)
  const northRuins = []; { const bb = new THREE.Box3(); W.scene.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || !o.geometry) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); if (bb.max.z < -38 && bb.max.z > -60 && bb.min.x > 200 && bb.max.x < 1400 && bb.max.y > 200) northRuins.push(o); }); }
  // ... and the voxel colonnade / ruin instances between the A1 lens and the trio (scaled to zero in A1 only, restored after render)
  const lensVox = []; { const m4 = new THREE.Matrix4(), pp = new THREE.Vector3(); W.scene.traverse((o) => { if (!o.isInstancedMesh || o.count < 5000 || o.name) return; const ids = [];
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); pp.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); if (pp.y > 12 && pp.x > 520 && pp.x < 800 && pp.z > -300 && pp.z < -30) ids.push(i); }
    if (ids.length) lensVox.push({ o, ids, saved: ids.map((i) => { const m = new THREE.Matrix4(); o.getMatrixAt(i, m); return m; }) }); }); }
  const zero = new THREE.Matrix4().makeScale(0, 0, 0); let voxOff = false;
  const voxSet = (off) => { if (off === voxOff) return; voxOff = off; for (const L of lensVox) { L.ids.forEach((i, k) => L.o.setMatrixAt(i, off ? zero : L.saved[k])); L.o.instanceMatrix.needsUpdate = true; } };
  const base = scene.update; scene.update = (t) => { base(t); const D = W.compose?.dressing; if (D?.s88) D.s88.visible = false; if (W.compose?.root) W.compose.root.visible = false;
    if (t < SHOT[1]) { for (const o of northRuins) o.visible = false; if (W.ruins) W.ruins.visible = false; } voxSet(t < SHOT[1]); };
  // restore what this scene hides (other scenes rendered later by the same worker must not inherit it: frames are order-free)
  // A1: no anamorphic streaks (the test pulse's lens flash drew a frame-wide bar); restored right after the render
  const rend = scene.render; scene.render = (t, target) => { const lk = ctx.post?.look; let sv = null;
    if (t < SHOT[1] && lk?.mat?.uniforms?.uStreak) { sv = lk.mat.uniforms.uStreak.value; lk.mat.uniforms.uStreak.value = 0; }
    rend(t, target); if (sv !== null) lk.mat.uniforms.uStreak.value = sv;
    if (W.compose?.root) W.compose.root.visible = true; for (const m of W.avenue) m.visible = true; for (const o of northRuins) o.visible = true; if (W.ruins) W.ruins.visible = true; voxSet(false); };
  return scene;

  // ---------------------------------------------------------------------------------------------- shots
  // Room A cameras (M4): from over the sea west of the gap, looking east toward the sun: the trio large on the left, the beam path
  // crossing the picture left -> right round the wall to the receiver + gate on the right, backlit. Near eye height (A1-A3);
  // the bridge run is a long-lens track from the west, high enough to see the runners over the wall.
  function cameraA(t, tc, st, F, A, TR) {
    const jp = V(st.jade.x, st.jade.y, st.jade.z);
    if (t < SHOT[1]) {   // A1: the reveal, from over the meadow behind the trio (spaced out across the lower right): the gap, the
      // wall, the receiver + the gate's field behind them; a slow crane up and back
      const c = holdClock(t, STOPS); const k = smooth(86.385, 88.1, c);
      const pos = V(585, 70 + 8 * k, -240 - 6 * k), tgt = V(618, 50, 40);
      const sh = 1.6 * T.pulse(tc, SLASH.map((x) => x + 0.04 + RISE), 0.1); pos.x += Math.sin(tc * 90) * sh; pos.y += Math.cos(tc * 70) * sh;
      return { pos, tgt, fov: 34, focus: V(600, 30, 0) };
    }
    if (t < SHOT[2]) {   // A2: over the sea south-west of the slabs; the view follows the hat across them (a lagging game look)
      return springCam((tt) => {
        const cs = TR.charlie.state(tt), cp = V(cs.x, 30, cs.z); const u = smooth(SHOT[1], SHOT[2], tt);
        const pos = V(520 + 30 * u, 110 - 10 * u, 120 + 6 * u);   // over the sea south-west of the slabs: Charlie throws (left), the hat taps 1 -> 2 -> 3
        const tgt = V(690, 50, 60).lerp(tt < THROW ? cp : capPathSafe(tt), 0.45);
        return { pos, tgt, fov: 60 };
      }, t, SHOT[1], { w: 6, zeta: 0.72 });
    }
    if (t < SHOT[3]) {   // A3: FUNCTIONS! the glamour stop: Ricky playing nearest (left), the zig-zag across, the lit gate backlit (right)
      const c = holdClock(t, STOPS); const k = smooth(89.694, 91.4, c);
      return { pos: V(470 - 4 * k, 101 + 2 * k, 23 + 2 * k), tgt: V(670, 19, 66), fov: 54, focus: V(600, 30, -15) };
    }
    // A4: a long-lens track alongside the runners from the west (left -> right), then onto the three past the gate (they face us)
    return springCam((tt) => {
      const s = TR.jade.state(Math.min(tt, 92.9)); const p = V(s.x, s.y, s.z);
      const end = smooth(92.85, 93.3, tt);
      const pos = p.clone().add(V(-300, 170, -6)).lerp(V(700, 64, 330), end), tgt = p.clone().add(V(20, 26, 34)).lerp(V(834, 40, 328), end);
      return { pos, tgt, fov: 30 + 16 * end };
    }, t, SHOT[3], { w: 5, zeta: 0.75 });
  }
  function capPathSafe(tt) { if (tt < THROW) return F.charlieNH.hand('R'); return capPath(Math.min(tt, CATCH)); }
}

// ------------------------------------------------------------------------------------------------ helpers
/** cut a beam polyline at the first hero it meets (vertical capsules r 5.5 from their track state: feet +4 .. +58): { pts, hit, seg } */
export function heroBlock(pts, heroes, r = 5.5) {
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; const n = Math.max(1, Math.ceil(a.distanceTo(b)));
    for (let k = 1; k <= n; k++) { const p = a.clone().lerp(b, k / n);
      for (const h of heroes) if (Math.hypot(p.x - h.x, p.z - h.z) < r && p.y > (h.y || 0) + 4 && p.y < (h.y || 0) + 58) { const hit = a.clone().lerp(b, Math.max(0, k - 1) / n); return { pts: [...pts.slice(0, i), hit], hit, seg: i - 1 }; } } }
  return { pts, hit: null, seg: pts.length };
}
/** Jade's slash: right arm from overhead down through the stroke, body twisting into it (upper body only; legs stay on mocap) */
export function slashPose(fig, tc) {
  let cur = -1; SLASH.forEach((ts, k) => { if (tc >= ts - 0.08) cur = k; }); if (cur < 0 || tc > SLASH[2] + 0.3) return;
  const J = fig.F.J; const D = Math.PI / 180; const set = (j, z = 0, x = 0, y = 0) => J[j].rotation.set(x * D, y * D, z * D);
  const ts = SLASH[cur]; const p = (tc - ts + 0.08) / 0.12; const sm = (x) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
  const a = p < 0.4 ? -25 + 193 * sm(p / 0.4) : p < 0.65 ? 168 - 193 * sm((p - 0.4) / 0.25) : -25;
  const e = p < 0.4 ? 0 : p < 0.65 ? sm((p - 0.4) / 0.25) : 1; const side = cur % 2 ? -1 : 1;
  set('shoulderR', a, 0, -12 * side); set('elbowR', 24 - 18 * e); set('body', 8 - 26 * e, 0, 10 * side * (2 * e - 1)); set('shoulderL', -40 + 30 * e, 0, 28);
}
export function aimYawLocal(s, p) { const c = s.crystal.centre(); const d = p.clone().sub(c); const q = new THREE.Quaternion(); s.crystal.getWorldQuaternion(q); d.applyQuaternion(q.invert()); return Math.atan2(-d.z, d.x); }
export function aimPitch(cr, p) { const c = cr.centre(); const d = p.clone().sub(c); return Math.atan2(d.y, Math.hypot(d.x, d.z)); }
/** dots every `gap` along a polyline of points (Charlie's trail), with a fade */
function trailDots(D, pts, gap, fade) {
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); let k = 0, acc = 0;
  for (let i = 1; i < pts.length && k < D.instanceMatrix.count; i++) { acc += pts[i].distanceTo(pts[i - 1]); if (acc < gap) continue; acc = 0; M.compose(pts[i], q, sc.setScalar(fade)); D.setMatrixAt(k++, M); }
  D.count = k; D.instanceMatrix.needsUpdate = true; D.visible = k > 0 && fade > 0.01;
}

/** Room A props (built once per world) */
function buildRoomA(R) {
  if (R.roomA) return R.roomA;
  const A = {}; const stone = R.stone, rock = R.rock;
  // the wall: a tall ruined sandstone wall on a sea rock, square across the amp -> receiver line
  { const g = new THREE.Group(); const [dx, dz] = WALL.dir; g.position.set(WALL.c[0], 0, WALL.c[1]); g.rotation.y = Math.atan2(-dz, dx);
    g.add(R.box(WALL.len, WALL.top + 214, WALL.thick, stone, 0, (WALL.top - 214) / 2, 0));
    g.add(R.box(WALL.len + 30, 60, WALL.thick + 34, rock, 0, -190, 0));
    const q = WALL.len / 120;   // battlements + string course scale with the wall (all inside its ends)
    for (const [x, w, h] of [[-46, 22, 10], [-22, 26, 18], [6, 30, 7], [32, 24, 14], [50, 18, 6]]) g.add(R.box(w * q, h, WALL.thick + 2, stone, x * q, WALL.top + h / 2, 0));
    for (const [x, w, h] of [[-42, 30, 8], [22, 38, 6]]) g.add(R.box(w * q, h, WALL.thick + 6, stone, x * q, WALL.top - 40 - h, 0));   // string course
    A.wall = R.add(g);
    const nx = -dz, nz = dx;   // wall normal (horizontal)
    A.wallHit = (a, b) => { const c = V(WALL.c[0], 0, WALL.c[1]), n = V(nx, 0, nz); const den = b.clone().sub(a).dot(n); const s0 = c.clone().sub(a).dot(n) / den;
      const p = a.clone().lerp(b, s0); return p.addScaledVector(n, Math.sign(-den) * (WALL.thick / 2 + 0.6)); };
  }
  // amp-emitter, aimed straight at the receiver (slab 1 rises in that line; the wall cuts it)
  A.amp = R.makeAmp(); A.amp.position.set(AMP[0], RA.AMP_Y, AMP[1]); A.amp.rotation.y = -headingTo(AMP, RECV);
  A.plinth = R.add(R.box(26, RA.AMP_Y, 24, stone, AMP[0], RA.AMP_Y / 2, AMP[1])); A.plinth.rotation.y = A.amp.rotation.y;
  // receiver + gate on mesa A
  A.recv = R.makeReceiver({ h: RA.RECV_H }); A.recv.position.set(RECV[0], LY, RECV[1]);
  A.gate = R.makeGate({ w: 46, h: 84 }); A.gate.position.set(GATE[0], LY, GATE[1]); A.gate.rotation.y = Math.PI;   // lamps face the bridge
  A.cp = [V(RECV[0] + 6, LY + 0.6, RECV[1] + 4), V(GATE[0] - 30, LY + 0.6, GATE[1])];
  A.conduit = R.dashes[3];
  // slabs: a graphite pier from the sea + a leaf (standing slab) hinged at the deck, a crystal connector on its top
  const HUE = ['#ff5a4e', '#3fc46a', '#2f8cff'];
  A.slabs = BASE.map((b, k) => {
    const n = NODES[k + 1]; const len = LEN[k]; const w = 46, d = 9; const mat = R.graphiteDark(HUE[k]); const pier = R.graphiteDark('#3a3a42');
    const group = new THREE.Group(); group.position.set(b[0], 0, b[1]); group.rotation.y = -headingTo(b, n);
    const y0 = BY[k];
    group.add(R.box(w + 10, 240, d + 30, pier, 0, y0 - d - 120, 0));
    const leafPivot = new THREE.Group(); leafPivot.position.set(d / 2 + 2, y0 - d, 0); group.add(leafPivot);
    const leaf = R.box(d, len, w, mat, -d / 2, len / 2, 0); leafPivot.add(leaf);
    for (const [x, ry] of [[0.06, Math.PI / 2], [-d - 0.06, -Math.PI / 2]]) { const h = R.hatch(w, len, 1); h.rotation.y = ry; h.position.set(x, len / 2, 0); leafPivot.add(h); }
    const crystal = new Crystal({ r: 6.5, fin: 1.8 }); leafPivot.add(crystal); crystal.position.set(-d / 2, CH[k], w / 2 + 11);   // on the slab's side at beam height: lying down it rides the plank's rim
    const slope = Math.atan2((k < 2 ? BY[k + 1] : LY) - y0, len);
    R.add(group);
    return { group, leafPivot, leaf, crystal, mat, len, y0: 0, flat: Math.PI / 2 - slope, wrongYaw: [2.2, -1.9, 2.7][k], wrongPitch: [0.5, -0.3, 0.6][k] };
  });
  // M6 support check: a graphite hinge cap at each joint of the zig-zag (and a step stone at the foot), deck height, shown once the
  // plank lands: the runners round the bends on them instead of on air
  A.pads = [[RA.FOOT, 0], ...BASE.map((b, k) => [b, BY[k]])].map(([b, y]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(20, 22, 3, 24), R.graphiteDark('#3a3a42'));
    m.position.set(b[0], y - 1.5, b[1]); m.castShadow = m.receiveShadow = true; m.visible = false; return R.add(m); });
  R.roomA = A; return A;
}
