# Team C checkpoint · ACT IV (123.354 – 173.02)

## State: v4 review rendered (out/review/act4_v4.mp4 + _sheet.jpg). v4 pass done: classic pink Eraser (#f2788f / top #f7a1b0);
## dusk Eraser half-sunk & rising beyond the horizon, rub spreads radially from it (trails appear as the front passes);
## post-lock colour return = hatched coloured-pencil wavefront on the page (world geometry hidden until the 143.48 cut,
## so no ruins pop into the glyph); 出发 low/close + tracking with glare reduced; colouring close over Jade's shoulder with
## a rainbow pencil stroke to the colour front; montage now ends 172.44 (cue act4.pencil_shot) and 172.44–173.02 is a
## low tight pencil-tip hatch shot that match-cuts into Team D (see checkpoints/teamC_handoff_D.md for the stamp layout). Everything below is implemented and verified in stills.
Files (all mine): src/scenes/act4/{glyph.js, eraser3d.js, overlay.js, paper.js, world4.js, main3d.js, montage.js, assets/*.jpg}
Shared edits: src/show/main.js act4 block (4 entries), data/cues.json `act4` block (json re-dump reformatted act1 arrays,
content unchanged), CORE_REQUESTS.md R-C1.

## Key facts
- MEASURED: timing.json final-chorus times are ~0.3 s late. Real: band cut 137.03, lone hit 138.595, SLAM 139.395
  (808 swells to full ~139.70). Bridge triplet roll 133.105–135.81. Snare roll 16ths 160.83–161.715. All in cues.json act4.
- The lock: glyph.js builds 画 from MMAH strokes; air strokes 0–5 are fragments on rays from E (Jade's eye) at random
  depth+tilt with projective shader; stroke 0 is "coherent" (one plane) so it snaps on the lone hit; strokes 6–7 (凵)
  are the Eraser's rub trails on the paper ground, projected through E. Camera reaches E exactly at the slam frame.
- Base world = prototype talos_world.buildWorld (Team B's act3/world/build.js exists but no WORLD_API.md yet and it is
  mirrored: sun at +x, stage on mesa B). Reconcile = map all Act IV constants (world4.js J/E/SPIRAL/GROUND, main3d.js
  STAGE/ERS/GATE_X/EP1/EP2/RC, base pos (250,0,0)) through one frame transform, set SUN from their SUN_DIR, swap BASE.

## Next steps
1. Reconcile with Team B world when WORLD_API.md lands (see above).
2. Polish: Eraser close-up 141.4 static; bridge 129.4 shots still face the low sun (bloom); bridge erase could
   show trails being rubbed by the Eraser itself.

## Placeholder slots
- jade_sing_bridge_1 125.769–128.180 (Jade sings 一笔一画 都是我的, PAPER, from paper_expr_jade v5 panel 3)
- charlie_listen_bridge_1 / ricky_listen_bridge_1 128.180–129.385 (silent reactions, split frame)

## Core requests: R-C1 (deterministic video clips + /media mount + mp4 MIME) OPEN; R-C2 (voxel back views + charlie/ricky back strips) OPEN

## v5 bridge (2026-10-15): PAPER cutscene clips wired (src/scenes/act4/paper.js)
- `CLIPS` constant = single place to swap takes. jade_sing = media/cutscenes/jade_sing_bridge_1/fallback_card_480p_portrait_lag0.00.mp4
  (full frame, frame = round((t - 125.769) * 30), core/video.js VideoClip). Split frame 128.18–129.385: Charlie | Ricky,
  centre-50 % crops (Ricky window 0.20–0.70); each slot auto-prefers *_play_bridge_1 (playing guitar) and falls back to
  *_listen_bridge_1. If a clip fails to load, the old framed-still PLACEHOLDER slot comes back.
- Handwritten subtitles stay on top (Jade card: placed beside the card at x 0.72 so they don't cover her sheet).
- Review: out/review/act4_v5_bridge.mp4 (+_sheet.jpg), 120–145 with audio.
- Note: Team B's act3 now hands over at 123.354 from their mesa-stage world; my 123.354 shot is still the prototype world
  (visible world change on the cut) until WORLD_API.md lands and I swap the base.


## v6 (2026-10-15): reconciled onto Team B's shared world (WORLD_API.md) — out/review/act4_v6.mp4 (120–175, audio)
- world4.js now builds on `getWorld` from src/scenes/act3/world/build.js (the prototype talos_world is no longer used).
  Anchors live in their world: sun = SUN_DIR lowered to dusk (same heading, eased in over 123.35–124.95), page height
  GY = MESA_B.top, vantage J (1150, 100, 470), spiral behind it, EB (dusk Eraser) (1250, 0, -9000) behind the hills,
  STAGE = mesa B (1330, 10, 450), 出发 gate G0 (1505, 10, 450) at mesa B's sea end (the run launches off the edge).
- All Act IV objects live in one group `root` (visible only inside main3d.render via Wd.begin/end). The erase patch on
  Team B's materials is inert unless uEOn = 1 (only during Act IV frames); end() restores base visibility; the montage
  calls Wd.restoreSun() before rendering Act III callbacks. Team B files untouched.
- 123.354 hand-over: first frame = rap.js's last camera (1380,52,610)->(1350,36,430) fov 52, same band / bug-features /
  books / monolith / giant pencil state, same look (LOOK rays .35 dof .15 sat 1.22 -> eased to dusk), and Act III's
  SmoothSubs subtitle slot (TALOS lines now use SmoothSubs; erased-page lines 36/37 stay handwritten).
- The world geometry now stays erased until 149.22 ("the rebuilt world"); 139.4–149.22 is the page + the hatched colour
  wave (the colouring happens there, so nothing blocks it). Lock verified exact at 139.395/139.40.
- Polish: 141.4 Eraser close-up has a slow push, breathing squash, beat blinks (142.205, 143.2), a lean; erased-page shots
  129.4–136.2 re-aimed off the low sun (orbit from the sun side, side-on climb) + bloom 0.2.
- Montage: callback frames render without their own subtitles (act3 SmoothSubs + 2D Subtitle widgets hidden); only the
  live chant (line 42) is subtitled. Plaster callbacks now 82.2 / 87.0 / 92.8 / 108.4 (all three heroes readable), colour 121.0.
- Team B fixed the moth flip in rap.js (bug scale is now (±pop, pop, pop)); Act IV's hand-over now sets bug scale
  (±1, 1, 1) after W.put to match (verified identical at 123.32 / 123.367).

## v7 (2026-10-15): matched Team B's CRISP golden-hour look — out/review/act4_v7.mp4 (120–175, audio)
- main3d.js LOOK spreads `CRISP` from act3/common.js (haze/AO/warm key/cool shadows/contrast/heroFill/heroRim); Act IV's
  explicit atmos values are multiplied by CRISP.atmos. The 123.354 continuity look is exactly rap.js's
  LOOK({ rays .35, dofAmount .15, sat 1.22 }) (no fill override any more: CRISP fill 0.95) and blends field-by-field to dusk.
- Verified: 123.300/123.333 (Act III) vs 123.367/123.400 (Act IV) identical in the v7 video; montage callbacks
  82.2/87/92.8/108.4 render with the new look (identical to direct act3 stills).
- My own voxel heroes (Act IV page shots) don't get Team B's heroFill/heroRim (that's on W.heroes' materials only).
- (Team B, resolved) the 108.46 hero-brightness difference was a one-frame ffmpeg -ss seek offset in a mid-stutter shot,
  not a look bug. Compare video frames by index (frame = round((t - start) * 30)) or with direct stills.
