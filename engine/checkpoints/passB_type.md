# v4 Pass B · unit **type** · checkpoint (2026-10-18)

Status: **M1 approved by the coordinator with five calls (applied, see "M1 review"); M2 done on 85-135 and 55-62, STOPPED.** Gen spend: **$0** (code only, no paid gen; nothing in media/genlog.jsonl). **M3 (2026-10-18): word-timing audit done, 24 words re-timed (see "M3" at the end).**
M1 sheet: `engine/out/review/passB/type/m1_sheet.jpg` (1080p PNGs in `engine/out/review/passB/type/m1/`, v3.1 frames for comparison in `m1/before/`).

## What was built
Lyric type as overlay show entries (a new `type` block, last in show/main.js) plus `inWorld` flags in subtitles.js. Nothing is drawn inside
another unit's scene.

| entry | window | line | what |
|---|---|---|---|
| type.yibi | 11.40-13.00 | 4 一笔 一画 | graphite pixel note "stroke by stroke" under the title row on the page, world-tracked: "stroke" on 笔, "by stroke" on 画; gone before the level card (13.02) |
| type.void | 35.60-38.60 | 10 说出来 它就存在 | code comments under the VOID platform rows, typed on the two chord slams: `// say it out loud,` (35.64) / `// and it exists` (36.49); world-tracked |
| type.chufa | 73.60-75.40 | 17 一切从这里出发 | `// everything starts here` typed under the chant row once 出发 lands, gone with the row |
| type.zhan | 94.204-100.5 | 24 "...just blossoms" | big graphite 绽 drawn **one stroke per beat** (11 strokes on the 11 beats 94.204..98.292), last stroke on "blossoms", then it opens slightly and the strokes she just drew take a petal wash; gloss = the sung line in English, written in word by word as sung |
| type.wutai | 109.09-110.41 | 27 世界 是我的舞台 | 舞 and 台 together on ONE shot (proposal A): 舞 top-left in the rose light, 台 top-right in the teal light, gloss "the world is my stage" top centre |
| type.couplet | 123.354-125.769 | 34 是一幅画 也是一段代码 | split couplet (below) |
| type.da | 125.769-128.9 | 35 一笔一画 都是我的回答 | big graphite 答 in the bridge card's right margin, drawn stroke by stroke while "一笔一画 都是我的" is sung; held over the 128.18 cut onto the Charlie / Ricky split frame (moved onto the seam between the two portraits, clear of both faces) through the sung 答 (128.62); gloss "every stroke is my answer" |

**The look.** Moongazing's device (the held 你 over a small "I miss you.", 04_hook.js: ~540 px brush character in the 留白, ink creeping, 34 px
italic gloss) done in this video's own big-hanzi language: Make Me a Hanzi outlines drawn **stroke by stroke in true stroke order** (the
title's 一笔一画), graphite pencil fill with grain and hatch streaks, a graphite smudge that creeps out after the stroke, a yellow point at the
pencil tip while drawing (the colour rule: colour only at the tip / on what she just drew). Gloss = LXGW WenKai, the page's own hand (never
the Inter subtitle style). 2D glosses use the 2D world's own languages: graphite pixel type on the paper page, code comments in the editor.
Note: there is no giant 你 in this video; the reference is Moongazing 1:22 (critique doc "One huge character with a small gloss").

**The couplet** (once; the line-36 reuse was dropped). The frame under it (act4.main, the bridge) shown twice: the left half is the painting (a graphite sketch of the live frame on
paper: Sobel edges + value hatching + a faint wash of its own colours); the right half is the code (the editor navy, the same picture dimmed under
this engine's own `core/hanzi2d.js` source in pixel type, each glyph lit in the picture's colour). A torn paper edge is the seam. The sung line
crosses it on one baseline: 是一幅画 drawn in graphite on the paper, 也是一段代码 typed in syntax colours with a cursor on the editor's current line,
one character per sung syllable; glosses "it's a painting," (hand) and `// and it's also code` (comment).

## Changes (file:line) · backups in engine/out/bak_v4b/type/ (main.js.orig, subtitles.js.orig, chorus.js.orig)
- NEW src/scenes/type/lib.js: HanziVec (Path2D strokes, median reveal), graphiteGlyph, gloss, pixelText, schedule/progAt (canvas only, seeded).
- NEW src/scenes/type/beats.js: BIG configs (positions as frame fractions) + prepareBig/drawBig; drawGloss2D (yibi/void/chufa). `wutaiA` =
  the unused alternative layout (both characters on the 3D stage).
- NEW src/scenes/type/couplet.js: the split-couplet shader + type canvas.
- NEW src/scenes/type/overlay.js: the entry module. It renders the entries beneath it exactly as ShowRunner would (one entry, or the top pair
  with its transition, via show.renderEntry / show.comp), then its layer; stage.fx is forwarded so flashes/fades still come from the scene below.
- src/show/main.js:54-71: the `type` block, plus `onTop` (:66-71), which splits each type entry at every scene entry that starts inside it (ids `type.x#n`).
  The runner sorts active entries by t0, so this keeps a type entry on top whatever shot another unit puts under it.
- src/show/subtitles.js:31, 34, 39, 40: `inWorld: true` on lines 24, 27, 34, 35 (the bar never doubles a line drawn as type). Line 36 keeps its bar.
- src/scenes/act2/chorus.js:53-56: the cut snap, `OHS = P.OHS.map((e) => S(T.nearestBeat(e, 2)))` (the only change in that file).
- Dev only: engine/out/dev/type_mock.html (draws a type beat over an approved still; used for the 舞台 mocks, via `node render.js --serve` + puppeteer).

## Cut snap (chorus 1 "Oh oh oh"), measured
Frame-by-frame 540p stills 59.30-60.70, first frame of each flash (luma mean-abs-diff > 6) vs v3.1:

| sung onset | v3.1 cut | new cut | 8th grid | off |
|---|---|---|---|---|
| 59.555 | 59.567 (-76 ms) | 59.633 | 59.643 | -10 ms |
| 59.975 | 59.967 (-94 ms) | 60.067 | 60.061 | +6 ms |
| 60.425 | 60.433 (-45 ms) | 60.467 | 60.478 | -11 ms |

The whole "oh" event moves together (Ricky's chord click, switch, sparkle, 0.45 flash, shake); it now sits 50-90 ms after the sung onsets,
on the drum grid.

## Commands (from engine/, `export TMPDIR=$PWD/out/dev/tmp`)
- stills: `node render.js --show main --stills 98.75:out/review/passB/type/m1/t98.75_zhan.png,... --res 1920x1080 --fig native --figscale 1.3 --figres 2.5 --look k08b`
  (group stills per section; a stills call spanning 20.12 currently fails because the paper unit's p03 clip is not there yet).
- mocks: `node render.js --serve &` then `node <scratch>/mock.mjs 8123 wutai 109.78 ../assets/v4_stills/08_band_on_stage_0147.png out.png`.

## Checks so far
- node --check on every touched file. Stills render with 0 page errors from type code.
- Subtitle rule: lines 4/10/17 already inWorld; 24/27/34/35/36 now inWorld; the type entries carry their text. One subtitle style unchanged.
- No sung keyword over a face or the back of a head in the M1 frames (答 in the card margin; 舞/台 above/beside the players; 绽 in the ruins).
- Canon: type does not alter any figure; the frames under it are other units' (no new Jade art from this unit).
- Not done (M2): luma scan, cut-vs-grid over the section, UI budget at 1 fps, 540p section mp4.

## Open at M1 (items 1-5 were resolved by the coordinator; see "M1 review" below. Item 6 stays open)
1. **舞台 vs stage_3d.** stage_3d cuts to card 05 on 台 (109.81), so 舞台 is split across the cut (proposal B, in the show now): 舞 on the 3D
   stage, 台 in chalk on card 05's right curtain gap (card 05 has no really clean space). Proposal A (cleaner, sheet row "proposal A"): both
   characters on the 3D shot, which needs the 3D band shot held to ~110.1 (card 05 from ~110.1, or earlier in the line). My type entries
   must start at or after the scene they sit on (the runner sorts by t0); wutai2 uses card05's 109.81.
2. **答 lands before it is sung.** 答 is sung at 128.62, after the card cuts away (128.18), so the character completes on 回. If paper can hold
   the jade card to ~128.9 (or I may ride 答 over paper_listen's top seam), 答 can land on its syllable.
3. **绽's gloss is the Chinese translation** (MG rule: big key character + the line's translation). English viewers hear "blossoms" as the
   character blooms; alternative gloss: "blossoms". Line 24 lost its bar (Chinese viewers get the gloss).
4. **Couplet reuse (2:09.36)** is in the show; it reads, but 3.6 s of the split may be one too many. Keep, or drop type.couplet2 (and line 36's
   inWorld) to give the bridge's second couplet back to the 3D bar.
5. **Colour unit.** 绽's petal wash on its last strokes and the yellow pencil tip are the only colour in the type before 1:59. The type is drawn
   after the scene's post, so it is outside the global grade; if colour wants the type graded, that needs a hook in core (CORE_REQUESTS).
6. The 2D glosses (yibi, chufa) are placed against the current press_start / chorus frames; if open_close restages 0-14 s, yibi's position
   (`env.yibiAt`, world px) needs a re-check.

## M1 review (coordinator, 2026-10-18) and what changed
Backups of the type files at M1: engine/out/bak_v4b/type/{beats,lib,couplet,overlay}.js.m1.
1. **舞台 = proposal A.** One entry `type.wutai` 109.09-110.41 with both characters (beats.js BIG.wutai). The proposal-B pieces (wutai2, chalk
   台 on card 05) are removed. If stage_3d puts another shot inside the span, onTop() splits the entry so the type stays on top.
   In the M2 render, stage_3d already holds the 3D band shot through 110.41.
2. **答 persists across the 128.18 cut** to 128.9 (`type.da` + its split `type.da#1`). Card timing is unchanged. In the original right-margin spot it
   would sit on Ricky's face, so after the cut it moves onto the seam between the two portraits (BIG.da.after: box centred, S 0.42 H,
   light paper halo; gloss at 0.515 H between them). It is on screen when 答 is sung (128.62) and fades 128.82-128.9.
3. **绽's gloss is English**, the sung line "everything I love about life just blossoms", 0.036 H, written in word by word from lyrics_timed
   (lib.js gloss() now takes `n` = characters written, measured per prefix).
4. **Couplet 2 dropped.** No type.couplet2; line 36 has its subtitle back.
5. No core hook for the grade.

## M2 (540p, audio) · engine/out/review/passB/type/
Commands (from engine/, TMPDIR=out/dev/tmp, GPU shared, 1 worker):
`node render.js --show main --from 85 --to 135 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b --mp4 out/review/passB/type/m2_085-135.mp4 --audio --workers 1` (196 s)
and the same for `--from 55 --to 62` → m2_055-062.mp4. Logs: m2_*.log, 0 page errors.
Sheets: m2_085-135_sheet_01..04.jpg, m2_055-062_sheet_01.jpg (1 fps, labelled in song time). Cuts: m2_*_cuts.txt. Luma: m2_*_luma.txt.

| check | result |
|---|---|
| Luma-drop scan (YAVG drop > 35) | **PASS, 0 one-frame blips.** 85-135: two drops, both hard cuts (100.767 stage_3d, 129.400 paper_listen → bridge). 55-62: 57.467 (chorus cut) and 59.667 / 60.100 / 60.500, the frames after the three one-frame "oh" flashes (deliberate). |
| Cut-vs-grid, my cuts | "oh" flashes 59.633 / 60.067 / 60.467 = -10 / +6 / -11 ms **ON**. Couplet in 123.367 (+13 ms ON). 答 cut 128.200 (+20 ms ON). Couplet → bridge card 125.800 = +33 ms: the card's cue 125.769 falls between frames, so the first card frame is 125.800 (paper's cue, unchanged). |
| Cut-vs-grid, others in range (FYI) | 57.433 is +88 ms (chorus 1, outside my snap window; Tier 1 listed it), 107.167 is -71 ms, 121.400 is +58 ms, 113.833 is -52 ms (stage_3d's). |
| UI budget | Type frames hold only their type + its gloss: no HUD, no bar. Clear frames respected: 绽 starts at 94.204 (drop 1 ends 94.204), the couplet starts at 123.354 (the flood ends 123.354), and nothing from type falls in 80.81-94.204 or 119.0-123.354. Stage_3d's "!" markers at 108-109 and BUG → FEATURE stamps are theirs. |
| Subtitle audit | One style throughout (the rounded bar, its pixel twin in chorus 1). No line is both type and bar: no bar on 94.2-100.1 (绽), 109.1-110.4 (舞台), 123.35-129.34 (couplet + 答). Lines 26, 28, 30, 32, 36 and 37 keep the bar. |
| Faces | 答 stays clear of Jade's, Charlie's and Ricky's faces (margin, then the seam). 舞台 sits above the players. 绽 sits in the ruins. |

Open after M2: the 0-14 s gloss (yibi) gets re-checked after open_close lands. At 540p, 绽's English gloss (0.036 H ≈ 19 px) is small but
legible, and 39 px at 1080p.

## Cut snap 2 (coordinator, after M2): the chorus-1 "functions" cut at 57.433
- src/scenes/act2/chorus.js:58-61 adds the local `FUN = S(T.nearestBeat(P.FUN, 2))`, and every `P.FUN` in chorus.js now reads `FUN` (Jade's
  draw_rainbow anim, the HUD highlight entries, the flash list, shake, sparkle, the FUNCTIONS letters, the rainbow pencil, the 0.45 flash).
  P.FUNC_C is untouched. Backup before this edit (taken after the colour unit's tags): engine/out/bak_v4b/type/chorus.js.pre5743.
  plan.js's own FUN (57.42) still times the core flood, which radiates 0.09 s after the touch.
- Verified with 540p stills on every frame 57.067-57.633: the flash now starts at **57.333** (8th 57.345, **-12 ms**; it was 57.433, +88 ms).
  Still pair: out/review/passB/type/m2b_cut5734_pair.jpg (57.300 before the touch, 57.333 flash, 57.433 FUNCTIONS starting).
- Chorus 1 cut snaps now: 57.333 (-12), 59.633 (-10), 60.067 (+6), 60.467 (-11) ms.
- H15 (colour) was counted as satisfied by the coordinator: graphite type, with 绽's small wash and the pencil tip as earned colour.
- Waiting: the 0-14 s gloss (type.yibi) re-check after open_close lands.

## 0-14 re-check (after open_close landed): type.yibi removed
- The cold-open gloss card (~4-5.5 s) already glosses "stroke by stroke", so the 11-13 s note repeated it (coordinator).
- src/show/main.js: the `type.yibi` entry was removed (backup engine/out/bak_v4b/type/main.js.preyibi). Line 4 stays inWorld (no subtitle bar).
  The yibi drawing code in beats.js is kept but unused, and marked RETIRED in its header.
- node --check passes on main.js and beats.js. Still at 12.0 (540p): engine/out/review/passB/type/m2c_12.0_no_yibi.png shows no note and no bar.
- Type entries in the show now: void, chufa, zhan, wutai, couplet, da (+ split parts from onTop). Unit type: DONE unless called back.

## M3 (word timing audit) · 2026-10-18
Trigger: paper M3 found the verse-1 "because" was really "blossoms" held. I audited every word in analysis/lyrics_timed.json (234 words, 50 lines)
against the demucs vocal stem `work/demucs/htdemucs_ft/song/vocals.wav`. Gen spend: **$0**.

**Method.** (1) faster-whisper large-v3 free run, en + zh, word timestamps, no prompt (moongazing venv; it needs
`LD_LIBRARY_PATH=<venv>/site-packages/nvidia/{cublas,cudnn}/lib`). (2) stable-ts + MMS CTC forced alignment of the canonical text over
multi-line windows, so a word can land in a different line. (3) Teacher-forced whisper likelihood, both per word window (does [start_i, start_i+1)
sound like word i or a neighbour?) and as a boundary search (argmax_x LL(left|[a,x)) + LL(right|[x,b))). (4) My own onsets from 5 ms RMS,
log-mel flux, energy above 4 kHz and pyin f0, read from spectrogram plates. The rule I used: a word's time is the audible onset of its
syllable (the consonant after a silence or dip, else the vowel or note onset). That is the convention the existing data mostly follows.
Whisper and stable-ts start words about 0.1-0.15 s early on held notes, and they often slip one word early, so their flags alone were not
taken as truth. Every fix below is backed by teacher-forced tests plus a visible onset.
Full per-word table (old, measured, delta, whisper / stable-ts / CTC deltas, teacher-forced verdict, evidence):
`engine/out/review/passB/type/m3_word_audit.tsv`. Scripts and raw ASR / alignment JSON: `engine/out/review/passB/type/m3_tools/`.

**Result: 24 words off by more than 0.12 s, all fixed.** Three were whole structural slips: a word placed on the wrong note, so the line
lights one word early.
| line | word | was | measured | delta | evidence (short) |
|---|---|---|---|---|---|
| 5 | blossoms | 17.10 | **18.10** | +1.00 | the held note 18.10-20.11 is "blossoms" (TF: blossoms -2.5 vs because -10.4); 16.45-17.6 is still "just" |
| 6 | because | 18.10 | **20.13** | +2.03 | b release 20.13, /k/ 20.27; 20.10-21.16 = "because" (-1.7 vs my -9.4) |
| 7 | my | 20.12 | **21.16** | +1.04 | m 21.16, vowel 21.20 (paper M3, confirmed) |
| 7 | imagination | 21.18 | **21.42** | +0.24 | i 21.42, nasal m 21.50 (paper M3) |
| 10 | 存 | 36.40 | 36.18 | -0.22 | c burst 36.17; 36.40 was the dip before 在 |
| 12 | read | 43.72 | 43.50 | -0.22 | onset after silence 43.49; 43.72 is a pitch rise inside the word |
| 13 | I (that I need) | 52.54 | 52.37 | -0.17 | /t/ dip 52.32-52.36; whisper and TF boundary agree it is earlier |
| 16 | goes | 62.48 | **63.33** | +0.85 | 62.75-63.33 is still "everything" (-5.0 vs goes -12.8); g release 63.35 |
| 16 | from | 63.60 | **64.97** | +1.37 | f dip 64.97; 64.97-65.68 = "from" |
| 16 | there | 64.14 | **65.68** | +1.54 | dh dip 65.68; 65.68-66.5 = "there" (-1.9 vs -7.8) |
| 34 | 也是 | 124.39 | 124.15 | -0.24 | 也 onset (note 67 from 124.15); 124.39 was 是 inside the word |
| 35 | 都是 | 127.61 | 127.36 | -0.25 | 都 onset (d release 127.36) |
| 36 | 也是 | 130.85 | 130.56 | -0.29 | 也 onset after the 130.48-130.54 dip |
| 38 | read | 138.70 | 138.53 | -0.17 | onset after the 138.50 dip |
| 39 | I (that I need) | 147.22 | 147.01 | -0.21 | dip 146.98-147.00, parallel to line 13 |
| 41 | And | 154.26 | **155.90** | +1.64 | 153.0-155.45 is a wordless "oh" ad-lib (oh -4.2 vs and -6.6); 155.85-156.18 = "and" (-2.2 vs -10.5) |
| 41 | everything | 154.62 | **156.15** | +1.53 | after the d of "and" (dip 156.08-156.15) |
| 41 | goes | 156.68 | **157.50** | +0.82 | 156.93-157.5 is still "everything" (-6.3 vs -11.9) |
| 41 | from | 157.72 | **159.12** | +1.40 | f dip 159.1-159.3; 158.5-159.15 is still "goes" |
| 41 | there | 159.22 | 159.72 | +0.50 | dh dip 159.72; 159.72-160.6 = "there" (-3.3 vs -9.1) |
| 48 | just | 188.98 | **189.43** | +0.45 | dj after the 189.38 dip (TF boundary 189.40); 188.98 is a pitch rise inside "life" |
| 48 | blossoms | 189.68 | **191.22** | +1.54 | 189.36-190.45 = "just" (-1.4 vs -15.5); "blossoms" is re-sung at 191.22 after a 0.8 s gap (-2.9 vs that's -15.2) |
| 49 | that's | 191.30 | 191.95 | +0.65 | pitch restarts at 191.92 (TF boundary 191.95-193.15) |
| 49 | it. | 193.20 | 193.42 | +0.22 | **low confidence**: whisper 193.48 and TF 193.45, but it hinges on whether the 193.2 burst is the -ts of "that's" |
Worst: verse-1 "because" +2.03, chorus-2 "And" +1.64, "there" (ch1) / "blossoms" (outro) +1.54. Checked and left alone (within 0.12 s,
or the whisper-family "early" flag explained by its bias): all of lines 2, 8, 9, 11, 14, 17, 18, 24-33, 37, 40, 42, 43. Line 5 "I" is
-0.11 by onset (kept). Line 4 (breathy intro chant, inWorld, no consumer that shows it) and line 37 "一 画 都是" (fast, every source
agrees on the cluster) were not re-measured beyond the cross-check.

**Line boundaries.** 5 end 17.58 → 20.11. 6 = 20.13-21.14. 7 starts 21.16. 48 end 190.79 → 191.93. 49 starts 191.95. start_bar is updated on
6/7/49. Word ends follow the file's legato rule (next start - 0.01). Every moved word carries `m3_prev_start` + `m3_fix` (the evidence), and
moved line bounds carry `m3_prev_start/end`. A dated note is added to `notes`.
**Line 41's `start` stays 154.26 on purpose** (`m3_note` in the file): stage_3d's act4/main3d.js:69 keys its gang-vocal switch
`K.gang = T.line(41).start` (paper visibility, colour pour, chunk beats), which must not move, and main3d.js is not mine. Its bar still shows
from 154.14, with nothing lit until "And" at 155.90.

**Consumers, read before the data changed** (everything else reads words through T.* and follows on its own):
- `src/show/main.js:50`: **paper.p03 pinned** to `T.snap(20.1667)` with a comment. It was `nearestBeat(T.line(7).start, 2)`, which would have
  moved to 21.2. p04 (48.567), p06 (143.4), type.zhan t1 (100.5), type.wutai t0 (109.09), act4.paper_jade_sing t1 (128.18) and K.gang
  (154.26) are unchanged: I recomputed them all from the new data.
- `src/scenes/act2/chorus.js:639`: the "held there" bar hide was a fixed `S(64.6)` (old "there" 64.14 + 0.46). With "from there" now sung
  64.97-65.68, that hid the bar before both words were sung. It is now `S(T.word(16, 4).start + 0.46)` = 66.14, the same design re-timed.
  chorus.js READ (`T.word(12, 5)`) follows "read" to 43.50, which is data-driven, and its frames are in m3_034-045.
- Karaoke (core/ui.js subtitleFor → SmoothSubs, the act1/act2 pixel Subtitle, the act4 overlay, spread.js subIds [48, 49]): data-driven, no edit.
- Type glosses: couplet.js (line 34) now types 也 at 124.15 and 是 at the 也是 midpoint 124.47 (it was 124.39 / 124.59). type.da only reads
  W35[0] and word 6 (unchanged). type.void and type.chufa use fixed slam times (unchanged). type.zhan (line 24) is unchanged.
- Lip sync: act4/main3d.js `lipSync(lines [36, 37])` opens Jade's mouth for 也 0.29 s earlier (130.56). This is data-driven, in stage_3d's
  scene, and in the 123-149 render. I did not inspect it on the face.
- act1 kaizo.js: the 它就存在 bubble reveals 存 at 36.15 (it was 36.37, after the bubble had already greyed at 36.18). Everything else in act1
  is hard-coded or index-based (T.word(7, 3) "linked" and T.word(7, 7) "life" are unchanged).
- `docs/script.md`: a dated note appended at the end (:57 because → blossoms, :86/:173 chorus tails, :201-202 outro). The beats themselves are not rewritten.

**Backups** (engine/out/bak_v4b/type/): lyrics_timed.json.prem3, main.js.prem3, chorus.js.prem3, script.md.prem3. `node --check` passes on main.js and chorus.js.

**Renders** (540p, `--look k08b+cs --workers 1 --audio`, 0 page errors), in engine/out/review/passB/type/: m3_014-026.mp4, m3_034-045.mp4,
m3_050-067.mp4 (rendered before the chorus.js fix; good for line 13), **m3b_060-067.mp4** (after the fix), m3_123-149.mp4, m3_153-161.mp4,
m3_186-195.mp4.
**Sheets** (the frame before and the first lit frame at each corrected onset, subtitle crop or full frame, labelled with song time and the
stem's word): m3_sheet_014-026.jpg, m3_sheet_034-045.jpg, m3_sheet_050-067.jpg, m3b_sheet_060-067.jpg, m3_sheet_123-149.jpg,
m3_sheet_153-161.jpg, m3_sheet_186-195.jpg. In every row the word lights on the first frame at or after its new onset. 20.133 is still act1;
the p03 card cuts in at 20.167 exactly as before.

**Open (for the coordinator)**
1. **Act 1's "because" bridge** (kaizo.js / level.js, hard-coded 18.10-20.1, chewed letter by letter) now sits over the held "blossoms". The real
   "because" (20.13-21.14) starts 37 ms before the p03 card cuts in, so act1 has no slot to show it. kaizo/level are not mine and the fix is a
   design call: relabel the bridge, accept it, or put the word on the card. Not touched.
2. **No caption for "because" on the card.** paper_inserts.js cfg p03 `subs: [7]` (the paper unit's file), and line 6 is inWorld, so the card shows no
   bar 20.167-21.04. Line 7's bar starts at 21.04 with "my" on 21.16. Before, it showed 20.0-21.16 with "my" lit during "because". If a
   "because" caption is wanted: paper sets subs [6, 7], and I flip line 6 to inWorld false. That would also flash the bar in act1 at 20.01-20.167
   unless kaizo's id list drops 6.
3. **spread.js (another agent's file, reported, not edited):** `OUT.blossoms: 189.68` (the bloom) lands on "just". "blossoms" is 191.22.
   `OUT.thats: 191.30` (pull back) is during the re-sung "blossoms"; "that's" is 191.95. Its subtitle loop gives line 48 priority, so line 48's
   0.5 s hold keeps "(that's it.)" off until 192.43 (sheet row 191.967). Suggest hold 0 for 48 or checking 49 first.
4. Chorus 2's "oh" ad-lib 153.0-155.45 has no line, like chorus 1's line 15 "(Oh...)". Line 40's end stays 154.24, so its bar holds over the "oh" as before.
5. Line 49 "it." 193.42 is low confidence (see table). The outro tag is processed.
6. main3d's Jade lip sync on line 36 shifted with the data (above). stage_3d may want to look at 130-131.

## M4 (fresh-eyes findings 8 and 9) · 2026-10-18
Gen spend **$0**. Backups: engine/out/bak_v4b/type/m4/{ui.js,subtitles.js,overlay.js,couplet.js}.prem4 (only ui.js and subtitles.js changed).
**main3d.js was NOT touched** (K.gang still reads `T.line(41).start` = 154.26, the data is unchanged).

**Root causes**
- F9: `core/ui.js subtitleFor` keyed the bar to `L.start - lead`. Line 41's start is 154.26 (kept for main3d's K.gang), its first word
  "And" is 155.90. In v4 `battleOwnsSubs()` returns false (UI_V4), so act4 main3d's SmoothSubs showed line 41 as soon as line 40's 0.25 s hold
  ended (154.49).
- F8: not a capture of the previous frame. The couplet sketches the live frame of act4.main beneath it (overlay.js `under.render` → C.rt),
  and at 123.354-123.41 main3d's overlay was drawing line 33 again: line 33's 0.25 s hold (end 123.16) outlasts the flood clear frame
  (ends 123.354), so the stale bar popped back for 2 frames (123.367, 123.400) and got sketched into the paper half. v3 hid this with
  battle_ui `ownsSubs [107.03, 123.41]` ("would otherwise pop the stale line 33 back"), which v4's UI_V4 switched off.

**Fix (one function, both findings): src/core/ui.js subtitleFor :136-143** (core/ui.js has no unit owner; last edited by Tier 1 at 13:14; atomic write + node --check)
- the bar shows from `max(L.start, firstWord.start) - lead` (lead stays 0.12, the same lead every other line has). Line 41 now shows from 155.78.
- a clear frame that opens while a line is up ends that line: `CLEAR_FRAMES.some(([a, b]) => a > s0 - lead && a <= L.end + hold && t >= b)` → null.
  This fixes the stale line-33 pop for every consumer (couplet sketch and any scene), not only the couplet.
- src/show/subtitles.js header: the timing rule documented, and line 33 noted as never subtitled (wholly inside the flood clear frame).
- Other lines checked for the F9 pattern (line start earlier than its first word by > 0.3 s): **none**. Every other subtitled line's first word
  == its start (delta 0.00), so their bars are unchanged. Clear-frame rule side effects: lines 18 / 32 / 38 are already gone (hold ended or
  inWorld) before their clear frame ends, so nothing else changes.

**Verify** (540p, `--look k08b+cs --workers 1 --audio`, 0 page errors), engine/out/review/passB/type/:
m4_152-158.mp4, m4_121-126.mp4; every-frame strips m4_strip_123.2-123.6.jpg (couplet from 123.367 is clean: no pill on the paper half),
m4_strip_155.6-156.0.jpg (no bar through 155.767; the bar appears at **155.800**, "And" lights at **155.900**), m4_strip_154.0-154.5.jpg
(line 40 holds to 154.467, gone at 154.500; nothing during the "oh" ad-lib).

**Flood line 33 translation: deliberately subtitle-free** (brief: "119.0-123.3 flood: zero UI"; CLEAR_FRAMES 'paint flood'). Proposals, not built:
1. (type, cheapest, keeps zero UI) the couplet's editor half: make the code listing's line just above the current line read
   `// fixtures lay the base, functions add the color` at 123.354-124.1, so the thesis gets glossed in the editor as content (in-world, after
   the flood), above 也是一段代码. Risk: two comments on the code half; drop it once `// and it's also code` types at 段.
2. (stage_3d, best read) in-world type during the flood on the gang shot 121.5-123.3: "lay the base" painted by the base coat on the floor
   and "add the color" carried by the colour wave, as world geometry/decals (not an overlay), like the carved FIXTURES/FUNCTIONS slabs.
3. (type) the couplet's paper half: a small pencil margin note under "it's a painting," — weakest, it crowds the couplet's own gloss.
