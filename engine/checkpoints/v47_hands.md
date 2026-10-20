# v47_hands checkpoint (started 2026-10-19 evening)
Note (Jade, v4.6): "2:38 and also elsewhere ... Charlie and Ricky's hands go through their guitars while they're playing. Can you update the guitar playing model so that it's accurate? (target what we already do in the other scenes)."
Brief: docs/v47_brief.md. Owns: 3D guitar rig / pose helper, guitar-pose lines outside the v47_boss window (123.35-143.4 in act4/main3d.js is v47_boss's).
Cap $5 (no paid gens planned). Backups engine/out/bak_v47/v47_hands/. Clips engine/out/review/v47/v47_hands/.

## Log
- [start] reading rig. No src edited. Spend $0.
- Cause (bench, src/scenes/dev/guitar_test.js, show dev t 3000-3600): voxfig playGuitar IK'd the picking fist onto userData.strum (0.5 px above the top, i.e. half inside)
  with the elbow pole down-BACK, so the forearm came from behind the guitar through the body (16-20k arm vertices inside the body, every pose, both heroes);
  the fretting fist sat on the neck with the neck through it at random angles. The laser insert (~90.2) only looked right because Ricky's hand was up in the windup.
  Same rig everywhere: pose 'chord'/'sustain'/Ricky 'idle' -> playGuitar; slab_insert strumPose (own copy); drop_r5 rickyPick (world IK onto userData.strum).
- Fix (switch `export const HANDS_V47` in src/core/voxfig.js ~l.780; null = v4.6): playGuitar47 + GTR47 table (voxfig ~l.790-830): picking hand 'grip' at 4.4 px over the
  top (Strat between the pickups / acoustic over the hole), strum moves across the strings (guitar v), elbow pole in FRONT of the body; fretting hand 'grip' with the
  wrist turned so the grip channel runs along the neck and the fingers close over the fretboard (hand centre 0.6 px in front of the neck centre). Metric: pick arm 0
  vertices inside the body (worst 82 at Ricky's lowest downstroke = 0.67 px graze on the upper-bout edge).
  Exports: playGuitarRig (slab_insert strumPose), guitarPick47 (drop_r5 rickyPick). F._gtr47 carries the fret wrist into MotionFigure layers.
- core/motion/figure.js EDITED (backup out/bak_v47/v47_hands/figure.js.v46): _layered records F._gtr47 from a guitar layer; _splitRig applies its wrists; _hands uses
  'grip' while it plays. 3 small edits, no-op when no guitar layer.
- Scene edits (small, guitar lines only): act3/slab_insert.js strumPose -> playGuitarRig when HANDS_V47 (+import); act3/drop_r5.js rickyPick G -> guitarPick47 and
  pole [1.25,0.9,0.55] when HANDS_V47 (+import). Both files are v47_drop's: tell the coordinator. show/dev.js +1 line (dev.guitar).
- Backups: out/bak_v47/v47_hands/{voxfig.js.v46, heroes.js.v46 (unchanged), figure.js.v46, slab_insert.js.v46, drop_r5.js.v46, battle.js.v46, main3d.js.v46_at_start, dev.js.v46}.
- core/motion/figure.js also: armOut abduction scaled by (1 - guitar layer w) (it pulled the hands off the neck in MotionFigure shots, e.g. laser 90.05, pre-existing).
- act3/drop_r5.js: laser chord layer t1 LZ.fling+0.13 when HANDS_V47 (was +0.04: a mocap gap before the sustain let the fret hand drift off the neck 90.0-90.1).
- Note: still batches are order-dependent (a_84.2 from a mixed batch lost Jade's head; rendered alone it's fine = pre-existing engine statefulness, not the rig).
- Before/after stills 1080p: out/review/v47/v47_hands/{before,after}/ ; crops out/review/v47/v47_hands/crops/ba_<t>_<who>.jpg (left v4.6, right v4.7).
- HANDS_V47 = 'grip' (ON) since ~21:56. Rendering 540p clips (render_clips.sh; s238 jam cart lock laser slabs recruit) -> <name>_v47.mp4 + <name>_v46.mp4 (cut from full_v4.6b).

## DONE (safe point ~22:25; nothing running; spend $0, no paid gens)
Switch: src/core/voxfig.js:780 `export const HANDS_V47 = 'grip'` (ON) | null = exact v4.6 everywhere (every v47 branch is gated on it).
Clips 540p + audio, out/review/v47/v47_hands/<name>_v46.mp4 (cut from full_v4.6b) vs <name>_v47.mp4 (new):
  s238 156.5-161.7 (2:38, Ricky at the steps) | jam 149.0-154.6 | cart 161.0-168.3 | lock 137.0-139.6 | laser 88.6-91.6 | slabs 179.6-184.2 | recruit 120.6-122.2.
  Re-render: from engine/, `bash out/review/v47/v47_hands/render_clips.sh [s238 jam cart lock laser slabs recruit walk battle verse2]`.
Stills 1080p before/after (JPG): out/review/v47/v47_hands/{before,after}/; 2-3x crops crops/ba_<t>_<who>.jpg.
Bench: `node render.js --show dev --stills 3015.5:a.png,...` (dev.guitar, t0 3000: ricky u<100, charlie 100-200, +200 = v4.6 rig); logs '[gtest]' vertex-inside-guitar counts.
Sweep (3D, Charlie/Ricky with guitars, all go through pose 'chord'/'sustain'/Ricky 'idle' -> one rig): 77.9-79.3 + 83.4-85 (turn/walk), 87-92 (drop/laser),
  96-107 (verse2_r5), 110-122 (battle sustain/chords + recruit 121.4), 123-173 act4 (Ricky idles with hands on the Strat, run sustain, lock 138.6, jam, 2:38 = 158.3-161,
  cart), 180/183 slabs. 2D sprite sections (kaizo/chorus, e.g. 78.5) untouched.
Not done / notes: mocap-only arms (walking without a guitar layer, e.g. 81.6-83.4, act4 runs) are not part of the playing rig; not audited.
  act4/main3d.js NOT edited (its playFig/placeHero go through voxfig pose). Charlie's picking elbow sits high (forearm over the acoustic's big upper bout): reads as a strum.
