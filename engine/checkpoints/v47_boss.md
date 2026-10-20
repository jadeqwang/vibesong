# v47_boss checkpoint (unit started 2026-10-19 evening)
Task: 2:10 (129.4-143.4) boss battle: spiral visibly cast by Ricky + bugs; Eraser fight visually coherent + interesting. Brief docs/v47_brief.md.
Owns: act4/main3d.js 123.35-143.4 window (shared with v47_hands: guitar-pose calls only), act4/eraser3d.js, act4/glyph.js, act4/world4.js (boss bits).

## Status
- PHASE 1 DESIGN DONE (2026-10-19 ~22:15). **WAITING for the coordinator's OK** before any src edit. Spend $0 (no paid gens).
- Design: docs/v47_boss_design.md (diagnosis, idea, beat sheet, camera grammar, value/colour plan, removals, options A 'coverage' (rec.) / B 'arena', build plan).
- Mocks: engine/out/review/v47/v47_boss/design/ 01-08 before|after (v4.6 | mock), 09_option_arena_*, 10_colourscript_lift (recommend NOT changing the colour script), sheet_before_after.jpg.
- src: UNTOUCHED. Mocks were rendered from a shadow tree (scratchpad/shadow/engine: symlinks + copied src + render.js).
  Prototype diffs vs src at the time: engine/out/bak_v47/v47_boss/proto/{main3d,world4,glyph,colorscript}.js.diff (colorscript = mock-only lift, not for Phase 2).

## Key facts (for Phase 2 / a cold resume)
- Trail geometry (glyph ground strokes through E): stroke 6 far (1636,-270) -> corner (1336,221) -> bottom end (1511,303); stroke 7 near (1406,358) -> far (2237,-15). EP1 (2761,50). E (1160,131,468), SPIRAL.c (1101,0,480) r34, GY 10.
  The reveal shader's g.g = FONT-arc param (not world arc): place the Eraser by interpolating the median in font space then projecting (proto B.tr6/tr7).
- Timeline: charge = one shove per beat 129.385 -> corner on 132.603 (strongest drum onset); roll call 8ths from 130.585 (Ricky, lamp 130.786, button 130.987, bridge 131.188, wheel 131.389, glider 131.590); ring fires 131.785 (SPEED 520 -> ~390 u at 132.603); skid 132.603-132.985; retreat along stroke 7 to EP1 by 135.35; Eraser sc 210 in the fight, 290 at EP1.
- Additive braid/feeds wash to white (tone map + colour-script drain, protSat 0.62): use NormalBlending, mid values (uGainB ~0.75, feeds 0.5-1.3).
- Shared-file rule: act4/main3d.js also edited by v47_hands (guitar-pose calls only): small Edit-tool edits, re-read before each.
- Renders: TMPDIR must be engine/out/dev/tmp (scratchpad path too long for Chrome's socket). Still batch ~26 s init.

## Next (after OK)
Phase 2 per docs/v47_boss_design.md §8: backup act4/{main3d,world4,glyph}.js to engine/out/bak_v47/v47_boss/ first; port the proto in small edits; clips boss_{v46,coverage,arena}.mp4 127-147 540p audio --workers 1; canon crops; update this checkpoint.

## PHASE 2 (coordinator OK 2026-10-19 ~22:20: build A 'coverage' + sub-switch 'coverage_ui'; notes: bugs visible feeding, saturated colour incl. Ricky's beam, no shells 129.4-136, skip arena unless time)
- Backups before the first src edit: engine/out/bak_v47/v47_boss/{main3d,world4,glyph}.js.start.
- Iterated in the shadow tree (refreshed from live src incl. HANDS_V47 'grip'), then PORTED (~22:45): world4.js + glyph.js via patch (my files), main3d.js via Edit-tool hunks.
  src/scenes/act4/main3d.js: `export const BOSS_V47 = 'coverage'` (~l.62; null | 'coverage' | 'coverage_ui' | 'arena'), B47 block (B, eraser47, feeds, ring47, beacon47, ui47) before "// ---- heroes";
  hooks in worldState (shells off, trails, braid), eraserState (fight path, the turn 141.4-142.6), pageFeatures, heroState (Ricky/Charlie playFig, Jade spot/run, lowers pencil 142.605), camera (S1/S2/S3 + climb re-aim), overlay (ui47), update (ring47/beacon47, feeds reset), r5Shot.
  world4.js makeSpiral: uBraid/uStrP/uStrC/uFlash/uGainB (braid path only when uBraid=1). glyph.js: uTrailB (stroke 7 from near end), uIgFront (ignite runs out along the trails); defaults 2 = old behaviour.
- A/B: BOSS_V47 = null vs the .start backups, 960x540 stills 131.0 / 137.6 / 140.2 / 141.8: byte-IDENTICAL.
- Fixes vs the mocks: saturated CAST colours (Ricky blue 0.1,0.45,1); feeds + braid NormalBlending + depthWrite (additive / no-depth washed to white under tone map, haze and the colour script); own pencil-colour ring (no jamLight reuse); all five bugs in S2 with hop/pop + a light in their colour on their 8th; Jade moved to L(52,-52) out of S2's way; vantage beacon (goal); shells verified gone.
- After the clip review (~22:35): climb camera re-aimed (main3d camera(): B47 branch of the climb shot, fov 60, lerp 0.06 toward the Eraser) so the bounce + landing stay in frame;
  the vantage reads as the GOAL, not a floating carrot (beacon47: flatter gold stepping stone pulsing on the beat until the 135.6 cut, beacon column hidden in the charge shot).
  A/B again (null vs .start, 132.2 / 134.4): byte-IDENTICAL.

## DONE (2026-10-19 ~22:50). Spend $0. Nothing running.
- LIVE: `export const BOSS_V47 = 'coverage'` in src/scenes/act4/main3d.js (~l.62). Switch: null = v4.6 exactly | 'coverage_ui' = + callouts | 'arena' (built, not reviewed).
- Clips (540p, audio, 127-147, --workers 1) engine/out/review/v47/v47_boss/: boss_v46.mp4, boss_coverage.mp4, boss_coverage_ui.mp4; sheets boss_coverage_sheet.jpg, boss_coverage_ui_sheet.jpg.
- Canon: canon_S2_131.0_3x.jpg (Charlie tan cap + hands on the guitar with HANDS_V47 'grip'; Ricky grips the Strat, the beam leaves his headstock; Jade back: hair down + a pencil in each hand, horizontal orange sleeve bands, wide navy pants, orange strap, white sneakers),
  canon_jade_142.95_143.3_2x.jpg (front-on: hair down, pencils lowered, ONE pale-blue chest dot, patch on her left arm on the band, epaulettes; head turned to her left = screen right toward the Eraser). The jacket/patch look is the unchanged native model.
- Shells: none 129.4-136 (sampled every ~0.7 s); the only orange/gold object is the vantage (goal).
- Final copies: engine/out/bak_v47/v47_boss/{main3d,world4,glyph}.js.v47_done. Restore v4.6: set BOSS_V47 = null (or copy the .start files).
- Re-render a variant: edit the const in src (or use out/review/v47/v47_boss/render_var.sh, which copies src into the scratchpad shadow tree first; scratchpad may be gone after this session) then
  `node render.js --show main --from 127 --to 147 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 out/review/v47/v47_boss/X.mp4 --audio --workers 1` (~100 s).
- Not touched: core/colorscript.js (recommendation: leave the drain), battle_ui.js, card 06 (v47_cards). paper.js diff in git is v47_trio's.
- Known / optional: the Eraser's look-down 141.8-142.2 is subtle (eyes + 0.2 rad tip); the braid is thin in S2 (it grows to full height by 131.8); crumbs not thinned.
