# Cutscenes unit checkpoint (bridge PAPER slots) — updated after every step/submit

## Done
- STEP 0: v9 installed. assets/sheets/paper/{paper_jade_turnaround,paper_expr_jade,paper_lineup}.png = v6/*_v9.png;
  turnaround_2x regenerated; party_paper_sheet.png rebuilt; v5 kept in assets/sheets/paper/old_v5/; NOTES.md updated.

## In progress
- STEP 1 DONE: first frames media/cutscenes/_work/ff/ff_centre_final.png (from ff_C1, sheet centred) and ff_side_final.png
  (from ff_A2, sheet held up beside her); both = nano edit of the v9 front panel + procedural mirrored code ghost
  (tools/cutscenes/code_ghost.py). Head-scale vs v9 (MediaPipe): centre face h 0.961 / eye 0.988; side 0.973 / 0.996.
  Rejected: ff_A1 (garbled model text, small headphones), ff_B1/B2 (3/4 sing panel -> head shrunk/redrawn), ff_A1fix (headphones over sheet).
  Charlie/Ricky ff: ff_charlie1.png, ff_ricky1.png.
- STEP 2/3 submitted (see Paid jobs). Collect: $PY tools/gen/gen.py wait <ids>  (PY = moongazing venv python)
  then lag: $OSPY tools/cutscenes/lipsync.py media/gen/<file>.mp4 125.56 --win=125.769,128.18 (OSPY = orbital venv python)

## Next steps
1. Collect the 4 jobs; check Jade takes vs v9 face; measure lag; pick better first frame.
2. 720p keeper (1-2 takes) of the better composition; measure lag; 3-offset composite.
3. Trim Veo ease-in (~0.8 s), conform all to 30 fps -> media/cutscenes/<slot>/, README.md, review_bridge.mp4 + contact sheet.

## Paid jobs (spec path / job id / status)
- media/gen/specs/cut_jsing_centre_t1.json  vibesong/cut_jsing_centre_t1-f30a481f58  submitted (Seedance 2.5 480p 6s, $0.62)
- media/gen/specs/cut_jsing_side_t1.json    vibesong/cut_jsing_side_t1-f5c827f08b    submitted (Seedance 2.5 480p 6s, $0.62)
- media/gen/specs/cut_charlie_listen_t1.json vibesong/cut_charlie_listen_t1-e09c3322a6 submitted (Veo 3.1 1080p 4s, $0.80)
- media/gen/specs/cut_ricky_listen_t1.json  vibesong/cut_ricky_listen_t1-6e8a4005e0   submitted (Veo 3.1 1080p 4s, $0.80)
- images (sync, logged in media/genlog.jsonl, tags cut_ff_jade / cut_ff_band): 9 nano-banana-pro calls ~$1.21
- media/gen/specs/cut_jsing_centre_t2.json  (prompt v2: keep the sheet drawing) submitted — vibesong/cut_jsing_centre_t2-52c49390c2
- media/gen/specs/cut_charlie_listen_t2.json vibesong/cut_charlie_listen_t2-9f9ea71ab7 submitted (t1 mouths opened = looked like singing)
- media/gen/specs/cut_ricky_listen_t2.json  vibesong/cut_ricky_listen_t2-767e7bce8c submitted
Collected: cut_jsing_centre_t1 (sheet went blank, face redrawn a bit doll-like; lag +0.375 s corr .47), cut_charlie/ricky_listen_t1 (mouths open, fallback windows charlie 1.58 s, ricky 2.63 s)
- media/gen/specs/cut_jsing_side_720_t2.json vibesong/cut_jsing_side_720_t2-f6e0a09587 submitted (720p keeper, $1.39)
- media/gen/specs/cut_jsing_side_720_t3.json vibesong/cut_jsing_side_720_t3-d17aa502a9 submitted (720p keeper, $1.39)
Collected: cut_jsing_side_t1 (sheet drawing kept, face closer to v9 than centre; lag +0.417 s corr .23). Decision: side composition = keeper.
Collect all pending: $PY tools/gen/gen.py wait vibesong/cut_jsing_centre_t2-52c49390c2 vibesong/cut_charlie_listen_t2-9f9ea71ab7 vibesong/cut_ricky_listen_t2-767e7bce8c vibesong/cut_jsing_side_720_t2-f6e0a09587 vibesong/cut_jsing_side_720_t3-d17aa502a9
- media/gen/specs/cut_jsing_centre_720_t3.json vibesong/cut_jsing_centre_720_t3-38d8adc73b submitted (720p centre keeper, $1.39)
- media/gen/specs/cut_jsing_centre_720_t4.json vibesong/cut_jsing_centre_720_t4-bbcd58e81b submitted (720p centre keeper, $1.39)
Collected (all of the above done). Findings: centre_t2 (480p, came back PORTRAIT 480x854) has the best sync at lag ~0.0 (word strip
media/cutscenes/_work/ws_centre_t2_*.jpg) and the face closest to v9; side_720_t2 (16:9) sync poor at any lag; side_720_t3 came back
portrait + re-composed to a centred sheet, weak mouth. Veo t2: mouths closed; Ricky usable anywhere after 0.8 s, Charlie window 2.79-4.0 s.
Now waiting on centre_720_t3/t4. Then: pick keeper, lag options, conform, README, review.
- vibesong/cut_jsing_centre_720_t5-ea26d9ffa9 submitted (720p centre keeper retry, $1.39)
- vibesong/cut_jsing_centre_720_t6-9400f52d7b submitted (720p centre keeper retry, $1.39)
centre_720_t3/t4 collected: 16:9 OK, sync weak (t3 fair at lag ~0.45-0.6). Building deliverables from current best while t5/t6 run.

## STATUS 2026-10-14 ~23:40: ALL STEPS DONE. No jobs pending (t5/t6 collected). Deliverables + README.md written; review_bridge.mp4 + sheet built.
Cutscene spend (list): images $1.08, Seedance $11.97, Veo $3.20 = $16.25.

## Round 2 (coordinator-approved): 720p 16:9 re-render of the keeper's motion
- First frame: keeper frame 0 outpainted to 16:9 (nano, tag cut_ff_jade, $0.13), keeper pixels restored on the figure only
  (tools/cutscenes/ff_outpaint16.py + ff_outpaint16_mask.py) -> media/cutscenes/_work/r720/ff16x9_final.png
- media/gen/specs/cut_jsing_r720_t1.json  vibesong/cut_jsing_r720_t1-f2faed81a0  submitted (Seedance 2.5 720p 16:9, reference_videos = centre_t2, est $5.81)
- Next: collect (/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python tools/gen/gen.py wait vibesong/cut_jsing_r720_t1-f2faed81a0), word strip + facecmp, lag options A-0.15/B0/C+0.15, slot clip,
  portrait card fallback (compose.py card), update README.
- r720_t1 ERRORED (7003 User Input Error, not billed): Seedance reference_videos needs a PUBLIC URL (OS hosted takes on
  raw.githubusercontent.com); a data URI is rejected. Not publishing Jade's likeness publicly without her OK.
- Fallback within budget: first-frame-only 720p takes from the 16:9 keeper frame, prompt "natural lips, no gloss, no makeup":
  media/gen/specs/cut_jsing_r720_t2.json vibesong/cut_jsing_r720_t2-f1ed1384b9 submitted ($1.39)
  media/gen/specs/cut_jsing_r720_t3.json vibesong/cut_jsing_r720_t3-030a21f5f0 submitted ($1.39)
- Portrait paper-card fallback built: jade_sing_bridge_1/fallback_card_480p_portrait_lag0.00.mp4 (tools/cutscenes/card.py)
- r720_t2/t3 collected: matte lips, v9 face OK, sync weak (mouth still on 一笔一画). Alt + lag options built. README updated.
## Round 3 (2026-10-15)
- Jade picked lip-sync B (lag 0.00), installed; paper-card fallback kept.
- 720p reference re-render: NOT run. The temporary public upload of the keeper clip was denied by the permission system;
  nothing was uploaded. Waiting on Jade's decision.
- Guitar task in progress: first frames media/cutscenes/_work/play/ff_{charlie,ricky}_play1.jpg (tools/cutscenes/ff_play.py).

## STATUS: round 2 DONE, nothing pending. Cutscene spend now $17.36 list (corrected: round 1 was $14.45 = images $1.08, Seedance $10.17, Veo $3.20; round 2 $2.91; r720_t1 errored, unbilled).
- vibesong/cut_charlie_play_t1-5a7a04498b submitted (Veo 3.1 1080p 4s, $0.80)
- vibesong/cut_charlie_play_t2-8c22816db0 submitted (Veo 3.1 1080p 4s, $0.80)
- vibesong/cut_ricky_play_t1-f59c19cc59 submitted (Veo 3.1 1080p 4s, $0.80)
- vibesong/cut_ricky_play_t2-d6080d6429 submitted (Veo 3.1 1080p 4s, $0.80)
- Round 3 DONE: charlie/ricky_play_bridge_1 built (Veo t1 each chosen), review rebuilt, README updated. Spend round 3 $3.47.
  Reference re-render NOT run (upload denied). Nothing pending.
