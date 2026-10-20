# v45_open: Jade's v4.4 note "0:00 - can we animate some guitar strumming on Charlie, even here?"

Brief: docs/v45_brief.md. Predecessors: passB_open_close.md, v44_open.md.
Owns: engine/src/scenes/act1/cold_open.js, assets/v4_stills/tools/passB_oc/** (2011 page layers).
Backups: engine/out/bak_v45/v45_open/ (cold_open.js.v44 = pre-edit). Review: engine/out/review/v45/v45_open/. Spend: $0 (cap $8).

## Log
- 12:00 started; read brief/checkpoints; backed up cold_open.js. Next: find the page layers + where Charlie is, find guitar onsets 0-3 s.
- 12:10 AUDIO: no stems on disk (only engine/out/cache/song.wav); the intro (0-3.3) has no sustained/strummed guitar. It has short
  mid-band (300-3000 Hz, ~50 ms) "chk" transients on the 8th grid: 0.348(kick) 0.998 1.207 1.637 1.846 2.072 2.276 2.490 (2.688 weak) 2.914 3.129 3.355
  (librosa, within 5-18 ms of grid 8ths). Strokes cross the strings on the grid 8ths; measured hits = full strokes, the rest ghost strokes.
- 12:15 NBP gen $0.1344 (tag v45_open_arm_a; tools assets/v4_stills/tools/v45_open/gen_arm.py, run with ~/Documents/1-music-shipped/moongazing/.venv/bin/python):
  arm_in.png crop -> arm_gen_a.png (guitar with the right arm removed). Used ONLY inside the traced forearm footprint.
- 12:20 NEW tool assets/v4_stills/tools/v45_open/build_strum.py -> media/act5/tex/{page01s.jpg,page01s_half.jpg,arm01.png,strum01.json}
  (page01s = page01 + gen inside the forearm footprint; arm01 = forearm+hand cut from page01; rest composite == page01, mean diff 0.002).
- 12:25 cold_open.js: switch `export const STRUM_V45` (top of file, after imports): null = v4.4 | 'strum' | 'groove'. page01 -> page01s when on;
  strumRig()/strumAt()/STRUM_S appended at the end of the file; update() calls strum.wipe/visible/apply next to the page wipe.
  Render a variant: from engine/, `bash out/review/v45/v45_open/render_variant.sh <groove|strum|null> [from] [to]` (puts the switch back after).
- 12:30 clips: out/review/v45/v45_open/open_0-8_{groove,strum,v44}.mp4 (540p, audio). Switch left on 'groove'. Next: frame-level checks.
- 12:35 fixes after frame checks: (1) the page texture is NOT re-encoded any more: page01s.jpg retired (deleted); the redrawn guitar is a small
  layer hole01.png (same box as arm01) over the untouched page01 -> v4.4 pixels everywhere except the arm box (lossless 540p still at 5.0 s: 0 diff;
  at 0.0: only the footprint edge, resampling, invisible). (2) footprint dilated 7 px along the forearm (its outline stroke was left behind
  as a ghost line on downstrokes), tight 3 px on the hand; (3) sound hole / ring / strings between the fingers keyed out of arm01 (they rode
  along with the fingers); (4) wrist blend widened (smoothstep -14..14) to stop a knuckle fold; groove amplitude elbow 6 / wrist 10 deg.
- 12:40 sync check on the 540p groove clip: per-frame motion-energy peaks in the hand box (fastest point = strings crossing) land on the
  grid 8ths within one frame (-16..+23 ms) from 0.78 to 2.92 s. The wipe reaches Charlie ~3.1 s; arm/hole/head layers wipe with the page.

## FINAL STATE (safe; nothing running; switch left on 'groove')
Changes (uncommitted):
1. engine/src/scenes/act1/cold_open.js
   :32-33 imports (FrameLayer, WIPE_GLSL, TEX, loadImg, imgTex, loadJSON; THREE)
   :35-42 `export const STRUM_V45 = 'groove'` (null = v4.4 | 'strum' | 'groove') + STRUM_VARIANTS {elbow, wrist, nod in deg}
   :120-128 rig set-up after the page block; :154 per-frame strum.wipe/visible/apply in the page update
   :206-end STRUM_S (stroke strengths per 8th), strumAt(t), pupMesh, strumRig (hole layer, warped arm layer, head-nod patch)
2. NEW media/act5/tex/{arm01.png, hole01.png, strum01.json}  (page01*.jpg and page_layout.json untouched)
3. NEW assets/v4_stills/tools/v45_open/{gen_arm.py, build_strum.py}; work assets/v4_stills/work/v45_open/{arm_in,arm_gen_a,view_base}.png
Backup: engine/out/bak_v45/v45_open/cold_open.js.v44 (or just set STRUM_V45 = null; the new tex files are inert then).
Review (540p, audio): engine/out/review/v45/v45_open/open_0-8_{v44,strum,groove}.mp4, closeup_L-v44_M-strum_R-groove_0-3.4.mp4 (Charlie 1.5x crop,
3-up), stills/ (1080p). Spend $0.13 (1 NBP edit).
Canon: Charlie keeps his flat cap in every frame (page is graphite by design, as approved); no Jade/Ricky on the page.
