# v44_open: Jade's v4.3 notes (0:06 grey hat in pixel cold open; "Charlie's hat: still see grey" whole-video sweep; 0:08 Jade save-screen sprite face)

Brief: docs/v44_brief.md. Old checkpoints: passB_open_close.md, v43_hat.md.
Backups: engine/out/bak_v44/v44_open/. Review clips: engine/out/review/v44/v44_open/. Gen spend: $0.

## Log
- 10:20 started; read brief/RESUME/v43_hat. Next: find cause of 0:06 grey hat (cold_open.js / paint_run_ship.js), sweep full_v4.3.mp4.
- ~10:24 NOTE 1 (0:06) DONE. Cause: paint_run_ship.js SHIP shot draws the thrown hat as a separate `Quad` (charlie_hat_boomerang) that was not
  tagged `userData.cs`, so the pre-flood graphite grade (colorscript sat2d 0.06, 0-119 s) greyed it; Charlie's Actor is auto-exempt so his cap stayed brown.
  Fix: src/scenes/act1/paint_run_ship.js:66 `hat.userData.cs = 1;`. node --check OK. Backup out/bak_v44/v44_open/src/paint_run_ship.js.
  Verified still: out/review/v44/v44_open/stills/after_5.95.png (hat tan/brown). Hero words PAINT/RUN/SHIP are also graphite (graded UI, design, left as is; flag).
  Backups also taken: out/bak_v44/v44_open/sprites/jade_draw_graphite{,_hi}.png, out/bak_v44/v44_open/save02/* (pre-edit).
- ~10:26 NOTE 2 sweep: 2 fps contact sheets of full_v4.3 viewed (scratchpad); a background agent is doing the 4 fps visual/HSV sweep (read-only).
  Code sweep: every Charlie-hat prop draw in show scenes is tagged now (kaizo hat/trampQ/poseQ/shieldDome v43, chorus cHats/cFx/canopy v43,
  props.js tramp/boomer/hatStack hero v43, paint_run_ship hat v44). 3D cap at 91.5 (drop close-up) reads cream from the key light; skin keeps colour = hero mask works.
- NOTE 3 started: Jade's save-screen sprite = assets/sprites/jade_draw_graphite_hi.png (144x88), placed 5x by assets/v4_stills/tools/passB_oc/build_save02.py:67-73
  -> media/act5/tex/save02/jade.png. Same sprite is the engine's HI draw_graphite (sprites.js:63/79): press_start 11-14 s (Jade tapping), kaizo_poses erase pose.
- ~10:28 NOTE 3 face: new tool assets/v4_stills/tools/v44_open/jade_face.py (pixel patch rows y24-39, x46-64; reads the pristine backup, idempotent)
  -> assets/sprites/jade_draw_graphite_hi.png; then re-ran assets/v4_stills/tools/passB_oc/build_save02.py: only media/act5/tex/save02/jade.png
  (+ work ref02_layers.png) changed (md5 checked). The _hi sprite is otherwise only used by voxel heroes and is held there (sprites.js:79 HI_HOLD),
  so the change shows only on the SAVE screen. 2D scenes (press_start 11-14 s etc.) use the lo-res 72x44 jade_draw_graphite.png (untouched).
- ~10:30 NOTE 3 DONE (variant A = neutral small mouth, IN THE SHOW). Variant B = closed smile: `jade_face.py smile` (not applied; to switch:
  `.venv/bin/python assets/v4_stills/tools/v44_open/jade_face.py smile && .venv/bin/python assets/v4_stills/tools/passB_oc/build_save02.py`).
  Restore v4.3 face: copy out/bak_v44/v44_open/sprites/jade_draw_graphite_hi.png back + re-run build_save02.py (or copy out/bak_v44/v44_open/save02/jade.png).
- Clips (540p, audio, workers 1, 0 errors) in out/review/v44/v44_open/:
  open_4-11.5_before_v43.mp4 (cut from full_v4.3) | open_4-11.5_after.mp4 (hat tan at 5.9-6.4 + new face 6.755-11.02) |
  save_6.5-11.5_variantB_smile.mp4 | before_after.jpg | stills/after_*.png. Render: node render.js --show main --from 4 --to 11.5 --fps 30 --res 960x540
  --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 <out> --audio --workers 1 (~18 s).
- STATE: safe point. No source half-edited; nothing rendering. Waiting on the background 4 fps sweep agent (read-only) for NOTE 2.
- ~10:31 NOTE 2: found battle caps graded (113.1-113.5 cap->firefly lamp pale cream; 115.9-116.8 boomerang cap pale grey). src/scenes/act3/battle_fx.js:44 capMat patchPaint + hero:true (same fix as v43 props.js). Not in any unit's ownership list; flagged. Backup out/bak_v44/v44_open/src/battle_fx.js.
- ~10:32 battle caps verified (HSV median sat of the cap: 116.2 0.30 -> 0.38, 113.5 0.38 -> 0.40; 3D canon cap #d4b47c = 0.42).
  Clips: out/review/v44/v44_open/battle_112.5-119_before_v43.mp4 | battle_112.5-119_after.mp4 (render 45 s). Stills stills/after_11{3.5,6.2,8.45}.png.
- STATE: safe point; nothing rendering. Waiting on the sweep agent.
- ~10:45 4 fps sweep (background agent, 51 sheets + HSV crops; files in the session scratchpad hatsweep/) found no other grey hat.
  Flagged, NOT changed: 116.9-117.3 head cap + dome washed to cream by the BUG->FEATURE white bloom flash (sat 0.21, flash = design);
  107.15-110.41 stage spotlights (scene grade); 123.35-139.4 bridge dusk (scene grade, cap still tan-orange 0.32);
  82.5/85.0 3D boomerang in shade (0.21-0.24, reads brown); 101.0-101.4 3D Charlie close-up has NO cap (pops back 101.5) right after the
  cap-trampoline at 100.8, probably intended (verse2 X.cap2), not a colour issue. The 57-61 grey stacks under Jade are the switch springs, not hats.

## FINAL STATE (unit done, idle, safe)
Changes (all uncommitted):
1. engine/src/scenes/act1/paint_run_ship.js:66  `hat.userData.cs = 1;`  (0:06 thrown hat, grade exemption)
2. engine/src/scenes/act3/battle_fx.js:44  capMat `patchPaint(capMat, { noPaint: true, hero: true })`  (battle caps 113.3 / 115.9-116.8 / 118.4)
3. assets/sprites/jade_draw_graphite_hi.png  face redrawn by NEW assets/v4_stills/tools/v44_open/jade_face.py (variant a)
4. media/act5/tex/save02/jade.png (+ assets/v4_stills/work/passB_oc/ref02_layers.png) rebuilt by build_save02.py
Backups: engine/out/bak_v44/v44_open/{src/paint_run_ship.js, src/battle_fx.js, sprites/, save02/, ref02_layers.png}.
Review: engine/out/review/v44/v44_open/ (open_4-11.5_{before_v43,after}.mp4, save_6.5-11.5_variantB_smile.mp4, battle_112.5-119_{before_v43,after}.mp4, before_after.jpg, stills/).
