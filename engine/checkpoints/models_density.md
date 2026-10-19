# MODELS density spike (hero RES 1.25 -> 2.5, opt-in): checkpoint

Brief: docs/half2_cinematic_pass.md §3. Owner: MODELS density spike agent (2026-10-16).

## State: SPIKE DONE, reported to the coordinator. Default unchanged (RES 1.25). Nothing flipped.
- [x] Backups: engine/out/bak_models_density/ (heroes.js + heroes_spike_v1.js, sdf.js, voxfig.js (untouched), models_shots.js,
      render.js, render.js.pre_figres = the copy taken right before my one-line edit, because another team was editing render.js
      at the same time: mblur / look flags)
- [x] Flag: `?figres=2.5` (page URL) / `node render.js ... --figres 2.5` / `node tools/models_shots.js ... --figres 2.5` /
      globalThis.FIGRES. Accepted range 1..4; anything else falls back to heroes.js BASE_RES = 1.25.
- [x] Default path PIXEL-IDENTICAL after all edits: 25 bench shots + in-scene 86.8 / 104.6 at 1080p, max diff 0 (checked twice,
      after the first swap and again after the last edit).
- [x] 2.5 bench, tuning, evidence sheets, perf, canon audit.

## Files touched
- src/core/heromodels/heroes.js
  - RES flag (BASE_RES 1.25, HI = RES != BASE_RES, bi() = base-lattice index, bvox(n) = n base voxels in design units).
  - Every feature authored in voxel-index units is remapped only when HI, so 1.25 runs the old code path: rib width, crease and
    hair-groove depth (2 base voxels deep in design units), Jade's centre part, Charlie's cap ridges, Ricky's stripes (same
    period, ~1.25-base-voxel stripe for the same weight) + placket + buttons, throat-tab 'add' thickness (n = RES / 1.25).
  - maskFace: the approved r5 (and Charlie / Ricky r4) masks sampled in base-lattice units (each feature voxel -> a 2x2 block at
    2.5, no redesign) + an eyelid row (skinShade, right above the lash) + a lighter bottom iris row (irisHi). Catchlight unchanged.
  - jacketBack(): big pale-blue dot (#94BEE4, r 7.1 design) over ONE line "RARE EARTH" (FONT46, #272729, the artwork's colours),
    44 x 6 voxels = 17.6 design units wide vs the 14.2-unit dot (the cropped back is too short for a dot as wide as the line).
    RES >= 2.3: dot + text; 1.25: the approved 2-line layout, unchanged; any other RES < 2.3: the dot alone (Jade's priority).
  - HI-only details: round chest dot, the 1420 MHz patch laid out like the artwork (pale disc, thick black ring, two dark "text"
    lines), silver strap buckles (belt straps + thigh straps), pocket-flap snaps, a second finer set of 1-voxel strand grooves
    (Jade up / down, Ricky).
  - Palettes add irisHi (all), dotArt + letter (Jade). Unused at 1.25 (no colour changes there).
- src/core/heromodels/sdf.js: FONT46 (4x6 bold sans R A E T H + space); textTest(str, gap, font) (legacy call identical);
  'add' decal takes n (thickness, default 1).
- render.js: `--figres` pass-through (the page URL line + a usage comment). tools/models_shots.js: `--figres` / `--figscale`.

## Evidence: engine/out/review/models/density/
- turnaround_jade_125_vs_250.jpg: front, 3/4, side, back, 3/4 back, 1.25 | 2.5 pairs; rows = hair up / hair down
- jacket_back_250_3x.jpg (artwork | 1.25 back 3x | 2.5 back 3x | 2.5 close-up), jacket_back_250_hairdown.jpg
- charlie_ricky_250.jpg (front + 3/4, each next to 1.25); faces_125_vs_250.jpg
- inscene_{086.8,104.6}_{default,figres2.5}.jpg (1920x1080) + inscene_*_side_by_side.jpg + inscene_jade_crops.jpg
- canon_audit_3x_250.jpg
Regenerate (from engine/, W=out/dev/mdens, scripts kept there): `python specs.py $W r250`, then
`TMPDIR=$PWD/out/dev/tmp node tools/models_shots.js --fig native --res 1920x1080 --figres 2.5 --bench $W/bench_r250.json`
(and the same without --figres for r125); in-scene: `node render.js --show main --fig native --figscale 1.3 --figres 2.5
--res 1920x1080 --stills 86.8:$W/hi_086.8.png,104.6:$W/hi_104.6.png` (base_* without --figres); then sheets.py / audit.py.
Temp frames were deleted after the sheets were built.

## Perf (RTX 3090)
| | 1.25 (default) | 2.5 |
|---|---|---|
| build per hero, Chrome (bench init) | jade_up 76-79 ms, jade_down 80-85, charlie 42, charlie_nohat 46, ricky 48 | 295, 312, 225, 207, 225 ms |
| all 5 variants | ~0.29 s | ~1.27 s |
| voxels per figure | 47-62k | 376-492k (8x) |
| quads per figure (body parts) | jade_up 128k, jade_down 140k, charlie 104k, ricky 107k | 523k, 579k, 421k, 436k (~4.1x) |
| triangles per figure (+ items) | 257k / 280k / 209k / 214k (+10-43k) | 1.05M / 1.16M / 0.84M / 0.87M (+42-170k) |
| 1080p wall, 86.4-87.4 | 216.7 ms/frame (submit 6.9) | 210.2 ms/frame (7.0) |
| 1080p wall, 104-105 (two runs) | 210.5 / 227.8 ms/frame | 242.6 / 209.3 ms/frame |
| show init (main) | 12.6-12.8 s | 13.3-13.6 s |
Frame cost is at parity: wall time is the 1080p readback, and run-to-run noise (+-20 ms) is bigger than the hero cost.
Memory: roughly 0.7-0.9M vertices per hero at 2.5 (about 4x).

## Canon audit at 2.5 (3x crops; rules verbatim from memory/jade-character-rules.md)
Rules (verbatim): "Pencils: yellow bodies; blue-eraser pencil has a rainbow (multicolor) core at the tip, pink/orange-eraser pencil a
graphite core; one BLUE eraser cap (draws every color = functions) + one PINK/ORANGE eraser cap (graphite = fixtures); never
matching; in the bun they cross in an X, never parallel, and they are stuck THROUGH the bun like hair sticks (crossing point
hidden inside the bun; caps out one side, tips out the other), never lying on top of the hair; at sprite scale, no tip pixels in
front of the hairline (they read as a hairclip). Hair: updo/bun holding both pencils, OR long and loose when pencils are in her
hands, never both. Jacket: cropped white racer jacket per inputs/jacket-base.png (band collar w/ snap throat-tab, snap epaulets),
orange stripes, one small pale-blue chest dot, 1420 MHz sleeve patch, back = big pale-blue dot + RARE EARTH. Sleeves: ONE
horizontal orange band around each upper arm (plus the horizontal band across the chest), never vertical racing stripes; small
b/w round 1420 MHz patch on her LEFT upper arm (image-right facing camera; legibility optional). Pants: full-length wide-leg
BAGGY navy cargo pants pooling over white chunky sneakers, with long ORANGE STRAPS hanging (belt to knee + on thigh pockets);
never short/cropped (ref inputs/jade_anime.png turnaround). Headphones: OFF everywhere." No glasses. Charlie keeps his flat cap.
- [PASS] yellow pencil bodies; blue cap + rainbow tip, pink cap + graphite tip; never matching
- [PASS] hair up: the two caps cross in an X THROUGH the bun (caps out one side, tips out the other); no tip in front of the hairline
- [PASS] hair down only with pencils in hand; bun only without (variants jade_up / jade_down)
- [PASS] cropped white racer jacket, band collar, snap epaulets; [CAVEAT, same as 1.25] the snap throat-tab sits under the chin and
  is hard to see from eye level (a low-angle check shows the tab ledge on the collar front)
- [PASS] ONE horizontal orange band per upper arm + one across the chest; no vertical stripes
- [PASS] small pale-blue chest dot (now round at 2.5)
- [PASS] b/w round 1420 MHz patch on her LEFT upper arm (image-right facing camera)
- [PASS] back = big pale-blue dot + RARE EARTH (one line at 2.5, as the artwork)
- [PASS] full-length baggy navy cargo pants pooling over white chunky sneakers; long orange straps (belt to knee + thigh pockets)
- [PASS] no headphones, no glasses on anyone; Charlie keeps his flat cap (86.8 in-scene + bench)

## Issues for the coordinator
1. Back legibility at a distance: the one-line 4x6 lettering is 2.4 design units tall (1.25's 2-line text was 4.0), so at 104.6
   (Jade ~500 px tall, 3/4 back) "RARE EARTH" is only ~5 px tall and less readable than the approved 2-line text. With hair DOWN,
   the curtain (ends at y 66-69) also covers the top half of the big dot, and at 104.6's 3/4-back angle almost all of it. The
   text-free fallback (dot alone) is available by RES (< 2.3) but not per shot. If a back shot has to read, use a hair-up variant or
   frame it closer.
2. World density mismatch: next to 2.5 heroes, the Act III world (cypresses, grass, rubble at 86.8) is visibly chunkier. The brief
   (§3) says the near world gets the same treatment where heroes touch it: that is the density team's (world) call.
3. The shader edge ring fades by on-screen voxel size (voxfig patchVoxelEdges uses model.native.res), so at 2.5 it fades out about
   2x closer to camera: medium shots read a little smoother/flatter than 1.25. Expected; adjust the fade only if Jade wants the ring.
4. The likeness needs Jade's re-approval at 2.5 (faces_125_vs_250.jpg): same mask, plus the eyelid row and the lighter lower iris.
5. render.js is being edited by another team (mblur / look). My change is one line (the page URL) + a comment, made atomically.
