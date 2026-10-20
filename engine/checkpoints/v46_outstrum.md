# v46_outstrum: 3:14 outro push (194.06-195.40), Charlie strums on the 2011 page (spread left page)

Brief: docs/v46_brief.md (+ docs/v45_brief.md hygiene). Predecessors: v45_scout.md #4, v45_open.md, v45_ricky.md.
Owns: engine/src/scenes/act5/spread.js (outro push / left-page layer only; NOT LIVES/LIVE), new media/act5/tex/*, assets/v4_stills/tools/v46_outstrum/ (+ work/v46_outstrum/).
Backups: engine/out/bak_v46/v46_outstrum/{spread.js.start, cold_open.js.start}. Review: engine/out/review/v46/v46_outstrum/. Spend: $0.13 (cap $5).

## Log
- 13:30 started; read brief/checkpoints/memory; backed up spread.js + cold_open.js. GPU 11 GB used / 24, disk 4.3 GB free.
  Next: compare page01 Charlie vs the spread's left page (PM registration), onsets 193.5-195.5 on other/drums stems.
- 13:40 FINDINGS: (1) the outro left page is a DIFFERENT drawing of Charlie from page01 (spread_v1 art; PM registration aligns the
  pages, not Charlie) -> v45_open's arm01/hole01 cannot be reused; built a new rig from the spread itself. The left page is pixel-identical
  in every live spread tex (v45r1/r2/v44b1; v11 within 2 levels). (2) During the pull-back the Veo "spreadF" layer animates Charlie
  (different, softer drawing) and in v4.5 it crossfades into the still over 194.06-194.9 = on top of the first strokes.
  (3) AUDIO (tools/v46_outstrum/onsets.py; stems are sample-aligned with engine/out/cache/song.wav): drums silent (-76 dB);
  "other" onsets 194.033 (big, flux 4.8), 194.307 / ~194.45-194.50 / 194.706 (soft), then steady 8ths 194.931 195.160 195.375
  195.594 195.829 (flux 1.4-2.6), 196.727 (big). They sit 15-30 ms AHEAD of the grid. The scout's 194.11/194.47/194.83 are NOT confirmed.
- 13:55 NBP gen $0.1344 (tag v46_outstrum_arm_a, tools/v46_outstrum/gen_arm.py, run with ~/Documents/1-music-shipped/moongazing/.venv/bin/python):
  arm_in.png (512 crop of spread_full at 520,1300) -> arm_gen_a.png (guitar without the right arm). ECC vs input outside the arm = identity.
  NEW tools/v46_outstrum/build_strum.py -> media/act5/tex/{hole46.png, arm46m.png (alpha only), strum46.json} (spread px). Footprint
  underside pushed ~6-8 px below the traced outline so the arm's own outline stroke rides along (no ghost line; view_box.png).
- 14:05 spread.js: switch `END_STRUM_V46` (+ END_STRUMS table: elbow/wrist/nod deg, fade window, crossing list X) after PUSH (~:92-112);
  rig set-up after the living layers (~:160); spreadF uOp uses ES.fade when on (~:297); endStrum.apply(t) (~:298); endStrumAt /
  esMesh / endStrumRig appended at the end. LIVES / LIVE untouched. node --check OK. Next: render groove 190-203.
- 14:50 fixes after 1080 stills at 4-8x: (a) inner-elbow crease tear (dark T-shirt px riding along) -> crease anchor `uK` (strum46.json
  arm46.crease [670,1483]; shader w *= smoothstep(6,50,|vF-uK|)); (b) a few px of the guitar's upper-bout outline in the forearm rim
  rode along -> build_strum.py keys gen-reproduced dark px out of the dilated rim along the forearm too (as on the hand). Residual: a 1-2 px
  tick at the crease at 1080 on the stroke peaks (< 1 px at 540p), reads as a drawn junction.
  Lossless stills (stills/): groove vs null at 195.1 / 195.5 (540) and 195.1 (1080): 0 px differ outside the arm/head boxes.

## FINAL STATE (safe; nothing running; switch on 'groove')
Changes (uncommitted):
1. engine/src/scenes/act5/spread.js (LIVES/LIVE block :60-79 byte-identical to the start)
   :92-112 comment + `const END_STRUM_V46 = 'groove'` (:104; 'groove' | 'strum' | null = v4.5) + END_STRUMS {elbow, wrist, nod deg, fade, X crossings}
   :157-160 rig set-up (outro entry only); :297 Veo spreadF layer fades over ES.fade [193.55,194.0] when on (null: 194.06-194.9 as v4.5);
   :298 endStrum.apply(t); :376-end endStrumAt / esMesh / endStrumRig. node --check OK.
2. NEW media/act5/tex/{hole46.png, arm46m.png, strum46.json}; NEW assets/v4_stills/tools/v46_outstrum/{onsets.py, gen_arm.py, build_strum.py,
   sync_check.py, audit_frames.py, closeup.py}; work assets/v4_stills/work/v46_outstrum/ (arm_in, arm_gen_a, views).
3. cold_open.js untouched (diff vs backup = none). render.js / core/motion / show/main.js untouched.
Review (540p, audio) engine/out/review/v46/v46_outstrum/: end_groove.mp4 (live), end_strum.mp4, end_v45.mp4 (190-203);
  closeup_v45-groove-strum_193.4-196.mp4 (3-up, ~2x at the push end, ~3.5x at its start, audio); spot_montage_165-172.mp4; audit/*.png; stills/.
  Re-render a variant: from engine/, `bash out/review/v46/v46_outstrum/render_variant.sh <groove|strum|null> [from] [to]` (resets to 'groove').
Sync (sync_check.py, camera push undone analytically, motion-energy peaks in the arm box): groove 8/8 visible crossings within -6..+14 ms
  (194.033 .. 195.594); strum 4/4 downstrokes +8..+18 ms (its lift-backs peak ~140 ms before each down, off-beat by design).
  The wipe reaches Charlie at ~195.75, so 195.829+ crossings are covered (harmless).
Canon: Charlie keeps his flat cap in every audited frame (193.7-195.75, all 3 variants; graphite page by design, the cap is the page's
  own light cap, never a grey patch); the head patch ellipse contains the whole cap. No Jade/Ricky on this page.
Montage: no callback into act5 (CUTS stop at 166.4; 0.62 = cold_open, unchanged): spot 168.1 identical to full_v4.5. The 171.6 Act IV frame
  differs slightly from full_v4.5 (softer, no black blob) = other units' post-v4.5 changes, not this unit.
Spend: $0.1344 (1 NBP edit, in media/genlog.jsonl).
