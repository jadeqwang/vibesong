# talos_r5 checkpoint (round 5 build, 2026-10-17): Talos rooms re-staged per docs/game_design_half2_r5.md, 86.385-107.13

Brief: docs/round5_build_brief.md + the coordinator's talos_r5 task. Owns: src/scenes/act3/drop.js, verse2.js, prebattle_props.js,
talos_plan.js (+ this unit's new files drop_r5.js / verse2_r5.js). Everything new is behind `--r5` (render.js) / `?r5=1`.
Backups (before the first edit): engine/out/bak_r5/talos_r5/ (drop.js, verse2.js, prebattle_props.js, talos_plan.js, common.js, render.js).

## Status
**M2 delivered (2026-10-17 ~15:20): stopped at the gate, nothing running.** out/review/talos_r5/m2.mp4 (86.385-107.2, 540p, 30 fps,
audio, review flags + --r5; 22.7 MB), m2_sheet.jpg (one frame per second, 21 frames), m2_canon_crops.jpg (Jade at 2x from 1080p
stills: 86.72 back, 93.6 running, 96.15 front). Checks on the final code (render_chk8.log.gz): beam-vs-solid 0, beam-vs-hero 0,
hero-vs-prop 0, unsupported 1 frame off screen (Ricky 96.77, the lift-ride artefact). Default identity re-checked after the last
edit batch: md5 identical, max diff 0. talos_dump.json absent.
**M1b delivered (2026-10-17 ~15:00).** out/review/talos_r5/m1b_sheet.jpg = the four re-composed
frames (86.4, 90.375, 101.2, 104.6) beside their keyframes + 92.9 (approved, unchanged); 1080p stills in out/review/talos_r5/m1/.
Default identity after ALL edits: no-flag stills 90.4 / 104.6 at 1080p, md5 identical to the pre-edit baseline (3eb8821b / a2d51b78),
max pixel diff 0. Checks (full 86.385-107.2 render, 30 fps, 627 frames, out/dev/collide_r5.mjs on out/dev/r5chk/render_chk7.log.gz):
beam-vs-solid 0, beam-vs-hero 0, hero-vs-prop 0, unsupported 1 frame, off screen (Ricky 96.77, the lift-ride artefact below).
Timing: Charlie lands on the plate 88.885 (0.027 s late), Ricky's lift hop-off 0.069 s late; Jade on the lip 93.65, at the gate
94.05 (field open 93.75-94.09). Next: M2 (540p mp4 with audio) on the coordinator's notes.
- Earlier: test stills of every shot rendered at 540p (out/dev/r5a/, scratch) and fixed twice:
  the reveal focus (look_r5 `focus` on Jade), Charlie's glide path moved west of the standing slab, Room B's key turned to a 3/4
  side key (keyAz -8 / keyElev 14 through look_r5; the r4 k8SunAz 42 backlit the whole room into silhouette under the r5
  key/fill ratio), first person with look_r5's dof 0 / beam 0 / rim 0, Room 2 cameras at chest height relative to the terrace.
- Ladybug hand-over (battle_r5 REQUEST): one shared rider `Q.ladybug` (makeBug ladybug, s VOXEL*0.6, crawl) at the cap crown +
  (-3, -1.5, 0), rotation.y 0.4, idle, every frame of Room 2 (on the cap when it is the trampoline) and Room B, so the swirl
  frames at 107.15+ carry it.
- Flag plumbing: `R5()` in src/scenes/act3/common.js (lines 66-67) and `--r5` in render.js (doc line 15, page URL line 149) were added by
  another r5 unit while I was reading; I use them as-is (no duplicate). prebattle_props.js `R4` also returns true under R5() so one
  flag picks the whole r5 path (`--r5` needs no `?pb=r4`).

## Plan
1. [x] Node-safe planner: talos_plan.js RA5 (Room A r5 layout), roomATracksR5, deckYA5, PLAN.r5 + liftRise5 (the stuttering lift),
   R2_5 + room2TracksR5 (Jade's poke detour, Charlie's duck), RB5 + roomBTracksR5 + plateHeld5 (Room B times/acting, no step-off threat).
2. [x] prebattle_props.js: ensureR5(R): makeStub (eraser-arc bite + smudge lip + crumb pile), makeStele (text decal), makePlate,
   makeSocket (with a hole), the cap canopy + strings, checkerMat (PAL.missingA/B, Act I's missing-texture colours), makeHousing
   (open cage + cog + checker skin + glitch rings), makeStrut (the 丿 stroke with a Crystal).
3. [x] drop.js: `setup()` dispatches to drop_r5.js under R5(); slashPose / heroBlock / aimYawLocal / aimPitch exported (no behaviour change).
4. [x] drop_r5.js (NEW): Room A r5 (reveal, one slab in three strokes, Charlie's glide, rising receiver, FUNCTIONS!, firefly flicker,
   bridge swing + colouring). 5 shots on beats 209/213/217/221.
5. [x] verse2_r5.js (NEW): Room 2 (+ beetle in the lift housing, Jade's poke, ladybug close-up) and Room B (reveal hold, point / nod /
   plant on beat 248 / moth stutters / hat tip, eye-lines). [ ] verse2.js dispatch line.
6. [ ] First test stills -> fix layout / culls -> look_r5 API (r5Shot) -> M1 sheet (86.4, 90.375, 92.9, 101.2, 104.6 vs keyframes),
   canon crops, A/B default stills (no --r5) vs the baseline, the three checks (support / beam-vs-solid / hero-vs-prop) -> report.

## Room A r5 layout (talos_plan.js RA5; all cameras look +z from behind the party at chest height)
amp (670,18) on its plinth aimed at the socket; the road stub x 740-820 / z 24-76 with the bite (circle c (780,96) r 36) + crumbs;
ONE slab: pier at (800,90), plank 46 wide lands at (790,262) (mesa A's lip, y 10); the 丿 strut from the top east corner carries the
crystal (~y 125 when standing, x ~830); wall c (684,262) x 620-748, 82 tall above the mesa; socket (756,310) (the receiver rises
out of it on 89.68), plate (790,310), gate (770,362) facing the bridge; stele (884,-46). Line checks (by hand): amp -> socket passes
the wall plane at x 742 (blocked by 6); crystal -> receiver passes at x ~773 (clear of the end by 25); the A1 camera (866,42,-170)
sees the whole socket ring past the wall's end (its sightline passes x 767 at the wall).
Timeline: 86.45 test pulse splashes on the wall | 86.63/86.87/87.13 strokes 一 (pier + hinge beam) 丨 (leaf) 丿 (strut + crystal) |
freeze 87.26-87.83 | 88.30 Charlie pops the hat at the lip (charlie_nohat + the canopy = capGeo x7 on strings), glides, lands on the
plate 88.86 (track jump + a glide y-profile), canopy folds back to the cap by 89.02 | 89.68 receiver rises | 89.95 chord: beam
amp -> crystal (90.05, it snaps its aim) -> receiver (90.15), lamps 90.29/.32/.35, freeze 90.375-91.11 | 91.11 swing starts, jolts at
20 % (91.27), receiver flickers with the firefly's off-beat glow (91.11-92.56) | heys 92.56/93.18/93.58 (lyrics_timed word onsets;
the design doc's 92.9/93.2 are not the sung onsets): the firefly hops twice, flies off blinking ON the beat; the slab resumes 92.56,
slams 92.86; the beam fades as it lies down (receiver latched) | Jade runs 92.86, colours the plank, field drops as she reaches the
gate; Ricky runs 93.76; Charlie steps off 93.7, tips his hat 93.85.
Shots: A1 86.385-88.052 reveal (hold) | A2 88.052-89.694 glide (spring cam behind Charlie) | A3 89.694-91.335 glamour + re-hit |
A4 91.335-92.975 firefly close-up (the slab slams in its background) | A5 92.975-94.204 the crossing.

## Room 2 / Room B r5 (verse2_r5.js)
Room 2: lift rise = liftRise5 (3 jerks to 40 % 95.9-96.18, stall, free after the poke 96.26, top 96.42; Ricky hops off 96.613 as r4);
gear housing (open cage) at (645,34,314) with the beetle circling inside (bug anim ringR), checker skin flickers + glitch rings on each
jerk; Jade's poke = press() with the pencil fist on the cog (hit 96.2); the beetle rolls out west and away (gone 97.1). C1 lowered to
y 52. C4 100.735-101.0: ladybug close-up on the cap as Charlie ducks (chest/head bend) through the gate.
Room B: RB5.T plant 103.988 (beat 248), fp 102.768-104.803, moth 104.9/105.3 (each stalls the bridge 0.2 s, the receiver dips), pull
105.2, hatDrop 105.52, tip 105.68, off 105.618; Charlie points (pointArm + 'point' hand) 101.04-101.5 then jogs to the plate (101.955);
Jade nods (clip 'yes' at 101.42) then picks up (~102.1); B1 reveal (900,40,660)->(1050,20,410) fov 48 held a bar; k08b frame lowered
to y 54. Eye-lines for all three on every beat (look specs).

## Look (look_r5 API as used)
- Every Room A shot: `look.r5 = { columns: { keep: [] }, dof, focus, beam }` (A1 dof 0.22 focus 110 from the camera; A2 dof 0.4 on
  Charlie; A3 beam 1, dof 0.5, focus the socket, columns keep M0 M1; A4 dof 0.7 on the firefly; A5 dof 0.4 on Jade). Plus the
  scene's own per-frame cull of the colonnade / ruin meshes and voxel instances in x 560-1060, z -340..-20 (restored after render).
- Room B: the r4 `k8SunAz: 42` backlight + the preset's 12-degree key from +x put the whole room in the inland hills' shadow under
  --r5 (silhouettes, black floor; verified: keyAz 90 / keyElev 26 lit it fully). r5 uses `keyAz 34, keyElev 18` (a 3/4 back-side
  key from the right-rear of the north-looking cameras) on every Room B shot; first person adds dof 0 / beam 0 / rim 0.
- Room 2: dof 0.45 with the focus on each shot's subject; beam 0.

## M2 (coordinator's M1b notes folded in)
- M1b verdict: PASSED (92.9, 104.6, 101.2 approved as is). Tweaks folded into M2: the reveal crane ends at ~1.5x head height
  ((830,104,-98) by 86.72) and keeps rising gently to (832,112,-96) through the stop to 87.26; the glamour camera pulled back and
  down ((672,44,-152) -> (740,36,230)): heroes ~half the frame height, sky ~45 %, more of the beam's run and the lit receiver.
- Hand-over to battle_r5 at 107.13 -> 107.15: the ladybug rider = Q.ladybug (makeBug ladybug, s VOXEL*0.6, crawl, origin at the
  cap crown + (-3, -1.5, 0), rotation.y 0.4, anim idle), on Charlie's cap every Room B frame (the 4 swirl frames render this scene).
  Last Room B camera (B4 at 107.13): pos (1032, 67.0, 673), target (1110, 2, 435), fov 44, focus (1065, 30, 500); look_r5 fields
  dof 0.4 / beam 0.85 / keyAz 34 / keyElev 18; Charlie is the last across (on the bridge, x ~1100), Jade and Ricky on mesa B.
- Beat list (song time; cuts on beats 209 / 213 / 217 / 221 / 224 / 230 / 234 / 240 / 245 / 247 / 250 / 252):
  86.45 (no pulse) | 86.63 / 86.87 / 87.13 the three strokes slam up (+0.2 s rise each), freeze 87.26-87.83 | 88.052 cut A2 |
  88.30 Charlie pops the hat at the lip, lands on the plate 88.885 (accent 88.86, +0.027) | 89.06 Ricky plugs in | 89.68 receiver
  rises | 89.694 cut A3 | 89.95 chord, beam at the crystal 90.05, at the receiver 90.15, lamps 90.29/.32/.35, freeze 90.375-91.11 |
  91.11 re-hit: flicker + swing, jolt 91.27 | 91.335 cut A4 (firefly) | heys 92.56 / 93.18 / 93.58 (lyrics_timed word onsets): hops,
  flies off; slab resumes 92.56, slams 92.86 | 92.02 Jade runs, on the plank 92.9, lip 93.65, gate 94.05 (field 93.75-94.09) |
  92.975 cut A5 | 93.7 Charlie off the plate, 93.85 hat tip | 94.204 Room 2: vault lands 94.889, cap bounce 95.16/95.255/95.6, stomp
  95.825, lift jerks 95.9-96.18, stall, poke hit 96.2, beetle out 96.26, lift top 96.36, hop-off 96.683 (+0.069), C2 96.659, C3 98.292,
  foot test 100.2-100.62, step 100.66, C4 ladybug close-up 100.735 | 101.0 Room B hold (plug 101.28, chord 101.36 splashes on the
  stack) | 102.768 B2: point 102.78-103.06, nod 102.8, pickup 103.22-103.58, Charlie on the plate 103.45 (curtain opens) | 103.581
  first person, crosshair snaps 104.35-104.45, plant 104.7, receiver 2 lit 104.733 | 104.803 k08b frame, moth bonks 104.9 / 105.3
  (bridge stalls 0.2 s each), bridge full 105.64, spare hat out 105.26, on the plate 105.52, off 105.618, tip 105.68 | crossing
  Jade 105.75, Ricky 105.8, Charlie 106.25 | 107.15 swirl (battle_r5).
- Motion warnings left: Charlie's plate landing +0.027 s; Ricky's lift hop-off +0.069 s (accepted); "charlie move arriveAt 88.15 not
  reachable" (benign: he is at the lip by 88.2); "jade move arriveAt 95.92 not reachable" (she is at the poke spot by 95.95).

## REQUESTS
- motion_r2: a planted foot whose locked ground is a moving platform keeps following it after the figure has jumped off (one frame
  at 96.77, 14 above the terrace); the ride should stop at take-off.
- look_r5: (1) the mesa-B far columns / temple colonnade seen from Room B's first person are not registered (keep ['M1'] leaves
  them); (2) `columns` passed through LOOK({ r5 }) applied for me, the keyAz / keyElev too (battle_r5's note on columns may be
  the registry, not the path).
- world/look_r5: Room A r5 hides, per frame and restored after render, every world mesh / voxel instance in x 560-1060, z -340..-20,
  y > 8 (ruins/colonnade between the camera and the party), W.ruins, W.compose root, the avenue cypresses x 560-1060, s88. A
  set-side column-density control for that box would be cleaner (see look_r5 API).
- creatures (promote later): firefly "scared off" = idle anim + glow driven by T.beatPulse (ON the beat); beetle "rolls out" = the
  scene moves the placement point while anim 'bug' keeps circling.

## M1b (coordinator's M1 notes, 2026-10-17 afternoon): the four re-composed frames
Verdict on M1: 92.9 approved; 86.4 / 90.375 / 101.2 / 104.6 re-composed as asked. Sheet: out/review/talos_r5/m1b_sheet.jpg
(1080p stills out/review/talos_r5/m1/m1b_*.png beside their keyframes, 92.9 unchanged).
1. Reveal: the A1 camera cranes from chest height (822,60,-112) to just above head height (828,94,-100) over 86.385-86.72 (up before
   FIXTURES!), tilting down so the bite stub + crumbs, the drop (mesa A's cliff face; a sliver of water at the left), the wall in
   the amp's line, the gate and the socket + plate all sit in frame; the stele leans back (rotation.x 0.42, h 38) with the carved
   prompt sharp for the first half second (look_r5 focus on the stele, dof 0.1), then a rack to the gap (86.6-86.9). The test-pulse
   splash and the turn's switch-4 click beam are out of the r5 reveal.
2. Glamour: the slab now stands at mesa A's lip in the sea beside the wall's east end (pier (792,250)) and falls SOUTH into the
   bite (its tip lands on the stub at (786,64), bridging the eraser bite); the 丿 strut leaves its east flank at mid-height so the
   crystal sits at chest height (y ~46, x ~845): the relay amp -> crystal -> receiver bends in plan only (crystal -> receiver passes
   the wall's end by ~28). Camera (676,50,-110) -> (740,42,230) fov 48, low behind the party: Jade (672,2) in front of the amp (the
   tripod-equivalent spot), Ricky (648,-16) at its jack, Charlie far on the plate; the beam emerges past Jade as one diagonal to the
   crystal, the lit receiver + gate a soft bright point at the centre, focus on Jade (dof 0.22), columns keep [], sky ~45 %.
3. Room B: B1 101.0-102.768 holds the lock from behind the party at the terrace edge ((970,44,652) -> (1040,16,430), fov 50): the
   stack takes the amp's shot (101.36), socket, curtain + receiver 2, plate; everyone stands (Ricky plugs in). New B2 102.768-103.581
   from the west ((846,44,588) -> (962,28,498)): Charlie points at the plate (standing, 102.78-103.06, an explicit shoulder euler
   with the back straight: pointArm()) and walks to it (on it 103.45: the curtain opens); Jade nods (102.8) and picks up the tripod
   (103.22-103.58). First person 103.581-104.803 (beat 247 -> 250).
4. First person as a viewmodel: pitch -34, fov 80, the tripod carried ahead-right (crystal ~10 deg below centre, right of the
   crosshair; the head, hub and upper legs fill the lower-right third), crosshair snaps onto the socket 104.35-104.45, the socket
   ring glows under it, receiver 2 behind its curtain at the right; the plant on 104.7 (the view holds on the socket to the cut);
   dof 0 / beam 0 / rim 0, columns keep ['M1'] (the far temple / colonnade columns are not in look_r5's registry).
5. Jade's run starts 92.15 (from beside the amp; on the plank as it settles at 92.86, on the lip 93.76, at the gate 94.16).

## M1 (gate): outputs
- Sheet: out/review/talos_r5/m1_sheet.jpg (1080p stills, review flags `--fig native --figscale 1.3 --figres 2.5 --look k08b --r5`, each
  beside its keyframe: 86.4 vs k07, 90.375 vs k08b, 92.9 (new), 101.2 vs k08b, 104.6 (FP, Talos); Jade crops at 2x from 86.4 (back),
  93.6 (running), 96.15 (poking). Stills: out/review/talos_r5/m1/*.png (+ 960-wide previews v_*.jpg).
- Default identity (no --r5, no flags): stills 90.4 / 104.6 at 1080p before any edit vs after all edits: md5 identical
  (3eb8821b... / a2d51b78...), max pixel diff 0.
- Checks (talos_plan collisionReport + supportReport over a full 86.385-107.2 render at 30 fps, 627 frames; driver out/dev/collide_r5.mjs):
  M1 (before the notes): beam-vs-solid 0, beam-vs-hero 0, hero-vs-prop 0, unsupported 1 frame off screen (Ricky's planted right foot
  at 96.77 rides the lift's locked ground for one frame after his hop-off: a motion_r2 artefact, see REQUESTS). M1b: see the report.

## Self-review against the three rules and the look rules
Rule 1 (show the lock before the tools): Room A opens on one held shot (86.385-88.052, through the FIXTURES! stop) from behind the
party at chest height: the road's bite + crumbs, the wall in the amp's line, the gate's field, the socket + plate, no receiver. Room
B opens on one bar (101.0-102.768) from the party's side: stack, socket, curtain, receiver 2, plate. Honest: at chest height the sea
gap under the bite is hidden behind the far mesa's face; the chasm reads as "the road stops, a stub, crumbs, the far wall", not as
water (the k07 reference camera is above head height). Rule 2 (one physical twist per room): Charlie's glide onto the plate
(SHIP), Jade's three strokes = one slab (PAINT) and her colouring run, Ricky's chord as the relay / the metronome. Rule 3 (the
enemies are here): the bite = the Eraser; the firefly on the lens (blinks off-beat, the receiver flickers), the beetle in the lift's
housing (checker flicker + glitch rings), the ladybug on the cap.
Look: cameras at chest height or lower in every shot (Room 2 at chest height relative to the terrace the heroes stand on, y 68 for a
44-high terrace); one key (k08b's; Room B turned to a 3/4 side key: the backlight put it in the hills' shadow); two colours = the
preset's sand / lilac pair; a focal subject >= 1/3 (the party from behind in 86.4 / 101.2, the firefly's lens in 92.9) or the bright
far receiver (90.375); foreground / hero / far layers (stele + party + wall; plate + trio + receiver 2); sky >= 1/3 on the exteriors
(86.4, 90.375, 101.2); columns: registry keep [] in Room A (M0 M1 kept in the glamour frame = 2 in frame), Room B's default keep.
Honest misses: the 90.375 beam is a shallow Lambda (amp -> crystal up on the slab -> down to the receiver), not k08b's single
diagonal: the crystal must sit high to clear the wall's end, and from behind the party the two legs show; the FP frame at 104.6 shows
mesa B's colonnade (> 3 columns) in the look_r5 default keep set; the reveal's stele inscription is soft (tilt-shift near field).

## Open problems (honest, M1b)
- Charlie's point (102.78-103.06) is a level left-arm point from the shoulder with the back straight (pointArm(): an explicit
  shoulder euler, slerped by w), but from B2's camera (west of him, 3/4 behind) the arm points away and is mostly hidden by his
  body; the gesture reads weakly. A camera on the cliff edge (north of him) would show it in profile but puts Jade 60 units from
  the lens.
- The firefly 92.9 close-up no longer has the slab slamming in its background (the slab now falls south onto the stub, behind the
  camera); the slam at 92.86 is seen in A5 (cut 92.975) as settling dust.
- In first person the far temple / colonnade columns of mesa B are not in look_r5's registry: ~3 near + several far columns show.
- Ricky's hop-off (Room 2): one off-screen frame where his planted right foot stays at the lift's height after he left it (the
  planted foot "rides the ground it locked on", motion_r2). Request below.
- Jade's third waypoint set is tuned by hand (the planner cut the stub's corner once); re-check after any Room A change.
## Open problems (honest, M1, kept)
- Stele inscription readability at 86.4 (see above); the bite reads as a stub end, not as water below.
- Charlie's point at 101.04-101.4 bends him forward (the shoulder slerp + the walk's turn) more than a clean point.
- Charlie's run to the lip: the planner reports arriveAt 88.15 not reachable (starts 87.839 after the stop); he lands 0.027 s late
  (88.887 for 88.86). Ricky's Room 2 hop-off lands 0.069 s late (the stuttering lift tops out at 96.36). Both < 0.1 s.
- The canopy is Charlie's cap x4.4 (a flat cap seen from below); it reads as a cap-chute from the glide camera, less so from far.
- The test-pulse splash on the wall (86.45) and the switch-4 click beam from the turn (86.385-86.585) both sit in the reveal.
- The firefly's close-up background (92.9) shows blurred mesa-B columns at the far right (look_r5 keep [] culls only registered ones).
