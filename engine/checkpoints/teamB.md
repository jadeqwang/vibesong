# Team B checkpoint (ACT III, 77.76-123.35)

## Done
- Read all briefs (bible, script, song_map, README, HANDOFF_ACTS, cues, sprites, NOTES, concepts k07/k08/k08b/k09, protos).
- Measured micro-cues from stems (not yet written to cues.json; cues.json is outside my files -> will hardcode in act3/cues.js):
  triplet roll = grid triplets 77.757..79.41; roll fades ~79.46; last hit 79.82; silence 79.87-80.805; impact 80.815
  accent pairs 82.265/83.09, 85.56/86.385, 88.86/89.68; Fixtures re-hit 87.83; Functions re-hit 91.11
  hey hey hey ~92.78/93.25/93.65; stage stutter re-hits 108.08/108.68/109.28 (stops 107.615/108.195/108.835)
  rap accents 111.705, 112.515, 114.95, 118.175, 118.38 (strong), 121.405; eh eh eh ~112.33/112.56/112.78
- src/scenes/act3/world/paint.js: patchPaint (global flood + local spheres/capsule/wipe/all + flat switch).
- src/scenes/act3/world/build.js: getWorld(ctx) cached shared world (prototype world mirrored scale.x=-1 so +x forward,
  sun ahead at +x; cypress avenue per-tree materials; mesas A/B in the sea; heroes + bugs voxel; look/applyLook).

## In progress
- world/props.js (void wall tiles, drum blocks, trampoline, chant hanzi, slabs, beam, flowers, because letters,
  co-op set, amphitheatre+spotlights, books, monolith, giant pencil, bursts) -- build.js imports buildProps from it.

## Next steps
1. props.js; 2. act3/lib (rig for the turn, overlay subtitles smooth sans, hero helpers);
3. scenes: turn.js (77.76-86.385), drop.js (-94.204), verse2.js (-107.15), stage.js (-110.41), rap.js (-123.354);
4. register in src/show/main.js act3 array; 5. render review, iterate; 6. WORLD_API.md, HANDOFF_123.md.

## Core requests
- none yet

## Update (milestone 1)
- Reconciled with HANDOFF_77: my 77.757 frame = Team A's framing (world x = gx-200, y = gy-60); drawn strip uses
  Team A's grassTile/dirtTile canvases (act2/art.js), voxel rainbow 出发, voxel lamp, core HUD (drops away at the impact).
- Director's call applied: drawn level = coloured causeway (props.drawnStrip, uSat uniform), prototype strip hidden.
- act3.turn (77.757-86.385) registered in main.js and renders: 2D cuts on 8ths, silent tilt, turn with void-wall shatter,
  fly-over + cypress hand-colouring (treeLP/TREE_HITS exported from turn.js).
- Helper: scratchpad st.sh renders stills sheet to engine/out/dev/act3/<name>_sheet.jpg.
- NEXT: drop.js (86.385-94.204), verse2.js, stage.js, rap.js.

## Update (milestone 2)
- All five scenes written + registered: act3.turn, act3.drop, act3.verse2, act3.stage, act3.rap (to T.section('Bridge').start).
- paintlog.js = central ledger of hand-colouring (Jade's note: every interaction colours one object), applied in make3D.
- Rap: books domino, monolith 一句话 + flower burst, side-view dance battle, giant pencil + flood (floodRadius exported).
- NEXT: full 540p review render, timing check, fixes; then WORLD_API.md + HANDOFF_123.md.

## Update (milestone 3: delivered v4)
- Review: engine/out/review/act3_v4.mp4 (+ act3_v4_sheet.jpg), 77.76-123.35 with audio. Older versions deleted, PNG frames deleted.
- Docs: engine/WORLD_API.md (shared world for Teams C/D), engine/HANDOFF_123.md.
- Measured micro-cues live in src/scenes/act3/common.js (CUE) since data/cues.json is outside Team B files.
- Polish backlog: 2D roll readability (chant chars small), turn end composition (more sky/sea), co-op prop readability,
  stage close-ups (backlit), book/monolith section scale; plaster cypress clumps look like popcorn.
- Core requests: none.

## v5 polish pass (coordinator list: 1 flood, 2 heroes depth/back, 3 turn end scale + smooth cypresses, 4 stage front light, 5 co-op, 6 big chant + gizmos)
- [done] mesas moved +120 z further out to sea (all scene coords shifted; script scratchpad/shift.py). Needed for item 3.
- [todo] items 1-6.
- [done] item 2: heroes voxel({back:true}) + deeper extrusion (build.js); bugs deeper. Smooth plaster cypress sculptures (cypressGeo).
- [done] item 3: turn end pose higher/wider (turn.js rig: T3 (250,118,-40), az -64, el 6, H 330, fov 50): temple, gate, sun, sea, sky.
- [mostly done] item 1 flood: new floodRadius (ring 119.02-119.45, aerial race to horizon 119.45-121.0), REVEAL pull-back at 121.405,
  band shot 121.95-123.354; features retimed (118.175/118.38/118.785, 122.22/122.62); paint.js rainbow rim on the flood edge; lush meadow colours.
- [done] item 4 stage: spots now front-light from the audience side (stage.js spots()), lights 45% white, bloom 0.16, subtitles top.
- [done] item 5 co-op: InkStroke bridge (props.js, tapered pillow + dry brush, graphite -> rainbow via setColour as they cross),
  follow-cam 3/4 on the tripod carry, Ricky's spot moved (905,470), Jade start (898,298), tripod x1.4.
- [done] item 6: chant 一笔一画 big (cells 52, bold 1, centres CH in turn.js), apex positions moved right; Team A gizmo cubes (props.gizmos, gizmoCube) that tumble away in the turn.
- NEXT: full act3_v5 render + review, then report.
- [done] act3_v5 rendered (engine/out/review/act3_v5.mp4 + sheet); v4 deleted; PNG frames deleted; HANDOFF_123 + WORLD_API updated for the mesa shift.
- Open core request worth filing: Actor HAIR_DOWN set lacks 'jade_back_hairdown_run' (strict canon throws), so Jade's back-run strip is unused.

## v6 (done)
- Stage 107.6-109.3: warm ambient (dim 1-0.38*dark), three front keys at ~45° (warm white Jade, magenta Charlie, cyan Ricky; light colour 80% white so outfits keep true colour), tinted floor pools, faint beams, bloom 0.16. (Fixed a bug where inline comments had swallowed the spotlight position/target lines.)
- Co-op 101-103: Ricky waits at (962,300) behind the action; tripod follow-cam from the front-right 3/4.
- Rendered engine/out/review/act3_v6.mp4 (+ sheet); v5 and PNG frames deleted. R-B1 done by the engine owner (not yet used in Act III).

## v7 (done)
- rap.js: bug feature scale is now (sign*pop, pop, pop) (was a point reflection, moth upside down when facing -1). Team C told; they removed their matching flip.
- turn.js does not import choreo.js (only the word in a comment); re-render confirms the turn is unchanged.
- engine/out/review/act3_v7.mp4 + act3_v7_sheet.jpg; v6 and PNG frames deleted.

## v8 crisp golden hour (done)
- common.js CRISP spread into LOOK() and the turn look: atmos x0.5 + hazeStart 650 (haze only far), envInt 0.55, hemiLo 0.3,
  warm key (sunWarm), cool shadows (coolShadows), contrast 1.13, GTAO radius 11 / scale 1.8, accent 1.3 (paint.js PAINT_U.uAccent lifts
  hand-coloured objects), fill 0.95. build.js applyLook reads these with defaults = old look (other acts unaffected unless they use LOOK()).
- Review: out/review/act3_v8.mp4 + sheet; before/after pairs out/review/act3_look_beforeafter_087.jpg / _104.jpg. v7 deleted.
- Team C told: their 123.354 continuity frame uses TALOS_LOOK (= my LOOK) so it picks up CRISP automatically.

## v9 hero light layer (done)
- paint.js HERO_U (uHeroFill, uHeroRim, uRimCol) applied only to materials patched with { hero: true } (heroes + bugs in build.js):
  soft camera-facing fill + warm Fresnel rim. Driven by L.heroFill / L.heroRim (CRISP: 0.42 / 0.55; default 0 = off for other acts).
- Review: out/review/act3_v9.mp4 + sheet; v8 deleted, PNG frames deleted.
- Checked Team C's 108.46 report: no bug. ffmpeg -ss on the review mp4 lands one frame late (108.50); direct still == video frame 108.4667.
  Minor: stills rendered after another still in the same browser differ ~0.8/255 mean (likely GTAO noise from the shared seeded Math.random).
