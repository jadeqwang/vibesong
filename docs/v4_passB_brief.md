# v4 Pass B brief: build Tier 2 + Tier 3 on the approved stills (2026-10-18)

On 2026-10-18 Jade approved Pass A: full_v3.1, paper brows v11 and all 11 target stills (`assets/v4_stills/`, sheet
`engine/out/review/v4_stills/stills_sheet.jpg`). Pass B builds them into the video.
**Read first:** docs/v4_brief.md (verification + rules), the newest block of docs/decisions.md ("v4 Pass A checkpoint"),
engine/checkpoints/v4_tier1.md (the current state of the engine) and engine/checkpoints/v4_art.md ("How Pass B could reach each frame").
The critique doc's "Big creative moves" are summarized per unit below.

## Changes since Pass A (Jade, 2026-10-18)
- **Dedication is now `For every partial project in a drawer.`** It appears at BOTH ends: on the 2011 page at the opening and on the outro page.
- **Still #06 fix:** "her actual forehead should be a bit taller (not balder) but more head volume/hair volume above her face than what's
  shown here". For forehead size, compare with ~/Documents/rewind-take-two/inputs. Those include photos: look at them only, and never
  send a photo to an image or video model. The drawings there and the approved paper sheets are fine to send.

## Units (each owns its files; never edit a file another unit owns)
| unit | owns | builds |
|---|---|---|
| **open_close** | scenes/act1/cold_open.js, char_select.js, paint_run_ship.js (only the 0–14 s hand-off), act5/spread.js, paperkit.js, tear.js, media/act5/tex/*; main.js act1 + act5 blocks | 2011 opening 0:00–0:14 (still 01), CONTINUE beat on 7.18 replacing the 4 s char-select (still 02), outro page (still 11) built from the same plate as 01, dedication at both ends, swap the v11 spread textures in |
| **paper** | scenes/act4/paper.js, act4/assets/*, media/cutscenes/**, tools/cutscenes/**, a NEW scenes/paper_inserts.js; main.js: a new `paper` block | #06 forehead fix (re-gen inside a head/hair mask, the same way the brows were composited); animated paper close-ups 03 (0:20.12), 04 (0:48.62), 06 (2:23.48) as cards with per-clip lip sync; card 05 for 1:47 handed to stage_3d; v11 brows onto the bridge clip (+0.10 s start) and the v11 bridge stills/lineup swapped in |
| **stage_3d** | scenes/act3/**, act4/main3d.js, eraser3d.js, world4.js, montage.js, glyph.js, hud2d.js, overlay.js, act5/drop2.js, aerial.js, world5.js, route5.js, hud5.js, core/heromodels/**, core/motion/**, voxfig.js, show/battle_ui.js; main.js act3 + act4 blocks | front-on hero shots on the key lines and a DOF cap; flood 119.0–123.3 (still 07); 1:47 band on a stage (still 08 + paper card 05); carved FIXTURES/FUNCTIONS slabs on both drops (09/10: 86.87/89.9 and 180.2/183.1); the bugs joining as clear action inside the flood; the 3D cut fixes (79.27, 161.43 onto the grid; beat cuts inside 141.4–150.6 and 150.9–160.8) |
| **type** | show/subtitles.js, core/text.js, hanzi.js, core/hanzi2d.js, act2/chorus.js (cut snap only), NEW overlay modules; main.js: a new `type` block | big-character Chinese lines with a small gloss: 绽 (~1:34), 舞台 (1:47; agree the frame with stage_3d through the coordinator), 答 (2:05.86, over the paper card); split couplet 是一幅画 也是一段代码 at 2:03.18 (left half paper, right half editor; again at 2:09.36 if it reads); an English gloss for the in-world lines that lost theirs (说出来 它就存在, 一切从这里出发, 一笔 一画); snap the chorus-1 "Oh oh oh" cuts 59.6–60.4 to the 8th grid |
| **color** | look.js, post.js, core/palette.js, core/stage2d.js (grade path only), a NEW core/colorscript.js | ration the color: graphite and paper before 1:59, with color only at the pencil tip and on what she just drew (the rainbow 出发 at 1:12 stays as the one preview); the flood 119.0–123.3 is the single full-spectrum break; the bridge drains it to dusk; the 画 slam (139.395) brings it back for good. Look changes (pixel → editor → plaster → real → paper) land only on a drop or a stroke. Wave 1 = a global time-keyed grade + exemptions using existing tags. Per-scene hooks in other units' files go in engine/COLOR_REQUESTS.md; the coordinator schedules them after those units' M2. |

Shared files: **render.js**: nobody edits it. Put requests in engine/CORE_REQUESTS.md and tell the coordinator.
**show/main.js**: edit only your own block, re-read it right before each edit, and keep the edits small. Paper inserts and type
overlays are later show entries that overlap the scene beneath them. Check how overlapping entries composite (`transition`) and
don't break the scene underneath.

## Fixed windows (resolve conflicts here; ask the coordinator before moving one)
- 0:00–0:14 open_close. CONTINUE lands on 7.18 (the 808 hit). The dedication must be readable on the opening page (frame 0 is the thumbnail on X/YouTube autoplay).
- 0:20.12 paper #03 over act1. 0:48.62 paper #04 over the act2 chorus (the prompt box 44.5–55 stays the kept gag; the close-up shows it reflected in her eyes).
- 107.15–110.41 stage_3d owns the frame. 世界 是我的舞台 is sung over three stutter stops 107.6–109.3: put one spotlight per stop, use card 05 where it reads best, and put the big 舞台 type where type agrees. Never put a sung keyword over the back of a head.
- 119.0–123.3 flood: zero UI. stage_3d stages it, and color supplies the grade.
- 123.18 the couplet (type). 125.769–128.18 the bridge paper card (paper; 答 = type).
- 139.395–143.36 the 画 slam: zero UI.
- 143.48 paper #06 "I just ask myself what it is"; it must hand back to the 3D prompt before the typing starts at 146.556 (`> you are my friend` done 147.61, ENTER 147.693).
- 186.65–203.0 outro page (open_close). Audio ends 201.2.

## Gates (every unit)
- **M1:** 1080p signature stills of each beat you build, set beside the approved target still. Write a labelled sheet to
  `engine/out/review/passB/<unit>/m1_sheet.jpg`, report to the coordinator and STOP. Don't render a section mp4 before the coordinator says go.
- **M2:** a 540p section mp4 with audio plus 1 fps sheets in `engine/out/review/passB/<unit>/`, the full verification from v4_brief.md on
  your range (luma drop, cut vs grid, UI budget, subtitle audit, canon audit with Jade cropped 2–4×), and every new paper clip's lip-sync offset measured against the vocal stem.
- Write `engine/checkpoints/passB_<unit>.md` as you go: changes (file:line), backups, commands, gen spend, results, anything open.

## Hygiene
- Back up every file before editing it to `engine/out/bak_v4b/<unit>/`. Run `node --check` after edits.
- `export TMPDIR=$PWD/out/dev/tmp` (in engine/). Disk is at ~98%: 540p reviews only, delete your own temp files, and no 1080p sections.
- The GPU is shared by five units plus another project. Check nvidia-smi, use `--workers 1`, and run one render process at a time per unit.
- Paid gen caps: paper $40, open_close $10, the others $5 each. Log every gen in media/genlog.jsonl and the spend in your checkpoint. The project total is $70.25 of $500.
- Gate every frame with Jade on memory/jade-character-rules.md (pencils X through the bun with both caps up, blue + pink/orange,
  tips hidden; the hair rule; the patch centred ON the left sleeve band; headphones around the neck; baggy navy pants with orange straps;
  forehead a bit taller but not balder, with hair volume above). The native 3D models already have neck headphones (models_r6 r6b). Verify, don't assume.
- No real photos of anyone. The title is "The Vibe Coding Song (一笔一画)". Keep the end-card wording fixed (decisions 2026-10-17).
- Engine RNG depends on which scenes load (v4_tier1.md). Compare renders only over equal ranges.

## After the units
The coordinator stitches full_v4 at 540p and runs the verification over the whole video, then sends it to Jade. After her notes, the 1080p master
(`node render.js --show main --from 0 --to 203 --fps 30 --res 1920x1080 --fig native --figscale 1.3 --figres 2.5 --look k08b --mblur 8 --shutter 0.33 --mp4 out/master/full_v4_1080p.mp4 --audio --workers 2`).
The last steps are the thumbnail and three 9:16 cuts (the prompt gag, the 2D→3D shatter, the terraces), then a fresh-eyes review against the bar table.
