// ACT III · 94.204-107.15 · VERSE 2 on mesa A (pre-battle pass).
//   94.22  "Everything I love about life just blossoms" = ROOM 1 REMIXED IN 3D: each hero repeats their room-1 solo on a
//          plaster block, in depth. Jade: the martial-arts flip vault (94.42 -> lands on "I" 94.889). Charlie: throws his cap
//          down, bounces off it over his block ("love about", 94.97 -> 95.6) and catches it back. Ricky: the short heavy hop
//          ONTO his block, stomp on "life" (95.831), lumbers across, drops off on "just" (96.613). Each touch colours its
//          block; the meadow takes colour in Jade's wake (paintlog jadeV2X).
//          BUG PLANTS (~3 s total, creatures module, small): a tiny ladybug rides Charlie's cap (and the cap-trampoline);
//          a beetle rolls past in a tight circle (95.84-97.07); 97.07-97.88 cut to the cypress Jade coloured at 82.93: a
//          firefly crawls over it and the colour flickers to the missing-texture checkerboard for 3 frames (97.45).
//   100.12 "because": the stone letters are a gate: b | e | cause, the e toppled flat in the gap as the doorstep. Ricky (who
//          fell through the graphite because in Act I) tests the e with one foot before stepping on; Charlie has the
//          hat-trampoline ready beside it, just in case. The b has a fresh ERASER BITE out of its corner (crumbs below).
//   101.0  "my imagination is linked to my everyday life": THE CO-OP CROSSING (keep): plate (Charlie), tripod (Jade), beam
//          (Ricky), hat out of the hat. Added: the moth flutters in Ricky's beam and bonks off it twice (104.396, 104.803).
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { getWorld, MESA_A, MESA_B, CHASM } from './world/build.js';
import { make3D, CUE, V, aim, persp, runFrame, smooth, clamp01, LOOK, faceCam } from './common.js';
import { jadeV2X, V2_VAULT, TREE_HITS } from './paintlog.js';
import { ensurePB, heroJoints, setJ, heroH, putHero, headTop } from './prebattle_props.js';
import { slabsAt } from './drop_v2.js';

const PZ = 348;
const WORD = (i) => T.word(26, i).start;                     // my 0 · imagination 1 · is 2 · linked 3 · to 4 · my 5 · everyday 6 · life 7
const PLATE = V(925, MESA_A.top, 320), GATE = V(982, MESA_A.top, 292), EDGE = V(990, MESA_A.top, 410);
const RICKY_SPOT = V(962, MESA_A.top, 300), RECV = V(1125, MESA_B.top, 455);
const HAT_DROP = 105.618, CROSS = [105.66, 106.43];          // bar 64.1 drop, land on the snare (bar 64.3)
// room 1 remix
const LANE = { jade: PZ, charlie: PZ + 20, ricky: PZ - 20 };
const BLK = { jade: 630, charlie: 668, ricky: 712 };          // block centres (x) on each lane
const CH = { throw: 94.97, hatDown: 95.06, on: 95.16, boing: 95.255, land: 95.6, caught: 95.8 };
const RK = { take: 95.6, stomp: 95.831, walk: 96.42, off: 96.613, land: 96.75 };
const GATE_X = 850, GZ = 348;                                 // because: the doorstep e lies in the gap at x 784
const BC = { test: [100.2, 100.62], step: 100.66, ready: 99.3 };
const GLITCH = [97.45, 97.55];                                // 3 frames at 30 fps
const MOTH_BONK = [104.396, 104.803];
const lerp = (a, b, u) => a + (b - a) * u;

export async function setup(ctx) {
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const PB = await ensurePB(W); const hs = PB.hs;
  const H = { jade: heroH(W, 'jade'), charlie: heroH(W, 'charlie'), ricky: heroH(W, 'ricky') };
  const bloomAt = (it) => CUE.v2 + 0.05 + Math.max(0, it.x - 588) / 62 + Math.abs(it.z - PZ) / 170;
  const top = MESA_A.top;
  const blockTop = (n) => top + PB.blocks[n].userData.h;
  const tree = W.avenue[TREE_HITS[1][1]];                    // the cypress Jade coloured on the 82.93 whistle note
  const treeBox = new THREE.Box3().setFromObject(tree); const treeC = treeBox.getCenter(new THREE.Vector3());
  const treeR = Math.max(4, Math.min(treeBox.max.x - treeBox.min.x, treeBox.max.z - treeBox.min.z) / 2);

  const EH = PB.letterE.userData.h, EW = PB.letterE.userData.w, ED = PB.letterE.userData.depth;   // the toppled e: length along x, width along z, thickness
  const GAP = EW / 2 + 8 * hs;                                   // half the gap between b and cause (the e lies in it)
  const LE_TOP = () => ED;
  const RX_TEST = GATE_X - EH / 2 - 14 * hs;   // Ricky's toes at the doorstep e's near edge
  // ---------------------------------------------------------------- the party in the remix (pure in t)
  function remix(t) {
    const party = {};
    // JADE: run-in, flip vault (rotation applied after placement), on to the gate
    const jx = jadeV2X(t); const V2 = V2_VAULT;
    party.jade = { x: jx, y: top, z: LANE.jade, anim: 'run', frame: runFrame(t, 2, 1.5), pencil: true, rotY: 0 };
    if (t >= V2.t0 && t < V2.t1) { const u = (t - V2.t0) / (V2.t1 - V2.t0); party.jade.y = top + (blockTop('jade') - top + 0.42 * H.jade) * Math.sin(Math.PI * u); party.jade.anim = 'jump'; party.jade.frame = 0; party.jade.flip = u; }
    if (t >= V2.t1 && t < V2.t1 + 0.12) { party.jade.anim = 'jump'; party.jade.frame = 1; }
    if (t >= 99.2) { const k = smooth(99.2, 99.8, t); Object.assign(party.jade, { x: lerp(jx, GATE_X + 100, k), z: lerp(LANE.jade, 292, k), anim: k < 1 ? 'run' : 'idle', t, rotY: k < 1 ? 0.9 * k : 3.6 }); }   // waits past the gate (-z side), turned back to watch
    // CHARLIE
    const cBase = (tt) => (tt < CH.throw ? lerp(560, 628, clamp01((tt - CUE.v2) / (CH.throw - CUE.v2))) : lerp(700, 768, clamp01((tt - 96.7) / (BC.ready - 96.7))));
    const hatX = BLK.charlie - 26 * hs;
    let c = { x: cBase(t), y: top, z: LANE.charlie, anim: t >= CH.caught && t < 96.7 ? 'idle' : 'run', frame: t >= CH.caught && t < 96.7 ? null : runFrame(t, 6, 1.5), t, rotY: t >= CH.caught && t < 96.7 ? -0.5 : 0 };
    let cap = null;                                             // the cap as a ground prop (position) or null (on his head)
    if (t >= CH.throw && t < CH.caught) {
      if (t < CH.hatDown) { c = { ...c, x: 628, anim: 'throw', t: t - CH.throw, frame: null, hat: false }; const u = (t - CH.throw) / (CH.hatDown - CH.throw); cap = V(lerp(632, hatX, u), top + lerp(0.6 * H.charlie, 0, u) + 8 * Math.sin(Math.PI * u), LANE.charlie); }
      else if (t < CH.boing) { const u = clamp01((t - CH.hatDown) / (CH.on - CH.hatDown)); c = { ...c, x: lerp(628, hatX, u), y: top + 3 + 10 * Math.sin(Math.PI * u) * (u < 1 ? 1 : 0), anim: u < 1 ? 'jump' : 'trampoline', t: t - CH.on, frame: u < 1 ? 0 : null, hat: false }; cap = V(hatX, top, LANE.charlie); }
      else if (t < CH.land) { const u = (t - CH.boing) / (CH.land - CH.boing); c = { ...c, x: lerp(hatX, 700, u), y: top + 3 + (blockTop('charlie') - top + 0.36 * H.charlie) * Math.sin(Math.PI * u) - 3 * u, anim: 'jump', frame: u < 0.5 ? 0 : 1, hat: false };
        cap = V(hatX, top, LANE.charlie); }
      else { const u = (t - CH.land) / (CH.caught - CH.land); c = { ...c, x: 700, anim: 'idle', t, hat: false }; cap = V(lerp(hatX, 700, u), top + lerp(0, H.charlie * 0.8, u) + 30 * hs * Math.sin(Math.PI * u), LANE.charlie); }
    }
    // because: the cap goes down as a trampoline beside the doorstep e, Charlie crouched ready
    if (t >= BC.ready) {
      // steps over to the b side of the gap and puts the cap down as a trampoline at the e's near corner, crouched, facing Ricky
      const u = clamp01((t - BC.ready) / 0.6), w = clamp01((t - BC.ready - 0.6) / 0.25);
      const p = V(lerp(768, GATE_X - EH / 2 - 6 * hs, smooth(0, 1, u)), 0, lerp(LANE.charlie, GZ - EW / 2 - 36 * hs, smooth(0, 1, u)));
      c = { x: p.x, y: top, z: p.z, anim: u < 1 ? 'run' : 'shield', t: t - BC.ready, frame: u < 1 ? runFrame(t, 6, 2) : 0, hat: u < 1 ? undefined : false, rotY: u < 1 ? 2.2 : 2.2 + (-2.4 - 2.2 + 2 * Math.PI) * w };
      c.capInHand = u >= 1;   // the shield pose holds the cap out in front: the trampoline, ready
    }
    party.charlie = c;
    // RICKY
    const rx0 = lerp(530, 668, clamp01((t - CUE.v2) / (RK.take - CUE.v2)));
    let r = { x: rx0, y: top, z: LANE.ricky, anim: 'run', frame: runFrame(t + 0.2, 6, 1.2), rotY: 0 };
    const bt = blockTop('ricky'), bw = PB.blocks.ricky.userData.w;
    if (t >= RK.take && t < RK.stomp) { const u = (t - RK.take) / (RK.stomp - RK.take); r = { ...r, x: lerp(668, BLK.ricky - bw / 2 + 6, u), y: lerp(top, bt, u) + (4 * hs + 0.25 * (bt - top)) * Math.sin(Math.PI * u), anim: 'jump', frame: u < 0.6 ? 0 : 1 }; }
    else if (t >= RK.stomp && t < RK.walk) { const u = (t - RK.stomp) / (RK.walk - RK.stomp); r = { ...r, x: lerp(BLK.ricky - bw / 2 + 6, BLK.ricky + bw / 2 - 6, u), y: bt, anim: u < 0.25 ? 'idle' : 'run', frame: runFrame(t, 6, 2) }; }
    else if (t >= RK.walk && t < RK.land) { const u = (t - RK.walk) / (RK.land - RK.walk); r = { ...r, x: lerp(BLK.ricky + bw / 2 - 6, 744, u), y: lerp(bt, top, u * u) + 3 * hs * Math.sin(Math.PI * u), anim: 'jump', frame: 1 }; }
    else if (t >= RK.land) {
      const k = clamp01((t - RK.land) / (BC.test[0] - 0.1 - RK.land));
      r = { ...r, x: lerp(744, RX_TEST, smooth(0, 1, k)), z: lerp(LANE.ricky, GZ, smooth(0.2, 1, k)), anim: k < 1 ? 'run' : 'idle', frame: runFrame(t, 6, 1.2), t };
      if (t >= BC.step) { const u = clamp01((t - BC.step) / (101.0 - BC.step)); r = { ...r, x: lerp(RX_TEST, GATE_X + 18, u), y: top + ED * Math.min(1, u * 3), anim: 'run', frame: runFrame(t, 6, 2) }; }
    }
    party.ricky = r;
    return { party, cap };
  }

  const scene = await make3D(ctx, W, {
    inWorldSubs: [25],
    frame(t) {
      PB.begin();
      slabsAt(PB, W, t);                                       // the drop's slab bridge stays (coloured) behind mesa A
      // ---- flowers + the path of colour
      P.flowers.visible = true;
      P.flowers.update((it) => clamp01((t - bloomAt(it)) / 0.45), t);
      // ---- because: b (bitten) | e (toppled flat) | cause   (replaces the props' be|cause pair)
      for (const o of [PB.letterB, PB.letterE, PB.letterCause, PB.crumbs]) o.visible = true;
      const LB = PB.letterB, LE = PB.letterE, LC = PB.letterCause;
      LB.position.set(GATE_X, top, GZ - GAP - LB.userData.w / 2); LB.rotation.set(0, -Math.PI / 2, 0);
      LC.position.set(GATE_X, top, GZ + GAP + LC.userData.w / 2); LC.rotation.set(0, -Math.PI / 2, 0);
      // e lying flat, face up, its top toward +x (readable from the approach)
      LE.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, 1), V(1, 0, 0), V(0, 1, 0)));
      LE.position.set(GATE_X - EH / 2, top + ED / 2, GZ);
      const bite = LB.userData.bite; PB.crumbs.position.set(GATE_X - ED / 2 - 16 * hs, top, LB.position.z + bite.x);

      // ---- party
      let party = {}; let cap = null;
      if (t < 101.0) {
        ({ party, cap } = remix(t));
      } else {
        // co-op crossing (keep)
        const tPlate = WORD(0);
        const onPlate = t >= tPlate + 0.15;
        const crossU = (d) => clamp01((t - CROSS[0] - d) / (CROSS[1] - CROSS[0]));
        if (t < HAT_DROP + 0.05) party.charlie = { x: PLATE.x, y: top + (onPlate ? 1.5 : 3), z: PLATE.z, anim: t >= WORD(7) ? 'pull' : 'idle', t: t >= WORD(7) ? t - WORD(7) : t };
        const jA = V(898, top, 298), jB = V(GATE.x - 16, top, GATE.z + 8), jC = V(EDGE.x - 16, top, EDGE.z);
        let jp;
        if (t < WORD(2)) jp = jA.clone().lerp(jB, smooth(101.0, WORD(2), t));
        else if (t < WORD(3)) jp = jB.clone().lerp(jC, smooth(WORD(2), WORD(3), t));
        else jp = jC.clone();
        party.jade = { x: jp.x, y: top, z: jp.z, anim: (t > WORD(2) && t < WORD(3)) || t < WORD(1) ? 'run' : 'idle', frame: runFrame(t, 2, 2), t, pencil: true };
        const rp = V(880, top, 262).lerp(RICKY_SPOT, smooth(101.0, 102.6, t));
        party.ricky = { x: rp.x, y: top, z: rp.z, anim: t >= WORD(6) - 0.1 ? 'sustain' : 'idle', t };
        if (t >= CROSS[0]) {
          const runs = { jade: [jC, 0], ricky: [RICKY_SPOT.clone(), 0.06], charlie: [PLATE.clone(), 0.0] };
          for (const [n, [from, d]] of Object.entries(runs)) {
            const u = crossU(d); const to = V(CHASM.x1 + 30 + (n === 'jade' ? 0 : n === 'ricky' ? 26 : -26), MESA_B.top, 412 + (n === 'jade' ? 0 : n === 'ricky' ? 8 : -8));
            const p = from.clone().lerp(to, u);
            party[n] = { x: p.x, y: top + 14 * Math.sin(Math.PI * Math.max(0, (u - 0.75) / 0.25)) * (u > 0.75 ? 1 : 0), z: p.z, anim: u < 1 ? 'run' : 'idle', frame: n === 'jade' ? runFrame(t, 2, 2) : runFrame(t, 6, 3), t: t - CROSS[1], pencil: n === 'jade' };
            if (u >= 1 && t < CROSS[1] + 0.3) { party[n].anim = 'jump'; party[n].frame = 1; }
          }
        }
        P.plate.visible = P.gate.visible = P.tripod.visible = P.receiver.visible = P.yiBridge.visible = true;
        P.plate.userData.plate.position.y = onPlate ? 0.4 : 1.5;
        P.plate.userData.edgeMat.color.set(onPlate ? '#fff6dc' : '#6a6258').multiplyScalar(onPlate ? 3 : 1);
        const open = smooth(tPlate + 0.3, WORD(1) + 0.6, t);
        P.gate.userData.doorL.position.x = -8 - 15 * open; P.gate.userData.doorR.position.x = 8 + 15 * open;
        if (t >= HAT_DROP) { P.hatStack.visible = true; W.put(P.hatStack, { x: PLATE.x, y: top + 0.4 + 30 * (1 - smooth(HAT_DROP - 0.15, HAT_DROP, t)), z: PLATE.z, anim: 'rest', frame: 0 }); }
      }
      for (const [n, s] of Object.entries(party)) putHero(W, W.heroes[n], { ...s, pencil: n === 'jade' });
      if (!party.charlie) W.heroes.charlie.visible = false;

      // ---- room 1 remix: poses that need joints / whole-body rotation
      if (t < 101.0) {
        const g = W.heroes.jade; const fl = party.jade.flip;
        if (fl !== undefined) {   // the martial-arts flip: one full forward somersault around her hips, tucked
          const a = -2 * Math.PI * smooth(0.08, 0.92, fl); const piv = 0.45 * H.jade;
          g.rotation.z = a; g.position.x += piv * Math.sin(a); g.position.y += piv - piv * Math.cos(a);
          const J = heroJoints(g); setJ(J, 'hipR', 95); setJ(J, 'hipL', 85); setJ(J, 'kneeR', -120); setJ(J, 'kneeL', -115); setJ(J, 'shoulderR', 60, 0, -10); setJ(J, 'shoulderL', 60, 0, 10); setJ(J, 'elbowR', 70); setJ(J, 'elbowL', 70);
        }
        // Ricky's foot test on the doorstep e (two taps), arms out for balance
        if (t >= BC.test[0] && t < BC.step) {
          const J = heroJoints(W.heroes.ricky); const u = (t - BC.test[0]) / (BC.test[1] - BC.test[0]);
          const tap = Math.abs(Math.sin(Math.PI * 2 * clamp01(u) * 1.0));
          setJ(J, 'hipR', 38 + 10 * tap); setJ(J, 'kneeR', -14 - 18 * tap); setJ(J, 'body', -10); setJ(J, 'hipL', -8); setJ(J, 'kneeL', -12);
          setJ(J, 'shoulderL', 70, 0, 30); setJ(J, 'elbowL', 10);
        }
      }

      // ---- remix props: blocks (each touch colours its block), the cap prop, the ladybug
      if (t < 101.0) {
        for (const n of ['jade', 'charlie', 'ricky']) { const b = PB.blocks[n]; b.visible = true; b.position.set(BLK[n], top, LANE[n]); b.rotation.y = n === 'ricky' ? 0.08 : n === 'charlie' ? -0.06 : 0.04; }
        const lpJ = PB.blocks.jade.userData.mat.userData.lp, lpC = PB.blocks.charlie.userData.mat.userData.lp, lpR = PB.blocks.ricky.userData.mat.userData.lp;
        const tJ = V2_VAULT.t0 + 0.5 * (V2_VAULT.t1 - V2_VAULT.t0);   // Jade's hand plant at the top of the flip
        if (t >= tJ) lpJ.all(0.62 * smooth(0, 1, (t - tJ) / 0.45));
        const tC = CH.boing + 0.5 * (CH.land - CH.boing);
        if (t >= tC) lpC.all(0.62 * smooth(0, 1, (t - tC) / 0.45));
        if (t >= RK.stomp) lpR.all(0.62 * smooth(0, 1, (t - RK.stomp) / 0.4));
        // the cap prop (thrown / trampoline / flying back / the because trampoline)
        const ch = W.heroes.charlie;
        if (cap) { PB.cap.visible = true; PB.cap.position.copy(cap); PB.cap.scale.setScalar(1.15 * hs * (t >= BC.ready ? 1.6 : 1.3)); PB.cap.rotation.set(0, t >= BC.ready ? 0.3 : -0.4, 0);
          const sq = T.pulse(t, [CH.on, CH.boing], 0.12); PB.cap.scale.y *= 1 - 0.45 * sq; }
        // the ladybug rides the cap: on his head, or on the cap prop
        const lb = PB.bugs.ladybug; lb.visible = ch.visible && t < 101.0;
        if (lb.visible) {
          const p = cap ? cap.clone().add(V(0, 5.5 * hs * (1 - 0.45 * T.pulse(t, [CH.on, CH.boing], 0.12)), 0)) : party.charlie.capInHand ? ch.hand('R', V(0, 0, 0)).add(V(0, 7 * hs, 0)) : headTop(ch, V(0, 0, 0)).add(V(0, -0.6 * hs, 0));
          lb.position.copy(p); lb.rotation.set(0, 0.4 + 0.3 * Math.sin(t * 1.7), 0); lb.set({ anim: 'idle', t, stance: 'crawl' });
          if (cap && t >= CH.on && t < CH.land) lb.position.y += 4 * hs * Math.abs(Math.sin((t - CH.on) * 18));   // it bounces too
        }
        // the beetle: rolls past in a tight circle (the infinite loop), in the foreground of the stomp shot
        if (t >= 95.84 && t < 97.07) { const bb = PB.bugs.beetle; bb.visible = true; bb.position.set(690 + 24 * (t - 95.84), top, 412); bb.rotation.set(0, 0, 0); bb.set({ anim: 'bug', t, beat: T.beatAt(t) * 1.5, ringR: 26, stance: 'crawl' }); }
        // the firefly crawls over the cypress Jade coloured at 82.93; its colour glitches to the checkerboard for 3 frames
        if (t >= 97.07 && t < 97.88) {
          const ff = PB.bugs.firefly; ff.visible = true; const u = (t - 97.07) / 0.81;
          const y = lerp(treeBox.min.y + 0.35 * (treeBox.max.y - treeBox.min.y), treeBox.min.y + 0.55 * (treeBox.max.y - treeBox.min.y), u);
          const rr = treeR * (1 - 0.35 * ((y - treeBox.min.y) / (treeBox.max.y - treeBox.min.y))) + 1.5;
          const ang = 0.9 + 0.6 * u;                              // round the trunk toward the camera side (+z)
          ff.position.set(treeC.x + rr * Math.cos(ang) * 0.6, y, treeC.z + rr * Math.sin(ang));
          ff.rotation.set(0, -ang + Math.PI / 2, 0.9); const g = t >= GLITCH[0] && t < GLITCH[1];
          ff.set({ anim: 'bug', t, glow: g ? 1 : t > 97.7 ? 0.9 : 0.1 });
          if (g) PB.glitchOn(tree, ff.position, 16 * hs);
        }
      }

      // ---- co-op: tripod in Jade's hand, beam from Ricky's guitar (posed hands)
      if (t >= 101.0) {
        let tp;
        if (t < WORD(2)) tp = GATE.clone().add(V(-2, 0, 0));
        else if (t < WORD(3)) { const h = W.heroes.jade.hand('R', V(0, 0, 0)); tp = V(h.x + 4, top + Math.max(2, h.y - top - 30 * hs), h.z + 3); }
        else tp = EDGE.clone();
        P.tripod.position.copy(tp); P.tripod.rotation.y = t < WORD(3) ? 0.3 : 0;
        P.tripod.position.y -= 3 * T.pulse(t, [WORD(3)], 0.15);
        const tb = WORD(6);
        const gtr = W.heroes.ricky.visible ? W.heroes.ricky.hand('R', V(0, 0, 0)) : V(RICKY_SPOT.x + 14, top + 22, RICKY_SPOT.z);
        const cry = EDGE.clone().add(V(0, 29 * 1.4, 0)), rcv = RECV.clone().add(V(0, P.receiver.userData.cy, 0));
        if (t >= tb - 0.05) {
          const u = clamp01((t - tb) / 0.6); const atRicky = t < CROSS[0] + 0.1;
          if (atRicky) { P.beam2.visible = true; P.beam2.set([gtr, cry, rcv], u, { width: 1.1 + 0.25 * Math.sin(t * 30), colors: ['#ff5fd2', '#8a6bff'] }); }
          P.crystalMat.emissiveIntensity = 3 * smooth(tb + 0.1, tb + 0.3, t);
          P.recvMat.emissiveIntensity = 3 * smooth(tb + 0.45, tb + 0.6, t);
        }
        P.yiBridge.hz.setProgress(0, smooth(tb + 0.45, WORD(7) - 0.05, t));
        P.yiBridge.hz.setColour(clamp01((t - CROSS[0]) / (CROSS[1] - CROSS[0])) * 1.05);
        // the moth: drawn to the light, flutters along the beam, bonks off it twice
        if (t >= tb + 0.15 && t < CROSS[0] + 0.1) {
          const m = PB.bugs.moth; m.visible = true;
          const k = 0.42 + 0.06 * Math.sin((t - tb) * 1.3); const onBeam = cry.clone().lerp(rcv, k);
          let off = V(0, 9 * hs + 3 * Math.sin(t * 7), 7 * hs + 4 * Math.sin(t * 4.3)); let spin = 0;
          for (const tbk of MOTH_BONK) {
            const s = t - tbk;
            if (s > -0.18 && s < 0) { const u = (s + 0.18) / 0.18; off.multiplyScalar(1 - 0.85 * u * u); }      // the dive in
            else if (s >= 0 && s < 0.45) { const u = s / 0.45; off = V(0, 9 * hs, 7 * hs).multiplyScalar(0.15 + 1.1 * Math.sin(Math.PI * Math.min(1, u * 1.4)) + 0.2 * u); off.y -= 6 * hs * Math.sin(Math.PI * u); spin = 7 * (1 - u) * Math.sin(u * 20); }
          }
          m.position.copy(onBeam).add(off); m.position.y -= 5 * hs;
          m.rotation.set(spin * 0.3, -2.2 + 0.4 * Math.sin(t * 2), spin * 0.2); m.set({ anim: 'dance', t, beat: T.beatAt(t) * 2 });
        }
      }
      P.burst.visible = true;
      P.burst.run(t, [{ t0: WORD(3), x: EDGE.x, y: MESA_A.top, z: EDGE.z, n: 14, speed: 40, up: 20, g: 150, dur: 0.6, seed: 5, size: 1.2 },
        { t0: HAT_DROP, x: PLATE.x, y: MESA_A.top + 1, z: PLATE.z, n: 12, speed: 40, up: 20, g: 150, dur: 0.5, seed: 6, size: 1.2 },
        { t0: V2_VAULT.t1, x: jadeV2X(V2_VAULT.t1), y: top, z: LANE.jade, n: 10, speed: 40, up: 18, g: 150, dur: 0.5, seed: 11, size: 1.3 },
        { t0: RK.stomp, x: BLK.ricky - 10, y: blockTop('ricky'), z: LANE.ricky, n: 22, speed: 70, up: 25, g: 180, dur: 0.6, seed: 12, size: 1.8 },
        { t0: RK.land, x: 744, y: top, z: LANE.ricky, n: 16, speed: 55, up: 20, g: 180, dur: 0.6, seed: 13, size: 1.6 },
        { t0: CH.land, x: 700, y: top, z: LANE.charlie, n: 10, speed: 40, up: 18, g: 150, dur: 0.5, seed: 14, size: 1.3 }]);
      P.sparks.visible = true;
      P.sparks.run(t, [
        ...MOTH_BONK.map((te, i) => { const m = PB.bugs.moth.position; return { t0: te, x: m.x, y: m.y + 3, z: m.z, n: 14, speed: 35, up: 20, g: 60, dur: 0.4, seed: 600 + i, colors: ['#ff5fd2', '#ffffff', '#8a6bff'] }; }),
        { t0: CH.boing, x: BLK.charlie - 26 * hs, y: top + 4, z: LANE.charlie, n: 10, speed: 30, up: 25, g: 80, dur: 0.4, seed: 610, colors: ['#ffb02e', '#ffffff'] },
      ]);
      P.petals.visible = true;
      P.petals.run(t, [0, 1, 2, 3, 4, 5].map((k) => ({ t0: 94.22 + k * 0.8, x: jadeV2X(94.22 + k * 0.8) + 10, y: MESA_A.top + 4, z: PZ, n: 10, speed: 30, up: 30, g: 30, dur: 1.4, seed: 30 + k, size: 0.8, colors: ['#ff4d6d', '#ffe14d', '#e858d0', '#ffb02e'] })));

      // ---- cameras (framed for native heroes ~69 tall: hs = H / 52)
      let pos, tgt, fov = 45, focus; let faceK = 0.45;
      const jp = W.heroes.jade.position; const jx = jadeV2X(t);
      if (t < 95.84) {          // C1: low side tracking: Jade's flip vault, Charlie's hat bounce
        const k = smooth(CUE.v2, 95.84, t); const cx = lerp(600, 660, k);
        pos = V(cx - 20, top + 36 * hs, PZ + 140 * hs); tgt = V(cx + 20, top + 36 * hs, PZ - 6); fov = 54; focus = V(cx, top + 30, PZ + 10); faceK = 0;
      } else if (t < 97.07) {   // C2: 3/4 front: Ricky's heavy hop + stomp, Charlie with the ladybug, the beetle rolling past
        const k = smooth(95.84, 97.07, t);
        pos = V(662 + 8 * k, top + 92 * hs, 478 + 4 * k); tgt = V(698 + 6 * k, top + 24 * hs, 336); fov = 46; focus = V(725, top + 20, 362); faceK = 0;
      } else if (t < 97.88) {   // C3: cutaway: the cypress Jade coloured at 82.93, a firefly on it (the glitch)
        const k = smooth(97.07, 97.88, t); const fy = PB.bugs.firefly.position.y || treeC.y;
        pos = V(treeC.x + 50 - 8 * k, fy + 14, treeC.z + 120 - 10 * k); tgt = V(treeC.x, fy + 4, treeC.z); fov = 36; focus = V(treeC.x, fy, treeC.z + treeR); faceK = 0;
      } else if (t < CUE.because) { // C4: crane up: the path of colour through the white field, the slab bridge behind
        const k = smooth(97.88, CUE.because, t);
        pos = V(560 - 20 * k, top + 70 + 50 * k, 470 + 30 * k); tgt = V(jx + 20, top + 14, PZ - 10); fov = 50; focus = jp.clone();
      } else if (t < 101.0) {   // C5: because: the doorstep e, Ricky's foot test, Charlie's trampoline, the bitten b
        const k = smooth(CUE.because, 101.0, t);
        const ka = smooth(CUE.because, 100.75, t); pos = V(GATE_X - 236 + 50 * ka, top + (118 - 34 * ka) * hs, 430 + 140 * ka); tgt = V(GATE_X - 2 - 22 * ka, top + (58 - 26 * ka) * hs, 392 - 52 * ka); fov = 42 - 2 * ka; focus = V(GATE_X - 14, top + 20, PZ); faceK = 0;
      } else if (t < WORD(2)) { // Charlie on the plate, the gate grinding open behind
        const k = smooth(101.0, WORD(2), t);
        pos = V(902 - 8 * k, top + 46 * hs, 432 + 8 * k); tgt = V(950, top + 24 * hs, 305); fov = 48; focus = PLATE.clone();
      } else if (t < WORD(6)) { // follow Jade 3/4 front: grab, carry, plant on "linked" (N-MOD2: framed for the native head)
        const k = smooth(WORD(2), WORD(6), t); const j = W.heroes.jade.position;
        pos = V(j.x + 30 - 10 * k, top + 0.95 * H.jade, j.z + 132 * hs); tgt = V(j.x - 4, top + 0.55 * H.jade, j.z); fov = 44; focus = j.clone();
      } else if (t < WORD(7)) { // k08b: behind the party at the edge, beam across the chasm, the stroke bridge drawing, the moth
        const k = smooth(WORD(6), WORD(7), t);
        pos = V(872 - 15 * k, top + 70 + 6 * k, 552 + 6 * k); tgt = V(1075, top + 14, 415); fov = 48; focus = EDGE.clone();
      } else {                  // side-on wide: hat drop + the crossing + high five
        const k = smooth(WORD(7), 107.15, t);
        pos = V(1035 + 20 * k, top + 70 - 10 * k, 620 - 20 * k); tgt = V(1035 + 20 * k, top + 6, 400); fov = 50; focus = V(1045, 10, 410);
      }
      const camera = aim(persp('v2', aspect), pos, tgt, fov);
      if (faceK > 0) faceCam(Object.values(W.heroes), pos, faceK);
      return { camera, target: tgt, focus, look: LOOK({ rays: 0.3, dofAmount: 0.2 }), shadowExtent: 450 };
    },
  });
  return scene;
}
