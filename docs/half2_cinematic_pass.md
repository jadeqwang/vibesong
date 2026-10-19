# Half 2 cinematic pass (round 4): plan

Status: **DECIDED 2026-10-16 ~11:00 (Jade's answers, docs/decisions.md "Jade's answers on the round-4 decisions page").** Amendments
that override the text below: density 2.5 with RARE EARTH letters ALWAYS shown; no room title; the Talos level design is
docs/pages/talos_level.svg (fixed amp-emitter, a wall that blocks the easy shot, the tripod is upright with legs down, Room B's plate
holds a field window open); the 119.02 paint flood becomes the k09 cresting colored-pencil wave; shutter ~120° for action; lip sync yes;
canon: both bun eraser caps UP, headphones around the neck, Jade's chin less pointy. Native heroes in half 2 (the turn is a follow-up).
Original status: PROPOSED 2026-10-16. Jade's ask on half2_v1: "make this half really visually stunning and cinematic." Her notes:
smoother gameplay that makes sense (especially the Talos part), characters that move like modern video-game characters and
never slide, and RARE EARTH on the jacket on ONE line (if voxels are short, keep the pale blue dot over the text; would we raise
the voxel density?). Targets: keyframes k08b and k09 (`keyframes/concepts/`). Canon: memory `jade-character-rules.md`.

## What I saw in half2_v1 (watched at 2–5 fps, plus 1080p stills)

1. **The motion is what makes it read as cheap.** The rig has one run cycle and hand-set poses. Positions are straight lerps, so
   the run cycle doesn't follow the distance covered (feet skate) and anims snap from one to the next with no blend. Turns pivot in
   place, nobody accelerates or decelerates, jumps have no crouch or landing, and between actions people stand frozen in a row. At
   86.8 Ricky lunges at nothing; through 101–107 the trio stand stiff while the beam does the work.
2. **The Talos room doesn't say what the goal is.** We never see the locked thing before it's solved. The numbered diamonds,
   floating rings and beams appear without a rule, the slabs fall, and the payoff (a gate opening) never happens on screen.
   Cuts jump across the line, so the geography (where's the gap, where are we going) is lost. Talos works because you see the
   locked gate, the emitter and the receiver first, then watch the connection being made.
3. **The look is far from k08b.** The plaster is gray-white and flat-lit, the grass is a flat green slab, and there's no
   haze, light shafts or depth. The heroes are lit the same as the walls. There's no motion blur, so fast moves strobe, and voxel
   edges crawl.
4. **The heroes are close but still blocky up close.** At RES 1.25 (~121 voxels tall) faces are ~14 voxels wide, hands are
   mittens, and the jacket back can't fit the dot plus RARE EARTH on one line (34 voxels of text on a ~30-voxel back).
5. Smaller: the battle stage is a bare white bowl, the bugs float and don't walk, the erased world (129–136) is a flat lavender
   plane instead of blank paper, the Eraser's face is a flat decal, and at 154–162 the party stands in a line facing camera (the
   "blob" again) when the design calls for all nine working at once. The cart's wheels don't match its speed.

## 1. Motion: game-quality character animation, no sliding

The approach modern games use, adapted to our deterministic renderer (every frame is still a pure function of t):

- **Motion-capture clips, retargeted.** Quaternius Universal Animation Library 1 + 2 (CC0, 250+ humanoid clips: idle, walk,
  jog, run, sprint, jumps, vault, climb, push, pick up, wave, cheer, dance, punch/throw, sit) retargeted onto our rig. Hand-keyed
  poses stay for the bespoke ones (guitar play, draw lunge, hat throw/shield), but they blend into and out of the mocap.
- **Rig upgrade:** split the torso into pelvis + chest (hip sway and counter-rotation), and add ankles/feet (heel-toe roll),
  wrists and simple fingers (fist, point, grip, open). The native models are already voxelized per part, so this means splitting
  parts, not remodeling.
- **Root motion and foot locking.** Paths are splines with real accel/decel. The cycle phase is driven by *distance travelled ÷
  stride length*, so the feet match the ground speed, and a two-bone foot IK pins the planted foot (no skating). Feet follow the
  ground height (stairs, slabs, the stone `e`). Facing follows velocity with damping, with a lean into turns. Starts, stops and
  turns use transition clips.
- **Blending and layers.** Every anim change crossfades over 0.15–0.3 s. Upper-body actions layer over lower-body locomotion
  (Ricky strums while he walks, Jade draws while stepping).
- **Jumps with weight:** anticipation crouch, take-off, a ballistic arc with one consistent gravity, landing squash, recovery.
  Landings stay on the beat (choreo already solves for that).
- **Secondary motion:** deterministic springs (each frame re-simulates a fixed 1 s look-back at a fixed dt, so frames still
  render in any order) on loose hair, the bun pencils, the orange straps, the slung guitars and Charlie's cap brim.
- **Life:** blinks, eye darts, heads and eyes that look at whatever matters (the beam, the bug, each other), breathing, idle
  weight shifts. Nobody is ever fully frozen except on the song's deliberate stops.
- **Contacts:** hands on the tripod, the pressure plate, the guitar neck and the YES button via arm IK (already used for the
  shield pose).
- **Creatures:** procedural gaits. The insects walk on an alternating tripod gait, wings flap with motion blur, the caterpillar
  moves by peristaltic waves, and the beetle's wheel rolls at ground speed. Cart wheels spin at ground speed, with spring
  suspension and dust.
- **Lip sync for the singing beats:** mouth shapes keyed to the word times already in `analysis/lyrics_timed.json`.

## 2. The Talos room (86.4–107.13), rebuilt as one readable puzzle

Talos grammar: show the lock, show the tools, make the connection, open the lock. Our version keeps every beat of the approved
design (Jade's slabs, Charlie's order, Ricky's beam, the co-op crossing) but makes the rule visible first. One screen direction
for the whole journey (left → right toward the far mesa) and no line jumps.

| Time | Beat | What's on screen |
|---|---|---|
| 86.385–86.63 | **Puzzle reveal** | A crane-up over the trio's shoulders reveals the gap, the far mesa, and a **force-field gate** there with a dark **receiver** on its post. A small Talos-style room title fades in bottom-left: `A·2  FIXTURES & FUNCTIONS`. We now know the goal. |
| 86.63–87.81 | **FIXTURES!** | Jade's three slashes each slam up a graphite slab in the gap (anticipation, slash, slab rising with dust and camera punch). Freeze on the stop: three slabs, a draft at random angles, each with a dark **connector** crystal on top (Talos connectors). |
| 88.48–89.88 | **Charlie plans** | Charlie throws the boomerang hat. It flies one smooth readable arc, touches each crystal in order, and leaves a dotted path 1→2→3 across the gap (SHIP = the plan). Ricky plugs in and aims. |
| 89.95–91.085 | **FUNCTIONS!** | Ricky's chord fires the beam into crystal 1. It relays crystal to crystal **in Charlie's order** and hits the receiver. The receiver lights, and the gate's lamps light one by one. Freeze on the stop: the k08b glamour frame with the beam lit. |
| 91.11–92.56 | **The re-hit** | The powered slabs swing down along the dotted path into a bridge. Jade colors each one as she runs across it (color = function, it stays). The force field drops as they reach it. |
| 92.56–94.20 | **hey hey hey** | The three co-op gestures at the open gate. |
| 94.22–100.10 | **Room 2: the climb** | A raised terrace. A Talos staple: a pressure plate holds a lift. Each hero's half-1 room-1 solo, in 3D, with mocap: Jade's flip vault, Ricky's heavy hop, Charlie's hat bounce. The bug plants stay (ladybug on the cap, firefly glitch on the cypress, beetle circles). |
| 100.12–100.98 | **because** | The stone-letter gate. Ricky tests the `e` with one foot (it holds), and the eraser bite shows on a letter. |
| 101.00–107.13 | **The co-op crossing (k08b)** | Charlie stands on the plate to drop the field. A 1.5 s **first-person shot** (the Talos homage): Jade's hands carry the tripod connector, a crosshair dot, and she plants it. Ricky's beam goes through the tripod to the receiver, and the pencil-stroke bridge draws itself across. **The classic Talos solution:** Charlie pulls a hat out of his hat and leaves it on the plate so he can walk off it. All three cross. The moth bonks the beam twice. |

The camera plays like a third-person game recording: a follow cam with lag and gentle overshoot, swinging behind whoever acts.
Fewer cuts, each one motivated.

## 3. Heroes: double the voxel density

Yes, raise it: **RES 1.25 → 2.5 (~240 voxels tall).** What it buys:
- **The jacket back matches the real costume artwork** (`rare-earth-techno-remix/costume/artwork/back_dot_and_lettering.png`):
  a big pale-blue dot with **RARE EARTH on one line** below it, the same width as the dot, in a 4×6 bold sans. If a shot is too
  small for the letters to read, they fall back to the dot alone (your priority).
- Faces ~28 voxels wide: real eyelids (blinks), iris highlights, readable mouth shapes for lip sync, finer brows.
- Fingers, sneaker soles, cargo pocket flaps, strap buckles, hair strand grooves at a real scale.
- **Risk to check first:** your likeness has to be re-approved at the new density (you haven't given notes on face_jade_r5 yet;
  I'll show the r5 face at 2.5 next to it). Voxel and perf cost: about 4× the surface quads per hero, fine on the 3090. Spike first.
- The near world gets the same density treatment where heroes touch it (the ground they stand on, props in hand), so the heroes
  don't look finer than the world.

## 4. The look: k08b, not gray plaster

- **Palette and light:** warm sandstone instead of gray-white. Golden-hour key with a cool sky fill, purple→orange sky as in
  k08b, volumetric light shafts, height fog over the sea, rim light on the heroes to separate them from the walls.
- **Ground:** voxel grass tufts, flowers, moss in the cracks, chipped stone edges instead of the flat green slab.
- **Lens:** focus pulls on story beats (DOF already exists), streaks and bloom on the beams, a light vignette and grain.
- **Motion blur + anti-aliasing:** render N jittered sub-frames per frame across a 180° shutter and average them. That gives real
  motion blur and kills the voxel edge crawl in one feature. It's deterministic (still a function of t) and costs N× render time.
- **Master at 1080p** (the review cuts stay 540p).

## 5. Cinematography

One screen direction per sequence. The 180° rule holds in the battle (party on the right, bugs on the left, as now). Shots hold
≥1.5 s outside the montage. Each cut lands on a beat and has a reason. Signature shots to design carefully: the puzzle reveal (86.4),
the k08b frame at the FUNCTIONS! stop (90.4), the first-person tripod shot (~102), the battle swirl, the Eraser rising
in low-angle silhouette against the sun (123.2), the 画 lock (139.4), the cart launch at 出发 with a slow-motion
ramp (visual only), and the drop-2 aerial.

## 6. Section notes (beyond the motion and look passes, which apply everywhere)

- **Battle (107–123):** dress the stage (flowers, banners, spotlights rigged on columns). Party idle-bounce on the beat. Bugs
  walk in, and nobody floats. Every tech gets anticipation, a 2-frame hit-stop, a camera punch and impact particles. The battle UI
  is good as it is.
- **Erased world (129–136):** the ground is blank paper (paper grain, faint pencil grid, eraser crumbs, smudges), so "the colored
  world hanging over the blank page" reads at world scale.
- **The Eraser:** sculpted per the creatures sheet, with animated brows, blinks and a mouth.
- **All nine (154–162):** one wide shot with everyone working at once, as designed (not a line-up facing camera).
- **Cart (160–173):** wheels at ground speed, suspension, dust, a speed-lines pass during the speedrun.
- **Act V + outro:** keep. The headphones question on the paper art is still open (separate).

## 7. Order of work and gates

1. **Spikes (code only, opt-in flags, nothing approved changes):** (a) density: Jade at RES 2.5 with the one-line back,
   turnaround + perf numbers; (b) locomotion: one mocap walk/run retargeted with foot lock vs. the current run, a side-by-side
   clip; (c) motion blur + AA sub-frame accumulation on a fast shot. **Jade sees those three before the full build.**
2. Rig upgrade + motion library (motion unit), density bump (models), look pass (density/world), all behind flags.
3. Re-stage section by section with the new motion: Talos room first (it's the biggest change), then the battle, Act IV, Act V.
4. Re-render half2_v2 at 540p for review → notes → 1080p master with motion blur.

Budget: code-only plus CC0 mocap, so ~$0. Any image-gen reference gets its own cap and is logged.
