# v45_laser checkpoint
Note (Jade, v4.4): "maybe at 1:30, ricky's guitar playing turns on the laser?"
Scene: act3.drop 86.385 -> bar 57 (main.js:24) -> drop.js setup -> R5() -> src/scenes/act3/drop_r5.js (live).
Backups: engine/out/bak_v45/v45_laser/{drop_r5.js.v44,talos_plan.js.v44}
## Log
- 11:5x started; reading drop_r5.js. No src edited yet. Spend $0.
- 12:2x built. Switch `const LASER_V45` at src/scenes/act3/drop_r5.js:61 (null = v4.4 | 'strum' | 'wave'); timings LZ (:64), insert camera LZ_CAM (:62).
  Music: 'other' stem strum burst 89.933-89.985 (= the power chord, FUN 89.95 unchanged), swell 89.75-89.88, drum accent 89.69 (= plug-in), silence 90.1-90.9, strums resume ~90.98 (re-hit 91.11).
  Ricky: plug-in on 89.69, windmill through the swell, slam on 89.933, upstroke + 2nd stroke 90.05, arm flung + 'sustain' lean through the freeze, 16th strums from 91.11 (rickyPick(), right-arm IK spec; layers at :108).
  Amp: lens dim -> hum on plug -> charging flicker -> full on FUN; power stripe on at plug; lens/beam pulse on strokes (LZ_HITS).
  'wave' only: insert shot 89.284-90.105 (beat 212->214) from WSW of Ricky (face + Strat + amp + slab + Charlie tiny on the plate), rings travel guitar->amp lens (waveFx/buildFx45), hot cable.
  Both: A3 glamour panned right (tgt 852->822, fov 33->35) so Ricky is fully in frame.
  Stills: out/review/v45/v45_laser/st/{w_sheet,s_sheet,s_crop}.jpg
- 12:10 DONE (safe point; nothing running). LIVE = 'wave' (drop_r5.js:61). Clips (540p, audio, 84-94): out/review/v45/v45_laser/{laser_v44,laser_strum,laser_wave}.mp4
  (v44 = cut from full_v4.4.mp4; note the 84-86.385 walk differs from my renders because WALK_V44 = 'orbit' now). Spend $0.
  Known: in the insert Jade walks in behind Ricky (heads overlap ~89.5-89.8); Charlie on the plate is only a sliver behind the pier in the insert
  (the wide right after shows him). To revert: LASER_V45 = null (or restore out/bak_v45/v45_laser/drop_r5.js.v44).
- 12:25 coordinator follow-up DONE: Jade/Ricky two-headed read in the insert fixed by keeping Jade out of the insert (F.jade.group hidden only while
  inIns(t), drop_r5.js:149; she is only ever directly behind Ricky from that camera, and at her mark in the wide from 90.105). Beam timing and wide unchanged.
  laser_wave.mp4 re-rendered (84-94). Backup of the pre-fix file: out/bak_v45/v45_laser/drop_r5.js.wave1. Frames: st/wave_frames2.jpg.
  Insert length: NOT lengthened. Cutting in earlier on the grid = the 8th at 89.078 -> 1.03 s (still < 1.2) and it truncates Charlie's landing recover
  (lands 88.885, settles ~89.19); 1.2 s needs a cut ~88.9 = on his landing (kills the glide's payoff). Extending the end to 90.515 would move the
  receiver/lamps (90.15-90.35) out of the wide. Recommend keeping 89.284-90.105.
