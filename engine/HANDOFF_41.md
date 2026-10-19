# HANDOFF 41.028 · Act I (Team A1, kaizo.js) -> Act II (chorus)

Status: FINAL for act1_v5 (matches the rendered frames; real A-2 strips). Last update: 2026-10-15.
Source of truth for the numbers: `src/scenes/act1/level.js` export `HANDOFF` (import it instead of copying numbers).

## Story state at 41.028 (chorus downbeat; vocal 来 held to 41.6) — as rendered
- 40.536 (来 onset) Ricky stands on 来's long horizontal (stroke 3) and holds a sustain, neck UP: rising sound-wave rings =
  an UPDRAFT (the rings follow Ricky). 40.609 (beat 95) Charlie pops the hat canopy and is lifted; Ricky hangs from Charlie's
  RIGHT boot by his strap, still playing (`ricky_dangle_play`); Jade drops from 来's top stroke and grabs Charlie's LEFT boot
  (grab 40.89-40.96, `jade_dangle`). At 41.0 (last Act I frame) all three ride the updraft up past the top of 来.
- Last Act I frame (41.0), 320x180 screen px, y up from the bottom edge: Charlie's anchor (211, 75); Jade's fist on his LEFT boot
  (194, 78), Ricky's strap on his RIGHT boot (225, 78) (charlie_parachute_carry `boots` points). Rising ~132 px/s and accelerating, drifting right ~30 px/s. Canopy open.
- Look: VOID (black, blueprint grid minor 8 / major 32), wireframe cube gizmos, missing-texture squares, the rainbow 未来
  below/behind them (fully drawn). Subtitle (translation only, "colored pencils draw the future") in the TOP slot.
- HUD: Jade portrait hair DOWN (default). Active-hero highlight on RICKY (guitar slot) from 40.50. LOC = locAt(t) (111 at 41.0).
- The Eraser is NOT in frame (it stays at the page edge since 34.30, peering into the void).
## Act II should
- Start with the party arriving under the parachute among floating pages (spec 41.03), canopy still open; continue the
  rise/drift from the HANDOFF positions, or cut on 41.028 if the framing differs.
- Keep Jade hair DOWN while the pencils are in hand. If she puts them back in the bun, pass `hud.set({ jadeHair: 'up' })`
  for that window (the HUD defaults to hair DOWN now).

## Act II side (Act II team, 2026-10-15) — what chorus.js does at 41.028
- **v6 (synced to the FINAL Act I state above):** Act II continues the last Act I frame: Charlie's anchor and both grips at the HANDOFF screen points, still rising 132 px/s + drifting 30 px/s for 0.12 s with the camera held, then easing into the page-sky framing by 41.4-41.7 (verified by canopy bbox per frame 40.97-41.5: x 210,210,211,212,213,214,214,213... no jitter; the camera follows the chute from 41.15 and settles by 41.75; Act I's rainbow 来 drops out of frame below them by 41.38).
  framing never has to match. Continuity is by state, not pixels: Charlie under the canopy (`charlie_parachute_carry`,
  boots at world (-835, 214) at 41.028), **Jade on the LEFT boot** (`jade_dangle`, hair DOWN, pencils in hand), **Ricky on
  the RIGHT boot** (`ricky_dangle_play`, holding the updraft note, waves rising), rising + drifting right. Same formation
  as your HANDOFF above. HUD: active = Ricky at 41.028 (matches), Jade portrait hair down, LOC = locAt(t).
- 41.25 Jade lets go onto her page (lands beat 97, 41.446); 41.70 Ricky lets go (lands 41.864); Charlie lands 42.282.
- If you end with the trio in a very different place (e.g. canopy closed), tell me here and I'll adapt the first 0.25 s.
