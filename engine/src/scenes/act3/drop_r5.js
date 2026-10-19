// ACT III · 86.385-94.204 · DROP 1 in 3D, ROUND 5 (talos_r5, docs/game_design_half2_r5.md): ROOM A re-staged. Behind --r5
// (R5() in common.js, dispatched from drop.js); the round-4 staging (drop.js setupR4) and the approved v2 (drop_v2.js) stay
// untouched and are the default. Layout: talos_plan.js RA5 (all cameras look +z, from behind the party, at chest height).
//
//   86.385-86.63  the reveal, held through the FIXTURES! stop: the road ends in a clean eraser bite with a crumb pile; across the
//                 gap a tall ruined wall in the amp's line, the blue force-field gate, an empty socket in the ground with a pressure
//                 plate beside it, no receiver; a broken stele in the right foreground carved `> level up reality`. The amp's test
//                 pulse (86.45) splashes on the wall: the block is shown, not labelled.
//   86.63/86.87/87.13  FIXTURES!  Jade's three slashes are the three strokes of ONE graphite slab: 一 the hinge beam on its pier,
//                 丨 the tall slab body, 丿 the slanted strut with the connector crystal (aimed wrong). Spray, dust, camera punch;
//                 freeze 87.26-87.83: a draft, not a bridge, still no target.
//   88.30-88.86   Charlie runs to the bite, pops the hat into the parachute and glides across the gap on the whistle line, landing
//                 on the plate on the 88.86 accent (the canopy folds back into his cap). 89.68 the receiver rises out of the socket.
//   89.95         FUNCTIONS!  Ricky's chord: amp -> slab crystal (it snaps its aim) -> round the wall's east end -> receiver; the
//                 receiver lights, the gate lamps light one by one. Freeze 90.375-91.11 = the glamour frame (k08b: heroes from
//                 behind, the beam's diagonal to the tiny lit receiver).
//   91.11         the re-hit: the receiver flickers and drops; the slab starts to swing and jolts to a stop. 91.335 close-up: a
//                 firefly sits on the receiver lens blinking OFF the beat. hey hey hey (92.56 / 93.18 / 93.58, Ricky's chords as a
//                 metronome): it hops, hops, flies away blinking ON the beat; the receiver holds. On the first hey the slab resumes
//                 and slams down into the gap (92.86, in the close-up's background); the beam fades as it lies down (the receiver
//                 stays latched).
//   92.86-94.204  Jade runs the bridge colouring it; the field drops as she reaches the gate; Ricky follows; Charlie steps off the
//                 plate and tips his hat.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { getWorld } from './world/build.js';
import { make3D, CUE, V, aim, persp, smooth, clamp01, LOOK, csTag } from './common.js';
import { turnCarry } from './turn.js';
import { ensurePB, ensureR4, ensureR5, headingTo, springCam, holdClock, dumpInit, talosDump } from './prebattle_props.js';
import { RA5, roomATracksR5, PLAN } from './talos_plan.js';
import { press, onJoint } from '../../core/motion/index.js';
import { slashPose, heroBlock, aimYawLocal, aimPitch } from './drop.js';
import { makeCarvedFace } from './carved_slab.js';   // (v4b stage_3d) FIXTURES / FUNCTIONS carved into the slab
import { patchPaint } from './world/paint.js';   // (M3) the carved slab shares the leaf's paint (Jade colours the plank at 92.5)

const A5 = RA5;
const { AMP, STUB, BASE, BY, FOOT, HINGE, LAND, LY, SOCKET, PLATE, RECV_H, GATE, WALL, STELE, STRUT, SLASH, RISE, POP, LAND_T, RISE_R, HOP, LAMPS, SWING0, JOLT, SWING_DUR, RESUME, SLAM, HEY, FF, RUN, OFFPLATE, TIP } = A5;
const FUN = CUE.functions;
const STOPS = [CUE.fixStop, CUE.funStop];
const tau = (t) => (t >= CUE.fixStop[0] && t < CUE.fixStop[1] ? CUE.fixStop[0] : t >= CUE.funStop[0] && t < CUE.funStop[1] ? CUE.funStop[0] : t);
const SHOT = [86.385, 88.052, 89.694, 91.335, 92.975, 94.204];   // cuts on beats 209 / 213 / 217 / 221
const L2 = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const LEN = L2(BASE, LAND) - 3;                                    // the plank reaches the lip when it lies down
const RISE_H = 4 + RECV_H + 10 + 8;                                // the receiver starts this far down inside the mesa
// (v4b stage_3d) the carved slab: the leaf's width (local z from LEAF_Z0, widened east) and the carved word's swap on FUNCTIONS!
const LEAF_W = 196, LEAF_Z0 = -23;
const CUT_FIX = 86.819;   // (v4b) the 8th before the 丨 slam: cut to the carved-slab hero frame (still 09)
const CARVE = { fix: CUE.fixtures, fun: CUE.functions, fill: 0.12, d: 3, depth: 4.5, key: 1.5 };   // FUNCTIONS: the rainbow fills the grooves over `fill` s from the chord
// (M3) d: the M1/M2 carve (the leaf box's split, kept for the RNG replay); depth: the grooves now; key: the carved face's raking key
// (M4) from the re-hit cut (SHOT[3]) on: the pencil hatch on the stone (hatchK, x its M3 value) and on the back overlay (backHatch = opacity)
// down to a trace: its parallel light strokes read as motion-blur streaks on the magenta-lit slab (92.0) and on the painted plank
// (93-94.2; fresh_eyes_v4 #3). closeGlow: the FUNCTIONS glow in the firefly close-up (its violet end read as a magenta edge glow).
const M4 = { hatchK: 0.2, backHatch: 0.2, closeGlow: 0.15 };

export async function setup(ctx) {
  PLAN.r5 = true;
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const carry = await turnCarry(ctx, W);
  const PB = await ensurePB(W); const R = await ensureR4(W, ctx); const Q = ensureR5(R); const F = R.figs;
  const A = buildRoomA5(R, Q); await dumpInit();
  // (v4b stage_3d) the carved words on the leaf's party-side face: FIXTURES (graphite grooves) until the FUNCTIONS! chord, then FUNCTIONS
  // (the grooves fill with rainbow light left to right as Ricky's chord lands)
  if (!A.carve) { const S = A.slab;
    const hatchMap = R.hatch(S.wl, S.len, 1).material.map;   // the slab's own pencil hatch, on the face around the letters
    // (M3) carved_slab builds the WHOLE leaf (a chipped voxel-stone solid S.d thick, the word cut CARVE.depth deep, a raking key from the
    // upper left = the sun's side as the camera sees it); the leaf box is hidden; legacy = the M2 call (RNG replay, see carved_slab.js)
    const mk = (word, kind) => makeCarvedFace({ word, w: S.wl, h: S.len, depth: CARVE.depth, thick: S.d, cell: 0.6, letterH: 0.24, yC: 0.6, kind, color: '#ff5a4e', chip: 3, seed: 1, key: CARVE.key, backK: 1,
      legacy: { word, w: S.wl, h: S.len, depth: CARVE.d, slab: CARVE.d, cell: 1.0, letterH: 0.24, yC: 0.6, faceMat: S.mat, kind, hatchMap } });
    const [fx, fn] = await Promise.all([mk('FIXTURES', 'graphite'), mk('FUNCTIONS', 'rainbow')]);
    for (const f of [fx, fn]) { f.group.rotation.y = Math.PI / 2; f.group.position.set(0, 0, S.zc); S.leafPivot.add(f.group);
      // the stone is the leaf: plaster graphite until Jade paints it (the leaf material's paint uniforms, shared), graded like it (H10)
      f.material.userData.noPaint = false; patchPaint(f.material, { plaster: 0x6e6e78 }); Object.assign(f.material.userData.lp.U, S.mat.userData.lp.U); csTag(f.material); }
    S.leaf.visible = false;
    { const hb = S.leafPivot.userData.hatchBack; if (hb) { hb.material.alphaMap = fx.outlineTex(true); hb.material.needsUpdate = true; } }   // the back's hatch follows the chipped silhouette
    A.carve = { fx, fn, hk0: fx.material.userData.carveU.uCvHatchK.value }; csTag(S.mat); }   // (v4b H10) the slab is Jade's drawn stroke: what she paints on it keeps its colour (unpainted = graphite anyway)

  // ---------------------------------------------------------------------------------------------- hero tracks (song time)
  const { jade, charlie, ricky } = roomATracksR5(R, { jade: F.jade.unit, charlie: F.charlie.unit, ricky: F.ricky.unit });
  const TR = { jade, charlie, ricky };
  const reach = (tr, p, r, t0 = RUN) => { for (let t = t0; t < 94.3; t += 1 / 120) { const s = tr.state(t); if (Math.hypot(s.x - p[0], s.z - p[1]) < r) return t; } return 94.3; };
  const tGate = reach(jade, [GATE[0], GATE[1] - 6], 30);
  const tLip = reach(jade, [806, 266], 12);
  const landSeg = charlie.segs.find((s) => s.kind === 'jump');
  console.log(`[engine] [talos_r5] room A: jade on the lip ${tLip.toFixed(3)}, at the gate ${tGate.toFixed(3)}; charlie lands ${landSeg ? landSeg.touch.toFixed(3) : '?'} (want ${LAND_T}); ricky plugs ${ricky.segs.find((s) => s.kind === 'clip')?.t0.toFixed(3)}`);
  for (const tr of [jade, charlie, ricky]) for (const w of tr.warnings || []) console.log('[engine] [talos_r5] motion warning: ' + w);

  // upper-body actions (layers on top of the mocap) ------------------------------------------------------------
  const heyP = (t) => { let k = -1; for (let i = 0; i < HEY.length; i++) if (t >= HEY[i] - 0.02) k = i; return k < 0 ? 0 : k + clamp01((t - HEY[k] + 0.02) / 0.26); };   // one chord cycle per hey
  const layers = {
    jade: [{ anim: 'draw_graphite', t0: SLASH[0] - 0.12, t1: SLASH[2] + 0.35, mask: 'upper', p: () => 0.4 }],
    charlie: [{ anim: 'throw', t0: POP - 0.3, t1: POP + 0.02, mask: 'upper', fade: 0.08, p: (t) => clamp01((t - POP + 0.3) / 0.4) },
      { anim: 'parachute', t0: POP, t1: LAND_T + 0.02, mask: 'all', fade: 0.09 }],
    ricky: [{ anim: 'chord', t0: 89.55, t1: SWING0 + 0.1, mask: 'armsHead', rate: 2 }, { anim: 'chord', t0: HEY[0] - 0.14, t1: HEY[2] + 0.34, mask: 'armsHead', fade: 0.1, p: heyP }],
  };
  // Ricky plugs his jack into the amp (arm IK: reach, push in along the socket axis, let go)
  const plugT0 = ricky.segs.find((s) => s.kind === 'clip').t0, ampFwd = V(1, 0, 0).applyQuaternion(A.amp.quaternion);
  A.amp.updateMatrixWorld(true); const plug = press(A.amp.localToWorld(A.amp.userData.jack.clone()), plugT0, { tHit: plugT0 + 0.32, depth: 2, dir: ampFwd.toArray(), pose: 'grip' });
  const hatOff = (t) => t >= POP - 0.24 && t < LAND_T + 0.16;    // cap in his hand, the canopy, folding back
  const tipR = onJoint(F.charlie, 'cap', [2, 3, 0], TIP - 0.2, TIP + 0.28, { fade: 0.12 });
  const recvC = () => A.recv.userData.crystal.centre();
  const crysC = () => A.slab.crystal.centre();
  // eye-lines: every beat looks at the thing it is about
  const chPos = (t) => { const s = charlie.state(t); return V(s.x, s.y + 40, s.z); };
  const jdPos = (t) => { const s = jade.state(t); return V(s.x, s.y + 40, s.z); };
  const looks = {
    jade: [{ at: V(SOCKET[0], LY + 6, SOCKET[1]), t0: 86.385, t1: 86.6, fade: 0.2 }, { at: () => crysC(), t0: 86.66, t1: 88.0, fade: 0.15 }, { at: chPos, t0: 88.1, t1: 89.6, fade: 0.2 },
      { at: () => recvC(), t0: 89.7, t1: 91.4, fade: 0.2 }, { at: () => A.slab.tipPos(), t0: 92.5, t1: 92.95, fade: 0.15 }, { at: V(GATE[0], LY + 30, GATE[1]), t0: 93.0, t1: 94.3, fade: 0.2 }],
    charlie: [{ at: V(PLATE[0], LY + 4, PLATE[1]), t0: 86.385, t1: 86.6, fade: 0.2 }, { at: () => crysC(), t0: 86.66, t1: 87.9, fade: 0.15 }, { at: V(PLATE[0], LY + 2, PLATE[1]), t0: 87.9, t1: 89.0, fade: 0.2 },
      { at: () => recvC(), t0: 89.4, t1: 92.6, fade: 0.2 }, { at: jdPos, t0: 92.8, t1: 94.3, fade: 0.2 }],
    ricky: [{ at: V(SOCKET[0], LY + 6, SOCKET[1]), t0: 86.385, t1: 86.6, fade: 0.2 }, { at: () => crysC(), t0: 86.66, t1: 87.9, fade: 0.15 }, { at: A.amp.localToWorld(A.amp.userData.jack.clone()).add(V(0, 2, 0)), t0: 88.2, t1: 89.1, fade: 0.2 },
      { at: () => crysC(), t0: 89.3, t1: 90.1, fade: 0.15 }, { at: () => recvC(), t0: 90.15, t1: 93.7, fade: 0.2 }, { at: () => A.slab.tipPos(), t0: 93.75, t1: 94.3, fade: 0.2 }],
  };

  // ---------------------------------------------------------------------------------------------- the glide (Charlie's y during the flight)
  const glideY = (u) => LY * u + 46 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.5)), 1.2);
  const glideU = (t) => (t - POP) / (LAND_T - POP);
  A.amp.updateMatrixWorld(true); const lens0 = A.amp.localToWorld(A.amp.userData.lens.clone());
  const tR = FUN + HOP[1];                                        // the beam reaches the receiver
  const tJolt = SWING0 + SWING_DUR * Math.sqrt(JOLT);

  const scene = await make3D(ctx, W, {
    frame(t) {
      const tc = tau(t);
      PB.begin(); R.begin();
      // ---------------------------------------------------------------------------------- heroes
      const hNH = hatOff(tc);
      const ch = hNH ? F.charlieNH : F.charlie;
      F.jade.group.visible = ch.group.visible = F.ricky.group.visible = true;
      showHead(F.jade);   // Room B's first person hides her head / torso meshes: frames must be order-free, so restore them here
      F.jade.apply(jade, tc, { layers: layers.jade, pencil: true, look: looks.jade });
      ch.apply(charlie, tc, { layers: layers.charlie, look: looks.charlie, hands: hNH ? undefined : { R: tipR } });
      F.ricky.apply(ricky, tc, { layers: layers.ricky, hands: { R: plug.spec }, look: looks.ricky });
      slashPose(F.jade, tc);
      const st = { jade: jade.state(tc), charlie: charlie.state(tc), ricky: ricky.state(tc) };
      { const u = glideU(tc); if (u > 0 && u < 1) { const g = ch.group; g.position.y += glideY(u) - st.charlie.y; g.rotateZ(-0.2 * Math.sin(Math.PI * u)); g.rotateX(0.07 * Math.sin(u * 11) * Math.sin(Math.PI * u)); g.updateMatrixWorld(true); } }
      // the tip of the hat: the cap lifts with his hand on it
      if (!hNH && F.charlie.F.J.cap) { const lift = Math.sin(Math.PI * clamp01((tc - TIP) / 0.34)); const J = F.charlie.F.J.cap; J.position.y += 3.2 * lift; J.rotation.z -= 0.3 * lift; }
      carry.update(t, { ricky: { x: st.ricky.x, z: st.ricky.z }, jade: { x: st.jade.x, z: st.jade.z }, charlie: { x: st.charlie.x, z: st.charlie.z } });
      P.beam.visible = false;   // the turn's switch-4 click beam stays out of the r5 reveal (M1 notes)

      // ---------------------------------------------------------------------------------- the room
      for (const o of [A.wall, A.amp, A.plinth, A.recv, A.gate, A.conduit, A.stub, A.stub.userData.lip, A.stub.userData.crumbs, A.stele, A.plate, A.socket, A.pad, A.pad2, A.slab.group]) o.visible = true;
      // the receiver rises out of the socket on 89.68 (a slight overshoot), lit when the beam reaches it, flickering while the firefly sits on it
      { const u = smooth(RISE_R, RISE_R + 0.24, tc); const over = 3 * Math.sin(Math.PI * clamp01((tc - RISE_R - 0.16) / 0.22)); A.recv.position.y = LY - RISE_H + RISE_H * u + over; }
      A.recv.userData.crystal.reset(); A.recv.userData.crystal.visible = true;
      const ffGlow = fireflyAt(tc);
      const flick = tc >= SWING0 && tc < RESUME ? 0.45 - 0.38 * ffGlow : 1;
      const recvLit = smooth(tR, tR + 0.06, tc) * flick;
      A.recv.userData.crystal.lit(recvLit, tc);
      A.recv.userData.crystal.pulse(tc - tR, V(0, 0, -1), 0.7, 1.4);
      if (tc >= RESUME) A.recv.userData.crystal.pulse(tc - RESUME, V(0, 0, -1), 0.5, 1.1);   // it holds
      A.gate.userData.lamps.forEach((l, k) => { l.material.emissiveIntensity = 4 * smooth(LAMPS[k], LAMPS[k] + 0.03, tc) * flick; });
      const fieldOpen = smooth(tGate - 0.3, tGate + 0.04, t);
      A.gate.userData.field.set(t, fieldOpen, 0.6 * T.pulse(tc, LAMPS, 0.1));
      A.conduit.set([[A.cp[0], A.cp[1], 1]], { gap: 4, phase: recvLit > 0 ? tc * 40 : 0, scale: recvLit > 0 ? 1 : 0.6 });
      A.conduit.material.color.set(recvLit > 0 ? '#ff9ae6' : '#5a4a55').multiplyScalar(recvLit > 0 ? 2.2 : 1);
      // the socket: its ring breathes until the receiver is up; the plate lights when Charlie lands on it (or the spare: here he stays until 93.7, then it releases: the receiver is latched)
      A.socket.userData.ring.material.opacity = tc < RISE_R ? 0.45 + 0.4 * Math.sin(tc * 8) ** 2 : 0.3;
      const held = plateHeldA(st.charlie, tc);
      A.plate.userData.slab.position.y = held ? 0.6 : 1.5; A.plate.userData.edgeMat.color.set(held ? '#ffe7a8' : '#5a5048').multiplyScalar(held ? 3 : 1);
      // the amp lens; the cable once Ricky has plugged in
      const lens = A.amp.localToWorld(A.amp.userData.lens.clone());
      A.amp.userData.lensMat.color.set('#ff5fd2').multiplyScalar(tc >= FUN ? 3 : 0.25);
      { const jack = A.amp.localToWorld(A.amp.userData.jack.clone()); const gtr = F.ricky.F.items.guitar; const plugT = plugT0 + 0.35;
        const gj = gtr ? gtr.localToWorld(gtr.userData.strum.clone()) : F.ricky.hand('R'); if (tc >= plugT && tc < 93.8) R.setCable(gj, jack, 10); }

      // ---------------------------------------------------------------------------------- the slab: three strokes, the swing
      const S = A.slab;
      const riseOf = (k) => { const t0 = SLASH[k] + 0.04; if (tc < t0) return -1; const u = clamp01((tc - t0) / RISE); return 1 - Math.pow(1 - u, 3) + 0.06 * Math.sin(Math.PI * u); };
      { const e1 = riseOf(0), e2 = riseOf(1), e3 = riseOf(2); const drop = LEN + 240;
        S.pierG.visible = e1 >= 0; S.pierG.position.y = -(1 - Math.max(0, e1)) * drop;
        S.leafPivot.visible = e2 >= 0; S.leafPivot.position.y = S.pivY - (1 - Math.max(0, e2)) * drop;
        S.strut.visible = e3 >= 0; S.strut.position.y = S.strutY - (1 - Math.max(0, e3)) * drop; }
      { const fun = tc >= CARVE.fun; A.carve.fx.group.visible = !fun; A.carve.fn.group.visible = fun; A.carve.fn.setGlow(smooth(CARVE.fun, CARVE.fun + CARVE.fill, tc), (1.9 + 0.9 * T.pulse(tc, [CARVE.fun], 0.25)) * (t >= SHOT[3] - 1e-6 && t < SHOT[4] ? M4.closeGlow : 1)); }   // (M3) gain down: saturated hues (was 3.2-4.8); (M4) the close-up
      { const late = t >= SHOT[3] - 1e-6; for (const f of [A.carve.fx, A.carve.fn]) f.material.userData.carveU.uCvHatchK.value = A.carve.hk0 * (late ? M4.hatchK : 1);   // (M4) the hatch down after the re-hit cut
        const hb = S.leafPivot.userData.hatchBack; if (hb) hb.material.opacity = late ? M4.backHatch : 1;
        S.beam.material = t >= RUN - 0.05 ? S.pierMat : S.mat; }   // (M4) the 一 hinge beam keeps out of Jade's paint (its end beyond the lying plank read as a stray red dash at 93.8)
      const fall = fallAt(tc);
      S.leafPivot.rotation.z = -S.flat * fall; S.strut.userData.crystal.rotation.z = S.flat * fall;   // the crystal rides the plank, upright
      A.pad.visible = A.pad2.visible = tc >= SLASH[0] + 0.04 + RISE;
      { const cr = S.crystal; cr.reset(); cr.visible = true;
        const turn = smooth(FUN + HOP[0], FUN + HOP[0] + 0.14, tc);
        if (turn >= 1) cr.aimAt(recvC()); else cr.aimYaw(S.wrongYaw * (1 - turn) + aimYawLocal({ crystal: cr }, recvC()) * turn, (1 - turn) * S.wrongPitch + turn * aimPitch(cr, recvC()));
        const lit = tc >= FUN + HOP[0] ? smooth(FUN + HOP[0], FUN + HOP[0] + 0.04, tc) * (1 - beamOff(tc)) : 0;
        cr.lit(lit * 0.7, tc); cr.pulse(tc - FUN - HOP[0], V(0, 1, 0), 0.45, 1); }
      // Jade colours the slab as she runs across (the colour stays: a function now)
      if (t >= RUN - 0.05) { const s = st.jade; const along = clamp01((s.z - LAND[1]) / (HINGE[1] - LAND[1])); const c = smooth(RUN - 0.05, RUN + 0.3, t);
        S.mat.userData.lp.edge(14).addSphere(LAND[0], 2, LAND[1], (10 + 22 * c) + (LEN + 36) * along); }

      // ---------------------------------------------------------------------------------- the hat: in his hand, the canopy, back to a cap
      { const cap = PB.cap; const capS = 1.3 * R.hs; const can = Q.canopy; for (const s of Q.strings) s.visible = false;
        if (tc >= POP - 0.24 && tc < POP) { cap.visible = true; const h = F.charlieNH.hand('R'); cap.position.copy(h); cap.rotation.set(0.2, 0, -0.3); cap.scale.setScalar(capS); }
        else if (tc >= POP && tc < LAND_T + 0.16) { const u = glideU(tc); const bloom = smooth(0, 0.14, tc - POP); const fold = smooth(LAND_T, LAND_T + 0.15, tc);
          const head = F.charlieNH.F.J.head.getWorldPosition(V(0, 0, 0)); const h = F.charlieNH.hand('R'); const fw = V(Math.cos(st.charlie.h), 0, Math.sin(st.charlie.h));
          const up = head.clone().add(V(0, 24, 0)).addScaledVector(fw, 3); const p = h.clone().lerp(up, bloom).lerp(head.clone().add(V(0, 8, 0)), fold);
          can.visible = true; can.position.copy(p); can.scale.setScalar(capS * (1 + 3.4 * bloom * (1 - fold))); can.rotation.set(0, -st.charlie.h, -0.22 * bloom * (1 - fold) - 0.12 * Math.sin(u * 11) * Math.sin(Math.PI * clamp01(u)));
          can.updateMatrixWorld(true);
          if (bloom > 0.05 && fold < 0.95) { const hr = F.charlieNH.hand('R'), hl = F.charlieNH.hand('L'); [[6, 5, hr], [6, -5, hr], [-6, 5, hl], [-6, -5, hl]].forEach(([x, z, hh], k) => Q.setString(k, can.localToWorld(V(x, -1, z)), hh)); } } }

      // ---------------------------------------------------------------------------------- FUNCTIONS!: the beam amp -> crystal -> receiver
      const off = beamOff(tc);
      if (tc >= FUN && off < 0.999) {
        const pts = [lens, crysC(), recvC()];
        const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
        const tt = tc - FUN; let d = 0; const H = [0, ...HOP];
        for (let i = 1; i < pts.length; i++) { if (tt >= H[i]) d = L[i]; else { d = L[i - 1] + (L[i] - L[i - 1]) * clamp01((tt - H[i - 1]) / (H[i] - H[i - 1])); break; } }
        const drawn = [pts[0]]; { let r = d; for (let i = 1; i < pts.length && r > 0; i++) { const l = L[i] - L[i - 1]; drawn.push(r >= l ? pts[i] : pts[i - 1].clone().lerp(pts[i], r / l)); r -= l; } }
        const blk = heroBlock(drawn, [st.jade, st.charlie, st.ricky]);
        const fl = tc >= SWING0 && tc < RESUME ? 0.7 + 0.3 * (1 - ffGlow) : 1;
        R.beams[0].visible = true; R.beams[0].set(blk.pts, 1, { width: (1 - off) * fl * (1 + 0.35 * T.pulse(tc, [FUN, ...HEY], 0.2) + 0.12 * Math.sin(tc * 40)) });
        if (blk.hit) R.glowAt(6, blk.hit, 16, 0.9 * (1 - off));
        pts.slice(1).forEach((p, i) => { if (tt >= H[i + 1] && i < blk.seg) R.glowAt(i, p, (26 + 14 * T.pulse(tc, [FUN + H[i + 1]], 0.15)) * (i === 1 ? fl : 1), 0.9 * (1 - off)); });
        R.glowAt(5, lens, 22, 1 - off);
      }
      if (recvLit > 0.02) R.glowAt(4, recvC(), 24 * recvLit, 0.9 * recvLit);

      // ---------------------------------------------------------------------------------- particles
      const seaY = -2;
      P.burst.visible = true;
      P.burst.run(tc, [
        ...[0, 1, 2].map((k) => ({ t0: SLASH[k] + 0.04, x: BASE[0] + [0, 0, 28][k], y: seaY, z: BASE[1] - [8, 8, 0][k], n: 40, speed: 120, up: 140, g: 260, dur: 1.0, seed: 70 + k, size: 1.9, colors: ['#ffffff', '#cfe6f2', '#9fc6dc'] })),
        ...[0, 1, 2].map((k) => ({ t0: SLASH[k] + 0.04 + RISE, x: BASE[0] + [0, 0, 36][k], y: [12, LEN + 12, STRUT.anchorY - STRUT.len + 12][k], z: BASE[1] - [6, 6, 0][k], n: 14, speed: 50, up: 30, g: 200, dur: 0.6, seed: 80 + k, size: 1.8, colors: ['#4a4a50', '#9a9aa2'] })),
        { t0: SLAM, x: LAND[0], y: 3, z: LAND[1], n: 26, speed: 80, up: 34, g: 220, dur: 0.7, seed: 90, size: 2.1, colors: ['#4a4a50', '#9a9aa2', '#e8dcc6'] },
        { t0: tJolt, x: BASE[0], y: 70, z: BASE[1] - 50, n: 10, speed: 40, up: 20, g: 200, dur: 0.5, seed: 91, size: 1.6, colors: ['#4a4a50', '#9a9aa2'] },
        { t0: RISE_R, x: SOCKET[0], y: LY + 1, z: SOCKET[1], n: 22, speed: 50, up: 26, g: 160, dur: 0.55, seed: 92, size: 1.7, colors: ['#e8dcc6', '#cfc0a4', '#ffffff'] },
        { t0: LAND_T, x: PLATE[0], y: LY + 2, z: PLATE[1], n: 12, speed: 40, up: 16, g: 120, dur: 0.45, seed: 93, size: 1.4, colors: ['#ffd27a', '#ffffff'] },
      ]);
      P.sparks.visible = true;
      P.sparks.run(tc, [
        { t0: RUN - 0.05, x: LAND[0], y: 2, z: LAND[1] + 8, n: 16, speed: 45, up: 30, g: 120, dur: 0.5, seed: 200, colors: ['#ff4d6d', '#ffe14d', '#3ad06a', '#2bb4e8', '#a35cff'] },
        { t0: tGate - 0.1, x: GATE[0], y: LY + 40, z: GATE[1], n: 30, speed: 60, up: 20, g: 40, dur: 0.6, seed: 500, colors: ['#5ab4ff', '#ffffff'] },
        ...HEY.map((h, i) => { const p = recvC(); return { t0: h, x: p.x, y: p.y + 4, z: p.z, n: 8, speed: 26, up: 14, g: 60, dur: 0.35, seed: 520 + i, colors: ['#e8ff6a', '#ffffff'] }; }),
      ]);

      // ---------------------------------------------------------------------------------- cameras (cuts on beats, >= 1.2 s)
      const cam = cameraA5(t, tc, st, TR);
      const camera = aim(persp('dropR5', aspect), cam.pos, cam.tgt, cam.fov);
      talosDump(t, { room: 'A', solids: { wall: A.wall, amp: A.amp, plinth: A.plinth, gate: A.gate, recv: A.recv, stele: A.stele, stub: A.stub, slab: A.slab.group, housing: null },
        heroes: { jade: F.jade, charlie: ch, ricky: F.ricky }, states: st, supports: { stub: A.stub, slab: A.slab.group, pad: A.pad, plate: A.plate, socket: A.socket }, beams: { relay: R.beams[0], pulse: R.beams[1], switch: P.beam }, camera });
      return { camera, target: cam.tgt, focus: cam.focus || cam.tgt, look: LOOK({ rays: 0.3, dofAmount: cam.dof ?? 0.18, r5: { columns: { keep: [] }, ...(cam.r5 || {}) } }), shadowExtent: 650 };
    },
  });

  // ---------------------------------------------------------------------------------------------- world culls (restored after every render)
  // Every Room A r5 camera stands on the meadow side of the causeway (z -120..-200, x 700-900) and looks +z over the party: the merged
  // ruin / colonnade meshes and the voxel colonnade instances in that box would sit in the lens; the compose layer's sea arcade and
  // s88 columns are in the gap; W.ruins and the avenue cypresses between the camera and the sea are the "ten columns" the design
  // caps at three. All hidden per frame and restored right after the render (frames are order-free).
  const CULL = { x0: 560, x1: 1060, z0: -340, z1: -20, yMin: 8 };
  const inBox = (bb) => bb.max.x > CULL.x0 && bb.min.x < CULL.x1 && bb.max.z > CULL.z0 && bb.min.z < CULL.z1 && bb.max.y > CULL.yMin;
  const culled = []; { const bb = new THREE.Box3(); W.scene.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || o.userData.noAO) return; if (o.parent === R.root || o.parent === PB.root) return;
    let q = o; while (q && q !== PB.root) q = q.parent; if (q === PB.root) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); o.updateWorldMatrix(true, false); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); if (isFinite(bb.min.x) && inBox(bb) && (bb.max.x - bb.min.x) < 900) culled.push(o); }); }
  const lensVox = []; { const m4 = new THREE.Matrix4(), pp = new THREE.Vector3(); W.scene.traverse((o) => { if (!o.isInstancedMesh || o.count < 2000 || o.name) return; const ids = [];
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); pp.setFromMatrixPosition(m4).applyMatrix4(o.matrixWorld); if (pp.y > CULL.yMin && pp.x > CULL.x0 && pp.x < CULL.x1 && pp.z > CULL.z0 && pp.z < CULL.z1) ids.push(i); }
    if (ids.length) lensVox.push({ o, ids, saved: ids.map((i) => { const m = new THREE.Matrix4(); o.getMatrixAt(i, m); return m; }) }); }); }
  console.log(`[engine] [talos_r5] room A culls: ${culled.length} meshes, ${lensVox.reduce((s, L) => s + L.ids.length, 0)} voxel instances in ${lensVox.length} meshes`);
  const zero = new THREE.Matrix4().makeScale(0, 0, 0); let voxOff = false;
  const voxSet = (off) => { if (off === voxOff) return; voxOff = off; for (const L of lensVox) { L.ids.forEach((i, k) => L.o.setMatrixAt(i, off ? zero : L.saved[k])); L.o.instanceMatrix.needsUpdate = true; } };
  const base = scene.update; scene.update = (t) => { base(t); const D = W.compose?.dressing; if (D?.s88) D.s88.visible = false; if (W.compose?.root) W.compose.root.visible = false;
    for (const o of culled) o.visible = false; if (W.ruins) W.ruins.visible = false; for (const m of W.avenue) if (m.position.x > 560 && m.position.x < 1060) m.visible = false; voxSet(true); };
  const rend = scene.render; scene.render = (t, target) => { const lk = ctx.post?.look; let sv = null;
    if (t < SHOT[1] && lk?.mat?.uniforms?.uStreak) { sv = lk.mat.uniforms.uStreak.value; lk.mat.uniforms.uStreak.value = 0; }
    rend(t, target); if (sv !== null) lk.mat.uniforms.uStreak.value = sv;
    if (W.compose?.root) W.compose.root.visible = true; for (const m of W.avenue) m.visible = true; for (const o of culled) o.visible = true; if (W.ruins) W.ruins.visible = true; voxSet(false); };
  return scene;

  // ---------------------------------------------------------------------------------------------- state helpers (pure in t)
  function fallAt(tc) {
    if (tc < SWING0) return 0;
    if (tc < tJolt) return Math.pow((tc - SWING0) / SWING_DUR, 2);
    if (tc < RESUME) return JOLT + 0.012 * Math.sin((tc - tJolt) * 70) * Math.exp(-(tc - tJolt) * 6);   // the jolt: a shudder that dies out
    const u = clamp01((tc - RESUME) / (SLAM - RESUME)); return JOLT + (1 - JOLT) * u * u;
  }
  function beamOff(tc) { return smooth(RESUME + 0.04, SLAM - 0.1, tc); }   // the beam fades as the slab lies down; the receiver stays latched
  function plateHeldA(s, tc) { return tc >= LAND_T - 0.02 && tc < OFFPLATE + 0.1 && Math.hypot(s.x - PLATE[0], s.z - PLATE[1]) < 9; }
  /** the firefly on the receiver lens: blinks OFF the beat; hops on the first two heys; flies away on the third blinking ON the beat.
   *  Returns its glow (0..1) for the receiver's flicker. */
  function fireflyAt(tc) {
    const ff = PB.bugs.firefly; if (tc < FF.on || tc >= FF.gone) return 0;
    ff.visible = true; const c = recvC(); const hs = R.hs;
    let p = c.clone().add(V(0, 4.6 * 1.35 + 0.6, 0)); let yaw = -2.4;
    for (const [k, th] of FF.hop.entries()) { if (tc < th) break; const u = clamp01((tc - th) / 0.16); const d = [[3.6, 0.6, -3.2], [7.2, -3.2, -6.4]][k]; p.add(V(d[0] * u, d[1] * u + 3 * Math.sin(Math.PI * u), d[2] * u)); yaw += 0.6 * u; }
    let glow; let anim = 'bug';
    if (tc >= FF.off) { const u = clamp01((tc - FF.off) / 0.72); p.add(V(-44 * u, 36 * Math.sin(Math.PI * u) + 26 * u, -34 * u)); p.y += 1.2 * Math.sin(tc * 23); yaw = -2.4 + 1.1 * u; anim = 'idle';
      glow = T.beatPulse(tc, 1, 0.1) > 0.35 ? 1 : 0.05; }   // scared off: blinks ON the beat now (a preview of ON BEAT)
    ff.position.copy(p); ff.rotation.set(0, yaw, 0); ff.scale.setScalar(1);
    ff.set({ anim, t: tc, beat: T.beatAt(tc), ...(glow != null ? { glow } : {}) });
    return ff.userData.U?.glow ?? 0;
  }

  // ---------------------------------------------------------------------------------------------- shots (chest height, from behind the party, looking +z)
  function cameraA5(t, tc, st, TR) {
    const C = A5.CAM;
    if (t >= T.snap(CUT_FIX) - 1e-6 && t < SHOT[1]) {   // (v4b stage_3d) A1F: FIXTURES! (still 09): low and long behind the party, the
      // carved slab slams up and fills the middle of the frame (the biggest thing on screen), the trio small at its foot on the right;
      // a slow push through the stop; the slab sharp (focus on the word), the DOF capped (common.js)
      const c = holdClock(t, STOPS); const k = smooth(CUT_FIX, 88.052, c);
      const pos = V(835, 30, -380).lerp(V(836, 31, -362), k), tgt = V(876, 94, 245);   // (v4b M2) lower + longer: it looms (~78 % of the height)
      const sh = 2.2 * T.pulse(tc, SLASH.map((x) => x + 0.04 + RISE), 0.1); pos.x += Math.sin(tc * 90) * sh; pos.y += Math.cos(tc * 70) * sh;
      const word = V(887, 112, 242);
      return { pos, tgt, fov: 21, focus: word, dof: 0.12, r5: { dof: 0.25, focus: word, tilt: 0, beam: 0 } };
    }
    if (t < SHOT[1]) {   // A1: the reveal: a crane from chest height up to just above head height over the hold (M1 notes: the lock must read:
      // the bite, the cliff drop, the wall in the amp's line, the socket + plate), held through the slab's three slams and the stop;
      // focus on the stele for the first half second, then a rack to the gap
      const c = holdClock(t, STOPS); const k = smooth(86.385, 86.72, c), k2 = smooth(86.72, 87.26, c);   // up to ~1.5x head height by FIXTURES! (86.63), still rising gently through the stop (M1b notes)
      const pos = V(...C.reveal[0]).lerp(V(...C.reveal1[0]), k).lerp(V(...C.reveal2[0]), k2), tgt = V(...C.reveal[1]).lerp(V(...C.reveal1[1]), k).lerp(V(...C.reveal2[1]), k2);
      const sh = 1.7 * T.pulse(tc, SLASH.map((x) => x + 0.04 + RISE), 0.1); pos.x += Math.sin(tc * 90) * sh; pos.y += Math.cos(tc * 70) * sh;
      const stele = V(STELE[0], 18, STELE[1]); const rack = smooth(86.6, 86.9, c); const fd = pos.distanceTo(stele) * (1 - rack) + 240 * rack;
      return { pos, tgt, fov: 48, focus: rack < 0.5 ? stele : V(780, 4, 120), dof: 0.22, r5: { dof: 0.1, focus: fd, beam: 0 } };
    }
    if (t < SHOT[2]) {   // A2: the glide: behind-right of Charlie at chest height, chasing him across the gap to the plate
      return springCam((tt) => {
        const cs = TR.charlie.state(tt); const u = clamp01(glideU(tt)); const y = u > 0 && u < 1 ? glideY(u) : cs.y;
        const pos = V(cs.x - 44 + 12 * u, y + 36 + 8 * u, cs.z - 124 - 36 * u), tgt = V(cs.x + 2, y + 28, cs.z + 26).lerp(V(PLATE[0], LY + 24, PLATE[1]), 0.4 + 0.3 * u);
        return { pos, tgt, fov: 44, focus: V(cs.x, y + 30, cs.z), r5: { dof: 0.4, focus: V(cs.x, y + 30, cs.z), beam: 0 } };
      }, t, SHOT[1], { w: 6, zeta: 0.72 });
    }
    if (t < SHOT[3]) {   // A3: FUNCTIONS! the glamour stop: low behind the party by the amp; the beam leaves the frame's near corner as one long diagonal
      // to the far crystal (chest height, beside the wall's end) and bends in plan to the tiny lit receiver; sky over a third; the re-hit's jolt
      // (v4b stage_3d) still 10: the carved slab centre-left, FUNCTIONS lighting up rainbow as the chord lands; the beam leaves the amp
      // (right) and crosses in front of the slab to the crystal on its far flank (left), then back to the lit receiver beside it
      const c = holdClock(t, STOPS); const k = smooth(89.694, 91.4, c);
      const pos = V(692 + 6 * k, 46, -300 + 14 * k), tgt = V(852, 98, 245);
      const sh = 1.2 * T.pulse(tc, [tJolt], 0.12) + 1.6 * T.pulse(tc, [CARVE.fun], 0.1); pos.x += Math.sin(tc * 80) * sh; pos.y += Math.cos(tc * 60) * sh;
      const word = V(887, 112, 242);
      return { pos, tgt, fov: 33, focus: word, dof: 0.12, r5: { beam: 1, dof: 0.22, tilt: 0, focus: word, columns: { keep: [] } } };
    }
    if (t < SHOT[4]) {   // A4: the close-up: the firefly on the receiver lens; the slab slams down behind it; a slow drift
      const k = smooth(SHOT[3], SHOT[4], t); const ffp = PB.bugs.firefly.visible ? PB.bugs.firefly.position.clone() : recvC();
      const pos = V(C.close[0][0] - 3 * k, C.close[0][1] - 2 * k, C.close[0][2] - 2 * k), tgt = V(...C.close[1]).lerp(ffp, 0.35);
      return { pos, tgt, fov: 30, focus: ffp, dof: 0.42, r5: { dof: 0.7, focus: ffp, beam: 0 } };
    }
    // A5: the crossing: low on the sea beside the stub, the plank running into the picture, Jade's back, the gate, Charlie at the plate
    return springCam((tt) => { const s = TR.jade.state(Math.min(tt, 93.9)); const u = smooth(SHOT[4], 94.2, tt);
      return { pos: V(C.cross[0][0] - 10 * u, C.cross[0][1] + 4 * u, C.cross[0][2] + 30 * u), tgt: V(C.cross[1][0], C.cross[1][1], C.cross[1][2]).lerp(V(s.x, s.y + 30, s.z), 0.3), fov: 44, r5: { dof: 0.4, focus: V(s.x, s.y + 30, s.z), beam: 0 } }; }, t, SHOT[4], { w: 5, zeta: 0.8 });
  }
}

/** Room A r5 props (built once per world) */
function buildRoomA5(R, Q) {
  if (R.roomA5) return R.roomA5;
  const A = {}; const stone = R.stone, rock = R.rock;
  // the wall: a tall ruined sandstone wall on mesa A's lip, square across the amp -> socket line (its east end leaves the socket in view)
  { const g = new THREE.Group(); const [dx, dz] = WALL.dir; g.position.set(WALL.c[0], 0, WALL.c[1]); g.rotation.y = Math.atan2(-dz, dx);
    g.add(R.box(WALL.len, WALL.top + 214, WALL.thick, stone, 0, (WALL.top - 214) / 2, 0));
    const q = WALL.len / 120;
    for (const [x, w, h] of [[-46, 22, 12], [-22, 26, 20], [6, 30, 8], [32, 24, 16], [50, 18, 7]]) g.add(R.box(w * q, h, WALL.thick + 2, stone, x * q, WALL.top + h / 2, 0));
    for (const [x, w, h] of [[-42, 30, 8], [22, 38, 6]]) g.add(R.box(w * q, h, WALL.thick + 6, stone, x * q, WALL.top - 40 - h, 0));
    // a bite out of the wall's top (the Eraser has been here too)
    A.wall = R.add(g);
    const nx = -dz, nz = dx;
    A.wallHit = (a, b) => { const c = V(WALL.c[0], 0, WALL.c[1]), n = V(nx, 0, nz); const den = b.clone().sub(a).dot(n); const s0 = c.clone().sub(a).dot(n) / den;
      const p = a.clone().lerp(b, s0); return p.addScaledVector(n, Math.sign(-den) * (WALL.thick / 2 + 0.6)); };
  }
  // the amp-emitter on its plinth, aimed straight at the socket (the wall cuts the line)
  A.amp = R.makeAmp(); A.amp.position.set(AMP[0], A5.AMP_Y, AMP[1]); A.amp.rotation.y = -headingTo(AMP, SOCKET);
  A.plinth = R.add(R.box(26, A5.AMP_Y, 24, stone, AMP[0], A5.AMP_Y / 2, AMP[1])); A.plinth.rotation.y = A.amp.rotation.y;
  // the eaten road: the stub with the eraser bite; the stele; the plate; the socket (the receiver rises out of it); the gate
  A.stub = Q.makeStub(STUB);
  A.stele = Q.makeStele(['> level up', 'reality'], { w: 24, h: A5.STELE_H, d: 5 }); A.stele.position.set(STELE[0], 0, STELE[1]); A.stele.rotation.set(A5.STELE_LEAN, STELE_YAW_OF(), 0);
  A.plate = Q.makePlate(); A.plate.position.set(PLATE[0], LY, PLATE[1]);
  A.socket = Q.makeSocket(); A.socket.position.set(SOCKET[0], LY, SOCKET[1]);
  A.recv = R.makeReceiver({ h: RECV_H }); A.recv.position.set(SOCKET[0], LY - RISE_H, SOCKET[1]);
  A.gate = R.makeGate({ w: 46, h: 84 }); A.gate.position.set(GATE[0], LY, GATE[1]); A.gate.rotation.y = Math.PI;   // the lamps face the bridge
  A.cp = [V(SOCKET[0] + 6, LY + 0.6, SOCKET[1] + 4), V(GATE[0] - 20, LY + 0.6, GATE[1] - 6)];
  A.conduit = R.dashes[3];
  // the pads: at the bite's lip under the plank's free end, and at the hinge between the plank's top end and the mesa lip (shown once the pier is up)
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(28, 30, 3, 28), R.graphiteDark('#3a3a42')); m.position.set(FOOT[0], -1.5, FOOT[1]); m.castShadow = m.receiveShadow = true; m.visible = false; A.pad = R.add(m); }
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(22, 24, 3, 28), R.graphiteDark('#3a3a42')); m.position.set(HINGE[0], LY - 1.5, HINGE[1]); m.castShadow = m.receiveShadow = true; m.visible = false; A.pad2 = R.add(m); }
  // the one slab: 一 the pier + hinge beam, 丨 the leaf hinged at the deck, 丿 the strut off its top corner with the crystal
  { const w = 46, d = 9, len = LEN; const mat = R.graphiteDark('#ff5a4e'); const pier = R.graphiteDark('#3a3a42');
    const group = new THREE.Group(); group.position.set(BASE[0], 0, BASE[1]); group.rotation.y = -headingTo(BASE, LAND);
    const y0 = BY; const pivY = y0 - d;
    const pierG = new THREE.Group(); pierG.add(R.box(w + 10, 240, d + 30, pier, 0, pivY - 120, 0)); pierG.add(R.box(w + 16, 8, 18, mat, d / 2 + 2, pivY + 4, 0)); group.add(pierG);
    const leafPivot = new THREE.Group(); leafPivot.position.set(d / 2 + 2, pivY, 0); group.add(leafPivot);
    // (v4b stage_3d) the 丨 leaf is the carved FIXTURES / FUNCTIONS slab (stills 09 / 10): widened EAST only (local +z; screen left from
    // the party's cameras) to LEAF_W, so the word reads; its west edge (Charlie's glide lane) and the hinge / landing are unchanged.
    // The party-side face (local +x) is the carved face (setup() adds it); the back keeps the hatch.
    const wl = LEAF_W, zc = LEAF_Z0 + wl / 2;
    const leaf = R.box(d - CARVE.d, len, wl, mat, -(d + CARVE.d) / 2, len / 2, zc); leafPivot.add(leaf);   // the front CARVE.d units are the carved face
    for (const [x, ry] of [[-d - 0.06, -Math.PI / 2]]) { const h = R.hatch(wl, len, 1); h.rotation.y = ry; h.position.set(x, len / 2, zc); leafPivot.add(h); leafPivot.userData.hatchBack = h; }   // (M3) kept for the chipped outline
    // the group faces the landing (-z world, south): local +z is the slab's EAST flank: the strut slants down and out there from mid-height
    const strut = Q.makeStrut(V(0, -STRUT.len, STRUT.out), mat, { r: 6.5, fin: 1.8 }); strut.position.set(-d / 2, STRUT.anchorY, LEAF_Z0 + LEAF_W); leafPivot.add(strut);
    const slope = Math.atan2(0 - y0, len);   // the plank falls from the mesa's height (10) down to the stub (0)
    R.add(group);
    A.slab = { group, pierG, beam: pierG.children[1], pierMat: pier, leafPivot, leaf, strut, crystal: strut.userData.crystal, mat, len, pivY, d, zc, wl, strutY: STRUT.anchorY, flat: Math.PI / 2 - slope, wrongYaw: 2.3, wrongPitch: 0.45,
      tipPos: () => { leafPivot.updateWorldMatrix(true, false); return V(0, len, 0).applyMatrix4(leafPivot.matrixWorld); } };
  }
  R.roomA5 = A; return A;
}
const STELE_YAW_OF = () => A5.STELE_YAW;
/** restore what Room B's first person hides on the shared Jade figure (head + torso meshes) */
export function showHead(fig) { const J = fig.F.J; J.head.visible = true; for (const j of [J.body, J.chest]) if (j) for (const c of j.children) if (c.isMesh) c.visible = true; }
