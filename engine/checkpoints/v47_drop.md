# v47_drop checkpoint
Notes (Jade, v4.6): 1:27 stillness at FIXTURES (~87.0-88.0) / FUNCTIONS (~90.2-91.0) feels like a hung zoom call; 1:32 receiver close-up (~91.4-93) -> camera pulls back for context.
Owns: src/scenes/act3/drop_r5.js, src/scenes/act3/slab_insert.js, act3 drop camera code. Switch DROP_V47 (null = v4.6). Cap $5.
## Log
- start: reading code; no src edited. Spend $0.
- Backups: out/bak_v47/v47_drop/{drop_r5,slab_insert,talos_plan}.js.v46 (pristine v4.6). slab_insert.js is NOT in this window (only act5/aerial.js 180/183 + battle.js use it): not edited.
- CAUSE (measured: full_v4.6b frame diffs, mean |dY| ~0.4 = grain only over 87.30-87.83 and 90.40-91.13, then a pose jump 87.833 / 91.133):
  src/scenes/act3/drop_r5.js:40 tau() clamps the scene clock to the stop start through CUE.fixStop [87.26,87.83] and CUE.funStop [90.375,91.11]
  (common.js:36-37) = heroes, slab, beam, particles all frozen; and the cameras A1F (:392) / A3 (:418) run on holdClock(t, STOPS) = the camera
  freezes too (the shake pulses are on the frozen tc). The tracks inside the stops are idles (talos_plan.js roomATracksR5 until(87.84) etc.), so the
  clock can run. slashPose() (drop.js:291) releases at SLASH[2]+0.3 = 87.43 -> needs a blend once the clock runs.
- Plan: DROP_V47 'drift'|'punch'|null in drop_r5.js: live clock + real-time cameras + acting (slash settle, look-ups, Jade glances at Ricky, Ricky's arm rings out);
  'punch' adds a snap push-in on the stop hit + handheld sway; both: A4 close-up pulls back (91.335-92.975) to a readable wide.
- DONE ~22:00 (safe point: nothing of mine running, no paid gen, spend $0). Live: DROP_V47 = 'drift' (drop_r5.js:50). Backup of this version out/bak_v47/v47_drop/drop_r5.js.v47.
  Edits (drop_r5.js): :41-56 switch + tau/camClock/V47 consts; :148 eye-lines in the stops; frame(): slashSettle call after slashPose, firefly held off until the re-hit;
  :331 slashSettle(); :366 rickyPick ring() (flung hand rises + vibrato through the stop); A1F/A3 cameras on camClock + push/sway (+ 'punch' snap fov on 87.33 / 90.35);
  :468 A4 pull-back (V47.pull: bezier p0 [727,58,350] -> pc [690,100,425] -> p1 [605,215,445], tgt -> [775,10,205], fov 30->44, hold 0.16, lands 0.86 of the shot).
  Pull-back direction tested (st/cands*.jpg): north-east/high-north = the gate hides Charlie + slab back; SW = the wall hides the receiver (by design); SE = the slab hides it. NW high = the whole chain reads.
  NOTE v47_hands edited drop_r5.js too (import :34, rickyPick G :348, pole :371; HANDS_V47 in voxfig.js, null at my renders; verified drift/punch identical outside my changes).
- Clips (540p, audio, 85-94.5) out/review/v47/v47_drop/: drop_v46.mp4 (cut from full_v4.6b), drop_drift.mp4, drop_punch.mp4. Sheets fr/sheet_*.jpg, fr/pull_sheet.jpg, fr/fix_crop.jpg, fr/stops_crop.jpg, st/drift_sheet.jpg.
- Measured (frame |dY|, 320x180): stops 87.3-87.83 / 90.4-91.1 v4.6 min 0.38 (16+22 frozen frames <1.0) -> drift min 1.5-1.6, punch 1.8, 0 frozen frames; jump at 87.833 gone (4.30 -> 1.80).
- Canon (crops 2x): Jade hair long/loose + pencil in each hand (blue + pink caps), back dot + RARE EARTH, horizontal orange sleeve bands; Charlie's cap cream in the close-up; staging otherwise unchanged.
- POLISH (coordinator, ~22:10, $0): the FUNCTIONS slab's back read as a flat dark purple rectangle in the pull-back. Cause: carved_slab.js:164-170 back/outer-side branch
  (uCvBackK = 1: desaturated x0.72 + metal 0.12, tuned to the lying plank's top in the 93.2 crossing) + the raking key only lights the front (+z local).
  Fix drop_r5.js:223 (frame(), inside the A4 window SHOT[3]..SHOT[4] with DROP_V47 only): uCvBackK -> 0 (front stone albedo/roughness on the back + outer sides, no letters) and
  the key's local z mirrored onto the back; both ease back to the v4.6 values over RESUME..SLAM+0.08 (92.56-92.94) as it lies down, so the 93.0 crossing's plank top
  (dark until Jade's paint covers it) still matches across the cut. Uniforms are set every frame (order-free). Front-facing shots unchanged (checked 90.7, 93.3). carved_slab.js not edited.
  Backup of this version out/bak_v47/v47_drop/drop_r5.js.v47b. drop_drift.mp4 re-rendered (85-94.5).
  NOTE: that render ran with HANDS_V47 = 'grip' (v47_hands set it; unchanged through the render, voxfig/figure md5 stable) -> drop_drift has the new hands; drop_punch.mp4 (earlier) has HANDS null.
  Left as is: the thin purple/rainbow glow strip on the slab's chipped west edge (the FUNCTIONS groove spill, v4.6).
