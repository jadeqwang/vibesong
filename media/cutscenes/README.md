# Bridge PAPER cutscenes (Act IV) — drop-in clips for Team C

All clips are H.264, 30 fps, no audio, with the frame count equal to the slot length. Play them with
`VideoClip.load('/media/cutscenes/<slot>/<slot>.mp4')` and `textureAt(t - in)` (core/video.js, R-C1). Frame = round((t - in) * 30).
Do not retime them: in/out below already include the chosen lip-lag offset.

| slot id | clip | in → out (song s) | frames | source take | lag offset |
|---|---|---|---|---|---|
| jade_sing_bridge_1 | `jade_sing_bridge_1/jade_sing_bridge_1.mp4` (608×1080) | 125.769 → 128.180 | 72 | Seedance 2.5 `media/gen/cut_jsing_centre_t2_52c49390c2.mp4` | 0.00 s (clip 0.209–2.62 s) |
| **charlie_play_bridge_1** (replaces listen) | `charlie_play_bridge_1/charlie_play_bridge_1.mp4` | 128.180 → 129.385 | 36 | Veo 3.1 `media/gen/cut_charlie_play_t1_5a7a04498b.mp4`, from 0.792 s | strums on the 3 beats |
| **ricky_play_bridge_1** (replaces listen) | `ricky_play_bridge_1/ricky_play_bridge_1.mp4` | 128.180 → 129.385 | 36 | Veo 3.1 `media/gen/cut_ricky_play_t1_f59c19cc59.mp4`, from 1.667 s | picks on the 3 beats |
| charlie_listen_bridge_1 | `charlie_listen_bridge_1/charlie_listen_bridge_1.mp4` | 128.180 → 129.385 | 36 | Veo 3.1 `media/gen/cut_charlie_listen_t2_9f9ea71ab7.mp4`, from 2.79 s | n/a (silent) |
| ricky_listen_bridge_1 | `ricky_listen_bridge_1/ricky_listen_bridge_1.mp4` | 128.180 → 129.385 | 36 | Veo 3.1 `media/gen/cut_ricky_listen_t2_767e7bce8c.mp4`, from 2.60 s | n/a (silent) |

Charlie/Ricky are 1920×1080 with the character near the centre: for the split frame crop the centre ~50 % (x 480–1440);
Ricky's face sits a little left of centre (~0.45). `*_full_from0.8s.mp4` are the whole takes minus Veo's 0.8 s ease-in
(3.2 s) if you want to choose a different 1.2 s window. Both have closed-mouth small smiles in the chosen windows (take 1 of
each opened its mouth like singing and was rejected).

## Jade: chosen take, lag and options
**Chosen take: `media/gen/cut_jsing_centre_t2_52c49390c2.mp4`** (Seedance 2.5, 480p; it came back PORTRAIT 480×854 although
16:9 was requested). It is the only take whose mouth follows the line: lips close on the b of 笔, open wide on 画, round on 都/我
(word strip `_work/ws_centre_t2_*.jpg`), and its face is the closest to the v9 sheet (`_work/facecmp_t2.jpg`).
- `jade_sing_bridge_1.mp4` = lag **0.00 s** (608×1080 portrait, upscaled from 480 wide: soft; frame it as a card, e.g. the
  slot's h 0.74 frame, or pillarbox). Same slot with lag −0.15 / +0.15: `jade_sing_bridge_1_centre_t2_lag-0.15.mp4`, `…_lag0.15.mp4`.
- Pick by ear: `jade_sing_bridge_1_lag_options_centre_t2.mp4` (A −0.15 | B 0.00 | C +0.15, song audio, slot = 0.6–3.01 s).
- 16:9 720p alternative (weaker sync, mouth small on 一笔一画): `alt_jade_sing_bridge_1_720p_t3_lag0.50.mp4` from
  `media/gen/cut_jsing_centre_720_t3_38d8adc73b.mp4`, options `alt_lag_options_720p_t3.mp4` (0.35 / 0.50 / 0.65).

| take | res / aspect | sync (word strip) | face vs v9 | verdict |
|---|---|---|---|---|
| centre_t1 | 480p 16:9 | ok (lag ~0.4) | narrower, doll-like; sheet went blank | reject |
| side_t1 | 480p 16:9 | ambiguous | close | reject (sync) |
| **centre_t2** | 480p **9:16** | **good at 0.0** | **closest** | **keeper** |
| side_720_t2 | 720p 16:9 | poor | narrower jaw | reject |
| side_720_t3 | 720p 9:16 | weak | ok (re-composed to centre) | reject |
| centre_720_t3 | 720p 16:9 | fair at ~0.5 | ok | 16:9 alternative |
| centre_720_t4/t5/t6 | 720p (t5 834×1112) | mouth barely moves on 一笔一画 | ok | reject |

### Round 2 (16:9 720p attempt) — result: keep the portrait keeper
- The approved plan (re-render the keeper's motion at 720p via `reference_videos`) failed with `7003 User Input Error`
  (not billed): Seedance only accepts a **public URL** there (Orbital Sunrise hosted takes on raw.githubusercontent.com).
  Not done, because it would publish Jade's likeness; needs her OK and a host. Spec ready: `media/gen/specs/cut_jsing_r720_t1.json`.
- 16:9 first frame for it = keeper frame 0 outpainted with the dusk paper (keeper pixels restored on her figure):
  `_work/r720/ff16x9_final.png`.
- Two first-frame-only 720p takes from that frame with "natural lips, no gloss, no makeup" (`cut_jsing_r720_t2/_t3`): lips now
  matte and the face stays v9 (`_work/facecmp_r720.jpg`), but like every 720p take the mouth barely moves on 一笔一画.
  Best one as an alternative: `alt_jade_sing_bridge_1_720p_r720_t2_lag0.45.mp4`, options `alt_lag_options_720p_r720_t2.mp4`
  (A 0.30 / B 0.45 / C 0.60).
- **Portrait fallback as a paper card** (cream sketchbook page, soft drop shadow, on the dusk background, 1920×1080):
  `fallback_card_480p_portrait_lag0.00.mp4` (`tools/cutscenes/card.py IN OUT` rebuilds it for another lag).

## Round 3 (2026-10-15)
**Jade's pick:** lip-sync B, lag 0.00 (`jade_sing_bridge_1.mp4`, unchanged); paper-card fallback kept.

**720p reference re-render: not run.** The temporary 1 h public upload of the keeper clip (litterbox) was denied by the
permission system, so nothing was uploaded and no URL exists. It needs Jade to allow it (or upload it herself); the spec
`media/gen/specs/cut_jsing_r720_t1.json` is ready once `reference_videos` holds a public URL.

**Charlie / Ricky now PLAY (Jade's note).** New slots `charlie_play_bridge_1`, `ricky_play_bridge_1` (128.180–129.385,
36 frames @30). The old `*_listen_bridge_1` clips are kept; `engine/src/scenes/act4/paper.js` already prefers the play clips.
- First frames: nano-banana-pro edits of waist-up crops of the v9 `paper_lineup.png` (guitar in playing position, dusk like
  ff_charlie1/ff_ricky1): `_work/play/ff_charlie_play1.jpg`, `ff_ricky_play1.jpg` (`tools/cutscenes/ff_play.py`).
- Veo 3.1, 1080p, 4 s, first frame only, silent; 2 takes each. Window chosen so the strumming-hand motion peaks land on the
  slot's beats 128.180 / 128.582 / 128.985 (149 BPM; `tools/cutscenes/strum_window.py`, hand/face strips `_work/play/hs_*.jpg`).

| take | window | strum peaks vs beats | hands | face | verdict |
|---|---|---|---|---|---|
| charlie t1 | 0.792–2.00 s | on beat (score 1.33) | strumming at the sound hole, chord hand plausible | smiling, looks up, on-model | **chosen** |
| charlie t2 | 2.00–3.21 s | on beat (1.44) | plausible | head bowed, eyes closed | alt `alt_charlie_play_t2_from2.00s.mp4` |
| ricky t1 | 1.667–2.87 s | on beat (1.70, best) | picking between pickups, fretting plausible | looks down at the guitar, on-model | **chosen** |
| ricky t2 | 2.292–3.50 s | on beat (1.25) | plausible | eyes closed, small smile | alt `alt_ricky_play_t2_from2.29s.mp4` |

`*_full_from0.8s.mp4` = whole takes minus Veo's ease-in, if another 1.2 s window is wanted. Review: `review_bridge.mp4`
(Jade as the paper card, then Charlie | Ricky playing, with the song) and `review_bridge_sheet.jpg`.

**Other places where Charlie/Ricky only listen or sit (candidates to turn into playing):**
- `docs/script.md` line 153, 125.86 bridge: "Charlie and Ricky in PAPER style, listening" (this slot, now playing).
- `docs/script.md` line 201, 186.70 outro "Everything I love about life just blossoms": the three sit together on the 一 stroke
  "instruments in hand" — could be them playing softly (Charlie strumming, Ricky picking) in the 2011 jam redraw.
- `engine/src/scenes/act4/paper.js` slot notes/placeholder stills still say "listens, silent reaction" (Team C's text).
No other listen-only moments for them in the script or the engine checkpoints.

Round 3 spend (list): first frames $0.27, Veo 4 × $0.80 = $3.20; total $3.47.

Timing convention: clip time = song time − 125.56 + lag (the audio reference is the song from 125.56 s, 0.3 s before 一 at 125.86).
Jade-facing pick-by-ear file: `jade_sing_bridge_1/jade_sing_bridge_1_lag_options*.mp4` (three offsets side by side, with the song).

## How they were made
- First frames: nano-banana-pro edits that start from the v9 paper sheets (front panel of `paper_expr_jade.png`; Charlie/Ricky
  from `paper_lineup.png`), dusk sky painted around them. The code on the back of Jade's sheet is drawn in code
  (`tools/cutscenes/code_ghost.py`, mirrored, faint), never by a model. Files: `_work/ff/ff_centre_final.png`, `ff_side_final.png`,
  `ff_charlie1.png`, `ff_ricky1.png`.
- Jade: Seedance 2.5, `generate_audio:false`, `use_virtual_avatar:true`, audio ref = song slice 125.56 + 6 s
  (`_work/audio/bridge1_125.56_6s.mp3`), 6 s. Specs `media/gen/specs/cut_jsing_*.json`; prompt builder `tools/cutscenes/sd_specs.py`.
- Charlie/Ricky: Veo 3.1 1080p 4 s, first frame only, silent. Specs `media/gen/specs/cut_{charlie,ricky}_listen_t2.json`.
- Measurement: `tools/cutscenes/lipsync.py` (mouth vs vocal-stem envelope), `wordstrip.py` (mouth crops at each syllable for
  candidate lags — the more reliable check here), `facemeasure.py` / `facecmp.py` (head scale and side-by-side vs the v9 face),
  `mouth_curve.py` (closed-mouth windows for the silent shots). Finishing: `tools/cutscenes/compose.py`.
- Review: `review_bridge.mp4` (125.769–129.385 with the song) and `review_bridge_sheet.jpg`.

## v4 Pass B (2026-10-18, paper unit): paper close-up cards 03 / 04 / 05 / 06 + v11 brows on the bridge card
Slot-exact like the bridge clips: 1920x1080, 30 fps, no audio, frame k = song time IN + k/30, each take's own measured
lip-sync offset baked in (`tools/cutscenes/pb_slot.py TAKE S0 LAG IN OUT OUT.mp4`; clip t = song t - S0 + LAG).
Played by `engine/src/scenes/paper_inserts.js` (show/main.js `paper` block); a missing clip falls back to `still.png` in the same folder.
`preview_540p_with_song.mp4` = the card with the song, for checking by ear.

| card | clip | in -> out (song s) | frames | take (media/gen/) | S0 / ref audio | lag | measured how |
|---|---|---|---|---|---|---|---|
| 03 | `paper_0020/paper_0020.mp4` | 20.1667 -> 23.7667 | 108 | `pB_03_sd25_t4_e221f483d2.mp4` + chest fix | 20.00 / vocal stem | +0.08 | "m" closure of "my" (20.25) -> vowel 20.30; envelope correlation is unusable on this legato, doubled line (all four takes 0.15-0.18) |
| 04 | `paper_0048/paper_0048.mp4` | 48.5667 -> 50.6667 | 63 | `pB_04_sd25_t2_856fd120c0.mp4` | 48.30 / vocal stem | +0.10 | mouth vs vocal-stem envelope, corr 0.665 (residual on the slot clip 0.00, 0.68) |
| 05 | `paper_0147/paper_0147.mp4` | 107.15 -> 110.41 | 98 | `pB_05_sd25_t1_f9b399b487.mp4` + chest fix | 106.85 / song mix | 0.00 | corr 0.631 (residual -0.04). For stage_3d: use any early part of the window |
| 06 | `paper_0223/paper_0223.mp4` | 143.400 -> 146.200 | 84 | `pB_06_sd25_t3_34190fcc37.mp4` | 143.30 / vocal stem | +0.25 | corr 0.63 (residual -0.02); first frame = the fixed #06 (assets/v4_stills/06_paper_0223_v2.png) |

Chest fix (`tools/cutscenes/pb_dotfix.py`): Seedance turned the small pale-blue chest dot into a second "1420 MHz" patch / label on
03 and 05; the approved still's chest is pasted back per frame in a feathered ellipse at the tracked torso offset.
Bake-off (first frame = the approved still): Seedance 2.5 480p with reference audio is the only model that both lip-syncs to OUR
audio and keeps the still's composition. Pruna p-video-avatar / p-video (audio-driven): re-compose to a frontal close-up, burn
garbled captions, mangle the hair pencils -> rejected on every card. Veo 3.1 / 3.1 fast (no audio input; prompted to sing the
words): keep the drawing beautifully at 1080p but sing on their own clock (best fit 04 +1.57 s corr 0.56, 06 +0.42 / +0.76 s
corr 0.29 / 0.36), move the pencil hand and blur the patch -> rejected. No @cf/ video model exists on this account.
Sync tools: `pb_sync.py` (plausible-range envelope correlation, face crop), `pb_wordstrip.py` (generalised word strip, events
"label@t"), `pb_mouth.py` (per-frame mouth curve for closure landmarks). Takes/specs: media/gen/specs/pB_0*_*.json; sheets and plots in _work/passB/.

**Bridge card with v11 brows:** `jade_sing_bridge_1/jade_sing_bridge_1_adv0.10_v11.mp4` (608x1080 slot clip, 72 frames) and
`jade_sing_bridge_1/fallback_card_480p_portrait_adv0.10_v11.mp4` (the card, 71 frames; paper.js CLIPS.jade_sing). Source take
from 0.309 s as before (+0.10 s). Brows: nano-banana-pro v11 edit of take frame 7 (`_work/passB/brows/brow_a.png`), moved onto
every frame by per-brow FaceMesh similarity tracking (5-frame smoothing) inside feathered brow masks (`tools/cutscenes/pb_browtrack.py`;
v11 take: `_work/passB/brows/take_t2_v11.mp4`). Timing check vs the old card: PSNR below the face 44.9 dB at shift 0 vs 42.6 at +-1.

**M2 update (same day):** in/out times are the beat snapped to the 30 fps frame grid (main.js uses T.snap), so the cuts land
within 3-17 ms of the grid. All four cards and the bridge card are now **flux-video-upscale "precise"** (creativity 0) versions of the
chosen 480p take segments (`_work/passB/upscale/seg_*.mp4` + `seg_*.txt` = start/duration in the take; 2.25x for the cards, 1.5x
for the bridge take with the v11 brows), then cut by `pb_slot.py` / `compose.py slot` with S0 shifted by the segment start.
Frame alignment check: mouth-curve correlation source vs upscale 0.98-0.99 at shift 0 (0.70-0.93 at +-1); line art, patch,
chest dot and pencil caps survive (engine/out/review/passB/paper/upscale_check.jpg). Lanczos versions kept as
`paper_*/paper_*_lanczos480.mp4`; bridge: `jade_sing_bridge_1/{jade_sing_bridge_1_adv0.10_v11_up.mp4, fallback_card_480p_portrait_adv0.10_v11_up.mp4}`.

## v4 Pass B M3 (2026-10-18): forehead-lifted stills 03/04/05 + card 03 word fix
Cards 03 / 04 / 05 are re-made from the forehead-lifted stills `assets/v4_stills/0{3,4,5}_*_v2.png` (approved stills untouched;
`still.png` in each folder = the v2 still, `still_v1.png` = the old one). The old clips are kept as `paper_*_v1.mp4`,
`paper_*_lanczos480_v1.mp4`, `preview_540p_with_song_v1.mp4`. Same names / time bases as before (frame k = IN + k/30).

| card | take (media/gen/) | S0 / ref | lag | residual on the slot clip |
|---|---|---|---|---|
| 03 `paper_0020` 20.1667-23.7667 | `pB_03_v2_sd25_t2_fe81629249.mp4` -> `pB_03_v2_upscale_t1_ace7e17f23.mp4` (seg 0.375+3.6667) | 20.10 / vocal stem, words start at "because" | +0.32 | my: lips closed 21.033-21.167, open 21.200 (stem vowel 21.20) = 0.00; imagination m: closed 21.500-21.633, open 21.667 (stem 21.50-21.63 / 21.65) = +0.02 |
| 04 `paper_0048` 48.5667-50.6667 | `pB_04_v2_sd25_t2_913c8792a9.mp4` -> `pB_04_v2_upscale_t1_3be006494f.mp4` (seg 0.2917+2.2083) | 48.30 / vocal stem | +0.04 | envelope +0.008 s (corr 0.72); "myself" m closed 49.767-49.800 |
| 05 `paper_0147` 107.15-110.41 | `pB_05_v2_sd25_t2_6e16402853.mp4` -> `pB_05_v2_upscale_t2_f2bdf14707.mp4` (seg 0.2917+3.375) | 106.85 / vocal stem | +0.008 | envelope +0.008 s (corr 0.67); no blink in stage_3d's 107.233-107.600 slice (t1 blinked there) |

Card 03 word fix: the stem sings "just blossoms" held to ~20.08, then **because** 20.13 (b) / "cause" vowel 20.40-20.95 / z 21.00-21.15,
**my** 21.16 (m) vowel 21.20, **imagination** 21.42 (i), m 21.50-21.63. The v1 card synced its "m" to the /k/ of "because" (20.27),
a whole word early. Evidence + listening windows: `_work/passB/m3/words/` (spectrograms, `listen_*.wav`).
`pb_slot.py` is now frame-exact (setpts + fps from 0; an input `-ss` used to snap up to one frame early).
Stills: `tools/cutscenes/pb_liftcomp.py` (configs `_work/passB/m3/s0X/lift.json`). Previews: `tools/cutscenes/pb_preview.py`
(`paper_0020/preview_540p_with_song_context.mp4` = the same with 1 s of song either side, picture held).

## v4.3 (2026-10-19): cards 03 / 04 re-animated with singer body motion
`paper_0020/paper_0020.mp4` and `paper_0048/paper_0048.mp4` are now the v4.3 takes (Seedance 2.5 c4 / c2, flux upscale), at the +6 timing.
The other timings are `paper_00XX_v43_shift{-2,+0,+2,+4,+6,+8}.mp4` (same time base: frame k = card t0 + k/30). Card 03's still is v3 (chest dot on her left).
The v4.2 files are backed up in engine/out/bak_v4b/paper/v43/. Details: engine/checkpoints/passB_paper.md "## v4.3".
