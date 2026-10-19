# passB_stage_3d (v4 Pass B, unit stage_3d), 2026-10-18

Brief: docs/v4_passB_brief.md (row stage_3d). Gate: M1 (1080p signature stills beside targets + cut list), then STOP.
Backups (before any edit, 16:32): engine/out/bak_v4b/stage_3d/{act3,act3/world,act4,act5,show}/ (every owned file).
Scratch: engine/out/dev/passB_stage_3d/. Review: engine/out/review/passB/stage_3d/.
Render flags (review): `--fig native --figscale 1.3 --figres 2.5 --look k08b --workers 1`, `export TMPDIR=$PWD/out/dev/tmp`.
Paid gen: $0 so far (code only).

## Log
- 16:32 baseline 1080p stills of every beat I touch: out/dev/passB_stage_3d/base/ (28 stills, 40 s).

## STATE: M1 reached (2026-10-18 ~18:10), STOPPED. No section mp4 rendered (waiting for the coordinator's go).
- M1 sheet: engine/out/review/passB/stage_3d/m1_sheet.jpg (targets 05/07/08/09/10 beside the 1080p stills; canon crops 3x).
- 1080p stills: engine/out/review/passB/stage_3d/m1/m1_<t>.png (26). Cut list: engine/out/review/passB/stage_3d/cutlist.txt.
- Render: `export TMPDIR=$PWD/out/dev/tmp; node render.js --show main --stills <t:path,...> --res 1920x1080 --fig native --figscale 1.3 --figres 2.5 --look k08b --workers 1`
- Paid gen: $0 (code only). Helper scripts (sheet / cut list / projection): out/dev/passB_stage_3d/*.py.

## Changes (file:line, all marked `(v4b stage_3d)`; everything rides the r5 default, `--r5 0` gives the round-4 staging back)
- NEW src/scenes/act3/carved_slab.js: makeCarvedFace(): a word CARVED as voxel-run geometry (letters cut 3 u into the face; groove floor
  dark graphite for FIXTURES, an unlit HDR rainbow (gain 3.2-4.8, red -> violet left to right, a fill sweep) for FUNCTIONS); optional
  pencil-hatch overlay with the letters cut out.
- NEW src/scenes/act3/card05.js + src/show/main.js:27 (act3 block): `act3.card05` 107.238 -> 107.641. Plays the paper unit's clip from
  CARD05_SRCS (media/cutscenes/card05_band_stage/card05_band_stage.mp4 or card05_band_stage_1/card05_band_stage_1.mp4, frame-exact
  through core/video.js) or, until it lands, the still 05 (copied to src/scenes/act3/assets/card05_placeholder.jpg) with a 6 % push;
  the one lyric style (line id 27) on top.
- NEW src/scenes/act3/slab_insert.js + src/scenes/act5/aerial.js:8,18,124,142,154: drop 2's accents cut to a 3D insert in the shared
  world (mesa B stage): the trio FRONT-ON, a 230x160 slab slamming up behind them with FIXTURES (180.21-181.125) / FUNCTIONS lighting
  rainbow (183.30-183.87), dust, sparks, a flash, a lens punch. The aerial plates play around it unchanged.
- drop_r5.js:33-55,279,306,362: the 丨 leaf is the carved slab (widened EAST only to 196 u; west edge = Charlie's glide lane, hinge /
  landing / strut logic unchanged, strut moved to the new east flank); FIXTURES grooves until 89.95, FUNCTIONS fills rainbow over 0.12 s;
  new cut 86.819 (8th) to the A1F hero frame (still 09: low, long lens behind the party, the slab ~40 % x 65 % of the frame); A3 re-aimed
  on the slab (still 10: the beam crosses in front of FUNCTIONS to the crystal, then to the lit receiver).
- battle.js (stage + rap + flood):
  - :91-145 BAND_T / STAGEB / BAND_COL / BAND_KEY / BAND_CUT / T1_CUT, R5_LADY_LAND moved to the row front, SENT_CUT 113.885, JOINT,
    the ring-flood constants (RSTANCE on Jade's jump line, RCAM, RPUSH).
  - heroesAt :328 the band on the stage front facing the seats (hair down, pencil-mic 'sing'; Charlie + Ricky 'chord').
  - spots :500 band lamps above-front toward the seats, gold / rose / teal, Jade's spot at 0.28 (face held), visible shafts.
  - bandJade :240 her free arm flings out on her stop; lip sync on line 27 (native face rig).
  - shots :659-695 107.283 wide (now under card 05), BAND_CUT 107.641 front-on three-shot held to T1_CUT 110.45 (the taunt shot removed);
    the ring flood's FRONT-ON plant 118.927 and the HIGH pass 119.732; T1 / SENT on the grid.
  - :736-739 the bug row hidden inside the band shot (just outside its frame edge; seen in the wide).
  - recruit :458 THE JOIN as action: the five wait in a row across the floor, each hops into its hand-over spot on its 8th
    (battle_ui recruit joins) with a pop + a rainbow spark burst (:766); the button pops last.
  - setupK9 :863-887 ring mode: Jade leaps to RSTANCE and lands FACING the lens (no k09 lunge / push lean), the pencil leans to screen
    left across her body; she looks at the lens.
- flood_wave.js:37,187,267,334: floodRingOn() / ringR(): the wave is ONE ring from the plant (14 -> 210 u by 120.135, continuous with the
  race; low round her, rearing to ~140 as it reaches the lens: it passes through the camera ~119.45-119.7), floor streaks + tip spray kept.
  `?flood4=0` gives the k09 horn back.
- verse2_r5.js:28,256 Room B opens on a FRONT-ON medium of Jade singing "my imagination" (101.0 -> 101.955), then B1.
- turn.js:33 the cut to the wide 79.267 -> 79.2025 (8th; -2.5 ms).
- common.js:10,110 DOF cap: DOF_CAP_PX = 8 (1080p) on look_r5's blur radius (was 24) via r5Shot({ dofMaxPx }) after every Act III frame's
  look; act4/main3d.js:1069 the same after Act IV's r5Shot.
- act4/main3d.js: 445 the vantage holds to K.down (143.48) under r5; 829-861 V4B cuts: 142.605 front-on reaction (held into paper #06,
  F1 now hidden under the card: no 2-frame flash), 150.982 R1b front-on, swarm cuts 155.363 (front-on Jade) / 156.956 / 158.547 (near
  three front-on) / 160.138; 849 roll angles on 161.132 / 161.331 (was 161.43); 1057 front-shot focus in the r5 chain.

## Results (M1)
- 07: front-on plant, the ring round her (still 07's composition), the wave through the lens, the ring racing out, race + wide kept, the
  joins as hops + sparks. Zero UI from 119.0 (clear frame; battle UI draws nothing there).
- 08: card 05 slot 107.238-107.641 (placeholder still); front-on band shot 107.641 -> 110.45 with no cut (coordinator: 舞台 109.09-110.41
  must not be split). CLEAN SPACE for 舞台: top left and top right (the sky beside the arch columns, above the band's heads, ~y < 28 %),
  gloss top centre; the type unit's overlay already lands there (110.2 still).
- 09/10: both drops; the slabs are the biggest things in frame; FUNCTIONS rainbow.
- Front-on hero shots: 101.3 (Act III talos), 107.6-110.45 (stage), 119.0-119.5 (flood), 142.8 / 151.3 / 155.8 / 159.0 (Act IV),
  180.6 / 183.6 (drop 2).
- Cuts: see cutlist.txt. Snapped: 79.27, 107.15 (card), 107.6, 110.41, 113.82, 161.43; new cuts all within 20 ms. KEPT off-grid, on
  measured hits: 101.0 (verse2's room swap on 'my'), 121.405 (the recruit accent; REVEAL keys Act IV), 180.21 (the aerial's FIXTURES accent).
- Canon (3x crops in the sheet): headphones round the neck VERIFIED on the native 2.5 models (orange-rim cups on the collar: 101.3,
  142.8, 155.8, 180.6; at 108.9 the white jacket under the spot washes them); hair down whenever pencils / the giant pencil are in her
  hands; straps + baggy navy pants. The k09/flood Jade is hunched over the shaft (not still 07's upright wide stance).

## Open
1. 113.82 一句话 (and 135.6-138.7 "I think about stuff I read", the approved one-move lock) still sit over the back of Jade's head.
2. 07: Jade bends over the shaft (the hold IK) instead of still 07's upright wide stance; the lens is fully inside the wave ~7 frames.
3. 08: Jade's jacket still bright under the spot at 108.9 (face holds); Charlie's acoustic reads small (model).
4. Colour hooks H9-H13 (COLOR_REQUESTS.md) read; to apply after M2: the FUNCTIONS floor is already an unlit HDR emissive (gain >= 3.2,
   H11); the band cones are additive (H12: will tag the meshes / pools); H13 stamps in battle_ui.
5. Under the band shot (107.64-110.45) the bugs' glitch-dance taunt is no longer seen (the row is in the wide only).

## M1 review fixes (coordinator) -> DONE, then M2 (2026-10-18 ~17:20)
1. Band 107.64-110.45 dark around the light: battle.js BAND_LOOK (dim 0.32, hemi 0.4, env 0.28, fill 0.25, haze 0.12, rays 0, bloom 0.07,
   exposure 0.62, hero fill 0.34) + BAND_R5 (sun / hemi gain 0.4, sky 0.5, vignette 0.55); pools 0.85, cones 0.16 / 0.24; Jade's spot 0.55
   (face holds). Checked with `--look k08b+cs`.
2. card05.js plays media/cutscenes/paper_0147/paper_0147.mp4 (CARD05_CLIP_T0 107.15: clip time = t - 107.15), the still is the fallback.
3. Flood: chest-high grips in ring mode + camera 12 u higher; still bent over the shaft (no upright wide-stance plant in the motion library).
4. Drop-1 slab: camera (835, 30, -380) fov 21: the slab ~78 % of the frame height, the word the biggest thing in frame.
5. 一句话 front-on: battle.js SENT_CUT 113.885 -> SENT_OTS 114.492, Jade front-on colouring the moth (left foreground); then the OTS / GLIDER card.
Post-M2 cut fixes (found by the M2 cut scan; verified by code, not re-rendered as mp4): verse 2 holds to card 05 (the battle swirl is
not drawn under r5: no cut at the 107.15 seam); card05 entry 107.23 -> 107.62 (frames 107.233 .. 107.600; the band shot from 107.633);
act4 R2 cut snapped to its frame (152.167, was 152.200).

## M2 (540p, audio, `--fig native --figscale 1.3 --figres 2.5 --look k08b+cs --audio --workers 1`)
- out/review/passB/stage_3d/m2_084-124.mp4, m2_139-175.mp4, m2_176-187.mp4 + m2_*_sheet.jpg (1 fps). Checks: out/review/passB/stage_3d/m2_check/.
- Luma-drop scan (luma_*.txt): PASS: 7 drops, all on hard cuts (100.767, 107.667, 119.733, 169.9, 172.833, 173.033, 174.433); no one-frame blips.
- Cut vs grid (cuts_*.txt, scene > 0.2, song time): every new cut within 20 ms. Off-grid and kept: 101.0, 121.4, 180.21 (measured hits,
  accepted); pre-existing measured cues 112.333 (eh), 116.867 / 117.667 (T5), 154.267 (line 41 "And"), 160.833 (roll), 166.27 (出发).
  143.433 = the paper unit's p06 entry (nearestBeat 143.403), not mine. 107.167 / 107.667 / 152.2 fixed after M2 (above).
- UI budget (sheets): flood 119-123 and 139.4-143.4 zero UI; drop 2 none; choruses: only the PARTY 8 -> 9 strip (149.22-150.6) + lyric bar;
  BUG -> FEATURE stamps 113-119 and `> let's dance` 111.2-111.9 (kept gags); REALITY bar only in the build.
- Subtitle audit: one style (SmoothSubs) everywhere; none in the clear frames; the type unit's glyphs (绽, 舞台) carry their own lines.
- Canon (m2_check/canon_crops_m2.jpg, Jade 3x from the mp4s at 101.3 / 108.5 / 114.2 / 119.3 / 142.9 / 155.8 / 181.0): headphones round the
  neck (orange-rim cups on the collar) in all seven; hair down with pencils / the giant pencil in hand; white racer jacket, orange bands.
- No paper clip of mine (card 05 is the paper unit's measured clip, lip sync 0.00).
- Page warning in 84-124: one "computeBoundingSphere NaN" (a flood / ring geometry at the plant, not visible); open.

## Colour hooks H9-H13 (after M2) -> DONE, verified on graded stills (out/review/passB/stage_3d/hooks/)
- common.js csTag / csTagObject (alpha 0.5 into the scene target, chained onBeforeCompile).
- H9 turn.js: P.gate2 (the 3D 出发) tagged: rainbow at 81.6 under k08b+cs.
- H10 verse2_r5.js: the stroke bridge P.yiBridge tagged (it is graphite ink by design); drop_r5.js: the slab material (her paint at 93.2 stays red).
- H11 carved_slab.js: the FUNCTIONS groove floor writes alpha 0.5 (rainbow at 90.5 / 183.6); FIXTURES stays graphite.
- H12 battle.js: spot cones / pools named cs:stage_cone_i / cs:stage_pool_i + userData.cs = 1 (blended / additive: no alpha mask possible).
- H13 battle_ui.js: BUG -> FEATURE stamps grey / white and `> let's dance` white before 119.02.

## M3 (carved slab), 2026-10-18 ~21:45. Jade: "Carve it" (full_v4 180.5 read as flat black type on a plain grey box)
Why both drops read flat (drop 1 too, at 540p and 1080p):
- The M1/M2 grooves were real geometry, but only 3 u deep, with a near-black floor (#26262c) and no bevel, normal detail or texture.
  Seen front-on, the walls barely show, so the read was just the dark floor: black type. It is the same carved_slab code on both drops.
- Drop 2: the face (toward -x) had its back to the low +x sun, so it got only hemi, env and the camera-side fill: flat. The plain #a4a4ae
  box (noPaint) had no texture at all.
- Drop 1: the face used the leaf's patchPaint material. Unpainted, that swaps the albedo for flat plaster, so the hatch overlay was its only detail.
- Drop 2 also had a dark horizontal band across the slab at the lens height. That band is a GTAO state leak: it only shows when a drop_r5 frame
  rendered earlier in the same process (full_v4, or any stills batch with 86-94 in it). With ao 0 on the insert it is gone. Root cause in
  post/GTAO not traced (render.js / post.js are not mine).
Changes (all marked (M3); backups engine/out/bak_v4b/stage_3d/m3/*.pre_m3):
- src/scenes/act3/carved_slab.js (rewritten): makeCarvedFace builds the WHOLE slab as one voxel-stone solid (cell 0.6): a chipped
  silhouette (angular bites in the sides and top, broken top corners), the word cut `depth` deep (merged quads: front, groove floor, back,
  walls). Its own MeshStandardMaterial (onBeforeCompile, uniforms uCv*) adds: a chamfer at every cut edge from a signed-distance-field
  texture (Felzenszwalb EDT), with a varying width and chipped lips; voxel tone and normal jitter, mottling, faint cracks, the pencil-scratch
  hatch (own copy of the hatchTex recipe); walls that darken toward the floor; a graphite floor at 0.6x with AO into the corners and an
  analytic shadow (8 SDF taps along the key); a slab-local raking key (keyDir / key) added at opaque_fragment. FUNCTIONS: the floor is
  an unlit HDR rainbow across the WORD's extent (alpha 0.5 = H11), and the groove walls and lips pick up its light. Same sweep, so setGlow(u, gain)
  still fills it left to right. backK (drop 1) gives the back and the outer sides the leaf's gloss and colour (the plank's top at 92.5+).
  outlineTex(flip) = an alpha mask of the silhouette.
  RNG: the engine seeds Math.random and every THREE object costs 4 uuid draws. So makeCarvedFace first replays the M2 build (legacyBuild:
  the same allocations in the same order, then dropped) and builds the new slab under a local PRNG (sync only).
- src/scenes/act3/slab_insert.js:24-27,36-40,62,75-78: the old body box is still allocated (RNG) but no longer used. The slab is 16 thick,
  5 deep, chip 4.5, stone #7a7882. For the insert the sun is turned to rake from the upper left (LOOK k8SunAz 108 / k8SunElev 26; the r5
  keyAz is inert after 173.02), so the trio cast real shadows on the slab and the grooves get shadow-mapped shadows. ao 0 (the band). The
  FUNCTIONS gain is 1.9 + 0.9 pulse (was 3.4-5.0: white cores).
- src/scenes/act3/drop_r5.js:34,48-49,61-71,170,376: the leaf is the carved solid (S.d = 9 thick, 4.5 deep, chip 3, hue #ff5a4e).
  patchPaint shares the leaf's paint uniforms, so Jade's paint still lands, and csTag (H10). The leaf box is hidden. The back hatch is
  alpha-masked by the chipped outline. The FUNCTIONS gain is 1.9 + 0.9 (was 3.2-4.8).
Timing is unchanged: the same cut frames (180.21 / 183.30 / 183.87 and 86.819 / 89.95), the 0.17 s slam, and the fill windows
(drop 1: 0.12 s; drop 2: 183.35-183.50, as in M2).
Verification:
- 1080p before/after (identical batch): out/dev/passB_stage_3d/m3/{before/b_*,after/a_*}.png (86.9 87.5 90.1 90.5 175 180.4 180.9 183.8 186).
  Sheet: out/review/passB/stage_3d/m3_slab_sheet.jpg (targets 09/10, before | after, detail crops).
- 540p + audio: out/review/passB/stage_3d/m3_slab_178-185.mp4 and m3_slab_085-092.mp4.
- Frames outside the slab shots: in one batch with slab frames (87.5, 95.5, 101.3, 121.2, 175, 180.9), old code vs new code
  back to back gives 0 px different at 95.5 / 101.3 / 121.2 / 175 (r_*.png); 186 is identical to the baseline too. Against the 21:05 baseline,
  175 differs in 13.6k low-amplitude px. Old code renders identical to new code at 175 now, so that drift is from other units' parallel edits, not from M3.
- Plank (drop 1, 93.2 / 93.8): painted red, the hatch kept; tone matched to M2 (a little more saturated).
Open / doubts:
1. GTAO state leak after drop_r5 frames (the band). Handled in the insert with ao 0 (the trio lose a little contact AO). Other later 3D shots could
   carry it too: worth a CORE_REQUESTS note.
2. 92.0 (the firefly close-up): the lit FUNCTIONS slab edge behind now glows magenta (the wall spill shows edge-on). In M2 it was dark grey.
3. 93.8: a small bright red dash at the plank's far end (a chip wall catching the sun, ~20 px at 540p).
4. The insert's sun turn changes the background's light in 180.21-181.125 / 183.30-183.87 (no sun disc behind the arch on FUNCTIONS).
5. Letters on curves keep a 0.6 u voxel stair-step (on purpose, for the world). Still 09's letters are smooth.

## M4 (streaks + patch), 2026-10-18 ~23:45 (fresh_eyes_v4 findings 3 + 5)
Causes (found by A/B renders in a private shadow engine, out/dev/passB_stage_3d/m4/shadow, now deleted):
- **The 91.4-94.2 "motion-blur streaks" are NOT motion blur.** Stills without --mblur show the same streaks pixel for pixel. They are the slab's
  pencil-scratch hatch: parallel pale diagonal strokes that read as streaks once the slab is lit magenta (the carved shader's own hatch,
  uCvHatchK, 92.0) and on the painted plank (the unlit hatchBack overlay, 93-94.2, seen at a grazing angle). They were in M2 too. With the
  hatch off, both shots are clean. No velocity bug, and GTAO is not involved: nothing in core changed (post.js / main.js mblur untouched).
- **The 92.0 magenta edge glow** = the FUNCTIONS rainbow (its violet end) seen edge-on behind the receiver: it goes away with setGlow(0).
- **The 93.8 red rectangle** = the 一 hinge beam on the pier (drop_r5 buildRoomA5 pierG.children[1]). It shares the leaf's material S.mat,
  so Jade's paint turns it red, and its end beyond the lying plank shows as a red dash by pad2. Confirmed by colouring it green.
Changes (backups engine/out/bak_v4b/stage_3d/m4/{drop_r5.js,heroes.js}.pre_m4; atomic copy -> patch -> node --check -> mv):
- src/scenes/act3/drop_r5.js:50-53 `const M4 = { hatchK: 0.2, backHatch: 0.2, closeGlow: 0.15 }`. :75 A.carve.hk0 (the M3 hatch strength).
  :174-177 per frame (order-free): from the re-hit cut SHOT[3] 91.335 on, the stone's hatch is x0.2 and the back overlay's opacity is 0.2
  (the switch lands on the cut). The FUNCTIONS gain is x0.15 in the close-up (91.335-92.975 only), and the hinge beam takes the pier's
  graphite material from RUN-0.05 (91.97, when the paint starts). :388 A.slab.beam / pierMat (references only, no new THREE objects, so RNG is unchanged).
- src/core/heromodels/heroes.js:251-258 (HI patch): the patch is now a 'vol' decal projected along (sin40, 0, -cos40) round the left upper arm's
  axis (z = S.L.sh[2]), i.e. turned 40 deg from her left side toward the front, as in jade_anime.png (front: on the outer-front edge; 3/4:
  facing camera). Same artwork, same centre PY 64.6 ON the orange band, same mats (jacket + orange), still her LEFT arm. The 1.25 path is unchanged.
Finding 5 verdict: the patch was NOT missing and NOT on the wrong arm. It was on her left sleeve band, projected straight from the side, so it
was edge-on in front-on shots (a sliver shows at 101.0 / 151.0 before). Now it reads at 101.0, 108.5 (flung-out arm), 151.0 and 180.6.
At 142.9 and 155.8 that arm is turned away or behind the hair lock (only an edge shows), which is just out of view.
Verification:
- Sheet: out/review/passB/stage_3d/m4_sheet.jpg (before | after 1080p mblur 8 / shutter 0.33 at 91.6 92.0 92.6 93.4 93.8, 1:1 crops, patch
  crops before/after at the six times, canon bench front / 3/4L / side / 3/4R old vs new beside jade_anime.png).
- Stills: out/dev/passB_stage_3d/m4/{before/mb_*, new/mb_*} (mblur) and {old/o_*, new/n_*} (one identical 19-still batch, old code vs new code).
- Unchanged check (same batch, old vs new code): 95.5 / 121.2 / 175.0 / 186.0 = 0 px. 86.9 / 87.5 / 90.5 / 91.2 / 101 / 108.5 / 142.9 / 151 /
  155.8 / 180.6 differ only inside a <= 72x90 px box on Jade's left upper arm (the patch). 91.6-93.8 differ (the hatch / glow / beam fix).
- 540p + audio (master flags, k08b mblur 8 shutter 0.33): out/review/passB/stage_3d/m4_089-096.mp4 + m4_089-096_sheet.jpg (4 fps).
- Canon bench: out/dev/passB_stage_3d/m4/bench/{old,new}_*.png (tools/models_shots.js, jade_down).
Open / notes:
1. The hatch is still at full strength on the hero frames 86.8-91.3 (stills 09/10, approved) and on drop 2's insert. If Jade reads those as
   streaks too, drop M4.hatchK / the insert's hatchK the same way.
2. The hinge beam's exposed end now reads as a small dark graphite block beside the dark pad (part of the hinge), not as a red dash.
3. The patch change touches every 3D Jade frame (patch pixels only). The full-video renders by the other units will pick it up.
