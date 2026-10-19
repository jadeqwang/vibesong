// ACT III · act3.turn · 77.757-86.385 (game-design pass, docs/game_design_acts1-3.md "The triplet roll" .. "THE TURN")
//
// 77.757-79.635  THE TRIPLET ROLL = the launch combo, every hero on his own layer of the mix:
//                JADE drums graphite blocks into existence (one pump per roll hit) and climbs a pillar per triplet;
//                CHARLIE's hat-trampoline (the hats + snare are his solo) bounces him higher on every triplet, the hat
//                rim "chings" on every hit; RICKY holds a rising note: its sound-waves bend Jade's last 一 stroke up
//                into the launch ramp. 79.36 一笔一画! slams. 79.635 (measured last hit): Jade leaves the ramp lip while
//                the hat bounces Charlie + Ricky -- all three launch together, the REALITY bar hits 100%.
// 79.87-80.805   silence: frozen at the apex, the 2° tilt, only the bar's text moves (100% · LOADING...)
// 80.815         THE TURN: the 2D HUD + bar shatter and fall away with the pixel grid (turn_ui.js), the camera whips
//                ortho -> perspective, Charlie's hat parachute opens and drifts Jade + Ricky down onto the causeway.
//                A small LEVEL LOADED toast. Whistle hook: Jade hand-colours a cypress on every whistle note.
// accent pairs   82.265 / 83.09 / 85.56 (/ 86.385 = act3.drop's first frame): Charlie's boomerang hat tags the next
//                far ▶ switch (a waypoint ping), Ricky's chord clicks it, and the next causeway chunk rises out of the
//                plaster just before Jade's feet need it.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { turnParams } from '../../turn.js';
import { getWorld } from './world/build.js';
import { make3D, CUE, V, aim, persp, pathAt, runFrame, smooth, clamp01, LOOK, faceCam, CRISP, csTagObject } from './common.js';
import { TREE_HITS } from './paintlog.js';
import { buildTurnProps, STEP, colX, colTop, STROKE, strokeCurve, strokeTopAt, SEGS, SWITCH_X } from './turn_props.js';
import { makeTurnUI } from './turn_ui.js';
import { LAUNCH } from '../act2/launch_set.js';

const DEG = Math.PI / 180;
const lerp = (a, b, u) => a + (b - a) * u;
const IMP = () => T.snap(CUE.impact);                 // the impact frame (80.815 measured)
const LAST = 79.635;                                  // measured: the drums' last hit = the launch (bar 100%)
const SIL0 = CUE.silence[0];
const TRIP = [0, 3, 6, 9].map((i) => CUE.roll[i]);    // triplet downbeats
const TRIP_END = 79.41;
// (v4b stage_3d) the cut to the wide sat on the last triplet onset 79.272 (64 ms off the timing.json grid); now on the 8th
// 79.2025 (bar 47 beat 4.5, frame 2376 = 79.200: -2.5 ms), so the chant 一 (79.36) still lands in the wide
const WIDE_CUT = 79.2025;
const rollIdx = (t) => T.lastIdx(t, CUE.roll);
const lastHit = (t) => { const i = rollIdx(t); return i < 0 ? -1e9 : T.snap(CUE.roll[i]); };

// ---------------------------------------------------------------- 2D layout (world units = game px; x = gx - 200, y = gy - 60)
// party at 77.757 = Act II's LAUNCH.party (HANDOFF_77 v6: gx 54 / 96 / 138, one pressure plate each)
const JADE0 = LAUNCH.party.jade - 200, CHAR0 = LAUNCH.party.charlie - 200, RICK0 = LAUNCH.party.ricky - 200, TRAMP_X = -96, HAT_TOP = 4;
const APEX = { jade: [100, 76], charlie: [68, 68], ricky: [40, 60] };
const BOUNCE_H = [0, 22, 28, 44];
const T2 = V(8, 46, 0);                               // the u = 0 framing of the turn (wide, held through the silence)
const bendAt = (t) => smooth(79.0, 79.5, t);          // Ricky's rising note bends the 一 up
const strokeDrawn = (t) => { let n = 0; for (let j = 0; j < 3; j++) if (T.on(t, CUE.roll[9 + j])) n = j + 1; return n; };

// ---------------------------------------------------------------- 3D choreography
const LAND_J = 81.6, LAND_C = 81.8, RUN_T = 82.3;
const STAND = { jade: 236, charlie: 205, ricky: 166 };
const HANDOFF = { jade: 613, charlie: 585, ricky: 561 };      // = act3.drop partyAt(86.385)
const ZOF = { jade: 0, charlie: -7, ricky: 7 };
const WHISTLE_HITS = TREE_HITS;                                // Jade's cypress flicks (one per whistle note)
const CLICKS = [CUE.pairs[0], CUE.pairs[1], CUE.pairs[2]];     // Ricky's chords in this scene (the 4th is act3.drop's first frame)
const HAT = [[81.93, 82.1, 82.42], [82.5, 82.84, 83.24], [84.98, 85.3, 85.66], [85.78, 86.04, 86.36]];   // boomerang: throw, tag, catch
// Break the blob: Jade leads, Charlie mid, Ricky trails. Each hero slows to act (flick / throw / plant for the chord) and the
// spacing breathes; positions are the integral of a per-hero speed shape, normalised to land on act3.drop's hand-off.
const RUN_END = CUE.pairs[3];
const ACT_WIN = { jade: WHISTLE_HITS.map(([te]) => [te - 0.05, te + 0.18]), charlie: HAT.map(([a]) => [a - 0.06, a + 0.24]), ricky: CUE.pairs.slice(0, 4).map((te) => [te - 0.16, te + 0.18]) };
const SLOW = { jade: 0.7, charlie: 0.45, ricky: 0.85 };
const BREATH = { jade: [0.16, 2.1, 0], charlie: [0.10, 1.6, 2.0], ricky: [0.14, 2.7, 5.0] };   // amp, period (s), phase
const speedShape = (n, t) => {
  let m = 1; for (const [a, b] of ACT_WIN[n]) { const w = smooth(a - 0.06, a + 0.04, t) * (1 - smooth(b - 0.04, b + 0.08, t)); m = Math.min(m, 1 - SLOW[n] * w); }
  const [A, P, ph] = BREATH[n]; return smooth(RUN_T - 0.05, RUN_T + 0.25, t) * m * (1 + A * Math.sin(2 * Math.PI * (t - RUN_T) / P + ph));
};
const RUN_TAB = {}; { const dt = 1 / 600;
  for (const n of ['jade', 'charlie', 'ricky']) { const tab = []; let S = 0; for (let t = RUN_T - 0.05; t <= RUN_END + 1e-9; t += dt) { tab.push(S); S += speedShape(n, t) * dt; } RUN_TAB[n] = { tab, S, dt }; } }
const runX = (n, t) => { const { tab, S, dt } = RUN_TAB[n]; const f = (t - RUN_T + 0.05) / dt; const i = Math.max(0, Math.min(tab.length - 2, Math.floor(f))); const u = clamp01(f - i);
  return STAND[n] + (HANDOFF[n] - STAND[n]) * (tab[i] + (tab[i + 1] - tab[i]) * u) / S; };
const runU = (t) => clamp01((t - RUN_T) / (RUN_END - RUN_T));

/** the parachute rig (Charlie's feet F) after the impact */
function chuteAt(t) {
  const s = t - IMP(); const C0 = APEX.charlie;
  const gx = smooth(IMP(), LAND_C, t);
  const x = lerp(C0[0], STAND.charlie, gx);
  let y; if (t < LAND_J) { const u = clamp01((t - IMP()) / (LAND_J - IMP())); y = lerp(C0[1], 41, u * (0.55 + 0.45 * u)) + 5 * Math.sin(Math.PI * clamp01(s / 0.35)); }
  else y = lerp(41, 0, smooth(LAND_J, LAND_C, t));
  const open = smooth(IMP() + 0.03, IMP() + 0.13, t) * (1 + 0.18 * Math.sin(Math.PI * clamp01((s - 0.03) / 0.22))) * (1 - smooth(LAND_C - 0.02, LAND_C + 0.1, t));
  const sway = 7 * Math.sin((t - IMP()) * 5.2) * (1 - smooth(LAND_J - 0.1, LAND_J, t));
  return { x, y, open, sway };
}

/** hero states. 2D phase: frozen through the silence; 3D: chute -> stand -> run */
function heroes(t) {
  const tt = t >= SIL0 && t < IMP() ? SIL0 : t;
  const H = {}; const fly = (p0, a, tt) => { const u = clamp01((tt - LAST) / (SIL0 - LAST)); return { x: lerp(p0[0], a[0], u), y: lerp(p0[1], a[1], 1 - (1 - u) * (1 - u)) }; };
  if (t < IMP()) {
    // ---- JADE: drum -> hop a pillar up on every triplet -> tap the 一 -> run up the bending ramp -> leap
    const hitF = tt - lastHit(tt) < 0.06 ? 0 : 1;
    if (tt < TRIP[1]) H.jade = { x: lerp(JADE0, colX(-1) - 2, smooth(77.757, 77.86, tt)), y: 0, anim: 'drum', frame: tt < 77.757 ? 0 : hitF };
    else if (tt < 79.33) {
      let k = 1; for (let i = 1; i < 4; i++) if (tt >= TRIP[i]) k = i;
      const x0 = k === 1 ? colX(-1) - 2 : colX(k - 2), y0 = k === 1 ? 0 : colTop(k - 2), x1 = colX(k - 1), y1 = colTop(k - 1);
      const u = clamp01((tt - TRIP[k]) / 0.12);
      H.jade = u < 1 ? { x: lerp(x0, x1, u), y: lerp(y0, y1, u) + 9 * Math.sin(Math.PI * u), anim: 'jump', frame: 0 } : { x: x1, y: y1, anim: 'drum', frame: hitF };
    } else if (tt < LAST) {
      const u = Math.pow(clamp01((tt - 79.33) / (LAST - 79.33)), 1.25); const p = strokeTopAt(bendAt(tt), lerp(0.02, 1, u));
      H.jade = { x: p.x, y: p.y, anim: 'run', frame: Math.floor((tt - 79.33) * 12) % 2 };
    } else { const lip = strokeTopAt(1, 1); const p = fly([lip.x, lip.y], APEX.jade, tt); H.jade = { ...p, anim: 'jump', frame: 0 }; }
    H.jade.pencil = true;
    // ---- CHARLIE: flips his hat into a trampoline, bounces higher on every triplet, Ricky joins him, both launch
    if (tt < 77.95) H.charlie = { x: CHAR0, y: 0, anim: 'idle', t: 0 };
    else if (tt < TRIP[1]) H.charlie = { x: lerp(CHAR0, TRAMP_X - 4, smooth(77.95, 78.1, tt)), y: 0, anim: 'trampoline', t: tt - 77.95 };
    else if (tt < TRIP_END) {
      let k = 1; for (let i = 1; i < 4; i++) if (tt >= TRIP[i]) k = i;
      const t1 = k < 3 ? TRIP[k + 1] : TRIP_END; const u = clamp01((tt - TRIP[k]) / (t1 - TRIP[k]));
      H.charlie = { x: TRAMP_X - 4, y: HAT_TOP + BOUNCE_H[k] * 4 * u * (1 - u), anim: 'jump', frame: u < 0.5 ? 0 : 1 };
    } else if (tt < LAST) H.charlie = { x: TRAMP_X - 8, y: HAT_TOP - (tt > LAST - 0.08 ? 2 : 0), anim: 'idle', t: 0 };
    else H.charlie = { ...fly([TRAMP_X - 8, HAT_TOP], APEX.charlie, tt), anim: 'jump', frame: 0 };
    // ---- RICKY: holds the rising note (sustain), hops onto the hat after the roll, launched with Charlie
    if (tt < 77.9) H.ricky = { x: RICK0, y: 0, anim: 'idle', t: 0 };
    else if (tt < 79.3) H.ricky = { x: RICK0, y: 0, anim: 'sustain', t: tt - 77.9 };
    else if (tt < 79.45) { const u = clamp01((tt - 79.3) / 0.15); H.ricky = { x: lerp(RICK0, TRAMP_X + 8, u), y: lerp(0, HAT_TOP, u) + 12 * Math.sin(Math.PI * u), anim: 'jump', frame: u < 0.5 ? 0 : 1 }; }
    else if (tt < LAST) H.ricky = { x: TRAMP_X + 8, y: HAT_TOP - (tt > LAST - 0.08 ? 2 : 0), anim: 'idle', t: 0 };
    else H.ricky = { ...fly([TRAMP_X + 8, HAT_TOP], APEX.ricky, tt), anim: 'jump', frame: 0 };
    H.charlie.z = -7; H.ricky.z = 7; H.jade.z = 0;
    return H;
  }
  // ---- 3D: parachute (handled in frame), then stand at the edge of the drawn level, then run the rising road
  const ch = chuteAt(t);
  for (const n of ['jade', 'charlie', 'ricky']) {
    let s;
    if (t < RUN_T) {
      const xl = n === 'charlie' ? ch.x : ch.x + (n === 'jade' ? 9 : -10);
      const k = smooth((n === 'charlie' ? LAND_C : LAND_J) + 0.02, 81.92, t);
      s = { x: lerp(xl, STAND[n], k), y: 0, anim: k > 0 && k < 1 ? 'run' : 'idle', frame: k > 0 && k < 1 ? runFrame(t, n === 'jade' ? 2 : 6, 3) : null, t: t - LAND_J };
    } else {
      // own gaits: Jade light and springy (2-frame run, a hop per stride), Charlie steady, Ricky heavy (slower cadence, dips)
      const ph = T.beatAt(t); const env = Math.sin(Math.PI * runU(t));
      if (n === 'jade') s = { x: runX(n, t), y: 2.2 * Math.abs(Math.sin(Math.PI * ph * 2)), anim: 'run', frame: runFrame(t, 2, 2) };
      else if (n === 'charlie') s = { x: runX(n, t), y: 0.8 * Math.abs(Math.sin(Math.PI * (ph * 3 + 0.3))), anim: 'run', frame: runFrame(t + 0.1, 6, 3) };
      else s = { x: runX(n, t), y: 1.2 * Math.abs(Math.sin(Math.PI * ph)), anim: 'run', frame: runFrame(t + 0.2, 6, 2) };
      s.zl = { jade: -5 * Math.sin(2 * Math.PI * runU(t) * 1.5), charlie: 4 * Math.sin(2 * Math.PI * runU(t) + 1), ricky: 5 * Math.sin(2 * Math.PI * runU(t) * 1.2 + 2) }[n] * env;
    }
    s.z = ZOF[n] + (s.zl || 0); H[n] = s;
  }
  H.jade.pencil = true;
  // abilities layered on the locomotion (one readable action at a time)
  const fl = WHISTLE_HITS.find(([te]) => t >= te - 0.03 && t < te + 0.16);
  if (fl) Object.assign(H.jade, { anim: 'draw_rainbow', frame: 0 });
  const th = HAT.find(([a]) => t >= a - 0.05 && t < a + 0.22);
  if (th) Object.assign(H.charlie, { anim: 'throw', t: t - th[0] + 0.05, frame: null });
  const ck = [...CLICKS, CUE.pairs[3]].find((te) => t >= te - 0.14 && t < te + 0.16);
  if (ck) Object.assign(H.ricky, { anim: 'chord', frame: t < T.snap(ck) - 1e-6 ? 0 : 1 });
  return H;
}

/** scene-local props, built once per page and shared with act3.drop's first beat. W.reset() hides them again (and gives the
 *  shared causeway strip back) for every other scene. */
export function ensureTurnProps(W, lib) {
  if (!W._turnProps) W._turnProps = buildTurnProps(W, lib).then((TP) => {
    const P = W.props; const r0 = W.reset;
    W.reset = function () { r0.call(this); TP.root.visible = false; if (P.drawnStrip) P.drawnStrip.visible = true; P.boomer.scale.set(1, 1, 1); };
    return TP;
  });
  return W._turnProps;
}

/** act3.drop's first beat (86.385): Ricky's 4th chord clicks switch 4 (Charlie tagged it at 86.04) and the last causeway chunk
 *  rises; call update(t, party) right after drop's partyAt(t), before the heroes are placed. Inactive after ~1 s. */
export async function turnCarry(ctx, W) {
  const TP = await ensureTurnProps(W, ctx.lib); const P = W.props; const te = CUE.pairs[3]; const sw = TP.switches[3];
  return {
    update(t, party) {
      const s = t - T.snap(te); if (s < -1e-6 || s > 1.0) return;
      TP.root.visible = true; if (P.drawnStrip) P.drawnStrip.visible = false;
      TP.root.children.forEach((o) => (o.visible = false));
      roadState(TP, t);
      TP.switches.forEach((g, i) => (g.visible = i === 3)); TP.pings.forEach((g, i) => (g.visible = g.visible && i === 3)); TP.lips.forEach((g) => (g.visible = false));
      if (party?.ricky && s < 0.17) party.ricky = { ...party.ricky, anim: 'chord', frame: 1 };
      if (s < 0.2) { const r = party.ricky; P.beam.visible = true; P.beam.set([V(r.x + 16, 25, r.z), V(sw.position.x, sw.position.y + 43, sw.position.z)], clamp01((s + 0.034) / 0.08), { width: 0.8 }); }
      P.sparks.visible = true; P.sparks.run(t, [
        { t0: te, x: sw.position.x, y: sw.position.y + 43, z: sw.position.z, n: 22, speed: 60, up: 30, g: 90, dur: 0.5, seed: 73, colors: ['#ffb02e', '#ffffff', '#3ad06a'] },
        { t0: te + 0.05, x: 740, y: 0, z: 0, n: 40, speed: 70, up: 26, g: 140, dur: 0.7, seed: 124, spread: 76, colors: ['#e8dcc6', '#5cc04a', '#6e4426'] }]);
    },
  };
}

/** causeway chunks + far switches + Charlie's pings at t (shared with act3.drop's first beat via turnCarry) */
function roadState(TP, t) {
  // ---- causeway chunks: the old 2D strip + chunks sunk in the plaster, raised on Ricky's clicks
  TP.segments.forEach((g, i) => {
    const te = g.userData.te; let y = 0, sat = 1;
    if (te !== null) { const s = t - T.snap(te); const u = clamp01(s / 0.16);
      y = s < 0 ? -40 : -40 * (1 - (1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2))); sat = s < 0 ? 0.05 : 0.05 + 0.95 * smooth(0, 0.35, s); }
    g.position.y = y; g.userData.uSat.value = sat; g.visible = t >= IMP() || i === 0;
  });
  TP.lips.forEach((g) => (g.visible = t >= IMP()));
  // ---- far switches: off -> (Charlie's hat tags it: waypoint ping) -> Ricky's chord: hit -> on -> sinks back
  TP.switches.forEach((g, i) => {
    g.visible = t >= IMP(); if (!g.visible) return;
    const te = [...CLICKS, CUE.pairs[3]][i]; const s = t - T.snap(te); const { mat, faces, cube } = g.userData;
    mat.map = s < 0 ? faces.off : s < 0.1 ? faces.hit : faces.on; cube.scale.setScalar(s >= 0 && s < 0.12 ? 1.18 - 1.5 * s : 1);
    g.children.forEach((m) => (m.position.y = -64 * smooth(0.55, 0.95, s)));
  });
  TP.pings.forEach((g, i) => {
    const [, tag] = HAT[i]; const te = [...CLICKS, CUE.pairs[3]][i]; const s = t - tag;
    g.visible = s >= 0 && t < T.snap(te) + 0.06; if (!g.visible) return;
    const sw = TP.switches[i].position; const pop = s < 0.12 ? 0.4 + 5 * s : 1;
    g.position.set(sw.x, sw.y, sw.z); const { dia, ring, pil } = g.userData;
    dia.position.y = 72 + 2 * Math.sin(s * 9); dia.rotation.y = s * 4; dia.scale.set(pop, 1.5 * pop, pop);
    const rp = (s % 0.4) / 0.4; ring.position.y = 1; ring.scale.setScalar(0.6 + 1.6 * rp); ring.material.opacity = 1 - rp;
    pil.scale.set(1, 110 * Math.min(1, s / 0.1), 1);
  });
}

/** ortho/perspective rig for the turn. u = 0 is pixel-exact 2D (with yaw/pitch/roll for the silent tilt). */
function rig(t, aspect, H2D, pix2D) {
  const tilt = smooth(CUE.silence[0], CUE.silence[1], t);                // the silent 2° creep (eased in)
  const yaw0 = -4 * tilt, pitch0 = 2 * tilt, roll0 = 2 * tilt;
  const u = clamp01((t - IMP()) / (82.31 - IMP()));
  const T3 = V(252, 60, -30);
  if (u <= 0) {
    const cam = rig.ortho ||= new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 3000);
    const hh = H2D / 2, hw = hh * aspect;
    const tg = T2.clone();
    if (tilt === 0) { tg.x = Math.round(tg.x - hw) + hw; tg.y = Math.round(tg.y - hh) + hh; }
    cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh;
    const dir = V(Math.sin(yaw0 * DEG) * Math.cos(pitch0 * DEG), Math.sin(pitch0 * DEG), Math.cos(yaw0 * DEG) * Math.cos(pitch0 * DEG));
    cam.position.copy(tg).addScaledVector(dir, 1000); cam.up.set(0, 1, 0); cam.lookAt(tg); cam.rotateZ(roll0 * DEG);
    cam.near = 500; cam.far = 1100; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    return { camera: cam, u: 0, p: turnParams(0), target: tg, pix: pix2D };
  }
  const p = turnParams(u);
  const eAz = 1 - Math.pow(1 - u, 3.2), eEl = smooth(0.05, 0.9, u), eF = 1 - Math.pow(1 - u, 2.4), eT = smooth(0.0, 1.0, u);
  const az = lerp(yaw0, -60, eAz) * DEG, el = lerp(pitch0, 7, eEl) * DEG;
  const roll = (roll0 * (1 - smooth(0, 0.45, u)) - 3.5 * Math.sin(Math.PI * Math.min(1, u * 1.3))) * DEG;
  const fov = 0.25 + (50 - 0.25) * Math.pow(eF, 1.5);
  const H = lerp(H2D, 300, eF);
  const tg = T2.clone().lerp(T3, eT);
  const cam = persp('turn', aspect);
  const dist = H / (2 * Math.tan(fov * DEG / 2));
  const dir = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  cam.position.copy(tg).addScaledVector(dir, dist); cam.up.set(0, 1, 0); cam.lookAt(tg); cam.rotateZ(roll);
  cam.fov = fov; cam.aspect = aspect; cam.near = Math.max(1, dist - lerp(140, 900, smooth(0.2, 0.75, u)));   // early in the whip only the slice in front of the void renders (no sea-side occluders) cam.far = dist + 150 * Math.pow(90000 / 150, smooth(0.0, 0.6, u));
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  return { camera: cam, u, p, target: tg, pix: Math.max(1, lerp(pix2D, 1, smooth(0.04, 0.55, u))) };
}

// ---------------------------------------------------------------- 2D cuts through the roll (pixel camera; integer zooms only)
const CUTS = [
  [77.757, { c: [-8, 30], z: 1, act: null }],          // = Team A's last frame (no highlight on the frame)
  [77.95, { c: [-8, 30], z: 1, act: 'charlie' }],      // the hat flips into a trampoline: Charlie's solo      // = Team A's last frame (Stage2D centre (192, 90), zoom 1)
  [TRIP[1], { c: [-40, 36], z: 2, act: 'jade' }],       // Jade on pillar 1, drumming pillar 2 up; Charlie's bounce behind
  [TRIP[2], { c: [-106, 34], z: 2, act: 'charlie' }],   // Charlie's higher bounce, Ricky holding the note
  [TRIP[3], { c: [16, 58], z: 2, act: 'ricky' }],       // the last 一 tapped out and bending up on Ricky's waves
  [WIDE_CUT, { c: [T2.x, T2.y], z: 1, act: null }],     // wide = the turn's u = 0 frame: chant, launch, silence
];

export async function setup(ctx) {
  const W = await getWorld(ctx);
  const { width, height } = ctx; const aspect = width / height; const pix2D = height / 180;
  const P = W.props;
  P.voidWall.userData.setBreak(APEX.jade[0], APEX.jade[1], 1500);
  const TP = await ensureTurnProps(W, ctx.lib);
  if (P.gate2) csTagObject(P.gate2);   // (v4b H9) the 3D 出发 strokes keep their rainbow under the colour script
  const ui = await makeTurnUI(ctx, { impact: CUE.impact });
  TP.chute.pop = (t) => { const s = t - IMP(); return 0.5 + 0.5 * smooth(0, 0.12, s) + 0.1 * Math.sin(Math.PI * clamp01((s - 0.06) / 0.2)); };   // the canopy blooms
  // cypress tips (bounding boxes: robust to the density pass re-sculpting the trees)
  const tips = W.avenue.map((m) => { const b = new THREE.Box3().setFromObject(m); return V((b.min.x + b.max.x) / 2, b.min.y + Math.min(110, (b.max.y - b.min.y) * 0.8), (b.min.z + b.max.z) / 2); });
  const treeTip = (k) => tips[k];

  // fly-over camera keys (anchor = Jade's x); the first key is the turn's end pose
  const endPose = (() => { const r = rig(82.31, aspect, 180, pix2D); return { pos: r.camera.position.clone(), tgt: r.target.clone() }; })();
  const jx = (t) => { const h = heroes(t); return (h.jade.x + h.charlie.x + h.ricky.x) / 3 + 22; };   // camera anchor: the party (Jade-leaning), so the trailing Ricky stays in frame
  const A0 = jx(82.31);
  const camKeys = [[82.31, endPose.pos.clone().sub(V(A0, 0, 0))], [83.6, V(-28, 42, 188)], [85.0, V(-14, 60, 214)], [86.4, V(-4, 50, 196)]];
  const tgtKeys = [[82.31, endPose.tgt.clone().sub(V(A0, 0, 0))], [83.6, V(44, 22, -36)], [85.0, V(58, 18, -44)], [86.4, V(48, 22, -40)]];

  const CH = [[-124, 98], [-84, 98], [-44, 98], [-4, 98]];   // chant centres (scaled 0.8): top-left, under the bar

  const sc = await make3D(ctx, W, {
    inWorldSubs: [18],
    frame(t, fx) {
      const r = rig(t, aspect, 180, pix2D);
      let camera = r.camera, target = r.target, look, pix = r.pix, shadowExtent = 420;
      const P2 = r.p; let act = null;
      // ---- 2D section: cuts on the triplets (pixel camera with zoom)
      if (t < T.snap(WIDE_CUT) - 1e-6) {
        const cut = CUTS.reduce((a, c) => (t >= T.snap(c[0]) - 1e-6 ? c : a), CUTS[0])[1]; act = cut.act;
        const cam = camera; const hh = 90 / cut.z, hw = hh * aspect;
        const cx = Math.round(cut.c[0] - hw) + hw, cy = Math.round(cut.c[1] - hh) + hh;
        cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh; cam.position.set(cx, cy, 1000); cam.up.set(0, 1, 0); cam.lookAt(cx, cy, 0);
        cam.updateProjectionMatrix(); cam.updateMatrixWorld(); target = V(cx, cy, 0); pix = pix2D * cut.z;
      }
      look = { flat: P2.flat, light: P2.light, shadow: P2.shadow, tone: P2.tone, palette: P2.palette, pix, outline: P2.outline, bloom: P2.bloom, dof: P2.dof * 0.6, grade: P2.grade,
        rays: 0.3 * smooth(0.45, 1, r.u), ao: smooth(0.3, 0.8, r.u), dofAmount: 0.2, ...CRISP, atmos: CRISP.atmos * smooth(0.12, 0.7, r.u), hazeStart: CRISP.hazeStart * r.u, contrast: 1 + (CRISP.contrast - 1) * r.u, accent: 1 + (CRISP.accent - 1) * r.u };
      let flyPos = null;
      let virtFov = r.u > 0 ? 1 - smooth(0.3, 0.95, r.u) : 1;
      if (t >= 82.31) {
        const A = jx(t);
        const pos = pathAt(t, camKeys).add(V(A, 0, 0)), tgt = pathAt(t, tgtKeys).add(V(A, 0, 0));
        // a brief lean toward each switch while it is tagged -> clicked (so the ping + the click read at 960x540)
        let lean = 0, lp = null;
        HAT.forEach(([, tag], i) => { const te = [...CLICKS, CUE.pairs[3]][i]; const w = smooth(tag - 0.3, tag + 0.05, t) * (1 - smooth(te + 0.12, te + 0.5, t)); if (w > lean) { lean = w; lp = TP.switches[i].position; } });
        if (lp) tgt.lerp(V(lp.x, lp.y + 34, lp.z), 0.32 * lean);
        camera = aim(persp('fly', aspect), pos, tgt, lerp(42, 50, smooth(83.6, 85.0, t)) - 6 * lean); target = tgt;
        flyPos = pos; look = LOOK({ rays: 0.35, dofAmount: 0.15 }); virtFov = 0; shadowExtent = 700;
      }
      const tt = t >= SIL0 && t < IMP() ? SIL0 : t;     // frozen scene clock through the silence

      // ---- world state
      TP.root.visible = true; if (P.drawnStrip) P.drawnStrip.visible = false;
      const ut = t - IMP();
      P.gate2.visible = true; P.lamp.visible = true;
      // Act II's VOID gizmo cubes (2D, parallax 0.6 against the camera's left edge in Stage2D px), tumbling away on the impact
      { const camLeftG = (camera.isOrthographicCamera ? camera.position.x + camera.left : T2.x - 160) + 200;
        TP.cubes2D.forEach((m, i) => { const [x, y] = m.userData.home; const s = Math.max(0, ut); m.visible = s < 2.0;
          const gx = x + (Math.min(camLeftG, 1e9) - 32) * 0.6, gy = y + Math.round(3 * Math.sin(tt * 1.1 + i));
          m.position.set(gx - 200 + m.geometry.parameters.width / 2 + 40 * s, gy - 60 + m.geometry.parameters.height / 2 + 60 * s - 200 * s * s, -20 - 160 * s); m.rotation.set(3 * s, 2 * s, 4 * s); }); }
      P.voidWall.visible = ut < 2.4; P.voidWall.material.uniforms.uT.value = ut;

      // ---- JADE's graphite blocks: each roll hit pumps the current pillar up by c+1 bricks (pop + dust)
      for (const b of TP.bricks) {
        const te = CUE.roll[b.hit]; const vis = T.on(tt, te); b.mesh.visible = vis; if (!vis) continue;
        const s = T.since(tt, te); const pop = s < 0.07 ? 0.55 + 0.45 * (s / 0.07) : 1;
        b.mesh.position.set(colX(b.c), (b.k + 0.5) * STEP.bh * pop, 0); b.mesh.scale.set(1 + 0.12 * (1 - pop), pop, 1);
      }
      // ---- the 一 she taps out in the last triplet, bent up into the ramp by Ricky's rising note
      { const nDrawn = strokeDrawn(tt); const per = STROKE.n / 3; const { pts } = strokeCurve(bendAt(tt));
        TP.strokeSegs.forEach((m, i) => { const vis = i < nDrawn * per; m.visible = vis; if (!vis) return; const p = pts[i]; m.position.set(p.x, p.y, 0); m.rotation.set(0, 0, p.a); }); }
      // ---- Ricky's sound-waves: arcs leave the guitar on the beat and fly to the stroke's tip (the bend), then stop
      TP.waves.forEach((w, i) => {
        const t0 = 78.2 + i * 0.16; const s = tt - t0; const dur = 0.42; w.visible = s >= 0 && s < dur && tt < LAST + 0.05; if (!w.visible) return;
        const u = s / dur; const tip = strokeCurve(bendAt(tt)).tip;
        const a = V(RICK0 + 14, 26, 8), b = V(tip.x - 6, tip.y - 6, 8);
        w.position.set(lerp(a.x, b.x, u), lerp(a.y, b.y, u) + 24 * Math.sin(Math.PI * u), 8); w.scale.setScalar(0.7 + 0.6 * u); w.rotation.set(0, 0, 0.5 * (1 - u));
      });
      // ---- trampoline: the hat on the floor; squash on every take-off, the rim "chings" on every roll hit (hi-hat)
      if (tt >= 78.05) {
        P.tramp.visible = true; const takeoffs = [TRIP[1], TRIP[2], TRIP[3], LAST];
        const s = Math.min(...takeoffs.map((e) => { const d = tt - T.snap(e); return d >= -0.05 ? Math.abs(d + 0.0) : 9; }));
        W.put(P.tramp, { x: TRAMP_X, y: 0, z: 0, anim: 'rest', frame: t < IMP() ? (s < 0.04 ? 1 : s < 0.1 ? 2 : 0) : 0 });
      }

      // ---- heroes
      const H = heroes(t);
      const chuteOn = t >= IMP() && t < LAND_C + 0.12;
      for (const [n, s] of Object.entries(H)) {
        TP.heroes2D[n].visible = false;
        const hide = chuteOn && (n === 'charlie' ? t < LAND_C : t < LAND_J + 0.02);
        if (hide) continue;
        W.put(t < IMP() ? TP.heroes2D[n] : W.heroes[n], { ...s, rotY: t >= IMP() && !flyPos ? -45 * smooth(IMP(), 81.9, t) * DEG : 0 });
      }
      if (flyPos) faceCam(Object.values(W.heroes), flyPos, 0.6 * smooth(82.31, 83.0, t));
      // the boomerang hat is in the air -> Charlie is hatless (density 2b figures: set({ hat: false }), per call)
      if (t >= IMP() && W.heroes.charlie.visible && W.heroes.charlie.figure && HAT.some(([a0, , c0]) => t >= a0 + 0.04 && t < c0)) W.heroes.charlie.set({ hat: false });
      // ---- the hat parachute: Charlie under the canopy, Jade (front boot) + Ricky (back boot) dangling
      const C = TP.chute; [C.charlie, C.jade, C.ricky, ...(C.canopy ? [C.canopy] : []), ...C.strings].forEach((o) => (o.visible = false));
      if (chuteOn) {
        const ch = chuteAt(t); const rz = ch.sway * DEG; const k = smooth(IMP(), IMP() + 0.24, t);
        const zc = lerp(24, -7, smooth(81.25, LAND_J, t));   // drift in FRONT of the 出发 gate, then onto Charlie's lane
        if (t < LAND_C) {
          W.put(C.charlie, { x: ch.x, y: ch.y + C.cH, z: zc, anim: 'pose', t: t * 1.0 }); C.charlie.rotation.set(0, -30 * DEG * smooth(IMP(), 81.5, t), rz * 0.5);
          if (C.canopy && ch.open > 0.01) {
            const hy = ch.y + C.cH; W.put(C.canopy, { x: ch.x, y: hy + 10, z: zc, anim: 'pose', t: t }); C.canopy.scale.set(ch.open, ch.open, 1); C.canopy.rotation.set(0, -30 * DEG * smooth(IMP(), 81.5, t), rz * 0.5);
            C.strings.forEach((m, i) => { const ox = [-30, -12, 12, 30][i] * 1.25 * ch.open, a = V(ch.x + ox, hy + 10 + 2, zc), b = V(ch.x + (i < 2 ? -3 : 3), hy - 1, zc);
              const d = b.clone().sub(a); m.visible = true; m.position.copy(a); m.scale.set(1, d.length(), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); });
          }
        }
        // grab points: the art's per-frame boots (charlie_parachute_carry) or the stand-in's boots; yaw-rotated with Charlie
        const yaw = -30 * DEG * smooth(IMP(), 81.5, t), pop = C.hasCarry ? C.pop(t) : 1;
        if (C.hasCarry) C.charlie.scale.set(pop, pop, pop);
        if (t < LAND_J + 0.02) for (const n of ['jade', 'ricky']) {
          const [ox, oy] = C.boot[n]; const bx = ox * pop * Math.cos(yaw), bz = -ox * pop * Math.sin(yaw);
          const free = { x: APEX[n][0], y: APEX[n][1] - 60 * Math.pow(Math.max(0, t - IMP()), 2) };
          const hang = { x: ch.x + bx, y: ch.y + oy * pop };
          const g = C[n]; W.put(g, { x: lerp(free.x, hang.x, k), y: lerp(free.y + 41, hang.y, k), z: zc + bz + (n === 'jade' ? 2 : -2), anim: 'pose', t: t + (n === 'jade' ? 0.3 : 0) });
          g.rotation.set(0, yaw, rz + (C.hasCarry ? (n === 'jade' ? -4 : 4) : (n === 'jade' ? -12 : 12)) * DEG * k);
        }
      }

      // ---- the four chant characters slam in the VOID sky (stroke order, fast), then hang in the 3D sky
      P.chant.forEach((g, i) => {
        const te = CUE.chant[i]; if (t < T.snap(te) - 1e-6) return; g.visible = true;
        const s = t - te; const n = g.hz.vox.strokeCount;
        for (let k = 0; k < n; k++) g.hz.setProgress(k, clamp01((s - k * 0.025) / 0.05));
        const punch = (s < 0.12 ? 1.25 - 0.25 * (s / 0.12) : 1) * 0.8;
        g.scale.setScalar(punch); g.position.set(CH[i][0] - (g.box.w * punch) / 2, CH[i][1] - (g.box.h * punch) / 2, 2);
      });

      roadState(TP, t);
      // ---- Charlie's boomerang hat: a big readable arc out to the next switch, a loop around it (the tag), back to his hand
      const hatPos = (i, ts) => {
        const [a, tag, c] = HAT[i]; const sw = TP.switches[i].position; const chs = heroes(ts).charlie;
        const hand = V(chs.x + 11, 34, chs.z), sp = V(sw.x, sw.y + 44, sw.z);
        if (ts < tag) { const u = (ts - a) / (tag - a); const mid = hand.clone().lerp(sp, 0.5).add(V(0, 46, 40)); return hand.clone().multiplyScalar((1 - u) * (1 - u)).addScaledVector(mid, 2 * u * (1 - u)).addScaledVector(sp, u * u); }
        const u = (ts - tag) / (c - tag); const loop = clamp01(u / 0.3) * Math.PI * 2;
        if (u < 0.3) return sp.clone().add(V(Math.cos(loop) * 13 - 13, 7 * Math.sin(loop), Math.sin(loop) * 13));
        const v = clamp01((u - 0.3) / 0.7); const mid = sp.clone().lerp(hand, 0.5).add(V(0, 36, 44));
        return sp.clone().multiplyScalar((1 - v) * (1 - v)).addScaledVector(mid, 2 * v * (1 - v)).addScaledVector(hand, v * v);
      };
      const hatTrail = [];
      const hf = HAT.find(([a, , c]) => t >= a && t < c);
      if (hf && t >= IMP()) {
        const i = HAT.indexOf(hf); const p = hatPos(i, t);
        W.put(P.boomer, { x: p.x, y: p.y, z: p.z, anim: 'spin', t: t * 2 }); P.boomer.scale.set(2, 2, 2);
        for (let ts = hf[0]; ts < t; ts += 0.035) if (t - ts < 0.3) { const q = hatPos(i, ts); hatTrail.push({ t0: ts, x: q.x, y: q.y, z: q.z, n: 2, speed: 6, up: 2, g: 10, dur: 0.3, seed: Math.round(ts * 1000), colors: ['#ffb02e', '#ffe14d'] }); }
      }
      // ---- Ricky's chord: a beam from the guitar to the switch on the click
      P.beam.visible = false;
      const ci = CLICKS.findIndex((te) => t >= T.snap(te) - 1e-6 && t < te + 0.2);
      if (ci >= 0 && t >= IMP()) {
        const rp = W.heroes.ricky.position; const sw = TP.switches[ci].position; const te = CLICKS[ci];
        P.beam.visible = true; P.beam.set([V(rp.x + 16, 25, rp.z), V(sw.x, sw.y + 43, sw.z)], clamp01((t - te + 0.034) / 0.08), { width: 0.8 });
      }
      // ---- Jade's flick: a short rainbow streak from her pencil to the cypress tip (the tree colours from the tip down)
      const fl = WHISTLE_HITS.find(([te]) => t >= te - 0.02 && t < te + 0.16);
      if (fl && t >= IMP()) {
        const [te, k] = fl; const jp = W.heroes.jade.position.x;
        const a = V(jp + 26, (H.jade.y || 0) + 36, W.heroes.jade.position.z + 2), b = treeTip(k);   // from the rainbow pencil's tip
        P.beam2.visible = true; P.beam2.set([a, b], clamp01((t - te + 0.02) / 0.1), { width: 0.9, colors: ['#ff4d6d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'] });
      }
      // ---- particles: tree sparks, ping pops, road dust, landing dust, drum-block dust, hi-hat chings
      P.sparks.visible = true; P.sparks.run(t, [
        ...hatTrail,
        ...WHISTLE_HITS.map(([te, k], i) => { const p = treeTip(k); return { t0: te + 0.08, x: p.x, y: p.y, z: p.z, n: 14, speed: 50, up: 20, g: 60, dur: 0.6, seed: 10 + i, colors: ['#ff4d6d', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'] }; }),
        ...CLICKS.map((te, i) => { const sw = TP.switches[i].position; return { t0: te, x: sw.x, y: sw.y + 43, z: sw.z, n: 22, speed: 60, up: 30, g: 90, dur: 0.5, seed: 70 + i, colors: ['#ffb02e', '#ffffff', '#3ad06a'] }; }),
        ...(t < IMP() ? CUE.roll.map((te, i) => ({ t0: te, x: TRAMP_X + (i % 2 ? 22 : -22), y: 7, z: 4, n: 4, speed: 34, up: 30, g: 120, dur: 0.22, seed: 90 + i, colors: ['#ffe14d', '#ffffff'] })) : []),
      ]);
      P.burst.visible = true; P.burst.run(t, [
        ...['jade', 'ricky', 'charlie'].map((n, i) => { const tl = n === 'charlie' ? LAND_C : LAND_J; const ch = chuteAt(tl); return { t0: tl, x: ch.x + (n === 'jade' ? 9 : n === 'ricky' ? -10 : 0), y: 0, z: ZOF[n], n: 12, speed: 40, up: 18, g: 120, dur: 0.6, seed: 3 + i, size: 1.2 }; }),
        ...TP.bricks.filter((b) => b.k === 0 || (b.k % (b.c + 1)) === 0).map((b, i) => ({ t0: CUE.roll[b.hit], x: colX(b.c), y: (b.k + 1) * STEP.bh, z: 0, n: 5, speed: 30, up: 30, g: 200, dur: 0.3, seed: 40 + i, size: 0.7 })),
        ...SEGS.slice(1, 4).map(([x0, x1, te], i) => ({ t0: te + 0.05, x: (x0 + x1) / 2, y: 0, z: 0, n: 40, speed: 70, up: 26, g: 140, dur: 0.7, seed: 120 + i, size: 1.6, spread: (x1 - x0) / 2 })),
      ]);
      if (T.exactFrame(t, [IMP()])) fx.flash = 0.35;

      // ---- UI: HUD (+ acting hero) and the build bar; they shatter on the impact (turn_ui.js)
      const chantOn = t >= 79.36 && t < 81.0;
      const slotFlash = act === 'jade' ? T.pulse(tt, CUE.roll, 0.08) : act === 'charlie' ? T.pulse(tt, TRIP, 0.12) : act === 'ricky' ? 0.45 : 0;
      ui.update(t, { singing: { jade: chantOn, charlie: chantOn, ricky: chantOn }, active: t < IMP() ? act : null, slot: act ? 0 : null, slotFlash });
      return { camera, target, focus: V(H.jade.x, 20, 0), look, shadowExtent, virtFov, distOffset: 0, ui2d: { scene: ui.scene, cam: ui.cam }, noSubs: t < IMP() };
    },
  });
  const r0 = sc.render;
  sc.render = (t, target) => { ui.renderPre(); r0(t, target); };
  return sc;
}
