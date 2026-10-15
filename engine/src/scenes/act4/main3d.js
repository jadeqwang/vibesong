// ACT IV · THE ERASER (123.354 – 173.02): the 3D timeline. One scene entry; the PAPER placeholder slots and the
// recap montage are separate entries layered on top (cut). Every value below is a pure function of song time t.
//
//  BRIDGE (stripped, half-time, dusk)
//   123.354  dusk over the colour-flooded world; the Eraser rises out of the sea on the horizon, mountain-sized
//   124.525  drums out: it rubs. Colour drains back toward the party, then the erase front sweeps the geometry away
//   125.769  (accent) the world is blank paper; the three stand in it.          [PAPER slots 125.769 – 129.385]
//   129.385  drums back (half-time): the erased page: white rub trails on the paper, graphite stroke shards floating
//            everywhere. Jade holds her pencil out at arm's length (the painter's gesture)
//   130.585  Ricky's sustained note becomes a sound-wave bridge spiralling up toward a floating 丶 (the vantage)
//   133.105  triplet roll: Charlie runs up first, flips his hat into a trampoline at the end of the (too short) bridge;
//            Jade climbs on the triplets; 135.0 / 135.405 / 135.81 bounce, apex, land on the vantage
//  FINAL CHORUS
//   136.212  Jade at the vantage, eye-level with the chaos
//   137.030  (band cut, measured) the camera starts its move into Jade's eye; shards drift toward alignment
//   138.595  (lone hit, measured) the top 一 snaps into place
//   138.9    second stop: almost
//   139.395  SLAM (measured): the camera is exactly at E -> the shards and the Eraser's white trails ARE 画.
//            It ignites in coloured pencil; colour + the world pour back out of it
//   141.4    the Eraser stops and looks at it
//   143.48   Jade climbs down, walks to the Eraser, colours it in with the every-colour pencil -> pink, smiling
//   149.22   the rebuilt world: the pink Eraser cleans up, bug-features help build
//   154.26   gang vocals, wide: heroes + pink Eraser + firefly-lamps, beetle-wheels, moth-gliders
//   160.83   16th snare roll: everyone grabs on (they hop onto the Eraser)
//  FINAL BUILD
//   161.728  riding the Eraser down the causeway while 出发 draws itself ahead, stroke by stroke on the beat
//   165.87   一切从这里出发!  (accent 166.275) they launch off and run the gate           [montage 168.075 – 172.795]
//   172.795  一笔一画!  tight on Jade's pencil tip; hand-off to Team D at the last hit 173.02
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { loadFonts } from '../../core/text.js';
import { LOOK as TALOS_LOOK, CRISP, SmoothSubs } from '../act3/common.js';
import { FLOOD, FEATURE_T } from '../act3/rap.js';
import { subtitleFor } from '../../core/ui.js';
import { envUniforms } from '../../env.js';
import { getWorld, V, F, RT, E, J, SPIRAL, GROUND, GY, PAPER_Y, SUN, SUN_DAY, at, yawFor, spiralPoint, placeHero, paint } from './world4.js';
import { Overlay } from './overlay.js';

const C = (k) => T.cue('act4.' + k);
const sm = (a, b, x) => { const u = T.clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const lerpV = (a, b, u) => a.clone().lerp(b, u);
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Act IV's base look = the shared TALOS look (Team B's CRISP golden hour: half haze, deeper AO, warm key / cool shadows,
// contrast 1.13), with Act IV's own exposure / AO / DOF per phase; atmos values below are multiplied by CRISP.atmos
export const LOOK = { flat: 0, light: 1, shadow: 1, tone: 1, palette: 0, pix: 1, outline: 0, bloom: 1, dof: 0, grade: 1, rays: 0.35, ao: 0.5, exposure: 0.58, ...CRISP, atmos: CRISP.atmos };

export async function setup(ctx) {
  await loadFonts(['kai', 'sans']);
  const Wd = await getWorld(ctx);
  const { W, heroes, field, PG, eraser, spiral, tramp, pencil, bugs, lampLights, gate, gateGroup, sea, baseObjs, cams, ERASE, root } = Wd;
  const cam = cams.main;
  const ov = new Overlay(ctx);
  const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };

  // ---------------------------------------------------------------- cue table (measured, data/cues.json act4)
  const K = {
    start: C('bridge_start'), dOut: C('drums_out'), acc: C('bridge_accent'), dBack: C('drums_back'), ht: C('halftime_hits'),
    trip: C('triplet_roll'), steps: C('climb_steps'), fc: C('final_chorus'), stop: C('band_stop'), lone: C('lone_hit'), stop2: C('stop2'), slam: C('slam'),
    roll: C('snare_roll'), build: C('build'), chufa: C('chufa'), chufaAcc: C('chufa_accent'), eights: C('eights'), yibi: C('yibi'), yibiW: C('yibi_words'), last: C('last_hit'), pshot: C('pencil_shot'),
    need: T.word(39, 9).start, lookAt: 141.4, down: T.line(39).start, rebuilt: T.line(40).start, gang: T.line(41).start,
  };
  // anchors in Team B's shared world (WORLD_API.md): +x forward, the sun ahead at +x, mesa B = the stage (top GY)
  const EB = V(1250, 0, -9000);                                // the dusk Eraser's base, beyond the hills behind the stage
  const RC = at(E, 260, 0).setY(GY);                           // the glyph's nearest ground stroke (colour-return centre)
  const EP1 = at(E, 1350, 760).setY(GY);                       // the Eraser resting on the page, right of the 画
  const EP2 = at(J, 250, -80).setY(GY);                        // where Jade meets it (on mesa B once the world is back)
  const STAGE = V(1330, GY, 450);                              // the gang on mesa B's stage (rebuilt world)
  const ERS = STAGE.clone().add(V(-50, 0, -80));               // the pink Eraser behind them
  const G0 = V(1505, GY, 450);                                 // the 出发 gate on mesa B's sea end
  // the band + bug-features exactly as Act III leaves them at 123.354 (src/scenes/act3/rap.js BAND / BUGP)
  const BAND = { jade: V(1378, GY, 454), charlie: V(1402, GY, 442), ricky: V(1424, GY, 460) };
  const BUGP = { ladybug: V(1330, GY, 458), beetle: V(1306, GY, 446), moth: V(1318, GY + 22, 436), caterpillar: V(1280, GY, 462), firefly: V(1292, GY + 28, 470) };
  const HANDOVER_CAM = { pos: V(1380, 52, 610), tgt: V(1350, GY + 26, 430), fov: 52 };   // rap.js camera at 123.354

  // ---------------------------------------------------------------- world state (pure in t)
  function worldState(t) {
    const pre = t < K.acc, erased = t >= K.acc && t < K.slam, pour = t >= K.slam && t < K.rebuilt, rebuilt = t >= K.rebuilt;   // the world itself returns at 149.22 ("the rebuilt world")
    // 1) colour drains back toward the party, 2) the rub spreads out from the Eraser on the horizon across the world
    //    (a radial front centred on its base), leaving blank paper + the white rub trails behind it
    const drain = sm(K.dOut, K.dOut + 0.7, t);
    const rub = T.ease.in(T.clamp01((t - (K.dOut + 0.35)) / (K.acc - K.dOut - 0.35)));
    const eraseR = pre ? (t >= K.dOut + 0.35 ? T.lerp(300, 11500, rub) : -1) : 1e9;
    ERASE.uEC.value.copy(EB); ERASE.uER.value = eraseR;
    ERASE.uRC.value.copy(RC); ERASE.uRR.value = rebuilt ? 1e9 : -1;
    for (const o of baseObjs) o.visible = pre || rebuilt;
    if (sea) sea.visible = pre || rebuilt;
    // paint: full colour -> drained -> (paper only while the colour pours) -> the rebuilt world in full colour
    if (pre) paint(FLOOD.c, T.lerp(40000, -1, Math.pow(drain, 0.6)), 300);
    else paint(RC, rebuilt ? 1e6 : -1, 240);
    // paper ground: visible where erased; after the cut at 143.48 only the rub trails stay (as rainbow ribbons)
    Wd.ground.position.y = PAPER_Y;
    const P = PG; P.uEraseC.value.copy(EB); P.uEraseR.value = eraseR; P.uPaperVis.value = rebuilt ? 0 : 1;
    P.uRestC.value.copy(RC); P.uRestR.value = rebuilt ? 1e9 : -1;
    P.uTrail.value = 1;
    P.uTrailIgnite.value = sm(K.slam, K.slam + 0.9, t);
    // the colour return: a coloured-pencil hatching wavefront racing out from the glyph over the page
    P.uColC.value.copy(RC); P.uColR.value = pour ? 5600 * Math.pow(T.clamp01((t - K.slam) / 4.0), 1.6) + Math.max(0, t - K.slam - 4.0) * 2500 : -1;
    const restR = -1;
    // glyph field: chaos -> lock -> ignite
    field.group.visible = !pre && t < K.build;
    const U = field.U; U.uTime.value = t; U.uIgnite.value = T.clamp01((t - K.slam) / 0.85); U.uIgniteT.value = t;
    U.uGlow.value = T.pulse(t, [K.slam], 0.6) + 0.3 * T.pulse(t, [K.lone], 0.3);
    const lockU = T.clamp01((t - K.stop) / (K.stop2 - K.stop));
    field.pose({
      t, drift: t < K.stop ? 26 : 26 * (1 - lockU),
      chaosOf: (Fr) => {
        if (t >= K.slam) return 0;
        if (t < K.stop) return 1;
        if (Fr.stroke === 0 && t >= T.snap(K.lone)) return 0;                     // the lone hit: 一 snaps home
        const own = T.clamp01((t - K.stop - Fr.order * 0.5) / (K.stop2 - K.stop - 0.4));
        const c = 1 - T.ease.inOut(own);
        return Math.max(c, t >= K.stop2 ? 0.06 * (1 + 0.5 * Math.sin(t * 9 + Fr.phase)) : 0);   // "almost"
      },
    });
    // spiral
    spiral.visible = t >= K.ht[1] - 0.05 && t < K.down + 1.5;
    const SU = spiral.userData.U; SU.uProg.value = T.ease.out(T.clamp01((t - K.ht[1]) / (K.ht[3] - K.ht[1] + 0.1))); SU.uT.value = t;
    SU.uAmp.value = 0.7 + 0.5 * T.beatPulse(t, 2, 0.12);
    Wd.vantage.visible = !pre && t < K.rebuilt;
    return { pre, erased, rest: !pre && !erased, restR, pour };
  }

  // ---------------------------------------------------------------- the Eraser
  function eraserState(t) {
    let pos, sc, st = { face: 'grumpy', pink: 0 };
    const blink = (k) => (Math.abs(((t * 0.31 + k) % 1)) < 0.035 ? 1 : 0);
    if (t < K.acc) {
      // rising out of the sea on the horizon, then scrubbing (side to side)
      // mountain-sized, half-sunk below the horizon, rising; then scrubbing the page
      sc = 3800; pos = EB.clone(); pos.y = T.lerp(-6500, -2600, T.ease.out(T.clamp01((t - (K.start + 0.25)) / 1.3)));
      const scrub = t >= K.dOut ? Math.sin((t - K.dOut) * Math.PI * 2 * 1.4) * 0.11 : 0;
      st = { face: 'grumpy', scrub, lean: scrub * 0.6 + 0.05 * T.clamp01((t - K.dOut) * 3), blink: blink(0.2) };
    } else if (t < K.lookAt) {
      pos = EP1.clone(); sc = 290; st = { face: 'grumpy', blink: blink(0.6), squash: 0.012 * Math.sin(t * 1.7) };
      if (t >= K.slam) st.face = 'look';
    } else if (t < K.rebuilt) {
      pos = EP2.clone(); sc = 200;
      const pinkU = T.clamp01((t - T.word(39, 6).start) / (K.need - T.word(39, 6).start));
      // 141.4: it stops and looks: breathing, a slow blink on the beat, a small lean toward the glyph
      const blinkAt = [T.nearestBeat(142.3), T.nearestBeat(143.2)];
      const lookBlink = blinkAt.some((b) => t >= b && t < b + 0.13) ? 1 : 0;
      st = { pink: pinkU, face: t >= K.need ? 'happy' : 'look', blink: t < K.need ? Math.max(lookBlink, t > K.down ? blink(0.1) : 0) : 0,
        squash: t >= K.need ? 0.08 * Math.exp(-(t - K.need) * 5) * Math.cos((t - K.need) * 30) : 0.018 * Math.sin((t - K.lookAt) * 2.6),
        lean: t < K.down ? -0.05 * T.ease.inOut(T.span(t, K.lookAt, K.lookAt + 1.2)) : 0, wave: t >= K.need ? Math.sin(t * 8) : 0 };
    } else {
      pos = t >= K.build ? ridePos(t) : ERS.clone(); sc = 62; const b = T.beatPulse(t, 1, 0.09);
      const sing = t >= K.gang && t < K.roll[0];
      st = { pink: 1, face: sing ? (Math.floor(T.beatAt(t) * 2) % 2 ? 'sing' : 'happy') : 'happy', squash: 0.06 * b, wave: Math.sin(t * 6), blink: 0 };
    }
    eraser.position.copy(pos); eraser.scale.setScalar(sc);
    const d = E.clone().sub(pos); if (t >= K.rebuilt) d.copy(V(0, 0, 1));
    eraser.rotation.set(0, Math.atan2(d.x, d.z), 0);
    eraser.set(st);
    return { pos, sc };
  }

  // ---------------------------------------------------------------- the hand-over: Act III's last frame, continued
  // (the band, the bug-features and the rap set exactly where src/scenes/act3/rap.js leaves them at 123.354)
  function handoverState(t) {
    const P = W.props, bp = T.beatPulse(t, 1, 0.1);
    for (const n of ['jade', 'charlie', 'ricky']) { const p = BAND[n];
      W.put(W.heroes[n], { x: p.x, y: p.y + 3 * bp, z: p.z, anim: n === 'jade' ? 'sing' : n === 'ricky' ? 'sustain' : 'idle', frame: n === 'jade' ? Math.floor(T.beatAt(t) * 2) % 2 : null, t, pencil: n === 'jade', rotY: 0, facing: -1 }); }
    for (const b of ['ladybug', 'beetle', 'moth', 'caterpillar', 'firefly']) {
      const g = W.bugs[b], p = BUGP[b], k = t - FEATURE_T[b]; const s = { x: p.x, y: GY, z: p.z, anim: 'feature', t, rotY: 0, facing: 1 };
      if (b === 'beetle') s.x = p.x - 40 * Math.min(1, k / 1.2);
      if (b === 'moth') { const a = k * 1.6; s.x = 1320 + 40 * Math.cos(a); s.z = 440 + 20 * Math.sin(a); s.y = GY + 46 + 6 * Math.sin(a * 2); s.facing = Math.sin(a) > 0 ? -1 : 1; }
      W.put(g, s); g.scale.set(Math.sign(g.scale.x) || 1, 1, 1);   // as rap.js now does: facing mirrors X only (pop = 1 by now)
    }
    P.books.forEach((b, i) => { b.visible = true; b.position.set(1130 + i * 52, GY, 302); b.rotation.set(0, 0, -(i === P.books.length - 1 ? Math.PI / 2 : Math.PI / 2 - 0.35)); });
    P.monolith.visible = true; P.monolith.position.set(1532, GY, 375); P.monolith.rotation.y = Math.PI * 1.12; P.monolith.userData.draw('一句话', false, 0.3);
    P.pencil.visible = true; P.pencil.position.set(FLOOD.c.x, GY - 6, FLOOD.c.z); P.pencil.rotation.set(0, 0, -0.08);
  }

  // ---------------------------------------------------------------- heroes
  const triplets = T.beatsIn(K.trip[0] - 0.01, K.trip[1] + 0.05, 3);
  function heroState(t) {
    const H = heroes; for (const h of Object.values(H)) h.visible = false;
    tramp.visible = false; pencil.visible = false;
    const fwd = F.clone();
    if (t < K.acc) { handoverState(t); return; }
    if (t < K.slam + 4.0 && t < K.down) {
      // ---------------- Ricky: sustain at the spiral base from the 2nd half-time hit
      const rp = at(spiralPoint(0), -14, 12).setY(GY);
      if (t >= K.ht[1]) placeHero(H.ricky, rp, F.clone().negate().addScaledVector(RT, 0.2), { anim: 'sustain', t, pencil: false });
      else placeHero(H.ricky, GROUND.ricky, fwd, { anim: 'idle', t: t + 0.5, pencil: false });
      // ---------------- Charlie: up the spiral first (132.2 -> 134.35), hat trampoline at the end
      const cT0 = K.ht[2] + 0.4, cT1 = K.trip[0] + 1.2;
      if (t < cT0) placeHero(H.charlie, GROUND.charlie, fwd, { anim: 'idle', t: t + 0.2, pencil: false });
      else {
        const u = T.clamp01((t - cT0) / (cT1 - cT0)) * 0.9;
        const p = spiralPoint(u, 3), p2 = spiralPoint(Math.min(1, u + 0.01), 3);
        const dir = p2.clone().sub(p).setY(0).normalize();
        if (t < cT1) placeHero(H.charlie, p, dir, { anim: 'run', t, pencil: false });
        else if (t < K.steps[0] - 0.05) placeHero(H.charlie, p, dir, { anim: 'throw', t: t - cT1, pencil: false });
        else placeHero(H.charlie, p, fwd, { anim: 'idle', t, pencil: false });
      }
      // trampoline (hat) at the end of the bridge
      const tp = spiralPoint(0.985); const tIn = cT1 + 0.25;
      if (t >= tIn) {
        tramp.visible = true; tramp.position.copy(tp).add(V(0, 0.5, 0)); tramp.rotation.set(0, yawFor(fwd), 0);
        const s0 = K.steps[0]; tramp.set({ anim: 'rest', frame: t >= s0 && t < s0 + 0.1 ? 1 : t >= s0 + 0.1 && t < s0 + 0.24 ? 2 : 0 });
        tramp.scale.setScalar(T.clamp01((t - tIn) / 0.12) * 0.9);
      }
      // ---------------- Jade
      if (t < K.ht[2]) placeHero(H.jade, GROUND.jade, fwd, { anim: 'draw_graphite', frame: 0, pencil: true });      // painter's gesture
      else if (t < K.trip[0]) {
        const u = T.ease.inOut(T.clamp01((t - K.ht[2]) / (K.trip[0] - K.ht[2])));
        const p = lerpV(GROUND.jade, spiralPoint(0, -2), u); const d = spiralPoint(0).sub(GROUND.jade).setY(0).normalize();
        placeHero(H.jade, p, u < 1 ? d : fwd, { anim: 'run', t, pencil: true });
      } else if (t < K.steps[0]) {
        // up the spiral on the triplets: one stride per triplet 8th
        let k = 0; for (const x of triplets) if (t >= T.snap(x)) k++;
        const n = triplets.filter((x) => x < K.steps[0]).length;
        const u = T.clamp01((k + T.clamp01((t - T.snap(triplets[Math.max(0, k - 1)] || t)) / 0.13)) / (n + 1)) * 0.975;
        const p = spiralPoint(u, -2), p2 = spiralPoint(Math.min(1, u + 0.01), -2);
        placeHero(H.jade, p, p2.clone().sub(p).setY(0).normalize(), { anim: 'run', frame: k % 2, pencil: true });
      } else if (t < K.steps[2]) {
        // bounce (135.0) -> apex (135.405) -> land on the vantage (135.81)
        const a = spiralPoint(0.985).add(V(0, 2, 0)), b = J.clone(); const u = (t - K.steps[0]) / (K.steps[2] - K.steps[0]);
        const p = lerpV(a, b, u); p.y += 4 * 30 * u * (1 - u);
        placeHero(H.jade, p, fwd, { anim: 'jump', t: u < 0.5 ? 0 : 1, frame: u < 0.5 ? 0 : 1, pencil: true });
      } else {
        const hideAtEye = t > K.stop2 - 0.2 && t < K.slam + 2.0;  // the camera IS her eye
        placeHero(H.jade, J, fwd, { anim: 'draw_graphite', frame: 0, pencil: true });
        H.jade.visible = !hideAtEye;
      }
      return;
    }
    if (t < K.rebuilt) {
      // ---------------- climb down, walk to the Eraser, colour it in
      const ep = EP2; const meet = at(ep, 0, 0); const toE = ep.clone().sub(J).setY(0).normalize();
      const stand = ep.clone().addScaledVector(toE, -150); stand.y = GY;
      const tJ = K.down, tL = K.down + 0.55, tW = T.word(39, 6).start - 0.15;
      if (t < tL) { const u = (t - tJ) / (tL - tJ); const p = lerpV(J, at(J, 30, 25).setY(GY), u); p.y += 60 * u * (1 - u); placeHero(H.jade, p, toE, { anim: 'jump', frame: u < 0.5 ? 0 : 1, pencil: true }); }
      else if (t < tW) { const u = T.ease.inOut(T.clamp01((t - tL) / (tW - tL))); placeHero(H.jade, lerpV(at(J, 30, 25).setY(GY), stand, u), toE, { anim: 'run', t, pencil: true }); }
      else placeHero(H.jade, stand, toE, { anim: 'draw_rainbow', frame: 0, pencil: true });
      void meet;
      const sideC = V(-toE.z, 0, toE.x); const rp = stand.clone().addScaledVector(toE, -95).addScaledVector(sideC, -75); const cp = stand.clone().addScaledVector(toE, -70).addScaledVector(sideC, -38);
      placeHero(H.ricky, rp, toE, { anim: t > K.need ? 'victory' : 'idle', t, pencil: false });
      placeHero(H.charlie, cp, toE, { anim: 'idle', t: t + 0.4, pencil: false });
      return;
    }
    // ---------------- rebuilt world, gang vocals, roll, ride, gate
    const toCam = V(0, 0, 1);
    const b = T.beatPulse(t, 1, 0.1);
    if (t < K.roll[0]) {
      const sing = t >= K.gang;
      const hop = sing ? 3 * b : 0;
      placeHero(H.charlie, at(STAGE, 0, 0).add(V(-40, hop, 6)), V(1, 0, 0.6), { anim: sing ? 'idle' : 'pull', t: t - K.rebuilt, pencil: false });
      placeHero(H.jade, at(STAGE, 0, 0).add(V(0, hop, 10)), V(1, 0, 0.9), { anim: sing ? 'sing' : 'draw_graphite', t, frame: sing ? Math.floor(T.beatAt(t)) % 2 : 0, pencil: true });
      placeHero(H.ricky, at(STAGE, 0, 0).add(V(42, hop, 4)), V(-1, 0, 0.6), { anim: sing ? 'chord' : 'idle', t, frame: sing ? Math.floor(T.beatAt(t) * 2) % 2 : undefined, pencil: false });
      for (const h of Object.values(H)) h.rotation.y = yawFor(h === H.ricky ? V(-1, 0, 0.6) : V(1, 0, 0.7));
      return;
    }
    if (t < K.build) {
      // grab on: hop up onto the Eraser (16th roll)
      const u = T.ease.out(T.clamp01((t - K.roll[0]) / (K.roll[1] - K.roll[0])));
      const top = ERS.clone().add(V(0, 62 * 1.6 * (1 - 0.06 * T.beatPulse(t, 4, 0.05)), 0));
      const sp = [V(-18, 0, 4), V(0, 0, 8), V(18, 0, 4)];
      ['charlie', 'jade', 'ricky'].forEach((k, i) => {
        const from = at(STAGE, 0, 0).add(V([-40, 0, 42][i], 0, [6, 10, 4][i])); const to = top.clone().add(sp[i]);
        const p = lerpV(from, to, u); p.y += 50 * u * (1 - u);
        placeHero(H[k], p, toCam, { anim: u < 1 ? 'jump' : (k === 'jade' ? 'sing' : 'idle'), frame: u < 0.5 ? 0 : 1, t, pencil: k === 'jade' });
      });
      return;
    }
    // ride toward the gate (eraser slides along the causeway), launch off at 165.87, run through
    const rp = ridePos(t);
    const top = rp.clone().add(V(0, 62 * 1.6, 0));
    if (t < K.chufa) {
      const sp = [V(4, 0, -16), V(-4, 0, 0), V(4, 0, 16)];
      ['charlie', 'jade', 'ricky'].forEach((k, i) => placeHero(H[k], top.clone().add(sp[i]).add(V(0, 2 * T.beatPulse(t, 2, 0.06), 0)), V(1, 0, 0), { anim: k === 'jade' ? 'run' : 'idle', t, frame: k === 'jade' ? 0 : undefined, pencil: k === 'jade' }));
    } else {
      const u = T.clamp01((t - K.chufa) / (K.chufaAcc - K.chufa));
      ['charlie', 'jade', 'ricky'].forEach((k, i) => {
        const z = [-46, 0, 46][i]; const from = top.clone().add(V(0, 0, z * 0.4));
        const land = G0.clone().add(V(-50, 0, z * 0.8));
        let p;
        if (u < 1) { p = lerpV(from, land, u); p.y += 40 * u * (1 - u); }
        else { p = runnerAt(t, z * 0.8); }
        placeHero(H[k], p, V(1, 0, 0), { anim: u < 1 ? 'jump' : 'run', frame: u < 1 ? (u < 0.5 ? 0 : 1) : undefined, t, pencil: k === 'jade' });
      });
    }
  }
  // the ride: the pink Eraser slides across the stage toward the gate drawing itself; after 出发 they run it and
  // launch off mesa B's sea edge (x 1560) into the sky (the hand-off to Drop 2)
  const ridePos = (t) => { const u = T.ease.inOut(T.clamp01((t - K.build) / (K.chufa - K.build)));
    return V(T.lerp(ERS.x, G0.x - 120, u) + (t > K.chufa ? (t - K.chufa) * 40 : 0), GY, T.lerp(ERS.z, G0.z, T.ease.inOut(T.clamp01((t - K.build) / 1.6)))); };
  const runnerAt = (t, dz) => { const x = G0.x - 50 + Math.max(0, t - K.chufaAcc) * 150; const over = Math.max(0, x - 1552);
    return V(x, GY + over * 0.55 + 22 * (1 - Math.exp(-over / 40)), G0.z + dz); };

  // ---------------------------------------------------------------- bug features
  function bugState(t) {
    for (const b of bugs) b.visible = false; for (const l of lampLights) l.intensity = 0;
    if (t < K.rebuilt) return;
    const lamps = bugs.filter((b) => b.userData.kind === 'lamp'), wheels = bugs.filter((b) => b.userData.kind === 'wheel'),
      gliders = bugs.filter((b) => b.userData.kind === 'glider'), dancers = bugs.filter((b) => b.userData.kind === 'dance');
    const bp = T.beatPulse(t, 1, 0.12);
    lamps.forEach((b, i) => { b.visible = true; const p = STAGE.clone().add(V(i ? 95 : -95, 0, -22)); b.position.copy(p).add(V(0, bp * 2, 0)); b.rotation.set(0, 0, 0); b.set({ anim: 'a', frame: 0 }); b.scale.setScalar(1.3);
      lampLights[i].position.copy(p).add(V(0, 40, 6)); lampLights[i].intensity = 2500 * (0.8 + 0.4 * bp); });
    wheels.forEach((b, i) => { b.visible = true; const x = STAGE.x - 140 + ((t * 40 + i * 140) % 280); b.position.set(x, GY + 1, STAGE.z + 18 - i * 36); b.set({ anim: 'a', frame: 0 }); b.rotation.set(0, 0, -(t * 40 + i * 140) / 13); b.scale.setScalar(1.2); });
    gliders.forEach((b, i) => { b.visible = true; const a = t * 0.6 + i * Math.PI; b.position.set(STAGE.x + Math.cos(a) * 150, GY + 120 + 12 * Math.sin(t * 1.3 + i), STAGE.z + Math.sin(a) * 80 - 40); b.rotation.set(0, -a + Math.PI / 2 * (i ? 1 : -1), 0.15 * Math.sin(t * 2)); b.set({ anim: 'a', frame: 0 }); b.scale.setScalar(0.9); });
    if (t >= K.gang && t < K.build) dancers.forEach((b, i) => { b.visible = true; b.position.set(STAGE.x - 70 + i * 70, GY + 4 * bp, STAGE.z + 30); b.rotation.set(0, (i - 1) * 0.3, 0); b.set({ anim: 'a', frame: 0 }); b.scale.set((Math.floor(T.beatAt(t)) + i) % 2 ? -1.1 : 1.1, 1.1, 1.1); });
  }

  // ---------------------------------------------------------------- the gate (出发), drawn on the beats of the build
  const gateBeats = T.beatsIn(K.build, K.chufa + 0.1, 1);
  function gateState(t) {
    gateGroup.visible = t >= K.build - 0.01;
    gateGroup.position.copy(G0); gateGroup.rotation.set(0, Math.PI / 2, 0);   // reads 出发 from the sea end (the burst shot)
    const strokes = gate.map((h) => h.vox.strokeCount); const total = strokes[0] + strokes[1];
    let g = 0; // global stroke progress
    const per = Math.max(1, gateBeats.length - 1) / total;
    const bi = T.beatAt(t) - T.beatAt(K.build);
    g = T.clamp01(bi / (per * total)) * total;
    gate[0].setSequential(Math.min(strokes[0], g)); gate[1].setSequential(Math.max(0, g - strokes[0]));
  }

  // ---------------------------------------------------------------- cameras
  const LOCK_DIR = field.dirOf(500, 345).normalize();   // aim a little low so the glyph sits above the subtitle slot
  const lookFrom = (pos, target, fov = 45, roll = 0) => {
    cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(target); if (roll) cam.rotateZ(roll);
    cam.fov = fov; cam.near = Math.max(0.5, pos.distanceTo(target) * 0.02); cam.far = 200000;   // same near rule as act3 aim() cam.aspect = ctx.width / ctx.height; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    return { target, focus: target };
  };
  // the over-shoulder start of the lock move, and the exact eye
  const OS = E.clone().addScaledVector(RT, 125).add(V(0, 38, 0)).addScaledVector(F, -70);
  function camera(t) {
    // BRIDGE dusk: wide from behind/above the party toward the sunset; the Eraser on the horizon
    // 123.354 starts on Act III's exact last camera, then cranes up and back as the Eraser rises behind the hills
    if (t < K.dOut) { const u = T.span(t, K.start, K.dOut, T.ease.inOut);
      const c = lookFrom(lerpV(HANDOVER_CAM.pos, V(1420, 120, 820), u), lerpV(HANDOVER_CAM.tgt, V(1300, 420, -2600), u), T.lerp(HANDOVER_CAM.fov, 50, u));
      c.focus = V(1352, 20, 450); return c; }
    if (t < K.acc) { const u = T.span(t, K.dOut, K.acc, T.ease.inOut); return lookFrom(V(1420 + 120 * u, 120 + 140 * u, 820 + 300 * u), V(1300 - 50 * u, 420 - 260 * u, -2600 - 400 * u), 50 + 6 * u); }
    // the erased page: low, behind Jade, her painter's gesture toward the shards
    if (t < K.ht[1]) { const u = T.span(t, K.dBack, K.ht[1]); return lookFrom(at(GROUND.jade, -90 + 12 * u, 165 - 12 * u, 40), at(GROUND.jade, 60, -10, 42), 48, -0.02); }
    // Ricky's note: low orbit around the spiral as it draws up
    if (t < K.trip[0]) { const u = T.span(t, K.ht[1], K.trip[0], T.ease.inOut); const a = -0.7 + 1.2 * u; const c = SPIRAL.c;   // from the sun side: no glare
      return lookFrom(at(c, Math.cos(a) * 170, Math.sin(a) * 170, GY + 20 + 40 * u), at(c, 0, 0, GY + 35 + 20 * u), 52); }
    // the climb: wide side view of spiral + vantage + shards
    if (t < K.fc) { const u = T.span(t, K.trip[0], K.fc, T.ease.inOut); const c = SPIRAL.c;   // side-on: the sun at 90 degrees
      return lookFrom(at(c, 20 + 30 * u, 235 - 20 * u, GY + 70 + 25 * u), at(c, 20 + 20 * u, 0, GY + 70 + 15 * u), 48); }
    // at the vantage: eye level with the chaos (over the shoulder, offset), then THE MOVE into her eye
    if (t < K.slam) {
      let u;
      if (t < K.stop) u = 0.06 * T.span(t, K.fc, K.stop);
      else if (t < K.stop2) u = 0.06 + 0.78 * T.ease.inOut(T.clamp01((t - K.stop) / (K.stop2 - K.stop)));
      else u = 0.84 + 0.08 * T.ease.out(T.clamp01((t - K.stop2) / (K.slam - K.stop2)));     // "almost": the last 8% is the slam itself
      // curved approach: swing in from the side, settle onto the eye line
      const pos = lerpV(OS, E, u).addScaledVector(F, -40 * Math.sin(Math.PI * u) * (1 - u));
      const tgt = E.clone().addScaledVector(LOCK_DIR, 600);
      return lookFrom(pos, tgt, T.lerp(44, 52, T.ease.inOut(u)));
    }
    // SLAM: exactly the eye; hold, then a slow rise that breaks the anamorph again
    if (t < K.lookAt) {
      const u = T.ease.inOut(T.clamp01((t - (K.slam + 1.25)) / (K.lookAt - K.slam - 1.25)));
      const pos = E.clone().add(V(0, 45 * u, 0)).addScaledVector(RT, -70 * u).addScaledVector(F, -60 * u);
      return lookFrom(pos, E.clone().addScaledVector(LOCK_DIR, 600), 52 + 6 * u);
    }
    // the Eraser stops and looks at it (close on its face, the glyph's light on it)
    if (t < K.down) { const u = T.span(t, K.lookAt, K.down, T.ease.inOut); const ep = EP2; const toE = J.clone().sub(ep).setY(0).normalize();
      return lookFrom(ep.clone().addScaledVector(toE, 360 - 110 * u).add(V(0, 175 + 25 * u, 0)).addScaledVector(RT, 50 - 20 * u), ep.clone().add(V(0, 238 + 10 * u, 0)), 40 - 4 * u); }
    // climb down + colouring: low 3/4 wide with Jade small, Eraser big
    const tCol = T.word(39, 6).start - 0.15;
    if (t >= tCol && t < K.rebuilt) { const u = T.span(t, tCol, K.rebuilt, T.ease.inOut); const toE = EP2.clone().sub(J).setY(0).normalize(); const side = V(-toE.z, 0, toE.x);
      const st = EP2.clone().addScaledVector(toE, -150).setY(0);
      return lookFrom(st.clone().addScaledVector(toE, -80 + 12 * u).addScaledVector(side, 85 - 8 * u).add(V(0, 26 + 4 * u, 0)), st.clone().addScaledVector(toE, 25).addScaledVector(side, -20).add(V(0, 46 + 22 * u, 0)), 58); }
    if (t < K.rebuilt) { const u = T.span(t, K.down, tCol, T.ease.inOut); const ep = EP2; const toE = ep.clone().sub(J).setY(0).normalize(); const side = V(-toE.z, 0, toE.x);
      return lookFrom(ep.clone().addScaledVector(toE, -330 + 60 * u).addScaledVector(side, 210 - 40 * u).add(V(0, 26 + 10 * u, 0)), ep.clone().addScaledVector(toE, -80).add(V(0, 120 - 20 * u, 0)), 50); }
    // the rebuilt world, fixtures & functions: orbiting medium-wide on the causeway
    if (t < K.gang) { const u = T.span(t, K.rebuilt, K.gang); const a = -0.5 + 0.6 * u;
      return lookFrom(V(STAGE.x + Math.sin(a) * 260, GY + 60, STAGE.z + Math.cos(a) * 260), V(STAGE.x, GY + 40, STAGE.z - 30), 46); }
    // gang vocals: low and close in front of the gang (first half), then a wide crane up and back over the colour world
    const gMid = T.nearestBeat(K.gang + (K.roll[0] - K.gang) / 2);
    if (t < gMid) { const u = T.span(t, K.gang, gMid, T.ease.inOut);
      return lookFrom(V(STAGE.x - 40 + 70 * u, GY + 18, STAGE.z + 185 - 20 * u), V(STAGE.x, GY + 50, STAGE.z - 40), 48); }
    if (t < K.roll[0]) { const u = T.span(t, gMid, K.roll[0], T.ease.inOut);
      return lookFrom(V(STAGE.x + 30 - 90 * u, GY + 60 + 200 * u, STAGE.z + 230 + 260 * u), V(STAGE.x - 120 * u, GY + 50 + 30 * u, STAGE.z - 60), 46 + 8 * u); }
    // the roll: three angles cut every 4 sixteenths + shake
    if (t < K.build) { const k = Math.floor((t - K.roll[0]) / 0.4) % 3; const sh = 1.5 * T.beatPulse(t, 4, 0.04);
      const P = [V(160, 40, 170), V(-160, 30, 150), V(20, 20, 120)][k].add(STAGE);
      return lookFrom(P.add(V(sh * (hash(t * 30) - 0.5), sh * (hash(t * 31) - 0.5), 0)), V(ERS.x, GY + 80, ERS.z), 50); }
    // riding toward the gate drawing itself
    if (t < K.chufa) { const rp = ridePos(t); const u = T.span(t, K.build, K.chufa);
      return lookFrom(V(rp.x - 80 + 60 * u, GY + 70 + 30 * u, rp.z + 300 - 60 * u), V(T.lerp(rp.x, G0.x, 0.6), GY + 110 + 20 * u, G0.z), 50); }
    // 出发!: low and close on the far side of the gate: they leap off the Eraser and burst through toward us
    const tTrack = T.nearestBeat(K.chufaAcc + 0.9);
    if (t < tTrack) { const u = T.span(t, K.chufa, tTrack);
      return lookFrom(V(G0.x + 120 + 10 * u, GY + 10, G0.z + 40), V(G0.x - 50, GY + 34 - 6 * u, G0.z + 2), 56); }
    // ... then a low tracking shot running beside them
    if (t < K.pshot) { const h = runnerAt(t, 0);
      return lookFrom(V(h.x + 95, h.y + 18, G0.z + 150), V(h.x - 10, h.y + 26, G0.z), 50); }
    // 一笔一画!: tight on Jade's pencil tip (hand-off)
    { const u = T.span(t, K.pshot, K.last, T.ease.out); const tip = pencil.position.clone();
      return lookFrom(tip.clone().add(V(-22 + 6 * u, 7 - 2 * u, 17 - 5 * u)), tip.clone().add(V(6, 2, -2)), 30 - 5 * u); }
  }

  // the last shot (hand-off to Team D, whose 173.02 opens tight on Jade's rainbow pencil tip finishing a hatch line):
  // tight and low on the tip of the every-colour pencil hatching a rainbow line onto the causeway stone
  const hatchLine = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.6).translate(0.5, 0, 0), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vUv;
      vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
      void main(){ float e = abs(vUv.y - 0.5) * 2.0; float grain = fract(sin(dot(floor(vUv * vec2(240.0, 9.0)), vec2(12.9898, 78.233))) * 43758.5453);
        float a = (1.0 - smoothstep(0.55, 1.0, e)) * (0.55 + 0.45 * grain);
        gl_FragColor = vec4(hue(vUv.x * 0.9 - uT * 0.2) * 1.4, a); }` }));
  hatchLine.rotation.x = -Math.PI / 2; hatchLine.visible = false; root.add(hatchLine);
  function finaleState(t) {
    hatchLine.visible = false;
    if (t < K.pshot) return;
    const H = heroes; for (const h of Object.values(H)) h.visible = false;
    field.group.visible = false; for (const b of bugs) b.visible = false; gateGroup.visible = true;
    const x0 = G0.x - 150, z = G0.z + 8;
    const u = T.span(t, K.pshot, K.last + 0.39, T.ease.out);        // the stroke keeps going into Team D's 173.41 freeze
    const tipX = x0 + 26 * u;
    pencil.visible = true; pencil.position.set(tipX, GY + 0.15, z); pencil.rotation.set(0, 0, 0);
    pencil.rotateY(-0.5); pencil.rotateZ(-0.62); pencil.rotateX(0.18);
    hatchLine.visible = true; hatchLine.material.uniforms.uT.value = t;
    hatchLine.position.set(x0 - 40, GY + 0.12, z); hatchLine.scale.set(Math.max(0.01, tipX - (x0 - 40)), 1, 1);
  }

  // ---------------------------------------------------------------- look
  function look(t, ws) {
    let L = { ...LOOK };
    if (ws.pre) {
      // continuous with Act III's last look (rap.js: LOOK({ rays: 0.35, dofAmount: 0.15, sat: 1.22 })), easing into dusk
      // A = exactly rap.js's last look; the explicit exposure / bloomAmt equal applyLook's defaults (so they can be blended)
      const A = { ...TALOS_LOOK({ rays: 0.35, dofAmount: 0.15, sat: 1.22 }), exposure: 0.6, bloomAmt: 0.35 };
      const B = { ...A, rays: 0.3, dofAmount: 0.0, sat: 1.08, exposure: 0.46, bloomAmt: 0.28, ao: 0.6, fill: 0.75 };
      const u = T.span(t, K.start, K.acc, T.ease.inOut);
      L = { ...A }; for (const k of Object.keys(B)) if (typeof B[k] === 'number') L[k] = T.lerp(A[k], B[k], u);
    }
    else if (ws.erased) { L.exposure = t < K.fc ? 0.5 : 0.6; L.ao = 0.15; L.rays = t < K.fc ? 0.18 : 0.5; L.atmos = 0.6 * CRISP.atmos; L.bloomAmt = t < K.fc ? 0.2 : 0.35; }
    else { L.exposure = 0.6 + 0.12 * T.pulse(t, [K.slam], 0.5); L.rays = 0.45; }
    if (t >= K.chufa && t < K.pshot) { L.exposure = 0.5; L.rays = 0.0; L.atmos = 0.6 * CRISP.atmos; }
    if (t >= K.pshot) { L.exposure = 0.36; L.rays = 0.0; L.dof = 1; L.dofAmount = 0.7; L.bloomAmt = 0.14; L.atmos = 0.5 * CRISP.atmos; }
    
    return L;
  }

  // ---------------------------------------------------------------- overlay (subs, chant type)
  // subtitles: the TALOS lines use Act III's own SmoothSubs (line 34 starts inside Act III at 123.18, so the slot
  // continues seamlessly across the 123.354 cut); the erased-page bridge lines (36, 37) are handwritten (PAPER rule)
  const smooth = new SmoothSubs(ctx.width, ctx.height); ov.scene.add(smooth.mesh); smooth.mesh.renderOrder = 30;
  const SANS_LINES = [33, 34, 38, 39, 40, 41, 42, 43];   // 33 = Act III's last line (still in its hold window at the cut)
  function overlay(t) {
    ov.hideAll(); smooth.set(null);
    if (t >= K.yibi) { // laid out for all four characters (Team D stamps 一 画 at 173.187 / 173.719 in the same slots)
      ov.stampChars(t, 'yibi', [{ ch: '一', t: K.yibiW[0] }, { ch: '笔', t: K.yibiW[1] }, { ch: '一', t: T.word(43, 2).start }, { ch: '画', t: T.word(43, 3).start }], { y: 0.62, size: 0.22, color: '#ffffff', stroke: '#1b1b22', gap: 0.08 }); }
    if (api.suppressSubs) return;
    for (const id of SANS_LINES) {
      const c = subtitleFor(t, id, { lit: '#ffd23f', unlit: '#ffffff', hold: 0.25 });
      if (c) { if (id === 43) c.hideTop = true; smooth.set(c, 'bottom'); return; }   // 一笔一画! is stamped as hero type: translation only
    }
    if (t < K.fc) ov.subtitle(t, [36, 37], 'hand', { y: 0.06 });
  }

  // ---------------------------------------------------------------- fixtures & functions: a slab drawn in graphite, then brought alive
  const slab = new THREE.Mesh(new THREE.BoxGeometry(44, 26, 16), new THREE.MeshStandardMaterial({ color: 0x4a4a50, roughness: 0.5, metalness: 0.2, emissive: 0x000000 }));
  slab.castShadow = true; slab.receiveShadow = true; root.add(slab);
  const tFix = T.word(40, 3).start, tFun = T.word(40, 6).start;
  function slabState(t) {
    slab.visible = t >= tFix && t < K.gang;
    if (!slab.visible) return;
    const pop = T.ease.back(T.clamp01((t - tFix) / 0.18));
    const alive = T.clamp01((t - tFun) / 0.25);
    slab.scale.set(1, Math.max(0.01, pop), 1);
    slab.position.set(STAGE.x - 85, GY + 13 * pop + alive * (6 + 8 * Math.sin((t - tFun) * 5)), STAGE.z - 6);
    slab.rotation.y = alive * (t - tFun) * 0.8;
    const c = new THREE.Color().setHSL(((t * 0.4) % 1), 0.85, 0.55);
    slab.material.color.set(0x4a4a50).lerp(c, alive); slab.material.emissive.copy(c).multiplyScalar(0.5 * alive);
  }

  // ---------------------------------------------------------------- the colouring stroke: every-colour pencil -> the Eraser
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1, 8, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vUv; vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
      void main(){ float w = 0.5 + 0.5 * sin(vUv.y * 40.0 - uT * 30.0); gl_FragColor = vec4(hue(vUv.y * 1.5 - uT * 1.2) * (1.2 + 1.2 * w), 1.0); }` }));
  beam.visible = false; root.add(beam);
  const tCol0 = T.word(39, 6).start, tCol1 = K.need;
  function beamState(t) {
    beam.visible = t >= tCol0 && t < tCol1 + 0.12;
    if (!beam.visible) return;
    beam.material.uniforms.uT.value = t;
    const toE = EP2.clone().sub(J).setY(0).normalize(); const side = V(-toE.z, 0, toE.x);
    const stand = EP2.clone().addScaledVector(toE, -150).setY(GY);
    const tip = stand.clone().addScaledVector(toE, 17).add(V(0, 27, 0));
    const pink = T.clamp01((t - tCol0) / (tCol1 - tCol0));
    const y = GY + 200 * 1.6 * T.clamp01(1.6 - 2.2 * pink) * 0.92 + 8;                   // the colour front on the front face
    const tgt = EP2.clone().addScaledVector(toE, -200 * 0.62 / 2 - 1).setY(y).addScaledVector(side, 70 * Math.sin(t * 23));  // scribbling side to side
    beam.position.copy(tip); beam.lookAt(tgt); beam.scale.set(1, 1, tip.distanceTo(tgt));
  }

  // ---------------------------------------------------------------- frame
  let lastCam = null;
  const sunAt = (t) => SUN_DAY.clone().lerp(SUN, T.span(t, K.start, K.start + 1.6, T.ease.inOut)).normalize();
  function update(t) {
    fx.flash = 0; fx.fade = 0;
    W.reset();                                   // the shared world's default state (WORLD_API contract), then Act IV on top
    const ws = worldState(t);
    eraserState(t); heroState(t); bugState(t); gateState(t); slabState(t); beamState(t); finaleState(t);
    lastCam = camera(t);
    // flashes on the hard hits (one frame)
    if (T.exactFrame(t, [K.slam])) { fx.flash = 0.3; fx.flashColor = '#fff6e8'; }
    if (T.exactFrame(t, [K.lone])) { fx.flash = 0.25; fx.flashColor = '#ffffff'; }
    if (T.exactFrame(t, [K.chufaAcc, K.yibiW[0], K.yibiW[1]])) { fx.flash = 0.5; fx.flashColor = '#ffffff'; }
    if (t < K.dOut + 0.02 && t >= K.start) fx.fade = 0;
    lastLook = look(t, ws);
    overlay(t);
  }
  let lastLook = LOOK;
  function render(t, target) {
    Wd.begin(sunAt(t));
    W.applyLook(t, lastLook, { camera: cam, target: lastCam.target, focus: lastCam.focus, shadowExtent: shadowExt(t), virtFov: 0, distOffset: 0 });
    envUniforms.uTime.value = t;
    ctx.post.render(W.scene, cam, target);
    Wd.end();
    ov.render(target);
  }
  const shadowExt = (t) => (t < K.dOut ? T.lerp(700, 2600, T.span(t, K.start, K.dOut)) : t < K.acc ? 2600 : t < K.rebuilt ? 1500 : 700);

  const api = { stage: { kind: '3d', fx }, update, render, K, world: Wd, suppressSubs: false };
  return api;
}
