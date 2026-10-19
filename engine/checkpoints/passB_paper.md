# v4 Pass B · paper unit · checkpoint (2026-10-18) — M1 approved; M2 done, stopped

**Review sheet:** `engine/out/review/passB/paper/m1_sheet.jpg` (1920 wide). It has each card mid-word in the engine at 1080p beside its
target still, the old and fixed #06 side by side (with 2x head crops), one lip-sync word strip per clip, the 03/04/05 forehead
proposals (not applied) and the bridge-card brows before and after.
Loose 1080p PNGs are in the same folder: `sig_p03_21.50.png`, `sig_p04_49.05.png`, `sig_p05_109.35_clipframe.png`, `sig_p06_145.45.png` and `sig_bridge_126.40.png`.
Canon crops are in `canon_crops.jpg`. Per-card previews with the song are in `media/cutscenes/paper_*/preview_540p_with_song.mp4`.
No section mp4 has been rendered (M2 waits for go).

## Changes (file:line)
- **NEW `engine/src/scenes/paper_inserts.js`** (62 lines). It plays the full-frame card clips (VideoClip, frame = round((t - t0) * 30)) and puts the
  one-style SmoothSubs on top (lines 7 / 13 / 39). Fallbacks, after the coordinator's notes: if the clip is missing it shows `media/cutscenes/paper_*/still.png`,
  and if that is missing too it shows a cream card. It never throws. Line 48 sets `scene.userData.csSkip = true` (COLOR_REQUESTS H14). It renders direct, not through post.
- **`engine/src/show/main.js:47-53`**: the new `paper` block (paper.p03 / p04 / p06, later overlapping entries, transition cut), plus `...paper` in the
  return (before `...type`). Times use T helpers: p03 `T.nearestBeat(T.line(7).start, 2)` = 20.152 -> 23.750, p04 48.566 -> 50.658, p06
  143.403 -> 146.197 (hands back 0.36 s before the typing at 146.556). The scene beneath keeps running and takes the frame back on t1.
- **`engine/src/scenes/act4/paper.js:20-22`**: `CLIPS.jade_sing` now points at `jade_sing_bridge_1/fallback_card_480p_portrait_adv0.10_v11.mp4`.
- **`engine/src/scenes/act4/assets/`**: `jade_sing_a.jpg`, `jade_sing_b.jpg`, `jade_laugh.jpg` and `lineup.jpg` are replaced by their `assets/sheets/v11/*_v11.jpg`
  versions (same sizes; used by the bridge fallback and the recap montage).
- **NEW `assets/v4_stills/06_paper_0223_v2.png`**: the fixed #06. The approved original is unchanged.
- **NEW media:** `media/cutscenes/paper_0020|0048|0147|0223/` (each has the slot clip, still.png and the preview). The bridge card with v11 brows is
  `jade_sing_bridge_1/{jade_sing_bridge_1_adv0.10_v11.mp4, fallback_card_480p_portrait_adv0.10_v11.mp4}`. A README section was added.
- **NEW tools** (`tools/cutscenes/`):
  - `pb_nbp.py`: nano-banana-pro edit; refuses photo paths.
  - `pb_headwarp.py`: smooth lift above the brows.
  - `pb_s06_comp.py`: head/hair-mask composite.
  - `pb_headcmp.py`
  - `pb_specs.py`: video specs.
  - `pb_sync.py`: plausible-range envelope correlation with a face crop.
  - `pb_wordstrip.py`
  - `pb_mouth.py`
  - `pb_slot.py`: exact 1080p slot clip.
  - `pb_dotfix.py`: chest dot repair.
  - `pb_browtrack.py`: v11 brows onto video.
  - `pb_m1_sheet.py`
- Backups are in `engine/out/bak_v4b/paper/` (paper.js, main.js, act4_assets/*). `node --check` is OK on all three JS files.

## 1. Still #06 fix
- **Measured (#06 at 1080p):** hairline-to-brow was 70 px and brow-to-nose-bottom 85 px (0.82x). The approved expr sheet is about 1.1x. The rewind-take-two photos were looked at only,
  never sent; there the forehead is about 1.0-1.2x the mid-face. The crown sat only about 68 px above the hairline, so the head looked flat on top.
- **nano-banana-pro, 4 edits of the head crop** (with the v11 expr sheet as reference): a/b added crown volume but kept the hairline in place, and c/d also wouldn't move the
  hairline (c turned into a pompadour). So the model drew the volume (take a), and a smooth geometric lift raised the hairline by 14 px and the
  crown by about 10 px more (0 at the brows, so the brows, eyes and face are untouched). It was composited into the approved still inside a soft head/hair mask (above the brows).
- **Result:** the forehead is 84 px (1.0x the mid-face), the hairline is full (not receding) and the crown is about 30 px higher. The pure-geometry alternate is
  `media/cutscenes/_work/passB/s06/s06_fixA.png`.
- **03/04/05 against the same note:** forehead ratios are 0.64x / 0.79x / 0.72x, so all three are shorter than the sheet. Proposed (not applied): the same
  +20% lift. Previews are in `media/cutscenes/_work/passB/forehead_prop/*_proposal.png` and in the sheet. They are rough: in 04 the pencil kinks slightly and the top grid line bends;
  a real apply would mask those from the original. **The cards are built on the APPROVED stills.** If Jade wants the fix on 03/04/05, the
  cards need a re-gen from the fixed stills (about $0.62 per take; 1-4 takes per card, going by this bake-off).

## 2. Cards: bake-off, chosen takes, measured offsets
The first frame is the approved still (06 uses v2). Audio refs are the song from S0 (mix or demucs vocal stem), 6 s. Lag convention: clip t = song t - S0 + lag.
"Offset" is measured on each take against the vocal stem; the slot clip has it baked in, and the residual is re-measured on the slot clip.

| card | chosen take | S0 / ref | offset | evidence | other takes |
|---|---|---|---|---|---|
| 03 0:20.15 | sd25 t4 `e221f483d2` | 20.00 / stem | **+0.08 s** | "m" of "my": the take closes 20.13-20.33 and opens 20.375 at lag 0; the stem's closure is 20.25 and the vowel 20.30. The line is legato and doubled, so the envelope correlation is ~0 for every take (t1-t4: 0.10-0.18) and can't decide. Word strip t4 at about 0 matches m / my / i / tion / ked | t1, t2 (19.85 mix/stem), t3 (20.00 stem): weaker word strips |
| 04 0:48.57 | sd25 t2 `856fd120c0` | 48.30 / stem | **+0.10 s** | corr 0.665 (0.08 at lag 0); slot residual 0.00 (0.68) | t1 (mix): lag 0.60 corr 0.635, but the screen glow on her face vanishes mid-window (B-R +11 -> -39). veofast: own clock, +1.57 corr 0.56 |
| 05 1:47.15 | sd25 t1 `f9b399b487` | 106.85 / mix | **0.00 s** | corr 0.631; slot residual -0.04 (0.60) | t2 (stem): 0.00 corr 0.668, but the chest-patch repair leaves a ring |
| 06 2:23.40 | sd25 t3 `34190fcc37` | 143.30 / stem | **+0.25 s** | corr 0.63 (lag-0 -0.40); slot residual -0.02 (0.62). Word strip at +0.25: m closed, ask / self / what open | t1/t2 (143.10): 0.17-0.18; t4 0.33 corr 0.39; veofast +0.76 / 0.36; veo +0.42 / 0.29 |

- **Model verdicts:**
  - **Seedance 2.5 480p with reference audio** is the only one that lip-syncs to our audio and keeps the approved composition. The vocal-stem
    reference was more reliable than the mix (04, 06).
  - **Pruna p-video-avatar / p-video** (audio-driven, cheap) re-compose to a frontal close-up, burn garbled captions and mangle the hair pencils.
    Rejected on all 4 cards.
  - **Veo 3.1 and 3.1 fast** (fair try on 04 and 06; Veo takes no audio input, so it was prompted to sing the words) keep the drawing at 1080p, but they sing on their own clock.
    Veo also moved the pencil hand and blurred the patch.
  - There is no @cf/ video model; gemini-omni-flash takes audio but lists $1.5/s, so it was not tried.
- **Canon fixes in post** (`pb_dotfix.py`, a per-frame feathered ellipse of the approved still at the tracked torso offset): Seedance turned the chest's
  pale-blue dot into a second "1420 MHz" badge on 03 (a rectangular label) and on 05 (a round patch). Both are repaired; on 03 the repaired area is slightly flatter in texture.
- **Canon audit** (`canon_crops.jpg`, Jade cropped 2-3x at 1/4, 1/2 and 3/4 of each clip):
  - 03 / 04 / 05: bun with an X, both caps up (blue + pink), tips hidden (04 and 05 show a tip by the ear, as in the approved stills), headphones on the neck, ONE patch on the
    image-right sleeve band, chest dot (after the fix).
  - 06: hair down, the blue-cap rainbow pencil in hand, headphones on the neck, the patch on the raised arm's band, midriff.
  - 05: navy pants with the orange strap.
  - Faces stay on the stills (05 reads a little rounder in the face).
- **Card 05 for stage_3d:** `media/cutscenes/paper_0147/paper_0147.mp4` covers 107.15 -> 110.41 (frame k = 107.15 + k/30), so any early sub-window
  works (their card05.js / battle.js plan 107.15-107.641). It is not registered in main.js. paper_inserts.js exports `CLIPS.p05`.
- 480p is upscaled to 1080p (lanczos), so the cards are soft at 1080p, the same as the bridge card. Option: flux-video-upscale (precise) at about $0.5 per card.

## 3. Bridge card with v11 brows (+0.10 s kept)
- I ran a nano-banana-pro v11 edit of source-take frame 7 (the v11 prompt and weight anchor; the clip's brows were v9-heavy, so v11 is slightly thinner) and kept take a.
- `pb_browtrack.py` moves those brows onto all 145 frames: a per-brow FaceMesh similarity transform (brow + upper-lid points, 5-frame smoothing), applied inside
  feathered brow masks. Faces were found on 145/145 frames. Then `compose.py slot ... 125.56 0.10 125.769 128.180` (take from 0.309 s) and `card.py`.
- **Timing check vs the shipped adv0.10 card:** PSNR below the face is 44.9 dB at shift 0 and 42.6 dB at shift ±1, with 71 frames each.
- **Known softness:** the new brows are a touch softer than the line art around them (the NBP output at 2x was downscaled), with a faint lighter halo at 3.8x.
  It is not visible at card scale in my checks.

## Gen spend (paper cap $40): **$16.25** after M2 ($14.10 at M1 + flux-video-upscale $2.15) (list estimates, all logged in media/genlog.jsonl, tags `pB_paper_*`, `pB_0[3-6]_*`)
| model | n | $ |
|---|---|---|
| nano-banana-pro (#06 x4, bridge brows x2) | 6 | 0.81 |
| Seedance 2.5 480p 6 s | 12 | 7.40 |
| Veo 3.1 fast 6 s 1080p + audio | 2 | 1.44 |
| Veo 3.1 6 s 1080p + audio | 1 | 2.40 |
| Pruna p-video-avatar (billed 6 s) | 4 | 1.09 |
| Pruna p-video | 4 | 0.96 |
| flux-video-upscale precise (4 cards 2.25x, 13.5 s @ 2.08 MP; bridge 1.5x, 2.9 s @ 0.92 MP) — catalog has no estimator for MP-s, logged with est None | 5 | 2.15 |

## Commands
- Python envs:
  - gen: `PY=~/Documents/1-music-shipped/moongazing/.venv/bin/python`
  - mediapipe: `OSPY=~/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python`
  - PIL: `.venv/bin/python`
- Specs: `python3 tools/cutscenes/pb_specs.py CARD sd25 TAKE voc`, then `$PY tools/gen/gen.py submit media/gen/specs/pB_<card>_sd25_t<n>.json`, then `gen.py wait ID`.
- Sync: `$OSPY tools/cutscenes/pb_sync.py TAKE S0 WIN_A WIN_B OUT --face=x0,y0,x1,y1`. Then `pb_wordstrip.py TAKE S0 LAGS OUT.jpg "lab@t,..." CROP`.
- Slot: `.venv/bin/python tools/cutscenes/pb_slot.py TAKE S0 LAG IN OUT media/cutscenes/paper_XXXX/paper_XXXX.mp4`.
- Engine stills: `node render.js --show main --stills 21.5:...,49.05:...,145.45:... --res 1920x1080 --fig native --figscale 1.3 --figres 2.5 --look k08b` (TMPDIR=engine/out/dev/tmp).
- Temp frames have been deleted (brows/src and out: about 200 MB).

## Open
1. **Card 03 sync is the weakest.** The line is legato and doubled, so neither the envelope nor the word strip proves it. It is set from the one clear closure. Please judge it
   by ear (`paper_0020/preview_540p_with_song.mp4`). If it doesn't hold, the options are more takes (about $0.62 each), or shortening p03 to 20.15-21.2 ("my ima-").
2. **03/04/05 forehead:** apply the proposed lift? If yes, the 03/04 cards (and 05 for stage_3d) need re-gens from the fixed stills.
3. #06 v2: the brief said to fix #06, so card 06 uses v2. The still is a new file; the approved one is untouched.
4. M2 (540p section mp4s for 18-25 s, 47-52 s, 141-148 s, plus the 1 fps sheets and the full verification) waits for the coordinator's go.
5. Possibly upscale the four cards with flux-video-upscale "precise" (about $2 in total) for 1080p crispness.

## M2 (coordinator go after M1; forehead lift on 03/04/05 on hold pending Jade)
**Upscale.** I upscaled all four cards and the bridge v11 card with flux-video-upscale, using precise mode (creativity 0).
- **Input:** frame-aligned segments of the chosen 480p takes (`media/cutscenes/_work/passB/upscale/seg_*.mp4`).
- **Upscale factors:** 2.25x for the cards, which gives 1922x1080; 1.5x for the bridge take with the v11 brows, which gives 720x1280.
- **Rebuild:** the slot clips were rebuilt with S0 shifted by the segment start. The 480p-lanczos versions are kept as `*_lanczos480.mp4`.

How the upscale held up:
- **Frame-level sync is unchanged.** The mouth curve of source vs upscale correlates at 0.992 / 0.994 / 0.990 / 0.983 at shift 0 (cards 03/04/05/06), against 0.70-0.93 at ±1 frame. The bridge measures 0.965 at shift 0 and 0.87-0.91 at ±1.
- **Detail survives:** line art, the chest dot, the sleeve patch and the pencil caps (blue and pink) all come through, and the lines are visibly crisper. See `upscale_check.jpg` and `m2_canon_crops.jpg`.
- **Patch lettering:** card 05's patch was already garbled ("1429") in the 480p take, and the upscale keeps it that way. Canon says legibility is optional.
- **Bridge brows:** the softness noted at M1 is gone after the upscale.

**Cuts snapped to the frame grid.** In `show/main.js:50-52`, t0 and t1 are now `T.snap(T.nearestBeat(...))`. The clips were rebuilt on the snapped times:
- p03: 20.1667 -> 23.7667
- p04: 48.5667 -> 50.6667
- p06: 143.400 -> 146.200

Before this, p06 cut in at 143.433, 30 ms off the grid. Now every cut I own lands within 17 ms of the grid. The backup is `engine/out/bak_v4b/paper/main.js.m2`.
`paper.js:22` now points at `fallback_card_480p_portrait_adv0.10_v11_up.mp4`.

**Renders.** All at 540p with audio, `--workers 1`, and 0 page errors. They are in `engine/out/review/passB/paper/`, each with `*_checks.txt` and `*_sheet.jpg` (1 fps plus the frames either side of every cut, labelled in song time). The files are `m2_18-25.mp4`, `m2_46-52.mp4`, `m2_141-148.mp4` and `m2_124-130_bridge.mp4`.
Command (from engine/):

`node render.js --show main --from A --to B --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b --mp4 out/review/passB/paper/m2_A-B.mp4 --audio --workers 1`

| check | 18-25 (p03) | 46-52 (p04) | 141-148 (p06) | 124-130 (bridge) |
|---|---|---|---|---|
| luma drops > 35 | 23.767 (cut out), 24.267 (act1's own white stab / cue cut, as in v3.1): no blips | 50.667 (cut back to the dark VOID box): on the cut | 146.200 (cut out): on the cut | 129.400 (the existing drums_back cut) |
| cuts vs grid | in at 20.167 (not detected: same cream palette, verified on the sheet), out 23.767 **+17 ms ON**; 24.233/24.267 are act1's pre-existing cue cuts (v3.1 cuts list, 24.22 cue) | in 48.567 **+1 ms**, out 50.667 **+9 ms** | 141.400 / 142.600 (existing) ON, in 143.400 **-3 ms**, out 146.200 **+3 ms** | 125.800 +33 ms (existing paper_jade_sing entry; unchanged, not mine to move), 128.200 +20, 129.400 +13 |
| UI budget | card = lyric bar only | card = lyric bar only; prompt-box gag intact before (cursor ready) and after (`// what do I need?` typed, `>` ready) | 画 slam clear frame respected (first subtitle 143.367, after 143.36); card = lyric bar only; the `>` prompt is back at 146.2, typing from 146.556 (`> you are` at 147.0) | type unit's 答 + gloss over the card (in-world, no bar) |
| subtitles | one style: the act1 pixel twin, then the SmoothSubs on the card (same colours and slot), with line 7 karaoke continuous | same, line 13 | SmoothSubs throughout, line 39 | type unit's in-world gloss (unchanged) |
| canon (m2_canon_crops.jpg, 2-3x) | pass | pass | pass | pass (v11 brows, caps up blue + pink, headphones on the neck) |
| residual lip-sync in the final render | closure check: mouth closed 20.167-20.267 and open at 20.300 = the stem's "my" vowel 20.30, so **0.00**. The envelope correlation is unusable here, as at M1 | **0.00 s** (corr 0.672) | **-0.017 s** (corr 0.643) | the 笔 closure is 126.167-126.333 and it reopens at 126.367, identical to the Tier-1 adv0.10 card (126.169-126.336 / 126.369): **unchanged** |

Still open: the forehead lift on 03/04/05 waits for Jade. If she says yes, re-gen those three from the lifted stills, then upscale and re-measure. Card 03's sync also waits for Jade's ear on `paper_0020/preview_540p_with_song.mp4`, which was rebuilt on the new clip.

## RESUME HERE (2026-10-18, paused for a machine restart; Jade's answers after M2)
Nothing is in flight. No gen jobs are pending (`gen.py status` shows no pB_ job running or queued) and no engine/src file is half-edited (node --check passes on main.js,
paper_inserts.js and act4/paper.js). Spend so far is $16.25 of the $40 cap; the coordinator's budget for the tasks below is up to about $30 in total.

### Task A: forehead lift on stills 03/04/05 (Jade: YES). NOT STARTED.
- Method (same as #06): a nano-banana-pro volume edit of a head crop with the v11 expr sheet as reference (`tools/cutscenes/pb_nbp.py`, prompt
  `media/cutscenes/_work/passB/s06/p_forehead.txt`, but with "hair in a BUN with two crossed pencils, both caps up" instead of "long loose hair"). Then
  `tools/cutscenes/pb_headwarp.py` (+20% forehead lift; the brow / hairline / crown coordinates for each still are in the M2 notes above and in
  `media/cutscenes/_work/passB/forehead_prop/`), then a composite inside a head/hair mask, with the pencils and the 04 grid taken from the original (the rough previews kinked them).
  Write the results as `assets/v4_stills/0{3,4,5}_*_v2.png` and leave the approved stills untouched.
- Then re-gen each card with Seedance 2.5 480p and the vocal-stem reference (`tools/cutscenes/pb_specs.py`; point ff.jpg at the v2 still), then the chest-dot fix
  (`pb_dotfix.py`), the flux upscale (`_work/passB/upscale` recipe), `pb_slot.py`, and re-measure (`pb_sync.py` / `pb_wordstrip.py` / `pb_mouth.py`).
- Card 05: keep the file name `media/cutscenes/paper_0147/paper_0147.mp4` and the time base (frame k = 107.15 + k/30). stage_3d plays the 107.233-107.600 slice.

### Task B: card 03 is off by a whole word (Jade: "the lips are visually starting with 'my' instead of 'because' (which is where the audio is starting)"). NOT STARTED.
- Clue so far: `docs/script.md:57` has "because" held 18.10-19.99, and lyrics_timed has my@20.12, but those word times are low confidence. The stem energy
  (see the M1 notes) dips at 20.25, has a gap at about 20.8-21.05 and dips at 23.60. That suggests "be-cause" is still being sung at 20.15-20.8, "my" about 21.05 and "imagination" later.
  VERIFY the true onsets of because / my / imagination in `work/demucs/htdemucs_ft/song/vocals.wav` (a spectrogram plus listening windows) before anything else.
- Re-gen 03 with the reference audio starting exactly at the card window (S0 = card t0 = 20.1667 or slightly before), and a prompt that sings
  "because my imagination is linked..." (edit CARDS['03']['words'] / ['lips'] in `tools/cutscenes/pb_specs.py`). Use the lifted 03 still from Task A as ff.
- Measure the offset per word (because / my / imagination), make a word strip with those three labelled, rebuild `paper_0020/preview_540p_with_song.mp4`,
  then upscale and slot as before.

### Task C: regenerate the moving outro spread layer with v11 brows (186.65-194.9). NOT STARTED.
- The coordinator OKs changing the one clip-pointer line in `engine/src/scenes/act5/spread.js`. Back up spread.js to `engine/out/bak_v4b/paper/` first.
- First find the current Veo layer and its first frame (grep spread.js for .mp4 and look in media/act5/). Make an image-to-video take from the v11 spread
  (`assets/sheets/v11/spread_full_v11.jpg`, or the matching frame) that matches the old layer's motion and length. Veo was the original model; choose by likeness
  and stability. Canon-audit it, check the hand-off into the 194.06 push-in is seamless, write a NEW file and keep the old one as the fallback.

### Then: an M2-style check on 18-25, 46-52, 106-111 (card 05 in stage_3d's slot) and 186-196; report and stop.

## M3 (forehead lift + card 03 word fix) — 2026-10-18 (Tasks A + B done; Task C is the other agent's section)
**Review files** (all in `engine/out/review/passB/paper/`): `m3_stills_before_after.jpg` (full stills + 2x head crops with hairline/brow/nose guides),
`m3_18-25.mp4`, `m3_46-52.mp4`, `m3_106-111.mp4` (+ `*_sheet.jpg` 1 fps + cut neighbours, `*_checks.txt`), `m3_canon_crops.jpg`, `m3_ws_p03.jpg`
(card 03 word strip with because / my / imagination labelled). By ear: `media/cutscenes/paper_0020/preview_540p_with_song.mp4` (the card) and
`preview_540p_with_song_context.mp4` (1 s of song either side). Render command as M2 but `--look k08b+cs --workers 1`; 0 page errors (only the usual start-up 404).

### Task B first: where the words really are (vocal stem `work/demucs/htdemucs_ft/song/vocals.wav`)
Method: spectrogram + RMS + onset strength (`_work/passB/m3/words/spec_17_24.png`, `spec_zoom_19.9_21.9.png` with >4 kHz energy), faster-whisper large-v3
word timestamps on the stem, and whisper on isolated windows (17.9-20.12 -> "Blossoms"; 20.10-21.50 -> "Because"; 21.0-22.5 -> "My imagination").
| word | stem | evidence |
|---|---|---|
| (blossoms, held) | ~17.85 -> 20.08 | "blo-" 18.05-18.25, held note 18.3-20.0, final /z/ fricative 19.92-20.08. **docs/script.md's "because held 18.10-19.99" is really "blossoms" held** |
| **because** | **20.13** (b release; vowel 20.15) | /k/ closure (deep RMS dip, -42 dB) 20.27, aspiration 20.30, "cause" vowel 20.40-20.95, /z/ 21.00-21.15 |
| **my** | **21.16** (m), vowel 21.20 | RMS dip 21.175, voiced 21.20-21.42 |
| **imagination** | **21.42** (i) | nasal murmur (fundamental only) = "m" 21.50-21.63, "ma" 21.65, gi ~22.09, then "is" ~22.5-22.9, linked 23.18 |
The v1 card had locked its "m" to the 20.25-20.30 dip, which is the /k/ of "be-cause": exactly one word early, as Jade heard.
Listening windows (cut from the stem): `_work/passB/m3/words/listen_because_20.10-21.16.wav`, `listen_my_21.14-21.44.wav`,
`listen_imagination_21.40-22.30.wav`, `listen_card03_window_20.1667-23.7667.wav`, `listen_blossoms_held_17.80-20.12.wav`.

### Task A: stills 03/04/05 lifted (approved files untouched)
- NEW `assets/v4_stills/03_paper_0020_v2.png`, `04_paper_0048_v2.png`, `05_paper_0147_v2.png` (pixels change only above the brows; bbox checked).
- Method (`tools/cutscenes/pb_liftcomp.py`, NEW, configs `media/cutscenes/_work/passB/m3/s0X/lift.json`):
  1. nano-banana-pro volume edit of the head crop with the v11 expr sheet (`_work/passB/m3/s0X/p.txt`: bun + two crossed pencils, both caps up). It added crown/bun volume but, as on #06, barely moved the hairline.
  2. a second nano-banana-pro edit of that result with the pencils REMOVED (`p_nopencil.txt`), so the lift field can never bend a pencil.
  3. the pb_headwarp lift field (0 at the brows, +dh at the hairline, +dc at the crown) applied to that pencil-free head (crown/bun) and to the ORIGINAL
     (from 50 px above the hairline down to the brows), so the hairline, face-framing strands, brows and skin tint stay the approved drawing (the NBP
     redraw had widened 05's side locks and changed its brows: seams, so not used there).
  4. composite inside the filled hair silhouette; outside it a 31 px ring takes the ORIGINAL background (04's grid stays straight) minus the old loose strands, plus the new ones.
  5. the ORIGINAL pencil pixels pasted back, moved rigidly: straight up when the lower part is hidden, along their own axis when a tip shows below the bun
     (03 blue, 04 blue, 05 pink, so they stay collinear with the untouched tip), continued into the new hair where needed; 04 capped at +12 px (blue cap stays in frame),
     05 at +10 px (both pencils still meet the hair).
- Measured (hairline-to-brow vs brow-to-nose bottom): 03 80 -> 98 px (0.68x -> 0.83x), 04 87 -> 108 px (0.71x -> 0.89x), 05 65 -> 79 px (0.66x -> 0.80x); about +20-24 %, as on #06.
- Self canon check (sheet, 2x crops): bun with the X, pink + blue caps up, tips hidden/behind the head as in the approved stills, hairline full (not balder), more volume
  on top, face/brows/eyes unchanged, headphones on the neck, 04 grid straight. Small: a faint light rim around the pasted pencils at 3-4x zoom; invisible at card scale.

### Cards re-made from the v2 stills (Seedance 2.5 480p, vocal-stem reference, 2 takes each) + flux-video-upscale precise 2.25x + `pb_slot.py`
| card | takes (media/gen/) | chosen | S0 | lag | why | residual on slot clip / in the render |
|---|---|---|---|---|---|---|
| 03 | t1 `3a8be12400`, t2 `fe81629249` | **t2** | 20.10 (ref audio starts at "because") | **+0.32** | t1 (lag ~+0.15) grew a SECOND "1420 MHz" patch on the image-left arm from frame 0 (canon: one patch); t2 has one patch, the chest dot, the X pencils | per word: **because** = open from the cut-in 20.167 through the "cause" vowel (stem b 20.13); **my** closed 21.033-21.167, opens 21.200 = **0.00 s**; **imagination** m closed 21.500-21.633, opens 21.667 = **+0.02 s**. Identical in `m3_18-25.mp4` |
| 04 | t1 `350009e46c`, t2 `913c8792a9` | **t2** | 48.30 | **+0.04** | t1 turns worried-browed after 3 s; t2 holds the face; both lags agree (0.04 / 0.5 ambiguity resolved by the "myself" closure 49.77 vs stem 49.74) | envelope +0.008 s (corr 0.72), same in `m3_46-52.mp4` |
| 05 | t1 `ac91b0508e`, t2 `6e16402853` | **t2** | 106.85 | **+0.008** | t1 (corr 0.69) blinks with closed eyes in the first frames, i.e. inside stage_3d's 107.233-107.600 slice; t2 eyes open, singing | envelope +0.008 s (corr 0.67); in `m3_106-111.mp4` the card frames match the clip within half a frame (107.15 is off the 30 fps grid) |
- No chest-dot repair was needed on the chosen takes (dot intact). `pb_dotfix.py` not used.
- Slot clips (same names/time bases): `media/cutscenes/paper_0020/paper_0020.mp4` (108 fr), `paper_0048/paper_0048.mp4` (63), `paper_0147/paper_0147.mp4` (98, frame k = 107.15 + k/30).
  Lanczos fallbacks `paper_*_lanczos480.mp4`; previews rebuilt. Old: `*_v1.mp4`, `*_lanczos480_v1.mp4`, `preview_540p_with_song_v1.mp4`, `still_v1.png` (new `still.png` = v2 still).
  Unused alternate: `_work/passB/m3/paper_0147_v2t1_up.mp4` (05 take 1, upscaled). Upscale vs lanczos mouth-curve corr at shift 0: 0.987 / 0.990 / 0.982.
- Segments: `_work/passB/upscale/seg_03_v2.mp4` (0.375+3.6667), `seg_04_v2.mp4` (0.2917+2.2083), `seg_05_v2t2.mp4` (0.2917+3.375).

### Changes (file:line) and backups
- `tools/cutscenes/pb_specs.py:21-26` CARDS['03']: s0 20.00 -> 20.10, words "because my imagination is linked to my everyday life", lips start on "because";
  `:45-48,54,82` optional 5th arg `v2` (first frame `ff_v2.jpg`, tag `pB_<card>_v2_*`). Backup `engine/out/bak_v4b/paper/pb_specs.py.m3`.
- `tools/cutscenes/pb_slot.py:7-12` frame-exact resampling (setpts by -ct0 + fps from 0, holds the first frame for up to ~1 take frame before the segment);
  the old input `-ss` snapped up to one frame early (measured on card 03). Backup `engine/out/bak_v4b/paper/pb_slot.py.m3`. Older clips were not rebuilt (their residuals were measured on the final files anyway).
- NEW tools: `pb_liftcomp.py` (stills), `pb_m3_stills.py` (before/after sheet), `pb_takesheet.py` (take canon sheet), `pb_preview.py` (540p preview with the song, optional context).
- `media/cutscenes/README.md`: M3 section appended. No engine/src file touched (paths unchanged); main.js p03 comment still says "my imagination is linked" (harmless).
- First frames `media/cutscenes/_work/passB/c0{3,4,5}/ff_v2.jpg`, ref audio `c03/voc_20.10_6s.mp3`.

### Spend (M3): about **$6.35**; paper unit total about **$22.60 / $40**
| model | n | $ |
|---|---|---|
| nano-banana-pro (3 volume + 3 pencil-removal edits) | 6 | 0.81 |
| Seedance 2.5 480p 6 s | 6 | 3.70 |
| flux-video-upscale precise 2.25x (03 3.71 s, 04 2.21 s, 05 t1 3.38 s, 05 t2 3.38 s @ 2.08 MP x $0.07/MP-s; logged with est None) | 4 | 1.84 |
All logged in media/genlog.jsonl with tags `pB_0[3-5]_v2_*`.

### Checks table (540p, `--look k08b+cs`)
| check | m3_18-25 (p03) | m3_46-52 (p04) | m3_106-111 (card 05 in stage_3d) |
|---|---|---|---|
| luma drops > 35 | 23.767 (cut out), 24.267 (act1's own stab, as in M2) | 50.667 (cut to the dark box) | 107.633 (cut to the dark 3D stage) |
| cuts vs grid | in 20.167 +14 ms ON, out 23.767 +17 ms ON; 24.233/24.267 = act1's pre-existing cue cuts | in 48.567 +1 ms, out 50.667 +9 ms | 107.233 -5 ms, 107.633 -8 ms, 110.467 +17 ms (stage_3d's) |
| canon (`m3_canon_crops.jpg`, 2-3x) | pass: bun + X, pink/blue caps up, ONE patch (image-right band), chest dot, headphones on neck | pass (+ screen glow, grid) | pass; eyes open in the slice |
| residual lip-sync | because open from cut-in; my 0.00 s; imagination +0.02 s | +0.008 s | +0.008 s (clip), half-frame in the render |

### Open / for the coordinator
1. **Subtitle karaoke on line 7 is a word early too** (type / subtitles, not mine): it highlights "my" from 20.12 while the stem sings "because" until 21.15
   (`analysis/lyrics_timed.json` my 20.12 / imagination 21.18 are wrong; true: because 20.13, my 21.16, imagination 21.42). And `docs/script.md:57` / act1's
   "because" bridge (18.10-19.99) sits over the held "blossoms". Worth a word with the type unit / coordinator; I changed nothing there.
2. Card 03's "cause" vowel is sung half-open 20.37-20.67 then wide 20.70-20.93 and the lips close early, from 21.03, over the /z/ before "my"; the m-release itself is on time.
   Jade's ear on `paper_0020/preview_540p_with_song.mp4` decides.
3. Card 03's last frames: a closure at 23.33-23.47 ("linked to"), about 0.3 s before the stem's "my" m; the card cuts out at 23.767.
4. stage_3d's `act3/card05.js` placeholder still is the old approved 05 (their file, only used if the clip is missing).
5. Temp frames deleted; `engine/out/dev/tmp` keeps only the shared Chrome profile dirs and the render logs `render_m3_*.log`.

### M3b (2026-10-18): card 03 timing variants (Jade: "the mouth is moving a little bit too early"), no gen spend
Slot variants `media/cutscenes/paper_0020/paper_0020_shift+K.mp4` (K = 0,1,2,3,4,6 frames later picture; lag = 0.32 - K/30; cut times unchanged 20.1667 -> 23.7667;
`paper_0020.mp4` restored to +0 = byte-identical to `_shift+0`). Coverage: the 480p take covers every window (take from 0.387 - K/30 >= 0.187 s;
end 3.987 - K/30 < 6.04), but the UPSCALED segment starts at take 0.375 s, so the first K frames of variant +K (frame 0..K-1, 20.167-20.200 for +1 ... 20.167-20.333 for +6)
come from the 480p take (lanczos) and the rest from the upscale; no freeze frames. Renders 19.0-24.5 with audio (`--look k08b+cs --workers 1`, 0 page errors, 2.3 MB each):
`engine/out/review/passB/paper/p03_var/p03_shift+K.mp4`. Measured in the renders: the closures move by exactly K frames.
| K | my: lips closed -> open (stem m 21.16, vowel 21.20) | imagination m (stem 21.50-21.63, vowel 21.65) | late closure (stem: "to" /t/ 23.60, "my" m ~23.75) |
|---|---|---|---|
| +0 | 21.033-21.167 -> 21.200 (close -0.13, open 0.00) | 21.500-21.633 -> 21.667 (0.00 / +0.02) | 23.333-23.467 -> 23.500 |
| +1 | 21.067-21.200 -> 21.233 (-0.09 / +0.03) | 21.533-21.667 -> 21.700 (+0.03 / +0.05) | 23.367-23.500 -> 23.533 |
| +2 | 21.100-21.233 -> 21.267 (-0.06 / +0.07) | 21.567-21.700 -> 21.733 (+0.07 / +0.08) | 23.400-23.533 -> 23.567 |
| +3 | 21.133-21.267 -> 21.300 (-0.03 / +0.10) | 21.600-21.733 -> 21.767 (+0.10 / +0.12) | 23.433-23.567 -> 23.600 |
| +4 | 21.167-21.300 -> 21.333 (+0.01 / +0.13) | 21.633-21.767 -> 21.800 (+0.13 / +0.15) | 23.467-23.600 -> 23.633 |
| +6 | 21.233-21.367 -> 21.400 (+0.07 / +0.20) | 21.700-21.833 -> 21.867 (+0.20 / +0.22) | 23.533-23.667 -> 23.700 |
My pick: +2 (then +3). At +0 the releases are on time but the "my" closure starts 0.13 s early (over the /z/ of "because"), which the eye reads as the "m": early.
+2 centres the closures around the stem's m (onset -0.06, release +0.07) and keeps the lead/lag inside the usual tolerance; +3 puts the stem m inside the closure from its start.

## M3c (2026-10-18, coordinator): Jade picked +6 by ear on the comparison page (https://claude.ai/artifact/JDU4XBQZGSPuUrodkGr1pw).
paper_0020.mp4 is now a copy of paper_0020_shift+6.mp4 (lag 0.32 - 6/30 = 0.12; "my" closure 21.233-21.367 -> open 21.400; imagination opens 21.867). +0 is kept as paper_0020_shift+0.mp4.
Note: the first 6 frames (20.167-20.333) come from the 480p take with a lanczos upscale (the 1080p upscale segment starts later).
- **M3c follow-up (paper unit): all 108 frames of the +6 card now come from the 1080p upscale.** Flux-video-upscale precise 2.25x, creativity 0, of take
  pB_03_v2_sd25_t2 from 0.1667 s for 3.6667 s (`_work/passB/upscale/seg_03_v2_up6.mp4/.txt`, spec `media/gen/specs/pB_03_v2_up6.json`, tag `pB_03_v2_up6`,
  out `media/gen/pB_03_v2_up6_9023dc7892.mp4`, about $0.53 = 3.71 s x 2.08 MP x $0.07). `paper_0020.mp4` rebuilt with `pb_slot.py ... 20.2667 0.12 20.1667 23.7667`
  (take from 0.02 s of the segment); `paper_0020_shift+6.mp4` updated to match; the previous file is kept as `paper_0020_shift+6_lanczoshead.mp4`.
  Checks vs that previous file: mouth-curve corr 0.989 at shift 0 (0.78 at +-1), closures identical frame for frame (21.233-21.367, 21.700-21.833, 23.533-23.667).
  Sharpness (Laplacian variance, head region) was 57-62 on frames 0-5 then about 1050 from frame 6 (the old seam); now 1295-1409 on every frame, no step;
  mean colour within 1 level across the old seam. Previews rebuilt. Paper unit spend now about $23.13 / $40.

## v4.3 (Jade notes 10-19)
Notes on full_v4.2:
- **0:22, card 03:** the lips are in sync, but the pale-blue chest dot is on the wrong side, and the body is stiff ("reads as AI generated or glitched").
- **0:49, card 04:** the same body-language note, and the lips are out of sync.

Goal: a real singer in a music video, with lips synced per word. Spend for this task is **about $7.14 of the $15 cap**. Paper unit total is now about $30.27 / $40.

**Review files.** All are 540p with the song, `--look k08b+cs --workers 1`, and 0 page errors.
- `engine/out/review/v43/paper/v43_17-26.mp4` and `v43_45-53.mp4`: the sections with the swapped-in +6 cards.
- `v43_before_after.jpg`: still 03 v2 against v3 (the dot), and old against new card frames at the same song times, with the motion numbers.
- `var/p0X_{old,shift-2,+0,+2,+4,+6,+8}.mp4`: the timing variants. 03 covers song 17-26 s and 04 covers 45-53 s.
- Comparison page source (NOT published): `docs/pages/v43_paper/` (`index.html`, `v/` with 14 videos, 32 MB, and `SOURCES.txt`). Publish with root = that dir.
  It has two players, one per card. Each has 7 versions (the old v4.2 card plus 6 timings), and switching keeps the playhead. The loops are 19.9-22.4 ("because my imagination") and 48.3-50.9 ("I just ask myself").
  It also has a per-word table and pick buttons with a copy-answer box. It was smoke-tested in headless Chrome at 390 px: 14/14 videos load, the playhead holds on a switch, and there is no horizontal scroll.

### 1. Still 03 chest dot (no gen spend)
- NEW `assets/v4_stills/03_paper_0020_v3.png`, made from the approved v2 (forehead lift kept). v2 itself is untouched.
- The tool is `tools/cutscenes/pb_dotmove.py`. It does two things:
  1. Erase: the dot on HER RIGHT (image-left, centre 440,755, r 26) is replaced by the cleanest nearby jacket patch (offset -74,-38, chosen for lowest edge energy) under a feathered mask, with its colour matched to the jacket.
  2. Add: the ORIGINAL dot's own pencil pixels go back on as a multiply layer on HER LEFT (image-right front panel, centre 664,748). It is squashed to 0.62 width, because that panel is foreshortened in the 3/4 view.
- Pixels change only in bbox x 407-680, y 722-787 (3,912 px).
- `media/cutscenes/paper_0020/still.png` (the fallback) is now v3.

### 2. Method bake-off: why Seedance again, and what changed
- **The stiffness came from the prompt, not the model.** The M3 prompts asked for a locked, unchanged figure, so the motion went into the mouth. Seedance 2.5 480p (first frame + vocal-stem reference audio) stays the only catalog model that lip-syncs to OUR audio while keeping the drawing. That was verified in M1:
  - Pruna avatar re-composes the frame.
  - Veo / hh / wan / pixverse take no audio input.
  - gemini-omni is $1.5/s.
  - There is no @cf/ video model.
- **Veo-motion + Seedance video-edit lip-sync was not needed.** It would cost about $3.2 per take (Seedance video input is $0.43/s). The cheap route reached 2.4-2.5x head and 4.7-5x torso motion with clean sync.
- **Changes to the takes:** a new performance prompt, `tools/cutscenes/pb_specs43.py` (≤2000 chars). The takes are 5 s, not 6. Each reference starts earlier (03 S0 = 19.60, inside the held "blossoms" tail; 04 S0 = 48.00), so she is already moving when the card cuts in.
- **Prompt variants:**
  - a: performance (breathing, nods, tilts, shoulder sway, eye-line, expression).
  - b: bigger, whole-upper-body.
  - c: b plus lip-sync-first wording.
  - c3/c4: c plus "the mouth stays open, never closing, through the long held 'cause'".
- **Two new measures:**
  - `tools/cutscenes/pb_motion.py`: COHERENT motion, the mean optical-flow vector (so pencil-texture boil cancels). Head = above the eyes; torso = the band under the chin. Units are px/s at 1080p.
  - `tools/cutscenes/pb_tmplsync.py`: the lag from a phoneme TEMPLATE of expected mouth openness, built from the stem word maps (03 from M3; 04 newly measured). The envelope correlation is useless on legato lines. It then reports the per-labial closure error at the best lag.
- **Card 04 stem map** (RMS + >3 kHz fricative share, vocals.wav):
  - "I": 48.44-48.70
  - "just": j 48.72-48.79, vowel 48.80-49.16, st 49.18-49.34
  - "ask": 49.36-49.60, sk 49.62-49.71
  - "myself": **m 49.72-49.77**, vowel 49.80-50.04, s 50.06-50.22, elf 50.24-50.50, f 50.52-50.58
  - "what": 50.60+
  - (whisper large-v3 agrees to within about 0.1 s)

| take (media/gen/v43_*) | head / torso px/s | template lag (r) | verdict |
|---|---|---|---|
| v4.2 card 03 (old) | 23 / 8 | | stiff (Jade) |
| 03 a1 `506c101517` | 29 / 12 | -0.12 (0.74) | hardly more motion than old; no "my" closure; extra closure inside "imagination" |
| 03 b1 `d4aec653a9` | 36 / 21 | -0.08 (0.26) | lips shut mid-"cause" |
| 03 b2 `df10fa2518` | 53 / 23 | -0.06 (0.43) | turns frontal mid-take, so the likeness drifts; shuts mid-"cause" |
| 03 c2 `f5a49a5c69` | 62 / 38 | -0.05 (0.37) | lovely motion; shuts mid-"cause" (20.56-20.68) |
| 03 c3 `169ad009f4` | 55 / 25 | -0.07 (0.40) | shuts mid-"cause" |
| **03 c4 `43ddce81b8`** | **55 / 37** | **-0.05 (0.72)** | **chosen**: b closure on "be-", "cause" open throughout, m-closures for my (21.07-21.19) / imagination (21.44-21.61) |
| v4.2 card 04 (old) | 16 / 5 | | stiff (Jade) |
| 04 a1 `19d9ef3296` | 22 / 17 | -0.17 (0.74) | clean sync, modest motion (runner-up) |
| 04 b1 `71cb9dd41e` | 44 / 21 | +0.06 (0.27) | loose sync (myself m +0.16) |
| 04 b2 `5597b547d8` | 14 / 4 | +0.10 (0.52) | nearly frozen |
| **04 c2 `189db1ab2f`** | **39 / 23** | **-0.18 (0.74)** | **chosen**: shrug, eyes up to the screen then inward, head tilts, an eyes-closed beat; closures t/m/f within ±0.08 |

As shipped (+6 slot clips): card 03 has head 59 / torso 39 px/s (2.5x / 5x v4.2), and card 04 has 38 / 23 (2.4x / 4.7x).

**Canon audit** (2-3x crops of every take at 5-7 times, plus the slot clips and the renders), both winners pass:
- bun with the X and caps up, blue + pink (both stay inside the frame);
- headphones on the neck;
- ONE 1420 MHz patch on the image-right sleeve band;
- ONE pale-blue chest dot on HER LEFT (image-right) in both cards;
- jacket stripes horizontal;
- face, brows and forehead match the v2/v3 stills.

### 3. Upscale, slots, timing variants
- **Upscale:** flux-video-upscale precise 2.25x, on segments covering every variant:
  - 03: take frames 5-102 (`_work/passB/upscale/seg_03_v43c4.*`, out `media/gen/v43_03_c4_up_3498dcc010.mp4`).
  - 04: frames 1-63 (`seg_04_v43c2.*`, out `v43_04_c2_up_b2dacc43e1.mp4`).
- **Upscale alignment:** the upscaler returns +2 / -1 frames at the END only. The start is aligned (mouth-curve corr 0.994 / 0.991 at shift 0 vs about 0.7-0.8 at ±1; `tools/cutscenes/pb_upalign.py`).
- **Slots** are built with `pb_slot.py` on the same names and time bases (03: 20.1667 -> 23.7667, 108 frames; 04: 48.5667 -> 50.6667, 63 frames). K = frames later picture:
  - 03: `pb_slot.py v43_03_c4_up_3498dcc010.mp4 19.808333 (-0.05 - K/30) 20.1667 23.7667`
  - 04: `pb_slot.py v43_04_c2_up_b2dacc43e1.mp4 48.041667 (-0.18 - K/30) 48.5667 50.6667`
- **Variant files:** `media/cutscenes/paper_0020/paper_0020_v43_shift{-2,+0,+2,+4,+6,+8}.mp4` and `paper_0048/paper_0048_v43_shift{...}.mp4`.

**Per word at +0, measured in the renders:**

| card | word | stem | lips at +0 | offset |
|---|---|---|---|---|
| 03 | "my" | vowel 21.20 | open 21.233 | +0.03 |
| 03 | "imagination" | vowel 21.65 | open 21.633 | -0.02 |
| 04 | "ask" | 49.36 | open 49.40 | +0.04 |
| 04 | "myself" | vowel 49.80 | m 49.733-49.80, open 49.833 | +0.03 |
| 04 | "-elf" | 50.24 | open 50.267 | +0.03 |

Each +K adds K/30 s. The template lag in the renders is 0.00 for +0, +0.14 for +4 and +0.21 for +6, as built.

**Recommended variant: +6 on both cards, now in the show.**
- Calibration from the same renders: Jade's +6 pick on the OLD card 03 opened "my" 0.20 s and "imagination" 0.22 s after the stem. The new +6 gives +0.23 / +0.18.
- The OLD card 04 measured on time (+0.03 s), and Jade heard it as out of sync, which is the same preference.
- So +6 reproduces her ear. +4 is the next choice.
- If she reviews on Bluetooth audio, this offset is in her playback, and +0 would be right for everyone else. Worth asking her.

### 4. Changes and backups
- `media/cutscenes/paper_0020/paper_0020.mp4` = `paper_0020_v43_shift+6.mp4`.
- `paper_0048/paper_0048.mp4` = `paper_0048_v43_shift+6.mp4`.
- `paper_0020/still.png` = still v3.
- `paper_00{20,48}_lanczos480.mp4` were rebuilt from the 480p takes at +6. They are unused by the engine.
- Both previews (`preview_540p_with_song.mp4`) were rebuilt.
- To switch to another variant: `cp media/cutscenes/paper_00XX/paper_00XX_v43_shift+K.mp4 media/cutscenes/paper_00XX/paper_00XX.mp4`. The engine re-decodes on mtime.
- **No engine/src or show file was touched.** Cut times and names are unchanged; card 05 / paper_0147 is untouched.
- **Backups** of everything replaced are in `engine/out/bak_v4b/paper/v43/`: `p0020_{paper_0020,paper_0020_lanczos480,still,preview_540p_with_song}` and `p0048_{...}`. The v4.2 timing variants `paper_0020_shift+K.mp4` are untouched.
- NEW tools: `pb_dotmove.py`, `pb_specs43.py`, `pb_motion.py`, `pb_tmplsync.py`, `pb_upalign.py`, `pb_v43_sheet.py`. Specs are `media/gen/specs/v43_*.json`; refs are in `media/cutscenes/_work/passB/v43/`.
- **Checks (540p):**
  - 17-26: luma drops 23.767 (cut out) and 24.267 (act1's stab); cuts 23.767 +12 ms ON, 24.233/24.267 = act1's pre-existing cue cuts.
  - 45-53: drops 50.667 / 52.667; cuts 48.567 +17 ms ON, 50.667 -19 ms ON, 52.633 pre-existing off-grid.
  - Same as v4.2.
- Spend logged in media/genlog.jsonl (tags `v43_*`):
  - 12 x Seedance 2.5 480p 5 s = $6.17.
  - The two upscales ($0.38 + $0.59) are hand-logged as `cost_note`.
  - Total $7.14.
- Disk: about 250 MB of new files. The per-variant engine clip caches were deleted. The current two remain, plus older pre-v4.3 caches from earlier units (`out/cache/clips/*paper_00{20,48}*`, about 500 MB; safe to clear).
- Known and unchanged: the takes are 24 fps, resampled to 30 by the slot (as before).
