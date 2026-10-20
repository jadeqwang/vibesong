# v45_accents: Charlie/Ricky guitar causes (scout #1 drop-2 slab strums, #6 recruit chord)
Status: DONE 2026-10-19 ~12:20 (safe point: no render running, both switches = 'new' in the source). Unit owns ONLY src/scenes/act3/slab_insert.js +
src/scenes/act3/battle.js. Spend $0 (cap $3; no paid gen).
Brief: docs/v45_brief.md; scout proposals engine/checkpoints/v45_scout.md (#1, #6).

## Backups
- engine/out/bak_v45/v45_accents/slab_insert.js.v44, battle.js.v44 (pristine v4.4 state, taken before any edit)
  Restore: cp engine/out/bak_v45/v45_accents/<f>.v44 engine/src/scenes/act3/<f without .v44>

## Plan
1. slab_insert.js: const SLAB_STRUM = 'new' | 'off'. Shot opens on a big downstroke (frame 1 = strum); Charlie's strum slams FIXTURES up
   (shock ring from his guitar to the slab foot); Ricky's chord lights FUNCTIONS (spark trail guitar -> slab grooves). Follow-through.
2. battle.js: const RECRUIT_CHORD = 'new' | 'off'. Ricky's chord on the 121.34 accent pops a RECRUIT menu; Charlie presses YES 121.745.
3. Clips 540p+audio -> engine/out/review/v45/v45_accents/ (178-186, 119-124; new + v4.4 A/B).

## Log
- 12:10 v4.4 A clips cut from full_v4.4.mp4 (no render): out/review/v45/v45_accents/v44_178-186.mp4, v44_119-124.mp4.
- Onsets (5/15 ms RMS on work/demucs/htdemucs_ft/song/*): the slab shots open on VOCAL shouts in a stop (no drum/other hit at 180.21 / 183.30;
  drums 183.085 is in the aerial before the insert). 121.33 = drums accent (-14 dB), cut at REVEAL 121.405 (first frame 121.433);
  other-stem chord swell 121.52; drums 121.735 = YES.
- 12:20 slab_insert.js edited (SLAB_STRUM const ~line 33, default 'new'): helpers strumPose/strumHit/strum8/swooshPts/firstFrame/seeded/ringMesh
  (copies of voxfig ikArm/guitarPt; exported for battle.js); frame(): hitter downstroke on the first frame (FIX 180.233, FUN 183.300),
  swoosh Beam, guitar shock ring, FIX floor ring + dust ring, FUN rainbow spark trail guitar -> F, glow sweep starts on arrival (hit+0.08).
  Own fx objects allocated under a private seeded Math.random. Stills: out/review/v45/v45_accents/st/ (crop3.jpg).
- 12:35 battle.js edited (RECRUIT_CHORD const after REVEAL ~line 59, default 'new'; MENU_AT; heroesAt recruit block Ricky 'chord' before YES;
  recruitChord() defined before `const anchors` in setupBattle, called in frame() after bandJade; cleanup in render() finally).
  In-world DQ window (canvas texture, fp12/fp10 pixel fonts, depthTest off) = RECRUIT? ▶YES NO; pops at hit+0.075 (121.508), pressed state on YES, closes YES+0.14..0.2.
  Fx holders are THREE.Object3D (act4/world4.js skips type 'Object3D': no erase patch / re-show).
- 12:40 rendering 540p new clips (one at a time): new_178-186.mp4 then new_119-124.mp4.
- 12:50 tuned: per-hero swoosh (lateral windup so the arc reads from the front), lean/nod reduced (faces stay visible), the recruit window
  moved below the heads over the ladybug button (z 458: in front of the pencil, behind Charlie, so his 'pull' fist presses INTO YES),
  trail control point upstage (passes behind Jade's head), window 0.55 u/px, YES stays gold after the press.
- 'off' smoke test (stills st/off.jpg) = v4.4 staging; switches restored to 'new' (cmp vs .v45new backups OK).

## DELIVERABLES (540p, audio) engine/out/review/v45/v45_accents/
- new_178-186.mp4 (FIXTURES 180.233 / FUNCTIONS 183.300) vs v44_178-186.mp4
- new_119-124.mp4 (recruit chord 121.433, window 121.52, YES 121.745, close 121.885-121.945) vs v44_119-124.mp4
- frame tiles fr/*.jpg, stills/sheets st/*.jpg (crop3 = slab hits, rsheet3 = recruit, jade_audit = Jade canon crops, off = off-mode).

## Final state (file:line)
- src/scenes/act3/slab_insert.js:33 `export const SLAB_STRUM = 'new' | 'off'`; helpers :38-102 (ikArm/guitarPt copies, figOf, strumPose, strumHit,
  strum8, swooshPts, firstFrame, seeded, ringMesh); fx alloc :115-120; frame logic :134-171 (heroes) + :173-199 (fx); cleanup :211.
- src/scenes/act3/battle.js:59 `export const RECRUIT_CHORD = 'new' | 'off'`, :60 MENU_AT; imports :20-22; RC alloc/menuTex/recruitChord :265-330;
  heroesAt :407; frame() call :824; cleanup :897.
- Backups: out/bak_v45/v45_accents/{slab_insert,battle}.js.v44 (pristine v4.4), .v45new (this version).

## Canon audit
Jade cropped 3x in 3 frames (183.7, 180.33, 121.567): hair down with pencils in hand, blue cap pencil, neck headphones with orange rims,
patch on the left sleeve band, chest dot, crop top + midriff, baggy navy cargo + orange straps, white sneakers: pass (her staging is unchanged).
Charlie's cap: straw/cream in every new frame, never grey.

## Open / notes
- The recruit window is diegetic (a 3D billboard in the world), not the 2D battle UI: the flood 119.0-123.354 is a 'clear frame' (zero UI) by the
  passB rules; if the coordinator reads the window as UI, set RECRUIT_CHORD to 'off' or ask for a variant without the window (chord + trail into the button).
- The slab shots open on vocal shouts in a stop: there is no guitar/drum transient on 180.233 / 183.300; the hit is on the picture cut + the shout.
