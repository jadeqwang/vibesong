# HANDOFF at t = 123.354 (Team B -> Team C)

Act III's last entry (`act3.rap`) ends at `T.section('Bridge').start` = 123.354 (bar 75). The 是一幅画 line starts at 123.18;
Act III shows its subtitle from 123.06 (smooth slot), so continue the same subtitle on your first frame.

- **Where:** mesa B, the amphitheatre stage. World fully coloured by THE PAINT FLOOD (origin `FLOOD.c` = (1354, 10, 454),
  `floodRadius(123.354)` ≈ 16000, i.e. everything; meadow/tufts colours were made lusher in build.js). Golden hour, sun `SUN_DIR`.
- **Camera at 123.354:** perspective, position (1380, 52, 610), looking at (1350, 36, 430), fov 52 (rap.js last shot: it descends
  from the aerial reveal at 121.405 to the stage).
- **Party (dance-battle line-up, facing screen-left):** Jade (1378, 10, 454) `sing` hair DOWN (pencil in hand), Charlie
  (1402, 10, 442) idle, Ricky (1424, 10, 460) `sustain`.
- **Bug features:** ladybug button (1330, 10, 458), beetle wheel rolled to ≈ (1266, 10, 446), moth glider circling
  around (1320, 56, 440), caterpillar bridge (1280, 10, 462), firefly lamp (1292, 10, 470).
- **Props:** the giant pencil planted at (1354, 10, 454); six coloured SYNTAX/语法 books fallen on mesa B (z 302);
  the 一 bridge, tripod, receiver, plate + hat stack on mesa A/B; slab bridge from the causeway to mesa A.
- **Reuse:** `getWorld(ctx)` + `make3D` (see WORLD_API.md). For the Eraser, drive the paint back down (shrink `G.uPaintR`
  or use local `all(1-u)`), then hide geometry.
