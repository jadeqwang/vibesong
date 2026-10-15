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
