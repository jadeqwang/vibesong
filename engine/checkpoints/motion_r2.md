# MOTION r2: game-quality hero motion, build pass (2026-10-16)

Status: **r2b done (12:15): coordinator review fixes + models_r6 gate B (split rig, face, spring parts) integrated and verified on rig: true.** Started 11:15. Builds on the approved spike (checkpoints/motion.md; Jade: "Yes, build on it").
Backups of every src file I touch: `out/bak_r4/motion_r2/`.

## Plan (brief order)
1. Coordinator notes on the spike: step-up = quick hop (small) / climb-mantle (tall), chosen by height; short landing squash;
   trio spacing (formation offsets + deterministic mutual avoidance); gait bands that don't power-walk.
2. Turns (damped facing, lean, turn-in-place steps), start / stop transitions.
   GATE: spike vs r2 side-by-side clips in out/review/motion/r2/.
3. Secondary springs (bun pencils, slung guitars now; hair / straps / cap brim need separable parts from models_r6).
4. Life: blinks, eye darts, look-at, breathing, idle weight shifts.
5. Arm IK hand contacts API.
6. Beat-locking helpers.
7. Lip sync driver.
8. Rig split integration (when models_r6 documents it).

## Milestones
- [x] 1–2 + gate clips (12:05). Gate report below; continued to 3–8 per the brief.
- [x] 3 springs (bun pencils, guitars; more parts auto-picked up by name) — 4 life (blinks, saccades, look-at, breathing,
  weight shift, glances; face output adapter) — 5 hand contacts — 6 beat locking — 7 lip sync — 8 rig split adapter
  (native ankles / F.rig.foot, chest counter-rotation, wrists, finger poses, guitar on J.chest). Review: out/review/motion/r2/r2_life_contacts.mp4 (entry 2400).

## GATE 1–2 report (12:05)
Clips, 960x540, 30 fps, `--fig native --figscale 1.3 --figres 2.5`, LEFT = the approved spike (frozen copy
`src/core/motion/_spike/`), RIGHT = r2, same intent; each half's camera follows its own hero(es) (timings differ):
`out/review/motion/r2/r2_{stepup,landing,trio,ramp,turn}_spike_vs_r2.mp4` (1.7–3.7 MB each).
Re-render: `TMPDIR=$PWD/out/dev/tmp node render.js --show dev --from 2300 --to 2315 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --mp4 out.mp4`
(entries: stepup 2300, landing 2320, trio 2340, ramp 2360, turn 2380).
- **Step-up** (16 units = 0.5 hip): r2 `traverse()` walks to ~0.5 hip from the edge, 0.13 s crouch, 0.06 s push, ~0.33 s
  hop at 3–5 units over the step, short squash. Then a 36-unit ledge (1.1 hip) -> **mantle**: crouch, spring, both hands on
  the lip (arm IK), press, right knee onto the ledge, stand (1.5 s). Spike: 0.3 s crouch + 26-unit apex + 1.15 s recovery
  for both, and it "jumps" the ledge.
- **Landing**: squash depth scales with impact speed (hop ~0.25, a 1.25-hip drop ~1.0), crouch peak at ~0.1 s, recovered by
  0.3–0.65 s (spike: ~0.75 s down + settle steps to 1.15 s). Step-offs use a small push (no pop-up).
- **Trio**: naive staging (two paths that cross, Ricky following Jade to the SAME stop). r2 `MotionGroup`: the lower-priority
  hero slows to let the other pass (re-simulated), then sideways separation (only while moving, <= 0.45 x speed, so nobody
  slides). Min centre distance 30 units (spike: overlapping). Everyone reaches their own target except the shared stop,
  which is pushed ~1.1 hip apart.
- **Ramp** walk 1.3 -> brisk 1.75 -> jog 2.8 -> run 4.6 -> sprint 7.2 m/s. r2 gait model: walking cadence 72 + 29 v spm
  (stride and cadence both grow), the walk -> jog switch in a narrow band (1.85–2.12 m/s), jog/run = the jog clip played at
  150–174 spm with its stance warped to a real duty (0.40 -> 0.24) and the leg sweep scaled to duty x stride (a real slow
  jog instead of a power walk), sprint from 6–7 m/s.
- **Turn**: 120 deg right, 180 deg back, then a sharp corner. r2 turns in place with 2–3 steps (lead foot on the turn side,
  feet planted at the final heading); spike pivots with twisted planted feet. Moves starting > 60 deg off the facing turn
  first. Momentum lean (underdamped, sways back past upright after stops), jerk-limited starts.
- Drift (`node tools/motion/drift_check.mjs`): planted pivot vs lock **0.0000** on every pinned frame, spike choreo and all
  five r2 scenarios. Swing feet below ground: 0 except the hop (toe grazes the step corner, 4.8 units, one frame) and the
  mantle (feet brush the wall face). Hand residual on the lip <= 6 units only while the hands release (weight < 0.3).
- Known gaps at the gate: the hop toe-graze; the mantle's trailing foot brushes the wall; the jog posture still has the
  clip's forward lean at 2.8 m/s; no transition clips (procedural starts/stops).

## r2b: coordinator review fixes + models_r6 gate B integration (12:40)
1. **Press lands.** New `track.approach(target, { reach = 0.42 hip })` walks to arm's reach in front of the target on the line
   from where she is, so the last steps already face it (no arrival turn). After every walking stop the feet now **settle**
   (trailing foot up, then the front one squares; this was the "lunge": the stop left a stride-long stagger). `press()` comes
   in from 4 units above, lands the palm on the cap (hand joint offset a palm's thickness, 'open' hand), pushes 2.2 units
   over ~2 frames, holds 0.1 s, lifts. Out-of-reach targets get one shared **hip bend** for both hands (up to 40 deg toward
   the target; feet stay planted) instead of a straight arm. Shoulder frame fixed for the split rig (J.chest).
   drift_check now applies each scenario's staged opts and checks **|hand - target| on contact frames** (hold / carry:
   weight >= 0.99; press: the push window): press 0.000, hold 0.188 (0.191 rig), carry 0.000 (body-relative `carryBody()`,
   handles derived from each figure's shoulders and arm length) -> OK (limit 1.0).
2. **Idle stance** narrowed: a per-figure hip correction calibrated from the idle FK puts the feet at 1.2x the hip spacing
   (+-5.5 vs hips +-4.5; was +-9.5) with a small stagger (left 0.09 hip forward, right 0.06 back); weight shifts kept.
   Turn steps, landings and the new stop-settle all plant into this stance. `IDLE_FOOT` in figure.js tunes it.
3. **Jog posture**: torso eased toward the walk posture at jog speeds (2.8 m/s: 34.7 -> 20.6 deg forward; walk 14.4; fades out
   by ~5.8 m/s). **Ledge clearance**: swing feet test the ground under heel, toe and 35 / 70% of a foot length ahead of the toe
   (+0.8 margin near edges); a wall (ground > 0.35 hip above the foot) pushes the foot back out instead of lifting it. Swing
   feet below ground: hop toe-graze 4.8 -> 0, mantle wall brush -> 0 (both rigs).
4. **Standing / hand-placed spacing**: `MotionGroup` now has a staging pass: where two heroes STAND too close (or, with
   `camera: { pos }`, one hides the other on screen), the yielder's rest spot itself (its start, or the end of the move that
   brought it there) is moved and the track re-simulated; nobody slides. `add(track, { pin: true })` for heroes tied to a prop.
   Life scene: Ricky (staged right behind Charlie) is moved 14 units sideways; Charlie pinned (holds the post).
   Life scene restaged too: the YES console is waist height (top y 36; at 26 she had to fold 40 deg over it) and Jade starts
   level with it in depth, so she walks straight to it side-on to the camera (no arrival turn, nothing hides her). Measured:
   stops facing it within 0.5 deg of the bearing, feet settle 10 units apart, hip bend ~3 deg over her base posture.
   `approach({ from })` = the approach direction (a 0.9-hip straight lead-in), not a waypoint (it made a hairpin).
5. **models_r6 gate B** (rig: true): native ankles / F.rig.foot (no shin split), chest counter-rotation, wrists, `setHand`
   ('grip' only while holding / carrying, 'open' for press and the climb's lip, 'fist' otherwise, so pencils stay in a
   fist), springs on J.bun (pencils ride it, a small extra pencil jiggle), J.wispR/L, J.hairBack -> J.hairBack2, J.strapR/L +
   J.strapThighR/L (anchored on the thighs), J.capBrim; face: `setFace({ blink, look, viseme })` every frame AFTER pose()
   (visemes rest/A/E/O/U/M/F, I -> E; LOOK_SIGN [1, 1] confirmed). Measured on the face scene (node, rig): hair 20 deg,
   wisps 14, straps 17-25 while walking (then softened: max 0.30 / 0.28 rad, more damping, they flared in the hop), cap brim ~0.2 (tiny on head turns); visemes rest/E/A/U/O/M sent; 3-5 blinks per 12 s.
   Hair-down Jade gets `pencil: true` in the scene (hair rule).
6. Drift (both rigs, `node tools/motion/drift_check.mjs` and `FIGRES=2.5 FIGRIG=1 ...`): planted pivot vs lock **0.0000** on
   every pinned frame, all scenarios incl. the new carry and face scenes; contact check OK.
r2b clips (out/review/motion/r2/, all on the split rig, `--figres 2.5`): `r2b_face_lipsync_springs_rig.mp4` (dev 2440),
`r2b_life_contacts_rig.mp4` (2460), `r2b_stepup_spike_vs_r2_rig.mp4` (2480), `r2b_carry_rig.mp4` (2500). Dev entries 2420
(carry) and the `_rig` entries pass `rig: true` to MotionFigure (render.js has no figrig flag; the spike side stays unsplit).
New API: `approach()`, `carryBody()` (+ `.mid` for `carryFrame`), `MotionGroup({ camera })`, `add(..., { pin })`,
`lipSync(..., { shift })`, `VISEMES`, `IDLE_FOOT`.

## r2c + talos_r4 requests (12:45)
- **Standing arms relaxed** (coordinator): the UAL idle held them ~19 deg out + armOut 7 = ~26 deg (A-pose). Standing arms now
  hang at each figure's own clearance, measured once from its meshes (sweep the abduction, measure how deep the arm vertices go
  into the jacket / pants cells; shoulder cap skipped): Jade 12-13 deg (her baggy pants), Charlie 5-9, Ricky 7-8; soft elbow
  14 deg, 4.6 deg forward, swaying with breathing and weight shifts. Tunable: `ARM_CLEAR` in figure.js. Gait arms unchanged.
- **Cap brim** reads now: ~1 deg mean / 2.8 peak walking, 5 deg on landings, ~1 deg on Charlie's slow look turns. Spring inputs
  are low-passed (heel-strike jolts in the IK pelvis drop were flicking light parts; `smooth` / `smoothAng` per spring).
- Clip: `out/review/motion/r2/r2c_face_lipsync_springs_rig.mp4` (dev 2440, rig).
- **talos_r4 requests**: (1) ground(x, z, t) may change with time: the simulation passes the sample time, planted feet record
  the ground at their lock and ride its change (lift test: planted feet vs plate 0.000 through a 30-unit rise, drift 0);
  (2) `.step(to, { dur, shuffle, face })` quick step / sidestep / shuffle; (3) `column(pts, n, gap)` + `MotionGroup({ sideways:
  false })` for single file (gaps kept by yielding speed and moving stop spots, min distance 34 on the test); (4) `onJoint`,
  `place` + the snippets below. Dev entries 2520 (lift), 2540 (quick), 2560 (file), all in drift_check.

### Snippets for talos_r4
```js
import { MotionTrack, MotionFigure, carry, carryFrame, onJoint, place, press, hold, column, MotionGroup } from '../../core/motion/index.js';
// Ricky on the lift (95.8-96.6): a ground that changes with time; his feet ride the plate; hop off at the top
const liftY = (t) => T.keys(t, [[95.8, 0], [96.6, LIFT_H]], T.ease.inOut);
const ground = (x, z, t) => (onLift(x, z) ? baseY + liftY(t) : world.groundAt(x, z));
const tr = new MotionTrack(clips, { t0, pos, unit: fig.unit, ground }).move([onPlate]).idle(null, { until: 96.7 }).hop({ to: ledgePt }).build();
// Charlie's threat step (12 units, 0.2 s) and his step onto the cap spot
tr.step([x + 12, z], { dur: 0.2, shuffle: false }); tr.step(capSpot, { dur: 0.22 });
// single file over the planks
const F = column(plankPts, 3, 34); const g = new MotionGroup({ sideways: false });   // then g.add(track, { weight: i + 1 }) per hero, g.build()
// Jade carries the tripod by two legs: pose the tripod first each frame (e.g. from carryFrame(fig) of the previous apply, or
// your own prop path), then hands on two leg points (tripod-local), grip pose
const hands = carry(tripod, { R: [3, -8, 4], L: [3, -8, -4] }, tPick, tPlant);
fig.apply(trJ, t, { hands, pencil: false });
// planting it: put the tripod at its plant spot from tPlant, hold the two legs while she lets go
const handsPlant = { R: hold(legPtR, tPlant - 0.2, tPlant + 0.4), L: hold(legPtL, tPlant - 0.2, tPlant + 0.4) };
// Charlie pulls the spare cap from his cap: hand to the cap (split rig J.cap, else J.head), then sets it on the plate
const toCap = onJoint(charlie, 'cap', [2, 3, 0], tReach, tPull);       // parent the spare cap mesh to charlie.F.J.handR at tPull
const pl = place(platePt, tPull + 0.3, { tDown: tPull + 0.8 });         // reparent it to the world at pl.down; crouch with trC.clip('pickup') if the plate is on the floor
charlie.apply(trC, t, { hands: { R: t < tPull ? toCap : pl.spec } });
// Ricky plugs the jack into the amp: push in along the socket axis (x here), grip pose; the jack mesh rides J.handR until hit
const plug = press(socketPt, tReach, { tHit, depth: 2, dir: [1, 0, 0], pose: 'grip' });
ricky.apply(trR, t, { hands: { R: plug.spec } });
```

## API (for talos_r4 and other stagers)
`import { ... } from '../../core/motion/index.js'`. Everything is opt-in per scene; nothing global changed. Every frame is a
pure function of t (tracks are tables built once in setup; springs / look-at / blinks re-simulate a fixed look-back).
```js
import * as T from '../../show/timing.js';
const clips = await loadMotionClips();                                   // once per scene
const fig = new MotionFigure(ctx.lib, 'jade');                          // { variant: 'jade_down' | 'charlie_nohat', rig (models_r6 split rig), springs: true }
scene.add(fig.group);
const tr = new MotionTrack(clips, { t0, pos: [x, z], heading, unit: fig.unit, ground: (x, z) => y, timing: T, name: 'jade' })
  .idle(0.4)                                                             // or .idle(null, { until: T.bar(60) })
  .move([[x1, z1], [x2, z2]], { speed: 'walk' })                        // named speeds (m/s): stroll .9 walk 1.3 brisk 1.75 jog 2.8 run 4.6 sprint 7.2; numbers = world u/s; or [[tau, speed], ...]
  .move(pts, { speed: 'brisk', arriveAt: stopOn(T, T.bar(61, 1)), beats: true })   // stop lands on the beat, every footfall on a beat ({ every: 2 } = every other)
  .idle(0.8, { face: angle })                                            // > 35 deg: turn-in-place STEPS (steps: false = pivot)
  .traverse({ to: [x, z] })                                              // walks to the first edge on the line, then step / hop / climb (mantle) / jump-down by its height
  .hop({ to, landAt: T.bar(62, 1) })  .jump({ to, toY, style: 'jump', apex })   .climb({ to, edge })
  .clip('yes')                                                           // one-shots in place: yes, pickup, interact, push, throw, talk, dance, fold_arms, crouch_walk...
  .build();                                                              // or add tracks to a MotionGroup and call group.build()
update(t) { fig.apply(tr, t, opts); }
```
`apply` opts (all optional): `layers` (as in the spike: `{ anim | clip, t0, t1, mask, rate, p }`), `pencil`,
`look` (`{ at: [x, y, z] | Vector3 | (t) => point, t0, t1, fade, w, body }` or an array; head + a torso share turn, eyes
lead; idle glances when nothing is targeted), `hands` (`{ R: spec, L: spec, pose: { R: 'grip' } }`, see contacts),
`mouth` (`(t) => viseme weights`, from `lipSync`), `blink` / `blinks: [times]` (forced blinks), `life: false` (no breathing,
weight shift, glances, blinks), `springs: false`, `freezeAt: t` (hold everything from t: deliberate song stops), `ik: false`.
- Read back emergent timing: `tr.segs[i].t0 / t1`, `tr.segs[i].touch` (jump touchdown), `tr.footfalls()`, `tr.end()`,
  `tr.warnings` (missed `arriveAt` / `landAt`, climbs started too far away), `tr.state(t)` (root, heading, speed).
- **Group spacing**: `const g = new MotionGroup({ radius: 0.55 /* x hip height */ }); g.add(track, { weight })` for each
  hero (not built), then `g.build()`. Crossing paths: the higher-`weight` (or later) hero slows to let the other pass; then
  sideways separation while moving. `g.warnings` lists overlaps left at a standstill (stage those stops apart).
  `formation(pts, [{ side, back }, ...])` -> per slot `{ start, pts, heading }` along a shared path.
- **Hand contacts** (`contacts.js`; arm IK blended by the spec weight, finger pose on the split rig):
  `hold(point, t0, t1)` (tripod legs, a rail, a post; pose 'grip'), `press(point, t0, { tHit, depth })` -> `{ spec, hit }`
  (YES button / plate; drive the button's travel from `hit`; pose 'point'), `onObject(obj, localPt, t0, t1)` / `carry(obj,
  { R, L }, t0, t1)` (pose the prop first each frame, e.g. from `carryFrame(fig)`), `neckHand(fig, t0, t1)` / `guitarPoint`.
  Ricky's playing is still the voxfig 'chord' / 'sustain' layers (their own guitar IK); `strumLayer` puts the downstrokes on beats.
- **Beats** (`beats.js`): `stopOn(T, beat)`, `beatPhase(T, { every })`, `strumLayer(T, t0, t1, { every })`, `footfallReport(tr, T)`,
  `landings(tr)`. Measured: beat-locked footfalls within 4.2 ms of the grid (the 240 Hz step); arriveAt / landAt exact to 4 ms.
- **Lip sync** (`lipsync.js`): `lipSync(T.raw().lyrics, { lines: [24, 25, 26], open: 1 })` -> `(t) => { rest, A, E, O, M }`
  weights (word times from analysis/lyrics_timed.json; Mandarin by character finals, English by a word table). Pass as
  `opts.mouth`; MotionFigure sends the strongest viseme to models_r6's `F.setFace({ blink, look, viseme })` when the face rig
  exists (a no-op until then).
- **Springs**: automatic (bun pencils on Jade's head, the slung guitars about their strap pivot, damped off while a playing
  layer holds the guitar). Parts models_r6 separates later (`J.hairBack`, `J.bun`, `J.strapR/L`, `J.strapThighR/L`, `J.cap`,
  `J.capBrim`, `J.wispR/L`) are picked up automatically by name (see REQUESTS).
- **Rig split** (models_r6, `rig: true` / `?figrig=1`): detected automatically. Native ankles + `F.rig.foot` contact points
  replace the shin split; the lower torso follows the mocap pelvis / spine_01 and `J.chest` carries the rest (counter-
  rotation); wrists flex from the mocap hands (new `ex` track in ual_rig.json); look / breathing turn the chest; the guitar
  spring anchors on whatever carries the guitar. Drift is 0.0000 on the split rig too (`FIGRES=2.5 FIGRIG=1 node tools/motion/drift_check.mjs`).
- Costs: ~16–20 fps at 960x540 with three heroes, springs and life on (the spike was ~20).

## REQUESTS
To **models_r6** (via the coordinator). Written 11:45, before models_r6 documented an API; motion_r2 detects each of these
when it exists and falls back gracefully when it doesn't.
1. **Separable secondary-motion parts** (today they are baked into the head / torso / thigh meshes, so they can't move):
   - Jade hair-down: the back curtain / long clumps as their own part(s) on the head with a pivot at the nape (ideally 2 stacked
     segments: upper + lower), e.g. `J.hairBack` (+ `J.hairBack2`). The two front temple wisps optional (`J.wispR/L`).
   - Jade bun: the bun as its own small part (`J.bun`, pivot at its base on the crown) with `items.bunPencils` parented to it,
     so bun and pencils jiggle together.
   - Orange straps: each hanging strap as its own part with a pivot at its top (belt loop / pocket flap): `J.strapR/L`
     (belt -> knee) and `J.strapThighR/L` (pocket flap); parent = the pelvis (or the thigh for the thigh straps).
   - Charlie: the flat cap as its own part on the head (`J.cap`, pivot at the band front) so the brim can lag slightly;
     a separate brim part (`J.capBrim`) would be ideal.
   - Guitars already work: `items.guitar` holders (spring applied about a strap pivot by motion_r2, after voxfig poses them).
   Convention wanted: each part = a THREE.Group joint at its pivot whose rest rotation is identity; motion_r2 only rotates it.
2. **Face states API** on the figure, e.g. `F.setFace({ blinkL, blinkR (0 open .. 1 closed), eyeYaw, eyePitch (rad, + = her
   left / up), mouth })` where `mouth` = viseme weights over `rest, A (ah), E (eh), I (ee), O (oh), U (oo), MBP (closed), FV`
   (or document your viseme set; motion_r2 maps onto it). motion_r2 calls it every frame after posing.
3. **Rig split joint names** (if possible): keep `J.legs` = pelvis (rotates the leg chain) and `J.body` = lower torso; add
   `J.chest` (child of J.body, waist pivot ~y 58), `J.ankleR/L` (+ `J.toeR/L` if you split the toe), `J.wristR/L` (between
   the elbow and `J.handR/L`, so props keep following the hand), and `F.setHand(sd, 'fist' | 'point' | 'grip' | 'open')`.
   With native `J.ankleR/L` present, MotionFigure stops splitting the shin mesh itself (its ankle prototype).
   Please give each new joint a rest() reset and identity rotation at rest, and list the pivots in your API section.
   **Update 12:00:** models_r6's split rig (J.chest, J.ankle/toe, J.wrist, F.rig.foot, F.setHand) is integrated and passes the
   drift check. Still open: (1) the separable spring parts; (2) the face rig (`F.face`), and please confirm the sign of
   `look[0]` (motion_r2 sends + = toward her right) — or tell me and I flip `LOOK_SIGN`.

## Files
- New: `src/core/motion/{group,springs,life,contacts,beats,lipsync,mantle}.js`, `src/core/motion/_spike/*` (frozen spike copy
  for the side-by-sides only), `src/scenes/dev/motion2_{choreo,test}.js`.
- Changed: `src/core/motion/{track,figure,clips,index}.js`, `tools/motion/{drift_check,mocap_extract}.mjs`,
  `assets/mocap/ual/ual_rig.json` (+ `ex` track per clip; the 11-joint frames are byte-identical), `src/show/dev.js` (+6 entries
  2300–2416). Backups: `out/bak_r4/motion_r2/`. Scratch: `out/dev/tmp/motion_r2/` (logs, probe scripts, small).
- Not touched: heromodels, voxfig, any act scene. Default renders unchanged (nothing outside dev uses core/motion yet).

## Drift (final, 12:00)
`node tools/motion/drift_check.mjs` and `FIGRES=2.5 FIGRIG=1 node tools/motion/drift_check.mjs`: planted pivot vs lock
**0.0000** on every pinned frame, spike choreo (423–458 pinned frames per hero) and all six r2 scenarios (490–782 each), both
rigs. Swing feet below ground: hop toe-graze 4.8 (5.4 on the rig), else <= 0.01. Climb hand residual 5.7 (3.0 on the rig),
only while the hands let go. Determinism: cold still == sequential (bit-identical transforms) with springs + life on.

## Open problems (honest, r2b)
- Cap brim spring is nearly invisible (0.2 deg; Charlie's head turns are slow). Raise its gain if the coordinator wants it seen.
- From the life camera the console still covers part of Jade's right leg while she presses (staging, not motion).
- Sprint keeps the run clip's ~46 deg torso lean (only the jog was asked for); walk is 14 deg.
- Toe joint (J.toe) still unused: the heel-up pivot is the sole tip, not the ball.
- The mantle hand residual (up to 5.8) is during the hand release only (weight < 0.3), unchanged.

## Open problems (r2, kept for history)
- Hop: the trailing toe grazes the step corner for a frame; the mantle's hanging foot brushes the wall face. Both visible only
  side-on at the edge.
- The life clip's button press: her arrival turn-step dips into a deep lunge (turn steps + pelvis drop near the button).
  Staging close to props needs a stop distance rule (a `reachFrom` helper would help).
- Jog posture keeps the clip's forward lean at 2.8 m/s (reads slightly "running"). The idle clip's stance is wide.
- No toe roll on the split rig yet (J.toe stays at rest; the toe pivot is the sole tip, not the ball).
- Look sign vs models_r6's `look [x, y]` is an assumption (`LOOK_SIGN` in figure.js); eyes / blinks / visemes are untested
  visually until their face rig lands. Lip sync sends ONE viseme per frame (their API takes a name, not weights).
- Hair / straps / cap brim springs wait for separable parts (REQUESTS 1). Charlie's acoustic on the back swings within a
  limit; no collision with the body beyond the angle clamp.
- MotionGroup can't fix two heroes told to stop on the same spot; it pushes them ~1.1 hip apart and warns. Yielding is
  per-pass heuristic (up to 8 re-simulations).
- Gate clips stepup / turn / landing / trio were rendered before springs and life were switched on (ramp and life include
  them). Re-render with the commands above to see everything together.
- figscale: node checks use the native model at figscale 1 (unit 0.701), matching the spike's numbers; check in-browser if a
  scene uses a different figure scale.
