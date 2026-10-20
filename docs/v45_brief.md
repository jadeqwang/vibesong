# v4.5 brief: Jade's notes on v4.4 (2026-10-19 ~11:40)

Jade's paste, verbatim:
> v4.4 review: Hat at 0:06 and sprite face: Good; Sprite face: Open mouth; Battle caps: Good; Card 03: R18; Card 05 length: Long (2.4 s); Card 05 timing: +0; The walk: orbit; Outro spread: take B.
> Note: * the body language of outro take B is good, but Ricky needs to look more like himself (see photos and character sheet), which he doesn't quite here. He looks more or less like himself in other pencil scenes.
> * 0:00 - can we animate some guitar strumming on Charlie, even here?
> * overall, I'd like to find opportunities for more Charlie and Ricky actions. Like 2:30, they could be playing their guitars, or Ricky's guitar could be bringing light here. 1:15, maybe Ricky's guitar playing is needed to help level up reality. maybe at 1:30, ricky's guitar playing turns on the laser?

Already applied by the coordinator (11:45): walk = orbit (`WALK_V44 = 'orbit'`, act3/turn.js:115), outro = take B (`LIVE = LIVES.v44b1, CAMV = 'page'`, act5/spread.js:71).
Backups engine/out/bak_v45/{turn.js.v44,spread.js.v44}. Already in show from v4.4: open-mouth face, card 03 R18, card 05 long (t1 109.62) at +0.

## Read first
docs/RESUME.md (v4.4 block at the top), docs/v44_brief.md + docs/v4_passB_brief.md (gates, hygiene, ownership; still valid),
your unit's predecessor checkpoint (named below), memory: /home/jade/.claude/projects/-home-jade-Documents-vibesong/memory/{jade-character-rules,jade-review-by-video,vibesong-project}.md.
Characters: Charlie = flat cap, acoustic guitar, wrote the song in 2011. Ricky = electric guitar (Strat), striped shirt. Refs: inputs/charlie_anime.png, inputs/ricky-anime.png,
assets/sheets/** (paper/party sheets), the approved pencil cards (media/cutscenes/paper_*/). Song-time = picture time in the show (engine/src/show/main.js).
Guitar music: strums/hits should land on real guitar events in the audio (find onsets in the mix or any stem in the repo; data/cues.json, show/timing.js, core/motion/beats.js has strum helpers).

## Units
| unit | wave | note | owns | predecessor |
|---|---|---|---|---|
| **v45_ricky** | 1 | outro take B: keep the body language, make Ricky look like himself (as in the other pencil cards) | act5/spread.js (LIVES table + its own LIVE entry), media/act5/**, tools/cutscenes/pb_spread44*.py (copy to pb_spread45*) | v44_spread.md |
| **v45_open** | 1 | 0:00: Charlie strums his guitar on the 2011 sketch page | scenes/act1/cold_open.js, the 2011 page layers/tools (assets/v4_stills/tools/passB_oc/**) | passB_open_close.md, v44_open.md |
| **v45_laser** | 1 | ~1:30: Ricky's guitar playing turns on the laser (the beam through FUNCTIONS) | scenes/act3/drop.js / drop_r5.js (whichever is live), act3 world files only for Ricky/beam bits | v43_walk.md, round-5 talos checkpoints |
| **v45_lvl** | 2 | ~1:15 (72-77.76, REALITY LV1 -> LV2 bar): Ricky's guitar playing is needed to level up reality | scenes/act2/chorus.js (that window), its sprite assets | act2 checkpoints |
| **v45_jam** | 2 | ~2:30 (~147-155, "That's it, the fixtures and the functions"): Charlie and Ricky play their guitars; Ricky's guitar brings light | scenes/act4/main3d.js (+ act4 world files) | act4 checkpoints |
| (v45_jam, added 11:55) | 2 | Jade: "maybe also while they're flying on the composite bug/feature contraption, Ricky's guitar playing provides power?" = the party cart ride ~160.8-168 (ROLL/BUILD/launch 165.87) | act4/main3d.js cart section | |
| **v45_scout** | 2 | "overall, find opportunities for more Charlie and Ricky actions": read-only sweep, ranked proposals with timestamps, no code | nothing (writes engine/checkpoints/v45_scout.md) | none |

Shared: render.js nobody edits; core/motion/* read-only (put new helpers in your own scene file); show/main.js only via the coordinator.
Taste calls: give 2-3 switchable variants (a const switch in your file, like WALK_V44), each as a 540p clip with audio.

## Checkpoint rule
Write `engine/checkpoints/v45_<unit>.md` from the start; update after every meaningful step (file:line, backups, what is running, spend, next step).
Someone with no context must be able to resume from it. Backups to engine/out/bak_v45/<unit>/. Report when at a safe point.

## Hygiene
`node --check`; `export TMPDIR=$PWD/out/dev/tmp` in engine/; disk ~4.9 GB free (540p only, clean temp); GPU shared (nvidia-smi, `--workers 1`,
one render at a time per unit); every paid gen in media/genlog.jsonl. Caps: ricky $20, open $8, laser/lvl/jam $5 each (project ~$122 of $500).
Render a section: from engine/, `node render.js --show main --from A --to B --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 out/review/v45/<unit>/X.mp4 --audio --workers 1`.
Canon: audit every frame with Jade, Charlie or Ricky (crop 2-4x) against memory/jade-character-rules.md; Charlie always has his hat (never grey).
Deliverable: 540p clips with audio in engine/out/review/v45/<unit>/ (variants where it's a taste call) + the checkpoint.
