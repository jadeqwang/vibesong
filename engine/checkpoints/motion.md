# MOTION spike: game-style hero locomotion (2026-10-16)

Status: **spike done, opt-in module working.** No approved scene and no `main` range were touched. The only shared file
edited is `src/show/dev.js` (three new dev entries; backup `out/bak_motion/dev.js.bak`). `src/core/heromodels/` and
`src/core/voxfig.js` are untouched (the ankle is prototyped inside the motion module, see below).

## Review files (engine/out/review/motion/)
- `motion_old_vs_new.mp4`: 8 s, 960x540, 2.7 MB. Left: OLD (today's polyline lerp + `pose('run')` on time, sin-arc jump with the
  2-frame jump pose). Right: NEW. Same three heroes (native, figscale 1.3), same segment times. They idle, walk, speed up to a jog along an
  S-curve, brake to a stop, turn, jump onto a 16-unit step, land, take settle steps and idle.
- `contact_strip_30fps.png`: 24 consecutive frames (30 fps, 0.8 s) from a fixed low camera on Ricky's feet during his walk-in.
  Each frame is labelled with t, the frame number and each foot's state. Red and blue crosses mark the lock pivots. The right foot stays
  on its spot from f45 to f65 (heel strike, then roll onto the toe) while the left foot swings.
- `old_vs_new_sheet.jpg`: every 10th frame of the mp4.
- Re-render (from engine/): `TMPDIR=$PWD/out/dev/tmp node render.js --show dev --from 2000 --to 2008 --fps 30 --res 960x540 --fig native --figscale 1.3 --crf 20 --mp4 out/review/motion/motion_old_vs_new.mp4`
  Dev entries: `dev.motion` 2000-2010 (split), `dev.motion_feet` 2100-2110 (feet strip camera), `dev.motion_new` 2200-2210 (NEW only).

## Numbers (`node tools/motion/drift_check.mjs`, no browser, runs in under 1 s)
| | NEW | OLD |
|---|---|---|
| planted pivot vs its lock (max, every pinned frame, all 3 heroes, ~400 pinned frames each) | **0.0000** world units | n/a (no contacts) |
| sole points touching ground: mean slide per frame / p95 | 0.015 / 0 | 0 (OLD feet hover: the lowest foot averages 3.7-4.1 units above the ground vs 2.8-3.0 for NEW) |
| support-foot (lower foot) slide per frame while moving | 1.07-1.15 (includes jog flight frames with no foot down) | 4.8-5.7 |
Remaining NEW spikes: a single lift-off frame per few steps where the toe is still within 0.6 units of the ground while starting forward (max 2-4.6 units).
Determinism: a still rendered cold matches the same still rendered after other frames bit for bit (md5 match).

## Mocap
- **Quaternius Universal Animation Library 1 + 2, Standard editions. License: CC0 1.0 (public domain).** Downloaded from itch.io
  (free tier; the Pro/Source tiers are paid and were not fetched). Kept in `assets/mocap/ual/_dl/x/` (UAL1 glb + License.txt + README) and
  `_dl2/x/` (UAL2 glb + License.txt). Zips deleted. A license copy is at `assets/mocap/ual/LICENSE_UAL.txt`. Nothing in the download was
  executed: the GLBs are parsed as data by `tools/motion/glb.mjs`.
- Extracted (`assets/mocap/ual/ual_rig.json`, 295 KB): idle, walk, jog, run (Sprint), jump_start / jump_loop / jump_land, push,
  pickup, interact, dance, talk, crouch_walk, throw (UAL2 OverhandThrow), yes, fold_arms, carry_walk, climb_1m.
- The Standard editions have **no start / stop / turn clips** (Pro only). Starts and stops are procedural here (see stride warp).
- UAL "Jog_Fwd_Loop" is really a 6 m/s run (Sprint is 8.3, walk 1.0). In world units at figscale 1.3: walk 30.5 u/s, jog 181.6, run 235.5.
- Re-extract: `node tools/motion/mocap_extract.mjs` (about 6 s). Inspect: `node tools/motion/glb_inspect.mjs <glb>`, `node tools/motion/mocap_probe.mjs <glb> <clip>`.

## Retarget (offline, tools/motion/mocap_extract.mjs)
Direction-based, so it works across different proportions and rest poses. Mocap faces +z with left = +x. Ours faces +x with right = +z, so C = +90° about y.
- `legs` (pelvis group) <- pelvis rotation vs bind. `body` <- slerp(pelvis, spine_03, 0.8): the three spine bones fold into one torso.
  `head` <- neck/head, body-local.
- shoulder / hip <- the upper bone's direction plus the elbow / knee hinge axis. The hinge is measured per bone in the upper bone's local
  frame (averaged over all clips). Elbow and knee <- the signed hinge angle. Our rest frame: limbs hang along -y, the elbow hinge is +z and
  the knee hinge is -z (the voxfig conventions).
- Ankle pitch (foot vs shin) is stored for the ankle prototype. Wrists and fingers are dropped.
- Root: pelvis sway is scaled by leg length (48.8 design units per metre). Root height is **re-solved on our own leg FK**, so the planted
  foot touches y = 0. Loops are re-phased so phase 0 = right-foot strike in every gait (phase-synced blending).
- The rig lacks: a pelvis/chest split (the `legs` vs `body` groups give a little counter-rotation), ankles/feet (prototyped),
  wrists, fingers, and clavicles (folded into the shoulder).

## API (src/core/motion/, `import { ... } from '../../core/motion/index.js'`)
```js
const clips = await loadMotionClips();                       // once per scene (fetches /assets/mocap/ual/ual_rig.json)
const fig = new MotionFigure(ctx.lib, 'jade');               // { variant: 'jade_down' | 'charlie_nohat', ankles: true, armOut: 7 }
scene.add(fig.group);
const tr = new MotionTrack(clips, { t0, pos: [x, z], heading: 0, unit: fig.unit, ground: (x, z) => height })
  .idle(0.45)
  .move([[x1, z1], [x2, z2]], { speed: [[0, 'walk'], [1.25, 'jog']], accel: 260, decel: 240 })   // spline; brakes to stop at its end
  .idle(0.3, { face: 0 })                                    // damped turn in place
  .jump({ to: [x3, z3], apex: 26 })                          // or air: seconds; one GRAVITY (900 u/s^2) for every jump
  .clip('yes')                                               // any extracted one-shot, in place
  .idle(2)
  .build();                                                  // fixed-step 240 Hz table, built once in setup
// update(t): pure in t
fig.apply(tr, t, { layers: [{ anim: 'chord', t0, t1, mask: 'armsHead', rate: 2 }], pencil: false });
```
- Segment times are emergent (from path length and accel). Read them back from `tr.segs[i].t0 / t1` (song time).
- Layers: `{ anim }` = any voxfig hand-keyed pose (its items, such as the guitar, come with it), or `{ clip }` = a mocap clip.
  Masks: `upper`, `arms`, `armsHead`, `lower`, `all`, or a `{ joint: weight }` map. There is a 0.2 s fade in and out.
- `fig.debug.R / .L` = { mode: heel | toe | swing | fk, pivot }. Helpers: `fig.hand(sd)` and `fig.footPts(sd)`.

## How it works
- **Path + speed:** a centripetal Catmull-Rom spline with an arc-length table. The target speed is keyed in time and reached with
  accel / decel limits. The stop never overshoots (the speed is clamped to the braking curve).
- **Facing + lean:** a critically damped heading spring follows the path tangent. The whole figure tilts toward the smoothed horizontal
  acceleration (clamped to 12.6°), so it leans into turns and into acceleration. IK re-plants the feet.
- **Gait:** idle / walk / jog / run weights are piecewise-linear in speed. The cycle phase advances by distance / stride. The stride is
  the stance-duration-weighted mean, so between gaits the cadence rises instead of the stride growing past what the blended legs can
  cover.
- **Stops:** a stride warp over the last 0.8 s lands the stop in double support (k/2 + 0.07). The idle stance is left-foot-forward, so
  every start from idle or a landing begins at phase 0.57.
- **Contacts:** a strike-gated state machine per foot. A contact starts only when the cycle passes the speed-blended strike phase and ends
  at the blended toe-off. A cap releases the foot if the body has travelled too far past it. Clip segments (jump) set contacts explicitly.
- **Foot locks:** lock = the foot's FK heel / toe at contact start, put on `ground(x, z)`. Locks are cached per contact interval, as a
  pure function of the track.
- **Stance (with the ankle prototype):** the foot is flat on its lock with the lock's heading. The FK foot pitch drives heel / toe roll
  (pivot on the heel while the toes are up, on the toe while the heel is up). Two-bone IK puts the ankle there and the ankle joint
  sets the foot orientation. The pelvis drops (soft cap: 22% of hip height) when both planted feet can't be reached.
- **Swing:** FK plus a correction that blends across the whole swing, from the lift-off lock to the next plant. Both ends are
  deterministic. A clearance arc (up to 14% of hip height, 35% of the step length) means every swing is a real step and never drags.
- **Jump:** anticipation (Jump_Land's recovery played backwards: stand -> crouch), a 0.075 s push-off (Jump_Start), a ballistic arc with
  one gravity, then Jump_Loop. Jump_Land fades in 0.12 s before touchdown and the recovery follows, then the idle. One settle step per
  foot moves the feet into the idle stance.
- **Ankle prototype (inside the module):** each shin mesh is split at the ankle into shin + foot meshes. They share the cached model's
  vertex buffers (only new index arrays). Triangles in a ±1.7-unit band at the cut go to both, which hides the seam. The foot hangs from
  a new `J.ankleR / J.ankleL`. `ankles: false` gives the rigid-foot mode (pin heel or toe; the feet then go on tiptoe when the shin tilts).
- All rig dimensions (hip height, thigh, sole heel / toe, ankle) are read from the built model, so the density spike's figres change
  should not break this. Re-run `drift_check.mjs` after it lands.

## Files
- `src/core/motion/{index,clips,path,track,figure}.js` (new)
- `src/scenes/dev/motion_choreo.js` (choreography plus the OLD baseline, shared with the drift check) and `src/scenes/dev/motion_test.js` (scene)
- `tools/motion/{glb,glb_inspect,mocap_fk,mocap_probe,mocap_extract,drift_check}.mjs`
- `assets/mocap/ual/{ual_rig.json,LICENSE_UAL.txt,_dl/x/*,_dl2/x/*}`
- `src/show/dev.js`: +3 entries (backup in `out/bak_motion/`)

## Known limits
- Between walk (30 u/s) and jog (181 u/s) only the blend exists: a "power walk" with rising cadence. A real ~3 m/s jog clip would help.
- No start / stop / turn transition clips (UAL Pro has them; procedural stand-ins: stride warp, settle steps, damped turn).
- Turning in place twists the planted feet (the pole follows the hips). There is no pivot-step logic yet.
- Without a layer, Ricky's mocap arm swing can pass through the Strat (use a layer such as `chord`, or an arms mask, while walking).
- The ankle seam can show at extreme plantarflexion (toe-off in fast swings). The proper fix is real foot parts.
- Segment timing isn't beat-locked yet (no `arriveAt` / `landAt` constraints).

## Recommended next steps
1. **Rig upgrade in heromodels + voxfig** (needs the density agent's files to settle first): split torso -> pelvis + chest (waist pivot
   ~y 58), shin -> shin + foot (ankle pivot, capped cut voxels), lower arm -> forearm + hand (wrist), and simple finger poses (fist / point /
   grip / open) as hand variants. Add the joints to `buildFigure`, `rest()` and `pose()`. The motion module would then use native
   ankles, and the retarget would map spine_01 -> pelvis and spine_03 -> chest and add hand_r/l -> wrist (the extractor already has the data).
2. **Beat locking:** `move(..., { arriveAt: T.beat(n) })` (solve the cruise speed so the stop lands on the beat) and
   `jump({ landAt })` (pick the takeoff from the air time). Choreo already has the beat helpers.
3. **Secondary springs:** deterministic look-back springs (re-simulate a fixed 1 s at a fixed dt per frame from the track) on hair,
   bun pencils, straps, slung guitars and Charlie's cap brim. These drive extra child joints, the same pattern as the ankle.
4. **Look-at + life:** head and eye aim at targets (clamped, layered over the head joint), blinks, idle weight shifts (alternate
   idle clips: talk, fold_arms are already extracted), and pivot steps when idle turns exceed ~45°.
5. **Arm IK contacts:** expose voxfig's `ikArm` (or reuse `_solve` for arms) for hands on props, plates and the YES button.
6. More clips if wanted: UAL Pro ($) for start / stop / turn / jog, or CMU BVH (free) for a slow jog.
