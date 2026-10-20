# v44_paper checkpoint (2026-10-19, started 10:20 CDT)
Brief: docs/v44_brief.md. Tasks: A = card 03 +6 with +0 on "because" (time-warp); B = card 05 at 1:47 animated + held longer than the 3D band shot.
Backups: engine/out/bak_v44/v44_paper/. Review clips: engine/out/review/v44/v44_paper/. Gen cap $25 (log media/genlog.jsonl).

## STATE at 10:42 CDT: DONE, SAFE, idle (no renders/gens running; main.js:30 t1 109.03; paper_0020 = R18 warp; paper_0147 = v44 shift+0)
Spend: 6 x Seedance 2.5 480p 5 s $3.08 + flux upscale ~$0.54 = **~$3.62 of $25** (genlog tags v44_05_*).
Deliverables (engine/out/review/v44/v44_paper/, 540p + audio, 0 page errors):
- card 03: p03_warp_{R18 (installed),R15,R24}.mp4 (17-26 s), loops p03_loop_because_{R18,R15,R24,ref+0,ref+6}.mp4 (19.9-22.4 x3), refs p03_ref_shift+{0,6}.mp4.
- card 05: p05_V1_card107.23-109.03_shift+0.mp4 (INSTALLED timing), p05_V2_card107.23-109.62_shift{+0,-2,+2,+4,+6,+8}.mp4 (V2 timing; the shift
  variants are on V2 because the longer card shows more singing), p05_ref_v4.3.mp4.
Checks: luma drops only on cuts (card 03: 23.767, 24.267 as v4.3; card 05: 109.033 V1 / 109.633 V2). Cuts: 107.233 (as before), V1 109.033 vs 8th 109.046 = -13 ms,
V2 109.633 vs beat 109.647 = -14 ms, 110.467 (as before). V2 render shows type.wutai's 舞 written over Charlie's face on the card 109.09-109.6 -> V2 needs the
type unit to start 舞台 at the sung 舞 (~109.58) before it can be installed.
Open: (1) V2 + type retime is the better cut (her hand is on the mic singing 我的 eyes closed; 2.4 s card vs 0.8 s 3D) -> coordinator/type call.
(2) lyrics_timed.json line 27 is one syllable early from 是 on (see 10:28). (3) Bun (card) -> loose hair + pencils in hand (3D) at the cut is canon-legal,
stage_3d's model; unchanged. (4) Card 05 patch text garbled at 1080p (legibility optional). (5) Old pre-v4.4 clip caches out/cache/clips/*paper_00{20,48}* untouched.

## Log
- 10:20 started; reading docs.
- 10:22 Task B gens SUBMITTED: 6 x Seedance 2.5 480p 5 s (est $0.514 each = $3.08), specs media/gen/specs/v44_05_sd25_{a1,a2,b1,b2,c1,c2}.json
  (builder NEW tools/cutscenes/pb_specs44.py; first frame media/cutscenes/_work/passB/c05/ff_v2.jpg; ref = vocal stem 106.85+5 s
  media/cutscenes/_work/v44/c05/voc05_106.85_5s.mp3; S0 = 106.85). Jobs vibesong/v44_05_sd25_*; a background `gen.py wait` collects them
  into media/gen/ (log media/cutscenes/_work/v44/c05/wait.log). If it died: `~/Documents/1-music-shipped/moongazing/.venv/bin/python tools/gen/gen.py collect`
  (that venv has av + jsonschema; the project .venv does not).
- 10:25 Task A: "because" = stem 20.13 (b) .. /z/ 21.15, "cause" vowel held 20.40-20.95; "my" m 21.16 (passB_paper.md M3). Card 03 cuts in at 20.1667,
  so "because" is the FIRST word: the clip starts at +0 and warps to +6 inside the held "cause" vowel, +6 for the rest (my imagination ... life).
  NEW tool tools/cutscenes/pb_warp03.py (run with the cv2 python ~/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python):
  frames before the ramp = paper_0020_v43_shift+0.mp4, after = _shift+6.mp4 (identical pixels), ramp frames = DIS optical-flow interpolation
  of the upscaled take, raised-cosine speed dip. Variants (media/cutscenes/paper_0020/): paper_0020_v44_warp0to6_R18.mp4 (20.40-21.00, min speed 0.33,
  RECOMMENDED: whole warp inside the held vowel), _R15 (20.50-21.00, min 0.2), _R24 (20.333-21.133, min 0.5). Face strip checked: no ghosting.
  Backup of the shipped +6 card: engine/out/bak_v44/v44_paper/paper_0020.mp4.v43_shift+6 (== paper_0020_v43_shift+6.mp4).
  DONE 10:26 (media/cutscenes/_work/v44/c03/render_vars.sh, safe to rerun): engine/out/review/v44/v44_paper/p03_warp_{R15,R18,R24}.mp4 (17-26 s, 540p,
  audio, 0 page errors), loops 19.9-22.4 x3 p03_loop_because_{R15,R18,R24,ref+0,ref+6}.mp4, refs p03_ref_shift+{0,6}.mp4 (= v4.3 renders).
  **INSTALLED: media/cutscenes/paper_0020/paper_0020.mp4 = paper_0020_v44_warp0to6_R18.mp4.**
  Measured in the R18 render (face crop vs the v4.3 +0/+6 renders, cmp.py): matches +0 to 20.40, +6 from 20.80; per-frame change in the face falls
  smoothly 12 -> 1.1 through the ramp (the held vowel barely moves), no jump, no repeated frame inside the ramp (the 24->30 duplicates every 5th frame
  outside it are the take's, as in v4.3).
- 10:28 Task B analysis. Stem syllables (vocals.wav RMS + >3 kHz share): 世 sh 106.98 / vowel 107.25-107.64 | stop 107.65-107.69 | 界 107.70-108.17 |
  是 108.20-108.78 | 我 108.81-109.10 | 的 109.11-109.50 | stop 109.53-109.60 | 舞 109.62-109.83 | gap 109.86-109.90 | 台 109.92-110.40.
  NOTE for coordinator/type: analysis/lyrics_timed.json line 27 is about one syllable early from 是 on (是 107.72 is really 界; 舞 109.14 is really 的),
  so type.wutai (main.js:61, t0 = T.word(27,3).start - 0.05 = 109.09) brings 舞 in ~0.5 s before the sung 舞 (109.62).
  3D band shot: Jade has LOOSE hair and holds the two pencils (canon-legal: loose when pencils are in her hands); the card has the bun. Not changeable by me.
  Window plan (only main.js:28 act3.card05 t1 changes; battle.js BAND_CUT/camera untouched, its push just starts later on screen):
    V1 t1 109.03 -> card 107.233-109.000 (1.80 s), 3D 109.033-110.41 (1.38 s); cut on the 8th 109.046 (-13 ms), 1 frame before type 舞台 (109.09): no type change needed.
    V2 t1 109.62 -> card 107.233-109.600 (2.40 s), 3D 109.633-110.41 (0.78 s); cut in the stop before 舞 on the beat 109.647 (-14 ms): the
       3D shot carries 舞台; best musically, BUT needs type.wutai t0 -> ~109.58 (true 舞) or 舞 shows over the card for 0.5 s (type unit's call).
  pb_tmplsync.py: added card "05" template + stop events (backup engine/out/bak_v44/v44_paper/pb_tmplsync.py.v43).
- 10:31 Gens back (6 takes, $3.08). Metrics (pb_tmplsync card 05 template, crop 0.38,0.05,0.62,0.55; pb_motion head/torso px/s; NEW tools/cutscenes/pb_bandmotion.py
  coherent flow per guitarist). Old v4.3 card take pB_05_v2_sd25_t2: lag +0.04 r .81, head 24 / torso 10, Charlie .14 Ricky .14.
  | take | lag (r) | head/torso | Charlie/Ricky | notes |
  | **a1 3656bdae32** | **+0.03 (.83)** | **60 / 36** | .28/.22 | **CHOSEN**: hand comes up and grips the mic at clip ~1.5-2.0 s = song ~108.3-108.8 (inside the card), eye-line to the side, head tilts; canon pass (bun+X, pink/blue caps up, phones on neck, dot her left, ONE patch on the band) |
  | a2 83d2d62379 | +0.51? (.63) | 47 / 45 | .25/.25 | sync ambiguous; hand to mic only at ~4.5 s |
  | b1 316adb33f0 | -0.32 (.82) | 41 / 60 | .28/.22 | open-palm gesture at clip ~4 s = song ~111.2 (after the window) |
  | b2 24876eb9af | -0.14 (.83) | 39 / 36 | .26/.18 | gesture at ~4.3 s (after the window) |
  | c1 35fc9f5fe6 | +0.07 (.86) | 41 / 21 | .22/.28 | small motion |
  | c2 d5cc267fdb | +0.06 (.86) | 42 / 41 | .39/.33 | best band motion, gesture at ~3.5-4 s = song ~110.3+ (after the window); runner-up |
  Sheets: media/cutscenes/_work/v44/c05/sheet_*.jpg, canon_a1.jpg.
- 10:32 Upscale SUBMITTED: flux-video-upscale precise 2.25x of a1 frames 1..89 (seg media/cutscenes/_work/v44/upscale/seg_05_v44a1.mp4, spec
  media/gen/specs/v44_05_a1_up.json, job vibesong/v44_05_a1_up-062b84422a, ~$0.54 hand-logged as cost_note). Background wait -> upscale/wait.log.
  Interim lanczos slots media/cutscenes/_work/v44/c05/lz_shift{-2,+0,+2,+4,+6,+8}.mp4 (pb_slot.py TAKE 106.85 (0.03-K/30) 107.15 110.4167).
  Backups: engine/out/bak_v44/v44_paper/paper_0147/{paper_0147,paper_0147_lanczos480,preview_540p_with_song}.mp4 (v4.3 card 05).
  paper_0147.mp4 is now the lanczos +0 interim (to be replaced by the upscale build).
- 10:33 **EDIT engine/src/show/main.js:28-30** (backup engine/out/bak_v44/v44_paper/main.js.pre_v44_paper): act3.card05 t1 107.62 -> **109.03** (V1) + 2 comment
  lines. node --check OK. Test render: card 107.233-109.000, 3D from 109.033, card05 log "clip paper_0147.mp4". Nothing else in stage files touched.
  To revert: restore that backup or set t1 back to 107.62.
- 10:35 Upscale done (media/gen/v44_05_a1_up_062b84422a.mp4, 1922x1080, 89 frames, aligned: mouth corr .987 at shift 0). Slots built from it:
  media/cutscenes/paper_0147/paper_0147_v44_shift{-2,+0,+2,+4,+6,+8}.mp4 (`pb_slot.py UP 106.891667 (0.03-K/30) 107.15 110.4167`, 98 frames, same time base as before).
  **INSTALLED paper_0147.mp4 = _v44_shift+0** (measured on time, like card 04 which Jade set to +0); paper_0147_lanczos480.mp4 = lanczos +0.
  Canon at 1080p (canon_up.jpg, hand_strip.jpg): pass; the patch text is garbled ("145? MHz"), legibility optional per canon. Her hand reaches for the mic
  ~108.62 and holds it from ~108.88: V1 (card to 109.00) shows only the reach, V2 (to 109.60) shows her singing 我的 with the mic in hand -> V2 reads better.
- 10:36 RUNNING media/cutscenes/_work/v44/c05/render_vars.sh (log render_vars.log): p05_V1_..._shift+0, then V2 x shifts +0,-2,+2,+4,+6,+8 into
  engine/out/review/v44/v44_paper/. It TEMPORARILY flips main.js:30 t1 109.03 -> 109.62 and restores it (trap on exit) + reinstalls shift+0.
  IF INTERRUPTED: check main.js:30 says t1: 109.03 and paper_0147.mp4 == paper_0147_v44_shift+0.mp4.
  Reference: p05_ref_v4.3.mp4 (cut from full_v4.3.mp4, 105-111.5).
