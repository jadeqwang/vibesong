# v4.3 hat: Charlie's hat turning grey (Jade's note on full_v4.2 at 0:41 and 0:44, "and other times too")

## Cause
The v4 colour script (`--look k08b+cs`, src/core/colorscript.js) grades the whole 2D world to graphite (sat2d 0.06) from 0 to 119.02 s.
Only *exempt* things keep their colour: hero `Actor`s, Pencils, rainbow strokes, and anything tagged `userData.cs`
(src/core/stage2d.js `csKeepOf`, around line 72). Charlie's hat is often drawn as a separate prop, not as part of his Actor:
the bounce pad, the trampoline, the boomerang, the hat-shield dome, the hats he throws in the chorus, and the parachute pose
(drawn by a `PoseQuad`). None of those were tagged, so they went graphite. In 3D the same rule is the `--r5` hero mask
(src/scenes/act3/world/paint.js `heroMask`). The 3D trampoline, boomerang and hat-stack materials were not `hero`, so the
3D grade (sat3d 0.30) greyed them. This was not a design beat: the hat is hero gear, and the bible says the heroes bring the colour.
Canon cap colour: sprites #d1a167 (tan), 3D native CHARLIE_PAL.cap #d4b47c (heroes.js:325), paper art tan. All three match once the grade lets it through.

## Instances found (2 fps scan of the whole of full_v4.2 + frame checks)
| song time | what | cause |
|---|---|---|
| 14.98-15.7 | hat bounce pad (+ Jade's crate flip pose went graphite too) | kaizo.js `hat` Quad + `poseQ` untagged |
| 19.3-20.1 | hat trampoline in the blossoms pit, BOING | kaizo.js `trampQ` untagged |
| 23.3-25.4 | boomerang hat to the chain, then the hat parachute with the whole chain (Jade/Ricky dangles were graphite too) | `hat` + `poseQ` (P.charlie_parachute_carry, jade_dangle, ricky_dangle_play) |
| 26.3-27.2 | hat-shield dome over the three | kaizo.js `shieldDome` untagged |
| 34.7-37.3 | parachute catch into the VOID (说出来 / 它就存在) | `poseQ` |
| 39.8-40.4 | hat trampoline in the 未来 gap | `trampQ` |
| 40.6-41.03 | parachute rise on 来 (Jade's 0:41 note; cuts to the chorus, where the canopy is part of the Actor = brown) | `poseQ` |
| 42.7-43.5 | the boomerang hat that hooks Ricky's TAB (Jade's 0:44 note) | chorus.js drew it into the graded `fx` batch |
| 61.3-~72 | "hat after hat": every thrown hat in flight + the hats sitting on chunks | chorus.js drew them into the graded `props` batch |
| 77.95-80.8 | 3D trampoline in the turn's flat opening (pale grey-beige) | world/props.js `tm` not a hero material |

Checked and left alone: the 3D hats at 81.9-86.4 (boomerang, already brown under the 出发 chroma protection; its material is now hero too);
88.3-89 drop_r5 canopy (orange); 107.15-110.41 stage spotlights tint the cap (a deliberate coloured-spotlight shot);
123.35-139.4 the bridge drains the WHOLE world to dusk (whole-scene grade, not a hat bug); after 139.4 the grade is off; paper cards and outro are full colour.

## Changes (all marked `(v43 hat)`)
- src/scenes/act1/kaizo.js: `trampQ.userData.cs = 1` (line ~141); all three `poseQ` PoseQuads `cs = 1` (~477); `hat` + Ricky's `strap` `cs = 1` (~483); `shieldDome` `cs = 1` (~487).
  Side effect (intended): posed heroes (Jade's crate flip, the dangles) are now in canon colour like the walking Actors, not graphite.
- src/scenes/act2/chorus.js: new `cHats` batch (Z.PROP, `cs = 1`, line ~103) for the hats in flight / on chunks (lines ~565, ~589, ~591);
  the boomerang now draws into `cFx` (cs 1) (~479); `canopy.userData.cs = 1` (~121; unused while the carry strip exists); begin/end lines updated.
- src/scenes/act3/world/props.js (shared act3 world; a minimal edit; the 3D-turn agent may also be in this file): `tramp`, `boomer`, `hatStack` materials
  now `patchPaint(..., { noPaint: true, hero: true })` (lines ~411-416). They get the hero mask, plus the heroes' fill and rim light.

## Backups
engine/out/bak_v43/hat/{kaizo.js, chorus.js, props.js} (pre-edit copies). Restore: copy them back over the src files.

## Review
engine/out/review/v43/hat/hat_{14.5-27.5,34-44.5,60.5-68,77.5-81}.mp4 (540p, audio, file time 0 = the first number) + before_after.jpg.

Before/after sheet times: 15.1, 19.5, 24.5, 26.7, 37.5, 39.9, 40.75, 42.75, 62.3, 66.4, 78.7, 80.2. Every hat prop now reads tan (#d1a167), matching the 3D cap #d4b47c and the paper art.
Script for the sheet: out/review/v43/hat/render.sh renders the clips (the sheet script was scratch).
