# passB_color (v4 Pass B, unit "color"): ration the colour

Brief: docs/v4_passB_brief.md (row "color"), docs/bible.md (the colour script line), the critique's direction (Jade approved):
graphite + paper before 1:59 with colour only at the pencil tip and on what she just drew (the rainbow 出发 at 1:12 stays as
the one preview); the flood 119.0-123.3 is the single full-spectrum break; the bridge drains it to dusk; the 画 slam (139.395)
brings it back for good. Heroes keep canon colours (default).

Status: **M1 + M2 approved; hooks H1-H7 + H16 applied (coordinator's go), STOPPED.** H8 skipped; H9-H15 belong to the other units.

## Mechanism (wave 1: a global, time-keyed grade + exemptions from existing state)
- **NEW src/core/colorscript.js** (no imports; node can read it): `csAt(t, variant)` = the script (sat2d / sat3d / uiSat,
  tint + amount, keepAmt, protL, protSat, on), `CS_CUES` (72.17, 80.815, 86.385, 119.02, 119.6, 123.354, 125.769, 129.34,
  139.395), `CS_GLSL` (`csGrade(colour, keep)`), the tints (paper / plaster / dusk), and the wave-1 frame clock shim.
  | range | world | notes |
  |---|---|---|
  | 0 - 119.02 | 2D sat 0.06 (paper tint 0.5); 3D sat 0.30 warm plaster (plaster tint 0.75) = default since the M1 review; `+cs=graphite` = 3D sat 0.12, paper tint 0.55 | exempt: heroes, pencils, rainbow Hanzi2D / floods, rainbow FX, subtitles, 3D heroes + bugs (paint.js alpha mask), HDR > 2.0 (beams) |
  | 72.17 - 86.385 | same | + 3D chroma protect 0.8: the 出发 preview survives the 3D turn (until hook H9) |
  | 107.15 - 110.41 | same | + 3D chroma protect 0.42 (`CS.stageProtSat`): the coloured spotlights of the 1:47 stage (until hook H12) |
  | 119.02 - 119.6 | ramps to 1.15 with the wave | the only time saturation goes above 1 |
  | 119.6 - 123.354 | 1.15 | the full-spectrum break |
  | 123.354 - 125.769 | drains 1.15 -> 0.14 (continuous with the flood hold), dusk tint (#b9aecb) to 0.6 | heroes keep colour: they are what's left |
  | 129.34 - 139.395 | 0.14 dusk | + chroma protect 0.62: the colour shards she collects into 画 stay coloured |
  | 139.395 -> | off | frames exactly as authored |
- **3D: src/post.js** `enableCS()` patches the final pass (after tone map + grade, before pixelate / outline / palette /
  vignette): hero mask = rtScene alpha 0.5 (paint.js `hero: true` under --r5 + k08b, the same mask look_r5's pair grade uses),
  HDR protect from the pre-tonemap colour, optional chroma protect. `_csFrame(scene)` sets the uniforms per post.render call;
  skips 2D stages (`scene.userData.cs2d`) and any scene with `scene.userData.csSkip` (paper inserts).
- **2D: src/core/stage2d.js** (grade path only): `onBeforeRender` on the stage's world and UI scenes patches each material once
  (main() wrapped, csGrade on gl_FragColor; built-ins via onBeforeCompile) and sets a per-material keep value from: hero Actors,
  Pencil props, Hanzi2D style 1 / active flood, PixelMaterial `rainbow > 0`, `userData.cs` (inherited). UI: the ZUI.SUBS layer
  is exempt, every other UI layer is graded. The world renders into a linear RT (linear tint), the UI into sRGB.
- **src/look.js**: `--look k08b+cs` = k08b + the colour script (warm plaster 3D), `+cs=graphite` = the M1 first pass, `+cs=warm` = alias of the default. Plain `--look k08b` is unchanged.
- Paper scenes that call renderer.render (paper.js, spread.js) never pass through the grade: paper is its own layer.
- **Frame clock:** src/core/show.js `ShowRunner.render(t)` sets `CS.t = t` (R-COLOR1); the ENGINE wrapper shim is deleted.
- **Switch:** opt-in until approved, so the four other units' renders stay byte-identical. To flip the default after
  approval: in LookPass, treat a bare `k08b` as `k08b+cs` (one line), and add `+cs` to the master command.

## Files changed (backups: engine/out/bak_v4b/color/)
- NEW src/core/colorscript.js
- src/post.js: import (line 16); `enableCS()` + `_csFrame()` (before `setScene`); `render()` calls `_csFrame` first (+1 line)
- src/look.js: import CS; LookPass constructor parses `+cs[=variant]` (first 4 lines of the constructor)
- src/core/stage2d.js: import; the colour block (CSU, csPatch, csKeepOf, csWalk, csHook) before `class Stage2D`; constructor +1 line
- src/core/palette.js: not touched (the tints live in colorscript.js)
- NEW engine/COLOR_REQUESTS.md (hooks H1-H16), CORE_REQUESTS.md R-COLOR1 (frame clock)
- NEW tools/v4/color/sample_cs.mjs (prints the script), tools/v4/color/m1_sheet.py (the M1 sheet + strip)

## Commands (from engine/, `export TMPDIR=$PWD/out/dev/tmp`)
- stills: `node render.js --show main --res 1920x1080 --fig native --figscale 1.3 --figres 2.5 --look k08b[+cs[=warm]] --stills t:file,...`
  (same 15 times for every variant, so the setup range and the RNG stream are equal): out/dev/color/m1.sh
- sheet: `../.venv/bin/python tools/v4/color/m1_sheet.py out/dev/color/m1 out/review/passB/color/m1_sheet.jpg`

## Gen spend
$0 (no generation).

## Results

### M1 (2026-10-18 ~17:40): engine/out/review/passB/color/m1_sheet.jpg
- 15 frames (0:05 ... 3:00), before (`--look k08b`) | after (`--look k08b+cs`), 1080p stills from ONE frozen tree (an early set
  mixed trees: stage_3d added the FIXTURES slab between my renders, so everything was re-rendered from a snapshot), + the colour
  strip (time -> saturation, cues, frame markers), + the 3D alternative row (warm plaster | graphite | before | approved 09 / 08).
  At M1 the default was graphite and warm was the alternative; the coordinator swapped them (below).
- Reads: PAINT IT card graphite while the 画 she draws + her rainbow trail keep colour; the kaizo colour caps / flowers go grey
  (hook H1 restores them in one line); the VOID loses its navy (dark graphite grid; the blueprint identity is weaker, owner's
  call); prompt box and REALITY bar graphite; 出发 at 1:14 and 1:20 keeps its rainbow; 3D heroes + bugs keep canon colour (2-4x
  crop at 87: pale-blue back dot, orange bands, patch on the sleeve band, navy pants, yellow pencil + blue cap); the flood is
  the first full-colour world; the bridge drains to lilac-grey dusk with coloured heroes; 2:20 / 2:40 / 3:00 identical to before.
- Default inertness: A/B frozen trees (A = my four files reverted, B = mine), `--look k08b`, 540p stills 30 / 100 / 130:
  ALL IDENTICAL (cmp).
- Cost (540p, 1 worker, shared GPU, 60 frames incl. init): 3D 100-102 25.9 -> 27.8 s, 2D 28-30 6.9 -> 6.7 s (within noise).

### Coordinator M1 review -> changes
1. Warm plaster is the default 3D pre-flood (targets 08 / 09 are warm and golden); graphite kept as `+cs=graphite`.
   (colorscript.js VARIANTS; backup of the M1 version: out/bak_v4b/color/colorscript.m1.js)
2. Spotlights 107.15-110.41: the HDR protect does not catch them (additive cones at 0.16, basic pools at 0.5); added a timed
   chroma protect for that window (protSat 0.42) and kept the exact tag as hook H12. Live-tree stills 107.8 / 108.4 / 109.0
   with and without the grade: the rose (Charlie) and teal (Ricky) light on the heroes survives; the pale pools read the same.
3. Drain made continuous: it now starts at 1.15 (the flood hold) instead of 1.0 (was a 0.15 step on the 123.354 cut).

### M2 (narrow, per the coordinator): engine/out/review/passB/color/
- `m2_114-146.mp4`: 540p, 30 fps, AAC, `--fig native --figscale 1.3 --figres 2.5 --look k08b+cs`, 960 frames, 126 s on 1 worker.
  Rendered from the frozen snapshot tree (17:15) with my current files: the live tree currently fails init for any range past
  143.48 (the paper unit's new 2:23 insert: `clip missing ... paper_0223.mp4`, then an uncaught `Event`; same with plain
  `--look k08b`, so it is not the grade). Content after 143.48 is therefore the pre-insert state.
- Luma scan (`m2_lumascan.txt`, thr 35, up + down): 3 flags, all deliberate: 125.800 (+75, the cut to the bridge paper card),
  129.400 (-50, the hard cut back to 3D), 139.400 (+36, the slam flash). 0 one-frame blips.
- Saturation trace (ffmpeg SATAVG per frame): pre-flood 7-18; the 119.02 ramp climbs 13 -> 35 monotonically over 119.07-119.7
  (one dip to 4 on 119.033 = the white plant stab); flood 21-36; the drain falls 23 -> 5 monotonically over 123.4-125.8 with no
  steps; dusk 4-9; the slam jumps to 17-20 on 139.4 (intended: the return lands on the hit); 140-146 13-24. Every other
  frame-to-frame jump > 6 is on a cut (120.135, 120.94, 121.4, 123.354, 125.8, 129.4). No flicker or pop inside a ramp.
- `m2_chufa_pair.jpg` (+ the four PNGs): 72.2 = the cut to the gate before 出发 erupts (graphite world, heroes in colour);
  80.8 = the shatter frame: 出发 keeps its full rainbow, the ground / grid / props go graphite.

### Hooks (coordinator: H1-H7 + H16 are the colour unit's now; backups engine/out/bak_v4b/color/hooks/{kaizo,chorus,show}.js)
- src/scenes/act1/kaizo.js (tags only, no timing):
  - :95-97 H1 `flBatch.userData.cs = 1` (flowers + colour caps); H3 two new tagged batches `cxFx` (Z.FX, 200) and `cxHi` (Z.TOP, 100)
  - :464 H2 `eraserQ.userData.cs = 1` (the rainbow smudge)
  - begin / end of cxFx + cxHi beside the other batches (:565, :729)
  - H3 redirected to the colour batches: the flower-bloom sparkle (:580), the latched-link sparkle (:618), the 来 sparkle (:662), the rainbow squeak sparks (:713)
  - H4 (:602) `linkBatch / linkedLbl / underline .userData.cs = t >= tClick ? 1 : 0`: graphite until Ricky's chord clicks the link (22.98), then the hyperlink blue / visited purple (the colour is the gag). The pre-click part is now under the paper unit's #03 close-up.
- src/scenes/act2/chorus.js (re-read right before editing; the type unit's cut snap at :53-56 untouched; tags only):
  - :97-98 H5 two new tagged batches `cTiles` (Z.PLATFORM, 1500) and `cFx` (Z.FX, 600)
  - :183 H7 the 出 发 chant characters
  - :138 H6 the FUNCTIONS letters
  - begin / end beside the other batches
  - H5 `cblk*` rainbow chunk tiles -> cTiles (:577); Jade's paint sparks (:589), launch trail (:601) and paint tip (:602) -> cFx. The plain ground stays graphite.
- src/core/show.js: `import { CS } from './colorscript.js'` + `CS.t = t;` first line of `render(t)` (H16 / R-COLOR1).
- src/post.js / src/core/colorscript.js: `csInstallClock` removed (import + call + function).
- Check (engine/out/review/passB/color/hooks_sheet.jpg): 1080p pairs at 21, 24, 29.5, 60 and 74, from one frozen snapshot tree.
  - 24: the visited-purple chain + "linked" keep their colour.
  - 29.5: the colour caps, the Eraser smudge and the squeak sparks keep their colour.
  - 60 / 58: FUNCTIONS is rainbow and FIXTURES graphite; the pencil + the rainbow from its tip stay coloured.
  - 74: the 出 发 chant matches the rainbow 出发.
  - 21 / 22.5: the paper unit's #03 close-up now covers the frame; it is full colour and never graded.
- Default inertness: snapshot tree with the hooks vs the same tree with the pre-hook kaizo / chorus / show, `--look k08b`, 1080p stills at 21 / 22.5 / 24 / 29.5 / 58 / 60 / 66.5 / 74: ALL IDENTICAL (the new batches don't reorder anything visible in these frames).
- `node --check` on every edited file: OK. The live tree still crashes past 143.48 (the paper unit is fixing it); these checks are all before it.

## Open / risks
- H9-H15 (stage_3d / paper / type) are pending with their owners. The chroma windows (72.17-86.385, 107.15-110.41, 129.34-139.395) keep
  any strongly saturated prop, not only the intended one.
- 3D UI drawn after post (battle_ui stamps, type overlays) is not graded: H13 / H15.
- The hero mask is post-DOF in the final pass: an out-of-focus hero's blurred halo is graded grey outside the sharp mask.
  With `--mblur` the mask comes from the last sub-frame (≤ 1/3 frame of misalignment on fast moves). Not seen in the stills.
- H8 skipped: still 02 bypasses post (it stays the approved full colour).
- New tagged batches only change draw order among sprites on the same layer. That was invisible in every checked frame, but an overlap elsewhere in 41-80 could differ by a pixel without +cs.
- Jade's face is blown out at 107.8-109.0 in the live stage shot (stage_3d's light, with or without the grade): for stage_3d.
- To ship: add `+cs` to the master command (or make LookPass treat bare `k08b` as `k08b+cs`).

## M3 (blossoms bridge) · 2026-10-18
Trigger: the type M3 audit found that the held note 18.10-20.11 is "blossoms" ("because" starts 20.13, just as card 03 cuts in at 20.167).
Jade: "Relabel to blossoms — you could even make the blossoms look like blossoms". Gen spend: **$0**.

**Design.** The letters are chains of 4 px blossoms in a custom flower-cell font: 1-cell strokes, 2 ascender rows + 5 x-height rows,
graphite outline, a few hanging twigs ending in a bud. Each blossom has petal-white or pale-pink petals and a pink centre. At 540p it reads
as the word first and as blossoms second; the 1-px PressStart cell-3 style was too small for flowers. **Colour:** the blossoms stay
graphite (paper-white petals, graphite line) with a blush of pink that keeps `BLOSSOM_KEEP = 0.6` through the colour script. The bridge
cannot be full colour, because the Eraser only eats graphite and "COLOR IS HARD TO ERASE" pays off at 28.3. The full-colour path flowers
stay the only real colour (the clue). Until the sung onset the blossoms are closed grey buds. They open on "blossoms" (`T.word(5,6)` = 18.10),
a one-frame ripple from left to right with a small sparkle. When the rubbing edge drops a letter, it bursts into 16 fluttering pixel petals
(white/pink, 3x2 / 3x1). While the edge is inside the bridge, the edge debris is petals instead of graphite crumbs.

**Changes** (backups: engine/out/bak_v4b/color/m3/{kaizo,level}.js.prem3; working copies out/dev/color/m3/work/)
- src/scenes/act1/level.js
  - :12-25 `BRIDGE_WORD`, `BRIDGE_CELL` 4, `BRIDGE_GLYPHS` (b l o s m), `bridgeDropX` (60 % across a letter, as before), `FLOOR_LYRIC`.
  - :49-53 `X.bridge` letter layout: [608, 764), 156 px; it was [608, 777) for "because". pit0/pit1/ledge0 are unchanged, so the hat, BOING and ledge keep their positions.
  - :103-108 rubX re-timed. The edge now trails Ricky's heels by about 13 px from the stop to 19.0. **Before, it ran 8-25 px ahead of him (16.9-19.3), so he ran on rubbed-out floor and on letters that had already dropped** (seen at 18.8 in the old frames). The new keys are F1a+0.17 -72, F1b -69, beat 41 -68, 18.0 533, 18.5 627, 19.0 725, 19.30 759, then 790 / 840 unchanged.
  - Drops: b 18.46, l 18.56, o 18.64, s 18.74, s 18.84, o 18.96, m 19.11, then the last s on 19.30 (the frame Ricky falls short off it). "because" ran 18.29-19.27; the first drop is about 0.15 s later because the edge has to stay behind Ricky.
  - :155-157 the LOC blocks use FLOOR_LYRIC (33 tiles) and the 8 bridge letters. Totals are the same once the edge passes; LOC is not drawn anywhere now. :200 flowerTimes keeps the full line, so the same flowers bloom.
- src/scenes/act1/kaizo.js
  - :14-17 header.
  - :54 import.
  - :90 petal atlas entries.
  - :100 `ptBatch` (Z.FX, cs 0.6).
  - :113 floor tiles = FLOOR_LYRIC: the floor reads "...about life just" and the bridge completes it with "blossoms". It was "...just blossoms" followed by "blossoms" again.
  - :118-137 the bridge: textures `blossomLetter` (closed/open), `colTop`, `bridgeH` (the highest cell under a 6 px foot; the l's lone base serif counts as a gap, not a 16 px pothole), letterFall via bridgeDropX, `tChew`.
  - :212 ground.
  - :284-292 Ricky runs to `rEdge = BX1-4`. The old `BX1-14` would have walked him backwards on the shorter bridge.
  - :497 the NOT VERY EFFECTIVE banner moved from y 42 to y 6, below the bridge. It hid the b l, so the whole word was never on screen at once.
  - :600-607 open / fall / sparkle / petal burst.
  - :724-727 petals instead of crumbs in tChew.
  - :763-766 line 6 dropped from act 1's subtitle list (comment explains).
  - :781-835 the art: `BLOSSOM_*`, `blossomLetter`, `petalCanvases`, `petalBurst`.
- NEW tools/v4/color/m3_sheet.py.

**Checks**
- Walking: debug log from a snapshot tree, every frame 16.6-20.2, with hero x/y against each letter's drop time. **0 frames of anyone grounded on a dropped letter.** Before, Ricky stood on dropped letters for 16 frames (18.33-18.9).
- Beats on their times: Jade's lead keys untouched (ledge 19.095). Ricky falls on 19.30, BOING 19.46, ledge landing on beat 46 (19.941). Charlie's throw / hat unchanged (19.8 / 20.1 frames match before apart from petals).
- Outside 14-21, A (pre-M3) vs B (M3) from one frozen tree, `--look k08b+cs`: 1080p 12 / 25 and 540p 5 / 13.5 / 13.95 / 23.8 / 24.5 / 27 / 30 / 35 / 40 / 60 are **all byte-identical**.
- `node --check` OK on both files. 0 page errors.
- Review: `engine/out/review/passB/color/m3_blossoms_14-21.mp4` (540p, 30 fps, audio, live tree, 210 frames).
- Sheet: `m3_blossoms_sheet.jpg` (before "because" | after "blossoms" at 18.3 / 18.8 / 19.3 / 19.8 / 20.1).
- 1080p stills: `m3_stills/blossoms_<t>.png`.

**Open**
- Line 6 "because" still has no caption (type open item 2). If type flips line 6 off inWorld and paper adds it to p03's subs, act 1 will not flash it, because kaizo no longer lists line 6.
- The pink blush is a choice: keep 0.6 under +cs; plain `k08b` shows the full pastel pink. Turn BLOSSOM_KEEP down if the coordinator wants stricter graphite before 1:59.
- The four clue flowers that bloomed on the old "blossoms" floor tiles (x 524-578) now bloom on bare floor. They were kept so the bloom count and the LOC stay the same.

## M3b (blossoms look, coordinator review) · 2026-10-18
Review: the M3 geometry, timing, Ricky-on-air fix, floor lyric, banner move and petal bursts were approved and are kept exactly. The look was not
approved: pale dotted beads with low contrast on the cream page. New direction: a graphite branch bent into each letter, with real blossoms on it. Gen spend **$0**.

**What changed (src/scenes/act1/kaizo.js only; level.js untouched; backup of the M3 state: out/bak_v4b/color/m3/kaizo.js.m3)**
- :781-860 the art block is rewritten.
  - `blossomLetter` draws a 3 px graphite branch through the glyph cells. It is lit along its top row and has a few knots on the underside. Orthogonal neighbours are joined, and corners bend diagonally (o, s, b), so it reads as a bent branch.
  - Twigs with a bud grow off about 60 % of the free ends.
  - Blossoms (`blossomShape`, five petal discs around a dark-rose centre, with a rose outline) come in three sizes: 7 px on 60 % of the ends, 5 px at the ends and joints (p 0.9 / 0.7), and tiny 3 px ones along the strokes (p 0.45). About 30 % are white instead of pink. A few petals hang below the bottom row.
  - Closed state (before 18.10): the branch plus buds only.
- Petals (atlas pt0-3) now use the same pink-white and rose palette.
- `BLOSSOM_KEEP` 0.6 -> **0.85** (bridge quads + ptBatch).
- `BM` 6 -> 7: the margin is wider for the 7 px flowers. The quad placement formula is unchanged.
- **Colour choice:** a clear pale pink on a graphite branch, as the coordinator suggested.
  - The branch is the graphite part that the Eraser eats, and the blossoms burst off it. That sets up "COLOR IS HARD TO ERASE".
  - The pink is pastel and kept at 0.85, so the saturated path flowers are still the only painted colour before 1:59.
- **Walking surface:** the branch's top row is the old outline row, canvas `M + y*c - 1`, which is world `FLOOR + (2 - y) * c` = `bridgeH`. Flowers in a column's top cell sit 1 px lower, so feet don't sink into them.

**Checks**
- No-air log, every frame 16.6-20.2: **0 frames on a dropped letter**. Heights while on letters are only 56 / 60 / 68 (66 samples), the same surface as M3.
- Pre-M3 vs M3b from one frozen tree: 1080p 12 / 25 and 540p 5 / 13.95 / 23.8 / 27 / 35 / 40 are **byte-identical**. `node --check` OK, 0 page errors.
- Review: `engine/out/review/passB/color/m3b_blossoms_14-21.mp4` (540p, audio, live tree).
- Sheet: `m3b_blossoms_sheet.jpg` (M3 | M3b at 18.07 / 18.3 / 18.8 / 19.3 at 1080p, plus a 540p 1x crop row of 18.3).
- Stills: `m3b_stills/` (1080p 18.3 / 18.8 / 19.3; full 540p frames of 18.3 for M3 and M3b).
- New tool: tools/v4/color/m3b_sheet.py.

**Open:** at 540p the pink reads soft but clearly pink. If more is wanted, set `BLOSSOM_KEEP` to 1, or darken `BL_C.po` (the flower outline) for more edge contrast.
