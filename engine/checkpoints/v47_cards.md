# v47_cards checkpoint (2026-10-19 evening)
Brief: docs/v47_brief.md (row v47_cards + Acting directions). Cards: 03 = paper.p03 (paper_0020, 20.1667-23.7667), 04 = paper.p04 (paper_0048, 48.5667-50.6667),
06 = paper.p06 (paper_0223, 143.40-146.197). Backups engine/out/bak_v47/v47_cards/. Review clips engine/out/review/v47/v47_cards/. Work dir media/cutscenes/_work/v47/.
Cap $25 (log media/genlog.jsonl, tags v47_*).

## STATE (23:40): DONE, SAFE, idle. No gens/renders running. Spend ~$13.58 of $25 (21 Seedance 480p 5 s $10.79, nbp $1.34, 3 flux upscales $1.44).
Switch: engine/src/scenes/paper_inserts.js:17-28 `CARDS_V47 = { p03: 'v47', p04: 'v47', p06: 'v47' }` (null per card = the v4.6 clip; or a variant
suffix such as 'v47_cur1_shift+2'). Installed files: media/cutscenes/paper_0020/paper_0020_v47.mp4 (= _v47_cur1_warp0to6_R18), paper_0048/paper_0048_v47.mp4
(= _v47_cur1_shift+0), paper_0223/paper_0223_v47.mp4 (= _v47_b2_shift+0). v4.6 clips untouched (+ copies in engine/out/bak_v47/v47_cards/).
Review clips (540p, audio, 0 page errors) engine/out/review/v47/v47_cards/:
  p03_old | p03_new_R18 (INSTALLED: +0 on "because", +6 after = Jade's v4.4 structure) | p03_new_shift+{0,2,4,6} | p03_alt_med2_shift+0 (medium shot)   (17-26 s)
  p04_old | p04_new_shift+0 (INSTALLED) | +2/+4/+6 | p04_alt_med2_shift+0                                                                         (45-53 s)
  p06_old | p06_new_shift+0 (INSTALLED, patch fixed) | +2/+4/+6 | p06_alt_r1cur1_shift+0 (most expressive, but the pencil vanishes; patch not fixed) (141.5-148 s)
Picks / takes / metrics: media/cutscenes/_work/v47/eval/summary.txt (+ sheets). Prompts: tools/cutscenes/pb_specs47.py CARDS 03 / 04b / 06b (used) and 04 / 06 / 06c (tried).
Next (coordinator): review page with old vs new + timing variants; if Jade wants an alt, build its upscale (+ patch fix for 06) the same way.

## Log
- 21:40 backups: engine/out/bak_v47/v47_cards/{paper_0020,paper_0048,paper_0223}.mp4 (= live clips at start) + paper_inserts.js.
- 21:45 card 06 still patch fix (nbp $0.27): nbp full-frame edit did nothing (patch_raw.png, unused); zoomed nbp ERASE of the old patch
  (media/cutscenes/_work/v47/c06/{zoom_src,erase_raw,erase_1080}.png) + NEW tools/cutscenes/pb_patch47.py pastes card 04's own drawn patch as a disc,
  centred on the band at 722,722 r37 rot -20 squash .88 -> c06/ff06_patch.png (reads "1420 MHz"; hair loose + one pencil in hand = canon OK).
- 21:50-22:00 MEDIUM first frames, NEW tools/cutscenes/pb_outpaint47.py (run with OSPY: cv2+scipy+PIL; nbp outpaint, still pixels kept in the middle at
  scale .74, feathered, seam colour match). r1 (cream border) framed the picture -> retired (_work/v47/r1); r2 = blurred reflect border.
  03 flush right (x0 500; reflect duplicated the chain) -> c03/ff03_medium.png (both hands open, empty); c04/ff04_medium.png (hands below frame);
  c06/ff06_medium.png (from ff06_patch, other hand empty, more Eraser body). nbp spend so far ~$1.34 (10 calls incl. 1 errored).
- 21:55 SUBMITTED 12 x Seedance 2.5 480p 5 s ($6.17): specs media/gen/specs/v47_{03,04,06}_sd25_{cur,med}{1,2}.json (NEW tools/cutscenes/pb_specs47.py).
  MISTAKE caught + fixed: the glob v47_0*_sd25_* also queued the trio unit's 4 specs v47_05_sd25_{a1,a2,b1,b2}; cancelled all 4 before the
  relay picked them up (KV job keys deleted, manifest state 'cancelled', genlog result ok:false est 0 appended -> refunded in spend.py). Not billed.
- 22:00 pb_tmplsync.py: added card "06" template + labials (stem RMS/>3 kHz map, comment in the file); backup engine/out/bak_v47/v47_cards/pb_tmplsync.py.pre_v47.
  Validated on the shipped 06 take pB_06_sd25_t3: lag +0.27 (r .65) vs the M1 envelope +0.25.
- NEW tools/cutscenes/pb_cards47_eval.py (OSPY): lag/r + labial errors, head/torso px/s, whole-frame gesture energy (90th pct block flow), beat sheet.
  Baselines (old live takes): 03 v43 c4 lag -0.05 r .77 head 55 torso 37 gesture 59 | 04 v43 c2 -0.18 r .70 39/23/38 | 06 pB t3 +0.27 r .65 21/12/23.
- Old reference renders: engine/out/review/v47/v47_cards/p0{3,4,6}_old.mp4 (17-26, 45-53, 141.5-148; 540p audio, exit 0, 0 page errors).
- Background: gen.py wait on the 12 jobs (ids media/cutscenes/_work/v47/jobs_r1.txt, log wait_r1.log). If it died: `$PY tools/gen/gen.py collect $(cat media/cutscenes/_work/v47/jobs_r1.txt)`.
- 22:15 first takes in. NEW tools/cutscenes/pb_mouthplot47.py (mouth curve vs template at candidate lags + a CLOSURE score: template closures hit
  minus closures inside open vowels; the template correlation alone is ambiguous on these legato lines, e.g. 03 med2 r-best -0.71 vs closures -0.26).
  Wrapper media/cutscenes/_work/v47/eval/run.sh; results appended to eval/summary.txt; sheets eval/<card>_<framing><n>.sheet.jpg.
- 22:05 r1 verdicts so far (eval/summary.txt): 03 cur1 BEST (lag -0.01, closures 3/3, temple tap on "imagination", eyes-closed thought, both hands open on
  "linked", grin; head 63 torso 64 gesture 99 vs old 55/37/59); 03 cur2 sync good but gestures late (tap 23.3, hands at the cut-out); 03 med2 lovely
  gestures, lag -0.26 by closures; 03 med1 has a white paper slip in her hand (reject). 04 r1: all hold a thinking pose through the 2.1 s window and smile
  only after it; med1 REJECT (portrait 560x752 output, worried brow); cur1 lag +0.17, loses the blueprint grid; cur2 -0.31 clasped hands; med2 -0.18 finger
  on chin + a glowing screen she looks at, grid kept (current 04 pick).
- 22:06 SUBMITTED r2 for 04 (compressed beats, CARDS['04b'] in pb_specs47.py): v47_04b_sd25_{med1,med2,cur1} ($1.54), ids _work/v47/jobs_r2.txt.
  Spend so far: nbp ~$1.34 + Seedance 12 x .514 + 3 x .514 = ~$9.05.
- 22:12 paper_inserts.js:17-28 CARDS_V47 per-card switch (all null = v4.6 clips; node --check OK). Upscale 03 cur1 submitted (vibesong/v47_03_cur1_up-76dbbfa5ca, seg _work/v47/upscale/seg_03_cur1.mp4 = take frames 6..103, S0 19.85; cost_note $0.59).
- 22:15 06 r1: cur1/cur2/med1 act beautifully (pencil lowered, hand on chest on "ask myself", open palm on "is", Eraser softens/closes eyes) BUT in all
  three the PENCIL hand goes to her chest and the pencil vanishes (~144.05-144.25). SUBMITTED r2 CARDS['06b']: pencil never leaves that hand, hand+pencil
  on chest, then she offers the pencil lying flat on her open palm (befriending, her tool not a weapon). v47_06b_sd25_{cur,med}{1,2} ($2.06), ids _work/v47/jobs_r2b.txt.
- 22:30 03 INSTALLED: upscale media/gen/v47_03_cur1_up_76dbbfa5ca.mp4 -> slots paper_0020_v47_cur1_shift+{0,2,4,6}.mp4 (pb_slot UP 19.85 (-0.01-K/30) 20.1667 23.7667; +0 verified lag +0.01 r .72), NEW pb_warp47.py (copy of pb_warp03 for this take) -> paper_0020_v47_cur1_warp0to6_R18.mp4 (= Jade's v4.4 structure: +0 on 'because', +6 after). paper_0020_v47.mp4 = R18; paper_inserts.js CARDS_V47.p03 = 'v47'. Variant renders: media/cutscenes/_work/v47/render_vars.sh (swaps paper_0020_v47.mp4, restores on exit; IF INTERRUPTED: cp paper_0020_v47_cur1_warp0to6_R18.mp4 paper_0020_v47.mp4).
- 22:40 04 PICK = 04b cur1 (v47_04b_sd25_cur1_a1a7ed38a4, lag -0.24 r .68, closures 2/3: a floating code screen appears, she reads it, knuckles at chin, brows knit, hand drops on '-self'; grid kept; canon OK). 04 med framing: 2 of 3 takes came back PORTRAIT (560x752) -> medium 04 not viable. Upscale submitted (seg _work/v47/upscale/seg_04b_cur1.mp4 frames 1..62, S0 48.041667; cost_note $0.38).
- 22:45 06 r2 (06b) verdicts in eval/summary.txt: pencil kept, but acting smaller; best r2 = 06b cur2 (hand+pencil on chest, eyes closed, smile; lag ~-0.10).
  SUBMITTED r3 CARDS['06c'] (r1 acting, hands named by screen side, held medium shot): v47_06c_sd25_med{1,2} ($1.03), ids _work/v47/jobs_r3.txt.
  Spend ~ $13.1 (nbp 1.34 + 21 Seedance 10.80 + upscales 0.97).
- 22:55 03 alt (medium shot): paper_0020_v47_med2_lz_shift+0.mp4 (lanczos from 480p, pb_slot take 19.60 -0.26) -> review p03_alt_med2_shift+0.mp4. Patch tracker for 06 (NEW tools/cutscenes/pb_patchtrack47.py): LK (v1) latched onto the hand; ring template match (v2) loses the patch when the hand/pencil crosses it -> plan: hand-keyed patch centres on the chosen take + occlusion fades.
- 23:05 06c (held medium shot): pencil vanishes again + small motion -> no. Seedance drops the pencil whenever a hand goes to her chest unless told the
  pencil stays IN that hand (06b). 06 PICK = 06b cur2 (v47_06b_sd25_cur2_9ee05b573b, lag -0.09 by closures; canon-safe: the pencil stays in her hand,
  lowered, hand+pencil on her chest on "ask myself", eyes close on "what it is", smile; the palm offer lands just after the cut). ALT = r1 06 cur1
  (most expressive: open palm offered on "is", Eraser shuts his mouth) but the pencil morphs away 144.05-144.25 (canon risk). Upscale 06b cur2 submitted
  (seg frames 3..80, S0 143.025; cost_note $0.47). 04 slots built: paper_0048_v47_cur1_shift+{0,2,4,6}.mp4 (pb_slot UP 48.041667 (-0.24-K/30) 48.5667 50.6667).
- 23:10 04 INSTALLED: paper_0048_v47.mp4 = paper_0048_v47_cur1_shift+0 (+0 verified lag 0.00 r .73, closures -0.04/-0.05/-0.05; Jade set card 04 to +0 in v4.4); CARDS_V47.p04 = 'v47'. Renders p04_new_shift+{0,2,4,6}.mp4 + p04_alt_med2_shift+0.mp4 (r1 med2, lanczos) in engine/out/review/v47/v47_cards/.
- 23:35 06 patch: pb_patchtrack47.py v3 (fixed frame-0 template match + jump/score rejection + interpolation, --ff sprite source, --keys hand-keyed
  end frames (the patch slides under her hair), --hide 27-32 (her hand crosses the patch)). Command: media/cutscenes/_work/v47/c06/ptrack/cmd_06b_cur2.sh
  -> media/cutscenes/_work/v47/c06/v47_06b_cur2_up_patched.mp4 (clean round "1420 MHz" on the band, every visible frame). Slots
  paper_0223_v47_b2_shift+{0,2,4,6}.mp4 (pb_slot PATCHED 143.025 (-0.09-K/30) 143.40 146.20; +0 verified lag -0.02, m/f closures -0.02).
  06 INSTALLED: paper_0223_v47.mp4 = b2 shift+0; CARDS_V47.p06 = 'v47' (all three cards now on v4.7; null per card = back to v4.6).
  Alt slot paper_0223_v47_r1cur1_lz_shift+0.mp4 (r1 cur1, lanczos 480p, lag -0.18, patch NOT fixed, pencil vanishes).
