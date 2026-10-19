# ACT IV SHIP checkpoint (team: ACT IV) · 123.354-173.02 rework per docs/game_design_acts3-5.md

## >>> NEXT STEP (cold resume) <<<
ALL DONE (2026-10-16 ~04:35): M1, M2, M3 approved; the full second-half cut out/review/half2_v1.mp4 (86.385-207.2, native
heroes 1.3, 3624 frames, no black frames, seams 107.15 / 123.354 / 173.02 checked by frame index: out/review/half2_v1_seams.jpg,
QA notes appended to out/review/half2_v1.log, sheet half2_v1_sheet.jpg one per bar). Nothing running; temp files cleaned.
Next (only if asked): Act IV polish notes from Jade's viewing.
M3 APPROVED (hair-up stays at 123.55). LAST JOB (05:00): full second-half review cut out/review/half2_v1.mp4 (86.385-207.2,
--fig native --figscale 1.3, 3 workers, TMPDIR=engine/out/dev/tmp) + half2_v1_sheet.jpg (one per bar) + log. Then: seams 107.15 /
123.354 / 173.02 by frame index inside the file, frame count = 3625 +-1, no black frames; if a range failed, render ranges
separately and ffmpeg-concat; clean temp; report.
M3 DONE and STOPPED AT THE GATE (2026-10-16 ~04:45): waiting for the coordinator's review of out/review/act4/act4_m3*.
All three milestones rendered: act4_m1.mp4 (139-156.24, older; M2/M3 supersede its tail), act4_m2.mp4 (147.22-175.02, re-rendered
after M3), act4_m3.mp4 (121-143). Backups before M3: out/bak_act4/{world4,main3d,glyph}_m2.js, montage_m2.js.
M3 how it works (all "(act4 M3)" markers):
- world4.js patchErase: ERASE.uShell (1 for every non-rebuilt Act IV frame): behind the rub front, terrain materials (plaster
  tags rock/meadow/mesa = TERRAIN) and horizontal faces + bases go to paper; everything else is a lifted (16-50 u, continuous
  noise, slow bob) coloured-pencil-hatched skin; materials tagged act4keep (drawnStrip, yiBridge, flowers, the avenue cypresses)
  stay whole; shells part around the camera (<90-170 u); uShellFade dissolves them 136.21 -> 137.03 (band cut); shellShadows(off).
  Inert when eD >= 0, so the 123.354 seam is byte-identical (verified frames 3699-3703 max diff 0).
- main3d.js: no colour drain at the rub (colour stays); paint full on the shells; Jade: jade_bun_pull at K.bunIn 123.55 -> idle
  hair up (pencils in the bun), 129.385 jade_bun_pull -> jade_twin_draw -> draw_graphite hair down (~129.9); painter's-gesture
  camera moved to her left; pageFeatures (lamp by Jade + light, button, wheel, glider circling, the caterpillar bridge crawls into
  the spiral gap GAP [0.5, 0.6] at ~131.75); trampoline folds after the landing; the coloured vantage 丶.
- glyph.js: uColorShards = 1 (each air fragment a hue, hatched) + uLampP/uLampK warm lamp light; ignition unchanged.
- montage.js (M2 fix): callbacks' own UI skipped (renderer.render after their post.render); 9.2 callback -> 12.6.
Known: the 123.18 hair-up starts in Act IV at 123.55 (Act III owns 123.18-123.354; the battle team could start it at 123.18);
the coloured 画 reads paler than the graphite one against the sunset until it ignites; the rub front only reaches the stage at
the 125.769 cut (the far hills/temples are seen turning into shells first).

M2 APPROVED (04:30). Montage caption fix DONE + act4_m2.mp4 re-rendered: montage.js renderCallback now skips every
renderer.render() a callback makes AFTER its post.render (its subtitles, captions, HUD panels, battle windows); the 9.2 callback
(char-select bio box overlapped our lyric) is now 12.6 (Jade at START under 一笔一画). Backup: out/bak_act4/montage_m2.js.
NOW: M3 (123.354-141.0). Read the M3 brief in this file's header + docs/game_design_acts3-5.md 123.18-143.48. Render act4_m3.mp4
121-143 (audio) + sheet + stills + Jade 3x + seam 123.354 -> report, STOP.
M2 DONE and STOPPED AT THE GATE (2026-10-16 ~04:20): waiting for the coordinator's review of out/review/act4/act4_m2*.
Do NOT start M3 until notes come back. M3 = the Eraser rule fix 123.354-141.0 (graphite-only rub, coloured shells floating over
the page, lamp lights the shards 129.36-135.6, caterpillar bridge spans one gap on the climb, bun hair 123.18 -> down 129.36,
lock exact at 139.395). Renders: export TMPDIR=engine/out/dev/tmp (the /tmp tmpfs is full); clean it after.
M2 deliverables (out/review/act4/): act4_m2.mp4 (147.22-175.02, 960x540, audio), act4_m2_sheet.jpg (35 half-bars),
m2_stills/ x18 1080p + act4_m2_stills_sheet.jpg, act4_m2_jade_canon_3x.jpg, act4_m2_seam_123.354.jpg (max diff 0),
act4_m2_handoff_173.02.jpg (Act IV adds the bar + timer; Act V frames 5191+ unchanged, max 17-20 on a few px).
M2 notes: the pencil-tip shot (172.44-173.02) keeps v7's background via `legacyBG` (all baseObjs, arch, ink strokes, old ride
Eraser position at sc 62, legacy sprite lamps' light) so Team D's match cut is unchanged. Montage callbacks of act4.main set
api.callback (no subtitle of their own time, no battle UI). Team D already draws the bar after 173.02 (act5/hud5.js, R-C4).

M1 APPROVED by the coordinator (cut 149.786, cap 149.388 and the lookFrom handling accepted). M2 IN PROGRESS (started ~01:15).
Coordinator M2 additions: (1) on joining the Eraser SHRINKS to party size (squash-and-pop ~149.39-149.79), party-size from
149.786 everywhere; (2) favour angles that show Jade's FACE in the rebuild + gang shots; (3) the dark graphite 画 fragments
may be hidden after 149.786 (world rebuilt). STOP after M2 for review. Resume block before 3:40 even if unfinished.
M2 sub-steps (status in "M2 log" below): a) shrink-on-join  b) bar LV2->LV3 (build_bar.js additive + 3D overlay)  c) rebuild
149.786-154.26 (Jade redraws, Eraser tidies)  d) gang 154.26 all nine wide + bar 0->99  e) cart 160.83-161.715 + ride
f) 165.87 button launch through 出发  g) speedrun montage (split timer, cart, bar on screen)  h) 172.80 Eraser rubs the 99,
173.02 100% gold  i) render + seams + report.
(old M1 note follows)
M1 DONE and STOPPED AT THE GATE (2026-10-16 ~01:10): waiting for the coordinator's review of out/review/act4/act4_m1*.
Do NOT start M2 until notes come back. Then: M2 (rebuild 149.786+, build_bar.js LV2->LV3, gang, cart, 出发 launch, speedrun
montage, 172.80 Eraser rubs out the 99, 100% gold at 173.02), then M3 (Eraser rule fix: colour shells, lamp + caterpillar
bridge on the climb, bun hair at 123.18 -> down at 129.36).

## Rules (from the coordinator brief)
- Own src/scenes/act4/*; additive build_bar.js change allowed (M2; back it up first (done: out/bak_act4/build_bar.js.orig);
  Act II identical before 77.76). Don't edit act3/*, battle_ui.js, creatures, heromodels, act5. Core needs -> CORE_REQUESTS.md.
- Keep the 4 "(battle scene v2)" edits in main3d.js. 123.354 seam frame-exact. 173.02 hand-off per teamC_handoff_D.md.
- Review renders: --fig native --figscale 1.3 (heroes ~69 u, use g.hand()). Jade canon at 3x in key stills.
- Checkpoint after every milestone. Disk ~33 GB free: delete frame dumps.
- Backups: engine/out/bak_act4/act4/ (src/scenes/act4 before ANY edit), engine/out/bak_act4/build_bar.js.orig.

## Tools
- Stills: scratchpad/ACT4/st.sh <dir> <res> native t... ; sheet: .venv/bin/python scratchpad/ACT4/sheet.py <dir> [cols]
  (scratchpad = /tmp/claude-1000/-home-jade-Documents-vibesong/403d79b5-caea-45a3-8d32-3d77a3ecf8ab/scratchpad)
- PRE-M1 BASELINE TREE: scratchpad/ACT4/eng_old (symlinked engine with the backed-up act4; render.js copied; project dirs
  linked in scratchpad/ACT4/). `cd eng_old && node render.js ...` renders the pre-edit Act IV for frame diffs (seams).
- M1 render: node render.js --show main --fig native --figscale 1.3 --from 139 --to 156.24 --fps 30 --res 960x540
  --mp4 out/review/act4/act4_m1.mp4 --audio --workers 3 --sheet out/review/act4/act4_m1_sheet.jpg --sheet-every 0.7975 --sheet-cols 6 (~35 s)

## M1 (DONE): the final boss joins (141.0-149.786)
Deliverables out/review/act4/: act4_m1.mp4 (139-156.24, 960x540, audio), act4_m1_sheet.jpg (22 half-bar frames),
m1_stills/act4_m1_<t>.png x12 1080p + act4_m1_stills_sheet.jpg, act4_m1_jade_canon_3x.jpg, act4_m1_seam_123.354.jpg
(frames 3699-3702 pre-M1 vs M1: max diff 0), act4_m1_handoff_173.02.jpg (166.5/172.6/173.0: only the background Eraser model differs).
Beats: bars 141.008 142.605 144.201 145.798 147.394 148.989 150.584 (half-bar 0.797 s).
- Shots (cuts on half-bars): S1 141.407 Eraser close (legacy cam) | S2 143.403 JRPG side view: Jade jumps off the vantage,
  party + 5 features walk up | S3 145.798 reverse from its front corner onto the party (Jade writes in the air) | S4 147.394
  ENTER, glider grows x1.55, swoops under Jade (147.6) and lifts her (147.793), crane-follow | S5 148.191 close on the face over
  Jade: PAINT = hatched pink wavefront (linear 148.191-148.64) + pink stroke from g.hand('R'); RUN 148.59 = 3 rainbow rings
  sweep up, smile at 148.72 | S6 148.989 Charlie in profile: hatless 'pull' holding his cap crown-down, the second cap pops out
  on the beat, hat back on, 'throw' (release 149.189), camera cranes/tilts with the cap, lands 149.388 (cap:true, squash);
  joined 149.22 (UI) | cut to the rebuilt world at K.rebuilt = 149.786 (was 149.22).
- Code: world4.js `eraser` (creatures makeEraser lod hi: bridge mountain, page, boss) + `eraserS` (lod mid: after joining,
  rebuilt world) with faces warmed; flyCap/heldCap; rings (ringMat); feats {lamp, glider, wheel, bridge, button} (makeFeature,
  s = 2.0*VOXEL, patchPaint hero). main3d.js: "(act4 M1)" markers: K.join/rebuilt/s2-s4/lift/paint/run/ship/capLand/release;
  recruitHeroes/gliderAt/featureState/ringState/recruitCam; eraserAnchor -> bui.update anchors (♥+1 tags at its upper corner).
- PROJECTION: lookFrom() (legacy shots) now copies the construction projection P45 (fov 45, near 0.5) every call = exactly what
  every legacy shot has always rendered with; new shots use shot(pos, tgt, fov) (real fov, projection updated). Don't "fix"
  lookFrom without re-verifying every legacy framing and the 123.354 seam.
- Interim (M2 replaces): bugState shows the 5 creature features on the stage 149.786-161.728 (old sprite bugs retired there);
  from K.build (161.728) legacyBugs() keeps the old sprite lamps/wheels/gliders + lamp lights byte-identical so the ride /
  出发 / pencil-tip hand-off frames match v7 (turning those lights off darkened 172.6).

## Known gaps after M1 (for M2/M3)
- Scale jump at the 149.786 cut: the boss is 320 u tall at EP2, the party-size Eraser 99 u on the stage (M2: shrink-on-join or re-stage).
- Jade is seen from behind in S4-S6 (her face reads in S3 only).
- The dark graphite 画 air fragments read as black blobs in some recruit shots (M3 makes the shards coloured).
- Features appear from 143.4 (walking in); M3 should already show the lamp/bridge from 129.36.
- 129.6: hero placement on the erased page untouched (M3).

## M2 log
- 01:40 CODE WRITTEN (untested): build_bar.js += BAR2/buildAt2/BuildBar2 (additive, Act II untouched); NEW src/scenes/act4/hud2d.js
  (makeAct4HUD: bar + split timer + gold splits + pixel cart; CUTS moved here from montage.js); world4.js += makeCartRig/CART,
  moreWheels, cartRig, cartM/cartRigM (montage copy, top-level in W.scene); main3d.js "(act4 M2)": rebuild wave from RB
  (ERASE uRC/uRR + paint from "functions"), 画 fragments hidden from 149.786, arch hidden, Eraser shrink 149.45-149.77 to
  PARTY_SC 46, eraserM2, m2Heroes, m2Features (chunks, strays, gang, roll assembly on 16ths), cartFrame (start line x 1440,
  launch 165.87), gate gap 62 (14 again in the pencil shot), m2Cam (R1 R2 G1 G2 ROLL BUILDa BUILDb) + camTail, HUD in render,
  api.cartFly/noHUD for montage; montage.js: hud on every cut, renderWithCart (wraps post.render) for 3D callbacks, cart2d for 2D.
  NEXT: test stills 149.5-173 -> fix -> render act4_m2.mp4 (147.22-175.02) + seams (173.02 vs old: pencil shot) -> report.
