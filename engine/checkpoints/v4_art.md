# v4 Pass A: art agent (Tier-2 stills + v11 brows), 2026-10-18

These are stills only: nothing animated, no engine code edited, no loaded asset overwritten. All output is in new folders:
`assets/sheets/v11/`, `assets/v4_stills/`, `engine/out/review/v4_stills/`.

## Review sheets (for Jade)
- `engine/out/review/v4_stills/brows_v11_sheet.jpg`: before/after with 2x face crops for every Jade paper asset.
- `engine/out/review/v4_stills/stills_sheet.jpg`: the 11 stills, each labelled with number, song time and intent.

## Budget
- Spend before this pass: $65.01 (tools/gen/spend.py over media/genlog.jsonl; matches the decisions/checkpoint trail). Project cap $500.
- **This pass: 39 nano-banana-pro 2K gens x $0.1344 = $5.24** (cap $40). Project total is now $70.25.
- Every gen is logged in media/genlog.jsonl with tag `v11_*` (brows, 7 gens) or `v4s_*` (stills, 32 gens). Gen helper:
  tools/gen/cf.py `generate()`, run with ~/Documents/1-music-shipped/moongazing/.venv/bin/python (it needs jsonschema; the repo .venv lacks it).

| tag | n | $ | purpose |
|---|---|---|---|
| v11_brows_smidge_expr / _r2 | 2 | 0.27 | exact v10_brows_smidge prompt on v3 expr; both overshot to about v9 weight (rejected) |
| v11_brows_smidge_expr_ref | 1 | 0.13 | **used** (exact prompt + weight anchor, see below) |
| v11_brows_smidge_lineup / _ref | 2 | 0.27 | _ref **used** |
| v11_brows_smidge_spread / _ref | 2 | 0.27 | _ref **used** |
| v4s_01 | 1 | 0.13 | #01 |
| v4s_03 + patchfix | 2 | 0.27 | #03 |
| v4s_04 x3 + edit x2 | 5 | 0.67 | #04 (edit from the approved expr panel 1) |
| v4s_05 | 1 | 0.13 | #05 |
| v4s_06 x3 + patchfix | 4 | 0.54 | #06 |
| v4s_07 x3 | 3 | 0.40 | #07 |
| v4s_08 x2 + pencilfix + chestfix | 4 | 0.54 | #08 |
| v4s_09 x2 + charliefix x2 + rickyfix | 5 | 0.67 | #09 |
| v4s_10 x2 + rickyfix | 3 | 0.40 | #10 |
| v4s_11 x2 + layoutfix x2 | 4 | 0.54 | #11 |

## Step 1: brows v11 = candidate A (v3 + about 25%)
Method (tool: `assets/sheets/v11/tools/brow_composite.py`, jobs in `brow_jobs.json`):
- **Base:** the approved v3 paper art (`assets/sheets/paper/old_v3/*`). v9 differs from v3 only in the brow regions (checked by pixel diff).
- **Source:** a nano-banana-pro edit of the same sheet. Brows are drawn by the model only, never by code.
- **Mask:** a superellipse per brow box, intersected with dark(src)|dark(base), dilated 2 px, gaussian feather 2 px. This is the same idea as the
  turn_v10a_front ellipses. The turn front uses those exact ellipses: centres (364,205)/(416,205), r 26x13.
- **Registration:** an integer-shift check per face. All shifts came out 0 (lineup -1 px).
- **Prompt:**
  - turn: the existing `assets/sheets/raw/v10_turn_a.png` (exact v10_brows_smidge gen), applied to all 3 faces (front, 3/4, profile).
  - expr: the exact prompt overshot twice on the larger faces (about v9 weight, and it flattened the sad/angry expressions). So the used gen =
    the exact prompt + one appended sentence ("match the brow weight of the THIRD image… keep each face's expression") + a 3rd input
    `assets/sheets/v11/raw/ref_candidateA_front.png` (2x crop of Jade's approved turn_v10a_front). Prompt file: scratch copy saved in the
    genlog entry (tag v11_brows_smidge_expr_ref).
  - lineup and spread: the same ref-anchored prompt.
  The result sits clearly between v3 and v9 on every face (see sheet).
- **Outputs** (`assets/sheets/v11/`):
  - `paper_jade_turnaround_v11.png`, `paper_expr_jade_v11.png`, `paper_lineup_v11.png`
  - `jade_sing_a_v11.jpg`, `jade_sing_b_v11.jpg`, `jade_laugh_v11.jpg`: the bridge stills. These are crops of the v3 expr sheet at (1880,10),
    (180,772), (1110,772), so their old heavy brows were replaced from the v11 sheet. Their pencil-tip fix is kept.
  - `lineup_v11.jpg`: the act4 montage `lineup.jpg` (that one was v5-based; this is v3 + v11 brows, 1920x1071).
  - `spread_v2_v11.png` + `spread_full_v11.jpg` / `spread_half_v11.jpg`: drop-in for media/act5/tex.
    The spread's original brows were already heavy, so v11 there is slightly *lighter*.
- Raw sources and masks are in `assets/sheets/v11/raw/`.
- Not touched: the bridge singing **video** clip. If brows go onto it, use the +0.10 s start (v4_brief).

## Step 2: Tier-2 stills (assets/v4_stills/, 1920x1080 PNG)
- Builder: `assets/v4_stills/tools/compose.py`. All exact text is set in code; the model drew no text that ships.
- #11 page layout: `tools/page11.py` + `tools/capfix11.py`.
- Sheet: `tools/stills_sheet.py`.
- Prompts: `assets/v4_stills/prompts/` (full_*.txt, fix_*.txt; canon blocks canon_bun/canon_down/canon_3d_down).
- Inputs: `assets/v4_stills/in/` (v11 sheets, v3 master frames, left/right spread crops).
- Picks and alternates: `assets/v4_stills/work/`.

| # | file | source | canon audit (Jade cropped 2-4x) | alternates |
|---|---|---|---|---|
| 01 | 01_sketchbook_2011.png | NBP edit of the spread's left page (graphite Charlie, flat cap) + yellow pencil landing; slate `2011 · a song about product management` in LXGW WenKai (engine hand font) | no Jade. Pencil yellow, graphite tip (cap out of frame). The 一 stroke starts as Level 1's floor line | - |
| 02 | 02_save_file_continue.png | **code-built** pixel UI in the v3 7 s look (brick board, gold frames, PressStart2P) + approved sprites `portrait_charlie`, `jade_draw_graphite_hi` (graphite line cropped; she presses CONTINUE? with the pencil's pink eraser end) | PASS with a flag: hair down + pencil in hand OK, white jacket/orange, navy pants. **The approved sprite predates the neck-headphones canon, so no headphones read at sprite scale**; the patch can't be read at this scale | - |
| 03 | 03_paper_0020.png | NBP (expr_v11 + turn_v11) + patch-fix edit | PASS: bun X, caps up blue/pink, patch on her LEFT (far, image-right) arm on the band, headphones on neck, v11 brows, mouth open | - (s03_a had the patch on the wrong arm; deleted) |
| 04 | 04_paper_0048.png | NBP **edit of approved expr panel 1** (text-to-image drifted off-model twice) | PASS: on-model face, X caps up, patch image-right on the band, horizontal bands only. Prompt-window catch-lights in both irises (subtle) | work/s04_d.png (more frontal, smaller head) |
| 05 | 05_paper_0147.png | NBP (expr, turn, lineup) | PASS: Jade X caps up (one tip shows by her ear, as in the approved sheets), patch on band, headphones on neck, wide navy pants + strap; Charlie flat cap + acoustic; Ricky Strat + stripes; mic below the mouth | - |
| 06 | 06_paper_0223.png | NBP (+ eraser_boss_sheet) + patch-fix edit | PASS with a minor note: hair long/down, blue-cap rainbow-tip pencil in hand, headphones on neck, midriff. The patch is on the raised LEFT arm but sits on the **top edge** of the band, not centred | - |
| 07 | 07_flood_full_frame.png | NBP (v3 frame 121.5 + k09 + turn) | PASS: front-on, hair down, giant yellow pencil blue cap / rainbow tip, patch image-right on the band, headphones on neck, baggy navy + orange straps, chunky sneakers, no UI | work/s07_a.png (3/4 lunge, stronger wave, not front-on) |
| 08 | 08_band_on_stage_0147.png | NBP (v3 107.8 + k08 + lineup) + 2 fix edits | PASS with a flag: chest dot, patch on the raised arm band, headphones, pants/straps OK, singing into the yellow pink-cap pencil. **The pencil-mic touches the corner of her mouth**, and her raised fist is empty (only one pencil shown) | - |
| 09 | 09_slab_fixtures.png | NBP (v3 87.5 + k06 + 90.8) + Charlie and Ricky fixes | PASS: back view, hair down, pencils in hands, RARE EARTH back; Charlie charcoal tee + cap + acoustic; Ricky jeans. FIXTURES spelled right by the model (kept) | work/s09_a.png (pixel-font carving; Ricky's pants striped there) |
| 10 | 10_slab_functions.png | NBP edit of #09 + Ricky fix | PASS: FUNCTIONS spelled right, rainbow grooves; Ricky's beam links the slabs | - |
| 11 | 11_outro_page.png | NBP colour version of #01 (s11_c), re-laid **in code** onto #01's page at the same position and scale (aligned on Charlie's cap/desk) + a pixel recolor of one hair-pencil cap (the model drew both caps blue) + stamp/captions/dedication in code | PASS after the fix: bun X with blue + pink/orange caps up, patch on the left-arm band, headphones on neck, wide navy pants pooling + straps, midriff. Charlie same pose + cap; Ricky Strat. The end-card wording is verbatim from decisions 2026-10-17 | work/s11_c.png (the colour drawing before layout) |

Text in #11, verbatim:
- `Charlie wrote this about product management in 2011.`
- `We shipped The Vibe Coding Song in 2026.`
- dedication `For every idea that waited in a drawer.`
- stamp `SAVE COMPLETE · 2026` (stampCanvas style)

## How Pass B could reach each frame in-engine
- **01 / 11:** act5 paper-page system (spread.js / paperkit.js), shown as one full-frame page.
  - Textures: the drawing (`work/s01_a.png`, and `work/s11_page.png` at the same placement) on one paper plate.
  - Text: the slate and captions via `handText` (KAI); the stamp via a `stampCanvas` variant ('SAVE COMPLETE', '· 2026 ·').
  - Pencil + 一: the landing pencil as a sprite or `drawPencil`; 一 drawn with `PencilHanzi` on the 0.343 kick.
  - Transition: 01 → 11 by colour wipe; layouts already align.
  - Note: #11's paper is a clean plate (no gutter or pencil shadow), so build both from one plate.
- **02:** act1 select-screen code (same bricks/frames/fonts). On 7.18:
  - The CONTINUE? button goes to its pressed state with a flash.
  - Jade = `jade_draw_graphite_hi` with the line cropped at x>=93, scaled 5x.
  - The model-free layout values are in compose.py `s02()`.
- **03-06:** paper cutscene cards, like the bridge card.
  - Each needs its own lip-sync offset check (v4_brief), with v11 brows already in.
  - 04's eye reflection is subtle; a composited reflection could be added if wanted.
- **07:** k09 flood wave (flood_k09) at 119.02.
  - Camera: low, front-on at Jade's chest. Hero pose 'plant' facing camera, pencil prop scaled about 3x.
  - Wave: drive the ring's near edge through the camera.
  - UI: hide all battle UI 119.0-123.3.
  - Needs headphones on the native model, if the canon on-neck rule applies to 3D too (the models were built with headphones OFF per decision 7).
- **08:** 107.15 amphitheatre.
  - Camera: front-on medium.
  - Lights: three coloured SpotLights + light shafts (gold Jade, rose Charlie, teal Ricky).
  - Remove the hanging lyric sign; pencil-mic below the chin.
- **09 / 10:** slabs at 86.87.
  - Carving: extruded-text CSG or a height/normal-map decal on the slab front.
  - FUNCTIONS: emissive rainbow gradient in the grooves; reuse Ricky's beam connector.
  - Reuse at 180.23 / 183.07 if drop 2 brings the slabs back (v3 uses the aerial pencil view there).

## Unsure / flags for Jade
1. **Brow strength:**
   - expr/lineup/spread needed a weight anchor (approved front crop as 3rd ref), because the exact prompt alone came out about as heavy as v9.
   - The lineup brows read slightly grey/soft.
   - The spread's brows got lighter than before.
2. **02:** the sprite has no visible neck headphones (sprite-era canon).
3. **08:** the mic touches the mouth corner; only one pencil is shown.
4. **06:** the patch is on the band's edge.
5. **3D frames:** these are model paint-overs in the engine look, not engine renders. No engine stills were rendered: the requested framings need new cameras, which means engine code, and that was out of scope.
