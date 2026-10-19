# talos_r4 checkpoint (round 4 build, 2026-10-16): the Talos room rebuild, 86.385-107.15

Brief: docs/round4_build_brief.md + the coordinator's talos_r4 task (Jade: "rebuild it as proposed", tripod upright, real level
design per docs/pages/talos_level.svg, homages = first-person tripod carry/plant + Charlie's hat on the plate, NO room title).
Owns: src/scenes/act3/drop.js, verse2.js, prebattle_props.js (+ new files of this unit: drop_v2.js / verse2_v2.js = the approved
v2 staging moved verbatim; the new code is in drop.js / verse2.js + the node-safe talos_plan.js).
Backups (before any edit): engine/out/bak_r4/talos_r4/ (drop.js, verse2.js, prebattle_props.js, paintlog.js).

## Status
**M4 delivered 2026-10-16; stopped at the gate, nothing running.** Review (out/review/talos_r4/): `talos_m4.mp4` (86.385-107.2,
540p, audio, `--fig native --figscale 1.3 --figres 2.5 --look k08b`), `talos_m4_sheet.jpg` (per beat), 1080p stills
`talos_m4_reveal_1080p.jpg` (86.6), `talos_m4_glamour_1080p.jpg` (90.5 = the 90.375 stop), `talos_m4_k08b_1080p.jpg` (104.6),
`talos_m4_k08b_105.0_1080p.jpg`, side by sides `talos_m4_k08b_vs_k08b.jpg` (104.6) / `talos_m4_k08b105_vs_k08b.jpg` (105.0).
M4 src backup: out/bak_r4/talos_r4/m4/ (pre-relayout state of this session: out/bak_r4/talos_r4/m4_prelayout/).
Default path re-checked after M4: 88.3 md5 4d8b44a4b562, 104.0 md5 29095f0a98a5 (same as before).

## M6 (DONE: support check + Room B crossing on the bridge) -- state log, newest last
- Backups: out/bak_r4/talos_r4/m6_pre/ (= m5, before M6), m6_wip/ (mid-M6 after the auth cut; two half-applied edits were found
  and repaired: verse2.js Room B `P.yiBridge.hz.setProgress` had been swallowed into a comment; a duplicated comment on RB.BRIDGE).
- Support check: talos_plan.js `supportReport(frames)` + `worldGroundY`: planted feet (contact flag) within 3 of a walkable top;
  a moving hero's lowest foot must be over a walkable top and at most 12 above it (stride flight). Supports in the dump: Room A
  slabs + hinge pads, Room B stroke bridge (instanced voxels as 6-unit bins) + plate + socket, Room 2 terrace / lift / block.
  Driver: `node out/dev/collide.mjs <log>` (prints collisions + support + closest beam-to-hero-axis distances).
- Found: the stroke bridge's 一 glyph rises ~10 to the right, so its top was y 1.5-6 over most of the chasm while the heroes ran at
  11.5 (they ran in the air behind it). Fix: Room B levels it (rotation.z -0.1113, +12.35 y; restored after render), single-file
  lanes z 500 +-1. Room 2: Ricky started off the mesa at x 552 (over the sea) -> 568; the M5 lift-ride offset doubled the ride
  (the track ground already includes the lift) -> removed. Room A: Charlie's extra waypoint (648,0) removed (he swung off the
  bridge foot); planks 46 wide (were 36) + graphite hinge pads at the foot and each base (shown when the plank lands) so the
  runners' corner-cutting stays on the bridge. Room B: Jade's pickup spot pulled in from the mesa edge (TRIPOD0 990,524).
- (16:2x) Capsules start at the soles (the visible box included props hanging off Ricky); crystals w/2+11; Room 2: Ricky shuffles
  on the risen lift (the hop-off now starts from its top), lift tops out at 96.3 (was 96.45), two-foot landing; Room B: Jade's
  bridge entry straightened, the stroke bridge also scaled 1.4 in z in this room (lane |z-500| < 12); support check: 'planted' =
  contact flag AND the foot not moving; Ricky's designed foot-tap test (100.2-100.66) exempt. Counts: dump7 66 -> dump10 10.
- (final) Ricky's Room 2 hop-off: a quick shuffle on the risen lift (the track's jump took off from the lift's rest height, so he
  dipped through the terrace edge), lift tops out at 96.3, two-foot landing (recover 0.2); Jade arrives at the gate already facing
  it (her turn step left a foot hovering 9 above the terrace 100.8-101.0); parseDump drops duplicated frames.
- Counts (same checker, all frames 86.385-107.2 at 30 fps, 626 frames): before (the M5 sources with the M6 dump) 141 frame-pairs,
  all support failures (out/review/talos_r4/check_before_m6.txt); after 0 (check_after_m6.txt). Beam vs hero capsules (soles to the top of the head):
  0; closest approaches: Room A relay 5.6-6.1 from a runner's axis (it stops at them), Room B amp beam > 20 from Ricky (the 107.0
  "touch" is screen overlap only). Stroke bridge top at z 500, x 1000-1100: before 3 / 3 / 6.5 / 8 / 9.75 / 11.5, after 13.3 / 11 /
  10.5 / 11.5 / 11 / 10.5 (feet at 11.5).
- Review: talos_m6.mp4 / talos_m6_sheet.jpg. Backup out/bak_r4/talos_r4/m6/. Default 88.3 / 104.0 md5 unchanged.
- Leftover warnings: Jade's third-hey hop lands 0.09 s late, Ricky's hop-off 0.07 s after RK.off (inside the 96.66 cutaway).
- (superseded) crystal offset vs the wider planks (relay grazes slab 1 by 1.2), Ricky x lift at 96.23-96.4 (capsule vs lift box while
  riding: check y0), Room 2 planted gaps, Jade x R stride over x 1002 z 521 at 106.07 (route clip at the bridge foot), then
  render talos_m6.mp4 + sheet.

## M5 (collision check: "the laser cuts through a solid / the players walk through the tripod")
- Check: talos_plan.js `collisionReport(frames)` + `parseDump(log)` (node). Frames come from an R4 render with
  engine/out/dev/talos_dump.json present (prebattle_props `talosDump`: one '[engine] TDUMP' line per frame with the drawn beam
  segments, one OBB per solid mesh, hero capsules from their visible bounds, on-screen flags). Driver: `node out/dev/collide.mjs <log>`.
  Rules: beams free for 5 units at each segment end (emitter / relay / splash target), heroes r 5.5 from feet+5, solids < 4 tall
  are floor, relays (Crystal) are not solids. Remove the json after a check (renders log nothing without it).
- Before: 458 frame-pairs in 26 groups (out/review/talos_r4/collide_before.txt). After: 0 (collide_after.txt).
- Fixes: Room A amp aimed at the receiver; test pulse now splashes on the wall face (A.wallHit; it stopped in mid-air);
  wall shorter + south (c 720,207, len 84; battlements inside its ends) so the low bridge beam clears it; crystals 4 units further
  out on the slabs; the relay stops (with a splash) at any hero who crosses it (heroBlock); Ricky's run starts via (622,0) (went
  through the amp plinth). Room 2: the lift ride offset was never applied (Ricky sank into the rising lift): applied; planted poses
  clamped to the floor (turn steps/landings dipped 5-10 units); Charlie's cap spot (608,392) + boing landing (668) so his arc
  clears the terrace edge. Room B: Ricky stands 20 back from his amp (was inside it); the stroke bridge moved south of the tripod
  (z 500) so nobody crosses the amp -> tripod beam; crossing routes go around the tripod (>= 20 units); the crossing pan follows
  them down onto the bridge.
- Review: talos_m5.mp4 / talos_m5_sheet.jpg. Backup out/bak_r4/talos_r4/m5/ (pre-M5: m5_pre/). Default 88.3 / 104.0 md5 unchanged.

## M4b (reveal fix, coordinator review)
- A1 reveal camera: eye level over the meadow, ~4-12 deg down, longer lens: (585,70->78,-240->-246) -> (618,50,40), fov 34. The trio
  walks 3/4 at the lower centre-right; the wall tower, the gate + field and the sea gap are behind. W.ruins (its column filled the lens)
  and the voxel ruin instances north of the causeway are hidden/zero-scaled in A1 only (restored after each render).
- The "white bar" was the turn's switch-4 click beam (P.beam), which never switched off in R4: now off after 86.585 (its 0.2 s).
  Anamorphic streaks off in A1; the test pulse's lens flash is smaller (it splashes on the wall in the middle distance).
- Switch 4's green cube: small, half out at the left edge (it is continuity from the turn, visible until 87.385).
- Review: talos_m4b.mp4 / talos_m4b_sheet.jpg / talos_m4b_reveal_1080p.jpg. Backup out/bak_r4/talos_r4/m4b/drop.js. Default 88.3 / 104.0
  md5 unchanged.

## M4 changes
- Room A (option a, talos_plan RA): amp (600,18) + slabs strung along the causeway's sea edge and the gap, wall in the middle
  (x 720, z 110-230), receiver (760,300) + gate (826,294) on mesa A. Topology unchanged. FUNCTIONS! stops are now a diagonal row
  along the causeway's north edge: Ricky (580,-20) at the amp's jack, Charlie (626,-22), Jade (664,-16) (slab 1 hid Jade from every
  west camera at her old spot). Reveal starts spread out: Jade (624,2), Charlie (590,-9), Ricky (552,8). Charlie's run starts
  SWING0+0.4 (was +0.5): he now arrives 93.84 (< 93.95; was 94.43).
- A1 reveal: from over the meadow north of the trio looking south (628,128,-78) -> (660,-6,110), fov 66, slow crane up; the trio sits
  across the lower right, wall / gate / mesa A behind, test-pulse splash on the wall kept. The north ruin meshes hide in A1 only.
- A2: over the sea south-west of the slabs, looking east along the causeway, following the hat (no more column / head in the lens).
- A3 glamour: (470,101,23) -> (670,19,66), fov 54: Ricky playing nearest (left), Charlie, Jade behind in a diagonal row, the
  zig-zag amp -> 1 -> 2 -> 3 -> receiver left to right, receiver (right edge) + lit gate (top right), sunbeam on.
- Room B re-laid to match k08b (talos_plan RB; the wall-with-window is gone): ruined sea stack in the chasm (1046,406) blocks the
  amp's straight shot (splash on the stack); socket on the cliff edge (990,468) sees both; receiver 2 (1118,392) behind a field
  curtain (square to the socket's line) on mesa B, open only while the plate is held; plate (936,510), Ricky + amp (950,422)/(962,420),
  tripod start (990,532), Jade's stand (982,487) with her right hand on the planted tripod to 105.7; bridge (yiBridge) at z 444.
  Cameras look north along the cliff edge; sun turned ahead-right for this room (LOOK k8SunAz 42).
- Room B shots: B1 lock wide 101.0-102.768 (1.77 s, cut moved to beat 245) | first person 102.768-104.396 (view turned +33 deg
  toward socket + receiver 2, crosshair snaps 102.9-103.0) | k08b frame (992,75,637) -> (1010,19,325), fov 44, pan right with the
  crossing from 105.7.
- Crossing re-staged: Jade first (105.75), Ricky (105.98), Charlie last (106.08), turn while walking (autoTurn off): gaps >= 34 units
  in 105.6-107.2 (no pass-behind at 105.95-106.55). Charlie's threat step goes right (no edge crop).
- First-person pink wash: the crystal is not lit and glows are small in FP (checked at 103.15 / 103.3: clean).

## M4 frame times
- 86.6 reveal (1080p still); 86.63/86.87/87.13 slabs rise; 87.26-87.83 freeze. 88.48 throw, taps 88.878/89.284/89.55 (A2).
- 89.95 chord, 90.375-91.11 glamour freeze (1080p still at 90.5). 91.62/92.16/92.59 Jade on the bases, gate 93.03.
- 101.0-102.768 B1: lock wide (beam splashes on the stack 101.4+, plate lights 101.84, curtain opens). 102.768 cut to first person;
  103.105 plant, receiver 2 lit 103.138. 104.396 the k08b frame (104.42-104.84 threat: dark until 104.76; moth bonks); 105.0 is the
  closest to the keyframe; 105.2-105.62 hat trick; 105.75-107.15 crossing pan.

## M4 open problems (honest)
- k08b frame: composition matches (Charlie on the glowing plate left fg, Ricky playing centre-left, Jade right with her hand on
  the tripod, beam to receiver 2 at right, bridge across the chasm, sunbeam top left, backlit ruins) but the look differs: our sky is
  hazy cream, not the keyframe's purple/orange; the bridge is the straight 一 stroke (dark until 105.85), not a curving stone arm;
  the curtain/receiver sit closer than in the keyframe; Charlie sometimes leans. 104.6 is inside the threat (curtain closed, beam
  ends at the curtain): 105.0 is the cleaner match.
- Reveal: the camera looks south from the meadow (the only side where the trio sits in front of wall/gate/receiver); pitch ~30 deg
  (establishing beat). In it the trio walks slightly right-to-left/into depth; the beam axis runs into depth, so the A1 -> A3
  change of side is soft but present. Jade's slash streak crosses the frame at 86.6; the green sign prop sits bottom left.
- Glamour: all three read, but Charlie is half behind Ricky; the trio faces the amp/camera rather than the beam.
- A2 shows mostly slabs + the tower; the trio is small at the left; slab 1 still hides Jade during the hat taps.
- Jade's third-hey hop lands 0.09 s late (was 0.05); Room B screenCheck still flags Jade/Ricky (7 deg apart in the k08b frame,
  readable on screen: Ricky is behind, between Charlie and Jade).
- B1 is high and wide (lock read over hero size); the curtain is small in it.

## M3 changes
- Room A re-laid for eye-height cameras looking SOUTH from behind the trio (game over-the-shoulder; the crossing goes away into
  the picture, then the bridge run tracks it left -> right from the west): amp on a plinth (560,20) aimed across the gap, slab 1 rises
  IN its line (582 -> 570,46), wall 84 long x 80 tall across the amp -> receiver line, receiver on a short pillar (665,304) and
  the gate (718,322) both just past the wall's east end, so they show on the far mesa, backlit; slab crystals now sit on the slabs'
  sides at beam height (they still ride the planks when the slabs lie down: the honest-power logic is unchanged).
- Reveal: the red X and dashes are gone; at 86.45 the amp fires a short test pulse along its aim that splashes on the wall
  (flare + sparks ~86.58) before slab 1 rises into that line (86.67). A1 is one 1.67 s shot from behind the trio.
- Glamour stop (A3): lower 3/4 behind Ricky (he plays in the right foreground), Jade + Charlie stand back (east) during it; world_look's
  sunbeam is on; gate lamps lit.
- Bridge run (A4): a tracking shot alongside the runners at their height, from the west (left -> right), the low beam on the planks
  beside their feet; it swings round (up and over) to face the three past the gate for hey hey hey. Single file staged by start
  times (MotionGroup's yields slowed the run by ~0.5 s).
- Avenue cypresses x 500-820 hidden in A1-A3 (restored after each render).
- Slabs: lighter graphite (plaster 0x6e6e78, low metal) + the hatch.
- Room 2: C1 closer and lower (heroes ~1/2 frame).
- First person: game viewmodel placement (the tripod head + crystal ~25% up from the bottom centre, both fists with pencils on the
  folded legs just under the head, forearms from below), pitch -34 deg, view turned 22 deg toward receiver 2, a soft glow on
  receiver 2 as the target, crosshair dot ~2% of frame height with a ring that snaps onto the socket (102.73); a hard cut into
  first person on beat 244 (102.361) instead of the dive (the dive flew through Charlie's guitar).
- Room B k08b frame: plate moved to (948,470) right of the wall, tripod start (898,486); camera (780,80,520): Ricky at the amp left,
  Jade at the tripod centre, Charlie on the plate right, nobody covering anyone in 103.99-105.62 (screenCheck clean).

## M3 open problems (honest)
- The FUNCTIONS! stop is not the k08b frame: from behind the trio the wall and the tall slabs stand right in front of them, so the
  zig-zag past the wall's east end is small and partly hidden, and the trio is cropped (only Ricky's head/shoulders read). A real
  k08b composition needs the puzzle laid out laterally (heroes on one side, the beam crossing to the far mesa on the other), i.e.
  another Room A re-layout (or a separate glamour camera that breaks the eye-height rule). Proposal in the report.
- The reveal reads (gate + receiver backlit on the far mesa, wall, trio), but 87.2-88.0 (after the slabs rise) is crowded: slab 1
  and the wall fill the centre and the heroes are heads at the bottom of frame.
- B1 (Room B's lock wide) is 1.36 s now (lyric cut 101.0 -> beat 102.361); the first-person shot still washes pink for ~0.1 s at
  the plant when the beam passes the lens; Jade still leans forward while carrying.
- Room B crossing (B4): Ricky passes behind Charlie 105.95-106.55 (side-on overlap, 0.6 s).
- Charlie's third-hey hop lands 0.18 s late.

## M2 changes (coordinator notes 1-8 + motion_r2's delivery)
1. First person (102.2-103.99): body-relative game view (her heading, -28 deg pitch, turned 15 deg toward receiver 2 so the socket
   and receiver 2 are both in frame); head, hair and torso meshes hidden (the arms stay); the tripod is carried upright in front
   of her chest by two hands on the folded legs (motion_r2 `carry` on tripod-local grips, a hands-free pass places the tripod,
   then the IK pass), head + crystal at the top, legs down past her fists, pencils still in her fists. Beam width scales with
   the camera's distance to it (screen-thin), the k08b look's bloom floor and streaks are clamped for this shot only (restored
   after the render), world_look's sunbeam is switched off in it. Crosshair: a dot with a soft ring that glides onto the
   socket and pops at 102.73. Plant 103.105: the tripod eases down onto the socket, a camera dip ("thunk"), the view drops to
   the socket while the legs splay, then turns to receiver 2 + the bridge. No crouch clip (it pushed her head onto the tripod).
2. Tripod head: a small faceted clear crystal on a brown-grey metal hub/cup/ring; emission low; glows only at the two points
   where the beams enter and leave (no blob).
3. Room A wall: 150 long, 112 tall, square across the amp -> receiver line. Room A now looks NORTH from the receiver side
   (+x still reads left -> right as in the turn; the crossing comes toward camera): the board (87.24-88.05) sees the wall
   broadside with the straight shot drawn as dashes from the receiver that stop at the wall under a red X (from the reveal
   until FUNCTIONS!). The glamour frame (89.7-91.75) shows the zig-zag around the wall's east end.
4. Honest power: the crystals ride the planks when they swing down (counter-rotated, upright, on the plank rim) and the beam keeps
   relaying along them, low across the bridge, to the receiver until all three are through the gate (Ricky ~93.2); then it fades,
   the lamps go out and the field re-forms behind them.
5. Slabs: dark glossy graphite (plaster 0x34343c, painted = hue) + a pencil-hatch overlay on both faces; bigger gold aim fins
   and a faint ray along each wrong aim from the rise until the hat's tap swings it to the next node.
6. Cameras: A1 crane slower (one long ease), starts west of slab 1; A2 hides the avenue cypresses x 520-820 (restored after
   render); A4 follows from in front / east of the runners; Room 2 C1 higher (lanes swapped so the lift is at the back and
   rises above the others), C3 from the west along the terrace so b | e | cause read left to right; Room B B1 / B3 moved so
   nobody hides anyone (checked with the MotionGroup screen rule, see below).
7. Canon crops: done (see open problems for what can and can't be checked).
8. r4cam.json hook removed.
- motion_r2 features used: ground(x, z, t) for Ricky's lift (feet ride it; the y-offset is gone), `step` (Charlie's threat step off
  and back, his step onto the cap), `MotionGroup({ sideways: false })` for the single-file plank crossing in Room A, `press`
  (Ricky's jack into the amp in both rooms), `carry` + `hold` (tripod carry + plant), `onJoint` (Charlie's hand to his cap) +
  `place` (the spare cap set on the plate; he crouches with the pickup clip), split rig on by default at 2.5.
- Also fixed: drop.js hid compose.root and left it hidden for whatever the same worker rendered next (frames must be order-free):
  now restored after each render, like the A2 cypresses.

## M2 frame times (where each lock reads)
Room A: 86.385 low in the gap at the trio, crane up/back; 86.63 / 86.87 / 87.13 slabs rise (fins + wrong-aim rays); 87.24-88.05
board: wall broadside, red X + dashes, dark receiver + blue field in front; taps 88.878 / 89.284 / 89.55 swing the fins and draw
the trail; 89.95 relay amp -> 1 -> 2 -> 3 -> receiver (90.27) around the wall, lamps 90.29-90.35, stop 90.375-91.11; 91.11 swing,
crystals stay on the planks and the low beam runs along the bridge; field dissolves as Jade arrives (92.68); 92.78 / 93.25 /
93.65 hey hey hey facing camera; the beam fades and the field re-forms ~93.3-93.9.
Room 2: 94.42-94.889 flip vault; 95.16 / 95.255 / 95.6 cap bounce; 95.831 stomp on the lift, rides it 95.9-96.45, hops off 96.61;
97.45 glitch; 98.29-101.0 because, foot test 100.2-100.62.
Room B: 101.0 lock; 101.28 jack in, 101.36 chord -> window flare; 101.83 plate -> window opens, beam misses; 101.5-102.0 pickup;
102.2 dive into first person; 102.73 crosshair snaps onto the socket; 103.105 plant (thunk, legs splay), receiver 2 lit 103.14;
threat 103.86-104.32 (dark 103.96-104.26); moth 104.396 / 104.803; bridge full 104.82; 104.95 hand to his cap, 105.25 the spare
cap out, 105.52 on the plate, 105.62 off; crossing Jade 105.8, Ricky ~105.6 (from the amp), Charlie 105.62.

## Flag / old staging (verified)
- New staging only with `--figres 2.5` (heroes.js RES >= 2) or `?pb=r4`; `?pb=v2` / globalThis.PB_STAGING='v2' forces the old one.
- Default renders run drop_v2.js / verse2_v2.js (the approved v2 moved verbatim; verse2_v2 only imports slabsAt from drop_v2).
  Identity test: a scratch tree with the backed-up files vs the new tree, `--fig native --figscale 1.3` stills at 88.3 / 90.6 /
  97.5 / 104.0 / 107.2: md5 identical (scratch tree deleted). Re-checked after M2: 88.3 / 104.0 still the same md5.

## Files
- `src/scenes/act3/drop.js`: dispatcher + ROOM A (86.385-94.204).
- `src/scenes/act3/verse2.js`: dispatcher + ROOM 2 (94.204-101.0) + ROOM B (101.0-107.15). battle.js still calls its setup for
  the 107.15 swirl frames (works: R4 builds and renders under the swirl).
- `src/scenes/act3/talos_plan.js` (NEW, node-safe): MotionTrack planner `plan()` (until / hopAt), `springCam()` (deterministic
  follow cam: under-damped spring re-simulated from max(t-1.2, shot start)), `holdClock()` (camera clock across the song's stops),
  the three room layouts RA / R2 / RB + their hero tracks (roomATracks / room2Tracks / roomBTracks), plateHeld, liftY.
- `src/scenes/act3/prebattle_props.js`: + R4 flag, ensureR4 (MotionFigures jade_down / charlie / charlie_nohat / ricky; beams,
  dashes, glow pool, cable, crosshair overlay), Crystal (connector: gem, aim fin, glow, sound-ring pulse), Dashes, Field (hex
  force field that dissolves), amp-emitter, receiver, gate (3 lamps + field), Tripod (UPRIGHT: legs splay down, crystal on top,
  set(splay)), r4Stone / r4Graphite (shared triplanar marble + plaster tags -> world_look's k08b kinds). Old exports untouched.
- `src/scenes/act3/drop_v2.js`, `verse2_v2.js` (NEW: the approved v2, verbatim).
- Backups: out/bak_r4/talos_r4/. Dev-only hook still in drop.js / verse2.js: `fetch('/out/dev/r4cam.json')` camera override
  for layout checks (absent file = no effect, one 404 line in the log). Remove before the default flips.

## How each lock reads (M1, frame times)
ROOM A (cameras look east from over the sea west of the gap: the crossing (+z) reads left -> right, the causeway runs in):
- 86.385-87.26 crane up and back from the sea side to the whole room; 87.24-88.05 the board: trio + amp (left, causeway), the
  gap, the wall down the middle (end-on), the gate with the blue field + the dark receiver on mesa A (right). (sheet 87.233)
- 86.63 / 86.87 / 87.13 slabs 1-3 shoot up out of the sea (spray, punch); crystals on top, fins aimed wrong. Freeze 87.26-87.83.
- 88.48 throw; taps 88.878 / 89.284 / 89.55 turn each crystal toward the next; orange dotted trail + faint pink aim rays (89.3).
- 88.5-89.3 Ricky plugs the cable into the amp; 89.95 chord: amp -> 1 -> 2 -> 3 -> receiver (reaches it 90.27), around the
  wall; receiver lights + ring pulse, lamps 90.29 / 90.32 / 90.35; freeze 90.375-91.11 = the glamour frame (sheet 90.5).
- 91.11 slabs swing down one by one into a zig-zag bridge (gravity ease, dust on each slam); the beam drops; lamps + receiver stay
  lit (latched = unlocked). Jade on the bases 91.51 / 91.96 / 92.31, each plank takes colour from her foot; field dissolves
  bottom-up as she reaches it (gate 92.64); 92.78 fist pump through the gate, 93.25 Charlie's high five, 93.65 Jade + Charlie hop,
  Ricky arrives arms up. They end side by side facing camera (93.8).
ROOM 2 (cameras look north): 94.42-94.889 Jade's flip vault over the block onto the terrace (a real somersault about the hips);
  94.97-95.6 Charlie's cap down, onto it 95.16, BOING 95.255, lands on the terrace 95.6, cap flies back 95.8 (ladybug rides it);
  95.831 Ricky's heavy hop onto the lift (stomp on "life"): its plate glows, the lift rises 95.9-96.45, he hops off onto the
  terrace 96.61 and it sinks again (the plate holds the lift). Beetle 95.84-97.07. 96.659-98.292 cutaway: firefly on the 82.93
  cypress, checker glitch 97.45-97.55. 98.292-101.0 crane along the terrace (colour path in Jade's wake) to b | e | cause;
  Ricky's two-tap foot test 100.2-100.62, steps on 100.66; Charlie has the cap ready.
ROOM B (cameras look north-east): 101.0 lock shown: amp on a plinth behind the wall, closed field window, plate, tripod (folded)
  south of the wall, socket ring at the edge, receiver 2 dark across the chasm. 101.36 chord: the beam hits the closed window
  (flare). 101.78 Charlie on the plate: conduit lights, window dissolves, the beam flies on and misses (glow on the far column).
  101.5-102.0 Jade picks up the tripod. 102.2 the camera dives into her eyes: FIRST PERSON 102.2-103.99 (sleeves with the
  orange band + patch, her hands with the pencils holding the tripod, the crosshair dot on the beam over the socket); 103.105
  plant on "linked": legs splay down, the crystal catches the beam (glow), relays to receiver 2 (lit 103.14, ring pulse), the
  view turns to it. 103.86 the threat: Charlie steps off (window shut, beam + receiver dark 104.06-104.34, bridge fades back),
  steps back on; moth bonks 104.396 / 104.803; bridge full 104.87; 105.2 hat off, a second cap out of it, onto the plate
  105.52; 105.618 he walks off, the plate stays down. 105.618-107.15 side-on wide: all three cross (Charlie last, ~107.1).

## Shots (cuts on beats unless noted)
A1 86.385-88.052 | A2 88.052-89.694 | A3 89.694-91.746 | A4 91.746-94.204 || C1 94.204-96.659 | C2 96.659-98.292 | C3 98.292-101.0
|| B1+FP 101.0-103.988 (one continuous shot: wide, then the dive into first person at 102.2) | B3 103.988-105.618 | B4 105.618-107.15.
All >= 1.5 s. 94.204 / 101.0 are the lyric-line cuts that already existed (101.0 is not on a beat).

## Motion (M1)
Every hero position comes from MotionTrack (motion_r2's current track.js: named speeds, arriveAt / landAt, jerk-limited starts,
turn steps) + MotionFigure (foot lock + leg IK). Actions are voxfig anim layers (draw_graphite, throw, chord, victory, pull) or
mocap clips (interact = plug in, pickup = tripod, carry_walk arms). Joint overrides: Jade's slash arm, her flip tuck, Ricky's
foot taps. Lift ride = a y offset on Ricky's group (MotionTrack ground has no time). Remaining warnings (all < 0.1 s): Charlie's
cap step 95.16 (reached 95.17), his last hop 93.83 (+0.06 s).

## REQUESTS
- motion_r2 (done: timed ground, step, column/sideways:false, onJoint/place, carry/hold/press; all used). New:
  (1) MotionGroup's speed governor opens 1.8 s before a crossing conflict, so one late conflict on the Room B bridge slowed
  Ricky's whole walk to the edge by 2-3 s (and its standing-spot staging moved him off the amp's jack). An option to stage only
  standing heroes for the camera (no speed yields), or a narrower governor window, would let me use it in Room B; for now Room
  B is hand-staged and checked with the same screen rule (talos_plan.js screenCheck). (2) `carry` + a hip bend: carrying the
  tripod at chest height she still leans forward a lot (the hip bend decides by the farther hand); a carry mode without the bend.
- world_look (M4): a per-shot sunbeam switch (`LOOK({ k8Beam: 0 })`) instead of my hiding the mesh in first person; I use
  `k8SunAz: 42` for all of Room B (the cameras look north). Also: the compose arcade / s88 columns and (A1 only) the merged north
  ruin meshes are hidden by drop.js and restored after each render.
- world_look: a per-shot `LOOK({ k8Beam: 0 })` would be cleaner than my hiding the sunbeam mesh (found by name in 'k08b_ground')
  in the first-person shot. The compose sea arcade / s88 columns are still hidden by me in Room A (restored after each render).
- models_r6: nothing blocking.

## Open problems (M2, honest)
- First person: much better, but still busy: the beam is close to her path so it crosses the lower frame at an angle; the crystal
  reads big in the last 0.1 s before the plant; she leans forward while carrying (hip bend). Receiver 2 is small (far) until she
  turns to it after the plant.
- Room A board (87.24-88.05): the wall is the hero of the frame; the trio is small at the top left and partly behind the wall top.
  The crane start still has slab 1 rising large at the right of frame (it is the action, not a pass).
- Single file on the planks works (gaps >= 22 units); Ricky arrives on the third hey without a hop; Charlie's hop lands 0.08 s
  late.
- Charlie's hat trick reads at 540p only as "hand to cap, crouch, cap on the plate": the spare cap coming out is small.
- Canon: hair is down with the pencils in her hands for this whole range (canon allows it), so the "both bun caps up" check does
  not apply here; RARE EARTH one line under the dot (104.6 clear; 101.85 partly behind her arm); headphones on the neck with
  orange cups (93.85 front); one orange band per sleeve + the round patch on her left arm; baggy navy pants with orange straps.
  Not confirmable at 3x: which hand holds the pink-cap pencil in every frame.

## Open problems (M1, kept for history)
- No k08b look yet (rendered without `--look k08b`): everything is white plaster; the wall, gate and terrace read as white boxes.
- Room A: the wall is a plain box seen end-on; it reads as "between amp and receiver" in A3 but not strongly as "blocking". The
  slab bridge's zig-zag is functional, not beautiful. The crane at 86.6-86.9 passes close over the slabs (fast). Heroes are small
  in the board shot (87.2-88.0).
- Receiver latch: after the swing the beam is gone but the lamps / receiver stay lit (= unlocked). Readable, not Talos-literal.
- A2 Charlie's hat follow is busy (cypress / colonnade crowd it); A4's high truck sees the wall briefly as the heroes pass it.
- Room 2: the terrace and lift are bare boxes; C1 is wide and Ricky blocks the lift at times; C3 is close on the letters (the
  b·cause word reads only partially). Jade's flip has no hand plant on the block.
- Room B: the first-person view is bloom-heavy when the beam is close (102.6-103.0); the tripod sits low in frame; B1 is 1.2 s
  wide + 1.8 s FP inside one continuous shot. The k08b composition in B3 is close but Charlie and Ricky overlap at moments.
  The hat trick is fast (0.4 s) and the spare cap pops out without a hand IK.
- Ricky has no hop on the third hey (arrives arms up instead).
- Not re-checked: carve figures (no R4 without figres anyway), Jade's canon crops at 3x (models' heads; the FP sleeves show the
  orange band and the patch).

## FROM world_look (2026-10-16, coordinator task: per-range Act III sun elevation for the k08b look)
Only affects `--look k08b` renders; default and the approved paths are untouched. The sun AZIMUTH stays yours (W.setSun /
SUN_DIR); with k08b on, world_look sets the ELEVATION per time range (src/scenes/act3/world/k08b.js `SUN_ELEV`):
86.385-94.204 = 11 deg, 94.204-107.15 = 12 deg, 107.15-123.18 = 13 deg (the old default sun was 7.5 deg).
Per shot you can override it from your frame()'s look, no file of mine to edit: `look: LOOK({ ..., k8SunElev: 9, k8SunAz: -10 })`
(k8SunElev in degrees; k8SunAz = optional turn of the azimuth in degrees about +y). Lower = longer shadows (k08b reads ~9-12).
Also available with k08b: an art-directed sunbeam (upper left) in 89.95-91.085 and 101.0-107.13, placed from your camera and
`target`; tell me (engine/checkpoints/world_look.md REQUESTS) which shots should have it or not. Ask there for any change.
