# v4 Pass B · open_close · checkpoint (2026-10-18)

Unit: open_close (docs/v4_passB_brief.md). Builds approved stills 01 (2011 page), 02 (SAVE FILE / CONTINUE) and 11 (outro page), puts the
dedication *For every partial project in a drawer.* at both ends, and swaps in the v11-brow spread textures.
**Status: M1 approved by the coordinator (with 7 calls, done below); M2 done, stopped.**

## M1
- Sheet: `engine/out/review/passB/open_close/m1_sheet.jpg` (approved target | engine 1080p, plus the beats around each).
- 1080p stills: `engine/out/review/passB/open_close/m1/s_<t>.png` (t = 0, 0.2, 0.5, 1.05, 1.3, 6.8, 7.2, 9.0, 10.6, 192.5, 194.8,
  195.85, 196.6, 197.6, 198.2, 200.6, 202.97). Canon crops: `m1/canon_crops.jpg`.
- Command (from engine/): `export TMPDIR=$PWD/out/dev/tmp; node render.js --show main --stills 0:out/review/passB/open_close/m1/s_0.png,... --res 1920x1080`
  Sheet: `.venv/bin/python assets/v4_stills/tools/passB_oc/m1_sheet.py`.

## What each beat does now
**01 · 0:00-1.2 (cold_open.js; the M1 version, re-timed by coordinator call 1 below: the page now holds to 2.909-3.336).** The page is drawn over the unchanged level:
- Frame 0 is the approved still (the pencil mid-stroke on the floor line), plus the dedication under the slate. It is the thumbnail frame.
- 0-0.21: the pencil keeps drawing. 0.21-0.343: it slashes the rest of the 一 and stops on the kick (5 px page nudge).
- 0.343-0.85: it lifts off along its own axis, and its shadow lets go of the page.
- 0.91-1.199 (whistle note 1 to beat 3): a graphite pencil edge wipes the page away left to right, and Level 1 (Jade already running on her 一) shows through.
- The slate and the dedication go with the page. Kept on screen, they sat on Jade's jumps.
- The level's own pixel pencil is hidden until the wipe is done.

**02 · 6.755-11.02 (char_select.js, rewritten).** The party menu is gone. main.js cuts paint_run_ship at beat 15 (6.755), right after the last chant stab's flash.
- 6.755: SAVE FILE FOUND / CHARLIE / 2011 / "fixtures & functions" slams in. CONTINUE? blinks while Jade winds up.
- 7.183 (the 808 hit): she presses CONTINUE? with the pink eraser end. The button goes down with glow, a flash of 0.55 and a shake. The frame after the press (7.20) is the approved still (layers vs still: 0.74 mean abs diff).
- **New, my proposal:** 7.611-10.563 (whistle phrase 2): the save year rolls 2011 → 2026 and lands on the bar-7 downbeat with a punch. It holds to 11.02, where press_start takes over (unchanged).

**11 · 186.65-203.0 (spread.js).**
- 186.65-194.06: as v3.1, but on `spread_*_v11.jpg` (v11 brows). There are no captions, credits or doodles on the spread now.
- 194.06-195.40 (synth pulse): push into the spread's LEFT page (the 2011 room).
- 195.40-196.30: a rainbow pencil edge wipes in page #11. During the wipe the page is drawn registered onto the left page (PM, from register.py).
- 196.30-196.97: the page settles into its own full frame.
- 196.75-197.85: the two end-card lines ink in. 198.035: the SAVE COMPLETE · 2026 stamp lands.
- 198.035 onward, on beats: the credits ink in, in the left column.
- 199.25-200.45 (chops): 一笔一画 is drawn in coloured pencil. 200.75: "The Vibe Coding Song" appears under it.
- 200.85-202.6: the pencil rolls (bottom right). 201.4-202.4: the dedication inks in last.
- A 1.6% breath of a push runs to 203.0.

## The one plate (build 01 and 11 from one paper plate)
`assets/v4_stills/tools/passB_oc/build_pages.py` → `media/act5/tex/`:
- `page_plate*.jpg`: the paper, page edge and gutter, from the cleaned #01.
- `page01*.jpg` = plate × the graphite drawing. `page11*.jpg` = plate × the #11 colour layer (s11_page ÷ page11.py's paper, recomputed exactly).
- Overlays: `yi01.png` (the approved floor stroke, stretched to x 210-1090), `pencil01.png` (+ `_shadow`, cut from the still), `slate01/ded01/cap11a/cap11b/ded11/stamp11.png`.
- All text is set in code with compose.py's own `hand()`/`stamp()`. `page_layout.json` holds every placement.
- `assets/v4_stills/tools/passB_oc/build_save02.py` → `media/act5/tex/save02/` (#02 split into layers with compose.py's drawing code).
- Engine side: `paperkit.js:215-329` adds `pageKit`, `FrameLayer`, `WipeBand`, `PencilShadow` and `WIPE_GLSL`. All of it works in 1920x1080 frame px with an ortho camera, at any output size.

## Deviations from the approved targets
1. **01:** the dedication is added under the slate, in graphite (Jade's new rule).
2. **01:** the pencil, its shadow and the 一 are live layers, so the shadow is a code approximation (softer than the still's) and the line is the approved stroke stretched 1.25×.
3. **11:** the shared plate shows the page edge and gutter at the right (the approved #11 sat on a clean plate). The stamp is therefore 0.86× and 58 px further left, so it stays on the page.
4. **11:** the dedication text is the new line.
5. **11:** the fixed end-card title (一笔一画 + "The Vibe Coding Song") and the credits (docs/credits.md wording, CREDITS in spread.js) were not in the approved still. I put them in the empty left column. The credits are one size, about 24 px cap height at 1080p.
6. **02:** the year roll 2011 → 2026 after the press is new, my design for the 3.8 s that the menu used to fill.
7. **Retired:** the spread captions, the spread's last screen (title, credits, stamp, dedication, margin doodles, the firefly lamp), and the bios / ability demos of the old char-select. Backups are below.

## Canon (Jade cropped 2-4×, m1/canon_crops.jpg)
- **11 (Jade, colour):**
  - PASS: bun with the X, pink/orange cap image-left and blue cap image-right, both up; headphones round the neck (orange rims); chest dot; 1420 patch on the LEFT-arm (image-right) orange band; black crop top + midriff; baggy navy cargo pants with orange straps; chunky white sneakers.
  - **Flag (inherited from the approved still):** the blue-cap pencil's sharpened point shows below the bun, by her neck (the canon says tips hidden). Fixable with one masked NBP edit (~$0.13) if wanted.
- **02 (pixel sprite):**
  - PASS: hair down with the pencil in hand; white jacket with orange bands; navy pants with orange straps; sneakers.
  - Flag (inherited): no neck headphones read at sprite scale (the approved sprite predates the rule).
- **01:** no Jade on the page (Charlie alone, graphite). The level sprite after the wipe is the existing v3.1 one.

## Spend
- 2 NBP gens, logged in media/genlog.jsonl by cf.py:
  - `pB_oc_plate01_clean`, $0.1344: s01_a with the pencil, its shadow and the floor stroke removed (0 px shift vs s01_a).
  - `pB_oc_s11_tipfix`, $0.1344: a 1K edit of a 512 px crop of s11_page, composited back only inside a feathered capsule around the pencil point.
- Unit total $0.27 of $10.

## Files changed (backups: engine/out/bak_v4b/open_close/src/…, tex/*.jpg originals untouched)
- `src/scenes/act1/cold_open.js`: header :10-16; import; the page block :90-120; `render()`; the page update; `pencil.visible` :152.
- `src/scenes/act1/char_select.js`: rewritten (the v3 menu is in the backup).
- `src/show/main.js` act1 block :9-12: paint_run_ship t1 / char_select t0 = `T.beat(15)` (6.755).
- `src/scenes/act5/spread.js`:
  - header :11-19; OUT and PM / PUSH :58-66; v11 texture :90; the page kit :173-200.
  - camera :229-240; update :252-290; render :297-303.
- `src/scenes/act5/paperkit.js`: appended :215-329 (nothing above it changed).
- New media: `media/act5/tex/{page_*,page01*,page11*,yi01,pencil01*,slate01,ded01,cap11a,cap11b,ded11,stamp11}.*`, `page_layout.json`, `save02/`, `spread_{full,half}_v11.jpg` (copies of assets/sheets/v11).
- New tools: `assets/v4_stills/tools/passB_oc/{build_pages,build_save02,register,m1_sheet}.py`. Work files: `assets/v4_stills/work/passB_oc/`.
- `node --check` passes on every edited file. tear.js is untouched and stays retired.

## Open / for the coordinator
1. **Grade path:** char_select (02), the cold-open page and the outro page render through custom `render()` and bypass `post`, the same way spread.js already did. The color unit's global time-keyed grade won't reach them unless it hooks the final output. The old char_select went through the 2D post, so this is a change.
2. **The spread's living layer** (Veo FrameSeqs spreadF/spreadR, 186.65-194.9) still shows the old heavier brows. It covers the v11 texture in the close-up. Fixing that means compositing brows onto those frames (the paper unit's method).
3. **Read time of the slate on playback:** about 1.2 s (0-1.199) plus the thumbnail. Keeping it longer put it over Jade's jumps.
4. **Questions for Jade:**
   - Is the year roll on 02 OK?
   - Credits + title in the left column of #11 (or move the credits back onto the spread at 191-194)?
   - Fix the inherited pencil-tip flag on #11?
5. At 196.3-196.97, while the page settles, a sliver of the spread's right page shows at the right edge (it is the book, then it slides away). Watch for it in the M2 mp4.
6. M2 not run: the 540p section mp4s (0-14 and 186-203) with audio, luma scan, cut-vs-grid (new cuts: 6.755 on beat 15, wipe 0.91-1.199, the outro wipe), UI budget, subtitle audit.


## Coordinator M1 calls (2026-10-18) and what I did
1. **Hold the 2011 page through the whistle hook.**
   - The slash still lands on the 0.343 kick. The pencil lifts away by 0.85, then the page holds with a slow 3.5% push-in.
   - The wipe runs on beat 6 → beat 7 (2.909 → 3.336, from timing.json). Slate and dedication are readable 0 → ~2.95 s (top-left is wiped first).
   - Jade's first jumps were re-timed to start after the wipe (cold_open.js route):
     - she drops onto 一 on beat 7 (3.336);
     - hops to 笔 on its 8th (3.549);
     - lands on 画 on the bar-3 hit (3.763), with the existing flash and freeze to 4.19.
   - The camera stays on the title framing. The gloss now types 3.336 → 3.71. Her v3 route (kick landing, 2x follow) is retired.
2. Year roll 2011 → 2026 on 02: kept.
3. Title and credits in page 11's left column: kept.
4. **Pencil point under the bun on #11: fixed.** `assets/v4_stills/tools/passB_oc/tipfix11.py` writes `work/passB_oc/s11_page_tipfix.png`; build_pages.py now builds page11 from it. Checked in m2/canon_crops.jpg.
5. 02 bypassing the grade: OK (no change).
6. **Old vs v11 brows on the Veo layer:** checked, left as is. Crop: `m2/brows_still_old_v11_vs_veo_f0_110_222.jpg`.
   - The still's old → v11 change is subtle: dark-pixel area in the brow box is 1205 → 1151, about −5%. Only Jade's brows differ (x 4011-4130, y 1231-1272 in spread_full).
   - The Veo frames are their own redrawn face: different brow shapes and eyes, and generally heavier brows than either still. That has been the case since v3, so pasting the still's brows onto them would not match.
   - The only code-only option would be thinning the Veo brows inside a tracked mask (an erosion blend). I didn't do it, because Jade dislikes code-altered brows. Ask her if the close-up 186.65-191.3 bothers her.
7. **Right-page sliver at 196.3-196.97: fixed.** A flat "next page" paper strip, `media/act5/tex/page_edge*.jpg` (from build_pages.py), sits beyond the page's right edge and wipes in with the page (spread.js `pedge`). Checked in the mp4: frames 196.4 / 196.7 / 197.0 are clean.

## M2 (540p, audio) - `engine/out/review/passB/open_close/m2/`
Commands (from engine/, TMPDIR=out/dev/tmp, GPU idle, workers 1):
`node render.js --show main --from 0 --to 14 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b --mp4 out/review/passB/open_close/m2/oc_0_14.mp4 --audio --workers 1` (29 s);
the same with `--from 186 --to 203` → `oc_186_203.mp4` (66 s). 0 page errors (the only 404 is favicon.ico).
1 fps sheets (tools/v4/sheets.sh; the labels are video time, so add 186 for the outro): `sheet_0_14_01.jpg`, `sheet_186_203_01/02.jpg`. 1080p checks: `s_1.5.png`, `s_3.1.png`, `s_202.97.png`, `canon_crops.jpg`.

| Check | Result |
|---|---|
| Luma drops (YAVG > 35) | **PASS.** No one-frame blips. 0-14 has 7 drops, all deliberate: the frame after a white stab (4.433, 5.067, 5.933, unchanged), the hard cut to SAVE FILE after the last stab's flash (6.767), the frame after the press flash (7.200), the 2026 punch flash (10.600), and the existing 13.833 cut. 186-203 has none (every transition there is a wipe or a camera move). |
| Cuts vs grid (scene > 0.35) | **PASS.** 0-14: 10 cuts, all within 20 ms. New ones: 6.767 vs beat 6.755 (+12 ms); 7.167 vs 7.183 (−16 ms, the press). The rest are unchanged: 4.200, 4.400, 5.033, 5.900, 6.733, 10.567, 11.033, 13.833. 186-203: 0 hard cuts. The new gradual transitions sit on the grid by construction: page wipe 2.909 → 3.336 (beats 6 → 7), outro push 194.06 → 195.40 and wipe 195.40 → 196.30 (synth pulse). |
| UI budget | **PASS.** 0-2.9: the page with its slate and dedication. 3.3-4.19: title + pinyin + the title gloss (as v3.1). 4.19-6.75: PAINT/RUN/SHIP cards (unchanged). 6.75-11.02: the SAVE FILE screen is the one UI element (a gag beat). 186-194: lyric bar only. 196-203: the end card (lines, stamp, title, credits, dedication). That is end-card text; no subtitle shows there. |
| Subtitles | **PASS.** Lines 48/49 (186.7-194.1) use the one SmoothSubs style. No subtitles in 0-14 within my windows (hook, chant and title are in-world). Line 50 (the 一笔一画 chop) is in-world: the title draws on the chops. |
| Canon (crops 2-4×, `m2/canon_crops.jpg`) | **#11: PASS.** Bun with the crossed pencils, pink/orange image-left and blue image-right, both caps up, and **no tips showing now**; headphones on the neck; patch on the left-arm band; crop top + midriff; baggy navy pants with straps; sneakers. **#02: PASS**, with the inherited flag that no headphones read at sprite scale. **3.3-4.19 level sprite:** the existing v3.1 hair-up sprite with blue + pink caps. |
| Paper lip sync | n/a (no new paper clips in this unit). |

Not my unit, seen on the sheets: a small "stroke" gloss in press_start at ~12.0 (presumably the type unit's English gloss for 一笔 一画).

## M3 (dedication timing)
Fresh-eyes finding 1: the dedication typed 201.4 → 202.47 (after the song) and was fully readable for only ~0.5 s before 203.0.

**Choice: stamp → dedication → title → credits, one thing per beat, top to bottom of the page.**
- The sung 一笔一画 chops (199.25-200.95) can't move. The dedication has to be finished by 201.0, so it can't go after them. It goes in the gap between the stamp and the first chop.
- That order also follows the page from top to bottom. The end-card lines and the stamp are at the top, the dedication sits right under the lines, then the title, then the credits.
- The credits move to the silence after the title, which is where end credits usually go. Before, the 4th and 5th credit blocks inked in under the 笔/一 chops, so two things competed in the same left column. That overlap is gone too.

| t | beat |
|---|---|
| 198.035 | SAVE COMPLETE · 2026 stamps (unchanged); the stamp has its beat to itself |
| 198.25 → 198.471 | **the opening's own pencil** (`pencil01`, same 130.5° angle, same shadow) comes back in along its axis |
| 198.471 → 199.10 | it **writes the dedication** (next beat, accent 198.469). The tip rides ded11's reveal edge with a small handwriting bob (0.63 s; was 1.0 s) |
| 199.12 → 199.40 | the pencil lifts back out along its axis, the same exit as at 0.343-0.85. A bookend: the pencil draws the first 一 at 0:00 and writes the last line at the end |
| 199.25 → 200.95 | 一 笔 一 画 on the chops (unchanged); "The Vibe Coding Song" 200.60 → 201.00 (was 200.75 → 201.35) |
| 201.025 → 201.985 | the five credit blocks ink in, staggered by 0.15 s (0.36 s each), after the song ends (201.16) |

- **Dedication fully readable: 199.10 → 203.0 = 3.9 s** (was 0.5). The picture still ends at 203.0, and the wording is untouched (ded11.png).
- Credits are fully readable for 1.0-1.6 s each (was ~2.9-5 s). They are on screen from 201.0 and stay to the end. This is the trade-off.
- **End-page pencil (finding 11):** the M2 rolling pencil at 200.85 is retired. The pencil's job is now writing the dedication, so the end card has no prop standing still.

Edit, in `src/scenes/act5/spread.js` only:
- the header comment and OUT (`ded` → [198.471, 199.10], new `pen`, `sbs`, `cred`);
- `wpen` / `wshadow` replace `ppen` (kit.layer/shadow 'pencil01', as in cold_open.js);
- the credits and `psbs` reveal times;
- the pencil update block.

OUT.blossoms/thats, subIds and the spreadR_v13c pointer are untouched. Backup: `out/bak_v4b/open_close/m3/spread.js.pre_m3`. `node --check` passes.

Verify (540p, audio, workers 1, 32 s, no page errors):
- `out/review/passB/open_close/m3_194-203.mp4` (9.00 s, 270 frames);
- sheet at 0.25 s steps: `m3_sheet_197.5-203.0_q.jpg`;
- pencil close-up at 2-4 frame steps: `m3_pencil_198.3-199.4.jpg`. The tip stays on the ink edge. The pencil crosses the end-card lines and the stamp's left edge for <1 s, which reads as the pencil being above the page.

Not changed: the spread's retired `ded` InkQuad (invisible since Pass B) still has the old wording in code ("For every idea that waited in a drawer.").
