# BATTLE SCENE checkpoint (team: BATTLE SCENE) · song 107.15-123.354

Owner files: src/scenes/act3/stage.js, rap.js (rewritten as thin entries), new act3/battle.js (the scene),
act3/battle_cast.js (bug/feature adapter), act3/battle_fx.js (battle-only props). CUE additions in common.js.
Backup of src/scenes/act3/ (+ HANDOFF_123.md): engine/out/bak_battle_scene/.


## (history) v3 APPROVED as morning fallback. v4 framing tweaks DONE in code (v3 code backup out/bak_battle_scene/act3_v3/):
##   1 master 107.7 wider (fov 46, pulled back), bug row pushed left onto the first seat steps (seatY), firefly far left,
##     caterpillar nearest the party -> clear floor strip;  2 recruit: Charlie on the camera side of the button
##     (CHARLIE_PRESS 1314,10,482), moth hover moved up-left out of his line.
## >>> v4 re-rendered for the pencil caps (04:15, TMPDIR=out/dev/tmp; models files unchanged during the render): battle_v4.mp4
##     (630/630 frames + audio), battle_v4_sheet.jpg, stills_v4/*.png x10, jade_canon_crops_3x_v4.jpg overwritten. No other changes.
##     Cap check 3x: 111.7 blue + pink both read; 118.4 pink (with ferrule) reads, the blue cap is hidden in her other fist (pose).
##     Seam strips seam_*_v4.jpg are from the 01:01 render (only the caps differ; not re-rendered). Standing by.
## >>> APPROVED (coordinator, 2026-10-16): battle_v4 is THE MORNING CUT. Standing by; no further renders requested. See GATE v4 at the end. <<<
v3 items: [x] 1 spacing: ~one hero height (69 u) of floor between the bug row and the party (bugs cross only to attack)
 [x] 2 119.02-119.45 flood: higher 3/4 on the ring racing out from the pencil, wheel on its edge, glider on its crest, Jade
       small AT the pencil (she jumps to it 118.75-118.95); aerial after 119.45 unchanged
 [x] 3 recruit: Charlie waits by the button from the cut, presses on YES in frame; one continuous move from the recruit
       framing into the hand-over camera (no cut at 122.35); Jade + Ricky react
 [x] 4 GUARD/MISS overlap at 117.3: Charlie's GUARD spot farther from Jade + his anchor raised in 117.2-117.7
 [x] 5 moth: natural colors from the start; Jade's coloring tints the wings with flower colors (wing material, restored after render)
 [x] 6 light: golden-hour lift in the battle (exposure, warm key, face fill), eased in after the swirl, eased back to the
       Act III look in the hand-over shot so both seams still match
 [x] 7 render battle_v3 (105-126, native 1.3) + sheet + 1080p stills (same 10) + seams + 3x crops; report; STOP
Previous gate (v2) notes follow.
Coordinator v1 review -> v2 items (priority order). Status: [ ] pending, [x] done.
 [x] 1 COMPOSITION (m1): master cam = clean two-sided lineup at the SAME depth: bugs in a row on the left (z~490, x 1312..1406),
       party on the right (x 1438/1462/1486), floor visible between. Per turn: cut on the half-bar to a medium two-shot (acting
       hero(s) + target bug; over-shoulder for the command phase), back to master. <= 1 cut per half-bar. Creature scale
       knee-to-waist (upright 12-14 u -> CAST_S = VOXEL*1.6).
 [x] 2 HATS: beige flat cap mesh (src/core/heromodels/heroes.js capGeo) lands ON TOP of the bug at hat scale (never engulfs);
       same for the lampshade (hide our cap when the lamp morph starts: the lamp has its own cap shade).
 [x] 3 TRIPLE TECH 117.65-118.66: medium shot on just ladybug + caterpillar (they advance out of the row on the boss turn,
       spaced apart), upright drafts revealing (Jade's pencil in frame sketching), ring 118.175, caps 118.38, morphs 118.47/118.66.
 [x] 4 STANCE 'upright' is LIVE (WORLD_API "Creatures round 2 additions"): STANCE='upright' in battle_cast.js; makeDraft
       { stance }; mo.set({ from }) optional; wheel spin joint.
 [x] 5 battle_ui.js: minimal stagger of overlapping BUG -> FEATURE tags (~119.1). AUTHORIZED; note it here when done.
 [x] 6 ACT IV: back up src/scenes/act4/ -> out/bak_battle_scene/act4/, then in main3d.js ONLY: the 3 HANDOFF_123 edits +
       battle UI hook (suppressSubs = battleOwnsSubs(t), bui.update/bui.render). Verify 123.354 frame by frame.
 [x] 8 NATIVE HEROES (coordinator 01:xx): render v2 with `--fig native --figscale 1.3` (heroes ~69 u); re-framed every shot
       (incl. the taunt crop N-MOD2), hands via g.hand('R'), head anchors via Box3 (headTop). + ONE carve comparison still at 118.4.
 [x] 7 Deliverables (DONE, see GATE v2 below): render cmd:
       node render.js --show main --fig native --figscale 1.3 --from 105 --to 126 --fps 30 --res 960x540
         --mp4 out/review/battle/battle_v2.mp4 --audio --workers 3 --sheet out/review/battle/battle_v2_sheet.jpg --sheet-every 0.8062 --sheet-cols 6
       then 1080p native stills + seams (frames 3213-3220, 3699-3702) + carve 118.4 + Jade 3x crops; scratch helper
       /tmp/claude-1000/-home-jade-Documents-vibesong/403d79b5-caea-45a3-8d32-3d77a3ecf8ab/scratchpad/st.sh <dir> <res> <native|carve> t...
   Done in code: v2 layout (PARTY / BUGB row / BOSS pair / SIDE / LOOP / FORWARD in battle.js), CAST_S = 2.0x, STANCE upright,
   caps = heromodels capGeo (battle_fx.js), triple-tech medium shot, battle_ui.js line ~563 (feature tags stack 16 px per older
   alive tag; backup out/bak_battle_scene/battle_ui.js.orig), act4/main3d.js 5 marked edits "(battle scene v2)" (backup
   out/bak_battle_scene/act4/). v1 code backup: out/bak_battle_scene/act3_v1/. out/review/battle/battle_v2.mp4 (105-126, 960x540, audio) + battle_v2_sheet.jpg + 1080p stills (same
       10 times) + seam strips + Jade 3x crops. Then report and STOP.

## Log
- 2026-10-15 23:50 read: game_design_acts3-5 (battle system, roster, 107.15-123.35), decisions (10-15 late), RESUME 0/6,
  HANDOFF_ACTS, HANDOFF_123, WORLD_API (+ Battle UI), checkpoints/battle_ui.md, battle_ui.js tables, stage/rap/common/
  paintlog/props/build, verse2 end state, act4 main3d handoverState, mocks m1-m3, battle_ui_sheet.
- creatures: src/core/creatures/ exists (makeBug/makeFeature/makeMorph/makeDraft) but WORLD_API has no "Creatures"
  section and checkpoints/creatures.md is at M0 -> adapter uses W.bugs (sprite Actors) for now.

## State (2026-10-16 00:40) · resumable cold
- DONE (code): act3/battle.js (whole battle 107.15-123.354, pure in t; exports handover(W,t,ctx), handoverBand/Feature/Props,
  bookPose, FEATURE_T (unchanged values = Act IV phase refs), FLOOD, floodRadius, BAND, BUGP, HANDOVER_CAM), act3/battle_cast.js
  (creatures backend: makeMorph per bug, makeDraft for ladybug + caterpillar; CAST_S = VOXEL*1.8; STANCE const for round 2),
  act3/battle_fx.js (checker floor, loop rings, "!" planes, hats, boomerang, axle, sound rings, updraft, glitch wave, shield),
  stage.js / rap.js = thin wrappers (stage passes withVerse2: the 4 swirl frames render verse2's own scene under the swirl).
- Coordinator 00:15: CREATURES gate passed -> adapter switched (done). Heroes stay 'carve'; native heroes ~1.3x later: keep
  framings loose. Round 2 stance 'upright': set STANCE in battle_cast.js when WORLD_API documents it.
- Test stills: out/dev/battle_a..f (scratch; delete when done). Render: tools/stills.sh out/dev/x 960x540 <times>.
- Known: W.put drops `hat` -> battle.js putHero(); compose's s108 framing column hidden in render(); book bodies use material
  arrays (W.reset skips them) -> paint() sets every book every frame.
- NEXT: polish pass on stills -> full render (deliverables in out/review/battle/) -> seams -> HANDOFF_123 update -> report.
- 00:55 full render started: out/review/battle/battle_v1.mp4 (+ _sheet.jpg, log battle_v1.log), 105-124.5 960x540 audio, 3 workers.
  HANDOFF_123.md rewritten (Act IV: 3 edits, use exported handover(W,t,ctx)). CORE_REQUESTS R-BS1..4 filed.
  Remaining after render: 1080p stills (10 times) -> out/review/battle/stills/, seam strips 107.15 + 123.354, Jade 3x crops.
- v1 rendered once, reviewed (sheet + 1080p stills + seams + Jade 3x crops), fixes: drafted bugs hold the draft under the hats
  (morph 0.45 s from CONV-0.1), Charlie's recruit route stays upstage (press spot behind the button), T3 camera less tilt.
  Re-render of battle_v1.mp4 running; then redo stills/seams (commands: see the render block in the report).

## GATE (2026-10-16 ~00:30) · STOPPED, waiting for review
Deliverables in out/review/battle/: battle_v1.mp4 (105-124.5, 960x540, 30 fps, audio, 19.5 s), battle_v1_sheet.jpg (25
half-bar frames), stills/battle_v1_<t>.png x10 at 1080p (+ battle_v1_stills_sheet.jpg), seam_107.15.jpg + seam_123.354.jpg
(frames in seams/), jade_canon_crops_3x.jpg. Regenerate stills/seams: scratch script logic = tools/stills-style --stills list
(times 107.7 111.7 113.3 114.95 116.3 117.3 118.4 119.1 121.5 123.3; frames 3213-3220, 3699-3702).
Open items for the next round: see the report gap list (Act IV handover edits, verse2 sub hold 107.03-107.15, aerial riders
small, Jade's carve face hidden by hair at 3/4, books are a ring not a literal domino line, no "big eyes" state in creatures).
- 00:40 seam fix: band shot lands on fov 45 (Act IV's lookFrom never updates its projection: updateProjectionMatrix is inside a line comment at main3d.js:315; reported, NOT fixed). Re-rendering battle_v2.mp4.
- 00:43 LEAK FIX: act4/world4 re-shows every top-level scene group (baseObjs) in its pre-erase frames, so after a battle frame the FX children, cast children, P.sparks/burst/petals instances, beams and spot pools leaked into Act IV. render() now clears all of them after drawing. Re-rendering battle_v2 (final).

## GATE v2 (2026-10-16) · STOPPED, waiting for review
out/review/battle/: battle_v2.mp4 (105-126, 960x540, 30 fps, audio, 21.0 s, native heroes --fig native --figscale 1.3),
battle_v2_sheet.jpg (27 half-bar frames), stills_v2/battle_v2_<t>.png x10 1080p native (+ battle_v2_stills_sheet.jpg),
stills_v2/battle_v2_118.4_CARVE_compare.png + battle_v2_118.4_native_vs_carve.jpg, seam_107.15_v2.jpg, seam_123.354_v2.jpg
(frames in seams_v2/), jade_canon_crops_3x_v2.jpg. v1 files kept for comparison (v1 PNG dumps deleted).
Open: see the v2 report (Act IV fov bug at main3d.js:315 reported not fixed; aerial riders small; recruit has no big-eyes state).

## GATE v3 (2026-10-16) · STOPPED, waiting for review
out/review/battle/: battle_v3.mp4 (105-126, 960x540, 30 fps, audio, 21.0 s, native 1.3), battle_v3_sheet.jpg (27),
stills_v3/battle_v3_<t>.png x10 1080p (+ battle_v3_stills_sheet.jpg), seam_107.15_v3.jpg + seam_123.354_v3.jpg (frames in
seams_v3/), jade_canon_crops_3x_v3.jpg. v1/v2 mp4s + sheets kept; v2 PNG dumps deleted (v2 carve comparison survives as
battle_v2_118.4_native_vs_carve.jpg). Re-render cmd: see v2 item 7 above, with v3 names.

## GATE v4 (2026-10-16 ~01:20) · STOPPED, waiting for review
out/review/battle/: battle_v4.mp4 (105-126, 960x540, 30 fps, audio, 21.0 s, --fig native --figscale 1.3, models r4 heads),
battle_v4_sheet.jpg (27), stills_v4/battle_v4_<t>.png x10 1080p (+ battle_v4_stills_sheet.jpg), seam_107.15_v4.jpg +
seam_123.354_v4.jpg (frames in seams_v4/), jade_canon_crops_3x_v4.jpg. v3 (approved fallback) mp4/sheets/stills kept.
Code: v4 = v3 + the two framing tweaks (backup of v3 code: out/bak_battle_scene/act3_v3/).

### v4 APPROVED as the morning cut (coordinator). Head version: ALL v4 deliverables use models r5 heads (Jade head tweaks):
r5 landed at 01:00:37 while v4 was rendering, so the first mp4 (r4) and the stills/seams (r5) disagreed; the mp4 + sheet were
re-rendered at 01:03 (~2 min) so the whole set is r5. Bodies are r3/r4 (unchanged). Do NOT re-render for r5.
Open items (next round):
- Flood riders (wheel, glider) are small specks with rainbow trails in the 119.45+ aerial; read well only in the ring shot.
- Creatures have no "big eyes" state: the recruit uses a bounce pop instead.
- Act IV camera stuck at fov 45: act4/main3d.js:315 lookFrom() has updateProjectionMatrix inside a line comment. Reported,
  not fixed (fixing reframes every Act IV shot); act3's hand-over shot lands on fov 45 so the seam matches.
- Verse2 subtitle shows 107.03-107.15 (act3/verse2.js, not ours); it vanishes into the battle swirl.
- (minor) 123.354 seam: framing and state match; a slight grade difference between Act III's and Act IV's looks remains
  (mean pixel diff across the seam 11.6 vs 7.4 between neighbouring frames, same as the approved v3).
