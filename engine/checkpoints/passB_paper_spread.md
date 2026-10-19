# v4 Pass B · paper unit · Task C: v11 brows on the outro's living spread layer (2026-10-18) — DONE, stopped

## What the layer is (found)
- The outro "living illustration" (spread.js:100-112) is two FrameSeqs, not mp4s: `spreadF` (whole spread, Veo 3.1 Fast `act5_spreadF2.mp4`)
  and `spreadR` (right page crop rect [0.444, 0.235, 0.556, 0.5602], Veo 3.1 Fast `act5_spreadR.mp4`, genlog line 181, $0.80, 8 s 24 fps 1080p,
  i2v from the right-page crop of the pre-v11 still). Conformed by `media/act5/_work/conform.py` (trim 0.5 s, minterpolate to 30 fps) to
  223 frames @ 30 = 7.43 s, 1920x1080 (+ a 540 set). spread.js:131 maps song t to clip time `(t - 186.65) * 7.43 / (194.31 - 186.65)` and
  fades both layers out 194.06 -> 194.90 into the v11 still underneath.
- The v11 still differs from the old still ONLY in Jade's brows (diff box x 4004-4137, y 1224-1279 of 5504x3072; Pass A mask
  `assets/sheets/v11/raw/mask_spread.png`), i.e. on the right page, which `spreadR` covers fully (alpha 1) in the close-up.
- Motion in spreadR is not small: Veo redraws the face from frame 0 (heavy black bar brows, sharper line art), she turns to 3/4 and tilts ~20°
  (frames ~25-90), closes her eyes (~5-15, ~105), winks (~166). The other two characters breathe and strum.

## Method and why: per-frame brow transfer, no gen ($0)
A re-gen would not give v11 brows: Veo redrew even its own first frame's brows as heavy bars, so a new i2v take from the v11 still would
most likely do the same and need the same fix afterwards. Instead the approved brows (the v11 still's own pixels) are tracked onto the existing
layer, which keeps the motion, timing and length identical. New tool **`tools/cutscenes/pb_spread_browtrack.py`** (OS venv, mediapipe):
1. FaceMesh on a 2x face crop (860-1180 x 180-500 at 1080) of every frame: faces found on 223/223. The brow landmarks are smoothed (5-tap).
2. Veo's brows are removed: dark pixels (lum < local skin - 30) inside the dilated brow-landmark hull, minus hair / lash / lid lines outside
   the hull (7 px protect), are Telea-inpainted. (A skin-only normalised-convolution fill was tried and rejected: it cut the hair strands that
   touch the brow tails. A lower threshold of 14 was rejected too: it reached the lid lines and left an eyeshadow smear.)
3. The v11 brows go on as a ratio image (still / still with its brows inpainted, inside the Pass A brow mask), warped per brow by a similarity
   transform (still brow landmarks -> frame brow landmarks) and multiplied onto the cleaned frame, so the ink takes each frame's skin tone.
4. Only a feathered brow region is pasted back at 1x. The rest of the frame is unchanged apart from the JPEG re-encode (PSNR outside the crop 44.8-45.3 dB).
Run: `$OSPY tools/cutscenes/pb_spread_browtrack.py spreadR_v11` (about 15 s; `--debug=DIR` writes side-by-sides).

## Changes (file:line)
- **`engine/src/scenes/act5/spread.js:106`**: `'spreadR'` -> `'spreadR_v11'` (the one clip-pointer line, atomic: copy, edit, node --check, mv; node --check OK).
  Backup: `engine/out/bak_v4b/paper/spread.js.taskC`.
  Note: line 107 still tests `name === 'spreadR'` for `prefer: 1080`, so at 540p the new layer loads its 540 set (a lanczos downscale of the
  same frames), not the 1080 set. That makes no visible difference at 540p, and 1080 renders are unchanged (H > 540 -> 1080). open_close can change line 107 to `name.startsWith('spreadR')` if they want exactly the old behaviour.
- **NEW `media/act5/frames/spreadR_v11/{1080,540}/`**: 223 frames + index.json (231 MB).
- **NEW `tools/cutscenes/pb_spread_browtrack.py`**.
- **Fallback:** the old layer `media/act5/frames/spreadR/` is untouched. Revert = put `'spreadR'` back on line 106 (or restore the backup).
- `spreadF` was NOT changed. Jade's face on it is hidden under spreadR, except during the 194.06-194.9 fade, where spreadF shows through at
  ≤25 % with the full spread in frame (her brows are about 23x6 px at 540p). It is invisible in the checks.

## Spend
**$0.** No gen calls, so there are no `pB_spread_v11_*` genlog entries. Paper unit total is unchanged at $16.25.

## Checks
- **Before/after brow crops** (3x of the 1080 layer, 11 frames over the clip plus the two stills): `engine/out/review/passB/paper/m3_spread_brows_before_after.jpg`.
- **540p render** 184-197 (command as specified, `--look k08b+cs`, `--workers 1`, 0 missing frame seqs): `engine/out/review/passB/paper/m3_184-197_spread.mp4`.
  The sheet (1 fps + frames either side of 186.65 / 194.06 / 194.9) is `m3_184-197_spread_sheet.jpg`. The in-engine face at 2x, 187.0-191.5, is `m3_spread_engine_face_2x.jpg`.
- **Hand-off:**
  - Mean consecutive-frame luma diff across 194.06 is 0.31 / 0.39 / 0.34 / 0.55, then it ramps with the push-in. Across 194.9 it is 17.3 / 16.4 / 15.5 / 14.2, the steady push / wipe motion with no spike.
  - No luma drop > 35.
  - 186.65 sits under the dive wipe (the spread arrives by ~187), as before.
  - The brows now match the still the layer dissolves into.
- **Stability:**
  - Brow-centroid jitter relative to the eye corners (FaceMesh re-measured on the output) is mean 0.50 px and max 2.1 px, against the old layer's 0.54 / 3.4.
  - Consecutive-frame strips (eyes closed, mid-turn, frontal) show no popping.
- **Canon** (2-3x crops at frames 55 / 111 / 166 = 1/4, 1/2, 3/4, every character on the right page):
  - Brows are v11 (soft, fine, image-left straight / image-right slight arch, space above the eyes).
  - Headphones are on the neck, the chest dot is there, and the 1420 patch is on the image-right sleeve.
  - Pants are baggy navy with orange straps. Charlie (cap, curls, grey tee, acoustic) and Ricky (striped shirt, Strat) are fine.
  - Pencils: see open item 2.

## Open / doubts
1. **Closed-eye frames (about 5-15 and 105-110, plus the 166 wink):** the inpaint leaves a faint brownish wash on the lids under the new brows.
   It shows at 3x (before/after sheet, frame 10), but I can't see it at 1:1 or in the 540p render. It could be masked further if Jade sees it at 1080.
2. **Pre-existing Veo canon wobble (not from this change):** at about 187.5-190.0 the blue-cap pencil swings to near horizontal (cap pointing right,
   body down past the ear), and at about 191.5-194 the pink-cap pencil leans far left. Both caps stay up-ish and crossed, but this is not the clean "both caps UP" X.
   Fixing it would need a re-gen of the layer, and Veo would then redraw the brows heavy again, so the same transfer would have to run after it.
3. The new brows are softer pencil than Veo's crisp outlines around them, because they are the still's pencil brows. This is intended (it matches the still and canon).

## Lid-wash fix (coordinator review, 2026-10-18) — DONE
- **spread.js:** not touched by me. The coordinator set line 107 to `name.startsWith('spreadR')`, so 540p renders use the 1080 set again (their backup is `out/bak_v4b/paper/spread.js.taskC_coord`).
- **Cause:** it was not the inpaint (the cleaned frames were clean). The Pass A brow mask (`mask_spread.png`) reaches down onto the still's upper lash line / lid crease. The crease also joins the image-left brow tail. So the brow ratio image carried a sliver of the still's lash and crease lines, plus a few chromatic hair-edge pixels at the image-left tail.
  - Over Veo's open eyes the sliver mostly merged with her own liner (a small orange tint at the image-right outer corner).
  - Over closed lids it landed on bare skin as a brownish or orange arc.
- **Fix** (`tools/cutscenes/pb_spread_browtrack.py --lidguard=14`, still-side only; the tracking and inpaint are unchanged):
  1. The multiply only darkens: ratio is clamped to ≤ 1, and it is gated to the brow ink itself (ratio darkness > 0.12 inside the Pass A mask).
  2. Ink components lying mostly below the still's upper-lid contour (raised 14 work px, past the eye corners) are dropped.
  3. Nothing more than 5 work px below each brow's lower landmark contour is kept. This removes the crease that joins the image-left tail.
  4. Strongly chromatic ratio pixels (|R−B| > 0.12) go neutral grey, so there are no orange flecks at the hair edge.
- **Frames rewritten** (1080 and 540 sets): 0-20, 87-102, 105-110, 159-170 = 55 frames. That is every frame where either eye's FaceMesh openness (lid gap / eye width) is below 0.2, plus ±2 frames, plus 105-110 as asked.
  - Closures measured: 2-18, 89-100 and the wink 161-168. The 105-110 window was my mistake in the first report: the eyes are open there.
  - The other 168 frames are byte-identical (md5 checked: exactly 55+55 files changed).
  - The pre-fix versions of the 55 frames are in `engine/out/bak_v4b/paper/spreadR_v11_pre_lidfix/{1080,540}/` (57 MB).
  - The tool reproduces both the old and the fixed frames byte for byte. Command: `$OSPY tools/cutscenes/pb_spread_browtrack.py spreadR_v11 --frames=0-20,87-102,105-110,159-170 --lidguard=14`.
- **Checks:**
  - **Before/after sheet** (`m3_spread_brows_before_after.jpg`), now 3 columns: old Veo | Task C pre-fix | live. It adds frames 8, 10, 107 and 166 at 3x. The lid wash is gone on 8, 10 and 166, and the corner tint is gone on 107. The brows themselves are unchanged.
  - **m3 re-render** with the 1080 set: `m3_184-197_spread.mp4` + `m3_184-197_spread_sheet.jpg`. There are 0 missing seqs.
  - **194.06 hand-off:** consecutive diff 0.35 / 0.44 / 0.38 / 0.65, then the push ramps.
  - **194.9:** a steady 17.3-14.2, with no spike. There are no luma drops over 35.
- **Open: recipe-switch boundaries.** `--measure` shows the new recipe also changes the open-eye frames. The only visible difference there is the same small orange lash sliver at the image-right outer corner, about 2-3 px at 1:1. At the range edges (20|21, 86|87, 102|103, 110|111, 158|159, 170|171) that sliver therefore pops in or out by one frame: see `m3_spread_lidfix_boundaries.jpg`.
  - The clean option is to apply `--lidguard=14` to all 223 frames (one command, about 15 s; it rewrites the remaining 168 frames).
  - I didn't do that, because the brief said to keep the others byte-identical. Recommend yes.
- Spend still $0. Temp files are deleted.

## Lid guard on all 223 frames (coordinator: "consistency beats byte-identical") — DONE
- **Backup:** the set as it stood before this step (55 lid-fixed + 168 Task C frames) is in `engine/out/bak_v4b/paper/spreadR_v11_pre_lidfix_all/{1080,540}/` (231 MB). The original Task C versions of the 55 frames are still in `spreadR_v11_pre_lidfix/`, so the full Task C set can be rebuilt from the two backups.
- **Applied:** `$OSPY tools/cutscenes/pb_spread_browtrack.py spreadR_v11 --frames=0-222 --lidguard=14`.
  - 336 files changed: the 168 open-eye frames in both sets.
  - The 55 already-fixed frames came out byte-identical, which confirms the run is deterministic.
  - index.json is unchanged.
- **Boundaries** (`m3_spread_lidfix_boundaries.jpg`, the same 6 edges): the partial-fix rows show the corner sliver popping. The LIVE rows have no sliver on either side of any edge, so there is no switch and no pop.
- **m3 re-render** (1080 set, 0 missing seqs): `m3_184-197_spread.mp4` + `m3_184-197_spread_sheet.jpg`.
  - 194.06: 0.36 / 0.44 / 0.39 / 0.64, then the push ramps.
  - 194.9: a steady 17.3-14.2, with no spike. No luma drops over 35.
- **Live recipe** = `--lidguard=14` on every frame. The fallback chain is: this set → `spreadR_v11_pre_lidfix_all` → the original Veo `spreadR` (line 106).

## Task C2: whole-body life (Jade: "the perfect stillness between her movement beats") — DONE, switched to spreadR_v12
**Pipeline**
- Same as the original act5_spreadR. The input is `media/act5/stills/spread_right_crop_v11.jpg`: the v11 still cropped at `spread_right_crop.txt` (= spread.js:106 rect), 1920x1080.
- Veo 3.1 Fast, 8 s, 1080p, silent. The prompt keeps the original style and static-camera clauses and asks for continuous whole-body life: breathing, steady strumming and picking, fretting fingers, sway, "no pose is ever fully frozen", pencils fixed in an X with caps up.
- Conform: `conform.py --fps30 --ss=0.5` → 223 frames @ 30.
- Specs: `media/gen/specs/pB_spread_v12_t{1,2,3}.json`; mp4s: `media/gen/pB_spread_v12_t*.mp4`.

**Takes** (flow = `tools/cutscenes/pb_flow_regions.py`, p90 of Farneback per region, 1080 px):

| take | outcome |
|---|---|
| t1 | Bodies alive, but the camera pushes in 5.9 % from ~f100 (ECC on margins), Jade's head is busier (median 3.37), and a pink pencil end points down-left from ~f150. Rejected. |
| t2 | Bodies alive (torso 0.97, Charlie strum 0.79, Ricky 0.70) and the head stays natural (2.50). The camera is static until ~f190, then pushes in 1.1 %. From ~f132 a third pencil end (pink) points down-left, and the X loosens around f55-62. |
| t3 | Third take, since t1 failed and t2 failed canon in its last third. Pencil and camera clauses tightened. Pencils good (caps up all through), but it pushed in 5.7 % anyway, Charlie and Ricky are nearly frozen (Ricky <0.3 on 106 frames) and Jade's head is busier (3.79). Rejected. |

**Chosen: t2, fixed in post** (all $0, no extra gen):
1. **NEW `tools/cutscenes/pb_stabilize.py`.** Per-frame ECC (affine) of the page margins, gutter and paper below the bench against the v11 crop. Clouds and characters are excluded, and the borders are filled from the still. Residual is ≤ 0.2 % scale and ≤ 2-4 px, the same order as v11. It removes t2's late push.
2. **Ping-pong over source frames 14→125→14** (223 frames, linear).
   - This drops Veo's 0.5 s ease-in freeze (f1-14) and everything after f125, so the downward pink pencil never shows.
   - Both ends land on a pose next to the start frame, so the 194.06-194.9 dissolve into the still is clean.
   - The turn is at 190.46: face-box consecutive diff is 4.0-5.6 across it, with no dip.
3. **Brows:** `pb_spread_browtrack.py spreadR_v12 --src=<ping-pong seq> --crop=800,140,1200,540 --lidguard=14` (new `--src` / `--crop` options). Faces found on 223/223.

**Changes**
- **`engine/src/scenes/act5/spread.js:106`:** `'spreadR_v11'` -> `'spreadR_v12'` (backup `engine/out/bak_v4b/paper/spread.js.taskC2_v12`, atomic, node --check OK).
- **NEW `media/act5/frames/spreadR_v12/{1080,540}`** (227 MB). `spreadR_v11` is kept as the fallback.
- Temp frame dirs (raw takes, stab, seq) are deleted. They can be rebuilt from the mp4s with the commands above.

**Flow, v11 → v12** (`engine/out/review/passB/paper/m3b_flow_v11_vs_v12.csv`):

| region | median | frames < 0.3 px |
|---|---|---|
| Jade torso | 0.32 → 0.94 | 94 → 18 |
| Charlie strum hand + guitar | 0.29 → 0.87 | 117 → 21 |
| Ricky torso + hand | 0.41 → 0.72 | 71 → 21 |
| Jade head | 2.82 → 2.62 (not busier) | |
| Charlie head | 0.94 → 1.86 | |
| Ricky head | 1.35 → 1.67 | |

The remaining sub-0.3 frames are short dips of ≤ 7 frames (0.23 s) at strum / sway reversals, not holds. So the strict "no frames under 0.3" target is not fully met.

**Render and checks**
- `m3b_184-197_spread.mp4` + `m3b_184-197_spread_sheet.jpg` (1 fps + 186.65, the turn, 194.06, 194.9). 0 missing seqs.
- 194.06: consecutive diff 0.60 / 0.66 / 0.63 / 0.99, then the push.
- 194.9: 17.3 → 14.2, steady. No luma drops over 35.
- Brows: `m3b_spread_brows_v12.jpg` (raw vs transferred, 13 frames, 3x).
- Canon (`m3b_spread_canon_crops.jpg`, frames 0/55/111/166/222, all three characters):
  - Headphones on the neck, one patch on the image-right sleeve band, chest dot, baggy navy pants with orange straps. Charlie (cap, curls, acoustic) and Ricky (striped shirt, Strat) are fine.
  - Pencils: an X with both caps up at the ends (0, 222). Mid-clip the pink cap swings to horizontal-left (~188.5, ~192.3) and the blue cap to horizontal-right with a tip below the bun (~190.5). This is the same level of wobble as v11 (doubt #2), not fixed, but there is no cap-down and no extra pencil.

**Spend:** $2.40 of $5 (3 x Veo 3.1 Fast 8 s 1080p at $0.80, genlog tags `pB_spread_v12_t1..t3`). Paper unit total: $18.65.

**Open**
1. The pencil wobble mid-clip remains, about as in v11. A cleaner X would need either a non-fast Veo 3.1 take ($3.20, over the remaining budget) or a per-frame bun/pencil composite from the still (as the brows are done).
2. Charlie's head now bobs more (1.86, against 0.94), in time with his strum. Natural to me, but worth Jade's eye.
3. Procedural breathing warp in the shader: not needed now. If Jade still sees holds at the strum reversals, a 1-2 px low-frequency torso-region warp (masked per character) could fill them. Cheap to prototype; not built.

## Task C3: cross-eyed fix + pencils from the still (Jade on v12) — DONE, switched to spreadR_v13
**Cross-eyed: where it comes from**
- It comes from Veo, not from our steps. In t2, Veo drew her eyes as dark almonds with no whites, so the only thing showing her gaze is the white catchlight. It placed the two catchlights inconsistently:
  - image-left eye: catchlight on the inner (nose) side, u ≈ 0.65-0.79 across the almond;
  - image-right eye: catchlight on its inner side, u ≈ 0.30-0.47.
- Both point at the nose, which reads as cross-eyed.
- I checked the raw Veo frames, the stabilized frames and the final frames (`m3d_spread_eyes_before_after.jpg`, plus raw/stab/final crops during the investigation). The catchlights sit in the same place in all three.
  - Stabilize is a global warp. The ping-pong only reuses frames. The brow inpaint never reaches below the brow hull.
  - v11 (the old take) has white sclera and a consistent gaze, so it never showed this.
- **Fix** (least invasive; the eyes stay Veo's):
  - Per eye, find the drawn almond inside the FaceMesh eye hull, then remove its catchlight (iris-only fill).
  - Redraw it as the same blob in the same colour at the almond's centre (u = 0.50, v = 0.42).
  - Closed or laughing eyes (FaceMesh openness < 0.12) are left alone.
  - Result: both eyes look straight ahead, and the gaze no longer jumps between frames.
- I tried and rejected pasting the still's eyes: they have sclera and lashes, and looked like a different drawing on Veo's face.

**Pencils: the still's bun + X on every frame** (new `tools/cutscenes/pb_spread_eyesbun.py`, $0)
- **Head tracking:**
  - Similarity transform from 20 FaceMesh forehead / temple / eye-corner / nose-bridge points (still → frame, 5-tap smoothed).
  - Plus a masked template match of the bun (still bun vs frame, ±36 px). This corrects the yaw offset in the 3/4 turn (median offset (-0.9, +1.0) px, max 6.6 px).
  - The pasted bun gets only 35 % of the head roll, so both caps stay pointing up through her tilts.
- **Veo's pencils out:**
  - Pencil colours (yellow body, orange wood, pink and blue caps) in a head-top ROI outside the face oval, plus each pencil's sharpened tip found by extending its own axis.
  - The image-right side next to the chin is included, but only while her head rolls right (that is when the blue end swings down past the ear).
  - Filled from sky or hair (Telea decides which, then normalised convolution on that class), with the page's own grain added back from the still.
- **Still's bun + two cap ends in:** only the hair pixels inside the bun ellipse and the two pencil bands, feathered and gain-matched on a ring. No sky from the still is pasted.
- The blue pencil's lower end by her ear is not pasted. It floated off the head in the 3/4 turn, and canon says tips hidden. Veo's own lower ends are removed.

**Assembly**
- The take (stabilized, frames 14-125) goes through eyes/bun → ping-pong 14→125→14 (as v12) → brows `--lidguard=14`. Faces found on 112/112 and 223/223 frames.
- **NEW `media/act5/frames/spreadR_v13/{1080,540}`** (≈227 MB). spreadR_v12 is kept as the fallback.
- **`engine/src/scenes/act5/spread.js:106`:** `'spreadR_v12'` → `'spreadR_v13'`, the only token changed (backup `engine/out/bak_v4b/paper/spread.js.taskC3_v13`, atomic, node --check OK). Lines 59 and 206 (the coordinator's edits) are untouched.
- Temp frame dirs are deleted. Disk: 11 GB free (99 %; other units are also writing).

**Checks**
- **`m3d_184-197_spread.mp4`** + `m3d_184-197_spread_sheet.jpg`. 0 missing seqs.
- **Hand-off:**
  - 194.06: 0.59 / 0.67 / 0.62 / 1.00, then the push.
  - 194.9: a steady 17.3 → 14.2. Ping-pong turn at 190.46: 3.1-3.8, smooth. No luma drops over 35.
- **Motion is unchanged from v12:** Jade's torso median 0.95, Charlie's strum 0.87, Ricky 0.72, Jade's head 2.59.
- **`m3d_spread_pencil_canon.jpg`** (frames at 1/4, 1/2, 3/4, the old swing's worst frames 40 / 50 / 100 / 106, start and end):
  - Both caps are up in an X on every frame (pink image-left, blue image-right), with no downward end and no third pencil.
  - The bun sits on the head, with no sliding in consecutive-frame strips (checked at frames 20-25 and 96-101).

**Open**
1. Faint fill traces are left where Veo's longer horizontal pencil ends were: a slightly smoother patch of sky by the image-right temple, visible at 2-3x and not at 1:1.
2. During the turn (about 190.0-190.9) the pasted bun is the still's frontal bun on a head seen at 3/4. It reads fine at 1:1, but it's not perspective-correct.
3. The catchlight now always sits at the almond's centre (a straight-ahead gaze). If Jade wants the still's slight glance to image-right, use `--catchu=0.6`.

## Task C3b: pencil polish (coordinator review of v13) — DONE, switched to spreadR_v13b
**What I did and why.** I went pencils-only: the Veo bun is kept as drawn, and the pencils now come from Veo itself.
- **Bun:** keeping the Veo bun fixes the coordinator's point 3 completely. The bun keeps its knit-like texture and tone, and it moves with the head exactly as Veo drew it, with no tracking error.
- **Pencils:** the paste source is Veo's own clean frame (stabilized take, source frame 14: a clean X, both caps up) instead of the still. That fixes point 1 at the root: line weight, outline darkness, saturation and crispness are Veo's own, so nothing has to be matched.
- **Tried and dropped:** sharpening the still's pencils with a single Lanczos warp from the full-res still (plus an unsharp mask, a saturation match and a synthetic outline). The still's thin brown outline never read like Veo's.

**How the pencils go on**
1. **Source mask:** in the reference frame, the two cap-end pencils above the bun are found by colour. Each becomes a solid band along its own axis (so the shaded half and the outline are included), cut where it enters the bun's hair.
2. **Extrusion:** each pencil is extended 34 px toward the bun by repeating its last body slice. In each frame that extension shows only over sky, up to the first hair it meets. So the pencil always reaches into the moving Veo bun and disappears behind its strands, which gives the occlusion.
3. **Warp:** a single Lanczos warp from the reference frame to each frame (reference → still → frame, via the bun-anchored head transform: tracked bun, 35 % of the head roll). Alpha is fully opaque inside, with about 1 px of feather at the outline.
4. **Veo's own pencils are removed as before, with a better fill:**
   - Sky vs hair is decided by the frame's own hair silhouette: a closing of 15 px, eroded 1 px.
   - This replaces the Telea-guided choice, which was the source of point 2: the dark blot under the blue pencil and the grey smudge by the pink cap.
   - Paper grain is taken only from plain sky in the still (no streaks from its line art).
   - I tested a nearest-boundary fill too and rejected it: it brought the dark blots back.

**Eyes, timing, ping-pong 14→125→14 and brows** (`--lidguard=14`) are unchanged.
- Command: `$OSPY tools/cutscenes/pb_spread_eyesbun.py spreadR_v12t2_stab <out> --frames=14-125 --pencilsonly`, then the ping-pong, then `pb_spread_browtrack.py spreadR_v13b --src=<seq> --crop=800,140,1200,540 --lidguard=14`.
- The stabilized input is rebuilt with `conform.py … --fps30 --ss=0.5` + `pb_stabilize.py --smooth=1`, both deterministic.

**Changes**
- **`engine/src/scenes/act5/spread.js:106`:** `'spreadR_v13'` → `'spreadR_v13b'`, the only token changed (backup `engine/out/bak_v4b/paper/spread.js.taskC3b_v13b`, atomic, node --check OK).
- **NEW `media/act5/frames/spreadR_v13b/{1080,540}`.** spreadR_v13 is kept as the fallback.
- Intermediates are deleted. Disk: 10 GB free.

**Checks**
- `m3e_184-197_spread.mp4` + `m3e_184-197_spread_sheet.jpg`. 0 missing seqs.
- 1:1 sheet `m3e_spread_pencils_1to1.png` (frames 40, 100, 111 and 166; v12 / v13 / v13b, not upscaled).
- **Hand-off:**
  - 194.06: 0.60 / 0.67 / 0.63 / 1.00, then the push.
  - 194.9: 17.3 → 14.2, steady.
  - Turn at 190.46: 3.1-3.8. No luma drops over 35.
- **At 2-4x:** the pencils are as crisp and saturated as the rest of the layer, both caps are up in an X on every frame, and the pencils enter the bun behind its strands. The bun's texture is Veo's.

**Open (minor, visible only at ≥ 3x)**
- A 1-2 px pale sliver where the pink pencil meets the bun in a few frames.
- A faint light line along the blue pencil's upper-left edge (sky-fill residue of Veo's pencil outline).
- A tiny orange fleck at the image-right hair edge where Veo's lower orange end touched the hair (around frame 40).

## Task C3c: hair-outline notches (coordinator review of v13b) — DONE, switched to spreadR_v13c
**Cause.** Removing Veo's pencils used a wide mask (pencil colours dilated 11 px). Where a pencil crossed the hair outline, that took a bite out of the bun or temple contour, and the 15 px hair-silhouette closing could not bridge it, so it was filled as sky.

**Fix** (`tools/cutscenes/pb_spread_eyesbun.py --pencilsonly`, removal and fill only; the pasted Veo frame-14 pencils, eyes, timing, ping-pong and brows are unchanged):
1. **Tighter removal:** the pencil-colour dilation is 7 px (about 3 px around the pencil), plus 1 px. The mask then adds only Veo pencil-outline residue next to it that is not part of a hair mass (opening 7 px): dark lines, and antialiased pixels greyer or whiter than the local paper. This also removes the faint light line along the blue pencil.
2. **Hair contour rebuilt across each hole:**
   - A signed distance to the hair edge is built from the known hair masses and sky on both sides, Telea-interpolated through the hole.
   - Hair is filled where the result is < 0, so the outline continues straight across instead of being bitten.
   - Hair is filled from hair and sky from sky (normalised convolution), with paper grain on the sky.

**Scan of all 223 frames.** Metric: pixels that are hair-dark (< 90) in v12 (Veo) but turned bright (> 165) in the output, opened 3x3, within the head-top ROI.
- Mean per frame: v13b 100.8 px → v13c 38.8 px.
- Worst v13b frames: 92, 123 and 84 (203 / 189 / 180 px).
- v13c worst is 139 px, mostly the legitimate pencil-outline removal along the pencils, not notches.

**Changes**
- **`engine/src/scenes/act5/spread.js:106`:** `'spreadR_v13b'` → `'spreadR_v13c'`, the only token changed (backup `engine/out/bak_v4b/paper/spread.js.taskC3c_v13c`, atomic, node --check OK).
- **NEW `media/act5/frames/spreadR_v13c/{1080,540}`.** v13b is kept as the fallback.
- Intermediates are deleted. Disk: 9.8 GB free.

**Checks**
- `m3f_184-197_spread.mp4` + `m3f_184-197_spread_sheet.jpg`. 0 missing seqs.
- 1:1 sheet `m3f_spread_hair_1to1.png` (v13b vs v13c at frames 40, 100, 111 and 166, plus the 3 worst v13b notch frames 92, 123 and 84).
- **Hand-off:**
  - 194.06: 0.59 / 0.67 / 0.62 / 1.01, then the push.
  - 194.9: 17.3 → 14.2, steady.
  - Turn at 190.46: 3.1-3.8. No luma drops over 35.

**The 3 nits**
- **Blue-pencil light line:** gone.
- **Pink-pencil sliver:** mostly closed by the contour rebuild.
- **Orange fleck at frame 40:** it was inside the face-oval exclusion and is left as is (about 2 px, not visible at 1:1).

**Open:** a few small dark hair-edge fragments by the image-right temple, where Veo's long horizontal pencil end used to be. Visible at 2x.
