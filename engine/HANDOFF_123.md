# HANDOFF at t = 123.354 (Act III battle -> Team C / Act IV)

Updated 2026-10-16 by the BATTLE SCENE team (the bug battle rewrite). Previous version: out/bak_battle_scene/HANDOFF_123.md.

Act III's last entry (`act3.rap`) ends at `T.section('Bridge').start` = 123.354 (bar 75). Act III's last shot is the band
shot (from 122.35) descending onto the same camera as before. The battle UI (src/show/battle_ui.js) owns the subtitles until
123.41 and draws `THE ERASER draws near!` from 123.18 (act4 already hooks it).

- **Where:** mesa B, the amphitheatre stage. World fully coloured by THE PAINT FLOOD (origin `FLOOD.c` = (1354, 10, 454),
  `floodRadius(123.354)` ≈ 16000, i.e. everything). Golden hour, sun `SUN_DIR`. (unchanged)
- **Camera at 123.354 (unchanged):** perspective, position (1380, 52, 610), looking at (1350, 36, 430), fov 52
  (`HANDOVER_CAM` exported from act3/rap.js).
- **Party (unchanged x/z, facing -x, rotY 0):** Jade (1378, **16**, 454) `sing` hair DOWN (pencils in hand), Charlie
  (1402, **16**, 442) idle **with his cap on**, Ricky (1424, 10, 460) `sustain`. CHANGED: Jade and Charlie stand ON the stage
  disc (top y = 16); at y = 10 their feet were buried 6 units in it.
- **Features: CHANGED to the creatures module** (src/core/creatures, `makeMorph` per bug, upright stance, scale `CAST_S` = 2.0 x VOXEL),
  owned by the act3 battle cast (`getCast(W, ctx)` in act3/battle_cast.js; not part of `W.reset()`). The old sprite bugs
  (`W.bugs`) are no longer shown. Same spots and motion formulas as before: button (1330, **16**, 458), wheel rolled to
  (1266, 10, 446), glider circling (x = 1320 + 40 cos a, z = 440 + 20 sin a, y = 56 + 6 sin 2a, a = 1.6 (t − 118.785)),
  bridge (1280, 10, 462), lamp (1292, 10, 470) glowing.
- **Props:** the six SYNTAX / 语法 books in Act IV's original domino layout at z 302 (x 1130 + 52 i, coloured; in the battle
  they fall around the party, and the recruit cut at 121.405 resets them). **No monolith** (its beat moved into the battle UI).
  The giant pencil is planted at (1354, 4, 454), rotation z −0.08 (unchanged).

## Act IV changes (DONE 2026-10-16 by the battle scene team, coordinator-authorized; marked "(battle scene v2)" in main3d.js)
1. Import: `import { FLOOD, FEATURE_T, handover } from '../act3/rap.js';` (FEATURE_T keeps its old values: they are the
   features' idle-loop phase references, not the conversion times).
2. Replace the body of `handoverState(t)` (lines ~160-176: band, `W.bugs` features, books, monolith, pencil) with
   `handover(W, t, ctx);`. It places the band, the creature features, the fallen books and the pencil exactly as Act III's
   last frame, and shows the cast group.
3. Every frame, hide the cast once the hand-over is over (the creature models are not reset by `W.reset()`): at the top of
   the frame function add `if (t >= K.acc) handover(W, null);` (K.acc = bridge accent 125.769; `handover` also hides by
   itself for t >= 125.769).

Verified frame by frame (3699-3702): out/review/battle/seam_123.354_v2.jpg. Backup of act4 before the edits: out/bak_battle_scene/act4/.

4. Battle UI hook (DONE): `api.suppressSubs = battleOwnsSubs(t)` in update, `bui.update(t, { camera: cam }); bui.render(...)`
   at the end of render. This fixes the stale line-33 subtitle and shows `THE ERASER draws near!` (123.18-124.45); it also
   turns on the designed final-boss menu (143.48-154.24) in Act IV. THE ERASER's ♥+1 tags need an `eraser` anchor (not passed yet).
