# Round 4 build: shared brief for every unit (2026-10-16)

Read first, in this order: docs/RESUME.md (ROUND 4 block + the HANDOFF gotchas), docs/half2_cinematic_pass.md (the plan; its
Status block lists Jade's amendments, which override the body), the last section of docs/decisions.md ("Jade's answers on the
round-4 decisions page"), the character canon at ~/.claude/projects/-home-jade-Documents-vibesong/memory/jade-character-rules.md
(the canon CHANGED today: both bun eraser caps UP, headphones AROUND THE NECK, chin less pointy), and your own checkpoint.

## Rules for all units
- Scope: the second half only (86.385–207.2). Never change pixels in half 1 (0–86.4), including the turn 77.76–86.4, unless
  your brief says so. Default renders of approved cuts must stay byte-identical until the coordinator flips a default; put new
  behaviour behind your flag, or behind the existing `--fig native --figres 2.5` path.
- Own only the files your brief lists. If you need a change in a file another unit owns, write the request into your checkpoint
  under "REQUESTS" and work around it; the coordinator relays it.
- Edit shared files atomically: copy, edit the copy, `node --check`, then mv over the original. Back up src you touch first to
  engine/out/bak_r4/<unit>/.
- Every render: `export TMPDIR=$PWD/out/dev/tmp` (from engine/). /tmp is full. Disk has ~30 GB free: keep review output small
  (540p mp4s, jpg sheets), delete your own scratch frames when done.
- The GPU is shared by 4 units: use `--workers 1` or `2`, short ranges, stills where stills suffice.
- Review renders: `--fig native --figscale 1.3 --figres 2.5`.
- ffmpeg: ../.venv/lib/python3*/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2.
- Audit every hero frame you show against the canon (crop Jade 2–4×): pencils/caps, hair rule, jacket (one-line RARE EARTH on
  the back, letters always on), sleeve bands + patch, baggy navy cargo pants with orange straps, white chunky sneakers,
  headphones around the neck.
- Determinism: every frame is a pure function of t (springs re-simulate a fixed look-back at fixed dt).
- Budget: code only. Any paid generation needs the coordinator's OK first.
- Keep your checkpoint (engine/checkpoints/<unit>.md) current: plan, milestones, done/not done, flags, files, review outputs,
  REQUESTS, and honest open problems. Stop at each milestone gate listed in your brief and report; the coordinator reviews
  your sheets before Jade sees anything.

## Units running now
| Unit | Checkpoint | Owns |
|---|---|---|
| models_r6 | checkpoints/models_r6.md | src/core/heromodels/*, FIGURE_SRC / figres in src/core/voxfig.js |
| motion_r2 | checkpoints/motion_r2.md | src/core/motion/*, tools/motion/*, assets/mocap/*, dev entries in src/show/dev.js |
| world_look | checkpoints/world_look.md | src/scenes/act3/world/*, src/world.js, src/voxel.js, src/materials.js, src/env.js, src/look.js, src/post.js |
| talos_r4 | checkpoints/talos_r4.md | src/scenes/act3/drop.js, verse2.js, prebattle_props.js |

Interfaces between units (agree through checkpoints, don't edit each other's files):
- models → motion: new joints from the rig split (pelvis/chest, ankles/feet, wrists, simple fingers) and face states (visemes
  for lip sync, eyelids/blink, eye direction) exposed on the figure API; documented in models_r6.md under "API".
- motion → talos: MotionTrack/MotionFigure (already in src/core/motion, see checkpoints/motion.md); new features (look-at,
  springs, lip sync, arm IK targets, beat-locking) documented in motion_r2.md under "API". Talos stages with what exists and
  picks up improvements automatically.
- world_look → talos: shared materials/palette; talos props use them so they pick up the k08b look.
