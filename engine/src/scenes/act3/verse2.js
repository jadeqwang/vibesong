// ACT III · 94.204-107.15 · VERSE 2 = ROOM 2 (the climb, 94.204-101.0) + ROOM B (the co-op crossing, 101.0-107.15).
// talos_r4 (round 4, docs/pages/talos_level.svg). The approved v2 staging lives on in verse2_v2.js (default renders).
//
// ROOM B (k08b, M4 layout): a ruined sea stack in the chasm blocks Ricky's fixed amp's straight shot at receiver 2; the tripod
// socket on the cliff edge is the one spot that sees both. Receiver 2 sits behind a field curtain on mesa B, open only while
// the pressure plate is held. 101.36 Ricky's chord switches the amp on (it keeps running): the beam splashes on the stack.
// 101.955 Charlie steps on the plate: the curtain opens. 102.768-104.396 FIRST PERSON (the Talos homage): Jade carries the
// tripod (crosshair snaps onto the socket) and plants it on "linked" (103.105): the beam relays amp -> tripod -> receiver 2,
// which lights, and the pencil-stroke bridge draws itself. 104.396 the k08b frame. 104.42 the threat: Charlie steps off, the
// curtain shuts, receiver 2 dies, the bridge fades; he steps back. The moth bonks the beam twice. 105.2 "life": he pulls a
// spare hat out of his hat, leaves it on the plate (105.52) and walks off (105.618): the plate stays down. All three cross;
// 107.15 the battle swirl. The cameras look north along the cliff edge; the sun is turned ahead-right (k8SunAz) for this room.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { getWorld, MESA_A } from './world/build.js';
import { make3D, CUE, V, aim, persp, smooth, clamp01, LOOK, pathAt, R5 } from './common.js';
import { R4, ensurePB, ensureR4, springCam, Tripod, Field, r4Stone, dumpInit, talosDump } from './prebattle_props.js';
import { RB, roomBTracks, plateHeld, R2, room2Tracks, liftY, groundR2 } from './talos_plan.js';
import { TREE_HITS } from './paintlog.js';
import { capGeo } from '../../core/voxfig.js';
import { press, hold, carry, carryFrame, onJoint, place } from '../../core/motion/index.js';

export async function setup(ctx) {
  if (R5()) return (await import('./verse2_r5.js')).setup(ctx);   // round 5 (talos_r5): Room 2 + Room B additions, --r5 only
  if (!R4) return (await import('./verse2_v2.js')).setup(ctx);
  return setupR4(ctx);
}

const SHOT_B = [101.0, 102.768, 104.396, 107.2];                   // B1 (the lock) | first person | the k08b frame + the crossing
const FP_YAW = 33 * Math.PI / 180;                               // the first-person view turns this far toward receiver 2 (north-east)
const PLANT_ROT = 1.0;                                            // the planted tripod's turn (her right hand on leg 1)
const SUN_AZ_B = 42;                                              // room B: the sun turned to ahead-right of the north-looking cameras (k08b backlight)

async function setupR4(ctx) {
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const PB = await ensurePB(W); const R = await ensureR4(W, ctx); const F = R.figs;
  const B = buildRoomB(R, PB, W);
  await dumpInit();
  const roomB = makeRoomB(ctx, W, R, PB, B);
  const room2 = makeRoom2(ctx, W, R, PB, buildRoom2(R, PB, W));
  const scene = await make3D(ctx, W, {
    inWorldSubs: [25],
    frame(t) {
      PB.begin(); R.begin();
      const out = t >= 101.0 ? roomB(t) : room2(t); scene._fp = !!out.fp;
      return out;
    },
  });
  // world_look's k08b sunbeam (a cone in the 'k08b_ground' group, set per frame by its look) is switched off in first person
  const k8g = W.scene.getObjectByName('k08b_ground'); const sunbeam = k8g?.children.find((c) => c.isMesh && c.renderOrder === 5 && c.material?.isShaderMaterial);
  const yiZ0 = P.yiBridge ? P.yiBridge.position.z : 0, yiY0 = P.yiBridge ? P.yiBridge.position.y : 0, yiR0 = P.yiBridge ? P.yiBridge.rotation.z : 0;   // Room B moves the stroke bridge to its line; restored after each render
  const base = scene.update; let fpNow = false; scene.update = (t) => { base(t); fpNow = !!scene._fp; const D = W.compose?.dressing; if (D?.s101) D.s101.visible = false; if (fpNow && sunbeam) sunbeam.visible = false; };
  // first person: clamp the k08b look's bloom floor and the anamorphic streaks for this shot only (restored right after the render)
  const rend = scene.render; scene.render = (t, target) => { const lk = ctx.post?.look; let sv = null;
    if (fpNow && lk) { sv = [lk.P.bloom, lk.mat.uniforms.uStreak.value]; lk.P.bloom = 0.12; lk.mat.uniforms.uStreak.value = 0.0; }
    rend(t, target); if (sv) { lk.P.bloom = sv[0]; lk.mat.uniforms.uStreak.value = sv[1]; } if (P.yiBridge) { P.yiBridge.position.z = yiZ0; P.yiBridge.position.y = yiY0; P.yiBridge.rotation.z = yiR0; P.yiBridge.scale.z = 1; } };
  return scene;
}

// ================================================================================================================ ROOM B
function buildRoomB(R, PB, W) {
  if (R.roomB) return R.roomB;
  const X = {}; const top = RB.TOP; const stone = R.stone;
  // Ricky's fixed amp at his feet, aimed at receiver 2 (the sea stack is in the way)
  X.amp = R.makeAmp(); X.amp.position.set(RB.AMP[0], top, RB.AMP[1]); X.amp.rotation.y = -Math.atan2(RB.RECV[1] - RB.AMP[1], RB.RECV[0] - RB.AMP[0]);
  // the ruined sea stack in the chasm: a rock column from the sea with a broken top
  { const S = RB.STACK, g = new THREE.Group(); g.position.set(S.c[0], 0, S.c[1]);
    g.add(R.box(S.w, S.h + 214, S.d, R.rock, 0, (S.h - 214) / 2, 0)); g.add(R.box(S.w + 16, 80, S.d + 14, R.rock, 0, -170, 0));
    for (const [x, z, w, h] of [[-5, -4, 12, 10], [6, 3, 9, 16], [-2, 6, 7, 6]]) g.add(R.box(w, h, w, stone, x, S.h + h / 2, z));
    X.stack = R.add(g); }
  // pressure plate: a stone slab in a frame with a glowing edge (dark -> lit)
  { const g = new THREE.Group(); g.position.set(RB.PLATE[0], top, RB.PLATE[1]);
    const edgeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd27a'), toneMapped: false });
    g.add(R.box(34, 1.2, 34, stone, 0, 0.6, 0)); const slab = R.box(26, 3, 26, R.stone, 0, 1.5, 0); g.add(slab);
    for (const [x, z, w, d] of [[0, 15.5, 31, 1.2], [0, -15.5, 31, 1.2], [15.5, 0, 1.2, 31], [-15.5, 0, 1.2, 31]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, d), edgeMat); e.position.set(x, 1.3, z); g.add(e); }
    g.userData = { slab, edgeMat }; X.plate = R.add(g); }
  // tripod (upright: legs splay down, the crystal on top) + its socket ring on the cliff edge
  X.tripod = R.add(new Tripod({ H: 40, r: 12 }));
  { const g = new THREE.Group(); g.position.set(RB.SOCKET[0], top + 0.3, RB.SOCKET[1]);
    const ring = new THREE.Mesh(new THREE.RingGeometry(13, 15.5, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9ae6').multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; g.add(ring); g.add(R.box(30, 0.6, 30, R.graphite('#77777f'), 0, 0, 0)); g.userData = { ring }; X.socket = R.add(g); }
  // receiver 2 on mesa B, behind its field curtain (two posts + a lintel; the field faces west)
  X.recv = R.makeReceiver({ h: 30 }); X.recv.position.set(RB.RECV[0], top, RB.RECV[1]);
  { const C = RB.CURTAIN, g = new THREE.Group(); g.position.set(C.x, top, C.z); g.rotation.y = Math.atan2(RB.RECV[0] - RB.SOCKET[0], RB.RECV[1] - RB.SOCKET[1]);   // square to the socket's line
    g.add(R.box(7, C.h + 6, 7, stone, -C.w / 2 - 3.5, (C.h + 6) / 2, 0)); g.add(R.box(7, C.h + 6, 7, stone, C.w / 2 + 3.5, (C.h + 6) / 2, 0)); g.add(R.box(C.w + 16, 6, 9, stone, 0, C.h + 6, 0));
    const f = new Field(C.w, C.h); g.add(f); X.curtain = f; X.curtainG = R.add(g); }
  { const m = PB.cap.material; X.cap2 = R.add(new THREE.Mesh(capGeo(0.52), m)); X.cap2.castShadow = true; }
  R.roomB = X; return X;
}

function makeRoomB(ctx, W, R, PB, X) {
  const P = W.props; const F = R.figs; const aspect = ctx.width / ctx.height; const top = RB.TOP; const TB = RB.T;
  const yiY0 = P.yiBridge.userData.y0 ??= P.yiBridge.position.y;   // the stroke bridge's own height (levelled + raised in this room)
  const { jade, charlie, ricky, screen } = roomBTracks(R, { jade: F.jade.unit, charlie: F.charlie.unit, ricky: F.ricky.unit });
  for (const tr of [jade, charlie, ricky]) for (const w of tr.warnings || []) console.log('[engine] [talos_r4] room B motion warning: ' + w);
  const kk = screen.filter((q) => q[0] >= SHOT_B[2] && q[0] < 105.62); if (kk.length) console.log(`[engine] [talos_r4] room B: k08b-frame overlaps ${JSON.stringify(kk)}`);
  const TR = { jade, charlie, ricky };
  const seg = (tr, kind, k = 0) => tr.segs.filter((s) => s.kind === kind)[k];
  const tPick = seg(jade, 'clip', 0).t0 + 0.22, tPlant = TB.plant;
  // the curtain is open while the plate is held (smoothed over 0.1 s); receiver 2 is lit when the tripod is planted and the curtain open
  const openAt = (t) => { let k = 0; for (let i = 0; i < 6; i++) k += plateHeld(charlie, t - i * 0.02) ? 1 : 0; return k / 6; };
  const litAt = (t) => t >= tPlant + 0.03 && openAt(t) > 0.5;
  const BR = { t0: 103.0, dt: 1 / 240, p: [] }; { let p = 0; for (let t = BR.t0; t < 107.3; t += BR.dt) { p = litAt(t) ? Math.min(1, p + 0.8 * BR.dt) : Math.max(0, p - 0.5 * BR.dt); BR.p.push(p); } }
  const bridgeAt = (t) => (t < BR.t0 ? 0 : BR.p[Math.min(BR.p.length - 1, Math.floor((t - BR.t0) / BR.dt))]);
  const tLit = (() => { for (let t = tPlant; t < 105; t += 1 / 240) if (litAt(t)) return t; return 105; })();
  const relitT = (() => { for (let t = TB.threat[1]; t < 106; t += 1 / 240) if (litAt(t)) return t; return 106; })();
  console.log(`[engine] [talos_r4] room B: plant ${tPlant}, receiver 2 lit ${tLit.toFixed(3)}, threat dark until ${relitT.toFixed(3)}, bridge full at ${(() => { for (let t = 103; t < 107.3; t += 0.01) if (bridgeAt(t) >= 1) return t.toFixed(2); return 'never'; })()}`);
  const layers = { jade: [], charlie: [], ricky: [{ anim: 'chord', t0: TB.amp - 0.15, t1: 105.6, mask: 'armsHead', rate: 2 }, { anim: 'chord', t0: 105.6, t1: 107.2, mask: 'armsHead', rate: 1.5 }] };
  X.amp.updateMatrixWorld(true);
  const lens0 = X.amp.localToWorld(X.amp.userData.lens.clone());
  const recvC = () => X.recv.userData.crystal.centre();
  // where the straight shot hits the stack, and where the tripod -> receiver beam meets the curtain
  const R0 = recvC(); const sd = R0.clone().sub(lens0); const stackHit = lens0.clone().addScaledVector(sd, (RB.STACK.c[0] - RB.STACK.w / 2 - lens0.x) / sd.x);
  // ---- hand contacts: Ricky's jack; Jade's two-hand carry, then one hand stays on the planted tripod; Charlie's spare cap
  const plug = press(X.amp.localToWorld(X.amp.userData.jack.clone()), 101.05, { tHit: 101.28, depth: 2, dir: [Math.cos(-X.amp.rotation.y), 0, Math.sin(-X.amp.rotation.y)], pose: 'grip' });
  const tp = X.tripod, GR = [0.6, 35, 3.8], GL = [0.6, 31, -3.8];
  const handsCarry = carry(tp, { R: GR, L: GL }, tPick - 0.2, tPlant + 0.02, { fade: 0.18 });
  const plantPose = (o) => { o.position.set(RB.SOCKET[0], top, RB.SOCKET[1]); o.rotation.set(0, PLANT_ROT, 0); };
  plantPose(tp); tp.set(1, 0); tp.updateMatrixWorld(true);
  const legPt = (k, y) => { const leg = tp.legs[k]; leg.updateWorldMatrix(true, false); const top0 = leg.position.clone(), d = V(0, -1, 0).applyQuaternion(leg.quaternion).multiplyScalar(leg.scale.y); return tp.localToWorld(top0.addScaledVector(d, (tp.H - y) / tp.H)); };
  const handsPlant = { R: hold(legPt(1, 34), tPlant - 0.04, 105.7, { fade: 0.12 }), L: hold(legPt(2, 28), tPlant - 0.04, tPlant + 0.32, { fade: 0.1 }) };   // her right hand stays on it (k08b)
  const PLATE_PT = V(RB.PLATE[0] - 4, top + 2.5, RB.PLATE[1] + 4), tReach = TB.pull - 0.26, tPull = TB.pull + 0.06;
  const toCap = onJoint(F.charlie, 'cap', [2, 3, 0], tReach, tPull + 0.06, { fade: 0.14 });
  const pl = place(PLATE_PT, tPull + 0.04, { tDown: TB.hatDrop, hold: 0.06 });
  function tripodAt(t) {
    if (t < tPick) { tp.position.set(RB.TRIPOD0[0], top, RB.TRIPOD0[1]); tp.rotation.set(0, 0.4, 0); tp.set(0.35, 0); return; }
    const s = jade.state(t); const yw = s.h + FP_YAW; const fw = V(Math.cos(yw), 0, Math.sin(yw)); const eye = F.jade.F.J.head.getWorldPosition(V(0, 0, 0)).add(V(0, 10, 0));
    const held = eye.clone().addScaledVector(fw, 22).add(V(0, -17 - (tp.H + 6.3), 0));
    const a = smooth(tPick, tPick + 0.25, t), b = smooth(tPlant - 0.2, tPlant, t);
    const p0 = V(RB.TRIPOD0[0], top, RB.TRIPOD0[1]), p2 = V(RB.SOCKET[0], top + 4 * (1 - smooth(tPlant - 0.03, tPlant + 0.02, t)), RB.SOCKET[1]);
    tp.position.copy(p0.lerp(held, a).lerp(p2, b)); tp.rotation.set(0, (-yw) * (1 - b) + PLANT_ROT * b + 0.4 * (1 - a), 0);
    const un = smooth(tPlant, tPlant + 0.16, t); tp.set(0.35 * (1 - a) + 0.12 * a * (1 - un) + un, 0);
  }

  return function frame(t) {
    F.jade.group.visible = F.charlie.group.visible = F.ricky.group.visible = true;
    F.jade.apply(jade, t, { layers: layers.jade, pencil: true });
    tripodAt(t);
    const jh = t < tPlant - 0.04 ? handsCarry : handsPlant;
    if (t >= tPick - 0.2 && t < 105.75) F.jade.apply(jade, t, { layers: layers.jade, pencil: true, hands: jh });
    F.charlie.apply(charlie, t, { layers: layers.charlie, hands: { R: t < tPull ? toCap : pl.spec } });
    F.ricky.apply(ricky, t, { layers: layers.ricky, hands: { R: plug.spec } });
    const st = { jade: jade.state(t), charlie: charlie.state(t), ricky: ricky.state(t) };
    // ---------------------------------------------------------------------------- room state
    for (const o of [X.amp, X.stack, X.plate, X.tripod, X.socket, X.recv, X.curtainG]) o.visible = true;
    const ampOn = t >= TB.amp + 0.04; const open = openAt(t); const lit = litAt(t);
    X.amp.userData.lensMat.color.set('#ff5fd2').multiplyScalar(ampOn ? 3 : 0.25);
    const held = plateHeld(charlie, t);
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
      const grow = clamp01((t - TB.amp) / 0.12);
      R.beams[0].visible = true; R.beams[0].set(pts, grow, { width: wk * (1 + 0.3 * T.pulse(t, [TB.amp, tPlant, tLit], 0.2) + 0.1 * Math.sin(t * 40)) });
      R.glowAt(0, lens0, fp ? 10 : 22, 1);
      if (end) R.glowAt(1, end, 30 + 8 * Math.sin(t * 30), 0.95);   // blocked: a splash on the stack / the closed curtain
      if (t >= tPlant) { cr.lit(fp ? 0 : 0.7, t); const c = cr.centre(); const gk = fp ? 0.3 : 1;   // first person: no crystal bloom (the plant read washed pink)
        R.glowAt(2, c.clone().addScaledVector(lens0.clone().sub(c).normalize(), 2.6), 7 * gk, 0.9); R.glowAt(5, c.clone().addScaledVector(recvC().sub(c).normalize(), 2.6), 7 * gk, 0.9); }
    }
    rc.lit(lit ? 1 : 0, t); if (lit) R.glowAt(4, recvC(), 30, 1);
    const toSock = V(RB.SOCKET[0] - RB.RECV[0], 0, RB.SOCKET[1] - RB.RECV[1]).normalize();
    rc.pulse(t - tLit, toSock, 0.7, 1.6); if (t > relitT) rc.pulse(t - relitT, toSock, 0.6, 1.3);
    // the pencil-stroke bridge (world props yiBridge, moved to this room's line; restored after render) draws while receiver 2 is lit
    P.yiBridge.visible = true; P.yiBridge.position.z = RB.BRIDGE.z; P.yiBridge.position.y = yiY0 + RB.BRIDGE.dy; P.yiBridge.rotation.z = RB.BRIDGE.tilt; P.yiBridge.scale.z = RB.BRIDGE.sz; P.yiBridge.hz.setProgress(0, bridgeAt(t));   // levelled: the 一 glyph rises ~10 to the right
    P.yiBridge.hz.setColour(clamp01((t - 105.85) / 0.9) * 1.05);
    // ---------------------------------------------------------------------------- the spare cap: out of his cap, onto the plate
    { const capB = X.cap2, cs = 1.0 * R.hs;
      if (t >= tPull - 0.02 && t < TB.hatDrop) { capB.visible = true; const h = F.charlie.hand('R'); const u = smooth(tPull - 0.02, tPull + 0.12, t); capB.scale.setScalar(cs * (0.5 + 0.5 * u)); capB.position.copy(h).add(V(0, -2, 0)); capB.rotation.set(0, -st.charlie.h, 0.2); }
      else if (t >= TB.hatDrop) { capB.visible = true; capB.scale.setScalar(cs); capB.position.copy(PLATE_PT); capB.rotation.set(0, 0.6, 0); } }
    // ---------------------------------------------------------------------------- the moth: drawn to the tripod -> receiver beam, bonks twice
    if (t >= 104.1 && t < 105.62) {
      const m = PB.bugs.moth; m.visible = true; const hs = R.hs; const a = cr.centre(), b = recvC();
      const k = 0.42 + 0.06 * Math.sin((t - 104) * 1.3); const onBeam = a.clone().lerp(b, k);
      let off = V(0, 9 * hs + 3 * Math.sin(t * 7), 7 * hs + 4 * Math.sin(t * 4.3)); let spin = 0;
      for (const tb of RB.MOTH) { const s = t - tb;
        if (s > -0.18 && s < 0) { const u = (s + 0.18) / 0.18; off.multiplyScalar(1 - 0.85 * u * u); }
        else if (s >= 0 && s < 0.4) { const u = s / 0.4; off = V(0, 9 * hs, 7 * hs).multiplyScalar(0.15 + 1.1 * Math.sin(Math.PI * Math.min(1, u * 1.4)) + 0.2 * u); off.y -= 6 * hs * Math.sin(Math.PI * u); spin = 7 * (1 - u) * Math.sin(u * 20); } }
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
      const camera0 = aim(persp('v2R4', aspect), cam.pos, cam.tgt, cam.fov);
      const sp = V(RB.SOCKET[0], top + 50, RB.SOCKET[1]).project(camera0);
      const snap = smooth(102.9, 103.0, t) * (1 - smooth(tPlant - 0.02, tPlant + 0.1, t));
      C.g.position.set(sp.x * snap, sp.y * snap, 0);
      C.ring.material.opacity = 0.75 * snap; const pop = T.pulse(t, [102.95], 0.12); C.ring.scale.set((1 + 0.6 * pop) / C.asp, 1 + 0.6 * pop, 1);
      C.dot.material.opacity = 0.95 * (1 - 0.6 * smooth(tPlant + 0.1, tPlant + 0.4, t));
      if (t < tPlant) R.glowAt(6, recvC(), 30, 0.55);   // receiver 2: a soft glow marks the target behind its curtain
    }
    const camera = aim(persp('v2R4', aspect), cam.pos, cam.tgt, cam.fov);
    const look = fp ? LOOK({ rays: 0.12, bloom: 0.35, bloomThr: 2.4, dofAmount: 0.04, k8SunAz: SUN_AZ_B }) : LOOK({ rays: 0.3, dofAmount: 0.18, k8SunAz: SUN_AZ_B });
    talosDump(t, { room: 'B', solids: { amp: X.amp, stack: X.stack, tripod: X.tripod, socket: X.socket, recv: X.recv, curtain: X.curtainG, plate: X.plate },
      heroes: { jade: F.jade, charlie: F.charlie, ricky: F.ricky }, states: st, supports: { bridge: P.yiBridge, plate: X.plate, socket: X.socket }, beams: { amp: R.beams[0], switch: P.beam }, camera });
    return { camera, target: cam.tgt, focus: cam.focus || cam.tgt, look, shadowExtent: 520, ui2d, fp };
  };

  function eyeRig(tt) {   // Jade's eyes (first person), a game view: her heading turned toward receiver 2, pitched down
    const J = F.jade.F.J; const s = jade.state(tt);
    const head = J.head.getWorldPosition(V(0, 0, 0)); const fw = V(Math.cos(s.h), 0, Math.sin(s.h));
    const eye = head.clone().addScaledVector(fw, 4).add(V(0, 10, 0));
    const u = tt - tPlant; eye.y -= 7 * (u < 0 ? 0 : u < 0.06 ? u / 0.06 : Math.exp(-(u - 0.06) / 0.12));   // the plant: a downward thunk
    const yaw = s.h + FP_YAW, pit = -30 * Math.PI / 180;
    let look = eye.clone().add(V(Math.cos(yaw) * Math.cos(pit), Math.sin(pit), Math.sin(yaw) * Math.cos(pit)).multiplyScalar(60));
    look.lerp(V(RB.SOCKET[0] + 10, top + 12, RB.SOCKET[1] - 4), 0.45 * smooth(tPlant - 0.1, tPlant + 0.05, tt) * (1 - smooth(tPlant + 0.28, tPlant + 0.58, tt)));   // down at the plant (the legs unfold)
    look.lerp(V(1072, 34, 424), smooth(tPlant + 0.25, tPlant + 0.7, tt));                // then across at receiver 2 + the bridge drawing
    return { pos: eye, tgt: look, fov: 70 };
  }
  function cameraB(t, st, TR) {
    if (t < SHOT_B[1]) {   // B1: the lock, wide from behind the trio: the stack takes the amp's shot, the curtain, receiver 2 dark
      const k = smooth(101.0, SHOT_B[1], t);
      return { pos: V(970 - 2 * k, 115 - 10 * k, 680 - 20 * k), tgt: V(1035, 10, 400), fov: 56, focus: V(960, 30, 490) };
    }
    if (t < SHOT_B[2]) { const e = eyeRig(t); return { ...e, fp: true }; }   // first person (hard cut on beat 245)
    // the k08b frame: 3/4 behind the three on the cliff edge (Charlie on the plate left, Ricky playing centre, Jade at the tripod
    // right), the beam to receiver 2 on the far right, the bridge drawing across; then a slow pan right with the crossing
    const k = smooth(SHOT_B[2], 107.15, t), pan = smooth(105.7, 107.1, t);
    return { pos: V(992 + 40 * pan, 75 - 3 * k + 12 * pan, 637 + 36 * pan), tgt: V(1010 + 100 * pan, 19 - 22 * pan, 325 + 110 * pan), fov: 44, focus: V(975 + 90 * pan, 30, 480 + 20 * pan) };   // the pan follows the crossing down onto the bridge
  }
}

// ================================================================================================================ ROOM 2
function buildRoom2(R, PB, W) {
  if (R.room2) return R.room2;
  const X = {}; const T = R2.TER; const top = R2.TOP;
  // the raised terrace (its top takes colour in Jade's wake)
  X.terMat = r4Stone('#efe3cc');
  X.terrace = R.add(R.box(T.x1 - T.x0, T.y - top, T.z1 - T.z0, X.terMat, (T.x0 + T.x1) / 2, (T.y + top) / 2, (T.z0 + T.z1) / 2));
  // Jade's vault block, Ricky's lift (a pad that rises; its pressure plate on top)
  X.block = R.add(R.box(14, 22, 24, R.stone, R2.BLOCK[0], top + 11, R2.BLOCK[1]));
  { const g = new THREE.Group(); g.add(R.box(32, 200, 32, R.stone, 0, -100, 0));
    const edgeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd27a'), toneMapped: false }); const plate = R.box(22, 1.6, 22, R.stone, 0, 0.8, 0); g.add(plate);
    for (const [x, z, w, d] of [[0, 12, 25, 1], [0, -12, 25, 1], [12, 0, 1, 25], [-12, 0, 1, 25]]) { const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, d), edgeMat); e.position.set(x, 0.5, z); g.add(e); }
    g.position.set(R2.LIFT[0], top, R2.LIFT[1]); g.userData = { plate, edgeMat }; X.lift = R.add(g); }
  R.room2 = X; return X;
}

const _bb = new THREE.Box3(), _fp = new THREE.Vector3();
function makeRoom2(ctx, W, R, PB, X) {
  const P = W.props; const F = R.figs; const aspect = ctx.width / ctx.height; const top = R2.TOP, TY = R2.TER.y, hs = R.hs;
  const { jade, charlie, ricky } = room2Tracks(R, { jade: F.jade.unit, charlie: F.charlie.unit, ricky: F.ricky.unit });
  for (const tr of [jade, charlie, ricky]) for (const w of tr.warnings || []) console.log('[engine] [talos_r4] room 2 motion warning: ' + w);
  const CH = R2.CH, BC = R2.BC;
  const vaultSeg = jade.segs.find((s) => s.kind === 'jump');
  const rj = ricky.segs.filter((s) => s.kind === 'jump'); const stompT = rj[0].touch, hopOff = rj[1];
  const tTake = hopOff.touch - 0.24;                                          // the hop-off's take-off (air 0.24)
  const rideOff = (t) => { if (t < stompT || t >= hopOff.touch) return 0; if (t < tTake) return liftY(t); return liftY(tTake) * (1 - clamp01((t - tTake) / 0.24)); };
  const liftNow = (t) => (t >= tTake ? liftY(Math.max(t, R2.RK.off + 0.05)) * (t < R2.RK.off + 0.05 ? 1 : 1) : liftY(t));
  const hatOff = (t) => t >= CH.throw - 0.15 && t < CH.caught;
  const layers = {
    jade: [],
    charlie: [{ anim: 'throw', t0: CH.throw - 0.2, t1: CH.hatDown + 0.05, mask: 'upper', p: (t) => clamp01((t - CH.throw + 0.2) / 0.3) }, { anim: 'throw', t0: CH.caught - 0.1, t1: CH.caught + 0.25, mask: 'arms', p: () => 0.25 }],
    ricky: [{ anim: 'chord', t0: 96.7, t1: BC.test[0] - 0.1, mask: 'armsHead', rate: 1 }],
  };
  // ladybug seat on Charlie's cap: the head joint + the cap's height (measured once)
  F.charlie.apply(charlie, 94.3, {}); const hb = new THREE.Box3().setFromObject(F.charlie.F.J.head); const capUp = hb.max.y - F.charlie.F.J.head.getWorldPosition(V(0, 0, 0)).y;
  const tree = W.avenue[TREE_HITS[1][1]]; const treeBox = new THREE.Box3().setFromObject(tree); const treeC = treeBox.getCenter(new THREE.Vector3());
  const treeR = Math.max(4, Math.min(treeBox.max.x - treeBox.min.x, treeBox.max.z - treeBox.min.z) / 2);
  const FF = [96.7, 98.25], GLITCH = [97.45, 97.55];
  const capRest = V(R2.CAPSPOT[0], top + 0.5, R2.CAPSPOT[1]);
  // the because gate on the terrace: b | e (toppled flat: the doorstep) | cause
  const EH = PB.letterE.userData.h, EW = PB.letterE.userData.w, ED = PB.letterE.userData.depth, GAP = EW / 2 + 8 * hs, GX = R2.GATE_X, GZ = R2.GZ;

  return function frame(t) {
    const hNH = hatOff(t); const ch = hNH ? F.charlieNH : F.charlie;
    F.jade.group.visible = ch.group.visible = F.ricky.group.visible = true;
    F.jade.apply(jade, t, { layers: layers.jade, pencil: true });
    ch.apply(charlie, t, { layers: layers.charlie });
    F.ricky.apply(ricky, t, { layers: layers.ricky });
    const st = { jade: jade.state(t), charlie: charlie.state(t), ricky: ricky.state(t) };
    // ground clamp (M5 collision check): a planted pose must not sink below the floor (turn steps / landings dipped 5-10 units)
    for (const [f, s] of [[F.jade, st.jade], [ch, st.charlie], [F.ricky, st.ricky]]) { if (s.air) continue; const g = groundR2(s.x, s.z, t); let y0 = Infinity;
      f.group.updateMatrixWorld(true); for (const sd of ['R', 'L']) { const ft = f.foot?.[sd]; if (!ft?.parent) continue; for (const q of [ft.heel, ft.toe]) y0 = Math.min(y0, _fp.copy(q).applyMatrix4(ft.parent.matrixWorld).y); }
      if (y0 < g - 0.5) { f.group.position.y += g - y0; f.group.updateMatrixWorld(true); } }
    // Jade's flip vault: one forward somersault about her hips through the air phase
    { const a0 = vaultSeg.touch - (R2.VAULT[1] - R2.VAULT[0]), u = clamp01((t - a0) / (vaultSeg.touch - a0));
      if (u > 0 && u < 1) { const g = F.jade.group; const h = st.jade.h; const ax = V(Math.sin(h), 0, -Math.cos(h)); const q = new THREE.Quaternion().setFromAxisAngle(ax, 2 * Math.PI * smooth(0.06, 0.94, u));
        const pv = V(0, 0.45 * 69, 0); g.position.add(pv.clone().sub(pv.clone().applyQuaternion(q))); g.quaternion.premultiply(q); g.updateMatrixWorld(true);
        const J = F.jade.F.J, D = Math.PI / 180; const tuck = Math.sin(Math.PI * u);
        J.hipR.rotation.set(0, 0, 95 * tuck * D); J.hipL.rotation.set(0, 0, 85 * tuck * D); J.kneeR.rotation.set(0, 0, -120 * tuck * D); J.kneeL.rotation.set(0, 0, -115 * tuck * D);
        J.shoulderR.rotation.set(0, 0, 60 * tuck * D); J.shoulderL.rotation.set(0, 0, 60 * tuck * D); } }
    // Ricky rides the lift
    // ---------------------------------------------------------------------------- room
    for (const o of [X.terrace, X.block, X.lift]) o.visible = true;
    X.lift.position.y = top + liftY(t);   // Ricky's feet ride it through the track's ground(x, z, t)
    const pressed = t >= stompT && t < tTake; X.lift.userData.plate.position.y = pressed ? 0.3 : 0.8; X.lift.userData.edgeMat.color.set(pressed ? '#ffe7a8' : '#5a5048').multiplyScalar(pressed ? 3 : 1);
    // colour path along Jade's lane on the terrace top (+ the flowers on the mesa blossom)
    const jx = Math.min(GX + 40, st.jade.x); if (jx > R2.TER.x0) X.terMat.userData.lp?.capsule(V(R2.TER.x0, TY, R2.LANE.jade), V(jx + 8, TY, R2.LANE.jade), 22).edge(16);
    P.flowers.visible = true; P.flowers.update((it) => clamp01((t - (CUE.v2 + 0.05 + Math.max(0, it.x - 588) / 62 + Math.abs(it.z - 348) / 170)) / 0.45), t);
    // because
    for (const o of [PB.letterB, PB.letterE, PB.letterCause, PB.crumbs]) o.visible = true;
    PB.letterB.position.set(GX, TY, GZ - GAP - PB.letterB.userData.w / 2); PB.letterB.rotation.set(0, -Math.PI / 2, 0);
    PB.letterCause.position.set(GX, TY, GZ + GAP + PB.letterCause.userData.w / 2); PB.letterCause.rotation.set(0, -Math.PI / 2, 0);
    PB.letterE.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, 1), V(1, 0, 0), V(0, 1, 0))); PB.letterE.position.set(GX - EH / 2, TY + ED / 2, GZ);
    PB.crumbs.position.set(GX - ED / 2 - 16 * hs, TY, PB.letterB.position.z + PB.letterB.userData.bite.x);
    // Ricky's foot test on the doorstep e (two taps), arms out for balance
    if (t >= BC.test[0] && t < BC.step) { const J = F.ricky.F.J, D = Math.PI / 180; const tap = Math.abs(Math.sin(Math.PI * 2 * clamp01((t - BC.test[0]) / (BC.test[1] - BC.test[0]))));
      J.hipR.rotation.set(0, 0, (38 + 10 * tap) * D); J.kneeR.rotation.set(0, 0, (-14 - 18 * tap) * D); J.shoulderL.rotation.set(30 * D, 0, 70 * D); }
    // the cap: thrown down at the terrace wall, the trampoline, flies back to his hand; later held ready by the e
    const cap = PB.cap; const cs = 1.15 * hs;
    if (t >= CH.throw - 0.15 && t < CH.hatDown) { cap.visible = true; const h = F.charlieNH.hand('R'); const u = clamp01((t - CH.throw) / (CH.hatDown - CH.throw)); cap.position.copy(h).lerp(capRest, u); cap.position.y += 6 * Math.sin(Math.PI * u); cap.scale.setScalar(cs * 1.3); cap.rotation.set(0, -0.4, 0); }
    else if (t >= CH.hatDown && t < CH.boing + 0.08) { cap.visible = true; cap.position.copy(capRest); cap.scale.setScalar(cs * 1.3); cap.scale.y *= 1 - 0.5 * T.pulse(t, [CH.on, CH.boing], 0.12); cap.rotation.set(0, -0.4, 0); }
    else if (t >= CH.boing + 0.08 && t < CH.caught) { cap.visible = true; const u = clamp01((t - CH.boing - 0.08) / (CH.caught - CH.boing - 0.08)); const h = F.charlieNH.hand('R'); cap.position.copy(capRest).lerp(h, u); cap.position.y += 34 * Math.sin(Math.PI * u); cap.scale.setScalar(cs * 1.3); cap.rotation.set(0.4, t * 12, 0); }
    // the ladybug rides the cap (on his head / the trampoline)
    { const lb = PB.bugs.ladybug; lb.visible = true; const p = cap.visible ? cap.position.clone().add(V(0, 5 * hs, 0)) : F.charlie.F.J.head.getWorldPosition(V(0, 0, 0)).add(V(0, capUp - 0.6 * hs, 0));
      lb.position.copy(p); lb.rotation.set(0, 0.4 + 0.3 * Math.sin(t * 1.7), 0); lb.set({ anim: 'idle', t, stance: 'crawl' }); if (cap.visible && t >= CH.on && t < CH.land) lb.position.y += 4 * hs * Math.abs(Math.sin((t - CH.on) * 18)); }
    // the beetle circles past Ricky's lift (the infinite loop)
    if (t >= 95.84 && t < 97.07) { const bb = PB.bugs.beetle; bb.visible = true; bb.position.set(676 + 22 * (t - 95.84), TY, 412); bb.rotation.set(0, 0, 0); bb.set({ anim: 'bug', t, beat: T.beatAt(t) * 1.5, ringR: 26, stance: 'crawl' }); }
    // the firefly on the cypress Jade coloured at 82.93; the colour glitches to the checkerboard for 3 frames
    if (t >= FF[0] && t < FF[1]) {
      const ff = PB.bugs.firefly; ff.visible = true; const u = (t - FF[0]) / (FF[1] - FF[0]);
      const y = treeBox.min.y + (0.35 + 0.2 * u) * (treeBox.max.y - treeBox.min.y); const rr = treeR * (1 - 0.35 * ((y - treeBox.min.y) / (treeBox.max.y - treeBox.min.y))) + 1.5; const ang = 0.9 + 0.6 * u;
      ff.position.set(treeC.x + rr * Math.cos(ang) * 0.6, y, treeC.z + rr * Math.sin(ang)); ff.rotation.set(0, -ang + Math.PI / 2, 0.9); const gl = t >= GLITCH[0] && t < GLITCH[1];
      ff.set({ anim: 'bug', t, glow: gl ? 1 : t > 97.7 ? 0.9 : 0.1 }); if (gl) PB.glitchOn(tree, ff.position, 16 * hs);
    }
    P.burst.visible = true;
    P.burst.run(t, [{ t0: vaultSeg.touch, x: 674, y: TY, z: R2.LANE.jade, n: 10, speed: 40, up: 18, g: 150, dur: 0.5, seed: 11, size: 1.3 },
      { t0: stompT, x: R2.LIFT[0], y: top + 1, z: R2.LIFT[1], n: 22, speed: 70, up: 25, g: 180, dur: 0.6, seed: 12, size: 1.8 },
      { t0: hopOff.touch, x: 672, y: TY, z: R2.LANE.ricky, n: 16, speed: 55, up: 20, g: 180, dur: 0.6, seed: 13, size: 1.6 },
      { t0: CH.land, x: 680, y: TY, z: R2.LANE.charlie, n: 10, speed: 40, up: 18, g: 150, dur: 0.5, seed: 14, size: 1.3 }]);
    // ---------------------------------------------------------------------------- cameras (cuts on beats 230 / 234)
    let pos, tgt, fov = 50, focus;
    if (t < 96.659) {          // C1: the climb, from the south-west: vault, bounce, Ricky's lift
      const k = smooth(94.204, 96.659, t); pos = V(574 + 60 * k, 74, 476); tgt = V(650 + 40 * k, 46, 340); focus = V(640 + 40 * k, 34, 352); fov = 54;
    } else if (t < 98.292) {   // C2: cutaway: the cypress Jade coloured at 82.93, a firefly on it (the glitch)
      const k = smooth(96.659, 98.292, t); const fy = PB.bugs.firefly.position.y || treeC.y;
      pos = V(treeC.x + 50 - 8 * k, fy + 14, treeC.z + 120 - 10 * k); tgt = V(treeC.x, fy + 4, treeC.z); fov = 36; focus = V(treeC.x, fy, treeC.z + treeR);
    } else {                   // C3: crane along the terrace to the because gate; Ricky tests the e
      // C3: from the west along the terrace (the letters face west: b | e | cause read left to right), easing in for Ricky's foot test
      const k = smooth(98.292, 100.4, t);
      pos = V(640 + 70 * k, 128 - 30 * k, 452 - 30 * k); tgt = V(GX - 10, TY + 58 - 16 * k, GZ + 6); focus = V(GX - 40, TY + 20, GZ); fov = 48 - 4 * k;
    }
    const camera = aim(persp('v2R4_2', aspect), pos, tgt, fov);
    talosDump(t, { room: '2', solids: { terrace: X.terrace, block: X.block, lift: X.lift }, heroes: { jade: F.jade, charlie: ch, ricky: F.ricky }, states: st, supports: { terrace: X.terrace, lift: X.lift, block: X.block, because: P.because }, beams: { b0: R.beams[0], b1: R.beams[1] }, camera });
    return { camera, target: tgt, focus: focus || tgt, look: LOOK({ rays: 0.3, dofAmount: 0.2 }), shadowExtent: 450 };
  };
}
