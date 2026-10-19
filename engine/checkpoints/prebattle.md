# PRE-BATTLE checkpoint (act3.drop + act3.verse2, song 86.385-107.15)

## STATUS: v2 APPROVED as the morning cut (coordinator, 2026-10-16). Standing by; nothing running.
v2 re-rendered for the pencil caps (2026-10-16 04:03, models team's cap fix; no scene changes): prebattle_v2.mp4, prebattle_v2_sheet.jpg,
stills_v2/*, jade_canon_crops_3x_v2.jpg overwritten (seams_v2 not re-rendered). 3x check: both caps (blue + pink, with ferrules) read in
stills_v2/extra_86.8.png and extra_94.62.png; blue in prebattle_v2_90.7 / 104.0; pink in extra_92.2.
Note: /tmp (16G tmpfs) was full (another project's temp files); render with TMPDIR=engine/out/dev/tmp (pb_sheet.py honours TMPDIR too).
Next step: none until new notes. If touched again, start from out/review/prebattle/prebattle_v2.mp4 and the gaps below.

Remaining gaps (v2, accepted):
- 91.5: the party is small in the 3/4 wide (the whole bridge has to fit).
- 89.0 is the cap-follow shot (no heroes in that still).
- The b's eraser bite reads stepped (pixel-letter sub-cells) rather than perfectly round; a notch with a white rubbed edge + crumbs.
- The moved b / cause letters sit in the left background of the co-op shots 102.4-106.4.
- Carve-figure renders were not re-checked after the native pass (prop sizes scale with hero height).

(v2 review-gate notes, for reference:)
v2 deliverables in out/review/prebattle/: prebattle_v2.mp4 (85-108, 960x540, audio, native 1.3 + r5 heads), prebattle_v2_sheet.jpg,
stills_v2/prebattle_v2_<t>.png (87.5 89.0 90.7 91.5 95.5 97.5 100.4 104.0) + extra_86.8/92.2/94.62/100.6, jade_canon_crops_3x_v2.jpg,
seam_v2_86.385.jpg + seam_v2_107.15.jpg (frames in seams_v2/). v1 files kept alongside.
v2 changes (coordinator notes 1-6): S4 3/4 wide over the sea gap (915,108,215) -> pans slabs -> crossing; S2a Charlie medium /
S2b cap follow (capAt) / S2c Ricky over-the-shoulder; because: condensed monumental letters (b 158, cause 106 tall), gate at
x 850, bite on the b's bowl corner + white rub + 70 crumbs, Charlie holds the cap (shield), camera arcs 100.12-100.75 from the
word to Ricky's foot test; slash = wind-up / strike / hold phases + push-in on Jade; party fans out in z after 86.45; checker
patch = vertical streak; co-op cams moved past the gate (x 902 / 872). Max saturated fraction 22% (107.0, existing).

(v1 state, for reference:)
STOPPED at the review gate (2026-10-16): v1 delivered, waiting for the coordinator's notes. Nothing is running.
Deliverables: out/review/prebattle/ — prebattle_v1.mp4 (85-108, 960x540, audio, native figures 1.3x), prebattle_v1_sheet.jpg
(28 half-bar frames), stills/prebattle_v1_<t>.png (1080p: 87.5 89.0 90.7 91.5 95.5 97.5 100.4 104.0; + extra_92.2 / extra_94.62
used for crops), jade_canon_crops_3x.jpg, seam_86.385.jpg (frames 2589-2594) + seam_107.15.jpg (3212-3217), seams/ frames.
Re-render commands:
  node render.js --show main --fig native --figscale 1.3 --from 85 --to 108 --fps 30 --res 960x540 --mp4 out/review/prebattle/prebattle_vN.mp4 --audio --workers 3
  .venv/bin/python tools/pb_sheet.py out/review/prebattle/prebattle_vN.mp4 85 108 out/review/prebattle/prebattle_vN_sheet.jpg
  tools/pbstills.sh out/dev/x 960x540 <times>      (quick native stills + strip sheet)
Colour budget (saturated-pixel fraction, 2 fps): max 18% inside my range (92.0 bridge), 22% at 107.0 (existing stroke bridge).
Open gaps: see the report / list at the bottom.

## Rules / ownership
Mine: src/scenes/act3/drop.js, verse2.js, NEW prebattle_props.js, paintlog.js only the PATH_V2 / jadeV2X block (94.2-100).
NOT mine: battle*.js, stage.js, rap.js, show/battle_ui.js, world/*, turn*.js, other acts. Backup: out/bak_prebattle/act3/.
Render with native heroes (coordinator, 2026-10-16): ~69 units tall; use g.hand(); N-MOD2 (102.4-103.6 head crop) fixed.

## Done (code)
- prebattle_props.js: one root group hidden by a W.reset() hook (nothing leaks into the battle/Act IV). Paintable graphite
  slabs x5 (plaster = graphite #9a9aa2, full = hue), slash ribbons, ground streaks, numbered pings, remix blocks, 3D cap
  (capGeo), letters b (eraser bite + smudge + crumbs) / e / cause, bugs (makeBug small: ladybug, beetle, firefly, moth),
  missing-texture checker overlay for one avenue cypress. Helpers heroJoints/setJ (joint overrides), headTop, heroH, putHero.
- drop.js: party decelerates from the turn hand-off (86.385 identical); 5 slashes 86.63-87.13 (big FIXTURES slab on the
  86.87 accent), freeze tau() over both stops; Charlie's cap tags in order 88.62/88.86/89.12/89.4/89.68 (numbered pings);
  Ricky aims; 89.95 beam through the slabs in Charlie's order; 91.11 swing into a crosswise plank bridge (x 700, z 24-260);
  Jade flicks each plank coloured as she crosses (flickT); hey hey hey kept. Cameras S1-S5 (S4 now from mesa A looking
  back; the compose s88 sea column is hidden in this scene via an update wrapper — make3D is async, must be awaited).
- verse2.js: room 1 remix (Jade flip vault 94.42-94.889 with a full somersault; Charlie cap-trampoline bounce 94.97-95.8;
  Ricky heavy hop + stomp 95.831, drop 96.613); blocks colour on touch (lp.all); ladybug rides the cap; beetle loop
  95.84-97.07; firefly cutaway 97.07-97.88 with the 3-frame checker glitch at 97.45-97.55 on avenue tree 1; crane;
  because with b|e(flat)|cause, Ricky's two-tap foot test 100.2-100.62, step 100.66; Charlie beyond with the cap;
  co-op crossing kept + the moth in Ricky's beam bonking at 104.396 / 104.803; tripod + beam use posed hands.
- paintlog.js: PATH_V2 {x0 588, x1 820, t1 99.0} + jadeV2X(t) (Jade's feet and the colour path share it).
- tools/pbstills.sh + tools/pb_strip.py (stills + strip sheet).

## Gap list (v1)
- Slashes read as a dark ribbon + ground streak + slab; Jade's arm swing is a joint override on the carve/native rig (fast, 0.12 s), small in S1.
- S2 (88.48-89.95) is wide: the hat is small, pings + numbers carry the order. Ricky's "aim" is a pose + yaw track only.
- The swing (91.11) is seen from mesa A; the sea arcade frames the bottom at 91.1-91.5. Ricky brushes the camera at ~92.45.
- Remix: Charlie's cap-trampoline is the voxfig capGeo cap (beige), the ladybug ~6 units on it. Beetle in C2 is small/low in frame.
- because: the letters are pixel-font block letters (~hero height, not monumental); the eraser bite (top corner of the b ascender)
  is hard to see in the because shot (camera from the +x side); crumbs are there.
- Firefly cutaway is a cut away from the meadow (0.8 s) because the 82.93 cypress is ~450 units from mesa A.
- Blocks/hat/letters size scale with heroH (hs) so carve renders still work; carve was not re-checked after the native pass.
- Pink-cap pencil end is barely readable at 3x (figure model, not this scene).
