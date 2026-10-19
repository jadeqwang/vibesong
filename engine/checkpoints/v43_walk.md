# v4.3 walk: the three heroes on the causeway at 1:22 (Jade's note on full_v4.2)

Note: "1:22 - her walking looks kinda weird and unnatural compared to the other 2, but all 3 of them could have more natural
movements like they do later on".

## Cause
Scene `act3.turn` (src/scenes/act3/turn.js, 77.757-86.385; the 3D part runs from the 80.815 impact). After the hat parachute lands
(81.6 / 81.8), the three 3D heroes were still the old **voxel sprite figures** (`W.heroes`, `W.put` with `anim: 'run'`). They
were not on the mocap system that act3.drop and later scenes use. Specifically:
- Each hero had a 2-frame `run` pose that flipped on a beat counter (`runFrame`). There was no gait cycle and no foot contact. The root
  slid along `runX()`, so **every foot slid**.
- The speed table swung from 3.0 to 0.9 and back to 2.8 m/s within 0.3 s for each action (Jade's flicks were cut by 70%, Ricky's chords by 85%),
  plus a small y-bob.
- `faceCam` turned the whole body up to ~33 deg toward the camera, so they crab-walked.
- Jade looked worst. Her native pose with `pencil: true` keeps both pencil hands out in front with straight, stiff legs, and her
  "light 2-frame run" alternated two poses. Her baggy pants hid the leg motion, so she read as gliding.

## Fix
With the talos_r4 figures (`R4`, i.e. the `--figres 2.5` review/master path) the heroes are now `R.figs` MotionFigures. These are the
same figures, materials and rig as act3.drop. They are driven by MotionTracks:
- **Landing** out of the parachute: a squash and a quick recovery. Jade runs straight out of hers.
- **Path**: each hero's old table x(t) (`runX`), smoothed with a Gaussian in time (sigma 0.30-0.36 s). The near-stops become gentle
  slow-downs, and the party stays where the camera was keyed. Jade lands 37 units behind her table spot, so she makes that up in her first
  0.6 s (a burst past Charlie). Ricky lands 14 units ahead and eases off over his first 35% (he never backs up). The z weave is unchanged.
  The hand-off at 86.385 is unchanged.
- **Gait**: the cadence/stride model with planted feet (foot-lock IK), arm swing and weight shift. Per-hero cadence varies: Jade x1.30
  (light and quick), Charlie x1.22, Ricky x1.15 (longer strides). Speeds differ, so they never move in lockstep.
- **Actions** are upper-body layers on the gait:
  - Jade's cypress flicks (`draw_rainbow`, right arm and head only; she keeps both pencils in fists).
  - Charlie's boomerang throws and catches (`throw`). He swaps to `charlieNH` while the hat is in the air.
  - Ricky's switch chords (`chord`).
- **Looks**: Jade looks at the cypress she colours, Charlie follows his hat, Ricky looks at the switch he clicks.
- **Beams**: Ricky's beam now starts at his guitar and Jade's at her rainbow pencil, both on the mocap figures. The hat returns to Charlie's
  mocap position.

Speeds come out at ~2.1-3.7 m/s, so the motion reads as a light **jog**, not a walk. The world's timing (the switches and the causeway
chunks rising under Jade's feet) fixes about 100 u/s, so a real walk would mean restaging the shot.

The **camera is unchanged**: it is still anchored on the old table. The mocap party centre stays within 15 units of it (max at ~82.5,
under 4 after 84). The minimum x gaps are J-C 25 and C-R 18 (the table had 18 and 7). Feet: in an in-page check over 81.6-86.4,
planted pivot vs lock was **0.0000** for all three, and no feet went below the ground.

## Changes (all marked `(v43 walk)`)
- src/core/motion/track.js (motion API, additive):
  - `follow(fn, { until, cadence })` at :151 / `_follow` at :327. A scripted root path gets real gait, contacts and facing.
  - `land({ v, recover, settle, tail })` at :154. Starts a track with a landing.
  - The dispatch is at :237-240.
  - The landing code is factored out of `_jump` into `_landing` (identical math). `node tools/motion/drift_check.mjs` is unchanged
    (pivot 0, contacts OK).
- src/scenes/act3/turn.js:
  - imports :25-26
  - `W_*` tunables + `walkPaths` + `walkZ` :74-103
  - mocap setup `MO` (tracks, log lines) :297-311
  - `hatOff` / `charlieAt` / `hatPos` moved to setup :313-325
  - layers `WL` / looks `WLOOK` :326-338
  - per-frame figure apply (W.put / faceCam skipped when MO) :420-436
  - beams :484, :491-492
  - DOF focus :513

  Without R4 (default carve / 1.25 path), `MO` is null and the old voxel code runs unchanged.
- Not touched: camera, cuts, timing, the heroes() table, the 2D roll, props/materials (the hat unit's props.js edit is theirs).

## Seams
- 77.5-81.5 and 86.5-87.2 vs full_v4.2: mean luma diff 0.4-2.2 (encode noise plus the hat unit's boomerang colour). Nothing changed outside 81.62-86.385.
- 86.385 is a hard cut to act3.drop (r5 Room A, different staging), as before.
- The chute hands over at 81.62 / 81.8 exactly as before (the figures appear on the old landing spots).

## Deliverables
- engine/out/review/v43/walk/turn_walk_v43.mp4: 540p, 77.5-87.2 with audio. File time + 77.5 = song time.
- engine/out/review/v43/walk/walk_before_after_2x.jpg: 82.9 / 83.4 / 84.0 / 85.2 / 85.9, heroes cropped 2x, v4.2 vs v4.3.
- Re-render: `node render.js --show main --from 77.5 --to 87.2 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 out/review/v43/walk/turn_walk_v43.mp4 --audio --workers 1`

## Backups
engine/out/bak_v43/walk/{turn.js.orig, track.js.orig, index.js.orig} are the pre-edit copies (index.js was not changed). To restore,
copy them back.

## Open
- The heroes run with their backs to the camera for the first ~0.5 s of the fly shot (82.31-82.8). That was the old pose too, before faceCam ramped in.
- Ricky's chord dips touch the walk band (1.85 m/s) briefly. It reads as easing off to strum.
- 81.6-82.3: the three bunch together right after the landing, seen far away in the camera whip (same as v4.2).
