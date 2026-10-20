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
import { LOOK as TALOS_LOOK, CRISP, SmoothSubs, R5, capDof } from '../act3/common.js';   // (act4 r5) R5(): the round-5 switch
import { lipSync } from '../../core/motion/index.js';   // (act4 r5) Jade's lip sync on the erased page (lines 36-37)
import { r5Shot } from '../../look.js';   // (act4 r5) look_r5's per-shot overrides (checkpoints/look_r5.md API)
import { FLOOD, FEATURE_T, handover } from '../act3/rap.js';   // (battle scene v2) handover(): Act III's last frame, continued
import { makeBattleUI, battleOwnsSubs } from '../../show/battle_ui.js';
import { subtitleFor } from '../../core/ui.js';
import { envUniforms } from '../../env.js';
import { getWorld, V, F, RT, E, J, SPIRAL, GROUND, GY, PAPER_Y, SUN, SUN_DAY, F5, RT5, at, yawFor, spiralPoint, placeHero, paint } from './world4.js';
import { Overlay } from './overlay.js';
import { makeAct4HUD } from './hud2d.js';   // (act4 M2) the second build bar + the speedrun split timer
import { pose as figPose } from '../../core/voxfig.js';   // (v45_jam) Charlie + Ricky's strums keyed to the music (pose 'chord' with our own phase)

// (v45_jam, Jade 2026-10-19 on v4.4: "Like 2:30, they could be playing their guitars, or Ricky's guitar could be bringing light here")
// the rebuild 149.786-154.26 ("That's it, the fixtures and the functions"). checkpoints/v45_jam.md
//   null = v4.4 (they stand; Ricky one chord on "functions") | 'play' = both play (strums on the guitar events, nods, the stab
//   together in the mini-stop, turn to each other on "functions") | 'light' = 'play' + every big strum of Ricky's sends a ring of warm
//   light across the island (it lights the lamp, flares the guitar, lifts the sunset key)
export const JAM_V45 = 'light';
// (v45_jam, Jade 2026-10-19: "maybe also while they're flying on the composite bug/feature contraption, Ricky's guitar playing provides
// power?") the party cart 161.728-168.075. null = v4.4 (Ricky strums the 8ths, Charlie idle until the button) | 'power' = both play;
// Ricky (moved to the camera side, standing) powers it: every strum flares the lamp, kicks the wheels + dust, flaps the glider and
// steps the REALITY LV2 -> LV3 bar; his big strums send a ring of light from under the cart; the launch chord (166.275) leaves a ring
// of light in the air behind it (the thrust). Charlie still SHIPS it (the button slam on 165.87)
export const CART_V45 = 'power';
// (v45_jam, scout's optional) the final-chorus lock shot 135.6-139.4: null = v4.4 (Charlie idle in the soft foreground, guitar on his back) |
// 'strum' = on the band stop (137.03) he swings the acoustic round and waits; his ONE strum on the lone hit (138.595) sends a bolt of
// light from his guitar to the top 一, which snaps home on it (the snap was already on that hit) as the camera whips into Jade's eye
export const LOCK_V45 = 'strum';
/** the bar's steps for the cart (hud2d opts.steps): the same strums as CART.steps below, from cues (K is built later in setup) */
function cartSteps() { const b = T.cue('act4.build'), e = T.cue('act4.eights'), acc = [163.715, 164.112, 164.708, 164.907, 165.502, 165.701, 166.098, 166.694, 166.892, 167.288, 167.883];
  return [...new Set([...T.beatsIn(b - 0.01, e - 0.01, 1), ...acc, T.cue('act4.chufa_accent')].filter((x) => x < e - 0.01).map((x) => Math.round(T.snap(x) * 1000) / 1000)), e].sort((a, c) => a - c); }

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
  const { W, heroes, field, PG, eraser, eraserS, flyCap, heldCap, rings, ringMat, feats, moreWheels, cartRig, spiral, tramp, pencil, bugs, lampLights, gate, gateGroup, sea, baseObjs, cams, ERASE, root } = Wd;
  const cam = cams.main;
  const ov = new Overlay(ctx);
  const hud = makeAct4HUD(ctx, CART_V45 === 'power' ? { steps: cartSteps() } : {});   // (act4 M2) (v45_jam: the bar steps on Ricky's strums)
  const bui = await makeBattleUI(ctx);   // (battle scene v2) the battle UI: THE ERASER draws near! (123.18) + the final-boss menu
  const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };
  // (act4 r5) round-5 staging (docs/game_design_half2_r5.md 123.18-173.02, checkpoints/act4_r5.md) behind --r5; every default path untouched
  const r5 = R5();

  // ---------------------------------------------------------------- cue table (measured, data/cues.json act4)
  const K = {
    start: C('bridge_start'), dOut: C('drums_out'), acc: C('bridge_accent'), dBack: C('drums_back'), ht: C('halftime_hits'),
    trip: C('triplet_roll'), steps: C('climb_steps'), fc: C('final_chorus'), stop: C('band_stop'), lone: C('lone_hit'), stop2: C('stop2'), slam: C('slam'),
    roll: C('snare_roll'), build: C('build'), chufa: C('chufa'), chufaAcc: C('chufa_accent'), eights: C('eights'), yibi: C('yibi'), yibiW: C('yibi_words'), last: C('last_hit'), pshot: C('pencil_shot'),
    need: T.word(39, 9).start, lookAt: 141.4, down: T.line(39).start, gang: T.line(41).start,
    // (act4 M1) the final boss joins: half-bar cuts + the finisher on the battle UI's beats (src/show/battle_ui.js HEARTS / ACTION)
    join: T.line(40).start,                       // 149.22 "That's it": THE ERASER joined the party! Class: UNDO
    rebuilt: T.nearestBeat(149.75),               // 149.786: the cut to the rebuilt world (the recruit shot holds the join)
    s2: T.nearestBeat(143.40), s3: T.nearestBeat(145.80), s4: T.nearestBeat(147.39),
    lift: T.nearestBeat(147.79), paint: T.nearestBeat(148.19), run: T.nearestBeat(148.59), ship: T.nearestBeat(148.99), capLand: T.nearestBeat(149.39),
  };
  K.release = K.ship + 0.2;
  K.bunIn = T.nearestBeat(123.55, 2);                 // (act4 M3) the pencils go into the bun (after the seam: 123.354 stays exact)
  K.lineFC = T.line(38).start;                        // (act4 r5) 135.6 "I think about stuff I read": the lock shot starts here (no cut at 136.212)
  { const b0 = T.nearestBeat(147.39), s16 = (T.nearestBeat(147.79) - b0) / 4;   // (act4 r5) `> you`: y o u on the 16ths from the "need?" beat, ENTER on the 4th
    K.type5 = [b0, b0 + s16, b0 + 2 * s16]; K.enter5 = b0 + 3 * s16; K.cutEyes = K.enter5 + 2 / T.fps();
    // (v4, Jade 2026-10-18) the answer is `> you are my friend`: typed ON THE VOCAL, one word per sung syllable of "that I need"
    // (that 146.556 · I? 146.89 · I 147.218 · need 147.36; the v3 syllable keys), the letters 0.05 s apart, so it is all typed
    // by 147.61 and ENTER stays on the same 16th (147.693): the eyes-widen cut and everything after it are unchanged.
    K.answer = 'you are my friend';
    { const starts = [146.556, 146.89, 147.218, 147.36], words = K.answer.split(' '), keys = [];
      words.forEach((w, i) => { const n = w.length + (i < words.length - 1 ? 1 : 0); for (let c = 0; c < n; c++) keys.push(starts[i] + 0.05 * c); });
      K.type5 = keys; } }
  K.drawOut = K.dBack + 0.02;                         // (act4 M3) 129.385 drums back: she draws them again (like 17.38), hair drops                       // the second cap leaves Charlie's hand (throw p = 0.4, 0.1 s into 'throw')
  // anchors in Team B's shared world (WORLD_API.md): +x forward, the sun ahead at +x, mesa B = the stage (top GY)
  const EB = V(1250, 0, -9000);                                // the dusk Eraser's base, beyond the hills behind the stage
  const RC = at(E, 260, 0).setY(GY);                           // the glyph's nearest ground stroke (colour-return centre)
  // r5: in the glyph's own frame (F5 / RT5, 28 deg left of the sun): bearing ~25 deg right of the 画's centre = where the sun disc is, so it hides the disc
  const EP1 = r5 ? E.clone().addScaledVector(F5, 1500).addScaledVector(RT5, 700).setY(GY) : at(E, 1350, 760).setY(GY);   // the Eraser resting on the page, right of the 画
  const EP2 = at(J, 250, -80).setY(GY);                        // where Jade meets it (on mesa B once the world is back)
  const STAGE = V(1330, GY, 450);                              // the gang on mesa B's stage (rebuilt world)
  const ERS = STAGE.clone().add(V(-50, 0, -80));               // the pink Eraser behind them
  const G0 = V(1505, GY, 450);                                 // the 出发 gate on mesa B's sea end
  // the band + bug-features exactly as Act III leaves them at 123.354 (src/scenes/act3/rap.js BAND / BUGP)
  const BAND = { jade: V(1378, GY, 454), charlie: V(1402, GY, 442), ricky: V(1424, GY, 460) };
  const BUGP = { ladybug: V(1330, GY, 458), beetle: V(1306, GY, 446), moth: V(1318, GY + 22, 436), caterpillar: V(1280, GY, 462), firefly: V(1292, GY + 28, 470) };
  const HANDOVER_CAM = { pos: V(1380, 52, 610), tgt: V(1350, GY + 26, 430), fov: 52 };   // rap.js camera at 123.354
  // ---------------------------------------------------------------- (act4 M2) the rebuilt world: anchors
  const SC = V(1360, GY, 450), DISC_Y = GY + 6;                  // the amphitheatre stage disc (r 46, top y 16)
  const floorY = (x, z) => (Math.hypot(x - SC.x, z - SC.z) < 47 ? DISC_Y : GY);
  const onFloor = (v) => v.setY(floorY(v.x, v.z));
  const RB = V(1330, GY, 352);                                   // the rebuild: Jade redraws the fixtures from here (open mesa south of the stage)
  const PARTY_SC = 46;                                           // the Eraser at party size (74 units tall; the heroes are ~69)
  const tFix = T.word(40, 3).start, tFun = T.word(40, 6).start;  // "fixtures" 150.255, "functions" 151.858
  const CART_X0 = 1440;                                          // the cart's start line, just short of the 出发 gate (G0.x 1505)

  // ---------------------------------------------------------------- world state (pure in t)
  function worldState(t) {
    const pre = t < K.acc, erased = t >= K.acc && t < K.slam, pour = t >= K.slam && t < K.rebuilt, rebuilt = t >= K.rebuilt;   // the world itself returns at 149.22 ("the rebuilt world")
    // (act4 M3) THE RULE FIXED: the rub spreads out from the Eraser on the horizon (a radial front centred on its base) and
    // erases GRAPHITE only: the plaster structure goes to blank paper + the white rub trails; every colour stays, floating as
    // hatched coloured shells (world4 uShell), until they dissolve into the chaos Jade measures (136.21 -> 137.03, the band cut)
    const rub = T.ease.in(T.clamp01((t - (K.dOut + 0.35)) / (K.acc - K.dOut - 0.35)));
    const eraseR = pre ? (t >= K.dOut + 0.35 ? T.lerp(300, 11500, rub) : -1) : 1e9;
    ERASE.uEC.value.copy(EB); ERASE.uER.value = eraseR;
    // (act4 M2) the rebuild: the world comes back as a wave from where Jade redraws (fixtures: plaster), the colour follows
    // from "functions"; both complete by the gang vocal (154.26)
    const gangOn = t >= K.gang;
    const rbR = rebuilt ? (gangOn ? 1e9 : T.keys(t, [[K.rebuilt, 0], [tFix, 150], [tFix + 0.45, 420], [tFun, 950], [tFun + 0.7, 2600], [K.gang - 0.25, 9000]], T.ease.out)) : -1;
    const colR = rebuilt ? (gangOn ? 1e6 : t < tFun ? -1 : T.keys(t, [[tFun, 0], [tFun + 0.9, 650], [K.gang - 0.25, 12000]], T.ease.out)) : -1;
    ERASE.uRC.value.copy(rebuilt ? RB : RC); ERASE.uRR.value = rbR;
    // pre-erase: every top-level group shown (v7, the 123.354 seam); (act4 M2) the rebuilt world: what W.reset() leaves visible
    // (its props, e.g. the void wall and the books, stay hidden), minus Team B's floating ink sculptures (coordinator: hide after 149.786)
    const legacyBG = t >= K.pshot;   // the pencil-tip hand-off (172.44-173.02) keeps v7's background exactly (Team D's match cut)
    const shells = !pre && t < K.stop;   // the erased page keeps the coloured shells until the band cut
    for (const o of baseObjs) o.visible = pre || ((rebuilt || shells) && (legacyBG || resetVis.get(o) !== false));
    ERASE.uShell.value = rebuilt ? 0 : 1; ERASE.uShellT.value = t; ERASE.uPaperY.value = PAPER_Y;
    ERASE.uShellFade.value = shells ? T.ease.in(T.span(t, K.fc, K.stop)) : 0;
    if (!rebuilt && (shells || t >= K.dOut + 0.35)) Wd.shellShadows(false);
    if (rebuilt && !legacyBG && W.compose?.strokes) W.compose.strokes.visible = false;
    if (sea) sea.visible = pre || (rebuilt && rbR > 1800);
    if (shells && W.compose?.strokes) W.compose.strokes.visible = false;
    if (rebuilt && !legacyBG && W.props.arch) W.props.arch.visible = false;
    // paint: the flood's full colour stays on every shell (colour can't be erased) -> (paper only while the colour pours)
    // -> the rebuilt world, coloured from "functions"
    if (pre || shells) paint(FLOOD.c, 40000, 300);
    else paint(rebuilt ? RB : RC, rebuilt ? colR : -1, 240);
    // paper ground: visible where erased; after the cut at 143.48 only the rub trails stay (as rainbow ribbons)
    Wd.ground.position.y = PAPER_Y;
    const P = PG; P.uEraseC.value.copy(EB); P.uEraseR.value = eraseR; P.uPaperVis.value = rebuilt && gangOn ? 0 : 1;
    P.uRestC.value.copy(rebuilt ? RB : RC); P.uRestR.value = rbR;
    P.uTrail.value = 1;
    P.uTrailIgnite.value = sm(K.slam, K.slam + 0.9, t);
    // the colour return: a coloured-pencil hatching wavefront racing out from the glyph over the page
    P.uColC.value.copy(RC); P.uColR.value = pour || (rebuilt && !gangOn) ? 5600 * Math.pow(T.clamp01((t - K.slam) / 4.0), 1.6) + Math.max(0, t - K.slam - 4.0) * 2500 : -1;
    const restR = -1;
    // glyph field: chaos -> lock -> ignite
    field.group.visible = !pre && t < K.rebuilt;   // (act4 M2, coordinator) the graphite 画 fragments go once the world is rebuilt
    const U = field.U; U.uTime.value = t; U.uIgnite.value = T.clamp01((t - K.slam) / 0.85); U.uIgniteT.value = t;
    U.uGlow.value = T.pulse(t, [K.slam], 0.6) + 0.3 * T.pulse(t, [K.lone], 0.3) + (r5 && t >= K.slam ? 0.25 : 0);   // (act4 r5) the lit 画 stays the brightest thing (0.25: no bloom blow-out of the 田's centre)
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
    SU.uGap.value.set(GAP[0], GAP[1]);   // (act4 M3) the caterpillar bridge spans this stretch
    // (act4 M3) the air fragments are coloured shards (the rule: colour can't be erased), lit by the firefly lamp at dusk
    U.uColorShards.value = 1; U.uLampP.value.copy(LAMP_P).add(V(0, 30, 0)); U.uLampK.value = t >= K.dBack && t < K.slam ? 1.1 * (0.9 + 0.1 * Math.sin(t * 2.1)) : 0;
    Wd.vantage.visible = !pre && t < K.rebuilt;
    if (Wd.crumbs) Wd.crumbs.visible = !pre && t < K.rebuilt;   // (act4 r5) eraser crumbs on the page
    return { pre, erased, rest: !pre && !erased, restR, pour };
  }

  // ---------------------------------------------------------------- the Eraser
  const eraserAnchor = V(0, 0, 0);
  function eraserState(t) {
    let pos, sc, st = { face: 'grumpy', pink: 0 }, yawE = null;
    const blink = (k) => (Math.abs(((t * 0.31 + k) % 1)) < 0.035 ? 1 : 0);
    if (t < K.acc) {
      // rising out of the sea on the horizon, then scrubbing (side to side)
      // mountain-sized, half-sunk below the horizon, rising; then scrubbing the page
      sc = 3800; pos = EB.clone(); pos.y = T.lerp(-6500, r5 ? -1900 : -2600, T.ease.out(T.clamp01((t - (K.start + 0.25)) / 1.3)));   // (act4 r5) rises higher: half the frame on the horizon
      const scrub = t >= K.dOut ? Math.sin((t - K.dOut) * Math.PI * 2 * 1.4) * 0.11 : 0;
      st = { face: 'grumpy', scrub, lean: scrub * 0.6 + 0.05 * T.clamp01((t - K.dOut) * 3), blink: blink(0.2) };
    } else if (t < K.lookAt) {
      pos = EP1.clone(); sc = 290; st = { face: 'grumpy', blink: blink(0.6), squash: 0.012 * Math.sin(t * 1.7) };
      if (t >= K.slam) st.face = 'look';
      if (r5) {   // (act4 r5) busy rubbing through the whole chaos; on the slam it stops dead and stares (the stop-and-stare lands on the lock)
        const busy = t < K.slam, ph = (t - K.acc) * Math.PI * 2 * 1.1;
        st.scrub = busy ? 0.09 * Math.sin(ph) : 0; st.lean = busy ? 0.05 * Math.sin(ph + 0.4) : -0.04 * T.ease.out(T.span(t, K.slam, K.slam + 0.3));
        st.blink = busy ? (t >= K.slam - 0.1 ? 1 : blink(0.6)) : 0;
        st.squash = busy ? 0.012 * Math.sin(t * 1.7) : 0.05 * Math.exp(-(t - K.slam) * 6) * Math.cos((t - K.slam) * 24); }
    } else if (t < K.rebuilt) {
      // (act4 M1) the final boss: looks at the 画, the party walks up, `> an eraser` (ENTER 147.358), then the triple-tech
      // finisher on the UI's beats: PAINT (148.191, hatched pink wavefront) -> RUN (148.59, the rings run it: it smiles)
      // -> SHIP (148.989, Charlie's hat out of his hat lands on its head at 149.388)
      pos = EP2.clone(); sc = 200;
      // (act4 M2, coordinator) it joins: a squash, then it POPS down to party size (it fits itself to the team) 149.45-149.77
      const shk = T.span(t, K.capLand + 0.06, K.rebuilt - 0.02);
      if (shk > 0) sc = T.lerp(200, PARTY_SC, T.ease.back(T.clamp01((shk - 0.3) / 0.7)));
      const pinkU = T.clamp01((t - K.paint) / (K.run + 0.05 - K.paint));   // linear: the hatch front crosses the face ~148.3-148.45
      const blinkAt = [T.nearestBeat(142.3), T.nearestBeat(143.2), T.nearestBeat(145.4), T.nearestBeat(146.6)];
      const lookBlink = blinkAt.some((b) => t >= b && t < b + 0.13) ? 1 : 0;
      const smile = t >= K.run + 0.13;
      const bump = (t0, a, f = 26, d = 5) => (t >= t0 ? a * Math.exp(-(t - t0) * d) * Math.cos((t - t0) * f) : 0);
      st = { pink: pinkU, hatch: true, face: smile ? 'happy' : 'look', blink: smile ? 0 : lookBlink, cap: t >= K.capLand,
        squash: 0.018 * Math.sin((t - K.lookAt) * 2.6) + bump(K.need, 0.03) + bump(K.run + 0.13, 0.07) + bump(K.capLand, 0.09)
          + (shk > 0 && shk < 0.3 ? 0.28 * Math.sin(Math.PI * shk / 0.3) : 0) + (shk >= 0.3 ? bump(K.capLand + 0.06 + 0.3 * (K.rebuilt - K.capLand - 0.08), 0.12, 30, 7) : 0),
        lean: t < K.down ? -0.05 * T.ease.inOut(T.span(t, K.lookAt, K.lookAt + 1.2)) : -0.05 * (1 - T.span(t, K.down, K.down + 1)),
        wave: smile ? Math.sin((t - K.run) * 9) : 0 };
      if (r5) {   // (act4 r5) it looms grumpy over the empty prompt; a blink, then its eyes WIDEN on ENTER (`> you`), the smile on RUN as before
        const wide = t >= K.enter5; st.face = smile ? 'happy' : (t < K.s2 || wide) ? 'look' : 'grumpy';
        st.blink = smile ? 0 : (t >= K.enter5 - 0.1 && t < K.enter5) ? 1 : (!wide && lookBlink ? 1 : 0);
        st.squash += bump(K.enter5, 0.05, 22, 6) - bump(K.need, 0.03); }
    } else {
      // (act4 M2) party-size: tidies Jade's stray lines (rebuild), cleans (gang), the cart's rear bumper (roll on)
      const m = eraserM2(t); pos = m.pos; sc = m.sc ?? PARTY_SC; yawE = m.yaw;
      const b = T.beatPulse(t, 1, 0.09); const sing = t >= K.gang && t < K.roll[0];
      st = { pink: 1, face: sing ? (Math.floor(T.beatAt(t) * 2) % 2 ? 'sing' : 'happy') : 'happy', squash: 0.05 * b, scrub: m.scrub ?? 0, lean: m.lean ?? 0, wave: m.wave ?? Math.sin(t * 6), blink: 0 };
    }
    // (act4 M1) the boss = hi LOD; once it has joined (rebuilt world, party-sized) = mid LOD, pink, with its cap
    const e = t >= K.rebuilt ? eraserS : eraser; eraser.visible = e === eraser; eraserS.visible = e === eraserS;
    if (t >= K.rebuilt) { st.cap = true; st.hatch = false; }
    e.position.copy(pos); e.scale.setScalar(sc);
    if (r5 && e.userData.material) e.userData.material.color.setScalar(t < K.acc ? T.lerp(0.22, 0.55, T.span(t, K.dOut + 0.6, K.acc)) : 1);   // (act4 r5) the rise: a silhouette against the dusk
    const d = E.clone().sub(pos);
    e.rotation.set(0, yawE ?? Math.atan2(d.x, d.z), 0);
    e.set(st);
    // battle UI anchor (the ♥+1 tags): just above its face
    { const fz = V(Math.sin(e.rotation.y), 0, Math.cos(e.rotation.y)), fx = V(fz.z, 0, -fz.x);   // its upper front corner (clear of the face and the cap)
      eraserAnchor.copy(pos).add(V(0, sc * 1.6 * 0.9, 0)).addScaledVector(fz, sc * 0.62 * 0.5).addScaledVector(fx, sc * 0.36); }
    return { pos, sc };
  }

  // ---------------------------------------------------------------- the hand-over: Act III's last frame, continued
  // (the band, the bug-features and the rap set exactly where src/scenes/act3/rap.js leaves them at 123.354)
  function handoverState(t) {
    handover(W, t, ctx);   // (battle scene v2) band, creature features, books, pencil exactly as act3's last frame (HANDOFF_123.md)
  }

  // ---------------------------------------------------------------- (act4 M1) THE FINAL BOSS JOINS (143.48 - 149.786)
  // Layout at EP2 (the Eraser, scale 200 = 320 units tall, face toward the vantage): the party walks up behind Jade; the
  // command window types `> an eraser` (UI); ENTER 147.358; the GLIDER swoops under Jade (147.6) and lifts her to its face
  // (147.793); PAINT 148.191 (she hatches it pink); RUN 148.59 (Ricky's chord rings run up it: it smiles); SHIP 148.989
  // (Charlie pulls a hat out of his hat and flings it: it lands on its head at 149.388). 149.22 joined (UI).
  const toE = EP2.clone().sub(J).setY(0).normalize(), sideE = V(-toE.z, 0, toE.x);
  const offE = (p, f, sd, y = 0) => p.clone().addScaledVector(toE, f).addScaledVector(sideE, sd).add(V(0, y, 0));
  const stand = offE(EP2, -150, 0).setY(GY);
  const SPOT = { charlie: offE(stand, -60, 62), ricky: offE(stand, -85, -66), lamp: offE(stand, -36, -34), button: offE(stand, -30, 32),
    wheel: offE(stand, -112, 22), bridge: offE(stand, -128, -26), glider: offE(stand, -150, -30, 48) };
  const PAINT_AT = offE(EP2, -122, -70, 168);         // glider origin while Jade paints (her head ~ at the face's eye line)
  const GL_K = 1.55;                                  // the glider grows to carry her (like Charlie's hat trampoline)
  const GL_TOP = 15.2 * Wd.FEAT_S;                    // thorax top above the glider origin (scale 1)
  const walkIn = (k, t, spot) => { const u = T.ease.inOut(T.clamp01((t - (K.down + 0.25 + 0.08 * k)) / (K.s3 - 0.3 - K.down - 0.25))); return { p: offE(spot, -110 * (1 - u), 0), moving: u > 0 && u < 1 }; };
  function gliderAt(t) {
    // -> { p, yaw, k (scale), anim, carrying }
    const bob = V(0, 3 * Math.sin(t * 2.1), 0);
    if (t < K.s4 + 0.2) { const w = walkIn(5, t, SPOT.glider); return { p: w.p.add(bob), yaw: yawFor(toE), k: 1, anim: 'idle', carrying: false }; }
    if (t < K.lift) { const u = T.ease.inOut(T.span(t, K.s4 + 0.2, K.lift)); const a = SPOT.glider, b = offE(stand, 0, 0, -GL_TOP * GL_K + 1);
      const p = lerpV(a, b, u); p.y -= 18 * Math.sin(Math.PI * u); return { p, yaw: yawFor(toE), k: T.lerp(1, GL_K, u), anim: 'use', carrying: false }; }
    if (t < K.paint) { const u = T.ease.inOut(T.span(t, K.lift, K.paint)); const a = offE(stand, 0, 0, -GL_TOP * GL_K + 1);
      const p = lerpV(a, PAINT_AT, u); p.addScaledVector(toE, -30 * Math.sin(Math.PI * u)); return { p, yaw: yawFor(toE), k: GL_K, anim: 'use', carrying: true, bank: -0.18 * Math.sin(Math.PI * u) }; }
    const drift = T.ease.inOut(T.span(t, K.capLand - 0.1, K.rebuilt + 0.4));
    const p = offE(PAINT_AT, -35 * drift, -25 * drift, -30 * drift - 90 * T.ease.inOut(T.span(t, K.capLand + 0.14, K.rebuilt + 0.2))).add(bob);   // glides down with the shrink
    if (t < K.run + 0.2) p.addScaledVector(sideE, 7 * Math.sin((t - K.paint) * 26));   // the scribble
    return { p, yaw: yawFor(toE), k: GL_K, anim: 'use', carrying: true };
  }
  const _hv = V(0, 0, 0);
  /** hand position (native figures: g.hand; carve fallback: chest height in front) */
  const handOf = (g, side = 'R', out = V()) => (g.hand ? g.hand(side, out) : out.copy(g.position).add(V(0, 34, 0)).addScaledVector(toE, 8));
  function recruitHeroes(t) {
    const H = heroes;
    // ---- Jade: off the vantage, runs up to it, writes `> an eraser` in the air, rides the glider up, paints it pink
    const tL = K.down + 0.55, tW = K.s3 - 0.15;
    const gl = gliderAt(t);
    if (t < tL) { const u = T.span(t, K.down, tL); const p = lerpV(J, at(J, 30, 25).setY(GY), u); p.y += 60 * u * (1 - u); placeHero(H.jade, p, toE, { anim: 'jump', frame: u < 0.5 ? 0 : 1, pencil: true }); }
    else if (t < tW) { const u = T.ease.inOut(T.clamp01((t - tL) / (tW - tL))); placeHero(H.jade, lerpV(at(J, 30, 25).setY(GY), stand, u), toE, { anim: 'run', t, pencil: true }); }
    else if (!gl.carrying) {
      if (r5) {   // (act4 r5) she doesn't know what to type: the pencil held out, a slow searching sway; on "need?" three flicks (y o u), ENTER
        const k = K.type5.filter((x) => t >= x).length;
        placeHero(H.jade, stand, toE, k ? { anim: 'draw_rainbow', frame: k % 2, pencil: true } : { anim: 'draw_graphite', frame: 0, pencil: true });
        if (!k) H.jade.rotation.y += 0.06 * Math.sin((t - K.down) * 1.7);
      } else placeHero(H.jade, stand, toE, { anim: t >= K.need ? 'draw_rainbow' : 'draw_graphite', t, frame: 0, pencil: true });
    } else {
      const feet = gl.p.clone().add(V(0, GL_TOP * gl.k, 0));
      const hop = t < K.lift + 0.16 ? Math.sin(Math.PI * T.span(t, K.lift, K.lift + 0.16)) * 8 : 0; feet.y += hop;
      placeHero(H.jade, feet, toE, { anim: 'draw_rainbow', frame: 0, pencil: true });
      if (t >= K.paint && t < K.run + 0.2) H.jade.rotation.y += 0.12 * Math.sin((t - K.paint) * 26);   // scribbling
    }
    // ---- Charlie: walks up; SHIP: pulls a hat out of his hat (hatless 'pull', his cap held crown-down), flings the new one
    const cw = walkIn(1, t, SPOT.charlie);
    const tPull = K.ship - 0.05, tThrow = K.release - 0.1;   // the pop out of the hat lands on the SHIP beat
    heldCap.visible = false; flyCap.visible = false;
    if (t < tPull) placeHero(H.charlie, cw.p, toE, { anim: cw.moving ? 'run' : 'idle', t: t + 0.4, pencil: false });
    else if (t < tThrow) {
      placeHero(H.charlie, cw.p, toE, { anim: 'pull', frame: 2, pencil: false });
      const hc = handOf(H.charlie, 'R', V()).add(handOf(H.charlie, 'L', _hv)).multiplyScalar(0.5);
      heldCap.visible = true; heldCap.position.copy(hc).add(V(0, 3, 0)); heldCap.rotation.set(Math.PI, yawFor(toE), 0); heldCap.scale.setScalar(23);
      const u = T.ease.out(T.span(t, K.ship, tThrow));   // the second cap rises out of the first (on the beat)
      flyCap.visible = u > 0; flyCap.position.copy(hc).add(V(0, 3 + 12 * u, 0)); flyCap.rotation.set(0, yawFor(toE) + 4 * u, 0); flyCap.scale.setScalar(Math.max(0.01, 23 * u));
    } else placeHero(H.charlie, cw.p, toE, { anim: 'throw', t: t - tThrow, pencil: false });
    if (t >= tThrow && t < K.capLand) {
      // the flight: from the hand at release to its seat on the Eraser's head, growing to its scale
      const relHand = (() => { const tt = Math.max(t, tThrow); if (tt >= K.release) { H.charlie.set({ anim: 'throw', t: K.release - tThrow, pencil: false }); const h = handOf(H.charlie, 'R', V()); H.charlie.set({ anim: 'throw', t: t - tThrow, pencil: false }); return h; } return handOf(H.charlie, 'R', V()); })();
      eraser.updateMatrixWorld(true); const seat = eraser.userData.cap.getWorldPosition(V()); const seatQ = eraser.userData.cap.getWorldQuaternion(new THREE.Quaternion());
      if (t < K.release) { flyCap.visible = true; flyCap.position.copy(relHand); flyCap.rotation.set(0, yawFor(toE), 0); flyCap.scale.setScalar(23); }
      else {
        const u = T.span(t, K.release, K.capLand); const e = T.ease.out(u);
        flyCap.visible = true; flyCap.position.copy(relHand).lerp(seat, e); flyCap.position.y += 70 * Math.sin(Math.PI * u);
        flyCap.quaternion.copy(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yawFor(toE) + (1 - e) * 9, 0.4 * (1 - e)))).slerp(seatQ, e * e);
        flyCap.scale.setScalar(T.lerp(23, 200, e * e));
      }
    }
    // ---- Ricky: walks up; RUN: the chord on 148.59, then sustains under the rings
    const rw = walkIn(2, t, SPOT.ricky);
    placeHero(H.ricky, rw.p, toE, { anim: rw.moving ? 'run' : t >= K.run - 0.03 ? (t < K.run + 0.3 ? 'chord' : 'sustain') : 'idle', t: t >= K.run - 0.03 ? t - (K.run - 0.03) : t, pencil: false });
    // ---- the five features
    featureState(t, gl);
  }
  function featureState(t, gl) {
    const F = feats; for (const f of Object.values(F)) f.visible = false; lampLights[0].intensity = 0; lampLights[1].intensity = 0;
    if (t < K.s2 - 0.05) return;
    const beat = T.beatAt(t); const cheer = t >= K.capLand;
    const put = (name, p, anim, o = {}, k = 1, yaw = yawFor(toE)) => { const f = F[name]; f.visible = true; f.position.copy(p); f.rotation.set(0, yaw, 0); f.scale.setScalar(k); f.set({ anim, t, beat, ...o }); return f; };
    const lw = walkIn(3, t, SPOT.lamp); put('lamp', lw.p, cheer ? 'dance' : 'idle', { glow: 1 });
    lampLights[0].position.copy(lw.p).add(V(0, 30, 0)); lampLights[0].intensity = 900;
    const bw = walkIn(4, t, SPOT.button); put('button', bw.p, cheer ? 'dance' : 'idle');
    const ww = walkIn(0, t, SPOT.wheel); put('wheel', ww.p, ww.moving ? 'roll' : cheer ? 'dance' : 'idle', ww.moving ? { dist: -110 * (1 - T.span(t, K.down + 0.25, K.s3 - 0.3)) } : {}, 1, yawFor(sideE.clone().negate()));
    const brw = walkIn(6, t, SPOT.bridge); put('bridge', brw.p, cheer ? 'dance' : 'idle');
    put('glider', gl.p, gl.anim, gl.bank !== undefined ? { bank: gl.bank } : {}, gl.k, gl.yaw);
  }
  // Ricky's chord rings (RUN): three rainbow rings sweep up the Eraser from its base and run the colour
  function ringState(t) {
    for (const r of rings) r.visible = false;
    if (r5 && t >= K.gang && t < K.roll[0]) {   // (act4 r5) Ricky's rings run the colour up each chunk Jade colours
      const ci = colourT.findIndex((x) => t >= x && t < x + 0.7); if (ci < 0) return; ringMat.uniforms.uT.value = t; ringMat.uniforms.uA.value = 1;
      rings.forEach((r, i) => { const u = T.span(t, colourT[ci] + 0.1 * i, colourT[ci] + 0.1 * i + 0.4); if (u <= 0 || u >= 1) return; r.visible = true;
        r.position.copy(CHUNKS[ci]).setY(CHUNKS[ci].y + 1 + 30 * T.ease.out(u)); r.rotation.set(0, 0, 0); const g = 1 + 0.12 * Math.sin(Math.PI * u); r.scale.set(17 * g, 1, 17 * g); });
      return; }
    if (t < K.run || t >= K.run + 0.75 || t >= K.rebuilt) return;
    ringMat.uniforms.uT.value = t;
    rings.forEach((r, i) => { const u = T.span(t, K.run + 0.09 * i, K.run + 0.09 * i + 0.45); if (u <= 0 || u >= 1) return;
      r.visible = true; r.position.copy(EP2).setY(GY + 330 * T.ease.out(u)); r.rotation.set(0, eraser.rotation.y, 0);
      const g = 1 + 0.12 * Math.sin(Math.PI * u); r.scale.set(118 * g, 1, 82 * g); ringMat.uniforms.uA.value = 1; });
  }

  // ---------------------------------------------------------------- (act4 r5) the command line IN THE WORLD: `> you`
  // a big terminal window floating between Jade and the Eraser's face (143.48-147.8): the cursor blinks EMPTY until "need?",
  // then y o u type on the 16ths and ENTER lights the key; battle_ui's 2D field is asked NOT to draw here (REQUESTS in act4_r5.md)
  const FIELD_P = offE(stand, 55, 10, 116);   // 33 u in front of its face plane (EP2 - 62 toE), between its chin and Jade's head
  const field5 = r5 ? makeWorldField() : null;
  function makeWorldField() {
    const cv = document.createElement('canvas'); cv.width = 1408; cv.height = 272; const g2 = cv.getContext('2d');   // (v4) 1.5x wider for `> you are my friend`
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(165, 32), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    m.visible = false; m.userData.noAO = true; m.renderOrder = 5; root.add(m);
    let key = '';
    m.draw = ({ text, cursor, hit, alpha }) => {
      const k = text + '|' + cursor + '|' + hit + '|' + alpha.toFixed(2); if (k === key) return; key = k;
      g2.clearRect(0, 0, cv.width, cv.height); g2.globalAlpha = alpha;
      g2.fillStyle = hit ? 'rgba(22,30,70,0.96)' : 'rgba(9,12,30,0.93)'; g2.strokeStyle = hit ? '#ffe28a' : '#ffffff'; g2.lineWidth = 10;
      g2.beginPath(); g2.roundRect(8, 8, cv.width - 16, cv.height - 16, 18); g2.fill(); g2.stroke();
      g2.strokeStyle = '#5a6090'; g2.lineWidth = 4; g2.beginPath(); g2.roundRect(22, 22, cv.width - 44, cv.height - 44, 10); g2.stroke();
      const kwF = 250, roomF = cv.width - 42 - kwF - 52 - 90; let fsF = 150;   // (v4) the full answer fits left of the ENTER key (+ the cursor)
      g2.font = `bold ${fsF}px "DejaVu Sans Mono", "Liberation Mono", monospace`; const wF = g2.measureText('> ' + K.answer).width; if (wF > roomF) fsF = Math.floor(fsF * roomF / wF);
      g2.font = `bold ${fsF}px "DejaVu Sans Mono", "Liberation Mono", monospace`; g2.textBaseline = 'middle'; g2.textAlign = 'left'; g2.fillStyle = '#58f08a';
      g2.shadowColor = 'rgba(88,240,138,0.55)'; g2.shadowBlur = 18;
      const s = '> ' + text; g2.fillText(s, 52, cv.height / 2 + 6); const w = g2.measureText(s).width;
      if (cursor) g2.fillRect(52 + w + 10, cv.height / 2 - Math.round(fsF * 0.41), Math.round(fsF * 0.41), Math.round(fsF * 0.83));
      g2.shadowBlur = 0;
      const kw = 250, kx = cv.width - 42 - kw;
      g2.fillStyle = hit ? '#ffe28a' : '#1c2250'; g2.beginPath(); g2.roundRect(kx, 72, kw, 128, 14); g2.fill();
      g2.strokeStyle = hit ? '#ffffff' : '#7b84b8'; g2.lineWidth = 5; g2.stroke();
      g2.font = 'bold 54px "DejaVu Sans", sans-serif'; g2.fillStyle = hit ? '#0b0f24' : '#9aa0c0'; g2.textAlign = 'center'; g2.fillText('ENTER \u21b5', kx + kw / 2, 136); g2.textAlign = 'left';
      g2.globalAlpha = 1; tex.needsUpdate = true;
    };
    return m;
  }
  function fieldState(t) {   // after camera(t): the window faces the lens
    if (!field5) return;
    field5.visible = t >= K.down && t < K.cutEyes;
    if (!field5.visible) return;
    const n = K.type5.filter((x) => t >= x).length; const hit = t >= K.enter5;
    field5.draw({ text: K.answer.slice(0, n), cursor: !hit && (n > 0 || Math.floor((t - K.down) * 2.5) % 2 === 0), hit, alpha: 1 });
    const pop = T.ease.back(T.span(t, K.down, K.down + 0.22)); field5.scale.setScalar(Math.max(0.01, pop) * (hit ? 1 + 0.05 * Math.exp(-(t - K.enter5) * 12) : 1));
    // (v4) the longer answer's window is wider: pulled 34 u toward the lens so its left end clears the Eraser's body
    field5.position.copy(FIELD_P).addScaledVector(cam.position.clone().sub(FIELD_P).normalize(), 34); field5.lookAt(cam.position);
  }
  // (act4 r5) Jade's lip sync on the erased page (lines 36-37, lyrics_timed.json word times) through the native rig's face
  const mouth5 = r5 ? lipSync(T.raw().lyrics, { lines: [36, 37] }) : null;
  const faceOf = (h) => { for (const o of h.children[0]?.children || []) if (o.visible && o.userData.F?.setFace) return o.userData.F; return null; };
  const BLINKS5 = [130.2, 131.9, 133.3, 134.6, 136.9, 138.2];
  function jadeFace(t) {   // call AFTER placeHero (pose() resets the face); a no-op on figure sources without a face rig
    if (!mouth5) return; const Fg = faceOf(heroes.jade); if (!Fg) return;
    const w = mouth5(t); let best = 'rest', bw = 0; for (const k in w) if (k !== 'rest' && w[k] > bw) { bw = w[k]; best = k; }
    Fg.setFace({ viseme: bw > 0.35 ? best : 'rest', blink: BLINKS5.some((b) => t >= b && t < b + 0.12) ? 1 : 0 });
  }

  // ---------------------------------------------------------------- (act4 M3) the features on the erased page (129.385 -> the band cut)
  // the firefly LAMP stands by Jade and lights the coloured shards so she can measure them; the caterpillar BRIDGE crawls up and
  // spans the gap in Ricky's sound-wave spiral; the glider circles, the wheel and the button wait with Charlie and Ricky
  const GAP = [0.5, 0.6];
  const LAMP_P = at(GROUND.jade, 26, 20).setY(GY);
  const tBridge = T.nearestBeat(131.75, 2);
  function pageFeatures(t) {
    for (const f of Object.values(feats)) f.visible = false;
    if (t < K.dBack || t >= K.stop) return;
    const beat = T.beatAt(t);
    const put = (name, p, anim, o = {}, k = 1, yaw = yawFor(F)) => { const f = feats[name]; f.visible = true; f.position.copy(p); f.rotation.set(0, yaw, 0); f.scale.setScalar(k); f.set({ anim, t, beat, ...o }); return f; };
    put('lamp', LAMP_P, 'use', { glow: 1 }, 1, yawFor(F) + 0.6); lampLights[0].position.copy(LAMP_P).add(V(0, 30, 0)); lampLights[0].intensity = 2600 * (0.92 + 0.08 * Math.sin(t * 2.1));
    put('button', at(GROUND.ricky, 12, -28).setY(GY), 'idle', {}, 1, yawFor(F) - 0.4);
    put('wheel', at(GROUND.charlie, -22, 26).setY(GY), 'idle', {}, 1, yawFor(RT));
    const a = (t - K.dBack) * 0.7; put('glider', at(SPIRAL.c, Math.cos(a) * 70, Math.sin(a) * 70).setY(GY + 105 + 6 * Math.sin(t * 1.3)), 'use', {}, 1, yawFor(V(-Math.sin(a), 0, Math.cos(a)).applyAxisAngle(V(0, 1, 0), 0)));
    // the bridge: waits by the spiral, then crawls up into the gap (it "spans one gap between shards on the way up")
    const b0 = spiralPoint(GAP[0]), b1 = spiralPoint(GAP[1]); const mid = spiralPoint((GAP[0] + GAP[1]) / 2);
    const tan = b1.clone().sub(b0); const hl = Math.hypot(tan.x, tan.z); const yaw = Math.atan2(-tan.z, tan.x), pitch = Math.atan2(tan.y, hl);
    const u = T.ease.inOut(T.span(t, tBridge, tBridge + 0.4));
    const rest = at(SPIRAL.c, 52, -58).setY(GY);
    const p = lerpV(rest, mid.clone().add(V(0, -BRIDGE_DECK, 0)), u); p.y += 30 * Math.sin(Math.PI * u);
    const f = put('bridge', p, u >= 1 ? 'use' : 'dance', {}, 1, 0);
    f.rotation.set(0, T.lerp(yawFor(F), yaw, u), pitch * u, 'YZX'); f.scale.set(T.lerp(1, tan.length() * 1.25 / BRIDGE_LEN, u), 1, 1);
  }
  const BRIDGE_LEN = (() => { const b = new THREE.Box3().setFromObject(feats.bridge); return Math.max(10, b.max.x - b.min.x); })();
  const BRIDGE_DECK = (() => { const b = new THREE.Box3().setFromObject(feats.bridge); return Number.isFinite(b.max.y) ? b.max.y * 0.8 : 6; })();

  // ---------------------------------------------------------------- heroes
  const triplets = T.beatsIn(K.trip[0] - 0.01, K.trip[1] + 0.05, 3);
  function heroState(t) {
    const H = heroes; for (const h of Object.values(H)) h.visible = false;
    tramp.visible = false; pencil.visible = false;
    const fwd = F.clone();
    if (t < K.acc) {
      handoverState(t);
      // (act4 M3) hair continuity (decision 8): the drums stopped (123.18); right after the 123.354 seam Jade twists her hair up
      // and pushes BOTH pencils through the bun (arms up at the bun), then stands with her hair up, the pencils crossed in an X
      if (t >= K.bunIn && W.heroes?.jade) W.heroes.jade.set(t < K.bunIn + 0.36 ? { anim: 'jade_bun_pull', t: t - K.bunIn, frame: undefined, pencil: false } : { anim: 'idle', t, frame: undefined, pencil: false });
      if (r5 && t >= K.bunIn && W.props?.pencil) W.props.pencil.visible = false;   // (act4 r5) the giant pencil would stand in front of the rising Eraser
      return;
    }
    if (t < (r5 ? K.down : K.slam + 4.0) && t < K.down) {   // (v4b) r5: the vantage holds to the paper card (143.48): the front-on reaction shot
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
        else if (LOCK_V45 && t >= K.stop - 0.2) lockStrum(t, p, fwd);   // (v45_jam) the lone hit is Charlie's strum
        else placeHero(H.charlie, p, fwd, { anim: 'idle', t, pencil: false });
      }
      // trampoline (hat) at the end of the bridge
      const tp = spiralPoint(0.985); const tIn = cT1 + 0.25;
      if (t >= tIn && t < K.steps[2] + 0.5) {   // (act4 M3) folded away once Jade has landed (it crossed the lock approach)
        tramp.visible = true; tramp.position.copy(tp).add(V(0, 0.5, 0)); tramp.rotation.set(0, yawFor(fwd), 0);
        const s0 = K.steps[0]; tramp.set({ anim: 'rest', frame: t >= s0 && t < s0 + 0.1 ? 1 : t >= s0 + 0.1 && t < s0 + 0.24 ? 2 : 0 });
        tramp.scale.setScalar(T.clamp01((t - tIn) / 0.12) * 0.9);
      }
      // ---------------- Jade
      if (t < K.drawOut + 0.22) placeHero(H.jade, GROUND.jade, fwd, { anim: 'jade_bun_pull', t: t - K.dBack, pencil: false });       // hand up to the bun (hair up)
      else if (t < K.drawOut + 0.5) placeHero(H.jade, GROUND.jade, fwd, { anim: 'jade_twin_draw', t: t - K.drawOut - 0.22, pencil: false });   // both pencils out (still up)
      else if (t < K.ht[2]) placeHero(H.jade, GROUND.jade, fwd, { anim: 'draw_graphite', frame: 0, pencil: true });      // hair down; the painter's gesture
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
        const hideAtEye = r5 ? (t > K.lone + 0.1 && t < K.slam + 2.0) : (t > K.stop2 - 0.2 && t < K.slam + 2.0);  // the camera IS her eye (r5: the whip starts on the lone hit)
        placeHero(H.jade, J, r5 ? F5 : fwd, { anim: 'draw_graphite', frame: 0, pencil: true });   // (act4 r5) she faces the 画 (28 deg left of the sun)
        H.jade.visible = !hideAtEye;
      }
      if (r5 && t >= K.drawOut + 0.5 && H.jade.visible) jadeFace(t);   // (act4 r5) lip sync while she sings on the page
      pageFeatures(t);   // (act4 M3)
      return;
    }
    if (t < K.rebuilt) { recruitHeroes(t); return; }
    m2Heroes(t);
  }

  // ================================================================ (act4 M2) 149.786 -> 173.02
  // REBUILD 149.786-154.26: Jade redraws the fixtures (the world comes back as a wave from her), hopping on "fixtures" and
  //   "functions"; the pink Eraser follows her and rubs out her stray lines; the graphite slab gag (drawn -> alive).
  // GANG 154.26-160.83: all nine in parallel, facing the camera: Jade colours the chunks Charlie's hats seed, Ricky's rings run
  //   them, the Eraser cleans, the wheel hauls, the glider flies, the lamp lights, the bridge spans, the button blinks.
  // ROLL 160.83-161.715: the features click together into the PARTY CART on the 16ths; everyone piles on.
  // BUILD 161.728-165.87: the cart revs at the start line while 出发 draws itself (the countdown); 165.87 Charlie SLAMS the
  //   button: the cart launches between 出 and 发 and off the mesa edge into the sky.
  const RBP = [RB.clone(), RB.clone().add(V(22, 0, 26)), RB.clone().add(V(44, 0, 50))];      // Jade's three drawing spots
  const jadeRB = (t) => { const hops = [tFix - 0.16, tFun - 0.16]; let k = 0; for (const h of hops) if (t >= h) k++;
    const h = hops[k - 1]; const u = k ? T.ease.inOut(T.clamp01((t - h) / 0.26)) : 1;
    const p = k ? lerpV(RBP[k - 1], RBP[k], u) : RBP[0].clone(); if (k && u < 1) p.y += 10 * Math.sin(Math.PI * u); return { p, moving: k && u < 1 }; };
  const GANG3 = {   // the gang on / around the stage disc, facing +x (the camera, the low sun behind it)
    jade: V(1394, 0, 452), ricky: V(1384, 0, 414), charlie: V(1384, 0, 490), eraser: V(1346, 0, 476),
    lamp: V(1402, 0, 384), button: V(1404, 0, 518), bridge: V(1322, 0, 430), wheel: V(1300, 0, 450), glider: V(1350, 0, 450),
  };
  // (act4 r5) the swarm: ONE locked wide from above and behind (camera at x ~1160 looking +x into the sunset), nine lanes in nine
  // screen regions: near row Ricky L / Jade C / Charlie R (backs to us, working forward), mid row the Eraser L / the chunks + bridge C /
  // the wheel's haul lane R, far row the lamp L / the glider top-C / the button R
  const GANG5 = {
    jade: V(1262, 0, 452), ricky: V(1250, 0, 372), charlie: V(1250, 0, 532), eraser: V(1340, 0, 346),
    lamp: V(1452, 0, 376), button: V(1452, 0, 530), bridge: V(1372, 0, 452), wheel: V(1330, 0, 548), glider: V(1402, 0, 452),
  };
  const GANG = r5 ? GANG5 : GANG3;
  for (const v of Object.values(GANG)) onFloor(v);
  const CHUNKS = (r5 ? [V(1372, 0, 404), V(1372, 0, 500), V(1426, 0, 440), V(1426, 0, 504)] : [V(1338, 0, 404), V(1318, 0, 452), V(1336, 0, 500), V(1306, 0, 404)]).map(onFloor);   // Charlie's hats seed them
  const gangBeats = T.beatsIn(K.gang, K.roll[0], 1);
  const chunkT = CHUNKS.map((_, i) => gangBeats[Math.min(gangBeats.length - 1, 1 + i * 3)]);         // a chunk every 3 beats
  const colourT = chunkT.map((x) => x + 0.8);                                        // Jade colours it two beats later
  const cartFrame = (t) => {
    if (t < K.chufa) { const u = T.ease.out(T.span(t, K.build, K.chufa - 0.4)); const rev = t >= K.build ? 1.2 * T.beatPulse(t, 2, 0.05) : 0;
      return { pos: V(CART_X0 + 14 * u - rev, GY, 452), yaw: 0, dist: 14 * u + (t >= K.build ? (t - K.build) * 30 : 0) }; }
    const dt = t - K.chufa; const x = CART_X0 + 14 + 260 * dt + 420 * dt * dt; const over = Math.max(0, x - 1560);
    // (act4 r5) suspension: the chassis bobs over the mesa's pavers (the wheels stay on the ground: m2Features), nothing once airborne
    const susp = r5 && over <= 0 ? (1.4 * Math.sin(x * 0.11) + 0.8 * Math.sin(x * 0.29 + 1.3)) * T.clamp01(dt * 4) : 0;
    return { pos: V(x, GY + over * 0.42 + 26 * (1 - Math.exp(-over / 50)) + susp, 452), yaw: 0, dist: x - CART_X0, susp };
  };
  K.cartFrame = cartFrame;
  // the assembly order on the roll's 16ths: [part, 16th index]
  const ROLL16 = T.beatsIn(K.roll[0] - 0.01, K.roll[1] + 0.02, 4);
  const at16 = (k) => ROLL16[Math.min(ROLL16.length - 1, k)];
  const ASM = { bridge: 0, wheel0: 1, wheel1: 2, wheel2: 2, wheel3: 3, lamp: 3, button: 4, glider: 5, eraser: 6, seat0: 6, seat1: 7, seat2: 7 };
  const asmU = (name, t) => T.ease.inOut(T.clamp01((t - at16(ASM[name])) / 0.22));

  function eraserM2(t) {
    if (t >= K.pshot) return { pos: ridePos(t), yaw: 0, sc: 62, wave: Math.sin(t * 6) };   // v7's background Eraser in the hand-off shot
    if (t < K.gang) {   // the rebuild: one step behind Jade, rubbing out her stray lines
      const jp = jadeRB(Math.max(K.rebuilt, t - 0.9)).p; const pos = onFloor(jp.clone().add(V(-30, 0, 34)));
      return { pos, yaw: Math.PI / 2 - 0.5, scrub: 0.12 * Math.sin(t * 14), lean: 0.06 * Math.sin(t * 7) };
    }
    if (t < K.roll[0]) return { pos: GANG.eraser.clone(), yaw: Math.PI / 2 - 0.2, scrub: 0.1 * Math.sin(t * 13), lean: 0.05 * Math.sin(t * 6.5) };
    const slot = cartRig.world('eraser', cartFrame(t)); const u = asmU('eraser', t);
    const p = lerpV(GANG.eraser, slot.p, u); p.y += 45 * Math.sin(Math.PI * u);
    return { pos: p, yaw: T.lerp(Math.PI / 2 - 0.2, slot.yaw, u), wave: t >= K.chufa ? 1 : Math.sin(t * 6) };
  }

  // ================================================================ (v45_jam) THE JAM 149.786-154.26: Charlie + Ricky play behind Jade
  // Guitar events measured on the demucs 'other' stem (work/demucs/htdemucs_ft/song/other.wav, 800-6000 Hz onset strength on the
  // 16th grid): the band's mini-stops 150.755-150.96 / 151.05-151.36 (cues act4.mini_stops) with the STAB 150.982 between them (the
  // strongest guitar onset in the window), 151.779 (the chord under "functions"), 154.169 (into the gang vocal). Ricky plays quarters
  // (his big strums on the measured hits), Charlie strums 8ths; both freeze in the stops and hit the stab together.
  const JAM = (() => {
    const t0 = K.rebuilt, t1 = K.gang + 0.3, stops = C('mini_stops');
    const inStop = (x) => stops.some(([a, b]) => x > a - 0.02 && x < b + 0.02);
    const stab = T.nearestBeat(150.982), big = [stab, T.nearestBeat(151.779), T.nearestBeat(154.169)];
    const q = T.beatsIn(t0 - 0.01, t1, 1).filter((x) => !inStop(x) || Math.abs(x - stab) < 0.03);
    const e8 = T.beatsIn(t0 - 0.01, t1, 2).filter((x) => !inStop(x) || Math.abs(x - stab) < 0.03);
    // the light rings (JAM_V45 'light'): Ricky's downbeats + the measured hits; k = strength
    const rings = [[t0, 0.55], [T.nearestBeat(150.185), 0.7], [stab, 1.0], [big[1], 1.0], [T.nearestBeat(152.576), 0.7], [T.nearestBeat(153.372), 0.7], [big[2], 1.0]];
    return { t0, t1, stops, inStop, stab, big, q, e8, rings, face: T.nearestBeat(151.779), back: T.nearestBeat(153.771) };
  })();
  K.jam = JAM;
  // the duo's spots (RB = Jade's first drawing spot): both to Jade's left (screen right in R1 / R1b), Ricky upstage
  const JAM_P = { charlie: RB.clone().add(V(-38, 0, -50)), ricky: RB.clone().add(V(-64, 0, -8)) };
  const figOf = (g) => { for (const o of g.children[0]?.children || []) if (o.visible && o.userData.F) return o.userData.F; return null; };
  /** the picking-hand phase for voxfig pose 'chord' (strum offset = 2.6 sin 2pi p): p 0.25 = hand up, 0.75 = hand down. The downstroke
   *  lands ON each hit (dn s long), then the hand floats back up before the next one; frozen (muted) in the mini-stops */
  function strumP(t, hits, dn = 0.07) {
    let k = -1; for (let i = 0; i < hits.length; i++) if (hits[i] - dn <= t) k = i;
    if (k < 0) return 0.25;
    const h = hits[k]; if (t < h) return 0.25 + 0.5 * T.ease.in(T.clamp01((t - (h - dn)) / dn));
    const nx = hits[k + 1]; const gap = nx !== undefined ? nx - dn - h : 0.4;
    if (JAM.inStop(t) && Math.abs(h - JAM.stab) > 0.03) return 0.75;   // muted: the hand rests on the strings
    return 0.75 + 0.5 * T.ease.inOut(T.clamp01((t - h) / Math.max(0.05, Math.min(gap, 0.32))));
  }
  const D2R = Math.PI / 180;
  /** a hero playing his guitar at p facing dir: voxfig 'chord' (or o.anim, e.g. 'sustain') at our own strum phase pPick, plus
   *  performer body language (o.nod / o.lean / o.dip 0..1) and Charlie's swing of the acoustic off his back (o.swing 0..1) */
  function playFig(h, hero, p, dir, pPick, o) {
    placeHero(h, p, dir, { anim: 'chord', frame: 0, pencil: false });
    const F = figOf(h); if (!F) return;
    figPose(F, o.anim || 'chord', pPick, { hero });
    const J = F.J;
    // performer body language on top of the playing pose: nod, knee-bounce on the 8ths, lean back on the big hits
    J.head.rotation.z += (-9 * o.nod + 10 * o.lean) * D2R;
    J.body.rotation.z += (6 * o.lean - 2 * o.dip) * D2R;
    J.hipR.rotation.z += 7 * o.dip * D2R; J.hipL.rotation.z += 7 * o.dip * D2R; J.kneeR.rotation.z -= 12 * o.dip * D2R; J.kneeL.rotation.z -= 12 * o.dip * D2R;
    F.root.position.y -= 0.9 * o.dip * F.model.u;
    if (o.swing !== undefined && o.swing < 1 && F.items.guitar?.userData.slung) {   // Charlie swings the acoustic round off his back
      const g = F.items.guitar, S = g.userData.slung, u = T.ease.inOut(o.swing);
      const posP = g.position.clone(), qP = g.quaternion.clone();
      g.position.copy(S.pos).lerp(posP, u); g.quaternion.copy(S.quat).slerp(qP, u);
      J.body.rotation.y += (1 - u) * 0.5;
    }
    return F;
  }
  function jamHeroes(t) {
    const H = heroes; const stop = JAM.inStop(t) && t > JAM.stab + 0.12 || (t > JAM.stops[0][0] && t < JAM.stab - 0.02);
    const nod = stop ? 0 : T.beatPulse(t, 1, 0.13);                     // head nods on the beats (none in the stops)
    const hitPulse = T.pulse(t, JAM.big, 0.28);                        // the big strums: lean back / rock out
    // turn to each other on "functions" (151.78) and play facing each other, back out to the front on the 153.77 downbeat
    const face = T.ease.inOut(T.span(t, JAM.face - 0.12, JAM.face + 0.25)) * (1 - T.ease.inOut(T.span(t, JAM.back - 0.1, JAM.back + 0.35)));
    const cp = JAM_P.charlie.clone(), rp = JAM_P.ricky.clone();
    // Ricky's step: he steps in toward Charlie as they turn (a little hop on the step), and back
    const step = face; rp.addScaledVector(cp.clone().sub(rp).setY(0).normalize(), 12 * step);
    onFloor(cp); onFloor(rp);
    const toC = cp.clone().sub(rp).setY(0).normalize(), toR = rp.clone().sub(cp).setY(0).normalize();
    const rDir = V(1, 0, -0.15).normalize().lerp(toC, 0.75 * face).normalize(), cDir = V(1, 0, 0.35).normalize().lerp(toR, 0.7 * face).normalize();
    const dip = (x) => { const v = T.beatPulse(x, 2, 0.09); return stop ? 0 : v; };
    playFig(H.ricky, 'ricky', rp, rDir, strumP(t, JAM.q, 0.08), { nod, lean: hitPulse, dip: 0.6 * dip(t) });
    playFig(H.charlie, 'charlie', cp, cDir, strumP(t, JAM.e8, 0.06), { nod: T.beatPulse(t + 0.05, 1, 0.13) * (stop ? 0 : 1), lean: 0.5 * hitPulse, dip: dip(t), swing: T.span(t, JAM.t0, JAM.t0 + 0.32) });
  }
  // (v45_jam LOCK_V45) Charlie's strum on the lone hit + the bolt from his guitar to the top 一
  const bolt = (() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 12, 24, true); g.translate(0, 0.5, 0);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uF: { value: 0 }, uA: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uF, uA; varying vec2 vUv; vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
        void main(){ float y = vUv.y; if (y > uF) discard; float head = exp(-pow((uF - y) * 9.0, 2.0)); vec3 c = mix(vec3(1.0, 0.8, 0.45), hue(y * 1.5 + 0.1), 0.35);
          gl_FragColor = vec4(c * (0.55 + 1.6 * head) * uA, 1.0); }` }));
    m.visible = false; m.frustumCulled = false; m.renderOrder = 40; root.add(m); return m; })();
  const _bq = new THREE.Quaternion();
  function lockStrum(t, p, fwd) {
    const tl = T.snap(K.lone);
    const F = playFig(heroes.charlie, 'charlie', p, fwd, t < tl ? strumP(t, [K.lone], 0.08) : 0.75, { nod: 0, lean: 0.6 * T.pulse(t, [K.lone], 0.3), dip: 0.8 * T.pulse(t, [K.lone], 0.12), swing: T.span(t, K.stop - 0.2, K.stop + 0.25) });
    bolt.visible = false;
    if (LOCK_V45 !== 'strum' || !F || t < tl || t > tl + 0.45) return;
    const gtr = F.items.guitar; gtr.updateWorldMatrix(true, false); const a = gtr.localToWorld(gtr.userData.strum.clone());
    const one = field.meshes.filter((m) => m.userData.frag.stroke === 0); if (!one.length) return;
    const b = one.reduce((acc, m) => acc.add(m.position), V(0, 0, 0)).multiplyScalar(1 / one.length);
    const d = b.clone().sub(a), L = d.length(); const age = t - tl;
    bolt.visible = true; bolt.position.copy(a); _bq.setFromUnitVectors(V(0, 1, 0), d.normalize()); bolt.quaternion.copy(_bq);
    bolt.scale.set(2.2 + 4 * age, L, 2.2 + 4 * age);
    bolt.material.uniforms.uF.value = T.clamp01(age / 0.067 + 0.35); bolt.material.uniforms.uA.value = 1.6 * (1 - T.clamp01((age - 0.08) / 0.37));
  }

  // (v45_jam CART_V45) the cart's guitar events: Ricky's quarters from the build + the measured drum accents (drums stem, 16th grid:
  // 163.715 164.112 164.708 164.907 165.502 165.701 166.098 166.694 166.892 167.288 167.883); big = rings + the bar's big steps
  const CART = (() => {
    const acc = [163.715, 164.112, 164.708, 164.907, 165.502, 165.701, 166.098, 166.694, 166.892, 167.288, 167.883];
    const big = [K.build, 163.715, 164.907, 165.701, K.chufaAcc, 166.892, 167.288];
    const strums = [...new Set([...T.beatsIn(K.build - 0.01, K.pshot, 1), ...acc, K.chufaAcc].map((x) => Math.round(T.snap(x) * 1000) / 1000))].sort((a, b) => a - b);
    const isBig = (x) => big.some((b) => Math.abs(b - x) < 0.03);
    const strike = (t) => { let v = 0; for (const h of strums) { const hs = T.snap(h); if (t >= hs - 1e-6) v = Math.max(v, (isBig(h) ? 1 : 0.45) * Math.exp(-(t - hs) / 0.3)); } return v; };
    // the bar steps: every strum from the build to the montage (the montage keeps the original curve: same value at 168.075)
    const steps = strums.filter((x) => x >= K.build - 0.01 && x < K.eights - 0.01).concat([K.eights]);
    return { strums, big, isBig, strike, steps, rings: big.filter((x) => x < K.chufa).map((x) => [x, 1.0]), e8: T.beatsIn(K.build - 0.01, K.pshot, 2) };
  })();
  K.cartJam = CART;

  // the light (JAM_V45 'light'): each ring is a warm band of light on the ground racing out from Ricky's guitar, a rainbow fringe at
  // its front, a lit wake behind it; it flares the guitar light and the firefly lamp as it passes, and lifts the sunset key
  const jamLight = (() => {
    const N = 8, R0 = new Array(N).fill(-1), A0 = new Array(N).fill(0);
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      uniforms: { uC: { value: new THREE.Vector3() }, uR: { value: R0 }, uA: { value: A0 }, uDisc: { value: new THREE.Vector4(SC.x, SC.z, 47, 0) }, uGain: { value: 1 } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 uC; uniform float uR[${N}], uA[${N}]; uniform vec4 uDisc; uniform float uGain; varying vec3 vW;
        vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
        void main(){
          if (uDisc.w > 0.5 && length(vW.xz - uDisc.xy) > uDisc.z) discard;      // the stage-disc copy: only on the disc
          if (uDisc.w < 0.5 && length(vW.xz - uDisc.xy) < uDisc.z - 1.0) discard; // the ground copy: not under the disc
          float d = length(vW.xz - uC.xz); vec3 col = vec3(0.0);
          for (int i = 0; i < ${N}; i++) { if (uR[i] < 0.0) continue; float r = uR[i], a = uA[i];
            float x = (d - r) / (12.0 + 0.07 * r);
            float front = exp(-x * x);
            float wake = d < r ? exp(-(r - d) / (60.0 + 0.25 * r)) * 0.35 : 0.0;
            vec3 warm = vec3(1.0, 0.72, 0.36);
            vec3 fr = mix(warm, hue(d * 0.0035 + 0.08), smoothstep(-0.2, 1.4, x) * 0.7);
            col += a * smoothstep(900.0, 600.0, r) * (fr * front + warm * wake); }
          gl_FragColor = vec4(col * uGain, 1.0); }` });
    const plane = (y, disc) => { const g = new THREE.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, disc ? mat.clone() : mat); m.position.y = y; m.renderOrder = 5; m.visible = false; m.userData.noAO = true; m.frustumCulled = false; root.add(m); return m; };
    const ground = plane(GY + 0.7, false), disc = plane(DISC_Y + 0.7, true); disc.material.uniforms.uDisc.value.w = 1;
    disc.material.uniforms.uR.value = R0; disc.material.uniforms.uA.value = A0; disc.material.uniforms.uC = mat.uniforms.uC; disc.material.uniforms.uGain = mat.uniforms.uGain;
    const gl = new THREE.PointLight(0xffc070, 0, 220, 1.6); root.add(gl);   // the guitar's own light
    // light motes: as a ring's front passes a spot, a mote rises from it (so the wave reads from the low front-on angles too)
    const NM = 110, MR = JAM.rings.length, mPos = new Float32Array(NM * MR * 3), mA = new Float32Array(NM * MR), mH = new Float32Array(NM * MR);
    const mGeo = new THREE.BufferGeometry(); mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3)); mGeo.setAttribute('aA', new THREE.BufferAttribute(mA, 1)); mGeo.setAttribute('aH', new THREE.BufferAttribute(mH, 1));
    const motes = new THREE.Points(mGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uS: { value: ctx.height / 540 } },
      vertexShader: `attribute float aA, aH; uniform float uS; varying float vA; varying float vH; void main(){ vA = aA; vH = aH; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aA > 0.0 ? uS * 2600.0 / max(1.0, -mv.z) : 0.0; }`,
      fragmentShader: `varying float vA; varying float vH; vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
        void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); if (d > 0.5) discard; float k = exp(-d * d * 28.0);
          vec3 c = mix(vec3(1.0, 0.78, 0.42), hue(vH), 0.35); gl_FragColor = vec4(c * k * vA * 2.0, 1.0); }` }));
    motes.frustumCulled = false; motes.visible = false; root.add(motes);
    function moteState(t, src) {
      let n = 0; mA.fill(0);
      JAM.rings.forEach(([te, k], ri) => { const t0 = T.snap(te); if (t < t0) return;
        for (let j = 0; j < NM; j++) { const i = ri * NM + j, h1 = hash(i * 1.37 + 0.1), h2 = hash(i * 2.71 + 0.3), h3 = hash(i * 0.53 + 0.7);
          const r = 18 + 520 * Math.sqrt(h1), age0 = r / SPEED; const age = t - t0 - age0; if (age < 0 || age > 1.3) continue;
          const a = h2 * Math.PI * 2; const p = V(src.x + Math.cos(a) * r, 0, src.z + Math.sin(a) * r); const fy = floorY(p.x, p.z);
          mPos[i * 3] = p.x + 3 * Math.sin(age * 5 + j); mPos[i * 3 + 1] = fy + 2 + (22 + 30 * h3) * age; mPos[i * 3 + 2] = p.z + 3 * Math.cos(age * 4 + j);
          mA[i] = k * Math.min(1, age * 10) * (1 - age / 1.3) * smoothstepJS(620, 380, r); mH[i] = h3; n++; } });
      mGeo.attributes.position.needsUpdate = mGeo.attributes.aA.needsUpdate = mGeo.attributes.aH.needsUpdate = true; motes.visible = n > 0;
    }
    // the wave's wall: a low curtain of light standing on each ring's front (reads from the low front-on angles, where the pale
    // paving swallows the ground ring)
    const wallMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 0 } },
      vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uA; varying vec2 vUv; varying vec3 vW; vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
        void main(){ float v = vUv.y; float k = pow(1.0 - v, 2.2) * smoothstep(0.0, 0.06, v); vec3 c = mix(vec3(1.0, 0.74, 0.38), hue(vUv.x * 3.0 + v * 0.6), 0.45 * v + 0.15);
          gl_FragColor = vec4(c * k * uA, 1.0); }` });
    const walls = JAM.rings.map(() => { const g = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true); g.translate(0, 0.5, 0); const m = new THREE.Mesh(g, wallMat.clone()); m.visible = false; m.frustumCulled = false; m.renderOrder = 6; m.userData.noAO = true; root.add(m); return m; });
    function wallState(t, src, rs) {
      for (const w of walls) w.visible = false;
      rs.forEach((r, i) => { if (i >= walls.length || r.r < 4) return; const w = walls[i]; w.visible = true; w.position.set(src.x, GY - 1, src.z);
        w.scale.set(r.r, 10 + 26 * Math.exp(-r.age * 1.6), r.r); w.material.uniforms.uA.value = 1.3 * r.a * smoothstepJS(700, 420, r.r); });
    }
    const smoothstepJS = (a, b, x) => { const u = T.clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
    const SPEED = 520, LIFE = 2.6;
    /** ring radii at t: [{ r, a }] (a fades with age) */
    const ringsAt = (t, list = JAM.rings) => list.filter(([te]) => t >= T.snap(te) - 1e-6 && t - te < LIFE).map(([te, k]) => { const age = Math.max(0, t - T.snap(te)); return { r: SPEED * age * (1 - 0.18 * age / LIFE), a: k * (1 - age / LIFE) * (1 - Math.exp(-age * 25 - 0.2)), age, te }; });
    function state(t) {
      ground.visible = disc.visible = false; gl.intensity = 0; motes.visible = false; for (const w of walls) w.visible = false;
      if (CART_V45 === 'power' && t >= K.build && t < K.pshot) return cartState(t);
      if (JAM_V45 !== 'light' || t < JAM.t0 || t >= K.roll[0]) return { lift: 0 };
      const src = (t < K.gang ? JAM_P.ricky : JAM_P.ricky).clone(); onFloor(src);
      const rs = ringsAt(t); for (let i = 0; i < N; i++) { R0[i] = i < rs.length ? rs[i].r : -1; A0[i] = i < rs.length ? rs[i].a : 0; }
      mat.uniforms.uC.value.copy(src); ground.visible = disc.visible = rs.length > 0;
      for (const m of [ground, disc]) { m.position.x = src.x; m.position.z = src.z; m.scale.set(3200, 1, 3200); }
      mat.uniforms.uGain.value = 1.0; moteState(t, src); wallState(t, src, rs);
      // the guitar flare (on Ricky's strums: every beat a little, the rings big)
      const gtr = heroes.ricky.visible ? figOf(heroes.ricky)?.items.guitar : null;
      if (gtr) { gtr.updateWorldMatrix(true, false); gl.position.copy(gtr.localToWorld(gtr.userData.strum.clone())).add(V(16, 8, 0)); }   // just in front of the strings (no hot spot on him)
      else gl.position.copy(src).add(V(0, 40, 0));
      const strike = Math.max(...JAM.rings.map(([te, k]) => (t >= T.snap(te) - 1e-6 ? k * Math.exp(-(t - T.snap(te)) / 0.35) : 0)), 0);
      gl.intensity = t < K.gang ? 1100 * (0.2 + strike) : 0;
      // the firefly lamp (RB + (16, -44)) flares as a ring passes it
      const lampD = V(RB.x + 16, 0, RB.z - 44).sub(src).setY(0).length();
      const lampHit = rs.reduce((m, r) => Math.max(m, r.a * Math.exp(-Math.pow((r.r - lampD) / 30, 2))), 0);
      // the sunset key: lifts a step on each ring and stays a little brighter (the light comes back with the music)
      const lift = 0.4 * T.span(t, JAM.t0, K.gang, T.ease.inOut) + 0.6 * strike;
      return { lift, lampHit, strike };
    }
    // (v45_jam CART_V45 'power') the cart: a ring of light under it on each of Ricky's power strums while it is on the mesa;
    // the launch chord (166.275) = a vertical ring of light left in the air behind the cart (the thrust)
    const boomMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uA; varying vec2 vUv; vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
        void main(){ float k = exp(-pow((vUv.y - 0.5) * 3.2, 2.0)); vec3 c = mix(vec3(1.0, 0.74, 0.38), hue(vUv.x * 2.0), 0.4); gl_FragColor = vec4(c * k * uA, 1.0); }` });
    const boom = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true); g.rotateZ(Math.PI / 2); const m = new THREE.Mesh(g, boomMat); m.visible = false; m.frustumCulled = false; m.renderOrder = 6; m.userData.noAO = true; root.add(m); return m; })();
    function cartState(t) {
      boom.visible = false;
      const cf = K.cartFrame(t), src = cf.pos.clone(); src.y = GY;
      const onMesa = cf.pos.x < 1560;
      const rs = onMesa ? ringsAt(t, CART.rings) : [];
      for (let i = 0; i < N; i++) { R0[i] = i < rs.length ? rs[i].r : -1; A0[i] = i < rs.length ? rs[i].a : 0; }
      mat.uniforms.uC.value.copy(src); ground.visible = disc.visible = rs.length > 0; mat.uniforms.uGain.value = 1.0;
      for (const m of [ground, disc]) { m.position.x = src.x; m.position.z = src.z; m.scale.set(3200, 1, 3200); }
      wallState(t, src, rs);
      const strike = CART.strike(t);
      const gtr = heroes.ricky.visible ? figOf(heroes.ricky)?.items.guitar : null;
      if (gtr) { gtr.updateWorldMatrix(true, false); gl.position.copy(gtr.localToWorld(gtr.userData.strum.clone())).add(V(14, 8, -8)); gl.intensity = 1100 * (0.2 + strike); }
      // the thrust ring: born at the cart's tail on the launch chord, stays where it was born, grows and fades
      const tb = T.snap(K.chufaAcc); if (t >= tb && t < tb + 0.7) { const age = t - tb, c0 = K.cartFrame(tb).pos;
        boom.visible = true; boom.position.set(c0.x - cartRig.halfL - 10, c0.y + 30, c0.z); const r = 30 + 260 * T.ease.out(T.clamp01(age / 0.7)); boom.scale.set(14 + 30 * age, r, r);
        boomMat.uniforms.uA.value = 2.2 * (1 - age / 0.7); }
      return { lift: 0.5 * strike, strike, lampHit: 0 };
    }
    return { state };
  })();
  let jamS = { lift: 0 };

  function m2Heroes(t) {
    const H = heroes; const beat = T.beatAt(t); const b = T.beatPulse(t, 1, 0.1);
    if (t < K.gang) {   // ---- REBUILD
      const j = jadeRB(t); const toCam = V(1, 0, 0.35);
      placeHero(H.jade, onFloor(j.p.clone()), toCam, j.moving ? { anim: 'run', t, pencil: true } : { anim: t >= tFun ? 'draw_rainbow' : 'draw_graphite', frame: 0, pencil: true });
      if (JAM_V45) { jamHeroes(t); return; }   // (v45_jam) Charlie + Ricky play
      placeHero(H.charlie, onFloor(RB.clone().add(V(-48, 0, -36))), V(1, 0, 0.5), { anim: t >= tFun && t < tFun + 0.3 ? 'throw' : 'idle', t: t >= tFun ? t - tFun : t + 0.4, pencil: false });
      placeHero(H.ricky, onFloor(RB.clone().add(V(-62, 0, 26))), V(1, 0, 0.1), { anim: t >= tFun - 0.05 ? (t < tFun + 0.3 ? 'chord' : 'sustain') : 'idle', t: t >= tFun - 0.05 ? t - tFun + 0.05 : t, pencil: false });
      return;
    }
    if (t < K.roll[0]) {   // ---- GANG: all nine in parallel
      const ci = chunkT.filter((x) => t >= x).length - 1;                  // the newest chunk
      const throwing = gangBeats.some((x, i) => i % 3 === 0 && t >= x - 0.05 && t < x + 0.3);
      const tb = gangBeats.filter((x, i) => i % 3 === 0 && x - 0.05 <= t).pop() ?? K.gang;
      // (act4 r5) backs to the camera, each turned toward their own lane (Charlie throws toward the far chunks, Ricky plays toward them, Jade colours ahead)
      placeHero(H.charlie, GANG.charlie.clone().add(V(0, 2 * b, 0)), r5 ? V(1, 0, -0.55) : V(1, 0, -0.25), { anim: throwing ? 'throw' : 'idle', t: throwing ? t - tb + 0.05 : t + 0.4, pencil: false });
      placeHero(H.ricky, GANG.ricky.clone().add(V(0, 2 * b, 0)), r5 ? V(1, 0, 0.6) : V(1, 0, 0.3), { anim: 'chord', frame: Math.floor(beat * 2) % 2, pencil: false });
      const colouring = colourT.some((x) => t >= x && t < x + 0.9);
      placeHero(H.jade, GANG.jade.clone().add(V(0, 2 * b, 0)), r5 ? V(1, 0, -0.35) : V(1, 0, 0.05), colouring ? { anim: 'draw_rainbow', frame: 0, pencil: true } : { anim: 'sing', frame: Math.floor(beat) % 2, pencil: true });
      return;
    }
    // ---- ROLL (pile on) / BUILD (rev at the start line) / LAUNCH (ride)
    const cf = cartFrame(t);
    const seat = { charlie: 'seat0', jade: 'seat1', ricky: 'seat2' };
    for (const n of ['charlie', 'jade', 'ricky']) {
      const sl = cartRig.world(seat[n], cf); const u = asmU(seat[n], t);
      if (CART_V45 && n === 'ricky') sl.p.copy(cf.pos).add(V(-cartRig.halfL * 0.6, cartRig.top, -cartRig.halfW * 0.62));   // (v45_jam) Ricky stands on the camera side
      const p = lerpV(GANG[n], sl.p, u); if (u < 1) p.y += 40 * Math.sin(Math.PI * u);
      const bob = t >= K.build ? 1.5 * T.beatPulse(t, 2, 0.06) : 0; p.y += bob;
      let st;
      if (u < 1 && u > 0) st = { anim: 'jump', frame: u < 0.5 ? 0 : 1, pencil: n === 'jade' };
      else if (n === 'charlie') st = t >= K.chufa - 0.12 && t < K.chufa + 0.25 ? { anim: 'throw', t: t - (K.chufa - 0.12), pencil: false } : { anim: 'idle', t: t + 0.4, pencil: false };
      else if (n === 'ricky') st = { anim: 'chord', frame: Math.floor(beat * 2) % 2, pencil: false };
      else st = { anim: 'sing', frame: Math.floor(beat) % 2, pencil: true };
      if (CART_V45 && u >= 1 && t >= K.build && n !== 'jade' && !(n === 'charlie' && st.anim === 'throw')) {   // (v45_jam) both play on the ride
        const nod = T.beatPulse(t, 1, 0.13), str = CART.strike(t);
        if (n === 'ricky') { const thrust = t >= K.chufaAcc - 0.03 && t < K.chufaAcc + 0.6;
          playFig(H.ricky, 'ricky', p, V(1, 0, -0.45).normalize(), thrust ? 0 : strumP(t, CART.strums, 0.07), { anim: thrust ? 'sustain' : 'chord', nod: thrust ? 0 : nod, lean: thrust ? 0 : str, dip: 0.6 * T.beatPulse(t, 2, 0.09) }); }
        else playFig(H.charlie, 'charlie', p, V(1, 0, -0.2).normalize(), strumP(t, CART.e8, 0.06), { nod, lean: 0.3 * str, dip: T.beatPulse(t, 2, 0.09), swing: T.span(t, K.build, K.build + 0.32) });
        continue;
      }
      placeHero(H[n], p, V(1, 0, 0), st);
    }
  }
  // the old ride helpers (kept for the legacy pencil-tip shot's background only)
  const ridePos = (t) => { const u = T.ease.inOut(T.clamp01((t - K.build) / (K.chufa - K.build)));
    return V(T.lerp(ERS.x, G0.x - 120, u) + (t > K.chufa ? (t - K.chufa) * 40 : 0), GY, T.lerp(ERS.z, G0.z, T.ease.inOut(T.clamp01((t - K.build) / 1.6)))); };
  void ridePos;

  // ---- (act4 M2) the features, the chunks, the stray lines, the cart
  const chunkMats = CHUNKS.map(() => new THREE.MeshStandardMaterial({ color: 0x6b6b72, roughness: 0.8 }));
  const chunks = CHUNKS.map((c, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), chunkMats[i]); m.castShadow = m.receiveShadow = true; m.visible = false; root.add(m); return m; });
  // (act4 r5) the level visibly under construction: each chunk starts as a graphite wireframe draft (translucent grey + pencil edges) and
  // turns solid when Jade colours it; the wheel hauls a block; Charlie's hats fly to where the chunks sprout; rings run the colour
  if (r5) chunks.forEach((m, i) => { chunkMats[i].transparent = true; chunkMats[i].opacity = 0.35; const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x2b2b31 })); e.userData.noAO = true; m.add(e); m.userData.edges = e; });
  const haul = r5 ? (() => { const m = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 18), new THREE.MeshStandardMaterial({ color: 0x8a8a90, roughness: 0.85 })); m.castShadow = m.receiveShadow = true; m.visible = false; root.add(m); return m; })() : null;
  const strayTex = (() => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 32; const g = cv.getContext('2d'); g.strokeStyle = 'rgba(46,46,51,0.92)'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(6, 18); for (let x = 6; x < 122; x += 8) g.quadraticCurveTo(x + 4, 18 + 10 * Math.sin(x * 0.21), x + 8, 16 + 6 * Math.sin(x * 0.37)); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(20, 8); g.lineTo(60, 24); g.moveTo(70, 6); g.quadraticCurveTo(90, 28, 116, 12); g.stroke();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const strays = [0, 1, 2, 3, 4, 5].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(26, 7), new THREE.MeshBasicMaterial({ map: strayTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    m.rotation.x = -Math.PI / 2; m.visible = false; m.userData.noAO = true; root.add(m); return m; });
  const strayAt = (i) => {   // where stray line i lies and when it is drawn / rubbed (the Eraser passes 0.9 s behind Jade)
    if (i < 4) { const ta = K.rebuilt + 0.25 + i * 0.95; const jp = jadeRB(ta).p; return { p: onFloor(jp.clone().add(V(-12 - 6 * i, 0, 22 + 8 * (i % 2)))), t0: ta, t1: ta + 1.1, rot: 0.6 * i }; }
    const ta = K.gang + 0.6 + (i - 4) * 2.4; return { p: GANG.eraser.clone().add(V(14, 0, -10 + 16 * (i - 4))), t0: ta, t1: ta + 1.4, rot: 1.1 * i };
  };
  function m2Features(t) {
    for (const c of chunks) c.visible = false; for (const s2 of strays) s2.visible = false; if (haul) haul.visible = false;
    if (t < K.rebuilt) return;
    const beat = T.beatAt(t); const bp = T.beatPulse(t, 1, 0.12);
    const put = (name, p, anim, o = {}, k = 1, yaw = 0) => { const f = feats[name]; f.visible = true; f.position.copy(p); f.rotation.set(0, yaw, 0); f.scale.setScalar(k); f.set({ anim, t, beat, ...o }); return f; };
    strays.forEach((m, i) => { const a = strayAt(i); if (t < a.t0 || t >= a.t1 || t >= K.roll[0]) return; m.visible = true; m.position.copy(a.p).setY(a.p.y + 0.35); m.rotation.z = a.rot;
      const fade = T.span(t, a.t1 - 0.35, a.t1); m.material.opacity = 1 - fade; m.scale.set(1 - 0.6 * fade, 1, 1); });
    if (t < K.gang) {   // ---- the rebuild: the features help (lamp lights, wheel hauls, glider circles, bridge and button by the party)
      put('lamp', onFloor(RB.clone().add(V(16, 0, -44))), 'idle', { glow: 1 }, 1, 0.3); lampLights[0].position.copy(RB).add(V(16, 34, -44)); lampLights[0].intensity = 900;
      put('button', onFloor(RB.clone().add(V(-6, 0, -62))), 'idle', {}, 1, 0.5);
      put('bridge', onFloor(RB.clone().add(V(-30, 0, 70))), 'idle', {}, 1, 0.2);
      const wz = 300 + ((t - K.rebuilt) * 45) % 160; put('wheel', onFloor(V(RB.x - 95, 0, wz)), 'roll', { dist: (t - K.rebuilt) * 45 }, 1, -Math.PI / 2);
      const a = (t - K.rebuilt) * 0.9; put('glider', V(RB.x + Math.cos(a) * 70, GY + 95 + 8 * Math.sin(t * 1.4), RB.z + Math.sin(a) * 60), 'use', {}, 1, -a - Math.PI / 2);
      return;
    }
    if (t < K.roll[0]) {   // ---- the gang: all nine in parallel
      CHUNKS.forEach((c, i) => { const pop = T.span(t, chunkT[i], chunkT[i] + 0.18); if (pop <= 0) return; const m = chunks[i]; m.visible = true;
        const s2 = Math.max(0.01, T.ease.back(pop)); m.scale.set(s2, s2, s2); m.position.copy(c).add(V(0, 10 * s2, 0)); m.rotation.y = 0.3 * i;
        const col = T.span(t, colourT[i], colourT[i] + 0.45); chunkMats[i].color.set(0x6b6b72).lerp(new THREE.Color().setHSL((0.08 + i * 0.27) % 1, 0.8, 0.55), col);
        chunkMats[i].emissive.setHSL((0.08 + i * 0.27) % 1, 0.8, 0.3).multiplyScalar(col * 0.25 * (1 + T.beatPulse(t, 1, 0.1)));
        if (r5) { chunkMats[i].opacity = 0.35 + 0.65 * col; m.userData.edges.visible = col < 1; m.userData.edges.material.opacity = 1 - col; m.userData.edges.material.transparent = true; } });
      if (r5) {   // Charlie's hat flies to the chunk's spot (leaves the throw, lands as the chunk sprouts); the wheel hauls a block
        const hi = chunkT.findIndex((x) => t >= x - 0.32 && t < x); if (hi >= 0) { const u = T.span(t, chunkT[hi] - 0.32, chunkT[hi]); const p = lerpV(handOf(heroes.charlie, 'R', V()), CHUNKS[hi].clone().add(V(0, 8, 0)), T.ease.out(u)); p.y += 40 * Math.sin(Math.PI * u);
          flyCap.visible = true; flyCap.position.copy(p); flyCap.rotation.set(0.3 * (1 - u), 6 * u, 0); flyCap.scale.setScalar(23); }
        if (haul) { haul.visible = true; } }
      put('lamp', GANG.lamp, 'dance', { glow: 1 }, 1, -0.3); lampLights[0].position.copy(GANG.lamp).add(V(0, 34, 0)); lampLights[0].intensity = 1400 * (0.8 + 0.4 * bp);
      put('button', GANG.button, 'dance', {}, 1, 0.3);
      // the bridge spans the gap between the first two chunks once both stand; until then it waits beside them
      const span = t >= chunkT[1] + 0.2; const mid = CHUNKS[0].clone().lerp(CHUNKS[1], 0.5);
      put('bridge', span ? mid.clone().add(V(0, 18, 0)) : GANG.bridge, span ? 'use' : 'dance', {}, 1, span ? Math.atan2(-(CHUNKS[1].z - CHUNKS[0].z), CHUNKS[1].x - CHUNKS[0].x) : 0.4);
      if (r5) {   // (act4 r5) the wheel HAULS up and down its own lane (right edge), the glider circles the far chunks (top centre)
        const ph = ((t - K.gang) * 0.33) % 1, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2; const hd = 130 * tri;
        put('wheel', onFloor(V(GANG.wheel.x + hd, 0, GANG.wheel.z)), 'roll', { dist: hd }, 1, 0);
        if (haul) { haul.visible = true; haul.position.copy(onFloor(V(GANG.wheel.x + hd - 24, 0, GANG.wheel.z))).add(V(0, 7 + 0.6 * Math.abs(Math.sin(hd * 0.3)), 0)); haul.rotation.y = 0.15 * Math.sin(hd * 0.1); }
        const a = (t - K.gang) * 1.1; put('glider', V(GANG.glider.x + Math.cos(a) * 60, GY + 92 + 8 * Math.sin(t * 1.4), GANG.glider.z + Math.sin(a) * 55), 'use', { bank: -0.3 }, 1, -a - Math.PI / 2);
        return; }
      const wz = 380 + ((t - K.gang) * 50) % 150; put('wheel', onFloor(V(GANG.wheel.x, 0, wz)), 'roll', { dist: (t - K.gang) * 50 }, 1, -Math.PI / 2);
      const a = (t - K.gang) * 1.1; put('glider', V(GANG.glider.x + Math.cos(a) * 85, GY + 105 + 8 * Math.sin(t * 1.4), GANG.glider.z + Math.sin(a) * 75), 'use', { bank: -0.3 }, 1, -a - Math.PI / 2);
      return;
    }
    // ---- the roll: every part flies to its slot on the 16ths (the beetle wheel's three copies pop out of it); then the cart
    const cf = cartFrame(t); const parts = { bridge: feats.bridge, lamp: feats.lamp, button: feats.button, glider: feats.glider };
    const from = { bridge: CHUNKS[0].clone().lerp(CHUNKS[1], 0.5).add(V(0, 18, 0)), lamp: GANG.lamp, button: GANG.button, glider: V(GANG.glider.x, GY + 105, GANG.glider.z) };
    const pw = CART_V45 === 'power' && t >= K.build ? CART.strike(t) : 0;   // (v45_jam) Ricky's strums power the cart
    const kick = CART_V45 === 'power' ? CART.strums.reduce((a, h) => a + (t >= T.snap(h) ? (CART.isBig(h) ? 10 : 4) * (1 - Math.exp(-(t - T.snap(h)) / 0.12)) : 0), 0) : 0;
    cartRig.pose(cf, { t, beat, dist: cf.dist + kick, glow: 1 + 0.8 * pw, flap: t < K.chufa && pw > 0.05 ? 0.4 * pw * Math.sin(t * 22) : undefined, press: t >= K.chufa - 0.03 ? Math.exp(-Math.max(0, t - K.chufa) * 4) : (t >= K.build ? 0 : undefined), flash: t >= K.chufa - 0.03 ? 1 : 0, ...(t >= K.chufa ? { flap: 0.35 * Math.sin(t * 18) } : {}) });
    for (const [n, o] of Object.entries(parts)) { const u = asmU(n, t); if (u >= 1) continue; const w = cartRig.world(n, cf); const p = lerpV(from[n], w.p, u); p.y += 30 * Math.sin(Math.PI * u); o.position.copy(p); o.rotation.y = T.lerp(o.rotation.y, w.yaw, u); }
    const wheels = [feats.wheel, ...moreWheels];
    wheels.forEach((w, i) => { const u = asmU('wheel' + i, t); if (u >= 1) return; const sl = cartRig.world('wheel' + i, cf); const src = onFloor(V(GANG.wheel.x, 0, 380 + ((K.roll[0] - K.gang) * 50) % 150));
      if (i > 0 && u <= 0) { w.visible = false; return; } const p = lerpV(src, sl.p, u); p.y += 25 * Math.sin(Math.PI * u); w.position.copy(p); });
    if (r5 && cf.susp) wheels.forEach((w, i) => { if (asmU('wheel' + i, t) >= 1) w.position.y -= cf.susp; });   // (act4 r5) suspension: the wheels stay on the pavers
    dustState(t);   // (act4 r5)
    lampLights[0].position.copy(cartRig.world('lamp', cf).p).add(V(10, 10, 0)); lampLights[0].intensity = 1600 * (1 + 1.1 * pw);
    if (t >= K.pshot) for (const f of [...Object.values(feats), ...moreWheels]) f.visible = false;
  }

  // (act4 r5) dust kicked up behind the rear wheels once the cart launches: puffs on a fixed spawn clock (a pure function of t)
  const dust = r5 ? (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g2 = cv.getContext('2d');
    const gr = g2.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(226,214,190,0.8)'); gr.addColorStop(0.55, 'rgba(226,214,190,0.3)'); gr.addColorStop(1, 'rgba(226,214,190,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    return [...Array(28)].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.6 })); s.visible = false; s.userData.noAO = true; root.add(s); return s; }); })() : null;
  function dustState(t) {
    if (!dust) return; for (const s of dust) s.visible = false;
    if (t < K.build || t >= K.pshot) return;   // the rev at the start line (tyre dust piling up behind the wheels), then the launch
    const DT = 0.045, LIFE = 0.7; const k0 = Math.floor((t - K.build) / DT);
    for (let i = 0; i < dust.length; i++) { const k = k0 - i; if (k < 0) break; const ts = K.build + k * DT; const age = t - ts; if (age > LIFE) continue;
      const cf = cartFrame(ts); if (cf.pos.x > 1560) continue;   // airborne: nothing to kick up
      const sd = k % 2 ? 1 : -1, h = hash(k * 3.1), s = dust[i]; s.visible = true;
      s.position.set(cf.pos.x - cartRig.halfL * 0.62 - 6 - 30 * age, GY + 4 + 26 * age + 8 * h, cf.pos.z + sd * (cartRig.halfW + 8) + 10 * (h - 0.5));
      const sc = 10 + 34 * age; s.scale.set(sc, sc * 0.8, 1); s.material.opacity = (ts < K.chufa ? 0.32 : 0.55) * (1 - age / LIFE) * (CART_V45 === 'power' ? 0.7 + 1.2 * CART.strike(ts) : 1); }
  }

  // ---------------------------------------------------------------- bug features
  function bugState(t) {
    for (const b of bugs) b.visible = false;   // the old extruded sprite bugs are retired (creature features: recruit + m2Features)
    if (t < K.rebuilt) return;
    m2Features(t);
    if (t >= K.pshot) legacyBugs(t);           // the pencil-tip hand-off keeps the v7 lamp light + background exactly (Team D match cut)
  }

  /** the pre-M1 sprite features (only after the build, unchanged so the ride / 出发 / pencil-tip frames match v7 exactly) */
  function legacyBugs(t) {
    const lamps = bugs.filter((b) => b.userData.kind === 'lamp'), wheels = bugs.filter((b) => b.userData.kind === 'wheel'),
      gliders = bugs.filter((b) => b.userData.kind === 'glider');
    const bp = T.beatPulse(t, 1, 0.12);
    lamps.forEach((b, i) => { b.visible = true; const p = STAGE.clone().add(V(i ? 95 : -95, 0, -22)); b.position.copy(p).add(V(0, bp * 2, 0)); b.rotation.set(0, 0, 0); b.set({ anim: 'a', frame: 0 }); b.scale.setScalar(1.3);
      lampLights[i].position.copy(p).add(V(0, 40, 6)); lampLights[i].intensity = 2500 * (0.8 + 0.4 * bp); });
    wheels.forEach((b, i) => { b.visible = true; const x = STAGE.x - 140 + ((t * 40 + i * 140) % 280); b.position.set(x, GY + 1, STAGE.z + 18 - i * 36); b.set({ anim: 'a', frame: 0 }); b.rotation.set(0, 0, -(t * 40 + i * 140) / 13); b.scale.setScalar(1.2); });
    gliders.forEach((b, i) => { b.visible = true; const a = t * 0.6 + i * Math.PI; b.position.set(STAGE.x + Math.cos(a) * 150, GY + 120 + 12 * Math.sin(t * 1.3 + i), STAGE.z + Math.sin(a) * 80 - 40); b.rotation.set(0, -a + Math.PI / 2 * (i ? 1 : -1), 0.15 * Math.sin(t * 2)); b.set({ anim: 'a', frame: 0 }); b.scale.setScalar(0.9); });
  }

  // ---------------------------------------------------------------- the gate (出发), drawn on the beats of the build
  const gateBeats = T.beatsIn(K.build, K.chufa + 0.1, 1);
  function gateState(t) {
    gateGroup.visible = t >= K.build - 0.01;
    // (act4 M2) 出 and 发 stand apart while the cart launches between them; the pencil-tip shot keeps the v7 layout
    const gap = t < K.pshot ? 62 : 14; gate.forEach((h, i) => { h.mesh.position.x = i ? gap : -h.widthWorld - gap; });
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
  // (act4 M1) lookFrom() never updated the projection (the update sits inside the comment below), so every legacy Act IV shot
  // renders with the camera's construction projection (fov 45, near 0.5). Keep that EXACTLY for legacy shots (P45), and make it
  // explicit so a new shot() (real fov, updated projection) can't leak into the next frame. Seam at 123.354 unchanged.
  const lookFrom = (pos, target, fov = 45, roll = 0) => {
    cam.projectionMatrix.copy(P45); cam.projectionMatrixInverse.copy(P45i);
    cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(target); if (roll) cam.rotateZ(roll);
    cam.fov = fov; cam.near = Math.max(0.5, pos.distanceTo(target) * 0.02); cam.far = 200000;   // same near rule as act3 aim() cam.aspect = ctx.width / ctx.height; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    return { target, focus: target };
  };
  const P45 = cam.projectionMatrix.clone(), P45i = cam.projectionMatrixInverse.clone();
  // (act4 r5) the legacy shots keep their fov-45 FRAMING but through a real projection (camera.near consistent with the depth buffer), so
  // look_r5's tilt-shift focuses where the shot says; without r5 the P45 path is untouched
  const lf5 = (pos, target, fov = 45, roll = 0) => (r5 ? shot(pos, target, 45) : lookFrom(pos, target, fov, roll));
  /** (act4 M1) new shots: a real perspective at `fov` (projection updated every frame) */
  const shot = (pos, target, fov = 45, focus = target) => {
    cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(target);
    cam.fov = fov; cam.aspect = ctx.width / ctx.height; cam.near = Math.max(0.5, pos.distanceTo(target) * 0.02); cam.far = 200000;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    return { target, focus };
  };
  // (act4 M1) the recruit shots S2-S6 (real fov; the battle UI covers the bottom ~35%: subjects sit in the top 2/3)
  function recruitCam(t) {
    const H = heroes;
    if (r5 && t < K.paint) {
      if (t < K.cutEyes) {   // (act4 r5) F1: the command line in the world. A profile two-shot at chest height: Jade left, the window between, its face
        // right; the party and the features walk up through the foreground; one slow push for the whole empty-cursor hold
        // over Jade's left shoulder, chest height, looking UP: her back / the window / its grumpy face stacked up the frame (the 2D band covers the bottom 30 %)
        const u = T.span(t, K.s2, K.cutEyes, T.ease.inOut);
        return shot(offE(stand, -90 + 10 * u, -40, 44), offE(EP2, -40, 0, 150 + 6 * u), 58, FIELD_P);
      }
      // (act4 r5) F2: cut on ENTER to its face: the eyes widen; the glider carries Jade up into the bottom of the frame toward PAINT
      const u = T.span(t, K.cutEyes, K.paint);
      return shot(offE(EP2, -290 - 12 * u, -26, 122), offE(EP2, 0, 0, 240), 40, offE(EP2, -62, 0, 234));
    }
    if (t < K.s3) {   // S2: wide, high behind the party as they walk up to the boss; slow push
      const u = T.span(t, K.s2, K.s3, T.ease.inOut);
      return shot(offE(stand, -40 + 40 * u, 500 - 30 * u, 92), offE(stand, -40 + 55 * u, 0, 92), 50, offE(stand, 0, 0, 30));   // JRPG side view
    }
    if (t < K.s4) {   // S3: the reverse, from beside its front corner: the party faces the boss; Jade writes the answer in the air
      const u = T.span(t, K.s3, K.s4, T.ease.inOut);
      return shot(offE(EP2, -105 - 15 * u, -135, GY + 120 - 10 * u), offE(stand, -60, 10, GY + 4), 48, offE(stand, 0, 0, GY + 40));
    }
    if (t < K.paint) {   // S4: ENTER -> the glider swoops under her and lifts her up its front (crane-follow)
      const jp = H.jade.position;
      return shot(offE(jp, -170, -230, 70), offE(jp, 60, 0, 22), 50, jp.clone().add(V(0, 40, 0)));
    }
    if (t < K.ship) {   // S5: close on its face over Jade's shoulder: PAINT (pink hatching) then RUN (the rings; it smiles)
      const u = T.span(t, K.paint, K.ship, T.ease.inOut);
      return shot(offE(EP2, -330 + 30 * u, 200 - 20 * u, GY + 262), offE(EP2, -62, 0, GY + 225), 44, offE(EP2, -62, 0, GY + 230));
    }
    // S6: low over Charlie's shoulder, looking up the pink Eraser: the hat out of the hat flies up onto its head; joined
    // one move: starts on Charlie's hands (the hat out of the hat), then cranes + tilts up with the cap onto its head
    const cp = SPOT.charlie; const u = T.ease.inOut(T.span(t, K.release - 0.02, K.capLand + 0.05)); const v = T.span(t, K.capLand, K.rebuilt);
    const w = T.ease.inOut(T.span(t, K.capLand + 0.14, K.rebuilt));   // (act4 M2) ... and down with it as it pops to party size
    const pos = lerpV(lerpV(offE(cp, -38, 118, 50), offE(cp, -175 - 15 * v, 30, 170 + 8 * v), u), offE(EP2, -250, 30, 80), w);   // Charlie in profile, his hands in view
    const tgt = lerpV(lerpV(offE(cp, 32, -6, 48), offE(EP2, -62, -12, 262), u), offE(EP2, -10, -10, 45), w);
    return shot(pos, tgt, 56, u < 0.5 ? cp.clone().add(V(0, 45, 0)) : offE(EP2, -62, 0, 250));
  }
  // the over-shoulder start of the lock move, and the exact eye
  const OS = E.clone().addScaledVector(RT, 125).add(V(0, 38, 0)).addScaledVector(F, -70);
  const OS5 = E.clone().addScaledVector(RT5, 70).add(V(0, 40, 0)).addScaledVector(F5, -150);   // (act4 r5) behind her right shoulder: Jade in the left third, half the frame tall (k11)
  function camera(t) {
    // BRIDGE dusk: wide from behind/above the party toward the sunset; the Eraser on the horizon
    // 123.354 starts on Act III's exact last camera, then cranes up and back as the Eraser rises behind the hills
    // (act4 r5) the rise, LOW: from Act III's exact last camera the lens drops to the band's chest height behind them and looks up at
    // the horizon: the Eraser rises as a silhouette over the hills, the sky above it; then a slow push while it rubs (124.6: sky >= 1/3)
    if (r5 && t < K.acc) {
      const u = T.span(t, K.start, K.dOut, T.ease.inOut), v = T.span(t, K.dOut, K.acc, T.ease.inOut);
      const c = lf5(lerpV(HANDOVER_CAM.pos, V(1398, GY + 14, 880), u).add(V(-10 * v, 2 * v, -60 * v)), lerpV(HANDOVER_CAM.tgt, V(1290, 600, -2600), u).add(V(0, 80 * v, 0)), T.lerp(HANDOVER_CAM.fov, 44, u));
      c.focus = t < K.dOut ? V(1352, 20, 450) : V(1300, 40, 440); return c; }
    if (t < K.dOut) { const u = T.span(t, K.start, K.dOut, T.ease.inOut);
      const c = lookFrom(lerpV(HANDOVER_CAM.pos, V(1420, 120, 820), u), lerpV(HANDOVER_CAM.tgt, V(1300, 420, -2600), u), T.lerp(HANDOVER_CAM.fov, 50, u));
      c.focus = V(1352, 20, 450); return c; }
    if (t < K.acc) { const u = T.span(t, K.dOut, K.acc, T.ease.inOut); return lookFrom(V(1420 + 120 * u, 120 + 140 * u, 820 + 300 * u), V(1300 - 50 * u, 420 - 260 * u, -2600 - 400 * u), 50 + 6 * u); }
    // the erased page: low, behind Jade, her painter's gesture toward the shards
    // (act4 M3) from her LEFT side (the native heroes are bigger: from the right, Ricky and Charlie covered her): she draws the
    // pencils out of her bun (hair drops), then the painter's gesture toward the coloured shards, the firefly lamp at her feet
    if (t < K.ht[1]) { const u = T.span(t, K.dBack, K.ht[1]); return lf5(at(GROUND.jade, -95 + 15 * u, -150 + 15 * u, 46), at(GROUND.jade, 50, 12, 40), 48, 0.02); }
    // Ricky's note: low orbit around the spiral as it draws up
    if (t < K.trip[0]) { const u = T.span(t, K.ht[1], K.trip[0], T.ease.inOut); const a = -0.7 + 1.2 * u; const c = SPIRAL.c;   // from the sun side: no glare
      return lf5(at(c, Math.cos(a) * 170, Math.sin(a) * 170, GY + 20 + 40 * u), at(c, 0, 0, GY + 35 + 20 * u), 52); }
    // the climb: wide side view of spiral + vantage + shards
    if (t < (r5 ? K.lineFC : K.fc)) { const u = T.span(t, K.trip[0], K.fc, T.ease.inOut); const c = SPIRAL.c;   // side-on: the sun at 90 degrees (r5: cut at 135.6, the lock shot owns the rest)
      return lf5(at(c, 20 + 30 * u, 235 - 20 * u, GY + 70 + 25 * u), at(c, 20 + 20 * u, 0, GY + 70 + 15 * u), 48); }
    // at the vantage: eye level with the chaos (over the shoulder, offset), then THE MOVE into her eye
    if (t < K.slam) {
      let u;
      if (r5) {   // (act4 r5) ONE move, no cuts, from the vantage (OS5, k11): the chaos HELD through the band stop, the whip toward her eye on the
        // lone hit (138.595), "almost" held 138.9-139.395, the slam snaps onto E (below). The Eraser sits in frame right the whole way.
        if (t < K.lone) u = 0;
        else if (t < K.stop2 + 0.05) u = 0.86 * T.ease.inOut(T.clamp01((t - K.lone) / (K.stop2 + 0.05 - K.lone)));
        else u = 0.86 + 0.06 * T.ease.out(T.clamp01((t - K.stop2 - 0.05) / (K.slam - K.stop2 - 0.05)));
        const pos = lerpV(OS5, E, u).addScaledVector(F5, -30 * Math.sin(Math.PI * u) * (1 - u)).addScaledVector(F5, 3 * T.span(t, K.lineFC, K.lone) * (1 - u));   // + a 2 % breathing push over the hold
        return lf5(pos, E.clone().addScaledVector(LOCK_DIR, 420 + 180 * u), T.lerp(46, 52, T.ease.inOut(u)));   // converging on her lock ray
      }
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
      const pos = E.clone().add(V(0, 45 * u, 0)).addScaledVector(r5 ? RT5 : RT, -70 * u).addScaledVector(r5 ? F5 : F, -60 * u);
      return lf5(pos, E.clone().addScaledVector(LOCK_DIR, 600), 52 + 6 * u);
    }
    // (v4b stage_3d) 142.605 (bar 87) FRONT-ON on Jade at the vantage, lit by what she drew, singing the end of "...I read" (no sung
    // keyword over the back of her head); held into the paper card #06 (143.48), under which F1 (recruitCam) takes over
    if (r5 && t >= T.snap(V4B.lockFront) - 1e-6 && t < K.down) {
      const jp = heroes.jade.position; const u = T.span(t, V4B.lockFront, K.down);
      const c = shot(jp.clone().addScaledVector(F5, 88 - 6 * u).addScaledVector(RT5, 14).add(V(0, 50, 0)), jp.clone().add(V(0, 44, 0)), 34, jp.clone().add(V(0, 52, 0))); c.front = true; return c; }
    // the Eraser stops and looks at it (close on its face, the glyph's light on it)   [S1, legacy projection]
    if (t < K.s2) { const u = T.span(t, K.lookAt, K.s2, T.ease.inOut); const ep = EP2; const toJ = J.clone().sub(ep).setY(0).normalize();
      return lf5(ep.clone().addScaledVector(toJ, 360 - 110 * u).add(V(0, 175 + 25 * u, 0)).addScaledVector(RT, 50 - 20 * u), ep.clone().add(V(0, 238 + 10 * u, 0)), 40 - 4 * u); }
    if (t < K.rebuilt) return recruitCam(t);
    return m2Cam(t);
  }
  // (act4 M2) the rebuilt world's shots (real fov); 出发 and after keep their v7 cameras below (camTail)
  const m2Shots = { r2: T.nearestBeat(152.18), g2: T.nearestBeat(157.75), b2: T.nearestBeat(163.72) };
  // (v4b stage_3d) beat cuts + front-on hero shots in the final chorus (the critique: no 9-10 s uncut stretches, no sung keyword over the
  // back of a head): the lock's reaction shot (bar 87), R1b on the mini-stop, the swarm cut on the bar downbeats 95 / 96 / 97 / 98
  const V4B = { lockFront: T.nearestBeat(142.605), r1b: T.nearestBeat(150.982), swarm: [155.363, 156.956, 158.547, 160.138].map((x) => T.nearestBeat(x)) };
  // (v4b stage_3d) the roll's three angles: 160.83 (cue) / the 8th 161.132 / the beat 161.331 (was 160.83 + 0.3 k: the third cut sat at
  // 161.43, 96 ms off the grid)
  const ROLL_CUTS = [T.nearestBeat(161.132, 2), T.nearestBeat(161.331)];
  function m2Cam(t) {
    if (t >= T.snap(V4B.r1b) - 1e-6 && t < T.snap(m2Shots.r2) - 1e-6) {   // (v4b stage_3d) R1b on the mini-stop (150.982): closer, front-on on Jade for "...the functions"
      const jp = jadeRB(t).p; const u = T.span(t, V4B.r1b, m2Shots.r2, T.ease.inOut);
      const c = shot(V(jp.x + 118 - 10 * u, GY + 50, jp.z + 8), jp.clone().add(V(0, 44, 0)), 32, jp.clone().add(V(0, 52, 0))); c.front = true; return c; }
    if (t < T.snap(m2Shots.r2) - 1e-6) {   // (v4b: snapped to its frame, was +23 ms) R1: front-right, low: Jade redraws toward us, the Eraser tidying behind her, the world returning
      const u = T.span(t, K.rebuilt, m2Shots.r2, T.ease.inOut); const jp = jadeRB(t).p;
      return shot(V(RB.x + 215 - 25 * u, GY + 52 + 6 * u, RB.z + 10 + 30 * u), V(T.lerp(RB.x - 4, jp.x, 0.5), GY + 38, T.lerp(RB.z + 24, jp.z, 0.5)), 48, jp.clone().add(V(0, 40, 0)));
    }
    if (t < K.gang) {       // R2: crane up and back: the rebuilt world coming back in colour around them; the bar docked
      const u = T.span(t, m2Shots.r2, K.gang, T.ease.inOut);
      return shot(V(RB.x + 190 + 70 * u, GY + 70 + 150 * u, RB.z - 40 - 80 * u), V(RB.x + 10 - 30 * u, GY + 30, RB.z + 40 + 30 * u), 50, RB.clone().add(V(20, 30, 30)));
    }
    if (r5 && t < K.roll[0]) {   // (act4 r5) THE SWARM: one locked wide for the whole gang vocal, above and behind, a slow push-in into the sunset
      // (v4b stage_3d) cut on the bar downbeats: wide (154.26) | FRONT-ON Jade colouring a chunk, singing (155.363) | wide (156.956) |
      // the near three front-on from the build's far side (158.547) | wide (160.138)
      const ci = V4B.swarm.filter((x) => t >= T.snap(x) - 1e-6).length;
      if (ci === 1) { const jp = heroes.jade.position, d = V(1, 0, -0.35).normalize(), sd = V(-d.z, 0, d.x); const u = T.span(t, V4B.swarm[0], V4B.swarm[1]);
        const c = shot(jp.clone().addScaledVector(d, 96 - 8 * u).addScaledVector(sd, 12).add(V(0, 52, 0)), jp.clone().add(V(0, 42, 0)), 34, jp.clone().add(V(0, 52, 0))); c.front = true; return c; }
      if (ci === 3) { const jp = GANG.jade; const u = T.span(t, V4B.swarm[2], V4B.swarm[3]);
        const c = shot(jp.clone().add(V(230 - 14 * u, 46, -10)), jp.clone().add(V(0, 40, 4)), 42, jp.clone().add(V(0, 50, 0))); c.front = true; return c; }
      const u = T.span(t, K.gang, K.roll[0], T.ease.inOut);
      return shot(V(1088 + 40 * u, GY + 205 - 12 * u, 452), V(1380, GY + 6, 452), 55, CHUNKS[0].clone().lerp(CHUNKS[1], 0.5).add(V(0, 10, 0)));   // ~35 deg down (RTS angle), focus on the build
    }
    if (t < m2Shots.g2) {   // G1: ONE wide shot, all nine in parallel, facing us (slow push)
      const u = T.span(t, K.gang, m2Shots.g2, T.ease.inOut);
      return shot(V(1545 - 35 * u, GY + 62 - 8 * u, 452), V(1352, GY + 40, 452), 50, GANG.jade.clone().add(V(0, 40, 0)));
    }
    if (t < K.roll[0]) {    // G2: a lateral dolly along the line, closer: faces
      const u = T.span(t, m2Shots.g2, K.roll[0], T.ease.inOut);
      return shot(V(1525, GY + 50, 380 + 150 * u), V(1378, GY + 40, 440 + 24 * u), 48, GANG.jade.clone().add(V(0, 40, 0)));
    }
    const cf = cartFrame(t); const cp = cf.pos;
    if (t < K.build) {      // ROLL: three angles on the 16th groups as the cart clicks together
      const k = t < ROLL_CUTS[0] ? 0 : t < ROLL_CUTS[1] ? 1 : 2; const sh = 1.2 * T.beatPulse(t, 4, 0.04);   // (v4b stage_3d) on the grid
      const P = [V(110, 48, -150), V(-120, 60, -130), V(-70, 105, 150)][k].add(cp); P.x += sh * (hash(t * 30) - 0.5); P.y += sh * (hash(t * 31) - 0.5);
      return shot(P, cp.clone().add(V(0, 30, 0)), 50, cp.clone().add(V(0, 30, 0)));
    }
    if (t < m2Shots.b2) {   // BUILD a: behind-left and high: the cart revs at the start line, 出发 draws itself ahead (the countdown)
      const u = T.span(t, K.build, m2Shots.b2, T.ease.inOut);
      return shot(V(cp.x - 150 + 30 * u, GY + 80 + 20 * u, cp.z - 190 + 20 * u), V(G0.x - 10, GY + 95 + 10 * u, G0.z), 50, cp.clone().add(V(0, 40, 0)));
    }
    if (t < K.chufa) {      // BUILD b: ahead of the cart, looking back at the riders' faces; Charlie's hand over the button
      const u = T.span(t, m2Shots.b2, K.chufa, T.ease.inOut);
      return shot(V(cp.x + 165 - 20 * u, GY + 120 - 10 * u, cp.z - 95 + 15 * u), cp.clone().add(V(0, 55, 0)), 46, cp.clone().add(V(20, 50, 0)));
    }
    return camTail(t);
  }
  function camTail(t) {
    // 出发!: low and close on the far side of the gate: they leap off the Eraser and burst through toward us
    const tTrack = T.nearestBeat(K.chufaAcc + 0.9);
    if (t < tTrack) { const u = T.span(t, K.chufa, tTrack); const h = cartFrame(t).pos;   // (act4 M2) beyond the gate, pulled back
      const tgt = lerpV(V(G0.x - 40, GY + 70, G0.z), h.clone().add(V(0, 40, 0)), T.ease.inOut(T.span(t, K.chufa + 0.2, K.chufaAcc + 0.25)));
      return shot(V(G0.x + 300 + 30 * u, GY + 50, G0.z + 70), tgt, 52, tgt); }
    // ... then a low tracking shot running beside them
    if (t < K.pshot) { const h = cartFrame(t).pos;   // (act4 M2) tracking beside the cart as it flies off the mesa edge
      return lookFrom(V(h.x + 95, h.y + 30, h.z + 170), V(h.x - 10, h.y + 30, h.z), 50); }
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
    if (jamS.lift) { L.exposure += 0.04 * jamS.lift; L.rays = (L.rays ?? 0.45) + 0.1 * jamS.lift; L.bloomAmt = (L.bloomAmt ?? 0.35) + 0.06 * jamS.lift; }   // (v45_jam) the light comes back with Ricky's guitar
    if (t >= K.chufa && t < K.pshot) { L.exposure = 0.5; L.rays = 0.0; L.atmos = 0.6 * CRISP.atmos; }
    if (t >= K.pshot) { L.exposure = 0.36; L.rays = 0.0; L.dof = 1; L.dofAmount = 0.7; L.bloomAmt = 0.14; L.atmos = 0.5 * CRISP.atmos; }
    if (r5) {   // (act4 r5) DOF belongs to look_r5's tilt-shift (r5Shot below); the dusk foreground lifted a little out of the mud
      if (ws.pre) { L.exposure *= 1.05; L.fill = (L.fill ?? 0.95) * 1.1; L.ao = Math.min(L.ao ?? 0.6, 0.45); }
    }
    return L;
  }

  // ---------------------------------------------------------------- overlay (subs, chant type)
  // subtitles: the TALOS lines use Act III's own SmoothSubs (line 34 starts inside Act III at 123.18, so the slot
  // continues seamlessly across the 123.354 cut); the erased-page bridge lines (36, 37) are handwritten (PAPER rule)
  const smooth = new SmoothSubs(ctx.width, ctx.height); ov.scene.add(smooth.mesh); smooth.mesh.renderOrder = 30;
  // (v4) ONE lyric style everywhere: every Act IV line (the bridge's 36 / 37 too, no handwritten paper strip) in SmoothSubs, bottom centre
  const SANS_LINES = [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43];   // 33 = Act III's last line (its hold ends inside the flood's clear frame)
  function overlay(t) {
    ov.hideAll(); smooth.set(null);
    if (t >= K.yibi) { // laid out for all four characters (Team D stamps 一 画 at 173.187 / 173.719 in the same slots)
      ov.stampChars(t, 'yibi', [{ ch: '一', t: K.yibiW[0] }, { ch: '笔', t: K.yibiW[1] }, { ch: '一', t: T.word(43, 2).start }, { ch: '画', t: T.word(43, 3).start }], { y: 0.62, size: 0.22, color: '#ffffff', stroke: '#1b1b22', gap: 0.08 }); }
    if (api.suppressSubs) return;
    for (const id of SANS_LINES) {
      const c = subtitleFor(t, id, { lit: '#ffd23f', unlit: '#ffffff', hold: 0.25 });
      if (c) { smooth.set(c, 'bottom'); return; }   // (43 一笔一画! is stamped as hero type: inWorld, so subtitleFor gives null)
    }
  }

  // ---------------------------------------------------------------- fixtures & functions: a slab drawn in graphite, then brought alive
  const slab = new THREE.Mesh(new THREE.BoxGeometry(44, 26, 16), new THREE.MeshStandardMaterial({ color: 0x4a4a50, roughness: 0.5, metalness: 0.2, emissive: 0x000000 }));
  slab.castShadow = true; slab.receiveShadow = true; root.add(slab);
  function slabState(t) {
    slab.visible = t >= tFix && t < K.gang;
    if (!slab.visible) return;
    const pop = T.ease.back(T.clamp01((t - tFix) / 0.18));
    const alive = T.clamp01((t - tFun) / 0.25);
    slab.scale.set(1, Math.max(0.01, pop), 1);
    slab.position.set(RB.x + 58, GY + 13 * pop + alive * (6 + 8 * Math.sin((t - tFun) * 5)), RB.z - 34);   // (act4 M2) beside Jade's rebuild, clear of the camera
    slab.rotation.y = alive * (t - tFun) * 0.8;
    const c = new THREE.Color().setHSL(((t * 0.4) % 1), 0.85, 0.55);
    slab.material.color.set(0x4a4a50).lerp(c, alive); slab.material.emissive.copy(c).multiplyScalar(0.5 * alive);
  }

  // ---------------------------------------------------------------- the colouring stroke: every-colour pencil -> the Eraser
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1, 8, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uRainbow: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uRainbow; varying vec2 vUv; vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
      void main(){ float w = 0.5 + 0.5 * sin(vUv.y * 40.0 - uT * 30.0); vec3 c = mix(vec3(1.0, 0.45, 0.6), hue(vUv.y * 1.5 - uT * 1.2), uRainbow); gl_FragColor = vec4(c * (0.9 + 1.1 * w), 1.0); }` }));   // (act4 M1) the pink of her pencil's eraser cap
  beam.visible = false; root.add(beam);
  // (act4 M1) PAINT 148.191: a pink colouring stroke from Jade's pencil to the hatch front on its face, scribbling side to side
  function beamState(t) {
    beam.material.uniforms.uRainbow.value = 0;
    // (act4 M2) the gang: Jade's every-colour pencil colours the chunk Charlie's hat just seeded; the rebuild: the slab comes alive
    const ci = colourT.findIndex((x) => t >= x && t < x + 0.45);
    if (t >= K.gang && t < K.roll[0] && ci >= 0) { beam.visible = true; beam.material.uniforms.uT.value = t; beam.material.uniforms.uRainbow.value = 1;
      const tip = handOf(heroes.jade, 'R', V()); const tgt = CHUNKS[ci].clone().add(V(0, 12 + 6 * Math.sin(t * 20), 6 * Math.cos(t * 17)));
      beam.position.copy(tip); beam.lookAt(tgt); beam.scale.set(1.1, 1.1, tip.distanceTo(tgt)); return; }
    if (t >= tFun && t < tFun + 0.35) { beam.visible = true; beam.material.uniforms.uT.value = t; beam.material.uniforms.uRainbow.value = 1;
      const tip = handOf(heroes.jade, 'R', V()); const tgt = slab.position.clone();
      beam.position.copy(tip); beam.lookAt(tgt); beam.scale.set(1.1, 1.1, tip.distanceTo(tgt)); return; }
    beam.visible = t >= K.paint && t < K.paint + 0.4 && t < K.rebuilt;
    if (!beam.visible) return;
    beam.material.uniforms.uT.value = t;
    const tip = handOf(heroes.jade, 'R', V());
    const pink = T.clamp01((t - K.paint) / (K.run + 0.05 - K.paint));
    const y = GY + 320 * T.clamp01(1.6 - pink * 2.2 + 0.2);   // ~ the hatch front height (eraser.js: front = 2.2 pink - 0.6 - (1 - y/H))
    const tgt = offE(EP2, -62, 55 * Math.sin((t - K.paint) * 23), 0).setY(y);
    beam.position.copy(tip); beam.lookAt(tgt); beam.scale.set(1.4, 1.4, tip.distanceTo(tgt));
  }

  // (act4 M2) the montage's own-callback frames: the assembled cart crossing the frame in front of the camera (u 0..1)
  function flyCartAcross(u) {
    cam.updateMatrixWorld(); const fwd = V(0, 0, -1).applyQuaternion(cam.quaternion), right = V(1, 0, 0).applyQuaternion(cam.quaternion);
    const d = 230; const half = d * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect;
    const pos = cam.position.clone().addScaledVector(fwd, d).addScaledVector(right, T.lerp(-1.6, 1.6, u) * half).add(V(0, -40, 0));
    const yaw = Math.atan2(-right.z, right.x);
    for (const h of Object.values(heroes)) h.visible = false;
    cartRig.pose({ pos, yaw }, { t: 170, dist: u * 300, glow: 1, flap: 0.3 });
    eraserS.visible = true; eraserS.set({ pink: 1, face: 'happy', cap: true }); eraserS.scale.setScalar(PARTY_SC);
  }
  // ---------------------------------------------------------------- frame
  let lastCam = null; const resetVis = new Map();
  const sunAt = (t) => SUN_DAY.clone().lerp(SUN, T.span(t, K.start, K.start + 1.6, T.ease.inOut)).normalize();
  function update(t) {
    fx.flash = 0; fx.fade = 0;
    W.reset();                                   // the shared world's default state (WORLD_API contract), then Act IV on top
    for (const o of baseObjs) resetVis.set(o, o.visible);   // (act4 M2) the rebuilt world keeps the shared world's defaults
    api.suppressSubs = battleOwnsSubs(t);          // (battle scene v2) the battle UI's message window owns the subtitle here
    if (api.callback) api.suppressSubs = true;     // (act4 M2) a montage callback frame carries no subtitle of its own time
    if (t >= K.acc) handover(W, null);           // (battle scene v2) the battle cast is not part of W.reset(): hide it
    const ws = worldState(t);
    for (const f of Object.values(feats)) f.visible = false;   // (act4 M1) set per range below
    heldCap.visible = false; flyCap.visible = false; bolt.visible = false; for (const l of lampLights) l.intensity = 0; for (const w of moreWheels) w.visible = false;
    eraserState(t); heroState(t); bugState(t); ringState(t); gateState(t); slabState(t); beamState(t); finaleState(t);
    jamS = jamLight.state(t);   // (v45_jam) Ricky's light rings
    if (jamS.lampHit) { lampLights[0].intensity += 2600 * jamS.lampHit; }
    lastCam = camera(t);
    fieldState(t);   // (act4 r5) the world text field faces the lens
    if (api.cartFly != null) flyCartAcross(api.cartFly);   // (act4 M2) the speedrun montage: the cart blasts through this callback frame
    // flashes on the hard hits (one frame)
    if (T.exactFrame(t, [K.slam])) { fx.flash = 0.3; fx.flashColor = '#fff6e8'; }
    if (T.exactFrame(t, [K.lone])) { fx.flash = 0.25; fx.flashColor = '#ffffff'; }
    if (T.exactFrame(t, [K.chufaAcc, K.yibiW[0], K.yibiW[1]])) { fx.flash = 0.5; fx.flashColor = '#ffffff'; }
    if (t < K.dOut + 0.02 && t >= K.start) fx.fade = 0;
    lastLook = look(t, ws);
    if (r5) {   // (act4 r5) look_r5 per-shot overrides (checkpoints/look_r5.md API): the rise (2 columns, no beam), the page (vivid shards),
      // the lock (sharp on the shard field, no two-colour grade once it locks, no beam), the swarm (no flare, sharp on the build)
      // every shot names its SUBJECT as the focus (the tilt-shift band centres on it); protectL 0.5 keeps the hatched glyph sharp + saturated
      const jp = heroes.jade.position;
      const SH = { focus: lastCam.focus || lastCam.target };
      if (t < K.acc) Object.assign(SH, { focus: V(1400, GY + 30, 452), dof: 0.18, tilt: 0.15, skyGain: 1.45, columns: { keep: ['R0', 'R1'] }, beam: 0 });   // the band's backs; the far silhouette may soften
      else if (t < K.ht[1]) Object.assign(SH, { focus: jp.clone().add(V(0, 40, 0)), dof: 0.35, pairAmt: 0.15 });
      else if (t < K.trip[0]) Object.assign(SH, { focus: V(SPIRAL.c.x, GY + 35, SPIRAL.c.z), dof: 0.3, pairAmt: 0.15 });
      else if (t < K.lineFC) Object.assign(SH, { focus: jp.clone().add(V(0, 35, 0)), dof: 0.3, pairAmt: 0.15 });
      else if (lastCam.front && t < K.down) Object.assign(SH, { focus: lastCam.focus, dof: 0.22, tilt: 0, beam: 0, pairAmt: 0 });   // (v4b) the lock's front-on reaction
      else if (t < K.lookAt) Object.assign(SH, { focus: E.clone().addScaledVector(LOCK_DIR, 330), dof: 0.3, tilt: 0, pairAmt: t < K.lone ? 0.3 : 0, beam: 0, protectL: 0.5 });   // (an explicit flare: 0 / keyTurn / keyElev here blacked out the page under look_r5's 11:25 post.js: the sun is turned in world4 SUN5 instead)
      else if (t < K.s2) Object.assign(SH, { focus: EP2.clone().add(V(0, 238, 0)), dof: 0.35 });
      else if (t < K.cutEyes) Object.assign(SH, { focus: FIELD_P, dof: 0.25, tilt: 0.2 });
      else if (t < K.paint) Object.assign(SH, { focus: offE(EP2, -62, 0, 234), dof: 0.3, tilt: 0 });
      else if (t < K.rebuilt) Object.assign(SH, { dof: 0.35, tilt: 0.1 });   // S5 / S6: the scene's own focus (its face, then Charlie / the cap)
      else if (t < K.gang) Object.assign(SH, { focus: jp.clone().add(V(0, 40, 0)), dof: 0.4, tilt: 0.2 });
      else if (t < K.roll[0]) Object.assign(SH, lastCam.front ? { focus: lastCam.focus, dof: 0.25, tilt: 0, beam: 0, pairAmt: 0.25 } : { focus: CHUNKS[0].clone().lerp(CHUNKS[1], 0.5).add(V(0, 10, 0)), dof: 0.3, tilt: 0.15, beam: 0, pairAmt: 0.25 });
      else if (t < K.pshot) Object.assign(SH, { focus: K.cartFrame(t).pos.clone().add(V(0, 40, 0)), dof: 0.35, tilt: 0.15 });
      else Object.assign(SH, { dof: 0.5, tilt: 0 });
      r5Shot(SH);
    }
    capDof();   // (v4b stage_3d) the DOF cap (act3/common.js DOF_CAP_PX)
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
    if (!api.callback) { bui.update(t, { camera: cam, anchors: { eraser: eraserAnchor } }); bui.render(ctx.renderer, target); }   // (act4 M2: not in montage callbacks)
    if (hud.visibleAt(t) && !api.noHUD) { hud.update(t); hud.render(ctx.renderer, target); }   // (act4 M2) the LV2 → LV3 bar + the speedrun timer   // (battle scene v2) + (act4 M1) the eraser anchor for the ♥+1 tags
  }
  const shadowExt = (t) => (t < K.dOut ? T.lerp(700, 2600, T.span(t, K.start, K.dOut)) : t < K.acc ? 2600 : t < K.rebuilt ? 1500 : 700);

  const api = { stage: { kind: '3d', fx }, update, render, K, world: Wd, suppressSubs: false, cartFly: null, noHUD: false, callback: false, hud };
  return api;
}
