# v4.7 brief: Jade's notes on v4.6 (2026-10-19 evening)

Jade's paste, verbatim:
> * 0:04 - during "paint it! run it! ship it!" maybe we can find a way to introduce Jade, Ricky, and Charlie, since we no longer have character intro screens any more
> * 0:21 & 0:49 - singing scenes - the lip sync and expression are a lot better than before, by quite a lot! Whatever you're doing with updated prompts to the video models is great. But can we find a way to amplify expression and body language some more? like she's actively thinking about the lyrics and about vibe coding their way past the known edges of the video game world? I'm thinking about how the body language (and sometimes dance moves) in 1-music-shipped/rare-earth-techno-remix was so incredibly good
> * 1:27 - at "fixtures" and "functions" there's a stillness that feels glitched (like a zoom call that has hung) and I'm not sure why
> * 1:32 - we have a closeup of a glowy thing, but maybe if the camera is actively zooming out, we can see more context for what's going on?
> * 1:47 - singing scene - this is great and way better than past iterations. CAn we get more animated on the body language of all 3? like more excitement / stage presence / energy?
> * 2:07 - lip sync is slightly off in this clip
> * 2:10 - it would be cool if we could tell that the light spiral was being cast by Ricky and our new bug friends or what's going on here? And I think this boss battle could be made visually more coherent and interesting. Can you think deeply about how to do that?
> * 2:24 - this part could be also be more expressive/dynamic. what acting directions would you give her if she's trying to befriend the eraser? also, her arm patch is gibberish here (1420 MHz)
> * 2:38 and also elsewhere, I'm just noticing that Charlie and Ricky's hands go through their guitars while they're playing. Can you update the guitar playing model so that it's accurate? (target what we already do in the other scenes).
>
> (added) at 3:08, the expressiveness is really good! but the arm patch is gibberish, and the shoulder epaulette detail is wrong, and the bottom of the jacket and cuffs shouldn't be orange. (see character sheet)

She watched v4.6 (= full_v4.6b / the 1080p master). Times are song time = picture time.

## Coordinator's read (frames from engine/out/review/full_v4.6b.mp4)
- 0:04 = act1.paint_run_ship (PAINT IT = Jade sprite, RUN IT = Ricky, SHIP IT = Charlie; game design PAINT=Jade / RUN=Ricky / SHIP=Charlie).
- 0:21 = paper.p03 (20.17-23.75), 0:49 = paper.p04 (48.57-50.66), 2:24 = paper.p06 (143.40-146.197, paper_0223), 1:47 = act3.card05 (107.23-109.62, paper_0147),
  2:07 = act4.paper_jade_sing (125.769-128.18, act4/paper.js CLIPS.jade_sing), 3:08 = act5.outro spread (spreadR_v46r2b).
- 1:27: at 87.0-88.0 (FIXTURES slab) and 90.2-91.0 (FUNCTIONS slab + beam) the frame barely changes for ~1 s; heroes stop dead, camera locked. Reads as a hung video call.
- 1:32: 91.5-93 is a close-up of the glowing receiver lens with a bug on it, Charlie's shoulder on the right; no context.
- 2:10: 129.4-136 voxel scene, grey sky, floating orange hatch streaks, Jade/Ricky/Charlie + caterpillar/ladybug bugs + lantern, a white light spiral with no visible source, then 画 strokes and Eraser close-ups (136-143). Cluttered and hard to read.
- 3:08 is the expressiveness bar Jade likes: Seedance 2.5, 9 s, vocal-stem reference, PERF_B-style prompt, wider framing with hands and bodies in frame (tools/cutscenes/pb_spread45_specs.py).
- Rare-earth body language (~/Documents/1-music-shipped/rare-earth-techno-remix/pipeline/seedance_shots.py, docs/TREATMENT.md): each shot had ONE specific, motivated
  gesture tied to the lyric (hand cupped behind the ear to LISTEN, fingers flashing like twinkling stars, a finger crossing the eye like a planet transit, antenna thrust up
  like a sword, hand on chest + other hand reaching to camera), a named eye-line target, an emotional verb, MEDIUM / full-body framing so hands show, and a camera move.
  Our card prompts say "never exaggerated; she stays in place; static camera, same framing", with the hands mostly out of frame. That is the gap.

## Units
| unit | note | owns | predecessor |
|---|---|---|---|
| **v47_intro** | 0:04 introduce Jade / Ricky / Charlie on PAINT IT / RUN IT / SHIP IT (name plates in the game-UI language, e.g. a fighting-game / JRPG "P1 JADE · paints" plate; readable on a phone; 2 variants) | act1/paint_run_ship.js + its sprite/UI assets | v44_open.md |
| **v47_cards** | 0:21 card 03, 0:49 card 04, 2:24 card 06: amplify expression + body language (acting directions below), card 06 patch = round 1420 MHz | media/cutscenes/paper_0020, paper_0048, paper_0223, tools/cutscenes/pb_specs47*.py (new), paper_inserts.js (clip/lag lines only) | passB_paper.md, v44_paper.md |
| **v47_trio** | 1:47 card 05: all three more excited (stage presence, energy); 2:07 jade_sing lip sync slightly off -> timing variants | media/cutscenes/paper_0147, act3/card05.js, act4/paper.js (jade_sing entry only) + its clip | v44_paper.md |
| **v47_drop** | 1:27 stillness at FIXTURES / FUNCTIONS; 1:32 pull the camera back from the receiver close-up to show context | act3/drop_r5.js, act3/slab_insert.js, act3 drop camera code | v45_laser.md, v45_accents.md |
| **v47_boss** | 2:10 the light spiral is visibly cast by Ricky + the bug friends; the Eraser boss battle (129.4-143.4) visually coherent + interesting. DESIGN FIRST (doc + keyframes), coordinator approves, then build | act4/main3d.js 123.35-143.4 window, act4/eraser3d.js, act4/glyph.js, act4/world4.js (boss bits) | v45_jam.md, act4 checkpoints, docs/game_design_half2_r5.md |
| **v47_hands** | 2:38 and everywhere: Charlie's and Ricky's hands go through the guitars in 3D. Fix the playing pose (fretting hand on the neck, strumming hand over the sound hole / pickups, as in the shots that are already right, e.g. Ricky at ~90.2) in the shared rig so every shot gets it; sweep every 3D guitar shot | the 3D figure guitar rig / pose helper (wherever it lives), guitar-pose lines in scene files outside the v47_boss window | v45_jam.md, v45_laser.md |
| **v47_outro** | 3:08 keep the performance; fix the jacket: round b/w 1420 MHz patch on her LEFT upper arm ON the orange band (not gibberish), snap epaulettes per inputs/jacket-base.png, hem and cuffs WHITE (not orange) | media/act5/** (new set spreadR_v47*), act5/spread.js LIVES table + LIVE line, tools/cutscenes/pb_spread47*.py | v46_outro.md, v45_ricky.md |

Shared files: render.js nobody edits; core/motion/* read-only unless you are v47_hands and the rig lives there (then back up first and tell the coordinator);
show/main.js only via the coordinator. act4/main3d.js is shared by v47_boss (123.35-143.4) and v47_hands (guitar-pose calls only): make small Edit-tool edits, never rewrite the file, re-read before each edit.

## Acting directions (v47_cards / v47_trio; Seedance prompts)
Principle (from rare-earth + our 3:08 outro): one motivated gesture per phrase, tied to the words; name where her eyes go; give an emotional verb; frame wide enough
that hands and shoulders read (try a medium-shot first frame, outpainted from the approved still, as a variant next to the current framing); allow a slow push or
drift; drop "never exaggerated / stays in place". Her thought throughout: she's figuring out how to vibe-code past the edge of the game world.
- **Card 03** "(blossoms) because my imagination is linked to my everyday life": the idea arrives. Eyes up and off to one side as if she can see past the edge of the frame;
  a fingertip taps her temple on "imagination"; both hands open outward from her head like the world unfolding on "linked"; she comes back to camera with a grin and a nod on "everyday life".
- **Card 04** "I just ask myself": a plotting pause. Chin on her knuckle, eyes narrowed and searching; then she leans toward the camera with a mischievous "what if" smile, as if
  about to type the prompt (the box follows at 50.66).
- **Card 06** "I just ask myself what it is that I need?" (befriending the Eraser): like approaching a scared stray. She lowers the pencil (never pointed at him like a weapon) and
  steps in slowly, head tilted, soft eyes on the Eraser; on "ask myself" her free hand touches her chest (honest, a little vulnerable); on "what it is that I need" she turns to him,
  brows up, open palm offered toward him, a small hopeful smile, a real question; a tiny shrug on "need". Eraser: wary side-eye that softens, one brow lifting.
- **Card 05** (all three, 舞台 "stage"): a band that has just found its groove. Jade sings out with her chin up, one arm reaching out over the crowd; Charlie and Ricky lean into each
  other back to back / shoulder to shoulder, heads bobbing hard on the beat, Ricky's guitar neck swinging up on the accent; big grins, eye contact with each other, then out to us.
Hair rule: bun with the two pencils in an X means no pencils in her hands; a pencil in hand means long loose hair (card 06 has a pencil in hand: check the still's hair).

## Gates
Canon: memory/jade-character-rules.md for every frame with Jade (crop 2-4x: patch round and ON the band, ONE chest dot, epaulettes, hem and cuffs white, pencils/hair rule);
Charlie always has his hat; Ricky looks like himself (inputs/ricky-anime.png). Lip sync: measure (tools/cutscenes/lipsync.py etc.), then render 540p timing variants
(+0..+6 frames) for Jade's ear (memory/jade-review-by-video.md). Paper stays a colored-pencil drawing in every frame.

## Hygiene (as docs/v45_brief.md)
Checkpoint `engine/checkpoints/v47_<unit>.md` from the start (file:line, backups, what's running, spend, next step); backups engine/out/bak_v47/<unit>/.
Taste calls = a const switch in your file (e.g. INTRO_V47 'plate'|'card'|null) + one 540p clip with audio per variant in engine/out/review/v47/<unit>/.
`node --check`; from engine/ `export TMPDIR=$PWD/out/dev/tmp`; GPU shared (nvidia-smi, `--workers 1`, one render at a time per unit); disk is tight (540p only, clean temp).
Every paid gen in media/genlog.jsonl. Caps: cards $25, trio $15, outro $12, boss $10, intro/drop/hands $5. Project ~$135 of $500.
Section render from engine/: `node render.js --show main --from A --to B --fps 30 --res 960x540 --fig native --figscale 1.3 --figres 2.5 --look k08b+cs --mp4 out/review/v47/<unit>/X.mp4 --audio --workers 1`
(start a section 1-2 s early so state settles; see the v46_blob note on shared post passes).
