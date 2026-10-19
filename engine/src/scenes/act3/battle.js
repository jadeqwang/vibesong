// ACT III · 107.15-123.354 · THE BUG BATTLE (docs/game_design_acts3-5.md "The battle system", beats 107.15-123.35).
// One scene for both show entries (act3.stage [107.15, 110.41) and act3.rap [110.41, 123.354)): stage.js / rap.js are
// thin wrappers around setupBattle(). Timing source of truth: src/show/battle_ui.js tables (CONVERT, HEARTS, TAGS, ...)
// + act3/common.js CUE. Pure function of t.
//
//   107.15   4-frame battle swirl over verse 2's last image (the verse2 scene itself renders under it: exact seam)
//   107.283  MASTER battle camera (m1): the five bugs in a row on the left, the party on the right, same depth, the stage
//            floor between them; per turn a cut on the half-bar to a medium two-shot (acting hero(s) + target), then master
//   107.615 / 108.195 / 108.835  STOPS: a spotlight slams on each hero, class pose (PAINT / SHIP / RUN), the pool colours the stage
//   109.14   the bugs' synchronized glitch dance; the floor under them flickers to the missing-texture checkerboard
//   110.41   T1 JADE: BUGS cast SYNTAX: six textbooks slam down around the party and topple toward it (domino rhythm);
//            Jade types `> let's dance` with her pencils, ENTER 111.705; the last three land around her (MISS) and take colour
//   112.07   T2 FIREFLY blinks off the beat in Jade's spotlight; eh eh eh (Ricky's chords) lock it; 113.28 Charlie's hat -> LAMP
//   113.68   T3 MOTH dives into Charlie's spotlight (out); Jade colours its wings; flowers spill on 开; 114.95 updraft -> GLIDER
//   115.30   T4 BEETLE loops, grinding glitch rings; 115.6 Jade's graphite 丨 axle; 116.11-116.51 boomerang hooks it -> WHEEL
//   116.88   T5 BOSS: error spots, caterpillar overflow, the glitch wave; 117.23 GUARD (hat shield); the party steps forward;
//            TRIPLE TECH 一笔一画: drafts on 草 118.017 / 稿 118.278, run ring 118.175, hats 118.38, 118.469 BRIDGE, 118.659 BUTTON
//   119.02   VICTORY = THE PAINT FLOOD (kept); the wheel rolls along the wavefront, the glider surfs its crest
//   121.405  RECRUIT: the five features line up facing the party; Charlie presses the ladybug button (YES, 121.745)
//   122.35   band shot, descending onto Act IV's hand-over camera (HANDOFF_123.md); handover(W, t) is exported for Act IV
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { G } from '../../util.js';
import { getWorld, MESA_A, MESA_B, CHASM } from './world/build.js';
import { make3D, CUE, V, aim, persp, pathAt, shotAt, runFrame, smooth, clamp01, LOOK, R5 } from './common.js';
import { makeBattleUI, battleOwnsSubs, swirlFrame, CONVERT, BATTLE, heartsAt } from '../../show/battle_ui.js';
import { getCast, BUG_NAMES } from './battle_cast.js';
import { makeBattleFX } from './battle_fx.js';
import { makeFloodWave, floodK9On, floodRingOn, ringR, K9T, rainbowTip } from './flood_wave.js';   // (flood_k09) the k09 wave, --look k08b only
import { loadMotionClips, MotionFigure, MotionTrack, hold, lipSync } from '../../core/motion/index.js';
import { patchPaint } from './world/paint.js';
import * as LK from '../../look.js';   // (r5) look_r5's per-shot API (r5ShotClear; overrides go through look: { r5 })

const top = MESA_B.top, DISC = top + 6;                      // mesa B top, the stage disc's top
const SC = V(1360, top, 450);                                 // stage centre (props.stageC)
const floorY = (x, z) => (Math.hypot(x - SC.x, z - SC.z) < 46 ? DISC : top);
const ease = (u) => 1 - Math.pow(1 - clamp01(u), 2);
const lerp = (a, b, u) => a + (b - a) * u;

// ------------------------------------------------------------------ the hand-over contract (HANDOFF_123.md)
/** the band at 123.354 (x/z as before; Jade + Charlie now stand ON the stage disc, y 16) */
export const BAND = { jade: V(1378, DISC, 454), charlie: V(1402, DISC, 442), ricky: V(1424, top, 460) };
/** the features at 123.354 (button on the disc edge: y 16). wheel / glider move: see handoverFeature() */
export const BUGP = { ladybug: V(1330, DISC, 458), beetle: V(1306, top, 446), moth: V(1318, top + 22, 436), caterpillar: V(1280, top, 462), firefly: V(1292, top, 470) };
/** phase references of the features' idle loops (Act IV imports these; NOT the conversion times, see battle_ui CONVERT) */
export const FEATURE_T = { ladybug: 118.175, beetle: 118.38, moth: 118.785, caterpillar: 122.22, firefly: 122.62 };
export const PENCIL = V(1354, top, 454);
export const FLOOD = { t0: CUE.flood, c: PENCIL };
export const HANDOVER_CAM = { pos: V(1380, 52, 610), tgt: V(1350, top + 26, 430), fov: 52 };
export const REVEAL = 121.405;
/** Act IV's camera actually renders at fov 45 at the hand-over: act4/main3d.js lookFrom() has its updateProjectionMatrix()
 *  inside a line comment, so the camera keeps its constructor fov (45). Our band shot lands on that so the seam is exact.
 *  (Reported, not fixed: fixing it re-frames every Act IV shot.) */
const ACT4_FOV = 45;

/** the wavefront: a hatched ring bursts from the pencil (119.02), then races to the horizon in ~1.55 s in the aerial */
export function floodRadius(t) {
  const s = t - FLOOD.t0; if (s < 0) return -1;
  if (t < 119.45) return 20 + 180 * Math.pow(s / 0.43, 0.8);
  const u = Math.min(1, (t - 119.45) / 1.55); return 200 + 6800 * Math.pow(u, 1.35) + Math.max(0, t - 121.0) * 4000;
}

// ------------------------------------------------------------------ battle layout (v2: m1 lineup, same depth, floor between)
// The battle line runs along x at z ~494, in front of the stage disc: the bug row on the left (seats + ruins behind it),
// the party on the right (the stage arch behind it). The hand-over spots (BAND / BUGP) are reached during the flood aerial.
const PARTY = { jade: V(1468, top, 496), charlie: V(1494, top, 490), ricky: V(1520, top, 500) };   // ~one hero height of floor from the row
// (v4) the row sits back into the first seat steps on the left; the hovering firefly at the far left, the low caterpillar
// nearest the party, so a clear strip of floor separates the groups on screen
const BUGB = { firefly: V(1284, top, 498), ladybug: V(1306, top, 496), beetle: V(1328, top, 492), moth: V(1350, top, 494), caterpillar: V(1372, top, 496) };
/** top of the amphitheatre seat step at (x, z) (props.js seats: 7 rows, r 70 + 13k, height 4 + 4.5k, arc 0.74π..1.26π) */
function seatY(x, z) { const dx = x - SC.x, dz = z - SC.z, r = Math.hypot(dx, dz); let a = Math.atan2(-dz, dx); if (a < 0) a += 2 * Math.PI;
  if (r < 70 || r >= 161 || a < Math.PI * 0.74 || a > Math.PI * 1.26) return -1e9; return top + 4 + 4.5 * Math.floor((r - 70) / 13); }
for (const p of Object.values(BUGB)) p.y = Math.max(floorY(p.x, p.z), seatY(p.x, p.z));
BUGB.firefly.y += 6;                                          // the firefly hovers
const CFRONT = V(1422, top, 514);                             // Charlie's GUARD spot (in front of Jade, toward the boss pair)
const FORWARD = { jade: V(1404, top, 528), charlie: CFRONT, ricky: V(1440, top, 518) };   // 117.3-117.65 the party steps forward
const BOSS = { ladybug: V(1298, top, 534), caterpillar: V(1352, top, 538) };              // they advance out of the row (116.88)
const SIDE = { firefly: V(1502, top, 444), beetle: V(1530, top, 544), moth: V(1500, top + 70, 436) };   // converted features join the party side
const CHARLIE_PRESS = V(1314, top, 482);                       // beside the button (upstage), where Charlie waits from the recruit cut
const JADE_PENCIL = V(1368, DISC, 462);                       // Jade leaps to the giant pencil as it comes down (118.75-118.95)
const FIREFLY_LAND = V(1442, top, 514);                       // in front of Jade, in her spotlight pool, where the cap lands
const LOOP = V(1430, top, 542);                               // the beetle's loop centre (downstage of the gap)
const W_DIR = new THREE.Vector3(-0.99, 0, -0.12).normalize();  // wheel: rides this ray from the flood centre at 119
const G_DIR = new THREE.Vector3(-0.55, 0, -0.835).normalize(); // glider surfs the crest toward the aerial camera's target
// ---------------------------------------------------------------- (r5) the encounter (docs/game_design_half2_r5.md 107.15-110.41)
// The firefly, beetle and moth are already waiting in the row when the party lands; the ladybug rides Charlie's cap (talos_r5
// hands it over at 107.15), hops off as he lands (107.433-107.567, four frames), lands in front of the party and pops to battle
// size on the frame before Jade's stop; the caterpillar spills over the amphitheatre's top step (behind the rim) and keeps
// coming (overflow 0 -> 6) until it reaches its slot in the row at 109.1. Three `!`s, the swirl, the stops (k08) are kept.
const R5_HOP = [107.433, 107.567];                            // the ladybug's hop off the cap (launch frame 3223, landing 3227)
const R5_LADY_LAND = V(1384, top, 506);                       // where it lands: (v4b) at the front of the row, out of the band shot (was 1438, 508: in front of the party)
const R5_CAT_PATH = [[107.1, V(1190, top, 434)], [107.3, V(1218, top, 440)], [108.3, V(1292, top, 480)], [109.1, V(1372, top, 496)]];   // behind the rim -> over the top step -> down the seats -> its slot
const R5_HOLD = 2;
// ---------------------------------------------------------------- (v4b stage_3d) 1:47 "A BAND ON A STAGE" (target assets/v4_stills/08_band_on_stage_0147.png)
// 世界 (107.15) opens on the paper card 05 (act3/card05.js, 107.15-107.615: the band in three paper spotlights) over the party's
// landing on the stage front (between the disc and the arch), facing the seats; on Jade's stop (107.615) ONE front-on medium
// three-shot (Charlie left, Jade centre singing into her pencil, Ricky right), held without a cut to the rap downbeat 110.41: a
// coloured spotlight slams onto each member on its stop (gold Jade 107.615, rose Charlie 108.195, teal Ricky 108.835). The type
// unit's 舞台 (109.09-110.41) sits in the clean top left / top right (the sky beside the arch columns), its gloss top centre.
// At 110.41 the T1 cut puts them back on the battle line.
const BAND_T = [107.2, 110.45];   // (to the 8th 110.45: the T1 cut moves onto the grid, CUE.rap 110.41 was 40-50 ms early of it)
const BAND_CUT = 107.641;          // card 05 -> the band shot on the beat (Jade's stop 107.615 lands under the card's last frame)
const T1_CUT = 110.45;
const STAGEB = { charlie: V(1426, top, 402), jade: V(1414, top, 432), ricky: V(1426, top, 462) };
const BAND_COL = ['#ffc24a', '#ff5fae', '#3fd6e6'];          // spot colours on the band: gold (Jade), rose (Charlie), teal (Ricky)
const bandOn = (t) => t >= BAND_T[0] && t < BAND_T[1];
const BAND_KEY = { keyAz: 158, keyElev: 22 };
// (v4b M2, coordinator) a stage only reads dark around the light: ambient / hemisphere / env / haze / bloom down, the sky and the arch
// pulled down, so the three cones and pools carry the frame; the faces are lit by their spots + a small hero fill
const BAND_LOOK = { dim: 0.32, hemi: 0.4, envInt: 0.28, fill: 0.25, atmos: 0.12, rays: 0, bloomAmt: 0.07, exposure: 0.62, heroFill: 0.34, heroRim: 0.7, sat: 1.22 };
const BAND_R5 = { sunGain: 0.4, hemiGain: 0.4, skyGain: 0.5, lift: 0.0, vignette: 0.55, warm: 0.2 };                // the sun turned behind the seats' camera (front-lit faces; the stage's own key is ahead = backlight)                                            // the conversion hit-stop: frames held before each conversion frame
// (r5) JRPG grammar: the acting hero steps up to the target for the turn (so the over-the-shoulder camera has him nearest the bug)
const R5_C_T2 = V(1482, top, 534);                            // Charlie, beside Jade's pool, 40 u from the firefly (the cap throw)
const R5_C_T4 = V(1472, top, 558);                            // Charlie, 42 u from the beetle's loop (the boomerang)
// (flood_k09, --look k08b) the k09 flood: staging. The wave's tall sector runs toward the amphitheatre seats (left-back of the
// hero camera); Jade steps in to sketch the drafts, leaps to the falling pencil (lands on the beat 118.927), lifts it, drives it in
// on 119.02 and leans on it while the wave curls; Ricky + Charlie play on the right; the wheel rolls along the wave's foot, the
// glider surfs the crest. 120.135 (bar 73) the race to the horizon. Hand-over at 121.405 unchanged.
const K9_PSI = 150 * Math.PI / 180;                                 // the hero wave's spine: from the pencil toward the front-left (over the seats)
const K9_S = V(Math.cos(K9_PSI), 0, Math.sin(K9_PSI)), K9_D = V(Math.sin(K9_PSI), 0, -Math.cos(K9_PSI));   // spine / travel (lip) directions
const K9_RACE = Math.atan2(-0.83, -0.56);
const K9_WIDE = 120.94;                                             // the race cuts to the high wide on this beat (= K9T.wide)
const K9_SWEEP = [128 * Math.PI / 180, 172 * Math.PI / 180];       // the hero wave's spine sweeps over this bearing range                           // the race camera looks out this way (mesa A, the meadow, the hills)
const K9_STANCE = V(PENCIL.x + 24, DISC, PENCIL.z - 14);   // right of / behind the pencil (on screen): facing it, she faces the hero camera 3/4
const K9_PUSH = V(PENCIL.x - K9_STANCE.x, 0, PENCIL.z - K9_STANCE.z).normalize();                     // she leans the pencil this way
// (v4b stage_3d) the ring flood's cameras: front-on from beyond the pencil on Jade's line (she faces it), cut on the beat before the
// plant; the wave passes the lens when ringR(t) = d (~119.6); the high pass shot from the next beat
// She faces the way she jumps (MotionTrack: the landing keeps the jump heading until ~119.15), so the lens is put on her jump line:
// she leaps from FORWARD.jade to RSTANCE (just behind the pencil, screen right of it) and lands facing the camera.
const _rs = (() => { let st = PENCIL.clone(); for (let i = 0; i < 3; i++) { const cd = V(st.x - FORWARD.jade.x, 0, st.z - FORWARD.jade.z).normalize(); const right = V(-cd.z, 0, cd.x).negate();
  st = PENCIL.clone().addScaledVector(cd, -12).addScaledVector(right, 8); } return st; })();
const RSTANCE = _rs.setY(DISC);
const JDIR = V(RSTANCE.x - FORWARD.jade.x, 0, RSTANCE.z - FORWARD.jade.z).normalize();   // her facing on landing = toward the lens
const RCAM = RSTANCE.clone().addScaledVector(JDIR, 122).setY(0);       // where the front-on camera stands (ground plan)
const RLAT = V(-JDIR.z, 0, JDIR.x);                                    // screen LEFT in the front-on camera (= -(f x up), f = -JDIR)
const RING_T = { front: 118.927, pass: 119.732, d: Math.hypot(RCAM.x - PENCIL.x, RCAM.z - PENCIL.z) };
const RPUSH = RLAT.clone().multiplyScalar(0.9).addScaledVector(JDIR, 0.3).normalize();   // the pencil leans across her body to screen left
let RINGM = false;                                                   // set by setupK9 (floodRingOn)
const pushDir = () => (RINGM ? RPUSH : K9_PUSH);

// ------------------------------------------------------------------ times (battle_ui.js tables + CUE)
const ENC = BATTLE.enc, OPEN = BATTLE.open, STOPS = CUE.stops, TAUNT = BATTLE.enemiesIn, T1 = CUE.rap, ENTER = 111.705;
const FALL = [110.75, 111.0, 111.25, 111.705, 112.33, 112.56];
const SENT_CUT = 113.885, SENT_OTS = 114.492;   // (v4b) front-on Jade 113.885 -> the beat 114.492, then the OTS   // (v4b) the T3 party-half cut on the 8th grid (was SENT 113.82, the sung onset: 52 ms off)
const T2 = 112.07, EH = CUE.eh, T3 = 113.68, SENT = 113.82, KAI = 114.998, T4 = 115.30, AXLE = 115.6, BOOM = [116.11, 116.51];
const T5 = 116.88, OVER = 117.05, GUARD = 117.23, STEP = [117.3, 117.65], CAO = 118.017, RUN_RING = 118.175, GAO = 118.278, HATS = 118.38;
const CONV = Object.fromEntries(CONVERT.map(([t, id]) => [id, t]));
const YES = BATTLE.recruit.yes, BANDSHOT = 122.35, END = CUE.end;
const JOINT = Object.fromEntries(BATTLE.recruit.order.map((b, i) => [b, BATTLE.recruit.joins[i]]));   // (v4b) each feature's join 8th

// ------------------------------------------------------------------ books: SYNTAX spell (an upstage arc around Jade, toppling toward her)
const BOOK_A = [230, 248, 266, 284, 302, 320].map((d) => d * Math.PI / 180);
const BOOK_R = 100, BOOK_IN = 110.41;
/** pose of book i at fall progress phi (0 standing .. 1 flat): position + quaternion (rotation order YXZ) */
export function bookPose(i, phi, h = 66, out = { p: new THREE.Vector3(), q: new THREE.Quaternion() }) {
  const a = BOOK_A[i], J = PARTY.jade;
  const ray = V(Math.cos(a), 0, Math.sin(a));
  const base = V(J.x + ray.x * BOOK_R, 0, J.z + ray.z * BOOK_R); base.y = floorY(base.x, base.z);
  const yaw = Math.atan2(-Math.cos(a), -Math.sin(a));           // local +z -> toward Jade
  const qY = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(phi * Math.PI / 2, yaw, 0, 'YXZ'));
  const c = V(0, 0, 7);                                         // tip over the front-bottom edge
  out.p.copy(base).add(V(22, 0, 0).applyQuaternion(qY)).add(c.clone().applyQuaternion(qY)).sub(c.clone().applyQuaternion(q));
  out.q.copy(q); return out;
}
function placeBooks(P, t) {
  if (t >= REVEAL) { handoverBooks(P); return; }                 // the recruit cut: books where Act IV has them
  const tmp = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
  P.books.forEach((b, i) => {
    const tIn = BOOK_IN + 0.04 * i; if (t < tIn) return;
    b.visible = true; b.rotation.order = 'YXZ';
    const u = clamp01((t - FALL[i] + 0.24) / 0.24); let phi = u * u;
    if (u >= 1) phi = 1 - 0.03 * Math.exp(-(t - FALL[i]) * 9) * Math.abs(Math.sin((t - FALL[i]) * 30));
    bookPose(i, phi, b.userData.h, tmp);
    const drop = t < tIn + 0.14 ? 120 * Math.pow(1 - (t - tIn) / 0.14, 2) : 0;   // slam down from the sky on the cast
    b.position.copy(tmp.p).add(V(0, drop, 0)); b.quaternion.copy(tmp.q);
  });
}
/** the books from the recruit on (and in Act IV's first frames): Act IV's original domino layout, coloured */
function handoverBooks(P) {
  P.books.forEach((b, i) => { b.visible = true; b.rotation.order = 'XYZ'; b.position.set(1130 + i * 52, top, 302);
    b.rotation.set(0, 0, -(i === P.books.length - 1 ? Math.PI / 2 : Math.PI / 2 - 0.35)); });
}

// ------------------------------------------------------------------ the hand-over state (also Act IV's first 2.4 s)
/** feature placement at t >= ~122.35 (identical to act4 main3d handoverState, plus the button's disc height) */
export function handoverFeature(b, t) {
  const p = BUGP[b], k = t - FEATURE_T[b]; const s = { x: p.x, y: b === 'ladybug' ? DISC : top, z: p.z, pose: 'feature', u: 1, t, rotY: 0, facing: 1 };
  if (b === 'beetle') s.x = p.x - 40 * Math.min(1, k / 1.2);
  if (b === 'firefly') s.glow = 1;
  if (b === 'moth') { const a = k * 1.6; s.x = 1320 + 40 * Math.cos(a); s.z = 440 + 20 * Math.sin(a); s.y = top + 46 + 6 * Math.sin(a * 2); s.facing = Math.sin(a) > 0 ? -1 : 1; }
  return s;
}
export function handoverBand(t) {
  const bp = T.beatPulse(t, 1, 0.1); const out = {};
  for (const n of ['jade', 'charlie', 'ricky']) { const p = BAND[n];
    out[n] = { x: p.x, y: p.y + 3 * bp, z: p.z, anim: n === 'jade' ? 'sing' : n === 'ricky' ? 'sustain' : 'idle', frame: n === 'jade' ? Math.floor(T.beatAt(t) * 2) % 2 : null, t, pencil: n === 'jade', rotY: 0, facing: -1 }; }
  return out;
}
/** props at the hand-over: the six fallen books (Act IV's original layout), the planted giant pencil. No monolith. */
export function handoverProps(W) {
  const P = W.props; handoverBooks(P);
  P.pencil.visible = true; P.pencil.position.set(PENCIL.x, top - 6, PENCIL.z); P.pencil.rotation.set(0, 0, -0.08);
}
/** Act IV: call this instead of its local handoverState(t) for t in [123.354, bridge accent). Places band, features, props. */
export function handover(W, t, ctx = { width: 1920, height: 1080 }) {
  const cast = getCast(W, ctx);
  if (t === null || t === undefined || t >= 125.769) { cast.hide(); return; }   // bridge accent: the stage is gone
  cast.show();
  for (const [n, s] of Object.entries(handoverBand(t))) putHero(W, W.heroes[n], s);
  for (const b of BUG_NAMES) cast.setBugState(b, handoverFeature(b, t));
  handoverProps(W);
}

/** W.put plus Charlie's hat flag (W.put does not forward it) */
function putHero(W, g, s) {
  if (s.visible === false) { g.visible = false; return g; }
  g.visible = true;
  const o = { anim: s.anim, t: s.t ?? 0, frame: s.frame ?? null, pencil: !!s.pencil, facing: s.facing ?? 1, x: s.x, y: s.y };
  if (s.hat !== undefined) o.hat = s.hat;
  g.set(o); g.position.z = s.z ?? 0; g.rotation.y = s.rotY ?? 0; return g;
}

// ================================================================== the scene
export async function setupBattle(ctx, { withVerse2 = false } = {}) {
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const v2 = withVerse2 ? await (await import('./verse2.js')).setup(ctx) : null;   // renders under the 4 swirl frames (exact seam)
  const bui = await makeBattleUI(ctx);
  const cast = getCast(W, ctx);
  const FX = makeBattleFX(W);
  const k9 = floodK9On() ? await setupK9(W, ctx) : null;   // (flood_k09) null on the default path: nothing below changes
  // (v4b H12) the stage spotlights' cones (additive) and pools (blended) cannot carry the alpha mask: named + tagged for a later colour wave
  P.spots.forEach((sp, i) => { sp.cone.name = 'cs:stage_cone_' + i; sp.pool.name = 'cs:stage_pool_' + i; sp.cone.userData.cs = sp.pool.userData.cs = 1; });
  const r5 = R5();                                          // (r5) round-5 staging; false = the approved v4/k09 path, byte-identical
  /** (r5) the conversion hit-stop: the world (heroes, bugs, fx) holds the frame R5_HOLD frames before each conversion frame, the
   *  conversion itself lands on its frame (the silhouette flash fills the held frames). Camera / UI / particles run on real t. */
  function hitStop(t) { if (!r5) return t; const f = Math.round(t * T.fps());
    for (const [tc] of CONVERT) { const fc = T.frameOf(tc); if (f >= fc - R5_HOLD && f < fc) return (fc - R5_HOLD) / T.fps(); } return t; }
  const lpOf = (m) => m.userData.lp;
  const matsOf = (obj) => { const out = new Set(); obj.traverse((o) => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) if (m.userData?.lp) out.add(m); }); return [...out]; };
  const bookMats = P.books.map(matsOf), archMats = matsOf(P.arch);
  const topB = lpOf(W.mesaB.userData.tops.material), stageLP = lpOf(P.stageMat), seatLP = lpOf(P.seatMat);
  const _box = new THREE.Box3();
  /** world point just above a hero's head (works for carve and native figures at any --figscale) */
  const headTop = (g, out) => { _box.setFromObject(g); return out.set(g.position.x, Number.isFinite(_box.max.y) ? _box.max.y : g.position.y + 52, g.position.z); };
  // (v4b stage_3d) the band shot: Jade's free arm + her mouth (native rig only; set AFTER putHero: pose() resets them)
  const mouth27 = lipSync(T.raw().lyrics, { lines: [27] });
  const figOf = (g) => { for (const o of g.children[0]?.children || []) if (o.visible && o.userData.F) return o.userData.F; return null; };
  function bandJade(t) {
    const F = figOf(W.heroes.jade); if (!F) return; const J = F.J;
    const k = smooth(STOPS[0] - 0.02, STOPS[0] + 0.1, t);   // the fling lands with her spotlight
    if (k > 0 && J.shoulderL) { const d = Math.PI / 180; J.shoulderL.rotation.set((38 + 78 * k) * d, 0, (-10 + 18 * k) * d); if (J.elbowL) J.elbowL.rotation.set(0, 0, (25 + 10 * k) * d); }
    if (F.setFace) { const w = mouth27(t); let best = 'rest', bw = 0; for (const q in w) if (q !== 'rest' && w[q] > bw) { bw = w[q]; best = q; } F.setFace({ viseme: bw > 0.3 ? best : 'rest' }); }
  }
  const anchors = {}; const AV = Object.fromEntries([...BUG_NAMES, 'jade', 'charlie', 'ricky'].map((k) => [k, new THREE.Vector3()]));

  // ---------------------------------------------------------------- heroes
  function heroesAt(t) {
    const H = {}; const bp = T.beatPulse(t, 1, 0.1); const beat = T.beatAt(t);
    const yaw = t < BANDSHOT ? 0.42 : 0.42 * (1 - smooth(BANDSHOT, BANDSHOT + 0.45, t));
    const base = (n, p) => ({ x: p.x, y: p.y, z: p.z, anim: 'idle', t, pencil: n === 'jade', facing: -1, rotY: yaw });
    // home: the battle line; the party steps forward on 也不怕; back on the hand-over spots during the flood aerial (unseen)
    const fw = smooth(STEP[0], STEP[1], t), back = k9 ? smooth(120.3, 121.1, t) : smooth(119.6, 120.4, t);
    const jp = smooth(118.75, 118.95, t);
    const home = (n) => PARTY[n].clone().lerp(FORWARD[n], n === 'charlie' ? 0 : fw).lerp(n === 'jade' ? JADE_PENCIL : FORWARD[n], n === 'jade' ? jp : 0).lerp(n === 'charlie' ? CHARLIE_PRESS : BAND[n], back);
    for (const n of ['jade', 'charlie', 'ricky']) H[n] = base(n, home(n));
    H.jade.anim = 'sing'; H.jade.frame = Math.floor(beat * 2) % 2; H.ricky.anim = 'sustain'; H.charlie.y += 2 * bp;

    // 107.283 drop onto the stage (the swirl hides the trip from the bridge)
    if (t < 107.5) { const u = clamp01((t - 107.2) / 0.28); for (const n of ['jade', 'charlie', 'ricky']) { H[n].y += 70 * Math.pow(1 - u, 2); if (u < 1) { H[n].anim = n === 'jade' ? 'run' : 'jump'; H[n].frame = 1; } } }
    // STOPS: class pose under the slammed spotlight, held through the stop
    if (t >= STOPS[0] && t < TAUNT) { H.jade.anim = 'draw_rainbow'; H.jade.frame = 0; H.jade.t = 0; }
    if (t >= STOPS[1] && t < TAUNT) { H.charlie.anim = 'throw'; H.charlie.frame = 1; H.charlie.hat = true; }
    if (t >= STOPS[2] && t < TAUNT) { H.ricky.anim = 'chord'; H.ricky.frame = 1; }
    if (t >= 107.5 && t < STOPS[0]) { H.ricky.anim = 'idle'; }
    if (t >= TAUNT && t < T1) { H.ricky.anim = 'idle'; }
    // T1: menu, typing with the pencils (drumsticks), ENTER
    if (t >= 111.24 && t < ENTER) { H.jade.anim = 'drum'; H.jade.frame = Math.floor(beat * 4) % 2; }
    if (t >= ENTER && t < ENTER + 0.3) { H.jade.anim = 'draw_rainbow'; H.jade.t = t - ENTER; H.jade.frame = null; }
    if (t >= T1 && t < T2) H.ricky.anim = 'idle';
    // T2: Ricky's three chords; Charlie tosses his cap onto the firefly
    if (t >= EH[0] - 0.05 && t < 113.1) { H.ricky.anim = 'chord'; H.ricky.frame = EH.filter((e) => T.on(t, e)).length % 2; }
    if (t >= 112.84 && t < 113.1) { H.charlie.anim = 'throw'; H.charlie.frame = null; H.charlie.t = t - 112.84; }
    const hatless = t >= 112.95 && t < 115.98; if (hatless) H.charlie.hat = false;
    // (r5) Charlie steps up to the firefly (T2) and to the loop (T4) for his throws, and back for the next turn
    if (r5) for (const [p1, tgt, t0, t1, t2, t3] of [[R5_C_T2, FIREFLY_LAND, 112.1, 112.32, 113.5, 113.68], [R5_C_T4, LOOP, 115.3, 115.54, 116.7, 116.9]]) if (t >= t0 && t < t3) {
      const k = smooth(t0, t1, t) * (1 - smooth(t2, t3, t)); const p = PARTY.charlie.clone().lerp(p1, k); H.charlie.x = p.x; H.charlie.z = p.z;
      const out = t < t1, back = t >= t2; if (out || back) { H.charlie.anim = 'run'; H.charlie.frame = runFrame(t, 6, 3); }
      const d = out ? p1.clone().sub(PARTY.charlie) : back ? PARTY.charlie.clone().sub(p1) : tgt.clone().sub(p);
      H.charlie.facing = 1; H.charlie.rotY = Math.atan2(-d.z, d.x); }
    // T3: Jade colours the moth's wings; Ricky's sustain = the updraft
    if (t >= SENT && t < 114.62) { H.jade.anim = 'draw_rainbow'; H.jade.frame = null; H.jade.t = t - SENT; H.jade.rotY = 0.15; }
    if (t >= T3 && t < 114.5) H.ricky.anim = 'idle';
    // T4: the axle; Charlie pulls a fresh cap out of the hat, throws the boomerang
    if (t >= AXLE - 0.12 && t < AXLE + 0.28) { H.jade.anim = 'draw_graphite'; H.jade.frame = null; H.jade.t = t - AXLE + 0.12; H.jade.rotY = 1.0; }
    if (t >= 115.7 && t < 115.98) { H.charlie.anim = 'pull'; H.charlie.t = t - 115.7; H.charlie.hat = false; }
    if (t >= 115.98 && t < 116.26) { H.charlie.anim = 'throw'; H.charlie.frame = null; H.charlie.t = t - 115.98; H.charlie.rotY = 1.0; }
    if (t >= BOOM[0] && t < 116.78) H.charlie.hat = false;
    if (t >= T4 && t < T5) H.ricky.anim = 'idle';
    // T5: Charlie hops in front with the cap shield; GUARD; all step forward; the triple tech
    if (t >= 116.92) {
      const u = clamp01((t - 116.92) / 0.2); const p = PARTY.charlie.clone().lerp(CFRONT, u).lerp(PARTY.charlie, smooth(117.55, 117.85, t)).lerp(CHARLIE_PRESS, back);
      H.charlie.x = p.x; H.charlie.z = p.z; H.charlie.y = p.y + 2 * bp + 16 * Math.sin(Math.PI * u) * (u < 1 ? 1 : 0);
      if (t < STEP[1]) { H.charlie.anim = t < 117.5 && u >= 1 ? 'shield' : u < 1 ? 'jump' : 'idle'; H.charlie.frame = 1; H.charlie.hat = undefined; }
    }
    if (t >= STEP[0] && t < STEP[1]) { H.jade.anim = 'run'; H.jade.frame = runFrame(t, 2, 2); H.ricky.anim = 'run'; H.ricky.frame = runFrame(t, 6, 3); }
    if (t >= T5 && t < STEP[0]) { H.ricky.anim = 'idle'; }
    // the triple tech: Jade sketches each draft (pencil toward the bug), Ricky's ring, Charlie's caps
    for (const [te, b] of [[CAO, 'ladybug'], [GAO, 'caterpillar']]) if (t >= te - 0.04 && t < te + 0.24) {
      const d = BOSS[b].clone().sub(FORWARD.jade); H.jade.anim = 'draw_graphite'; H.jade.frame = null; H.jade.t = t - te + 0.04; H.jade.facing = 1; H.jade.rotY = Math.atan2(-d.z, d.x); }
    if (t >= RUN_RING - 0.03 && t < RUN_RING + 0.25) { H.ricky.anim = 'chord'; H.ricky.frame = 1; }
    if (t >= HATS - 0.12 && t < HATS + 0.2) { H.charlie.anim = 'throw'; H.charlie.frame = null; H.charlie.t = t - HATS + 0.12 + 0.15; H.charlie.hat = true; }
    // 118.75 the giant pencil comes down on Jade's gesture
    if (t >= 118.75 && t < 118.95) { H.jade.anim = 'run'; H.jade.frame = 1; H.jade.y += 26 * Math.sin(Math.PI * smooth(118.75, 118.95, t)); H.jade.facing = 1; H.jade.rotY = Math.atan2(-(JADE_PENCIL.z - FORWARD.jade.z), JADE_PENCIL.x - FORWARD.jade.x); }
    if (t >= 118.95 && t < 119.6) { H.jade.anim = 'draw_rainbow'; H.jade.frame = null; H.jade.t = t - 118.95; H.jade.rotY = 0.6; }
    // the flood: victory (aerial; tiny)
    if (t >= (k9 ? K9T.race0 : 119.6) && t < REVEAL) { H.ricky.anim = 'victory'; H.charlie.anim = 'jump'; H.charlie.frame = Math.floor(beat) % 2; }
    // (k09) the hero shot: Ricky and Charlie play on the right (strums on the 8ths); Jade is the motion-system figure
    if (k9 && t >= 118.6 && t < K9T.race0) { H.ricky.anim = 'chord'; H.ricky.frame = Math.floor(beat * 2) % 2; H.charlie.anim = 'chord'; H.charlie.frame = Math.floor(beat * 2 + 1) % 2; H.charlie.hat = true; }
    if (k9 && t >= 117.65 && t < K9T.race0) H.jade.visible = false;
    // RECRUIT: Charlie waits by the button (he went there in the aerial), presses it on YES, walks back; Jade + Ricky react
    if (t >= REVEAL && t < 122.62) {
      const via = V(1372, DISC, 486); const C0 = BAND.charlie, C1 = CHARLIE_PRESS;
      let p = C1.clone(), anim = 'idle', facing = -1, fr = null, ct = t;
      if (t >= 121.66 && t < 122.0) { anim = 'pull'; ct = Math.min(0.12, t - 121.66); }
      else if (t >= 122.0) { const u = smooth(122.0, 122.55, t); p = u < 0.5 ? C1.clone().lerp(via, u * 2) : via.clone().lerp(C0, u * 2 - 1); anim = u < 1 ? 'run' : 'idle'; fr = u < 1 ? runFrame(t, 6, 3) : null; facing = u < 1 ? 1 : -1; }
      H.charlie = { ...H.charlie, x: p.x, y: p.y, z: p.z, anim, frame: fr, t: ct, facing, hat: true, rotY: anim === 'pull' ? 0 : facing > 0 ? 0 : H.charlie.rotY };
      if (t < 122.0) H.charlie.facing = 1;   // he faces the button (+x) while he waits and presses
      const hopJ = T.pulse(t, [REVEAL + 0.05, YES + 0.05], 0.25); H.jade.y += 7 * hopJ;
      if (t >= YES && t < YES + 0.3) { H.ricky.anim = 'chord'; H.ricky.frame = 1; }
    }
    // band shot: exactly the hand-over state (Act IV continues it)
    if (t >= 122.62) { const hb = handoverBand(t); for (const n of ['jade', 'charlie', 'ricky']) H[n] = { ...hb[n], rotY: yaw }; }
    // (v4b stage_3d) the band on the stage front, facing the seats (-x); they drop in on the swirl's landing (107.2-107.48)
    if (r5 && bandOn(t)) {
      const u = clamp01((t - 107.2) / 0.28); const drop = 70 * Math.pow(1 - u, 2); const e8 = Math.floor(beat * 2);
      for (const n of ['jade', 'charlie', 'ricky']) { const p = STAGEB[n]; H[n] = { ...H[n], x: p.x, y: floorY(p.x, p.z) + drop, z: p.z, facing: -1, rotY: n === 'charlie' ? 0.26 : n === 'ricky' ? -0.26 : 0, frame: null }; }
      H.jade.anim = 'sing'; H.jade.pencil = true; H.jade.t = t;
      H.charlie.anim = 'chord'; H.charlie.frame = e8 % 2; H.charlie.hat = true;
      H.ricky.anim = 'chord'; H.ricky.frame = (e8 + 1) % 2;
      if (u < 1) { H.jade.anim = 'run'; H.jade.frame = 1; H.charlie.anim = 'jump'; H.charlie.frame = 1; H.ricky.anim = 'jump'; H.ricky.frame = 1; }
      return H;
    }
    // feet on the floor they stand on (disc / mesa)
    for (const n of ['jade', 'charlie', 'ricky']) { const fy = floorY(H[n].x, H[n].z); const base0 = home(n).y; if (Math.abs(H[n].y - base0) < 3.5 && t >= 107.5) H[n].y += fy - base0; }
    return H;
  }

  // ---------------------------------------------------------------- the flood riders (pure in t)
  function wheelRide(t) { const r = Math.min(780, Math.max(72, floodRadius(t) + 6)); const p = PENCIL.clone().addScaledVector(W_DIR, r);
    p.y = p.x > CHASM.x0 && p.x < CHASM.x1 ? top + 1.5 : top; return p; }
  function gliderRide(t) { const r = Math.max(40, floodRadius(t) + 14); const p = PENCIL.clone().addScaledVector(G_DIR, r);
    const gy = p.z < -24 ? W.groundY(p.x, p.z) : p.z < 24 ? 0 : top; p.y = Math.max(top, gy) + 34 + 6 * Math.sin(t * 5); return p; }
  // ---------------------------------------------------------------- bugs / features
  function bugsAt(t, beat) {
    const S = {}; const Y3 = -0.55;                              // 3/4 yaw: faces turn from the party (+x) toward the camera (+z)
    const morphU = (b) => (b === 'ladybug' || b === 'caterpillar') ? clamp01((t - CONV[b] + 0.02) / 0.4)   // drafted: under the caps
      : r5 ? clamp01((t - CONV[b]) / 0.22)                        // (r5) the card: the flight starts ON the conversion frame, 0.22 s
      : b === 'firefly' ? clamp01((t - CONV[b] + 0.05) / 0.45)    // after the cap lands on top
      : clamp01((t - CONV[b] + 0.3) / 0.6);                       // voxel flight centred on the UI's BUG -> FEATURE swap
    const hop = (from, to, t0, t1, apex = 30) => { const u = smooth(t0, t1, t); const p = from.clone().lerp(to, u); p.y += apex * Math.sin(Math.PI * u); return p; };
    for (const b of BUG_NAMES) {
      const p = BUGB[b]; const waiting = r5 && b !== 'ladybug' && b !== 'caterpillar';   // (r5) already there when the party lands
      const ti = waiting ? OPEN - 1 : OPEN + 0.04 + 0.05 * BUG_NAMES.indexOf(b);
      const u = waiting ? 1 : clamp01((t - ti) / 0.3);
      const s = { x: p.x, y: p.y + 110 * Math.pow(1 - u, 2), z: p.z, pose: 'idle', t, facing: 1, rotY: Y3 };
      if (t < ti) s.visible = false;
      if (!waiting && u >= 1 && t < ti + 0.45) { const k = (t - ti - 0.3) / 0.15; s.scale = 1 + 0.15 * Math.sin(Math.PI * clamp01(k)); }
      // 109.14 taunt: synchronized glitch dance (beat-locked upright dance + a hop; they turn to the camera on the 8ths)
      if (t >= TAUNT && t < T1) { s.pose = 'dance'; s.y = p.y + 4 * Math.abs(Math.sin(Math.PI * beat)); s.rotY = Math.floor(beat * 2) % 2 ? -1.2 : Y3; }
      // after "> let's dance": they sway (dance) until their turn
      if (t >= ENTER && t < CONV[b]) { s.pose = 'dance'; }
      if (morphU(b) > 0) s.u = morphU(b);
      S[b] = s;
    }
    // ---- (r5) the encounter: the ladybug lands in front of the party and pops to battle size, glares through the intros, hops
    //      back to its row slot for the dance; the caterpillar spills over the top step and keeps coming
    if (r5 && t < TAUNT + 0.1) {
      { const s = S.ladybug; const L1 = R5_HOP[1];
        if (t < L1) s.visible = false;
        else { s.visible = true; s.pose = 'bug'; s.rotY = -0.35;
          const k = clamp01((t - L1) / 0.14); s.scale = 0.3 + 0.7 * ease(k) + 0.3 * Math.sin(Math.PI * clamp01((t - L1 - 0.04) / 0.26));
          const p = hop(R5_LADY_LAND, BUGB.ladybug, 108.95, 109.2, 30); s.x = p.x; s.y = p.y; s.z = p.z; s.flash = t < L1 + 0.5 ? 1 : undefined;
          if (t >= 108.95) { s.pose = 'dance'; s.rotY = Y3; } } }
      { const s = S.caterpillar; const P0 = R5_CAT_PATH[0][0], P1 = R5_CAT_PATH[R5_CAT_PATH.length - 1][0];
        if (t < P0) s.visible = false;
        else if (t < P1) { const p = pathAt(t, R5_CAT_PATH), q = pathAt(t + 0.05, R5_CAT_PATH); s.visible = true;
          s.x = p.x; s.z = p.z; s.y = Math.max(floorY(p.x, p.z), seatY(p.x, p.z)); s.pose = 'bug'; s.overflow = Math.min(6, Math.floor((t - P0) / 0.25));
          s.rotY = Math.atan2(-(q.z - p.z), q.x - p.x); } }
    }
    // ---- FIREFLY (T2): into Jade's spotlight, blinks OFF the beat (its bug loop); eh eh eh locks it ON the beat; cap -> LAMP
    { const s = S.firefly; const fp = BUGB.firefly; const land = FIREFLY_LAND.clone().add(V(0, 4, 0));
      if (t >= T2 - 0.2) { const p = hop(fp, land, T2 - 0.2, T2 + 0.15, 16); Object.assign(s, { x: p.x, y: p.y + (t < 112.9 ? 2 * Math.sin(t * 9) : 0), z: p.z, pose: 'bug', rotY: -0.9 }); }
      if (t >= EH[2] && t < CONV.firefly) { s.pose = 'idle'; s.blink = T.beatPulse(t, 1, 0.14); s.glow = s.blink; }
      if (t >= CONV.firefly + (r5 ? 0.22 : 0.3)) s.glow = 1;
      if (t >= 113.62) { const p = hop(land.clone().setY(FIREFLY_LAND.y), SIDE.firefly, 113.62, 114.05, 44); Object.assign(s, { x: p.x, y: p.y, z: p.z, rotY: -0.4 }); }
    }
    // ---- MOTH (T3): dives into Charlie's spotlight (bonk), flutters to Jade, is coloured, the updraft lifts it -> GLIDER
    { const s = S.moth; const mp = BUGB.moth; const lamp = spotLamp(1, PARTY.charlie).add(V(0, -18, 0));
      const near = V(1444, top + 26, 518);
      if (t >= T3 - 0.1 && t < 113.8) { const u = smooth(T3 - 0.1, 113.78, t); const p = mp.clone().lerp(lamp, u); Object.assign(s, { x: p.x, y: p.y, z: p.z, pose: 'bug', rotY: Math.atan2(-(lamp.z - mp.z), lamp.x - mp.x) }); }
      if (t >= 113.78 && t < 115.6) { const u = smooth(113.78, 114.1, t); const p = lamp.clone().lerp(near, u); Object.assign(s, { x: p.x + 2 * Math.sin(t * 13), y: p.y + 3 * Math.sin(t * 17), z: p.z, pose: 'dance', rotY: -1.2 }); }
      if (t >= 113.9) s.wingTint = { k: ease((t - 113.9) / 0.7), hue: t < 114.6 ? (t - 113.9) * 1.6 : 0.92 };   // natural k09 colours; Jade adds flower colours to the wings
      if (t >= 114.62 && t < 115.6) { const tk = r5 && t >= CONV.moth && t < T4 ? CONV.moth : t;   // (r5) the GLIDER card is a held pose
        const k = smooth(114.62, 115.4, tk); s.x = near.x - 10 * Math.sin(k * 6); s.z = near.z + 10 * Math.cos(k * 6) - 10; s.y = near.y + 50 * k; }
      if (t >= 115.6) { const k = smooth(115.6, 116.2, t); const a = (t - 115.6) * 1.5; const c = SIDE.moth;
        const circ = V(c.x + 22 * Math.cos(a), c.y + 5 * Math.sin(a * 2), c.z + 12 * Math.sin(a)); const from = V(near.x, near.y + 50, near.z);
        const q = from.lerp(circ, k); s.x = q.x; s.y = q.y; s.z = q.z; s.rotY = Math.atan2(-Math.cos(a), -Math.sin(a)) * k + (-1.2) * (1 - k); s.bank = -0.4; }
    }
    // ---- BEETLE (T4): endless loop around LOOP; 116.11-116.51 hooked and pulled straight -> WHEEL rolls to the party side
    { const s = S.beetle; const R = 15;
      if (t >= T4 - 0.15 && t < BOOM[1]) {
        const into = smooth(T4 - 0.15, T4 + 0.05, t); const a = (t - T4) * 2 * Math.PI * 1.9; const c = LOOP;
        const onLoop = V(c.x + R * Math.cos(a), c.y, c.z + R * Math.sin(a));
        const p = BUGB.beetle.clone().lerp(onLoop, into);
        Object.assign(s, { x: p.x, y: p.y, z: p.z, pose: 'dance', facing: 1, rotY: Math.atan2(-Math.cos(a), -Math.sin(a)) });
        if (t >= BOOM[0] + 0.22) { const k = smooth(BOOM[0] + 0.22, BOOM[1], t); s.x = lerp(onLoop.x, c.x - 6, k); s.z = lerp(onLoop.z, c.z, k); s.rotY = lerp(s.rotY, 0, k); }
      }
      if (t >= BOOM[1]) { const u = ease((t - BOOM[1] - (r5 ? 0.3 : 0)) / 0.6); const p = LOOP.clone().add(V(-6, 0, 0)).lerp(SIDE.beetle, u); const d = p.distanceTo(LOOP);   // (r5) the WHEEL card holds before it rolls
        Object.assign(s, { x: p.x, y: top, z: p.z, facing: 1, rotY: 0, roll: -d / 12 }); }
    }
    // ---- LADYBUG + CATERPILLAR (T5): they advance out of the row (error spots, overflow); upright drafts sketched in
    //      stroke order; Ricky's ring; caps land on top; redrawn -> BUTTON, BRIDGE (they stay there until the flood)
    for (const b of ['ladybug', 'caterpillar']) { const s = S[b];
      if (t >= T5 - 0.05) { const p = hop(BUGB[b], BOSS[b], T5 - 0.05, T5 + 0.25, 14); s.x = p.x; s.y = p.y; s.z = p.z; s.rotY = -1.0; } }
    { const s = S.ladybug; if (t >= T5 && t < 117.6) { s.pose = 'bug'; }
      if (t >= CAO && t < CONV.ladybug - 0.02) { s.draft = 1; s.draftP = clamp01((t - CAO) / 0.24); s.pose = 'idle'; } }
    { const s = S.caterpillar; if (t >= OVER && t < 117.65) { s.pose = 'bug'; s.overflow = Math.min(6, Math.floor((t - OVER) / 0.1)); }
      if (t >= GAO && t < CONV.caterpillar - 0.02) { s.draft = 1; s.draftP = clamp01((t - GAO) / 0.2); s.pose = 'idle'; } }
    for (const b of BUG_NAMES) if ((S[b].u ?? 0) >= 1) { S[b].pose = 'feature'; S[b].draft = 0; }
    // ---- (r5) diegetic state: buggy = the body flickers to the missing-texture checkerboard (in sync during the taunt dance,
    //      stronger while a bug acts, weaker as its ♥ fill), fixed = solid colour from its conversion frame; the two held
    //      frames before each conversion flash the bug's silhouette flat white (the hit-stop)
    if (r5) for (const b of BUG_NAMES) { const s = S[b]; if (s.visible === false || t >= CONV[b]) continue;
      // duty cycle (coordinator M1): ~30% in the taunt, <= 50% while a bug acts, so the true colours show most of the time
      let gl = t < TAUNT ? 0.12 : t < T1 ? 0.3 : Math.min(0.5, 0.1 + 0.2 * (1 - heartsAt(t, b) / BATTLE.hearts) + (s.pose === 'bug' ? 0.25 : 0));
      if (t < TAUNT && b === 'ladybug' && t < R5_HOP[1] + 0.5) gl = 0.3;                          // the boss lands glitching
      s.glitch = gl; if (t >= TAUNT && t < T1) s.glitchSync = 5;
      const f = Math.round(t * T.fps()), fc = T.frameOf(CONV[b]); if (f >= fc - R5_HOLD && f < fc) { s.silhouette = 1; s.glitch = 0; } }
    // ---- (k09) the lamp hops into the foreground with the button and the bridge (k09: the features in front)
    if (k9 && t >= 118.6 && t < REVEAL - 1 / 60) { const s = S.firefly; const fg = V(PENCIL.x + K9_S.x * 18 + K9_D.x * 96, top, PENCIL.z + K9_S.z * 18 + K9_D.z * 96);
      const u = smooth(118.6, 118.85, t); const p = SIDE.firefly.clone().lerp(fg, u); p.y += 30 * Math.sin(Math.PI * u) + 4; Object.assign(s, { x: p.x, y: p.y, z: p.z, rotY: -0.4 }); }
    // ---- (k09) 119.02 THE FLOOD: the wheel rolls along the wave's foot, the glider surfs the crest
    if (k9 && t >= CUE.flood && t < REVEAL - 1 / 60) k9Riders(t, S, beat);
    // ---- 119.02 THE FLOOD: the wheel rides the wavefront's edge, the glider surfs its crest (scaled up to read from the air)
    else if (t >= CUE.flood && t < REVEAL) {
      const R = floodRadius(t);
      { const p = wheelRide(t); const r = Math.max(72, R + 6); const s = S.beetle;
        Object.assign(s, { x: p.x, y: p.y, z: p.z, u: 1, pose: 'feature', facing: 1, rotY: Math.atan2(W_DIR.z, -W_DIR.x) + Math.PI, roll: r / 12, scale: 1 + 2 * smooth(119.3, 119.7, t) }); }
      { const s = S.moth; const k = smooth(CUE.flood, 119.3, t); const q = V(s.x, s.y, s.z).lerp(gliderRide(t), k);
        Object.assign(s, { x: q.x, y: q.y, z: q.z, u: 1, pose: 'feature', facing: 1, rotY: Math.atan2(-G_DIR.z, G_DIR.x), bank: 0.3 * Math.sin(t * 4), scale: 1 + 2.5 * smooth(119.3, 119.7, t) }); }
      for (const b of ['firefly', 'caterpillar', 'ladybug']) S[b].y += 3 * Math.abs(Math.sin(Math.PI * beat));
    }
    // ---- 121.405 RECRUIT: the five line up facing the party (hand-over spots), big-eyed bounce; the band shot continues them
    if (t >= REVEAL) {
      for (const b of BUG_NAMES) {
        const h = handoverFeature(b, t);
        if (b === 'moth') { const hover = { ...h, x: 1276, y: top + 58, z: 420 };   /* (v4) up and left, out of Charlie's line */ const k = smooth(BANDSHOT, 122.9, t);
          h.x = lerp(hover.x, h.x, k); h.y = lerp(hover.y + 3 * Math.sin(t * 6), h.y, k); h.z = lerp(hover.z, h.z, k); if (k < 0.5) { h.facing = 1; h.rotY = -0.3; } }
        if (t < 122.62 && b !== 'beetle' && b !== 'moth') h.rotY = -0.25;
        h.scale = t < 122.62 ? 1 + 0.12 * T.pulse(t, [REVEAL + 0.02 * BUG_NAMES.indexOf(b)], 0.35) : 1;
        if (b === 'ladybug') h.press = clamp01(1 - Math.abs(t - YES - 0.06) / 0.14);
        if (t < 122.62 && b !== 'moth') h.y += 2.5 * Math.abs(Math.sin(Math.PI * beat * 2));
        // (v4b stage_3d) THE JOIN as action (no recruit window any more: the flood is a clear frame): the five wait in a row across the
        // floor, facing the band; after Charlie's YES each one hops into its place beside the band on its own 8th (battle_ui recruit
        // joins), lands with a pop and a rainbow spark burst; the button (ladybug) pops last, under Charlie's hand
        if (r5) { const tj = JOINT[b];
          if (b !== 'ladybug' && b !== 'moth') { const u = smooth(tj - 0.17, tj, t); const p = V(h.x - 64, h.y, h.z + 26).lerp(V(h.x, h.y, h.z), u);
            h.x = p.x; h.y = p.y + 28 * Math.sin(Math.PI * u); h.z = p.z; if (u < 1) { h.facing = 1; h.rotY = -0.25; } }
          h.scale = (h.scale || 1) * (1 + 0.28 * T.pulse(t, [tj], 0.2)); if (t >= tj && t < tj + 0.25) h.glitch = 0; }
        S[b] = h;
      }
    }
    return S;
  }

  // ---------------------------------------------------------------- (k09) riders (pure in t)
  // hero: the wheel rolls out along the trough (the wave's leading edge) from the pencil; the glider surfs the crest out along
  // the barrel. race: both ride the ring (u 0.5 = the race camera's direction), the wheel on its edge, the glider on the crest
  const wheelU = (t) => t < K9T.race0 ? 0.3 + 0.5 * smooth(119.08, K9T.race0, t) : Math.pow(0.5 - 0.03, 0.6);
  const gliderU = (t) => t < K9T.race0 ? 0.30 + 0.34 * smooth(119.1, K9T.race0 + 0.2, t) : Math.pow(0.5 + 0.035, 0.6);
  function k9WheelAt(t, out = new THREE.Vector3()) { const ws = k9.FW.state(t); k9.FW.trough(wheelU(t), t, out); if (ws) { const f = k9.FW.frame(wheelU(t), ws); out.x += f.dx * 4; out.z += f.dz * 4; } return out; }
  function k9GliderAt(t, out = new THREE.Vector3()) { const ws = k9.FW.state(t); k9.FW.crest(gliderU(t), t, out); out.y += 6 * (ws ? ws.H / 150 : 1) + 2 * Math.sin(t * 5); return out; }
  function k9Riders(t, S, beat) {
    const dt = 1 / 60; const a = k9WheelAt(t), a0 = k9WheelAt(t - dt); const g = k9GliderAt(t), g0 = k9GliderAt(t - dt);
    const big = t >= K9T.race0 ? 1 : 0;
    { const s = S.beetle; const k = smooth(CUE.flood, 119.22, t); const p = SIDE.beetle.clone().lerp(a, k); const d = a.clone().sub(a0);
      const ws = k9.FW.state(t); const dist = ws ? (ws.mode === 'hero' ? ws.L * wheelU(t) : ws.R) : 0; Object.assign(s, { x: p.x, y: p.y, z: p.z, u: 1, pose: 'feature', facing: 1, rotY: Math.atan2(-d.z, d.x), roll: dist / 12, scale: 0.85 + 2.5 * big }); }
    { const s = S.moth; const k = smooth(CUE.flood, 119.3, t); const q = V(s.x, s.y, s.z).lerp(g, k); const d = g.clone().sub(g0);
      Object.assign(s, { x: q.x, y: q.y, z: q.z, u: 1, pose: 'feature', facing: 1, rotY: Math.atan2(-d.z, d.x), bank: 0.35 + 0.15 * Math.sin(t * 4), scale: 1.3 + 1.4 * big }); }
    for (const b of ['firefly', 'caterpillar', 'ladybug']) S[b].y += 3 * Math.abs(Math.sin(Math.PI * beat));
  }

  // spotlight lamp positions (above-front of each hero, toward the battle camera)
  function spotLamp(i, p) { return V(p.x - 18 - 8 * i, p.y + 128, p.z + 70); }
  function spots(t, H, dark) {
    const order = ['jade', 'charlie', 'ricky'];
    order.forEach((n, i) => {
      const s = P.spots[i]; let k = T.on(t, STOPS[i]) ? 1 + 0.8 * T.pulse(t, [STOPS[i]], 0.12) : 0;
      if (t >= TAUNT) k *= 0.8;
      if (i === 0 && t >= T2 && t < EH[2]) { const f = Math.floor(T.beatAt(t) * 4 + 0.5); if (f % 2 === 1 || ((Math.floor(t * 30) * 7) % 5 === 0)) k *= 0.15; }   // the firefly's flicker
      if (i === 1 && t >= 113.74) k *= t < 113.84 ? (Math.floor(t * 30) % 2 ? 0.1 : 1.6) : 0;                   // the moth knocks it out
      k *= 1 - smooth(CUE.flood, 119.4, t);
      if (k <= 0) return;
      const hp = W.heroes[n].position; const b = V(hp.x, hp.y, hp.z);
      const band = r5 && bandOn(t); if (band && i === 0) k *= 0.55;   // her white jacket + face: the gold spot is a tint, not a key (coordinator: face blown at 107.8-109)   // (v4b) the band shot: lamps above-front toward the seats, saturated colours, visible shafts
      const lamp = band ? V(b.x - 70, b.y + 150, b.z + (i === 1 ? -14 : i === 2 ? 14 : 0)) : spotLamp(i, PARTY[n]), aimP = V(b.x, b.y + (band ? 6 : 18), b.z);
      const col = band ? BAND_COL[i] : s.col;
      s.cone.material.color.set(col).multiplyScalar(0.8); s.pool.material.color.set(col).lerp(new THREE.Color('#ffffff'), 0.1);
      const dir = aimP.clone().sub(lamp); const len = dir.length(); dir.normalize();
      s.cone.visible = true; s.cone.position.copy(lamp); s.cone.quaternion.setFromUnitVectors(V(0, -1, 0), dir); s.cone.scale.set(1.15, len / 170, 1.15);
      s.cone.material.opacity = (band ? (i === 0 ? 0.16 : 0.24) : 0.05) * Math.min(1, k) * (0.4 + 0.6 * dark);
      s.pool.visible = true; s.pool.position.set(b.x, floorY(b.x, b.z) + 0.9, b.z); s.pool.material.opacity = (band ? 0.85 : 0.5) * Math.min(1, k / (i === 0 && band ? 0.55 : 1));
      s.light.color.set(col).lerp(new THREE.Color('#fff4e6'), band ? 0.35 : 0.75); s.light.intensity = (band ? 3200 : 2400) * k * (0.5 + 0.5 * dark);
      s.light.angle = band ? 0.17 : 0.2; s.light.position.copy(lamp); s.tgt.position.copy(aimP); s.tgt.updateMatrixWorld();
    });
  }

  // ---------------------------------------------------------------- the battle's paint ledger (replaces paintlog's stage block)
  function paint(t, S) {
    stageLP.clearSpheres(); stageLP.all(0); seatLP.clearSpheres(); for (const m of archMats) lpOf(m).clearSpheres();
    topB.clearSpheres();     // (paintlog's two far mesa-B spheres are outside every battle frame; their slots are needed here)
    topB.edge(16);
    ['jade', 'charlie', 'ricky'].forEach((n, i) => { const s = t - STOPS[i]; if (s >= 0) topB.addSphere(PARTY[n].x, top, PARTY[n].z, 18 * ease(s / 0.3)); });
    // MISS books: the syntax that missed takes colour where it lands (every book set every frame: W.reset skips material arrays)
    bookMats.forEach((ms, i) => { const s = t - FALL[i]; const v = t >= REVEAL ? 1 : i >= 3 && s >= 0 ? ease(s / 0.45) : 0; for (const m of ms) lpOf(m).all(v); });
    // the lamp's warm pool where the cap landed; the flowers spilling onto the floor on 开
    if (t >= CONV.firefly) topB.addSphere(FIREFLY_LAND.x, top, FIREFLY_LAND.z, 15 * ease((t - CONV.firefly) / 0.3));
    { const s = t - KAI - 0.45; if (s >= 0) topB.addSphere(1474, top, 524, 22 * ease(s / 0.5)); }
    // the wheel's track (the loop pulled straight, rolling to the party side)
    if (t >= BOOM[1]) { const u = ease((t - BOOM[1] - (r5 ? 0.3 : 0)) / 0.6); const b = LOOP.clone().add(V(-6, 0, 0)).lerp(SIDE.beetle, u); topB.capsule(LOOP.clone().setY(top), b.setY(top), 7); }
    // the redrawn bridge + button colour the ground under them
    if (t >= CONV.caterpillar) topB.addSphere(BOSS.caterpillar.x, top, BOSS.caterpillar.z, 20 * ease((t - CONV.caterpillar) / 0.35));
    if (t >= CONV.ladybug) topB.addSphere(BOSS.ladybug.x, top, BOSS.ladybug.z, 18 * ease((t - CONV.ladybug) / 0.35));
  }

  // ---------------------------------------------------------------- battle fx
  /** a beige flat cap at p (brim yaw, tilt) */
  function placeCap(cap, p, yaw = 0, tilt = 0) { cap.visible = true; cap.position.copy(p); cap.rotation.set(tilt, yaw, 0); }
  function fxAt(t, H, S, beat, camera) {
    FX.reset();
    const order = ['jade', 'charlie', 'ricky'];
    // "!" x3 on landing
    order.forEach((n, i) => { const t0 = 107.46 + 0.05 * i; const s = t - t0; if (s < 0 || s > 0.5) return;
      const b = FX.bangs[i]; b.visible = true; const hp = headTop(W.heroes[n], V()); const pop = s < 0.06 ? 1.5 - 0.5 * (s / 0.06) : 1;
      b.position.set(hp.x, hp.y + 14 + 4 * ease(s / 0.1), hp.z); b.quaternion.copy(camera.quaternion); b.scale.set(9 * 1.4 * pop, 14 * 1.4 * pop, 1); });
    // checkerboard glitch floor under the bugs (from the taunt; flickers; gone with the last conversion)
    if (t >= TAUNT && t < CUE.flood) {
      const e8 = Math.floor(beat * 2); const flick = t < T1 ? (e8 % 2 === 0 ? 1 : 0.35) : 0.55 + 0.25 * (e8 % 2);
      const fade = 1 - smooth(CONV.ladybug, CONV.ladybug + 0.3, t);
      const on = (Math.floor(t * 30) * 13) % 7 !== 0; const k = flick * fade * (on ? 1 : 0.2);
      if (k > 0.02) { FX.checker.visible = true; FX.checker.position.set(1358, top + 0.25, 496); FX.checker.material.opacity = k; FX.checker.scale.set(1.45, 0.55 + 0.02 * (e8 % 2), 1); }
    }
    // T2: metronome rings from Ricky's guitar on eh eh eh
    EH.forEach((e, i) => { const s = t - e; if (s < 0 || s > 0.45) return; const r = FX.rings[i]; r.visible = true; const rp = W.heroes.ricky.position;
      r.position.set(rp.x - 6, rp.y + 24, rp.z); r.rotation.set(0, Math.PI / 2, 0); const R = 8 + 90 * s; r.scale.setScalar(R); r.material.opacity = 1 - s / 0.45; });
    // T2: Charlie's cap arcs onto the firefly and lands ON TOP of it (113.2); the lamp's own cap shade takes over in the morph
    if (t >= 112.95 && t < CONV.firefly - (r5 ? 0 : 0.05)) {
      const u = clamp01((t - 112.95) / 0.25); const a = W.heroes.charlie.hand ? W.heroes.charlie.hand('R', V()) : W.heroes.charlie.position.clone().add(V(-4, 40, 0));
      const b = cast.anchor('firefly', V()).add(V(0, -3, 0)); const p = a.clone().lerp(b, ease(u)); p.y += 30 * Math.sin(Math.PI * u);
      placeCap(FX.caps[0], p, u < 1 ? t * 14 : -0.6, u < 1 ? 0.5 : 0);
    }
    // T3: the updraft (Ricky's sustain) around the moth
    if (t >= 114.5 && t < 115.6) { const mp = cast.C.moth.g.position; FX.setUpdraft(V(mp.x, mp.y, mp.z), smooth(114.5, 114.8, t) * (1 - smooth(115.25, 115.6, t)) * (r5 ? 0.5 * (1 - smooth(114.9, 114.97, t)) : 1), t - 114.5); }   // (r5) the additive streaks blaze in the close card: off from the conversion
    // T4: glitch rings ground into the stage by the loop; the loop pulled straight
    if (t >= T4 && t < BOOM[1] + 0.25) {
      const k = smooth(T4, T4 + 0.5, t); const str = smooth(BOOM[0] + 0.22, BOOM[1], t); const gone = smooth(BOOM[1], BOOM[1] + 0.25, t);
      FX.loopRings.forEach((r, i) => { if (k * (i + 1) / 3 < 0.05) return; r.visible = true; const R = 17 + (i - 1) * 4.5;
        r.position.set(LOOP.x - 6 * str, DISC + 0.3 + 0.02 * i, LOOP.z); r.scale.set(R * (1 + 0.6 * str), R * (1 - 0.97 * str), 1); r.material.opacity = (0.5 + 0.5 * k) * (1 - gone) * ((Math.floor(t * 30) + i) % 4 === 0 ? 0.3 : 1); });
    }
    // T4: Jade's graphite axle (drawn top-down), hooked and carried into the wheel
    if (t >= AXLE - 0.05 && t < BOOM[1] + 0.05) { const d = smooth(AXLE - 0.05, AXLE + 0.12, t); FX.axle.visible = true;
      FX.axle.position.set(LOOP.x, DISC + 46, LOOP.z); FX.axle.scale.set(1, 46 * d, 1); FX.axle.rotation.z = -0.5 * smooth(BOOM[0] + 0.22, BOOM[1], t); }
    // T4: the boomerang hat: out around the loop, hooks the axle, back to Charlie
    if (t >= BOOM[0] && t < 116.78) {
      const hand = W.heroes.charlie.hand ? W.heroes.charlie.hand('R', V()) : PARTY.charlie.clone().add(V(-6, 38, 0)); const c = LOOP;
      let p;
      if (t < BOOM[0] + 0.22) { const u = (t - BOOM[0]) / 0.22; const a = Math.PI * 0.1 + u * Math.PI * 1.3; const far = V(c.x + 30 * Math.cos(a), c.y + 30, c.z + 30 * Math.sin(a)); p = hand.clone().lerp(far, Math.min(1, u * 1.6)); }
      else if (t < BOOM[1]) { p = V(c.x - 4, c.y + 26, c.z); }
      else { const u = clamp01((t - BOOM[1]) / 0.27); p = V(c.x - 4, c.y + 26, c.z).lerp(hand, u); p.y += 20 * Math.sin(Math.PI * u); }
      placeCap(FX.boomer, p, t * 22, 0.25);
    }
    // T5: the glitch wave rolls at the party, breaks on the hat shield
    if (t >= T5 + 0.05 && t < GUARD) { const u = clamp01((t - T5 - 0.05) / (GUARD - T5 - 0.05)); FX.wave.visible = true; FX.wave.position.set(lerp(1310, CFRONT.x - 10, u * u), top, 522); FX.wave.material.opacity = 0.55 + 0.3 * (Math.floor(t * 30) % 2); FX.wave.scale.set(1, 0.6 + 0.4 * u, 1); }
    if (t >= GUARD) FX.setWaveBits(V(CFRONT.x - 10, top, 522), t - GUARD);
    if (t >= GUARD - 0.05 && t < GUARD + 0.45) { const s = t - GUARD + 0.05; FX.shield.visible = true; const cp = W.heroes.charlie.position;
      FX.shield.position.set(cp.x - 10, cp.y + 22, cp.z); FX.shield.rotation.set(0, -Math.PI / 2, 0); FX.shield.scale.setScalar(26 * (0.8 + 0.4 * ease(s / 0.1))); FX.shield.material.opacity = 0.45 * (1 - s / 0.5); }
    // T5: Ricky's run ring passes through the two drafts
    { const s = t - RUN_RING; if (s >= 0 && s < 0.4) { const r = FX.rings[3]; r.visible = true; const rp = W.heroes.ricky.position;
      r.position.set(rp.x - 6, rp.y + 22, rp.z); r.rotation.set(Math.PI / 2, 0, 0); r.scale.setScalar(10 + 420 * s); r.material.opacity = 1 - s / 0.4; } }
    // T5: Charlie's caps drop ON TOP of the two drafts (118.42), and pop off as the redraw flies
    [['ladybug', 1], ['caterpillar', 2]].forEach(([b, i]) => {
      const tl = HATS + 0.04, tc = CONV[b] - 0.02; if (t < HATS - 0.12 || t > tc + 0.18) return;
      const topY = cast.anchor(b, V()).y - 3; const bp = BOSS[b];
      const y = t < tl ? topY + 70 * Math.pow((tl - t) / 0.16, 2) : t < tc ? topY : topY + 90 * Math.pow((t - tc) / 0.18, 1.5);
      placeCap(FX.caps[i], V(bp.x, y, bp.z), t < tl ? t * 10 : -0.6, 0);
    });
  }

  // ---------------------------------------------------------------- (k09) the plant, the wave, Jade (motion system), colour
  function k9Paint(t) {
    const ws = k9.FW.state(t);
    if (!ws) { if (W.colorMap) W.colorMap.on(false); return; }
    // the global flood sphere trails just behind the foot (the low ripple's colour); the colour map fills the tall sector right
    // up to the foot (behind the crest), with the hatched pencil edge (world_look's hook)
    const Rc = Math.max(1, ws.R - 12 - 0.05 * ws.R);
    G.uPaintC.value.copy(FLOOD.c); G.uPaintR.value = Rc; G.uPaintW.value = 24 + 0.14 * Math.min(Rc, 3000);
    if (W.colorMap) W.colorMap.fill((x, z) => k9.FW.colour(x, z, t)).on(true);
  }
  const _pq = new THREE.Quaternion(), _pa = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0);
  function k9Frame(t, camera) {
    // ---- the giant pencil (k9Pencil: pure in t)
    const pp = k9Pencil(t);
    if (pp) { P.pencil.visible = true; P.pencil.position.set(pp.x, pp.y, pp.z); const pd = pushDir(); _pa.set(pd.x * Math.sin(pp.tilt), Math.cos(pp.tilt), pd.z * Math.sin(pp.tilt));
      P.pencil.quaternion.copy(_pq.setFromUnitVectors(_Y, _pa)); P.pencil.updateMatrixWorld(true);
      k9.root.visible = true; k9.tip.visible = true; k9.tip.position.copy(P.pencil.position); k9.tip.quaternion.copy(P.pencil.quaternion); }
    // ---- Jade (MotionFigure) from the triple tech's cut (117.65) through the hero shot
    const on = t >= 117.65 && t < K9T.race0;
    k9.fig.group.visible = on; if (on) { k9.root.visible = true; k9.fig.apply(k9.track, t, k9.opts(t)); }
    // ---- the wave
    k9.FW.update(t, camera);
  }

  // ---------------------------------------------------------------- cameras (one cut per half-bar at most)
  const SHOTS = [
    // MASTER (m1): the bug row left, the party right, same depth, floor between; a slow push through the intros
    [OPEN, (t) => { const k = smooth(OPEN, TAUNT, t); return { pos: V(1404, 114 - 6 * k, 792 - 18 * k), tgt: V(1404, 34, 494), fov: 46, focus: V(1404, 22, 494) }; }],
    // the bugs' taunt: medium on the row
    [TAUNT, (t) => { const k = smooth(TAUNT, T1, t); return { pos: V(1348 + 6 * k, 58, 646 - 8 * k), tgt: V(1350, 22, 494), fov: 36, focus: V(1352, 20, 494) }; }],
    // T1 command phase: over Jade's shoulder (front-right 3/4), the row and the falling books beyond
    [T1, (t) => { const k = smooth(T1, T2, t); return { pos: V(1550 - 8 * k, 86, 666 - 8 * k), tgt: V(1414, 32, 490), fov: 46, focus: V(1468, 30, 496) }; }],
    // T2: Ricky + Charlie with the firefly in Jade's pool
    [T2, (t) => { const k = smooth(T2, T3, t); return { pos: V(1478 - 4 * k, 72, 704 - 8 * k), tgt: V(1478, 36, 504), fov: 42, focus: V(1456, 24, 510) }; }],
    // T3 enemy half: master (the moth dives into Charlie's spotlight)
    [T3, (t) => { const k = smooth(T3, 114.5, t); return { pos: V(1418, 104, 750 - 6 * k), tgt: V(1424, 36, 494), fov: 42, focus: V(1440, 30, 494) }; }],
    // T3 party half: Jade + Ricky + the moth, the updraft
    [114.5, (t) => { const up = smooth(114.5, 115.3, t); return { pos: V(1480, 56 + 6 * up, 688), tgt: V(1470, 46 + 16 * up, 508), fov: 44, focus: V(1450, 40, 514) }; }],
    // T4: high 3/4 on the loop behind the gap, Jade + Charlie in front of it
    [T4, (t) => { const k = smooth(T4, T5, t); return { pos: V(1470 - 6 * k, 148, 716 - 6 * k), tgt: V(1462, 20, 522), fov: 44, focus: V(1432, 14, 538) }; }],
    // T5 enemy half: master, wider (the pair advances, the wave, GUARD, the party steps forward)
    [T5, (t) => { const k = smooth(T5, 117.65, t); return { pos: V(1404, 106, 762 - 10 * k), tgt: V(1404, 32, 508), fov: 44, focus: V(1404, 20, 512) }; }],
    // TRIPLE TECH: medium on just the ladybug + caterpillar (Jade's pencil at the right edge)
    [117.65, (t) => { const k = smooth(117.65, CUE.flood, t); return { pos: V(1350, 72 - 2 * k, 700 - 6 * k), tgt: V(1352, 34, 536), fov: 42, focus: V(1330, 18, 536), look: { dofAmount: 0.3 } }; }],
    [CUE.flood, (t) => { const k = smooth(CUE.flood, 119.45, t); return { pos: V(1486 + 10 * k, 196 + 34 * k, 716 + 24 * k), tgt: V(1330 - 10 * k, 0, 436), fov: 50, focus: PENCIL.clone(), ext: 700, look: { rays: 0.3, dofAmount: 0.15, sat: 1.2 } }; }],
    [119.45, (t) => { const k = smooth(119.45, REVEAL, t); return { pos: V(1560 + 40 * k, 330 + 60 * k, 860 + 40 * k), tgt: V(1000 - 60 * k, -20, -150), fov: 56, ext: 2400, look: { rays: 0.25, dofAmount: 0, sat: 1.25, atmos: 0.7 } }; }],
    // RECRUIT -> hand-over: ONE continuous move (no cut) from the recruit framing onto Act IV's camera
    [REVEAL, (t) => { const k = smooth(REVEAL + 0.5, END, t);
      return { pos: pathAt(t, [[REVEAL, V(1318, 72, 612)], [122.5, V(1342, 62, 612)], [END, HANDOVER_CAM.pos.clone()]]),
        tgt: V(1340, 26, 456).lerp(HANDOVER_CAM.tgt, k), fov: lerp(48, ACT4_FOV, smooth(122.3, END, t)), focus: V(1336, 24, 456), ext: 700,
        look: { rays: 0.35, dofAmount: 0.15, sat: 1.22 } }; }],
  ];

  // ---------------------------------------------------------------- (r5) cameras: low, over the shoulder, the bug >= 1/3 high
  /** over-the-shoulder: behind `hero` on the line to `target`, `side` units to screen-right (hero lands on the left for side > 0),
   *  at chest height; the target is the focal subject */
  const _d = new THREE.Vector3();
  function ots(hero, target, { back = 32, side = 20, up = 46, fov = 38, tgtY = 0 } = {}) {
    _d.set(target.x - hero.x, 0, target.z - hero.z).normalize(); const rx = -_d.z, rz = _d.x;
    const pos = V(hero.x - _d.x * back + rx * side, hero.y + up, hero.z - _d.z * back + rz * side);
    const tgt = V(target.x, target.y + tgtY, target.z);
    return { pos, tgt, fov, focus: tgt.clone(), look: { dofAmount: 0.3, r5: { dof: 0.6, focus: tgt.clone(), columns: { cull: [] } } } };
  }
  const R5_NEAR_MOTH = V(1444, top + 26, 518);                 // the moth's hover point (bugsAt `near`)
  const SHOTS_R5 = r5 ? [
    // (v4b stage_3d) 107.283 THE WIDE (under card 05 since the coordinator's 舞台 note; kept for partial renders): from high in the seats, the stage, the
    // arch, the party dropping onto the stage front, the bug row waiting below-right, the caterpillar spilling over the seats
    [OPEN, (t) => { const k = smooth(OPEN, STOPS[0], t); return { pos: V(1196 + 10 * k, 128 - 6 * k, 520 - 6 * k), tgt: V(1404, 40, 452), fov: 44, focus: STAGEB.jade.clone().setY(top + 36), look: { dofAmount: 0.12, r5: { ...BAND_KEY, dof: 0.25, tilt: 0, columns: { keep: ['R0', 'R1'] } } } }; }],
    // (v4b stage_3d) 107.615 THE BAND (still 08): front-on medium three-shot from the seats, chest height, the arch behind; a slow push
    // through the three stops and 舞台 to the rap downbeat (no cut 109.09-110.41: the type unit's 舞台 spans it); top left / right clean
    [BAND_CUT, (t) => { const k = smooth(STOPS[0], BAND_T[1], t); const j = STAGEB.jade; return { pos: V(j.x - 200 + 22 * k, top + 48, j.z - 8), tgt: V(j.x, top + 44, j.z - 3), fov: 27, focus: j.clone().setY(top + 52), look: { dofAmount: 0.1, ...BAND_LOOK, r5: { ...BAND_KEY, ...BAND_R5, dof: 0.22, tilt: 0, focus: j.clone().setY(top + 52), columns: { keep: ['R0', 'R1'] } } } }; }],
    // T1 command phase: over Jade's shoulder (front-right 3/4), the row and the falling books beyond
    [T1_CUT, (t) => { const k = smooth(T1, T2, t); return { pos: V(1550 - 8 * k, 70, 666 - 8 * k), tgt: V(1414, 32, 490), fov: 46, focus: V(1468, 30, 496) }; }],
    // T2 FIREFLY (enemy half on the T1 camera: it hops into Jade's pool); party half 112.33: over Charlie's shoulder (he stepped
    // up beside the pool), the rings, the cap flies in, the LAMP card
    [EH[0], () => ots(R5_C_T2, FIREFLY_LAND, { back: 52, side: -34, up: 92, fov: 32, tgtY: 14 })],
    // T3 enemy half: low from the party's side, looking up at Charlie's lamp as the moth dives into it
    [T3, () => ({ pos: V(1548, 30, 606), tgt: V(1466, 88, 548), fov: 46, focus: V(1468, 120, 560), look: { dofAmount: 0.2 } })],
    // T3 party half: over Jade's shoulder on the moth (from the arch side); the camera rises with the updraft; the GLIDER card
    // (v4b M2, coordinator Q1) 一句话 is Jade's line: FRONT-ON medium of her singing it while she colours the moth's wings (the moth in
    // the left foreground), 113.885 -> the beat 114.492; then the over-the-shoulder on the moth and the GLIDER card as before
    [SENT_CUT, (t) => { const j = PARTY.jade; const k = smooth(SENT_CUT, SENT_OTS, t); const face = V(j.x, top + 54, j.z);
      return { pos: V(j.x - 112 + 8 * k, top + 52, j.z + 34), tgt: V(j.x, top + 44, j.z + 6), fov: 34, focus: face, look: { dofAmount: 0.1, r5: { dof: 0.2, tilt: 0, focus: face, columns: { cull: [] } } } }; }],
    [SENT_OTS, (t) => { const r = 50 * smooth(114.62, 115.4, t), o = smooth(114.9, 115.12, t);   // lifts + widens for the card: the glider's wings fit
      const rr = r5 ? 50 * smooth(114.62, 115.4, Math.min(t, CONV.moth)) : r;   // the held card pose (see bugsAt)
      const sh = ots(PARTY.jade, R5_NEAR_MOTH, { back: 46, side: -34 - 6 * o, up: 104 + 0.3 * rr + 18 * o, fov: 34 + 4 * o, tgtY: 8 + rr - 6 * o });   // the +z side (the arch column blocks the inland side), high: the sand / checker floor behind the held glider
      sh.look.r5.beam = 0; return sh; }],
    // T4 BEETLE: over Charlie's shoulder (he stepped up to the loop); Jade's axle; the boomerang; the WHEEL card
    [T4, () => ots(R5_C_T4, LOOP, { back: 52, side: -34, up: 92, fov: 32, tgtY: 12 })],
    // T5 enemy half: the master, lower (the pair advances, the wave, GUARD, the party steps forward)
    [T5, (t) => { const k = smooth(T5, 117.65, t); return { pos: V(1404, 62, 762 - 10 * k), tgt: V(1404, 30, 508), fov: 44, focus: V(1404, 20, 512) }; }],
    ...SHOTS.filter(([t0]) => t0 >= 117.65)] : SHOTS;
  // (k09) the hero shot (composes like k09: high 3/4, Jade + the pencil centre-right, the wave curling on the left, the
  // features in front) and the race to the horizon (behind the crest, over the stage, the wave running out to the far hills)
  const RING = !!k9 && floodRingOn();   // (v4b) the ring flood (flood_wave.js floodRingOn)
  const K9_SHOTS = k9 ? [...SHOTS_R5.filter(([t0]) => t0 < K9T.hero0),
    [K9T.hero0, (t) => { const k = smooth(K9T.hero0, K9T.race0, t); const at = (a, b, y) => V(PENCIL.x + K9_S.x * a + K9_D.x * b, y, PENCIL.z + K9_S.z * a + K9_D.z * b);
      // Jade flies in (lands 118.726), catches the pencil, winds up; the slam on 119.02 punches the lens; then the camera pulls
      // back to the k09 framing as the wave rises and curls
      const e = 0.75 * smooth(119.06, 119.45, t) + 0.25 * smooth(119.45, K9T.race0 - 0.05, t); const w = smooth(118.62, 118.99, t) * (1 - smooth(119.02, 119.2, t));
      const punch = T.pulse(t, [CUE.flood], 0.11);
      // (M5) the camera looks INTO the wave's face from the front (+z): the wave at the left, its lip curling toward us, the garden
      // it leaves in the left foreground, Jade + the pencil centre-right, the band right, the features in front
      const P0 = V(1418, 118, 642), T0 = V(1366, 44, 452), P1 = V(1342, 226, 786), T1 = V(1306, 52, 468);
      return { pos: P0.clone().lerp(P1, e).add(V(0, -6 * w, -8 * w)), tgt: T0.clone().lerp(T1, e).add(V(0, 8 * w, 0)), fov: 42 + 4 * e - 5 * punch, focus: PENCIL.clone().setY(40), ext: 700, look: { rays: 0.3, dofAmount: 0.12, sat: 1.18 } }; }],
    // (v4b stage_3d, still 07) the ring flood: on the beat before the plant, cut FRONT-ON to Jade (the camera beyond the pencil on her
    // line, chest height, in the seats): she winds up, drives it in on 119.02, the ring stands up round the tip and races straight at
    // the lens; ~119.6 it passes THROUGH the camera (the strokes fill the frame); 119.732 (beat) cut high and wide: the ring racing
    // out over the amphitheatre, the colour flooding in behind it; 120.135 the race (below)
    ...(RING ? [[RING_T.front, (t) => { const k = smooth(CUE.flood, RING_T.pass, t); const punch = T.pulse(t, [CUE.flood], 0.11);
      const pos = RCAM.clone().addScaledVector(JDIR, -8 * k).setY(top + 74 + 4 * k); const jf = RSTANCE.clone().setY(DISC + 50);
      return { pos, tgt: RSTANCE.clone().addScaledVector(RLAT, 4).setY(DISC + 34), fov: 38 - 5 * punch, focus: jf, ext: 700, look: { rays: 0.25, dofAmount: 0.08, sat: 1.18, r5: { dof: 0.18, tilt: 0, focus: jf } } }; }],
    [RING_T.pass, (t) => { const k = smooth(RING_T.pass, K9T.race0, t); const R = ringR(t);
      const pos = PENCIL.clone().add(V(150 + 40 * k, 210 + 50 * k, 250 + 50 * k)), tgt = PENCIL.clone().add(V(-0.45 * R, 0, -0.1 * R)).setY(top);
      return { pos, tgt, fov: 54, ext: 1200, look: { rays: 0.25, dofAmount: 0, sat: 1.22, atmos: 0.75, r5: { dof: 0.08, tilt: 0 } } }; }]] : []),
    // the race 1 (120.135-120.94): a chase cam low behind and beside the crest, the glider surfing it; the world colours in
    // under the lip as the ring rolls out over the stage edge, mesa A and the meadow
    [K9T.race0, (t) => { const ws = k9.FW.state(t); const H = ws.H; const uG = gliderU(t); const f = k9.FW.frame(uG, ws); const dx = f.dx, dz = f.dz, tx = dz, tz = -dx;
      const c = k9.FW.crest(uG, t, V()); const k = smooth(K9T.race0, K9_WIDE, t);
      const pos = V(c.x - dx * (0.9 - 0.2 * k) * H + tx * 2.0 * H, c.y + (0.35 + 0.25 * k) * H, c.z - dz * (0.9 - 0.2 * k) * H + tz * 2.0 * H);
      const tgt = V(c.x + dx * 0.25 * H - tx * 0.3 * H, c.y - 0.45 * H, c.z + dz * 0.25 * H - tz * 0.3 * H);
      return { pos, tgt, fov: 50, focus: c, ext: Math.max(900, 3 * H), look: { rays: 0.25, dofAmount: 0, sat: 1.22, atmos: 0.75 } }; }],
    // the race 2 (120.94, a beat): the wide: high over the coloured world, the ring running out to the horizon
    [K9_WIDE, (t) => { const ws = k9.FW.state(t); const R = ws ? ws.R : 210; const d = V(Math.cos(K9_RACE), 0, Math.sin(K9_RACE)); const k = 0.45 + 0.55 * smooth(K9_WIDE, REVEAL, t);
      const side = V(-d.z, 0, d.x);
      const pos = PENCIL.clone().addScaledVector(d, -260 + 380 * k).addScaledVector(side, 140).add(V(0, 470 + 260 * k, 0));
      const tgt = PENCIL.clone().addScaledVector(d, 420 + 0.42 * Math.min(R, 6000)).addScaledVector(side, 40).setY(-30);
      return { pos, tgt, fov: 54, ext: 2400, look: { rays: 0.25, dofAmount: 0, sat: 1.22, atmos: 0.75 } }; }],
    ...SHOTS.filter(([t0]) => t0 >= REVEAL)] : null;
  const main = await make3D(ctx, W, {
    frame(t, fxs) {
      const beat = T.beatAt(t);
      // ---- flood (global)
      const R = floodRadius(t);
      if (k9 && t < REVEAL - 1 / 60) k9Paint(t);
      else if (R > 0) { G.uPaintC.value.copy(FLOOD.c); G.uPaintR.value = R; G.uPaintW.value = 60 + 0.2 * Math.min(R, 3000); }
      // ---- camera (shots are pure in t; computed first so the sprite bugs can turn toward it)
      if (r5) LK.r5ShotClear?.();   // (r5) look_r5's per-shot overrides accumulate: start every frame clean, the shot's look.r5 sets its own
      const sh = shotAt(t, K9_SHOTS || SHOTS_R5)[1](t);
      const shake = T.pulse(t, [...FALL.slice(3), GUARD], 0.1) * 1.6 + (k9 ? T.pulse(t, [CUE.flood], 0.09) * 2.6 : 0);
      const pos = sh.pos.clone().add(V(Math.sin(t * 70) * shake, Math.cos(t * 63) * shake, 0));
      const camera = aim(persp('battle', aspect), pos, sh.tgt, sh.fov);
      // ---- party (r5: on the hit-stop's held time)
      const tw = hitStop(t);
      const H = heroesAt(tw);
      for (const [n, s] of Object.entries(H)) putHero(W, W.heroes[n], s);
      if (r5 && bandOn(tw)) bandJade(tw);   // (v4b) she sings into the pencil; on her stop the free arm flings out; lip sync on line 27
      // ---- bugs / features
      const S = bugsAt(tw, T.beatAt(tw));
      // (v4b) the band shot is the band's alone: the waiting row sits just outside its frame edge (hidden there, seen in the wide)
      if (r5 && t >= T.snap(STOPS[0]) - 1e-6 && t < BAND_T[1]) for (const b of BUG_NAMES) S[b] = { ...S[b], visible: false };
      for (const b of BUG_NAMES) cast.setBugState(b, S[b]);
      // ---- (r5) the ladybug on Charlie's cap, and its hop off it (it rides his landing bounce; the pop is in bugsAt)
      if (r5) {
        if (t < R5_HOP[1]) { const hp = headTop(W.heroes.charlie, V()); const u = clamp01((t - R5_HOP[0]) / (R5_HOP[1] - R5_HOP[0]));
          const from = V(hp.x - 3, hp.y - 1.5, hp.z), to = R5_LADY_LAND.clone(); const p = from.lerp(to, u); p.y += 22 * Math.sin(Math.PI * u);
          cast.setRider({ visible: true, x: p.x, y: p.y, z: p.z, t, rotY: u > 0 ? Math.atan2(-(to.z - hp.z), to.x - hp.x) : 0.4, anim: u > 0 ? 'dance' : 'idle' }); }
        else cast.setRider({ visible: false });
      }
      // ---- props
      placeBooks(P, t);
      if (k9 && t < REVEAL - 1 / 60) k9Frame(t, camera);
      else if (t >= 118.75) { P.pencil.visible = true; const d = smooth(118.75, CUE.flood, t);
        P.pencil.position.set(PENCIL.x, top - 6 * d + 140 * (1 - d) * (1 - d), PENCIL.z); P.pencil.rotation.set(0, 0, 0.18 * (1 - d) - 0.08); }
      const dark = t < STOPS[0] ? 0 : t < TAUNT ? 1 - 0.75 * smooth(TAUNT, TAUNT + 0.4, t) : t < CUE.flood ? 0.25 : 0.25 * (1 - smooth(CUE.flood, 119.4, t));
      spots(t, H, dark);
      paint(t, S);
      fxAt(tw, H, S, beat, camera);
      // particles: book dust, conversions (sparks), flowers on 开, flood burst
      P.burst.visible = true;
      P.burst.run(t, [...FALL.map((te, i) => { const bp = bookPose(i, 1); return { t0: te, x: bp.p.x, y: top, z: bp.p.z, n: 12, speed: 60, up: 20, g: 160, dur: 0.7, seed: 500 + i, size: 1.5, colors: i >= 3 ? ['#ff4d6d', '#ffe14d', '#4fd06a', '#2bb4e8'] : ['#efe7d6', '#d8c9b0'] }; }),
        ...BOOK_A.map((_, i) => ({ t0: BOOK_IN + 0.04 * i + 0.14, x: bookPose(i, 0).p.x, y: top, z: bookPose(i, 0).p.z, n: 8, speed: 50, up: 14, g: 160, dur: 0.5, seed: 520 + i, size: 1.3 })),
        ...(k9 ? [{ t0: CUE.flood, x: PENCIL.x, y: DISC, z: PENCIL.z, n: 60, speed: 95, up: 26, g: 160, dur: 0.9, seed: 78, size: 1.6, colors: ['#efe7d6', '#e6dcc8', '#fff4e6', '#d8c9b0'] }] : [{ t0: CUE.flood, x: PENCIL.x, y: top, z: PENCIL.z, n: 40, speed: 120, up: 40, g: 100, dur: 1.2, seed: 77, size: 1.4, colors: ['#ff4d6d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'] }])]);
      P.sparks.visible = true;
      P.sparks.run(t, [...CONVERT.map(([te, b], i) => { const g = cast.C[b].g.position; return { t0: te, x: g.x, y: g.y + 14, z: g.z, n: 22, speed: 70, up: 40, g: 80, dur: r5 && b === 'moth' ? 0.2 : 0.7, seed: 400 + i, colors: ['#ff4d6d', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff', '#ffffff'] }; }),   // (r5) no sparks over the held GLIDER card
        ...STOPS.map((te, i) => { const n = ['jade', 'charlie', 'ricky'][i]; const b = PARTY[n]; return { t0: te, x: b.x, y: b.y + 2, z: b.z, n: 14, speed: 40, up: 30, g: 60, dur: 0.6, seed: 200 + i, colors: [P.spots[i].col, '#ffffff'] }; }),
        ...(r5 ? BUG_NAMES.map((b, i) => { const h = handoverFeature(b, JOINT[b]); return { t0: JOINT[b], x: h.x, y: h.y + 10, z: h.z, n: 26, speed: 60, up: 46, g: 90, dur: 0.6, seed: 640 + i, colors: ['#ff4d6d', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff', '#ffffff'] }; }) : []),   // (v4b) the joins
        { t0: 113.76, x: spotLamp(1, PARTY.charlie).x, y: spotLamp(1, PARTY.charlie).y - 10, z: spotLamp(1, PARTY.charlie).z, n: 20, speed: 50, up: 10, g: 120, dur: 0.8, seed: 260, colors: ['#ff4fb8', '#ffffff', '#ffe14d'] },
        ...[CAO, GAO].map((te, i) => { const b = BOSS[i ? 'caterpillar' : 'ladybug']; return { t0: te, x: b.x, y: b.y + 14, z: b.z, n: 10, speed: 30, up: 20, g: 60, dur: 0.5, seed: 280 + i, colors: ['#4a4a50', '#9a9aa2'] }; })]);
      P.petals.visible = true;
      P.petals.run(t, [0, 1, 2].map((k) => ({ t0: KAI + 0.12 + k * 0.1, x: 1474 + (k - 1) * 22, y: top + 70, z: 522, n: 34, speed: 40, up: 30, size: 0.55, g: 120, dur: 1.8, seed: 300 + k, floor: top + 0.4, sz: 1.3, cone: 0.9, colors: ['#ff4d6d', '#ffb02e', '#ffe14d', '#e858d0', '#a35cff', '#ffffff', '#4fd06a'] })));
      // rainbow trails behind the flood riders (read from the aerial)
      if (!k9 && t >= 119.12 && t < REVEAL) { const RB = ['#ff4d6d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'];
        const w = 1 + 3 * smooth(119.3, 119.8, t);
        P.beam2.visible = true; P.beam2.set([0.3, 0.24, 0.18, 0.12, 0.06, 0].map((d) => wheelRide(t - d).add(V(0, 4, 0))), 1, { width: w, colors: RB });
        if (t >= 119.3) { P.beam.visible = true; P.beam.set([0.3, 0.24, 0.18, 0.12, 0.06, 0].map((d) => gliderRide(t - d)), 1, { width: w, colors: RB }); } }
      if (T.exactFrame(t, [CUE.flood])) fxs.flash = 0.25;
      if (T.exactFrame(t, [GUARD])) { fxs.flash = 0.3; fxs.flashColor = '#bfe4ff'; }

      // ---- battle UI anchors (real projected positions)
      for (const k in anchors) delete anchors[k];
      for (const b of BUG_NAMES) if (cast.C[b].g.visible) anchors[b] = cast.anchor(b, AV[b]);
      for (const n of ['jade', 'charlie', 'ricky']) anchors[n] = headTop(W.heroes[n], AV[n]);
      if (t >= 117.15 && t < 117.8) anchors.charlie.y += 18;   // GUARD sits above Jade's MISS (no overlap)
      // (r5) the window collapses to the lyric strip during gestures and conversions (full windows only while a command is chosen
      //      or the message line matters); the conversion cards keep their BUG -> FEATURE tag; (k09) the hero shot is slim too
      const slimR5 = r5 && ((t >= EH[0] && t < T3) || (t >= SENT && t < T4) || (t >= AXLE && t < T5) || (t >= 117.95 && t < K9T.race0));
      bui.update(t, { anchors, camera, slim: (!!k9 && t >= K9T.hero0 && t < K9T.race0) || slimR5, slimTags: slimR5 && t < K9T.hero0 });
      // golden hour (k08): a warm key + soft face fill through the battle, eased in after the swirl and back out over the
      // hand-over move so both seams keep Act III's look
      const g = smooth(OPEN, OPEN + 0.3, t) * (1 - smooth(REVEAL + 0.6, END - 0.2, t));
      const look = LOOK({ dim: 1 - 0.32 * dark, rays: 0.4 * (1 - dark) + 0.08 * g, atmos: 1, dofAmount: 0.18, bloomAmt: 0.18 + 0.1 * dark + 0.06 * g, hemi: 1 + 0.15 * g, fill: 1.1 + 0.3 * g,
        exposure: 0.6 + 0.13 * g, sunWarm: 1 + 0.5 * g, sunGain: 1 + 0.15 * g, heroFill: 0.42 + 0.25 * g, heroRim: 0.55 + 0.2 * g, sat: 1.12 + 0.08 * g, ...(sh.look || {}) });
      return { camera, target: sh.tgt, focus: sh.focus || sh.tgt, look, shadowExtent: sh.ext || 360, ui2d: bui.ui2d, noSubs: battleOwnsSubs(t) };
    },
  });

  let useV2 = false;
  return {
    stage: main.stage, W, smooth: main.smooth,
    update(t) {
      useV2 = !!v2 && (t < ENC || swirlFrame(t) >= 0);
      if (useV2) { v2.update(t); v2.smooth.set(null); bui.update(t, {}); return; }
      main.update(t);
    },
    render(t, target) {
      if (useV2) { v2.render(t, target); if (!r5) bui.render(ctx.renderer, target); return; }   // (v4b) no battle swirl: verse 2 holds to card 05 (no cut at the 107.15 seam)
      FX.show(); cast.show(); if (W.compose?.dressing?.s108) W.compose.dressing.s108.visible = false;   // compose's old 108 framing column (re-set every frame by applyLook)
      try { main.render(t, target); } finally { FX.hide(); FX.reset(); cast.hide(); cast.end();   // children too (act4 re-shows top-level groups)
        for (const b of P.books) b.rotation.order = 'XYZ';
        // act4 re-shows every top-level world group in its pre-erase frames: leave no stale particles / trails behind
        for (const k of ['burst', 'petals', 'sparks']) P[k].count = 0;
        for (const k of ['beam', 'beam2']) P[k].set([V(0, 0, 0), V(0, 0, 1)], 0);
        for (const sp of P.spots) { sp.pool.material.opacity = 0; sp.cone.material.opacity = 0; sp.light.intensity = 0; }
        if (k9) { k9.FW.hide(); k9.root.visible = false; k9.fig.group.visible = false; k9.tip.visible = false; if (W.colorMap) W.colorMap.on(false); } }
    },
  };
}

// ====================================================================== (flood_k09) the k09 flood, --look k08b only
/** the giant pencil: falls into Jade's hands (118.62-118.90), lifted (anticipation, to 119.0), driven in on 119.02, leaned
 *  over toward the wave by her push, eased back upright in the race (the recruit cut takes Act IV's planted pose).
 *  -> { x, y (tip apex), z, tilt (rad, top toward the wave) } | null */
function k9Pencil(t) {
  if (t < 118.40) return null;
  // falls from the sky into her hands (118.74, just after she lands on the 8th 118.726), wound up high over 118.76-118.99,
  // driven in on 119.02 (accelerating over the last frame)
  const H0 = DISC + 14, UP = 26; let y, tilt = 0;
  if (t < 118.74) { const u = (t - 118.40) / 0.34; y = H0 + 300 * (1 - u) * (1 - u); tilt = -0.25 * (1 - u); }
  else if (t < 118.99) y = H0 + UP * Math.pow(smooth(118.75, 118.99, t), 0.8) - 2 * Math.exp(-(t - 118.74) * 30);
  else if (t < CUE.flood) { const u = clamp01((t - 118.99) / (CUE.flood - 118.99)); y = H0 + UP + (top - 6 - H0 - UP) * u * u; }
  else { y = top - 6; const s = t - CUE.flood; tilt = (RINGM ? 0.3 : 0.12) * smooth(CUE.flood + 0.02, RINGM ? 119.2 : 119.5, t) + 0.035 * Math.exp(-s * 7) * Math.sin(s * 38);
    tilt *= 1 - smooth(K9T.race0 + 0.2, K9T.race0 + 0.9, t); }
  return { x: PENCIL.x, y, z: PENCIL.z, tilt };
}
/** world point on the pencil's axis, d units up from the tip apex, pushed out toward (px, pz) by off */
function k9PencilPt(t, d, px, pz, off = 5.2) {
  const pp = k9Pencil(t) || { x: PENCIL.x, y: top - 6, z: PENCIL.z, tilt: 0 }; const c = pushDir().x, s = pushDir().z;
  const ax = c * Math.sin(pp.tilt), ay = Math.cos(pp.tilt), az = s * Math.sin(pp.tilt);
  const p = new THREE.Vector3(pp.x + ax * d, pp.y + ay * d, pp.z + az * d); const hx = px - p.x, hz = pz - p.z, hl = Math.hypot(hx, hz) || 1;
  return p.set(p.x + hx / hl * off, p.y, p.z + hz / hl * off);
}
async function setupK9(W, ctx) {
  if (W._k9b) return W._k9b;
  // the ground the wave runs over: the stage (disc / amphitheatre seats), mesa A, a bridge of colour over the chasm, the
  // causeway and meadow hills, the sea (wave on its surface level)
  const gnd = (x, z) => {
    if (x >= MESA_B.x0 && x <= MESA_B.x1 && z >= MESA_B.z0 && z <= MESA_B.z1) return Math.max(floorY(x, z), seatY(x, z));
    if (x >= MESA_A.x0 && x <= MESA_A.x1 && z >= MESA_A.z0 && z <= MESA_A.z1) return MESA_A.top;
    if (x > CHASM.x0 && x < CHASM.x1 && z >= MESA_B.z0 && z <= MESA_B.z1) return top;
    return z <= 24 ? Math.max(-2, W.groundY(x, z)) : 0;
  };
  // the spine sweeps from the left foreground (128 deg) away into the left background (172 deg): the garden it leaves sits in
  // the left foreground of the hero frame, the concave face keeps facing the camera (k09's split: lush left, white plaster right)
  const FW = makeFloodWave(W, { centre: V(PENCIL.x, top, PENCIL.z), ground: gnd, psiFrom: K9_SWEEP[0], psi: K9_SWEEP[1], theta: K9_RACE });
  const root = new THREE.Group(); root.name = 'flood_k09_heroes'; root.visible = false; W.scene.add(root);
  const tip = rainbowTip(); tip.visible = false; root.add(tip);
  // Jade on the motion system (hair down: the giant pencil in her hands; her own pencils in hand while she sketches)
  const clips = await loadMotionClips();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); mat.userData.noPaint = true; patchPaint(mat, { noPaint: true, hero: true });
  const fig = new MotionFigure(ctx.lib, 'jade', { variant: 'jade_down', material: mat });
  fig.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); fig.group.visible = false; root.add(fig.group);
  const hd = (a, b) => Math.atan2(b.z - a.z, b.x - a.x);
  RINGM = floodRingOn();   // (v4b) the ring flood: she lands behind the pencil facing the front-on lens (RSTANCE)
  const ST = RINGM ? RSTANCE : K9_STANCE;
  const RFACE = hd(ST, RCAM);
  const track = new MotionTrack(clips, { t0: 117.5, pos: [FORWARD.jade.x, FORWARD.jade.z], heading: hd(FORWARD.jade, BOSS.caterpillar), unit: fig.unit, ground: floorY, timing: T, name: 'jade' })
    .idle(0, { until: 118.22 })
    .jump({ to: [ST.x, ST.z], landAt: 118.726, crouch: 0.1, air: 0.3 });
  if (RINGM) track.idle(0, { until: 121.6, face: RFACE, steps: false });   // (v4b) she lands facing the lens (RCAM is on her jump line)
  else track.idle(0, { until: 121.6, face: hd(K9_STANCE, PENCIL) });
  track
    .build();
  for (const w of track.warnings || []) console.log('[engine] [flood_k09] motion warning: ' + w);
  const CAO_ = 118.017, GAO_ = 118.278;
  const mouth = lipSync(T.raw().lyrics, { lines: [33] });
  // grips on the shaft: they slide up it as she straightens from the drive into the push
  const grip = (sd) => (t, f) => { const st = track.state(t); const up = smooth(CUE.flood + 0.01, 119.3, t);
    const d = RINGM ? (sd === 'R' ? 46 + 10 * up : 36 + 10 * up) : sd === 'R' ? 33 + 22 * up : 22 + 22 * up; return k9PencilPt(t, d, st.x, st.z); };   // (v4b) ring: chest-high grips, she stands up
  const layers = [
    { anim: 'draw_graphite', t0: CAO_ - 0.07, t1: CAO_ + 0.26, mask: 'upper', p: () => 0.3 },
    { anim: 'draw_graphite', t0: GAO_ - 0.07, t1: GAO_ + 0.26, mask: 'upper', p: () => 0.3 },
    { clip: 'push', t0: CUE.flood, t1: 121.6, mask: 'upper', fade: 0.12, p: () => 0.3 },
    // the drive: the native k09 lunge (front knee bent, back leg long, leaning in) under the push
    { anim: 'draw_rainbow', t0: CUE.flood - 0.03, t1: 121.6, mask: { legs: 1, hipR: 1, kneeR: 1, hipL: 1, kneeL: 1, body: 0.6 }, fade: 0.06, p: () => 0 },
  ].filter((L) => !(RINGM && L.t0 > 118.9));   // (v4b) the ring: no k09 lunge / push lean: she stands square to the lens, hands on the shaft (IK hold)
  const look = [{ at: BOSS.ladybug.clone().setY(top + 14), t0: 117.7, t1: 118.2, fade: 0.15 }, { at: BOSS.caterpillar.clone().setY(top + 10), t0: 118.18, t1: 118.6, fade: 0.12 },
    RINGM ? { at: RCAM.clone().setY(top + 60), t0: CUE.flood + 0.05, t1: 121.6, fade: 0.15 } : { at: (t) => FW.crest(0.62, t), t0: CUE.flood + 0.05, t1: 121.6, fade: 0.2 }];   // (v4b) the ring: she sings to the lens
  const opts = (t) => ({ layers, pencil: t < 118.66, look, mouth, ik: t < CUE.flood - 0.03,
    hands: { R: hold(grip('R'), 118.62, 121.6, { fade: 0.1 }), L: hold(grip('L'), 118.62, 121.6, { fade: 0.1 }) } });
  W._k9b = { FW, root, tip, fig, track, opts }; return W._k9b;
}
