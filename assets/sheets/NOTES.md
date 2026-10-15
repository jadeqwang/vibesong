# Art department notes: sheets and sprites

## INSTALLED: v9 = Jade-approved likeness 2026-10-14
- `paper/paper_jade_turnaround.png`, `paper/paper_expr_jade.png`, `paper/paper_lineup.png` are now `v6/{turn,expr,lineup}_v9.png` (the v9 brows section below). `paper_jade_turnaround_2x.png` is regenerated from it (Lanczos 2x) and `party_paper_sheet.png` is rebuilt (compose.py section 5 captions now say v9).
- The previous installed set (v5) is kept in `paper/old_v5/` (incl. `party_paper_sheet_v5.png`).
- All PAPER cutscene first frames (media/cutscenes/) start from these v9 panels.

## A-1 back-view strips (engine request)
Generated with gpt-image-2.5-sunburst: 1 call, $0.21, tag `art10_backs`. Raw sheet: `raw/backs_t1.png`. Config: `tools/sprites/backs_cfg.py`. Each strip uses its hero's existing palette.

**Strips**
- `charlie_back`, `ricky_back`, `jade_back_hairdown`: 2-frame idle each.
- `_run` versions of each: 4-frame back-view run.
- `jade_back_down` is an alias of `jade_back_hairdown`.

**Jade hair-down back view**
- Long hair covers the jacket back, and a few pale-blue pixels peek out at the sides.
- Weak spot: her hand-held pencils read as dark nubs rather than clearly yellow.

**Review:** `review/backs_x8.png`.

**Brows:** no brow version is installed in the sheets yet; this waits for Jade's pick.

## v9 brows: drawn by the model, v3 everywhere else (INSTALLED 2026-10-14: v9 = Jade-approved likeness)
Spend: $1.21 (9 nano-banana-pro edits, tag `art9_brows`). Script: `tools/sprites/v9_brows.py`. Outputs are in `v6/{turn,expr,lineup}_v9.png`. Review: `review/jade_v9_brows.jpg` (v3 | v4 | v9).

**Method**
1. **Generate.** nano-banana-pro redrew only the brows on each v3 sheet, three candidates per sheet (`raw/v9_<sheet>_{a,b,c}`). Each candidate was then composited the way step 2 describes (`v6/<sheet>_v9{a,b,c}.png`).
2. **Composite.** Each face takes the model's pixels only inside a feathered band per eye: from about 0.75 × eye width above the brow landmarks down to just above the upper lid. Inside that band the old v3 brow and any crossing hair come from the model, so the band is coherent. Everywhere else the pixels are v3's.
3. **Checks.** Every candidate shifted under 0.2 px. Two had changed eyes and were rejected: turn 3/4 candidate a, and expression 3 candidate b.
4. **Picks (by eye):** front b, 3/4 c, expressions b, c, a, a, a, a, lineup a.

**Weak spots**
- The front brows are a little heavier than the others.
- The model added faint furrow lines to some expression panels (sing loud, determined).
- The profile view is unchanged.

## v8 brows: v3's brows thickened (not installed; for Jade to choose)
Jade judged v4–v7 worse than v3, so v8 starts again from v3. Made in code with no paid calls: `tools/sprites/v8m.py`. Outputs are in `v6/{turn,expr,lineup}_v8.png` and `_v8b.png`. Review: `review/jade_v8_brows.jpg` (v3 | v8 | v8b).

**How it works**
- **Centre-lines are traced by hand.** Automatic detection kept merging the brows with hair and eyelids, so I traced each v3 brow's centre-line, head to tail (18 brows). The points are listed in the script.
- **Each brow becomes one smooth ribbon** at about 2× v3's stroke width, with a rounded head, a tapered tail, and the same curve as v3:
  - **v8** grows upward: the bottom edge stays where v3's was, so the brow-to-eye gap is unchanged.
  - **v8b** grows equally up and down.
- **Rendering:**
  - The fill is the hair mid-tone (v6A's colour), lighter toward the tail, with a subtle slanted stroke rhythm. The edge is a 1-px anti-aliased line with no halo.
  - Any part of the old v3 stroke not covered by the new shape is erased.
  - Hair strands that reach well outside the brow are layered back on top.
- **Fragment check:** every brow was checked at about 5× zoom. Each is a single shape.

**Weak spots**
- The fill reads as fairly flat (more marker than pencil).
- In expression 4 the v3 eyelid crease below the right brow stays visible, as in v3.
- The profile view is unchanged.

## v7 brows: clean redraw (not installed; for Jade to choose)
Made in code with no paid calls: `tools/sprites/v6_brows.py v7` and `tools/sprites/v7_draw.py`. Outputs are in `v6/*_v7.png`. Review: `review/jade_v7_brows.jpg` (v6A | v6B | v7 | trace).

**Method**
- **Shape and placement:** taken from v6B. The trace's brow at the trace's gap: an outline fitted to the envelope of the trace strokes, with a rounded inner head and a tapered tail. Her right brow has a straight top line; her left has a soft arch.
- **Fill:** the hair mid-tone, lighter toward the tail, with fine directional strokes inside. The edge is a 1-px anti-aliased line, with no halo.
- **Layering:** hair strands are put back on top, so the brow tails run under the hair. The old brow is no longer erased under the hair.

**Gap ratio.** Trace 0.68; v7 0.68–0.72 on the neutral views. The expressive panels keep v6B's fitted positions.

**Weak spots**
- In the front views the hair hides much of each brow tail.
- The strokes are barely visible at sheet scale.
- Faint marks of the old brow remain where it met the hair.
- The profile view is unchanged.

## Sprite additions (engine team request)
Generated with gpt-image-2.5-sunburst, 2 calls, $0.43, tag `art6_sprites`. Raw sheets: `raw/hang_t1.png`, `raw/bunpull_t1.png`. Config: `tools/sprites/extra_cfg.py` → `extra.json`. Each new strip uses its hero's existing palette exactly (new `palette_from` option in `build.py`).

**`<hero>_hang.png`**
- 2 frames at 36×44, 4 fps: frame 0 legs forward, frame 1 legs back.
- The grab bar is baked into the top rows, with the hands at y≈2. It is recoloured to one dark gray per hero (`bar_fix.py`).
- Place the sprite so the hands sit on the ledge or chain.

**`jade_bun_pull.png`**
- 3 frames at 36×44, 6 fps, no loop:
  - frame 0: reaching to the bun, pencils crossed in an X;
  - frame 1: blue-cap pencil out, hair half down;
  - frame 2: hair fully down, both pencils in hand.
- Pencil fixes:
  - frame 0 hides the X crossing inside the bun (`fix_x2`), so no tip shows in front of the hairline;
  - in frames 1–2 the blue pencil gets a rainbow tip (`hand_tips`).

**Weak spots**
- The raised pencil in frame 1 bends slightly.
- Jade's hang pose shows the caps beside her head rather than a clear X.
- All of these strips are in `sprites.json` and `party_pixel_sheet.png`.

## v6 brow variants, for Jade to choose (not yet installed in the sheets)
Both variants start from v5 and change only the brows. Both are procedural, with no model calls ($0). Script: `tools/sprites/v6_brows.py`. Outputs are in `v6/{turn,expr,lineup}_v6A.png` and `_v6B.png`. Review: `review/jade_v6_brows.jpg`.

**Gap metric.** The gap is the distance from the upper lid down to the bottom of the brow, divided by eye width, measured with MediaPipe landmarks. Pairs below are her right / her left brow.

| | Trace | v5 | v6A | v6B |
|---|---|---|---|---|
| Front | 0.68 / 0.68 | 0.35 / 0.35 | 0.31 / 0.31 | 0.66 / 0.70 |
| 3/4 | | 0.49 / 0.45 | 0.49 / 0.45 | 0.70 / 0.64 |

**v6A**
- Trims about 12.5% more from the bottom of each brow, with the top edge anchored.
- Recolours the brow from skin toward the hair mid-tone, so it is never darker than the hair.
- In the front view the gap ratio drops slightly (0.35 → 0.31) because the lid landmark sits differently. This variant is the more conservative of the two.

**v6B**
1. Jade's real brows were segmented from `jade_trace_jacket_hp_1` (`v6/trace_brows_extracted.png`).
2. Each brow is placed with a similarity transform from the trace's eye corners to the paper face's eye corners, then shifted vertically to match the trace's gap ratio.
3. The brows are multiply-composited in the hair tone.
4. Erasing the old brows: the area v4 had changed is first swapped back to v1, so the old brows to erase are the thin v1 ones.

Panels and coverage:
- **Expressive panels** (sing, sing loud, laugh, determined): the trace brow is fitted to the end points of the v5 brow, so the expression survives.
- **Profile view:** not done in either variant.

Weak spots:
- v6A leaves a slight soft halo around the brows.
- v6B brows look thin and pale next to the anime eyes, because the trace's brow-to-eye proportions sit higher.
- v6B leaves small erase marks where hair strands cross the brow ends (expressions 1–2).

## v5 (current): brows trimmed and reshaped
Only the brows change from v4; v4 is kept in `paper/old_v4/`. The final result is **procedural**: `tools/sprites/v5warp.py`, working on v4 pixels.

**Rejected first attempt.** A nano-banana-pro edit ($0.40, tag `art5_brows`) thinned the brows by 30–70% and moved their top edges. Measured per brow column, it was rejected.

**Per brow, what v5warp does**
1. **Trim.** About 10% of the thickness is removed from the bottom edge only (1–2 px), and the removed band is inpainted to skin. The top edge stays anchored.
2. **Reshape.** A smooth vertical warp, limited to a band around the brow, straightens the top line of the image-left brow (her right) and gives the image-right brow (her left) a slight arch.
3. **Texture.** A light hair-stroke texture is added inside the brow only.

**Views and coverage**
- The 3/4 view shows both brows, so the same image-left/image-right mapping applies there.
- The profile view gets no landmarks, so it is unchanged from v4. Its single visible brow (her right) is already straight.

**Review.** `review/jade_v4_v5_brows.jpg` shows v4 | v5 | trace.

**Weak spots**
- The trim is subtle at turnaround scale.
- The texture is not as feathery as the trace.

## v4: stronger brows on top of v3
Only the brows change from v3; v3 is kept as `paper/old_v3/`. Spend for this pass: **$0.40** (3 nano-banana-pro edits, tag `art4_brows`).

**Method (`tools/sprites/v4_brows.py`)**
1. Each v3 sheet (turnaround, expressions, lineup) was edited with nano-banana-pro to give her fuller, darker brows. The brow reference was `refs/trace_brows.jpg`, a crop from `jade_trace_jacket_hp_1`.
2. The edit was checked for alignment: it shifted less than 0.25 px.
3. The edit is pasted back only inside a brow mask: the MediaPipe brow hull from v3 combined with the one from the edit, grown about 35% and feathered. The side view has no landmarks, so its mask is a hand-set box. Everything else is v3's own pixels.

Review: `review/jade_v3_v4_brows.jpg` (v3 | v4 | trace brows).

**Weak spots**
- Some v4 brows are heavier and more solid than the trace's feathery strokes (turnaround 3/4).
- In expression 2 one brow is a little wild.
- The side-view brow change is modest.

**HUD portrait.** `assets/sprites/portrait_jade.png` carries the coordinator's hand fix: no pencil-tip pixels in front of the hairline (Jade said they read as a hairclip); only the caps and yellow bodies stick out above the bun.

**Do not rebuild that file casually.** Rebuilding `others.json` regenerates it from the raw sheet. If you do, run `fix_x2.py portrait_jade --x=1 --notips=1 --top=14 --hide=2.4` afterwards, which ports the same rule; it lands within a few pixels of the hand fix.

**Hair-up sprites.** These only ever show tips behind the bun, outside the silhouette, so none sit in front of the hairline.

`hud_portraits.png` is rebuilt from the fixed strip.

## v3: Jade's verdict was "v1 face is better"

v2's paper Jade was **rejected**: it looked balding, with too little hair volume and eyes too small. The v2 sheet is kept as `party_paper_sheet_v2_rejected.png`.

v3 goes back to the v1 drawings and adds only the canon costume and pencil fixes. Spend for this pass was **$0.54** of the $10 cap (4 nano-banana-pro edits, tag `art3_paper`).

**Method (`tools/sprites/v3_*.py`)**
1. **Same-image edits.** Each v1 drawing (turnaround, expressions, lineup) was edited with nano-banana-pro, using the same image at the same size. Phase correlation checked the alignment: shift was under 0.4 px.
2. **Changed pixels only.** Pixels are taken from the edit only where it differs from v1, and only below the chin.
3. **v1 kept elsewhere.** Faces, hair, buns, headphones and pants are the original v1 pixels. The edit had dropped the headphones, so they are restored from v1.
4. **Real costume artwork.** The `1420 MHz` sleeve patch and the `RARE EARTH` lettering are composited from the actual costume files, placed per the spec. v1 pixels are kept under them.
5. **Lineup colour fixes.** The edit made the epaulets orange and the chest dot cyan; both are recoloured in code to white and pale blue.

**Likeness change.** The brows are about 1 px thicker, done in code by growing each brow's own stroke. Brow positions come from MediaPipe landmarks; the natural left/right difference is kept.

**Pencils**
- **Cap colours.** The v1 back view had two pink caps; one is recoloured to blue.
- **Visible tips.** Wherever a tip shows, the blue-cap pencil gets a painted multicolour lead (Koh-i-Noor Magic look) with a thin rainbow core in the cone. The pink-cap pencil stays plain graphite.
- **Crossing.** In every view the crossing sits inside or behind the bun, as v1 drew it. The front view shows only the cap ends, because the tips are physically behind the head.

**Pixel art**
- **Hair-up sprites** (idle, jump, run, victory, back) and the **HUD portrait**: `tools/sprites/fix_x2.py` hides the X crossing in hair colour, so the pencils read as going through the bun. A tip is drawn only where the pencil exits the silhouette:
  - blue-cap pencil: 2 px multicolour lead;
  - pink-cap pencil: wood + graphite.
- **Hair-down frames** (`tools/sprites/hand_tips.py`): the hand-held blue pencil gets a multicolour lead and the pink one a graphite lead, where the tip is detectable.

**Review images**
- `review/jade_v1_v3_compare.jpg`: v1 next to v3, including HUD portrait before/after.
- `review/jade_x8.png`, `review/portraits_x8.png`.

**v3 weak spots**
- **Front collar.** In the front views the collar is mostly hidden by the v1 headphones; only the epaulets and the tab edge show.
- **Lineup epaulets** keep a faint orange outline.
- **HUD portrait.** The through-the-bun X at 32 px reads as four stubs around the bun.
- **Sing frames.** The mic pencil's tip is not coloured.
- **Side-view sprites.** The blue pencil's tip is hidden inside the head.
- **Paper rainbow leads** are small, readable only when zoomed in.

---
## v2 (rejected for likeness; costume/pixel parts superseded by v3)

Spend for this pass: **$3.90** against a $20 cap (20 calls). Both passes together come to **$8.86**.
All calls are logged in `media/genlog.jsonl` with tags `art2_*`. Note that `spend.py` reports a higher project total because other agents also log there.

### Rules now applied to Jade (bible "Look" row)

**Pencils.**
- Bodies are always yellow.
- The caps are always one **blue** and one **pink-orange**.
- In the bun, the pencils always **cross in an X**.

**Hair.**
- Updo (bun holding both pencils) whenever her hands are empty: idle, jump, run, victory, back view, and all paper views.
- **Long hair down and streaming** whenever the pencils are in her hands: draw_rainbow (blue cap), draw_graphite (pink cap), sing, drum, run_hairdown.

**Jacket**, built on `inputs/jacket-base.png`:
- band collar with a snap throat-tab, snap epaulets, zip front, cropped, orange stripes;
- one small pale-blue chest dot;
- the 1420 MHz patch on the sleeve;
- a big back dot with RARE EARTH under it.

**Real artwork composited in code** (`tools/sprites/costume_comp.py`; the Rare Earth repo was only read, never modified):
- Every model-drawn sleeve patch on the paper turnaround and lineup was inpainted out and replaced with `inputs/sleeve_patch_1420MHz.png`. The models wrote "1428", "MISZ" and similar.
- The back lettering is `costume/artwork/back_rare_earth_lettering.png`, sized and placed from the spec (line = 7.5/7.75 of the dot width, gap = 1/7.75).

**Likeness.**
- Paper Jade is rebuilt from the Orbital Sunrise pencil traces. They were sent as drawings (`refs/jade_trace_head.jpg`, a face crop of `jade_trace_jacket_hp_1.jpg`); no photos were sent.
- The prompts spell out:
  - a large head;
  - a high centre-parted hairline and tall forehead;
  - a wide heart-shaped face;
  - large eyes;
  - slightly asymmetric brows;
  - no glasses, lines or makeup.
- Checked with MediaPipe (`tools/sprites/facemetrics.py`, run in the orbital venv):

  | Metric | Trace | v1 paper | v2 turnaround / expressions |
  |---|---|---|---|
  | forehead (brow→hairline ÷ brow→chin) | 0.48 | 0.38 | 0.47 / 0.50 |
  | eye width ÷ face width | 0.205 | 0.236 | 0.22–0.235 |
  | brow asymmetry | 0.010 | 0.002 | 0.003 (turnaround), 0.026–0.035 (expressions) |

  So v2 fixes the forehead. The eyes stay larger than the trace by design (anime canon).
- Side-by-side: `review/jade_likeness_vs_trace.jpg`. Costume against the references: `review/jade_costume_vs_refs.jpg`.

### v2 files

| File | Source |
|---|---|
| `paper/paper_jade_turnaround(_2x).png` | Chain of gpt-image-2.5 edits: `raw/jade2_turn_gpt_a` (redesign) → `_b` (X pencils) → `_d` (likeness from the trace) → `_e` (taller forehead), then the patch and lettering composite. Prompts: `prompts/jade2_turn*.txt`. |
| `paper/paper_expr_jade.png` | `raw/jade2_expr_gpt_b` → `_c` (forehead edit). Prompts: `jade2_expr*.txt`. |
| `paper/paper_lineup.png` | nano-banana-pro edit of the v1 lineup (`raw/jade2_lineup_nbp_a`); Charlie and Ricky unchanged; real patch composited. |
| `../sprites/jade_*.png` | 10 strips at 36x44 (abilities wider), 18 colours in total. New strips: `jade_back` (shows the big dot) and `jade_run_hairdown`. Sources: `raw/jade2_pix_updo_a/_b`, `raw/jade2_pix_down_b`. |
| `../sprites/portrait_jade.png` | From `raw/jade2_portraits_b`: collar tab, dot, X pencils. |
| `sprites.json` | Updated; 55 entries. |

At sprite scale the model drew the bun pencils as a V. `tools/sprites/fix_x.py` extends both pencils through the crossing in code so they read as an X, and the portrait caps were cleaned to 2x2 px.

### v2 weak spots
- **Sprite pencils.** The X is 1-px pencils in a 12-px head: it reads at 4x but is fiddly. In the back view it reads clearly.
- **Collar and patch in pixels.** The collar is suggested by the shoulder pixels only. The sleeve patch shows only in some run frames.
- **draw_graphite** line came out near-black rather than mid-graphite. Recolour it in the engine if needed.
- **Brows.** The turnaround brows are still almost symmetric; the asymmetry shows only in the expression sheet.
- **Expression sheet.** Panel 4 (loud singing) reads slightly older and more strained.
- **Lineup.** Jade's head is bigger and her style more anime than the boys' hatching. This is intended for the head, but there is a style gap.
- **Paper pencils.** In the front and 3/4 views the X is partly hidden behind the bun: the caps read, the crossing is implied.
- Superseded v1 Jade files are kept in `raw/` and `paper/old_v1/`.

---
## v1 (original pass)

Spend: **$4.96 list price** (27 calls: 18 gpt-image-2.5-sunburst at high quality, 9 nano-banana-pro at 2K). The task cap was $45. Every call is logged in `media/genlog.jsonl` with an `art_*` tag; run `tools/gen/spend.py --tags` to see them.
No real photos of Jade were sent to any model. Jade references were `inputs/jade_anime.png`, `inputs/rewind_thumb_C_ghost_sprint.png`, and two generated anime sheets copied from rewind-take-two (`jade_canon_turnaround.png`, `jade_bun_two_pencils.png`). Downscaled copies are in `refs/`.

Pencils follow the correction from Jade: two **yellow** pencils, one with a **blue** eraser cap (FUNCTIONS, rainbow stroke) and one with a **pink** cap (FIXTURES, graphite). The first two pixel takes (`raw/jade_pixel_t1/t2`) used the old "blue pencil + orange pencil" brief and are superseded.

## Deliverables

| File | What it is |
|---|---|
| `party_pixel_sheet.png` | All hero strips at 4x: idle, jump, run and abilities, plus Charlie's hat props |
| `hud_portraits.png` | Mock of a Lost Vikings-style HUD bar, and the 6 portraits at 8x |
| `eraser_boss_sheet.png` | Pixel strips, the painterly concept (nano-banana-pro) and the 3D/Talos concept (gpt-image-2.5) |
| `bugs_sheet.png` | 5 bugs at 6x: 2-frame idle, dance pose and feature form |
| `party_paper_sheet.png` | Two PAPER lineups (nano-banana-pro, gpt alt), Jade turnaround, 3 expression sheets |
| `paper/*.png` | The PAPER sources at full resolution (2752x1536). Stray model text is painted out. |
| `../sprites/*.png` + `../sprites/sprites.json` | 53 engine strips. Horizontal strips, binary alpha, ≤24 colours per character (Jade 18, Charlie 19, Ricky 20 across all strips). Anchor is the feet: (w/2, h-1). Each entry also gives fps, loop, source file and notes. |
| `review/` | 8x review sheets, animated GIFs (runs, sing, drum, eraser...), and `paper_face_compare.jpg` (reference faces next to the generated ones) |

Hero frames are **36x44** (characters are about 40 px tall, with the head about 12 px). They are not 28x44: at 28 px wide, the run strides and Ricky's guitar neck would be clipped. Ability frames are wider where they bake in an effect, for example `ricky_power_chord` at 64x44 and `jade_draw_rainbow` at 56x44.
The eraser is about 60 px (chase) and 86 px (loom) tall. The `eraser_*_x2.png` files are Scale2x versions at 2x pixel density, for a screen-filling wall.

## Pipeline (reproducible, `tools/sprites/`)

1. Generate the pixel art: gpt-image-2.5-sunburst with `background:"transparent"`, prompted for a "VERY LOW RESOLUTION ... every game pixel a big square block" sheet. Feeding the first draft back in as a reference made the second take markedly more grid-like (`*_t1` vs `*_t2`).
2. Detect the sprites: `boxes.py` finds alpha blobs, and `heroes_cfg.py` / `others_cfg.py` map blobs or rectangles to animations.
3. Turn each frame into true pixel art: `pixelize.py` via `build.py`.
   - Alpha is thresholded at 128, which drops the model's soft glow.
   - A palette is built per character: median-cut, then near-duplicate blacks merged, plus forced colours (Jade's pencil yellow, blue cap and pink cap; Ricky's shirt stripe blue). Orange "AI skin" is remapped to peach for Ricky and Charlie.
   - The sample grid is snapped to the source's own approximate pixel grid (phase fit), and each cell takes the mode colour from its central 60%.
   - Cleanup: orphans and pinholes are fixed, lone off-colour pixels removed, and tiny detached specks dropped.
   - A consistent 1-px dark outline is applied on the silhouette, except on protected prop colours.
4. `scale2x.py` makes the eraser's x2 strips (EPX, no new colours). `compose.py` builds the presentation sheets, and `preview.py` makes the 8x sheets and GIFs.

Rebuild everything with:
`$PY tools/sprites/heroes_cfg.py && $PY tools/sprites/build.py tools/sprites/heroes.json && $PY tools/sprites/others_cfg.py && $PY tools/sprites/build.py tools/sprites/others.json && $PY tools/sprites/scale2x.py eraser_chase eraser_loom eraser_redeemed && $PY tools/sprites/compose.py`

## What was generated (prompts are in `prompts/`; raw outputs are in `raw/`)

| Raw | Model | Prompt | Used? |
|---|---|---|---|
| jade/charlie/ricky_pixel_t1 | sunburst + char sheet | `*_pixel.txt` | No. The pixels were too fine (about 60 px native) and faces turned to mush when downscaled. |
| charlie/ricky_pixel_t2 | sunburst + sheet + t1 | `*_pixel_v2.txt` (low-res grid) | **Yes**: idle, jump, abilities |
| jade_pixel_t3 | sunburst + turnaround + t2 + pencil sheet | `jade_pixel_v3.txt` (pencil fix) | **Yes** |
| *_run_t1 | sunburst + own pixel sheet | `*_run.txt` (explicit contact/down/passing keys) | **Yes**: replaced the sheets' run rows, which were 6 near-identical strides |
| charlie_hat_props_t1 | sunburst + charlie sheet | `charlie_hat_props.txt` | **Yes**: trampoline (squash/spring), boomerang spin, parachute canopy, hat stack |
| portraits_t1 | sunburst + 3 sheets + jade pixel | `portraits.txt` | **Yes** |
| eraser_pixel_t1 / t2 | sunburst | `eraser_pixel*.txt` | t1 used. t2 ignored the request for more detail. |
| bugs_pixel_t1 | sunburst 1024x1536 | `bugs_pixel.txt` | **Yes**, first try |
| eraser_concept_paint_t1 | nano-banana-pro 21:9 | `eraser_concept_paint.txt` | **Yes**. The model added its own hand-lettered labels ("THE ERASER", "① CHASING"...). They are left in because it is a concept page. |
| eraser_concept3d_t1 / t2 / t3 | sunburst / nbp / sunburst | `eraser_concept*.txt` | t3 used. t1 came out brown and angry; t2 was half-2D and had labels. |
| paper_lineup_nbp_t1 / gpt_t1 | nbp / sunburst, same prompt and refs | `paper_lineup.txt` | Both kept. See the comparison below. |
| paper_jade_turn_t1 | nbp | `paper_jade_turn.txt` | **Yes** |
| paper_expr_jade_t1 → t2 | nbp | `paper_expr_jade(_v2).txt` | t1 **rejected**: off-model, with a Western-looking older face and a blue-bodied pencil. t2 used the paper-turnaround heads as the face ref. |
| paper_expr_charlie_t1 → t2 | nbp | `paper_expr_charlie(_v2).txt` | t2 is the main sheet: its face is fuller and closer to the ref. t1 is kept as `paper/paper_expr_charlie_alt.png` ("ah" painted out). |
| paper_expr_ricky_t1 | nbp | `paper_expr_ricky.txt` | **Yes** (panel numbers ①–⑥ painted out) |

**Model comparison, PAPER lineup.**
- nano-banana-pro has the best face likeness for Charlie and Ricky. But it draws Jade in her clean anime style, crisper than the boys' hatching.
- gpt-image-2.5 gives the more unified colored-pencil look across all three, but its faces are smaller and a little less exact.
- Pixel art: only gpt-image was tried. Its transparent background is a big win for extraction.

## What's good
- The sprites read as real 16-bit pixel art at 8x (`review/*_x8.png`): hard pixels, 1-px outlines, 13–20 colours. The blue and pink pencil caps survive at 40 px tall.
- The run cycles have real contact, down and passing keys (`review/*_run.gif`). Lost Vikings-type silhouettes are distinct per hero: bun with pencils, flat cap with guitar on back, spiky hair with the Strat in front.
- The bugs and the eraser are charming and on-brief. The eraser's sleepy-grumpy to pink-and-happy turn reads instantly at every scale.
- PAPER faces for Charlie and Ricky closely match `charlie_anime.png` and `ricky-anime.png` (see `review/paper_face_compare.jpg`). Jade t2 matches her anime canon well.

## What's weak / open
- **Jade pixel**: in the draw, sing and drum frames she holds pencils while both are still in her bun. The model drew it that way. Either accept it ("spares"), or delete the bun pencils in those frames.
  Her face is mostly hair from the side (one eye pixel).
  There is no dedicated `draw_graphite` stroke: the engine should draw the graphite line procedurally, which it would do anyway for strokes.
- **Run cycles** repeat the same 3 poses twice (left and right legs look alike in side view at this size). They play fine at 12 fps, but are not a hand-keyed 6-pose cycle.
- **Idle** is 2 nearly identical frames, so the breathing is very subtle.
- **Charlie**: his hat_shield and parachute body poses reuse the "hat overhead" pose. `charlie_hat_trampoline` (the character strip) shows him crouched by a bowl-like cap; the real trampoline is the `charlie_prop_trampoline` prop.
  His portrait and paper faces are the weakest likeness of the three (the paper one is slightly more angular than the ref).
- **Ricky**: the power-chord blast and sound waves are baked into the frames. In the engine you may want them as separate FX sprites (redraw them procedurally).
- **Eraser**: the 3 chase frames differ only slightly (it wobbles rather than scrubs). Its outlines are 2 px on the shadow side.
  The 3D concept still has a bit of an "angry" brow in the looming panel. The painterly concept has model-lettered labels.
- **PAPER**:
  - Jade's line work is cleaner and more anime than the boys' hatching. The nbp lineup shows this most; the gpt alt is more unified.
  - The Charlie t2 expression sheet has an odd 4+3 layout with a duplicated laugh.
  - Jade's expression sheet dropped the jacket stripe on the collar crops.
  - For singing cutscenes, use expression panels 1, 3 and 4 as Seedance first frames, and check likeness with ffcheck as usual.
- The `*_t1` hero sheets and the jade_pixel_t1/t2 sheets with the wrong pencils stay in `raw/` for reference only.
