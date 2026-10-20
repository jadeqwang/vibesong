# v45_lvl: Jade's v4.4 note "1:15, maybe Ricky's guitar playing is needed to help level up reality."
Brief: docs/v45_brief.md. Window: act2.chorus launch shot 72.125-77.757 (REALITY LV1 -> LV2 bar, 一切从这里出发 typed, rainbow 出发).
Owns: engine/src/scenes/act2/chorus.js (launch-shot window only) + new Ricky/Charlie sprite frames.
Backups: engine/out/bak_v45/v45_lvl/ (chorus.js.v44 = pre-edit). Review: engine/out/review/v45/v45_lvl/. Spend: $0 (cap $5).

## Log
- 12:1x started; read brief, found scene (chorus.js launch shot, bar = src/show/build_bar.js buildAt, shared, NOT edited: override pct in chorus.js only). No src edited yet.
- 12:3x guitar events: no guitar stem; demucs "other" stem (work/demucs/htdemucs_ft/song/other.wav) has 8ths 72.4-73.65, a GAP 73.65-74.85 (出发 shout), 8ths 74.86-77.8. Peaks on beats: 73.190 73.612 74.859 75.280 75.709 76.103 76.550 76.940 77.367 (beat grid +0-0.04).
- New sprites (tool tools/sprites/v45_lvl_jam.py, hand-pixeled from idle f0, same palette): assets/sprites/ricky_strum.png (5 fr: up/hit/ring/windmill/slam), assets/sprites/charlie_jam.png (3 fr: up/nod/stomp). sprites.json: 2 entries added (backup engine/out/bak_v45/v45_lvl/sprites.json.v44).
- Bar: src/show/build_bar.js NOT edited (shared, act3 turn_ui uses buildAt after 77.757 = 99 stuck). chorus.js overrides pct in the launch shot only.
- ADDED SCOPE (coordinator 12:3x): ~46-52.62 prompt box: ENTER on "need?" (52.62) pressed by Ricky's power chord (A) / Charlie's hat (B) / off; const switch; clips ~45-54. Do after 1:15.

## STATE 12:5x — DONE (safe point; nothing running, no paid gens, spend $0)
Live in show: `LVL_V45 = 'notes'`, `ENTER_V45 = 'chord'` (src/scenes/act2/chorus.js:278 / :283). Pre-edit file: out/bak_v45/v45_lvl/chorus.js.v44; current: chorus.js.v45.
### What changed (all additive; build_bar.js untouched)
- chorus.js:23 header note. :73-79 atlas 'note8'/'note16' pixel notes. :113 `lvlUi` UI batch (ZUI.DIALOG+3, cs=1).
- :269-330 LVL block: switches + hit table (other-stem peaks 73.190 73.612 74.859 75.280 75.709 76.103 76.550 76.940, windmill jump 77.172 -> SLAM 77.367),
  bar plan (holds/blinks at the run value 27% until the first strum, then steps with ease-in weights; slam = +22% -> 98%), Ricky pose fn (up/hit/ring frames
  of ricky_strum around each hit), Charlie fn (nod on every beat, stomp prep before the 3 reds).
- :349-350 ENTER: Ricky 'chord' windup at 52.334 (stem hit), blast 2 frames before ENTER (52.62); 'hat' = Charlie 'throw' at 52.334.
- :415 hero override in the launch shot. :678-708 FX (sound rings, notes bezier up the left edge into the bar panel's left end / bolt zig-zag; Charlie stomp dust).
- :721-729 bar override (pct from LVL, white flash + 1-2 px jolt per hit, UI sparks at the fill tip). :773-793 ENTER shot / hat (UI px via camera).
- Sprites: tools/sprites/v45_lvl_jam.py -> assets/sprites/ricky_strum.png (5 fr), charlie_jam.png (3 fr) + 2 sprites.json entries.
### Clips (540p + audio) engine/out/review/v45/v45_lvl/
- 1:15: lvl_notes.mp4 (LIVE), lvl_bolt.mp4, lvl_v44.mp4 (cut from full_v4.4) — 70-79 s.
- ENTER: enter_chord.mp4 (LIVE), enter_hat.mp4, enter_v44.mp4 — 45-54 s.
- Re-render a variant: from engine/ `bash out/review/v45/v45_lvl/render_variant.sh <notes|bolt|null> <from> <to> <name> [chord|hat|null]` (edits the consts, renders, restores the file).
### Known / open
- No real guitar in the mix: hits are on the demucs "other" stem (8ths, gap 73.65-74.85 = Ricky lets it ring). The LV2 hit itself (77.757) is act3's first frame, so the slam is on the beat before (77.367); bar shows 98 -> act3 shows 99 stuck.
- Bar fill looks pale (colour script grade on the bar, same as v4.4), act3 bar is green from 77.757 (pre-existing).
- "reality" is still typing when ENTER fires at 52.62 (pre-existing in v4.4).
