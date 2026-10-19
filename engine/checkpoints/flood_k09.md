# flood_k09 (round 4): the 119.02 paint flood rebuilt as k09's cresting colored-pencil wave

Brief: docs/round4_build_brief.md + coordinator brief (Jade: "I also really liked the k09 color wave ... disappointed we didn't
see it"). Target: keyframes/concepts/k09_bug_dance_paint_flood.png. Gate M1 = 1080p hero still next to k09 + 540p clip
118.4-121.6 with audio in out/review/flood_k09/, then STOP.

## Flag / gating
- On with `--look k08b` (LOOKCFG.k08b, read at scene setup by `floodK9On()` in flood_wave.js). URL `?flood=old` forces the
  old flood, `?flood=k09` forces the new one (render.js has no CLI passthrough; `globalThis.FLOOD_STAGING` also works).
- Default path (no --look k08b): `k9 = null`, no geometry, no motion figure, no fetch. **Verified byte-identical** (12:58):
  A/B tree (out/dev/flood_k09/ab.sh: battle.js from backup, flood_wave.js removed vs src now), 1080p, review flags
  (--fig native --figscale 1.3 --figres 2.5), stills 117.0 / 119.2 / 120.0: ALL IDENTICAL.
- The old flood is still what you get with the default look.

## Files
- NEW src/scenes/act3/flood_wave.js: the wave (CPU stroke geometry, one draw call, ShaderMaterial pencil strokes), state(t),
  frame/surface/crest/trough helpers, colour(x, z, t) for W.colorMap, rainbowTip() (k09 rainbow core on the giant pencil).
- src/scenes/act3/battle.js (flood parts only, all behind `k9`): K9_* staging constants, setupK9 (wave, Jade MotionFigure +
  MotionTrack, grips), k9Pencil (plant timeline), k9Paint (flood sphere + W.colorMap), k9Frame, k9Riders, K9_SHOTS
  (hero 118.927-120.135, race 120.135-121.405), heroesAt tweaks (Ricky+Charlie strum in the hero shot, old Jade hidden
  117.65-120.135, hand-over walk moved to 120.3-121.1), old flood burst + rider trails off under k9.
- Not touched: battle_fx.js, world/paint.js, world/k08b.js, look.js (verified cmp vs backups), battle_ui.js (cue times as before),
  talos_r4 files, src/core/*. W.colorMap used through world_look's public API only.
- Backups: out/bak_r4/flood_k09/ (battle.js, battle_fx.js, paint.js, k08b.js, look.js at start).
- Dev camera override + debug log removed before M1 (default inertness re-verified after removal, 13:05: IDENTICAL).

## Design (as built)
- HERO 118.927 (beat) -> 120.135 (bar 73 downbeat): Jade (MotionFigure jade_down) sketches from FORWARD.jade, leaps
  (MotionTrack jump, landAt 118.927) to K9_STANCE right of the pencil, catches the falling pencil (hold IK both hands),
  lifts it (anticipation 118.90-119.0), slams it in on 119.02, then leans into it (push clip upper layer + native k09 lunge
  layer, IK off after the plant, grips slide up the shaft). The wave is a horn of 4 nested stroke sheets along a spine from
  the pencil toward the front-left (over the seats): tiny at the tip, a tall curling barrel at the far end; colour bands along
  the spine red -> violet, pink edge; strokes flow up the face (leading-edge reveal), white chips at the crest, tip spray,
  floor streaks. Camera: tight on the plant, pulls back to the k09 framing. Wheel rolls along the trough, glider surfs crest.
- RACE 120.135 -> 121.405: ring around the pencil, lip outward, racing to ~8800 u; colour by profile (rainbow rings);
  colour: flood sphere just behind the trough + colorMap (hero region kept). High aerial behind the crest.
- Recruit 121.405 onward unchanged (old floodRadius, handover props).

## Status
- [x] module + integration, default inertness verified (twice)
- [x] hero frame tuned toward k09 (spine 150 deg, curl capped at 0.82 so the face stays visible, camera pulls back from the plant)
- [x] M1 DONE (13:05) -> STOPPED for review
- Scratch: out/dev/flood_k09/ (st.sh stills, sheet.sh, ab.sh, m1/ 1080p stills, clip.log).

## GATE M1 (2026-10-16 ~13:05) · STOPPED, waiting for review
out/review/flood_k09/:
- flood_k09_m1_hero_vs_k09.jpg: hero frame 119.7 (1080p) | k09, same size, side by side
- flood_k09_m1_hero_119.7_1080p.png: the hero still alone
- flood_k09_m1_540p.mp4: 118.4-121.6, 960x540, audio, `--fig native --figscale 1.3 --figres 2.5 --look k08b`, 2 workers (47 s)
- flood_k09_m1_sheet.jpg: 16 frames every 0.2 s
- flood_k09_m1_plant_119.033_race_120.6.jpg: the plant frame | the race (1080p)
- jade_crop_3x_119.7.png: canon crop
Frame cost (540p, 119.1-121.1, 60 frames, 1 worker, --look k08b, A/B old flood vs k09): 28.1 -> 46.5 ms/frame (+18 ms: CPU
stroke geometry ~12k ribbons + 65k-texel colorMap fill + the MotionFigure). Setup unchanged (~18.7 s init both).
Canon (3x crop 119.7): hair long and loose (giant pencil in her hands, her own pencils away), white cropped jacket, orange sleeve
band, 1420 patch on her LEFT upper arm (near side), baggy navy cargo pants with an orange strap, white sneakers. Headphones not
visible at this angle (hair covers the collar). A dark band shows at the waist in the lunge (jacket crop + lean).

## M2 (coordinator notes 1-8) · DONE 2026-10-16 ~13:45, STOPPED for review
Changes:
1. Finish: thinner colour strokes (0.55-1.35 u), 3 colour sheets + a paper sheet just behind the hatching (offset back along the
   profile normal), paper tooth inside the strokes (11% of grain cells show paper white), colours ~6-14% pastel, 4400 strokes per
   sheet, chips smaller (0.28-0.78) and 88% paper white, bands over u^1.3 with pink only on the last 2.5% (violet no longer floods
   the far end at 119.5-119.7; it still grows toward violet/blue late in the shot).
2. Lush wake: W.colorMap fills everything behind the trough line out past the barrel's end (sharp edges); NEW bloom in
   flood_wave.js: 3600 voxel grass tufts + 900 voxel flowers (k08b's own tuftGeo / flowerGeo, 1.7-1.9x) on mesa B behind the
   trough, each scaled up from nothing as the colour reaches it; plaster ahead (Jade, the band, the right) stays white.
3. UI (AUTHORISED edit, src/show/battle_ui.js, minimal): opt-in `bui.update(t, { slim: true })` -> drawSlim(): the message text
   only as a slim strip at the bottom (no party / enemy panels), small VICTORY banner above it, no floating tags. battle.js
   passes slim only with k9 and only for 118.525 <= t < 120.135; everything restores at 120.135. Without slim the UI code path
   is unchanged (default renders byte-identical, below). Bugs now in the foreground above the strip (button, bridge, and the
   lamp hops in at 118.6-118.85).
4. Plant: the hero shot opens a beat earlier (118.525, beat 284): Jade flies in (leap 118.22, lands on the 8th 118.726), the
   pencil falls into her hands (118.74), wind-up 118.76-118.99 (pencil lifted 26 u, arms overhead by IK), slam on 119.02 (cue
   kept), lens punch (fov -5, shake 2.6), plaster dust burst + the stroke starburst. K9_STANCE moved so she faces the pencil and
   the camera 3/4 (she lands facing away: the wind-up reads from her back, RARE EARTH on one line).
5. Race: chase cam 120.135-120.94 beside and a little behind the crest at ~0.35-0.6 H, the glider (scale 2.7) surfing it: the
   curl reads in profile, coloured ground inside / behind, plaster ahead; cut on the beat 120.94 to the high wide.
6. The 119.1 ribbon was MINE (the colour amount was scaled globally while the wave rose, so a whole region sat in world_look's
   0..0.09 rainbow-rim band); fixed in flood_wave.js (sharp spatial edges, no global scale). Now only world_look's thin rim line.
7. mblur: out/review/flood_k09/flood_k09_m2_mblur8_119.1-121.1.mp4 (540p, --mblur 8 --shutter 0.33, 2 workers): ~470-500 ms
   render per frame per worker, 60 frames in 36 s wall (world_look's old-flood reference: 154 ms). Every sub-frame re-runs the
   CPU stroke build + colour-map fill + bloom. The blur softens the hatching to a smooth rainbow and smears the race heavily.
8. Canon crops (jade_crop_3x_m2_119.7_front_118.767_back.png): 119.7 front 3/4: loose hair, black headphone band with an orange
   rim at the collar (around the neck), sleeve band, 1420 patch on her left arm, cargo pants + orange strap, white sneakers.
   118.767 back: one-line RARE EARTH + pale-blue dot, headphone band behind the neck; BUT a strip of skin shows between the
   cropped jacket and the waistband when she bends (model / rig, not mine: models_r6), and a thin pale stick crosses her hair
   (jade_down has no bun pencils; looks like a model/spring part; flagged for models_r6).
- Also: the k09 path ends on the frame nearest 121.405 (t < REVEAL - 1/60), so the recruit cut frame 121.4 is the old state.
- k08b.js: `export` added to tuftGeo / flowerGeo (two keywords, no pixel change; diff verified).
- Default inertness re-verified after M2 (A/B: battle.js + battle_ui.js + k08b.js from backups, flood_wave.js removed;
  1080p review flags; 117.0 / 119.2 / 120.0 IDENTICAL).
- Frame cost no blur (540p, 119.1-121.1, 1 worker, --look k08b): 28.1 (old flood) -> 50.4 ms/frame (+22 ms).
Review: out/review/flood_k09/flood_k09_m2_hero_vs_k09.jpg, _m2_hero_119.7_1080p.png, _m2_540p.mp4 (118.4-121.6, audio),
_m2_sheet.jpg, _m2_windup_118.767_118.967.jpg, _m2_mblur8_119.1-121.1.mp4 + _m2_mblur8_frames_119.7_120.4.jpg, the crop above.
Open (M2): the lush region is mostly behind the wave from the hero camera (a green strip at the far left, not k09's lush third);
the plant frame 119.033 has an empty lyric strip (line 33 not typed yet) and Jade bent, so the impact reads via flash / dust /
spray more than pose; the race chase background smears under mblur; wind-up seen from her back.

## M3 (coordinator notes, last round) · DONE 2026-10-16 ~14:15 — unit finished
1. Density: colour strokes wider (0.95-1.8 u) and more opaque (edge/tooth discards cut ~half, paper tooth 7% at 0.55 mix,
   pastel 3-9%), the paper sheet behind is now a light wash of the band colour (not cream) so gaps read as body, not veil.
   Bands read red -> orange -> yellow -> green -> cyan -> blue -> violet across the face (119.5-120.0).
2. Lush left foreground by staging: the hero wave's spine now SWEEPS from 128 deg (left foreground) to 172 deg (left background)
   over 119.02-119.8 (K9_SWEEP in battle.js, makeFloodWave({ psiFrom, psi })); the swept sector is coloured (colorMap) and the
   bloom (now 5200 tufts + 1400 flowers, placed over that sector + behind the spine) grows in as the wave passes; the colour
   behind the trough is limited to the wave body's depth, so the garden arrives with the wave. Right two thirds (Jade, the band,
   the stage) stay plaster. Note: the sweep moves away from the lip side (the curl keeps facing the camera); drawn, not physical.
   Wheel rides further out along the trough (u 0.3 -> 0.8, scale 0.85); hero camera pulls back a little further, tilts up.
3. Plant / back-view wind-up kept as M2.
4. Race wide (120.94-121.405): wave height drops to min(260, 110 + 0.022 R): a low rainbow crest band on the horizon instead
   of a fence (it is thin and far by 121.1).
5. Canon issues (hair stick, waist skin strip) left to models_r6 (coordinator relays).
Review: out/review/flood_k09/flood_k09_m3_hero_vs_k09.jpg, flood_k09_m3_hero_119.7_1080p.png, flood_k09_m3_540p.mp4
(118.4-121.6, audio, review flags + --look k08b, 2 workers), flood_k09_m3_sheet.jpg.
Default inertness re-verified after M3 (A/B vs backups of battle.js / battle_ui.js / k08b.js, flood_wave.js removed;
1080p review flags; 117.0 / 119.2 / 120.0 IDENTICAL).
Frame cost (540p, 119.1-121.1, 1 worker, --look k08b): 28.1 (old flood) -> 63.2 ms/frame (+35 ms; was +22 in M2: the bigger
bloom + wider strokes). mblur 8 not re-timed (M2: ~490 ms/frame; expect a little more).
Open (final): the garden is lush in the near-left but the wave covers much of it at 119.7 (k09's garden is a clear third of the
frame); the wave crest top sits at the frame's top edge 119.4-119.6; the race wide's band is small by 121.1; Act IV / the recruit
cut frame (121.4) show the old fully-coloured stage without the bloom tufts (the bloom is hidden from the recruit cut on).

## M4 (shape fix, final) · DONE 2026-10-16 ~14:40 — unit finished
- One body: the colour sheets nearly coincide (sheetK 1 + 0.022 b); the far shoulder tapers away (h x (1 - 0.92 smooth(0.6, 1, u)^1.2)),
  so there is no end cross-section reading as a second fin.
- Overhanging lip: the profile tightens more slowly (LIPK 0.2, was 0.6) so the lip hangs forward ~38% of the height over the
  trough; curl max 0.94 (was 0.82). Applies to the race ring too.
- White crest along the lip: foam strokes at sigma 0.66-0.86 (55% of strokes), paper chips (3200, 0.4-1.05 u) at sigma 0.68-0.94.
- Camera: the pull-back is front-loaded (75% done by 119.45) and wider (fov to 57, further along the spine), crest inside the
  frame 119.4-119.6.
Review: out/review/flood_k09/flood_k09_m4_hero_vs_k09.jpg, _m4_hero_119.7_1080p.png, _m4_119.5.jpg, _m4_540p.mp4, _m4_sheet.jpg.
Default inertness re-verified (A/B, 117.0 / 119.2 / 120.0 IDENTICAL). Backups of the M3 state: out/bak_r4/flood_k09/*.m3.js.
Open: the wave is smaller in frame than k09's (the camera pulled back to fit the crest); the hanging lip end shows as a white
tail at the far shoulder; the curl reads best at 119.4-119.5.

## M5 (impact + orientation) · DONE 2026-10-16 ~15:10
- Camera rebuilt in world coords from the front (+z): looks INTO the wave's concave face (the spine ends its sweep at 172 deg, so
  its face / lip point at the camera); tight on Jade's back-view wind-up at 118.525 -> the k09 framing by ~119.45.
  At 119.7 (1080p): Jade ~19-20% of frame height, Ricky/Charlie ~20-25% on the right, the face ~50% of the width, the crest
  touching the top edge, the button / bridge / lamp in front above the lyric strip, garden in the left foreground.
- Wave bigger in the world: spine to ~300 u (was ~230), crest height 182 (x1.12) (was 140).
- Bands now run along the curl (by profile position: red at the trough leaving the pencil tip -> violet / pink over the lip), so
  from the front they sweep up from the pencil to the far end in big diagonal arcs; strokes hold still on the profile (no
  colour pops); lip overhang reduced (LIPK 0.36, curl 0.9) so the lip doesn't hide the face.
- White tail fixed: the foam tapers with the lip (u 0.25-0.5 in, 0.78-0.95 out); chips only on u 0.28-0.9.
- K9_STANCE = pencil + (24, 0, -14): she lands facing away (back-view wind-up kept), then faces the pencil and camera 3/4.
Review: out/review/flood_k09/flood_k09_m5_hero_vs_k09.jpg, _m5_hero_119.7_1080p.png, _m5_540p.mp4, _m5_sheet.jpg.
Default inertness re-verified (A/B 117.0 / 119.2 / 120.0 IDENTICAL). M4 state backed up: out/bak_r4/flood_k09/*.m4.js.
Open: the strokes run up the face (along the profile), so the face reads as vertical hatching crossed by diagonal bands; in k09
the strokes run ALONG the bands (that needs strokes laid along the spine at fixed profile height: not done). The white foam
along the lip barely reads in this view. The race chase inherits the shallower lip. No conflict with song timing or the
hand-over cameras (all changes inside 118.525-120.135; recruit / Act IV untouched).

## M6 (final) · DONE 2026-10-16 ~15:45 — unit finished, goes to Jade in half2_v2
- Strokes now run ALONG the wave: each stroke sits at a fixed profile position (sigma) and is laid along the spine (u), so the
  hatching follows the colour arcs from the pencil tip up and over (red/orange at the trough -> yellow/green/cyan/blue -> violet,
  pink at the lip). In the race the same strokes run round the ring (concentric rainbow bands, no bristles).
  Trough frame tabulated per frame (257 samples) so ground lookups stay cheap.
- Visible curl: LIPK 0.24, curl max 0.94 (lip hangs forward over the top third); hollow under the lip darker (x0.7) and cooler
  (blue tint), lip underside darker; a narrow white foam edge along the lip (sigma 0.9-0.96), fading where the lip is low at
  the wave's ends. Far shoulder taper moved out (0.74-1.0): the wave fills the top-left and covers some background.
- Wide (120.94+): the ring band height min(420, 150 + 0.04 R) so it reads as a pale rainbow band across the horizon.
- Fixed a bug from M5: a comment swallowed the per-stroke value jitter / paper wash (now applied).
Review: out/review/flood_k09/flood_k09_m6_hero_vs_k09.jpg, _m6_hero_119.7_1080p.png, _m6_540p.mp4, _m6_sheet.jpg.
Default inertness re-verified (A/B 117.0 / 119.2 / 120.0 IDENTICAL). M5 state backed up: out/bak_r4/flood_k09/flood_wave.m5.js.
Cost (540p, 119.1-121.1, 1 worker, --look k08b): 28.1 (old) -> 73.7 ms/frame (+46 ms).
Open: the lip's outer edge at the top-left steps / zigzags where the far shoulder tapers (the lip silhouette is not a clean curve);
the white foam edge is thin and reads only in places; the wide's band is pale (fog + distance).

## REQUESTS
- models_r6: (1) skin band between cropped jacket and waistband when native Jade bends forward (seen from behind, 118.767);
  (2) a thin pale stick across her loose hair from behind (jade_down variant, 118.767 crop).

## Open problems (honest, M1)
1. The hero frame is k09-like in shape and staging (rainbow curl left, Jade lunging into the pencil centre-right, Ricky + Charlie
   strumming right, wheel on the trough, glider on the crest, ladybug/caterpillar in front) but not k09's finish: our strokes are
   saturated and fibrous ("hair") where k09's hatching is fine, pastel and dense; the white crest chips are big flecks; the far
   (violet/pink) end still dominates as the wave grows. The colour behind the wave is mostly off-screen in the hero frame, so
   the frame reads plaster world + wave, while k09's left side is lush (k09's colour is on the far side of the wave).
2. The foreground features sit just above the battle UI band (k09 puts them at the very bottom, which our UI covers).
3. The plant (119.033) is weak: battle_ui's BUG->FEATURE tags (118.47/118.66 conversions) still cover Jade there (not my file);
   the anticipation lift is only 3 frames (118.933-119.0) inside the hero shot; the catch/leap is in the triple-tech shot.
4. Race: reads as a rainbow ring racing out over mesa A / the meadow / hills with the world colouring behind (green, terracotta
   roofs, teal tiles) but the ring looks like a rainbow fence of vertical bristles from the air; the curl is not readable there.
   The riders are specks again in the race (glider visible at 120.2-120.4).
5. At 119.1 the colorMap's hatched rainbow rim (world_look's leading-edge band) draws a wide snaking ribbon across the seats
   for ~3 frames before the wave covers it.
6. Not tested with --mblur. Jade's leap starts 118.30 (crouch during the 稿 draft sketch, 118.278) - she sketches as she
   launches. Pencil tilt eases back upright during the race (off-screen) to the hand-over pose.
7. Shot timing: the triple-tech shot now ends at 118.927 (beat) instead of 119.02; hero 118.927-120.135; race 120.135-121.405.
   UI cue times unchanged. Hand-over/recruit from 121.405 unchanged.

## m6b (lip edge fix) · DONE
- Cause of the zigzag: the curl rode the real ground under its trough, so the amphitheatre seat steps / disc edge stepped the whole
  profile and kinked the lip's edge. Now the body rides a smoothed base (3x box filter along the spine), only the trough hugs the
  ground. Plus a continuous lip edge: per sheet 24 rows x 12 overlapping columns of strokes tile sigma 0.935-1 along the whole
  length (tapering with the wave); regular strokes stop at sigma 0.94; the white foam band starts at sigma 0.9 (a little thicker).
- Review: flood_k09_m6b_hero_vs_k09.jpg, _m6b_hero_119.7_1080p.png, _m6b_540p.mp4, _m6b_sheet.jpg. Default inertness re-verified
  (IDENTICAL). M6 state: out/bak_r4/flood_k09/flood_wave.m6.js.
