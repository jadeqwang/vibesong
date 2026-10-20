# v4.6 · unit v46_outro · outro spread v45r2: real 1080 upscale + Jade lip lag — STARTED 2026-10-19 (afternoon)
Owns: spread.js v45r2 LIVES entry only (rt.lag, seq/tex names); NEW tools/cutscenes/pb_spread46_*.py; media/act5/_work/v46/;
new media/act5/frames/spreadR_v46r2/ + media/act5/tex/spread_{full,half}_spreadR_v46r2.jpg. Cap $10.
Backups: engine/out/bak_v46/v46_outro/spread.js.start (spread.js at start: LIVE = LIVES.v45r2, rt.lag 0).
Review out: engine/out/review/v46/v46_outro/.

## Log
- start: disk 4.1 GB free, GPU 11/24 GB used. Source = media/act5/_work/v45/hyb_br1.mp4 (1280x720 24 fps, 8.7 MB).
  Upscale precedent: flux-video-upscale precise (creativity 0) used on all paper cards (passB_paper.md M2: crisper lines, sync kept,
  canon details kept; $0.07/MP-s logged by hand as cost_note). Plan: same route on hyb_br1.
- Submitted (relay queue) flux-video-upscale precise, creativity 0, input media/act5/_work/v46/hyb_br1_crf14.mp4 (hyb_br1 re-encoded
  crf14 veryslow, 4.7 MB, PSNR 49.8 dB vs source; the 8.7 MB original would be an 11.3 MB body, Seedance failed at 9 MB in v45):
  vibesong/v46_outro_up15-99e77d86a1 (1.5x -> 1920x1080, est $1.32) and vibesong/v46_outro_up20-ab78fbca00 (2x -> 2560x1440, est $2.34).
  Collect: `~/Documents/1-music-shipped/moongazing/.venv/bin/python tools/gen/gen.py wait <id>`. Cost notes in genlog. Spend committed ~$3.66.
- LAG (before, source hyb_br1 = what spreadR_v45r2 plays at lag 0). NEW tools/cutscenes/pb_spread46_lag.py (OSPY): per-frame mouth gap on a
  3x face crop + stem dB + mouth contact sheet -> media/act5/_work/v46/lag_src.{curve.json,sheet.jpg}.
  Envelope correlation (pb_sync.py / windowed): weak (r 0.17-0.47), peak at lag -0.14 -> NOT trusted (legato line; Jade in profile with a
  closed mouth through "That's" 191.84-193.2, so no envelope match exists there).
  Word events (picture frame at lag 0 vs stem, 5-10 ms stem resolution):
    "blossoms" b release: stem burst 191.25, lips open on frame 191.258 (closed 191.008-191.217)  -> +0.01 (picture late)
    "I" onset: stem 187.50, mouth opens 187.508 -> +0.01;  "blossoms" m: stem dip 191.84, lips shut 191.842 -> 0.00
    "about" ou: stem vowel 188.33-188.35, rounded lips 188.383 -> +0.04;  "Everything" v: dip 186.86-186.94, narrowing 186.967 -> +0.03..0.08
  => picture is 0 to +0.04 s late (median ~+0.01) = under one 30 fps frame. Rule says set lag only if >= 1 frame -> rt.lag stays 0
  (pending the "after" measurement on the upscaled frames / render).
- 15:13 upscales collected (both 217 frames 24 fps; frame-aligned: Jade mouth-curve corr 0.992 at shift 0 vs ~0.89 at +-1, pb_upalign.py).
  Conformed (pb_spread44_frames -> pb_spread44_match): spreadR_v46u15 (1.5x) and spreadR_v46u20 (2x, ffmpeg lanczos 2560x1440 -> 1920x1080).
  A/B sheets (NEW tools/cutscenes/pb_spread46_ab.py) media/act5/_work/v46/ab_*.jpg: both upscales clearly crisper than lanczos, identities kept;
  1.5x draws heavier/darker outlines (more "inked"), 2x->1080 is cleaner and closer to the pencil look -> CHOSEN = 2x (u20).
  Installed as media/act5/frames/spreadR_v46r2 (renamed from spreadR_v46u20) + tex spread_{full,half}_spreadR_v46r2.jpg (pb_spread44_tex.py lag 0).
- Seam finding: the hybrid's cut beside Jade's shoulder (720p x~797, rows ~250-340; = 1080 render ~x1165,y380-470) chops the re-run's hill tip
  and Ricky's shirt edge with a vertical line, ~186.8-188.6 (k 15-70). PRE-EXISTING in v45r2 (soft under lanczos, crisper after upscale).
  Tried NEW tools/cutscenes/pb_spread46_skyseam.py (one-sided 24 px ramp right of the seam, rows 215-310, as a delta for the upscaled
  frames): only a marginal softening, the vertical edge stays -> NOT applied. Proper fix = move the cut onto take B's shoulder outline in
  rows 250-340 (hybrid geometry), out of this unit's scope.
- 15:30 spread.js:75-77 v45r2 entry -> seq/tex 'spreadR_v46r2' (+2 comment lines); rt.lag 0 kept. node --check OK. LIVE line and
  END_STRUM_V46 byte-identical to the start backup.
  1080 stills engine/out/review/v46/v46_outro/stills/{before_lanczos,after_upscale}_<t>.png (186.70 187.10 189.633 191.30 193.00 [+195.00 after]);
  render-level A/B ab_render_faces{,_2}.jpg (2x crops, Jade/Charlie/Ricky/seam).
  LAG after (upscaled clip, lag_up20.*): identical events (b 191.258, m 191.842, I 187.508, about 188.383); envelope peak -0.15 (same, untrusted).
  Cleaned: spreadR_v46u15 frames, crf16 test, sky/hill debug + deltas.
  RUNNING: 540p clip 184-196 with audio -> engine/out/review/v46/v46_outro/outro_v46r2_upscale_184-196.mp4.
- 15:35 540p clip done: engine/out/review/v46/v46_outro/outro_v46r2_upscale_184-196.mp4 (12 s, audio, 0 errors). In-render sync check
  (1080 stills 191.200-191.333, sync_render_blossoms_b.jpg): lips closed at 191.233, open at 191.267; stem "b" burst 191.25 -> <= 17 ms. lag 0 confirmed.

## FINAL STATE (safe point; nothing running; nothing in flight)
- spread.js :75-77 v45r2 -> seq/tex spreadR_v46r2, rt.lag 0 (unchanged). LIVE = LIVES.v45r2 and END_STRUM_V46 untouched. node --check OK.
  Backup engine/out/bak_v46/v46_outro/spread.js.start. To revert to lanczos: set seq/tex back to 'spreadR_v45r2' (still on disk).
- NEW: media/act5/frames/spreadR_v46r2/{1080,540} (271 frames), media/act5/tex/spread_{full,half}_spreadR_v46r2.jpg,
  media/gen/v46_outro_up15_99e77d86a1.mp4 (A/B only), media/gen/v46_outro_up20_ab78fbca00.mp4 (source of v46r2), media/act5/_work/v46/*
  (crf14 upload input, lag curves/sheets, A/B sheets), tools/cutscenes/pb_spread46_{lag,ab,skyseam}.py (skyseam = tried, not used).
- Spend: $1.31 (1.5x) + $2.33 (2x) = $3.64 of $10 (cost_notes in genlog; results logged by gen.py).
- Open: the pre-existing hill/shirt vertical chop beside Jade's shoulder (~186.8-188.6) needs a hybrid-geometry fix if Jade notices it.

## Round 2 (coordinator 15:45): proper shoulder-seam fix, cap still $10 ($6.36 left)
- NEW tools/cutscenes/pb_spread46_hybrid.py (OSPY; v4.5 steps 1-4 copied verbatim, then a shoulder pass on rows ~236-402, x 660-900):
  Jade's outline neck->shoulder->upper arm found per frame in BOTH clips by a polar DP on the darkest pencil line (centre 650,330,
  -62..22 deg, temporal prior); shoulder top refined to the OUTER line (DP can sit on the stripe's inner line); rows >= 300 clamped
  to the v4.5 tracked sleeve lines. Cut = take B's outline per row; the re-run's background is slid LEFT per row by (re-run Jade edge
  - take B edge + 3, max +-5 rows, smoothed over rows), decaying over 80 px, so the hill/sea/Ricky's shirt drawn next to the re-run's
  Jade land next to take B's Jade (Jade herself is never warped); re-run never used left of x~738 (its chin/hair); row ramps in/out.
  Tried and dropped on the way: inpainting the gap (smeared), polar stretch of take B's band (tore the patch, stretched headphones).
  Output media/act5/_work/v46/hyb_br1b.mp4 (hyb_br1 untouched). Outside the box = encode noise only (0.2 % px > 6 levels).
  720p audit: all 217 frames sampled every 3rd (73) + 2.5x zooms (k 12-216): no vertical cut in the sky/hill/shirt anywhere; worst
  window 186.8-188.6 clean. Residual: shoulder-top stripe outline slightly flatter at its right end on a few frames (~180-192).
- Upscale submitted 16:15: vibesong/v46_outro_up20b-f7ca907bea (2x precise, creativity 0, input hyb_br1b_crf14.mp4 PSNR 49.8), est $2.33
  (cost_note in genlog). Spend total $5.97 of $10.
  Next: collect, upalign check, conform -> spreadR_v46r2b + tex, point v45r2 entry, 1080 stills 187.10 / 188.0 / sleeve 186.5-187.5,
  canon + lag check, then delete spreadR_v46r2 frames + media/gen/v46_outro_up15_*.mp4.
- 16:20 upscale collected media/gen/v46_outro_up20b_f7ca907bea.mp4 (217 frames; upalign corr 0.991 at shift 0 vs ~0.89 at +-1).
  Conformed -> media/act5/frames/spreadR_v46r2b/{1080,540} + media/act5/tex/spread_{full,half}_spreadR_v46r2b.jpg (lag 0).
  spread.js:75-78 v45r2 entry -> seq/tex 'spreadR_v46r2b' (comment updated). LIVE / END_STRUM_V46 unchanged. node --check OK.
  Backup before this edit: engine/out/bak_v46/v46_outro/spread.js.r2a.
  Verify (engine/out/review/v46/v46_outro/): ab_seamfix_187.10.jpg (lanczos | upscale old seam | seam fixed), seamfix_sway_186.5-188.0.jpg
  (1080 crops 186.9/187.3/187.5/188.0; the spread is not on screen yet at 186.5/186.7), ab_render_faces_r2b{,_2}.jpg (canon),
  outro_v46r2b_184-196.mp4 (540p, audio). Stills stills/r2b_*.png. Mouth events on the new upscale: same frames as before (lag 0 holds).
  Deleted: spreadR_v46r2 frames + tex, media/gen/v46_outro_up15_*.mp4, hyb_br1_crf14.mp4, debug dirs, old 540 clip. Kept spreadR_v45r2.

## FINAL STATE (round 2; safe point; nothing running or in flight)
- Live: LIVE = LIVES.v45r2 -> spreadR_v46r2b (seam-fixed hybrid, flux 2x -> 1080), rt.lag 0. Fallback: seq/tex 'spreadR_v45r2' (v4.5 lanczos).
- Spend: $1.31 (1.5x A/B) + $2.33 (2x, superseded) + $2.33 (2x seam-fixed) = $5.97 of $10.
- Tools: pb_spread46_{lag,ab,hybrid,skyseam}.py (skyseam = round-1 attempt, unused).
- Still on disk and superseded (mine, ask before deleting): media/gen/v46_outro_up20_ab78fbca00.mp4 (23 MB, source of the old v46r2).
