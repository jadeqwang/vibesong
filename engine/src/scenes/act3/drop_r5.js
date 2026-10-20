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
import { HANDS_V47, guitarPick47 } from '../../core/voxfig.js';   // (v47_hands) Ricky's picking hand strikes over the strings
import { patchPaint } from './world/paint.js';   // (M3) the carved slab shares the leaf's paint (Jade colours the plank at 92.5)

const A5 = RA5;
const { AMP, STUB, BASE, BY, FOOT, HINGE, LAND, LY, SOCKET, PLATE, RECV_H, GATE, WALL, STELE, STRUT, SLASH, RISE, POP, LAND_T, RISE_R, HOP, LAMPS, SWING0, JOLT, SWING_DUR, RESUME, SLAM, HEY, FF, RUN, OFFPLATE, TIP } = A5;
const FUN = CUE.functions;
const STOPS = [CUE.fixStop, CUE.funStop];
// (v47_drop) Jade v4.6: "at 'fixtures' and 'functions' there's a stillness that feels glitched (like a zoom call that has hung)" + "1:32 a closeup
// of a glowy thing, but maybe if the camera is actively zooming out, we can see more context". Cause: tau() below froze the whole scene clock
// (heroes, slab, beam, dust) at the start of the song's two stops (CUE.fixStop 87.26-87.83, CUE.funStop 90.375-91.11) and the A1F / A3
// cameras ran on holdClock (frozen too): ~0.6 / 0.7 s of identical frames, then a pose jump when the music came back.
//   null    = v4.6 (the freeze frames; the firefly close-up holds)
//   'drift' = the clock runs through both stops (the heroes breathe and act: Jade's slash follows through and she looks back at the boys, the
//             boys look up at the slab; at FUNCTIONS Jade glances at Ricky, Ricky's flung arm rings out); the cameras keep a continuous push;
//             the close-up at 91.335 pulls back and cranes up over the receiver to the room (beam, slab falling into the bridge, Charlie, Jade)
//   'punch' = the same + a snap push-in on each stop's hit (the strut slam / the last gate lamp) that keeps creeping, and a hand-held sway
const DROP_V47 = 'drift';
const tau = DROP_V47 ? (t) => t : (t) => (t >= CUE.fixStop[0] && t < CUE.fixStop[1] ? CUE.fixStop[0] : t >= CUE.funStop[0] && t < CUE.funStop[1] ? CUE.funStop[0] : t);
const camClock = (t) => (DROP_V47 ? t : holdClock(t, STOPS));   // (v47_drop) the cameras never stop
const V47 = { strutHit: 87.33, lampHit: 90.35, punchFov: [2.4, 2.6],   // 'punch': the stop's hit = the strut lands (SLASH[2] + 0.04 + RISE) / the last gate lamp; fov snapped in by
  settle: [87.43, 87.86],   // Jade's slash pose blends back to her stance (was a hard release, hidden by the freeze)
  pull: { p0: [727, 58, 350], pc: [690, 100, 425], p1: [605, 215, 445], t1: [775, 10, 205], fov: [30, 44], hold: 0.16, land: 0.86 } };   // A4: the pull-back (bezier p0 -> pc -> p1): high over the receiver's north-west, the wall in front; Ricky + amp, the beam to the crystal and down into the receiver, Charlie on the plate
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
// (v45_laser) Jade v4.4: "maybe at 1:30, ricky's guitar playing turns on the laser?" Ricky's power chord IS the trigger:
//   null    = v4.4 (generic chord loop; the jack plugged at 89.38 off screen)
//   'strum' = cameras unchanged: Ricky plugs in on the 89.69 drum accent, winds his arm up through the guitar swell, slams the
//             power chord on the real strum (the 'other' stem's strum burst 89.933-89.985), the amp lens flares and the beam fires;
//             a second stroke, then arms flung out (sustain lean) through the glamour freeze; strums again on the 91.11 re-hit
//   'wave'  = the same + a camera beat on Ricky (beat 212 -> 214, 89.284-90.105, medium from his right-back, the slab behind):
//             a sound wave rings out of the guitar, a spark runs down the cable into the amp, the beam ignites into FUNCTIONS
const LASER_V45 = 'wave';
const LZ_CAM = { pos: [[550, 53, -48], [556, 53, -42]], tgt: [779, 58, 92], fov: 42 };   // (v45_laser 'wave') the insert: west-south-west of Ricky (at the amp, 648,-16; he faces west), looking NE past him: his face + guitar left, the amp lens centre, the slab right
const LZ_HITS = [89.933, 90.05, 91.11];   // (v45_laser) Ricky's strokes that pulse the amp / beam (the power chord, the second stroke, the re-hit)
const LZ = { plug: 89.69, up: 89.86, hit: 89.933, up2: 90.0, hit2: 90.05, fling: 90.1, rehit: 91.11, end: 91.4, ins: [89.284, 90.105], spark: 0.025 };

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
  // (v45_laser) the guitar in playing position (the picking arm is the IK spec rickyPick below), the lean-back sustain through the freeze,
  // then the re-hit strums; the hey chords unchanged
  if (LASER_V45) layers.ricky = [{ anim: 'chord', t0: LZ.plug - 0.3, t1: LZ.fling + (HANDS_V47 ? 0.13 : 0.04), mask: 'armsHead', fade: 0.15, p: () => 0.25 },   // (v47_hands) hold the chord until the sustain is in (the gap let the fretting hand drift off the neck at 90.0-90.1)
    { anim: 'sustain', t0: LZ.fling - 0.04, t1: LZ.rehit + 0.06, mask: 'upper', fade: 0.1 },
    { anim: 'chord', t0: LZ.rehit, t1: LZ.end, mask: 'armsHead', fade: 0.06, p: () => 0.25 }, layers.ricky[1]];
  // Ricky plugs his jack into the amp (arm IK: reach, push in along the socket axis, let go)
  const plugT0 = ricky.segs.find((s) => s.kind === 'clip').t0, ampFwd = V(1, 0, 0).applyQuaternion(A.amp.quaternion);
  A.amp.updateMatrixWorld(true); const plug = LASER_V45 ? press(A.amp.localToWorld(A.amp.userData.jack.clone()), LZ.plug - 0.3, { tHit: LZ.plug, depth: 2, hold: 0.02, dir: ampFwd.toArray(), pose: 'grip' })
    : press(A.amp.localToWorld(A.amp.userData.jack.clone()), plugT0, { tHit: plugT0 + 0.32, depth: 2, dir: ampFwd.toArray(), pose: 'grip' });
  const rickyHand = LASER_V45 ? rickyPick(plug.spec) : plug.spec;
  const jack0 = A.amp.localToWorld(A.amp.userData.jack.clone());
  const FX45 = LASER_V45 === 'wave' ? buildFx45(R) : (R.fx45 || null);
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
  if (DROP_V47) {   // (v47_drop) eye-lines through the stops (the clock runs now, so the heads travel): FIXTURES = the boys look UP the slab they
    // just saw slam up, Jade (the slasher) checks the boys over her shoulder, then back to the slab; FUNCTIONS = Jade glances at Ricky (he did it), back to the beam
    const slabTop = () => A.slab.tipPos(); const rkHead = (t) => { const s = ricky.state(t); return V(s.x, s.y + 44, s.z); };
    looks.jade.splice(1, 1, { at: () => crysC(), t0: 86.66, t1: 87.4, fade: 0.15 }, { at: chPos, t0: 87.4, t1: 87.72, fade: 0.14 }, { at: slabTop, t0: 87.72, t1: 88.05, fade: 0.14 });
    looks.jade.splice(looks.jade.findIndex((L) => L.t0 === 89.7), 1, { at: () => recvC(), t0: 89.7, t1: 90.5, fade: 0.2 }, { at: rkHead, t0: 90.5, t1: 90.86, fade: 0.14 }, { at: () => recvC(), t0: 90.86, t1: 91.4, fade: 0.16 });
    looks.charlie.splice(1, 1, { at: () => crysC(), t0: 86.66, t1: 87.25, fade: 0.15 }, { at: slabTop, t0: 87.25, t1: 87.9, fade: 0.18 });
    looks.ricky.splice(1, 1, { at: () => crysC(), t0: 86.66, t1: 87.3, fade: 0.15 }, { at: slabTop, t0: 87.3, t1: 87.95, fade: 0.2 });
  }

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
      if (inIns(t)) F.jade.group.visible = false;   // (v45_laser) in the insert she is only ever directly behind Ricky (a two-headed read): keep her out of it; she is at her mark in the wide
      showHead(F.jade);   // Room B's first person hides her head / torso meshes: frames must be order-free, so restore them here
      F.jade.apply(jade, tc, { layers: layers.jade, pencil: true, look: looks.jade });
      ch.apply(charlie, tc, { layers: layers.charlie, look: looks.charlie, hands: hNH ? undefined : { R: tipR } });
      F.ricky.apply(ricky, tc, { layers: layers.ricky, hands: { R: rickyHand }, look: looks.ricky });
      slashPose(F.jade, tc);
      if (DROP_V47) slashSettle(F.jade, tc);
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
      const ffGlow = fireflyAt(DROP_V47 && tc >= CUE.funStop[0] && tc < CUE.funStop[1] ? CUE.funStop[0] : tc);   // (v47_drop) it still lands on the re-hit (it would pop in mid-stop otherwise)
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
      A.amp.userData.lensMat.color.set('#ff5fd2').multiplyScalar(LASER_V45 ? lensK(tc) : tc >= FUN ? 3 : 0.25);
      if (A.amp.userData.stripe) A.amp.userData.stripe.emissiveIntensity = LASER_V45 && tc >= LZ.plug ? 1.4 + 2.5 * T.pulse(tc, LZ_HITS, 0.12) : 0;   // (v45_laser) the amp's power stripe: on when he plugs in
      let cableAB = null;
      { const jack = A.amp.localToWorld(A.amp.userData.jack.clone()); const gtr = F.ricky.F.items.guitar; const plugT = LASER_V45 ? LZ.plug : plugT0 + 0.35;
        const gj = gtr ? gtr.localToWorld(gtr.userData.strum.clone()) : F.ricky.hand('R'); if (tc >= plugT && tc < 93.8) { R.setCable(gj, jack, 10); cableAB = [gj, jack]; }
        else if (LASER_V45 && tc >= plugT0 && tc < plugT) R.setCable(gj, F.ricky.hand('R'), 5); }   // (v45_laser) the plug in his hand on the way to the jack

      // ---------------------------------------------------------------------------------- the slab: three strokes, the swing
      const S = A.slab;
      const riseOf = (k) => { const t0 = SLASH[k] + 0.04; if (tc < t0) return -1; const u = clamp01((tc - t0) / RISE); return 1 - Math.pow(1 - u, 3) + 0.06 * Math.sin(Math.PI * u); };
      { const e1 = riseOf(0), e2 = riseOf(1), e3 = riseOf(2); const drop = LEN + 240;
        S.pierG.visible = e1 >= 0; S.pierG.position.y = -(1 - Math.max(0, e1)) * drop;
        S.leafPivot.visible = e2 >= 0; S.leafPivot.position.y = S.pivY - (1 - Math.max(0, e2)) * drop;
        S.strut.visible = e3 >= 0; S.strut.position.y = S.strutY - (1 - Math.max(0, e3)) * drop; }
      { const fun = tc >= CARVE.fun; A.carve.fx.group.visible = !fun; A.carve.fn.group.visible = fun; A.carve.fn.setGlow(smooth(CARVE.fun, CARVE.fun + CARVE.fill, tc), (1.9 + 0.9 * T.pulse(tc, [CARVE.fun], 0.25)) * (t >= SHOT[3] - 1e-6 && t < SHOT[4] ? M4.closeGlow : 1)); }   // (M3) gain down: saturated hues (was 3.2-4.8); (M4) the close-up
      { // (v47_drop) the pull-back sees the slab from behind: there the back + outer sides take the face's stone (no darker gloss, no metal) and the raking
        // key mirrored onto the back, easing back to the v4.6 back as it lies down into the plank (the 93.2 crossing's plank top is matched to that)
        const U0 = A.carve.fn.material.userData.carveU; if (!A.carve.back0) A.carve.back0 = { k: U0.uCvBackK.value, dir: U0.uCvKeyDir.value.clone() };
        const b0 = A.carve.back0; const inPull = DROP_V47 && t >= SHOT[3] - 1e-6 && t < SHOT[4]; const kb = inPull ? 1 - smooth(RESUME, SLAM + 0.08, tc) : 0;
        for (const f of [A.carve.fx, A.carve.fn]) { const U = f.material.userData.carveU; U.uCvBackK.value = b0.k * (1 - kb); U.uCvKeyDir.value.set(b0.dir.x, b0.dir.y, b0.dir.z * (1 - 2 * kb)).normalize(); } }
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
        R.beams[0].visible = true; R.beams[0].set(blk.pts, 1, { width: (1 - off) * fl * (1 + 0.35 * T.pulse(tc, [FUN, ...HEY, ...(LASER_V45 ? LZ_HITS : [])], 0.2) + 0.12 * Math.sin(tc * 40)) });
        if (blk.hit) R.glowAt(6, blk.hit, 16, 0.9 * (1 - off));
        pts.slice(1).forEach((p, i) => { if (tt >= H[i + 1] && i < blk.seg) R.glowAt(i, p, (26 + 14 * T.pulse(tc, [FUN + H[i + 1]], 0.15)) * (i === 1 ? fl : 1), 0.9 * (1 - off)); });
        R.glowAt(5, lens, 22 * (LASER_V45 ? 1 + 1.4 * T.pulse(tc, LZ_HITS, 0.14) : 1), 1 - off);
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
        ...(LASER_V45 ? [{ t0: LZ.plug, x: jack0.x, y: jack0.y, z: jack0.z, n: 10, speed: 30, up: 18, g: 120, dur: 0.3, seed: 540, colors: ['#ff9ae6', '#ffffff'] }] : []),   // (v45_laser) the jack goes in
        { t0: RUN - 0.05, x: LAND[0], y: 2, z: LAND[1] + 8, n: 16, speed: 45, up: 30, g: 120, dur: 0.5, seed: 200, colors: ['#ff4d6d', '#ffe14d', '#3ad06a', '#2bb4e8', '#a35cff'] },
        { t0: tGate - 0.1, x: GATE[0], y: LY + 40, z: GATE[1], n: 30, speed: 60, up: 20, g: 40, dur: 0.6, seed: 500, colors: ['#5ab4ff', '#ffffff'] },
        ...HEY.map((h, i) => { const p = recvC(); return { t0: h, x: p.x, y: p.y + 4, z: p.z, n: 8, speed: 26, up: 14, g: 60, dur: 0.35, seed: 520 + i, colors: ['#e8ff6a', '#ffffff'] }; }),
      ]);

      // ---------------------------------------------------------------------------------- cameras (cuts on beats, >= 1.2 s)
      const cam = cameraA5(t, tc, st, TR);
      const camera = aim(persp('dropR5', aspect), cam.pos, cam.tgt, cam.fov);
      if (LASER_V45 === 'wave') waveFx(tc, camera, cableAB, lens);
      else if (FX45) FX45.root.visible = false;
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
    rend(t, target); if (sv !== null) lk.mat.uniforms.uStreak.value = sv; if (R.fx45) R.fx45.root.visible = false;   // (v45_laser) the wave fx stay in this scene
    if (W.compose?.root) W.compose.root.visible = true; for (const m of W.avenue) m.visible = true; for (const o of culled) o.visible = true; if (W.ruins) W.ruins.visible = true; voxSet(false); };
  return scene;

  // ---------------------------------------------------------------------------------------------- state helpers (pure in t)
  function fallAt(tc) {
    if (tc < SWING0) return 0;
    if (tc < tJolt) return Math.pow((tc - SWING0) / SWING_DUR, 2);
    if (tc < RESUME) return JOLT + 0.012 * Math.sin((tc - tJolt) * 70) * Math.exp(-(tc - tJolt) * 6);   // the jolt: a shudder that dies out
    const u = clamp01((tc - RESUME) / (SLAM - RESUME)); return JOLT + (1 - JOLT) * u * u;
  }
  /** (v45_laser) picture time inside the 'wave' camera beat on Ricky */
  function inIns(t) { return LASER_V45 === 'wave' && t >= T.snap(LZ.ins[0]) - 1e-6 && t < T.snap(LZ.ins[1]) - 1e-6; }
  function beamOff(tc) { return smooth(RESUME + 0.04, SLAM - 0.1, tc); }
  /** (v47_drop) slashPose() lets go of the third stroke's end pose at SLASH[2] + 0.3 (a hard release the freeze used to hide): blend it back
   *  into her stance over V47.settle, with a small follow-through (the pencil arm carries on down, the torso unwinds) */
  function slashSettle(fig, tc) {
    const [a, b] = V47.settle; if (tc <= a || tc >= b) return; const J = fig.F.J; const D = Math.PI / 180;
    const u = clamp01((tc - a) / (b - a)); const w = 1 - u * u * (3 - 2 * u); const ft = Math.sin(Math.PI * Math.min(1, u * 1.6));   // follow-through bump early in the settle
    const end = { shoulderR: [0, -12, -25 - 14 * ft], elbowR: [0, 0, 6 + 10 * ft], body: [0, 10 - 6 * ft, -18 + 5 * ft], shoulderL: [0, 28, -10] };   // (x, y, z) degrees: the 3rd slash's end (side +1)
    for (const [j, [x, y, z]] of Object.entries(end)) { const r = J[j].rotation; r.set(r.x + (x * D - r.x) * w, r.y + (y * D - r.y) * w, r.z + (z * D - r.z) * w); }
    fig.group.updateMatrixWorld(true);
  }
  /** (v45_laser) the amp lens: dim until plugged, a hum once plugged, charging (flicker) through the guitar swell, full on the chord */
  function lensK(tc) { if (tc >= FUN) return 3 + 2 * T.pulse(tc, LZ_HITS, 0.12); if (tc < LZ.plug) return 0.25; const c = smooth(89.75, LZ.hit, tc); return 0.7 + 1.1 * c + 0.3 * c * Math.sin(tc * 70); }
  /** (v45_laser) Ricky's picking hand (right-arm IK target, song time): the plug-in on the 89.69 accent, the wind-up through the swell,
   *  the power chord slammed down on the real strum (LZ.hit), the follow-through, an upstroke + a second stroke that flings the arm out
   *  (held through the glamour freeze), then 16th strums from the re-hit. Targets are rebuilt each frame from the posed shoulder + guitar. */
  function rickyPick(plugSpec) {
    const up = V(0, 1, 0); const e = (a, b, x) => smooth(a, b, x); const lerp = (a, b, u) => a.clone().lerp(b, u);
    const at = (t, fig) => {
      const FF_ = fig.F; FF_.group?.updateWorldMatrix?.(true, true); fig.group.updateWorldMatrix(true, true);
      const sh = FF_.J.shoulderR.getWorldPosition(V(0, 0, 0)), shL = FF_.J.shoulderL.getWorldPosition(V(0, 0, 0));
      const g = FF_.items.guitar; const G = g.localToWorld(HANDS_V47 ? guitarPick47(g, FF_) : g.userData.strum.clone()); const L = fig._armLen('R') * fig.scale;   // (v47_hands) strike over the strings, not inside the body
      const side = sh.clone().sub(shL).setY(0).normalize(); const fwd = up.clone().cross(side).normalize();
      const W = sh.clone().addScaledVector(up, 0.86 * L).addScaledVector(side, 0.22 * L).addScaledVector(fwd, 0.08 * L);
      const Fo = G.clone().addScaledVector(up, -0.32 * L).addScaledVector(side, 0.14 * L).addScaledVector(fwd, 0.12 * L);
      const Gu = G.clone().addScaledVector(up, 0.2 * L);
      const F2 = sh.clone().add(V(0, 0, 0).addScaledVector(up, -0.5).addScaledVector(side, 0.85).addScaledVector(fwd, 0.1).normalize().multiplyScalar(0.9 * L));
      const strum = () => { const f = T.beatAt(t) * 4; return G.clone().addScaledVector(up, -0.13 * L * Math.sin(2 * Math.PI * (f - Math.floor(f)))); };
      if (t < LZ.plug + 0.04) return plugSpec.at(t);
      const J0 = plugSpec.at(LZ.plug + 0.04);
      if (t < LZ.up) return lerp(J0, W, e(LZ.plug + 0.04, LZ.up, t));
      if (t < LZ.hit - 0.03) return W.addScaledVector(up, 0.05 * L * e(LZ.up, LZ.hit - 0.03, t));
      const Wt = W.clone().addScaledVector(up, 0.05 * L);
      if (t < LZ.hit) { const u = clamp01((t - LZ.hit + 0.03) / 0.03); return lerp(Wt, G, u * u); }
      if (t < LZ.up2) return lerp(G, Fo, 1 - Math.pow(1 - clamp01((t - LZ.hit) / (LZ.up2 - LZ.hit)), 2));
      const mid = (LZ.up2 + LZ.hit2) / 2;
      if (t < mid) return lerp(Fo, Gu, e(LZ.up2, mid, t));
      if (t < LZ.hit2) { const u = clamp01((t - mid) / (LZ.hit2 - mid)); return lerp(Gu, G, u * u); }
      // (v47_drop) the flung hand rings the chord out through the stop: it keeps rising and shakes (a guitarist's vibrato fist), not a held pose
      const ring = (tt) => { if (!DROP_V47) return F2; const r = smooth(LZ.fling, LZ.rehit, tt), fade = Math.exp(-Math.max(0, tt - LZ.fling) / 0.5);
        return F2.clone().addScaledVector(up, 0.12 * L * r).addScaledVector(fwd, -0.05 * L * r).addScaledVector(side, 0.035 * L * Math.sin(tt * 34) * (0.3 + 0.7 * fade) * smooth(LZ.fling, LZ.fling + 0.1, tt)); };
      if (t < LZ.rehit) return lerp(G, ring(t), 1 - Math.pow(1 - clamp01((t - LZ.hit2) / (LZ.fling - LZ.hit2)), 2));
      return lerp(ring(LZ.rehit), strum(), e(LZ.rehit, LZ.rehit + 0.07, t));
    };
    return { at, t0: plugSpec.t0, t1: LZ.end, fade: plugSpec.fade, pole: HANDS_V47 ? [1.25, 0.9, 0.55] : null, pose: 'grip', kind: 'pick' };   // (v47_hands) elbow in front of the body
  }
  /** (v45_laser, 'wave') the sound wave: rings out of the guitar on each stroke (billboarded), a spark running down the cable into the
   *  amp, the cable left glowing pink while the chord rings */
  function waveFx(tc, camera, cableAB, lens) {
    const X = FX45; X.root.visible = true;
    const gtr = F.ricky.F.items.guitar; gtr.updateWorldMatrix(true, false); const G = gtr.localToWorld(gtr.userData.base ? gtr.userData.strum.clone() : V(0, 0, 0));
    camera.updateMatrixWorld(true);
    const strokes = [LZ.hit, LZ.hit2, LZ.rehit];
    // each stroke sends three rings (0.03 s apart) down the cable from the guitar to the amp (0.08 s), where they burst open round the lens
    const tgtP = lens || G;
    X.rings.forEach((m, i) => { const s = Math.floor(i / 3), k = i % 3; const t0 = strokes[s] + 0.03 * k; const u = (tc - t0) / 0.3; const big = s === 0 ? 1 : 0.6;
      if (u < 0 || u >= 1 || (s === 2 && k > 0)) { m.visible = false; return; }
      const a = 0.27; const v = clamp01(u / a); const w = clamp01((u - a) / (1 - a));
      m.visible = true; m.position.copy(G).lerp(tgtP, v * v * (3 - 2 * v)); m.quaternion.copy(camera.quaternion);
      m.scale.setScalar((3 + 7 * v + 34 * big * Math.pow(w, 0.7)) * (k === 1 ? 0.8 : k === 2 ? 0.62 : 1));
      m.material.opacity = big * (u < a ? 0.9 : 0.9 * Math.pow(1 - w, 1.5)); });
    // the spark down the cable (guitar -> jack) and the lit cable behind it
    const n = X.hot.length; const sp = clamp01((tc - LZ.hit) / LZ.spark);
    const glowK = tc >= LZ.hit ? (tc < LZ.rehit ? 0.35 + 0.65 * T.pulse(tc, LZ_HITS, 0.16) : 0.25 * T.pulse(tc, LZ_HITS, 0.2)) : 0;
    X.hot.forEach((m, k) => { const u0 = k / n, u1 = (k + 1) / n; if (!cableAB || glowK < 0.02 || u0 > sp) { m.visible = false; return; }
      const P = (u) => cableAB[0].clone().lerp(cableAB[1], u).add(V(0, -10 * 4 * u * (1 - u), 0)); const p0 = P(u0), p1 = P(Math.min(u1, Math.max(sp, u0 + 1e-3))); const d = p1.clone().sub(p0);
      m.visible = true; m.position.copy(p0).add(p1).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); m.scale.set(1, d.length() + 0.3, 1); m.material.opacity = glowK; });
    if (cableAB && tc >= LZ.hit && tc < LZ.hit + LZ.spark + 0.05) { const u = clamp01((tc - LZ.hit) / LZ.spark); const p = cableAB[0].clone().lerp(cableAB[1], u).add(V(0, -40 * u * (1 - u), 0)); R.glowAt(7, p, 14, 1); }
    else if (tc >= LZ.hit && tc < FUN + 0.2 && lens) R.glowAt(7, lens, 30 * T.pulse(tc, [FUN], 0.1), 0.9);
  }   // the beam fades as the slab lies down; the receiver stays latched
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
    if (inIns(t)) {   // (v45_laser) the camera beat on Ricky (beat 212 -> 214):
      // medium from his right-back at chest height, the amp beside him, the slab + wall behind: he plugs in, winds up, slams the chord,
      // the wave rings out of the guitar, the spark runs down the cable, the beam fires away into FUNCTIONS; a slow push, a jolt on the hit
      const k = smooth(LZ.ins[0], LZ.ins[1], t); const s = TR.ricky.state(89.6); const base = V(s.x, s.y, s.z);
      const pos = V(...LZ_CAM.pos[0]).lerp(V(...LZ_CAM.pos[1]), k), tgt = V(...LZ_CAM.tgt);
      const sh = 2.4 * T.pulse(tc, [LZ.hit], 0.1) + 1.0 * T.pulse(tc, [LZ.hit2], 0.08); pos.x += Math.sin(tc * 90) * sh; pos.y += Math.cos(tc * 70) * sh;
      const chest = base.clone().add(V(0, 40, 0));
      return { pos, tgt, fov: LZ_CAM.fov, focus: chest, dof: 0.2, r5: { beam: 1, dof: 0.3, tilt: 0, focus: chest, columns: { keep: [] } } };
    }
    if (t >= T.snap(CUT_FIX) - 1e-6 && t < SHOT[1]) {   // (v4b stage_3d) A1F: FIXTURES! (still 09): low and long behind the party, the
      // carved slab slams up and fills the middle of the frame (the biggest thing on screen), the trio small at its foot on the right;
      // a slow push through the stop; the slab sharp (focus on the word), the DOF capped (common.js)
      const c = camClock(t); const k = smooth(CUT_FIX, 88.052, c);
      const pos = V(835, 30, -380).lerp(V(836, 31, DROP_V47 ? -334 : -362), DROP_V47 ? 0.35 * clamp01((c - CUT_FIX) / (88.052 - CUT_FIX)) + 0.65 * k : k), tgt = V(876, 94, 245);   // (v4b M2) lower + longer: it looms (~78 % of the height); (v47_drop) a longer push that never stops
      const sh = 2.2 * T.pulse(tc, SLASH.map((x) => x + 0.04 + RISE), 0.1); pos.x += Math.sin(tc * 90) * sh; pos.y += Math.cos(tc * 70) * sh;
      let fov = 21;
      if (DROP_V47) { tgt.y += 3 * k; pos.x += 3 * Math.sin(1.9 * c); pos.y += 1.2 * Math.sin(1.3 * c + 0.7); }   // the drift: a slow rise of the aim (up the slab), a slight lateral sway
      if (DROP_V47 === 'punch') { const p = smooth(V47.strutHit - 0.03, V47.strutHit + 0.05, c); fov -= V47.punchFov[0] * p + 1.4 * smooth(V47.strutHit, 88.052, c); pos.x += 1.6 * Math.sin(5.3 * c) * p; pos.y += 1.0 * Math.sin(4.1 * c + 1) * p; }   // snap in on the strut's slam, keep creeping, hand-held
      const word = V(887, 112, 242);
      return { pos, tgt, fov, focus: word, dof: 0.12, r5: { dof: 0.25, focus: word, tilt: 0, beam: 0 } };
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
      const c = camClock(t); const k = smooth(89.694, 91.4, c);
      const pos = V(692 + 6 * k, 46, -300 + 14 * k), tgt = LASER_V45 ? V(822, 96, 245) : V(852, 98, 245);   // (v45_laser) panned right: Ricky's whole figure + his strum in frame
      const sh = 1.2 * T.pulse(tc, [tJolt], 0.12) + 1.6 * T.pulse(tc, [CARVE.fun], 0.1); pos.x += Math.sin(tc * 80) * sh; pos.y += Math.cos(tc * 60) * sh;
      let fov = LASER_V45 ? 35 : 33;
      if (DROP_V47) { const kk = clamp01((c - 89.694) / (SHOT[3] - 89.694)); pos.add(V(5 * kk, 5 * kk, 22 * kk)); tgt.y -= 4 * kk; pos.x += 2.2 * Math.sin(1.7 * c + 0.4); pos.y += 1.0 * Math.sin(1.2 * c); }   // (v47_drop) a steady push + crane that never stops, a slight sway
      if (DROP_V47 === 'punch') { const p = smooth(V47.lampHit - 0.03, V47.lampHit + 0.05, c); fov -= V47.punchFov[1] * p + 1.2 * smooth(V47.lampHit, SHOT[3], c); pos.x += 1.4 * Math.sin(5.1 * c) * p; pos.y += 0.9 * Math.sin(3.9 * c + 1) * p; }   // snap in as the last gate lamp lights (the stop), keep creeping, hand-held
      const word = V(887, 112, 242);
      return { pos, tgt, fov, focus: word, dof: 0.12, r5: { beam: 1, dof: 0.22, tilt: 0, focus: word, columns: { keep: [] } } };
    }
    if (t < SHOT[4]) {   // A4: the close-up: the firefly on the receiver lens; the slab slams down behind it; a slow drift
      const k = smooth(SHOT[3], SHOT[4], t); const ffp = PB.bugs.firefly.visible ? PB.bugs.firefly.position.clone() : recvC();
      if (DROP_V47) {   // (v47_drop) the pull-back: a beat on the bug on the lens, then the camera backs off and cranes up over the receiver until the
        // room reads: the lit receiver with the bug, Charlie on the plate, the beam coming in from the slab's crystal, the slab swinging down into
        // the bridge (92.56-92.86) and Jade sprinting for it; it lands on that wide by the cut and keeps creeping
        const Pp = V47.pull; const P1 = Pp.p1, T1 = Pp.t1, PC = Pp.pc;
        const u = clamp01((t - SHOT[3]) / (SHOT[4] - SHOT[3])); let v = clamp01((u - Pp.hold) / (Pp.land - Pp.hold));
        const e = v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
        const p0 = V(...Pp.p0).add(V(-3, -2, -2).multiplyScalar(clamp01(u / Pp.hold))), pc = V(...PC), p1 = V(...P1);
        const pos = p0.clone().multiplyScalar((1 - e) * (1 - e)).addScaledVector(pc, 2 * (1 - e) * e).addScaledVector(p1, e * e);
        pos.addScaledVector(p1.clone().sub(pc).normalize(), 5 * clamp01((u - Pp.land) / (1 - Pp.land)));   // the creep after it lands
        const eT = Math.min(1, 1.15 * Math.pow(e, 0.8)); const tgt = V(...C.close[1]).lerp(ffp, 0.35).lerp(V(...T1), eT);
        const fov = Pp.fov[0] + (Pp.fov[1] - Pp.fov[0]) * e;
        const focus = ffp.clone().lerp(recvC().lerp(V(...T1), 0.5), e);
        return { pos, tgt, fov, focus, dof: 0.42 - 0.28 * e, r5: { dof: 0.7 - 0.5 * e, focus, beam: 0 } };
      }
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
/** (v45_laser) the sound-wave rings + the hot cable overlay (built once per world, on the r4 root) */
function buildFx45(R) {
  if (R.fx45) return R.fx45;
  const root = new THREE.Group(); root.name = 'v45_laser_fx'; R.add(root);
  const ringMat = () => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6ad8').multiplyScalar(1.25), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const rings = Array.from({ length: 9 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 64), ringMat()); m.userData.noAO = true; m.visible = false; root.add(m); return m; });
  const hm = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff7ae0').multiplyScalar(3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const hot = Array.from({ length: 14 }, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1, 6), hm.clone()); m.userData.noAO = true; m.visible = false; root.add(m); return m; });
  R.fx45 = { root, rings, hot }; return R.fx45;
}
/** restore what Room B's first person hides on the shared Jade figure (head + torso meshes) */
export function showHead(fig) { const J = fig.F.J; J.head.visible = true; for (const j of [J.body, J.chest]) if (j) for (const c of j.children) if (c.isMesh) c.visible = true; }
