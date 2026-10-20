# v46_blob: black blob in the montage callback cut at 171.467-171.600 (full stitches only)

Owns: the scene file that owns the cause (TBD). Backups: engine/out/bak_v46/v46_blob/. Review: engine/out/review/v46/v46_blob/.

## Log
- started. Cut 17 of act4.montage (171.45 snapped) = CUTS[17] {t:121.0, color} -> act3.rap re-rendered via renderWithCart.
  montage.instFor() reuses the runner's own inst when the entry is in range (from <= 123.35), else a fresh setup.
  Full 0-203 --workers 2: w1 starts at frame 3045 = 101.5 s -> act3.rap is set up by the runner and played at its own time.
  Next: stills test 101.5 + 171.5 vs 171.5 alone.
- REPRO: NOT start-time dependent. Stills 101.5+..+171.5 (to<=171.53) are clean; stills 171.5,175 (from 171.5, to 175.03) SHOW THE BLOB.
  The trigger is act5.drop2 [173.02,176.6) being in range (set up + warmed up). The 165-172 spot render ends before 173.02 so it never loads drop2.
  Next: read act5/drop2.js for shared-world mutation.
- ROOT CAUSE: src/post.js keeps ONE GTAOPass (post.gtao), built by post.setScene(scene) and bound to that scene: GTAOPass.render
  re-renders ITS OWN scene (normals+depth) with whatever camera post._chain passes. act5/drop2.js:80 (setup) called
  ctx.post.setScene(its Act V world) -> in any render whose range reaches 173.02 (full stitches, w1 = 101.5-203), every later Act III/IV
  3D frame with AO (incl. the montage's act3.rap callback at cut 17 = 121.0) took AO from the Act V world seen from the Act III camera.
  The blob = Act V geometry occluding in GTAO. Proof: probe (scratch copy of render.js + page eval) rebinding post.gtao to the act3
  scene before 171.5 -> blob gone (mean diff 0.43/765 vs clean). Restoring envUniforms.uSunDir alone did NOT fix it.
- FIX (drop2.js only; backup out/bak_v46/v46_blob/drop2.js.start): line 83 builds its own GTAO and restores the shared one; line 232
  swaps its own in only around its post.render. render.js / post.js untouched. node --check OK.
  Next: verify video 171.3-173.3 (includes drop2) vs spot_montage_165-172 and vs full_v4.6 drop2 frames.
- VERIFIED (current code, 540p):
  * stills 171.5 with drop2 in range (from 171.5 to 175.03): pre-fix = blob (mean diff 12.85 vs clean); post-fix = PIXEL-IDENTICAL (0.0)
    to the clean render without drop2.
  * video out/review/v46/v46_blob/fix_171-173.mp4 (171.3-173.3, workers 1, drop2 in range): blob box (x690-830,y465-540) diff vs the
    clean spot_montage_165-172 = 5.6-6.8 on 171.467-171.600 (codec baseline 5-7 on neighbours); full_v4.6 there = 62-93.
  * drop2 frames unchanged: old behaviour emulated (gtao bound to drop2, last act4 frame 172.967 before) vs fix at 173.5 and 175 = 0.0.
  * SAME CAUSE, wider: emulating the old binding vs the fix on stills 105..170.5 -> mean diff 1-15 on every AO'd Act III/IV 3D frame
    (155: dark stepped wedge over the water; 112: dark lower-left corner; 172.23-172.43 and 172.53-172.73 in full_v4.6 too).
    In full_v4.4/4.5/4.6 (workers 2) this hit all of w1 = 101.5-173.02 (w0 0-101.5 was clean -> an AO change at the 101.5 seam).
    before/after still: out/review/v46/v46_blob/before_after_1715_155.jpg (top 171.5 before|after, bottom 155 before|after).
  * Minor residual (not fixed, not visible): a drop2 frame still differs by mean 0.38/765 (no pixel > 30) depending on what rendered
    before it (from 171.5 vs from 172.967); likely other shared post/env state (e.g. envUniforms.uSunDir leak, world4 restoreSun cache).
- DONE. Scratch renders/probe scripts deleted. Nothing running. Not committed.
  Next (for the coordinator): re-stitch the full cut; frames 101.5-173 will change (AO now correct), not only the blob.
