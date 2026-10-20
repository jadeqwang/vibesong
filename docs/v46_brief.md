# v4.6 brief: Jade's v4.5 picks (2026-10-19)

Jade's paste, verbatim:
> yes you can delete the earlier cut. v4.5 review: 0:00 Charlie strum: groove; 0:52 ENTER: chord; 1:15 level up: notes; 1:30 laser: close on Ricky; 2:01 recruit: new; 2:18 lock strum: strum; 2:30 jam: play + light; 2:41 cart power: power; 3:00 slabs: new; 3:07 outro Ricky: fixed, alt; Build next?: End on Charlie strumming the 2011 page (3:14)

Applied by the coordinator: every pick except the outro was already the live switch value (STRUM_V45 'groove', ENTER_V45 'chord', LVL_V45 'notes',
LASER_V45 'wave' (= "close on Ricky"), RECRUIT_CHORD 'new', LOCK_V45 'strum', JAM_V45 'light', CART_V45 'power', SLAB_STRUM 'new').
Outro = "fixed, alt" = r2: act5/spread.js:79 `LIVE = LIVES.v45r2` (r1 line kept as a comment at :78). full_v4.5_preRicky.mp4 deleted.

## Unit
| unit | note | owns | predecessor |
|---|---|---|---|
| **v46_outstrum** | 3:14 (scout #4, ~194.06-195.4): the outro push into the left page = the 2011 graphite sketch, Charlie alone. Make him strum, reusing v45_open's 0:00 rig so the video ends the way it opened | act5/spread.js (outro push / page layer only; do NOT touch LIVES/LIVE), new files under media/act5/tex/ and assets/v4_stills/tools/v46_outstrum/ | v45_scout.md (#4), v45_open.md, v45_ricky.md |

Hygiene, canon, checkpoint rule, render command: same as docs/v45_brief.md. Cap $5. Checkpoint engine/checkpoints/v46_outstrum.md, backups engine/out/bak_v46/.
