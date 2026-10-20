# Resume runbook (V4 2026-10-18 is current; ROUND 5 and older blocks below are history)

## V4 (2026-10-18) — CURRENT. Jade approved the v3 critique; start with docs/v4_brief.md (plan + checkpoints + verification).

### v4.6 IN PROGRESS (started 2026-10-19 ~13:20) — READ THIS FIRST
Jade's v4.5 picks: **docs/v46_brief.md**. All picks already live except the outro -> r2 (act5/spread.js:79 LIVE = LIVES.v45r2). full_v4.5_preRicky.mp4 deleted (her OK).
- Build next (her pick): v46_outstrum = Charlie strums on the 2011 page at the end (~194-195.4), reusing v45_open's rig. Checkpoint engine/checkpoints/v46_outstrum.md.
- v46_outstrum DONE ($0.13; engine/checkpoints/v46_outstrum.md): act5/spread.js:104 END_STRUM_V46 'groove'|'strum'|null (own rig cut from the spread page; Veo->still crossfade moved to 193.55-194.0 when on). Clips engine/out/review/v46/v46_outstrum/.
- full_v4.6.mp4 540p rendered (exit 0, 340.7 s, 135 MB). SENT review page https://claude.ai/artifact/X8jk9qk6ZhjPHyVt5BNXNi (source docs/pages/v46_review/, root = that dir). Waiting on "v4.6 review: ...".
- Found: a black blob in the montage at 171.467-171.600 in every full stitch (v4.4-v4.6), absent in a section render from 165 -> state leak. Unit v46_blob investigating (engine/checkpoints/v46_blob.md).
- v46_blob DONE ($0; engine/checkpoints/v46_blob.md): cause = act5/drop2.js rebinding the shared GTAO pass (post.setScene) at init, so every Act III/IV 3D frame in a render reaching 173.02 (full stitches' worker 2 = 101.5-203) took AO from the Act V world. Fix drop2.js:83 (own AO pass, shared one restored) + :232 (swap in only around its own render). Backup engine/out/bak_v46/v46_blob/drop2.js.start. Expect AO changes across 101.5-173 in the next stitch (darker wedges gone, e.g. 155, 112, 172.2-172.7). Verified engine/out/review/v46/v46_blob/{fix_171-173.mp4,before_after_1715_155.jpg}. Re-stitch after v46_outro lands.
- Jade v4.6 pick: end strum = groove (already live). Next: v46_outro (r2 1080 upscale + lag) and v46_blob, then 1080p master + launch cuts + thumbnail.
- v46_outro r1 DONE ($3.64; engine/checkpoints/v46_outro.md): flux-video-upscale 2x precise (creativity 0) of hyb_br1 -> spreadR_v46r2 (v45r2 entry seq/tex, spread.js:75-77); lip lag measured <1 frame, rt.lag stays 0. Found the v45r2 hybrid cut beside Jade's shoulder (vertical line through hill tip / Ricky's shirt edge, ~186.8-188.6, x~1165). Coordinator OK'd the proper fix (re-cut on take B's shoulder outline + re-upscale ~$2.33, cap $10) -> in progress, new set spreadR_v46r2b.
- v46_outro r2 DONE (total $5.97): seam re-cut on take B's shoulder outline (tools/cutscenes/pb_spread46_hybrid.py -> media/act5/_work/v46/hyb_br1b.mp4), 2x upscale -> spreadR_v46r2b (v45r2 entry, spread.js:75-78; backup engine/out/bak_v46/v46_outro/spread.js.r2a; fallback spreadR_v45r2 kept). Coordinator checked ab_seamfix_187.10.jpg + seamfix_sway: clean. Lag 0. Superseded media/gen/v46_outro_up20_ab78fbca00.mp4 (23 MB) can go.
- full_v4.6b.mp4 540p DONE (checks engine/out/review/full_v4.6b_check/: 84 cuts / 34 luma drops; the AO fix also removed black patches at 114.5, 118.93 (was a scan 'cut') and 119.7 that were in v4.4/v4.5).
- 1080p MASTER DONE 16:53: engine/out/master/full_v4.6_1080p.mp4 (421 MB; decodes clean; luma = 540p + 1 borderline montage cut at 170.700 dY -35.2 from motion blur; spot frames OK incl. 171.53 no blob). v4.1 master full_v4_1080p.mp4 deleted (Jade OK). v4.2 master deleted later (Jade OK).
- v46_launch DONE ($0; engine/checkpoints/v46_launch.md, launch.md updated): engine/out/launch/ 3x 9:16 (+_clean) + thumbs A (now 183.733) / B / C + launch_sheet.jpg rebuilt with v4.6 code. Cut 2: new pan for the orbit walk (close-up trims Jade's outer arm + Ricky's headstock, faces in), slate moved to the ground y1680, 0.85 s fade -> Jade to judge. Old files in engine/out/bak_v46/launch_v41/ (247 MB; seg/*.mp4 166 MB deletable with her OK). Coordinator checked launch_sheet + cut-2 end strip: OK.
- Deleted with Jade's OK: v4.2 master, engine/out/bak_v46/launch_v41/seg/ (old scripts there were superseded copies; current ones in engine/out/launch/seg). Only master left: out/master/full_v4.6_1080p.mp4. WAITING on Jade: launch cut 2 look.
- (old plan) review page (v46) with the end strum variants + re-stitch full_v4.6 540p (coordinator renders in Bash; codex = file checks only).
- Before the 1080p master: upscale the r2 outro 1080 frames (lanczos from 720p now), measure the outro lag, then master + launch cuts + thumbnail.

### v4.5 (done; sent, picks in v46_brief) (started 2026-10-19 11:45) — READ THIS FIRST
Jade's v4.4 picks + notes and the unit plan: **docs/v45_brief.md**. Unit state: engine/checkpoints/v45_<unit>.md (ricky, open, laser, lvl, jam, scout).
- Applied 11:45: walk = orbit (act3/turn.js:115), outro = take B (act5/spread.js:71). Backups engine/out/bak_v45/. Card 03 R18, card 05 long +0, open-mouth face were already live.
- Wave 1 launched 11:47: v45_ricky (outro take B, Ricky likeness), v45_open (0:00 Charlie strums on the 2011 sketch), v45_laser (~1:30 Ricky's strum turns on the laser).
- 11:55 Jade added: Ricky's guitar powers the party cart ride (~160.8-168, act4/main3d.js) -> given to v45_jam (same file).
- Wave 2 (launched 11:50): v45_lvl (~1:15 Ricky's guitar levels up reality), v45_jam (~2:30 Charlie + Ricky play, Ricky's guitar brings light), v45_scout (read-only list of more Charlie/Ricky moments).
- 12:00 v45_scout DONE (engine/checkpoints/v45_scout.md, 8 ranked proposals). Routed: #3 prompt-box ENTER chord (46-52.6) -> v45_lvl; #5 cart both play + #2 lock-shot strum (138.6) -> v45_jam; NEW unit v45_accents builds #1 drop-2 slab strums (180/183, act3/slab_insert.js) + #6 recruit chord (121.3, act3/battle.js). Later: #4 outro sketch strum (after open+ricky, spread.js), #7 2D Charlie on the save screen (needs new art; ask Jade), #8 skipped.
- 12:15 v45_lvl DONE ($0; engine/checkpoints/v45_lvl.md): chorus.js:278 LVL_V45 'notes'|'bolt'|null, :283 ENTER_V45 'chord'|'hat'|null; clips engine/out/review/v45/v45_lvl/{lvl_*,enter_*}.mp4. Coord look: reads, sprites small (~45 px) so the strum is subtle; ENTER chord good.
- 12:20 v45_open DONE ($0.13; engine/checkpoints/v45_open.md): cold_open.js:35 STRUM_V45 'groove'|'strum'|null (2D puppet forearm, page01 untouched; arm01/hole01/strum01 in media/act5/tex/). Clips engine/out/review/v45/v45_open/ (closeup_L-v44_M-strum_R-groove is the A/B). Coord look: clean, stays a drawing.
- 12:25 v45_laser DONE ($0; engine/checkpoints/v45_laser.md): act3/drop_r5.js:61 LASER_V45 'wave'|'strum'|null; Ricky plugs in 89.69, power chord 89.933 -> beam 89.95 (unchanged); 'wave' adds a Ricky insert 89.284-90.105 and nudges the glamour wide (still-10 framing). Clips engine/out/review/v45/v45_laser/. Overlap fixed 12:35 (Jade hidden during the insert, drop_r5.js:149 inIns; backup drop_r5.js.wave1); insert stays 0.82 s (longer would cut Charlie's landing).
- 12:45 v45_jam DONE ($0; engine/checkpoints/v45_jam.md): act4/main3d.js:49 JAM_V45 'light'|'play'|null (149.79-154.26), :55 CART_V45 'power'|null (161.73-168.08, + hud2d.js:53-80 bar steps), :59 LOCK_V45 'strum'|null (138.595 bolt to the top 一). Clips engine/out/review/v45/v45_jam/{jam,cart,lock}_*.mp4. Coord look: jam reads well; lock bolt is bold.
- 13:05 v45_accents DONE ($0; engine/checkpoints/v45_accents.md): act3/slab_insert.js:33 SLAB_STRUM 'new'|'off' (180.233 / 183.300), act3/battle.js:59 RECRUIT_CHORD 'new'|'off' (121.433 chord, RECRUIT? sign 121.523, YES 121.745; sign = in-world UI in the flood window, Jade's call). Clips engine/out/review/v45/v45_accents/.
- Review page docs/pages/v45_review/ (encode.sh <src> <name>); all cards encoded except the outro (waiting on v45_ricky; /*OUTVERS*/ /*OUTNOTES*/ /*OUTPICKS*/ placeholders).
- 13:15 Jade: delegate mechanical render work to codex via tmux. Codex (tmux session vibesong-codex, log engine/out/review/v45/codex_stitch.log) is stitching full_v4.5 540p (pre-Ricky outro = take B) + checks per engine/out/review/v45/codex_stitch_task.md -> engine/out/review/full_v4.5_check/REPORT.md. Re-stitch (or re-run that task) once v45_ricky lands.
- 12:52 full_v4.5 540p rendered by the coordinator (codex sandbox can't render: no localhost listen/GPU; full-access codex is blocked by the auto-mode classifier, so render in Bash, give codex only file checks). engine/out/review/full_v4.5.mp4 = pre-Ricky (outro take B). Checks (codex, workspace-write) engine/out/review/full_v4.5_check/REPORT.md: 85 cuts / 34 luma drops like v4.4; +cut 89.300 (laser insert), 163.733 still a cut (lamp flare lowered its score); log warnings identical to v4.4.
- ~13:10 v45_ricky DONE ($4.43; engine/checkpoints/v45_ricky.md): hybrid = take B pixels for Jade/Charlie + Ricky from Seedance re-runs of a fixed first frame (tools/cutscenes/pb_spread45_hybrid.py); spread.js:78 LIVE = LIVES.v45r1 (alt v45r2; take B line commented at :77). Open: Jade's sleeve patch in take B is a rectangular label (not the round 1420 MHz patch), flagged to Jade. 1080 outro frames still not upscaled.
- SENT: review page https://claude.ai/artifact/XVVnCgrsuQCrnYynZx6Ygb (source docs/pages/v45_review/, republish with root = that dir; 26 clips). Pre-Ricky full cut kept as engine/out/review/full_v4.5_preRicky.mp4; full_v4.5.mp4 re-rendered with v45r1 at 13:03 (exit 0, 6090 frames; outro checked at 188 s). full_v4.5_preRicky.mp4 (135 MB) can be deleted with her OK. Waiting on her picks ("v4.5 review: ..."). Spend this round ~$4.6 (open $0.13 + ricky $4.43).
- Then: collect clips, review page docs/pages/v45_review/ (from v44_review), stitch full_v4.5 540p, checks vs full_v4.4_check, send. Outro 1080 upscale + lag still open before the master.

### v4.4 IN PROGRESS (started 2026-10-19 10:15) — READ THIS FIRST
Jade's v4.3 notes + unit plan: **docs/v44_brief.md**. Unit state: engine/checkpoints/v44_<unit>.md (open, paper, walk, spread).
- Applied: card 04 = +0 (paper_0048_v43_shift+0.mp4 -> paper_0048.mp4).
- Wave 1 launched 10:22: v44_open (0:06 grey hat + whole-video grey-hat sweep + 0:08 Jade save-screen sprite face), v44_paper (card 03 +6 with +0 on "because"; card 05 at 1:47 animated + held longer than the 3D shot).
- Wave 2 launched 10:28: v44_walk (restage 81.6-86.4 as an engaging walk), v44_spread (outro spread at the colored-pencil card bar).
- v44_open DONE 10:36 (engine/checkpoints/v44_open.md): 0:06 thrown hat tagged (paint_run_ship.js:66); sweep found 3D battle caps 113-118.4 washed out -> battle_fx.js:44 hero mat (outside listed ownership, 1 line, backed up); new save-screen sprite face (jade_face.py, variant A in show, B=smile). Clips engine/out/review/v44/v44_open/. Flagged not changed: 116.9-117.3 cap cream in the white bloom flash.
- v44_paper DONE 10:42 (engine/checkpoints/v44_paper.md): card 03 = R18 warp (+0 through "because" 20.13-21.15, flow ramp 20.40-21.00, then +6; alts _R15/_R24); card 05 = new Seedance take a1 at +0 (variants _v44_shift*), $3.62.
  Coordinator installed card-05 V2: show/main.js card05 t1 109.62, type.wutai t0 109.58; type/beats.js wutai strokes 舞 109.62-109.92 台 109.92-110.24 (lyrics_timed line 27 is a syllable early; stem 舞 = 109.62). Backups engine/out/bak_v44/{main.js.pre_coord_V2,beats.js.pre_coord}. Check clip engine/out/review/v44/coord/p05_V2_installed.mp4 (looks right).
- v44_walk SAFE 10:48 (engine/checkpoints/v44_walk.md): variants lead (installed) / orbit / side behind `const WALK_V44` at src/scenes/act3/turn.js:115 (null = v4.3); beat-locked footfalls via additive follow({beats}) in track.js. Clips engine/out/review/v44/v44_walk/. DONE: lead polished (wide V, Charlie -24 / Jade +2 / Ricky +24), canon passes; re-render one variant: `bash out/review/v44/v44_walk/render_variant.sh <v>` from engine/ (rewrites the flag; reset it after).
- 10:55 coordinator: card-05 shift variants DONE (+0 restored) (engine/out/review/v44/coord/p05_variants.sh swaps paper_0147.mp4; IF INTERRUPTED restore: `cp media/cutscenes/paper_0147/paper_0147_v44_shift+0.mp4 media/cutscenes/paper_0147/paper_0147.mp4`). Review page being built at docs/pages/v44_review/ (from v43_review). v44_spread still running (state in its checkpoint; 2 Seedance takes in flight at 10:51).
- 11:07 v44_spread agent STOPPED (weekly API limit, resets 21:00); coordinator finished it: see the 11:07 section of engine/checkpoints/v44_spread.md. Installed v44a1 + 'page' (spread.js `const LIVE = ...` line); variants rendering via coord/spread_variant.sh.
- **11:35 SENT to Jade:** review page https://claude.ai/artifact/62wkmo7X1ozr2rDeuW9XLs (source docs/pages/v44_review/, republish with root = that dir). Full cut engine/out/review/full_v4.4.mp4 (checks full_v4.4_check/: same 34 luma drops as v4.3; 85 cuts, only change 107.633 -> 109.633 = card 05). Waiting on her picks ("v4.4 review: ..."). Switches: sprite face (jade_face.py smile + build_save02.py), card 03 (tools/cutscenes/pb_warp03.py variants R15/R24 in media/cutscenes/paper_0020/), card 05 length (main.js card05 t1 109.03 short / 109.62 long) + timing (paper_0147_v44_shift*.mp4), walk (turn.js:115 WALK_V44), outro (spread.js:71 LIVE/CAMV). Outro: lag not measured, 1080 frames not upscaled (do before the master). Spend this round ~$9.9.
- 11:20 coord: spread.js rt takes no longer settle-fade into the still at 194.06 (it ghosted: poses differ); outro variants re-rendering, then full_v4.4 540p stitch -> engine/out/review/full_v4.4.mp4 (log full_v4.4.log). After: checks vs full_v4.3_check, encode out_* clips into docs/pages/v44_review/v/, publish page.
- **CHECKPOINT 10:55 (safe):** open, paper, walk DONE; spread at its safe point (no src edited, no gen in flight, $6.30; next = pick take, upscale, conform spreadR_v44, spread.js switch). Only thing running: coord/p05_variants.sh (see restore line above).
  If the session died: (1) restore paper_0147 +0 if the variants script was cut off; (2) brief a fresh spread agent from engine/checkpoints/v44_spread.md + docs/v44_brief.md; (3) finish docs/pages/v44_review/ (index.html has /*SPREAD*/ and /*SPREADPICK*/ placeholders; clips in v/, p05_{m2,p2,p4,p6} come from engine/out/review/v44/coord/p05_V2_shift*.mp4, encode crf 25 + aac + faststart); (4) stitch full_v4.4 540p (command below, ~5.5 min), check luma drops/cuts vs full_v4.3_check, publish the page (Artifact, new URL), send to Jade.
- Then: stitch full_v4.4 540p, checks, review page with switchable variants (template docs/pages/v43_review/), send to Jade.

### HANDOFF 2026-10-19 v4.3 — READ THIS FIRST (written 2026-10-19 ~02:15)
**State: idle and safe.** No agents or renders running. Nothing committed (renders are gitignored; src/asset changes are uncommitted in the working tree).

**What exists.** v4.3 fixes all seven of Jade's notes on v4.2 (her words, song time):
| note | fix | unit checkpoint (each has a "v4.3" section, file:line, backups) |
|---|---|---|
| 0:03 reverse the opening lines | 2011 page: "For every partial project in a drawer." on top (larger), "a song about product management (2011)" under it (layers slate01/ded01 rebuilt by assets/v4_stills/tools/passB_oc/build_pages.py) | passB_open_close.md |
| 0:07 it was called "The Product Manager song" | save-screen title "The Product Manager Song" (build_save02.py -> save02/bg.png; cast.js SAVE_MARQUEE). Stays up after the 2011->2026 roll, like the old title | passB_open_close.md |
| 0:22 card 03 dot wrong side + stiff body | new still 03 v3 (dot on HER LEFT), re-animated with Seedance 2.5 singer prompt; +6 frames | passB_paper.md |
| 0:49 card 04 stiff body + lips out of sync | re-animated the same way; +6 frames (same lead she picked on card 03) | passB_paper.md |
| 0:41/0:44 Charlie's hat turns grey | hat props (parachute/trampoline/boomerang/thrown hats/shield) were not exempt from the pre-flood graphite grade; tagged in kaizo.js, chorus.js, act3/world/props.js. 8 ranges fixed | v43_hat.md |
| 1:22 walk unnatural | act3.turn 81.6-86.4 now mocap figures (new follow()/land() in src/core/motion/track.js); a light JOG, since the world timing needs 2-4 m/s | v43_walk.md |
| 3:07 eyes demented, reshoot | new Veo take spreadR_v14 (eyes closed singing / looking at guitars, matched eyes); spread.js:110. Alt spreadR_v14b moves more (Charlie ghosts ~194.5) | passB_paper_spread.md |
- 540p cut: `engine/out/review/full_v4.3.mp4` (checks `full_v4.3_check/`: same 34 luma drops and same 85 cuts as v4.2).
- Review page SENT to Jade: https://claude.ai/artifact/R4PUJAnnAH4Lux6DdqMnFd (source docs/pages/v43_review/; republish with root = that dir; v4.2|v4.3 per note,
  card 03/04 timing variants -2..+8, outro v14 vs alt; she pastes "v4.3 review: ..." from Copy answers).
- Section clips per unit in `engine/out/review/v43/<unit>/`. Spend this round $15.14 (paper $7.14, spread $8.00); project ~$112 of $500.
- 1080p master of v4.2 exists and is verified (`engine/out/master/full_v4.2_1080p.mp4`); v4.3 has no master yet.

**Waiting on Jade (her picks on the page):**
1. Card 03 and card 04 timing. To switch: `cp media/cutscenes/paper_00XX/paper_00XX_v43_shift+K.mp4 media/cutscenes/paper_00XX/paper_00XX.mp4` (XX = 20 for card 03, 48 for card 04; engine re-decodes on mtime). "Keep old" = restore from engine/out/bak_v4b/paper/v43/.
2. Walk: jog OK, or restage as a real walk (slower camera + shorter path in act3/turn.js; the switches and causeway chunks are timed to ~100 u/s, see v43_walk.md).
3. Outro: v14 (in show), alt = change `spreadR_v14` -> `spreadR_v14b` at spread.js:110, or reshoot again (brief from passB_paper_spread.md v4.3 section; v14 is calmer, she called v12 bodies "frozen" before).
4. Opening + save title + hat: Good / Change.
5. Still open from the morning handoff below: five fresh-eyes calls (#2 #4 #6 #7 #10 in engine/checkpoints/fresh_eyes_v4.md), credits read time, flood-line gloss yes/no, thumbnail pick and the 9:16 cuts.

**Then:** apply her picks (small ones directly; anything bigger via a fresh agent briefed from the unit checkpoint), re-stitch v4.4 at 540p if anything changed,
run checks, send, then the 1080p master (~20 min) and refresh the launch cuts from it (engine/checkpoints/launch.md; the cut-1 opening, the hat colours and the
walk changed since the launch cuts were made, so all three 9:16 cuts and thumbnail A need a refresh).

**Commands** (from engine/, `export TMPDIR=$PWD/out/dev/tmp`, check `nvidia-smi` first): same as the morning block below
(540p stitch ~5.5 min with --workers 2; master adds `--res 1920x1080 --mblur 8 --shutter 0.33`). Clips for a page: cut from the full mp4s with ffmpeg crf 25 + aac
(.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2); an artifact publish takes <=64 MB and <=15 MB per file.

**Disk:** ~6.5 GB free (other projects fill the rest). Deleted with Jade's OK on 10-19: full_v1/v2/v3/v3.1 540p cuts and full_v3_1080p.mp4 (logs, sheets, check folders kept).
More candidates (ask first): out/master/full_v4_1080p.mp4 (v4.1, 425 MB, superseded by the verified v4.2 master), half2_v1-v3 + act5_v1-v3 + turn_v13 review mp4s (~470 MB),
out/cache/clips/*paper_00{20,48}* pre-v4.3 caches (~500 MB, rebuildable), engine/out/bak_v4b/paper/spreadR_v11_pre_lidfix_all (231 MB), engine/out/launch/seg/*.mp4 (166 MB, rebuildable).

**Gotchas new this round:** two agents edited src/scenes/act3/world/props.js (hat materials only) and act3/turn.js + core/motion/track.js (walk); keep both.
spread.js line numbers shifted by ~4 (pointer now :110). Posed heroes in act 1 (crate flip, parachute dangles) are now in canon colour, not graphite (intended).

### HANDOFF 2026-10-19 MORNING (history; superseded by the v4.3 handoff above) (written 2026-10-19 ~01:30)
**What exists now.** v4.2 is the current cut. It has every Jade note from the Pass B checkpoint plus the fresh-eyes fixes.
- 540p review: `engine/out/review/full_v4.2.mp4` (checks in `engine/out/review/full_v4.2_check/`: 34 luma drops, all on cuts; 71/85 cuts on grid;
  the subtitle band differs from v4.1 only at 123.37 and 154.5-155.8, as intended).
- **1080p master of v4.2 was STILL RENDERING at handoff** -> `engine/out/master/full_v4.2_1080p.mp4` (log `full_v4.2_1080p.log`, luma `full_v4.2_1080p_luma.txt`).
  FIRST THING: check that the log says "wrote ..." and that the luma scan lists the same 34 drop times as `engine/out/review/full_v4.2_check/luma_scan.txt`.
  If it's missing or broken, re-run the master command below (about 23 min on 2 workers).
- `engine/out/master/full_v4_1080p.mp4` is the v4.1 master (superseded once v4.2 is verified).
- Launch deliverables (made from the v4.1 master): `engine/out/launch/` = 3x 9:16 cuts (prompt 41.03-59.43, shatter 71.11-86.40, terraces 169.67-186.66; each
  also as `_clean` without the end slate) + thumbnails A/B/C (A = carved FUNCTIONS slab, recommended) + `launch_sheet.jpg`; method in `engine/checkpoints/launch.md`.
  **Refresh** the 3D parts of cuts 2 and 3 and thumbnail A from the v4.2 master (the 3D Jade patch changed), using the commands in launch.md.
- Nothing is running except possibly that master render. No agents are alive (all of the 10-18 agents are gone): brief fresh ones from
  `docs/v4_passB_brief.md` + the unit checkpoint `engine/checkpoints/passB_<unit>.md` (+ `fresh_eyes_v4.md` for review items).

**Jade's decisions on 10-18 (evening)** — all applied in v4.2:
- Forehead lift on paper stills 03/04/05: approved (`assets/v4_stills/0{3,4,5}_*_v2.png`; the cards were re-generated from them).
- Card 03 lip timing: she picked **+6 frames** by ear on https://claude.ai/artifact/JDU4XBQZGSPuUrodkGr1pw (variants kept as `media/cutscenes/paper_0020/paper_0020_shift+K.mp4`).
  She can't judge timing from stills: give her videos on a page.
- Act 1 bridge: relabelled "blossoms" (it is the held "blossoms"), drawn as graphite branches with pink blossoms; petals when chewed (color unit M3/M3b, kaizo.js/level.js).
- No subtitle needed for "because" on card 03 ("it's ok if not every word is displayed").
- FIXTURES/FUNCTIONS slab: carved on both drops (stage_3d M3).
- Outro moving spread (186.65-194.9): she liked the v11 brows but called out frozen bodies, then "cross-eyed" eyes and the pencils -> now `spreadR_v13c`
  (new Veo take with whole-body motion, catchlights centred, pencils pasted from Veo frame 14, hair outline rebuilt). Fallbacks v13b/v13/v12/v11 in media/act5/frames/.
- Fresh-eyes fixes (no Jade call needed, done): the dedication is written by the opening pencil 198.47-199.10 (readable 3.9 s); no ghost subtitle at 123.37;
  the chorus-2 line waits for "And" (155.8); hatch streaks/violet glow/red hinge dash at 91.4-94.2 fixed; the 3D Jade 1420 MHz patch turned 40 deg to face camera, ON the band.

**Waiting on Jade (ask her these, with the recommendations):**
1. Her notes on v4.2 (she was about to watch; she may have watched v4.1 or the v4.1 master instead).
2. Five fresh-eyes calls (`engine/checkpoints/fresh_eyes_v4.md`): #2 card 05 is a 12-frame flash at 107.233-107.600 (rec: hold it for 107.15-107.71; stage_3d + paper);
   #4 glosses and the Chinese subtitle line are 4-5 px on a phone (rec: >=34 px glosses with a backing, >=30 px Chinese line; type);
   #6 the rap/bug battle 112.3-116.9 is hard to read (rec: widen one shot to show a bug becoming a feature; stage_3d);
   #7 the opening page barely moves 0.6-2.9 (she approved that hold; rec: slow push-in; open_close);
   #10 3D Jade's skin under the sunset grade is much darker/oranger than paper Jade, most visible on the cut into card 06 at 143.4 (rec: lift the 3D skin; color).
3. Credits: to fit the dedication, the five credit blocks now ink in 201.0-202.0, so each is fully readable for only 1.0-1.6 s. Keep that, or add a short silent hold after the music?
4. Flood line (fixtures lay the base, functions add the color) has no translation anywhere (zero-UI flood). Offer: a code-comment line in the couplet's editor half 123.354-~124.1 (type). Yes/no.
5. Thumbnail pick (rec A) and her view of the 9:16 cuts (flag: cut 1's 2D section is rendered natively in portrait, so the sprites are small in a tall dark frame).
   Also nice-to-haves in fresh_eyes_v4.md.

**Then:** apply her answers per unit (fresh agents), re-stitch v4.3 at 540p, run the checks (below), send it, re-master at 1080p, refresh the launch cuts.

**Commands** (from `engine/`; always `export TMPDIR=$PWD/out/dev/tmp`; check `nvidia-smi` first):
- 540p stitch: `node render.js --show main --from 0 --to 203 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 out/review/full_v4.N.mp4 --audio --workers 2` (~5.5 min)
- 1080p master: same with `--res 1920x1080 --mblur 8 --shutter 0.33 --mp4 out/master/full_v4.N_1080p.mp4` (~23 min, ~425 MB)
- Checks: `../.venv/bin/python tools/v4/lumascan.py X.mp4`, `tools/v4/cutgrid.py X.mp4`, `bash tools/v4/sheets.sh X.mp4 OUTDIR sheet`; compare drop times and cut times with the previous
  version's check folder (every drop must sit on a cut; 72.167 and 169.5 are known and fine; the 52.633 off-grid cut is pre-existing).
  Subtitle-band diff vs the previous cut: crop=760:96:100:440 at 540p, gray, frame by frame, flag runs where >3% of pixels differ by >40.
- Section render: `--from A --to B --workers 1` into `out/review/passB/<unit>/`.

**Gotchas:**
- Disk is at 99% (~8 GB free). This project uses only ~8 GB; other projects fill the rest. Safe deletion candidates (ask Jade first): out/review/full_v1..v3*.mp4,
  out/master/full_v3_1080p.mp4 (402 MB), out/master/full_v4_1080p.mp4 (once v4.2 is verified), engine/out/bak_v4b/paper/spreadR_v11_pre_lidfix_all (231 MB),
  engine/out/launch/seg/*.mp4 (166 MB, rebuildable).
- The orphan headless Chromes using CPU and GPU belong to ~/Documents/rewind-take-two (2+ days old). Not ours; leave them. The GPU is shared, so section renders use --workers 1.
- `engine/src/scenes/act5/spread.js` was touched by several units: line ~59 OUT (blossoms 191.22, thats 191.95, ded [198.471, 199.10], pen/sbs/cred), line 106 pointer `spreadR_v13c`,
  line ~206 subIds [49, 48]. Keep them when editing.
- `src/core/ui.js` subtitleFor now shows a bar from the first sung word minus 0.12 s and never brings a line back after a clear frame (type M4). act4/main3d.js still keys K.gang to 154.26.
- GTAO state leak: drop-2's slab showed a dark band after drop_r5 frames in the same process. Workaround: AO off in slab_insert.js. The root cause (post.js/GTAO) is untraced; watch other 3D shots.
- Portrait rendering gaps (paper/3D subtitles sized by height, 3D cameras keep vertical FOV, aerial video stretched): see launch.md.
- An invisible old `ded` text object in spread.js still has the old wording; it never shows.
- Spend: paper unit ~$25.53 of its $40 cap; project ~$97 of $500 (genlog is media/genlog.jsonl).

### Session log 2026-10-18 evening (history; superseded by the handoff above)
#### RESUMED 2026-10-18 ~18:35 (no reboot happened: uptime 36 d; smoke test passed, out/dev/smoke_{a,b}.png)
Two paper agents RUNNING in parallel: (1) Tasks A+B (forehead lift 03/04/05 + card-03 "because" fix, $14 cap) -> appends "## M3" to
engine/checkpoints/passB_paper.md, renders out/review/passB/paper/m3_{18-25,46-52,106-111}.mp4; (2) Task C (outro spread v11 brows, $8 cap)
-> engine/checkpoints/passB_paper_spread.md + m3_184-197_spread.mp4. If they are gone, check those checkpoints, then brief fresh agents.
The orphan headless Chromes belong to ~/Documents/rewind-take-two (not ours); leave them.
UPDATE ~20:00: paper A+B DONE (M3 in passB_paper.md; stills assets/v4_stills/0{3,4,5}_*_v2.png; spend ~$22.60/$40). Task C brows DONE ($0, spreadR_v11);
Jade liked the brows but the bodies are frozen -> spread agent making Veo v12 takes (whole-body motion, $5 cap) -> m3b_184-197_spread.mp4.
NEW type agent: subtitle word-timing audit vs the vocal stem (line 7 was a word early; 18.1-20.08 is "blossoms" held) -> passB_type.md "## M3".
~20:30: spread v12 DONE (whole-body motion, $2.40; spread.js:106 -> spreadR_v12; coordinator also fixed spread.js:59 OUT.blossoms 191.22 / thats 191.95
and :206 subIds [49,48]). Type M3 DONE (24 words re-timed, passB_type.md). full_v4 RENDERED: engine/out/review/full_v4.mp4 (540p, log full_v4.log),
checks in engine/out/review/full_v4_check/ (luma all on cuts; cuts 72/86 on grid; 52.633 off-grid pre-existing). Paper spend $25.00/$40; project ~$96/$500.
SENT TO JADE: checkpoint page https://claude.ai/artifact/QdL1G3kbRNs5axSsMezj3f (v2; source docs/pages/v4_checkpoint/, republish with root=that dir).
Her 6 calls: card-03 by ear; forehead lift; outro v12 (pencil wobble -> composite bun+pencils from still?); act-1 'because' bridge (leave/relabel);
caption 'because' on card 03 (type unit: subs [6,7] + act1 drops line 6 bar); FIXTURES slab 180.2 reads flat (carve it?). Then 1080p master etc.
JADE ANSWERED ~21:00: forehead APPROVED; caption 'because' = leave (not needed); bridge -> relabel 'blossoms' that LOOK like blossoms (color agent,
passB_color.md M3); slab -> carve it (stage_3d agent, passB_stage_3d.md M3); outro: 'why cross-eyed now?' + fix pencils (spread agent -> spreadR_v13,
m3d render); card 03 'mouth a little too early' -> paper agent renders p03_var/p03_shift+{0,1,2,3,4,6}.mp4; comparison page SENT: https://claude.ai/artifact/JDU4XBQZGSPuUrodkGr1pw (source docs/pages/p03_timing/); JADE PICKED +6 (swapped in, passB_paper.md M3c); drop-in clips media/cutscenes/paper_0020/paper_0020_shift+K.mp4.
DONE ~22:30: card 03 = +6 (all 1080p frames); blossoms bridge M3b APPROVED (graphite branches + pink blossoms); slab M3 APPROVED (both drops carved;
GTAO band leak after drop_r5 frames -> AO off in slab_insert; root cause in post.js/GTAO untraced, watch other 3D shots; check 92.0 magenta glow, 93.8 red dash).
Outro: v13 eyes approved; v13b pencil-paste polish IN PROGRESS (spread agent -> m3e render). After it: re-stitch full_v4.1.
~23:30: outro = spreadR_v13c (eyes centred, Veo-frame-14 pencils pasted, hair outline rebuilt; fallbacks v13b/v13/v12/v11).
full_v4.1 RENDERED: engine/out/review/full_v4.1.mp4 (checks out/review/full_v4.1_check/: luma all on cuts, cuts 71/85, changes_sheet.jpg). SENT to Jade in chat.
1080p MASTER DONE 23:03 (luma = v4.1, spot-check out/master/spotcheck_1to1.jpg): out/master/full_v4_1080p.mp4 (log full_v4_1080p.log; v3 master cmd with --look k08b+cs, --to 203). RUNNING (agents): thumbnail + 3x 9:16 -> engine/out/launch/ + checkpoints/launch.md; fresh-eyes review -> checkpoints/fresh_eyes_v4.md. Waiting on Jade notes on v4.1.
FRESH-EYES DONE (checkpoints/fresh_eyes_v4.md): fixing now (agents): #1 dedication readable >=2 s (open_close, spread.js OUT.ded), #3 streaks/red rect 91.4-94.2 + #5 verify 3D patch
(stage_3d M4), #8 ghost subtitle at 123.37 + #9 chorus-2 line early (type M4). ASKED JADE: #2 card05 12-frame flash (hold/cut), #4 gloss size, #6 rap readability,
#7 opening stillness push-in, #10 3D skin under sunset grade. After fixes: re-stitch v4.2 + re-master.
~01:00: fixes DONE: dedication (open_close M3: pencil writes it 198.47-199.10, credits 201.0-202.0 = shorter read, asked Jade), type M4 (core/ui.js subtitleFor:
first-word lead 0.12 + no return after clear frame), stage_3d M4 (hatch 0.2x after 91.335, violet glow, hinge beam graphite; patch turned 40deg in heroes.js:251-258).
Launch DONE: engine/out/launch/ (3x 9:16 + _clean, thumbs A/B/C, rec A; checkpoints/launch.md) - REFRESH cut 2/3 3D parts after re-master (patch change).
v4.2 DONE (out/review/full_v4.2.mp4; checks = v4.1; subtitle band diff only 123.37 + 154.5-155.8 as intended). v4.2 1080p MASTER RENDERING -> out/master/full_v4.2_1080p.mp4. Open asks to Jade: v4.1 notes, 5 review calls, credits hold, flood-line gloss (yes/no).

### HANDOFF 2026-10-18 ~19:00: Jade is restarting to install updates. READ THIS FIRST.
**Nothing is running:** no renders, and all agents are stopped. The orphan headless Chromes from days ago clear on reboot.
After the reboot, run the §0 smoke test, then continue below. Disk is at ~98% (19 GB free); TMPDIR=engine/out/dev/tmp always.
**Pass B status by unit** (brief docs/v4_passB_brief.md; every unit's file:line changes and backups are in engine/checkpoints/passB_<unit>.md):
| unit | state | output |
|---|---|---|
| open_close | DONE (M2 approved) | out/review/passB/open_close/m2/ (2011 page holds 0-2.9 s, CONTINUE 7.167, year roll, outro page 11 + stamp + dedication) |
| type | DONE (M2 approved) | out/review/passB/type/ (绽 / 舞台 / 答, couplet 123.354, code-comment glosses, chorus-1 cut snaps; type.yibi removed) |
| color | DONE (M2 + hooks) | out/review/passB/color/ (opt-in `--look k08b+cs`; warm plaster pre-flood; hooks H1-H13 applied by color + stage_3d) |
| stage_3d | DONE (M2 + hooks H9-H13) | out/review/passB/stage_3d/ (its M2 mp4s predate 3 cut snaps + the hooks; the stitch verifies them) |
| paper | **IN PROGRESS: see "RESUME HERE" in engine/checkpoints/passB_paper.md** | cards upscaled (M2 approved); 3 jobs left, below |
**Paper's remaining jobs (Jade's answers, 2026-10-18):** (1) forehead lift on cards 03/04/05 (same method as #06), then re-gen, upscale, re-measure;
keep paper_0147.mp4's name and time base (stage_3d plays it at t-107.15). (2) Card 03 is off by a WHOLE WORD: the audio starts on "because" and the
lips start on "my". Re-gen with the exact card-window audio and measure per word (because/my/imagination); Jade re-checks by ear via
media/cutscenes/paper_0020/preview_540p_with_song.mp4. (3) Regenerate the outro's moving spread layer (186.65-194.9, act5/spread.js) from the v11 spread,
so the brows match. Paper cap $40 (spent ~$16.25); project ~$87 of $500.
**Then:** stitch full_v4 at 540p: `node render.js --show main --from 0 --to 203 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 out/review/full_v4.mp4 --audio --workers 2`
(check nvidia-smi first), run the whole v4_brief verification (luma, cut-vs-grid, UI budget, subtitles, canon crops) plus seams at every unit boundary,
then send Jade v4 (update the checkpoint page https://claude.ai/artifact/QdL1G3kbRNs5axSsMezj3f in place; its source is lost with the scratchpad,
so rebuild it). After her notes: the 1080p master (the v3 command without --r5, with `--look k08b+cs`, -> out/master/full_v4_1080p.mp4), then the
thumbnail + three 9:16 cuts + a fresh-eyes review against the bar table.
**Pass A STARTED 2026-10-18** (two agents in parallel): Tier 1 + full_v3.1 at 540p -> engine/checkpoints/v4_tier1.md;
Tier 2 stills + brows v11 -> engine/checkpoints/v4_art.md (output assets/sheets/v11/, assets/v4_stills/, engine/out/review/v4_stills/).
Checkpoint after both: send Jade v3.1 + stills sheet + brows sheet; no animation of the new art before she approves.
**Pass A DONE 2026-10-18 ~13:35.** v3.1 = engine/out/review/full_v3.1.mp4 (540p, 0-203.0; r5 now default; report engine/checkpoints/v4_tier1.md).
Stills engine/out/review/v4_stills/{stills_sheet,brows_v11_sheet}.jpg (report engine/checkpoints/v4_art.md; spend $5.24, project $70.25/$500).
Jade APPROVED Pass A (all 11 stills + brows v11; notes: dedication -> "For every partial project in a drawer." at BOTH ends; #06 forehead taller + more hair volume).
**Pass B STARTED 2026-10-18** per docs/v4_passB_brief.md: five units (open_close, paper, stage_3d, type, color) build to M1 (1080p stills
in engine/out/review/passB/<unit>/m1_sheet.jpg), coordinator reviews, then M2 540p sections; checkpoints engine/checkpoints/passB_<unit>.md.
If agents are gone: brief fresh ones from the passB brief + their unit checkpoint.
Pass B state (2026-10-18 ~17:40): color M1+M2 APPROVED (warm plaster pre-flood; out/review/passB/color/), hooks H1-H7 + H16 DONE (out/review/passB/color/hooks_sheet.jpg; owns act1/kaizo.js); H9-H13 -> stage_3d, H14 not needed, H15 -> type, after their M2. Color unit idle.
type M1+M2 APPROVED (out/review/passB/type/m2_*.mp4); snapping 57.433; re-check the 0-14 gloss after open_close. open_close M1+M2 APPROVED (out/review/passB/open_close/m2/); idle. paper M2 APPROVED; now re-gen 03/04/05 (forehead lift; 03 sync was a whole word off: 'because') + regen the outro Veo spread layer with v11 brows. stage_3d M2 + hooks DONE. The final stitch adds `+cs` to --look (k08b+cs).
**full_v3 master command (reconstructed + verified 2026-10-18, v4_tier1):** from engine/, `export TMPDIR=$PWD/out/dev/tmp`, then
`node render.js --show main --from 0 --to 207.2 --fps 30 --res 1920x1080 --r5 --fig native --figscale 1.3 --figres 2.5 --look k08b --mblur 8 --shutter 0.33 --mp4 out/master/full_v3_1080p.mp4 --audio --workers 2`
(2 workers from the log: w1 starts at 103.6; 6216 frames, 1208 s). Verified by 1080p stills with the same setup range as each worker: 34-43 dB vs the
master (shutter 0.5 gives 29 dB, no mblur 24 dB at the same frame). **Since the r5 flip (v4) `--r5` is the default and a no-op; `--r5 0` opts out.**
v4 command = the same without `--r5`. Determinism caveat: Math.random is one seeded global stream consumed during scene setup, so a frame depends on
WHICH scenes the range sets up (a 5 s mp4 slice differs from the master at 23-35 dB; stills/slices whose range spans the same scenes match). Compare
renders only at equal setup ranges (details: engine/checkpoints/v4_tier1.md).
**Tier 1 DONE 2026-10-18 (13:30):** engine/out/review/full_v3.1.mp4 (540p, 0-203.0, audio; checks in engine/out/review/full_v3.1_check/,
report engine/checkpoints/v4_tier1.md). r5 is the default (`--r5 0` opts out). v3.1 command: `node render.js --show main --from 0 --to 203.0
--fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b --mp4 out/review/full_v3.1.mp4 --audio --workers 2`. Picture now ends at 203.0.


## ROUND 5 (2026-10-17, Fable 5.1): legibility + stakes pass on half 2. STARTED ~10:30
**Jade's words:** "you have artistic freedom to change anything you want in the second half"; "build your vision".
**Read in order:** docs/game_design_half2_r5.md (the design, DECIDED), docs/round5_build_brief.md (unit rules + interfaces), the last
section of docs/decisions.md, then each unit's checkpoint in engine/checkpoints/{talos_r5,battle_r5,act4_r5,look_r5}.md.
**Units (all behind `--r5`; defaults byte-identical until flipped):** talos_r5 (86.385-107.13), battle_r5 (107.15-123.354 + battle_ui.js
incl. the final-boss window), act4_r5 (123.354-173.02), look_r5 (LOOK_R5 preset + per-shot API + column thinning). Each stops at
M1 (1080p signature stills vs keyframes, engine/out/review/<unit>/m1_sheet.jpg) for coordinator notes, then M2 (540p section mp4).
**Then:** stitch half2_v4 with `--r5`, check seams at 107.15 and 123.354, canon audit, send Jade the 12 signature stills first, then the mp4.
**ROUND 5 STATE 15:40 CDT: half2_v4 SENT TO JADE.** engine/out/review/half2_v4.mp4 (540p, 86.385-207.2, --r5; file time + 86.385 = song time),
signature stills engine/out/review/half2_v4_sig/ (13 x 1080p + signature_sheet.jpg). Seams 107.15 (hidden by the swirl) / 123.354 / 173.02 checked clean.
All four units DONE (checkpoints talos_r5 / battle_r5 / act4_r5 / look_r5). Defaults without --r5 still byte-identical.
**Waiting on Jade:** notes on v4; `> you` vs `> draw it again` / `> an eraser`; paper-clip lip sync ~0.4 s late on the first word (paper.js CLIPS lag, her pick B).
**Then:** apply notes per unit (brief fresh agents from docs/round5_build_brief.md + the unit checkpoint); flip r5 to default (render.js always ?r5=1 or R5() true;
remove talos's dev hook fetch out/dev/r5cam.json in drop_r5.js; back up first); 1080p master `--mblur 8 --shutter 0.33` (~17 min on 1 worker per look_r5).

**Gotchas:** another project's render is on the GPU (use --workers 1); disk 27 GB free; TMPDIR=engine/out/dev/tmp; backups in
engine/out/bak_r5/<unit>/. If agents are gone, brief fresh ones from the unit checkpoint + the two round-5 docs.


## HANDOFF 2026-10-17 (Jade paused to install updates; read this first)
**State: idle and safe.** No agents, renders, crons or edits in flight. All src edits are complete and pass `node --check`.
Leftover orphan headless Chrome from an old crashed render (~2 days old, parent = systemd) is harmless; a reboot clears it.
Disk: ~27 GB free on / (97% full): keep review output small, TMPDIR=engine/out/dev/tmp always.

**What Jade has:** engine/out/review/half2_v3.mp4 (540p, whole half 2, 86.385-207.2), sent 10-16 ~16:20. It fixes her 3 v2 notes
(sleeve patch on the orange band; beam/prop collisions 458 -> 0; foot support 141 -> 0, all cross ON the Room B bridge).

**Done since v3 (10-17), NOT yet in any mp4:** her end-card notes, in engine/src/scenes/act5/spread.js (backup out/bak_r4/captions/):
- 1:47 of the v3 file (= song 193.4): "Charlie wrote this about product management in 2011." / "We shipped The Vibe Coding Song in 2026."
- 1:54 (= song 200.75+): subtitle under the pencil 一笔一画 = "The Vibe Coding Song" (was "stroke by stroke").
- Stills: engine/out/review/act5/captions/{before,after}_{193.4,201.8}.png. Logged in docs/decisions.md; title rule in project memory.
- NB timestamps Jade gives on half2 files are FILE time: song time = file time + 86.385.

**Waiting on Jade:**
1. Her remaining notes on half2_v3 (so far only the end-card captions).
2. 4 open items on docs/pages/decisions.html: f-model-r6, f-talos-level, f-turn, f-headphones (details in the ROUND 4 block).
3. Whether to also change "stroke by stroke" in the act-1 cold-open gloss / lyric subtitles (I left them: they translate, they don't title).

**Next work, in order, once she replies:**
1. Apply her v3 notes (sort by owner; each unit's checkpoint is in engine/checkpoints/; the old agents are gone, so brief fresh agents
   from docs/round4_build_brief.md + the unit checkpoint, and review their sheets before showing Jade).
2. Re-stage with the new motion (src/core/motion, API in checkpoints/motion_r2.md): battle 107-123, Act IV 123.354-173.02, Act V 173.02-207.2;
   add lipSync on the singing beats. Fix the 124.6 dusk foreground (world_look). Small: Jade's 3rd-hey hop lands 0.09 s late; Room A hat
   shot heroes small.
3. If f-turn = native: re-render the turn 77.76-86.4 with native heroes and check seams. If f-headphones = everywhere: sprite mock first.
4. Render half2_v4 (command below, -> out/review/half2_v4.mp4), check sheets, send. Then the 1080p master with `--mblur 8 --shutter 0.33`.

**Commands (from engine/):**
- `export TMPDIR=$PWD/out/dev/tmp`
- half 2 review: `node render.js --show main --from 86.385 --to 207.2 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b --mp4 out/review/half2_v4.mp4 --audio --workers 3` (~3 min; first make sure out/dev/talos_dump.json does NOT exist)
- stills: `node render.js --show main --stills 193.4:a.png,201.8:b.png --res 1920x1080 --fig native --figscale 1.3 --figres 2.5 --look k08b`
- decisions page: edit docs/decisions_open.json, then `python3 tools/build_decisions_page.py`
- to resume: `cd ~/Documents/vibesong && claude --resume` (or `claude --continue`), then say "read docs/RESUME.md and continue".


## ROUND 4 (2026-10-16): half-2 cinematic pass. CHECKPOINT ~16:05 CDT
**Read in order:** this block, docs/round4_build_brief.md (shared rules for units), docs/half2_cinematic_pass.md (plan + Status amendments),
the last two sections of docs/decisions.md (Jade's answers ~11:00; her notes on half2_v2 ~15:15), memory jade-character-rules.md (canon changed today).

**Where we are.** Jade approved the plan; all units built behind flags (default renders byte-identical). half2_v2 (engine/out/review/half2_v2.mp4,
540p, rendered with `--fig native --figscale 1.3 --figres 2.5 --look k08b`, sheets half2_v2_sheet_0-3.jpg) was sent to Jade ~15:00.
Her notes on it (all three being fixed): (1) sleeve patch must sit ON the orange band -> DONE models r6d/r6e (+ black crop top with bare
midriff per inputs/jade_anime.png; RARE EARTH narrowed to stay on the flat back); (2) a laser cut through a solid; (3) players walked through
the tripod -> talos_r4 M5 added a per-frame beam/prop collision check (458 -> 0 failures). Coordinator then found heroes crossing Room B's
gap in mid-air beside the bridge -> talos_r4 M6 DONE (support + beam + prop checks all 0). half2_v3 SENT TO JADE ~16:20 (engine/out/review/half2_v3.mp4), waiting on her notes; next = step 2 below.
10-17: end-card captions fixed per Jade (spread.js: product-management caption, "We shipped The Vibe Coding Song in 2026.", title subtitle "The Vibe Coding Song"); next half-2 render picks it up.

**Units (all checkpoints in engine/checkpoints/; agents are resumable only in this session, otherwise brief fresh from the checkpoint):**
| Unit | State | Checkpoint | Key outputs |
|---|---|---|---|
| models_r6 | DONE (r6e approved) | models_r6.md | out/review/models/r6/canon_r6e.jpg; rig:true default on --figres 2.5 (opt-out --figrig 0) |
| motion_r2 | DONE (r2c approved) | motion_r2.md | src/core/motion/*; API + snippets in checkpoint; drift_check.mjs (0 drift) |
| world_look | DONE (M3 approved) | world_look.md | --look k08b; leftover: 124.6 dusk foreground muddy |
| flood_k09 | DONE (m6b approved) | flood_k09.md | k09 wave on --look k08b; out/review/flood_k09/flood_k09_m6b_* |
| talos_r4 | DONE (M6 approved) | talos_r4.md | drop.js/verse2.js/talos_plan.js; old staging in drop_v2/verse2_v2 (?pb=v2) |

**Next steps, in order:**
1. Review talos_m6 (support/beam/prop counts 0; watch the Room B crossing ON the bridge at ~105.7-107.15). Then re-render half2_v3 with
   the same command as v2 (from engine/, TMPDIR=$PWD/out/dev/tmp; `node render.js --show main --from 86.385 --to 207.2 --fps 30 --res 960x540
   --fig native --figscale 1.3 --figres 2.5 --look k08b --mp4 out/review/half2_v3.mp4 --audio --workers 3`, ~3 min), check sheets, send to Jade.
2. Not yet re-staged with the new motion (told Jade): battle 107-123 (stage dressing, bugs walk, hit-stop), Act IV (paper ground in the erased
   world, Eraser face, all nine in one wide, cart wheels), Act V; lip sync on singing beats (lipSync API exists, no scene calls it yet).
3. Then the 1080p master with `--mblur 8 --shutter 0.33`.
**Open on Jade's page (docs/pages/decisions.html, 4 items):** f-model-r6 (her model incl. latest sheet), f-talos-level (level svg, Room B re-laid
like k08b), f-turn (the 1:17.8-1:26.4 turn still uses carve heroes -> visible model switch at 86.4; rec: native there too), f-headphones (half-1
sprites too? rec yes with a mock first). Edit docs/decisions_open.json then `python3 tools/build_decisions_page.py`.
**Gotchas:** TMPDIR=engine/out/dev/tmp always (/tmp full); disk ~29 GB free; account session limits can kill agents mid-edit (check files with
node --check + A/B before continuing); the "一笔一画 Half Two" claude.ai artifact no longer exists (source docs/pages/half2_design.html).
Spend this round: $0 (code only).

## HANDOFF FOR THE NEXT INSTANCE: read this block first

**Situation.** Round 3 (second half, 86.385–207.2) finished overnight while Jade slept. Before she went to sleep she said: "make the open decisions
yourself, I trust your judgement." Every unit stopped at a state I approved, and each one has a current checkpoint. **Nothing is running:**
no agents, renders or cron jobs (the CronCreate checkpoints were session-only and are gone). Jade has NOT watched anything from
round 3 yet. Her last words were "good night... you're doing great work." Her next message will most likely be notes on the cuts.

**Your first reply to Jade:** point her to `engine/out/review/half2_v1.mp4` (the whole second half in one file), then go through the
5 "Needs you" items in the Morning summary below. When she sends notes, sort them by owner (table below), brief a fresh agent
from that unit's checkpoint (the agents from last night are gone), and review its sheets/keys before you show her anything.
Log each decision in docs/decisions.md.

**Order of truth when docs disagree:** Jade's own words, then memory (jade-character-rules.md), then docs/decisions.md, then
docs/game_design_acts3-5.md (status DECIDED), then this file. Sections 2–3 further down were written before round 3 and have been
overtaken (see the notes on them).

**Owners and checkpoints (engine/checkpoints/):**
| Range / thing | Files owned | Checkpoint | Approved cut |
|---|---|---|---|
| Pre-battle 86.385–107.15 | act3 drop.js, verse2.js, prebattle_props.js | prebattle.md | out/review/prebattle/prebattle_v2.mp4 |
| Bug battle 107.15–123.354 | act3 battle.js, battle_cast.js, battle_fx.js (stage.js/rap.js are thin entries) | battle_scene.md | out/review/battle/battle_v4.mp4 (v3 is the fallback) |
| Battle UI overlay | src/show/battle_ui.js | battle_ui.md | out/review/battle_ui/ |
| Act IV 123.354–173.02 (M3 Eraser rule, M1 boss recruit, M2 rebuild/cart/speedrun/bar) | act4/*, BAR2 in build_bar.js (additive; Act II's bar untouched) | act4_ship.md | out/review/act4/act4_m3, _m1, _m2 .mp4 |
| Act V + outro 173.02–207.2 | act5/* (hud5.js, route5.js, doodles.js) | act5_ship.md | out/review/act5/act5_v7.mp4 |
| Native hero models | src/core/heromodels/ (sdf.js, heroes.js), FIGURE_SRC in src/core/voxfig.js | models.md | out/review/models/*_r5 / _r4 / _r3 |
| Bugs + Eraser creatures | src/core/creatures/ | creatures.md | out/review/creatures/*_r2.jpg |
| Half 1 (0–86.4), approved by Jade | act1, act2, turn | act1_ship.md, act2_ship.md, act3_turn_ship.md | out/review/half1_v5.mp4 |

**What would change with her answers (plans are ready, nothing has been built):**
- *Likeness notes on the native Jade (r5):* go to models (heromodels/heroes.js, Jade's head). After that, re-render the cuts that show her face
  (start with battle_v4 and act4_m1, then re-stitch half2_v1). Do not iterate on likeness without her notes.
- *"Native heroes everywhere"* (flip FIGURE_SRC to 'native'): this touches every 3D act, including the approved half-1 turn (77.76–86.4)
  and density's world. Check the turn's 2D→3D landing and the 41/77 seams, and scale-check the shots that were framed for carve heights
  (carve ≈52 units tall, native ×1.3 ≈69). Render half1's 3D tail plus half2 again and check the seams frame by frame. Back up src first.
- *Headphones* (two approved paper assets show them: the bridge singing clip at 125.77, which also appears in the 168–172 montage, and the
  outro spread's right page): (a) an image-edit pass (~$0.10–0.50, can shift likeness), (b) a re-take, or (c) keep them as part of the
  paper look. This is an art-dept request (engine/ART_REQUESTS.md). Show her a still before swapping any clip.
- *Skid-Eraser eyes (Act I ~34.3):* an art request to match them to the heavy-lidded chase Eraser (~$0.10–0.30). It touches approved half 1,
  so re-render act1 around 33–36 and diff against half1_v5.
- */tmp cleanup:* only with her explicit OK. It is the rewind-take-two project's scratch (/tmp/claude-1000/-home-jade-Documents-rewind-take-two),
  not ours.

**Environment gotchas (learned the hard way last night):**
- **/tmp is a 16 GB tmpfs and 98% full.** Prefix every render with `TMPDIR=$PWD/out/dev/tmp` (from engine/). Without it, Chrome and ffmpeg
  fail in confusing ways.
- **Root disk is 97% full (31 GB free).** half2_v1.mp4 alone is 115 MB, and the frame caches are large. Ask Jade before deleting old review
  versions (the candidates are in section 6).
- **Edit shared files atomically:** copy the file, edit the copy, run `node --check`, then `mv` it over the original. Twice last night a
  half-written heroes.js/voxfig.js made renders come out silently wrong or fail.
- **Don't run one `--stills` call across both Act IV and Act V:** it can lose the GPU context. Render each act separately.
- **Act IV renders at fov 45 on purpose** (main3d.js lookFrom doesn't update the projection; the battle hand-over matches it). Don't "fix" it
  unless you plan to re-frame all of Act IV.
- **Review renders of the second half use** `--fig native --figscale 1.3`. Without them you get the carve heroes and different framing.
- `ffmpeg -ss` can land one frame late. Compare by frame index or with direct stills.
- If the machine was rebooted or updated, run the smoke test in §0 before anything else.

**Re-render commands (from engine/):**
```bash
export TMPDIR=$PWD/out/dev/tmp
# whole second half (~3,624 frames)
node render.js --show main --from 86.385 --to 207.2 --fps 30 --res 960x540 --fig native --figscale 1.3 \
  --mp4 out/review/half2_v2.mp4 --audio --workers 3
# one section, e.g. the battle
node render.js --show main --from 105 --to 126 --fps 30 --res 960x540 --fig native --figscale 1.3 \
  --mp4 out/review/battle/battle_v5.mp4 --audio --workers 3
```
(Check `engine/out/review/half2_v1.log` for the exact flags used last night if anything differs.)

**Budget:** $500 overall cap. Overnight spend was $2.15 of a $15 overnight cap (mocks only; all builds were code-only). Round 2 art spent $4.31.
Every paid-gen step needs its own cap, and its spend goes in that unit's checkpoint.

**Sharing:** the design page for Charlie and Ricky (https://claude.ai/artifact/8mZdwYEJGbSqq8EBsQxA1U) no longer exists as of 2026-10-16 ~14:00 (deleted or unshared). The source is still docs/pages/half2_design.html (v2); republish only if Jade asks.
It is private. Only Jade can share it. If cuts change, update that page in place (same file path, same URL), don't create a new one.

**Transcripts for exact details:** round 3 is `~/.claude/projects/-home-jade-Documents-vibesong/403d79b5-caea-45a3-8d32-3d77a3ecf8ab.jsonl`,
round 2 is `76555f03-a4c7-4120-a7f3-503912b5cb7c.jsonl`. Backup of this file before this edit: engine/out/dev/RESUME_bak_2026-10-16.md.

---


Sections 0–7 below: written 2026-10-15 at the end of round 2 ("start shipping"), before Jade restarted the machine to install updates.
Read this file first, then whatever it points to. Nothing is running: no agents, no renders.

## 0. First thing: smoke-test the render pipeline (the updates may have changed it)

The renderer depends on system pieces that an update can move:
- Chrome: `/usr/bin/google-chrome` (153.0.8010.36 on 10-15), driven by `puppeteer-core` 23 (override with `CHROME=`).
- NVIDIA driver 550.163.01 on the RTX 3090; Chrome renders through ANGLE/Vulkan (`--gpu vulkan`, the default).
- ffmpeg is NOT on PATH: render.js finds it through a Python venv's `imageio_ffmpeg` (override with `FFMPEG=`).
- Node v22.23.2.

```bash
cd /home/jade/Documents/vibesong/engine
nvidia-smi --query-gpu=name,driver_version --format=csv,noheader
google-chrome --version
node render.js --show main --res 960x540 --stills 23.8:out/dev/smoke_a.png,104.6:out/dev/smoke_b.png
```
Look at both stills. 23.8 is the 8-bit Act I and 104.6 is the 3D world with the sculpted heroes. If they look like
`out/review/act1_v5_keys/` and `out/review/density/p2c/`, the pipeline is fine. If the frames come out black, slow
(much more than ~0.25 s/frame at 1080p) or fail to launch, the GPU path broke: try `--gpu gl`, check the driver, and
use `--gpu swiftshader` only as a last resort (very slow). Speed numbers are at the bottom of engine/README.md.
**Disk is 97% full (31 GB free on 10-16).** Delete old review versions before any big render (see section 6).

## 1. Where we are

**Update (10-15 late): second-half game design drafted, awaiting Jade:** docs/game_design_acts3-5.md (pacifist JRPG:
bug battle = turn-based with dual/triple techs, bugs recruited as features; Eraser rule fixed (erases graphite only,
color floats); final boss recruited via `> an eraser`; second LV2->LV3 bar; 3D-native heroes ~96 voxels tall recommended,
which answers §2.1 if she approves). Don't build until she answers its "For Jade to decide" list.
### Morning summary for Jade (written 04:05, updated 04:40, 10-16)
**Ready to watch: START HERE → `engine/out/review/half2_v1.mp4`** (the whole second half, 1:26-3:27, one file, 3,624 frames checked,
seams verified; sheet `engine/out/review/half2_v1_sheet.jpg`). Per-section cuts below (960x540 with audio; native 3D heroes, which you haven't approved yet, so they're only in these review cuts):
- 1:26-1:47 before the battle: `engine/out/review/prebattle/prebattle_v2.mp4`. Your slashes make the slabs, Charlie tags the order, Ricky's beam
  links them into a bridge; the room-1 moves in 3D; Ricky tests the stone "e"; the first bug sightings.
- 1:47-2:03 THE BUG BATTLE: `engine/out/review/battle/battle_v4.mp4`. Encounter, 5 turns with dual/triple techs, Victory flood, the recruit.
- 2:01-2:23 the Eraser rubs out the graphite, color floats, the lock: `engine/out/review/act4/act4_m3.mp4`.
- 2:19-2:36 the Eraser joins: `engine/out/review/act4/act4_m1.mp4`. `> an eraser`, glider lift, gray → pink, cap, party 8 → 9.
- 2:27-2:55 the rebuild, all nine, the party cart, 出发, the speedrun and 99% → 100%: `engine/out/review/act4/act4_m2.mp4`.
- 2:52-3:27 drop 2 + outro: `engine/out/review/act5/act5_v7.mp4`. "100% · LOADING…" in the silence, the bar shatters, "✓ LEVEL LOADED",
  a world-map route with flags and nine party dots on the photoreal 一, lamp + pink-Eraser doodles in the sketchbook margins.
- Hero models: `engine/out/review/models/` (face_jade_r5.jpg, turnarounds_r3.jpg, inscene_r4.jpg, caps_inhand_3x.jpg).
- Bugs/Eraser: `engine/out/review/creatures/` (upright_sheet_r2.jpg, features_sheet_r2.jpg, eraser_sheet.jpg).
- Page for Charlie/Ricky (share it from its menu): https://claude.ai/artifact/8mZdwYEJGbSqq8EBsQxA1U
**Still in progress:** nothing. Every team stopped at an approved state with a current checkpoint.
**Needs you:**
1. Your face on the new 3D model (face_jade_r5.jpg and the cuts). Likeness is your call; I stopped iterating at r5.
2. OK to make the native 3D heroes the default for the whole video? (Today they're used only in review cuts.)
3. Headphones still appear in two approved paper assets: the bridge singing clip (2:05) and the outro sketchbook's right page
   (you, now); the PAPER clip also appears in the 168-172 speedrun montage. OK to try edit passes (small cost, could shift likeness), re-take them, or decide headphones are part of the paper look?
4. ~~Skid-Eraser eyes~~ DONE 10-16 (heavy lids, $0 pixel edit; clip engine/out/review/act1_eraser_eyes_v1.mp4; half1 needs a re-render to pick it up).
5. /tmp: Jade OK'd cleanup 10-16. ~1.3 GB of idle rewind-take-two folders qualify (see decisions.md 10-16); the rm was blocked by the permission check, so it's pending her running it. The 3 big folders belong to open sessions: leave them.
Spend overnight: $2.15 of the $15 cap (mocks only). Pre-battle v2 re-rendered with the fixed pencil caps at 04:02.

**Overnight 10-15 -> 10-16 (Jade asleep; she said "make the open decisions yourself, I trust your judgement"):**
All decisions + gate verdicts are logged in docs/decisions.md (2026-10-15 late + "(overnight)" lines). Overnight spend cap $15.
Spend: $2.15 so far (mocks only; all builds are code-only).

| Unit | State | Gate verdict | Next | Checkpoint |
|---|---|---|---|---|
| m3 mock fix | DONE | passed (pants/straps/bands/patch/Charlie cap OK at 3x); page republished v2 | none | engine/out/mocks/half2/spend.txt |
| BATTLE UI (src/show/battle_ui.js) | DONE | PASSED (out/review/battle_ui/) | none; the battle team may make the one-line tag-overlap fix | checkpoints/battle_ui.md |
| CREATURES (src/core/creatures/) | DONE (r2) | r1 + r2 PASSED (out/review/creatures/, *_r2) | none; the battle team flips STANCE to upright | checkpoints/creatures.md |
| MODELS (FIGURE_SRC switch, default 'carve'; render.js --fig native --figscale 1.3) | pencil-cap fix RUNNING | r1 no; r2 provisional; r3 bodies PASS; r4 accepted; r5 = morning candidate | r4: Jade face toward k09, hair grooves not speckles, Ricky hair, Charlie cap -> _r4 face sheets | checkpoints/models.md |
| BATTLE SCENE (act3/battle.js, battle_cast.js, battle_fx.js; stage.js/rap.js are thin entries) | DONE (v4 approved) | v4 APPROVED = morning cut: out/review/battle/battle_v4.mp4 (v3 fallback) | v4: widen the 107.7 master, Charlie unobstructed at 121.5, re-render with the r4 heads (if r4 is >60 min late, render with r3 heads) -> battle_v4.mp4 | checkpoints/battle_scene.md |
| PRE-BATTLE (act3 drop.js/verse2.js, 86.385-107.15) | DONE (v2 approved) | v2 APPROVED = morning cut: out/review/prebattle/prebattle_v2.mp4 | none tonight | checkpoints/prebattle.md |
| ACT IV (act4/*, build_bar.js LV2->LV3) | M2 RUNNING | M1 APPROVED (out/review/act4/act4_m1.mp4) | M1 -> stop for review; then M2 rebuild/gang/cart/speedrun/bar, M3 Eraser rule fix (color shells) | checkpoints/act4_ship.md |
| ACT V (act5/*: toast, bar LOADING/shatter, world-map route + 9 dots, outro doodles) | v7 RUNNING | - | -> out/review/act5/act5_v7.mp4 | checkpoints/act5_ship.md |

Next actions (coordinator, as of 01:24): (1) when models writes "pencil caps fixed": check the 3x stills, then have the battle
and prebattle teams re-render their approved cuts (mp4 + stills only, no other changes); (2) review Act IV M2 -> then M3 (Eraser rule
shells) if time allows; (3) review Act V v7; (4) by 3:47 write the "Morning summary for Jade" at the top of this section.
Morning cuts so far: out/review/prebattle/prebattle_v2.mp4 (86.4-107.15), out/review/battle/battle_v4.mp4 (107.15-123.35),
out/review/act4/act4_m1.mp4 (141-156). Models: out/review/models/face_jade_r5.jpg + *_r3/_r4 sheets (default still 'carve').
Deferred to Jade (touch approved art or likeness): headphone removal on the bridge clip, skid-Eraser eyes. Act IV renders at fov 45
by design (lookFrom); the Act IV team made it explicit.
Battle mocks (image model + code UI, $1.08): engine/out/mocks/half2/. Page for Charlie/Ricky: https://claude.ai/artifact/8mZdwYEJGbSqq8EBsQxA1U (source docs/pages/half2_design.html).

The 8-bit half (0–1:26.4) is shipped for review: **engine/out/review/half1_v4.mp4** (960x540, audio, 1:26.40).
The seams at 41.028 and 77.757 are verified frame for frame. Jade has the link but has NOT watched it or given notes yet.
**Update (10-15, Jade's notes on v4):** the level card now reads "The Vibe Coding Song / (一笔一画)" instead of
LEVEL 1-1 · DRAFT / PASSWORD (act1/common.js buildLevelCard). Character-select hops are evenly spaced every 3 beats
(cues.json select_hops 7.183/8.466/9.749), so each hero is on screen for ~1.28 s; Jade used to get only 0.46 s. Charlie's
and Ricky's demos were compressed to fit. The new cut is out/review/half1_v5.mp4. Backups are in engine/out/bak_2026-10-15b/.

| Unit | State | Checkpoint / output |
|---|---|---|
| Act I (0–41.03) | DONE v5, real A-2 art | engine/checkpoints/act1_ship.md · out/review/act1_v5.mp4 (+ _keys/) |
| Act II (41.03–77.76) | DONE v6, 41.028 seam matched | engine/checkpoints/act2_ship.md · out/review/act2_v6.mp4 (+ _keys/) |
| Turn (77.76–86.4) + act3.drop's 86.385 click | DONE v13 (review final of this round) | engine/checkpoints/act3_turn_ship.md · out/review/turn_v13.mp4 (+ _keys/) |
| 3D density | phases 1, 2, 2b, 2c DONE | engine/checkpoints/density.md · out/review/density/{,p2,p2b,p2c}/ |
| Art dept | DONE A-2, A-3, A-4 (with canon fixes). Spend $4.31 | engine/ART_REQUESTS.md · assets/sheets/NOTES.md, CHECKPOINT_a2.md |
| Acts III-rest / IV / V / outro (86.4–~207) | from round 1, not touched in round 2 except density's world | checkpoints/teamB.md, teamC.md, teamD.md · act3_v9, act4_v7, act5_v4–v6 |

## 2. Waiting on Jade (written in round 2; mostly overtaken)

> **Overtaken in round 3:** item 1 was answered by building the 3D-native models (Jade approved the plan in game_design_acts3-5.md; she still needs to approve the likeness and the default flip). Item 2 was decided: headphones OFF (Jade). Item 3 is still open (Morning summary #4). Item 4 was decided: TIP stays at A7 only.


1. **3D hero direction.** After three polish rounds the sculpted voxel figures (src/core/voxfig.js) beat the flat
   sprites but are still short of the concept keyframe keyframes/concepts/k08b_coop_crossing.png (and k07_the_turn_plaster.png).
   Remaining flaws: Jade's long hair reads as a black mass at 3/4; Charlie's side curls cover his face in profile and
   from behind; the bun pencils read as antennae/horns; jacket and pants are slightly patchy in some shots.
   Options: (1) accept; (2) build hi-detail 3D-native hero models; (3) hybrid.
   **Our recommendation is (3)** for this cut: keep the current figures for wide and running shots, and hand-polish the
   close-ups at **1:41 (co-op crossing, cam range 101.01–102.245)** and **1:47 (stage, 107.14–108.675 + 109.645–110.405)**.
   Do (2) later if there's time and budget.
2. **Orange headphones.** docs/bible.md lists them, but no sprite has ever drawn them, so they're OFF. Ask: on or off?
3. **Skid/peer Eraser eyes (Act I ~34.3).** They're round cartoon eyes, unlike the heavy-lidded chase Eraser. We offered
   to match them (an A-2-style art request, about $0.10–0.30).
4. Small (Jade's call): the TIP text "TIP: color is hard to erase" is at A7 only; she wrote "A1 & A7". We kept A1
   wordless so it stays a clue, and offered to add it there too.

When she gives notes on half1_v4, sort them by owner (Act I / Act II / Turn / density / art), the same split as round 2.

## 3. If she picks... (round-2 plans; the hybrid/accept options are moot now that native models exist)

- **Hybrid (3):** a new "hero close-up" unit. Per close-up shot: a per-shot override in voxfig (camera-facing hair
  volume with strand cuts and a lighter rim instead of a black mass; Charlie's curls pulled back off the cheek in the
  side view; bun pencils stuck THROUGH the bun like hair sticks, X crossing hidden inside the bun (bible canon), so they stop
  reading as antennae; flatter
  jacket panels). Compare side by side with k08b at the same framing. Render only the two shot ranges above for review,
  then the full 77.76–123.35 range to check that the wide shots are unchanged.
- **Accept (1):** no hero work. Move on to her notes on half1_v4, then the second half (Acts III-rest to V) with
  density's world.
- **3D-native (2):** scope it first (modeling approach, time, cost) and get her OK before building. It touches every
  3D act (B, C and D teams' shots).
- **Headphones ON:** art request for the A-2/A-3/A-4 strips that show Jade's head (portrait, run, dangle, turnarounds),
  plus voxfig re-carve. Audit the canon after (see section 5).

## 4. Known minor issues (acceptable; fix only if Jade flags them)

- Act I A4 linked-freeze silhouettes overlap slightly.
- ~41.8: Charlie swoops left fast after Ricky lets go (story motion, but it can read as a jump).
- 81.8: the parachute descent is still flat pixel art. The look switches to the 3D sculpted figures at landing.
- Ricky's left (fret) hand is mostly hidden behind the guitar neck from the usual cameras; no hand-keyed animation.
- Mesa A grass reads a little gravelly at the 101.5 low camera.

## 5. Rules that always apply

- **Jade's character canon** is in memory (jade-character-rules.md): pencils in an X through the bun, yellow bodies, one blue cap
  (rainbow core) and one pink/orange cap (graphite core); the hair rule (up in a bun with pencils, DOWN from 17.38 with the twin-pencil draw); white jacket with
  orange stripes, black crop top, small pale-blue chest dot, 1420 MHz patch; back = big dot + RARE EARTH.
  **Audit every frame you ship against it** (crop at 3x).
- Approved design: docs/game_design_acts1-3.md, with the "Round 2 notes". PAINT IT (Jade) / RUN IT (Ricky) / SHIP IT
  (Charlie). Color is hard to erase. Prompt `> level up reality`. Log every decision in docs/decisions.md.
- LOC counter: +1 per drawn stroke/block; decreases only while the Eraser rubs graphite; colored lines are locked.
- No real photos of anyone; illustrations only.
- Budget: $500 overall cap. Art batches get their own cap (round 2's was $25; it spent $4.31). Log spend in the checkpoint.
- Work style Jade liked: delegate units to subagents that each own files and write a checkpoint in engine/checkpoints/
  as they go; the coordinator stays lean, reviews sheets/keys, and sends notes. Show her keyframes or a sheet before
  any long or expensive run.
- Shared-core ownership: the Act I team owned the choreo formation, the HUD (core/ui.js) and the loc.js ACT I block;
  the Act II team owns src/show/build_bar.js. Cross-team needs go in engine/CORE_REQUESTS.md / ART_REQUESTS.md.
- Read engine/HANDOFF_ACTS.md before writing a scene. Seam contracts: HANDOFF_41.md, HANDOFF_77.md, HANDOFF_123.md.

## 6. How-to

```bash
cd /home/jade/Documents/vibesong/engine
# review range with audio
node render.js --show main --from 0 --to 86.4 --fps 30 --res 960x540 --mp4 out/review/half1_v5.mp4 --audio --workers 3
# contact sheet only (one frame per beat)
node render.js --show main --from 77.76 --to 123.35 --res 960x540 --sheet out/review/x_sheet.jpg --sheet-only
# stills (+ labelled sheet)
tools/stills.sh out/dev/x 1920x1080 101.5 108
# live preview
node render.js --serve   # http://localhost:8123/web/?show=main&t=101.5&w=960&h=540
# dev turntable for the heroes: show 'dev' t 40..76 (Jade close-up 66-68.5, Charlie hat/hatless 68.5-70, Ricky 70-72)
# keyframe mocks: show 'mocks' (src/scenes/mocks/)
```
- Gotcha: `ffmpeg -ss` on a review mp4 can land one frame late. Compare by frame index (round((t - start) * 30)) or
  with direct stills.
- Voxel heroes: `Actor.voxel()` gives the sculpted figure by default; `{ figure: false }` gives the old extruded sprite
  (the 2D phase of the turn uses it to pixel-match Act II). Charlie hatless: `set({ hat: false })`.
- Backups: engine/out/bak_2026-10-15/ (src before round 2), out/bak_density_p2/, out/bak_density_p2b/.
- Disk cleanup candidates (ask Jade before deleting): superseded review versions in out/review/
  (act1_v1–v4, act2_v1–v5, turn_v10–v12b, half1_v3) and their _keys/ folders.

## 7. Links

- Review page artifact (decisions store): https://claude.ai/artifact/FhEr3QNn8JzPRh2VXuReLx
  (artifact links have died before when auth dropped; docs/decisions.md is the mirror of record). Optional: put
  half1_v4 and the density sheets on it for Charlie and Ricky.
- Previous session transcript (for exact details):
  ~/.claude/projects/-home-jade-Documents-vibesong/76555f03-a4c7-4120-a7f3-503912b5cb7c.jsonl
