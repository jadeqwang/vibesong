# ACT II ship checkpoint (41.028-77.757) — game-design pass v5

## Milestone 1 (DONE): build bar + LOC plumbing
- src/scenes/act2/plan.js: pure single source of truth (cues, layout, per-block draw frames, bar increments, 99 hat chunks).
- src/show/build_bar.js: `buildAt(t)` (pure) + `BuildBar` widget (API in header). 0% at ENTER 52.62, +20 fixtures,
  +25 functions, +5 x3 ohs, +39 over 99 hat landings -> 99 at 67.67, stuck 99 from 67.778, 100 at 79.64,
  '100% · LOADING…' 79.87, hidden from 80.81.
- src/show/loc.js: ACT II block = `...act2LocEvents()` (+1 import line at top). LOC 276 @41.03 -> 343 after fixtures
  -> 1061 after hats -> 1071 @77.757 (gate strokes + lamp). Never decrements in Act II.

## Next
- Rewrite src/scenes/act2/chorus.js per spec (page sky / boomerang / read freeze / chips / prompt / ohs / 3 parallel
  shots / build / plates), launch_set.js plates, HANDOFF_77 + HANDOFF_41 notes, renders.

## Milestone 2 (DONE): v5 scene + delivery
- chorus.js rewritten per spec; launch_set.js: flush pressure plates + wires + EXIT n/3, per-stroke gate (LOC); b_art.js ported.
- Uses new art (charlie_parachute_carry, jade_dangle, ricky_dangle_play, *_read, prop_page_*) with fallbacks; HUD active/slot API.
- HANDOFF_77.md updated (plates, bar, LOC, HUD); HANDOFF_41.md Act II side added; CORE_REQUESTS R-A2-1 filed.
- Delivered out/review/act2_v5.mp4, act2_v5_sheet.jpg, act2_v5_keys/ (53 x 1080p).

## Milestone 3 (DONE): v6 per coordinator review
- 44.5-47.7 context assembly: pages fly from readers into a prompt box that frames up from blueprint gizmos, chips click
  in one per beat (46.05/46.47/46.89), box solid 47.31, push-in to zoom 1.1; layout Charlie/Jade/Ricky (Jade centred).
- Prompt 290x66 centred, command line at 2x, ENTER key 2x, "✓ on it" stamp on 52.72; lyric subtitle yields to the bar.
- Build run: hat-seeded pit + spring + tower course, staggered formation (Ricky a beat behind, near-miss on the tower
  edge), bar glitches on every off-beat 8th (buildAt().glitch). Plates spread 42 px: party 54/96/138 (HANDOFF_77 updated),
  stepped front-to-back Jade 从 / Charlie 这里 / Ricky 出.
- FIXTURES carving raised to the grass row + fixtures camera lowered: clear of the subtitle slot.
- 41.028 matches act1/level.js HANDOFF.screen (still PLANNED there).
- Delivered out/review/act2_v6.mp4, act2_v6_sheet.jpg, act2_v6_keys/ (60 x 1080p).
