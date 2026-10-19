# Battle UI checkpoint (team: BATTLE UI)

Owner files: src/show/battle_ui.js (new), src/scenes/dev/battle_ui_test.js (new), one entry in src/show/dev.js,
"Battle UI" section in WORLD_API.md, requests in CORE_REQUESTS.md. No scene files touched.

## Log
- 2026-10-15 late: smoke test OK (RTX 3090 / 550.163.01, Chrome 153.0.8010.36, vulkan; stills out/dev/smoke_a/b.png look right).
- Read: game_design_acts3-5 battle + beats 107.15-123.35, 123.18, 143.48-149.22; decisions 10-15 late; mocks ui.py.
- Design calls (see WORLD_API "Battle UI"):
  - Draws on ONE 384x216 canvas (the mock grid, x5 at 1080p, no smoothing) via text.js raster() (same pixel fonts,
    binarised) -> one CanvasTexture quad. Pure function of t; caches only rasters (keyed by spec).
  - Hooks: make3D scenes return `ui2d: bui.ui2d` + `noSubs: battleOwnsSubs(t)`; act4 sets `api.suppressSubs`.
  - Swirl at 107.15: 4 frames, copies the framebuffer (FramebufferTexture) in onBeforeRender, pixel grid 320->40 + swirl.
  - Pop-ups (skills cascade, text field, tech banner, VICTORY) live in a strip y 141..158 just above the band (y 159..213).
- v1 built + previewed (dev.battle_a [106,124.6), dev.battle_b [143,155) over the current act3.stage/rap/act4.main).
  Fixes after first look: cascade nesting, CATERPILLAR/♥ collision (left slot 3..100), crawl speeds, 2x flowers,
  123.18 phase overlap, final-boss layout (menu gives way to the field at 144.0; ERASER ♥ window in the strip),
  ♥+1 de-dup per target, ownsSubs to 123.41 (stale line 33 workaround, R-BUI1).
- Docs: WORLD_API.md "Battle UI"; CORE_REQUESTS.md R-BUI1 (stale subtitle at line changes), R-BUI2 (framebuffer copy, info).

## GATE (2026-10-15 late) · STOPPED, waiting for review
out/review/battle_ui/: battle_ui_sheet.jpg (31 half-bar frames), battle_ui_<t>.png x12 (1080p),
battle_ui_107-123.4_540p.mp4 (audio). ~51 MB.
Next after review: scene teams wire anchors (real bug/hero positions), Act III/IV retime tables to their final shots.
