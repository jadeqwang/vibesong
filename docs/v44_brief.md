# v4.4 brief: Jade's notes on v4.3 (2026-10-19 ~10:15)

Jade's paste, verbatim:
> v4.3 review: Opening page and save file: Change; Card 03 timing: +6; Charlie's hat: Still see grey; Card 04 timing: +0; The walk: Restage as a walk; Outro spread: Reshoot again.
> Note: 0:06 - charlie's hat is grey here
> 0:08 - why is Jade's sprite's face kinda messed up here?
> card 03 - +6 is correct for most of the line, but +0 is correct for "because"
> the walk - something about this walk feels kinda boring / not engaging, and I'm not sure exactly why. it's not glitchy like before, but I think we can do something to make it more interesting.
> 1:47 - could use a little bit more body language expressiveness, but also this looks so good that we should have more seconds of this than the 3d rendered one.
> outro spread - i wish it were as good as the other colored pencil singing scenes

Already applied by the coordinator: card 04 = +0 (`paper_0048_v43_shift+0.mp4` copied over `paper_0048.mp4`).

## Read first
docs/RESUME.md (the v4.3 handoff block at the top), docs/v4_passB_brief.md (gates, hygiene, ownership; still valid),
your unit's old checkpoint (named below), memory/jade-character-rules.md (canon; gate every frame on it, crop Jade 2-4x),
memory/jade-review-by-video.md (she judges by ear/eye from VIDEOS: give switchable 540p variants, never stills only).

## Units (wave 1 starts ~10:20, wave 2 ~10:30)
| unit | wave | notes it fixes | owns | old checkpoint |
|---|---|---|---|---|
| **v44_open** | 1 | 0:06 grey hat in the pixel cold open; "Charlie's hat: still see grey" = sweep the WHOLE video for any grey hat; 0:08 Jade's pixel sprite face on the SAVE FILE screen | scenes/act1/cold_open.js, char_select.js, paint_run_ship.js, kaizo.js (hat tags only), act2/chorus.js (hat tags only), act3/world/props.js (hat materials only), media/act5/tex/save02/*, sprite assets for the save screen | passB_open_close.md, v43_hat.md |
| **v44_paper** | 1 | card 03: +6 for the line but +0 on "because" (smooth time-warp, no visible jump); card 05 at 1:47: animate with expressive body language and hold it longer than the 3D band shot | media/cutscenes/**, tools/cutscenes/**, scenes/paper_inserts.js, act4/paper.js; the card-05 window in act3/act4 stage files only with the coordinator's OK | passB_paper.md |
| **v44_walk** | 2 | restage 81.6-86.4 as a real WALK that is engaging, not boring | scenes/act3/turn.js, core/motion/track.js | v43_walk.md |
| **v44_spread** | 2 | outro spread 186.65-194.9: as good as the colored-pencil singing cards | scenes/act5/spread.js, media/act5/frames/** | passB_paper_spread.md |

Shared files: render.js nobody edits. show/main.js: own block only, re-read before each edit, small edits.

## Checkpoint rule (Jade expects an interruption)
- Write `engine/checkpoints/v44_<unit>.md` FROM THE START and update it after every meaningful step: what changed (file:line), backups,
  what is running, gen spend, next step. Someone with no context must be able to resume from that file alone.
- **By 11:00 CDT** be at a safe point: no half-edited source files, every edit backed up, renders either finished or noted as safe to rerun.
  Report to the coordinator then, even if not finished.
- Don't start a long paid gen batch or a long render right before 11:00 unless it's safe to lose.

## Hygiene (as passB): backups to engine/out/bak_v44/<unit>/, `node --check`, `export TMPDIR=$PWD/out/dev/tmp` in engine/,
disk ~6 GB free (540p only, clean your temp), GPU shared (check nvidia-smi, `--workers 1`, one render at a time per unit),
log every paid gen in media/genlog.jsonl. Gen caps this round: paper $25, spread $25, open $5, walk $5 (project ~$112 of $500).
Deliverable per unit: 540p section clips with audio in `engine/out/review/v44/<unit>/` (with variants where it's a taste call), plus the checkpoint.
