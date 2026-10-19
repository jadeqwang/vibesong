# battle_r5 (round 5): the bug battle 107.15-123.354 re-staged per docs/game_design_half2_r5.md, behind `--r5`

Brief: docs/round5_build_brief.md (unit battle_r5). Design: docs/game_design_half2_r5.md (107.15-123.35 + "The look" + signature
frames + the 143.48-149.22 window text). Inherited code: checkpoints/battle_scene.md, battle_ui.md, flood_k09.md (the approved
k09 wave, untouched), motion_r2.md, models_r6.md, creatures.md.
Owner files: src/scenes/act3/battle.js, battle_cast.js, battle_fx.js (not changed), stage.js / rap.js (not changed),
src/show/battle_ui.js. Plus the two-line `R5()` helper in src/scenes/act3/common.js (same flag as talos_r5 / look_r5 / act4_r5;
coordinator dedupes). Backups before the first edit: engine/out/bak_r5/battle_r5/ (battle.js, battle_cast.js, battle_fx.js,
stage.js, rap.js, battle_ui.js, common.js).
Review flags: `--fig native --figscale 1.3 --figres 2.5 --look k08b --r5 --workers 1` (render.js `--r5` -> `?r5=1` was added
by act4_r5; until it landed I rendered through a scratch copy render_r5.js, deleted). `export TMPDIR=$PWD/out/dev/tmp`.

## >>> STATE (cold resume) <<<
M2b DONE (2026-10-17 ~12:20): APPROVED for the half2_v4 stitch (coordinator) + the two narrow fixes below applied (stills only). Unit done for the round; reachable for the stitch seams.
Review: engine/out/review/battle_r5/ (m1_sheet.jpg, jade_canon_crops_r5.jpg, final_boss_window_r5.jpg, stills_m1/*.jpg = the
1080p M1 stills as jpg). Scratch frames deleted; engine/out/dev/battle_r5/ keeps only the helper scripts + logs (st.sh needs
render.js --r5 now: edit the one line). The session was cut once mid-way (coordinator note); state verified on disk after resume.

## Flag / inertness
- Everything new is behind `const r5 = R5()` in setupBattle() (battle.js) and `R5()` reads in battle_ui.js (cmdList / actionList /
  heartList / the 'final' layout). battle_cast's new state keys (`glitch`, `glitchSync`, `silhouette`, `setRider`) are only
  driven when r5 is on.
- **Default renders byte-identical** (A/B before vs after ALL edits, 1080p): plain default (no flags) 109.2 / 116.5 and the review
  path without --r5 (`--fig native --figscale 1.3 --figres 2.5 --look k08b`) 109.2 / 116.5: **max pixel diff 0** on all four.
- After 120.135 (the k09 race) nothing of mine changes with --r5: 122.0 / 123.33 rendered with --r5 from a shadow tree running my
  three files from the backups vs the live tree: see "Isolation" below (the only --r5 differences at those times are look_r5's grade).

## What was built (r5 path)
### Encounter 107.15-110.41
- The firefly, beetle and moth are already waiting in the row (BUGB) when the party lands (no drop-in); they flicker (glitch 0.14).
- The ladybug rides Charlie's cap (cast.setRider: a second small ladybug, makeBug s = CAST_S x 0.3 = VOXEL x 0.6, crawl stance, at
  headTop(charlie) + (-3, -1.5, 0), rotY 0.4, idle) from the first frame; it launches on frame 3223 (107.433, as he lands from the
  drop) and lands on frame 3227 (107.567) at R5_LADY_LAND (1438, top, 508), in front of the party; the battle-size ladybug takes
  over there with a pop (scale 0.3 -> 1 + 0.3 overshoot over 0.14 s), 'bug' pose (spots flash), glitch 0.3, glaring at the party
  through the intros; 108.95-109.2 it hops back to its row slot for the dance.
- The caterpillar spills over the amphitheatre's top step: path R5_CAT_PATH (behind the rim (1188, 452) 107.35 -> over the top step
  (1210, 455) 107.72 -> down the seats (1290, 478) 108.35 -> its slot (1372, 496) 109.1), y = max(floor, seat step), 'bug' pose with
  overflow 0 -> 6 (one extra segment per 0.25 s): "keeps coming".
- Three `!`s, the 4-frame swirl, the three stops + spotlights, the taunt dance + checker floor: kept.
- Cameras: 107.283 ENCOUNTER wide from the party's side, low (cam (1592, 40, 662) -> (1400, 44, 500), fov 40: the party's backs right,
  the landing centre, the row beyond, sky above); 107.615 the k08 three-shot: low front (1478, 30, 692 -> push) looking at the trio
  under the spotlights, fov 40 (held through the three stops); 109.14 the taunt medium (v3, lowered to y 50).
### Battle 110.41-118.66 (turns, techs, roster, timings unchanged)
- **Diegetic state** (battle_cast.js): `glitch` 0..1 = per-frame deterministic probability (hash of frame + seed) that the whole
  body swaps to a checkerboard ShaderMaterial (magenta / near-black, 2-voxel cells in each part's local space, unlit: the
  missing-texture look, same colours as the floor checker), plus single parts at 0.35 x. Row flickers in sync during the taunt
  (glitchSync seed). In the battle: 0.12 + 0.3 x (1 - ♥/5) + 0.3 while the bug acts (its 'bug' loop); 0 from its conversion frame
  on (fixed = solid colour). The yellow-name rule in the window is gone (the window is slim during conversions anyway).
- **Hit-stop + silhouette**: the 2 frames before each conversion frame (CONVERT table, frameOf) the world time for heroes / bugs /
  fx is held (hitStop(t)); on those frames the target bug's meshes swap to flat white (silhouette flash; drafted bugs: the draft's
  fill = 1). The camera, UI and particles run on real t. Then the morph flies on the conversion frame: 0.22 s (firefly / moth /
  beetle; the drafted pair keeps v3's timing), the feature then HOLDS as the card until the next enemy half-turn (firefly ->
  T3 0.4 s, moth -> T4 0.35 s, beetle -> T5 0.37 s: >= half a beat). The wheel's roll-off is delayed 0.3 s (card first).
- **Over-the-shoulder turn cameras** (`ots(hero, target, { back, side, up, fov, tgtY })`): chest height (y 44-50), the target bug
  the focal subject at >= 1/3 of the frame height (measured on the 1080p stills: lamp card ~40%, firefly silhouette ~45%, moth
  ~45%, glider ~55%, beetle silhouette ~60%, wheel ~50%), the hero's shoulder / arm cropped at the frame edge:
  - T2 party half (112.33, EH[0]): over Charlie, who **steps up** beside Jade's pool (JRPG grammar; 112.1-112.32, back
    113.5-113.68) to R5_C_T2 (1482, 534): the firefly in the pool, Ricky's rings, the cap flies in, LAMP card.
  - T3: enemy half 113.68-113.82 a low shot from the party's side up at Charlie's lamp (the moth dives into it); party half 113.82
    over Jade's shoulder on the moth (from the arch side), the camera rises with the updraft and lifts / widens for the card
    (114.9-115.12) so the glider's wings fit; GLIDER card.
  - T4 (115.30): over Charlie, who steps up to the loop (R5_C_T4 (1472, 558); back 116.7-116.9): the beetle grinding rings, Jade's
    axle, the boomerang, WHEEL card.
  - T5 master lowered (y 62); the triple-tech medium and the k09 shots unchanged.
- **Window schedule** (battle_ui `slim` + new `slimTags`): slim lyric strip during [112.33, 113.68), [113.82, 115.30),
  [115.6, 116.88), [117.95, 120.135) (the k09 hero range stays slim as before); full windows elsewhere (command phases, the enemy
  half-turn messages, the boss turn with the corrupt party window, victory / recruit). In slim mode the `BUG -> FEATURE` tag is
  still drawn at the bug's anchor (clamped inside the frame) and the TRIPLE TECH banner survives small; hearts / MISS / GUARD tags
  are not drawn in slim. Faces never covered: the strip is the bottom 35 px of 216.
- **Jade's syntax turn**: CMDS_R5[0].skills = ['SKILLS ▸', 'for(;;)', '语法'] (two cascades), toppling on 背 语 法, the text field as
  before (`> let's dance`, ENTER 111.705).
### Victory 119.02-121.40 and recruit 121.40-123.354: unchanged (k09 m6b wave; DQ prompt, YES, 3 -> 8, band shot, UI slides away).
### Final-boss window 143.48-149.22 (battle_ui.js, per act4_r5's REQUEST, which refines the design text)
- 143.48-144.0 the command window: FIGHT struck + `not very effective` blinking, cursor FIGHT -> PAINT (143.75); closes 144.0.
- NO 2D text field (CMDS_R5[2] has no field): act4_r5 draws `> you` in the world. The ENTER line "You can't draw without erasing."
  and the first ERASER ♥ moved 147.358 -> 147.693 (act4's measured ENTER); the other lines unchanged.
- The party window collapses to nothing 143.48-149.22; it pops back 149.22-150.6 for PARTY 8 -> 9 + 'THE ERASER · UNDO', then
  collapses again. Without it the message window is a slim strip (drawSlimFinal: lyric + translation + the battle-text line).
- The ERASER ♥ window (147.6-149.22) is TOP-RIGHT (x 283-380, y 4-18 of 384x216) per the coordinator's relay of act4's item 5;
  it sits over the Eraser's brow in F2 (full-frame face), nothing else is clear there. The slim message strip at the bottom is
  ~16-18% of the height (lyric + translation + battle line): act4 should keep Jade's head above the bottom 18% in F1.
- Verified in the real act4_r5 scene: out/review/battle_r5/final_boss_window_r5.jpg (143.7 / 145.5 / 147.3 / 148.0 / 149.3).

## The 123.354 hand-over (what act4_r5 reads) — unchanged from v3/v4
- Camera: HANDOVER_CAM pos (1380, 52, 610), tgt (1350, top + 26, 430) = (1350, 36, 430); fov as RENDERED = 45 (ACT4_FOV: act4's
  lookFrom keeps the constructor fov 45; our move lands on 45 at END). The move is one continuous path from the recruit framing
  (REVEAL + 0.5 -> END).
- Band: handoverBand(t) (BAND spots: jade (1378, 16, 454) sing, charlie (1402, 16, 442) idle hat on, ricky (1424, 10, 460) sustain;
  facing -1, rotY 0 from 122.95); features: handoverFeature(b, t) at BUGP (moth circling, beetle rolling in, firefly glow 1);
  props: the six books in Act IV's domino layout (coloured), the planted giant pencil at PENCIL (1354, 4, 454) rot z -0.08.
- UI: the battle windows have slid away (close 122.95 + 0.22); from 123.18 the 'THE ERASER draws near!' banner (battle_ui `near`
  phase) is the only 2D element; battleOwnsSubs(t) true until 123.41.
- Look: Act III's look eased back from the golden-hour lift by END - 0.2 (same as v4); with --r5 look_r5's preset grades both sides.
- Frame check: 123.354 rendered through act4 with --r5 vs the same without --r5: identical staging (fb/123.354 vs fb/v3_123.354).

## Isolation (my code inert after 120.135 under --r5)
Shadow tree (symlinked engine root; battle.js, battle_cast.js, battle_ui.js from the backups), 122.0 / 123.33 with --r5 vs the
live tree with --r5: **max pixel diff 0** on both (so the 123.354 hand-over under --r5 differs from v4 only by look_r5's grade).
## look_r5 API use
Every r5 shot in 107.283-116.88 passes `look.r5` (k08b.js pre() forwards it to r5Shot): OTS shots `{ dof: 0.6, focus: the bug,
columns: { cull: [] } }`, the encounter `{ dof: 0.45, columns: { cull: ['M3'] } }`, the k08 three-shot `{ dof: 0.4 }`. Because
r5Shot() ACCUMULATES across frames, battle.js calls `r5ShotClear()` at the start of every r5 frame (namespace import of look.js,
optional-chained), so no override of mine leaks into the k09 / recruit shots or Act IV. The two-colour pair is left to the
preset's stage default.

## M1 review (coordinator) -> fixes DONE before M2
APPROVED as staged: LAMP + WHEEL cards, hit-stop silhouettes, the ladybug hop, the taunt checker floor, recruit, wave, the whole
final-boss window (keep every timing). Four fixes, all done (2026-10-17 ~11:40):
1. GLIDER card blow-out: the blaze was the T3 updraft (60 additive streaks x2.2 + bloom) sitting on the glider in the close card,
   not the sun. r5: the updraft runs at 0.5 and fades out over 114.9-114.97 (the conversion frame); the card look also drops
   exposure (0.52 -> 0.42), bloomAmt 0.1, rays 0.05, look.r5.beam 0. Still bright-ish at 115.0 (the flight's white sparks) but the
   glider's wings / head read at 115.25.
2. Over-the-shoulder shots: camera pulled back and UP with a longer lens (ots back 52, side 34, up 92, fov 32 for T2 / T4;
   T3 back 46, up 100 + the updraft rise, fov 34 -> 40 for the card): the foreground hero is now a head-and-shoulders silhouette
   (Charlie's cap + guitar, Jade's hair + jacket) in the lower corner, ~1/4 of the frame; the bug stays >= 1/3 (firefly ~35%,
   lamp ~40%, moth ~45%, glider ~50%, beetle ~45%, wheel ~45%). The high angle is the JRPG behind-the-party battle camera; it
   breaks the "chest height" rule on purpose (at chest height a floor-level bug and the hero's head cannot share the frame).
   T3 sits above Charlie / Ricky (who stand on the +z side behind Jade; the first try put the camera inside Ricky).
3. Glitch duty cycle: battle_cast `glitch` is now the whole-body frame duty directly (parts at 0.4 x): taunt 0.3, battle
   min(0.5, 0.1 + 0.2 (1 - ♥/5) + 0.25 while acting), waiting 0.12. True colours show most of the time; the solid snap on the
   conversion frame stays.
4. Encounter: a cut-in on the row opens the battle (107.283-107.467: low medium on the firefly / beetle / moth waiting, the
   caterpillar's spill moved earlier (over the top step at 107.3) behind them), then the wide from the party's side with the
   ladybug's hop (107.467-107.615), then the k08 three-shot. The 世界 是我的舞台 sign on the arch: NOT done (needs a text decal
   + the arch is side-on from the +z camera; the three-shot would have to move to a +x camera where the party shows its backs).
M2 render launched: m2.mp4 540p 107.15-123.354 with audio + m2_sheet.jpg (1 s), review flags + --r5, 1 worker.

## M2 DONE (2026-10-17 ~11:50) — STOPPED for review
- out/review/battle_r5/m2.mp4: 107.15-123.354, 960x540, 30 fps, audio, review flags + --r5, 1 worker (486 frames, 25.8 ms render /
  110 ms wall per frame, 74 s). m2_sheet.jpg (every 1 s). m2.log.
- Full-rate conversion strips (every frame, 21 frames each): m2_conv_firefly_113.1-113.8.jpg, m2_conv_moth_114.8-115.5.jpg,
  m2_conv_beetle_116.3-117.0.jpg, m2_conv_tripletech_118.3-119.0.jpg, m2_conv_encounter_107.2-107.9.jpg. Read at full rate:
  firefly: bug in the pool 113.1-113.167 -> white silhouette 113.2 + 113.233 (2 frames) -> flight 113.267-113.4 -> LAMP card +
  tag 113.433-113.633 -> cut 113.667 (T3 enemy half). Moth: updraft rise 114.8-114.9 -> silhouette 114.9/114.933 -> flight
  114.967-115.167 -> GLIDER card 115.2-115.267 (wings + head read; still the brightest card) -> cut 115.3. Beetle: loop + axle
  116.3-116.4 -> silhouette 116.433/116.467 -> flight 116.5-116.567 -> WHEEL card + tag 116.6-116.833 -> cut 116.867.
  Encounter: swirl 107.2-107.267, row cut-in 107.3-107.433, wide 107.467-107.567 (hop + landing), three-shot from 107.6 with the pop.
- jade_canon_crops_m2.jpg (107.6 front hair up; 114.1 OTS (out of focus by design); 122.0 recruit hair down: band, patch side,
  straps, sneakers, midriff, headphones at the neck) + stills_m1/m2_107.3 / 107.6 / 114.1 / 122.0.jpg at 1080p.
- Beat-timing list (M2): ladybug launch frame 3223 (107.433, 8th 107.44: on), landing frame 3227 (107.567; beat 107.641: 0.07 s
  early, deliberate = the frame before the k08 cut), pop peak ~107.65 (on the beat); caterpillar over the top step 107.3 (not a
  beat; hidden behind the row from the cut-in camera: open problem); Charlie's T2 step 112.1 -> 112.32 (8th 112.33: on), back
  113.5-113.68 (T3 cue); T4 step 115.3 -> 115.54 (8th 115.505: 0.035 late), back 116.7-116.9; conversion frames firefly 3398
  (113.267 for cue 113.28), moth 3449 (114.967 / 114.95), beetle 3495 (116.5 / 116.51), caterpillar 3554, ladybug 3560; hold frames
  = the two before each; wheel roll-off 116.81 (card held 0.3 s = 0.7 beat); all cuts on the half-turn cues (EH[0] 112.33, T3
  113.68, SENT 113.82, T4 115.30, T5 116.88, 117.65, k09 118.525). No new motion warnings (talos_r5's own warnings print at setup).
- Open after M2: the caterpillar spill is hidden behind the row in the cut-in (it pours over the top step at x ~1214 while the
  camera looks at the row from the +z side: the beetle / moth cover it); the GLIDER card is brighter than the other two (white
  flight sparks + the glider's pale voxels under the key); the 107.3 cut-in is only 5 frames long before the hop wide.

## M2b (coordinator's two narrow fixes after the M2 review) — DONE 2026-10-17 ~12:20; unit done for the round
1. GLIDER card: a HELD pose — the moth's hover path is frozen from the conversion frame to the T4 cut (bugsAt `tk`), the
   conversion sparks for the moth last 0.2 s (gone before the card), the updraft was already off; the card look is the battle
   default (same as the LAMP card) + look.r5.beam 0; camera over Jade from the +z side, high (up 104 -> 122 over the card, fov 34 ->
   38), the glider against the dark sea / checker floor (the inland side was tried: the arch column fills that frame). Still:
   out/review/battle_r5/m2b_115.233_glider_card.png next to m2b_113.5_lamp_card.png (m2b_glider_vs_lamp.png side by side): solid
   glider, wings + moth head readable, tag above, Jade's head below.
2. Row cut-in 107.283-107.467: camera moved to the row's left end (1300, 40, 600) -> (1268, 30, 478), fov 46, look.r5.focus on the
   firefly / beetle (1300, 24, 494), dofAmount 0.18: the three waiting bugs sharp (moth cropped at the right edge), the caterpillar
   spilling over the top step at the left (path point 107.3 = (1218, 440)). Still: m2b_107.35_row_cutin.png.
- No-flag A/B re-verified on the FINAL code (live tree vs a shadow tree running the backups), 1080p, default path and review
  path, 109.2 / 116.5: max pixel diff 0 on all four. Scratch (s5-s7, m2b pngs, shadow tree) deleted.
- Not re-rendered: m2.mp4 (per the coordinator: stills only). The stitch should re-render 107.15-123.354 from the current code.

## REQUESTS
- **talos_r5** (the ladybug hand-over at 107.15): my first frame (107.283, after the 4 swirl frames that render YOUR scene) puts a
  small ladybug on Charlie's cap: makeBug('ladybug', { s: VOXEL * 0.6, stance: 'crawl' }) (~12 u long), origin at
  headTop(charlie) + (-3, -1.5, 0) (headTop = the bbox top of his figure = the cap crown), rotation.y 0.4, anim 'idle'. Please end
  94-107.13 with the same bug at the same offset / scale so the swirl frames carry it; it launches off the cap at 107.433.
- **look_r5**: (1) column M3 (1545, 520) stands between the encounter camera and the party 107.283-107.615; I pass
  `look: { r5: { columns: { cull: ['M3'] } } }` on that shot: please confirm LOOK({ r5 }) is honoured (it was not culled in my
  M1 render). (2) The OTS shots pass dofAmount 0.3 / 0.22-0.26 (k08b chain); I will switch to r5Shot({ dof, focus }) if you prefer.
- **act4_r5**: items 1-6 of your request implemented as written (♥ window top-right per the coordinator's relay). The menu
  closes at 144.0 (an earlier build of mine held it to 147.0: fixed). Hand-over camera unchanged (fov renders as 45, see above).
- **creatures (promote later)**: (1) a `glitch` body state (checkerboard material swap, frame-hashed) and a `silhouette` state
  (flat white) as official set() params (done here by swapping mesh.material from battle_cast.js); (2) the cap-rider ladybug
  (a second small instance); (3) the caterpillar spill = the 'bug' anim with `overflow` driven by the scene.
- **coordinator**: render.js `--r5` is act4_r5's (and look_r5's note says they added one too): please dedupe; my scratch
  render_r5.js is deleted.

## Beat-timing check
- Ladybug hop lands on frame 3227 (107.567); the beat is 107.641 (Jade's stop cue 107.615 = frame 3228 = the cut): 0.07 s early
  (deliberate: the landing is on the frame before the cut). Pop peaks 107.65.
- Charlie's T2 step arrives 112.32 (the 8th 112.33: on); T4 step arrives 115.54 (beat 115.706 / 8th 115.505: 0.035 s late of the
  8th). Returns are between beats (unseen: off-frame / under the next cut).
- Conversion frames: firefly 3398 (113.267 for the 113.28 cue), moth 3449 (114.967 for 114.95), beetle 3495 (116.5 for 116.51),
  caterpillar 3554, ladybug 3560: the morph starts on the cue's frame; hold frames = the two before.
- No motion warnings added (the k09 motion track is unchanged).

## Open problems (honest, M1)
1. The encounter wide: the three waiting bugs are far (~10% of the frame height) and the caterpillar's spill behind the rim is not
   readable from the party's side; the "lock" reads as "bugs over there" rather than the spill. The ladybug's hop + pop is the
   readable beat. Column M3 stands between Jade and Charlie until look_r5 culls it.
2. The k08 three-shot has no arch behind the party (the stage arch is side-on from +z) and no 舞台 sign; it reads as k08 through the
   low angle, the purple dusk, the spotlights and the columns.
3. Over-the-shoulder shots: the hero's cropped arm / hair at the edge is a big flat slab at 1080p (Charlie's hand at 112.5, Jade's
   hair at 115.0). Acceptable as a foreground layer, but a per-shot DOF (look_r5) would help.
4. The hit-stop freezes heroes / bugs / fx only; particles (sparks) and the UI run. The 2-frame white silhouette on a static camera
   reads as a flash; with --mblur the held frames will stay crisp while the rest blurs (intended).
5. The caterpillar spill moves a rigid long body over the seat steps (it intersects the steps); its 'overflow' segments grow
   behind it.
6. Not built: look_r5's per-shot API calls (their preset lands for free; I only pass the column cull on one shot), two-colour per
   shot, DOF pulls. No new creature behaviour was added to src/core/creatures (read-only), everything is driven from battle_cast.js.
7. The GLIDER card (115.0-115.3): the camera (over Jade from the +z side, lifting with the updraft) looks toward the sun; the
   landing voxels + bloom blow out to a white blaze with the wings readable only at the edges (stills_m1/115.25.jpg). Wants a
   per-shot exposure / keyAz from look_r5, or the camera kept lower (then the glider leaves the frame top). The hold frame
   (114.933) and the flight (115.0) read.
8. Canon (crops): 107.6 Jade holds a pencil in her hand WITH the bun (the v3 'draw_rainbow' stop pose on the hair-up figure):
   pre-existing in the approved v4 frames, not changed here; 114.1 / 119.5 / 122.0 pass (one-line RARE EARTH, sleeve band + patch,
   baggy cargo pants + orange straps, white sneakers, hair down with the giant pencil).
9. The UI "faces never covered" rule is kept by the band's position only; no per-frame face avoidance.
