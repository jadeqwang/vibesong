# Team A checkpoint (engine owner + Act I + Act II) — updated 2026-10-14 ~22:30

## Done
- Production engine (README.md, HANDOFF_ACTS.md): src/core/*, src/show/{timing,main,index,subtitles,cast,dev}.js, render.js
  (raw pipe -> ffmpeg, --audio frame-grid slice, --workers, --sheet, --stills), data/cues.json (measured Act I cues).
- Act I v1 delivered: out/review/act1_v1.mp4 + act1_v1_sheet.jpg (scenes in src/scenes/act1/).
- CORE_REQUESTS.md created (process for Teams B/C/D); act blocks in src/show/main.js labelled per team.
- HANDOFF_77.md written + src/scenes/act2/launch_set.js (LAUNCH constants + buildLaunchSet) for Team B.
- Act I fixes applied (not yet rendered as v2):
  1. PRESS START slams (press_start.js: big char per syllable at CEN, flies into top title row y0=112).
  2. 24.22 crumbling bridge set-piece (kaizo.js BRIDGE) + line-7 subtitle hidden after 'life'+0.9 s.
  3. VOID: bubble scale 2 (ui.js Bubble scale), slams clean (flash 1 frame BEFORE), glitches avoid word rows.
  4. PAINT IT room (paint_run_ship.js: only 画 in shot A, zoom 1.4 @ (218,111)).
  5. 笔 staircase: Hanzi2D setDim/setHi (core), cold_open.js dims non-step strokes + landing flashes.

## Milestone 10-15 v4: party stays in frame through the 一切从这里出发 slam (stop at x=112 by 71.8, jump to land on 出 73.057); fixed core Track.path end (fn(1, t1)); LOC_MODE flag ('count'|'zero') in src/show/loc.js. DELIVERED act2_v4 + sheet.
## Milestone 10-15 v3: director notes done: 46-55 s blueprint-answer sequence (typing w/ pencils, reactions, push-in), 70-72 s hops + terraces + chant hero row, LINES OF CODE gag (src/show/loc.js locAt, HUD loc). DELIVERED act1_v3/act2_v3 (+sheets).
## Milestone 23:55: pull-back polished (terraces, zoom 0.45); DELIVERED out/review/act2_v2.mp4 + act2_v2_sheet.jpg. Now: polling CORE_REQUESTS.md ~every 15 min until told to stop.
## Milestone 23:40: R-C1 VideoClip (core/video.js + /clip endpoint) DONE; R-C2 back-view voxels (Actor.voxel back/depth) DONE; ART_REQUESTS A-1 filed. Next: 67-68 s pull-back polish -> act2_v2; then poll CORE_REQUESTS every ~15 min.
## Milestone 23:10: DELIVERED out/review/act1_v2.mp4 + act1_v2_sheet.jpg, act2_v1.mp4 + act2_v1_sheet.jpg (540p, audio). HANDOFF_77.md final.
## Milestone 22:55: Act II fixes applied (ground grid, chunk density/exclusion, clouds, framing, follower pages). Next: render act1_v2 + act2_v1.

## In progress
- Act II scene: src/scenes/act2/chorus.js REGISTERED in main.js (act2.chorus, t0 chorus_downbeat, t1 T.bar(47)); first stills pass done.
  Known issues to fix: white band at launch-set ground (y 28..60 near x>-200); chunks too dense + clutter launch framing (exclude x>-250);
  page clouds visible behind level after FIX (hide); Jade at x -770 too close to left edge in prompt/fixtures shots (move to -750, camera -690 before fixtures).
  Uses act2/art.js, act2/launch_set.js. Measured cues: stop 43.90-44.47, ohs 59.555/59.975/60.425, shout accent 72.125.

## Next steps (after delivery)
- Watch CORE_REQUESTS.md; polish Act II pull-back (67-68 s chunk field is busy); optional: use art-dept hang/pencil-pull strips when they land (sprites.json).
## Old next steps
1. Register in src/show/main.js act2 block (re-read file first, minimal edit):
   { id: 'act2.chorus', t0: T.cue('act1.chorus_downbeat'), t1: T.bar(47), load: () => import('../scenes/act2/chorus.js') }
2. tools/stills.sh out/dev/a2 960x540 41.1 41.45 42.7 43.95 45.0 46.1 49.0 51.5 53 55.9 56.2 57.6 58.5 59.6 60.5 62 64 66 67.5 69 71 72.2 73.1 73.6 75.5 77.7 ; fix issues.
3. Add act2 cues to data/cues.json (act2 block) and use T.cue in chorus.js.
4. Render: node render.js --show main --from 0 --to 41.03 --res 960x540 --mp4 out/review/act1_v2.mp4 --audio --workers 3 (+ --sheet out/review/act1_v2_sheet.jpg --sheet-only)
   and --from 41.028 --to 77.757 ... act2_v1.mp4 + act2_v1_sheet.jpg.
5. Check engine/CORE_REQUESTS.md regularly; implement, mark DONE.
6. Final message <=15 lines.

## Core requests
- R-D1..R-D4 (Team D) DONE: apad audio, /media/ mount, NaN guard before bloom, async prepare(t).
