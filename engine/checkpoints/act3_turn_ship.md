# act3.turn ship checkpoint (77.757-86.385) — game-design pass v10

Files (mine): src/scenes/act3/turn.js (rewritten), NEW turn_props.js (scene-local props), NEW turn_ui.js (HUD/bar shatter,
toast). Small edits: act3/paintlog.js (TREE_HITS -> the 5 whistle notes; boomerang no longer colours a column),
show/loc.js (ACT III block). Originals: out/bak_2026-10-15/src + scratchpad copies. main.js untouched.

## Done (v10)
- Roll 77.757-79.635 (measured: 12 triplet hits 77.757..79.272, LAST drum hit 79.635 = launch):
  JADE drums graphite bricks (pillar c gets c+1 bricks per hit; 3 pillars, hop up one per triplet), taps the 一 in the
  last triplet; RICKY's sustain waves bend it into the ramp (79.0-79.5); CHARLIE flips the hat, bounces higher every
  triplet, the rim chings on every hit (hi-hat); Ricky hops onto the hat; 79.635 Jade leaves the lip + hat launches
  Charlie & Ricky. Cuts on triplet downbeats (zoom 1/2), HUD active-hero highlight + slot flash per cut.
- Bar: Act II's src/show/build_bar.js (dynamic import, stub fallback). 99% stuck/blink -> 100% gold at 79.635 ->
  "100% · LOADING..." (animated dots, moved left of the bar) in the silence. Frozen apex + 2° tilt kept.
- 80.815: HUD + bar rendered to a target and SHATTER into 10x9 px pixel-grid shards (crack flash, fall + spin, fade);
  LOC jumps +4096 (Reality Lv 2 chunk) inside the falling shards. "✓ LEVEL LOADED" toast 81.24-82.4 (small, top).
- 3D: hat parachute (canopy prop + cropped *_hang stand-ins; uses charlie_parachute_carry / jade_dangle / ricky_dangle
  automatically when the art lands) drifts them onto the old strip's end (land 81.6/81.8, stand 228/205/182).
- Causeway = chunks (makeDrawnStrip) sunk in the plaster; Charlie's boomerang hat tags switch k (waypoint ping: diamond,
  ring, light pillar), Ricky's chord beam clicks it (82.265 / 83.09 / 85.56), the chunk rises 0.16 s before Jade's feet.
  4th tag 86.04, Ricky aims; the 86.385 click lands on act3.drop's first frame (road complete there).
- Cypress flicks on the whistle notes 81.87 / 82.93 / 84.15 / 85.19 / 85.63 (trees 0-4).
- Seam 77.757: Act II plates (pressed) + wires + 2D gizmo cubes rebuilt; seam 86.385: party at drop's partyAt().
- Fixes: front-only 2D heroes (the back-view half leaked around crouched poses side-on); early-whip near plane (a
  sea-side density temple occluded the party at 81.0); tree tips from bounding boxes (density cypresses).
- LOC: +1/+2/+3 per drum hit, +3 for the 一, +20 chant strokes, +4096 at the impact, +28/+52/+28 per raised chunk.

## For other teams
- act3.drop: please show Ricky's chord + switch 4 click at 86.385 (my 4th ping sits on switch 4 at x 790, z -36).
- Density: see CORE_REQUESTS R-B2 (I hide drawnStrip in my frames and draw chunks with makeDrawnStrip).

## Deliverables
out/review/turn_v10.mp4 (77-87, 960x540, audio), turn_v10_sheet.jpg, turn_v10_keys/ (1080p stills).

## v11 (coordinator follow-ups)
- Art strips live: charlie_parachute_carry (boot grab points from sprites.json `boots`), jade_dangle (hair down, blue-cap
  pencil, checked at 3x), ricky_dangle; the chain drifts in FRONT of the 出发 gate (z 24 -> lanes by landing), canopy blooms.
- act3.drop: 3 lines (import turnCarry, setup, carry.update(t, party)): 86.385 Ricky's chord + switch-4 flash + the last
  causeway chunk rising (turn.js turnCarry / ensureTurnProps; switch 4 moved to x 720 so drop's S1 camera sees it).
- 3D run: per-hero speed shapes (slow to act, breathing spacing, integrated + normalised to drop's hand-off), lanes
  breathe, own gaits (Jade springy, Charlie steady, Ricky heavy); hat x2 with a spark trail and a big arc; flick from the
  pencil tip in rainbow; switches 21 px cubes, bigger pings; camera leans toward each tagged switch; anchor = party centroid.
- LOC +184 for the last chunk at 86.385. Out: out/review/turn_v11.mp4, turn_v11_sheet.jpg, turn_v11_keys/.
- v12 prep: 77.757 re-synced to HANDOFF_77 v6 (party = LAUNCH.party 54/96/138 read live, plates/wires from LAUNCH, no HUD
  highlight on the first frame, Act II's bar glitch passes through buildAt). 2D phase keeps EXTRUDED sprites
  (voxel({ figure: false })) so it pixel-matches Act II; the density team's sculpted figures (W.heroes) take over at the turn.
- v12 (density phase 2 figures), v12b (2b check), v13 = REVIEW FINAL of this round (density 2c world + figures):
  out/review/turn_v13.mp4 / turn_v13_sheet.jpg / turn_v13_keys/. Charlie hatless while the boomerang flies
  (set({ hat: false })); beam / pencil / hat-hand attach points raised 15% for the 1.15x figures; R-B3 verified fixed.
  Standing by for Jade's hero feedback.
