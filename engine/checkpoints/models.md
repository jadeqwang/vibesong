bun caps sized (2026-10-16): hair-up bun pencils only: caps ~1.1x the original length (capLen 3.5) and a thinner cross-section
(R 1.6), ferrule + pure saturated colours + the X through the bun kept; in-hand caps unchanged (R 2.0, capLen 4.8). Checks:
out/review/models/buncaps_close_back.jpg, buncaps_close_front.jpg, buncaps_bridge_distance.jpg (bench, Jade ~110 px tall like
the Act IV bridge), buncaps_main_124.5.jpg (Act IV still has her hair down there). Edits to shared files are now made ATOMICALLY
(copy -> node --check -> mv) per the coordinator. Default FIGURE_SRC still 'carve'. Next: wait for the coordinator.
pencil caps fixed (2026-10-16): eraser caps 1.5x longer + silver ferrule ring; saturated cap_blue #1f5fff / cap_pink #f2708c
meshed with no jitter / edge ring (pure); in-hand pencils gripped nearer the tip (voxfig nativeItems translate 0.08 len) so the cap
stands clear of the fist / cuff. Checks: out/review/models/caps_inhand_3x.jpg, caps_main_{87.5,107.7,118.4}.jpg,
caps_bun_hairup_bench.jpg, caps_dev_turntable_hairup_44.jpg. Default FIGURE_SRC still 'carve'. Next: wait for the coordinator.
r5 DONE (Jade head tweaks) (2026-10-16): Jade's head only: crown lowered ~2.3 voxels to hug the skull (hair shell tTop 2.6 -> 0.8;
strands + side volume kept), eyes opened one row (lash line at lattice row 108, iris 107-105, flick + catchlight kept), lips 3 voxels
with a darker centre (mouthD). Bodies and the other heroes untouched. Backup of r4: out/bak_models/heroes_r4.js.
Deliverables: out/review/models/face_jade_r5.jpg (k09 | r4 | r5), heads_turnaround_jade_r5.jpg, native_main_{107.7,118.4}_r5.jpg.
Default FIGURE_SRC still 'carve'. Next: wait for the coordinator / Jade.
r4 DONE (2026-10-16): heads + hair round complete and reported; bodies unchanged since r3. Default FIGURE_SRC still 'carve'.
# >>> RESUME HERE (MODELS after round 4) <<<
Deliverables (out/review/models/): face_{jade,charlie,ricky}_r4.jpg (keyframe | r3 | r4), heads_turnaround_r4.jpg,
native_main_{101.5,108,107.7,118.4}_r4.jpg + inscene_r4.jpg, canon_audit_r4.md + canon_audit_3x_r4.jpg (+ portraits_r3 etc.).
Next: wait for the coordinator / Jade. Regenerate heads: W=.../scratchpad/MODELS_team_r2/gate; models_gate.py specs $W; filter
face_/head_ shots into heads.json; node tools/models_shots.js --fig native --res 1920x1080 --bench $W/heads.json;
models_gate.py faces3 $W _r4 (needs face_*_r3.jpg present for the middle column). In-scene stills: one time per render.js call
(retry; act3 files are being edited by other teams).
r4 code (heroes.js): faceShape(), maskFace() lattice masks (iy -> y centre (iy+0.5)*0.8; column c -> iz = W/2-1-c, image-left
= +z), profileEye(), grooves(), crownBand() = '+y' projection decal on the top surface above yMin (sdf.js passes the hit y as
the 5th arg of '+y' proj decals). Backup of r3: out/bak_models/heroes_r3.js.
R4 items -> status:
  1 [ ] Jade face toward k09: flat face plane (no nose block; <=1-voxel nose shade), almond eyes (iris + lash line w/ outer flick
        + 1 catchlight), slightly larger + lower (taller forehead, high centre part), heart jaw tapering to a soft chin with no
        cheek stair-steps, small red lips, thin soft-black brows (image-left straight, image-right slight arch) with more space.
  2 [ ] Hair sheen: no speckles; 2-voxel-deep strand grooves + one smooth lighter crown band (k08b/k09).
  3 [ ] Ricky hair: tousled rounded (k08b): fringe in 3-4 clumps over the forehead, crown volume, ears visible, lighter top.
  4 [ ] Charlie: rounder cap crown (brim flat), curls off the face.
  5 [ ] Eyes: hand-authored voxel masks per face (lattice-exact, not SDF thresholds).
  Deliverables (_r4): face_{jade,charlie,ricky}_r4.jpg (keyframe | r3 | r4), heads-only turnaround, in-scene stills 101.5 / 108 /
  107.7 / 118.4 (--fig native --figscale 1.3), canon audit. Then STOP and report.

# >>> RESUME HERE (MODELS round 3, updated 2026-10-16) <<<
State: ROUND 3 COMPLETE, at the gate, reported. Default FIGURE_SRC still 'carve' (coordinator flips it after Jade sees the cuts).
Deliverables (out/review/models/): heroes_vs_keyframes_sheet_r3.jpg, turnarounds_r3.jpg, actions_r3.jpg, portraits_r3/,
face_{jade,charlie,ricky}_r3.jpg (keyframe face vs native, 1080p), {carve,native}_main_<t>_r3.jpg, canon_audit_r3.md +
canon_audit_3x_r3.jpg, native_run_82.8-85.8_r3.mp4 (shimmer check). Perf r3 native 1080p 101-102.25: 209.9 ms/frame wall
(GPU 6.4 ms), init 12.8 s.
Regenerate: same commands as the r2 block below, with suffix _r3, plus `models_gate.py faces $W _r3`. Render in-show stills ONE
TIME PER CALL with a retry: act3 scene files are being edited by another team and a multi-time batch can hit a transient
error in prebattle_props.js / drop.js.
Coordinator verdict on r2: PROVISIONAL PASS (scenes render with --fig native --figscale 1.3, re-frame 2 shots themselves).
R3 items (priority) -> status:
  PROGRESS: 5 DONE (shader edge ring with distance fade: voxel.js edgeAttr + voxfig patchVoxelEdges, wired in sprites.js
  voxelFigure; shimmer gone at ~1 px/voxel). 1-4 implemented (sprism limbs/torsos, mitten hands, faces w/ lash+iris+white+
  skinShade+blush+cheeks, 2-voxel creases + pantsHi/jeansHi ridges, hand-keyed native throw + shield with capFront IK);
  NEXT: run the r3 gate pipeline (models_gate.py specs -> bench -> stills native+carve -> sheets/audit/faces _r3), check, report.
  1 [x] ROUNDNESS: superellipse/capsule cross-sections for arms (tapering sleeves, rounded shoulder caps, round forearms/calves),
        legs, torso (rounded ribcage/waist); hands ~15% bigger, mitten-shaped with a visible thumb.
  2 [x] FACES readable at the 101.5 size: nose bridge/tip shading, cheeks, eyes with a white highlight + dark upper lash line,
        defined brows (Jade: image-left straight, image-right slight arch), small mouth; Jade: larger eyes, high centre part, heart face.
  3 [x] FOLDS that survive shadow: creases 2 voxels deep + lighter value on fold ridges (pants / jeans).
  4 [x] POSES (native only): Charlie throw (wind-up -> follow-through across the body), shield (hat held out front, both hands, IK).
  5 [x] Shimmer check: 3 s 960x540 run clip around 84 with --fig native; if Ricky's stripes / edge rings shimmer, fade the ring with
        screen-space voxel size.
  Deliverables: same sheets with _r3 (tools/models_gate.py sheets/audit $W _r3) + per-hero face side-by-side vs k08b/k09 at 1080p.
Backups of the r2 state: out/bak_models/{heroes,voxfig,sdf}_r2.js.

# >>> RESUME HERE (MODELS round 2, updated 2026-10-16 ~01:10) <<<
State: ROUND 2 COMPLETE, at the gate, reported to the coordinator. Default FIGURE_SRC is still 'carve' (do NOT flip).
Deliverables (engine/out/review/models/): heroes_vs_keyframes_sheet_r2.jpg (k08b / k09 framings + 3x granularity crops at k08b
on-screen scale + carve vs native at 84 / 101.5 / 104.6 / 108), turnarounds_r2.jpg, actions_r2.jpg, portraits_r2/ (33 jpgs),
{carve,native}_main_<t>_r2.jpg, native_101-110.4_r2.mp4 (960x540, audio), canon_audit_r2.md + canon_audit_3x_r2.jpg.
Perf r2 1080p: native 215.6 ms/frame wall (GPU render 5.8 ms) at 101-102.25 vs carve 220.1 (5.4); stage 107.2-108.4 native 236.3
(8.1); init about 12-13 s either way; all 5 figure variants build in about 224 ms (55-71k voxels per figure).
Next step: wait for the coordinator / Jade. To regenerate everything after a model tweak:
  W=.../scratchpad/MODELS_team_r2/gate; V=/home/jade/Documents/vibesong/.venv/bin/python
  $V tools/models_gate.py specs $W; node tools/models_shots.js --fig native --res 1920x1080 --bench $W/bench.json
  node render.js --show main --fig native|carve --res 1920x1080 --stills 84:$W/native_084.png,...  (carve_<t>.png too)
  $V tools/models_gate.py sheets $W _r2; $V tools/models_gate.py audit $W _r2
  node render.js --show main --fig native --from 101 --to 110.4 --fps 30 --res 960x540 --mp4 out/review/models/native_101-110.4_r2.mp4 --audio --workers 3
Round-2 notes by item (coordinator, priority order) -> status:
  1 voxel read: DONE (voxel.js meshVoxelGrid opts { jitter, edge, inset, hashOrigin }, default off; heroes.js LOOK = jitter .045, edge .2, inset .15)
  2 sculpt: DONE first pass (puffy jacket + raised bands + ribbing + collar tab, cargo pockets + flaps + creases + pooled hem +
    free-hanging straps, big fists with the pencil through the grip at an angle, chunky sneakers / boots, Jade's hair clumps + side
    locks + speckled sheen, Charlie's curl clumps under a seated cap, Ricky's fuller hair). Check against k08b 3x crops.
  3 proportions: DONE (head ~1/5: skull 7.4 x 8.7 x 7.0, chunky limbs, k08b-like widths)
  4 scale: DONE SCALE = 1.3 (heroes.js; world units per design unit 0.702; ~69 world units tall vs carve ~52). Prop check:
    the turn's boomerang catches (82.42 / 85.66) and the battle's hat beats (113.3 / 117.3) are OK; battle.js hard-codes Charlie's
    hand at cp.y + 38 for the 116.11 boomerang launch -> report it (g.hand(side) helper added for scenes).
  5 Charlie front play rig: DONE (acoustic slung by default, chord / sustain play it; figure-only anims allowed). Jade k09 lunge: DONE (native draw_*).
  6 render.js --fig: DONE (R-MOD1 closed).
Backups: out/bak_models/src (pre-round-1), out/bak_models/{heroes,voxfig,voxel,render}_r1.js (end of round 1).

# MODELS team checkpoint: 3D-native hero models (design decision 5, docs/decisions.md 2026-10-15 late)

Status: AT THE REVIEW GATE (2026-10-16). The default is still 'carve' and nothing shipped has changed. Waiting for Jade.
Backup of src/ before any edit: engine/out/bak_models/src/.

## Gate deliverables (engine/out/review/models/)
- heroes_vs_keyframes_sheet.jpg: k08b / k09 crops next to the native figures at matching framing (bench), then carve (current
  default) vs native at the p2c times 84 / 101.5 / 104.6 / 108 (1080p, in the real show).
- portraits/: 1080p jpg. {jade_up, jade_down, charlie_hat, charlie_nohat, ricky} x {front, 34, side, back}, jade_up_left,
  act_* (jade run / draw_rainbow / draw_graphite / jump, charlie run / throw / shield, ricky run / chord / sustain).
  Contact sheets: turnarounds_sheet.jpg, actions_sheet.jpg.
- native_main_{084,101.5,104.6,108}.jpg: full-frame in-show stills.
- canon_audit.md + canon_audit_3x.jpg: all Jade / Charlie / Ricky canon items PASS (details and caveats in the note).

## How it works
- src/core/heromodels/sdf.js: SDF primitives (roundBox, cone, ellipsoid, superEllipsoid, clip, disp), voxelizer (paint
  priority per material, cuts, decals: volume recolour / axis projection / 'add' bumps), 3x5 decal font with per-glyph
  widths, voxelizeParts(): every rig part is voxelized from ITS OWN primitives (parts may overlap at rest, so a rotating limb
  never opens a hole in its neighbour) and meshed with voxel.js meshVoxelGrid (face-culled, baked AO 0.3).
- src/core/heromodels/heroes.js: Jade (hair up / hair down), Charlie (cap / hatless), Ricky, and the native items (pencils,
  Strat, acoustic, flat cap). Mostly axis-aligned rounded boxes: tapered or slanted round shapes staircase into noisy
  'drips' at this density. Skeleton: neck 77, hip 47, knee 26.5, shoulders 73 (voxels); 0.54 world units per voxel
  (96 voxels = about 52 units, the same world height as the carved figures). nativeModel(vname) returns the carveFigure()
  shape (+ `native`: items, bun centre, hand offsets).
- src/core/voxfig.js: FIGURE_SRC ('carve' default; `?fig=native` or globalThis.FIGURE_SRC = 'native'), figureModel(),
  buildFigure -> nativeItems() for native models (same item names: pencilR/L, geoBlue/Pink, bunPencils, guitar with
  userData base/fret/strum, cap). pose(): a guitar is IK-played only when it has a play rig (userData.base): no change for carve.
- src/core/sprites.js voxelFigure(): models from figureModel() (cache key = source + variant).
- src/core/heromodels/bench.js + tools/models_shots.js: portrait bench and still / perf driver (`--fig`, `--main`, `--bench`, `--perf`).
  Gotcha: headless Chrome drops the first WebGL context of a fresh GPU process, so the driver makes a throwaway context
  first (as render.js launch() does) and the bench borrows ENGINE's renderer.

## Verified
- The default 'carve' path is pixel-identical to the pre-edit render (smoke 23.8 + 104.6 at 960x540: max diff 0).
- Native: the whole show 78..206 every 2 s renders with no errors or missing figures/items; every pose drives; hair canon,
  hat:false, Strat IK, cap-in-hand and voxel({ figure: false }) all work.

## Perf (RTX 3090, 1080p, tools/models_shots.js --perf, render + readback like render.js)
| range | native | carve |
|---|---|---|
| 101.0-102.25 (co-op) | 210.7 ms/frame wall (GPU render 5.8 ms) | 224.3 ms (5.7 ms) |
| 107.2-108.4 (stage) | 224.0 ms (5.3 ms) | 216.3 ms (6.0 ms) |
| show init (main, from 101) | 12.4-12.8 s | 12.5-12.7 s |
| figure build, all 5 variants | ~70 ms (10-20 ms each, 17-25k voxels per figure) | ~320 ms |
Wall time is dominated by the 1080p readback, so frame cost is at parity.

## Open / next (after Jade's call)
- Flip: change the FIGURE_SRC default in voxfig.js (one line). Before that, do a motion review: R-MOD1 in CORE_REQUESTS
  (render.js `--fig` pass-through).
- Gap list: see the report / canon_audit.md (in-scene framing tuned for the chibi figures, no front-play rig for
  Charlie's acoustic, procedural poses only, Ricky's 1-voxel stripes untested in motion).

---
# ROUND 2 (coordinator notes 2026-10-16: gate NOT passed: "flat low-poly blocks, thin and small in-scene")
Same switch, same API. Deliverables get an _r2 suffix in out/review/models/. Plan / status (update as items land):
1. [ ] Voxel read: opt-in mesher options in voxel.js meshVoxelGrid (per-voxel hashed value jitter about 4%, edge darkening as
   an inset border ring per face); heroes only, so the world look is unchanged (default off).
2. [ ] Sculpt: pants (pockets + flaps, knee creases, pooled hem break, straps hanging 1 voxel off), puffy jacket (rounded
   shoulders / sleeves, ribbed cuffs, band collar, raised orange arm bands), real fists with the pencil THROUGH the grip at
   an angle, chunky k08b sneakers, Jade's hair clumps + side locks + fuller crown + sheen, Charlie's curl clumps under a
   seated cap, Ricky's hair volume.
3. [ ] Stylized proportions: head about 1/5 of the height, chunkier limbs, bigger hands / feet, k08b silhouette widths.
4. [ ] In-scene scale factor for native (about 1.3x, feet anchors unchanged); check props meet hands / plates / hats.
5. [ ] Charlie front play rig (acoustic: back when idle, front for chord / sustain); Jade lunge draw (k09) if time allows.
6. [ ] render.js --fig pass-through (R-MOD1, allowed by the coordinator).
7. [ ] r2 deliverables + 960x540 motion clip 101-110.4 (?fig=native) + canon re-audit, then stop and report.
Round-1 slim models (for reference): heroes.js as of gate 1 = the file before the round-2 edits (no separate copy).
R2 progress (2026-10-16): DONE 1 (voxel.js meshVoxelGrid opts jitter/edge/inset/hashOrigin, default off), 2 mostly, 3, 4 (SCALE
1.3), 5 (Charlie slung/play rig + figure-only anims in sprites.js voxelFigure; Jade k09 lunge for native draw_*), 6 (render.js
--fig). New: sdf.js continuous lattice (RES voxels per design unit; heroes.js RES = 1.25 -> ~121 voxels tall), range-based
decals; g.hand(side) world hand position on figure groups. Gate tooling: tools/models_gate.py specs|sheets|audit <workdir>.
Scratchpad is SHARED with other agents: use scratchpad/MODELS_team_r2/ only.
