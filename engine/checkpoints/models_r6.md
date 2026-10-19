# models_r6 checkpoint (round 4 build, 2026-10-16)

Brief: docs/round4_build_brief.md + the coordinator's models_r6 task (Jade's notes 1-6). Owns src/core/heromodels/*, the
FIGURE_SRC / figres code in src/core/voxfig.js (plus, by the task, the native rig in buildFigure / rest / ikArm), and the models
tools (tools/models_shots.js, tools/models_gate.py).
Backups (before any edit): engine/out/bak_r4/models_r6/ (heroes.js, sdf.js, bench.js, voxfig.js, models_shots.js, models_gate.py).
Scratch: engine/out/dev/mr6/ (base/ = renders taken before any edit, for identity / r5-vs-r6 comparisons).

## Plan / status
Gate A (items 1-3), then STOP and report:
- [x] 1 bun pencils: both eraser caps UP (pink cap image-left / her right, blue cap image-right / her left from the front), X crossing inside the bun, tips down + hidden
- [x] 2 headphones around the neck (Jade only): black band behind the neck, orange cups on the collar at each side; snap tab clear
- [x] 3 chin: softer / rounder chin + jaw, heart shape kept
- [x] sheets in out/review/models/r6/ + default-path identity check (max diff 0)
GATE A REACHED 2026-10-16 ~12:10, reported. Coordinator: chin OK as is; fix cups + bun pencils -> r6b (done, below).
Gate B (items 4-6): DONE 2026-10-16 ~13:30, reported.
- [x] r6b fixes: dark cup shells with orange rim + cushion, smaller / flatter, on the collar; bun pencils ~40% shorter, exits close, top-back bun
- [x] 4 rig split (pelvis + chest, ankle + foot + toe, wrist, finger poses) + motion_r2's spring parts, opt-in, rest diffs
- [x] 5 face states (blink, eye direction, visemes) + API doc below
- [x] 6 canon audit at 2.5 for all three heroes

## Gating
Everything new is behind the 2.5 path (heroes.js HI = RES != BASE_RES), so the default (carve) and the approved
`--fig native --figscale 1.3` (RES 1.25) renders are unchanged.

## Gate A (items 1-3): what changed (all HI-only, i.e. `--fig native --figres 2.5`)
- heroes.js
  - bun: bunC [-9.6, 91.6] -> [-9.2, 92.6] (1 unit up toward the paper art's top bun). Bun pencils: R6_BUN { len 16 (was 20), a 38 deg
    from vertical, caps lean back 0.25, tip end 3 units past the bun centre }; bunPlace(s) -> native.bunPencil.place { blue, pink:
    { tip (unit dir cap->tip), off (pencil centre, world) } }. Pink cap up at +z (her right = image-left from the front), blue cap up
    at -z; both axes pass through the bun centre (X crossing hidden), the cone + tip end inside the bun. Cap R 1.6 / capLen 3.5 kept.
  - headphones(M): torso part. Cups = sdf cylinder (r 2.75, half-thickness 1.2) at (2.9, 74.5, +-6.1), axis turned 0.82 rad forward
    from lateral and tilted 0.55 rad up (they lie on the collar / collarbones and face up-forward, so a lowered chin or high camera
    doesn't hide them); orange 'hpCup' #e8742a with a small dark outer plate 'hpPlate' (r 1.1) and a black cushion side; band = black
    'hpBand' ring (r 4.8-5.8, y 75.9-77.4) behind the neck on the collar's back rim. Snap throat-tab (z -1.8..1.9) stays >= ~2 units clear.
  - hair-down front side locks (HI): the lock now bends OUTSIDE the cup (via [5.0, 74.4, +-9.0]) so the cups read with the hair down.
  - chin: faceShape() takes o.chin = { w, h, k, rk } (HI: R6_CHIN = { w 3.2, h 2.0, k 0.68, rk 0.5 }): a quarter-ellipse U chin
    (half-width 3.2) + a jaw line, corners rounded at 0.5 w instead of 0.9 w (the r5 flat front narrowed to a V). Above y ~80 the
    skull (cheekbones / forehead) is unchanged, so the heart shape, eyes, brows and hairline are the r5 ones.
- sdf.js: new primitives cylinder(c, axis, r, h, rad) and ring(x, z, y0, y1, rIn, rOut).
- voxfig.js nativeItems: uses native.bunPencil.place when present (else the old 1.25 orientation).
Review sheets (engine/out/review/models/r6/): canon_turnaround_r6.jpg, faces_r5_vs_r6.jpg (front + 3/4, hair up / down, + in-scene
118.4 / 107.7 crops), headphones_r6.jpg (6 angles hair up / down, close + full-body 1:1), bun_r5_vs_r6.jpg (6 angles close, full-body,
paper art, in-scene 123.6), inscene_r6.jpg (87.5 / 104.6 / 107.7 / 118.4 / 123.6).
Identity: default (carve) 86.8 / 104.6 and `--fig native --figscale 1.3` (1.25) 86.8 / 104.6 at 960x540 + 25 1.25 bench shots at
1080p vs the pre-edit code: max diff 0 everywhere.
Tooling: out/dev/mr6/apply.py (atomic patcher: copy -> edit -> node --check -> mv), specs_a.py, sheets_a.py, grid.py;
out/dev/mr6/shadow/engine = a symlinked engine root running the PRE-r6 heromodels/voxfig (backups) for r5 renders
(`cd out/dev/mr6/shadow/engine && node tools/models_shots.js ...` / `node render.js ...`).
Open (gate A):
- Hair down, 3/4 views with the head pitched forward (the 118.4 lunge): the near cup can still be mostly hidden by the side lock /
  jaw. Front, bench 3/4 and side read. Secondary hair motion (motion_r2 springs) will change this per frame.
- The chin change is deliberately small (front reads as a soft U; at 3/4 the jaw is still tapered). Jade's call if she wants more.
- The cups have a dark centre plate (the paper art shows dark cups with orange rims; canon text says orange cups): mostly orange
  with a small dark plate as a compromise.
- Hair-down silhouette is slightly wider at the jaw (the lock bends out around the cup).

## Gate B design (planned, not started)
- Rig split, OPT-IN per figure (buildFigure(model, mat, { rig: true }) or ?figrig=1 / globalThis.FIGRIG), because
  src/core/motion/figure.js (motion_r2) splits shins itself and would break on native feet. Model meshes are NOT re-voxelized:
  each part is meshed exactly as today, then its triangles are partitioned by voxel (pelvis/chest at a waist plane, shoe voxels
  -> foot, toe box -> toe, hand voxels -> hand), sharing the vertex buffers, so at rest the pixels are identical; hidden interior
  "plug" meshes (interior voxels near each cut, 1 voxel inside the surface) cover cracks when a joint bends. New joints: J.chest
  (child of J.body at the waist; head / shoulders move under it), J.ankleR/L (+ J.toeR/L), J.wristR/L (J.handR/L moves under the
  wrist; ikArm reads the hand in elbow space), finger poses as swapped hand meshes (fist = today's mitten, grip, point, open).
  rest() resets them; pose() leaves them at rest.
- Face states (HI): the head's front-plane quads in the eye / mouth region are split into a small per-figure "faceplate" mesh
  (own colour attribute; the head index drops those triangles), recoloured per state: blink 0..1, look [x, y], viseme
  rest | A | E | O | M (+ U / F if cheap). At rest the colours equal the baked mask (pixel-identical).

## r6b fixes (coordinator review of gate A)
- Cups (heroes.js headphones()): r 2.3, half-thickness 0.85 (was 2.75 / 1.2), at (2.5, 74.9, +-5.5) ON the collar; material: dark
  charcoal shell 'hpPlate' #2a2a30 with an orange 'hpCup' #e8742a rim ring (outer 0.6) + orange cushion (collar side); band black.
- Bun: bunC [-7.8, 94.4] (top-back bun, peeks over the crown from the front); R6_BUN { len 14, a 27 deg, back 0.25, tipIn 2.6 }:
  visible = cap + ferrule + ~1.4 units of yellow (~40% less than r6), exits close together; tips inside the bun.
Sheets: out/review/models/r6/{canon_turnaround,faces_r5_vs,headphones,bun_r5_vs,inscene}_r6b.jpg.

## Gate B: what changed
All of it lives on the 2.5 path; the rig / face / springs are additionally OPT-IN per figure. heroes.js computes the rig data
for every HI model (+~90-120 ms build per variant at 2.5: jade_up 430 -> ~550 ms; all 5 variants ~1.8 -> ~2.4 s), voxfig only
uses it with `rig: true`.
- sdf.js: meshGrid keeps its lattice (G, crop, vs, org) for the split; faceBlocks(), voxelAt(), splitMesh(), plugMesh().
- heroes.js: RIG (per-hero waist / foot / toe cut), handPose() (grip / point / open hand meshes), buildRig() (voxel-exact
  partition of the r5 part meshes + hidden interior plug meshes at each cut), springSpecs() (motion_r2 spring parts),
  faceRig() (eye / mouth faceplate + state -> material map, VISEMES), palettes + mouthIn (all) + mouthD (Charlie, Ricky).
- voxfig.js: FIGRIG flag, buildFigure(..., { rig }), splitRig(), setHand(), setFace(), rest() resets the new joints / springs /
  fingers / face, ikArm() handles shoulders under J.chest and the hand under the wrist, guitars ride J.chest in the split rig
  (playGuitar converts chest space -> body space), bun pencils ride J.bun, root.userData.F = the figure (bench lookups).
- bench.js: per-hero `joints` {name: [x, y, z] deg added to the pose}, `hands` {R, L}, `face` {...} in shot specs.
- tools/models_shots.js: `--figrig`.

## API (for motion_r2 and stagers)
Enable: `buildFigure(model, material, { rig: true })` (MotionFigure: `rig` option), or `?figrig=1` / `globalThis.FIGRIG = true`
for every figure on the page; only native models built at `--figres 2.5` have the data (`model.native.rig`); otherwise the r5
tree is returned unchanged. Every new joint is a THREE.Group whose rest rotation is identity; rest() (called by pose()) resets
them all, the finger poses to 'fist' and the face to rest, so set them AFTER pose() each frame.
Joint tree (r5 names kept; new in CAPS):
  root -> J.legs (pelvis pivot, P[2]) -> J.hipR/L -> J.kneeR/L -> J.ANKLER/L -> J.TOER/L
  root -> J.body (hip pivot P[2], carries the pelvis mesh) -> J.CHEST (waist pivot) -> J.head, J.shoulderR/L -> J.elbowR/L ->
          J.WRISTR/L -> J.handR/L (the item anchor, pencils / cap follow the hand)
  items.guitar (Strat / acoustic) hangs from J.CHEST in the split rig (its userData.base / slung.pos are chest space).
Pivots (design units, model space = these x UNIT; F.rig.piv has them as Vector3 in model space):
  waist y = 51.6 (Jade) / 50.4 (Charlie) / 49.8 (Ricky), x 0 z 0.  ankle [0.6, 5.4 (Jade) / 5.2 (Charlie, Ricky), +-legZ].  toe (ball) [ballX
  5.4 / 4.6 / 4.8, 0.6, +-legZ].  wrist [0.4, wrY - 0.4 = 41.6, +-shZ].
F.rig.foot[sd] = { heel, toe, ball, ankle } in ANKLE space (sole points, ankle = origin) -- names as motion_r2 already uses.
Finger poses: F.setHand(sd, 'fist' | 'grip' | 'point' | 'open') (also export setHand(F, sd, pose)); F.handPose = { R, L }.
  fist = the r5 mitten (default; holds pencils), grip = C-shaped around a channel along the hand's z (bars / handles), point =
  index finger straight out along the hand's long axis, open = flat palm, fingers straight, thumb out.
Spring parts (motion_r2 REQUESTS 1; identity-rest joints, rotate only):
  Jade hair up:   J.bun (pivot = the bun's base on the crown, bunC + [2.6, -2.2, 0]; items.bunPencils ride it), J.wispR/L (temple wisps, pivot at their top)
  Jade hair down: J.hairBack (back curtain y 73.5-79.8, pivot [-8.4, 79.8, 0] at the nape) -> J.hairBack2 (y < 73.5, pivot [-8.7, 73.5, 0]),
                  J.wispR/L (the front side locks below y 79.5, pivot [2.6, 79.5, +-8.0])
  Jade (both):    J.strapR/L (belt-loop strap, pivot [8.4, 48.4, +-3.6], parent J.hipR/L), J.strapThighR/L (pocket-flap strap, pivot [1.2, 35.0, +-15.6], parent J.hipR/L)
  Charlie (cap):  J.cap (crown + band, pivot at the band front [8.2, 91.6, 0]) -> J.capBrim (pivot [9.8, 91.6, 0]). None on charlie_nohat.
  The straps hang from the THIGH joints (they are voxelized in the thigh parts), not the pelvis. F.rig.springs = the names present.
Face states: F.setFace({ blink, look, viseme }) (export setFace(F, st); F.face.state = the last state). No-op without the rig.
  blink 0 (open) .. 1 (closed): the lid line comes down over the iris, the lash row becomes a crease; the profile (side) eye
    closes too. One value for both eyes.
  look [x, y] in -1..1: the iris shifts up to 2 fine voxels sideways, 1 up / down, inside the eye shape (eye white shows on the
    other side). SIGN: +x = toward the hero's OWN RIGHT (= image-left when she faces the camera), +y = up. motion_r2's
    LOOK_SIGN = [1, 1] is correct.
  viseme: 'rest' | 'A' (open, top teeth) | 'E' (wide) | 'O' (round) | 'U' (pucker) | 'M' (closed / pressed, m b p) | 'F' (f v).
    One name per call (motion sends the strongest weight). 'I' -> use 'E'.
  Cost: one recolour of a ~300-cell faceplate (8 vertices per cell) and a colour-buffer upload only when cells change.
Determinism: all pure functions of the inputs; nothing is cached across frames except the faceplate colours (recomputed from
  the state each call).

## Gate B evidence (engine/out/review/models/r6/)
- rig_joints_r6b.jpg (chest twist / back / bend, all three; guitars ride the chest), rig_feet_hands_r6b.jpg (ankle + toe pitch,
  fist / grip / point / open, all three), rig_springs_r6b.jpg (bun + pencils, hair back 2-segment + side locks, straps, cap + brim).
- face_states_jade_r6b.jpg (rest, blink .5 / 1, look L / R / U / D, A E O U M F, close), face_states_trio_close_r6b.jpg (Charlie,
  Ricky), face_states_medium_r6b.jpg (all three at a medium close-up, 3/4: rest, blink, look, A, O, M).
- Rest identity (split rig ON vs OFF, 36 shots: 18 poses incl. run / draw lunge / sing / jump / throw / shield / chord / sustain /
  dance / hang, 3/4 + back, 1080p): at most 455 of 2,073,600 pixels differ by > 8/255 (0.02%), all at mesh edges / shadow
  boundaries (float re-composition of the joint offsets); run-to-run noise is 0, so these are real but invisible (checked zoomed).
- Canon audit at 2.5: canon_audit_jade_3x_r6b.jpg (tools/models_gate.py audit), canon_audit_charlie_ricky_r6b.jpg,
  canon_audit_faces_inscene_r6b.jpg. Results below.
- Default identity after ALL edits: carve 86.8 / 104.6, native 1.25 86.8 / 104.6, 25 1.25 bench shots: max diff 0. The 2.5 path
  without the rig is unchanged by the gate B code (40 shots vs the r6b gate renders: max diff 0).

## Canon audit at 2.5 (r6b; memory/jade-character-rules.md as of 2026-10-16)
- [PASS] pencils: yellow bodies; blue cap + rainbow core, pink cap + graphite; never matching (in hand: blue R, pink L).
- [PASS] bun: BOTH caps up (pink her right / image-left, blue her left), X crossing + tips hidden in the bun, short like the paper art.
- [PASS] hair rule: bun only without pencils in hand (jade_up), long + loose only with them (jade_down).
- [PASS] jacket: cropped white racer jacket, band collar + snap throat-tab (visible between the cups), snap epaulets, chest band +
  small pale-blue dot, ONE orange band per upper arm, 1420 MHz patch on her LEFT upper arm, back = big dot + RARE EARTH on one line.
- [PASS] pants: full-length baggy navy cargo, pockets + flaps, pooled hem over chunky white sneakers, orange straps hanging.
- [PASS] headphones AROUND THE NECK (Jade only): black band, dark cups with orange rims on the collar; never on the ears.
- [PASS] no glasses on anyone; no headphones on Charlie / Ricky; Charlie keeps his flat cap (hatless variant only where the hat is a prop).
- [CAVEAT] hair down + a forward-pitched head from above (118.4 lunge): the near cup can be hidden by the side lock / jaw.

## REQUESTS
To motion_r2 (via the coordinator):
1. With the split rig ON, MotionFigure must NOT split the shin itself (it already detects J.ankleR/L under the knee: keep that).
   With the rig OFF the r5 shin mesh still contains the shoe, as before.
2. Set finger poses, springs and the face AFTER voxfig pose() each frame (rest() resets them).
3. The orange straps hang from J.hipR/L (thighs), not the pelvis; Charlie's cap joints exist only on 'charlie' (not 'charlie_nohat').
4. Visemes: one name per call; there is no 'I' (map to 'E') and 'MBP' / 'FV' are 'M' / 'F'.
To the coordinator: flipping the split rig on everywhere = FIGRIG default (one line in voxfig) once motion_r2 has run with it.

## Open problems (gate B)
- Rig at rest is invisible-but-not-bit-identical (<= 0.02% pixels at mesh edges), so turning it on in a shipped cut changes bytes.
- Finger poses are separate hand meshes swapped by visibility (no per-finger joints / in-betweens); grip has a visible channel
  when empty. A pencil held in 'open' / 'point' floats (keep 'fist' with pencils).
- Pelvis / chest: large bends (>25 deg) show the plug at the cut (jacket / jeans coloured, no hole). The pant hem does not follow
  the foot (it stays with the shin), the boot shaft above the ankle stays with the shin.
- Look moves the iris by at most 2 fine voxels: readable in close-ups, subtle at medium. Blink is one value for both eyes.
- Spring parts are rigid pieces: large rotations show a seam at the pivot (plugs fill it with hair / strap colour).
- 2.5 build cost +~25% (rig data built for every 2.5 model even when unused); could be made lazy if init time matters.

## Default flip (coordinator, after motion_r2 verified rig:true) -- DONE 2026-10-16 ~14:00
- voxfig FIGRIG: the split rig is ON by default wherever rig data exists = native models at --figres 2.5 only. Opt out:
  `?figrig=0` / `render.js --figrig 0` / `tools/models_shots.js --figrig 0` / globalThis.FIGRIG = false / buildFigure(..., { rig: false }).
- render.js: `--figrig 0|1` pass-through added next to --figres (with --fig; backup out/bak_r4/models_r6/render.js.pre_figrig).
- heroes.js: rig data is LAZY (native.rig getter builds it on first use, then frees the lattices): model build back to r6 cost
  (jade_up ~430 ms); with the rig on, init still pays it once at buildFigure (5 variants: ~1.9 s off -> ~2.6 s on).
- Checks: carve 86.8 / 104.6 + native 1.25 86.8 / 104.6 + 25 1.25 bench shots: max diff 0. 2.5 with --figrig 0 vs the r6b gate
  renders (40 shots): max diff 0. 2.5 default: face states / rig active (bench); in-scene 104.6 on vs off differs by ~3% of pixels
  = motion_r2's life layer (gaze, blinks, wrists, springs) now driving the heroes, as intended.

## r6c (coordinator, from flood_k09's 118.767 crop) -- DONE 2026-10-16 ~14:40
1. "Pale stick across the loose hair" = the 2.5 strand grooves (2 base voxels deep = the full 1.6-unit hair shell) cut THROUGH to
   the skin-coloured scalp; looking down a groove (bent forward, from behind) showed a skin line. Not a pencil / headphone part
   (both checked). Fix (HI): the scalp under the hair is painted hair colour (Jade: outside the face window above y 80 / 82.5;
   Ricky: same idea above y 88.5), plus a backing hair sheet inside Jade's back curtain (gaps between clumps show hair).
   Spring pieces now overlap their neighbours by a 3-voxel band (sdf.js splitMesh band; identical faces at rest), so a swinging
   hairBack / strap never opens a crack. A ~8-px pale fleck remains at 118.767 near the crown (the canon centre part / forehead
   seen from above); the stick is gone.
2. Black fitted undershirt (HI): the midriff layer (y 47.6-54.4 under the jacket) is the black 'top' material, so a bend shows
   black, not skin. This also replaces the bare-midriff strip in standing views (paper art: black top under the jacket).
Sheet: out/review/models/r6/bend_fixes_r6c.jpg (118.767 before / after, bench groove line before / after, bent + springs hair
down / up from behind / 3/4 back / both sides, standing r6b vs r6c).
Checks: carve 86.8 / 104.6, native 1.25 86.8 / 104.6, 25 1.25 bench shots: max diff 0. 2.5 rest rig on vs off: <= 454 px (as before).

## r6d (Jade's note on half2_v2 + correction to r6c) -- DONE 2026-10-16
- 1420 MHz patch (HI, every Jade variant): centred ON the orange left-arm band (y 64.6, was 69.2) and painted over it (the '-z'
  projection now also takes 'orange' voxels), per inputs/jade_anime.png. The 1.25 path is NOT changed: there the patch centre is
  y 69.6 (r ~2.6, spans ~67-72), i.e. ABOVE the band (63.4-65.8), not on it.
- Midriff back to skin (r6c's full black undershirt reverted): black crop top (to y 52.7) + a bare midriff strip above the belt
  when standing, as in jade_anime.png. Scalp fix + hair backing sheet + spring overlap from r6c kept.
- Sheet: out/review/models/r6/canon_r6d.jpg (jade_anime.png; front / 3/4 her left / side her left / back full body + 3x crops;
  3/4 her right, hair up front, patch close-up, waist close-up).
- Checks: carve 86.8 / 104.6, native 1.25 86.8 / 104.6, 25 1.25 bench shots: max diff 0.
- Noticed (pre-existing since the density spike, not changed): the outermost RARE EARTH letters wrap onto the jacket's side
  curve, so a black 'R'-like mark shows on the side view behind the left arm. The reference shows no lettering from the side.

## r6e (coordinator: RARE EARTH must stay on the flat back) -- DONE 2026-10-16
- sdf.js FONT36 (3x6 bold sans: R A E T H, the FONT46 shapes narrowed); jacketBack() uses it at RES >= 2.3: one line, 37 voxels
  = 14.8 units (was 44 / 17.6), about the dot's width, gap 1 kept.
- heroes.js (HI): a flat back panel under the line (roundBox at x -5.71, flush with the back's centre, z +-7.9, y 55.8-59.4), so the
  outermost letters sit on a flat face instead of the curve; no letter voxel is left on a side-facing step (side view clean).
  Cost: a faint rectangular panel edge is visible in back close-ups (reads like a printed band).
- 1.25 untouched. Sheet: out/review/models/r6/canon_r6e.jpg (canon_r6d content + r6d side mark vs r6e side / back / 3/4 back).
- Checks: carve 86.8 / 104.6, native 1.25 86.8 / 104.6, 25 1.25 bench shots: max diff 0.
