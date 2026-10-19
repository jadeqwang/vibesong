# v4 Tier 1 checkpoint (2026-10-18): mechanical cleanup + full_v3.1 (540p)

Owner: the Tier 1 agent (Pass A). Brief: docs/v4_brief.md; plan: the critique doc (Plan for v4, Tier 1). Decisions logged in
docs/decisions.md ("2026-10-18: v4 Tier 1"). Not touched: assets/v4_stills/, assets/sheets/v11/ (the art agent's), any Tier 2 work.

## Status
- [x] Step 0.1 full_v3 render command reconstructed + verified, written into docs/RESUME.md (V4 block)
- [x] Step 0.2 r5 flipped to the default, dev hook removed, flag-less == `--r5` verified (max abs diff 0)
- [x] Step 1 Tier 1 items 1-8 (details below)
- [x] Step 2 full_v3.1 rendered + verified (results below)

## Step 0: the render command
`node render.js --show main --from 0 --to 207.2 --fps 30 --res 1920x1080 --r5 --fig native --figscale 1.3 --figres 2.5 --look k08b --mblur 8 --shutter 0.33 --mp4 out/master/full_v3_1080p.mp4 --audio --workers 2`
- From the log: two workers (w0 from 0, w1 from 103.6 = frame 3108), `mblur used=8` on 3D frames, talos_r5 lines (= --r5), 6216 frames.
- Verification. A 5 s 1080p mp4 slice does NOT reproduce the master bit-for-bit, and that is not a flag problem: `Math.random` is
  one seeded global stream (src/main.js:17) consumed during scene setup, so a frame depends on WHICH scenes the render range sets
  up. Proof: the same 2 s slice rendered twice = 67 dB (identical but for x264); 100-105 slice vs master = 35 dB mean (frames inside
  w0's range 41 dB, frames past 103.6 23-27 dB); a slice starting at w1's start (103.6) = 31 dB (fewer scenes set up than w1).
  With the SAME setup range as each worker (stills spanning 0-103.5 and 103.6-207.1), 1080p stills vs the master frame (by index):
  t=10 43.3 dB, 60 42.3, 90 37.4, 103.5 35.8 | 104.0 32.4, 140 34.2, 165 37.1, 190 39.1 (x264 floor for a still re-encoded alone
  = 39.4 dB; motion frames sit lower). Alternatives at 104.0: `--shutter 0.5` 29.4 dB, no mblur 24.5 dB, so 0.33 + mblur 8 is it.
- Tools: engine/tools/v4/framediff.py (frame-indexed diff of two mp4s), stilldiff.py (still vs mp4 frame).
- **Open (not fixed, would change pixels everywhere):** the setup-order dependence of Math.random. Compare renders only at equal
  setup ranges; a master should keep using the same worker split it is compared against.

## Step 0.2: r5 is the default
Backups: engine/out/bak_v4/pre_r5flip/ (render.js, src/env.js, src/scenes/act3/{common,drop_r5}.js).
- src/scenes/act3/common.js:66-67 `R5()`: true unless `?r5=0` / `globalThis.R5 === false`.
- src/env.js:59-60 `LOOKCFG.r5`: same test.
- render.js:15 (doc) + :149 (page URL): `--r5 0` appends `r5=0`; a bare `--r5` is accepted and does nothing.
- src/scenes/act3/drop_r5.js: the `out/dev/r5cam.json` fetch (was :50-51) and its `DEVCAM` use (was :267) removed.
- Check: 1080p mp4 103.6-105.6 without the flag vs with `--r5`: max abs 0 over 60 frames; stills 103.6/140/165/190: max abs 0.

## Step 1: what changed (file:line), backups in engine/out/bak_v4/<area>/ (act1..act5, show, core, render)
### 1. Render glitches
- **Black one-frame flashes (123.47-124.63, 139.93-140.33, 149.77-150.9):** root cause = a non-finite texel in the procedural sky
  that feeds the PMREM environment map. The env is regenerated whenever the sun key changes (per frame in Act IV); one NaN/Inf
  texel spreads through the PMREM convolution, every IBL-lit material goes NaN, and look.js `safe()` maps it to black. Found by
  bisection: lights, AO, shadows, the look pass and every scene object were ruled out one by one; all uniforms finite.
  Fix: src/env.js:158-159, the PMREM input shader drops non-finite texels (a no-op on healthy frames). Stills at 123.633 / 140.2 /
  150.6: mean luma 70/82/84 -> 136/142/133.
- **0:36 washout:** src/scenes/act1/kaizo.js:726-729: the pre-chorus slams were a one-frame 0.8 white flash over the dark VOID (Y 60 ->
  200 on one frame = reads as a dropped frame). Now 0.3 on the slam frame + 0.12 on the next.
- **0:14 title collision:** src/scenes/act1/common.js:115-117 LEVEL_CARD tOut 14.30 -> 13.82, tGone 14.55 -> 14.0 (the card used to fly
  out through the first lyric 14.11); line 5 is in-world now, so no chip either.
### 2. One lyric system
- src/core/ui.js:121-131 SUB_* constants (the one style), CLEAR_FRAMES + clearFrameAt; subtitleFor returns null for in-world lines and
  inside clear frames; pixel `Subtitle` = fixed slot SUB_Y, same colours as SmoothSubs.
- src/show/subtitles.js header + inWorld on 17, 18, 43, 50 (2, 4, 5, 6, 10, 25 already).
- src/scenes/act3/common.js:36-38 SmoothSubs: bottom only, hideTop/inWorld = no subtitle; :77 currentSub.
- 2D: kaizo.js:472-473 + :734-738, chorus.js:141-142 + :626-629 + :673, press_start.js:37, turn_ui.js (line 18 now null).
- 3D: main3d.js:938-948 (all Act IV lines incl. the bridge 36/37 in SmoothSubs), overlay.js:56-62 (`subtitle()` = SmoothSubs for any
  caller; the v3 drawer kept as `subtitleV3`), paper.js:123,175, spread.js:155-158 + the update block (outro lines 48/49).
- battle_ui.js:176-179 `battleOwnsSubs` false (the RPG message window is no longer a subtitle).
### 3. Strip the UI
- HUD (LINES OF CODE, portraits, hat counter, ❚❚ READ): kaizo.js, chorus.js, turn_ui.js:100.
- battle_ui.js:658-690 `drawV4`: only the `> let's dance` prompt field, BUG → FEATURE stamps (113.28-119.0) and THE ERASER's
  PARTY 8 → 9 strip (149.22-150.6, compact, top centre). Gone: party / enemy / command windows, SKILLS cascade, lyric window, ♥ / MISS /
  GUARD tags, TRIPLE TECH, VICTORY, the recruit dialog, "THE ERASER draws near!", the Eraser ♥ window. `globalThis.BATTLE_UI_V3 = true`
  restores v3.
- REALITY LV: build_bar.js:40-56 + :121-126: visible only in the builds (67.778-80.81, 161.728-174.40) and it fills there on the beats.
- LEVEL LOADED toasts: turn_ui.js:133, hud5.js:100,105. Drop-2 world-map path/flags/labels: route5.js:189 (party dots kept).
### 4. Clear frames: core/ui.js CLEAR_FRAMES (see decisions.md for the windows); battle_ui drawV4 returns nothing inside them.
### 5. Speedrun timer cut: hud2d.js:76, :97 (no timer, no split rows; the bar + the montage's pixel cart stay).
### 6. One ending: show/main.js:38-41 (act5.title + tear_title + tear_last retired; outro 186.65-198.035, last 198.035-203.0);
spread.js:49-51 (OUT.ded/fin), :83-93 (living layer settles into the approved still 194.06-194.9), :129-133 (SAVE COMPLETE · 2026
stamp + dedication), :192-196, :sbs/ded reveal; paperkit.js:175-188 saveStampCanvas.
### 7. Eraser prompt: main3d.js:79-88 (K.answer, per-letter keys on the vocal), :358-375 (wider field, font fits), :380-392 (text,
the window pulled 34 u toward the lens so its left end clears the Eraser's body).
### 8. Paper lip sync +0.10 s: new media/cutscenes/jade_sing_bridge_1/jade_sing_bridge_1_adv0.10.mp4 (source from 0.309 s, 72 frames)
and fallback_card_480p_portrait_adv0.10.mp4 (tools/cutscenes/card.py); paper.js:18-20 CLIPS.jade_sing. The method was first checked
by re-cutting the 0.209 s slot clip: 44.1 dB vs the shipped one (same frames, re-encode only).

## Step 2: full_v3.1 + verification
**Output:** engine/out/review/full_v3.1.mp4 (960x540, 30 fps, 0-203.0 s = 6090 frames, AAC audio 0-203; 320 s on 2 workers, GPU idle).
**Command (from engine/):** `export TMPDIR=$PWD/out/dev/tmp; node render.js --show main --from 0 --to 203.0 --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b --mp4 out/review/full_v3.1.mp4 --audio --workers 2`
(same settings as the v3 review: no mblur at 540p; r5 is the default now). Log: out/review/full_v3.1.log (0 page errors).
**v4 1080p master command (not run, per brief):** `node render.js --show main --from 0 --to 203.0 --fps 30 --res 1920x1080 --fig native --figscale 1.3 --figres 2.5 --look k08b --mblur 8 --shutter 0.33 --mp4 out/master/full_v4_1080p.mp4 --audio --workers 2`
Check folder: engine/out/review/full_v3.1_check/ (1 fps sheets sheet_01..13.jpg, ba_*.jpg before/after pairs, canon_crops.jpg,
luma_scan*.txt, cuts_v3.1.txt). Tools: engine/tools/v4/{lumascan,cutgrid,framediff,stilldiff,mouthcurve,grid}.py, sheets.sh.

| Check | Result |
|---|---|
| Luma-drop scan (YAVG drop > 35, 160 px) | **PASS.** 29 drops, 0 one-frame blips (v3: 10 blips at 123.47-124.63, 139.93-140.33, 150.6-150.9). Every drop is either the frame after a deliberate one-frame white stab (18) or a hard cut (10: 7.2, 13.83, 23.7, 72.17, 100.77, 113.83, 129.4, 169.07/169.1/169.3); 169.5 is a montage 8th cut under the 0.35 scene threshold (77 -> 33 and stays). No drop at 35.6 / 36.5 any more (the washout). |
| Cut-vs-grid (scene > 0.35 vs beats + 8ths + measured cues) | 61 cuts: 41 within 20 ms, 14 at 20-60 ms, 6 > 60 ms (v3: 68 / 43 / 14 / 11). The 6: 52.63, 57.43, 59.57, 59.97 (chorus 1, the "Oh oh oh" cuts), 79.27, 161.43: all unchanged from v3 (Tier 3 item "snap the off-grid cuts"). The 20-60 ms group is mostly the white stabs (24.27, 35.6, 36.47) and Act III cue cuts; Tier 1 added no cut. |
| UI budget (1 fps, sheets) | **PASS with the kept gag beats.** Zero UI and zero text in the clear frames (81-93 shows only the bar's shatter shards at 81.0; 119-123, 140-143, 175-186 empty but for the nine party dots on the terraces). Choruses: no HUD / bar / menu; only the kept gags (prompt box 44.5-55, the in-world `> you are my friend` 143.5-147.8, PARTY 8 → 9 strip 149.22-150.6) + the lyric bar. Elsewhere ≤ 1 UI element: REALITY bar in the builds (68-80, 162-174), BUG → FEATURE stamps 113-119, `> let's dance` 111.2-111.9, TIP 30-31, NOT VERY EFFECTIVE 17.7-18.7. Exceptions left on purpose: the char-select menu 7.2-11.0 (Tier 2 replaces it with the CONTINUE beat) and the small EXIT 0/3 · EXIT OPEN gate labels 72-75 (in-world signs). |
| Subtitle audit | **PASS.** One style: SmoothSubs (3D, paper card, sketchbook) and its pixel twin (2D), both bottom centre, same colours. No translation-only chips, no RPG / paper / slip subtitles. In-world lines carry none: 4.2-6.9, 11.1-12.9, 14.1-17.6, 18.1-20.1, 34.7-38.2, 72.1-74.9, 79.4-81, 100.1-101, 172.8-174.6, 199.2-200.8. |
| Canon audit (crop 2-4x, canon_crops.jpg) | **PASS for what Tier 1 touched.** Paper card (new +0.10 cut of the same approved take): bun with both caps up (pink left, blue right), headphones on the collar. 3D at 150.0: hair down with the pencil in hand, headphones round the neck, orange straps, baggy navy pants. End page = the v3 approved still (unchanged): caps up, patch on the left sleeve band, straps, sneakers; **pre-existing:** one pencil's point shows below the bun on that still (canon: tips hidden) - for the art agent's Pass B page. |
| Paper lip sync +0.10 | New card = old card shifted 3 frames: 46.7 dB vs old frame k+3 (42.1 dB unshifted). Against the audio: the 笔 lip closure now spans 126.169-126.336 and reopens 126.369, on the vocal stem's stop gap 126.35-126.40 (the b burst ~126.40); the v3 card closed 126.302-126.402 and reopened 126.436, after the burst. The first word 一 (lyrics_timed 125.86) is sung legato out of line 34's 码, so it has no separable onset in the stem; the card's first full opening is 125.969. |
| Eraser prompt | `> you are my friend` complete at 147.61 (typed 146.556-147.61 on "that I need"), ENTER 147.693, 1.53 s before "That's it" (149.22). |
| Ending | Picture ends 203.0 (audio 201.2). One page from 186.65: living layer settles into the still 194.06-194.9, SAVE COMPLETE · 2026 stamp lands 198.035, credits/title as v3, dedication inks 201.4-202.4. |

## Open / not done (and why)
- **Bugs' party joining at 121.4-122.95** has no UI now (it sits in the flood's clear frame); the staged 3D YES press + features
  stepping in carry it. If Jade wants the PARTY 3 → 8 beat back, it needs Tier 2 restaging (e.g. land it on 118.5-119.0 or after the bridge).
- **Off-grid cuts** (6 > 60 ms, mostly chorus 1) and the 9-10 s uncut stretches: Tier 3, untouched.
- **Determinism caveat** (Math.random setup order): documented, not fixed (it would change every random-placed prop).
- **Char select 7.2-11.0** still a 4 s menu (Tier 2: CONTINUE beat). **Cold-open gloss card** kept (a title gloss, not a lyric).
- **Dedication / stamp placement** is a stand-in on the existing page; the art agent's Pass B page should give them a home.
  The pre-existing visible pencil point under the bun on the end-page still goes to the same pass.
- **Lost glosses:** with the in-world rule, English viewers get no gloss for 说出来 它就存在 (34.7) / 一切从这里出发 (72.1) / 一笔 一画 (11.1); the
  intended fix is Tier 3's big character + small in-world gloss.
- Unused now (kept, not deleted): act5/title.js, act5/tear.js, battle_ui's v3 drawers (`BATTLE_UI_V3`), overlay `subtitleV3`,
  route5 map (`ROUTE_MAP_V3`), media/cutscenes/.../fallback_card_480p_portrait_lag0.00.mp4.
- Not done by design: no 1080p master, no Tier 2 (colour rationing, camera, new art, paper close-ups).
