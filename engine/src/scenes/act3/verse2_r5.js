// ACT III · 94.204-107.15 · VERSE 2, ROUND 5 (talos_r5, docs/game_design_half2_r5.md): ROOM 2 (the climb) + ROOM B (the co-op
// crossing) with the r5 additions. Behind --r5 (R5() in common.js, dispatched from verse2.js); the round-4 staging (verse2.js
// setupR4) and the approved v2 (verse2_v2.js) stay untouched and are the default. Layouts: talos_plan.js R2 / R2_5 / RB5.
//
// ROOM 2 (keep the room-1 remix, plus one bug): the lift that carries Ricky STUTTERS because the beetle is rolling in circles
//   inside its gear housing (an open cage beside the lift: checkerboard flicker on it, glitch rings); his hop is heavy because the
//   lift stalled; Jade pokes the housing with the graphite pencil (96.2) and the beetle rolls out and away, still circling; the lift
//   rises free. The ladybug rides Charlie's cap the whole room; 100.735-101.0 one close-up beat on it as he ducks through the
//   because gate (the viewer sees it, the party doesn't).
// ROOM B (keep the k08b layout and logic; add the reveal hold and the acting): 101.0-102.768 one wide from the party's side at
//   chest height holding a bar: the sea stack, the socket, the field curtain, receiver 2, the plate. Charlie points at the plate and
//   walks to it (101.955: the curtain opens); Jade nods (101.42) and picks up the tripod; Ricky plugs in (101.28) and plays (101.36:
//   the beam splashes on the stack). FIRST PERSON 102.768-104.803: the carry, the crosshair snaps onto the socket (103.5-103.62),
//   the plant on beat 248 (103.988): the beam relays to receiver 2, the stroke bridge draws. 104.803 the k08b frame: the moth bonks
//   the beam twice (104.9 / 105.3: the bridge stutters twice); "life" 105.2: a spare hat out of his hat onto the plate (105.52),
//   he tips the one on his head (105.68); all three cross on the bridge from 105.75. Every beat has an eye-line to its subject.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { getWorld } from './world/build.js';
import { make3D, CUE, V, aim, persp, smooth, clamp01, LOOK, csTagObject } from './common.js';
import { ensurePB, ensureR4, ensureR5, springCam, Tripod, Field, r4Stone, dumpInit, talosDump } from './prebattle_props.js';
import { RB5, roomBTracksR5, plateHeld5, R2, R2_5, room2TracksR5, liftY, groundR2, PLAN } from './talos_plan.js';
import { TREE_HITS } from './paintlog.js';
import { capGeo } from '../../core/voxfig.js';
import { press, hold, carry, onJoint, place } from '../../core/motion/index.js';

const RB = RB5;
const FRONT_B = 101.955;   // (v4b stage_3d) the front-on 'my imagination' shot runs 101.0 -> this beat, then B1
const SHOT_B = [101.0, 102.768, 103.581, 104.803, 107.2];          // B1 the reveal hold (a bar) | B2 the acting (the point, the nod, the pickup) | first person (the carry, the plant 104.7) | the k08b frame + the crossing
const FP_YAW = 24 * Math.PI / 180;
const FP_PITCH = -34 * Math.PI / 180;                             // the viewmodel: the tripod ahead-right in the lower third, the crosshair at centre on the socket
const PLANT_ROT = 1.0;
const SUN_AZ_B = 0;                                               // r5: the key is set per shot through look_r5 (keyAz / keyElev); the r4 turn of 42 backlit the whole room into silhouette
const KEY_B = { keyAz: 34, keyElev: 18 };                       // a 3/4 back-side key from the right-rear of the north-looking cameras, above the hills' shadow (black below ~12 from +x)                        // a 3/4 side key from the right of the north-looking cameras (long shadows across the frame), above the hills' shadow

export async function setup(ctx) {
  PLAN.r5 = true;
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const PB = await ensurePB(W); const R = await ensureR4(W, ctx); const Q = ensureR5(R); const F = R.figs;
  const B = buildRoomB(R, PB, W);
  if (P.yiBridge) csTagObject(P.yiBridge);   // (v4b H10) the stroke bridge she draws keeps its colour under the colour script
  await dumpInit();
  const roomB = makeRoomB(ctx, W, R, PB, B);
  const room2 = makeRoom2(ctx, W, R, PB, Q, buildRoom2(R, PB, W, Q));
  const scene = await make3D(ctx, W, {
    inWorldSubs: [25],
    frame(t) {
      PB.begin(); R.begin();
      const out = t >= 101.0 ? roomB(t) : room2(t); scene._fp = !!out.fp;
      return out;
    },
  });
  const k8g = W.scene.getObjectByName('k08b_ground'); const sunbeam = k8g?.children.find((c) => c.isMesh && c.renderOrder === 5 && c.material?.isShaderMaterial);
  const yiZ0 = P.yiBridge ? P.yiBridge.position.z : 0, yiY0 = P.yiBridge ? P.yiBridge.position.y : 0, yiR0 = P.yiBridge ? P.yiBridge.rotation.z : 0;
  const base = scene.update; let fpNow = false; scene.update = (t) => { base(t); fpNow = !!scene._fp; const D = W.compose?.dressing; if (D?.s101) D.s101.visible = false; if (fpNow && sunbeam) sunbeam.visible = false; };
  const rend = scene.render; scene.render = (t, target) => { const lk = ctx.post?.look; let sv = null;
    if (fpNow && lk) { sv = [lk.P.bloom, lk.mat.uniforms.uStreak.value]; lk.P.bloom = 0.12; lk.mat.uniforms.uStreak.value = 0.0; }
    rend(t, target); if (sv) { lk.P.bloom = sv[0]; lk.mat.uniforms.uStreak.value = sv[1]; } if (P.yiBridge) { P.yiBridge.position.z = yiZ0; P.yiBridge.position.y = yiY0; P.yiBridge.rotation.z = yiR0; P.yiBridge.scale.z = 1; } };
  return scene;
}

/** point an arm at a world target (after apply): the shoulder's rest direction is down the arm (-y of the shoulder frame) */
const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _v = new THREE.Vector3();
function pointArm(fig, sd, target, w, heading = 0) {
  if (w <= 0) return; const J = fig.F.J; const D = Math.PI / 180;
  // voxfig's shoulder convention (slashPose): z = the swing in the figure's forward plane (172 = arms up, ~90 = level ahead); y = out / in
  const org = J['shoulder' + sd].getWorldPosition(V(0, 0, 0)); const dx = target.x - org.x, dz = target.z - org.z;
  const yaw = Math.atan2(dz, dx) - heading; const yawD = Math.max(-50, Math.min(50, yaw / D));   // turn of the arm toward the target (the body keeps its heading)
  const pitch = Math.atan2(target.y - org.y, Math.hypot(dx, dz)) / D;
  const sh = J['shoulder' + sd]; _q.copy(sh.quaternion); sh.rotation.set(0, (sd === 'R' ? -1 : 1) * yawD * D, (88 + pitch) * D); sh.quaternion.slerp(_q, 1 - w);
  const el = J['elbow' + sd]; if (el) { _q.copy(el.quaternion); el.rotation.set(0, 0, 0); el.quaternion.slerp(_q, 1 - w); }
  if (fig.F.setHand) fig.F.setHand(sd, w > 0.5 ? 'point' : 'fist');
}

// ================================================================================================================ ROOM B
function buildRoomB(R, PB, W) {
  if (R.roomB5) return R.roomB5;
  const X = {}; const top = RB.TOP; const stone = R.stone;
  X.amp = R.makeAmp(); X.amp.position.set(RB.AMP[0], top, RB.AMP[1]); X.amp.rotation.y = -Math.atan2(RB.RECV[1] - RB.AMP[1], RB.RECV[0] - RB.AMP[0]);
  { const S = RB.STACK, g = new THREE.Group(); g.position.set(S.c[0], 0, S.c[1]);
    g.add(R.box(S.w, S.h + 214, S.d, R.rock, 0, (S.h - 214) / 2, 0)); g.add(R.box(S.w + 16, 80, S.d + 14, R.rock, 0, -170, 0));
    for (const [x, z, w, h] of [[-5, -4, 12, 10], [6, 3, 9, 16], [-2, 6, 7, 6]]) g.add(R.box(w, h, w, stone, x, S.h + h / 2, z));
    X.stack = R.add(g); }
  { const g = new THREE.Group(); g.position.set(RB.PLATE[0], top, RB.PLATE[1]);
    const edgeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd27a'), toneMapped: false });
    g.add(R.box(34, 1.2, 34, stone, 0, 0.6, 0)); const slab = R.box(26, 3, 26, R.stone, 0, 1.5, 0); g.add(slab);
    for (const [x, z, w, d] of [[0, 15.5, 31, 1.2], [0, -15.5, 31, 1.2], [15.5, 0, 1.2, 31], [-15.5, 0, 1.2, 31]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, d), edgeMat); e.position.set(x, 1.3, z); g.add(e); }
    g.userData = { slab, edgeMat }; X.plate = R.add(g); }
  X.tripod = R.add(new Tripod({ H: 40, r: 12 }));
  { const g = new THREE.Group(); g.position.set(RB.SOCKET[0], top + 0.3, RB.SOCKET[1]);
    const ring = new THREE.Mesh(new THREE.RingGeometry(13, 15.5, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9ae6').multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; g.add(ring); g.add(R.box(30, 0.6, 30, R.graphite('#77777f'), 0, 0, 0)); g.userData = { ring }; X.socket = R.add(g); }
  X.recv = R.makeReceiver({ h: 30 }); X.recv.position.set(RB.RECV[0], top, RB.RECV[1]);
  { const C = RB.CURTAIN, g = new THREE.Group(); g.position.set(C.x, top, C.z); g.rotation.y = Math.atan2(RB.RECV[0] - RB.SOCKET[0], RB.RECV[1] - RB.SOCKET[1]);
    g.add(R.box(7, C.h + 6, 7, stone, -C.w / 2 - 3.5, (C.h + 6) / 2, 0)); g.add(R.box(7, C.h + 6, 7, stone, C.w / 2 + 3.5, (C.h + 6) / 2, 0)); g.add(R.box(C.w + 16, 6, 9, stone, 0, C.h + 6, 0));
    const f = new Field(C.w, C.h); g.add(f); X.curtain = f; X.curtainG = R.add(g); }
  { const m = PB.cap.material; X.cap2 = R.add(new THREE.Mesh(capGeo(0.52), m)); X.cap2.castShadow = true; }
  R.roomB5 = X; return X;
}

function makeRoomB(ctx, W, R, PB, X) {
  const Q = R.r5;
  const P = W.props; const F = R.figs; const aspect = ctx.width / ctx.height; const top = RB.TOP; const TB = RB.T;
  const yiY0 = P.yiBridge.userData.y0 ??= P.yiBridge.position.y;
  const { jade, charlie, ricky, screen } = roomBTracksR5(R, { jade: F.jade.unit, charlie: F.charlie.unit, ricky: F.ricky.unit });
  for (const tr of [jade, charlie, ricky]) for (const w of tr.warnings || []) console.log('[engine] [talos_r5] room B motion warning: ' + w);
  const kk = screen.filter((q) => q[0] >= SHOT_B[3] && q[0] < 105.62); if (kk.length) console.log(`[engine] [talos_r5] room B: k08b-frame overlaps ${JSON.stringify(kk)}`);
  const TR = { jade, charlie, ricky };
  const seg = (tr, kind, k = 0) => tr.segs.filter((s) => s.kind === kind)[k];
  const tPick = seg(jade, 'clip', 1).t0 + 0.22, tPlant = TB.plant;
  console.log('[engine] [talos_r5] room B jade segs: ' + jade.segs.map((q) => `${q.kind}${q.name ? ':' + q.name : ''} ${q.t0.toFixed(2)}-${q.t1.toFixed(2)}`).join(' | '));
  console.log(`[engine] [talos_r5] room B: nod ${seg(jade, 'clip', 0).t0.toFixed(2)}, pickup ${tPick.toFixed(2)}, plant ${tPlant}, charlie on the plate ${(() => { for (let t = 101; t < 103; t += 1 / 120) if (plateHeld5(charlie, t)) return t.toFixed(3); return '?'; })()}`);
  const openAt = (t) => { let k = 0; for (let i = 0; i < 6; i++) k += plateHeld5(charlie, t - i * 0.02) ? 1 : 0; return k / 6; };
  // the moth's two bonks each stall the bridge for 0.2 s (and dip the receiver)
  const stall = (t) => RB.MOTH.some((tb) => t >= tb && t < tb + 0.2);
  const litAt = (t) => t >= tPlant + 0.03 && openAt(t) > 0.5 && !stall(t);
  const BR = { t0: 104.0, dt: 1 / 240, p: [] }; { let p = 0; for (let t = BR.t0; t < 107.3; t += BR.dt) { p = litAt(t) ? Math.min(1, p + 2.0 * BR.dt) : stall(t) ? p : Math.max(0, p - 0.5 * BR.dt); BR.p.push(p); } }
  const bridgeAt = (t) => (t < BR.t0 ? 0 : BR.p[Math.min(BR.p.length - 1, Math.floor((t - BR.t0) / BR.dt))]);
  const tLit = (() => { for (let t = tPlant; t < 105; t += 1 / 240) if (litAt(t)) return t; return 105; })();
  console.log(`[engine] [talos_r5] room B: receiver 2 lit ${tLit.toFixed(3)}, bridge full at ${(() => { for (let t = 103; t < 107.3; t += 0.01) if (bridgeAt(t) >= 1) return t.toFixed(2); return 'never'; })()}`);
  const layers = { jade: [], charlie: [], ricky: [{ anim: 'chord', t0: TB.amp - 0.15, t1: 105.6, mask: 'armsHead', rate: 2 }, { anim: 'chord', t0: 105.6, t1: 107.2, mask: 'armsHead', rate: 1.5 }] };
  X.amp.updateMatrixWorld(true);
  const lens0 = X.amp.localToWorld(X.amp.userData.lens.clone());
  const recvC = () => X.recv.userData.crystal.centre();
  const R0 = recvC(); const sd = R0.clone().sub(lens0); const stackHit = lens0.clone().addScaledVector(sd, (RB.STACK.c[0] - RB.STACK.w / 2 - lens0.x) / sd.x);
  // ---- hand contacts
  const plug = press(X.amp.localToWorld(X.amp.userData.jack.clone()), 101.05, { tHit: 101.28, depth: 2, dir: [Math.cos(-X.amp.rotation.y), 0, Math.sin(-X.amp.rotation.y)], pose: 'grip' });
  const tp = X.tripod, GR = [0.6, 35, 3.8], GL = [0.6, 31, -3.8];
  const handsCarry = carry(tp, { R: GR, L: GL }, tPick - 0.2, tPlant + 0.02, { fade: 0.18 });
  const plantPose = (o) => { o.position.set(RB.SOCKET[0], top, RB.SOCKET[1]); o.rotation.set(0, PLANT_ROT, 0); };
  plantPose(tp); tp.set(1, 0); tp.updateMatrixWorld(true);
  const legPt = (k, y) => { const leg = tp.legs[k]; leg.updateWorldMatrix(true, false); const top0 = leg.position.clone(), d = V(0, -1, 0).applyQuaternion(leg.quaternion).multiplyScalar(leg.scale.y); return tp.localToWorld(top0.addScaledVector(d, (tp.H - y) / tp.H)); };
  const handsPlant = { R: hold(legPt(1, 34), tPlant - 0.04, 105.7, { fade: 0.12 }), L: hold(legPt(2, 28), tPlant - 0.04, tPlant + 0.32, { fade: 0.1 }) };
  const PLATE_PT = V(RB.PLATE[0] - 4, top + 2.5, RB.PLATE[1] + 4), tReach = TB.pull - 0.26, tPull = TB.pull + 0.06;
  const toCap = onJoint(F.charlie, 'cap', [2, 3, 0], tReach, tPull + 0.06, { fade: 0.14 });
  const pl = place(PLATE_PT, tPull + 0.04, { tDown: TB.hatDrop, hold: 0.06 });
  const tipR = onJoint(F.charlie, 'cap', [2, 3, 0], TB.tip - 0.16, TB.tip + 0.26, { fade: 0.12 });
  // ---- eye-lines
  const platePt = V(RB.PLATE[0], top + 3, RB.PLATE[1]), sockPt = V(RB.SOCKET[0], top + 6, RB.SOCKET[1]), recvPt = () => recvC();
  const mothPt = () => PB.bugs.moth.position.clone(); const tripodPt = () => tp.crystal.centre();
  const chHead = (t) => { const s = charlie.state(t); return V(s.x, s.y + 44, s.z); };
  const looks = {
    jade: [{ at: stackHit.clone(), t0: 101.0, t1: 102.3, fade: 0.25 }, { at: chHead, t0: 102.35, t1: 102.85, fade: 0.15 }, { at: platePt, t0: 102.9, t1: 103.0, fade: 0.1 }, { at: V(RB.TRIPOD0[0], top + 20, RB.TRIPOD0[1]), t0: 103.0, t1: 103.5, fade: 0.15 },
      { at: recvPt, t0: tPlant + 0.2, t1: 105.7, fade: 0.25 }, { at: V(RB.BRIDGE.x1, top + 20, RB.BRIDGE.z), t0: 105.75, t1: 107.2, fade: 0.2 }],
    charlie: [{ at: stackHit.clone(), t0: 101.0, t1: 102.3, fade: 0.25 }, { at: platePt, t0: 102.35, t1: 103.4, fade: 0.2 }, { at: tripodPt, t0: 103.5, t1: 104.6, fade: 0.25 }, { at: recvPt, t0: 104.65, t1: 104.8, fade: 0.2 },
      { at: mothPt, t0: 104.85, t1: 105.0, fade: 0.1 }, { at: platePt, t0: 105.05, t1: 105.6, fade: 0.15 }, { at: V(RB.BRIDGE.x1, top + 16, RB.BRIDGE.z), t0: 105.7, t1: 107.2, fade: 0.2 }],
    ricky: [{ at: X.amp.localToWorld(X.amp.userData.jack.clone()).add(V(0, 2, 0)), t0: 101.0, t1: 101.32, fade: 0.15 }, { at: stackHit.clone(), t0: 101.4, t1: 102.5, fade: 0.2 }, { at: tripodPt, t0: 102.6, t1: 104.0, fade: 0.25 },
      { at: recvPt, t0: 104.05, t1: 104.85, fade: 0.2 }, { at: mothPt, t0: 104.9, t1: 105.4, fade: 0.12 }, { at: V(RB.BRIDGE.x1, top + 16, RB.BRIDGE.z), t0: 105.5, t1: 107.2, fade: 0.2 }],
  };
  function tripodAt(t) {
    if (t < tPick) { tp.position.set(RB.TRIPOD0[0], top, RB.TRIPOD0[1]); tp.rotation.set(0, 0.4, 0); tp.set(0.35, 0); return; }
    const s = jade.state(t); const yw = s.h + FP_YAW; const fw = V(Math.cos(yw), 0, Math.sin(yw)); const eye = F.jade.F.J.head.getWorldPosition(V(0, 0, 0)).add(V(0, 10, 0));
    const rt = V(-Math.sin(yw), 0, Math.cos(yw)); const held = eye.clone().addScaledVector(fw, 21).addScaledVector(rt, 13).add(V(0, -9 - (tp.H + 6.3), 0));   // viewmodel: crystal ~10 deg below centre, right of the crosshair, the hands on the upper legs in the lower third
    const a = smooth(tPick, tPick + 0.25, t), b = smooth(tPlant - 0.2, tPlant, t);
    const p0 = V(RB.TRIPOD0[0], top, RB.TRIPOD0[1]), p2 = V(RB.SOCKET[0], top + 4 * (1 - smooth(tPlant - 0.03, tPlant + 0.02, t)), RB.SOCKET[1]);
    tp.position.copy(p0.lerp(held, a).lerp(p2, b)); tp.rotation.set(0, (-yw) * (1 - b) + PLANT_ROT * b + 0.4 * (1 - a), 0);
    const un = smooth(tPlant, tPlant + 0.16, t); tp.set(0.35 * (1 - a) + 0.12 * a * (1 - un) + un, 0);
  }

  return function frame(t) {
    F.jade.group.visible = F.charlie.group.visible = F.ricky.group.visible = true;
    F.jade.apply(jade, t, { layers: layers.jade, pencil: true, look: looks.jade });
    tripodAt(t);
    const jh = t < tPlant - 0.04 ? handsCarry : handsPlant;
    if (t >= tPick - 0.2 && t < 105.75) F.jade.apply(jade, t, { layers: layers.jade, pencil: true, hands: jh, look: looks.jade });
    F.charlie.apply(charlie, t, { layers: layers.charlie, look: looks.charlie, hands: t < tReach - 0.3 ? undefined : { R: t < tPull ? toCap : t < TB.tip - 0.2 ? pl.spec : tipR } });   // no hand spec before the hat trick (an idle spec bent him forward)
    F.ricky.apply(ricky, t, { layers: layers.ricky, hands: { R: plug.spec }, look: looks.ricky });
    const st = { jade: jade.state(t), charlie: charlie.state(t), ricky: ricky.state(t) };
    // Charlie points at the plate (the plan), then the cap tips with his hand on it
    { const w = smooth(TB.point[0], TB.point[0] + 0.14, t) * (1 - smooth(TB.point[1] - 0.12, TB.point[1], t)); pointArm(F.charlie, 'L', platePt.clone().add(V(0, 40, 0)), w, st.charlie.h);   // standing, arm from the shoulder, the back straight (M1 notes)
      if (F.charlie.F.J.cap) { const lift = Math.sin(Math.PI * clamp01((t - TB.tip) / 0.34)); const J = F.charlie.F.J.cap; J.position.y += 3.2 * lift; J.rotation.z -= 0.3 * lift; } }
    Q.rideCap(F.charlie, t);   // the ladybug rides his cap into the battle (battle_r5 picks it up at 107.283 at this offset)
    // ---------------------------------------------------------------------------- room state
    for (const o of [X.amp, X.stack, X.plate, X.tripod, X.socket, X.recv, X.curtainG]) o.visible = true;
    const ampOn = t >= TB.amp + 0.04; const open = openAt(t); const lit = litAt(t);
    X.amp.userData.lensMat.color.set('#ff5fd2').multiplyScalar(ampOn ? 3 : 0.25);
    const held = plateHeld5(charlie, t);
    X.curtain.set(t, smooth(0.2, 0.8, open), lit ? 0 : 0.2 * T.pulse(t, [TB.plate], 0.2));
    X.plate.userData.slab.position.y = held ? 0.6 : 1.5; X.plate.userData.edgeMat.color.set(held ? '#ffe7a8' : '#5a5048').multiplyScalar(held ? 3 : 1);
    X.socket.userData.ring.material.opacity = t < tPlant ? 0.5 + 0.4 * Math.sin(t * 8) ** 2 : 0.25;
    const cr = tp.crystal; cr.reset(); cr.visible = true; const rc = X.recv.userData.crystal; rc.reset(); rc.visible = true;
    const cam = cameraB(t, st, TR); const fp = !!cam.fp;
    // ---------------------------------------------------------------------------- the beam (screen-thin in first person)
    if (ampOn) {
      const pts = [lens0.clone()]; let end = null;
      if (t >= tPlant) { const c = cr.centre(); pts.push(c);
        if (open > 0.5) pts.push(recvC()); else { const d = recvC().sub(c); const n = V(RB.RECV[0] - RB.SOCKET[0], 0, RB.RECV[1] - RB.SOCKET[1]).normalize();
          end = c.clone().addScaledVector(d, (V(RB.CURTAIN.x, 0, RB.CURTAIN.z).sub(c).dot(n) - 3) / d.dot(n)); pts.push(end); } }
      else { pts.push(stackHit.clone()); end = stackHit; }
      let wk = 1; if (fp) { let dmin = 1e9; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], ab = pts[i].clone().sub(a); const u = clamp01(cam.pos.clone().sub(a).dot(ab) / Math.max(1e-6, ab.lengthSq())); dmin = Math.min(dmin, cam.pos.distanceTo(a.clone().addScaledVector(ab, u))); } wk = Math.min(1, Math.max(0.08, dmin / 220)); }
      const grow = clamp01((t - TB.amp) / 0.12); const bonk = stall(t) ? 0.6 + 0.4 * Math.abs(Math.sin(t * 60)) : 1;
      R.beams[0].visible = true; R.beams[0].set(pts, grow, { width: wk * bonk * (1 + 0.3 * T.pulse(t, [TB.amp, tPlant, tLit], 0.2) + 0.1 * Math.sin(t * 40)) });
      R.glowAt(0, lens0, fp ? 10 : 22, 1);
      if (end) R.glowAt(1, end, 30 + 8 * Math.sin(t * 30), 0.95);
      if (t >= tPlant) { cr.lit(fp ? 0 : 0.7, t); const c = cr.centre(); const gk = fp ? 0.3 : 1;
        R.glowAt(2, c.clone().addScaledVector(lens0.clone().sub(c).normalize(), 2.6), 7 * gk, 0.9); R.glowAt(5, c.clone().addScaledVector(recvC().sub(c).normalize(), 2.6), 7 * gk, 0.9); }
    }
    rc.lit(lit ? 1 : t >= tLit && stall(t) ? 0.3 : 0, t); if (lit) R.glowAt(4, recvC(), 30, 1);
    const toSock = V(RB.SOCKET[0] - RB.RECV[0], 0, RB.SOCKET[1] - RB.RECV[1]).normalize();
    rc.pulse(t - tLit, toSock, 0.7, 1.6);
    P.yiBridge.visible = true; P.yiBridge.position.z = RB.BRIDGE.z; P.yiBridge.position.y = yiY0 + RB.BRIDGE.dy; P.yiBridge.rotation.z = RB.BRIDGE.tilt; P.yiBridge.scale.z = RB.BRIDGE.sz; P.yiBridge.hz.setProgress(0, bridgeAt(t));
    P.yiBridge.hz.setColour(clamp01((t - 105.85) / 0.9) * 1.05);
    // ---------------------------------------------------------------------------- the spare cap: out of his cap, onto the plate
    { const capB = X.cap2, cs = 1.0 * R.hs;
      if (t >= tPull - 0.02 && t < TB.hatDrop) { capB.visible = true; const h = F.charlie.hand('R'); const u = smooth(tPull - 0.02, tPull + 0.12, t); capB.scale.setScalar(cs * (0.5 + 0.5 * u)); capB.position.copy(h).add(V(0, -2, 0)); capB.rotation.set(0, -st.charlie.h, 0.2); }
      else if (t >= TB.hatDrop) { capB.visible = true; capB.scale.setScalar(cs); capB.position.copy(PLATE_PT); capB.rotation.set(0, 0.6, 0); } }
    // ---------------------------------------------------------------------------- the moth: drawn to the tripod -> receiver beam, bonks twice
    if (t >= 104.55 && t < 106.0) {
      const m = PB.bugs.moth; m.visible = true; const hs = R.hs; const a = cr.centre(), b = recvC();
      const k = 0.42 + 0.06 * Math.sin((t - 104) * 1.3); const onBeam = a.clone().lerp(b, k);
      let off = V(0, 9 * hs + 3 * Math.sin(t * 7), 7 * hs + 4 * Math.sin(t * 4.3)); let spin = 0;
      for (const tb of RB.MOTH) { const s = t - tb;
        if (s > -0.18 && s < 0) { const u = (s + 0.18) / 0.18; off.multiplyScalar(1 - 0.85 * u * u); }
        else if (s >= 0 && s < 0.4) { const u = s / 0.4; off = V(0, 9 * hs, 7 * hs).multiplyScalar(0.15 + 1.1 * Math.sin(Math.PI * Math.min(1, u * 1.4)) + 0.2 * u); off.y -= 6 * hs * Math.sin(Math.PI * u); spin = 7 * (1 - u) * Math.sin(u * 20); } }
      const leave = smooth(105.55, 106.0, t); off.add(V(-30 * leave, 40 * leave, 30 * leave));
      m.position.copy(onBeam).add(off); m.position.y -= 5 * hs; m.rotation.set(spin * 0.3, -2.2 + 0.4 * Math.sin(t * 2), spin * 0.2); m.set({ anim: 'dance', t, beat: T.beatAt(t) * 2 });
    }
    P.sparks.visible = true;
    P.sparks.run(t, [
      ...RB.MOTH.map((te, i) => { const m = PB.bugs.moth.position; return { t0: te, x: m.x, y: m.y + 3, z: m.z, n: 14, speed: 35, up: 20, g: 60, dur: 0.4, seed: 600 + i, colors: ['#ff5fd2', '#ffffff', '#8a6bff'] }; }),
      { t0: TB.amp + 0.1, x: stackHit.x, y: stackHit.y, z: stackHit.z, n: 24, speed: 60, up: 20, g: 120, dur: 0.6, seed: 619, colors: ['#ff5fd2', '#ffffff'] },
      { t0: tPlant, x: RB.SOCKET[0], y: top + 2, z: RB.SOCKET[1], n: 22, speed: 50, up: 22, g: 160, dur: 0.5, seed: 620, colors: ['#e8dcc6', '#cfc0a4', '#ffffff'] },
      { t0: TB.plate, x: RB.PLATE[0], y: top + 2, z: RB.PLATE[1], n: 12, speed: 40, up: 16, g: 120, dur: 0.45, seed: 621, colors: ['#ffd27a', '#ffffff'] },
    ]);
    // ---------------------------------------------------------------------------- first person: head hidden, the crosshair
    F.jade.F.J.head.visible = !fp; for (const j of [F.jade.F.J.body, F.jade.F.J.chest]) if (j) for (const c of j.children) if (c.isMesh) c.visible = !fp;
    let ui2d = null;
    if (fp) {
      const C = R.cross; ui2d = { scene: C.scene, cam: C.cam };
      const camera0 = aim(persp('v2R5', aspect), cam.pos, cam.tgt, cam.fov);
      const sp = V(RB.SOCKET[0], top + 50, RB.SOCKET[1]).project(camera0);
      const snap = smooth(TB.snap[0], TB.snap[1], t) * (1 - smooth(tPlant - 0.02, tPlant + 0.1, t));
      C.g.position.set(sp.x * snap, sp.y * snap, 0);
      C.ring.material.opacity = 0.75 * snap; const pop = T.pulse(t, [TB.snap[1] - 0.05], 0.12); C.ring.scale.set((1 + 0.6 * pop) / C.asp, 1 + 0.6 * pop, 1);
      C.dot.material.opacity = 0.95 * (1 - 0.6 * smooth(tPlant + 0.1, tPlant + 0.4, t));
      if (t < tPlant) { R.glowAt(6, recvC(), 30, 0.55); R.glowAt(7, V(RB.SOCKET[0], top + 3, RB.SOCKET[1]), 26 + 4 * Math.sin(t * 9), 0.8); }   // receiver 2 behind its curtain; the socket on the cliff edge under the crosshair
    }
    const camera = aim(persp('v2R5', aspect), cam.pos, cam.tgt, cam.fov);
    const look = fp ? LOOK({ rays: 0.12, bloom: 0.35, bloomThr: 2.4, dofAmount: 0.04, k8SunAz: SUN_AZ_B, r5: { dof: 0, beam: 0, rim: 0, columns: { keep: ['M1'] }, ...KEY_B } }) : LOOK({ rays: 0.3, dofAmount: cam.dof ?? 0.18, k8SunAz: SUN_AZ_B, r5: { ...KEY_B, ...(cam.r5 || {}) } });
    talosDump(t, { room: 'B', solids: { amp: X.amp, stack: X.stack, tripod: X.tripod, socket: X.socket, recv: X.recv, curtain: X.curtainG, plate: X.plate },
      heroes: { jade: F.jade, charlie: F.charlie, ricky: F.ricky }, states: st, supports: { bridge: P.yiBridge, plate: X.plate, socket: X.socket }, beams: { amp: R.beams[0], switch: P.beam }, camera });
    return { camera, target: cam.tgt, focus: cam.focus || cam.tgt, look, shadowExtent: 520, ui2d, fp };
  };

  function eyeRig(tt) {
    const J = F.jade.F.J; const s = jade.state(tt);
    const head = J.head.getWorldPosition(V(0, 0, 0)); const fw = V(Math.cos(s.h), 0, Math.sin(s.h));
    const eye = head.clone().addScaledVector(fw, 4).add(V(0, 10, 0));
    const u = tt - tPlant; eye.y -= 7 * (u < 0 ? 0 : u < 0.06 ? u / 0.06 : Math.exp(-(u - 0.06) / 0.12));
    const yaw = s.h + FP_YAW, pit = FP_PITCH;
    let look = eye.clone().add(V(Math.cos(yaw) * Math.cos(pit), Math.sin(pit), Math.sin(yaw) * Math.cos(pit)).multiplyScalar(60));
    look.lerp(V(RB.SOCKET[0] + 10, top + 12, RB.SOCKET[1] - 4), 0.45 * smooth(tPlant - 0.1, tPlant + 0.05, tt));   // down at the plant: the legs unfold, the beam enters and leaves the crystal; held to the cut (B3 shows receiver 2)
    return { pos: eye, tgt: look, fov: 80 };
  }
  function cameraB(t, st, TR) {
    const C = RB.CAM;
    if (t < T.snap(FRONT_B)) {   // (v4b stage_3d) "my imagination" is Jade's line: a front-on medium of her singing it (chest height, ~a body length
      // in front of her facing), the stack she looks at behind the lens; then B1 shows the lock from behind the party (from the next beat)
      const j = st.jade, fx = Math.cos(j.h), fz = Math.sin(j.h); const k = smooth(101.0, FRONT_B, t);
      const pos = V(j.x + fx * (96 - 8 * k) - fz * 14, j.y + 52, j.z + fz * (96 - 8 * k) + fx * 14), face = V(j.x, j.y + 54, j.z);
      return { pos, tgt: V(j.x, j.y + 44, j.z), fov: 34, focus: face, dof: 0.12, r5: { dof: 0.2, tilt: 0, focus: face, beam: 0.6, columns: { keep: ['M1'] } } };
    }
    if (t < SHOT_B[1]) {   // B1: the reveal hold, a bar, from behind the party at the terrace edge: the stack in the amp's line, the socket, the curtain, receiver 2, the plate; a slow push
      const k = smooth(101.0, SHOT_B[1], t);
      return { pos: V(C.reveal[0][0] + 6 * k, C.reveal[0][1], C.reveal[0][2] - 14 * k), tgt: V(...C.reveal[1]), fov: 50, focus: V(1010, 20, 460), dof: 0.2, r5: { dof: 0.18, focus: V(1010, 20, 460), beam: 0.6, columns: { keep: ['M1'] } } };
    }
    if (t < SHOT_B[2]) {   // B2: the acting: Charlie points at the plate and walks to it, Jade nods and picks up the tripod (a medium shot from the party's side)
      const k = smooth(SHOT_B[1], SHOT_B[2], t);
      return { pos: V(C.act[0][0] + 4 * k, C.act[0][1], C.act[0][2] - 8 * k), tgt: V(...C.act[1]), fov: 44, focus: V(960, 30, 500), dof: 0.2, r5: { dof: 0.35, focus: V(960, 30, 500), beam: 0.6, columns: { keep: ['M1'] } } };
    }
    if (t < SHOT_B[3]) { const e = eyeRig(t); return { ...e, fp: true }; }   // first person (hard cut on beat 247; the plant at 104.7)
    // the k08b frame (lowered toward chest height): 3/4 behind the three on the cliff edge, the beam to receiver 2, the bridge drawing; then the pan with the crossing
    const k = smooth(SHOT_B[3], 107.15, t), pan = smooth(105.7, 107.1, t);
    return { pos: V(C.k08b[0][0] + 40 * pan, C.k08b[0][1] - 3 * k + 12 * pan, C.k08b[0][2] + 36 * pan), tgt: V(C.k08b[1][0] + 100 * pan, C.k08b[1][1] - 22 * pan, C.k08b[1][2] + 110 * pan), fov: 44, focus: V(975 + 90 * pan, 30, 480 + 20 * pan), r5: { dof: 0.4, focus: V(975 + 90 * pan, 30, 480 + 20 * pan), beam: 0.85 } };
  }
}

// ================================================================================================================ ROOM 2
function buildRoom2(R, PB, W, Q) {
  if (R.room2r5) return R.room2r5;
  const X = {}; const Tr = R2.TER; const top = R2.TOP;
  X.terMat = r4Stone('#efe3cc');
  X.terrace = R.add(R.box(Tr.x1 - Tr.x0, Tr.y - top, Tr.z1 - Tr.z0, X.terMat, (Tr.x0 + Tr.x1) / 2, (Tr.y + top) / 2, (Tr.z0 + Tr.z1) / 2));
  X.block = R.add(R.box(14, 22, 24, R.stone, R2.BLOCK[0], top + 11, R2.BLOCK[1]));
  { const g = new THREE.Group(); g.add(R.box(32, 200, 32, R.stone, 0, -100, 0));
    const edgeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd27a'), toneMapped: false }); const plate = R.box(22, 1.6, 22, R.stone, 0, 0.8, 0); g.add(plate);
    for (const [x, z, w, d] of [[0, 12, 25, 1], [0, -12, 25, 1], [12, 0, 1, 25], [-12, 0, 1, 25]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, d), edgeMat); e.position.set(x, 0.5, z); g.add(e); }
    g.position.set(R2.LIFT[0], top, R2.LIFT[1]); g.userData = { plate, edgeMat }; X.lift = R.add(g); }
  // the lift's gear housing: an open cage against the terrace's west face beside the lift, the beetle rolls in circles inside it
  X.housing = Q.makeHousing(R2_5.HOUSING_W); X.housing.position.set(R2_5.HOUSING[0], R2_5.HOUSING[1], R2_5.HOUSING[2]);
  R.room2r5 = X; return X;
}

const _bb = new THREE.Box3(), _fp = new THREE.Vector3();
function makeRoom2(ctx, W, R, PB, Q, X) {
  const P = W.props; const F = R.figs; const aspect = ctx.width / ctx.height; const top = R2.TOP, TY = R2.TER.y, hs = R.hs;
  const { jade, charlie, ricky } = room2TracksR5(R, { jade: F.jade.unit, charlie: F.charlie.unit, ricky: F.ricky.unit });
  for (const tr of [jade, charlie, ricky]) for (const w of tr.warnings || []) console.log('[engine] [talos_r5] room 2 motion warning: ' + w);
  const CH = R2.CH, BC = R2.BC, Q2 = R2_5;
  const vaultSeg = jade.segs.find((s) => s.kind === 'jump');
  const rj = ricky.segs.filter((s) => s.kind === 'jump'); const stompT = rj[0].touch, hopOff = rj[1];
  const tTake = hopOff.touch - 0.24;
  console.log(`[engine] [talos_r5] room 2: stomp ${stompT.toFixed(3)}, hop-off take ${tTake.toFixed(3)} touch ${hopOff.touch.toFixed(3)}; lift free ${Q2.LIFT5.free} top ${Q2.LIFT5.top}`);
  const hatOff = (t) => t >= CH.throw - 0.15 && t < CH.caught;
  const layers = {
    jade: [{ anim: 'draw_graphite', t0: Q2.POKE.reach - 0.1, t1: Q2.POKE.done + 0.1, mask: 'upper', fade: 0.12, p: () => 0.55 }],
    charlie: [{ anim: 'throw', t0: CH.throw - 0.2, t1: CH.hatDown + 0.05, mask: 'upper', p: (t) => clamp01((t - CH.throw + 0.2) / 0.3) }, { anim: 'throw', t0: CH.caught - 0.1, t1: CH.caught + 0.25, mask: 'arms', p: () => 0.25 }],
    ricky: [{ anim: 'chord', t0: 96.7, t1: BC.test[0] - 0.1, mask: 'armsHead', rate: 1 }],
  };
  // Jade pokes the housing with the graphite pencil: her right hand (the pencil in her fist) comes down onto its cog
  const H = X.housing; H.updateMatrixWorld(true); const cogTop = H.userData.cog.getWorldPosition(V(0, 0, 0)).add(V(0, 1.2, 0));
  const poke = press(cogTop.clone().add(V(3, 12, 3)), Q2.POKE.reach, { tHit: Q2.POKE.hit, depth: 5, dir: [0, -1, 0], pose: 'fist' });
  F.charlie.apply(charlie, 94.3, {}); const hb = new THREE.Box3().setFromObject(F.charlie.F.J.head); const capUp = hb.max.y - F.charlie.F.J.head.getWorldPosition(V(0, 0, 0)).y;
  const tree = W.avenue[TREE_HITS[1][1]]; const treeBox = new THREE.Box3().setFromObject(tree); const treeC = treeBox.getCenter(new THREE.Vector3());
  const treeR = Math.max(4, Math.min(treeBox.max.x - treeBox.min.x, treeBox.max.z - treeBox.min.z) / 2);
  const FFw = [96.7, 98.25], GLITCH = [97.45, 97.55];
  const capRest = V(R2.CAPSPOT[0], top + 0.5, R2.CAPSPOT[1]);
  const EH = PB.letterE.userData.h, EW = PB.letterE.userData.w, ED = PB.letterE.userData.depth, GAP = EW / 2 + 8 * hs, GX = R2.GATE_X, GZ = R2.GZ;
  const housingPt = V(Q2.HOUSING[0], Q2.HOUSING[1] + 6, Q2.HOUSING[2]);
  const looks = {
    jade: [{ at: V(R2.BLOCK[0], top + 24, R2.BLOCK[1]), t0: 94.204, t1: 94.4, fade: 0.1 }, { at: V(R2.LIFT[0], top + 30, R2.LIFT[1]), t0: 95.4, t1: 95.9, fade: 0.2 }, { at: housingPt, t0: 95.92, t1: Q2.POKE.done + 0.2, fade: 0.15 },
      { at: () => PB.bugs.beetle.position.clone(), t0: Q2.BEETLE.out, t1: Q2.BEETLE.gone, fade: 0.15 }, { at: V(GX, TY + 30, GZ), t0: 98.4, t1: 100.2, fade: 0.25 }],
    charlie: [{ at: V(R2.CAPSPOT[0], top + 2, R2.CAPSPOT[1]), t0: 94.5, t1: 95.2, fade: 0.2 }, { at: V(R2.LIFT[0], top + 40, R2.LIFT[1]), t0: 95.9, t1: 96.7, fade: 0.2 }, { at: V(GX - 52, TY + 4, GZ), t0: 100.1, t1: 100.7, fade: 0.2 }],
    ricky: [{ at: V(R2.LIFT[0], top + 4, R2.LIFT[1]), t0: 95.2, t1: 95.8, fade: 0.2 }, { at: housingPt, t0: 95.96, t1: 96.4, fade: 0.15 }, { at: V(GX - 52, TY + 2, GZ), t0: 99.9, t1: 100.66, fade: 0.2 }],
  };
  const glitchSkin = (t) => { const L = Q2.LIFT5; if (t < L.t0 + 0.02 || t >= L.free) return 0; const f = Math.floor(t * 18); return (f % 3 === 0) ? 1 : (f % 7 === 0 ? 1 : 0); };

  return function frame(t) {
    const hNH = hatOff(t); const ch = hNH ? F.charlieNH : F.charlie;
    F.jade.group.visible = ch.group.visible = F.ricky.group.visible = true;
    { const J = F.jade.F.J; J.head.visible = true; for (const j of [J.body, J.chest]) if (j) for (const c of j.children) if (c.isMesh) c.visible = true; }   // order-free frames: Room B's first person hides these
    F.jade.apply(jade, t, { layers: layers.jade, pencil: true, look: looks.jade, hands: t >= Q2.POKE.reach - 0.3 && t < Q2.POKE.done + 0.3 ? { R: poke.spec } : undefined });
    ch.apply(charlie, t, { layers: layers.charlie, look: looks.charlie });
    F.ricky.apply(ricky, t, { layers: layers.ricky, look: looks.ricky });
    const st = { jade: jade.state(t), charlie: charlie.state(t), ricky: ricky.state(t) };
    // Charlie ducks through the because gate (the ladybug close-up)
    { const u = smooth(Q2.DUCK.t0, Q2.DUCK.t0 + 0.12, t) * (1 - smooth(Q2.DUCK.t1 - 0.05, Q2.DUCK.t1 + 0.1, t)); if (u > 0) { const J = ch.F.J; const D = Math.PI / 180;
      const q = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -34 * D * u); (J.chest || J.body).quaternion.multiply(q); J.head.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -14 * D * u)); } }
    for (const [f, s] of [[F.jade, st.jade], [ch, st.charlie], [F.ricky, st.ricky]]) { if (s.air) continue; const g = groundR2(s.x, s.z, t); let y0 = Infinity;
      f.group.updateMatrixWorld(true); for (const sd of ['R', 'L']) { const ft = f.foot?.[sd]; if (!ft?.parent) continue; for (const q of [ft.heel, ft.toe]) y0 = Math.min(y0, _fp.copy(q).applyMatrix4(ft.parent.matrixWorld).y); }
      if (y0 < g - 0.5) { f.group.position.y += g - y0; f.group.updateMatrixWorld(true); } }
    { const a0 = vaultSeg.touch - (R2.VAULT[1] - R2.VAULT[0]), u = clamp01((t - a0) / (vaultSeg.touch - a0));
      if (u > 0 && u < 1) { const g = F.jade.group; const h = st.jade.h; const ax = V(Math.sin(h), 0, -Math.cos(h)); const q = new THREE.Quaternion().setFromAxisAngle(ax, 2 * Math.PI * smooth(0.06, 0.94, u));
        const pv = V(0, 0.45 * 69, 0); g.position.add(pv.clone().sub(pv.clone().applyQuaternion(q))); g.quaternion.premultiply(q); g.updateMatrixWorld(true);
        const J = F.jade.F.J, D = Math.PI / 180; const tuck = Math.sin(Math.PI * u);
        J.hipR.rotation.set(0, 0, 95 * tuck * D); J.hipL.rotation.set(0, 0, 85 * tuck * D); J.kneeR.rotation.set(0, 0, -120 * tuck * D); J.kneeL.rotation.set(0, 0, -115 * tuck * D);
        J.shoulderR.rotation.set(0, 0, 60 * tuck * D); J.shoulderL.rotation.set(0, 0, 60 * tuck * D); } }
    // ---------------------------------------------------------------------------- room
    for (const o of [X.terrace, X.block, X.lift, X.housing]) o.visible = true;
    X.lift.position.y = top + liftY(t);
    const pressed = t >= stompT && t < tTake; X.lift.userData.plate.position.y = pressed ? 0.3 : 0.8; X.lift.userData.edgeMat.color.set(pressed ? '#ffe7a8' : '#5a5048').multiplyScalar(pressed ? 3 : 1);
    // the gear housing: the cog turns with the lift, the checker skin flickers while the beetle is in it, glitch rings on each jerk
    { const Hd = X.housing.userData; const L = Q2.LIFT5; Hd.cog.rotation.y = liftY(t) * 0.3; Hd.skin.visible = glitchSkin(t) > 0;
      const jerks = [L.t0, L.t0 + (L.stall - L.t0) / 3, L.t0 + 2 * (L.stall - L.t0) / 3, L.stall + 0.1];
      Hd.rings.forEach((r, k) => { r.visible = false; for (const tj of jerks) { const age = t - tj - k * 0.09; if (age < 0 || age > 0.42) continue; const u = age / 0.42; r.visible = true; r.scale.setScalar(Hd.w * (0.5 + 2.2 * u)); r.material.opacity = (1 - u) * (1 - u); break; } }); }
    const jx = Math.min(GX + 40, st.jade.x); if (jx > R2.TER.x0) X.terMat.userData.lp?.capsule(V(R2.TER.x0, TY, R2.LANE.jade), V(jx + 8, TY, R2.LANE.jade), 22).edge(16);
    P.flowers.visible = true; P.flowers.update((it) => clamp01((t - (CUE.v2 + 0.05 + Math.max(0, it.x - 588) / 62 + Math.abs(it.z - 348) / 170)) / 0.45), t);
    for (const o of [PB.letterB, PB.letterE, PB.letterCause, PB.crumbs]) o.visible = true;
    PB.letterB.position.set(GX, TY, GZ - GAP - PB.letterB.userData.w / 2); PB.letterB.rotation.set(0, -Math.PI / 2, 0);
    PB.letterCause.position.set(GX, TY, GZ + GAP + PB.letterCause.userData.w / 2); PB.letterCause.rotation.set(0, -Math.PI / 2, 0);
    PB.letterE.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, 1), V(1, 0, 0), V(0, 1, 0))); PB.letterE.position.set(GX - EH / 2, TY + ED / 2, GZ);
    PB.crumbs.position.set(GX - ED / 2 - 16 * hs, TY, PB.letterB.position.z + PB.letterB.userData.bite.x);
    if (t >= BC.test[0] && t < BC.step) { const J = F.ricky.F.J, D = Math.PI / 180; const tap = Math.abs(Math.sin(Math.PI * 2 * clamp01((t - BC.test[0]) / (BC.test[1] - BC.test[0]))));
      J.hipR.rotation.set(0, 0, (38 + 10 * tap) * D); J.kneeR.rotation.set(0, 0, (-14 - 18 * tap) * D); J.shoulderL.rotation.set(30 * D, 0, 70 * D); }
    const cap = PB.cap; const cs = 1.15 * hs;
    if (t >= CH.throw - 0.15 && t < CH.hatDown) { cap.visible = true; const h = F.charlieNH.hand('R'); const u = clamp01((t - CH.throw) / (CH.hatDown - CH.throw)); cap.position.copy(h).lerp(capRest, u); cap.position.y += 6 * Math.sin(Math.PI * u); cap.scale.setScalar(cs * 1.3); cap.rotation.set(0, -0.4, 0); }
    else if (t >= CH.hatDown && t < CH.boing + 0.08) { cap.visible = true; cap.position.copy(capRest); cap.scale.setScalar(cs * 1.3); cap.scale.y *= 1 - 0.5 * T.pulse(t, [CH.on, CH.boing], 0.12); cap.rotation.set(0, -0.4, 0); }
    else if (t >= CH.boing + 0.08 && t < CH.caught) { cap.visible = true; const u = clamp01((t - CH.boing - 0.08) / (CH.caught - CH.boing - 0.08)); const h = F.charlieNH.hand('R'); cap.position.copy(capRest).lerp(h, u); cap.position.y += 34 * Math.sin(Math.PI * u); cap.scale.setScalar(cs * 1.3); cap.rotation.set(0.4, t * 12, 0); }
    // the ladybug rides the cap the whole room (on his head / the trampoline)
    { const lb = Q.ladybug; if (cap.visible) { lb.visible = true; lb.position.copy(cap.position).add(V(-3, 5 * hs - 1.5, 0)); lb.rotation.set(0, 0.4, 0); lb.set({ anim: 'idle', t, stance: 'crawl' }); if (t >= CH.on && t < CH.land) lb.position.y += 4 * hs * Math.abs(Math.sin((t - CH.on) * 18)); }
      else Q.rideCap(ch, t); }
    // the beetle: rolling in circles inside the gear housing, then (the poke) out and away still circling
    if (t >= 94.3 && t < Q2.BEETLE.gone) {
      const bb = PB.bugs.beetle; bb.visible = true; const u = clamp01((t - Q2.BEETLE.out) / (Q2.BEETLE.gone - Q2.BEETLE.out));
      const c = V(Q2.HOUSING[0], X.housing.position.y + 1.2, Q2.HOUSING[2]);
      if (u <= 0) bb.position.copy(c); else { const e = u * u; bb.position.set(c.x + 8 + 110 * e, c.y, c.z - 10 * u + 6 * Math.sin(u * 9)); }   // out the east side and off along the terrace's north edge, still circling
      bb.rotation.set(0, 0, 0); bb.set({ anim: 'bug', t, beat: T.beatAt(t) * 1.5, ringR: u <= 0 ? 7 : 12, stance: 'crawl' });
    }
    if (t >= FFw[0] && t < FFw[1]) {
      const ff = PB.bugs.firefly; ff.visible = true; const u = (t - FFw[0]) / (FFw[1] - FFw[0]);
      const y = treeBox.min.y + (0.35 + 0.2 * u) * (treeBox.max.y - treeBox.min.y); const rr = treeR * (1 - 0.35 * ((y - treeBox.min.y) / (treeBox.max.y - treeBox.min.y))) + 1.5; const ang = 0.9 + 0.6 * u;
      ff.position.set(treeC.x + rr * Math.cos(ang) * 0.6, y, treeC.z + rr * Math.sin(ang)); ff.rotation.set(0, -ang + Math.PI / 2, 0.9); const gl = t >= GLITCH[0] && t < GLITCH[1];
      ff.set({ anim: 'bug', t, glow: gl ? 1 : t > 97.7 ? 0.9 : 0.1 }); if (gl) PB.glitchOn(tree, ff.position, 16 * hs);
    }
    P.burst.visible = true;
    P.burst.run(t, [{ t0: vaultSeg.touch, x: 674, y: TY, z: R2.LANE.jade, n: 10, speed: 40, up: 18, g: 150, dur: 0.5, seed: 11, size: 1.3 },
      { t0: stompT, x: R2.LIFT[0], y: top + 1, z: R2.LIFT[1], n: 22, speed: 70, up: 25, g: 180, dur: 0.6, seed: 12, size: 1.8 },
      { t0: hopOff.touch, x: 672, y: TY, z: R2.LANE.ricky, n: 16, speed: 55, up: 20, g: 180, dur: 0.6, seed: 13, size: 1.6 },
      { t0: CH.land, x: 680, y: TY, z: R2.LANE.charlie, n: 10, speed: 40, up: 18, g: 150, dur: 0.5, seed: 14, size: 1.3 },
      { t0: Q2.POKE.hit, x: Q2.HOUSING[0], y: Q2.HOUSING[1] + 8, z: Q2.HOUSING[2], n: 12, speed: 40, up: 22, g: 160, dur: 0.5, seed: 15, size: 1.2, colors: ['#4a4a50', '#b028c8', '#9a9aa2'] }]);
    // ---------------------------------------------------------------------------- cameras (cuts on beats 230 / 234 / 240)
    let pos, tgt, fov = 50, focus, dof;
    if (t < 96.659) {          // C1: the climb, from the south-west at chest height: vault, bounce, Ricky's stuttering lift and the housing
      const k = smooth(94.204, 96.659, t); pos = V(580 + 50 * k, 68, 470); tgt = V(652 + 30 * k, 44, 340); focus = V(646 + 30 * k, 44, 340); fov = 50;
    } else if (t < 98.292) {   // C2: cutaway: the cypress Jade coloured at 82.93, a firefly on it (the glitch)
      const k = smooth(96.659, 98.292, t); const fy = PB.bugs.firefly.position.y || treeC.y;
      pos = V(treeC.x + 50 - 8 * k, fy + 14, treeC.z + 120 - 10 * k); tgt = V(treeC.x, fy + 4, treeC.z); fov = 36; focus = V(treeC.x, fy, treeC.z + treeR);
    } else if (t < Q2.SHOT4) { // C3: along the terrace to the because gate; Ricky tests the e
      const k = smooth(98.292, 100.4, t);
      pos = V(640 + 70 * k, 100 - 26 * k, 452 - 30 * k); tgt = V(GX - 10, TY + 50 - 16 * k, GZ + 6); focus = V(GX - 40, TY + 20, GZ); fov = 48 - 4 * k;
    } else {                   // C4: the ladybug close-up: on Charlie's cap as he ducks through the gate (the viewer sees it, the party doesn't)
      const lb = Q.ladybug.position.clone(); const s = st.charlie; const fw = V(Math.cos(s.h), 0, Math.sin(s.h)), rt = V(-Math.sin(s.h), 0, Math.cos(s.h));   // rigid on his head frame: ahead-right-above the cap
      pos = lb.clone().addScaledVector(fw, -24).addScaledVector(rt, 12).add(V(0, 14, 0)); tgt = lb.clone().add(V(0, 1, 0)).addScaledVector(fw, 6); fov = 30; focus = lb; dof = 0.5;   // from behind-right-above: the crown, the rider, the letters ahead
    }
    const camera = aim(persp('v2R5_2', aspect), pos, tgt, fov);
    talosDump(t, { room: '2', solids: { terrace: X.terrace, block: X.block, lift: X.lift, housing: X.housing }, heroes: { jade: F.jade, charlie: ch, ricky: F.ricky }, states: st, supports: { terrace: X.terrace, lift: X.lift, block: X.block, because: P.because }, beams: { b0: R.beams[0], b1: R.beams[1] }, camera });
    return { camera, target: tgt, focus: focus || tgt, look: LOOK({ rays: 0.3, dofAmount: dof ?? 0.2, r5: { dof: dof ?? 0.45, focus: focus || tgt, beam: 0 } }), shadowExtent: 450 };
  };
}
