# Team D checkpoint (ACT V + OUTRO, 173.02 -> ~207)

Updated: v3 DONE (engine/out/review/act5_v3.mp4). Previous: milestone 6 — Act V v2 review rendered (engine/out/review/act5_v2.mp4 + sheet). All scenes in; all clips in.

## Done
- `engine/src/scenes/act5/world5.js`: own voxel builder (Team B world not available): 4 glyphs 一笔一画 (MMAH, bolded 1.6 cells,
  rainbow pencil-hatched tops by global stroke order), terraced terrain + fields, water, cypresses, ruins, clouds, tiny voxel heroes,
  `makePencil()` (canon rainbow core / blue cap), `look5()` post look.
- `engine/src/scenes/act5/drop2.js`: 173.02-176.6: pencil-tip close-up, freeze in silence, rocket up at 174.395 (log altitude + radial
  blur), subdivision wave shader (quadtree 64->8 px, stroke-order field from an order-map render) compositing a FrameSeq `resolve`.
  AERIAL_CAM = pos (0,1850,240) target (0,0,-10) fov 35. Bloom disabled in aerial (NaN blocks).
- `engine/src/scenes/act5/frames.js`: FrameSeq (JPEG frame seqs at media/act5/frames/<name>/<540|1080>/f_00000.jpg + index.json {n,fps}).
- Symlink `engine/src/scenes/act5/media -> ../../../../media/act5` (served by render.js static server).
- `engine/src/show/main.js`: act5 entry `act5.drop2` [173.02, 176.6).
- Generated: `media/act5/gen/spread_v1.png` (NBP 4K spread) — ACCEPTED (left page needs desaturating in prep: orange headphones tint).
- Engine aerial frame `media/act5/stills/aerial_engine.png` (t=175.5, 1920x1080). Photoreal takes photo_v1.png / photo_v2.jpg;
  CHOSEN v2 -> `media/act5/stills/aerial_photo.{png,jpg}` (resized 1920x1080). Glyph overlay check vs projected MMAH outlines
  (`_work/glyphmask.py`, `_work/ovl.py` -> `_work/ov_photo_v2.jpg`): all 20 strokes on the outlines.

## Tools
- PY=~/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python (jsonschema + cv2)
- `media/act5/_work/img.py TAG OUT PROMPT_FILE [refs] --size=2K|4K` (NBP; tag prefixed act5_), `media/act5/_work/spend.py` (act5 spend).
- Video: tools/gen/gen.py spec/submit/wait (PREFIX vibesong/), specs in media/gen/specs/act5_*.json.

## Video jobs (collect with the MOONGAZING venv, it has PyAV: ~/Documents/1-music-shipped/moongazing/.venv/bin/python tools/gen/gen.py wait <id>)
- DONE act5_resolve-d3047b1d97 -> media/gen/act5_resolve_d3047b1d97.mp4, conformed to media/act5/frames/resolve (97 f @24, registration <0.4 px, scale 1.008)
- DONE act5_sweep_t1-4129582b51 -> media/gen/act5_sweep_t1_4129582b51.mp4 (moves forward/up and tilts toward horizon after ~4 s; fallback)
- ERROR (server, not billed) act5_sweep_t2 / t3
- ERROR (server, not billed) act5_sweep_t4 / t5 (relay). Trying a SYNC call instead: media/act5/_work/vsync.py SPEC OUT
  (log media/act5/_work/log_t4s.txt -> media/gen/act5_sweep_t4s.mp4).
- DONE (sync) act5_sweep_t4s -> media/gen/act5_sweep_t4s.mp4: CHOSEN (clean rightward pan, no tilt, rigid). Conformed 30 fps
  (minterpolate) -> media/act5/frames/sweep (179 f). Key frames: stills/sweep_fix_f108.jpg (180.21), stills/sweep_dive_f112.jpg (183.87).
- DONE act5_dive_t1s (Veo dive, $0.60): REJECTED (the red 一 morphs into a vertical stroke at ~1.5 s, tilts to horizon).
- DONE NBP pencil redraws pencil_v1/v2: CHOSEN v2 -> media/act5/stills/fixtures_pencil.jpg (edge overlay with the clip frame: on the lines).
- DONE NBP dive last frame (close-up of the red 一) -> media/act5/stills/dive_last.jpg
- DONE (sync) Seedance 2.0 first+last dive ($1.48), spec media/gen/specs/act5_dive_sd.json -> media/gen/act5_dive_sd.mp4. Next: review,
  CHOSEN; conformed (12 duplicate frames dropped, then minterpolate 30 fps) -> media/act5/frames/dive (119 f).
- Core requests R-D1..R-D4 all DONE by Team A: /media/ mount used now (symlink removed), bloom re-enabled.
## Spend so far (older line, see spend.py): images $0.51 + video billed $2.28 (resolve 1.48, sweep t1 0.80) + in flight $1.20 = ~$4.0 (budget $25)

## Also done
- `engine/src/scenes/act5/paperkit.js` (handwriting, PencilHanzi, flower, stamp, pencil sprite, InkQuad reveal) and
  `engine/src/scenes/act5/spread.js` (entries act5.outro 186.70-194.06 and act5.last 198.035-207.2, registered in main.js).
- Spread textures: media/act5/tex/spread_full.jpg / spread_half.jpg (left page re-tinted to pure graphite).
- `media/act5/_work/conform.py CLIP NAME [--fps30] [--ss --t]` -> frame seqs; `_work/reg.py A B` registration check.

## Measured cues (engine/data/cues.json "act5"): stops are ~0.4 s EARLIER than timing.json: stop1 180.20-180.70,
  stop2 183.30-183.86 (FUNCTIONS accent 183.30), silence 173.19-173.58, drum pickups 174.015/174.22, impact 174.40 (ok),
  outro vocal 186.65, song end ~201.1. drop2.js / aerial.js / spread.js re-keyed to these.
- drop2 stamps 一笔一画 via Team C's Overlay (act4/overlay.js stampChars, slots y .62 size .22 gap .08) + translation subtitle.
- title.js (194.06-198.035 pixel SAVE COMPLETE), aerial.js (176.6-187.0) registered.

## Spend: $5.87 list (images $0.91: spread, 2 photo, 2 pencil, dive_last; video $4.96: seedance resolve 1.48 + dive 1.48,
  veo sweep t1 0.80 + t4s 0.60 + dive_t1s 0.60 (rejected)). Veo relay jobs t2-t5 errored server-side (not billed); the SYNC path works.

## Remaining / next steps
1. MODELS line in spread.js (`MODELS`) must be filled at picture lock from the final cut (currently Veo 3.1, Seedance 2.0, Nano Banana Pro, GPT Image 2.5).
2. Weak spots: the stroke-wipe transition edge at 186.65 (core 'stroke' wipe, black stair edge); rocket-up mid-climb (174.6-174.9) reads as
   flat green; the paper outro is a still illustration with camera moves only (no character animation); title-screen hat flip is the
   generic 'pull' strip; credits-model line placement top-left is small at phone size.
3. Optional: Veo 3.1 silent PAPER animation of the right page (breathing/strumming) for 186.65-191.3.

## v3 pass (coordinator list, budget <= $12 more)
1. [in progress] CHOSEN photo_v3 -> media/act5/stills/aerial_photo2.{png,jpg} (overlay _work/ov_v34.jpg: glyphs on the outlines).
   DONE sync: media/gen/act5_resolve2.mp4 ($1.48), act5_sweep2_a.mp4, act5_sweep2_b.mp4 ($0.60 each). CHOSEN sweep2_a (push-in, rigid; b swoops/tilts). Conformed: frames/resolve2 (reg <2 px), frames/sweep (old -> frames/sweep_v1).
   DONE NBP: pencil_v4 CHOSEN -> stills/fixtures_pencil.jpg (old v2 overwritten; gen/pencil_v2.png kept); dive_last2 -> stills/dive_last2.jpg.
   DONE Seedance dive2 ($1.48, no dup frames) -> conformed frames/dive (old -> frames/dive_v1). spreadR/F conformed + wired into spread.js.
   (old) RUNNING sync: Seedance dive2 spec media/gen/specs/act5_dive2_sd.json -> media/gen/act5_dive2_sd.mp4 (log _work/log_act5_dive2_sd.txt)
   (old) pencil_v3/v4 (from stills/sweep2_fix_f108.jpg), dive_last2 (close-up). Then Seedance dive2 (first stills/sweep2_dive_f112.jpg).
   DONE: act5_spreadR / act5_spreadF (registered <2 px to stills/spread_right_crop.jpg / spread_full_169.jpg; rects in the .txt next to them);
   conforming (trim 0.5 s ease-in, 30 fps) -> frames/spreadR, frames/spreadF. (old line) act5_spreadR / act5_spreadF (veo fast 8s, $0.80 each; specs media/gen/specs/) -> media/gen/<tag>.mp4, logs _work/log_<tag>.txt
   Item 2 done in code: soft in-scene rainbow wipe at 186.65 (spread.js), clouds + FOV in the climb (drop2.js), hat-pull + CLACK (title.js). Item 4 done.
   (old) new photoreal base (no voxel look): NBP takes photo_v3/photo_v4 (prompt _work/p_photo3.txt, refs aerial_engine + k13) -> then
   overlay check, Seedance resolve (spec act5_resolve2), Veo sweep (sync, act5_sweep2_*), pencil redraw from new sweep frame, re-pick dive.
2. wipe edge at 186.65, clouds in the climb, charlie_hat_pull + code cartridge clack.  3. Veo silent spread animation.  4. MODELS font bigger.

## v3 status: ALL 4 ITEMS DONE. Review: engine/out/review/act5_v3.mp4 (+ _sheet.jpg). v3 spend $6.43 (photo v3/v4 0.27, resolve2 1.48,
sweep2 a/b 1.20, spreadR/F 1.60, pencil v3/v4 0.27, dive_last2 0.13, dive2 1.48). Act V total ~$12.30 list.

## v4 (coordinator full-cut notes, budget <= $10)
1. DONE left_v2 chosen (aligned 0 px at the page edges) -> gen/spread_v2.png (right page pixel-identical, asserted) -> tex/spread_full/half.jpg
   (v1 kept as tex/*_v1.jpg). DONE spreadF2 ($0.80; registered 0.1 px; right-page breath artefact hidden under spreadR) -> frames/spreadF (old -> spreadF_v1). (old) RUNNING sync: spreadF2 Veo (spec media/gen/specs/act5_spreadF2.json -> media/gen/act5_spreadF2.mp4, log _work/log_act5_spreadF2.txt)
   (old) left page = Charlie alone (NBP edit 1:1 4K of media/act5/_work/refs/left_sq.jpg -> gen/left_v1/v2.png, logs _work/log_left_v*.txt);
   composite back into tex/spread_full.jpg + spread_half.jpg (left page only, feathered at the gutter); spreadF clip then needs a redo for the left page.
2. right-page bun checked at full res (still + spreadR frames): X through the bun, pink-orange + blue caps, yellow bodies -> OK, no edit.
3. DONE in code: clouds -> defined puffs (fade out by 175.32) passing beside; sweep -> engine view transform (pan in stroke order 175.5-180.21).  4. DONE: title 画 completes on beat 194.955.

## v4 DONE: engine/out/review/act5_v4.mp4 (+ _sheet.jpg). Left page = Charlie alone (gen/spread_v2.png), bun checked OK (no edit),
clouds = defined puffs beside the climb, sweep = engine viewXform pan in stroke order (aerial.js, shared by drop2 + outro wipe),
title 画 lands on 194.955, credit wrap keeps model names whole. v4 spend $1.28 (left_v1/v2 0.48, spreadF2 0.80). Act V total ~$13.6.

## v5 (tear fix): the spread->SAVE (194.06) and SAVE->last (198.035) hand-offs are now torn-paper (src/scenes/act5/tear.js entries
act5.tear_title / act5.tear_last registered AFTER the entries they cover; title/last transitions set to cut). Slice check:
engine/out/review/act5_v5_slice.mp4 (190-198.5). Core request R-D5 (native 'tear' transition) filed, optional. $0 spent.

## v6 credits: audit in docs/credits_models.md. MODELS (spread.js) = 'Veo 3.1, GPT Image 2.5, Nano Banana Pro, Seedance 2.0 and Seedance 2.5'
(Veo first, then screen time; Seedance 2.5 = Jade's singing card 125.769). Explicit 4-line layout, checked at 540p/1080p.
Slice: engine/out/review/act5_v6_last.mp4 (198-207).
