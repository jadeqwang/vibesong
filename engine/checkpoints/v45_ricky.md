# v4.5 · unit v45_ricky · outro take B: keep body language, make Ricky look like himself — STARTED 2026-10-19 ~12:00

Jade: "the body language of outro take B is good, but Ricky needs to look more like himself (see photos and character sheet)".
Owns: engine/src/scenes/act5/spread.js (LIVES + own LIVE entry), media/act5/**, tools/cutscenes/pb_spread45*.py. Cap $20.

## State
- Backup: engine/out/bak_v45/v45_ricky/spread.js.start (LIVE = LIVES.v44b1, CAMV 'page', :71).
- Spend: see latest step. In flight: see step 4.

## Steps
1. Diagnosis — in progress
1. **Diagnosis — DONE (12:15).** Take B Ricky (frames media/act5/frames/spreadR_v44b1, 11 crops 186.8-194.9) vs card 05 still/video,
   bridge cutscene ricky_play_bridge_1, inputs/ricky-anime.png, assets/sheets/paper/paper_expr_ricky.png (+ the band photo inputs/rna_band*.png, looked at only, never sent).
   Take B Ricky differs in:
   - HAIR: smooth rounded bowl/mushroom cut, heavy straight fringe down to the brows, helmet silhouette. Canon: short textured black hair,
     tousled/slightly spiky on top, short at the sides, forehead partly visible (photo: very short cropped hair).
   - FACE: rounder/fuller cheeks, tanned orange-brown skin, narrow squinting eyes, broad nose -> reads older/heavier/generic.
     Canon: slim oval face, defined narrow jaw, fair skin (same tone as Jade/Charlie), gentle almond eyes, slender neck. No glasses anywhere.
   - SHIRT: SHORT sleeves, saturated mid-blue bold stripes. Canon: LONG-sleeved white shirt with thin pale blue-grey stripes, sleeves rolled
     to the forearm, open collar, chest pocket.
   - GUITAR: 3-tone SUNBURST Strat, dark-brown leather strap. Canon: NATURAL light-wood (blonde) Strat, white pickguard, rosewood board, NAVY strap.
   - BUILD: chunky muscular forearms/upper arms vs slender.
   - Age: both read early-mid twenties; fine. Body language (head turned to Jade, picking, small bobs) is what Jade likes: keep.
   Refs built (drawings only): media/act5/_work/v45/ref_ricky_cards.jpg (card 05 + bridge), ref_ricky_sheet.jpg (expr sheet + ricky-anime).
2. **Fix plan.** (i) NBP edit of the Ricky crop of still_b1g1 -> pasted back (Ricky-only mask) -> new first frame.
   (ii) PRIMARY = Runway Aleph-2 video edit of take B itself with the fixed frame as keyframe 0 (keeps take B's motion and Jade's lips
   exactly), then composite ONLY Ricky's region back onto take B. ($0.336/s x 9 = ~$3.0)
   (iii) FALLBACK = Seedance 2.5 re-run with take B's exact prompt/audio from the new first frame (motion will differ; $2.08 each).
3. **Fixed still — DONE (12:35).** NBP edit of the Ricky crop (x1488-2528 y200-1500 of still_b1g1), refs = ref_ricky_cards.jpg + ref_ricky_sheet.jpg,
   prompt media/act5/_work/v45/p_ricky.txt; edit_r1 (chosen: gaze to Jade kept) / edit_r2. 2 x $0.1344.
   NEW tools/cutscenes/pb_spread45_ricky.py (ECC-align + Ricky-only mask, Jade sleeve/hand excluded) -> still_r1.png;
   pb_spread44_still.py still_r1 -> rect_r1.png, ff_r1.jpg (1920x1080 first frame). NEW tools/cutscenes/pb_spread45_key.py -> key_r1_f0.jpg
   (take B's own frame 0 at 720p with the new Ricky warped in) = Aleph keyframe.
4. **Gens in flight (12:38)** (collect: `$PY tools/gen/gen.py wait <id>`, PY=~/Documents/1-music-shipped/moongazing/.venv/bin/python):
   - vibesong/v45_ricky_aleph_k1-ca0e4ba85f  runwayml/aleph-2 edit of take B, keyframe 0 = key_r1_f0.jpg ($3.04) [spec media/gen/specs/v45_ricky_aleph_k1.json]
   - Seedance 2.5 re-run of take B's exact prompt+audio from ff_r1.jpg (spec v45_spread_sd25_720p_br1.json, NEW tools/cutscenes/pb_spread45_specs.py) ($2.08)
   Spend so far: $0.27 NBP + $3.04 + $2.08 = $5.39 / $20.
5. **12:50 results.** Aleph-2: provider error "2047 Invalid User Credentials" (not billed; Runway unusable on this account today).
   pruna/p-video-replace x3 (pvr1-3): "7003 User Input Error" every time (also with an audio track muxed in; not billed). Dropped.
   Seedance re-run br1 DONE: media/gen/v45_spread_sd25_720p_br1_6d877334c0.mp4 — Ricky on canon all 9 s, but it is a NEW performance
   (motion differs from take B). Kept as the fallback.
   Submitted Seedance 2.5 VIDEO-EDIT of take B (reference_videos = take B, refs key_r1_f0.jpg + id_ricky_r1.jpg; spec
   media/gen/specs/v45_ricky_sdedit_720p_1.json; ~$8.75 at 720p video-input rate). Plan: composite only Ricky's region onto take B.
   Spend: $0.27 + $2.08 (br1) + ~$8.75 (edit) = ~$11.10 / $20 (Aleph/pruna errors unbilled).
6. **13:10 video-input route is closed on this gateway.** Seedance video-edit (sdedit_720p_1: "Invalid Content-Length" at 9 MB body;
   sdedit_720p_2 with a 1.1 MB crf22 re-encode: "Bad Request") and pruna p-video-replace (pvr1-4) all fail fast with 7003 = video data URIs
   are not accepted (would need an https URL; not hosting Jade's video publicly without asking). All unbilled ("errored").
   NEW PLAN = hybrid: take B frames for Jade, Charlie and everything left of Jade's sleeve; Ricky's region from a Seedance re-run that
   starts from ff_r1 (same still except Ricky) -> per-frame seam along take B's Jade sleeve outline. Takes: br1 (exact take-B prompt),
   bk2 (in flight: same prompt + "Ricky keeps looking at Jade", like take B's Ricky) vibesong/v45_spread_sd25_720p_bk2-acad6507f0.
   Spend: $0.27 + $2.08 + $2.08 = $4.43 / $20.
7. **13:00 DONE — hybrid installed. SAFE POINT (nothing in flight).**
   - NEW tools/cutscenes/pb_spread45_hybrid.py (OSPY): take B frames everywhere left of Jade's sleeve; Ricky clip (ECC-aligned,
     colour-fitted on background) right of it. Seam = Jade's sleeve outline (frame-0 polyline, snapped + quadratic fit) tracked per frame
     by chained ECC (euclidean, arm mask) in BOTH clips; cut at the right-most of the two; take B's outer sleeve band is stretched to it
     where the re-run's Jade sits further right (no ghost sleeve / double patch); sky line x=800 above the shoulder (22 px feather);
     take B's resting hand kept. Outputs media/act5/_work/v45/hyb_{bk2,br1}.mp4 (720p 24 fps).
   - Conformed like v44: pb_spread44_frames.py -> pb_spread44_match.py -> pb_spread44_tex.py (lag 0) =>
     media/act5/frames/spreadR_v45r1 (= hyb_bk2), spreadR_v45r2 (= hyb_br1), media/act5/tex/spread_{full,half}_spreadR_v45r{1,2}.jpg.
   - engine/src/scenes/act5/spread.js:70-75 new LIVES v45r1/v45r2; :77 take-B line kept as a comment; :78 LIVE = LIVES.v45r1 ('page').
     node --check OK. Backup of the start state: engine/out/bak_v45/v45_ricky/spread.js.start.
   - Clips (540p, audio, song 184-196) engine/out/review/v45/v45_ricky/: spread_takeB_v44b1.mp4, spread_v45r1.mp4 (live), spread_v45r2.mp4;
     ricky_face_sheet.jpg (old / r1 / r2 / reference cards + sheets). Re-render: `bash engine/out/review/v45/v45_ricky/render_variant.sh <v44b1|v45r1|v45r2>`
     (resets LIVE to v45r1 after).
   - Audit: Jade = take B pixels (pencils X, blue+pink caps up, headphones on neck, chest dot her left; eyes close together, no winks).
     Charlie = take B (beige cap on). Ricky on model all 9 s in both (hair, face, long rolled sleeves, natural Strat, navy strap, no glasses).
     PRE-EXISTING in take B, not changed: Jade's sleeve patch is a rectangular label with garbled letters, not the round b/w 1420 MHz patch.
   - Spend: NBP 2 x $0.1344 + Seedance br1 $2.0808 + bk2 $2.0808 = **$4.43** of $20 (Aleph / pruna / Seedance video-edit errors unbilled; all in genlog).
   - Not done (same as v44): 1080 frames are lanczos from 720p (no flux upscale), lag left at 0 (take B's timing is untouched).
