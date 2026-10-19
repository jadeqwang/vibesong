# v4 brief: from full_v3 to the shipped bar (2026-10-18)

**Jade approved the whole plan ("let's do all of this").** The critique and the plan live in the Claude Doc:
https://claude.ai/code/artifact/0984950d-2ad1-4a61-98d2-2391de01d28e. Read its "Big creative moves" and "Plan for v4" sections first.
This file holds the working notes an agent needs that the doc doesn't have.

## Inputs
- v3 master: `engine/out/master/full_v3_1080p.mp4` (207.2 s, 30 fps). 540p review: `engine/out/review/full_v3.mp4`.
- Critique evidence: `engine/out/review/full_v3_critique/`
  - `sheet_01..13.jpg`: 1 fps contact sheets. Each sheet covers 16 s, read left to right, so sheet n starts at (n-1)*16 s.
  - `keysA/B.jpg`: full-res key frames.
  - `seam123.jpg` and `s150.jpg`: the black-frame glitches.
  - `cuts_v3.txt`: detected hard cuts.
- Timing: `analysis/timing.json` (accelerating beat grid; never assume a fixed 140 BPM), `analysis/song_map.md`, `docs/script.md`.
- Reference bar: `~/Documents/1-music-shipped/` (Orbital Sunrise, Moongazing public v10). Jade's own written bar is in
  `~/Documents/1-music-shipped/moongazing/docs/REVISION_NOTES_OCT7.md`.

## Before anything else
1. **The render command for full_v3 isn't recorded anywhere** (the log has no args, and RESUME.md stops at half2_v4). Reconstruct it, probably
   `--r5 --fig native --figscale 1.3 --figres 2.5 --look k08b --mblur 8 --shutter 0.33`. Verify it by re-rendering a 5 s slice and diffing
   it against the master. Then write the command into RESUME.md.
2. **Flip r5 to the default** as RESUME's ROUND 5 block describes (back up first, and remove the r5cam.json dev hook). Then the v4 work isn't fighting a flag.
3. Disk is at 98% (24 GB free). Use `TMPDIR=engine/out/dev/tmp`, write review renders at 540p, and use `--workers 1` if another job holds the GPU.

## Decisions (Jade, 2026-10-18; logged in docs/decisions.md)
- Dedication: **"For every idea that waited in a drawer."** It goes on the outro sketchbook page.
- The prompt to the Eraser (147.36): **`> you are my friend`**. Keep the typing on the vocal so it finishes before "That's it" (149.22).
- Speedrun timer: **cut** (Jade has no preference).
- Paper brows: **candidate A** (Jade's pick 2026-10-18): the v3 brows plus about 25%, made with the same nano-banana-pro prompt as
  `assets/sheets/raw/v10_turn_a.png` (log: media/genlog.jsonl, tag v10_brows_smidge). Composite it back inside tight feathered brow masks
  (see the brow-candidates note at the end), never as code-pasted brows. Apply it to every paper sheet of Jade (turn, expr, lineup), the bridge
  stills (src/scenes/act4/assets/jade_sing_*.jpg, jade_laugh.jpg) and the outro sketchbook art. Show Jade the sheet before anything downstream.
- Paper lip sync: **+0.10 s** (Jade's pick), so the picture runs 0.1 s ahead of the v3 card. Rebuild the card from the source take
  `media/gen/cut_jsing_centre_t2_52c49390c2.mp4`, starting at 0.309 s instead of 0.209 s (see media/cutscenes/README and tools/cutscenes/card.py),
  then point `CLIPS.jade_sing` in engine/src/scenes/act4/paper.js at the new file. If the brows go onto this clip, use the same +0.10 s start.
  Any new paper close-up gets its own offset check against the song; no clip ships at an assumed lag.

## How to run it: two passes with a checkpoint
**Pass A = Tier 1, plus the Tier 2 art in parallel.**
- Tier 1 is mechanical. One agent can do all of it, then render `full_v3.1` at 540p.
- In parallel, an art agent makes **stills only** for Tier 2:
  - the 2011 sketchbook page (graphite, Charlie alone);
  - the SAVE FILE / CONTINUE frame;
  - four paper close-ups (0:20, 0:48, 1:47, 2:23);
  - the clean full-frame flood frame;
  - the 1:47 "band on a stage" front-on frame;
  - the FIXTURES / FUNCTIONS slabs;
  - the outro page with the stamp.
- Checkpoint: send Jade v3.1 together with the stills sheet. Likeness and paper art are her call, so don't animate before she approves.

**Pass B = Tier 2 + Tier 3** on the approved stills: build, then M1 signature stills, then M2 540p, then the 1080p master. Make the 9:16 launch cuts last.

## Verification (do this every render; don't trust eyeballing at 1 fps)
- **Luma-drop scan.** Catches one-frame black flashes. v3 has them at 123.63, 140.20, 140.33 and 150.60–150.73. Anything not on a deliberate cut is a bug:
  `ffmpeg -i X.mp4 -an -vf "scale=160:-1,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null -` → flag frame-to-frame YAVG drops over 35.
  ffmpeg is `.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2` (it has no drawtext filter).
- **Cut-vs-grid.** `select='gt(scene,0.35)'` gives the cut times. Compare them with the beats and 8ths in timing.json; cuts on hits should land within 20 ms.
- **UI budget.** Sample one frame per second. Count text and UI layers: at most one outside gag beats, and zero during choruses, drops, the flood and the 画 slam.
- **Subtitle audit.** Exactly one lyric style across the whole video. No subtitle on a line that's already in the world.
- **Canon audit.** Crop Jade 2–4× in every new frame and check it against memory/jade-character-rules. That covers the pencils (X through the bun, caps up, blue + pink/orange), the hair rule, the patch on the sleeve band, the headphones around the neck, and the baggy pants with straps.

## Rules to keep
- No real photos of anyone. The 2011 jam is illustrated only.
- The title is "The Vibe Coding Song (一笔一画)". "stroke by stroke" is a gloss, never a title.
- End-card wording is fixed (docs/decisions.md 2026-10-17). Keep it when SAVE COMPLETE moves onto the sketchbook page.

## Brow candidates (2026-10-18)
- `assets/sheets/raw/v10_turn_{a,b}.png`: nano-banana-pro edits of `paper/old_v3/paper_jade_turnaround.png` (a = asked for +25%, b = asked for +50%; b came out about as heavy as v9).
- `assets/sheets/v6/turn_v10{a,b}_front.png`: v3 with the new brows pasted back in tight feathered ellipses, **front face only** (centres
  (364,205) and (416,205), radii 26×13, blur 3). The rest of the sheets aren't done yet.
- Jade is choosing on https://claude.ai/artifact/FQbjPa1xxpeifJ65sy5em5 (the lip-sync offsets are on the same page). Once she picks, apply the
  same prompt strength to every paper sheet (turn, expr, lineup) and to the bridge stills.
