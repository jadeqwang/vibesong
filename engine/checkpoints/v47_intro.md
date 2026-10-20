# v47_intro: Jade's 0:04 note: introduce Jade / Ricky / Charlie on PAINT IT / RUN IT / SHIP IT

Brief: docs/v47_brief.md (row v47_intro). Predecessor: checkpoints/v44_open.md.
Owns: src/scenes/act1/paint_run_ship.js + its sprite/UI assets. Backups: out/bak_v47/v47_intro/. Review: out/review/v47/v47_intro/. Spend: $0.

## Log
- started; read brief, RESUME, v44_open, memory rules. Backup out/bak_v47/v47_intro/paint_run_ship.js.v46 (pristine v4.6).
- built INTRO_V47 ('plate' | 'card' | null) in src/scenes/act1/paint_run_ship.js (top consts INTRO_V47/INTRO_COPY; introPlate/introCard canvas builders after heroSpec;
  tag build after the zh subtitles in setup; per-frame placement after the zh place line in update). Copy: P1 JADE "vocals · paints the world" /
  P2 RICKY "electric guitar" / P3 CHARLIE "wrote this song in 2011". Tags userData.cs=1 (hero colour, exempt from the graphite grade).
  Stills out/review/v47/v47_intro/stills/{plate,card}_*.png look right. Next: 540p clips 0-9 s per variant.
- fixes after the full-frame check: plate name = drop shadow (no outline) so the line fits (descenders were clipped); second-word "flash" read as a wash ->
  replaced by a 2 px dip on the beat; k=0 fully off-screen (a sliver showed); card 38 px tall, B/C at y 0 so its top stays under the heroes' feet (floor top 39);
  card slides in from the left too (rising from below crossed the gloss in A).
- canon check (every frame 4.15-7.25 per variant on contact sheets + 4x crops): sprites unchanged from v4.6; Jade card portrait = bun+X pencils (caps up) before
  tA+0.09, hair-down after, same frame as the sprite's pencil pull; Charlie's hat tan in sprite + portrait (tags are cs=1); Ricky's portrait = HUD art. 0 issues.

## FINAL STATE (unit done, idle, safe)
- src/scenes/act1/paint_run_ship.js: `export const INTRO_V47 = 'plate'` (line ~36) | 'card' | null (= v4.6, byte-identical path: no tags built).
  Left at 'plate' (in the show) pending Jade's pick. node --check OK.
- Review (540p, audio, workers 1): out/review/v47/v47_intro/intro_0-9_plate.mp4, intro_0-9_card.mp4, intro_0-9_v46_before.mp4 (cut from full_v4.6b),
  compare_v46_plate_card.jpg (rows v4.6 / plate / card at 4.6, 5.6, 6.6).
- Backups: out/bak_v47/v47_intro/paint_run_ship.js.v46 (pristine), .wip1, .v47 (final). Restore v4.6: set INTRO_V47 = null (or copy .v46 back).
- Spend $0 (no gens; existing HUD portraits). out/dev/tmp (230 MB, shared) left alone.
