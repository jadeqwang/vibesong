# Round 5 build: shared brief for every unit (2026-10-17)

Read first, in this order: **docs/game_design_half2_r5.md** (the design; your unit's beats and cost tags), docs/round4_build_brief.md
(the rules below repeat the important ones), your own unit's checkpoint from round 4 (engine/checkpoints/talos_r4.md, battle_scene.md +
battle_ui.md, act4_ship.md, world_look.md + look.md) which documents the code you are inheriting, the motion API in
engine/checkpoints/motion_r2.md (look-at, springs, lip sync, arm IK, beat-locking, `onJoint`/place-hand helpers) and models_r6.md (rig,
face states), and the character canon at ~/.claude/projects/-home-jade-Documents-vibesong/memory/jade-character-rules.md.

## Rules for all units
- Scope: the second half only (86.385–207.2). Never change pixels in half 1 (0–86.4) or the turn (77.76–86.4).
- **Default renders of approved cuts must stay byte-identical** until the coordinator flips a default. Put all new behaviour behind
  the flag `--r5` (render.js) / `?r5=1` (dev page); read it through one shared helper so every unit checks the same switch
  (`R5()` in src/scenes/act3/common.js; the talos_r5 unit adds it first, others import it; if it isn't there yet, add the same
  two-line helper and the coordinator will dedupe). Review renders: `--fig native --figscale 1.3 --figres 2.5 --look k08b --r5`.
- Own only the files your brief lists. Requests for another unit's files go in your checkpoint under "REQUESTS"; work around them.
- Edit shared files atomically: copy, edit the copy, `node --check`, then mv over the original. Back up every src file you touch
  first to engine/out/bak_r5/<unit>/ (once, before the first edit).
- Every render: `export TMPDIR=$PWD/out/dev/tmp` (from engine/). /tmp is a tmpfs. Disk has ~27 GB free: 540p mp4s and jpg sheets only,
  delete your scratch frames when done. Make sure out/dev/talos_dump.json does NOT exist before a render.
- **The GPU is shared with another project's render and with the other units: `--workers 1`, short ranges, stills where stills
  suffice.** Stills: `node render.js --show main --stills <t>:<file>.png,... --res 1920x1080 <flags>`.
- ffmpeg: ../.venv/lib/python3*/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2.
- Determinism: every frame is a pure function of t (springs re-simulate a fixed look-back at fixed dt). No Math.random without a
  seeded, t-independent source.
- Canon audit on every hero frame you show (crop Jade 2–4×): pencils/caps (both caps up in the bun), hair rule, jacket (one-line
  RARE EARTH on the back, letters always on), sleeve band + patch on the band, baggy navy cargo pants with orange straps, white chunky
  sneakers, headphones around the neck, black crop top with a bare midriff strip.
- Budget: code only. No paid generation.
- Keep your checkpoint (engine/checkpoints/<unit>.md) current: plan, milestones, done/not done, flags, files, review outputs,
  REQUESTS, honest open problems. **Stop at each milestone gate in your brief and report back** (your final message is the report):
  the coordinator reviews your sheets before Jade sees anything.
- Gate order for every unit: (M1) stills of your signature frames (design doc table) side by side with the keyframe they reference,
  as one jpg sheet, at 1080p with the review flags, plus a short written self-review against the three rules and the look rules in the
  design doc; stop and report. (M2) after the coordinator's notes: a 540p mp4 of your whole range with audio; stop and report.
- Beat-timing check: motion warnings and any landing/contact that is off its beat by more than 0.1 s go in your checkpoint.

## Units
| Unit | Range | Owns | Checkpoint |
|---|---|---|---|
| talos_r5 | 86.385–107.13 | src/scenes/act3/drop.js, verse2.js, prebattle_props.js, talos_plan.js (+ R5() in common.js) | checkpoints/talos_r5.md |
| battle_r5 | 107.15–123.354 | src/scenes/act3/battle.js, battle_cast.js, battle_fx.js, stage.js, rap.js; src/show/battle_ui.js | checkpoints/battle_r5.md |
| act4_r5 | 123.354–173.02 | src/scenes/act4/*, BAR2 block of src/show/build_bar.js | checkpoints/act4_r5.md |
| look_r5 | render-side look for 86.385–173.02 | src/look.js, src/post.js, src/env.js, src/scenes/act3/world/* (column density / clutter only) | checkpoints/look_r5.md |

Interfaces:
- look_r5 → scenes: a `LOOK_R5` preset (behind --r5) that scenes get for free; per-shot overrides (DOF distance/strength, key elevation,
  two-color grade target) exposed as a documented function the scene units can call from their camera code. Document it in look_r5.md
  under "API" within your first hour so scene units can use it; until then scene units stage with the k08b look.
- battle_r5 ↔ act4_r5: the 123.354 hand-over (camera, fov, UI state) must match on both sides; battle_r5 owns the final frame,
  act4_r5 reads it. battle_ui.js belongs to battle_r5, including the final-boss window at 143.48–149.22. act4_r5 stages the scene
  (the world text field between Jade and the Eraser, cameras, the finisher) and files a REQUEST in its checkpoint with the exact
  text and timings it needs from the 2D window (empty-cursor hold 143.48–147.0, `> you` typed on 147.36, ENTER, the join line at
  149.22, party window collapsed); battle_r5 implements that request. Both units agree through checkpoints.
- Shared creatures API (src/core/creatures) is read-only for everyone this round; if a creature needs a new behaviour (firefly
  blink-off-beat, beetle circling, ladybug hop, caterpillar spill), implement it in your scene file as a driver of the existing API and
  note it under REQUESTS so it can be promoted later.
