# Launch deliverables: three 9:16 cuts, thumbnails, sheet (2026-10-18)

All files are in `engine/out/launch/`. Nothing was published or uploaded, nothing was paid for, and engine/src was not touched.

| file | what |
|---|---|
| `launch_9x16_1_prompt.mp4` | Cut 1, prompt gag, 41.028-59.434, 18.4 s, with end slate |
| `launch_9x16_2_shatter.mp4` | Cut 2, 2D→3D shatter, 71.109-86.400, 15.3 s, with end slate |
| `launch_9x16_3_terraces.mp4` | Cut 3, terraces, 169.668-186.660, 17.0 s, with end slate |
| `launch_9x16_*_clean.mp4` | the same three cuts without the slate |
| `thumb_{A_functions,B_terraces,C_hua}_{1280x720,1080x1350}.jpg` | three thumbnail candidates in two sizes. **A is the one I recommend.** |
| `launch_sheet.jpg` | the three cuts at 1 fps, plus the thumbnail candidates |
| `seg/` | scripts, segment renders and the 3 thumbnail source stills, so everything can be re-assembled without re-rendering (`seg/*.mp4` takes 166 MB and can be deleted; `render_all.sh` rebuilds it in about 15 min) |

All cuts are 1080x1920, 30 fps, H.264 CRF 21, with AAC 192k audio cut straight from the song mp3 (file time = song time). Each has a 0.3 s audio fade at both ends. Mean loudness is -19.5, -19.2 and -17.7 dB; the song was not normalized.

## Portrait support in render.js: partial. Code changes would be needed for full support (not made)
I tested stills and a 540x960 preview of 44-96 and 168-188 at `--res 1080x1920`:
- **2D cartridge/void scenes reflow well in portrait.** The prompt box, pixel subtitles, REALITY bar and the 出发 type all fit. These parts were rendered natively.
- **Subtitles in the paper and 3D scenes are sized from frame height, so in portrait they run off both sides** ("sk myself what it is that I").
  The `> you are my friend` prompt and the FIXTURES/FUNCTIONS slab words are cut the same way.
- **3D cameras keep their vertical FOV.** A portrait render shows the same slice as a centre crop, so the group drops out of frame (only Jade is visible at 84-86).
- **The act-5 photoreal aerial video layer gets stretched to the frame.** In portrait the 一笔一画 terraces are squashed horizontally, which is a real distortion.
- Making portrait work fully would need, in engine/src: subtitle size taken from `min(W,H)` (or wrapped); a portrait framing or hFOV option for the 3D shot cameras; and cover-fit, not stretch, for video planes (act5.aerial, and any other video texture).

What I did instead: native portrait renders for the 2D parts, plus **wide renders at 3414x1920** (the master's framing at 1920 px tall) for the 3D and video parts. I cropped those to 1080x1920 with keyframed, smoothstep-eased pans, so there is no upscaling, unlike a crop of the 1080p master.

Render commands (`seg/render_all.sh`, run from `engine/`, `TMPDIR=$PWD/out/dev/tmp`):
```
COMMON="--show main --fps 30 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mblur 8 --shutter 0.33 --workers 1"
node render.js $COMMON --from 41.028  --to 59.434  --res 1080x1920 --mp4 out/launch/seg/c1_portrait.mp4
node render.js $COMMON --from 48.567  --to 50.667  --res 3414x1920 --mp4 out/launch/seg/c1_insert_wide.mp4
node render.js $COMMON --from 69.444  --to 82.706  --res 1080x1920 --mp4 out/launch/seg/c2_portrait.mp4
node render.js $COMMON --from 82.706  --to 86.400  --res 3414x1920 --mp4 out/launch/seg/c2_wide.mp4
node render.js $COMMON --from 169.668 --to 174.400 --res 1080x1920 --mp4 out/launch/seg/c3_portrait.mp4
node render.js $COMMON --from 174.400 --to 186.660 --res 3414x1920 --mp4 out/launch/seg/c3_wide.mp4
```
To assemble: `python seg/assemble.py cut1|cut2|cut3 [--slate] OUT.mp4`, using the venv python and ffmpeg (no drawtext). The exact ffmpeg command for each cut is saved in `seg/cmd_*.txt`.

## Windows and why

**Cut 1: prompt gag, 41.028 → 59.434 (bars 25-36, the first 12 bars of chorus 1).** It starts on the chorus downbeat, before "I" (41.22). It ends on the bar line at 59.434, where "functions" ends (59.43), before the "Oh" ad-lib (59.45).
The arc is complete: "I think about stuff I read" → "I just ask myself what it is that I need?" → the prompt box types `// what do I need?` / `> level up reality` ⏎ → `✓ on it` → "That's it, the fixtures and the functions" (graphite pencil builds the gray box, rainbow pencil carves FUNCTIONS).
- **Why this prompt and not the Eraser one.** I picked it over `> you are my friend` (146.5-147.7):
  - It is the thesis gag: you ask for what you need, and the level gets built.
  - It renders natively in portrait with every word legible.
  - The Eraser prompt box and its subtitle are wider than any 9:16 crop, and the best window around it (139.41-155.36) has the "oh" ad-lib running over the 155.36 bar line.
  - I did not combine the two, because that would break the song's continuity in a 15-40 s piece.
- **Fix for the paper insert (48.567-50.667, Jade #04).** In portrait its subtitle runs off both sides. I replaced the insert with the 3414-wide render cropped above the subtitle (883x1570 at x 1265, scaled 1.22x). On top of it goes the master's own subtitle pill (984x148 from x 468, y 888), unscaled, behind a rounded mask, at y 1586. The karaoke highlight is preserved.

**Cut 2: 2D→3D shatter, 71.109 → 86.400 (bar 43 → end of the drop-1 whistle phrase).** It runs from the build (REALITY bar filling 31→100%), through 一切从这里出发! (72.13) with 出发 drawn in rainbow, the triplet roll and 一笔一画! (79.36), and the silent LOADING freeze (79.87-80.81). Then the pixel world shatters into the sunlit plaster world (80.81), followed by the 3D causeway run with Ricky's beam hitting switches through the whistle hook (81.87-86.15).
- It ends at the shot cut at 86.400, before the 86.41 accent and "Fixtures!" (86.63).
- I first tried starting at 69.444 (bar 42), but the first 2.5 s are an empty void in portrait, so the cut now starts with the 一切 typing 1 s in.
- From 71.109 to 82.706 the render is native portrait (the shatter reads fully in 9:16). From the beat cut at 82.706 (bar 50 downbeat) it switches to the wide render. The pan keeps the three heroes in frame: cx 0.40 → 0.28 by 83.5 → 0.29 → 0.25.
- I left FIXTURES!/FUNCTIONS! (86.6-91) out because both slab words are wider than 9:16.

**Cut 3: terraces, 169.668 → 186.660 (bar 104 → end of drop 2).** It covers the flash-recap montage, the pink-paper pencil writing 一笔一画 (172.8-174.4), and the 174.40 rocket up to the voxel 一笔一画. Then come the photoreal subdivision to the rice terraces (175.5-176.6) and the aerial whistle hook, the FIXTURES!/FUNCTIONS! beats (graphite drawing of the terraces, then back to colour), and the dive into the red 一 stroke.
- It ends at 186.66, the end of act5.aerial, before "Everything" (186.70), so it does not cut into the outro vocal.
- From 169.668 to 174.400 the render is native portrait (the REALITY/LOADING bar fits). From 174.400 it switches to the wide render. Pans read the characters in stroke order:
  - voxel 一 → 笔, then photoreal 笔 → 一 → 画 (cx 0.15 → 0.85 over 174.9-178.8, holding on 画);
  - the graphite drawing 笔 → 一 → 画 (181.13-183.3);
  - the dive follows 笔, then settles on the red 一 (183.9-186.66).
- The two slab shots, band + FIXTURES (180.233-181.133) and FUNCTIONS (183.3-183.9), are too wide to pan. For those, a centre crop at x 0.15-0.85 is fitted to the width (1080x868) over a heavily blurred, dimmed fill of the same frame. These are short "snap" beats, so the format change reads as part of the hit.

**Slate (a proposal, in the main files).** The video's own pixel title card (the intro box from 13.2-13.8 s) fades in over the last 1.5 s: "The Vibe Coding Song" / "(一笔一画)", 744x200, at x 168.
- The box was rebuilt with the engine's fonts (PressStart2P + fusion-pixel 12px zh_hans), colours sampled from the master, nearest-neighbour scaling ×4 (`seg/titlebox.py`).
- It sits on calm background: the black void in cut 1 (y 236), the temple in cut 2 (y 236) and the red terraces in cut 3 (y 300). It never covers the heroes or subtitles.
- If Jade wants no text at all, use the `_clean` files. No other text was added.

## Thumbnails (from 2560x1440 engine stills: `--stills T:… --res 2560x1440`, same flags without mblur)
The title uses the same pixel card (`seg/make_thumbs.py`).
- **A, carved FUNCTIONS slab + the band (183.6). Recommended.** A huge rainbow FUNCTIONS over three faces holding instruments says "coding + band" at a glance, and it reads at 240 px wide.
  - YouTube: full frame, title card at the bottom over the band's legs.
  - Social: the word + band fitted to width, title card above, blurred fill.
  - Jade checked at 2-4×: hair loose with a pencil in each hand (blue cap visible), headphones around the neck, white jacket with the chest band, sleeve band, chest dot and patch, navy cargos with orange straps. All on canon.
- **B, the 一笔一画 rice terraces (179.5).** This is the payoff and explains the title, but it is busier and more muted at small size. In 4:5 only 笔 + half of 一 fit.
- **C, the rainbow 画 igniting, the Eraser looking on (140.6).** The boldest at tiny size, but abstract without context. In 4:5 the outer glow of 画 is slightly cropped.
- Not used:
  - The 2011 page with the pencil: pale, with small text, so it doesn't read small.
  - The outro spread: its credit text turns to noise at thumbnail size.
