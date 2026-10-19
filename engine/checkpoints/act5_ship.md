# ACT V ship (v7: second-half additions) - checkpoint

## NEXT STEP (top, for a cold resume)  [updated 04:20]
v7 DELIVERED, STOPPED for review. Nothing running. Deliverables in out/review/act5/: act5_v7.mp4 (172-189 + 196-207, 960x540,
audio; parts act5_v7_a/_b.mp4), act5_v7_sheet.jpg (172-207, one frame per beat), stills/s_{173.300,174.500,176.000,177.500,179.000,
201.000}.png (1080p), seam_173.02.jpg. Next = whatever the coordinator's notes say (see the gap list at the bottom).
Render tips: `export TMPDIR=$PWD/out/dev/tmp` (/tmp is full); Act IV-time and Act V-time stills in separate calls.

## Done
- Backup: engine/out/bak_act5/act5_2026-10-16_0125/ (all act5/*.js) + out/bak_act5/main.js.bak
- NEW src/scenes/act5/hud5.js: BuildBar2 + buildAt2 from build_bar.js (read-only import); '100% · LOADING' + . .. ... (0.2 s) from 173.19;
  shatter into pixel-grid shards at 174.40 (copy of turn_ui's); '✓ LEVEL LOADED' toast at the top 174.82-175.95.
- NEW src/scenes/act5/route5.js: SMW-style dotted route along 一 (stroke 0) → 笔 (乚 hook) → 一 → 画 (top 一), drawn 174.85-175.35;
  flags + labels CAUSEWAY / CROSSING / STAGE / VANTAGE; the path and flags turn to pixels and vanish as the subdivision wave
  reaches them (same prog field as WAVE_FS); the 9 party dots are COMPOSITED crisp over the photoreal and survive the wave.
- NEW media/act5/_work/track_sweep.py -> media/act5/frames/sweep/track.json (per-frame ORB homography of the sweep clip vs
  resolve2's last frame, 1100-2700 inliers per frame), so aerial.js keeps the dots on the photoreal 一 until they fade out (179.75-180.15).
- drop2.js: imports hud5 + route5; the camera holds still in the silence (173.19-173.58); overlays drawn after the stamps.
- aerial.js: party dots drawn through track.json + viewXform.
- NEW src/scenes/act5/doodles.js + spread.js: margin pencil doodles (firefly lamp in a beige flat-cap shade, bottom-left of the
  left page; the pink Eraser in its beige cap, bottom-right of the right page), drawn stroke by stroke on credit beats 1 and 3
  (1.3 s each); the blinking "firefly" is now the lamp's bulb (body removed from the blink shader).
- FLAG (not edited, approved art): the spread's right page shows Jade with ORANGE HEADPHONES around her neck.

## Gap list (v7)
- 540p: party dots are ~3 px radius and the flag labels are 8 px Press Start; they read at 1080p, small on a phone.
- The map is fully drawn only 175.35 -> wave; the 画 VANTAGE flag is on screen ~1 s before the wave eats it.
- The dots track the sweep (homography, 1100+ inliers) until they fade 179.75-180.15; no dots in the pencil / dive phases.
- Doodles are code drawings (no model): reviewed at 3x, OK, but small (~125 px tall at 1080p).
- Spread right page: Jade wears ORANGE HEADPHONES (approved art, not edited) -> art fix needs Jade's OK + spend.
- The Act IV -> V cut changes ground/pencil by design (Team C's match cut); the speedrun timer drops at 173.02 by Act IV's hud2d design.
