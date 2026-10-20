# v47_trio checkpoint (2026-10-19, started evening)
Brief: docs/v47_brief.md (row v47_trio). Tasks: A = card 05 at 1:47 (act3.card05 107.23-109.62, media/cutscenes/paper_0147) re-animated, all three more excited;
B = 2:07 act4.paper_jade_sing (125.769-128.18, act4/paper.js CLIPS.jade_sing) lip sync slightly off -> measure + timing variants.
Clips engine/out/review/v47/v47_trio/. Backups engine/out/bak_v47/v47_trio/. Gens in media/genlog.jsonl. Cap $15.

## STATE (22:20): DONE, SAFE, idle. No gens or renders running. Shadow tree engine_v47trio deleted. Spend ~$2.61 of $15.
INSTALLED (switch defaults): card05.js:21 CARD05_V47 = 'b2up_shift+0' (Seedance take b2, 1080 upscale, +0); paper.js:17 JADE_SING_V47 = '+3'.
Fallbacks: null on either = v4.6 (card 05 take v44 a1 = paper_0147.mp4; 2:07 card fallback_card_480p_portrait_adv0.10_v11_up.mp4). Backups engine/out/bak_v47/v47_trio/{card05,paper}.js.start.
Clips (540p + audio, engine/out/review/v47/v47_trio/):
  1:47 c05_147_<V>.mp4 (105.6-110.8): v46 | b2_shift+{0,2,4,6} (REC) | a1_shift+{0,2,4,6} | b1_shift+0 | a2_shift+0; c05_147_INSTALLED_b2up+0.mp4 (real tree check).
  2:07 js207_shift{v46,-4,-2,+0,+2,+3,+4,+6}.mp4 (124.0-129.4), js207_loop_shift*.mp4 (125.7-128.3 x3), js207_INSTALLED+3.mp4.
Checks: installed renders exit 0, no page errors, cuts unchanged (107.233 / 109.633 / 110.467; 125.800 / 128.200); 2:07 installed = exactly +3 vs the v4.6 render.
If Jade picks another card-05 take: upscale it (seg = take frames 0..89 like _work/v47/upscale/seg_05_v47b2.mp4, spec v47_05_b2_up.json, ~$0.55), pb_slot with lag
(a1 -0.08, b1 -0.08, a2 +0.08, b2 +0.03) - K/30, name paper_0147_v47_<take>up_shift+K.mp4, set CARD05_V47. Lanczos slots already exist for review.
Open: b2 sleeve patch rides the top edge of the band (oval, gibberish) from ~108.4 while her arm reaches; a1 has a model-made cut at 108.89 to a Charlie+Ricky two-shot.

## Log
- Task A gens SUBMITTED: 2 x Seedance 2.5 480p 5 s ($0.514 each), builder NEW tools/cutscenes/pb_trio47_specs.py (var a static cam, b slow push),
  specs media/gen/specs/v47_05_sd25_{a1,b1}.json, first frame media/cutscenes/_work/passB/c05/ff_v2.jpg (approved still), ref vocal stem
  media/cutscenes/_work/v44/c05/voc05_106.85_5s.mp3 (S0 = 106.85, same as v4.4 a1). Jobs vibesong/v47_05_sd25_a1-4ee88709d9, _b1-3130db4302.
  Background `gen.py wait` -> media/cutscenes/_work/v47/c05/wait.log. If it died: `~/Documents/1-music-shipped/moongazing/.venv/bin/python tools/gen/gen.py collect`.
  Prompt note: Seedance 2.5 prompt maxLength 2000. Only clip 0.38-2.77 s is on screen (世界 是我的), so moves are tied to 'shi jie' / 'shi wo de'.
- Task A takes back (media/gen/v47_05_sd25_{a1_4ee88709d9,b1_3130db4302}.mp4). Template lag (pb_tmplsync 05, window to 108.80): a1 -0.08 (r .94), b1 -0.08 (r .87); v44 a1 (installed) +0.03 (.82).
  a1: big Jade arm reach over the crowd on 世界; Seedance made its OWN CUT at clip 2.04 = song 108.89 to a Charlie+Ricky two-shot (leaning in, grinning, hat on, Ricky on model, hands on strings) -> 0.73 s of the guys before the 3D cut.
  b1: fast push (done by clip 0.38, before the card shows) to a medium three-shot, all three moving; Jade two-hands-open gesture; Charlie's face mostly under his brim.
  Canon both: bun X pink+blue caps up, ONE chest dot, patch on the band, headphones on neck. Sheets/canon: media/cutscenes/_work/v47/c05/{sheet,*_canon}.jpg
- 2 more takes SUBMITTED (a2, b2; +$1.03): vibesong/v47_05_sd25_a2-180088c9d3, _b2-e25717a54e, wait -> media/cutscenes/_work/v47/c05/wait2.log.
- Task B (2:07): measured on the installed card (stem syllable map 码 to 125.83 | 一 125.85-126.15 | b closure 126.17 | 笔 126.20-126.33 | 一 126.39-126.65 |
  h of 画 126.72-126.93 | 画 vowel 126.95-127.20 (tail to 127.36) | 都 127.39-127.73 | 是 ~127.75-128.00 | 我 128.02-). Mouth: b closure 126.17-126.34 = on time (+0/+1);
  画 opens 126.80 (inside the h, 0.15 s before the voiced vowel); envelope corr over 126.6-127.6 peaks at +4 frames (.58 vs .46 at +0). Card was built 0.10 s AHEAD (v4 pick);
  +3 = back to lag 0.00. Found: card.py overlays on a -loop image at 25 fps -> the installed card drops/repeats ~1 frame in 6 (up to 1 frame jitter).
  NEW tools/cutscenes/js47_shift.py K OUT (same -ss 0.184 slot phase as installed, bg at 30 fps; shifts verified exact by frame matching).
  Variants media/cutscenes/jade_sing_bridge_1/fallback_card_v47_shift{-4,-2,+0,+2,+3,+4,+6}.mp4.
  **EDIT engine/src/scenes/act4/paper.js:19 `const JADE_SING_V47 = null`** (+ CLIPS.jade_sing picks the file; null = v4.6 card). Backup engine/out/bak_v47/v47_trio/paper.js.start (+ card05.js.start).
  Renders from a SHADOW tree /home/jade/Documents/vibesong/engine_v47trio (symlinks to engine/, private copies of act4/paper.js + act3/card05.js; the real files are never flipped).
  DELETE the shadow dir when done. Running: media/cutscenes/_work/v47/js/render_vars.sh (log render_vars.log) -> engine/out/review/v47/v47_trio/js207_shift{v46,-4,...,+6}.mp4 (124.0-129.4).
- **EDIT engine/src/scenes/act3/card05.js:18-22 `const CARD05_V47 = null`** (null = v4.4 take, fallback; '<take>_shift<K>' -> paper_0147/paper_0147_v47_<take>_shift<K>.mp4). node --check OK.
  Lanczos slots (pb_slot.py, lag -0.08 - K/30, 107.15-110.4167, 98 frames): media/cutscenes/paper_0147/paper_0147_v47_{a1,b1}_shift+{0,2,4,6}.mp4. Upscale only the pick (~$0.54).
  Queued media/cutscenes/_work/v47/c05/render_vars.sh (waits for the js renders) -> engine/out/review/v47/v47_trio/c05_147_<V>.mp4 (105.6-110.8).
- a2/b2 back. b2 (media/gen/v47_05_sd25_b2_e25717a54e.mp4) = **RECOMMENDED**: continuous push-in while Charlie + Ricky step in toward Jade grinning (hat on, Ricky on model, hands on strings), Jade reaches out over the crowd; lag +0.03 (r .93 to 108.8 / .86 full); canon pass (b2_canon.jpg; patch rides the top edge of the band on the reaching arm ~1.6 s, on it otherwise).
  a2: Jade very expressive (laugh, wink, reach late) but the guys stand still -> weakest on "all 3". Slots: paper_0147_v47_b2_shift+{0,2,4,6}.mp4 (lag 0.03-K/30), paper_0147_v47_a2_shift+0.mp4 (lag 0.08).
- Upscale SUBMITTED for b2: spec media/gen/specs/v47_05_b2_up.json (seg media/cutscenes/_work/v47/upscale/seg_05_v47b2.mp4 = take frames 0..89), job vibesong/v47_05_b2_up-b6a3c05268, ~$0.55 hand-logged; wait -> _work/v47/upscale/wait.log.
- Spend so far: 4 x Seedance $2.06 + upscale ~$0.55 = ~$2.61 of $15.
- Renders queue 2: c05/render_vars.sh -> render_vars2.log (b2 x4, a1 +2/+4/+6, a2 +0). Done: c05_147_{v46,a1_shift+0,b1_shift+0}.mp4.
- b2 upscale back (media/gen/v47_05_b2_up_b6a3c05268.mp4, 1922x1080, 89 frames; pb_upalign corr .98 at shift 0). 1080 slots media/cutscenes/paper_0147/paper_0147_v47_b2up_shift+{0,2,4,6}.mp4.
  Canon at 1080: patch round + ON the band to ~108.2; from ~108.4 (arm reaching toward camera, foreshortened) it rides the TOP EDGE of the band, oval, gibberish text -> flag, not fixed.
- 2:07 template fit (my stem map): peak K-1..+0 (r .84) if the h of 画 counts as open, K+3..+4 (r .81-.82) if not; 画's wide opening at +0 is 0.15 s before the voiced vowel
  -> **recommend +3** (= the Pass B measured lag 0.00); b closure is then ~2-3 frames late (small event). Jade decides by ear.
- **DEFAULTS SET (real files):** card05.js:21 CARD05_V47 = 'b2up_shift+0'; paper.js:17 JADE_SING_V47 = '+3'. null on either = v4.6 fallback. Coordinator told at report.
- 2:07 clips done: engine/out/review/v47/v47_trio/js207_shift{v46,-4,-2,+0,+2,+3,+4,+6}.mp4 (124.0-129.4) + js207_loop_shift*.mp4 (125.7-128.3 x3); verified each render carries exactly its shift.

## Patch fix (coordinator request, cap $3; spent $0)
- Reused v47_outro's asset + method: inputs/sleeve_patch_1420MHz.png and pb_spread47_jacket.py patch_layer's shading (light = local jacket white, dark = pencil
  near-black (42,38,48), frame grain x0.6, 0.45 px soften), so the patch matches the outro. No new asset needed (nothing made in assets/v4_stills/tools/v47_trio/).
- NEW tools/cutscenes/pb_trio47_patch.py UP OUT [--last=84] [--scale=1.25] [--nudge=0] [--debug=DIR]: per frame the drawn label's ring INNER edge = fitEllipse of the
  convex hull of the enclosed bright holes (survives the text), tracked frame to frame (85/85 detected), smoothed as the shape matrix Q (no axis flip as the oval turns),
  asset warped by sqrt(Q) x 1.25 (its black ring at 0.80-0.90 R lands on the old ring, covers it fully: no erase needed). Frames 85-88 untouched (a hand covers the
  arm; past the 109.62 cut at every shift).
- Nudge toward the band centre REJECTED (tried 0.5): uncovering the old label needs an erase, and the old label sits on the arm's outline, so both Telea and a
  white fill wipe the outline (white bump into the background). Position = the take's own label: across the band's middle to ~108.2; in the reach a foreshortened
  oval whose lower part overlaps the band's top edge.
- Patched upscale media/cutscenes/_work/v47/patch/up_patch_n0.mp4 (89 frames, 24 fps) -> slots media/cutscenes/paper_0147/paper_0147_v47_b2fix_shift+{0,2,4,6}.mp4.
- **card05.js:21 CARD05_V47 = 'b2fix_shift+0'** (b2up_shift+0 = same take without the fix). Re-rendered engine/out/review/v47/v47_trio/c05_147_INSTALLED_b2up+0.mp4
  (name kept as asked; it now shows b2fix, exit 0, clip line b2fix_shift+0). Crops engine/out/review/v47/v47_trio/patch_before_after_3x.jpg (107.3 / 108.4 / 109.2:
  1080 before | 1080 after | 540p render x3).
- Note: the review clips c05_147_b2_shift+{0,2,4,6}.mp4 still show the OLD gibberish label (lanczos 480p slots); re-render from b2fix if the page needs them.
