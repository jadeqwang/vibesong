# v4.7 · unit v47_outro · 3:08 outro spread: fix the jacket (patch, epaulettes, hem/cuffs) keeping the performance — STARTED 2026-10-19 evening
Owns: media/act5/** (new set spreadR_v47*), act5/spread.js LIVES table + LIVE line, tools/cutscenes/pb_spread47*.py. Cap $12.
Backups: engine/out/bak_v47/v47_outro/spread.js.start (LIVE = LIVES.v45r2 -> spreadR_v46r2b, rt.lag 0).
Review out: engine/out/review/v47/v47_outro/.

## Log
- start: disk 4.0 GB free, GPU 11/24 GB used. Source = media/act5/frames/spreadR_v46r2b/{1080,540} (272 frames) + tex spread_{full,half}_spreadR_v46r2b.jpg.
- Approach (no gen, $0 so far): NEW tools/cutscenes/pb_spread47_jacket.py (OSPY = ~/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python)
  on the 1080 frames of spreadR_v46r2b, keyframe 20:
  (c) recolor: strict orange mask (s threshold rising with v so skin never counts) in 8 keyframe boxes (shoulder strips L/R, pocket
      slashes L/R, hem L/R, cuffs L/R; largest component per box) -> labels warped per frame by DIS flow k->K; Lab: chroma -> nearby
      jacket white, L additive (keeps ribbing/grain); dark outline px (v<115) never touched. Chest band + both arm bands untouched.
  (a) label erased in keyframe space (Telea inpaint + the arm's right outline re-copied from 30 rows above), round patch from
      inputs/sleeve_patch_1420MHz.png (4x supersampled, rx18 ry23, tilt -12, centre (1148,535) ON the band), carried by ECC euclidean
      track of the arm, gain-matched.
  (b) shoulder strips -> white straps (recolor) + a pencil-rimmed metal snap at each strap's collar end (ECC track per shoulder),
      drawn only on jacket-white px (headphone cups occlude).
  Test set media/act5/frames/spreadR_v47t (scratch; delete when spreadR_v47 is final).
- (later) patch now follows the LABEL (template match per frame, x-scale 0.80-1.07, median 7 + Gaussian), rotation from the arm's
  flow-RANSAC track; erase = keyframe Telea warped + per-frame Telea of the gap up to the arm outline, which is measured per frame
  on the clean rows above/below the label (line fit) and kept as drawn; patch clipped at the outline (wraps round the arm).
  Shoulder/arm tracks = DIS flow + RANSAC similarity per part (median 5 + Gaussian), cached media/act5/_work/v47/tracks_spreadR_v46r2b.npz.
- INSTALLED frames: media/act5/frames/spreadR_v47/{1080,540} (271 frames; outside Jade's jacket only JPEG re-encode noise: mean 0.25
  levels, 0.03 % px > 6). Tex: .venv/bin/python tools/cutscenes/pb_spread44_tex.py spreadR_v47 0 -> media/act5/tex/spread_{full,half}_spreadR_v47.jpg.
- STILL LAYER CHECK: the spread still (tex, frame 258) inherits the fix. The END page media/act5/tex/page11*.jpg (on screen 195.4-203)
  had the same errors (blue gibberish disc patch, orange shoulder strips; hem/cuffs already white). NEW tools/cutscenes/pb_spread47_page11.py
  -> page11.jpg / page11_half.jpg fixed (originals kept: page11_v46.jpg, page11_half_v46.jpg): strips white + snaps, patch = BLANK
  round b/w (19 px wide: text would read as gibberish), centred on the band, arm outline kept.
- spread.js: NEW LIVES.v47 (seq/tex 'spreadR_v47', rt lag 0, same close/cy/feather as v45r2) + LIVE = LIVES.v47 (v45r2 line kept as
  a comment = fallback). node --check OK. Backup engine/out/bak_v47/v47_outro/spread.js.start.
- Review (engine/out/review/v47/v47_outro/): outro_v47_186-196.mp4 (540p, audio; rendered 184.5-196, trimmed), stills still_*.png
  (+ still_197.8_endpage.png), ab/ = before/after crops per time 187.00/188.40/190.00/191.30/193.00: jacket 1.5x, patch 4x,
  shoulders 3x, hem 2x, cuffs 2x; ab_endpage11_jacket_3x.jpg. NEW tools/cutscenes/pb_spread47_ab.py builds them.

## FINAL STATE (safe point; nothing running; nothing in flight)
- Live: LIVE = LIVES.v47 -> spreadR_v47 frames + spread_{full,half}_spreadR_v47.jpg; end page page11*.jpg fixed in place.
- Revert: spread.js LIVE back to LIVES.v45r2 (spreadR_v46r2b untouched on disk); page11: copy page11_v46.jpg / page11_half_v46.jpg back.
- Spend $0 (no generations; nothing to log in genlog).
- Rebuild: $OSPY tools/cutscenes/pb_spread47_jacket.py spreadR_v46r2b spreadR_v47 (tracks cached; --retrack to redo), then
  .venv/bin/python tools/cutscenes/pb_spread44_tex.py spreadR_v47 0; $OSPY tools/cutscenes/pb_spread47_page11.py (reads page11_v46.jpg).
- Known residuals (2-4x only): patch is a clean code-drawn disc (crisper than the pencil around it); where the drawn label had
  drifted right, the patch is clipped at the arm's outline (reads as wrapping round the arm); a small orange/grey smudge can show at
  the patch's top-right corner on some frames; epaulettes = the old strip footprint now white (stitch line kept) + a small snap near
  the collar end, which goes behind the headphone cups when her head turns; end page: outline slightly thicker beside the blank patch.
- Not touched: chest dot on the end page is a concentric pale-blue disc (not in Jade's note).
